'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useContext } from 'react';
import {
  MdArrowDownward,
  MdArrowUpward,
  MdCheck,
  MdContentCopy,
  MdErrorOutline,
  MdSwapVert,
} from 'react-icons/md';

import EmptyState from '@/components/dashboard/EmptyState';
import SheetRowCard from '@/components/dashboard/SheetRowCard';
import StatusToggle from '@/components/dashboard/StatusToggle';
import Pagination from '@/components/Pagination';
import Skeleton from '@/components/Skeleton';
import { listContainer, listItem, springSnappy } from '@/configs/motion';
import { SheetContext } from '@/contexts/useSheetContext';
import type { SortKey } from '@/helpers/sheet-sort';
import { formatCpf } from '@/helpers/utils';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

interface Column {
  key: SortKey | 'observations';
  label: string;
  sortable: boolean;
  className?: string;
}

const COLUMNS: Column[] = [
  { key: 'status', label: 'Status', sortable: true, className: 'w-36' },
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'cpf', label: 'CPF', sortable: true, className: 'w-52' },
  { key: 'cib', label: 'CIB', sortable: true, className: 'w-32' },
  { key: 'imovelRural', label: 'Imóvel Rural', sortable: true },
  { key: 'observations', label: 'Observações', sortable: false },
];

const SHELL = 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card';

