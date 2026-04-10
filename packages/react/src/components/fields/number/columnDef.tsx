import type { ColumnDef } from "@tanstack/react-table";
import { ADMIN_FIELDS, type VexDocument } from "@vexcms/core";
import type { NumberField } from "@vexcms/core";
import { NumberFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a number field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered NumberFieldCell component for rendering.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved number field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = numberFieldToColumnDef({
 *   fieldDef: collection.fields.price,
 *   fieldKey: "price",
 *   isTitleField: false,
 * });
 * ```
 */
export function numberFieldToColumnDef(props: {
  fieldDef: NumberField;
  fieldKey: string;
  isTitleField?: boolean;
}): ColumnDef<VexDocument, number> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as number | undefined;
      return (
        <NumberFieldCell
          value={value ?? ADMIN_FIELDS.number.defaultValue}
          row={row.original}
          fieldDef={props.fieldDef}
        />
      );
    },

    // Enable sorting for all number fields
    enableSorting: true,

    // Enable hiding for all fields (user can toggle visibility)
    enableHiding: true,

    // Use field's cellAlignment config
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
