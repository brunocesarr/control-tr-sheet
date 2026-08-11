import SessionExpiryListener from '@/components/SessionExpiryListener';
import Sidebar from '@/components/Sidebar';

/**
 * No 'use client' needed — this layout has no hooks or state. Sidebar and
 * SessionExpiryListener declare their own client boundaries.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SessionExpiryListener />
      <Sidebar />
      <div className="min-w-0 grow">{children}</div>
    </div>
  );
}
