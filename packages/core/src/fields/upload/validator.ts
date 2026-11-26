import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import { FIELD_SCHEMA_VALIDATORS } from "../constants";
import type { CollectionSlug } from "../../types/generated";
import type { UploadField } from "./types";

/**
 * Generates the Convex schema validator for an upload field.
 *
 * Stores a media document ID: `v.id("<to-slug>")`. The `to` slug is the
 * media collection name — schema generation validates that the collection exists.
 *
 * @param props — Validator generation options.
 * @param props.field — The resolved upload field definition.
 * @returns Convex validator string, e.g. `"v.id(\"images\")"` or
 *   `"v.optional(v.id(\"images\"))"`.
 */
export function uploadFieldToValidator(props: { field: UploadField }): string {
  const { field } = props;
  if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.id) {
    return applyBaseValidators({ field, validator: `v.id("${field.to}")` });
  }
  if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.string) {
    return applyBaseValidators({ field, validator: "v.string()" });
  }
  return applyBaseValidators({ field, validator: `v.array(v.id("${field.to}"))` });
}

/**
 * Types an `upload()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `string[]`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function uploadValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string[], UploadField>,
): FieldValidate<TCollectionSlug, string[]> {
  return fieldValidator<TCollectionSlug, string[], UploadField>(slug, fn);
}
