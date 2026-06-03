"use client";

import type {
  CellComponentProps,
  BlocksField,
  GenericBlock,
} from "@vexcms/core";

/**
 * Blocks field cell component for the admin list-table view.
 *
 * Shows a compact count badge: `"3 blocks"`. Renders `—` when absent or empty.
 */
export function BlocksFieldCell(props: CellComponentProps<BlocksField>) {
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
