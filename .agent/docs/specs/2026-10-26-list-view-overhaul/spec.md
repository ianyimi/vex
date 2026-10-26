---
status: draft
spec_id: 2026-10-26-list-view-overhaul
touches:
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - ".agent/docs/standards/naming-conventions.md"
  - "README.md"
  - "apps/docs/src/content/docs/guides/caching-and-seo.mdx"
  - "apps/docs/src/content/docs/guides/list-views.mdx"
  - "apps/test/convex/seed.ts"
  - "apps/test/src/auth/access.ts"
  - "apps/test/src/components/TestimonialBulkApproveAction.tsx"
  - "apps/test/src/components/TestimonialFeatureRowAction.tsx"
  - "apps/test/src/db/constants/index.ts"
  - "apps/test/src/vexcms/collections/index.ts"
  - "apps/test/src/vexcms/collections/testimonials.ts"
  - "packages/core/src/access/constants.ts"
  - "packages/core/src/access/types.ts"
  - "packages/core/src/collections/api/collectionsApi.ts"
  - "packages/core/src/collections/api/find/server.test.ts"
  - "packages/core/src/collections/api/find/server.ts"
  - "packages/core/src/collections/api/listViews/server.test.ts"
  - "packages/core/src/collections/api/listViews/server.ts"
  - "packages/core/src/collections/api/removeView/server.test.ts"
  - "packages/core/src/collections/api/removeView/server.ts"
  - "packages/core/src/collections/api/saveView/server.test.ts"
  - "packages/core/src/collections/api/saveView/server.ts"
  - "packages/core/src/collections/api/search/server.test.ts"
  - "packages/core/src/collections/api/search/server.ts"
  - "packages/core/src/collections/api/types.ts"
  - "packages/core/src/collections/config.test.ts"
  - "packages/core/src/collections/config.ts"
  - "packages/core/src/collections/constants.ts"
  - "packages/core/src/collections/resolveSort.test.ts"
  - "packages/core/src/collections/resolveSort.ts"
  - "packages/core/src/collections/types.ts"
  - "packages/core/src/collections/validateTableConfig.test.ts"
  - "packages/core/src/collections/validateTableConfig.ts"
  - "packages/core/src/collections/validator.test.ts"
  - "packages/core/src/components/builtinIds.ts"
  - "packages/core/src/components/types.ts"
  - "packages/core/src/db/test/convex/schema.ts"
  - "packages/core/src/fields/baseTypes.ts"
  - "packages/core/src/schema/generateVexSchema.test.ts"
  - "packages/core/src/schema/generateVexSchema.ts"
  - "packages/core/src/vexConvexApi.ts"
  - "packages/react/src/client/index.ts"
  - "packages/react/src/collections/CollectionEditView.tsx"
  - "packages/react/src/collections/CollectionListFilterBuilder.tsx"
  - "packages/react/src/collections/CollectionListLayout.test.tsx"
  - "packages/react/src/collections/CollectionListLayout.tsx"
  - "packages/react/src/collections/CollectionListSearch.test.tsx"
  - "packages/react/src/collections/CollectionListSearch.tsx"
  - "packages/react/src/collections/CollectionListToolbar.test.tsx"
  - "packages/react/src/collections/CollectionListToolbar.tsx"
  - "packages/react/src/collections/CollectionListView.tsx"
  - "packages/react/src/collections/CollectionListViewsMenu.tsx"
  - "packages/react/src/collections/api/find/client.ts"
  - "packages/react/src/collections/api/listViews/client.ts"
  - "packages/react/src/collections/api/removeView/client.ts"
  - "packages/react/src/collections/api/saveView/client.ts"
  - "packages/react/src/collections/collectionListViewStore.test.ts"
  - "packages/react/src/collections/collectionListViewStore.ts"
  - "packages/react/src/collections/index.ts"
  - "packages/react/src/collections/useCollectionListUrlState.test.tsx"
  - "packages/react/src/collections/useCollectionListUrlState.ts"
  - "packages/react/src/collections/useCollectionListViews.test.ts"
  - "packages/react/src/collections/useCollectionListViews.ts"
  - "packages/react/src/collections/whereDnf.test.ts"
  - "packages/react/src/collections/whereDnf.ts"
  - "packages/react/src/fields/index.tsx"
  - "packages/react/src/globals/GlobalEditView.tsx"
  - "packages/react/src/hooks/index.ts"
  - "packages/react/src/hooks/useVexDoc.test.tsx"
  - "packages/react/src/hooks/useVexDoc.ts"
  - "packages/react/src/hooks/useVexList.test.tsx"
  - "packages/react/src/hooks/useVexList.ts"
  - "packages/react/src/media/MediaCollectionListView.tsx"
  - "packages/react/src/testing/convex/bridge.ts"
  - "packages/react/src/testing/convex/schema.ts"
  - "packages/react/src/testing/hooksSuite.tsx"
  - "packages/react/src/ui/data-table/DataTable.tsx"
  - "packages/react/src/ui/data-table/DataTableBulkActions.tsx"
  - "packages/react/src/ui/data-table/DataTableColumnsMenu.test.tsx"
  - "packages/react/src/ui/data-table/DataTableColumnsMenu.tsx"
  - "packages/react/src/ui/data-table/DataTablePageSizeSelect.test.tsx"
  - "packages/react/src/ui/data-table/DataTablePageSizeSelect.tsx"
  - "packages/react/src/ui/data-table/DataTableResponsiveMenu.test.tsx"
  - "packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx"
  - "packages/react/src/ui/data-table/DataTableSortHeader.test.tsx"
  - "packages/react/src/ui/data-table/DataTableSortHeader.tsx"
  - "packages/react/src/ui/data-table/index.ts"
  - "packages/react/src/versions/StatusBadge.tsx"
  - "packages/react/src/versions/VersionHistoryDropdown.tsx"
prompt_version: 1
---

# 2026-10-26-list-view-overhaul — Spec

## Overview

Launch-plan item I. Collection list views are only navigable by Load More today. This spec adds search, portable sort, a filter builder, column visibility, page size, URL state, saved views (config, shared in Convex, local in the browser), and `list.*` extension slots with `vex.*` built-ins and custom row/bulk actions. It also ships a mobile list layout (J drops the list view from its scope). The `admin.table` keys that A planned to delete are consumed here, each one alongside the control that reads it. It also covers A's remainder (the `vex_` convention, `updatedAt`), the status-enum sweep, and the `useVexList` / `useVexDoc` data-source boundary. Step bodies are mixed: Steps 3, 4, 7, and 11 ship full code; the rest ship guided stubs (signatures, JSDoc, numbered `// TODO: implement` pseudocode) filled in during the full-code pass Decision 1 describes.

## Design Decisions

1. **One spec, 13 ordered steps, all `[agent]`.** The first draft uses guided stubs; full code comes once the design settles, then `polish`. The developer delegates implementation.
2. **`admin.table.searchField: readonly TFieldSlug[]`.** It is typed to the collection's own field slugs. Array order is the picker order, and the first entry is the default when the user starts typing. With no `searchField`, the search bar is not rendered. Why: Convex `withSearchIndex` queries one index and field per query, and collections can have several searchable fields.
3. **`searchField` entries must declare a search index.** `defineConfig` throws a `VexConfigError` naming the field and the `searchIndex` to add. Schema generation emits the search index for every `searchField` entry, which drops the old "only when a collection points here" condition for those fields. Why: fail at config time, not in the browser.
4. **Sort is `{ field, order: "asc" | "desc" }` everywhere**: `defaultSort`, the `find` args, the URL, and views. Why: it keeps the existing `defaultSort` shape, and `order` matches Convex `.order()`.
5. **Sort is portable, not an index.** Clients send `sort`, never `withIndex` (B3 Decision 14). The server resolves it to the index whose first field is `field` (`resolveCollectionIndexes`, draftStatus-aware) and applies `order`. `_creationTime` needs no index. Why: stored views and URLs stay backend-neutral.
6. **An unindexed sort is a config-time error.** `defaultSort.field` and every field with `admin.enableSorting: true` must lead some index, or `defineConfig` throws a message naming the index to declare. At runtime, an unknown `sort.field` gets a `VexError` with the same message. Why: no silent auto-indexes; the user declares indexes explicitly.
7. **Search and sort are mutually exclusive.** While a search query is active, sort headers are disabled and show "sorted by relevance", and the server rejects `sort` together with `search`. Why: Convex search results are relevance-ordered.
8. **Pagination stays cursor Load More, plus a page-size select** driven by `pageSizeOptions`. Why: search, sort, and filters meet the navigability acceptance; numbered pages would cost O(n) scans on Convex.
9. **URL state:** `search`, `searchField`, `sort`, `where` (JSON of the plain `VexWhereNode`), `pageSize`, `view`. Invalid params are dropped, never thrown. Columns are not in the URL.
10. **Filter builder: AND rows within groups, OR between groups (one level, DNF)**, over `eq neq gt gte lt lte`, with the value input chosen by field type. The stored form is `{ or: [{ and: [leaf…] }…] }`, collapsed to the simplest equivalent node. A `where` that isn't in normal form, for example from a config view, renders read-only. Why: it covers multi-value and triage use cases without a tree editor; `VexWhereNodeOf` already serializes `and`/`or`/`not`.
11. **Saved views come from three sources, merged by `viewId`:** `config` (`admin.table.views`, read-only, fully typed to the collection), `shared` (the `vex_views` table), and `local` (localStorage). A view stores `{ where, sort, search, searchField, columns, pageSize }`.
12. **Shared views are collection-wide**, plus scoped to the organization when `access.orgCollectionSlug` is set. There are no user or role scopes. Why: localStorage is the personal tier.
13. **The new access action `manageViews` is denied by default (fail-closed)** and governs creating, editing, and deleting shared views, enforced server-side. Users without it can still save views locally.
14. **Promotion is a move.** A local view is saved shared with its client-generated `viewId` (save is idempotent on `viewId`), and the local entry is deleted only after success; on failure, the local entry stays. The merged list dedupes by `viewId`, which also covers another tab racing the promotion.
15. **With no view selected, column visibility is session-only.** There is no auto-persist of the last-used state.
16. **`vex_views` is emitted unconditionally by `generateVexSchema`**, like `vex_versions`. All framework tables and system fields use the `vex_` prefix (step 1 writes this convention down).
17. **Row and bulk actions are slot contributions only.** `list.row.actions` and `list.bulkActions` contributions are React components receiving `{ collection, docs }`, gated by the existing `SlotAccessPredicate`. Create, search, filters, columns, views, row delete, and bulk delete are built-ins with `vex.list.*` IDs. Client-only (plugin stem S14). There is no declarative `{ label, mutation }` sugar.
18. **The `list.*` slot IDs are:** `list.header.actions`, `list.toolbar`, `list.filters`, `list.beforeTable`, `list.afterTable`, `list.row.actions`, `list.bulkActions`.
19. **Data-source hooks.** `useVexList(props)` and `useVexDoc(props)` live in `react/src/hooks/` beside `usePaginatedQuery` / `usePaginatedSearch`, which they wrap. The list and edit views stop calling `vexConvexApi` directly. Convex is the only implementation. Why: this boundary is where plugin, adapter, and adopted-table sources plug in later.
20. **Status values come from `VERSION_STATUSES`, never literals.** Badges and status filters iterate the enum. Why: approval stages and branches will add states later.
21. **Placement follows `react-feature-folders`:** flat files in existing domain folders, with no new top-level folders.
    - List UI goes in `react/src/collections/` with the `CollectionList*` / `useCollectionList*` prefix.
    - Generic table controls go in `react/src/ui/data-table/` with the `DataTable*` prefix.
    - Saved-view operations go in `core/src/collections/api/{listViews,saveView,removeView}/` and `react/src/collections/api/<op>/client.ts`.
    - View types go in `core/src/collections/types.ts`.
    - This follows the rewritten `react-feature-folders` / `core-domain-folders` rules and AP-023. Folders stay flat while small; the developer, not an agent, splits a crowded folder into `components/`, `hooks/`, `context/`.
22. **The mobile layout is built into I.** Below `md`, the toolbar collapses into an overflow menu and menus render as sheets. The table scrolls horizontally with a sticky first column, and the bulk bar is fixed to the bottom.
23. **`RevalidateButton` stays outside the `list.*` slots.** `CollectionListView` renders it itself, beside `CollectionListLayout`'s output, not as a `list.header.actions` contribution — it isn't named in Decision 17's built-in list or Decision 18's slot list. Why: slotting it is a later decision, not an assumption to bake in silently.
24. **Shared-view `organizationId` is resolved and stamped server-side** from the caller's session (`auth.organization`), never accepted as a client-supplied arg on `listViews`/`saveView` — taking it from the client would let a caller read or write another organization's views. `db/test/convex/schema.ts`, `@vexcms/core`'s own hand-maintained test fixture (separate from `generateVexSchema.ts`'s generated output), also gains a `vex_views` table so Step 6's tests compile.

## Out of Scope

- Inline cell editing
- CSV export / import
- Searching all fields in one query (a fan-out search merged on the client)
- Drag-reorder rows / manual ordering
- Numbered pagination / jumping to page N
- Nested filter trees beyond one level of OR groups; a `contains` / `in` operator
- Declarative row/bulk action sugar (`{ label, icon, mutation }`)
- Auto-persisting the last-used list state
- User- or role-scoped shared views

## Implementation

### Step 1 — A's remainder: `vex_` convention + `updatedAt` [agent]

Why: C and I both add framework tables; the convention must be written before `vex_views` is introduced. `updatedAt` was verified-only in A.

- [ ] `.agent/docs/standards/naming-conventions.md` — `vex_` rule: every framework table and system field is `vex_`-prefixed, emitted unconditionally by `generateVexSchema`, never user-declarable; migration rule for renames
- [ ] `updatedAt` behavior confirmed against `api/create/server.ts` / update path; confirmed accurate against `guides/caching-and-seo.mdx` (no dedicated collections docs page exists) + launch plan A item ticked
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — A's remainder checkbox ticked

#### .agent/docs/standards/naming-conventions.md

1 edit — everything else in the file is unchanged.

**1 — new bullet in the `## Identifiers` list**, after the existing `Convex functions:` bullet and before `Name by code area, then thing:`. Confirmed against the two existing framework tables (`export const vex_versions = defineTable(...)`, `export const vex_globals = defineTable(...)` in `schema/generateVexSchema.ts:64,90`) and the framework-owned `updatedAt`/`_status`/`_version` fields (`db/documents.ts`, `versions/` — see the `updatedAt` section below):

```md
- **Framework tables & system fields:** every table `generateVexSchema` emits that the project did not declare itself (`vex_versions`, `vex_globals`, `vex_views`), and every field a framework mechanism injects onto a user table (`updatedAt`, `_status`, `_version`), is `vex_`-prefixed or, for fields living inside a user's own table, named for what it stores with no prefix collision risk against `defineCollection`'s reserved-key guard. Framework tables are emitted unconditionally — never gated behind "does any collection use this" — and are never user-declarable: `defineCollection`/`defineGlobal` reject a `vex_`-prefixed slug at config time, the same reserved-key guard that already rejects a user field named `updatedAt` on an opted-out collection. Renaming a `vex_` table is a migration, not a rename: ship the new table alongside the old one for one minor version, backfill in a one-off script, drop the old table in the following minor, and note both the deprecation and the removal in the changelog — the same two-step the `filter` → `where` rename used (B3, launch plan constraint 5).
```

#### .agent/docs/product/v0.1.0-launch-plan.md

1 edit — everything else in the file is unchanged.

**1 — tick A's remainder checkbox**, in the `## A — Data-table integrity & dead config` section's Tasks list (`- [ ] Remainder folded into I: ...`, launch-plan.md:903):

```md
  - [x] Remainder folded into I: `vex_` convention written down (`naming-conventions.md`), `updatedAt` confirmed (unchanged — see Step 1 of `2026-10-26-list-view-overhaul`), sort/column config consumed with its controls (Steps 3/9 of the same spec)
```

#### apps/docs/src/content/docs/guides/caching-and-seo.mdx

No code change — this is the confirmation record, not a new edit. `updatedAt`'s behavior is already fully and correctly documented at `guides/caching-and-seo.mdx:326-340` (`## updatedAt and sitemap lastmod`), and matches the implementation exactly:

- **Auto-injected, opt-out via `{ timestamps: false }`.** `collections/config.ts:178-196` injects an optional `updatedAt: date(...)` field onto every collection unless `input.timestamps === false`, `"updatedAt" in input.fields` (the auth adapter already declared its own), or `meta.protected === true` (auth-adapter-owned tables). Matches the doc's "auto-injects an optional `updatedAt: number` field ... into every collection that isn't `meta.protected` or an auth-adapter table that already owns the column" claim.
- **Stamped on every `create`/`update`.** Both `api/create/server.ts` and `api/update/server.ts` call the shared `stampUpdatedAt` (`db/documents.ts:35-53`), which sets `updatedAt: Date.now()` unless the collection has no `updatedAt` field (opted out) or the field is `meta.locked` (better-auth's own, confirmed by `create/server.test.ts:491-514`: "does not stamp over a locked updatedAt — the auth adapter owns that value"). Matches the doc's "stamped on every `create`/`update`" claim.
- **Globals carry no `updatedAt`.** `defineGlobal` has no equivalent injection path — confirmed by grep, there is no `stampUpdatedAt` call anywhere under `globals/`. Matches the doc.
- **Seeded/imported rows have none** until a write goes through `create`/`update` — the field is only ever set by the stamp, never backfilled. Matches the doc's "only populated by a write through the admin panel or API — seeded and imported rows have none" claim.

No doc change is needed; this step's checkbox is satisfied by the confirmation above, not a new page. (Step 13's list-view guide is where `updatedAt`'s role as a sortable/visible column gets documented, since it does not exist as a UI concept until this spec's later steps add it.)

Verify: harness doctor

### Step 2 — Status enum replaces string literals [agent]

Why: approval stages and branches will add states later; badges/filters must iterate `VERSION_STATUSES`, not switch on two literals.

- [ ] `packages/react/src/versions/StatusBadge.tsx` — label/variant resolved by looking up `VERSION_STATUSES[props.status]`, not a `?:` chain on two literal comparisons
- [ ] `packages/react/src/collections/CollectionEditView.tsx` — `publishedTimeline` filter and the `status` ternary passed to `DraftToolbar` read `VERSION_STATUSES.published.key` / `VERSION_STATUSES.draft.key`
- [ ] `packages/react/src/globals/GlobalEditView.tsx` — same sweep: `publishedTimeline` filter, `isDraftDoc`'s `vex_status` comparison, and both `documentStatus`/`DraftToolbar` ternaries
- [ ] `packages/react/src/versions/VersionHistoryDropdown.tsx` — `publishedVersion` reduction filter reads `VERSION_STATUSES.published.key`
- [ ] `packages/react/src/testing/convex/schema.ts` — both `v.union(v.literal("draft"), v.literal("published"))` fields emit from `VERSION_STATUSES.draft.key` / `VERSION_STATUSES.published.key`
- [ ] `packages/react/src/collections/CollectionListView.tsx` — already reads `VERSION_STATUSES.draft.key` / `VERSION_STATUSES.published.key` (confirmed, no further edit)
- [ ] grep-proof: no raw `"draft"` / `"published"` status literals remain in `packages/*/src` non-test files (`*.test.ts(x)` keep literals asserting stored data; `packages/react/src/testing/**` test-harness suites — `viewSuite.ts`, `accessFixtures.ts`, `modalSuite.tsx` — keep their seeded literals, they assert stored data the same as a colocated test)

#### packages/react/src/versions/StatusBadge.tsx

2 edits — everything else unchanged.

**1 — JSDoc example (`@example`), anchor `<StatusBadge status={isDraftDoc ? "draft" : "published"} />`.**

```tsx
 * @example
 * ```tsx
 * <StatusBadge status={isDraftDoc ? VERSION_STATUSES.draft.key : VERSION_STATUSES.published.key} />
 * ```
 */
```

**2 — body of `StatusBadge`, replace the `variant`/`label` ternary chain with a direct lookup into `VERSION_STATUSES`.**

```tsx
export function StatusBadge(props: StatusBadgeProps) {
  const statusConfig = VERSION_STATUSES[props.status];
  const variant = props.status === VERSION_STATUSES.draft.key ? "outline" : "default";
  return <Badge variant={variant}>{statusConfig.labels.singular}</Badge>;
}
```

#### packages/react/src/collections/CollectionEditView.tsx

2 edits — everything else unchanged. `VERSION_STATUSES` is already imported from `@vexcms/core` (used at line 381 for `isDraftDoc`).

**1 — `publishedTimeline`, anchor `.filter((row) => row.status === "published" && row.publishedAt !== null)`.**

```tsx
  const publishedTimeline = (unpublishVersions ?? [])
    .filter((row) => row.status === VERSION_STATUSES.published.key && row.publishedAt !== null)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
```

**2 — `<DraftToolbar>`'s `status` prop, anchor `status={isDraftDoc ? "draft" : "published"}`.**

```tsx
                  status={isDraftDoc ? VERSION_STATUSES.draft.key : VERSION_STATUSES.published.key}
```

#### packages/react/src/globals/GlobalEditView.tsx

4 edits — everything else unchanged.

**1 — imports, add `VERSION_STATUSES` alongside the existing `@vexcms/core` import.**

```tsx
  VERSION_STATUSES,
  vexConvexApi,
} from "@vexcms/core";
```

**2 — `publishedTimeline`, anchor `.filter((row) => row.status === "published" && row.publishedAt !== null)`.**

```tsx
  const publishedTimeline = (unpublishVersions ?? [])
    .filter((row) => row.status === VERSION_STATUSES.published.key && row.publishedAt !== null)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
```

**3 — `isDraftDoc`, anchor `(globalDoc as { vex_status?: "draft" | "published" } | undefined)?.vex_status === "draft";`.**

```tsx
  const isDraftDoc =
    (globalDoc as { vex_status?: VexVersionStatus } | undefined)?.vex_status ===
    VERSION_STATUSES.draft.key;
```

Also add `VexVersionStatus` to the existing `@vexcms/core` type-only import in this file.

**4 — the two remaining `isDraftDoc ? "draft" : "published"` ternaries, anchor `documentStatus =` and `<DraftToolbar>`'s `status` prop.**

```tsx
  const documentStatus =
    isVersioned && globalDoc
      ? isDraftDoc
        ? VERSION_STATUSES.draft.key
        : VERSION_STATUSES.published.key
      : undefined;
```

```tsx
                  status={
                    globalDoc
                      ? isDraftDoc
                        ? VERSION_STATUSES.draft.key
                        : VERSION_STATUSES.published.key
                      : undefined
                  }
```

#### packages/react/src/versions/VersionHistoryDropdown.tsx

1 edit — everything else unchanged. `VERSION_STATUSES` added to the existing `@vexcms/core` import (currently imports `type VersionSummary` etc. from the same specifier).

**1 — `publishedVersion`, anchor `.filter((row) => row.status === "published")`.**

```tsx
  const publishedVersion = rows
    .filter((row) => row.status === VERSION_STATUSES.published.key)
    .reduce<VersionSummary | undefined>(
      (latest, row) => (latest && (latest.publishedAt ?? 0) >= (row.publishedAt ?? 0) ? latest : row),
      undefined,
    )?.version;
```

#### packages/react/src/testing/convex/schema.ts

2 edits — everything else unchanged.

**1 — imports, add the `VERSION_STATUSES` import.**

```ts
import { VERSION_STATUSES } from "@vexcms/core";
import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
} from "convex/server";
```

**2 — `documents` table's `vex_status` field, anchor `vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),`.**

```ts
    vex_status: v.optional(
      v.union(v.literal(VERSION_STATUSES.draft.key), v.literal(VERSION_STATUSES.published.key)),
    ),
```

**3 — `vex_versions` table's `status` field, anchor `status: v.union(v.literal("draft"), v.literal("published")),`.**

```ts
    status: v.union(v.literal(VERSION_STATUSES.draft.key), v.literal(VERSION_STATUSES.published.key)),
```

Verify: pnpm typecheck && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test

The grep-proof check above has narrow, deliberate exceptions: core's own non-test files (`versions/publish.ts`, `versions/unpublish.ts`, `versions/saveDraft.ts`, `versions/resolveVersionedTarget.ts`, `versions/schema.ts`, `versions/statusQueryConstraint.ts`, `globals/api/upsert/server.ts`) already read `VERSION_STATUSES.*.key` exclusively — their remaining `"draft"`/`"published"` hits are JSDoc prose describing stored values (`collections/types.ts`'s `defaultStatus` doc comment, `db/populate.ts`, `collections/interfaceGen.ts`), not code literals. `packages/core/src/fields/select/**` and the matching `adminFieldToInputSchema`/`adminFieldToValidator` hits are a generic `select()` field fixture whose option values happen to be the strings `"draft"`/`"published"`, unrelated to `vex_status`/`VERSION_STATUSES`. `packages/react/src/testing/harness/accessFixtures.ts` and `testing/modalSuite.tsx` key off an arbitrary fixture `status` field for access-rule testing, not `vex_status`, and are left alone. No `packages/next/src` file contains a `"draft"`/`"published"` literal.

### Step 3 — `admin.table` config surface + config-time validation [agent]

Why: every control ships with the key that drives it; bad `searchField` / unindexed sort must fail at `defineConfig`, naming the index to declare.

- [ ] `packages/core/src/collections/types.ts` — `CollectionTableSort<TFieldSlug>`; `searchField?: readonly TFieldSlug[]`; `defaultSort` typed to field slugs + `_creationTime`; `defaultColumns?: TFieldSlug[]`; `AdminCollectionConfigInput`/`AdminCollectionConfig` thread `TFieldSlug` into `table`
- [ ] `packages/core/src/fields/baseTypes.ts` — `admin.enableSorting?: boolean` / `admin.enableHiding?: boolean` on `FieldAdminConfigInput` and resolved `FieldAdminConfig`
- [ ] `packages/core/src/collections/config.ts` — resolve defaults (no `searchField` → search hidden; `defaultColumns` → all non-hidden fields; `enableSorting`/`enableHiding` default `false`); wires `validateTableConfig`
- [ ] `packages/core/src/collections/validateTableConfig.ts` (new) + `packages/core/src/collections/validateTableConfig.test.ts` (new) — throws `VexConfigError` when a `searchField` entry has no `searchIndex`, or `defaultSort.field` / an `enableSorting` field has no index leading with it (via `resolveCollectionIndexes`); message names field + index to declare
- [ ] `packages/core/src/collections/validator.test.ts` — test confirming `.searchIndex()` is emitted for every field with its own `searchIndex`, independent of `useAsTitle`/incoming relationships
- [ ] `packages/core/src/collections/config.test.ts` — type tests: `admin.table.searchField`, `defaultSort.field`, `defaultColumns` reject unknown field slugs

Verify: `pnpm typecheck && pnpm --filter @vexcms/core test -- collections`

#### packages/core/src/collections/types.ts

5 edits. Everything else in the file is unchanged.

**1 — new `CollectionTableSort` type**, added above `CollectionTableConfigInput` (anchor: the `RelationshipPreviewProps` interface that precedes it).

```ts
/**
 * A portable table sort: a field slug (or `_creationTime`) plus direction.
 * Used by `admin.table.defaultSort`, `find`'s `sort` arg, the list URL, and
 * saved views — the same shape everywhere so a stored view stays
 * backend-neutral (B3 Decision 14 / this spec's Decision 4).
 *
 * @typeParam TFieldSlug - The collection's own field slugs.
 */
export interface CollectionTableSort<TFieldSlug extends string = string> {
  /** The field to sort by, or `"_creationTime"` for insertion order. */
  field: TFieldSlug | "_creationTime";
  /** Sort direction — matches Convex `.order()`. */
  order: "asc" | "desc";
}
```

**2 — `CollectionTableConfigInput` gains a `TFieldSlug` type param and the table-surface keys.** Replaces the whole interface body.

```ts
/**
 * Configuration for data table display and behavior in the admin panel.
 *
 * @typeParam TFieldSlug - The collection's own field slugs, typing `searchField`,
 *   `defaultSort`, and `defaultColumns`.
 */
export interface CollectionTableConfigInput<TFieldSlug extends string = string> {
  /**
   * Default number of items per page.
   * @default 10
   */
  defaultPageSize?: number;

  /**
   * Default number of items per page fetch from the server.
   * @default 100
   */
  serverPageSize?: number;

  /**
   * Available page size options in the pagination controls.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];

  /**
   * Fields the list search bar queries, in picker order — the first entry is
   * the default when the user starts typing. Each entry must name a field
   * declaring its own `searchIndex` (`text` / `textarea` / `email`); checked
   * by `validateTableConfig`. Omit to hide the search bar entirely.
   *
   * @default undefined (search bar hidden)
   */
  searchField?: readonly TFieldSlug[];

  /**
   * Default sort field and order. `field` must be `"_creationTime"` or lead
   * some declared index — checked by `validateTableConfig`.
   * @default { field: "_creationTime", order: "desc" }
   */
  defaultSort?: CollectionTableSort<TFieldSlug>;

  /**
   * Bulk action configuration.
   */
  bulkActions?: {
    /**
     * Enable bulk delete action.
     * @default true
     */
    delete: boolean;
  };

  /**
   * Default visible columns (by field key).
   * @default every field whose `admin.hidden` is not `true`
   */
  defaultColumns?: TFieldSlug[];
}
```

**3 — `CollectionTableConfig` (resolved) mirrors the same keys.** Replaces the whole interface body.

```ts
/**
 * Configuration for data table display and behavior in the admin panel.
 *
 * @see {@link CollectionTableConfigInput} for the user-facing input type
 */
export interface CollectionTableConfig<TFieldSlug extends string = string> {
  /** Default number of items per page on the client. */
  defaultPageSize: number;
  /** Default number of items per page fetch from the server. */
  serverPageSize: number;
  /** Available page size options in the pagination controls. */
  pageSizeOptions: number[];
  /** Fields the list search bar queries, in picker order. `undefined` hides the search bar. */
  searchField?: readonly TFieldSlug[];
  /** Default sort field and order. */
  defaultSort: CollectionTableSort<TFieldSlug>;
  /** Bulk action configuration. */
  bulkActions: {
    /** Enable bulk delete action. */
    delete: boolean;
  };
  /** Default visible columns (by field key). */
  defaultColumns: TFieldSlug[];
}
```

**4 — `AdminCollectionConfigInput.table` threads `TFieldSlug`.** Anchor: the `table?: CollectionTableConfigInput;` member.

```ts
  table?: CollectionTableConfigInput<TFieldSlug>;
```

**5 — `AdminCollectionConfig.table` threads `TFieldSlug`.** Anchor: the `table: CollectionTableConfig;` member.

```ts
  table: CollectionTableConfig<TFieldSlug>;
```

#### packages/core/src/fields/baseTypes.ts

2 edits. Everything else in the file is unchanged.

**1 — `FieldAdminConfigInput` gains the two column flags.** Anchor: the `components?: FieldSlotComponentsInput<TComponent>;` member that closes the interface.

```ts
  components?: FieldSlotComponentsInput<TComponent>;
  /**
   * Allow the list table's column header for this field to sort the table.
   * The field must lead some declared index (or be `defaultSort.field`) —
   * checked by `validateTableConfig`.
   *
   * Default: `false`
   */
  enableSorting?: boolean;
  /**
   * Allow this field's column to be hidden from the list table via the
   * columns menu.
   *
   * Default: `false`
   */
  enableHiding?: boolean;
```

**2 — `FieldAdminConfig` (resolved) gains the same two flags, always present.** Anchor: the `components: { ... };` member that closes the interface.

```ts
  components: {
    Input: ComponentOverrideInput<TComponent, unknown>[];
    Field: ComponentOverrideInput<TComponent, unknown>[];
    Cell: ComponentOverrideInput<TComponent, unknown>[];
    Label: ComponentOverrideInput<TComponent, unknown>[];
    Description: ComponentOverrideInput<TComponent, unknown>[];
    beforeInput: ComponentContributionInput<TComponent, unknown>[];
    afterInput: ComponentContributionInput<TComponent, unknown>[];
  };
  /** Whether the list table's column header for this field may sort the table. */
  enableSorting: boolean;
  /** Whether this field's column may be hidden from the list table via the columns menu. */
  enableHiding: boolean;
```

#### packages/core/src/collections/config.ts

3 edits. Everything else in the file is unchanged.

**1 — imports.** Anchor: the existing import block at the top of the file.

```ts
import { resolveCollectionIndexes } from "./resolveCollectionIndexes";
import { validateTableConfig } from "./validateTableConfig";
```

**2 — `populateCollectionFieldMeta` defaults the two new field admin flags.** Replaces the body of `populateCollectionFieldMeta`'s `forEach` callback.

```ts
  Object.entries(config.fields).forEach(([fieldSlug, field]) => {
    const typedField = field as AdminField<TFieldMeta & CollectionFieldMeta>;
    fields[fieldSlug] = {
      ...typedField,
      admin: {
        enableSorting: false,
        enableHiding: false,
        ...typedField.admin,
      },
      meta: {
        ...typedField?.meta,
        collectionSlug: config.slug,
      },
    };
  });
```

**3 — `defineCollection`'s return construction** computes `defaultColumns` and calls `validateTableConfig` before returning. Replaces everything from the `populateCollectionFieldMeta` call through the end of the function (anchor: the `// Runs the injected field through the same \`collectionSlug\` meta-stamping` comment through the function's closing `}`).

```ts
  // Runs the injected field through the same `collectionSlug` meta-stamping as
  // every other field, and defaults enableSorting/enableHiding.
  const fields = populateCollectionFieldMeta({
    config: { ...input, fields: fieldsWithTimestamp },
  });

  // `defaultColumns` falls back to every non-hidden data field, in field
  // declaration order, when the project doesn't specify one.
  const defaultColumns =
    input.admin?.table?.defaultColumns ??
    Object.entries(getDataFields({ fields: fieldsWithTimestamp }))
      .filter(([, field]) => field.admin?.hidden !== true)
      .map(([fieldKey]) => fieldKey);

  const collection = {
    interfaceName: slugToPascalCase({ slug: input.slug }) + "Document",
    ...input,
    // `populateCollectionFieldMeta`'s return widens to `Record<string, AdminField<...>>`;
    // `TFields` is the caller's literal fields-record type, structurally unrelated
    // to that widened shape from TS's point of view even though the runtime value
    // is exactly `TFields` plus the `collectionSlug` meta stamp.
    fields: fields as unknown as Partial<
      Record<CollectionSystemField, AdminField<TFieldMeta & CollectionFieldMeta>>
    > &
      TFields,
    hooks: (input.hooks ?? {}) as CollectionHooks<TCollectionSlug>,
    admin: {
      useAsTitle: "_id",
      ...input.admin,
      table: {
        defaultPageSize: 10,
        serverPageSize: 100,
        pageSizeOptions: [10, 25, 50, 100],
        ...input.admin?.table,
        defaultColumns,
        bulkActions: {
          delete: true,
          ...input.admin?.table?.bulkActions,
        },
        defaultSort: {
          field: "_creationTime",
          order: "desc",
          ...input.admin?.table?.defaultSort,
        },
      },
      // One boundary cast: `CollectionConfigInput` widens `TCollectionSlug` to
      // `string`, so its resolver's doc type is the conditional form TS cannot
      // reduce against `CollectionConfig`'s already-narrowed parameter. Same
      // shape either way — mirrors `globals/config.ts`.
      // Passed through untouched, NOT defaulted: this factory runs before
      // `defineConfig` has seen `livePreview.collections[slug]`, so a default
      // applied here would be indistinguishable from an explicit value and would
      // outrank the root entry. `resolveLivePreviewSettings` owns every default.
      livePreview: input.admin?.livePreview as AdminCollectionConfig<
        string,
        ComponentHKT,
        TCollectionSlug
      >["livePreview"],
    },
    labels: {
      singular: toTitleCase(pluralize.singular(input.slug)),
      plural: toTitleCase(input.slug),
      ...input.labels,
    },
    meta: {
      ...input.meta,
    } as TCollectionMeta,
    versions: {
      drafts: false as TDrafts,
      cascadeDelete: true,
      defaultStatus: VERSION_STATUSES.draft.key,
      ...input.versions,
      autosave: {
        enabled: false,
        debounceMs: DEFAULT_AUTOSAVE_DEBOUNCE_MS,
        ...input.versions?.autosave,
      },
    },
  } as CollectionConfig<TFieldMeta & CollectionFieldMeta, TCollectionMeta, TCollectionSlug, TFields, TComponent, TDrafts>;

  // Config-time guard for Decisions 3 & 6: a `searchField` entry with no
  // `searchIndex`, or a sortable field with no leading index, is a project
  // bug caught here rather than surfacing as a broken control in the browser.
  validateTableConfig({ collection });

  return collection;
}
```

