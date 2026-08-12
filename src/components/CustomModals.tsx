'use client';

import { motion } from 'motion/react';
import { useCallback, useState } from 'react';
import {
  MdCheckCircle,
  MdErrorOutline,
  MdInfoOutline,
  MdOutlineWarningAmber,
  MdVisibility,
  MdVisibilityOff,
} from 'react-icons/md';

import Modal from '@/components/Modal';
import { iconPop } from '@/configs/motion';
import { validateEmail } from '@/helpers/validators';
import { fadeUp } from '@/helpers/motion';

type Variant = 'error' | 'warning' | 'success' | 'info';

/**
 * Keyed by a literal union, so lookups are exempt from
 * noUncheckedIndexedAccess — that flag only widens index-signature and
 * numeric-array access, not known object keys.
 */
const VARIANTS = {
  error: { icon: MdErrorOutline, wrap: 'bg-red-100 text-red-600' },
  warning: { icon: MdOutlineWarningAmber, wrap: 'bg-amber-100 text-amber-600' },
  success: { icon: MdCheckCircle, wrap: 'bg-emerald-100 text-emerald-600' },
  info: { icon: MdInfoOutline, wrap: 'bg-sky-100 text-sky-600' },
} as const satisfies Record<Variant, { icon: React.ElementType; wrap: string }>;

function VariantIcon({ variant }: { variant: Variant }) {
  const { icon: Icon, wrap } = VARIANTS[variant];

  return (
    <motion.span
      variants={iconPop}
      initial="hidden"
      animate="visible"
      className={`grid size-12 place-items-center rounded-full ${wrap}`}>
      <Icon aria-hidden className="text-2xl" />
    </motion.span>
  );
}

const BASE_BUTTON =
  'w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400';

// ── Alert ──────────────────────────────────────────────────────────────────
interface AlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  errorMessage: string;
  title?: string;
  variant?: Variant;
}

export function AlertModal({
  open,
  setOpen,
  errorMessage,
  title = 'Atenção',
  variant = 'error',
}: AlertModalProps) {
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      size="sm"
      icon={<VariantIcon variant={variant} />}
      title={title}
      description={errorMessage}>
      <motion.button
        type="button"
        onClick={() => setOpen(false)}
        whileTap={{ scale: 0.97 }}
        className={`${BASE_BUTTON} bg-slate-900 text-white hover:bg-slate-800`}>
        Entendi
      </motion.button>
    </Modal>
  );
}

// ── Confirm ────────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Overrides the icon inferred from `destructive`. */
  variant?: Variant;
  /**
   * Word the user must type to unlock the confirm button. Use for irreversible
   * bulk operations such as "Zerar temporada" or account deactivation.
   */
  requireTyping?: string;
  confirmAction: () => void | Promise<void>;
}

