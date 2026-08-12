'use client';

import { motion } from 'motion/react';
import { useContext } from 'react';
import { MdRefresh } from 'react-icons/md';

import { SheetContext } from '@/contexts/useSheetContext';
import { formatRelativeTime } from '@/helpers/relative-time';
import { useNow } from '@/hooks/useNow';

/** Past this, the on-screen data is old enough to warn about. */
const STALE_AFTER_MS = 10 * 60 * 1000;

/**
 * Shows how stale the data is. Without this there was no way to tell whether
 * the table reflected the spreadsheet as of a minute ago or an hour ago.
 *
 * `useNow()` replaces both the forceTick interval and the inline `Date.now()`:
 * one subscription drives the relative label AND the staleness check, and no
 * impure call happens during render.
 */
export default function SyncIndicator() {
  const { dataUpdatedAt, isFetching, refetch } = useContext(SheetContext);
  const now = useNow();

  /**
   * The `dataUpdatedAt > 0` guard matters for hydration: useNow returns 0 on
   * the server, and react-query has not resolved during SSR, so both sides
   * agree on `false` and there is no mismatch warning.
   */
  const isStale = !isFetching && dataUpdatedAt > 0 && now - dataUpdatedAt > STALE_AFTER_MS;

  const label = isFetching
    ? 'Sincronizando…'
    : `Atualizado ${formatRelativeTime(dataUpdatedAt, now)}`;

  return (
    <motion.button
      type="button"
      onClick={() => refetch()}
      disabled={isFetching}
      title={isStale ? 'Dados desatualizados — clique para sincronizar' : 'Atualizar agora'}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        isStale
          ? 'border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
      }`}>
      <motion.span
        animate={isFetching ? { rotate: 360 } : { rotate: 0 }}
        transition={
          isFetching ? { repeat: Infinity, duration: 0.9, ease: 'linear' } : { duration: 0.2 }
        }
        className="flex">
        <MdRefresh aria-hidden className="text-base" />
      </motion.span>

      {/* Label hides on phones; the status dot still communicates state. */}
      <span className="hidden sm:inline">{label}</span>

      <span
        aria-hidden
        className={`size-1.5 rounded-full ${
          isFetching
            ? 'animate-pulse bg-amber-400'
            : isStale
              ? 'bg-amber-400'
              : 'animate-pulse-ring bg-brand-accent'
        }`}
      />

      <span className="sr-only" role="status">
        {label}
      </span>
    </motion.button>
  );
}