export default function Table() {
  const {
    isLoading,
    isFiltering,
    isMutating,
    error,
    paginatedRows,
    page,
    setPage,
    totalPages,
    filter,
    response,
    totalRows,
    hasActiveFilter,
    resetFilter,
    sort,
    toggleSort,
    selectedRanges,
    toggleRowSelection,
    toggleSelectAllOnPage,
    isPageFullySelected,
    updateStatus,
  } = useContext(SheetContext);

  const { copy, copiedKey } = useCopyToClipboard();

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        <span className="mx-auto mb-3 grid size-11 place-items-center rounded-full bg-red-100 text-red-600">
          <MdErrorOutline aria-hidden className="text-2xl" />
        </span>
        <p className="font-semibold">Não foi possível carregar a planilha</p>
        <p className="mt-1 text-xs">{error.message}</p>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className={SHELL}>
        <div className="hidden md:block">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-900">
              <tr>
                <th className="w-10 px-4 py-3.5" />
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3.5 text-left text-xs font-medium text-white">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: Math.min(filter.pageSize, 10) }).map((_, index) => (
                <tr key={index}>
                  <td className="px-4 py-3.5">
                    <Skeleton className="h-4 w-4" />
                  </td>
                  {COLUMNS.map((column) => (
                    <td key={column.key} className="px-4 py-3.5">
                      <Skeleton className="h-4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 p-4 md:hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (paginatedRows.length === 0) {
    const variant = totalRows === 0 ? 'no-data' : filter.keyword ? 'no-matches' : 'filtered-out';

    return (
      <div className={SHELL}>
        <EmptyState
          variant={variant}
          keyword={filter.keyword || undefined}
          onClearFilter={hasActiveFilter ? resetFilter : undefined}
        />
      </div>
    );
  }

  const renderSortIcon = (column: Column) => {
    if (!column.sortable) return null;
    if (sort.key !== column.key) {
      return <MdSwapVert aria-hidden className="opacity-0 transition group-hover:opacity-60" />;
    }
    return sort.direction === 'asc' ? (
      <MdArrowUpward aria-hidden className="text-emerald-400" />
    ) : (
      <MdArrowDownward aria-hidden className="text-emerald-400" />
    );
  };

  return (
    <div className={SHELL}>
      {/* isFiltering dims the body while a deferred re-filter is in flight,
          making useDeferredValue's behaviour visible instead of just "fast". */}
      <motion.div animate={{ opacity: isFiltering ? 0.55 : 1 }} transition={{ duration: 0.15 }}>
        {/* ── Desktop table ───────────────────────────────────────────────
            max-h + overflow-auto on this wrapper is what lets the thead go
            sticky. Without a scroll container the header had nothing to
            stick to and scrolled away on 100-row pages. */}
        <div className="hidden max-h-[68vh] scrollbar-slim overflow-auto md:block">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-900 text-xs tracking-wide text-white uppercase shadow-sm">
              <tr>
                <th scope="col" className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={isPageFullySelected}
                    onChange={toggleSelectAllOnPage}
                    aria-label="Selecionar todos nesta página"
                    className="size-4 rounded border-slate-500 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                  />
                </th>
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={
                      sort.key === column.key
                        ? sort.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    className={`px-4 py-3.5 font-medium ${column.className ?? ''}`}>
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key as SortKey)}
                        className="group inline-flex items-center gap-1 transition-colors hover:text-emerald-300">
                        {column.label}
                        {renderSortIcon(column)}
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Re-keying on page + sort remounts the body, so the stagger
                replays on every navigation instead of only on first paint. */}
            <motion.tbody
              key={`${page}-${sort.key}-${sort.direction}`}
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="divide-y divide-slate-100">
              {paginatedRows.map((row) => {
                const isSelected = selectedRanges.has(row.cellRange);
                const cpfKey = `${row.cellRange}-cpf`;
                const cibKey = `${row.cellRange}-cib`;

                return (
                  <motion.tr
                    key={row.cellRange}
                    variants={listItem}
                    className={`transition-colors ${
                      isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-50/80'
                    }`}>
                    <td className="relative px-4 py-3.5">
                      <AnimatePresence>
                        {isSelected && (
                          <motion.span
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            exit={{ scaleY: 0, opacity: 0 }}
                            transition={springSnappy}
                            className="absolute inset-y-0 left-0 w-0.5 origin-center bg-emerald-500"
                          />
                        )}
                      </AnimatePresence>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(row.cellRange)}
                        aria-label={`Selecionar ${row.name}`}
                        className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusToggle
                        hasDone={row.hasDone}
                        label={row.hasDone ? 'Entregue' : 'Pendente'}
                        name={row.name}
                        disabled={isMutating}
                        onToggle={() => void updateStatus(row)}
                      />
                    </td>

                    <td className="px-4 py-3.5 font-medium text-slate-900">{row.name || '—'}</td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-slate-700">
                          {row.cpf ? formatCpf(row.cpf) : '—'}
                        </span>

                        {/* The whole point of wiring up validateCpf: a bad
                            check digit means a rejected declaration. */}
                        {row.cpf && !row.isCpfValid && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            title="Dígito verificador inválido"
                            className="inline-flex items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                            <MdErrorOutline aria-hidden /> Inválido
                          </motion.span>
                        )}

                        {row.cpf && (
                          <button
                            type="button"
                            onClick={() => void copy(row.cpf, cpfKey)}
                            aria-label={`Copiar CPF de ${row.name}`}
                            className="rounded p-0.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-700">
                            {copiedKey === cpfKey ? (
                              <MdCheck aria-hidden className="text-emerald-600" />
                            ) : (
                              <MdContentCopy aria-hidden />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {row.cib ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700">{row.cib}</span>
                          <button
                            type="button"
                            onClick={() => void copy(row.cib ?? '', cibKey)}
                            aria-label={`Copiar CIB de ${row.name}`}
                            className="rounded p-0.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-700">
                            {copiedKey === cibKey ? (
                              <MdCheck aria-hidden className="text-emerald-600" />
                            ) : (
                              <MdContentCopy aria-hidden />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">{row.imovelRural || '—'}</td>

                    <td
                      className="max-w-xs truncate px-4 py-3.5 text-slate-500"
                      title={row.observations}>
                      {row.observations || '—'}
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>

        {/* ── Mobile cards ──────────────────────────────────────────────
            SheetRowCard is untouched; the stagger is applied by wrapping it,
            which keeps the card a pure presentational component. */}
        <motion.div
          key={`cards-${page}-${sort.key}-${sort.direction}`}
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="md:hidden">
          {paginatedRows.map((row) => (
            <motion.div key={row.cellRange} variants={listItem}>
              <SheetRowCard
                row={row}
                isSelected={selectedRanges.has(row.cellRange)}
                isMutating={isMutating}
                copiedKey={copiedKey}
                onToggleSelect={() => toggleRowSelection(row.cellRange)}
                onToggleStatus={() => void updateStatus(row)}
                onCopy={(value, key) => void copy(value, key)}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {response.length > 0 && (
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
