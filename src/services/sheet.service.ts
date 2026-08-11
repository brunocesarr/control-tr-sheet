import type { SheetRowData } from '@/interfaces/tr-sheet';
import {
  readManagerSheet,
  updateAllTRStatus,
  updateTRStatus,
} from '@/repositories/sheet.repository';

export async function getManagerTable(): Promise<SheetRowData[]> {
  const rows = await readManagerSheet();
  // Pending first, then alphabetically — most useful default for the team.
  return rows.sort(
    (a, b) => Number(a.hasDone) - Number(b.hasDone) || a.name.localeCompare(b.name, 'pt-BR')
  );
}

export async function setRowStatus(row: SheetRowData, hasDone: boolean): Promise<void> {
  await updateTRStatus(row.cellRange, hasDone);
}

export async function setAllRowsStatus(hasDone: boolean) {
  return updateAllTRStatus(hasDone);
}
