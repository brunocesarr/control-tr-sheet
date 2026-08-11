import path from 'node:path';

import { defineConfig } from 'vitest/config';

// import.meta.dirname requires Node >= 20.11 (see package.json#engines).
const rootDir = import.meta.dirname;

/**
 * Neutralises `server-only` (and `client-only`) inside the test runner.
 *
 * The real `server-only` package resolves to a module that unconditionally
 * throws:
 *
 *   throw new Error(
 *     'This module cannot be imported from a Client Component module. ' +
 *     'It should only be used from a Server Component.'
 *   );
 *
 * It stays quiet only when the bundler resolves it under the `react-server`
 * export condition, which Next.js sets during a server build and Vitest does
 * not. Any server-only module — helpers/jwt.ts, configs/env.server.ts,
 * repositories/google.repository.ts — therefore crashes on import.
 *
 * A VIRTUAL module is used instead of a stub file on disk: no path to typo, no
 * file to forget to create, nothing extra to exclude from coverage.
 *
 * NOTE: the return type is inferred structurally rather than annotated with
 * `Plugin` from 'vite'. `vite` is only a TRANSITIVE dependency (via vitest),
 * and pnpm's strict linking correctly refuses to resolve it — importing it here
 * produced "TS2307: Cannot find module 'vite'". Vite accepts any object of this
 * shape, so the annotation was never needed.
 *
 * ⚠️ Trade-off: the server/client boundary is not enforced inside tests. That
 * guarantee still holds where it counts — `next build` fails if a 'use client'
 * module transitively imports a server-only one — and the no-restricted-syntax
 * rule in eslint.config.mjs independently blocks reading JWT_SECRET anywhere
 * outside configs/env.server.ts.
 */
function stubServerOnlyModules() {
  const STUBBED = new Set(['server-only', 'client-only']);
  // Leading \0 is the Rollup/Vite convention for virtual ids, so other plugins
  // and the filesystem resolver skip them.
  const VIRTUAL_PREFIX = '\0virtual:stub/';

  return {
    name: 'control-tr-sheet:stub-server-only',
    // `as const` keeps this a literal type. Without the `Plugin` annotation a
    // bare 'pre' would widen to `string`, which is not assignable to
    // `'pre' | 'post' | undefined`.
    enforce: 'pre' as const,

    resolveId(source: string): string | null {
      return STUBBED.has(source) ? `${VIRTUAL_PREFIX}${source}` : null;
    },

    load(id: string): string | null {
      return id.startsWith(VIRTUAL_PREFIX) ? 'export {};' : null;
    },
  };
}

export default defineConfig({
  plugins: [stubServerOnlyModules()],

  resolve: {
    /**
     * Array form with an anchored regex, NOT the object form.
     *
     * Object-form string keys match as PREFIXES, so `'@'` would also capture
     * '@tanstack/react-query' and rewrite it to '<root>/srctanstack/react-query'.
     * Matching /^@\// touches only '@/…' specifiers, exactly mirroring the
     * `@/*` path in tsconfig.json.
     */
    alias: [{ find: /^@\//, replacement: `${path.resolve(rootDir, 'src')}/` }],
  },

  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/helpers/**', 'src/services/**'],
      exclude: ['src/**/__tests__/**'],
    },
  },
});
