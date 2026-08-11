import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/configs/local-storage-keys';
import { verifySessionToken } from '@/helpers/jwt';

/**
 * Edge middleware. Runs jose HS256 verification, so a tampered or unsigned
 * token is rejected here rather than trusted downstream. Admin gating also
 * happens here, which removes the dashboard flash non-admins used to see.
 */

const AUTHENTICATED_ROUTES = ['/home', '/profile'] as const;
const ADMIN_ONLY_ROUTES = ['/home'] as const;
const GUEST_ONLY_ROUTES = ['/login', '/register', '/recover'] as const;

const matches = (pathname: string, routes: readonly string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const claims = await verifySessionToken(token);
  const isApiRoute = pathname.startsWith('/api/v1');

  // The session endpoint is how you GET a session — it must stay open.
  if (pathname.startsWith('/api/v1/auth/session')) {
    return NextResponse.next();
  }

  if (isApiRoute) {
    if (!claims) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // Route handlers still re-check with requireAdmin() — defence in depth.
    return NextResponse.next();
  }

  // Completing a password reset must work even with a live session.
  const isRecoveryConfirm = pathname.startsWith('/recover/confirm');

  if (claims && matches(pathname, GUEST_ONLY_ROUTES) && !isRecoveryConfirm) {
    return NextResponse.redirect(new URL(claims.isAdmin ? '/home' : '/profile', request.url));
  }

  if (matches(pathname, AUTHENTICATED_ROUTES)) {
    if (!claims) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', `${pathname}${search}`);
      // Distinguishes "expired mid-session" from "never signed in".
      if (token) loginUrl.searchParams.set('reason', 'expired');

      const response = NextResponse.redirect(loginUrl);
      if (token) response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    if (matches(pathname, ADMIN_ONLY_ROUTES) && !claims.isAdmin) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/recover/:path*',
    '/home/:path*',
    '/profile/:path*',
    '/api/v1/:path*',
  ],
};
