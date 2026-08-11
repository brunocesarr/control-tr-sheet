import { describe, expect, it, vi } from 'vitest';

import { formatCpf, normaliseText, onlyAlphanumeric, onlyDigits, withRetry } from '@/helpers/utils';

describe('formatCpf', () => {
  it('masks progressively', () => {
    expect(formatCpf('529')).toBe('529');
    expect(formatCpf('529982')).toBe('529.982');
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('ignores extra digits and punctuation', () => {
    expect(formatCpf('529.982.247-25999')).toBe('529.982.247-25');
  });
});

describe('normalisers', () => {
  it('strips accents and lowercases', () => {
    expect(normaliseText('  José DA Conceição ')).toBe('jose da conceicao');
  });

  it('handles null and undefined', () => {
    expect(onlyDigits(null)).toBe('');
    expect(onlyAlphanumeric(undefined)).toBe('');
    expect(normaliseText(null)).toBe('');
  });
});

describe('withRetry', () => {
  it('resolves on the first success', async () => {
    const operation = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(operation)).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries then succeeds', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue('recovered');

    await expect(withRetry(operation, { baseDelayMs: 1 })).resolves.toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('rethrows after exhausting attempts', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(withRetry(operation, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow(
      'always fails'
    );
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