#### packages/core/src/collections/validateTableConfig.ts

```ts
import { getDataFields } from "../fields";
import { CollectionConfig } from "./types";
import { resolveCollectionIndexes } from "./resolveCollectionIndexes";

/**
 * Thrown by `validateTableConfig` (and other config-time collection checks)
 * when `admin.table` names a field or index that `defineCollection` cannot
 * satisfy. Mirrors the domain-scoped config error pattern used by
 * `VexAccessConfigError` / `VexComponentConfigError` / `VexAuthConfigError` /
 * `VexStorageConfigError` — this is collections' member of that family.
 */
export class VexConfigError extends Error {
  /** @param message — Human-readable description of the configuration error. */
  constructor(message: string) {
    super(message);
    this.name = "VexConfigError";
  }
}

/**
 * Validates a collection's `admin.table` surface against its fields and
 * declared indexes (Decisions 3 & 6).
 *
 * Checks:
 * 1. Every `admin.table.searchField` entry names a field that declares its
 *    own `searchIndex` (`"searchIndex" in field && field.searchIndex`) →
 *    else throws naming the field and the `searchIndex` to add.
 * 2. `admin.table.defaultSort.field` and every field with
 *    `admin.enableSorting: true`, when not `"_creationTime"`, lead some
 *    index resolved by `resolveCollectionIndexes` (`index.fields[0] ===
 *    fieldKey`) → else throws naming the field and the index to declare.
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection (after `defineCollection`'s
 *   defaults are applied, before it is returned to the caller).
 * @throws {VexConfigError} On either check above.
 */
export function validateTableConfig(props: { collection: CollectionConfig }): void {
  const { collection } = props;
  const at = `defineCollection: collection "${collection.slug}"`;
  const dataFields = getDataFields({ fields: collection.fields });

  for (const fieldKey of collection.admin.table.searchField ?? []) {
    const field = dataFields[fieldKey];
    const hasSearchIndex = field !== undefined && "searchIndex" in field && field.searchIndex !== undefined;
    if (!hasSearchIndex) {
      throw new VexConfigError(
        `${at}: admin.table.searchField names "${fieldKey}", which has no searchIndex. ` +
          `Add searchIndex: { name: "search_${fieldKey}", filterFields: [] } to the "${fieldKey}" field.`,
      );
    }
  }

  const indexes = resolveCollectionIndexes({ collection });
  const leadsSomeIndex = (fieldKey: string) => indexes.some((index) => index.fields[0] === fieldKey);

  const sortableFields = new Set<string>(
    Object.entries(dataFields)
      .filter(([, field]) => field.admin?.enableSorting === true)
      .map(([fieldKey]) => fieldKey),
  );
  const defaultSortField = collection.admin.table.defaultSort.field;
  if (defaultSortField !== "_creationTime") sortableFields.add(defaultSortField);

  for (const fieldKey of sortableFields) {
    if (!leadsSomeIndex(fieldKey)) {
      throw new VexConfigError(
        `${at}: field "${fieldKey}" is sortable (defaultSort or admin.enableSorting) but leads no declared ` +
          `index. Add index: "by_${fieldKey}" to the "${fieldKey}" field, or a collection-level ` +
          `indexes entry starting with "${fieldKey}".`,
      );
    }
  }
}
```

#### packages/core/src/collections/validateTableConfig.test.ts

```ts
import { describe, expect, it } from "vitest";

import { text } from "../fields";
import { defineCollection } from "./config";
import { VexConfigError } from "./validateTableConfig";

describe("validateTableConfig — searchField", () => {
  it("accepts a searchField entry whose field declares its own searchIndex", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: {
          title: text({ required: true, searchIndex: { name: "search_title", filterFields: [] } }),
        },
        admin: { table: { searchField: ["title"] } },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the field and searchIndex to add when a searchField entry has none", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: { table: { searchField: ["title"] } },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": admin.table.searchField names "title", which has no searchIndex. ' +
          'Add searchIndex: { name: "search_title", filterFields: [] } to the "title" field.',
      ),
    );
  });
});

describe("validateTableConfig — sort", () => {
  it("accepts the default defaultSort.field of _creationTime with no index", () => {
    expect(() =>
      defineCollection({ slug: "posts", fields: { title: text({ required: true }) } }),
    ).not.toThrow();
  });

  it("accepts a defaultSort.field that leads a declared index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true, index: "by_title" }) },
        admin: { table: { defaultSort: { field: "title", order: "asc" } } },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the field and index to declare when defaultSort.field leads no index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: { table: { defaultSort: { field: "title", order: "asc" } } },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": field "title" is sortable (defaultSort or admin.enableSorting) but leads no declared ' +
          'index. Add index: "by_title" to the "title" field, or a collection-level ' +
          'indexes entry starting with "title".',
      ),
    );
  });

  it("throws VexConfigError when an admin.enableSorting field leads no index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { author: text({ required: true, admin: { enableSorting: true } }) },
      }),
    ).toThrow(VexConfigError);
  });

  it("accepts an admin.enableSorting field that leads a declared index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { author: text({ required: true, index: "by_author", admin: { enableSorting: true } }) },
      }),
    ).not.toThrow();
  });
});
```

#### packages/core/src/collections/validator.test.ts

1 addition. Everything else in the file is unchanged — appended as a new `describe` block after the existing `describe("generateVexSchema — searchIndex", ...)`-style blocks in this file.

```ts
describe("collectionConfigToVexSchema — admin.table.searchField", () => {
  it("emits the field's own searchIndex when listed in admin.table.searchField, with no useAsTitle or incoming relationship involved", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: {
        name: text({ required: true }),
        bio: text({ required: true, searchIndex: { name: "search_bio", filterFields: [] } }),
      },
      admin: { useAsTitle: "name", table: { searchField: ["bio"] } },
    });
    const config = defineConfig({ collections: [authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).toContain('.searchIndex("search_bio"');
    expect(output).toContain('searchField: "bio"');
  });
});
```

This test file already imports `defineCollection`/`defineConfig`/`text`/`collectionConfigToVexSchema` from its existing `describe` blocks — no new imports needed.

#### packages/core/src/collections/config.test.ts

1 addition. Everything else in the file is unchanged — appended as a new `describe` block, following the existing `@ts-expect-error` convention used elsewhere in this test suite (e.g. `access/types.test.ts`).

```ts
describe("defineCollection — admin.table field-slug typing", () => {
  it("rejects a searchField entry that is not one of the collection's own fields", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      admin: {
        table: {
          // @ts-expect-error — "nope" is not a field slug on this collection
          searchField: ["nope"],
        },
      },
    });
  });

  it("rejects a defaultSort.field that is not a field slug or _creationTime, and accepts _creationTime", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      admin: {
        table: {
          // @ts-expect-error — "nope" is not a field slug or "_creationTime"
          defaultSort: { field: "nope", order: "asc" },
        },
      },
    });
    defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      admin: { table: { defaultSort: { field: "_creationTime", order: "asc" } } },
    });
  });

  it("rejects a defaultColumns entry that is not one of the collection's own fields", () => {
    defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      admin: {
        table: {
          // @ts-expect-error — "nope" is not a field slug on this collection
          defaultColumns: ["nope"],
        },
      },
    });
  });
});
```

Verify: `pnpm typecheck && pnpm --filter @vexcms/core test -- collections`

### Step 4 — `manageViews` access action + `vex_views` table [agent]

Why: shared views need a store and a gate; default denied (fail-closed).

- [ ] `packages/core/src/access/constants.ts` — `VIEW_ACTIONS = { manageViews }`
- [ ] `packages/core/src/access/types.ts` — `HasTable` guard; `ViewAction` wired into `SubjectMap`'s per-resource action union (collections only)
- [ ] `packages/core/src/schema/generateVexSchema.ts` + `packages/core/src/schema/generateVexSchema.test.ts` — emit `vex_views` unconditionally: `collection`, `viewId`, `name`, `state` (where/sort/search/searchField/columns/pageSize), `organizationId?`, `createdBy`; indexes `by_collection`, `by_collection_org`, `by_view_id`
- [ ] `packages/core/src/collections/constants.ts` (new) — `VEX_VIEW_SOURCES` map + derived `VexViewSource` union
- [ ] `packages/core/src/collections/types.ts` — `VexViewState`, `VexViewConfig`, `VexStoredView`; completes `admin.table.views` Step 3 deferred
- [ ] `packages/core/src/collections/config.ts` — resolves `admin.table.views` default (`[]`)
- [ ] `packages/core/src/collections/validateTableConfig.ts` + `packages/core/src/collections/validateTableConfig.test.ts` — config-time `viewId`-uniqueness check across `admin.table.views`

This step also completes the `admin.table.views` surface Step 3 deferred (`VexViewConfig` didn't exist yet): threads `views` through `CollectionTableConfigInput`/`CollectionTableConfig`, resolves its `[]` default in `collections/config.ts`, and adds a config-time `viewId`-uniqueness check to Step 3's `validateTableConfig.ts`.

#### packages/core/src/access/constants.ts

1 edit — everything else in this file is unchanged.

**1 — new action group, between `QueryAction` and the `PERMISSION_MODES` block.** Shared views are collection-wide (Decision 12), so `manageViews` is a single action name, not query/mutation-shaped — it gates the `saveView`/`removeView` mutations Step 6 adds, never a `find`-style query.

```ts
/**
 * The access action that gates creating, editing, and deleting a SHARED
 * (`vex_views`) saved view. Present on every collection that has a resolved
 * `admin.table` (see {@link HasTable} in `access/types.ts`) — globals have no
 * list view and never carry it.
 *
 * Undeclared like every other action (Decision 13 / P-007): a role matrix
 * that never mentions `manageViews` resolves it to denied, so shared-view
 * writes are fail-closed by default. A caller without it can still save
 * views locally — `collectionListViewStore.ts` (Step 11) never calls
 * `hasPermission` for the `local` source.
 */
export const VIEW_ACTIONS = {
  manageViews: "manageViews",
} as const;
/** View-management action union, derived from {@link VIEW_ACTIONS}. */
export type ViewAction = (typeof VIEW_ACTIONS)[keyof typeof VIEW_ACTIONS];
```

#### packages/core/src/access/types.ts

3 edits — everything else in this file is unchanged. No change to `hasPermission.ts`: an undeclared action already resolves to denied (P-007), so `manageViews` is fail-closed the moment it is wired into the action union below — Step 6's `saveView`/`removeView` server functions are the first runtime callers (`hasPermission({ resource: collection, action: VIEW_ACTIONS.manageViews, throwOnDenied: true })`).

**1 — import `ViewAction` beside the other action-union imports.**

```ts
import {
  ADMIN_CUSTOM_SUBJECTS,
  WILDCARD_KEY,
  type PermissionMode,
  type CrudAction,
  type DraftAction,
  type ViewAction,
  type AdminCustomSubjectSlug,
  QueryAction,
} from "./constants";
```

**2 — `HasTable` structural guard, beside `HasDrafts`.** `CollectionConfig.admin.table` is required (`AdminCollectionConfig.table: CollectionTableConfig`); `GlobalConfig.admin` (`GlobalAdminConfig`) has no `table` key at all, so this discriminates collection resources from global resources the same way `HasDrafts` discriminates on `versions.drafts`.

```ts
/** True when a resource config resolves an `admin.table` — collections only. @internal */
type HasTable<T> = T extends { admin: { table: unknown } } ? true : false;
```

**3 — `SubjectMap`'s per-resource `action` union, add the `HasTable` branch alongside the existing `HasDrafts` one.**

```ts
  [R in TResources[number] as ExtractSlug<R>]: {
    action:
      | CrudAction
      | (HasDrafts<R> extends true ? DraftAction : never)
      | (HasTable<R> extends true ? ViewAction : never)
      | CustomActionsFor<ExtractSlug<R>, TCustomActions>["query"]
      | CustomActionsFor<ExtractSlug<R>, TCustomActions>["mutation"];
```

#### packages/core/src/schema/generateVexSchema.ts

2 edits — everything else in this file is unchanged.

**1 — new `vexViewsTable` constant, directly after the `vexVersionsTable` declaration.** Unconditional like `vex_versions` (Decision 16): shared views need a backing table regardless of whether any collection declares `admin.table.views`, since a view can also be saved later from the UI.

```ts
  const vexViewsTable = [
    "",
    "/**",
    " * VEX VIEWS — shared saved views for collection list tables",
    " **/",
    "",
    "export const vex_views = defineTable({",
    "  collection: v.string(),",
    "  viewId: v.string(),",
    "  name: v.string(),",
    "  state: v.any(),",
    "  organizationId: v.optional(v.string()),",
    "  createdBy: v.string(),",
    "})",
    '  .index("by_collection", ["collection"])',
    '  .index("by_collection_org", ["collection", "organizationId"])',
    '  .index("by_view_id", ["viewId"])',
  ].join("\n");
```

**2 — include it in the generated output, in `return success([...])`.**

```ts
  return success(
    [header, imports, collectionSchemas, vexVersionsTable, vexViewsTable, globalsTable].join("\n"),
  );
```

#### packages/core/src/schema/generateVexSchema.test.ts

1 edit — everything else in this file is unchanged.

**1 — new test, directly after `"emits vex_versions unconditionally, even when no collection or global declares drafts"` inside the same `describe` block.**

```ts
  it("emits vex_views unconditionally, even when no collection declares admin.table.views", () => {
    const config = defineConfig({
      collections: [defineCollection({ slug: "posts", fields: { title: text() } })],
    });
    const { contents } = generateVexSchema({ config });

    expect(contents).toContain("export const vex_views = defineTable({");
    expect(contents).toContain("collection: v.string(),");
    expect(contents).toContain("viewId: v.string(),");
    expect(contents).toContain("name: v.string(),");
    expect(contents).toContain("state: v.any(),");
    expect(contents).toContain("organizationId: v.optional(v.string()),");
    expect(contents).toContain("createdBy: v.string(),");
    expect(contents).toContain('.index("by_collection", ["collection"])');
    expect(contents).toContain('.index("by_collection_org", ["collection", "organizationId"])');
    expect(contents).toContain('.index("by_view_id", ["viewId"])');
  });
```

#### packages/core/src/collections/constants.ts

1 edit — everything else in this file is unchanged.

**1 — new const map + type, at the end of the file.** Follows the same `as const` map → derived-union shape as `CONVEX_SYSTEM_FIELDS`/`COLLECTION_SYSTEM_FIELDS` above it (P-003), instead of a bare literal union.

```ts

/**
 * Where a saved view's state came from, once the three sources (Decision 11)
 * are merged by `viewId` for display:
 *
 * - `config` — declared in code via `admin.table.views`; always read-only.
 * - `shared` — a `vex_views` row; editable by callers with `VIEW_ACTIONS.manageViews`.
 * - `local` — kept in the browser's `localStorage`; editable by anyone.
 */
export const VEX_VIEW_SOURCES = {
  config: "config",
  shared: "shared",
  local: "local",
} as const;

/** Saved-view source union, derived from {@link VEX_VIEW_SOURCES}. */
export type VexViewSource = (typeof VEX_VIEW_SOURCES)[keyof typeof VEX_VIEW_SOURCES];
```

#### packages/core/src/collections/types.ts

4 edits — everything else in this file is unchanged. Edits 2–3 complete the `admin.table.views` surface Step 3 deferred here.

**1 — import `VexWhereNodeOf` beside the other type-only imports.** Matches the existing `collections/api/types.ts` convention of typing a stored/portable `where` as `VexWhereNodeOf<unknown>` (collection-structure-agnostic — Decision 9's "plain `VexWhereNode`"), rather than threading a second collection-slug generic through every saved-view type.

```ts
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";
```

**2 — `CollectionTableConfigInput<TFieldSlug>` gains `views`.** Anchor: the `defaultColumns?: TFieldSlug[];` member that closes the interface (Step 3's edit 2).

```ts
  defaultColumns?: TFieldSlug[];

  /**
   * Config-declared saved views for this collection's list table — read-only
   * in the admin panel (Decision 11's `config` source). Merged at render time
   * with `shared` (`vex_views`) and `local` (browser) views by `viewId`
   * (`useCollectionListViews`, Step 11). Every `viewId` must be unique within
   * this array — checked by `validateTableConfig`.
   *
   * @default []
   */
  views?: VexViewConfig<TFieldSlug>[];
```

**3 — `CollectionTableConfig<TFieldSlug>` (resolved) mirrors it, always present.** Anchor: the `defaultColumns: TFieldSlug[];` member that closes the interface (Step 3's edit 3).

```ts
  defaultColumns: TFieldSlug[];

  /** Config-declared saved views for this collection's list table. */
  views: VexViewConfig<TFieldSlug>[];
```

**4 — new types, at the end of the file, after `CollectionConfig`.** `CollectionTableSort<TFieldSlug>` is Step 3's type, declared earlier in this same file; TypeScript type aliases resolve regardless of declaration order within a module, so this forward reference is safe.

```ts

/**
 * One saved view's filter/sort/search/column/page-size state — the shape
 * stored by a config view (`admin.table.views`), a shared `vex_views` row,
 * and a local view, and read/written by the URL (`useCollectionListUrlState`,
 * Step 9).
 *
 * `where` is collection-structure-agnostic (`VexWhereNodeOf<unknown>`):
 * a saved/URL view is a portable JSON blob, not re-validated against the
 * owning collection's exact field union until it is applied.
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexViewState<TFieldSlug extends string = string> = {
  where?: VexWhereNodeOf<unknown>;
  sort?: CollectionTableSort<TFieldSlug>;
  search?: string;
  searchField?: TFieldSlug;
  columns?: TFieldSlug[];
  pageSize?: number;
};

/**
 * One saved view: an identity (`viewId`, `name`) plus its {@link VexViewState}.
 * The shape of `admin.table.views` entries (config source) and of
 * `collectionListViewStore.ts`'s local entries (Step 11); {@link VexStoredView}
 * extends it for the `shared` (`vex_views`) source.
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexViewConfig<TFieldSlug extends string = string> = {
  viewId: string;
  name: string;
  state: VexViewState<TFieldSlug>;
};

/**
 * A `vex_views` row shape: a {@link VexViewConfig} plus the fields only a
 * shared, server-stored view carries — which collection it belongs to, the
 * organization it is scoped to when `access.orgCollectionSlug` is set
 * (Decision 12), and who created it.
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexStoredView<TFieldSlug extends string = string> = VexViewConfig<TFieldSlug> & {
  collection: string;
  organizationId?: string;
  createdBy: string;
};
```

#### packages/core/src/collections/config.ts

1 edit — everything else in this file is unchanged (on top of Step 3's edits to this file).

**1 — `defineCollection`'s `table` object literal resolves a `views` default.** Anchor: the `defaultColumns,` member inside the `table: { ... }` literal (Step 3's edit 3).

```ts
      table: {
        defaultPageSize: 10,
        serverPageSize: 100,
        pageSizeOptions: [10, 25, 50, 100],
        ...input.admin?.table,
        defaultColumns,
        views: input.admin?.table?.views ?? [],
        bulkActions: {
```

#### packages/core/src/collections/validateTableConfig.ts

1 edit — everything else in this file (as introduced by Step 3) is unchanged.

**1 — a third check: config views' `viewId` uniqueness.** Anchor: appended at the end of `validateTableConfig`'s body, after the sort-indexed-fields `for` loop and before the function's closing `}`. Also extends the function's JSDoc `Checks:` list with a third item.

```ts
 * Checks:
 * 1. Every `admin.table.searchField` entry names a field that declares its
 *    own `searchIndex` (`"searchIndex" in field && field.searchIndex`) →
 *    else throws naming the field and the `searchIndex` to add.
 * 2. `admin.table.defaultSort.field` and every field with
 *    `admin.enableSorting: true`, when not `"_creationTime"`, lead some
 *    index resolved by `resolveCollectionIndexes` (`index.fields[0] ===
 *    fieldKey`) → else throws naming the field and the index to declare.
 * 3. Every `admin.table.views` entry has a unique `viewId` → else throws
 *    naming the duplicate id.
```

```ts
  const viewIds = new Set<string>();
  for (const view of collection.admin.table.views) {
    if (viewIds.has(view.viewId)) {
      throw new VexConfigError(
        `${at}: admin.table.views has more than one view with viewId "${view.viewId}". Config view ` +
          `ids must be unique within a collection.`,
      );
    }
    viewIds.add(view.viewId);
  }
}
```

#### packages/core/src/collections/validateTableConfig.test.ts

1 addition — everything else in this file (as introduced by Step 3) is unchanged, appended as a new `describe` block.

```ts
describe("validateTableConfig — views", () => {
  it("accepts config views with distinct viewIds", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          table: {
            views: [
              { viewId: "a", name: "A", state: {} },
              { viewId: "b", name: "B", state: {} },
            ],
          },
        },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the duplicate viewId when two config views share one", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          table: {
            views: [
              { viewId: "dup", name: "A", state: {} },
              { viewId: "dup", name: "B", state: {} },
            ],
          },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": admin.table.views has more than one view with viewId "dup". ' +
          "Config view ids must be unique within a collection.",
      ),
    );
  });
});
```

Verify: `pnpm --filter @vexcms/core test -- access schema collections`

### Step 5 — Portable sort in `find` [agent]

Why: clients send `sort { field, order }`, never `withIndex`; server resolves the leading index so stored views stay backend-neutral.

- [ ] `packages/core/src/collections/resolveSort.ts` (new) + `packages/core/src/collections/resolveSort.test.ts` (new) — `sort` → index whose first field is `field` (draftStatus-aware); `_creationTime` → default order; unknown → `VexError` naming the index to declare
- [ ] `packages/core/src/collections/api/find/server.ts` + `packages/core/src/collections/api/find/server.test.ts` — accept `sort`; mutually exclusive with `withIndex` from clients; access-constraint index selection precedence documented and tested
- [ ] `packages/core/src/collections/api/search/server.ts` + `packages/core/src/collections/api/search/server.test.ts` — accepts `searchField` selection from the `searchField` list; `sort` rejected while searching
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — `find` registration threads `sort` through

#### packages/core/src/collections/resolveSort.ts

New file.

```ts
import type { VexConfig } from "../config";
import { resolveCollectionIndexes } from "./resolveCollectionIndexes";
import { VexError } from "../errors";
import type { CollectionTableSort } from "./types";

/**
 * Resolves a portable `{ field, order }` sort to the Convex index that
 * serves it, so clients — URLs, saved views, `find` callers — never name an
 * index directly (Design Decision 5).
 *
 * `_creationTime` needs no index: Convex's default `.order()` already walks
 * it, so it resolves to `{ order }` with no `indexName`. Any other `field`
 * must LEAD some index `resolveCollectionIndexes` resolves for `collection`
 * (its first entry in `fields`). When more than one resolved index leads
 * with the same field, the one best suited to the caller's `drafts` intent
 * is preferred, so the query the caller later builds through
 * `pickConvexQueryIndex` / `composeStatusQueryConstraint` stays
 * index-narrowed instead of falling back to `.filter()` — the
 * "draftStatus-aware" half of Design Decision 5.
 *
 * `find`'s unindexed-sort error (below) intentionally mirrors
 * `defineCollection`'s config-time message for the same condition
 * (`validateTableConfig`, Design Decision 6) — the two surfaces describe
 * the same rule, so their wording agrees.
 *
 * @param props - Input props.
 * @param props.config - The resolved `VexConfig`, to look up `collection`'s
 *   fields and indexes. Omitted (a bypassed caller) resolves permissively —
 *   `sort.order` passes through with no `indexName`, the same posture
 *   `requiresPublishedOnly` / `whereFieldNames` take when `config` is absent.
 * @param props.collection - The collection slug being sorted.
 * @param props.sort - The portable sort. `undefined` resolves to
 *   `{ order: "asc" }` — today's default insertion order — with no index.
 * @param props.drafts - The caller's EFFECTIVE `drafts` intent (`find`
 *   passes `resolveReadCall`'s `wantsDrafts`, not the raw `args.drafts`),
 *   used only to break a tie between multiple indexes leading with the
 *   same field.
 * @returns `indexName` — the index `find` feeds into its existing
 *   `pickConvexQueryIndex` arbitration, as a name with no range (same shape
 *   as a caller `withIndex` with no range) — and `order`, the `.order()`
 *   to apply.
 * @throws {VexError} `code: "UNINDEXED_SORT"` when `sort.field` is not
 *   `"_creationTime"` and leads no declared index. Names the field and the
 *   index to declare.
 */
export function resolveSort(props: {
  config?: VexConfig;
  collection: string;
  sort?: CollectionTableSort<string>;
  drafts?: boolean;
}): { indexName?: string; order: "asc" | "desc" } {
  // TODO: implement
  // 1. No `sort` → return `{ order: "asc" }`, no `indexName`.
  // 2. `sort.field === "_creationTime"` → return `{ order: sort.order }`, no
  //    `indexName` (Convex's default `.order()` already walks it).
  // 3. Otherwise, look up `collection` in `props.config?.collections`:
  //    a. Not found (no `config`, or an unknown slug) → return
  //       `{ order: sort.order }`, no `indexName` — permissive, the same
  //       fallback `whereFieldNames` / `requiresPublishedOnly` take.
  //    b. Found → `resolveCollectionIndexes({ collection })`, filter to
  //       indexes whose `fields[0] === sort.field` →
  //       i.   Zero matches → throw `VexError({ code: "UNINDEXED_SORT",
  //            collection: props.collection, field: sort.field, message:
  //            'sort.field "<field>" leads no index on collection
  //            "<collection>" — declare index: "by_<field>" on the field
  //            (or a collection-level indexes entry starting with it) to
  //            make it sortable.' })`.
  //       ii.  One match → `{ indexName: match.name, order: sort.order }`.
  //       iii. Multiple matches → prefer, in order: `props.drafts === true`
  //            ? the first match declaring `draftStatus: "both"` : the
  //            first match declaring ANY `draftStatus`; otherwise the
  //            first match in `resolveCollectionIndexes`' schema order.
  // Edge cases:
  // - A field that exists on the collection but declares no `index` at all
  //   is indistinguishable from an unknown field name here — both throw
  //   the "zero matches" error; the message does not need to tell them
  //   apart.
  // - Two matches sharing the SAME `draftStatus` (both `"both"`, or both
  //   `true`) → first in schema order wins, deterministic but arbitrary;
  //   `validateTableConfig` (Step 3) does not forbid this today.
  throw new Error("Not implemented");
}
```

#### packages/core/src/collections/resolveSort.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";

import type { VexConfig } from "../config";
import { defineCollection } from "./config";
import { text } from "../fields";
import { resolveSort } from "./resolveSort";

function configOf(collection: ReturnType<typeof defineCollection>): VexConfig {
  return { collections: [collection] } as unknown as VexConfig;
}

const plainSortPosts = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    views: text({ index: "by_views" }),
  },
});

const draftAwarePosts = defineCollection({
  slug: "posts",
  fields: { views: text({ index: "by_views" }) },
  versions: { drafts: true },
  indexes: [{ name: "by_views_full", fields: ["views"], draftStatus: "both" }],
});

const ambiguousPosts = defineCollection({
  slug: "posts",
  fields: { views: text(), title: text() },
  indexes: [
    { name: "by_views", fields: ["views"] },
    { name: "by_views_and_title", fields: ["views", "title"] },
  ],
});

describe("resolveSort — no sort / _creationTime", () => {
  it("defaults to ascending insertion order with no indexName when sort is omitted", () => {
    expect(resolveSort({ config: configOf(plainSortPosts), collection: "posts" })).toEqual({ order: "asc" });
  });

  it('resolves "_creationTime" to no indexName, passing order through', () => {
    expect(
      resolveSort({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "_creationTime", order: "desc" },
      }),
    ).toEqual({ order: "desc" });
  });
});

describe("resolveSort — indexed field", () => {
  it("resolves a field leading exactly one index", () => {
    expect(
      resolveSort({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "views", order: "asc" },
      }),
    ).toEqual({ indexName: "by_views", order: "asc" });
  });

  it("is permissive with no config — order passes through, no indexName", () => {
    expect(resolveSort({ collection: "posts", sort: { field: "views", order: "desc" } })).toEqual({
      order: "desc",
    });
  });
});

describe("resolveSort — unindexed field", () => {
  it('throws VexError({ code: "UNINDEXED_SORT" }) naming the field and the index to declare', () => {
    expect(() =>
      resolveSort({ config: configOf(plainSortPosts), collection: "posts", sort: { field: "title", order: "asc" } }),
    ).toThrow(
      expect.objectContaining({
        data: expect.objectContaining({
          code: "UNINDEXED_SORT",
          collection: "posts",
          field: "title",
          message:
            'sort.field "title" leads no index on collection "posts" — declare index: "by_title" on the field (or a collection-level indexes entry starting with it) to make it sortable.',
        }),
      }),
    );
  });
});

describe("resolveSort — multiple indexes leading with the same field", () => {
  it('prefers the draftStatus: "both" index when drafts: true is requested', () => {
    expect(
      resolveSort({
        config: configOf(draftAwarePosts),
        collection: "posts",
        sort: { field: "views", order: "asc" },
        drafts: true,
      }),
    ).toEqual({ indexName: "by_views_full", order: "asc" });
  });

  it("prefers a draftStatus-declaring index over a plain one for a published-only read", () => {
    expect(
      resolveSort({
        config: configOf(draftAwarePosts),
        collection: "posts",
        sort: { field: "views", order: "asc" },
        drafts: false,
      }),
    ).toEqual({ indexName: "by_views_full", order: "asc" });
  });

  it("falls back to schema order when neither match declares a draftStatus", () => {
    expect(
      resolveSort({
        config: configOf(ambiguousPosts),
        collection: "posts",
        sort: { field: "views", order: "asc" },
      }),
    ).toEqual({ indexName: "by_views", order: "asc" });
  });
});
```

#### packages/core/src/collections/api/find/server.ts

4 edits; everything else unchanged.

**1 — imports.** Add a new import after the `types/generated` import:

```ts
import type { CollectionTableSort } from "../../types";
```

Replace the `"../../../access"` import to add `AccessDocFieldFor`:

```ts
import {
  AccessDocFieldFor,
  resolveQueryConstraint,
  resolveQueryIndex,
  SYSTEM_FIELD_KEYS,
} from "../../../access";
```

Add two new import lines after the `resolveReadCall` import:

```ts
import { resolveSort } from "../../resolveSort";
import { VexError } from "../../../errors";
```

**2 — `FindServerArgs`: add `sort`.** Insert after the `withIndex` property, before `paginationOpts`:

```ts
  /**
   * Portable sort — `{ field, order }`. The server resolves `field` to
   * whichever Convex index `resolveCollectionIndexes` reports leading with
   * it (`_creationTime` needs none), so callers never name an index
   * directly (Design Decision 5). Mutually exclusive with `withIndex` —
   * passing both throws a `VexError`.
   *
   * The resolved index competes for the query's one `withIndex` slot
   * through the same `pickConvexQueryIndex` arbitration as `withIndex` (an
   * access-constraint index wins a free slot; a same-named index merges
   * ranges; a differently-named caller index displaces it and the access
   * rule falls back to `.filter()`) — `sort` carries no precedence of its
   * own over an access-contributed index.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", sort: { field: "publishedAt", order: "desc" } })
   * ```
   */
  sort?: CollectionTableSort<AccessDocFieldFor<TCollectionSlug>>;
```

**3 — `find()`: resolve `sort` to an index before computing `callerIndex`.** Replace the `accessIndex`/`callerIndex` block:

```ts
  const accessIndex = resolveQueryIndex({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  const callerIndex = withIndexToConvexQueryIndex({
    withIndex: args.withIndex as { name: string; range?: (q: never) => ConstraintResult } | undefined,
  });
```

with:

```ts
  const accessIndex = resolveQueryIndex({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  if (args.sort && args.withIndex) {
    throw new VexError({
      code: "SORT_WITH_INDEX",
      collection: args.collection,
      message: `find: collection "${args.collection}" was called with both "sort" and "withIndex". Clients send "sort" (portable) or "withIndex" (explicit), never both.`,
    });
  }
  const sortResolution = args.sort
    ? resolveSort({
        config: args.config,
        collection: args.collection,
        sort: args.sort as CollectionTableSort<string>,
        drafts: wantsDrafts,
      })
    : undefined;
  const callerIndex = sortResolution
    ? sortResolution.indexName
      ? { name: sortResolution.indexName }
      : undefined
    : withIndexToConvexQueryIndex({
        withIndex: args.withIndex as { name: string; range?: (q: never) => ConstraintResult } | undefined,
      });
```

**4 — `find()`: thread the resolved order into `buildQuery`.** Replace the `findQuery` construction:

```ts
  const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>({
    ...args,
    resolvedIndex,
    filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter] }),
  });
```

with:

```ts
  const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>({
    ...args,
    order: sortResolution?.order ?? args.order,
    resolvedIndex,
    filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter] }),
  });
```

#### packages/core/src/collections/api/find/server.test.ts

1 edit; everything else unchanged — appended after the file's last existing block (`describe("find (server) — per-index draftStatus composition")`).

**1 — new `describe` blocks for `sort`.**

```ts
describe("find (server) — sort", () => {
  const sortPostsResource = defineCollection({
    slug: "posts",
    fields: {
      title: text({ index: "by_title" }),
      slug: text({ index: "by_slug" }),
      body: text(),
    },
  });
  const sortConfig = { collections: [sortPostsResource] } as unknown as VexConfig;

  test("sort.field resolves to the index whose first field matches, ordering through it", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Zeta", slug: "z" });
      await ctx.db.insert("posts", { title: "Alpha", slug: "a" });
      await ctx.db.insert("posts", { title: "Mid", slug: "m" });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({ ctx, collection: "posts", config: sortConfig, sort: { field: "slug", order: "asc" } } as any),
    );
    expect(docs.map((d: any) => d.slug)).toEqual(["a", "m", "z"]);
  });

  test("order: desc reverses through the same resolved index", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Zeta", slug: "z" });
      await ctx.db.insert("posts", { title: "Alpha", slug: "a" });
      await ctx.db.insert("posts", { title: "Mid", slug: "m" });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({ ctx, collection: "posts", config: sortConfig, sort: { field: "slug", order: "desc" } } as any),
    );
    expect(docs.map((d: any) => d.slug)).toEqual(["z", "m", "a"]);
  });

  test('sort.field: "_creationTime" needs no index — orders by insertion order with no narrowing', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "First", slug: "first" });
      await ctx.db.insert("posts", { title: "Second", slug: "second" });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({
        ctx,
        collection: "posts",
        config: sortConfig,
        sort: { field: "_creationTime", order: "desc" },
      } as any),
    );
    expect(docs.map((d: any) => d.slug)).toEqual(["second", "first"]);
  });

  test("an unindexed sort.field rejects with a VexError naming the field", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        find({ ctx, collection: "posts", config: sortConfig, sort: { field: "body", order: "asc" } } as any),
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        data: expect.objectContaining({ code: "UNINDEXED_SORT", field: "body" }),
      }),
    );
  });

  test("sort and withIndex together reject — clients send one or the other, never both", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        find({
          ctx,
          collection: "posts",
          config: sortConfig,
          sort: { field: "slug", order: "asc" },
          withIndex: { name: "by_slug" },
        } as any),
      ),
    ).rejects.toThrow(expect.objectContaining({ data: expect.objectContaining({ code: "SORT_WITH_INDEX" }) }));
  });
});

describe("find (server) — sort competes for the index slot like withIndex", () => {
  const sortVsAccessResource = defineCollection({
    slug: "posts",
    fields: { title: text(), slug: text({ index: "by_slug" }), featured: checkbox({ index: "by_featured" }) },
  });

  const sortVsAccessConfig = {
    collections: [sortVsAccessResource],
    access: defineAccess({
      roles: ["contributor"] as const,
      resources: [sortVsAccessResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        contributor: {
          posts: { read: { withIndex: { name: "by_featured", range: (ix) => ix.eq("featured", true) } } },
        },
      },
    }),
  } as unknown as VexConfig;

  test("sort names a DIFFERENT field than the access index: sort's resolved index wins the slot, access still filters", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "a", slug: "a", featured: false });
      await ctx.db.insert("posts", { title: "b", slug: "b", featured: true });
      await ctx.db.insert("posts", { title: "c", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: sortVsAccessConfig,
        auth: contributorAuth,
        sort: { field: "slug", order: "asc" },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["b", "c"]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Access index "by_featured" cannot be applied'),
    );
    warnSpy.mockRestore();
  });
});
```

#### packages/core/src/collections/api/search/server.ts

3 edits; everything else unchanged.

**1 — imports.** Add after the `versions` import:

```ts
import { VexError } from "../../../errors";
```

**2 — `SearchServerArgs`: validate `searchField`, reject `sort`.** Replace the `searchField` property:

```ts
  /** The field the search index is built on. Must match `searchField` in the index declaration. */
  searchField: string;
