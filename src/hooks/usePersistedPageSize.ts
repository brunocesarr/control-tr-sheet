'use client';

import { useCallback, useSyncExternalStore } from 'react';

import { LocalStorageKeysCache } from '@/configs/local-storage-keys';
import localStorageService from '@/services/localStorage.service';

export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 15;

/** Same-tab change notification; `storage` only fires in OTHER tabs. */
const PAGE_SIZE_EVENT = 'control-tr-sheet:page-size';

function isPageSize(value: unknown): value is PageSize {
  return typeof value === 'number' && (PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

/**
 * Reads localStorage. Returns a primitive, so referential stability — which
 * useSyncExternalStore requires — is automatic.
 *
 * Tolerates the legacy `{ pageSize: number }` envelope as well as a bare
 * number, so previously stored preferences are not lost.
 */
function getSnapshot(): PageSize {
  const saved = localStorageService.getItem<unknown>(
    LocalStorageKeysCache.SHEET_FILTER_PREFERENCES
  );

  if (isPageSize(saved)) return saved;

  if (saved && typeof saved === 'object' && 'pageSize' in saved) {
    const candidate = (saved as { pageSize: unknown }).pageSize;
    if (isPageSize(candidate)) return candidate;
  }

  return DEFAULT_PAGE_SIZE;
}

/** SSR has no localStorage. Returning the default here avoids a hydration mismatch. */
function getServerSnapshot(): PageSize {
  return DEFAULT_PAGE_SIZE;
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(PAGE_SIZE_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);

  return () => {
    window.removeEventListener(PAGE_SIZE_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

/**
 * Page-size preference backed by localStorage.
 *
 * Replaces the previous `useEffect` + `setState` bootstrap, which tripped
 * react-hooks/set-state-in-effect and caused a redundant second render on
 * every mount. useSyncExternalStore is the primitive designed for exactly
 * this: subscribing to an external (non-React) store.
 */
export function usePersistedPageSize(): [PageSize, (next: number) => void] {
  const pageSize = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPageSize = useCallback((next: number) => {
    if (!isPageSize(next)) return;

    // `null` TTL — a UI preference should never silently expire.
    localStorageService.setItem(LocalStorageKeysCache.SHEET_FILTER_PREFERENCES, next, null);
    window.dispatchEvent(new Event(PAGE_SIZE_EVENT));
  }, []);

  return [pageSize, setPageSize];
}
