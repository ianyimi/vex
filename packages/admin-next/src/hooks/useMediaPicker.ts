"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // Keep previous results visible while new query loads
  const prevResults = useRef<Record<string, unknown>[]>([]);
  const currentResults = (results ?? []) as Record<string, unknown>[];
  if (currentResults.length > 0 || !isLoading) {
    prevResults.current = currentResults;
  }
  const displayResults = isLoading && currentResults.length === 0
    ? prevResults.current
    : currentResults;

  // Track whether search is in-flight (debounce pending or query loading)
  const isSearching = searchTerm !== debouncedSearch || (isLoading && displayResults.length > 0);

  const handleLoadMore = useCallback(() => {
    if (status === "CanLoadMore") {
      loadMore(20);
    }
  }, [status, loadMore]);

  return {
    searchTerm,
    setSearchTerm,
    results: displayResults,
    status,
    loadMore: handleLoadMore,
    isLoading: isLoading && prevResults.current.length === 0,
    isSearching,
    canLoadMore: status === "CanLoadMore",
  };
}
