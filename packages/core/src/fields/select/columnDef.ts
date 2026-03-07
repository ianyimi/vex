import type { ColumnDef } from "@tanstack/react-table";
import type { SelectFieldMeta } from "../../types";
import { toTitleCase } from "../../utils";

/**
 * Builds a ColumnDef for a select field.
 *
 * @param props.fieldKey - The field name (used as accessorKey)
 * @param props.meta - The select field metadata (includes options for label lookup)
 * @returns A ColumnDef for the select field
 *
 * Behavior:
 * - accessorKey: props.fieldKey
 * - header: props.meta.label ?? toTitleCase(props.fieldKey)
 * - cell: look up the option label from props.meta.options for the current value.
 *   If the value doesn't match any option, display the raw value.
 */
export function selectColumnDef(props: {
  fieldKey: string;
  meta: SelectFieldMeta;
}): ColumnDef<Record<string, unknown>> {
  return {
    accessorKey: props.fieldKey,
    header: props.meta.label ?? toTitleCase(props.fieldKey),
  };
}
