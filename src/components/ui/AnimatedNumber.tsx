'use client';

import { useSpring, useTransform, motion } from 'motion/react';
import { useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  suffix?: string;
}

/**
 * Counts to `value` instead of snapping.
 *
 * Beyond polish this carries information: after a bulk "Marcar entregue" you
 * can see *which* KPIs moved and by roughly how much, which a hard swap hides.
 * `tabular-nums` on the caller keeps the digits from jittering mid-count.
 */
export default function AnimatedNumber({ value, className = '', suffix }: AnimatedNumberProps) {
  const spring = useSpring(value, { stiffness: 90, damping: 20, mass: 0.6 });
  const display = useTransform(spring, (latest) => Math.round(latest).toLocaleString('pt-BR'));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <span className={className}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
