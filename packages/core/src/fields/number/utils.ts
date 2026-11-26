import { FIELD_SCHEMA_VALIDATORS } from "../constants";
import type { VexResourceSlug } from "../../types/generated";
import type { Int64NumberField, NumberField } from "./types";

/**
 * Narrows a resolved `number()` field to {@link Int64NumberField} — true when
 * `schema.validator` is `"int64"`.
 *
 * @param field - The resolved number field definition.
 * @returns Whether `field` stores `v.int64()` (a native `bigint`).
 */
export function isInt64NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
>(
  field: NumberField<TCollectionSlug, TFieldMeta>,
): field is Int64NumberField<TCollectionSlug, TFieldMeta> {
  return field.schema?.validator === FIELD_SCHEMA_VALIDATORS.int64;
}
