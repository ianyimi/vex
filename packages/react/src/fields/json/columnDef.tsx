import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, JsonField, TDocument } from "@vexcms/core";
import { JsonFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a json field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered `JsonFieldCell` component for rendering.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved json field definition.
 * @param props.fieldKey - Field key from collection.fields.
 * @param props.isTitleField - Whether this is the title field (useAsTitle).
 * @param props.collection - Parent collection config, forwarded to `JsonFieldCell` to build the edit link `href`.
 * @returns TanStack Table column definition.
 *
 * @example
 * ```ts
 * const column = jsonFieldToColumnDef({
 *   fieldDef: collection.fields.settings,
 *   fieldKey: "settings",
 *   isTitleField: false,
 * });
 * ```
 */
export function jsonFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: JsonField;
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
      const value = row.getValue(props.fieldKey);
      return (
        <JsonFieldCell<TData>
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
