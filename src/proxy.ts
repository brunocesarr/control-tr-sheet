import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/configs/local-storage-keys';
import { verifySessionToken } from '@/helpers/jwt';

/**
 * Next.js 16 renamed `middleware.ts` → `proxy.ts` to signal that this is a
 * network boundary, not an Express-style pipeline. What changed for us:
 *
 *   • The export MUST be named `proxy` (or be the default export).
 *   • It runs on the NODE.JS runtime. Edge is unavailable here, and setting
 *     `runtime` in this file throws.
 *   • Node runtime means `jose` uses native crypto — no WebCrypto-only
 *     constraint, no Edge polyfills.
 *
 * Keep this thin: signature verification and redirects only. Route handlers
 * still call requireAdmin() independently (defence in depth).
 */

const AUTHENTICATED_ROUTES = ['/home', '/profile'] as const;
const ADMIN_ONLY_ROUTES = ['/home'] as const;
const GUEST_ONLY_ROUTES = ['/login', '/register', '/recover'] as const;

const matches = (pathname: string, routes: readonly string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const claims = await verifySessionToken(token);

  // The session endpoint is how a session is obtained — it must stay open.
  if (pathname.startsWith('/api/v1/auth/session')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/v1')) {
    if (!claims) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
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
