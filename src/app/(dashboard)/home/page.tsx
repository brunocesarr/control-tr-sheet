'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';

import { FilterSection } from '@/components/FilterSection';
import Navbar from '@/components/Navbar';
import Table from '@/components/Table';
import { AuthContext } from '@/contexts/useAuthContext';
import SheetProvider from '@/contexts/useSheetContext';

const queryClient = new QueryClient();

export default function Home() {
  const { loggedInUser } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (loggedInUser && !loggedInUser.labels.includes('admin')) return router.push('/profile');
  }, [loggedInUser, router]);

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
