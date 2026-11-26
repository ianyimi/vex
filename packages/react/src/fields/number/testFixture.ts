import { number, type NumberField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * Fixture for the `number` field type — a bounded quantity.
 *
 * `min`/`max` are set so `number/Input.test.tsx`'s `extra` can prove the input
 * performs no client-side range clamping (`NumberFieldInput` never forwards
 * `fieldDef.min`/`fieldDef.max` to the underlying `<input>` — range enforcement
 * lives entirely in `numberFieldToInputSchema` at submit time).
 */
export const numberFieldFixture: FieldFixture<NumberField, number> = {
  fieldType: "number",
  fieldDef: number({
    label: "Quantity",
    required: true,
    min: [0, "Quantity cannot be negative."],
    max: [100, "Quantity cannot exceed 100."],
  }),
  valid: 42,
  invalid: -1,
  empty: undefined,
};

const int64FieldDef: NumberField = number({
  label: "View Count",
  required: true,
  schema: { validator: "int64" },
  min: [0n, "View Count cannot be negative."],
  max: [1000n, "View Count cannot exceed 1000."],
});

/**
 * Fixture for a `number()` field storing `v.int64()` — `schema: {
 * validator: "int64" }`, a native `bigint` end to end. Registered as an
 * `extraFieldFixtures.number` entry (`testing/fixtures/index.ts`), run
 * through the same shared contract suite as {@link numberFieldFixture} so
 * `BigintNumberControl` (the int64 field's own control, distinct from the
 * `type="number"` control `numberFieldFixture` exercises) gets the same
 * public coverage.
 *
 * `invalid` is `-1n` — below `min` — same choice {@link numberFieldFixture}
 * makes for the same reason: a genuinely out-of-range value, not an
 * artifact of any schema defect.
 */
export const int64NumberFieldFixture: FieldFixture<NumberField, bigint> = {
  fieldType: "number",
  fieldDef: int64FieldDef,
  valid: 42n,
  invalid: -1n,
  empty: undefined,
};
