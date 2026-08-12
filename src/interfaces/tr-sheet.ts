import type { DocumentType } from '@/helpers/validators';

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
  /**
   * Raw document from the CPF/CNPJ column, exactly as stored in the sheet.
   *
   * Named `cpf` for continuity with COLUMN_ALIASES.cpf, whose aliases already
   * accept 'cpf cnpj' and 'documento'. It may hold either document type.
   */
  cpf: string;
  name: string;
  cib?: string;
  imovelRural?: string;
  observations?: string;
  /**
   * DERIVED — computed in sheet.service.ts, not stored in the spreadsheet.
   *
   * Which document the CPF column actually holds, by length. 'unknown' means
   * neither 11 nor 14 characters, i.e. certainly a data-entry error.
   */
  documentType: DocumentType;
  /**
   * DERIVED — check-digit validation of `cpf`, covering CPF and CNPJ
   * (including the alphanumeric CNPJ issued from July 2026).
   *
   * A malformed document means the declaration will be rejected, so this
   * surfaces data-entry errors that were previously invisible. Empty documents
   * are treated as valid — see validateDocument.
   *
   * Renamed from `isCpfValid`: the old name asserted a document type the
   * column does not guarantee.
   */
  isDocumentValid: boolean;
};

/**
 * A row exactly as it comes out of the spreadsheet, before enrichment.
 *
 * `google.repository.ts` (server) and `sheet.repository.ts` (client) both deal
 * in this shape. Only `sheet.service.ts` produces a full `SheetRowData`, by
 * adding the derived document fields.
 *
 * Keeping derived fields out of the repository layer means the document rules
 * are defined once. Computing them server-side as well would be duplicate
 * logic that could silently drift.
 */
export type RawSheetRow = Omit<SheetRowData, 'documentType' | 'isDocumentValid'>;
