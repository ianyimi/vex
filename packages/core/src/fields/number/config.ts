import { ADMIN_FIELDS } from "../constants";
import type { NumberFieldInput, NumberField } from "./types";

/**
 * Creates a number field with all defaults applied.
 *
 * Number fields store numeric values.
 * Common uses: prices, quantities, ratings, ages, counts.
 *
 * Accepts {@link NumberFieldInput} (all optional) and returns {@link NumberField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Number field configuration. All properties are optional.
 * @returns Resolved number field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { number, defineCollection } from '@vexcms/core'
 *
 * products: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Price")
 *     price: number(),
 *
 *     // Required quantity with a minimum of 1 and a database index
 *     quantity: number({ required: true, min: { value: 1 }, index: "by_quantity" }),
 *
 *     // Rating capped between 0 and 5
 *     rating: number({
 *       min: { value: 0, error: "Rating cannot be negative" },
 *       max: { value: 5, error: "Rating cannot exceed 5" },
 *       admin: { width: "half" },
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link NumberFieldInput} for the full input type
 * @see {@link NumberField} for the resolved output type
 */
export function number<TMeta extends {} = {}>(
  options?: NumberFieldInput<TMeta>,
): NumberField<TMeta> {
  if (options?.min?.value && options?.max?.value) {
    if (options.min.value >= options.max.value) {
      // TODO. setup errors that throw in development upon invalid configuration
      throw new Error(`Min value must be lower than the Max value`);
    }
  }
  return {
    type: ADMIN_FIELDS.number.type,
    interfaceType: ADMIN_FIELDS.number.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.number.defaultValue,
    ...options,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      // Optional admin properties (no defaults)
      placeholder: "",
      description: "",
      ...options?.admin,
    },

    // Optional field properties (no defaults)
    description: options?.description,
    min: options?.min,
    max: options?.max,
    index: options?.index,
  };
}
