import { z, type ZodType } from "zod";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { UploadField } from "./types";

/**
 * Generates the Zod input schema for an upload field.
 *
 * The form stores an array of media document ID strings. The upload
 * component validates that each ID points to an existing media document at
 * the UI level (by querying the media collection); the Zod schema only
 * checks shape and, for required fields, non-emptiness. Required fields
 * attach `{ error: "This field is required." }` to the base `z.array()` call
 * and add `.min(1, "This field is required.")` — previously a required
 * upload field had zero length enforcement and accepted `[]` (CORE-1).
 *
 * `field.min`/`field.max` (file-count constraints) are independent of
 * `required`: `required` governs whether the field may be *empty*,
 * `min`/`max` govern the file count *once a value is supplied*. An empty
 * array always skips both checks; a non-empty array — required or not — is
 * always checked against a configured `min`/`max`.
 *
 * @param props — Input schema generation options.
 * @param props.field — The resolved upload field definition.
 * @returns Zod schema for the form field value.
 */
export function uploadFieldToInputSchema(props: { field: UploadField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";
  let inputSchema = field.required
    ? z.array(z.string(), { error: requiredError }).min(1, requiredError)
    : z.array(z.string());

  if (field.min) {
    const min = field.min;
    const message = `At least ${min} file${min === 1 ? "" : "s"} required.`;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const max = field.max;
    const message = `No more than ${max} file${max === 1 ? "" : "s"} allowed.`;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
