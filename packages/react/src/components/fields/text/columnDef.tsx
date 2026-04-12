import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, TDocument, TextField } from "@vexcms/core";
import { TextFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a text field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered TextFieldCell component for rendering.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved text field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @param props.collection - Parent collection config, forwarded to `TextFieldCell` to build the edit link `href`
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = textFieldToColumnDef({
 *   fieldDef: collection.fields.title,
 *   fieldKey: "title",
 *   isTitleField: true,
 * });
 * ```
 */
export function textFieldToColumnDef(props: {
  fieldDef: TextField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TDocument, string> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | undefined;
      return (
        <TextFieldCell
          value={value ?? ""}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
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
