import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { AuthService, SESSION_COOKIE_NAME, PENDING_COOKIE_NAME } from '$lib/server/auth/session.js';

export const GET: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (sessionId) {
    await AuthService.destroySession(sessionId);
    cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  }
  cookies.delete(PENDING_COOKIE_NAME, { path: '/' });

  throw redirect(303, '/login');
};

export const POST: RequestHandler = async ({ cookies }) => {
  const sessionId = cookies.get(SESSION_COOKIE_NAME);
  if (sessionId) {
    await AuthService.destroySession(sessionId);
    cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  }
  cookies.delete(PENDING_COOKIE_NAME, { path: '/' });

  throw redirect(303, '/login');
};
