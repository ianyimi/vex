"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, BytesField, TDocument } from "@vexcms/core";
import { BytesFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a bytes field.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved bytes field definition.
 * @param props.fieldKey - Field key from collection.fields.
 * @param props.isTitleField - Whether this is the title field (useAsTitle).
 * @param props.collection - Parent collection config, forwarded to `BytesFieldCell` to build the edit link `href`.
 * @returns TanStack Table column definition.
 *
 * @example
 * ```ts
 * const column = bytesFieldToColumnDef({
 *   fieldDef: collection.fields.payload,
 *   fieldKey: "payload",
 *   isTitleField: false,
 * });
 * ```
 */
export function bytesFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: BytesField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
  type?: TData;
}): ColumnDef<TData, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as ArrayBuffer | undefined;
      return (
        <BytesFieldCell<TData>
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
