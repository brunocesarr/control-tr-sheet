'use client';

import { useEffect, useState } from 'react';

import Modal from '@/components/Modal';
import { validateEmail } from '@/helpers/validators';

interface AlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  errorMessage: string;
  title?: string;
}

export function AlertModal({ open, setOpen, errorMessage, title = 'Atenção' }: AlertModalProps) {
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="w-fit max-w-sm text-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          Entendi
        </button>
      </div>
    </Modal>
  );
}

interface ConfirmModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
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
  confirmAction,
}: ConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await confirmAction();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="w-fit max-w-sm text-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              destructive ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}>
            {isSubmitting ? 'Processando…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface NewEmailModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  confirmAction: (email: string, password: string) => Promise<void>;
}

export function NewEmailModal({ open, setOpen, confirmAction }: NewEmailModalProps) {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Never leave credentials sitting in state after the modal closes.
  useEffect(() => {
    if (!open) {
      setNewEmail('');
      setPassword('');
    }
  }, [open]);

  const isValidInputs = validateEmail(newEmail) && password.length > 0;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await confirmAction(newEmail, password);
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900">Alterar e-mail</h3>
        <p className="mt-1 text-sm text-gray-600">
          Confirme sua senha atual para alterar o endereço de e-mail.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <input
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="novo@email.com"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Senha atual"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValidInputs || isSubmitting}
          className="mt-5 w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50">
          {isSubmitting ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}
