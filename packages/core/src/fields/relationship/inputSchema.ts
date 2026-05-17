import { z, type ZodType } from "zod";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { RelationshipField } from "./types";
import { ADMIN_FIELDS } from "../constants";

/**
 * Builds a Zod schema for validating a relationship field value in the admin form.
 *
 * Convex document IDs are strings at the form boundary. Single references
 * validate as `z.string()`. Multi-references (`hasMany: true`) validate as
 * `z.array(z.string())` with a default of `[]`. Wraps in `.optional()` for
 * non-required fields via {@link applyBaseInputSchemaMeta}.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns A Zod schema for the relationship value.
 *
 * @example
 * ```ts
 * // Single, optional (default)
 * relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "authors" } }) })
 * // → z.array(z.string()).optional().default([])
 *
 * // Multi, required
 * relationshipFieldToInputSchema({ field: relationship({ collection: { slug: "tags" }, hasMany: true, required: true }) })
 * // → z.array(z.string()).default([])
 * ```
 *
 * @internal
 */
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodType {
  const { field } = props;
  const inputSchema = z
    .array(z.string())
    .default(ADMIN_FIELDS.relationship.defaultValue);
  return applyBaseInputSchemaMeta({ field, inputSchema });
}
