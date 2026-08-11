'use client';

import Link from 'next/link';
import { useContext, useState } from 'react';
import { MdArrowBack, MdMarkEmailRead } from 'react-icons/md';

import AuthShell from '@/components/auth/AuthShell';
import FormBanner from '@/components/auth/FormBanner';
import SubmitButton from '@/components/auth/SubmitButton';
import TextField from '@/components/auth/TextField';
import { AuthContext } from '@/contexts/useAuthContext';
import { validateEmail } from '@/helpers/validators';

export default function RecoverPage() {
  const { requestPasswordRecovery } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const emailError = touched && !validateEmail(email) ? 'Informe um e-mail válido.' : '';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setFormError('');

    if (!validateEmail(email)) return;

    setIsSubmitting(true);
    try {
      await requestPasswordRecovery(email.trim());
      setSent(true);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow="Recuperação"
        title="Verifique seu e-mail"
        subtitle="Enviamos um link para redefinir sua senha.">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-8 text-center">
            <MdMarkEmailRead aria-hidden className="text-4xl text-emerald-600" />
            <p className="text-sm text-emerald-900">
              Se existir uma conta para <strong className="break-all">{email.trim()}</strong>, o
              link chegará em instantes. Ele expira em 1 hora.
            </p>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            Não recebeu? Confira a pasta de spam ou{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-medium text-emerald-600 hover:text-emerald-500">
              tente outro endereço
            </button>
            .
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
            <MdArrowBack aria-hidden /> Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Recuperação"
      title="Esqueceu a senha?"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
          <MdArrowBack aria-hidden /> Voltar para o login
        </Link>
      }>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <TextField
          label="E-mail da conta"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com.br"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched(true)}
          error={emailError}
          disabled={isSubmitting}
          autoFocus
        />

        <SubmitButton
          isSubmitting={isSubmitting}
          pendingLabel="Enviando…"
          disabled={!validateEmail(email)}>
          Enviar link de recuperação
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
