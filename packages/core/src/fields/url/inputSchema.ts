import { z, type ZodType } from "zod";
import { UrlField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a URL field value in the admin form.
 *
 * Required fields check emptiness *before* URL format:
 * `z.string({ error: "This field is required." }).min(1, "This field is
 * required.").pipe(z.url())` — the `.min(1)` stage runs on the plain string
 * and short-circuits the pipe, so an empty required field reports "This
 * field is required." instead of "Invalid URL" (CORE-2; previously
 * `z.url().min(1, ...)` ran the format check first, and `new URL("")`
 * always threw before `.min()` ever ran). Required fields never receive
 * `.default()` — unlike `text()`, the url field has no implicit
 * empty-string default even when non-required. `.default(field.defaultValue)`
 * is applied only for non-required fields with an explicit `defaultValue`.
 * Wraps in `.optional()` for non-required fields via
 * `applyBaseInputSchemaMeta`.
 *
 * *Pinned, unchanged behaviour* (verified before and after this fix):
 * `z.url()` trims whitespace, imposes no protocol restriction (`mailto:`/
 * `ftp://` pass), and requires an absolute URL.
 *
 * @param props - Input props.
 * @param props.field - The resolved URL field definition.
 * @returns A Zod URL schema. Optional fields are wrapped in `.optional()`. A
 * `.default()` is only added when `field.defaultValue` is not `undefined`.
 *
 * @example
 * ```ts
 * // Required — rejects a missing/empty value with "This field is required.", not "Invalid URL"
 * urlFieldToInputSchema({ field: url({ required: true }) })
 *
 * // Optional with explicit default
 * urlFieldToInputSchema({ field: url({ required: false, defaultValue: "https://example.com" }) })
 * // → z.union([z.url(), z.literal("")]).default("https://example.com")
 * ```
 */
export function urlFieldToInputSchema(props: { field: UrlField }): ZodType {
  const { field } = props;
  const requiredError = "This field is required.";

  if (field.required) {
    return applyBaseInputSchemaMeta({
      field,
      inputSchema: z
        .string({ error: requiredError })
        .min(1, requiredError)
        .pipe(z.url()),
    });
  }

  const inputSchema =
    field.defaultValue !== undefined
      ? z.union([z.url(), z.literal("")]).default(field.defaultValue)
      : z.url();

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
