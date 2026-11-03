---
status: done
spec_id: 2026-10-28-committs-field
touches:
  - "packages/core/src/fields/commitTs/config.ts"
  - "packages/core/src/fields/commitTs/config.test.ts"
  - "packages/core/src/fields/commitTs/types.ts"
  - "packages/core/src/fields/commitTs/validator.ts"
  - "packages/core/src/fields/commitTs/validator.test.ts"
  - "packages/core/src/fields/commitTs/inputSchema.ts"
  - "packages/core/src/fields/commitTs/inputSchema.test.ts"
  - "packages/core/src/fields/commitTs/index.ts"
  - "packages/core/src/fields/constants.ts"
  - "packages/core/src/fields/index.ts"
  - "packages/core/src/fields/types.ts"
  - "packages/core/src/fields/validators/index.ts"
  - "packages/core/src/fields/inputSchemas/index.ts"
  - "packages/core/src/fields/utils.ts"
  - "packages/core/src/collections/resolveCollectionIndexes.ts"
  - "packages/core/src/collections/resolveCollectionIndexes.test.ts"
  - "packages/core/src/db/documents.ts"
  - "packages/core/src/db/documents.test.ts"
  - "packages/core/src/db/queryArgs.ts"
  - "packages/core/src/db/queryArgs.test.ts"
  - "packages/core/src/db/prepareEdit.ts"
  - "packages/core/src/collections/config.ts"
  - "packages/core/src/collections/api/create/server.ts"
  - "packages/core/src/collections/api/update/server.ts"
  - "packages/core/src/collections/api/get/server.ts"
  - "packages/core/src/collections/api/find/server.ts"
  - "packages/core/src/collections/api/search/server.ts"
  - "packages/core/src/collections/hooks.ts"
  - "packages/core/src/hooks/types.ts"
  - "packages/core/src/globals/hooks.ts"
  - "packages/core/src/versions/publish.ts"
  - "packages/core/src/versions/unpublish.ts"
  - "packages/core/src/versions/saveDraft.ts"
  - "packages/core/src/versions/removeVexFields.ts"
  - "packages/core/src/versions/removeVexFields.test.ts"
  - "packages/core/src/documents/cloneDocumentForDuplicate.ts"
  - "packages/core/src/collections/listUrlParams.ts"
  - "packages/core/src/collections/listUrlParams.test.ts"
  - "packages/react/src/fields/commitTs/Field.tsx"
  - "packages/react/src/fields/commitTs/Field.test.tsx"
  - "packages/react/src/fields/commitTs/Cell.tsx"
  - "packages/react/src/fields/commitTs/Cell.test.tsx"
  - "packages/react/src/fields/commitTs/columnDef.tsx"
  - "packages/react/src/fields/commitTs/columnDef.test.ts"
  - "packages/react/src/fields/commitTs/testFixture.ts"
  - "packages/react/src/fields/commitTs/index.ts"
  - "packages/react/src/fields/index.tsx"
  - "packages/react/src/collections/listView/ListFilterBuilder.tsx"
  - "packages/react/src/collections/listView/ListFilterBuilder.test.tsx"
  - "apps/docs/src/content/docs/guides/caching-and-seo.mdx"
  - "apps/docs/src/content/docs/guides/list-views.mdx"
  - ".agent/docs/product/v0.1.0-launch-plan.md"
prompt_version: 1
---

# 2026-10-28-committs-field — Spec

## Overview

Adds a new core field type, `commitTs()`, backed by Convex's `v.commitTs()` — the database's own commit-serialization clock (`ctx.db.vars.commitTs`, resolved server-side to a nanosecond `Int64`/`bigint`), as described in [Convex's commit timestamp docs](https://docs.convex.dev/database/advanced/commit-timestamp). It replaces `stampUpdatedAt`/the injected `updatedAt: date(...)` field with a real database-clock timestamp, configurable per field for which write events stamp it (`on: "save" | "publish" | "all"`), auto-indexed, read-only in forms, and converted to a plain Unix-ms `number` at every boundary that cannot carry a raw `bigint` (RSC props, `JSON.stringify`, URL codecs). It integrates with `2026-10-26-list-view-overhaul`'s sortable headers/default-view sort (`admin.view` replaces `defaultSort`/`defaultColumns`, that spec's Step 18) and its per-field filter-input registry (`fieldToFilterInputComponent`, Step 22 — `commitTs()`'s own `FilterInput`, date+time, is added against that registry once it exists). This spec lands after those steps and before that spec's own Step 24.

## Design Decisions

1. **`commitTs()` is a core field factory, same module shape as every other type** (`checkbox` is the template — probe §4, ~18 files). A later move of the type into a dedicated Convex-db package is out of scope; it stays in `packages/core/src/fields/` like every other type today.
2. **Options: `on: "publish" | "save" | "all"`, default `"save"`.** Mirrors the three-tier distinction the codebase already draws between an autosave tick (`saveDraft.ts`'s own doc comment: "an autosave tick is not a real edit of the live document") and a real edit. `"save"` reproduces today's `updatedAt` behavior (stamped on create/update/publish/unpublish/duplicate, never on a draft autosave). `"publish"` is for fields that should only move when content actually goes live (create of a non-versioned document counts, since such a document has no separate publish step — it is always "live"). `"all"` is for fields that want every write, autosave included. Multiple `commitTs` fields per collection are allowed, each with its own `on`.
3. **Index auto-emitted for every `commitTs` field**, using the exact index-option shape (`name`/`additionalFields`/`draftStatus`) every other field already uses — mirrors `resolveCollectionIndexes.ts`'s existing relationship-field auto-index branch (`by_<fieldKey>`, `source: "relationship"`), adding a sibling `source: "commitTs"` branch. A project MAY still declare its own `index` on a `commitTs` field (to name it or add `additionalFields`), which wins over the auto-default exactly like a relationship field's explicit index does today.
4. **Read-only in forms, excluded from create/update input validation.** `getFieldsInputSchema` (`fields/utils.ts`) already skips `admin.hidden` fields before dispatching to `adminFieldToInputSchema`; it gains an identical skip for `type === ADMIN_FIELDS.commitTs.type` — a `commitTs` field is never user-writable, so it has no business in the input schema at all. The React `Field.tsx` renders it like `DocumentTimestamps.tsx` (read-only display), never an editable control — there is no `Input`/`Checkbox`/`DateTimePicker` dispatch branch for it.
5. **Wire conversion: ms everywhere outside Convex's own query/mutation boundary.** Per probe §2, Convex's WebSocket/HTTP wire protocol (`convexToJson`/`jsonToConvex`) carries `bigint` natively both directions — no code needed there. The two edges that cannot: `fetchQuery`'s RSC→client-component prop hop (`NextAdminPage.tsx`) and any `JSON.stringify`/URL-param encode. Rather than audit every downstream consumer, `find`/`get`/`search` convert every `commitTs` field to a plain ms `number` (`Number(ns / 1_000_000n)`) before the document ever leaves `packages/core`'s own API boundary — the same contract a `date` field already has. A `where` condition's ms value converts back to ns `bigint` only at the query-building edge, inside `packages/core`, right before it reaches Convex's index-range builder.
6. **Clean cutover, no migration path (pre-release).** `stampUpdatedAt` and every call site are removed; every project collection's auto-injected `updatedAt` field becomes `commitTs({ on: "save" })` (same field key, so no collection author touches their own file — this is purely `defineCollection`'s own injection block). There is no code migration for existing `updatedAt` numeric data: a project with existing dev data must reset it (Convex schema validation rejects a stored `number` against a newly-declared `v.commitTs()` column).
7. **Lifecycle hooks never see a raw placeholder.** `prepareEdit.ts`'s `beforeChange` call passes `doc` with every `commitTs` field omitted (a hook reading it mid-mutation would see the literal unresolved placeholder object, per probe §1/§2 — "any `validate()` hook... must explicitly special-case `value instanceof CommitTsPlaceholder`"; omitting is simpler and matches "it can't be read during the mutation", stated plainly rather than requiring every hook author to guard it). Hook props instead gain an explicit `commitTs` placeholder value (`ctx.db.vars.commitTs`) a hook MAY use to stamp a *related* document in the same mutation (e.g. a parent row) — documented as unresolved until the mutation commits.
8. **List-view integration reuses the `date` bucket's reasoning verbatim** (probe §3): `FILTER_BUILDER_OPS_BY_FIELD_TYPE.commitTs = ["gte", "lte", "isEmpty", "isNotEmpty"]` — no `eq`/`neq` (an exact-ms match on a commit timestamp is never meaningful), value control is the same `DateTimePicker`, value is always the same ms number a `date` field's own URL/filter value is. `listUrlParams.ts`'s `filterValueKindForField` classifies `commitTs` as `"date"` kind — identical ISO-string codec, no new `FilterValueKind` needed.
9. **Test verification is layered, per probe §1.** `convex-test` 0.0.38 never resolves the placeholder (confirmed empirically — `typeof doc.ts === "object"` after a simulated commit). Core unit tests assert `instanceof CommitTsPlaceholder` (exported from `"convex/values"`) on the raw stamped write; ms-conversion logic is tested separately against hand-built resolved-`bigint` fixtures, never through a `convex-test` round-trip. A live dev-deployment smoke step (Step 8) is the only place a real resolved value is observed.
10. **`vex_versions` snapshots never carry a raw placeholder.** `removeVexFields` (today purely key-set-based: `CONVEX_SYSTEM_FIELDS` + `VERSION_SYSTEM_FIELDS`) gains an optional `fields` param and strips every `commitTs`-typed field by TYPE, not by a fixed key set — a snapshot embedding an unresolved placeholder would, per Convex's own docs, resolve it to the *snapshot row's own* insert commit (meaningless, and different on every future rewrite). `cloneDocumentForDuplicate.ts`'s existing single-purpose `delete stripped[COLLECTION_SYSTEM_FIELDS.updatedAt.slug]` line is now redundant (generically covered) and removed.
11. **`defineCollection`'s `updatedAt` injection runs for every regular collection, with the same three guards it has today** (`collections/config.ts:186-187`, confirmed by reading the file): `timestamps: false` (explicit opt-out), `"updatedAt" in input.fields` (the better-auth adapter's own `updatedAt`, `meta.locked`, populated by its adapter before `defineCollection` ever sees it), and `meta.protected === true` (an entire auth-owned table like `jwks`, where no `create`/`update` ever runs). This spec changes none of those three guards — only the injected field's own type (`date()` → `commitTs({ on: "save" })`). Media collections are excluded structurally, not by a guard here: `defineMediaCollection()` (`packages/core/src/media/types.ts`) is a separate factory, implemented in `@vexcms/file-storage-convex`, that never calls `defineCollection` — it injects its own fixed system-field set (`alt`, `filename`, `mimeType`, `size`, `storageId`, `deleted`, `convexUrl`, `width`, `height`) and has no `updatedAt`/`commitTs` field at all, today or after this spec. Adding one to media collections is out of scope.

