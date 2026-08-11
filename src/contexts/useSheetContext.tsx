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

import { normaliseText, onlyAlphanumeric, onlyDigits } from '@/helpers/utils';
import {
  DEFAULT_SORT,
  nextSortState,
  sortRows,
  type SortKey,
  type SortState,
} from '@/helpers/sheet-sort';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  usePersistedPageSize,
} from '@/hooks/usePersistedPageSize';
import type { SheetRowData } from '@/interfaces/tr-sheet';
import {
  getManagerTable,
  setAllRowsStatus,
  setRowStatus,
  setSelectedRowsStatus,
} from '@/services/sheet.service';

/** 'invalid-cpf' surfaces rows whose check digits fail. */
export type StatusFilter = 'all' | 'done' | 'pending' | 'invalid-cpf';

export { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE };

export interface SheetFilter {
  keyword: string;
  status: StatusFilter;
  pageSize: number;
}

export interface SheetStats {
  total: number;
  done: number;
  pending: number;
  invalidCpf: number;
  /** 0–100, rounded. */
  completion: number;
}

export const SHEET_QUERY_KEY = ['manager-sheet'] as const;

export interface SheetContextValue {
  isLoading: boolean;
  isFetching: boolean;
  isMutating: boolean;
  isFiltering: boolean;
  error: Error | null;
  /** Epoch ms of the last successful fetch. */
  dataUpdatedAt: number;

  response: SheetRowData[];
  totalRows: number;
  stats: SheetStats;

  filter: SheetFilter;
  setFilter: (filter: SheetFilter) => void;
  resetFilter: () => void;
  hasActiveFilter: boolean;

  sort: SortState;
  toggleSort: (key: SortKey) => void;

  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  paginatedRows: SheetRowData[];

  selectedRanges: ReadonlySet<string>;
  toggleRowSelection: (cellRange: string) => void;
  toggleSelectAllOnPage: () => void;
  clearSelection: () => void;
  /** Every row on the current page is selected. */
  isPageFullySelected: boolean;

  updateStatus: (row: SheetRowData) => Promise<void>;
  updateAllToNoDeliveryStatus: () => Promise<void>;
  updateSelectedStatus: (hasDone: boolean) => Promise<void>;
  refetch: () => void;
}

export const SheetContext = createContext<SheetContextValue>({} as SheetContextValue);

