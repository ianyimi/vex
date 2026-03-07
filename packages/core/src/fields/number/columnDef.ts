import type { ColumnDef } from "@tanstack/react-table";
import type { NumberFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a number field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.meta - The number field metadata
 * @returns A ColumnDef for the number field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? toTitleCase(props.fieldKey)
 * - cell: render the number directly
 */
export function numberColumnDef(props: {
  fieldKey: string;
  meta: NumberFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
  };
}
