import type { NextConfig } from 'next';

/**
 * ⚠️ SECURITY — DO NOT REINTRODUCE THE `env` KEY.
 *
 * This file previously contained:
 *
 *   const { JWT_SECRET } = process.env;
 *   const nextConfig: NextConfig = { env: { JWT_SECRET } };
 *
 * `env` inlines values into the CLIENT bundle at build time, so the signing
 * secret was shipped to every browser. Token minting now happens server-side
 * in POST /api/v1/auth/session, which reads process.env at runtime.
 *
 * Server secrets are reachable only from modules that `import 'server-only'`
 * (src/configs/env.server.ts). Anything the browser needs must be prefixed
 * NEXT_PUBLIC_. CI greps .next/static to enforce this — see ci.yml.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    // Only local assets are served (public/img/login-img.jpg), so no
    // remotePatterns are needed. `images.domains` is deprecated in 16 anyway.
    formats: ['image/avif', 'image/webp'],
  },

  // Internal tool — no need to advertise the framework.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Belt and braces: sheet data must never sit in a shared proxy cache.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
