---
status: draft
spec_id: 2026-10-26-list-view-overhaul
touches:
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - ".agent/docs/standards/anti-patterns.md"
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
  - "packages/core/src/collections/composeViewWhere.test.ts"
  - "packages/core/src/collections/composeViewWhere.ts"
  - "packages/core/src/collections/config.test.ts"
  - "packages/core/src/collections/config.ts"
  - "packages/core/src/collections/constants.ts"
  - "packages/core/src/collections/index.ts"
  - "packages/core/src/collections/matchDeclaredViewFilter.test.ts"
  - "packages/core/src/collections/matchDeclaredViewFilter.ts"
  - "packages/core/src/collections/buildListQueryArgs.test.ts"
  - "packages/core/src/collections/buildListQueryArgs.ts"
  - "packages/core/src/collections/listPreferenceCookies.test.ts"
  - "packages/core/src/collections/listPreferenceCookies.ts"
  - "packages/core/src/collections/listUrlParams.test.ts"
  - "packages/core/src/collections/listUrlParams.ts"
  - "packages/core/src/collections/listViewsCookie.test.ts"
  - "packages/core/src/collections/listViewsCookie.ts"
  - "packages/core/src/collections/resolveListQueryState.test.ts"
  - "packages/core/src/collections/resolveListQueryState.ts"
  - "packages/core/src/collections/resolveQueryIndex.test.ts"
  - "packages/core/src/collections/resolveQueryIndex.ts"
  - "packages/core/src/collections/toClientViewConfig.test.ts"
  - "packages/core/src/collections/toClientViewConfig.ts"
  - "packages/core/src/collections/types.ts"
  - "packages/core/src/collections/validateTableConfig.test.ts"
  - "packages/core/src/collections/validateTableConfig.ts"
  - "packages/core/src/collections/validator.test.ts"
  - "packages/core/src/components/builtinIds.ts"
  - "packages/core/src/components/types.ts"
  - "packages/core/src/db/test/convex/schema.ts"
  - "packages/core/src/db/types.ts"
  - "packages/core/src/framework.ts"
  - "packages/core/src/fields/baseTypes.ts"
  - "packages/core/src/schema/generateVexSchema.test.ts"
  - "packages/core/src/schema/generateVexSchema.ts"
  - "packages/core/src/vexConvexApi.ts"
  - "packages/next/src/NextAdminPage.test.ts"
  - "packages/next/src/NextAdminPage.tsx"
  - "packages/react/src/client/index.ts"
  - "apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx"
  - "apps/www/convex/seed.ts"
  - "apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx"
  - "packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/[[...path]]/page.tsx"
  - "packages/react/src/collections/CollectionDeleteAction.tsx"
  - "packages/react/src/collections/CollectionDuplicateMenuItem.tsx"
  - "packages/react/src/collections/CollectionEditView.test.tsx"
  - "packages/react/src/collections/CollectionEditView.tsx"
  - "packages/react/src/collections/CollectionListView.test.tsx"
  - "packages/react/src/collections/CollectionListView.tsx"
  - "packages/react/src/collections/CreateDocumentForm.test.tsx"
  - "packages/react/src/collections/CreateDocumentForm.tsx"
  - "packages/react/src/collections/CreateDocumentModal.test.tsx"
  - "packages/react/src/collections/CreateDocumentModal.tsx"
  - "packages/react/src/collections/api/find/client.ts"
  - "packages/react/src/collections/api/listViews/client.ts"
  - "packages/react/src/collections/api/removeView/client.ts"
  - "packages/react/src/collections/api/saveView/client.ts"
  - "packages/react/src/collections/editView/CollectionDeleteAction.tsx"
  - "packages/react/src/collections/editView/CollectionDuplicateMenuItem.tsx"
  - "packages/react/src/collections/editView/CollectionEditView.test.tsx"
  - "packages/react/src/collections/editView/CollectionEditView.tsx"
  - "packages/react/src/collections/editView/useDuplicateCollectionDocument.ts"
  - "packages/react/src/collections/index.ts"
  - "packages/react/src/collections/listView/CollectionListContext.tsx"
  - "packages/react/src/collections/listView/CollectionListView.test.tsx"
  - "packages/react/src/collections/listView/CollectionListView.tsx"
  - "packages/react/src/collections/listView/CreateDocumentForm.test.tsx"
  - "packages/react/src/collections/listView/CreateDocumentForm.tsx"
  - "packages/react/src/collections/listView/CreateDocumentModal.test.tsx"
  - "packages/react/src/collections/listView/CreateDocumentModal.tsx"
  - "packages/react/src/collections/listView/ListBulkDeleteAction.tsx"
  - "packages/react/src/collections/listView/ListCopyLinkButton.test.tsx"
  - "packages/react/src/collections/listView/ListCopyLinkButton.tsx"
  - "packages/react/src/collections/listView/ListCreateAction.tsx"
  - "packages/react/src/collections/listView/ListEmptyState.test.tsx"
  - "packages/react/src/collections/listView/ListEmptyState.tsx"
  - "packages/react/src/collections/listView/ListFilterBuilder.tsx"
  - "packages/react/src/collections/listView/ListFilterChips.test.ts"
  - "packages/react/src/collections/listView/ListFilterChips.tsx"
  - "packages/react/src/collections/listView/ListHiddenFilterBadge.test.tsx"
  - "packages/react/src/collections/listView/ListFiltersAction.test.tsx"
  - "packages/react/src/collections/listView/ListFiltersAction.tsx"
  - "packages/react/src/collections/listView/ListHiddenFilterBadge.tsx"
  - "packages/react/src/collections/listView/ListColumnsAction.test.tsx"
  - "packages/react/src/collections/listView/ListColumnsAction.tsx"
  - "packages/react/src/collections/listView/ListLayout.test.tsx"
  - "packages/react/src/collections/listView/ListLayout.tsx"
  - "packages/react/src/collections/listView/ListPeek.test.tsx"
  - "packages/react/src/collections/listView/ListPeek.tsx"
  - "packages/react/src/collections/listView/ListQueryError.test.tsx"
  - "packages/react/src/collections/listView/ListQueryError.tsx"
  - "packages/react/src/collections/listView/ListRowCopyIdAction.tsx"
  - "packages/react/src/collections/listView/ListRowDeleteAction.tsx"
  - "packages/react/src/collections/listView/ListRowInspectAction.tsx"
  - "packages/react/src/collections/listView/ListRowOpenAction.tsx"
  - "packages/react/src/collections/listView/ListSaveViewDialog.test.tsx"
  - "packages/react/src/collections/listView/ListSaveViewDialog.tsx"
  - "packages/react/src/collections/listView/ListSearch.test.tsx"
  - "packages/react/src/collections/listView/ListSearchAction.test.tsx"
  - "packages/react/src/collections/listView/ListSearchAction.tsx"
  - "packages/react/src/collections/listView/ListSearch.tsx"
  - "packages/react/src/collections/listView/ListToolbar.test.tsx"
  - "packages/react/src/collections/listView/ListToolbar.tsx"
  - "packages/react/src/collections/listView/ListViewTabs.test.tsx"
  - "packages/react/src/collections/listView/ListViewTabs.tsx"
  - "packages/react/src/collections/listView/index.ts"
  - "packages/react/src/collections/listView/listBuiltinContributions.ts"
  - "packages/react/src/collections/listView/listViewStore.test.ts"
  - "packages/react/src/collections/listView/listViewStore.ts"
  - "packages/react/src/collections/listView/listPreferenceCookies.test.ts"
  - "packages/react/src/collections/listView/listPreferenceCookies.ts"
  - "packages/react/src/collections/listView/useListPeekPrefetch.test.ts"
  - "packages/react/src/collections/listView/useListPeekPrefetch.ts"
  - "packages/react/src/collections/listView/useListShortcuts.test.ts"
  - "packages/react/src/collections/listView/useListShortcuts.ts"
  - "packages/react/src/collections/listView/useListUrlState.test.tsx"
  - "packages/react/src/collections/listView/useListUrlState.ts"
  - "packages/react/src/collections/listView/useListViews.test.ts"
  - "packages/react/src/collections/listView/useListViews.ts"
  - "packages/react/src/collections/listView/whereDnf.test.ts"
  - "packages/react/src/collections/listView/whereDnf.ts"
  - "packages/react/src/collections/useDuplicateCollectionDocument.ts"
  - "packages/react/src/fields/index.tsx"
  - "packages/react/src/fields/relationship/RelationshipPicker.test.tsx"
  - "packages/react/src/fields/relationship/RelationshipPicker.tsx"
  - "packages/react/src/globals/GlobalEditView.tsx"
  - "packages/react/src/hooks/index.ts"
  - "packages/react/src/hooks/usePaginatedQuery.ts"
  - "packages/react/src/hooks/useVexDocQuery.test.tsx"
  - "packages/react/src/hooks/useVexDocQuery.ts"
  - "packages/react/src/hooks/useVexListQuery.test.tsx"
  - "packages/react/src/hooks/useVexListQuery.ts"
  - "packages/react/src/hooks/useVexListQuery.serverParity.test.tsx"
  - "packages/react/src/media/MediaCollectionListView.tsx"
  - "packages/react/src/testing/convex/bridge.ts"
  - "packages/react/src/testing/convex/schema.ts"
  - "packages/react/src/testing/hooksSuite.tsx"
  - "packages/react/src/testing/modalSuite.tsx"
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
  - "packages/react/src/versions/VersionHistoryPanel.tsx"
  - "packages/react/src/versions/VersionPublishAction.tsx"
  - "packages/react/src/versions/VersionUnpublishAction.tsx"
  - "packages/react/src/versions/showsUnpublish.ts"
