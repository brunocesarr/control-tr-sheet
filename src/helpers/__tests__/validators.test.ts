import { describe, expect, it } from 'vitest';

import {
  describePasswordRules,
  validateCpf,
  validateEmail,
  validateName,
  validatePassword,
} from '@/helpers/validators';

import {
  detectDocumentType,
  normaliseDocument,
  validateCnpj,
  validateDocument,
} from '@/helpers/validators';

describe('normaliseDocument', () => {
  it('uppercases and strips formatting', () => {
    expect(normaliseDocument('12.abc.345/01de-35')).toBe('12ABC34501DE35');
  });

  it('handles nullish input', () => {
    expect(normaliseDocument(null)).toBe('');
    expect(normaliseDocument(undefined)).toBe('');
  });
});

describe('validateCnpj', () => {
  // Legacy numeric CNPJs must keep validating under the ASCII−48 algorithm.
  it('accepts a valid numeric CNPJ', () => {
    expect(validateCnpj('11.222.333/0001-81')).toBe(true);
    expect(validateCnpj('11222333000181')).toBe(true);
  });

  it('rejects a numeric CNPJ with a bad check digit', () => {
    expect(validateCnpj('11222333000182')).toBe(false);
  });

  it('is case-insensitive', () => {
    const upper = validateCnpj('11.222.333/0001-81');
    const lower = validateCnpj('11.222.333/0001-81'.toLowerCase());
    expect(lower).toBe(upper);
  });

  it('rejects repeated characters', () => {
    expect(validateCnpj('00000000000000')).toBe(false);
    expect(validateCnpj('AAAAAAAAAAAAAA')).toBe(false);
  });

  it('rejects wrong lengths', () => {
    expect(validateCnpj('')).toBe(false);
    expect(validateCnpj('1122233300018')).toBe(false);
    expect(validateCnpj('112223330001811')).toBe(false);
  });

  it('rejects letters in the check-digit positions', () => {
    expect(validateCnpj('112223330001AB')).toBe(false);
  });
});

describe('detectDocumentType', () => {
  it('classifies by length', () => {
    expect(detectDocumentType('529.982.247-25')).toBe('cpf');
    expect(detectDocumentType('11.222.333/0001-81')).toBe('cnpj');
    expect(detectDocumentType('12ABC34501DE35')).toBe('cnpj');
  });

  it('returns unknown for other lengths', () => {
    expect(detectDocumentType('123')).toBe('unknown');
    expect(detectDocumentType('')).toBe('unknown');
  });

  it('classifies without validating', () => {
    expect(detectDocumentType('11222333000182')).toBe('cnpj');
  });
});

describe('validateDocument', () => {
  it('treats an empty document as valid (missing, not wrong)', () => {
    expect(validateDocument('')).toBe(true);
    expect(validateDocument(null)).toBe(true);
    expect(validateDocument('   ')).toBe(true);
  });

  it('routes to the right validator', () => {
    expect(validateDocument('529.982.247-25')).toBe(true);
    expect(validateDocument('11.222.333/0001-81')).toBe(true);
  });

  it('rejects an unknown length', () => {
    expect(validateDocument('12345')).toBe(false);
  });
});

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
