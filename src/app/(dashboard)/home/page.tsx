'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { useContext } from 'react';

import { FilterSection } from '@/components/FilterSection';
import Navbar from '@/components/Navbar';
import Table from '@/components/Table';
import { AuthContext } from '@/contexts/useAuthContext';
import SheetProvider from '@/contexts/useSheetContext';

const queryClient = new QueryClient();

export default function Home() {
  const { loggedInUser } = useContext(AuthContext);

  if (loggedInUser && !loggedInUser.labels.includes('admin')) return redirect('/profile');

  return (
    <QueryClientProvider client={queryClient}>
      <SheetProvider>
        <div className="size-full">
          <Navbar>
            <p>Lista de ITR{"'"}s</p>
          </Navbar>
          <FilterSection />
          <Table />
        </div>
      </SheetProvider>
    </QueryClientProvider>
  );
}