---

# 2026-10-26-list-view-overhaul — Tasks

All steps are `[agent]`. File placement follows Decision 21: `collections/listView/` holds every list-view component/hook/built-in, `collections/editView/` holds `CollectionEditView`, `collections/listView/` holds `CreateDocumentForm`/`CreateDocumentModal`, and `collections/api/` is unchanged — generic table controls stay in `react/src/ui/data-table/`, data hooks in `react/src/hooks/`, saved-view ops in `core/src/collections/api/{listViews,saveView,removeView}/` with `react/src/collections/api/<op>/client.ts`. Step bodies are mixed: Steps 3, 4, 5, 8, and 12 ship full code; the rest ship guided stubs (signatures, JSDoc, numbered `// TODO: implement` pseudocode).

## Step 1 — A's remainder: `vex_` convention + `updatedAt` + Decision 31 preference entry [agent]
Why: C and I both add framework tables; the convention must be written before `vex_views` is introduced. `updatedAt` was verified-only in A. Decision 31 (fixed-height-with-internal-scroll + `ui/ScrollSection.tsx`) is a standing pattern this spec establishes and must be ratified in `preferences.md` before Step 10 builds `ScrollSection.tsx` against it.
Verify: harness doctor
- [ ] `.agent/docs/standards/naming-conventions.md` — `vex_` rule: every framework table and system field is `vex_`-prefixed, emitted unconditionally by `generateVexSchema`, never user-declarable; migration rule for renames
- [ ] `updatedAt` behavior confirmed against `api/create/server.ts` / update path; confirmed accurate against `guides/caching-and-seo.mdx` (no dedicated collections docs page exists) + launch plan A item ticked
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — A's remainder checkbox ticked
- [ ] `.agent/docs/standards/preferences.md` — new `P-029` entry for Decision 31

## Step 2 — Restructure `collections/` into closed feature subfolders [agent]
Why: Decision 21 (developer decision, 2026-10-27, post-review) places list-view code in `collections/listView/`, edit-view code in `collections/editView/`, and the create-document form/modal in `collections/listView/` beside the list that opens it, closing the subfolder set and dropping the redundant `Collection`/`CreateDocument` prefix inside each folder while the public root components keep their names. This step is pure mechanical restructuring so every later step can write directly into `listView/`. `CollectionDeleteAction.tsx`, `CollectionDuplicateMenuItem.tsx`, and `useDuplicateCollectionDocument.ts` are edit-view pieces (built-in `edit.actionsMenu`/`edit.header.actions` contributions, used only by `CollectionEditView`) and move into `collections/editView/` with their existing names — they are public API, re-exported from `collections/index.ts`, so the move skips the in-folder short-name convention and keeps exports unchanged. After this step `collections/` root holds only `index.ts` and the three subfolders (`listView/`, `editView/`, `api/`).
Verify: `harness struct` (regenerate `directory-structure.md` to reflect `collections/{listView,editView,api}`), then run the full `packages/react` typecheck and test suite — every moved test and every updated import site above must resolve and pass, with `grep -rn "collections/CollectionListView\"\|collections/CollectionEditView\"\|collections/CreateDocumentForm\"\|collections/CreateDocumentModal\"\|collections/CollectionDeleteAction\"\|collections/CollectionDuplicateMenuItem\"\|collections/useDuplicateCollectionDocument\"" packages apps` returning zero hits outside this spec file and changelog prose.
- [ ] `packages/react/src/collections/listView/CollectionListView.tsx` (moved from `collections/CollectionListView.tsx`)
- [ ] `packages/react/src/collections/listView/CollectionListView.test.tsx` (moved from `collections/CollectionListView.test.tsx`)
- [ ] `packages/react/src/collections/editView/CollectionEditView.tsx` (moved from `collections/CollectionEditView.tsx`)
- [ ] `packages/react/src/collections/editView/CollectionEditView.test.tsx` (moved from `collections/CollectionEditView.test.tsx`)
- [ ] `packages/react/src/collections/editView/CollectionDeleteAction.tsx` (moved from `collections/CollectionDeleteAction.tsx`)
- [ ] `packages/react/src/collections/editView/CollectionDuplicateMenuItem.tsx` (moved from `collections/CollectionDuplicateMenuItem.tsx`)
- [ ] `packages/react/src/collections/editView/useDuplicateCollectionDocument.ts` (moved from `collections/useDuplicateCollectionDocument.ts`)
- [ ] `packages/react/src/collections/listView/CreateDocumentForm.tsx` (moved from `collections/CreateDocumentForm.tsx`)
- [ ] `packages/react/src/collections/listView/CreateDocumentForm.test.tsx` (moved from `collections/CreateDocumentForm.test.tsx`)
- [ ] `packages/react/src/collections/listView/CreateDocumentModal.tsx` (moved from `collections/CreateDocumentModal.tsx`)
- [ ] `packages/react/src/collections/listView/CreateDocumentModal.test.tsx` (moved from `collections/CreateDocumentModal.test.tsx`)
- [ ] `packages/react/src/collections/index.ts`
- [ ] `packages/react/src/fields/relationship/RelationshipPicker.tsx`
- [ ] `packages/react/src/fields/relationship/RelationshipPicker.test.tsx`
- [ ] `packages/react/src/testing/modalSuite.tsx`
- [ ] `packages/react/src/documents/documentEditBuiltinContributions.ts` (reviewed — no import of the moved files, comment prose only; no change)
- [ ] `.agent/docs/standards/naming-conventions.md` (`react-feature-folders` rule)
- [ ] `.agent/docs/standards/anti-patterns.md` (AP-023 dated addendum)
- [ ] `harness struct` (regenerate `directory-structure.md`)

