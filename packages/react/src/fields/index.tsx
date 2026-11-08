"use client";

import type { ComponentType } from "react";
import {
  CollectionConfig,
  TDocument,
  getUIFieldsWithCell,
  resolveListViewColumnConfig,
  type ColumnEntry,
} from "@vexcms/core";
import { textFieldToColumnDef } from "./text";
import { emailFieldToColumnDef } from "./email";
import { textareaFieldToColumnDef } from "./textarea";
import { numberFieldToColumnDef } from "./number";
import { checkboxFieldToColumnDef } from "./checkbox";
import { dateFieldToColumnDef } from "./date";
import { commitTsFieldToColumnDef } from "./commitTs";
import { ADMIN_FIELDS, getDataFields, type AdminFieldType } from "@vexcms/core";
import { ColumnDef } from "@tanstack/react-table";
import { selectFieldToColumnDef } from "./select";
import { urlFieldToColumnDef } from "./url";
import { colorFieldToColumnDef } from "./color";
import { relationshipFieldToColumnDef } from "./relationship";
import { arrayFieldToColumnDef } from "./array";
import { groupFieldToColumnDef } from "./group";
import { blocksFieldToColumnDef } from "./blocks";
import { uploadFieldToColumnDef } from "./upload";
import { richTextFieldToColumnDef } from "./richtext";
import { jsonFieldToColumnDef } from "./json";

export * from "./text";
export * from "./email";
export * from "./textarea";
export * from "./number";
export * from "./checkbox";
export * from "./date";
export * from "./commitTs";
export * from "./select";
export * from "./url";
export * from "./color";
export * from "./upload";
export * from "./array";
export * from "./relationship";
export * from "./group";
export * from "./blocks";
export * from "./richtext";
export * from "./json";

import { fieldToFieldComponent, fieldToCellComponent, fieldToDisplayComponent, fieldToFilterInputComponent } from "./registry";
export { fieldToFieldComponent, fieldToCellComponent, fieldToDisplayComponent, fieldToFilterInputComponent };

/**
 * Builds TanStack Table column definitions for every field in a collection.
 *
 * Iterates the collection's `fields` map and delegates to the appropriate
 * `*FieldToColumnDef` helper based on `fieldDef.type`. Fields with an
 * unrecognised type are skipped. The resulting array is ready to pass
 * directly to `useReactTable({ columns })`.
 *
 * @param props - Input props.
 * @param props.collection - The collection whose fields drive the column shape.
 * @param props.columns - The active view's own resolved `columns` array —
 *   when provided, each field's `enableSorting`/
 *   `enableHiding`/pixel width comes from `resolveListViewColumnConfig`'s
 *   per-field resolution (the view's own column entry `?? field.admin.<attr>
 *   ?? a global default` — `FIELD_TYPE_DEFAULT_WIDTH[type]` for width)
 *   instead of `field.admin.<attr>` directly, so a view's entry can
 *   override any of the three for that field alone (views always win).
 *   Omitted (or a field absent from it) falls back to
 *   `field.admin.<attr>` / the type default exactly like before.
 * @returns An array of TanStack Table `ColumnDef` objects, one per field.
 *
 * @example
 * ```ts
 * const columns = getCollectionColumnDefs({ collection: postsCollection });
 * const table = useReactTable({ data: documents, columns, getCoreRowModel: getCoreRowModel() });
 * ```
 */
export function getCollectionColumnDefs<
  TData extends TDocument = TDocument,
  TCollectionConfig extends CollectionConfig = CollectionConfig,
