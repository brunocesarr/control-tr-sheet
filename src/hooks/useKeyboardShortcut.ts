'use client';

import { useEffect } from 'react';

interface ShortcutOptions {
  /** Fire even while an input is focused. Default false. */
  allowInInput?: boolean;
}

/**
 * Global key handler.
 *
 * This is a legitimate useEffect: it subscribes to an external event source and
 * cleans up on unmount. No setState happens in the effect body, so
 * react-hooks/set-state-in-effect does not apply.
 */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  { allowInInput = false }: ShortcutOptions = {}
) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key) return;

      if (!allowInInput) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName;
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          target?.isContentEditable
        ) {
          return;
        }
      }

      handler(event);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, handler, allowInInput]);
}
