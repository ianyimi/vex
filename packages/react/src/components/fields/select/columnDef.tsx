import type { ColumnDef } from "@tanstack/react-table";
import { type CollectionConfig, type SelectField, type TDocument } from "@vexcms/core";
import { SelectFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a select field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered SelectFieldCell component for rendering.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved select field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @param props.collection - Parent collection config, forwarded to the cell component
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = selectFieldToColumnDef({
 *   fieldDef: collection.fields.status,
 *   fieldKey: "status",
 *   isTitleField: false,
 * });
 * ```
 */
export function selectFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: SelectField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string[]> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string[] | undefined;
      return (
        <SelectFieldCell<TData>
          value={value ?? []}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Enable sorting for all select fields
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
