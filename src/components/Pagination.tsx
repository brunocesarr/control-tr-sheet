'use client';

import { useMemo } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  changePage: (page: number) => void;
}

const ELLIPSIS = '…' as const;
type PageToken = number | typeof ELLIPSIS;

/** Derives the visible page window instead of tracking min/max in state. */
function buildPageTokens(page: number, totalPages: number, window = 1): PageToken[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const tokens: PageToken[] = [1];
  const start = Math.max(2, page - window);
  const end = Math.min(totalPages - 1, page + window);

  if (start > 2) tokens.push(ELLIPSIS);
  for (let current = start; current <= end; current += 1) tokens.push(current);
  if (end < totalPages - 1) tokens.push(ELLIPSIS);

  tokens.push(totalPages);
  return tokens;
}

export default function Pagination({
  page,
  pageSize,
  totalPages,
  totalItems,
  changePage,
}: PaginationProps) {
  const tokens = useMemo(() => buildPageTokens(page, totalPages), [page, totalPages]);

  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label="Paginação"
      className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row">
      <p className="text-xs text-gray-600">
        Mostrando <span className="font-medium">{firstItem}</span>–
        <span className="font-medium">{lastItem}</span> de{' '}
        <span className="font-medium">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => changePage(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40">
          <MdChevronLeft aria-hidden />
        </button>

        {tokens.map((token, index) =>
          token === ELLIPSIS ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              {ELLIPSIS}
            </span>
          ) : (
            <button
              key={token}
              type="button"
              onClick={() => changePage(token)}
              aria-current={token === page ? 'page' : undefined}
              className={`min-w-9 rounded-md px-3 py-1.5 text-sm transition ${
                token === page
                  ? 'bg-slate-900 font-medium text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
              {token}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => changePage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40">
          <MdChevronRight aria-hidden />
        </button>
      </div>
    </nav>
  );
}
