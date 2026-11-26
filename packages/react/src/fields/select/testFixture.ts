import { select, type SelectField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

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

const scalarFieldDef: SelectField = select({
  label: "Status",
  required: true,
  hasMany: false,
  schema: { validator: "literal" },
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
 * Fixture for a scalar `select()` — `hasMany: false` with a
 * `schema: { validator: "literal" }` override, storing one option value
 * directly instead of a one-element array. Registered as an
 * `extraFieldFixtures.select` entry (`testing/fixtures/index.ts`), run
 * through the same shared contract suite as {@link selectFieldFixture}.
 *
 * `invalid` is `"retired"` — not one of `fieldDef.options` — for the same
 * reason `selectFieldFixture` picks an out-of-enum value: the scalar input
 * schema's `required` branch is a bare `z.enum(optionValues)`, which DOES
 * reject an empty/missing value (unlike the array-storage schema's
 * `.default([])` fallback), so an out-of-enum value is the one input every
 * shared "rejects an invalid value" assertion can rely on here too.
 *
 * `empty` is `""` — `select()`'s own `config.ts` resolves
 * `defaultValue: ""` whenever `schema` is set, mirroring `[]` for array
 * storage.
 *
 * `cellTruncates: false` — `SelectFieldCell` renders matched OPTION LABELS,
 * never the raw stored value, and has no truncation logic of its own
 * (`title={joinedLabels}`, no `.slice()`). The generic over-length probe
 * repeats `valid` into one long, unmatched string that resolves to no
 * configured option, so there is nothing to truncate — unlike `select`'s
 * main (array) fixture, whose over-length value is built by repeating
 * real, matchable option values and happens to produce a long title.
 */
export const scalarSelectFieldFixture: FieldFixture<SelectField, string> = {
  fieldType: "select",
  fieldDef: scalarFieldDef,
  valid: "draft",
  invalid: "retired",
  empty: "",
  cellTruncates: false,
};
