'use client';

import Navbar from '@/components/Navbar';
import { AuthContext } from '@/contexts/useAuthContext';

import { useContext, useState } from 'react';
import { PiSignOut } from 'react-icons/pi';
import { GoAlertFill } from 'react-icons/go';
import { redirect } from 'next/navigation';
import { AlertModal, ConfirmModal, InputModal } from '@/components/CustomModals';
import { validateEmail, validateName, validatePassword } from '@/helpers/validators';
import { Bounce, toast, ToastContainer } from 'react-toastify';
import Loader from '@/components/Loader';

export default function Profile() {
  const { loggedInUser, logout, updateName, updateEmail, updatePassword, isLoading } =
    useContext(AuthContext);

  const [newName, setNewName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [openInputModal, setOpenInputModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao realizar o logout.');
      setOpenAlertModal(true);
    }
  };

  const handleNewNome = async () => {
    try {
      if (!validateName(newName)) {
        setErrorMessage('Insira um nome válido.');
        setOpenAlertModal(true);
        return;
      }

      await updateName(newName);
      setTimeout(() => {
        toast.success('Alteracao realizada com sucesso.');
      }, 1000);
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao realizar a alteracao do nome.');
      setOpenAlertModal(true);
    }
  };

  const handleNewEmail = async (newEmail: string) => {
    try {
      if (!validateEmail(newEmail)) {
        setErrorMessage('Insira um endereco de e-mail válido.');
        setOpenAlertModal(true);
        return;
      }

      await updateEmail(newEmail);
      setTimeout(() => {
        toast.success('Alteracao realizada com sucesso.');
      }, 1000);
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao realizar a alteracao do email.');
      setOpenAlertModal(true);
    }
  };

  const handleNewPassword = async () => {
    try {
      if (!validatePassword(newPassword)) {
        setErrorMessage('Insira uma senha válido.');
        setOpenAlertModal(true);
        return;
      }

      await updatePassword(oldPassword, newPassword);
      setTimeout(() => {
        toast.success('Alteracao realizada com sucesso.');
      }, 1000);
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao realizar a alteracao da senha.');
      setOpenAlertModal(true);
    }
  };

  if (!loggedInUser) {
    return redirect('/login');
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div>
      <Navbar>
        <p>Configuracoes de conta</p>
      </Navbar>
      {isLoading && <Loader />}
      {!isLoading && (
        <div className="px-4 h-full w-full">
          <div className="flex flex-row items-center justify-between px-2">
            <h1 className="border-b py-6 text-4xl font-semibold">Bem vindo, {loggedInUser.name}</h1>
            <button
              type="button"
              className="flex items-center justify-center gap-2 w-fit min-h-[48px] p-4 cursor-pointer rounded-md transition center text-white bg-red-900 hover:bg-red-800 hover:scale-105"
              onClick={() => setOpenConfirmModal(true)}>
              <PiSignOut /> Sair
            </button>
          </div>
          <div className="grid grid-cols-8 pt-3 sm:grid-cols-10">
            <div className="col-span-12 overflow-hidden rounded-xl sm:bg-gray-50 sm:px-8 sm:shadow">
              <p className="py-2 text-xl font-semibold">Endereco de Email</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-600">
                  Seu email é <strong>{loggedInUser.email}</strong>
                </p>
                <button
                  onClick={() => setOpenInputModal(true)}
                  className="inline-flex text-sm font-semibold text-blue-600 underline decoration-2">
                  Alterar
                </button>
              </div>
              <hr className="mt-4 mb-8" />
              <p className="py-2 text-xl font-semibold">Nome</p>
              <div className="flex items-center">
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <label>
                    <span className="text-sm text-gray-500">Insira o novo nome</span>
                    <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-blue-600">
                      <input
                        type="text"
                        className="w-full flex-shrink appearance-none border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                        placeholder={loggedInUser.name}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                  </label>
                </div>
              </div>
              <button
                disabled={!newName}
                onClick={handleNewNome}
                className="mt-4 rounded-lg bg-gray-600 px-4 py-2 text-white">
                Salvar novo nome
              </button>
              <hr className="mt-4 mb-8" />
              <p className="py-2 text-xl font-semibold">Senha</p>
              <div className="flex items-center">
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <label>
                    <span className="text-sm text-gray-500">Insira a senha antiga</span>
                    <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-blue-600">
                      <input
                        type="password"
                        className="w-full flex-shrink appearance-none border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                        placeholder="********"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                    </div>
                  </label>
                  <label>
                    <span className="text-sm text-gray-500">Insira a senha nova</span>
                    <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-blue-600">
                      <input
                        type="password"
                        className="w-full flex-shrink appearance-none border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                        placeholder="********"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </label>
                </div>
              </div>
              <button
                disabled={!newPassword || !oldPassword}
                onClick={handleNewPassword}
                className="mt-4 rounded-lg bg-gray-600 px-4 py-2 text-white">
                Salvar nova senha
              </button>
              <hr className="mt-4 mb-8" />

              <div className="mb-10 hidden">
                <p className="py-2 text-xl font-semibold">Apagar conta</p>
                <p className="inline-flex items-center rounded-full bg-rose-100 px-4 py-1 text-rose-600">
                  <GoAlertFill className="text-rose-600 mr-2" />
                  Prossiga com cuidado
                </p>
                <p className="mt-2">
                  Certifique-se de ter feito backup de sua conta caso precise obter acesso aos seus
                  dados. Limparemos completamente seus dados. Não há como acessar seu conta após
                  esta ação.
                </p>
                <button className="ml-auto text-sm font-semibold text-rose-600 underline decoration-2">
                  Continue com a exclusao da conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AlertModal open={openAlertModal} setOpen={setOpenAlertModal} errorMessage={errorMessage} />
      <InputModal
        open={openInputModal}
        setOpen={setOpenInputModal}
        modalDescription={'Insira o novo email'}
        confirmValue={handleNewEmail}
      />
      <ConfirmModal
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
        modalDescription={'Deseja realmente sair?'}
        confirmAction={handleLogout}
      />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </div>
  );
}
