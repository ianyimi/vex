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

# 2026-10-26-list-view-overhaul — Tasks

All steps are `[agent]`. File placement follows `react-feature-folders`: flat files in existing domain folders, no new top-level folders (list UI in `react/src/collections/` prefixed `CollectionList*`, generic table controls in `react/src/ui/data-table/`, data hooks in `react/src/hooks/`, saved-view ops in `collections/api/`). Step bodies are mixed: Steps 3, 4, 7, and 11 ship full code; the rest ship guided stubs (signatures, JSDoc, numbered `// TODO: implement` pseudocode) filled in during the full-code pass.

## Step 1 — A's remainder: `vex_` convention + `updatedAt` [agent]
Why: C and I both add framework tables; the convention must be written before `vex_views` is introduced. `updatedAt` was verified-only in A.
Verify: harness doctor
- [ ] `.agent/docs/standards/naming-conventions.md` — `vex_` rule: every framework table and system field is `vex_`-prefixed, emitted unconditionally by `generateVexSchema`, never user-declarable; migration rule for renames
- [ ] `updatedAt` behavior confirmed against `api/create/server.ts` / update path, against `apps/docs/src/content/docs/guides/caching-and-seo.mdx` (already accurate, no code/doc change — no dedicated collections docs page exists)
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — A's remainder checkbox ticked

## Step 2 — Status enum replaces string literals [agent]
Why: approval stages and branches will add states later; badges/filters must iterate `VERSION_STATUSES`, not switch on two literals.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test
- [ ] `packages/react/src/versions/StatusBadge.tsx` — label/variant resolved by looking up `VERSION_STATUSES[props.status]`
- [ ] `packages/react/src/collections/CollectionEditView.tsx` — `publishedTimeline` filter + `DraftToolbar` status prop read `VERSION_STATUSES.*.key`
- [ ] `packages/react/src/globals/GlobalEditView.tsx` — same sweep: `publishedTimeline`, `isDraftDoc`, `documentStatus`/`DraftToolbar` ternaries
- [ ] `packages/react/src/versions/VersionHistoryDropdown.tsx` — `publishedVersion` reduction reads `VERSION_STATUSES.published.key`
- [ ] `packages/react/src/testing/convex/schema.ts` — `vex_status` and `vex_versions.status` fields emit from `VERSION_STATUSES.*.key`
- [ ] grep-proof: no raw `"draft"` / `"published"` status literals remain in `packages/*/src` non-test files

## Step 3 — `admin.table` config surface + config-time validation [agent]
Why: every control ships with the key that drives it; bad `searchField` / unindexed sort must fail at `defineConfig`, naming the index to declare.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- collections
- [ ] `packages/core/src/collections/types.ts` — `CollectionTableSort<TFieldSlug>`; `searchField?: readonly TFieldSlug[]`; `defaultSort` typed to field slugs + `_creationTime`; `defaultColumns?: TFieldSlug[]`; `AdminCollectionConfigInput`/`AdminCollectionConfig` thread `TFieldSlug` into `table`
- [ ] `packages/core/src/fields/baseTypes.ts` — `admin.enableSorting?: boolean` / `admin.enableHiding?: boolean` on `FieldAdminConfigInput` and resolved `FieldAdminConfig`
- [ ] `packages/core/src/collections/config.ts` — resolve defaults (no `searchField` → search hidden; `defaultColumns` → all non-hidden fields; `enableSorting`/`enableHiding` default `false`); wires `validateTableConfig`
- [ ] `packages/core/src/collections/validateTableConfig.ts` (new) + `packages/core/src/collections/validateTableConfig.test.ts` (new) — throws `VexConfigError` when a `searchField` entry has no `searchIndex`, or `defaultSort.field` / an `enableSorting` field has no index leading with it; message names field + index to declare
- [ ] `packages/core/src/collections/validator.test.ts` — confirms `.searchIndex()` is emitted for every field with its own `searchIndex`, independent of `useAsTitle`/incoming relationships
- [ ] `packages/core/src/collections/config.test.ts` — type tests: `admin.table.searchField`, `defaultSort.field`, `defaultColumns` reject unknown field slugs

