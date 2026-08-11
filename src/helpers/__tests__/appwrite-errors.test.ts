import { describe, expect, it } from 'vitest';

import { translateAuthError } from '@/helpers/appwrite-errors';

describe('translateAuthError', () => {
  it('prefers the Appwrite error type', () => {
    expect(translateAuthError({ type: 'user_invalid_credentials', code: 401 })).toBe(
      'E-mail ou senha incorretos.'
    );
    expect(translateAuthError({ type: 'user_blocked', code: 401 })).toMatch(/desativada/);
    expect(translateAuthError({ type: 'general_rate_limit_exceeded' })).toMatch(
      /Muitas tentativas/
    );
  });

  it('falls back to the HTTP code', () => {
    expect(translateAuthError({ code: 429 })).toMatch(/Muitas tentativas/);
    expect(translateAuthError({ code: 409 })).toBe('Este registro já existe.');
  });

  it('detects network failures', () => {
    expect(translateAuthError(new TypeError('Failed to fetch'))).toMatch(/Sem conexão/);
  });

  it('never leaks raw English SDK text', () => {
    const raw = { message: 'Invalid `password` param: Password must be between 8 and 265 chars' };
    expect(translateAuthError(raw)).not.toContain('param');
  });

  it('uses the supplied fallback for unknown shapes', () => {
    expect(translateAuthError(null, 'Falhou.')).toBe('Falhou.');
    expect(translateAuthError({ type: 'brand_new_error' }, 'Falhou.')).toBe('Falhou.');
  });
});
