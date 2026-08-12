'use client';

import { motion } from 'motion/react';

import { fadeInUp } from '@/configs/motion';

interface INavbarProps {
  children: React.ReactNode;
  /** Small eyebrow above the title — breadcrumb or section name. */
  eyebrow?: string;
  actions?: React.ReactNode;
}

/**
 * Contrast-safe top bar.
 *
 * Previously `bg-sidebar/90 backdrop-blur-md`. The alpha modifier compiles to
 * `color-mix(in oklab, var(--color-sidebar) 90%, transparent)`; when that token
 * failed to resolve the whole declaration was dropped, leaving a transparent bar
 * with `text-white` on a light page — the title vanished.
 *
 * Now the readable surface is `bg-slate-900`: a core palette colour, fully
 * opaque, no color-mix, no custom token. The frosted look is re-applied as a
 * progressive enhancement behind @supports, so if backdrop-filter is
 * unavailable or misbehaves the solid base is still there.
 */
export default function Navbar({ children, eyebrow, actions }: INavbarProps) {
  return (
    <nav className="sticky top-0 isolate z-30 border-b border-white/10 bg-slate-900 supports-[backdrop-filter]:bg-slate-900/90 supports-[backdrop-filter]:backdrop-blur-md">
      {/*
        Decorative only. Negative z-index keeps it above the nav's own
        background but below all content, and `isolate` on the nav contains the
        stack so it can never escape behind an ancestor's background.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-transparent to-emerald-900/40"
      />

      {/* pl-16 clears the fixed mobile sidebar trigger; reset from `sm`. */}
      <div className="relative flex items-center justify-between gap-4 px-4 py-3.5 pl-16 sm:px-6 sm:pl-6">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="min-w-0">
          {eyebrow && (
            <span className="block text-[10px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
              {eyebrow}
            </span>
          )}
          <h1 className="truncate text-lg font-semibold text-white sm:text-xl">{children}</h1>
        </motion.div>

        {actions && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.05 }}
            className="flex shrink-0 items-center gap-2">
            {actions}
          </motion.div>
        )}
      </div>

      <span
        aria-hidden
        className="block h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"
      />
    </nav>
  );
}
