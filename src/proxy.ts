import { NextResponse, type NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/configs/local-storage-keys';
import { verifySessionToken } from '@/helpers/jwt';

/**
 * Next.js 16 renamed `middleware.ts` → `proxy.ts` to signal that this is a
 * network boundary, not an Express-style pipeline. What that changed for us:
 *
 *   • The export MUST be named `proxy` (or be the default export).
 *   • It runs on the NODE.JS runtime. Edge is unavailable here, and setting
 *     `runtime` in this file throws.
 *   • Node runtime means `jose` uses native crypto — no WebCrypto-only
 *     constraint and no Edge polyfills.
 *
 * Keep this thin: signature verification and redirects only. Route handlers
 * still call requireAdmin() independently (defence in depth).
 */

/** Require a valid session. */
const AUTHENTICATED_ROUTES = ['/home', '/profile'] as const;

/** Require a valid session AND the `admin` label. */
const ADMIN_ONLY_ROUTES = ['/home'] as const;

/** Redirect away if already signed in. */
const GUEST_ONLY_ROUTES = ['/login', '/register', '/recover'] as const;

/**
 * API routes that must bypass session verification entirely.
 *
 *   • /api/v1/auth/session — this is HOW a session is obtained. Gating it
 *     behind a session would be circular.
 *
 *   • /api/v1/health — must answer even when Appwrite or the auth layer is
 *     degraded, otherwise the probe cannot report the outage it exists to
 *     detect. Returns only liveness booleans, no data.
 *
 *   • /api/v1/cron/* — authenticated by CRON_SECRET via the Authorization
 *     header, not by a user session. A scheduler has no cookie, and the
 *     Appwrite keep-alive specifically has to work when the project is
 *     paused — i.e. exactly when no session can be created.
 *
 * These are checked BEFORE token verification: it is wasted crypto on traffic
 * that will never use a session, and health polling is the most frequent
 * request this app serves.
 */
const PUBLIC_API_ROUTES = ['/api/v1/auth/session', '/api/v1/health', '/api/v1/cron'] as const;

/** Exact match, or a path segment beneath the route (never a bare prefix). */
const matches = (pathname: string, routes: readonly string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── 1. Public API routes — short-circuit before any token work ──────────
  if (matches(pathname, PUBLIC_API_ROUTES)) {
    return NextResponse.next();
  }

  // ── 2. Root redirect ────────────────────────────────────────────────────
  // Non-admins are bounced onward to /profile by the admin gate below.
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // ── 3. Verify the session cookie ────────────────────────────────────────
  // verifySessionToken checks the HS256 signature, issuer, audience and expiry,
  // and pins the algorithm. It returns null on ANY failure, so a tampered or
  // unsigned token is indistinguishable from no token at all. This is the fix
  // for the original jwt-decode implementation, which only base64-decoded and
  // therefore trusted a forgeable `isAdmin` claim.
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const claims = await verifySessionToken(token);

  // ── 4. Protected API routes ─────────────────────────────────────────────
  if (pathname.startsWith('/api/v1')) {
    if (!claims) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // Authorisation (the admin check) stays in the route handlers via
    // requireAdmin(), so a proxy misconfiguration alone cannot expose data.
    return NextResponse.next();
  }

  // ── 5. Guest-only pages ─────────────────────────────────────────────────
  // /recover/confirm is excluded: completing a password reset must work even
  // with a live session, e.g. when a user resets from a second device.
  const isRecoveryConfirm = pathname.startsWith('/recover/confirm');

  if (claims && matches(pathname, GUEST_ONLY_ROUTES) && !isRecoveryConfirm) {
    return NextResponse.redirect(new URL(claims.isAdmin ? '/home' : '/profile', request.url));
  }

  // ── 6. Authenticated pages ──────────────────────────────────────────────
  if (matches(pathname, AUTHENTICATED_ROUTES)) {
    if (!claims) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', `${pathname}${search}`);
      // A token that was present but failed verification means the session
      // expired mid-use, which the login page surfaces as a banner. Its absence
      // means the user simply was not signed in.
      if (token) loginUrl.searchParams.set('reason', 'expired');

      const response = NextResponse.redirect(loginUrl);
      // Clear the stale or forged cookie so the redirect cannot loop.
      if (token) response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // Admin gating happens here rather than in a useEffect on the page, which
    // is what removed the flash of dashboard content non-admins used to see.
    if (matches(pathname, ADMIN_ONLY_ROUTES) && !claims.isAdmin) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Only these paths invoke the proxy. Everything else — static assets,
   * _next/*, favicon — skips it entirely.
   *
   * /api/v1/:path* is matched broadly and the public routes are filtered inside
   * the function. A negative-lookahead matcher could exclude them here, but the
   * regex becomes unreadable and easy to break silently; an explicit allowlist
   * in code is far easier to audit.
   */
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
