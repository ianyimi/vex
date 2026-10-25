import { childInterfaceType } from "../childInterfaceType";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldLimit, resolveFieldComponents } from "../utils";
import { RESERVED_ARRAY_ITEM_FIELD_NAMES } from "./types";
import type { ArrayFieldInput, ArrayField, ArrayType } from "./types";
import type { VexResourceSlug } from "../../types/generated";

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
 * - `label` — `""` (inferred from the field key by `defineCollection`); the
 *   admin UI uses it as the plural ("Grid Items") and `items.label` as the
 *   singular ("Grid Item") — see {@link arrayItemLabel}
 * - `required` — `false`
 * - `defaultValue` — `[]`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
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
 *       min: 1,
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
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TArrayType extends ArrayType = string,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options: ArrayFieldInput<TCollectionSlug, TArrayType, TFieldMeta>): ArrayField<TCollectionSlug, TArrayType, TFieldMeta> {
  const itemsField = options.items;
  if (
    itemsField.type === ADMIN_FIELDS.group.type &&
    RESERVED_ARRAY_ITEM_FIELD_NAMES.some((name) => name in itemsField.fields)
  ) {
    throw new Error(
      `array(): items group declares a reserved field name. Reserved names: ${RESERVED_ARRAY_ITEM_FIELD_NAMES.join(", ")}`,
    );
  }

  // If the items field is a named group, reference its name in the array
  // type rather than inlining the full object type. This keeps generated
  // interfaces readable and lets the named group's own type alias do the work.
  const itemsInterfaceType = childInterfaceType(options.items);
  // A NAMED group's interfaceType is a bare identifier (its own separately-emitted
  // interface) — injecting `id?: string;` here would either miss the anchor (no
  // leading "{ ") or, if forced, leak `id` onto every OTHER use of that same named
  // interface, not just this array. Scoped to the unnamed (inline object literal)
  // case only; a named group's generated TYPE does not show `id` yet (documented
  // gap — the STORED value still gets one; see fields/array/utils.ts).
  const resolvedItemsInterfaceType =
    options.items.type === ADMIN_FIELDS.group.type && !options.items.interfaceName
      ? itemsInterfaceType.replace(/^\{ /, "{ id?: string; ")
      : itemsInterfaceType;

  return {
    type: ADMIN_FIELDS.array.type,
    interfaceType: `${resolvedItemsInterfaceType}[]`,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: [],
    ...options,

    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value} items.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value} items.`,
    }),

    items: {
      ...options.items,
      required: true,
    },

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
