"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CellComponentProps,
  CollectionConfig,
  TDocument,
  UploadField,
  vexConvexApi,
  VexMediaDocument,
} from "@vexcms/core";
import { FilePreview } from "../../media/FilePreview";
import { convexQuery } from "@convex-dev/react-query";

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
 */
export function UploadFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<UploadField, TData, CollectionConfig>,
) {
  const { value } = props;
  if (!value || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const firstId = value[0];
  const { data: doc } = useQuery({ ...convexQuery(vexConvexApi.get, { id: firstId }) });
  const mediaDoc = doc as VexMediaDocument;

  if (!mediaDoc) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <FilePreview mediaDoc={mediaDoc} size={26} radius={2} />
      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]">
        {mediaDoc.filename}
      </span>
      {value.length > 1 && <span className="vex-badge muted font-mono">+{value.length - 1}</span>}
    </span>
  );
}
