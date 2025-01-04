'use client';

import loginImg from '@/assets/log-in.svg';
import emailImg from '@/assets/mail.svg';
import emailActive from '@/assets/mail-focus.svg';
import lock from '@/assets/lock.svg';
import lockActive from '@/assets/lock-focus.svg';
import eye from '@/assets/eye.svg';

import Image from 'next/image';
import { useContext, useState } from 'react';
import { AuthContext } from '@/contexts/useAuthContext';
import { redirect } from 'next/navigation';

const RegisterPage = () => {
  const { register } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordShow, setPasswordShow] = useState(false);

  const handleRegister = async () => {
    try {
      if (!email || !password) {
        alert('Preencha todos os campos');
        return;
      }
      await register(email, password, name);
    } catch (error) {
      alert('Erro ao realizar o login.');
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
                  <Image
                    className="absolute left-2"
                    src={email ? emailActive : emailImg}
                    alt="Imagem do e-mail"
                  />
                  <input
                    className="w-full rounded text-black border-2 border-white p-2 pl-8 outline-none bg-form hover:border-prim focus:border-amber-400"
                    type="text"
                    placeholder="Digite seu nome"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-bold text-base">E-mail</label>
                <div className={`flex flex-col relative justify-center`}>
                  <Image
                    className="absolute left-2"
                    src={email ? emailActive : emailImg}
                    alt="Imagem do e-mail"
                  />
                  <input
                    className="w-full rounded text-black border-2 border-white p-2 pl-8 outline-none bg-form hover:border-prim focus:border-amber-400"
                    type="email"
                    placeholder="Digite seu email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="mb-2 font-bold text-base">Senha</label>
                <div className={'flex flex-col relative justify-center'}>
                  <Image
                    className="absolute left-2 mb-1"
                    src={password ? lockActive : lock}
                    alt="Imagem do cadeado"
                  />
                  <input
                    className="w-full rounded border-2 border-white p-2 pl-8 outline-none hover:border-prim focus:border-amber-400 text-black"
                    type={passwordShow ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                className="flex items-center justify-center w-full min-h-[48px] cursor-pointer rounded-md transition center bg-cyan-900 hover:bg-cyan-800 hover:scale-105 mt-4 font-bold"
                onClick={handleRegister}>
                Cadastre-se
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
    </div>
  );
};

export default RegisterPage;
