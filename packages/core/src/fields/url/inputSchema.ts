import { z, ZodDefault, ZodURL, type ZodType } from "zod";
import { UrlField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a URL field value in the admin form.
 *
 * Enforces URL format via `z.url()`. Required fields add a `.min(1)` check.
 * `.default(field.defaultValue)` is applied only when `defaultValue` is explicitly
 * set on the field — unlike `text()`, the url field has no implicit empty-string
 * default. Wraps in `.optional()` for non-required fields via
 * {@link applyBaseInputSchemaMeta}.
 *
 * @param props - Input props.
 * @param props.field - The resolved URL field definition.
 * @returns A Zod URL schema. Optional fields are wrapped in `.optional()`. A
 * `.default()` is only added when `field.defaultValue` is not `undefined`.
 *
 * @example
 * ```ts
 * // Required — rejects empty string and non-URLs
 * urlFieldToInputSchema({ field: url({ required: true }) })
 * // → z.url().min(1, "This field is required.").optional() — no default
 *
 * // Optional with explicit default
 * urlFieldToInputSchema({ field: url({ required: false, defaultValue: "https://example.com" }) })
 * // → z.url().default("https://example.com").optional()
 * ```
 */
export function urlFieldToInputSchema(props: { field: UrlField }): ZodType {
  const { field } = props;

  let inputSchema: ZodURL | ZodDefault<ZodURL> = z.url();
  if (field.required) {
    inputSchema = z.url().min(1, "This field is required.");
    if (field.defaultValue !== undefined) {
      inputSchema = z
        .url()
        .min(1, "This field is required.")
        .default(field.defaultValue);
    }
  } else if (field.defaultValue !== undefined) {
    inputSchema = z.url().default(field.defaultValue);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
