'use client';

import { FilterSection } from '@/components/FilterSection';
import Table from '@/components/Table';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SheetProvider from '@/contexts/useSheetContext';
import Navbar from '@/components/Navbar';

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <SheetProvider>
        <div className="h-full w-full">
          <Navbar>
            <p>Bem vindo</p>
          </Navbar>
          <FilterSection />
          <Table />
        </div>
      </SheetProvider>
    </QueryClientProvider>
  );
}
