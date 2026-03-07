"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageIndex: number) => void;
  canLoadMore?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

/**
 * Always returns exactly 7 slots so the layout never shifts.
 * Slots are: [first] [slot2] [slot3] [slot4] [slot5] [slot6] [last]
 * Each slot is either a page number or an ellipsis placeholder (null).
 */
function getFixedPageSlots(
  currentPage: number,
  totalPages: number,
): (number | null)[] {
  if (totalPages <= 7) {
    const pages: (number | null)[] = Array.from(
      { length: totalPages },
      (_, i) => i + 1,
    );
    // Center pages within 7 slots by padding nulls on both sides
    const padding = 7 - pages.length;
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    for (let i = 0; i < leftPad; i++) pages.unshift(null);
    for (let i = 0; i < rightPad; i++) pages.push(null);
    return pages;
  }

  // Always 7 slots: [1] [?] [?] [?] [?] [?] [totalPages]
  const slots: (number | null)[] = [1, null, null, null, null, null, totalPages];

  if (currentPage <= 4) {
    // Near start: [1] [2] [3] [4] [5] [...] [last]
    slots[1] = 2;
    slots[2] = 3;
    slots[3] = 4;
    slots[4] = 5;
    // slots[5] stays null (ellipsis)
  } else if (currentPage >= totalPages - 3) {
    // Near end: [1] [...] [n-4] [n-3] [n-2] [n-1] [last]
    // slots[1] stays null (ellipsis)
    slots[2] = totalPages - 4;
    slots[3] = totalPages - 3;
    slots[4] = totalPages - 2;
    slots[5] = totalPages - 1;
  } else {
    // Middle: [1] [...] [cur-1] [cur] [cur+1] [...] [last]
    // slots[1] stays null (ellipsis)
    slots[2] = currentPage - 1;
    slots[3] = currentPage;
    slots[4] = currentPage + 1;
    // slots[5] stays null (ellipsis)
  }

  return slots;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  canLoadMore,
}: PaginationProps) {
  const slots = getFixedPageSlots(currentPage, totalPages);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(currentPage - 2)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>

      {slots.map((page, i) =>
        page === null ? (
          <span
            key={`slot-${i}`}
            className="flex size-8 items-center justify-center text-sm text-muted-foreground select-none"
          >
            {totalPages > 7 ? "\u2026" : ""}
          </span>
        ) : (
          <Button
            key={`page-${page}`}
            variant={page === currentPage ? "default" : "outline"}
            size="icon-sm"
            className="transition-none"
            onClick={() => onPageChange(page - 1)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onPageChange(currentPage)}
        disabled={currentPage >= totalPages && !canLoadMore}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

function PageSizeSelector({ pageSize, onPageSizeChange }: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Rows</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}

export {
  Pagination,
  PageSizeSelector,
  PAGE_SIZE_OPTIONS,
  type PaginationProps,
  type PageSizeSelectorProps,
  type PageSizeOption,
};
