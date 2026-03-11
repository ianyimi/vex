"use client";

import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";
import { FilePreview } from "@vexcms/ui";

/**
 * Renders a file preview for an upload field cell in the DataTable.
 * Fetches the referenced media document by ID and displays a FilePreview.
 */
export function UploadCellPreview(props: {
  mediaId: string;
  collectionSlug: string;
}) {
  const { data, isPending } = useQuery({
    ...convexQuery(anyApi.vex.collections.getDocument, {
      collectionSlug: props.collectionSlug,
      documentId: props.mediaId,
    }),
  });

  if (isPending) {
    return (
      <div
        className="rounded bg-muted animate-pulse"
        style={{ width: 28, height: 28 }}
      />
    );
  }

  const doc = data as Record<string, unknown> | null;
  if (!doc) return <span className="text-muted-foreground text-xs">—</span>;

  const url = doc.url as string | undefined;
  const mimeType = (doc.mimeType as string) || "application/octet-stream";
  const filename = (doc.filename as string) || "";

  return (
    <div className="flex items-center gap-2">
      <FilePreview
        url={url}
        mimeType={mimeType}
        alt={filename}
        size={28}
      />
      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
        {filename}
      </span>
    </div>
  );
}
