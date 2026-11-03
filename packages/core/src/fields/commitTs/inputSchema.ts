import * as z from "zod";
import type { ZodType } from "zod";
import { CommitTsField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for a `commitTs()` field. Never reached by a real
 * create/update form submission — `getFieldsInputSchema` (`fields/utils.ts`)
 * skips every `commitTs`-typed field before dispatching here, the same way
 * it already skips `admin.hidden` fields. Kept only so `adminFieldToInputSchema`'s
 * switch stays exhaustive over every `AdminDataField` member.
 *
 * @param props - Input props.
 * @param props.field - The resolved `commitTs` field definition.
 * @returns `z.unknown().optional()` — accepts and ignores anything.
 */
export function commitTsFieldToInputSchema(props: { field: CommitTsField }): ZodType {
  return applyBaseInputSchemaMeta({ field: props.field, inputSchema: z.unknown().optional() });
}
