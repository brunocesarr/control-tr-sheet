'use client';

import { useContext, useEffect, useState } from 'react';
import { MdOutlineFilterAltOff, MdRefresh } from 'react-icons/md';

import { ConfirmModal } from '@/components/CustomModals';
import { PAGE_SIZE_OPTIONS, SheetContext, type StatusFilter } from '@/contexts/useSheetContext';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'done', label: 'Entregues' },
  { value: 'pending', label: 'Não entregues' },
];

export default function FilterSection() {
  const {
    filter,
    setFilter,
    resetFilter,
    updateAllToNoDeliveryStatus,
    refetch,
    isFetching,
    isMutating,
    response,
    totalRows,
  } = useContext(SheetContext);

  const [keywordDraft, setKeywordDraft] = useState(filter.keyword);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  // Debounce the keyword so we don't re-filter on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (keywordDraft !== filter.keyword) setFilter({ ...filter, keyword: keywordDraft });
    }, 300);
    return () => clearTimeout(timeout);
  }, [keywordDraft, filter, setFilter]);

  useEffect(() => {
    setKeywordDraft(filter.keyword);
  }, [filter.keyword]);

  const hasActiveFilter = filter.keyword !== '' || filter.status !== 'all';

  return (
    <section className="flex flex-col gap-4 rounded-md bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Buscar</span>
          <input
            type="search"
            value={keywordDraft}
            onChange={(event) => setKeywordDraft(event.target.value)}
            placeholder="Nome, CPF, CIB ou imóvel…"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Status</span>
          <select
            value={filter.status}
            onChange={(event) =>
              setFilter({ ...filter, status: event.target.value as StatusFilter })
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* Priority #6 — pageSize is now user-controlled and persisted. */}
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          <span className="font-medium">Por página</span>
          <select
            value={filter.pageSize}
            onChange={(event) => setFilter({ ...filter, pageSize: Number(event.target.value) })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500">
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-xs text-gray-500 lg:mr-2">
          {response.length} de {totalRows} registro(s)
        </span>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetFilter}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50">
            <MdOutlineFilterAltOff aria-hidden /> Limpar
          </button>
        )}

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
          <MdRefresh aria-hidden className={isFetching ? 'animate-spin' : ''} /> Atualizar
        </button>

        <button
          type="button"
          onClick={() => setOpenConfirmModal(true)}
          disabled={isMutating}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50">
          {/* Typo fixed: "nao entregue" → "não entregues" */}
          Marcar todos como não entregues
        </button>
      </div>

      <ConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        title="Confirmar alteração em massa"
        message="Todos os registros serão marcados como NÃO ENTREGUES. Esta ação não pode ser desfeita. Deseja continuar?"
        confirmAction={async () => {
          await updateAllToNoDeliveryStatus();
          setOpenConfirmModal(false);
        }}
      />
    </section>
  );
}
