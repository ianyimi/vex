"use client";

import type { CellComponentProps, BlocksField, GenericBlock, TDocument } from "@vexcms/core";

/**
 * Blocks field cell component for the admin list-table view.
 *
 * Shows a compact count badge: `"3 blocks"`. Renders `—` when absent or empty.
 *
 * @param props - Component props.
 * @returns The count badge, or an em-dash placeholder when there are no blocks.
 */
export function BlocksFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<BlocksField, TData>,
) {
  const value = props.value as GenericBlock[] | null | undefined;

  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const { singular, plural } = props.fieldDef.labels;

  return (
    <span className="text-xs text-muted-foreground">
      {value.length} {value.length === 1 ? singular : plural}
    </span>
  );
}
