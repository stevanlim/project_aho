import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { AuthService, PENDING_COOKIE_NAME } from '$lib/server/auth/session.js';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(303, locals.user.role === 'kasir' ? '/pos' : '/dashboard');
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const username = formData.get('username')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    if (!username.trim() || !password) {
      return fail(400, {
        error: 'Username dan password wajib diisi.',
        username
      });
    }

    const result = await AuthService.verifyStep1(username, password);

    if (!result.success || !result.userId) {
      return fail(400, {
        error: result.error || 'Username atau password salah.',
        username
      });
    }

    // Set temporary pending cookie for PIN step (expires in 10 minutes)
    cookies.set(PENDING_COOKIE_NAME, String(result.userId), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // localhost dev
      maxAge: 60 * 10
    });

    throw redirect(303, '/login/pin');
  }
};
