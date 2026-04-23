import { z, type ZodSchema } from "zod";
import { UrlField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a URL field value in the admin form.
 *
 * Enforces URL format via `z.url()`. Applies a non-empty check for required
 * fields, then delegates `min`/`max` length constraints and optionality to
 * {@link applyBaseInputSchemaMeta}.
 *
 * @param props - Input props.
 * @param props.field - The resolved URL field definition.
 * @returns A Zod URL schema with an optional length constraints and a baked-in
 * `.default(field.defaultValue)`. Wrapped in `.optional()` for non-required fields.
 *
 * @example
 * ```ts
 * const field = url({ required: true, max: { value: 2048 } })
 * urlFieldToInputSchema({ field })
 * // → z.url().min(1, "This field is required.").max(2048).default("")
 * ```
 */
export function urlFieldToInputSchema(props: { field: UrlField }): ZodSchema {
  const { field } = props;

  let inputSchema = z.url().default(field.defaultValue);
  if (field.required) {
    inputSchema = z
      .url()
      .min(1, "This field is required.")
      .default(field.defaultValue);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