## Out of Scope

- better-auth's own locked `updatedAt` column (unaffected — the `meta.locked`/`"updatedAt" in input.fields` carve-out in `collections/config.ts` is untouched by this spec; better-auth never adopts `commitTs()`).
- Moving the field-type module to a separate Convex-db package.
- Exposing nanosecond precision anywhere outside the field's own resolved `bigint` inside a Convex function — every boundary this spec touches works in ms.
- Migration tooling for existing numeric `updatedAt` data — pre-release, dev data reset is the documented path.
- Reading a `commitTs` field's resolved value inside the same mutation that wrote it (not possible — Convex resolves it only after commit).
- Comparing `commitTs` to `Date.now()`/`_creationTime` for ordering guarantees across rows with wall-clock skew (per Convex's own documented caveat) — this field exists for display and same-row freshness/ordering, not cross-row wall-clock comparison.

## Probe Findings (binding)

From `local://committs-findings.md` (full probe transcript; verdicts below are binding for this spec):

1. **`ctx.db.insert`/`patch`/`replace` all accept `ctx.db.vars.commitTs`**, confirmed empirically against the real Convex runtime (`convex/dist/esm/server/impl/database_impl.js`). `convex-test` 0.0.38 never resolves it — `typeof doc.ts` stays `"object"` (a `CommitTsPlaceholder` instance) even after the simulated mutation "commits", and two separate inserts in one `t.run()` share the exact same placeholder object reference (a module-level singleton, not per-commit). Tests against this field type assert `instanceof CommitTsPlaceholder` or skip/defer to the live smoke step — never a real resolved value.
2. **bigint breaks at exactly two hops**: `fetchQuery`'s RSC→client-component prop boundary (React Flight serialization has no `bigint` support) and any `JSON.stringify`/URL-param encode. Convex's own wire protocol (WebSocket + HTTP, both directions) and TanStack Query's in-memory cache both carry `bigint` natively — no code needed there. This spec converts at the `packages/core` API boundary (`find`/`get`/`search`), once, rather than downstream at each consumer.
3. **Every current `updatedAt` consumer**: `create/server.ts:89`, `update/server.ts:102` (both via `stampUpdatedAt`); `saveDraft.ts` deliberately never stamps it (autosave ≠ real edit); `publish.ts`/`unpublish.ts` never stamp it today either (a real gap this spec closes via the `on` policy); `cloneDocumentForDuplicate.ts:77` explicitly strips it pre-duplicate; better-auth's own `updatedAt` is `meta.locked` and must stay untouched by the new injection (same guard, unchanged). `vex_versions` snapshot stripping needs a new type-aware pass (`removeVexFields`'s `fields` param) since a snapshot is `v.any()` and would otherwise carry a raw placeholder through to history.
4. **Field-type registration surface — ~18 files**, `checkbox` as template: `fields/commitTs/{config,types,validator,validator.test,inputSchema,inputSchema.test,index}.ts`, `fields/constants.ts`, `fields/index.ts`, `fields/types.ts`, `fields/validators/index.ts`, `fields/inputSchemas/index.ts`, `react/fields/commitTs/{Field,Field.test,Cell,Cell.test,columnDef,columnDef.test,testFixture,index}.tsx/.ts`, `react/fields/index.tsx`, `react/collections/listView/ListFilterBuilder.tsx`. Schema/type generation (`generateVexSchema.ts`/`generateVexTypes.ts`) needs **no edit** — both are generic over `ADMIN_FIELDS`/`adminFieldToValidator`, confirmed by grep (zero `case ADMIN_FIELDS.` / `"checkbox"` hits in either file).
5. **ns→ms conversion**: `Number(ns / 1_000_000n)`, confirmed lossless for any realistic wall-clock epoch (`ns/1e6` fits well within `Number.MAX_SAFE_INTEGER` for decades), matching the existing `updatedAt`/`_creationTime` plain-ms-number convention every display/formatter already assumes.

## Implementation

### Step 1 — `commitTs()` core field-type module + registries [agent]

#### packages/core/src/fields/commitTs/types.ts

New file, modeled on `fields/checkbox/types.ts` and `fields/date/types.ts` (admin extension pattern — `text`/`number`/`email`/`url`/`select`/`blocks`/`group`/`relationship` all extend `FieldAdminConfigInput` with their own extra option the same way).

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";
import type { FieldAdminConfigInput } from "../baseTypes";
import type { VexResourceSlug } from "../../types/generated";

/** Which write events stamp a `commitTs()` field. @see {@link CommitTsFieldInput.on} */
export type CommitTsFieldOn = "publish" | "save" | "all";

/** How a `commitTs()` field's value is displayed in the admin form/table. */
export type CommitTsFieldAdminFormat = "relative" | "datetime" | "date";

/**
 * Admin UI configuration specific to `commitTs()` fields.
 *
 * @see {@link FieldAdminConfigInput} for the shared admin properties every field type gets
 */
export interface CommitTsFieldAdminInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> extends FieldAdminConfigInput<TCollectionSlug> {
  /**
   * How the value is displayed.
   *
   * - `"relative"` — "3 minutes ago", with the exact `"datetime"`-formatted value in a tooltip.
   * - `"datetime"` — the date field's own formatter (`formatDateFieldValue`), with the relative
   *   time in a tooltip. **Default.**
   * - `"date"` — date-only, with the relative time in a tooltip.
   */
  format?: CommitTsFieldAdminFormat;
}

