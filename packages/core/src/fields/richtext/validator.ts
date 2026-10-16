import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { RichTextField, RichTextDocument } from "./types";

/**
 * Converts a richtext field definition to a Convex schema validator string.
 *
 * Richtext documents are stored as `v.array(v.any())` — Convex validators
 * cannot express the recursive element/leaf shape, so the element-level
 * contract (every array entry is either `{ type, children }` or `{ text }`)
 * is enforced only by {@link richTextFieldToInputSchema}, not the database
 * schema. `v.string()` is deliberately NOT used: that would force a
 * JSON.parse/stringify round trip on every read and write path and would
 * still need an `any`-shaped parsed value, with no structural gain.
 *
 * @param props - Input props.
 * @param props.field - The resolved richtext field definition.
 * @returns Convex validator string: `"v.array(\nv.any()\n)"` for required
 * fields, `"v.optional(v.array(\nv.any()\n))"` for optional fields.
 *
 * @example
 * ```ts
 * richTextFieldToValidator({ field: richtext({ required: true }) })   // "v.array(\nv.any()\n)"
 * richTextFieldToValidator({ field: richtext({ required: false }) })  // "v.optional(v.array(\nv.any()\n))"
 * ```
 *
 * @see {@link richTextFieldToInputSchema} for the admin-form Zod schema that enforces node shape
 * @internal Used by schema generation, not typically called directly.
 */
export function richTextFieldToValidator(props: {
  field: RichTextField;
}): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.richtext.validator,
  });
}

/**
 * Types a `richtext()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `RichTextDocument`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function richTextValidator<TCollectionSlug extends CollectionSlug>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, RichTextDocument, RichTextField>,
): FieldValidate<TCollectionSlug, RichTextDocument> {
  return fieldValidator<TCollectionSlug, RichTextDocument, RichTextField>(
    slug,
    fn,
  );
}
