import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { vexConvexApi, VexMediaDocument } from "@vexcms/core";
import { Button, Icon } from "../ui";
import { FilePreview } from "./FilePreview";
import { useVexConfig } from "../../context";
import { convexQuery } from "@convex-dev/react-query";

/**
 * Props for MediaFieldValue component.
 */
export interface MediaFieldValueProps {
  /** The media document ID. */
  mediaId: string;
  /** The media collection slug. */
  targetCollection: string;
  /** Callback to open picker with this item pre-selected. */
  onEdit?: () => void;
  /** Callback to clear the upload field value. */
  onRemove?: () => void;
}

/**
 * Inline resolved media doc display on collection edit page.
 *
 * Shows a resolved media doc reference in two states:
 * - Collapsed: FilePreview thumbnail + filename/MIME/size/dimensions line with "Edit" / "Remove" buttons.
 * - Expanded: collapsed state + metadata grid (storageId, MIME, size, dimensions,
 *   media collection slug, storage adapter name).
 *
 * Matches the `MediaFieldValue` design: `.vex-mediaval` with head + optional meta grid.
 *
 * @param props - Component props.
 */
export function MediaFieldValue({
  mediaId,
  targetCollection,
  onEdit,
  onRemove,
}: MediaFieldValueProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: doc } = useQuery({
    ...convexQuery(vexConvexApi.get, { id: mediaId }),
  });
  const mediaDoc = doc as VexMediaDocument | null | undefined;
  const config = useVexConfig();

  const targetCollectionConfig = config.mediaCollections.find((mc) => mc.slug === targetCollection);
  if (!targetCollectionConfig) {
    throw new Error(`Invalid upload field 'to' - ${targetCollection}`);
  }

  if (!mediaDoc) {
    return (
      <div className="vex-mediaval">
        <div className="vex-mediaval-head">
          <div className="h-14 w-14 animate-pulse rounded bg-muted" />
          <div className="body flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const mimeShort = (mediaDoc.mimeType.split("/")[1] || mediaDoc.mimeType)
    .toUpperCase()
    .replace("SVG+XML", "SVG")
    .replace("JPEG", "JPG");
  const sizeKB = (mediaDoc.size / 1024).toFixed(1);
  const showAltWarning = !mediaDoc.alt && mediaDoc.mimeType.startsWith("image/");

  return (
    <div className="vex-mediaval">
      <div className="vex-mediaval-head">
        <FilePreview mediaDoc={mediaDoc} size={56} radius={3} />
        <div className="body">
          <div className="name">{mediaDoc.filename}</div>
          <div className="sub">
            {mimeShort} · {sizeKB} KB
          </div>
          {showAltWarning ? (
            <div className="alt-warn">
              <Icon name="BadgeAlert" size={11} />
              Alt text missing — add for accessibility
            </div>
          ) : mediaDoc.alt ? (
            <div className="alt-ok">
              <span className="k">ALT</span> {mediaDoc.alt}
            </div>
          ) : null}
        </div>
        <div className="acts">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Icon name="Pen" size={12} />
              Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" className="icon" title="Open in library">
            <Icon name="ExternalLink" size={13} />
          </Button>
          {onRemove && (
            <Button variant="ghost" size="sm" className="icon" title="Remove" onClick={onRemove}>
              <Icon name="X" size={13} />
            </Button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="vex-mediaval-meta">
          <div className="cell">
            <span className="k">Storage ID</span>
            <span className="v mono">{mediaDoc.storageId.slice(0, 12)}…</span>
          </div>
          <div className="cell">
            <span className="k">MIME</span>
            <span className="v mono">{mediaDoc.mimeType}</span>
          </div>
          <div className="cell">
            <span className="k">Size</span>
            <span className="v mono">{sizeKB} KB</span>
          </div>
          <div className="cell">
            <span className="k">Media collection</span>
            <span className="v">{targetCollectionConfig.labels.singular}</span>
          </div>
          <div className="cell">
            <span className="k">Storage adapter</span>
            <span className="v">{targetCollectionConfig.meta.storageAdapter}</span>
          </div>
        </div>
      )}
      <button
        type="button"
        className="vex-btn ghost sm mt-2"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Collapse" : "Expand"}
      </button>
    </div>
  );
}
