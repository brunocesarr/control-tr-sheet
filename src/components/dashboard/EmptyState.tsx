'use client';

import { motion } from 'motion/react';
import { MdFilterAltOff, MdInbox, MdSearchOff } from 'react-icons/md';

import { easeOut } from '@/configs/motion';

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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={easeOut}
      className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {/* Slow float keeps an otherwise dead screen feeling alive. */}
      <motion.span
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
        className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon aria-hidden className="text-3xl" />
      </motion.span>

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
        <motion.button
          type="button"
          onClick={onClearFilter}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="mt-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
          Limpar filtros
        </motion.button>
      )}
    </motion.div>
  );
}
