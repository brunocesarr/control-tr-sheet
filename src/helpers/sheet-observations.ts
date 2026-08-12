/**
 * Shared observation rules. Imported by the client (character counter, dirty
 * check) AND the server (write sanitising), so the limit can never drift
 * between what the UI allows and what the sheet accepts.
 *
 * No 'server-only' here — that is deliberate and safe: this module has no
 * credentials, no env access, no google-spreadsheet import.
 */

/**
 * A Google Sheets cell tolerates 50 000 characters. 1 000 is a UI decision:
 * observations are one-line notes such as "Aguardando procuração", and the
 * table preview truncates well past that.
 */
export const MAX_OBSERVATION_LENGTH = 1000;

/** Soft threshold that turns the counter amber. */
export const OBSERVATION_WARN_AT = Math.floor(MAX_OBSERVATION_LENGTH * 0.9);

/**
 * Normalises whatever arrives into a storable string.
 *
 * CRLF → LF so a note pasted from Windows does not gain phantom characters,
 * then trim, then hard-truncate. Truncation is last so the cap applies to the
 * value actually written.
 */
export function normaliseObservation(value: unknown): string {
  if (value === null || value === undefined) return '';

  return String(value).replace(/\r\n/g, '\n').trim().slice(0, MAX_OBSERVATION_LENGTH);
}

/**
 * Row number out of an A1 reference, or null when malformed.
 *
 * Rejects row 1: that is the header row, and writing an observation over the
 * 'OBSERVAÇÕES' header itself would break HeaderResolver on the next read.
 */
export function rowNumberFromA1(reference: string): number | null {
  const match = /^[A-Z]{1,3}([1-9]\d{0,6})$/.exec(reference);

  // RegExpExecArray indexing is `string | undefined` under
  // noUncheckedIndexedAccess — bind the group before using it.
  const digits = match?.[1];
  if (!digits) return null;

  const rowNumber = Number(digits);
  return Number.isSafeInteger(rowNumber) && rowNumber > 1 ? rowNumber : null;
}

/** True when `next` differs from `current` once both are normalised. */
export function hasObservationChanged(current: string | undefined, next: string): boolean {
  return normaliseObservation(current) !== normaliseObservation(next);
}
