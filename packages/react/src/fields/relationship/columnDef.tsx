"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, RelationshipField, TDocument } from "@vexcms/core";
import { RelationshipFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a relationship field.
 *
 * The column value accessor reads `string | string[] | undefined` from the
 * document — array storage (no `schema` override) is always `string[]`;
 * `schema.validator` scalar storage is a bare `string`. Rendering is
 * delegated to `RelationshipFieldCell`, which normalizes either shape.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - The resolved relationship field definition.
 * @param props.fieldKey - The field key from `collection.fields` (e.g. `"author"`).
 * @param props.collection - The parent collection config.
 * @param props.isTitleField - Whether this field is the collection's `useAsTitle` field.
 * @returns A TanStack Table `ColumnDef` with sorting disabled and hiding enabled.
 *
 * @example
 * ```ts
 * const col = relationshipFieldToColumnDef({
 *   fieldDef: authorField,
 *   fieldKey: "author",
 *   collection: postsCollection,
 *   isTitleField: false,
 * });
 */
export function relationshipFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: RelationshipField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string | string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | string[] | undefined;
      return (
        <RelationshipFieldCell<TData>
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
