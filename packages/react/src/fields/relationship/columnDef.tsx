import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, RelationshipField, TDocument } from "@vexcms/core";
import { RelationshipFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a relationship field.
 *
 * The column value accessor reads `string[] | undefined` from the document —
 * relationship fields always store an array of Convex IDs regardless of
 * `hasMany`. Rendering is delegated to `RelationshipFieldCell`.
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
}): ColumnDef<TData, string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string[] | undefined;
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
