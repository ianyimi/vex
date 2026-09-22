import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { SelectField } from "./types";

/**
 * Converts a select field definition to a Convex schema validator string.
 *
 * Generates a `v.array(v.union(...))` validator where each union member is a
 * `v.literal("value")` for each configured option. Wraps in `v.optional()`
 * when the field is not required.
 *
 * This function is used by the CLI during schema generation to build the Convex schema file.
 *
 * @param props - selectFieldToValidator() input props
 * @param props.field - The resolved select field definition
 * @returns Convex value type string, e.g. `v.array(v.union(v.literal("draft"), v.literal("published")))`
 *
 * @example
 * ```ts
 * const field1 = select({ required: true, options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] })
 * selectFieldToValidator({ field: field1 })
 * // → 'v.array(v.union(v.literal("draft"), v.literal("published")))'
 *
 * const field2 = select({ required: false, options: [{ label: "Active", value: "active" }] })
 * selectFieldToValidator({ field: field2 })
 * // → 'v.optional(v.array(v.union(v.literal("active"))))'
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function selectFieldToValidator(props: { field: SelectField }): string {
  const { field } = props;
  const optionLiterals = field.options
    .map((o) => `v.literal("${o.value}")`)
    .join(", ");
  const validator = `v.array(v.union(${optionLiterals}))`;
  return applyBaseValidators({ field, validator });
}

/**
 * Types a `select()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `string[]`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function selectValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string[], SelectField>,
): FieldValidate<TCollectionSlug, string[]> {
  return fieldValidator<TCollectionSlug, string[], SelectField>(slug, fn);
}
