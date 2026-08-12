import { z, type ZodType } from "zod";
import { adminFieldToInputSchema } from "../fields";
import type { GlobalConfig } from "./types";
import type { VexDocumentGlobal } from "../types";

/**
 * Builds `defaultValues` for a TanStack Form from a global config.
 *
 * Mirrors `getCollectionDefaultValues` — operates on `GlobalConfig` rather
 * than `CollectionConfig`. When `document` is provided (edit mode), uses its
 * field values; otherwise falls back to each field's `defaultValue`.
 *
 * @param props - Input props.
 * @param props.global - The global config whose fields define the form shape.
 * @param props.document - Optional existing flat global document (edit mode).
 *   `null` means "no document persisted yet" — create mode with defaults.
 * @returns `Record<fieldKey, value>` ready for `useForm({ defaultValues })`.
 */
export function getGlobalDefaultValues(props: {
  global: GlobalConfig;
  document?: VexDocumentGlobal | null;
}): Record<string, unknown> {
  const res: Record<string, unknown> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.global.fields)) {
    if (fieldDef.admin.hidden) continue;
    if (props.document && Boolean(props.document[fieldKey])) {
      res[fieldKey] = props.document[fieldKey];
    } else {
      res[fieldKey] = fieldDef.defaultValue;
    }
  }
  return res;
}

/**
 * Builds a Zod object schema for validating all fields in a global.
 *
 * Mirrors `getCollectionInputSchema` — same field-level logic, operates on
 * `GlobalConfig`. Used by `updateGlobal` server function to validate user
 * data before writing to `vex_globals`.
 *
 * @param props - Input props.
 * @param props.global - The global config whose fields define the schema.
 * @returns A `z.object` schema with one key per field.
 */
export function getGlobalInputSchema(props: { global: GlobalConfig }) {
  const res: Record<string, ZodType> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.global.fields)) {
    if (fieldDef.admin.hidden) continue;
    res[fieldKey] = adminFieldToInputSchema({ field: fieldDef });
  }
  return z.object({ ...res });
}
