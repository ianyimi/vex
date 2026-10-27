---
status: draft
spec_id: 2026-10-26-list-view-overhaul
touches:
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - ".agent/docs/standards/naming-conventions.md"
  - ".agent/docs/standards/preferences.md"
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
  - "packages/core/src/collections/index.ts"
  - "packages/core/src/collections/resolveConfigViewWhere.test.ts"
  - "packages/core/src/collections/resolveConfigViewWhere.ts"
  - "packages/core/src/collections/resolveSort.test.ts"
  - "packages/core/src/collections/resolveSort.ts"
  - "packages/core/src/collections/toClientViewConfig.test.ts"
  - "packages/core/src/collections/toClientViewConfig.ts"
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
  - "packages/react/src/collections/CollectionListCopyLinkButton.test.tsx"
  - "packages/react/src/collections/CollectionListCopyLinkButton.tsx"
  - "packages/react/src/collections/CollectionListEmptyState.test.tsx"
  - "packages/react/src/collections/CollectionListEmptyState.tsx"
  - "packages/react/src/collections/CollectionListFilterBuilder.tsx"
  - "packages/react/src/collections/CollectionListFilterChips.test.ts"
  - "packages/react/src/collections/CollectionListFilterChips.tsx"
  - "packages/react/src/collections/CollectionListHiddenFilterBadge.test.tsx"
  - "packages/react/src/collections/CollectionListHiddenFilterBadge.tsx"
  - "packages/react/src/collections/CollectionListLayout.test.tsx"
  - "packages/react/src/collections/CollectionListLayout.tsx"
  - "packages/react/src/collections/CollectionListPeek.test.tsx"
  - "packages/react/src/collections/CollectionListPeek.tsx"
  - "packages/react/src/collections/CollectionListQueryError.test.tsx"
  - "packages/react/src/collections/CollectionListQueryError.tsx"
  - "packages/react/src/collections/CollectionListSaveViewDialog.test.tsx"
  - "packages/react/src/collections/CollectionListSaveViewDialog.tsx"
  - "packages/react/src/collections/CollectionListSearch.test.tsx"
  - "packages/react/src/collections/CollectionListSearch.tsx"
  - "packages/react/src/collections/CollectionListToolbar.test.tsx"
  - "packages/react/src/collections/CollectionListToolbar.tsx"
  - "packages/react/src/collections/CollectionListView.tsx"
  - "packages/react/src/collections/CollectionListViewTabs.test.tsx"
  - "packages/react/src/collections/CollectionListViewTabs.tsx"
  - "packages/react/src/collections/api/find/client.ts"
  - "packages/react/src/collections/api/listViews/client.ts"
  - "packages/react/src/collections/api/removeView/client.ts"
  - "packages/react/src/collections/api/saveView/client.ts"
  - "packages/react/src/collections/collectionListUrlParams.test.ts"
  - "packages/react/src/collections/collectionListUrlParams.ts"
  - "packages/react/src/collections/collectionListViewStore.test.ts"
  - "packages/react/src/collections/collectionListViewStore.ts"
  - "packages/react/src/collections/index.ts"
  - "packages/react/src/collections/useCollectionListPeekPrefetch.test.ts"
  - "packages/react/src/collections/useCollectionListPeekPrefetch.ts"
  - "packages/react/src/collections/useCollectionListShortcuts.test.ts"
  - "packages/react/src/collections/useCollectionListShortcuts.ts"
  - "packages/react/src/collections/useCollectionListUrlState.test.tsx"
  - "packages/react/src/collections/useCollectionListUrlState.ts"
  - "packages/react/src/collections/useCollectionListViews.test.ts"
  - "packages/react/src/collections/useCollectionListViews.ts"
  - "packages/react/src/collections/whereDnf.test.ts"
  - "packages/react/src/collections/whereDnf.ts"
  - "packages/react/src/fields/index.tsx"
  - "packages/react/src/globals/GlobalEditView.tsx"
  - "packages/react/src/hooks/index.ts"
  - "packages/react/src/hooks/usePaginatedQuery.ts"
  - "packages/react/src/hooks/useVexDoc.test.tsx"
  - "packages/react/src/hooks/useVexDoc.ts"
  - "packages/react/src/hooks/useVexList.test.tsx"
  - "packages/react/src/hooks/useVexList.ts"
  - "packages/react/src/media/MediaCollectionListView.tsx"
  - "packages/react/src/testing/convex/bridge.ts"
  - "packages/react/src/testing/convex/schema.ts"
  - "packages/react/src/testing/hooksSuite.tsx"
  - "packages/react/src/ui/ScrollSection.test.tsx"
  - "packages/react/src/ui/ScrollSection.tsx"
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
  - "packages/react/src/ui/index.ts"
  - "packages/react/src/versions/StatusBadge.tsx"
  - "packages/react/src/versions/VersionHistoryDropdown.tsx"
