'use client';

interface StatusToggleProps {
  hasDone: boolean;
  label: string;
  name: string;
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * Switch-style status control.
 *
 * Replaces the previous icon + text pair, which read as decoration rather than
 * something clickable. `role="switch"` + `aria-checked` gives screen readers the
 * on/off semantics a plain button lacks.
 */
export default function StatusToggle({
  hasDone,
  label,
  name,
  disabled = false,
  onToggle,
}: StatusToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={hasDone}
      aria-label={`${hasDone ? 'Desmarcar' : 'Marcar'} entrega de ${name}`}
      onClick={onToggle}
      disabled={disabled}
      className="group inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          hasDone ? 'bg-emerald-500' : 'bg-slate-300 group-hover:bg-slate-400'
        }`}>
        <span
          className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${
            hasDone ? 'translate-x-[1.375rem]' : 'translate-x-[0.1875rem]'
          }`}
        />
      </span>
      <span
        className={`text-xs font-medium whitespace-nowrap ${
          hasDone ? 'text-emerald-700' : 'text-slate-500'
        }`}>
        {label}
      </span>
    </button>
  );
}
