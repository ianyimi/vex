import { array, text, type ArrayField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `array` field fixture — the container's OWN contract (add/remove, nested
 * value round-trip, and readOnly cascade across every child field type are
 * covered separately by `runNestedFieldContainerSuite`). `items` is a simple
 * `text()` sub-field so this fixture only exercises the array's own behavior.
 *
 * `min: { value: 1 }` makes an empty array fail validation — `array`'s
 * `arrayFieldToInputSchema` REPLACES the `required`-only check with the `min`
 * check whenever both are set (see `packages/core/src/fields/array/inputSchema.ts`),
 * so `required` alone would never surface as `invalid`'s failure reason.
 */
export const arrayFieldFixture: FieldFixture<ArrayField<string>, string[]> = {
  fieldType: "array",
  fieldDef: array({
    label: "Tags",
    items: text({ label: "Tag", required: true }),
    required: true,
    min: { value: 1 },
  }),
  valid: ["First tag", "Second tag"],
  invalid: [],
  empty: [],
};