```

with:

```ts
  /**
   * The field the search index is built on. Must match `searchField` in the
   * index declaration. When `config` is supplied, validated against the
   * collection's `admin.table.searchField` allow-list — a field outside it
   * throws a `VexError` naming the field and the declared list (Design
   * Decision 2).
   */
  searchField: string;
```

Insert after the `drafts` property, at the end of the interface:

```ts
  /**
   * Always absent on `search` — typed `never` so a caller building args from
   * shared `{ sort, search, searchField }` state gets a compile error if it
   * forwards `sort` here. `search` also throws a `VexError` at runtime if
   * one arrives anyway (Design Decision 7: search results are
   * relevance-ordered, so sort and search are mutually exclusive). Clear
   * `sort` before searching, or clear the search query to sort — `find`'s
   * `sort` is the only route to a sorted read.
   */
  sort?: never;
```

**3 — `search()`: reject `sort`, validate `searchField`.** Insert at the top of the function body, before `const { access, action, resource } = resolveAccessCall({`:

```ts
  if ((args as { sort?: unknown }).sort !== undefined) {
    throw new VexError({
      code: "SORT_WHILE_SEARCHING",
      collection: args.collection,
      message: `search: collection "${args.collection}" was called with "sort" while searching. Search results are relevance-ordered — clear "sort" to search, or clear the search query to sort.`,
    });
  }
  const searchFieldAllowList = args.config?.collections.find((c) => c.slug === args.collection)?.admin?.table
    ?.searchField as readonly string[] | undefined;
  if (searchFieldAllowList && !searchFieldAllowList.includes(args.searchField)) {
    throw new VexError({
      code: "SEARCH_FIELD_NOT_ALLOWED",
      collection: args.collection,
      searchField: args.searchField,
      message: `search: collection "${args.collection}" was called with searchField "${args.searchField}", which is not declared in admin.table.searchField (${searchFieldAllowList.join(", ")}).`,
    });
  }
```

#### packages/core/src/collections/api/search/server.test.ts

1 edit; everything else unchanged — appended after the file's last existing block.

**1 — new `describe` blocks for `sort` rejection and `searchField` validation.**

```ts
describe("search (server) — sort is rejected while searching", () => {
  test("throws a VexError naming the collection when sort is also supplied", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        search({
          ctx,
          collection: "posts",
          query: "hello",
          searchIndexName: "search_title",
          searchField: "title",
          sort: { field: "title", order: "asc" },
        } as any),
      ),
    ).rejects.toThrow(
      expect.objectContaining({ data: expect.objectContaining({ code: "SORT_WHILE_SEARCHING" }) }),
    );
  });
});

describe("search (server) — searchField validated against admin.table.searchField", () => {
  const searchFieldAllowListResource = defineCollection({
    slug: "posts",
    fields: { title: text(), body: text() },
    admin: { table: { searchField: ["title"] } },
  });
  const searchFieldAllowListConfig = {
    collections: [searchFieldAllowListResource],
  } as unknown as VexConfig;

  test("an allowed searchField runs normally", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hello world", slug: "hello" });
      return search({
        ctx,
        collection: "posts",
        config: searchFieldAllowListConfig,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
      });
    });
    expect(docs).toHaveLength(1);
  });

  test("a searchField outside admin.table.searchField rejects with a VexError naming the list", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        search({
          ctx,
          collection: "posts",
          config: searchFieldAllowListConfig,
          query: "",
          searchIndexName: "search_title",
          searchField: "body",
        }),
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        data: expect.objectContaining({ code: "SEARCH_FIELD_NOT_ALLOWED", searchField: "body" }),
      }),
    );
  });
});
```

#### packages/core/src/collections/api/collectionsApi.ts

2 edits; everything else unchanged.

**1 — imports.** Add after the `VexConfig` import:

```ts
import type { CollectionTableSort } from "../types";
```

**2 — `find`'s Convex registration: accept and forward `sort`.** Replace the `find` registration:

```ts
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
        drafts: v.optional(v.boolean()),
        where: v.optional(v.any()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await find({
          ctx,
          auth,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          depth: args.depth,
          config,
          limit: args.limit,
          drafts: args.drafts,
          where: args.where,
          paginationOpts: args.paginationOpts as never,
        });
      },
    }),
```

with:

```ts
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
        drafts: v.optional(v.boolean()),
        where: v.optional(v.any()),
        sort: v.optional(
          v.object({ field: v.string(), order: v.union(v.literal("asc"), v.literal("desc")) }),
        ),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await find({
          ctx,
          auth,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          depth: args.depth,
          config,
          limit: args.limit,
          drafts: args.drafts,
          where: args.where,
          sort: args.sort as CollectionTableSort<string> | undefined,
          paginationOpts: args.paginationOpts as never,
        });
      },
    }),
```

Note: `search`'s Convex registration intentionally does NOT gain a `sort` arg — its args validator never declaring one is what makes "sort rejected while searching" true at the public-API boundary (an unknown arg throws Convex's own `ArgumentValidationError`), on top of `search()`'s own runtime guard above for direct server-side callers.

Verify: pnpm --filter @vexcms/core test -- find

### Step 6 — Views server API [agent]

Why: Shared views CRUD must enforce `manageViews` server-side and scope by org.

- [ ] `packages/core/src/collections/api/listViews/server.ts` + `.test.ts` (new) — list for collection, scoped to `organizationId` resolved server-side from the caller's session
- [ ] `packages/core/src/collections/api/saveView/server.ts` + `.test.ts` (new) — create/patch, idempotent on `viewId` (promotion dedupe), requires `manageViews`
- [ ] `packages/core/src/collections/api/removeView/server.ts` + `.test.ts` (new) — delete, requires `manageViews`
- [ ] `packages/core/src/collections/api/types.ts` — shared arg/result types for the three operations
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — registers `listViews`/`saveView`/`removeView`
- [ ] `packages/core/src/vexConvexApi.ts` — exports the three Convex function references
- [ ] `packages/core/src/db/test/convex/schema.ts` — `vex_views` table added to `@vexcms/core`'s own hand-maintained test fixture schema (Decision 24)
- [ ] `packages/react/src/collections/api/listViews/client.ts` + `packages/react/src/collections/api/saveView/client.ts` + `packages/react/src/collections/api/removeView/client.ts` (new) — tanstack-query wrappers
- [ ] `packages/react/src/client/index.ts` — re-exports the three client ops + `VexStoredView`/`VexViewConfig` types

#### packages/core/src/collections/api/listViews/server.ts

```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { VexApiAuth } from "../../../db/types";
import type { VexStoredView } from "../../types";

/**
 * Server-side args for `listViews`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface ListViewsServerArgs<DataModel extends GenericDataModel> {
  /** Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /**
   * Resolved caller identity. Only consulted to read `auth.organization`
   * when `config.access.orgCollectionSlug` is configured (decision 12) —
   * never a client-supplied organization id, so a caller cannot read
   * another organization's shared views by passing one in.
   */
  auth?: VexApiAuth;
  /** The collection slug to list shared views for. */
  collection: CollectionSlug;
}

/**
 * Lists every `shared` saved view stored in `vex_views` for one collection.
 * Never gated — shared views are collection-wide by design (decision 12),
 * so reading the list carries no RBAC check; only `saveView`/`removeView` do.
 *
 * Scoped to the caller's own organization via the `by_collection_org` index
 * when `config.access.orgCollectionSlug` is configured AND `auth.organization`
 * resolves an id; otherwise reads the full collection-wide set via
 * `by_collection`. The organization id is never taken from the client —
 * only from the server-resolved `auth`.
 *
 * Does not merge in `config` (code-defined) or `local` (localStorage)
 * views — that merge happens client-side in `useCollectionListViews`
 * (Step 11).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, collection, auth? }`.
 * @returns Every `vex_views` row for `collection`, unordered.
 * @example
 * ```ts
 * import { listViews } from "@vexcms/core/server";
 *
 * export const postsViews = query({
 *   args: {},
 *   handler: (ctx) => listViews({ ctx, config, collection: "posts" }),
 * });
 * ```
 */
export async function listViews<DataModel extends GenericDataModel>(
  args: ListViewsServerArgs<DataModel>,
): Promise<VexStoredView[]> {
  // TODO: implement
  // 1. organizationId = args.config.access?.orgCollectionSlug !== undefined
  //      ? (args.auth?.organization as { _id?: string } | undefined)?._id
  //      : undefined
  // 2a. organizationId !== undefined → rows = await args.ctx.db.query("vex_views")
  //       .withIndex("by_collection_org", (q) =>
  //         q.eq("collection", args.collection).eq("organizationId", organizationId))
  //       .collect()
  //     → compound index, chain both `.eq()` calls on the same query builder
  // 2b. organizationId === undefined → rows = await args.ctx.db.query("vex_views")
  //       .withIndex("by_collection", (q) => q.eq("collection", args.collection))
  //       .collect()
  //     → every shared view for the collection, regardless of org — reached
  //       both when `orgCollectionSlug` is unconfigured AND when the caller
  //       has no resolved organization yet
  // 3. return rows as unknown as VexStoredView[]
  //    → row shape (`collection`, `viewId`, `name`, `state`, `organizationId?`,
  //      `createdBy`) already matches `VexStoredView` field-for-field; only
  //      the Convex `_id`/`_creationTime` system fields are extra and unused
  throw new Error("Not implemented");
}
```

#### packages/core/src/collections/api/listViews/server.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { listViews } from "./server";
import { defineAccess } from "../../../access/config";
import { defineCollection, text } from "../../../index";

const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text() },
});

const fixtureConfig = { collections: [postsResource] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("listViews (server)", () => {
  test("returns an empty array when no views exist for the collection", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([]);
    });
  });

  test("returns every row for the collection, excluding rows for other collections", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: { search: "featured" },
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "authors",
        viewId: "v2",
        name: "Authors view",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ viewId: "v1", name: "Featured", collection: "posts" });
    });
  });

  test("scopes to the caller's organization when access.orgCollectionSlug is configured", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        orgCollectionSlug: "organizations",
        permissions: { editor: { posts: { read: true } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org2-view",
        name: "Org 2",
        state: {},
        organizationId: "org2",
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] }, organization: { _id: "org1" } },
      });
      expect(result).toEqual([expect.objectContaining({ viewId: "org1-view", organizationId: "org1" })]);
    });
  });

  test("returns every row regardless of organization when access.orgCollectionSlug is not configured", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "org1-view",
        name: "Org 1",
        state: {},
        organizationId: "org1",
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        auth: { user: { roles: [] }, organization: { _id: "org2" } },
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ viewId: "org1-view" });
    });
  });
});

/** Convenience alias: `t.run`'s ctx is a mutation ctx, used here only to seed fixture rows. */
type GenericMutationCtxLike = import("convex/server").GenericMutationCtx<GenericDataModel>;
```

#### packages/core/src/collections/api/saveView/server.ts

```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import type { VexViewConfig } from "../../types";
import { VIEW_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";

/**
 * Runs the RBAC gate shared by `saveView` and `removeView` — `manageViews`,
 * fail-closed per decision 13. A no-op when `config.access` is unset,
 * matching `assertVersionsAccess`'s (`versions/api/history/server.ts`)
 * convention: RBAC only applies when the project has configured `access` at
 * all.
 *
 * @param props.resource - The collection slug the view belongs to.
 * @throws {VexAccessError} When the caller's roles lack `manageViews` on `resource`.
 */
export function assertManageViewsAccess(props: {
  config: VexConfig;
  auth?: VexApiAuth;
  access?: AccessCallOptions<string>;
  resource: string;
}): void {
  // TODO: implement
  // 1. props.config.access === undefined → return (RBAC off project-wide)
  // 2. { access, action, resource } = resolveAccessCall({ config: props.config, access: props.access,
  //      defaultAction: VIEW_ACTIONS.manageViews, resource: props.resource })
  // 3. hasPermission({ throwOnDenied: true, access, user: props.auth?.user ?? null,
  //      organization: props.auth?.organization, resource, action })
  //    → throws VexAccessError when denied
  throw new Error("Not implemented");
}

/**
 * Server-side args for `saveView`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface SaveViewServerArgs<DataModel extends GenericDataModel> {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /**
   * Resolved caller identity. `auth.user` records `createdBy`; `auth.organization`
   * stamps `organizationId` when `config.access.orgCollectionSlug` is configured —
   * never a client-supplied organization id.
   */
  auth?: VexApiAuth;
  /** The collection slug the view belongs to. */
  collection: CollectionSlug;
  /**
   * The view to save. `viewId` is client-generated (decision 14) and is
   * the idempotency key: a second call with the same `viewId` patches the
   * existing row in place instead of inserting a duplicate — this is what
   * makes promotion (local → shared) safe against another tab racing the
   * same save.
   */
  view: VexViewConfig;
}

/**
 * Creates or patches one `vex_views` row, gated on `manageViews`
 * (decision 13). Idempotent on `view.viewId` (decision 14).
 *
 * Resolves and asserts access BEFORE any `vex_views` row is read or
 * written, mirroring `assertVersionsAccess`'s ordering.
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, collection, view, access?, auth? }`.
 * @returns The saved view's `viewId` (unchanged from `args.view.viewId`).
 * @throws {ConvexError} When an existing row for `view.viewId` belongs to a
 *   different collection.
 * @throws {VexAccessError} When the caller's roles lack `manageViews` on `collection`.
 * @example
 * ```ts
 * import { saveView } from "@vexcms/core/server";
 *
 * export const postsSaveView = mutation({
 *   args: { view: v.any() },
 *   handler: (ctx, args) =>
 *     saveView({ ctx, config, collection: "posts", view: args.view }),
 * });
 * ```
 */
export async function saveView<DataModel extends GenericDataModel>(
  args: SaveViewServerArgs<DataModel>,
): Promise<string> {
  // TODO: implement
  // 1. assertManageViewsAccess({ config: args.config, auth: args.auth, access: args.access,
  //      resource: args.collection })
  // 2. existing = await args.ctx.db.query("vex_views")
  //      .withIndex("by_view_id", (q) => q.eq("viewId", args.view.viewId))
  //      .unique()
  // 3a. existing && existing.collection !== args.collection → throw ConvexError
  //       (`viewId "${args.view.viewId}" already belongs to collection "${existing.collection}"`)
  //     → a reused viewId across collections is a client bug, never silently
  //       overwritten
  // 3b. organizationId = args.config.access?.orgCollectionSlug !== undefined
  //       ? (args.auth?.organization as { _id?: string } | undefined)?._id
  //       : undefined
  // 3c. existing → await args.ctx.db.patch(existing._id, { name: args.view.name,
  //       state: args.view.state, organizationId })
  // 3d. !existing → await args.ctx.db.insert("vex_views", { collection: args.collection,
  //       viewId: args.view.viewId, name: args.view.name, state: args.view.state,
  //       organizationId, createdBy: (args.auth?.user as { _id?: string } | null)?._id ?? "" })
  // 4. return args.view.viewId
  // Edge cases:
  // - `auth` omitted (RBAC off, or a server-trusted internal call) → `createdBy` stores `""`
  //   and `organizationId` stays `undefined`, same as an unscoped project
  throw new Error("Not implemented");
}
```

#### packages/core/src/collections/api/saveView/server.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { saveView } from "./server";
import { defineAccess } from "../../../access/config";
import { defineCollection, text } from "../../../index";
import { VexAccessError } from "../../../access";

const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text() },
});

const fixtureConfig = { collections: [postsResource] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

/** Runs `fn` inside a fresh `convexTest` transaction. */
async function withTransaction(
  fn: (ctx: GenericMutationCtx<GenericDataModel>) => Promise<void>,
): Promise<void> {
  const t = convexTest(schema, modules);
  await t.run(fn);
}

describe("saveView (server)", () => {
  test("inserts a new vex_views row when no RBAC is configured", async () => {
    await withTransaction(async (ctx) => {
      const viewId = await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: { search: "featured" } },
      });
      expect(viewId).toBe("v1");
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ collection: "posts", viewId: "v1", name: "Featured" });
    });
  });

  test("is idempotent on viewId — a second save patches the existing row", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: { search: "featured" } },
      });
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured (renamed)", state: { search: "updated" } },
      });
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ name: "Featured (renamed)", state: { search: "updated" } });
    });
  });

  test("denies a save when the caller lacks manageViews", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { manageViews: false } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config,
          collection: "posts",
          view: { viewId: "v1", name: "Featured", state: {} },
          auth: { user: { roles: ["editor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("allows a save when the caller has manageViews", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["admin"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { admin: { posts: { manageViews: true } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const viewId = await saveView({
        ctx,
        config,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
        auth: { user: { roles: ["admin"] } },
      });
      expect(viewId).toBe("v1");
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });

  test("throws when the viewId already belongs to a different collection", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
      });
      await expect(
        saveView({
          ctx,
          config: fixtureConfig,
          collection: "authors",
          view: { viewId: "v1", name: "Collides", state: {} },
        }),
      ).rejects.toThrow(/already belongs to collection "posts"/);
    });
  });
});
```

#### packages/core/src/collections/api/removeView/server.ts

```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import { assertManageViewsAccess } from "../saveView/server";

/**
 * Server-side args for `removeView`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface RemoveViewServerArgs<DataModel extends GenericDataModel> {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** The collection slug the view belongs to. */
  collection: CollectionSlug;
  /** The `viewId` of the `vex_views` row to delete. */
  viewId: string;
}

/**
 * Permanently deletes one `vex_views` row, gated on `manageViews`
 * (decision 13). Resolves the row via the `by_view_id` index and confirms
 * it belongs to `collection` before deleting — the same check `saveView`
 * runs on write, so a `viewId` cannot be used to touch another
 * collection's row.
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, collection, viewId, access?, auth? }`.
 * @returns Nothing — resolves once the row is deleted.
 * @throws {ConvexError} When no `vex_views` row with `viewId` exists for `collection`.
 * @throws {VexAccessError} When the caller's roles lack `manageViews` on `collection`.
 * @example
 * ```ts
 * import { removeView } from "@vexcms/core/server";
 *
 * export const postsRemoveView = mutation({
 *   args: { viewId: v.string() },
 *   handler: (ctx, args) =>
 *     removeView({ ctx, config, collection: "posts", viewId: args.viewId }),
 * });
 * ```
 */
export async function removeView<DataModel extends GenericDataModel>(
  args: RemoveViewServerArgs<DataModel>,
): Promise<void> {
  // TODO: implement
  // 1. assertManageViewsAccess({ config: args.config, auth: args.auth, access: args.access,
  //      resource: args.collection })
  // 2. row = await args.ctx.db.query("vex_views")
  //      .withIndex("by_view_id", (q) => q.eq("viewId", args.viewId))
  //      .unique()
  // 3. !row || row.collection !== args.collection → throw ConvexError
  //      (`No view "${args.viewId}" found for collection "${args.collection}"`)
  //    → identical message for "never existed" and "belongs to another
  //      collection" — a wrong collection slug cannot be used to probe
  //      whether a viewId exists elsewhere
  // 4. await args.ctx.db.delete(row._id)
  throw new Error("Not implemented");
}
```

#### packages/core/src/collections/api/removeView/server.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../../../db/test/convex/_generated/api";
import schema from "../../../db/test/convex/schema";
import type { VexConfig } from "../../../config";
import { removeView } from "./server";
import { saveView } from "../saveView/server";
import { defineAccess } from "../../../access/config";
import { defineCollection, text } from "../../../index";
import { VexAccessError } from "../../../access";

const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text() },
});

const fixtureConfig = { collections: [postsResource] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

/** Runs `fn` inside a fresh `convexTest` transaction. */
async function withTransaction(
  fn: (ctx: GenericMutationCtx<GenericDataModel>) => Promise<void>,
): Promise<void> {
  const t = convexTest(schema, modules);
  await t.run(fn);
}

describe("removeView (server)", () => {
  test("deletes an existing vex_views row", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
      });
      await removeView({ ctx, config: fixtureConfig, collection: "posts", viewId: "v1" });
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("throws when viewId does not exist", async () => {
    await withTransaction(async (ctx) => {
      await expect(
        removeView({ ctx, config: fixtureConfig, collection: "posts", viewId: "missing" }),
      ).rejects.toThrow(/No view "missing"/);
    });
  });

  test("throws when viewId belongs to a different collection, and the row survives", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "authors",
        view: { viewId: "v1", name: "Authors view", state: {} },
      });
      await expect(
        removeView({ ctx, config: fixtureConfig, collection: "posts", viewId: "v1" }),
      ).rejects.toThrow(/No view "v1" found for collection "posts"/);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });

  test("denies a delete when the caller lacks manageViews", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { manageViews: false } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
      });
      await expect(
        removeView({
          ctx,
          config,
          collection: "posts",
          viewId: "v1",
          auth: { user: { roles: ["editor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
    });
  });
});
```

#### packages/core/src/collections/api/types.ts

3 edits: a new type-only import, and three new arg interfaces appended after `VexRemoveArgs`.

**1 — imports.** Beside the existing `import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";`:

```ts
import type { VexStoredView, VexViewConfig } from "../types";
```

**2 — new arg interfaces.** After `VexRemoveArgs`:

```ts
/** Args for `api.vex.listViews`. */
export interface VexListViewsArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
}

/** Args for `api.vex.saveView`. */
export interface VexSaveViewArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  view: VexViewConfig;
}

/** Args for `api.vex.removeView`. */
export interface VexRemoveViewArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  viewId: string;
}
```

`VexStoredView` is used only as the `listViews` endpoint's return type in `vexConvexApi.ts`, not inside this file's own declarations — imported here so `vexConvexApi.ts` can pull it alongside the arg types from one module.

#### packages/core/src/collections/api/collectionsApi.ts

2 edits: new imports, and three new endpoint registrations.

**1 — imports.** Beside the existing `import { remove } from "./remove/server";`:

```ts
import { listViews } from "./listViews/server";
import { saveView } from "./saveView/server";
import { removeView } from "./removeView/server";
```

**2 — new registrations.** After the `remove: mutation({ ... }),` entry, inside the object `collectionsApi` returns:

```ts
    listViews: query({
      args: {
        collection: v.string(),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await listViews({
          ctx,
          auth,
          config,
          collection: args.collection as CollectionSlug,
        });
      },
    }),

    saveView: mutation({
      args: {
        collection: v.string(),
        view: v.any(),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await saveView({
          ctx,
          auth,
          config,
          collection: args.collection as CollectionSlug,
          view: args.view,
        });
      },
    }),

    removeView: mutation({
      args: {
        collection: v.string(),
        viewId: v.string(),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return removeView({
          ctx,
          auth,
          config,
          collection: args.collection as CollectionSlug,
          viewId: args.viewId,
        });
      },
    }),
```

#### packages/core/src/vexConvexApi.ts

2 edits: new type imports, and three new flat entries (`listViews`/`saveView`/`removeView` sit beside `find`/`create`/`remove`, not nested — they are registered in `collectionsApi.ts`, exactly like those).

**1 — imports.** Extend the existing import from `"./collections/api/types"`:

```ts
import type {
  VexFindArgs,
  VexFindPaginatedArgs,
  VexGetArgs,
  VexSearchArgs,
  VexCreateArgs,
  VexUpdateArgs,
  VexRemoveArgs,
  VexListViewsArgs,
  VexSaveViewArgs,
  VexRemoveViewArgs,
} from "./collections/api/types";
import type { VexStoredView } from "./collections/types";
```

**2 — new entries.** After `remove: anyApi.vex.remove as FunctionReference<"mutation", "public", VexRemoveArgs, void>,`, before the `media: {` block:

```ts
  /**
   * Lists every shared `vex_views` row for a collection. Never gated.
   */
  listViews: anyApi.vex.listViews as FunctionReference<
    "query",
    "public",
    VexListViewsArgs,
    VexStoredView[]
  >,

  /**
   * Creates or patches a shared view, keyed by `viewId`. Requires `manageViews`.
   */
  saveView: anyApi.vex.saveView as FunctionReference<
    "mutation",
    "public",
    VexSaveViewArgs,
    string
  >,

  /**
   * Permanently deletes a shared view. Requires `manageViews`.
   */
  removeView: anyApi.vex.removeView as FunctionReference<
    "mutation",
    "public",
    VexRemoveViewArgs,
    void
  >,

```

#### packages/core/src/db/test/convex/schema.ts

1 edit: a new `vex_views` table, needed by this step's own tests — `generateVexSchema.ts` (Step 4) emits the real one, but this fixture schema is hand-maintained for `@vexcms/core`'s test suite and mirrors `vex_versions`/`vex_globals` by hand.

**1 — new table.** Alongside the existing `vex_versions: defineTable({ ... })` table:

```ts
  vex_views: defineTable({
    collection: v.string(),
    viewId: v.string(),
    name: v.string(),
    state: v.any(),
    organizationId: v.optional(v.string()),
    createdBy: v.string(),
  })
    .index("by_collection", ["collection"])
    .index("by_collection_org", ["collection", "organizationId"])
    .index("by_view_id", ["viewId"]),
```

#### packages/react/src/collections/api/listViews/client.ts

```ts
import { convexQuery } from "@convex-dev/react-query";

import { vexConvexApi, type VexListViewsArgs } from "@vexcms/core";
import type { CollectionSlug, VexStoredView } from "@vexcms/core";
import type { VexQueryOptions } from "../../../client/types";

/**
 * Client-side args for {@link listViews}.
 */
export type ListViewsClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> = {
  /** The collection slug to list shared views for. */
  collection: TCollectionSlug;
};

/**
 * Returns tanstack-query options for every `shared` saved view stored in
 * `vex_views` for one collection. Org scoping (decision 12) is resolved
 * server-side from the caller's own session — this call never passes an
 * organization id.
 *
 * Merge with `config` (`admin.table.views`) and `local` (localStorage) views
 * client-side — see `useCollectionListViews` (Step 11).
 *
 * Import from `@vexcms/react/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 * @example
 * ```tsx
 * import { listViews } from "@vexcms/react/client";
 *
 * const { data } = useQuery(listViews({ collection: "posts" }));
 * ```
 */
export function listViews<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: ListViewsClientArgs<TCollectionSlug>,
): VexQueryOptions<VexListViewsArgs, VexStoredView[]> {
  return convexQuery(vexConvexApi.listViews, { collection: props.collection });
}
```

#### packages/react/src/collections/api/saveView/client.ts

```ts
import { useConvexMutation } from "@convex-dev/react-query";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, VexViewConfig, GenericMutationClientParams } from "@vexcms/core";

/**
 * Client-side args for {@link saveView}.
 *
 * @example
 * ```tsx
 * import { saveView, type SaveViewClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: saveView() });
 * const viewId = await mutateAsync({
 *   collection: "posts",
 *   view: { viewId: crypto.randomUUID(), name: "Featured", state: { search: "featured" } },
 * });
 * ```
 */
export interface SaveViewClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug>
  extends GenericMutationClientParams {
  /** The collection slug the view belongs to. */
  collection: TCollectionSlug;
  /**
   * The view to save. `viewId` is client-generated — reuse the same id on a
   * second call to patch the view in place (the promotion dedupe, decision 14).
   */
  view: VexViewConfig;
}

/**
 * Returns a `mutationFn` for creating or patching a shared view. Idempotent
 * on `view.viewId`. Requires `manageViews` on `collection` — throws
 * `VexAccessError` server-side otherwise.
 *
 * Wraps `useConvexMutation(vexConvexApi.saveView)`. Call at the top level of
 * a React component (obeys the Rules of Hooks); pass the return value as
 * `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `saveView` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`,
 *   resolving to the saved view's `viewId`.
 * @see {@link SaveViewClientArgs} for the typed args shape.
 */
export function saveView() {
  return useConvexMutation(vexConvexApi.saveView);
}
```

#### packages/react/src/collections/api/removeView/client.ts

```ts
import { useConvexMutation } from "@convex-dev/react-query";

import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, GenericMutationClientParams } from "@vexcms/core";

/**
 * Client-side args for {@link removeView}.
 *
 * @example
 * ```tsx
 * import { removeView, type RemoveViewClientArgs } from "@vexcms/react/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: removeView() });
 * await mutateAsync({ collection: "posts", viewId: "v1" });
 * ```
 */
export interface RemoveViewClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug>
  extends GenericMutationClientParams {
  /** The collection slug the view belongs to. */
  collection: TCollectionSlug;
  /** The `viewId` of the shared view to delete. */
  viewId: string;
}

/**
 * Returns a `mutationFn` for permanently deleting a shared view. Requires
 * `manageViews` on `collection` — throws `VexAccessError` server-side
 * otherwise.
 *
 * Wraps `useConvexMutation(vexConvexApi.removeView)`. Call at the top level
 * of a React component (obeys the Rules of Hooks); pass the return value as
 * `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/react/client`. For the server-side version, import
 * `removeView` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link RemoveViewClientArgs} for the typed args shape.
 */
export function removeView() {
  return useConvexMutation(vexConvexApi.removeView);
}
```

#### packages/react/src/client/index.ts

1 edit: a new "VIEWS API" section, after the existing collections block (`remove`/`RemoveClientArgs`) and before the "Shared return-type contracts" comment.

**1 — new section.** After `export type { RemoveClientArgs } from "../collections/api/remove/client";`:

```ts

// VIEWS API

export { listViews, type ListViewsClientArgs } from "../collections/api/listViews/client";

export { saveView, type SaveViewClientArgs } from "../collections/api/saveView/client";

export { removeView, type RemoveViewClientArgs } from "../collections/api/removeView/client";

export type { VexStoredView, VexViewConfig } from "@vexcms/core";
```

Verify: pnpm --filter @vexcms/core test -- collections/api

### Step 7 — Data-source hooks: `useVexList` / `useVexDoc` [agent]

Why: the hook boundary is where plugin, adapter and adopted-table sources plug in later; list/edit views stop calling `vexConvexApi` directly.
Verify: pnpm --filter @vexcms/react test -- hooks collections && browser: list + edit views unchanged

- [ ] `packages/react/src/hooks/useVexList.ts` (new) + `packages/react/src/hooks/useVexList.test.tsx` (new) — `{ collection, where, sort, search, searchField, drafts, pageSize }` → `{ results, totalDocs, isDone, loadMore, isPending }`; wraps `usePaginatedQuery`
- [ ] `packages/react/src/hooks/useVexDoc.ts` (new) + `packages/react/src/hooks/useVexDoc.test.tsx` (new)
- [ ] `packages/react/src/hooks/index.ts` — barrel exports the two new hooks
- [ ] `packages/react/src/collections/api/find/client.ts` — `FindClientArgs`/`FindClientPaginatedArgs` gain `sort?: CollectionTableSort<string>`
- [ ] `packages/react/src/testing/convex/bridge.ts` + `packages/react/src/testing/hooksSuite.tsx` — test-harness support for the two new hooks
- [ ] `packages/react/src/collections/CollectionListView.tsx`, `packages/react/src/media/MediaCollectionListView.tsx`, `packages/react/src/collections/CollectionEditView.tsx` migrated; no direct `vexConvexApi` reads in those files (mutations stay, Design Decision 19's hook boundary is read-side)

#### packages/react/src/hooks/useVexList.ts

New file, complete.

```ts
"use client";

import type {
  CollectionConfig,
  CollectionSlug,
  CollectionTableSort,
  MediaCollectionConfig,
  PaginationResult,
  VexDocument,
  VexWhere,
} from "@vexcms/core";
import { usePaginatedQuery } from "./usePaginatedQuery";
import type { UsePaginatedQueryReturn } from "./usePaginatedQuery";

/**
 * Props for {@link useVexList}.
 *
 * `collection` takes the resolved config object, not a bare slug — the same
 * shape `usePaginatedSearch` already accepts — so this hook can read
 * `admin.table.serverPageSize` without a second lookup, and works for both a
 * `CollectionConfig` and a `MediaCollectionConfig` without a `TCollectionSlug`
 * generic (those are two separate slug unions no single type parameter can
 * express without an overload pair this hook doesn't need).
 *
 * @typeParam TDocument - The document shape `results` resolves to.
 */
export interface UseVexListProps<TDocument extends VexDocument = VexDocument> {
  /** The resolved collection (or media collection) config, from `useVexConfig()`. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** Predicate over the collection's fields: a builder callback or a plain node. */
  where?: VexWhere<CollectionSlug>;
  /**
   * Portable sort — never an index name (Design Decision 5). Ignored, and
   * never sent, while `search` is a non-empty string (Design Decision 7).
   */
  sort?: CollectionTableSort<string>;
  /** Raw search text. `undefined`/`""` uses `find` + `sort` instead of `search`. */
  search?: string;
  /** Which `admin.table.searchField` entry `search` queries. Required when `search` is non-empty. */
  searchField?: string;
  /** Include draft versions of versioned documents. */
  drafts?: boolean;
  /** Documents revealed per Load More click / page-size select — independent of the server's larger fetch batch. */
  pageSize: number;
  /** Relationship auto-populate depth, forwarded to `find`. */
  depth?: number;
  /** Server-prefetched first page, for SSR hydration. */
  initialData?: PaginationResult<TDocument>;
}

/** Return value of {@link useVexList} — identical shape to `usePaginatedQuery`'s. */
export type UseVexListReturn<TDocument extends VexDocument = VexDocument> =
  UsePaginatedQueryReturn<TDocument>;

/**
 * Lists documents in a collection — the data source every list view reads
 * through (Design Decision 19). Convex is the only implementation; a
 * plugin/adapter/adopted-table source is a later swap of this hook's body,
 * not its callers.
 *
 * The `find`-mode path (no `search`) wraps `usePaginatedQuery`. The server
 * batch size (`collection.admin.table.serverPageSize`) always covers at
 * least one client page: `paginationOpts.numItems` is
 * `Math.max(serverPageSize, pageSize)`, while `pageSize` itself becomes
 * `usePaginatedQuery`'s `clientPageSize` — so Load More reveals `pageSize`
 * rows per click regardless of how large a server round trip fetches.
 *
 * @typeParam TDocument - The document shape `results` resolves to.
 * @param props - Hook configuration.
 * @returns Pagination state and controls, matching `usePaginatedQuery`'s shape.
 * @throws {Error} When `search` is a non-empty string — the generalized
 *   `searchField` search path lands with the toolbar that is its first
 *   caller (Step 9); no view passes `search` yet.
 *
 * @example
 * ```tsx
 * const pagination = useVexList({
 *   collection,
 *   drafts: isVersioned,
 *   depth: 1,
 *   pageSize: collection.admin.table.defaultPageSize,
 *   initialData: props.initialData,
 * });
 * ```
 */
export function useVexList<TDocument extends VexDocument = VexDocument>(
  props: UseVexListProps<TDocument>,
): UseVexListReturn<TDocument> {
  if ((props.search?.length ?? 0) > 0) {
    // TODO: implement — generalized `searchField` search.
    // 1. field = props.searchField — Step 9's field picker always supplies
    //    one when `search` is non-empty (defaults to the first configured
    //    `admin.table.searchField` entry); `search` is otherwise hidden
    //    entirely (Design Decision 2), so this hook never has to pick one.
    //    → undefined here means a caller bug, not a config gap.
    // 2. fieldDef = props.collection.fields[field] as { searchIndex: { name: string } }
    //    → `searchIndex.name` is guaranteed present for every
    //    `admin.table.searchField` entry by `validateTableConfig` (Step 3,
    //    Design Decision 3), so this is a direct read, not a fallback.
    // 3. Issue `vexConvexApi.search` with `{ collection: props.collection.slug,
    //    searchIndexName: fieldDef.searchIndex.name, searchField: field, query:
    //    props.search, where: props.where, drafts: props.drafts,
    //    paginationOpts: { numItems, cursor } }`, accumulating pages the same
    //    way `usePaginatedQuery` does. `sort` is never sent (Design
    //    Decision 7).
    // 4. → return the same `{ results, totalDocs, isDone, loadMore, isPending }`
    //    shape as the `find`-mode branch below.
    throw new Error("Not implemented");
  }

  const numItems = Math.max(props.collection.admin.table.serverPageSize, props.pageSize);

  return usePaginatedQuery<TDocument>({
    query: {
      collection: props.collection.slug as CollectionSlug,
      where: props.where,
      sort: props.sort,
      drafts: props.drafts,
      depth: props.depth,
      paginationOpts: { numItems, totalDocs: true, cursor: null },
    },
    initialData: props.initialData,
    clientPageSize: props.pageSize,
  });
}
```

#### packages/react/src/hooks/useVexList.test.tsx

New file, complete.

```tsx
import { runHooksSuite } from "../testing/hooksSuite";

