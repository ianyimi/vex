"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import type { VexCollection, VexConfig } from "@vexcms/core";
import { generateColumns } from "@vexcms/core";
import { DataTable, Input } from "@vexcms/ui";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useConvexPaginatedQuery, convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";
import { usePaginationLoader } from "../hooks/usePaginationLoader";

const DEFAULT_PAGE_SIZE = 10;

export default function CollectionsView({
  config,
  collection,
}: {
  config: VexConfig;
  collection: VexCollection;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = DEFAULT_PAGE_SIZE;
  const initialFetchSize = Math.max(50, pageSize * 5);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const columns = useMemo(() => generateColumns(collection), [collection]);

  const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
  const searchAvailable = !!useAsTitle;
  const searchIndexName = useAsTitle ? `search_${useAsTitle}` : undefined;
  const isSearching = searchAvailable && debouncedSearch.trim().length > 0;

  // Paginated list mode
  const {
    results: listResults,
    status: paginationStatus,
    loadMore,
    isLoading: listLoading,
  } = useConvexPaginatedQuery(
    anyApi.vex.collections.listDocuments,
    isSearching ? "skip" : { collectionSlug: collection.slug },
    { initialNumItems: initialFetchSize },
  );

  // Search mode
  const searchQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.searchDocuments, {
      collectionSlug: collection.slug,
      searchIndexName: searchIndexName ?? "",
      searchField: useAsTitle ?? "",
      query: debouncedSearch.trim(),
    }),
    enabled: isSearching,
    placeholderData: keepPreviousData,
  });

  const lastSearchResults = useRef<Record<string, unknown>[]>([]);

  const documents = isSearching
    ? (searchQuery.data as Record<string, unknown>[] ?? lastSearchResults.current)
    : (listResults ?? []);

  if (isSearching && searchQuery.data) {
    lastSearchResults.current = searchQuery.data as Record<string, unknown>[];
  }

  const canLoadMore = !isSearching && paginationStatus === "CanLoadMore";

  usePaginationLoader({
    pageIndex,
    pageSize,
    totalLoaded: documents.length,
    loadMore: (n) => {
      if (canLoadMore) loadMore(n);
    },
    canLoadMore,
    batchSize: initialFetchSize,
  });

  const isLoading = isSearching ? searchQuery.isPending : listLoading;
  const searchLoading = isSearching && searchQuery.isFetching;
  const documentCount = documents.length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {collection.config.labels?.plural ?? collection.slug}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : isSearching
                ? `${documentCount} result(s)`
                : `${documentCount} document(s)`}
          </p>
        </div>
      </div>

      {searchAvailable && (
        <div className="mb-4 max-w-sm">
          <Input
            placeholder={`Search by ${useAsTitle}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageIndex(0);
            }}
            loading={searchLoading}
          />
        </div>
      )}

      <DataTable
        columns={columns}
        data={documents as Record<string, unknown>[]}
        basePath={config.basePath}
        collectionSlug={collection.slug}
        emptyMessage={isSearching ? "No matching documents." : "No documents yet."}
        onLoadMore={() => {
          if (canLoadMore) loadMore(initialFetchSize);
        }}
        canLoadMore={canLoadMore}
        pageSize={pageSize}
        onPageChange={setPageIndex}
      />
    </div>
  );
}
