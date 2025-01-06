'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { CiUser } from 'react-icons/ci';
import { MdAlternateEmail } from 'react-icons/md';
import { TbLockPassword } from 'react-icons/tb';

import eye from '@/assets/eye.svg';
import loginImg from '@/assets/log-in.svg';
import { AlertModal } from '@/components/CustomModals';
import { AuthContext } from '@/contexts/useAuthContext';
import { validateEmail, validateName, validatePassword } from '@/helpers/validators';

const RegisterPage = () => {
  const { register, isLoading } = useContext(AuthContext);
  const router = useRouter();

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
    router.push('/login');
  };

  const handlePasswordShow = () => {
    setPasswordShow(!passwordShow);
  };

  return (
    <div className="font-poppins flex flex-row items-center bg-gray-700 text-base text-white min-h-screen">
      <div className="flex w-full flex-col md:flex md:flex-col">
        <div className="md:bg-form flex flex-col gap-2 rounded-2xl bg-slate-800 p-8 shadow-md shadow-slate-400 md:m-auto md:w-[600px]">
          <div className="flex flex-col gap-3 self-start py-2">
            <div className="flex flex-row gap-4">
              <Image className="w-[24px]" src={loginImg} alt="Imagem de Login" />
              <h1 className="text-xl">Faça seu cadastro</h1>
            </div>
          </div>

          <div className="flex flex-col py-2">
            <form className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="mb-2 text-base font-bold">Nome</label>
                <div className="relative flex flex-col justify-center">
                  <CiUser
                    className={`absolute left-2 text-xl ${name ? (isValidName ? 'text-amber-400' : 'text-red-600') : 'text-gray-400'}`}
                  />
                  <input
                    className={`bg-form hover:border-prim w-full rounded border-2 p-2 pl-8 text-black outline-none focus:border-amber-400 ${!isValidName ? 'border-red-600' : 'border-white'}`}
                    type="text"
                    placeholder="Digite seu nome"
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    value={name}
                  />
                </div>
                {!isValidName && (
                  <label className="mt-0.5 text-xs font-light text-red-600">
                    Insira um nome válido
                  </label>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-base font-bold">E-mail</label>
                <div className="relative flex flex-col justify-center">
                  <MdAlternateEmail
                    className={`absolute left-2 text-xl ${email ? (isValidCurrentEmail ? 'text-amber-400' : 'text-red-600') : 'text-gray-400'}`}
                  />
                  <input
                    className={`bg-form hover:border-prim w-full rounded border-2 p-2 pl-8 text-black outline-none focus:border-amber-400 ${!isValidCurrentEmail ? 'border-red-600' : 'border-white'}`}
                    type="email"
                    placeholder="Digite seu email"
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    value={email}
                  />
                </div>
                {!isValidCurrentEmail && (
                  <label className="mt-0.5 text-xs font-light text-red-600">
                    Insira um e-mail válido
                  </label>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-base font-bold">Senha</label>
                <div className="relative flex flex-col justify-center">
                  <TbLockPassword
                    className={`absolute left-2 text-xl ${password ? (isValidCurrentPassword ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}
                  />
                  <input
                    className={`hover:border-prim w-full rounded border-2 p-2 pl-8 text-black outline-none focus:border-amber-400 ${!isValidCurrentPassword ? 'border-red-600' : 'border-white'}`}
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
                  <label className="mt-0.5 text-xs font-light text-red-600">
                    Insira uma senha válida
                  </label>
                )}
              </div>

              <button
                type="button"
                className="center mt-4 flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-md bg-cyan-900 font-bold transition hover:bg-cyan-800"
                disabled={isLoading}
                onClick={handleRegister}>
                {isLoading ? (
                  <AiOutlineLoading3Quarters className="animate-spin text-white" />
                ) : (
                  'Cadastre-se'
                )}
              </button>
            </form>
          </div>
          <span className="mb-4 flex w-full items-end justify-end gap-2 text-base font-light">
            Já tem uma conta?{' '}
            <button type="button" className="font-bold text-blue-300" onClick={handleLogin}>
              Login
            </button>
          </span>
        </div>
      </div>
      <div className="hidden w-4/12 md:relative md:block">
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
