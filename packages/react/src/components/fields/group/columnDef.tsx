import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, GroupField, TDocument } from "@vexcms/core";
import { GroupFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a group field.
 *
 * Sorting is disabled — group fields store objects, which are not meaningfully
 * sortable by Convex indexes in the current implementation.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved group field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the collection's `useAsTitle` field.
 * @param props.collection - Parent collection config.
 * @returns TanStack Table column definition.
 */
export function groupFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: GroupField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as Record<string, unknown>;
      return (
        <GroupFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Group fields are not meaningfully sortable by index
    enableSorting: false,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
