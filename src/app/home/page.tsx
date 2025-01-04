'use client';

import { FilterSection } from '@/components/FilterSection';
import Table from '@/components/Table';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SheetProvider from '@/contexts/useSheetContext';

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <SheetProvider>
        <div className="h-full w-full">
          <FilterSection />
          <Table />
        </div>
      </SheetProvider>
    </QueryClientProvider>
  );
}
