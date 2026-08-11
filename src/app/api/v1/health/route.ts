import { probeAppwrite } from '@/helpers/appwrite-health';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/health — public liveness probe.
 *
 * Deliberately unauthenticated and excluded from the proxy.ts matcher: it must
 * answer even when Appwrite is paused or the auth layer is broken, since
 * reporting that outage is the whole point.
 *
 * Leaks nothing beyond liveness booleans and latency.
 *
 * NOTE: a 401 from Appwrite is reported as UP, not degraded. Appwrite's Health
 * API requires an API key, so 401 is the expected answer without one — and it
 * still proves the service responded. An earlier revision treated 401 as a
 * failure, which produced a false "degraded" reading.
 */
export async function GET() {
  const appwrite = await probeAppwrite();

  // 503 only for a genuine outage, so uptime monitors do not alert on a 401.
  const httpStatus = appwrite.outcome === 'up' ? 200 : 503;

  return Response.json(
    {
      status: appwrite.outcome === 'up' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        app: { ok: true },
        appwrite,
      },
    },
    {
      status: httpStatus,
      headers: {
        // Must never be cached, or the probe stops reaching Appwrite and
        // silently defeats its own purpose.
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    }
  );
}

/** Body-less variant for uptime monitors. */
export async function HEAD() {
  const appwrite = await probeAppwrite();
  return new Response(null, {
    status: appwrite.outcome === 'up' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
  });
}
