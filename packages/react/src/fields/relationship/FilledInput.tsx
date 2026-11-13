"use client";

import { useQuery } from "@tanstack/react-query";
import { GenericId } from "convex/values";
import {
  type CollectionConfig,
  type CollectionSlug,
  type DateField,
  type RelationshipField,
  type VexDocument,
  VexAccessError,
} from "@vexcms/core";
import { Button, Draggable, DragHandle, Droppable, Skeleton, Icon } from "../../ui";
import { AccessDeniedItemRow } from "../../access";
import { get } from "../../client";
import { resolveRelationshipPreview } from "./preview";
import { formatDateFieldValue } from "../date/utils";
import { cn } from "../../utils/cn";

/**
 * Resolved `time` config matching `updatedAt`'s injected definition
 * (`packages/core/src/collections/config.ts`) — the only shape a
 * target document's `updatedAt` can ever carry.
 */
const UPDATED_AT_TIME: DateField["time"] = {
  hidden: false,
  use12HourFormat: true,
  timePicker: { hour: true, minute: true, second: true },
};

/**
 * Props for {@link RelationshipFilledState}.
 */
export interface RelationshipFilledStateProps {
  /** The resolved relationship field definition. */
  fieldDef: RelationshipField;
  /** The resolved target collection. */
  targetCollection: CollectionConfig;
  /** Selected document ids, in display order. */
  docIds: string[];
  /** Whether draft target documents are visible. */
  drafts: boolean;
  /** Whether the field is non-editable. */
  readOnly?: boolean;
  /** Removes a single document from the selection. */
  onRemove: (docId: string) => void;
  /** Reorders the selection (multi only). Omit to disable drag reorder. */
  onReorder?: (from: number, to: number) => void;
  /** Clears the selection entirely. */
  onClear: () => void;
  /** Opens the picker dialog (Edit button). */
  openPicker: () => void;
}

/**
 * Filled state for the relationship field — handles both single and multi
 * selection, mirroring `UploadFilledState`.
 *
 * Each row independently resolves its document via `get` (pending skeleton,
 * access-error message, or the resolved preview + "Updated …" line when the
 * target collection declares `updatedAt`), exactly like `UploadItemRow`.
 * Multi mode additionally shows drag-to-reorder handles (when `onReorder` is
 * provided) and an Edit/Clear/`n/max` footer.
 *
 * @param props - Component props.
 * @returns The list of item rows plus Edit/Clear controls and a count indicator.
 */
