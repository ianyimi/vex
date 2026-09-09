import { checkbox, type CheckboxField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Fixture for the `checkbox` field type — a boolean toggle.
 *
 * `invalid` is `undefined`: `checkboxFieldToInputSchema` (CORE-1 fix) rejects
 * a missing value on a required field with a "This field is required."
 * message, while `true`/`false` both remain valid present values — "required"
 * on a checkbox means "present", not "checked".
 */
export const checkboxFieldFixture: FieldFixture<CheckboxField, boolean> = {
  fieldType: "checkbox",
  fieldDef: checkbox({ label: "Published", required: true }),
  valid: true,
  invalid: undefined,
  empty: false,
};
