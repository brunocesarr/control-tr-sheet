'use client';

import { useId, useState } from 'react';
import { MdKeyboardCapslock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  /** Shown only when truthy — pair with a `touched` flag to avoid shouting early. */
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
}

/**
 * Single input with label, inline error, optional reveal toggle and a Caps Lock
 * warning on password fields — the most common cause of "wrong password".
 */
export default function TextField({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  hint,
  error,
  disabled = false,
  autoFocus = false,
  onBlur,
}: TextFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && revealed ? 'text' : type;
  const describedBy = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          onKeyUp={
            isPassword
              ? (event) => setCapsLock(event.getModifierState?.('CapsLock') ?? false)
              : undefined
          }
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
            isPassword ? 'pr-11' : ''
          } ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
          }`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            {revealed ? <MdVisibilityOff aria-hidden /> : <MdVisibility aria-hidden />}
          </button>
        )}
      </div>

      {capsLock && !error && (
        <p className="flex items-center gap-1 text-xs text-amber-600">
          <MdKeyboardCapslock aria-hidden /> Caps Lock está ativado.
        </p>
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
