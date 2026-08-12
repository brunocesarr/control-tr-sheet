'use client';

import { useSyncExternalStore } from 'react';

/**
 * `false` during SSR and the hydration pass, `true` afterwards.
 *
 * Replaces the `useEffect(() => setMounted(true), [])` pattern, which trips
 * react-hooks/set-state-in-effect. useSyncExternalStore gets the same result
 * without a commit-phase setState: React uses getServerSnapshot for the initial
 * render (so markup matches the server) and getSnapshot after hydration.
 *
 * Module-level constant — an inline `() => () => {}` would be a new reference
 * every render and force React to resubscribe each time.
 */
const emptySubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
