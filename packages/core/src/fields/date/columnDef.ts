import type { ColumnDef } from "@tanstack/react-table";
import type { DateFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a date field.
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: formats epoch ms as a human-readable date string
 */
export function dateColumnDef(props: {
  fieldKey: string;
  field: DateFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: {
      align: props.field.admin?.cellAlignment ?? "left",
    },
    cell: (info) => {
      const value = info.getValue();
      if (value == null) return "";
      return new Date(value as number).toLocaleDateString();
    },
  };
}
