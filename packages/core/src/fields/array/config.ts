import { ADMIN_FIELDS } from "../constants";
import type { ArrayFieldInput, ArrayField, ArrayType } from "./types";

/**
 * Creates an array field with all defaults applied.
 *
 * Array fields store ordered lists of values — strings, numbers, booleans,
 * or nested objects. Items are validated by a nested field definition
 * (`items`) which supports any VexCMS field type including nested arrays.
 *
 * Accepts {@link ArrayFieldInput} (all optional) and returns {@link ArrayField}
 * with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `labels.singular` — `"Item"`
 * - `labels.plural` — `"Items"`
 * - `required` — `false`
 * - `defaultValue` — `[]`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Array field configuration. All properties are optional.
 * @returns Resolved array field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { array, text, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Simple string tags array
 *     tags: array({
 *       items: text(),
 *     }),
 *
 *     // Number array with a min length
 *     scores: array({
 *       items: number(),
 *       min: { value: 1 },
 *     }),
 *
 *     // Nested array — array of arrays of numbers
 *     matrix: array({
 *       items: array({ items: number() }),
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link ArrayFieldInput} for the full input type
 * @see {@link ArrayField} for the resolved output type
 */
export function array<
  TArrayType extends ArrayType = string,
  TFieldMeta extends {} = {},
>(
  options: ArrayFieldInput<TArrayType, TFieldMeta>,
): ArrayField<TArrayType, TFieldMeta> {
  // If the items field is a named group, reference its name in the array
  // type rather than inlining the full object type. This keeps generated
  // interfaces readable and lets the named group's own type alias do the work.
  const itemsInterfaceType =
    options.items.type === ADMIN_FIELDS.group.type && options.items.interfaceName
      ? options.items.interfaceName
      : options.items.interfaceType;

  return {
    type: ADMIN_FIELDS.array.type,
    interfaceType: `${itemsInterfaceType}[]`,

    // Core properties with defaults
    label: "",
    labels: {
      singular: "Item",
      plural: "Items",
    },
    required: false,
    defaultValue: [],
    ...options,

    items: {
      ...options.items,
      required: true,
    },

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
    },
  };
}
