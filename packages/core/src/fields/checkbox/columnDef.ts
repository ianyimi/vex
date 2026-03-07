import type { ColumnDef } from "@tanstack/react-table";
import type { CheckboxFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a checkbox (boolean) field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.meta - The checkbox field metadata
 * @returns A ColumnDef for the checkbox field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? toTitleCase(props.fieldKey)
 * - cell: render "Yes" / "No" (React rendering with icons is handled by UI layer)
 */
export function checkboxColumnDef(props: {
  fieldKey: string;
  meta: CheckboxFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
    meta: { align: props.meta.admin?.cellAlignment ?? "left" },
  };
}