/**
 * Configuration input for a `commitTs()` field.
 *
 * `commitTs` fields store Convex's own commit-serialization clock value
 * (`ctx.db.vars.commitTs`, a nanosecond `Int64` resolved server-side at
 * commit) — never a client-supplied or app-computed timestamp. The field is
 * always read-only in the admin form and never appears in create/update
 * input validation; the ONLY way its value changes is by being written with
 * the `on`-policy's matching event, which `stampCommitTsFields`
 * (`db/documents.ts`) does automatically.
 *
 * **Defaults applied by `commitTs()`:**
 * ```ts
 * {
 *   type:   "commitTs",
 *   label:  "",      // inferred from the field key by defineCollection
 *   on:     "save",  // stamped on create/update/publish/unpublish, never on an autosave draft
 *   admin: {
 *     hidden:        false,
 *     readOnly:      true,    // always — never user-editable, regardless of input
 *     position:      "main",
 *     width:         "100%",
 *     cellAlignment: "left",
 *     enableSorting: true,    // always has an auto-index (Step 2); sortable by default
 *     format:        "datetime",
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * import { commitTs, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Stamped on create/update/publish/unpublish — not autosave drafts
 *     updatedAt: commitTs(),
 *
 *     // Stamped only when a version actually goes live
 *     publishedCommitTs: commitTs({ on: "publish", label: "Published At" }),
 *
 *     // Stamped on every write, including autosave drafts
 *     lastTouchedAt: commitTs({ on: "all", admin: { format: "relative" } }),
 *   }
 * })
 * ```
 *
 * @see {@link CommitTsField} for the resolved type after defaults are applied
 * @see {@link commitTs} for the config function that applies defaults
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `index`)
 */
export interface CommitTsFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
> extends Omit<BaseFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>, "required" | "defaultValue" | "admin"> {
  /** Which write events stamp this field. Default: `"save"`. @see {@link CommitTsFieldOn} */
  on?: CommitTsFieldOn;
  admin?: CommitTsFieldAdminInput<TCollectionSlug>;
}

/**
 * Resolved configuration for a `commitTs()` field, after all defaults are applied.
 *
 * @see {@link CommitTsFieldInput} for the user-facing input type
 * @see {@link commitTs} for the config function that produces this type
 */
export interface CommitTsField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends Omit<BaseField<TCollectionSlug, TFieldMeta>, "required" | "defaultValue" | "admin"> {
  readonly type: typeof ADMIN_FIELDS.commitTs.type;
  label: string;
  /** Always `false` — a `commitTs` field is never required input; it is never input at all. */
  required: false;
  /** Always `undefined` — there is no admin-form pre-fill for a database-stamped value. */
  defaultValue: undefined;
  on: CommitTsFieldOn;
  admin: CommitTsFieldAdminInput<TCollectionSlug> & { format: CommitTsFieldAdminFormat };
}
```

#### packages/core/src/fields/commitTs/config.ts

New file, modeled on `fields/checkbox/config.ts`.

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types/generated";
import type { CommitTsFieldInput, CommitTsField } from "./types";

/**
 * Creates a `commitTs()` field with all defaults applied.
 *
 * `commitTs` fields store Convex's own commit-serialization clock value
 * (`ctx.db.vars.commitTs`) — a database-stamped Unix-nanosecond timestamp,
 * never a client-supplied value. Always read-only; stamped automatically by
 * `stampCommitTsFields` on the write events named by `on`.
 *
 * Accepts {@link CommitTsFieldInput} (all optional) and returns {@link CommitTsField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `on` — `"save"`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — always `true`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"100%"`
 * - `admin.cellAlignment` — `"left"`
 * - `admin.enableSorting` — `true` (always has an auto-index, per Step 2)
 * - `admin.format` — `"datetime"`
 *
 * @param options - `commitTs` field configuration. All properties are optional.
 * @returns Resolved `commitTs` field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { commitTs, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     updatedAt: commitTs(),
 *     publishedCommitTs: commitTs({ on: "publish" }),
 *   }
 * })
 * ```
 *
 * @see {@link CommitTsFieldInput} for the full input type
 * @see {@link CommitTsField} for the resolved output type
 */
export function commitTs<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: CommitTsFieldInput<TCollectionSlug, TFieldKey, TFieldMeta>,
): CommitTsField<TCollectionSlug, TFieldMeta> {
  return {
    type: ADMIN_FIELDS.commitTs.type,
    interfaceType: ADMIN_FIELDS.commitTs.interfaceType,

    label: "",
    required: false,
    defaultValue: undefined,
    on: options?.on ?? "save",
    ...options,

    admin: {
      hidden: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: true,
      enableHiding: false,
      format: "datetime",
      // Optional admin properties (no defaults)
      ...options?.admin,
      // Always read-only, regardless of what the caller passed — the whole
      // point of this field type is that app code never writes its value.
      readOnly: true,
      components: resolveFieldComponents({ components: options?.admin?.components }),
    },
    meta: {
      ...options?.meta,
    } as TFieldMeta,
  } as CommitTsField<TCollectionSlug, TFieldMeta>;
}
```

#### packages/core/src/fields/commitTs/validator.ts

New file. `v.commitTs()` is always the validator string — the field is always optional at the schema level (an unstamped document, pre-first-write-of-this-field, has no value), unlike `checkbox`'s `required`-driven branch.

```ts
import { ADMIN_FIELDS } from "../constants";
import type { CommitTsField } from "./types";

/**
 * Converts a `commitTs()` field definition to a Convex schema validator.
 *
 * Always `"v.optional(v.commitTs())"` — a `commitTs` field is never
 * `required` (there is no admin-form input to require), and a document
 * written before the field existed, or before its `on` event has ever
 * fired, legitimately has no value yet.
 *
 * @param props - Input props.
 * @param props.field - The `commitTs` field definition (ignored beyond its
 *   type — kept for the same per-type dispatch signature every other
 *   `*FieldToValidator` function has).
 * @returns `"v.optional(v.commitTs())"`.
 *
 * @example
 * ```ts
 * const field = commitTs()
 * commitTsFieldToValidator({ field })  // "v.optional(v.commitTs())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function commitTsFieldToValidator(props: { field: CommitTsField }): string {
  void props.field;
  return `v.optional(${ADMIN_FIELDS.commitTs.validator})`;
}
```

#### packages/core/src/fields/commitTs/validator.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { commitTs } from "./config";
import { commitTsFieldToValidator } from "./validator";

describe("commitTsFieldToValidator", () => {
  it("is always optional, regardless of on", () => {
    expect(commitTsFieldToValidator({ field: commitTs() })).toBe("v.optional(v.commitTs())");
    expect(commitTsFieldToValidator({ field: commitTs({ on: "publish" }) })).toBe(
      "v.optional(v.commitTs())",
    );
    expect(commitTsFieldToValidator({ field: commitTs({ on: "all" }) })).toBe(
      "v.optional(v.commitTs())",
    );
  });
});
```

#### packages/core/src/fields/commitTs/inputSchema.ts

New file. Never reached in practice (`getFieldsInputSchema` skips `commitTs` fields entirely — Step 1's `fields/utils.ts` edit below), but every field type implements this function for the generic `adminFieldToInputSchema` dispatch table's exhaustiveness check.

```ts
import * as z from "zod";
import type { ZodType } from "zod";
import { CommitTsField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for a `commitTs()` field. Never reached by a real
 * create/update form submission — `getFieldsInputSchema` (`fields/utils.ts`)
 * skips every `commitTs`-typed field before dispatching here, the same way
 * it already skips `admin.hidden` fields. Kept only so `adminFieldToInputSchema`'s
 * switch stays exhaustive over every `AdminDataField` member.
 *
 * @param props - Input props.
 * @param props.field - The resolved `commitTs` field definition.
 * @returns `z.unknown().optional()` — accepts and ignores anything.
 */
export function commitTsFieldToInputSchema(props: { field: CommitTsField }): ZodType {
  return applyBaseInputSchemaMeta({ field: props.field, inputSchema: z.unknown().optional() });
}
```

#### packages/core/src/fields/commitTs/inputSchema.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { commitTs } from "./config";
import { commitTsFieldToInputSchema } from "./inputSchema";

describe("commitTsFieldToInputSchema", () => {
  it("accepts anything, including undefined", () => {
    const schema = commitTsFieldToInputSchema({ field: commitTs() });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(1234567890).success).toBe(true);
    expect(schema.safeParse("ignored").success).toBe(true);
  });
});
```

#### packages/core/src/fields/commitTs/index.ts

New file.

```ts
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
```

#### packages/core/src/fields/constants.ts

1 edit — new `commitTs` entry in `ADMIN_FIELDS`, beside `date` (line 68), plus a `CommitTsFieldType` export beside `DateFieldType` (line 200-201).

```ts
  commitTs: {
    type: "commitTs",
    interfaceType: "number",
    validator: "v.commitTs()",
    defaultValue: undefined,
    kind: "data",
    inputMasks: false,
  },
```

```ts
/** Literal type `"commitTs"` — the discriminant value on {@link CommitTsField}. */
export type CommitTsFieldType = typeof ADMIN_FIELDS.commitTs.type;
```

#### packages/core/src/fields/index.ts

1 edit — add beside `./date` (after line 22):

```ts
export * from "./commitTs";
```

#### packages/core/src/fields/types.ts

2 edits. **1 — barrel** (beside line 34's `checkbox/types`):

```ts
export * from "./commitTs/types";
```

**2 — `AdminField` union** (beside `DateField` in the union, after line 88):

```ts
  | CommitTsField<VexResourceSlug, TFieldMeta>
