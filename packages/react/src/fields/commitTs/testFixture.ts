import { commitTs, type CommitTsField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * Fixture for the `commitTs` field type — a read-only, database-stamped
 * Unix-ms timestamp (resolved from Convex's ns `bigint` before it ever
 * reaches this fixture's own consumers). `invalid`/`empty` are `undefined`:
 * the field has no form input to validate — `commitTsFieldToInputSchema`
 * accepts anything.
 */
export const commitTsFieldFixture: FieldFixture<CommitTsField, number> = {
  fieldType: "commitTs",
  fieldDef: commitTs({ label: "Updated At" }),
  valid: 1735689600000,
  invalid: undefined,
  empty: undefined,
};
