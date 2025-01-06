'use client';

import loginImg from '@/assets/log-in.svg';
import eye from '@/assets/eye.svg';

import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { CiUser } from 'react-icons/ci';
import { MdAlternateEmail } from 'react-icons/md';
import { TbLockPassword } from 'react-icons/tb';
import Image from 'next/image';
import { useContext, useState } from 'react';
import { AuthContext } from '@/contexts/useAuthContext';
import { redirect } from 'next/navigation';
import { AlertModal } from '@/components/CustomModals';
import { validateEmail, validateName, validatePassword } from '@/helpers/validators';

const RegisterPage = () => {
  const { register, isLoading } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordShow, setPasswordShow] = useState(false);
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isValidName = name ? validateName(name) : true;
  const isValidCurrentEmail = email ? validateEmail(email) : true;
  const isValidCurrentPassword = password ? validatePassword(password) : true;

  const handleRegister = async () => {
    try {
      if (!email || !password) {
        setErrorMessage('Preencha todos os campos');
        setOpenAlertModal(true);
        return;
      }
      await register(email, password, name);
    } catch (error) {
      console.error(error);
      setErrorMessage('Erro ao realizar o cadastro.');
      setOpenAlertModal(true);
    }
  };

  const handleLogin = () => {
    redirect('/login');
  };

  const handlePasswordShow = () => {
    setPasswordShow(!passwordShow);
  };

  return (
    <div className="flex flex-row text-base font-poppins bg-gray-700 text-white">
      <div className="flex flex-col md:flex w-full md:flex-col">
        <div className="flex flex-col p-8 gap-2 rounded-2xl md:bg-form md:w-[600px] md:m-auto bg-slate-800 shadow-md shadow-slate-400">
          <div className="flex flex-col gap-3 self-start py-2">
            <div className="flex flex-row gap-4">
              <Image className="w-[24px]" src={loginImg} alt="Imagem de Login" />
              <h1 className="text-xl">Faça seu cadastro</h1>
            </div>
          </div>

          <div className="flex flex-col py-2">
            <form className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="mb-2 font-bold text-base">Nome</label>
                <div className={`flex flex-col relative justify-center`}>
                  <CiUser
                    className={`text-xl absolute left-2 ${name ? (isValidName ? 'text-amber-400' : 'text-red-600') : 'text-gray-400'}`}
                  />
                  <input
                    className={`w-full rounded text-black border-2 p-2 pl-8 outline-none bg-form hover:border-prim focus:border-amber-400 ${!isValidName ? 'border-red-600' : 'border-white'}`}
                    type="text"
                    placeholder="Digite seu nome"
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    value={name}
                  />
                </div>
                {!isValidName && (
                  <label className="mt-0.5 font-light text-xs text-red-600">
                    Insira um nome válido
                  </label>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-bold text-base">E-mail</label>
                <div className={`flex flex-col relative justify-center`}>
                  <MdAlternateEmail
                    className={`text-xl absolute left-2 ${email ? (isValidCurrentEmail ? 'text-amber-400' : 'text-red-600') : 'text-gray-400'}`}
                  />
                  <input
                    className={`w-full rounded text-black border-2 p-2 pl-8 outline-none bg-form hover:border-prim focus:border-amber-400 ${!isValidCurrentEmail ? 'border-red-600' : 'border-white'}`}
                    type="email"
                    placeholder="Digite seu email"
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    value={email}
                  />
                </div>
                {!isValidCurrentEmail && (
                  <label className="mt-0.5 font-light text-xs text-red-600">
                    Insira um e-mail válido
                  </label>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-bold text-base">Senha</label>
                <div className={'flex flex-col relative justify-center'}>
                  <TbLockPassword
                    className={`text-xl absolute left-2 ${password ? (isValidCurrentPassword ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}
                  />
                  <input
                    className={`w-full rounded border-2 p-2 pl-8 outline-none hover:border-prim focus:border-amber-400 text-black ${!isValidCurrentPassword ? 'border-red-600' : 'border-white'}`}
                    type={passwordShow ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <Image
                    className="absolute right-3 cursor-pointer"
                    title={passwordShow ? 'Esconder Senha' : 'Mostrar Senha'}
                    src={eye}
                    onClick={handlePasswordShow}
                    alt="Botão de aparecer mensagem"
                  />
                </div>
                {!isValidCurrentPassword && (
                  <label className="mt-0.5 font-light text-xs text-red-600">
                    Insira uma senha válida
                  </label>
                )}
              </div>

              <button
                type="button"
                className="flex items-center justify-center w-full min-h-[48px] cursor-pointer rounded-md transition center bg-cyan-900 hover:bg-cyan-800 mt-4 font-bold"
                disabled={isLoading}
                onClick={handleRegister}>
                {isLoading ? (
                  <AiOutlineLoading3Quarters className="text-white animate-spin" />
                ) : (
                  'Cadastre-se'
                )}
              </button>
            </form>
          </div>
          <span className="flex w-full justify-end items-end gap-2 mb-4 text-base font-light">
            Já tem uma conta?{' '}
            <button type="button" className="font-bold text-blue-300" onClick={handleLogin}>
              Login
            </button>
          </span>
        </div>
      </div>
      <div className="hidden md:relative md:block w-4/12">
        <img
          className="md:h-screen md:w-screen md:object-cover"
          src="/img/login-img.jpg"
          alt="Imagem de Carro"
        />
      </div>
      <AlertModal open={openAlertModal} setOpen={setOpenAlertModal} errorMessage={errorMessage} />
    </div>
  );
};

export default RegisterPage;