export function ConfirmModal({
  open,
  setOpen,
  title = 'Confirmar ação',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = true,
  variant,
  requireTyping,
  confirmAction,
}: ConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typed, setTyped] = useState('');
  const [failure, setFailure] = useState<string | null>(null);

  const unlocked = !requireTyping || typed.trim().toUpperCase() === requireTyping.toUpperCase();

  const close = useCallback(() => {
    setTyped('');
    setFailure(null);
    setOpen(false);
  }, [setOpen]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setFailure(null);
    try {
      await confirmAction();
      setTyped('');
    } catch (error) {
      // Previously the rejection was swallowed by the finally block and the
      // dialog just closed, so failures looked like successes.
      setFailure(error instanceof Error ? error.message : 'Não foi possível concluir a ação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="sm"
      dismissible={!isSubmitting}
      icon={<VariantIcon variant={variant ?? (destructive ? 'error' : 'warning')} />}
      title={title}
      description={message}>
      {requireTyping && (
        <label className="flex flex-col gap-1.5 text-left">
          <span className="text-xs font-medium text-slate-600">
            Digite <strong className="font-mono text-slate-900">{requireTyping}</strong> para
            confirmar
          </span>
          <input
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            className="rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm tracking-wider text-slate-900 uppercase transition-colors outline-none placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />
        </label>
      )}

      {failure && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-red-50 px-3 py-2 text-left text-xs font-medium text-red-700">
          {failure}
        </motion.p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={close}
          disabled={isSubmitting}
          className={`${BASE_BUTTON} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
          {cancelLabel}
        </button>
        <motion.button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting || !unlocked}
          whileTap={{ scale: 0.97 }}
          className={`${BASE_BUTTON} text-white ${
            destructive ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
          }`}>
          {isSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Processando…
            </span>
          ) : (
            confirmLabel
          )}
        </motion.button>
      </div>
    </Modal>
  );
}

// ── New email ──────────────────────────────────────────────────────────────
interface NewEmailModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  confirmAction: (email: string, password: string) => Promise<void>;
}

const FIELD =
  'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';

export function NewEmailModal({ open, setOpen, confirmAction }: NewEmailModalProps) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Credentials are cleared in the handlers that close the modal, not in a
   * useEffect watching `open` — that fired a synchronous setState during commit
   * and tripped react-hooks/set-state-in-effect.
   */
  const handleClose = useCallback(() => {
    setNewEmail('');
    setPassword('');
    setShowPassword(false);
    setTouched(false);
    setOpen(false);
  }, [setOpen]);

  const emailLooksWrong = touched && newEmail.length > 0 && !validateEmail(newEmail);
  const isValidInputs = validateEmail(newEmail) && password.length > 0;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await confirmAction(newEmail, password);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      dismissible={!isSubmitting}
      icon={<VariantIcon variant="info" />}
      title="Alterar e-mail"
      description="Confirme sua senha atual para alterar o endereço de e-mail.">
      <div className="flex flex-col gap-4 text-left">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Novo e-mail</span>
          <input
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={emailLooksWrong}
            placeholder="novo@email.com"
            className={`${FIELD} ${
              emailLooksWrong ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
          />
          {emailLooksWrong && (
            <motion.span
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-medium text-red-600">
              Informe um endereço de e-mail válido.
            </motion.span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-700">Senha atual</span>
          <span className="relative block">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className={`${FIELD} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
              {showPassword ? <MdVisibilityOff aria-hidden /> : <MdVisibility aria-hidden />}
            </button>
          </span>
        </label>

        <motion.button
          type="button"
          onClick={handleConfirm}
          disabled={!isValidInputs || isSubmitting}
          whileTap={{ scale: 0.97 }}
          className={`${BASE_BUTTON} bg-emerald-600 text-white hover:bg-emerald-500`}>
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </motion.button>
      </div>
    </Modal>
  );
}

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ['/'], description: 'Focar a busca' },
  { keys: ['Esc'], description: 'Limpar filtros / fechar diálogo' },
  { keys: ['['], description: 'Recolher ou expandir o menu' },
  { keys: ['?'], description: 'Abrir esta lista de atalhos' },
];

/**
 * The app already registered `/` and `Escape` through useKeyboardShortcut but
 * never told anyone. Discoverability is the whole feature.
 */
export function ShortcutsModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      size="md"
      title="Atalhos de teclado"
      description="Acelere as tarefas repetitivas do dia a dia."
      icon={<VariantIcon variant="info" />}>
      <motion.ul
        initial="hidden"
        animate="visible"
        className="flex flex-col divide-y divide-slate-100">
        {SHORTCUTS.map((shortcut) => (
          <motion.li
            key={shortcut.description}
            variants={fadeUp}
            className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-slate-600">{shortcut.description}</span>
            <span className="flex gap-1">
              {shortcut.keys.map((key) => (
                <kbd
                  key={key}
                  className="min-w-7 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-center text-[11px] font-semibold text-slate-600 shadow-sm">
                  {key}
                </kbd>
              ))}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </Modal>
  );
}
