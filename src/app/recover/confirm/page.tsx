'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useState } from 'react';
import { MdErrorOutline } from 'react-icons/md';

import AuthShell from '@/components/auth/AuthShell';
import FormBanner from '@/components/auth/FormBanner';
import PasswordChecklist from '@/components/auth/PasswordChecklist';
import SubmitButton from '@/components/auth/SubmitButton';
import TextField from '@/components/auth/TextField';
import { AuthContext } from '@/contexts/useAuthContext';
import { validatePassword } from '@/helpers/validators';

/** Appwrite appends ?userId=…&secret=… to the recovery URL. */
export default function RecoverConfirmPage() {
  const { confirmPasswordRecovery } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  const [password, setPassword] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordError =
    touched.password && !validatePassword(password) ? 'A senha não atende aos requisitos.' : '';
  const confirmError =
    touched.confirm && confirmValue !== password ? 'As senhas não coincidem.' : '';
  const canSubmit = validatePassword(password) && confirmValue === password;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ password: true, confirm: true });
    setFormError('');

    if (!canSubmit || !userId || !secret) return;

    setIsSubmitting(true);
    try {
      await confirmPasswordRecovery(userId, secret, password);
      router.replace('/login?reason=reset');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.');
      setIsSubmitting(false);
    }
  };

  // Link opened without the query string, or truncated by an email client.
  if (!userId || !secret) {
    return (
      <AuthShell
        eyebrow="Recuperação"
        title="Link inválido"
        subtitle="Este endereço não contém as informações necessárias.">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center">
            <MdErrorOutline aria-hidden className="text-4xl text-red-500" />
            <p className="text-sm text-red-800">
              O link pode ter expirado, já ter sido utilizado ou sido cortado pelo seu cliente de
              e-mail. Solicite um novo.
            </p>
          </div>

          <Link
            href="/recover"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-emerald-500">
            Solicitar novo link
          </Link>
          <Link href="/login" className="text-center text-sm text-slate-600 hover:text-slate-900">
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Recuperação"
      title="Criar nova senha"
      subtitle="Escolha uma senha forte que você não utilize em outros serviços.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormBanner tone="error">{formError}</FormBanner>}

        <div className="flex flex-col gap-2">
          <TextField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
            onBlur={() => setTouched((current) => ({ ...current, password: true }))}
            error={passwordError}
            disabled={isSubmitting}
            autoFocus
          />
          <PasswordChecklist password={password} />
        </div>

        <TextField
          label="Confirmar nova senha"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmValue}
          onChange={setConfirmValue}
          onBlur={() => setTouched((current) => ({ ...current, confirm: true }))}
          error={confirmError}
          disabled={isSubmitting}
        />

        <SubmitButton isSubmitting={isSubmitting} pendingLabel="Salvando…" disabled={!canSubmit}>
          Redefinir senha
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
