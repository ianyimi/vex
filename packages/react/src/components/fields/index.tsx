import {
  InputComponentProps,
  AdminField,
  CollectionConfig,
  CellComponentProps,
  TDocument,
} from "@vexcms/core";
import { ComponentPropsWithRef, ComponentType } from "react";
import { TextFieldCell, TextFieldInput, textFieldToColumnDef } from "./text";
import { NumberFieldCell, NumberFieldInput, numberFieldToColumnDef } from "./number";
import { CheckboxFieldCell, CheckboxFieldInput, checkboxFieldToColumnDef } from "./checkbox";
import { DateFieldCell, DateFieldInput, dateFieldToColumnDef } from "./date";
import { ADMIN_FIELDS, type AdminFieldType } from "@vexcms/core";
import { cn } from "../../styles/utils";
import { ColumnDef } from "@tanstack/react-table";
import { SelectFieldCell, SelectFieldInput, selectFieldToColumnDef } from "./select";
import { UrlFieldCell, UrlFieldInput, urlFieldToColumnDef } from "./url";
import {
  RelationshipFieldCell,
  RelationshipFieldInput,
  relationshipFieldToColumnDef,
} from "./relationship";
import { ArrayFieldCell, ArrayFieldInput, arrayFieldToColumnDef } from "./array";
import { GroupFieldCell, GroupFieldInput, groupFieldToColumnDef } from "./group";
import { BlocksFieldCell, BlocksFieldInput, blocksFieldToColumnDef } from "./blocks";
import { UploadFieldInput, UploadFieldCell } from "./upload";

export * from "./text";
export * from "./number";
export * from "./checkbox";
export * from "./date";
export * from "./select";
export * from "./url";
export * from "./upload";
export * from "./array";
export * from "./relationship";
export * from "./group";
export * from "./blocks";

/**
 * Maps every `AdminFieldType` string to its corresponding input component.
 *
 * Mirrors `reactAdapter.fields` — both must be kept in sync when a new
 * field type is added to `@vexcms/core`.
 */
export const fieldInputComponents: Record<
  AdminFieldType,
  ComponentType<InputComponentProps<AdminField>>
> = {
  [ADMIN_FIELDS.text.type]: TextFieldInput as ComponentType<InputComponentProps<AdminField>>,
  [ADMIN_FIELDS.number.type]: NumberFieldInput as ComponentType<InputComponentProps<AdminField>>,
  [ADMIN_FIELDS.checkbox.type]: CheckboxFieldInput as ComponentType<
    InputComponentProps<AdminField>
  >,
  [ADMIN_FIELDS.date.type]: DateFieldInput as ComponentType<InputComponentProps<AdminField>>,
  [ADMIN_FIELDS.select.type]: SelectFieldInput as ComponentType<InputComponentProps<AdminField>>,
  [ADMIN_FIELDS.url.type]: UrlFieldInput as ComponentType<InputComponentProps<AdminField>>,
  [ADMIN_FIELDS.relationship.type]: RelationshipFieldInput as ComponentType<
    InputComponentProps<AdminField>
  >,
  [ADMIN_FIELDS.array.type]: ArrayFieldInput as ComponentType<InputComponentProps<AdminField>>,
  [ADMIN_FIELDS.group.type]: GroupFieldInput as ComponentType<InputComponentProps<AdminField>>,
  [ADMIN_FIELDS.blocks.type]: BlocksFieldInput as ComponentType<InputComponentProps<AdminField>>,
  [ADMIN_FIELDS.upload.type]: UploadFieldInput as ComponentType<InputComponentProps<AdminField>>,
};

/**
 * Returns the input component registered for a given field type, or
 * `undefined` if none is registered.
 *
 * Used by `CollectionEditView` to render one input per field without
 * importing each component directly.
 *
 * @param field - The `AdminFieldType` string (e.g. `"text"`).
 * @returns The matching `ComponentType`, or `undefined` if the type is unknown.
 */
export function fieldToInputComponent(field: AdminFieldType) {
  return fieldInputComponents[field];
}

/**
 * Renders all field input components for a collection's fields.
 *
 * Iterates `fields`, looks up the matching input component from
 * `fieldInputComponents`, and renders each one. Fields whose type has no
 * registered component are skipped. All remaining `div` props (e.g.
 * `className`) are forwarded to the wrapping `<div>`.
 *
 * Must be rendered inside `<AppForm>` — each input reads the TanStack Form
 * instance from `AppFormContext`.
 *
 * @param props - Component props.
 * @param props.fields - The `fields` object from a `CollectionConfig`.
 * @param props.className - Optional CSS class merged with the base `"relative"` class.
 * @returns A `<div>` containing one input component per field in the collection.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <RenderFieldInputComponents fields={collection.fields} className="flex flex-col gap-4" />
 * </AppForm>
 * ```
 */
export function RenderFieldInputComponents(
  props: { fields: CollectionConfig["fields"] } & ComponentPropsWithRef<"div">,
) {
  const { fields, className, ...divProps } = props;
  return (
    <div className={cn("relative", className)} {...divProps}>
      {Object.entries(fields).map(([fieldKey, field]) => {
        const FieldInput = fieldInputComponents[field.type];
        if (!FieldInput) return null;
        return (
          <FieldInput
            key={fieldKey}
            name={fieldKey}
            fieldDef={field}
            readOnly={field.admin.readOnly}
          />
        );
      })}
    </div>
  );
}

/**
 * Maps every `AdminFieldType` string to its corresponding cell component.
 *
 * Mirrors `reactAdapter.fields` — both must be kept in sync when a new
 * field type is added to `@vexcms/core`.
 */
export const fieldCellComponents: Record<
  AdminFieldType,
  ComponentType<CellComponentProps<AdminField>>
> = {
  [ADMIN_FIELDS.text.type]: TextFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.number.type]: NumberFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.checkbox.type]: CheckboxFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.date.type]: DateFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.select.type]: SelectFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.url.type]: UrlFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.relationship.type]: RelationshipFieldCell as ComponentType<
    CellComponentProps<AdminField>
  >,
  [ADMIN_FIELDS.array.type]: ArrayFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.group.type]: GroupFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.blocks.type]: BlocksFieldCell as ComponentType<CellComponentProps<AdminField>>,
  [ADMIN_FIELDS.upload.type]: UploadFieldCell as ComponentType<CellComponentProps<AdminField>>,
};

/**
 * Returns the cell component registered for a given field type, or
 * `undefined` if none is registered.
 *
 * Used by `CollectionEditView` to render one input per field without
 * importing each component directly.
 *
 * @param field - The `AdminFieldType` string (e.g. `"text"`).
 * @returns The matching `ComponentType`, or `undefined` if the type is unknown.
 */
export function fieldToCellComponent(field: AdminFieldType) {
  return fieldCellComponents[field];
}

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
  for (const [fieldKey, fieldDef] of Object.entries(collection.fields)) {
    const isTitleField = fieldKey === collection.admin.useAsTitle;
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

      default:
        throw new Error("unsupported column def field type");
    }
  }
  return columnDefs;
}
