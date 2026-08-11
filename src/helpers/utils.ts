/**
 * General-purpose helpers.
 *
 * NOTE: `generateJWT` used to live here and was called from a client
 * component, where `process.env.JWT_SECRET` is undefined — every token was
 * signed with ''. Token minting now lives in `helpers/jwt.ts` (server-only)
 * and is reached exclusively through POST /api/v1/auth/session.
 */

/** Brazilian CPF: 000.000.000-00 */
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Strips punctuation so "123.456.789-00" and "12345678900" both match. */
export function onlyDigits(value: string | undefined | null): string {
  return (value ?? '').replace(/\D/g, '');
}

export function onlyAlphanumeric(value: string | undefined | null): string {
  return (value ?? '').replace(/[^a-zA-Z0-9]/g, '');
}

/** Accent- and case-insensitive comparison for keyword search. */
export function normaliseText(value: string | undefined | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function pluralise(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries a promise with exponential backoff — used for Sheets API calls. */
export async function withRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, baseDelayMs = 400 } = {}
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await delay(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError;
}
