import { number, type NumberField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

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
    min: { value: 0, error: "Quantity cannot be negative." },
    max: { value: 100, error: "Quantity cannot exceed 100." },
  }),
  valid: 42,
  // NOT `undefined`: `numberFieldToInputSchema` ends every branch in an
  // unconditional `.default(field.defaultValue)`, so `undefined` is silently
  // replaced by `0` and PASSES. `-1` genuinely fails, against the real
  // `min` message below, so the shared contract's error-timing test has a
  // real error to render. The unconditional-`.default()` defect itself is
  // pinned by its own test in `Input.test.tsx`.
  invalid: -1,
  empty: 0,
};
