"use client";

import type { ReactNode } from "react";
import { Button } from "../../button";
import { Skeleton } from "../../skeleton";

export interface DataTableFooterProps {
  dataLength: number;
  isInitialLoading: boolean;
  isDone: boolean;
  pageSize?: number;
  totalCount?: number | null;
  totalDocsCapped?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

/**
 * `DataTable`'s own pinned footer — the "Showing N of M" status line plus Load
 * More/"That's everything", or their loading-skeleton equivalents. `null` when
 * there's nothing to show yet (`dataLength === 0` and not an initial-loading
 * state with a non-zero `pageSize`). Pulled out of `DataTable/index.tsx` (Phase
 * 3 of the structure refactor) as a pure split — same JSX, same condition.
 */
export function DataTableFooter({
  dataLength,
  isInitialLoading,
  isDone,
  pageSize,
  totalCount,
  totalDocsCapped,
  onLoadMore,
  isLoadingMore = false,
}: DataTableFooterProps): ReactNode {
  if (!(dataLength > 0 || (isInitialLoading && pageSize !== 0))) return null;
  return (
    // `min-h-[49px]` (developer-reported, Decision 49 follow-up #2): without
    // it, the footer's own height varies by variant — 49px when a Load More
    // `Button` (`size="default"`, 32px) is present, 37px when it's text-only
    // ("That's everything" / the done-skeleton pair) — and since this div and
    // `ScrollArea` above are `flex-col` siblings inside a height-BOUNDED
    // parent (confirmed via the page's own `flex-1 min-h-0` ancestor chain,
    // not content-driven), a shorter footer doesn't just move ITSELF — it
    // hands `ScrollArea` MORE of the shared fixed height, moving the visible
    // table frame's own bottom edge too. 49px (not a round Tailwind step) is
    // the Button variant's own exact measured total (32 content + 16 `py-2`
    // + 1 `border-t`) — `items-center` centers the shorter text-only variants
    // within the same reserved height, so all 4 states (skeleton/settled ×
    // done/not-done) render at one constant height and neither the footer
    // nor `ScrollArea`'s own frame ever moves between them.
    <div className="flex min-h-[49px] shrink-0 flex-wrap items-center justify-between gap-2 border-t px-2 py-2">
      {isInitialLoading ? (
        isDone ? (
          <>
            {/* `h-5` (20px), not `h-4` (16px) — matches `text-sm`'s own line-height
                exactly (0.875rem font / 1.25rem line-height = 20px), not just its font
                size. The footer `<div>` has no fixed height of its own (content-driven,
                unlike a row's `rowClass`), so a 16px bar standing in for a 20px-tall `<p
                className="text-sm">` shrinks the WHOLE footer by 4px, confirmed live via
                a held-open rect comparison (developer-reported, Decision 49 follow-up). */}
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-5 w-32 rounded" />
          </>
        ) : (
          <>
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </>
        )
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {dataLength.toLocaleString()}
            {totalCount !== null && totalCount !== undefined ? (
              <>
                {" "}
                of{" "}
                {/* `totalDocsCapped` means `totalCount` is a floor, not exact — once
                    a later page actually loads more rows than that floor (page size
                    bigger than the capped count, e.g. a per-view `countLimit` lower
                    than the rows actually loaded), the floor itself must rise to at least
                    `dataLength` so the footer never reads "Showing 100 of 50+". */}
                {(totalDocsCapped ? Math.max(totalCount, dataLength) : totalCount).toLocaleString()}
                {totalDocsCapped ? "+" : ""}
              </>
            ) : null}
          </p>
          {!isDone ? (
            <Button onClick={onLoadMore} variant="outline" isPending={isLoadingMore}>
              {isLoadingMore ? "Loading…" : `Load ${pageSize ?? dataLength} more`}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">That&apos;s everything</p>
          )}
        </>
      )}
    </div>
  );
}
