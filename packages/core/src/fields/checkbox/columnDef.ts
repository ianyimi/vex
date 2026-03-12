import type { ColumnDef } from "@tanstack/react-table";
import type { CheckboxFieldDef } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a checkbox (boolean) field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.field - The checkbox field definition
 * @returns A ColumnDef for the checkbox field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.field.label ?? toTitleCase(props.fieldKey)
 * - cell: render "Yes" / "No" (React rendering with icons is handled by UI layer)
 */
export function checkboxColumnDef(props: {
  fieldKey: string;
  field: CheckboxFieldDef;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.field.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.field.admin?.cellAlignment ?? "left" },
  };
}
