import type { ColumnDef } from "@tanstack/react-table";
import type { ArrayFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for an array field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? toTitleCase(props.fieldKey)
 * - cell: shows item count — "no items", "1 item", "3 items"
 */
export function arrayColumnDef(props: {
  fieldKey: string;
  meta: ArrayFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.meta.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (!Array.isArray(value) || value.length === 0) return "no items";
      if (value.length === 1) return "1 item";
      return `${value.length} items`;
    },
  };
}
