import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { LocalStorageKeysCache } from './configs/local-storage-keys';
import { isTokenExpired } from '@/helpers/validators';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname == '/') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  const protectedRoutes = ['/home', '/profile'];
  const basePathApi = '/api/v1';
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      route.includes(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith(basePathApi)
  );

  if (isProtectedRoute) {
    const cookie = await cookies();
    const token = cookie.get(LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET);
    if (isTokenExpired(token?.value)) return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/v1/:path*', '/home/:path*', '/profile/:path*', '/'],
};
