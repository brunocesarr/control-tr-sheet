'use client';

import type { Models } from 'appwrite';
import { motion } from 'motion/react';
import { MdCheck, MdContentCopy, MdLogout, MdVerifiedUser } from 'react-icons/md';

import Avatar from '@/components/ui/Avatar';
import { fadeInUp, springSnappy } from '@/configs/motion';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

interface ProfileHeaderProps {
  user: Models.User<Models.Preferences>;
  isAdmin: boolean;
  onLogout: () => void;
}

/**
 * Identity block for the profile page. The old page opened straight into a form
 * with no sense of "this is you", so the banner + avatar establish that first.
 */
export default function ProfileHeader({ user, isAdmin, onLogout }: ProfileHeaderProps) {
  const { copy, copiedKey } = useCopyToClipboard();

  return (
    <motion.section
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* ── Banner ────────────────────────────────────────────────────── */}
      <div className="relative h-24 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800">
        <span
          aria-hidden
          className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px] opacity-20"
        />
        <motion.span
          aria-hidden
          animate={{ x: [0, 18, 0], y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
          className="absolute -top-6 right-10 size-36 rounded-full bg-brand-accent/40 blur-2xl"
        />
      </div>

      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-end gap-4">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springSnappy, delay: 0.1 }}
            className="-mt-10 shrink-0">
            <Avatar name={user.name} email={user.email} size="xl" className="ring-4 ring-white" />
          </motion.div>

          <div className="min-w-0 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 id="profile-name" className="truncate text-xl font-bold text-slate-900">
                {user.name || 'Usuário sem nome'}
              </h1>
              {isAdmin && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
                  <MdVerifiedUser aria-hidden /> Administrador
                </motion.span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-1.5">
              <p id="profile-email" className="truncate text-sm text-slate-600">
                {user.email}
              </p>
              <button
                type="button"
                onClick={() => void copy(user.email, 'profile-email')}
                aria-label="Copiar e-mail"
                className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-700">
                {copiedKey === 'profile-email' ? (
                  <MdCheck aria-hidden className="text-emerald-600" />
                ) : (
                  <MdContentCopy aria-hidden />
                )}
              </button>
            </div>

            <p id="profile-created-at" className="mt-1 text-xs text-slate-400">
              Membro desde {dateFormatter.format(new Date(user.$createdAt))}
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          onClick={onLogout}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
          <MdLogout aria-hidden /> Sair
        </motion.button>
      </div>
    </motion.section>
  );
}
