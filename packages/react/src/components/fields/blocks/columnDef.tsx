import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, BlocksField, TDocument } from "@vexcms/core";
import { BlocksFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a blocks field.
 *
 * Sorting is disabled — blocks fields store heterogeneous arrays which are
 * not meaningfully sortable by Convex indexes.
 */
export function blocksFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: BlocksField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => (
      <BlocksFieldCell<TData>
        value={row.getValue(props.fieldKey)}
        row={row}
        collection={props.collection}
        fieldDef={props.fieldDef}
        fieldKey={props.fieldKey}
        isTitleField={props.isTitleField ?? false}
      />
    ),

    enableSorting: false,
    enableHiding: true,
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
