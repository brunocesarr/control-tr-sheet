'use client';

import { useContext } from 'react';
import {
  MdCheckCircleOutline,
  MdErrorOutline,
  MdPendingActions,
  MdTableRows,
} from 'react-icons/md';

import Skeleton from '@/components/Skeleton';
import { SheetContext, type StatusFilter } from '@/contexts/useSheetContext';

interface StatCard {
  key: string;
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  iconWrap: string;
  /** Clicking the card applies this filter. */
  filter: StatusFilter;
  hint?: string;
}

/**
 * KPI strip. Every card doubles as a filter shortcut, which turns "3 CPFs
 * inválidos" from a passive number into a one-click work queue.
 */
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
      label: 'CPF inválido',
      value: stats.invalidCpf,
      icon: MdErrorOutline,
      accent: stats.invalidCpf > 0 ? 'text-red-700' : 'text-slate-400',
      iconWrap: stats.invalidCpf > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400',
      filter: 'invalid-cpf',
      hint: 'Dígito verificador incorreto',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Skeleton key={card.key} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <section aria-label="Resumo" className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const isActive = filter.status === card.filter;
          const Icon = card.icon;

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setFilter({ ...filter, status: card.filter })}
              title={card.hint}
              aria-pressed={isActive}
              className={`flex items-start gap-3 rounded-lg border bg-white p-4 text-left transition hover:shadow-sm ${
                isActive ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'
              }`}>
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-md ${card.iconWrap}`}>
                <Icon aria-hidden className="text-lg" />
              </span>
              <span className="min-w-0">
                <span className={`block text-2xl font-semibold tabular-nums ${card.accent}`}>
                  {card.value}
                </span>
                <span className="block truncate text-xs font-medium text-slate-500">
                  {card.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar — the single number the team actually reports upward. */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            Progresso da temporada
          </span>
          <span className="text-sm font-semibold text-slate-900 tabular-nums">
            {stats.completion}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={stats.completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percentual de ITRs entregues"
          className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
            style={{ width: `${stats.completion}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {stats.done} de {stats.total} declarações entregues
          {stats.pending > 0 && ` · ${stats.pending} restantes`}
        </p>
      </div>
    </section>
  );
}
