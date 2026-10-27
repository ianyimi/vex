import { ADMIN_FIELDS, json, type JsonField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * `json` field fixture — drives `runFieldInputContractSuite` in
 * `components/fields/json/Input.test.tsx` and `runFieldCellContractSuite` in
 * `Cell.test.tsx`.
 *
 * `valid` is a plain number (`42`), not an object or array: the shared input
 * contract's `setControlValue` types `String(value)` verbatim into the
 * textarea and expects `JSON.parse` on that exact text to round-trip back to
 * `valid` — true for a bare JSON scalar, not for `String({})` (produces
 * `"[object Object]"`) or `String([1, 2])` (produces `"1,2"`, not valid
 * JSON). The Cell contract's generic truncation assertion can't grow a
 * number fixture the way it grows a string/array/object one, so
 * `Cell.test.tsx` passes `truncates: false` and adds its own dedicated
 * truncation test against a real large object instead.
 */
export const jsonFieldFixture: FieldFixture<JsonField, unknown> = {
  fieldType: ADMIN_FIELDS.json.type,
  fieldDef: json({ label: "Settings", required: true }),
  valid: 42,
  invalid: undefined,
  empty: undefined,
};
