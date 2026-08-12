'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useContext, useState } from 'react';
import {
  MdArrowDownward,
  MdArrowUpward,
  MdCheck,
  MdContentCopy,
  MdErrorOutline,
  MdSwapVert,
} from 'react-icons/md';

import EmptyState from '@/components/dashboard/EmptyState';
import ObservationCell from '@/components/dashboard/ObservationCell';
import ObservationModal from '@/components/dashboard/ObservationModal';
import SheetRowCard from '@/components/dashboard/SheetRowCard';
import StatusToggle from '@/components/dashboard/StatusToggle';
import Pagination from '@/components/Pagination';
import Skeleton from '@/components/Skeleton';
import { listContainer, listItem, springSnappy } from '@/configs/motion';
import { SheetContext } from '@/contexts/useSheetContext';
import type { SortKey } from '@/helpers/sheet-sort';
import { formatDocument } from '@/helpers/utils';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import type { SheetRowData } from '@/interfaces/tr-sheet';

interface Column {
  key: SortKey | 'observations';
  label: string;
  sortable: boolean;
  className?: string;
}

const COLUMNS: Column[] = [
  { key: 'status', label: 'Status', sortable: true, className: 'w-24' },
  { key: 'name', label: 'Nome', sortable: true },
  // Widened from w-52: a masked CNPJ plus its type badge needs the room.
  { key: 'cpf', label: 'CPF / CNPJ', sortable: true, className: 'w-60' },
  { key: 'cib', label: 'CIB', sortable: true, className: 'w-36' },
  { key: 'imovelRural', label: 'Imóvel Rural', sortable: true },
  { key: 'observations', label: 'Observações', sortable: false, className: 'w-64' },
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
    updateObservations,
  } = useContext(SheetContext);

  const { copy, copiedKey } = useCopyToClipboard();

  /**
   * A single modal instance for the whole table, driven by which row is being
   * edited. Rendering one modal per row would mount N dialogs, N focus traps
   * and N scroll locks for a page of 100 records.
   */
  const [editingRow, setEditingRow] = useState<SheetRowData | null>(null);

  /**
   * The row object in state goes stale the moment the optimistic cache rewrite
   * produces a new one. Re-reading from `paginatedRows` by cellRange keeps the
   * modal bound to live data, so a concurrent status toggle is reflected in the
   * modal's context strip.
   */
  const editingRowLive = editingRow
    ? (paginatedRows.find((row) => row.cellRange === editingRow.cellRange) ?? editingRow)
    : null;

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
            max-h + overflow-auto is what lets the thead go sticky. Without a
            scroll container the header had nothing to stick to and scrolled
            away on 100-row pages. */}
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
                const documentKey = `${row.cellRange}-document`;
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

                    {/* ── CPF / CNPJ ──────────────────────────────────── */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-slate-700">
                          {row.cpf ? formatDocument(row.cpf) : '—'}
                        </span>

                        {/* A 14-char entry in a column the team still calls
                            "CPF" is worth making explicit. */}
                        {row.documentType === 'cnpj' && (
                          <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                            CNPJ
                          </span>
                        )}

                        {/* The whole point of wiring up validateDocument: a bad
                            check digit means a rejected declaration. */}
                        {row.cpf && !row.isDocumentValid && (
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            title={
                              row.documentType === 'unknown'
                                ? 'Documento com quantidade de caracteres inválida'
                                : 'Dígito verificador inválido'
                            }
                            className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                            <MdErrorOutline aria-hidden /> Inválido
                          </motion.span>
                        )}

                        {row.cpf && (
                          <button
                            type="button"
                            onClick={() => void copy(row.cpf, documentKey)}
                            aria-label={`Copiar documento de ${row.name}`}
                            className="rounded p-0.5 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-700">
                            {copiedKey === documentKey ? (
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

                    <td className="max-w-xs px-4 py-3.5">
                      <ObservationCell
                        observations={row.observations}
                        name={row.name}
                        disabled={isMutating}
                        onEdit={() => setEditingRow(row)}
                      />
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>

        {/* ── Mobile cards ────────────────────────────────────────────── */}
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
                onEditObservations={() => setEditingRow(row)}
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

      <ObservationModal
        row={editingRowLive}
        onClose={() => setEditingRow(null)}
        onSave={updateObservations}
      />
    </div>
  );
}
