import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, TDocument, UrlField } from "@vexcms/core";
import { UrlFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a URL field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses `UrlFieldCell` for rendering — the cell renders the
 * URL as a clickable link, or as an edit-page link when `isTitleField` is true.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved URL field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @param props.collection - Parent collection config, forwarded to `UrlFieldCell` to build the edit link `href`.
 * @returns TanStack Table column definition typed to `ColumnDef<TDocument, string>`.
 *
 * @example
 * ```ts
 * const column = urlFieldToColumnDef({
 *   fieldDef: collection.fields.website,
 *   fieldKey: "website",
 *   isTitleField: false,
 *   collection,
 * });
 * ```
 */
export function urlFieldToColumnDef(props: {
  fieldDef: UrlField;
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
        <UrlFieldCell
          value={value ?? ""}
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
