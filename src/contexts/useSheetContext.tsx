'use client';

import { LocalStorageKeysCache } from '@/configs/local-storage-keys';
import { SheetRowData } from '@/interfaces/tr-sheet';
import { updateTRStatus } from '@/repositories/sheet.repository';
import { getManagerTable } from '@/services/sheet.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useEffect, useState } from 'react';

interface ISheetContext {
  filter: any;
  setFilter: ({}: any) => void;
  updateStatus: (item: SheetRowData) => Promise<void>;
  response: SheetRowData[];
  isLoading: boolean;
}

export const SheetContext = createContext({} as ISheetContext);

const SheetProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filteredValues, setFilteredValues] = useState<SheetRowData[]>([]);
  const [filter, setFilter] = useState<{
    keyword?: string;
    status?: string;
    page: number;
  }>({
    page: 1,
  });
  const queryClient = useQueryClient();

  const {
    isLoading: isLoadingData,
    data,
    error,
    isFetching,
  } = useQuery({
    queryKey: [LocalStorageKeysCache.GOOGLE_SHEET_SERVICE_GET_TR_SHEET],
    queryFn: async () => {
      return await getManagerTable();
    },
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return await getManagerTable();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [LocalStorageKeysCache.GOOGLE_SHEET_SERVICE_GET_TR_SHEET],
      });
    },
  });

  useEffect(() => {
    if (error && !isFetching) alert(error);
  }, [error, isFetching]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const { keyword, status } = filter;
    if (keyword || status) {
      filterValues();
    } else {
      setFilteredValues(data);
    }
  }, [data, filter]);

  const filterValues = () => {
    let filteredSearch = data?.map((v) => v) ?? [];

    const { keyword, status } = filter;

    if (keyword && keyword.length > 2) {
      filteredSearch = filteredSearch.filter((value) => {
        const foundedByName = value.name.toLowerCase().includes(keyword.toLowerCase());
        const foundedByCPF = value.cpf.replace(/\D/g, '').startsWith(keyword);
        const foundedByCIB = value.cib
          ?.replace(/[^a-zA-Z0-9]/g, '')
          .toLocaleLowerCase()
          .startsWith(keyword.toLocaleLowerCase());
        const foundedByRuralProperty = value.imovelRural
          ?.toLowerCase()
          .includes(keyword.toLowerCase());

        return foundedByName || foundedByCPF || foundedByCIB || foundedByRuralProperty;
      });
    }
    if (status !== undefined && status !== null) {
      if (status === 'entregue') filteredSearch = filteredSearch.filter((value) => value.hasDone);
      if (status === 'nao entregue')
        filteredSearch = filteredSearch.filter((value) => !value.hasDone);
    }

    setFilteredValues(filteredSearch);
  };

  const updateStatus = async (item: SheetRowData) => {
    try {
      setIsLoading(true);
      await updateTRStatus(item.cellRange, !item.hasDone);
      await mutation.mutateAsync();
    } catch (error) {
      alert('Internal error');
    } finally {
      setIsLoading(false);
    }
  };

  const providerValue = {
    filter,
    setFilter,
    response: filteredValues,
    updateStatus,
    isLoading: isLoading || isLoadingData || isFetching,
  };

  return <SheetContext.Provider value={providerValue}>{children}</SheetContext.Provider>;
};

export default SheetProvider;
