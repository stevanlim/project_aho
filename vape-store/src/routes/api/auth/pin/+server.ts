import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { AuthService, PENDING_COOKIE_NAME, SESSION_COOKIE_NAME } from '$lib/server/auth/session.js';
import { UserRepo } from '$lib/server/repositories/user.repo.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    let pin = '';
    let userIdStr = cookies.get(PENDING_COOKIE_NAME);

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      pin = body.pin || '';
      if (!userIdStr && body.userId) {
        userIdStr = String(body.userId);
      }
    } else {
      const formData = await request.formData();
      pin = formData.get('pin')?.toString() || '';
    }

    if (!pin || pin.trim().length !== 6) {
      return json({ success: false, error: 'PIN harus 6 digit angka.' }, { status: 400 });
    }

    const userId = Number(userIdStr);
    if (!userId || isNaN(userId)) {
      return json({ success: false, error: 'Sesi login tidak valid atau kadaluarsa. Silakan login kembali.' }, { status: 400 });
    }

    const result = await AuthService.verifyStep2(userId, pin.trim());
    if (!result.success || !result.sessionId) {
      return json({ success: false, error: result.error || 'PIN yang dimasukkan salah.' }, { status: 400 });
    }

    // Set session cookie
    cookies.set(SESSION_COOKIE_NAME, result.sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Delete pending cookie
    cookies.delete(PENDING_COOKIE_NAME, { path: '/' });

    const user = await UserRepo.findById(userId);

    return json({
      success: true,
      token: result.sessionId,
      user: user ? {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      } : null
    });
  } catch (err: any) {
    console.error('API /api/auth/pin error:', err);
    return json({ success: false, error: err.message || 'Verifikasi PIN gagal.' }, { status: 500 });
  }
};
