import { describe, expect, it } from 'vitest';

import {
  describePasswordRules,
  validateCpf,
  validateEmail,
  validateName,
  validatePassword,
} from '@/helpers/validators';

describe('validateEmail', () => {
  it.each(['user@example.com', 'first.last@sub.domain.com.br'])('accepts %s', (email) => {
    expect(validateEmail(email)).toBe(true);
  });

  it.each(['', 'no-at-sign', 'user@', '@domain.com', 'user @example.com'])(
    'rejects %s',
    (email) => {
      expect(validateEmail(email)).toBe(false);
    }
  );
});

describe('validatePassword', () => {
  it('accepts a compliant password', () => {
    expect(validatePassword('Senha@123')).toBe(true);
  });

  it.each([
    ['too short', 'Se@1a'],
    ['no uppercase', 'senha@123'],
    ['no digit', 'Senha@abc'],
    ['no special char', 'Senha1234'],
    ['too long', 'Senha@1234567890123'],
  ])('rejects when %s', (_label, password) => {
    expect(validatePassword(password)).toBe(false);
  });

  it('reports every unmet rule', () => {
    const unmet = describePasswordRules('abc').filter((rule) => !rule.satisfied);
    expect(unmet).toHaveLength(4);
  });
});

describe('validateName', () => {
  it('accepts Brazilian names with accents', () => {
    expect(validateName('José da Conceição')).toBe(true);
    expect(validateName("D'Ávila")).toBe(true);
  });

  it('rejects single characters and digits', () => {
    expect(validateName('A')).toBe(false);
    expect(validateName('User123')).toBe(false);
  });
});

describe('validateCpf', () => {
  it('accepts a valid CPF with and without punctuation', () => {
    expect(validateCpf('529.982.247-25')).toBe(true);
    expect(validateCpf('52998224725')).toBe(true);
  });

  it('rejects bad check digits and repeated digits', () => {
    expect(validateCpf('529.982.247-26')).toBe(false);
    expect(validateCpf('111.111.111-11')).toBe(false);
    expect(validateCpf('123')).toBe(false);
  });
});
