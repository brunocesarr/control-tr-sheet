'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useContext, useState } from 'react';

import AuthShell from '@/components/auth/AuthShell';
import FormBanner from '@/components/auth/FormBanner';
import PasswordChecklist from '@/components/auth/PasswordChecklist';
import SubmitButton from '@/components/auth/SubmitButton';
import TextField from '@/components/auth/TextField';
import { AuthContext } from '@/contexts/useAuthContext';
import { validateEmail, validateName, validatePassword } from '@/helpers/validators';

export default function RegisterPage() {
  const { register } = useContext(AuthContext);
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const markTouched = (field: keyof typeof touched) =>
    setTouched((current) => ({ ...current, [field]: true }));

  const nameError =
    touched.name && !validateName(name) ? 'Use de 2 a 60 letras (acentos permitidos).' : '';
  const emailError = touched.email && !validateEmail(email) ? 'Informe um e-mail válido.' : '';
  const passwordError =
    touched.password && !validatePassword(password) ? 'A senha não atende aos requisitos.' : '';
  const confirmError =
    touched.confirm && confirmPassword !== password ? 'As senhas não coincidem.' : '';

  const canSubmit =
    validateName(name) &&
    validateEmail(email) &&
    validatePassword(password) &&
    confirmPassword === password;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    setFormError('');

    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      // register() signs in and navigates on success.
      await register(name.trim(), email.trim(), password);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível criar a conta.');
      setIsSubmitting(false);
    }
  };

  const redirectTo = searchParams.get('redirectTo');
  const loginHref = redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login';

  return (
    <AuthShell
      eyebrow="Primeiro acesso"
      title="Criar sua conta"
      subtitle="Leva menos de um minuto. O acesso ao painel é liberado por um administrador."
      footer={
        <p className="text-center text-sm text-slate-600">
          Já tem uma conta?{' '}
          <Link href={loginHref} className="font-semibold text-emerald-600 hover:text-emerald-500">
            Entrar
          </Link>
        </p>
      }>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <TextField
          label="Nome completo"
          autoComplete="name"
          placeholder="Maria Silva"
          value={name}
          onChange={setName}
          onBlur={() => markTouched('name')}
          error={nameError}
          disabled={isSubmitting}
          autoFocus
        />

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={setEmail}
          onBlur={() => markTouched('email')}
          error={emailError}
          disabled={isSubmitting}
        />

        <div className="flex flex-col gap-2">
          <TextField
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            onBlur={() => markTouched('password')}
            error={passwordError}
            disabled={isSubmitting}
          />
          <PasswordChecklist password={password} />
        </div>

        <TextField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={setConfirmPassword}
          onBlur={() => markTouched('confirm')}
          error={confirmError}
          disabled={isSubmitting}
        />

        <SubmitButton
          isSubmitting={isSubmitting}
          pendingLabel="Criando conta…"
          disabled={!canSubmit}>
          Criar conta
        </SubmitButton>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          O painel de ITRs exige permissão de administrador. Após o cadastro, solicite a liberação
          ao responsável.
        </p>
      </form>
    </AuthShell>
  );
}
