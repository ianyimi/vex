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
 * @param props — Input schema generation options.
 * @param props.field — The resolved upload field definition.
 * @returns Zod schema for the form field value.
 */
export function uploadFieldToInputSchema(props: { field: UploadField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";
  const inputSchema = field.required
    ? z.array(z.string(), { error: requiredError }).min(1, requiredError)
    : z.array(z.string());

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