prompt_version: 1
---

# 2026-10-26-list-view-overhaul — Tasks

All steps are `[agent]`. File placement follows `react-feature-folders`: flat files in existing domain folders, no new top-level folders (list UI in `react/src/collections/` prefixed `CollectionList*`, generic table controls in `react/src/ui/data-table/`, data hooks in `react/src/hooks/`, saved-view ops in `collections/api/`). Step bodies are mixed: Steps 3, 4, 7, and 11 ship full code; the rest ship guided stubs (signatures, JSDoc, numbered `// TODO: implement` pseudocode) filled in during the full-code pass.

## Step 1 — A's remainder: `vex_` convention + `updatedAt` + Decision 31 preference entry [agent]
Why: C and I both add framework tables; the convention must be written before `vex_views` is introduced. `updatedAt` was verified-only in A. Decision 31 (fixed-height-with-internal-scroll + `ui/ScrollSection.tsx`) is a standing pattern this spec establishes and must be ratified in `preferences.md` before Step 9 builds `ScrollSection.tsx` against it.
Verify: harness doctor
- [ ] `.agent/docs/standards/naming-conventions.md` — `vex_` rule: every framework table and system field is `vex_`-prefixed, emitted unconditionally by `generateVexSchema`, never user-declarable; migration rule for renames
- [ ] `updatedAt` behavior confirmed against `api/create/server.ts` / update path; confirmed accurate against `guides/caching-and-seo.mdx` (no dedicated collections docs page exists) + launch plan A item ticked
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — A's remainder checkbox ticked
- [ ] `.agent/docs/standards/preferences.md` — new `P-029` entry for Decision 31

## Step 2 — Status enum replaces string literals [agent]
Why: approval stages and branches will add states later; badges/filters must iterate `VERSION_STATUSES`, not switch on two literals.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test
- [ ] `packages/react/src/versions/StatusBadge.tsx` — label/variant resolved by looking up `VERSION_STATUSES[props.status]`, not a `?:` chain on two literal comparisons
- [ ] `packages/react/src/collections/CollectionEditView.tsx` — `publishedTimeline` filter and the `status` ternary passed to `DraftToolbar` read `VERSION_STATUSES.published.key` / `VERSION_STATUSES.draft.key`
- [ ] `packages/react/src/globals/GlobalEditView.tsx` — same sweep: `publishedTimeline` filter, `isDraftDoc`'s `vex_status` comparison, and both `documentStatus`/`DraftToolbar` ternaries
- [ ] `packages/react/src/versions/VersionHistoryDropdown.tsx` — `publishedVersion` reduction filter reads `VERSION_STATUSES.published.key`
- [ ] `packages/react/src/testing/convex/schema.ts` — both `v.union(v.literal("draft"), v.literal("published"))` fields emit from `VERSION_STATUSES.draft.key` / `VERSION_STATUSES.published.key`
- [ ] `packages/react/src/collections/CollectionListView.tsx` — already reads `VERSION_STATUSES.draft.key` / `VERSION_STATUSES.published.key` (confirmed, no further edit)
- [ ] grep-proof: no raw `"draft"` / `"published"` status literals remain in `packages/*/src` non-test files (`*.test.ts(x)` keep literals asserting stored data; `packages/react/src/testing/**` test-harness suites — `viewSuite.ts`, `accessFixtures.ts`, `modalSuite.tsx` — keep their seeded literals, they assert stored data the same as a colocated test)