```

#### packages/core/src/fields/validators/index.ts

2 edits. **1 — import** (beside line 8's `dateFieldToValidator` import):

```ts
import { commitTsFieldToValidator } from "../commitTs";
```

**2 — switch case** (beside the `ADMIN_FIELDS.date.type` case, after line 57):

```ts
    case ADMIN_FIELDS.commitTs.type:
      return commitTsFieldToValidator({ field: props.field });
```

#### packages/core/src/fields/inputSchemas/index.ts

2 edits. **1 — import** (beside line 9's `dateFieldToInputSchema` import):

```ts
import { commitTsFieldToInputSchema } from "../commitTs";
```

**2 — switch case** (inside the body's switch, beside the `date` case — same pattern as `validators/index.ts` above, anchored the same way against `ADMIN_FIELDS.date.type`).

#### packages/core/src/fields/utils.ts

1 edit — `getFieldsInputSchema`'s loop (line 223-232) gains a second skip condition, beside the existing `admin.hidden` skip:

```ts
  for (const [fieldKey, fieldDef] of Object.entries(getDataFields({ fields: props.fields }))) {
    if (fieldDef.admin.hidden) continue;
    if (fieldDef.type === ADMIN_FIELDS.commitTs.type) continue;
    res[fieldKey] = adminFieldToInputSchema({
```

Requires importing `ADMIN_FIELDS` into this file if not already imported (check the file's existing import list — add `ADMIN_FIELDS` to whatever `"./constants"` import already exists, or add a new one if `fields/utils.ts` doesn't import from `./constants` today).

---

### Step 2 — Auto-index for `commitTs` fields [agent]

#### packages/core/src/collections/resolveCollectionIndexes.ts

2 edits to `resolveCollectionIndexes`. **1 — extend `ResolvedCollectionIndex.source`** (line 12):

```ts
  /** Which kind of declaration won. */
  source: "field" | "collection" | "relationship" | "commitTs";
```

**2 — new auto-index branch**, mirroring the relationship branch exactly (section "2." at line 95-106 guards against a name clash; section "3." at line 124-129 emits). Add a `commitTs` clash guard beside the relationship one (after line 106):

```ts
  // 2b. A `commitTs` field without its own `index` gets `by_<fieldKey>` too —
  //     same auto-index contract as relationship fields (Decision 3).
  for (const [fieldKey, field] of Object.entries(dataFields)) {
    if (field.type !== ADMIN_FIELDS.commitTs.type || field.index !== undefined) continue;
    const explicit = fieldLevel.get(`by_${fieldKey}`);
    if (explicit !== undefined) {
      throw new Error(
        `${at}: field "${explicit.fields[0]}" declares index "by_${fieldKey}", the automatic index name of commitTs field "${fieldKey}". ` +
          `Rename the index, or give "${fieldKey}" its own index.`,
      );
    }
  }
```

And extend the emission loop (line 124-129)'s `else if` chain:

```ts
    } else if (field.type === ADMIN_FIELDS.relationship.type && !collectionLevelNames.has(`by_${fieldKey}`)) {
      resolved.push({ name: `by_${fieldKey}`, fields: [fieldKey], source: "relationship" });
    } else if (field.type === ADMIN_FIELDS.commitTs.type && !collectionLevelNames.has(`by_${fieldKey}`)) {
      resolved.push({ name: `by_${fieldKey}`, fields: [fieldKey], source: "commitTs" });
    }
```

#### packages/core/src/collections/resolveCollectionIndexes.test.ts

Append, mirroring the file's existing relationship-auto-index describe block:

```ts
describe("resolveCollectionIndexes — commitTs auto-index", () => {
  it("auto-indexes a commitTs field with no explicit index", () => {
    const resolved = resolveCollectionIndexes({
      collection: { slug: "posts", fields: { updatedAt: commitTs() } },
    });
    expect(resolved).toContainEqual({ name: "by_updatedAt", fields: ["updatedAt"], source: "commitTs" });
  });

  it("an explicit field-level index on a commitTs field wins over the auto-default", () => {
    const resolved = resolveCollectionIndexes({
      collection: {
        slug: "posts",
        fields: { updatedAt: commitTs({ index: "by_updated_desc" }) },
      },
    });
    expect(resolved).toContainEqual({ name: "by_updated_desc", fields: ["updatedAt"], source: "field" });
    expect(resolved.find((i) => i.name === "by_updatedAt")).toBeUndefined();
  });

  it("throws when another field's explicit index takes the auto-default name", () => {
    expect(() =>
      resolveCollectionIndexes({
        collection: {
          slug: "posts",
          fields: {
            updatedAt: commitTs(),
            slug: text({ index: "by_updatedAt" }),
          },
        },
      }),
    ).toThrow(/automatic index name of commitTs field "updatedAt"/);
  });
});
```

---

### Step 3 — Write-path stamping: `stampCommitTsFields` replaces `stampUpdatedAt` [agent]

#### packages/core/src/hooks/types.ts

1 edit — `BaseHookProps` (confirmed at `packages/core/src/hooks/types.ts:18-20`; `collections/hooks.ts` and `globals/hooks.ts` both import it via `import type { BaseHookProps } from "../hooks"`, resolving to this file's barrel `packages/core/src/hooks/index.ts`) gains a `commitTs` placeholder value.

```ts
export interface BaseHookProps<TDataModel extends GenericDataModel = GenericDataModel> {
  ctx: GenericMutationCtx<TDataModel>;
  /**
   * This write's unresolved `ctx.db.vars.commitTs` placeholder — the same
   * value `stampCommitTsFields` writes into a matching `commitTs()` field.
   * A hook MAY use it to stamp a RELATED document in the same mutation
   * (e.g. a parent row's own `commitTs` field). It is NOT the resolved
   * value — Convex resolves a `commitTs` placeholder only after the
   * mutation commits, so reading it as a number/bigint here throws or
   * returns the placeholder object itself, never a usable timestamp.
   */
  commitTs: unknown;
}
```

#### packages/core/src/collections/hooks.ts

No production edit — confirmed by reading the file. `BeforeChangeProps`, `BeforeDeleteProps`, `AfterChangeProps`, and `AfterDeleteProps` (`packages/core/src/collections/hooks.ts:10-67`) all `extends BaseHookProps<TDataModel>` with no inline `ctx` redeclaration, so `commitTs` is already on every one of them once the `hooks/types.ts` edit below lands. `packages/core/src/globals/hooks.ts`'s `GlobalBeforeChangeProps`/`GlobalAfterChangeProps` follow the identical pattern (confirmed by reading that file too) — also no edit needed there.

#### packages/core/src/db/prepareEdit.ts

1 edit — the `beforeChange` dispatch (lines 128-143): strip every `commitTs`-typed field from `doc`, and pass `commitTs`.

```ts
  const operation = props.action === CRUD_ACTIONS.create ? "create" : "update";
  const docForHooks = Object.fromEntries(
    Object.entries(mergedFields).filter(([key]) => {
      const fieldDef = props.target.config.fields[key];
      return fieldDef === undefined || fieldDef.type !== ADMIN_FIELDS.commitTs.type;
    }),
  ) as TDocument;
  let transformedFields = mergedFields;
  if (props.target.kind === "collection" && props.target.config.hooks.beforeChange) {
    transformedFields = (await props.target.config.hooks.beforeChange({
      operation,
      doc: docForHooks as never,
      ctx: props.ctx,
      commitTs: props.ctx.db.vars.commitTs,
      collection: props.target.config,
    })) as TDocument;
  } else if (props.target.kind === "global" && props.target.config.hooks.beforeChange) {
    transformedFields = (await props.target.config.hooks.beforeChange({
      operation,
      doc: docForHooks as never,
      ctx: props.ctx,
      commitTs: props.ctx.db.vars.commitTs,
      global: props.target.config,
    })) as TDocument;
  }
```

Note: a hook that returns a modified `doc` (the function's own return type, per `beforeChangeHook`'s signature) returning it WITHOUT the stripped `commitTs` keys is fine — `transformedFields` only feeds `prepareEdit`'s own `changedKeys` diff and the caller's `patch`/snapshot; `stampCommitTsFields` (this step) sets the real value afterward, in `create`/`update`/`publish`/`unpublish`/`saveDraft`, independent of whatever the hook returned for that key. `ADMIN_FIELDS` is not yet imported in `prepareEdit.ts` today (confirmed — its only `../fields` import, line 8, is `{ assignArrayItemIds, getFieldsInputSchema, validateFields }`); add `ADMIN_FIELDS` to that same import list rather than a second `../fields` import line.

#### packages/core/src/db/documents.ts

2 edits. **1 — remove `stampUpdatedAt`** (lines 14-53), replaced with:

```ts
import { ADMIN_FIELDS, type AdminField } from "../fields";

/** The semantic write events a `commitTs()` field's `on` option can be stamped by. */
export type CommitTsWriteEvent = "create" | "update" | "publish" | "unpublish" | "draftSave";

/** Which {@link CommitTsWriteEvent}s each `CommitTsFieldOn` policy stamps on. */
const COMMIT_TS_EVENTS_BY_ON: Record<string, ReadonlySet<CommitTsWriteEvent>> = {
  save: new Set(["create", "update", "publish", "unpublish"]),
  publish: new Set(["publish"]),
  all: new Set(["create", "update", "publish", "unpublish", "draftSave"]),
};

/**
 * Stamps every `commitTs()` field on `fields` whose `on` policy matches one
 * of `events` with `ctx.db.vars.commitTs` — the unresolved placeholder
 * Convex resolves to the real commit nanosecond timestamp once this
 * mutation commits (per the Convex commit-timestamp docs).
 *
 * Replaces `stampUpdatedAt`: unlike `Date.now()`, a `commitTs` value is
 * never computed by app code — the app must explicitly write the
 * placeholder into the field for Convex to resolve it at commit, so every
 * write path that wants a `commitTs` field to advance must call this.
 *
 * @param props - Input props.
 * @param props.ctx - The active mutation context — `ctx.db.vars.commitTs` is
 *   mutation-ctx-only (not present on a query ctx).
 * @param props.fields - The resource's resolved field map (`collection.fields`
 *   or `target.config.fields` — works for both collections and globals).
 * @param props.data - The write payload to stamp fields onto.
 * @param props.events - Every semantic event this one write satisfies (e.g.
 *   `["create", "publish"]` for creating a non-versioned document, since a
 *   non-versioned create has no separate publish step and is live immediately).
 * @returns `props.data`, with every matching `commitTs` field set to the
 *   placeholder; fields whose `on` policy doesn't match any of `events` are
 *   left untouched (absent on a true first write, or carrying their
 *   previously-resolved value on a write that doesn't advance them).
 */
export function stampCommitTsFields<TData extends Record<string, unknown>>(props: {
  ctx: { db: { vars: { commitTs: unknown } } };
  fields: Record<string, AdminField>;
  data: TData;
  events: readonly CommitTsWriteEvent[];
}): TData {
  let data = props.data;
  for (const [fieldKey, field] of Object.entries(props.fields)) {
    if (field.type !== ADMIN_FIELDS.commitTs.type) continue;
    const allowedEvents = COMMIT_TS_EVENTS_BY_ON[field.on] ?? COMMIT_TS_EVENTS_BY_ON.save;
    if (props.events.some((event) => allowedEvents.has(event))) {
      data = { ...data, [fieldKey]: props.ctx.db.vars.commitTs };
    }
  }
  return data;
}
```

**2 — `readableDocuments` ms conversion** (Step 4 — see that step; left separate so this step's Verify stays scoped to stamping).

#### packages/core/src/db/documents.test.ts

Append (or create if `stampUpdatedAt` had no colocated test file — check first; if one exists, replace its `stampUpdatedAt` describe block with this one):

```ts
import { CommitTsPlaceholder } from "convex/values";
import { commitTs } from "../fields";
import { stampCommitTsFields } from "./documents";

describe("stampCommitTsFields", () => {
  const fakeCtx = { db: { vars: { commitTs: new CommitTsPlaceholder() } } };

  it("stamps a 'save' field on create/update/publish/unpublish, not draftSave", () => {
    const fields = { updatedAt: commitTs({ on: "save" }) };
    for (const event of ["create", "update", "publish", "unpublish"] as const) {
      const result = stampCommitTsFields({ ctx: fakeCtx, fields, data: {}, events: [event] });
      expect(result.updatedAt).toBeInstanceOf(CommitTsPlaceholder);
    }
    const draftResult = stampCommitTsFields({ ctx: fakeCtx, fields, data: {}, events: ["draftSave"] });
    expect(draftResult.updatedAt).toBeUndefined();
  });

  it("stamps a 'publish' field only on publish", () => {
    const fields = { publishedCommitTs: commitTs({ on: "publish" }) };
    const published = stampCommitTsFields({ ctx: fakeCtx, fields, data: {}, events: ["publish"] });
    expect(published.publishedCommitTs).toBeInstanceOf(CommitTsPlaceholder);
    const created = stampCommitTsFields({ ctx: fakeCtx, fields, data: {}, events: ["create"] });
    expect(created.publishedCommitTs).toBeUndefined();
  });

  it("stamps an 'all' field on every event including draftSave", () => {
    const fields = { touchedAt: commitTs({ on: "all" }) };
    const result = stampCommitTsFields({ ctx: fakeCtx, fields, data: {}, events: ["draftSave"] });
    expect(result.touchedAt).toBeInstanceOf(CommitTsPlaceholder);
  });

  it("ignores non-commitTs fields entirely", () => {
    const fields = { title: { type: "text" } as never };
    const result = stampCommitTsFields({ ctx: fakeCtx, fields, data: { title: "hi" }, events: ["create"] });
    expect(result).toEqual({ title: "hi" });
  });
});
```

#### packages/core/src/collections/config.ts

1 edit — the injected `updatedAt` field (lines 185-203) switches from `date()` to `commitTs()`.

```ts
  const fieldsWithTimestamp = skipInjection
    ? input.fields
    : {
        ...input.fields,
        updatedAt: commitTs({
          label: "Updated At",
          on: "save",
          admin: { position: "sidebar" },
        }) as AdminField<TFieldMeta>,
      };
```

Requires importing `commitTs` from `../fields` (alongside the existing `date` import — remove `date` from this file's import list if it's no longer used elsewhere in the file; check first).

#### packages/core/src/collections/api/create/server.ts

1 edit — replace the `stampUpdatedAt` import/call (lines 14, 89) with `stampCommitTsFields`. The `events` array depends on whether this create ends up published immediately.

```ts
import { stampCommitTsFields } from "../../../db/documents";
```

```ts
  const willPublishImmediately =
    !collection.versions.drafts || (args.status ?? collection.versions.defaultStatus) === VERSION_STATUSES.published.key;
  const data = stampCommitTsFields({
    ctx: args.ctx,
    fields: collection.fields,
    data: patch,
    events: willPublishImmediately ? ["create", "publish"] : ["create"],
  });
```

Also update `removeVexFields({ doc: data })` (line 116) to `removeVexFields({ doc: data, fields: collection.fields })` (Step 3's `removeVexFields` edit below).

#### packages/core/src/collections/api/update/server.ts

1 edit — replace the `stampUpdatedAt` import/call (lines 14, 102) with `stampCommitTsFields`:

```ts
import { stampCommitTsFields } from "../../../db/documents";
```

```ts
  const data = stampCommitTsFields({
    ctx: args.ctx,
    fields: collection.fields,
    data: patch,
    events: ["update"],
  });
```

Also update `removeVexFields({ doc: transformedFields })` (line 111) to pass `fields: collection.fields`.

#### packages/core/src/versions/publish.ts

2 edits. **1 — stamp before the final patch** (before line 169's `await props.ctx.db.patch(rowId, ...)`):

```ts
  const stampedFields = stampCommitTsFields({
    ctx: props.ctx,
    fields: props.target.config.fields,
    data: transformedFields,
    events: ["publish"],
  });
```

Then use `stampedFields` in place of `transformedFields` in the `buildDraftPatch`/`createVersion` snapshot calls from line 169 onward (both the live-row patch and the `removeVexFields({ doc: transformedFields, ... })` snapshot calls at lines 159 and 195 — the snapshot ones pass `fields: props.target.config.fields` to `removeVexFields` too, per Step 3's `removeVexFields` edit, which strips `commitTs` fields from the snapshot regardless).

**2 — import** `stampCommitTsFields` from `../db/documents`.

#### packages/core/src/versions/unpublish.ts

Unpublish demotes/promotes existing rows by copying a PREVIOUS snapshot (`previous.snapshot`) onto the live row — it never computes new field content, so a `"save"`-policy `commitTs` field (whose allowed events include `"unpublish"`) still needs an explicit stamp call since `buildDraftReplace`'s payload is the old snapshot, which (per Step 3's `removeVexFields` snapshot stripping) never carries a `commitTs` value at all. Add the stamp to both branches (lines 116-124 and 125-133):

```ts
  const stamped = stampCommitTsFields({
    ctx,
    fields: target.config.fields,
    data: {},
    events: ["unpublish"],
  });
```

Then spread `...stamped` into both `ctx.db.patch(...)` payload objects (lines 120-124 and 128-132), alongside the existing `vex_publishedAt`/`vex_status` keys. Import `stampCommitTsFields` from `../db/documents`.

#### packages/core/src/versions/saveDraft.ts

1 edit — stamp `"all"`-policy fields before the draft patch (before line 122's `await props.ctx.db.patch(draftRow._id, ...)`):

```ts
  const stampedPatch = stampCommitTsFields({
    ctx: props.ctx,
    fields: props.target.config.fields,
    data: patch,
    events: ["draftSave"],
  });
```

Use `stampedPatch` in place of `patch` in the `buildDraftPatch` call on line 126; `buildDraftReplace`'s branch (line 125, the `restoredFrom` path) restores a prior snapshot verbatim and does not call `stampCommitTsFields` — a restore is not a new edit. Import `stampCommitTsFields` from `../db/documents`. Update the function's own doc comment (lines 36-37, "Does NOT stamp `updatedAt`") to instead say: "Stamps only `on: "all"` `commitTs` fields — `on: "save"`/`on: "publish"` fields are untouched; an autosave tick is not a real edit of the live document."

#### packages/core/src/versions/removeVexFields.ts

1 edit — new optional `fields` param, strips `commitTs`-typed fields by type.

```ts
import { ADMIN_FIELDS, type AdminField } from "../fields";
import { CONVEX_SYSTEM_FIELDS } from "../collections/constants";
import { VERSION_SYSTEM_FIELDS } from "./constants";

/**
 * Strips every key a `vex_versions` snapshot must never carry... [existing
 * doc comment, plus:] When `fields` is given, also strips every
 * `commitTs`-typed field by TYPE (not by a fixed key set — a collection may
 * declare any number of `commitTs` fields under any name). A raw unresolved
 * placeholder embedded in a snapshot's `v.any()` value would, per Convex's
 * own docs, resolve to the SNAPSHOT ROW's own insert commit — meaningless,
 * and different every time the snapshot is rewritten — so it must never be
 * written there at all.
 */
export function removeVexFields(props: {
  doc: Record<string, unknown>;
  fields?: Record<string, AdminField>;
}): Record<string, unknown> {
  const stripKeys = new Set<string>([
    ...Object.values(CONVEX_SYSTEM_FIELDS).map((v) => v.slug),
    ...Object.values(VERSION_SYSTEM_FIELDS).map((v) => v.slug),
    ...(props.fields
      ? Object.entries(props.fields)
          .filter(([, field]) => field.type === ADMIN_FIELDS.commitTs.type)
          .map(([key]) => key)
      : []),
  ]);
  return Object.fromEntries(Object.entries(props.doc).filter(([key]) => !stripKeys.has(key)));
}
```

Update every call site (`create/server.ts`, `update/server.ts`, `publish.ts` ×2, `saveDraft.ts` ×2) to pass `fields: collection.fields` / `fields: props.target.config.fields` / `fields: props.rows` (use whichever field map that call site already has in scope — `collection.fields` in `create`/`update`, `props.target.config.fields` in `publish.ts`/`saveDraft.ts`).

#### packages/core/src/versions/removeVexFields.test.ts

Append:

```ts
describe("removeVexFields — commitTs stripping", () => {
  it("strips a commitTs-typed field by type when fields is given", () => {
    const fields = { updatedAt: commitTs() };
    const result = removeVexFields({
      doc: { title: "Hi", updatedAt: new CommitTsPlaceholder() },
      fields,
    });
    expect(result).toEqual({ title: "Hi" });
  });

  it("does not strip commitTs fields when fields is omitted (back-compat)", () => {
    const result = removeVexFields({ doc: { title: "Hi", updatedAt: 123 } });
    expect(result).toEqual({ title: "Hi", updatedAt: 123 });
  });
});
```

#### packages/core/src/documents/cloneDocumentForDuplicate.ts

1 edit — remove the now-redundant explicit strip (line 77) and pass `fields` through to `removeVexFields` (line 76):

```ts
  const dataFields = getDataFields({ fields: props.fields });
  const stripped = removeVexFields({ doc: props.document, fields: props.fields });
```

(Line 77's `delete stripped[COLLECTION_SYSTEM_FIELDS.updatedAt.slug];` is removed — `updatedAt` is now `commitTs`-typed and generically stripped by the call above. The `COLLECTION_SYSTEM_FIELDS` import may become unused; remove it if nothing else in the file references it.)

---

### Step 4 — Wire conversion: ms at every boundary, ns only inside Convex [agent]

#### packages/core/src/db/documents.ts

1 edit — `readableDocuments` (lines 127-154) gains ms conversion.

```ts
export function readableDocuments<TDoc extends GenericDocument>(props: {
  docs: readonly TDoc[];
  access: VexAccessConfig | undefined;
  auth: VexApiAuth | undefined;
  resource: string;
  action: string;
  whereFields: readonly string[];
  fields?: Record<string, AdminField>;
}): TDoc[] {
  const user = props.auth?.user ?? null;
  const organization = props.auth?.organization;
  const commitTsKeys = props.fields
    ? Object.entries(props.fields)
        .filter(([, field]) => field.type === ADMIN_FIELDS.commitTs.type)
        .map(([key]) => key)
    : [];
  const readable: TDoc[] = [];
  for (const doc of props.docs) {
    if (!hasPermission({ access: props.access, resource: props.resource, action: props.action, data: doc, user, organization })) {
      continue;
    }
    const fieldPermissions = resolveFieldPermissions({
      access: props.access,
      user,
      organization,
      resource: props.resource,
      action: props.action,
      data: doc,
    });
    if (props.whereFields.some((field) => !isFieldAllowed(fieldPermissions, field))) continue;
    const stripped = stripDeniedFields(doc, fieldPermissions);
    readable.push(commitTsKeys.length === 0 ? stripped : convertCommitTsFieldsToMs({ doc: stripped, keys: commitTsKeys }));
  }
  return readable;
}

/**
 * Converts every `commitTs`-typed field named in `keys` from Convex's
 * resolved nanosecond `bigint` to a plain Unix-ms `number`
 * (`Number(ns / 1_000_000n)` — lossless for any realistic wall-clock epoch,
 * per probe §5). Fields that are `undefined` (never stamped yet) or not a
 * `bigint` (should not happen past schema validation, but defensive against
 * an un-migrated row) are left untouched.
 */
export function convertCommitTsFieldsToMs<TDoc extends GenericDocument>(props: {
  doc: TDoc;
  keys: readonly string[];
}): TDoc {
  let doc = props.doc;
  for (const key of props.keys) {
    const value = doc[key];
    if (typeof value === "bigint") {
      doc = { ...doc, [key]: Number(value / 1_000_000n) };
    }
  }
  return doc;
}
```

Requires `ADMIN_FIELDS`/`AdminField` imports (likely already present after Step 3's edit to this file).

#### packages/core/src/db/queryArgs.ts

New colocated helper, exported alongside this file's existing `VexWhereNode` type/builders.

```ts
import { ADMIN_FIELDS, type AdminField } from "../fields";
import type { VexWhereNode } from "./queryArgs"; // adjust to this file's own self-reference pattern if VexWhereNode is declared here directly

/**
 * Converts every `commitTs`-typed field's leaf `value` inside a `VexWhereNode`
 * from a ms `number` (what the client sends — Decision 5) to a ns `bigint`
 * (what Convex's index-range builder needs to compare against the stored
 * value). Walks `and`/`or`/`not` recursively; non-`commitTs` leaves and
 * `isEmpty`/`isNotEmpty` leaves (no `value`) pass through unchanged.
 *
 * @param props - Input props.
 * @param props.where - The caller's `where`, or `undefined`.
 * @param props.fields - The collection's resolved field map.
 * @returns A new `VexWhereNode` with every `commitTs` leaf's value
 *   converted, or `props.where` unchanged if there is nothing to convert.
 */
export function convertCommitTsWhereToNs<S extends string = string>(props: {
  where: VexWhereNode<S> | undefined;
  fields: Record<string, AdminField>;
}): VexWhereNode<S> | undefined {
  if (props.where === undefined) return undefined;
  const commitTsFields = new Set(
    Object.entries(props.fields)
      .filter(([, field]) => field.type === ADMIN_FIELDS.commitTs.type)
      .map(([key]) => key),
  );
  function walk(node: VexWhereNode<S>): VexWhereNode<S> {
    if ("and" in node) return { and: node.and.map(walk) };
    if ("or" in node) return { or: node.or.map(walk) };
    if ("not" in node) return { not: walk(node.not) };
    if (commitTsFields.has(node.field as string) && typeof node.value === "number") {
      return { ...node, value: BigInt(node.value) * 1_000_000n };
    }
    return node;
  }
  return walk(props.where);
}
```

Adjust the import of `VexWhereNode` to wherever it is actually declared in this repo (likely this same file — in that case drop the import line and just use the local type directly).

#### packages/core/src/db/queryArgs.test.ts

Append:

```ts
describe("convertCommitTsWhereToNs", () => {
  const fields = { publishedAt: commitTs(), title: text() };

  it("converts a commitTs leaf's ms value to ns bigint", () => {
    const result = convertCommitTsWhereToNs({
      where: { field: "publishedAt", op: "gte", value: 1735689600000 },
      fields,
    });
    expect(result).toEqual({ field: "publishedAt", op: "gte", value: 1735689600000n * 1_000_000n });
  });

  it("leaves a non-commitTs leaf untouched", () => {
    const where = { field: "title", op: "eq", value: "hi" } as const;
    expect(convertCommitTsWhereToNs({ where, fields })).toEqual(where);
  });

  it("recurses through and/or/not", () => {
    const result = convertCommitTsWhereToNs({
      where: { and: [{ field: "publishedAt", op: "gte", value: 1000 }, { field: "title", op: "eq", value: "hi" }] },
      fields,
    });
    expect(result).toEqual({
      and: [{ field: "publishedAt", op: "gte", value: 1000n * 1_000_000n }, { field: "title", op: "eq", value: "hi" }],
    });
  });

  it("passes isEmpty/isNotEmpty leaves through (no value to convert)", () => {
    const where = { field: "publishedAt", op: "isEmpty" } as const;
    expect(convertCommitTsWhereToNs({ where: where as never, fields })).toEqual(where);
  });
});
```

#### packages/core/src/collections/api/find/server.ts

2 edits. **1 — convert `where` before it reaches `buildQuery`/`resolveQueryIndex`** (immediately after `collection` is resolved):

```ts
  const where = convertCommitTsWhereToNs({ where: args.where, fields: collection.fields });
```

Then use `where` (instead of `args.where`) everywhere downstream that currently reads `args.where`. **2 — pass `fields` to `readableDocuments`** (line 395):

```ts
  const readable = (fetched: readonly GenericDocument[]) =>
    readableDocuments({ docs: fetched, access, auth: args.auth, resource, action, whereFields, fields: collection.fields });
```

Import `convertCommitTsWhereToNs` from `../../../db/queryArgs`.

#### packages/core/src/collections/api/search/server.ts

Same two edits, same anchors (`where` conversion near the top of `search()`, `fields: collection.fields` added to the `readableDocuments` call at line 343).

#### packages/core/src/collections/api/get/server.ts

1 edit — `get()`'s own access-check shape is direct `hasPermission` + `stripDeniedFields` (not `readableDocuments` — confirmed by reading the file, lines 101-122), so this calls the exported `convertCommitTsFieldsToMs` directly rather than routing through `readableDocuments`. Converts right after the existing `stripDeniedFields` call (line 111-121), before the depth-populate branch (line 139).

```ts
import { convertCommitTsFieldsToMs } from "../../../db/documents";
import { ADMIN_FIELDS } from "../../../fields";
```

```ts
  if (doc && access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc,
    });
    doc = stripDeniedFields(
      doc,
      resolveFieldPermissions({
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: doc,
      }),
    );
  }

  const collection = args.config?.collections.find((c) => c.slug === args.collection);
  if (doc && collection) {
    const commitTsKeys = Object.entries(collection.fields)
      .filter(([, field]) => field.type === ADMIN_FIELDS.commitTs.type)
      .map(([key]) => key);
    if (commitTsKeys.length > 0) {
      doc = convertCommitTsFieldsToMs({ doc, keys: commitTsKeys });
    }
  }
