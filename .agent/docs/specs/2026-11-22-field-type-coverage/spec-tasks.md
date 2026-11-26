---
status: draft
spec_id: 2026-11-22-field-type-coverage
touches: []
prompt_version: 1
---

# 2026-11-22-field-type-coverage — Tasks

Launch plan item 18 (FT). After this spec, every Convex validator shape an existing table can use maps
to a Vex field, so projects can adopt VexCMS without rewriting stored data. It adds three fields
(`bytes()`, `keyValue()`, `variant()`), a top-level `nullable` on every data field, and a
`schema.validator` storage override on `number` (`"int64"`), `select` (`"literal" | "string"`) and
`relationship`/`upload` (`"id" | "string"`) when `hasMany` is false. It also moves the Better Auth
adapter's `references` fields onto `relationship({ schema: { validator: "string" } })`. Each step
adds its fields to a new `apps/test` dogfood collection, `storageShapes`, so the step can be seen in
the admin as soon as it lands.

## Step 1 — Convex-value-safe serialization and equality [agent]
Why: `bigint` (int64) and `ArrayBuffer` (bytes) values throw in `JSON.stringify`. The affected
sites are the group/array/blocks cells, the peek JSON tab and copy button, the block clipboard, and
the `where`-tree comparisons. Every later step stores one of these values, so the helpers land
first. Equality is already safe: `valuesEqual` compares bigint and `ArrayBuffer` by content.
Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`; `pnpm typecheck`.
- [x] core: `utils/convexValueJson.ts` (`stringifyConvexValue`, `serializeConvexValue`, `parseConvexValue`) + colocated test; `valuesEqual` bigint test case
- [x] core: export the helpers from `utils/index.ts`
- [x] react: `fields/{group,array,blocks}/Cell.tsx` + `fields/array/Display.tsx` use the display stringify
- [x] react: `collections/listView/peek/ListViewPeek/ListViewPeekJsonTab.tsx` + `ListViewPeekCopyButton.tsx` use it
- [x] react: `fields/blocks/useBlockClipboard.ts` round-trips through the lossless serializer
- [x] react: `where` comparisons in `useListViewUrlState.ts`, `ListViewFilterBuilder/index.tsx`, `useSavedListViews.ts` use `valuesEqual`
- [x] tests for each touched react site with a bigint and an ArrayBuffer value

## Step 2 — `nullable` on every data field [agent]
Why: `v.nullable(X)` columns are common in existing tables, and no field can describe them today.
`nullable: true` emits `v.nullable(X)`, wrapped in `v.optional` when the field isn't required, and
types the value `T | null`. A cleared input writes `null`.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test && pnpm --filter test vex:generate && pnpm typecheck` (generated `v.nullable(...)` / `| null`)
- [x] core `fields/baseTypes.ts`: `nullable?: boolean` on `BaseFieldInput`, `nullable: boolean` on `BaseField`; every data field's `config.ts` resolves it (default `false`)
- [x] core `fields/validators/utils.ts`: `applyBaseValidators` wraps `v.nullable(...)` before `v.optional(...)` + test
- [x] core `fields/inputSchemas/utils.ts`: `applyBaseInputSchemaMeta` adds `.nullable()` + test
- [x] core interface generation emits `T | null` for nullable fields (top-level and nested `childInterfaceType`) + test
- [x] core where compilation: `isEmpty`/`isNotEmpty` treat `null` as empty + test
- [x] react: form load maps `null` to the field's empty form value; save maps a nullable field's empty value to `null` + tests
- [x] react: container fields (group/array/blocks/json/richtext) render a null toggle in `FormFieldLayout` when `nullable` + test
- [x] telemetry `anonymizeConfig.ts`: record `nullable`
- [x] apps/test: new `storageShapes` collection (`TABLE_SLUG_STORAGE_SHAPES`) with nullable text/number/select/group fields; register it in the config and the collections barrel

