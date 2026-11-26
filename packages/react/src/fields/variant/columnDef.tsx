"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, VariantField, TDocument } from "@vexcms/core";
import { VariantFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a variant field.
 *
 * Sorting is disabled — a variant's stored shape differs per branch, so
 * there is no single Convex index ordering to sort by.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved variant field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.collection - Collection configuration for the field's collection.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @returns TanStack Table column definition.
 */
export function variantFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: VariantField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => (
      <VariantFieldCell<TData>
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
