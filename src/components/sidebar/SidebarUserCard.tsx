'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { MdLogout, MdMoreHoriz, MdPerson, MdRefresh } from 'react-icons/md';
import Link from 'next/link';

import Avatar from '@/components/ui/Avatar';
import { fadeScale, springSnap } from '@/helpers/motion';

interface SidebarUserCardProps {
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
  collapsed: boolean;
  onLogout: () => void;
  onRefreshSession: () => void;
}

/**
 * Moved to the *bottom* of the rail with an actions popover.
 *
 * Previously the identity block sat on top and logout was a loose red button in
 * the nav list — visually competing with navigation for the same attention.
 * Grouping identity + account actions in one footer is the pattern users now
 * expect (Linear, Vercel, Supabase all do this) and it frees the top for brand.
 */
export default function SidebarUserCard({
  name,
  email,
  isAdmin,
  collapsed,
  onLogout,
  onRefreshSession,
}: SidebarUserCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative border-t border-white/5 p-3">
      <AnimatePresence>
        {menuOpen && (
          <>
            <div
              role="presentation"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-10"
            />
            <motion.div
              variants={fadeScale}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute bottom-full left-3 z-20 mb-2 w-[calc(100%-1.5rem)] min-w-52 origin-bottom overflow-hidden rounded-lg border border-white/10 bg-slate-800 p-1 shadow-overlay">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                <MdPerson aria-hidden /> Meu perfil
              </Link>
              <button
                type="button"
                onClick={() => {
                  onRefreshSession();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10">
                <MdRefresh aria-hidden /> Renovar sessão
              </button>
              <span aria-hidden className="my-1 block h-px bg-white/10" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10">
                <MdLogout aria-hidden /> Sair da conta
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        aria-expanded={menuOpen}
        aria-label="Ações da conta"
        whileTap={{ scale: 0.98 }}
        transition={springSnap}
        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left focus-ring transition-colors hover:bg-white/5 ${
          collapsed ? 'justify-center' : ''
        }`}>
        <Avatar name={name} email={email} size="sm" />

        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-white">{name || 'Usuário'}</span>
                {isAdmin && (
                  <span className="rounded bg-emerald-500/15 px-1 py-px text-[9px] font-bold tracking-wide text-emerald-300 uppercase">
                    Admin
                  </span>
                )}
              </span>
              <span className="block truncate text-xs text-slate-400">{email}</span>
            </span>
            <MdMoreHoriz aria-hidden className="shrink-0 text-slate-400" />
          </>
        )}
      </motion.button>
    </div>
  );
}
