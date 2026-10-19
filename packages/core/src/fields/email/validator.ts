import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { EmailField } from "./types";

/**
 * Converts an email field definition to a Convex schema validator string.
 *
 * Email fields are stored as plain strings in Convex — the email format is
 * enforced at the admin form layer and the server write pipeline (both via
 * {@link emailFieldToInputSchema}), not in the database schema. This
 * function generates only the type constraint.
 *
 * `min`/`max` are runtime validation constraints and do not affect the
 * generated Convex value type. The index property is handled separately by
 * the collection schema builder.
 *
 * @param props - Input props.
 * @param props.field - The resolved email field definition.
 * @returns Convex validator string: `"v.string()"` for required fields,
 * `"v.optional(v.string())"` for optional fields.
 *
 * @example
 * ```ts
 * const field1 = email({ required: true })
 * emailFieldToValidator({ field: field1 })  // "v.string()"
 *
 * const field2 = email({ required: false })
 * emailFieldToValidator({ field: field2 })  // "v.optional(v.string())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function emailFieldToValidator(props: { field: EmailField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.email.validator,
  });
}

/**
 * Types an `email()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `string` — the wrapper `fieldValidator`
 * for this field type. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function emailValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string, EmailField>,
): FieldValidate<TCollectionSlug, string> {
  return fieldValidator<TCollectionSlug, string, EmailField>(slug, fn);
}
