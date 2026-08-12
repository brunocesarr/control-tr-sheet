'use client';

import { motion } from 'motion/react';
import { useContext } from 'react';
import { MdPictureAsPdf } from 'react-icons/md';

import { AlertModal } from '@/components/CustomModals';
import { AuthContext } from '@/contexts/useAuthContext';
import { pluralise } from '@/helpers/utils';
import { usePdfReport } from '@/hooks/usePdfReport';
import type { SheetRowData } from '@/interfaces/tr-sheet';

interface ExportPdfButtonProps {
  rows: readonly SheetRowData[];
  /** 'selection' styles as a primary action inside the SelectionBar. */
  variant?: 'selection' | 'ghost';
  disabled?: boolean;
}

export default function ExportPdfButton({
  rows,
  variant = 'ghost',
  disabled = false,
}: ExportPdfButtonProps) {
  const { loggedInUser } = useContext(AuthContext);
  const { generate, isGenerating, error, clearError } = usePdfReport();

  const count = rows.length;

  const handleClick = () => {
    void generate({
      rows,
      scopeLabel: `${count} ${pluralise(count, 'registro', 'registros')} · ${
        variant === 'selection' ? 'seleção manual' : 'filtro atual'
      }`,
      userName: loggedInUser?.name || undefined,
    });
  };

  const className =
    variant === 'selection'
      ? 'inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300'
      : 'inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <>
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled || isGenerating || count === 0}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.96 }}
        title={
          count === 0
            ? 'Selecione registros para gerar o relatório'
            : `Gerar relatório PDF com ${count} ${pluralise(count, 'registro', 'registros')}`
        }
        className={className}>
        {isGenerating ? (
          <>
            <span className="size-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
            Gerando…
          </>
        ) : (
          <>
            <MdPictureAsPdf aria-hidden className="text-base" /> PDF
          </>
        )}
      </motion.button>

      <AlertModal
        open={error !== null}
        setOpen={clearError}
        title="Erro ao gerar PDF"
        errorMessage={error ?? ''}
      />
    </>
  );
}
