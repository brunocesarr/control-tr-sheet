import React, { useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import { BsArrowLeftCircle } from 'react-icons/bs';
import { CgProfile } from 'react-icons/cg';
import { PiSignOut } from 'react-icons/pi';
import { MdDashboard } from 'react-icons/md';
import { GiHamburgerMenu } from 'react-icons/gi';
import { AuthContext } from '@/contexts/useAuthContext';

const Sidebar = () => {
  const { logout, loggedInUser } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
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
      alert('Erro ao realizar o logout.');
    }
  };

  return (
    <>
      <aside
        className={
          'w-fit min-h-screen sm:block hidden relative duration-300 border-r border-gray-600 p-5 bg-slate-900 shadow shadow-gray-900'
        }>
        <div className="h-full flex flex-col items-stretch justify-between">
          <div>
            <BsArrowLeftCircle
              className={`${
                !open && 'rotate-180'
              } absolute text-3xl rounded-full cursor-pointer top-9 -right-4 fill-gray-400 bg-gray-900`}
              onClick={() => setOpen(!open)}
            />
            {open && (
              <Link href="/">
                <div className={`flex flex-row ${open && 'gap-x-4'} items-center justify-end`}>
                  <span className="text-xl font-medium whitespace-nowrap text-white">Painel</span>
                </div>
                <hr className="h-[1px] my-2 border-t-0 bg-neutral-100" />
              </Link>
            )}
            <ul>
              {Menus.map((menu, index) => (
                <Link href={menu.path} key={index} className="w-full">
                  <button
                    disabled={menu.path === '/home' && !isAdmin}
                    className={`flex items-center w-full gap-x-6 p-3 text-base font-normal rounded-lg cursor-pointer text-white mt-2 ${
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
            onClick={handleLogout}
            className="flex items-center w-full gap-x-6 p-3 text-base font-normal rounded-lg cursor-pointer text-white hover:bg-gray-700">
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
      <div className="absolute top-0 left-0 p-2 sm:hidden block">
        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="flex items-center w-full gap-x-6 p-3 text-base font-normal rounded-lg cursor-pointer text-white bg-gray-900 hover:bg-gray-800">
          <span className="text-2xl">
            <GiHamburgerMenu />
          </span>
        </button>
      </div>
      <div className="sm:hidden">
        <div
          className={`${
            mobileMenu ? 'flex' : 'hidden'
          } absolute z-50 flex-col items-center self-end py-8 mt-16 space-y-6 font-bold sm:w-auto left-6 right-6 text-white bg-slate-900 drop-shadow md rounded-xl`}>
          {Menus.map((menu, index) => (
            <Link href={menu.path} key={index} onClick={() => setMobileMenu(false)}>
              <span
                className={` ${
                  pathname === menu.path && 'bg-gray-700'
                } p-2 rounded-xl hover:bg-gray-700`}>
                {menu.title}
              </span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full text-base font-bold rounded-lg cursor-pointer text-white">
            <span className={'rounded-xl hover:bg-gray-200'}>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
