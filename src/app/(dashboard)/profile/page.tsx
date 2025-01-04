'use client';

import Navbar from '@/components/Navbar';
import { AuthContext } from '@/contexts/useAuthContext';
import { useContext } from 'react';

export default function Profile() {
  const { loggedInUser, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
      alert('Erro ao realizar o logout.');
    }
  };

  if (!loggedInUser) {
    return <div className="text-black">Usuário nao encontrado</div>;
  }

  return (
    <div>
      <Navbar>
        <p>Configuracoes de conta</p>
      </Navbar>
      <p>Logged in as {loggedInUser.name}</p>
      <button
        type="button"
        className="flex items-center justify-center w-full  min-h-[48px] cursor-pointer rounded-md transition center bg-cyan-900 hover:bg-cyan-800 hover:scale-105 mt-4"
        onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