## Step 3 — Status enum replaces string literals [agent]
Why: approval stages and branches will add states later; badges/filters must iterate `VERSION_STATUSES`, not switch on two literals.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test
- [ ] `packages/react/src/versions/StatusBadge.tsx` — JSDoc `@example` reads `VERSION_STATUSES.draft.key`/`VERSION_STATUSES.published.key`, not raw literals (the component body already compares against `VERSION_STATUSES.draft.key`, no change needed there)
- [ ] `packages/react/src/collections/editView/CollectionEditView.tsx` — `VexDocumentProvider`'s `status` field and the header `<StatusBadge>`'s `status` prop read `VERSION_STATUSES.draft.key`/`VERSION_STATUSES.published.key` instead of raw ternary literals
- [ ] `packages/react/src/globals/GlobalEditView.tsx` — same sweep: `isDraftDoc`'s `vex_status` comparison (and its `VexVersionStatus` cast), `documentStatus`, `VexDocumentProvider`'s `status` field, and the header `<StatusBadge>`'s `status` prop
- [ ] `packages/react/src/versions/VersionPublishAction.tsx` — `isDraftDoc`'s `document.status === "draft"` comparison
- [ ] `packages/react/src/versions/VersionUnpublishAction.tsx` — `publishedTimeline`'s `row.status === "published"` filter
- [ ] `packages/react/src/versions/VersionHistoryPanel.tsx` — `publishedVersion`'s `row.status === "published"` filter
- [ ] `packages/react/src/versions/showsUnpublish.ts` — `document.status === "published"` comparison
- [ ] `packages/react/src/testing/convex/schema.ts` — both `v.union(v.literal("draft"), v.literal("published"))` fields emit from `VERSION_STATUSES.draft.key` / `VERSION_STATUSES.published.key`
- [ ] `packages/react/src/collections/listView/CollectionListView.tsx` — already reads `VERSION_STATUSES.draft.key` / `VERSION_STATUSES.published.key` (confirmed, no further edit; this is the Step 2 move target of today's `collections/CollectionListView.tsx`)
- [ ] grep-proof: no raw `"draft"` / `"published"` status literals remain in `packages/react/src` non-test files (`*.test.ts(x)` keep literals asserting stored data; `packages/react/src/testing/**` test-harness suites — `viewSuite.ts`, `accessFixtures.ts`, `modalSuite.tsx` — keep their seeded literals, they assert stored data the same as a colocated test). `packages/core/src` is out of this step's scope: the parallel edit-view overhaul this sweep reconciles against touched no core files, and core's existing `"draft"`/`"published"` literals (e.g. `versions/assertUniqueAmongPublished.ts`) predate this spec.

## Step 4 — `admin.table` config surface + config-time validation [agent]
Why: every control ships with the key that drives it; bad `searchField` / unindexed sort must fail at `defineConfig`, naming the index to declare. Also carries Decision 35's `countLimit` (capped total count), which belongs on the same config surface.
Verify: `pnpm typecheck && pnpm --filter @vexcms/core test -- collections`
- [ ] `packages/core/src/collections/types.ts` — `CollectionTableSort<TFieldSlug>`; `searchField?: readonly TFieldSlug[]`; `defaultSort` typed to field slugs + `_creationTime`; `defaultColumns?: TFieldSlug[]`; `countLimit?: number`; `AdminCollectionConfigInput`/`AdminCollectionConfig` thread `TFieldSlug` into `table`
- [ ] `packages/core/src/fields/baseTypes.ts` — `admin.enableSorting?: boolean` / `admin.enableHiding?: boolean` on `FieldAdminConfigInput` and resolved `FieldAdminConfig`
- [ ] `packages/core/src/collections/config.ts` — resolve defaults (no `searchField` → search hidden; `defaultColumns` → all non-hidden fields; `enableSorting`/`enableHiding` default `false`; `countLimit` default `1000`); wires `validateTableConfig`
- [ ] `packages/core/src/collections/validateTableConfig.ts` (new) + `packages/core/src/collections/validateTableConfig.test.ts` (new) — throws `VexConfigError` when a `searchField` entry has no `searchIndex`, or `defaultSort.field` / an `enableSorting` field has no index leading with it (via `resolveCollectionIndexes`); message names field + index to declare
- [ ] `packages/core/src/collections/validator.test.ts` — test confirming `.searchIndex()` is emitted for every field with its own `searchIndex`, independent of `useAsTitle`/incoming relationships
- [ ] `packages/core/src/collections/config.test.ts` — type tests: `admin.table.searchField`, `defaultSort.field`, `defaultColumns` reject unknown field slugs; `countLimit` defaults to `1000`

## Step 5 — `VIEW_ACTIONS` access actions, `vex_views` table, and `composeViewWhere` [agent]
Why: shared views need a store and a gate; default denied (fail-closed). Decision 25 gives `find`/`search` a client-composed `where` instead of a server-side `view` argument: `find`/`search` take **no `view` argument** and know nothing about views. `collection.admin.table.views` (full, `where` intact) still ships to the browser like the rest of `VexClientConfig` (directly imported per P-004, so hiding `where` behind a client-facing type would change nothing: the string is already in the JS). `VexClientViewConfig` / `toClientViewConfig` is the one conversion point every UI READ goes through (stripping `where` for display, computing `hasHiddenFilter`/`hiddenFilterCount`), while `composeViewWhere` (new this step) is the one place a config view's raw `where` is read to BUILD the `where` the client actually sends — called client-side wherever the list composes its query (Step 8's `useVexListQuery`, fed by Step 12's `useListViews`), straight off the bundled config. Step 7's `listViews` query never touches a `config`-source view at all, returning `shared` views only. Step 4 also deferred validating `admin.table.views` entries against the rest of a collection's config (unknown `where` fields, an unindexed `sort`, an undeclared `searchField`, unknown `columns`) until `VexViewConfig` existed — this step closes that gap alongside the existing `searchField`/sort checks, with the same fail-at-`defineConfig` posture.
Verify: `pnpm --filter @vexcms/core test -- access schema collections`
- [ ] `packages/core/src/access/constants.ts` — `VIEW_ACTIONS = { readViews, createView, updateView, deleteView }`; `readViews` added to `QUERY_ACTIONS`
- [ ] `packages/core/src/access/types.ts` — `HasTable` guard; `ViewAction` wired into `SubjectMap`'s per-resource action union (collections only)
- [ ] `packages/core/src/schema/generateVexSchema.ts` + `packages/core/src/schema/generateVexSchema.test.ts` — emit `vex_views` unconditionally, with an optional `description` column
- [ ] `packages/core/src/collections/constants.ts` — `VEX_VIEW_SOURCES` map + derived `VexViewSource` union
- [ ] `packages/core/src/collections/types.ts` — `VexViewState`, `VexViewConfig` (+ `description`), `VexStoredView`, `VexClientViewState`, `VexClientViewConfig`; completes `admin.table.views` Step 4 deferred
- [ ] `packages/core/src/collections/toClientViewConfig.ts` (new) + `packages/core/src/collections/toClientViewConfig.test.ts` (new) — strips a config view's `where`, computing `hasHiddenFilter`/`hiddenFilterCount` (Decision 25)
- [ ] `packages/core/src/collections/composeViewWhere.ts` (new) + `packages/core/src/collections/composeViewWhere.test.ts` (new) — `composeViewWhere({ viewWhere, filter })` → `{ and: [viewWhere, filter] }` or whichever is present (Decision 25); the client's one AND point for a config view's hidden filter, full code
- [ ] `packages/core/src/collections/index.ts` — exports `toClientViewConfig` and `composeViewWhere` so Step 8/12 (`useVexListQuery`, `useListViews`) can call them client-side
- [ ] `packages/core/src/collections/validateTableConfig.ts` + `packages/core/src/collections/validateTableConfig.test.ts` — config-time `viewId` uniqueness, PLUS per-view `where`-field, `sort`-index, `searchField`, and `columns` checks

## Step 6 — Index pushdown, the declared-filter field-read exemption, and the total-count cap in `find` / `search` [agent]
Why: `find`/`search` take **no `view` arg** (Decision 25) — the client composes one plain `where` itself (`composeViewWhere`, Step 5) and sends it like any other filter. `resolveQueryIndex` (`collections/resolveQueryIndex.ts`) resolves a portable `sort` to an index and rejects an unreadable `sort.field` with `VexAccessError` (Decision 26), while also pushing the caller's `where` equalities into that same index's range when a declared index can absorb them (Decision 36) — a selective filter on an indexed field stops scanning every matching row per page. `matchDeclaredViewFilter` (new) implements Decision 26's one field-read exception: when a top-level AND part of the caller's `where` deep-equals a config view's own declared `where`, that part is trusted and skipped by the field-read check — `find`/`search` only re-check the remaining parts. Finally, `find`/`search` stop `.collect()`-ing the whole matching set to count it (which fails outright above Convex's ~32k-document scan limit) and instead count at most `admin.table.countLimit + 1` rows, returning `totalDocs` plus `totalDocsCapped: boolean` (Decision 35).
Verify: `pnpm --filter @vexcms/core test -- collections`
- [ ] `packages/core/src/collections/resolveQueryIndex.ts` (new) — resolves `sort` to an index AND pushes `where` equalities into that index's range (Decision 36)
- [ ] `packages/core/src/collections/resolveQueryIndex.test.ts` (new) — exhaustive pushdown cases
- [ ] `packages/core/src/collections/matchDeclaredViewFilter.ts` (new) — the declared-view-filter field-read exemption for BOTH config views (Decision 25) and shared `vex_views` rows (Decision 26's "Shared views" bullet): a pure matcher (`matchDeclaredViewFilter`) plus `loadSharedViewWheres`, which reads `vex_views` for the collection (indexed by collection, plus org when `orgCollectionSlug` is set), filtered by the caller's `readViews` rule, called by `find`/`search` only when the config-view match leaves an unreadable condition
- [ ] `packages/core/src/collections/matchDeclaredViewFilter.test.ts` (new) — exhaustive declared-filter matching cases for both config and shared views, plus `loadSharedViewWheres`'s `readViews`-gated read
- [ ] `packages/core/src/collections/types.ts` — adds `CollectionTableSort`, the portable sort shape `find`'s `sort` arg and `resolveQueryIndex` share
- [ ] `packages/core/src/db/types.ts` — `PaginationResult.totalDocs` drops `| null`; adds `totalDocsCapped` (Decision 35)
- [ ] `packages/core/src/collections/api/find/server.ts` — `sort` arg + index pushdown + declared-filter exemption + count cap; no `view` arg
- [ ] `packages/core/src/collections/api/find/server.test.ts` — new `describe` blocks for all of the above
- [ ] `packages/core/src/collections/api/search/server.ts` — sort-while-searching rejection, `searchField` allow-list + read-access validation, declared-filter exemption, count cap; no `view` arg
- [ ] `packages/core/src/collections/api/search/server.test.ts` — new `describe` blocks for all of the above
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — threads `sort` through `find`'s Convex registration (`search`'s registration is unchanged — it never gains `sort`, which is what makes "sort rejected while searching" true at the public-API boundary)

