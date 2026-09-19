import { z, ZodType } from "zod";
import { ArrayField, ArrayType } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { adminFieldToInputSchema } from "../inputSchemas";

/**
 * Builds a Zod schema for validating an array field value in the admin form.
 *
 * Wraps the nested item schema (built recursively via `adminFieldToInputSchema`)
 * in `z.array(…)`, then composes `min`/`max` item-count constraints onto the
 * same chain built for `required`, rather than reassigning over it — a
 * required field with `min`/`max` configured keeps every check. Required
 * fields attach `{ error: "This field is required." }` to the base
 * `z.array()` call and add `.min(1, "This field is required.")`, replacing
 * the previous dead `superRefine` (it only ever checked for `undefined`/
 * `null`, which the previously-unconditional `.default()` had already
 * substituted away before the refine ran, and it never checked emptiness at
 * all) (CORE-1). Required fields never receive `.default()`; non-required
 * fields keep `.default(field.defaultValue ?? [])`.
 *
 * `min`/`max` are independent of `required`, but only skip an *empty* array
 * when the field is optional: an optional field's empty/omitted value
 * shouldn't fail its own `min`, but a required field's empty value is
 * already invalid (via `.min(1, requiredError)` above), so its configured
 * `min`/`max` still runs on `[]` too — otherwise a required field's own
 * custom `min`/`max` error message could never surface (an empty array is
 * the only way to violate a `min` in the first place) and only the generic
 * "This field is required." would ever show. A non-empty array — required
 * or not — is always checked against a configured `min`/`max`.
 *
 * @param props - Input props.
 * @param props.field - The resolved array field definition
 * @returns A Zod array schema with item count constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = array({ items: text(), required: true })
 * arrayFieldToInputSchema({ field })
 * // → z.array(z.string(), { error: "This field is required." }).min(1, "This field is required.")
 * ```
 *
 * @example
 * ```ts
 * // Optional field, min/max still enforced once a value is supplied
 * const field = array({ items: number(), min: { value: 2 }, max: { value: 5 } })
 * const schema = arrayFieldToInputSchema({ field })
 * schema.safeParse(undefined)   // → success: [] (skips min/max — empty)
 * schema.safeParse([1])         // → fails: below min
 * schema.safeParse([1, 2])      // → success
 * ```
 */
export function arrayFieldToInputSchema<
  TArrayType extends ArrayType = string,
  TFieldMeta extends {} = {},
>(props: { field: ArrayField<TArrayType, TFieldMeta> }): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too short.";
  const fieldMaxError = field.max?.error ?? "This field is too long.";
  const requiredError = "This field is required.";

  const itemsInputSchema = adminFieldToInputSchema({ field: field.items });

  let arraySchema = field.required
    ? z.array(itemsInputSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemsInputSchema);

  if (field.min) {
    const min = field.min.value;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      fieldMinError,
    );
  }
  if (field.max) {
    const max = field.max.value;
    arraySchema = arraySchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      fieldMaxError,
    );
  }

  const inputSchema: ZodType = field.required
    ? arraySchema
    : arraySchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
