import { cookies } from 'next/headers';

import { createScopedClient } from '@/configs/appwrite';
import { SESSION_COOKIE_NAME } from '@/configs/local-storage-keys';
import { jsonError } from '@/helpers/auth.server';
import { sessionCookieOptions, signSessionToken } from '@/helpers/jwt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/auth/session
 *
 * Exchanges a short-lived Appwrite JWT (minted in the browser via
 * `account.createJWT()`) for our own httpOnly session cookie.
 *
 * The critical step is `scoped.get()`: it asks Appwrite to validate the JWT
 * and hand back the authoritative user record. Labels therefore come from
 * Appwrite, never from client-supplied JSON — so `isAdmin` cannot be spoofed.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { jwt?: string } | null;
    const appwriteJwt = body?.jwt;

    if (!appwriteJwt || typeof appwriteJwt !== 'string') {
      return jsonError('Missing Appwrite JWT.', 400);
    }

    const scoped = createScopedClient(appwriteJwt);

    let user;
    try {
      user = await scoped.get();
    } catch {
      return jsonError('Invalid or expired Appwrite JWT.', 401);
    }

    const { token, expiresAt } = await signSessionToken({
      userId: user.$id,
      sessionId: appwriteJwt.slice(-24), // opaque correlation handle
      isAdmin: Array.isArray(user.labels) && user.labels.includes('admin'),
      email: user.email,
      name: user.name,
    });

    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt));

    return Response.json({
      user: {
        id: user.$id,
        name: user.name,
        email: user.email,
        labels: user.labels ?? [],
      },
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('[auth/session] POST failed', error);
    return jsonError('Could not establish session.', 500);
  }
}

/** DELETE /api/v1/auth/session — clears the httpOnly cookie on logout. */
export async function DELETE() {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return Response.json({ message: 'Session cleared.' });
}
