"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CellComponentProps,
  CollectionConfig,
  CollectionSlug,
  TDocument,
  UploadField,
  VexMediaDocument,
} from "@vexcms/core";
import { FilePreview } from "../../media/FilePreview";
import { get } from "@vexcms/core/client";
import { GenericId } from "convex/values";

/**
 * Table cell rendering for upload field.
 *
 * Shows:
 * - Empty: "—" placeholder.
 * - Single value (array of 1): FilePreview thumbnail + filename truncated with ellipsis, no badge.
 * - Multiple values (array of 2+): FilePreview thumbnail + filename truncated with ellipsis, `+N` badge.
 *
 * Matches the `UploadCell` design: inline-flex with FilePreview (26px) + filename + badge.
 *
 * @param props - Component props.
 * @param props.value - Array of media document IDs.
 * @returns An em-dash placeholder when empty, a loading label while the
 *   referenced media document is fetching, or a thumbnail + filename (with a
 *   `+N` badge for additional items).
 */
export function UploadFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<UploadField, TData, CollectionConfig>,
) {
  const { value } = props;
  if (!value || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const firstId = value[0];
  const { data: doc } = useQuery({
    ...get({ id: firstId as GenericId<CollectionSlug>, collection: props.fieldDef.to }),
  });
  const mediaDoc = doc as VexMediaDocument;

  if (!mediaDoc) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <FilePreview mediaDoc={mediaDoc} size={26} radius={2} />
      <span className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap">
        {mediaDoc.filename}
      </span>
      {value.length > 1 && <span className="vex-badge muted font-mono">+{value.length - 1}</span>}
    </span>
  );
}