## Step 3 — `admin.table` config surface + config-time validation [agent]
Why: every control ships with the key that drives it; bad `searchField` / unindexed sort must fail at `defineConfig`, naming the index to declare.
Verify: `pnpm typecheck && pnpm --filter @vexcms/core test -- collections`
- [ ] `packages/core/src/collections/types.ts` — `CollectionTableSort<TFieldSlug>`; `searchField?: readonly TFieldSlug[]`; `defaultSort` typed to field slugs + `_creationTime`; `defaultColumns?: TFieldSlug[]`; `AdminCollectionConfigInput`/`AdminCollectionConfig` thread `TFieldSlug` into `table`
- [ ] `packages/core/src/fields/baseTypes.ts` — `admin.enableSorting?: boolean` / `admin.enableHiding?: boolean` on `FieldAdminConfigInput` and resolved `FieldAdminConfig`
- [ ] `packages/core/src/collections/config.ts` — resolve defaults (no `searchField` → search hidden; `defaultColumns` → all non-hidden fields; `enableSorting`/`enableHiding` default `false`); wires `validateTableConfig`
- [ ] `packages/core/src/collections/validateTableConfig.ts` (new) + `packages/core/src/collections/validateTableConfig.test.ts` (new) — throws `VexConfigError` when a `searchField` entry has no `searchIndex`, or `defaultSort.field` / an `enableSorting` field has no index leading with it (via `resolveCollectionIndexes`); message names field + index to declare
- [ ] `packages/core/src/collections/validator.test.ts` — test confirming `.searchIndex()` is emitted for every field with its own `searchIndex`, independent of `useAsTitle`/incoming relationships
- [ ] `packages/core/src/collections/config.test.ts` — type tests: `admin.table.searchField`, `defaultSort.field`, `defaultColumns` reject unknown field slugs

## Step 4 — `manageViews` access action + `vex_views` table [agent]
Why: shared views need a store and a gate; default denied (fail-closed). Decision 25 keeps a config view's `where` out of UI code, not out of the client bundle — `collection.admin.table.views` (full, `where` intact) ships to the browser like the rest of `VexClientConfig` (directly imported per P-004, so hiding `where` behind a client-facing type would change nothing: the string is already in the JS). `VexClientViewConfig` / `toClientViewConfig` are the one conversion point every UI read goes through instead — called client-side by `useCollectionListViews` (Step 11), straight off the bundled config; Step 6's `listViews` query never touches a `config`-source view at all, returning `shared` views only. Step 3 also deferred validating `admin.table.views` entries against the rest of a collection's config (unknown `where` fields, an unindexed `sort`, an undeclared `searchField`, unknown `columns`) until `VexViewConfig` existed — this step closes that gap alongside the existing `searchField`/sort checks, with the same fail-at-`defineConfig` posture.
Verify: `pnpm --filter @vexcms/core test -- access schema collections`
- [ ] `packages/core/src/access/constants.ts` — `VIEW_ACTIONS = { manageViews }`
- [ ] `packages/core/src/access/types.ts` — `HasTable` guard; `ViewAction` wired into `SubjectMap`'s per-resource action union (collections only)
- [ ] `packages/core/src/schema/generateVexSchema.ts` + `packages/core/src/schema/generateVexSchema.test.ts` — emit `vex_views` unconditionally, with an optional `description` column
- [ ] `packages/core/src/collections/constants.ts` — `VEX_VIEW_SOURCES` map + derived `VexViewSource` union
- [ ] `packages/core/src/collections/types.ts` — `VexViewState`, `VexViewConfig` (+ `description`), `VexStoredView`, `VexClientViewState`, `VexClientViewConfig`; completes `admin.table.views` Step 3 deferred
- [ ] `packages/core/src/collections/toClientViewConfig.ts` (new) + `packages/core/src/collections/toClientViewConfig.test.ts` (new) — strips a config view's `where`, computing `hasHiddenFilter`/`hiddenFilterCount` (Decision 25)
- [ ] `packages/core/src/collections/index.ts` — exports `toClientViewConfig` so `useCollectionListViews` (Step 11) can call it client-side
- [ ] `packages/core/src/collections/validateTableConfig.ts` + `packages/core/src/collections/validateTableConfig.test.ts` — config-time `viewId` uniqueness, PLUS per-view `where`-field, `sort`-index, `searchField`, and `columns` checks

