import type { Metadata } from 'next';

import SelectionBar from '@/components/dashboard/SelectionBar';
import StatsOverview from '@/components/dashboard/StatsOverview';
import SyncIndicator from '@/components/dashboard/SyncIndicator';
import FilterSection from '@/components/FilterSection';
import Navbar from '@/components/Navbar';
import Table from '@/components/Table';
import SheetProvider from '@/contexts/useSheetContext';
import QueryProvider from '@/providers/QueryProvider';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Server Component. The admin check lives in proxy.ts, which removes the flash
 * of dashboard content non-admins previously saw.
 *
 * Providers wrap the whole page so Navbar's SyncIndicator can read the query
 * state alongside the table.
 */
export default function HomePage() {
  return (
    <QueryProvider>
      <SheetProvider>
        <main className="flex h-full flex-col bg-slate-50">
          <Navbar actions={<SyncIndicator />}>Controle de ITR&apos;s</Navbar>

          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <StatsOverview />
            <FilterSection />
            <SelectionBar />
            <Table />
          </div>
        </main>
      </SheetProvider>
    </QueryProvider>
  );
}
