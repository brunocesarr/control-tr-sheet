'use client';

import { useContext, useEffect, useState } from 'react';
import { MdRefresh } from 'react-icons/md';

import { SheetContext } from '@/contexts/useSheetContext';
import { formatRelativeTime } from '@/helpers/relative-time';

/**
 * Shows how stale the data is. Without this there was no way to tell whether
 * the table reflected the spreadsheet as of a minute ago or an hour ago.
 */
export default function SyncIndicator() {
  const { dataUpdatedAt, isFetching, refetch } = useContext(SheetContext);
  const [, forceTick] = useState(0);

  // Re-render each minute so the relative label stays truthful. The setState
  // is inside an interval callback, not the effect body, so
  // react-hooks/set-state-in-effect does not apply.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      onClick={() => refetch()}
      disabled={isFetching}
      title="Atualizar agora"
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-60">
      <MdRefresh aria-hidden className={isFetching ? 'animate-spin' : ''} />
      {isFetching ? 'Sincronizando…' : `Atualizado ${formatRelativeTime(dataUpdatedAt)}`}
    </button>
  );
}
