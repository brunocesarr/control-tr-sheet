import { describe, expect, it } from 'vitest';

import { DEFAULT_SORT, nextSortState, sortRows } from '@/helpers/sheet-sort';
import type { SheetRowData } from '@/interfaces/tr-sheet';

function makeRow(overrides: Partial<SheetRowData>): SheetRowData {
  return {
    cellRange: 'B2',
    hasDone: false,
    status: 'NÃO ENTREGUE',
    cpf: '',
    name: '',
    isCpfValid: true,
    ...overrides,
  };
}

describe('sortRows', () => {
  it('puts pending rows first by default', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'Ana', hasDone: true }),
      makeRow({ cellRange: 'B3', name: 'Bruno', hasDone: false }),
    ];
    expect(sortRows(rows, DEFAULT_SORT).map((r) => r.name)).toEqual(['Bruno', 'Ana']);
  });

  it('does not mutate the input array', () => {
    const rows = [makeRow({ name: 'B' }), makeRow({ name: 'A' })];
    const snapshot = [...rows];
    sortRows(rows, { key: 'name', direction: 'asc' });
    expect(rows).toEqual(snapshot);
  });

  it('sorts names accent-insensitively in pt-BR order', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'Bruno' }),
      makeRow({ cellRange: 'B3', name: 'Álvaro' }),
      makeRow({ cellRange: 'B4', name: 'Carlos' }),
    ];
    expect(sortRows(rows, { key: 'name', direction: 'asc' }).map((r) => r.name)).toEqual([
      'Álvaro',
      'Bruno',
      'Carlos',
    ]);
  });

  it('sinks empty values to the bottom in both directions', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'A', cib: undefined }),
      makeRow({ cellRange: 'B3', name: 'B', cib: 'X1' }),
    ];
    expect(sortRows(rows, { key: 'cib', direction: 'asc' }).at(-1)?.cib).toBeUndefined();
    expect(sortRows(rows, { key: 'cib', direction: 'desc' }).at(-1)?.cib).toBeUndefined();
  });

  it('compares CPFs numerically, ignoring punctuation', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'A', cpf: '529.982.247-25' }),
      makeRow({ cellRange: 'B3', name: 'B', cpf: '11144477735' }),
    ];
    expect(sortRows(rows, { key: 'cpf', direction: 'asc' }).map((r) => r.name)).toEqual(['B', 'A']);
  });
});

describe('nextSortState', () => {
  it('cycles asc → desc on the same key', () => {
    expect(nextSortState({ key: 'name', direction: 'asc' }, 'name')).toEqual({
      key: 'name',
      direction: 'desc',
    });
  });

  it('resets to asc when switching column', () => {
    expect(nextSortState({ key: 'name', direction: 'desc' }, 'cpf')).toEqual({
      key: 'cpf',
      direction: 'asc',
    });
  });
});
