import { z, type ZodType } from "zod";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import type { UploadField } from "./types";

/**
 * Generates the Zod input schema for an upload field.
 *
 * The form stores a media document ID string. The upload component validates
 * that the ID points to an existing media document at the UI level (by querying
 * the media collection), but the Zod schema is a simple string check.
 *
 * @param props — Input schema generation options.
 * @param props.field — The resolved upload field definition.
 * @returns Zod schema for the form field value.
 */
export function uploadFieldToInputSchema(props: { field: UploadField }): ZodType {
  const inputSchema = z.array(z.string());
  return applyBaseInputSchemaMeta({ field: props.field, inputSchema });
}
