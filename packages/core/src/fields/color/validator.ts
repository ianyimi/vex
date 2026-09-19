import type { GenericDataModel } from "convex/server";
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { ColorField } from "./types";

/**
 * Converts a colour field definition to a Convex schema validator string.
 *
 * Colour fields are stored as plain strings in Convex — the notation (and the
 * `var(--token)` alternative allowed by `themeColors`) is enforced at the admin
 * form layer, not in the database schema. This function generates only the type
 * constraint, so changing `format` never triggers a schema migration.
 *
 * @param props - Input props.
 * @param props.field - The resolved colour field definition.
 * @returns Convex validator string: `"v.string()"` for required fields,
 * `"v.optional(v.string())"` for optional fields.
 *
 * @example
 * ```ts
 * colorFieldToValidator({ field: color({ required: true }) })   // "v.string()"
 * colorFieldToValidator({ field: color({ required: false }) })  // "v.optional(v.string())"
 * ```
 *
 * @see {@link colorFieldToInputSchema} for the admin-form Zod schema that enforces the notation
 * @internal Used by schema generation, not typically called directly.
 */
export function colorFieldToValidator(props: { field: ColorField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.color.validator,
  });
}

/**
 * Types a `color()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `string`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function colorValidator<
  TCollectionSlug extends CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string, TDataModel, ColorField>,
): FieldValidate<TCollectionSlug, string> {
  return fieldValidator<TCollectionSlug, string, TDataModel, ColorField>(slug, fn);
}
