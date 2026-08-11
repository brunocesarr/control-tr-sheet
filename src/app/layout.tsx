import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { ToastContainer } from 'react-toastify';

import Loader from '@/components/Loader';
import AuthProvider from '@/contexts/useAuthContext';

import './globals.css';
import 'react-toastify/dist/ReactToastify.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

/**
 * Document shell rendered via string constants. React emits the exact same
 * elements; swap these for the literal lowercase tags if you prefer.
 */
const Html = 'html' as const;
const Body = 'body' as const;

export const metadata: Metadata = {
  title: { default: "Controle de ITR's", template: "%s | Controle de ITR's" },
  description: 'Gestão de entregas de declarações do Imposto Territorial Rural.',
  robots: { index: false, follow: false }, // internal tool — keep it out of search
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Html lang="pt-br" suppressHydrationWarning>
      <Body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* AuthProvider reads useSearchParams, so it needs a Suspense boundary. */}
        <Suspense fallback={<Loader />}>
          <AuthProvider>{children}</AuthProvider>
        </Suspense>
        <ToastContainer position="top-right" autoClose={4000} theme="colored" newestOnTop />
      </Body>
    </Html>
  );
}
