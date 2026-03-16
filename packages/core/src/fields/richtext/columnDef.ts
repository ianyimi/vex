import type { ColumnDef } from "@tanstack/react-table";
import type { RichTextFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a richtext field.
 *
 * @param props.fieldKey - The field key name
 * @param props.field - The richtext field definition
 * @returns ColumnDef that shows "Rich text" or empty string in the data table
 */
export function richtextColumnDef(props: {
  fieldKey: string;
  field: RichTextFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
    cell: (info) => {
      const value = info.getValue();
      if (value == null) return "";
      if (Array.isArray(value) && value.length === 0) return "";
      return "Rich text";
    },
  };
}
