import { z, type ZodType } from "zod";
import { ColorField } from "./types";
import {
  COLOR_FORMAT_PATTERNS,
  CSS_VAR_REFERENCE,
  type ColorFormat,
} from "./formats";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/** One worked example per notation, used to make the form error actionable. */
const FORMAT_EXAMPLES: Record<ColorFormat, string> = {
  hex: "#E8622A",
  rgb: "rgb(232, 98, 42)",
  hsl: "hsl(17.7, 81%, 54%)",
  oklch: "oklch(65.7% 0.179 40.9)",
};

/**
 * Builds the accepted-value pattern for a colour field.
 *
 * Deliberately accepts **every** supported notation rather than only
 * `field.format`: `format` decides what the picker writes, and narrowing
 * validation to it would invalidate every existing document the moment a field
 * switched notation. Each notation's pattern is already anchored, so the
 * alternation stays anchored.
 *
 * @param props - Input props.
 * @param props.themeColors - Whether `var(--token)` references are also accepted.
 * @returns A regex matching any supported colour notation.
 */
function colorPattern(props: { themeColors: boolean }): RegExp {
  const sources = COLOR_FORMAT_PATTERNS.map((pattern) => pattern.source);
  if (props.themeColors) sources.push(CSS_VAR_REFERENCE.source);
  return new RegExp(sources.join("|"));
}

/**
 * Builds the form error shown when a value matches no accepted notation.
 *
 * @param props - Input props.
 * @param props.field - The resolved colour field definition.
 * @returns A message leading with the field's own notation, since that is what
 * the picker produces and therefore what the author most likely wants.
 */
function colorMessage(props: { field: ColorField }): string {
  const example = FORMAT_EXAMPLES[props.field.format];
  const base = `Enter a colour, e.g. ${example}.`;
  if (!props.field.themeColors) return base;
  return `${base} A theme token such as var(--primary) is also accepted.`;
}

/**
 * Builds a Zod schema for validating a colour field value in the admin form.
 *
 * Accepts hex, `rgb()`, `hsl()` and `oklch()` notation — plus `var(--token)`
 * when the field enables `themeColors`. Required fields add a `.min(1)` check so
 * an empty field reports "required" rather than a notation complaint. Optional
 * fields accept the empty string, since `color()` defaults `defaultValue` to
 * `""` and a cleared picker must round-trip.
 *
 * @param props - Input props.
 * @param props.field - The resolved colour field definition.
 * @returns A Zod string schema. Optional fields are wrapped in `.optional()` by
 * `applyBaseInputSchemaMeta` and carry `.default(field.defaultValue)`.
 *
 * @example
 * ```ts
 * // Required — rejects "", "#fff" and "var(--primary)"
 * colorFieldToInputSchema({ field: color({ required: true }) })
 *
 * // themeColors — additionally accepts "var(--primary)"
 * colorFieldToInputSchema({ field: color({ required: true, themeColors: true }) })
 * ```
 */
export function colorFieldToInputSchema(props: { field: ColorField }): ZodType {
  const { field } = props;
  const pattern = colorPattern({ themeColors: field.themeColors });
  const message = colorMessage({ field });

  let inputSchema: ZodType = z.string().regex(pattern, message);
  if (field.required) {
    inputSchema = z.string().min(1, "This field is required.").regex(pattern, message);
    if (field.defaultValue) {
      inputSchema = inputSchema.default(field.defaultValue);
    }
  } else if (field.defaultValue !== undefined) {
    inputSchema = z
      .union([z.string().regex(pattern, message), z.literal("")])
      .default(field.defaultValue);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
