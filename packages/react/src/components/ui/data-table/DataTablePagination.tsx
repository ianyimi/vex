"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "../pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select";
import type { UsePaginationReturn } from "../../../hooks";

/**
 * Props for DataTablePagination component.
 */
export interface DataTablePaginationProps {
  /** Pagination state and controls from usePagination hook. */
  pagination: UsePaginationReturn;
  /** Total count of items (optional — enables page number display). */
  totalCount?: number;
  /** Page size options. Default: [10, 25, 50, 100] */
  pageSizeOptions?: number[];
  /** Max page numbers to show in pagination. Default: 7 */
  maxPageNumbers?: number;
}

/**
 * Pagination controls for data tables.
 *
 * Built on shadcn Pagination components with added page size selector.
 * Displays prev/next buttons, page numbers with ellipsis, and page size dropdown.
 * Works with usePagination hook for cursor-based pagination.
 *
 * @param props - Component props
 * @returns Pagination control UI
 *
 * @example
 * ```tsx
 * const pagination = usePagination({ initialPageSize: 25 });
 *
 * <DataTablePagination
 *   pagination={pagination}
 *   totalCount={500}
 *   pageSizeOptions={[10, 25, 50, 100]}
 * />
 * ```
 */
export function DataTablePagination({
  pagination,
  totalCount,
  pageSizeOptions = [10, 25, 50, 100],
  maxPageNumbers = 7,
}: DataTablePaginationProps) {
  const { state } = pagination;

  const totalPages = totalCount ? Math.ceil(totalCount / state.pageSize) : undefined;

  // Generate page numbers to show (with ellipsis logic)
  const pageNumbers: (number | "ellipsis")[] = [];
  if (totalPages) {
    if (totalPages <= maxPageNumbers) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first, last, current, and surrounding pages with ellipsis
      const current = state.currentPage;
      const delta = Math.floor(maxPageNumbers / 2);
      const rangeStart = Math.max(2, current - delta);
      const rangeEnd = Math.min(totalPages - 1, current + delta);

      pageNumbers.push(1);

      if (rangeStart > 2) {
        pageNumbers.push("ellipsis");
      }

      for (let i = rangeStart; i <= rangeEnd; i++) {
        pageNumbers.push(i);
      }

      if (rangeEnd < totalPages - 1) {
        pageNumbers.push("ellipsis");
      }

      pageNumbers.push(totalPages);
    }
  }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {/* Page size selector */}
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Rows per page</p>
        <Select
          value={state.pageSize.toString()}
          onValueChange={(value) => pagination.setPageSize(Number(value))}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={state.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pagination controls */}
      <Pagination>
        <PaginationContent>
          {/* Previous button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => pagination.previousPage()}
              aria-disabled={!state.hasPreviousPage}
              className={
                !state.hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>

          {/* Page numbers */}
          {pageNumbers.map((pageNum, idx) =>
            pageNum === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => pagination.goToPage(pageNum)}
                  isActive={state.currentPage === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ),
          )}

          {/* Next button */}
          <PaginationItem>
            <PaginationNext
              onClick={() => pagination.nextPage()}
              aria-disabled={!state.hasNextPage}
              className={!state.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
