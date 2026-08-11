'use client';

import { useContext, useMemo, useState } from 'react';
import { MdCheck, MdClose, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { toast } from 'react-toastify';

import Container from '@/components/Container';
import { AlertModal, ConfirmModal, NewEmailModal } from '@/components/CustomModals';
import Loader from '@/components/Loader';
import Navbar from '@/components/Navbar';
import { AuthContext } from '@/contexts/useAuthContext';
import { describePasswordRules, validateName, validatePassword } from '@/helpers/validators';

/** Narrows unknown catch values into a user-facing string. */
function resolveErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export default function ProfilePage() {
  const {
    isLoading,
    loggedInUser,
    isAdmin,
    logout,
    updateName,
    updateEmail,
    updatePassword,
    deactivateAccount,
  } = useContext(AuthContext);

  // ── Form state ────────────────────────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ── Modal + submission state ──────────────────────────────────────────────
  const [openAlertModal, setOpenAlertModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [openEmailModal, setOpenEmailModal] = useState(false);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'name' | 'password' | null>(null);

  const passwordRules = useMemo(() => describePasswordRules(newPassword), [newPassword]);
  const isNameValid = newName.trim().length === 0 || validateName(newName);
  const isNewPasswordValid = newPassword.length === 0 || validatePassword(newPassword);

  const showError = (error: unknown, fallback: string) => {
    setErrorMessage(resolveErrorMessage(error, fallback));
    setOpenAlertModal(true);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNewName = async () => {
    const trimmed = newName.trim();

    if (!validateName(trimmed)) {
      setErrorMessage('Insira um nome válido (2 a 60 letras).');
      setOpenAlertModal(true);
      return;
    }
    if (trimmed === loggedInUser?.name) {
      setErrorMessage('O novo nome é igual ao atual.');
      setOpenAlertModal(true);
      return;
    }

    setPendingAction('name');
    try {
      await updateName(trimmed);
      toast.success('Alteração realizada com sucesso.');
      setNewName('');
    } catch (error) {
      showError(error, 'Não foi possível alterar o nome.');
    } finally {
      setPendingAction(null);
    }
  };

  /**
   * Called by NewEmailModal. Errors are surfaced through AlertModal instead of
   * being re-thrown, so the click handler never leaves a rejected promise.
   */
  const handleNewEmail = async (email: string, password: string) => {
    try {
      await updateEmail(email, password);
      toast.success('E-mail alterado com sucesso.');
    } catch (error) {
      showError(error, 'Não foi possível alterar o e-mail. Verifique a senha informada.');
    }
  };

  const handleNewPassword = async () => {
    if (!oldPassword) {
      setErrorMessage('Informe sua senha atual.');
      setOpenAlertModal(true);
      return;
    }
    if (!validatePassword(newPassword)) {
      setErrorMessage('A nova senha não atende aos requisitos mínimos.');
      setOpenAlertModal(true);
      return;
    }
    if (newPassword === oldPassword) {
      setErrorMessage('A nova senha deve ser diferente da atual.');
      setOpenAlertModal(true);
      return;
    }

    setPendingAction('password');
    try {
      await updatePassword(newPassword, oldPassword);
      toast.success('Senha alterada com sucesso.');
      setOldPassword('');
      setNewPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
    } catch (error) {
      showError(error, 'Não foi possível alterar a senha.');
    } finally {
      setPendingAction(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setOpenLogoutModal(false);
    } catch (error) {
      showError(error, 'Não foi possível sair da conta.');
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateAccount();
    } catch (error) {
      showError(error, 'Não foi possível desativar a conta.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // middleware.ts already guarantees a session here; this only covers the
  // brief client-side bootstrap before AuthContext resolves.
  if (isLoading) return <Loader label="Carregando perfil…" />;
  if (!loggedInUser) return <Loader label="Redirecionando…" />;

  const inputClass =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500';
  const primaryButtonClass =
    'rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main className="flex h-full flex-col">
      <Navbar>Meu perfil</Navbar>

      <Container className="py-6">
        {/* ── Account summary ─────────────────────────────────────────────── */}
        <section className="mb-8 rounded-md bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 id="profile-name" className="truncate text-xl font-semibold text-gray-900">
                {loggedInUser.name || 'Usuário sem nome'}
              </h1>
              <p id="profile-email" className="truncate text-sm text-gray-600">
                {loggedInUser.email}
              </p>
              <p id="profile-created-at" className="mt-1 text-xs text-gray-400">
                Conta criada em {dateFormatter.format(new Date(loggedInUser.$createdAt))}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  Administrador
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpenLogoutModal(true)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50">
                Sair
              </button>
            </div>
          </div>
        </section>

        {/* ── Name ────────────────────────────────────────────────────────── */}
        <section className="mb-6 rounded-md bg-white p-5 shadow-sm">
          <h2 id="section-name-title" className="text-base font-semibold text-gray-900">
            Nome
          </h2>
          <p id="section-name-description" className="mt-1 text-sm text-gray-600">
            Este é o nome exibido no menu lateral.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label htmlFor="new-name" className="sr-only">
                Novo nome
              </label>
              <input
                id="new-name"
                type="text"
                autoComplete="name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={loggedInUser.name || 'Seu nome completo'}
                aria-invalid={!isNameValid}
                className={`${inputClass} ${isNameValid ? '' : 'border-red-500 focus:border-red-500 focus:ring-red-500'}`}
              />
              {!isNameValid && (
                <p className="mt-1 text-xs font-light text-red-600">
                  Use de 2 a 60 letras. Acentos, apóstrofos e hífens são permitidos.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleNewName}
              disabled={pendingAction !== null || !newName.trim() || !isNameValid}
              className={primaryButtonClass}>
              {pendingAction === 'name' ? 'Salvando…' : 'Salvar nome'}
            </button>
          </div>
        </section>

        {/* ── Email ───────────────────────────────────────────────────────── */}
        <section className="mb-6 rounded-md bg-white p-5 shadow-sm">
          <h2 id="section-email-title" className="text-base font-semibold text-gray-900">
            E-mail
          </h2>
          <p id="section-email-description" className="mt-1 text-sm text-gray-600">
            Por segurança, sua senha atual é solicitada ao alterar o e-mail.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="flex-1 truncate rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {loggedInUser.email}
            </span>
            <button
              type="button"
              onClick={() => setOpenEmailModal(true)}
              disabled={pendingAction !== null}
              className={primaryButtonClass}>
              Alterar e-mail
            </button>
          </div>
        </section>

        {/* ── Password ────────────────────────────────────────────────────── */}
        <section className="mb-6 rounded-md bg-white p-5 shadow-sm">
          <h2 id="section-password-title" className="text-base font-semibold text-gray-900">
            Senha
          </h2>
          <p id="section-password-description" className="mt-1 text-sm text-gray-600">
            Escolha uma senha forte que você não utilize em outros serviços.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="old-password"
                className="mb-1 block text-sm font-medium text-gray-700">
                Senha atual
              </label>
              <div className="relative">
                <input
                  id="old-password"
                  type={showOldPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((current) => !current)}
                  aria-label={showOldPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-700">
                  {showOldPassword ? <MdVisibilityOff aria-hidden /> : <MdVisibility aria-hidden />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-sm font-medium text-gray-700">
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  aria-invalid={!isNewPasswordValid}
                  className={`${inputClass} pr-10 ${
                    isNewPasswordValid
                      ? ''
                      : 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((current) => !current)}
                  aria-label={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-700">
                  {showNewPassword ? <MdVisibilityOff aria-hidden /> : <MdVisibility aria-hidden />}
                </button>
              </div>
            </div>
          </div>

          {/* Live checklist driven by describePasswordRules(). */}
          {newPassword.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {passwordRules.map((rule) => (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1.5 text-xs ${
                    rule.satisfied ? 'text-emerald-700' : 'text-gray-500'
                  }`}>
                  {rule.satisfied ? (
                    <MdCheck aria-hidden className="text-emerald-600" />
                  ) : (
                    <MdClose aria-hidden className="text-gray-400" />
                  )}
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={handleNewPassword}
            disabled={pendingAction !== null || !oldPassword || !validatePassword(newPassword)}
            className={`mt-4 ${primaryButtonClass}`}>
            {pendingAction === 'password' ? 'Salvando…' : 'Alterar senha'}
          </button>
        </section>

        {/* ── Danger zone — previously className="mb-10 hidden" ───────────── */}
        <section className="mb-10 rounded-md border border-red-200 bg-red-50 p-5">
          <h2 id="danger-zone-title" className="text-base font-semibold text-red-800">
            Desativar conta
          </h2>
          <p id="danger-zone-description" className="mt-1 text-sm text-red-700">
            Sua conta será bloqueada e você perderá o acesso imediatamente. Um administrador pode
            reativá-la posteriormente.
          </p>
          <button
            type="button"
            onClick={() => setOpenDeactivateModal(true)}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500">
            Desativar minha conta
          </button>
        </section>
      </Container>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <NewEmailModal
        open={openEmailModal}
        setOpen={setOpenEmailModal}
        confirmAction={handleNewEmail}
      />

      <ConfirmModal
        open={openLogoutModal}
        setOpen={setOpenLogoutModal}
        title="Sair da conta"
        message="Deseja encerrar sua sessão?"
        confirmLabel="Sair"
        destructive={false}
        confirmAction={handleLogout}
      />

      <ConfirmModal
        open={openDeactivateModal}
        setOpen={setOpenDeactivateModal}
        title="Desativar conta"
        message="Você perderá o acesso imediatamente e será desconectado. Deseja continuar?"
        confirmLabel="Sim, desativar"
        confirmAction={handleDeactivate}
      />

      <AlertModal open={openAlertModal} setOpen={setOpenAlertModal} errorMessage={errorMessage} />
    </main>
  );
}
