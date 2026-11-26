import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { KeyValueField } from "./types";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Converts a keyValue field definition to a Convex schema validator string.
 *
 * Generates `v.record(keys, value)` where `keys` is `v.string()` by default
 * or `v.id("collection")` when `field.keys` is set, and `value` is built by
 * the existing `adminFieldToValidator` dispatch against `field.value` (whose
 * `required` `keyValue()` already forced to `true`, so the value validator is
 * never wrapped in `v.optional`).
 *
 * @param props - Input props.
 * @param props.field - The resolved keyValue field definition.
 * @returns A Convex validator string.
 *
 * @example
 * ```ts
 * const field = keyValue({ value: number({ required: true }) })
 * keyValueFieldToValidator({ field })
 * // → 'v.optional(v.record(v.string(), v.number()))'
 * ```
 *
 * @example
 * ```ts
 * const field = keyValue({
 *   required: true,
 *   keys: { collection: { slug: "user" } },
 *   value: number({ required: true }),
 * })
 * keyValueFieldToValidator({ field })
 * // → 'v.record(v.id("user"), v.number())'
 * ```
 *
 * @internal — Used by CLI schema generation via `adminFieldToValidator`.
 */
export function keyValueFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: KeyValueField<VexResourceSlug, TFieldMeta>;
}): string {
  const { field } = props;
  const keysValidator = field.keys ? `v.id("${field.keys.collection.slug}")` : "v.string()";
  const valueValidator = adminFieldToValidator({ field: field.value });

  return applyBaseValidators({
    field,
    validator: `v.record(${keysValidator}, ${valueValidator})`,
  });
}

/**
 * Types a `keyValue()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `Record<string, unknown>`.
 * @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function keyValueValidator<TCollectionSlug extends CollectionSlug>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, Record<string, unknown>, KeyValueField>,
): FieldValidate<TCollectionSlug, Record<string, unknown>> {
  return fieldValidator<TCollectionSlug, Record<string, unknown>, KeyValueField>(slug, fn);
}
