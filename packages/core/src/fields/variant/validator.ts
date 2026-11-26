import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import { getDataFields } from "../utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { VariantField } from "./types";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Converts a variant field definition to a Convex schema validator string.
 *
 * Discriminated: each variant becomes `v.object({ [discriminator]:
 * v.literal(key), ...subValidators })`; multiple variants combine with
 * `v.union()`, a single variant stays a bare `v.object()`. Primitive: each
 * member's own validator (never wrapped in `v.optional()` — `variant()`
 * already forced every member's own `required: true`) combines with
 * `v.union()`, or stays bare for a single member. The whole result is
 * wrapped in `v.optional(...)`/`v.nullable(...)` via `applyBaseValidators`
 * per the FIELD's own `required`/`nullable`.
 *
 * @param props.field - The resolved variant field definition.
 * @returns A Convex validator string.
 *
 * @example
 * ```ts
 * variantFieldToValidator({ field: channel })
 * // → 'v.union(\n  v.object({ kind: v.literal("email"), address: v.string() }),\n  v.object({ kind: v.literal("sms"), phoneNumber: v.string() })\n)'
 * variantFieldToValidator({ field: amount })
 * // → 'v.union(v.string(), v.number())'
 * ```
 *
 * @internal — Used by CLI schema generation via `adminFieldToValidator`.
 */
export function variantFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: VariantField<VexResourceSlug, TFieldMeta>;
}): string {
  const { field } = props;

  if (field.discriminator !== undefined) {
    const discriminator = field.discriminator;
    const memberObjects = Object.entries(field.variants).map(([key, member]) => {
      const subValidators = Object.entries(getDataFields({ fields: member.fields }))
        .map(([subKey, subField]) => `${subKey}: ${adminFieldToValidator({ field: subField })}`)
        .join(", ");
      const discriminatorEntry = `${discriminator}: v.literal("${key}")`;
      const allEntries = subValidators ? `${discriminatorEntry}, ${subValidators}` : discriminatorEntry;
      return `v.object({ ${allEntries} })`;
    });
    const validator =
      memberObjects.length === 1
        ? memberObjects[0]!
        : `v.union(\n${memberObjects.map((o) => `  ${o}`).join(",\n")}\n)`;
    return applyBaseValidators({ field, validator });
  }

  const memberValidators = Object.values(field.variants).map((member) => adminFieldToValidator({ field: member }));
  const validator = memberValidators.length === 1 ? memberValidators[0]! : `v.union(${memberValidators.join(", ")})`;
  return applyBaseValidators({ field, validator });
}

/**
 * Types a `variant()` field's `validate()` against a real collection and
 * `DataModel`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function variantValidator<TCollectionSlug extends CollectionSlug>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, unknown, VariantField>,
): FieldValidate<TCollectionSlug, unknown> {
  return fieldValidator<TCollectionSlug, unknown, VariantField>(slug, fn);
}
