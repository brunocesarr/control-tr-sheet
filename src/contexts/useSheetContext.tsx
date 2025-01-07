'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useEffect, useState } from 'react';
import { Bounce, ToastContainer, toast } from 'react-toastify';

import { LocalStorageKeysCache } from '@/configs/local-storage-keys';
import type { SheetRowData } from '@/interfaces/tr-sheet';
import { updateAllTRStatus, updateTRStatus } from '@/repositories/sheet.repository';
import { getManagerTable } from '@/services/sheet.service';

interface ISheetContext {
  filter: {
    keyword?: string;
    status?: string;
    pageSize: number;
  };
  setFilter: ({}: { keyword?: string; status?: string; pageSize: number }) => void;
  updateStatus: (item: SheetRowData) => Promise<void>;
  updateAllToNoDeliveryStatus: () => Promise<void>;
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
    pageSize: number;
  }>({
    pageSize: 15,
  });
  const queryClient = useQueryClient();

  const {
    isLoading: isLoadingData,
    data,
    error,
    isFetching,
    isPending,
  } = useQuery({
    queryKey: [LocalStorageKeysCache.GOOGLE_SHEET_SERVICE_GET_TR_SHEET],
    queryFn: async () => {
      return getManagerTable();
    },
    staleTime: 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return getManagerTable();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [LocalStorageKeysCache.GOOGLE_SHEET_SERVICE_GET_TR_SHEET],
      });
    },
  });

  useEffect(() => {
    if (error && !isFetching) {
      console.error(error);
      toast.error('Erro ao carregar dados');
    }
  }, [error, isFetching]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const { keyword, status } = filter;
    if (keyword || status) {
      setIsLoading(true);
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
      setIsLoading(false);
    } else {
      setFilteredValues(data);
    }
  }, [data, filter]);

  const updateStatus = async (item: SheetRowData) => {
    try {
      setIsLoading(true);
      await updateTRStatus(item.cellRange, !item.hasDone);
      await mutation.mutateAsync();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAllToNoDeliveryStatus = async () => {
    try {
      setIsLoading(true);
      if (!data) return;

      await updateAllTRStatus(false);
      await mutation.mutateAsync();
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const providerValue = {
    filter,
    setFilter,
    response: filteredValues,
    updateStatus,
    updateAllToNoDeliveryStatus,
    isLoading: isLoading || isLoadingData || isFetching || isPending,
  };

  return (
    <SheetContext.Provider value={providerValue}>
      {children}{' '}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
    </SheetContext.Provider>
  );
};

export default SheetProvider;