```

The new block is inserted immediately after the existing `if (doc && access !== undefined) { ... }` block (ending line 122) and before the depth-populate comment block (line 124). `args.config` stays optional on `GetServerArgs` (unchanged — `GenericQueryServerParams.config` is only required alongside `depth`, confirmed at `collections/api/types.ts:164-168`); the registered `vex.get` Convex endpoint (`collectionsApi.ts:186-196`) always passes `config` in practice, so this branch runs for every real call, and degrades to a no-op (bigint left as-is) only for a direct SDK caller that omits `config` entirely — documented as a known limitation in this function's own JSDoc, not silently swallowed.

---

### Step 5 — React field module + list-view integration [agent]

#### packages/react/src/fields/commitTs/testFixture.ts

New file, modeled on `fields/checkbox/testFixture.ts` and `fields/date/testFixture.ts` (read `fields/date/testFixture.ts` at implementation time for the exact `FieldFixture` shape with a `number` value type).

```ts
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
```

#### packages/react/src/fields/commitTs/utils.ts

New file — the display formatter, reusing `formatDateFieldValue` and `date-fns`'s relative formatter.

```ts
import { formatDistanceToNow } from "date-fns";
import { formatDateFieldValue } from "../date/utils";
import type { CommitTsFieldAdminFormat } from "@vexcms/core";

