---
status: draft
spec_id: 2026-10-28-committs-field
touches: []
prompt_version: 1
---

# 2026-10-28-committs-field — Tasks

## Step 1 — `commitTs()` core field-type module + registries [agent]
Why: Every field type is a closed, self-contained module (`checkbox` is the template, probe §4) plus five shared-registry edits. This step lands the type with zero behavior yet — nothing references it — so the build stays green and later steps only wire it in.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test -- fields/commitTs`
- [x] `packages/core/src/fields/commitTs/config.ts` (new) — `commitTs(options)` factory
- [x] `packages/core/src/fields/commitTs/types.ts` (new) — `CommitTsFieldInput`/`CommitTsField`/`CommitTsFieldAdminInput`
- [x] `packages/core/src/fields/commitTs/validator.ts` + `.test.ts` (new) — `commitTsFieldToValidator`
- [x] `packages/core/src/fields/commitTs/inputSchema.ts` + `.test.ts` (new) — `commitTsFieldToInputSchema` (never called for a real form — see `fields/utils.ts` edit below — kept for the generic per-type dispatch contract)
- [x] `packages/core/src/fields/commitTs/index.ts` (new) — barrel
- [x] `packages/core/src/fields/constants.ts` — `ADMIN_FIELDS.commitTs` entry + `CommitTsFieldType` export
- [x] `packages/core/src/fields/index.ts` — `export * from "./commitTs"`
- [x] `packages/core/src/fields/types.ts` — `CommitTsField` into the `AdminField` union + barrel re-export
- [x] `packages/core/src/fields/validators/index.ts` — `adminFieldToValidator` switch case
- [x] `packages/core/src/fields/inputSchemas/index.ts` — `adminFieldToInputSchema` switch case
- [x] `packages/core/src/fields/utils.ts` — `getFieldsInputSchema` skips `commitTs`-typed fields (read-only, excluded from create/update input validation)

## Step 2 — Auto-index for `commitTs` fields [agent]
Why: Decision 3. Every `commitTs` field gets an index automatically (unlike every other type, which needs an explicit `index` option), using the same index-option shape (name/`additionalFields`/`draftStatus`) other fields use when the project does declare one.
Verify: `pnpm --filter @vexcms/core test -- collections/resolveCollectionIndexes`
- [x] `packages/core/src/collections/resolveCollectionIndexes.ts` + `.test.ts` — a `commitTs` field without its own `index` gets `by_<fieldKey>` (mirrors the relationship auto-index branch); an explicit field-level index on `commitTs` is honored like any other field's

## Step 3 — Write-path stamping: `stampCommitTsFields` replaces `stampUpdatedAt` [agent]
Why: Decisions 1, 2, 6, 7. Convex requires the app to explicitly write `ctx.db.vars.commitTs` into the field on a matching write — it is not auto-populated by the schema declaration alone. One helper, dispatched by a semantic write event (`create`/`update`/`publish`/`unpublish`/`draftSave`), replaces the single-field `stampUpdatedAt`. `updatedAt`'s auto-injection switches from `date()` to `commitTs({ on: "save" })`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test -- db/documents collections/config versions`
- [x] `packages/core/src/db/documents.ts` — remove `stampUpdatedAt`; add `stampCommitTsFields({ ctx, fields, data, events })` + `CommitTsWriteEvent` type
- [x] `packages/core/src/collections/config.ts` — injected `updatedAt` field switches `date({ admin: { position: "sidebar", readOnly: true }, time: {...} })` to `commitTs({ label: "Updated At", on: "save", admin: { position: "sidebar" } })`
- [x] `packages/core/src/collections/api/create/server.ts` — `stampUpdatedAt` call → `stampCommitTsFields` with `events` computed from the resolved publish status
- [x] `packages/core/src/collections/api/update/server.ts` — `stampUpdatedAt` call → `stampCommitTsFields({ events: ["update"] })`
- [x] `packages/core/src/versions/publish.ts` — stamp with `events: ["publish"]` before the final patch
- [x] `packages/core/src/versions/unpublish.ts` — stamp with `events: ["unpublish"]` before the final patch
- [x] `packages/core/src/versions/saveDraft.ts` — stamp with `events: ["draftSave"]` before the draft patch
- [x] `packages/core/src/db/prepareEdit.ts` — `beforeChange`'s `doc` omits `commitTs` fields; hook props gain `commitTs: ctx.db.vars.commitTs`
- [x] `packages/core/src/collections/hooks.ts` — no production edit (confirmed: `BeforeChangeProps`/etc. already extend `BaseHookProps`, which gets `commitTs` from the next line's edit); `packages/core/src/globals/hooks.ts` likewise needs none
- [x] `packages/core/src/hooks/types.ts` — `BaseHookProps` gains `commitTs: unknown`
- [x] `packages/core/src/versions/removeVexFields.ts` + `.test.ts` — gains optional `fields` param; strips every `commitTs`-typed field in addition to the existing key sets (a raw placeholder must never enter a `vex_versions` snapshot)
- [x] every `removeVexFields({ doc })` call site (`create/server.ts`, `update/server.ts`, `publish.ts`, `saveDraft.ts`) — passes `fields: collection.fields` / `target.config.fields`
- [x] `packages/core/src/documents/cloneDocumentForDuplicate.ts` — drop the now-redundant explicit `delete stripped[COLLECTION_SYSTEM_FIELDS.updatedAt.slug]` (generically covered by `removeVexFields`'s new `fields` strip); pass `fields: props.fields` through to `removeVexFields`

## Step 4 — Wire conversion: ms at every boundary, ns only inside Convex [agent]
Why: Decision 5 / probe §2. `fetchQuery`'s RSC→client-component hop and `JSON.stringify`/URL codecs cannot carry a `bigint`. `find`/`get`/`search` convert every `commitTs` field to a ms `number` on the way out; a `where` condition on a `commitTs` field converts its ms value to an ns `bigint` on the way in. Convex's own wire protocol (WebSocket/HTTP query args and results) already carries `bigint` natively — only these two edges need code.
Verify: `pnpm --filter @vexcms/core test -- db/documents collections/api/find collections/api/get collections/api/search`
- [x] `packages/core/src/db/documents.ts` — `readableDocuments` gains `fields?: Record<string, AdminField>`; converts every readable doc's `commitTs` values from `bigint` to `Number(ns / 1_000_000n)` before returning
- [x] `packages/core/src/db/queryArgs.ts` (new helper, colocated) + `.test.ts` — `convertCommitTsWhereToNs({ where, fields })`: walks a `VexWhereNode`, converts every leaf's `value` (and `value` inside an array, for future multi-value ops) on a `commitTs`-typed field from ms `number` to ns `bigint`
- [x] `packages/core/src/collections/api/find/server.ts` — calls `convertCommitTsWhereToNs` on `args.where` before `buildQuery`; passes `fields: collection.fields` to `readableDocuments`
- [x] `packages/core/src/collections/api/search/server.ts` — same two edits
- [x] `packages/core/src/collections/api/get/server.ts` — converts the single returned document's `commitTs` fields to ms the same way

## Step 5 — React field module + list-view integration [agent]
Why: Decisions 4, 8 (list-view bucket). `checkbox`/`date` are the templates (probe §4); the admin control is read-only (never an editable `Input`), reusing `formatDateFieldValue` for display.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test -- fields/commitTs collections/listView/ListFilterBuilder collections/listUrlParams`
- [x] `packages/react/src/fields/commitTs/Field.tsx` + `.test.tsx` (new) — read-only display (relative time + tooltip per `admin.format`), never an editable control
- [x] `packages/react/src/fields/commitTs/Cell.tsx` + `.test.tsx` (new) — list-view cell, `formatCommitTsFieldValue`
- [x] `packages/react/src/fields/commitTs/columnDef.tsx` + `.test.ts` (new) — `commitTsFieldToColumnDef`
- [x] `packages/react/src/fields/commitTs/testFixture.ts` (new)
- [x] `packages/react/src/fields/commitTs/index.ts` (new) — barrel
- [x] `packages/react/src/fields/index.tsx` — registry wiring (import + `export *` + `getCollectionColumnDefs` switch case)
- [x] `packages/react/src/collections/listView/ListFilterBuilder.tsx` — `FILTER_BUILDER_OPS_BY_FIELD_TYPE.commitTs = ["gte", "lte", "isEmpty", "isNotEmpty"]`; `renderFilterValueInput` gains a `commitTs` branch reusing the `date` branch's `DateTimePicker`
- [x] `packages/core/src/collections/listUrlParams.ts` — `filterValueKindForField` returns `"date"` for `commitTs` too (identical ms ISO codec)

## Step 6 — Clean cutover: project collections, templates, seeds [agent]
Why: Decision 6. Pre-release, no migration path — every `updatedAt` consumer already gets the new field type for free through `defineCollection`'s own injection (Step 3); this step is the dev-data reset + doc sweep, not a code migration.
Verify: `pnpm typecheck && pnpm test` && `vex dev` regenerates both apps' schemas with `updatedAt: v.commitTs()` with no error
- [x] `apps/docs/src/content/docs/guides/caching-and-seo.mdx` — `## updatedAt and sitemap lastmod` section updated: field type, autosave-vs-real-edit semantics, bigint→ms (already resolved before the app ever sees it, per Step 4 — the app-facing contract is "plain ms number", unchanged from today)
- [x] `.agent/docs/product/v0.1.0-launch-plan.md` — note the reset requirement for any project with existing `updatedAt` data (pre-release, no migration)
- [x] `apps/test/`, `apps/www/` dev Convex deployments — reset/clear data (manual developer step, documented in the Verify + README, not a code change)

## Step 7 — Core unit tests, API conversion tests, list-view tests [agent]
Why: Decision 9 / probe §1. `convex-test` never resolves the placeholder — tests assert `instanceof CommitTsPlaceholder` pre-"commit" and test ms conversion on resolved-bigint fixtures separately; anything needing a real resolved value is `[UNVERIFIED AGAINST REAL BACKEND]` and deferred to the Step 8 dev-deployment smoke check.
Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`
- [x] `packages/core/src/fields/commitTs/config.test.ts` (new) — factory defaults, `on` option, auto-index default
- [x] `packages/core/src/db/documents.test.ts` — `stampCommitTsFields` per-event matrix (`save`/`publish`/`all` × every `CommitTsWriteEvent`), asserts `instanceof CommitTsPlaceholder` on the stamped field; `readableDocuments`'s ms-conversion test against a resolved-bigint fixture
- [x] `packages/core/src/db/queryArgs.test.ts` — `convertCommitTsWhereToNs` round-trip (ms in, `bigint` out, non-`commitTs` leaves untouched)
- [x] `packages/react/src/fields/commitTs/Field.test.tsx`, `Cell.test.tsx`, `columnDef.test.ts` (new) — read-only rendering, `admin.format` variants, cell formatting
- [x] `packages/react/src/collections/listView/ListFilterBuilder.test.tsx` — `commitTs` bucket ops + value control
- [x] `packages/core/src/collections/listUrlParams.test.ts` — `commitTs` filter value kind round-trip

## Step 8 — Dev-deployment smoke + docs sweep [agent]
Why: Decision 9. The only way to see a real resolved `bigint` is a live Convex backend.
Verify: manual, against the running dev apps (pnpm dev + pnpm test:dev:vex) — edit a post in `apps/test`'s admin, confirm `updatedAt` advances; sort the list by `updatedAt`; filter by it (relative-time tooltip visible); `vex generate` produces `updatedAt: v.commitTs()` in both apps' generated schemas with no error
- [x] `apps/docs/src/content/docs/guides/list-views.mdx` (if present after the list-view-overhaul spec lands) — `commitTs` listed as a sortable/filterable field type — not present yet; the list-view spec's Step 24 writes `list-views.mdx` and covers `commitTs` there (its `testimonials` example sorts by `updatedAt`)
- [x] browser smoke checklist: edit → `updatedAt` advances; sort header works; filter builder's date+time picker works; peek's Fields tab shows it formatted — performed per the digest (Step 8 + the post-Step-8 `DataTable` sort-header fix + Step13InspectPeek's peek-formatting fix), and confirmed by the developer on 2026-11-01.
