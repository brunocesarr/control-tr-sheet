'use client';

import { motion } from 'motion/react';

import SidebarTrigger from '@/components/sidebar/SidebarTrigger';
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
 * `bg-slate-900` is opaque and from the core palette — no custom token, no
 * color-mix. The frosted look is a progressive enhancement behind
 * @supports, so if backdrop-filter is unavailable the solid base remains and
 * `text-white` never lands on a light background.
 */
export default function Navbar({ children, eyebrow, actions }: INavbarProps) {
  return (
    <nav className="sticky top-0 isolate z-30 border-b border-white/10 bg-slate-900 supports-[backdrop-filter]:bg-slate-900/90 supports-[backdrop-filter]:backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-transparent to-emerald-900/40"
      />

      {/*
        pl-16 is gone. It reserved room for a `fixed` button that no longer
        exists, which is why mobile showed an empty gap where the hamburger
        should be. The trigger is now a real flex child, so spacing is
        automatic and nothing overlaps the title.
      */}
      <div className="relative flex items-center gap-3 px-4 py-3.5 sm:px-6">
        <SidebarTrigger />

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="min-w-0 flex-1">
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
