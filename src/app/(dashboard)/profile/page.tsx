'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useContext, useMemo, useState } from 'react';
import {
  MdAlternateEmail,
  MdBadge,
  MdLockOutline,
  MdPersonOutline,
  MdVisibility,
  MdVisibilityOff,
  MdWarningAmber,
} from 'react-icons/md';
import { toast } from 'react-toastify';

import Container from '@/components/Container';
import { AlertModal, ConfirmModal, NewEmailModal } from '@/components/CustomModals';
import Loader from '@/components/Loader';
import Navbar from '@/components/Navbar';
import PasswordStrength from '@/components/profile/PasswordStrength';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SettingsCard from '@/components/profile/SettingsCard';
import Tabs, { type TabDefinition } from '@/components/ui/Tabs';
import { listContainer } from '@/configs/motion';
import { AuthContext } from '@/contexts/useAuthContext';
import { describePasswordRules, validateName, validatePassword } from '@/helpers/validators';

type TabId = 'account' | 'security' | 'danger';

const TABS: TabDefinition<TabId>[] = [
  { id: 'account', label: 'Conta', icon: MdBadge },
  { id: 'security', label: 'Segurança', icon: MdLockOutline },
  // tone drives a red pill instead of the neutral slate one.
  { id: 'danger', label: 'Zona de risco', icon: MdWarningAmber, tone: 'danger', alert: true },
];

/** Narrows unknown catch values into a user-facing string. */
function resolveErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ── Colour tokens ───────────────────────────────────────────────────────────
// Split into base / idle / error so the invalid branch swaps only the colour
// half and can never drop a layout class by accident.
const FIELD_BASE =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400';
const FIELD_IDLE =
  'border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
const FIELD_ERROR =
  'border-red-400 hover:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20';

const fieldClass = (isValid: boolean) => `${FIELD_BASE} ${isValid ? FIELD_IDLE : FIELD_ERROR}`;

/**
 * Explicit disabled colours instead of `disabled:opacity-50`. A 50%-opacity
 * emerald still reads as a live primary button; slate-200/slate-400 reads inert.
 */
const PRIMARY =
  'inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200';

const READONLY_VALUE =
  'flex flex-1 items-center gap-2 truncate rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-slate-600';

