/**
 * Pure input validators — safe on both client and server.
 *
 * `isTokenExpired` / `isAdminToken` were REMOVED. They used `jwt-decode`,
 * which does not verify signatures, so they were unsafe for authorisation.
 * Use `verifySessionToken` from `@/helpers/jwt` instead (server-only).
 */

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&])[A-Za-z\d@.#$!%*?&]{8,16}$/;

/** Accents, apostrophes and hyphens are common in Brazilian names. */
const NAME_REGEX = /^[A-Za-zÀ-ÿ' -]{2,60}$/;

export function validateEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export function validatePassword(password: string | undefined | null): boolean {
  if (!password) return false;
  return PASSWORD_REGEX.test(password);
}

export function validateName(name: string | undefined | null): boolean {
  if (!name) return false;
  return NAME_REGEX.test(name.trim());
}

export interface PasswordRule {
  label: string;
  satisfied: boolean;
}

/** Drives the live checklist on the register page. */
export function describePasswordRules(password: string): PasswordRule[] {
  return [
    { label: '8 a 16 caracteres', satisfied: password.length >= 8 && password.length <= 16 },
    { label: 'Uma letra minúscula', satisfied: /[a-z]/.test(password) },
    { label: 'Uma letra maiúscula', satisfied: /[A-Z]/.test(password) },
    { label: 'Um número', satisfied: /\d/.test(password) },
    { label: 'Um caractere especial (@ . # $ ! % * ? &)', satisfied: /[@.#$!%*?&]/.test(password) },
  ];
}

// ── Documents: CPF & CNPJ ───────────────────────────────────────────────────

export type DocumentType = 'cpf' | 'cnpj' | 'unknown';

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

/**
 * Uppercases and strips formatting.
 *
 * Uppercase matters: the alphanumeric CNPJ spec defines only capital letters,
 * and 'a' (ASCII 97) would yield 49 under the conversion below instead of 17.
 */
export function normaliseDocument(value: string | undefined | null): string {
  return (value ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

/**
 * Receita Federal's conversion for the alphanumeric CNPJ: ASCII code − 48.
 *   '0'–'9' → 0–9   (48−48 … 57−48)
 *   'A'–'Z' → 17–42 (65−48 … 90−48)
 *
 * Legacy all-numeric CNPJs are unaffected, which is precisely why the spec
 * chose this mapping — one algorithm serves both generations.
 */
function characterValue(character: string): number {
  return character.charCodeAt(0) - 48;
}

/**
 * Modulo 11 over a partial document, weighting right-to-left with 2…9 cycling.
 *
 * Equivalent to the usual hardcoded weight arrays ([5,4,3,2,9,8,7,6,5,4,3,2]
 * and [6,5,4,3,2,9,8,7,6,5,4,3,2]) but derives them, so they cannot drift and
 * no bounds-checked array indexing is needed.
 */
function moduloElevenCheckDigit(partial: string): number {
  let sum = 0;
  let weight = 2;

  for (let index = partial.length - 1; index >= 0; index -= 1) {
    sum += characterValue(partial.charAt(index)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/** CPF check-digit validation — catches typos the regex cannot. */
export function validateCpf(cpf: string | undefined | null): boolean {
  const digits = (cpf ?? '').replace(/\D/g, '');
  if (digits.length !== CPF_LENGTH || /^(\d)\1{10}$/.test(digits)) return false;

  // Convert once to numbers. Length is guaranteed 11 by the guard above, so
  // `?? 0` below is unreachable at runtime — it exists to satisfy
  // noUncheckedIndexedAccess without an `!` assertion.
  const numbers = Array.from(digits, Number);

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) {
      sum += (numbers[i] ?? 0) * (length + 1 - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(9) === numbers[9] && checkDigit(10) === numbers[10];
}

/**
 * CNPJ check-digit validation, numeric and alphanumeric.
 *
 * Alphanumeric CNPJs began being issued in July 2026 (IN RFB nº 2.229/2024).
 * Layout is 14 positions: 1–8 root, 9–12 branch (both alphanumeric), 13–14
 * check digits (always numeric).
 */
export function validateCnpj(cnpj: string | undefined | null): boolean {
  const document = normaliseDocument(cnpj);

  // Enforces the layout: 12 alphanumeric positions then 2 numeric DVs.
  if (!/^[0-9A-Z]{12}\d{2}$/.test(document)) return false;

  // Repeated-character documents satisfy the checksum but are never issued.
  if (/^(.)\1{13}$/.test(document)) return false;

  const base = document.slice(0, 12);
  const providedDigits = document.slice(12);

  const firstDigit = moduloElevenCheckDigit(base);
  const secondDigit = moduloElevenCheckDigit(`${base}${firstDigit}`);

  return `${firstDigit}${secondDigit}` === providedDigits;
}

/**
 * Classifies by length alone — 11 → CPF, 14 → CNPJ.
 *
 * Deliberately does NOT validate: the UI needs to know a 14-character entry is
 * a CNPJ *attempt* in order to format it and label the error, even when its
 * check digits are wrong.
 */
export function detectDocumentType(value: string | undefined | null): DocumentType {
  const length = normaliseDocument(value).length;
  if (length === CPF_LENGTH) return 'cpf';
  if (length === CNPJ_LENGTH) return 'cnpj';
  return 'unknown';
}

/**
 * True when `value` is a structurally valid CPF or CNPJ.
 *
 * An empty value returns true: a blank column is missing data, not invalid
 * data, and flagging every empty row would bury the real check-digit errors.
 * Callers that require presence should test emptiness separately.
 */
export function validateDocument(value: string | undefined | null): boolean {
  const document = normaliseDocument(value);
  if (document.length === 0) return true;

  switch (detectDocumentType(document)) {
    case 'cpf':
      return validateCpf(document);
    case 'cnpj':
      return validateCnpj(document);
    default:
      return false;
  }
}
