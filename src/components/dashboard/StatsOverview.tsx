'use client';

import { motion } from 'motion/react';
import { useContext } from 'react';
import {
  MdCheckCircleOutline,
  MdErrorOutline,
  MdPendingActions,
  MdTableRows,
} from 'react-icons/md';

import Skeleton from '@/components/Skeleton';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { SheetContext, type StatusFilter } from '@/contexts/useSheetContext';
import { fadeUp, springPanel, springSnap, staggerParent } from '@/helpers/motion';

interface StatCard {
  key: string;
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  iconWrap: string;
  filter: StatusFilter;
  hint?: string;
}

export default function StatsOverview() {
  const { stats, isLoading, filter, setFilter } = useContext(SheetContext);

  const cards: StatCard[] = [
    {
      key: 'total',
      label: 'Total de ITRs',
      value: stats.total,
      icon: MdTableRows,
      accent: 'text-slate-900',
      iconWrap: 'bg-slate-100 text-slate-600',
      filter: 'all',
    },
    {
      key: 'done',
      label: 'Entregues',
      value: stats.done,
      icon: MdCheckCircleOutline,
      accent: 'text-emerald-700',
      iconWrap: 'bg-emerald-100 text-emerald-600',
      filter: 'done',
    },
    {
      key: 'pending',
      label: 'Pendentes',
      value: stats.pending,
      icon: MdPendingActions,
      accent: 'text-amber-700',
      iconWrap: 'bg-amber-100 text-amber-600',
      filter: 'pending',
    },
    {
      key: 'invalid',
      label: 'CPF/CNPJ inválido',
      value: stats.invalidDocument,
      icon: MdErrorOutline,
      accent: stats.invalidDocument > 0 ? 'text-red-700' : 'text-slate-400',
      iconWrap:
        stats.invalidDocument > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400',
      filter: 'invalid-document',
      hint: 'Dígito verificador incorreto',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Skeleton key={card.key} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  /** Segments of the distribution bar, in reading order. */
  const segments = [
    { key: 'done', value: stats.done, className: 'bg-emerald-500', label: 'Entregues' },
    { key: 'pending', value: stats.pending, className: 'bg-amber-400', label: 'Pendentes' },
  ].filter((segment) => segment.value > 0);

  return (
    <motion.section
      aria-label="Resumo"
      variants={staggerParent(0.06)}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const isActive = filter.status === card.filter;
          const Icon = card.icon;
          const share = stats.total > 0 ? Math.round((card.value / stats.total) * 100) : 0;

          return (
            <motion.button
              key={card.key}
              type="button"
              variants={fadeUp}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              transition={springSnap}
              onClick={() => setFilter({ ...filter, status: card.filter })}
              title={card.hint}
              aria-pressed={isActive}
              className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card focus-ring transition-shadow hover:shadow-card-hover">
              {/* One shared ring travels between cards, so the eye follows the
                  active filter instead of hunting for a changed border. */}
              {isActive && (
                <motion.span
                  layoutId="stat-active-ring"
                  transition={springPanel}
                  className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-emerald-500 ring-inset"
                />
              )}

              <div className="flex items-start gap-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${card.iconWrap}`}>
                  <Icon aria-hidden className="text-lg" />
                </span>
                <span className="min-w-0 flex-1">
                  <AnimatedNumber
                    value={card.value}
                    className={`block text-2xl font-semibold tabular-nums ${card.accent}`}
                  />
                  <span className="block truncate text-xs font-medium text-slate-500">
                    {card.label}
                  </span>
                </span>
              </div>

              {/* Per-card share bar: turns four absolute counts into a
                  proportion you can read at a glance. */}
              {card.filter !== 'all' && stats.total > 0 && (
                <div className="flex items-center gap-2">
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ ...springPanel, delay: 0.1 }}
                      className={`block h-full rounded-full ${
                        card.key === 'done'
                          ? 'bg-emerald-500'
                          : card.key === 'pending'
                            ? 'bg-amber-400'
                            : 'bg-red-500'
                      }`}
                    />
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                    {share}%
                  </span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Season progress ─────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="mb-2.5 flex items-baseline justify-between gap-4">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Progresso da temporada
          </span>
          <AnimatedNumber
            value={stats.completion}
            suffix="%"
            className="text-lg font-semibold text-slate-900 tabular-nums"
          />
        </div>

        <div
          role="progressbar"
          aria-valuenow={stats.completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual de ITRs entregues"
          className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100">
          {segments.map((segment) => (
            <motion.span
              key={segment.key}
              initial={{ width: 0 }}
              animate={{ width: `${(segment.value / Math.max(stats.total, 1)) * 100}%` }}
              transition={springPanel}
              title={`${segment.label}: ${segment.value}`}
              className={`relative h-full overflow-hidden first:rounded-l-full last:rounded-r-full ${segment.className}`}>
              {segment.key === 'done' && (
                <span
                  aria-hidden
                  className="animate-sheen absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              )}
            </motion.span>
          ))}
        </div>

        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
            {stats.done} entregues
          </span>
          {stats.pending > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2 rounded-full bg-amber-400" />
              {stats.pending} restantes
            </span>
          )}
          {stats.invalidDocument > 0 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-red-600">
              <span aria-hidden className="size-2 rounded-full bg-red-500" />
              {stats.invalidDocument} com documento inválido
            </span>
          )}
        </p>
      </motion.div>
    </motion.section>
  );
}
