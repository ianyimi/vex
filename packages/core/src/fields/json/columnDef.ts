import type { ColumnDef } from "@tanstack/react-table";
import type { JsonFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a json field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: shows truncated JSON preview
 */
export function jsonColumnDef(props: {
  fieldKey: string;
  field: JsonFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (value == null) return "";
      const str = JSON.stringify(value);
      return str.length > 50 ? str.slice(0, 50) + "..." : str;
    },
  };
}
