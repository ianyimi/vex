"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import type { FindClientPaginatedArgs } from "@vexcms/core/client";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, PaginationResult, VexDocument } from "@vexcms/core";

/**
 * Props for the `usePaginatedQuery` hook.
 *
 * @typeParam TCollectionSlug - Collection slug type
 *
 * **Defaults:**
 * - `initialNumItems`: 100
 * - `depth`: 1
 * - `includeTotalCount`: true
 */
export interface UsePaginatedQueryProps<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /**
   * Initial data from SSR (optional).
   * Can be either an array of documents or a PaginationResult.
   */
  initialData?: PaginationResult<TDocument>;

  /**
   * Query arguments for the 'find()' api function.
   *
   * @see FindClientArgs
   *
   * Count is fetched only on first page load. Returns `null` if
   * collection has >32k documents.
   */
  query: FindClientPaginatedArgs<TCollectionSlug>;

  /**
   * Items to show per 'Load More'
   */
  clientPageSize?: number;
}

/**
 * Return type of usePaginatedCollection hook.
 *
 * Mimics Convex's usePaginatedQuery API for consistency.
 */
export interface UsePaginatedQueryReturn<TDocument extends VexDocument = VexDocument> {
  /**
   * All loaded documents (accumulated across Load More calls).
   * Starts with first page, grows as user clicks Load More.
   */
  results: TDocument[];

  /**
   * Total document count across all pages.
   *
   * - `number` when count succeeded
   * - `null` when collection has >32k documents (Convex limit)
   * - `undefined` when count hasn't loaded yet or `includeTotalCount=false`
   */
  totalDocs: number | null | undefined;

  /**
   * Whether all documents have been loaded.
   * When `true`, Load More button should be hidden.
   */
  isDone: boolean;

  /**
   * Load more documents. Fetches the next page using `initialNumItems`.
   */
  loadMore: () => void;

  /**
   * Whether a query is currently in flight.
   * Use for loading states on Load More button.
   */
  isPending: boolean;
}

/**
 * Hook for cursor-based pagination of VexCMS collections with Load More pattern.
 *
 * Manages:
 * - Convex cursor-based pagination using `find()` API
 * - Accumulates results across multiple Load More calls
 * - Extracts `totalCount` from first page response
 * - Mimics Convex `usePaginatedQuery` API for consistency
 *
 * @typeParam TCollectionSlug - Collection slug type
 * @param props - Hook configuration
 * @returns Pagination state and controls
 *
 * @example
 * ```tsx
 * const {
 *   results,
 *   totalCount,
 *   isDone,
 *   loadMore,
 *   isLoading,
 * } = usePaginatedCollection({
 *   collection: "posts",
 *   initialNumItems: 100,
 *   includeTotalCount: true,
 * });
 *
 * // Show total count in header
 * <p>
 *   {totalCount !== null && totalCount !== undefined ? (
 *     <>{totalCount.toLocaleString()} documents</>
 *   ) : (
 *     <>10,000+ documents</>
 *   )}
 * </p>
 *
 * // Show Load More button
 * {!isDone && (
 *   <Button onClick={() => loadMore(100)} disabled={isLoading}>
 *     {isLoading ? "Loading..." : "Load More"}
 *   </Button>
 * )}
 * ```
 *
 * @see `find` - Server function for querying documents
 * @see {@link PaginationResult} - Return type with totalCount
 */
export function usePaginatedQuery<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>({
  initialData,
  query,
  clientPageSize,
}: UsePaginatedQueryProps<TDocument, TCollectionSlug>): UsePaginatedQueryReturn<TDocument> {
  // Cursor state for pagination
  const [cursor, setCursor] = useState<string | null>(null);

  // Accumulated results from all pages
  const [allResults, setAllResults] = useState<TDocument[]>(initialData?.page ?? []);

  // Done state
  const [isDone, setIsDone] = useState(false);

  const [clientPageIndex, setClientPageIndex] = useState(0);

  const startIndex = 0;
  const endIndex = (clientPageIndex + 1) * (clientPageSize ?? query.paginationOpts.numItems);
  const visibleResults = allResults.slice(startIndex, endIndex);
  const needsServerFetch = endIndex >= allResults.length && !isDone;

  function loadMore() {
    if (needsServerFetch && result.continueCursor) {
      setCursor(result.continueCursor);
    } else {
      setClientPageIndex((prev) => prev + 1);
    }
  }

  // Fetch current page
  // This hook is generic over `TCollectionSlug` — the collection is only known
  // at runtime, so it queries the generic paginated endpoint rather than the
  // per-slug `find()` wrapper, which narrows only for a literal slug. The
  // caller asserts the document shape via `TDocument`; see the memo below.
  const { data, isPending } = useQuery({
    ...convexQuery(vexConvexApi.findPaginated, {
      ...query,
      paginationOpts: {
        ...query.paginationOpts,
        cursor,
      },
    }),
    // Only use initialData on first load
    ...(cursor === null && initialData ? { initialData } : {}),
  });

  // Extract pagination result
  const result = useMemo<PaginationResult<TDocument>>(() => {
    // Empty state for "no data yet" / array response. `continueCursor: ""` is a
    // falsy placeholder, never a real cursor: it is only read for truthiness in
    // `loadMore`, so `setCursor` never receives it and Convex only ever sees
    // `null` (first page) or a genuine cursor. `isDone: true` is the actual
    // "no further pages" signal.
    const empty = {
      page: [] as TDocument[],
      continueCursor: "",
      isDone: true,
    };
    if (!data) return empty;
    if (Array.isArray(data)) return { ...empty, page: data as TDocument[] };
    return data as PaginationResult<TDocument>;
  }, [data]);

  const { totalDocs } = useTotalDocs({
    initialData: initialData,
    enabled: query.paginationOpts?.totalDocs,
    paginatedQueryRes: result,
  });

  // Accumulate results
  useEffect(() => {
    if (result.page) {
      if (cursor === null) {
        // First page - replace all results
        setAllResults(result.page);
      } else {
        // Subsequent pages - append
        setAllResults((prev) => [...prev, ...result.page]);
      }

      setIsDone(result.isDone);
    }
  }, [result.page, result.isDone, cursor]);

  const clientIsDone = isDone && endIndex >= allResults.length;
  return {
    results: visibleResults,
    totalDocs,
    isDone: clientIsDone,
    loadMore,
    isPending,
  };
}