/**
 * Formats a `commitTs` field's ms value for display, per `admin.format`.
 *
 * @param props.value - Unix timestamp in milliseconds (already converted
 *   from Convex's resolved ns `bigint` by `find`/`get`/`search`).
 * @param props.format - The field's resolved `admin.format`.
 * @returns The formatted string.
 */
export function formatCommitTsFieldValue(props: { value: number; format: CommitTsFieldAdminFormat }): string {
  const date = new Date(props.value);
  if (props.format === "relative") return formatDistanceToNow(date, { addSuffix: true });
  if (props.format === "date") return formatDateFieldValue({ value: props.value, time: { hidden: true, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } } });
  return formatDateFieldValue({ value: props.value, time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } } });
}

/** The tooltip's own value — always the full `"datetime"`-formatted string, regardless of `format`. */
export function commitTsTooltipValue(value: number): string {
  return formatDateFieldValue({ value, time: { hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: true } } });
}
```

#### packages/react/src/fields/commitTs/Field.tsx

New file — read-only display, no editable control at all (unlike every other `Field.tsx`, there is no `renderBareControl`/`useFieldControlOverride` dispatch — this field is never an input). Styling mirrors `versions/DocumentTimestamps.tsx` (`space-y-1 rounded-sm border-2 border-border p-3 text-sm` block, `text-muted-foreground` label line, confirmed by reading the file in full). Tooltip markup mirrors `ui/data-table/DataTableSortHeader.tsx`'s own usage exactly — `TooltipProvider`/`Tooltip`/`TooltipTrigger`/`TooltipContent` (confirmed exports, `packages/react/src/ui/tooltip.tsx:66`), `TooltipProvider`'s own prop is `delay` (ms, default `0`), not `delayDuration`; `DataTableSortHeader` passes `delay={600}` — this field uses `delay={1000}` per the design decision's own "~1s" tooltip convention.

```tsx
"use client";

