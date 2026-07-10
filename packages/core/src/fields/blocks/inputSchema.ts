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
 * Multiple block types use `z.discriminatedUnion("blockType", [...])`. A single
 * block type uses a plain `z.array(z.object(...))`. `min`/`max` are enforced on
 * the outer array when set.
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

  let schema = z.array(itemSchema);

  if (field.min) {
    schema = schema.min(field.min, `At least ${field.min} ${field.labels.plural} required.`);
  }
  if (field.max) {
    schema = schema.max(field.max, `No more than ${field.max} ${field.labels.plural} allowed.`);
  }

  // @ts-expect-error mismatched zod types, works in practice
  schema = schema.default(field.defaultValue ?? []);

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
