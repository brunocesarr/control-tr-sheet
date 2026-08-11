import Image from 'next/image';
import Link from 'next/link';
import { MdLockOutline, MdSpeed, MdTableChart } from 'react-icons/md';

interface AuthShellProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /** Rendered under the form — usually a link to the alternate flow. */
  footer?: React.ReactNode;
}

const HIGHLIGHTS = [
  { icon: MdTableChart, label: 'Sincronizado com a planilha oficial' },
  { icon: MdSpeed, label: 'Busca por CPF, CIB ou imóvel em segundos' },
  { icon: MdLockOutline, label: 'Acesso restrito e auditável' },
];

/**
 * Split-screen shell shared by login, register and recovery so the three
 * screens stay visually identical and only the form body changes.
 */
export default function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* ── Form panel ──────────────────────────────────────────────────── */}
      <div className="flex w-full flex-col lg:w-1/2">
        {/* Compact brand strip, mobile only */}
        <div className="flex items-center gap-2 bg-slate-900 px-6 py-4 lg:hidden">
          <span className="grid size-8 place-items-center rounded bg-emerald-500 text-sm font-bold text-slate-900">
            IT
          </span>
          <span className="text-sm font-medium text-white">Controle de ITR&apos;s</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <Link href="/login" className="mb-8 hidden items-center gap-2 lg:inline-flex">
              <span className="grid size-9 place-items-center rounded-md bg-slate-900 text-sm font-bold text-emerald-400">
                IT
              </span>
              <span className="text-sm font-semibold text-slate-900">Controle de ITR&apos;s</span>
            </Link>

            {eyebrow && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                {eyebrow}
              </p>
            )}
            <h1 id="auth-title" className="text-2xl font-semibold text-slate-900">
              {title}
            </h1>
            <p id="auth-subtitle" className="mt-1.5 text-sm text-slate-500">
              {subtitle}
            </p>

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 border-t border-slate-100 pt-6">{footer}</div>}
          </div>
        </div>
      </div>

      {/* ── Brand panel ─────────────────────────────────────────────────── */}
      <aside className="relative hidden w-1/2 overflow-hidden bg-slate-900 lg:block">
        <Image
          src="/img/login-img.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/85 to-emerald-950/70" />

        <div className="relative flex h-full flex-col justify-end p-12">
          <h2 id="brand-title" className="max-w-sm text-3xl font-semibold leading-tight text-white">
            Toda a gestão do <span className="text-emerald-400">ITR</span> em um só lugar.
          </h2>
          <p
            id="brand-description"
            className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">
            Acompanhe as entregas das declarações do Imposto sobre a Propriedade Territorial Rural
            sem perder o controle da planilha.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/10 text-emerald-400">
                  <Icon aria-hidden />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
