/**
 * Session token signing + verification using `jose`.
 *
 * Why jose and not jwt-simple / jwt-decode:
 *   • jose runs in the Edge runtime, so middleware can verify signatures.
 *   • jwt-decode does NOT verify — it only base64-decodes. Trusting its
 *     output for authorisation lets anyone forge `isAdmin: true`.
 *
 * This module is server-only. The browser never sees the secret and never
 * needs to read the token (the cookie is httpOnly).
 */
import 'server-only';

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import { serverEnv } from '@/configs/env.server';

const ISSUER = 'control-tr-sheet';
const AUDIENCE = 'control-tr-sheet:web';
const ALGORITHM = 'HS256';

export interface SessionClaims extends JWTPayload {
  /** Appwrite user $id. */
  sub: string;
  /** Appwrite session id, so we can invalidate server-side if needed. */
  sessionId: string;
  isAdmin: boolean;
  email?: string;
  name?: string;
}

let cachedKey: Uint8Array | null = null;
function secretKey(): Uint8Array {
  if (!cachedKey) cachedKey = new TextEncoder().encode(serverEnv.jwtSecret);
  return cachedKey;
}

export async function signSessionToken(input: {
  userId: string;
  sessionId: string;
  isAdmin: boolean;
  email?: string;
  name?: string;
}): Promise<{ token: string; expiresAt: Date }> {
  const ttl = serverEnv.sessionTtlSeconds;
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ttl;

  const token = await new SignJWT({
    sessionId: input.sessionId,
    isAdmin: input.isAdmin,
    email: input.email,
    name: input.name,
  })
    .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
    .setSubject(input.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .sign(secretKey());

  return { token, expiresAt: new Date(expiresAt * 1000) };
}

/**
 * Verifies signature, issuer, audience and expiry.
 * Returns null on ANY failure — callers must treat null as unauthenticated.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionClaims | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: [ALGORITHM], // pin the alg — blocks `alg: none` downgrades
      issuer: ISSUER,
      audience: AUDIENCE,
      clockTolerance: 5,
    });

    if (typeof payload.sub !== 'string' || typeof payload.sessionId !== 'string') {
      return null;
    }

    return {
      ...payload,
      sub: payload.sub,
      sessionId: payload.sessionId,
      isAdmin: payload.isAdmin === true,
    } as SessionClaims;
  } catch {
    // Expired, tampered, wrong secret, malformed — all identical to us.
    return null;
  }
}

export const sessionCookieOptions = (expiresAt: Date) =>
  ({
    httpOnly: true, // ← unreadable by any script on the page
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  }) satisfies Partial<Record<string, unknown>>;