## Step 3 — `number({ schema: { validator: "int64" } })` [agent]
Why: int64 counters and ids (`v.int64()`, `bigint`) have no field. The override keeps the number
input and stores a native `bigint` in the schema, the generated types, Vex reads and the form.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test && pnpm --filter test vex:generate && pnpm typecheck` (generated `v.int64()` / `bigint`)
- [x] core `fields/number/types.ts`: `Float64NumberField | Int64NumberField` union; `schema?: { validator?: "int64" }`; bigint min/max/default when int64; `isInt64NumberField` predicate in `fields/number/utils.ts`
- [x] core `fields/number/config.ts`: stamp `interfaceType` `"bigint"` + default `0n` for int64 + test
- [x] core `fields/number/validator.ts`: `v.int64()` + test
- [x] core `fields/number/inputSchema.ts`: `z.bigint()` with min/max + test
- [x] core `collections/listView/listViewUrlState.ts`: `bigint` filter value kind (decimal string in the URL, `BigInt` on decode) + test
- [x] react `forms/NumberField.tsx` + `fields/number/Field.tsx`: integer text entry bound to a `bigint` value + tests
- [x] react `fields/number/{Cell,FilterInput}.tsx`: format and filter `bigint` values + tests
- [x] telemetry: record `schema.validator`
- [x] apps/test `storageShapes`: an int64 counter field

## Step 4 — `select({ schema: { validator: "literal" | "string" } })` [agent]
Why: enum columns (`v.union(v.literal(...))`, `v.string()`) are scalar. `select()` always stores an
array, even with `hasMany: false`. When `hasMany` is true, the override is typed `never`.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test && pnpm --filter test vex:generate && pnpm typecheck`
- [x] core `fields/select/types.ts`: `schema` input typed by `hasMany` (`never` when true); interface type `Option` (literal) or `string` (string)
- [x] core `fields/select/{config,validator,inputSchema}.ts` + tests
- [x] core `db/queryArgs.ts`: an `eq` on scalar select storage compares directly, with no array wrap + test
- [x] core interface generation: scalar `{FieldKey}Option` / `string` instead of `Option[]` + test
- [x] react `fields/select/{Field,Cell,FilterInput}.tsx` + `forms/SelectField.tsx`: scalar value binding + tests
- [x] telemetry: record `schema.validator`
- [x] apps/test `storageShapes`: literal and string single selects

## Step 5 — `relationship`/`upload` `schema: { validator: "id" | "string" }` [agent]
Why: a single `v.id("x")` foreign key, or a string id kept for a library (Better Auth), is the most
common Convex reference shape. Today every reference is stored as an array.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test && pnpm --filter test vex:generate && pnpm typecheck`
- [x] core `fields/{relationship,upload}/{types,config,validator,inputSchema}.ts`: `schema` input (`never` when `hasMany`); `Id<slug>` / `string` interface type + tests
- [x] core `db/populate.ts`: populate a scalar id (`normalizeId` for string storage) + tests (`db/depth.ts` and `resolveCollectionIndexes.ts` are storage-agnostic; no change)
- [x] core `db/queryArgs.ts`: `isArrayStoredField` skips scalar storage + test
- [x] core `access/buildChecks.ts` (`indexedOwnerCheck` wraps only array storage), `versions/assertNoDraftRelationships.ts`: scalar ids + tests
- [x] core typing: `PopulateMapEntry` `scalar?: true`, `ApplyEntryPopulate` single doc, `RelationshipTargetOf` reads `CollectionsPopulateMap` + `storageShapes.typecheck.ts`
- [x] react `fields/{relationship,upload}/{Field,Cell,Display,columnDef}.tsx`: scalar values + tests (filter inputs and chips already take scalars)
- [x] telemetry: record `schema.validator`
- [x] apps/test `storageShapes`: `id` and `string` single relationships + a single upload

## Step 6 — Better Auth `references` → relationship with string storage [agent]
Why: auth reference columns (`session.userId`, `account.userId`, …) are relationships stored as
strings, but they map to `text()` today. The stored shape doesn't change (`v.string()`); the admin
gains relationship pickers, cells and populate.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/better-auth test && pnpm --filter test vex:generate && pnpm typecheck`
- [x] `packages/better-auth/src/adapter.ts`: `attr.references` → `relationship({ collection: { slug }, schema: { validator: "string" } })`; fix the JSDoc + tests
- [x] `addAuthCollectionFields` threads the auth `tables` map so `references.model` resolves to the registered slug (generated plugin schemas encode raw Better Auth attributes; no regeneration)

