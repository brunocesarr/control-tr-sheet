import { MdCheckCircleOutline, MdErrorOutline, MdInfoOutline } from 'react-icons/md';

type BannerTone = 'error' | 'success' | 'info';

interface FormBannerProps {
  tone: BannerTone;
  children: React.ReactNode;
}

const TONES = {
  error: { wrapper: 'border-red-200 bg-red-50 text-red-800', icon: MdErrorOutline },
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: MdCheckCircleOutline,
  },
  info: { wrapper: 'border-amber-200 bg-amber-50 text-amber-800', icon: MdInfoOutline },
} as const satisfies Record<BannerTone, { wrapper: string; icon: React.ElementType }>;

/** Replaces the AlertModal on auth screens — non-blocking and screen-reader announced. */
export default function FormBanner({ tone, children }: FormBannerProps) {
  const { wrapper, icon: Icon } = TONES[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${wrapper}`}>
      <Icon aria-hidden className="mt-0.5 shrink-0 text-base" />
      <span>{children}</span>
    </div>
  );
}
