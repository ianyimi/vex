import { z, ZodType } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { BlocksField } from "./types";

/**
 * Builds a Zod schema for validating a blocks field value in the admin form.
 *
 * Each block type becomes a `z.object()` with `blockType: z.literal(slug)`,
 * `blockName: z.string().optional()`, and `id: z.string()` as framework
 * keys, plus the block's own sub-field schemas from `adminFieldToInputSchema`.
 * Multiple block types use `z.discriminatedUnion("blockType", [...])`. A
 * single block type uses a plain `z.array(z.object(...))`. Required fields
 * attach `{ error: "This field is required." }` to the base `z.array()` call
 * and add `.min(1, "This field is required.")`, composed onto (not
 * overwriting) the configured `field.min`/`field.max`, so a required blocks
 * field with no length constraint of its own — previously zero enforcement —
 * now rejects a missing or empty value (CORE-1). Required fields never
 * receive `.default()`; non-required fields keep
 * `.default(field.defaultValue ?? [])`.
 *
 * @param props - Input props.
 * @param props.field - The resolved blocks field definition.
 * @returns A Zod array schema with discriminated-union items.
 *
 * @internal — Used by admin form schema construction via `adminFieldToInputSchema`.
 */
export function blocksFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: BlocksField<TFieldMeta>;
}): ZodType {
  const { field } = props;

  const blockSchemas = field.blocks.map((block) => {
    const userSubSchemas = Object.fromEntries(
      Object.entries(block.fields).map(([key, subField]) => [
        key,
        adminFieldToInputSchema({ field: subField }),
      ]),
    );
    return z.object({
      blockType: z.literal(block.blockType),
      blockName: z.string().optional(),
      id: z.string(),
      ...userSubSchemas,
    });
  });

  const itemSchema =
    blockSchemas.length <= 1
      ? (blockSchemas[0] ?? z.object({ blockType: z.string(), id: z.string() }))
      : // @ts-expect-error mismatched zod types, works in practice
        z.discriminatedUnion("blockType", blockSchemas);

  const requiredError = "This field is required.";
  let arraySchema = field.required
    ? z.array(itemSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemSchema);

  if (field.min) {
    arraySchema = arraySchema.min(
      field.min,
      `At least ${field.min} ${field.labels.plural} required.`,
    );
  }
  if (field.max) {
    arraySchema = arraySchema.max(
      field.max,
      `No more than ${field.max} ${field.labels.plural} allowed.`,
    );
  }

  const schema: ZodType = field.required
    ? arraySchema
    : arraySchema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
