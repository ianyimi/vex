import type { ColumnDef } from "@tanstack/react-table";
import type { JsonFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a json field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? toTitleCase(props.fieldKey)
 * - cell: shows truncated JSON preview
 */
export function jsonColumnDef(props: {
  fieldKey: string;
  meta: JsonFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.meta.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (value == null) return "";
      const str = JSON.stringify(value);
      return str.length > 50 ? str.slice(0, 50) + "..." : str;
    },
  };
}
