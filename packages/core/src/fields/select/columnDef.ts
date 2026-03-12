import type { ColumnDef } from "@tanstack/react-table";
import type { SelectFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a select field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.field - The select field definition (includes options for label lookup)
 * @returns A ColumnDef for the select field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: look up the option label from props.field.options for the current value.
 *   If the value doesn't match any option, display the raw value.
 */
export function selectColumnDef(props: {
  fieldKey: string;
  field: SelectFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: (props.field.hasMany ? props.field.labels?.singular : props.field.label) ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
  };
}
