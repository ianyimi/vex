import * as z from "zod";
import type { ZodObject, ZodType } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { getDataFields, hasFieldConditions } from "../utils";
import type { VariantField, VariantMemberConfig } from "./types";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Builds a Zod schema for validating a variant field value in the admin form.
 *
 * Discriminated: each variant becomes `z.object({ [discriminator]:
 * z.literal(key), ...subSchemas })`; multiple variants combine with
 * `z.discriminatedUnion(discriminator, [...])`, a single variant stays a bare
 * `z.object()`. When any variant's own `fields` declares an `admin.condition`
 * (mirroring `blocksFieldToInputSchema`'s own per-item re-parse), the base
 * schema is a loose object keyed only by `discriminator`, and a `superRefine`
 * re-parses the ACTUAL value through the matching variant's real,
 * condition-aware schema (built with the value itself as `siblingData`,
 * exactly like a block item). Primitive: each member's own schema (via
 * `adminFieldToInputSchema`) combines with `z.union()`, or stays bare for a
 * single member. `.default(field.defaultValue)` is attached for a
 * non-required field — `applyBaseInputSchemaMeta` never adds one itself.
 *
 * @param props.field - The resolved variant field definition.
 * @param props.ignoreRequired - Forwarded to every recursive
 *   `adminFieldToInputSchema` call, draft-lenient like every container field.
 * @param props.data - The full top-level document; omitted skips condition
 *   evaluation for every variant's fields entirely.
 * @param props.siblingData - This field's own resolved value's siblings —
 *   forwarded to each DISCRIMINATED variant's own sub-fields as their
 *   `siblingData` (the same object a group's sub-fields would see).
 * @returns A Zod schema.
 *
 * @internal — Used by admin form schema construction via `adminFieldToInputSchema`.
 */
export function variantFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: VariantField<VexResourceSlug, TFieldMeta>;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
  siblingData?: Record<string, unknown>;
}): ZodType {
  const { field } = props;

  if (field.discriminator !== undefined) {
    const discriminator = field.discriminator;
    const entries = Object.entries(field.variants);
    const variantsByKey = new Map(entries);

    const memberSchemaFor = (
      key: string,
      member: VariantMemberConfig,
      siblingData: Record<string, unknown> | undefined,
    ) => {
      const subSchemas = Object.fromEntries(
        Object.entries(getDataFields({ fields: member.fields })).map(([subKey, subField]) => [
          subKey,
          adminFieldToInputSchema({
            field: subField,
            ignoreRequired: props.ignoreRequired,
            data: props.data,
            siblingData,
            key: subKey,
          }),
        ]),
      );
      return z.object({ [discriminator]: z.literal(key), ...subSchemas });
    };

    const staticSchemas = entries.map(([key, member]) => memberSchemaFor(key, member, props.siblingData));
    const staticSchema: ZodType =
      staticSchemas.length === 1
        ? staticSchemas[0]!
        : z.discriminatedUnion(discriminator, staticSchemas as [ZodObject, ZodObject, ...ZodObject[]]);

    const anyVariantHasConditions = entries.some(([, member]) => hasFieldConditions({ fields: member.fields }));

    const unionSchema: ZodType =
      anyVariantHasConditions && props.data !== undefined
        ? z.looseObject({ [discriminator]: z.string() }).superRefine((value, ctx) => {
            const candidate = value as Record<string, unknown>;
            const key = typeof candidate[discriminator] === "string" ? (candidate[discriminator] as string) : undefined;
            const member = key !== undefined ? variantsByKey.get(key) : undefined;
            if (!member) {
              ctx.addIssue({
                code: "custom",
                message: `Unrecognized "${discriminator}" value${key !== undefined ? ` "${key}"` : ""}.`,
                path: [discriminator],
              });
              return;
            }
            const result = memberSchemaFor(key!, member, candidate).safeParse(value);
            if (!result.success) {
              for (const issue of result.error.issues) {
                ctx.addIssue({ code: "custom", message: issue.message, path: issue.path });
              }
            }
          })
        : staticSchema;

    const schema = field.required ? unionSchema : unionSchema.default(field.defaultValue);
    return applyBaseInputSchemaMeta({ field, inputSchema: schema });
  }

  const memberSchemas = Object.values(field.variants).map((member) =>
    adminFieldToInputSchema({
      field: member,
      ignoreRequired: props.ignoreRequired,
      data: props.data,
      siblingData: props.siblingData,
    }),
  );
  const unionSchema: ZodType =
    memberSchemas.length === 1 ? memberSchemas[0]! : z.union(memberSchemas as [ZodType, ZodType, ...ZodType[]]);
  const schema = field.required ? unionSchema : unionSchema.default(field.defaultValue);
  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
