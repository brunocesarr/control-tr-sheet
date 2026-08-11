import Sidebar from '@/components/Sidebar';

/**
 * Dropped the 'use client' directive — this layout has no hooks or state.
 * Sidebar is the only client component, and it declares that itself.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="min-w-0 grow">{children}</div>
    </div>
  );
}
