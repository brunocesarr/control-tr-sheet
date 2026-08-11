import type { Metadata } from 'next';

import FilterSection from '@/components/FilterSection';
import Navbar from '@/components/Navbar';
import Table from '@/components/Table';
import SheetProvider from '@/contexts/useSheetContext';
import QueryProvider from '@/providers/QueryProvider';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Now a Server Component. The admin check moved to middleware.ts, which
 * eliminates the flash of dashboard content non-admins used to see while
 * the old useEffect redirect was still pending.
 */
export default function HomePage() {
  return (
    <QueryProvider>
      <SheetProvider>
        <main className="flex h-full flex-col">
          <Navbar>Controle de ITR&apos;s</Navbar>
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <FilterSection />
            <Table />
          </div>
        </main>
      </SheetProvider>
    </QueryProvider>
  );
}
