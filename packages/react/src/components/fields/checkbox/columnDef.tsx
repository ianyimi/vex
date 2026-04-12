import type { ColumnDef } from "@tanstack/react-table";
import { ADMIN_FIELDS, type VexDocument } from "@vexcms/core";
import type { CheckboxField } from "@vexcms/core";
import { CheckboxFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a checkbox field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses {@link CheckboxFieldCell} for rendering.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved checkbox field definition
 * @param props.fieldKey - Field key from `collection.fields`
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`)
 * @returns TanStack Table column definition typed to `boolean`
 *
 * @example
 * ```ts
 * const column = checkboxFieldToColumnDef({
 *   fieldDef: collection.fields.published,
 *   fieldKey: "published",
 *   isTitleField: false,
 * });
 * ```
 */
export function checkboxFieldToColumnDef(props: {
  fieldDef: CheckboxField;
  fieldKey: string;
  isTitleField?: boolean;
}): ColumnDef<VexDocument, boolean> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as boolean | undefined;
      return (
        <CheckboxFieldCell
          value={value ?? ADMIN_FIELDS.checkbox.defaultValue}
          row={row.original}
          fieldDef={props.fieldDef}
        />
      );
    },

    enableSorting: true,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
