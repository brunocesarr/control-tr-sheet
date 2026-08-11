/**
 * The sheet has a single STATUS column rather than a boolean `hasDone` field,
 * so the flag has to be inferred from whatever the accountants typed —
 * a checkbox (TRUE/FALSE), 'SIM'/'NÃO', 'ENTREGUE'/'NÃO ENTREGUE', 1/0, or 'X'.
 */

import { normaliseHeader } from '@/helpers/sheet-headers';

/** Checked FIRST, so 'NÃO ENTREGUE' resolves to false despite containing 'entregue'. */
const FALSY_VALUES = new Set([
  '',
  '-',
  'false',
  'falso',
  'nao',
  'n',
  'no',
  '0',
  'nao entregue',
  'nao entregada',
  'pendente',
  'em aberto',
  'aberto',
  'atrasado',
  'pending',
]);

const TRUTHY_VALUES = new Set([
  'true',
  'verdadeiro',
  'sim',
  's',
  'yes',
  'y',
  '1',
  'x',
  'ok',
  'entregue',
  'entregada',
  'concluido',
  'finalizado',
  'done',
]);

/** Reuses normaliseHeader because it strips accents the same way. */
export function parseStatus(raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw !== 0;

  const value = normaliseHeader(typeof raw === 'string' ? raw : String(raw ?? ''));

  if (FALSY_VALUES.has(value)) return false;
  if (TRUTHY_VALUES.has(value)) return true;

  // Unknown vocabulary: treat a leading negation as false, otherwise look for
  // the delivery stem.
  if (value.startsWith('nao ')) return false;
  return value.includes('entregue') || value.includes('concluid');
}

export type StatusWriteFormat = 'boolean' | 'text';

/**
 * Preserves the cell's existing shape. Writing a boolean into a text column
 * (or vice versa) would silently change how the sheet renders for the team.
 */
export function detectWriteFormat(currentValue: unknown): StatusWriteFormat | null {
  if (typeof currentValue === 'boolean') return 'boolean';
  if (typeof currentValue === 'number') return 'boolean';
  if (typeof currentValue === 'string') {
    const value = normaliseHeader(currentValue);
    if (value === '') return null; // empty tells us nothing
    if (value === 'true' || value === 'false' || value === '0' || value === '1') return 'boolean';
    return 'text';
  }
  return null;
}

export interface StatusLabels {
  done: string;
  pending: string;
}

export function toCellValue(
  hasDone: boolean,
  format: StatusWriteFormat,
  labels: StatusLabels
): boolean | string {
  if (format === 'boolean') return hasDone;
  return hasDone ? labels.done : labels.pending;
}

/** Human-readable label for the UI, independent of how the cell is stored. */
export function toDisplayStatus(hasDone: boolean, labels: StatusLabels): string {
  return hasDone ? labels.done : labels.pending;
}
