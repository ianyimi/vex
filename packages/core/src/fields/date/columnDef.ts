import type { ColumnDef } from "@tanstack/react-table";
import type { DateFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a date field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? toTitleCase(props.fieldKey)
 * - cell: formats epoch ms as a human-readable date string
 */
export function dateColumnDef(props: {
  fieldKey: string;
  meta: DateFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
    meta: {
      align: props.meta.admin?.cellAlignment ?? "left",
    },
    cell: (info) => {
      const value = info.getValue();
      if (value == null) return "";
      return new Date(value as number).toLocaleDateString();
    },
  };
}