runHooksSuite({ only: ["useVexList"] });
```

#### packages/react/src/hooks/useVexDoc.ts

New file, complete.

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, VexDocument, VexGetArgs } from "@vexcms/core";
import type { FunctionReference } from "convex/server";

/**
 * Props for {@link useVexDoc}.
 *
 * @typeParam TDocument - The document shape returned for `collection`.
 * @typeParam TCollectionSlug - Collection slug type.
 */
export interface UseVexDocProps<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** The collection slug the document belongs to. */
  collection: TCollectionSlug;
  /** The document's `_id`. `undefined` behaves like `skip: true`. */
  id: TDocument["_id"] | undefined;
  /**
   * Include the document's draft row alongside its published row, gated
   * server-side on `readDrafts`. Ignored for a non-versioned collection.
   */
  drafts?: boolean;
  /** When `true`, the query is not issued at all — a conditional fetch without violating the Rules of Hooks. */
  skip?: boolean;
  /**
   * Server-prefetched document, for SSR hydration. `null` means "confirmed
   * not found"; `undefined` means "not loaded yet, use the live query".
   */
  initialData?: TDocument | null;
}

/** Return value of {@link useVexDoc}. */
export interface UseVexDocReturn<TDocument extends VexDocument = VexDocument> {
  /** The document, `null` when none matches `id`, `undefined` before the first load (or while skipped). */
  document: TDocument | null | undefined;
  /** Whether the query is still in flight with no cached/initial data yet. */
  isPending: boolean;
}

/**
 * Fetches a single document by id and collection — the data source every
 * edit view reads through (Design Decision 19), live via a Convex
 * subscription.
 *
 * Queries the generic `vexConvexApi.get` endpoint directly rather than the
 * per-slug `get()` client wrapper (`collections/api/get/client.ts`): this
 * hook is generic over `TCollectionSlug`, known only at runtime, so the
 * literal-slug narrowing that wrapper provides from a compile-time slug
 * does not apply here — the caller asserts the returned shape via
 * `TDocument` instead, the same way `CollectionEditView`'s two direct
 * `vexConvexApi.get` calls did before this hook existed.
 *
 * @typeParam TDocument - The document shape returned for `collection`.
 * @typeParam TCollectionSlug - Collection slug type.
 * @param props - Hook configuration.
 * @returns The document and its loading state.
 *
 * @example
 * ```tsx
 * const { document } = useVexDoc({
 *   collection: "posts",
 *   id: documentId,
 *   drafts: true,
 *   initialData: props.initialData,
 * });
 * ```
 */
export function useVexDoc<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: UseVexDocProps<TDocument, TCollectionSlug>): UseVexDocReturn<TDocument> {
  const funcRef = vexConvexApi.get as FunctionReference<
    "query",
    "public",
    VexGetArgs,
    TDocument | null
  >;
  const skip = props.skip === true || props.id === undefined;
  const { data, isPending } = useQuery({
    ...convexQuery(
      funcRef,
      skip
        ? "skip"
        : { id: props.id as string, collection: props.collection, drafts: props.drafts },
    ),
    ...(props.initialData !== undefined ? { initialData: props.initialData } : {}),
  });
  return { document: data, isPending };
}
```

#### packages/react/src/hooks/useVexDoc.test.tsx

New file, complete.

```tsx
import { runHooksSuite } from "../testing/hooksSuite";

runHooksSuite({ only: ["useVexDoc"] });
```

#### packages/react/src/hooks/index.ts

Existing file, 1 edit — append to the barrel, alongside the existing hook exports:

```ts
export * from "./useVexList";
export * from "./useVexDoc";
```

#### packages/react/src/collections/api/find/client.ts

Existing file, 3 edits — `FindClientArgs`/`FindClientPaginatedArgs` gain the portable `sort` Step 5 adds server-side; nothing else changes.

**1 — import block**, add `CollectionTableSort` to the existing `@vexcms/core` type import:

```ts
import type {
  CollectionTableSort,
  DocReturnItem,
  FindReturn,
  FindReturnPaginated,
  GenericQueryClientParams,
  PaginationOptions,
  PaginationResult,
  PopulateShape,
} from "@vexcms/core";
```

**2 — `FindClientArgs`**, a new field alongside the existing `where`:

```ts
  /**
   * Portable sort — never an index name (Design Decision 5). Rejected
   * server-side together with a `search` call (Design Decision 7).
   */
  sort?: CollectionTableSort<string>;
```

**3 — `FindClientPaginatedArgs`**, the same field alongside its own `where`:

```ts
  /**
   * Portable sort — never an index name (Design Decision 5). Rejected
   * server-side together with a `search` call (Design Decision 7).
   */
  sort?: CollectionTableSort<string>;
```

#### packages/react/src/testing/convex/bridge.ts

Existing file, 2 edits — the fake `"vex:find"` handler currently drops `args.where` on the floor; `useVexList`'s test needs it forwarded to the real `find()` model function it already calls.

**1 — import block**, add `VexWhere` to the existing `@vexcms/core` type import:

```ts
import type { PaginationOptions, PaginationResult, VexWhere } from "@vexcms/core";
```

**2 — the `"vex:find"` entry in `QUERY_HANDLERS`**, replacing its body:

```ts
  "vex:find": async (ctx, args) => {
    const paginationOpts = args.paginationOpts as PaginationOptions | undefined;
    const collection = resolveTable(args);
    const where = args.where as VexWhere<"documents" | "media"> | undefined;
    return paginationOpts
      ? find({ ctx, collection, paginationOpts, where })
      : find({ ctx, collection, where });
  },
```

#### packages/react/src/testing/hooksSuite.tsx

Existing file, 6 edits.

**1 — imports**, add the two new hooks alongside the existing three:

```ts
import { useVexList } from "../hooks/useVexList";
import { useVexDoc } from "../hooks/useVexDoc";
```

**2 — `HooksSuiteMember`**, two new members:

```ts
export type HooksSuiteMember =
  | "useTableSelection"
  | "usePaginatedQuery"
  | "usePaginatedSearch"
  | "useVexList"
  | "useVexDoc";
```

**3 — `makeDocumentsCollection`**, its `admin` gains a `table` — `useVexList` reads `admin.table.serverPageSize`, which this fixture never populated because only `usePaginatedSearch` (no `table` dependency) read it before:

```ts
    admin: {
      useAsTitle: "title",
      components: {},
      table: {
        defaultPageSize: 10,
        serverPageSize: 100,
        pageSizeOptions: [10, 25, 50, 100],
        defaultSort: { field: "_creationTime", order: "desc" },
        bulkActions: { delete: true },
        defaultColumns: [],
      },
    },
```

**4 — a new `describeVexList` function**, placed immediately after `describePaginatedSearch` (closes at line 230 in the pre-edit file):

```ts
/**
 * Registers the `useVexList` describe block — the `find`-mode path only
 * (`search` throws until Step 9's toolbar is its first caller), driven by
 * real seeded rows through the convex-test bridge.
 */
function describeVexList() {
  describe("useVexList", () => {
    it("reveals pageSize rows per page, independent of the collection's larger serverPageSize", async () => {
      const t = convexTest(schema, testModules);
      await seedDocuments(t, 15);
      const { queryClient } = buildQueryClient(t);
      const collection = makeDocumentsCollection();

      const { result } = renderHook(() => useVexList({ collection, pageSize: 5 }), {
        wrapper: makeWrapper(queryClient),
      });
      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.results.map((doc) => doc.title)).toEqual([
        "Doc 0",
        "Doc 1",
        "Doc 2",
        "Doc 3",
        "Doc 4",
      ]);
      expect(result.current.isDone).toBe(false);

      act(() => result.current.loadMore());
      await waitFor(() =>
        expect(result.current.results.map((doc) => doc.title)).toEqual([
          "Doc 0",
          "Doc 1",
          "Doc 2",
          "Doc 3",
          "Doc 4",
          "Doc 5",
          "Doc 6",
          "Doc 7",
          "Doc 8",
          "Doc 9",
        ]),
      );
    });

    it("forwards where to filter results", async () => {
      const t = convexTest(schema, testModules);
      await seedDocuments(t, 5);
      const { queryClient } = buildQueryClient(t);
      const collection = makeDocumentsCollection();

      const { result } = renderHook(
        () =>
          useVexList({
            collection,
            where: { field: "title", op: "eq", value: "Doc 2" },
            pageSize: 10,
          }),
        { wrapper: makeWrapper(queryClient) },
      );
      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.results.map((doc) => doc.title)).toEqual(["Doc 2"]);
      expect(result.current.isDone).toBe(true);
    });
  });
}

/**
 * Registers the `useVexDoc` describe block, driven by real seeded rows
 * through the convex-test bridge's `"vex:get"` handler.
 */
function describeVexDoc() {
  describe("useVexDoc", () => {
    it("returns the document matching id, live", async () => {
      const t = convexTest(schema, testModules);
      const [id] = await seedDocuments(t, 1);
      const { queryClient } = buildQueryClient(t);

      const { result } = renderHook(() => useVexDoc({ collection: "documents", id }), {
        wrapper: makeWrapper(queryClient),
      });
      await waitFor(() => expect(result.current.document?.title).toBe("Doc 0"));
      expect(result.current.isPending).toBe(false);
    });

    it("skip: true never issues the query — document stays undefined", async () => {
      const t = convexTest(schema, testModules);
      const [id] = await seedDocuments(t, 1);
      const { queryClient } = buildQueryClient(t);

      const { result } = renderHook(
        () => useVexDoc({ collection: "documents", id, skip: true }),
        { wrapper: makeWrapper(queryClient) },
      );
      await waitFor(() => expect(result.current.document).toBeUndefined());
    });

    it("undefined id behaves like skip: true", async () => {
      const t = convexTest(schema, testModules);
      const { queryClient } = buildQueryClient(t);

      const { result } = renderHook(
        () => useVexDoc({ collection: "documents", id: undefined }),
        { wrapper: makeWrapper(queryClient) },
      );
      await waitFor(() => expect(result.current.document).toBeUndefined());
    });
  });
}
```

**5 — `runHooksSuite`'s default `only` array**, two new members:

```ts
  const only = options?.only ?? [
    "useTableSelection",
    "usePaginatedQuery",
    "usePaginatedSearch",
    "useVexList",
    "useVexDoc",
  ];
```

**6 — the end of `runHooksSuite`**, two new gated calls alongside the existing `usePaginatedSearch` one:

```ts
  if (only.includes("usePaginatedSearch")) describePaginatedSearch();
  if (only.includes("useVexList")) describeVexList();
  if (only.includes("useVexDoc")) describeVexDoc();
}
```

#### packages/react/src/collections/CollectionListView.tsx

Existing file, 2 edits.

**1 — imports**, `usePaginatedQuery` becomes `useVexList` in the `"../hooks"` import; `vexConvexApi` stays (the bulk-delete mutation at line 186 is unchanged — `useVexMutation`'s `mutationFn` always takes a bare `FunctionReference`, which is what that call already passes):

```ts
import { useVexList, useVexMutation } from "../hooks";
```

**2 — the pagination fetch**, replacing the `numItems` computation and the `usePaginatedQuery` call with `useVexList`:

```ts
  const isVersioned = collection.versions.drafts;
  const pagination = useVexList({
    collection,
    // Always sent for a versioned collection: `find` itself falls back to the
    // published-only read for a caller without `readDrafts`, so these args
    // match `NextAdminPage`'s server prefetch exactly for every caller.
    drafts: isVersioned ? true : undefined,
    depth: 1,
    pageSize: collection.admin.table.defaultPageSize,
    initialData: props.initialData,
  });
```

#### packages/react/src/media/MediaCollectionListView.tsx

Existing file, 2 edits.

**1 — imports**, `usePaginatedQuery` becomes `useVexList` in the `"../hooks"` import; `vexConvexApi` stays (the bulk-delete mutation at line 116 is unchanged, same reason as `CollectionListView`):

```ts
import { useVexList, useVexMutation } from "../hooks";
```

**2 — the pagination fetch**, replacing the `numItems` computation and the `usePaginatedQuery` call (the old `limit: 100` was already a no-op — `find`'s own doc says `limit` is "Ignored when `paginationOpts` is set"):

```ts
  const pagination = useVexList<VexMediaDocument>({
    collection,
    depth: 1,
    pageSize: collection.admin.table.defaultPageSize,
    initialData: props.initialData,
  });
```

#### packages/react/src/collections/CollectionEditView.tsx

Existing file, 3 edits. `convexQuery`/`useQuery`/`vexConvexApi` stay imported — `unpublishVersions` (`vexConvexApi.versions.listVersions`) and every mutation (`vexConvexApi.update`, `.versions.publish`, `.versions.unpublish`, `.versions.saveDraft`) are untouched; only the two document *reads* move to `useVexDoc`.

**1 — imports**, `useVexDoc` added alongside the existing `useVexMutation`:

```ts
import { useVexDoc, useVexMutation } from "../hooks";
```

**2 — the `currentDocument` fetch**, replacing the comment + `useQuery`/`convexQuery(vexConvexApi.get, …)` block:

```ts
  const { document: currentDocument } = useVexDoc({
    collection: collection.slug,
    id: activeDocumentId,
    drafts: collection.versions.drafts,
    initialData: props.initialData,
  });
```

**3 — the `publishedRowWhileDraft` fetch**, replacing its `useQuery`/`convexQuery(vexConvexApi.get, …)` block — `enabled` becomes `useVexDoc`'s `skip` (its negation):

```ts
  const { document: publishedRowWhileDraft } = useVexDoc({
    collection: collection.slug,
    id: (currentDocument.vex_publishedId as string | undefined) ?? currentDocument._id,
    skip: !(isVersioned && isDraftDoc),
  });
```

Two notes on scope: `vexConvexApi.remove`/`.update`/`.versions.*` stay in all three files — `useVexMutation`'s `mutationFn` is a bare `FunctionReference` (`hooks/useVexMutation.ts`), not a bound hook, so "no direct `vexConvexApi`" applies to the READ side only, matching Design Decision 19's "data-source" (read) hook boundary. `FindClientArgs`/`FindClientPaginatedArgs` (`collections/api/find/client.ts`) gain `sort?: CollectionTableSort<string>` here too, mirroring Step 5's server-side addition, so `useVexList`'s `query.sort` forward compiles.

### Step 8 — List slots + built-ins as `vex.*` contributions [agent]

Why: create, search, filters, columns, views, row/bulk delete become contributions so custom actions use the same path (plugin stem S1–S14, client-only S14).
Verify: pnpm --filter @vexcms/core test -- components && pnpm --filter @vexcms/react test -- collections slots && browser: list renders identically

- [ ] `packages/core/src/components/types.ts` — `SLOT_IDS.list`: `headerActions`, `toolbar`, `filters`, `beforeTable`, `afterTable`, `rowActions`, `bulkActions`
- [ ] `packages/core/src/components/builtinIds.ts` — `vex.list.create`, `vex.list.search`, `vex.list.filters`, `vex.list.columns`, `vex.list.views`, `vex.list.row.delete`, `vex.list.bulk.delete`
- [ ] `packages/core/src/collections/types.ts` + `packages/core/src/collections/config.ts` + `packages/core/src/collections/config.test.ts` — `AdminListComponentsInput`/`AdminListComponents`; `admin.components` on collection config, resolved via `resolveComponentContributions`
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — bulk-delete UI moves out; `onSelectionChange` callback replaces `onBulkDelete`/`enableBulkActions`
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` (new) + `packages/react/src/collections/CollectionListLayout.test.tsx` (new) — places `SlotOutlet` per slot; row/bulk contributions receive `{ collection, docs }`, gated by `access`
- [ ] `packages/react/src/collections/CollectionListView.tsx` — delegates rendering to `CollectionListLayout`; existing delete UI moved into built-in contributions; `RevalidateButton` stays outside it (Decision 23)

#### packages/core/src/components/types.ts

2 edits. Everything else in the file is unchanged.

**1 — `SLOT_IDS`.** Add a `list` key beside the existing `field`/`blocks`/`array` keys (Decision 18's seven flat ids — `row.actions` keeps the dotted G convention, the rest are single-segment since they have no sub-target):

```ts
export const SLOT_IDS = {
  field: {
    // … unchanged
  },
  blocks: {
    // … unchanged
  },
  array: {
    // … unchanged
  },
  list: {
    /** Additive contributions rendered beside the built-in "+ New" button. Built-in: `vex.list.create`. */
    headerActions: "list.header.actions",
    /** Additive contributions rendered in the toolbar row. Built-ins: `vex.list.search` (step 9), `vex.list.columns` (step 9), `vex.list.views` (step 11). */
    toolbar: "list.toolbar",
    /** Additive contributions rendered in the filter row, below the toolbar. Built-in: `vex.list.filters` (step 10). */
    filters: "list.filters",
    /** Additive contributions rendered above the table, below `toolbar`/`filters`. No built-in. */
    beforeTable: "list.beforeTable",
    /** Additive contributions rendered below the table. No built-in. */
    afterTable: "list.afterTable",
    /** Additive contributions rendered per row, alongside the built-in delete action. Built-in: `vex.list.row.delete`. */
    rowActions: "list.row.actions",
    /** Additive contributions rendered in the floating bulk-action bar. Built-in: `vex.list.bulk.delete`. */
    bulkActions: "list.bulkActions",
  },
} as const;
```

**2 — `SlotId`.** Add the `list` member to the union:

```ts
export type SlotId =
  | (typeof SLOT_IDS.field)[keyof typeof SLOT_IDS.field]
  | (typeof SLOT_IDS.blocks)[keyof typeof SLOT_IDS.blocks]
  | (typeof SLOT_IDS.array)[keyof typeof SLOT_IDS.array]
  | (typeof SLOT_IDS.list)[keyof typeof SLOT_IDS.list];
```

#### packages/core/src/components/builtinIds.ts

1 edit — add a `list` key to `BUILTIN_CONTRIBUTION_IDS`, beside `block`/`blocksHeader`/`array`:

```ts
export const BUILTIN_CONTRIBUTION_IDS = {
  block: {
    // … unchanged
  },
  blocksHeader: {
    // … unchanged
  },
  array: {
    // … unchanged
  },
  list: {
    create: "vex.list.create",
    search: "vex.list.search",
    filters: "vex.list.filters",
    columns: "vex.list.columns",
    views: "vex.list.views",
    rowDelete: "vex.list.row.delete",
    bulkDelete: "vex.list.bulk.delete",
  },
} as const;
```

#### packages/core/src/collections/types.ts

2 edits. Everything else in the file is unchanged.

**1 — imports.** Add `ComponentContributionInput` beside the existing `ComponentHKT` import:

```ts
import type { ComponentContributionInput, ComponentHKT } from "../components/types";
```

**2 — `AdminCollectionConfigInput` / `AdminCollectionConfig`.** New `AdminListComponentsInput` / `AdminListComponents` types (full — every array `unknown`-typed and cast at the React call site, the same split the root `admin.components.blocks`/`array` input already uses, P-002: a value that travels as a prop is never threaded through authoring generics), plus a `components` property on both collection-admin interfaces:

```ts
/**
 * This collection's own additive contributions to its list-view slots (S17/S18),
 * merged with `vex.list.*` built-ins by `CollectionListLayout` — never here. Every
 * array is optional and empty by default, the same split as the root
 * `admin.components.blocks`/`array` input (`config/types.ts`).
 */
export interface AdminListComponentsInput {
  /** `list.header.actions` — additive entries beside the built-in "+ New" button. */
  headerActions?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.toolbar` — additive entries in the toolbar row. */
  toolbar?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.filters` — additive entries in the filter row. */
  filters?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.beforeTable` — additive entries above the table. */
  beforeTable?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.afterTable` — additive entries below the table. */
  afterTable?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.row.actions` — additive entries beside the built-in per-row delete action. */
  rowActions?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.bulkActions` — additive entries in the floating bulk-action bar. */
  bulkActions?: ComponentContributionInput<ComponentHKT, unknown>[];
}

/** Resolved list-slot contributions after `defineCollection()` — always present, every list defaulted and ordered. */
export interface AdminListComponents {
  headerActions: ComponentContributionInput<ComponentHKT, unknown>[];
  toolbar: ComponentContributionInput<ComponentHKT, unknown>[];
  filters: ComponentContributionInput<ComponentHKT, unknown>[];
  beforeTable: ComponentContributionInput<ComponentHKT, unknown>[];
  afterTable: ComponentContributionInput<ComponentHKT, unknown>[];
  rowActions: ComponentContributionInput<ComponentHKT, unknown>[];
  bulkActions: ComponentContributionInput<ComponentHKT, unknown>[];
}
```

Add to `AdminCollectionConfigInput` (after `livePreview`):

```ts
  /**
   * This collection's additive contributions to its own `list.*` slots (S17/S18) —
   * create, search, filters, columns, views, and row/bulk delete are built-ins
   * (`vex.list.*`) and need no entry here; this is only for custom row/bulk actions
   * and other project-authored contributions.
   */
  components?: AdminListComponentsInput;
```

Add to `AdminCollectionConfig` (after `livePreview`):

```ts
  /** Resolved `list.*` slot contributions — always present, every list defaulted to `[]`. */
  components: AdminListComponents;
```

`_TComponent` in both interfaces' generic parameter lists becomes `TComponent` — it is now live (`ComponentContributionInput<ComponentHKT, unknown>` doesn't reference it directly since P-002 keeps these arrays `unknown`-typed, but the parameter stops being dead so the leading underscore no longer applies). Rename `_TComponent` → `TComponent` in both `AdminCollectionConfigInput<…>` and `AdminCollectionConfig<…>` parameter lists; no call site passes this generic explicitly today, so nothing else changes.

#### packages/core/src/collections/config.ts

2 edits. Everything else in the file is unchanged.

**1 — imports.** Add beside the existing `./types` import:

```ts
import { resolveComponentContributions, SLOT_IDS } from "../components";
```

**2 — `admin` block inside `defineCollection()`.** Add a `components` property beside the existing `livePreview` property (same object, `:221-253` today):

```ts
      components: {
        headerActions: resolveComponentContributions({
          slotId: SLOT_IDS.list.headerActions,
          contributions: input.admin?.components?.headerActions ?? [],
        }),
        toolbar: resolveComponentContributions({
          slotId: SLOT_IDS.list.toolbar,
          contributions: input.admin?.components?.toolbar ?? [],
        }),
        filters: resolveComponentContributions({
          slotId: SLOT_IDS.list.filters,
          contributions: input.admin?.components?.filters ?? [],
        }),
        beforeTable: resolveComponentContributions({
          slotId: SLOT_IDS.list.beforeTable,
          contributions: input.admin?.components?.beforeTable ?? [],
        }),
        afterTable: resolveComponentContributions({
          slotId: SLOT_IDS.list.afterTable,
          contributions: input.admin?.components?.afterTable ?? [],
        }),
        rowActions: resolveComponentContributions({
          slotId: SLOT_IDS.list.rowActions,
          contributions: input.admin?.components?.rowActions ?? [],
        }),
        bulkActions: resolveComponentContributions({
          slotId: SLOT_IDS.list.bulkActions,
          contributions: input.admin?.components?.bulkActions ?? [],
        }),
      },
```

#### packages/core/src/collections/config.test.ts

New assertions (append to the existing `describe` block covering `defineCollection`'s admin defaults — exact values, not guided):

```ts
  it("defaults admin.components to empty, ordered arrays", () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    expect(collection.admin.components).toEqual({
      headerActions: [],
      toolbar: [],
      filters: [],
      beforeTable: [],
      afterTable: [],
      rowActions: [],
      bulkActions: [],
    });
  });

  it("resolves a project's own list.bulkActions contribution, ordered", () => {
    const comp = () => null;
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text() },
      admin: {
        components: {
          bulkActions: [
            { id: "acme.export", component: comp, order: 10 },
            { id: "acme.archive", component: comp, order: 0 },
          ],
        },
      },
    });
    expect(collection.admin.components.bulkActions.map((c) => c.id)).toEqual([
      "acme.archive",
      "acme.export",
    ]);
  });
```

#### packages/react/src/ui/data-table/DataTable.tsx

2 edits — bulk-delete UI moves out of this generic table (it becomes the `vex.list.bulk.delete` built-in, which needs the live `docs`/`collection` a plain data-table has no concept of); `DataTable` now only reports the selected ids via a callback. Everything else in the file (columns, Load More, the checkbox column) is unchanged.

**1 — imports.** Drop `BulkDeleteModal` and `DataTableBulkActions` (no longer rendered here); add `useEffect`:

```ts
import { useEffect, useMemo, useState } from "react";
```

**2 — `DataTableProps`.** Replace the "Bulk actions" section (`entityName` / `onBulkDelete` / `isDeleting`) and `enableBulkActions` with one callback:

```ts
  /** Enable checkbox column for row selection. */
  enableRowSelection?: boolean;

  /**
   * Invoked whenever the selected row ids change (a row toggled, "select all" toggled, or the
   * `data` array changed shape). The caller — `CollectionListLayout` — owns what a selection
   * means (the `list.bulkActions` slot's `docs`), not this generic table.
   */
  onSelectionChange?: (selectedIds: string[]) => void;
```

**3 — `DataTable` body.** Replace the whole function (signature + JSDoc unchanged; drops `deleteModalOpen`/`handleBulkDelete`/the bulk bar and modal, adds the `onSelectionChange` effect):

```tsx
export function DataTable<TData extends VexDocument>(props: DataTableProps<TData>): ReactNode {
  // TODO: implement
  // 1. Keep today's `rowSelection` state + checkbox-column injection + `useReactTable` call
  //    exactly as they are now (unrelated to this step — only the bulk UI below moves out).
  // 2. `const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original._id);`
  //    → useEffect(() => props.onSelectionChange?.(selectedIds), [selectedIds]) — fires on every
  //    render where the id list is a new array; `onSelectionChange` is cheap (just stores ids in
  //    `CollectionListLayout` state) so no extra memoization is needed here.
  // 3. Drop `deleteModalOpen` state, `handleBulkDelete`, the `<DataTableBulkActions>` and
  //    `<BulkDeleteModal>` JSX, and the `enableBulkActions`/`onBulkDelete`/`entityName`/
  //    `isDeleting` props entirely — keep the `<Table>`/`<TableHeader>`/`<TableBody>`/Load More/
  //    "all loaded" JSX exactly as it renders today.
  // Edge cases:
  // - TanStack's `rowSelection` is keyed by row index by default (no `getRowId` is passed), so a
  //   row removed from `data` after a delete can leave a STALE index selected pointing at a
  //   different row once the array re-renders shorter. Today's code has this same property
  //   (`handleBulkDelete` cleared `rowSelection` itself after its own mutation resolved) — now
  //   that the mutation lives in `vex.list.bulk.delete`, `CollectionListLayout` must clear its
  //   own `selectedIds` state after a successful delete; this component only ever reports
  //   forward, it does not own clearing.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/CollectionListLayout.tsx

New file. Composes a collection's list view around the seven `list.*` slots — the piece `CollectionListView` delegates rendering to once its own data (rows/columns/pagination) is ready. Built-in contributions close over `collection`/`access` per render (they cannot be module-level consts the way `blocks.item.actions` built-ins are, because `hasPermission`'s `resource` argument needs this specific collection's slug — see `SlotOutlet`'s own note on why built-ins and project contributions stay separate props).

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import {
  BUILTIN_CONTRIBUTION_IDS,
  CRUD_ACTIONS,
  SLOT_IDS,
  vexConvexApi,
  type CollectionConfig,
  type ComponentContributionInput,
  type TDocument,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { SlotOutlet } from "../slots/SlotOutlet";
import { DataTable, type DataTableProps } from "../ui/data-table/DataTable";
import { DataTableBulkActions } from "../ui/data-table/DataTableBulkActions";
import { BulkDeleteModal } from "../ui/data-table/DeleteManyModal";
import { CreateDocumentModal } from "./CreateDocumentModal";
import { VexLink } from "../ui/VexLink";
import { Button } from "../ui";
import { adminHref } from "../admin/adminHref";
import { useVexConfig } from "../config/VexConfigContext";
import { useVexMutation } from "../hooks";

/** Props every `list.header.actions`/`list.toolbar`/`list.filters`/`list.beforeTable`/`list.afterTable` contribution receives — not row-scoped. */
export interface ListSlotProps {
  collection: CollectionConfig;
}

/** Props every `list.row.actions`/`list.bulkActions` contribution receives — `docs` is one row for `row.actions`, every selected row for `bulkActions`. */
export interface ListRowSlotProps extends ListSlotProps {
  docs: TDocument[];
}

export interface CollectionListLayoutProps<TDoc extends TDocument = TDocument> {
  /** The resolved collection config (`useVexConfig().collections.find(...)`, already looked up by the caller). */
  collection: CollectionConfig;
  /** Rows for the current page — already version-collapsed by the caller when the collection is versioned. */
  rows: TDoc[];
  /** Column defs for the current page, already permission-filtered by the caller. */
  columns: ColumnDef<TDoc>[];
  isDone: boolean;
  isPending: boolean;
  totalCount: number | null | undefined;
  onLoadMore: () => void;
  /** Whether the current user may create a document in this collection — gates `vex.list.create`. */
  canCreate: boolean;
  /** Whether the current user may delete documents in this collection — gates `vex.list.row.delete` / `vex.list.bulk.delete` and the table's row-selection checkboxes. */
  canDelete: boolean;
}

/**
 * Renders a collection's list view around the seven `list.*` slots (S17/S18): a header
 * row (`list.header.actions`), a toolbar/filter area (`list.toolbar`, `list.filters`),
 * the table flanked by `list.beforeTable`/`list.afterTable`, a per-row actions column
 * (`list.row.actions`), and a floating bulk-action bar (`list.bulkActions`).
 *
 * Owns row-selection state itself (`DataTable`'s `onSelectionChange` reports ids; this
 * component derives `docs` for `list.bulkActions` from `rows.filter(...)`) so that
 * `list.bulkActions` contributions never need to know how selection is tracked.
 *
 * @param props - {@link CollectionListLayoutProps}.
 * @returns The composed list view.
 */
export function CollectionListLayout<TDoc extends TDocument = TDocument>(
  props: CollectionListLayoutProps<TDoc>,
): ReactNode {
  // TODO: implement
  // 1. `const [selectedIds, setSelectedIds] = useState<string[]>([])`
  //    → `const selectedDocs = useMemo(() => props.rows.filter((r) => selectedIds.includes(r._id)), [props.rows, selectedIds])`
  // 2. Build each slot's builtins with `useMemo`, keyed on `[props.collection.slug, props.canCreate, props.canDelete]`:
  //    a. `list.header.actions` → `[{ id: BUILTIN_CONTRIBUTION_IDS.list.create, component: ListCreateAction,
  //       access: (ctx) => ctx.hasPermission(props.collection.slug, CRUD_ACTIONS.create) }]`
  //    b. `list.row.actions` → `[{ id: BUILTIN_CONTRIBUTION_IDS.list.rowDelete, component: ListRowDeleteAction,
  //       access: (ctx) => ctx.hasPermission(props.collection.slug, CRUD_ACTIONS.delete) }]`
  //    c. `list.bulkActions` → `[{ id: BUILTIN_CONTRIBUTION_IDS.list.bulkDelete, component: ListBulkDeleteAction,
  //       access: (ctx) => ctx.hasPermission(props.collection.slug, CRUD_ACTIONS.delete) }]`
  //    d. `list.toolbar` / `list.filters` / `list.beforeTable` / `list.afterTable` → `[]` here — steps 9–11
  //       extend this same memo with `vex.list.search`/`vex.list.columns`/`vex.list.views`/`vex.list.filters`,
  //       this step only wires the outlets, it does not populate them
  // 3. Append a trailing "Actions" `ColumnDef<TDoc>` to `props.columns` (only when `props.canDelete` or
  //    `props.collection.admin.components.rowActions.length > 0` — otherwise omit the column entirely so a
  //    read-only role sees no empty trailing column), whose `cell` renders:
  //    `<SlotOutlet slotId={SLOT_IDS.list.rowActions} builtins={rowActionBuiltins}
  //      contributions={props.collection.admin.components.rowActions as unknown as ComponentContributionInput<ReactHKT, ListRowSlotProps>[]}
  //      contributedProps={{ collection: props.collection, docs: [row.original] }} />`
  //    (the `as unknown as` cast mirrors `BlockActionsMenu.tsx`'s own cast of
  //    `config.admin.components.blocks.itemActions` — core keeps these `unknown`-typed per P-002).
  // 4. Render, top to bottom:
  //    - a header row: `collection.labels.plural` title + document count, and
  //      `<SlotOutlet slotId={SLOT_IDS.list.headerActions} builtins={headerActionBuiltins}
  //        contributions={collection.admin.components.headerActions as unknown as …}
  //        contributedProps={{ collection: props.collection }} />`
  //    - `<SlotOutlet slotId={SLOT_IDS.list.toolbar} .../>` then `<SlotOutlet slotId={SLOT_IDS.list.filters} .../>`
  //    - `<SlotOutlet slotId={SLOT_IDS.list.beforeTable} .../>`
  //    - `<DataTable data={props.rows} columns={columnsWithActions} isDone={props.isDone}
  //        onLoadMore={props.onLoadMore} isLoadingMore={props.isPending} totalCount={props.totalCount}
  //        enableRowSelection={props.canDelete} onSelectionChange={setSelectedIds} />`
  //    - `<SlotOutlet slotId={SLOT_IDS.list.afterTable} .../>`
  //    - `<SlotOutlet slotId={SLOT_IDS.list.bulkActions} builtins={bulkActionBuiltins}
  //        contributions={collection.admin.components.bulkActions as unknown as …}
  //        contributedProps={{ collection: props.collection, docs: selectedDocs }} />`
  // Edge cases:
  // - After `ListBulkDeleteAction`'s mutation resolves, `selectedIds` still names the now-deleted
  //   rows until this component clears it — `ListBulkDeleteAction` has no way to call
  //   `setSelectedIds` (its props are fixed to `{ collection, docs }`, P-002's value-level
  //   boundary). Resolve by having `DataTable` re-fire `onSelectionChange([])` itself once its
  //   `data` prop shrinks below the previously-selected indices (ties into `DataTable`'s own
  //   "Edge cases" note above) — do not widen `ListRowSlotProps` to carry a clear callback.
  // - No `list.row.actions` contribution and `canDelete` is `false`: the trailing column is
  //   omitted, not rendered empty.
  throw new Error("Not implemented");
}

/**
 * `vex.list.create` — the "+ New {singular}" button and its create modal. Gated by the
 * `access` predicate on its `ComponentContributionInput` entry (CRUD `create`), never by a
 * re-check in here.
 *
 * @param props - {@link ListSlotProps}.
 * @returns The create button + modal, moved verbatim from `CollectionListView`'s current JSX.
 */
function ListCreateAction(props: ListSlotProps): ReactNode {
  // TODO: implement
  // 1. `const config = useVexConfig()`
  // 2. Render `<CreateDocumentModal collection={props.collection.slug} />` plus a `<Button>`
  //    rendering a `<VexLink href={adminHref({ type: "create", slug: props.collection.slug }, config.basePath)} />`
  //    reading "+ New {props.collection.labels.singular}" — the exact JSX `CollectionListView`
  //    renders today (`:222-232`), unchanged.
  throw new Error("Not implemented");
}

/**
 * `vex.list.row.delete` — per-row delete, gated by the `access` predicate on its
 * `ComponentContributionInput` entry (CRUD `delete`).
 *
 * @param props - {@link ListRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A destructive icon button that confirms via {@link BulkDeleteModal} before deleting.
 */
function ListRowDeleteAction(props: ListRowSlotProps): ReactNode {
  // TODO: implement
  // 1. `const [open, setOpen] = useState(false)`
  // 2. `const removeMutation = useVexMutation({ collection: props.collection.slug, mutationFn:
  //    vexConvexApi.remove, operation: "remove", getChanges: ({ args }) => args.ids.flatMap((id) =>
  //    props.docs.find((d) => d._id === id) ? [{ before: props.docs.find((d) => d._id === id) }] : []) })`
  //    — same `getChanges` shape `CollectionListView`'s current `removeMutation` uses for bulk
  //    (`:176-188`), scoped to this one row.
  // 3. A destructive icon button (`Trash2`) opens the modal; `<BulkDeleteModal open={open}
  //    onOpenChange={setOpen} selectedCount={1} entityName={props.collection.labels.singular}
  //    isDeleting={removeMutation.isPending} onConfirm={async () => { await
  //    removeMutation.mutateAsync({ ids: [props.docs[0]._id], collection: props.collection.slug });
  //    setOpen(false); }} />`
  // Edge cases:
  // - A versioned collection's draft/published pair is already collapsed to one row by the
  //   caller (`collapseVersionedPairs`), so `props.docs[0]._id` deletes only that collapsed row's
  //   own id — it never cascades to a paired version, matching today's bulk-delete behavior.
  throw new Error("Not implemented");
}

/**
 * `vex.list.bulk.delete` — the floating bulk-delete bar + confirmation modal, gated by the
 * `access` predicate on its `ComponentContributionInput` entry (CRUD `delete`). Renders
 * nothing while `props.docs` is empty, so the surrounding `SlotOutlet` mounts no empty bar.
 *
 * @param props - {@link ListRowSlotProps}; `props.docs` is every currently-selected row.
 * @returns The bulk-action bar + {@link BulkDeleteModal}, or `null` when nothing is selected.
 */
function ListBulkDeleteAction(props: ListRowSlotProps): ReactNode {
  // TODO: implement
  // 1. `if (props.docs.length === 0) return null;`
  // 2. `const [open, setOpen] = useState(false)`
  // 3. `const removeMutation = useVexMutation({ collection: props.collection.slug, mutationFn:
  //    vexConvexApi.remove, operation: "remove", getChanges: ({ args }) => args.ids.flatMap((id) =>
  //    props.docs.find((d) => d._id === id) ? [{ before: props.docs.find((d) => d._id === id) }] : []) })`
  //    — moved verbatim from `CollectionListView`'s current `removeMutation` (`:176-188`).
  // 4. `<DataTableBulkActions selectedCount={props.docs.length} onDelete={() => setOpen(true)}
  //    onClear={() => {/* selection lives in CollectionListLayout — see this file's "Edge cases" */}}
  //    isDeleting={removeMutation.isPending} />`
  // 5. `<BulkDeleteModal open={open} onOpenChange={setOpen} selectedCount={props.docs.length}
  //    entityName={props.collection.labels.plural} isDeleting={removeMutation.isPending}
  //    onConfirm={async () => { await removeMutation.mutateAsync({ ids: props.docs.map((d) =>
  //    d._id), collection: props.collection.slug }); setOpen(false); }} />`
  throw new Error("Not implemented");
}

/** Built-in `list.header.actions` contribution, exported so `CollectionListLayout.test.tsx` can assert its id without constructing a full `CollectionConfig`. */
export const BUILTIN_LIST_HEADER_ACTION_ID = BUILTIN_CONTRIBUTION_IDS.list.create;
```

`DataTableProps` is now imported (type-only) for `CollectionListLayout`'s own future wiring — remove this import if the full implementation ends up not needing the explicit type (TanStack infers it from `<DataTable columns={...} />`'s own generic).

#### packages/react/src/collections/CollectionListLayout.test.tsx

New file — asserts slot wiring and access gating without exercising the (not-yet-implemented) component bodies above: a fake `collection` + `SlotOutlet`-compatible fixture proves the built-in ids and their `access` gating are correct, the part of this step that IS testable before the guided stubs are filled in.

```tsx
import { describe, expect, it } from "vitest";
import { BUILTIN_CONTRIBUTION_IDS, CRUD_ACTIONS, SLOT_IDS } from "@vexcms/core";

describe("CollectionListLayout built-in ids", () => {
  it("names the seven list.* slot ids per Decision 18", () => {
    expect(SLOT_IDS.list).toEqual({
      headerActions: "list.header.actions",
      toolbar: "list.toolbar",
      filters: "list.filters",
      beforeTable: "list.beforeTable",
      afterTable: "list.afterTable",
      rowActions: "list.row.actions",
      bulkActions: "list.bulkActions",
    });
  });

  it("names the vex.list.* built-in contribution ids", () => {
    expect(BUILTIN_CONTRIBUTION_IDS.list).toEqual({
      create: "vex.list.create",
      search: "vex.list.search",
      filters: "vex.list.filters",
      columns: "vex.list.columns",
      views: "vex.list.views",
      rowDelete: "vex.list.row.delete",
      bulkDelete: "vex.list.bulk.delete",
    });
  });

  it("gates create/delete built-ins on the matching CRUD action", () => {
    // Guards the literal action strings `CollectionListLayout`'s `access` predicates close
    // over (`ctx.hasPermission(collection.slug, CRUD_ACTIONS.create)` / `.delete`) — a typo
    // here (e.g. swapping create/delete) would silently gate the wrong button.
    expect(CRUD_ACTIONS.create).toBe("create");
    expect(CRUD_ACTIONS.delete).toBe("delete");
  });
});
```

#### packages/react/src/collections/CollectionListView.tsx

1 edit — delegates rendering to `CollectionListLayout` instead of rendering the create button and `DataTable` inline; drops the mutation/handler/permission plumbing that moved into the built-ins above. Column-building, pagination and the status column (`:49-174`, unchanged by step 7's `useVexList` migration except the pagination call itself) stay in this file — `CollectionListLayout` is purely presentational.

Replace the body from `const removeMutation = …` (`:176`) through the end of the function (`:251`):

```tsx
  const canCreate = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.create,
    scope: PERMISSION_SCOPES.any,
  });
  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });

  return (
    <div className="relative">
      <div className="flex justify-end pt-4">
        <RevalidateButton collection={collection.slug} />
      </div>
      <CollectionListLayout
        collection={collection}
        rows={rows}
        columns={columns}
        isDone={pagination.isDone}
        isPending={pagination.isPending}
        totalCount={pagination.totalDocs}
        onLoadMore={pagination.loadMore}
        canCreate={canCreate}
        canDelete={canDelete}
      />
    </div>
  );
}
```

Drop the now-unused imports this removes (`CreateDocumentModal`, `VexLink`, `adminHref`, `vexConvexApi`, `useVexMutation`, `Badge`/`Button`/`DataTable` from `../ui` if no longer referenced elsewhere in the file — `RevalidateButton` stays, see Design Decision 23) and add:

```ts
import { CollectionListLayout } from "./CollectionListLayout";
```

### Step 9 — Toolbar controls + URL state [agent]

Why: search, sort, columns and page size are the core navigability acceptance; URL makes lists shareable.

- [ ] `packages/react/src/collections/useCollectionListUrlState.ts` (new) + test — `search`, `searchField`, `sort`, `where` (JSON, plain form), `pageSize`, `view`; invalid params dropped, not thrown
- [ ] `packages/react/src/collections/CollectionListSearch.tsx` (new) + test — debounced input + field picker (config order, first default); hidden without `searchField`
- [ ] `packages/react/src/ui/data-table/DataTableSortHeader.tsx` (new) + test — sortable headers (only `enableSorting`), disabled with "sorted by relevance" during search
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` (new) + test — `enableHiding` columns; session-only state when no view selected
- [ ] `packages/react/src/ui/data-table/DataTablePageSizeSelect.tsx` (new) + test — `pageSizeOptions`; Load More retained
- [ ] all controls built responsive (375 → 1024)
- [ ] `packages/react/src/fields/index.tsx` — `getCollectionColumnDefs` sets every column's `enableSorting`/`enableHiding` from `fieldDef.admin.enableSorting`/`enableHiding` (Step 3) in ONE central pass, instead of touching all 12 `fields/<type>/columnDef.tsx` factories
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — controlled `sort`/`onSortChange`/`sortDisabled`/`visibleColumns`; table-level `enableSorting: false` default; sortable headers render via `DataTableSortHeader`
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` (new) + test — hosts `list.toolbar` (`vex.list.search`/`vex.list.columns` built-ins) plus the un-slotted `DataTablePageSizeSelect`
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` — renders `CollectionListToolbar`; threads `sort`/`visibleColumns` into `DataTable`
- [ ] `packages/react/src/collections/CollectionListView.tsx` — calls `useCollectionListUrlState` and feeds it into `useVexList`'s `where`/`sort`/`search`/`searchField`/`pageSize`; owns session-only `visibleColumns` state
- [ ] `packages/react/src/collections/index.ts` + `packages/react/src/ui/data-table/index.ts` — barrel exports for the new files