const EYE_BUTTON =
  'absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900';

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

  const [tab, setTab] = useState<TabId>('account');

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
  const isNameUnchanged = newName.trim() === (loggedInUser?.name ?? '');

  const showError = (error: unknown, fallback: string) => {
    setErrorMessage(resolveErrorMessage(error, fallback));
    setOpenAlertModal(true);
  };

  const fail = (message: string) => {
    setErrorMessage(message);
    setOpenAlertModal(true);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNewName = async () => {
    const trimmed = newName.trim();
    if (!validateName(trimmed)) return fail('Insira um nome válido (2 a 60 letras).');
    if (trimmed === loggedInUser?.name) return fail('O novo nome é igual ao atual.');

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

  const handleNewEmail = async (email: string, password: string) => {
    try {
      await updateEmail(email, password);
      toast.success('E-mail alterado com sucesso.');
    } catch (error) {
      showError(error, 'Não foi possível alterar o e-mail. Verifique a senha informada.');
    }
  };

  const handleNewPassword = async () => {
    if (!oldPassword) return fail('Informe sua senha atual.');
    if (!validatePassword(newPassword)) return fail('A nova senha não atende aos requisitos.');
    if (newPassword === oldPassword) return fail('A nova senha deve ser diferente da atual.');

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
  if (isLoading) return <Loader label="Carregando perfil…" />;
  if (!loggedInUser) return <Loader label="Redirecionando…" />;

  return (
    <main className="flex min-h-full flex-col bg-slate-50">
      <Navbar eyebrow="Configurações">Meu perfil</Navbar>

      <Container className="flex flex-col gap-5 py-6">
        <ProfileHeader
          user={loggedInUser}
          isAdmin={isAdmin}
          onLogout={() => setOpenLogoutModal(true)}
        />

        <Tabs scope="profile" tabs={TABS} active={tab} onChange={setTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            id={`profile-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`profile-tab-${tab}`}
            variants={listContainer}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            className="flex flex-col gap-5">
            {/* ── Conta ─────────────────────────────────────────────────── */}
            {tab === 'account' && (
              <>
                <SettingsCard
                  title="Nome de exibição"
                  description="Este é o nome exibido no menu lateral e nos registros de auditoria."
                  icon={MdPersonOutline}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex-1">
                      <label
                        htmlFor="new-name"
                        className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Novo nome
                      </label>
                      {/*
                        The placeholder used to be the CURRENT name, so an empty
                        field looked like a saved value and the greyed-out button
                        looked broken. It is now a neutral hint, with the current
                        value shown separately below.
                      */}
                      <input
                        id="new-name"
                        type="text"
                        autoComplete="name"
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Digite o novo nome"
                        aria-invalid={!isNameValid}
                        aria-describedby="new-name-hint"
                        className={fieldClass(isNameValid)}
                      />

                      <AnimatePresence mode="wait" initial={false}>
                        {!isNameValid ? (
                          <motion.p
                            key="error"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-1.5 overflow-hidden text-xs font-medium text-red-600">
                            Use de 2 a 60 letras. Acentos, apóstrofos e hífens são permitidos.
                          </motion.p>
                        ) : (
                          <motion.p
                            key="hint"
                            id="new-name-hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-1.5 text-xs text-slate-500">
                            Atual:{' '}
                            <span className="font-medium text-slate-700">
                              {loggedInUser.name || '—'}
                            </span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      type="button"
                      onClick={handleNewName}
                      disabled={
                        pendingAction !== null || !newName.trim() || !isNameValid || isNameUnchanged
                      }
                      whileTap={{ scale: 0.97 }}
                      className={`${PRIMARY} sm:mt-6`}>
                      {pendingAction === 'name' ? 'Salvando…' : 'Salvar nome'}
                    </motion.button>
                  </div>
                </SettingsCard>

                <SettingsCard
                  title="Endereço de e-mail"
                  description="Por segurança, sua senha atual é solicitada ao alterar o e-mail."
                  icon={MdAlternateEmail}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Dashed border + lock icon: this is a value, not a field. */}
                    <span className={READONLY_VALUE}>
                      <MdLockOutline aria-hidden className="shrink-0 text-base text-slate-400" />
                      <span className="truncate">{loggedInUser.email}</span>
                      <span className="ml-auto shrink-0 rounded-md bg-slate-200 px-1.5 py-0.5 font-sans text-[10px] font-bold tracking-wide text-slate-600 uppercase">
                        Atual
                      </span>
                    </span>

                    <motion.button
                      type="button"
                      onClick={() => setOpenEmailModal(true)}
                      disabled={pendingAction !== null}
                      whileTap={{ scale: 0.97 }}
                      className={PRIMARY}>
                      Alterar e-mail
                    </motion.button>
                  </div>
                </SettingsCard>
              </>
            )}

            {/* ── Segurança ─────────────────────────────────────────────── */}
            {tab === 'security' && (
              <SettingsCard
                title="Senha"
                description="Escolha uma senha forte que você não utilize em outros serviços."
                icon={MdLockOutline}
                footer={
                  <motion.button
                    type="button"
                    onClick={handleNewPassword}
                    disabled={
                      pendingAction !== null || !oldPassword || !validatePassword(newPassword)
                    }
                    whileTap={{ scale: 0.97 }}
                    className={PRIMARY}>
                    {pendingAction === 'password' ? 'Salvando…' : 'Alterar senha'}
                  </motion.button>
                }>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="old-password"
                      className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Senha atual
                    </label>
                    <div className="relative">
                      <input
                        id="old-password"
                        type={showOldPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={oldPassword}
                        onChange={(event) => setOldPassword(event.target.value)}
                        placeholder="••••••••"
                        className={`${fieldClass(true)} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword((current) => !current)}
                        aria-label={showOldPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                        className={EYE_BUTTON}>
                        {showOldPassword ? (
                          <MdVisibilityOff aria-hidden />
                        ) : (
                          <MdVisibility aria-hidden />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Nova senha
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="••••••••"
                        aria-invalid={!isNewPasswordValid}
                        className={`${fieldClass(isNewPasswordValid)} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((current) => !current)}
                        aria-label={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                        className={EYE_BUTTON}>
                        {showNewPassword ? (
                          <MdVisibilityOff aria-hidden />
                        ) : (
                          <MdVisibility aria-hidden />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {newPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      <div className="pt-4">
                        <PasswordStrength rules={passwordRules} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </SettingsCard>
            )}

            {/* ── Zona de risco ─────────────────────────────────────────── */}
            {tab === 'danger' && (
              <SettingsCard
                tone="danger"
                title="Desativar conta"
                description="Sua conta será bloqueada e você perderá o acesso imediatamente. Um administrador pode reativá-la posteriormente."
                icon={MdWarningAmber}>
                <ul className="flex flex-col gap-2 text-sm text-red-800">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />
                    Você será desconectado de todos os dispositivos.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />
                    Os dados da planilha permanecem intactos.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-500" />
                    Somente um administrador pode reverter esta ação.
                  </li>
                </ul>

                <motion.button
                  type="button"
                  onClick={() => setOpenDeactivateModal(true)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500">
                  Desativar minha conta
                </motion.button>
              </SettingsCard>
            )}
          </motion.div>
        </AnimatePresence>
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
        variant="warning"
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
        requireTyping="DESATIVAR"
        confirmAction={handleDeactivate}
      />

      <AlertModal open={openAlertModal} setOpen={setOpenAlertModal} errorMessage={errorMessage} />
    </main>
  );
}
