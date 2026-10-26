import type { ComponentType } from "react";
import { NumberField } from "./number";
import { TextField } from "./text";
import { EmailField } from "./email";
import { TextareaField } from "./textarea";
import { JsonField } from "./json";
import { CheckboxField } from "./checkbox";
import { DateField } from "./date";
import { TDocument } from "../documents/types";
import { CollectionConfig } from "../collections";
import { SelectField } from "./select";
import { UrlField } from "./url";
import { ColorField } from "./color";
import { RelationshipField } from "./relationship";
import { ArrayField, ArrayType } from "./array";
import { GroupField } from "./group";
import { RichTextField } from "./richtext";
import { BlocksField } from "./blocks";
import { UploadField } from "./upload";
import { GlobalConfig } from "../globals";
import type { VexResourceSlug } from "../types/generated";
import { VexVersionStatus } from "../versions";
import { TabsField } from "./tabs";
import { CollapsibleField } from "./collapsible";
import { RowField } from "./row";
import { UIField } from "./ui";
import { ADMIN_FIELDS } from "./constants";

export * from "./text/types";
export * from "./email/types";
export * from "./textarea/types";
export * from "./json/types";
export * from "./number/types";
export * from "./checkbox/types";
export * from "./blocks/types";
export * from "./tabs/types";
export * from "./collapsible/types";
export * from "./row/types";
export * from "./ui/types";
export * from "./conditions";

/**
 * BaseFieldMeta - empty object
 */
export type BaseFieldMeta = {};

/**
 * CollectionFieldMeta - default metadata
 * added to all fields via defineCollection, defineMediaCollection, etc
 */
export type CollectionFieldMeta = BaseFieldMeta & {
  collectionSlug: string;
};

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
 * - `ColorField` — CSS colour string, or a `var(--token)` reference when `themeColors` is on
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
export type AdminField<TFieldMeta extends BaseFieldMeta = BaseFieldMeta> =
  | TextField<VexResourceSlug, TFieldMeta>
  | EmailField<VexResourceSlug, TFieldMeta>
  | TextareaField<VexResourceSlug, TFieldMeta>
  | NumberField<VexResourceSlug, TFieldMeta>
  | CheckboxField<VexResourceSlug, TFieldMeta>
  | DateField<VexResourceSlug, TFieldMeta>
  | SelectField<VexResourceSlug, TFieldMeta>
  | UrlField<VexResourceSlug, TFieldMeta>
  | ColorField<VexResourceSlug, TFieldMeta>
  | ArrayField<VexResourceSlug, ArrayType, TFieldMeta>
  | RelationshipField<VexResourceSlug, TFieldMeta>
  | UploadField<VexResourceSlug, TFieldMeta>
  | BlocksField<VexResourceSlug, TFieldMeta>
  | GroupField<VexResourceSlug, TFieldMeta>
  | RichTextField<VexResourceSlug, TFieldMeta>
  | JsonField<VexResourceSlug, TFieldMeta>
  | TabsField<VexResourceSlug, TFieldMeta>
  | CollapsibleField<VexResourceSlug, TFieldMeta>
  | RowField<VexResourceSlug, TFieldMeta>
  | UIField<VexResourceSlug, TFieldMeta>;

/**
 * Every `AdminFieldType` registered with `kind: "data"` in `ADMIN_FIELDS` —
 * computed from `ADMIN_FIELDS`, never hand-listed, so it cannot drift.
 */
export type DataFieldType = {
  [K in keyof typeof ADMIN_FIELDS]: (typeof ADMIN_FIELDS)[K]["kind"] extends "data"
    ? (typeof ADMIN_FIELDS)[K]["type"]
    : never;
}[keyof typeof ADMIN_FIELDS];

/** Every `AdminFieldType` registered with `kind: "ui"` in `ADMIN_FIELDS`. */
export type UIFieldType = {
  [K in keyof typeof ADMIN_FIELDS]: (typeof ADMIN_FIELDS)[K]["kind"] extends "ui"
    ? (typeof ADMIN_FIELDS)[K]["type"]
    : never;
}[keyof typeof ADMIN_FIELDS];

