import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import type { ArrayField, ArrayType } from "./types";

/**
 * Converts an array field definition to a Convex schema validator.
 *
 * Generates `v.array(itemValidator)` wrapped in `v.optional(…)` if the field
 * is not required. The item validator is derived from the nested `field.items`
 * field definition using `adminFieldToValidator`.
 *
 * @param props - Input props
 * @param props.field - The array field definition
 * @returns Convex value type string: `"v.array(v.string())"` or `"v.optional(v.array(v.string()))"`
 *
 * @example
 * ```ts
 * const field1 = array({ items: text(), required: true })
 * arrayFieldToValidator({ field: field1 })  // "v.array(v.string())"
 *
 * const field2 = array({ items: number(), required: false })
 * arrayFieldToValidator({ field: field2 })  // "v.optional(v.array(v.number()))"
 *
 * const field3 = array({ items: array({ items: number() }) })
 * arrayFieldToValidator({ field: field3 })  // "v.array(v.array(v.number()))"
 * ```
 *
 * @internal - Used by CLI schema generation
 */
export function arrayFieldToValidator<
  TArrayType extends ArrayType = ArrayType,
  TFieldMeta extends {} = {},
>(props: { field: ArrayField<TArrayType, TFieldMeta> }): string {
  const itemValidator = adminFieldToValidator({ field: props.field.items });
  return applyBaseValidators({
    field: props.field,
    validator: `v.array(${itemValidator})`,
  });
}
