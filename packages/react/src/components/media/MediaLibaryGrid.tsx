"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type MediaCollectionSlug, type VexMediaDocument, vexConvexApi } from "@vexcms/core";
import { Button, Input, Icon } from "../ui";
import { FilePreview } from "./FilePreview";
import { useVexConfig } from "../../context";
import { useDebounceValue } from "@ts-hooks-kit/core";
import { convexQuery } from "@convex-dev/react-query";

/**
 * Props for the MediaLibraryGrid component.
 */
export interface MediaLibraryGridProps {
  /** The media collection slug. */
  targetCollection: MediaCollectionSlug;
  /** The name of this field in the client form state. */
  fieldName: string;
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
 */
export function MediaLibraryGrid({
  fieldName,
  targetCollection,
  multi,
  onSelect,
  selectedIds = [],
}: MediaLibraryGridProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 200);
  const [limit] = useState(24);
  const [offset, setOffset] = useState(0);
  const config = useVexConfig();

  const targetCollectionConfig = config.mediaCollections.find((mc) => mc.slug === targetCollection);
  if (!targetCollectionConfig) {
    throw new Error(`Invalid upload field to - ${targetCollection}`);
  }

  const { data: allItems = [], isPending: pendingAll } = useQuery({
    ...convexQuery(vexConvexApi.find, { collection: targetCollection, limit }),
    enabled: debouncedSearch.length === 0,
  });
  const allMediaItems = allItems as VexMediaDocument[];

  const { data: searchItems = [], isPending: pendingSearch } = useQuery({
    ...convexQuery(
      vexConvexApi.search,
      debouncedSearch.length < 1
        ? "skip"
        : {
            collection: targetCollection,
            query: search,
            searchField: fieldName,
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
      <div className="flex items-center gap-2 px-5 pb-3 pt-3.5">
        <div className="vex-input-wrap has-leading flex-1">
          <span className="leading">
            <Icon name="Search" size={13} />
          </span>
          <Input
            className="vex-input sm"
            placeholder={`Search ${targetCollection} by filename or alt…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Icon name="ListFilter" size={12} />
          Type
        </Button>
      </div>
      <div className="max-h-[320px] overflow-y-auto px-5 pb-1">
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
          <div className="grid grid-cols-4 gap-3">
            {displayedItems.map((doc) => {
              const isSel = selectedIds.includes(doc._id);
              const mimeShort = (doc.mimeType.split("/")[1] || doc.mimeType)
                .toUpperCase()
                .replace("SVG+XML", "SVG")
                .replace("JPEG", "JPG");
              const sizeDisplay =
                doc.size < 1024
                  ? `${doc.size} B`
                  : doc.size < 1024 * 1024
                    ? `${(doc.size / 1024).toFixed(0)} KB`
                    : `${(doc.size / (1024 * 1024)).toFixed(1)} MB`;

              return (
                <button
                  key={doc._id}
                  type="button"
                  className={`vex-media-tile${isSel ? " selected" : ""}`}
                  onClick={() => handleItemClick(doc._id)}
                >
                  <div className="thumb">
                    <FilePreview mediaDoc={doc} size={120} radius={4} />
                    {isSel && (
                      <span className="check">
                        <Icon name="CheckCheck" size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div className="fname">{doc.filename}</div>
                  <div className="fmeta">
                    {mimeShort} · {sizeDisplay}
                  </div>
                </button>
              );
            })}
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
