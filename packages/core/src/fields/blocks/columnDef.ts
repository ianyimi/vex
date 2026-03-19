import type { ColumnDef } from "@tanstack/react-table";
import type { BlocksFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a blocks field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: shows block count — "no blocks", "1 block", "3 blocks"
 *   Uses field.labels if provided (e.g., "1 section", "3 sections").
 */
export function blocksColumnDef(props: {
  fieldKey: string;
  field: BlocksFieldDef;
}): ColumnDef<Record<string, unknown>> {
  const singular = props.field.labels?.singular ?? "block";
  const plural = props.field.labels?.plural ?? "blocks";

  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (!Array.isArray(value) || value.length === 0) return `no ${plural}`;
      if (value.length === 1) return `1 ${singular}`;
      return `${value.length} ${plural}`;
    },
  };
}
