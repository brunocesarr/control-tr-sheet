import type { Metadata } from 'next';

/** Client pages cannot export metadata, so a thin server layout supplies it. */
export const metadata: Metadata = { title: 'Entrar' };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