import type { ReactNode } from "react";
import { type CommitTsField as CommitTsFieldDef, type FieldComponentProps } from "@vexcms/core";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";
import { formatCommitTsFieldValue, commitTsTooltipValue } from "./utils";

/**
 * `commitTs` admin field — read-only display only. Never renders an
 * editable control: a `commitTs` field's value is stamped by Convex at
 * commit, never set through the admin form.
 *
 * @param props - {@link FieldComponentProps} narrowed to `CommitTsField`, plus the field's resolved ms value.
 * @param props.value - The field's current ms value, or `undefined` before it has ever been stamped.
 * @returns A read-only label + formatted value, with the full datetime in a tooltip; `null` when `props.value` is `undefined`.
 */
export function CommitTsFieldAdmin(
  props: FieldComponentProps<{}, CommitTsFieldDef> & { value?: number },
): ReactNode {
  const label = props.fieldDef.label || props.name;
  if (props.value === undefined) return null;
  const formatted = formatCommitTsFieldValue({ value: props.value, format: props.fieldDef.admin.format });
  return (
    <div className="space-y-1 rounded-sm border-2 border-border p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <p>
        <TooltipProvider delay={1000}>
          <Tooltip>
            <TooltipTrigger render={<span>{formatted}</span>} />
            <TooltipContent>{commitTsTooltipValue(props.value)}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </p>
    </div>
  );
}
```

#### packages/react/src/fields/commitTs/Field.test.tsx

New file, mirroring `fields/checkbox/Field.test.tsx`'s render-and-assert structure: renders with `value: undefined` → em dash; renders with a value → formatted text present, tooltip content present; three `admin.format` variants produce three different visible strings.

#### packages/react/src/fields/commitTs/Cell.tsx

New file, modeled on `fields/date/Cell.tsx` exactly (same `VexLink`/`adminHref`/`isTitleField` shape), substituting `formatCommitTsFieldValue`.

```tsx
"use client";

