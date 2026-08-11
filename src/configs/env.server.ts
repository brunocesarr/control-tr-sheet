/**
 * Server-only environment access.
 *
 * Importing this file from a 'use client' module throws at build time, which
 * makes the JWT_SECRET leak impossible to reintroduce by accident.
 */
import 'server-only';

import type { StatusWriteFormat } from '@/helpers/sheet-status';

class MissingEnvError extends Error {
  constructor(name: string, hint?: string) {
    super(
      `[env] Missing or invalid required environment variable: ${name}${hint ? ` — ${hint}` : ''}`
    );
    this.name = 'MissingEnvError';
  }
}

function required(name: string, hint?: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) throw new MissingEnvError(name, hint);
  return value.trim();
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Google service-account keys arrive with escaped newlines from most hosts. */
function normalisePrivateKey(raw: string): string {
  const key = raw.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
  if (!key.includes('BEGIN PRIVATE KEY')) {
    throw new MissingEnvError('GOOGLE_PRIVATE_KEY', 'does not look like a PEM private key');
  }
  return key;
}

export const serverEnv = {
  get jwtSecret(): string {
    const secret = required('JWT_SECRET', 'generate one with `openssl rand -base64 48`');
    if (secret.length < 32) {
      throw new MissingEnvError(
        'JWT_SECRET',
        `must be at least 32 characters (got ${secret.length})`
      );
    }
    return secret;
  },

  get sessionTtlSeconds(): number {
    return optionalNumber('SESSION_TTL_SECONDS', 60 * 60);
  },

  get googleSheetId(): string {
    return required('GOOGLE_SERVICE_SHEET_ID');
  },

  get googleServiceAccountEmail(): string {
    return required('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  },

  get googlePrivateKey(): string {
    return normalisePrivateKey(required('GOOGLE_PRIVATE_KEY'));
  },

  get googleSheetTabName(): string {
    return process.env.GOOGLE_SHEET_TAB_NAME?.trim() || "Lista de ITR's";
  },

  /** Labels written back when the STATUS column stores text, not a checkbox. */
  get sheetStatusLabels(): { done: string; pending: string } {
    return {
      done: process.env.GOOGLE_SHEET_STATUS_DONE?.trim() || 'ENTREGUE',
      pending: process.env.GOOGLE_SHEET_STATUS_PENDING?.trim() || 'NÃO ENTREGUE',
    };
  },

  /**
   * 'auto' (default) mirrors whatever the cell already contains.
   * Force 'boolean' or 'text' only if auto-detection guesses wrong.
   */
  get sheetStatusWriteMode(): StatusWriteFormat | 'auto' {
    const mode = process.env.GOOGLE_SHEET_STATUS_WRITE_MODE?.trim().toLowerCase();
    return mode === 'boolean' || mode === 'text' ? mode : 'auto';
  },

  /**
   * Shared secret for scheduled endpoints under /api/v1/cron/*.
   *
   * Vercel Cron sends this as `Authorization: Bearer <value>` automatically
   * once CRON_SECRET is set as a project env var. The GitHub Actions workflow
   * sends the same header from a repository secret.
   *
   * Minimum 16 characters — this is the only thing standing between a public
   * URL and unlimited invocations of your Appwrite rate limit.
   */
  get cronSecret(): string {
    const secret = required('CRON_SECRET', 'generate one with `openssl rand -hex 32`');
    if (secret.length < 16) {
      throw new MissingEnvError(
        'CRON_SECRET',
        `must be at least 16 characters (got ${secret.length})`
      );
    }
    return secret;
  },

  /**
   * Appwrite server API key, scope `health.read` only.
   *
   * OPTIONAL — omitting it leaves /api/v1/health working correctly, but the
   * keep-alive can no longer prove it reset the inactivity timer, because
   * Appwrite's Health API answers 401 without a key and a rejected request may
   * not count as activity.
   *
   * Never prefix with NEXT_PUBLIC_: this key is server-only.
   */
  get appwriteApiKey(): string | null {
    const key = process.env.APPWRITE_API_KEY?.trim();
    return key && key.length > 0 ? key : null;
  },
} as const;

/**
 * Call once from instrumentation so a misconfigured deploy fails on boot
 * rather than on the first user request.
 */
export function assertServerEnv(): void {
  void serverEnv.jwtSecret;
  void serverEnv.cronSecret;
  void serverEnv.appwriteApiKey;
  void serverEnv.googleSheetId;
  void serverEnv.googleServiceAccountEmail;
  void serverEnv.googlePrivateKey;
}
