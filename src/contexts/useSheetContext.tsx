'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'react-toastify';

import { LocalStorageKeysCache } from '@/configs/local-storage-keys';
import { normaliseText, onlyAlphanumeric, onlyDigits } from '@/helpers/utils';
import type { SheetRowData } from '@/interfaces/tr-sheet';
import { getManagerTable, setAllRowsStatus, setRowStatus } from '@/services/sheet.service';
import localStorageService from '@/services/localStorage.service';

export type StatusFilter = 'all' | 'done' | 'pending';

export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;

export interface SheetFilter {
  keyword: string;
  status: StatusFilter;
  pageSize: number;
}

const DEFAULT_FILTER: SheetFilter = { keyword: '', status: 'all', pageSize: 15 };

export const SHEET_QUERY_KEY = ['manager-sheet'] as const;

export interface SheetContextValue {
  isLoading: boolean;
  isFetching: boolean;
  isMutating: boolean;
  error: Error | null;
  /** Rows after filtering — what the table renders. */
  response: SheetRowData[];
  totalRows: number;
  filter: SheetFilter;
  setFilter: (filter: SheetFilter) => void;
  resetFilter: () => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  paginatedRows: SheetRowData[];
  updateStatus: (row: SheetRowData) => Promise<void>;
  updateAllToNoDeliveryStatus: () => Promise<void>;
  refetch: () => void;
}

export const SheetContext = createContext<SheetContextValue>({} as SheetContextValue);

export default function SheetProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // pageSize now persists across visits (priority #6).
  const [filter, setFilterState] = useState<SheetFilter>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const saved = localStorageService.getItem<Partial<SheetFilter>>(
      LocalStorageKeysCache.SHEET_FILTER_PREFERENCES
    );
    if (saved?.pageSize && PAGE_SIZE_OPTIONS.includes(saved.pageSize as never)) {
      setFilterState((current) => ({ ...current, pageSize: saved.pageSize! }));
    }
  }, []);

  const setFilter = useCallback((next: SheetFilter) => {
    setFilterState(next);
    setPage(1); // any filter change invalidates the current page
    localStorageService.setItem(
      LocalStorageKeysCache.SHEET_FILTER_PREFERENCES,
      { pageSize: next.pageSize },
      null
    );
  }, []);

  const resetFilter = useCallback(() => {
    setFilterState((current) => ({ ...DEFAULT_FILTER, pageSize: current.pageSize }));
    setPage(1);
  }, []);

  const {
    data = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<SheetRowData[], Error>({
    queryKey: SHEET_QUERY_KEY,
    queryFn: getManagerTable,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const filteredValues = useMemo(() => {
    const keyword = normaliseText(filter.keyword);
    const keywordDigits = onlyDigits(filter.keyword);
    const keywordAlnum = onlyAlphanumeric(filter.keyword).toLowerCase();

    return data.filter((value) => {
      if (filter.status === 'done' && !value.hasDone) return false;
      if (filter.status === 'pending' && value.hasDone) return false;
      if (!keyword) return true;

      const matchesName = normaliseText(value.name).includes(keyword);
      const matchesCpf = keywordDigits.length > 0 && onlyDigits(value.cpf).includes(keywordDigits);
      const matchesCib =
        keywordAlnum.length > 0 && onlyAlphanumeric(value.cib).toLowerCase().includes(keywordAlnum);
      const matchesProperty = normaliseText(value.imovelRural).includes(keyword);
      const matchesObservations = normaliseText(value.observations).includes(keyword);

      return matchesName || matchesCpf || matchesCib || matchesProperty || matchesObservations;
    });
  }, [data, filter.keyword, filter.status]);

  const totalPages = Math.max(1, Math.ceil(filteredValues.length / filter.pageSize));

  // Guard against landing on a page that no longer exists.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * filter.pageSize;
    return filteredValues.slice(start, start + filter.pageSize);
  }, [filteredValues, page, filter.pageSize]);

  /** Optimistic single-row toggle with rollback. */
  const toggleMutation = useMutation({
    mutationFn: ({ row, hasDone }: { row: SheetRowData; hasDone: boolean }) =>
      setRowStatus(row, hasDone),
    onMutate: async ({ row, hasDone }) => {
      await queryClient.cancelQueries({ queryKey: SHEET_QUERY_KEY });
      const previous = queryClient.getQueryData<SheetRowData[]>(SHEET_QUERY_KEY);

      queryClient.setQueryData<SheetRowData[]>(SHEET_QUERY_KEY, (current = []) =>
        current.map((item) =>
          item.cellRange === row.cellRange
            ? { ...item, hasDone, status: hasDone ? 'Entregue' : 'Não entregue' }
            : item
        )
      );

      return { previous };
    },
    onError: (mutationError, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(SHEET_QUERY_KEY, context.previous);
      toast.error((mutationError as Error).message || 'Não foi possível atualizar o status.');
    },
    onSuccess: () => toast.success('Status atualizado com sucesso.'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: SHEET_QUERY_KEY }),
  });

  const bulkMutation = useMutation({
    mutationFn: () => setAllRowsStatus(false),
    onSuccess: ({ updated, skipped }) => {
      toast.success(
        updated === 0
          ? 'Nenhum registro precisava ser alterado.'
          : `${updated} registro(s) marcados como não entregues. ${skipped} já estavam corretos.`
      );
      void queryClient.invalidateQueries({ queryKey: SHEET_QUERY_KEY });
    },
    onError: (mutationError) =>
      toast.error((mutationError as Error).message || 'Não foi possível atualizar os status.'),
  });

  const updateStatus = useCallback(
    async (row: SheetRowData) => {
      await toggleMutation.mutateAsync({ row, hasDone: !row.hasDone });
    },
    [toggleMutation]
  );

  const updateAllToNoDeliveryStatus = useCallback(async () => {
    await bulkMutation.mutateAsync();
  }, [bulkMutation]);

  const value = useMemo<SheetContextValue>(
    () => ({
      isLoading,
      isFetching,
      isMutating: toggleMutation.isPending || bulkMutation.isPending,
      error: error ?? null,
      response: filteredValues,
      totalRows: data.length,
      filter,
      setFilter,
      resetFilter,
      page,
      setPage,
      totalPages,
      paginatedRows,
      updateStatus,
      updateAllToNoDeliveryStatus,
      refetch,
    }),
    [
      isLoading,
      isFetching,
      toggleMutation.isPending,
      bulkMutation.isPending,
      error,
      filteredValues,
      data.length,
      filter,
      setFilter,
      resetFilter,
      page,
      totalPages,
      paginatedRows,
      updateStatus,
      updateAllToNoDeliveryStatus,
      refetch,
    ]
  );

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}