## Step 4 — `manageViews` access action + `vex_views` table [agent]
Why: shared views need a store and a gate; default denied (fail-closed).
Verify: pnpm --filter @vexcms/core test -- access schema collections
- [ ] `packages/core/src/access/constants.ts` — `VIEW_ACTIONS = { manageViews }`
- [ ] `packages/core/src/access/types.ts` — `HasTable` guard; `ViewAction` wired into `SubjectMap`'s per-resource action union (collections only; `hasPermission` already fail-closes an undeclared action)
- [ ] `packages/core/src/schema/generateVexSchema.ts` + `packages/core/src/schema/generateVexSchema.test.ts` — emit `vex_views` unconditionally: `collection`, `viewId`, `name`, `state`, `organizationId?`, `createdBy`; indexes `by_collection`, `by_collection_org`, `by_view_id`
- [ ] `packages/core/src/collections/constants.ts` (new) — `VEX_VIEW_SOURCES` map + derived `VexViewSource` union
- [ ] `packages/core/src/collections/types.ts` — `VexViewState`, `VexViewConfig`, `VexStoredView`; completes `admin.table.views` Step 3 deferred (threads `views` through `CollectionTableConfigInput`/`CollectionTableConfig`)
- [ ] `packages/core/src/collections/config.ts` — resolves `admin.table.views` default (`[]`)
- [ ] `packages/core/src/collections/validateTableConfig.ts` + `packages/core/src/collections/validateTableConfig.test.ts` — config-time `viewId`-uniqueness check across `admin.table.views`

## Step 5 — Portable sort in `find` [agent]
Why: clients send `sort { field, order }`, never `withIndex`; server resolves the leading index so stored views stay backend-neutral.
Verify: pnpm --filter @vexcms/core test -- find
- [ ] `packages/core/src/collections/resolveSort.ts` (new) + `packages/core/src/collections/resolveSort.test.ts` (new) — `sort` → index whose first field is `field` (draftStatus-aware); `_creationTime` → default order; unknown → `VexError` naming the index to declare
- [ ] `packages/core/src/collections/api/find/server.ts` + `packages/core/src/collections/api/find/server.test.ts` — accept `sort`; mutually exclusive with `withIndex` from clients; access-constraint index selection precedence documented and tested
- [ ] `packages/core/src/collections/api/search/server.ts` + `packages/core/src/collections/api/search/server.test.ts` — accepts `searchField` selection from the `searchField` list; `sort` rejected while searching (no `sort` arg in the Convex registration itself)
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — `find` registration threads `sort` through

## Step 6 — Views server API [agent]
Why: shared views CRUD must enforce `manageViews` server-side and scope by org.
Verify: pnpm --filter @vexcms/core test -- collections/api
- [ ] `packages/core/src/collections/api/listViews/server.ts` + `packages/core/src/collections/api/listViews/server.test.ts` (new) — list for collection, scoped to `organizationId` resolved server-side from the caller's session
- [ ] `packages/core/src/collections/api/saveView/server.ts` + `packages/core/src/collections/api/saveView/server.test.ts` (new) — create/patch, idempotent on `viewId` (promotion dedupe), requires `manageViews`
- [ ] `packages/core/src/collections/api/removeView/server.ts` + `packages/core/src/collections/api/removeView/server.test.ts` (new) — delete, requires `manageViews`
- [ ] `packages/core/src/collections/api/types.ts` — shared arg/result types for the three operations
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — registers `listViews`/`saveView`/`removeView`
- [ ] `packages/core/src/vexConvexApi.ts` — exports the three Convex function references
- [ ] `packages/core/src/db/test/convex/schema.ts` — `vex_views` table added to `@vexcms/core`'s own hand-maintained test fixture schema (separate from `generateVexSchema.ts`'s generated output; needed so this step's tests compile)
- [ ] `packages/react/src/collections/api/listViews/client.ts` + `packages/react/src/collections/api/saveView/client.ts` + `packages/react/src/collections/api/removeView/client.ts` (new) — tanstack-query wrappers
- [ ] `packages/react/src/client/index.ts` — re-exports the three client ops + `VexStoredView`/`VexViewConfig` types

## Step 7 — Data-source hooks: `useVexList` / `useVexDoc` [agent]
Why: the hook boundary is where plugin, adapter and adopted-table sources plug in later; list/edit views stop calling `vexConvexApi` directly.
Verify: pnpm --filter @vexcms/react test -- hooks collections && browser: list + edit views unchanged
- [ ] `packages/react/src/hooks/useVexList.ts` (new) + `packages/react/src/hooks/useVexList.test.tsx` (new) — `{ collection, where, sort, search, searchField, drafts, pageSize, depth, initialData }` → `{ results, totalDocs, isDone, loadMore, isPending }`; wraps `usePaginatedQuery`
- [ ] `packages/react/src/hooks/useVexDoc.ts` (new) + `packages/react/src/hooks/useVexDoc.test.tsx` (new) — `{ collection, id, drafts, skip, initialData }` → `{ document, isPending }`
- [ ] `packages/react/src/hooks/index.ts` — barrel exports the two new hooks
- [ ] `packages/react/src/collections/api/find/client.ts` — `FindClientArgs`/`FindClientPaginatedArgs` gain `sort?: CollectionTableSort<string>`, mirroring Step 5 server-side
- [ ] `packages/react/src/testing/convex/bridge.ts` — fake `"vex:find"` handler forwards `args.where`
- [ ] `packages/react/src/testing/hooksSuite.tsx` — registers the `useVexList`/`useVexDoc` describe blocks
- [ ] `packages/react/src/collections/CollectionListView.tsx` — pagination migrated to `useVexList`
- [ ] `packages/react/src/media/MediaCollectionListView.tsx` — pagination migrated to `useVexList`
- [ ] `packages/react/src/collections/CollectionEditView.tsx` — both document reads migrated to `useVexDoc`; mutations (`vexConvexApi.remove`/`.update`/`.versions.*`) stay, scoped out of this step's "no direct `vexConvexApi`" (read-side only)

