'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Visible, tabbable descendants in DOM order. */
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (node) => node.offsetParent !== null || node === document.activeElement
  );
}

/**
 * Confines Tab navigation to `containerRef` while `active`, focuses the first
 * control on open, and restores focus to the previously focused element on
 * close. Subscribe-only: no setState, so react-hooks/set-state-in-effect and
 * react-hooks/purity both stay satisfied.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // rAF lets the open animation mount its children before we reach for one.
    const frame = requestAnimationFrame(() => {
      const initial = getFocusable(container).at(0);
      (initial ?? container).focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const nodes = getFocusable(container);
      const first = nodes.at(0);
      const last = nodes.at(-1);

      /**
       * `.at()` is typed `T | undefined`, so this guard is what narrows `first`
       * and `last` for the comparisons below — it also correctly handles a
       * dialog with no focusable children by parking focus on the panel.
       */
      if (!first || !last) {
        event.preventDefault();
        container.focus();
        return;
      }

      const activeElement = document.activeElement;

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && (activeElement === first || activeElement === container)) {
        event.preventDefault();
        last.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, containerRef]);
}
