'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * Copies text and reports success for a short window so the UI can show a tick.
 *
 * The timeout is cleared on each new copy via a ref, which avoids a stale timer
 * resetting the indicator early when the user copies twice in quick succession.
 */
export function useCopyToClipboard(resetAfterMs = 1500) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (value: string, key: string) => {
      try {
        await navigator.clipboard.writeText(value);
        if (timer.current) clearTimeout(timer.current);
        setCopiedKey(key);
        timer.current = setTimeout(() => setCopiedKey(null), resetAfterMs);
      } catch {
        // Clipboard is unavailable over plain HTTP or without permission.
        // Silent failure is acceptable — the value is still visible on screen.
      }
    },
    [resetAfterMs]
  );

  return { copy, copiedKey };
}
