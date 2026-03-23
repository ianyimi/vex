import type { ColumnDef } from "@tanstack/react-table";
import type { ObjectFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for an object field.
 * Shows a truncated JSON preview in the table cell.
 */
export function objectColumnDef(props: {
  fieldKey: string;
  field: ObjectFieldDef;
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
