/**
 * @type {import('postcss-load-config').Config}
 *
 * `@tailwindcss/postcss` bundles Lightning CSS, which handles vendor prefixing
 * and nesting. autoprefixer was removed — running both double-processes
 * declarations and slows the build for no gain.
 */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
