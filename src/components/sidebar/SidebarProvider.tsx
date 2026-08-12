'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

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
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used inside <SidebarProvider>.');
  return context;
}

export default function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = usePersistedState(SIDEBAR_COLLAPSED_KEY, false);
  // Deliberately not persisted — a drawer restored open on load is a bug.
  const [mobileOpen, setMobileOpen] = usePersistedState('control-tr:sidebar-mobile', false);

  const toggleCollapsed = useCallback(() => setCollapsed((current) => !current), [setCollapsed]);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, setMobileOpen }),
    [collapsed, toggleCollapsed, mobileOpen, setMobileOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