## Step 5 — Portable sort, config-view filters, and field-read guards in `find` / `search` [agent]
Why: clients send `sort { field, order }`, never `withIndex`; the server resolves the leading index so stored views and URLs stay backend-neutral (Decision 5). `find` / `search` also gain `view?: string` so a `"config:<viewId>"` resolves that config view's server-resolved `where` and ANDs it in (Decision 25) — the client config bundle never carries it (Step 4). Sorting or searching on a field the caller cannot read is rejected with a `VexAccessError`, because sort order and search hits alone would leak a hidden field's values (Decision 26); a config view's own `where` is exempt, since it is trusted server config, not caller input.
Verify: pnpm --filter @vexcms/core test -- collections
- [ ] `packages/core/src/collections/resolveSort.ts` (new) + `packages/core/src/collections/resolveSort.test.ts` (new) — `sort` → index whose first field is `field` (draftStatus-aware); `_creationTime` → default order, never field-checked; unknown field → `VexError` `UNINDEXED_SORT` naming the index to declare; unreadable field → `VexAccessError`
- [ ] `packages/core/src/collections/resolveConfigViewWhere.ts` (new) + `packages/core/src/collections/resolveConfigViewWhere.test.ts` (new) — `"config:<viewId>"` → the matching `admin.table.views[].where`; any other prefix, a missing `view`, or an unknown `viewId` → `undefined`, never a throw
- [ ] `packages/core/src/collections/api/find/server.ts` + `packages/core/src/collections/api/find/server.test.ts` — accepts `sort` and `view`; `sort` mutually exclusive with `withIndex`; config-view `where` ANDed in, exempt from the `fields` allow-list and the field-read drop; access-constraint index selection precedence documented and tested
- [ ] `packages/core/src/collections/api/search/server.ts` + `packages/core/src/collections/api/search/server.test.ts` — accepts `view`; `sort` still rejected while searching; `searchField` validated against the `admin.table.searchField` allow-list AND against the caller's field-read access; config-view `where` ANDed in the same way as `find`
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — `find` registration threads `sort` and `view` through; `search` registration threads `view` through (never `sort` — see the note after its code block)

## Step 6 — Views server API [agent]
Why: Shared views CRUD must enforce `manageViews` server-side, scope by org, and (per the revised Decision 11) store an optional `description` alongside each view.
Verify: pnpm --filter @vexcms/core test -- collections/api
- [ ] `packages/core/src/collections/api/listViews/server.ts` + `.test.ts` (new) — list for collection, scoped to `organizationId` resolved server-side from the caller's session
- [ ] `packages/core/src/collections/api/saveView/server.ts` + `.test.ts` (new) — create/patch, idempotent on `viewId` (promotion dedupe), requires `manageViews`, stores `description`
- [ ] `packages/core/src/collections/api/removeView/server.ts` + `.test.ts` (new) — delete, requires `manageViews`
- [ ] `packages/core/src/collections/api/types.ts` — shared arg/result types for the three operations
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — registers `listViews`/`saveView`/`removeView`
- [ ] `packages/core/src/vexConvexApi.ts` — exports the three Convex function references
- [ ] `packages/core/src/db/test/convex/schema.ts` — `vex_views` table added to `@vexcms/core`'s own hand-maintained test fixture schema (Decision 24), including `description`
- [ ] `packages/react/src/collections/api/listViews/client.ts` + `packages/react/src/collections/api/saveView/client.ts` + `packages/react/src/collections/api/removeView/client.ts` (new) — tanstack-query wrappers
- [ ] `packages/react/src/client/index.ts` — re-exports the three client ops + `VexStoredView`/`VexViewConfig` types

