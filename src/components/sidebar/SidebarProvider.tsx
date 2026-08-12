'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { usePersistedState } from '@/hooks/usePersistedState';

/**
 * Sidebar state lives above both the rail and the Navbar so the mobile
 * hamburger can sit *inside* the Navbar instead of floating over the page
 * content, which is what the old `fixed top-3 left-3` button did (it overlapped
 * the "Controle de ITR's" title on small screens).
 */

export const SIDEBAR_COLLAPSED_KEY = 'control-tr:sidebar-collapsed';

interface SidebarContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  /** Convenience for the Navbar trigger. */
  openMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used inside <SidebarProvider>.');
  return context;
}

export default function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = usePersistedState(SIDEBAR_COLLAPSED_KEY, false);

  /**
   * Plain useState, NOT usePersistedState.
   *
   * The previous line used usePersistedState with the key
   * 'control-tr:sidebar-mobile', which contradicted its own comment: the drawer
   * state survived reloads, so a drawer left open reopened over the content on
   * next load. Ephemeral UI state must not be persisted.
   */
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = useCallback(() => setCollapsed((current) => !current), [setCollapsed]);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, setMobileOpen, openMobile }),
    [collapsed, toggleCollapsed, mobileOpen, openMobile]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
