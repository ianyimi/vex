import type { GenericDataModel } from "convex/server";
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { UrlField } from "./types";

/**
 * Converts a URL field definition to a Convex schema validator string.
 *
 * URL fields are stored as plain strings in Convex — the URL format is
 * enforced at the admin form layer, not in the database schema. This
 * function generates only the type constraint.
 *
 * Length constraints (`min`, `max`) are runtime validation — they do not
 * affect the generated Convex validator string. Index configuration is
 * handled separately by the collection schema builder.
 *
 * @param props - Input props.
 * @param props.field - The resolved URL field definition.
 * @returns Convex validator string: `"v.string()"` for required fields,
 * `"v.optional(v.string())"` for optional fields.
 *
 * @example
 * ```ts
 * const field1 = url({ required: true })
 * urlFieldToValidator({ field: field1 })  // "v.string()"
 *
 * const field2 = url({ required: false })
 * urlFieldToValidator({ field: field2 })  // "v.optional(v.string())"
 *
 * const field3 = url({ min: { value: 10 }, max: { value: 2048 } })
 * urlFieldToValidator({ field: field3 })  // "v.optional(v.string())"
 * // Length constraints don't affect schema — handled at validation layer
 * ```
 *
 * @see {@link urlFieldToInputSchema} for the admin-form Zod schema with URL format and length validation
 * @internal Used by schema generation, not typically called directly.
 */
export function urlFieldToValidator(props: { field: UrlField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.url.validator,
  });
}

/**
 * Types a `url()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `string`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function urlValidator<
  TCollectionSlug extends CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string, TDataModel, UrlField>,
): FieldValidate<TCollectionSlug, string> {
  return fieldValidator<TCollectionSlug, string, TDataModel, UrlField>(slug, fn);
}
