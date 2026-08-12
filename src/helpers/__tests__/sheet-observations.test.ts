import { describe, expect, it } from 'vitest';

import {
  hasObservationChanged,
  MAX_OBSERVATION_LENGTH,
  normaliseObservation,
  rowNumberFromA1,
} from '@/helpers/sheet-observations';

describe('normaliseObservation', () => {
  it('returns an empty string for nullish input', () => {
    expect(normaliseObservation(null)).toBe('');
    expect(normaliseObservation(undefined)).toBe('');
  });

  it('normalises CRLF to LF', () => {
    expect(normaliseObservation('linha 1\r\nlinha 2')).toBe('linha 1\nlinha 2');
  });

  it('trims surrounding whitespace', () => {
    expect(normaliseObservation('  aguardando procuração  ')).toBe('aguardando procuração');
  });

  it('truncates beyond the maximum length', () => {
    const long = 'a'.repeat(MAX_OBSERVATION_LENGTH + 50);
    expect(normaliseObservation(long)).toHaveLength(MAX_OBSERVATION_LENGTH);
  });

  it('coerces non-string values', () => {
    expect(normaliseObservation(42)).toBe('42');
  });
});

describe('rowNumberFromA1', () => {
  it('extracts the row number', () => {
    expect(rowNumberFromA1('B7')).toBe(7);
    expect(rowNumberFromA1('AA1234')).toBe(1234);
  });

  it('rejects the header row', () => {
    expect(rowNumberFromA1('B1')).toBeNull();
  });

  it('rejects malformed references', () => {
    expect(rowNumberFromA1('')).toBeNull();
    expect(rowNumberFromA1('7B')).toBeNull();
    expect(rowNumberFromA1('b7')).toBeNull();
    expect(rowNumberFromA1('B0')).toBeNull();
    expect(rowNumberFromA1("B7'; DROP")).toBeNull();
  });
});

describe('hasObservationChanged', () => {
  it('ignores whitespace-only differences', () => {
    expect(hasObservationChanged('nota', '  nota  ')).toBe(false);
  });

  it('treats undefined and empty string as equal', () => {
    expect(hasObservationChanged(undefined, '')).toBe(false);
    expect(hasObservationChanged(undefined, '   ')).toBe(false);
  });

  it('detects a real edit', () => {
    expect(hasObservationChanged('antiga', 'nova')).toBe(true);
    expect(hasObservationChanged('antiga', '')).toBe(true);
  });
});
