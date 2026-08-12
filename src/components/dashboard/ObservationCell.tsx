'use client';

import { motion } from 'motion/react';
import { MdAddCircleOutline, MdEditNote } from 'react-icons/md';

interface ObservationCellProps {
  observations?: string;
  /** Used in the accessible label so screen readers know which row. */
  name: string;
  disabled?: boolean;
  onEdit: () => void;
  /** Mobile card gives the trigger more room than a table cell. */
  variant?: 'table' | 'card';
}

/**
 * The observations column was previously inert truncated text with a title
 * attribute. It is now the edit trigger itself — the whole cell is clickable,
 * which is a far bigger hit area than a dedicated pencil icon.
 */
export default function ObservationCell({
  observations,
  name,
  disabled = false,
  onEdit,
  variant = 'table',
}: ObservationCellProps) {
  const hasValue = Boolean(observations && observations.trim().length > 0);

  return (
    <motion.button
      type="button"
      onClick={onEdit}
      disabled={disabled}
      whileTap={{ scale: 0.98 }}
      title={hasValue ? observations : 'Adicionar observação'}
      aria-label={`${hasValue ? 'Editar' : 'Adicionar'} observação de ${name}`}
      className={`group flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === 'card' ? 'border border-dashed border-slate-300' : ''
      }`}>
      {hasValue ? (
        <>
          <span
            className={`min-w-0 flex-1 text-slate-600 ${
              variant === 'table' ? 'truncate text-sm' : 'text-xs'
            }`}>
            {observations}
          </span>
          <MdEditNote
            aria-hidden
            className="shrink-0 text-base text-slate-300 transition-colors group-hover:text-slate-600"
          />
        </>
      ) : (
        <>
          <MdAddCircleOutline
            aria-hidden
            className="shrink-0 text-base text-slate-300 transition-colors group-hover:text-emerald-600"
          />
          <span className="text-xs font-medium text-slate-400 transition-colors group-hover:text-emerald-700">
            Adicionar
          </span>
        </>
      )}
    </motion.button>
  );
}