## Step 8 — List slots + built-ins as `vex.*` contributions [agent]
Why: create, search, filters, columns, views, row/bulk delete become contributions so custom actions use the same path (plugin stem S1–S14, client-only S14).
Verify: pnpm --filter @vexcms/core test -- components && pnpm --filter @vexcms/react test -- collections slots && browser: list renders identically
- [ ] `packages/core/src/components/types.ts` — `SLOT_IDS.list`: `headerActions`, `toolbar`, `filters`, `beforeTable`, `afterTable`, `rowActions`, `bulkActions`
- [ ] `packages/core/src/components/builtinIds.ts` — `vex.list.create`, `vex.list.search`, `vex.list.filters`, `vex.list.columns`, `vex.list.views`, `vex.list.row.delete`, `vex.list.bulk.delete`
- [ ] `packages/core/src/collections/types.ts` — `AdminListComponentsInput`/`AdminListComponents`; `admin.components` on collection config
- [ ] `packages/core/src/collections/config.ts` — resolves `admin.components` defaults via `resolveComponentContributions`
- [ ] `packages/core/src/collections/config.test.ts` — defaults + custom `list.bulkActions` contribution ordering
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — bulk-delete UI moves out; `onSelectionChange` callback replaces `onBulkDelete`/`enableBulkActions`
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` (new) + `packages/react/src/collections/CollectionListLayout.test.tsx` (new) — places `SlotOutlet` per slot; row/bulk contributions receive `{ collection, docs }`, gated by `access`; built-in create/row-delete/bulk-delete actions
- [ ] `packages/react/src/collections/CollectionListView.tsx` — delegates rendering to `CollectionListLayout`; `RevalidateButton` stays outside it (Decision 23)

## Step 9 — Toolbar controls + URL state [agent]
Why: search, sort, columns and page size are the core navigability acceptance; URL makes lists shareable.
Verify: pnpm --filter @vexcms/react test -- collections ui/data-table && browser: search, field switch, sort, column hide, page size, reload keeps state
- [ ] `packages/react/src/collections/useCollectionListUrlState.ts` (new) + `packages/react/src/collections/useCollectionListUrlState.test.tsx` (new) — `search`, `searchField`, `sort`, `where` (JSON, plain form), `pageSize`, `view`; invalid params dropped, not thrown
- [ ] `packages/react/src/collections/CollectionListSearch.tsx` (new) + `packages/react/src/collections/CollectionListSearch.test.tsx` (new) — debounced input + field picker (config order, first default); hidden without `searchField`
- [ ] `packages/react/src/ui/data-table/DataTableSortHeader.tsx` (new) + `.test.tsx` — sortable headers (only `enableSorting`), disabled with "sorted by relevance" during search
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` (new) + `.test.tsx` — `enableHiding` columns; session-only state when no view selected
- [ ] `packages/react/src/ui/data-table/DataTablePageSizeSelect.tsx` (new) + `.test.tsx` — `pageSizeOptions`; Load More retained
- [ ] `packages/react/src/fields/index.tsx` — `getCollectionColumnDefs` sets every column's `enableSorting`/`enableHiding` from field admin config in one central pass
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — controlled `sort`/`onSortChange`/`sortDisabled`/`visibleColumns`; sortable headers render via `DataTableSortHeader`
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` (new) + `.test.tsx` — hosts `list.toolbar` (`vex.list.search`/`vex.list.columns` built-ins) plus the un-slotted `DataTablePageSizeSelect`
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` — renders `CollectionListToolbar`; threads `sort`/`visibleColumns` into `DataTable`
- [ ] `packages/react/src/collections/CollectionListView.tsx` — calls `useCollectionListUrlState` and feeds it into `useVexList`; owns session-only `visibleColumns` state
- [ ] `packages/react/src/collections/index.ts` + `packages/react/src/ui/data-table/index.ts` — barrel exports for the new files
- [ ] all controls built responsive (375 → 1024)

