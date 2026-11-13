"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type {
  CollectionConfig,
  RelationshipField,
  VexDocument,
} from "@vexcms/core";
import { Button, Input, Skeleton } from "../../ui";
import { usePaginatedSearch } from "../../hooks";
import { resolveRelationshipPreview } from "./preview";
import { getVexErrorMessage } from "../../utils/errors";

/**
 * Props for {@link RelationshipDocumentList}.
 */
export interface RelationshipDocumentListProps {
  /** The resolved relationship field definition driving preview + limit rules. */
  fieldDef: RelationshipField;
  /** The target collection documents are searched/listed against. */
  targetCollection: CollectionConfig;
  /** Currently selected document ids, used for checkmarks and the max-selection gate. */
  selectedIds: string[];
  /** Whether draft target documents are visible (mirrors the editing document's own draft status). */
  drafts: boolean;
  /** Called with the next selection whenever a row is toggled. */
  onSelectionChange: (ids: string[]) => void;
}

/**
 * Searchable, paginated list of candidate documents for the relationship
 * picker's Select tab.
 *
 * Single-select (`!fieldDef.hasMany`) rows replace the whole selection on
 * click (re-clicking the selected row clears it). Multi-select rows toggle
 * via a checkbox-styled marker and are disabled once `selectedIds.length`
 * reaches `fieldDef.max`.
 *
 * @param props - Component props.
 * @returns The search box, the result list (skeleton rows while pending, an
 *   error message, "No documents found", or the rows), and a "Load more"
 *   button when `usePaginatedSearch` reports `hasMore`.
 */
export function RelationshipDocumentList({
  fieldDef,
  targetCollection,
  selectedIds,
  drafts,
  onSelectionChange,
}: RelationshipDocumentListProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const {
    documents,
    isPending,
    isError,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
  } = usePaginatedSearch<VexDocument>({
    collection: targetCollection,
    query: debouncedSearch,
    drafts,
  });

  const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
  const atMax =
    fieldDef.max !== undefined && selectedIds.length >= fieldDef.max[0];
  const targetLabel = targetCollection.labels.plural;

  function toggle(docId: string) {
    if (fieldDef.hasMany) {
      if (selectedIds.includes(docId)) {
        onSelectionChange(selectedIds.filter((id) => id !== docId));
      } else if (!atMax) {
        onSelectionChange([...selectedIds, docId]);
      }
    } else {
      onSelectionChange(selectedIds[0] === docId ? [] : [docId]);
    }
  }

  const statusText = isPending
    ? "Loading…"
    : isError
      ? getVexErrorMessage(error)
      : documents.length === 0
        ? "No documents found"
        : `${documents.length} ${targetLabel.toLowerCase()} loaded`;

  return (
    <div className="flex flex-col gap-2">
      <div className="border-b border-border p-2">
        <Input
          ref={searchRef}
          type="text"
          placeholder={`Search ${targetLabel}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          isPending={isPending}
        />
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {statusText}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            // Same `flex w-full items-center gap-2 … px-3 py-1.5 text-[13px]`
            // shell the settled row below renders — its `py-1.5` padding +
            // `text-[13px]` line (and the hasMany checkbox box, same `h-4
            // w-4`) are what settle the row's real height, so a `<Skeleton>`
            // dropped in place of the previous unrelated `h-10` bar no longer
            // resizes once results load.
            <button
              key={i}
              type="button"
              disabled
              className="flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-[13px]"
            >
              {fieldDef.hasMany && (
                <span className="grid h-4 w-4 flex-shrink-0 place-items-center rounded-sm border border-input" />
              )}
              <span className="flex-1 truncate">
                <Skeleton className="inline-block h-3 w-40 align-middle" />
              </span>
            </button>
          ))}
        </div>
      ) : isError ? (
        <p className="p-4 text-center text-xs text-destructive">
          {getVexErrorMessage(error)}
        </p>
      ) : documents.length === 0 ? (
        <p className="p-4 text-center text-xs text-muted-foreground">
          No documents found
        </p>
      ) : (
        <div className="max-h-[360px] overflow-y-auto">
          {documents.map((doc) => {
            const docId = doc._id as string;
            const isSelected = selectedIds.includes(docId);
            const disabled = fieldDef.hasMany && !isSelected && atMax;
            return (
              <button
                key={docId}
                type="button"
                onClick={() => toggle(docId)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`${isSelected ? "bg-accent text-accent-foreground" : ""} flex w-full items-center
                    gap-2 rounded px-3 py-1.5 text-left text-[13px] hover:bg-accent hover:text-accent-foreground
                  disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {fieldDef.hasMany && (
                  <span
                    className={`${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "border-input"
                    } grid h-4 w-4 flex-shrink-0 place-items-center rounded-sm border border-primary`}
                  >
                    {isSelected && <span className="text-[10px]">✓</span>}
                  </span>
                )}
                <span className="flex-1 truncate">
                  <Preview
                    doc={doc}
                    fieldKey="_id"
                    config={targetCollection as never}
                  />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={loadMore}
          isPending={isLoadingMore}
          className="self-center"
        >
          Load more
        </Button>
      )}
    </div>
  );
}
