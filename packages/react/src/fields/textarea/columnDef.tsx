import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, TDocument, TextareaField } from "@vexcms/core";
import { TextareaFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a textarea field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered TextareaFieldCell component for rendering.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved textarea field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @param props.collection - Parent collection config, forwarded to `TextareaFieldCell` to build the edit link `href`
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = textareaFieldToColumnDef({
 *   fieldDef: collection.fields.bio,
 *   fieldKey: "bio",
 *   isTitleField: false,
 * });
 * ```
 */
export function textareaFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: TextareaField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
  type?: TData;
}): ColumnDef<TData, string> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | undefined;
      return (
        <TextareaFieldCell<TData>
          value={value ?? ""}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Enable sorting for all textarea fields
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
