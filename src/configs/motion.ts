import type { Transition, Variants } from 'motion/react';

/** UI that must feel instant: toggles, active pills, drawers. */
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 32,
  mass: 0.7,
};

/** Larger surfaces: panels, progress bars, layout shifts. */
export const springSoft: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 26,
};

export const easeOut: Transition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };
export const easeOutFast: Transition = { duration: 0.15, ease: [0.22, 1, 0.36, 1] };

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -8, transition: easeOutFast },
};

/** Parent of any animated list. Children use `listItem`. */
export const listContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.03 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: easeOut },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
  visible: { opacity: 1, backdropFilter: 'blur(6px)', transition: easeOut },
  exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: easeOutFast },
};

/** Desktop dialog. */
export const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: easeOutFast },
};

/** Mobile bottom sheet. */
export const sheetVariants: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0, y: '100%', transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

export const drawerVariants: Variants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: springSnappy },
  exit: { x: '-100%', transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

/** Icon pop used in alert/confirm dialogs. */
export const iconPop: Variants = {
  hidden: { scale: 0.4, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { ...springSnappy, delay: 0.06 } },
};
