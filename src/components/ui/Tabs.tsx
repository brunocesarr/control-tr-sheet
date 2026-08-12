'use client';

import { motion } from 'motion/react';

import { springSnappy } from '@/configs/motion';

export interface TabDefinition<T extends string> {
  id: T;
  label: string;
  icon?: React.ElementType;
  /** Drives the active pill colour. 'danger' turns it red. */
  tone?: 'default' | 'danger';
  /** Renders a status dot. */
  alert?: boolean;
}

interface TabsProps<T extends string> {
  tabs: TabDefinition<T>[];
  active: T;
  onChange: (id: T) => void;
  /** Unique per Tabs instance so layoutIds never collide across mounts. */
  scope: string;
}

/**
 * Hex rather than Tailwind classes: the pill is a single shared-layout element,
 * so its colour has to be an animatable value, not a swapped class name.
 * slate-900 / red-600.
 */
const PILL_COLOR = {
  default: '#0f172a',
  danger: '#dc2626',
} as const;

export default function Tabs<T extends string>({ tabs, active, onChange, scope }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className="flex scrollbar-slim gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card">
      {tabs.map(({ id, label, icon: Icon, tone = 'default', alert }) => {
        const isActive = id === active;

        return (
          <button
            key={id}
            role="tab"
            type="button"
            id={`${scope}-tab-${id}`}
            aria-selected={isActive}
            aria-controls={`${scope}-panel-${id}`}
            onClick={() => onChange(id)}
            /**
             * `isolate` is the fix for the invisible active tab.
             *
             * The pill previously used `-z-10`, which escaped this button and
             * painted behind the tablist's own `bg-white` — so the pill vanished
             * and `text-white` sat on a white background. The pill is now a
             * plain `absolute inset-0` layer with the label lifted above it by
             * `relative z-10`, and `isolate` contains the whole stack here.
             */
            className={`relative isolate flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? 'text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}>
            {isActive && (
              <motion.span
                layoutId={`${scope}-tab-indicator`}
                initial={false}
                animate={{ backgroundColor: PILL_COLOR[tone] }}
                transition={springSnappy}
                className="absolute inset-0 rounded-xl shadow-sm"
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              {Icon && <Icon aria-hidden className="text-base" />}
              {label}
              {alert && (
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${isActive ? 'bg-white/70' : 'bg-red-500'}`}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
