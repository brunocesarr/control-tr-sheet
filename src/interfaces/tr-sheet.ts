export type SheetRowData = {
  /**
   * A1 reference of this row's STATUS cell, e.g. 'B7'. Derived from the header
   * row at runtime — never hardcoded — and carried through the whole stack so
   * writes can target the exact cell.
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
};
