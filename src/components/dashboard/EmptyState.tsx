'use client';

import { MdFilterAltOff, MdInbox, MdSearchOff } from 'react-icons/md';

type EmptyVariant = 'no-data' | 'no-matches' | 'filtered-out';

interface EmptyStateProps {
  variant: EmptyVariant;
  keyword?: string;
  onClearFilter?: () => void;
}

const VARIANTS = {
  'no-data': {
    icon: MdInbox,
    title: 'Nenhum ITR cadastrado',
    description:
      'A planilha está vazia ou a aba configurada não possui linhas de dados. Verifique a aba "Lista de ITR\'s".',
  },
  'no-matches': {
    icon: MdSearchOff,
    title: 'Nenhum resultado encontrado',
    description: 'Nenhum registro corresponde à busca. Tente outro termo ou remova os filtros.',
  },
  'filtered-out': {
    icon: MdFilterAltOff,
    title: 'Nenhum registro neste filtro',
    description: 'Não há registros com o status selecionado no momento.',
  },
} as const satisfies Record<
  EmptyVariant,
  { icon: React.ElementType; title: string; description: string }
>;

/**
 * Distinguishes "the sheet is empty" from "your filter matched nothing" —
 * the previous single message left users unsure whether the integration
 * had broken.
 */
export default function EmptyState({ variant, keyword, onClearFilter }: EmptyStateProps) {
  const { icon: Icon, title, description } = VARIANTS[variant];

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon aria-hidden className="text-2xl" />
      </span>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="max-w-sm text-xs leading-relaxed text-slate-500">
        {keyword ? (
          <>
            Nenhum registro corresponde a <strong className="break-all">“{keyword}”</strong>. Tente
            outro termo ou remova os filtros.
          </>
        ) : (
          description
        )}
      </p>
      {onClearFilter && variant !== 'no-data' && (
        <button
          type="button"
          onClick={onClearFilter}
          className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
          Limpar filtros
        </button>
      )}
    </div>
  );
}
