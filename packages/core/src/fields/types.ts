import { NumberField } from "./number";
import { TextField } from "./text";
import { CheckboxField } from "./checkbox";
import { DateField } from "./date";
import { TDocument } from "../convex";
import { CollectionConfig } from "../collections";
import { Row } from "@tanstack/react-table";
import { SelectField } from "./select";
import { UrlField } from "./url";
import { RelationshipField } from "./relationship";
import { ArrayField, ArrayType } from "./array";

export * from "./text/types";
export * from "./number/types";
export * from "./checkbox/types";

/**
 * Discriminated union of all field types in VexCMS.
 *
 * Switch on `field.type` to narrow to a specific field type and access
 * its type-specific properties.
 *
 * Currently includes:
 * - `TextField` — single-line text input
 * - `NumberField` — numeric value (price, quantity, rating, etc.)
 * - `CheckboxField` — boolean toggle (published state, feature flag, opt-in, etc.)
 * - `DateField` — Unix ms timestamp (publish date, expiry date, event time, etc.)
 * - `SelectField` — single-choice from a predefined set of options
 * - `UrlField` — validated URL string
 * - `RelationshipField` — Convex `Id` reference to a document in another collection
 *
 * @example
 * ```ts
 * function handleField(field: AdminField) {
 *   switch (field.type) {
 *     case "text":
 *       // field is TextField
 *       break;
 *   }
 * }
 * ```
 */
export type AdminField<TFieldMeta extends {} = {}> =
  | TextField<TFieldMeta>
  | NumberField<TFieldMeta>
  | CheckboxField<TFieldMeta>
  | DateField<TFieldMeta>
  | SelectField<TFieldMeta>
  | UrlField<TFieldMeta>
  | ArrayField<ArrayType, TFieldMeta>
  | RelationshipField<TFieldMeta>;

/**
 * Props passed to field input components rendered in the document edit form.
 *
 * Every input component registered in a framework adapter's `fields` map must
 * accept these props. The `TField` generic narrows `fieldDef` to the specific
 * field type (e.g. `TextField`) so type-specific properties are accessible
 * with autocomplete.
 *
 * In React, use `createFieldInput<TValue, TField>` to build components that
 * accept these props — it handles TanStack Form wiring automatically.
 *
 * @example
 * ```tsx
 * // React — using createFieldInput
 * export const TextFieldInput = createFieldInput<string, TextField>(
 *   ({ name, fieldDef, readOnly, field }) => (
 *     <input
 *       value={field.state.value ?? ""}
 *       onChange={(e) => field.handleChange(e.target.value)}
 *       readOnly={readOnly}
 *       placeholder={fieldDef.admin.placeholder}
 *     />
 *   ),
 * );
 * ```
 *
 * @see {@link CellComponentProps} for the data table equivalent
 * @see {@link FieldComponentMap} for how components are registered
 */
export interface InputComponentProps<TField extends AdminField = AdminField> {
  /** The field key name from the collection config, e.g. `"title"`. Used as the form field name. */
  name: string;
  /** The resolved field definition — narrows to the specific field type via `TField`. */
  fieldDef: TField;
  /** Whether the field is non-editable — derived from `fieldDef.admin.readOnly` or permission checks. */
  readOnly: boolean;
}

/**
 * Props passed to field cell components rendered in the data table list view.
 *
 * Every cell component registered in a framework adapter's `fields` map must
 * accept these props. The `TField` generic narrows `fieldDef` to the specific
 * field type so type-specific properties are accessible.
 *
 * `value` is typed as `TField["defaultValue"]` which resolves to the field's
 * stored value type (e.g. `string` for `TextField`).
 *
 * @example
 * ```tsx
 * export function TextFieldCell(props: CellComponentProps<TextField>) {
 *   if (!props.value) return <span>—</span>;
 *   return <span>{props.value}</span>;
 * }
 * ```
 *
 * @see {@link InputComponentProps} for the edit form equivalent
 * @see {@link FieldComponentMap} for how components are registered
 */
export interface CellComponentProps<TField extends AdminField = AdminField> {
  /** The raw field value from the document — typed to the field's value type. */
  value: TField["defaultValue"];
  /** The full document row, for cases where the cell needs to read other fields. */
  row: Row<TDocument>;
  /** The resolved field definition — narrows to the specific field type via `TField`. */
  fieldDef: TField;
  /** The resolved field key on the collection for this column. */
  fieldKey: string;
  /** Whether this cell is the field designated as `useAsTitle` — used to render a clickable edit link. */
  isTitleField: boolean;
  /** The parent collection config — used by title cells to build the edit link `href`. */
  collection: CollectionConfig;
}
