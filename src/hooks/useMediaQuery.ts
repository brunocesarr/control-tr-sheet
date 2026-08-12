'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * useSyncExternalStore instead of useEffect + setState: no state write during
 * commit, and getServerSnapshot keeps hydration clean.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}
