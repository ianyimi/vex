"use client";

import { useMemo, useState } from "react";
import {
  type MediaCollectionConfig,
  type VexMediaDocument,
  formatBytes,
  formatMimeType,
} from "@vexcms/core";
import {
  Button,
  Input,
  Icon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui";
import { FilePreview } from "./FilePreview";
import { usePaginatedSearch } from "../../hooks";
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
  /**
   * The owning upload field's `accept` pattern list. Restricts both the
   * grid's results and the Type filter menu's options; omit to browse every
   * file in the collection and offer the generic Images/Videos/Audio/PDF
   * categories instead.
   */
  accept?: string;
}

const DEFAULT_TYPE_OPTIONS = [
  "image/*",
  "video/*",
  "audio/*",
  "application/pdf",
] as const;

/**
 * Formats an accept pattern (`"image/*"`, `".pdf"`, `"application/pdf"`) as
 * a Type-menu label.
 *
 * @param pattern - One accept pattern.
 * @returns A human-readable label for the Type filter menu.
 */
function formatTypeOption(pattern: string): string {
  if (pattern === "audio/*") return "Audio";
  if (pattern.endsWith("/*")) {
    const category = pattern.slice(0, -2);
    return `${category.charAt(0).toUpperCase()}${category.slice(1)}s`;
  }
  if (pattern.startsWith(".")) return pattern.toUpperCase();
  return formatMimeType(pattern);
}

/**
 * Reusable grid component for the media library tab.
 *
 * Shows thumbnails with filename + MIME/size metadata. Supports single/multi-select
 * with checkmarks, a debounced server-side search bar, a Type filter menu (client-side
 * MIME match over the field's `accept` patterns, via `usePaginatedSearch`'s `mimeTypes`),
 * and real cursor pagination with a working "Load more".
 *
 * Matches the `MediaPicker` / `MediaModalLibrary` design: search bar + Type filter button,
 * 4-column grid with tiles showing FilePreview + filename + metadata.
 *
 * @param props - Component props.
 * @returns The search bar + Type filter, results grid with selection state, and a "Load more" button when there are more results.
 */
export function MediaLibraryGrid({
  targetCollectionConfig,
  multi,
  onSelect,
  selectedIds = [],
  accept,
}: MediaLibraryGridProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const acceptPatterns = useMemo(
    () =>
      (accept ?? "")
        .split(",")
        .map((pattern) => pattern.trim())
        .filter(Boolean),
    [accept],
  );
  const typeOptions =
    acceptPatterns.length > 0 ? acceptPatterns : [...DEFAULT_TYPE_OPTIONS];
  const mimeTypes = useMemo(() => {
    if (selectedType !== "all") return [selectedType];
    return acceptPatterns.length > 0 ? acceptPatterns : undefined;
  }, [selectedType, acceptPatterns]);

  const { documents, isPending, hasMore, isLoadingMore, loadMore } =
    usePaginatedSearch<VexMediaDocument>({
      collection: targetCollectionConfig,
      query: search,
      mimeTypes,
    });

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
          placeholder={`Search ${targetCollectionConfig.labels.plural} by filename or alt…`}
          value={search}
          isPending={search.length > 0 && isPending}
          iconLeft={{ name: "Search" }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" icon="ListFilter">
                {selectedType === "all"
                  ? "Type"
                  : formatTypeOption(selectedType)}
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={selectedType}
              onValueChange={setSelectedType}
            >
              <DropdownMenuRadioItem value="all">
                All types
              </DropdownMenuRadioItem>
              {typeOptions.map((pattern) => (
                <DropdownMenuRadioItem key={pattern} value={pattern}>
                  {formatTypeOption(pattern)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
        {documents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {isPending
              ? "Loading..."
              : search.length > 0
                ? "No media files match your search"
                : "No media files yet"}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {documents.map((mediaDoc) => (
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
      {hasMore && (
        <div className="px-5 pb-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading…" : "Load more"}
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