## Step 7 — `bytes()` [agent]
Why: `v.bytes()` (`ArrayBuffer`) has no field. The input has two tabs, like upload's: a file
picker, and a hex view edited in a textarea. Default `maxSize` is 512 KiB; the cell shows the
byte size.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test && pnpm --filter test vex:generate && pnpm typecheck`
- [x] core `fields/bytes/{types,config,validator,inputSchema,index}.ts` + tests; `ADMIN_FIELDS.bytes`, `AdminField` union, validator/inputSchema dispatch, `fields/index.ts`, `FIELD_TYPE_DEFAULT_WIDTH`
- [x] react `fields/bytes/{Field,Cell,Display,columnDef,testFixture,index}` + `forms/BytesField.tsx` (file and hex tabs) + tests; `adapter.ts`; `index.ts` re-export
- [x] react filter operators: `isEmpty`/`isNotEmpty` only
- [x] telemetry walker case
- [x] apps/test `storageShapes`: a bytes field

## Step 8 — `keyValue()` [agent]
Why: `v.record(keys, values)` has no field. Keys are `v.string()` or `v.id(collection)`; values are
one nested data field. The input is rows of key + value, with unique keys. It nests everywhere a
data field nests.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test && pnpm --filter test vex:generate && pnpm typecheck`
- [x] core `fields/keyValue/{types,config,validator,inputSchema,index}.ts` + tests; registrations as in step 7
- [x] core walkers: `fields/utils.ts` (`hasFieldConditions`), `fields/interfaceGen.ts`, `types/generateVexTypes.ts`, `db/depth.ts`/`db/populate.ts` (nested relationships), `fields/array/utils.ts` + `fields/blocks/utils.ts` (id backfill), `documents/cloneDocumentForDuplicate.ts` + tests
- [x] react `fields/keyValue/{Field,Cell,Display,columnDef,testFixture,index}` + `forms/KeyValueField.tsx` (incl. `useKeyValueRows`) + tests; adapter, index, `testing/nestedFieldContainer.ts`
- [x] telemetry walker case
- [x] apps/test `storageShapes`: a string-keyed and an id-keyed keyValue

## Step 9 — `variant()` [agent]
Why: a single (non-array) object union, and primitive unions, have no field. With `discriminator`
set, the field stores an object union keyed by that property, with no `id`/`blockName` keys.
Without it, it stores a primitive union whose members have distinct runtime kinds (checked when
the config is built). The admin shows a variant/type picker and the active member's input.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test && pnpm --filter test vex:generate && pnpm typecheck`
- [x] core `fields/variant/{types,config,validator,inputSchema,index}.ts` + tests (distinct-kind check throws `VexConfigError`); registrations as in step 7
- [x] core walkers as in step 8 (recursing into keyValue both ways), plus `globals/interfaceGen.ts`, type-level populate (`PopulateMapEntry` `variant`, discriminated mode) + tests
- [x] react `fields/variant/{Field,Cell,Display,columnDef,testFixture,index}` + `forms/VariantField.tsx` + tests; adapter, index, nested container
- [x] telemetry walker case
- [x] apps/test `storageShapes`: a discriminated variant and a string|number variant

## Step 10 — Dogfood run-through in the browser [agent]
Why: the acceptance gate is the admin itself. Every new input, cell, override and nullable path has
to work on a real deployment.
Verify: manual — on :3020, create, edit, clear (null) and save a `storageShapes` document with every field; list view cells, sort and filter; peek; duplicate; draft/version restore.
- [ ] `pnpm --filter test vex:generate`; read the `storageShapes` table in `convex/vex.schema.ts` and `vex.types.ts`
- [ ] browser pass on :3020 (attach only, P-024); record findings and fix them in the owning step's files

## Step 11 — Docs, telemetry audit, standards, changesets, bookkeeping [agent]
Why: the docs field catalog and the field-type recipe are what adopters and contributors read.
Telemetry has to describe the new field types and options accurately. The launch plan and backlog
have to reflect what shipped.
Verify: `pnpm --filter docs build`; `pnpm --filter @vexcms/telemetry test`; `pnpm lint`; `pnpm test`.
- [x] `apps/docs/src/content/docs/fields/{bytes,key-value,variant}.mdx`
- [x] `## Storage override` sections on the `number`/`select`/`relationship`/`upload` pages; `## Nullable values` on `fields/text.mdx` (the page others link to for shared options), linked from each touched page; storage-change migration note; `index.mdx` field count
- [x] `.agent/docs/standards/core/{adding-a-field-type,field-config-conventions}.md` + `apps/docs/.../dev/adding-a-field-type.mdx` updated
- [x] `.changeset/*.md` (patch, P-025) for core, react, better-auth, telemetry
- [x] telemetry audit: `anonymizeConfig.ts` covers every new field type and option (`nullable`, `schema.validator`, `bytes`/`keyValue`/`variant` attributes); the payload type, the receiver collections in `apps/test` (`telemetryEvents`/`telemetryProjects`, if they enumerate field types), the docs page listing collected telemetry data, and `fitTelemetryEvent` size limits stay consistent with each other
- [x] launch plan item 18 ticked; backlog § Field storage override removed (shipped)
