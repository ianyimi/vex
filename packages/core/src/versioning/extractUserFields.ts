import { ALL_SYSTEM_FIELDS } from "./constants";

/**
 * Extracts user-defined fields from a document, stripping all
 * system fields (_id, _creationTime, _status, _version, _publishedAt).
 *
 * Used to create version snapshots that contain only content fields.
 *
 * @param props.document - The full document including system fields
 * @returns A new object with only user-defined fields
 */
export function extractUserFields(props: {
  document: Record<string, unknown>;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props.document)) {
    if (!ALL_SYSTEM_FIELDS.has(key)) {
      result[key] = value;
    }
  }
  return result;
}
