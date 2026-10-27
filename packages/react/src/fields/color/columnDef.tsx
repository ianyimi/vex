import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, ColorField, TDocument } from "@vexcms/core";
import { ColorFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a colour field.
 *
 * Generates column config with proper typing, cell renderer, alignment, and
 * metadata. Uses `ColorFieldCell` for rendering — a swatch plus the stored
 * value.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved colour field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @param props.collection - Parent collection config, forwarded to `ColorFieldCell`.
 * @returns TanStack Table column definition typed to `ColumnDef<TDocument, string>`.
 *
 * @example
 * ```ts
 * const column = colorFieldToColumnDef({
 *   fieldDef: collection.fields.primaryLight,
 *   fieldKey: "primaryLight",
 *   isTitleField: false,
 *   collection,
 * });
 * ```
 */
export function colorFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: ColorField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | undefined;
      return (
        <ColorFieldCell
          value={value ?? ""}
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