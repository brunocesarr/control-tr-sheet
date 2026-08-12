import { formatDocument } from '@/helpers/utils';
import type { SheetRowData } from '@/interfaces/tr-sheet';

/**
 * Pure report shaping. Deliberately imports NOTHING from jspdf, so the column
 * definitions and summary maths are unit-testable without loading a 130 KB
 * PDF engine into the test runner.
 */

export const PDF_HEADERS = [
  'STATUS',
  'CPF / CNPJ',
  'TIPO',
  'VÁLIDO',
  'NOME',
  'CIB',
  'IMÓVEL RURAL',
  'OBSERVAÇÕES',
] as const;

/** Column widths in mm, tuned for A4 landscape (277mm of usable width). */
export const PDF_COLUMN_WIDTHS = [22, 34, 14, 16, 58, 20, 48, 65] as const;

export interface ReportSummary {
  total: number;
  done: number;
  pending: number;
  invalidDocument: number;
  /** 0–100, rounded. */
  completion: number;
}

export function buildReportSummary(rows: readonly SheetRowData[]): ReportSummary {
  let done = 0;
  let invalidDocument = 0;

  for (const row of rows) {
    if (row.hasDone) done += 1;
    if (!row.isDocumentValid) invalidDocument += 1;
  }

  return {
    total: rows.length,
    done,
    pending: rows.length - done,
    invalidDocument,
    completion: rows.length === 0 ? 0 : Math.round((done / rows.length) * 100),
  };
}

const DOCUMENT_TYPE_LABEL = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  unknown: '—',
} as const;

/**
 * Newlines are collapsed: autoTable would otherwise grow a row to fit a
 * multi-line observation and break the column rhythm across pages.
 */
function flatten(value: string | undefined): string {
  return (value ?? '').replace(/\r?\n/g, ' ').trim();
}

export function rowsToPdfBody(rows: readonly SheetRowData[]): string[][] {
  return rows.map((row) => [
    row.hasDone ? 'ENTREGUE' : 'PENDENTE',
    row.cpf ? formatDocument(row.cpf) : '—',
    DOCUMENT_TYPE_LABEL[row.documentType],
    row.cpf === '' ? '—' : row.isDocumentValid ? 'Sim' : 'Não',
    flatten(row.name) || '—',
    flatten(row.cib) || '—',
    flatten(row.imovelRural) || '—',
    flatten(row.observations) || '—',
  ]);
}

/** e.g. relatorio-itr-2026-08-12.pdf */
export function buildPdfFilename(prefix = 'relatorio-itr'): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.pdf`;
}

/** Long-form pt-BR timestamp for the cover line. */
export function formatReportTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
