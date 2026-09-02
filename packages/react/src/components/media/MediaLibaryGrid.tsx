"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  type MediaCollectionConfig,
  type VexMediaDocument,
  formatBytes,
  formatMimeType,
  vexConvexApi,
} from "@vexcms/core";
import { Button, Input, Icon } from "../ui";
import { FilePreview } from "./FilePreview";
import { useDebounceValue } from "@ts-hooks-kit/core";
import { convexQuery } from "@convex-dev/react-query";
import { cn } from "../../styles/utils";

/**
 * Props for the MediaLibraryGrid component.
 */
export interface MediaLibraryGridProps {
  /** The media collection slug. */
  targetCollectionConfig: MediaCollectionConfig;
  /** Whether to allow multi-select (checkmarks on multiple items). */
  multi: boolean;
  /** Callback when user selects items (single or multiple IDs). */
  onSelect: (ids: string[]) => void;
  /** Currently selected media IDs (for checkmark display). */
  selectedIds?: string[];
}

/**
 * Reusable grid component for media library tab.
 *
 * Shows thumbnails with filename + MIME/size metadata. Supports single/multi-select
 * with checkmarks, search bar (client-side filter), MIME type filter button (TODO), and pagination.
 *
 * Matches the `MediaPicker` / `MediaModalLibrary` design: search bar + Type filter button,
 * 4-column grid with tiles showing FilePreview + filename + metadata.
 *
 * @param props - Component props.
 * @returns The search bar, results grid with selection state, and a "Load more" button when there are more results.
 */
export function MediaLibraryGrid({
  targetCollectionConfig,
  multi,
  onSelect,
  selectedIds = [],
}: MediaLibraryGridProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 200);
  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);

  const { data: allItems = [], isPending: pendingAll } = useQuery({
    ...convexQuery(vexConvexApi.find, { collection: targetCollectionConfig.slug, limit }),
    enabled: debouncedSearch.length === 0,
  });
  const allMediaItems = allItems as VexMediaDocument[];

  const { data: searchItems = [], isPending: pendingSearch } = useQuery({
    ...convexQuery(
      vexConvexApi.search,
      debouncedSearch.length < 1
        ? "skip"
        : {
            collection: targetCollectionConfig.slug,
            query: search,
            searchField: targetCollectionConfig.admin.useAsTitle,
            limit,
            searchIndexName: `search_${targetCollectionConfig.admin.useAsTitle}`,
          },
    ),
    enabled: debouncedSearch.length > 0,
  });
  const searchMediaItems = searchItems as VexMediaDocument[];

  const displayedItems = debouncedSearch.length > 0 ? searchMediaItems : allMediaItems;

  const handleItemClick = (id: string) => {
    if (multi) {
      const newSelection = selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id];
      onSelect(newSelection);
    } else {
      onSelect([id]);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 pb-2">
        <Input
          className="vex-input sm"
          placeholder={`Search ${targetCollectionConfig} by filename or alt…`}
          value={search}
          isPending={search.length > 0 && pendingSearch}
          iconLeft={{ name: "Search" }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button variant="outline" icon="ListFilter">
          Type
        </Button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
        {displayedItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {search.length === 0 && pendingAll
              ? "Loading..."
              : search.length > 0 && pendingSearch
                ? "Searching…"
                : debouncedSearch
                  ? "No media files match your search"
                  : "No media files yet"}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {displayedItems.map((mediaDoc) => (
              <MediaDocumentPreview
                key={mediaDoc._id}
                mediaDoc={mediaDoc}
                selectedIds={selectedIds}
                handleItemClick={handleItemClick}
              />
            ))}
          </div>
        )}
      </div>
      {displayedItems.length >= limit && (
        <div className="px-5 pb-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => setOffset(offset + limit)}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}

function MediaDocumentPreview({
  mediaDoc,
  selectedIds,
  handleItemClick,
}: {
  mediaDoc: VexMediaDocument;
  selectedIds: string[];
  handleItemClick: (id: string) => void;
}) {
  const isSelected = selectedIds.includes(mediaDoc._id);

  return (
    <button
      key={mediaDoc._id}
      type="button"
      className={cn(
        "group relative flex flex-col gap-2 rounded-sm border border-border bg-card p-2 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-2 border-primary",
      )}
      onClick={() => handleItemClick(mediaDoc._id)}
    >
      <div className="relative w-full aspect-square overflow-hidden rounded-sm bg-muted">
        <FilePreview mediaDoc={mediaDoc} radius={4} />
        {isSelected && (
          <div className="absolute inset-0 flex justify-end p-2 bg-primary/20">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon name="Check" size={14} strokeWidth={3} className="" />
            </div>
          </div>
        )}
      </div>
      <div className="min-w-0 text-left">
        <p className="truncate text-xs font-medium">{mediaDoc.filename}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {formatMimeType(mediaDoc.mimeType)} · {formatBytes(mediaDoc.size)}
        </p>
      </div>
    </button>
  );
}
