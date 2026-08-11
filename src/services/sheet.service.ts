import { validateCpf } from '@/helpers/validators';
import type { RawSheetRow, SheetRowData } from '@/interfaces/tr-sheet';
import {
  readManagerSheet,
  updateAllTRStatus,
  updateSelectedTRStatus,
  updateTRStatus,
} from '@/repositories/sheet.repository';

/**
 * The single boundary where RawSheetRow becomes SheetRowData.
 *
 * Keeping `isCpfValid` here rather than in either repository means the
 * check-digit rule is defined once, and both the server and client layers stay
 * ignorant of it.
 */
function enrich(row: RawSheetRow): SheetRowData {
  return { ...row, isCpfValid: validateCpf(row.cpf) };
}

/**
 * Sorting was removed from this layer: SheetContext owns it so the user can
 * reorder columns. Sorting here too would be wasted work on every fetch.
 */
export async function getManagerTable(): Promise<SheetRowData[]> {
  const rows = await readManagerSheet();
  return rows.map(enrich);
}

export async function setRowStatus(row: SheetRowData, hasDone: boolean): Promise<void> {
  await updateTRStatus(row.cellRange, hasDone);
}

export async function setAllRowsStatus(hasDone: boolean) {
  return updateAllTRStatus(hasDone);
}

/** Scoped bulk update — used by the selection bar. */
export async function setSelectedRowsStatus(cellRanges: string[], hasDone: boolean) {
  return updateSelectedTRStatus(cellRanges, hasDone);
}
