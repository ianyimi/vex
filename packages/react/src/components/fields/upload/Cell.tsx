"use client";

import type { CellComponentProps, UploadField } from "@vexcms/core";

/**
 * Upload field cell — renders a thumbnail or ID string in the data table.
 *
 * @param props — Cell component props.
 * @returns The cell content element.
 */
export function UploadFieldCell(props: CellComponentProps<UploadField>) {
  const { value } = props;

  if (!value || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  // TODO: Fetch thumbnail URL from media document via Convex query
  // For now, render a placeholder with the ID
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted rounded w-8 h-8 flex items-center justify-center text-xs">📄</div>
      <span className="text-sm truncate max-w-[150px]">{value[0].slice(0, 12)}...</span>
    </div>
  );
}
