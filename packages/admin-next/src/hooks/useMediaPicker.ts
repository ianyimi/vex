"use client";

import { useState, useEffect, useCallback } from "react";
import { usePaginatedQuery } from "convex/react";
import { anyApi } from "convex/server";

/**
 * Hook for managing media picker state: search, paginated results, selection.
 *
 * @param props.collectionSlug - The media collection to search
 * @param props.searchField - The field to search on (e.g., "filename")
 * @param props.searchIndexName - The search index name (e.g., "search_filename")
 * @param props.enabled - Whether the picker is open (controls query activation)
 */
export function useMediaPicker(props: {
  collectionSlug: string;
  searchField: string;
  searchIndexName: string;
  enabled: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    props.enabled
      ? anyApi.vex.media.paginatedSearchDocuments
      : ("skip" as any),
    props.enabled
      ? {
          collectionSlug: props.collectionSlug,
          searchIndexName: props.searchIndexName,
          searchField: props.searchField,
          query: debouncedSearch,
        }
      : "skip",
    { initialNumItems: 20 },
  );

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(20);
    }
  }, [status, loadMore]);

  return {
    searchTerm,
    setSearchTerm,
    results: (results ?? []) as Record<string, unknown>[],
    status,
    loadMore: handleLoadMore,
    isLoading: isLoading || status === "LoadingFirstPage",
    canLoadMore: status === "CanLoadMore",
  };
}
