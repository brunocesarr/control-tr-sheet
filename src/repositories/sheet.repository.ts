import type { SheetRowData } from '@/interfaces/tr-sheet';
import { apiManagerSheet } from '@/repositories/base/apiControlSheet';

export async function readManagerSheet(): Promise<SheetRowData[]> {
  const { data } = await apiManagerSheet.get<SheetRowData[]>('/api/v1/sheet');
  // An empty sheet is a valid state, not an error — don't throw here.
  return Array.isArray(data) ? data : [];
}

export async function updateTRStatus(cellRange: string, hasDone: boolean): Promise<void> {
  await apiManagerSheet.patch('/api/v1/sheet', { cellRange, hasDone });
}

export async function updateAllTRStatus(
  hasDone: boolean
): Promise<{ updated: number; skipped: number }> {
  const { data } = await apiManagerSheet.post<{ updated: number; skipped: number }>(
    '/api/v1/sheet/update-all-status',
    { hasDone }
  );
  return data;
}
