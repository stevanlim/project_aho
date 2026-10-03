import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { AuthService, SESSION_COOKIE_NAME } from '$lib/server/auth/session.js';

export const handle: Handle = async ({ event, resolve }) => {
  let sessionId = event.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionId) {
    const authHeader = event.request.headers.get('Authorization') || event.request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.substring(7).trim();
    }
  }

  if (sessionId) {
    const session = await AuthService.validateSession(sessionId);
    if (session) {
      event.locals.user = {
        id: session.user_id,
        username: session.username,
        name: session.name,
        role: session.role
      };
    } else {
      event.locals.user = null;
      // Delete invalid/expired cookie
      event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
    }
  } else {
    event.locals.user = null;
  }

  const { pathname } = event.url;

  // Static assets and uploads
  if (
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return resolve(event);
  }

  // Auth routes (/login, /login/pin, and /api/auth)
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    if (event.locals.user && pathname.startsWith('/login')) {
      throw redirect(303, event.locals.user.role === 'kasir' ? '/pos' : '/dashboard');
    }
    return resolve(event);
  }

  // Logout route
  if (pathname === '/logout') {
    return resolve(event);
  }

  // Protected routes: redirect unauthenticated users to /login
  if (!event.locals.user) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Silakan login terlebih dahulu.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw redirect(303, '/login');
  }

  // Role-based access control: restrict kasir from admin-only pages (including dashboard)
  if (event.locals.user.role === 'kasir') {
    const adminOnlyRoutes = [
      '/dashboard',
      '/products',
      '/stock',
      '/settings',
    ];

    // Block kasir from admin-only routes
    const isAdminRoute = adminOnlyRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
    // Allow /reports/sales (mutasi pendapatan) but block /reports (laporan keuangan)
    const isBlockedReport = pathname === '/reports' || (pathname.startsWith('/reports') && !pathname.startsWith('/reports/sales'));

    if (isAdminRoute || isBlockedReport) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Akses ditolak. Anda tidak memiliki izin untuk fitur ini.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw redirect(303, '/pos');
    }
  }

  // Redirect root / to role-appropriate home (/pos for kasir, /dashboard for admin)
  if (pathname === '/') {
    throw redirect(303, event.locals.user.role === 'kasir' ? '/pos' : '/dashboard');
  }

  return resolve(event);
};
