"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  CRUD_ACTIONS,
  PERMISSION_SCOPES,
  readableListViewSearchFields,
  type CollectionConfig,
  type RelationshipField,
  type VexDocument,
} from "@vexcms/core";
import { Button, Input, ScrollSection, Skeleton } from "../../ui";
import { usePaginatedSearch } from "../../hooks";
import { useFieldPermissions } from "../../access";
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
 * The results area is one fixed-height `ScrollSection` — skeleton rows,
 * an error message, "No documents found", and the real rows all render
 * inside it, so the dialog never grows or shrinks switching between
 * loading, empty, and populated states. The search `Input` only renders
 * when the target collection has at least one readable
 * `admin.view.state.searchFields` entry; otherwise no search state is ever
 * set, so `usePaginatedSearch` never fires a query the server would reject.
 *
 * @param props - Component props.
 * @returns The search box (when the target collection has readable search
 *   fields), the fixed-height result list (skeleton rows while pending, an
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

  const fieldPermissions = useFieldPermissions({
    resource: targetCollection.slug,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });
  const canSearch =
    readableListViewSearchFields({
      collection: targetCollection,
      fieldPermissions,
    }).length > 0;

  useEffect(() => {
    if (!canSearch) return;
    searchRef.current?.focus();
  }, [canSearch]);

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
    query: canSearch ? debouncedSearch : "",
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
      {canSearch && (
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
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {statusText}
      </div>

      <ScrollSection height={360} data-testid="relationship-results" className="p-0">
        <div className="flex h-full flex-col gap-2 py-2">
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
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
            ))
          ) : isError ? (
            <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-destructive">
              {getVexErrorMessage(error)}
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted-foreground">
              No documents found
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </ScrollSection>
    </div>
  );
}