## Step 7 — Views server API [agent]
Why: Shared views CRUD must enforce the four `VIEW_ACTIONS` (`readViews`/`createView`/`updateView`/`deleteView`) server-side, scope by org, store an optional `description` alongside each view (revised Decision 11), and — new per the architecture review's Decision 26 — `saveView` must reject a `where` that references a field the saving user can't read, so a shared filter can never encode a yes/no condition on data its author (or anyone else) is denied.
Verify: pnpm --filter @vexcms/core test -- collections/api
- [ ] `packages/core/src/collections/api/listViews/server.ts` + `.test.ts` (new) — list for collection, scoped to `organizationId` resolved server-side from the caller's session; gated on `readViews` with `PERMISSION_SCOPES.any` — resolves to `[]` when denied (shared views are invisible, not an error — Decision 13)
- [ ] `packages/core/src/collections/api/saveView/server.ts` + `.test.ts` (new) — create/patch, idempotent on `viewId` (promotion dedupe); an insert requires `createView`, a patch requires `updateView`; stores `description`; rejects a `view.state.where` referencing an unreadable field (Decision 26)
- [ ] `packages/core/src/collections/api/removeView/server.ts` + `.test.ts` (new) — delete, requires `deleteView`
- [ ] `packages/core/src/collections/api/types.ts` — shared arg/result types for the three operations
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — registers `listViews`/`saveView`/`removeView`
- [ ] `packages/core/src/vexConvexApi.ts` — exports the three Convex function references
- [ ] `packages/core/src/db/test/convex/schema.ts` — `vex_views` table added to `@vexcms/core`'s own hand-maintained test fixture schema (Decision 24), including `description`
- [ ] `packages/react/src/collections/api/listViews/client.ts` + `packages/react/src/collections/api/saveView/client.ts` + `packages/react/src/collections/api/removeView/client.ts` (new) — tanstack-query wrappers
- [ ] `packages/react/src/client/index.ts` — re-exports the three client ops + `VexStoredView`/`VexViewConfig` types

