'use client';

import { useContext } from 'react';
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';

import Pagination from '@/components/Pagination';
import Skeleton from '@/components/Skeleton';
import { SheetContext } from '@/contexts/useSheetContext';
import { formatCpf } from '@/helpers/utils';

const COLUMNS = ['Status', 'Nome', 'CPF', 'CIB', 'Imóvel Rural', 'Observações'] as const;

export default function Table() {
  const {
    isLoading,
    isMutating,
    error,
    paginatedRows,
    page,
    setPage,
    totalPages,
    filter,
    response,
    updateStatus,
  } = useContext(SheetContext);

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  return (
    <div className="border-stroke shadow-default overflow-hidden rounded-md bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-slate-900 text-xs tracking-wide text-white uppercase">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading &&
              Array.from({ length: filter.pageSize }).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  {COLUMNS.map((column) => (
                    <td key={column} className="px-4 py-3">
                      <Skeleton className="h-4" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && paginatedRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-gray-500">
                  Nenhum registro encontrado com os filtros atuais.
                </td>
              </tr>
            )}

            {!isLoading &&
              paginatedRows.map((row) => (
                <tr key={row.cellRange} className="transition hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void updateStatus(row)}
                      disabled={isMutating}
                      aria-pressed={row.hasDone}
                      aria-label={`${row.hasDone ? 'Desmarcar' : 'Marcar'} entrega de ${row.name}`}
                      title={row.status}
                      className="inline-flex items-center gap-2 disabled:opacity-50">
                      {row.hasDone ? (
                        <MdCheckCircle className="text-xl text-emerald-600" aria-hidden />
                      ) : (
                        <MdRadioButtonUnchecked className="text-xl text-gray-400" aria-hidden />
                      )}
                      <span
                        className={
                          row.hasDone ? 'text-xs text-emerald-700' : 'text-xs text-gray-500'
                        }>
                        {row.status}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {row.cpf ? formatCpf(row.cpf) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.cib || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{row.imovelRural || '—'}</td>
                  <td
                    className="max-w-xs truncate px-4 py-3 text-gray-500"
                    title={row.observations}>
                    {row.observations || '—'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && response.length > 0 && (
        <Pagination
          page={page}
          pageSize={filter.pageSize}
          totalPages={totalPages}
          totalItems={response.length}
          changePage={setPage}
        />
      )}
    </div>
  );
}