export default function SheetProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [pageSize, setPageSize] = usePersistedPageSize();
  const [requestedPage, setRequestedPage] = useState(1);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [selectedRanges, setSelectedRanges] = useState<ReadonlySet<string>>(() => new Set());

  /**
   * Keystrokes stay responsive while React de-prioritises re-filtering. This
   * replaced a setTimeout debounce, so there is no fixed delay to wait out.
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
      setRequestedPage(1);
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
    dataUpdatedAt,
    refetch,
  } = useQuery<SheetRowData[], Error>({
    queryKey: SHEET_QUERY_KEY,
    queryFn: getManagerTable,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  /** Computed over the FULL dataset — stats must not shift when filtering. */
  const stats = useMemo<SheetStats>(() => {
    let done = 0;
    let invalidCpf = 0;

    for (const row of data) {
      if (row.hasDone) done += 1;
      if (!row.isCpfValid) invalidCpf += 1;
    }

    return {
      total: data.length,
      done,
      pending: data.length - done,
      invalidCpf,
      completion: data.length === 0 ? 0 : Math.round((done / data.length) * 100),
    };
  }, [data]);

  const filteredValues = useMemo(() => {
    const needle = normaliseText(deferredKeyword);
    const needleDigits = onlyDigits(deferredKeyword);
    const needleAlnum = onlyAlphanumeric(deferredKeyword).toLowerCase();

    const matching = data.filter((value) => {
      if (status === 'done' && !value.hasDone) return false;
      if (status === 'pending' && value.hasDone) return false;
      if (status === 'invalid-cpf' && value.isCpfValid) return false;
      if (!needle) return true;

      const matchesName = normaliseText(value.name).includes(needle);
      const matchesCpf = needleDigits.length > 0 && onlyDigits(value.cpf).includes(needleDigits);
      const matchesCib =
        needleAlnum.length > 0 && onlyAlphanumeric(value.cib).toLowerCase().includes(needleAlnum);
      const matchesProperty = normaliseText(value.imovelRural).includes(needle);
      const matchesObservations = normaliseText(value.observations).includes(needle);

      return matchesName || matchesCpf || matchesCib || matchesProperty || matchesObservations;
    });

    return sortRows(matching, sort);
  }, [data, deferredKeyword, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredValues.length / pageSize));

  /** Derived, not stored — an out-of-range page is unrepresentable. */
  const page = Math.min(requestedPage, totalPages);

  const setPage = useCallback((next: number) => setRequestedPage(Math.max(1, next)), []);

  const toggleSort = useCallback((key: SortKey) => {
    setSort((current) => nextSortState(current, key));
    setRequestedPage(1);
  }, []);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredValues.slice(start, start + pageSize);
  }, [filteredValues, page, pageSize]);

  // ── Selection ───────────────────────────────────────────────────────────
  const toggleRowSelection = useCallback((cellRange: string) => {
    setSelectedRanges((current) => {
      const next = new Set(current);
      if (!next.delete(cellRange)) next.add(cellRange);
      return next;
    });
  }, []);

  const isPageFullySelected =
    paginatedRows.length > 0 && paginatedRows.every((row) => selectedRanges.has(row.cellRange));

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedRanges((current) => {
      const next = new Set(current);
      const allSelected = paginatedRows.every((row) => next.has(row.cellRange));
      for (const row of paginatedRows) {
        if (allSelected) next.delete(row.cellRange);
        else next.add(row.cellRange);
      }
      return next;
    });
  }, [paginatedRows]);

  const clearSelection = useCallback(() => setSelectedRanges(new Set()), []);

  // ── Mutations ───────────────────────────────────────────────────────────
  // Destructured because the useMutation object is a new reference each render
  // (@tanstack/query/no-unstable-deps); mutateAsync and isPending are stable.
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: SHEET_QUERY_KEY }),
  });

  const { mutateAsync: bulkUpdate, isPending: isBulkPending } = useMutation({
    mutationFn: ({ hasDone, ranges }: { hasDone: boolean; ranges: string[] | null }) =>
      ranges ? setSelectedRowsStatus(ranges, hasDone) : setAllRowsStatus(hasDone),
    onSuccess: ({ updated, skipped }) => {
      toast.success(
        updated === 0
          ? 'Nenhum registro precisava ser alterado.'
          : `${updated} registro(s) atualizados. ${skipped} já estavam corretos.`
      );
      setSelectedRanges(new Set());
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
    await bulkUpdate({ hasDone: false, ranges: null });
  }, [bulkUpdate]);

  const updateSelectedStatus = useCallback(
    async (hasDone: boolean) => {
      if (selectedRanges.size === 0) return;
      await bulkUpdate({ hasDone, ranges: [...selectedRanges] });
    },
    [bulkUpdate, selectedRanges]
  );

  const hasActiveFilter = keyword !== '' || status !== 'all';

  const value = useMemo<SheetContextValue>(
    () => ({
      isLoading,
      isFetching,
      isMutating: isTogglePending || isBulkPending,
      isFiltering,
      error: error ?? null,
      dataUpdatedAt,
      response: filteredValues,
      totalRows: data.length,
      stats,
      filter,
      setFilter,
      resetFilter,
      hasActiveFilter,
      sort,
      toggleSort,
      page,
      setPage,
      totalPages,
      paginatedRows,
      selectedRanges,
      toggleRowSelection,
      toggleSelectAllOnPage,
      clearSelection,
      isPageFullySelected,
      updateStatus,
      updateAllToNoDeliveryStatus,
      updateSelectedStatus,
      refetch,
    }),
    [
      isLoading,
      isFetching,
      isTogglePending,
      isBulkPending,
      isFiltering,
      error,
      dataUpdatedAt,
      filteredValues,
      data.length,
      stats,
      filter,
      setFilter,
      resetFilter,
      hasActiveFilter,
      sort,
      toggleSort,
      page,
      setPage,
      totalPages,
      paginatedRows,
      selectedRanges,
      toggleRowSelection,
      toggleSelectAllOnPage,
      clearSelection,
      isPageFullySelected,
      updateStatus,
      updateAllToNoDeliveryStatus,
      updateSelectedStatus,
      refetch,
    ]
  );

  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}
