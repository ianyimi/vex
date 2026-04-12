/**
 * Convex schema value type constants for field types.
 *
 * These constants define the base Convex validator strings for each field type.
 * They're used by schema generation logic to build the Convex schema.
 *
 * @internal
 */

// eslint-disable-next-line jsdoc/require-jsdoc
export const ADMIN_FIELDS = {
  text: {
    type: "text",
    validator: "v.string()",
    defaultValue: "",
  },
  number: {
    type: "number",
    validator: "v.number()",
    defaultValue: 0,
  },
  checkbox: {
    type: "checkbox",
    validator: "v.boolean()",
    defaultValue: false,
  },
  date: {
    type: "date",
    validator: "v.number()",
    defaultValue: undefined,
  },
  // richtext: {
  //   type: "richtext",
  //   validator: "v.any()",
  //   defaultValue: {},
  // },
} as const;
// eslint-disable-next-line jsdoc/require-jsdoc
export type AdminFieldType =
  (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["type"];
// eslint-disable-next-line jsdoc/require-jsdoc
export type AdminFieldValidator =
  (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["validator"];
