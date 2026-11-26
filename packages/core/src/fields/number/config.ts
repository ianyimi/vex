import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "../constants";
import { resolveFieldLimit, resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types/generated";
import type { Int64NumberFieldInput, NumberFieldInput, NumberField } from "./types";

/**
 * Narrows `number()`'s input to {@link Int64NumberFieldInput} — true when
 * `schema.validator` is `"int64"`. Mirrors {@link isInt64NumberField}
 * (`./utils.ts`) one level earlier, before defaults are applied.
 *
 * @param options - The `number()` input to narrow, or `undefined`.
 * @returns `true` if `options.schema.validator` is `"int64"`.
 */
function isInt64NumberFieldInput<
  TCollectionSlug extends VexResourceSlug,
  TFieldKey extends string,
  TFieldMeta extends {},
>(
  options: NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> | undefined,
): options is Int64NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  return options?.schema?.validator === FIELD_SCHEMA_VALIDATORS.int64;
}

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
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 * - `admin.mask` — not set (opt-in; no project-wide default applies unless configured)
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
 *     quantity: number({ required: true, min: 1, index: "by_quantity" }),
 *
 *     // Rating capped between 0 and 5
 *     rating: number({
 *       min: [0, "Rating cannot be negative"],
 *       max: [5, "Rating cannot exceed 5"],
 *       admin: { width: "50%" },
 *     }),
 *   }
 * })
 * ```
 *
 * @see {@link NumberFieldInput} for the full input type
 * @see {@link NumberField} for the resolved output type
 */
export function number<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
>(
  options?: NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): NumberField<TCollectionSlug, TFieldMeta> {
  if (isInt64NumberFieldInput(options)) {
    const min = resolveFieldLimit<bigint>({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value}.`,
    });
    const max = resolveFieldLimit<bigint>({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value}.`,
    });
    if (min && max && min[0] >= max[0]) {
      throw new Error(`Min value must be lower than the Max value`);
    }

    return {
      type: ADMIN_FIELDS.number.type,
      interfaceType: "bigint",

      // Core properties with defaults
      label: "",
      required: false,
      nullable: false,
      defaultValue: undefined,
      ...options,
      schema: { validator: FIELD_SCHEMA_VALIDATORS.int64 },
      min,
      max,

      // Admin config with all defaults applied
      admin: {
        hidden: false,
        readOnly: false,
        position: "main",
        width: "100%",
        cellAlignment: "left",
        enableSorting: false,
        enableHiding: true,
        placeholder: "",
        ...options.admin,
        components: resolveFieldComponents({ components: options.admin?.components }),
      },
      meta: {
        ...options.meta,
      } as TFieldMeta,
    };
  }

  const min = resolveFieldLimit({
    limit: options?.min,
    defaultError: (value) => `Must be at least ${value}.`,
  });
  const max = resolveFieldLimit({
    limit: options?.max,
    defaultError: (value) => `Must be no more than ${value}.`,
  });
  if (min && max && min[0] >= max[0]) {
    throw new Error(`Min value must be lower than the Max value`);
  }

  return {
    type: ADMIN_FIELDS.number.type,
    interfaceType: ADMIN_FIELDS.number.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    nullable: false,
    defaultValue: ADMIN_FIELDS.number.defaultValue,
    ...options,
    min,
    max,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