>(props: {
  collection: TCollectionConfig;
  columns?: ColumnEntry<string>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): ColumnDef<TData, any>[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnDefs: ColumnDef<TData, any>[] = [];
  const { collection } = props;
  const resolvedEntryByField = new Map<string, ColumnEntry<string>>();
  for (const entry of props.columns ?? []) {
    resolvedEntryByField.set(typeof entry === "string" ? entry : entry.field, entry);
  }
  for (const [fieldKey, fieldDef] of Object.entries(getDataFields({ fields: collection.fields }))) {
    if (fieldDef.admin.hidden) continue;
    const isTitleField = fieldKey === collection.admin.useAsTitle;
    const fieldType: AdminFieldType = fieldDef.type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let columnDef: ColumnDef<TData, any> | undefined;
    switch (fieldDef.type) {
      case ADMIN_FIELDS.text.type:
        columnDef = textFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.email.type:
        columnDef = emailFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.textarea.type:
        columnDef = textareaFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.number.type:
        columnDef = numberFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.checkbox.type:
        columnDef = checkboxFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.date.type:
        columnDef = dateFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.commitTs.type:
        columnDef = commitTsFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.select.type:
        columnDef = selectFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.url.type:
        columnDef = urlFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.color.type:
        columnDef = colorFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.relationship.type:
        columnDef = relationshipFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.array.type:
        columnDef = arrayFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.group.type:
        columnDef = groupFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.blocks.type:
        columnDef = blocksFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.upload.type:
        columnDef = uploadFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.richtext.type:
        columnDef = richTextFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.json.type:
        columnDef = jsonFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      default: {
        const unhandled: never = fieldDef;
        throw new Error(
          `unsupported column def field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
        );
      }
    }
    // The one place `enableSorting`/`enableHiding`/`size` (pixel width) are
    // made to agree with the active view's OWN resolved per-field config —
    // every `*FieldToColumnDef` factory
    // above still returns its own static `enableSorting`/`enableHiding`
    // (now ignored, overwritten here) and never sets `size` at all, so
    // none of them need editing. `resolveListViewColumnConfig` is the ONE place
    // that resolves the view's own column entry (when `props.columns`
    // carries one for this field) against `fieldDef.admin` — views always
    // win. `size` feeds TanStack's own `column.getSize()`
    // directly (`DataTable.tsx` renders every cell's width from THAT, not
    // a separate `meta.width` — resizing/pinning both need TanStack's own
    // sizing/pinning state to be the single source of truth).
    const resolvedConfig = resolveListViewColumnConfig({
      fieldKey,
      fieldDef,
      resolvedColumnEntry: resolvedEntryByField.get(fieldKey),
    });
    columnDefs.push({
      ...columnDef,
      enableSorting: resolvedConfig.enableSorting,
      enableHiding: resolvedConfig.enableHiding,
      size: resolvedConfig.width,
    });
  }

  // `ui()` fields are never in `getDataFields`'s output (it drops them — see
  // its own doc comment) because they carry no stored value to validate/
  // index/type-gen; the list view still wants a column for one when its
  // `admin.components.Cell` is set (per `UIFieldCellProps`'s own contract:
  // "the list view shows a column rendering this"), so this is a second,
  // parallel pass over `collection.fields` via `getUIFieldsWithCell` instead
  // of folding into the loop above.
  for (const [fieldKey, uiField] of Object.entries(getUIFieldsWithCell({ fields: collection.fields }))) {
    if (uiField.admin.hidden) continue;
    if (!uiField.admin.components.Cell) continue;
    // Same erased-type cast `FormUI.tsx` uses for `Field` — the HKT-applied
    // `Cell` type has no concrete call signature until a framework adapter
    // resolves it, but at this point it already has (this is the React
    // adapter's own `getCollectionColumnDefs`).
    const Cell = uiField.admin.components.Cell as ComponentType<{
      name: string;
      data: Record<string, unknown>;
    }>;
    columnDefs.push({
      id: fieldKey,
      // `accessorKey` (not just `id`) so `columnFieldKey` (CollectionListView.tsx /
      // MediaCollectionListView.tsx) resolves a real field key for this column —
      // previously `undefined`, which made the readability filter's
      // `key === undefined` short-circuit let every UI field through regardless of
      // field permissions (access-system-fields plan, part 2a: an ungranted UI
      // field must render no column, same as a denied data field).
      accessorKey: fieldKey,
      header: uiField.label || fieldKey,
      cell: ({ row }) => <Cell name={fieldKey} data={row.original as Record<string, unknown>} />,
      enableSorting: false,
      enableHiding: true,
    });
  }
  return columnDefs;
}
