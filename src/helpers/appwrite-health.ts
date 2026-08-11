import 'server-only';

import { clientEnv } from '@/configs/env.client';
import { serverEnv } from '@/configs/env.server';

/**
 * Appwrite reachability probe shared by /api/v1/health and the keep-alive cron.
 *
 * ── Why a 401 does NOT mean "down" ──────────────────────────────────────────
 * Appwrite's Health API is a server-side API: it requires an API key sent as
 * `X-Appwrite-Key`. With only `X-Appwrite-Project` it correctly answers 401.
 *
 * A 401 still proves the service is healthy — DNS resolved, TLS completed,
 * Appwrite's router parsed the request and applied an auth policy. Only a
 * network failure, a timeout, or a 5xx indicates a real outage.
 *
 * ── Why the API key matters for the keep-alive ──────────────────────────────
 * Appwrite Cloud pauses free-tier projects after 7 days without activity, and
 * activity means API activity. A REJECTED request may well not count. To make
 * the heartbeat provably effective, set APPWRITE_API_KEY (scope: health.read)
 * so the probe performs an authenticated call that returns 200.
 *
 * Without the key this still reports health accurately; it just cannot
 * guarantee the inactivity timer was reset.
 */

export type ProbeOutcome = 'up' | 'degraded' | 'down';

export interface AppwriteProbe {
  outcome: ProbeOutcome;
  /** true only when outcome === 'up'. Convenience for JSON consumers. */
  ok: boolean;
  status: number | null;
  latencyMs: number;
  /** True when the request carried an API key and Appwrite accepted it. */
  authenticated: boolean;
  /**
   * True when we can be confident the inactivity timer was reset — i.e. an
   * authenticated 2xx. A 401 leaves this false by design.
   */
  countsAsActivity: boolean;
  error?: string;
  hint?: string;
}

const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * `/health/version` is the cheapest Health API endpoint: no database read, no
 * side effects, minimal rate-limit cost.
 */
const HEALTH_PATH = '/health/version';

export async function probeAppwrite(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<AppwriteProbe> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const apiKey = serverEnv.appwriteApiKey;

  const headers: Record<string, string> = {
    'X-Appwrite-Project': clientEnv.appwriteProjectId,
    Accept: 'application/json',
  };
  if (apiKey) headers['X-Appwrite-Key'] = apiKey;

  try {
    // GET, not HEAD: Appwrite does not reliably implement HEAD on API routes,
    // and the status code is what we care about either way.
    const response = await fetch(`${clientEnv.appwriteEndpoint}${HEALTH_PATH}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });

    const latencyMs = Date.now() - startedAt;
    const { status } = response;

    // 5xx is the only status that means Appwrite itself is unwell.
    if (status >= 500) {
      return {
        outcome: 'degraded',
        ok: false,
        status,
        latencyMs,
        authenticated: false,
        countsAsActivity: false,
        error: `Appwrite returned ${status}`,
      };
    }

    const authenticated = Boolean(apiKey) && response.ok;

    return {
      outcome: 'up',
      ok: true,
      status,
      latencyMs,
      authenticated,
      countsAsActivity: authenticated,
      hint:
        authenticated || status !== 401
          ? undefined
          : 'Set APPWRITE_API_KEY (scope: health.read) so the heartbeat is an authenticated call. ' +
            'A rejected request may not reset the inactivity timer.',
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const isTimeout = error instanceof Error && error.name === 'AbortError';

    return {
      outcome: 'down',
      ok: false,
      status: null,
      latencyMs,
      authenticated: false,
      countsAsActivity: false,
      error: isTimeout
        ? `Timed out after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : 'Unknown network error',
    };
  } finally {
    clearTimeout(timeout);
  }
}
