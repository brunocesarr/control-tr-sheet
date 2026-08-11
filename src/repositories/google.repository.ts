import 'server-only';

import {
  GoogleSpreadsheet,
  type GoogleSpreadsheetRow,
  type GoogleSpreadsheetWorksheet,
} from 'google-spreadsheet';

import { serverEnv } from '@/configs/env.server';
import { COLUMN_ALIASES, HeaderResolver, type HeaderMatch } from '@/helpers/sheet-headers';
import {
  detectWriteFormat,
  parseStatus,
  toCellValue,
  toDisplayStatus,
  type StatusWriteFormat,
} from '@/helpers/sheet-status';
import { withRetry } from '@/helpers/utils';
import type { RawSheetRow } from '@/interfaces/tr-sheet';
import { getSpreadSheetAccountAuth } from '@/repositories/base/apiGoogleSheet';

/**
 * There is deliberately NO hardcoded STATUS_COLUMN constant.
 *
 * Headers in this spreadsheet are:
 *   A='Coluna 1'  B='STATUS'  C='CPF'  D='NOME'  E='CIB'
 *   F='IMOVEL RURAL'  G='OBSERVAÇÕES'
 *
 * Assuming 'F' (as an earlier revision did) would have written booleans over
 * every rural property name. The column letter is derived from the header row
 * at runtime, so reordering columns in the sheet is a no-op here.
 *
 * This layer returns RawSheetRow, not SheetRowData: `isCpfValid` is derived in
 * sheet.service.ts so the CPF rule exists in exactly one place.
 */

interface LoadedSheet {
  worksheet: GoogleSpreadsheetWorksheet;
  headers: HeaderResolver;
  statusHeader: HeaderMatch;
}

async function loadWorksheet(): Promise<GoogleSpreadsheetWorksheet> {
  const doc = new GoogleSpreadsheet(serverEnv.googleSheetId, getSpreadSheetAccountAuth());
  await withRetry(() => doc.loadInfo());

  const worksheet = doc.sheetsByTitle[serverEnv.googleSheetTabName];
  if (!worksheet) {
    throw new Error(
      `Aba "${serverEnv.googleSheetTabName}" não encontrada. ` +
        `Disponíveis: ${Object.keys(doc.sheetsByTitle).join(', ')}`
    );
  }
  return worksheet;
}

async function loadSheetWithHeaders(): Promise<LoadedSheet> {
  const worksheet = await loadWorksheet();
  await withRetry(() => worksheet.loadHeaderRow());

  const headers = new HeaderResolver(worksheet.headerValues);
  const statusHeader = headers.require('STATUS', COLUMN_ALIASES.status);

  return { worksheet, headers, statusHeader };
}

function toCellRange(statusHeader: HeaderMatch, row: GoogleSpreadsheetRow): string {
  return `${statusHeader.letter}${row.rowNumber}`;
}

function resolveWriteFormat(currentValue: unknown): StatusWriteFormat {
  const configured = serverEnv.sheetStatusWriteMode;
  if (configured !== 'auto') return configured;
  // Empty cells give no signal — default to text, matching the visible column.
  return detectWriteFormat(currentValue) ?? 'text';
}

/** Returns RawSheetRow[] — enrichment happens in the service layer. */
export async function getSheet(): Promise<RawSheetRow[]> {
  const { worksheet, headers, statusHeader } = await loadSheetWithHeaders();
  const rows = await withRetry(() => worksheet.getRows());
  const labels = serverEnv.sheetStatusLabels;

  return (
    rows
      .map((row) => {
        const hasDone = parseStatus(row.get(statusHeader.header));

        return {
          cellRange: toCellRange(statusHeader, row),
          hasDone,
          status: toDisplayStatus(hasDone, labels),
          cpf: headers.read(row, COLUMN_ALIASES.cpf),
          name: headers.read(row, COLUMN_ALIASES.name),
          cib: headers.read(row, COLUMN_ALIASES.cib) || undefined,
          imovelRural: headers.read(row, COLUMN_ALIASES.imovelRural) || undefined,
          observations: headers.read(row, COLUMN_ALIASES.observations) || undefined,
        } satisfies RawSheetRow;
      })
      // Trailing blank rows are common in shared sheets — drop them.
      .filter((row) => row.cpf !== '' || row.name !== '')
  );
}

export async function updateStatus(cellRange: string, hasDone: boolean): Promise<void> {
  const { worksheet, statusHeader } = await loadSheetWithHeaders();

  assertRangeTargetsStatusColumn(cellRange, statusHeader);

  await withRetry(() => worksheet.loadCells(cellRange));
  const cell = worksheet.getCellByA1(cellRange);

  const format = resolveWriteFormat(cell.value);
  cell.value = toCellValue(hasDone, format, serverEnv.sheetStatusLabels);

  await withRetry(() => worksheet.saveUpdatedCells());
}

/**
 * Bulk write in a single saveUpdatedCells() call — one API round trip instead
 * of N, which matters against the 60 requests/minute quota.
 */
export async function updateAllStatus(cellRanges: string[], hasDone: boolean): Promise<number> {
  if (cellRanges.length === 0) return 0;

  const { worksheet, statusHeader } = await loadSheetWithHeaders();
  cellRanges.forEach((range) => assertRangeTargetsStatusColumn(range, statusHeader));

  await withRetry(() => worksheet.loadCells(cellRanges));

  const labels = serverEnv.sheetStatusLabels;
  cellRanges.forEach((range) => {
    const cell = worksheet.getCellByA1(range);
    cell.value = toCellValue(hasDone, resolveWriteFormat(cell.value), labels);
  });

  await withRetry(() => worksheet.saveUpdatedCells());
  return cellRanges.length;
}

/**
 * Last line of defence: even though the route handler whitelists the A1 syntax,
 * refuse to write outside the resolved STATUS column. This is precisely the
 * mistake that would have clobbered 'IMOVEL RURAL' when the column letter was
 * hardcoded to 'F'.
 */
function assertRangeTargetsStatusColumn(cellRange: string, statusHeader: HeaderMatch): void {
  const match = /^([A-Z]{1,3})([1-9]\d{0,6})$/.exec(cellRange);
  // RegExpExecArray indexing is `string | undefined` under
  // noUncheckedIndexedAccess — bind the group before comparing it.
  const column = match?.[1];

  if (!column) {
    throw new Error(`Referência A1 inválida: "${cellRange}".`);
  }

  if (column !== statusHeader.letter) {
    throw new Error(
      `Escrita bloqueada: "${cellRange}" não pertence à coluna de STATUS ` +
        `("${statusHeader.letter}", cabeçalho "${statusHeader.header}").`
    );
  }
}
