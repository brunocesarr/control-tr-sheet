import { describe, expect, it } from 'vitest';

import {
  buildPdfFilename,
  buildReportSummary,
  PDF_COLUMN_WIDTHS,
  PDF_HEADERS,
  rowsToPdfBody,
} from '@/helpers/pdf-report';
import type { SheetRowData } from '@/interfaces/tr-sheet';

function row(overrides: Partial<SheetRowData> = {}): SheetRowData {
  return {
    cellRange: 'B2',
    hasDone: false,
    status: 'NÃO ENTREGUE',
    cpf: '52998224725',
    name: 'Maria Souza',
    documentType: 'cpf',
    isDocumentValid: true,
    ...overrides,
  };
}

describe('PDF column definitions', () => {
  it('keeps headers and widths in lockstep', () => {
    expect(PDF_COLUMN_WIDTHS).toHaveLength(PDF_HEADERS.length);
  });

  it('fits A4 landscape usable width (277mm)', () => {
    const total = PDF_COLUMN_WIDTHS.reduce((sum, width) => sum + width, 0);
    expect(total).toBeLessThanOrEqual(277);
  });
});

describe('buildReportSummary', () => {
  it('returns zeroes for an empty selection', () => {
    expect(buildReportSummary([])).toEqual({
      total: 0,
      done: 0,
      pending: 0,
      invalidDocument: 0,
      completion: 0,
    });
  });

  it('counts and computes completion', () => {
    const summary = buildReportSummary([
      row({ hasDone: true }),
      row({ hasDone: false }),
      row({ hasDone: false, isDocumentValid: false }),
      row({ hasDone: true }),
    ]);

    expect(summary).toEqual({
      total: 4,
      done: 2,
      pending: 2,
      invalidDocument: 1,
      completion: 50,
    });
  });
});

describe('rowsToPdfBody', () => {
  it('emits one cell per header', () => {
    const [body] = rowsToPdfBody([row()]);
    expect(body).toHaveLength(PDF_HEADERS.length);
  });

  it('masks the document and labels its type', () => {
    const [cpfRow] = rowsToPdfBody([row()]);
    expect(cpfRow?.[1]).toBe('529.982.247-25');
    expect(cpfRow?.[2]).toBe('CPF');

    const [cnpjRow] = rowsToPdfBody([row({ cpf: '12ABC34501DE35', documentType: 'cnpj' })]);
    expect(cnpjRow?.[1]).toBe('12.ABC.345/01DE-35');
    expect(cnpjRow?.[2]).toBe('CNPJ');
  });

  it('flattens newlines in observations', () => {
    const [body] = rowsToPdfBody([row({ observations: 'linha 1\nlinha 2' })]);
    expect(body?.[7]).toBe('linha 1 linha 2');
  });

  it('shows a dash rather than "Não" for a blank document', () => {
    const [body] = rowsToPdfBody([row({ cpf: '', documentType: 'unknown' })]);
    expect(body?.[1]).toBe('—');
    expect(body?.[3]).toBe('—');
  });

  it('renders status from hasDone, not the free-text status column', () => {
    const [body] = rowsToPdfBody([row({ hasDone: true, status: 'qualquer coisa' })]);
    expect(body?.[0]).toBe('ENTREGUE');
  });
});

describe('buildPdfFilename', () => {
  it('stamps the date and extension', () => {
    expect(buildPdfFilename()).toMatch(/^relatorio-itr-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
