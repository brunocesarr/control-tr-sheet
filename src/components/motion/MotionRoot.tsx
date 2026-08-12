'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * `reducedMotion="user"` makes every motion component in the tree drop
 * transform/layout animations when the OS asks for it, keeping opacity only.
 * One wrapper replaces a `prefers-reduced-motion` check in ~15 components.
 */
export default function MotionRoot({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
