import * as z from "zod";
import type { ZodType } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { isValidRecordKey } from "./utils";
import type { KeyValueField } from "./types";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Builds a Zod schema for validating a keyValue field value in the admin form.
 *
 * Constructs a `z.record(keySchema, valueSchema)`. `keySchema` enforces
 * Convex's own record-key rules (`isValidRecordKey`) regardless of whether
 * `field.keys` is set — a real Convex id never violates them, so one schema
 * covers both cases. `valueSchema` is built once via `adminFieldToInputSchema`
 * against `field.value` and reused for every entry (Zod validates each
 * record value against it independently). Required keyValue fields attach
 * `{ error: "This field is required." }` to the base `z.record()` call and
 * never receive `.default()`; non-required fields keep
 * `.default(field.defaultValue ?? {})` — mirrors `group`'s own required/
 * optional split (CORE-1), since a record, like an object, has no implicit
 * non-emptiness requirement.
 *
 * `field.value`'s own `admin.condition` is not evaluated here: unlike a
 * group's statically-keyed sub-fields or an array's positional items, a
 * record's entries are dynamically keyed with no single `siblingData` to
 * thread per entry — out of scope for this field's first version.
 *
 * @param props - Input props.
 * @param props.field - The resolved keyValue field definition.
 * @param props.ignoreRequired - Forwarded to the recursive
 *   `adminFieldToInputSchema({ field: field.value })` call so a draft-lenient
 *   pass reaches the value field too.
 * @returns A Zod record schema with optionality applied.
 *
 * @example
 * ```ts
 * const field = keyValue({ value: number({ required: true }) })
 * keyValueFieldToInputSchema({ field })
 * // → z.record(z.string()..., z.number()).optional().default({})
 * ```
 */
export function keyValueFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: KeyValueField<VexResourceSlug, TFieldMeta>;
  ignoreRequired?: boolean;
}): ZodType {
  const { field } = props;

  const keySchema = z
    .string()
    .refine(isValidRecordKey, "Key must be non-empty ASCII and cannot start with \"$\" or \"_\".");
  const valueSchema = adminFieldToInputSchema({
    field: field.value,
    ignoreRequired: props.ignoreRequired,
  });

  const schema: ZodType = field.required
    ? z.record(keySchema, valueSchema, { error: "This field is required." })
    : z.record(keySchema, valueSchema).default(field.defaultValue ?? {});

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
