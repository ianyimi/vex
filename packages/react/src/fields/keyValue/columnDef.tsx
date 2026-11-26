"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, KeyValueField, TDocument } from "@vexcms/core";
import { KeyValueFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a keyValue field.
 *
 * Sorting is disabled — keyValue fields store records, not meaningfully
 * sortable by Convex indexes.
 *
 * @param props - Column generation props.
 * @returns TanStack Table column definition.
 */
export function keyValueFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: KeyValueField;
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
        <KeyValueFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    enableSorting: false,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
