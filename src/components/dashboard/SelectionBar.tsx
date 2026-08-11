'use client';

import { useContext, useState } from 'react';
import { MdClose, MdDoneAll, MdRemoveDone } from 'react-icons/md';

import { ConfirmModal } from '@/components/CustomModals';
import { SheetContext } from '@/contexts/useSheetContext';
import { pluralise } from '@/helpers/utils';

/**
 * Appears only when rows are selected. Gives the scoped bulk action that was
 * previously impossible — the old UI offered either one row or the entire sheet.
 */
export default function SelectionBar() {
  const { selectedRanges, clearSelection, updateSelectedStatus, isMutating } =
    useContext(SheetContext);

  const [pending, setPending] = useState<{ hasDone: boolean } | null>(null);
  const count = selectedRanges.size;

  if (count === 0) return null;

  return (
    <>
      <div
        role="status"
        className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="text-sm font-medium text-emerald-900">
          {count} {pluralise(count, 'registro selecionado', 'registros selecionados')}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPending({ hasDone: true })}
            disabled={isMutating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50">
            <MdDoneAll aria-hidden /> Marcar entregue
          </button>

          <button
            type="button"
            onClick={() => setPending({ hasDone: false })}
            disabled={isMutating}
            className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50">
            <MdRemoveDone aria-hidden /> Marcar pendente
          </button>

          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100">
            <MdClose aria-hidden /> Limpar
          </button>
        </div>
      </div>

      <ConfirmModal
        open={pending !== null}
        setOpen={(open) => !open && setPending(null)}
        title="Confirmar alteração"
        message={
          pending
            ? `${count} ${pluralise(count, 'registro será marcado', 'registros serão marcados')} como ${
                pending.hasDone ? 'ENTREGUE' : 'NÃO ENTREGUE'
              }. Deseja continuar?`
            : ''
        }
        confirmLabel="Confirmar"
        destructive={pending?.hasDone === false}
        confirmAction={async () => {
          if (!pending) return;
          await updateSelectedStatus(pending.hasDone);
          setPending(null);
        }}
      />
    </>
  );
}
