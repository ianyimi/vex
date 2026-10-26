import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, MediaCollectionConfig, TDocument, UploadField } from "@vexcms/core";
import { UploadFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for an upload field.
 *
 * The column value accessor reads `string[] | undefined` from the document —
 * upload fields always store an array of media document IDs regardless of
 * `hasMany`. Rendering is delegated to `UploadFieldCell`.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - The resolved upload field definition.
 * @param props.fieldKey - The field key from `collection.fields` (e.g. `"featuredImage"`).
 * @param props.collection - The parent collection config.
 * @param props.isTitleField - Whether this field is the collection's `useAsTitle` field.
 * @returns A TanStack Table `ColumnDef` with sorting disabled and hiding enabled.
 *
 * @example
 * ```ts
 * const col = uploadFieldToColumnDef({
 *   fieldDef: featuredImageField,
 *   fieldKey: "featuredImage",
 *   collection: pagesCollection,
 *   isTitleField: false,
 * });
 * ```
 */
export function uploadFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: UploadField;
  fieldKey: string;
  collection: CollectionConfig | MediaCollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string[] | undefined;
      return (
        <UploadFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection as MediaCollectionConfig}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },
    enableSorting: false, // Can't sort by file references
    enableHiding: true,
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
