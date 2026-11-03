import type { ColumnDef } from "@tanstack/react-table";
import type {
  CollectionConfig,
  RichTextDocument,
  RichTextField,
  TDocument,
} from "@vexcms/core";
import { RichTextFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a richtext field.
 *
 * Generates column config with proper typing, cell renderer, alignment, and
 * metadata. Uses `RichTextFieldCell` for rendering — a plain-text excerpt.
 * Sorting is disabled: a `RichTextDocument` has no meaningful lexicographic
 * order as stored (an array of nodes, not a string).
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved richtext field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @param props.collection - Parent collection config, forwarded to `RichTextFieldCell`.
 * @returns TanStack Table column definition typed to `ColumnDef<TDocument, RichTextDocument>`.
 *
 * @example
 * ```ts
 * const column = richTextFieldToColumnDef({
 *   fieldDef: collection.fields.body,
 *   fieldKey: "body",
 *   isTitleField: false,
 *   collection,
 * });
 * ```
 */
export function richTextFieldToColumnDef<
  TData extends TDocument = TDocument,
>(props: {
  fieldDef: RichTextField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, RichTextDocument> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as
        RichTextDocument | undefined;
      return (
        <RichTextFieldCell
          value={value ?? []}
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