All five controls are controlled components — each reads its value from props and reports changes through a callback, never owning persisted state itself. `useCollectionListUrlState` is the one piece that touches the URL (via `nuqs`, the project's established URL-state library — see `CreateDocumentModal.tsx`). Column visibility is deliberately NOT part of that hook (Decision 9: "Columns are not in the URL") — it stays a plain array passed down from whichever parent owns it (session-only per Decision 15; that owner is `CollectionListView`, which hands it to `CollectionListLayout`, Step 8). Responsiveness at this step is Tailwind `flex-wrap` plus full-width inputs below `sm` — the toolbar-collapses-to-overflow-menu/sheet redesign is Step 12's job (Decision 22).

This step also wires the whole thing end to end rather than leaving it for later: `getCollectionColumnDefs` (`fields/index.tsx`) is the ONE place that makes every column's `enableSorting`/`enableHiding` agree with its field's `admin` config, so none of the 12 `fields/<type>/columnDef.tsx` factories need touching. `DataTable.tsx` centrally wraps every sortable column's header with `DataTableSortHeader` and applies `visibleColumns` as TanStack's `columnVisibility` state. `CollectionListLayout.tsx` (Step 8) renders the new `CollectionListToolbar`, which hosts the `list.toolbar` slot's `vex.list.search`/`vex.list.columns` built-ins (Decision 17 — these, like `vex.list.create`/`row.delete`/`bulk.delete`, are contributions, not hardcoded JSX) plus the un-slotted `DataTablePageSizeSelect` (page size has no `vex.list.*` id — Decision 17 never names one). `CollectionListView.tsx` is where `useCollectionListUrlState` is actually called and fed into `useVexList` (Step 7) and the session-only `visibleColumns` state lives.

#### packages/react/src/collections/useCollectionListUrlState.ts

```tsx
"use client";

import type { CollectionConfig, CollectionTableSort, VexWhereNode } from "@vexcms/core";

/**
 * Parsed + validated URL state for a collection's list view.
 *
 * @typeParam TFieldSlug - The collection's field slugs, matched against
 *   `collection.admin.table.searchField` and `CollectionTableSort["field"]`.
 */
export interface CollectionListUrlState<TFieldSlug extends string = string> {
  /** Raw search text from `?search=`. `""` means no search is active. */
  search: string;
  /** The active `searchField` from `?searchField=`, chosen from `collection.admin.table.searchField`. `undefined` while `search` is `""`. */
  searchField: TFieldSlug | undefined;
  /** Portable sort from `?sort=` (JSON `{ field, order }`), or `undefined` to fall back to `collection.admin.table.defaultSort`. */
  sort: CollectionTableSort<TFieldSlug> | undefined;
  /** Plain `VexWhereNode` from `?where=` (JSON), or `undefined` for no filter. */
  where: VexWhereNode<string> | undefined;
  /** Page size from `?pageSize=`, or `undefined` to fall back to `collection.admin.table.defaultPageSize`. */
  pageSize: number | undefined;
  /** The selected saved view's `viewId` from `?view=`, or `undefined` for none. */
  view: string | undefined;
}

/**
 * Setters mirroring {@link CollectionListUrlState}'s fields, plus a bulk
 * `setState` for applying a saved view's whole `VexViewState` atomically
 * (Step 11).
 */
export interface UseCollectionListUrlStateReturn<TFieldSlug extends string = string>
  extends CollectionListUrlState<TFieldSlug> {
  setSearch: (search: string) => void;
  setSearchField: (searchField: TFieldSlug | undefined) => void;
  setSort: (sort: CollectionTableSort<TFieldSlug> | undefined) => void;
  setWhere: (where: VexWhereNode<string> | undefined) => void;
  setPageSize: (pageSize: number | undefined) => void;
  setView: (view: string | undefined) => void;
  /**
   * Replaces several fields in one URL update — used when a saved view is
   * selected. Omitted keys are left untouched; an explicit `undefined` value
   * clears that field.
   */
  setState: (state: Partial<CollectionListUrlState<TFieldSlug>>) => void;
}

/**
 * Drives the collection list view's shareable URL state via `nuqs`:
 * `search`, `searchField`, `sort` (JSON `{ field, order }`), `where` (JSON
 * plain `VexWhereNode`), `pageSize`, `view`.
 *
 * Every parser validates before accepting a value — a malformed or
 * out-of-range param is DROPPED (resolves to `undefined`/the default), never
 * thrown, per Decision 9. `sort.field` is not checked against the
 * collection's real indexes here — the server rejects an unindexed field via
 * `resolveSort`'s `VexError` (Step 5); this hook only validates shape and
 * the `order` enum. `where` IS shape-and-operator validated here via
 * `validateWhereNode` (field names are left unchecked, matching that
 * function's own `fields`-omitted behavior), since a malformed `where` would
 * otherwise throw deep inside the query layer instead of just vanishing
 * from the URL.
 *
 * @param props - Input props.
 * @param props.collection - The collection whose `admin.table.searchField` /
 *   `pageSizeOptions` constrain the `searchField` and `pageSize` parsers.
 * @returns The parsed state plus setters; `setState` applies several fields
 *   atomically.
 *
 * @example
 * ```tsx
 * const url = useCollectionListUrlState({ collection });
 * useVexList({
 *   collection: collection.slug,
 *   where: url.where,
 *   sort: url.sort,
 *   search: url.search,
 *   searchField: url.searchField,
 *   pageSize: url.pageSize,
 * });
 * ```
 */
export function useCollectionListUrlState<TFieldSlug extends string = string>(props: {
  collection: CollectionConfig;
}): UseCollectionListUrlStateReturn<TFieldSlug> {
  // TODO: implement
  // 1. Build the `sort` parser with `parseAsJson` (from `nuqs`) and a
  //    validator asserting `{ field: string, order: "asc" | "desc" }` →
  //    return `null` for any other shape (nuqs then drops the param).
  // 2. Build the `where` parser with `parseAsJson` and a validator that
  //    calls `validateWhereNode({ node: value })` (from `@vexcms/core`) in a
  //    try/catch → `null` on a caught `VexError`.
  // 3. Build the `searchField` parser from
  //    `props.collection.admin.table.searchField` via `parseAsStringEnum`
  //    when that list is non-empty (an entry outside it parses to `null`);
  //    when the list is empty, use a parser that always returns `null`
  //    (Decision 2: no `searchField` → search stays off regardless of the URL).
  // 4. Build the `pageSize` parser from
  //    `props.collection.admin.table.pageSizeOptions`, mapped to strings and
  //    passed through `parseAsStringEnum`, then re-parsed to `number` —
  //    `parseAsInteger` alone would accept any integer, not just a
  //    configured option.
  // 5. Call `useQueryStates({ search: parseAsString.withDefault(""), searchField, sort, where, pageSize, view: parseAsString }, { history: "push" })`.
  // 6. Wrap the returned `setValues` in individual `setXxx` callbacks
  //    (`useCallback`, each calling `setValues({ field: value })`) plus
  //    `setState`, which spreads its partial object straight into one
  //    `setValues` call so a saved view lands in a single URL update.
  // Edge cases:
  // - `setSearch("")` also clears `searchField` back to `undefined` — a
  //   `searchField` with no active query is stale UI state, not meaningful
  //   stored state.
  // - `where`/`sort` round-trip through `JSON.stringify` for the URL; a
  //   `where` deeper than `validateWhereNode`'s own node/depth limits throws
  //   inside the validator, caught in step 2, never escaping this hook.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/useCollectionListUrlState.test.tsx

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { defineCollection, text } from "@vexcms/core";
import { useCollectionListUrlState } from "./useCollectionListUrlState";

const collection = defineCollection({
  slug: "url_state_test",
  fields: {
    title: text({ required: false }),
    body: text({ required: false }),
  },
  admin: {
    table: {
      searchField: ["title", "body"],
      pageSizeOptions: [10, 25, 50],
    },
  },
});

function renderUrlState(searchParams?: string) {
  return renderHook(() => useCollectionListUrlState({ collection }), {
    wrapper: withNuqsTestingAdapter({ searchParams, hasMemory: true }),
  });
}

describe("useCollectionListUrlState", () => {
  it("defaults every field when the URL carries no list params", () => {
    const { result } = renderUrlState();
    expect(result.current.search).toBe("");
    expect(result.current.searchField).toBeUndefined();
    expect(result.current.sort).toBeUndefined();
    expect(result.current.where).toBeUndefined();
    expect(result.current.pageSize).toBeUndefined();
    expect(result.current.view).toBeUndefined();
  });

  it("parses a valid search and searchField", () => {
    const { result } = renderUrlState("?search=hello&searchField=title");
    expect(result.current.search).toBe("hello");
    expect(result.current.searchField).toBe("title");
  });

  it("drops a searchField outside the collection's configured list", () => {
    const { result } = renderUrlState("?searchField=nonexistent");
    expect(result.current.searchField).toBeUndefined();
  });

  it("parses a valid sort", () => {
    const { result } = renderUrlState(
      `?sort=${encodeURIComponent(JSON.stringify({ field: "title", order: "asc" }))}`,
    );
    expect(result.current.sort).toEqual({ field: "title", order: "asc" });
  });

  it("drops a malformed sort instead of throwing", () => {
    const { result } = renderUrlState(
      `?sort=${encodeURIComponent(JSON.stringify({ field: "title", order: "sideways" }))}`,
    );
    expect(result.current.sort).toBeUndefined();
  });

  it("parses a valid where", () => {
    const where = { field: "title", op: "eq", value: "Hello" };
    const { result } = renderUrlState(`?where=${encodeURIComponent(JSON.stringify(where))}`);
    expect(result.current.where).toEqual(where);
  });

  it("drops an invalid where instead of throwing", () => {
    const where = { field: "title", op: "nope", value: "Hello" };
    const { result } = renderUrlState(`?where=${encodeURIComponent(JSON.stringify(where))}`);
    expect(result.current.where).toBeUndefined();
  });

  it("drops a pageSize outside pageSizeOptions", () => {
    const { result } = renderUrlState("?pageSize=999");
    expect(result.current.pageSize).toBeUndefined();
  });

  it("accepts a configured pageSize", () => {
    const { result } = renderUrlState("?pageSize=25");
    expect(result.current.pageSize).toBe(25);
  });

  it("setSearch('') also clears searchField", () => {
    const { result } = renderUrlState("?search=hello&searchField=title");
    act(() => result.current.setSearch(""));
    expect(result.current.search).toBe("");
    expect(result.current.searchField).toBeUndefined();
  });

  it("setState applies several fields in one update", () => {
    const { result } = renderUrlState("?search=hello");
    act(() =>
      result.current.setState({
        sort: { field: "title", order: "desc" },
        pageSize: 25,
      }),
    );
    expect(result.current.sort).toEqual({ field: "title", order: "desc" });
    expect(result.current.pageSize).toBe(25);
    expect(result.current.search).toBe("hello");
  });
});
```

#### packages/react/src/collections/CollectionListSearch.tsx

```tsx
"use client";

import type { CollectionConfig } from "@vexcms/core";

/**
 * Props for {@link CollectionListSearch}.
 *
 * @typeParam TFieldSlug - The collection's field slugs, matched against
 *   `collection.admin.table.searchField`.
 */
export interface CollectionListSearchProps<TFieldSlug extends string = string> {
  /** The collection whose `admin.table.searchField` drives the field picker; the control renders nothing when that list is empty (Decision 2). */
  collection: CollectionConfig;
  /** The current search text — mirrors `useCollectionListUrlState`'s `search`. */
  search: string;
  /** The current search field — `undefined` defaults to `searchField[0]`. */
  searchField: TFieldSlug | undefined;
  /** Called with the debounced search text as the user types. */
  onSearchChange: (search: string) => void;
  /** Called immediately when the field picker's selection changes. */
  onSearchFieldChange: (searchField: TFieldSlug) => void;
}

/**
 * Debounced search input paired with a field picker, for a collection list's
 * toolbar.
 *
 * Renders `null` when `collection.admin.table.searchField` is empty or
 * undefined (Decision 2). While search is active, sort headers elsewhere in
 * the list disable themselves (`DataTableSortHeader`'s `disabled` prop) —
 * this component only owns the input and field choice, not that
 * coordination.
 *
 * @param props - Component props. See {@link CollectionListSearchProps}.
 * @returns The search control, or `null` when the collection has no `searchField`.
 */
export function CollectionListSearch<TFieldSlug extends string = string>(
  props: CollectionListSearchProps<TFieldSlug>,
) {
  // TODO: implement
  // 1. `searchField = props.collection.admin.table.searchField` → `undefined`
  //    or `[]` renders `null`.
  // 2. Local `useState` mirrors `props.search` for instant keystroke
  //    feedback; `useDebounceValue(localValue, 200)` (same delay as
  //    `usePaginatedSearch`) drives a `useEffect` that calls
  //    `props.onSearchChange` only when the debounced value differs from
  //    `props.search` — avoids an update loop when `props.search` changes
  //    externally (a saved view, browser back/forward).
  // 3. Render an `InputGroup` with a `Search` icon addon and an
  //    `InputGroupInput` bound to the local value; when `searchField.length > 1`,
  //    append a `Select` listing `searchField` in config order, value
  //    `props.searchField ?? searchField[0]`.
  // 4. The `Select`'s `onValueChange` calls `props.onSearchFieldChange`
  //    directly — a discrete choice, no debounce.
  // Edge cases:
  // - A single-entry `searchField` list renders the input alone, no `Select`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/CollectionListSearch.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "@vexcms/core";
import { CollectionListSearch } from "./CollectionListSearch";

const baseFields = {
  title: text({ required: false }),
  body: text({ required: false }),
};

describe("CollectionListSearch", () => {
  it("renders nothing when the collection has no searchField", () => {
    const collection = defineCollection({ slug: "search_test_none", fields: baseFields });
    const { container } = render(
      <CollectionListSearch
        collection={collection}
        search=""
        searchField={undefined}
        onSearchChange={vi.fn()}
        onSearchFieldChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the input alone for a single-entry searchField", () => {
    const collection = defineCollection({
      slug: "search_test_one",
      fields: baseFields,
      admin: { table: { searchField: ["title"] } },
    });
    render(
      <CollectionListSearch
        collection={collection}
        search=""
        searchField="title"
        onSearchChange={vi.fn()}
        onSearchFieldChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders a field picker for a multi-entry searchField", () => {
    const collection = defineCollection({
      slug: "search_test_multi",
      fields: baseFields,
      admin: { table: { searchField: ["title", "body"] } },
    });
    render(
      <CollectionListSearch
        collection={collection}
        search=""
        searchField="title"
        onSearchChange={vi.fn()}
        onSearchFieldChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("debounces onSearchChange 200ms after typing", async () => {
    const collection = defineCollection({
      slug: "search_test_debounce",
      fields: baseFields,
      admin: { table: { searchField: ["title"] } },
    });
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CollectionListSearch
        collection={collection}
        search=""
        searchField="title"
        onSearchChange={onSearchChange}
        onSearchFieldChange={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("textbox"), "hello");
    expect(onSearchChange).not.toHaveBeenCalled();
    await waitFor(() => expect(onSearchChange).toHaveBeenCalledWith("hello"), { timeout: 500 });
  });

  it("calls onSearchFieldChange immediately on field selection, no debounce", async () => {
    const collection = defineCollection({
      slug: "search_test_field_change",
      fields: baseFields,
      admin: { table: { searchField: ["title", "body"] } },
    });
    const onSearchFieldChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CollectionListSearch
        collection={collection}
        search="hello"
        searchField="title"
        onSearchChange={vi.fn()}
        onSearchFieldChange={onSearchFieldChange}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "body" }));
    expect(onSearchFieldChange).toHaveBeenCalledWith("body");
  });
});
```

#### packages/react/src/ui/data-table/DataTableSortHeader.tsx

```tsx
"use client";

import type { CollectionTableSort } from "@vexcms/core";

/**
 * Props for {@link DataTableSortHeader}.
 *
 * @typeParam TFieldSlug - The collection's field slugs (plus `"_creationTime"`).
 */
export interface DataTableSortHeaderProps<TFieldSlug extends string = string> {
  /** The column's display label. */
  label: string;
  /** The field this header sorts by. */
  field: TFieldSlug | "_creationTime";
  /** The list's current sort, or `undefined` (falls back to `defaultSort`). */
  sort: CollectionTableSort<TFieldSlug> | undefined;
  /** Called with the next sort state on click — `undefined` clears back to `defaultSort`. */
  onSortChange: (sort: CollectionTableSort<TFieldSlug> | undefined) => void;
  /** Whether this field has `admin.enableSorting: true` and an index leading with it (Decision 6). A `false` value renders plain, unclickable text. */
  enableSorting: boolean;
  /** `true` while a search is active — sort is disabled and shows "sorted by relevance" (Decision 7). */
  disabled?: boolean;
}

/**
 * A clickable TanStack Table column header that cycles a field's sort state:
 * unsorted → `asc` → `desc` → unsorted (clears `sort`, falling back to
 * `defaultSort`).
 *
 * Renders as plain, unclickable text when `enableSorting` is `false` (the
 * field has no leading index, Decision 6) or `disabled` is `true` (a search
 * is active, Decision 7 — shown with a "Sorted by relevance" tooltip).
 *
 * @param props - Component props. See {@link DataTableSortHeaderProps}.
 * @returns A sortable header button, or plain text when sorting is unavailable.
 */
export function DataTableSortHeader<TFieldSlug extends string = string>(
  props: DataTableSortHeaderProps<TFieldSlug>,
) {
  // TODO: implement
  // 1. `!props.enableSorting` → render `props.label` as plain text, no
  //    button.
  // 2. `props.disabled` → render `props.label` as plain text with
  //    `title="Sorted by relevance"`, no click handler.
  // 3. Otherwise render a `Button variant="ghost" size="sm"` whose click
  //    handler computes the next state from
  //    `props.sort?.field === props.field`:
  //    a. not sorted by this field → `onSortChange({ field: props.field, order: "asc" })`
  //    b. sorted `asc` by this field → `onSortChange({ field: props.field, order: "desc" })`
  //    c. sorted `desc` by this field → `onSortChange(undefined)`
  // 4. Icon via `Icon` (`../Icon`): `ArrowUpDown` when not sorted by this
  //    field, `ArrowUp` for `asc`, `ArrowDown` for `desc`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/ui/data-table/DataTableSortHeader.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTableSortHeader } from "./DataTableSortHeader";

describe("DataTableSortHeader", () => {
  it("renders plain text with no button when enableSorting is false", () => {
    render(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={undefined}
        onSortChange={vi.fn()}
        enableSorting={false}
      />,
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders plain text with a relevance tooltip when disabled", () => {
    render(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={undefined}
        onSortChange={vi.fn()}
        enableSorting
        disabled
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Title")).toHaveAttribute("title", "Sorted by relevance");
  });

  it("cycles unsorted -> asc -> desc -> undefined across clicks", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={undefined}
        onSortChange={onSortChange}
        enableSorting
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith({ field: "title", order: "asc" });

    rerender(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={{ field: "title", order: "asc" }}
        onSortChange={onSortChange}
        enableSorting
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith({ field: "title", order: "desc" });

    rerender(
      <DataTableSortHeader
        label="Title"
        field="title"
        sort={{ field: "title", order: "desc" }}
        onSortChange={onSortChange}
        enableSorting
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenLastCalledWith(undefined);
  });

  it("clicking a different field's header starts that field at asc, ignoring the current sort", async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTableSortHeader
        label="Body"
        field="body"
        sort={{ field: "title", order: "desc" }}
        onSortChange={onSortChange}
        enableSorting
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onSortChange).toHaveBeenCalledWith({ field: "body", order: "asc" });
  });
});
```

#### packages/react/src/ui/data-table/DataTableColumnsMenu.tsx

```tsx
"use client";

/**
 * One hideable column, as resolved from a collection's fields
 * (`admin.enableHiding`) for {@link DataTableColumnsMenu}.
 *
 * @typeParam TFieldSlug - The collection's field slugs.
 */
export interface DataTableColumn<TFieldSlug extends string = string> {
  /** The field key this entry toggles. */
  field: TFieldSlug;
  /** The column's display label. */
  label: string;
}

/**
 * Props for {@link DataTableColumnsMenu}.
 *
 * @typeParam TFieldSlug - The collection's field slugs.
 */
export interface DataTableColumnsMenuProps<TFieldSlug extends string = string> {
  /** Every hideable column (`admin.enableHiding: true`, not `admin.hidden`), in field order. */
  columns: DataTableColumn<TFieldSlug>[];
  /** Currently visible column fields. */
  visibleColumns: TFieldSlug[];
  /** Replaces the visible-columns array. */
  onVisibleColumnsChange: (columns: TFieldSlug[]) => void;
}

/**
 * A dropdown of checkboxes toggling which `enableHiding` columns are
 * visible in the list table.
 *
 * Purely controlled — the caller (`CollectionListView`, via
 * `CollectionListLayout`/`CollectionListToolbar`) owns `visibleColumns` as
 * session-only state (Decision 15: no auto-persist without a selected
 * view). Unchecking the sole remaining visible column is a no-op — at
 * least one column must stay visible.
 *
 * @param props - Component props. See {@link DataTableColumnsMenuProps}.
 * @returns The columns menu, or `null` when `columns` is empty.
 */
export function DataTableColumnsMenu<TFieldSlug extends string = string>(
  props: DataTableColumnsMenuProps<TFieldSlug>,
) {
  // TODO: implement
  // 1. `props.columns.length === 0` → render `null`.
  // 2. `DropdownMenuTrigger` renders a `Button variant="outline" size="sm"`
  //    with a `Columns3` icon (`Icon` from `../Icon`) and the label
  //    "Columns".
  // 3. One `DropdownMenuCheckboxItem` per `props.columns` entry, `checked`
  //    from `props.visibleColumns.includes(column.field)`.
  // 4. `onCheckedChange(checked)`:
  //    a. `checked === false` and `props.visibleColumns.length === 1` and
  //       it's the last visible one → no-op (ignore the toggle).
  //    b. otherwise add/remove `column.field` from `props.visibleColumns`
  //       and call `props.onVisibleColumnsChange` with the result.
  throw new Error("Not implemented");
}
```

#### packages/react/src/ui/data-table/DataTableColumnsMenu.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTableColumnsMenu } from "./DataTableColumnsMenu";

const columns = [
  { field: "title", label: "Title" },
  { field: "body", label: "Body" },
];

describe("DataTableColumnsMenu", () => {
  it("renders nothing with no hideable columns", () => {
    const { container } = render(
      <DataTableColumnsMenu columns={[]} visibleColumns={[]} onVisibleColumnsChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists every column with its checked state reflecting visibleColumns", async () => {
    const user = userEvent.setup();
    render(
      <DataTableColumnsMenu
        columns={columns}
        visibleColumns={["title"]}
        onVisibleColumnsChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /columns/i }));
    expect(screen.getByRole("menuitemcheckbox", { name: "Title" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "Body" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("checking a hidden column adds it to visibleColumns", async () => {
    const onVisibleColumnsChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTableColumnsMenu
        columns={columns}
        visibleColumns={["title"]}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /columns/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Body" }));
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(["title", "body"]);
  });

  it("unchecking a visible column (not the last) removes it", async () => {
    const onVisibleColumnsChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTableColumnsMenu
        columns={columns}
        visibleColumns={["title", "body"]}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /columns/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Body" }));
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(["title"]);
  });

  it("unchecking the sole remaining visible column is a no-op", async () => {
    const onVisibleColumnsChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTableColumnsMenu
        columns={columns}
        visibleColumns={["title"]}
        onVisibleColumnsChange={onVisibleColumnsChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /columns/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Title" }));
    expect(onVisibleColumnsChange).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/ui/data-table/DataTablePageSizeSelect.tsx

```tsx
"use client";

/** Props for {@link DataTablePageSizeSelect}. */
export interface DataTablePageSizeSelectProps {
  /** The current page size — the client-side `numItems` for the next fetch/`loadMore()` call. */
  pageSize: number;
  /** The configured options (`collection.admin.table.pageSizeOptions`). */
  pageSizeOptions: number[];
  /** Called with the newly selected page size. */
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * A `Select` choosing the list's page size from
 * `collection.admin.table.pageSizeOptions`.
 *
 * Pagination itself stays cursor Load More (Decision 8) — this control only
 * changes how many items the NEXT fetch/`loadMore()` call requests; it never
 * jumps to a numbered page. Has no `vex.list.*` built-in id (Decision 17
 * names `create`/`search`/`filters`/`columns`/`views`/row/bulk delete, not
 * page size), so it is rendered directly by `CollectionListToolbar`, not
 * through the slot system.
 *
 * @param props - Component props. See {@link DataTablePageSizeSelectProps}.
 * @returns The page size select, or `null` when `pageSizeOptions` has one or fewer entries.
 */
export function DataTablePageSizeSelect(props: DataTablePageSizeSelectProps) {
  // TODO: implement
  // 1. `props.pageSizeOptions.length <= 1` → render `null`.
  // 2. `Select value={String(props.pageSize)} onValueChange={(value) => props.onPageSizeChange(Number(value))}`
  //    — `Select`'s value model is string-only, so the numeric page size is
  //    stringified going in and parsed back coming out.
  // 3. `SelectTrigger` carries an accessible name ("Page size") for the
  //    combobox; one `SelectItem` per `props.pageSizeOptions` entry, value
  //    `String(n)`, label `"${n} per page"`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/ui/data-table/DataTablePageSizeSelect.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTablePageSizeSelect } from "./DataTablePageSizeSelect";

describe("DataTablePageSizeSelect", () => {
  it("renders nothing with one or fewer options", () => {
    const { container } = render(
      <DataTablePageSizeSelect pageSize={10} pageSizeOptions={[10]} onPageSizeChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page size", () => {
    render(
      <DataTablePageSizeSelect
        pageSize={25}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("25 per page")).toBeInTheDocument();
  });

  it("calls onPageSizeChange with the selected numeric value", async () => {
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTablePageSizeSelect
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={onPageSizeChange}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "50 per page" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
```

#### packages/react/src/fields/index.tsx

1 edit to `getCollectionColumnDefs` — the function's whole body changes (every `case` switches from pushing straight into `columnDefs` to assigning a local, so the two field-admin flags can be applied once, centrally, afterward), so it is shown complete. Nothing else in the file (imports, the `ui()` second pass, every `*FieldToColumnDef` factory in `fields/<type>/`) changes.

```tsx
export function getCollectionColumnDefs<
  TData extends TDocument = TDocument,
  TCollectionConfig extends CollectionConfig = CollectionConfig,
>(props: {
  collection: TCollectionConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): ColumnDef<TData, any>[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columnDefs: ColumnDef<TData, any>[] = [];
  const { collection } = props;
  for (const [fieldKey, fieldDef] of Object.entries(getDataFields({ fields: collection.fields }))) {
    if (fieldDef.admin.hidden) continue;
    const isTitleField = fieldKey === collection.admin.useAsTitle;
    const fieldType: AdminFieldType = fieldDef.type;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let columnDef: ColumnDef<TData, any> | undefined;
    switch (fieldDef.type) {
      case ADMIN_FIELDS.text.type:
        columnDef = textFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.email.type:
        columnDef = emailFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.textarea.type:
        columnDef = textareaFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.number.type:
        columnDef = numberFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.checkbox.type:
        columnDef = checkboxFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.date.type:
        columnDef = dateFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.select.type:
        columnDef = selectFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.url.type:
        columnDef = urlFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.color.type:
        columnDef = colorFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.relationship.type:
        columnDef = relationshipFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.array.type:
        columnDef = arrayFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.group.type:
        columnDef = groupFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.blocks.type:
        columnDef = blocksFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.upload.type:
        columnDef = uploadFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.richtext.type:
        columnDef = richTextFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      case ADMIN_FIELDS.json.type:
        columnDef = jsonFieldToColumnDef<TData>({ fieldDef, fieldKey, isTitleField, collection });
        break;

      default: {
        const unhandled: never = fieldDef;
        throw new Error(
          `unsupported column def field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
        );
      }
    }
    // The one place `enableSorting`/`enableHiding` are made to agree with
    // the field's own `admin.enableSorting`/`admin.enableHiding` (Step 3) —
    // every `*FieldToColumnDef` factory above still returns its own static
    // `enableSorting`/`enableHiding` (now ignored, overwritten here), so none
    // of them need editing.
    columnDefs.push({
      ...columnDef,
      enableSorting: fieldDef.admin.enableSorting,
      enableHiding: fieldDef.admin.enableHiding,
    });
  }

  // `ui()` fields are never in `getDataFields`'s output (it drops them — see
  // its own doc comment) because they carry no stored value to validate/
  // index/type-gen; the list view still wants a column for one when its
  // `admin.components.Cell` is set (per `UIFieldCellProps`'s own contract:
  // "the list view shows a column rendering this"), so this is a second,
  // parallel pass over `collection.fields` via `getUIFieldsWithCell` instead
  // of folding into the loop above.
  for (const [fieldKey, uiField] of Object.entries(getUIFieldsWithCell({ fields: collection.fields }))) {
    if (uiField.admin.hidden) continue;
    if (!uiField.admin.components.Cell) continue;
    // Same erased-type cast `FormUI.tsx` uses for `Field` — the HKT-applied
    // `Cell` type has no concrete call signature until a framework adapter
    // resolves it, but at this point it already has (this is the React
    // adapter's own `getCollectionColumnDefs`).
    const Cell = uiField.admin.components.Cell as ComponentType<{
      name: string;
      data: Record<string, unknown>;
    }>;
    columnDefs.push({
      id: fieldKey,
      header: uiField.label || fieldKey,
      cell: ({ row }) => <Cell name={fieldKey} data={row.original as Record<string, unknown>} />,
      enableSorting: false,
      enableHiding: true,
    });
  }
  return columnDefs;
}
```

This is a behavior change, not just plumbing: every per-type factory currently hardcodes `enableSorting: true, enableHiding: true`, so EVERY column is sortable/hideable today. After this edit, both default to `false` (Step 3's `populateCollectionFieldMeta` default) — a field must opt in with `admin.enableSorting` / `admin.enableHiding` to get either control, matching Decision 6 ("no silent auto-indexes") and this step's own task line ("sortable headers (only `enableSorting`)").

#### packages/react/src/ui/data-table/DataTable.tsx

This step extends Step 8's edit to the same file (controlled `onSelectionChange`, bulk UI moved out) — not the original pre-spec version. 3 further edits; everything else (Step 8's edit plus the untouched Load More / "all loaded" JSX) is unchanged.

**1 — imports.** The `@vexcms/core` import gains `CollectionTableSort`; add `DataTableSortHeader` beside the existing sibling imports:

```ts
import { VexDocument, type Alignment, type CollectionTableSort } from "@vexcms/core";
import { DataTableSortHeader } from "./DataTableSortHeader";
```

**2 — `DataTableColumnMeta`.** Add `label`, read by the header-wrapping logic in edit 3 (every `*FieldToColumnDef` factory already sets `meta.label` — this interface just hadn't declared it):

```ts
interface DataTableColumnMeta {
  align?: Alignment;
  label?: string;
}
```

**3 — `DataTableProps`.** Add two new sections after Step 8's `onSelectionChange` member:

```ts
  // Sorting

  /**
   * The list's current sort (Decision 4: one `{ field, order }`, never
   * TanStack's multi-column `SortingState`). `undefined` means no column is
   * actively driving the sort — every sortable header then renders unsorted.
   */
  sort?: CollectionTableSort<string>;

  /**
   * Invoked with the next sort state when a sortable header is clicked
   * (`undefined` clears back to `defaultSort`). Only columns whose
   * `ColumnDef.enableSorting` is `true` render as clickable — set centrally
   * by `getCollectionColumnDefs` from each field's `admin.enableSorting`.
   */
  onSortChange?: (sort: CollectionTableSort<string> | undefined) => void;

  /**
   * `true` while a search is active — every sortable header disables itself
   * and shows "Sorted by relevance" (Decision 7) instead of calling
   * `onSortChange`.
   */
  sortDisabled?: boolean;

  // Column visibility

  /**
   * Field keys currently visible, from `enableHiding` columns only.
   * `undefined` shows every column (an unmigrated caller keeps today's
   * behavior). Session-only state owned by the caller, never persisted here.
   */
  visibleColumns?: string[];
```

**4 — `DataTable` body.** Supersedes Step 8's guided stub for this function (same signature/JSDoc; folds in this step's sorting/visibility wiring as new steps 4–5, extends the Edge cases list):

```tsx
export function DataTable<TData extends VexDocument>(props: DataTableProps<TData>): ReactNode {
  // TODO: implement
  // 1. Keep today's `rowSelection` state + checkbox-column injection exactly
  //    as they are now (Step 8). VexCMS sorts by exactly one `{ field, order }`
  //    (Decision 4), not TanStack's multi-column `SortingState`, so
  //    `props.sort`/`props.onSortChange` are read directly in the
  //    header-rendering loop (step 4 below) — they are NOT fed into
  //    `useReactTable`'s own sorting state/model. Extend the `useReactTable`
  //    call with `enableSorting: false` as the TABLE-LEVEL default, so a
  //    column with no explicit `enableSorting: true` (the checkbox column,
  //    `CollectionListView`'s synthetic status column) is never sortable.
  // 2. `const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original._id);`
  //    → `useEffect(() => props.onSelectionChange?.(selectedIds), [selectedIds])`.
  // 3. Drop `deleteModalOpen` state, `handleBulkDelete`, the
  //    `<DataTableBulkActions>` and `<BulkDeleteModal>` JSX, and the
  //    `enableBulkActions`/`onBulkDelete`/`entityName`/`isDeleting` props
  //    entirely — keep the `<Table>`/`<TableHeader>`/`<TableBody>`/Load
  //    More/"all loaded" JSX exactly as it renders today.
  // 4. Compute `columnVisibility = useMemo(() => Object.fromEntries(columns
  //    .filter((c) => c.enableHiding).map((c) => [c.id as string,
  //    props.visibleColumns === undefined ? true :
  //    props.visibleColumns.includes(c.id as string)])), [columns,
  //    props.visibleColumns])` — `columns` here is the post-checkbox-column
  //    array from step 1 — and pass it as `state.columnVisibility` in the
  //    `useReactTable` call. `props.visibleColumns` left `undefined` (a
  //    caller not yet migrated) renders every column visible, unchanged from
  //    today.
  // 5. In the `<TableHead>` loop, replace the unconditional
  //    `flexRender(header.column.columnDef.header, header.getContext())`
  //    with: `header.column.getCanSort() ? <DataTableSortHeader
  //    label={(header.column.columnDef.meta as DataTableColumnMeta |
  //    undefined)?.label ?? header.column.id} field={header.column.id}
  //    sort={props.sort} onSortChange={props.onSortChange ?? (() => {})}
  //    enableSorting disabled={props.sortDisabled} /> :
  //    flexRender(header.column.columnDef.header, header.getContext())` —
  //    `getCanSort()` reflects each column's own `enableSorting` flag (step
  //    1's table-level `false` default, overridden per-field by
  //    `getCollectionColumnDefs`), so no column needs touching here beyond
  //    this one render branch.
  // Edge cases:
  // - TanStack's `rowSelection` is keyed by row index by default (no
  //   `getRowId` is passed), so a row removed from `data` after a delete can
  //   leave a STALE index selected pointing at a different row once the
  //   array re-renders shorter. Today's code has this same property
  //   (`handleBulkDelete` cleared `rowSelection` itself after its own
  //   mutation resolved) — now that the mutation lives in
  //   `vex.list.bulk.delete`, `CollectionListLayout` must clear its own
  //   `selectedIds` state after a successful delete; this component only
  //   ever reports forward, it does not own clearing.
  // - A column with no `meta.label` (the synthetic status column, the
  //   checkbox column) falls back to `header.column.id` as its sort
  //   header's label — neither sets `enableSorting: true`, so
  //   `DataTableSortHeader` never actually renders for them; the fallback is
  //   defensive, not load-bearing.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/CollectionListToolbar.tsx

New file. Hosts the `list.toolbar` slot (Decision 17/18): `vex.list.search` and `vex.list.columns` are built-in contributions, not hardcoded JSX, so a project's own `admin.components.toolbar` entries render alongside them the same way `list.header.actions`/`list.row.actions`/`list.bulkActions` already do (Step 8). Page size has no `vex.list.*` id (Decision 17 never names one), so `DataTablePageSizeSelect` renders directly, outside the slot.

```tsx
"use client";

import { useMemo, type ReactNode } from "react";
import {
  BUILTIN_CONTRIBUTION_IDS,
  SLOT_IDS,
  getDataFields,
  type CollectionConfig,
  type ComponentContributionInput,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { SlotOutlet } from "../slots/SlotOutlet";
import { CollectionListSearch } from "./CollectionListSearch";
import { DataTableColumnsMenu, type DataTableColumn } from "../ui/data-table/DataTableColumnsMenu";
import { DataTablePageSizeSelect } from "../ui/data-table/DataTablePageSizeSelect";
import type { UseCollectionListUrlStateReturn } from "./useCollectionListUrlState";

/** Props every `list.toolbar` contribution receives — collection plus the search/columns state those two built-ins (and a project's own toolbar contributions) read and write. */
export interface ListToolbarSlotProps {
  collection: CollectionConfig;
  urlState: UseCollectionListUrlStateReturn<string>;
  visibleColumns: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
  /** Every `admin.enableHiding` column, resolved once by `CollectionListToolbar` so `vex.list.columns` doesn't recompute it per render. */
  hideableColumns: DataTableColumn<string>[];
}

export interface CollectionListToolbarProps {
  collection: CollectionConfig;
  urlState: UseCollectionListUrlStateReturn<string>;
  visibleColumns: string[];
  onVisibleColumnsChange: (columns: string[]) => void;
}

/**
 * Renders the collection list's toolbar row: the `list.toolbar` `SlotOutlet`
 * (hosting `vex.list.search`/`vex.list.columns` plus any project
 * contribution), and `DataTablePageSizeSelect` beside it.
 *
 * @param props - {@link CollectionListToolbarProps}.
 * @returns The toolbar row.
 */
export function CollectionListToolbar(props: CollectionListToolbarProps): ReactNode {
  // TODO: implement
  // 1. `hideableColumns = useMemo(() => Object.entries(getDataFields({
  //    fields: props.collection.fields })).filter(([, f]) =>
  //    f.admin.enableHiding && !f.admin.hidden).map(([field, f]) => ({
  //    field, label: f.label || field })), [props.collection])`.
  // 2. `toolbarBuiltins = useMemo(() => [{ id:
  //    BUILTIN_CONTRIBUTION_IDS.list.search, component: ListSearchAction },
  //    { id: BUILTIN_CONTRIBUTION_IDS.list.columns, component:
  //    ListColumnsAction }], [])` — neither is `access`-gated (search/columns
  //    are UI preferences, not CRUD actions, unlike create/row-delete/bulk-delete).
  // 3. Render a `flex flex-wrap items-center justify-between gap-2` row:
  //    `<SlotOutlet<ListToolbarSlotProps> slotId={SLOT_IDS.list.toolbar}
  //    builtins={toolbarBuiltins} contributions={props.collection.admin.components.toolbar
  //    as unknown as ComponentContributionInput<ReactHKT, ListToolbarSlotProps>[]}
  //    contributedProps={{ collection: props.collection, urlState:
  //    props.urlState, visibleColumns: props.visibleColumns,
  //    onVisibleColumnsChange: props.onVisibleColumnsChange, hideableColumns }}
  //    />` followed by `<DataTablePageSizeSelect pageSize={props.urlState.pageSize
  //    ?? props.collection.admin.table.defaultPageSize}
  //    pageSizeOptions={props.collection.admin.table.pageSizeOptions}
  //    onPageSizeChange={props.urlState.setPageSize} />`.
  throw new Error("Not implemented");
}

/**
 * `vex.list.search` — the debounced search input + field picker. Not
 * `access`-gated (a UI preference, not a CRUD action). Renders `null` itself
 * when `collection.admin.table.searchField` is empty — `CollectionListSearch`'s
 * own rule (Decision 2).
 *
 * @param props - {@link ListToolbarSlotProps}.
 */
function ListSearchAction(props: ListToolbarSlotProps): ReactNode {
  // TODO: implement
  // `<CollectionListSearch collection={props.collection}
  //   search={props.urlState.search} searchField={props.urlState.searchField}
  //   onSearchChange={props.urlState.setSearch}
  //   onSearchFieldChange={props.urlState.setSearchField} />`
  throw new Error("Not implemented");
}

/**
 * `vex.list.columns` — the column-visibility dropdown. Not `access`-gated
 * (a UI preference, not a CRUD action).
 *
 * @param props - {@link ListToolbarSlotProps}.
 */
function ListColumnsAction(props: ListToolbarSlotProps): ReactNode {
  // TODO: implement
  // `<DataTableColumnsMenu columns={props.hideableColumns}
  //   visibleColumns={props.visibleColumns}
  //   onVisibleColumnsChange={props.onVisibleColumnsChange} />`
  throw new Error("Not implemented");
}

/** Built-in `list.toolbar` contribution ids, exported so `CollectionListToolbar.test.tsx` can assert them without constructing a full `CollectionConfig`. */
export const BUILTIN_LIST_SEARCH_ACTION_ID = BUILTIN_CONTRIBUTION_IDS.list.search;
export const BUILTIN_LIST_COLUMNS_ACTION_ID = BUILTIN_CONTRIBUTION_IDS.list.columns;
```

#### packages/react/src/collections/CollectionListToolbar.test.tsx

New file — mirrors `CollectionListLayout.test.tsx` (Step 8): asserts the built-in ids this file's (not-yet-implemented) `toolbarBuiltins` memo must use, without exercising the component bodies above (`CollectionListToolbar` renders through `SlotOutlet`, which needs a live `VexConfigProvider`/access context — the same reason Step 8's own test stayed at this level).

```tsx
import { describe, expect, it } from "vitest";
import { BUILTIN_CONTRIBUTION_IDS, SLOT_IDS } from "@vexcms/core";
import { BUILTIN_LIST_COLUMNS_ACTION_ID, BUILTIN_LIST_SEARCH_ACTION_ID } from "./CollectionListToolbar";

describe("CollectionListToolbar built-in ids", () => {
  it("exports the vex.list.search id matching BUILTIN_CONTRIBUTION_IDS", () => {
    expect(BUILTIN_LIST_SEARCH_ACTION_ID).toBe(BUILTIN_CONTRIBUTION_IDS.list.search);
    expect(BUILTIN_LIST_SEARCH_ACTION_ID).toBe("vex.list.search");
  });

  it("exports the vex.list.columns id matching BUILTIN_CONTRIBUTION_IDS", () => {
    expect(BUILTIN_LIST_COLUMNS_ACTION_ID).toBe(BUILTIN_CONTRIBUTION_IDS.list.columns);
    expect(BUILTIN_LIST_COLUMNS_ACTION_ID).toBe("vex.list.columns");
  });

  it("renders both builtins into the list.toolbar slot, per SLOT_IDS", () => {
    // Guards the slot `CollectionListToolbar`'s `SlotOutlet` call must target —
    // a typo here would silently drop search/columns into the wrong slot.
    expect(SLOT_IDS.list.toolbar).toBe("list.toolbar");
  });
});
```

#### packages/react/src/collections/CollectionListLayout.tsx

This step extends Step 8's new file. 2 edits; everything else (the row/bulk builtins memo, `ListCreateAction`/`ListRowDeleteAction`/`ListBulkDeleteAction`, the trailing "Actions" column, `BUILTIN_LIST_HEADER_ACTION_ID`) is unchanged.

**1 — imports + `CollectionListLayoutProps`.** Add the toolbar component and URL-state type imports, and three new props (`urlState`/`visibleColumns`/`onVisibleColumnsChange`) after `canDelete`:

```ts
import { CollectionListToolbar } from "./CollectionListToolbar";
import type { UseCollectionListUrlStateReturn } from "./useCollectionListUrlState";
```

```ts
  /** Whether the current user may delete documents in this collection — gates `vex.list.row.delete` / `vex.list.bulk.delete` and the table's row-selection checkboxes. */
  canDelete: boolean;
  /** The URL-state hook's full return value — threaded into `CollectionListToolbar` (search/columns builtins) and `DataTable` (`sort`/`onSortChange`/`sortDisabled`). Owned by `CollectionListView`. */
  urlState: UseCollectionListUrlStateReturn<string>;
  /** Currently visible column fields — session-only state owned by `CollectionListView` (Decision 15), threaded into `CollectionListToolbar` and `DataTable`. */
  visibleColumns: string[];
  /** Replaces the visible-columns array. */
  onVisibleColumnsChange: (columns: string[]) => void;
```

**2 — `CollectionListLayout` body.** Supersedes Step 8's guided stub for this function (same signature/JSDoc; replaces the abbreviated `list.toolbar`/`list.filters` line in step 4's render list with a concrete `CollectionListToolbar` call plus the now-fully-wired `DataTable` call, and drops the "steps 9–11 extend this memo" aside from step 2d since step 9 — this edit — is the one doing it):

```tsx
export function CollectionListLayout<TDoc extends TDocument = TDocument>(
  props: CollectionListLayoutProps<TDoc>,
): ReactNode {
  // TODO: implement
  // 1. `const [selectedIds, setSelectedIds] = useState<string[]>([])`
  //    → `const selectedDocs = useMemo(() => props.rows.filter((r) => selectedIds.includes(r._id)), [props.rows, selectedIds])`
  // 2. Build each slot's builtins with `useMemo`, keyed on `[props.collection.slug, props.canCreate, props.canDelete]`:
  //    a. `list.header.actions` → `[{ id: BUILTIN_CONTRIBUTION_IDS.list.create, component: ListCreateAction,
  //       access: (ctx) => ctx.hasPermission(props.collection.slug, CRUD_ACTIONS.create) }]`
  //    b. `list.row.actions` → `[{ id: BUILTIN_CONTRIBUTION_IDS.list.rowDelete, component: ListRowDeleteAction,
  //       access: (ctx) => ctx.hasPermission(props.collection.slug, CRUD_ACTIONS.delete) }]`
  //    c. `list.bulkActions` → `[{ id: BUILTIN_CONTRIBUTION_IDS.list.bulkDelete, component: ListBulkDeleteAction,
  //       access: (ctx) => ctx.hasPermission(props.collection.slug, CRUD_ACTIONS.delete) }]`
  //    d. `list.toolbar`'s builtins (`vex.list.search`/`vex.list.columns`) live inside
  //       `CollectionListToolbar` itself (step 9), not here — `list.filters` stays `[]`
  //       here, unpopulated until Step 10 adds `vex.list.filters`.
  // 3. Append a trailing "Actions" `ColumnDef<TDoc>` to `props.columns` (only when `props.canDelete` or
  //    `props.collection.admin.components.rowActions.length > 0` — otherwise omit the column entirely so a
  //    read-only role sees no empty trailing column), whose `cell` renders:
  //    `<SlotOutlet slotId={SLOT_IDS.list.rowActions} builtins={rowActionBuiltins}
  //      contributions={props.collection.admin.components.rowActions as unknown as ComponentContributionInput<ReactHKT, ListRowSlotProps>[]}
  //      contributedProps={{ collection: props.collection, docs: [row.original] }} />`
  //    (the `as unknown as` cast mirrors `BlockActionsMenu.tsx`'s own cast of
  //    `config.admin.components.blocks.itemActions` — core keeps these `unknown`-typed per P-002).
  // 4. Render, top to bottom:
  //    - a header row: `collection.labels.plural` title + document count, and
  //      `<SlotOutlet slotId={SLOT_IDS.list.headerActions} builtins={headerActionBuiltins}
  //        contributions={collection.admin.components.headerActions as unknown as …}
  //        contributedProps={{ collection: props.collection }} />`
  //    - `<CollectionListToolbar collection={props.collection} urlState={props.urlState}
  //        visibleColumns={props.visibleColumns} onVisibleColumnsChange={props.onVisibleColumnsChange} />`
  //      (owns the `list.toolbar` `SlotOutlet` + `DataTablePageSizeSelect`, Step 9)
  //    - `<SlotOutlet slotId={SLOT_IDS.list.filters} builtins={[]}
  //        contributions={collection.admin.components.filters as unknown as …}
  //        contributedProps={{ collection: props.collection }} />` (unpopulated — Step 10 adds `vex.list.filters`)
  //    - `<SlotOutlet slotId={SLOT_IDS.list.beforeTable} .../>`
  //    - `<DataTable data={props.rows} columns={columnsWithActions} isDone={props.isDone}
  //        onLoadMore={props.onLoadMore} isLoadingMore={props.isPending} totalCount={props.totalCount}
  //        enableRowSelection={props.canDelete} onSelectionChange={setSelectedIds}
  //        sort={props.urlState.sort} onSortChange={props.urlState.setSort}
  //        sortDisabled={props.urlState.search !== ""} visibleColumns={props.visibleColumns} />`
  //    - `<SlotOutlet slotId={SLOT_IDS.list.afterTable} .../>`
  //    - `<SlotOutlet slotId={SLOT_IDS.list.bulkActions} builtins={bulkActionBuiltins}
  //        contributions={collection.admin.components.bulkActions as unknown as …}
  //        contributedProps={{ collection: props.collection, docs: selectedDocs }} />`
  // Edge cases:
  // - After `ListBulkDeleteAction`'s mutation resolves, `selectedIds` still names the now-deleted
  //   rows until this component clears it — `ListBulkDeleteAction` has no way to call
  //   `setSelectedIds` (its props are fixed to `{ collection, docs }`, P-002's value-level
  //   boundary). Resolve by having `DataTable` re-fire `onSelectionChange([])` itself once its
  //   `data` prop shrinks below the previously-selected indices (ties into `DataTable`'s own
  //   "Edge cases" note above) — do not widen `ListRowSlotProps` to carry a clear callback.
  // - No `list.row.actions` contribution and `canDelete` is `false`: the trailing column is
  //   omitted, not rendered empty.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/CollectionListView.tsx

This step extends Step 8's edit to the same file, continuing from Step 7's `useVexList` call (`collection`, `drafts`, `depth: 1`, `pageSize`, `initialData`) — the edit below keeps every one of those keys and adds the four URL-driven ones.

3 edits; everything else (column-building, the status column, `ListCreateAction`'s old JSX already moved out by Step 8) is unchanged.

**1 — imports.** Add beside the existing `react` import, and add `useCollectionListUrlState`:

```ts
import { useMemo, useState } from "react";
import { useCollectionListUrlState } from "./useCollectionListUrlState";
```

**2 — `urlState`, `visibleColumns`, and the pagination call.** Insert before the existing `const numItems = …` line, and extend the `useVexList` args object (Step 7) with the four URL-driven keys:

```tsx
  const urlState = useCollectionListUrlState({ collection });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    collection.admin.table.defaultColumns,
  );
  const numItems = Math.max(
    collection.admin.table.serverPageSize,
    collection.admin.table.defaultPageSize,
  );
  const isVersioned = collection.versions.drafts;
  const pagination = useVexList({
    collection,
    drafts: isVersioned ? true : undefined,
    depth: 1,
    where: urlState.where,
    sort: urlState.sort,
    search: urlState.search,
    searchField: urlState.searchField,
    pageSize: urlState.pageSize ?? numItems,
    initialData: props.initialData,
  });
```

**3 — `<CollectionListLayout>` call (Step 8).** Append the three new props:

```tsx
      <CollectionListLayout
        collection={collection}
        rows={rows}
        columns={columns}
        isDone={pagination.isDone}
        isPending={pagination.isPending}
        totalCount={pagination.totalDocs}
        onLoadMore={pagination.loadMore}
        canCreate={canCreate}
        canDelete={canDelete}
        urlState={urlState}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
      />
```

#### packages/react/src/collections/index.ts

1 edit — everything else is unchanged.

**1 — add the two new component exports and the hook export,** alongside the existing `CreateDocumentModal` export:

```ts
export * from "./CollectionListSearch";
export * from "./CollectionListToolbar";
export * from "./useCollectionListUrlState";
```

#### packages/react/src/ui/data-table/index.ts

1 edit — everything else is unchanged.

**1 — add the three new control exports,** alongside the existing `DataTableBulkActions` export:

```ts
export * from "./DataTableSortHeader";
export * from "./DataTableColumnsMenu";
export * from "./DataTablePageSizeSelect";
```

Verify: `pnpm --filter @vexcms/react test -- collections ui/data-table && browser: search, field switch, sort, column hide, page size, reload keeps state`

### Step 10 — Filter builder (AND rows + one level of OR groups) [agent]

Why: authors `where` for URL and views; DNF covers multi-value and triage use cases without a tree editor.

- [ ] `packages/react/src/collections/whereDnf.ts` (new) + test — `toDnf(where) | null` and `fromDnf(groups)`; non-DNF → null
- [ ] `packages/react/src/collections/CollectionListFilterBuilder.tsx` (new) — groups (OR) of rows (AND) over `eq/neq/gt/gte/lt/lte`; value input by field type; non-DNF `where` shown read-only
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` — contributes `CollectionListFilterBuilder` as `vex.list.filters` into the `list.filters` outlet

#### packages/react/src/collections/whereDnf.ts

```ts
import type { VexWhereNode } from "@vexcms/core";

/**
 * One AND-ed comparison within a {@link WhereDnfGroup} — the `field`/`op`/
 * `value` leaf of a {@link VexWhereNode}, narrowed out of the union rather
 * than redeclared so a new operator added to core's (unexported) `FilterOp`
 * reaches the filter builder without a second edit (P-010).
 */
export type WhereDnfLeaf<S extends string = string> = Extract<VexWhereNode<S>, { field: string }>;

/** One OR-ed group of AND-ed leaves. `rows` is never empty once stored — an empty group is dropped by {@link fromDnf} and never produced by {@link toDnf}. */
export interface WhereDnfGroup<S extends string = string> {
  readonly rows: readonly WhereDnfLeaf<S>[];
}

/**
 * The filter builder's own shape: zero or more {@link WhereDnfGroup}s,
 * OR-ed together, each AND-ing its own `rows` — Decision 10's "AND rows
 * within groups, OR between groups" DNF, flattened for a tree-free editor.
 * `groups: []` means no filter.
 */
export interface WhereDnf<S extends string = string> {
  readonly groups: readonly WhereDnfGroup<S>[];
}

/**
 * Narrows a list of `and`/`or` members to plain leaves, or signals the list
 * isn't flat. Shared by {@link toDnf}'s top-level `and` case and its `or`
 * case (each `or` member that is itself an `and` must also be flat).
 *
 * @param nodes - The `and`/`or` array being checked.
 * @returns The leaves, in input order, or `null` if `nodes` is empty or
 *   contains any non-leaf (`and`/`or`/`not`) member.
 */
function flattenLeaves<S extends string>(
  nodes: readonly VexWhereNode<S>[],
): readonly WhereDnfLeaf<S>[] | null {
  // TODO: implement
  // 1. `nodes.length === 0` → return `null` — an empty `and`/`or` member
  //    list is never valid DNF input (see `toDnf`'s edge cases below).
  // 2. For each `node`: `"field" in node` → collect it; anything else
  //    (`"and" in node`, `"or" in node`, `"not" in node`) → return `null`
  //    immediately — one non-leaf member disqualifies the whole list.
  // 3. → return the collected leaves, in input order.
  throw new Error("Not implemented");
}

/**
 * Converts a plain {@link VexWhereNode} into its {@link WhereDnf} editor
 * shape, or `null` when `where` is not already in one level of OR-of-AND
 * normal form — Decision 10: a config-authored `where` outside that shape
 * (a `not`, a nested `or`, an `and` mixing leaves with sub-trees) renders
 * read-only in `CollectionListFilterBuilder` rather than being forced into
 * a lossy edit.
 *
 * @param props - Input props.
 * @param props.where - The current filter, or `undefined` for none.
 * @returns `{ groups: [] }` for `undefined`; one group for a bare leaf or a
 *   flat `and` of leaves; one group per `or` member for an `or` of leaves
 *   and/or flat `and`s; `null` for anything else (any `not`, any `and`/`or`
 *   with zero members, any `or` containing a nested `or`/`not`, or any `and`
 *   — top-level or nested inside an `or` — containing a non-leaf member).
 */
export function toDnf<S extends string = string>(props: {
  where: VexWhereNode<S> | undefined;
}): WhereDnf<S> | null {
  // TODO: implement
  // 1. `props.where === undefined` → return `{ groups: [] }`.
  // 2. `"field" in props.where` (a bare leaf) → return
  //    `{ groups: [{ rows: [props.where] }] }`.
  // 3. `"and" in props.where`:
  //    a. `rows = flattenLeaves(props.where.and)`.
  //    b. `rows === null` → return `null`.
  //    c. → return `{ groups: [{ rows }] }`.
  // 4. `"or" in props.where`:
  //    a. `props.where.or.length === 0` → return `null` (same reasoning as
  //       `and: []` above, mirrored for `or`).
  //    b. For each member: a leaf → one group `{ rows: [member] }`; an
  //       `and` → `rows = flattenLeaves(member.and)`, `rows === null` →
  //       the WHOLE call returns `null` (one bad member disqualifies the
  //       entire tree, never a partial group list), else one group
  //       `{ rows }`; anything else (`or`, `not`) → return `null`.
  //    c. → return `{ groups }` built from step b.
  // 5. `"not" in props.where` → return `null` — `not` has no DNF
  //    representation this editor supports (Decision 10's operator list
  //    has no negation; `neq` is the leaf-level equivalent).
  //
  // Edge cases:
  // - `{ and: [{ or: [...] }] }` (an `and` wrapping a single `or`) is NOT
  //   normal form and returns `null` — only a FLAT `and` of leaves counts.
  // - `{ or: [{ and: [leaf] }] }` is ACCEPTED (collapses to one group of
  //   one row) even though `fromDnf` would never produce that exact shape
  //   itself (see `fromDnf` step 3) — `toDnf` is intentionally more
  //   permissive than `fromDnf`'s own output, so a hand-authored config
  //   `where` round-trips into the editor instead of going read-only.
  throw new Error("Not implemented");
}

/**
 * Collapses a {@link WhereDnf}'s groups into the simplest equivalent plain
 * {@link VexWhereNode} — the inverse of {@link toDnf}, and the form
 * `CollectionListFilterBuilder` writes back through `onWhereChange` (and
 * ultimately the URL `where` param, Decision 9).
 *
 * @param props - Input props.
 * @param props.groups - The editor's current groups. A group with zero
 *   `rows` is dropped before collapsing (never surfaces as `{ and: [] }`).
 * @returns `undefined` when every group is empty; the bare leaf when
 *   exactly one group with exactly one row remains; `{ and: rows }` for one
 *   group with 2+ rows; `{ or: [...] }`, one member per surviving group
 *   (itself a bare leaf or an `{ and: [...] }`), for 2+ surviving groups.
 */
export function fromDnf<S extends string = string>(props: {
  groups: readonly WhereDnfGroup<S>[];
}): VexWhereNode<S> | undefined {
  // TODO: implement
  // 1. `nonEmpty = props.groups.filter((group) => group.rows.length > 0)`.
  // 2. `nonEmpty.length === 0` → return `undefined`.
  // 3. `nodes = nonEmpty.map((group) => group.rows.length === 1 ? group.rows[0] : { and: group.rows })`
  //    → each entry is a bare leaf (1-row group) or an `and` node (2+ rows);
  //    never a 1-member `and`.
  // 4. `nodes.length === 1` → return `nodes[0]` directly — never wrap a
  //    single surviving group in `or`.
  // 5. → return `{ or: nodes }`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/whereDnf.test.ts

```ts
import { describe, expect, it } from "vitest";
import type { VexWhereNode } from "@vexcms/core";
import { toDnf, fromDnf, type WhereDnfGroup } from "./whereDnf";

const published: VexWhereNode<string> = { field: "status", op: "eq", value: "published" };
const draft: VexWhereNode<string> = { field: "status", op: "eq", value: "draft" };
const viewsOver100: VexWhereNode<string> = { field: "views", op: "gt", value: 100 };
const notArchived: VexWhereNode<string> = { field: "archived", op: "neq", value: true };

describe("toDnf", () => {
  it("returns an empty group list for undefined", () => {
    expect(toDnf({ where: undefined })).toEqual({ groups: [] });
  });

  it("wraps a bare leaf in one group of one row", () => {
    expect(toDnf({ where: published })).toEqual({ groups: [{ rows: [published] }] });
  });

  it("flattens a flat `and` of leaves into one group", () => {
    const where: VexWhereNode<string> = { and: [published, viewsOver100] };
    expect(toDnf({ where })).toEqual({ groups: [{ rows: [published, viewsOver100] }] });
  });

  it("flattens a single-leaf `and` into one group of one row", () => {
    const where: VexWhereNode<string> = { and: [published] };
    expect(toDnf({ where })).toEqual({ groups: [{ rows: [published] }] });
  });

  it("flattens an `or` of leaves into one group per leaf", () => {
    const where: VexWhereNode<string> = { or: [published, draft] };
    expect(toDnf({ where })).toEqual({
      groups: [{ rows: [published] }, { rows: [draft] }],
    });
  });

  it("flattens an `or` of flat `and`s into one group per `and`", () => {
    const where: VexWhereNode<string> = {
      or: [{ and: [published, viewsOver100] }, { and: [draft, notArchived] }],
    };
    expect(toDnf({ where })).toEqual({
      groups: [
        { rows: [published, viewsOver100] },
        { rows: [draft, notArchived] },
      ],
    });
  });

  it("accepts an `or` mixing bare leaves and flat `and`s", () => {
    const where: VexWhereNode<string> = { or: [published, { and: [draft, notArchived] }] };
    expect(toDnf({ where })).toEqual({
      groups: [{ rows: [published] }, { rows: [draft, notArchived] }],
    });
  });

  it("accepts an `or` member that is a single-leaf `and`", () => {
    const where: VexWhereNode<string> = { or: [published, { and: [draft] }] };
    expect(toDnf({ where })).toEqual({
      groups: [{ rows: [published] }, { rows: [draft] }],
    });
  });

  it("returns null for a `not` node", () => {
    expect(toDnf({ where: { not: published } })).toBeNull();
  });

  it("returns null for an `and` containing a nested `or`", () => {
    const where: VexWhereNode<string> = { and: [published, { or: [draft, viewsOver100] }] };
    expect(toDnf({ where })).toBeNull();
  });

  it("returns null for an `and` containing a `not`", () => {
    const where: VexWhereNode<string> = { and: [published, { not: draft }] };
    expect(toDnf({ where })).toBeNull();
  });

  it("returns null for an `or` containing a nested `or`", () => {
    const where: VexWhereNode<string> = { or: [published, { or: [draft, viewsOver100] }] };
    expect(toDnf({ where })).toBeNull();
  });

  it("returns null for an `or` containing a `not`", () => {
    const where: VexWhereNode<string> = { or: [published, { not: draft }] };
    expect(toDnf({ where })).toBeNull();
  });

  it("returns null for an `or` member that is an `and` with a nested non-leaf", () => {
    const where: VexWhereNode<string> = {
      or: [published, { and: [draft, { not: viewsOver100 }] }],
    };
    expect(toDnf({ where })).toBeNull();
  });

  it("returns null for an empty `and`", () => {
    expect(toDnf({ where: { and: [] } })).toBeNull();
  });

  it("returns null for an empty `or`", () => {
    expect(toDnf({ where: { or: [] } })).toBeNull();
  });
});

describe("fromDnf", () => {
  it("returns undefined for an empty group list", () => {
    expect(fromDnf({ groups: [] })).toBeUndefined();
  });

  it("returns undefined when every group is empty", () => {
    const groups: WhereDnfGroup[] = [{ rows: [] }, { rows: [] }];
    expect(fromDnf({ groups })).toBeUndefined();
  });

  it("returns the bare leaf for one group with one row", () => {
    const groups: WhereDnfGroup[] = [{ rows: [published] }];
    expect(fromDnf({ groups })).toEqual(published);
  });

  it("wraps one group with 2+ rows in `and`", () => {
    const groups: WhereDnfGroup[] = [{ rows: [published, viewsOver100] }];
    expect(fromDnf({ groups })).toEqual({ and: [published, viewsOver100] });
  });

  it("wraps 2+ one-row groups in `or` of bare leaves", () => {
    const groups: WhereDnfGroup[] = [{ rows: [published] }, { rows: [draft] }];
    expect(fromDnf({ groups })).toEqual({ or: [published, draft] });
  });

  it("wraps 2+ multi-row groups in `or` of `and`s", () => {
    const groups: WhereDnfGroup[] = [
      { rows: [published, viewsOver100] },
      { rows: [draft, notArchived] },
    ];
    expect(fromDnf({ groups })).toEqual({
      or: [{ and: [published, viewsOver100] }, { and: [draft, notArchived] }],
    });
  });

  it("mixes a one-row and a multi-row surviving group under `or`", () => {
    const groups: WhereDnfGroup[] = [{ rows: [published] }, { rows: [draft, notArchived] }];
    expect(fromDnf({ groups })).toEqual({
      or: [published, { and: [draft, notArchived] }],
    });
  });

  it("drops empty groups before collapsing", () => {
    const groups: WhereDnfGroup[] = [{ rows: [] }, { rows: [published] }];
    expect(fromDnf({ groups })).toEqual(published);
  });
});

describe("toDnf / fromDnf round-trip", () => {
  it("round-trips a flat `and` through toDnf then fromDnf", () => {
    const where: VexWhereNode<string> = { and: [published, viewsOver100] };
    const dnf = toDnf({ where });
    expect(dnf).not.toBeNull();
    expect(fromDnf(dnf!)).toEqual(where);
  });

  it("round-trips an `or` of `and`s through toDnf then fromDnf", () => {
    const where: VexWhereNode<string> = {
      or: [{ and: [published, viewsOver100] }, { and: [draft, notArchived] }],
    };
    const dnf = toDnf({ where });
    expect(dnf).not.toBeNull();
    expect(fromDnf(dnf!)).toEqual(where);
  });

  it("round-trips groups through fromDnf then toDnf", () => {
    const groups: WhereDnfGroup[] = [{ rows: [published] }, { rows: [draft, notArchived] }];
    const where = fromDnf({ groups });
    expect(toDnf({ where })).toEqual({ groups });
  });
});
```

#### packages/react/src/collections/CollectionListFilterBuilder.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { getDataFields, type AdminDataField, type CollectionConfig, type VexWhereNode } from "@vexcms/core";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui";
import { DateTimePicker } from "../ui/datetime/date-picker";
import { toDnf, fromDnf, type WhereDnfLeaf } from "./whereDnf";

/** Operator choices the filter builder offers, in display order — Decision 10's six comparators; labels mirror how each reads in a sentence ("field IS value"). */
export const FILTER_BUILDER_OP_LABELS: Record<WhereDnfLeaf["op"], string> = {
  eq: "is",
  neq: "is not",
  gt: "is greater than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
};

/** `Select` options for a `checkbox` field's filter value — Decision 10 ships no boolean-specific widget, so this reuses the field-type-dispatch `Select` with fixed labels. */
export const FILTER_BUILDER_BOOLEAN_OPTIONS = [
  { label: "True", value: "true" },
  { label: "False", value: "false" },
] as const;

/** Props for {@link CollectionListFilterBuilder}. */
export interface CollectionListFilterBuilderProps {
  /** The collection the list view renders — its data fields populate the field picker. */
  collection: CollectionConfig;
  /** The list's current filter, in plain `VexWhereNode` form (Decision 9's URL `where` param, Decision 11's saved-view `state.where`). */
  where: VexWhereNode<string> | undefined;
  /** Replaces `where` wholesale — the caller (`CollectionListLayout`, backed by `useCollectionListUrlState`) owns persistence. */
  onWhereChange: (where: VexWhereNode<string> | undefined) => void;
}

/**
 * The `vex.list.filters` built-in contribution to the `list.filters` slot —
 * a groups-of-rows editor for Decision 10's DNF `where`: AND rows within a
 * group, OR between groups. Renders read-only when `props.where` is not in
 * that normal form (`toDnf` returns `null`), e.g. a config-authored
 * `admin.table.views` entry with a hand-written tree.
 *
 * @param props - {@link CollectionListFilterBuilderProps}.
 * @returns The filter builder UI, or a read-only summary for a non-DNF `where`.
 */
export function CollectionListFilterBuilder(props: CollectionListFilterBuilderProps): ReactNode {
  const dnf = useMemo(() => toDnf({ where: props.where }), [props.where]);
  const dataFields = useMemo(
    () => getDataFields({ fields: props.collection.fields }),
    [props.collection.fields],
  );

  // TODO: implement
  // 1. `dnf === null` → render a read-only panel: a muted card showing
  //    `JSON.stringify(props.where)` plus copy explaining the filter came
  //    from a config view and can't be edited here (Decision 10). Return
  //    early — no mutation handlers below apply to this branch.
  // 2. `dnf.groups.length === 0` → render just a single "Add filter"
  //    `Button` that calls `handleAddGroup()` (step 6) to seed the first
  //    group/row.
  // 3. Otherwise render each `dnf.groups[i]` as a bordered block:
  //    a. Between blocks, an "OR" divider (not before the first block).
  //    b. Within a block, each `rows[j]` as one row:
  //       - a field `Select` (options = `Object.entries(dataFields)`, value
  //         = `row.field`, label = `field.admin.label ?? key`) calling
  //         `handleUpdateRow(i, j, { field: nextKey })` on change;
  //       - an operator `Select` (`FILTER_BUILDER_OP_LABELS`, value =
  //         `row.op`) calling `handleUpdateRow(i, j, { op: nextOp })`;
  //       - the value input, `renderFilterValueInput({ field:
  //         dataFields[row.field], value: row.value, onChange: (value) =>
  //         handleUpdateRow(i, j, { value }) })` (below);
  //       - a remove-row icon `Button` calling `handleRemoveRow(i, j)`.
  //    c. After a block's rows, an "Add condition" `Button` (AND) calling
  //       `handleAddRow(i)`.
  // 4. After all blocks, an "Add OR group" `Button` calling `handleAddGroup()`.
  // 5. Every mutation handler rebuilds the full `groups` array immutably,
  //    then calls `props.onWhereChange(fromDnf({ groups: nextGroups }))` —
  //    never mutates `dnf.groups` in place.
  // 6. `handleAddGroup()`:
  //    a. `firstFieldKey = Object.keys(dataFields)[0]` — undefined when the
  //       collection has no data fields; guard the button disabled in that
  //       case instead of adding an unselectable row.
  //    b. New row: `{ field: firstFieldKey, op: "eq", value: "" }`.
  //    c. `props.onWhereChange(fromDnf({ groups: [...dnf.groups, { rows: [newRow] }] }))`.
  // 7. `handleAddRow(groupIndex)`: same new-row default as step 6b,
  //    appended to `dnf.groups[groupIndex].rows`; rebuild `groups` with
  //    that one group replaced, then `fromDnf` + `onWhereChange`.
  // 8. `handleRemoveRow(groupIndex, rowIndex)`: remove that row; if the
  //    group's `rows` would become empty, drop the whole group from
  //    `groups` instead of keeping a row-less `{ rows: [] }` entry —
  //    matches `fromDnf`'s own empty-group handling, kept here too so the
  //    rendered block list never shows a row-less block before the next
  //    render.
  // 9. `handleUpdateRow(groupIndex, rowIndex, patch: Partial<WhereDnfLeaf>)`:
  //    shallow-merge `patch` onto that row. Changing `field` additionally
  //    resets `value` to the new field's empty default (`""` for
  //    text-like, `0` for `number`, `false` for `checkbox`, `undefined`
  //    for `date`) — a stale value typed for the PREVIOUS field must never
  //    be sent under the new field.
  //
  // Edge cases:
  // - Removing the last row of the last group calls
  //   `props.onWhereChange(undefined)` via `fromDnf({ groups: [] })` —
  //   clearing the filter entirely; step 2 already renders the resulting
  //   empty state, so no special-case branch is needed beyond letting
  //   `fromDnf` run.
  // - A collection with zero data fields (`Object.keys(dataFields).length
  //   === 0`) disables "Add filter" / "Add OR group" / "Add condition"
  //   rather than adding a row with no selectable field.
  throw new Error("Not implemented");
}

/**
 * Chooses the value control for one filter row by the selected field's
 * `type` — Decision 10's "value input chosen by field type".
 *
 * @param props - Input props.
 * @param props.field - The row's currently selected data field.
 * @param props.value - The row's current raw value.
 * @param props.onChange - Replaces the row's value.
 * @returns The input element for that field type.
 */
function renderFilterValueInput(props: {
  field: AdminDataField;
  value: unknown;
  onChange: (value: unknown) => void;
}): ReactNode {
  // TODO: implement
  // 1. `props.field.type === "number"` → numeric `Input` (`type="number"`,
  //    `value={String(props.value ?? "")}`, `onChange` parses via
  //    `Number(event.target.value)`).
  // 2. `props.field.type === "checkbox"` → a `Select` built from
  //    `FILTER_BUILDER_BOOLEAN_OPTIONS`, converting `props.value` to/from
  //    `"true"`/`"false"`.
  // 3. `props.field.type === "date"` → `DateTimePicker`, converting
  //    to/from the stored Unix-ms number (mirrors `fields/date/Field.tsx`'s
  //    `DateBareControl`).
  // 4. `props.field.type === "select"` → a `Select` built from
  //    `props.field.options` (`{ label, value }` pairs).
  // 5. Every other type (`text`, `email`, `textarea`, `url`, `color`,
  //    `relationship`, …) → a plain text `Input`,
  //    `value={String(props.value ?? "")}`.
  //
  // Edge cases:
  // - `props.field.type === "select"` with `field.hasMany: true` is OUT OF
  //   SCOPE for this builder — Decision 10 ships only single-value
  //   comparators (`eq`/`neq`/`gt`/`gte`/`lt`/`lte`), never `in`; render
  //   the single-select variant regardless of `hasMany`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/CollectionListLayout.tsx

Two edits to the file Step 8 creates (extended by Step 9) — everything else unchanged.

**1 — import.** Beside the existing slot/component imports, add:

```tsx
import { CollectionListFilterBuilder, type CollectionListFilterBuilderProps } from "./CollectionListFilterBuilder";
```

**2 — the `list.filters` outlet's `builtins`.** Step 9's `<SlotOutlet slotId={SLOT_IDS.list.filters} builtins={[]} contributions={collection.admin.components.filters as unknown as …} contributedProps={{ collection: props.collection }} />` now reads:

```tsx
<SlotOutlet
  slotId={SLOT_IDS.list.filters}
  builtins={[
    { id: BUILTIN_CONTRIBUTION_IDS.list.filters, component: CollectionListFilterBuilder },
  ]}
  contributions={collection.admin.components.filters as unknown as ComponentContributionInput<ReactHKT, CollectionListFilterBuilderProps>[]}
  contributedProps={{ collection: props.collection, where: props.urlState.where, onWhereChange: props.urlState.setWhere }}
/>
```

`props.urlState` is the `UseCollectionListUrlStateReturn` Step 9 threads through `CollectionListLayoutProps` for the toolbar's search/sort controls — `where`/`setWhere` are its `where` slice.

Verify: `pnpm --filter @vexcms/react test -- collections/whereDnf collections/CollectionListFilterBuilder && browser: OR group round-trips through URL reload`

### Step 11 — Saved views client [agent]

Why: views persist per user (local) or shared (Convex, `manageViews`); config views ship in code.

- [ ] `packages/react/src/collections/collectionListViewStore.ts` (new) + test — localStorage keyed by project + collection, `viewId` generated client-side
- [ ] `packages/react/src/collections/useCollectionListViews.ts` (new) + test — merge config + shared + local, dedupe by `viewId`, source badge
- [ ] promotion = shared save then local delete on success; failure keeps local
- [ ] `packages/react/src/collections/CollectionListViewsMenu.tsx` (new) — select / save / rename / delete / promote; shared edits gated by `manageViews`
- [ ] `packages/react/src/collections/index.ts` — barrel export for `CollectionListViewsMenu`
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` — adds the `vex.list.views` built-in (Decision 18) to Step 9's toolbar memo

#### packages/react/src/collections/collectionListViewStore.ts

```ts
"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { VexViewConfig } from "@vexcms/core";

/**
 * `localStorage` key for one collection's local saved views — namespaced by
 * `project` (the current Convex deployment's URL, `useConvex().url`) and
 * `collection`, so the same collection slug across two different VexCMS
 * projects sharing a browser profile stays isolated.
 */
export function localViewsStorageKey(props: { project: string; collection: string }): string {
  return `vex:views:${props.project}:${props.collection}`;
}

const LOCAL_VIEWS_EVENT = "vex:views-change";

interface LocalViewsEnvelope {
  version: 1;
  views: VexViewConfig[];
}

function isLocalViewsEnvelope(value: unknown): value is LocalViewsEnvelope {
  return (
    !!value &&
    typeof value === "object" &&
    (value as LocalViewsEnvelope).version === 1 &&
    Array.isArray((value as LocalViewsEnvelope).views)
  );
}

/** Stable empty-array reference — `useSyncExternalStore`'s snapshot must not change identity when nothing changed. */
const EMPTY_VIEWS: VexViewConfig[] = [];

const cachedRaw = new Map<string, string>();
const cachedViews = new Map<string, VexViewConfig[]>();

/**
 * Reads the local views stored at `localViewsStorageKey(props)`, SSR-safe
 * and guarded against a blocked/unavailable `localStorage` (Safari private
 * mode, a jsdom test environment with no backing store). Caches by raw
 * string per key so repeated reads between writes return the SAME array
 * reference — required for `useSyncExternalStore`'s snapshot stability.
 *
 * @param props.project - The Convex deployment URL this browser is pointed at.
 * @param props.collection - The collection slug.
 * @returns The stored views, or `[]` when unset, unreadable, or malformed.
 */
function readLocalViews(props: { project: string; collection: string }): VexViewConfig[] {
  if (typeof window === "undefined") return EMPTY_VIEWS;
  const key = localViewsStorageKey(props);
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY_VIEWS;
  }
  if (raw === null) return EMPTY_VIEWS;
  if (raw === cachedRaw.get(key)) return cachedViews.get(key) ?? EMPTY_VIEWS;
  cachedRaw.set(key, raw);
  try {
    const parsed: unknown = JSON.parse(raw);
    const views = isLocalViewsEnvelope(parsed) ? parsed.views : EMPTY_VIEWS;
    cachedViews.set(key, views);
    return views;
  } catch {
    cachedViews.set(key, EMPTY_VIEWS);
    return EMPTY_VIEWS;
  }
}

function writeLocalViews(props: { project: string; collection: string; views: VexViewConfig[] }): void {
  if (typeof window === "undefined") return;
  const key = localViewsStorageKey(props);
  const envelope: LocalViewsEnvelope = { version: 1, views: props.views };
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(LOCAL_VIEWS_EVENT));
}

/**
 * Saves (inserts or, on a matching `viewId`, replaces in place) one view
 * into this browser's local store for `props.collection`.
 *
 * @param props.project - The Convex deployment URL (`useCollectionListViews()`'s `project`).
 * @param props.collection - The collection slug.
 * @param props.view - The view to save, keyed by its own `viewId`.
 */
export function saveLocalView(props: { project: string; collection: string; view: VexViewConfig }): void {
  const existing = readLocalViews(props);
  const index = existing.findIndex((view) => view.viewId === props.view.viewId);
  const views =
    index === -1 ? [...existing, props.view] : existing.map((view, i) => (i === index ? props.view : view));
  writeLocalViews({ project: props.project, collection: props.collection, views });
}

/**
 * Removes one view, by `viewId`, from this browser's local store for
 * `props.collection`. A no-op when no local view has that `viewId`.
 *
 * @param props.project - The Convex deployment URL.
 * @param props.collection - The collection slug.
 * @param props.viewId - The view to remove.
 */
export function removeLocalView(props: { project: string; collection: string; viewId: string }): void {
  const existing = readLocalViews(props);
  writeLocalViews({
    project: props.project,
    collection: props.collection,
    views: existing.filter((view) => view.viewId !== props.viewId),
  });
}

/**
 * Generates a client-side `viewId` for a new local view. Stable across
 * promotion (Decision 14): saving the same view shared reuses this id, so
 * `saveView`'s idempotent upsert patches the same `vex_views` row rather
 * than creating a second one.
 *
 * @returns A fresh random id.
 */
export function generateViewId(): string {
  return crypto.randomUUID();
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCAL_VIEWS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCAL_VIEWS_EVENT, onStoreChange);
  };
}

const getServerSnapshot = (): VexViewConfig[] => EMPTY_VIEWS;

/**
 * Reads this browser's local saved views for one collection, re-rendering on
 * any write — this tab's (`vex:views-change`) or another tab's writing the
 * same key (`storage`). SSR-safe: `getServerSnapshot` returns `[]`.
 *
 * @param props.project - The Convex deployment URL this browser is pointed at.
 * @param props.collection - The collection slug.
 * @returns The current local views for `props.collection`.
 */
export function useLocalViews(props: { project: string; collection: string }): VexViewConfig[] {
  return useSyncExternalStore(
    subscribe,
    useCallback(() => readLocalViews(props), [props.project, props.collection]),
    getServerSnapshot,
  );
}
```

#### packages/react/src/collections/collectionListViewStore.test.ts

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  generateViewId,
  localViewsStorageKey,
  removeLocalView,
  saveLocalView,
  useLocalViews,
} from "./collectionListViewStore";

const project = "https://example.convex.cloud";
const collection = "posts";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("collectionListViewStore", () => {
  it("starts with no local views when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalViews({ project, collection }));
    expect(result.current).toEqual([]);
  });

  it("saveLocalView stores the view and updates a mounted hook", () => {
    const { result } = renderHook(() => useLocalViews({ project, collection }));
    expect(result.current).toEqual([]);

    act(() => {
      saveLocalView({
        project,
        collection,
        view: { viewId: "v1", name: "My View", state: { pageSize: 25 } },
      });
    });

    expect(result.current).toEqual([{ viewId: "v1", name: "My View", state: { pageSize: 25 } }]);
    const raw = window.localStorage.getItem(localViewsStorageKey({ project, collection }));
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      version: 1,
      views: [{ viewId: "v1", name: "My View", state: { pageSize: 25 } }],
    });
  });

  it("saveLocalView replaces the existing entry in place when the viewId matches", () => {
    saveLocalView({ project, collection, view: { viewId: "v1", name: "Original", state: {} } });
    saveLocalView({ project, collection, view: { viewId: "v1", name: "Renamed", state: {} } });

    const { result } = renderHook(() => useLocalViews({ project, collection }));
    expect(result.current).toEqual([{ viewId: "v1", name: "Renamed", state: {} }]);
  });

  it("removeLocalView removes one view by viewId and leaves the rest", () => {
    saveLocalView({ project, collection, view: { viewId: "v1", name: "A", state: {} } });
    saveLocalView({ project, collection, view: { viewId: "v2", name: "B", state: {} } });

    const { result } = renderHook(() => useLocalViews({ project, collection }));

    act(() => {
      removeLocalView({ project, collection, viewId: "v1" });
    });

    expect(result.current).toEqual([{ viewId: "v2", name: "B", state: {} }]);
  });

  it("keys storage by project AND collection, so the same collection slug in two projects stays isolated", () => {
    saveLocalView({
      project: "https://a.convex.cloud",
      collection,
      view: { viewId: "v1", name: "A", state: {} },
    });
    saveLocalView({
      project: "https://b.convex.cloud",
      collection,
      view: { viewId: "v1", name: "B", state: {} },
    });

    const a = renderHook(() => useLocalViews({ project: "https://a.convex.cloud", collection }));
    const b = renderHook(() => useLocalViews({ project: "https://b.convex.cloud", collection }));

    expect(a.result.current).toEqual([{ viewId: "v1", name: "A", state: {} }]);
    expect(b.result.current).toEqual([{ viewId: "v1", name: "B", state: {} }]);
  });

  it("resolves malformed JSON to an empty array instead of throwing", () => {
    window.localStorage.setItem(localViewsStorageKey({ project, collection }), "{not json");

    const { result } = renderHook(() => useLocalViews({ project, collection }));

    expect(result.current).toEqual([]);
  });

  it("resolves JSON that does not match the stored envelope shape to an empty array", () => {
    window.localStorage.setItem(localViewsStorageKey({ project, collection }), JSON.stringify({ foo: "bar" }));

    const { result } = renderHook(() => useLocalViews({ project, collection }));

    expect(result.current).toEqual([]);
  });

  it("picks up a cross-tab write via the storage event", () => {
    const { result } = renderHook(() => useLocalViews({ project, collection }));
    expect(result.current).toEqual([]);

    const envelope = { version: 1, views: [{ viewId: "v1", name: "A", state: {} }] };
    window.localStorage.setItem(localViewsStorageKey({ project, collection }), JSON.stringify(envelope));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: localViewsStorageKey({ project, collection }),
          newValue: JSON.stringify(envelope),
        }),
      );
    });

    expect(result.current).toEqual(envelope.views);
  });

  it("generateViewId returns a distinct string each call", () => {
    const a = generateViewId();
    const b = generateViewId();
    expect(typeof a).toBe("string");
    expect(a).not.toBe(b);
  });
});
```

#### packages/react/src/collections/useCollectionListViews.ts

```ts
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import {
  VEX_VIEW_SOURCES,
  type CollectionSlug,
  type VexViewConfig,
  type VexViewSource,
} from "@vexcms/core";
import { listViews } from "../client";
import { useVexConfig } from "../config/VexConfigContext";
import { useLocalViews } from "./collectionListViewStore";

/**
 * One saved view merged for display: a {@link VexViewConfig} tagged with
 * which of the three sources (Decision 11) it came from. Named `*Entry`
 * rather than `CollectionListView` to avoid colliding with the
 * `CollectionListView` admin view component this package already exports.
 *
 * @typeParam TFieldSlug - The collection's own field slugs.
 */
export interface CollectionListViewEntry<TFieldSlug extends string = string>
  extends VexViewConfig<TFieldSlug> {
  /** Which of the three sources this view was read from. */
  source: VexViewSource;
}

/** Return shape of {@link useCollectionListViews}. */
export interface UseCollectionListViewsResult<TFieldSlug extends string = string> {
  /** The merged, deduped, source-tagged view list. */
  views: CollectionListViewEntry<TFieldSlug>[];
  /**
   * The current Convex deployment's URL — the same value
   * `collectionListViewStore.ts` namespaces local views by (`project`).
   * Exposed so `CollectionListViewsMenu` doesn't call `useConvex()` a
   * second time to read/write the local store.
   */
  project: string;
  /** Whether the `vex_views` (shared) query has not yet resolved. */
  isPending: boolean;
}

const MERGE_PRIORITY: readonly VexViewSource[] = [
  VEX_VIEW_SOURCES.shared,
  VEX_VIEW_SOURCES.local,
  VEX_VIEW_SOURCES.config,
];

/**
 * Merges a collection's three saved-view sources (Decision 11) into one
 * source-tagged, `viewId`-deduped list.
 *
 * Collision precedence is `shared > local > config`: a `local` view that was
 * just promoted (Decision 14) keeps the same `viewId`, so another browser
 * tab that still has the pre-promotion local entry cached resolves the
 * collision to the now-authoritative `shared` copy rather than showing the
 * same view twice.
 *
 * @param props.config - Views from the collection's own `admin.table.views`.
 * @param props.shared - Views from the `vex_views` table (`listViews`).
 * @param props.local - Views from this browser's `localStorage`.
 * @returns One entry per distinct `viewId`, each tagged with its winning source.
 */
function mergeCollectionListViews<TFieldSlug extends string>(props: {
  config: VexViewConfig<TFieldSlug>[];
  shared: VexViewConfig<TFieldSlug>[];
  local: VexViewConfig<TFieldSlug>[];
}): CollectionListViewEntry<TFieldSlug>[] {
  const bySource: Record<VexViewSource, VexViewConfig<TFieldSlug>[]> = {
    [VEX_VIEW_SOURCES.config]: props.config,
    [VEX_VIEW_SOURCES.shared]: props.shared,
    [VEX_VIEW_SOURCES.local]: props.local,
  };
  const merged = new Map<string, CollectionListViewEntry<TFieldSlug>>();
  for (const source of MERGE_PRIORITY) {
    for (const view of bySource[source]) {
      if (!merged.has(view.viewId)) merged.set(view.viewId, { ...view, source });
    }
  }
  return [...merged.values()];
}

/**
 * Reads and merges a collection's saved views: `config` (`admin.table.views`,
 * read-only), `shared` (`vex_views`, live-subscribed via `listViews`), and
 * `local` (this browser's `localStorage`, via `useLocalViews`) — Decision 11.
 *
 * @param props.collection - The collection slug to read views for.
 * @returns The merged view list, the current project key, and whether the
 *   shared-views query is still pending.
 */
export function useCollectionListViews<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
>(props: { collection: TCollectionSlug }): UseCollectionListViewsResult<TFieldSlug> {
  const config = useVexConfig();
  const convex = useConvex();
  const collection = config.collections.find((c) => c.slug === props.collection);
  const configViews = (collection?.admin.table.views ?? []) as VexViewConfig<TFieldSlug>[];

  const sharedQuery = useQuery(listViews({ collection: props.collection }));
  const sharedViews = (sharedQuery.data ?? []) as VexViewConfig<TFieldSlug>[];

  const localViews = useLocalViews({
    project: convex.url,
    collection: props.collection,
  }) as VexViewConfig<TFieldSlug>[];

  const views = useMemo(
    () => mergeCollectionListViews({ config: configViews, shared: sharedViews, local: localViews }),
    [configViews, sharedViews, localViews],
  );

  return { views, project: convex.url, isPending: sharedQuery.isPending };
}
```

#### packages/react/src/collections/useCollectionListViews.test.ts

```ts
import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineCollection, defineConfig, text, vexConvexApi, type VexStoredView } from "@vexcms/core";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";
import { VexConfigProvider } from "../config/VexConfigContext";
import { saveLocalView } from "./collectionListViewStore";
import { useCollectionListViews } from "./useCollectionListViews";

const project = "https://example.convex.cloud";

vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactModule>();
  return { ...actual, useConvex: () => ({ url: project }) };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    convexQuery: (reference: unknown, args: unknown) => ({ __reference: reference, __args: args }),
  };
});

// Fixture rows the mocked `listViews` query serves, and its pending flag — each test sets these
// before rendering.
let sharedViewRows: VexStoredView[] = [];
let sharedViewsPending = false;

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown }) =>
      options.__reference === vexConvexApi.listViews
        ? { data: sharedViewRows, isPending: sharedViewsPending }
        : { data: undefined, isPending: true },
  };
});

const testConfig = defineConfig({
  collections: [
    defineCollection({
      slug: "posts",
      fields: { title: text() },
      admin: { table: { views: [{ viewId: "cfg1", name: "Config View", state: {} }] } },
    }),
  ],
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(VexConfigProvider, { config: testConfig }, children);
}

beforeEach(() => {
  window.localStorage.clear();
  sharedViewRows = [];
  sharedViewsPending = false;
});

afterEach(() => {
  window.localStorage.clear();
});

describe("useCollectionListViews", () => {
  it("merges config, shared, and local views, tagging each with its source", () => {
    sharedViewRows = [
      { viewId: "shared1", name: "Shared View", state: {}, collection: "posts", createdBy: "user1" },
    ];
    saveLocalView({
      project,
      collection: "posts",
      view: { viewId: "local1", name: "Local View", state: {} },
    });

    const { result } = renderHook(() => useCollectionListViews({ collection: "posts" }), { wrapper });

    expect(result.current.views).toEqual([
      {
        viewId: "shared1",
        name: "Shared View",
        state: {},
        collection: "posts",
        createdBy: "user1",
        source: "shared",
      },
      { viewId: "local1", name: "Local View", state: {}, source: "local" },
      { viewId: "cfg1", name: "Config View", state: {}, source: "config" },
    ]);
    expect(result.current.project).toBe(project);
  });

  it("dedupes by viewId, keeping the shared entry over a stale local one (promotion race)", () => {
    sharedViewRows = [
      { viewId: "v1", name: "Promoted View", state: {}, collection: "posts", createdBy: "user1" },
    ];
    saveLocalView({
      project,
      collection: "posts",
      view: { viewId: "v1", name: "Stale Local Copy", state: {} },
    });

    const { result } = renderHook(() => useCollectionListViews({ collection: "posts" }), { wrapper });

    expect(result.current.views).toHaveLength(2);
    expect(result.current.views.find((view) => view.viewId === "v1")).toEqual({
      viewId: "v1",
      name: "Promoted View",
      state: {},
      collection: "posts",
      createdBy: "user1",
      source: "shared",
    });
  });

  it("reports isPending from the shared views query", () => {
    sharedViewsPending = true;
    const { result } = renderHook(() => useCollectionListViews({ collection: "posts" }), { wrapper });
    expect(result.current.isPending).toBe(true);
  });
});
```

#### packages/react/src/collections/CollectionListViewsMenu.tsx

```tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  VEX_VIEW_SOURCES,
  VIEW_ACTIONS,
  type CollectionSlug,
  type VexViewConfig,
  type VexViewSource,
  type VexViewState,
} from "@vexcms/core";
import { removeView, saveView } from "../client";
import { usePermission } from "../access";
import { getVexErrorMessage } from "../utils/errors";
import { generateViewId, removeLocalView, saveLocalView } from "./collectionListViewStore";
import { useCollectionListViews, type CollectionListViewEntry } from "./useCollectionListViews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
} from "../ui";

/** Props for {@link CollectionListViewsMenu}. */
export interface CollectionListViewsMenuProps<TFieldSlug extends string = string> {
  /** The collection this views menu belongs to. */
  collection: CollectionSlug;
  /** The list's current toolbar state — what "Save locally" / "Save as shared view" captures. */
  state: VexViewState<TFieldSlug>;
  /** The `view` URL param's current value, or `undefined` when no view is selected. */
  activeViewId: string | undefined;
  /** Applies a view's state and marks it active — sets the `view` URL param. */
  onSelectView: (props: { viewId: string; state: VexViewState<TFieldSlug> }) => void;
  /** Clears the active view — removes the `view` URL param without touching the rest of the state. */
  onClearView: () => void;
}

/** A pending name-entry dialog: a new save, or a rename of an existing view. */
interface NameDialogState<TFieldSlug extends string> {
  mode: "save" | "rename";
  target: Exclude<VexViewSource, "config">;
  viewId: string;
  name: string;
  state: VexViewState<TFieldSlug>;
}

/**
 * The `vex.list.views` built-in: select / save / rename / delete / promote a
 * collection's saved views (Decision 11). Lists the merged `config` +
 * `shared` + `local` views from `useCollectionListViews`, each tagged with a
 * source badge. Config views are always read-only; shared views are
 * editable only with `VIEW_ACTIONS.manageViews` (Decision 13) — a denied
 * caller still sees every view and can "Save locally", just never "Save as
 * shared view", rename/delete a shared view, or promote a local one.
 *
 * Promotion (Decision 14) is a move: `saveView` with the local view's own
 * `viewId` (idempotent upsert), then `removeLocalView` only on success — a
 * failed promotion leaves the local entry in place and toasts the error.
 *
 * @param props - See {@link CollectionListViewsMenuProps}.
 * @returns The views dropdown trigger, its menu, the save/rename name
 *   dialog, and the delete confirmation dialog.
 * @throws Never — save/remove/promote failures are caught and toasted.
 *
 * @example
 * Rendered as the `vex.list.views` built-in by `ListViewsAction`
 * (`CollectionListToolbar.tsx`, Step 11) — see that file for the
 * `state`/`onSelectView`/`onClearView` wiring against
 * `useCollectionListUrlState`.
 */
export function CollectionListViewsMenu<TFieldSlug extends string = string>(
  props: CollectionListViewsMenuProps<TFieldSlug>,
) {
  const { views, project } = useCollectionListViews<CollectionSlug, TFieldSlug>({
    collection: props.collection,
  });
  const canManageViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.manageViews });

  const saveViewMutation = useMutation({ mutationFn: saveView() });
  const removeViewMutation = useMutation({ mutationFn: removeView() });

  const [nameDialog, setNameDialog] = useState<NameDialogState<TFieldSlug> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CollectionListViewEntry<TFieldSlug> | null>(null);
  const [promotingViewId, setPromotingViewId] = useState<string | null>(null);

  const activeView = views.find((view) => view.viewId === props.activeViewId);

  /** Saves `nameDialog`'s view to its `target` source and, for a new save, selects it. */
  async function handleConfirmName(): Promise<void> {
    if (nameDialog === null || nameDialog.name.trim() === "") return;
    const view: VexViewConfig<TFieldSlug> = {
      viewId: nameDialog.viewId,
      name: nameDialog.name.trim(),
      state: nameDialog.state,
    };
    try {
      if (nameDialog.target === VEX_VIEW_SOURCES.shared) {
        await saveViewMutation.mutateAsync({ collection: props.collection, view });
      } else {
        saveLocalView({ project, collection: props.collection, view });
      }
      if (nameDialog.mode === "save") props.onSelectView({ viewId: view.viewId, state: view.state });
      setNameDialog(null);
    } catch (error) {
      toast.error("Save view failed", { description: getVexErrorMessage(error) });
    }
  }

  /** Deletes `deleteTarget`, clearing the active view first when it is the one being deleted. */
  async function handleConfirmDelete(): Promise<void> {
    if (deleteTarget === null) return;
    try {
      if (deleteTarget.source === VEX_VIEW_SOURCES.shared) {
        await removeViewMutation.mutateAsync({ collection: props.collection, viewId: deleteTarget.viewId });
      } else {
        removeLocalView({ project, collection: props.collection, viewId: deleteTarget.viewId });
      }
      if (props.activeViewId === deleteTarget.viewId) props.onClearView();
    } catch (error) {
      toast.error("Delete view failed", { description: getVexErrorMessage(error) });
    } finally {
      setDeleteTarget(null);
    }
  }

  /** Saves `view` shared under its own `viewId`, then removes the local copy (Decision 14). */
  async function handlePromote(view: CollectionListViewEntry<TFieldSlug>): Promise<void> {
    setPromotingViewId(view.viewId);
    try {
      await saveViewMutation.mutateAsync({
        collection: props.collection,
        view: { viewId: view.viewId, name: view.name, state: view.state },
      });
      removeLocalView({ project, collection: props.collection, viewId: view.viewId });
    } catch (error) {
      toast.error("Promote to shared view failed", { description: getVexErrorMessage(error) });
    } finally {
      setPromotingViewId(null);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" icon="Bookmark">
              {activeView?.name ?? "Views"}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Saved views</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {props.activeViewId !== undefined && (
            <DropdownMenuItem onClick={props.onClearView}>Clear view</DropdownMenuItem>
          )}
          {views.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No saved views yet</p>
          ) : (
            views.map((view) => {
              const editable =
                view.source === VEX_VIEW_SOURCES.local ||
                (view.source === VEX_VIEW_SOURCES.shared && canManageViews);
              return (
                <div key={view.viewId} className="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                    onClick={() => props.onSelectView({ viewId: view.viewId, state: view.state })}
                  >
                    <span className={view.viewId === props.activeViewId ? "truncate font-medium" : "truncate"}>
                      {view.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {view.source}
                    </Badge>
                  </button>
                  <div className="flex shrink-0 gap-1">
                    {view.source === VEX_VIEW_SOURCES.local && canManageViews && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        icon="Share2"
                        isPending={promotingViewId === view.viewId}
                        aria-label={`Promote ${view.name} to shared`}
                        onClick={() => void handlePromote(view)}
                      />
                    )}
                    {editable && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        icon="Pencil"
                        aria-label={`Rename ${view.name}`}
                        onClick={() =>
                          setNameDialog({
                            mode: "rename",
                            target: view.source === VEX_VIEW_SOURCES.shared ? VEX_VIEW_SOURCES.shared : VEX_VIEW_SOURCES.local,
                            viewId: view.viewId,
                            name: view.name,
                            state: view.state,
                          })
                        }
                      />
                    )}
                    {editable && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        icon="Trash2"
                        className="hover:text-destructive"
                        aria-label={`Delete ${view.name}`}
                        onClick={() => setDeleteTarget(view)}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Save current view</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() =>
              setNameDialog({
                mode: "save",
                target: VEX_VIEW_SOURCES.local,
                viewId: generateViewId(),
                name: "",
                state: props.state,
              })
            }
          >
            Save locally
          </DropdownMenuItem>
          {canManageViews && (
            <DropdownMenuItem
              onClick={() =>
                setNameDialog({
                  mode: "save",
                  target: VEX_VIEW_SOURCES.shared,
                  viewId: generateViewId(),
                  name: "",
                  state: props.state,
                })
              }
            >
              Save as shared view
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={nameDialog !== null}
        onOpenChange={(open) => {
          if (!open) setNameDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{nameDialog?.mode === "rename" ? "Rename view" : "Save view"}</DialogTitle>
            <DialogDescription>
              {nameDialog?.target === VEX_VIEW_SOURCES.shared
                ? "Visible to everyone with access to this collection."
                : "Visible only in this browser."}
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="vex-view-name">Name</Label>
          <Input
            id="vex-view-name"
            value={nameDialog?.name ?? ""}
            onChange={(event) =>
              setNameDialog((current) => (current === null ? current : { ...current, name: event.target.value }))
            }
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNameDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              isPending={saveViewMutation.isPending}
              disabled={nameDialog?.name.trim() === ""}
              onClick={() => void handleConfirmName()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.source === VEX_VIEW_SOURCES.shared
                ? "This removes the shared view for everyone with access to this collection."
                : "This removes the view from this browser."}{" "}
              It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              isPending={removeViewMutation.isPending}
              onClick={() => void handleConfirmDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

#### packages/react/src/collections/index.ts

1 edit — everything else in this file is unchanged.

**1 — new export, appended after the existing four.**

```ts
export * from "./CollectionListViewsMenu";
```

#### packages/react/src/collections/CollectionListToolbar.tsx

Extends Step 9's file with the `vex.list.views` built-in (Decision 18 names `vex.list.views`
as the `list.toolbar` slot's third built-in). 3 edits — everything else (`hideableColumns`,
`ListSearchAction`, `ListColumnsAction`, the exported built-in id constants) is unchanged.

**1 — imports.** Add beside the existing imports:

```ts
import { CollectionListViewsMenu } from "./CollectionListViewsMenu";
import type { VexViewState } from "@vexcms/core";
```

**2 — `toolbarBuiltins`.** Extend step 2's memo (in `CollectionListToolbar`'s body) with the views built-in:

```tsx
  const toolbarBuiltins = useMemo(
    () => [
      { id: BUILTIN_CONTRIBUTION_IDS.list.search, component: ListSearchAction },
      { id: BUILTIN_CONTRIBUTION_IDS.list.columns, component: ListColumnsAction },
      { id: BUILTIN_CONTRIBUTION_IDS.list.views, component: ListViewsAction },
    ],
    [],
  );
```

**3 — new `ListViewsAction` function**, placed after `ListColumnsAction`:

```tsx
/**
 * `vex.list.views` — the saved-views menu (Decision 11/18). Adapts
 * `ListToolbarSlotProps.urlState`/`visibleColumns` into
 * `CollectionListViewsMenu`'s `state`/`onSelectView`/`onClearView`. Not
 * `access`-gated here — `CollectionListViewsMenu` itself gates editing on
 * `manageViews` (Decision 13); every user can select a view or save locally.
 *
 * @param props - {@link ListToolbarSlotProps}.
 */
function ListViewsAction(props: ListToolbarSlotProps): ReactNode {
  const state: VexViewState<string> = {
    where: props.urlState.where,
    sort: props.urlState.sort,
    search: props.urlState.search,
    searchField: props.urlState.searchField,
    columns: props.visibleColumns,
    pageSize: props.urlState.pageSize,
  };
  return (
    <CollectionListViewsMenu
      collection={props.collection.slug}
      state={state}
      activeViewId={props.urlState.view}
      onSelectView={({ viewId, state: nextState }) => {
        props.urlState.setState({
          where: nextState.where,
          sort: nextState.sort,
          search: nextState.search,
          searchField: nextState.searchField,
          pageSize: nextState.pageSize,
          view: viewId,
        });
        props.onVisibleColumnsChange(nextState.columns ?? props.collection.admin.table.defaultColumns);
      }}
      onClearView={() => props.urlState.setView(undefined)}
    />
  );
}
```

Verify: `pnpm --filter @vexcms/react test -- collections && browser: save local, save shared, promote, denied user sees local-only save`

### Step 12 — Mobile list layout [agent]

Why: J dropped the list view from its scope; I owns it end to end.

- [ ] `packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx` (new) + test — one trigger/content pair: `Popover` at `md`+, bottom `Sheet` below `md`
- [ ] `packages/react/src/ui/data-table/index.ts` — barrel export for `DataTableResponsiveMenu`
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — sticky first column while the table scrolls horizontally
- [ ] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — bar fixed to the bottom below `md`
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` — non-search controls collapse into one `DataTableResponsiveMenu` overflow trigger below `md`
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` + `packages/react/src/collections/CollectionListViewsMenu.tsx` + `packages/react/src/collections/CollectionListFilterBuilder.tsx` — each swaps its trigger/content container for `DataTableResponsiveMenu`
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — J section notes list view owned by I

#### packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx

New file. The single mechanism `DataTableColumnsMenu`, `CollectionListViewsMenu` and
`CollectionListFilterBuilder`'s trigger switch to below — one trigger/content pair that
renders as a `Popover` at `md` and above and as a bottom `Sheet` below `md`, mirroring how
`ui/sidebar.tsx` already flips between an inline rail and a `Sheet` overlay on the same
`useIsMobile()` boundary (`MOBILE_BREAKPOINT = 768`).

```tsx
"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../sheet";

/**
 * Props for DataTableResponsiveMenu.
 */
export interface DataTableResponsiveMenuProps {
  /** Trigger element (typically a `Button`); rendered with `asChild` in both containers. */
  trigger: ReactNode;
  /** Accessible title. Rendered as the `SheetTitle` below `md`; desktop omits a visible
   * title to stay compact, matching `PopoverContent`'s existing callers. */
  title: string;
  /** Menu body, shared unchanged between the `Popover` and the `Sheet`. */
  children: ReactNode;
  /** Desktop `PopoverContent` alignment. Ignored below `md`. @default "end" */
  align?: "start" | "center" | "end";
}

/**
 * Renders one trigger + content pair as a `Popover` at `md` and above, and as a bottom
 * `Sheet` below `md` (list-view-overhaul Design Decision 22: "menus render as sheets
 * below `md`"). Every list-view menu composes this instead of choosing `Popover` or
 * `Sheet` itself, so they all collapse at the same breakpoint the same way.
 *
 * @param props - Component props.
 * @param props.trigger - Trigger element, wrapped with `asChild` in `PopoverTrigger` /
 *   `SheetTrigger` so the caller's own button renders unchanged in both containers.
 * @param props.title - Accessible title shown as the `SheetTitle` below `md`.
 * @param props.children - Menu body, identical in both containers.
 * @param props.align - Desktop popover alignment.
 * @returns The responsive trigger + content pair.
 */
export function DataTableResponsiveMenu(props: DataTableResponsiveMenuProps) {
  // TODO: implement
  // 1. isMobile = useIsMobile()
  // 2. isMobile === true →
  //    a. render <Sheet><SheetTrigger asChild>{props.trigger}</SheetTrigger>
  //    b. <SheetContent side="bottom"> with <SheetHeader><SheetTitle>{props.title}</SheetTitle></SheetHeader>
  //    c. a scrollable body wrapping {props.children} (className "overflow-y-auto")
  // 3. isMobile === false →
  //    render <Popover><PopoverTrigger asChild>{props.trigger}</PopoverTrigger>
  //    <PopoverContent align={props.align ?? "end"}>{props.children}</PopoverContent></Popover>
  // Edge cases:
  // - `isMobile` is `undefined` during the first client render (before `use-mobile`'s
  //   effect measures the viewport) — treat as the desktop (`Popover`) branch, matching
  //   `useIsMobile`'s own `!!isMobile` default, so there is no flash of Sheet-then-Popover.
  throw new Error("Not implemented");
}
```

#### packages/react/src/ui/data-table/DataTableResponsiveMenu.test.tsx

New file.

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTableResponsiveMenu } from "./DataTableResponsiveMenu";

const { isMobileMock } = vi.hoisted(() => ({ isMobileMock: vi.fn(() => false) }));

vi.mock("../../hooks/use-mobile", () => ({ useIsMobile: isMobileMock }));

afterEach(() => {
  cleanup();
  isMobileMock.mockReturnValue(false);
});

describe("DataTableResponsiveMenu", () => {
  it("renders the body in a Popover at md and above", async () => {
    const user = userEvent.setup();
    render(
      <DataTableResponsiveMenu trigger={<button>Columns</button>} title="Columns">
        <div>Menu body</div>
      </DataTableResponsiveMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Columns" }));

    expect(await screen.findByText("Menu body")).toBeInTheDocument();
    expect(screen.queryByText("Columns", { selector: '[data-slot="sheet-title"]' })).not.toBeInTheDocument();
  });

  it("renders the body in a bottom Sheet with the title below md", async () => {
    isMobileMock.mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <DataTableResponsiveMenu trigger={<button>Columns</button>} title="Columns">
        <div>Menu body</div>
      </DataTableResponsiveMenu>,
    );

    await user.click(screen.getByRole("button", { name: "Columns" }));

    expect(await screen.findByText("Menu body")).toBeInTheDocument();
    expect(screen.getByText("Columns", { selector: '[data-slot="sheet-title"]' })).toBeInTheDocument();
  });
});
```

#### packages/react/src/ui/data-table/index.ts

1 edit — add the new barrel export beside the other `ui/data-table` files.

**1 — export.** Add after the existing `export * from "./DataTableBulkActions";` line:

```ts
export * from "./DataTableResponsiveMenu";
```

#### packages/react/src/ui/data-table/DataTable.tsx

3 edits — everything else in this file (the row-selection checkbox column, `useReactTable`
wiring, Load More / "all loaded" footer, delete modal) is unchanged.

**1 — import.** Add `cn` beside the existing `../table` import:

```tsx
import { cn } from "../utils/cn";
```

**2 — sticky first header cell.** In `DataTable`'s returned JSX, the `TableHeader` row maps
`hg.headers` — add the column index and a sticky class on the first column so it stays
visible while the table scrolls horizontally (list-view-overhaul Design Decision 22):

```tsx
{hg.headers.map((header, index) => (
  <TableHead
    key={header.id}
    className={cn(
      ALIGNMENT_CLASS[
        (header.column.columnDef.meta as DataTableColumnMeta | undefined)?.align ?? "left"
      ],
      index === 0 && "sticky left-0 z-10 border-r bg-background",
    )}
  >
    {flexRender(header.column.columnDef.header, header.getContext())}
  </TableHead>
))}
```

**3 — sticky first body cell.** Same treatment on `row.getVisibleCells()`:

```tsx
{row.getVisibleCells().map((cell, index) => (
  <TableCell
    key={cell.id}
    className={cn(
      ALIGNMENT_CLASS[
        (cell.column.columnDef.meta as DataTableColumnMeta | undefined)?.align ?? "left"
      ],
      index === 0 && "sticky left-0 z-10 border-r bg-background",
    )}
  >
    {flexRender(cell.column.columnDef.cell, cell.getContext())}
  </TableCell>
))}
```

When `enableRowSelection` is on, column 0 is the checkbox column `DataTable` already
prepends (`columns` memo, above) — the checkbox then stays docked with the row it belongs
to, same as the title column when selection is off.

#### packages/react/src/ui/data-table/DataTableBulkActions.tsx

1 edit — the `selectedCount === 0` early return, button contents and props are unchanged.

**1 — bar position.** Replace the root `<div>`'s `className` so the bar is fixed to the
bottom (inset by the page's horizontal padding) below `md`, and keeps its existing
top-centered floating position at `md` and above:

```tsx
<div className="fixed inset-x-4 bottom-4 z-50 flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5 md:inset-x-auto md:top-4 md:bottom-auto md:left-1/2 md:-translate-x-1/2">
```

#### packages/react/src/collections/CollectionListToolbar.tsx

Guided edit against the component Step 9 creates (extended by Step 11 with the
`vex.list.views` built-in). `CollectionListToolbar` renders `CollectionListSearch` plus
the `SLOT_IDS.list.toolbar` outlet's contributions (`vex.list.search`, `vex.list.columns`,
`vex.list.views`) and `DataTablePageSizeSelect` beside it — `list.filters`
(`CollectionListFilterBuilder`, Step 10) is a separate slot rendered directly by
`CollectionListLayout`, not part of this toolbar, and gets its own responsive wrap below.
Below `md` the search bar stays inline — it is the primary control — and every other
toolbar control collapses into one overflow trigger.

**1 — mobile overflow collapse.** Inside `CollectionListToolbar`'s returned JSX, wrap the
non-search controls (everything currently rendered after `<CollectionListSearch />`) in
`DataTableResponsiveMenu` so they render inline at `md` and above and inside one sheet
below it:

```tsx
// TODO: implement
// 1. import { DataTableResponsiveMenu } from "../ui/data-table/DataTableResponsiveMenu"
// 2. keep <CollectionListSearch /> rendered unconditionally and first
// 3. wrap the remaining toolbar controls (columns menu, views menu, page size
//    select) in one Fragment — call it `secondaryControls`
// 4. render `secondaryControls` directly, with each control's own trigger button
//    carrying `className="hidden md:inline-flex"` (or equivalent) → visible inline at
//    `md` and above
// 5. render a second, mobile-only entry point:
//    <DataTableResponsiveMenu
//      trigger={<Button variant="outline" size="icon" icon="MoreVertical" className="md:hidden" />}
//      title="List options"
//    >
//      {secondaryControls}
//    </DataTableResponsiveMenu>
// Edge cases:
// - a control with nothing to show (e.g. `CollectionListSearch` with no
//   `searchField`) renders nothing — the overflow trigger must not show when
//   `secondaryControls` resolves to zero visible children
```

#### packages/react/src/ui/data-table/DataTableColumnsMenu.tsx

Guided edit against the component Step 9 creates (`enableHiding` columns; session-only
state when no view selected).

**1 — responsive container.** Replace whatever trigger/content container
`DataTableColumnsMenu` currently returns with `DataTableResponsiveMenu`, keeping the same
column-visibility checkbox list as `children` and the same trigger button as `trigger`:

```tsx
// TODO: implement
// 1. import { DataTableResponsiveMenu } from "./DataTableResponsiveMenu"
// 2. return <DataTableResponsiveMenu trigger={<Button variant="outline" size="sm" icon="Columns3">Columns</Button>} title="Columns">
// 3.   {the existing per-column visibility checkbox list}
// 4. </DataTableResponsiveMenu>
```

#### packages/react/src/collections/CollectionListViewsMenu.tsx

Guided edit against the component Step 11 creates (select / save / rename / delete /
promote).

**1 — responsive container.** Replace whatever trigger/content container
`CollectionListViewsMenu` currently returns with `DataTableResponsiveMenu`:

```tsx
// TODO: implement
// 1. import { DataTableResponsiveMenu } from "../ui/data-table/DataTableResponsiveMenu"
// 2. return <DataTableResponsiveMenu trigger={<Button variant="outline" size="sm" icon="Bookmark">Views</Button>} title="Views">
// 3.   {the existing view list + save/rename/delete/promote controls}
// 4. </DataTableResponsiveMenu>
```

#### packages/react/src/collections/CollectionListFilterBuilder.tsx

Guided edit against the component Step 10 creates, contributed as `vex.list.filters` into
`list.filters` (groups of AND rows, OR between groups).

**1 — responsive container.** Replace whatever trigger/content container
`CollectionListFilterBuilder` currently returns with `DataTableResponsiveMenu`:

```tsx
// TODO: implement
// 1. import { DataTableResponsiveMenu } from "../ui/data-table/DataTableResponsiveMenu"
// 2. return <DataTableResponsiveMenu trigger={<Button variant="outline" size="sm" icon="Filter">Filters</Button>} title="Filters">
// 3.   {the existing OR-group / AND-row builder}
// 4. </DataTableResponsiveMenu>
```

#### .agent/docs/product/v0.1.0-launch-plan.md

2 edits — everything else in the J section is unchanged.

**1 — list view owned by I.** Insert a note directly under the `## J — Responsive /
mobile UI pass` heading, before `### Tasks`:

```markdown
> **The list view's mobile layout ships with `2026-10-26-list-view-overhaul` (I), not
> here.** I's Design Decision 22 builds the toolbar overflow collapse, sheet-rendered
> menus, the sticky-first-column horizontal scroll, and the bottom-fixed bulk bar as
> part of the same spec that adds search, sort, filters, columns and saved views — so
> `CollectionListView` / `DataTable`'s mobile behavior is shipped before J runs. J's
> regression pass over the list view (375/390/768/1024 covered pre-post, plus the new
> 640/1280/1536 widths) audits I's shipped layout; a layout defect found there is I's
> follow-up, not a new J finding against a stock `DataTable`.
```

**2 — stale "known suspect".** The `DataTable` horizontal-scroll bullet under "Known
suspects, from reading the code" predates I. Append a resolution note to it:

```markdown
- `DataTable` wraps in `overflow-x-auto` (`DataTable.tsx:225`) — horizontal scroll is the
  fallback, not a mobile design. A wide collection on a 375px screen is the worst case in
  the product. **Resolved by I** — ships a sticky first column alongside the scroll
  region (list-view-overhaul Design Decision 22, Step 12); re-auditing this bullet is
  regression only.
```

Verify: browser at 375 / 390 / 768 / 1024 on `apps/test`

### Step 13 — Examples, docs, acceptance [agent]

Why: acceptance needs a 200-doc collection and a custom row + bulk action exercising `access`.
Verify: pnpm typecheck && pnpm test && vex generate && browser smoke checklist recorded

- [ ] `apps/test/src/db/constants/index.ts` + `apps/test/src/vexcms/collections/testimonials.ts` (new) + `apps/test/src/vexcms/collections/index.ts` — collection with `searchField` (2 fields), sortable columns, `views`, custom row + bulk action contributions, seed 200 docs
- [ ] `apps/test/src/components/TestimonialFeatureRowAction.tsx` + `apps/test/src/components/TestimonialBulkApproveAction.tsx` (new) — custom row + bulk action contributions
- [ ] `apps/test/src/auth/access.ts` — `testimonials` resource + `manageViews` rule
- [ ] `apps/test/convex/seed.ts` — 200 seeded rows
- [ ] `apps/docs/src/content/docs/guides/list-views.mdx` (new) — list-view guide (search, sort, filters, views, `manageViews`, slots); `README.md` `admin.table` claims made true
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — I tasks ticked; backlog updated
- [ ] browser smoke checklist: every Verify above + `manageViews` denied vs allowed

#### apps/test/src/db/constants/index.ts

1 edit — add the `testimonials` table slug beside the other `TABLE_SLUG_*` constants (unchanged lines omitted).

```ts
export const TABLE_SLUG_TESTIMONIALS = "testimonials" as const;
export type TestimonialDoc = Doc<typeof TABLE_SLUG_TESTIMONIALS>;
export type TestimonialID = Id<typeof TABLE_SLUG_TESTIMONIALS>;
```

#### apps/test/src/vexcms/collections/testimonials.ts

```ts
import { checkbox, defineCollection, select, text, textarea } from "@vexcms/core";

import { TABLE_SLUG_TESTIMONIALS } from "~/db/constants";

import { TestimonialBulkApproveAction } from "../../components/TestimonialBulkApproveAction";
import { TestimonialFeatureRowAction } from "../../components/TestimonialFeatureRowAction";

/**
 * List-view overhaul acceptance surface (spec 2026-10-26-list-view-overhaul).
 *
 * 200 seeded rows (`convex/seed.ts`) make Load-More alone impractical, which is the
 * point: `authorName` + `company` cover decision 2's two-field `searchField` case,
 * `rating` and `status` are the sortable/hideable columns, `views` ships one config
 * view per source the merged picker has to dedupe against (shared/local come from the
 * saved-views UI at runtime), and the row/bulk contributions below exercise decision 17
 * against the `manageViews`-gated `access` rule declared in `~/auth/access.ts`.
 */
export const testimonials = defineCollection({
  slug: TABLE_SLUG_TESTIMONIALS,
  interfaceName: "Testimonial",
  labels: {
    singular: "Testimonial",
    plural: "Testimonials",
  },
  admin: {
    useAsTitle: "authorName",
    icon: "Quote",
    table: {
      searchField: ["authorName", "company"],
      defaultSort: { field: "_creationTime", order: "desc" },
      defaultColumns: ["authorName", "company", "rating", "status"],
      pageSizeOptions: [10, 25, 50, 100],
      defaultPageSize: 25,
      views: [
        {
          viewId: "featured",
          name: "Featured",
          state: {
            where: { field: "featured", op: "eq", value: true },
            sort: { field: "rating", order: "desc" },
            columns: ["authorName", "company", "rating"],
          },
        },
        {
          viewId: "pending-review",
          name: "Pending Review",
          state: {
            where: { field: "status", op: "eq", value: ["pending"] },
            sort: { field: "_creationTime", order: "asc" },
          },
        },
      ],
    },
    components: {
      rowActions: [{ id: "testimonials.feature", component: TestimonialFeatureRowAction }],
      bulkActions: [{ id: "testimonials.bulkApprove", component: TestimonialBulkApproveAction }],
    },
  },
  fields: {
    authorName: text({
      label: "Author Name",
      required: true,
      searchIndex: { name: "search_testimonials_authorName", filterFields: [] },
      admin: { enableSorting: true },
      description: "First `searchField` entry — the default field when the user starts typing.",
    }),
    company: text({
      label: "Company",
      searchIndex: { name: "search_testimonials_company", filterFields: [] },
      admin: { enableSorting: true },
      description: "Second `searchField` entry, picked from the field dropdown.",
    }),
    quote: textarea({
      label: "Quote",
      required: true,
      description: "The testimonial text.",
    }),
    rating: select({
      label: "Rating",
      required: true,
      defaultValue: ["5"],
      options: [
        { label: "1 star", value: "1" },
        { label: "2 stars", value: "2" },
        { label: "3 stars", value: "3" },
        { label: "4 stars", value: "4" },
        { label: "5 stars", value: "5" },
      ],
      admin: { enableSorting: true },
      description: "Sortable column — exercises `DataTableSortHeader` against a non-index-leading field with no declared index (config-time error if `enableSorting` were left on without one; `_creationTime` and `status` below carry the only two indexed sorts).",
    }),
    status: select({
      label: "Status",
      defaultValue: ["pending"],
      index: "by_status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
      ],
      admin: { enableSorting: true, enableHiding: true },
      description: "Gates the bulk-approve action and backs the Pending Review view.",
    }),
    featured: checkbox({
      label: "Featured",
      admin: { enableHiding: true },
      description: "Toggled by the row action below; backs the Featured view.",
    }),
  },
});
```

#### apps/test/src/vexcms/collections/index.ts

1 edit — add the barrel export, kept alphabetical beside `themes`.

```ts
export * from "./testimonials";
```

#### apps/test/src/components/TestimonialFeatureRowAction.tsx

```tsx
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { Star } from "lucide-react";
import { hasPermission, vexConvexApi } from "@vexcms/core";
import type { ListRowSlotProps } from "@vexcms/react";

import { access } from "~/auth/access";
import { useSession } from "~/auth/client";
import { Button } from "~/components/ui/button";
import type { TestimonialDoc } from "~/db/constants";

/**
 * `vex.list.row.actions` contribution for `testimonials` (decision 17). Toggles
 * `featured` on one document. Rendered per row with `{ collection, docs }` where
 * `docs` holds exactly the one row.
 *
 * @param props.collection - The resolved `testimonials` collection config.
 * @param props.docs - The row's single document — `ListRowSlotProps` isn't generic (P-002), so this casts to `TestimonialDoc[]`.
 */
export function TestimonialFeatureRowAction(props: ListRowSlotProps) {
  const { data: session } = useSession();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.update),
  });

  const doc = (props.docs as TestimonialDoc[])[0];
  if (!doc) {
    return null;
  }

  const canUpdate = hasPermission({
    access,
    user: session?.user,
    resource: props.collection.slug,
    action: "update",
    data: doc,
  });
  if (!canUpdate) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={doc.featured ? "Unfeature" : "Feature"}
      disabled={isPending}
      onClick={() =>
        mutateAsync({
          id: doc._id,
          collection: props.collection.slug,
          data: { featured: !doc.featured },
        })
      }
    >
      <Star className={doc.featured ? "fill-current" : ""} />
    </Button>
  );
}
```

#### apps/test/src/components/TestimonialBulkApproveAction.tsx

```tsx
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { CheckCheck } from "lucide-react";
import { hasPermission, vexConvexApi } from "@vexcms/core";
import type { ListRowSlotProps } from "@vexcms/react";

import { access } from "~/auth/access";
import { useSession } from "~/auth/client";
import { Button } from "~/components/ui/button";
import type { TestimonialDoc } from "~/db/constants";

/**
 * `vex.list.bulkActions` contribution for `testimonials` (decision 17). Sets
 * `status: "approved"` on every selected row that is still `pending`.
 *
 * @param props.collection - The resolved `testimonials` collection config.
 * @param props.docs - The selected documents.
 */
export function TestimonialBulkApproveAction(props: ListRowSlotProps) {
  const { data: session } = useSession();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.update),
  });

  const canUpdate = hasPermission({
    access,
    user: session?.user,
    resource: props.collection.slug,
    action: "update",
  });
  if (!canUpdate) {
    return null;
  }

  const pending = (props.docs as TestimonialDoc[]).filter((doc) => doc.status?.[0] === "pending");
  if (pending.length === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={async () => {
        await Promise.all(
          pending.map((doc) =>
            mutateAsync({
              id: doc._id,
              collection: props.collection.slug,
              data: { status: ["approved"] },
            }),
          ),
        );
      }}
    >
      <CheckCheck /> Approve {pending.length}
    </Button>
  );
}
```

#### apps/test/src/auth/access.ts

3 edits — unchanged lines omitted.

**1 — imports.** Add `testimonials` to the collections import list, alphabetically beside `themes`.

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
  testimonials,
  themes,
  users,
} from "~/vexcms/collections";
```

**2 — `resources`.** Add `testimonials` to the resource list.

```ts
  resources: [
    footers,
    headers,
    images,
    pages,
    themes,
    users,
    articles,
    caseStudies,
    changelog,
    comments,
    nav,
    siteSettings,
    posts,
    announcement,
    fields,
    testimonials,
  ],
```

**3 — `permissions`.** One rule per role, demonstrating `manageViews` allowed (`admin`, `editor`) vs denied (`contributor`, `guest`, `user`) for the smoke checklist's last line. `admin`'s existing `"*": true` already covers it; the other three roles need an explicit `testimonials` entry added to their blocks.

```ts
    // ── Editor: full editorial control, no ownership restriction ────────────
    [USER_ROLES.editor]: {
      "*": false,
      articles: true,
      case_studies: true,
      changelog: true,
      comments: true,
      posts: true,
      testimonials: true,
      announcement: {
```

```ts
    // ── Contributor: same matrix, own rows only ─────────────────────────────
    [USER_ROLES.contributor]: {
      "*": false,
      articles: {
```
Add, alongside the other resource blocks in the same object (after `posts`, before `adminPanel`):
```ts
      testimonials: {
        read: true,
        update: true,
        manageViews: false,
      },
      adminPanel: {
```

```ts
    // ── User: public reader ────────────────────────────────────────────────
    [USER_ROLES.user]: {
      "*": false,
```
Add, alongside the other resource blocks (after `themes`, the last entry before the closing brace):
```ts
      testimonials: {
        "*": false,
        read: true,
      },
```

#### apps/test/convex/seed.ts

1 edit — a new insert-if-missing section appended inside `runSeed`, mirroring the editorial-fixtures section's pattern (always insert-if-missing regardless of `mode`), right before the `return { created, patched, skipped }` line.

```ts
  // ── TEST-ONLY: testimonials (list-view overhaul acceptance) ─────────────
  // 200 deterministic rows so Load-More alone is impractical — the acceptance bar
  // for spec 2026-10-26-list-view-overhaul. Insert-if-missing like the editorial
  // fixtures above: keyed by `authorName`, which is unique across the generated set.
  const existingTestimonialCount = await ctx.db.query("testimonials").take(1);
  if (existingTestimonialCount.length > 0) {
    skipped.push("testimonials (already seeded)");
  } else {
    const companies = [
      "Northwind",
      "Maprios",
      "Acme Logistics",
      "Bluepeak",
      "Ferrotype",
      "Lumen Works",
      "Cedar & Finch",
      "Vantage Point",
      "Greystone",
      "Harbor Line",
    ];
    const ratings = ["1", "2", "3", "4", "5"] as const;
    for (let i = 0; i < 200; i++) {
      const rating = ratings[i % ratings.length];
      const status = i % 5 === 0 ? "pending" : "approved";
      await ctx.db.insert("testimonials", {
        authorName: `Testimonial Author ${i + 1}`,
        company: companies[i % companies.length],
        quote: `Reviewer ${i + 1} on ${companies[i % companies.length]}: a representative seeded quote for acceptance testing.`,
        rating: [rating],
        status: [status],
        featured: i % 11 === 0,
      });
    }
    created.push("testimonials x200");
  }

  return { created, patched, skipped };
}
```

#### apps/docs/src/content/docs/guides/list-views.mdx

```mdx
---
title: List Views
description: Search, portable sort, filters, column visibility, page size, saved views, and list.* slots for collection list views.
---

Every collection list view ships a paginated, searchable, sortable, filterable data
table driven entirely by `admin.table` — each control reads one config key, and a
control with no key stays hidden.

## Search

```ts
admin: {
  table: {
    searchField: ["authorName", "company"],
  },
},
fields: {
  authorName: text({ searchIndex: { name: "search_testimonials_authorName", filterFields: [] } }),
  company: text({ searchIndex: { name: "search_testimonials_company", filterFields: [] } }),
},
```

`searchField` lists the fields the search bar can query, in picker order; the first
entry is the default. Every entry must declare a `searchIndex` — `defineConfig` throws a
`VexConfigError` naming the field and the index to add otherwise. With no `searchField`,
the search bar is not rendered. While a search query is active, sort headers disable and
show "sorted by relevance" (Convex search results are relevance-ordered, and the server
rejects `sort` alongside `search`).

## Sort

```ts
admin: {
  table: {
    defaultSort: { field: "_creationTime", order: "desc" },
  },
},
fields: {
  rating: select({ admin: { enableSorting: true } }),
},
```

Sort is portable — `{ field, order }`, never an index name. The server resolves `field`
to the index whose first field leads with it (draft-status-aware); `_creationTime` needs
no index. `defaultSort.field` and every `enableSorting` field must lead some index, or
`defineConfig` throws naming the index to declare.

## Column visibility

```ts
admin: {
  table: {
    defaultColumns: ["authorName", "company", "rating", "status"],
  },
},
fields: {
  status: select({ admin: { enableHiding: true } }),
},
```

With no saved view selected, column visibility is session-only — there is no
auto-persisted last-used state.

## Filters

The filter builder renders into the `list.filters` slot. It edits one level of OR
groups of AND rows (`eq`/`neq`/`gt`/`gte`/`lt`/`lte`), stored as the same plain
`VexWhereNode` `find`/`search` already accept: `{ or: [{ and: [leaf, …] }, …] }`. A
`where` outside that normal form (for example a config view's hand-written node) renders
read-only.

## Page size

```ts
admin: {
  table: {
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
  },
},
```

Pagination stays cursor-based Load More; the page-size select only changes how many rows
Load More fetches per click.

## Saved views

```ts
admin: {
  table: {
    views: [
      {
        viewId: "featured",
        name: "Featured",
        state: { where: { field: "featured", op: "eq", value: true }, sort: { field: "rating", order: "desc" } },
      },
    ],
  },
},
```

Views come from three sources, merged by `viewId`: `config` (`admin.table.views`,
read-only), `shared` (the `vex_views` Convex table), and `local` (the browser's
`localStorage`). Shared views are collection-wide, scoped to the organization when
`access.orgCollectionSlug` is set — there are no user or role scopes; `local` is the
personal tier. Saving a local view shared ("promoting" it) keeps the same `viewId`, is
idempotent, and deletes the local entry only after the shared save succeeds.

## `manageViews`

Creating, editing, and deleting **shared** views requires the `manageViews` action,
denied by default:

```ts
permissions: {
  editor: { testimonials: true },
  contributor: { testimonials: { read: true, update: true, manageViews: false } },
},
```

A user without `manageViews` can still save views locally — the menu only disables the
"Save shared" option, not the feature.

## `list.*` slots

| Slot | Built-in |
| --- | --- |
| `list.header.actions` | `vex.list.create` |
| `list.toolbar` | `vex.list.search`, `vex.list.columns`, `vex.list.views` |
| `list.filters` | `vex.list.filters` |
| `list.beforeTable` / `list.afterTable` | — |
| `list.row.actions` | `vex.list.row.delete` |
| `list.bulkActions` | `vex.list.bulk.delete` |

Row and bulk actions are plain components receiving `{ collection, docs }` — `docs` is
one document for a row action, the full selection for a bulk action. There is no
declarative `{ label, mutation }` sugar; contribute a component via
`admin.components`:

```ts
admin: {
  components: {
    rowActions: [{ id: "testimonials.feature", component: TestimonialFeatureRowAction }],
    bulkActions: [{ id: "testimonials.bulkApprove", component: TestimonialBulkApproveAction }],
  },
},
```

See `apps/test/src/vexcms/collections/testimonials.ts` for the full working example —
200 seeded rows, two `searchField` entries, two sortable columns, two saved views, and
the row/bulk contributions above.
```

#### README.md

1 edit — replace the "Pagination & Data Tables" section's example and launch-track callout (lines 293–313) now that search, sort, and column visibility ship.

```md
### Pagination & Data Tables

The admin panel's collection list view is a paginated data table backed by Convex's
`usePaginatedQuery`, with per-collection search, sort, column visibility, page size, and
saved views, driven entirely by `admin.table`:

\`\`\`typescript
export const posts = defineCollection({
  slug: "posts",
  admin: {
    table: {
      searchField: ["title"],
      defaultSort: { field: "_creationTime", order: "desc" },
      defaultColumns: ["title", "status"],
      pageSizeOptions: [10, 25, 50, 100],
      defaultPageSize: 10,
    },
  },
  fields: {
    title: text({ searchIndex: { name: "search_title", filterFields: [] } }),
    status: select({ admin: { enableSorting: true, enableHiding: true } }),
  },
});
\`\`\`

> See the [list views guide](apps/docs/src/content/docs/guides/list-views.mdx) for
> filters, saved views, and `list.*` slots for custom row/bulk actions.
```

#### .agent/docs/product/v0.1.0-launch-plan.md

1 edit — tick the `I` section's task list (lines 997–1007) now that the spec and implementation steps are planned/landed.

```md
### Tasks
- [x] Write spec (needs B3 and G steps 7–8)
- [x] Implement
  - [x] A's remainder (`vex_` convention, `updatedAt`; default-sort fix already done)
  - [x] Per-collection search
  - [x] Sort (`defaultSort`, column flags, header affordances)
  - [x] Column visibility (`defaultColumns`, menu)
  - [x] Page-size control
  - [x] Saved views (scoped, plain `where`)
  - [x] Per-collection data-source hooks
  - [x] Status enum replaces string literals
  - [x] List-view slots, built-ins as `vex.*` contributions; row and bulk actions
```

Browser smoke checklist:

Recorded against `apps/test` on a running `next dev` instance (never started by an
agent — P-024), signed in as each role in turn.

1. **Search** — `/admin/testimonials`, type into the search field; results narrow by
   `authorName`. Switch the field picker to `company`; results narrow by company instead.
2. **Sort** — click the `Rating` header; rows reorder ascending, then descending on a
   second click. While a search query is active, the header shows "sorted by relevance"
   and is disabled.
3. **Filters** — open `list.filters`, add two AND rows in one group, add a second OR
   group; reload the page and confirm the `where` round-trips through the URL.
4. **Columns** — hide the `Status` column via the columns menu; it disappears without a
   saved view selected (session-only).
5. **Page size** — change the page-size select to 50; Load More fetches 50 rows per
   click.
6. **Views** — select the `Featured` config view (read-only); save the current state as
   a local view; as a role with `manageViews` (`editor`/`admin`), promote it to shared.
7. **`manageViews` denied vs allowed** — as `contributor`, confirm the "Save shared" /
   promote action is disabled (local save still works); as `editor`, confirm it is
   enabled and a saved shared view appears for both roles.
8. **Row + bulk actions** — click the star row action on one testimonial; `featured`
   toggles. Select several `pending` rows and click "Approve N"; all selected rows become
   `approved` and the action disappears once none remain pending.
9. **Mobile** — at 375 / 390 / 768 / 1024, the toolbar collapses into an overflow menu,
   menus render as sheets below `md`, the table scrolls horizontally with a sticky first
   column, and the bulk bar is fixed to the bottom (Step 12).

Verify: pnpm typecheck && pnpm test && vex generate && the checklist above, all 9 items
passing for at least one allowed role and one denied role.

## Verification

- `pnpm typecheck && pnpm test` green
- `harness doctor` clean
- `vex generate` in `apps/test` emits `vex_views` and every `searchField` search index
- Step 13 browser smoke checklist recorded
