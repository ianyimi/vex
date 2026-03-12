import type { ColumnDef } from "@tanstack/react-table";
import type { TextFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a text field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.field - The text field definition
 * @returns A ColumnDef for the text field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? props.fieldKey (capitalize first letter of fieldKey as fallback)
 * - cell: render the value as a string, truncated to 80 characters with ellipsis if longer
 */
export function textColumnDef(props: {
  fieldKey: string;
  field: TextFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
  };
}
