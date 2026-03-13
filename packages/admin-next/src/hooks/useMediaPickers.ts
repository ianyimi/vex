"use client";

import type { VexField, UploadFieldDef } from "@vexcms/core";
import type { MediaPickerState } from "@vexcms/ui";
import { useMediaPicker } from "./useMediaPicker";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";

interface UploadFieldInfo {
  fieldName: string;
  collectionSlug: string;
  searchField: string;
  searchIndexName: string;
}

/**
 * Extracts upload field info from a collection's fields.
 */
export function getUploadFields(
  fields: Record<string, VexField>,
): UploadFieldInfo[] {
  const result: UploadFieldInfo[] = [];
  for (const [name, field] of Object.entries(fields)) {
    if (field.type === "upload") {
      const def = field as UploadFieldDef;
      result.push({
        fieldName: name,
        collectionSlug: def.to,
        searchField: "filename",
        searchIndexName: "search_filename",
      });
    }
  }
  return result;
}

/**
 * Hook that creates a media picker state for a single upload field.
 * Must be called with stable props (same collectionSlug across renders).
 */
export function useMediaPickerState(props: {
  collectionSlug: string;
  searchField: string;
  searchIndexName: string;
  selectedId: string | null;
}): MediaPickerState {
  const picker = useMediaPicker({
    collectionSlug: props.collectionSlug,
    searchField: props.searchField,
    searchIndexName: props.searchIndexName,
    enabled: true,
  });

  const selectedDocQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.getDocument, {
      collectionSlug: props.collectionSlug,
      documentId: props.selectedId ?? "",
    }),
    enabled: !!props.selectedId,
  });

  const selectedDoc = selectedDocQuery.data as Record<string, unknown> | null | undefined;

  const selectedMedia = selectedDoc
    ? {
        _id: selectedDoc._id as string,
        filename: selectedDoc.filename as string,
        mimeType: selectedDoc.mimeType as string,
        url: selectedDoc.url as string,
        alt: (selectedDoc.alt as string) || undefined,
      }
    : null;

  return {
    results: picker.results.map((doc) => ({
      _id: doc._id as string,
      filename: doc.filename as string,
      mimeType: doc.mimeType as string,
      url: doc.url as string,
      alt: (doc.alt as string) || undefined,
    })),
    searchTerm: picker.searchTerm,
    setSearchTerm: picker.setSearchTerm,
    canLoadMore: picker.canLoadMore,
    loadMore: picker.loadMore,
    isLoading: picker.isLoading,
    isSearching: picker.isSearching,
    selectedMedia,
  };
}
