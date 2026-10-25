import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, TDocument, EmailField } from "@vexcms/core";
import { EmailFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for an email field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered `EmailFieldCell` component for rendering.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved email field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @param props.collection - Parent collection config, forwarded to `EmailFieldCell` to build the edit link `href`.
 * @returns TanStack Table column definition.
 *
 * @example
 * ```ts
 * const column = emailFieldToColumnDef({
 *   fieldDef: collection.fields.contactEmail,
 *   fieldKey: "contactEmail",
 *   isTitleField: false,
 * });
 * ```
 */
export function emailFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: EmailField;
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
        <EmailFieldCell<TData>
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
