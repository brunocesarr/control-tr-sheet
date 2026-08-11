'use client';

import { useCallback, useContext, useRef, useState } from 'react';
import { MdDownload, MdOutlineFilterAltOff, MdRefresh, MdSearch } from 'react-icons/md';

import { ConfirmModal } from '@/components/CustomModals';
import { PAGE_SIZE_OPTIONS, SheetContext, type StatusFilter } from '@/contexts/useSheetContext';
import { buildCsvFilename, downloadCsv, rowsToCsv } from '@/helpers/csv';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'done', label: 'Entregues' },
  { value: 'pending', label: 'Não entregues' },
  { value: 'invalid-cpf', label: 'CPF inválido' },
];

export default function FilterSection() {
  const {
    filter,
    setFilter,
    resetFilter,
    hasActiveFilter,
    updateAllToNoDeliveryStatus,
    refetch,
    isFetching,
    isMutating,
    response,
    totalRows,
  } = useContext(SheetContext);

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /**
   * `filter.keyword` is the single source of truth — no local draft, no timer.
   * The context defers the expensive re-filter, so typing stays responsive.
   */
  const focusSearch = useCallback((event: KeyboardEvent) => {
    event.preventDefault();
    searchRef.current?.focus();
  }, []);

  const clearOnEscape = useCallback(() => {
    if (hasActiveFilter) resetFilter();
    searchRef.current?.blur();
  }, [hasActiveFilter, resetFilter]);

  useKeyboardShortcut('/', focusSearch);
  useKeyboardShortcut('Escape', clearOnEscape, { allowInInput: true });

  /** Exports what is on screen, respecting filter and sort order. */
  const handleExport = useCallback(() => {
    downloadCsv(rowsToCsv(response), buildCsvFilename());
  }, [response]);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm text-slate-700">
          <span className="font-medium">Buscar</span>
          <span className="relative">
            <MdSearch
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={searchRef}
              type="search"
              value={filter.keyword}
              onChange={(event) => setFilter({ ...filter, keyword: event.target.value })}
              placeholder="Nome, CPF, CIB ou imóvel…"
              className="w-full rounded-md border border-slate-300 py-2 pr-14 pl-9 text-sm transition outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {!filter.keyword && (
              <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
                /
              </kbd>
            )}
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="font-medium">Status</span>
          <select
            value={filter.status}
            onChange={(event) =>
              setFilter({ ...filter, status: event.target.value as StatusFilter })
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm transition outline-none focus:border-emerald-500">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="font-medium">Por página</span>
          <select
            value={filter.pageSize}
            onChange={(event) => setFilter({ ...filter, pageSize: Number(event.target.value) })}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm transition outline-none focus:border-emerald-500">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-xs text-slate-500 lg:mr-1">
          {response.length} de {totalRows}
        </span>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetFilter}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
            <MdOutlineFilterAltOff aria-hidden /> Limpar
          </button>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={response.length === 0}
          title="Exporta os registros filtrados em CSV (compatível com Excel pt-BR)"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
          <MdDownload aria-hidden /> CSV
        </button>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
          <MdRefresh aria-hidden className={isFetching ? 'animate-spin' : ''} /> Atualizar
        </button>

        <button
          type="button"
          onClick={() => setOpenConfirmModal(true)}
          disabled={isMutating}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50">
          Zerar temporada
        </button>
      </div>

      <ConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        title="Zerar a temporada"
        message={`TODOS os ${totalRows} registros serão marcados como NÃO ENTREGUES, inclusive os que não estão visíveis nos filtros atuais. Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, zerar tudo"
        confirmAction={async () => {
          await updateAllToNoDeliveryStatus();
          setOpenConfirmModal(false);
        }}
      />
    </section>
  );
}
