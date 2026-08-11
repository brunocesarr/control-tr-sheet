import 'server-only';

import { JWT } from 'google-auth-library';

import { serverEnv } from '@/configs/env.server';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * Lazily constructed so that a missing key throws at first use with a clear
 * message, instead of silently producing an auth client with `key: undefined`.
 */
let cached: JWT | null = null;

export function getSpreadSheetAccountAuth(): JWT {
  if (cached) return cached;

  cached = new JWT({
    email: serverEnv.googleServiceAccountEmail,
    key: serverEnv.googlePrivateKey,
    scopes: SCOPES,
  });

  return cached;
}
