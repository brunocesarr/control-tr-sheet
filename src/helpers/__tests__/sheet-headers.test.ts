import { describe, expect, it } from 'vitest';

import {
  COLUMN_ALIASES,
  HeaderResolver,
  columnIndexToLetter,
  normaliseHeader,
} from '@/helpers/sheet-headers';

/** The exact headerValues reported by the live spreadsheet. */
const REAL_HEADERS = [
  'Coluna 1',
  'STATUS',
  'CPF',
  'NOME',
  'CIB',
  'IMOVEL RURAL',
  'OBSERVAÇÕES',
] as const;

describe('normaliseHeader', () => {
  it('strips accents, punctuation and casing', () => {
    expect(normaliseHeader('OBSERVAÇÕES')).toBe('observacoes');
    expect(normaliseHeader('Imóvel Rural')).toBe('imovel rural');
    expect(normaliseHeader('IMOVEL RURAL')).toBe('imovel rural');
    expect(normaliseHeader('  Entregue?  ')).toBe('entregue');
    expect(normaliseHeader('CPF/CNPJ')).toBe('cpf cnpj');
  });

  it('makes accented and unaccented spellings equivalent', () => {
    expect(normaliseHeader('Imóvel Rural')).toBe(normaliseHeader('IMOVEL RURAL'));
  });

  it('handles null and undefined', () => {
    expect(normaliseHeader(null)).toBe('');
    expect(normaliseHeader(undefined)).toBe('');
  });
});

describe('columnIndexToLetter', () => {
  it.each([
    [0, 'A'],
    [1, 'B'],
    [5, 'F'],
    [6, 'G'],
    [25, 'Z'],
    [26, 'AA'],
    [27, 'AB'],
    [51, 'AZ'],
    [52, 'BA'],
  ])('maps %i to %s', (index, expected) => {
    expect(columnIndexToLetter(index)).toBe(expected);
  });

  it('rejects invalid input', () => {
    expect(() => columnIndexToLetter(-1)).toThrow();
  });
});

describe('HeaderResolver against the real sheet', () => {
  const resolver = new HeaderResolver(REAL_HEADERS);

  it('resolves STATUS to column B — NOT F', () => {
    const match = resolver.require('STATUS', COLUMN_ALIASES.status);
    expect(match.letter).toBe('B');
    expect(match.index).toBe(1);
    expect(match.header).toBe('STATUS');
  });

  it('maps every logical field to the right column letter', () => {
    expect(resolver.find(COLUMN_ALIASES.cpf)?.letter).toBe('C');
    expect(resolver.find(COLUMN_ALIASES.name)?.letter).toBe('D');
    expect(resolver.find(COLUMN_ALIASES.cib)?.letter).toBe('E');
    expect(resolver.find(COLUMN_ALIASES.imovelRural)?.letter).toBe('F');
    expect(resolver.find(COLUMN_ALIASES.observations)?.letter).toBe('G');
  });

  it('matches the unaccented IMOVEL RURAL via an accented alias', () => {
    expect(resolver.find(['Imóvel Rural'])?.header).toBe('IMOVEL RURAL');
  });

  it('matches the accented OBSERVAÇÕES via an unaccented alias', () => {
    expect(resolver.find(['observacoes'])?.header).toBe('OBSERVAÇÕES');
  });

  it('ignores the blank placeholder column', () => {
    // 'Coluna 1' is indexed, but no logical field claims it.
    expect(resolver.find(['coluna 1'])?.letter).toBe('A');
    expect(resolver.find(COLUMN_ALIASES.status)?.letter).not.toBe('A');
  });

  it('returns the exact header string for row.get()', () => {
    const row = {
      get: (header: string) =>
        header === 'OBSERVAÇÕES' ? '  precisa de retificação  ' : undefined,
    };
    expect(resolver.read(row, COLUMN_ALIASES.observations)).toBe('precisa de retificação');
  });

  it('returns an empty string for a missing optional column', () => {
    const bare = new HeaderResolver(['STATUS', 'CPF']);
    expect(bare.read({ get: () => undefined }, COLUMN_ALIASES.observations)).toBe('');
  });
});

describe('HeaderResolver resilience', () => {
  it('survives lowercase, reordered and renamed headers', () => {
    const resolver = new HeaderResolver([
      'observações',
      'nome do contribuinte',
      'cpf',
      'entregue?',
      'imóvel',
    ]);

    expect(resolver.require('STATUS', COLUMN_ALIASES.status).letter).toBe('D');
    expect(resolver.find(COLUMN_ALIASES.name)?.letter).toBe('B');
    expect(resolver.find(COLUMN_ALIASES.imovelRural)?.letter).toBe('E');
  });

  it('throws a helpful error listing available headers', () => {
    const resolver = new HeaderResolver(['CPF', 'NOME']);
    expect(() => resolver.require('STATUS', COLUMN_ALIASES.status)).toThrow(/CPF \| NOME/);
  });

  it('keeps the first of duplicate headers', () => {
    const resolver = new HeaderResolver(['STATUS', 'CPF', 'status']);
    expect(resolver.require('STATUS', COLUMN_ALIASES.status).letter).toBe('A');
  });
});
