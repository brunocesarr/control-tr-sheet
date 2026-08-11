import { beforeEach, describe, expect, it, vi } from 'vitest';

const SECRET = 'a'.repeat(48);

async function loadModule() {
  vi.resetModules();
  return import('@/helpers/jwt');
}

/**
 * Splits a compact JWS into its three definite parts.
 *
 * Destructuring `token.split('.')` yields `string | undefined` under
 * noUncheckedIndexedAccess, which Buffer.from rejects. Asserting the shape
 * here is better than casting: a malformed token now fails with a clear
 * message instead of a confusing downstream error.
 */
function splitJwt(token: string): { header: string; payload: string; signature: string } {
  const parts = token.split('.');
  expect(parts).toHaveLength(3);

  const [header, payload, signature] = parts;
  if (!header || !payload || !signature) {
    throw new Error(`Malformed JWT: "${token}"`);
  }

  return { header, payload, signature };
}

describe('session token', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', SECRET);
    vi.stubEnv('SESSION_TTL_SECONDS', '3600');
  });

  it('round-trips claims through sign + verify', async () => {
    const { signSessionToken, verifySessionToken } = await loadModule();

    const { token } = await signSessionToken({
      userId: 'user-1',
      sessionId: 'session-1',
      isAdmin: true,
    });

    const claims = await verifySessionToken(token);
    expect(claims?.sub).toBe('user-1');
    expect(claims?.isAdmin).toBe(true);
  });

  it('rejects a tampered payload', async () => {
    const { signSessionToken, verifySessionToken } = await loadModule();
    const { token } = await signSessionToken({
      userId: 'user-1',
      sessionId: 'session-1',
      isAdmin: false,
    });

    const { header, payload, signature } = splitJwt(token);

    const forged = JSON.parse(Buffer.from(payload, 'base64url').toString());
    forged.isAdmin = true; // the exact attack the old jwt-decode path allowed
    const forgedPayload = Buffer.from(JSON.stringify(forged)).toString('base64url');

    expect(await verifySessionToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const { signSessionToken } = await loadModule();
    const { token } = await signSessionToken({
      userId: 'user-1',
      sessionId: 'session-1',
      isAdmin: true,
    });

    vi.stubEnv('JWT_SECRET', 'b'.repeat(48));
    const { verifySessionToken } = await loadModule();
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('rejects an empty or malformed token', async () => {
    const { verifySessionToken } = await loadModule();
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
    expect(await verifySessionToken('not.a.jwt')).toBeNull();
  });

  it('throws when JWT_SECRET is too short', async () => {
    vi.stubEnv('JWT_SECRET', 'short');
    const { signSessionToken } = await loadModule();
    await expect(signSessionToken({ userId: 'u', sessionId: 's', isAdmin: false })).rejects.toThrow(
      /at least 32 characters/
    );
  });
});
