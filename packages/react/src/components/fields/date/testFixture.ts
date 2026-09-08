import { date, type DateField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Fixture for the `date` field type.
 *
 * `valid` is an ISO date string — `DateFieldInput` passes it straight to
 * `new Date(...)`, which parses ISO strings the same way it parses the
 * Unix-ms timestamps the field actually persists.
 */
export const dateFieldFixture: FieldFixture<DateField, string> = {
  fieldType: "date",
  fieldDef: date({ label: "Published At", required: true }),
  valid: "2025-06-15T10:30:00.000Z",
  invalid: undefined,
  empty: undefined,
};
