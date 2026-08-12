'use client';

import { useSyncExternalStore } from 'react';

/**
 * A shared ticking clock exposed as an external store.
 *
 * Why a module-level store rather than `useState(Date.now())` + an interval:
 *
 *  1. getSnapshot MUST return a cached value. Returning a fresh `Date.now()`
 *     on every call makes React see a new snapshot each time and loop forever.
 *     `snapshot` is therefore only reassigned inside `emit()`.
 *  2. One interval is shared by every subscriber and cleared when the last one
 *     unmounts, instead of one timer per component instance.
 *  3. `Date.now()` is never called during render, which is what the
 *     react-hooks/purity rule is protecting.
 */
const DEFAULT_INTERVAL_MS = 30_000;

let snapshot = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function emit() {
  snapshot = Date.now();
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  if (timer === null) {
    snapshot = Date.now();
    timer = setInterval(emit, DEFAULT_INTERVAL_MS);
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Epoch ms, refreshed every 30s. Returns 0 on the server. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => 0
  );
}
