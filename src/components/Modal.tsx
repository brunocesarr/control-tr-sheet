'use client';

import { useEffect } from 'react';
import { MdClose } from 'react-icons/md';

interface IModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, children }: IModalProps) {
  // Escape-to-close + scroll lock; neither existed before.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors ${
        open ? 'visible bg-black/50' : 'invisible bg-black/0'
      }`}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className={`relative max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl transition-all ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
          <MdClose aria-hidden />
        </button>
        {children}
      </div>
    </div>
  );
}
