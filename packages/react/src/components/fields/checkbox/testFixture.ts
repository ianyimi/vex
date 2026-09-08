import { checkbox, type CheckboxField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Fixture for the `checkbox` field type — a boolean toggle.
 *
 * `invalid` is `undefined` even though nothing fails this field's schema:
 * `checkboxFieldToInputSchema` ends in an unconditional
 * `z.boolean().default(field.defaultValue)`, so every boolean AND a missing
 * value all pass. That deliberately trips the shared contract's
 * schema-accepts-`invalid` assertion, which names the defect (required-ness is
 * unenforceable for this field type) and records it as a finding.
 */
export const checkboxFieldFixture: FieldFixture<CheckboxField, boolean> = {
  fieldType: "checkbox",
  fieldDef: checkbox({ label: "Published", required: true }),
  valid: true,
  invalid: undefined,
  empty: false,
};
