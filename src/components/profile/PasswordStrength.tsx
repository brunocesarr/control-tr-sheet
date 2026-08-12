'use client';

import { AnimatePresence, motion } from 'motion/react';
import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';

import { springSoft } from '@/configs/motion';

interface Rule {
  label: string;
  satisfied: boolean;
}

interface Level {
  label: string;
  bar: string;
  text: string;
}

/**
 * `as const` makes this a readonly tuple rather than an array, so fixed-index
 * reads like LEVELS[0] are known-present even under noUncheckedIndexedAccess.
 * Only the computed lookup below needs a fallback.
 */
const LEVELS = [
  { label: 'Muito fraca', bar: 'bg-red-500', text: 'text-red-600' },
  { label: 'Fraca', bar: 'bg-orange-500', text: 'text-orange-600' },
  { label: 'Razoável', bar: 'bg-amber-500', text: 'text-amber-600' },
  { label: 'Boa', bar: 'bg-lime-500', text: 'text-lime-700' },
  { label: 'Forte', bar: 'bg-emerald-500', text: 'text-emerald-700' },
] as const satisfies readonly Level[];

const WEAKEST: Level = LEVELS[0];

/**
 * Turns `describePasswordRules()` output into a meter plus a live checklist.
 *
 * Strength is derived from the ratio of satisfied rules, so it stays in sync
 * with validators.ts automatically — adding a rule there needs no change here.
 */
export default function PasswordStrength({ rules }: { rules: Rule[] }) {
  const satisfied = rules.filter((rule) => rule.satisfied).length;
  const ratio = rules.length > 0 ? satisfied / rules.length : 0;
  const filledSegments = Math.ceil(ratio * LEVELS.length);
  const levelIndex = Math.min(Math.max(filledSegments - 1, 0), LEVELS.length - 1);

  // `?? WEAKEST` satisfies the compiler; levelIndex is already clamped in range.
  const level: Level = LEVELS[levelIndex] ?? WEAKEST;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {LEVELS.map((_, index) => {
            const filled = index < filledSegments;
            return (
              <motion.span
                key={index}
                animate={{ opacity: filled ? 1 : 0.25 }}
                transition={springSoft}
                className={`h-1.5 flex-1 rounded-full ${filled ? level.bar : 'bg-slate-200'}`}
              />
            );
          })}
        </div>

        <motion.span
          key={level.label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs font-semibold ${level.text}`}>
          {level.label}
        </motion.span>
      </div>

      <ul className="grid gap-1.5 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {rules.map((rule, index) => (
            <motion.li
              key={rule.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex items-center gap-1.5 text-xs ${
                rule.satisfied ? 'text-emerald-700' : 'text-slate-500'
              }`}>
              {/* Keyframe pop confirms the moment a rule flips to satisfied. */}
              <motion.span
                animate={rule.satisfied ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex">
                {rule.satisfied ? (
                  <MdCheckCircle aria-hidden className="text-emerald-600" />
                ) : (
                  <MdRadioButtonUnchecked aria-hidden className="text-slate-300" />
                )}
              </motion.span>
              {rule.label}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
