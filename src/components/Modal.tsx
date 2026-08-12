'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

import { overlayVariants, panelVariants, sheetVariants } from '@/configs/motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useHydrated } from '@/hooks/useHydrated';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useScrollLock } from '@/hooks/useScrollLock';

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
} as const;

interface IModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  showClose?: boolean;
  /** Set false for irreversible flows that must be answered explicitly. */
  dismissible?: boolean;
}

export default function Modal({
  open,
  onClose,
  children,
  title,
  description,
  icon,
  footer,
  size = 'md',
  showClose = true,
  dismissible = true,
}: IModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  /**
   * `useHydrated()` replaces `useEffect(() => setMounted(true), [])`.
   *
   * That pattern wrote state during the commit phase on every mount, which
   * react-hooks/set-state-in-effect flags as a cascading render. The hook wraps
   * useSyncExternalStore instead: getServerSnapshot returns false so SSR and
   * the hydration pass agree, then getSnapshot returns true afterwards — same
   * "is the DOM available for createPortal" signal, zero setState.
   */
  const mounted = useHydrated();
  const isMobile = useMediaQuery('(max-width: 639px)');

  useScrollLock(open);
  useFocusTrap(panelRef, open);

  const requestClose = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  /**
   * Escape-to-close. This effect only subscribes to an external system and
   * calls back into React from the event handler, so it satisfies the rule —
   * unlike a synchronous setState in the effect body.
   */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, requestClose]);

  // createPortal needs a real document; bail out until hydration completes.
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            role="presentation"
            onClick={requestClose}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-slate-950/50"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            /* Bottom sheet on phones, centred dialog from `sm` up. */
            variants={isMobile ? sheetVariants : panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag={isMobile && dismissible ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) requestClose();
            }}
            className={`relative flex max-h-[92vh] scrollbar-slim w-full flex-col overflow-y-auto rounded-t-2xl bg-white shadow-overlay outline-none sm:rounded-2xl ${SIZES[size]}`}>
            {/* Grab handle doubles as the drag affordance on phones. */}
            <span
              aria-hidden
              className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden"
            />

            {showClose && dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <MdClose aria-hidden />
              </button>
            )}

            <div className="flex flex-col gap-4 p-6">
              {(icon || title || description) && (
                <header className="flex flex-col items-center gap-3 text-center">
                  {icon}
                  {title && (
                    <h3 id={titleId} className="text-lg font-semibold text-slate-900">
                      {title}
                    </h3>
                  )}
                  {description && (
                    <p id={descriptionId} className="text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  )}
                </header>
              )}

              {children}
            </div>

            {footer && (
              <footer className="sticky bottom-0 border-t border-slate-100 bg-slate-50/80 px-6 py-4 backdrop-blur">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
