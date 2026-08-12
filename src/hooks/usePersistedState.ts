'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * localStorage-backed state.
 *
 * Uses `useSyncExternalStore` rather than the usual `useState` + `useEffect`
 * hydration dance for two reasons:
 *
 *   1. The repo's lint config flags `react-hooks/set-state-in-effect` (see the
 *      note in NewEmailModal), which the read-on-mount pattern trips.
 *   2. `getServerSnapshot` gives SSR the fallback while the client reads the
 *      real value on the first commit — no flash, no mismatch warning.
 *
 * `getSnapshot` must be referentially stable between reads or React loops, so
 * the parsed value is cached and only re-parsed when the raw string changes.
 */

interface Store<T> {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  write: (next: T) => void;
}

const stores = new Map<string, Store<unknown>>();

function createStore<T>(key: string, fallback: T): Store<T> {
  const listeners = new Set<() => void>();
  let rawCache: string | null = null;
  let valueCache: T = fallback;
  let primed = false;

  const read = (): T => {
    if (typeof window === 'undefined') return fallback;

    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return valueCache; // Safari private mode, quota errors, etc.
    }

    if (!primed || raw !== rawCache) {
      primed = true;
      rawCache = raw;
      if (raw === null) {
        valueCache = fallback;
      } else {
        try {
          valueCache = JSON.parse(raw) as T;
        } catch {
          valueCache = fallback;
        }
      }
    }

    return valueCache;
  };

  const emit = () => listeners.forEach((listener) => listener());

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      // Keeps sibling tabs (and other hook instances on the same key) in sync.
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) onChange();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onStorage);
      };
    },
    getSnapshot: read,
    getServerSnapshot: () => fallback,
    write(next) {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* Persistence is best-effort; in-memory state still updates. */
      }
      rawCache = JSON.stringify(next);
      valueCache = next;
      primed = true;
      emit();
    },
  };
}

export function usePersistedState<T>(key: string, fallback: T) {
  const store = useMemo(() => {
    const existing = stores.get(key) as Store<T> | undefined;
    if (existing) return existing;
    const created = createStore(key, fallback);
    stores.set(key, created as Store<unknown>);
    return created;
    // `fallback` is intentionally excluded: it only seeds the first mount, and
    // including it would rebuild the store on every render for object literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const value = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const set = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved =
        typeof next === 'function' ? (next as (current: T) => T)(store.getSnapshot()) : next;
      store.write(resolved);
    },
    [store]
  );

  return [value, set] as const;
}
