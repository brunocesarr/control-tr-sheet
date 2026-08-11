import { describe, expect, it } from 'vitest';

import { buildCsvFilename, rowsToCsv } from '@/helpers/csv';
import type { SheetRowData } from '@/interfaces/tr-sheet';

function makeRow(overrides: Partial<SheetRowData> = {}): SheetRowData {
  return {
    cellRange: 'B2',
    hasDone: true,
    status: 'ENTREGUE',
    cpf: '52998224725',
    name: 'Maria Silva',
    cib: 'CIB-001',
    imovelRural: 'Fazenda Sol',
    observations: undefined,
    isCpfValid: true,
    ...overrides,
  };
}

describe('rowsToCsv', () => {
  it('starts with a BOM so Excel renders accents correctly', () => {
    expect(rowsToCsv([makeRow()]).startsWith('\uFEFF')).toBe(true);
  });

  it('uses semicolons, which pt-BR Excel expects as the field separator', () => {
    const [header] = rowsToCsv([]).replace('\uFEFF', '').split('\r\n');
    expect(header).toContain(';');
    expect(header?.split(';')).toHaveLength(7);
  });

  it('formats the CPF and reports validity', () => {
    const csv = rowsToCsv([makeRow({ cpf: '52998224725', isCpfValid: true })]);
    expect(csv).toContain('529.982.247-25');
    expect(csv).toContain('Sim');
  });

  it('flags an invalid CPF', () => {
    expect(rowsToCsv([makeRow({ isCpfValid: false })])).toContain('Não');
  });

  it('quotes and escapes embedded quotes and delimiters', () => {
    const csv = rowsToCsv([makeRow({ observations: 'Nota; com "aspas"' })]);
    expect(csv).toContain('"Nota; com ""aspas"""');
  });

  it('flattens newlines so a row never spans two lines', () => {
    const csv = rowsToCsv([makeRow({ observations: 'linha 1\nlinha 2' })]);
    expect(csv.replace('\uFEFF', '').split('\r\n')).toHaveLength(2);
  });

  it('neutralises CSV injection payloads', () => {
    // =HYPERLINK(...) would execute on open without the apostrophe guard.
    const csv = rowsToCsv([makeRow({ name: '=HYPERLINK("http://evil","x")' })]);
    expect(csv).toContain("'=HYPERLINK");
  });

  it('emits only the header for an empty list', () => {
    expect(rowsToCsv([]).replace('\uFEFF', '').split('\r\n')).toHaveLength(1);
  });
});

describe('buildCsvFilename', () => {
  it('includes an ISO date and the .csv extension', () => {
    expect(buildCsvFilename()).toMatch(/^controle-itr-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
