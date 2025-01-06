import { LuCircleAlert } from 'react-icons/lu';

import Modal from '@/components/Modal';
import { useState } from 'react';

interface AlertModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  errorMessage: string;
}

export function AlertModal({ open, setOpen, errorMessage }: AlertModalProps) {
  return (
    <Modal open={open} onClose={() => setOpen(false)}>
      <div className="text-center w-fit">
        <LuCircleAlert size={48} className="mx-auto text-red-500" />
        <div className="mx-auto my-4 w-48">
          <h3 className="text-xl font-black text-gray-800">Ops...</h3>
          <p className="text-base text-gray-500">{errorMessage}</p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setOpen(false)}
            className="btn font-bold px-4 py-2 bg-white text-rose-600 hover:bg-rose-200 w-full rounded-md">
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
        <div className="flex flex-col it space-y-2 gap-2 w-full mt-4">
          <label className="flex flex-col gap-2 w-full">
            <span className="text-base text-gray-500">{modalDescription}</span>
            <div className="relative flex overflow-hidden rounded-md border-2 transition focus-within:border-blue-600">
              <input
                type="text"
                className="w-full flex-shrink appearance-none border-gray-300 bg-white py-2 px-4 text-base text-gray-700 placeholder-gray-400 focus:outline-none"
                placeholder="Digite aqui..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          </label>
          <div className="flex flex-col items-center justify-center gap-1 w-full">
            <button
              onClick={() => {
                confirmValue(value);
                setOpen(false);
              }}
              className="btn font-bold px-4 py-2 bg-gray-900 text-white hover:bg-gray-600 rounded-md w-full">
              Confirmar
            </button>
            <button
              onClick={() => setOpen(false)}
              className="btn font-bold px-4 py-2 bg-white text-rose-600 hover:bg-rose-200 rounded-md w-full">
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
  modalDescription: string;
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
        <div className="flex flex-col it space-y-2 gap-2 w-full mt-4">
          <label className="flex flex-col gap-2 w-full">
            <LuCircleAlert size={48} className="mx-auto text-red-500" />
            <span className="text-base text-gray-500">{modalDescription}</span>
          </label>
          <div className="flex flex-col items-center justify-center gap-1 w-full">
            <button
              onClick={() => {
                confirmAction();
                setOpen(false);
              }}
              className="btn font-bold px-4 py-2 bg-gray-900 text-white hover:bg-gray-600 rounded-md w-full">
              Confirmar
            </button>
            <button
              onClick={() => setOpen(false)}
              className="btn font-bold px-4 py-2 bg-white text-rose-600 hover:bg-rose-200 rounded-md w-full">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
