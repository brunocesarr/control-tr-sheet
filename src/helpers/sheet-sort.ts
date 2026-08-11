import type { SheetRowData } from '@/interfaces/tr-sheet';
import { normaliseText, onlyDigits } from '@/helpers/utils';

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
 */
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

function compareByKey(a: SheetRowData, b: SheetRowData, key: SortKey): number {
  switch (key) {
    case 'status':
      // false (pending) sorts before true (delivered) in ascending order.
      return Number(a.hasDone) - Number(b.hasDone);
    case 'cpf':
      // Numeric comparison on digits only, so punctuation never affects order.
      return onlyDigits(a.cpf).localeCompare(onlyDigits(b.cpf), undefined, { numeric: true });
    case 'name':
    case 'cib':
    case 'imovelRural': {
      const left = normaliseText(a[key]);
      const right = normaliseText(b[key]);
      // Empty values always sink to the bottom regardless of direction —
      // "—" rows at the top of a sorted column is never what a user wants.
      if (!left && right) return 1;
      if (left && !right) return -1;
      return collator.compare(left, right);
    }
    default:
      return 0;
  }
}

/** Returns a new array; never mutates the React Query cache. */
export function sortRows(rows: readonly SheetRowData[], sort: SortState): SheetRowData[] {
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const primary = compareByKey(a, b, sort.key) * factor;
    if (primary !== 0) return primary;
    // Stable secondary key so equal rows keep a predictable order.
    return collator.compare(normaliseText(a.name), normaliseText(b.name));
  });
}

/** Click cycles asc → desc; switching column resets to asc. */
export function nextSortState(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, direction: 'asc' };
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}
