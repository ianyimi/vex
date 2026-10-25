import * as z from "zod";
import type { ZodType } from "zod";
import { EmailField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating an email field value in the admin form
 * and the server write pipeline.
 *
 * The email-format check (`.email()`) is chained onto the same `z.string()`
 * call as `min`/`max` — not `.pipe()`d after them — so every configured
 * check runs and reports together, matching `textFieldToInputSchema`'s
 * CORE-1 composition rule. A required field's emptiness is checked first
 * (`.min(1, requiredError)`) so a missing value reports "This field is
 * required." rather than the format error.
 *
 * A non-required field's empty string bypasses the format check entirely —
 * `z.union([emailSchema, z.literal("")])`, the same escape hatch
 * `urlFieldToInputSchema` uses — because an untouched admin-form input holds
 * `""`, not `undefined`, so `.default()` alone (which only fires on
 * `undefined`) can never save an empty optional email from failing
 * `.email()`.
 *
 * `min`/`max` read `field.min`/`field.max` directly as `[value, error]` —
 * `resolveFieldLimit` (step 1) already guarantees `error` is set whenever
 * the tuple is present, so no further fallback is needed here.
 *
 * @param props - Input props.
 * @param props.field - The resolved email field definition.
 * @returns A Zod schema enforcing required/length/email-format constraints and optionality.
 *
 * @example
 * ```ts
 * const field = email({ required: true, min: [5, "Too short."] })
 * emailFieldToInputSchema({ field })
 * // → required, min-length 5, format-checked string
 * ```
 */
export function emailFieldToInputSchema(props: { field: EmailField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";
  const formatError = "Enter a valid email address.";

  if (field.required) {
    let inputSchema = z.string({ error: requiredError }).min(1, requiredError);
    if (field.min) {
      inputSchema = inputSchema.min(field.min[0], field.min[1]);
    }
    if (field.max) {
      inputSchema = inputSchema.max(field.max[0], field.max[1]);
    }
    return applyBaseInputSchemaMeta({
      field,
      inputSchema: inputSchema.email({ error: formatError }),
    });
  }

  let emailSchema = z.string().email({ error: formatError });
  if (field.min) {
    emailSchema = emailSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    emailSchema = emailSchema.max(field.max[0], field.max[1]);
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: z.union([emailSchema, z.literal("")]).default(field.defaultValue ?? ""),
  });
}
