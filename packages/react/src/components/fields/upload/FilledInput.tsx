import { Button, Draggable, DragHandle, Droppable, Icon, Skeleton } from "../../ui";
import { useQuery } from "@tanstack/react-query";
import {
  formatBytes,
  formatMimeType,
  UploadField,
  vexConvexApi,
  VexMediaDocument,
} from "@vexcms/core";
import { FilePreview } from "../../media/FilePreview";
import { convexQuery } from "@convex-dev/react-query";
import { InputTag } from "../../form";
import { useVexConfig } from "../../../context";
import { cn } from "../../../styles/utils";

/**
 * Props for UploadFilledState component.
 */
export interface UploadFilledStateProps {
  /** Array of media document IDs. */
  mediaIds: string[];
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
  mediaIds,
  fieldDef,
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

  return (
    <div className="flex flex-col gap-2">
      {fieldDef.hasMany && onReorder ? (
        <Droppable id={`upload-${fieldDef.label}`} onReorder={onReorder}>
          {mediaIds.map((id, index) => (
            <Draggable key={id} id={id} index={index}>
              <UploadItemRow mediaId={id} onRemove={() => onRemove(id)} showDragHandle={true} />
            </Draggable>
          ))}
        </Droppable>
      ) : (
        <div>
          {mediaIds.map((id) => (
            <UploadItemRow key={id} mediaId={id} onRemove={() => onRemove(id)} />
          ))}
        </div>
      )}

      {fieldDef.hasMany && (
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={openPicker}
            disabled={atLimit}
            icon="FilePenLine"
          >
            Edit {targetCollectionConfig.labels.plural}
          </Button>
          {fieldDef.max && (
            <span
              className={`ml-auto font-mono text-[11px] ${
                atLimit ? "text-warning" : "text-muted-foreground"
              }`}
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
}: {
  mediaId: string;
  onRemove: () => void;
  showDragHandle?: boolean;
}) {
  const { data: doc, isPending } = useQuery({ ...convexQuery(vexConvexApi.get, { id: mediaId }) });
  const mediaDoc = doc as VexMediaDocument | null | undefined;

  return (
    <div className="flex justify-between border-2 border-border rounded items-center px-2">
      <div className="font-mono flex w-full gap-2 items-center">
        <DragHandle className={cn(!showDragHandle && "opacity-0 pointer-events-none")} />
        {!mediaDoc ? (
          <Skeleton className="h-12 w-12" />
        ) : (
          <FilePreview mediaDoc={mediaDoc} size={44} radius={3} isPending={isPending} />
        )}
        {!mediaDoc ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-xs" />
            <Skeleton className="h-4 w-xs" />
          </div>
        ) : (
          <div className="meta">
            <div className="name">{mediaDoc.filename}</div>
            <div className="sub">
              {formatMimeType(mediaDoc.mimeType)} · {formatBytes(mediaDoc.size)}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 items-center">
        {!mediaDoc ? (
          <Skeleton className="h-8 w-[200px]" />
        ) : (
          mediaDoc.alt.length > 0 && (
            <div className="flex min-w-0 max-w-[200px] items-center gap-2">
              <InputTag>ALT</InputTag>
              <span className="flex-1 truncate w-sm text-xs">
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
          >
            <Icon name="X" size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
