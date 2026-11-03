import type { ColumnDef } from "@tanstack/react-table";
import { ADMIN_FIELDS, CollectionConfig, type NumberField, type TDocument } from "@vexcms/core";
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
 * @param props.collection - Parent collection config, forwarded to the cell component
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
export function numberFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: NumberField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, number> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as number | undefined;
      return (
        <NumberFieldCell<TData>
          value={value ?? ADMIN_FIELDS.number.defaultValue}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
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
