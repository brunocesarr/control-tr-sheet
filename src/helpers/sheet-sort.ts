import { normaliseText, onlyDigits } from '@/helpers/utils';
import type { SheetRowData } from '@/interfaces/tr-sheet';

export type SortKey = 'status' | 'name' | 'cpf' | 'cib' | 'imovelRural';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

/** Pending first — the actionable items belong at the top. */
export const DEFAULT_SORT: SortState = { key: 'status', direction: 'asc' };

/**
 * pt-BR collator handles accents correctly ("Álvaro" before "Bruno") and is
 * created once — constructing an Intl.Collator per comparison is a well-known
 * sort bottleneck on large lists.
 *
 * `numeric: true` also makes digit strings compare by value, which is what the
 * CPF column needs.
 */
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

/** Comparable string for a key. An empty result means "no value". */
function toComparable(row: SheetRowData, key: SortKey): string {
  switch (key) {
    case 'status':
      // '0' pending, '1' delivered — so ascending puts pending first.
      return row.hasDone ? '1' : '0';
    case 'cpf':
      // Digits only, so punctuation never affects order.
      return onlyDigits(row.cpf);
    case 'name':
    case 'cib':
    case 'imovelRural':
      return normaliseText(row[key]);
    default: {
      // Compile-time exhaustiveness guard: adding a SortKey without handling it
      // here becomes a type error rather than a silent '' comparison.
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/**
 * 1 when the row has no value for this key, else 0.
 *
 * Ranked SEPARATELY from the value comparison and deliberately NOT multiplied
 * by the direction factor.
 *
 * This is the bug the test caught: the previous version folded the ±1 sink into
 * compareByKey's return value, which then got multiplied by -1 in descending
 * order. The sink inverted and a column of "—" rows floated to the top, which
 * is never useful.
 *
 * `status` is exempt — hasDone is a boolean, so it has no empty state.
 */
function emptinessRank(row: SheetRowData, key: SortKey): number {
  if (key === 'status') return 0;
  return toComparable(row, key) === '' ? 1 : 0;
}

/** Returns a new array; never mutates the React Query cache. */
export function sortRows(rows: readonly SheetRowData[], sort: SortState): SheetRowData[] {
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    // 1. Blanks last — direction-independent, so it must be applied before
    //    `factor` is ever involved.
    const emptiness = emptinessRank(a, sort.key) - emptinessRank(b, sort.key);
    if (emptiness !== 0) return emptiness;

    // 2. Value comparison — the only direction-sensitive step.
    const primary = collator.compare(toComparable(a, sort.key), toComparable(b, sort.key)) * factor;
    if (primary !== 0) return primary;

    // 3. Tie-break, always ascending by name, so rows that are equal on the
    //    sorted column keep a predictable order in both directions.
    return collator.compare(normaliseText(a.name), normaliseText(b.name));
  });
}

/** Click cycles asc → desc; switching column resets to asc. */
export function nextSortState(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, direction: 'asc' };
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}
