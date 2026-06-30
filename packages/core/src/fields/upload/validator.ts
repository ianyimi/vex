import { applyBaseValidators } from "../validators/utils";
import type { UploadField } from "./types";

/**
 * Generates the Convex schema validator for an upload field.
 *
 * Stores a media document ID: `v.id("<to-slug>")`. The `to` slug is the
 * media collection name — schema generation validates that the collection exists.
 *
 * @param props — Validator generation options.
 * @param props.field — The resolved upload field definition.
 * @returns Convex validator string, e.g. `"v.id(\"images\")"` or
 *   `"v.optional(v.id(\"images\"))"`.
 */
export function uploadFieldToValidator(props: { field: UploadField }): string {
  const validator = `v.id("${props.field.to}")`;
  return applyBaseValidators({ field: props.field, validator });
}