// function usePaginatedQuery2<
//   TDocument extends VexDocument = VexDocument,
//   TCollectionSlug extends CollectionSlug = CollectionSlug,
// >(props: {
//   initialData: PaginationResult<TDocument>;
//   /**
//    * Query arguments for the 'find()' api function.
//    *
//    * @see FindClientArgs
//    *
//    * Count is fetched only on first page load. Returns `null` if
//    * collection has >32k documents.
//    */
//   query: FindClientArgs<TCollectionSlug>;
//   /**
//    * Items to show per 'Load More'
//    */
//   clientPageSize?: number;
// }): UsePaginatedQueryReturn<TDocument> {
//   // Cursor state for pagination
//   const [cursor, setCursor] = useState<string | null>(null);
//
//   // Accumulated documents from all pages
//   const [documents, setDocuments] = useState<TDocument[]>(props.initialData?.page ?? []);
//
//   // Done state
//   const [isDone, setIsDone] = useState(false);
//   const [clientPageIndex, setClientPageIndex] = useState(0);
//
//   const startIndex = 0;
//   const endIndex = (clientPageIndex + 1) * (props.clientPageSize ?? 0);
//   const results = documents.slice(startIndex, props.clientPageSize ? endIndex : undefined);
//   const needsServerFetch = props.clientPageSize ? true : endIndex >= documents.length && !isDone;
//
//   // Fetch current page
//   const { data, isPending } = useQuery({
//     ...find({
//       ...props.query,
//       paginationOpts: {
//         numItems: 100,
//         ...props.query.paginationOpts,
//         cursor,
//       },
//     }),
//     // Only use initialData on first load
//     ...(cursor === null && props.initialData ? { initialData: props.initialData } : {}),
//   });
//
//   function loadMore() {
//     if (needsServerFetch && result.continueCursor) {
//       setCursor(result.continueCursor);
//     } else {
//       setClientPageIndex((prev) => prev + 1);
//     }
//   }
//
//   // Extract pagination result
//   const result = useMemo<PaginationResult<TDocument>>(() => {
//     if (!data) return { page: [], continueCursor: null, isDone: true };
//     if (Array.isArray(data)) return { page: data, continueCursor: null, isDone: true };
//     return data;
//   }, [data]);
//
//   // Accumulate results
//   useEffect(() => {
//     if (result.page) {
//       if (cursor === null) {
//         // First page - replace all results
//         setDocuments(result.page);
//       } else {
//         // Subsequent pages - append
//         setDocuments((prev) => [...prev, ...result.page]);
//       }
//
//       setIsDone(result.isDone);
//     }
//   }, [result.page, result.isDone, cursor]);
//
//   return {
//     isPending,
//     isDone,
//     totalDocs,
//     results,
//     loadMore,
//   };
// }

function useTotalDocs<TDocument extends VexDocument = VexDocument>(props: {
  initialData?: PaginationResult<TDocument>;
  enabled?: boolean;
  paginatedQueryRes: PaginationResult<TDocument>;
}) {
  // Total count (extracted from first page)
  const [totalDocsCount, setTotalDocs] = useState<number | null | undefined>(
    props.initialData?.totalDocs,
  );
  // Extract totalDocs from first paginated query response
  // Only runs once when first page loads with totalDocs field
  useEffect(() => {
    if (
      props.enabled &&
      props.paginatedQueryRes &&
      Object.hasOwn(props.paginatedQueryRes, "totalDocs") &&
      totalDocsCount === undefined
    ) {
      setTotalDocs(props.paginatedQueryRes.totalDocs);
    } else if (!props.enabled) {
      setTotalDocs(undefined);
    }
  }, [props.paginatedQueryRes, props.enabled]);

  return {
    totalDocs: totalDocsCount,
  };
}
