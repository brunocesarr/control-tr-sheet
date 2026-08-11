'use client';

import { MdCheckCircle, MdRadioButtonUnchecked } from 'react-icons/md';

import { describePasswordRules } from '@/helpers/validators';

interface PasswordChecklistProps {
  password: string;
}

const STRENGTH_STYLES = [
  { width: 'w-0', bar: 'bg-transparent', label: '', text: '' },
  { width: 'w-1/5', bar: 'bg-red-500', label: 'Muito fraca', text: 'text-red-600' },
  { width: 'w-2/5', bar: 'bg-orange-500', label: 'Fraca', text: 'text-orange-600' },
  { width: 'w-3/5', bar: 'bg-amber-500', label: 'Razoável', text: 'text-amber-600' },
  { width: 'w-4/5', bar: 'bg-lime-500', label: 'Boa', text: 'text-lime-600' },
  { width: 'w-full', bar: 'bg-emerald-500', label: 'Forte', text: 'text-emerald-600' },
] as const;

/** Meter + checklist driven by the same rules the validator enforces. */
export default function PasswordChecklist({ password }: PasswordChecklistProps) {
  if (!password) return null;

  const rules = describePasswordRules(password);
  const satisfied = rules.filter((rule) => rule.satisfied).length;
  const strength = STRENGTH_STYLES[satisfied];

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full transition-all ${strength.width} ${strength.bar}`} />
        </div>
        <span className={`text-xs font-medium ${strength.text}`}>{strength.label}</span>
      </div>

      <ul className="grid gap-1">
        {rules.map((rule) => (
          <li
            key={rule.label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              rule.satisfied ? 'text-emerald-700' : 'text-slate-500'
            }`}>
            {rule.satisfied ? (
              <MdCheckCircle aria-hidden className="shrink-0 text-emerald-600" />
            ) : (
              <MdRadioButtonUnchecked aria-hidden className="shrink-0 text-slate-300" />
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
