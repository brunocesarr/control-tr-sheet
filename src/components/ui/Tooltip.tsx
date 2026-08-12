'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';

import { springSnap } from '@/helpers/motion';

interface TooltipProps {
  label: string;
  /** Set false to render children untouched — used by the expanded sidebar. */
  enabled?: boolean;
  side?: 'right' | 'top';
  children: ReactNode;
}

/**
 * Minimal tooltip for the collapsed sidebar rail, where icons are the only
 * affordance left. Opens on hover *and* focus so it is reachable by keyboard.
 */
export default function Tooltip({ label, enabled = true, side = 'right', children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  if (!enabled) return <>{children}</>;

  const position =
    side === 'right'
      ? 'top-1/2 left-full ml-3 -translate-y-1/2'
      : 'bottom-full left-1/2 mb-2 -translate-x-1/2';

  return (
    <span
      className="relative flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}>
      <span aria-describedby={open ? id : undefined} className="flex w-full">
        {children}
      </span>

      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.92, x: side === 'right' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={springSnap}
            className={`pointer-events-none absolute z-50 rounded-md bg-slate-800 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-lg ring-1 ring-white/10 ${position}`}>
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
