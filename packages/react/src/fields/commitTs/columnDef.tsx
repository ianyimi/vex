import type { ColumnDef } from "@tanstack/react-table";
import { CollectionConfig, type CommitTsField, type TDocument } from "@vexcms/core";
import { CommitTsFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a `commitTs` field.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved `commitTs` field definition
 * @param props.fieldKey - Field key from `collection.fields`
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`)
 * @param props.collection - Collection configuration for the field's collection.
 * @returns TanStack Table column definition typed to `number` (ms)
 */
export function commitTsFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: CommitTsField;
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
        <CommitTsFieldCell<TData>
          value={value}
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
