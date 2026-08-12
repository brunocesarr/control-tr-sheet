'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import { MdLock } from 'react-icons/md';

import Tooltip from '@/components/ui/Tooltip';
import { springSnap, staggerParent, fadeUp } from '@/helpers/motion';

export interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
  disabled?: boolean;
  disabledReason?: string;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarNavProps {
  groups: NavGroup[];
  collapsed: boolean;
  /**
   * The desktop rail and the mobile drawer are mounted at the same time on
   * tablets. Sharing one `layoutId` would make the active pill fly between two
   * detached trees, so each instance namespaces its own.
   */
  instanceId: string;
  onNavigate?: () => void;
}

export default function SidebarNav({ groups, collapsed, instanceId, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <motion.nav
      variants={staggerParent(0.04)}
      initial="hidden"
      animate="visible"
      className="flex scrollbar-slim flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          {/* The label is what makes a collapsed rail unreadable, so it
              collapses to a divider rather than truncating. */}
          {collapsed ? (
            <span aria-hidden className="mx-auto my-1 h-px w-6 bg-white/10" />
          ) : (
            <motion.span
              variants={fadeUp}
              className="px-3 pb-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
              {group.title}
            </motion.span>
          )}

          {group.items.map((item) => {
            const { href, label, icon: Icon, disabled, disabledReason, badge } = item;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            const inner = (
              <>
                {/* Active background is a shared layout element: navigating
                    slides it between items instead of cross-fading two blocks. */}
                {isActive && (
                  <motion.span
                    layoutId={`${instanceId}-active`}
                    transition={springSnap}
                    className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-white/10 ring-inset"
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId={`${instanceId}-active-bar`}
                    transition={springSnap}
                    className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-emerald-400"
                  />
                )}

                <Icon
                  aria-hidden
                  className={`relative z-10 shrink-0 text-lg transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />

                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="relative z-10 flex-1 truncate text-left">
                    {label}
                  </motion.span>
                )}

                {!collapsed && badge && (
                  <span className="relative z-10 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                    {badge}
                  </span>
                )}

                {!collapsed && disabled && (
                  <MdLock aria-hidden className="relative z-10 text-xs text-slate-600" />
                )}
              </>
            );

            const base = `group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors focus-ring ${
              collapsed ? 'justify-center px-0' : 'px-3'
            }`;

            return (
              <motion.div key={href} variants={fadeUp}>
                <Tooltip label={disabled ? (disabledReason ?? label) : label} enabled={collapsed}>
                  {disabled ? (
                    <span
                      aria-disabled
                      title={disabledReason}
                      className={`${base} cursor-not-allowed text-slate-600`}>
                      {inner}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={onNavigate}
                      className={`${base} w-full ${
                        isActive ? 'text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}>
                      {inner}
                    </Link>
                  )}
                </Tooltip>
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.nav>
  );
}
