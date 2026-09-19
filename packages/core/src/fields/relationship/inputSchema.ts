import { z, type ZodType } from "zod";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { RelationshipField } from "./types";
import { ADMIN_FIELDS } from "../constants";

/**
 * Builds a Zod schema for validating a relationship field value in the admin form.
 *
 * Convex document IDs are strings at the form boundary, always validated as
 * `z.array(z.string())` — `hasMany` is a UI-only hint and does not change the
 * shape. Required fields attach `{ error: "This field is required." }` to the
 * base `z.array()` call and never receive `.default()`; an empty array is
 * still a valid value for a required relationship (a document may
 * legitimately have zero related items) — `required` only rules out an
 * absent value here, unlike `select`/`array`/`blocks`/`upload` (CORE-1).
 * Non-required fields keep `.default([])`.
 *
 * `min`/`max` (reference-count constraints) are independent of `required`,
 * but only skip an *empty* array when the field is optional: an optional
 * field's empty/omitted value shouldn't fail its own `min`, but a required
 * field's `min`/`max` still runs on `[]` too — otherwise, once a `min` is
 * configured, a required field's custom message could never surface (an
 * empty array is the only way to violate a `min` in the first place). This
 * mirrors `array`/`blocks`/`upload` exactly, just without an `items`
 * sub-schema to wrap. Configuring no `min` at all leaves `required`'s own
 * CORE-1 behavior untouched — an empty array is a valid value for a
 * required relationship with no `min` configured.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns A Zod schema for the relationship value.
 *
 * @example
 * ```ts
 * // Single, optional (default)
 * relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "authors" } }) })
 * // → z.array(z.string()).default([])
 *
 * // Multi, required
 * relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "tags" }, hasMany: true, required: true }) })
 * // → z.array(z.string(), { error: "This field is required." })
 *
 * // min/max — enforced on any supplied array, required or not
 * relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "tags" }, min: { value: 1 }, max: { value: 3 } }) })
 * ```
 *
 * @internal
 */
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodType {
  const { field } = props;

  let inputSchema = field.required
    ? z.array(z.string(), { error: "This field is required." })
    : z.array(z.string());

  if (field.min) {
    const min = field.min.value;
    const message = field.min.error ?? "This field is too short.";
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const max = field.max.value;
    const message = field.max.error ?? "This field is too long.";
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(ADMIN_FIELDS.relationship.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
