/**
 * Convex schema value type constants for field types.
 *
 * These constants define the base Convex validator strings for each field type.
 * They're used by schema generation logic to build the Convex schema.
 *
 * @internal
 */

/** Convex schema metadata for each supported field type, keyed by field type name. */
export const ADMIN_FIELDS = {
  text: {
    type: "text",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
    kind: "data",
    inputMasks: true,
    hasNullToggle: false,
  },
  email: {
    type: "email",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
    kind: "data",
    inputMasks: true,
    hasNullToggle: false,
  },
  textarea: {
    type: "textarea",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
  url: {
    type: "url",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
    kind: "data",
    inputMasks: true,
    hasNullToggle: false,
  },
  color: {
    type: "color",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
  number: {
    type: "number",
    interfaceType: "number",
    validator: "v.number()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: true,
    hasNullToggle: false,
  },
  checkbox: {
    type: "checkbox",
    interfaceType: "boolean",
    validator: "v.boolean()",
    defaultValue: false,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  date: {
    type: "date",
    interfaceType: "number",
    validator: "v.number()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
  commitTs: {
    type: "commitTs",
    interfaceType: "number",
    validator: "v.commitTs()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
  select: {
    type: "select",
    interfaceType: "string[]",
    validator: "v.array(\nv.string()\n)",
    defaultValue: [] as string[],
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
  relationship: {
    type: "relationship",
    interfaceType: "Id<CollectionSlug>[]",
    validator: "v.array(\nv.string()\n)",
    defaultValue: [] as string[],
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
  array: {
    type: "array",
    interfaceType: "unknown[]",
    validator: "v.array(\nv.any()\n)",
    defaultValue: [],
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  group: {
    type: "group",
    interfaceType: "Record<string, any>",
    validator: "v.object({})",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValue: {} as Record<string, any>,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  keyValue: {
    type: "keyValue",
    interfaceType: "Record<string, any>", // placeholder - keyValue() overrides per instance
    validator: "v.record(v.string(), v.any())", // placeholder - keyValueFieldToValidator builds dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValue: {} as Record<string, any>,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  blocks: {
    type: "blocks",
    interfaceType: "Record<string, any>[]", // placeholder - blocks() overridses per instance
    validator: "v.array(v.any())", // placeholder - blocksFieldToValidator builds dynamically
    defaultValue: [],
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  upload: {
    type: "upload",
    interfaceType: "Id<MediaCollectionSlug>[]",
    validator: "v.array(\nv.string()\n)",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
  richtext: {
    type: "richtext",
    interfaceType: "RichTextDocument",
    validator: "v.array(\nv.any()\n)",
    defaultValue: [],
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  json: {
    type: "json",
    interfaceType: "unknown",
    validator: "v.any()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  variant: {
    type: "variant",
    interfaceType: "unknown",
    validator: "v.any()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  bytes: {
    type: "bytes",
    interfaceType: "ArrayBuffer",
    validator: "v.bytes()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
  tabs: {
    type: "tabs",
    interfaceType: "never",
    validator: "never",
    defaultValue: undefined,
    kind: "ui",
    inputMasks: false,
    hasNullToggle: false,
  },
  collapsible: {
    type: "collapsible",
    interfaceType: "never",
    validator: "never",
    defaultValue: undefined,
    kind: "ui",
    inputMasks: false,
    hasNullToggle: false,
  },
  row: {
    type: "row",
    interfaceType: "never",
    validator: "never",
    defaultValue: undefined,
    kind: "ui",
    inputMasks: false,
    hasNullToggle: false,
  },
  ui: {
    type: "ui",
    interfaceType: "never",
    validator: "never",
    defaultValue: undefined,
    kind: "ui",
    inputMasks: false,
    hasNullToggle: false,
  },
} as const;

/** Union of all supported field type name strings (e.g. `"text"` | `"number"` | `"checkbox"` | ...). */
export type AdminFieldType = (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["type"];
/** Union of all Convex validator strings for the supported field types (e.g. `"v.string()"` | `"v.number()"` | ...). */
export type AdminFieldValidator = (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["validator"];
/** Union of all TypeScript type strings corresponding to the supported field types (e.g. `"string"` | `"number"` | ...). */
export type AdminFieldTsType = (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["interfaceType"];

/**
 * Convex storage validator names a field's `schema: { validator }` option may
 * select, mirroring Convex's own vocabulary. `number` accepts `"int64"`;
 * `select` accepts `"literal" | "string"`; `relationship`/`upload` accept
 * `"id" | "string"`. Each field type's own `schema` input narrows this to its
 * own subset.
 */
export const FIELD_SCHEMA_VALIDATORS = {
  int64: "int64",
  literal: "literal",
  string: "string",
  id: "id",
} as const;

/** Derived from {@link FIELD_SCHEMA_VALIDATORS}. */
export type FieldSchemaValidator = (typeof FIELD_SCHEMA_VALIDATORS)[keyof typeof FIELD_SCHEMA_VALIDATORS];

/** Literal type `"text"` — the discriminant value on {@link TextField}. */
export type TextFieldType = typeof ADMIN_FIELDS.text.type;

/** Literal type `"email"` — the discriminant value on {@link EmailField}. */
export type EmailFieldType = typeof ADMIN_FIELDS.email.type;

/** Literal type `"url"` — the discriminant value on {@link UrlField}. */
export type UrlFieldType = typeof ADMIN_FIELDS.url.type;

/** Literal type `"color"` — the discriminant value on {@link ColorField}. */
export type ColorFieldType = typeof ADMIN_FIELDS.color.type;

/** Literal type `"number"` — the discriminant value on {@link NumberField}. */
export type NumberFieldType = typeof ADMIN_FIELDS.number.type;

/** Literal type `"checkbox"` — the discriminant value on {@link CheckboxField}. */
export type CheckboxFieldType = typeof ADMIN_FIELDS.checkbox.type;

/** Literal type `"date"` — the discriminant value on {@link DateField}. */
export type DateFieldType = typeof ADMIN_FIELDS.date.type;

/** Literal type `"commitTs"` — the discriminant value on {@link CommitTsField}. */
export type CommitTsFieldType = typeof ADMIN_FIELDS.commitTs.type;

/** Literal type `"select"` — the discriminant value on {@link SelectField}. */
export type SelectFieldType = typeof ADMIN_FIELDS.select.type;

/** Literal type `"relationship"` — the discriminant value on {@link RelationshipField}. */
export type RelationshipFieldType = typeof ADMIN_FIELDS.relationship.type;

/** Literal type `"array"` — the discriminant value on {@link ArrayField}. */
export type ArrayFieldType = typeof ADMIN_FIELDS.array.type;

/** Literal type `"textarea"` — the discriminant value on {@link TextareaField}. */
export type TextareaFieldType = typeof ADMIN_FIELDS.textarea.type;

/** Literal type `"group"` — the discriminant value on {@link GroupField}. */
export type GroupFieldType = typeof ADMIN_FIELDS.group.type;

/** Literal type `"keyValue"` — the discriminant value on {@link KeyValueField}. */
export type KeyValueFieldType = typeof ADMIN_FIELDS.keyValue.type;

/** Literal type `"blocks"` — the discriminant value on {@link BlocksField}. */
export type BlocksFieldType = typeof ADMIN_FIELDS.blocks.type;

/** Literal type `"upload"` — the discriminant value on {@link UploadField}. */
export type UploadFieldType = typeof ADMIN_FIELDS.upload.type;

/** Literal type `"richtext"` — the discriminant value on {@link RichTextField}. */
export type RichTextFieldType = typeof ADMIN_FIELDS.richtext.type;

/** Literal type `"json"` — the discriminant value on {@link JsonField}. */
export type JsonFieldType = typeof ADMIN_FIELDS.json.type;

/** Literal type `"variant"` — the discriminant value on {@link VariantField}. */
export type VariantFieldType = typeof ADMIN_FIELDS.variant.type;

/** Literal type `"bytes"` — the discriminant value on {@link BytesField}. */
export type BytesFieldType = typeof ADMIN_FIELDS.bytes.type;

/** Literal type `"tabs"` — the discriminant value on {@link TabsField}. */
export type TabsFieldType = typeof ADMIN_FIELDS.tabs.type;

/** Literal type `"collapsible"` — the discriminant value on {@link CollapsibleField}. */
export type CollapsibleFieldType = typeof ADMIN_FIELDS.collapsible.type;

/** Literal type `"row"` — the discriminant value on {@link RowField}. */
export type RowFieldType = typeof ADMIN_FIELDS.row.type;