/** The data-field half of {@link AdminField} — what `getDataFields` returns. */
export type AdminDataField<TFieldMeta extends BaseFieldMeta = BaseFieldMeta> = Extract<
  AdminField<TFieldMeta>,
  { type: DataFieldType }
>;

/** The UI-field half of {@link AdminField} — `tabs`/`collapsible`/`row`/`ui`. */
export type AdminUIField = Extract<AdminField, { type: UIFieldType }>;

/**
 * Props passed to an `admin.components.Input` override's replacement control —
 * the raw control only, after the app form's `FormFieldLayout` has already
 * resolved the label/description/error layout around it (decision 5). Narrower
 * than {@link FieldComponentProps}: an Input override never needs `fieldDef`,
 * `collection` or `documentStatus` — it receives exactly what a
 * `@vexcms/react/form` field component's `renderControl` prop hands its
 * control.
 *
 * @see {@link FieldComponentProps} for the whole-field override's props
 */
export interface FieldControlProps<TValue = unknown> {
  /** The control's DOM id — matches the layout's `<label htmlFor>`. */
  id: string;
  /** The control's current value. */
  value: TValue;
  /** Commits a new value to the form field. */
  onChange: (value: TValue) => void;
  /** Marks the form field as touched — wire to the control's native `onBlur`. */
  onBlur: () => void;
  /** Whether the control is non-editable. */
  readOnly: boolean;
  /** Whether the field is currently showing a validation error — sets `aria-invalid`. */
  invalid: boolean;
  /** The control's `aria-describedby` value — the admin app form's `FormFieldLayout`/`fieldDescribedBy`-equivalent description/error ids for this control's `id`; `undefined` when neither applies. */
  describedBy: string | undefined;
}

/**
 * Props passed to an `admin.components.Field` override's replacement — the
 * same props the admin field's own `Field.tsx` receives (decision 5), plus
 * `renderDefault` to fall back to the previous stage in the override chain
 * (built-in → root per-type → this field instance), same composition as
 * `admin.components.Input`.
 *
 * @typeParam TField - Narrows `fieldDef` to a specific field type.
 */
export interface FieldComponentProps<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TField extends AdminField<TFieldMeta> = AdminField<TFieldMeta>,
> {
  /** The field key name from the collection config, e.g. `"title"`. Used as the form field name. */
  name: string;
  /** The resolved field definition — narrows to the specific field type via `TField`. */
  fieldDef: TField;
  /** Whether the field is non-editable — derived from `fieldDef.admin.readOnly` or permission checks. */
  readOnly: boolean;
  index?: number;
  /** The config for the collection this field is attached to. */
  collection: CollectionConfig | GlobalConfig;
  /** Necessary for Edit Views. What is the status of this document, 'draft' or 'published'? */
  documentStatus?: VexVersionStatus;
  /** Renders the previous stage of the `Field` override chain. */
  renderDefault?: ComponentType<FieldComponentProps<TFieldMeta, TField>>;
}

/**
 * The table row handed to a cell component — the minimum every framework's
 * data table can supply. React Table's `Row` satisfies it.
 */
export interface CellRow<TData extends TDocument = TDocument> {
  /** The full document this row renders. */
  original: TData;
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
 * @see {@link FieldComponentProps} for the edit form equivalent
 * @see {@link FieldComponentMap} for how components are registered
 */
export interface CellComponentProps<
  TField extends AdminDataField = AdminDataField,
  TData extends TDocument = TDocument,
  TCollectionConfig extends CollectionConfig = CollectionConfig,
> {
  /** The raw field value from the document — typed to the field's value type. */
  value: TField["defaultValue"];
  /** The full document row, for cases where the cell needs to read other fields. */
  row: CellRow<TData>;
  /** The resolved field definition — narrows to the specific field type via `TField`. */
  fieldDef: TField;
  /** The resolved field key on the collection for this column. */
  fieldKey: string;
  /** Whether this cell is the field designated as `useAsTitle` — used to render a clickable edit link. */
  isTitleField: boolean;
  /** The parent collection config — used by title cells to build the edit link `href`. */
  collection: TCollectionConfig;
}
