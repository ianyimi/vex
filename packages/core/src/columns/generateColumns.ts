import type { ColumnDef } from "@tanstack/react-table";
import type { VexCollection, VexField, BaseFieldMeta } from "../types";
import { textColumnDef } from "../fields/text/columnDef";
import { numberColumnDef } from "../fields/number/columnDef";
import { checkboxColumnDef } from "../fields/checkbox/columnDef";
import { selectColumnDef } from "../fields/select/columnDef";
import { toTitleCase } from "../utils";

/**
 * Generates an array of ColumnDef objects from a VexCollection's field configs.
 *
 * @param collection - The collection to generate columns for
 * @returns Array of ColumnDef objects for use with @tanstack/react-table
 *
 * Behavior:
 * 1. Always include an `_id` column first (accessorKey: "_id", header: "ID")
 * 2. If `admin.defaultColumns` is set, only include those fields (in order) + _id
 * 3. If `admin.defaultColumns` is not set, include all fields
 * 4. Skip fields where `admin.hidden` is true
 * 5. Dispatch to the correct per-field-type column builder based on field._meta.type
 * 6. For unknown field types: produce a fallback column that renders
 *    `String(value)` truncated to 50 characters (do not crash)
 * 7. If `admin.useAsTitle` is set, mark that column with meta.isTitle = true
 *    (the DataTable component uses this to render the cell as a link)
 *
 * Edge cases:
 * - Unknown field type: produce fallback column with String(value) truncated to 50 chars
 * - Empty fields object: return only the _id column
 * - defaultColumns references a non-existent field: produce fallback column
 * - defaultColumns references a hidden field: skip it
 */
export function generateColumns<
  TFields extends Record<string, VexField<any, any>>,
>(
  collection: VexCollection<TFields>,
): ColumnDef<Record<string, unknown>>[] {
  const columns: ColumnDef<Record<string, unknown>>[] = [];
  const useAsTitle = collection.config.admin?.useAsTitle as string | undefined;
  const defaultColumns = collection.config.admin?.defaultColumns as
    | string[]
    | undefined;
  const fields = collection.config.fields;

  columns.push({ accessorKey: "_id", header: "ID" });

  const fieldKeys = defaultColumns ?? Object.keys(fields);

  for (const fieldKey of fieldKeys) {
    const field = fields[fieldKey];

    // Auth-only field (e.g. "email") — not in collection fields but valid
    // from the auth adapter. Produce a fallback text column.
    if (!field) {
      columns.push({ accessorKey: fieldKey, header: toTitleCase(fieldKey) });
      continue;
    }

    const meta = field._meta as BaseFieldMeta;
    if (meta.admin?.hidden) continue;

    let col: ColumnDef<Record<string, unknown>>;

    switch (meta.type) {
      case "text":
        col = textColumnDef({ fieldKey, meta: field._meta as any });
        break;
      case "number":
        col = numberColumnDef({ fieldKey, meta: field._meta as any });
        break;
      case "checkbox":
        col = checkboxColumnDef({ fieldKey, meta: field._meta as any });
        break;
      case "select":
        col = selectColumnDef({ fieldKey, meta: field._meta as any });
        break;
      default:
        col = {
          accessorKey: fieldKey,
          header: toTitleCase(fieldKey),
        };
        break;
    }

    if (useAsTitle && fieldKey === useAsTitle) {
      col.meta = { ...col.meta, isTitle: true };
    }

    columns.push(col);
  }

  return columns;
}
