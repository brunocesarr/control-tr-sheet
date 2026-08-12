'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

import { listItem } from '@/configs/motion';

interface SettingsCardProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  tone?: 'default' | 'danger';
  children: ReactNode;
  /** Sticky action row. Keeps the primary button anchored below the fields. */
  footer?: ReactNode;
}

/**
 * Consumes `listItem` variants, so any parent using `listContainer` staggers
 * these cards in automatically without prop drilling delays.
 */
export default function SettingsCard({
  title,
  description,
  icon: Icon,
  tone = 'default',
  children,
  footer,
}: SettingsCardProps) {
  const isDanger = tone === 'danger';

  return (
    <motion.section
      variants={listItem}
      className={`overflow-hidden rounded-2xl border shadow-card ${
        isDanger ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white'
      }`}>
      <header className="flex items-start gap-3 px-5 pt-5">
        {Icon && (
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-xl ${
              isDanger ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
            }`}>
            <Icon aria-hidden className="text-lg" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className={`text-base font-semibold ${isDanger ? 'text-red-800' : 'text-slate-900'}`}>
            {title}
          </h2>
          {description && (
            <p className={`mt-0.5 text-sm ${isDanger ? 'text-red-700' : 'text-slate-600'}`}>
              {description}
            </p>
          )}
        </div>
      </header>

      <div className="px-5 py-5">{children}</div>

      {footer && (
        <footer
          className={`border-t px-5 py-3.5 ${
            isDanger ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50/60'
          }`}>
          {footer}
        </footer>
      )}
    </motion.section>
  );
}
