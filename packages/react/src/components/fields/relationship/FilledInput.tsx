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
import { Button, Draggable, DragHandle, Droppable, Skeleton } from "../../ui";
import { get } from "../../../client";
import { resolveRelationshipPreview } from "./preview";
import { formatDateFieldValue } from "../date/utils";
import { Icon } from "../../Icon";

/**
 * Resolved `time` config matching `updatedAt`'s injected definition
 * (`packages/core/src/collections/config.ts`, Decision 3) — the only shape a
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

      <div className="flex items-center gap-2.5">
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

  const accessError = (error as ReturnType<typeof useQuery<any, VexAccessError>>["error"])?.data;
  const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
  const updatedAt =
    document &&
    "updatedAt" in targetCollection.fields &&
    typeof (document as Record<string, unknown>).updatedAt === "number"
      ? ((document as Record<string, unknown>).updatedAt as number)
      : undefined;

  return (
    <div className="flex items-center justify-between rounded border-2 border-border px-2">
      <div className="flex w-full items-center gap-2 font-mono">
        {showDragHandle && <DragHandle disabled={readOnly || Boolean(accessError)} />}
        {!document ? (
          !accessError ? (
            <Skeleton className="h-10 w-10" />
          ) : (
            <p className="w-full text-center text-destructive">{accessError.message}</p>
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
              <span className="truncate">
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
        {!document && !accessError && <Skeleton className="h-4 w-xs" />}
      </div>
      <Button
        variant="ghost"
        className="p-0 transition-colors duration-300 hover:text-destructive"
        type="button"
        title="Remove"
        onClick={onRemove}
        disabled={readOnly || Boolean(accessError)}
        icon="X"
        iconPosition="center"
      />
    </div>
  );
}
