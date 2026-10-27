---
applies_to: ["packages/core/src/fields/**", "packages/react/src/fields/**", "packages/react/src/adapter.ts"]
---
# Adding a Field Type (verified recipe)

Verified against `packages/core/src/fields/text/` (template for every
single-control data field) and `packages/core/src/fields/upload/` (template
for a field with an async side-effect + helper widgets). Full write-up with
override-slot details lives at `apps/docs/src/content/docs/dev/adding-a-field-type.mdx` —
this file is the condensed checklist.

## Core field module — `packages/core/src/fields/<type>/`
1. `types.ts` — `<Type>FieldInput extends BaseFieldInput` (all optional) +
   `<Type>Field extends BaseField` (resolved, required props). Both carry
   `readonly type`.
2. `config.ts` — `function <type>(options?): <Type>Field` applies defaults
   via nested spread merge; canonical deep-merge example:
   `packages/core/src/fields/date/config.ts`.
3. `validator.ts` — `<type>FieldToValidator({ field }): string`, wrapped
   with `applyBaseValidators()` (adds `v.optional()` when not required).
4. `inputSchema.ts` — `<type>FieldToInputSchema({ field }): ZodType`,
   wrapped with `applyBaseInputSchemaMeta()`.
5. `index.ts` — barrel: types, config, validator, inputSchema.

## Core shared updates
6. `fields/constants.ts` — `ADMIN_FIELDS` entry `{ type, interfaceType,
   validator, defaultValue, kind }`.
7. `fields/types.ts` — add `<Type>Field` to the `AdminField` union.
8. `fields/index.ts` — `export * from "./<type>"`.
9. `fields/validators/index.ts` + 10. `fields/inputSchemas/index.ts` — add
   switch cases (exhaustiveness-checked against the `AdminField` union).

## React — `packages/react/src/fields/<type>/`
11. `Field.tsx` — exports `<Type>FieldAdmin(props: FieldComponentProps<...>)`;
    resolves `admin.components.Input` via `useFieldControlOverride()`, then
    renders the matching `forms/` leaf (or a new one under `forms/` if the
    widget needs new list/layout mechanics) wrapped in `<AdminFieldBinding>`.
12. `Cell.tsx` — `<Type>FieldCell(props: CellComponentProps<<Type>Field>)`.
13. `columnDef.tsx` — `<type>FieldToColumnDef()` factory.
14. `testFixture.ts` — exports a `FieldFixture` (`fieldType`, a configured
    `fieldDef`, `valid`/`invalid`/`empty` values) for the shared
    `@vexcms/react/testing` contract suites.
15. `index.ts` — re-export the three components.
16. `packages/react/src/adapter.ts` — add
    `[ADMIN_FIELDS.<type>.type]: { field: <Type>FieldAdmin, cell: <Type>FieldCell }`
    to `buildReactAdapter()`'s `fields` map (TS enforces completeness against
    the `AdminField` union); `fields/registry.ts`'s
    `fieldToFieldComponent`/`fieldToCellComponent` read this map.
17. `packages/react/src/index.ts` — re-export the config function.

## Tests + verification
- Colocate `validator.test.ts` + `inputSchema.test.ts` (see
  `testing/field-type-testing.md`), and `Field.test.tsx`/`Cell.test.tsx`/
  `columnDef.test.ts` next to the react files.
- `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/react typecheck`;
  add the field to a collection in `apps/test`, render in create modal + list
  view.
