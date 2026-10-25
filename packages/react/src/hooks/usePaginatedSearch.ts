"use client";

import { useEffect, useMemo, useState } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "@ts-hooks-kit/core";
import type {
  CollectionConfig,
  MediaCollectionConfig,
  PaginationResult,
  VexDocument,
  VexMediaDocument,
} from "@vexcms/core";
import { vexConvexApi, resolveTitleSearchIndex } from "@vexcms/core";
import { matchesAcceptPattern } from "../components/fields/upload/utils";

/** Props for {@link usePaginatedSearch}. */
export interface UsePaginatedSearchProps {
  /** The target collection (regular or media) to query. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** Raw search text; debounced 200ms before it reaches the query. `""` lists recent documents. */
  query: string;
  /** Documents per server page / per `loadMore()` call. @default 24 */
  pageSize?: number;
  /** Whether the underlying query should run at all. @default true */
  enabled?: boolean;
  /** Include draft versions of versioned documents. */
  drafts?: boolean;
  /**
   * Media-only accept patterns (`image/*`, `.pdf`, `application/pdf`) every
   * returned document must match. `find`/`search` have no server-side MIME
   * filter, so each server page is filtered client-side and the hook keeps
   * requesting further server pages on its own until a filtered page of
   * `pageSize` documents is assembled or the server itself runs out of
   * pages.
   */
  mimeTypes?: string[];
}

/** Return value of {@link usePaginatedSearch}. */
export interface UsePaginatedSearchReturn<
  TDocument extends VexDocument = VexDocument,
> {
  /** Documents accumulated across the current query and every `loadMore()`/auto-fill page. */
  documents: TDocument[];
  /** Whether the first page of the current query is still in flight. */
  isPending: boolean;
  /** Whether the current query rejected. */
  isError: boolean;
  /** The rejection reason, when `isError` is `true`. */
  error: unknown;
  /** Whether another server page remains. */
  hasMore: boolean;
  /** Whether a page beyond the first is in flight, from `loadMore()` or the `mimeTypes` auto-fill. */
  isLoadingMore: boolean;
  /** Fetches the next server page and appends its (filtered) documents. */
  loadMore: () => void;
}

/**
 * Debounced, cursor-paginated search over a VexCMS collection or media
 * collection — the hook both the relationship picker (step 14) and the
 * media library grid use, so pagination, debouncing, and MIME-type
 * filtering are implemented once.
 *
 * Uses `vexConvexApi.search` against the index `resolveTitleSearchIndex`
 * resolves for `collection` (the `useAsTitle` field's own `searchIndex` when
 * it declares one, else the auto `search_<useAsTitle>` name) when that
 * resolution succeeds and the debounced query is non-empty; falls back to
 * `vexConvexApi.find` otherwise — including when `useAsTitle` is a system
 * field or a non-searchable field type — which also lists recent documents
 * for an empty query.
 *
 * @param props - Hook configuration.
 * @returns Accumulated documents plus pagination/loading state.
 */
export function usePaginatedSearch<
  TDocument extends VexDocument = VexDocument,
>({
  collection,
  query,
  pageSize = 24,
  enabled = true,
  drafts,
  mimeTypes,
}: UsePaginatedSearchProps): UsePaginatedSearchReturn<TDocument> {
  const [debouncedQuery] = useDebounceValue(query, 200);
  const titleSearchIndex = resolveTitleSearchIndex({ collection });
  const useSearch = titleSearchIndex !== undefined && debouncedQuery.length > 0;
  const mimeTypesKey = mimeTypes?.join(",") ?? "";

  const [cursor, setCursor] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TDocument[]>([]);
  const [isDone, setIsDone] = useState(false);

  const resetKey = `${collection.slug}|${useSearch}|${debouncedQuery}|${drafts}|${mimeTypesKey}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setCursor(null);
    setDocuments([]);
    setIsDone(false);
  }

  const args =
    useSearch && titleSearchIndex !== undefined
      ? {
          collection: collection.slug,
          searchIndexName: titleSearchIndex.indexName,
          searchField: titleSearchIndex.searchField,
          query: debouncedQuery,
          drafts,
          paginationOpts: { numItems: pageSize, cursor },
        }
      : {
          collection: collection.slug,
          drafts,
          paginationOpts: { numItems: pageSize, cursor },
        };

  const {
    data,
    isPending: isQueryPending,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...convexQuery(
      useSearch ? vexConvexApi.search : vexConvexApi.find,
      args as never,
    ),
    enabled,
  });

  const result = useMemo<PaginationResult<TDocument>>(() => {
    const empty = {
      page: [] as TDocument[],
      continueCursor: "",
      isDone: false,
    };
    if (isLoading || isError || !data) return empty;
    if (Array.isArray(data))
      return { ...empty, page: data as TDocument[], isDone: true };
    return data as PaginationResult<TDocument>;
  }, [data, isLoading, isError]);

  useEffect(() => {
    const pageDocuments =
      mimeTypesKey.length > 0
        ? (result.page as unknown as VexMediaDocument[]).filter((doc) =>
            matchesAcceptPattern({
              filename: doc.filename,
              mimeType: doc.mimeType,
              accept: mimeTypesKey,
            }),
          )
        : result.page;
    setDocuments((prev) =>
      cursor === null
        ? (pageDocuments as TDocument[])
        : [...prev, ...(pageDocuments as TDocument[])],
    );
    setIsDone(result.isDone);
  }, [result.page, result.isDone, cursor, mimeTypesKey]);

  useEffect(() => {
    if (mimeTypesKey.length === 0) return;
    if (isQueryPending || isDone) return;
    if (documents.length >= pageSize) return;
    if (!result.continueCursor) return;
    setCursor(result.continueCursor);
  }, [
    documents.length,
    isQueryPending,
    isDone,
    result.continueCursor,
    mimeTypesKey,
    pageSize,
  ]);

  function loadMore() {
    if (isDone || !result.continueCursor) return;
    setCursor(result.continueCursor);
  }

  const isAutoFilling =
    mimeTypesKey.length > 0 &&
    !isDone &&
    documents.length < pageSize &&
    cursor !== null;

  return {
    documents,
    isPending: isQueryPending && cursor === null,
    isError,
    error,
    hasMore: !isDone,
    isLoadingMore: (isQueryPending && cursor !== null) || isAutoFilling,
    loadMore,
  };
}
