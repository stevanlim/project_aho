import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { AuthService, PENDING_COOKIE_NAME, SESSION_COOKIE_NAME } from '$lib/server/auth/session.js';

export const load: PageServerLoad = async ({ cookies, locals }) => {
  if (locals.user) {
    throw redirect(303, locals.user.role === 'kasir' ? '/pos' : '/dashboard');
  }

  const pendingUserId = cookies.get(PENDING_COOKIE_NAME);
  if (!pendingUserId) {
    throw redirect(303, '/login');
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const pendingUserId = cookies.get(PENDING_COOKIE_NAME);
    if (!pendingUserId) {
      throw redirect(303, '/login');
    }

    const formData = await request.formData();
    const pin = formData.get('pin')?.toString() || '';

    const result = await AuthService.verifyStep2(Number(pendingUserId), pin);

    if (!result.success || !result.sessionId) {
      return fail(400, {
        error: result.error || 'PIN yang dimasukkan salah.'
      });
    }

    // Set authenticated session cookie (7 days)
    cookies.set(SESSION_COOKIE_NAME, result.sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // localhost dev
      maxAge: 60 * 60 * 24 * 7
    });

    // Delete pending cookie
    cookies.delete(PENDING_COOKIE_NAME, { path: '/' });

    const targetUrl = result.role === 'kasir' ? '/pos' : '/dashboard';
    throw redirect(303, targetUrl);
  }
};
