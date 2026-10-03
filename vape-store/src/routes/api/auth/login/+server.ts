import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { AuthService, PENDING_COOKIE_NAME } from '$lib/server/auth/session.js';

export const POST: RequestHandler = async ({ request, cookies }) => {
  try {
    let username = '';
    let password = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      username = body.username || '';
      password = body.password || '';
    } else {
      const formData = await request.formData();
      username = formData.get('username')?.toString() || '';
      password = formData.get('password')?.toString() || '';
    }

    if (!username.trim() || !password) {
      return json({ success: false, error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const result = await AuthService.verifyStep1(username.trim(), password);
    if (!result.success || !result.userId) {
      return json({ success: false, error: result.error || 'Username atau password salah.' }, { status: 400 });
    }

    // Set pending cookie
    cookies.set(PENDING_COOKIE_NAME, String(result.userId), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 10
    });

    return json({
      success: true,
      userId: result.userId,
      message: 'Silakan masukkan PIN'
    });
  } catch (err: any) {
    console.error('API /api/auth/login error:', err);
    return json({ success: false, error: err.message || 'Login gagal.' }, { status: 500 });
  }
};
