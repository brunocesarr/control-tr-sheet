import pluginQuery from '@tanstack/eslint-plugin-query';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

/**
 * ESLint 9 flat config for Next.js 16.
 *
 * `next lint` and the `eslint` key in next.config.ts were removed in Next 16,
 * so ESLint runs directly via `pnpm lint`.
 *
 * IMPORTANT: `eslint-config-next/core-web-vitals` does NOT register the
 * @typescript-eslint plugin. Referencing a rule from a plugin that is not
 * loaded in scope fails hard with:
 *
 *   A configuration object specifies rule "@typescript-eslint/no-unused-vars",
 *   but could not find plugin "@typescript-eslint".
 *
 * `eslint-config-next/typescript` supplies the parser and plugin (and already
 * enables no-unused-vars). `typescript-eslint` is also imported explicitly so
 * the custom block below has a guaranteed plugin reference regardless of how
 * the Next preset is packaged internally.
 *
 * eslint-plugin-tailwindcss is deliberately absent — no stable Tailwind v4
 * support. Class ordering is handled by prettier-plugin-tailwindcss.
 *
 * Prettier formatting options live ONLY in .prettierrc.json.
 */
export default defineConfig([
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'node_modules/**',
  ]),

  // Order matters: presets first, then overrides.
  ...nextVitals,
  ...nextTs,
  ...pluginQuery.configs['flat/recommended'],

  // Last, so it can switch off stylistic rules that conflict with Prettier.
  prettierRecommended,

  {
    name: 'control-tr-sheet/typescript-rules',
    files: ['**/*.{ts,tsx,mts,cts}'],
    // Declaring the plugin here makes the rules below valid even if the Next
    // preset changes how it exposes them.
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',

      // Errors on unused vars, but allows the _prefix escape hatch used in
      // test callbacks like it.each(([_label, password]) => …).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  {
    name: 'control-tr-sheet/project-rules',
    rules: {
      // Guards the exact mistake this repo already shipped once: reading a
      // server secret from a module that can reach the client bundle.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env'][property.name='JWT_SECRET']",
          message:
            'Read JWT_SECRET only through serverEnv in src/configs/env.server.ts (server-only).',
        },
      ],

      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  {
    // Server modules legitimately read process.env and log freely.
    name: 'control-tr-sheet/server-overrides',
    files: ['src/configs/env.server.ts', 'src/instrumentation.ts', 'src/proxy.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      'no-console': 'off',
    },
  },

  {
    name: 'control-tr-sheet/tests',
    files: ['src/**/__tests__/**/*.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
      'no-console': 'off',
    },
  },
]);