## Step 8 — Data-source hooks: `useVexListQuery` / `useVexDocQuery` [agent]
Why: the hook boundary is where plugin, adapter, and adopted-table sources plug in later (Design Decision 19); list/edit views stop calling `vexConvexApi` directly. The names gain the `Query` suffix to read as data fetching, distinct from the edit view's `useVexDocument()` context hook (`documents/VexDocumentContext.tsx`). Step 8 ships full code, not guided stubs (Decision 1), so `useVexListQuery`'s search-mode path is a real, cursor-paginated implementation here. There is **no `view` arg** anywhere in this file — `find`/`search` take none (Decision 25/26), and a caller who needs a config view's hidden filter composes it into `where` itself with `composeViewWhere` (Step 5) before calling either hook. `useVexListQuery` surfaces `totalDocsCapped` (Decision 35), threaded through from `usePaginatedQuery`, whose own reset/`enabled` plumbing this step still adds (the "resets to the first page" half of Decision 8 lives there so `useVexListQuery` inherits it for free on every prop that can change the result set). File homes follow Step 2's restructure: `CollectionListView` lives at `collections/listView/CollectionListView.tsx` and `CollectionEditView` at `collections/editView/CollectionEditView.tsx`; `MediaCollectionListView` is untouched by Step 2 and stays under `media/`.
Verify: pnpm --filter @vexcms/react test -- hooks collections && browser: list + edit views unchanged
- [ ] `packages/react/src/hooks/useVexListQuery.ts` (new) + `packages/react/src/hooks/useVexListQuery.test.tsx` (new) — `{ collection, where, sort, search, searchField, drafts, pageSize }` → `{ results, totalDocs, totalDocsCapped, isDone, loadMore, isPending }`; `find`-mode wraps `usePaginatedQuery`, search-mode is a sibling cursor accumulator against `vexConvexApi.search`, both called unconditionally and toggled via `enabled`
- [ ] `packages/react/src/hooks/useVexDocQuery.ts` (new) + `packages/react/src/hooks/useVexDocQuery.test.tsx` (new)
- [ ] `packages/react/src/hooks/usePaginatedQuery.ts` — render-time query-identity reset (Decision 8) + an `enabled` prop so `useVexListQuery` can call it unconditionally, plus `totalDocsCapped` on the return value (Decision 35)
- [ ] `packages/react/src/hooks/index.ts` — barrel exports the two new hooks
- [ ] `packages/react/src/collections/api/find/client.ts` — `FindClientArgs`/`FindClientPaginatedArgs` gain `sort?: CollectionTableSort<string>`; no `view` field (Decision 25/26 — `find` takes none)
- [ ] `packages/react/src/testing/convex/bridge.ts` + `packages/react/src/testing/hooksSuite.tsx` — test-harness support for the two new hooks, plus coverage for `usePaginatedQuery`'s reset behavior and `totalDocsCapped`
- [ ] `packages/react/src/collections/listView/CollectionListView.tsx` (Step 2's new path), `packages/react/src/media/MediaCollectionListView.tsx`, `packages/react/src/collections/editView/CollectionEditView.tsx` (Step 2's new path) migrated; no direct `vexConvexApi` reads in those files (mutations stay, Design Decision 19's hook boundary is read-side)

## Step 9 — List slots + built-ins as `vex.*` contributions, `listView/` structure [agent]
Why: create, row/bulk delete, open, inspect, and copy-id become `list.*` contributions so custom row/bulk actions use the same extension path (plugin stem S1–S14, client-only S14). Revised after the architecture review: this step moves entirely into `collections/listView/` (Decision 21 — Step 2 already restructured the folder, this step only adds new content there), one built-in per file (Decision 37), a `CollectionListProvider`/`useCollectionList()` context so built-ins stop taking props drilled through the layout (Decision 37), and the slot outlet reuses the existing generic `SlotOutlet` (`slots/SlotOutlet.tsx`) rather than inventing a list-specific one — list slots are flat and additive with no override chains, the same shape `field.beforeInput`/`blocks.item.actions` already use, so `DocumentEditSlotOutlet`'s root/resource/override-chain machinery (built for `edit.*`'s override-wrapped built-ins, Decision 15/16) is not a fit here. `ListLayout.tsx` composes regions only (Decision 38) — it does not itself implement any built-in.
Verify: `pnpm --filter @vexcms/core test -- components` && `pnpm --filter @vexcms/react test -- collections/listView` && browser: list renders identically, row ⋯ menu shows Open/Inspect/Copy ID/Delete in order, selecting rows shows an inline (non-floating) bulk group in the toolbar
- [ ] `packages/core/src/components/types.ts` — `SLOT_IDS.list`: `headerActions`, `toolbar`, `filters`, `beforeTable`, `afterTable`, `rowActions`, `bulkActions` (Decision 18, unchanged by the review)
- [ ] `packages/core/src/components/builtinIds.ts` — `vex.list.create`, `vex.list.search`, `vex.list.filters`, `vex.list.columns`, `vex.list.views`, `vex.list.row.open`, `vex.list.row.inspect`, `vex.list.row.copyId`, `vex.list.row.delete`, `vex.list.bulk.delete`
- [ ] `packages/core/src/collections/types.ts` — `AdminListComponentsInput`/`AdminListComponents`, `components` on `AdminCollectionConfigInput`/`AdminCollectionConfig`
- [ ] `packages/react/src/collections/listView/CollectionListContext.tsx` (new) — `CollectionListProvider`/`useCollectionList()`, mirroring `documents/VexDocumentContext.tsx`
- [ ] `packages/react/src/collections/listView/ListCreateAction.tsx` (new) — `vex.list.create`
- [ ] `packages/react/src/collections/listView/ListRowOpenAction.tsx` (new) — `vex.list.row.open`
- [ ] `packages/react/src/collections/listView/ListRowInspectAction.tsx` (new) — `vex.list.row.inspect`
- [ ] `packages/react/src/collections/listView/ListRowCopyIdAction.tsx` (new) — `vex.list.row.copyId`
- [ ] `packages/react/src/collections/listView/ListRowDeleteAction.tsx` (new) — `vex.list.row.delete`
- [ ] `packages/react/src/collections/listView/ListBulkDeleteAction.tsx` (new) — `vex.list.bulk.delete`
- [ ] `packages/react/src/collections/listView/listBuiltinContributions.ts` (new) — registry, like `documents/documentEditBuiltinContributions.ts`
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` (new) + `ListLayout.test.tsx` (new) — composes the seven `list.*` slots via `SlotOutlet`; row actions render as one ⋯ `DropdownMenu`; the bulk group renders inline in the toolbar area while a row is selected
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — bulk-delete UI moves out; `onSelectionChange` callback replaces `onBulkDelete`/`enableBulkActions`
- [ ] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — drops the floating/fixed positioning; renders inline wherever its caller places it
- [ ] `packages/react/src/collections/listView/CollectionListView.tsx` — wraps its output in `CollectionListProvider`, delegates rendering to `ListLayout`; existing delete UI moved into built-in contributions; `RevalidateButton` stays outside it (Decision 23); passes a placeholder `onInspect` for Step 13's peek

## Step 10 — Toolbar controls, the shared URL codec, and the fixed-height data table [agent]
Why: search, sort, filters, and columns meet the core navigability acceptance; `DataTable`'s fixed-height body (Decision 22) and `ScrollSection` (Decision 31) are the standing scroll-container rule for the rest of the admin panel; Decision 35's count cap needs a visible "1,000+" in the same footer. Per the zero-layout-shift pass (Decisions 39–43, `standards/frontend/layout-stability.md`):
Verify: `pnpm --filter @vexcms/core test -- collections/listUrlParams collections/listPreferenceCookies && pnpm --filter @vexcms/react test -- collections/listView ui/data-table ui/ScrollSection && browser: search, field switch, sort, column hide, density toggle (confirm the \`vex-list-density\` cookie is written, then reload — the row height matches on the very first paint, no flash), resize the list pane across the \`@lg/list\`/\`@xl/list\`/\`@2xl/list\` breakpoints and confirm Copy link / the Columns label / Rows per load fold into ⋯ in that order with no measurement-driven flash, empty/error states, "Showing 25 of 1,000+" on a capped collection, reload keeps URL state
- [ ] `packages/core/src/collections/listUrlParams.ts` (new) + test — `parseListParams`/`serializeListParams`, the compact `q`/`qf`/`sort`/`filter`/`size`/`view`/`peek` grammar (Decision 9), exhaustive round-trip tests; pure, no react import, exported from `@vexcms/core` (Decision 40)
- [ ] `packages/core/src/collections/index.ts` — 1 edit, barrel-exports the two files above
- [ ] `packages/core/src/collections/listPreferenceCookies.ts` (new) + test — `ListDensity`, `ListPreferences`, `LIST_PREFERENCE_COOKIES`, `parseListPreferences({ cookies })` (Decision 42) — the server-readable half of the density cookie
- [ ] `packages/core/src/framework.ts` — 1 edit, `CollectionListViewProps` gains `initialPreferences?: ListPreferences`
- [ ] `packages/react/src/collections/listView/useListUrlState.ts` (new) + test — wraps the core codec in `nuqs`; returns `{ q, qf, sort, filter, size, view, peek, setQ, setQf, setSort, setFilter, setSize, setView, setPeek }`; `replace` while typing, `push` on discrete actions
- [ ] `packages/react/src/collections/listView/listPreferenceCookies.ts` (new) + test — `writeListDensityCookie`, the client-side cookie writer
- [ ] `packages/react/src/collections/listView/ListSearch.tsx` (new) + test — debounced `q` input + `qf` field picker (250ms, Enter commits+pushes, Esc clears/blurs), read-access-gated field list
- [ ] `packages/react/src/ui/data-table/DataTableSortHeader.tsx` (new) + test — sortable headers; parked-sort disabled state with "Sorted by relevance"
- [ ] `packages/react/src/ui/ScrollSection.tsx` (new) + test — `ScrollArea` wrapper with `title`/`count`/`collapsible`/`persistKey` (Decision 31)
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` (new) + test — hideable columns (via `ScrollSection`) + a fully controlled Density toggle (`density`/`onDensityChange`, Decision 29/42 — no internal `useLocalStorage`); the "Columns" label collapses itself through a CSS class on `@container/list`, not a caller-supplied `collapsed` boolean (Decision 43)
- [ ] `packages/react/src/ui/data-table/DataTablePageSizeSelect.tsx` (new) + test — "Rows per load" select, rendered twice (CSS-toggled) by `ListToolbar`'s collapsible group
- [ ] `packages/react/src/collections/listView/ListEmptyState.tsx` (new) + test — empty collection / no search results / no filter results (DESIGN-NOTES.md §5 copy)
- [ ] `packages/react/src/collections/listView/ListQueryError.tsx` (new) + test — generic "Couldn't load {plural}" + the `UNINDEXED_SORT` variant
- [ ] `packages/react/src/collections/listView/ListCopyLinkButton.tsx` (new) + test — copies the current URL; `buildHref` overridable (Step 12 serializes full state for a local view); no `collapsed` prop — `ListToolbar` renders two CSS-toggled copies instead
- [ ] `packages/react/src/collections/listView/ListSearchAction.tsx` (new) + test — the `vex.list.search` built-in, wrapping `ListSearch` with `collection`/`urlState` from `useCollectionList()`
- [ ] `packages/react/src/collections/listView/ListColumnsAction.tsx` (new) + test — the `vex.list.columns` built-in, wrapping `DataTableColumnsMenu` with `hideableColumns`/`visibleColumns`/`onVisibleColumnsChange`/`hasActiveView`/`density`/`onDensityChange` from `useCollectionList()` — no `collapsed` prop
- [ ] `packages/react/src/collections/listView/listBuiltinContributions.ts` — adds `listToolbarContributions()` (`vex.list.search`, `vex.list.columns`), consumed by `ListToolbar.tsx` below
- [ ] `packages/react/src/collections/listView/ListToolbar.tsx` (new) + test — hosts `list.toolbar` (`vex.list.search`/`vex.list.columns` resolve through `listToolbarContributions()`, this step), the bulk group, and a pure-CSS `@container/list` collapse for Copy link / Rows-per-load (Decision 43)
- [ ] `packages/react/src/fields/index.tsx` — `getCollectionColumnDefs` sets every column's `enableSorting`/`enableHiding` from `fieldDef.admin.enableSorting`/`enableHiding` (Step 4) in ONE central pass
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — fixed-height `ScrollArea` body with a sticky header and a pinned footer showing the capped count (Decision 35); controlled `sort`/`onSortChange`/`sortDisabled`/`visibleColumns`/`density`; `emptyState`/`queryError` slots; `density`'s type is now core's `ListDensity`
- [ ] `packages/react/src/collections/listView/CollectionListContext.tsx` — extends Step 9's base shape: `urlState`, `selection`, `visibleColumns`/`onVisibleColumnsChange`/`hideableColumns`, `hasActiveView` (Decision 37), plus this step's `onDensityChange` and the now-`ListDensity`-typed `density`
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` — 2 edits: the `@container/list` root (Decision 22/43), and the new query-result props `CollectionListView` now computes
- [ ] `packages/react/src/collections/listView/CollectionListView.tsx` — calls `useListUrlState` (now backed by the core codec) and feeds `q`/`qf`/`sort`/`filter`/`size` into `useVexListQuery`; density is `useState` seeded from `props.initialPreferences?.density` and written to the `vex-list-density` cookie on change, never read from `useLocalStorage`; accepts the new `initialPreferences` prop
- [ ] `packages/react/src/collections/listView/index.ts` + `packages/react/src/ui/data-table/index.ts` + `packages/react/src/ui/index.ts` — barrel exports for the new files (includes `listPreferenceCookies`)

## Step 11 — Filter builder (AND rows + one level of OR groups) [agent]
Why: authors `where` for the URL and views; DNF covers multi-value, empty-value, and triage use cases without a tree editor (Decision 10). Files live in `collections/listView/` per the developer's folder-placement decision (Decision 21) and the closed-subfolder AP-023 fix, dropping the redundant `Collection` prefix. The builder stays presentational — this step's `vex.list.filters` built-in (`listView/ListFiltersAction.tsx`) reads `collection`/`where`/`setFilter` from `useCollectionList()` (Decision 37) and passes them down as props, rather than this component reading context itself. `where` here is always the user's OWN filter, never a config view's hidden filter (Decision 25). Per Decisions 39–43, filter-chip visibility is cookie-backed rather than `useLocalStorage` (Decision 42 puts it in `vex-list-chips:<collection>`, read on the server exactly like `readLivePreviewPanelCookie`) via the shared `listPreferenceCookies.ts` helper Step 10 introduces for density. `ListFilterChips` and `ListHiddenFilterBadge` are seeded from `initialVisible`/the view's config so the server render matches.
Verify: `pnpm --filter @vexcms/core test -- collections/listPreferenceCookies && pnpm --filter @vexcms/react test -- collections/listView/whereDnf collections/listView/ListFilterBuilder collections/listView/ListFilterChips && browser: hard reload with chips cookie hidden shows no chip row on first paint; OR group round-trips through URL reload; isEmpty/isNotEmpty row applies and chips show "is empty"/"is not empty"; vex_status filters on a versioned collection; an unreadable field never appears in the field picker`
- [ ] `packages/react/src/collections/listView/whereDnf.ts` (new) + test — `toDnf(where) | null`, `fromDnf(groups)`, `ListFilterOp`, `listFilterOpOf`/`applyListFilterOp` for the `isEmpty`/`isNotEmpty` editor operators
- [ ] `packages/react/src/collections/listView/ListFilterBuilder.tsx` (new) — groups (OR) of rows (AND); operators by field type incl. `isEmpty`/`isNotEmpty` on every type; built-in `vex_status` field on versioned collections; unreadable fields excluded (`useFieldPermissions`); live apply with muted incomplete rows; text `eq` hint; non-DNF `where` shown read-only
- [ ] `packages/react/src/collections/listView/ListFiltersAction.tsx` (new) + test — the `vex.list.filters` built-in, wrapping `ListFilterBuilder`'s trigger/popover with `collection`/`where`/`setFilter` from `useCollectionList()`
- [ ] `packages/react/src/collections/listView/listBuiltinContributions.ts` — adds `listFiltersContributions()` (`vex.list.filters`)
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` — the `list.filters` `SlotOutlet`'s `builtins` prop changes from `[]` (Step 9's placeholder) to `listFiltersContributions()`
- [ ] `packages/core/src/collections/listPreferenceCookies.ts` (existing, Step 10) — add the `chipsVisible` cookie entry, `listChipsVisibleCookieName`, and the `chipsVisible` field on `parseListPreferences`'s result
- [ ] `packages/react/src/collections/listView/listPreferenceCookies.ts` (existing, Step 10) — add `writeListChipsVisibleCookie`
- [ ] `packages/react/src/collections/listView/ListFilterChips.tsx` (new) + test — active-filter chips (clear one / clear all), per-browser visibility toggle, cookie-backed (Decision 42) and seeded from `initialVisible` so the server render matches
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` — renders `ListFilterChips` in the fixed-height chip row below the toolbar, below the `list.filters` outlet (Decision 22), forwarding `initialPreferences.chipsVisible`; composition-only edit (Decision 38)

## Step 12 — Saved views: tabs, modified state, hidden filters, server prerender [agent]
Why: saved views live in `collections/listView/` (Decision 21) as `ListViewTabs` / `ListSaveViewDialog` / `ListHiddenFilterBadge` / `listViewStore` / `useListViews`. `useListViews` exposes `composeQueryWhere` — the one place a config view's hidden filter (never read by any other UI surface) folds back in with the caller's own filter via the core `composeViewWhere` helper (Step 5), since `find`/`search` take no `view` argument. Tabs sit above the table (Decision 11), with a modified-state diff with Save/Reset, a hidden-filter lock badge, and a `description` field. Wired to Step 10's flat `useListUrlState` setters and Step 5's nested-`state`, client-safe view types.
Verify: `pnpm --filter @vexcms/core test -- listViewsCookie && pnpm --filter @vexcms/react test -- collections` && browser: tab between All/config/shared/local views, modify a shared view and Save changes, Save as new on a config view (confirm the saved view's `where` is only the user's own filter, not a config view's hidden condition), rename and delete a local view, promote a local view to shared with the confirm dialog, hidden-filter lock badge popover on a config view with a server-resolved where, unknown view id shows the fallback notice, Copy link on a local view serializes full state, hard-reload a URL with `view=local:<id>` and confirm the local view's tab and name render immediately (no post-hydration flash) from the cookie index, resize the list panel across `@container/list` breakpoints and confirm the tab count changes without any visible reflow jump
- [ ] `packages/core/src/collections/listViewsCookie.ts` (new) + test — `listViewsCookieName`, `parseListViewsIndexCookie` (core, shared with Step 14's server read)
- [ ] `packages/react/src/collections/listView/listViewStore.ts` (new) + test — `localViewsStorageKey`, `useLocalViews`; writes the `vex-list-views:<collection>` cookie index alongside every localStorage mutation; prunes stale cookie entries after hydration
- [ ] `packages/react/src/collections/listView/useListViews.ts` (new) + test — merges `config`/`shared`/`local` views by `viewId`; accepts `initialViews`/`initialLocalIndex`, seeding the shared-views query and the first local-index render from them; exposes `composeQueryWhere`
- [ ] `packages/react/src/collections/listView/ListViewTabs.tsx` (new) + test — tabs above the table; a fixed, CSS-driven visible-tab count per `@container/list` breakpoint; accepts `initialLocalIndex` so the first local-view tabs render without a `localStorage` read
- [ ] `packages/react/src/collections/listView/ListSaveViewDialog.tsx` (new) + test — save new / rename, shared-vs-local scope gated by `createView`/`updateView`
- [ ] `packages/react/src/collections/listView/ListHiddenFilterBadge.tsx` (new) + test — lock badge + count, never a chip or builder row
- [ ] `packages/react/src/collections/index.ts` (edit) — barrel export for the three new components
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` (Step 9's file) — mounts `ListViewTabs` above the toolbar, forwarding `initialViews`/`initialLocalIndex` from `CollectionListView`'s props
- [ ] `packages/react/src/collections/listView/ListToolbar.tsx` (Step 10's file) — mounts `ListHiddenFilterBadge` beside the filter chips

## Step 13 — Inspect peek, responsive per Decision 27 [agent]
Why: Design Decision 27 needs the panel and the prefetch strategy that makes it open instantly. The architecture review's responsive pass (Decision 43) replaces the `ResizeObserver`-measured inline/right-panel switch with a fixed `@5xl/list` container-query breakpoint, so the server's first paint is already the settled layout (Decision 39, `layout-stability.md`) — resizing across the breakpoint needs no React re-render at all. The real `Sheet` component (Radix-style `Portal` + viewport-`fixed` positioning) can't be the thing a *named* container query toggles: a portaled node sits outside `@container/list`'s DOM subtree, so no `@5xl/list:` variant on it would ever match. A `peek=<id>` URL can be open on first paint (Decision 39/41's server prefetch), so — unlike `DataTableResponsiveMenu`'s overlay-vs-popover choice, which starts closed — the bottom-`Sheet`-vs-panel choice can never be a `useIsMobile()` JS branch either: both layouts mount unconditionally, and a `md:hidden`/`hidden md:flex` viewport-class pair (not `@container/list`, since 768px is a device property per Decision 22 point 3) decides which one is visible, exactly mirroring `ListViewTabs`' CSS-only mobile collapse (Step 16). The `@5xl/list`-and-narrower panel is one plain, always-mounted `div`, descendant of the same `@container/list` root `CollectionListView` already establishes (Decision 22), styled `fixed` (viewport-docked, right-aligned, bordered, shadowed — visually the same right-panel Decision 27 describes) by default and switched to a `static` flex sibling by its own `@5xl/list:` variant classes. It was never a Radix dialog, so "non-modal" (Decision 27: "the list behind it stays interactive") is true unconditionally, in both breakpoints, with no `modal={false}` prop to reason about. Decision 39/41's prerender also needs a document to seed from when `peek=` names a row outside the loaded page: `ListPeek` gains an `initialDoc` prop, which `NextAdminPage` (Step 14) fills from its own `get(peek)` prefetch. Decision 21 keeps the files in `collections/listView/` with the redundant `Collection` prefix dropped (`ListPeek`, `useListPeekPrefetch`), and Decision 38 keeps no separate file for the (now much smaller) layout logic — it's a few Tailwind classes, not a hook.
Verify: `pnpm --filter @vexcms/react test -- collections/listView/ListPeek collections/listView/useListPeekPrefetch collections/listView/CollectionListView ui/data-table/DataTable`
- [ ] `packages/react/src/collections/listView/ListPeek.tsx` (new) + `packages/react/src/collections/listView/ListPeek.test.tsx` (new) — non-modal panel, two layouts (inline / right-docked) chosen by a `@5xl/list` container-query variant on one always-mounted `div`, a third (bottom `Sheet`) toggled by a `md:hidden`/`hidden md:flex` CSS viewport-class pair (never `useIsMobile()` — a `peek=` deep link can be open on first paint), Fields/JSON tabs, seeded from `useVexDocQuery`'s `initialData` via either a loaded row or the server-prefetched `initialDoc`
- [ ] `packages/react/src/collections/listView/useListPeekPrefetch.ts` (new) + `packages/react/src/collections/listView/useListPeekPrefetch.test.ts` (new) — hover(150ms)/focus/neighbour-row prefetch via `queryClient.prefetchQuery(convexQuery(...))`
- [ ] `packages/react/src/collections/listView/index.ts` — barrel exports both new modules
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — adds a generic `getRowProps` per-row event hook (builds on Step 10's edit)
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` — adds `onRowHoverStart`/`onRowHoverEnd`/`onRowFocus` props, forwarded to `DataTable`'s `getRowProps` (builds on Step 9/10's edits; `ListLayout` composes regions only, per Decision 38 — this edit adds no new region, only forwards three props through the existing `<DataTable>` call)
- [ ] `packages/react/src/collections/listView/CollectionListView.tsx` — gains an `initialPeekDoc` prop (Decision 39/41), mounts `ListPeek` as `ListLayout`'s sibling inside the component's existing `@container/list` root, wires `useListPeekPrefetch` into `ListLayout`'s row-hover/focus props — no container ref, since the breakpoint is CSS, not measurement

## Step 14 — Server prerender [agent]
Why: Decisions 39–43 require the list to prerender exactly what the client shows, with zero layout shift (`.agent/docs/standards/frontend/layout-stability.md`: "prefetch what decides layout" — the server's query args must equal the client's, or hydrated `initialData` seeds the wrong query key and the list repaints after hydration). This step does three things. First, it extracts the Convex-args-building logic `useVexListQuery` (Step 8) already has into one pure core helper, `buildListQueryArgs.ts`, so the server can call the exact same code instead of a hand-copied second implementation that could drift. Second, because a shareable link to an *unmodified* shared or config view can legally omit every param that matches the view's own saved state (Decision 9 — "only params that differ from the saved view appear"), resolving "the client's args" for such a link requires merging the URL with the active view's own saved state, not just reading the URL at face value; `resolveListQueryState.ts` is that one merge, also pure and core, so a bare `?view=shared:<id>` link renders the same rows whether the browser or `NextAdminPage` resolves it. A **local** view never needs this merge — Decision 41 already requires its full state in the URL — so `resolveListQueryState` only consults a `configView`/ `sharedView` when the caller found one. Third, it wires `NextAdminPage` itself: `searchParams`, the preference and local-view-index cookies (mirroring `readLivePreviewPanelCookie`, `packages/core/src/livePreview/panelCookie.ts`), the `listViews` prefetch, and the `findPaginated`/`search`/`get` prefetches built from the two helpers above.
Verify: `pnpm --filter @vexcms/core test -- collections && pnpm --filter @vexcms/react test -- hooks && pnpm --filter @vexcms/next test && browser: hard-reload a default list, a `q` link, a `sort` link, a `filter` link, a shared-view link, a config-view link with its hidden filter, a local-view link, a `size` link, and a `peek` link — zero visible layout shift on each`
- [ ] `packages/core/src/collections/buildListQueryArgs.ts` (new) + test — `buildListFindQueryArgs`/`buildListSearchQueryArgs`, the ONE place the `findPaginated`/`search` Convex args get built, shared by `useVexListQuery` (client) and `NextAdminPage` (server)
- [ ] `packages/core/src/collections/resolveListQueryState.ts` (new) + test — merges the parsed URL with the active view's own saved state and the collection's `admin.table` defaults into one effective `where`/`sort`/`search`/`searchField`/`pageSize`
- [ ] `packages/core/src/collections/listViewsCookie.ts` (new) + test — `localListViewsCookieName`/`readLocalListViewsCookie`, the server-readable half of the `vex-list-views:<collection>` cookie (Decision 41); Step 12's `listViewStore.ts` is the client writer, mirroring `livePreview/panelCookie.ts`'s core-name/client-writer split
- [ ] `packages/core/src/collections/index.ts` — barrel-exports the three new modules
- [ ] `packages/core/src/framework.ts` — `CollectionListViewProps` gains `initialPeekDoc`
- [ ] `packages/react/src/hooks/useVexListQuery.ts` — both branches call the new `buildList*QueryArgs` instead of building their own args inline; the search branch also gains `initialData` support (a search-active first load had no SSR path at all until now, which would itself be a layout shift the moment `q` is in the URL)
- [ ] `packages/react/src/hooks/useVexListQuery.serverParity.test.tsx` (new) — proves `useVexListQuery`'s Convex args equal `buildListFindQueryArgs`/`buildListSearchQueryArgs`'s own output for the same props
- [ ] `packages/next/src/NextAdminPage.tsx` — `searchParams` prop; the collection list branch prefetches `listViews` (server-side, so it resolves `[]` for a caller without `readViews`, per Step 7's gate), resolves the active view, prefetches `findPaginated`/`search` via the shared builders, prefetches `get(peek)`, and passes `initialData`/`initialViews`/`initialLocalIndex`/`initialPreferences`/`initialPeekDoc` to `CollectionListView`
- [ ] `packages/next/src/NextAdminPage.test.ts` — new prefetch-args cases: a default list, `q`, `sort`, `filter`, a shared view, a config view with a hidden filter, a local view, `size`, and `peek`
- [ ] `apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx`, `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx`, `packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/[[...path]]/page.tsx` — forward `searchParams` to `NextAdminPage`
- [ ] `apps/test/convex/seed.ts`, `apps/www/convex/seed.ts` — the embedded "one route in your app" code example forwards `searchParams` too, so it stays copy-pasteable

## Step 15 — Keyboard shortcuts [agent]
Why: Decision 30 pins the shortcut set to six core keys, handled by one internal hook built on `useEventListener` from `@ts-hooks-kit/core` — no new dependency, no command palette, no rebinding (Out of Scope). Per Decision 21, the hook lives in `collections/listView/` (the closed feature-subfolder set), named `useListShortcuts` with the `Collection`/`List` folder-scope prefix dropped, following the `listView/useListUrlState.ts` precedent from Step 10. Nothing here depends on the server-prerender, URL-codec, cookie, or CSS-collapse decisions (39–43): the hook only binds `window` keydown listeners and calls caller-supplied callbacks.
Verify: `pnpm --filter @vexcms/react test useListShortcuts`
- [ ] `packages/react/src/collections/listView/useListShortcuts.ts`
- [ ] `packages/react/src/collections/listView/useListShortcuts.test.ts`
- [ ] `packages/react/src/collections/index.ts`

## Step 16 — Responsive pass at every width [agent]
Why: Decision 22 is **container, not viewport**: the list root is a size container (`@container/list`, like the edit view's `@3xl/form`), and layout switches key off the list's own width via container-query variants, not `md:`/`lg:` viewport breakpoints. `useIsMobile` is reserved for one thing only (Decision 22 point 3 / Decision 43): deciding whether a menu/sheet/tab-switcher renders as an inline overlay or a bottom `Sheet`. Decision 43 (`layout-stability.md`) rules out a measured ⋯ overflow collapse — a JS-measured collapse only settles after hydration and reflows the toolbar on first paint. This step is a CSS-only collapse instead: every collapsible toolbar control renders twice — once in its inline slot, once inside the ⋯ menu — and a fixed `@container/list` breakpoint pair (`hidden <bp>:flex` / `<bp>:hidden`) decides which copy is visible, so the server's render is already the final render (Decision 43, `layout-stability.md` "Responsive variants render correctly first"). The fixed order (Copy link, then Columns, then rows per load; Search and Filter never collapse) is three breakpoint tiers. `ListToolbar`'s ⋯ trigger gets a `DataTableResponsiveMenu` container so its menu opens as a `Popover` or bottom `Sheet` on `useIsMobile`'s split (a device property, not a container-width one, and therefore untouched by Decision 43), not the toolbar's own layout width — `DataTableResponsiveMenu` itself picks `Popover` vs. bottom `Sheet` purely off `useIsMobile`, an interaction-time choice that never shifts first paint.
Verify: browser at 375 / 390 / 768 / 1024 / 1440 on `apps/test`, plus a narrow split-pane
- [ ] `packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx` (new) + test — one trigger/content pair: `Popover` at `useIsMobile() === false`, bottom `Sheet` at `useIsMobile() === true` (768px, viewport — Decision 22 point 3 / Decision 43)
- [ ] `packages/react/src/ui/data-table/index.ts` — barrel export for `DataTableResponsiveMenu`
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — sticky first column while the table scrolls horizontally (unconditional, not breakpoint-gated)
- [ ] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — container-query sizing (`@container/list`, not `md:`): full-width, larger touch targets, icon-only secondary actions below `@lg/list` (position stays Step 10's — inline in the toolbar, left of Filter)
- [ ] `packages/react/src/collections/listView/ListToolbar.tsx` — CSS-only ⋯ overflow at fixed `@container/list` breakpoints (Decision 43), wrapped in a `DataTableResponsiveMenu` container for the `Popover`/`Sheet` choice; the bulk group (when a selection is active) replaces the Filter trigger below `@lg/list` via container-query classes, not `useIsMobile`
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` + `packages/react/src/collections/listView/ListFilterBuilder.tsx` — each swaps its trigger/content container for `DataTableResponsiveMenu`
- [ ] `packages/react/src/collections/listView/ListViewTabs.tsx` — the fixed visible-tab count per `@container/list` width is Step 12's; this step only collapses the tab row into one full-width view button that opens a `DataTableResponsiveMenu` sheet below `useIsMobile`'s 768px split
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — J section notes list view owned by I, resolves both stale "known suspects" bullets

## Step 17 — Examples, docs, acceptance [agent]
Why: acceptance needs a 200-doc collection, a custom row + bulk action exercising `access`, a config view with a server-resolved `where` the current role can't read, a count-cap demonstration, an index-pushdown demonstration, a declared-filter narrowing demonstration, and a docs guide that matches every decision through the architecture review (peek, density, shortcuts, parked sort, filter chips, view tabs, hidden-filter narrowing, count cap, pushdown, server prerender, and the local-view cookie). It also needs hard-reload proof that Decision 39's zero-layout-shift promise holds for every view source and for the peek. Verify: pnpm typecheck && pnpm test && vex generate && the 15-item browser smoke checklist below, for at least one allowed role and one denied role
Verify: pnpm typecheck && pnpm test && vex generate && the 15-item browser smoke checklist below, for at least one allowed role and one denied role
- [ ] `apps/test/src/db/constants/index.ts` + `apps/test/src/vexcms/collections/testimonials.ts` (new) + `apps/test/src/vexcms/collections/index.ts` — collection with `searchField` (2 fields), sortable columns, an indexed `source` field, a low `admin.table.countLimit` (below the seeded row count, to exercise `totalDocsCapped`), 3 `views` (one with a server-resolved `where` on a field the `contributor`/`user` roles can't read), custom row + bulk action contributions, seed 200 docs
- [ ] `apps/test/src/components/TestimonialFeatureRowAction.tsx` + `apps/test/src/components/TestimonialBulkApproveAction.tsx` (new) — custom row + bulk action contributions
- [ ] `apps/test/src/auth/access.ts` — `testimonials` resource, `VIEW_ACTIONS` rules (`readViews`/`createView`/`updateView`/`deleteView`), field-level read restriction on `internalScore`
- [ ] `apps/test/convex/seed.ts` — 200 seeded rows, each stamped with a `source`
- [ ] `apps/docs/src/content/docs/guides/list-views.mdx` (new) — list-view guide covering every Step 1–16 behavior, including server prerender and the local-view cookie index; `README.md` `admin.table` claims made true
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — I tasks ticked; backlog updated
- [ ] browser smoke checklist: every Verify above + `VIEW_ACTIONS` denied vs allowed + hidden-filter badge + density + peek + keyboard shortcuts + declared-filter narrowing + count cap + pushdown + hard-reload zero-shift for shared/config/local views and `peek=`
