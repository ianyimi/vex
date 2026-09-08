import { group, text, type GroupField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `group` field fixture — the container's OWN contract. A single simple
 * `text()` sub-field ("title") keeps this fixture's own round-trip generic;
 * nested-child coverage across every field type lives in
 * `runNestedFieldContainerSuite`, not here.
 *
 * `invalid`'s `title: undefined` fails `title`'s own required `text()`
 * schema inside `groupFieldToInputSchema`'s `z.object({...})` — the group
 * itself doesn't need `required: true` for this to be a real validation
 * failure.
 */
export const groupFieldFixture: FieldFixture<GroupField, Record<string, unknown>> = {
  fieldType: "group",
  fieldDef: group({
    label: "Details",
    fields: { title: text({ label: "Title", required: true }) },
  }),
  valid: { title: "Hello" },
  invalid: { title: undefined },
  empty: {},
};
