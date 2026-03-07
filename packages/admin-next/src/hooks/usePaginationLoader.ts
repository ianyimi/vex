import { useEffect } from "react";

/**
 * Watches TanStack Table pagination state and triggers loadMore
 * when the user approaches the end of loaded data.
 *
 * @param props.pageIndex - Current page index from TanStack Table
 * @param props.pageSize - Page size
 * @param props.totalLoaded - Total number of currently loaded results
 * @param props.loadMore - Function to load more results (from useConvexPaginatedQuery)
 * @param props.canLoadMore - Whether more results are available (status !== "Exhausted")
 * @param props.batchSize - How many more to load (default: same as initial fetch)
 */
export function usePaginationLoader(props: {
  pageIndex: number;
  pageSize: number;
  totalLoaded: number;
  loadMore: (numItems: number) => void;
  canLoadMore: boolean;
  batchSize: number;
}): void {
  useEffect(() => {
    const lastVisibleRow = (props.pageIndex + 1) * props.pageSize;
    if (lastVisibleRow >= props.totalLoaded - props.pageSize && props.canLoadMore) {
      props.loadMore(props.batchSize);
    }
  }, [props.pageIndex, props.totalLoaded, props.canLoadMore]);
}
