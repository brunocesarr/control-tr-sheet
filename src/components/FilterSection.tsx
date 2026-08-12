'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useContext, useRef, useState } from 'react';
import { MdDownload, MdOutlineFilterAltOff, MdRefresh, MdSearch } from 'react-icons/md';

import { ConfirmModal } from '@/components/CustomModals';
import { springSnappy } from '@/configs/motion';
import { PAGE_SIZE_OPTIONS, SheetContext, type StatusFilter } from '@/contexts/useSheetContext';
import { buildCsvFilename, downloadCsv, rowsToCsv } from '@/helpers/csv';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'done', label: 'Entregues' },
  { value: 'pending', label: 'Não entregues' },
  { value: 'invalid-document', label: 'CPF/CNPJ inválido' },
];

const FIELD =
  'rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const GHOST_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

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
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1.5 text-sm text-slate-700">
          <span className="text-xs font-semibold">Buscar</span>
          <span className="relative">
            <MdSearch
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-slate-400"
            />
            <input
              ref={searchRef}
              type="search"
              value={filter.keyword}
              onChange={(event) => setFilter({ ...filter, keyword: event.target.value })}
              placeholder="Nome, CPF/CNPJ, CIB, imóvel ou observação…"
              className={`${FIELD} w-full pr-14 pl-10`}
            />
            {!filter.keyword && (
              <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block">
                /
              </kbd>
            )}
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          <span className="text-xs font-semibold">Status</span>
          <select
            value={filter.status}
            onChange={(event) =>
              setFilter({ ...filter, status: event.target.value as StatusFilter })
            }
            className={FIELD}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-slate-700">
          <span className="text-xs font-semibold">Por página</span>
          <select
            value={filter.pageSize}
            onChange={(event) => setFilter({ ...filter, pageSize: Number(event.target.value) })}
            className={FIELD}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="tabular mr-auto rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500 lg:mr-1">
          {response.length} de {totalRows}
        </span>

        <AnimatePresence initial={false}>
          {hasActiveFilter && (
            <motion.button
              key="clear-filter"
              type="button"
              onClick={resetFilter}
              initial={{ opacity: 0, scale: 0.9, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: 'auto' }}
              exit={{ opacity: 0, scale: 0.9, width: 0 }}
              transition={springSnappy}
              className={`${GHOST_BUTTON} overflow-hidden whitespace-nowrap`}>
              <MdOutlineFilterAltOff aria-hidden /> Limpar
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={handleExport}
          disabled={response.length === 0}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          title="Exporta os registros filtrados em CSV (compatível com Excel pt-BR)"
          className={GHOST_BUTTON}>
          <MdDownload aria-hidden /> CSV
        </motion.button>

        <motion.button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className={GHOST_BUTTON}>
          <motion.span
            animate={isFetching ? { rotate: 360 } : { rotate: 0 }}
            transition={
              isFetching ? { repeat: Infinity, duration: 0.9, ease: 'linear' } : { duration: 0.2 }
            }
            className="flex">
            <MdRefresh aria-hidden />
          </motion.span>
          Atualizar
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setOpenConfirmModal(true)}
          disabled={isMutating}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-xl bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
          Zerar temporada
        </motion.button>
      </div>

      {/*
        `requireTyping` is the important change here. This writes to every row in
        the spreadsheet and cannot be undone, so a single click was too cheap.
      */}
      <ConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        title="Zerar a temporada"
        message={`TODOS os ${totalRows} registros serão marcados como NÃO ENTREGUES, inclusive os que não estão visíveis nos filtros atuais. Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, zerar tudo"
        requireTyping="ZERAR"
        confirmAction={async () => {
          await updateAllToNoDeliveryStatus();
          setOpenConfirmModal(false);
        }}
      />
    </section>
  );
}
