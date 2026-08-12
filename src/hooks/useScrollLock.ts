'use client';

import { useEffect } from 'react';

/**
 * Locks body scroll without the layout jump.
 *
 * The previous inline version set `overflow: hidden` only, so on desktop the
 * scrollbar vanished and the whole page shifted ~15px right the instant a modal
 * opened. Compensating with padding keeps it still.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [active]);
}
