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

/** CPF check-digit validation — catches typos the regex cannot. */
export function validateCpf(cpf: string | undefined | null): boolean {
  const digits = (cpf ?? '').replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

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
