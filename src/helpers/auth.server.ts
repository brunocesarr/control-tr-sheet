import 'server-only';

import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME } from '@/configs/local-storage-keys';
import { verifySessionToken, type SessionClaims } from '@/helpers/jwt';

export async function getSessionClaims(): Promise<SessionClaims | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ message }, { status });
}

/**
 * Route-handler guard. Returns claims on success, or a ready-to-return
 * Response on failure.
 *
 *   const guard = await requireAdmin();
 *   if (guard instanceof Response) return guard;
 *   // guard.sub, guard.isAdmin ...
 */
export async function requireAdmin(): Promise<SessionClaims | Response> {
  const claims = await getSessionClaims();
  if (!claims) return jsonError('Unauthorized', 401);
  if (!claims.isAdmin) return jsonError('Forbidden', 403);
  return claims;
}

export async function requireUser(): Promise<SessionClaims | Response> {
  const claims = await getSessionClaims();
  if (!claims) return jsonError('Unauthorized', 401);
  return claims;
}
