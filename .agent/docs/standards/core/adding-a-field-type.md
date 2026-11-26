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

`nullable` (a `BaseFieldInput`/`BaseField` option, see `field-config-conventions.md`) needs no
type-specific code in `config.ts`/`validator.ts`/`inputSchema.ts` — `applyBaseValidators()`/
`applyBaseInputSchemaMeta()` already apply it for every field that calls them. A container type
(no natural empty input state) additionally wires `FormFieldLayout`'s `isNull`/`onIsNullChange`
in its own `fields/<type>/Field.tsx`, the way `group`/`array`/`blocks`/`json`/`richtext`/
`keyValue`/`variant` do, and sets `hasNullToggle: true` on its `ADMIN_FIELDS` entry (see below);
a type with a natural empty state (e.g. `bytes`) leaves `hasNullToggle: false`.

## Core shared updates
6. `fields/constants.ts` — `ADMIN_FIELDS` entry `{ type, interfaceType, validator,
   defaultValue, kind, inputMasks, hasNullToggle }` — `hasNullToggle` is required on every
   entry, not optional (see above).
7. `fields/types.ts` — add `<Type>Field` to the `AdminField` union via BOTH an `export *
   from "./<type>/types"` barrel re-export AND an explicit `import { <Type>Field } from
   "./<type>"` used in the union type itself — the barrel alone does not make the type
   reachable from the union.
8. `fields/index.ts` — `export * from "./<type>"`.
9. `fields/validators/index.ts` + 10. `fields/inputSchemas/index.ts` — add
   switch cases (exhaustiveness-checked against the `AdminField` union).

A field type that maps to more than one Convex validator shape (today: `number`, `select`,
`relationship`, `upload`) adds an optional `schema?: { validator?: <subset> }` to its
`<Type>FieldInput`, drawn from `FIELD_SCHEMA_VALIDATORS` (`fields/constants.ts`) — never an
inline literal union. `validator.ts` branches on the resolved `field.schema?.validator` to emit
the alternate Convex validator source string; `config.ts` stamps the matching `interfaceType`.
When the type also has `hasMany`, type `schema` as `never` when `hasMany: true` — the override
only applies to a single-value field (see `field-config-conventions.md`).

## React — `packages/react/src/fields/<type>/`
11. `Field.tsx` — exports `<Type>FieldAdmin(props: FieldComponentProps<...>)`;
    resolves `admin.components.Input` via `useFieldControlOverride()`, then
    renders the matching `forms/` leaf (or a new one under `forms/` if the
    widget needs new list/layout mechanics) wrapped in `<AdminFieldBinding>`.
    A container type (`hasNullToggle: true`) wires `isNull`/`onIsNullChange`
    here too.
12. `Cell.tsx` — `<Type>FieldCell(props: CellComponentProps<<Type>Field>)`.
13. `columnDef.tsx` — `<type>FieldToColumnDef()` factory.
14. `testFixture.ts` — exports a `FieldFixture` (`fieldType`, a configured
    `fieldDef`, `valid`/`invalid`/`empty` values) for the shared
    `@vexcms/react/testing` contract suites.
15. `index.ts` — re-export the three components.

Then every one of these shared registrations — all required, TS only catches some of them:
- `packages/react/src/adapter.ts` — `[ADMIN_FIELDS.<type>.type]: { field: <Type>FieldAdmin,
  cell: <Type>FieldCell }` in `buildReactAdapter()`'s `fields` map (TS-enforced completeness
  against the `AdminField` union).
- `packages/react/src/adminEntry.ts` — re-export the new field's config function alongside
  its siblings.
- `packages/react/src/index.ts` — re-export the config function (and any field-local types a
  consumer needs, e.g. a re-typed wrapper mirroring core's generics).
- `packages/react/src/fields/index.tsx` — add a `case ADMIN_FIELDS.<type>.type:` arm to the
  `columnDef` switch.
- `packages/react/src/forms/useAppForm.ts` — add the type's `fieldComponents` entry.
- `packages/react/src/forms/index.ts` — re-export any new `forms/` leaf component.
- `packages/react/src/testing/fixtures/index.ts` — re-export the new `testFixture.ts`.
- `packages/react/src/collections/listView/filters/listViewFilterOperators.ts` — add the
  type's filter operator set (or register none, mirroring `group`/`json`, for a type with no
  meaningful single-value comparison).
- Telemetry (`packages/telemetry/src/anonymizeConfig.ts`) — add the type's case to the field
  walker so its config is represented (allowlisted attributes only) in `AnonymizedField`.
- A container type additionally registers in
  `packages/react/src/testing/nestedFieldContainer.ts` (`container: "<type>"`) so the shared
  nested-container contract suite covers it.

## Tests + verification
- Colocate `validator.test.ts` + `inputSchema.test.ts` (see
  `testing/field-type-testing.md`), and `Field.test.tsx`/`Cell.test.tsx`/
  `columnDef.test.ts` next to the react files.
- `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/react typecheck`;
  add the field to a collection in `apps/test`, render in create modal + list
  view.
