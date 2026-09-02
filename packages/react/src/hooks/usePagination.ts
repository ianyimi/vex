"use client";

import { useState, useCallback, useMemo } from "react";
import type { PaginationState, PaginationOptions } from "@vexcms/core";

/**
 * Props for usePagination hook.
 */
export interface UsePaginationProps {
  /** Initial page size. Default: 50 */
  initialPageSize?: number;
  /** Available page size options. Default: [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** Total count of items (optional — enables page number display). */
  totalCount?: number;
}

/**
 * Return type of usePagination hook.
 */
export interface UsePaginationReturn {
  /** Current pagination state. */
  state: PaginationState;
  /** Pagination options to pass to Convex query. */
  paginationOpts: PaginationOptions;
  /** Go to next page. */
  nextPage: () => void;
  /** Go to previous page. */
  previousPage: () => void;
  /** Jump to specific page (1-based). Resets cursor stack. */
  goToPage: (page: number) => void;
  /** Change page size. Resets to page 1. */
  setPageSize: (size: number) => void;
  /** Update pagination state after receiving new page data. */
  updateFromResult: (result: { continueCursor: string | null; isDone: boolean }) => void;
}

/**
 * Manages pagination state for data tables.
 *
 * Tracks cursor stack for forward/backward navigation using Convex's
 * cursor-based pagination API.
 *
 * @param props - Pagination configuration
 * @returns Pagination state and control functions
 *
 * @example
 * ```tsx
 * const pagination = usePagination({ initialPageSize: 25 });
 *
 * const { data } = useQuery(
 *   find({ collection: "posts", paginationOpts: pagination.paginationOpts })
 * );
 *
 * useEffect(() => {
 *   if (data) {
 *     pagination.updateFromResult(data);
 *   }
 * }, [data]);
 *
 * <Button onClick={pagination.nextPage} disabled={!pagination.state.hasNextPage}>
 *   Next
 * </Button>
 * ```
 */
export function usePagination(props: UsePaginationProps = {}): UsePaginationReturn {
  const { initialPageSize = 50, pageSizeOptions = [10, 25, 50, 100], totalCount } = props;

  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cursor = cursorStack[cursorStack.length - 1] ?? null;
  const hasPreviousPage = currentPage > 1;

  const state: PaginationState = useMemo(
    () => ({
      currentPage,
      pageSize,
      cursorStack,
      cursor,
      hasNextPage,
      hasPreviousPage,
      totalCount,
    }),
    [currentPage, pageSize, cursorStack, cursor, hasNextPage, hasPreviousPage, totalCount],
  );

  const paginationOpts: PaginationOptions = useMemo(
    () => ({
      numItems: pageSize,
      cursor,
    }),
    [pageSize, cursor],
  );

  const updateFromResult = useCallback(
    (result: { continueCursor: string | null; isDone: boolean }) => {
      setHasNextPage(!result.isDone);
    },
    [],
  );

  const nextPage = useCallback(() => {
    if (!hasNextPage) return;

    // Push current cursor to stack before advancing
    setCursorStack((prev) => [...prev, cursor]);
    setCurrentPage((p) => p + 1);
  }, [hasNextPage, cursor]);

  const previousPage = useCallback(() => {
    if (!hasPreviousPage) return;

    // Pop cursor stack to go back
    setCursorStack((prev) => prev.slice(0, -1));
    setCurrentPage((p) => p - 1);
  }, [hasPreviousPage]);

  const goToPage = useCallback((page: number) => {
    if (page < 1) return;
    // Reset cursor stack and start from page 1
    // Note: Direct page jump requires fetching from start
    // For now, this is a simple implementation that resets
    setCursorStack([null]);
    setCurrentPage(1);
    setHasNextPage(false);
  }, []);

  const setPageSize = useCallback(
    (size: number) => {
      if (!pageSizeOptions.includes(size)) return;
      setPageSizeState(size);
      // Reset to page 1 when changing page size
      setCursorStack([null]);
      setCurrentPage(1);
      setHasNextPage(false);
    },
    [pageSizeOptions],
  );

  return {
    state,
    paginationOpts,
    nextPage,
    previousPage,
    goToPage,
    setPageSize,
    updateFromResult,
  };
}
