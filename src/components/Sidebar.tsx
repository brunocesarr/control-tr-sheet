import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { BsArrowLeftCircle } from 'react-icons/bs';
import { CgProfile } from 'react-icons/cg';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdDashboard } from 'react-icons/md';
import { PiSignOut } from 'react-icons/pi';

import { AuthContext } from '@/contexts/useAuthContext';

import { AlertModal, ConfirmModal } from './CustomModals';

const Sidebar = () => {
  const { logout, loggedInUser } = useContext(AuthContext);

  const [open, setOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const pathname = usePathname();

  const Menus = [
    { title: 'Dashboard', path: '/home', src: <MdDashboard /> },
    { title: 'Conta', path: '/profile', src: <CgProfile /> },
  ];

  const isAdmin = loggedInUser?.labels.includes('admin');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao realizar o logout.');
      setOpenAlertModal(true);
    }
  };

  return (
    <>
      <aside className="relative hidden min-h-screen w-fit border-r border-gray-600 bg-slate-900 p-5 shadow shadow-gray-900 duration-300 sm:block">
        <div className="flex h-full flex-col items-stretch justify-between">
          <div>
            <BsArrowLeftCircle
              className={`${
                !open && 'rotate-180'
              } absolute -right-4 top-9 cursor-pointer rounded-full bg-gray-900 fill-gray-400 text-3xl`}
              onClick={() => setOpen(!open)}
            />
            {open && (
              <Link href="/">
                <div className={`flex flex-row ${open && 'gap-x-4'} items-center justify-end`}>
                  <span className="whitespace-nowrap text-xl font-medium text-white">Painel</span>
                </div>
                <hr className="my-2 h-px border-t-0 bg-neutral-100" />
              </Link>
            )}
            <ul>
              {Menus.map((menu, index) => (
                <Link href={menu.path} key={index} className="w-full">
                  <button
                    disabled={menu.path === '/home' && !isAdmin}
                    className={`mt-2 flex w-full cursor-pointer items-center gap-x-6 rounded-lg p-3 text-base font-normal text-white ${
                      pathname === menu.path && 'bg-gray-200 dark:bg-gray-700'
                    } ${menu.path === '/home' && !isAdmin ? 'opacity-50' : 'hover:bg-gray-700'}`}>
                    <span className="text-2xl">{menu.src}</span>
                    <span className={`${!open && 'hidden'} origin-left duration-300 hover:block`}>
                      {menu.title}
                    </span>
                  </button>
                </Link>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setOpenConfirmModal(true)}
            className="flex w-full cursor-pointer items-center gap-x-6 rounded-lg p-3 text-base font-normal text-white hover:bg-gray-700">
            <span className="text-2xl">
              <PiSignOut />
            </span>
            <span className={`${!open && 'hidden'} origin-left duration-300 hover:block`}>
              Sair
            </span>
          </button>
        </div>
      </aside>
      {/* Mobile Menu */}
      <div className="absolute left-0 top-0 block p-2 sm:hidden">
        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="flex w-full cursor-pointer items-center gap-x-6 rounded-lg bg-gray-900 p-3 text-base font-normal text-white hover:bg-gray-800">
          <span className="text-2xl">
            <GiHamburgerMenu />
          </span>
        </button>
      </div>
      <div className="sm:hidden">
        <div
          className={`${
            mobileMenu ? 'flex' : 'hidden'
          } md absolute inset-x-6 z-50 mt-16 flex-col items-center space-y-6 self-end rounded-xl bg-slate-900 py-8 font-bold text-white drop-shadow sm:w-auto`}>
          {Menus.map((menu, index) => (
            <Link href={menu.path} key={index} onClick={() => setMobileMenu(false)}>
              <span
                className={` ${
                  pathname === menu.path && 'bg-gray-700'
                } rounded-xl p-2 hover:bg-gray-700`}>
                {menu.title}
              </span>
            </Link>
          ))}
          <button
            onClick={() => setOpenConfirmModal(true)}
            className="flex w-full cursor-pointer items-center justify-center rounded-lg text-base font-bold text-white">
            <span className="rounded-xl hover:bg-gray-200">Sair</span>
          </button>
        </div>
      </div>
      <ConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        modalDescription="Deseja realmente sair?"
        confirmAction={handleLogout}
      />
      <AlertModal open={openAlertModal} setOpen={setOpenAlertModal} errorMessage={errorMessage} />
    </>
  );
};

export default Sidebar;
