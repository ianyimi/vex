import type { ColumnDef } from "@tanstack/react-table";
import type { TextFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a text field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.meta - The text field metadata
 * @returns A ColumnDef for the text field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? props.fieldKey (capitalize first letter of fieldKey as fallback)
 * - cell: render the value as a string, truncated to 80 characters with ellipsis if longer
 */
export function textColumnDef(props: {
  fieldKey: string;
  meta: TextFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
  };
}
