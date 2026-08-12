import type { Transition, Variants } from 'motion/react';

/**
 * Every animation in the app pulls its timing from here.
 *
 * Two springs and one tween is deliberately the whole vocabulary — the moment
 * components start inventing their own durations the UI stops feeling like one
 * product. `MotionConfig reducedMotion="user"` (see MotionRoot) neutralises all
 * of these for users who ask for it, so components never branch on the media
 * query themselves.
 */

/** Panels, drawers, modals — visible travel, no overshoot wobble. */
export const springPanel: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.9,
};

/** Small controls: toggle knobs, layout pills, badges. Snappier. */
export const springSnap: Transition = {
  type: 'spring',
  stiffness: 620,
  damping: 32,
  mass: 0.5,
};

/** Opacity-only crossfades, where a spring would look mushy. */
export const tweenFast: Transition = { duration: 0.18, ease: [0.22, 1, 0.36, 1] };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: springPanel },
  exit: { opacity: 0, y: -4, transition: tweenFast },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: springPanel },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: tweenFast },
};

/**
 * Parent orchestrator. Children only need `variants={fadeUp}` — the parent
 * drives `hidden`/`visible` through them, so no child owns a delay literal.
 */
export const staggerParent = (stagger = 0.05, delayChildren = 0.04): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});
