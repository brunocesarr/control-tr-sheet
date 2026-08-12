'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useContext, useRef, useState } from 'react';
import {
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdDashboard,
  MdKeyboardCommandKey,
  MdPerson,
  MdTableChart,
} from 'react-icons/md';

import { AlertModal, ConfirmModal, ShortcutsModal } from '@/components/CustomModals';
import SidebarNav, { type NavGroup } from '@/components/sidebar/SidebarNav';
import SidebarUserCard from '@/components/sidebar/SidebarUserCard';
import { useSidebar } from '@/components/sidebar/SidebarProvider';
import { AuthContext } from '@/contexts/useAuthContext';
import { springPanel, springSnap } from '@/helpers/motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

const EXPANDED_WIDTH = 264;
const COLLAPSED_WIDTH = 76;

export default function Sidebar() {
  const { logout, loggedInUser, isAdmin, refreshSession } = useContext(AuthContext);
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [openShortcuts, setOpenShortcuts] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const drawerRef = useRef<HTMLElement>(null);
  useFocusTrap(drawerRef, mobileOpen);

  // `[` toggles the rail, `?` opens the shortcut sheet — both skipped while
  // typing so they never eat characters in the search box.
  useKeyboardShortcut('[', toggleCollapsed);
  useKeyboardShortcut('?', () => setOpenShortcuts(true));
  useKeyboardShortcut('Escape', () => setMobileOpen(false), { allowInInput: true });

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setOpenConfirmModal(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível sair da conta.');
      setOpenAlertModal(true);
    }
  }, [logout]);

  const handleRefreshSession = useCallback(() => {
    void refreshSession();
  }, [refreshSession]);

  const groups: NavGroup[] = [
    {
      title: 'Operação',
      items: [
        {
          href: '/home',
          label: 'Dashboard',
          icon: MdDashboard,
          disabled: !isAdmin,
          disabledReason: 'Disponível apenas para administradores',
        },
      ],
    },
    {
      title: 'Conta',
      items: [{ href: '/profile', label: 'Perfil', icon: MdPerson }],
    },
  ];

  const brand = (
    <div
      className={`flex items-center gap-3 border-b border-white/5 px-4 py-4 ${
        collapsed ? 'justify-center px-0' : ''
      }`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
        <MdTableChart aria-hidden className="text-lg" />
      </span>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="min-w-0">
          <span className="block truncate text-sm font-semibold text-white">Controle de ITR</span>
          <span className="block truncate text-[11px] text-slate-400">Painel administrativo</span>
        </motion.span>
      )}
    </div>
  );

  const footerHelp = !collapsed && (
    <button
      type="button"
      onClick={() => setOpenShortcuts(true)}
      className="mx-3 mb-3 flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-slate-400 focus-ring transition hover:bg-white/[0.06] hover:text-slate-200">
      <span className="flex items-center gap-2">
        <MdKeyboardCommandKey aria-hidden /> Atalhos
      </span>
      <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-sans text-[10px]">
        ?
      </kbd>
    </button>
  );

  return (
    <>
      {/* ── Desktop rail ──────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        transition={springPanel}
        style={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/5 bg-gradient-to-b from-rail-900 to-rail-800 sm:flex">
        {brand}

        <SidebarNav groups={groups} collapsed={collapsed} instanceId="rail" />

        {footerHelp}

        <SidebarUserCard
          name={loggedInUser?.name}
          email={loggedInUser?.email}
          isAdmin={isAdmin}
          collapsed={collapsed}
          onLogout={() => setOpenConfirmModal(true)}
          onRefreshSession={handleRefreshSession}
        />

        {/* Collapse handle straddles the border, the way editors do it. */}
        <motion.button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnap}
          className="absolute top-20 -right-3 z-20 grid size-6 place-items-center rounded-full border border-white/10 bg-slate-800 text-slate-300 shadow-md focus-ring transition-colors hover:bg-slate-700 hover:text-white">
          {collapsed ? <MdChevronRight aria-hidden /> : <MdChevronLeft aria-hidden />}
        </motion.button>
      </motion.aside>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex sm:hidden">
            <motion.div
              role="presentation"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.aside
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={springPanel}
              // Swipe-to-close: the gesture users already expect from native
              // drawers, and it keeps the close button from being the only exit.
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.4, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -450) setMobileOpen(false);
              }}
              className="relative flex w-[17rem] flex-col bg-gradient-to-b from-rail-900 to-rail-800 shadow-overlay">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="absolute top-4 right-3 rounded-md p-1.5 text-slate-400 focus-ring transition hover:bg-white/10 hover:text-white">
                <MdClose aria-hidden />
              </button>

              <div className="pr-10">{brand}</div>

              <SidebarNav
                groups={groups}
                collapsed={false}
                instanceId="drawer"
                onNavigate={() => setMobileOpen(false)}
              />

              <SidebarUserCard
                name={loggedInUser?.name}
                email={loggedInUser?.email}
                isAdmin={isAdmin}
                collapsed={false}
                onLogout={() => {
                  setMobileOpen(false);
                  setOpenConfirmModal(true);
                }}
                onRefreshSession={handleRefreshSession}
              />

              {/* Drag affordance */}
              <span
                aria-hidden
                className="absolute top-1/2 right-1 h-10 w-1 -translate-y-1/2 rounded-full bg-white/10"
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        variant="warning"
        title="Sair da conta"
        message="Sua sessão será encerrada neste dispositivo."
        confirmLabel="Sair"
        confirmAction={handleLogout}
      />
      <AlertModal open={openAlertModal} setOpen={setOpenAlertModal} errorMessage={errorMessage} />
      <ShortcutsModal open={openShortcuts} setOpen={setOpenShortcuts} />
    </>
  );
}
