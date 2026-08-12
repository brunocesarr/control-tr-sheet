interface AvatarProps {
  name?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
} as const;

/** Deterministic gradients so a user always gets the same colour. */
const GRADIENTS = [
  'from-emerald-400 to-teal-600',
  'from-sky-400 to-indigo-600',
  'from-amber-400 to-orange-600',
  'from-fuchsia-400 to-purple-600',
  'from-rose-400 to-red-600',
  'from-lime-400 to-emerald-600',
] as const;

const FALLBACK_GRADIENT: string = GRADIENTS[0];

/**
 * `charAt()` is used instead of `parts[0][0]` because it returns `string`
 * unconditionally — no index access, so nothing to narrow.
 */
function initialsOf(name?: string | null, email?: string | null): string {
  const emailLocalPart = email?.split('@').at(0);
  const source = name?.trim() || emailLocalPart || '?';
  const parts = source.split(/[\s._-]+/).filter(Boolean);

  const first = parts.at(0);
  if (!first) return '?';

  const last = parts.at(-1);
  if (!last || parts.length === 1) return first.slice(0, 2).toUpperCase();

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function gradientOf(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997;
  }
  return GRADIENTS[hash % GRADIENTS.length] ?? FALLBACK_GRADIENT;
}

export default function Avatar({ name, email, size = 'md', className = '' }: AvatarProps) {
  const seed = email || name || 'anon';

  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm ring-2 ring-white/15 ${gradientOf(seed)} ${SIZES[size]} ${className}`}>
      {initialsOf(name, email)}
    </span>
  );
}
