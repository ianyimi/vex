import type { ColumnDef } from "@tanstack/react-table";
import type {
  CollectionConfig,
  TDocument,
  ArrayField,
  ArrayType,
} from "@vexcms/core";
import { ArrayFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for an array field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered `ArrayFieldCell` component for rendering.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved array field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @param props.collection - Parent collection config, forwarded to `ArrayFieldCell`
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = arrayFieldToColumnDef({
 *   fieldDef: collection.fields.tags,
 *   fieldKey: "tags",
 *   isTitleField: false,
 *   collection,
 * });
 * ```
 */
export function arrayFieldToColumnDef<
  TArrayType extends ArrayType = ArrayType,
>(props: {
  fieldDef: ArrayField<TArrayType>;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TDocument, TArrayType[]> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as ArrayType[] | undefined;
      return (
        <ArrayFieldCell
          value={value ?? []}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Enable sorting for all text fields
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
