import { probeAppwrite } from '@/helpers/appwrite-health';
import { serverEnv } from '@/configs/env.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/v1/cron/keep-alive
 *
 * Scheduled heartbeat that keeps the Appwrite Cloud project out of the 7-day
 * inactivity pause. Hit by two independent schedulers:
 *
 *   1. GitHub Actions — every 3 days (PRIMARY), runs outside Vercel/Appwrite.
 *   2. Vercel Cron — daily (SECONDARY), covers GitHub disabling the schedule
 *      after 60 days of repo inactivity.
 *
 * Requires `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends this
 * automatically once CRON_SECRET is set as a project env var.
 */

/** Constant-time comparison — a plain !== on secrets leaks timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isAuthorised(request: Request): boolean {
  const header = request.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  return provided.length > 0 && safeEqual(provided, serverEnv.cronSecret);
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    // No detail — never hint at how close the supplied secret was.
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const appwrite = await probeAppwrite(10_000);

  /**
   * Fail the run when Appwrite is unreachable OR when the heartbeat cannot be
   * confirmed as activity. The second case is the important one: a 401 means
   * the ping happened but may not have reset the inactivity timer, so a silent
   * "success" would give false confidence for weeks.
   */
  const succeeded = appwrite.outcome === 'up' && appwrite.countsAsActivity;

  // Structured single-line log so Vercel logs and Action output stay greppable.
  console.info(`[cron/keep-alive] ${succeeded ? 'ok' : 'FAILED'} —`, JSON.stringify(appwrite));

  return Response.json(
    {
      status: succeeded ? 'ok' : 'failed',
      timestamp: new Date().toISOString(),
      appwrite,
      ...(succeeded
        ? {}
        : {
            action:
              appwrite.outcome === 'up'
                ? 'Appwrite is reachable but the ping was not authenticated. Set APPWRITE_API_KEY (scope: health.read).'
                : 'Appwrite is unreachable. Check https://status.appwrite.io and whether the project is paused.',
          }),
    },
    {
      // Non-2xx makes the GitHub Action step fail, which opens the notification
      // issue. Silence would defeat the entire purpose.
      status: succeeded ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
    }
  );
}