## Step 7 — Data-source hooks: `useVexList` / `useVexDoc` [agent]
Why: the hook boundary is where plugin, adapter, and adopted-table sources plug in later (Design Decision 19); list/edit views stop calling `vexConvexApi` directly. Step 7 ships full code, not guided stubs (Decision 1), so `useVexList`'s search-mode path — previously a `throw new Error("Not implemented")` stub — is a real, cursor-paginated implementation here. It also mirrors Step 5's server-side `view?: string` (Decision 25) onto the client `find`/`search` args, exactly as the first draft mirrored `sort`, and moves the "resets to the first page" half of Decision 8 into `usePaginatedQuery` itself so `useVexList` inherits it for free on every prop that can change the result set.
Verify: pnpm --filter @vexcms/react test -- hooks collections && browser: list + edit views unchanged
- [ ] `packages/react/src/hooks/useVexList.ts` (new) + `packages/react/src/hooks/useVexList.test.tsx` (new) — `{ collection, where, sort, search, searchField, view, drafts, pageSize }` → `{ results, totalDocs, isDone, loadMore, isPending }`; `find`-mode wraps `usePaginatedQuery`, search-mode is a sibling cursor accumulator against `vexConvexApi.search`, both called unconditionally and toggled via `enabled`
- [ ] `packages/react/src/hooks/useVexDoc.ts` (new) + `packages/react/src/hooks/useVexDoc.test.tsx` (new)
- [ ] `packages/react/src/hooks/usePaginatedQuery.ts` — render-time query-identity reset (Decision 8) + an `enabled` prop so `useVexList` can call it unconditionally
- [ ] `packages/react/src/hooks/index.ts` — barrel exports the two new hooks
- [ ] `packages/react/src/collections/api/find/client.ts` — `FindClientArgs`/`FindClientPaginatedArgs` gain `sort?: CollectionTableSort<string>` and `view?: string`
- [ ] `packages/react/src/testing/convex/bridge.ts` + `packages/react/src/testing/hooksSuite.tsx` — test-harness support for the two new hooks, plus coverage for `usePaginatedQuery`'s reset behavior
- [ ] `packages/react/src/collections/CollectionListView.tsx`, `packages/react/src/media/MediaCollectionListView.tsx`, `packages/react/src/collections/CollectionEditView.tsx` migrated; no direct `vexConvexApi` reads in those files (mutations stay, Design Decision 19's hook boundary is read-side)

## Step 8 — List slots + built-ins as `vex.*` contributions [agent]
Why: create, search, filters, columns, views, row/bulk delete become contributions so custom actions use the same path (plugin stem S1–S14, client-only S14). Revised for design round 1: row actions collapse into one ⋯ `DropdownMenu` (Open, Inspect, Copy ID, contributions, Delete last — Decision 28), and bulk selection controls move from a floating overlay into the toolbar area, inline and left of where Step 10's Filter control lands (Decision 22).
Verify: pnpm --filter @vexcms/core test -- components && pnpm --filter @vexcms/react test -- collections slots && browser: list renders identically, row ⋯ menu shows Open/Inspect/Copy ID/Delete in order, selecting rows shows an inline (non-floating) bulk group in the toolbar
- [ ] `packages/core/src/components/types.ts` — `SLOT_IDS.list`: `headerActions`, `toolbar`, `filters`, `beforeTable`, `afterTable`, `rowActions`, `bulkActions`
- [ ] `packages/core/src/components/builtinIds.ts` — `vex.list.create`, `vex.list.search`, `vex.list.filters`, `vex.list.columns`, `vex.list.views`, `vex.list.row.open`, `vex.list.row.inspect`, `vex.list.row.copyId`, `vex.list.row.delete`, `vex.list.bulk.delete`
- [ ] `packages/core/src/collections/types.ts` — `AdminListComponentsInput`/`AdminListComponents` `rowActions`/`bulkActions` doc comments updated for the ⋯ menu and inline bulk group
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — bulk-delete UI moves out; `onSelectionChange` callback replaces `onBulkDelete`/`enableBulkActions`
- [ ] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — drops the floating/fixed positioning; renders inline wherever its caller places it
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` (new) + `packages/react/src/collections/CollectionListLayout.test.tsx` (new) — places `SlotOutlet` per slot; row actions render as one ⋯ `DropdownMenu` (Open, Inspect, Copy ID, contributions, Delete last); the bulk group (Select all N loaded + `list.bulkActions`) renders inline in the toolbar area while a row is selected
- [ ] `packages/react/src/collections/CollectionListView.tsx` — delegates rendering to `CollectionListLayout`; existing delete UI moved into built-in contributions; `RevalidateButton` stays outside it (Decision 23); passes a placeholder `onInspect` for Step 12's peek

## Step 9 — Toolbar controls, compact URL state, and fixed-height layout [agent]
Why: search, sort, filters, and columns meet the core navigability acceptance; the compact URL grammar (Decision 9) makes every list state shareable; the fixed-height layout (Decision 22) and `ScrollSection` (Decision 31) are the standing scroll-container rule for the rest of the admin panel.
Verify: `pnpm --filter @vexcms/react test -- collections ui/data-table ui/ScrollSection && browser: search, field switch, sort, column hide, density toggle, page size, Copy link, empty/error states, reload keeps state`
- [ ] `packages/react/src/collections/collectionListUrlParams.ts` (new) + `.test.ts` (new) — compact grammar parse/serialize: `q`, `qf`, `sort`, `filter` (plain `VexWhereNode`), `size`, `view`, `peek`; invalid params/rows dropped, never thrown
- [ ] `packages/react/src/collections/useCollectionListUrlState.ts` (new) + `.test.tsx` (new) — `nuqs`-backed state + setters, `replace` for typing / `push` for discrete actions (Decision 9), batches multi-setter calls into one history entry
- [ ] `packages/react/src/collections/CollectionListSearch.tsx` (new) + `.test.tsx` (new) — debounced input + field picker (config order, first default); hidden without `searchField`; Enter commits immediately and pushes history
- [ ] `packages/react/src/ui/data-table/DataTableSortHeader.tsx` (new) + `.test.tsx` — sortable headers (only `enableSorting`), disabled with "Sorted by relevance" during search
- [ ] `packages/react/src/ui/ScrollSection.tsx` (new) + `.test.tsx` — the Decision 31 fixed/max-height scroll wrapper, used by every bounded-height menu from this step onward
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` (new) + `.test.tsx` — `enableHiding` columns; session-only state when no view selected; density `ToggleGroup` (Decision 29)
- [ ] `packages/react/src/ui/data-table/DataTablePageSizeSelect.tsx` (new) + `.test.tsx` — `pageSizeOptions`, labelled "Rows per load"; Load More retained
- [ ] `packages/react/src/collections/CollectionListEmptyState.tsx` (new) + `.test.tsx` — empty collection / no search results / no filter results variants (Decision 32)
- [ ] `packages/react/src/collections/CollectionListQueryError.tsx` (new) + `.test.tsx` — generic error with Try again + details, plus the `UNINDEXED_SORT` Remove-sort variant (Decision 32)
- [ ] `packages/react/src/collections/CollectionListCopyLinkButton.tsx` (new) + `.test.tsx` — copies the current URL, or the full resolved state when a local view is active (Decision 11)
- [ ] `packages/react/src/fields/index.tsx` — `getCollectionColumnDefs` sets every column's `enableSorting`/`enableHiding` from field admin config in one central pass
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — fixed-height `ScrollArea` body, sticky header, footer; controlled `sort`/`onSortChange`/`sortDisabled`/`visibleColumns`/`density`; empty/error slots
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` (new) + `.test.tsx` — hosts `list.toolbar` (`vex.list.search`/`vex.list.columns` built-ins), the inline bulk group, and Copy link
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` — fixed-height shell (Decision 22); renders `CollectionListToolbar`; threads `sort`/`visibleColumns`/`density`/empty/error into `DataTable`
- [ ] `packages/react/src/collections/CollectionListView.tsx` — calls `useCollectionListUrlState` and feeds `q`/`qf`/`sort`/`filter`/`size`/`view` into `useVexList` (Step 7); owns session-only `visibleColumns` and per-browser `density` state; picks the empty/error variant
- [ ] `packages/react/src/collections/index.ts` + `packages/react/src/ui/data-table/index.ts` + `packages/react/src/ui/index.ts` — barrel exports for the new files

## Step 10 — Filter builder (AND rows + one level of OR groups) [agent]
Why: authors `where` for URL and views; DNF covers multi-value, empty-value, and triage use cases without a tree editor (Decision 10).
Verify: `pnpm --filter @vexcms/react test -- collections/whereDnf collections/CollectionListFilterBuilder collections/CollectionListFilterChips && browser: OR group round-trips through URL reload; isEmpty/isNotEmpty row applies and chips show "is empty"/"is not empty"; vex_status filters on a versioned collection; an unreadable field never appears in the field picker`
- [ ] `packages/react/src/collections/whereDnf.ts` (new) + `packages/react/src/collections/whereDnf.test.ts` (new) — `toDnf(where) | null` and `fromDnf(groups)`; non-DNF → `null`; `isEmpty`/`isNotEmpty` compile to `eq`/`neq` with `value: undefined`
- [ ] `packages/react/src/collections/CollectionListFilterBuilder.tsx` (new) — groups (OR) of rows (AND) over `eq/neq/gt/gte/lt/lte` plus the two list-only empty operators; value input by field type; `vex_status` built-in field on versioned collections; unreadable fields excluded; non-DNF `where` shown read-only
- [ ] `packages/react/src/collections/CollectionListFilterChips.tsx` (new) + `.test.ts` — active-filter chips (clear one / clear all), per-browser chip-row visibility toggle
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` — contributes `CollectionListFilterBuilder` as `vex.list.filters` into the `list.filters` outlet, wired to `props.urlState.filter`/`setFilter`; mounts the chip row below the toolbar

## Step 11 — Saved views: tabs, modified state, hidden filters [agent]
Why: round-1 design moves saved views out of a toolbar dropdown into tabs above the table
(Decision 11), adds a modified-state diff with Save/Reset, a server-resolved hidden-filter lock
badge (Decision 25), and a `description` field — replacing the single `CollectionListViewsMenu`
from the pre-round-1 draft with `CollectionListViewTabs` (tabs + "All views" overflow search),
`CollectionListSaveViewDialog` (save/rename), and `CollectionListHiddenFilterBadge`. Wired to
Step 9's flat `useCollectionListUrlState` setters and Step 4's nested-`state`, client-safe view types.
Verify: `pnpm --filter @vexcms/react test -- collections && browser: tab between All/config/shared/local views, modify a shared view and Save changes, Save as new on a config view, rename and delete a local view, promote a local view to shared with the confirm dialog, hidden-filter lock badge popover on a config view with a server-resolved where, unknown view id shows the fallback notice, Copy link on a local view serializes full state`
- [ ] `packages/react/src/collections/collectionListViewStore.ts` (new) + test — localStorage keyed by project + collection, `viewId` generated client-side
- [ ] `packages/react/src/collections/useCollectionListViews.ts` (new) + test — merge config + shared + local (dedupe by `viewId`, source badge), `diffViewState`, `resolveCollectionListShareParams`
- [ ] `packages/react/src/collections/CollectionListViewTabs.tsx` (new) + test — tab strip + "All views" overflow menu, heading/eyebrow/description, modified-state controls, promote/rename/delete, unknown-view notice
- [ ] `packages/react/src/collections/CollectionListSaveViewDialog.tsx` (new) + test — save new / rename, shared-vs-local scope gated by `manageViews`
- [ ] `packages/react/src/collections/CollectionListHiddenFilterBadge.tsx` (new) + test — lock badge + count, never a chip or builder row
- [ ] `packages/react/src/collections/index.ts` — barrel export for the three new components
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` (Step 9's file) — mounts `CollectionListViewTabs` above the toolbar
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` (Step 9's file) — mounts `CollectionListHiddenFilterBadge` beside the filter chips

## Step 12 — Inspect peek [agent]
Why: Design Decision 27 needs two units — the panel itself and the prefetch strategy that makes it open instantly — plus the wiring that mounts them: `useVexDoc`'s `initialData` seed (Step 7) is what lets the panel render without a loading flash, and `useCollectionListUrlState`'s `peek`/`setPeek` (Step 9) is the param this panel's props are shaped to plug straight into. Step 8 already ships `CollectionListLayout`'s `onInspect` prop as a placeholder no-op and `ListRowInspectAction` calling it — this step replaces that placeholder with real wiring, mounts `CollectionListPeek` beside the table (Decision 22), and threads row hover/focus into `useCollectionListPeekPrefetch`. Tests exercise the real (not-yet-implemented) component/hook bodies and fail until the guided stubs are filled in.
Verify: `pnpm --filter @vexcms/react test -- collections/CollectionListPeek collections/useCollectionListPeekPrefetch collections/CollectionListView ui/data-table/DataTable`
- [ ] `packages/react/src/collections/CollectionListPeek.tsx` (new) + `packages/react/src/collections/CollectionListPeek.test.tsx` (new) — non-modal right panel, Fields/JSON tabs, seeded from `useVexDoc`'s `initialData`
- [ ] `packages/react/src/collections/useCollectionListPeekPrefetch.ts` (new) + `packages/react/src/collections/useCollectionListPeekPrefetch.test.ts` (new) — hover(150ms)/focus/neighbour-row prefetch via `queryClient.prefetchQuery(convexQuery(...))`
- [ ] `packages/react/src/collections/index.ts` — barrel exports both new modules
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — adds a generic `getRowProps` per-row event hook (builds on Step 8's edit)
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` — adds `onRowHoverStart`/`onRowHoverEnd`/`onRowFocus` props, forwarded to `DataTable`'s `getRowProps` (builds on Step 8's edit)
- [ ] `packages/react/src/collections/CollectionListView.tsx` — replaces Step 8's placeholder `onInspect={() => {}}` with `useCollectionListUrlState().setPeek`, mounts `CollectionListPeek` beside `CollectionListLayout`, wires `useCollectionListPeekPrefetch` into the new row-hover/focus props

## Step 13 — Keyboard shortcuts [agent]
Why: Decision 30 pins the shortcut set to six core keys, handled by one internal hook built on `useEventListener` from `@ts-hooks-kit/core` — no new dependency, no command palette, no rebinding (Out of Scope). Per Decision 21, list-specific `useCollectionList*` hooks live in `react/src/collections/`, not `react/src/hooks/`.
Verify: `pnpm --filter @vexcms/react test useCollectionListShortcuts`
- [ ] `packages/react/src/collections/useCollectionListShortcuts.ts`
- [ ] `packages/react/src/collections/useCollectionListShortcuts.test.ts`
- [ ] `packages/react/src/collections/index.ts`

## Step 14 — Mobile list layout [agent]
Why: J dropped the list view from its scope; I owns it end to end (Decision 22). Round 1
changed three things this step built against: bulk selection is no longer a floating bar —
Step 8 already made it inline, so this step only adds mobile sizing to it; saved views are
tabs (`CollectionListViewTabs`, Step 11), not a dropdown; and a single `DataTableResponsiveMenu`
(Popover at `md`+, Sheet below) is the one mechanism every menu/overflow surface switches to.
Verify: browser at 375 / 390 / 768 / 1024 on `apps/test`
- [ ] `packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx` (new) + `.test.tsx` — one trigger/content pair: `Popover` at `md`+, bottom `Sheet` below `md`
- [ ] `packages/react/src/ui/data-table/index.ts` — barrel export for `DataTableResponsiveMenu`
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — sticky first column (header + body cells) while the table scrolls horizontally
- [ ] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — mobile sizing only (no floating-bar edit — Step 8 already made it inline)
- [ ] `packages/react/src/collections/CollectionListLayout.tsx` — below `md`, a selection hides the `list.filters` outlet so the inline bulk group (Step 8) fills the row alone
- [ ] `packages/react/src/collections/CollectionListToolbar.tsx` — non-search, non-Filter controls collapse into one `DataTableResponsiveMenu` overflow trigger below `md`
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` + `packages/react/src/collections/CollectionListFilterBuilder.tsx` — each swaps its trigger/content container for `DataTableResponsiveMenu`
- [ ] `packages/react/src/collections/CollectionListViewTabs.tsx` — tabs collapse into one full-width view button that opens a `DataTableResponsiveMenu` sheet below `md`
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — J section notes list view owned by I, resolves both stale "known suspects" bullets

## Step 15 — Examples, docs, acceptance [agent]
Why: acceptance needs a 200-doc collection, a custom row + bulk action exercising `access`, a config view with a server-resolved `where` the current role can't read, and a docs guide that matches every decision from design round 1 (peek, density, shortcuts, parked sort, filter chips, view tabs).
Verify: pnpm typecheck && pnpm test && vex generate && the 12-item browser smoke checklist below, for at least one allowed role and one denied role
- [ ] `apps/test/src/db/constants/index.ts` + `apps/test/src/vexcms/collections/testimonials.ts` (new) + `apps/test/src/vexcms/collections/index.ts` — collection with `searchField` (2 fields), sortable columns, 3 `views` (one with a server-resolved `where` on a field the `contributor`/`user` roles can't read), custom row + bulk action contributions, seed 200 docs
- [ ] `apps/test/src/components/TestimonialFeatureRowAction.tsx` + `apps/test/src/components/TestimonialBulkApproveAction.tsx` (new) — custom row + bulk action contributions
- [ ] `apps/test/src/auth/access.ts` — `testimonials` resource, `manageViews` rule, field-level read restriction on `internalScore`
- [ ] `apps/test/convex/seed.ts` — 200 seeded rows
- [ ] `apps/docs/src/content/docs/guides/list-views.mdx` (new) — list-view guide covering every Step 1–14 behavior; `README.md` `admin.table` claims made true
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — I tasks ticked; backlog updated
- [ ] browser smoke checklist: every Verify above + `manageViews` denied vs allowed + hidden-filter badge + density + peek + keyboard shortcuts
