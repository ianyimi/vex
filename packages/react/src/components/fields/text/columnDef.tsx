import type { ColumnDef } from "@tanstack/react-table";
import type { VexDocument } from "@vexcms/core";
import type { TextField } from "@vexcms/core";
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
  isTitleField?: boolean;
}): ColumnDef<VexDocument, string> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | undefined;
      return (
        <TextFieldCell
          value={value ?? ""}
          row={row.original}
          fieldDef={props.fieldDef}
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
