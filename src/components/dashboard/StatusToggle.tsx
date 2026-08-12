'use client';

import { motion } from 'motion/react';

import { springSnap } from '@/helpers/motion';

interface StatusToggleProps {
  hasDone: boolean;
  label: string;
  name: string;
  disabled?: boolean;
  onToggle: () => void;
}

/**
 * Same semantics as before (`role="switch"` + `aria-checked`); the knob now
 * travels on a spring instead of a CSS transform swap, and the label
 * crossfades. Small thing, but this is the control the team clicks hundreds of
 * times a season, so it is worth the tactility.
 */
export default function StatusToggle({
  hasDone,
  label,
  name,
  disabled = false,
  onToggle,
}: StatusToggleProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={hasDone}
      aria-label={`${hasDone ? 'Desmarcar' : 'Marcar'} entrega de ${name}`}
      onClick={onToggle}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={springSnap}
      className="group inline-flex items-center gap-2 rounded-md focus-ring disabled:cursor-not-allowed disabled:opacity-50">
      <motion.span
        animate={{ backgroundColor: hasDone ? '#10b981' : '#cbd5e1' }}
        transition={{ duration: 0.2 }}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full px-[3px] group-hover:brightness-95">
        <motion.span
          layout
          transition={springSnap}
          style={{ marginLeft: hasDone ? 'auto' : 0 }}
          className="block size-3.5 rounded-full bg-white shadow-sm"
        />
      </motion.span>

      <motion.span
        key={label}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className={`text-xs font-medium whitespace-nowrap ${
          hasDone ? 'text-emerald-700' : 'text-slate-500'
        }`}>
        {label}
      </motion.span>
    </motion.button>
  );
}
