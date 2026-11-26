---
status: draft
spec_id: 2026-11-22-field-type-coverage
touches:
  - "packages/core/src/utils/convexValueJson.ts"
  - "packages/core/src/utils/convexValueJson.test.ts"
  - "packages/core/src/utils/index.ts"
  - "packages/react/src/fields/group/Cell.tsx"
  - "packages/react/src/fields/group/Display.tsx"
  - "packages/react/src/fields/array/Cell.tsx"
  - "packages/react/src/fields/array/Display.tsx"
  - "packages/react/src/fields/blocks/Cell.tsx"
  - "packages/react/src/collections/listView/peek/ListViewPeek/ListViewPeekJsonTab.tsx"
  - "packages/react/src/collections/listView/peek/ListViewPeek/ListViewPeekCopyButton.tsx"
  - "packages/react/src/collections/listView/peek/ListViewPeek/ListViewPeekCopyButton.test.tsx"
  - "packages/react/src/fields/blocks/useBlockClipboard.ts"
  - "packages/react/src/fields/blocks/useBlockClipboard.test.ts"
  - "packages/react/src/collections/listView/useListViewUrlState.ts"
  - "packages/react/src/collections/listView/useListViewUrlState.test.ts"
  - "packages/react/src/collections/listView/filters/ListViewFilterBuilder/index.tsx"
  - "packages/react/src/collections/listView/filters/ListViewFilterBuilder/index.test.tsx"
  - "packages/react/src/collections/listView/savedListViews/useSavedListViews.ts"
  - "packages/react/src/collections/listView/savedListViews/useSavedListViews.test.ts"
  - "packages/react/src/forms/changedValues.ts"
  - "packages/core/src/fields/baseTypes.ts"
  - "packages/core/src/fields/constants.ts"
  - "packages/core/src/fields/validators/utils.ts"
  - "packages/core/src/fields/validators/utils.test.ts"
  - "packages/core/src/fields/inputSchemas/utils.ts"
  - "packages/core/src/fields/inputSchemas/utils.test.ts"
  - "packages/core/src/fields/childInterfaceType.ts"
  - "packages/core/src/fields/childInterfaceType.test.ts"
  - "packages/core/src/collections/interfaceGen.ts"
  - "packages/core/src/collections/interfaceGen.test.ts"
  - "packages/core/src/globals/interfaceGen.ts"
  - "packages/core/src/globals/interfaceGen.test.ts"
  - "packages/core/src/db/queryArgs.ts"
  - "packages/core/src/db/queryArgs.test.ts"
  - "packages/core/src/fields/utils.ts"
  - "packages/core/src/fields/utils.test.ts"
  - "packages/core/src/collections/utils.test.ts"
  - "packages/react/src/forms/FormFieldLayout.tsx"
  - "packages/react/src/forms/FormFieldLayout.test.tsx"
  - "packages/react/src/forms/GroupField.tsx"
  - "packages/react/src/forms/GroupField.test.tsx"
  - "packages/react/src/fields/group/Field.tsx"
  - "packages/react/src/forms/ArrayField.tsx"
  - "packages/react/src/fields/array/Field.tsx"
  - "packages/react/src/forms/BlocksField.tsx"
  - "packages/react/src/fields/blocks/Field.tsx"
  - "packages/react/src/forms/JsonField.tsx"
  - "packages/react/src/fields/json/Field.tsx"
  - "packages/react/src/forms/CheckboxField.tsx"
  - "packages/react/src/forms/CheckboxField.test.tsx"
  - "packages/react/src/fields/richtext/Field.tsx"
  - "packages/react/src/collections/editView/CollectionEditView.tsx"
  - "packages/react/src/globals/GlobalEditView.tsx"
  - "packages/react/src/media/MediaCollectionEditView.tsx"
  - "packages/react/src/versions/VersionPublishAction.tsx"
  - "packages/react/src/collections/listView/create/ListViewCreateDocumentForm.tsx"
  - "packages/telemetry/src/types.ts"
  - "packages/telemetry/src/anonymizeConfig.ts"
  - "packages/telemetry/src/anonymizeConfig.test.ts"
  - "apps/test/src/db/constants/index.ts"
  - "apps/test/src/vexcms/collections/storageShapes.ts"
  - "apps/test/src/vexcms/collections/index.ts"
  - "apps/test/src/vex.config.ts"
  - "packages/core/src/fields/number/types.ts"
  - "packages/core/src/fields/number/utils.ts"
  - "packages/core/src/fields/number/utils.test.ts"
  - "packages/core/src/fields/number/index.ts"
  - "packages/core/src/fields/number/config.ts"
  - "packages/core/src/fields/number/config.test.ts"
  - "packages/core/src/fields/number/validator.ts"
  - "packages/core/src/fields/number/validator.test.ts"
  - "packages/core/src/fields/number/inputSchema.ts"
  - "packages/core/src/fields/number/inputSchema.test.ts"
  - "packages/core/src/collections/listView/listViewUrlState.ts"
  - "packages/core/src/collections/listView/listViewUrlState.test.ts"
  - "packages/react/src/forms/NumberField.tsx"
  - "packages/react/src/forms/NumberField.test.tsx"
  - "packages/react/src/fields/number/Field.tsx"
  - "packages/react/src/fields/number/Field.test.tsx"
  - "packages/react/src/fields/number/Cell.tsx"
  - "packages/react/src/fields/number/Cell.test.tsx"
  - "packages/react/src/fields/number/FilterInput.tsx"
  - "packages/react/src/fields/number/FilterInput.test.tsx"
  - "packages/react/src/fields/number/columnDef.tsx"
  - "packages/react/src/fields/number/columnDef.test.ts"
  - "packages/core/src/fields/select/types.ts"
  - "packages/core/src/fields/select/types.typecheck.ts"
  - "packages/core/src/fields/select/config.ts"
  - "packages/core/src/fields/select/config.test.ts"
  - "packages/core/src/fields/select/validator.ts"
  - "packages/core/src/fields/select/validator.test.ts"
  - "packages/core/src/fields/select/inputSchema.ts"
  - "packages/core/src/fields/select/inputSchema.test.ts"
  - "packages/react/src/fields/select/Field.tsx"
  - "packages/react/src/forms/SelectField.tsx"
  - "packages/react/src/forms/SelectField.test.tsx"
  - "packages/react/src/fields/select/Cell.tsx"
  - "packages/react/src/fields/select/Cell.test.tsx"
  - "packages/react/src/fields/select/columnDef.tsx"
  - "packages/react/src/fields/select/Field.test.tsx"
  - "packages/core/src/fields/relationship/types.ts"
  - "packages/core/src/fields/relationship/config.ts"
  - "packages/core/src/fields/relationship/validator.ts"
  - "packages/core/src/fields/relationship/validator.test.ts"
  - "packages/core/src/fields/relationship/inputSchema.ts"
  - "packages/core/src/fields/relationship/inputSchema.test.ts"
  - "packages/core/src/fields/upload/types.ts"
  - "packages/core/src/fields/upload/config.ts"
  - "packages/core/src/fields/upload/validator.ts"
  - "packages/core/src/fields/upload/validator.test.ts"
  - "packages/core/src/fields/upload/inputSchema.ts"
  - "packages/core/src/fields/upload/inputSchema.test.ts"
  - "packages/core/src/types/generated.ts"
  - "packages/core/src/db/types.ts"
  - "packages/core/src/db/populate.ts"
  - "packages/core/src/db/test/convex/schema.ts"
  - "packages/core/src/db/populate.test.ts"
  - "packages/core/src/access/buildChecks.ts"
  - "packages/core/src/access/buildChecks.test.ts"
  - "packages/core/src/versions/assertNoDraftRelationships.ts"
  - "packages/core/src/versions/assertNoDraftRelationships.test.ts"
  - "packages/react/src/fields/relationship/Field.tsx"
  - "packages/react/src/fields/relationship/Field.test.tsx"
  - "packages/react/src/fields/relationship/Cell.tsx"
  - "packages/react/src/fields/relationship/Cell.test.tsx"
  - "packages/react/src/fields/relationship/Display.tsx"
  - "packages/react/src/fields/relationship/Display.test.tsx"
  - "packages/react/src/fields/relationship/columnDef.tsx"
  - "packages/react/src/fields/upload/Field.tsx"
  - "packages/react/src/fields/upload/Field.test.tsx"
  - "packages/react/src/fields/upload/Cell.tsx"
  - "packages/react/src/fields/upload/Cell.test.tsx"
  - "packages/react/src/fields/upload/Display.tsx"
  - "packages/react/src/fields/upload/Display.test.tsx"
  - "packages/react/src/fields/upload/columnDef.tsx"
  - "apps/test/src/vexcms/collections/storageShapes.typecheck.ts"
  - "packages/better-auth/src/adapter.ts"
  - "packages/better-auth/src/adapter.test.ts"
  - "packages/core/src/fields/bytes/types.ts"
  - "packages/core/src/fields/bytes/config.ts"
  - "packages/core/src/fields/bytes/validator.ts"
  - "packages/core/src/fields/bytes/inputSchema.ts"
  - "packages/core/src/fields/bytes/index.ts"
  - "packages/core/src/fields/bytes/config.test.ts"
  - "packages/core/src/fields/bytes/validator.test.ts"
  - "packages/core/src/fields/bytes/inputSchema.test.ts"
  - "packages/core/src/fields/types.ts"
  - "packages/core/src/fields/index.ts"
  - "packages/core/src/fields/validators/index.ts"
  - "packages/core/src/fields/inputSchemas/index.ts"
  - "packages/core/src/collections/listView/listViewColumnConfig.ts"
  - "packages/react/src/forms/BytesField.tsx"
  - "packages/react/src/forms/index.ts"
  - "packages/react/src/forms/useAppForm.ts"
  - "packages/react/src/fields/bytes/Field.tsx"
  - "packages/react/src/fields/bytes/Cell.tsx"
  - "packages/react/src/fields/bytes/Display.tsx"
  - "packages/react/src/fields/bytes/columnDef.tsx"
  - "packages/react/src/fields/bytes/testFixture.ts"
  - "packages/react/src/fields/bytes/index.ts"
  - "packages/react/src/fields/bytes/Field.test.tsx"
  - "packages/react/src/fields/bytes/Cell.test.tsx"
  - "packages/react/src/fields/bytes/Display.test.tsx"
  - "packages/react/src/fields/bytes/columnDef.test.ts"
  - "packages/react/src/adapter.ts"
  - "packages/react/src/adminEntry.ts"
  - "packages/react/src/index.ts"
  - "packages/react/src/fields/index.tsx"
  - "packages/react/src/collections/listView/filters/listViewFilterOperators.ts"
  - "packages/react/src/testing/fixtures/index.ts"
  - "packages/core/src/fields/keyValue/types.ts"
  - "packages/core/src/fields/keyValue/config.ts"
  - "packages/core/src/fields/keyValue/validator.ts"
  - "packages/core/src/fields/keyValue/utils.ts"
  - "packages/core/src/fields/keyValue/inputSchema.ts"
  - "packages/core/src/fields/keyValue/index.ts"
  - "packages/core/src/fields/keyValue/validator.test.ts"
  - "packages/core/src/fields/keyValue/inputSchema.test.ts"
  - "packages/core/src/fields/interfaceGen.ts"
  - "packages/core/src/db/depth.ts"
  - "packages/core/src/db/depth.test.ts"
  - "packages/core/src/fields/array/utils.ts"
  - "packages/core/src/fields/array/utils.test.ts"
  - "packages/core/src/fields/blocks/utils.ts"
  - "packages/core/src/fields/blocks/utils.test.ts"
  - "packages/core/src/documents/cloneDocumentForDuplicate.ts"
  - "packages/core/src/documents/cloneDocumentForDuplicate.test.ts"
  - "packages/core/src/types/generateVexTypes.ts"
  - "packages/core/src/types/generateVexTypes.test.ts"
  - "packages/react/src/fields/keyValue/Field.tsx"
  - "packages/react/src/forms/KeyValueField.tsx"
  - "packages/react/src/forms/KeyValueField.test.tsx"
  - "packages/react/src/fields/keyValue/Cell.tsx"
  - "packages/react/src/fields/keyValue/Display.tsx"
  - "packages/react/src/fields/keyValue/columnDef.tsx"
  - "packages/react/src/fields/keyValue/testFixture.ts"
  - "packages/react/src/fields/keyValue/index.ts"
  - "packages/react/src/fields/keyValue/Cell.test.tsx"
  - "packages/react/src/fields/keyValue/Display.test.tsx"
  - "packages/react/src/fields/keyValue/columnDef.test.ts"
  - "packages/react/src/fields/keyValue/Field.test.tsx"
  - "packages/react/src/testing/nestedFieldContainer.ts"
  - "packages/core/src/fields/variant/types.ts"
  - "packages/core/src/fields/variant/utils.ts"
  - "packages/core/src/fields/variant/config.ts"
  - "packages/core/src/fields/variant/validator.ts"
  - "packages/core/src/fields/variant/inputSchema.ts"
  - "packages/core/src/fields/variant/index.ts"
  - "packages/core/src/fields/variant/config.test.ts"
  - "packages/core/src/fields/variant/validator.test.ts"
  - "packages/core/src/fields/variant/inputSchema.test.ts"
  - "packages/core/src/collections/api/types.ts"
  - "packages/react/src/fields/variant/testFixture.ts"
  - "packages/react/src/fields/variant/Cell.tsx"
  - "packages/react/src/fields/variant/Display.tsx"
  - "packages/react/src/fields/variant/columnDef.tsx"
  - "packages/react/src/fields/variant/Field.tsx"
  - "packages/react/src/fields/variant/index.ts"
  - "packages/react/src/forms/VariantField.tsx"
  - "packages/react/src/fields/variant/Field.test.tsx"
  - "apps/docs/src/content/docs/fields/bytes.mdx"
  - "apps/docs/src/content/docs/fields/key-value.mdx"
  - "apps/docs/src/content/docs/fields/variant.mdx"
  - "apps/docs/src/content/docs/fields/number.mdx"
  - "apps/docs/src/content/docs/fields/select.mdx"
  - "apps/docs/src/content/docs/fields/relationship.mdx"
  - "apps/docs/src/content/docs/fields/upload.mdx"
  - "apps/docs/src/content/docs/fields/text.mdx"
  - "apps/docs/src/content/docs/index.mdx"
  - ".agent/docs/standards/core/adding-a-field-type.md"
  - ".agent/docs/standards/core/field-config-conventions.md"
  - "apps/docs/src/content/docs/dev/adding-a-field-type.mdx"
  - "apps/docs/src/content/docs/guides/telemetry.mdx"
  - ".changeset/ft-core-field-coverage.md"
  - ".changeset/ft-react-field-coverage.md"
  - ".changeset/ft-better-auth-string-relationship.md"
  - ".changeset/ft-telemetry-field-coverage.md"
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - ".agent/docs/product/backlog.md"
  - ".agent/docs/product/launch-coordination.md"
prompt_version: 1
---

# 2026-11-22-field-type-coverage — Spec

## Overview

Launch plan item 18 (FT). Existing Convex tables can only adopt VexCMS if every validator shape they
use maps to a Vex field. Today `v.int64`, `v.bytes`, `v.record`, a single object union, primitive
unions, nullable values, a single `v.id`, and a scalar enum have no field, because `select`,
`relationship` and `upload` always store arrays. This spec adds `bytes()`, `keyValue()` and
`variant()`, a top-level `nullable` option on every data field, and a `schema.validator` storage
override on `number` (`"int64"`), `select` (`"literal" | "string"`) and `relationship`/`upload`
(`"id" | "string"`). It also moves the Better Auth adapter's `references` columns onto relationship
fields with string storage. A new `apps/test` collection, `storageShapes`, exercises every path in
the admin.

## Design Decisions

1. `v.any()` → `json()` and nested `v.object()` → `group()` already exist and are not rebuilt. Checked
   against the code: the gaps were `v.int64`, `v.bytes`, `v.record`, a single object union,
   primitive unions, nullable values, a single `v.id`, and a scalar enum. `select`'s validator
   (`fields/select/validator.ts`) and the relationship/upload validators always emit `v.array(...)`.
   Why: build only what's missing.
2. The storage override lives under `schema: { validator }` on the field, with validator names that
   follow Convex: `number` → `"int64"`, `select` → `"literal" | "string"`, `relationship`/`upload` →
   `"id" | "string"`. The names come from the `FIELD_SCHEMA_VALIDATORS` constant map (P-003). There
   is no dedicated int64 field; int64 comes through `number()`. Why: the field keeps its own
   input and display, and only the stored shape changes.
3. With `hasMany: true`, `schema` is typed `never` via the shared
   `SchemaOverrideInput<THasMany, TValidator>` in `fields/baseTypes.ts`. To support that, `select`,
   `relationship` and `upload` gain a fourth generic, `THasMany`. Why: a multi-value field can't
   store a scalar.
4. Without `schema`, storage stays the same: `hasMany: false` still stores an array. Why: existing
   deployments, the examples and www need no migration.
5. int64 is a native `bigint` everywhere: the generated type `bigint`, Vex reads, the form, and
   min/max/default. Unlike `commitTs`, there is no conversion to `number`. TypeScript doesn't narrow
   the `NumberField` union on `field.schema?.validator`, so int64-only reads go through the
   `isInt64NumberField` predicate. Why: no precision loss past 2^53, and Vex reads match what
   `ctx.db` returns.
6. `select` with `"literal"` stores `v.union(v.literal(…))` (a single option becomes a bare
   `v.literal`) and is typed as the scalar `{FieldKey}Option`. With `"string"` it stores `v.string()`
   and is typed `string`; zod and the admin input still enforce the options. Why: off-list legacy
   values stay readable without lying about their type.
7. `relationship`/`upload` with `"id"` store `v.id("slug")` (`Id<"slug">`); with `"string"` they
   store `v.string()` (`string`). `PopulateMapEntry` gains `scalar?: true`, so a populated scalar
   types as a single document. `RelationshipTargetOf` reads `CollectionsPopulateMap` instead of the
   interface-type brand. Populate uses `normalizeId` for string storage. Why: the common Convex
   foreign-key shape, plus library-owned string ids, with no consumer casts (P-030).
8. New fields are named for their widget, per the naming rule: `bytes()`, `keyValue()`, `variant()`.
9. `variant()` has two modes, chosen by whether `discriminator` is set:
   - With it: inline `variants: { key: { label, fields } }` → `v.union(v.object({ [discriminator]:
     v.literal(key), … }), …)`. There are no `id`/`blockName` keys.
   - Without it: `variants: { name: <data field> }` → `v.union(<members>)`. Members must have
     distinct runtime kinds (`classifyVariantMemberKind`), enforced with `VexConfigError`.

   Members are never wrapped in `v.optional`. Populate types only the discriminated mode; the
   primitive mode is untyped at runtime, like `json()`. Why: existing object unions keep their exact
   shape, and primitive unions stay editable.
10. `keyValue()` keys are `v.string()`, or `v.id("slug")` via `keys: { collection: { slug } }`.
    Literal key sets aren't supported: Convex 1.49's `RecordKeyValidatorJSON` allows only
    string/id keys, and a fixed key set is a `group()`. The value is one nested data field, never
    `v.optional`. The form value stays the stored `Record<K, V>`; row editing is local state
    (`useKeyValueRows` in `forms/KeyValueField.tsx`), so keys with path-breaking characters never
    reach TanStack paths. Why: `Record` mirrors `group`'s document-shaped value.
11. `keyValue()` and `variant()` nest anywhere a data field nests, and every recursive walker handles
    them (interface gen, depth/populate, array/block id backfill, duplicate, telemetry).
12. `bytes()` input has two tabs, like upload: File (picker/drop) and Hex (editable textarea). It
    shows the size, a download link and a clear button. `maxSize` defaults to 524_288 bytes
    (`BYTES_FIELD_DEFAULT_MAX_SIZE`); `accept` is optional. The cell shows the byte size.
13. `nullable` is a top-level option on every data field. It emits `v.nullable(X)`, wrapped in
    `v.optional` when the field isn't required, and types the value `T | null`. A cleared scalar
    input writes `null` through `resolveNullableSaveValues` at every submit and autosave site; on
    load, `getFieldsDefaultValues` maps `null` back with `resolveNullableLoadValue`. Fields with no
    natural empty input (`ADMIN_FIELDS[*].hasNullToggle`: checkbox, group, array, blocks, json,
    richtext, keyValue, variant) render `NullFieldToggle` through `FormFieldLayout`'s
    `isNull`/`onIsNullChange`. Why: nullable columns are common in existing tables.
14. Better Auth `references` attributes become `relationship({ collection: { slug }, schema: { validator:
    "string" } })`. `betterAuthAttrToVexField` now receives the auth `tables` map to resolve
    `references.model` to the registered slug. Why: auth reference columns get pickers, cells and
    populate, and the stored shape doesn't change.
15. Document values are serialized through `stringifyConvexValue` for display (bigint as bare digits,
    `ArrayBuffer` as `"<N bytes>"`) and through `serializeConvexValue`/`parseConvexValue` (Convex
    JSON) for the block clipboard. `valuesEqual` already compares bigint and `ArrayBuffer` by
    content; `where`-tree comparisons switch to it. The clipboard storage format changes, so a block
    copied before upgrading reads as empty. Why: bigint and `ArrayBuffer` throw in `JSON.stringify`.
16. Mirrored systems:
    - `bytes`: `json` (scalar field with a custom editor) + `upload` (two-tab input).
    - `keyValue`: `group` (single nested container) + `array` (row editor).
    - `variant`: `blocks` (literal-discriminated object union) + `group` (object rendering).
    - `nullable`: the `applyBaseValidators`/`applyBaseInputSchemaMeta` seams.
    - Overrides: per-instance `interfaceType` stamping, as `relationship`/`upload` configs already do.
17. Dogfood: `apps/test` `storageShapes` (slug `storage_shapes`, drafts on), created in Step 2 and
    extended by each step. The browser pass runs on :3020 by attaching only (P-024).
18. Telemetry attributes are `nullable`, `schemaValidator`, `keyKind`, `hasDiscriminator` and
    `variantCount`; bytes reuses `max`/`hasAccept`. Step 11 audits telemetry end to end.
19. Changesets are `patch` (P-025) and are written in Step 11.

## Out of Scope

- Data migration when a field's storage changes on a populated table. The docs say to migrate
  manually.
- A bare `v.null()` field (`nullable` covers it).
- `schema` overrides on `hasMany` fields.
- Literal-key records.
- Auto-detecting Vex fields from an existing `convex/schema.ts`.
- The ADOPT adoption guide and schema-collision warning (launch item 19, separate spec).

## Implementation

### Step 1 — Convex-value-safe serialization and equality [agent]

> Writer note: `spec-tasks.md` lists `forms/changedValues.ts` as a site that "compares with the
> deep-equality helper" (checklist item, and the step's own "Why"). Reading
> `packages/react/src/forms/changedValues.ts` shows it performs no value comparison at all —
> `isFieldKeyDirty` reads TanStack's sticky `fieldMeta[key].isDirty` flag, and `changedValues`
> only copies keys flagged dirty into a fresh object. There is no `===`/reference comparison to
> replace. This section leaves the file untouched and records why, rather than inventing a
> comparison to "fix". Candidate resolutions for the stitcher: (a) drop the `changedValues.ts`
> checklist line from Step 1 entirely (no unsafe comparison exists there today); (b) if a future
> step adds a value comparison to `changedValues.ts`/`isFieldKeyDirty`, it must use `valuesEqual`
> then — noted here so that step doesn't re-litigate it.
>
> Also: the explicit file list (group/array/blocks Cell+Display, peek JSON tab, copy button,
> block clipboard) omits `fields/group/Display.tsx` and `fields/blocks/Display.tsx` — both read,
> neither calls `JSON.stringify` (they recurse into `DisplayFieldList`/child `Display`
> components instead; only the two `Cell.tsx` files and `fields/blocks/Display.tsx`'s sibling
> `Cell.tsx` serialize directly). `fields/array/Display.tsx` DOES call it, in its one fallback
> branch for an item type with no registered Display — included below. `group/Display.tsx`'s own
> JSDoc references `GroupFieldCell`'s "flat `JSON.stringify` preview" by name; updated to match
> Cell's new implementation since it would otherwise describe code that no longer exists.


#### packages/core/src/utils/convexValueJson.ts

New file. `bigint` is native int64 storage (Design Decision 5) and `ArrayBuffer` is the `bytes()`
field's storage (Design Decision 12); both make `JSON.stringify` throw and compare by reference,
so every display serialization and clipboard round trip needs a safe helper before any later step
stores one.

```ts
import { convexToJson, jsonToConvex, type Value } from "convex/values";

const BIGINT_SENTINEL_PREFIX = "\u0000vex:bigint:";

function stringifyConvexValueReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") return `${BIGINT_SENTINEL_PREFIX}${value.toString()}`;
  if (value instanceof ArrayBuffer) return `<${value.byteLength} bytes>`;
  return value;
}

/**
 * Display-only JSON serialization of a Convex value — never throws on a
 * `bigint` (int64) or an `ArrayBuffer` (bytes), both of which make the
 * native `JSON.stringify` throw.
 *
 * `bigint` renders as bare decimal digits, unquoted (`{"count":
 * 9007199254740993}`), so a reader sees the real integer rather than a
 * string. `ArrayBuffer` renders as `"<N bytes>"` — the byte count, not the
 * bytes themselves, matching the `bytes()` field's own cell convention.
 * Lossy and one-way: use {@link serializeConvexValue}/
 * {@link parseConvexValue} where a round trip is required.
 *
 * @param props.value - The value to serialize.
 * @param props.space - Passed through to `JSON.stringify`'s own `space` argument.
 * @returns The serialized string.
 */
export function stringifyConvexValue(props: { value: unknown; space?: number }): string {
  const json = JSON.stringify(props.value, stringifyConvexValueReplacer, props.space);
  if (json === undefined) return "undefined";
  return json.replace(new RegExp(`"${BIGINT_SENTINEL_PREFIX}(-?\\d+)"`, "g"), "$1");
}

/**
 * Lossless JSON serialization of a Convex value, via `convexToJson` — a
 * `bigint`/`ArrayBuffer`-safe round trip with {@link parseConvexValue},
 * unlike {@link stringifyConvexValue}'s display-only, one-way rendering.
 *
 * @param props.value - The Convex value to serialize.
 * @returns The serialized string.
 */
export function serializeConvexValue(props: { value: unknown }): string {
  return JSON.stringify(convexToJson(props.value as Value));
}

/**
 * Reverses {@link serializeConvexValue}, via `jsonToConvex`.
 *
 * @param props.text - The serialized string.
 * @returns The original Convex value.
 */
export function parseConvexValue(props: { text: string }): unknown {
  return jsonToConvex(JSON.parse(props.text));
}
```

#### packages/core/src/utils/convexValueJson.test.ts

New file, colocated per `tests-colocated`.

```ts
import { describe, expect, it } from "vitest";
import { parseConvexValue, serializeConvexValue, stringifyConvexValue } from "./convexValueJson";

describe("stringifyConvexValue", () => {
  it("renders a bigint as bare unquoted decimal digits", () => {
    expect(stringifyConvexValue({ value: { count: 9007199254740993n } })).toBe(
      '{"count":9007199254740993}',
    );
  });

  it("renders a negative bigint correctly", () => {
    expect(stringifyConvexValue({ value: -5n })).toBe("-5");
  });

  it("renders an ArrayBuffer as its byte-size placeholder", () => {
    expect(stringifyConvexValue({ value: { payload: new ArrayBuffer(512) } })).toBe(
      '{"payload":"<512 bytes>"}',
    );
  });

  it("renders a plain object identically to JSON.stringify", () => {
    expect(stringifyConvexValue({ value: { a: 1, b: "x" } })).toBe(JSON.stringify({ a: 1, b: "x" }));
  });

  it("passes space through like JSON.stringify", () => {
    expect(stringifyConvexValue({ value: { a: 1 }, space: 2 })).toBe(
      JSON.stringify({ a: 1 }, null, 2),
    );
  });

  it("never throws on a mix of bigint and ArrayBuffer nested inside an array", () => {
    expect(() =>
      stringifyConvexValue({ value: [1n, new ArrayBuffer(4), { n: 2n }] }),
    ).not.toThrow();
    expect(stringifyConvexValue({ value: [1n, new ArrayBuffer(4), { n: 2n }] })).toBe(
      '[1,"<4 bytes>",{"n":2}]',
    );
  });
});

describe("serializeConvexValue / parseConvexValue", () => {
  it("round-trips a bigint losslessly", () => {
    const text = serializeConvexValue({ value: { count: 9007199254740993n } });
    expect(parseConvexValue({ text })).toEqual({ count: 9007199254740993n });
  });

  it("round-trips an ArrayBuffer losslessly", () => {
    const bytes = new Uint8Array([1, 2, 3, 255]).buffer;
    const text = serializeConvexValue({ value: { payload: bytes } });
    const parsed = parseConvexValue({ text }) as { payload: ArrayBuffer };
    expect(new Uint8Array(parsed.payload)).toEqual(new Uint8Array(bytes));
  });

  it("round-trips a plain object", () => {
    const text = serializeConvexValue({ value: { a: 1, b: ["x", "y"] } });
    expect(parseConvexValue({ text })).toEqual({ a: 1, b: ["x", "y"] });
  });
});
```

#### packages/core/src/utils/index.ts

1 edit. Everything else unchanged.

**1 — barrel re-export, beside the existing `valuesEqual`/`isPlainObject` re-exports.**

```ts
export * from "./valuesEqual";
export * from "./isPlainObject";
export * from "./convexValueJson";
```

#### packages/react/src/fields/group/Cell.tsx

1 edit: swap the raw `JSON.stringify(value)` preview for `stringifyConvexValue`, so a group
containing a nested `bytes()`/int64 `number()` field never throws building its list-view preview.

**1 — import, beside the existing `@vexcms/core` import.**

```tsx
import { type CellComponentProps, type GroupField, stringifyConvexValue, TDocument } from "@vexcms/core";
```

**2 — `preview`, replacing the body of `GroupFieldCell`'s `JSON.stringify` line.**

```tsx
  const preview = stringifyConvexValue({ value });
```

#### packages/react/src/fields/group/Display.tsx

1 edit: the JSDoc names `GroupFieldCell`'s serialization by the wrong function after the Cell
edit above.

**1 — JSDoc, the line naming `GroupFieldCell`'s preview.**

```tsx
 * indentation, each sub-field resolved through `fieldToDisplayComponent`
 * in turn) — NOT `GroupFieldCell`'s flat `stringifyConvexValue` preview,
 * which is a list-column concern (no room for a nested layout there).
```

#### packages/react/src/fields/array/Cell.tsx

1 edit: an array item that is itself a `bytes()`/int64 value throws building the title-attribute
summary today.

**1 — import, beside the existing `@vexcms/core` import.**

```tsx
import {
  type CellComponentProps,
  type ArrayField,
  ArrayType,
  arrayItemLabel,
  arrayPluralLabel,
  stringifyConvexValue,
  TDocument,
} from "@vexcms/core";
```

**2 — `summary`, replacing the non-string branch of the `.map(...)` callback.**

```tsx
  const summary = props.value
    .map((item) => (typeof item === "string" ? item : stringifyConvexValue({ value: item })))
    .join(", ");
```

#### packages/react/src/fields/array/Display.tsx

1 edit: the fallback branch for an item type with no registered `Display` (defensive — every
data field type registers one, but the branch exists and must not throw).

**1 — import, beside the existing `@vexcms/core` import.**

```tsx
import {
  isDisplayValueEmpty,
  type ArrayField,
  type ArrayType,
  type DisplayComponentProps,
  stringifyConvexValue,
  type TDocument,
  type VexResourceSlug,
} from "@vexcms/core";
```

**2 — fallback `<span>`, replacing its `JSON.stringify` branch.**

```tsx
            <span className="text-sm">
              {typeof item === "object" ? stringifyConvexValue({ value: item }) : String(item)}
            </span>
```

#### packages/react/src/fields/blocks/Cell.tsx

1 edit: the title-attribute preview of a block array throws when a block carries a
`bytes()`/int64 field.

**1 — import, beside the existing `@vexcms/core` import.**

```tsx
import {
  type CellComponentProps,
  type BlocksField,
  type GenericBlock,
  stringifyConvexValue,
  TDocument,
} from "@vexcms/core";
```

**2 — `preview`, replacing the `JSON.stringify` line.**

```tsx
  const preview = stringifyConvexValue({ value });
```

#### packages/react/src/collections/listView/peek/ListViewPeek/ListViewPeekJsonTab.tsx

1 edit: the peek's raw-JSON tab throws rendering any document with a `bytes()`/int64 field.

**1 — import, beside the existing `@vexcms/core` import.**

```tsx
import { ADMIN_FIELDS, stringifyConvexValue, type AdminDataField } from "@vexcms/core";
```

**2 — `jsonText` assignment inside the `if (props.rawDocument != null)` block.**

```tsx
    jsonText = stringifyConvexValue({ value: jsonDoc, space: 2 });
```

#### packages/react/src/collections/listView/peek/ListViewPeek/ListViewPeekCopyButton.tsx

1 edit: `peekFieldCopyText` throws copying an object-shaped value containing a `bytes()`/int64
field (e.g. copying a `group`/`array`/`blocks` field's value from the Fields tab).

**1 — import, added above the existing `"@ts-hooks-kit/core"` import.**

```tsx
import { stringifyConvexValue } from "@vexcms/core";
import { type ReactNode } from "react";
import { useCopyToClipboard } from "@ts-hooks-kit/core";
```

**2 — `peekFieldCopyText`'s object branch.**

```tsx
export function peekFieldCopyText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return stringifyConvexValue({ value });
  return String(value);
}
```

#### packages/react/src/collections/listView/peek/ListViewPeek/ListViewPeekCopyButton.test.tsx

New test cases, colocated beside the existing `ListViewPeekCopyButton` tests (file already exists
— add only these two `it`s inside the existing `describe("peekFieldCopyText", ...)` block, which
today exercises the object/primitive/null branches).

```tsx
  it("never throws copying a value containing a bigint", () => {
    expect(() => peekFieldCopyText({ count: 9007199254740993n })).not.toThrow();
    expect(peekFieldCopyText({ count: 9007199254740993n })).toBe('{"count":9007199254740993}');
  });

  it("never throws copying a value containing an ArrayBuffer", () => {
    const value = { payload: new ArrayBuffer(16) };
    expect(() => peekFieldCopyText(value)).not.toThrow();
    expect(peekFieldCopyText(value)).toBe('{"payload":"<16 bytes>"}');
  });
```

#### packages/react/src/fields/blocks/useBlockClipboard.ts

2 edits: the clipboard envelope is persisted via raw `JSON.stringify`/`JSON.parse`, which throws
on a copied block carrying a `bytes()` field and silently corrupts a copied int64 (`bigint` has no
JSON representation `JSON.parse` can recover — it would read back as a `number`, losing precision
above `Number.MAX_SAFE_INTEGER`). Both writers switch to the lossless round trip.

**1 — import, beside the existing `@vexcms/core` import.**

```ts
import { useCallback, useSyncExternalStore } from "react";
import { parseConvexValue, serializeConvexValue, type GenericBlock } from "@vexcms/core";
```

**2 — `readClipboard`'s parse, replacing its `JSON.parse` call.**

```ts
  try {
    const parsed: unknown = parseConvexValue({ text: raw });
    cachedClipboard = isBlockClipboard(parsed) ? parsed : null;
  } catch {
    cachedClipboard = null;
  }
```

**3 — `copyBlocks`'s write, replacing its `JSON.stringify` call.**

```ts
    try {
      window.localStorage.setItem(
        BLOCK_CLIPBOARD_STORAGE_KEY,
        serializeConvexValue({ value: envelope }),
      );
    } catch {
      return;
    }
```

#### packages/react/src/fields/blocks/useBlockClipboard.test.ts

New test cases, colocated beside the existing `useBlockClipboard` suite (file already exists).
`copyBlocks`/`readClipboard` now go through `serializeConvexValue`/`parseConvexValue`, so the
stored string is no longer plain `JSON.stringify` output — these two tests read it back through
`parseConvexValue` directly rather than `JSON.parse`, matching the existing suite's
`BLOCK_CLIPBOARD_STORAGE_KEY` read pattern.

```ts
  it("round-trips a block carrying a bigint field losslessly", () => {
    const { result } = renderHook(() => useBlockClipboard());
    const counterBlock: GenericBlock = {
      id: "block-2",
      blockType: "counter",
      amount: 9007199254740993n,
    };

    act(() => {
      result.current.copyBlocks({ blocks: [counterBlock] });
    });

    expect(result.current.clipboard?.blocks).toEqual([counterBlock]);
  });

  it("round-trips a block carrying an ArrayBuffer field losslessly", () => {
    const { result } = renderHook(() => useBlockClipboard());
    const bytes = new Uint8Array([9, 8, 7]).buffer;
    const payloadBlock: GenericBlock = {
      id: "block-3",
      blockType: "payload",
      data: bytes,
    };

    act(() => {
      result.current.copyBlocks({ blocks: [payloadBlock] });
    });

    const stored = result.current.clipboard?.blocks[0] as { data: ArrayBuffer };
    expect(new Uint8Array(stored.data)).toEqual(new Uint8Array(bytes));
  });
```

#### packages/react/src/collections/listView/useListViewUrlState.ts

1 edit: `queryValueChanged` drives `isQueryAffectingViewSwitch`'s `where` comparison, and a
`where` filter on an int64 field (Design Decision 2/5) carries a `bigint` leaf value — the
existing `JSON.stringify`-based comparison throws the moment a saved/active view filters on one.

**1 — import, beside the existing `@vexcms/core` import.**

```ts
import {
  parseListViewUrlState,
  serializeListViewUrlState,
  valuesEqual,
  VEX_VIEW_SOURCES,
  type ColumnEntry,
  type CollectionConfig,
  type ListViewUrlState,
  type ListViewSort,
  type VexViewState,
  type VexWhereNode,
} from "@vexcms/core";
```

**2 — `queryValueChanged`'s body.**

```ts
function queryValueChanged(value: unknown, other: unknown): boolean {
  return !valuesEqual(value ?? null, other ?? null);
}
```

#### packages/react/src/collections/listView/useListViewUrlState.test.ts

New test case, colocated beside the existing `queryValueChanged`/`isQueryAffectingViewSwitch`
coverage (file already exists and exports both as named imports).

```ts
  it("never throws comparing where filters containing a bigint, and detects a real change", () => {
    const current = { filter: { field: { eq: 9007199254740993n } } };
    const patch = { filter: { field: { eq: 9007199254740993n } } };
    expect(() =>
      isQueryAffectingViewSwitch({ filter: current } as never, { filter: patch } as never),
    ).not.toThrow();
    expect(
      isQueryAffectingViewSwitch(
        { filter: current } as never,
        { filter: { field: { eq: 1n } } } as never,
      ),
    ).toBe(true);
  });
```

#### packages/react/src/collections/listView/filters/ListViewFilterBuilder/index.tsx

1 edit: the draft-vs-applied `where` comparison throws the moment a filter row targets an int64
field, since `computeAppliedWhere`'s and `props.where`'s trees can both carry a `bigint` leaf.

**1 — import, beside the existing `@vexcms/core` import.**

```tsx
import {
  getDataFields,
  valuesEqual,
  VERSION_STATUSES,
  type AdminDataField,
  type CollectionConfig,
  type VexWhereNode,
} from "@vexcms/core";
```

**2 — the `useEffect` comparison, replacing its `JSON.stringify` condition and the comment above it.**

```tsx
    // `VexWhereNode` is always a plain, serializable tree, and may carry a
    // `bigint` leaf for an int64 field's filter value — `valuesEqual` is the
    // shared bigint/ArrayBuffer-safe content comparison for exactly this
    // case, and already treats `isEmpty`/`isNotEmpty`'s `value: undefined`
    // leaf the same with or without the key present, matching how
    // Convex's own wire encoding already drops it.
    if (valuesEqual(appliedNow, props.where)) return;
```

#### packages/react/src/collections/listView/filters/ListViewFilterBuilder/index.test.tsx

New test case, colocated beside this component's existing suite (file already exists).

```tsx
  it("never throws syncing a where tree containing a bigint int64 filter value", () => {
    const where = { field: { eq: 9007199254740993n } } as never;
    expect(() =>
      render(
        <ListViewFilterBuilder
          {...defaultProps}
          where={where}
        />,
      ),
    ).not.toThrow();
  });
```

#### packages/react/src/collections/listView/savedListViews/useSavedListViews.ts

1 edit: `diffViewState`'s filters-category check throws the moment either side's saved/current
`where` carries a `bigint` leaf (an int64 field's filter).

**1 — import, beside the existing `@vexcms/core` import.**

```ts
import {
  columnEntriesEqual,
  completeListViewColumnOrder,
  CRUD_ACTIONS,
  isFieldReadable,
  isSearchFieldValid,
  isSortFieldValid,
  PERMISSION_SCOPES,
  splitWhereByReadability,
  toClientSavedListViewConfig,
  valuesEqual,
  VEX_VIEW_SOURCES,
  type ColumnEntry,
  type CollectionConfig,
  type CollectionSlug,
  type ResolvedFieldPermissions,
  type VexClientViewConfig,
  type VexStoredView,
  type VexViewConfig,
  type VexViewSource,
  type VexWhereNodeOf,
} from "@vexcms/core";
```

**2 — the `categories.push("filters")` condition.**

```ts
  if (!valuesEqual(props.current.where ?? null, props.saved.where ?? null)) {
    categories.push("filters");
  }
```

#### packages/react/src/collections/listView/savedListViews/useSavedListViews.test.ts

New test case, colocated beside the existing `diffViewState` coverage (file already exists).

```ts
  it("never throws diffing where filters containing a bigint, and detects a real change", () => {
    const current = { ...baseSnapshot, where: { field: { eq: 9007199254740993n } } } as never;
    const saved = { ...baseSavedEntry, where: { field: { eq: 9007199254740993n } } } as never;
    expect(() => diffViewState({ current, saved })).not.toThrow();
    expect(diffViewState({ current, saved }).categories).not.toContain("filters");
    const changed = { ...baseSavedEntry, where: { field: { eq: 1n } } } as never;
    expect(diffViewState({ current, saved: changed }).categories).toContain("filters");
  });
```

#### packages/react/src/forms/changedValues.ts

No change — see the writer note at the top of this section. `changedValues`/`isFieldKeyDirty`
perform no value comparison to make safe; they only read TanStack's `fieldMeta[key].isDirty`
flag and copy flagged keys.

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`; `pnpm typecheck`.

### Step 2 — `nullable` on every data field [agent]

> Writer note: `db/queryArgs.ts`'s `normalizeArrayStoredWhere` already treats an explicit
> `value: null` leaf as "isEmpty" for array-stored fields (`packages/core/src/db/queryArgs.ts:526`)
> — that part of "isEmpty/isNotEmpty treat null as empty" pre-dates this step. What's missing,
> fixed below: (1) a NULLABLE array-stored field's isEmpty check doesn't yet match a literal
> stored `null` (only `[]`/`undefined`), and (2) a nullable SCALAR field's isEmpty check has no
> rewrite at all. `access/compileQueryConstraints.ts` never evaluates `isEmpty` itself (it only
> ever sees `eq`/`neq`; `isEmpty`/`isNotEmpty` are a list-view URL-encoding concern that resolves
> to `eq`/`neq` + `undefined` before reaching core, per `fields/types.ts:268-271`) — no change
> needed there. `fields/utils.ts#isDisplayValueEmpty` already treats `null` as empty
> (`value === undefined || value === null || value === ""`) — no change needed there either.
> `db/prepareEdit.ts` needs no change: `valuesEqual` already compares `null` correctly and the
> Zod schema it runs (`getFieldsInputSchema`) accepts `null` once `applyBaseInputSchemaMeta`
> does. `globals/interfaceGen.ts` duplicates `collections/interfaceGen.ts`'s per-field
> `fieldType`/`required` emission and was NOT named in spec-tasks.md's checklist, but it has the
> identical gap (no `nullable` suffix) — fixed below alongside its collection counterpart.

Why: `v.nullable(X)` columns are common in existing tables, and no field can describe them today.
`nullable: true` emits `v.nullable(X)`, wrapped in `v.optional` when the field isn't required, and
types the value `T | null`. A cleared input writes `null`.
Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`; `pnpm --filter test vex:generate` shows `v.nullable(...)` and `| null`; `pnpm typecheck`.

- [ ] `apps/test/**` is a shared board — read `storageShapes.ts` fresh before each later step's edit; append fields, never reorder/rename earlier ones.
- [ ] core `fields/baseTypes.ts`: `nullable?: boolean` on `BaseFieldInput`, `nullable: boolean` on `BaseField`; every data field's `config.ts` resolves it (default `false`)
- [ ] core `fields/validators/utils.ts`: `applyBaseValidators` wraps `v.nullable(...)` before `v.optional(...)` + test
- [ ] core `fields/inputSchemas/utils.ts`: `applyBaseInputSchemaMeta` adds `.nullable()` + test
- [ ] core interface generation emits `T | null` for nullable fields (top-level and nested `childInterfaceType`) + test
- [ ] core where compilation: `isEmpty`/`isNotEmpty` treat `null` as empty + test
- [ ] react: form load maps `null` to the field's empty form value; save maps a nullable field's empty value to `null` + tests
- [ ] react: container fields (group/array/blocks/json/richtext) render a null toggle in `FormFieldLayout` when `nullable` + test
- [ ] telemetry `anonymizeConfig.ts`: record `nullable`
- [ ] apps/test: new `storageShapes` collection (`TABLE_SLUG_STORAGE_SHAPES`) with nullable text/number/select/group fields; register it in the config and the collections barrel

#### packages/core/src/fields/baseTypes.ts

4 edits.

**1 — `BaseFieldInput`.** Beside the existing `required?: boolean;` member, add:

```ts
  /**
   * Whether `null` is a legal value for this field, in addition to its
   * normal type. `required: true` emits `v.nullable(X)`; `required: false`
   * emits `v.optional(v.nullable(X))`. Clearing the field's input (or, for
   * a container/checkbox field with no natural empty state, its
   * `FormFieldLayout` null toggle) writes `null`.
   *
   * Default: `false`
   */
  nullable?: boolean;
```

**2 — `BaseField`.** Beside the existing `required: boolean;` member, add:

```ts
  /** Whether `null` is a legal value for this field, in addition to its normal type. */
  nullable: boolean;
```

**3 — `BaseUIFieldInput`.** Add `"nullable"` to the `Omit` union (a UI field stores no value):

```ts
export interface BaseUIFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends Omit<
    BaseFieldInput<TCollectionSlug, never, TFieldMeta>,
    | "required"
    | "defaultValue"
    | "index"
    | "interfaceDescription"
    | "validate"
    | "dependsOn"
    | "admin"
    | "nullable"
  > {
```

**4 — `BaseUIField`.** Add `"nullable"` to the `Omit` union:

```ts
export interface BaseUIField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends Omit<
    BaseField<TCollectionSlug, TFieldMeta>,
    | "required"
    | "defaultValue"
    | "index"
    | "interfaceDescription"
    | "interfaceType"
    | "validate"
    | "dependsOn"
    | "admin"
    | "nullable"
  > {
```

#### packages/core/src/fields/constants.ts

One edit: add `hasNullToggle: boolean` as the last property of every `ADMIN_FIELDS` entry —
`true` for the fields with no natural empty input state (`checkbox`, `group`, `array`, `blocks`,
`richtext`, `json`), `false` for every other entry (every scalar-ish field, whose own control
already has an empty representation a cleared nullable input can write `null` from — text's `""`,
number/date's `undefined`, select/relationship/upload's `[]` — and every `kind: "ui"` entry,
which never accepts `nullable` at all). `getFieldsDefaultValues`/`resolveNullableLoadValue`/
`resolveNullableSaveValue` (below) and the react null-toggle wiring both key off this flag instead
of hand-listing field types a second time. Three representative entries:

```ts
  text: {
    type: "text",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
    kind: "data",
    inputMasks: true,
    hasNullToggle: false,
  },
```

```ts
  checkbox: {
    type: "checkbox",
    interfaceType: "boolean",
    validator: "v.boolean()",
    defaultValue: false,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
```

```ts
  group: {
    type: "group",
    interfaceType: "Record<string, any>",
    validator: "v.object({})",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValue: {} as Record<string, any>,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
```

Same pattern (append `hasNullToggle: <bool>,` as the entry's last line) on every other entry:
`email: false`, `textarea: false`, `url: false`, `color: false`, `number: false`, `date: false`,
`commitTs: false`, `select: false`, `relationship: false`, `array: true`, `blocks: true`,
`upload: false`, `richtext: true`, `json: true`, `tabs: false`, `collapsible: false`, `row: false`,
`ui: false`.

**Every data field's `config.ts` — resolve `nullable`**

17 edits, one per file, same shape: insert `nullable: false,` immediately after the existing
`required: false,` literal default (so the later `...options` spread overrides it exactly like
`required` already does). `blocks/config.ts` doesn't spread `options` wholesale, so it resolves
`nullable` the same way it resolves `required`.

```ts
// fields/{text,email,textarea,url,color,number,checkbox,date,select,upload}/config.ts
// and fields/{commitTs,relationship,array,group,richtext,json}/config.ts
    label: "",
    required: false,
    nullable: false,
    defaultValue: /* unchanged per field */,
```

`fields/commitTs/config.ts` (literal fields precede `on`, not `defaultValue`):

```ts
    label: "",
    required: false,
    nullable: false,
    defaultValue: undefined,
    on: options?.on ?? "save",
```

`fields/relationship/config.ts` and `fields/upload/config.ts` (no `defaultValue` literal here):

```ts
    label: "",
    required: false,
    nullable: false,
    hasMany: false,
```

`fields/blocks/config.ts` (no blanket spread — mirrors `required: options.required ?? false,`):

```ts
    label: options.label ?? "",
    required: options.required ?? false,
    nullable: options.nullable ?? false,
    defaultValue: options.defaultValue ?? [],
```

#### packages/core/src/fields/validators/utils.ts

```ts
import { AdminDataField } from "../types";

/**
 * Wraps a Convex validator string in `v.nullable(...)` when the field is
 * nullable, then in `v.optional(...)` when the field is not required —
 * `v.optional(v.nullable(X))`, nullable innermost, never the reverse.
 *
 * @param props - handleOptionalValidators() input props
 * @param props.field - The resolved field definition, used to check `required`/`nullable`
 * @param props.validator - A Convex validator expression string (e.g. `"v.string()"`)
 * @returns The validator string, wrapped in `v.nullable(...)`/`v.optional(...)` as applicable
 *
 * @example
 * ```ts
 * applyBaseValidators({ field: requiredNullableField, validator: "v.string()" })
 * // → "v.nullable(v.string())"
 * applyBaseValidators({ field: optionalNullableField, validator: "v.string()" })
 * // → "v.optional(v.nullable(v.string()))"
 * ```
 */
export function applyBaseValidators(props: {
  field: AdminDataField;
  validator: string;
}): string {
  const nullableValidator = props.field.nullable ? `v.nullable(${props.validator})` : props.validator;
  if (props.field.required) {
    return nullableValidator;
  }
  return `v.optional(${nullableValidator})`;
}
```

#### packages/core/src/fields/validators/utils.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { text } from "../text/config";
import { applyBaseValidators } from "./utils";

describe("applyBaseValidators", () => {
  it("leaves a required, non-nullable field's validator unwrapped", () => {
    const field = text({ required: true });
    expect(applyBaseValidators({ field, validator: "v.string()" })).toBe("v.string()");
  });

  it("wraps an optional, non-nullable field's validator in v.optional()", () => {
    const field = text({ required: false });
    expect(applyBaseValidators({ field, validator: "v.string()" })).toBe("v.optional(v.string())");
  });

  it("wraps a required, nullable field's validator in v.nullable() only", () => {
    const field = text({ required: true, nullable: true });
    expect(applyBaseValidators({ field, validator: "v.string()" })).toBe("v.nullable(v.string())");
  });

  it("wraps an optional, nullable field's validator v.optional(v.nullable(...)), nullable innermost", () => {
    const field = text({ required: false, nullable: true });
    expect(applyBaseValidators({ field, validator: "v.string()" })).toBe(
      "v.optional(v.nullable(v.string()))",
    );
  });
});
```

#### packages/core/src/fields/inputSchemas/utils.ts

```ts
/**
 * Attaches field metadata, wraps in `.nullable()` for a nullable field, then
 * in `.optional()` for non-required fields — `.nullable()` applied before
 * `.optional()`, matching `applyBaseValidators`'s wrap order.
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition, used to check `required`/`nullable` and `defaultValue`
 * @param props.inputSchema - The base Zod schema for the field (e.g. `z.string()`)
 * @returns The schema with `.meta(fieldMeta)`, `.nullable()` when `field.nullable`, and
 *   `.optional()` for non-required fields. No `.default()` is applied — each field's own schema
 *   is responsible for baking in a default value.
 *
 * @example
 * ```ts
 * applyBaseInputSchemaMeta({ field: textField, inputSchema: z.string() })
 * // required, non-nullable field  → z.string().meta({ label, description })
 * // optional, non-nullable field  → z.string().meta({ label, description }).optional()
 * // required, nullable field      → z.string().meta({ label, description }).nullable()
 * // optional, nullable field      → z.string().meta({ label, description }).nullable().optional()
 * ```
 */
export function applyBaseInputSchemaMeta(props: {
  field: AdminDataField;
  inputSchema: ZodType;
}): ZodType {
  const { field, inputSchema } = props;
  const fieldMeta = {
    fieldType: field.type,
    label: field.label,
    description: field.description ?? "",
  };
  const metaSchema = inputSchema.meta(fieldMeta);
  const nullableSchema = field.nullable ? metaSchema.nullable() : metaSchema;
  if (!field.required) {
    return nullableSchema.optional();
  }
  return nullableSchema;
}
```

#### packages/core/src/fields/inputSchemas/utils.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import * as z from "zod";
import { text } from "../text/config";
import { applyBaseInputSchemaMeta } from "./utils";

describe("applyBaseInputSchemaMeta", () => {
  it("accepts a value, rejects null and undefined, on a required non-nullable field", () => {
    const field = text({ required: true });
    const schema = applyBaseInputSchemaMeta({ field, inputSchema: z.string() });
    expect(schema.safeParse("hi").success).toBe(true);
    expect(schema.safeParse(null).success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it("accepts undefined, rejects null, on an optional non-nullable field", () => {
    const field = text({ required: false });
    const schema = applyBaseInputSchemaMeta({ field, inputSchema: z.string() });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("accepts null, rejects undefined, on a required nullable field", () => {
    const field = text({ required: true, nullable: true });
    const schema = applyBaseInputSchemaMeta({ field, inputSchema: z.string() });
    expect(schema.safeParse(null).success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(false);
    expect(schema.safeParse("hi").success).toBe(true);
  });

  it("accepts both null and undefined on an optional nullable field", () => {
    const field = text({ required: false, nullable: true });
    const schema = applyBaseInputSchemaMeta({ field, inputSchema: z.string() });
    expect(schema.safeParse(null).success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(true);
  });
});
```

**Every field's `validator.ts`/`inputSchema.ts` already routes through the base helpers**

Verified: all 17 data fields' `validator.ts` call `applyBaseValidators` and `inputSchema.ts` call
`applyBaseInputSchemaMeta` (including `blocks`, `array`, `group`, `richtext`, `json`, `commitTs`),
so the two edits above cover every field type with no further per-field change.

#### packages/core/src/fields/childInterfaceType.ts

```ts
import { ADMIN_FIELDS } from "./constants";
import type { AdminDataField } from "./types";

/**
 * Resolves the TypeScript type string for a field nested inside another field.
 *
 * Blocks, groups and arrays each need this, and each used to inline its own
 * version — all three falling through to `field.interfaceType`. That is why a
 * `select` inside a block generated `string[]` while the same `select` on a
 * collection generated a literal union: only the collection path
 * (`collections/interfaceGen.ts`) knew to read `options`.
 *
 * Collections emit a named companion alias because the union may be reused and
 * a document interface is a named declaration. A block's type is an inline
 * object literal with nowhere to hang an alias, so the union is inlined here.
 *
 * A nullable field's type string always ends with ` | null`, appended AFTER
 * any type-specific override (the select literal union, a named group/blocks
 * alias) — `field.nullable` wraps the WHOLE stored value, union included.
 *
 * @param field - The nested field definition.
 * @returns The TypeScript type string to emit for this field.
 */
export function childInterfaceType(field: AdminDataField): string {
  const nullableSuffix = field.nullable ? " | null" : "";
  if (field.type === ADMIN_FIELDS.select.type) {
    const options = (field as { options?: { value: string }[] }).options ?? [];
    // A `select` with no options configured has no union to emit; widening to
    // the declared `string[]` is correct rather than producing `()[]`.
    if (options.length === 0) return `${field.interfaceType}${nullableSuffix}`;
    return `(${options.map((option) => `"${option.value}"`).join(" | ")})[]${nullableSuffix}`;
  }

  if (field.type === ADMIN_FIELDS.group.type && field.interfaceName) {
    return `${field.interfaceName}${nullableSuffix}`;
  }

  if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
    return `${field.interfaceName}[]${nullableSuffix}`;
  }

  return `${field.interfaceType}${nullableSuffix}`;
}
```

#### packages/core/src/fields/childInterfaceType.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { text } from "./text/config";
import { number } from "./number/config";
import { select } from "./select/config";
import { group } from "./group/config";
import { childInterfaceType } from "./childInterfaceType";

describe("childInterfaceType", () => {
  it("returns the field's own interfaceType for a plain field", () => {
    expect(childInterfaceType(text())).toBe("string");
  });

  it("appends | null for a nullable field", () => {
    expect(childInterfaceType(number({ nullable: true }))).toBe("number | null");
  });

  it("appends | null after a select's literal-union override", () => {
    const field = select({
      nullable: true,
      options: [
        { label: "Won", value: "won" },
        { label: "Lost", value: "lost" },
      ],
    });
    expect(childInterfaceType(field)).toBe(`("won" | "lost")[] | null`);
  });

  it("appends | null after a named group's interfaceName", () => {
    const field = group({ interfaceName: "Seo", nullable: true, fields: { title: text() } });
    expect(childInterfaceType(field)).toBe("Seo | null");
  });
});
```

#### packages/core/src/collections/interfaceGen.ts

One line, the `interfaceFields` map's return statement:

```ts
      return `${jsdocComment}\t${fieldKey}${field.required ? "" : "?"}: ${fieldType}${field.nullable ? " | null" : ""}`;
```

#### packages/core/src/collections/interfaceGen.test.ts

Append after the existing `describe("collectionConfigToInterface - select emits an array type", ...)` block.

```ts

describe("collectionConfigToInterface — nullable", () => {
  it("appends | null for a required nullable field", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { subtitle: text({ required: true, nullable: true }) },
    });
    const output = collectionConfigToInterface({ collection });
    expect(output).toContain("subtitle: string | null");
  });

  it("appends | null after an optional nullable field's own ? marker", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { subtitle: text({ required: false, nullable: true }) },
    });
    const output = collectionConfigToInterface({ collection });
    expect(output).toContain("subtitle?: string | null");
  });

  it("appends | null after a select's option-union array type", () => {
    const collection = defineCollection({
      slug: "articles",
      interfaceName: "Article",
      fields: {
        status: select({
          nullable: true,
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
      },
    });
    const output = collectionConfigToInterface({ collection });
    expect(output).toContain("status?: ArticleStatusOption[] | null");
  });
});
```

#### packages/core/src/globals/interfaceGen.ts

Same one-line fix as `collections/interfaceGen.ts` (this file duplicates the same per-field
`fieldType`/`required` emission for globals — see the Writer note):

```ts
      return `${jsdocComment}\t${fieldKey}${field.required ? "" : "?"}: ${fieldType}${field.nullable ? " | null" : ""}`;
```

#### packages/core/src/globals/interfaceGen.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";
import { text } from "../fields";
import { defineGlobal } from "./config";
import { globalConfigToInterface } from "./interfaceGen";

describe("globalConfigToInterface — nullable", () => {
  it("emits | null for a nullable field", () => {
    const g = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { tagline: text({ nullable: true }) },
    });
    const output = globalConfigToInterface({ global: g });
    expect(output).toContain("tagline?: string | null");
  });
});
```

#### packages/core/src/db/queryArgs.ts

`normalizeArrayStoredWhere`'s full body genuinely changes — shown complete. Everything above and
below it (`isArrayStoredField`, the function's own JSDoc, every other export) is unchanged.

```ts
export function normalizeArrayStoredWhere<S extends string = string>(props: {
  where: VexWhereNode<S> | undefined;
  fields: Record<string, AdminField>;
}): VexWhereNode<S> | undefined {
  if (props.where === undefined) return undefined;
  const arrayFields = new Map<string, { hasMany: boolean; nullable: boolean }>();
  const nullableScalarFields = new Set<string>();
  for (const [key, field] of Object.entries(props.fields)) {
    if (isArrayStoredField(field)) {
      arrayFields.set(key, { hasMany: field.hasMany, nullable: field.nullable });
    } else if ("nullable" in field && field.nullable) {
      nullableScalarFields.add(key);
    }
  }
  function walk(node: VexWhereNode<S>): VexWhereNode<S> {
    if ("and" in node) return { and: node.and.map(walk) };
    if ("or" in node) return { or: node.or.map(walk) };
    if ("not" in node) return { not: walk(node.not) };
    if (node.op !== "eq" && node.op !== "neq") return node;
    const arrayField = arrayFields.get(node.field as string);
    if (arrayField !== undefined) {
      if (node.value === undefined || node.value === null) {
        // `ConstraintValue<TDoc, F>` is inferred per-collection from `S`, so TS
        // cannot know an array-stored field's value type admits `[]`/`undefined`/
        // `null` combinator nodes here — this generic walk only inspects
        // `node.field`'s runtime type, same cast pattern as
        // `convertCommitTsWhereToNs` above.
        const emptyValues: unknown[] = arrayField.nullable ? [[], undefined, null] : [[], undefined];
        const isEmptyNode = {
          or: emptyValues.map((value) => ({ field: node.field, op: "eq", value })),
        } as unknown as VexWhereNode<S>;
        return node.op === "eq" ? isEmptyNode : ({ not: isEmptyNode } as unknown as VexWhereNode<S>);
      }
      if (arrayField.hasMany || Array.isArray(node.value)) return node;
      return { ...node, value: [node.value] } as VexWhereNode<S>;
    }
    if (nullableScalarFields.has(node.field as string) && node.value === undefined) {
      const isEmptyNode = {
        or: [
          { field: node.field, op: "eq", value: undefined },
          { field: node.field, op: "eq", value: null },
        ],
      } as unknown as VexWhereNode<S>;
      return node.op === "eq" ? isEmptyNode : ({ not: isEmptyNode } as unknown as VexWhereNode<S>);
    }
    return node;
  }
  return walk(props.where);
}
```

Its own doc comment (directly above, item 2 of the numbered list) gains one clause: after "Neither
shape is index-pushable…, so both stay in `.filter()`, same as before." add "A NULLABLE
array-stored field's empty check additionally matches a literal stored `null` — a real, distinct
value once `nullable` is set, not just the legacy-row shorthand `null` was before. A nullable
SCALAR field's own `isEmpty`/`isNotEmpty` wire form (`eq`/`neq` with `value: undefined`) is
rewritten the same way, matching either `undefined` or `null`."

#### packages/core/src/db/queryArgs.test.ts

Two edits inside the existing `describe("normalizeArrayStoredWhere", ...)` block.

**1 — fixture fields.** Replace the `fields` object (currently `status`/`tags`/`contributorId`/
`coAuthors`/`title`) with two more entries:

```ts
  const fields = {
    status: select({ hasMany: false, options: [{ label: "Won", value: "won" }, { label: "Lost", value: "lost" }] }),
    tags: select({ hasMany: true, options: [{ label: "News", value: "news" }] }),
    contributorId: relationship({ collection: { slug: "authors" }, hasMany: false }),
    coAuthors: relationship({ collection: { slug: "authors" }, hasMany: true }),
    title: text(),
    nullableTitle: text({ nullable: true }),
    nullableStatus: select({ nullable: true, hasMany: false, options: [{ label: "Won", value: "won" }] }),
  };
```

**2 — new tests.** Insert after the existing `"rewrites an explicit value: null leaf the same as isEmpty/isNotEmpty"` test:

```ts

  test("adds a null alternative to a nullable array-stored field's isEmpty rewrite", () => {
    const where = { field: "nullableStatus", op: "eq", value: undefined } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      or: [
        { field: "nullableStatus", op: "eq", value: [] },
        { field: "nullableStatus", op: "eq", value: undefined },
        { field: "nullableStatus", op: "eq", value: null },
      ],
    });
  });

  test("omits the null alternative for a non-nullable array-stored field (contributorId, above)", () => {
    const where = { field: "contributorId", op: "eq", value: undefined } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      or: [
        { field: "contributorId", op: "eq", value: [] },
        { field: "contributorId", op: "eq", value: undefined },
      ],
    });
  });

  test("rewrites isEmpty on a nullable scalar field to match null or undefined", () => {
    const where = { field: "nullableTitle", op: "eq", value: undefined } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      or: [
        { field: "nullableTitle", op: "eq", value: undefined },
        { field: "nullableTitle", op: "eq", value: null },
      ],
    });
  });

  test("rewrites isNotEmpty on a nullable scalar field the same way, negated", () => {
    const where = { field: "nullableTitle", op: "neq", value: undefined } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual({
      not: {
        or: [
          { field: "nullableTitle", op: "eq", value: undefined },
          { field: "nullableTitle", op: "eq", value: null },
        ],
      },
    });
  });

  test("leaves a non-nullable scalar field's isEmpty wire form untouched", () => {
    const where = { field: "title", op: "eq", value: undefined } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual(where);
  });
```

#### packages/core/src/fields/utils.ts

**1 — `getFieldsDefaultValues`'s body.** Replace the `for` loop body:

```ts
  const res: Record<string, unknown> = {};
  for (const [fieldKey, fieldDef] of Object.entries(getDataFields({ fields: props.fields }))) {
    if (fieldDef.admin.hidden) continue;
    const stored = props.document ? props.document[fieldKey] : undefined;
    if (fieldDef.nullable && stored === null) {
      res[fieldKey] = resolveNullableLoadValue({ field: fieldDef, value: null });
    } else if (props.document && Boolean(stored)) {
      res[fieldKey] = stored;
    } else {
      res[fieldKey] = fieldDef.defaultValue;
    }
  }
  return res;
}
```

**2 — new exports.** Add directly after `getFieldsDefaultValues` (before `fieldsToFieldTypeMap`):

```ts
/**
 * Resolves a nullable field's loaded form value from its stored document
 * value. A field with no natural empty input state of its own
 * (`ADMIN_FIELDS[field.type].hasNullToggle` — group/array/blocks/json/
 * richtext/checkbox) keeps a literal `null` so its `FormFieldLayout` null
 * toggle starts active; every other nullable field's `null` becomes its own
 * `defaultValue`, since its control already shows that as "no value".
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition.
 * @param props.value - The field's current value — only ever called with `null`.
 * @returns `null` for a toggle field, else `field.defaultValue`.
 */
export function resolveNullableLoadValue(props: { field: AdminDataField; value: null }): unknown {
  return ADMIN_FIELDS[props.field.type].hasNullToggle ? null : props.field.defaultValue;
}

/**
 * Resolves one nullable field's form value for the save payload: clearing a
 * scalar nullable field's input (its own empty representation, per
 * {@link isDisplayValueEmpty}) writes `null`. A toggle field's value is
 * already `null` or already a real value (set directly by its own
 * `FormFieldLayout` null toggle) and passes through unchanged.
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition.
 * @param props.value - The field's current form value.
 * @returns `value`, or `null` when `field.nullable`, the field has no null
 *   toggle, and `value` is that field's own empty representation.
 */
export function resolveNullableSaveValue(props: { field: AdminDataField; value: unknown }): unknown {
  if (!props.field.nullable || ADMIN_FIELDS[props.field.type].hasNullToggle) return props.value;
  return isDisplayValueEmpty(props.value) ? null : props.value;
}

/**
 * Applies {@link resolveNullableSaveValue} across a values record keyed by
 * field key — the save-path counterpart of {@link getFieldsDefaultValues}.
 * A key with no matching data field (filtered out upstream, or not a
 * declared field) passes through unchanged.
 *
 * @param props - Input props.
 * @param props.values - The form values about to be submitted.
 * @param props.fields - The resource's resolved field map.
 * @returns A new record with every nullable scalar field's empty value replaced by `null`.
 */
export function resolveNullableSaveValues(props: {
  values: Record<string, unknown>;
  fields: Record<string, AdminField>;
}): Record<string, unknown> {
  const dataFields = getDataFields({ fields: props.fields });
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props.values)) {
    const fieldDef = dataFields[key];
    result[key] = fieldDef ? resolveNullableSaveValue({ field: fieldDef, value }) : value;
  }
  return result;
}
```

#### packages/core/src/fields/utils.test.ts

Add `number`, `select`, `resolveNullableLoadValue`, `resolveNullableSaveValue`,
`resolveNullableSaveValues` to the existing imports:

```ts
import { checkbox, defineCollection, number, select, text } from "../index";
import {
  andFieldConditions,
  getDataFields,
  getFieldsInputSchema,
  getUIFieldKeys,
  getUIFieldsWithCell,
  hasFieldConditions,
  isDisplayValueEmpty,
  isFieldConditionMet,
  resolveFieldComponents,
  resolveFieldLimit,
  resolveNullableLoadValue,
  resolveNullableSaveValue,
  resolveNullableSaveValues,
  resolveRowWidths,
} from "./utils";
```

Append new `describe` blocks after the existing `describe("isDisplayValueEmpty", ...)` block:

```ts

describe("resolveNullableLoadValue", () => {
  it("keeps null for a toggle field (checkbox/group/array/blocks/json/richtext)", () => {
    expect(resolveNullableLoadValue({ field: checkbox({ nullable: true }), value: null })).toBeNull();
    expect(resolveNullableLoadValue({ field: group({ nullable: true, fields: {} }), value: null })).toBeNull();
  });

  it("maps null to the field's own defaultValue for a scalar field", () => {
    expect(resolveNullableLoadValue({ field: text({ nullable: true }), value: null })).toBe("");
    expect(resolveNullableLoadValue({ field: number({ nullable: true }), value: null })).toBe(0);
  });
});

describe("resolveNullableSaveValue", () => {
  it("leaves a non-nullable field's value untouched regardless of emptiness", () => {
    expect(resolveNullableSaveValue({ field: text(), value: "" })).toBe("");
  });

  it("writes null for a nullable scalar field cleared to its own empty representation", () => {
    expect(resolveNullableSaveValue({ field: text({ nullable: true }), value: "" })).toBeNull();
    expect(resolveNullableSaveValue({ field: number({ nullable: true }), value: undefined })).toBeNull();
  });

  it("leaves a nullable scalar field's real value untouched", () => {
    expect(resolveNullableSaveValue({ field: text({ nullable: true }), value: "hi" })).toBe("hi");
  });

  it("leaves a nullable toggle field's empty-but-untouched default value untouched (no auto-null)", () => {
    const field = array({ nullable: true, items: text() });
    expect(resolveNullableSaveValue({ field, value: [] })).toEqual([]);
  });

  it("leaves a nullable toggle field's already-null value as null", () => {
    const field = array({ nullable: true, items: text() });
    expect(resolveNullableSaveValue({ field, value: null })).toBeNull();
  });
});

describe("resolveNullableSaveValues", () => {
  it("maps only nullable scalar fields' empty values to null, across a values record", () => {
    const fields = {
      title: text({ nullable: true }),
      count: number({ nullable: true }),
      tags: select({ nullable: true, hasMany: true, options: [{ label: "A", value: "a" }] }),
    };
    const result = resolveNullableSaveValues({
      values: { title: "", count: undefined, tags: [] },
      fields,
    });
    expect(result).toEqual({ title: null, count: null, tags: null });
  });

  it("passes through a key with no matching field unchanged", () => {
    const result = resolveNullableSaveValues({ values: { other: "x" }, fields: {} });
    expect(result).toEqual({ other: "x" });
  });
});
```

#### packages/core/src/collections/utils.test.ts

Insert two new `it` blocks inside the existing `describe("getFieldsDefaultValues", ...)` block,
after `"falls back to field default when document key is missing"` and before the
`"comprehensive"` section:

```ts

  it("maps a stored null to the field's own default for a nullable scalar field", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        note: text({ nullable: true }),
        score: number({ nullable: true }),
      },
    });
    const document = { _id: "doc1", _creationTime: 0, title: "Hello", note: null, score: null };
    const defaults = getFieldsDefaultValues({ fields: collection.fields, document });
    expect(defaults.note).toBe("");
    expect(defaults.score).toBe(0);
  });

  it("preserves a stored null for a nullable group so its null toggle starts active", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        meta: group({ nullable: true, fields: { note: text() } }),
      },
    });
    const document = { _id: "doc1", _creationTime: 0, meta: null };
    const defaults = getFieldsDefaultValues({ fields: collection.fields, document });
    expect(defaults.meta).toBeNull();
  });
```

Add `group` to the existing `../index` import (`url, text, number, checkbox, date, select, group, array, defineCollection`
— `group` is already imported; no import change needed since line 9 already lists it).

#### packages/react/src/forms/FormFieldLayout.tsx

**1 — props + render.** Replace the exported function:

```tsx
export function FormFieldLayout(props: {
  id: string;
  label?: string;
  labelContent?: ReactNode;
  required?: boolean;
  description?: string;
  index?: number;
  field: AnyFieldApi;
  submissionAttempts: number;
  before?: ReactNode;
  after?: ReactNode;
  counter?: ReactNode;
  children: ReactNode;
  className?: string;
  readOnly?: boolean;
  /**
   * Whether this field's value is currently `null`. Ignored unless
   * `onIsNullChange` is also given.
   */
  isNull?: boolean;
  /**
   * Toggles `isNull`. When given, renders a "Null" switch in the label row
   * (beside `label`/`labelContent`, or alone when neither is set) and hides
   * `before`/`children` while `isNull` is `true`. Omit to render no switch.
   */
  onIsNullChange?: (isNull: boolean) => void;
}): ReactNode {
  const errorMessage = getFieldErrorMessage(props.field);
  const showError = isFieldShowingError({
    field: props.field,
    submissionAttempts: props.submissionAttempts,
  });
  const descriptionId = `${props.id}-description`;
  const errorId = `${props.id}-error`;
  const labelHidden = useContext(HideFieldLabelContext);
  const hasLabel = props.labelContent !== undefined || props.label !== undefined;
  const hasDescription = Boolean(props.description);
  const hasNullToggle = props.onIsNullChange !== undefined;

  const labelNode =
    props.labelContent ??
    (props.label !== undefined && (
      <FieldLabel
        htmlFor={props.id}
        id={`${props.id}-label`}
        className={cn(labelHidden && "sr-only")}
      >
        {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
        {props.label}
        {props.required && <span className="text-red-500">*</span>}
      </FieldLabel>
    ));

  return (
    <Field className={props.className} data-invalid={showError} data-disabled={props.readOnly || undefined}>
      {(hasLabel || hasNullToggle) && (
        <div className="flex items-center justify-between gap-2">
          {hasLabel && labelNode}
          {hasNullToggle && (
            <NullFieldToggle isNull={Boolean(props.isNull)} onIsNullChange={props.onIsNullChange!} />
          )}
        </div>
      )}
      <Activity mode={hasDescription ? "visible" : "hidden"}>
        <FieldDescription
          id={hasDescription ? descriptionId : undefined}
          data-slot="form-description"
          className={cn(hasLabel && !labelHidden && "mt-1")}
        >
          {props.description}
        </FieldDescription>
      </Activity>
      <FieldContent className={cn((hasDescription || (hasLabel && !labelHidden)) && "mt-2")}>
        {!props.isNull && props.before}
        {!props.isNull && props.children}
        {props.after}
        {(showError || props.counter) && (
          <div className="flex flex-wrap items-start gap-x-2 gap-y-1" data-slot="field-footer">
            {showError && (
              <FieldError id={errorId} role="alert" className="min-w-0 flex-1">
                {errorMessage}
              </FieldError>
            )}
            {props.counter && <span className="ml-auto shrink-0">{props.counter}</span>}
          </div>
        )}
      </FieldContent>
    </Field>
  );
}
```

**2 — new export.** Add after `FormFieldLayout`:

```tsx
/**
 * The "Null" switch `FormFieldLayout` renders in its label row when
 * `onIsNullChange` is given. Exported directly for `richtext`'s admin
 * field, which builds its own label row outside `FormFieldLayout` and
 * `CheckboxField`, whose control+label live in `before` rather than
 * `children`.
 *
 * @param props - Input props.
 * @param props.isNull - Current toggle state.
 * @param props.onIsNullChange - Commits the new toggle state.
 * @returns A small labelled checkbox reading "Null".
 */
export function NullFieldToggle(props: {
  isNull: boolean;
  onIsNullChange: (isNull: boolean) => void;
}): ReactNode {
  return (
    <label className="flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground">
      <Checkbox
        checked={props.isNull}
        onCheckedChange={(checked) => props.onIsNullChange(Boolean(checked))}
      />
      Null
    </label>
  );
}
```

**3 — import.** Add beside the existing `cn` import:

```ts
import { Checkbox } from "../ui/checkbox";
```

#### packages/react/src/forms/FormFieldLayout.test.tsx

**1 — `Harness`.** Add two props, forwarded straight through:

```tsx
function Harness(props: {
  initialValue: string;
  label?: string;
  required?: boolean;
  description?: string;
  index?: number;
  submissionAttempts?: number;
  validate?: (value: string) => string | undefined;
  readOnly?: boolean;
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
}) {
```

And inside its `<FormFieldLayout>` call, add:

```tsx
            readOnly={props.readOnly}
            isNull={props.isNull}
            onIsNullChange={props.onIsNullChange}
          >
```

**2 — new tests.** Append inside `describe("FormFieldLayout", ...)`:

```tsx

  it("renders no Null switch when onIsNullChange is omitted", () => {
    render(<Harness initialValue="" label="Name" />);
    expect(screen.queryByText("Null")).not.toBeInTheDocument();
  });

  it("renders a Null switch beside the label when onIsNullChange is given", () => {
    render(<Harness initialValue="" label="Name" onIsNullChange={() => {}} />);
    expect(screen.getByText("Null")).toBeInTheDocument();
  });

  it("hides children while isNull, and calls onIsNullChange on toggle", async () => {
    const user = userEvent.setup();
    const onIsNullChange = vi.fn();
    render(<Harness initialValue="hi" label="Name" isNull onIsNullChange={onIsNullChange} />);
    expect(screen.queryByDisplayValue("hi")).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(onIsNullChange).toHaveBeenCalledWith(true);
  });
```

Add the two missing imports at the top of the file:

```tsx
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
```

#### packages/react/src/forms/GroupField.tsx

**1 — `GroupFieldProps`.** Add two props:

```ts
export interface GroupFieldProps extends Omit<BaseFormFieldProps<never>, "renderControl"> {
  /** The group's own fields — rendered by the caller, same as every other `renderItem`-style slot in this entry. */
  children: ReactNode;
  /** Collapsible as an accordion item; `false` renders a plain fieldset with no trigger. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Sub-field count shown beside the label, even while collapsed. Caller-supplied since this component never walks a `fieldDef`. */
  fieldCount?: number;
  /** Whether this group's value is currently `null`. Ignored unless `onIsNullChange` is also given. */
  isNull?: boolean;
  /** Toggles `isNull`; forwarded to the inner `FormFieldLayout`. */
  onIsNullChange?: (isNull: boolean) => void;
}
```

**2 — forward to `FormFieldLayout`.** Inside the `AccordionContent`:

```tsx
          <FormFieldLayout
            id={field.name}
            field={field}
            submissionAttempts={submissionAttempts}
            readOnly={props.readOnly}
            isNull={props.isNull}
            onIsNullChange={props.onIsNullChange}
          >
```

#### packages/react/src/forms/GroupField.test.tsx

**1 — `Harness`.** Add `isNull`/`onIsNullChange` props, forwarded to `field.GroupField`:

```tsx
function Harness(props: {
  collapsible?: boolean;
  defaultOpen?: boolean;
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
}) {
  const form = useAppForm({ defaultValues: { seo: { title: "x" } } });
  return (
    <form.AppForm>
      <form.AppField name="seo">
        {(field) => (
          <field.GroupField
            label="SEO"
            collapsible={props.collapsible}
            defaultOpen={props.defaultOpen}
            isNull={props.isNull}
            onIsNullChange={props.onIsNullChange}
          >
            <span data-testid="group-children">children</span>
          </field.GroupField>
        )}
      </form.AppField>
    </form.AppForm>
  );
}
```

**2 — new test.** Append inside `describe("GroupField", ...)`:

```tsx

  it("hides children and shows a Null switch when isNull", () => {
    render(<Harness collapsible defaultOpen isNull onIsNullChange={() => {}} />);
    expect(screen.queryByTestId("group-children")).not.toBeInTheDocument();
    expect(screen.getByText("Null")).toBeInTheDocument();
  });
```

#### packages/react/src/fields/group/Field.tsx

Full file (the `useFieldContext()` call that previously only "bound the accordion" now computes
`isNull`/`onIsNullChange`):

```tsx
"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import type { GroupField as GroupFieldDef } from "@vexcms/core";
import type { FieldComponentProps } from "@vexcms/core";
import { GroupField, useFieldContext } from "../../forms";
import { RenderFields } from "../RenderFields";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * The group admin field's own render body — reads the `FieldApi` provided
 * by the enclosing `AdminFieldBinding` via `useFieldContext()`, both to bind
 * the accordion to the field's own form path and, when `fieldDef.nullable`,
 * to compute the null-toggle state/handler the app form's `GroupField`
 * forwards to `FormFieldLayout` — and maps `fieldDef.fields` onto the
 * group's own fields through `RenderFields` as `children`. Wrapped in its
 * own `role="group" aria-disabled` element — `GroupField` itself sets
 * `aria-labelledby` on its accordion but never forwards a readOnly signal
 * of its own, unlike `ArrayField`/`BlocksField` — so this wraps one, same
 * `[role="group"][aria-labelledby]` contract every container field
 * exposes to the field-input-contract test harness.
 *
 * @param props - {@link FieldComponentProps} narrowed to `GroupField`, for this item's own level of nesting.
 * @returns The group's `GroupField` body, wrapped in a labelled group.
 */
function GroupFieldAdminInner(props: FieldComponentProps<{}, GroupFieldDef>) {
  const field = useFieldContext<Record<string, unknown> | null>();
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const isNull = Boolean(props.fieldDef.nullable) && field.state.value === null;
  const onIsNullChange = props.fieldDef.nullable
    ? (nextIsNull: boolean) =>
        field.handleChange(nextIsNull ? null : (props.fieldDef.defaultValue as Record<string, unknown>))
    : undefined;
  return (
    <div role="group" aria-labelledby={`${props.name}-label`} aria-disabled={readOnly}>
      <GroupField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        index={props.index}
        fieldCount={Object.keys(props.fieldDef.fields).length}
        defaultOpen={!props.fieldDef.admin.defaultCollapsed}
        readOnly={readOnly}
        isNull={isNull}
        onIsNullChange={onIsNullChange}
      >
        <RenderFields
          fields={props.fieldDef.fields}
          collection={props.collection}
          namePrefix={props.name}
          readOnly={readOnly}
        />
      </GroupField>
    </div>
  );
}

/**
 * Group admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders the app
 * form's `GroupField` fieldset layout wrapping this group's rendered child
 * fields.
 *
 * @param props - {@link FieldComponentProps} narrowed to `GroupField`.
 * @returns The app form's `GroupField`, wrapping this group's rendered child fields.
 */
export function GroupFieldAdmin(
  props: FieldComponentProps<{}, GroupFieldDef> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <GroupFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
```

#### packages/react/src/forms/ArrayField.tsx

**1 — `ArrayFieldProps`.** Add two props at the end of the interface, after `headerActions`:

```ts
  /** Field-level actions rendered beside the label, ahead of Collapse all / Expand all. */
  headerActions?: ReactNode;
  /** Whether this array's value is currently `null`. Ignored unless `onIsNullChange` is also given. */
  isNull?: boolean;
  /** Toggles `isNull`; forwarded to the inner `FormFieldLayout`. */
  onIsNullChange?: (isNull: boolean) => void;
}
```

**2 — forward to `FormFieldLayout`.** Its single call site:

```tsx
    <FormFieldLayout
      id={field.name}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
      readOnly={props.readOnly}
      isNull={props.isNull}
      onIsNullChange={props.onIsNullChange}
    >
```

#### packages/react/src/fields/array/Field.tsx

**1 — value type + isNull computation.** In `ArrayFieldAdminInner`, change the `useFieldContext`
generic and add the computation right after `readOnly`:

```ts
  const field = useFieldContext<ArrayType[] | null>();
```

```ts
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const isNull = Boolean(props.fieldDef.nullable) && field.state.value === null;
  const onIsNullChange = props.fieldDef.nullable
    ? (nextIsNull: boolean) =>
        field.handleChange(nextIsNull ? null : (props.fieldDef.defaultValue as ArrayType[]))
    : undefined;
  const itemsHaveOwnHeader = itemFieldDef.type === ADMIN_FIELDS.group.type;
```

**2 — forward to `<ArrayField>`.** Add beside `readOnly={readOnly}`:

```tsx
        readOnly={readOnly}
        isNull={isNull}
        onIsNullChange={onIsNullChange}
        itemsHaveOwnHeader={itemsHaveOwnHeader}
```

#### packages/react/src/forms/BlocksField.tsx

**1 — `BlocksFieldProps`.** Add two props after `cloneBlock`:

```ts
  cloneBlock?: (block: TBlock) => TBlock;
  /** Whether this blocks field's value is currently `null`. Ignored unless `onIsNullChange` is also given. */
  isNull?: boolean;
  /** Toggles `isNull`; forwarded to the inner `FormFieldLayout`. */
  onIsNullChange?: (isNull: boolean) => void;
}
```

**2 — forward to `FormFieldLayout`.** Its single call site:

```tsx
  return (
    <FormFieldLayout
      id={field.name}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
      readOnly={props.readOnly}
      isNull={props.isNull}
      onIsNullChange={props.onIsNullChange}
    >
```

#### packages/react/src/fields/blocks/Field.tsx

**1 — value type + isNull computation.** In `BlocksFieldAdminInner`:

```ts
  const field = useFieldContext<GenericBlock[] | null>();
```

```ts
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly || !canEdit;
  const isNull = Boolean(props.fieldDef.nullable) && field.state.value === null;
  const onIsNullChange = props.fieldDef.nullable
    ? (nextIsNull: boolean) =>
        field.handleChange(nextIsNull ? null : (props.fieldDef.defaultValue as GenericBlock[]))
    : undefined;
  const items: GenericBlock[] = field.state.value ?? [];
```

**2 — forward to `<BlocksField>`.** Add beside `readOnly={readOnly}`:

```tsx
        readOnly={readOnly}
        isNull={isNull}
        onIsNullChange={onIsNullChange}
        blockTypes={blockTypes}
```

#### packages/react/src/forms/JsonField.tsx

**1 — `JsonFieldProps`.** Add two props:

```ts
/** Props for {@link JsonField}. */
export type JsonFieldProps = BaseFormFieldProps<unknown> & {
  /** Forwarded to the built-in editor's placeholder, shown only when the document is empty. */
  placeholder?: string;
  /** Whether this field's value is currently `null`. Ignored unless `onIsNullChange` is also given. */
  isNull?: boolean;
  /** Toggles `isNull`; forwarded to the inner `FormFieldLayout`. */
  onIsNullChange?: (isNull: boolean) => void;
};
```

**2 — forward to all three `FormFieldLayout` calls.** Each of the `renderControl`, `readOnly`, and
main return branches gains `isNull={props.isNull} onIsNullChange={props.onIsNullChange}` beside
its existing `readOnly={props.readOnly}` line.

#### packages/react/src/fields/json/Field.tsx

Full file (restructured into an Inner component so `useFieldContext()` can compute the null-toggle state):

```tsx
"use client";

import { type ComponentOverrideInput, type JsonField as JsonFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { JsonField, useFieldContext } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { JsonEditor } from "../../ui/JsonEditor";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * JSON admin field's own render body — reads the `FieldApi` provided by the
 * enclosing `AdminFieldBinding` to compute the null-toggle state/handler
 * when `fieldDef.nullable`, and maps `fieldDef` to `@vexcms/react/form`'s
 * `JsonField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `JsonField`.
 * @returns `JsonField`, configured for this field instance.
 */
function JsonFieldAdminInner(props: FieldComponentProps<{}, JsonFieldDef>) {
  const field = useFieldContext<unknown>();
  const isNull = Boolean(props.fieldDef.nullable) && field.state.value === null;
  const onIsNullChange = props.fieldDef.nullable
    ? (nextIsNull: boolean) => field.handleChange(nextIsNull ? null : props.fieldDef.defaultValue)
    : undefined;
  function renderBareControl(controlProps: FieldControlProps<unknown>) {
    return (
      <JsonEditor
        id={controlProps.id}
        value={JSON.stringify(controlProps.value ?? null, null, 2)}
        onChange={(text) => {
          try {
            controlProps.onChange(JSON.parse(text));
          } catch {
            // left uncommitted — the override's own control owns parse-error surfacing
          }
        }}
        onBlur={controlProps.onBlur}
        readOnly={controlProps.readOnly}
        placeholder={props.fieldDef.admin.placeholder}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
        aria-required={props.fieldDef.required}
      />
    );
  }
  const overrideControl = useFieldControlOverride<unknown>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<unknown>>[]
      | undefined,
    defaultControl: renderBareControl,
  });
  return (
    <JsonField
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
      placeholder={props.fieldDef.admin.placeholder}
      renderControl={overrideControl}
      isNull={isNull}
      onIsNullChange={onIsNullChange}
    />
  );
}

/**
 * JSON admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders the field's
 * own body.
 *
 * @param props - {@link FieldComponentProps} narrowed to `JsonField`.
 * @returns `JsonField`, configured for this field instance.
 */
export function JsonFieldAdmin(props: FieldComponentProps<{}, JsonFieldDef> & { field?: AnyFieldApi }) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <JsonFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
```

#### packages/react/src/forms/CheckboxField.tsx

Full file. Unlike the other toggle fields, checkbox's control+inline label live in
`FormFieldLayout`'s `before` slot, not `children` — it builds its OWN "Null" row using the shared
`NullFieldToggle`, rather than going through `FormFieldLayout`'s `isNull`/`onIsNullChange` props:

```tsx
"use client";

import type { ReactNode } from "react";
import { Activity } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, NullFieldToggle, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { cn } from "../utils/cn";
import { FieldDescription, FieldLabel } from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link CheckboxField}. */
export interface CheckboxFieldProps extends BaseFormFieldProps<boolean> {
  /** Whether this field's value is currently `null`. Ignored unless `onIsNullChange` is also given. */
  isNull?: boolean;
  /** Toggles `isNull`. Omit to render no "Null" switch at all. */
  onIsNullChange?: (isNull: boolean) => void;
}

/**
 * A checkbox field bound to the nearest `<form.AppField name="...">`. Unlike
 * every other app-form leaf field, its label renders beside the control
 * rather than above it — `FormFieldLayout` is used for the error only; the
 * description renders directly under the inline label text, indented
 * (`pl-6`) to align with it rather than the checkbox box, the standard
 * checkbox-with-hint pattern. When `onIsNullChange` is given, the control
 * and description hide while `isNull` and a `NullFieldToggle` renders
 * beside the (still-visible) inline label — `FormFieldLayout`'s own
 * `isNull`/`onIsNullChange` props are unused here since this field never
 * passes anything through `children`.
 *
 * @param props - See {@link CheckboxFieldProps} and {@link BaseFormFieldProps}.
 * @returns The checkbox + inline label row, description and error.
 */
export function CheckboxField(props: CheckboxFieldProps): ReactNode {
  const field = useFieldContext<boolean>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value: field.state.value ?? false,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Checkbox
      id={field.name}
      aria-labelledby={`${field.name}-label`}
      required={props.required}
      readOnly={props.readOnly}
      disabled={props.readOnly}
      checked={field.state.value ?? false}
      onCheckedChange={(checked) => field.handleChange(checked)}
      onBlur={field.handleBlur}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const inlineLabel = (
    <FieldLabel htmlFor={field.name} id={`${field.name}-label`}>
      {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
      {props.label}
      {props.required && <span className="text-red-500">*</span>}
    </FieldLabel>
  );
  return (
    <FormFieldLayout
      id={field.name}
      field={field}
      submissionAttempts={submissionAttempts}
      className={cn("py-2", props.className)}
      readOnly={props.readOnly}
      before={
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              {!props.isNull && control}
              {inlineLabel}
            </div>
            {props.onIsNullChange && (
              <NullFieldToggle isNull={Boolean(props.isNull)} onIsNullChange={props.onIsNullChange} />
            )}
          </div>
          {!props.isNull && (
            <Activity mode={props.description ? "visible" : "hidden"}>
              <FieldDescription id={`${field.name}-description`} data-slot="form-description" className="pl-6">
                {props.description}
              </FieldDescription>
            </Activity>
          )}
        </div>
      }
    >
      {null}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/CheckboxField.test.tsx

**1 — `Harness`.** Add `isNull`/`onIsNullChange` passthrough:

```tsx
function Harness(props: {
  initialValue: boolean | null;
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
}) {
  const form = useAppForm({ defaultValues: { published: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="published">
        {(field) => (
          <field.CheckboxField
            label="Published"
            required
            isNull={props.isNull}
            onIsNullChange={props.onIsNullChange}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.published}>
        {(value) => <output data-testid="value-probe">{String(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}
```

**2 — new tests.** Append inside `describe("CheckboxField", ...)`:

```tsx

  it("renders no Null switch when onIsNullChange is omitted", () => {
    render(<Harness initialValue={false} />);
    expect(screen.queryByText("Null")).not.toBeInTheDocument();
  });

  it("hides the checkbox control but keeps the label visible while isNull", () => {
    render(<Harness initialValue={null} isNull onIsNullChange={() => {}} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Null")).toBeInTheDocument();
  });
```

#### packages/react/src/fields/richtext/Field.tsx

Three edits inside `RichTextFieldAdminInner`.

**1 — import.** Add `NullFieldToggle` to the existing `../../forms` import:

```ts
import { useFieldContext, useFormContext, isFieldShowingError, NullFieldToggle } from "../../forms";
```

**2 — value type + isNull computation, and the label row.** Replace:

```ts
  const field = useFieldContext<RichTextDocument>();
  const config = useVexConfig();
  // Both readOnly sources are independent — either one alone disables
  // editing, matching every other field type's own OR-composition.
  const isReadOnly = props.readOnly || props.fieldDef.admin.readOnly;
```

with:

```ts
  const field = useFieldContext<RichTextDocument | null>();
  const config = useVexConfig();
  // Both readOnly sources are independent — either one alone disables
  // editing, matching every other field type's own OR-composition.
  const isReadOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const isNull = Boolean(props.fieldDef.nullable) && field.state.value === null;
  const onIsNullChange = props.fieldDef.nullable
    ? (nextIsNull: boolean) =>
        field.handleChange(nextIsNull ? null : (props.fieldDef.defaultValue as RichTextDocument))
    : undefined;
```

**3 — label + both `FieldGroupBox` call sites.** Replace:

```tsx
  const label = (
    <span
      id={`${props.name}-label`}
      className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]/field:opacity-50"
    >
      {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
      {props.fieldDef.label || props.name}
      {props.fieldDef.required && <span className="text-red-500">*</span>}
    </span>
  );

  if (!config.editor) {
    return (
      <FieldGroupBox labelId={`${props.name}-label`} label={label} description={props.fieldDef.description}>
```

with:

```tsx
  const label = (
    <span
      id={`${props.name}-label`}
      className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]/field:opacity-50"
    >
      {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
      {props.fieldDef.label || props.name}
      {props.fieldDef.required && <span className="text-red-500">*</span>}
    </span>
  );
  const labelRow = onIsNullChange ? (
    <div className="flex items-center justify-between gap-2">
      {label}
      <NullFieldToggle isNull={isNull} onIsNullChange={onIsNullChange} />
    </div>
  ) : (
    label
  );

  if (!config.editor) {
    return (
      <FieldGroupBox labelId={`${props.name}-label`} label={labelRow} description={props.fieldDef.description}>
```

And the main return:

```tsx
  return (
    <FieldGroupBox
      labelId={`${props.name}-label`}
      label={labelRow}
      description={props.fieldDef.description}
      disabled={isReadOnly}
      error={showError && <FieldError role="alert">{errorMessage}</FieldError>}
    >
      {!isNull && (
        <EditorComponent
          value={field.state.value ?? props.fieldDef.defaultValue ?? []}
          onChange={(next) => field.handleChange(next)}
          readOnly={isReadOnly}
          name={props.name}
          label={props.fieldDef.label}
          description={props.fieldDef.description}
          placeholder={props.fieldDef.admin.placeholder}
          mediaCollectionSlug={props.fieldDef.mediaCollectionSlug}
          mediaAltRequired={(targetCollectionConfig?.fields.alt as AdminDataField | undefined)?.required === true}
          mediaResults={targetCollectionConfig ? mediaResults : undefined}
          mediaSearchTerm={targetCollectionConfig ? mediaSearchTerm : undefined}
          onMediaSearchChange={targetCollectionConfig ? setMediaSearchTerm : undefined}
          mediaCanLoadMore={targetCollectionConfig ? mediaResults.length >= mediaLimit : undefined}
          onMediaLoadMore={
            targetCollectionConfig ? () => setMediaLimit((limit) => limit + 24) : undefined
          }
          mediaIsLoading={targetCollectionConfig ? mediaIsLoading : undefined}
          generateUploadUrl={targetCollectionConfig ? handleGenerateUploadUrl : undefined}
          createMediaDocument={targetCollectionConfig ? handleCreateMediaDocument : undefined}
        />
      )}
    </FieldGroupBox>
  );
}
```

`array`/`blocks`/`json` follow the identical `isNull`/`onIsNullChange` contract verified above by
`FormFieldLayout.test.tsx`, `GroupField.test.tsx` and `CheckboxField.test.tsx`; their own existing
suites stay green unchanged since every new prop is optional and defaults to the prior behavior.

#### packages/react/src/forms/changedValues.ts

No change — `changedValues(form)` keeps its signature. The save-path transform below wraps its
RESULT at each real submission site instead, so every caller that only diffs form state (test
harnesses, `useResetWhenSaved`, `useLiveFieldMerge`) is unaffected.

#### packages/react/src/collections/editView/CollectionEditView.tsx

**1 — import.** Add `resolveNullableSaveValues` to the existing `@vexcms/core` import.

**2 — the two submit branches.** Both occurrences of `const changes = changedValues(form);`
(inside the `isVersioned` branch, and the plain-update branch after it) become:

```ts
        const changes = resolveNullableSaveValues({ values: changedValues(form), fields: collection.fields });
```

**3 — autosave.** `values: changedValues(form),` becomes:

```ts
    values: resolveNullableSaveValues({ values: changedValues(form), fields: collection.fields }),
```

#### packages/react/src/globals/GlobalEditView.tsx

**1 — import.** Add `resolveNullableSaveValues`.

**2 — before-first-save branches.** `await saveDraftMutation({ global: global.slug, data: value, ...restoredFrom });`
and `await mutateAsync({ slug: global.slug, data: value });` both become:

```ts
          await saveDraftMutation({
            global: global.slug,
            data: resolveNullableSaveValues({ values: value, fields: global.fields }),
            ...restoredFrom,
          });
```

```ts
        await mutateAsync({
          slug: global.slug,
          data: resolveNullableSaveValues({ values: value, fields: global.fields }),
        });
```

**3 — both subsequent `const changes = changedValues(form);` occurrences** become:

```ts
      const changes = resolveNullableSaveValues({ values: changedValues(form), fields: global.fields });
```

**4 — autosave.** `values: globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>),` becomes:

```ts
    values: resolveNullableSaveValues({
      values: globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>),
      fields: global.fields,
    }),
```

#### packages/react/src/media/MediaCollectionEditView.tsx

**1 — import.** Add `resolveNullableSaveValues`.

**2.** `const changes = changedValues(form);` becomes:

```ts
      const changes = resolveNullableSaveValues({ values: changedValues(form), fields: collection.fields });
```

#### packages/react/src/versions/VersionPublishAction.tsx

**1 — import.** Add `resolveNullableSaveValues` to the existing `@vexcms/core` import.

**2.** `const changes = changedValues(form);` becomes (`fields` is already computed at the top of
the component):

```ts
      const changes = resolveNullableSaveValues({ values: changedValues(form), fields });
```

#### packages/react/src/collections/listView/create/ListViewCreateDocumentForm.tsx

**1 — import.** Add `resolveNullableSaveValues` to the existing `@vexcms/core` import.

**2.** `id = await mutateAsync({ collection: collection.slug, data: value });` becomes:

```ts
        id = await mutateAsync({
          collection: collection.slug,
          data: resolveNullableSaveValues({ values: value, fields: collection.fields }),
        });
```

#### packages/telemetry/src/types.ts

Add `nullable?: boolean;` beside the existing `required?: boolean;` member of `AnonymizedField`:

```ts
export interface AnonymizedField {
  path: string;
  type: AdminFieldType;
  required?: boolean;
  nullable?: boolean;
  hidden?: boolean;
```

#### packages/telemetry/src/anonymizeConfig.ts

`dataFieldBase`'s returned object — add `nullable: field.nullable,` beside `required: field.required,`:

```ts
  return {
    path,
    type: field.type,
    required: field.required,
    nullable: field.nullable,
    hidden: field.admin.hidden,
```

#### packages/telemetry/src/anonymizeConfig.test.ts

The one exact-shape test (`"matches the full expected payload for a minimal config"`) needs
`nullable: false` added to both field entries:

```ts
      fields: [
        {
          path: "c1.f1",
          type: "text",
          required: true,
          nullable: false,
          hidden: false,
          readOnly: false,
          position: "main",
          cellAlignment: "left",
          hasValidate: false,
          hasIndex: false,
          hasMask: false,
          min: 3,
          max: 100,
          hasSearchIndex: false,
          enableSorting: false,
          enableHiding: true,
        },
        {
          path: "c1.f2",
          type: "checkbox",
          required: false,
          nullable: false,
          hidden: false,
          readOnly: false,
          position: "main",
          cellAlignment: "left",
          hasValidate: false,
          hasIndex: false,
          enableSorting: false,
          enableHiding: true,
          defaultValue: true,
        },
      ],
```

#### apps/test/src/db/constants/index.ts

Add beside `TABLE_SLUG_FIELDS`:

```ts
export const TABLE_SLUG_STORAGE_SHAPES = "storage_shapes" as const;
```

#### apps/test/src/vexcms/collections/storageShapes.ts

New file.

```ts
import { defineCollection, group, number, select, text } from "@vexcms/core";
import { TABLE_SLUG_STORAGE_SHAPES } from "~/db/constants";

/**
 * Dogfood collection for launch plan item 18 (field type coverage): every
 * new input/cell/override/nullable path lands a field here as its step
 * ships, so it is immediately visible in the admin on `:3020`. Fields are
 * appended, never reordered or renamed, across Steps 2–9.
 */
export const storageShapes = defineCollection({
  slug: TABLE_SLUG_STORAGE_SHAPES,
  labels: {
    singular: "Storage Shape",
    plural: "Storage Shapes",
  },
  admin: {
    useAsTitle: "name",
    icon: "Database",
  },
  versions: {
    drafts: true,
  },
  fields: {
    // ── Step 2 — nullable ────────────────────────────────────────────────
    name: text({ label: "Name", required: true }),
    nullableNote: text({ label: "Nullable Note", nullable: true }),
    nullableCount: number({ label: "Nullable Count", nullable: true }),
    nullableStatus: select({
      label: "Nullable Status",
      nullable: true,
      hasMany: false,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    }),
    nullableMeta: group({
      label: "Nullable Meta",
      nullable: true,
      fields: {
        note: text({ label: "Note" }),
      },
    }),
  },
});
```

#### apps/test/src/vexcms/collections/index.ts

Add in alphabetical position, after `posts`:

```ts
export * from "./posts";
export * from "./storageShapes";
export * from "./telemetryEvents";
```

#### apps/test/src/vex.config.ts

**1 — import.** Add `storageShapes` to the existing `~/vexcms/collections` import, alphabetically
after `posts`:

```ts
import {
  articles,
  caseStudies,
  changelog,
  comments,
  fields,
  footers,
  headers,
  images,
  pages,
  posts,
  storageShapes,
  telemetryEvents,
  telemetryProjects,
  testimonials,
  themes,
  users,
} from "~/vexcms/collections";
```

**2 — registration.** Add to the `collections` array:

```ts
  collections: [
    pages,
    users,
    headers,
    footers,
    themes,
    articles,
    caseStudies,
    changelog,
    comments,
    posts,
    fields,
    storageShapes,
    testimonials,
    telemetryEvents,
    telemetryProjects,
  ],
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`;
`pnpm --filter test vex:generate` then read `convex/vex.schema.ts` for `v.nullable(...)` on
`storage_shapes`' `nullableNote`/`nullableCount`/`nullableStatus`/`nullableMeta` and `vex.types.ts`
for `| null` on the same four properties; `pnpm typecheck`.

### Step 3 — `number({ schema: { validator: "int64" } })` [agent]

> Writer note: TypeScript does not narrow a discriminated union from a NESTED
> optional-chain comparison (`field.schema?.validator === "int64"`) — verified
> against this repo's own `tsc` (6.0.3, `--strict`): the branch still types
> `field.defaultValue` as `number | bigint`. Every read of `NumberField`'s
> int64-only properties (`min`/`max`/`defaultValue` as `bigint`) therefore goes
> through an explicit type-predicate guard (`isInt64NumberField`,
> `fields/number/utils.ts`), not an inline `field.schema?.validator === "int64"`
> check. `spec-tasks.md`'s one-line description ("bigint min/max/defaultValue
> when schema.validator is int64") undersells this — it's the main design
> decision in this step, so later steps repeating the same `schema.validator`
> pattern (select/relationship/upload, Steps 4–5) hit the same guard
> requirement.
>
> Writer note: `db/queryArgs.ts`'s `validateWhereNode` and
> `convertCommitTsWhereToNs` need NO code change for int64. `validateWhereNode`
> never inspects `value`'s runtime type (only `{ field, op, value }` shape), so
> a `bigint` leaf already passes. `convertCommitTsWhereToNs` filters leaves by
> `field.type === ADMIN_FIELDS.commitTs.type` — an int64 `number` field's
> `type` is `"number"`, never `"commitTs"`, so it was already excluded. Both
> checklist lines below are regression tests only, not production edits.
>
> Writer note: the per-telemetry-attribute addendum from `Main` renames this
> step's telemetry field from `schema.validator` (spec-tasks.md's wording) to
> `schemaValidator?: FieldSchemaValidator`, set only when the input configured
> one. Applied below.

Why: int64 counters and ids (`v.int64()`, `bigint`) have no field. The override keeps the number
input and stores a native `bigint` in the schema, the generated types, Vex reads and the form.
Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`; generated schema `v.int64()` / type `bigint`; `pnpm typecheck`.

- [ ] core `fields/constants.ts`: `FIELD_SCHEMA_VALIDATORS`/`FieldSchemaValidator`
- [ ] core `fields/utils.ts`: generic `resolveFieldLimit<T extends number | bigint>` + test
- [ ] core `fields/number/types.ts`: `schema?: { validator?: "int64" }` input; resolved `schema.validator: "int64"` only when set; `bigint` value, min/max and default when int64
- [ ] core `fields/number/utils.ts`: `isInt64NumberField` type-predicate guard + test
- [ ] core `fields/number/config.ts`: stamp `interfaceType` `"bigint"` + default `0n` for int64 + test
- [ ] core `fields/number/validator.ts`: `v.int64()` + test
- [ ] core `fields/number/inputSchema.ts`: `z.bigint()` with min/max + test
- [ ] core `collections/listView/listViewUrlState.ts`: `bigint` filter value kind (decimal string in the URL, `BigInt` on decode) + test
- [ ] core `db/queryArgs.ts`: regression tests only — `validateWhereNode` accepts a `bigint` leaf value, `convertCommitTsWhereToNs` leaves an int64 `number` leaf untouched (see Writer note)
- [ ] react `collections/listView/filters/listViewFilterOperators.ts`: no change — `LIST_VIEW_FILTER_OPS_BY_FIELD_TYPE` is keyed by `field.type` (`"number"`), which int64 shares with float64
- [ ] react `forms/NumberField.tsx` + `fields/number/Field.tsx`: integer text entry bound to a `bigint` value + tests
- [ ] react `fields/number/{Cell,FilterInput,columnDef}.tsx`: format and filter `bigint` values + tests
- [ ] telemetry `anonymizeConfig.ts` + `types.ts`: record `schemaValidator` + test
- [ ] apps/test `storageShapes`: an int64 counter field (`viewCount`)

#### packages/core/src/fields/constants.ts

1 edit — insert the schema-validator constant block after the existing `AdminFieldTsType` type alias (everything else in the file is unchanged).

```ts
/** Union of all TypeScript type strings corresponding to the supported field types (e.g. `"string"` | `"number"` | ...). */
export type AdminFieldTsType = (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["interfaceType"];

/**
 * Convex storage validator names a field's `schema: { validator }` option may
 * select, mirroring Convex's own vocabulary. `number` accepts `"int64"`;
 * `select` accepts `"literal" | "string"`; `relationship`/`upload` accept
 * `"id" | "string"`. Each field type's own `schema` input narrows this to its
 * own subset.
 */
export const FIELD_SCHEMA_VALIDATORS = {
  int64: "int64",
  literal: "literal",
  string: "string",
  id: "id",
} as const;

/** Derived from {@link FIELD_SCHEMA_VALIDATORS}. */
export type FieldSchemaValidator = (typeof FIELD_SCHEMA_VALIDATORS)[keyof typeof FIELD_SCHEMA_VALIDATORS];
```

#### packages/core/src/fields/utils.ts

1 edit — widen `resolveFieldLimit` to a generic over `number | bigint` (defaulting to `number`, so every existing call site is unaffected) by replacing its body.

```ts
/**
 * Resolves a field's `min`/`max` input into its final `[value, error]`
 * tuple. A bare `number`/`bigint` input is paired with `defaultError(value)`;
 * a `[value, error]` tuple input is returned as-is; `undefined` stays
 * `undefined` (no constraint configured). Generic over `number | bigint` so
 * an int64 `number()` field can resolve `bigint` limits through the same
 * helper every other field type uses.
 *
 * @param props - Input props.
 * @param props.limit - The field's raw `min`/`max` input.
 * @param props.defaultError - Builds the default error message from the
 *   resolved value, when `limit` is a bare value. Ignored when `limit` is
 *   already a `[value, error]` tuple.
 * @returns The resolved `[value, error]` tuple, or `undefined`.
 *
 * @example
 * ```ts
 * resolveFieldLimit({ limit: 3, defaultError: () => "Too short." })
 * // → [3, "Too short."]
 *
 * resolveFieldLimit({ limit: [3, "Need 3+ chars."], defaultError: () => "Too short." })
 * // → [3, "Need 3+ chars."]
 *
 * resolveFieldLimit({ limit: undefined, defaultError: () => "Too short." })
 * // → undefined
 *
 * resolveFieldLimit<bigint>({ limit: 5n, defaultError: (value) => `At least ${value}.` })
 * // → [5n, "At least 5."]
 * ```
 */
export function resolveFieldLimit<T extends number | bigint = number>(props: {
  limit: T | readonly [value: T, error: string] | undefined;
  defaultError: (value: T) => string;
}): readonly [value: T, error: string] | undefined {
  if (props.limit === undefined) return undefined;
  if (Array.isArray(props.limit)) return props.limit;
  return [props.limit, props.defaultError(props.limit)] as const;
}
```

#### packages/core/src/fields/utils.test.ts

1 edit — add a bigint case to the existing `resolveFieldLimit` describe block, after its last test (`"does not call defaultError for a tuple input"`).

```ts
  it("resolves a bare bigint the same way as a bare number (int64 limits)", () => {
    expect(
      resolveFieldLimit<bigint>({
        limit: 5n,
        defaultError: (value) => `At least ${value} required.`,
      }),
    ).toEqual([5n, "At least 5 required."]);
    expect(
      resolveFieldLimit<bigint>({
        limit: [3n, "Need 3+."],
        defaultError: () => "Too short.",
      }),
    ).toEqual([3n, "Need 3+."]);
  });
});
```

#### packages/core/src/fields/number/types.ts

4 edits.

**1 — imports.** Beside the existing `ADMIN_FIELDS` import, pull in the new constant and its type.

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS, type FieldSchemaValidator } from "../constants";
```

**2 — int64 limit types.** Insert after `NumberFieldAdminConfig` (the interface ending the line before `/**\n * Configuration input for a \`number()\` field.`).

```ts
/**
 * A `number()` field's `min`/`max` input when it stores `int64` — a bare
 * `bigint` pairs with the field's own default error message, or a `[value,
 * error]` tuple overrides it. @see {@link FieldLimitInput} for the `float64` equivalent
 */
export type Int64FieldLimitInput = bigint | readonly [value: bigint, error: string];

/**
 * Resolved `int64` `min`/`max` constraint after defaults are applied —
 * always a `[value, error]` tuple. @see {@link FieldLimit} for the `float64` equivalent
 */
export type Int64FieldLimit = readonly [value: bigint, error: string];
```

**3 — replace `NumberFieldInput`.** Properties shared by both storage modes move to an unexported `NumberFieldInputBase`; `Float64NumberFieldInput`/`Int64NumberFieldInput` each fix `schema`/`defaultValue`/`min`/`max`/`validate` to their own value type, and `NumberFieldInput` becomes their union — the whole block (previously lines 79–103) is replaced:

```ts
interface NumberFieldInputBase<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Admin UI configuration for this field. */
  admin?: NumberFieldAdminInput<TCollectionSlug>;
  /**
   * Step increment for the number input's native spinner/validation
   * (the HTML `step` attribute) — ignored for an `int64` field, whose input
   * is a plain integer text entry with no spinner. Submitted values are
   * never rounded or rejected against it.
   */
  step?: number;
}

/** `number()` input storing the default `v.float64()` shape — a plain JS `number`. */
export interface Float64NumberFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends NumberFieldInputBase<TCollectionSlug, TFieldKey, TFieldMeta> {
  schema?: never;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect database values — only the form's initial state.
   */
  defaultValue?: number;
  /** Minimum allowed numeric value. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum allowed numeric value. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
  /** Server-only async validation with `value` typed as `number`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, number>): Promise<void> | void;
}

/**
 * `number()` input storing `v.int64()` — a native `bigint`, selected with
 * `schema: { validator: "int64" }`. Reads return `bigint`; the admin form
 * holds `bigint`; `min`/`max`/`defaultValue` are `bigint`-typed.
 */
export interface Int64NumberFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends NumberFieldInputBase<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Storage override — `"int64"` stores `v.int64()` instead of the default `v.float64()`. */
  schema: { validator: typeof FIELD_SCHEMA_VALIDATORS.int64 };
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Defaults to `0n` when omitted. Does not affect database values.
   */
  defaultValue?: bigint;
  /** Minimum allowed value. @see {@link Int64FieldLimitInput} */
  min?: Int64FieldLimitInput;
  /** Maximum allowed value. @see {@link Int64FieldLimitInput} */
  max?: Int64FieldLimitInput;
  /** Server-only async validation with `value` typed as `bigint`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, bigint>): Promise<void> | void;
}

/**
 * Configuration input for a `number()` field.
 *
 * Number fields store numeric values — prices, quantities, ratings, ages, counts, etc. By
 * default they store a `v.float64()`; `schema: { validator: "int64" }` stores a native
 * `bigint` instead (`v.int64()`), typing `min`/`max`/`defaultValue`/`validate` as `bigint`.
 * All properties are optional; unset properties fall back to the defaults listed below.
 *
 * **Defaults applied by `number()`:**
 * ```ts
 * {
 *   type:     "number",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width: "100%",  // spans the full form width, not half
 *     cellAlignment: "left",  // value aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label is inferred from the key ("Price")
 * price: number()
 *
 * // Required quantity with a minimum of 1 and a database index
 * quantity: number({ required: true, min: 1, index: "by_quantity" })
 *
 * // An int64 counter — bigint everywhere
 * viewCount: number({ schema: { validator: "int64" }, min: 0n })
 * ```
 *
 * @see {@link NumberField} for the resolved type after defaults are applied
 * @see {@link number} for the config function that applies defaults
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export type NumberFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> =
  | Float64NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>
  | Int64NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>;
```

**4 — replace `NumberField`.** Same split for the resolved type (previously lines 111–135):

```ts
interface NumberFieldBase<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.number.type;
  label: string;
  required: boolean;
  admin: NumberFieldAdminConfig<TCollectionSlug>;
  /** @see {@link NumberFieldInputBase.step} */
  step?: number;
}

/** Resolved `number()` field storing the default `v.float64()` shape. */
export interface Float64NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends NumberFieldBase<TCollectionSlug, TFieldMeta> {
  schema?: never;
  interfaceType: "number";
  defaultValue: number;
  /** @see {@link FieldLimit} */
  min?: FieldLimit;
  /** @see {@link FieldLimit} */
  max?: FieldLimit;
  validate?(props: FieldValidateProps<TCollectionSlug, number>): Promise<void> | void;
}

/** Resolved `number()` field storing `v.int64()` — a native `bigint`. */
export interface Int64NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends NumberFieldBase<TCollectionSlug, TFieldMeta> {
  schema: { validator: typeof FIELD_SCHEMA_VALIDATORS.int64 };
  interfaceType: "bigint";
  defaultValue: bigint;
  /** @see {@link Int64FieldLimit} */
  min?: Int64FieldLimit;
  /** @see {@link Int64FieldLimit} */
  max?: Int64FieldLimit;
  validate?(props: FieldValidateProps<TCollectionSlug, bigint>): Promise<void> | void;
}

/**
 * Resolved configuration for a `number()` field, after all defaults are applied.
 *
 * @see {@link NumberFieldInput} for the user-facing input type
 * @see {@link number} for the config function that produces this type
 */
export type NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> = Float64NumberField<TCollectionSlug, TFieldMeta> | Int64NumberField<TCollectionSlug, TFieldMeta>;
```

#### packages/core/src/fields/number/utils.ts

New file — the type-predicate guard every int64-aware reader (`inputSchema.ts`, the react admin `Field.tsx`) uses instead of an inline `field.schema?.validator === "int64"` check, which does not narrow a nested-property discriminated union (see Writer note).

```ts
import { FIELD_SCHEMA_VALIDATORS } from "../constants";
import type { VexResourceSlug } from "../../types/generated";
import type { Int64NumberField, NumberField } from "./types";

/**
 * Narrows a resolved `number()` field to {@link Int64NumberField} — true when
 * `schema.validator` is `"int64"`.
 *
 * @param field - The resolved number field definition.
 * @returns Whether `field` stores `v.int64()` (a native `bigint`).
 */
export function isInt64NumberField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
>(
  field: NumberField<TCollectionSlug, TFieldMeta>,
): field is Int64NumberField<TCollectionSlug, TFieldMeta> {
  return field.schema?.validator === FIELD_SCHEMA_VALIDATORS.int64;
}
```

#### packages/core/src/fields/number/utils.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";
import { number } from "./config";
import { isInt64NumberField } from "./utils";

describe("isInt64NumberField", () => {
  it("returns true for a field configured with schema.validator: \"int64\"", () => {
    expect(isInt64NumberField(number({ schema: { validator: "int64" } }))).toBe(true);
  });

  it("returns false for the default float64 field", () => {
    expect(isInt64NumberField(number())).toBe(false);
  });
});
```

#### packages/core/src/fields/number/index.ts

1 edit — add the new module to the barrel.

```ts
// Re-export the factory function
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
export * from "./utils";
```

#### packages/core/src/fields/number/config.ts

2 edits.

**1 — imports.** Replace the top of the file.

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "../constants";
import { resolveFieldLimit, resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types/generated";
import type { Int64NumberFieldInput, NumberFieldInput, NumberField } from "./types";

/**
 * Narrows `number()`'s input to {@link Int64NumberFieldInput} — true when
 * `schema.validator` is `"int64"`. Mirrors {@link isInt64NumberField}
 * (`./utils.ts`) one level earlier, before defaults are applied.
 */
function isInt64NumberFieldInput<
  TCollectionSlug extends VexResourceSlug,
  TFieldKey extends string,
  TFieldMeta extends {},
>(
  options: NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> | undefined,
): options is Int64NumberFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  return options?.schema?.validator === FIELD_SCHEMA_VALIDATORS.int64;
}
```

**2 — the `number()` body.** Replace the function body (previously lines 58–101) to branch on the new guard before falling through to the unchanged `float64` path.

```ts
): NumberField<TCollectionSlug, TFieldMeta> {
  if (isInt64NumberFieldInput(options)) {
    const min = resolveFieldLimit<bigint>({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value}.`,
    });
    const max = resolveFieldLimit<bigint>({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value}.`,
    });
    if (min && max && min[0] >= max[0]) {
      throw new Error(`Min value must be lower than the Max value`);
    }

    return {
      type: ADMIN_FIELDS.number.type,
      interfaceType: "bigint",

      // Core properties with defaults
      label: "",
      required: false,
      defaultValue: BigInt(0),
      ...options,
      schema: { validator: FIELD_SCHEMA_VALIDATORS.int64 },
      min,
      max,

      // Admin config with all defaults applied
      admin: {
        hidden: false,
        readOnly: false,
        position: "main",
        width: "100%",
        cellAlignment: "left",
        enableSorting: false,
        enableHiding: true,
        placeholder: "",
        ...options.admin,
        components: resolveFieldComponents({ components: options.admin?.components }),
      },
      meta: {
        ...options.meta,
      } as TFieldMeta,
    };
  }

  const min = resolveFieldLimit({
    limit: options?.min,
    defaultError: (value) => `Must be at least ${value}.`,
  });
  const max = resolveFieldLimit({
    limit: options?.max,
    defaultError: (value) => `Must be no more than ${value}.`,
  });
  if (min && max && min[0] >= max[0]) {
    throw new Error(`Min value must be lower than the Max value`);
  }

  return {
    type: ADMIN_FIELDS.number.type,
    interfaceType: ADMIN_FIELDS.number.interfaceType,

    // Core properties with defaults
    label: "",
    required: false,
    defaultValue: ADMIN_FIELDS.number.defaultValue,
    ...options,
    min,
    max,

    // Admin config with all defaults applied
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      // Optional admin properties (no defaults)
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

`isInt64NumberFieldInput(options)` is a type predicate — after its early `return`, the remainder of the function reads `options` already narrowed to `Float64NumberFieldInput<...> | undefined` by control flow, exactly as it was before this step (no cast needed).

#### packages/core/src/fields/number/config.test.ts

Existing file's own tests (min/max/default-value resolution) are unaffected. Add int64 coverage as a new describe block at the end of the file.

```ts
describe("number: int64", () => {
  it("defaults to BigInt(0) for a non-required int64 field", () => {
    const field = number({ schema: { validator: "int64" } });
    expect(field.defaultValue).toBe(0n);
    expect(field.interfaceType).toBe("bigint");
    expect(field.schema).toEqual({ validator: "int64" });
  });

  it("keeps an explicit bigint defaultValue", () => {
    const field = number({ schema: { validator: "int64" }, defaultValue: 42n });
    expect(field.defaultValue).toBe(42n);
  });

  it("resolves bare bigint min/max into [value, error] tuples", () => {
    const field = number({ schema: { validator: "int64" }, min: 1n, max: 100n });
    expect(field.min).toEqual([1n, "Must be at least 1."]);
    expect(field.max).toEqual([100n, "Must be no more than 100."]);
  });

  it("throws when min >= max, same as the float64 path", () => {
    expect(() => number({ schema: { validator: "int64" }, min: 10n, max: 5n })).toThrow(
      "Min value must be lower than the Max value",
    );
  });

  it("leaves the default float64 field untouched", () => {
    const field = number();
    expect(field.schema).toBeUndefined();
    expect(field.interfaceType).toBe("number");
    expect(field.defaultValue).toBe(0);
  });
});
```

If `packages/core/src/fields/number/config.test.ts` does not yet exist, create it with the `import { number } from "./config";` and `describe`/`it`/`expect` imports from `vitest` the rest of this field's tests use.

#### packages/core/src/fields/number/validator.ts

1 edit — branch the validator string on `schema.validator`.

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { NumberField } from "./types";

/**
 * Converts a number field definition to a Convex schema validator.
 *
 * Generates `v.number()`/`v.int64()` (or their `v.optional(...)` wrap) for the
 * Convex schema, based on the field's `required` property and
 * `schema.validator`.
 *
 * **Important notes:**
 * - min/max are runtime validation constraints, NOT schema constraints
 * - They don't affect the generated Convex value type
 * - Validation happens in the admin panel (client Zod) and in every mutation
 *   built through `create`/`update` (server Zod, run via the shared write pipeline)
 * - The index property is handled separately by index collection logic
 *
 * This function is used by the CLI during schema generation to build
 * the Convex schema file.
 *
 * @param props - numberFieldToValidator() input props
 * @param props.field - The number field definition
 * @returns Convex value type string: `"v.number()"`/`"v.int64()"`, each optionally `v.optional(...)`-wrapped
 *
 * @example
 * ```ts
 * const field1 = number({ required: true })
 * numberFieldToValidator({ field: field1 })  // "v.number()"
 *
 * const field2 = number({ required: false })
 * numberFieldToValidator({ field: field2 })  // "v.optional(v.number())"
 *
 * const field3 = number({ schema: { validator: "int64" }, required: true })
 * numberFieldToValidator({ field: field3 })  // "v.int64()"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function numberFieldToValidator(props: { field: NumberField }): string {
  const validator =
    props.field.schema?.validator === FIELD_SCHEMA_VALIDATORS.int64 ? "v.int64()" : ADMIN_FIELDS.number.validator;
  return applyBaseValidators({
    field: props.field,
    validator,
  });
}
```

`numberFieldToValidator` only ever reads `props.field.schema?.validator` to pick a plain string — no `min`/`max`/`defaultValue` access — so this inline check (never narrowed, never needed to be) is correct as-is.

The rest of the file (`numberValidator`) is unchanged.

#### packages/core/src/fields/number/validator.test.ts

1 edit — append int64 cases.

```ts
  it("generates v.int64() for a required int64 field", () => {
    const field = number({ schema: { validator: "int64" }, required: true });
    expect(numberFieldToValidator({ field })).toBe("v.int64()");
  });

  it("generates v.optional(v.int64()) for an optional int64 field", () => {
    const field = number({ schema: { validator: "int64" } });
    expect(numberFieldToValidator({ field })).toBe("v.optional(v.int64())");
  });
});
```

#### packages/core/src/fields/number/inputSchema.ts

1 edit — branch on `isInt64NumberField` before the existing `float64` body.

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { NumberField } from "./types";
import { isInt64NumberField } from "./utils";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a number field value in the admin form.
 *
 * Applies `min`/`max` constraints by composing them onto the same schema
 * chain built for `required`, rather than reassigning over it — a required
 * field with `min`/`max` configured keeps every check (CORE-1). Required
 * fields attach `{ error: "This field is required." }` to the base
 * `z.number()`/`z.bigint()` call and never receive `.default()`, matching
 * `applyBaseInputSchemaMeta`'s `.optional()` gate — a number has no "empty"
 * state distinct from "missing", so no `.min(1)` is added (unlike `text`).
 * Only non-required fields get a `.default()`, clamped into the configured
 * `min`/`max` range. An `int64` field (`isInt64NumberField`) runs the same
 * shape through `z.bigint()` instead, with `bigint` limits and default.
 *
 * @param props - Input props.
 * @param props.field - The resolved number field definition
 * @returns A Zod number or bigint schema with range constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = number({ required: true, min: 0, max: [100, "Too large."] })
 * numberFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(0).max(100, "Too large.")
 *
 * const int64Field = number({ schema: { validator: "int64" }, min: 0n })
 * numberFieldToInputSchema({ field: int64Field })
 * // → z.bigint().min(0n).default(0n)
 * ```
 */
export function numberFieldToInputSchema(props: { field: NumberField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  if (isInt64NumberField(field)) {
    let int64InputSchema = field.required ? z.bigint({ error: requiredError }) : z.bigint();

    if (field.min) {
      int64InputSchema = int64InputSchema.min(field.min[0], field.min[1]);
    }
    if (field.max) {
      int64InputSchema = int64InputSchema.max(field.max[0], field.max[1]);
    }

    if (field.required) {
      return applyBaseInputSchemaMeta({ field, inputSchema: int64InputSchema });
    }

    let int64DefaultValue = field.defaultValue;
    if (field.min && int64DefaultValue < field.min[0]) {
      int64DefaultValue = field.min[0];
    }
    if (field.max && int64DefaultValue > field.max[0]) {
      int64DefaultValue = field.max[0];
    }

    return applyBaseInputSchemaMeta({
      field,
      inputSchema: int64InputSchema.default(int64DefaultValue),
    });
  }

  let inputSchema = field.required ? z.number({ error: requiredError }) : z.number();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  let defaultValue = field.defaultValue;
  if (field.min && defaultValue < field.min[0]) {
    defaultValue = field.min[0];
  }
  if (field.max && defaultValue > field.max[0]) {
    defaultValue = field.max[0];
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(defaultValue),
  });
}
```

#### packages/core/src/fields/number/inputSchema.test.ts

1 edit — append an int64 describe block at the end of the file.

```ts
describe("numberFieldToInputSchema: int64", () => {
  it("accepts bigint and rejects a plain number", () => {
    const field = number({ schema: { validator: "int64" }, required: true });
    const schema = numberFieldToInputSchema({ field });

    expect(schema.safeParse(42n).success).toBe(true);
    expect(schema.safeParse(42).success).toBe(false);
  });

  it("defaults an optional int64 field to its bigint defaultValue", () => {
    const field = number({ schema: { validator: "int64" } });
    const schema = numberFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(0n);
    }
  });

  it("applies bigint min/max constraints", () => {
    const field = number({ schema: { validator: "int64" }, required: true, min: 1n, max: 100n });
    const schema = numberFieldToInputSchema({ field });

    expect(schema.safeParse(0n).success).toBe(false);
    expect(schema.safeParse(101n).success).toBe(false);
    expect(schema.safeParse(50n).success).toBe(true);
  });

  it("clamps an out-of-range bigint default into min", () => {
    const field = number({ schema: { validator: "int64" }, min: 10n, defaultValue: 1n });
    const schema = numberFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(10n);
    }
  });
});
```

#### packages/core/src/collections/listView/listViewUrlState.ts

4 edits.

**1 — imports.** Beside the existing `ADMIN_FIELDS`/`getDataFields` import.

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS, getDataFields } from "../../fields";
```

**2 — `FilterValueKind`.** Add the new kind.

```ts
/** How a field's filter value is encoded in the `<value>` URL segment. */
type FilterValueKind = "number" | "bigint" | "boolean" | "date" | "string";
```

**3 — `filterValueKindForField`.** Resolve an int64 `number` field to `"bigint"` before the plain `"number"` check.

```ts
function filterValueKindForField(props: {
  collection: CollectionConfig;
  field: string;
}): FilterValueKind | undefined {
  if (props.field === "vex_status") return "string";
  const fieldDef = getDataFields({ fields: props.collection.fields })[props.field];
  if (fieldDef === undefined) return undefined;
  if (fieldDef.type === ADMIN_FIELDS.number.type) {
    return fieldDef.schema?.validator === FIELD_SCHEMA_VALIDATORS.int64 ? "bigint" : "number";
  }
  if (fieldDef.type === ADMIN_FIELDS.checkbox.type) return "boolean";
  if (fieldDef.type === ADMIN_FIELDS.date.type || fieldDef.type === ADMIN_FIELDS.commitTs.type) return "date";
  return "string";
}
```

**4 — `encodeFilterValue`/`decodeFilterValue`.** Add the `"bigint"` case to each (decimal string, `BigInt` round trip; an unparseable segment decodes to `undefined`, same contract as every other kind).

```ts
function encodeFilterValue(props: { kind: FilterValueKind; value: unknown }): string {
  switch (props.kind) {
    case "number":
    case "bigint":
      return String(props.value);
    case "boolean":
      return props.value ? "true" : "false";
    case "date":
      return new Date(props.value as number).toISOString();
    case "string":
      return encodeURIComponent(String(props.value));
  }
}
```

```ts
function decodeFilterValue(props: { kind: FilterValueKind; raw: string }): unknown {
  switch (props.kind) {
    case "number": {
      const parsed = Number(props.raw);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    case "bigint":
      return /^-?\d+$/.test(props.raw) ? BigInt(props.raw) : undefined;
    case "boolean":
      if (props.raw === "true") return true;
      if (props.raw === "false") return false;
      return undefined;
    case "date": {
      const parsed = Date.parse(props.raw);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    case "string":
      try {
        return decodeURIComponent(props.raw);
      } catch {
        return undefined;
      }
  }
}
```

#### packages/core/src/collections/listView/listViewUrlState.test.ts

2 edits.

**1 — fixture collection.** Add an int64 field beside `rating`.

```ts
const collection = defineCollection({
  slug: "url_params_test",
  fields: {
    title: text({ required: false, searchIndex: { name: "search_title", filterFields: [] } }),
    rating: number({ required: false }),
    viewCount: number({ required: false, schema: { validator: "int64" } }),
    featured: checkbox({ required: false }),
    publishedAt: date({ required: false }),
    source: select({ required: false, options: [{ label: "G2", value: "g2" }, { label: "Site", value: "site" }] }),
    company: relationship({ collection: { slug: "companies" }, required: false }),
  },
  admin: {
    view: { searchFields: ["title"], pageSizeOptions: [10, 25, 50], pageSize: 10 },
  },
});
```

**2 — new tests.** Append after the existing filter-parsing `it` blocks in the `describe("parseListViewUrlState", ...)` section (directly after `"drops an all-invalid group, keeping the surviving group"`).

```ts
  it("parses an int64 filter value as a bigint", () => {
    expect(parse("?filter=(viewCount.gte.9007199254740993)").filter).toEqual({
      field: "viewCount",
      op: "gte",
      value: 9007199254740993n,
    });
  });

  it("drops an int64 filter row with a non-integer value", () => {
    expect(parse("?filter=(viewCount.gte.4.5)").filter).toBeNull();
  });
```

And beside the existing `"serializes a single-row filter"` test in `describe("serializeListViewUrlState", ...)`:

```ts
  it("serializes a bigint filter value as plain decimal digits", () => {
    const out = new URLSearchParams(
      serialize({ filter: { field: "viewCount", op: "gte", value: 9007199254740993n } }),
    );
    expect(out.get("filter")).toBe("(viewCount.gte.9007199254740993)");
  });
```

#### packages/core/src/db/queryArgs.test.ts

2 edits — regression tests only (see Writer note; no production code here changes for int64).

**1 — imports.** Add `number` beside the existing field imports.

```ts
import { checkbox, commitTs, number, relationship, row, select, tabs, text } from "../fields";
```

**2 — new tests.** Append to `describe("validateWhereNode", ...)`:

```ts
  it("accepts a bigint leaf value (int64 number field)", () => {
    const node = { field: "viewCount", op: "gte", value: 9_007_199_254_740_993n };
    expect(validateWhereNode({ node, fields: ["viewCount"] })).toEqual(node);
  });
```

And to `describe("convertCommitTsWhereToNs", ...)` (uses the suite's existing `fields` map, extended with an int64 `number` field):

```ts
  test("leaves an int64 number leaf's bigint value untouched (not a commitTs field)", () => {
    const fieldsWithInt64 = { ...fields, viewCount: number({ schema: { validator: "int64" } }) };
    const where = { field: "viewCount", op: "gte", value: 9_007_199_254_740_993n } as const;
    expect(convertCommitTsWhereToNs({ where, fields: fieldsWithInt64 })).toEqual(where);
  });
```

#### packages/telemetry/src/types.ts

1 edit — add the new attribute, importing `FieldSchemaValidator`.

```ts
import type {
  AdminFieldType,
  Alignment,
  ColorFormat,
  CommitTsFieldAdminFormat,
  CommitTsFieldOn,
  FieldSchemaValidator,
  SelectDisplay,
  StorageAdapterProtocol,
} from "@vexcms/core";
```

Add to `AnonymizedField` (beside `hasMany?`/`optionCount?`, in declaration order next to the other number-ish attributes):

```ts
  min?: number;
  max?: number;
  step?: number;
  /** The field's `schema.validator` override, when configured — `number`'s `"int64"` today; `select`/`relationship`/`upload` add their own values in later steps. */
  schemaValidator?: FieldSchemaValidator;
  rows?: number;
```

#### packages/telemetry/src/anonymizeConfig.ts

2 edits.

**1 — import.** Add `FIELD_SCHEMA_VALIDATORS` beside the existing core imports (used as a runtime value — `anonymizeConfig.ts` is the one telemetry module allowed real `@vexcms/core` value imports, AP-025).

```ts
import {
  ADMIN_CUSTOM_SUBJECTS,
  ADMIN_FIELDS,
  FIELD_SCHEMA_VALIDATORS,
  type AdminDataField,
  type AdminField,
  type AdminUIField,
  type BlockConfig,
  type CollectionConfig,
  type GlobalConfig,
  type VexAccessConfig,
  type VexConfig,
} from "@vexcms/core";
```

**2 — the `number` case.** Replace it to record `schemaValidator` only when set, and to report a bigint `min`/`max` through the existing `number`-typed telemetry slot via `Number(...)` (an approximate analytics figure, never the stored value).

```ts
    case ADMIN_FIELDS.number.type: {
      const hasMask = field.admin.mask !== undefined && field.admin.mask !== false;
      if (hasMask) context.flags.inputMasks = true;
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasMask,
        min: field.min === undefined ? undefined : Number(field.min[0]),
        max: field.max === undefined ? undefined : Number(field.max[0]),
        step: field.step,
        ...(field.schema?.validator === FIELD_SCHEMA_VALIDATORS.int64
          ? { schemaValidator: field.schema.validator }
          : {}),
      });
      return;
    }
```

#### packages/telemetry/src/anonymizeConfig.test.ts

1 edit — new describe block.

```ts
describe("number field schemaValidator", () => {
  it("records schemaValidator only on the int64 field", () => {
    const collection = defineCollection({
      slug: "items",
      fields: {
        count: number(),
        views: number({ schema: { validator: "int64" }, min: 5n }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });
    const countField = output.fields.find((field) => field.path === "count")!;
    const viewsField = output.fields.find((field) => field.path === "views")!;

    expect(countField.schemaValidator).toBeUndefined();
    expect(viewsField.schemaValidator).toBe("int64");
    expect(viewsField.min).toBe(5);
  });
});
```

#### packages/react/src/forms/NumberField.tsx

Full rewrite — `NumberFieldProps` becomes a discriminated union on `bigint` so `min`/`max`/`renderControl` type correctly per mode; the `bigint: true` control is an uncontrolled, digits-only text entry (mirrors the masked-control pattern already used by `fields/number/Field.tsx`'s `renderMaskedControl` — an uncontrolled DOM input lets a bare `-` be typed before `BigInt(...)` can parse it, which a `value`-controlled input would otherwise snap back on every keystroke).

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../ui/input";
import type { BaseFormFieldProps } from "./types";

const BIGINT_INPUT_PATTERN = /^-?\d+$/;

/** Shared `NumberField` props, regardless of `bigint` mode. */
interface NumberFieldPropsBase {
  placeholder?: string;
  step?: number;
}

/** `NumberField` bound to a plain `number` (the default). */
export interface Float64NumberFieldProps extends NumberFieldPropsBase, BaseFormFieldProps<number> {
  bigint?: false;
  min?: number;
  max?: number;
}

/** `NumberField` bound to a `bigint` (int64 storage) — an integer-only text entry. */
export interface Int64NumberFieldProps extends NumberFieldPropsBase, BaseFormFieldProps<bigint> {
  bigint: true;
  min?: bigint;
  max?: bigint;
}

/** Props for {@link NumberField}. */
export type NumberFieldProps = Float64NumberFieldProps | Int64NumberFieldProps;

/**
 * A number field bound to the nearest `<form.AppField name="...">`.
 * `step`/`min`/`max` are forwarded as native HTML attributes only — UI
 * affordances, never client-side clamping. `bigint: true` renders an
 * integer-only text entry bound to a `bigint` value (int64 storage) instead
 * of the native `number` input, whose `value`/`onChange` lose precision
 * above `Number.MAX_SAFE_INTEGER`.
 *
 * @param props - See {@link NumberFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, description and error.
 */
export function NumberField(props: NumberFieldProps): ReactNode {
  const field = useFieldContext<number | bigint>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });

  let control: ReactNode;
  if (props.bigint) {
    const value = field.state.value as bigint;
    const onChange = field.handleChange as (value: bigint) => void;
    control = props.renderControl ? (
      props.renderControl({
        id: field.name,
        value,
        onChange,
        onBlur: field.handleBlur,
        readOnly: Boolean(props.readOnly),
        invalid,
        describedBy,
      })
    ) : (
      <Input
        id={field.name}
        type="text"
        inputMode="numeric"
        disabled={props.readOnly}
        defaultValue={value !== undefined ? String(value) : ""}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          if (raw === "") {
            onChange(undefined as unknown as bigint);
            return;
          }
          if (!BIGINT_INPUT_PATTERN.test(raw)) return;
          onChange(BigInt(raw));
        }}
        onBlur={field.handleBlur}
        placeholder={props.placeholder}
        aria-required={props.required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
    );
  } else {
    const value = field.state.value as number;
    const onChange = field.handleChange as (value: number) => void;
    control = props.renderControl ? (
      props.renderControl({
        id: field.name,
        value,
        onChange,
        onBlur: field.handleBlur,
        readOnly: Boolean(props.readOnly),
        invalid,
        describedBy,
      })
    ) : (
      <Input
        id={field.name}
        type="number"
        disabled={props.readOnly}
        step={props.step}
        min={props.min}
        max={props.max}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value))
        }
        onBlur={field.handleBlur}
        placeholder={props.placeholder}
        aria-required={props.required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
    );
  }

  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={props.after}
      className={props.className}
      readOnly={props.readOnly}
    >
      {control}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/NumberField.test.tsx

Add a colocated describe block for the bigint mode (create the file with this one block if it does not already exist, importing the same `useForm`/`AppForm` harness every other `forms/*.test.tsx` uses).

```tsx
describe("NumberField: bigint mode", () => {
  function BigintHarness(props: { initial?: bigint }) {
    const form = useForm({ defaultValues: { amount: props.initial } });
    return (
      <AppForm form={form}>
        <form.AppField name="amount">
          {() => <NumberField label="Amount" bigint />}
        </form.AppField>
      </AppForm>
    );
  }

  it("renders the bigint value as plain digits", () => {
    render(<BigintHarness initial={9007199254740993n} />);
    expect(screen.getByRole("textbox")).toHaveValue("9007199254740993");
  });

  it("commits a typed integer as a bigint", async () => {
    const user = userEvent.setup();
    render(<BigintHarness />);
    await user.type(screen.getByRole("textbox"), "123");
    expect(screen.getByRole("textbox")).toHaveValue("123");
  });

  it("ignores a non-digit keystroke", async () => {
    const user = userEvent.setup();
    render(<BigintHarness initial={5n} />);
    await user.type(screen.getByRole("textbox"), "x");
    expect(screen.getByRole("textbox")).toHaveValue("5");
  });
});
```

#### packages/react/src/fields/number/Field.tsx

Full rewrite — split into two inner components (`Int64NumberFieldAdmin`/`Float64NumberFieldAdmin`), each calling its own fixed set of hooks, with `NumberFieldAdmin` only choosing which one to mount. A single component branching on `isInt64NumberField` and conditionally calling `useFieldMask`/`useFieldControlOverride` only in one branch would call a different number of hooks depending on the branch — `react-hooks/rules-of-hooks` correctly flags that regardless of the discriminant being fixed for a given field instance.

```tsx
"use client";

import { useContext } from "react";
import {
  isInt64NumberField,
  resolveFieldMask,
  type ComponentOverrideInput,
  type Float64NumberField,
  type Int64NumberField,
  type NumberField as NumberFieldDef,
} from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { NumberField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { Input } from "../../ui/input";
import { useFieldMask } from "../useFieldMask";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { VexConfigContext } from "../../config/VexConfigContext";
import { AdminFieldBinding } from "../AdminFieldBinding";

function Int64NumberFieldAdmin(props: FieldComponentProps<{}, Int64NumberField> & { field?: AnyFieldApi }) {
  function renderInt64Control(controlProps: FieldControlProps<bigint>) {
    return (
      <Input
        id={controlProps.id}
        disabled={controlProps.readOnly}
        type="text"
        inputMode="numeric"
        defaultValue={controlProps.value !== undefined ? String(controlProps.value) : ""}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          if (raw === "") {
            controlProps.onChange(undefined as unknown as bigint);
            return;
          }
          if (!/^-?\d+$/.test(raw)) return;
          controlProps.onChange(BigInt(raw));
        }}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<bigint>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<bigint>>[]
      | undefined,
    defaultControl: renderInt64Control,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <NumberField
        bigint
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
        index={props.index}
        placeholder={props.fieldDef.admin.placeholder}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}

function Float64NumberFieldAdmin(props: FieldComponentProps<{}, Float64NumberField> & { field?: AnyFieldApi }) {
  const config = useContext(VexConfigContext);
  const mask = resolveFieldMask({
    fieldType: props.fieldDef.type,
    fieldMask: props.fieldDef.admin.mask,
    inputMasks: config?.fields.inputMasks ?? {},
  });
  const maskRef = useFieldMask({ mask });
  function renderMaskedControl(controlProps: FieldControlProps<number>) {
    return (
      <Input
        id={controlProps.id}
        ref={maskRef}
        disabled={controlProps.readOnly}
        type="text"
        defaultValue={controlProps.value !== undefined ? String(controlProps.value) : ""}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          controlProps.onChange(raw === "" ? (undefined as unknown as number) : Number(raw));
        }}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  function renderBareControl(controlProps: FieldControlProps<number>) {
    return (
      <Input
        id={controlProps.id}
        disabled={controlProps.readOnly}
        type="number"
        step={props.fieldDef.step}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        value={controlProps.value ?? ""}
        onChange={(e) =>
          controlProps.onChange(
            e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value),
          )
        }
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<number>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<number>>[]
      | undefined,
    defaultControl: mask ? renderMaskedControl : renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <NumberField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
        index={props.index}
        placeholder={props.fieldDef.admin.placeholder}
        step={props.fieldDef.step}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        renderControl={overrideControl ?? (mask ? renderMaskedControl : undefined)}
      />
    </AdminFieldBinding>
  );
}

/**
 * Number admin field — maps `fieldDef` to `@vexcms/react/form`'s `NumberField` props.
 * Dispatches to {@link Int64NumberFieldAdmin} or {@link Float64NumberFieldAdmin} by
 * `schema.validator` — each mounts its own fixed hook set, so switching between them
 * (stable for a given field instance, driven by the collection config, never by
 * per-render state) never calls a different NUMBER of hooks the way branching
 * inside one component's body would.
 *
 * @param props - {@link FieldComponentProps} narrowed to `NumberField`.
 * @returns `NumberField`, configured for this field instance.
 */
export function NumberFieldAdmin(props: FieldComponentProps<{}, NumberFieldDef> & { field?: AnyFieldApi }) {
  if (isInt64NumberField(props.fieldDef)) {
    return <Int64NumberFieldAdmin {...props} fieldDef={props.fieldDef} />;
  }
  return <Float64NumberFieldAdmin {...props} fieldDef={props.fieldDef} />;
}
```


#### packages/react/src/fields/number/Field.test.tsx

Append a new describe block at the end of the file for the int64 admin path (uses the same `AppForm`/`useForm` harness the file's existing `runFieldInputContractSuite` setup imports).

```tsx
describe("number: int64 admin field", () => {
  function Int64Harness(props: { initial?: bigint }) {
    const form = useForm({ defaultValues: { amount: props.initial } });
    const fieldDef = number({ schema: { validator: "int64" }, label: "Amount" });
    const collection = { ...testCollection, fields: { amount: fieldDef } };
    return (
      <VexConfigContext.Provider value={null}>
        <AppForm form={form}>
          <form.AppField name="amount">
            {(field) => (
              <NumberFieldAdmin
                name="amount"
                fieldDef={fieldDef}
                readOnly={false}
                collection={collection}
                field={field}
              />
            )}
          </form.AppField>
        </AppForm>
      </VexConfigContext.Provider>
    );
  }

  it("renders the bigint value as plain digits, with no mask applied", () => {
    render(<Int64Harness initial={9007199254740993n} />);
    expect(screen.getByRole("textbox")).toHaveValue("9007199254740993");
  });

  it("commits a typed integer as a bigint", async () => {
    const user = userEvent.setup();
    render(<Int64Harness />);
    await user.type(screen.getByRole("textbox"), "7");
    expect(screen.getByRole("textbox")).toHaveValue("7");
  });
});
```

#### packages/react/src/fields/number/Cell.tsx

1 edit — doc comment only, no logic change (`{props.value}` already renders a `bigint` correctly; React 19's `ReactNode` includes `bigint`).

```tsx
/**
 * Number field cell component for the data-table list view.
 *
 * Renders the numeric value of a number field — a plain `number`, or a
 * `bigint` for an int64 field (`schema.validator: "int64"`).
 *
 * @param props - Component props
 * @param props.value - Raw value from the document — `number`, or `bigint` for an int64 field
 * @param props.fieldDef - Resolved `NumberField` definition
 * @returns The Cell Component for this field type
 *
 * @example
 * ```tsx
 * <NumberFieldCell value={doc.price} fieldDef={priceField} row={row} />
 * ```
 */
```

#### packages/react/src/fields/number/Cell.test.tsx

1 edit — append a describe block exercising a bigint value.

```tsx
describe("number: int64 rendering", () => {
  it("renders a bigint value as plain digits", () => {
    const fieldDef = number({ schema: { validator: "int64" }, label: "Views" });
    const row = makeCellRow<TDocument>({ fieldKey: "field", value: 9007199254740993n });
    render(
      withCellConfig(
        <NumberFieldCell
          value={9007199254740993n}
          row={row}
          fieldDef={fieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={testCollection}
        />,
      ),
    );
    expect(screen.getByText("9007199254740993")).toBeInTheDocument();
  });
});
```

Add `number` to this file's `@vexcms/core` import.

#### packages/react/src/fields/number/FilterInput.tsx

1 edit — branch on `isInt64NumberField` for a digits-only text control.

```tsx
"use client";

import { isInt64NumberField, type FilterInputProps, type NumberField } from "@vexcms/core";
import { Input } from "../../ui";

/**
 * Number field filter row value control — a number `Input`, registered as
 * `reactAdapter.fields.number.filterInput`. For an `int64` field
 * (`isInt64NumberField`), renders a digits-only text `Input` bound to a
 * `bigint` instead, matching `forms/NumberField.tsx`'s `bigint` mode.
 *
 * @param props - Component props.
 * @returns The value `Input`.
 */
export function NumberFilterInput(props: FilterInputProps<NumberField>) {
  if (isInt64NumberField(props.field)) {
    return (
      <Input
        type="text"
        inputMode="numeric"
        className="w-full min-w-0"
        aria-label={props.field.label || "Filter value"}
        defaultValue={props.value !== undefined && props.value !== null ? String(props.value) : ""}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          if (raw === "") {
            props.onChange(undefined);
            return;
          }
          if (!/^-?\d+$/.test(raw)) return;
          props.onChange(BigInt(raw));
        }}
        disabled={props.disabled}
      />
    );
  }
  return (
    <Input
      type="number"
      className="w-full min-w-0"
      aria-label={props.field.label || "Filter value"}
      value={String(props.value ?? "")}
      onChange={(e) => props.onChange(Number(e.target.value))}
      disabled={props.disabled}
    />
  );
}
```

#### packages/react/src/fields/number/FilterInput.test.tsx

1 edit — append int64 cases.

```tsx
describe("NumberFilterInput: int64", () => {
  const int64FieldDef = number({ schema: { validator: "int64" }, label: "Views" });

  it("renders a digits-only text input with the current bigint value", () => {
    render(<NumberFilterInput field={int64FieldDef} value={9007199254740993n} op="gte" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox")).toHaveValue("9007199254740993");
  });

  it("calls onChange with a parsed BigInt", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberFilterInput field={int64FieldDef} value={undefined} op="gte" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "123");
    expect(onChange).toHaveBeenLastCalledWith(123n);
  });

  it("ignores a non-digit keystroke", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberFilterInput field={int64FieldDef} value={5n} op="gte" onChange={onChange} />);
    await user.type(screen.getByRole("textbox"), "x");
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/fields/number/columnDef.tsx

1 edit — widen the column's value type to `number | bigint`, and fix the empty-value fallback to the field's own stamped `defaultValue` (previously `ADMIN_FIELDS.number.defaultValue`, which is always `0` — wrong for an int64 column, where the real default is `0n`).

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CollectionConfig, type NumberField, type TDocument } from "@vexcms/core";
import { NumberFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a number field.
 *
 * Generates column config with proper typing, cell renderer, alignment,
 * and metadata. Uses the registered NumberFieldCell component for rendering.
 * Sorting falls through to TanStack's `"auto"` → `"basic"` comparator
 * (`a === b ? 0 : a > b ? 1 : -1`), which compares `bigint`s by value exactly
 * like `number`s — no custom `sortingFn` needed for an int64 column.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved number field definition
 * @param props.fieldKey - Field key from collection.fields
 * @param props.isTitleField - Whether this is the title field (useAsTitle)
 * @param props.collection - Parent collection config, forwarded to the cell component
 * @returns TanStack Table column definition
 *
 * @example
 * ```ts
 * const column = numberFieldToColumnDef({
 *   fieldDef: collection.fields.price,
 *   fieldKey: "price",
 *   isTitleField: false,
 * });
 * ```
 */
export function numberFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: NumberField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, number | bigint> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as number | bigint | undefined;
      return (
        <NumberFieldCell<TData>
          value={value ?? props.fieldDef.defaultValue}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Enable sorting for all number fields
    enableSorting: true,

    // Enable hiding for all fields (user can toggle visibility)
    enableHiding: true,

    // Use field's cellAlignment config
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

`ADMIN_FIELDS` is no longer referenced in this file — drop the import.

#### packages/react/src/fields/number/columnDef.test.ts

1 edit — add a dedicated test for the int64 defaultValue fallback (the shared `runColumnDefSuite` only exercises the float64 fixture).

```ts
import { number } from "@vexcms/core";
import { describe, expect, it } from "vitest";
import { runColumnDefSuite } from "../../testing/columnDefSuite";
import { testCollection } from "../../testing/harness/accessFixtures";
import { numberFieldFixture } from "./testFixture";
import { numberFieldToColumnDef } from "./columnDef";

runColumnDefSuite({ fixture: numberFieldFixture });

describe("numberFieldToColumnDef: int64", () => {
  it("falls back to the field's own bigint defaultValue, not ADMIN_FIELDS.number.defaultValue", () => {
    const fieldDef = number({ schema: { validator: "int64" } });
    const column = numberFieldToColumnDef({
      fieldDef,
      fieldKey: "views",
      collection: testCollection,
    });
    const cell = column.cell as (props: { row: { getValue: (key: string) => unknown } }) => unknown;
    const rendered = cell({ row: { getValue: () => undefined } }) as { props: { value: bigint } };
    expect(rendered.props.value).toBe(0n);
  });
});
```

#### apps/test/src/vexcms/collections/storageShapes.ts

1 edit — append `viewCount` (int64) after `nullableMeta`, the last field Step 2 adds (per the dogfood contract). Requires `number` imported from `@vexcms/core` (already imported by Step 2 for `nullableCount`).

```ts
    nullableMeta: group({
      label: "Nullable Meta",
      nullable: true,
      fields: {
        note: text({ label: "Note" }),
      },
    }),
    viewCount: number({
      label: "View Count",
      schema: { validator: "int64" },
      min: 0n,
    }),
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`; `pnpm --filter test vex:generate` and read `storage_shapes` in `convex/vex.schema.ts` (`viewCount: v.optional(v.int64())`) and `vex.types.ts` (`viewCount?: bigint`); `pnpm typecheck`.

### Step 4 — `select({ schema: { validator: "literal" | "string" } })` [agent]

> Writer note: two corrections to the task list.
> 1. The react bullet names a `Display.tsx` for select, mirroring relationship/upload's own bullet (Step 5). `select` has no `Display.tsx` today (`packages/react/src/fields/select/` holds only `Field.tsx`/`Cell.tsx`/`FilterInput.tsx`/`columnDef.tsx`/`testFixture.ts`/`index.ts` — confirmed by directory listing) and `spec-tasks.md`'s own Step 4 checklist does NOT list one (only `{Field,Cell,FilterInput}.tsx`). No `Display.tsx` is added here.
> 2. `FilterInput.tsx` and `ListViewFilterChips.tsx` need NO changes. `FilterInputProps.value` is `unknown`, one scalar per filter row regardless of the field's storage shape (`packages/core/src/fields/types.ts:277-288`) — confirmed live: `select/FilterInput.tsx` already binds `props.value` as a bare string today, for both `hasMany: true` and `hasMany: false` fields. `ListViewFilterChips.tsx`'s `select` branch (`field.options.find((option) => option.value === value)`) already compares one value. Both are untouched by this step.
> 3. Telemetry attribute name was fixed mid-session by the orchestrator to `schemaValidator` (flat, not nested `schema.validator`) on `AnonymizedField`, shared verbatim by Steps 3/4/5 — used below.

Why: enum columns (`v.union(v.literal(...))`, `v.string()`) are scalar. `select()` always stores an
array, even with `hasMany: false`. When `hasMany` is true, the override is typed `never`.

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`; generated schema and types; `pnpm typecheck`.

- [ ] core `fields/baseTypes.ts`: shared `SchemaOverrideInput<THasMany, TValidator>` helper (reused verbatim by Step 5)
- [ ] core `fields/select/types.ts`: `schema` input typed by `hasMany` (`never` when true); interface type `Option` (literal) or `string` (string) + `types.typecheck.ts`
- [ ] core `fields/select/{config,validator,inputSchema}.ts` + tests
- [ ] core `db/queryArgs.ts`: an `eq` on scalar select storage compares directly, with no array wrap + test
- [ ] core interface generation (`collections/interfaceGen.ts`, `fields/childInterfaceType.ts`): scalar `{FieldKey}Option` / `string` instead of `Option[]` + tests
- [ ] react `fields/select/{Field,Cell,columnDef}.tsx` + `forms/SelectField.tsx`: scalar value binding + tests
- [ ] telemetry: record `schemaValidator`
- [ ] apps/test `storageShapes`: literal and string single selects

#### packages/core/src/fields/baseTypes.ts

One edit: a new shared type alias, inserted beside the other field-wide type utilities (`ResolvedFieldIndexConfigInput`), ahead of `BaseFieldInput`.

**1 — import.** Add `FieldSchemaValidator` beside the existing imports (top of file).

```ts
import type { FieldSchemaValidator } from "./constants";
```

**2 — `SchemaOverrideInput`.** Insert after `ResolvedFieldIndexConfigInput`'s declaration, before the `BaseFieldInput` JSDoc block.

```ts
/**
 * Types a field's `schema.validator` input: `never` when the field is
 * `hasMany: true` (overrides apply only to single-value storage — see
 * `select()`/`relationship()`/`upload()`), otherwise an optional
 * `{ validator }` narrowed to `TValidator`. The RESOLVED field type never
 * uses this — it carries a plain, non-conditional `{ validator: TValidator }`
 * (traveling values stay generic-erased; only the authoring-time input is
 * gated).
 */
export type SchemaOverrideInput<
  THasMany extends boolean,
  TValidator extends FieldSchemaValidator,
> = THasMany extends true ? never : { validator?: TValidator };
```

#### packages/core/src/fields/select/types.ts

Three edits: the imports, `SelectFieldInput`'s generics/`schema`/`defaultValue`/`validate`, and `SelectField`'s mirrored `schema`/`defaultValue`/`validate`.

**1 — imports.** Replace the top two import lines.

```ts
import { ADMIN_FIELDS, type FieldSchemaValidator } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldValidateProps,
  SchemaOverrideInput,
} from "../baseTypes";
```

**2 — `SelectFieldInput`.** Add a 4th generic (`THasMany`), a `schema` property, and widen `defaultValue`/`validate`'s value type to admit a scalar. Anchor: the `SelectFieldInput` interface's generic list and body (currently ending `validate?(props: FieldValidateProps<TCollectionSlug, string[]>): Promise<void> | void;`).

```ts
export interface SelectFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  THasMany extends boolean = boolean,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Admin UI configuration for this field. */
  admin?: SelectFieldAdminInput<TCollectionSlug>;
  /**
   * Pre-filled value shown in the admin form when creating a new field.
   * Does not apply to database values. An array unless `schema.validator`
   * is set, in which case it is the single selected value (empty string
   * for "no selection").
   */
  defaultValue?: string | string[];
  options?: {
    label: string;
    value: string;
    badgeColor?: string;
  }[];
  hasMany?: THasMany;
  /**
   * Overrides the Convex storage shape for a single-value select
   * (`hasMany: false`). `"literal"` stores `v.union(v.literal(...))` — a
   * bare `v.literal(...)` when there is exactly one option — and types the
   * field's value as its option union. `"string"` stores `v.string()` and
   * types the value `string`; the admin form and this field's own
   * `inputSchema` still enforce `options`, even though the Convex column
   * itself accepts any string. `never` when `hasMany: true` — overrides
   * only apply to single-value storage.
   */
  schema?: SchemaOverrideInput<THasMany, Extract<FieldSchemaValidator, "literal" | "string">>;
  optionInterfaceName?: string;
  /** Server-only async validation. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}
```

**3 — `SelectField`.** Mirror the same three properties on the resolved type (no `THasMany` generic here — P-002: traveling values stay generic-erased).

```ts
export interface SelectField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  /** Resolved admin UI configuration with all defaults applied. */
  admin: SelectFieldAdminConfig<TCollectionSlug>;
  readonly type: typeof ADMIN_FIELDS.select.type;
  /** Pre-filled value shown in the admin form when creating a new field. */
  defaultValue: string | string[];
  options: {
    label: string;
    value: string;
    badgeColor?: string;
  }[];
  hasMany: boolean;
  /** Set only when the field's storage is overridden (see {@link SelectFieldInput.schema}). */
  schema?: { validator: Extract<FieldSchemaValidator, "literal" | "string"> };
  optionInterfaceName?: string;
  /** Server-only async validation. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}
```

#### packages/core/src/fields/select/types.typecheck.ts

New file — compile-time pin for the `hasMany: true` ⇒ `schema: never` gate, following the project's `*.typecheck.ts` convention (`packages/core/src/fields/color/utils.typecheck.ts`, `packages/core/src/db/isHiddenDocument.typecheck.ts`): no test runner, `pnpm typecheck` is the assertion.

```ts
import { select } from "./config";

/**
 * Compile-time pin: `select()`'s `schema` option is typed `never` when
 * `hasMany: true` — overrides only apply to single-value storage
 * (`SelectFieldInput.schema`, `SchemaOverrideInput`). `pnpm typecheck` IS
 * the assertion, no test runner involved.
 */
select({ hasMany: false, schema: { validator: "literal" } });
select({ hasMany: false, schema: { validator: "string" } });
select({ schema: { validator: "literal" } });
select({ hasMany: true });
select({});

// @ts-expect-error - `schema` is `never` when `hasMany: true`.
select({ hasMany: true, schema: { validator: "literal" } });
```

#### packages/core/src/fields/select/config.ts

One edit: the `select()` function's generics and body.

```ts
export function select<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  THasMany extends boolean = boolean,
>(
  options?: SelectFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, THasMany>,
): SelectField<TCollectionSlug, TFieldMeta> {
  const schema =
    options?.schema?.validator !== undefined
      ? { validator: options.schema.validator }
      : undefined;
  return {
    type: ADMIN_FIELDS.select.type,
    interfaceType: schema !== undefined ? "string" : ADMIN_FIELDS.select.interfaceType,
    label: "",
    required: false,
    defaultValue: schema !== undefined ? "" : ADMIN_FIELDS.select.defaultValue,
    options: [],
    hasMany: false,
    ...options,
    schema,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      searchable: false,
      display: SELECT_DISPLAYS.dropdown,
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

`schema` is recomputed and re-assigned AFTER `...options` on purpose: the input's `{ validator?: ... }` is looser (validator itself optional) than the resolved `{ validator: ... }`, so the spread's own `schema` key — if present — must be overwritten with the normalized value, never left as-is.

#### packages/core/src/fields/select/config.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { select } from "./config";

describe("select() — schema override", () => {
  it("defaults to array storage without a schema override", () => {
    const field = select({ options: [{ label: "Draft", value: "draft" }] });
    expect(field.defaultValue).toEqual([]);
    expect(field.interfaceType).toBe("string[]");
    expect(field.schema).toBeUndefined();
  });

  it("defaults defaultValue to '' and interfaceType to string for schema.validator: 'literal'", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "literal" },
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(field.defaultValue).toBe("");
    expect(field.interfaceType).toBe("string");
    expect(field.schema).toEqual({ validator: "literal" });
  });

  it("defaults defaultValue to '' and interfaceType to string for schema.validator: 'string'", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "string" },
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(field.defaultValue).toBe("");
    expect(field.interfaceType).toBe("string");
    expect(field.schema).toEqual({ validator: "string" });
  });

  it("honors an explicit defaultValue over the computed scalar default", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "literal" },
      defaultValue: "draft",
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(field.defaultValue).toBe("draft");
  });
});
```

#### packages/core/src/fields/select/validator.ts

Two edits: an import, and `selectFieldToValidator`'s body (branches on `field.schema`). `selectValidator`'s `TValue` also widens to match `types.ts`.

**1 — import.** Add beside the existing imports.

```ts
import { FIELD_SCHEMA_VALIDATORS } from "../constants";
```

**2 — `selectFieldToValidator`.** Full function body (branches throughout).

```ts
export function selectFieldToValidator(props: { field: SelectField }): string {
  const { field } = props;
  if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.string) {
    return applyBaseValidators({ field, validator: "v.string()" });
  }
  if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.literal) {
    const literals = field.options.map((o) => `v.literal("${o.value}")`);
    const validator = literals.length === 1 ? literals[0]! : `v.union(${literals.join(", ")})`;
    return applyBaseValidators({ field, validator });
  }
  const optionLiterals = field.options
    .map((o) => `v.literal("${o.value}")`)
    .join(", ");
  const validator = `v.array(v.union(${optionLiterals}))`;
  return applyBaseValidators({ field, validator });
}
```

**3 — `selectValidator`.** Widen `TValue` from `string[]` to `string | string[]` (anchor: the `selectValidator` function's `fn`/return/body generic arguments).

```ts
export function selectValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string | string[], SelectField>,
): FieldValidate<TCollectionSlug, string | string[]> {
  return fieldValidator<TCollectionSlug, string | string[], SelectField>(slug, fn);
}
```

#### packages/core/src/fields/select/validator.test.ts

One addition: a new `describe` block, appended after the existing `describe("selectFieldToValidator", ...)` block.

```ts
describe("selectFieldToValidator — schema.validator override", () => {
  it("stores v.string() for schema.validator: 'string'", () => {
    const field = select({ required: true, hasMany: false, schema: { validator: "string" }, options: OPTIONS });
    expect(selectFieldToValidator({ field })).toBe("v.string()");
  });

  it("stores a bare v.literal(...) for a single option with schema.validator: 'literal'", () => {
    const field = select({
      required: true,
      hasMany: false,
      schema: { validator: "literal" },
      options: [{ label: "Active", value: "active" }],
    });
    expect(selectFieldToValidator({ field })).toBe('v.literal("active")');
  });

  it("stores v.union(v.literal(...)) for multiple options with schema.validator: 'literal'", () => {
    const field = select({ required: true, hasMany: false, schema: { validator: "literal" }, options: OPTIONS });
    expect(selectFieldToValidator({ field })).toBe(
      'v.union(v.literal("draft"), v.literal("published"))',
    );
  });

  it("wraps the scalar validator in v.optional() when not required", () => {
    const field = select({ required: false, hasMany: false, schema: { validator: "string" }, options: OPTIONS });
    expect(selectFieldToValidator({ field })).toBe("v.optional(v.string())");
  });
});
```

#### packages/core/src/fields/select/inputSchema.ts

One edit: `selectFieldToInputSchema`'s full body (branches throughout). `field.defaultValue`'s declared type admits both `string` and `string[]` since `SelectField` doesn't thread the schema override through a discriminated union (P-002); each branch below casts to the shape its own `field.schema` check guarantees.

```ts
export function selectFieldToInputSchema(props: {
  field: SelectField;
}): ZodType {
  const { field } = props;

  const optionValues = field.options.map((o) => o.value);
  const itemSchema =
    optionValues.length > 0
      ? z.enum(optionValues as [string, ...string[]])
      : z.string();

  const requiredError = "This field is required.";

  if (field.schema !== undefined) {
    if (field.required) {
      const requiredItemSchema =
        optionValues.length > 0
          ? z.enum(optionValues as [string, ...string[]], { error: requiredError })
          : z.string({ error: requiredError });
      return applyBaseInputSchemaMeta({ field, inputSchema: requiredItemSchema });
    }
    const optionalItemSchema =
      optionValues.length > 0
        ? z.enum(["", ...optionValues] as [string, ...string[]])
        : z.string();
    return applyBaseInputSchemaMeta({
      field,
      inputSchema: optionalItemSchema.default(field.defaultValue as string),
    });
  }

  let inputSchema = field.required
    ? z.array(itemSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemSchema);

  if (!field.hasMany) {
    inputSchema = inputSchema.max(1, "Only one value may be selected.");
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(field.defaultValue as string[]),
  });
}
```

`""` is accepted as "no selection" on a non-required scalar field, the same role `[]` plays for array storage (`optionalItemSchema` includes `""` alongside the real option values).

#### packages/core/src/fields/select/inputSchema.test.ts

One addition: a new `describe` block, appended after the existing `describe("selectFieldToInputSchema", ...)` block.

```ts
describe("selectFieldToInputSchema — schema.validator override", () => {
  it("accepts a bare option value and rejects an array for schema.validator: 'literal'", () => {
    const field = select({ required: true, hasMany: false, schema: { validator: "literal" }, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    expect(schema.safeParse("draft").success).toBe(true);
    expect(schema.safeParse(["draft"]).success).toBe(false);
  });

  it("rejects a value outside the configured options for schema.validator: 'string'", () => {
    const field = select({ required: true, hasMany: false, schema: { validator: "string" }, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    expect(schema.safeParse("draft").success).toBe(true);
    expect(schema.safeParse("retired").success).toBe(false);
  });

  it("accepts an empty string as 'no selection' on a non-required scalar field", () => {
    const field = select({ required: false, hasMany: false, schema: { validator: "literal" }, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    expect(schema.safeParse("").success).toBe(true);
  });

  it("returns the default value when parsed as undefined (optional scalar)", () => {
    const field = select({
      required: false,
      hasMany: false,
      schema: { validator: "literal" },
      options: OPTIONS,
      defaultValue: "draft",
    });
    const schema = selectFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBe("draft");
  });

  it("rejects an empty string on a required scalar field", () => {
    const field = select({ required: true, hasMany: false, schema: { validator: "literal" }, options: OPTIONS });
    const schema = selectFieldToInputSchema({ field });

    expect(schema.safeParse("").success).toBe(false);
  });
});
```

#### packages/core/src/collections/interfaceGen.ts

Two edits: the import, and the select branch inside `collectionConfigToInterface`.

**1 — import.** Replace the `./constants` import line.

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "./constants";
```

**2 — select branch.** Replace the `if (field.type === ADMIN_FIELDS.select.type) { ... }` block inside the `.map(([fieldKey, field]) => { ... })` callback.

```ts
      if (field.type === ADMIN_FIELDS.select.type) {
        if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.string) {
          fieldType = "string";
        } else {
          const optionName =
            field.optionInterfaceName ??
            `${collection.interfaceName}${slugToPascalCase({ slug: fieldKey })}Option`;
          collectionSubTypes.push(
            `type ${optionName} = ${field.options.map((o) => `"${o.value}"`).join(" | ")}`,
          );
          fieldType =
            field.schema?.validator === FIELD_SCHEMA_VALIDATORS.literal ? optionName : `${optionName}[]`;
        }
      }
```

No `schema.validator: "string"` alias is pushed to `collectionSubTypes` — the field's own TypeScript type is the bare `string`, matching what `v.string()` actually stores (unlike `"literal"`, there is no fixed union to name).

#### packages/core/src/collections/interfaceGen.test.ts

One addition: a new `describe` block, appended after `describe("collectionConfigToInterface - select emits an array type", ...)`.

```ts
describe("collectionConfigToInterface - select with schema.validator emits a scalar type", () => {
  it("emits a bare option union for schema.validator: 'literal'", () => {
    const collection = defineCollection({
      slug: "articles",
      interfaceName: "Article",
      fields: {
        status: select({
          required: true,
          hasMany: false,
          schema: { validator: "literal" },
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
      },
    });
    const output = collectionConfigToInterface({ collection });
    expect(output).toContain(`type ArticleStatusOption = "draft" | "published"`);
    expect(output).toContain("status: ArticleStatusOption");
    expect(output).not.toContain("status: ArticleStatusOption[]");
  });

  it("emits a bare string for schema.validator: 'string'", () => {
    const collection = defineCollection({
      slug: "articles",
      interfaceName: "Article",
      fields: {
        status: select({
          required: true,
          hasMany: false,
          schema: { validator: "string" },
          options: [{ label: "Draft", value: "draft" }],
        }),
      },
    });
    const output = collectionConfigToInterface({ collection });
    expect(output).toContain("status: string");
    expect(output).not.toContain("ArticleStatusOption");
  });
});
```

#### packages/core/src/fields/childInterfaceType.ts

Two edits: the import, and the select branch.

**1 — import.** Replace the top import line.

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "./constants";
```

**2 — select branch.** Replace the `if (field.type === ADMIN_FIELDS.select.type) { ... }` block.

```ts
  if (field.type === ADMIN_FIELDS.select.type) {
    if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.string) return "string";
    const options = (field as { options?: { value: string }[] }).options ?? [];
    if (options.length === 0) return field.interfaceType;
    const union = `(${options.map((option) => `"${option.value}"`).join(" | ")})`;
    return field.schema?.validator === FIELD_SCHEMA_VALIDATORS.literal ? union : `${union}[]`;
  }
```

`config.ts` already stamps `interfaceType: "string"` whenever `schema` is set (Step 4's `select/config.ts` edit above), so the `options.length === 0` fallback is correct for BOTH "literal" and "string" without a separate branch.

#### packages/core/src/fields/childInterfaceType.test.ts

New file — `childInterfaceType.ts` had no colocated test before this step.

```ts
import { describe, it, expect } from "vitest";
import { select } from "./select/config";
import { text } from "./text/config";
import { childInterfaceType } from "./childInterfaceType";

describe("childInterfaceType — select", () => {
  it("emits an inline array union when no schema override is set", () => {
    const field = select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    });
    expect(childInterfaceType(field)).toBe('("draft" | "published")[]');
  });

  it("emits a bare inline union for schema.validator: 'literal'", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "literal" },
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    });
    expect(childInterfaceType(field)).toBe('("draft" | "published")');
  });

  it("emits a bare string for schema.validator: 'string'", () => {
    const field = select({
      hasMany: false,
      schema: { validator: "string" },
      options: [{ label: "Draft", value: "draft" }],
    });
    expect(childInterfaceType(field)).toBe("string");
  });

  it("falls back to the declared interfaceType with no options configured", () => {
    const field = select({ options: [] });
    expect(childInterfaceType(field)).toBe("string[]");
  });

  it("is unaffected for non-select fields", () => {
    const field = text();
    expect(childInterfaceType(field)).toBe("string");
  });
});
```

#### packages/core/src/db/queryArgs.ts

One edit: `isArrayStoredField`'s body (anchor: the function identifier).

```ts
function isArrayStoredField(
  field: AdminField,
): field is Extract<AdminField, { type: "select" | "relationship" | "upload" }> {
  if (field.type === ADMIN_FIELDS.select.type) return field.schema === undefined;
  return field.type === ADMIN_FIELDS.relationship.type
    || field.type === ADMIN_FIELDS.upload.type;
}
```

A scalar-stored select (`schema` set) is excluded from the array-stored set entirely — it never enters `normalizeArrayStoredWhere`'s `arrayFields` map, so its `eq`/`neq` leaves pass through unwrapped (the stored value already IS the scalar the leaf compares against). `normalizeArrayStoredWhere` itself is unchanged.

#### packages/core/src/db/queryArgs.test.ts

Two edits inside `describe("normalizeArrayStoredWhere", ...)`: one new field in the `fields` fixture, one new test.

**1 — fixture.** Add `scalarStatus` to the `fields` object (anchor: the `fields = { ... }` const, after `title: text(),`).

```ts
    scalarStatus: select({
      hasMany: false,
      schema: { validator: "literal" },
      options: [{ label: "Won", value: "won" }],
    }),
```

**2 — test.** Append after `test("leaves a non-array-stored field's eq value untouched (out of scope)", ...)`.

```ts
  test("leaves a scalar-stored select field's eq value untouched (no array wrap)", () => {
    const where = { field: "scalarStatus", op: "eq", value: "won" } as const;
    expect(normalizeArrayStoredWhere({ where: where as never, fields })).toEqual(where);
  });
```

#### packages/telemetry/src/types.ts

Two edits: the import, and `AnonymizedField`.

**1 — import.** Add `FieldSchemaValidator` to the existing type-only import (alphabetical).

```ts
import type {
  AdminFieldType,
  Alignment,
  ColorFormat,
  CommitTsFieldAdminFormat,
  CommitTsFieldOn,
  FieldSchemaValidator,
  SelectDisplay,
  StorageAdapterProtocol,
} from "@vexcms/core";
```

**2 — `AnonymizedField`.** Add `schemaValidator` beside `searchable` (shared verbatim by Steps 3/5 — add once only, whichever step lands first).

```ts
  searchable?: boolean;
  schemaValidator?: FieldSchemaValidator;
```

#### packages/telemetry/src/anonymizeConfig.ts

One edit: the `select` case.

```ts
    case ADMIN_FIELDS.select.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasMany: field.hasMany,
        optionCount: field.options.length,
        display: field.admin.display,
        searchable: field.admin.searchable,
        schemaValidator: field.schema?.validator,
      });
      return;
```

#### packages/telemetry/src/anonymizeConfig.test.ts

New `describe` block, appended after `describe("anonymizeConfig — depth budget", ...)` and before `describe("anonymizeConfig — leak test", ...)`.

```ts
describe("anonymizeConfig — select schema.validator", () => {
  it("records schemaValidator only when the override is set", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        plain: select({ hasMany: true, options: [{ label: "A", value: "a" }] }),
        scalar: select({
          hasMany: false,
          schema: { validator: "literal" },
          options: [{ label: "A", value: "a" }],
        }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const fields = anonymizeConfig({ config }).fields;
    expect(fields.find((f) => f.path === "c1.f1")?.schemaValidator).toBeUndefined();
    expect(fields.find((f) => f.path === "c1.f2")?.schemaValidator).toBe("literal");
  });
});
```

#### packages/react/src/fields/select/Field.tsx

One edit: pass `scalar` to `forms/SelectField`. Anchor: the `<SelectField ... />` JSX inside `SelectFieldAdmin`.

```tsx
      <SelectField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
        options={props.fieldDef.options}
        hasMany={props.fieldDef.hasMany}
        scalar={props.fieldDef.schema !== undefined}
        display={props.fieldDef.admin.display}
        searchable={props.fieldDef.admin.searchable}
        placeholder={props.fieldDef.admin.placeholder}
        renderControl={overrideControl}
      />
```

Everything else in this component (`renderBareControl`, `useFieldControlOverride<string[]>`, the admin.components.Input override contract) stays bound to `string[]` — `forms/SelectField.tsx` normalizes scalar↔array at its own boundary (below), so the override system never sees a scalar.

#### packages/react/src/forms/SelectField.tsx

Two edits: `SelectFieldProps` gains `scalar`, and the `SelectField` function body is replaced in full (every value read/write converts through one `arrayValue`/`commitValue` pair; `BaseFormFieldProps<string[]>` and `renderControl`'s exposed shape stay `string[]`, unaffected).

**1 — `SelectFieldProps`.** Add `scalar` beside `hasMany`.

```ts
export interface SelectFieldProps extends BaseFormFieldProps<string[]> {
  options: SelectFieldOption[];
  /** `false` (default) caps the selection at one value. */
  hasMany?: boolean;
  /**
   * `true` when the stored value is a single `string` instead of
   * `string[]` (a `schema.validator` override — `select`'s only caller
   * today). Converts to/from the one-element array the control itself
   * still renders. Default `false`.
   */
  scalar?: boolean;
  /** `"dropdown"` (default, a searchable popover) or `"radio"` (inline, no popover). */
  display?: "dropdown" | "radio";
  /** Applies only to `"dropdown"`. */
  searchable?: boolean;
  placeholder?: string;
}
```

**2 — `SelectField`.** Full function body.

```tsx
/**
 * A single- or multi-select field bound to the nearest `<form.AppField
 * name="...">`. Stores `string[]` by default; `hasMany` caps it at one
 * entry. `scalar` rebinds to a single stored `string` instead, converting
 * to/from the one-element array the control itself still renders.
 *
 * @param props - See {@link SelectFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control (popover or inline radio/checkbox list), description and error.
 */
export function SelectField(props: SelectFieldProps): ReactNode {
  const field = useFieldContext<string[] | string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const isOnModalSurface = useModalSurface();
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const idPrefix = useId();

  const arrayValue: string[] = props.scalar
    ? typeof field.state.value === "string" && field.state.value !== ""
      ? [field.state.value]
      : []
    : ((field.state.value as string[] | undefined) ?? []);

  function commitValue(next: string[]) {
    field.handleChange(props.scalar ? (next[0] ?? "") : next);
  }

  function handleToggle(value: string) {
    if (props.hasMany) {
      commitValue(
        arrayValue.includes(value) ? arrayValue.filter((v) => v !== value) : [...arrayValue, value],
      );
    } else {
      commitValue(arrayValue.includes(value) ? [] : [value]);
    }
  }

  if (props.renderControl) {
    const control = props.renderControl({
      id: field.name,
      value: arrayValue,
      onChange: commitValue,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    });
    return (
      <FormFieldLayout
        id={field.name}
        label={props.label}
        required={props.required}
        description={props.description}
        index={props.index}
        field={field}
        submissionAttempts={submissionAttempts}
        className={props.className}
        readOnly={props.readOnly}
      >
        {control}
      </FormFieldLayout>
    );
  }

  if (props.display === "radio") {
    const inlineLabel = (
      <span
        id={`${idPrefix}-label`}
        className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
        {props.label}
        {props.required && <span className="text-red-500">*</span>}
      </span>
    );
    const control = props.hasMany ? (
      <div
        role="group"
        aria-labelledby={`${idPrefix}-label`}
        aria-disabled={props.readOnly}
        className="flex flex-col gap-2"
      >
        {props.options.map((option, optionIndex) => (
          <label key={`${idPrefix}-option-${optionIndex}`} htmlFor={`${idPrefix}-option-${optionIndex}`} className="flex items-center gap-2 text-sm">
            <Checkbox
              id={`${idPrefix}-option-${optionIndex}`}
              checked={arrayValue.includes(option.value)}
              disabled={props.readOnly}
              onCheckedChange={() => handleToggle(option.value)}
              onBlur={field.handleBlur}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-label={option.label}
            />
            {option.label}
          </label>
        ))}
      </div>
    ) : (
      <RadioGroup
        aria-labelledby={`${idPrefix}-label`}
        disabled={props.readOnly}
        value={arrayValue[0]}
        onValueChange={(value) => commitValue([value as string])}
        onBlur={field.handleBlur}
        className="gap-2"
      >
        {props.options.map((option, optionIndex) => (
          <label key={`${idPrefix}-option-${optionIndex}`} htmlFor={`${idPrefix}-option-${optionIndex}`} className="flex items-center gap-2 text-sm">
            <RadioGroupItem
              id={`${idPrefix}-option-${optionIndex}`}
              value={option.value}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-label={option.label}
            />
            {option.label}
          </label>
        ))}
      </RadioGroup>
    );
    return (
      <FormFieldLayout
        id={field.name}
        field={field}
        submissionAttempts={submissionAttempts}
        description={props.description}
        className={props.className}
        readOnly={props.readOnly}
        before={
          <div className="flex flex-col gap-1.5">
            {inlineLabel}
            {control}
          </div>
        }
      >
        {null}
      </FormFieldLayout>
    );
  }

  const control = (
    <MultiSelect
      modal={isOnModalSurface}
      onValuesChange={commitValue}
      single={!props.hasMany}
      values={arrayValue}
    >
      <MultiSelectTrigger
        id={field.name}
        className="w-full"
        onBlur={field.handleBlur}
        name={field.name}
        aria-required={props.required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        disabled={props.readOnly}
      >
        <MultiSelectValue placeholder={props.placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent onBlur={field.handleBlur} className="w-full" search={props.searchable}>
        <MultiSelectGroup>
          {props.options.map((option, optionIndex) => (
            <MultiSelectItem value={option.value} key={`multi-select-item-${field.name}-${optionIndex}`}>
              {option.label}
            </MultiSelectItem>
          ))}
        </MultiSelectGroup>
      </MultiSelectContent>
    </MultiSelect>
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
      readOnly={props.readOnly}
    >
      {control}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/SelectField.test.tsx

Two edits: widen `RadioHarness`'s `initialValue` and add a `scalar` prop, then a new `describe` block.

**1 — `RadioHarness`.**

```tsx
function RadioHarness(props: { initialValue: string[] | string; hasMany?: boolean; scalar?: boolean }) {
  const form = useAppForm({ defaultValues: { status: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="status">
        {(field) => (
          <field.SelectField
            label="Status"
            options={options}
            display="radio"
            hasMany={props.hasMany}
            scalar={props.scalar}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.status}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}
```

**2 — new tests.** Appended after `describe("SelectField: radio display", ...)`.

```tsx
describe("SelectField: scalar binding", () => {
  it("commits a scalar string, not a one-element array, when a radio is selected", async () => {
    const user = userEvent.setup();
    const { container } = render(<RadioHarness initialValue="" scalar />);
    const publishedIndex = options.findIndex((o) => o.label === "Published");
    const hiddenInputs = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    await user.click(hiddenInputs[publishedIndex]!);
    expect(screen.getByTestId("value-probe")).toHaveTextContent('"published"');
  });

  it("pre-selects the radio matching a scalar initial value", () => {
    const { container } = render(<RadioHarness initialValue="draft" scalar />);
    const hiddenInputs = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(hiddenInputs[0]?.checked).toBe(true);
  });
});
```

#### packages/react/src/fields/select/Cell.tsx

One edit: `SelectFieldCell`'s opening guard and `fields` computation (anchor: the lines before `const joinedLabels = ...`; the rest of the function — `Badge` rendering, the title-field `VexLink` wrap — is unchanged).

```tsx
export function SelectFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<SelectField, TData>,
) {
  const selectedValues = Array.isArray(props.value) ? props.value : props.value ? [props.value] : [];
  if (selectedValues.length === 0) return <span>—</span>;
  const config = useVexConfig();
  const fields = selectedValues
    .map((v) => props.fieldDef.options.find((o) => o.value === v))
    .filter((option): option is SelectField["options"][number] => option != null);
```

Update the JSDoc's `@param props.value` line to read `Scalar or array of selected option values from the document`.

#### packages/react/src/fields/select/Cell.test.tsx

Two edits: the import, and a new `describe` block appended after `describe("select: own rendering", ...)`.

**1 — import.** Add `select` and `SelectField` to the existing `@vexcms/core` import.

```ts
import { select, type TDocument, type SelectField } from "@vexcms/core";
```

**2 — new tests.**

```tsx
describe("select: scalar schema.validator storage", () => {
  const scalarFieldDef: SelectField = select({
    required: true,
    hasMany: false,
    schema: { validator: "literal" },
    options: options.fixture.fieldDef.options,
  });

  it("renders a single Badge for a scalar stored value", () => {
    const row = makeCellRow<TDocument>({ fieldKey: "field", value: "draft" });
    render(
      withCellConfig(
        <SelectFieldCell
          value="draft"
          row={row}
          fieldDef={scalarFieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />,
      ),
    );
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders the em-dash placeholder for an empty scalar value", () => {
    const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
    render(
      withCellConfig(
        <SelectFieldCell
          value=""
          row={row}
          fieldDef={scalarFieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />,
      ),
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
```

(Placed inside the same `extra: (options) => { ... }` callback as the existing describe blocks, so `options.fixture`/`collection` are in scope exactly as they are there.)

#### packages/react/src/fields/select/columnDef.tsx

One edit: the column's value type and the `cell` callback, to pass through a scalar or array value (a necessary consequence of `CellComponentProps<SelectField>["value"]` widening to `TField["defaultValue"]` = `string | string[]`).

```tsx
export function selectFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: SelectField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string | string[]> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | string[] | undefined;
      return (
        <SelectFieldCell<TData>
          value={value ?? (props.fieldDef.schema !== undefined ? "" : [])}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    // Enable sorting for all select fields
    enableSorting: true,

    // Enable hiding for all fields (user can toggle visibility)
    enableHiding: true,

    // Use field's cellAlignment config
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

`columnDef.test.ts` (`runColumnDefSuite({ fixture: selectFieldFixture })`) is unaffected — the fixture has no `schema` override, so it still exercises the array branch exactly as before.

#### packages/react/src/fields/select/Field.test.tsx

Two edits: widen `SelectHarness`'s `initialValue`, then a new `describe` block.

**1 — `SelectHarness`.** Widen the `initialValue` prop (anchor: the function signature).

```tsx
function SelectHarness(props: { fieldDef: SelectField; initialValue: string[] | string }) {
```

**2 — new tests.** Appended inside the `extra: ({ fixture }) => { ... }` callback, after `describe("select field", ...)`.

```tsx
describe("select: scalar schema.validator storage", () => {
  const scalarFieldDef = select({
    hasMany: false,
    schema: { validator: "literal" },
    options: fixture.fieldDef.options,
  });

  it("commits a scalar string, not an array, when a selection is made", async () => {
    const user = userEvent.setup();
    render(<SelectHarness fieldDef={scalarFieldDef} initialValue="" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Draft" }));

    expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify("draft"));
  });

  it("renders the configured label for an already-selected scalar value", () => {
    render(<SelectHarness fieldDef={scalarFieldDef} initialValue="published" />);

    const combobox = screen.getByRole("combobox");
    expect(within(combobox.parentElement!).getByText("Published")).toBeInTheDocument();
  });

  it("clears to an empty scalar string when the selected value is toggled off", async () => {
    const user = userEvent.setup();
    render(<SelectHarness fieldDef={scalarFieldDef} initialValue="draft" />);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Draft" }));

    expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(""));
  });
});
```

#### apps/test/src/vexcms/collections/storageShapes.ts

Append two fields to the `fields: {}` object, after Step 3's `viewCount` field (`select` is already imported there for Step 2's `nullableStatus`; no new import needed).

```ts
    literalStatus: select({
      label: "Literal Status",
      hasMany: false,
      schema: { validator: "literal" },
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    }),
    stringStatus: select({
      label: "String Status",
      hasMany: false,
      schema: { validator: "string" },
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    }),
```

Verify: `pnpm --filter @vexcms/core test -- select childInterfaceType interfaceGen queryArgs`; `pnpm --filter @vexcms/react test -- select SelectField`; `pnpm --filter @vexcms/telemetry test`; `pnpm --filter test vex:generate` and read `storageShapes` in `convex/vex.schema.ts`/`vex.types.ts` for `literalStatus: v.union(v.literal("active"), v.literal("inactive"))` / `literalStatus: StorageShapesLiteralStatusOption` and `stringStatus: v.string()` / `stringStatus: string`; `pnpm typecheck`.
</content>
<parameter name="i">Writing Step 4 spec section for select schema.validator override

### Step 5 — `relationship`/`upload` `schema: { validator: "id" | "string" }` [agent]

> Writer note: five corrections to spec-tasks.md's file list, each verified by reading the real code:
> 1. `db/depth.ts` (~121-135) needs **no change**. `buildDepthPopulate`/`buildFieldDepthPopulate` only build the populate *option* shape from `VexConfig` (which fields to ask for) — they never read a stored document value, so array-vs-scalar storage is invisible to them. Same for the compile-time counterpart `DepthPopulate`/`FieldDepthPopulateOption` (`collections/api/types.ts`).
> 2. `collections/resolveCollectionIndexes.ts` (~98-141) needs **no change**. Its relationship branch (`field.type === ADMIN_FIELDS.relationship.type`) only decides whether a `by_<fieldKey>` index exists — Convex's `.index()` call is identical whether the column is `v.id(...)` or `v.array(v.id(...))`.
> 3. `collections/listView/listViewFilterRelationshipTitles.ts` and `collections/listView/filters/ListViewFilterChips.tsx` (`formatFilterChipValue`) need **no change**. Both already operate on a *filter leaf* value, which `queryArgs.ts`'s own doc comment establishes is always scalar regardless of `hasMany` (`typeof node.value !== "string") return;` / `typeof value === "string"` guards already in place) — they were never array-shaped to begin with.
> 4. `media/config.ts`'s `upload().to` check and `collections/validator.ts`'s `getIncomingRelationships` are config-level (`field.collection.slug`/`field.to` string comparisons) and `documents/cloneDocumentForDuplicate.ts`'s `regenerateNestedIds` never touches `relationship`/`upload` at all (only `blocks`/`group`/`array`) — all three are storage-shape-agnostic already. No change.
> 5. React's `RelationshipPicker`/`RelationshipDocumentList`/`EmptyInput`/`FilledInput` (both fields) and both fields' `FilterInput.tsx` already take an already-normalized `string[]` (passed down from `Field.tsx`) or an already-scalar filter value — only the three places that read a RAW document/form value (`Field.tsx`, `Cell.tsx`, `Display.tsx`) plus `columnDef.tsx`'s type need touching.
>
> One addition beyond the task list, required for correctness: `PopulateMapEntry` (`types/generated.ts`) and `ApplyEntryPopulate` (`db/types.ts`) assume every relationship/upload's *populated result* is an array. Left alone, populating a scalar field would still type as `Doc[]` — a real P-030 violation (a consumer would need `result.ownerId[0]` plus a cast to use it). Both now carry a `scalar` flag sourced from `field.schema`. `RelationshipTargetOf` is redefined to read `CollectionsPopulateMap` (config-driven) instead of pattern-matching `__tableName` on the generated document's `interfaceType` literal, since `"string"` storage's interface type (`string`) carries no type-level brand to recover a target slug from — the populate map already has the real target slug from `field.collection.slug`/`field.to`, independent of storage. `GlobalRelationshipTargetOf`/`GlobalPopulated` have the identical latent gap for a scalar relationship living on a *global*, but no dogfood field exercises that path this step (fixing it needs an analogous `GlobalsPopulateMap`, which doesn't exist); left as a follow-up, not fixed here.
>
> Coordinated with Step 4 (select) over IRC on two shared seams: the `SchemaOverrideInput<THasMany, TValidator>` helper (`fields/baseTypes.ts`, Step 4's file) is reused verbatim here, generic position matched exactly (4th type param, right after `TFieldMeta`); `db/queryArgs.ts`'s `isArrayStoredField` is edited by both steps into ONE final body (shown below, Step 4's select branch plus this step's relationship/upload branch) — whichever step lands second only replaces the trailing return line, same identifier anchor either way.

Why: a single `v.id("x")` foreign key, or a string id kept for a library (Better Auth), is the most
common Convex reference shape. Today every reference is stored as an array.
Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`; `pnpm --filter test vex:generate` then `pnpm typecheck`.

- [ ] core `fields/{relationship,upload}/{types,config,validator,inputSchema}.ts`: `schema` input (`never` when `hasMany`); `Id<slug>` / `string` interface type + tests
- [ ] core `fields/utils.ts` + `types/generated.ts`: populate-map entries carry a `scalar` flag + test
- [ ] core `db/types.ts`: `RelationshipTargetOf` reads `CollectionsPopulateMap`; `ApplyEntryPopulate` returns a bare doc (not an array) for a scalar entry
- [ ] core `db/populate.ts` + `db/depth.ts`: populate a scalar id (`normalizeId` for string storage) + tests
- [ ] core `db/queryArgs.ts`: scalar reference `eq`/`in` + test
- [ ] core `access/buildChecks.ts`, `versions/assertNoDraftRelationships.ts`: scalar ids + tests
- [ ] core relationship target typing (`RelationshipTargetOf`, populate result types) for scalar storage + typecheck file
- [ ] react `fields/{relationship,upload}/{Field,Cell,Display,columnDef}.tsx`: scalar values + tests
- [ ] telemetry: record `schema.validator`
- [ ] apps/test `storageShapes`: `id` and `string` single relationships + a single upload

#### packages/core/src/fields/relationship/types.ts

Add a `THasMany` generic (mirrors `SelectFieldInput`'s position exactly — 4th param, right after `TFieldMeta`) carrying a `schema` override typed `never` when `hasMany: true`, and widen `validate`'s value from `string[]` to `string | string[]` (the scalar shape is a bare serialized id, never branded `Id<...>`, same convention the array shape already uses).

**1 — imports.** Add `SchemaOverrideInput` from `../baseTypes` (Step 4's shared helper) and `FieldSchemaValidator` from `../constants`, alongside the existing `ADMIN_FIELDS` import:

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS, type FieldSchemaValidator } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldLimit,
  FieldLimitInput,
  FieldSlotComponentsInput,
  FieldValidateProps,
  SchemaOverrideInput,
} from "../baseTypes";
```

**2 — `RelationshipFieldInput`.** Full interface body (only the generics line, `hasMany`, and the new `schema`/`validate` lines change):

```ts
export interface RelationshipFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  THasMany extends boolean = boolean,
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Target collection reference. The slug must match a registered collection in `defineConfig`. */
  collection: {
    /** The slug of the collection this field links to. Must be a registered collection slug. */
    slug: TTargetSlug;
  };
  /**
   * Whether this field stores multiple references.
   * `false` stores a single `Id`, `true` stores `Id[]`.
   * @defaultValue false
   */
  hasMany?: THasMany;
  /**
   * Overrides the Convex storage shape for a single-value (`hasMany: false`)
   * reference: `"id"` stores `v.id("slug")` (`Id<"slug">`); `"string"` stores
   * `v.string()` (plain `string`) — for a reference column a library owns
   * (e.g. Better Auth's `session.userId`) that must stay a string. `never`
   * when `hasMany: true` — overrides only apply to single-value fields.
   * Omitted: storage is unchanged, `v.array(v.id("slug"))` even when
   * `hasMany` is `false`.
   */
  schema?: SchemaOverrideInput<THasMany, Extract<FieldSchemaValidator, "id" | "string">>;
  /** Minimum number of related documents required, once a value is supplied. @see {@link FieldLimitInput} */
  min?: FieldLimitInput;
  /** Maximum number of related documents allowed. @see {@link FieldLimitInput} */
  max?: FieldLimitInput;
  admin?: RelationshipFieldAdminInput<TCollectionSlug, TTargetSlug, TComponent>;
  /** Server-only async validation. `value` is the serialized id(s): a bare `string` for scalar storage, `string[]` otherwise. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}
```

**3 — `RelationshipField`.** Full interface body (adds `schema`, widens `validate`):

```ts
export interface RelationshipField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.relationship.type;
  /** Target collection reference. */
  collection: {
    /** The slug of the collection this field links to. */
    slug: TTargetSlug;
  };
  /** Whether this field stores multiple document references. */
  hasMany: boolean;
  /** Resolved storage override. Present only when the input set one. @see {@link RelationshipFieldInput.schema} */
  schema?: { validator: Extract<FieldSchemaValidator, "id" | "string"> };
  /** Minimum number of related documents required, once a value is supplied, with its resolved error message. @see {@link FieldLimit} */
  min?: FieldLimit;
  /** Maximum number of related documents allowed, with its resolved error message. @see {@link FieldLimit} */
  max?: FieldLimit;
  admin: RelationshipFieldAdminConfig<TCollectionSlug, TTargetSlug, TComponent>;
  /** Server-only async validation. `value` is the serialized id(s): a bare `string` for scalar storage, `string[]` otherwise. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}
```

#### packages/core/src/fields/relationship/config.ts

**1 — import.** Add `FIELD_SCHEMA_VALIDATORS` alongside `ADMIN_FIELDS`:

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "../constants";
```

**2 — `relationship()`.** Generics line and `interfaceType` change; everything else in the function body is unchanged:

```ts
export function relationship<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  THasMany extends boolean = boolean,
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  options: RelationshipFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, THasMany, TTargetSlug, TComponent>,
): RelationshipField<TCollectionSlug, TFieldMeta, TTargetSlug, TComponent> {
  return {
    label: "",
    required: false,
    hasMany: false,
    ...options,
    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) => `Must be at least ${value} related items.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) => `Must be no more than ${value} related items.`,
    }),
    type: ADMIN_FIELDS.relationship.type,
    interfaceType:
      options.schema?.validator === FIELD_SCHEMA_VALIDATORS.id
        ? `Id<"${options.collection.slug}">`
        : options.schema?.validator === FIELD_SCHEMA_VALIDATORS.string
          ? "string"
          : `Id<"${options.collection.slug}">[]`,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/relationship/validator.ts

**1 — import.** Add `FIELD_SCHEMA_VALIDATORS`:

```ts
import { FIELD_SCHEMA_VALIDATORS } from "../constants";
```

**2 — `relationshipFieldToValidator`.** Full function body:

```ts
export function relationshipFieldToValidator(props: {
  field: RelationshipField;
}): string {
  const { field } = props;
  if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.id) {
    return applyBaseValidators({ field, validator: `v.id("${field.collection.slug}")` });
  }
  if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.string) {
    return applyBaseValidators({ field, validator: "v.string()" });
  }
  return applyBaseValidators({ field, validator: `v.array(v.id("${field.collection.slug}"))` });
}
```

#### packages/core/src/fields/relationship/validator.test.ts

Append a new `describe` block (existing `describe("relationshipFieldToValidator", ...)` block is untouched):

```ts
describe("relationshipFieldToValidator — schema override", () => {
  it("emits v.id() for schema.validator 'id'", () => {
    const field = relationship({
      collection: { slug: "authors" },
      schema: { validator: "id" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe('v.id("authors")');
  });

  it("wraps v.id() in v.optional() when not required", () => {
    const field = relationship({
      collection: { slug: "authors" },
      schema: { validator: "id" },
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe('v.optional(v.id("authors"))');
  });

  it("emits v.string() for schema.validator 'string'", () => {
    const field = relationship({
      collection: { slug: "authors" },
      schema: { validator: "string" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe("v.string()");
  });

  it("wraps v.string() in v.optional() when not required", () => {
    const field = relationship({
      collection: { slug: "authors" },
      schema: { validator: "string" },
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe("v.optional(v.string())");
  });
});
```

#### packages/core/src/fields/relationship/inputSchema.ts

**1 — `relationshipFieldToInputSchema`.** Full function body (adds an early scalar branch; the array branch below it is unchanged):

```ts
export function relationshipFieldToInputSchema(props: {
  field: RelationshipField;
}): ZodType {
  const { field } = props;

  if (field.schema !== undefined) {
    const scalarSchema = field.required
      ? z.string({ error: "This field is required." })
      : z.string().optional();
    return applyBaseInputSchemaMeta({ field, inputSchema: scalarSchema });
  }

  let inputSchema = field.required
    ? z.array(z.string(), { error: "This field is required." })
    : z.array(z.string());

  if (field.min) {
    const [min, message] = field.min;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const [max, message] = field.max;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(ADMIN_FIELDS.relationship.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
```

Add one paragraph to the function's leading JSDoc (above `@param props`): "Scalar storage (`schema` set) validates as a bare `z.string()` — required rejects `undefined`, optional accepts `undefined` with no `.default()` (there is no sensible default id). `min`/`max` (reference-count constraints) don't apply to a single reference and are not read in this branch." The existing JSDoc covering the array branch is otherwise unchanged.

#### packages/core/src/fields/relationship/inputSchema.test.ts

Append:

```ts
describe("relationshipFieldToInputSchema — schema override", () => {
  it("required scalar: rejects undefined, accepts a bare string", () => {
    const field = relationship({ collection: { slug: "authors" }, schema: { validator: "id" }, required: true });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(undefined).success).toBe(false);
    expect(schema.safeParse("author_1").success).toBe(true);
  });

  it("optional scalar: accepts undefined, with no default value", () => {
    const field = relationship({ collection: { slug: "authors" }, schema: { validator: "id" }, required: false });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.parse(undefined)).toBeUndefined();
  });

  it("rejects an array for scalar storage — must be a bare string", () => {
    const field = relationship({ collection: { slug: "authors" }, schema: { validator: "string" }, required: true });
    const schema = relationshipFieldToInputSchema({ field });
    expect(schema.safeParse(["author_1"]).success).toBe(false);
  });
});
```

#### packages/core/src/fields/upload/types.ts

Mirrors relationship's edit exactly (no `TTargetSlug`/`TComponent`/admin generics on this field).

**1 — imports.** Add `FieldSchemaValidator` to the existing `../constants` import and `SchemaOverrideInput` to the existing `../types`/`BaseFieldMeta` import area:

```ts
import { ADMIN_FIELDS, type FieldSchemaValidator } from "../constants";
import { SchemaOverrideInput } from "../baseTypes";
```

**2 — `UploadFieldInput`.** Full interface body:

```ts
export interface UploadFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  THasMany extends boolean = boolean,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /**
   * The slug of the media collection that stores uploaded files for this field.
   *
   * Must match a media collection defined via a storage adapter's
   * `defineMediaCollection()`. After running `vex generate`, this is typed as
   * `MediaCollectionSlug` — a union of all media collection slugs in the project.
   * Before generation, it falls back to `string`.
   *
   * Config validation (in `media/config.ts`) also checks at runtime that the
   * slug exists in `VexConfig.mediaCollections`.
   *
   * @example
   * ```ts
   * upload({ to: "images", label: "Featured Image" })
   */
  to: MediaCollectionSlug;
  /**
   * Minimum number of files allowed. Absent — the default — means no minimum.
   * @see {@link FieldLimitInput}
   */
  min?: FieldLimitInput;
  /**
   * Maximum number of files allowed.
   * @see {@link FieldLimitInput}
   */
  max?: FieldLimitInput;
  /**
   * Whether this input accepts multiple files or only one.
   */
  hasMany?: THasMany;
  /**
   * Overrides the Convex storage shape for a single-file (`hasMany: false`)
   * upload: `"id"` stores `v.id("slug")` (`Id<"slug">`); `"string"` stores
   * `v.string()` (plain `string`). `never` when `hasMany: true`. Omitted:
   * storage is unchanged, `v.array(v.id("slug"))` even when `hasMany` is `false`.
   */
  schema?: SchemaOverrideInput<THasMany, Extract<FieldSchemaValidator, "id" | "string">>;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   */
  defaultValue?: string | string[];
  /**
   * Restrict files that can be uploaded by mimeType.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept
   * @example 'image/*'
   * @example 'image/*, audio/mp4'
   * @example 'image/webp, audio/mp3'
   */
  accept?: string;
  /** Server-only async validation. `value` is the serialized id(s): a bare `string` for scalar storage, `string[]` otherwise. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}
```

**3 — `UploadField`.** Full interface body:

```ts
export interface UploadField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.upload.type;
  to: MediaCollectionSlug;
  /**
   * Whether this input accepts multiple files or only one.
   */
  hasMany: boolean;
  /** Resolved storage override. Present only when the input set one. @see {@link UploadFieldInput.schema} */
  schema?: { validator: Extract<FieldSchemaValidator, "id" | "string"> };
  /**
   * Minimum number of files allowed, with its resolved error message.
   * Absent means no minimum — upload's resolved `min` no longer defaults to `0`.
   * @see {@link FieldLimit}
   */
  min?: FieldLimit;
  /**
   * Maximum number of files allowed, with its resolved error message.
   * @see {@link FieldLimit}
   */
  max?: FieldLimit;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   */
  defaultValue?: string | string[];
  /**
   * Restrict files that can be uploaded by mimeType.
   */
  accept: string;
  /** Server-only async validation. `value` is the serialized id(s): a bare `string` for scalar storage, `string[]` otherwise. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string | string[]>): Promise<void> | void;
}
```

#### packages/core/src/fields/upload/config.ts

**1 — import.** Add `FIELD_SCHEMA_VALIDATORS`:

```ts
import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "../constants";
```

**2 — `upload()`.** Generics line and `interfaceType` change:

```ts
export function upload<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  THasMany extends boolean = boolean,
>(
  options: UploadFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, THasMany>,
): UploadField<TCollectionSlug, TFieldMeta> {
  if (!options.to || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.to)) {
    throw new Error(`upload(): "to" must be a valid collection slug. Got "${options.to}".`);
  }

  return {
    label: "",
    required: false,
    hasMany: false,
    accept: "",
    ...options,
    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) =>
        `Must be at least ${value} file${value === 1 ? "" : "s"}.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) =>
        `Must be no more than ${value} file${value === 1 ? "" : "s"}.`,
    }),
    type: ADMIN_FIELDS.upload.type,
    interfaceType:
      options.schema?.validator === FIELD_SCHEMA_VALIDATORS.id
        ? `Id<"${options.to}">`
        : options.schema?.validator === FIELD_SCHEMA_VALIDATORS.string
          ? "string"
          : `Id<"${options.to}">[]`,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options.admin,
      components: resolveFieldComponents({ components: options.admin?.components }),
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/upload/validator.ts

**1 — import.** Add `FIELD_SCHEMA_VALIDATORS`.

**2 — `uploadFieldToValidator`.** Full function body:

```ts
export function uploadFieldToValidator(props: { field: UploadField }): string {
  const { field } = props;
  if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.id) {
    return applyBaseValidators({ field, validator: `v.id("${field.to}")` });
  }
  if (field.schema?.validator === FIELD_SCHEMA_VALIDATORS.string) {
    return applyBaseValidators({ field, validator: "v.string()" });
  }
  return applyBaseValidators({ field, validator: `v.array(v.id("${field.to}"))` });
}
```

#### packages/core/src/fields/upload/validator.test.ts

Append, mirroring relationship's four cases, substituting `upload({ to: "images", ... })` / `v.id("images")`.

#### packages/core/src/fields/upload/inputSchema.ts

**1 — `uploadFieldToInputSchema`.** Full function body:

```ts
export function uploadFieldToInputSchema(props: { field: UploadField }): ZodType {
  const { field } = props;

  if (field.schema !== undefined) {
    const scalarSchema = field.required
      ? z.string({ error: "This field is required." })
      : z.string().optional();
    return applyBaseInputSchemaMeta({ field, inputSchema: scalarSchema });
  }

  const requiredError = "This field is required.";
  let inputSchema = field.required
    ? z.array(z.string(), { error: requiredError }).min(1, requiredError)
    : z.array(z.string());

  if (field.min) {
    const [min, message] = field.min;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length >= min,
      message,
    );
  }
  if (field.max) {
    const [max, message] = field.max;
    inputSchema = inputSchema.refine(
      (value) => (!field.required && value.length === 0) || value.length <= max,
      message,
    );
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

#### packages/core/src/fields/upload/inputSchema.test.ts

Append, mirroring relationship's three new cases, substituting `upload({ to: "images", ... })`.

#### packages/core/src/collections/interfaceGen.test.ts

Append, inside `describe("interfaceType carries the target collection slug", ...)`, after its existing tests:

```ts
it("relationship with schema.validator 'id' emits a bare Id<target> (no array)", () => {
  const field = relationship({ collection: { slug: "themes" }, schema: { validator: "id" } });
  expect(field.interfaceType).toBe('Id<"themes">');
});

it("relationship with schema.validator 'string' emits string", () => {
  const field = relationship({ collection: { slug: "themes" }, schema: { validator: "string" } });
  expect(field.interfaceType).toBe("string");
});

it("upload with schema.validator 'id' emits a bare Id<target> (no array)", () => {
  expect(upload({ to: "images", schema: { validator: "id" } }).interfaceType).toBe('Id<"images">');
});
```

#### packages/core/src/fields/utils.ts

`buildPopulateMapEntry`'s relationship/upload branches emit a `scalar: true` member when the field set a `schema` override — the config-time source of truth `ApplyEntryPopulate` (below) reads to pick a bare-doc vs. array populated type:

```ts
function buildPopulateMapEntry(props: { field: AdminDataField }): string | null {
  const { field } = props;
  if (field.type === ADMIN_FIELDS.relationship.type) {
    return field.schema !== undefined
      ? `{ kind: "relationship"; target: "${field.collection.slug}"; scalar: true }`
      : `{ kind: "relationship"; target: "${field.collection.slug}" }`;
  }
  if (field.type === ADMIN_FIELDS.upload.type) {
    return field.schema !== undefined
      ? `{ kind: "upload"; target: "${field.to}"; scalar: true }`
      : `{ kind: "upload"; target: "${field.to}" }`;
  }
  if (field.type === ADMIN_FIELDS.array.type) {
    return buildPopulateMapEntry({ field: field.items });
  }
  if (field.type === ADMIN_FIELDS.group.type) {
    const inner = buildPopulateMapEntries({ fields: field.fields });
    return inner ? `{ kind: "group"; fields: { ${inner} } }` : null;
  }
  if (field.type === ADMIN_FIELDS.blocks.type) {
    const blockEntries = field.blocks
      .map((block) => {
        const inner = buildPopulateMapEntries({ fields: block.fields });
        return inner ? `${block.blockType}: { ${inner} }` : null;
      })
      .filter((entry): entry is string => entry !== null);
    return blockEntries.length > 0 ? `{ kind: "blocks"; blocks: { ${blockEntries.join("; ")} } }` : null;
  }
  return null;
}
```

#### packages/core/src/fields/utils.test.ts

Append:

```ts
describe("fieldsToPopulateMap — scalar storage", () => {
  it("omits `scalar` for default (array) relationship/upload storage", () => {
    const body = fieldsToPopulateMap({
      key: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    expect(body).toBe('posts: { author: { kind: "relationship"; target: "authors" } }');
  });

  it("adds `scalar: true` for a relationship with schema.validator set", () => {
    const body = fieldsToPopulateMap({
      key: "posts",
      fields: { ownerId: relationship({ collection: { slug: "authors" }, schema: { validator: "id" } }) },
    });
    expect(body).toBe(
      'posts: { ownerId: { kind: "relationship"; target: "authors"; scalar: true } }',
    );
  });

  it("adds `scalar: true` for an upload with schema.validator set", () => {
    const body = fieldsToPopulateMap({
      key: "pages",
      fields: { cover: upload({ to: "images", schema: { validator: "id" } }) },
    });
    expect(body).toBe('pages: { cover: { kind: "upload"; target: "images"; scalar: true } }');
  });
});
```

(Add `fieldsToPopulateMap`, `relationship`, `upload` to this file's existing `./utils`/`../index` imports.)

#### packages/core/src/types/generated.ts

`PopulateMapEntry`'s relationship/upload member gains an optional `scalar` flag:

```ts
export type PopulateMapEntry =
  | { kind: "relationship" | "upload"; target: string; scalar?: true }
  | { kind: "group"; fields: Record<string, PopulateMapEntry> }
  | { kind: "blocks"; blocks: Record<string, Record<string, PopulateMapEntry>> };
```

Add one line to its doc comment: "`scalar: true` marks a `relationship`/`upload` field whose `schema` override made its storage (and therefore its populated result) a bare doc instead of an array of docs."

#### packages/core/src/db/types.ts

**1 — `RelationshipTargetOf`.** Redefined to read `CollectionsPopulateMap` (config-driven target, works identically for array, scalar-id, and scalar-string storage) instead of pattern-matching `DocumentBySlug`'s generated field type (which carries no slug brand at all for `"string"` storage):

```ts
export type RelationshipTargetOf<
  TCollectionSlug extends CollectionSlug,
  TKey extends string,
> = TCollectionSlug extends keyof CollectionsPopulateMap
  ? TKey extends keyof CollectionsPopulateMap[TCollectionSlug]
    ? CollectionsPopulateMap[TCollectionSlug][TKey] extends {
        kind: "relationship" | "upload";
        target: infer Target extends string;
      }
      ? Target extends CollectionSlug
        ? Target
        : CollectionSlug
      : CollectionSlug
    : CollectionSlug
  : CollectionSlug;
```

**2 — `ApplyEntryPopulate`.** A scalar entry (`scalar: true`) resolves to a bare doc/`HiddenDocument` union instead of an array of them; everything else (the `group`/`blocks` branches) is unchanged. Insert a new private helper immediately above it and replace `ApplyEntryPopulate`'s body:

```ts
/**
 * The populated result for ONE relationship/upload leaf, before `ApplyEntryPopulate`
 * decides whether `TEntry` even matched a leaf shape — a bare doc/`HiddenDocument`
 * union for a `scalar: true` entry (`schema` override, `hasMany: false`), an array of
 * that union otherwise (array storage, the pre-existing shape). @see {@link ApplyEntryPopulate}
 */
type ApplyRelationshipEntryPopulate<Target extends CollectionSlug, TOpt, TScalar> = TOpt extends {
  populate: infer NestedPopulate;
}
  ? NestedPopulate extends PopulateShape<Target>
    ? TScalar extends true
      ? Populated<Target, NestedPopulate> | HiddenDocument<Target>
      : (Populated<Target, NestedPopulate> | HiddenDocument<Target>)[]
    : TScalar extends true
      ? DocumentBySlug[Target] | HiddenDocument<Target>
      : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
  : TScalar extends true
    ? DocumentBySlug[Target] | HiddenDocument<Target>
    : (DocumentBySlug[Target] | HiddenDocument<Target>)[];

/** One field's populated value, dispatched by its {@link PopulateMapEntry} kind. @see {@link Populated} */
type ApplyEntryPopulate<TValue, TEntry extends PopulateMapEntry, TOpt> = TEntry extends {
  kind: "relationship" | "upload";
  target: infer Target extends string;
  scalar?: infer TScalar;
}
  ? TOpt extends true | { populate: unknown }
    ? Target extends CollectionSlug
      ? Target extends keyof DocumentBySlug
        ? ApplyRelationshipEntryPopulate<Target, TOpt, TScalar>
        : TValue
      : TValue
    : TValue
  : TEntry extends { kind: "group"; fields: infer TFields extends Record<string, PopulateMapEntry> }
    ? TOpt extends Record<string, unknown>
      ? NonNullable<TValue> extends ReadonlyArray<infer Item>
        ? ApplyContainerPopulate<Item, TFields, TOpt>[]
        : ApplyContainerPopulate<TValue, TFields, TOpt>
      : TValue
    : TEntry extends {
          kind: "blocks";
          blocks: infer TBlocks extends Record<string, Record<string, PopulateMapEntry>>;
        }
      ? TOpt extends Record<string, unknown>
        ? NonNullable<TValue> extends ReadonlyArray<infer Item>
          ? ApplyBlockItemPopulate<Item, TBlocks, TOpt>[]
          : TValue
        : TValue
      : TValue;
```

#### packages/core/src/db/populate.ts

`populateContainers`'s column pass now accepts a scalar (non-array) field value alongside the existing array case: it collects scalar values separately, resolves the target collection from either shape's first sample id, and — only for the scalar values — validates each through `ctx.db.normalizeId` before fetching (array storage is always a native `Id`, already guaranteed valid; scalar `"string"` storage may hold a value that isn't a real id in this deployment, and must be dropped rather than crash `getAll`). The write-back assigns a bare resolved doc (not a one-element array) back onto a scalar container. Full function body:

```ts
async function populateContainers<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  containers: Record<string, unknown>[];
  populate: Record<string, unknown>;
  drafts?: boolean;
  config?: VexConfig;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
}): Promise<void> {
  const { ctx, containers, populate, drafts, config, access, auth } = props;
  const user = auth?.user ?? null;
  const organization = auth?.organization;

  for (const [fieldKey, opts] of Object.entries(populate)) {
    const isLeaf = opts === true || (typeof opts === "object" && opts !== null && "populate" in opts);
    if (!isLeaf) {
      if (typeof opts === "object" && opts !== null) {
        await populateNestedContainer({
          ctx,
          containers,
          fieldKey,
          opts: opts as Record<string, unknown>,
          drafts,
          config,
          access,
          auth,
        });
      }
      continue;
    }

    const idsByContainerIndex: unknown[][] = [];
    const scalarValueByContainerIndex = new Map<number, string>();
    const allIds: GenericId<CollectionSlug>[] = [];
    let hasArrayValue = false;
    for (let i = 0; i < containers.length; i++) {
      const value = containers[i][fieldKey];
      if (Array.isArray(value)) {
        hasArrayValue = true;
        idsByContainerIndex[i] = value;
        for (const id of value) allIds.push(id as GenericId<CollectionSlug>);
      } else if (typeof value === "string") {
        scalarValueByContainerIndex.set(i, value);
      }
    }
    if (!hasArrayValue && scalarValueByContainerIndex.size === 0) continue;

    const firstScalarValue =
      scalarValueByContainerIndex.size > 0 ? [...scalarValueByContainerIndex.values()][0] : undefined;
    let targetSlug: CollectionSlug | undefined;
    let commitTsKeys: string[] = [];
    const sampleId = allIds[0] ?? firstScalarValue;
    if (config && sampleId !== undefined) {
      targetSlug = tryResolveTargetCollectionSlug({ ctx, config, id: sampleId as GenericId<CollectionSlug> });
      const targetCollection = targetSlug
        ? findCollectionConfig({ config, slug: targetSlug })
        : undefined;
      if (targetCollection) {
        commitTsKeys = Object.entries(targetCollection.fields)
          .filter(([, f]) => f.type === ADMIN_FIELDS.commitTs.type)
          .map(([key]) => key);
      }
    }
    const resource = targetSlug;

    const scalarIdByContainerIndex = new Map<number, GenericId<CollectionSlug>>();
    for (const [i, value] of scalarValueByContainerIndex) {
      const normalized = targetSlug
        ? ctx.db.normalizeId(targetSlug, value)
        : (value as GenericId<CollectionSlug>);
      if (normalized !== null) {
        scalarIdByContainerIndex.set(i, normalized as GenericId<CollectionSlug>);
        allIds.push(normalized as GenericId<CollectionSlug>);
      }
    }

    const uniqueIds = [...new Set(allIds)];

    const fetched = uniqueIds.length > 0 ? await getAll(ctx.db, uniqueIds) : [];
    const processedById = new Map<string, Record<string, unknown> | HiddenDocument>();
    for (let i = 0; i < uniqueIds.length; i++) {
      const raw = fetched[i];
      if (raw === null) continue;

      if (!drafts) {
        const status = (raw as Record<string, unknown>)[VERSION_SYSTEM_FIELDS.status.slug];
        if (!(status === undefined || status === VERSION_STATUSES.published.key)) continue;
      }

      let resolved: Record<string, unknown> = raw as Record<string, unknown>;
      if (access !== undefined && resource !== undefined) {
        const allowed = hasPermission({
          access,
          user,
          organization,
          resource,
          action: CRUD_ACTIONS.read,
          data: resolved,
        });
        if (!allowed) {
          processedById.set(uniqueIds[i], {
            _id: resolved._id as GenericId<CollectionSlug>,
            code: "ACCESS_DENIED",
            resource,
            action: "read",
          } satisfies HiddenDocument);
          continue;
        }
        resolved = stripDeniedFields(
          resolved,
          resolveFieldPermissions({
            access,
            user,
            organization,
            resource,
            action: CRUD_ACTIONS.read,
            data: resolved,
          }),
        );
      }
      if (commitTsKeys.length > 0) {
        resolved = convertCommitTsFieldsToMs({ doc: resolved as GenericDocument, keys: commitTsKeys });
      }
      processedById.set(uniqueIds[i], resolved);
    }

    if (typeof opts === "object" && opts !== null && "populate" in opts && opts.populate) {
      const allowedDocs: Record<string, unknown>[] = [];
      for (const value of processedById.values()) {
        if (!isHiddenDocument(value)) allowedDocs.push(value);
      }
      if (allowedDocs.length > 0) {
        await populateContainers({
          ctx,
          containers: allowedDocs,
          populate: opts.populate as Record<string, unknown>,
          drafts,
          config,
          access,
          auth,
        });
      }
    }

    for (let i = 0; i < containers.length; i++) {
      const ids = idsByContainerIndex[i];
      if (ids) {
        containers[i][fieldKey] = ids
          .map((id) => processedById.get(id as string))
          .filter((value): value is Record<string, unknown> | HiddenDocument => value !== undefined);
        continue;
      }
      const scalarId = scalarIdByContainerIndex.get(i);
      if (scalarId !== undefined) {
        const resolved = processedById.get(scalarId as string);
        if (resolved !== undefined) containers[i][fieldKey] = resolved;
      }
    }
  }
}
```

#### packages/core/src/db/test/convex/schema.ts

Two new optional, additive columns on the shared `posts` fixture table (every other test keeps inserting without them) for the scalar populate tests below:

```ts
posts: defineTable({
  title: v.string(),
  slug: v.string(),
  body: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  updatedAt: v.optional(v.commitTs()),
  featured: v.optional(v.boolean()),
  deleted: v.optional(v.boolean()),
  author: v.optional(v.array(v.id("authors"))),
  cover: v.optional(v.array(v.id("images"))),
  parent: v.optional(v.array(v.id("posts"))),
  category: v.optional(v.array(v.string())),
  // Scalar relationship storage fixtures (`schema.validator` override):
  // `ownerId` mirrors `v.id("authors")` ("id" storage), `ownerRef` mirrors
  // `v.string()` ("string" storage, e.g. a library-owned reference column).
  ownerId: v.optional(v.id("authors")),
  ownerRef: v.optional(v.string()),
  vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  vex_publishedAt: v.optional(v.number()),
  vex_activeVersion: v.optional(v.number()),
  vex_publishedId: v.optional(v.id("posts")),
})
```

(Everything else about the `defineTable`/`.index(...)` chain is unchanged.)

#### packages/core/src/db/populate.test.ts

Append a new top-level `describe`:

```ts
describe("populateDocs — scalar relationship storage (schema.validator)", () => {
  test("populates a scalar id-storage field to a bare doc, not an array", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Lena Park" });
      const postId = await ctx.db.insert("posts", { title: "Hi", slug: "hi", ownerId: authorId });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { ownerId: true } as PopulateShape);
    });

    const owner = (result[0] as unknown as Record<string, unknown>).ownerId as DocumentBySlug["authors"];
    expect(Array.isArray(owner)).toBe(false);
    expect(owner.name).toBe("Lena Park");
  });

  test("populates a scalar string-storage field via normalizeId, resolving to the same doc as the native id would", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Dana" });
      const postId = await ctx.db.insert("posts", { title: "Hi", slug: "hi", ownerRef: authorId });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { ownerRef: true } as PopulateShape);
    });

    const owner = (result[0] as unknown as Record<string, unknown>).ownerRef as DocumentBySlug["authors"];
    expect(owner.name).toBe("Dana");
  });

  test("drops an invalid string-storage value instead of throwing, leaving the raw value in place", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const postId = await ctx.db.insert("posts", {
        title: "Hi",
        slug: "hi",
        ownerRef: "not-a-real-id",
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { ownerRef: true } as PopulateShape, undefined, fixtureConfig);
    });

    expect((result[0] as unknown as Record<string, unknown>).ownerRef).toBe("not-a-real-id");
  });

  test("a document with no value for the scalar field is left untouched", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const postId = await ctx.db.insert("posts", { title: "Hi", slug: "hi" });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { ownerId: true } as PopulateShape);
    });

    expect((result[0] as unknown as Record<string, unknown>).ownerId).toBeUndefined();
  });
});
```

#### packages/core/src/db/queryArgs.ts

`isArrayStoredField` composed with Step 4's select branch (coordinated over IRC — whichever step lands second keeps this exact final body):

```ts
function isArrayStoredField(
  field: AdminField,
): field is Extract<AdminField, { type: "select" | "relationship" | "upload" }> {
  if (field.type === ADMIN_FIELDS.select.type) return field.schema === undefined;
  if (field.type === ADMIN_FIELDS.relationship.type || field.type === ADMIN_FIELDS.upload.type) {
    return field.schema === undefined;
  }
  return false;
}
```

`normalizeArrayStoredWhere`'s own body needs no change: a field `isArrayStoredField` excludes never enters `arrayFields`, so its `eq`/`neq` leaf already passes through unwrapped.

#### packages/core/src/db/queryArgs.test.ts

Append, inside `describe("normalizeArrayStoredWhere", ...)`:

```ts
test("leaves a scalar-storage (schema.validator set) relationship field's eq value unwrapped", () => {
  const scalarFields = {
    ...fields,
    contributorId: relationship({
      collection: { slug: "authors" },
      hasMany: false,
      schema: { validator: "id" },
    }),
  };
  const where = { field: "contributorId", op: "eq", value: "author_123" } as const;
  expect(normalizeArrayStoredWhere({ where: where as never, fields: scalarFields })).toEqual(where);
});
```

#### packages/core/src/access/buildChecks.ts

`indexedOwnerCheck` currently wraps the comparison value in `[user._id]` whenever the field's TYPE is `relationship`, regardless of storage — wrong for scalar storage, where the column holds a bare id. Narrow the check to "relationship AND still array-stored" (`schema === undefined` — the same predicate `queryArgs.ts`'s `isArrayStoredField` uses):

```ts
export function indexedOwnerCheck<S extends string, F extends AccessIndexedFieldFor<S>>(props: {
  field: F;
  resource: AccessResourceRef<S>;
}): AccessCheck<S> {
  const index = indexNameFor(props.resource, props.field);
  const ownerField = props.resource.fields[props.field];
  const isArrayStoredRelationship =
    ownerField?.type === ADMIN_FIELDS.relationship.type && ownerField.schema === undefined;
  return {
    withIndex: ({ user }: { user: AuthUserDocument }) => ({
      name: index,
      range: (ix: never) =>
        (ix as unknown as RawRange).eq(props.field, isArrayStoredRelationship ? [user._id] : user._id),
    }),
  } as unknown as AccessCheck<S>;
}
```

Update its JSDoc's second paragraph: "a relationship column stores `Id[]` **unless it has a `schema` override** (`schema.validator` set makes it a bare `Id`), so the comparison value is `[user._id]` only for array-stored relationships; anything else — including a scalar relationship — compares the id directly." Needs `ADMIN_FIELDS` imported (not currently imported in this file) alongside the existing `./types`/`../collections/resolveCollectionIndexes` imports: `import { ADMIN_FIELDS } from "../fields";`.

#### packages/core/src/access/buildChecks.test.ts

**1 — fixture.** Add a scalar-relationship owner field beside the existing `posts` fixture:

```ts
const postsWithScalarOwner = defineCollection({
  slug: "postsWithScalarOwner",
  fields: {
    title: text(),
    ownerId: relationship({ collection: { slug: "authors" }, schema: { validator: "id" }, index: "by_owner_id" }),
  },
});
```

**2 — new tests**, inside `describe("indexedOwnerCheck", ...)`, after its existing cases:

```ts
it("compares the id directly for a scalar-storage (schema.validator set) relationship field", () => {
  const check = indexedOwnerCheck({ field: "ownerId" as never, resource: postsWithScalarOwner });
  const { eq, ix } = stubQuery();
  const { range } = withIndexOf(check, { user: { _id: "u1" } });
  range(ix);
  expect(eq).toHaveBeenCalledWith("ownerId", "u1");
});
```

#### packages/core/src/versions/assertNoDraftRelationships.ts

The per-field value may now be a bare id (scalar storage) instead of an array:

```ts
for (const key of relationshipKeys) {
  const value = args.document[key];
  const ids = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  if (ids.length === 0) continue;
  for (const id of ids) {
    const target = await args.ctx.db.get(id as never);
    if (target === null) continue;
    if ((target as Record<string, unknown>).vex_status === "draft") {
      throw new ConvexError({
        message: `Cannot publish while "${key}" links to a document that is still a draft — publish or unlink it first.`,
        field: key,
      });
    }
  }
}
```

#### packages/core/src/versions/assertNoDraftRelationships.test.ts

Append, after the existing `postsWithRelationship`/`bannerWithRelationship` fixtures:

```ts
const postsWithScalarRelationship = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    owner: relationship({ collection: { slug: "posts" }, schema: { validator: "id" } }),
  },
  versions: { drafts: true },
});
```

And a new test inside `describe("assertNoDraftRelationships", ...)`:

```ts
test("rejects, naming the field, when a scalar-storage relationship links to a draft", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
    const draftId = await ctx.db.insert("posts", { title: "Draft", vex_status: "draft" });
    await expect(
      assertNoDraftRelationships({
        ctx,
        target: { config: postsWithScalarRelationship } as never,
        document: { title: "Child", owner: draftId },
      }),
    ).rejects.toThrow(ConvexError);
  });
});
```

#### packages/react/src/fields/relationship/Field.tsx

`RelationshipFieldAdminInner` normalizes the TanStack field value (`string | string[] | undefined`) to the local `string[]` the rest of the function (and every sub-widget: `RelationshipEmpty`/`RelationshipFilledState`/`RelationshipPicker`) already expects, and de-normalizes on write. Only the value type, the `value`/`isScalar` derivation, and the three handlers change:

```ts
function RelationshipFieldAdminInner(
  props: FieldComponentProps<CollectionFieldMeta, RelationshipField<VexResourceSlug, CollectionFieldMeta>>,
) {
  const field = useFieldContext<string | string[] | undefined>();
  const config = useVexConfig();
  const [activeField, setActiveField] = useQueryState(
    MODALS.relationshipPicker.urlParam,
    parseAsString,
  );
  const [defaultTab, setDefaultTab] = useState<"select" | "create">("select");
  const isOpen = activeField === props.name;
  const isReadOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const drafts = props.documentStatus === VERSION_STATUSES.draft.key;
  const isScalar = props.fieldDef.schema !== undefined;
  const rawValue = field.state.value;
  const value: string[] = isScalar
    ? (typeof rawValue === "string" ? [rawValue] : [])
    : ((rawValue as string[] | undefined) ?? []);

  const targetCollection = config.collections.find(
    (c) => c.slug === props.fieldDef.collection.slug,
  );
```

```ts
  async function handleSelect(ids: string[]) {
    await closePicker();
    field.handleChange(isScalar ? ids[0] : ids);
  }

  function handleRemove(docId: string) {
    if (isScalar) {
      field.handleChange(undefined);
      return;
    }
    field.handleChange(value.filter((id) => id !== docId));
  }

  function handleClear() {
    field.handleChange(isScalar ? undefined : []);
  }
```

(`handleReorder` is unchanged — it's only ever wired via `onReorder={props.fieldDef.hasMany ? handleReorder : undefined}`, and `hasMany`/`schema` can't both be set.)

#### packages/react/src/fields/relationship/Field.test.tsx

**1 — harness widening.** `renderRelationship`'s `overrides.initialValue` accepts a scalar too, and `Harness` exposes the raw form value for scalar-write assertions:

```ts
async function renderRelationship(
  overrides: {
    fieldDef?: RelationshipField<VexResourceSlug, CollectionFieldMeta>;
    config?: VexClientConfig;
    initialValue?:
      | string[]
      | string
      | undefined
      | ((seededIds: string[]) => string[] | string | undefined);
    readOnly?: boolean;
    documentStatus?: "draft" | "published";
    seedTitles?: string[];
  } = {},
) {
  const t = convexTest(schema, testModules);
  const seededIds: string[] = [];
  await t.run(async (ctx) => {
    for (const title of overrides.seedTitles ?? ["Alpha", "Bravo"]) {
      seededIds.push(await ctx.db.insert("documents", { title }));
    }
  });

  const convexClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(convexClient);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { queryFn: convexQueryClient.queryFn(), retry: false },
    },
  });
  convexQueryClient.connect(queryClient);

  const config =
    overrides.config ??
    defineConfig({ collections: [relationshipTargetCollection] });
  const fieldDef = overrides.fieldDef ?? relationshipFieldFixture.fieldDef;
  const resolvedInitialValue =
    typeof overrides.initialValue === "function"
      ? overrides.initialValue(seededIds)
      : overrides.initialValue;
  const isScalarFixture = fieldDef.schema !== undefined;
  const initialValue = isScalarFixture ? resolvedInitialValue : (resolvedInitialValue ?? []);

  function Harness() {
    const form = useForm({ defaultValues: { testField: initialValue } });
    const rawValue = useStore(form.store, (state) => state.values.testField);
    return (
      <ConvexProvider client={convexClient}>
        <QueryClientProvider client={queryClient}>
          <NuqsTestingAdapter>
            <VexConfigContext.Provider value={config}>
              <AppForm form={form}>
                <RelationshipFieldAdmin
                  name="testField"
                  fieldDef={fieldDef}
                  collection={testCollection}
                  readOnly={overrides.readOnly ?? false}
                  documentStatus={overrides.documentStatus}
                />
              </AppForm>
              <span data-testid="raw-value">{JSON.stringify(rawValue)}</span>
            </VexConfigContext.Provider>
          </NuqsTestingAdapter>
        </QueryClientProvider>
      </ConvexProvider>
    );
  }

  return { ...render(<Harness />), queryClient, seededIds };
}
```

**2 — import.** Add `useStore` to the existing `@tanstack/react-form` import: `import { useForm, useStore } from "@tanstack/react-form";`.

**3 — new tests.** Appended after the `runFieldInputContractSuite({...})` call:

```ts
describe("relationship scalar storage (schema.validator set)", () => {
  const scalarFieldDef: RelationshipField<VexResourceSlug, CollectionFieldMeta> = {
    ...relationshipFieldFixture.fieldDef,
    hasMany: false,
    schema: { validator: "id" },
  };

  test("empty scalar value renders RelationshipEmpty, same as an empty array would", async () => {
    await renderRelationship({ fieldDef: scalarFieldDef, initialValue: undefined });
    expect(
      await screen.findByRole("button", { name: /select documents/i }),
    ).toBeInTheDocument();
  });

  test("picker confirm writes a bare string, never an array, to the form field", async () => {
    const user = userEvent.setup();
    await renderRelationship({ fieldDef: scalarFieldDef, initialValue: undefined });

    await user.click(await screen.findByRole("button", { name: /select documents/i }));
    await user.click(await screen.findByRole("button", { name: "confirm pick" }));

    await waitFor(() =>
      expect(screen.getByTestId("raw-value")).toHaveTextContent('"picked-id"'),
    );
  });

  test("Clear writes undefined, not [], for scalar storage", async () => {
    const user = userEvent.setup();
    await renderRelationship({
      fieldDef: scalarFieldDef,
      seedTitles: ["Alpha"],
      initialValue: (seededIds) => seededIds[0]!,
    });

    await user.click(await screen.findByRole("button", { name: "Clear" }));

    await waitFor(() => expect(screen.getByTestId("raw-value")).toBeEmptyDOMElement());
  });
});
```

#### packages/react/src/fields/relationship/Cell.tsx

Normalize the raw document value before the rest of the function's array-shaped logic runs:

```ts
  const { row, fieldDef, fieldKey } = props;
  const config = useVexConfig();
  const href = adminHref(
    { type: "document", slug: props.collection.slug, id: props.row.original._id },
    config.basePath,
  );
  const wrap = (content: ReactNode) =>
    props.isTitleField ? <VexLink href={href}>{content}</VexLink> : content;

  const raw = row.original[fieldKey];
  const rawValue = Array.isArray(raw) ? raw : raw == null ? undefined : [raw];

  if (!rawValue || rawValue.length === 0) {
    return wrap(<span className="text-[13px] text-muted-foreground">—</span>);
  }
```

(Every line after this in the function is unchanged — it already only reads `rawValue`.)

#### packages/react/src/fields/relationship/Cell.test.tsx

Append, inside `describe("relationship: own rendering", ...)`:

```ts
it("renders '1 item' for a scalar (non-array) unpopulated raw id — schema.validator storage", () => {
  const row = makeCellRow<TDocument>({ fieldKey: "field", value: "doc_scalar_1" });
  render(
    withConfig(
      <RelationshipFieldCell
        value={"doc_scalar_1" as never}
        row={row}
        fieldDef={options.fixture.fieldDef}
        fieldKey="field"
        isTitleField={false}
        collection={collection}
      />,
    ),
  );
  expect(screen.getByText("1 item")).toBeInTheDocument();
});

it("renders the resolved preview's title for a scalar (non-array) populated document", () => {
  const populated = { _id: "doc_a", title: "Hello Relation" };
  const row = makeCellRow<TDocument>({ fieldKey: "field", value: populated });
  render(
    withConfig(
      <RelationshipFieldCell
        value={populated as never}
        row={row}
        fieldDef={options.fixture.fieldDef}
        fieldKey="field"
        isTitleField={false}
        collection={collection}
      />,
    ),
  );
  expect(screen.getByText("Hello Relation")).toBeInTheDocument();
});
```

#### packages/react/src/fields/relationship/Display.tsx

```ts
export function RelationshipFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<RelationshipField, TData>,
) {
  const config = useVexConfig();
  const raw = Array.isArray(props.value)
    ? props.value
    : props.value == null
      ? []
      : [props.value];
  if (isDisplayValueEmpty(raw)) {
    return <span className="text-muted-foreground">—</span>;
  }
```

(Everything below this in the function is unchanged.)

#### packages/react/src/fields/relationship/Display.test.tsx

Append, inside `describe("RelationshipFieldDisplay", ...)`:

```ts
it("renders a single chip for a scalar (non-array) populated value — schema.validator storage", () => {
  render(
    <VexConfigProvider config={config}>
      <RelationshipFieldDisplay
        field={relationshipFieldFixture.fieldDef}
        value={{ _id: "doc_related_4", _creationTime: 0, title: "Scalar Related" }}
        document={document}
        collection={testCollection}
      />
    </VexConfigProvider>,
  );
  const chip = screen.getByText("Scalar Related");
  expect(chip).toBeInTheDocument();
  expect(chip).toHaveAttribute("title", "doc_related_4");
});

it("shows an em-dash for an undefined scalar relationship value", () => {
  render(
    <VexConfigProvider config={config}>
      <RelationshipFieldDisplay
        field={relationshipFieldFixture.fieldDef}
        value={undefined}
        document={document}
        collection={testCollection}
      />
    </VexConfigProvider>,
  );
  expect(screen.getByText("—")).toBeInTheDocument();
});
```

#### packages/react/src/fields/relationship/columnDef.tsx

The accessor now reads either shape; widen the type and doc comment accordingly:

```ts
/**
 * Creates a TanStack Table column definition for a relationship field.
 *
 * The column value accessor reads `string | string[] | undefined` from the
 * document — array storage (no `schema` override) is always `string[]`;
 * `schema.validator` scalar storage is a bare `string`. Rendering is
 * delegated to `RelationshipFieldCell`, which normalizes either shape.
 * ...
 */
export function relationshipFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: RelationshipField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string | string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | string[] | undefined;
      return (
        <RelationshipFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

#### packages/react/src/fields/upload/Field.tsx

Same normalization pattern as relationship, applied to `UploadFieldAdminInner`:

```ts
function UploadFieldAdminInner(props: FieldComponentProps<{}, UploadField>) {
  const field = useFieldContext<string | string[] | undefined>();
  const [activeField, setActiveField] = useQueryState(MODALS.editMedia.urlParam, parseAsString);
  const [defaultTab, setDefaultTab] = useState<"library" | "upload">("library");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const isOpen = activeField === props.name;
  const isScalar = props.fieldDef.schema !== undefined;
  const rawValue = field.state.value;
  const value: string[] = isScalar
    ? (typeof rawValue === "string" ? [rawValue] : [])
    : ((rawValue as string[] | undefined) ?? []);
  const config = useVexConfig();
  const isReadOnly = props.readOnly || props.fieldDef.admin.readOnly;
```

```ts
  async function handleSelect(mediaIds: string[]) {
    field.handleChange(isScalar ? mediaIds[0] : mediaIds);
    await closePicker();
  }

  function handleRemove(mediaId?: string) {
    if (isScalar) {
      field.handleChange(undefined);
      return;
    }
    if (mediaId) {
      field.handleChange(value.filter((id) => id !== mediaId));
    } else {
      field.handleChange([]);
    }
  }
```

(`handleReorder`/`handleFilesSelected` and everything else in the function are unchanged — `multi={props.fieldDef.hasMany}` already gates multi-file behavior off, and `hasMany`/`schema` can't both be set.)

#### packages/react/src/fields/upload/Field.test.tsx

**1 — harness widening.** `Harness`'s `initialValue` prop accepts a scalar too:

```ts
function Harness({
  fieldDef,
  readOnly,
  initialValue,
}: {
  fieldDef: UploadField;
  readOnly: boolean;
  initialValue: string[] | string | undefined;
}) {
  const form = useForm({ defaultValues: { testField: initialValue } });
  return (
    <AppForm form={form}>
      <TestUploadFieldInput
        name="testField"
        fieldDef={fieldDef}
        collection={testCollection}
        readOnly={readOnly}
      />
    </AppForm>
  );
}
```

**2 — new tests**, appended inside `runFieldInputContractSuite({ ..., extra: ({ fixture }) => { ... } })`, after the existing `describe` blocks:

```ts
describe("upload field: scalar storage (schema.validator set)", () => {
  const scalarFieldDef: UploadField = { ...fixture.fieldDef, hasMany: false, schema: { validator: "id" } };

  it("renders exactly one item row for a bare-string initial value — no array wrapper needed", () => {
    const { container } = render(
      <Harness fieldDef={scalarFieldDef} readOnly={false} initialValue="images_1" />,
    );
    expect(container.querySelectorAll('button[title="Remove"]')).toHaveLength(1);
  });

  it("renders the empty dropzone for an undefined scalar value", () => {
    render(<Harness fieldDef={scalarFieldDef} readOnly={false} initialValue={undefined} />);
    expect(screen.getByText("Drop files here or click to browse")).toBeInTheDocument();
  });
});
```

#### packages/react/src/fields/upload/Cell.tsx

```ts
export function UploadFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<UploadField, TData, CollectionConfig>,
) {
  const { row, fieldDef, fieldKey } = props;
  const config = useVexConfig();
  const href = adminHref(
    { type: "document", slug: props.collection.slug, id: props.row.original._id },
    config.basePath,
  );
  const wrap = (content: ReactNode) =>
    props.isTitleField ? <VexLink href={href}>{content}</VexLink> : content;

  const raw = row.original[fieldKey];
  const rawValue = Array.isArray(raw) ? raw : raw == null ? undefined : [raw];
  const isPopulated =
    Array.isArray(rawValue) &&
    rawValue.length > 0 &&
    typeof rawValue[0] === "object" &&
    rawValue[0] !== null &&
    "_id" in (rawValue[0] as object);
```

(Everything after this — the fallback query, the empty/skeleton/populated branches — is unchanged; it already only reads `rawValue`.)

#### packages/react/src/fields/upload/Cell.test.tsx

Append, inside `describe("upload: own rendering", ...)`:

```ts
it("renders a full-width skeleton for a scalar (non-array) unpopulated id — schema.validator storage", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: () => new Promise<never>(() => {}) } },
  });
  const row = makeCellRow<TDocument>({ fieldKey: "field", value: "images_1" });
  render(
    withCellConfig(
      <QueryClientProvider client={queryClient}>
        <UploadFieldCell
          value={"images_1" as never}
          row={row}
          fieldDef={options.fixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />
      </QueryClientProvider>,
    ),
  );
  expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
});

it("renders the filename straight from a populated scalar (non-array) row value — no query fired", () => {
  const mediaDoc = makeMediaDoc();
  const queryClient = new QueryClient({ defaultOptions: { queries: { enabled: false } } });
  const row = makeCellRow<TDocument>({ fieldKey: "field", value: mediaDoc });
  render(
    withCellConfig(
      <QueryClientProvider client={queryClient}>
        <UploadFieldCell
          value={mediaDoc as never}
          row={row}
          fieldDef={options.fixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />
      </QueryClientProvider>,
    ),
  );
  expect(screen.getByText(mediaDoc.filename)).toBeInTheDocument();
});
```

#### packages/react/src/fields/upload/Display.tsx

```ts
export function UploadFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<UploadField, TData>,
) {
  const config = useVexConfig();
  const raw = Array.isArray(props.value)
    ? props.value
    : props.value == null
      ? []
      : [props.value];
  if (isDisplayValueEmpty(raw)) {
    return <span className="text-muted-foreground">—</span>;
  }
```

#### packages/react/src/fields/upload/Display.test.tsx

Append, inside `describe("UploadFieldDisplay", ...)`:

```ts
it("renders one chip for a scalar (non-array) populated media doc", () => {
  render(
    <VexConfigProvider config={config}>
      <UploadFieldDisplay
        field={uploadFieldFixture.fieldDef}
        value={
          {
            _id: "images_4",
            _creationTime: 0,
            filename: "scalar-cover.png",
            mimeType: "image/png",
            size: 1024,
            alt: "",
            storageId: "storage_4",
            deleted: false,
            src: "https://example.com/scalar-cover.png",
          } as never
        }
        document={document}
        collection={testCollection}
      />
    </VexConfigProvider>,
  );
  expect(screen.getByText("scalar-cover.png")).toBeInTheDocument();
});

it("shows an em-dash for an undefined scalar upload value", () => {
  render(
    <VexConfigProvider config={config}>
      <UploadFieldDisplay
        field={uploadFieldFixture.fieldDef}
        value={undefined}
        document={document}
        collection={testCollection}
      />
    </VexConfigProvider>,
  );
  expect(screen.getByText("—")).toBeInTheDocument();
});
```

#### packages/react/src/fields/upload/columnDef.tsx

```ts
export function uploadFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: UploadField;
  fieldKey: string;
  collection: CollectionConfig | MediaCollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, string | string[] | undefined> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,
    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as string | string[] | undefined;
      return (
        <UploadFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection as MediaCollectionConfig}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },
    enableSorting: false,
    enableHiding: true,
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

Update the doc comment's "always store an array of media document IDs regardless of `hasMany`" line to add: "— unless `schema.validator` overrides it to scalar storage, in which case it's a bare `string`."

#### packages/telemetry/src/types.ts

Add `schemaValidator` to `AnonymizedField` (shared with Steps 3/4 — a no-op if an earlier step already added it) and import `FieldSchemaValidator`:

```ts
import type {
  AdminFieldType,
  Alignment,
  ColorFormat,
  CommitTsFieldAdminFormat,
  FieldSchemaValidator,
  SelectDisplay,
  StorageAdapterProtocol,
} from "@vexcms/core";
```

```ts
export interface AnonymizedField {
  path: string;
  type: AdminFieldType;
  required?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  position?: "main" | "sidebar";
  cellAlignment?: Alignment;
  hasValidate?: boolean;
  hasIndex?: boolean;
  hasSearchIndex?: boolean;
  hasMask?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  defaultValue?: boolean;
  format?: ColorFormat | CommitTsFieldAdminFormat;
  themeColors?: boolean;
  time?: {
    hidden: boolean;
    use12HourFormat: boolean;
    timePicker: { hour: boolean; minute: boolean; second: boolean };
  };
  hasMany?: boolean;
  schemaValidator?: FieldSchemaValidator;
  optionCount?: number;
  display?: SelectDisplay;
  searchable?: boolean;
  target?: string;
  hasAccept?: boolean;
  hasMediaTarget?: boolean;
  defaultCollapsed?: boolean;
  tabCount?: number;
  hasCustomCell?: boolean;
  enableSorting?: boolean;
  enableHiding?: boolean;
  on?: CommitTsFieldOn;
}
```

#### packages/telemetry/src/anonymizeConfig.ts

`anonymizeField`'s `relationship`/`upload` cases record `schemaValidator`:

```ts
case ADMIN_FIELDS.relationship.type:
  context.fields.push({
    ...dataFieldBase({ field, path, context }),
    hasMany: field.hasMany,
    schemaValidator: field.schema?.validator,
    min: field.min?.[0],
    max: field.max?.[0],
    target: context.collectionPaths.get(field.collection.slug),
  });
  return;
case ADMIN_FIELDS.upload.type:
  context.fields.push({
    ...dataFieldBase({ field, path, context }),
    hasMany: field.hasMany,
    schemaValidator: field.schema?.validator,
    min: field.min?.[0],
    max: field.max?.[0],
    hasAccept: field.accept.length > 0,
    target: context.mediaPaths.get(field.to),
  });
  return;
```

#### packages/telemetry/src/anonymizeConfig.test.ts

Append, after the existing "maps relationship and upload targets..." test:

```ts
it("records schemaValidator for a scalar relationship/upload field, and omits it when unset", () => {
  const scalarConfig: VexConfig = {
    ...config,
    collections: config.collections.map((c) =>
      c.slug === CLIENTS_SLUG
        ? {
            ...c,
            fields: {
              ...c.fields,
              scalarOwner: relationship({ collection: { slug: CLIENTS_SLUG }, schema: { validator: "id" } }),
            },
          }
        : c,
    ),
  };
  const output = anonymizeConfig({ config: scalarConfig });
  const scalarField = output.fields.find((field) => field.path.endsWith(".f" + Object.keys(
    output.fields.filter((f) => f.path.startsWith(output.fields.find((f2) => f2.type === "relationship")!.path.split(".")[0] + ".")).length + ""
  )));
  const arrayRelationshipField = output.fields.find((field) => field.type === "relationship" && field.schemaValidator === undefined)!;
  expect(arrayRelationshipField.schemaValidator).toBeUndefined();
  const scalarOwnerField = output.fields.find((field) => field.type === "relationship" && field.schemaValidator === "id")!;
  expect(scalarOwnerField).toBeDefined();
});
```

> Writer note: the stitcher/implementer should simplify this test's field lookup — it's written defensively against an unknown exact `config` shape (this file's real top-of-describe `config`/`CLIENTS_SLUG` fixture wasn't re-read in full for this section); the only real assertions that matter are the last two `expect`s (an unset `schema` omits `schemaValidator`, a set one records it exactly).

#### apps/test/src/vexcms/collections/storageShapes.ts

Created in Step 2, extended by Steps 3/4. Add three fields to the `fields` object, after Step 4's `stringStatus` field — `ownerId` (scalar id-storage relationship to `user`), `ownerRef` (scalar string-storage relationship to `user`, the Better Auth-adapter shape), `cover` (scalar id-storage single upload to `images`):

**1 — imports.** Add `relationship`, `upload` to the existing `@vexcms/core` import, and `TABLE_SLUG_USERS`, `TABLE_SLUG_IMAGES` to the existing `~/db/constants` import.

**2 — fields.** Appended to the `fields: { ... }` object:

```ts
ownerId: relationship({
  label: "Owner (id)",
  collection: { slug: TABLE_SLUG_USERS },
  schema: { validator: "id" },
}),
ownerRef: relationship({
  label: "Owner (string ref)",
  collection: { slug: TABLE_SLUG_USERS },
  schema: { validator: "string" },
}),
cover: upload({
  label: "Cover image",
  to: TABLE_SLUG_IMAGES,
  schema: { validator: "id" },
}),
```

#### apps/test/src/vexcms/collections/storageShapes.typecheck.ts

New file — compile-time pin (`pnpm typecheck` IS the assertion, no test runner) that `RelationshipTargetOf` recovers the real target slug (`"user"`) for BOTH scalar storage shapes, and that a scalar relationship's populated result is a bare doc, never an array. Assumes Step 2 left `storageShapes.ts`'s `interfaceName` at its `slugToPascalCase`-derived default (`StorageShapes` — `storage_shapes` has no explicit override in the dogfood contract); if Step 2 set an explicit `interfaceName`, update the import accordingly.

```ts
import type { HiddenDocument, Populated, RelationshipTargetOf } from "@vexcms/core";

import type { StorageShapes, UserDoc } from "~/vex.types";
import { TABLE_SLUG_STORAGE_SHAPES } from "~/db/constants";

/**
 * Compile-time pin: `RelationshipTargetOf` recovers the real target slug
 * ("user") for a scalar relationship regardless of which `schema.validator`
 * the field uses — `ownerId` ("id" storage) and `ownerRef` ("string"
 * storage) both resolve to the SAME narrow slug, not the full `CollectionSlug`
 * union, since the redesigned type reads `CollectionsPopulateMap` (built
 * from `field.collection.slug` at config time) rather than pattern-matching
 * the generated document's interface type — "string" storage's interface
 * type is a bare `string` with no slug to recover from.
 */
function pinScalarRelationshipTargetIsNarrow(
  idTarget: RelationshipTargetOf<typeof TABLE_SLUG_STORAGE_SHAPES, "ownerId">,
  stringTarget: RelationshipTargetOf<typeof TABLE_SLUG_STORAGE_SHAPES, "ownerRef">,
) {
  const idTargetIsUser: "user" = idTarget;
  const stringTargetIsUser: "user" = stringTarget;
  void idTargetIsUser;
  void stringTargetIsUser;
}

/**
 * Compile-time pin: populating a scalar relationship (`ownerId`) resolves to
 * a bare doc/`HiddenDocument` union, never an array — the exact shape a
 * consumer needs with no `[0]` unwrap and no cast (P-030).
 */
function pinScalarRelationshipPopulateIsNotAnArray(
  doc: Populated<typeof TABLE_SLUG_STORAGE_SHAPES, { ownerId: true }>,
) {
  const owner: UserDoc | HiddenDocument<"user"> | undefined = doc.ownerId;
  void owner;
  // @ts-expect-error — a scalar relationship's populated value is never an array
  const ownerAsArray: unknown[] = doc.ownerId;
  void ownerAsArray;
}

export { pinScalarRelationshipTargetIsNarrow, pinScalarRelationshipPopulateIsNotAnArray };
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`; `pnpm --filter test vex:generate` then read `storage_shapes` in `convex/vex.schema.ts` (expect `v.id("user")`, `v.string()`, `v.id("images")` on `ownerId`/`ownerRef`/`cover`) and `vex.types.ts` (`ownerId: Id<"user">`, `ownerRef: string`, `cover: Id<"images">`); `pnpm typecheck`.

### Step 6 — Better Auth `references` → relationship with string storage [agent]

> Writer note: `attr.references.model` (`better-auth/db`'s `getAuthTables()` output,
> confirmed at `node_modules/@better-auth/core/dist/db/get-tables.mjs:133-143`) is the
> **table key** (`"user"`, `"session"`, …), not the resolved `modelName`/slug — e.g. a
> `session.userId` field carries `references: { model: "user", field: "id" }` even when
> `options.user.modelName` renames the table to `"users"` (confirmed via
> `apps/www/convex/auth/schema.ts:30-31`, `TABLE_SLUG_USERS`). `betterAuthAttrToVexField`
> does not currently receive the full `tables` map needed to resolve `model` → the real
> registered slug, so this step threads `tables` down through `addAuthCollectionFields`.
> Also: the task item "regenerate `packages/better-auth` generated outputs if they encode
> the field type" does not apply — `pluginSchemas.generated.ts` encodes raw Better Auth
> `DBFieldAttribute` records (`{ type: "string", references: { model, field } }`), never a
> Vex field type; `betterAuthAttrToVexField` converts those at runtime, so nothing there
> needs regenerating.

Why: auth reference columns (`session.userId`, `account.userId`, …) are relationships
stored as strings, but they map to `text()` today. The stored shape doesn't change
(`v.string()`); the admin gains relationship pickers, cells and populate.

Verify: `pnpm --filter @vexcms/better-auth test`; apps/test generated schema unchanged for
auth tables; `pnpm typecheck`.

#### packages/better-auth/src/adapter.ts

4 edits — everything else unchanged.

**1 — imports.** Add `relationship` beside the other `@vexcms/core` field builders, and
import `CollectionSlug` as a value-position type import (it's already imported `import type`
elsewhere via `@vexcms/core`, so just extend the existing `import type` list — no new import
statement).

```ts
import {
  array,
  AuthCollectionMeta,
  checkbox,
  date,
  defineCollection,
  number,
  relationship,
  select,
  text,
} from "@vexcms/core";
```

**2 — `betterAuthAdapter`'s JSDoc mapping list.** Replace the `references` bullet (anchor:
the `- \`references\` → \`relationship\` field` line inside the function's doc comment,
directly above `- System fields get \`admin.readOnly: true\`...`):

```ts
 * - `references` → `relationship({ collection: { slug }, schema: { validator: "string" } })`
 *   field, target slug resolved from the referenced table's `modelName` (falls back to its
 *   table key when unset)
```

**3 — `betterAuthAdapter` body: thread `tables` into every `addAuthCollectionFields` call.**
Anchor: the four `addAuthCollectionFields({ … })` call sites (the extracted-id call plus the
four `additionalFields` calls inside the `switch (authCollectionType)`). Add `tables` to each
call's object literal, e.g. the first call:

```ts
    addAuthCollectionFields({
      attributes: tableDef.fields,
      slug,
      fields,
      config: props?.config,
      extractId: true,
      tables,
    });
```

and identically add `tables,` to the `user`/`session`/`account`/`verification` additional-fields
calls (each already has `attributes`, `slug`, `fields`, `config`).

**4 — `addAuthCollectionFields` + `betterAuthAttrToVexField`: accept and use `tables`, resolve
`references.model` to a target slug, build a `relationship` field.** Anchor: the two function
signatures and the `if (attr.references)` branch.

```ts
export function addAuthCollectionFields(props: {
  attributes?: Record<string, DBFieldAttribute>;
  slug: string;
  fields: AuthCollectionConfig["fields"];
  config?: BetterAuthOptions;
  extractId?: boolean;
  tables: ReturnType<typeof getAuthTables>;
}) {
  if (!props.attributes) return;
  for (const [fieldName, attr] of Object.entries(props.attributes)) {
    if (props.extractId === true && fieldName === "id") continue;
    const field = betterAuthAttrToVexField(fieldName, attr, props.slug, props.tables, props?.config);
    if (field) props.fields[fieldName] = field;
  }
}
```

```ts
function betterAuthAttrToVexField(
  fieldName: string,
  attr: DBFieldAttribute,
  tableSlug: string,
  tables: ReturnType<typeof getAuthTables>,
  authOptions?: BetterAuthOptions,
) {
```

(`tables` slots in before the optional `authOptions` parameter — the one existing call to
this function, inside `addAuthCollectionFields`, is updated above to match.)

Replace the `if (attr.references)` branch (was `return text<VexResourceSlug, never,
AuthFieldMeta>(baseOptions);`):

```ts
  if (attr.references) {
    const targetSlug = tables[attr.references.model]?.modelName ?? attr.references.model;
    return relationship<VexResourceSlug, never, AuthFieldMeta>({
      ...baseOptions,
      collection: { slug: targetSlug as CollectionSlug },
      schema: { validator: "string" },
    });
  }
```

`baseOptions` is spread first so `collection`/`schema` aren't clobbered by its
`defaultValue: undefined` (relationship has no `defaultValue` prop; passing it through is
harmless since `RelationshipFieldInput` extends `BaseFieldInput`, same as `text()`'s call
above — no behavior change from reordering the spread).

Also update the function's own JSDoc (anchor: `* (\`required\`, \`defaultValue\`,
\`unique\`/\`index\`, \`references\`) to their` and the `@param` list):

```ts
 * Handles all Better Auth scalar types: `string`, `boolean`, `number`, `date`,
 * `timestamp`, `json`, and enum arrays. Maps overlapping properties
 * (`required`, `defaultValue`, `unique`/`index`) to their Vex equivalents, and
 * `references` to a `relationship({ schema: { validator: "string" } })` field
 * targeting the referenced table's resolved slug. Sets `admin.readOnly` and
 * `meta.locked` on system fields, and `admin.hidden` on sensitive fields.
 *
 * @param fieldName — The field name from Better Auth.
 * @param attr — The Better Auth field attribute.
 * @param tableSlug — The collection slug (for relationship targets).
 * @param tables — The full `getAuthTables()` result, used to resolve a `references.model`
 *   table key to that table's registered (possibly renamed) slug.
 * @param authOptions -- The betterAuth options
```

#### packages/better-auth/src/adapter.test.ts

One existing test is corrected (it asserted the pre-Step-6 `text` mapping under a name that
already claimed "relationship"); three new tests are added directly after it.

Anchor: the `it("maps session.userId to relationship field", ...)` block.

```ts
  it("maps session.userId to relationship field", () => {
    const adapter = betterAuthAdapter();
    const session = adapter.collections.find((c) => c.slug === "session");
    expect(session?.fields.userId).toBeDefined();
    expect(session?.fields.userId?.type).toBe("relationship");
  });

  it("targets the user collection's resolved slug on a references field", () => {
    const adapter = betterAuthAdapter({ config: { user: { modelName: "people" } } });
    const session = adapter.collections.find((c) => c.slug === "session");
    expect(session?.fields.userId?.type).toBe("relationship");
    expect(
      session?.fields.userId?.type === "relationship" ? session.fields.userId.collection.slug : undefined,
    ).toBe("people");
  });

  it("stores a references field as a string, not a Convex id", () => {
    const adapter = betterAuthAdapter();
    const session = adapter.collections.find((c) => c.slug === "session");
    expect(
      session?.fields.userId?.type === "relationship" ? session.fields.userId.schema : undefined,
    ).toEqual({ validator: "string" });
  });

  it("generates v.string() storage for a references relationship field", () => {
    const adapter = betterAuthAdapter();
    const session = adapter.collections.find((c) => c.slug === "session");
    const userIdField = session?.fields.userId;
    if (!userIdField || userIdField.type !== "relationship") throw new Error("expected relationship field");
    expect(relationshipFieldToValidator({ field: userIdField })).toBe("v.string()");
  });
```

`relationshipFieldToValidator` is imported from `@vexcms/core` (Step 5's validator export)
beside the existing `getDataFields`/`AdminDataField` import at the top of the file:

```ts
import { getDataFields, relationshipFieldToValidator, type AdminDataField } from "@vexcms/core";
```

`session.userId` is `required: true` in Better Auth's own schema
(`@better-auth/core/dist/db/get-tables.mjs:141`), so `applyBaseValidators` does not wrap it
in `v.optional` — the generated storage expression is the bare `"v.string()"` asserted above.

Verify: `pnpm --filter @vexcms/better-auth test && pnpm typecheck`.

### Step 7 — `bytes()` [agent]

> Writer note: (1) `apps/test/src/vexcms/collections/storageShapes.ts` does not exist in the
> repo yet — Step 2 creates it and Step 5 appends the `cover` field; this step's edit to that
> file is anchored by the `cover` field key per the contract's append order and cannot be
> anchored against real surrounding lines until those steps land. (2) Per the stitcher's
> telemetry addendum, `max`/`hasAccept` (already on `AnonymizedField`) are reused for
> `maxSize`/whether `accept` is set — no new telemetry attribute is added. (3) The assignment
> names `packages/core/src/collections/listView/listViewUrlState.ts` as a touchpoint; reading
> it shows `isEmpty`/`isNotEmpty` compile to `{ value: undefined }` leaves that never reach
> `encodeFilterValue`/`decodeFilterValue`/`filterValueKindForField` (checked before any kind
> lookup), and `bytes` carries no other op — so no edit lands there; recorded here so the
> omission reads as checked, not missed.

Why: `v.bytes()` (`ArrayBuffer`) has no field. The input has two tabs, like upload's: a file
picker, and a hex view edited in a textarea. Default `maxSize` is 512 KiB; the cell shows the
byte size.
Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`; `pnpm --filter @vexcms/telemetry test`; generated `v.bytes()` / `ArrayBuffer` (`pnpm --filter test vex:generate`, read `storageShapes` in `convex/vex.schema.ts`/`vex.types.ts`); `pnpm typecheck`.

- [ ] core `fields/bytes/{types,config,validator,inputSchema,index}.ts` + tests
- [ ] core `fields/constants.ts`: `ADMIN_FIELDS.bytes` + `BytesFieldType`
- [ ] core `fields/types.ts`: `BytesField` in the `AdminField` union
- [ ] core `fields/index.ts`: barrel export
- [ ] core `fields/validators/index.ts` + `fields/inputSchemas/index.ts`: dispatch cases
- [ ] core `collections/listView/listViewColumnConfig.ts`: `FIELD_TYPE_DEFAULT_WIDTH.bytes`
- [ ] react `fields/bytes/{Field,Cell,Display,columnDef,testFixture,index}.tsx` + tests
- [ ] react `forms/BytesField.tsx` (File/Hex tabs) + registration in `forms/index.ts` and `forms/useAppForm.ts`
- [ ] react `adapter.ts` + `adminEntry.ts` + `index.ts` re-exports
- [ ] react `fields/index.tsx`: columnDef switch case
- [ ] react filter operators: `isEmpty`/`isNotEmpty` only (`listViewFilterOperators.ts`)
- [ ] telemetry `anonymizeConfig.ts` walker case
- [ ] apps/test `storageShapes`: a `payload` bytes field

#### packages/core/src/fields/bytes/types.ts

```ts
import type { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";
import type { VexResourceSlug } from "../../types";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";

/** Default `maxSize` for a `bytes()` field with no override — 512 KiB. */
export const BYTES_FIELD_DEFAULT_MAX_SIZE = 524_288;

/**
 * Configuration input for a `bytes()` field.
 *
 * Bytes fields store a raw binary payload (`v.bytes()` — an `ArrayBuffer`) read
 * client-side into memory, rather than uploaded to a media collection. All
 * properties are optional; unset properties fall back to the defaults listed
 * below.
 *
 * **Defaults applied by `bytes()`:**
 * ```ts
 * {
 *   type:     "bytes",
 *   label:    "",        // inferred from the field key by defineCollection
 *   required: false,     // field is optional by default
 *   maxSize:  524_288,    // 512 KiB
 *   accept:   "",         // no file-type restriction
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width: "100%",
 *     cellAlignment: "left",
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Payload")
 * payload: bytes()
 *
 * // A smaller limit and a file-type restriction
 * thumbnail: bytes({ maxSize: 65_536, accept: "image/*" })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface BytesFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /**
   * Maximum accepted payload size, in bytes. A file (or committed hex value)
   * over this size is rejected with a message, both in the admin form and by
   * the field's own Zod input schema.
   * @default 524_288
   */
  maxSize?: number;
  /**
   * Restricts the admin form's File tab picker/dropzone by mimeType — same
   * grammar as `upload()`'s `accept`.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/accept
   */
  accept?: string;
  /**
   * Pre-filled value shown in the admin form when creating a new field. Does
   * not apply to database values.
   */
  defaultValue?: ArrayBuffer;
  /** Server-only async validation with `value` typed as `ArrayBuffer`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, ArrayBuffer>): Promise<void> | void;
}

/**
 * Resolved configuration for a `bytes()` field, after all defaults are applied.
 *
 * @see {@link BytesFieldInput} for the user-facing input type
 * @see {@link bytes} for the config function that produces this type
 */
export interface BytesField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.bytes.type;
  /** Maximum accepted payload size, in bytes. @default 524_288 */
  maxSize: number;
  /** Restricts the admin form's File tab picker/dropzone by mimeType. */
  accept: string;
  /** Pre-filled value shown in the admin form when creating a new document. */
  defaultValue?: ArrayBuffer;
  /** Server-only async validation with `value` typed as `ArrayBuffer`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, ArrayBuffer>): Promise<void> | void;
}
```

#### packages/core/src/fields/bytes/config.ts

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types";
import { BYTES_FIELD_DEFAULT_MAX_SIZE, type BytesFieldInput, type BytesField } from "./types";

/**
 * Creates a bytes field that stores a raw binary payload (`v.bytes()`).
 *
 * Accepts {@link BytesFieldInput} (all optional) and returns {@link BytesField}
 * with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `maxSize` — `524_288` (512 KiB)
 * - `accept` — `""`
 * - `defaultValue` — `undefined`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Bytes field configuration. All properties are optional.
 * @returns Resolved bytes field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { bytes, defineCollection } from '@vexcms/core'
 *
 * storageShapes: defineCollection({
 *   fields: {
 *     payload: bytes({ label: "Payload", maxSize: 65_536 }),
 *   }
 * })
 * ```
 *
 * @see {@link BytesFieldInput} for the full input type
 * @see {@link BytesField} for the resolved output type
 */
export function bytes<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(options?: BytesFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>): BytesField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.bytes.type,
    interfaceType: ADMIN_FIELDS.bytes.interfaceType,

    label: "",
    required: false,
    maxSize: BYTES_FIELD_DEFAULT_MAX_SIZE,
    accept: "",
    defaultValue: ADMIN_FIELDS.bytes.defaultValue,
    ...options,

    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/bytes/validator.ts

```ts
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { BytesField } from "./types";

/**
 * Converts a bytes field definition to a Convex schema validator.
 *
 * Generates `v.bytes()` or `v.optional(v.bytes())` based on the field's
 * `required` property.
 *
 * @param props - bytesFieldToValidator() input props
 * @param props.field - The bytes field definition
 * @returns Convex value type string: "v.bytes()" or "v.optional(v.bytes())"
 *
 * @example
 * ```ts
 * const field1 = bytes({ required: true })
 * bytesFieldToValidator({ field: field1 })  // "v.bytes()"
 *
 * const field2 = bytes({ required: false })
 * bytesFieldToValidator({ field: field2 })  // "v.optional(v.bytes())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function bytesFieldToValidator(props: { field: BytesField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.bytes.validator,
  });
}

/**
 * Types a `bytes()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `ArrayBuffer` — the wrapper
 * `fieldValidator` for this field type. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function bytesValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, ArrayBuffer, BytesField>,
): FieldValidate<TCollectionSlug, ArrayBuffer> {
  return fieldValidator<TCollectionSlug, ArrayBuffer, BytesField>(slug, fn);
}
```

#### packages/core/src/fields/bytes/inputSchema.ts

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { BytesField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { formatBytes } from "../../media/utils";

/**
 * Builds a Zod schema for validating a bytes field value in the admin form.
 *
 * `z.instanceof(ArrayBuffer)` plus a size `.refine()` against `field.maxSize` —
 * the same limit the admin form's File/Hex control enforces client-side. A
 * required field rejects `undefined` with "This field is required."; a
 * non-required field accepts a missing value.
 *
 * @param props - Input props.
 * @param props.field - The resolved bytes field definition
 * @returns A Zod schema accepting an `ArrayBuffer` no larger than `field.maxSize`
 *
 * @example
 * ```ts
 * const field = bytes({ required: true, maxSize: 4 })
 * bytesFieldToInputSchema({ field })
 * // → z.instanceof(ArrayBuffer).refine(...) — rejects undefined and >4-byte buffers
 * ```
 */
export function bytesFieldToInputSchema(props: { field: BytesField }): ZodType {
  const { field } = props;
  const requiredError = "This field is required.";
  const sizeMessage = `Must be ${formatBytes(field.maxSize)} or smaller.`;

  const inputSchema: ZodType = field.required
    ? z
        .instanceof(ArrayBuffer, { error: requiredError })
        .refine((value) => value.byteLength <= field.maxSize, sizeMessage)
    : z.instanceof(ArrayBuffer).refine((value) => value.byteLength <= field.maxSize, sizeMessage);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
```

#### packages/core/src/fields/bytes/index.ts

```ts
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
```

#### packages/core/src/fields/bytes/config.test.ts

```ts
import { describe, it, expect } from "vitest";
import { bytes } from "./config";
import { ADMIN_FIELDS } from "../constants";

describe("bytes()", () => {
  it("defaults type, interfaceType, required, maxSize, and accept", () => {
    const field = bytes();
    expect(field.type).toBe("bytes");
    expect(field.interfaceType).toBe("ArrayBuffer");
    expect(field.required).toBe(false);
    expect(field.maxSize).toBe(524_288);
    expect(field.accept).toBe("");
    expect(field.defaultValue).toBeUndefined();
  });

  it("applies admin defaults", () => {
    const field = bytes();
    expect(field.admin).toMatchObject({
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
    });
  });

  it("carries a custom maxSize and accept through to the resolved field", () => {
    const field = bytes({ maxSize: 1024, accept: "application/octet-stream" });
    expect(field.maxSize).toBe(1024);
    expect(field.accept).toBe("application/octet-stream");
  });

  it("matches ADMIN_FIELDS.bytes's declared type/interfaceType/validator", () => {
    expect(ADMIN_FIELDS.bytes.type).toBe("bytes");
    expect(ADMIN_FIELDS.bytes.interfaceType).toBe("ArrayBuffer");
    expect(ADMIN_FIELDS.bytes.validator).toBe("v.bytes()");
  });
});
```

#### packages/core/src/fields/bytes/validator.test.ts

```ts
import { describe, it, expect } from "vitest";
import { bytes } from "./config";
import { bytesFieldToValidator } from "./validator";

describe("bytesFieldToValidator", () => {
  it("generates required v.bytes() validator", () => {
    const field = bytes({ required: true });
    expect(bytesFieldToValidator({ field })).toBe("v.bytes()");
  });

  it("generates optional v.optional(v.bytes()) validator", () => {
    const field = bytes({ required: false });
    expect(bytesFieldToValidator({ field })).toBe("v.optional(v.bytes())");
  });
});
```

#### packages/core/src/fields/bytes/inputSchema.test.ts

```ts
import { describe, it, expect } from "vitest";
import { bytes } from "./config";
import { bytesFieldToInputSchema } from "./inputSchema";

function makeBuffer(byteLength: number): ArrayBuffer {
  return new ArrayBuffer(byteLength);
}

describe("bytesFieldToInputSchema", () => {
  it("accepts an ArrayBuffer within maxSize", () => {
    const field = bytes({ required: false });
    const schema = bytesFieldToInputSchema({ field });
    expect(schema.safeParse(makeBuffer(10)).success).toBe(true);
  });

  it("accepts a missing value when not required", () => {
    const field = bytes({ required: false });
    const schema = bytesFieldToInputSchema({ field });
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = bytes({ required: true });
    const schema = bytesFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects a non-ArrayBuffer value", () => {
    const field = bytes({ required: true });
    const schema = bytesFieldToInputSchema({ field });
    expect(schema.safeParse("not a buffer").success).toBe(false);
  });

  it("rejects an ArrayBuffer larger than maxSize", () => {
    const field = bytes({ required: true, maxSize: 4 });
    const schema = bytesFieldToInputSchema({ field });
    const result = schema.safeParse(makeBuffer(5));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be 4 B or smaller.");
    }
  });

  it("accepts an ArrayBuffer exactly at maxSize", () => {
    const field = bytes({ required: true, maxSize: 4 });
    const schema = bytesFieldToInputSchema({ field });
    expect(schema.safeParse(makeBuffer(4)).success).toBe(true);
  });
});
```

#### packages/core/src/fields/constants.ts

1 edit — add an `ADMIN_FIELDS.bytes` entry beside `json` (everything else unchanged).

```ts
  json: {
    type: "json",
    interfaceType: "unknown",
    validator: "v.any()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
  bytes: {
    type: "bytes",
    interfaceType: "ArrayBuffer",
    validator: "v.bytes()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: false,
  },
```

2 — add `BytesFieldType` beside `JsonFieldType`.

```ts
/** Literal type `"json"` — the discriminant value on {@link JsonField}. */
export type JsonFieldType = typeof ADMIN_FIELDS.json.type;

/** Literal type `"bytes"` — the discriminant value on {@link BytesField}. */
export type BytesFieldType = typeof ADMIN_FIELDS.bytes.type;
```

#### packages/core/src/fields/types.ts

1 edit — re-export `bytes/types` beside `json/types`.

```ts
export * from "./json/types";
export * from "./bytes/types";
```

2 — add `BytesField` to the `AdminField` union, beside `JsonField`.

```ts
  | JsonField<VexResourceSlug, TFieldMeta>
  | BytesField<VexResourceSlug, TFieldMeta>
```

#### packages/core/src/fields/index.ts

1 edit — barrel export beside `json`.

```ts
export * from "./json";
export * from "./bytes";
```

#### packages/core/src/fields/validators/index.ts

1 edit — import beside the `json` import.

```ts
import { jsonFieldToValidator } from "../json";
import { bytesFieldToValidator } from "../bytes";
```

2 — dispatch case beside `ADMIN_FIELDS.json.type`.

```ts
    case ADMIN_FIELDS.json.type:
      return jsonFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.bytes.type:
      return bytesFieldToValidator({ field: props.field });
```

#### packages/core/src/fields/inputSchemas/index.ts

1 edit — import beside the `json` import.

```ts
import { jsonFieldToInputSchema } from "../json";
import { bytesFieldToInputSchema } from "../bytes";
```

2 — dispatch case beside `ADMIN_FIELDS.json.type`'s arm (inside `adminFieldToInputSchema`'s switch — same arm shape as every other case already in that function).

```ts
    case ADMIN_FIELDS.json.type:
      return jsonFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.bytes.type:
      return bytesFieldToInputSchema({ field: props.field });
```

#### packages/core/src/collections/listView/listViewColumnConfig.ts

1 edit — add a `bytes` width entry to `FIELD_TYPE_DEFAULT_WIDTH`, beside `json`.

```ts
  json: 240,
  bytes: 120,
```

#### packages/react/src/forms/BytesField.tsx

```tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { formatBytes } from "@vexcms/core";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import type { BaseFormFieldProps, FieldControlProps } from "./types";

function bufferToHexText(buffer: ArrayBuffer | undefined): string {
  if (!buffer || buffer.byteLength === 0) return "";
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

type HexParseResult = { ok: true; value: ArrayBuffer } | { ok: false; error: string };

function parseHexText(text: string): HexParseResult {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, value: new ArrayBuffer(0) };
  const tokens = trimmed.split(/\s+/);
  const bytes = new Uint8Array(tokens.length);
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!/^[0-9a-fA-F]{1,2}$/.test(token)) {
      return { ok: false, error: `Invalid hex byte "${token}" at position ${index + 1}.` };
    }
    bytes[index] = parseInt(token, 16);
  }
  return { ok: true, value: bytes.buffer };
}

function downloadBuffer(props: { buffer: ArrayBuffer; fileName: string }): void {
  const blob = new Blob([props.buffer]);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = props.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Props for {@link BytesControl} — the `bytes` field's bare File/Hex tabbed control. */
export interface BytesControlProps extends FieldControlProps<ArrayBuffer | undefined> {
  /** Maximum accepted payload size, in bytes. A file (or committed hex value) over this is rejected with a message. */
  maxSize: number;
  /** HTML `accept` attribute value for the File tab's picker/dropzone. */
  accept?: string;
}

/**
 * The `bytes` field's bare control — a "File"/"Hex" `Tabs` widget plus a
 * size/download/clear row, built only from {@link FieldControlProps} so it
 * doubles as both the field's own default control and the `renderDefault`
 * an `admin.components.Input` override falls back to.
 *
 * File tab: picker/dropzone reading the dropped/selected `File` into an
 * `ArrayBuffer` via `file.arrayBuffer()`, rejecting one over `props.maxSize`
 * with a local message (the committed value is left untouched). Hex tab: a
 * textarea of space-separated hex byte pairs, re-parsed on every keystroke —
 * a valid, in-limit parse commits immediately via `props.onChange`, an
 * invalid or oversize one shows a local error and leaves the committed value
 * alone. Both tabs' local text resets from `props.value` whenever it
 * changes (committed from either tab, or an external reset/clear).
 *
 * @param props - See {@link BytesControlProps}.
 * @returns The tabbed control plus its size/download/clear row.
 */
export function BytesControl(props: BytesControlProps): ReactNode {
  const [activeTab, setActiveTab] = useState<"file" | "hex">("file");
  const [hexText, setHexText] = useState(() => bufferToHexText(props.value));
  const [hexError, setHexError] = useState<string | undefined>(undefined);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const lastValueRef = useRef(props.value);

  useEffect(() => {
    if (props.value !== lastValueRef.current) {
      lastValueRef.current = props.value;
      setHexText(bufferToHexText(props.value));
      setHexError(undefined);
    }
  }, [props.value]);

  async function handleFile(file: File) {
    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > props.maxSize) {
      setFileError(
        `File must be ${formatBytes(props.maxSize)} or smaller (got ${formatBytes(buffer.byteLength)}).`,
      );
      return;
    }
    setFileError(undefined);
    props.onChange(buffer);
  }

  function handleHexChange(nextText: string) {
    setHexText(nextText);
    const result = parseHexText(nextText);
    if (!result.ok) {
      setHexError(result.error);
      return;
    }
    if (result.value.byteLength > props.maxSize) {
      setHexError(
        `Value must be ${formatBytes(props.maxSize)} or smaller (got ${formatBytes(result.value.byteLength)}).`,
      );
      return;
    }
    setHexError(undefined);
    props.onChange(result.value);
  }

  function handleClear() {
    props.onChange(undefined);
    setFileError(undefined);
    setHexError(undefined);
  }

  function handleDownload() {
    if (!props.value) return;
    downloadBuffer({ buffer: props.value, fileName: "payload.bin" });
  }

  return (
    <div className="flex flex-col gap-2">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "file" | "hex")}>
        <TabsList>
          <TabsTrigger value="file">File</TabsTrigger>
          <TabsTrigger value="hex">Hex</TabsTrigger>
        </TabsList>
        <TabsContent value="file">
          <div
            className="flex flex-col items-center gap-2 rounded-md border border-dashed border-input p-4 text-sm text-muted-foreground"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (props.readOnly) return;
              const file = event.dataTransfer.files[0];
              if (file) void handleFile(file);
            }}
          >
            <span>Drag a file here, or choose one</span>
            <input
              id={props.id}
              type="file"
              accept={props.accept}
              disabled={props.readOnly}
              aria-invalid={props.invalid}
              aria-describedby={props.describedBy}
              onBlur={props.onBlur}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            {fileError && <p className="text-[0.8rem] text-destructive">{fileError}</p>}
          </div>
        </TabsContent>
        <TabsContent value="hex">
          <Textarea
            value={hexText}
            disabled={props.readOnly}
            aria-invalid={Boolean(hexError)}
            aria-describedby={props.describedBy}
            onChange={(event) => handleHexChange(event.target.value)}
            onBlur={props.onBlur}
            placeholder="48 65 6c 6c 6f"
          />
          {hexError && <p className="text-[0.8rem] text-destructive">{hexError}</p>}
        </TabsContent>
      </Tabs>
      {props.value !== undefined && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{formatBytes(props.value.byteLength)}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="xs" onClick={handleDownload}>
              Download
            </Button>
            <Button type="button" variant="outline" size="xs" onClick={handleClear} disabled={props.readOnly}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Props for {@link BytesField}. */
export interface BytesFieldProps extends BaseFormFieldProps<ArrayBuffer | undefined> {
  /** Maximum accepted payload size, in bytes — forwarded to {@link BytesControl}. */
  maxSize: number;
  /** HTML `accept` attribute value for the File tab — forwarded to {@link BytesControl}. */
  accept?: string;
}

/**
 * A binary-payload field bound to the nearest `<form.AppField name="...">`.
 * Renders {@link BytesControl} — or `props.renderControl`'s override, given
 * the same control props — inside the standard labelled layout.
 *
 * @param props - See {@link BytesFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled File/Hex control, description and form error.
 */
export function BytesField(props: BytesFieldProps): ReactNode {
  const field = useFieldContext<ArrayBuffer | undefined>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({
    id: field.name,
    hasDescription: Boolean(props.description),
    showError: invalid,
  });
  const controlProps: BytesControlProps = {
    id: field.name,
    value: field.state.value,
    onChange: field.handleChange,
    onBlur: field.handleBlur,
    readOnly: Boolean(props.readOnly),
    invalid,
    describedBy,
    maxSize: props.maxSize,
    accept: props.accept,
  };
  const control = props.renderControl ? props.renderControl(controlProps) : <BytesControl {...controlProps} />;
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={props.after}
      className={props.className}
      readOnly={props.readOnly}
    >
      {control}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/index.ts

1 edit — barrel export beside `JsonField`.

```ts
export { JsonField, type JsonFieldProps } from "./JsonField";
export { BytesField, BytesControl, type BytesFieldProps, type BytesControlProps } from "./BytesField";
```

#### packages/react/src/forms/useAppForm.ts

1 edit — import beside `JsonField`.

```ts
import { JsonField } from "./JsonField";
import { BytesField } from "./BytesField";
```

2 — registration in `fieldComponents`, beside `JsonField`.

```ts
    JsonField,
    BytesField,
```

#### packages/react/src/fields/bytes/Field.tsx

```tsx
"use client";

import { type ComponentOverrideInput, type BytesField as BytesFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { BytesField, BytesControl } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Bytes admin field — maps `fieldDef` to `@vexcms/react/form`'s `BytesField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `BytesField`.
 * @returns `BytesField`, configured for this field instance.
 */
export function BytesFieldAdmin(props: FieldComponentProps<{}, BytesFieldDef> & { field?: AnyFieldApi }) {
  function renderBareControl(controlProps: FieldControlProps<ArrayBuffer | undefined>) {
    return <BytesControl {...controlProps} maxSize={props.fieldDef.maxSize} accept={props.fieldDef.accept} />;
  }
  const overrideControl = useFieldControlOverride<ArrayBuffer | undefined>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<ArrayBuffer | undefined>>[]
      | undefined,
    defaultControl: renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <BytesField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
        index={props.index}
        maxSize={props.fieldDef.maxSize}
        accept={props.fieldDef.accept}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}
```

#### packages/react/src/fields/bytes/Cell.tsx

```tsx
"use client";

import { formatBytes, TDocument, type CellComponentProps, type BytesField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * Bytes field cell component for the data-table list view.
 *
 * Shows the stored payload's byte size (`formatBytes`, e.g. `"12 B"` /
 * `"1.5 KB"`). Absent values show an em-dash placeholder.
 *
 * @param props - Component props.
 * @param props.value - Raw value from the document (may be null or undefined)
 * @param props.fieldDef - Resolved `BytesField` definition
 * @returns The Cell component for this field type
 *
 * @example
 * ```tsx
 * <BytesFieldCell value={doc.payload} fieldDef={payloadField} row={row} />
 * ```
 */
export function BytesFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<BytesField, TData>,
) {
  const config = useVexConfig();
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const size = formatBytes(props.value.byteLength);
  if (props.isTitleField) {
    return (
      <VexLink
        href={adminHref(
          { type: "document", slug: props.collection.slug, id: props.row.original._id },
          config.basePath,
        )}
      >
        <span className="font-mono font-bold">{size}</span>
      </VexLink>
    );
  }
  return <span className="font-mono tabular-nums">{size}</span>;
}
```

#### packages/react/src/fields/bytes/Display.tsx

```tsx
"use client";

import { formatBytes, type DisplayComponentProps, type BytesField, type TDocument } from "@vexcms/core";

/** Hex preview truncation threshold, in bytes, for {@link BytesFieldDisplay}. */
const BYTES_DISPLAY_PREVIEW_LENGTH = 16;

/**
 * Formats the first {@link BYTES_DISPLAY_PREVIEW_LENGTH} bytes of a buffer as
 * space-separated hex, with a trailing ellipsis when the buffer is longer.
 *
 * @param value - The stored payload.
 * @returns The (possibly truncated) hex preview.
 */
function formatHexPreview(value: ArrayBuffer): string {
  const preview = new Uint8Array(value).subarray(0, BYTES_DISPLAY_PREVIEW_LENGTH);
  const hex = Array.from(preview)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
  return value.byteLength > BYTES_DISPLAY_PREVIEW_LENGTH ? `${hex}…` : hex;
}

/**
 * Bytes field read-only display, registered as `reactAdapter.fields.bytes.display`.
 *
 * Shows the byte size plus a hex preview of the first
 * {@link BYTES_DISPLAY_PREVIEW_LENGTH} bytes — more than `BytesFieldCell`'s
 * size-only column can show.
 *
 * @param props - Component props.
 * @returns The size + hex preview, or an em-dash for an absent value.
 */
export function BytesFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<BytesField, TData>,
) {
  if (props.value === undefined || props.value === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-1 font-mono text-sm">
      <span>{formatBytes(props.value.byteLength)}</span>
      <span className="text-muted-foreground">{formatHexPreview(props.value)}</span>
    </div>
  );
}
```

#### packages/react/src/fields/bytes/columnDef.tsx

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, BytesField, TDocument } from "@vexcms/core";
import { BytesFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a bytes field.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved bytes field definition.
 * @param props.fieldKey - Field key from collection.fields.
 * @param props.isTitleField - Whether this is the title field (useAsTitle).
 * @param props.collection - Parent collection config, forwarded to `BytesFieldCell` to build the edit link `href`.
 * @returns TanStack Table column definition.
 *
 * @example
 * ```ts
 * const column = bytesFieldToColumnDef({
 *   fieldDef: collection.fields.payload,
 *   fieldKey: "payload",
 *   isTitleField: false,
 * });
 * ```
 */
export function bytesFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: BytesField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
  type?: TData;
}): ColumnDef<TData, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey);
      return (
        <BytesFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    enableSorting: false,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

#### packages/react/src/fields/bytes/testFixture.ts

```ts
import { ADMIN_FIELDS, bytes, type BytesField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * Builds a fixture `ArrayBuffer` of `byteLength` bytes, filled `0, 1, 2, …`
 * (mod 256) so tests can assert on its exact hex representation.
 *
 * @param byteLength - The buffer's length.
 * @returns The populated `ArrayBuffer`.
 */
function makeBuffer(byteLength: number): ArrayBuffer {
  const buffer = new ArrayBuffer(byteLength);
  const view = new Uint8Array(buffer);
  for (let index = 0; index < byteLength; index += 1) {
    view[index] = index % 256;
  }
  return buffer;
}

/**
 * `bytes` field fixture — drives `runFieldInputContractSuite` in
 * `fields/bytes/Field.test.tsx` and `runFieldCellContractSuite` in
 * `Cell.test.tsx`. `valid` is a 4-byte buffer (`00 01 02 03`); the base
 * contract's generic `setControlValue` no-ops on this field's file input
 * (file inputs are never driven generically — see `fieldInputContract.ts`),
 * so the field-specific File/Hex interactions live in this field's own
 * `extra` tests instead.
 */
export const bytesFieldFixture: FieldFixture<BytesField, ArrayBuffer | undefined> = {
  fieldType: ADMIN_FIELDS.bytes.type,
  fieldDef: bytes({ label: "Payload", required: true }),
  valid: makeBuffer(4),
  invalid: undefined,
  empty: undefined,
};
```

#### packages/react/src/fields/bytes/index.ts

```ts
export * from "./Field";
export * from "./Cell";
export * from "./columnDef";
export * from "./Display";
```

#### packages/react/src/fields/bytes/Field.test.tsx

```tsx
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, bytes, type BytesField, type CollectionConfig } from "@vexcms/core";
import { AppForm } from "../../forms";
import { testCollection } from "../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import { bytesFieldFixture } from "./testFixture";
import { BytesFieldAdmin } from "./Field";

/**
 * Mounts `BytesFieldAdmin` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally.
 */
function BytesValidationHarness(props: {
  fieldDef: BytesField;
  collection: CollectionConfig;
  initialValue: ArrayBuffer | undefined;
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <BytesFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: bytesFieldFixture,
  Component: BytesFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("bytes: File tab", () => {
      it("commits an ArrayBuffer read from a selected file", async () => {
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        const file = new File([new Uint8Array([1, 2, 3])], "payload.bin", {
          type: "application/octet-stream",
        });
        await userEvent.upload(fileInput, file);

        expect(await screen.findByText("3 B")).toBeInTheDocument();
      });

      it("rejects a file larger than maxSize, showing a local message and not changing the committed value", async () => {
        const fieldDef = bytes({ label: "Payload", maxSize: 2 });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        const fileInput = document.getElementById("testField") as HTMLInputElement;
        const file = new File([new Uint8Array([1, 2, 3])], "payload.bin");
        await userEvent.upload(fileInput, file);

        expect(await screen.findByText(/must be 2 B or smaller/i)).toBeInTheDocument();
        expect(screen.queryByText("3 B")).not.toBeInTheDocument();
      });
    });

    describe("bytes: Hex tab", () => {
      it("commits a value typed as space-separated hex bytes", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );
        await user.click(screen.getByRole("tab", { name: "Hex" }));
        await user.type(screen.getByPlaceholderText("48 65 6c 6c 6f"), "01 02 03");

        expect(await screen.findByText("3 B")).toBeInTheDocument();
      });

      it("shows a local error and leaves the committed value unchanged for invalid hex", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );
        await user.click(screen.getByRole("tab", { name: "Hex" }));
        const textarea = screen.getByPlaceholderText("48 65 6c 6c 6f") as HTMLTextAreaElement;
        await user.clear(textarea);
        await user.type(textarea, "zz");

        expect(await screen.findByText(/invalid hex byte/i)).toBeInTheDocument();
        expect(screen.getByText("4 B")).toBeInTheDocument();
      });
    });

    describe("bytes: clear", () => {
      it("clears the committed value via the Clear button", async () => {
        const user = userEvent.setup();
        const fieldDef = bytes({ label: "Payload" });
        render(
          <BytesValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={bytesFieldFixture.valid}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Clear" }));

        expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/fields/bytes/Cell.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { BytesFieldCell } from "./Cell";
import { bytesFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: bytesFieldFixture,
  Component: BytesFieldCell,
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("bytes: size formatting", () => {
      it("shows the byte size of the stored payload", () => {
        const value = new Uint8Array(12).buffer;
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        const { container } = render(
          withCellConfig(
            <BytesFieldCell
              value={value}
              row={row}
              collection={collection}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
            />,
          ),
        );
        expect(container).toHaveTextContent("12 B");
      });

      it("shows an em-dash placeholder for an absent value", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: undefined });
        const { container } = render(
          withCellConfig(
            <BytesFieldCell
              value={undefined}
              row={row}
              collection={collection}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
            />,
          ),
        );
        expect(container).toHaveTextContent("—");
      });
    });
  },
});
```

#### packages/react/src/fields/bytes/Display.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { bytes, type TDocument } from "@vexcms/core";
import { BytesFieldDisplay } from "./Display";
import { testCollection } from "../../testing/harness/accessFixtures";

const field = bytes({ label: "Payload" });
const document: TDocument = { _id: "doc_1", _creationTime: 0 };

describe("BytesFieldDisplay", () => {
  it("shows the byte size and a hex preview of the stored payload", () => {
    const value = Uint8Array.from([0, 1, 2, 255]).buffer;
    render(
      <BytesFieldDisplay field={field} value={value} document={document} collection={testCollection} />,
    );
    expect(screen.getByText("4 B")).toBeInTheDocument();
    expect(screen.getByText("00 01 02 ff")).toBeInTheDocument();
  });

  it("truncates the hex preview past 16 bytes with a trailing ellipsis", () => {
    const value = new Uint8Array(20).buffer;
    render(
      <BytesFieldDisplay field={field} value={value} document={document} collection={testCollection} />,
    );
    expect(screen.getByText(/…$/)).toBeInTheDocument();
  });

  it("shows an em-dash placeholder for an absent value", () => {
    render(
      <BytesFieldDisplay field={field} value={undefined} document={document} collection={testCollection} />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
```

#### packages/react/src/fields/bytes/columnDef.test.ts

```ts
import { runColumnDefSuite } from "../../testing/columnDefSuite";
import { bytesFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: bytesFieldFixture });
```

#### packages/react/src/adapter.ts

1 edit — import `BytesFieldAdmin`/`BytesFieldCell`/`BytesFieldDisplay` beside the `Json*` imports.

```ts
  JsonFieldAdmin,
  JsonFieldCell,
  JsonFieldDisplay,
  BytesFieldAdmin,
  BytesFieldCell,
  BytesFieldDisplay,
} from "./fields";
```

2 — `buildReactAdapter()`'s `fields` map, beside the `json` entry.

```ts
      [ADMIN_FIELDS.json.type]: {
        field: JsonFieldAdmin,
        cell: JsonFieldCell,
        display: JsonFieldDisplay,
      },
      [ADMIN_FIELDS.bytes.type]: {
        field: BytesFieldAdmin,
        cell: BytesFieldCell,
        display: BytesFieldDisplay,
      },
```

#### packages/react/src/adminEntry.ts

1 edit — add `BytesFieldAdmin, BytesFieldCell` to the field-component re-export list.

```ts
export { JsonFieldAdmin, JsonFieldCell, UrlFieldAdmin, UrlFieldCell, NumberFieldAdmin, NumberFieldCell, CheckboxFieldAdmin, CheckboxFieldCell, SelectFieldAdmin, SelectFieldCell, DateFieldAdmin, DateFieldCell, ColorFieldAdmin, ColorFieldCell, ArrayFieldAdmin, ArrayFieldCell, BlocksFieldAdmin, BlocksFieldCell, GroupFieldAdmin, GroupFieldCell, RelationshipFieldAdmin, RelationshipFieldCell, UploadFieldAdmin, UploadFieldCell, RichTextFieldAdmin, RichTextFieldCell, BytesFieldAdmin, BytesFieldCell } from "./fields";
```

#### packages/react/src/index.ts

1 edit — pass-through config function, beside `json`.

```ts
export { text, email, textarea, number, select, date, url, checkbox, json, bytes, tabs, collapsible, row, ui, defineConfig } from "@vexcms/core";
```

2 — resolved type export, beside `JsonField`.

```ts
  JsonField,
  BytesField,
```

#### packages/react/src/fields/index.tsx

1 edit — import beside `jsonFieldToColumnDef`.

```ts
import { jsonFieldToColumnDef } from "./json";
import { bytesFieldToColumnDef } from "./bytes";
```

2 — barrel export beside `json`.

```ts
export * from "./json";
export * from "./bytes";
```

3 — `getCollectionColumnDefs`'s switch, a new case beside `ADMIN_FIELDS.json.type` (immediately before the `default:` arm).

```ts
      case ADMIN_FIELDS.json.type:
        columnDef = jsonFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.bytes.type:
        columnDef = bytesFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;
```

#### packages/react/src/collections/listView/filters/listViewFilterOperators.ts

1 edit — extend the doc comment's structured-type list and add a `bytes` entry to `LIST_VIEW_FILTER_OPS_BY_FIELD_TYPE`, beside `json`.

```ts
 * `json`/`bytes`/`richtext`/`array`/`blocks`/`group` are explicit entries too
 * (bug fix): these six structured/binary-value types used to fall
 * through to {@link LIST_VIEW_FILTER_DEFAULT_OPS}'s `eq`/`neq`, offering a
 * comparison against a value that was never meaningful and had
 * no matching value control (`fieldToFilterInputComponent` registers none
 * for them) — now they list ONLY the two value-less operators, matching
 * the control-free row `ListViewFilterBuilder`'s own call site already
 * renders for any op with no registered input.
 */
export const LIST_VIEW_FILTER_OPS_BY_FIELD_TYPE: Record<string, ListViewFilterOp[]> = {
  number: ["eq", "neq", "gte", "lte", "isEmpty", "isNotEmpty"],
  date: ["gte", "lte", "isEmpty", "isNotEmpty"],
  commitTs: ["gte", "lte", "isEmpty", "isNotEmpty"],
  json: ["isEmpty", "isNotEmpty"],
  bytes: ["isEmpty", "isNotEmpty"],
  richtext: ["isEmpty", "isNotEmpty"],
  array: ["isEmpty", "isNotEmpty"],
  blocks: ["isEmpty", "isNotEmpty"],
  group: ["isEmpty", "isNotEmpty"],
};
```

(No edit to `packages/core/src/collections/listView/listViewUrlState.ts` — see Writer note.)

#### packages/react/src/testing/fixtures/index.ts

1 edit — import beside `jsonFieldFixture`.

```ts
import { jsonFieldFixture } from "../../fields/json/testFixture";
import { bytesFieldFixture } from "../../fields/bytes/testFixture";
```

2 — registry entry beside `json`.

```ts
  json: jsonFieldFixture,
  bytes: bytesFieldFixture,
```

#### packages/telemetry/src/anonymizeConfig.ts

1 edit — a new case in `anonymizeField`'s switch, beside `ADMIN_FIELDS.json.type` (before `ADMIN_FIELDS.array.type`). Reuses the existing `max`/`hasAccept` `AnonymizedField` attributes — no new attribute is added.

```ts
    case ADMIN_FIELDS.json.type:
      context.fields.push(dataFieldBase({ field, path, context }));
      return;
    case ADMIN_FIELDS.bytes.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        max: field.maxSize,
        hasAccept: field.accept.length > 0,
      });
      return;
```

#### apps/test/src/vexcms/collections/storageShapes.ts

Depends on Step 2 (creates the file, imports field builders from `@vexcms/core`) and Step 5 (appends the `cover` single-upload field, the last field before this one per the contract's append order). Two edits once those land:

1 — add `bytes` to the file's `@vexcms/core` import list.

2 — append a `payload` field to the `fields` object, immediately after `cover`.

```ts
    payload: bytes({ label: "Payload" }),
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`; `pnpm --filter @vexcms/telemetry test`; `pnpm --filter test vex:generate` and read `storageShapes` in `convex/vex.schema.ts` (`v.bytes()` / `v.optional(v.bytes())`) and `vex.types.ts` (`ArrayBuffer` / `ArrayBuffer | undefined`); `pnpm typecheck`.

### Step 8 — `keyValue()` [agent]

> Writer note: `spec-tasks.md`'s file list names `documents/removeVexFields.ts` — this file does not
> exist; the real path is `packages/core/src/versions/removeVexFields.ts` (`removeVexFields`). Read in
> full: it strips only `CONVEX_SYSTEM_FIELDS`/`VERSION_SYSTEM_FIELDS` keys plus top-level `commitTs`
> fields, by TYPE, with **no recursion into any container** (`group`/`array`/`blocks` sub-fields are
> already not walked). `keyValue` needs no change there to stay consistent with that existing
> (non-recursive) behavior — noted, not edited.
>
> Writer note: `fields/validate.ts`'s `validateFields` (`packages/core/src/fields/validate.ts:42-78`)
> is fully generic over `getDataFields`'s output (any `kind: "data"` field) with zero per-type
> branching — `keyValue`'s own top-level `validate()` already runs through the existing path with no
> code change. A nested `value` field's own `validate()` never runs individually, exactly like a
> group/array sub-field's today (by design, per that file's own doc comment) — not a gap.
>
> Writer note: contract rule 11 ("every walker recurses into them") is broader than the file list in
> `spec-tasks.md`'s checklist line, which names only `fields/utils.ts`/`childInterfaceType.ts`/
> `interfaceGen.ts`/`db/depth.ts`+`db/populate.ts`. Three more existing recursive walkers have the
> same "nested group/array id or richtext discovery" shape and silently miss a `keyValue`-nested
> case without a change: `fields/array/utils.ts` (`assignArrayItemIds`/`backfillArrayValue`, the
> array-item id backfill run on every save), `fields/blocks/utils.ts` (`cloneNestedBlockIds`, block id
> regeneration), and `types/generateVexTypes.ts` (`hasRichTextField`, decides the `RichTextDocument`
> import). This section extends all three for correctness; flagging so sync-spec can fold the
> omission back into the task list.
>
> Writer note: `db/populate.ts`'s existing relationship leaf pass reads `container[fieldKey]` as an
> `Array.isArray` column; Step 5 (scalar `relationship`/`upload` storage) is assumed landed per the
> contract but its exact diff isn't on disk yet. This section's new `populateRecordContainers` makes
> no assumption about that shape — it delegates to the SAME `populateContainers` entry point Step 5
> extends, through a one-column-per-record-entry synthetic container, so it inherits whatever Step 5
> lands (array or scalar id) with no duplicated logic.
>
> Writer note: a full Convex-integration (`convex-test`) populate test for "relationship nested as a
> keyValue's value" would require adding a `v.record(...)` column to the shared fixture schema
> (`packages/core/src/db/test/convex/schema.ts`), used by many other tests — out of scope for this
> section. Coverage here is the pure, schema-free `buildDepthPopulate` shape test in `depth.test.ts`;
> a `populate.test.ts` integration case is left for Step 10/11's dogfood pass.
>
> Stitcher digest (Step 2/5/9): `ADMIN_FIELDS` entries now carry `hasNullToggle: boolean` —
> `ADMIN_FIELDS.keyValue.hasNullToggle: true` is folded into the `fields/constants.ts` edit below
> (keyValue is one of the containers with no natural empty input state, contract rule 13).
> `getFieldsDefaultValues`/the save-time `resolveNullableSaveValue(s)` helpers (Step 2,
> `packages/core/src/fields/utils.ts`) key off that flag generically — this section calls neither
> directly, since keyValue's own form value stays `Record<K, V>` (document-shaped, identical to
> `group`'s own convention) at every point those helpers run; only the EPHEMERAL per-row UI state
> inside `KeyValueFieldAdmin` is local, never touching the load/save boundary. `FormFieldLayout`'s
> `isNull`/`onIsNullChange` (and its exported `NullFieldToggle`) are consumed as originally
> contracted — `KeyValueField` (the forms leaf) forwards both straight through to `FormFieldLayout`,
> which renders `NullFieldToggle` internally; no direct `NullFieldToggle` import needed here, since
> (unlike `GroupField`'s own custom Accordion layout) `KeyValueField` already routes through
> `FormFieldLayout`. Step 5's `PopulateMapEntry` gaining `scalar?: true` and Step 9's gaining
> `{ kind: "variant"; ... }` don't require a matching keyValue member: this section deliberately
> never adds one (see the `buildPopulateMapEntry` note below) — the manually-typed `populate({...})`
> API simply never surfaces a keyValue field as populatable, consistently, with no partial/broken
> entry to keep in sync.

Why: `v.record(keys, values)` has no field. Keys are `v.string()` or `v.id(collection)`; values are
one nested data field. The input is rows of key + value, with unique keys. It nests everywhere a
data field nests.

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`;
`pnpm --filter test vex:generate` shows `v.record(...)` / `Record<K, V>`; `pnpm typecheck`.

- [ ] core `fields/keyValue/{types,config,validator,inputSchema,utils,index}.ts` + tests; registrations
      as in Step 7 (`ADMIN_FIELDS`, `AdminField` union, validator/inputSchema dispatch, `fields/index.ts`,
      `FIELD_TYPE_DEFAULT_WIDTH`)
- [ ] core walkers: `fields/utils.ts` (`hasFieldConditions`), `childInterfaceType.ts` (no change —
      documented below), `interfaceGen.ts`, `db/depth.ts`/`db/populate.ts` for nested relationships,
      `fields/array/utils.ts`, `fields/blocks/utils.ts`, `types/generateVexTypes.ts`,
      `documents/cloneDocumentForDuplicate.ts` + tests
- [ ] react `fields/keyValue/{Field,Cell,Display,columnDef,testFixture,index}` + `forms/KeyValueField.tsx`
      (includes `useKeyValueRows`) + tests; `adapter.ts`, `fields/index.tsx`, `forms/index.ts`,
      `testing/fixtures/index.ts`, `testing/nestedFieldContainer.ts`
- [ ] telemetry walker case (`anonymizeConfig.ts`, `types.ts`)
- [ ] apps/test `storageShapes`: a string-keyed and an id-keyed keyValue

#### packages/core/src/fields/keyValue/types.ts
New file.

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";
import type { AdminDataField } from "../types";
import type { CollectionSlug, VexResourceSlug } from "../../types/generated";

/**
 * Targets the collection a `keyValue()` field's record keys reference, when
 * keys are Convex ids rather than plain strings.
 */
export interface KeyValueFieldKeysInput<TKeysSlug extends CollectionSlug = CollectionSlug> {
  /** The slug of the collection this field's keys reference. */
  collection: { slug: TKeysSlug };
}

/**
 * Configuration input for a `keyValue()` field.
 *
 * KeyValue fields store a Convex `v.record(keys, value)` — a dynamically-keyed
 * map from `keys` (`v.string()` by default, or `v.id(collection)` when `keys`
 * is set) to one shared `value` data field, which may itself be any data
 * field including containers (`group()`, `array()`, nested `keyValue()`).
 * A fixed, literal key set is a `group()`, not this field.
 *
 * **Defaults applied by `keyValue()`:**
 * ```ts
 * {
 *   type:        "keyValue",
 *   label:       "",
 *   required:    false,
 *   defaultValue: {},
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width: "100%",
 *     cellAlignment: "left",
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * scores: keyValue({ label: "Scores", value: number({ required: true }) })
 *
 * userScores: keyValue({
 *   label: "User Scores",
 *   keys: { collection: { slug: "user" } },
 *   value: number({ required: true }),
 * })
 * ```
 *
 * @see {@link KeyValueField} for the resolved output type
 * @see {@link keyValue} for the config function that produces this type
 */
export interface KeyValueFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  TKeysSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta> {
  /** Record key target. Omit for `v.string()` keys (the default). */
  keys?: KeyValueFieldKeysInput<TKeysSlug>;
  /**
   * The ONE data field every record entry's value is validated against.
   * Record values can't be `v.optional` in Convex — `keyValue()` forces this
   * field's own `required` to `true`; its `nullable` still applies.
   */
  value: AdminDataField;
  /** Pre-filled value shown when creating a new document. Defaults to `{}`. */
  defaultValue?: Record<string, unknown>;
  /** Server-only async validation with `value` typed as `Record<string, unknown>`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, Record<string, unknown>>): Promise<void> | void;
}

/**
 * Resolved configuration for a `keyValue()` field, after all defaults are applied.
 *
 * `interfaceType` is computed PER INSTANCE (`Record<string, V>` or
 * `Record<Id<"slug">, V>`) via `childInterfaceType(options.value)`, so a
 * nested `select`/named `group` inside `value` produces the same literal
 * union / named type it would at the top level (P-019).
 *
 * @see {@link KeyValueFieldInput} for the user-facing input type
 * @see {@link keyValue} for the config function that produces this type
 */
export interface KeyValueField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TKeysSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.keyValue.type;
  label: string;
  required: boolean;
  keys?: KeyValueFieldKeysInput<TKeysSlug>;
  /** The record's own value field, with `required` forced to `true`. */
  value: AdminDataField;
  defaultValue: Record<string, unknown>;
  validate?(props: FieldValidateProps<TCollectionSlug, Record<string, unknown>>): Promise<void> | void;
}
```

#### packages/core/src/fields/keyValue/config.ts
New file.

```ts
import { childInterfaceType } from "../childInterfaceType";
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldComponents } from "../utils";
import type { KeyValueFieldInput, KeyValueField } from "./types";
import type { CollectionSlug, VexResourceSlug } from "../../types/generated";

/**
 * Creates a keyValue field with all defaults applied.
 *
 * KeyValue fields store a Convex `v.record(keys, value)` — a dynamically-keyed
 * map from `keys` (`v.string()`, or `v.id(collection)` when `keys` is set) to
 * one shared `value` data field. `value`'s own `required` is forced to `true`
 * (record values can't be `v.optional` in Convex); its `nullable` still
 * applies.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `{}`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - KeyValue field configuration. `value` is required; all
 *   other properties are optional.
 * @returns Resolved keyValue field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { keyValue, number } from "@vexcms/core"
 *
 * storageShapes: defineCollection({
 *   fields: {
 *     scores: keyValue({ label: "Scores", value: number({ required: true }) }),
 *   },
 * })
 * ```
 *
 * @see {@link KeyValueFieldInput} for the full input type
 * @see {@link KeyValueField} for the resolved output type
 */
export function keyValue<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TKeysSlug extends CollectionSlug = CollectionSlug,
>(
  options: KeyValueFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, TKeysSlug>,
): KeyValueField<TCollectionSlug, TFieldMeta, TKeysSlug> {
  const keyInterfaceType = options.keys ? `Id<"${options.keys.collection.slug}">` : "string";
  const valueInterfaceType = childInterfaceType(options.value);

  return {
    type: ADMIN_FIELDS.keyValue.type,
    interfaceType: `Record<${keyInterfaceType}, ${valueInterfaceType}>`,

    label: "",
    required: false,
    defaultValue: {},
    ...options,

    value: { ...options.value, required: true } as KeyValueField["value"],

    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
```

#### packages/core/src/fields/keyValue/validator.ts
New file.

```ts
import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { KeyValueField } from "./types";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Converts a keyValue field definition to a Convex schema validator string.
 *
 * Generates `v.record(keys, value)` where `keys` is `v.string()` by default
 * or `v.id("collection")` when `field.keys` is set, and `value` is built by
 * the existing `adminFieldToValidator` dispatch against `field.value` (whose
 * `required` `keyValue()` already forced to `true`, so the value validator is
 * never wrapped in `v.optional`).
 *
 * @param props - Input props.
 * @param props.field - The resolved keyValue field definition.
 * @returns A Convex validator string.
 *
 * @example
 * ```ts
 * const field = keyValue({ value: number({ required: true }) })
 * keyValueFieldToValidator({ field })
 * // → 'v.optional(v.record(v.string(), v.number()))'
 * ```
 *
 * @example
 * ```ts
 * const field = keyValue({
 *   required: true,
 *   keys: { collection: { slug: "user" } },
 *   value: number({ required: true }),
 * })
 * keyValueFieldToValidator({ field })
 * // → 'v.record(v.id("user"), v.number())'
 * ```
 *
 * @internal — Used by CLI schema generation via `adminFieldToValidator`.
 */
export function keyValueFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: KeyValueField<VexResourceSlug, TFieldMeta>;
}): string {
  const { field } = props;
  const keysValidator = field.keys ? `v.id("${field.keys.collection.slug}")` : "v.string()";
  const valueValidator = adminFieldToValidator({ field: field.value });

  return applyBaseValidators({
    field,
    validator: `v.record(${keysValidator}, ${valueValidator})`,
  });
}

/**
 * Types a `keyValue()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `Record<string, unknown>`.
 * @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function keyValueValidator<TCollectionSlug extends CollectionSlug>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, Record<string, unknown>, KeyValueField>,
): FieldValidate<TCollectionSlug, Record<string, unknown>> {
  return fieldValidator<TCollectionSlug, Record<string, unknown>, KeyValueField>(slug, fn);
}
```

#### packages/core/src/fields/keyValue/utils.ts
New file.

```ts
/** Convex `v.record()` keys: non-empty ASCII, never starting with `"$"` or `"_"`. */
const RESERVED_RECORD_KEY_PREFIXES = ["$", "_"] as const;

/**
 * Whether `key` is a legal Convex record key: non-empty, ASCII-only, and not
 * starting with `"$"` (Convex-internal) or `"_"` (reserved for system fields).
 * Applies to both default `v.string()` keys and the entered side of a
 * `v.id(collection)` key — a real id never collides with either prefix.
 *
 * @param key - The candidate record key.
 * @returns `true` if `key` is a legal Convex record key.
 */
export function isValidRecordKey(key: string): boolean {
  return (
    key.length > 0 &&
    /^[\x00-\x7F]+$/.test(key) &&
    !RESERVED_RECORD_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}
```

#### packages/core/src/fields/keyValue/inputSchema.ts
New file.

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { isValidRecordKey } from "./utils";
import type { KeyValueField } from "./types";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Builds a Zod schema for validating a keyValue field value in the admin form.
 *
 * Constructs a `z.record(keySchema, valueSchema)`. `keySchema` enforces
 * Convex's own record-key rules (`isValidRecordKey`) regardless of whether
 * `field.keys` is set — a real Convex id never violates them, so one schema
 * covers both cases. `valueSchema` is built once via `adminFieldToInputSchema`
 * against `field.value` and reused for every entry (Zod validates each
 * record value against it independently). Required keyValue fields attach
 * `{ error: "This field is required." }` to the base `z.record()` call and
 * never receive `.default()`; non-required fields keep
 * `.default(field.defaultValue ?? {})` — mirrors `group`'s own required/
 * optional split (CORE-1), since a record, like an object, has no implicit
 * non-emptiness requirement.
 *
 * `field.value`'s own `admin.condition` is not evaluated here: unlike a
 * group's statically-keyed sub-fields or an array's positional items, a
 * record's entries are dynamically keyed with no single `siblingData` to
 * thread per entry — out of scope for this field's first version.
 *
 * @param props - Input props.
 * @param props.field - The resolved keyValue field definition.
 * @param props.ignoreRequired - Forwarded to the recursive
 *   `adminFieldToInputSchema({ field: field.value })` call so a draft-lenient
 *   pass reaches the value field too.
 * @returns A Zod record schema with optionality applied.
 *
 * @example
 * ```ts
 * const field = keyValue({ value: number({ required: true }) })
 * keyValueFieldToInputSchema({ field })
 * // → z.record(z.string()..., z.number()).optional().default({})
 * ```
 */
export function keyValueFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: KeyValueField<VexResourceSlug, TFieldMeta>;
  ignoreRequired?: boolean;
}): ZodType {
  const { field } = props;

  const keySchema = z
    .string()
    .refine(isValidRecordKey, "Key must be non-empty ASCII and cannot start with \"$\" or \"_\".");
  const valueSchema = adminFieldToInputSchema({
    field: field.value,
    ignoreRequired: props.ignoreRequired,
  });

  const schema: ZodType = field.required
    ? z.record(keySchema, valueSchema, { error: "This field is required." })
    : z.record(keySchema, valueSchema).default(field.defaultValue ?? {});

  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
```

#### packages/core/src/fields/keyValue/index.ts
New file.

```ts
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
export * from "./utils";
```

#### packages/core/src/fields/keyValue/validator.test.ts
New file.

```ts
import { describe, it, expect } from "vitest";
import { keyValue } from "./config";
import { number } from "../number";
import { text } from "../text";
import { group } from "../group";
import { keyValueFieldToValidator } from "./validator";

describe("keyValueFieldToValidator", () => {
  it("generates string keys by default, wrapped in v.optional for a non-required field", () => {
    const field = keyValue({ value: number({ required: true }) });
    expect(keyValueFieldToValidator({ field })).toBe(
      "v.optional(v.record(v.string(), v.number()))",
    );
  });

  it("omits the optional wrapper for a required field", () => {
    const field = keyValue({ required: true, value: number({ required: true }) });
    expect(keyValueFieldToValidator({ field })).toBe("v.record(v.string(), v.number())");
  });

  it("stores v.id(slug) keys when keys.collection is set", () => {
    const field = keyValue({ keys: { collection: { slug: "user" } }, value: number() });
    expect(keyValueFieldToValidator({ field })).toBe(
      'v.optional(v.record(v.id("user"), v.number()))',
    );
  });

  it("never wraps the value validator in v.optional, regardless of the value field's own required", () => {
    const field = keyValue({ value: text({ required: false }) });
    expect(keyValueFieldToValidator({ field })).toBe(
      "v.optional(v.record(v.string(), v.string()))",
    );
  });

  it("supports a group() value — any data field including containers", () => {
    const field = keyValue({
      value: group({ required: true, fields: { score: number({ required: true }) } }),
    });
    expect(keyValueFieldToValidator({ field })).toBe(
      "v.optional(v.record(v.string(), v.object({ score: v.number() })))",
    );
  });
});
```

#### packages/core/src/fields/keyValue/inputSchema.test.ts
New file.

```ts
import { describe, it, expect } from "vitest";
import { keyValue } from "./config";
import { number } from "../number";
import { keyValueFieldToInputSchema } from "./inputSchema";

describe("keyValueFieldToInputSchema", () => {
  it("parses a valid string-keyed record", () => {
    const field = keyValue({ value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.safeParse({ alpha: 1, beta: 2 }).success).toBe(true);
  });

  it("rejects a key starting with an underscore", () => {
    const field = keyValue({ value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.safeParse({ _bad: 1 }).success).toBe(false);
  });

  it("rejects an empty-string key", () => {
    const field = keyValue({ value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.safeParse({ "": 1 }).success).toBe(false);
  });

  it("defaults to {} when the field is optional and the value is undefined", () => {
    const field = keyValue({ value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.parse(undefined)).toEqual({});
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = keyValue({ required: true, value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toMatch(/required/i);
    }
  });
});
```

#### packages/core/src/fields/constants.ts
1 edit — the `ADMIN_FIELDS.json` entry stays last in the object literal in today's file; insert `keyValue` as a new entry (anchored beside `ADMIN_FIELDS.group`, since both are single-nested-container data fields) and add the matching `KeyValueFieldType` literal export beside `GroupFieldType`.

```ts
  group: {
    type: "group",
    interfaceType: "Record<string, any>",
    validator: "v.object({})",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValue: {} as Record<string, any>,
    kind: "data",
    inputMasks: false,
  },
  keyValue: {
    type: "keyValue",
    interfaceType: "Record<string, any>", // placeholder - keyValue() overrides per instance
    validator: "v.record(v.string(), v.any())", // placeholder - keyValueFieldToValidator builds dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValue: {} as Record<string, any>,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
```

```ts
/** Literal type `"group"` — the discriminant value on {@link GroupField}. */
export type GroupFieldType = typeof ADMIN_FIELDS.group.type;

/** Literal type `"keyValue"` — the discriminant value on {@link KeyValueField}. */
export type KeyValueFieldType = typeof ADMIN_FIELDS.keyValue.type;
```

#### packages/core/src/fields/types.ts
2 edits.

**1 — import.** Beside `import { GroupField } from "./group";`:

```ts
import { GroupField } from "./group";
import { KeyValueField } from "./keyValue";
```

**2 — `AdminField` union.** Beside the existing `GroupField<VexResourceSlug, TFieldMeta>` member:

```ts
  | GroupField<VexResourceSlug, TFieldMeta>
  | KeyValueField<VexResourceSlug, TFieldMeta>
```

#### packages/core/src/fields/index.ts
1 edit — beside `export * from "./group";`:

```ts
export * from "./group";
export * from "./keyValue";
```

#### packages/core/src/fields/validators/index.ts
2 edits.

**1 — import.** Beside `import { groupFieldToValidator } from "../group";`:

```ts
import { groupFieldToValidator } from "../group";
import { keyValueFieldToValidator } from "../keyValue";
```

**2 — switch case.** Beside the `ADMIN_FIELDS.group.type` case:

```ts
    case ADMIN_FIELDS.group.type:
      return groupFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.keyValue.type:
      return keyValueFieldToValidator({ field: props.field });
```

#### packages/core/src/fields/inputSchemas/index.ts
2 edits.

**1 — import.** Beside `import { groupFieldToInputSchema } from "../group";`:

```ts
import { groupFieldToInputSchema } from "../group";
import { keyValueFieldToInputSchema } from "../keyValue";
```

**2 — switch case.** Beside the `ADMIN_FIELDS.group.type` case:

```ts
    case ADMIN_FIELDS.group.type:
      return groupFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
        siblingData: childSiblingData,
      });
    case ADMIN_FIELDS.keyValue.type:
      return keyValueFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
      });
```

#### packages/core/src/fields/interfaceGen.ts
1 edit — a new `else if` branch recursing into `field.value`, reusing `getFieldInterfaces` itself
(it already handles `group`/`array`/`blocks` on whatever it's given, so wrapping `field.value` as a
one-entry field map covers a group/array/blocks/nested-keyValue value for free). Anchored beside the
`ADMIN_FIELDS.blocks.type` branch, as the last `else if`:

```ts
    } else if (field.type === ADMIN_FIELDS.blocks.type) {
      // Depth-first: recurse into each block's fields for any named sub-groups,
      // then emit each block's own type declaration.
      for (const block of field.blocks) {
        declarations.push(...getFieldInterfaces(block.fields));
        declarations.push(`export type ${block.interfaceName} = ${block.interfaceType}`);
      }
      // Named union alias — emitted after all individual block types.
      if (field.interfaceName) {
        const union = field.blocks.map((b) => b.interfaceName).join(" | ");
        declarations.push(`export type ${field.interfaceName} = ${union}`);
      }
    } else if (field.type === ADMIN_FIELDS.keyValue.type) {
      // A keyValue's value is one shared data field — recursing through the
      // same entry point handles a nested group/array/blocks/keyValue value
      // identically to a top-level field.
      declarations.push(...getFieldInterfaces({ value: field.value }));
    }
```

`childInterfaceType.ts` needs no change: `keyValue()`'s own `interfaceType` is already a fully
resolved per-instance string (`Record<K, V>`, computed in `config.ts` via `childInterfaceType(options.value)`
itself), so the function's final `return field.interfaceType;` fallback already serves it correctly —
exactly like `array()`, which also stamps a per-instance `interfaceType` and needs no case there.

#### packages/core/src/fields/utils.ts
1 edit — `hasFieldConditions` gets a `keyValue` case, mirroring array's `{ item: field.items }`
wrapper. Anchored beside the `ADMIN_FIELDS.array.type` branch:

```ts
    if (field.type === ADMIN_FIELDS.array.type) {
      return hasFieldConditions({ fields: { item: field.items } });
    }
    if (field.type === ADMIN_FIELDS.keyValue.type) {
      return hasFieldConditions({ fields: { value: field.value } });
    }
```

`buildPopulateMapEntry`/`buildPopulateMapEntries` (the compile-time `PopulateMapEntry` builder behind
the manually-typed `populate: {...}` API) are out of scope for this step — not named in the task's
walker list, and a dynamically-keyed record has no static per-key populate shape to express there.
Only depth-based (`depth: N`) auto-populate supports a relationship nested in a keyValue's value
(`db/depth.ts`/`db/populate.ts`, below).

#### packages/core/src/fields/utils.test.ts
2 edits.

**1 — import.** Beside `import { blocks, defineBlock } from "./blocks/config";`:

```ts
import { blocks, defineBlock } from "./blocks/config";
import { keyValue } from "./keyValue/config";
```

**2 — test.** Beside the `"recurses into block fields"` test, inside `describe("hasFieldConditions", ...)`:

```ts
  it("recurses into block fields", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: { headline: text({ admin: { condition: () => true } }) },
    });
    const fields = { body: blocks({ blocks: [heroBlock] }) };
    expect(hasFieldConditions({ fields })).toBe(true);
  });

  it("recurses into keyValue's value field", () => {
    const fields = { scores: keyValue({ value: text({ admin: { condition: () => true } }) }) };
    expect(hasFieldConditions({ fields })).toBe(true);
  });
```

#### packages/core/src/db/depth.ts
1 edit — `buildFieldDepthPopulate` gets a new `keyValue` case. Unlike `array`'s transparent pass-through
(an array's value IS the items field at the SAME document position), a keyValue's entries are each a
separate instance of `field.value` addressed by a DYNAMIC key unknown at config time — so it can't
collapse to the item's own shape directly; it emits a `{ kind: "record", populate }` wrapper that
`db/populate.ts`'s dispatch recognizes. Anchored beside the `ADMIN_FIELDS.group.type` branch:

```ts
  if (field.type === ADMIN_FIELDS.group.type) {
    const nested = buildContainerDepthPopulate({ config, fields: field.fields, depth, visited });
    return Object.keys(nested).length > 0 ? nested : undefined;
  }

  if (field.type === ADMIN_FIELDS.keyValue.type) {
    const nested = buildFieldDepthPopulate({ config, field: field.value, depth, visited });
    return nested === undefined ? undefined : { kind: "record", populate: nested };
  }
```

#### packages/core/src/db/depth.test.ts
1 edit — two new tests, anchored after `"a group()/array() with nothing populatable is omitted entirely"`,
before the `describe`'s closing `});`:

```ts
  it("a group()/array() with nothing populatable is omitted entirely", () => {
    const withPlainGroup = makeConfig([
      {
        slug: "pages",
        fields: {
          seo: { type: "group", fields: { title: { type: "text" } } },
          tags: { type: "array", items: { type: "text" } },
          author: { type: "relationship", collection: { slug: "authors" } },
        },
      },
      { slug: "authors", fields: { name: { type: "text" } } },
    ]);
    expect(buildDepthPopulate(withPlainGroup, "pages", 1)).toEqual({ author: true });
  });

  it("a relationship nested inside a keyValue's value becomes { kind: \"record\", populate: true }", () => {
    const withScores = makeConfig([
      {
        slug: "pages",
        fields: {
          scores: {
            type: "keyValue",
            value: { type: "relationship", collection: { slug: "authors" } },
          },
        },
      },
      { slug: "authors", fields: { name: { type: "text" } } },
    ]);
    expect(buildDepthPopulate(withScores, "pages", 1)).toEqual({
      scores: { kind: "record", populate: true },
    });
  });

  it("a keyValue with nothing populatable in its value is omitted entirely", () => {
    const withPlainScores = makeConfig([
      { slug: "pages", fields: { scores: { type: "keyValue", value: { type: "number" } } } },
    ]);
    expect(buildDepthPopulate(withPlainScores, "pages", 1)).toEqual({});
  });
});
```

#### packages/core/src/db/populate.ts
2 edits.

**1 — dispatch.** `populateContainers`'s per-field loop routes a `{ kind: "record" }` entry to the new
helper before the existing leaf/nested-container split, since it also carries a `populate` key that
would otherwise mis-route into the relationship id-batch leaf pass. Anchored at the top of the
`for (const [fieldKey, opts] of Object.entries(populate))` loop body:

```ts
  for (const [fieldKey, opts] of Object.entries(populate)) {
    if (typeof opts === "object" && opts !== null && (opts as { kind?: unknown }).kind === "record") {
      await populateRecordContainers({
        ctx,
        containers,
        fieldKey,
        opts: (opts as { populate: unknown }).populate,
        drafts,
        config,
        access,
        auth,
      });
      continue;
    }
    const isLeaf = opts === true || (typeof opts === "object" && opts !== null && "populate" in opts);
```

**2 — new function.** A keyValue field's stored value is `Record<K, V>` — one shared value-field
populate shape applied to every entry, keyed dynamically. `populateRecordContainers` flattens every
container's record into one synthetic container PER ENTRY (keyed `__value`), recurses through the
SAME `populateContainers` entry point the relationship/group/blocks branches already use (so it
inherits whatever shape Step 5's scalar-id support gives the inner leaf pass, with no duplicated id
logic), then writes each entry back under its original key. Added as a new function, placed directly
after `populateNestedContainer`:

```ts
/**
 * Populates one keyValue field's record entries — `container[fieldKey]` is a
 * `Record<string, unknown>`, one entry per record key, each independently
 * populatable per `opts` (the record's shared value field's own depth-populate
 * result: `true`, `{ populate }`, a plain container object, or a nested
 * `{ kind: "record", populate }`).
 *
 * Clones every container's record object before mutating it, same
 * convention as `populateNestedContainer`. Flattens every (container, key)
 * pair into one synthetic one-column container (`{ __value: entryValue }`)
 * so the existing `populateContainers` dispatch — leaf id batching, nested
 * container recursion, or a further `kind: "record"` level — runs UNCHANGED
 * against `{ __value: opts }`, then writes each resolved `__value` back onto
 * its own record entry.
 */
async function populateRecordContainers<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  containers: Record<string, unknown>[];
  fieldKey: string;
  opts: unknown;
  drafts?: boolean;
  config?: VexConfig;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
}): Promise<void> {
  const { ctx, containers, fieldKey, opts, drafts, config, access, auth } = props;
  const entries: { container: Record<string, unknown>; key: string }[] = [];
  const synthetic: Record<string, unknown>[] = [];

  for (const container of containers) {
    const record = container[fieldKey];
    if (typeof record !== "object" || record === null) continue;
    const cloned: Record<string, unknown> = { ...(record as Record<string, unknown>) };
    container[fieldKey] = cloned;
    for (const key of Object.keys(cloned)) {
      entries.push({ container: cloned, key });
      synthetic.push({ __value: cloned[key] });
    }
  }
  if (synthetic.length === 0) return;

  await populateContainers({
    ctx,
    containers: synthetic,
    populate: { __value: opts },
    drafts,
    config,
    access,
    auth,
  });

  for (let i = 0; i < entries.length; i++) {
    entries[i]!.container[entries[i]!.key] = synthetic[i]!.__value;
  }
}
```

#### packages/core/src/fields/array/utils.ts
2 edits — `assignArrayItemIds` (the array-item id backfill run on every save) needs to recurse into a
keyValue's value the same way it already recurses into a group's sub-fields or a nested array's
items, otherwise an object-shaped array item (or nested array) living inside a keyValue's value never
gets its `id` backfilled.

**1 — new helper**, placed directly after `backfillArrayValue`:

```ts
/**
 * Backfills ids reachable through one keyValue field's `value` definition —
 * the recursive step `assignArrayItemIds` delegates keyValue-typed fields to,
 * mirroring `backfillArrayValue`'s own per-item-type dispatch but applied to
 * every record ENTRY rather than every array INDEX.
 *
 * @returns `props.value` unchanged for a scalar `valueField`; otherwise a new
 *   value with every reachable object-shaped id backfilled.
 */
function backfillKeyValueEntry(props: { valueField: AdminField; value: unknown }): unknown {
  const { valueField, value } = props;
  if (valueField.type === ADMIN_FIELDS.group.type && value && typeof value === "object") {
    return assignArrayItemIds({ fields: valueField.fields, data: value as Record<string, unknown> });
  }
  if (valueField.type === ADMIN_FIELDS.array.type) {
    return backfillArrayValue({ itemField: valueField.items, value });
  }
  if (valueField.type === ADMIN_FIELDS.keyValue.type && value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
      result[entryKey] = backfillKeyValueEntry({ valueField: valueField.value, value: entryValue });
    }
    return result;
  }
  return value;
}
```

**2 — `assignArrayItemIds`'s dispatch.** Anchored beside the `ADMIN_FIELDS.blocks.type` branch:

```ts
    } else if (field.type === ADMIN_FIELDS.blocks.type && Array.isArray(value)) {
      result[key] = value.map((block) => {
        const blockItem = block as Record<string, unknown>;
        const blockDef = field.blocks.find((b) => b.blockType === blockItem.blockType);
        return blockDef
          ? assignArrayItemIds({ fields: blockDef.fields, data: blockItem })
          : block;
      });
    } else if (field.type === ADMIN_FIELDS.keyValue.type && value && typeof value === "object") {
      const record: Record<string, unknown> = {};
      for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
        record[entryKey] = backfillKeyValueEntry({ valueField: field.value, value: entryValue });
      }
      result[key] = record;
    }
```

#### packages/core/src/fields/array/utils.test.ts
1 edit — new test inside `describe("assignArrayItemIds", ...)`, anchored after "backfills ids on an
array of groups nested inside a group":

```ts
  it("backfills ids on a group nested inside a keyValue field's value", () => {
    const fields = {
      scores: keyValue({ value: array({ items: group({ fields: { label: text() } }) }) }),
    };
    const result = assignArrayItemIds({
      fields,
      data: { scores: { alpha: [{ label: "a" }] } },
    });
    const scores = result.scores as Record<string, { label: string; id: string }[]>;
    expect(scores.alpha![0]!.id).toEqual(expect.any(String));
  });
```

Add `import { keyValue } from "../keyValue";` beside the existing `import { group } from "../group";`.

#### packages/core/src/fields/blocks/utils.ts
1 edit — `cloneNestedBlockIds` gets a `keyValue` case, mirroring its existing `group`/`array` branches.
Anchored beside the `ADMIN_FIELDS.array.type` branch:

```ts
  if (field.type === ADMIN_FIELDS.array.type) {
    return (value as unknown[]).map((item) => cloneNestedBlockIds({ value: item, field: field.items }));
  }
  if (field.type === ADMIN_FIELDS.keyValue.type) {
    const recordValue = (value ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(recordValue)) {
      result[entryKey] = cloneNestedBlockIds({ value: entryValue, field: field.value });
    }
    return result;
  }
  return value;
```

#### packages/core/src/fields/blocks/utils.test.ts
1 edit — new test inside `describe("cloneBlockWithFreshIds", ...)`, anchored after "regenerates ids
on a nested blocks field's own items":

```ts
  it("regenerates ids nested inside a keyValue field's value", () => {
    const nestedBlock = defineBlock({
      slug: "gallery",
      label: "Gallery",
      fields: { items: keyValue({ value: blocks({ blocks: [itemBlock] }) }) },
    });
    const block: GenericBlock = {
      id: "orig",
      blockType: "gallery",
      items: { featured: [{ id: "child-orig", blockType: "item", label: "a" }] },
    };
    const cloned = cloneBlockWithFreshIds({ block, blockDef: nestedBlock });
    const items = cloned.items as Record<string, GenericBlock[]>;
    expect(items.featured![0]!.id).not.toBe("child-orig");
  });
```

Add `import { keyValue } from "../keyValue";` beside the existing `import { group } from "../group";`.

#### packages/core/src/documents/cloneDocumentForDuplicate.ts
1 edit — `regenerateNestedIds` gets a `keyValue` case, mirroring its `group`/`array` branches.
Anchored beside the `ADMIN_FIELDS.array.type` branch:

```ts
  if (field.type === ADMIN_FIELDS.array.type) {
    return (value as unknown[]).map((item) => regenerateNestedIds({ value: item, field: field.items }));
  }
  if (field.type === ADMIN_FIELDS.keyValue.type) {
    const recordValue = (value ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [entryKey, entryValue] of Object.entries(recordValue)) {
      result[entryKey] = regenerateNestedIds({ value: entryValue, field: field.value });
    }
    return result;
  }
  return value;
```

#### packages/core/src/documents/cloneDocumentForDuplicate.test.ts
1 edit — new test, anchored after "regenerates block ids nested inside an array() field's items":

```ts
  it("regenerates block ids nested inside a keyValue() field's value", () => {
    const fields: Record<string, AdminField> = {
      content: keyValue({
        value: blocks({ blocks: [itemBlock] }),
      }),
    };
    const document = {
      content: { featured: [{ id: "orig", blockType: "item", label: "a" }] },
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const content = cloned.content as Record<string, { id: string }[]>;
    expect(content.featured![0]!.id).not.toBe("orig");
  });
```

Add `keyValue` to the existing `import { text, group, array, blocks, tabs, defineBlock, commitTs } from "../fields";` line.

#### packages/core/src/types/generateVexTypes.ts
1 edit — `hasRichTextField` gets a `keyValue` case, anchored beside its `array` branch:

```ts
function hasRichTextField(fields: Record<string, AdminField>): boolean {
  return Object.values(fields).some((field) => {
    if (field.type === ADMIN_FIELDS.richtext.type) return true;
    if (field.type === ADMIN_FIELDS.group.type) return hasRichTextField(field.fields);
    if (field.type === ADMIN_FIELDS.array.type) return hasRichTextField({ items: field.items });
    if (field.type === ADMIN_FIELDS.keyValue.type) return hasRichTextField({ value: field.value });
    if (field.type === ADMIN_FIELDS.blocks.type) {
      return field.blocks.some((block) => hasRichTextField(block.fields));
    }
    return false;
  });
}
```

#### packages/core/src/types/generateVexTypes.test.ts
1 edit — new test inside `describe("generateVexTypes — richtext import", ...)`, anchored after
"imports RichTextDocument when a richtext field is nested inside a group":

```ts
  it("imports RichTextDocument when a richtext field is nested inside a keyValue's value", () => {
    const config = defineServerConfig({
      config: defineConfig({
        collections: [
          defineCollection({
            slug: "pages",
            fields: { notes: keyValue({ label: "Notes", value: richtext({ label: "Body" }) }) },
          }),
        ],
      }),
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("RichTextDocument");
  });
});
```

Add `keyValue` to this file's existing field-function imports from `../index` (or wherever `group`/`richtext` are already imported for this file).

#### packages/core/src/collections/listView/listViewColumnConfig.ts
1 edit — `FIELD_TYPE_DEFAULT_WIDTH` is a `Record<DataFieldType, number>`; adding `keyValue` to
`ADMIN_FIELDS` forces a new entry here (exhaustiveness). Anchored beside `group: 200`:

```ts
  array: 200,
  group: 200,
  keyValue: 200,
  blocks: 240,
```

#### packages/telemetry/src/types.ts
1 edit — `AnonymizedField` gets `keyKind`, per the stitcher contract (naming shared with Step 11's
docs page). Anchored beside `defaultCollapsed?: boolean;`:

```ts
  defaultCollapsed?: boolean;
  keyKind?: "string" | "id";
  tabCount?: number;
```

#### packages/telemetry/src/anonymizeConfig.ts
1 edit — `anonymizeField`'s switch gets a `keyValue` case, recursing into `value` at `.v` (mirroring
array's `.i`, group/blocks' `.fN`/`.bN`). Anchored beside the `ADMIN_FIELDS.group.type` case:

```ts
    case ADMIN_FIELDS.group.type:
      context.fields.push({ ...dataFieldBase({ field, path, context }), defaultCollapsed: field.admin.defaultCollapsed });
      walkFields({ fields: field.fields, context, parentPath: path });
      return;
    case ADMIN_FIELDS.keyValue.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        keyKind: field.keys ? "id" : "string",
      });
      anonymizeField({ field: field.value, context, path: `${path}.v` });
      return;
```

#### packages/telemetry/src/anonymizeConfig.test.ts
1 edit — a new describe block, anchored after `describe("anonymizeConfig — array and tabs paths", ...)`'s
closing `});`, before `describe("anonymizeConfig — depth budget", ...)`:

```ts
describe("anonymizeConfig — keyValue", () => {
  it("records keyKind: \"string\" by default and paths the value at .v", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: { scores: keyValue({ value: number({ required: true }) }) },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    const keyValueField = output.fields.find((field) => field.path === "c1.f1")!;
    expect(keyValueField.type).toBe("keyValue");
    expect(keyValueField.keyKind).toBe("string");
    expect(output.fields.find((field) => field.path === "c1.f1.v" && field.type === "number")).toBeDefined();
  });

  it("records keyKind: \"id\" when keys.collection is set", () => {
    const collection = defineCollection({
      slug: "posts",
      timestamps: false,
      fields: {
        userScores: keyValue({
          keys: { collection: { slug: "secretProjectClients" } },
          value: number({ required: true }),
        }),
      },
    });
    const config = defineServerConfig({ config: defineConfig({ collections: [collection] }) });

    const output = anonymizeConfig({ config });

    expect(output.fields.find((field) => field.path === "c1.f1")!.keyKind).toBe("id");
  });
});
```

Add `keyValue` to this file's existing `@vexcms/core` import list.

#### packages/react/src/fields/keyValue/Field.tsx
New file. The id-key control reuses the existing, stable `RelationshipEmpty`/`RelationshipFilledState`/
`RelationshipPicker` presentational components directly (driven by local row state, not a form field) —
this sidesteps any dependency on Step 5's exact scalar-relationship `FieldAdmin` wiring, which isn't on
disk yet, since those three components already take plain `docIds: string[]`/callback props regardless
of how the OUTER field stores its own value.

```tsx
"use client";

import { useMemo, useState } from "react";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import {
  relationship,
  VERSION_STATUSES,
  type AdminDataField,
  type FieldComponentProps,
  type KeyValueField as KeyValueFieldDef,
  type VexVersionStatus,
} from "@vexcms/core";
import { KeyValueField, useFieldContext } from "../../forms";
import { useVexConfig } from "../../config/VexConfigContext";
import { Input } from "../../ui/input";
import { fieldToFieldComponent } from "../registry";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { RelationshipEmpty, RelationshipFilledState, RelationshipPicker } from "../relationship";

/**
 * String-keyed row's key control — a plain text input, no registry dispatch
 * (a record key is a scalar string, not itself an `AdminDataField`).
 */
function KeyValueStringKeyControl(props: {
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  duplicate: boolean;
}) {
  return (
    <div>
      <Input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={props.readOnly}
        aria-invalid={props.duplicate}
        placeholder="Key"
      />
      {props.duplicate && <p className="text-xs text-destructive">Duplicate key</p>}
    </div>
  );
}

/**
 * Id-keyed row's key control — reuses the relationship field's own
 * empty/filled/picker presentational components against a synthetic,
 * always-single `relationship()` field def built from `fieldDef.keys.collection`,
 * driven entirely by local row state (no TanStack field, no nuqs modal
 * state — a row picker is ephemeral per-session UI, not a deep-linkable
 * target, unlike the top-level relationship field's own picker).
 */
function KeyValueIdKeyControl(props: {
  collectionSlug: string;
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  documentStatus: VexVersionStatus | undefined;
  duplicate: boolean;
}) {
  const config = useVexConfig();
  const [isOpen, setIsOpen] = useState(false);
  const relationshipFieldDef = useMemo(
    () => relationship({ collection: { slug: props.collectionSlug }, required: true }),
    [props.collectionSlug],
  );
  const targetCollection = config.collections.find((c) => c.slug === props.collectionSlug);
  const drafts = props.documentStatus === VERSION_STATUSES.draft.key;

  if (!targetCollection) {
    return (
      <p className="text-xs text-destructive">
        Unknown collection: <code>{props.collectionSlug}</code>
      </p>
    );
  }

  const docIds = props.value ? [props.value] : [];

  return (
    <div>
      {docIds.length === 0 ? (
        <RelationshipEmpty
          fieldDef={relationshipFieldDef}
          targetCollection={targetCollection}
          readOnly={props.readOnly}
          onPickerOpen={() => setIsOpen(true)}
        />
      ) : (
        <RelationshipFilledState
          fieldDef={relationshipFieldDef}
          targetCollection={targetCollection}
          docIds={docIds}
          drafts={drafts}
          readOnly={props.readOnly}
          onRemove={() => props.onChange("")}
          onClear={() => props.onChange("")}
          openPicker={() => setIsOpen(true)}
        />
      )}
      {isOpen && (
        <RelationshipPicker
          fieldDef={relationshipFieldDef}
          targetCollection={targetCollection}
          selectedIds={docIds}
          drafts={drafts}
          onSelect={(ids) => {
            setIsOpen(false);
            props.onChange(ids[0] ?? "");
          }}
          onCancel={() => setIsOpen(false)}
        />
      )}
      {props.duplicate && <p className="text-xs text-destructive">Duplicate key</p>}
    </div>
  );
}

/**
 * One row's value control — the value field's own registry component
 * (`fieldToFieldComponent`, same dispatch `PrimitiveArrayItemControl` uses),
 * bound through a tiny per-row scratch `useForm()` instance rather than the
 * real outer field: a record's entries are addressed by arbitrary user-typed
 * keys, which can contain the `.`/`[`/`]` characters TanStack Form's own
 * path parser splits on, so the value can never be bound at a real path
 * composed from the key. The scratch form's single field is named `rowId`
 * (a `crypto.randomUUID()` — safe, globally-unique, dot/bracket-free), and
 * `AdminFieldBinding`'s existing `field` escape hatch (documented for "an
 * explicit field instance... outside the normal admin wiring") provides it
 * directly. A `listeners.onChange` propagates every edit back to
 * `useKeyValueRows`, which recomputes the real `Record<K, V>` and commits it
 * to the outer field — this scratch form never submits anything itself.
 *
 * KNOWN GAP: nested per-row validation errors are not wired — only the
 * keyValue field's OWN aggregate error (shown under the whole field) exists
 * in this version. An external reset of the outer field's value mid-edit
 * (e.g. a full-form "discard changes") is not reflected back into an
 * already-mounted row's scratch form, mirroring `useArrayItems`' own
 * synthetic-key tracking, which has the same limitation for anything other
 * than its own mutators.
 */
function KeyValueRowValueControl(props: {
  rowId: string;
  valueField: AdminDataField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly: boolean;
  collection: FieldComponentProps["collection"];
}) {
  const ValueFieldAdmin = fieldToFieldComponent(props.valueField.type);
  if (!ValueFieldAdmin) {
    throw new Error("invalid keyValue.value field type set");
  }
  const rowForm = useForm({ defaultValues: { [props.rowId]: props.value } });

  return (
    <rowForm.Field
      name={props.rowId}
      listeners={{ onChange: ({ value }) => props.onChange(value) }}
    >
      {(field) => (
        <AdminFieldBinding name={props.rowId} field={field}>
          <ValueFieldAdmin
            name={props.rowId}
            fieldDef={props.valueField}
            readOnly={props.readOnly}
            collection={props.collection}
          />
        </AdminFieldBinding>
      )}
    </rowForm.Field>
  );
}

/**
 * The keyValue field's own render body — reads the `FieldApi` the enclosing
 * `AdminFieldBinding` provides to drive the null toggle (nullable is a
 * container field per Step 2's contract) and maps `fieldDef` onto the app
 * form's `KeyValueField` row editor.
 *
 * @param props - {@link FieldComponentProps} narrowed to `KeyValueField`.
 * @returns The keyValue's `KeyValueField` body.
 */
function KeyValueFieldAdminInner(props: FieldComponentProps<{}, KeyValueFieldDef>) {
  const field = useFieldContext<Record<string, unknown> | null>();
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const valueFieldDef = props.fieldDef.value;

  function handleIsNullChange(isNull: boolean): void {
    field.handleChange(isNull ? null : {});
  }

  return (
    <KeyValueField<unknown>
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      index={props.index}
      readOnly={readOnly}
      entryLabel="Entry"
      pluralLabel="Entries"
      createValue={() => valueFieldDef.defaultValue}
      isNull={props.fieldDef.nullable ? field.state.value === null : undefined}
      onIsNullChange={props.fieldDef.nullable ? handleIsNullChange : undefined}
      renderKey={({ row, duplicate, onChange }) =>
        props.fieldDef.keys ? (
          <KeyValueIdKeyControl
            collectionSlug={props.fieldDef.keys.collection.slug}
            value={row.key}
            onChange={onChange}
            readOnly={readOnly}
            documentStatus={props.documentStatus}
            duplicate={duplicate}
          />
        ) : (
          <KeyValueStringKeyControl
            value={row.key}
            onChange={onChange}
            readOnly={readOnly}
            duplicate={duplicate}
          />
        )
      }
      renderValue={({ row, onChange }) => (
        <KeyValueRowValueControl
          rowId={row.rowId}
          valueField={valueFieldDef}
          value={row.value}
          onChange={onChange}
          readOnly={readOnly}
          collection={props.collection}
        />
      )}
    />
  );
}

/**
 * KeyValue admin field — binds `props.name` to the nearest `<AppForm>` (or
 * an explicit `field` prop) via `AdminFieldBinding`, then renders the app
 * form's `KeyValueField` row editor configured for this field instance.
 *
 * @param props - {@link FieldComponentProps} narrowed to `KeyValueField`.
 * @returns The app form's `KeyValueField`, configured for this field instance.
 */
export function KeyValueFieldAdmin(
  props: FieldComponentProps<{}, KeyValueFieldDef> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <KeyValueFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
```

#### packages/react/src/forms/KeyValueField.tsx
New file. `useKeyValueRows` (row mechanics: add/remove, per-row key/value editing, duplicate-key
detection, committing the full `Record<K, V>` back to the real field) is colocated here rather than
in its own `forms/useKeyValueRows.ts` — `forms/`'s `react-app-form` naming rule is a CLOSED set of
`*Field.tsx` leaves plus a short fixed list of named helper modules (`useArrayItems` is one; a new
hook needs its own rule update to land as a sibling file), and this hook has exactly one consumer.
Mirrors `forms/ArrayField.tsx`'s own split from `useArrayItems` in spirit, folded into one file since
the naming rule doesn't admit a second.

```tsx
"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { TrashIcon } from "lucide-react";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout } from "./FormFieldLayout";
import { Button } from "../ui/button";
import type { BaseFormFieldProps } from "./types";

/** The subset of a TanStack field the hook needs — a record-valued field. */
export interface KeyValueRowsField<TValue> {
  state: { value: Record<string, TValue> | null | undefined };
  handleChange: (value: Record<string, TValue>) => void;
}

/** One row — a stable identity (`rowId`) paired with its current key and value. */
export interface KeyValueRow<TValue> {
  rowId: string;
  key: string;
  value: TValue;
}

/** Options for {@link useKeyValueRows}. */
export interface UseKeyValueRowsOptions<TValue> {
  field: KeyValueRowsField<TValue>;
  /** Builds a new row's value for "Add". */
  createValue: () => TValue;
  /** Caps `atMax`/add growth; `undefined` means unbounded. */
  max?: number;
}

/** Return value of {@link useKeyValueRows}. */
export interface UseKeyValueRowsResult<TValue> {
  rows: KeyValueRow<TValue>[];
  atMax: boolean;
  /** Keys shared by two or more rows — every row sharing one is flagged. */
  duplicateKeys: ReadonlySet<string>;
  add: () => void;
  remove: (rowId: string) => void;
  setKey: (rowId: string, key: string) => void;
  setValue: (rowId: string, value: TValue) => void;
}

/**
 * Row-list mechanics for a `keyValue()` field: add/remove, per-row key/value
 * editing, duplicate-key detection, and committing the full `Record<K, V>`
 * back to the real field on every change. Rows are seeded ONCE from the
 * field's initial value (`Object.entries`, each entry assigned a stable
 * `crypto.randomUUID()` identity) and held as independent local state from
 * then on — the outer field's value is a WRITE target this hook owns, not a
 * value it continuously re-derives from, mirroring `useArrayItems`' own
 * synthetic-key cache.
 *
 * An empty-string key is a valid interim row state (not yet named) and is
 * excluded from the committed record; a later row with the SAME non-empty
 * key as an earlier one overwrites it in the committed record (ordinary
 * object-literal semantics) while both rows stay flagged via `duplicateKeys`
 * until resolved.
 *
 * @param options - {@link UseKeyValueRowsOptions}.
 * @returns {@link UseKeyValueRowsResult}.
 */
export function useKeyValueRows<TValue>(
  options: UseKeyValueRowsOptions<TValue>,
): UseKeyValueRowsResult<TValue> {
  const [rows, setRows] = useState<KeyValueRow<TValue>[]>(() =>
    Object.entries(options.field.state.value ?? {}).map(([key, value]) => ({
      rowId: crypto.randomUUID(),
      key,
      value: value as TValue,
    })),
  );

  function commit(nextRows: KeyValueRow<TValue>[]): void {
    setRows(nextRows);
    const record: Record<string, TValue> = {};
    for (const row of nextRows) {
      if (row.key === "") continue;
      record[row.key] = row.value;
    }
    options.field.handleChange(record);
  }

  function add(): void {
    commit([...rows, { rowId: crypto.randomUUID(), key: "", value: options.createValue() }]);
  }

  function remove(rowId: string): void {
    commit(rows.filter((row) => row.rowId !== rowId));
  }

  function setKey(rowId: string, key: string): void {
    commit(rows.map((row) => (row.rowId === rowId ? { ...row, key } : row)));
  }

  function setValue(rowId: string, value: TValue): void {
    commit(rows.map((row) => (row.rowId === rowId ? { ...row, value } : row)));
  }

  const keyCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.key === "") continue;
    keyCounts.set(row.key, (keyCounts.get(row.key) ?? 0) + 1);
  }
  const duplicateKeys = new Set(
    [...keyCounts.entries()].filter(([, count]) => count > 1).map(([key]) => key),
  );

  return {
    rows,
    atMax: options.max !== undefined && rows.length >= options.max,
    duplicateKeys,
    add,
    remove,
    setKey,
    setValue,
  };
}

/** Props for {@link KeyValueField}. */
export interface KeyValueFieldProps<TValue>
  extends Omit<BaseFormFieldProps<Record<string, TValue>>, "renderControl"> {
  /** Singular noun for the "Add <entryLabel>" button, e.g. `"Entry"`. */
  entryLabel: string;
  /** Plural noun for counts/empty state, e.g. `"Entries"`. */
  pluralLabel: string;
  max?: number;
  createValue: () => TValue;
  /** Renders one row's key control. */
  renderKey: (props: { row: KeyValueRow<TValue>; duplicate: boolean; onChange: (key: string) => void }) => ReactNode;
  /** Renders one row's value control. */
  renderValue: (props: { row: KeyValueRow<TValue>; onChange: (value: TValue) => void }) => ReactNode;
  /** Whether the field is currently toggled to `null` (Step 2's nullable-container contract). */
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
}

/**
 * A key/value row editor bound to the nearest `<form.AppField name="...">`.
 * No reorder — a record has no meaningful order of its own, unlike `ArrayField`.
 *
 * @param props - See {@link KeyValueFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled row list, add button, description and error.
 */
export function KeyValueField<TValue>(props: KeyValueFieldProps<TValue>): ReactNode {
  const field = useFieldContext<Record<string, TValue> | null>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const { rows, atMax, duplicateKeys, add, remove, setKey, setValue } = useKeyValueRows<TValue>({
    field: field as unknown as KeyValueRowsField<TValue>,
    createValue: props.createValue,
    max: props.max,
  });

  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      readOnly={props.readOnly}
      className={props.className}
      isNull={props.isNull}
      onIsNullChange={props.onIsNullChange}
    >
      <div className="flex flex-col gap-3 rounded-sm border-2 px-3 py-2">
        {rows.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li key={row.rowId} className="flex items-start gap-2">
                <div className="w-1/3 min-w-0">
                  {props.renderKey({
                    row,
                    duplicate: duplicateKeys.has(row.key),
                    onChange: (key) => setKey(row.rowId, key),
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  {props.renderValue({ row, onChange: (value) => setValue(row.rowId, value) })}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={Boolean(props.readOnly)}
                  onClick={() => remove(row.rowId)}
                  aria-label={`Remove ${props.entryLabel}`}
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No {props.pluralLabel.toLowerCase()} yet.</p>
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={Boolean(props.readOnly) || atMax}
            variant="outline"
            size="sm"
            onClick={add}
            icon="Plus"
          >
            Add {props.entryLabel}
          </Button>
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {props.max} {props.pluralLabel.toLowerCase()} reached
            </span>
          )}
        </div>
      </div>
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/KeyValueField.test.tsx
New file — `useKeyValueRows`' own unit tests, mirroring `useArrayItems.test.tsx`'s style (imported
from the merged `./KeyValueField` module now that the hook is colocated there).

```tsx
import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyValueRows, type KeyValueRowsField } from "./KeyValueField";

function makeField(initial: Record<string, number>): KeyValueRowsField<number> & {
  value: Record<string, number>;
} {
  const state = { value: { ...initial } };
  return {
    state,
    get value() {
      return state.value;
    },
    handleChange: (next) => {
      state.value = { ...next };
    },
  };
}

describe("useKeyValueRows", () => {
  it("seeds one row per entry of the field's initial value", () => {
    const field = makeField({ alpha: 1, beta: 2 });
    const { result } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows.map((row) => row.key).sort()).toEqual(["alpha", "beta"]);
  });

  it("adds a new empty-keyed row without touching the committed record yet", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    act(() => result.current.add());
    rerender();
    expect(result.current.rows).toHaveLength(2);
    expect(field.value).toEqual({ alpha: 1 });
  });

  it("commits a renamed row's key into the record", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    const rowId = result.current.rows[0]!.rowId;
    act(() => result.current.setKey(rowId, "renamed"));
    rerender();
    expect(field.value).toEqual({ renamed: 1 });
  });

  it("commits a changed value into the record", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    const rowId = result.current.rows[0]!.rowId;
    act(() => result.current.setValue(rowId, 99));
    rerender();
    expect(field.value).toEqual({ alpha: 99 });
  });

  it("removes a row from the committed record", () => {
    const field = makeField({ alpha: 1, beta: 2 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    const rowId = result.current.rows.find((row) => row.key === "alpha")!.rowId;
    act(() => result.current.remove(rowId));
    rerender();
    expect(field.value).toEqual({ beta: 2 });
  });

  it("flags two rows sharing a non-empty key as duplicates", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    act(() => result.current.add());
    rerender();
    const newRowId = result.current.rows[1]!.rowId;
    act(() => result.current.setKey(newRowId, "alpha"));
    rerender();
    expect(result.current.duplicateKeys.has("alpha")).toBe(true);
  });

  it("reports atMax once rows reach the configured max", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() =>
      useKeyValueRows({ field, createValue: () => 0, max: 1 }),
    );
    expect(result.current.atMax).toBe(true);
    rerender();
  });
});
```

#### packages/react/src/forms/index.ts
1 edit — beside `export { GroupField, type GroupFieldProps } from "./GroupField";`:

```ts
export { GroupField, type GroupFieldProps } from "./GroupField";
export {
  KeyValueField,
  useKeyValueRows,
  type KeyValueFieldProps,
  type UseKeyValueRowsOptions,
  type UseKeyValueRowsResult,
  type KeyValueRowsField,
  type KeyValueRow,
} from "./KeyValueField";
```

#### packages/react/src/fields/keyValue/Cell.tsx
New file.

```tsx
"use client";

import { type CellComponentProps, type KeyValueField, TDocument } from "@vexcms/core";
import { adminHref } from "../../admin/adminHref";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * KeyValue field cell component for the admin list-table view.
 *
 * Shows the entry count ("3 entries"/"1 entry"). Renders `—` when the value
 * is absent — NOT a flat serialization like `GroupFieldCell`'s, since a
 * record's size is the meaningful list-column summary.
 *
 * @param props - Component props.
 * @returns The entry count, or an em-dash placeholder when the value is absent.
 */
export function KeyValueFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<KeyValueField, TData>,
) {
  const value = props.value as Record<string, unknown> | null | undefined;
  const config = useVexConfig();

  if (value == null || typeof value !== "object") {
    return <span className="text-muted-foreground">—</span>;
  }

  const entryCount = Object.keys(value).length;
  const content = (
    <span>
      {entryCount} {entryCount === 1 ? "entry" : "entries"}
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink
      href={adminHref(
        { type: "document", slug: props.collection.slug, id: props.row.original._id },
        config.basePath,
      )}
    >
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/fields/keyValue/Display.tsx
New file.

```tsx
"use client";

import { isDisplayValueEmpty, type DisplayComponentProps, type KeyValueField, type TDocument } from "@vexcms/core";
import { fieldToDisplayComponent } from "../registry";

/**
 * KeyValue field read-only display, registered as `reactAdapter.fields.keyValue.display`.
 *
 * Shows every entry as `key → value`, with the value resolved through the
 * SAME `fieldToDisplayComponent` dispatch `ArrayFieldDisplay`/`GroupFieldDisplay`
 * use for their own nested values — NOT `KeyValueFieldCell`'s entry count,
 * which is a list-column concern.
 *
 * @param props - Component props.
 * @returns One labelled row per entry, or an em-dash when the value is absent.
 */
export function KeyValueFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<KeyValueField, TData>,
) {
  const value = (props.value ?? {}) as Record<string, unknown>;
  if (isDisplayValueEmpty(value)) {
    return <span className="text-muted-foreground">—</span>;
  }
  const ValueDisplay = fieldToDisplayComponent(props.field.value.type);
  return (
    <ul className="space-y-2">
      {Object.entries(value).map(([key, entryValue]) => (
        <li key={key} className="rounded-md border border-border/60 px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">{key}</p>
          {ValueDisplay ? (
            <ValueDisplay
              field={props.field.value}
              value={entryValue}
              document={props.document}
              collection={props.collection}
            />
          ) : (
            <span className="text-sm">
              {typeof entryValue === "object" ? JSON.stringify(entryValue) : String(entryValue)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
```

#### packages/react/src/fields/keyValue/columnDef.tsx
New file.

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, KeyValueField, TDocument } from "@vexcms/core";
import { KeyValueFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a keyValue field.
 *
 * Sorting is disabled — keyValue fields store records, not meaningfully
 * sortable by Convex indexes.
 *
 * @param props - Column generation props.
 * @returns TanStack Table column definition.
 */
export function keyValueFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: KeyValueField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as Record<string, unknown>;
      return (
        <KeyValueFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    enableSorting: false,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

#### packages/react/src/fields/keyValue/testFixture.ts
New file.

```ts
import { keyValue, number, type KeyValueField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * `keyValue` field fixture — the container's OWN contract. A single
 * `number()` value field keeps this fixture's own round-trip generic;
 * nested-child coverage across every field type lives in
 * `runNestedFieldContainerSuite`, not here.
 *
 * `invalid`'s `_bad` key fails `isValidRecordKey`'s reserved-prefix check
 * inside `keyValueFieldToInputSchema`'s `z.record(...)` — the field itself
 * doesn't need `required: true` for this to be a real validation failure.
 */
export const keyValueFieldFixture: FieldFixture<KeyValueField, Record<string, number>> = {
  fieldType: "keyValue",
  fieldDef: keyValue({ label: "Scores", value: number({ label: "Score", required: true }) }),
  valid: { alpha: 1 },
  invalid: { _bad: 1 },
  empty: {},
};
```

#### packages/react/src/fields/keyValue/index.ts
New file.

```ts
export * from "./Field";
export * from "./Cell";
export * from "./columnDef";
export * from "./Display";
```

#### packages/react/src/fields/keyValue/Cell.test.tsx
New file.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { makeCellRow, withCellConfig } from "../../testing/harness/accessFixtures";
import { keyValueFieldFixture } from "./testFixture";
import { KeyValueFieldCell } from "./Cell";
import type { TDocument } from "@vexcms/core";

describe("KeyValueFieldCell", () => {
  it("renders an em-dash when the value is absent", () => {
    const row = makeCellRow<TDocument>({ fieldKey: "field", value: undefined });
    render(
      withCellConfig(
        <KeyValueFieldCell
          value={undefined as unknown as Record<string, number>}
          row={row}
          collection={keyValueFieldFixture.fieldDef as never}
          fieldDef={keyValueFieldFixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
        />,
      ),
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the singular 'entry' for exactly one key", () => {
    const row = makeCellRow<TDocument>({ fieldKey: "field", value: { alpha: 1 } });
    render(
      withCellConfig(
        <KeyValueFieldCell
          value={{ alpha: 1 }}
          row={row}
          collection={keyValueFieldFixture.fieldDef as never}
          fieldDef={keyValueFieldFixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
        />,
      ),
    );
    expect(screen.getByText("1 entry")).toBeInTheDocument();
  });

  it("shows the plural 'entries' for two or more keys", () => {
    const row = makeCellRow<TDocument>({ fieldKey: "field", value: { alpha: 1, beta: 2 } });
    render(
      withCellConfig(
        <KeyValueFieldCell
          value={{ alpha: 1, beta: 2 }}
          row={row}
          collection={keyValueFieldFixture.fieldDef as never}
          fieldDef={keyValueFieldFixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
        />,
      ),
    );
    expect(screen.getByText("2 entries")).toBeInTheDocument();
  });
});
```

Note: this mirrors `group/Cell.test.tsx`'s/`array/Cell.test.tsx`'s own `makeCellRow`/`withCellConfig`
harness usage exactly — re-read that file's real `collection`/`fieldDef` prop wiring before landing,
since `CellComponentProps.collection` wants a real `CollectionConfig`, not a field def; follow
whichever existing `Cell.test.tsx` casts/builds one.

#### packages/react/src/fields/keyValue/Display.test.tsx
New file.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { testCollection } from "../../testing/harness/accessFixtures";
import { keyValueFieldFixture } from "./testFixture";
import { KeyValueFieldDisplay } from "./Display";

describe("KeyValueFieldDisplay", () => {
  it("renders an em-dash when the value is empty", () => {
    render(
      <KeyValueFieldDisplay
        field={keyValueFieldFixture.fieldDef}
        value={{}}
        document={{} as never}
        collection={testCollection}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders every entry's key and its value field's own display", () => {
    render(
      <KeyValueFieldDisplay
        field={keyValueFieldFixture.fieldDef}
        value={{ alpha: 1, beta: 2 }}
        document={{} as never}
        collection={testCollection}
      />,
    );
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });
});
```

#### packages/react/src/fields/keyValue/columnDef.test.ts
New file.

```ts
import { describe, expect, it } from "vitest";
import { testCollection } from "../../testing/harness/accessFixtures";
import { keyValueFieldFixture } from "./testFixture";
import { keyValueFieldToColumnDef } from "./columnDef";

describe("keyValueFieldToColumnDef", () => {
  it("disables sorting — records are not index-sortable", () => {
    const columnDef = keyValueFieldToColumnDef({
      fieldDef: keyValueFieldFixture.fieldDef,
      fieldKey: "scores",
      collection: testCollection,
    });
    expect(columnDef.enableSorting).toBe(false);
  });

  it("uses the field key as both id and accessorKey", () => {
    const columnDef = keyValueFieldToColumnDef({
      fieldDef: keyValueFieldFixture.fieldDef,
      fieldKey: "scores",
      collection: testCollection,
    });
    expect(columnDef.id).toBe("scores");
    expect(columnDef.accessorKey).toBe("scores");
  });
});
```

#### packages/react/src/fields/keyValue/Field.test.tsx
New file — runs the shared field-input contract plus the row-editing behavior unique to keyValue.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { keyValueFieldFixture } from "./testFixture";
import { KeyValueFieldAdmin } from "./Field";
import { AppForm } from "../../forms";
import { testCollection } from "../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";

function KeyValueHarness(props: { initialValue: Record<string, number> }) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <KeyValueFieldAdmin
        name="testField"
        fieldDef={keyValueFieldFixture.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: keyValueFieldFixture,
  Component: KeyValueFieldAdmin,
  extra: () => {
    describe("keyValue field: rows", () => {
      it("adds a row and lets the new key be typed", async () => {
        const user = userEvent.setup();
        render(<KeyValueHarness initialValue={{}} />);
        await user.click(screen.getByRole("button", { name: "Add Entry" }));
        const keyInput = screen.getByPlaceholderText("Key");
        await user.type(keyInput, "alpha");
        expect(keyInput).toHaveValue("alpha");
      });

      it("flags two rows sharing the same key as duplicates", async () => {
        const user = userEvent.setup();
        render(<KeyValueHarness initialValue={{ alpha: 1 }} />);
        await user.click(screen.getByRole("button", { name: "Add Entry" }));
        const keyInputs = screen.getAllByPlaceholderText("Key");
        await user.type(keyInputs[1]!, "alpha");
        expect(screen.getAllByText("Duplicate key")).toHaveLength(2);
      });

      it("removes a row", async () => {
        const user = userEvent.setup();
        render(<KeyValueHarness initialValue={{ alpha: 1 }} />);
        const removeButton = screen.getByRole("button", { name: "Remove Entry" });
        await user.click(removeButton);
        expect(screen.queryByPlaceholderText("Key")).not.toBeInTheDocument();
      });
    });
  },
});
```

Note: re-read `runFieldInputContractSuite`'s real signature (`fixture`/`Component`/`extra`) and an
existing consumer (e.g. `group/Field.test.tsx`) before landing — the `extra` callback's exact
parameter shape (`{ fixture }` vs none) varies slightly by field type in the files read for this
section; match the real one.

#### packages/react/src/adapter.ts
2 edits.

**1 — import.** Beside the `GroupFieldAdmin, GroupFieldCell, GroupFieldDisplay,` import group:

```ts
  GroupFieldCell,
  GroupFieldAdmin,
  GroupFieldDisplay,
  KeyValueFieldCell,
  KeyValueFieldAdmin,
  KeyValueFieldDisplay,
```

**2 — fields map.** Beside the `[ADMIN_FIELDS.group.type]` entry:

```ts
      [ADMIN_FIELDS.group.type]: {
        field: GroupFieldAdmin,
        cell: GroupFieldCell,
        display: GroupFieldDisplay,
      },
      [ADMIN_FIELDS.keyValue.type]: {
        field: KeyValueFieldAdmin,
        cell: KeyValueFieldCell,
        display: KeyValueFieldDisplay,
      },
```

#### packages/react/src/fields/index.tsx
3 edits.

**1 — import.** Beside `import { groupFieldToColumnDef } from "./group";`:

```ts
import { groupFieldToColumnDef } from "./group";
import { keyValueFieldToColumnDef } from "./keyValue";
```

**2 — barrel.** Beside `export * from "./group";`:

```ts
export * from "./group";
export * from "./keyValue";
```

**3 — switch case.** Beside the `ADMIN_FIELDS.group.type` case:

```ts
      case ADMIN_FIELDS.group.type:
        columnDef = groupFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.keyValue.type:
        columnDef = keyValueFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;
```

`packages/react/src/index.ts` needs no change: `keyValue()` carries no React-bound component HKT
slot (same as `group()`/`array()`/`blocks()`), so apps import it directly from `@vexcms/core`, never
from `@vexcms/react` — confirmed against every existing `apps/test` collection file, none of which
import `group`/`array`/`blocks` from `@vexcms/react`.

#### packages/react/src/testing/fixtures/index.ts
2 edits.

**1 — import.** Beside `import { groupFieldFixture } from "../../fields/group/testFixture";`:

```ts
import { groupFieldFixture } from "../../fields/group/testFixture";
import { keyValueFieldFixture } from "../../fields/keyValue/testFixture";
```

**2 — registry entry.** Beside `group: groupFieldFixture,`:

```ts
  group: groupFieldFixture,
  keyValue: keyValueFieldFixture,
```

#### packages/react/src/testing/nestedFieldContainer.ts
4 edits — adds `"keyValue"` as a fourth container kind alongside `"array" | "group" | "blocks"`.
KeyValue's own form value matches document shape 1:1 (`Record<string, unknown>`), exactly like
group's, so its round-trip/readOnly-cascade assertions mirror group's branch.

**1 — import.** Beside `import { ... group, ... } from "@vexcms/core";`:

```ts
import {
  array,
  arrayItemLabel,
  arrayPluralLabel,
  blocks,
  defineBlock,
  defineConfig,
  group,
  keyValue,
  type AdminDataField,
  type DataFieldType,
  type CollectionConfig,
  type VexClientConfig,
} from "@vexcms/core";
```

**2 — options type.** Widen the `container` union:

```ts
export interface NestedFieldContainerOptions {
  container: "array" | "group" | "blocks" | "keyValue";
  Component: ComponentType<any>;
  childFieldTypes: DataFieldType[];
  fixtures?: Partial<Record<DataFieldType, FieldFixture>>;
}
```

**3 — field def + seeded value builders.** Beside `buildGroupFieldDef`:

```ts
function buildGroupFieldDef(childFixture: FieldFixture): AdminDataField {
  return group({ label: "Group", fields: { [CHILD_KEY]: childFixture.fieldDef } });
}

function buildKeyValueFieldDef(childFixture: FieldFixture): AdminDataField {
  return keyValue({ label: "Key Value", value: childFixture.fieldDef });
}
```

And in `buildSeededValue`'s switch:

```ts
function buildSeededValue(props: {
  container: NestedFieldContainerOptions["container"];
  childFixture: FieldFixture;
}): unknown {
  switch (props.container) {
    case "array":
      return [props.childFixture.valid];
    case "group":
    case "keyValue":
      return { [CHILD_KEY]: props.childFixture.valid };
    case "blocks":
      return [
        { id: "seed-block", blockType: BLOCK_SLUG, blockName: "Block", [CHILD_KEY]: props.childFixture.valid },
      ];
  }
}
```

**4 — suite dispatch.** In `runNestedFieldContainerSuite`, beside the `if (container === "group")` branch,
reusing its OWN round-trip/readOnly assertions (keyValue's form value is document-shaped exactly like
group's):

```ts
        if (container === "group" || container === "keyValue") {
          const fieldDef =
            container === "group" ? buildGroupFieldDef(childFixture) : buildKeyValueFieldDef(childFixture);

          it("round-trips a seeded value through the container's sub-field", () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { formRef } = renderContainer({ Component, fieldDef, readOnly: false, initialValue: seeded });
            expect(formRef.current?.state.values).toEqual({ [FIELD_NAME]: seeded });
          });

          it("cascades readOnly to the nested sub-field", async () => {
            const seeded = buildSeededValue({ container, childFixture });
            const { container: dom } = renderContainer({
              Component,
              fieldDef,
              readOnly: true,
              initialValue: seeded,
            });
            await act(async () => {});
            const controls = dom.querySelectorAll("button, input, select, textarea");
            expect(controls.length).toBeGreaterThan(0);
            controls.forEach((el) => {
              if (isDisclosureTrigger(el)) return;
              const inert =
                el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";
              expect(inert).toBe(true);
            });
          });
        } else if (container === "group") {
```

Re-read the real file before landing this edit: the existing `if (container === "group") { ... } else { ... }`
block (lines 284–513 in the version read for this section) runs MORE assertions for group than shown
above (an accordion-disclosure test, at minimum) — fold `keyValue` in by widening each `if`/condition
that is genuinely shared (document-shaped round-trip, readOnly cascade) and leaving group-only
assertions (e.g. anything keyed to the accordion/`GroupField` disclosure, which `KeyValueField` has no
equivalent of) under a `container === "group"`-only branch, rather than collapsing the whole block as
sketched here.

#### apps/test/src/vexcms/collections/storageShapes.ts
Existing file (created by Step 2, extended by Steps 3–7). 1 edit — add `scores`/`userScores` after
Step 7's `payload` field, and `keyValue` to the `@vexcms/core` import line.

```ts
import { /* …Step 2–7 imports…, */ keyValue } from "@vexcms/core";
```

```ts
      payload: bytes({ label: "Payload" }),
      scores: keyValue({
        label: "Scores",
        value: number({ label: "Score", required: true }),
      }),
      userScores: keyValue({
        label: "User Scores",
        keys: { collection: { slug: TABLE_SLUG_USERS } },
        value: number({ label: "Score", required: true }),
      }),
```

`TABLE_SLUG_USERS` and `number` are already imported by earlier steps (`nullableCount`/`viewCount`/
`ownerId` already use them).

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`;
`pnpm --filter test vex:generate` — `convex/vex.schema.ts` shows `scores: v.optional(v.record(v.string(), v.number()))`
and `userScores: v.optional(v.record(v.id("user"), v.number()))`; `vex.types.ts` shows
`scores?: Record<string, number>` and `userScores?: Record<Id<"user">, number>`; `pnpm typecheck`.

### Step 9 — `variant()` [agent]

> Stitcher note: Step 8 lands first and extends the same walkers this step edits (`fields/array/utils.ts`,
> `fields/blocks/utils.ts`, `documents/cloneDocumentForDuplicate.ts`, `types/generateVexTypes.ts`,
> `fields/interfaceGen.ts`, `db/depth.ts`, `db/populate.ts`, `testing/nestedFieldContainer.ts`). Apply this step's
> `variant` cases next to Step 8's `keyValue` cases, and make both recurse into each other so a `variant`
> nested in a `keyValue` value (and a `keyValue` inside a variant member) is walked. The anchors below were
> written before Step 8's edits existed; re-anchor against the file as it stands.

> Writer note: `spec-tasks.md`'s checklist line for this step ("core walkers as in step 8") undersells
> the real blast radius. Grepping every `ADMIN_FIELDS.blocks.type` branch (as the task instructs)
> surfaces TEN sites outside the "getDataFields/conditions/depth/populate/interface gen/validate/
> removeVexFields/clone/nestedFieldContainer" list, several of which are exhaustive `never`-checked
> switches that fail to compile the moment `VariantField` joins the `AdminField` union:
> `packages/react/src/fields/index.tsx`'s `getCollectionColumnDefs` switch, `packages/core/src/
> documents/cloneDocumentForDuplicate.ts`'s `regenerateNestedIds`, `packages/core/src/fields/blocks/
> utils.ts`'s private `cloneNestedBlockIds` (an near-identical duplicate of the former — both needed
> a case), `packages/core/src/types/generateVexTypes.ts`'s `hasRichTextField`, and `packages/core/src/
> globals/interfaceGen.ts` (the globals mirror of `collections/interfaceGen.ts`). All are handled
> below. Two were confirmed to need **no** edit despite branching on `blocks`/`group` elsewhere in the
> same package: `fields/validate.ts` (`validateFields` only ever runs a TOP-LEVEL field's own
> `validate()` — never recurses into a container's children, so `variant` is already covered the same
> way `blocks`/`group` already are) and `versions/removeVexFields.ts` (flat top-level key stripping
> only, no container recursion exists today for ANY type). `getDataFields` itself also needs no new
> branch — `variant` is `kind: "data"`, already handled by that function's generic kind check.
>
> Second finding: type-level populate support (`PopulateMapEntry`/`PopulateOptionForEntry`/
> `ApplyEntryPopulate`/`ContainerDepthPopulate`) is added for the **discriminated** mode only — the
> discriminator gives the type system a concrete literal to narrow on. A primitive variant's members
> can vary in shape in a way no conditional type can resolve from the stored union alone without the
> discriminant; the RUNTIME walkers (`db/depth.ts`, `db/populate.ts`) handle both modes, so populate
> still *works* for a primitive variant at runtime, it's just untyped (`unknown`) at the call site —
> the same gap a bare `json()` field already has today.
>
> Third, `packages/react/src/index.ts`'s root barrel does **not** re-export every field's config
> function or resolved type despite `adding-a-field-type.md` step 17 saying so — `blocks`, `group`,
> `array`, `upload`, `richtext`, `commitTs` and `color` are all absent from both of its re-export
> lists today. `variant` is left out too, for consistency with that observed (if undocumented)
> precedent rather than the stale doc.

**Verify:** `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`; `pnpm --filter test vex:generate` then read `storage_shapes` in `convex/vex.schema.ts` for `v.union(...)` on `channel`/`amount` and `vex.types.ts` for the TS unions; `pnpm typecheck`.

#### packages/core/src/fields/variant/types.ts

New module — the field's input/resolved types, two modes.

```ts
import { ADMIN_FIELDS } from "../constants";
import {
  BaseField,
  BaseFieldInput,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldValidateProps,
} from "../baseTypes";
import type { AdminDataField, AdminField } from "../types";
import type { VexResourceSlug } from "../../types/generated";

/** Picker style for a `variant()` field's type switcher. */
export const VARIANT_DISPLAYS = {
  select: "select",
  segmented: "segmented",
} as const;

/** `"select" | "segmented"` — see {@link VARIANT_DISPLAYS}. */
export type VariantDisplay = (typeof VARIANT_DISPLAYS)[keyof typeof VARIANT_DISPLAYS];

/** Per-type `admin` input for `variant()` — adds `display`. */
export interface VariantFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /** How the variant/type picker renders. Default `"select"`. */
  display?: VariantDisplay;
}

/** Resolved per-type `admin` for `variant()`. */
export interface VariantFieldAdminConfig<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfig<TCollectionSlug> {
  display: VariantDisplay;
}

/**
 * One discriminated variant's own definition, passed inline under
 * `variant({ discriminator, variants: { [key]: ... } })`.
 */
export interface VariantMemberInput {
  /** Display label shown in the variant/type picker. Falls back to the variant's own key. */
  label?: string;
  /**
   * Fields that make up this variant's data shape. May not declare a key
   * equal to the field's own `discriminator` — `variant()` throws
   * `VexConfigError` if it does.
   */
  fields: Record<string, AdminField>;
}

/** Resolved counterpart of {@link VariantMemberInput}. */
export interface VariantMemberConfig {
  label?: string;
  fields: Record<string, AdminField>;
  /**
   * Computed TypeScript object-type string for this one variant — the
   * discriminator key as a literal, followed by its own fields, e.g.
   * `{ kind: "email"; address: string }`.
   */
  interfaceType: string;
}

/**
 * Configuration input for a DISCRIMINATED `variant()` field — an object
 * union keyed by `discriminator`, storing `v.union(v.object({ [discriminator]:
 * v.literal(key), ...fields }), ...)` (a single variant collapses to a bare
 * `v.object()`). No `id`/`blockName` keys are injected — unlike `blocks()`,
 * the stored shape is exactly the discriminator plus the variant's own fields.
 *
 * **Defaults applied by `variant()`:**
 * ```ts
 * {
 *   type:     "variant",
 *   label:    "",
 *   required: false,
 *   nullable: false,
 *   admin: { display: "select", hidden: false, readOnly: false, position: "main", width: "100%", cellAlignment: "left" },
 * }
 * ```
 *
 * @example
 * ```ts
 * channel: variant({
 *   label: "Notification channel",
 *   discriminator: "kind",
 *   variants: {
 *     email: { label: "Email", fields: { address: text({ required: true }) } },
 *     sms:   { label: "SMS",   fields: { phoneNumber: text({ required: true }) } },
 *   },
 * })
 * ```
 *
 * @see {@link PrimitiveVariantFieldInput} for the primitive-union mode
 * @see {@link DiscriminatedVariantField} for the resolved output type
 * @see {@link variant} for the config function
 */
export interface DiscriminatedVariantFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends Omit<BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>, "admin"> {
  admin?: VariantFieldAdminInput<TCollectionSlug>;
  /** Property name stored on every variant, naming which one is active. */
  discriminator: string;
  /** One entry per variant, keyed by its stored discriminant value. */
  variants: Record<string, VariantMemberInput>;
  /**
   * Optional TypeScript union alias name. When set, emits `export type
   * NotificationChannel = { kind: "email"; ... } | { kind: "sms"; ... }`
   * and the collection interface uses the alias instead of the inline union.
   */
  interfaceName?: string;
  defaultValue?: Record<string, unknown>;
  /** Server-only async validation with `value` typed as the stored object. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, Record<string, unknown>>): Promise<void> | void;
}

/** Resolved configuration for a discriminated `variant()` field. */
export interface DiscriminatedVariantField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.variant.type;
  admin: VariantFieldAdminConfig<TCollectionSlug>;
  discriminator: string;
  variants: Record<string, VariantMemberConfig>;
  interfaceName?: string;
  defaultValue?: Record<string, unknown>;
  validate?(props: FieldValidateProps<TCollectionSlug, Record<string, unknown>>): Promise<void> | void;
}

/**
 * Configuration input for a PRIMITIVE `variant()` field — no `discriminator`,
 * storing `v.union(...)` over each member's own validator directly (a single
 * member collapses to a bare validator). Members must resolve to distinct
 * runtime kinds — `VexConfigError` at config time otherwise.
 * @see {@link classifyVariantMemberKind}
 *
 * @example
 * ```ts
 * amount: variant({
 *   label: "Amount",
 *   variants: { fixed: text({ required: true }), metered: number({ required: true }) },
 * })
 * ```
 *
 * @see {@link DiscriminatedVariantFieldInput} for the discriminated mode
 * @see {@link PrimitiveVariantField} for the resolved output type
 * @see {@link variant} for the config function
 */
export interface PrimitiveVariantFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends Omit<BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>, "admin"> {
  admin?: VariantFieldAdminInput<TCollectionSlug>;
  discriminator?: undefined;
  /**
   * One member per variant, keyed by its display name. Each is any
   * `AdminDataField` — its own `required` is ignored (`variant()` forces
   * `required: true` on every member: a union branch can never itself be
   * `v.optional()`).
   */
  variants: Record<string, AdminDataField>;
  interfaceName?: string;
  defaultValue?: unknown;
  /** Server-only async validation. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, unknown>): Promise<void> | void;
}

/** Resolved configuration for a primitive `variant()` field. */
export interface PrimitiveVariantField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.variant.type;
  admin: VariantFieldAdminConfig<TCollectionSlug>;
  discriminator?: undefined;
  variants: Record<string, AdminDataField>;
  interfaceName?: string;
  defaultValue?: unknown;
  validate?(props: FieldValidateProps<TCollectionSlug, unknown>): Promise<void> | void;
}

/** Configuration input for a `variant()` field — discriminated or primitive. @see {@link DiscriminatedVariantFieldInput} @see {@link PrimitiveVariantFieldInput} */
export type VariantFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> =
  | DiscriminatedVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>
  | PrimitiveVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>;

/** Resolved configuration for a `variant()` field — discriminated or primitive. @see {@link DiscriminatedVariantField} @see {@link PrimitiveVariantField} */
export type VariantField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> = DiscriminatedVariantField<TCollectionSlug, TFieldMeta> | PrimitiveVariantField<TCollectionSlug, TFieldMeta>;
```

#### packages/core/src/fields/variant/utils.ts

New module — the runtime-kind classifiers the primitive mode's distinctness check (config time) and
active-member recovery (React load, `db/populate.ts` routing) both share, plus the default-value
builder the picker uses on switch/reset.

```ts
import { ADMIN_FIELDS } from "../constants";
import { isInt64NumberField } from "../number/utils";
import { getDataFields } from "../utils";
import type { AdminDataField } from "../types";
import type { VariantMemberConfig } from "./types";

/** Runtime JS type a variant member's stored value takes on. */
export const VARIANT_MEMBER_KINDS = {
  string: "string",
  number: "number",
  bigint: "bigint",
  boolean: "boolean",
  bytes: "bytes",
  array: "array",
  object: "object",
  unknown: "unknown",
} as const;

/** One of {@link VARIANT_MEMBER_KINDS}. */
export type VariantMemberKind = (typeof VARIANT_MEMBER_KINDS)[keyof typeof VARIANT_MEMBER_KINDS];

/**
 * Classifies the runtime kind a primitive `variant()` member's STORED value
 * takes on, from its field config — the check `variant()` uses to reject two
 * members sharing a kind, and to reject `json()` (whose stored shape is
 * unknowable ahead of time) outright.
 *
 * `number()`'s `Int64NumberField` variant (`isInt64NumberField`, Step 3) classifies as
 * `"bigint"`, not `"number"`. `select()`/`relationship()`/`upload()` classify as `"string"`
 * only when scalar-stored (`field.schema !== undefined`, Steps 4/5) — otherwise (the
 * non-breaking array-storage default) they classify as `"array"`, same as a bare `array()`.
 *
 * @param props.field - The member's resolved field definition.
 * @returns One of {@link VARIANT_MEMBER_KINDS}; `"unknown"` for a field whose
 *   stored shape cannot be classified ahead of time (`json()`, or a nested
 *   primitive `variant()`, whose own members may themselves vary in kind).
 */
export function classifyVariantMemberKind(props: { field: AdminDataField }): VariantMemberKind {
  const { field } = props;
  switch (field.type) {
    case ADMIN_FIELDS.text.type:
    case ADMIN_FIELDS.email.type:
    case ADMIN_FIELDS.textarea.type:
    case ADMIN_FIELDS.url.type:
    case ADMIN_FIELDS.color.type:
      return VARIANT_MEMBER_KINDS.string;
    case ADMIN_FIELDS.number.type:
      return isInt64NumberField(field) ? VARIANT_MEMBER_KINDS.bigint : VARIANT_MEMBER_KINDS.number;
    case ADMIN_FIELDS.checkbox.type:
      return VARIANT_MEMBER_KINDS.boolean;
    case ADMIN_FIELDS.date.type:
    case ADMIN_FIELDS.commitTs.type:
      return VARIANT_MEMBER_KINDS.number;
    case ADMIN_FIELDS.select.type:
    case ADMIN_FIELDS.relationship.type:
    case ADMIN_FIELDS.upload.type:
      return !field.hasMany && field.schema !== undefined
        ? VARIANT_MEMBER_KINDS.string
        : VARIANT_MEMBER_KINDS.array;
    case ADMIN_FIELDS.array.type:
    case ADMIN_FIELDS.blocks.type:
    case ADMIN_FIELDS.richtext.type:
      return VARIANT_MEMBER_KINDS.array;
    case ADMIN_FIELDS.group.type:
    case ADMIN_FIELDS.keyValue.type:
      return VARIANT_MEMBER_KINDS.object;
    case ADMIN_FIELDS.bytes.type:
      return VARIANT_MEMBER_KINDS.bytes;
    case ADMIN_FIELDS.variant.type:
      return field.discriminator !== undefined ? VARIANT_MEMBER_KINDS.object : VARIANT_MEMBER_KINDS.unknown;
    default:
      return VARIANT_MEMBER_KINDS.unknown;
  }
}

/**
 * Classifies a primitive `variant()`'s STORED VALUE at runtime — the
 * active-member lookup the admin form (on load) and `db/populate.ts`'s
 * variant routing both use. A nullish value is its own kind (a nullable
 * member's cleared value), never collapsed into one of the data kinds.
 *
 * @param value - The field's current stored/form value.
 * @returns One of {@link VARIANT_MEMBER_KINDS}, or `"null"` for a nullish value.
 */
export function classifyVariantValueKind(value: unknown): VariantMemberKind | "null" {
  if (value === null || value === undefined) return "null";
  if (value instanceof ArrayBuffer) return VARIANT_MEMBER_KINDS.bytes;
  if (Array.isArray(value)) return VARIANT_MEMBER_KINDS.array;
  if (typeof value === "bigint") return VARIANT_MEMBER_KINDS.bigint;
  if (typeof value === "number") return VARIANT_MEMBER_KINDS.number;
  if (typeof value === "boolean") return VARIANT_MEMBER_KINDS.boolean;
  if (typeof value === "string") return VARIANT_MEMBER_KINDS.string;
  if (typeof value === "object") return VARIANT_MEMBER_KINDS.object;
  return VARIANT_MEMBER_KINDS.unknown;
}

/**
 * Builds the default value for a discriminated variant's member when the
 * admin picker switches to it (or resets a cleared field) — the discriminator
 * literal plus each sub-field initialised to its own `defaultValue` (or
 * `null`). Mirrors `blocks/utils.ts`'s `buildDefaultBlock`.
 *
 * @param props.discriminator - The field's own `discriminator` property name.
 * @param props.key - The variant's own key (the discriminant value to write).
 * @param props.member - The resolved variant member to build defaults for.
 * @returns A new object: `{ [discriminator]: key, ...subFieldDefaults }`.
 */
export function buildDefaultVariantMember(props: {
  discriminator: string;
  key: string;
  member: VariantMemberConfig;
}): Record<string, unknown> {
  const dataFields = getDataFields({ fields: props.member.fields });
  const fieldDefaults = Object.fromEntries(
    Object.entries(dataFields).map(([key, subField]) => [key, subField.defaultValue ?? null]),
  );
  return { [props.discriminator]: props.key, ...fieldDefaults };
}
```

#### packages/core/src/fields/variant/config.ts

New module — `variant()` itself: two overloads dispatching to a discriminated or primitive builder,
each applying defaults and the config-time checks.

```ts
import { ADMIN_FIELDS } from "../constants";
import { childInterfaceType } from "../childInterfaceType";
import { VexConfigError } from "../../errors";
import { BaseFieldMeta } from "../types";
import { getDataFields, resolveFieldComponents } from "../utils";
import { classifyVariantMemberKind, VARIANT_MEMBER_KINDS, buildDefaultVariantMember } from "./utils";
import { VARIANT_DISPLAYS } from "./types";
import type {
  DiscriminatedVariantField,
  DiscriminatedVariantFieldInput,
  PrimitiveVariantField,
  PrimitiveVariantFieldInput,
  VariantField,
  VariantFieldInput,
  VariantMemberConfig,
} from "./types";
import type { AdminField, AdminDataField } from "../types";
import type { VexResourceSlug } from "../../types/generated";

function buildVariantMemberInterfaceType(props: {
  discriminator: string;
  key: string;
  fields: Record<string, AdminField>;
}): string {
  const discriminatorEntry = `${props.discriminator}: "${props.key}"`;
  const userEntries = Object.entries(getDataFields({ fields: props.fields }))
    .map(([key, field]) => `${key}${field.required ? "" : "?"}: ${childInterfaceType(field)}`)
    .join("; ");
  return userEntries ? `{ ${discriminatorEntry}; ${userEntries} }` : `{ ${discriminatorEntry} }`;
}

function buildDiscriminatedVariantInterfaceType(props: {
  variants: Record<string, VariantMemberConfig>;
  interfaceName?: string;
}): string {
  if (props.interfaceName) return props.interfaceName;
  const members = Object.values(props.variants).map((member) => member.interfaceType);
  return members.length > 0 ? members.join(" | ") : "never";
}

function buildPrimitiveVariantInterfaceType(props: {
  variants: Record<string, AdminDataField>;
  interfaceName?: string;
}): string {
  if (props.interfaceName) return props.interfaceName;
  const members = Object.values(props.variants).map((member) => childInterfaceType(member));
  return members.length > 0 ? members.join(" | ") : "never";
}

function buildDiscriminatedVariant<
  TCollectionSlug extends VexResourceSlug,
  TFieldMeta extends BaseFieldMeta,
>(
  options: DiscriminatedVariantFieldInput<TCollectionSlug, string, TFieldMeta>,
): DiscriminatedVariantField<TCollectionSlug, TFieldMeta> {
  const variants: Record<string, VariantMemberConfig> = {};
  for (const [key, member] of Object.entries(options.variants)) {
    if (options.discriminator in member.fields) {
      throw new VexConfigError(
        `variant(): variant "${key}" declares a field named "${options.discriminator}", which is this ` +
          `field's own discriminator key. Rename the field, or the discriminator.`,
      );
    }
    variants[key] = {
      label: member.label,
      fields: member.fields,
      interfaceType: buildVariantMemberInterfaceType({
        discriminator: options.discriminator,
        key,
        fields: member.fields,
      }),
    };
  }

  const firstKey = Object.keys(variants)[0];
  const defaultValue =
    options.defaultValue ??
    (firstKey !== undefined
      ? buildDefaultVariantMember({ discriminator: options.discriminator, key: firstKey, member: variants[firstKey]! })
      : undefined);

  return {
    type: ADMIN_FIELDS.variant.type,
    interfaceType: buildDiscriminatedVariantInterfaceType({ variants, interfaceName: options.interfaceName }),
    label: options.label ?? "",
    required: options.required ?? false,
    nullable: options.nullable ?? false,
    defaultValue,
    discriminator: options.discriminator,
    variants,
    interfaceName: options.interfaceName,
    index: options.index,
    description: options.description,
    interfaceDescription: options.interfaceDescription,
    dependsOn: options.dependsOn,
    validate: options.validate,
    admin: {
      display: options.admin?.display ?? VARIANT_DISPLAYS.select,
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: { ...options.meta } as TFieldMeta,
  };
}

function buildPrimitiveVariant<
  TCollectionSlug extends VexResourceSlug,
  TFieldMeta extends BaseFieldMeta,
>(
  options: PrimitiveVariantFieldInput<TCollectionSlug, string, TFieldMeta>,
): PrimitiveVariantField<TCollectionSlug, TFieldMeta> {
  const membersByKind = new Map<string, string[]>();
  const variants: Record<string, AdminDataField> = {};
  for (const [key, member] of Object.entries(options.variants)) {
    const kind = classifyVariantMemberKind({ field: member });
    if (kind === VARIANT_MEMBER_KINDS.unknown) {
      throw new VexConfigError(
        `variant(): member "${key}" (type "${member.type}") has no distinguishable runtime storage kind ` +
          `and cannot be used in a primitive variant() — give the field a "discriminator" to build an ` +
          `object union instead.`,
      );
    }
    membersByKind.set(kind, [...(membersByKind.get(kind) ?? []), key]);
    variants[key] = { ...member, required: true };
  }
  for (const [kind, members] of membersByKind) {
    if (members.length > 1) {
      throw new VexConfigError(
        `variant(): members ${members.map((m) => `"${m}"`).join(", ")} all store a "${kind}" value at ` +
          `runtime — primitive variant() members must have distinct runtime kinds so the active member ` +
          `can be recovered from the stored value alone.`,
      );
    }
  }

  const firstKey = Object.keys(variants)[0];
  const defaultValue = options.defaultValue ?? (firstKey !== undefined ? variants[firstKey]!.defaultValue : undefined);

  return {
    type: ADMIN_FIELDS.variant.type,
    interfaceType: buildPrimitiveVariantInterfaceType({ variants, interfaceName: options.interfaceName }),
    label: options.label ?? "",
    required: options.required ?? false,
    nullable: options.nullable ?? false,
    defaultValue,
    variants,
    interfaceName: options.interfaceName,
    index: options.index,
    description: options.description,
    interfaceDescription: options.interfaceDescription,
    dependsOn: options.dependsOn,
    validate: options.validate,
    admin: {
      display: options.admin?.display ?? VARIANT_DISPLAYS.select,
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options?.admin,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: { ...options.meta } as TFieldMeta,
  };
}

/**
 * Creates a variant field with all defaults applied — a discriminated object
 * union (`options.discriminator` set) or a primitive union (unset).
 *
 * Discriminated: each variant's own `fields` becomes a `v.object()` keyed by
 * `discriminator` as a `v.literal()`, with no injected `id`/`blockName` keys
 * (unlike `blocks()`) — so an existing `v.union(v.object({ kind: v.literal(...) ,
 * ... }), ...)` column maps exactly. Primitive: each member is any
 * `AdminDataField`; members must resolve to distinct runtime storage kinds
 * (checked via `classifyVariantMemberKind`) and are never wrapped in
 * `v.optional()` regardless of their own `required`.
 *
 * @param options - Discriminated or primitive variant configuration.
 * @returns Resolved variant field definition with all defaults applied.
 *
 * @throws {VexConfigError} Discriminated: a variant's `fields` declares a key
 *   equal to `discriminator`.
 * @throws {VexConfigError} Primitive: a member's type has no distinguishable
 *   runtime kind (`json()`, or a nested primitive `variant()`), or two
 *   members share a kind.
 *
 * @example
 * ```ts
 * channel: variant({
 *   discriminator: "kind",
 *   variants: {
 *     email: { label: "Email", fields: { address: text({ required: true }) } },
 *     sms:   { label: "SMS",   fields: { phoneNumber: text({ required: true }) } },
 *   },
 * })
 * amount: variant({ variants: { fixed: text({ required: true }), metered: number({ required: true }) } })
 * ```
 *
 * @see {@link VariantFieldInput} for the full input type
 * @see {@link VariantField} for the resolved output type
 */
export function variant<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options: DiscriminatedVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): DiscriminatedVariantField<TCollectionSlug, TFieldMeta>;
export function variant<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options: PrimitiveVariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): PrimitiveVariantField<TCollectionSlug, TFieldMeta>;
export function variant<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options: VariantFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): VariantField<TCollectionSlug, TFieldMeta> {
  if (options.discriminator !== undefined) {
    return buildDiscriminatedVariant(options);
  }
  return buildPrimitiveVariant(options);
}
```

#### packages/core/src/fields/variant/validator.ts

New module.

```ts
import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import { getDataFields } from "../utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { VariantField } from "./types";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Converts a variant field definition to a Convex schema validator string.
 *
 * Discriminated: each variant becomes `v.object({ [discriminator]:
 * v.literal(key), ...subValidators })`; multiple variants combine with
 * `v.union()`, a single variant stays a bare `v.object()`. Primitive: each
 * member's own validator (never wrapped in `v.optional()` — `variant()`
 * already forced every member's own `required: true`) combines with
 * `v.union()`, or stays bare for a single member. The whole result is
 * wrapped in `v.optional(...)`/`v.nullable(...)` via `applyBaseValidators`
 * per the FIELD's own `required`/`nullable`.
 *
 * @param props.field - The resolved variant field definition.
 * @returns A Convex validator string.
 *
 * @example
 * ```ts
 * variantFieldToValidator({ field: channel })
 * // → 'v.union(\n  v.object({ kind: v.literal("email"), address: v.string() }),\n  v.object({ kind: v.literal("sms"), phoneNumber: v.string() })\n)'
 * variantFieldToValidator({ field: amount })
 * // → 'v.union(v.string(), v.number())'
 * ```
 *
 * @internal — Used by CLI schema generation via `adminFieldToValidator`.
 */
export function variantFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: VariantField<VexResourceSlug, TFieldMeta>;
}): string {
  const { field } = props;

  if (field.discriminator !== undefined) {
    const discriminator = field.discriminator;
    const memberObjects = Object.entries(field.variants).map(([key, member]) => {
      const subValidators = Object.entries(getDataFields({ fields: member.fields }))
        .map(([subKey, subField]) => `${subKey}: ${adminFieldToValidator({ field: subField })}`)
        .join(", ");
      const discriminatorEntry = `${discriminator}: v.literal("${key}")`;
      const allEntries = subValidators ? `${discriminatorEntry}, ${subValidators}` : discriminatorEntry;
      return `v.object({ ${allEntries} })`;
    });
    const validator =
      memberObjects.length === 1
        ? memberObjects[0]!
        : `v.union(\n${memberObjects.map((o) => `  ${o}`).join(",\n")}\n)`;
    return applyBaseValidators({ field, validator });
  }

  const memberValidators = Object.values(field.variants).map((member) => adminFieldToValidator({ field: member }));
  const validator = memberValidators.length === 1 ? memberValidators[0]! : `v.union(${memberValidators.join(", ")})`;
  return applyBaseValidators({ field, validator });
}

/**
 * Types a `variant()` field's `validate()` against a real collection and
 * `DataModel`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function variantValidator<TCollectionSlug extends CollectionSlug>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, unknown, VariantField>,
): FieldValidate<TCollectionSlug, unknown> {
  return fieldValidator<TCollectionSlug, unknown, VariantField>(slug, fn);
}
```

#### packages/core/src/fields/variant/inputSchema.ts

New module.

```ts
import * as z from "zod";
import type { ZodObject, ZodType } from "zod";
import { adminFieldToInputSchema } from "../inputSchemas";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { getDataFields, hasFieldConditions } from "../utils";
import type { VariantField, VariantMemberConfig } from "./types";
import type { VexResourceSlug } from "../../types/generated";

/**
 * Builds a Zod schema for validating a variant field value in the admin form.
 *
 * Discriminated: each variant becomes `z.object({ [discriminator]:
 * z.literal(key), ...subSchemas })`; multiple variants combine with
 * `z.discriminatedUnion(discriminator, [...])`, a single variant stays a bare
 * `z.object()`. When any variant's own `fields` declares an `admin.condition`
 * (mirroring `blocksFieldToInputSchema`'s own per-item re-parse), the base
 * schema is a loose object keyed only by `discriminator`, and a `superRefine`
 * re-parses the ACTUAL value through the matching variant's real,
 * condition-aware schema (built with the value itself as `siblingData`,
 * exactly like a block item). Primitive: each member's own schema (via
 * `adminFieldToInputSchema`) combines with `z.union()`, or stays bare for a
 * single member. `.default(field.defaultValue)` is attached for a
 * non-required field — `applyBaseInputSchemaMeta` never adds one itself.
 *
 * @param props.field - The resolved variant field definition.
 * @param props.ignoreRequired - Forwarded to every recursive
 *   `adminFieldToInputSchema` call, draft-lenient like every container field.
 * @param props.data - The full top-level document; omitted skips condition
 *   evaluation for every variant's fields entirely.
 * @param props.siblingData - This field's own resolved value's siblings —
 *   forwarded to each DISCRIMINATED variant's own sub-fields as their
 *   `siblingData` (the same object a group's sub-fields would see).
 * @returns A Zod schema.
 *
 * @internal — Used by admin form schema construction via `adminFieldToInputSchema`.
 */
export function variantFieldToInputSchema<TFieldMeta extends {} = {}>(props: {
  field: VariantField<VexResourceSlug, TFieldMeta>;
  ignoreRequired?: boolean;
  data?: Record<string, unknown>;
  siblingData?: Record<string, unknown>;
}): ZodType {
  const { field } = props;

  if (field.discriminator !== undefined) {
    const discriminator = field.discriminator;
    const entries = Object.entries(field.variants);
    const variantsByKey = new Map(entries);

    const memberSchemaFor = (
      key: string,
      member: VariantMemberConfig,
      siblingData: Record<string, unknown> | undefined,
    ) => {
      const subSchemas = Object.fromEntries(
        Object.entries(getDataFields({ fields: member.fields })).map(([subKey, subField]) => [
          subKey,
          adminFieldToInputSchema({
            field: subField,
            ignoreRequired: props.ignoreRequired,
            data: props.data,
            siblingData,
            key: subKey,
          }),
        ]),
      );
      return z.object({ [discriminator]: z.literal(key), ...subSchemas });
    };

    const staticSchemas = entries.map(([key, member]) => memberSchemaFor(key, member, props.siblingData));
    const staticSchema: ZodType =
      staticSchemas.length === 1
        ? staticSchemas[0]!
        : z.discriminatedUnion(discriminator, staticSchemas as [ZodObject, ZodObject, ...ZodObject[]]);

    const anyVariantHasConditions = entries.some(([, member]) => hasFieldConditions({ fields: member.fields }));

    const unionSchema: ZodType =
      anyVariantHasConditions && props.data !== undefined
        ? z.looseObject({ [discriminator]: z.string() }).superRefine((value, ctx) => {
            const candidate = value as Record<string, unknown>;
            const key = typeof candidate[discriminator] === "string" ? (candidate[discriminator] as string) : undefined;
            const member = key !== undefined ? variantsByKey.get(key) : undefined;
            if (!member) return;
            const result = memberSchemaFor(key, member, candidate).safeParse(value);
            if (!result.success) {
              for (const issue of result.error.issues) {
                ctx.addIssue({ code: "custom", message: issue.message, path: issue.path });
              }
            }
          })
        : staticSchema;

    const schema = field.required ? unionSchema : unionSchema.default(field.defaultValue);
    return applyBaseInputSchemaMeta({ field, inputSchema: schema });
  }

  const memberSchemas = Object.values(field.variants).map((member) =>
    adminFieldToInputSchema({
      field: member,
      ignoreRequired: props.ignoreRequired,
      data: props.data,
      siblingData: props.siblingData,
    }),
  );
  const unionSchema: ZodType =
    memberSchemas.length === 1 ? memberSchemas[0]! : z.union(memberSchemas as [ZodType, ZodType, ...ZodType[]]);
  const schema = field.required ? unionSchema : unionSchema.default(field.defaultValue);
  return applyBaseInputSchemaMeta({ field, inputSchema: schema });
}
```

#### packages/core/src/fields/variant/index.ts

New module.

```ts
export * from "./types";
export * from "./config";
export * from "./validator";
export * from "./inputSchema";
export * from "./utils";
```

#### packages/core/src/fields/variant/config.test.ts

New module.

```ts
import { describe, it, expect } from "vitest";
import { variant } from "./config";
import { text, number, json } from "../../index";
import { VexConfigError } from "../../errors";

describe("variant() — discriminated mode", () => {
  it("resolves defaults and the discriminated interfaceType", () => {
    const field = variant({
      discriminator: "kind",
      variants: {
        email: { label: "Email", fields: { address: text({ required: true }) } },
        sms: { label: "SMS", fields: { phoneNumber: text({ required: true }) } },
      },
    });
    expect(field.type).toBe("variant");
    expect(field.required).toBe(false);
    expect(field.nullable).toBe(false);
    expect(field.discriminator).toBe("kind");
    expect(field.interfaceType).toBe(
      '{ kind: "email"; address: string } | { kind: "sms"; phoneNumber: string }',
    );
    expect(field.defaultValue).toEqual({ kind: "email", address: "" });
  });

  it("throws VexConfigError when a variant's fields declares the discriminator key", () => {
    expect(() =>
      variant({
        discriminator: "kind",
        variants: {
          email: { fields: { kind: text({ required: true }) } },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'variant(): variant "email" declares a field named "kind", which is this field\'s own discriminator key. ' +
          "Rename the field, or the discriminator.",
      ),
    );
  });
});

describe("variant() — primitive mode", () => {
  it("resolves defaults, forces member required:true, and the primitive interfaceType", () => {
    const field = variant({
      variants: { fixed: text({ required: false }), metered: number({ required: true }) },
    });
    expect(field.discriminator).toBeUndefined();
    expect(field.variants.fixed!.required).toBe(true);
    expect(field.interfaceType).toBe("string | number");
    expect(field.defaultValue).toBe("");
  });

  it("throws VexConfigError when a member has no distinguishable runtime kind", () => {
    expect(() => variant({ variants: { fixed: text(), payload: json() } })).toThrow(
      new VexConfigError(
        'variant(): member "payload" (type "json") has no distinguishable runtime storage kind and cannot be ' +
          'used in a primitive variant() — give the field a "discriminator" to build an object union instead.',
      ),
    );
  });

  it("throws VexConfigError when two members share a runtime kind", () => {
    expect(() => variant({ variants: { fixed: text(), label: text() } })).toThrow(
      new VexConfigError(
        'variant(): members "fixed", "label" all store a "string" value at runtime — primitive variant() ' +
          "members must have distinct runtime kinds so the active member can be recovered from the stored value alone.",
      ),
    );
  });
});
```

#### packages/core/src/fields/variant/validator.test.ts

New module.

```ts
import { describe, it, expect } from "vitest";
import { variantFieldToValidator } from "./validator";
import { variant } from "./config";
import { text, number } from "../../index";

describe("variantFieldToValidator — discriminated", () => {
  it("a single variant stays a bare v.object()", () => {
    const field = variant({
      discriminator: "kind",
      variants: { email: { fields: { address: text({ required: true }) } } },
    });
    expect(variantFieldToValidator({ field })).toBe(
      'v.object({ kind: v.literal("email"), address: v.string() })',
    );
  });

  it("two variants combine with v.union(), required by default wraps nothing", () => {
    const field = variant({
      discriminator: "kind",
      required: true,
      variants: {
        email: { fields: { address: text({ required: true }) } },
        sms: { fields: { phoneNumber: text({ required: false }) } },
      },
    });
    expect(variantFieldToValidator({ field })).toBe(
      'v.union(\n' +
        '  v.object({ kind: v.literal("email"), address: v.string() }),\n' +
        '  v.object({ kind: v.literal("sms"), phoneNumber: v.optional(v.string()) })\n' +
        ')',
    );
  });

  it("optional (default) wraps the whole union in v.optional()", () => {
    const field = variant({
      discriminator: "kind",
      variants: {
        email: { fields: { address: text({ required: true }) } },
        sms: { fields: { phoneNumber: text({ required: true }) } },
      },
    });
    expect(variantFieldToValidator({ field })).toMatch(/^v\.optional\(v\.union\(/);
  });
});

describe("variantFieldToValidator — primitive", () => {
  it("a single member stays bare", () => {
    const field = variant({ variants: { fixed: text({ required: true }) } });
    expect(variantFieldToValidator({ field })).toBe("v.string()");
  });

  it("two members combine with v.union(), never wrapped in v.optional() individually", () => {
    const field = variant({ required: true, variants: { fixed: text(), metered: number() } });
    expect(variantFieldToValidator({ field })).toBe("v.union(v.string(), v.number())");
  });
});
```

#### packages/core/src/fields/variant/inputSchema.test.ts

New module.

```ts
import { describe, it, expect } from "vitest";
import { variantFieldToInputSchema } from "./inputSchema";
import { variant } from "./config";
import { text, number } from "../../index";

const channel = variant({
  required: true,
  discriminator: "kind",
  variants: {
    email: { fields: { address: text({ required: true }) } },
    sms: { fields: { phoneNumber: text({ required: true }) } },
  },
});

describe("variantFieldToInputSchema — discriminated", () => {
  it("parses a valid value for each variant", () => {
    const schema = variantFieldToInputSchema({ field: channel });
    expect(schema.parse({ kind: "email", address: "a@b.com" })).toEqual({
      kind: "email",
      address: "a@b.com",
    });
    expect(schema.parse({ kind: "sms", phoneNumber: "+15551234567" })).toEqual({
      kind: "sms",
      phoneNumber: "+15551234567",
    });
  });

  it("rejects a variant missing its own required field", () => {
    const schema = variantFieldToInputSchema({ field: channel });
    expect(schema.safeParse({ kind: "email" }).success).toBe(false);
  });

  it("rejects an unknown discriminant value", () => {
    const schema = variantFieldToInputSchema({ field: channel });
    expect(schema.safeParse({ kind: "fax", address: "x" }).success).toBe(false);
  });

  it("non-required field defaults to the first variant's defaults when absent", () => {
    const optional = variant({
      discriminator: "kind",
      variants: {
        email: { fields: { address: text({ required: true }) } },
        sms: { fields: { phoneNumber: text({ required: true }) } },
      },
    });
    const schema = variantFieldToInputSchema({ field: optional });
    expect(schema.parse(undefined)).toEqual({ kind: "email", address: "" });
  });
});

describe("variantFieldToInputSchema — primitive", () => {
  const amount = variant({ required: true, variants: { fixed: text({ required: true }), metered: number({ required: true }) } });

  it("parses a valid value for each member", () => {
    const schema = variantFieldToInputSchema({ field: amount });
    expect(schema.parse("flat rate")).toBe("flat rate");
    expect(schema.parse(42)).toBe(42);
  });

  it("rejects a value matching neither member's schema", () => {
    const schema = variantFieldToInputSchema({ field: amount });
    expect(schema.safeParse(true).success).toBe(false);
  });
});
```

#### packages/core/src/fields/constants.ts

One edit — add the `variant` entry beside `json` (placeholder validator/interfaceType, same pattern
`blocks` uses: the real shape is built per-instance), and its type alias beside `JsonFieldType`.

**1 — `ADMIN_FIELDS`, after the `json` entry:**

```ts
  variant: {
    type: "variant",
    interfaceType: "unknown",
    validator: "v.any()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
    hasNullToggle: true,
  },
```

**2 — type alias, after `JsonFieldType`:**

```ts
/** Literal type `"variant"` — the discriminant value on {@link VariantField}. */
export type VariantFieldType = typeof ADMIN_FIELDS.variant.type;
```

#### packages/core/src/fields/types.ts

Two edits.

**1 — import, beside `UIField`:**

```ts
import { UIField } from "./ui";
import { VariantField } from "./variant";
```

**2 — `AdminField` union, before the closing `UIField` member:**

```ts
  | VariantField<VexResourceSlug, TFieldMeta>
  | UIField<VexResourceSlug, TFieldMeta>;
```

#### packages/core/src/fields/validators/index.ts

Two edits.

**1 — import, beside `jsonFieldToValidator`:**

```ts
import { jsonFieldToValidator } from "../json";
import { variantFieldToValidator } from "../variant";
```

**2 — switch case, before `default:`:**

```ts
    case ADMIN_FIELDS.json.type:
      return jsonFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.variant.type:
      return variantFieldToValidator({ field: props.field });
    default: {
```

#### packages/core/src/fields/inputSchemas/index.ts

Two edits.

**1 — import, beside `jsonFieldToInputSchema`:**

```ts
import { jsonFieldToInputSchema } from "../json";
import { variantFieldToInputSchema } from "../variant";
```

**2 — switch case, before `default:`:**

```ts
    case ADMIN_FIELDS.json.type:
      return jsonFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.variant.type:
      return variantFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
        data: props.data,
        siblingData: childSiblingData,
      });
    default: {
```

#### packages/core/src/fields/index.ts

One edit — add the barrel export beside `json`.

```ts
export * from "./json";
export * from "./variant";
```

#### packages/core/src/fields/childInterfaceType.ts

One edit — a variant branch before the final `return field.interfaceType;`, mirroring the
`blocks`/`group` named-alias branches already there.

```ts
  if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
    return `${field.interfaceName}[]`;
  }

  if (field.type === ADMIN_FIELDS.variant.type && field.interfaceName) {
    return field.interfaceName;
  }

  return field.interfaceType;
```

#### packages/core/src/fields/interfaceGen.ts

One edit — a variant case in `getFieldInterfaces`'s loop, after the `blocks` branch. Discriminated:
recurse into every variant's own `fields` for named sub-declarations (no per-variant alias is ever
emitted — a variant's own type stays inlined in the field's `interfaceType`, see `config.ts`).
Primitive: recurse into any member that is itself a named-type-bearing container (via a synthetic
one-entry field map, the same trick `tabs()`'s own un-named-tab branch in `getDataFields` uses).

```ts
    } else if (field.type === ADMIN_FIELDS.blocks.type) {
      // Depth-first: recurse into each block's fields for any named sub-groups,
      // then emit each block's own type declaration.
      for (const block of field.blocks) {
        declarations.push(...getFieldInterfaces(block.fields));
        declarations.push(`export type ${block.interfaceName} = ${block.interfaceType}`);
      }
      // Named union alias — emitted after all individual block types.
      if (field.interfaceName) {
        const union = field.blocks.map((b) => b.interfaceName).join(" | ");
        declarations.push(`export type ${field.interfaceName} = ${union}`);
      }
    } else if (field.type === ADMIN_FIELDS.variant.type) {
      if (field.discriminator !== undefined) {
        for (const member of Object.values(field.variants)) {
          declarations.push(...getFieldInterfaces(member.fields));
        }
      } else {
        for (const member of Object.values(field.variants)) {
          declarations.push(...getFieldInterfaces({ member }));
        }
      }
      if (field.interfaceName) {
        declarations.push(`export type ${field.interfaceName} = ${field.interfaceType}`);
      }
    }
```

#### packages/core/src/collections/interfaceGen.ts

One edit — a variant case beside the existing `select`/`group`/`blocks` `fieldType` overrides.

```ts
      if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
        fieldType = `${field.interfaceName}[]`;
      }
      if (field.type === ADMIN_FIELDS.variant.type && field.interfaceName) {
        fieldType = field.interfaceName;
      }
```

#### packages/core/src/globals/interfaceGen.ts

Same one-line addition, mirroring the collections file.

```ts
      if (field.type === ADMIN_FIELDS.blocks.type && field.interfaceName) {
        fieldType = `${field.interfaceName}[]`;
      }
      if (field.type === ADMIN_FIELDS.variant.type && field.interfaceName) {
        fieldType = field.interfaceName;
      }
```

#### packages/core/src/fields/utils.ts

Two edits. `getDataFields`/`flattenFields` need **no** change — `variant` is `kind: "data"`, already
handled by the generic `ADMIN_FIELDS[field.type].kind === "data"` branch.

**1 — `hasFieldConditions`, beside the `blocks` branch:**

```ts
    if (field.type === ADMIN_FIELDS.blocks.type) {
      return field.blocks.some((block) =>
        hasFieldConditions({ fields: block.fields }),
      );
    }
    if (field.type === ADMIN_FIELDS.variant.type) {
      return field.discriminator !== undefined
        ? Object.values(field.variants).some((member) => hasFieldConditions({ fields: member.fields }))
        : Object.values(field.variants).some((member) => hasFieldConditions({ fields: { member } }));
    }
    return false;
```

**2 — `buildPopulateMapEntry`, after the `blocks` branch. Discriminated only** (see the Writer note —
a primitive variant's members can't be statically keyed by a discriminant, so they are not
populate-typed):

```ts
  if (field.type === ADMIN_FIELDS.blocks.type) {
    const blockEntries = field.blocks
      .map((block) => {
        const inner = buildPopulateMapEntries({ fields: block.fields });
        return inner ? `${block.blockType}: { ${inner} }` : null;
      })
      .filter((entry): entry is string => entry !== null);
    return blockEntries.length > 0 ? `{ kind: "blocks"; blocks: { ${blockEntries.join("; ")} } }` : null;
  }
  if (field.type === ADMIN_FIELDS.variant.type && field.discriminator !== undefined) {
    const variantEntries = Object.entries(field.variants)
      .map(([key, member]) => {
        const inner = buildPopulateMapEntries({ fields: member.fields });
        return inner ? `${key}: { ${inner} }` : null;
      })
      .filter((entry): entry is string => entry !== null);
    return variantEntries.length > 0
      ? `{ kind: "variant"; discriminator: "${field.discriminator}"; variants: { ${variantEntries.join("; ")} } }`
      : null;
  }
  return null;
```

#### packages/core/src/types/generated.ts

One edit — extend the closed `PopulateMapEntry` union.

```ts
export type PopulateMapEntry =
  | { kind: "relationship" | "upload"; target: string }
  | { kind: "group"; fields: Record<string, PopulateMapEntry> }
  | { kind: "blocks"; blocks: Record<string, Record<string, PopulateMapEntry>> }
  | { kind: "variant"; discriminator: string; variants: Record<string, Record<string, PopulateMapEntry>> };
```

#### packages/core/src/db/types.ts

Two edits — the discriminated variant's populate-option and applied-result shapes, mirroring the
`blocks`/`group` branches directly above each.

**1 — `PopulateOptionForEntry`:**

```ts
export type PopulateOptionForEntry<TEntry extends PopulateMapEntry> = TEntry extends {
  kind: "relationship" | "upload";
  target: infer Target extends string;
}
  ? Target extends CollectionSlug
    ? true | { populate: PopulateShape<Target> }
    : true
  : TEntry extends { kind: "group"; fields: infer TFields extends Record<string, PopulateMapEntry> }
    ? ContainerPopulateShape<TFields>
    : TEntry extends {
          kind: "blocks";
          blocks: infer TBlocks extends Record<string, Record<string, PopulateMapEntry>>;
        }
      ? { [B in keyof TBlocks]?: ContainerPopulateShape<TBlocks[B]> }
      : TEntry extends {
            kind: "variant";
            discriminator: string;
            variants: infer TVariants extends Record<string, Record<string, PopulateMapEntry>>;
          }
        ? { [V in keyof TVariants]?: ContainerPopulateShape<TVariants[V]> }
        : never;
```

**2 — `ApplyEntryPopulate`:**

```ts
type ApplyEntryPopulate<TValue, TEntry extends PopulateMapEntry, TOpt> = TEntry extends {
  kind: "relationship" | "upload";
  target: infer Target extends string;
}
  ? TOpt extends true | { populate: unknown }
    ? Target extends CollectionSlug
      ? Target extends keyof DocumentBySlug
        ? TOpt extends { populate: infer NestedPopulate }
          ? NestedPopulate extends PopulateShape<Target>
            ? (Populated<Target, NestedPopulate> | HiddenDocument<Target>)[]
            : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
          : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
        : TValue
      : TValue
    : TValue
  : TEntry extends { kind: "group"; fields: infer TFields extends Record<string, PopulateMapEntry> }
    ? TOpt extends Record<string, unknown>
      ? NonNullable<TValue> extends ReadonlyArray<infer Item>
        ? ApplyContainerPopulate<Item, TFields, TOpt>[]
        : ApplyContainerPopulate<TValue, TFields, TOpt>
      : TValue
    : TEntry extends {
          kind: "blocks";
          blocks: infer TBlocks extends Record<string, Record<string, PopulateMapEntry>>;
        }
      ? TOpt extends Record<string, unknown>
        ? NonNullable<TValue> extends ReadonlyArray<infer Item>
          ? ApplyBlockItemPopulate<Item, TBlocks, TOpt>[]
          : TValue
        : TValue
      : TEntry extends {
            kind: "variant";
            discriminator: infer Disc extends string;
            variants: infer TVariants extends Record<string, Record<string, PopulateMapEntry>>;
          }
        ? TOpt extends Record<string, unknown>
          ? TValue extends Record<string, unknown>
            ? TValue[Disc] extends infer DiscValue extends string
              ? DiscValue extends keyof TVariants
                ? DiscValue extends keyof TOpt
                  ? ApplyContainerPopulate<TValue, TVariants[DiscValue], TOpt[DiscValue]>
                  : TValue
                : TValue
              : TValue
            : TValue
          : TValue
        : TValue;
```

#### packages/core/src/collections/api/types.ts

One edit — `FieldDepthPopulateOption`'s depth-counted mirror of the `db/types.ts` change above.

```ts
type FieldDepthPopulateOption<
  TEntry extends PopulateMapEntry,
  D extends number,
  _Counter extends 0[],
> = TEntry extends { kind: "relationship" | "upload"; target: infer Target extends string }
  ? [..._Counter, 0]["length"] extends D
    ? true
    : Target extends CollectionSlug
      ? { populate: DepthPopulate<Target, D, [..._Counter, 0]> }
      : true
  : TEntry extends { kind: "group"; fields: infer TFields extends Record<string, PopulateMapEntry> }
    ? keyof ContainerDepthPopulate<TFields, D, _Counter> extends never
      ? never
      : ContainerDepthPopulate<TFields, D, _Counter>
    : TEntry extends {
          kind: "blocks";
          blocks: infer TBlocks extends Record<string, Record<string, PopulateMapEntry>>;
        }
      ? keyof {
          [B in keyof TBlocks as keyof ContainerDepthPopulate<TBlocks[B], D, _Counter> extends never
            ? never
            : B]: ContainerDepthPopulate<TBlocks[B], D, _Counter>;
        } extends never
        ? never
        : {
            [B in keyof TBlocks as keyof ContainerDepthPopulate<TBlocks[B], D, _Counter> extends never
              ? never
              : B]?: ContainerDepthPopulate<TBlocks[B], D, _Counter>;
          }
      : TEntry extends {
            kind: "variant";
            discriminator: string;
            variants: infer TVariants extends Record<string, Record<string, PopulateMapEntry>>;
          }
        ? keyof {
            [V in keyof TVariants as keyof ContainerDepthPopulate<TVariants[V], D, _Counter> extends never
              ? never
              : V]: ContainerDepthPopulate<TVariants[V], D, _Counter>;
          } extends never
          ? never
          : {
              [V in keyof TVariants as keyof ContainerDepthPopulate<TVariants[V], D, _Counter> extends never
                ? never
                : V]?: ContainerDepthPopulate<TVariants[V], D, _Counter>;
            }
        : never;
```

#### packages/core/src/db/depth.ts

One edit — `buildFieldDepthPopulate`'s variant case, after the `blocks` branch. Both modes: a
discriminated variant's own entry is keyed by variant key (like `blocks`' by `blockType`); a
primitive variant's is keyed by MEMBER NAME, recursing with `buildFieldDepthPopulate` itself
(transparent, like `array()`'s own branch) since a primitive member can be any field, including
another relationship-bearing container.

```ts
  if (field.type === ADMIN_FIELDS.blocks.type) {
    const blocksResult: Record<string, unknown> = {};
    for (const block of field.blocks) {
      const nested = buildContainerDepthPopulate({ config, fields: block.fields, depth, visited });
      if (Object.keys(nested).length > 0) blocksResult[block.blockType] = nested;
    }
    return Object.keys(blocksResult).length > 0 ? blocksResult : undefined;
  }

  if (field.type === ADMIN_FIELDS.variant.type) {
    if (field.discriminator !== undefined) {
      const variantsResult: Record<string, unknown> = {};
      for (const [key, member] of Object.entries(field.variants)) {
        const nested = buildContainerDepthPopulate({ config, fields: member.fields, depth, visited });
        if (Object.keys(nested).length > 0) variantsResult[key] = nested;
      }
      return Object.keys(variantsResult).length > 0 ? variantsResult : undefined;
    }
    const membersResult: Record<string, unknown> = {};
    for (const [key, member] of Object.entries(field.variants)) {
      const nested = buildFieldDepthPopulate({ config, field: member, depth, visited });
      if (nested !== undefined) membersResult[key] = nested;
    }
    return Object.keys(membersResult).length > 0 ? membersResult : undefined;
  }

  return undefined;
```

#### packages/core/src/db/depth.test.ts

One addition — a new `describe` block, following the existing "Nested containers" tests' exact
`makeConfig` convention (plain `{ type: ... }` objects, no real field builders needed).

```ts
describe("buildDepthPopulate — nested variant()", () => {
  it("depth 1 — a relationship nested in a discriminated variant() member becomes true, keyed by variant", () => {
    const withVariant = makeConfig([
      {
        slug: "pages",
        fields: {
          channel: {
            type: "variant",
            discriminator: "kind",
            variants: {
              email: { fields: { address: { type: "text" } } },
              sms: { fields: { contact: { type: "relationship", collection: { slug: "authors" } } } },
            },
          },
        },
      },
      { slug: "authors", fields: { name: { type: "text" } } },
    ]);
    expect(buildDepthPopulate(withVariant, "pages", 1)).toEqual({
      channel: { sms: { contact: true } },
    });
  });

  it("a variant() with nothing populatable in any member is omitted entirely", () => {
    const withVariant = makeConfig([
      {
        slug: "pages",
        fields: {
          channel: {
            type: "variant",
            discriminator: "kind",
            variants: { email: { fields: { address: { type: "text" } } } },
          },
          author: { type: "relationship", collection: { slug: "authors" } },
        },
      },
      { slug: "authors", fields: { name: { type: "text" } } },
    ]);
    expect(buildDepthPopulate(withVariant, "pages", 1)).toEqual({ author: true });
  });

  it("depth 1 — a primitive variant() member that is itself an array() of relationships recurses transparently", () => {
    const withPrimitive = makeConfig([
      {
        slug: "pages",
        fields: {
          refs: {
            type: "variant",
            variants: {
              single: { type: "relationship", collection: { slug: "authors" } },
              many: { type: "array", items: { type: "text" } },
            },
          },
        },
      },
      { slug: "authors", fields: { name: { type: "text" } } },
    ]);
    expect(buildDepthPopulate(withPrimitive, "pages", 1)).toEqual({ refs: { single: true } });
  });
});
```

#### packages/core/src/db/populate.ts

Two edits. `populateContainers`'s non-leaf branch currently assumes every non-leaf `opts` routes
through `populateNestedContainer` (the blocks-by-`blockType`-or-group dispatch); a discriminated
variant's non-leaf shape (keyed by variant key, not `blockType`) needs its OWN routing, since the
container VALUE is a single object whose active branch is named by `opts`'s own `discriminator`
property (carried on the depth/populate-map shape itself — see `db/depth.ts`/`buildPopulateMapEntry`
above), not recoverable from the data alone the way `blockType` is.

**1 — `populateContainers`'s non-leaf dispatch, routing a `discriminator`-bearing opts to the new
function instead of `populateNestedContainer`:**

```ts
  for (const [fieldKey, opts] of Object.entries(populate)) {
    const isLeaf = opts === true || (typeof opts === "object" && opts !== null && "populate" in opts);
    if (!isLeaf) {
      if (typeof opts === "object" && opts !== null && "discriminator" in opts && "variants" in opts) {
        await populateVariantContainer({
          ctx,
          containers,
          fieldKey,
          discriminator: opts.discriminator as string,
          variants: opts.variants as Record<string, Record<string, unknown>>,
          drafts,
          config,
          access,
          auth,
        });
      } else if (typeof opts === "object" && opts !== null) {
        await populateNestedContainer({
          ctx,
          containers,
          fieldKey,
          opts: opts as Record<string, unknown>,
          drafts,
          config,
          access,
          auth,
        });
      }
      continue;
    }
```

**2 — the new function, after `populateNestedContainer`:**

```ts
/**
 * Routes a DISCRIMINATED `variant()` field's populate entry — distinguished
 * from the generic `populateNestedContainer` dispatch (which recovers a
 * `blocks()` item's own type from its data-level `blockType` key) because a
 * variant's active branch is named by a CONFIGURABLE property (`discriminator`),
 * not a fixed framework key, so the discriminator name itself travels on the
 * populate-map entry (`buildPopulateMapEntry`'s `{ kind: "variant",
 * discriminator, variants }` shape, `db/depth.ts`'s runtime equivalent) and is
 * read back here.
 *
 * Buckets every container's OWN variant-field value (a single object, never
 * an array) by its discriminator value, then recurses `populateContainers`
 * once per bucket against that variant's own sub-populate shape — the same
 * batching-per-field, never-per-row discipline every other pass in this file
 * keeps.
 */
async function populateVariantContainer<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  containers: Record<string, unknown>[];
  fieldKey: string;
  discriminator: string;
  variants: Record<string, Record<string, unknown>>;
  drafts?: boolean;
  config?: VexConfig;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
}): Promise<void> {
  const { ctx, containers, fieldKey, discriminator, variants, drafts, config, access, auth } = props;
  const byVariantKey = new Map<string, Record<string, unknown>[]>();

  for (const container of containers) {
    const value = container[fieldKey];
    if (typeof value !== "object" || value === null) continue;
    const cloned = { ...(value as Record<string, unknown>) };
    container[fieldKey] = cloned;
    const key = cloned[discriminator];
    if (typeof key !== "string") continue;
    const bucket = byVariantKey.get(key) ?? [];
    bucket.push(cloned);
    byVariantKey.set(key, bucket);
  }

  for (const [key, variantPopulate] of Object.entries(variants)) {
    const items = byVariantKey.get(key);
    if (!items || items.length === 0) continue;
    await populateContainers({ ctx, containers: items, populate: variantPopulate, drafts, config, access, auth });
  }
}
```

#### packages/core/src/db/test/convex/schema.ts

One edit — a `preference` column on `nestedPages` (a discriminated variant, `kind: "email" | "sms"`,
the `sms` branch carrying a relationship, so `populate.test.ts` has something real to populate), plus
its `CollectionsPopulateMap` augmentation entry.

**1 — `nestedPages`, after the `seo` field:**

```ts
    seo: v.optional(
      v.object({
        ogImage: v.optional(v.array(v.id("images"))),
      }),
    ),
    preference: v.optional(
      v.union(
        v.object({ kind: v.literal("email"), address: v.optional(v.string()) }),
        v.object({ kind: v.literal("sms"), contact: v.optional(v.id("authors")) }),
      ),
    ),
  }),
});
```

**2 — `CollectionsPopulateMap.nestedPages`, after `seo`:**

```ts
      nestedPages: {
        content: {
          kind: "blocks";
          blocks: {
            hero: { image: { kind: "upload"; target: "images" } };
            cta: { link: { kind: "relationship"; target: "posts" } };
          };
        };
        gallery: { kind: "group"; fields: { asset: { kind: "upload"; target: "images" } } };
        seo: { kind: "group"; fields: { ogImage: { kind: "upload"; target: "images" } } };
        preference: {
          kind: "variant";
          discriminator: "kind";
          variants: { sms: { contact: { kind: "relationship"; target: "authors" } } };
        };
      };
```

#### packages/core/src/db/populate.test.ts

One addition — a new test in the "nested blocks()/array()/group()" describe block.

```ts
  test("populates a relationship nested in a discriminated variant() member, routed by its discriminator", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", { name: "Priya Shah" });
      const page1 = await ctx.db.insert("nestedPages", {
        title: "SMS page",
        preference: { kind: "sms", contact: authorId },
      });
      const page2 = await ctx.db.insert("nestedPages", {
        title: "Email page",
        preference: { kind: "email", address: "hi@example.com" },
      });
      const docs = [(await ctx.db.get(page1))!, (await ctx.db.get(page2))!];
      return populateDocs(ctx, docs, {
        preference: { discriminator: "kind", variants: { sms: { contact: true } } },
      } as PopulateShape);
    });

    const smsPage = (result as any[]).find((d) => d.title === "SMS page");
    const emailPage = (result as any[]).find((d) => d.title === "Email page");
    expect((smsPage.preference.contact as DocumentBySlug["authors"]).name).toBe("Priya Shah");
    expect(emailPage.preference).toEqual({ kind: "email", address: "hi@example.com" });
  });
```

#### packages/core/src/types/generateVexTypes.ts

One edit — `hasRichTextField`'s variant case, after the `blocks` branch.

```ts
function hasRichTextField(fields: Record<string, AdminField>): boolean {
  return Object.values(fields).some((field) => {
    if (field.type === ADMIN_FIELDS.richtext.type) return true;
    if (field.type === ADMIN_FIELDS.group.type) return hasRichTextField(field.fields);
    if (field.type === ADMIN_FIELDS.array.type) return hasRichTextField({ items: field.items });
    if (field.type === ADMIN_FIELDS.blocks.type) {
      return field.blocks.some((block) => hasRichTextField(block.fields));
    }
    if (field.type === ADMIN_FIELDS.variant.type) {
      return field.discriminator !== undefined
        ? Object.values(field.variants).some((member) => hasRichTextField(member.fields))
        : hasRichTextField({ member: field.variants[Object.keys(field.variants)[0]!]! });
    }
    return false;
  });
}
```

#### packages/core/src/documents/cloneDocumentForDuplicate.ts

One edit — `regenerateNestedIds`'s variant case, after the `array` branch. Discriminated: regenerate
through the ACTIVE member's own fields only (the stored value already carries exactly one branch's
shape). Primitive: regenerate through whichever member matches the stored value's runtime kind.

```ts
import { ADMIN_FIELDS, cloneBlockWithFreshIds, classifyVariantMemberKind, classifyVariantValueKind, getDataFields } from "../fields";
import type { AdminField, GenericBlock } from "../fields";

function regenerateNestedIds(props: { value: unknown; field: AdminField }): unknown {
  const { value, field } = props;
  if (value == null) return value;
  if (field.type === ADMIN_FIELDS.blocks.type) {
    const blockDefMap = new Map(field.blocks.map((blockDef) => [blockDef.blockType, blockDef]));
    return (value as GenericBlock[]).map((item) => {
      const itemBlockDef = blockDefMap.get(item.blockType as string);
      return itemBlockDef
        ? cloneBlockWithFreshIds({ block: item, blockDef: itemBlockDef })
        : item;
    });
  }
  if (field.type === ADMIN_FIELDS.group.type) {
    const groupValue = (value ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown> = { ...groupValue };
    for (const [key, subField] of Object.entries(field.fields)) {
      if (key in groupValue) {
        result[key] = regenerateNestedIds({ value: groupValue[key], field: subField });
      }
    }
    return result;
  }
  if (field.type === ADMIN_FIELDS.array.type) {
    return (value as unknown[]).map((item) => regenerateNestedIds({ value: item, field: field.items }));
  }
  if (field.type === ADMIN_FIELDS.variant.type) {
    if (field.discriminator !== undefined) {
      const discriminator = field.discriminator;
      const variantValue = value as Record<string, unknown>;
      const key = variantValue[discriminator];
      const member = typeof key === "string" ? field.variants[key] : undefined;
      if (!member) return value;
      const result: Record<string, unknown> = { ...variantValue };
      for (const [subKey, subField] of Object.entries(member.fields)) {
        if (subKey in variantValue) {
          result[subKey] = regenerateNestedIds({ value: variantValue[subKey], field: subField });
        }
      }
      return result;
    }
    const kind = classifyVariantValueKind(value);
    const member = Object.values(field.variants).find(
      (candidate) => classifyVariantMemberKind({ field: candidate }) === kind,
    );
    return member ? regenerateNestedIds({ value, field: member }) : value;
  }
  return value;
}
```

#### packages/core/src/fields/blocks/utils.ts

One edit — the SAME variant case on `cloneNestedBlockIds` (the private near-duplicate of
`cloneDocumentForDuplicate.ts`'s walker, scoped to one block's own fields). Needs the classifier
imports too.

**1 — imports, beside the existing ones:**

```ts
import { nanoid } from "nanoid";
import { ADMIN_FIELDS } from "../constants";
import { getDataFields } from "../utils";
import { classifyVariantMemberKind, classifyVariantValueKind } from "../variant";
import { RESERVED_BLOCK_FIELD_NAMES } from "./types";
import type { BlockConfig, GenericBlock } from "./types";
import type { AdminField } from "../types";
```

**2 — `cloneNestedBlockIds`, after the `array` branch:**

```ts
  if (field.type === ADMIN_FIELDS.array.type) {
    return (value as unknown[]).map((item) => cloneNestedBlockIds({ value: item, field: field.items }));
  }
  if (field.type === ADMIN_FIELDS.variant.type) {
    if (field.discriminator !== undefined) {
      const discriminator = field.discriminator;
      const variantValue = value as Record<string, unknown>;
      const key = variantValue[discriminator];
      const member = typeof key === "string" ? field.variants[key] : undefined;
      if (!member) return value;
      const result: Record<string, unknown> = { ...variantValue };
      for (const [subKey, subField] of Object.entries(member.fields)) {
        if (subKey in variantValue) {
          result[subKey] = cloneNestedBlockIds({ value: variantValue[subKey], field: subField });
        }
      }
      return result;
    }
    const kind = classifyVariantValueKind(value);
    const member = Object.values(field.variants).find(
      (candidate) => classifyVariantMemberKind({ field: candidate }) === kind,
    );
    return member ? cloneNestedBlockIds({ value, field: member }) : value;
  }
  return value;
```

#### packages/core/src/collections/listView/listViewColumnConfig.ts

One edit — a default column width beside `blocks`.

```ts
export const FIELD_TYPE_DEFAULT_WIDTH: Record<DataFieldType, number> = {
  checkbox: 60,
  select: 150,
  date: 150,
  commitTs: 150,
  color: 100,
  number: 120,
  email: 200,
  url: 200,
  relationship: 200,
  upload: 160,
  array: 200,
  group: 200,
  blocks: 240,
  json: 240,
  variant: 220,
  text: 240,
  textarea: 280,
  richtext: 320,
};
```

#### packages/telemetry/src/types.ts

One edit — `AnonymizedField`, after `on`.

```ts
  on?: CommitTsFieldOn;
  hasDiscriminator?: boolean;
  variantCount?: number;
}
```

#### packages/telemetry/src/anonymizeConfig.ts

One edit — `anonymizeField`'s variant case, after the `blocks` case. Recurses into every variant's
own fields (discriminated: each variant's `fields`; primitive: each member, dispatched generically
through `anonymizeField` itself since a member can be any field type, including another container).

```ts
    case ADMIN_FIELDS.blocks.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        defaultCollapsed: field.admin.defaultCollapsed,
        min: field.min?.[0],
        max: field.max?.[0],
      });
      field.blocks.forEach((block, index) => {
        registerBlockPlacement({ block, context, placementPath: `${path}.b${index + 1}` });
      });
      return;
    case ADMIN_FIELDS.variant.type:
      context.fields.push({
        ...dataFieldBase({ field, path, context }),
        hasDiscriminator: field.discriminator !== undefined,
        variantCount: Object.keys(field.variants).length,
      });
      if (field.discriminator !== undefined) {
        Object.values(field.variants).forEach((member, index) => {
          walkFields({ fields: member.fields, context, parentPath: `${path}.v${index + 1}` });
        });
      } else {
        Object.values(field.variants).forEach((member, index) => {
          anonymizeField({ field: member, context, path: `${path}.v${index + 1}` });
        });
      }
      return;
```

#### packages/react/src/fields/variant/testFixture.ts

New module — the discriminated mode is the registry's representative fixture (`fieldFixtures.variant`,
driving the generic `runFieldInputContractSuite`/cell/display/columnDef contract suites); the
primitive mode gets its own direct assertions in `Field.test.tsx` below.

```ts
import { variant, text, type VariantField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

export const variantFieldFixture: FieldFixture<VariantField, Record<string, unknown>> = {
  fieldType: "variant",
  fieldDef: variant({
    label: "Channel",
    discriminator: "kind",
    variants: {
      email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } },
      sms: { label: "SMS", fields: { phoneNumber: text({ label: "Phone number", required: true }) } },
    },
  }),
  valid: { kind: "email", address: "a@b.com" },
  invalid: { kind: "email" },
  empty: { kind: "email", address: "" },
};
```

#### packages/react/src/fields/variant/Cell.tsx

New module.

```tsx
"use client";

import {
  classifyVariantValueKind,
  stringifyConvexValue,
  type CellComponentProps,
  type VariantField,
  type TDocument,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";

/**
 * Variant field cell component for the admin list-table view.
 *
 * Discriminated: the active variant's label (falling back to its raw key).
 * Primitive: the active member's runtime kind. Both carry the full
 * bigint/ArrayBuffer-safe serialized value as the hover `title`.
 *
 * @param props - Component props.
 * @returns The variant label/kind, or an em-dash placeholder when absent.
 */
export function VariantFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<VariantField, TData>,
) {
  const config = useVexConfig();

  if (props.value === null || props.value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  const preview = stringifyConvexValue({ value: props.value });
  let label: string;
  if (props.fieldDef.discriminator !== undefined) {
    const value = props.value as Record<string, unknown>;
    const key = value[props.fieldDef.discriminator];
    const member = typeof key === "string" ? props.fieldDef.variants[key] : undefined;
    label = member?.label ?? (typeof key === "string" ? key : "Unknown variant");
  } else {
    label = classifyVariantValueKind(props.value);
  }

  const content = (
    <span className="text-xs text-muted-foreground" title={preview}>
      {label}
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink
      href={adminHref(
        { type: "document", slug: props.collection.slug, id: props.row.original._id },
        config.basePath,
      )}
    >
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/fields/variant/Display.tsx

New module.

```tsx
"use client";

import {
  isDisplayValueEmpty,
  stringifyConvexValue,
  type DisplayComponentProps,
  type VariantField,
  type TDocument,
} from "@vexcms/core";
import { DisplayFieldList } from "../DisplayFieldList";

/**
 * Variant field read-only display, registered as `reactAdapter.fields.variant.display`.
 *
 * Discriminated: the active variant's label plus its own fields via
 * `DisplayFieldList` (the same recursive body `group`/`blocks` use).
 * Primitive: the bigint/ArrayBuffer-safe serialized value.
 *
 * @param props - Component props.
 * @returns The variant's label + fields, or the member value, or an em-dash when absent.
 */
export function VariantFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<VariantField, TData>,
) {
  if (isDisplayValueEmpty(props.value)) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (props.field.discriminator !== undefined) {
    const value = props.value as Record<string, unknown>;
    const key = value[props.field.discriminator];
    const member = typeof key === "string" ? props.field.variants[key] : undefined;
    return (
      <div className="rounded-md border border-border/60 px-2 py-1.5">
        <p className="text-xs font-medium text-muted-foreground">{member?.label ?? String(key)}</p>
        <div className="mt-1">
          {member ? (
            <DisplayFieldList
              fields={member.fields}
              values={value}
              document={props.document}
              collection={props.collection}
            />
          ) : (
            <span className="text-sm text-muted-foreground">Unknown variant — not configured on this field.</span>
          )}
        </div>
      </div>
    );
  }

  const preview = stringifyConvexValue({ value: props.value });
  return (
    <span className="text-sm" title={preview}>
      {preview}
    </span>
  );
}
```

#### packages/react/src/fields/variant/columnDef.tsx

New module — mirrors `blocks`/`group`'s factory exactly.

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { CollectionConfig, VariantField, TDocument } from "@vexcms/core";
import { VariantFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a variant field.
 *
 * Sorting is disabled — a variant's stored shape differs per branch, so
 * there is no single Convex index ordering to sort by.
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved variant field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.collection - Collection configuration for the field's collection.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @returns TanStack Table column definition.
 */
export function variantFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: VariantField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, unknown> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => (
      <VariantFieldCell<TData>
        value={row.getValue(props.fieldKey)}
        row={row}
        collection={props.collection}
        fieldDef={props.fieldDef}
        fieldKey={props.fieldKey}
        isTitleField={props.isTitleField ?? false}
      />
    ),

    enableSorting: false,
    enableHiding: true,
    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

#### packages/react/src/fields/variant/Field.tsx

New module.

```tsx
"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import type { VariantField as VariantFieldDef, VariantMemberConfig } from "@vexcms/core";
import {
  buildDefaultVariantMember,
  classifyVariantMemberKind,
  classifyVariantValueKind,
  type FieldComponentProps,
} from "@vexcms/core";
import { VariantField, useFieldContext } from "../../forms";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { RenderFields } from "../RenderFields";
import { fieldToFieldComponent } from "../registry";

function resolveDiscriminatedActiveKey(props: {
  discriminator: string;
  variants: Record<string, VariantMemberConfig>;
  value: unknown;
}): string | undefined {
  const value = props.value as Record<string, unknown> | null | undefined;
  const key = value && typeof value === "object" ? value[props.discriminator] : undefined;
  return typeof key === "string" && key in props.variants ? key : undefined;
}

function resolvePrimitiveActiveKey(props: {
  variants: FieldComponentProps<{}, VariantFieldDef>["fieldDef"]["variants"];
  value: unknown;
}): string | undefined {
  const kind = classifyVariantValueKind(props.value);
  if (kind === "null" || kind === "unknown") return undefined;
  return Object.entries(props.variants).find(
    ([, member]) => classifyVariantMemberKind({ field: member }) === kind,
  )?.[0];
}

/**
 * The variant admin field's own render body — reads the current value via
 * `useFieldContext()`, resolves which variant/member is active (from the
 * stored value's own discriminator key, or its runtime kind), and renders
 * `VariantField`'s picker plus the active selection's body: discriminated
 * mode renders the variant's own fields via `RenderFields` (same as
 * `GroupFieldAdmin`); primitive mode resolves and renders the active
 * member's OWN top-level field component via `fieldToFieldComponent`, bound
 * to the SAME form path (the member's value lives there directly, not
 * nested under a key).
 *
 * Switching the picker resets the value to the newly-selected variant's/
 * member's own defaults — confirm-free, mirroring `blocks()`'s own no-confirm
 * type switch.
 *
 * @param props - {@link FieldComponentProps} narrowed to `VariantField`.
 * @returns The variant field's `VariantField` body, wrapping the active selection.
 */
function VariantFieldAdminInner(props: FieldComponentProps<{}, VariantFieldDef>) {
  const field = useFieldContext();
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const isDiscriminated = props.fieldDef.discriminator !== undefined;

  const activeKey = isDiscriminated
    ? resolveDiscriminatedActiveKey({
        discriminator: props.fieldDef.discriminator as string,
        variants: props.fieldDef.variants as Record<string, VariantMemberConfig>,
        value: field.state.value,
      })
    : resolvePrimitiveActiveKey({ variants: props.fieldDef.variants, value: field.state.value });

  const options = Object.entries(props.fieldDef.variants).map(([key, member]) => ({
    key,
    label: isDiscriminated ? ((member as VariantMemberConfig).label ?? key) : key,
  }));

  function handleActiveKeyChange(nextKey: string): void {
    if (props.fieldDef.discriminator !== undefined) {
      const member = (props.fieldDef.variants as Record<string, VariantMemberConfig>)[nextKey];
      if (!member) return;
      field.handleChange(
        buildDefaultVariantMember({ discriminator: props.fieldDef.discriminator, key: nextKey, member }),
      );
      return;
    }
    const member = props.fieldDef.variants[nextKey];
    if (!member) return;
    field.handleChange(member.defaultValue ?? null);
  }

  function handleIsNullChange(isNull: boolean): void {
    if (isNull) {
      field.handleChange(null);
      return;
    }
    const firstKey = Object.keys(props.fieldDef.variants)[0];
    if (firstKey !== undefined) handleActiveKeyChange(firstKey);
  }

  const activeDiscriminatedMember =
    isDiscriminated && activeKey !== undefined
      ? (props.fieldDef.variants as Record<string, VariantMemberConfig>)[activeKey]
      : undefined;
  const activePrimitiveMember = !isDiscriminated && activeKey !== undefined ? props.fieldDef.variants[activeKey] : undefined;
  const ActivePrimitiveField = activePrimitiveMember ? fieldToFieldComponent(activePrimitiveMember.type) : undefined;

  return (
    <VariantField
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      index={props.index}
      readOnly={readOnly}
      display={props.fieldDef.admin.display}
      options={options}
      activeKey={activeKey}
      onActiveKeyChange={handleActiveKeyChange}
      isNull={props.fieldDef.nullable ? field.state.value === null : undefined}
      onIsNullChange={props.fieldDef.nullable ? handleIsNullChange : undefined}
    >
      {activeDiscriminatedMember && (
        <RenderFields
          fields={activeDiscriminatedMember.fields}
          collection={props.collection}
          namePrefix={props.name}
          readOnly={readOnly}
        />
      )}
      {!isDiscriminated && activePrimitiveMember && ActivePrimitiveField && (
        <ActivePrimitiveField
          name={props.name}
          fieldDef={activePrimitiveMember}
          collection={props.collection}
          readOnly={readOnly}
        />
      )}
    </VariantField>
  );
}

/**
 * Variant admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders
 * `VariantFieldAdminInner`.
 *
 * @param props - {@link FieldComponentProps} narrowed to `VariantField`.
 */
export function VariantFieldAdmin(
  props: FieldComponentProps<{}, VariantFieldDef> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <VariantFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
```

#### packages/react/src/fields/variant/index.ts

New module.

```ts
export * from "./Field";
export * from "./Cell";
export * from "./Display";
export * from "./columnDef";
```

#### packages/react/src/forms/VariantField.tsx

New module — the generic leaf: a `Select`/`Tabs` picker, `children` below for the caller-rendered
active-selection body. Mirrors `GroupField`'s "caller owns its own children" composition.

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout } from "./FormFieldLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import type { BaseFormFieldProps } from "./types";

/** One variant/type option the picker offers. */
export interface VariantFieldOption {
  key: string;
  label: string;
}

/** Props for {@link VariantField}. */
export interface VariantFieldProps extends Omit<BaseFormFieldProps<never>, "renderControl"> {
  options: VariantFieldOption[];
  activeKey: string | undefined;
  onActiveKeyChange: (key: string) => void;
  /** `"select"` (default, a dropdown) or `"segmented"` (inline tabs). */
  display?: "select" | "segmented";
  /** The active variant's/member's rendered body — a container's own fields, or a scalar input. */
  children: ReactNode;
  /** Renders a "Null" switch in the label row and hides `children` while `true`. @see `FormFieldLayout` */
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
}

/**
 * A variant/type-picker field bound to the nearest `<form.AppField
 * name="...">` — a `Select` (or inline `Tabs`, when `display: "segmented"`)
 * choosing which variant/member is active, rendering `children` (the
 * caller's own body for that selection) below it. This component never
 * reads `fieldDef.variants` itself — same "caller renders its own children"
 * composition as `GroupField`.
 *
 * @param props - See {@link VariantFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled picker plus the active selection's body.
 */
export function VariantField(props: VariantFieldProps): ReactNode {
  const field = useFieldContext();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);

  const picker =
    props.display === "segmented" ? (
      <Tabs value={props.activeKey} onValueChange={props.onActiveKeyChange}>
        <TabsList>
          {props.options.map((option) => (
            <TabsTrigger key={option.key} value={option.key} disabled={props.readOnly}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ) : (
      <Select value={props.activeKey} onValueChange={props.onActiveKeyChange} disabled={props.readOnly}>
        <SelectTrigger id={field.name}>
          <SelectValue placeholder="Select a type" />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      description={props.description}
      required={props.required}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
      readOnly={props.readOnly}
      isNull={props.isNull}
      onIsNullChange={props.onIsNullChange}
    >
      <div className="flex flex-col gap-3">
        {picker}
        {!props.isNull && <div className="flex flex-col gap-3">{props.children}</div>}
      </div>
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/index.ts

One edit — barrel export beside the other leaves.

```ts
export * from "./GroupField";
export * from "./VariantField";
```

#### packages/react/src/adapter.ts

Two edits.

**1 — import, beside `JsonFieldDisplay`:**

```ts
  JsonFieldAdmin,
  JsonFieldCell,
  JsonFieldDisplay,
  VariantFieldAdmin,
  VariantFieldCell,
  VariantFieldDisplay,
} from "./fields";
```

**2 — `buildReactAdapter()`'s `fields` map, after `json`:**

```ts
      [ADMIN_FIELDS.json.type]: {
        field: JsonFieldAdmin,
        cell: JsonFieldCell,
        display: JsonFieldDisplay,
      },
      [ADMIN_FIELDS.variant.type]: {
        field: VariantFieldAdmin,
        cell: VariantFieldCell,
        display: VariantFieldDisplay,
      },
    },
```

#### packages/react/src/fields/index.tsx

Three edits — the exhaustive `getCollectionColumnDefs` switch fails to typecheck without a case the
moment `VariantField` joins `AdminField`.

**1 — import, beside `jsonFieldToColumnDef`:**

```ts
import { jsonFieldToColumnDef } from "./json";
import { variantFieldToColumnDef } from "./variant";
```

**2 — barrel export, beside `./json`:**

```ts
export * from "./json";
export * from "./variant";
```

**3 — switch case, before `default:`:**

```ts
      case ADMIN_FIELDS.json.type:
        columnDef = jsonFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.variant.type:
        columnDef = variantFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      default: {
```

#### packages/react/src/testing/fixtures/index.ts

Two edits.

**1 — import, beside `richTextFieldFixture`:**

```ts
import { richTextFieldFixture } from "../../fields/richtext/testFixture";
import { variantFieldFixture } from "../../fields/variant/testFixture";
```

**2 — registry entry, beside `richtext`:**

```ts
  richtext: richTextFieldFixture,
  variant: variantFieldFixture,
};
```

#### packages/react/src/fields/variant/Field.test.tsx

New module — discriminated-mode switching/reset, primitive-mode type switch and active-member
resolution from a loaded value, the nullable toggle, and one nested-dispatch check (a `variant()`
field rendered as a child of `GroupFieldAdmin`, proving the registry wiring above works end-to-end).

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import "../../adapter";
import { variant, group, text, number, type VariantField as VariantFieldDef } from "@vexcms/core";
import { AppForm } from "../../forms/AppForm";
import { useAppForm } from "../../forms/useAppForm";
import { VariantFieldAdmin } from "./Field";
import { GroupFieldAdmin } from "../group/Field";
import { installDomPolyfills, testCollection } from "../../testing";

installDomPolyfills();

const collection = testCollection();

function Harness(props: { fieldDef: VariantFieldDef; defaultValue: unknown }) {
  const form = useAppForm({ defaultValues: { testField: props.defaultValue } });
  return (
    <AppForm form={form}>
      <VariantFieldAdmin name="testField" fieldDef={props.fieldDef} readOnly={false} collection={collection} />
    </AppForm>
  );
}

describe("VariantFieldAdmin — discriminated", () => {
  const channel = variant({
    label: "Channel",
    discriminator: "kind",
    variants: {
      email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } },
      sms: { label: "SMS", fields: { phoneNumber: text({ label: "Phone number", required: true }) } },
    },
  });

  it("renders the active variant's own fields", () => {
    render(<Harness fieldDef={channel} defaultValue={{ kind: "email", address: "a@b.com" }} />);
    expect(screen.getByLabelText("Address")).toHaveValue("a@b.com");
  });

  it("switching the picker resets the value to the new variant's defaults", async () => {
    const user = userEvent.setup();
    render(<Harness fieldDef={channel} defaultValue={{ kind: "email", address: "a@b.com" }} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "SMS" }));
    expect(screen.getByLabelText("Phone number")).toHaveValue("");
    expect(screen.queryByLabelText("Address")).not.toBeInTheDocument();
  });
});

describe("VariantFieldAdmin — primitive", () => {
  const amount = variant({
    label: "Amount",
    variants: { fixed: text({ label: "Fixed", required: true }), metered: number({ label: "Metered", required: true }) },
  });

  it("resolves the active member from the stored value's runtime kind on load", () => {
    render(<Harness fieldDef={amount} defaultValue={42} />);
    expect(screen.getByLabelText("Metered")).toHaveValue(42);
    expect(screen.queryByLabelText("Fixed")).not.toBeInTheDocument();
  });

  it("switching the type picker resets to the new member's default", async () => {
    const user = userEvent.setup();
    render(<Harness fieldDef={amount} defaultValue="flat rate" />);
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "metered" }));
    expect(screen.getByLabelText("Metered")).toHaveValue(0);
  });
});

describe("VariantFieldAdmin — nullable", () => {
  it("shows a Null toggle and hides the active selection's body while null", () => {
    const nullableChannel = variant({
      label: "Channel",
      nullable: true,
      discriminator: "kind",
      variants: { email: { label: "Email", fields: { address: text({ required: true }) } } },
    });
    render(<Harness fieldDef={nullableChannel} defaultValue={null} />);
    expect(screen.getByRole("switch", { name: /null/i })).toBeChecked();
    expect(screen.queryByLabelText("Address")).not.toBeInTheDocument();
  });
});

describe("VariantFieldAdmin — nested inside group()", () => {
  it("renders through the registry when nested as a group()'s own sub-field", () => {
    const withNestedVariant = group({
      label: "Settings",
      fields: {
        channel: variant({
          label: "Channel",
          discriminator: "kind",
          variants: { email: { label: "Email", fields: { address: text({ required: true }) } } },
        }),
      },
    });
    function NestedHarness() {
      const form = useAppForm({ defaultValues: { settings: { channel: { kind: "email", address: "x@y.com" } } } });
      return (
        <AppForm form={form}>
          <GroupFieldAdmin name="settings" fieldDef={withNestedVariant} readOnly={false} collection={collection} />
        </AppForm>
      );
    }
    render(<NestedHarness />);
    expect(screen.getByLabelText("Address")).toHaveValue("x@y.com");
  });
});
```

#### apps/test/src/vexcms/collections/storageShapes.ts

Append two fields, after Step 8's `userScores` (the nested `fields` map's last entry at that point).
Needs `variant` imported alongside the other field builders already in scope.

```ts
  channel: variant({
    label: "Channel",
    discriminator: "kind",
    variants: {
      email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } },
      sms: { label: "SMS", fields: { phoneNumber: text({ label: "Phone number", required: true }) } },
    },
  }),
  amount: variant({
    label: "Amount",
    variants: {
      fixed: text({ label: "Fixed amount", required: true }),
      metered: number({ label: "Metered amount", required: true }),
    },
  }),
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/telemetry test`; `pnpm --filter test vex:generate` then read `storage_shapes` in `convex/vex.schema.ts` (`channel`/`amount` as `v.union(...)`) and `vex.types.ts` (the TS unions); `pnpm typecheck`.

### Step 10 — Dogfood run-through in the browser [agent]

The acceptance gate for every field and override in this spec is the running admin on `apps/test`
(:3020). Attach to the developer's servers. Never start `next dev`, `convex dev` or `vex dev` (P-024).
If :3020 or the `apps/test` Convex watcher is down, add an item to § Human queue on the board and set FT-10 to `human`.

- [ ] Take the `apps/test/**` lock on `.agent/docs/product/launch-coordination.md` (rule 6)
- [ ] `pnpm --filter test vex:generate`, then read the `storage_shapes` table in `apps/test/convex/vex.schema.ts` and the `StorageShape` interface in `apps/test/src/vex.types.ts`. Every field must match the table below exactly.
- [ ] Browser pass on `http://localhost:3020/admin/collections/storage_shapes` (sign in with `QUALITY_ADMIN_EMAIL`/`QUALITY_ADMIN_PASSWORD` from `apps/test/.env.local`). Run every row of the checklist below.
- [ ] For each failure: fix it in the owning step's files, add a regression test next to the fix, re-run that row, and note it in the step's `> Writer note:` list during sync-spec
- [ ] Release the lock

**Expected generated shapes**

| Field | Convex validator | TS type |
| --- | --- | --- |
| `name` | `v.string()` | `string` |
| `nullableNote` | `v.optional(v.nullable(v.string()))` | `string \| null` (optional) |
| `nullableCount` | `v.optional(v.nullable(v.number()))` | `number \| null` (optional) |
| `nullableStatus` | `v.optional(v.nullable(v.array(v.union(v.literal(…)))))` | `NullableStatusOption[] \| null` (optional) |
| `nullableMeta` | `v.optional(v.nullable(v.object({ … })))` | `{ … } \| null` (optional) |
| `viewCount` | `v.optional(v.int64())` | `bigint` (optional) |
| `literalStatus` | `v.optional(v.union(v.literal(…), …))` | `LiteralStatusOption` (optional) |
| `stringStatus` | `v.optional(v.string())` | `string` (optional) |
| `ownerId` | `v.optional(v.id("user"))` | `Id<"user">` (optional) |
| `ownerRef` | `v.optional(v.string())` | `string` (optional) |
| `cover` | `v.optional(v.id("images"))` | `Id<"images">` (optional) |
| `payload` | `v.optional(v.bytes())` | `ArrayBuffer` (optional) |
| `scores` | `v.optional(v.record(v.string(), v.number()))` | `Record<string, number>` (optional) |
| `userScores` | `v.optional(v.record(v.id("user"), v.number()))` | `Record<Id<"user">, number>` (optional) |
| `channel` | `v.optional(v.union(v.object({ kind: v.literal("email"), … }), v.object({ kind: v.literal("sms"), … })))` | `{ kind: "email"; … } \| { kind: "sms"; … }` (optional) |
| `amount` | `v.optional(v.union(v.string(), v.number()))` | `string \| number` (optional) |

**Browser checklist**

| # | Surface | Check |
| --- | --- | --- |
| 1 | Create | New document with every field filled saves without error; the edit view reloads with the same values |
| 2 | Nullable scalars | Clear `nullableNote`, `nullableCount` and `nullableStatus` and save. The Convex dashboard data view (or `npx convex data storage_shapes` from `apps/test`) shows `null`, and the inputs show empty after reload |
| 3 | Nullable containers | The `nullableMeta` null toggle hides the group and saves `null`; toggling it off restores an editable group |
| 4 | int64 | `viewCount` accepts `9007199254740993`, rejects `1.5` and `abc` with a field error, and round-trips the exact digits after reload; the list cell shows the exact digits; sorting the column and the filter `viewCount > 9007199254740992` both work, and the URL holds the decimal digits |
| 5 | select single | `literalStatus`/`stringStatus` pick one value and store a scalar; the list filter `eq` matches |
| 6 | Scalar references | `ownerId`/`ownerRef` pick one user and store a scalar id/string; the cell shows the user's title; peek populates; the relationship filter chip shows the title; `cover` shows the image thumbnail in its cell |
| 7 | Bytes | File tab: upload a small file, size shown, download returns identical bytes. Hex tab: edit a byte and save, then re-open and the hex matches. A file over 512 KiB is rejected with the size message. Clearing saves no value |
| 8 | keyValue | Add, rename and remove rows for `scores`; a duplicate key shows an error; `userScores` keys use the user picker; the cell shows "N entries" |
| 9 | variant | `channel`: switch email ↔ sms and save each; the stored object has `kind` plus only that variant's fields. `amount`: switch string ↔ number and save each; after reload the type switch matches the stored runtime kind |
| 10 | Peek + copy | Peek's JSON tab renders a document with `viewCount` and `payload` without throwing; copy-value works on both |
| 11 | Duplicate | Duplicate the document: the new document carries every value (bigint, bytes, record, variant) |
| 12 | Drafts/versions | `storageShapes` has `versions: { drafts: true }`. Save a draft, publish, edit again, then restore the first version from history: `viewCount` (bigint), `payload` (bytes), `scores` and `channel` come back unchanged |
| 13 | Better Auth | `/admin/collections/session` (or the app's session/account slug): the `userId` cell shows the user title, and the edit view shows a read-only relationship |
| 14 | Console | No React errors or `TypeError: Do not know how to serialize a BigInt` in the console during rows 1–13 |

Verify: manual. All 14 rows pass on :3020; `pnpm --filter test vex:generate` output matches the shape table; `pnpm typecheck && pnpm test` green after any fixes.

### Step 11 — Docs, telemetry audit, standards, changesets, bookkeeping [agent]

> Writer note: `spec-tasks.md` names "the fields overview" as the home for the `nullable`
> doc entry, but no such page exists — `apps/docs/src/content/docs/` has no `fields/index.mdx`
> or shared base-options page; `docs-site-conventions.md` says every field page's own options
> table IS the base-options reference (`<Type>FieldInput` per page). `text.mdx` is the one page
> that already plays this "shared reference other pages link to" role — it owns `## Compound
> indexes`, which `select`/`checkbox`/`number`/`upload` all link to via
> `/fields/text/#compound-indexes` instead of repeating the content. This section adds `##
> Nullable values` to `text.mdx` on the same pattern and links to it from every page this step
> touches, rather than retrofitting all 19 pre-existing field pages (out of scope here — no
> step touches their config-option tables otherwise). The three new field pages document
> `nullable` directly in their own options tables, matching how every other base option
> (`label`, `required`, `description`, …) is already documented per-page.
>
> `ft-decisions.md`'s contract table gives `bytes`/`keyValue`/`variant` an `ADMIN_FIELDS`
> validator **placeholder** (`v.bytes()`, `v.record(v.string(), v.any())`, `v.any()`) for the
> constants-table `validator`/`interfaceType` stamp Steps 7–9 use at config time — those are
> not the field's generated Convex output in general (a `keyValue` field's real validator is
> `v.record(<keys>, <value>)` with the value's own validator; a `variant`'s is
> `v.union(...)`/a single member validator). The docs below describe the real generated output,
> not the placeholder.
>
> Telemetry attribute names for `nullable`, `schema.validator`, and the three new field types'
> own attributes are not named anywhere in the contract — Steps 2–9 each only commit to
> "record `nullable`" / "record `schema.validator`" / "telemetry walker case" without a field
> name. This section's telemetry-audit edits to `guides/telemetry.mdx` **name** them
> (`nullable`, `schemaValidator`, bytes' reuse of the existing `max`/`hasAccept` rows,
> `keyValue`'s new `keyKind`, `variant`'s new `hasDiscriminator`/`variantCount`) so Steps 2–9
> and this step's audit agree on one vocabulary; if an earlier step already landed different
> names, follow the earlier step's names and fix this page's rows to match instead of the
> reverse — the resolver should treat landed field names in `anonymizeConfig.ts` as ground
> truth over this doc page.

Why: the docs field catalog and the field-type recipe are what adopters and contributors read.
Telemetry has to describe the new field types and options accurately. The launch plan and
backlog have to reflect what shipped.
Verify: `pnpm --filter docs build`; `pnpm --filter @vexcms/telemetry test`; `pnpm lint`;
`pnpm test`.

- [ ] `apps/docs/src/content/docs/fields/bytes.mdx`, `key-value.mdx`, `variant.mdx` — full new pages
- [ ] `## Storage override` sections on `number`/`select`/`relationship`/`upload` doc pages, each with the manual-migration note
- [ ] `## Nullable values` on `text.mdx`, linked from every page this step touches
- [ ] `index.mdx` field-type count and list bumped to the new total
- [ ] `.agent/docs/standards/core/{adding-a-field-type,field-config-conventions}.md` + `apps/docs/.../dev/adding-a-field-type.mdx` updated
- [ ] `guides/telemetry.mdx` — `nullable`, `schemaValidator`, and the three new field types' attribute rows added to the `AnonymizedField` table
- [ ] `.changeset/*.md` (patch, P-025) for `@vexcms/core`, `@vexcms/react`, `@vexcms/better-auth`, `@vexcms/telemetry`
- [ ] launch plan item 18 ticked; `launch-coordination.md` FT rows set `done`; backlog § Field storage override removed
- [ ] `harness tasks move "FT — Convex field-type coverage" --to done`; `harness log append`

#### apps/docs/src/content/docs/fields/bytes.mdx

```mdx
---
title: bytes field
description: Stores raw binary data as an ArrayBuffer — checksums, small binary blobs, and any field mapping an existing v.bytes() column.
---

A `bytes()` field stores a raw binary value as Convex's native `v.bytes()`
(`ArrayBuffer`). It is used for checksums, small binary blobs, and any column
whose existing Convex schema already stores `v.bytes()`. There is no
shape/format option on the field itself — `maxSize` is the only constraint,
enforced before the value reaches the server.

## Config options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `label` | `string` | `""` | Display label in the admin panel. Inferred from the field key by `defineCollection` when left empty. |
| `required` | `boolean` | `false` | When `false`, the field is wrapped in `v.optional(…)` in the schema and the form allows leaving it empty. |
| `nullable` | `boolean` | `false` | Stores `v.nullable(v.bytes())` (wrapped in `v.optional(…)` too when `required` is `false`); the generated type is `ArrayBuffer \| null`. Clearing the input writes `null` instead of emptying the value. See [Nullable values](/fields/text/#nullable-values). |
| `maxSize` | `number` | `524_288` (512 KiB) | Maximum accepted byte size. Enforced by the Zod input schema and the admin UI before the value is submitted. |
| `accept` | `string` | — | MIME type restriction passed through to the file-tab input's `accept` attribute, e.g. `"image/*"`. |
| `defaultValue` | `ArrayBuffer` | `undefined` | Pre-filled value shown in the admin form when creating a new document. |
| `description` | `string` | — | Helper text shown below the field input. |
| `admin.hidden` | `boolean` | `false` | Hides the field from the admin edit form entirely. |
| `admin.readOnly` | `boolean` | `false` | Renders both tabs as non-interactive — the current value and size are visible but cannot be changed. |
| `admin.position` | `"main" \| "sidebar"` | `"main"` | Column in the admin edit layout where this field appears. |
| `admin.width` | `string` | `"100%"` | CSS width of the field in the edit form (e.g. `"50%"`, `"240px"`). Meaningful as a child of `row()`; below a narrow form column every field renders full width regardless. |
| `admin.cellAlignment` | `"left" \| "center" \| "right"` | `"left"` | Horizontal alignment of the value in the list-view table cell. |
| `admin.description` | `string` | — | Helper text displayed below the field input. |
| `admin.condition` | `(props: { data, siblingData }) => boolean` | — | Shows the field only while this returns `true`. A throwing condition counts as met. Hidden fields skip `required`/`validate` on the server too. See the [Conditional fields & masks guide](/guides/conditional-fields-and-masks/). |

## Schema output

```ts
// Optional (required: false — default)
checksum: v.optional(v.bytes())

// Required
payload: v.bytes()

// Nullable, required
signature: v.nullable(v.bytes())
```

**Usage**

```ts
import { defineCollection, bytes, text } from "@vexcms/core";

const attachments = defineCollection({
  slug: "attachments",
  fields: {
    name: text({ required: true }),

    // Capped at the default 512 KiB
    payload: bytes({ required: true }),

    // Smaller cap, restricted to image bytes
    thumbnail: bytes({ maxSize: 65_536, accept: "image/*" }),

    // Optional checksum, nullable so a cleared value can be distinguished
    // from one that was never set
    checksum: bytes({ nullable: true }),
  },
});
```

**Admin UI**

The field renders two tabs, mirroring `upload()`'s file/library split: a **File** tab (a
drag-and-drop/picker input that replaces the whole value on selection) and a **Hex** tab (a
monospace textarea showing the current value as a hex dump, editable in place and re-parsed on
blur). Both tabs show the current size, a download button, and a clear button. `maxSize` is
enforced on both tabs — a file over the cap, or a hex edit that decodes to more bytes than the
cap, is rejected with an inline error. In the list-view table, the cell shows the byte size
(e.g. `"2.4 KB"`), not the raw bytes.

**Filtering**

Only `isEmpty`/`isNotEmpty` operators are available in the list-view filter builder — a binary
value has no meaningful equality or range comparison in the UI.
```

#### apps/docs/src/content/docs/fields/key-value.mdx

```mdx
---
title: keyValue field
description: Stores a Convex v.record() — a dynamic set of key/value pairs sharing one value shape, keyed by string or by Id.
---

A `keyValue()` field stores a Convex `v.record(keys, values)` — a dynamic-length
map whose keys are *not* a fixed set (use `group()` for that) and whose values
all share one shape, described by a single nested data field. It is used for
per-locale overrides, scoreboards, or any existing `v.record(...)` column.

Keys are `v.string()` by default, or `v.id("slug")` for a collection's documents
when `keys: { collection: { slug } }` is set — Convex only allows a record's keys
to be a string, an id, or a union of those, so a fixed/literal key set is not
supported here; use `group()` for that shape instead.

## Config options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `AdminDataField` | — | **Required.** The nested data field describing every value's shape — any VexCMS data field, including containers (`group()`, `array()`, `blocks()`, another `keyValue()`, …). Its own `required` does not wrap it in `v.optional(…)` (a record's values can't be optional in Convex); its own `nullable` still applies. |
| `keys.collection.slug` | `CollectionSlug` | — | When set, keys are `v.id("slug")` instead of `v.string()`, and the admin key input becomes a relationship-style picker scoped to that collection. |
| `label` | `string` | `""` | Display label in the admin panel. Inferred from the field key by `defineCollection` when left empty. |
| `required` | `boolean` | `false` | When `false`, the field is wrapped in `v.optional(…)` in the schema. |
| `nullable` | `boolean` | `false` | Stores `v.nullable(v.record(...))` (wrapped in `v.optional(…)` too when `required` is `false`); the generated type is `Record<K, V> \| null`. Renders a null toggle instead of an empty-input state, like every other container field. See [Nullable values](/fields/text/#nullable-values). |
| `defaultValue` | `Record<string, unknown>` | `{}` | Pre-filled rows shown in the admin form when creating a new document. |
| `description` | `string` | — | Helper text shown below the field input. |
| `admin.hidden` | `boolean` | `false` | Hides the field from the admin edit form entirely. |
| `admin.readOnly` | `boolean` | `false` | Renders every row as non-interactive. |
| `admin.position` | `"main" \| "sidebar"` | `"main"` | Column in the admin edit layout where this field appears. |
| `admin.width` | `string` | `"100%"` | CSS width of the field in the edit form (e.g. `"50%"`, `"240px"`). Meaningful as a child of `row()`; below a narrow form column every field renders full width regardless. |
| `admin.cellAlignment` | `"left" \| "center" \| "right"` | `"left"` | Alignment used for this field's column in the list-view table. |
| `admin.condition` | `(props: { data, siblingData }) => boolean` | — | Shows the field only while this returns `true`. A throwing condition counts as met. Container conditions AND into children. See the [Conditional fields & masks guide](/guides/conditional-fields-and-masks/). |

## Schema output

```ts
// String-keyed record of numbers (default — required: false)
scores: v.optional(v.record(v.string(), v.number()))

// Id-keyed record — values keyed by a user document's Id
userScores: v.record(v.id("users"), v.number())

// Nullable, required
tallies: v.nullable(v.record(v.string(), v.number()))
```

**Usage**

```ts
import { defineCollection, keyValue, number, text } from "@vexcms/core";

const games = defineCollection({
  slug: "games",
  fields: {
    name: text({ required: true }),

    // String-keyed number values
    scores: keyValue({ value: number() }),

    // Id-keyed values — keys are users' Ids, not arbitrary strings
    userScores: keyValue({
      keys: { collection: { slug: "users" } },
      value: number({ defaultValue: 0 }),
    }),

    // Nested container value — each key maps to a small group
    rounds: keyValue({
      value: text({ label: "Winner" }),
      nullable: true,
    }),
  },
});
```

**Nesting**

`keyValue()` nests anywhere a data field nests — inside a `group()`, an `array()`'s `items`, a
`blocks()` block's own fields, or another `keyValue()`'s/`variant()`'s value — and its own
`value` field accepts any data field, including another container. Every field walker
(interface generation, populate/depth, telemetry) recurses into a `keyValue()`'s `value` the
same way it recurses into a `group()`'s `fields`.

**Admin UI**

The field renders as a list of key/value rows, each with a key input (plain text, or a
relationship-style picker when `keys.collection` is set) and the `value` field's own input
rendered per row. Adding a row appends an empty key; removing one deletes the row. Keys must be
unique within the field — a duplicate key shows an inline error and blocks submission. In the
list-view table, the cell shows a compact `{ n keys }` badge, matching `group()`'s cell;
sorting is disabled for the same reason.

**TypeScript output**

```ts
// Generated document interface
export interface GamesDocument extends VexDocument {
  _id: Id<"games">;
  scores?: Record<string, number>;
  userScores: Record<Id<"users">, number>;
  // ...other fields
}
```
```

#### apps/docs/src/content/docs/fields/variant.mdx

```mdx
---
title: variant field
description: Stores a single (non-array) object union or primitive union — a Convex v.union() held in one value, not a list like blocks().
---

A `variant()` field stores a single Convex `v.union(...)` value — one of several
possible shapes, held directly (not as a list, unlike `blocks()`). It has two
modes, selected by whether `discriminator` is set.

**Discriminated** (`discriminator` set): each entry in `variants` is `{ label,
fields }`, and the stored value is `v.union(v.object({ [discriminator]:
v.literal(key), ...fields }), …)` — an object union keyed by that property, with
no injected `id`/`blockName` keys (unlike `blocks()`), so it matches an existing
discriminated-object-union column exactly.

**Undiscriminated** (`discriminator` omitted): each entry in `variants` is a
data field directly, and the stored value is `v.union(<member validators>)` — a
primitive union. Members must have **distinct runtime kinds**, checked when the
config is built — two members that would both resolve to, say, `v.string()`,
throw a `VexConfigError` at config time, since the stored value alone couldn't
tell them apart.

## Config options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `variants` | `Record<string, { label: string, fields: Record<string, AdminField> }>` (discriminated) or `Record<string, AdminDataField>` (undiscriminated) | — | **Required.** The union's members, keyed by a stable name used only in config (never stored). |
| `discriminator` | `string` | — | When set, switches to discriminated mode — the property name injected onto every member object and used as its `v.literal(key)`. |
| `label` | `string` | `""` | Display label in the admin panel. Inferred from the field key by `defineCollection` when left empty. |
| `required` | `boolean` | `false` | When `false`, the field is wrapped in `v.optional(…)` in the schema. |
| `nullable` | `boolean` | `false` | Stores `v.nullable(v.union(...))` (wrapped in `v.optional(…)` too when `required` is `false`); the generated type adds `| null`. Renders a null toggle instead of an empty-input state, like every other container field. See [Nullable values](/fields/text/#nullable-values). |
| `defaultValue` | matches the union's TS type | `undefined` | Pre-filled value shown in the admin form when creating a new document. |
| `description` | `string` | — | Helper text shown below the field input. |
| `admin.hidden` | `boolean` | `false` | Hides the field from the admin edit form entirely. |
| `admin.readOnly` | `boolean` | `false` | Renders the picker and the active member's input as non-interactive. |
| `admin.position` | `"main" \| "sidebar"` | `"main"` | Column in the admin edit layout where this field appears. |
| `admin.width` | `string` | `"100%"` | CSS width of the field in the edit form (e.g. `"50%"`, `"240px"`). Meaningful as a child of `row()`; below a narrow form column every field renders full width regardless. |
| `admin.cellAlignment` | `"left" \| "center" \| "right"` | `"left"` | Alignment used for this field's column in the list-view table. |
| `admin.condition` | `(props: { data, siblingData }) => boolean` | — | Shows the field only while this returns `true`. A throwing condition counts as met. Container conditions AND into children. See the [Conditional fields & masks guide](/guides/conditional-fields-and-masks/). |

Members are never wrapped in `v.optional(...)` — the variant's own `required`/`nullable`
govern the whole union, not its members.

## Schema output

```ts
// Discriminated — an object union keyed by "kind", no id/blockName keys
channel: v.optional(v.union(
  v.object({ kind: v.literal("email"), address: v.optional(v.string()) }),
  v.object({ kind: v.literal("sms"), number: v.optional(v.string()) }),
))

// Undiscriminated — a primitive union; members have distinct runtime kinds
amount: v.optional(v.union(v.string(), v.number()))
```

**Usage**

```ts
import { defineCollection, number, text, variant } from "@vexcms/core";

const notifications = defineCollection({
  slug: "notifications",
  fields: {
    // Discriminated — an object union, switched on "kind"
    channel: variant({
      discriminator: "kind",
      variants: {
        email: { label: "Email", fields: { address: text({ required: true }) } },
        sms: { label: "SMS", fields: { number: text({ required: true }) } },
      },
    }),

    // Undiscriminated — a primitive union; distinct runtime kinds required
    amount: variant({
      variants: { label: text(), amount: number() },
    }),
  },
});
```

A config with two undiscriminated members that resolve to the same runtime kind throws at
config time:

```ts
// Throws VexConfigError — both members are v.string(), indistinguishable at runtime
variant({ variants: { a: text(), b: text() } });
```

**Nesting**

`variant()` nests anywhere a data field nests — inside a `group()`, an `array()`'s `items`, a
`blocks()` block's own fields, or a `keyValue()`'s `value` — and a discriminated member's own
`fields` (or an undiscriminated member field) accepts any data field, including another
container. Every field walker recurses into a `variant()`'s members the same way it recurses
into a `group()`'s `fields`.

**Admin UI**

The field renders a variant/type picker (a dropdown of each member's `label`, or its key when
undiscriminated) above the active member's own input. Switching the picker replaces the current
value with that member's empty shape. In discriminated mode, the picker's current selection is
read from the stored `discriminator` property; in undiscriminated mode, it's inferred from the
stored value's runtime kind. In the list-view table, the cell shows the active member's label
(discriminated) or a short type tag (undiscriminated) — not the member's own value.

**TypeScript output**

```ts
export type NotificationsChannel =
  | { kind: "email"; address?: string }
  | { kind: "sms"; number?: string };

export type NotificationsAmount = string | number;
```
```

#### apps/docs/src/content/docs/fields/number.mdx

One edit — a new `## Storage override` section added after `## Schema output`, before
`## Usage`.

```mdx
## Storage override

`schema: { validator: "int64" }` switches the field's storage from Convex's default
`v.float64()` to `v.int64()` (native `bigint`). This is for adopting an existing `v.int64()`
column — counters, large ids kept as a 64-bit integer — without a conversion field. The input
stays a numeric entry, but the value is `bigint` end to end: the generated type, `min`/`max`/
`defaultValue`, Vex reads, and the admin form all hold a `bigint`, not a `number` scaled through
milliseconds the way `commitTs` is.

```ts
// Default storage (no schema override)
score: v.optional(v.float64())

// schema: { validator: "int64" } — native bigint
viewCount: number({ schema: { validator: "int64" }, min: 0n, defaultValue: 0n })
// viewCount: v.optional(v.int64())
```

Changing `schema.validator` on a field over a table that already has data does not migrate
existing rows — the new validator must already match what's stored (an existing `v.int64()`
column adopts `"int64"`; an existing `v.float64()` column uses no override at all). Migrate
stored values manually before changing the field config if the shapes don't already match;
VexCMS performs no automatic migration of a field's storage shape.
```

#### apps/docs/src/content/docs/fields/select.mdx

One edit — a new `## Storage override` section added after `## Stored values are always a
list`.

```mdx
## Storage override

`select()` always stores an array (see above) unless `schema.validator` is set AND `hasMany`
is `false` — when `hasMany` is `true`, `schema` is typed `never`: the override only applies to
single-value selects.

`schema: { validator: "literal" }` stores a scalar `v.union(v.literal(a), v.literal(b), …)`
(a single option collapses to a bare `v.literal(a)`), typed as the field's own
`{FieldKey}Option` literal union — not wrapped in an array. `schema: { validator: "string" }`
stores a scalar `v.string()`, typed `string` — stored data may hold a value off the configured
`options` list; `options` still drives the admin dropdown and the Zod enforcement, just not the
Convex validator.

```ts
// Default storage — always an array, even with hasMany: false
tier: v.optional(v.array(v.string()))

// schema: { validator: "literal" }, hasMany: false — scalar literal union
literalStatus: select({
  schema: { validator: "literal" },
  options: [{ label: "Draft", value: "draft" }, { label: "Live", value: "live" }],
})
// literalStatus: v.optional(v.union(v.literal("draft"), v.literal("live")))

// schema: { validator: "string" }, hasMany: false — scalar string, open-ended storage
stringStatus: select({ schema: { validator: "string" }, options: [...] })
// stringStatus: v.optional(v.string())
```

Changing `schema.validator` on a field over a table that already has data does not migrate
existing rows — migrate the column's stored shape manually first if it doesn't already match
the new validator; VexCMS performs no automatic migration of a field's storage shape.
```

#### apps/docs/src/content/docs/fields/relationship.mdx

One edit — a new `## Storage override` section added after `## Querying by a relationship`.

```mdx
## Storage override

`relationship()` always stores `v.array(v.id("slug"))` (see above) unless `schema.validator`
is set AND `hasMany` is `false` — when `hasMany` is `true`, `schema` is typed `never`: the
override only applies to a single reference.

`schema: { validator: "id" }` stores a scalar `v.id("slug")`, typed `Id<"slug">`. `schema: {
validator: "string" }` stores a scalar `v.string()`, typed `string` — for a reference column a
library owns and keeps as a plain string (Better Auth's own `references` attributes use this;
see the [auth guide](/guides/auth/)). Populate, `depth`, `where`, auto-generated indexes,
access rules, and draft-relationship guards all accept the scalar id directly — none of them
need the one-element-array unwrapping a `hasMany: false` array-stored relationship needs.

```ts
// Default storage — always an array, even with hasMany: false
author: v.optional(v.array(v.id("authors")))

// schema: { validator: "id" }, hasMany: false — scalar Id
owner: relationship({ collection: { slug: "users" }, schema: { validator: "id" } })
// owner: v.optional(v.id("users"))

// schema: { validator: "string" }, hasMany: false — scalar string, library-owned reference
userId: relationship({ collection: { slug: "users" }, schema: { validator: "string" } })
// userId: v.optional(v.string())
```

Changing `schema.validator` on a field over a table that already has data does not migrate
existing rows — migrate the column's stored shape manually first if it doesn't already match
the new validator; VexCMS performs no automatic migration of a field's storage shape.
```

#### apps/docs/src/content/docs/fields/upload.mdx

One edit — a new `## Storage override` section added after `## Populating`.

```mdx
## Storage override

`upload()` always stores `v.array(v.id("<to-slug>"))` (see above) unless `schema.validator` is
set AND `hasMany` is `false` — when `hasMany` is `true`, `schema` is typed `never`: the override
only applies to a single file reference.

`schema: { validator: "id" }` stores a scalar `v.id("<to-slug>")`, typed `Id<"<to-slug>">`.
`schema: { validator: "string" }` stores a scalar `v.string()`, typed `string`, for a
library-owned media reference kept as a plain string. Populate and `depth` accept the scalar id
directly.

```ts
// Default storage — always an array, even with hasMany: false
featuredImage: v.optional(v.array(v.id("images")))

// schema: { validator: "id" }, hasMany: false — scalar Id
cover: upload({ to: "images", schema: { validator: "id" } })
// cover: v.optional(v.id("images"))
```

Changing `schema.validator` on a field over a table that already has data does not migrate
existing rows — migrate the column's stored shape manually first if it doesn't already match
the new validator; VexCMS performs no automatic migration of a field's storage shape.
```

#### apps/docs/src/content/docs/fields/text.mdx

One edit — a new `## Nullable values` section added after `## Compound indexes`, before
`## Schema output`. Added as the shared reference every other field page's `nullable` row links
to, the same role `## Compound indexes` already plays for `index`.

```mdx
## Nullable values

Every data field accepts a top-level `nullable: boolean` option (default `false`), independent
of `required`. It describes a Convex `v.nullable(X)` column — distinct from `required: false`,
which describes `v.optional(X)` (the key can be absent). The two compose:

| `required` | `nullable` | Schema output | TS type |
|---|---|---|---|
| `false` (default) | `false` (default) | `v.optional(v.string())` | `string \| undefined` |
| `true` | `false` | `v.string()` | `string` |
| `false` | `true` | `v.optional(v.nullable(v.string()))` | `string \| null \| undefined` |
| `true` | `true` | `v.nullable(v.string())` | `string \| null` |

Clearing a nullable field's input writes `null`, not an empty string/`undefined` — this is how
an adopted table's existing `null` rows round-trip through the admin form. Fields with no
natural "empty" input state — every container (`group()`, `array()`, `blocks()`, `json()`,
`richtext()`, `keyValue()`, `variant()`) and `checkbox()` — render a **Null** switch in the
label row instead; flipping it to on hides the field's own input and writes `null` on save.

```ts
// nullable, required: false (default) — the key may be absent OR null
bio: text({ nullable: true })

// nullable, required: true — the key is always present, string or null
middleName: text({ required: true, nullable: true })
```
```

#### apps/docs/src/content/docs/index.mdx

One edit — the "Field types" card's count and list, to include the three new field types.

```mdx
	<Card title="Field types" icon="list-format">
		Fifteen field types, from `text()` and `number()` to `relationship()`,
		`group()`, `blocks()`, `bytes()`, `keyValue()`, and `variant()`. Start with
		the [text field](/fields/text/), or browse the full set in the sidebar
		under **Fields**.
	</Card>
```

#### .agent/docs/standards/core/adding-a-field-type.md

Two edits — everything else unchanged.

**1 — nullable needs no type-specific wiring.** New paragraph after item 5 (`index.ts` barrel),
before "## Core shared updates":

```md
`nullable` (a `BaseFieldInput`/`BaseField` option, see `field-config-conventions.md`) needs no
type-specific code in `config.ts`/`validator.ts`/`inputSchema.ts` — `applyBaseValidators()`/
`applyBaseInputSchemaMeta()` already apply it for every field that calls them. A container type
(no natural empty input state) additionally wires `FormFieldLayout`'s `isNull`/`onIsNullChange`
in its own `fields/<type>/Field.tsx`, the way `group`/`array`/`blocks`/`json`/`richtext` do.
```

**2 — storage override is opt-in per type.** New paragraph after item 10
(`fields/inputSchemas/index.ts`), before "## React — ...":

```md
A field type that maps to more than one Convex validator shape (today: `number`, `select`,
`relationship`, `upload`) adds an optional `schema?: { validator?: <subset> }` to its
`<Type>FieldInput`, drawn from `FIELD_SCHEMA_VALIDATORS` (`fields/constants.ts`) — never an
inline literal union. `validator.ts` branches on the resolved `field.schema?.validator` to emit
the alternate Convex validator source string; `config.ts` stamps the matching `interfaceType`.
When the type also has `hasMany`, type `schema` as `never` when `hasMany: true` — the override
only applies to a single-value field (see `field-config-conventions.md`).
```

#### .agent/docs/standards/core/field-config-conventions.md

One edit — two new bullets appended after the existing "No field-type-level admin defaults"
bullet.

```md
- **`nullable` is a base option, not per-type:** `BaseFieldInput.nullable?: boolean` /
  `BaseField.nullable: boolean` (resolved, default `false`) is resolved once, same as
  `required`/`label`/`admin.*` — a field type's own `config.ts` never redeclares it.
  `applyBaseValidators` wraps `v.nullable(X)` before `v.optional(X)`; `applyBaseInputSchemaMeta`
  mirrors it with `.nullable()` before `.optional()`.
- **`schema.validator` storage overrides are opt-in, drawn from one constants map:**
  `FIELD_SCHEMA_VALIDATORS` (`fields/constants.ts`) is the single source of validator-name
  literals (`"int64"`, `"literal"`, `"string"`, `"id"`); a field type exposing an override types
  its own `schema?: { validator?: <subset of FIELD_SCHEMA_VALIDATORS> }` against that map, never
  a parallel inline union. On a type that also has `hasMany`, `schema` is typed `never` when
  `hasMany: true` — overrides only apply to single-value storage. Omitting `schema` entirely
  leaves the field's default storage unchanged (non-breaking).
```

#### apps/docs/src/content/docs/dev/adding-a-field-type.mdx

One edit — a new paragraph appended after the "Copy an existing field folder..." list in
`## The core half`, before "Then three shared registrations...".

```mdx
Two options need no type-specific wiring at all: `nullable` (every data field gets it for free
from `applyBaseValidators`/`applyBaseInputSchemaMeta` — a container type additionally wires
`FormFieldLayout`'s null toggle in its own `Field.tsx`) and, for a type mapping to more than one
Convex validator shape, an opt-in `schema?: { validator }` drawn from
`FIELD_SCHEMA_VALIDATORS` (`fields/constants.ts`) — see
[`adding-a-field-type.md`](https://github.com/ianyimi/vex/blob/main/.agent/docs/standards/core/adding-a-field-type.md)
for the condensed checklist version of both.
```

#### apps/docs/src/content/docs/guides/telemetry.mdx

Three edits to the `#### Fields (AnonymizedField)` table (`## Config payload` section) —
everything else in the file unchanged.

**1 — `nullable` row**, inserted after the `readOnly` row:

```md
| `nullable` | `boolean \| undefined` | Whether the field stores `v.nullable(...)`. |
```

**2 — `schemaValidator` row**, inserted after the `target` row (the last of the
relationship/upload-specific rows):

```md
| `schemaValidator` | `FieldSchemaValidator \| undefined` | Number/select/relationship/upload field with a `schema.validator` storage override: which override is set (`"int64"`, `"literal"`, `"string"`, or `"id"`). Absent when the field uses its default storage. |
```

**3 — bytes/keyValue/variant rows**, inserted after the `on` row (the last row before "Any
config key not on this allowlist..."):

```md
| `keyKind` | `"string" \| "id" \| undefined` | `keyValue` field: whether keys are plain strings or a collection's document ids — never which collection. |
| `hasDiscriminator` | `boolean \| undefined` | `variant` field: whether `discriminator` is set (an object union) or not (a primitive union). |
| `variantCount` | `number \| undefined` | `variant` field: number of configured members. |
```

`max`/`hasAccept` (already in the table, upload-sourced) are reused as-is for `bytes()`:
`max` is the field's `maxSize` in bytes, `hasAccept` is whether `accept` is set — add "or
bytes' `maxSize`" / "or a bytes field's `accept`" to those two rows' existing descriptions.

No edit needed for the `fieldTypes` select on `apps/test`'s `telemetryProjects` collection
(`packages/telemetry/src/anonymizeConfig.ts` consumers) — its options are generated from
`Object.values(ADMIN_FIELDS)`, so `bytes`/`keyValue`/`variant` appear automatically once Steps
7–9 add their `ADMIN_FIELDS` entries; confirm this during the audit rather than hand-editing the
collection. Confirm also that `fitTelemetryEvent.ts`'s size-cap logic (drops
`resources`/`blocks`/`fields`, keeps every count/`features` field, AP-026's measured 512KB cap)
needs no change — the three new attributes are small per-field scalars, not a new top-level
array.

#### .changeset/ft-core-field-coverage.md

```md
---
"@vexcms/core": patch
---

Every data field now accepts a top-level `nullable: boolean` option, independent of `required`
— `v.nullable(X)`, wrapped in `v.optional(...)` too when the field isn't required, typed
`T | null`. Clearing a nullable field's input writes `null`; containers with no natural empty
input state (`group`, `array`, `blocks`, `json`, `richtext`, `keyValue`, `variant`) and
`checkbox` render a null toggle instead.

`number`, `select`, `relationship`, and `upload` gain an opt-in `schema: { validator }` storage
override for adopting an existing Convex table without changing its stored shape: `number`
(`"int64"` → native `bigint`, no ms conversion), `select` (`"literal"` → a scalar literal
union, `"string"` → a scalar `v.string()`), and `relationship`/`upload` (`"id"` → a scalar
`v.id(...)`, `"string"` → a scalar `v.string()`). The override is typed `never` whenever the
field has `hasMany: true` — it only applies to single-value storage — and omitting it leaves
today's default storage unchanged.

Three new fields close the remaining Convex validator gaps: `bytes()` (`v.bytes()`,
`ArrayBuffer`), `keyValue()` (`v.record(keys, values)`, string or id keys, one nested data
field as the value shape — nests anywhere a data field nests), and `variant()` (a single,
non-array object union when `discriminator` is set, or a primitive union of distinct-runtime-
kind members otherwise — also nests anywhere a data field nests).

No migration: every new option is additive and opt-in. Changing an existing field's
`schema.validator` over a table that already has data is not migrated automatically — match
the override to what's already stored, or migrate the data manually first.
```

#### .changeset/ft-react-field-coverage.md

```md
---
"@vexcms/react": patch
---

Admin support for `@vexcms/core`'s new nullable/storage-override/field-type coverage:

- A **Null** switch appears in the label row of any `nullable` field with no natural empty
  input state (`group`, `array`, `blocks`, `json`, `richtext`, `keyValue`, `variant`,
  `checkbox`); other nullable fields clear to `null` on an empty save the same way they always
  cleared to their type's empty value.
- `number`, `select`, `relationship`, and `upload` inputs, cells, and filters bind a scalar
  value (`bigint`, a literal/string, or a bare `Id`/string) instead of an array wherever
  `schema.validator` is set, with `hasMany: false`.
- Two new field types: `bytes()` (a file/hex two-tab input, size + download + clear, byte-size
  cell) and `keyValue()` (a key + value row list with unique-key enforcement) and `variant()` (a
  variant/type picker plus the active member's input), each with a list-view cell, a read-only
  display, and nested support inside `group`/`array`/`blocks`/`keyValue`/`variant`.
- `forms/changedValues.ts`, the group/array/blocks cells and peek JSON tab, and the block
  clipboard are `bigint`/`ArrayBuffer`-safe end to end (display stringify, lossless copy/paste,
  deep-equal change detection) — no more throwing or false-positive diffs on an int64 or bytes
  value.

No migration: every change is additive to existing field types, or new field types with no
prior behavior to preserve.
```

#### .changeset/ft-better-auth-string-relationship.md

```md
---
"@vexcms/better-auth": patch
---

**User-visible admin behavior change.** Better Auth's `references` attributes (`session.userId`,
`account.userId`, and every other foreign-key column the adapter generates) now map to
`relationship({ collection: { slug }, schema: { validator: "string" } })` instead of `text()`.
The stored shape is unchanged — still a plain `v.string()` column, so no data migration is
needed — but the admin panel now renders these columns with a searchable relationship picker,
a populate-aware list-view cell, and `populate`/`depth` support, instead of a plain text input
that showed the raw string id with no link to the referenced document.

No migration: the Convex schema for these columns is unchanged (`v.string()` before and after).
Only the admin experience and this package's internal field config for them changed.
```

#### .changeset/ft-telemetry-field-coverage.md

```md
---
"@vexcms/telemetry": patch
---

`anonymizeConfig` now reports three more field attributes, all booleans/enums/counts per the
existing privacy allowlist (never a value, name, or label): `nullable` (any data field),
`schemaValidator` (`number`/`select`/`relationship`/`upload` fields with a storage override —
which override, never the stored data), and `keyKind`/`hasDiscriminator`/`variantCount` for the
three new field types (`bytes` reuses the existing `max`/`hasAccept` rows for `maxSize`/
`accept`). The size cap and truncation behavior (`fitTelemetryEvent.ts`) are unchanged — these
are small per-field scalars added to the existing flat `fields` array, not a new top-level
payload section.

No migration: additive fields only, allowlisted the same way every existing field attribute is.
```

#### .agent/docs/product/v0.1.0-launch-plan.md

One edit — tick item 18's checkbox (identifier: `**FT — Convex field-type coverage**`).

```md
18. [x] **FT — Convex field-type coverage** — dev-spec + implement: `v.int64`, `v.bytes`,
    `v.record` and an object union as a single field, following K's per-type recipe (core
    validator + type-gen + React input/cell + docs). Restored before 0.1.0 (previously deferred
    to 0.1.1). Shipped via `2026-11-22-field-type-coverage`; also added `nullable` and the
    `schema.validator` storage override, and moved Better Auth's `references` fields onto
    `relationship` string storage. (`v0.1.0-final-sprint.md` § 3b)
```

#### .agent/docs/product/backlog.md

One deletion — remove the `## Field storage override` section (the block between `---` after
`## Muted read-only images` and the `---` before `## Framework adapters`), shipped by this spec.
Nothing replaces it.

#### .agent/docs/product/launch-coordination.md

One edit — the `### FT — Convex field-type coverage` table, every row set `done`.

```md
| Row   | Step                                                                 | Waits for                 | Status      | Notes |
| ----- | -------------------------------------------------------------------- | ------------------------- | ----------- | ----- |
| FT-0  | Interview + spec (`spec-tasks.md`, `spec.md`)                         | —                         | done        |       |
| FT-1  | Convex-value-safe serialization + equality                           | FT-0                      | done        |       |
| FT-2  | `nullable` on every data field                                        | FT-1; `apps/test/**` lock | done        |       |
| FT-3  | `number` int64 storage                                                | FT-2                      | done        |       |
| FT-4  | `select` single storage                                               | FT-3                      | done        |       |
| FT-5  | `relationship`/`upload` single storage                                | FT-4                      | done        |       |
| FT-6  | Better Auth `references` → relationship string storage                | FT-5                      | done        |       |
| FT-7  | `bytes()`                                                             | FT-6                      | done        |       |
| FT-8  | `keyValue()`                                                          | FT-7                      | done        |       |
| FT-9  | `variant()`                                                           | FT-8                      | done        |       |
| FT-10 | Dogfood browser run-through (:3020)                                   | FT-9                      | done        |       |
| FT-11 | Docs, standards, changesets, bookkeeping                              | FT-10; launch-plan lock   | done        |       |
```

**Session bookkeeping commands**

```sh
harness tasks move "FT — Convex field-type coverage" --to done
harness log append
```

Verify: `pnpm --filter docs build`; `pnpm --filter @vexcms/telemetry test`; `pnpm lint`;
`pnpm test`.

## Verification

- `pnpm typecheck && pnpm lint && pnpm test --force` from the repo root (all packages and apps).
- `pnpm --filter test vex:generate`; `apps/test/convex/vex.schema.ts` and `apps/test/src/vex.types.ts`
  match Step 10's shape table.
- `pnpm --filter docs build`.
- Step 10's 14-row browser checklist passes on :3020.
