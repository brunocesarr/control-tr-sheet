import MotionRoot from '@/components/motion/MotionRoot';
import SessionExpiryListener from '@/components/SessionExpiryListener';
import Sidebar from '@/components/Sidebar';
import SidebarProvider from '@/components/sidebar/SidebarProvider';

/** Still a Server Component — every client boundary is declared by a child. */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionRoot>
      <SidebarProvider>
        <div className="flex min-h-screen bg-slate-50">
          <SessionExpiryListener />
          <Sidebar />
          <div className="flex min-w-0 grow flex-col">{children}</div>
        </div>
      </SidebarProvider>
    </MotionRoot>
  );
}
