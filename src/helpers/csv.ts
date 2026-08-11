import type { SheetRowData } from '@/interfaces/tr-sheet';
import { formatCpf } from '@/helpers/utils';

/**
 * Excel in pt-BR locales parses `;` as the field separator, not `,`.
 * Using a comma produces a single mangled column — the most common complaint
 * about CSV exports from Brazilian users.
 */
const DELIMITER = ';';

/** UTF-8 BOM. Without it Excel renders "OBSERVAÇÕES" as "OBSERVAÃ‡Ã•ES". */
const BOM = '\uFEFF';

const HEADERS = [
  'STATUS',
  'CPF',
  'CPF VÁLIDO',
  'NOME',
  'CIB',
  'IMÓVEL RURAL',
  'OBSERVAÇÕES',
] as const;

/**
 * RFC 4180 escaping, plus a leading apostrophe guard.
 *
 * A value starting with = + - @ is interpreted as a formula by Excel and
 * Google Sheets (CSV injection). Prefixing with an apostrophe forces text.
 */
function escapeCell(value: string | undefined): string {
  const raw = (value ?? '').replace(/\r?\n/g, ' ').trim();
  const guarded = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;

  return /[";\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function rowsToCsv(rows: readonly SheetRowData[]): string {
  const lines = [HEADERS.join(DELIMITER)];

  for (const row of rows) {
    lines.push(
      [
        escapeCell(row.status),
        escapeCell(row.cpf ? formatCpf(row.cpf) : ''),
        escapeCell(row.isCpfValid ? 'Sim' : 'Não'),
        escapeCell(row.name),
        escapeCell(row.cib),
        escapeCell(row.imovelRural),
        escapeCell(row.observations),
      ].join(DELIMITER)
    );
  }

  // CRLF is what Excel expects.
  return BOM + lines.join('\r\n');
}

/** e.g. controle-itr-2026-08-11.csv */
export function buildCsvFilename(prefix = 'controle-itr'): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}

/** Browser-only: triggers a download without a server round trip. */
export function downloadCsv(content: string, filename: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Revoking synchronously can cancel the download in Safari.
  requestAnimationFrame(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}
