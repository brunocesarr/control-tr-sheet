import { describe, expect, it } from 'vitest';

import {
  detectWriteFormat,
  parseStatus,
  toCellValue,
  toDisplayStatus,
} from '@/helpers/sheet-status';

const LABELS = { done: 'ENTREGUE', pending: 'NÃO ENTREGUE' };

describe('parseStatus', () => {
  it.each([true, 1, 'TRUE', 'true', 'Sim', 'S', 'X', 'OK', 'ENTREGUE', 'Concluído', 'done'])(
    'reads %s as delivered',
    (value) => {
      expect(parseStatus(value)).toBe(true);
    }
  );

  it.each([false, 0, '', '-', 'FALSE', 'Não', 'N', 'PENDENTE', 'Em aberto', 'ATRASADO'])(
    'reads %s as pending',
    (value) => {
      expect(parseStatus(value)).toBe(false);
    }
  );

  it('does not mistake NÃO ENTREGUE for ENTREGUE', () => {
    // The substring trap: 'nao entregue' contains 'entregue'.
    expect(parseStatus('NÃO ENTREGUE')).toBe(false);
    expect(parseStatus('nao entregue')).toBe(false);
    expect(parseStatus('Não Entregue')).toBe(false);
    expect(parseStatus('ENTREGUE')).toBe(true);
  });

  it('handles null and undefined as pending', () => {
    expect(parseStatus(null)).toBe(false);
    expect(parseStatus(undefined)).toBe(false);
  });
});

describe('detectWriteFormat', () => {
  it('detects checkbox columns', () => {
    expect(detectWriteFormat(true)).toBe('boolean');
    expect(detectWriteFormat('FALSE')).toBe('boolean');
    expect(detectWriteFormat(1)).toBe('boolean');
  });

  it('detects text columns', () => {
    expect(detectWriteFormat('ENTREGUE')).toBe('text');
    expect(detectWriteFormat('Pendente')).toBe('text');
  });

  it('returns null for empty cells', () => {
    expect(detectWriteFormat('')).toBeNull();
    expect(detectWriteFormat(null)).toBeNull();
  });
});

describe('toCellValue', () => {
  it('preserves boolean columns', () => {
    expect(toCellValue(true, 'boolean', LABELS)).toBe(true);
    expect(toCellValue(false, 'boolean', LABELS)).toBe(false);
  });

  it('preserves text columns', () => {
    expect(toCellValue(true, 'text', LABELS)).toBe('ENTREGUE');
    expect(toCellValue(false, 'text', LABELS)).toBe('NÃO ENTREGUE');
  });

  it('round-trips through parseStatus', () => {
    expect(parseStatus(toCellValue(true, 'text', LABELS))).toBe(true);
    expect(parseStatus(toCellValue(false, 'text', LABELS))).toBe(false);
  });
});

describe('toDisplayStatus', () => {
  it('is independent of storage format', () => {
    expect(toDisplayStatus(true, LABELS)).toBe('ENTREGUE');
    expect(toDisplayStatus(false, LABELS)).toBe('NÃO ENTREGUE');
  });
});
