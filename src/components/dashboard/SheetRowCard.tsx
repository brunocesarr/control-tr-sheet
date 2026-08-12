'use client';

import { MdCheck, MdContentCopy, MdErrorOutline } from 'react-icons/md';

import ObservationCell from '@/components/dashboard/ObservationCell';
import StatusToggle from '@/components/dashboard/StatusToggle';
import { formatDocument } from '@/helpers/utils';
import type { SheetRowData } from '@/interfaces/tr-sheet';

interface SheetRowCardProps {
  row: SheetRowData;
  isSelected: boolean;
  isMutating: boolean;
  copiedKey: string | null;
  onToggleSelect: () => void;
  onToggleStatus: () => void;
  onCopy: (value: string, key: string) => void;
  onEditObservations: () => void;
}

/**
 * Mobile presentation of a row.
 *
 * The table needs min-w-[900px] for six columns, which forced horizontal
 * scrolling on phones. This renders below `md` instead.
 */
export default function SheetRowCard({
  row,
  isSelected,
  isMutating,
  copiedKey,
  onToggleSelect,
  onToggleStatus,
  onCopy,
  onEditObservations,
}: SheetRowCardProps) {
  const documentKey = `${row.cellRange}-document`;

  return (
    <article
      className={`flex flex-col gap-3 border-b border-slate-100 p-4 transition-colors ${
        isSelected ? 'bg-emerald-50/60' : 'bg-white'
      }`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          aria-label={`Selecionar ${row.name}`}
          className="mt-1 size-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900">{row.name || '—'}</h3>

          {/* flex-wrap: a masked CNPJ plus two badges overflows 360px viewports. */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs text-slate-600">
              {row.cpf ? formatDocument(row.cpf) : '—'}
            </span>

            {row.documentType === 'cnpj' && (
              <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
                CNPJ
              </span>
            )}

            {row.cpf && !row.isDocumentValid && (
              <span
                title={
                  row.documentType === 'unknown'
                    ? 'Documento com quantidade de caracteres inválida'
                    : 'Dígito verificador inválido'
                }
                className="inline-flex shrink-0 items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                <MdErrorOutline aria-hidden /> Inválido
              </span>
            )}

            {row.cpf && (
              <button
                type="button"
                onClick={() => onCopy(row.cpf, documentKey)}
                aria-label="Copiar documento"
                className="rounded p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                {copiedKey === documentKey ? (
                  <MdCheck aria-hidden className="text-emerald-600" />
                ) : (
                  <MdContentCopy aria-hidden />
                )}
              </button>
            )}
          </div>
        </div>

        <StatusToggle
          hasDone={row.hasDone}
          label={row.hasDone ? 'Entregue' : 'Pendente'}
          name={row.name}
          disabled={isMutating}
          onToggle={onToggleStatus}
        />
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 pl-7 text-xs">
        <div className="min-w-0">
          <dt className="font-medium tracking-wide text-slate-400 uppercase">CIB</dt>
          <dd className="truncate text-slate-700">{row.cib || '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="font-medium tracking-wide text-slate-400 uppercase">Imóvel</dt>
          <dd className="truncate text-slate-700">{row.imovelRural || '—'}</dd>
        </div>

        {/* Always rendered — previously hidden when empty, which meant a note
            could never be added from a phone. */}
        <div className="col-span-2 min-w-0">
          <dt className="mb-1 font-medium tracking-wide text-slate-400 uppercase">Observações</dt>
          <dd>
            <ObservationCell
              observations={row.observations}
              name={row.name}
              disabled={isMutating}
              onEdit={onEditObservations}
              variant="card"
            />
          </dd>
        </div>
      </dl>
    </article>
  );
}
