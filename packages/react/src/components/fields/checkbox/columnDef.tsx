import type { ColumnDef } from "@tanstack/react-table";
import { ADMIN_FIELDS, CollectionConfig, type CheckboxField, type TDocument } from "@vexcms/core";
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
 * @param props.collection - Collection configuration for the field's collection.
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
export function checkboxFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: CheckboxField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, boolean> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as boolean | undefined;
      return (
        <CheckboxFieldCell<TData>
          value={value ?? ADMIN_FIELDS.checkbox.defaultValue}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
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
