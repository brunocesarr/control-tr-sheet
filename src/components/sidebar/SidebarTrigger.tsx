'use client';

import { motion } from 'motion/react';
import { MdMenu } from 'react-icons/md';

import { useSidebar } from '@/components/sidebar/SidebarProvider';

/**
 * Mobile-only drawer trigger, rendered inside the Navbar.
 *
 * This is the button the SidebarProvider docstring describes. The refactor that
 * moved sidebar state into context removed the old `fixed top-3 left-3` button
 * from Sidebar.tsx but never added its replacement here — leaving
 * setMobileOpen(true) with no call site and the drawer unreachable on phones.
 *
 * `sm:hidden` mirrors the rail's `hidden sm:flex`, so exactly one navigation
 * affordance exists at every breakpoint.
 */
export default function SidebarTrigger() {
  const { openMobile, mobileOpen } = useSidebar();

  return (
    <motion.button
      type="button"
      onClick={openMobile}
      aria-label="Abrir menu de navegação"
      aria-expanded={mobileOpen}
      aria-controls="sidebar-mobile-drawer"
      whileTap={{ scale: 0.92 }}
      className="-ml-1 grid size-10 shrink-0 place-items-center rounded-xl text-slate-300 transition-colors hover:bg-white/10 hover:text-white sm:hidden">
      <MdMenu aria-hidden className="text-2xl" />
    </motion.button>
  );
}