## Step 10 — Filter builder (AND rows + one level of OR groups) [agent]
Why: authors `where` for URL and views; DNF covers multi-value and triage use cases without a tree editor.
Verify: pnpm --filter @vexcms/react test -- collections/whereDnf collections/CollectionListFilterBuilder && browser: OR group round-trips through URL reload
- [ ] `packages/react/src/collections/whereDnf.ts` (new) + `packages/react/src/collections/whereDnf.test.ts` (new) — `toDnf(where) | null` and `fromDnf(groups)`; non-DNF → null
- [ ] `packages/react/src/collections/CollectionListFilterBuilder.tsx` (new) — groups (OR) of rows (AND) over `eq/neq/gt/gte/lt/lte`; value input by field type; non-DNF `where` shown read-only
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` — contributes `CollectionListFilterBuilder` as `vex.list.filters` into the `list.filters` outlet, wired to `props.urlState.where`/`setWhere`

## Step 11 — Saved views client [agent]
Why: views persist per user (local) or shared (Convex, `manageViews`); config views ship in code.
Verify: pnpm --filter @vexcms/react test -- collections && browser: save local, save shared, promote, denied user sees local-only save
- [ ] `packages/react/src/collections/collectionListViewStore.ts` (new) + `packages/react/src/collections/collectionListViewStore.test.ts` (new) — localStorage keyed by project + collection, `viewId` generated client-side
- [ ] `packages/react/src/collections/useCollectionListViews.ts` (new) + `packages/react/src/collections/useCollectionListViews.test.ts` (new) — merge config + shared + local, dedupe by `viewId`, source badge
- [ ] promotion = shared save then local delete on success; failure keeps local
- [ ] `packages/react/src/collections/CollectionListViewsMenu.tsx` (new) — select / save / rename / delete / promote; shared edits gated by `manageViews`
- [ ] `packages/react/src/collections/index.ts` — barrel export for `CollectionListViewsMenu`
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` — adds the `vex.list.views` built-in (Decision 18) to Step 9's toolbar memo

## Step 12 — Mobile list layout [agent]
Why: J dropped the list view from its scope; I owns it end to end.
Verify: browser at 375 / 390 / 768 / 1024 on `apps/test`
- [ ] `packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx` (new) + `.test.tsx` — one trigger/content pair: `Popover` at `md`+, bottom `Sheet` below `md`
- [ ] `packages/react/src/ui/data-table/index.ts` — barrel export for `DataTableResponsiveMenu`
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — sticky first column (header + body cells) while the table scrolls horizontally
- [ ] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — bar fixed to the bottom below `md`, floating/top-centered at `md`+
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` — non-search controls (columns menu, views menu, page size) collapse into one `DataTableResponsiveMenu` overflow trigger below `md`
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` + `packages/react/src/collections/CollectionListViewsMenu.tsx` + `packages/react/src/collections/CollectionListFilterBuilder.tsx` — each swaps its trigger/content container for `DataTableResponsiveMenu`
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — J section notes list view owned by I; stale "known suspect" bullet resolved

## Step 13 — Examples, docs, acceptance [agent]
Why: acceptance needs a 200-doc collection and a custom row + bulk action exercising `access`.
Verify: pnpm typecheck && pnpm test && vex generate && browser smoke checklist recorded
- [ ] `apps/test/src/db/constants/index.ts` — `TABLE_SLUG_TESTIMONIALS` + `TestimonialDoc`/`TestimonialID`
- [ ] `apps/test/src/vexcms/collections/testimonials.ts` (new) — `searchField` (2 fields), sortable/hideable columns, `views`, custom row + bulk action contributions via `admin.components`; seed 200 docs
- [ ] `apps/test/src/vexcms/collections/index.ts` — barrel export for `testimonials`
- [ ] `apps/test/src/components/TestimonialFeatureRowAction.tsx` (new) — `vex.list.row.actions`-style contribution (`ListRowSlotProps`), toggles `featured`
- [ ] `apps/test/src/components/TestimonialBulkApproveAction.tsx` (new) — `vex.list.bulkActions`-style contribution (`ListRowSlotProps`), bulk-approves `pending` rows
- [ ] `apps/test/src/auth/access.ts` — `testimonials` resource + `manageViews` rule (allowed for `admin`/`editor`, denied for `contributor`/`guest`/`user`)
- [ ] `apps/test/convex/seed.ts` — 200 deterministic testimonial rows, insert-if-missing
- [ ] `apps/docs/src/content/docs/guides/list-views.mdx` (new) — search, sort, filters, columns, saved views, `manageViews`, `list.*` slots
- [ ] `README.md` — "Pagination & Data Tables" section updated, `admin.table` claims made true
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — I tasks ticked; backlog updated
- [ ] browser smoke checklist: every Verify above + `manageViews` denied vs allowed
