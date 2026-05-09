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
  },
  url: {
    type: "url",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: undefined,
  },
  number: {
    type: "number",
    interfaceType: "number",
    validator: "v.number()",
    defaultValue: 0,
  },
  checkbox: {
    type: "checkbox",
    interfaceType: "boolean",
    validator: "v.boolean()",
    defaultValue: false,
  },
  date: {
    type: "date",
    interfaceType: "number",
    validator: "v.number()",
    defaultValue: undefined,
  },
  select: {
    type: "select",
    interfaceType: "string[]",
    validator: "v.array(\nv.string()\n)",
    defaultValue: [] as string[],
  },
  relationship: {
    type: "relationship",
    interfaceType: "Id<CollectionSlug>[]",
    validator: "v.array(\nv.string()\n)",
    defaultValue: [] as string[],
  },
  // richtext: {
  //   type: "richtext",
  //   validator: "v.any()",
  //   defaultValue: {},
  // },
} as const;
/** Union of all supported field type name strings (e.g. `"text"` | `"number"` | `"checkbox"` | ...). */
export type AdminFieldType =
  (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["type"];
/** Union of all Convex validator strings for the supported field types (e.g. `"v.string()"` | `"v.number()"` | ...). */
export type AdminFieldValidator =
  (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["validator"];
/** Union of all TypeScript type strings corresponding to the supported field types (e.g. `"string"` | `"number"` | ...). */
export type AdminFieldTsType =
  (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["interfaceType"];

/** Literal type `"text"` — the discriminant value on {@link TextField}. */
export type TextFieldType = typeof ADMIN_FIELDS.text.type;

/** Literal type `"url"` — the discriminant value on {@link UrlField}. */
export type UrlFieldType = typeof ADMIN_FIELDS.url.type;

/** Literal type `"number"` — the discriminant value on {@link NumberField}. */
export type NumberFieldType = typeof ADMIN_FIELDS.number.type;

/** Literal type `"checkbox"` — the discriminant value on {@link CheckboxField}. */
export type CheckboxFieldType = typeof ADMIN_FIELDS.checkbox.type;

/** Literal type `"date"` — the discriminant value on {@link DateField}. */
export type DateFieldType = typeof ADMIN_FIELDS.date.type;

/** Literal type `"select"` — the discriminant value on {@link SelectField}. */
export type SelectFieldType = typeof ADMIN_FIELDS.select.type;

/** Literal type `"relationship"` — the discriminant value on {@link RelationshipField}. */
export type RelationshipFieldType = typeof ADMIN_FIELDS.relationship.type;
