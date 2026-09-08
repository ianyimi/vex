import { text, type TextField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `text` field fixture — drives `runFieldInputContractSuite` in
 * `components/fields/text/Input.test.tsx`.
 *
 * `required: true` with no `min`/`max` keeps `textFieldToInputSchema`'s
 * `"This field is required."` message active — `min`/`max` reassign the
 * schema unconditionally in a sibling `if`, silently overriding the
 * required-branch message (`packages/core/src/fields/text/inputSchema.ts`).
 */
export const textFieldFixture: FieldFixture<TextField, string> = {
  fieldType: "text",
  fieldDef: text({ label: "Title", required: true }),
  valid: "Hello World",
  invalid: undefined,
  empty: undefined,
};
