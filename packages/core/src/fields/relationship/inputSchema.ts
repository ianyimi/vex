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
 * ```
 *
 * @internal
 */
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodType {
  const { field } = props;

  const inputSchema = field.required
    ? z.array(z.string(), { error: "This field is required." })
    : z.array(z.string()).default(ADMIN_FIELDS.relationship.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