export function RelationshipFilledState({
  fieldDef,
  targetCollection,
  docIds,
  drafts,
  readOnly = false,
  onRemove,
  onReorder,
  onClear,
  openPicker,
}: RelationshipFilledStateProps) {
  const atLimit = fieldDef.max !== undefined && docIds.length >= fieldDef.max[0];
  const label = fieldDef.hasMany
    ? targetCollection.labels.plural
    : targetCollection.labels.singular;

  return (
    <div className="flex flex-col gap-2">
      {fieldDef.hasMany && onReorder ? (
        <Droppable id={`relationship-${fieldDef.label}`} onReorder={onReorder}>
          {docIds.map((id, index) => (
            <Draggable key={id} id={id} index={index}>
              <RelationshipItemRow
                readOnly={readOnly}
                docId={id}
                fieldDef={fieldDef}
                targetCollection={targetCollection}
                drafts={drafts}
                onRemove={() => onRemove(id)}
                showDragHandle
              />
            </Draggable>
          ))}
        </Droppable>
      ) : (
        <div className="flex flex-col gap-2">
          {docIds.map((id) => (
            <RelationshipItemRow
              readOnly={readOnly}
              key={id}
              docId={id}
              fieldDef={fieldDef}
              targetCollection={targetCollection}
              drafts={drafts}
              onRemove={() => onRemove(id)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={openPicker}
          disabled={readOnly || atLimit}
          icon="FilePenLine"
        >
          Select {label}
        </Button>
        <Button
          variant="ghost"
          className="transition-all duration-300 hover:text-destructive"
          size="sm"
          onClick={onClear}
          disabled={readOnly || docIds.length === 0}
          icon="X"
        >
          Clear
        </Button>
        {fieldDef.max && (
          <span
            className={`${atLimit ? "text-destructive" : "text-muted-foreground"} ml-auto font-mono text-[11px]`}
          >
            {docIds.length}/{fieldDef.max[0]}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Individual item row in the relationship field — resolves its own document
 * via `get`, mirroring `UploadItemRow`'s skeleton/access-error pattern.
 *
 * @param props - Component props.
 * @returns The row's drag handle (only when `showDragHandle`), the target
 *   collection's `admin.icon` inline before the preview (or skeleton/access-error),
 *   the "Updated …" line when the target has `updatedAt`, and a remove button.
 */
function RelationshipItemRow({
  docId,
  fieldDef,
  targetCollection,
  drafts,
  readOnly,
  onRemove,
  showDragHandle = false,
}: {
  docId: string;
  fieldDef: RelationshipField;
  targetCollection: CollectionConfig;
  drafts: boolean;
  readOnly: boolean;
  onRemove: () => void;
  showDragHandle?: boolean;
}) {
  const { data: doc, error } = useQuery({
    ...get({
      id: docId as GenericId<CollectionSlug>,
      collection: targetCollection.slug,
      drafts,
    }),
  });
  const document = doc as VexDocument | null | undefined;

  const errorData = (error as ReturnType<typeof useQuery<any, VexAccessError>>["error"])?.data;
  const isAccessDenied = errorData?.code === "ACCESS_DENIED";
  const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
  // Known from config alone (not the document) — lets the pending state
  // reserve the "Updated …" line's slot (or not) without waiting on the doc.
  const hasUpdatedAtField = "updatedAt" in targetCollection.fields;
  const updatedAt =
    document &&
    hasUpdatedAtField &&
    typeof (document as Record<string, unknown>).updatedAt === "number"
      ? ((document as Record<string, unknown>).updatedAt as number)
      : undefined;

  return (
    <div className="flex items-center justify-between rounded border-2 border-border px-2">
      <div className="flex w-full items-center gap-2 font-mono">
        {showDragHandle && (
          <DragHandle
            disabled={readOnly || Boolean(errorData)}
            aria-label={`Reorder ${
              document ? ((document as Record<string, unknown>)[targetCollection.admin.useAsTitle] as string | undefined) ?? document._id : "item"
            }`}
          />
        )}
        {!document ? (
          !errorData ? (
            // Same `flex min-w-0 flex-col py-1.5` box the settled title/
            // updated-at lines render in (there is no separate square thumb
            // to skeletonize here — the previous `h-10 w-10` block reserved
            // space for an icon that never actually renders). The icon slot
            // is config-known (`targetCollection.admin.icon`) before the doc
            // loads, so it renders for real in both states; the title
            // skeleton mirrors the settled `truncate` span wrapping a nested
            // `text-[13px]` span one-for-one (not flattened onto a single
            // span) — `text-[13px]`'s "normal" line-height strut measures a
            // few px shorter at that nesting depth's OWN blockified box than
            // once removed inside a plain `truncate` wrapper, a real
            // (verified live) mismatch, not a hypothetical one. The
            // "Updated …" line's presence is config-known too
            // (`hasUpdatedAtField`), so its slot doesn't appear/disappear
            // once the doc resolves.
            <div className="flex min-w-0 flex-col py-1.5">
              <span className="flex min-w-0 items-center gap-1.5">
                {targetCollection.admin.icon && (
                  <Icon
                    name={targetCollection.admin.icon}
                    size={12}
                    aria-hidden="true"
                    className="shrink-0 translate-y-px text-muted-foreground"
                  />
                )}
                <span className="truncate">
                  <span className="text-[13px]">
                    <Skeleton className="inline-block h-3 w-32 align-middle" />
                  </span>
                </span>
              </span>
              {hasUpdatedAtField && (
                <span className="text-xs text-muted-foreground">
                  <Skeleton className="inline-block h-3 w-20 align-middle" />
                </span>
              )}
            </div>
          ) : isAccessDenied ? (
            <AccessDeniedItemRow
              resource={errorData.resource}
              action={errorData.action}
              field={errorData.field}
              label={targetCollection.labels.singular}
            />
          ) : (
            <p className="w-full text-center text-destructive">{errorData.message}</p>
          )
        ) : (
          <div className="flex min-w-0 flex-col py-1.5">
            <span className="flex min-w-0 items-center gap-1.5">
              {targetCollection.admin.icon && (
                <Icon
                  name={targetCollection.admin.icon}
                  size={12}
                  aria-hidden="true"
                  className="shrink-0 translate-y-px text-muted-foreground"
                />
              )}
              <span className={cn("truncate", readOnly && "opacity-50")}>
                <Preview doc={document} fieldKey="_id" config={targetCollection as never} />
              </span>
            </span>
            {updatedAt !== undefined && (
              <span className="text-xs text-muted-foreground">
                Updated{" "}
                {formatDateFieldValue({
                  value: updatedAt,
                  time: UPDATED_AT_TIME,
                })}
              </span>
            )}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        className="p-0 transition-colors duration-300 hover:text-destructive"
        type="button"
        title="Remove"
        onClick={onRemove}
        disabled={readOnly || Boolean(errorData)}
        icon="X"
        iconPosition="center"
      />
    </div>
  );
}
