import { keyValue, number, type KeyValueField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * `keyValue` field fixture — the container's OWN contract. A single
 * `number()` value field keeps this fixture's own round-trip generic;
 * nested-child coverage across every field type lives in
 * `runNestedFieldContainerSuite`, not here.
 *
 * `invalid`'s `_bad` key fails `isValidRecordKey`'s reserved-prefix check
 * inside `keyValueFieldToInputSchema`'s `z.record(...)` — the field itself
 * doesn't need `required: true` for this to be a real validation failure.
 */
export const keyValueFieldFixture: FieldFixture<KeyValueField, Record<string, number>> = {
  fieldType: "keyValue",
  fieldDef: keyValue({ label: "Scores", value: number({ label: "Score", required: true }) }),
  valid: { alpha: 1 },
  invalid: { _bad: 1 },
  empty: {},
};