import {
  TDocument,
  type CellComponentProps,
  type CommitTsField,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";
import { formatCommitTsFieldValue } from "./utils";

/**
 * `commitTs` field cell component for the data-table list view.
 *
 * @param props - Component props
 * @param props.value - Ms timestamp (already converted from `bigint` by `find`/`search`)
 * @param props.fieldDef - Resolved `CommitTsField` definition
 */
export function CommitTsFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<CommitTsField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const content = (
    <span>{formatCommitTsFieldValue({ value: props.value, format: props.fieldDef.admin.format })}</span>
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

#### packages/react/src/fields/commitTs/Cell.test.tsx

New file, mirroring `fields/date/Cell.test.tsx`'s structure (undefined → em dash; a value → formatted text; title-field → wrapped in `VexLink`).

#### packages/react/src/fields/commitTs/columnDef.tsx

New file, modeled on `fields/checkbox/columnDef.tsx`/`fields/date/columnDef.tsx` (read `fields/date/columnDef.tsx` at implementation time for the exact sorting-enabled shape, since `commitTs` — like `date` — is sortable via its auto-index, unlike `checkbox` which has `enableSorting: true` hardcoded without an index requirement check here).

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import { CollectionConfig, type CommitTsField, type TDocument } from "@vexcms/core";
import { CommitTsFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a `commitTs` field.
 *
 * @param props - Column generation props
 * @param props.fieldDef - Resolved `commitTs` field definition
 * @param props.fieldKey - Field key from `collection.fields`
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`)
 * @param props.collection - Collection configuration for the field's collection.
 * @returns TanStack Table column definition typed to `number` (ms)
 */
export function commitTsFieldToColumnDef<TData extends TDocument = TDocument>(props: {
  fieldDef: CommitTsField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, number> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as number | undefined;
      return (
        <CommitTsFieldCell<TData>
          value={value}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    enableSorting: true,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
```

#### packages/react/src/fields/commitTs/columnDef.test.ts

New file, mirroring `fields/checkbox/columnDef.test.ts`'s structure (column id/header/sorting flags; cell renders through `CommitTsFieldCell`).

#### packages/react/src/fields/commitTs/index.ts

New file.

```ts
export * from "./Field";
export * from "./Cell";
export * from "./columnDef";
```

#### packages/react/src/fields/index.tsx

3 edits. **1 — import** (beside line 8's `dateFieldToColumnDef` import):

```ts
import { commitTsFieldToColumnDef } from "./commitTs";
```

**2 — barrel** (beside line 27's `export * from "./date"`):

```ts
export * from "./commitTs";
```

**3 — `getCollectionColumnDefs` switch case** (inside the function body, lines 66-187 — anchor beside the existing `ADMIN_FIELDS.date.type` case):

```ts
      case ADMIN_FIELDS.commitTs.type:
        return commitTsFieldToColumnDef({ fieldDef: field, fieldKey, collection: props.collection, isTitleField });
```

#### packages/react/src/collections/listView/ListFilterBuilder.tsx

2 edits. **1 — op matrix** (line 93-96):

```ts
export const FILTER_BUILDER_OPS_BY_FIELD_TYPE: Record<string, ListFilterOp[]> = {
  number: ["eq", "neq", "gte", "lte", "isEmpty", "isNotEmpty"],
  date: ["gte", "lte", "isEmpty", "isNotEmpty"],
  commitTs: ["gte", "lte", "isEmpty", "isNotEmpty"],
};
```

**2 — value control dispatch** (`renderFilterValueInput`, lines 673-686): extend the `date` branch's condition rather than duplicating it, since the control is identical:

```ts
  if (props.field.type === "date" || props.field.type === "commitTs") {
```

(No other change inside that branch's body — the `DateTimePicker` + `onChange`/ms-value handling is already field-type-agnostic.)

#### packages/react/src/collections/listView/ListFilterBuilder.test.tsx

Append a `describe("commitTs filter bucket", ...)` mirroring the file's existing `date` bucket tests: `filterBuilderOpsForFieldType({ type: "commitTs" })` returns the 4-op list; the value control renders a `DateTimePicker` for a `commitTs`-typed row.

#### packages/core/src/collections/listUrlParams.ts

1 edit — `filterValueKindForField` (lines 75-86) gains a `commitTs` branch beside `date` (line 84):

```ts
  if (fieldDef.type === ADMIN_FIELDS.date.type || fieldDef.type === ADMIN_FIELDS.commitTs.type) return "date";
```

#### packages/core/src/collections/listUrlParams.test.ts

Append a test asserting a `commitTs` field's filter value round-trips through the `"date"` ISO-string codec identically to a real `date` field's.

---

### Step 6 — Clean cutover: project collections, templates, seeds [agent]

No collection file in `apps/test`, `apps/www`, or the `create-vexcms` templates declares `updatedAt` explicitly — it is always `defineCollection`'s own auto-injection (probe §3, confirmed: "none declare `updatedAt` explicitly"). Step 3's `collections/config.ts` edit alone cuts every project over; this step is documentation and the dev-data reset only.

#### apps/docs/src/content/docs/guides/caching-and-seo.mdx

The `## updatedAt and sitemap lastmod` section (lines 326-340) is rewritten to describe: the field is now `commitTs({ on: "save" })` (same semantics as before — stamped on create/update/publish/unpublish, not autosave); the app-facing value is still a plain Unix-ms `number` (conversion from Convex's `bigint` happens inside `@vexcms/core`'s own `find`/`get`/`search`, never visible to `createVexSitemap.ts` or any other consumer); globals still carry no `updatedAt` (`defineGlobal` still doesn't inject it); better-auth's own locked `updatedAt` is still untouched.

#### .agent/docs/product/v0.1.0-launch-plan.md

Note (near wherever the `updatedAt`/`vex_` convention item already lives, per the list-view-overhaul Step 1 digest) that this spec's cutover requires a dev-data reset for any project with existing `updatedAt` values, pre-release, no migration path.

---

### Step 7 — Core unit tests, API conversion tests, list-view tests [agent]

Covered inline per-file in Steps 1–5 above (`validator.test.ts`, `inputSchema.test.ts`, `resolveCollectionIndexes.test.ts`, `documents.test.ts`, `queryArgs.test.ts`, `removeVexFields.test.ts`, `Field.test.tsx`, `Cell.test.tsx`, `columnDef.test.ts`, `ListFilterBuilder.test.tsx`, `listUrlParams.test.ts`) per the "tests colocated, never pooled at the end" rule. This step's own job is the full-suite run plus closing any gap found:

- [ ] `packages/core/src/collections/api/create/server.test.ts` — append cases: a `commitTs({ on: "publish" })` field is stamped on a non-versioned create, NOT on a versioned draft create; a `commitTs({ on: "save" })` field is stamped on both.
- [ ] `packages/core/src/collections/api/update/server.test.ts` — append: `on: "publish"` field is NOT stamped by `update()`.
- [ ] `packages/core/src/versions/publish.test.ts`, `unpublish.test.ts`, `saveDraft.test.ts` — append the `on`-policy matrix cases for each lifecycle function, asserting `instanceof CommitTsPlaceholder` on the raw written value (never a resolved number — probe §1).

---

### Step 8 — Dev-deployment smoke + docs sweep [agent]

No code changes land that aren't already covered above; this step is the live-backend verification `convex-test` cannot provide (probe §1) plus the list-views guide note, if that guide exists by the time this spec runs (it ships in `2026-10-26-list-view-overhaul` Step 24 — if that step hasn't landed yet, skip this file edit and note it as a follow-up for whichever spec lands last).

## Verification

`pnpm typecheck && pnpm test` (root, every package) must be green. `vex generate` against both `apps/test` and `apps/www` must regenerate `updatedAt: v.optional(v.commitTs())` in each app's `convex/vex.schema.ts` with no error. The dev-deployment smoke step (spec Step 8) is the only check that observes a real resolved `bigint` — confirm it manually: edit a post in `apps/test`'s admin, confirm `updatedAt` advances in the list view; sort the list by `updatedAt`; filter by it using the date+time picker; open the Inspect peek and confirm the formatted value with its relative-time tooltip.
