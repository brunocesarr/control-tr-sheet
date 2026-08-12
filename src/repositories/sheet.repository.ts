import type { RawSheetRow } from '@/interfaces/tr-sheet';
import { apiManagerSheet } from '@/repositories/base/apiControlSheet';

export interface BulkStatusResult {
  updated: number;
  skipped: number;
}

/**
 * The API returns rows without derived fields; sheet.service.ts adds
 * `isCpfValid`. Previously this file declared its own local
 * `Omit<SheetRowData, 'isCpfValid'>`, which duplicated the definition —
 * RawSheetRow is now shared with google.repository.ts.
 */
export async function readManagerSheet(): Promise<RawSheetRow[]> {
  const { data } = await apiManagerSheet.get<RawSheetRow[]>('/api/v1/sheet');
  // An empty sheet is a valid state, not an error.
  return Array.isArray(data) ? data : [];
}

export async function updateTRStatus(cellRange: string, hasDone: boolean): Promise<void> {
  await apiManagerSheet.patch('/api/v1/sheet', { cellRange, hasDone });
}

export async function updateAllTRStatus(hasDone: boolean): Promise<BulkStatusResult> {
  const { data } = await apiManagerSheet.post<BulkStatusResult>('/api/v1/sheet/update-all-status', {
    hasDone,
  });
  return data;
}

/** Same endpoint, scoped by explicit cell ranges. */
export async function updateSelectedTRStatus(
  cellRanges: string[],
  hasDone: boolean
): Promise<BulkStatusResult> {
  const { data } = await apiManagerSheet.post<BulkStatusResult>('/api/v1/sheet/update-all-status', {
    hasDone,
    cellRanges,
  });
  return data;
}

export interface ObservationUpdateResult {
  statusCellRange: string;
  observationsCellRange: string;
  /** Post-normalisation value actually stored in the sheet. */
  observations: string;
}

/** `cellRange` is the row's STATUS reference, as carried by SheetRowData. */
export async function updateTRObservations(
  cellRange: string,
  observations: string
): Promise<ObservationUpdateResult> {
  const { data } = await apiManagerSheet.patch<ObservationUpdateResult>(
    '/api/v1/sheet/observations',
    { cellRange, observations }
  );
  return data;
}
