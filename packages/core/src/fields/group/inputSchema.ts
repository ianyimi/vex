import { z, ZodType } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { GroupField } from "./types";

/**
 * Builds a Zod schema for validating a group field value in the admin form.
 *
 * Constructs a `z.object({...})` where each key maps to the sub-field's own
 * Zod schema via `adminFieldToInputSchema`; sub-field defaults and
 * optionality are handled recursively. Required groups attach
 * `{ error: "This field is required." }` to the base `z.object()` call and
 * never receive `.default()` — previously an unconditional
 * `.default(field.defaultValue ?? {})` meant a missing group value silently
 * passed the required check (CORE-1). Non-required groups keep
 * `.default(field.defaultValue ?? {})`. The outer object also receives
 * `.optional()` when `field.required` is `false` via
 * `applyBaseInputSchemaMeta`.
 *
 * @param props - Input props.
 * @param props.field - The resolved group field definition.
 * @returns A Zod object schema with optionality applied.
 *
 * @example
 * ```ts
 * const field = group({ fields: { title: text({ required: true }), body: text() } })
 * groupFieldToInputSchema({ field })
 * // → z.object({ title: z.string(), body: z.string().optional() }).optional().default({})
 * ```
 *
 * @internal — Used by admin form schema construction via `adminFieldToInputSchema`.
 */
export function groupFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: GroupField<TFieldMeta>;
}): ZodType {
  const { field } = props;

  const subSchemas = Object.fromEntries(
    Object.entries(field.fields).map(([key, subField]) => [
      key,
      adminFieldToInputSchema({ field: subField }),
    ]),
  );

  const schema: ZodType = field.required
    ? z.object(subSchemas, { error: "This field is required." })
    : z.object(subSchemas).default(field.defaultValue ?? {});

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
