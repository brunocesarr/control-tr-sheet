import { describe, expect, it } from 'vitest';

import { DEFAULT_SORT, nextSortState, sortRows } from '@/helpers/sheet-sort';
import type { SheetRowData } from '@/interfaces/tr-sheet';

/**
 * Row factory. `cellRange` doubles as the identity key for row selection, so
 * every row in a test needs a distinct one to avoid masking ordering bugs.
 */
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
    // The rows come straight from the React Query cache — mutating them would
    // corrupt shared state and break optimistic updates.
    const rows = [makeRow({ cellRange: 'B2', name: 'B' }), makeRow({ cellRange: 'B3', name: 'A' })];
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
    // A byte-wise sort would place 'Álvaro' after 'Carlos'.
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

/**
 * Regression suite for the empty-sinking bug.
 *
 * The original implementation folded the ±1 "is empty" result into the same
 * signed number as the value comparison, then multiplied the whole thing by the
 * direction factor. In descending order the sink inverted and blank rows floated
 * to the top — which is never useful, and contradicted the code's own comment.
 *
 * Emptiness ranking is now a separate, direction-independent pass. These tests
 * pin that down across every affected column.
 */
describe('sortRows — direction independence of blanks', () => {
  it('keeps blanks last for every sortable text column, in both directions', () => {
    // The bug surfaced only on `cib` because that was the one column covered
    // above, yet it affected `name` and `imovelRural` identically.
    const keys = ['name', 'cib', 'imovelRural'] as const;

    for (const key of keys) {
      const rows = [
        makeRow({ cellRange: 'B2', name: 'Ana', [key]: undefined }),
        makeRow({ cellRange: 'B3', name: 'Bruno', [key]: 'Zeta' }),
        makeRow({ cellRange: 'B4', name: 'Carlos', [key]: 'Alfa' }),
      ];

      for (const direction of ['asc', 'desc'] as const) {
        const sorted = sortRows(rows, { key, direction });
        // The message argument identifies which combination failed.
        expect(sorted.at(-1)?.[key], `${key} / ${direction}`).toBeUndefined();
      }
    }
  });

  it('reverses only the populated rows when direction flips', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'A', cib: 'Alfa' }),
      makeRow({ cellRange: 'B3', name: 'B', cib: undefined }),
      makeRow({ cellRange: 'B4', name: 'C', cib: 'Zeta' }),
    ];

    expect(sortRows(rows, { key: 'cib', direction: 'asc' }).map((r) => r.cib)).toEqual([
      'Alfa',
      'Zeta',
      undefined,
    ]);

    expect(sortRows(rows, { key: 'cib', direction: 'desc' }).map((r) => r.cib)).toEqual([
      'Zeta',
      'Alfa',
      undefined,
    ]);
  });

  it('treats an empty string the same as undefined', () => {
    // google.repository maps blank cells to `undefined`, but a cell holding
    // only whitespace can still arrive as ''. Both mean "no value".
    const rows = [
      makeRow({ cellRange: 'B2', name: 'A', cib: '' }),
      makeRow({ cellRange: 'B3', name: 'B', cib: 'X1' }),
    ];
    expect(sortRows(rows, { key: 'cib', direction: 'desc' }).at(-1)?.cib).toBe('');
  });

  it('sinks blanks last even when every other row is also blank', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'A', cib: undefined }),
      makeRow({ cellRange: 'B3', name: 'B', cib: undefined }),
    ];
    // No value to compare, so the name tie-break decides — and must not flip.
    expect(sortRows(rows, { key: 'cib', direction: 'desc' }).map((r) => r.name)).toEqual([
      'A',
      'B',
    ]);
  });
});

describe('sortRows — status column', () => {
  it('sorts delivered first when descending', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'Ana', hasDone: false }),
      makeRow({ cellRange: 'B3', name: 'Bruno', hasDone: true }),
    ];
    expect(sortRows(rows, { key: 'status', direction: 'desc' }).map((r) => r.name)).toEqual([
      'Bruno',
      'Ana',
    ]);
  });

  it('never treats status as empty', () => {
    // hasDone is a boolean, so it has no absent state. A pending row must not
    // be sunk to the bottom the way a missing CIB would be.
    const rows = [
      makeRow({ cellRange: 'B2', name: 'Ana', hasDone: false }),
      makeRow({ cellRange: 'B3', name: 'Bruno', hasDone: true }),
    ];
    expect(sortRows(rows, { key: 'status', direction: 'asc' }).map((r) => r.name)).toEqual([
      'Ana',
      'Bruno',
    ]);
  });
});

describe('sortRows — tie-breaking', () => {
  it('breaks ties by name ascending in both directions', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'Carlos', hasDone: true }),
      makeRow({ cellRange: 'B3', name: 'Ana', hasDone: true }),
    ];
    // Equal on the sorted column, so the tie-break decides. It is deliberately
    // always ascending, giving a stable order regardless of direction.
    expect(sortRows(rows, { key: 'status', direction: 'asc' }).map((r) => r.name)).toEqual([
      'Ana',
      'Carlos',
    ]);
    expect(sortRows(rows, { key: 'status', direction: 'desc' }).map((r) => r.name)).toEqual([
      'Ana',
      'Carlos',
    ]);
  });

  it('applies the tie-break accent-insensitively', () => {
    const rows = [
      makeRow({ cellRange: 'B2', name: 'Bruno', hasDone: false }),
      makeRow({ cellRange: 'B3', name: 'Álvaro', hasDone: false }),
    ];
    expect(sortRows(rows, DEFAULT_SORT).map((r) => r.name)).toEqual(['Álvaro', 'Bruno']);
  });
});

describe('sortRows — edge cases', () => {
  it('returns an empty array unchanged', () => {
    expect(sortRows([], DEFAULT_SORT)).toEqual([]);
  });

  it('handles a single row', () => {
    const rows = [makeRow({ cellRange: 'B2', name: 'Ana' })];
    expect(sortRows(rows, { key: 'name', direction: 'desc' })).toHaveLength(1);
  });

  it('accepts a readonly array', () => {
    // SheetContext passes the filtered result, which is typed readonly.
    const rows: readonly SheetRowData[] = [
      makeRow({ cellRange: 'B2', name: 'B' }),
      makeRow({ cellRange: 'B3', name: 'A' }),
    ];
    expect(sortRows(rows, { key: 'name', direction: 'asc' }).map((r) => r.name)).toEqual([
      'A',
      'B',
    ]);
  });
});

describe('nextSortState', () => {
  it('cycles asc → desc on the same key', () => {
    expect(nextSortState({ key: 'name', direction: 'asc' }, 'name')).toEqual({
      key: 'name',
      direction: 'desc',
    });
  });

  it('cycles desc → asc on the same key', () => {
    expect(nextSortState({ key: 'name', direction: 'desc' }, 'name')).toEqual({
      key: 'name',
      direction: 'asc',
    });
  });

  it('resets to asc when switching column', () => {
    // Carrying `desc` over to a new column is disorienting — a fresh column
    // should always start ascending.
    expect(nextSortState({ key: 'name', direction: 'desc' }, 'cpf')).toEqual({
      key: 'cpf',
      direction: 'asc',
    });
  });

  it('is pure', () => {
    const current = { key: 'name', direction: 'asc' } as const;
    nextSortState(current, 'cpf');
    expect(current).toEqual({ key: 'name', direction: 'asc' });
  });
});
