'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'react-toastify';

import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  usePersistedPageSize,
} from '@/hooks/usePersistedPageSize';
import { normaliseText, onlyAlphanumeric, onlyDigits } from '@/helpers/utils';
import type { SheetRowData } from '@/interfaces/tr-sheet';
import { getManagerTable, setAllRowsStatus, setRowStatus } from '@/services/sheet.service';

export type StatusFilter = 'all' | 'done' | 'pending';

export { PAGE_SIZE_OPTIONS };

export interface SheetFilter {
  keyword: string;
  status: StatusFilter;
  pageSize: number;
}

export const SHEET_QUERY_KEY = ['manager-sheet'] as const;

export interface SheetContextValue {
  isLoading: boolean;
  isFetching: boolean;
  isMutating: boolean;
  /** True while the keyword input is ahead of the rendered results. */
  isFiltering: boolean;
  error: Error | null;
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

  // Ephemeral filter state. pageSize lives in localStorage via its own hook,
  // which removes the mount-time useEffect that used to hydrate it.
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [pageSize, setPageSize] = usePersistedPageSize();
  const [requestedPage, setRequestedPage] = useState(1);

  /**
   * Replaces the previous debounce (useEffect + setTimeout + a `keywordDraft`
   * mirror). The input now updates `keyword` immediately so typing stays
   * responsive, while React de-prioritises re-filtering the table. Two effects
   * and a timer deleted.
   */
  const deferredKeyword = useDeferredValue(keyword);
  const isFiltering = keyword !== deferredKeyword;

  const filter = useMemo<SheetFilter>(
    () => ({ keyword, status, pageSize }),
    [keyword, status, pageSize]
  );

  const setFilter = useCallback(
    (next: SheetFilter) => {
      setKeyword(next.keyword);
      setStatus(next.status);
      if (next.pageSize !== pageSize) setPageSize(next.pageSize);
      setRequestedPage(1); // any filter change invalidates the current page
    },
    [pageSize, setPageSize]
  );

  const resetFilter = useCallback(() => {
    setKeyword('');
    setStatus('all');
    setRequestedPage(1);
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
    const needle = normaliseText(deferredKeyword);
    const needleDigits = onlyDigits(deferredKeyword);
    const needleAlnum = onlyAlphanumeric(deferredKeyword).toLowerCase();

    return data.filter((value) => {
      if (status === 'done' && !value.hasDone) return false;
      if (status === 'pending' && value.hasDone) return false;
      if (!needle) return true;

      const matchesName = normaliseText(value.name).includes(needle);
      const matchesCpf = needleDigits.length > 0 && onlyDigits(value.cpf).includes(needleDigits);
      const matchesCib =
        needleAlnum.length > 0 && onlyAlphanumeric(value.cib).toLowerCase().includes(needleAlnum);
      const matchesProperty = normaliseText(value.imovelRural).includes(needle);
      const matchesObservations = normaliseText(value.observations).includes(needle);

      return matchesName || matchesCpf || matchesCib || matchesProperty || matchesObservations;
    });
  }, [data, deferredKeyword, status]);

  const totalPages = Math.max(1, Math.ceil(filteredValues.length / pageSize));

  /**
   * Derived, not stored. The old version clamped inside a useEffect, which
   * meant one render with an out-of-range page followed by a corrective
   * re-render. Clamping here makes the invalid state unrepresentable.
   */
  const page = Math.min(requestedPage, totalPages);

  const setPage = useCallback((next: number) => {
    setRequestedPage(Math.max(1, next));
  }, []);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredValues.slice(start, start + pageSize);
  }, [filteredValues, page, pageSize]);

  /**
   * Destructuring is required by @tanstack/query/no-unstable-deps: the object
   * returned by useMutation is a new reference every render, so depending on it
   * defeats useCallback memoisation. `mutateAsync` and `isPending` are stable.
   */
  const { mutateAsync: toggleStatus, isPending: isTogglePending } = useMutation({
    mutationFn: ({ row, hasDone }: { row: SheetRowData; hasDone: boolean }) =>
      setRowStatus(row, hasDone),
    onMutate: async ({ row, hasDone }) => {
      await queryClient.cancelQueries({ queryKey: SHEET_QUERY_KEY });
      const previous = queryClient.getQueryData<SheetRowData[]>(SHEET_QUERY_KEY);

      queryClient.setQueryData<SheetRowData[]>(SHEET_QUERY_KEY, (current = []) =>
        current.map((item) =>
          item.cellRange === row.cellRange
            ? { ...item, hasDone, status: hasDone ? 'ENTREGUE' : 'NÃO ENTREGUE' }
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

  const { mutateAsync: markAllPending, isPending: isBulkPending } = useMutation({
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
      await toggleStatus({ row, hasDone: !row.hasDone });
    },
    [toggleStatus]
  );

  const updateAllToNoDeliveryStatus = useCallback(async () => {
    await markAllPending();
  }, [markAllPending]);

  const value = useMemo<SheetContextValue>(
    () => ({
      isLoading,
      isFetching,
      isMutating: isTogglePending || isBulkPending,
      isFiltering,
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
      isTogglePending,
      isBulkPending,
      isFiltering,
      error,
      filteredValues,
      data.length,
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
    ]
  );

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

export { DEFAULT_PAGE_SIZE };
