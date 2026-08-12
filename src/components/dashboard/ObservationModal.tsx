'use client';

import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MdDeleteOutline, MdNotes } from 'react-icons/md';

import Modal from '@/components/Modal';
import {
  hasObservationChanged,
  MAX_OBSERVATION_LENGTH,
  normaliseObservation,
  OBSERVATION_WARN_AT,
} from '@/helpers/sheet-observations';
import { formatCpf } from '@/helpers/utils';
import type { SheetRowData } from '@/interfaces/tr-sheet';

interface ObservationModalProps {
  /** Non-null opens the modal; the row being edited. */
  row: SheetRowData | null;
  onClose: () => void;
  onSave: (row: SheetRowData, observations: string) => Promise<void>;
}

const BUTTON =
  'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400';

export default function ObservationModal({ row, onClose, onSave }: ObservationModalProps) {
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Seeding the draft from a prop needs an effect, but the guard is what keeps
   * it legal: state is written only when the identity of the edited row
   * actually changes, not on every render. Keying off `cellRange` rather than
   * the row object also survives the optimistic cache rewrite, which produces
   * a new object for the same row and would otherwise wipe the draft mid-typing.
   */
  const editingRange = row?.cellRange ?? null;
  const seededRange = useRef<string | null>(null);

  useEffect(() => {
    if (editingRange === seededRange.current) return;

    seededRange.current = editingRange;
    setDraft(row?.observations ?? '');
    setFailure(null);
  }, [editingRange, row?.observations]);

  const isDirty = row ? hasObservationChanged(row.observations, draft) : false;
  const remaining = MAX_OBSERVATION_LENGTH - draft.length;
  const isNearLimit = draft.length >= OBSERVATION_WARN_AT;
  const hadObservation = normaliseObservation(row?.observations).length > 0;

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setFailure(null);
    onClose();
  }, [isSubmitting, onClose]);

  const submit = useCallback(
    async (value: string) => {
      if (!row) return;

      setIsSubmitting(true);
      setFailure(null);
      try {
        await onSave(row, value);
        onClose();
      } catch (error) {
        setFailure(
          error instanceof Error ? error.message : 'Não foi possível salvar a observação.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [row, onSave, onClose]
  );

  /** Cmd/Ctrl+Enter submits — this is a data-entry queue, not a one-off form. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && isDirty && !isSubmitting) {
      event.preventDefault();
      void submit(draft);
    }
  };

  return (
    <Modal
      open={row !== null}
      onClose={handleClose}
      size="lg"
      dismissible={!isSubmitting}
      icon={
        <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-600">
          <MdNotes aria-hidden className="text-2xl" />
        </span>
      }
      title={hadObservation ? 'Editar observação' : 'Adicionar observação'}>
      {row && (
        <div className="flex flex-col gap-4 text-left">
          {/* Context strip: confirms which row is being edited. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-slate-50 px-3.5 py-2.5">
            <span className="truncate text-sm font-semibold text-slate-900">
              {row.name || 'Sem nome'}
            </span>
            {row.cpf && (
              <span className="font-mono text-xs text-slate-500">{formatCpf(row.cpf)}</span>
            )}
            <span
              className={`ml-auto shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                row.hasDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
              {row.hasDone ? 'Entregue' : 'Pendente'}
            </span>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-700">Observação</span>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, MAX_OBSERVATION_LENGTH))}
              onKeyDown={handleKeyDown}
              rows={5}
              maxLength={MAX_OBSERVATION_LENGTH}
              disabled={isSubmitting}
              placeholder="Ex.: aguardando procuração assinada do proprietário."
              aria-describedby="observation-counter"
              className="scrollbar-slim w-full resize-y rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 transition-colors outline-none placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-500"
            />

            <span className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans text-[10px] font-semibold text-slate-500">
                  ⌘
                </kbd>{' '}
                +{' '}
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans text-[10px] font-semibold text-slate-500">
                  Enter
                </kbd>{' '}
                para salvar
              </span>

              <span
                id="observation-counter"
                aria-live="polite"
                className={`tabular text-xs font-medium ${
                  isNearLimit ? 'text-amber-600' : 'text-slate-400'
                }`}>
                {remaining} restantes
              </span>
            </span>
          </label>

          {failure && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {failure}
            </motion.p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            {hadObservation && (
              <motion.button
                type="button"
                onClick={() => void submit('')}
                disabled={isSubmitting}
                whileTap={{ scale: 0.97 }}
                className={`${BUTTON} border border-red-200 bg-white text-red-700 hover:bg-red-50`}>
                <MdDeleteOutline aria-hidden /> Remover
              </motion.button>
            )}

            <div className="flex flex-1 gap-2 sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`${BUTTON} flex-1 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 sm:flex-none`}>
                Cancelar
              </button>

              <motion.button
                type="button"
                onClick={() => void submit(draft)}
                disabled={!isDirty || isSubmitting}
                whileTap={{ scale: 0.97 }}
                className={`${BUTTON} flex-1 bg-emerald-600 text-white hover:bg-emerald-500 sm:flex-none`}>
                {isSubmitting ? (
                  <>
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Salvando…
                  </>
                ) : (
                  'Salvar'
                )}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
