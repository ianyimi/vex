import type { ComponentType } from "react";
import { CollectionConfig, TDocument, getUIFieldsWithCell } from "@vexcms/core";
import { textFieldToColumnDef } from "./text";
import { emailFieldToColumnDef } from "./email";
import { textareaFieldToColumnDef } from "./textarea";
import { numberFieldToColumnDef } from "./number";
import { checkboxFieldToColumnDef } from "./checkbox";
import { dateFieldToColumnDef } from "./date";
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

import { fieldToInputComponent, fieldToCellComponent } from "./registry";
export { fieldToInputComponent, fieldToCellComponent };

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): ColumnDef<TData, any>[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnDefs: ColumnDef<TData, any>[] = [];
  const { collection } = props;
  for (const [fieldKey, fieldDef] of Object.entries(getDataFields({ fields: collection.fields }))) {
    if (fieldDef.admin.hidden) continue;
    const isTitleField = fieldKey === collection.admin.useAsTitle;
    const fieldType: AdminFieldType = fieldDef.type;
    switch (fieldDef.type) {
      case ADMIN_FIELDS.text.type:
        columnDefs.push(
          textFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.email.type:
        columnDefs.push(
          emailFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.textarea.type:
        columnDefs.push(
          textareaFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.number.type:
        columnDefs.push(
          numberFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.checkbox.type:
        columnDefs.push(
          checkboxFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.date.type:
        columnDefs.push(
          dateFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.select.type:
        columnDefs.push(
          selectFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.url.type:
        columnDefs.push(
          urlFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.color.type:
        columnDefs.push(
          colorFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.relationship.type:
        columnDefs.push(
          relationshipFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.array.type:
        columnDefs.push(
          arrayFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.group.type:
        columnDefs.push(
          groupFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.blocks.type:
        columnDefs.push(
          blocksFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.upload.type:
        columnDefs.push(
          uploadFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.richtext.type:
        columnDefs.push(
          richTextFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      case ADMIN_FIELDS.json.type:
        columnDefs.push(
          jsonFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

      default: {
        const unhandled: never = fieldDef;
        throw new Error(
          `unsupported column def field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
        );
    }
  }
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
      header: uiField.label || fieldKey,
      cell: ({ row }) => <Cell name={fieldKey} data={row.original as Record<string, unknown>} />,
      enableSorting: false,
      enableHiding: true,
    });
  }
  return columnDefs;
}
