'use client';

import { FilterSection } from '@/components/FilterSection';
import Table from '@/components/Table';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SheetProvider from '@/contexts/useSheetContext';
import Navbar from '@/components/Navbar';
import { useContext } from 'react';
import { AuthContext } from '@/contexts/useAuthContext';
import { redirect } from 'next/navigation';

const queryClient = new QueryClient();

export default function Home() {
  const { loggedInUser } = useContext(AuthContext);

  if (loggedInUser && !loggedInUser.labels.includes('admin')) return redirect('/profile');

  return (
    <QueryClientProvider client={queryClient}>
      <SheetProvider>
        <div className="h-full w-full">
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
