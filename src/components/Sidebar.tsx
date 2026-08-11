'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContext, useState } from 'react';
import { MdClose, MdDashboard, MdLogout, MdMenu, MdPerson } from 'react-icons/md';

import { AlertModal, ConfirmModal } from '@/components/CustomModals';
import { AuthContext } from '@/contexts/useAuthContext';

/** Now consumes `isAdmin` from context rather than re-deriving it from labels. */
export default function Sidebar() {
  const { logout, loggedInUser, isAdmin } = useContext(AuthContext);
  const pathname = usePathname();

  const [mobileMenu, setMobileMenu] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      setOpenConfirmModal(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível sair da conta.');
      setOpenAlertModal(true);
    }
  };

  const links = [
    { href: '/home', label: 'Dashboard', icon: MdDashboard, disabled: !isAdmin },
    { href: '/profile', label: 'Perfil', icon: MdPerson, disabled: false },
  ];

  const navigation = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {links.map(({ href, label, icon: Icon, disabled }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        if (disabled) {
          return (
            <span
              key={href}
              title="Disponível apenas para administradores"
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500">
              <Icon aria-hidden className="text-lg" /> {label}
            </span>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileMenu(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
              isActive ? 'bg-slate-800 font-medium text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}>
            <Icon aria-hidden className="text-lg" /> {label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={() => setOpenConfirmModal(true)}
        className="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-sm text-red-300 transition hover:bg-slate-800">
        <MdLogout aria-hidden className="text-lg" /> Sair
      </button>
    </nav>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileMenu(true)}
        aria-label="Abrir menu"
        className="fixed top-3 left-3 z-40 rounded-md bg-slate-900 p-2 text-white sm:hidden">
        <MdMenu aria-hidden />
      </button>

      {/* Desktop */}
      <aside className="hidden min-h-screen w-60 flex-col border-r border-slate-700 bg-slate-900 sm:flex">
        <div className="border-b border-slate-700 p-4">
          <p id="sidebar-user-name" className="truncate text-sm font-medium text-white">
            {loggedInUser?.name || 'Usuário'}
          </p>
          <p id="sidebar-user-email" className="truncate text-xs text-slate-400">
            {loggedInUser?.email}
          </p>
          {isAdmin && (
            <span className="mt-2 inline-block rounded bg-emerald-600/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400 uppercase">
              Admin
            </span>
          )}
        </div>
        {navigation}
      </aside>

      {/* Mobile drawer */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div
            role="presentation"
            onClick={() => setMobileMenu(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="relative flex w-64 flex-col bg-slate-900">
            <button
              type="button"
              onClick={() => setMobileMenu(false)}
              aria-label="Fechar menu"
              className="absolute top-3 right-3 text-slate-400">
              <MdClose aria-hidden />
            </button>
            <div className="border-b border-slate-700 p-4 pr-10">
              <p className="truncate text-sm font-medium text-white">
                {loggedInUser?.name || 'Usuário'}
              </p>
              <p className="truncate text-xs text-slate-400">{loggedInUser?.email}</p>
            </div>
            {navigation}
          </aside>
        </div>
      )}

      <ConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        title="Sair da conta"
        message="Deseja encerrar sua sessão?"
        confirmLabel="Sair"
        confirmAction={handleLogout}
      />
      <AlertModal open={openAlertModal} setOpen={setOpenAlertModal} errorMessage={errorMessage} />
    </>
  );
}
