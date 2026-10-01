import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';
import { AuthService, SESSION_COOKIE_NAME, PENDING_COOKIE_NAME } from '$lib/server/auth/session.js';

export const load: PageServerLoad = async ({ cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (sessionId) {
    await AuthService.destroySession(sessionId);
    cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  }
  cookies.delete(PENDING_COOKIE_NAME, { path: '/' });

  throw redirect(303, '/login');
};
