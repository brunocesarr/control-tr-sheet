export type SheetRowData = {
  /**
   * A1 reference of this row's STATUS cell, e.g. 'B7'. Derived from the header
   * row at runtime and carried through the whole stack so writes target the
   * exact cell. Also serves as the stable identity key for row selection.
   */
  cellRange: string;
  /** Parsed from the STATUS column, which may hold a checkbox or free text. */
  hasDone: boolean;
  /** Human-readable label for the UI ('ENTREGUE' / 'NÃO ENTREGUE'). */
  status: string;
  cpf: string;
  name: string;
  cib?: string;
  imovelRural?: string;
  observations?: string;
  /**
   * DERIVED — computed in sheet.service.ts, not stored in the spreadsheet.
   *
   * Check-digit validation of `cpf`. A malformed CPF means the declaration will
   * be rejected, so this surfaces data-entry errors that were previously
   * invisible (validateCpf existed but was never called).
   */
  isCpfValid: boolean;
};

/**
 * A row exactly as it comes out of the spreadsheet, before enrichment.
 *
 * `google.repository.ts` (server) and `sheet.repository.ts` (client) both deal
 * in this shape. Only `sheet.service.ts` produces a full `SheetRowData`, by
 * adding `isCpfValid`.
 *
 * Keeping the derived field out of the repository layer means the CPF rule is
 * defined once. Computing it server-side as well would be duplicate logic that
 * could silently drift.
 */
export type RawSheetRow = Omit<SheetRowData, 'isCpfValid'>;
