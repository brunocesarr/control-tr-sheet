'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useContext, useState } from 'react';

import AuthShell from '@/components/auth/AuthShell';
import FormBanner from '@/components/auth/FormBanner';
import SubmitButton from '@/components/auth/SubmitButton';
import TextField from '@/components/auth/TextField';
import { AuthContext } from '@/contexts/useAuthContext';
import { validateEmail } from '@/helpers/validators';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionExpired = searchParams.get('reason') === 'expired';
  const justRegistered = searchParams.get('reason') === 'registered';
  const passwordReset = searchParams.get('reason') === 'reset';

  const emailError = touched.email && !validateEmail(email) ? 'Informe um e-mail válido.' : '';
  const passwordError = touched.password && !password ? 'Informe sua senha.' : '';
  const canSubmit = validateEmail(email) && password.length > 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setFormError('');

    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      // Navigation happens inside login() once the cookie is set.
      await login(email.trim(), password);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível entrar.');
      setPassword('');
      setIsSubmitting(false);
    }
  };

  /** Preserve the original destination when bouncing between auth screens. */
  const redirectTo = searchParams.get('redirectTo');
  const withRedirect = (path: string) =>
    redirectTo ? `${path}?redirectTo=${encodeURIComponent(redirectTo)}` : path;

  return (
    <AuthShell
      eyebrow="Acesso restrito"
      title="Bem-vindo de volta"
      subtitle="Entre com suas credenciais para acessar o painel."
      footer={
        <p className="text-center text-sm text-slate-600">
          Ainda não tem conta?{' '}
          <Link
            href={withRedirect('/register')}
            className="font-semibold text-emerald-600 hover:text-emerald-500">
            Criar conta
          </Link>
        </p>
      }>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {sessionExpired && (
          <FormBanner tone="info">
            Sua sessão expirou por inatividade. Entre novamente para continuar.
          </FormBanner>
        )}
        {justRegistered && (
          <FormBanner tone="success">Conta criada! Entre com suas credenciais.</FormBanner>
        )}
        {passwordReset && (
          <FormBanner tone="success">Senha redefinida. Entre com a nova senha.</FormBanner>
        )}
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          error={emailError}
          disabled={isSubmitting}
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            error={passwordError}
            disabled={isSubmitting}
          />
          <Link
            href="/recover"
            className="self-end text-xs font-medium text-emerald-600 hover:text-emerald-500">
            Esqueci minha senha
          </Link>
        </div>

        <SubmitButton isSubmitting={isSubmitting} pendingLabel="Entrando…" disabled={!canSubmit}>
          Entrar
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
