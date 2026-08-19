import { Button, Draggable, DragHandle, Droppable, Icon, Skeleton } from "../../ui";
import { useQuery } from "@tanstack/react-query";
import {
  CollectionConfig,
  type CollectionSlug,
  CRUD_ACTIONS,
  formatBytes,
  formatMimeType,
  GlobalConfig,
  type UploadField,
  VexAccessError,
  type VexMediaDocument,
} from "@vexcms/core";
import { FilePreview } from "../../media/FilePreview";
import { get } from "@vexcms/core/client";
import { InputTag, TypedFieldApi } from "../../form";
import { useVexConfig } from "../../../context";
import { cn } from "../../../styles/utils";
import { GenericId } from "convex/values";
import { usePermission } from "../../../hooks";

/**
 * Props for UploadFilledState component.
 */
export interface UploadFilledStateProps {
  /** CollectionConfig for this field's collection. */
  collection: CollectionConfig | GlobalConfig;
  /** Array of media document IDs. */
  mediaIds: string[];
  /** The FieldApi of the field being uploaded to. */
  fieldApi: TypedFieldApi<string[]>;
  /** The UploadField of the field being uploaded to. */
  fieldDef: UploadField;
  /** Callback to remove a specific media ID (or all if no ID provided). */
  onRemove: (mediaId?: string) => void;
  /** Callback to reorder items (multi only). */
  onReorder?: (from: number, to: number) => void;
  /** Callback to open the media picker. */
  openPicker: () => Promise<void>;
}

/**
 * Filled state for upload field — handles both single and multi modes.
 *
 * Single mode (`multi === false`):
 * - Renders one item row with FilePreview thumbnail + Replace/Remove actions
 * - Matches the `UploadItemRow` design
 *
 * Multi mode (`multi === true`):
 * - Renders list of item rows + "Add image" / "Browse library" buttons + count display
 * - Matches the `UploadMulti` design
 *
 * @param props - Component props.
 */
export function UploadFilledState({
  collection,
  mediaIds,
  fieldDef,
  fieldApi,
  onRemove,
  onReorder,
  openPicker,
}: UploadFilledStateProps) {
  const atLimit = fieldDef.max !== undefined && mediaIds.length >= fieldDef.max;

  const config = useVexConfig();
  const targetCollectionConfig = config.mediaCollections.find((mc) => mc.slug === fieldDef.to);
  if (!targetCollectionConfig) {
    throw new Error(`Media collection not configured with slug ${fieldDef.to}`);
  }

  // TODO. currently throws because the resource here is the collection slug
  // but we dont have access to that information at this point in the code runtime.
  const canEdit = usePermission({
    action: CRUD_ACTIONS.update,
    resource: collection.slug,
  });

  return (
    <div className="flex flex-col gap-2">
      {fieldDef.hasMany && onReorder ? (
        <Droppable id={`upload-${fieldDef.label}`} onReorder={onReorder}>
          {mediaIds.map((id, index) => (
            <Draggable key={id} id={id} index={index}>
              <UploadItemRow
                mediaId={id}
                collection={targetCollectionConfig.slug}
                onRemove={() => onRemove(id)}
                showDragHandle={true}
              />
            </Draggable>
          ))}
        </Droppable>
      ) : (
        <div>
          {mediaIds.map((id) => (
            <UploadItemRow
              key={id}
              mediaId={id}
              collection={targetCollectionConfig.slug}
              onRemove={() => onRemove(id)}
            />
          ))}
        </div>
      )}

      {fieldDef.hasMany && (
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={openPicker}
            disabled={atLimit || !canEdit}
            icon="FilePenLine"
          >
            Edit {targetCollectionConfig.labels.plural}
          </Button>
          <Button
            variant="ghost"
            className="hover:text-destructive transition-all duration-300"
            size="sm"
            onClick={() => fieldApi.setValue([])}
            disabled={!canEdit}
            icon="X"
          >
            Clear
          </Button>
          {fieldDef.max && (
            <span
              className={`${atLimit ? "text-warning" : "text-muted-foreground"} ml-auto font-mono
              text-[11px]`}
            >
              {mediaIds.length}/{fieldDef.max}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Individual item row in upload field.
 *
 * @param props - Component props.
 */
function UploadItemRow({
  mediaId,
  onRemove,
  showDragHandle = false,
  collection,
}: {
  mediaId: string;
  onRemove: () => void;
  collection: CollectionSlug;
  showDragHandle?: boolean;
}) {
  const {
    data: doc,
    isPending,
    error,
  } = useQuery({
    ...get({ id: mediaId as GenericId<CollectionSlug>, collection }),
  });
  const mediaDoc = doc as VexMediaDocument | null | undefined;

  const accessError = (error as ReturnType<typeof useQuery<any, VexAccessError>>["error"])?.data;
  return (
    <div className="border-border flex items-center justify-between rounded border-2 px-2">
      <div className="flex w-full items-center gap-2 font-mono">
        <DragHandle
          className={cn(!showDragHandle && "opacity-0 pointer-events-none")}
          disabled={Boolean(accessError)}
        />
        {!mediaDoc ? (
          !accessError ? (
            <Skeleton className="h-12 w-12" />
          ) : (
            <p className="text-destructive w-full text-center">{accessError.message}</p>
          )
        ) : (
          <FilePreview mediaDoc={mediaDoc} size={44} radius={3} isPending={isPending} />
        )}
        {!mediaDoc ? (
          !accessError ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-xs" />
              <Skeleton className="h-4 w-xs" />
            </div>
          ) : null
        ) : (
          <div className="">
            <div className="">{mediaDoc.filename}</div>
            <div className="">
              {formatMimeType(mediaDoc.mimeType)} · {formatBytes(mediaDoc.size)}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!mediaDoc ? (
          !accessError ? (
            <Skeleton className="h-8 w-[200px]" />
          ) : null
        ) : (
          mediaDoc.alt.length > 0 && (
            <div className="flex max-w-[200px] min-w-0 items-center gap-2">
              <InputTag>ALT</InputTag>
              <span className="w-sm flex-1 truncate text-xs">
                {mediaDoc.alt || <em className="text-destructive">Missing</em>}
              </span>
            </div>
          )
        )}
        <div className="acts">
          <Button
            variant="ghost"
            className="hover:text-destructive transition-colors duration-300"
            type="button"
            title="Remove"
            onClick={onRemove}
            disabled={Boolean(accessError)}
          >
            <Icon name="X" size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
