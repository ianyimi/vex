import type { ColumnDef } from "@tanstack/react-table";
import type { ArrayFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for an array field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: shows item count — "no items", "1 item", "3 items"
 */
export function arrayColumnDef(props: {
  fieldKey: string;
  field: ArrayFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (!Array.isArray(value) || value.length === 0) return "no items";
      if (value.length === 1) return "1 item";
      return `${value.length} items`;
    },
  };
}
