/**
 * Case-, accent-, punctuation- and spacing-insensitive header matching for
 * Google Sheets.
 *
 * Real headers in this spreadsheet are:
 *   ['Coluna 1', 'STATUS', 'CPF', 'NOME', 'CIB', 'IMOVEL RURAL', 'OBSERVAÇÕES']
 *
 * Note that 'IMOVEL RURAL' has no accent while 'OBSERVAÇÕES' does. Matching on
 * literal strings is therefore fragile: `row.get('Imóvel Rural')` returns
 * undefined. Everything here compares normalised forms instead.
 */

/** 'OBSERVAÇÕES' → 'observacoes'; 'Imóvel  Rural' → 'imovel rural'. */
export function normaliseHeader(header: string | undefined | null): string {
  return (header ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining accents
    .replace(/[^a-zA-Z0-9]+/g, ' ') // punctuation / underscores → space
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** 0 → 'A', 25 → 'Z', 26 → 'AA'. */
export function columnIndexToLetter(zeroBasedIndex: number): string {
  if (!Number.isInteger(zeroBasedIndex) || zeroBasedIndex < 0) {
    throw new Error(`Invalid column index: ${zeroBasedIndex}`);
  }

  let letter = '';
  let current = zeroBasedIndex;

  while (current >= 0) {
    letter = String.fromCharCode((current % 26) + 65) + letter;
    current = Math.floor(current / 26) - 1;
  }

  return letter;
}

export interface HeaderMatch {
  /** Exact header string as it appears in the sheet — pass this to row.get(). */
  header: string;
  /** Zero-based position, used to derive the A1 column letter. */
  index: number;
  /** A1 column letter, e.g. 'B'. */
  letter: string;
}

/**
 * Wraps a worksheet's headerValues and resolves logical field names to the
 * physical header, whatever its casing or accents.
 */
export class HeaderResolver {
  private readonly byNormalised = new Map<string, HeaderMatch>();

  readonly headerValues: readonly string[];

  constructor(headerValues: readonly (string | undefined | null)[]) {
    this.headerValues = headerValues.map((header) => header ?? '');

    this.headerValues.forEach((header, index) => {
      const key = normaliseHeader(header);
      if (!key) return; // skips blank / placeholder columns like 'Coluna 1'
      // First occurrence wins, so a duplicate header can't shadow the original.
      if (!this.byNormalised.has(key)) {
        this.byNormalised.set(key, { header, index, letter: columnIndexToLetter(index) });
      }
    });
  }

  /**
   * Exact normalised match first, then whole-word containment so that a sheet
   * renamed to 'NOME DO CONTRIBUINTE' still matches the alias 'nome'.
   */
  find(aliases: readonly string[]): HeaderMatch | null {
    for (const alias of aliases) {
      const match = this.byNormalised.get(normaliseHeader(alias));
      if (match) return match;
    }

    for (const alias of aliases) {
      const key = normaliseHeader(alias);
      if (!key) continue;

      const keyWords = key.split(' ');

      for (const [candidate, match] of this.byNormalised) {
        const words = candidate.split(' ');

        // Bounded loop: `start` can never push `start + offset` past the end,
        // so no out-of-range read is possible. The previous version relied on
        // an `undefined === string` comparison, which happened to work but
        // obscured the actual invariant.
        for (let start = 0; start + keyWords.length <= words.length; start += 1) {
          const isSequence = keyWords.every((word, offset) => words[start + offset] === word);
          if (isSequence) return match;
        }
      }
    }

    return null;
  }

  require(field: string, aliases: readonly string[]): HeaderMatch {
    const match = this.find(aliases);
    if (match) return match;

    throw new Error(
      `Coluna obrigatória "${field}" não encontrada na planilha. ` +
        `Aliases aceitos: ${aliases.join(', ')}. ` +
        `Cabeçalhos disponíveis: ${this.headerValues.filter(Boolean).join(' | ')}`
    );
  }

  /** Safe read that tolerates a missing optional column. */
  read(row: { get: (header: string) => unknown }, aliases: readonly string[]): string {
    const match = this.find(aliases);
    if (!match) return '';
    const value = row.get(match.header);
    return value === null || value === undefined ? '' : String(value).trim();
  }
}

/**
 * Logical field → accepted header spellings. Add variants here rather than
 * touching the repository when the accountants rename something.
 */
export const COLUMN_ALIASES = {
  status: ['status', 'entregue', 'entrega', 'hasdone', 'has done', 'situacao'],
  cpf: ['cpf', 'cpf cnpj', 'documento'],
  name: ['nome', 'name', 'contribuinte', 'nome do contribuinte', 'proprietario'],
  cib: ['cib', 'nirf', 'codigo do imovel'],
  imovelRural: ['imovel rural', 'imovel', 'propriedade', 'nome do imovel', 'fazenda'],
  observations: ['observacoes', 'observacao', 'obs', 'notas', 'comentarios'],
} as const satisfies Record<string, readonly string[]>;
