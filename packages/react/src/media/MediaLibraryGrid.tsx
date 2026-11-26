"use client";

import { useMemo, useState } from "react";
import {
  type MediaCollectionConfig,
  type VexMediaDocument,
  CRUD_ACTIONS,
  formatBytes,
  formatMimeType,
  PERMISSION_SCOPES,
  readableListViewSearchFields,
} from "@vexcms/core";
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Skeleton,
} from "../ui";
import { ScrollSection } from "../ui/ScrollSection";
import { Icon } from "../ui/Icon";
import { FilePreview } from "./FilePreview";
import { usePaginatedSearch } from "../hooks";
import { useFieldPermissions } from "../access";
import { cn } from "../utils/cn";
import { getVexErrorMessage } from "../utils/errors";

/** Fixed pixel height of the results scroll area — same across pending/empty/results states. */
const RESULTS_HEIGHT = 420;

/** Number of skeleton tiles rendered while the grid is pending. */
const SKELETON_TILE_COUNT = 12;

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

  const fieldPermissions = useFieldPermissions({
    resource: targetCollectionConfig.slug,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });
  const searchFields = readableListViewSearchFields({
    collection: targetCollectionConfig,
    fieldPermissions,
  });
  const showSearch = searchFields.length > 0;

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

  const { documents, isPending, isError, error, hasMore, isLoadingMore, loadMore } =
    usePaginatedSearch<VexMediaDocument>({
      collection: targetCollectionConfig,
      query: showSearch ? search : "",
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

  const statusText = isPending
    ? "Loading media…"
    : isError
      ? getVexErrorMessage(error)
      : documents.length === 0
        ? search.length > 0
          ? "No media files match your search"
          : "No media files yet"
        : `${documents.length} file${documents.length === 1 ? "" : "s"} loaded`;

  return (
    <>
      <div className="flex items-center gap-2 pb-2">
        {showSearch && (
          <Input
            className="vex-input sm"
            placeholder={`Search ${targetCollectionConfig.labels.plural} by filename or alt…`}
            value={search}
            isPending={search.length > 0 && isPending}
            iconLeft={{ name: "Search" }}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
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
      <div role="status" aria-live="polite" className="sr-only">
        {statusText}
      </div>
      <ScrollSection height={RESULTS_HEIGHT} className="overflow-x-hidden">
        {isError ? (
          <p className="flex h-full items-center justify-center p-8 text-center text-xs text-destructive">
            {getVexErrorMessage(error)}
          </p>
        ) : isPending ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {Array.from({ length: SKELETON_TILE_COUNT }).map((_, i) => (
              <MediaTileSkeleton key={i} />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            {search.length > 0
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
      </ScrollSection>
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

/**
 * Skeleton tile matching {@link MediaDocumentPreview}'s real shape, shown
 * in place of settled tiles while the grid's query is pending.
 *
 * @returns A skeleton tile with the same thumbnail + two-line footer shape.
 */
function MediaTileSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border bg-card p-2">
      <Skeleton className="aspect-square w-full rounded-sm" />
      <div className="min-w-0">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="mt-1 h-2.5 w-1/2" />
      </div>
    </div>
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
      aria-pressed={isSelected}
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
