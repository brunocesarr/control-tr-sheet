import React, { useState } from 'react';
import { LuCircleAlert } from 'react-icons/lu';

import Modal from '@/components/Modal';

interface AlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  errorMessage: string;
}

export function AlertModal({ open, setOpen, errorMessage }: AlertModalProps) {
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="w-fit text-center">
        <LuCircleAlert size={48} className="mx-auto text-red-500" />
        <div className="mx-auto my-4 w-48">
          <h3 className="text-xl font-black text-gray-800">Ops...</h3>
          <p className="text-base text-gray-500">{errorMessage}</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setOpen(false)}
            className="btn w-full rounded-md bg-white px-4 py-2 font-bold text-rose-600 hover:bg-rose-200">
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface InputModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  modalDescription: string;
  confirmValue: (value: string) => void;
}

export function InputModal({ open, setOpen, modalDescription, confirmValue }: InputModalProps) {
  const [value, setValue] = useState('');

  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="w-fit text-center">
        <div className="it mt-4 flex w-full flex-col gap-2 space-y-2">
          <label className="flex w-full flex-col gap-2">
            <span className="text-base text-gray-500">{modalDescription}</span>
            <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-blue-600">
              <input
                type="text"
                className="w-full shrink appearance-none border-gray-300 bg-white px-4 py-2 text-base text-gray-700 placeholder:text-gray-400 focus:outline-none"
                placeholder="Digite aqui..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </label>
          <div className="flex w-full flex-col items-center justify-center gap-1">
            <button
              onClick={() => {
                confirmValue(value);
                setOpen(false);
              }}
              className="btn w-full rounded-md bg-gray-900 px-4 py-2 font-bold text-white hover:bg-gray-600">
              Confirmar
            </button>
            <button
              onClick={() => setOpen(false)}
              className="btn w-full rounded-md bg-white px-4 py-2 font-bold text-rose-600 hover:bg-rose-200">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface ConfirmModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  modalDescription: string | React.ReactNode;
  confirmAction: () => void;
}

export function ConfirmModal({
  open,
  setOpen,
  modalDescription,
  confirmAction,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="w-fit text-center">
        <div className="it mt-4 flex w-full flex-col gap-2 space-y-2">
          <label className="flex w-full flex-col gap-2">
            <LuCircleAlert size={48} className="mx-auto text-red-500" />
            <span className="text-base text-gray-500">{modalDescription}</span>
          </label>
          <div className="flex w-full flex-col items-center justify-center gap-1">
            <button
              onClick={() => {
                confirmAction();
                setOpen(false);
              }}
              className="btn w-full rounded-md bg-gray-900 px-4 py-2 font-bold text-white hover:bg-gray-600">
              Confirmar
            </button>
            <button
              onClick={() => setOpen(false)}
              className="btn w-full rounded-md bg-white px-4 py-2 font-bold text-rose-600 hover:bg-rose-200">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
