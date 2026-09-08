import { select, type SelectField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

const fieldDef: SelectField = select({
  label: "Status",
  required: true,
  hasMany: true,
  options: [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
    { label: "Archived", value: "archived" },
  ],
  admin: {
    placeholder: "Choose a status",
  },
});

/**
 * Fixture for the `select` field type — a multi-option, `hasMany: true`
 * choice field. `fieldDef.options` supplies the three choices the shared
 * contract renders and the `Input.test.tsx` `extra` assertions pick apart.
 * `admin.placeholder` is set (default is `""`, which is falsy and renders
 * nothing) so both the shared contract's placeholder check and this type's
 * own nothing-selected assertion have real text to find.
 *
 * `invalid` is `["retired"]` — a value that is not one of `fieldDef.options`.
 * This is deliberate, not arbitrary: `selectFieldToInputSchema` never adds a
 * `.min(1)` to the array, only `.default(field.defaultValue)`, so on a
 * `select` — unlike `text` — `required: true` does NOT reject an empty
 * selection; both `undefined` and `[]` satisfy the schema via its baked-in
 * default (verified directly: `schema.safeParse(undefined)` and
 * `schema.safeParse([])` both succeed with `data: []`). The only value
 * guaranteed to fail is one outside the configured enum — which is also
 * exactly the "enum-validation failure" the type-specific coverage is asked
 * for. The shared contract's "shows an error only after submission" test
 * exercises it generically, with the real `z.enum(...)` message produced by
 * `packages/core/src/fields/select/inputSchema.ts`
 * (`Invalid option: expected one of "draft"|"published"|"archived"`).
 *
 * A single fixture can only carry one `fieldDef`, so the `hasMany: false`
 * single-select variant, an empty-`options` variant, and a duplicate-value
 * variant are all built inline inside `Input.test.tsx`'s `extra` instead.
 */
export const selectFieldFixture: FieldFixture<SelectField, string[]> = {
  fieldType: "select",
  fieldDef,
  valid: ["draft", "published"],
  invalid: ["retired"],
  empty: [],
};
