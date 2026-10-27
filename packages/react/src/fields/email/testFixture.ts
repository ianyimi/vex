import { email, type EmailField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * `email` field fixture — drives `runFieldInputContractSuite` in
 * `components/fields/email/Input.test.tsx`.
 *
 * `required: true` with no `min`/`max` keeps `emailFieldToInputSchema`'s
 * `"This field is required."` message active for the base contract's
 * missing-value assertions.
 */
export const emailFieldFixture: FieldFixture<EmailField, string> = {
  fieldType: "email",
  fieldDef: email({ label: "Contact Email", required: true }),
  valid: "jane@example.com",
  invalid: undefined,
  empty: undefined,
};
