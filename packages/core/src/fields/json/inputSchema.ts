import * as z from "zod";
import type { ZodType } from "zod";
import { JsonField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a json field value in the admin form.
 *
 * There is no shape validation — any JSON-serializable value passes. A
 * required field rejects `undefined`/`null` with "This field is required.";
 * a non-required field accepts a missing value and falls back to
 * `field.defaultValue`.
 *
 * @param props - Input props.
 * @param props.field - The resolved json field definition
 * @returns A Zod schema accepting any defined, non-null value when required
 *
 * @example
 * ```ts
 * const field = json({ required: true })
 * jsonFieldToInputSchema({ field })
 * // → z.unknown().refine(...) — rejects undefined/null with "This field is required."
 * ```
 */
export function jsonFieldToInputSchema(props: { field: JsonField }): ZodType {
  const { field } = props;
  const requiredError = "This field is required.";

  const inputSchema: ZodType = field.required
    ? z.unknown().refine((value) => value !== undefined && value !== null, requiredError)
    : z.unknown();

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
