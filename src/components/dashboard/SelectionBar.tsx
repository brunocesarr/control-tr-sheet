'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useContext, useState } from 'react';
import { MdClose, MdDoneAll, MdRemoveDone } from 'react-icons/md';

import { ConfirmModal } from '@/components/CustomModals';
import { SheetContext } from '@/contexts/useSheetContext';
import { springPanel, springSnap } from '@/helpers/motion';
import { pluralise } from '@/helpers/utils';

/**
 * Now a floating action bar pinned to the bottom of the viewport.
 *
 * Inline, it pushed the table down every time a checkbox was ticked — the row
 * you just clicked jumped out from under the cursor. Floating keeps the table
 * still and keeps the actions reachable no matter how far you have scrolled.
 */
export default function SelectionBar() {
  const { selectedRanges, clearSelection, updateSelectedStatus, isMutating } =
    useContext(SheetContext);

  const [pending, setPending] = useState<{ hasDone: boolean } | null>(null);
  const count = selectedRanges.size;

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={springPanel}
            className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6">
            <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/95 px-3 py-2.5 shadow-overlay backdrop-blur-md sm:px-4">
              <span className="flex items-center gap-2 pl-1 text-sm font-medium text-white">
                <motion.span
                  key={count}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={springSnap}
                  className="grid size-6 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-white tabular-nums">
                  {count}
                </motion.span>
                <span className="hidden sm:inline">
                  {pluralise(count, 'registro selecionado', 'registros selecionados')}
                </span>
              </span>

              <span aria-hidden className="hidden h-6 w-px bg-white/10 sm:block" />

              <div className="flex flex-wrap items-center gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={springSnap}
                  onClick={() => setPending({ hasDone: true })}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white focus-ring transition hover:bg-emerald-500 disabled:opacity-50">
                  <MdDoneAll aria-hidden /> Marcar entregue
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  transition={springSnap}
                  onClick={() => setPending({ hasDone: false })}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-amber-200 focus-ring transition hover:bg-white/10 disabled:opacity-50">
                  <MdRemoveDone aria-hidden /> Marcar pendente
                </motion.button>

                <button
                  type="button"
                  onClick={clearSelection}
                  aria-label="Limpar seleção"
                  className="rounded-lg p-2 text-slate-400 focus-ring transition hover:bg-white/10 hover:text-white">
                  <MdClose aria-hidden />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={pending !== null}
        setOpen={(open) => !open && setPending(null)}
        title="Confirmar alteração"
        variant={pending?.hasDone ? 'success' : 'warning'}
        message={
          pending
            ? `${count} ${pluralise(count, 'registro será marcado', 'registros serão marcados')} como ${
                pending.hasDone ? 'ENTREGUE' : 'NÃO ENTREGUE'
              }. Deseja continuar?`
            : ''
        }
        confirmLabel="Confirmar"
        confirmAction={async () => {
          if (!pending) return;
          await updateSelectedStatus(pending.hasDone);
          setPending(null);
        }}
      />
    </>
  );
}
