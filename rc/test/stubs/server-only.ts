/**
 * Test-environment stub for the `server-only` package.
 *
 * The real package resolves to a module that unconditionally throws:
 *
 *   throw new Error(
 *     'This module cannot be imported from a Client Component module. ' +
 *     'It should only be used from a Server Component.'
 *   );
 *
 * It only stays quiet when the bundler resolves it under the `react-server`
 * export condition, which Next.js sets during a server build. Vitest does not
 * set that condition, so importing any server-only module (helpers/jwt.ts,
 * configs/env.server.ts, repositories/google.repository.ts) crashes the suite.
 *
 * Aliasing to this empty module lets those files be unit-tested directly.
 *
 * ⚠️ Trade-off: the server/client boundary is NO LONGER enforced inside tests.
 * That guarantee still holds where it matters — `next build` fails if a
 * 'use client' module reaches a server-only import — and the no-restricted-syntax
 * rule in eslint.config.mjs independently blocks reading JWT_SECRET outside
 * env.server.ts.
 */
export {};
