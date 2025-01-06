'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdAlternateEmail } from 'react-icons/md';
import { TbLockPassword } from 'react-icons/tb';

import eye from '@/assets/eye.svg';
import loginImg from '@/assets/log-in.svg';
import { AlertModal } from '@/components/CustomModals';
import { AuthContext } from '@/contexts/useAuthContext';
import { validateEmail } from '@/helpers/validators';

const LoginPage = () => {
  const { login, isLoading, loggedInUser } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordShow, setPasswordShow] = useState(false);
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (loggedInUser) router.push('/home');
  }, [loggedInUser]);

  const handleLogin = async () => {
    try {
      if (!email || !password || !validateEmail(email)) {
        setErrorMessage('Preencha todos os campos corretamente.');
        setOpenAlertModal(true);
        return;
      }
      await login(email, password);
    } catch (error) {
      console.error(`Login:${error}`);
      setErrorMessage('Erro ao realizar o login.');
      setOpenAlertModal(true);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handlePasswordShow = () => {
    setPasswordShow(!passwordShow);
  };

  return (
    <div className="font-poppins flex flex-row items-center md:flx-col bg-gray-700 text-base text-white min-h-screen">
      <div className="flex w-full flex-col">
        <div className="md:bg-form flex flex-col gap-2 rounded-2xl bg-slate-800 p-8 shadow-md shadow-slate-400 md:m-auto md:w-[600px]">
          <div className="flex flex-col gap-3 self-start py-2">
            <div className="flex flex-row gap-4">
              <Image className="w-[24px]" src={loginImg} alt="Imagem de Login" />
              <h1 className="text-xl">Faça seu login</h1>
            </div>
          </div>

          <div className="flex flex-col py-2">
            <form className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="mb-2 text-base font-bold">E-mail</label>
                <div className="relative flex flex-col justify-center">
                  <MdAlternateEmail
                    className={`absolute left-2 text-xl ${email ? 'text-yellow-600' : 'text-gray-400'}`}
                  />
                  <input
                    className="bg-form hover:border-prim w-full rounded border-2 border-white p-2 pl-8 text-black outline-none focus:border-amber-400"
                    type="email"
                    placeholder="Digite seu email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 text-base font-bold">Senha</label>
                <div className="relative flex flex-col justify-center">
                  <TbLockPassword
                    className={`absolute left-2 text-xl ${password ? 'text-yellow-600' : 'text-gray-400'}`}
                  />
                  <input
                    className="hover:border-prim w-full rounded border-2 border-white p-2 pl-8 text-black outline-none focus:border-amber-400"
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
              </div>
              <button
                type="button"
                className="center mt-4 flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-md bg-cyan-900 font-bold transition hover:bg-cyan-800"
                disabled={isLoading}
                onClick={handleLogin}>
                {isLoading ? (
                  <AiOutlineLoading3Quarters className="animate-spin text-white" />
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>
          <span className="mb-4 flex w-full items-end justify-end gap-2 text-base font-light">
            Não tem uma conta?{' '}
            <button type="button" className="font-bold text-blue-300" onClick={handleRegister}>
              Registre-se
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

export default LoginPage;
