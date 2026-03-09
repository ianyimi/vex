"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import type { AnyVexCollection, VexConfig } from "@vexcms/core";
import { generateColumns } from "@vexcms/core";
import {
  DataTable,
  Input,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@vexcms/ui";
import Link from "next/link";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";
import { useQueryState, parseAsIndex, parseAsStringLiteral } from "nuqs";
import { usePaginationLoader } from "../hooks/usePaginationLoader";
import { useBidirectionalPagination } from "../hooks/useBidirectionalPagination";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const PAGE_SIZE_STRINGS = PAGE_SIZE_OPTIONS.map(String) as unknown as readonly [
  "10",
  "25",
  "50",
  "100",
];
const STORAGE_KEY = "vex-page-size";

function getStoredPageSize(): string {
  if (typeof window === "undefined") return "10";
  return localStorage.getItem(STORAGE_KEY) ?? "10";
}

export default function CollectionsView({
  config,
  collection,
}: {
  config: VexConfig;
  collection: AnyVexCollection;
}) {
  const [pageIndex, setPageIndex] = useQueryState(
    "page",
    parseAsIndex.withDefault(0),
  );
  const [searchTerm, setSearchTerm] = useQueryState("q", { defaultValue: "" });
  const [pageSizeStr, setPageSizeStr] = useQueryState(
    "size",
    parseAsStringLiteral(PAGE_SIZE_STRINGS).withDefault(
      getStoredPageSize() as (typeof PAGE_SIZE_STRINGS)[number],
    ),
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const pageSize = Number(pageSizeStr);
  const initialFetchSize = Math.max(50, pageSize * 5);

  const handlePageSizeChange = (newSize: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(newSize));
    }
    setPageSizeStr(String(newSize) as (typeof PAGE_SIZE_STRINGS)[number]);
    setPageIndex(0);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const columns = useMemo(
    () => generateColumns({ collection, auth: config.auth }),
    [collection, config.auth],
  );

  const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
  const searchAvailable = !!useAsTitle;
  const searchIndexName = useAsTitle ? `search_${useAsTitle}` : undefined;
  const isSearching = searchAvailable && debouncedSearch.trim().length > 0;

  // Total document count (reactive, separate from paginated query)
  const countQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.countDocuments, {
      collectionSlug: collection.slug,
    }),
    enabled: !isSearching,
  });
  const totalCount = countQuery.data as number | undefined;

  // Paginated list mode (bidirectional for instant last-page access)
  const {
    documents: listResults,
    tablePageIndex,
    isLoading: listLoading,
    canLoadMore,
    loadMore,
    totalLoaded,
    handlePageChange,
  } = useBidirectionalPagination({
    collectionSlug: collection.slug,
    initialFetchSize,
    pageSize,
    pageIndex,
    totalCount,
    isSearching,
  });

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
    ? ((searchQuery.data as Record<string, unknown>[]) ??
      lastSearchResults.current)
    : (listResults ?? []);

  if (isSearching && searchQuery.data) {
    lastSearchResults.current = searchQuery.data as Record<string, unknown>[];
  }

  usePaginationLoader({
    pageIndex: tablePageIndex,
    pageSize,
    totalLoaded: isSearching ? documents.length : totalLoaded,
    loadMore: (n) => {
      if (canLoadMore) loadMore(n);
    },
    canLoadMore,
    batchSize: initialFetchSize,
  });

  const isLoading = isSearching ? searchQuery.isPending : listLoading;
  const searchLoading = isSearching && searchQuery.isFetching;

  // Display count: use totalCount for list mode, documents.length for search
  const displayCount = isSearching ? documents.length : totalCount;

  const pluralLabel = collection.config.labels?.plural ?? collection.slug;

  return (
    <div className="flex flex-col p-6 h-[calc(100vh-theme(spacing.16))] min-h-0">
      <Breadcrumb className="mb-4 shrink-0">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={config.basePath} />}>
              Admin
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pluralLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">{pluralLabel}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : isSearching
                ? `${displayCount} result(s)`
                : displayCount != null
                  ? `${displayCount.toLocaleString()} document(s)`
                  : "Loading..."}
          </p>
        </div>
      </div>

      {searchAvailable && (
        <div className="mb-4 max-w-sm shrink-0">
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
        emptyMessage={
          isSearching
            ? "No matching documents."
            : `No ${collection.config.labels?.plural?.toLowerCase() ?? "documents"} yet.`
        }
        canLoadMore={canLoadMore}
        pageSize={pageSize}
        pageIndex={isSearching ? pageIndex : tablePageIndex}
        displayPageIndex={isSearching ? undefined : pageIndex}
        onPageChange={(page: number) => {
          const resolved = handlePageChange(page);
          setPageIndex(resolved);
        }}
        onPageSizeChange={handlePageSizeChange}
        totalCount={isSearching ? undefined : totalCount}
        linkComponent={Link}
      />
    </div>
  );
}
