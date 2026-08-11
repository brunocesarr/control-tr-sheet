import { clientEnv } from '@/configs/env.client';

/**
 * Cache / cookie key names, suffixed per environment so that a local dev
 * session can never be mistaken for a production one in the same browser.
 */
const suffix = clientEnv.environmentSuffix ? `_${clientEnv.environmentSuffix}` : '';

export class LocalStorageKeysCache {
  /** httpOnly session cookie set by POST /api/v1/auth/session. */
  static readonly AUTHENTICATION_SESSION_USER_TR_SHEET: string = `user_session${suffix}`;

  /** Cached sheet payload (non-sensitive, obfuscated only). */
  static readonly CACHE_SHEET_TR_DATA: string = `sheet_tr_data${suffix}`;

  /** Persisted table filter preferences. */
  static readonly SHEET_FILTER_PREFERENCES: string = `sheet_filter${suffix}`;
}

/**
 * The middleware runs in the Edge runtime and cannot import client env,
 * so it needs the raw name too. Keep this in sync with the class above.
 */
export const SESSION_COOKIE_NAME = LocalStorageKeysCache.AUTHENTICATION_SESSION_USER_TR_SHEET;
