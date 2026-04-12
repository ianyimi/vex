import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, VexDocument } from "@vexcms/core";
import type { DateField } from "@vexcms/core";
import { DateFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a date field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses {@link DateFieldCell} to render Unix ms timestamps as locale date strings.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved date field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @param props.collection - Parent collection config, forwarded to the cell component for title-field link building
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = dateFieldToColumnDef({
 *   fieldDef: collection.fields.publishedAt,
 *   fieldKey: "publishedAt",
 *   isTitleField: false,
 * });
 * ```
 */
export function dateFieldToColumnDef(props: {
  fieldDef: DateField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<VexDocument, number> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as number;
      return (
        <DateFieldCell
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Enable sorting for all date fields
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
