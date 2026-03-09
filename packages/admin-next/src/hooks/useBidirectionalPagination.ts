import { useState, useCallback, useMemo } from "react";
import { useConvexPaginatedQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";

type Direction = "forward" | "reverse";

export function useBidirectionalPagination({
  collectionSlug,
  initialFetchSize,
  pageSize,
  pageIndex,
  totalCount,
  isSearching,
}: {
  collectionSlug: string;
  initialFetchSize: number;
  pageSize: number;
  pageIndex: number;
  totalCount: number | undefined;
  isSearching: boolean;
}) {
  const [activeDirection, setActiveDirection] = useState<Direction>("forward");

  const totalPages =
    totalCount != null ? Math.max(1, Math.ceil(totalCount / pageSize)) : undefined;

  // Forward query (asc, default)
  const {
    results: forwardResults,
    status: forwardStatus,
    loadMore: forwardLoadMore,
    isLoading: forwardLoading,
  } = useConvexPaginatedQuery(
    anyApi.vex.collections.listDocuments,
    isSearching || activeDirection !== "forward"
      ? "skip"
      : { collectionSlug, order: "asc" as const },
    { initialNumItems: initialFetchSize },
  );

  // Reverse query (desc) — page 0 of desc = last page of asc
  const {
    results: reverseResults,
    status: reverseStatus,
    loadMore: reverseLoadMore,
    isLoading: reverseLoading,
  } = useConvexPaginatedQuery(
    anyApi.vex.collections.listDocuments,
    isSearching || activeDirection !== "reverse"
      ? "skip"
      : { collectionSlug, order: "desc" as const },
    { initialNumItems: initialFetchSize },
  );

  const isForward = activeDirection === "forward";
  const status = isForward ? forwardStatus : reverseStatus;
  const isLoading = isForward ? forwardLoading : reverseLoading;
  const canLoadMore = !isSearching && status === "CanLoadMore";
  const loadMore = isForward ? forwardLoadMore : reverseLoadMore;

  // In reverse mode, reverse each page-sized chunk so rows display in asc order.
  // The desc query returns [newest, ..., oldest]. Each page-chunk reversed becomes
  // [oldest, ..., newest] for correct display ordering.
  const documents = useMemo(() => {
    if (isForward) return forwardResults;
    if (!reverseResults.length) return reverseResults;

    const reversed: typeof reverseResults = [];
    for (let i = 0; i < reverseResults.length; i += pageSize) {
      const chunk = reverseResults.slice(i, i + pageSize);
      reversed.push(...chunk.reverse());
    }
    return reversed;
  }, [isForward, forwardResults, reverseResults, pageSize]);

  // Map display pageIndex to the index within the documents array.
  // Forward: tablePageIndex = pageIndex (direct mapping)
  // Reverse: desc page 0 = last user page, desc page 1 = second-to-last, etc.
  //   tablePageIndex = totalPages - 1 - pageIndex
  const tablePageIndex = useMemo(() => {
    if (isForward || totalPages == null) return pageIndex;
    return totalPages - 1 - pageIndex;
  }, [isForward, pageIndex, totalPages]);

  const handlePageChange = useCallback(
    (targetPage: number) => {
      if (totalPages == null) return targetPage;

      const forwardLoadedPages = Math.ceil((forwardResults?.length ?? 0) / pageSize);

      if (activeDirection === "forward") {
        // Switch to reverse if jumping to last page and forward hasn't loaded enough
        if (targetPage >= totalPages - 1 && forwardLoadedPages < totalPages - 1) {
          setActiveDirection("reverse");
          return targetPage;
        }
      } else {
        // Switch back to forward if going to page 0 or near the start
        if (targetPage <= 0) {
          setActiveDirection("forward");
          return targetPage;
        }
      }

      return targetPage;
    },
    [totalPages, activeDirection, forwardResults?.length, pageSize],
  );

  return {
    documents,
    tablePageIndex,
    isLoading,
    canLoadMore,
    loadMore,
    totalLoaded: documents.length,
    handlePageChange,
    activeDirection,
  };
}
