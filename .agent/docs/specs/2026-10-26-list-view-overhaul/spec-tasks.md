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
  - "apps/docs/src/content/docs/guides/admin-cookies.mdx"
  - "apps/test/convex/seed.ts"
  - "apps/test/src/vexcms/collections/pages.ts"
  - "apps/test/src/auth/access.ts"
  - "apps/test/src/components/TestimonialBulkApproveAction.tsx"
  - "apps/test/src/components/TestimonialFeatureRowAction.tsx"
  - "apps/test/src/db/constants/index.ts"
  - "apps/test/src/vexcms/collections/index.ts"
  - "apps/test/src/vexcms/collections/testimonials.ts"
  - "packages/core/src/access/constants.ts"
  - "packages/core/src/access/types.ts"
  - "packages/core/src/adminCookie.test.ts"
  - "packages/core/src/adminCookie.ts"
  - "packages/core/src/collections/collectRelationshipFilterValues.test.ts"
  - "packages/core/src/collections/collectRelationshipFilterValues.ts"
  - "packages/core/src/collections/listRowCountCookie.test.ts"
  - "packages/core/src/collections/listRowCountCookie.ts"
  - "packages/core/src/fields/types.ts"
  - "packages/core/src/livePreview/panelCookie.ts"
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
  - "packages/core/src/collections/completeColumnOrder.test.ts"
  - "packages/core/src/collections/completeColumnOrder.ts"
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
  - "packages/core/src/collections/validateViewConfig.test.ts"
  - "packages/core/src/collections/validateViewConfig.ts"
  - "packages/core/src/collections/resolveColumnConfig.test.ts"
  - "packages/core/src/collections/resolveColumnConfig.ts"
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
  - "apps/test/src/app/(vexcms)/admin/layout.tsx"
  - "apps/www/convex/seed.ts"
  - "apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx"
  - "apps/www/src/app/(vexcms)/admin/layout.tsx"
  - "apps/www/src/vexcms/collections/pages.ts"
  - "packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/[[...path]]/page.tsx"
  - "packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx"
  - "packages/create-vexcms/templates/marketing-site/src/vexcms/collections/pages.ts"
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
  - "packages/react/src/adapter.ts"
  - "packages/react/src/adminCookie.test.ts"
  - "packages/react/src/adminCookie.ts"
  - "packages/react/src/admin/AdminLayout.tsx"
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
  - "packages/react/src/livePreview/useLivePreviewPanelState.ts"
  - "packages/react/src/collections/listView/useListPeekPrefetch.test.ts"
  - "packages/react/src/collections/listView/useListPeekPrefetch.ts"
  - "packages/react/src/collections/listView/useListViewPrefetch.test.ts"
  - "packages/react/src/collections/listView/useListViewPrefetch.ts"
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
  - "packages/react/src/fields/registry.ts"
  - "packages/react/src/fields/text/FilterInput.test.tsx"
  - "packages/react/src/fields/text/FilterInput.tsx"
  - "packages/react/src/fields/email/FilterInput.test.tsx"
  - "packages/react/src/fields/email/FilterInput.tsx"
  - "packages/react/src/fields/url/FilterInput.test.tsx"
  - "packages/react/src/fields/url/FilterInput.tsx"
  - "packages/react/src/fields/textarea/FilterInput.test.tsx"
  - "packages/react/src/fields/textarea/FilterInput.tsx"
  - "packages/react/src/fields/number/FilterInput.test.tsx"
  - "packages/react/src/fields/number/FilterInput.tsx"
  - "packages/react/src/fields/checkbox/FilterInput.test.tsx"
  - "packages/react/src/fields/checkbox/FilterInput.tsx"
  - "packages/react/src/fields/date/FilterInput.test.tsx"
  - "packages/react/src/fields/date/FilterInput.tsx"
  - "packages/react/src/fields/select/FilterInput.test.tsx"
  - "packages/react/src/fields/select/FilterInput.tsx"
  - "packages/react/src/fields/color/FilterInput.test.tsx"
  - "packages/react/src/fields/color/FilterInput.tsx"
  - "packages/react/src/fields/relationship/FilterInput.test.tsx"
  - "packages/react/src/fields/relationship/FilterInput.tsx"
  - "packages/react/src/fields/upload/FilterInput.test.tsx"
  - "packages/react/src/fields/upload/FilterInput.tsx"
  - "packages/react/src/ui/sidebar.tsx"
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
- [x] `.agent/docs/standards/naming-conventions.md` — `vex_` rule: every framework table and system field is `vex_`-prefixed, emitted unconditionally by `generateVexSchema`, never user-declarable; migration rule for renames
- [x] `updatedAt` behavior confirmed against `api/create/server.ts` / update path; confirmed accurate against `guides/caching-and-seo.mdx` (no dedicated collections docs page exists) + launch plan A item ticked
- [x] `.agent/docs/product/v0.1.0-launch-plan.md` — A's remainder checkbox ticked
- [x] `.agent/docs/standards/preferences.md` — new `P-029` entry for Decision 31

## Step 2 — Restructure `collections/` into closed feature subfolders [agent]
Why: Decision 21 (developer decision, 2026-10-27, post-review) places list-view code in `collections/listView/`, edit-view code in `collections/editView/`, and the create-document form/modal in `collections/listView/` beside the list that opens it, closing the subfolder set and dropping the redundant `Collection`/`CreateDocument` prefix inside each folder while the public root components keep their names. This step is pure mechanical restructuring so every later step can write directly into `listView/`. `CollectionDeleteAction.tsx`, `CollectionDuplicateMenuItem.tsx`, and `useDuplicateCollectionDocument.ts` are edit-view pieces (built-in `edit.actionsMenu`/`edit.header.actions` contributions, used only by `CollectionEditView`) and move into `collections/editView/` with their existing names — they are public API, re-exported from `collections/index.ts`, so the move skips the in-folder short-name convention and keeps exports unchanged. After this step `collections/` root holds only `index.ts` and the three subfolders (`listView/`, `editView/`, `api/`).
Verify: `harness struct` (regenerate `directory-structure.md` to reflect `collections/{listView,editView,api}`), then run the full `packages/react` typecheck and test suite (`pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`) — every moved test and every updated import site above must resolve and pass, with `grep -rn "collections/CollectionListView\"\|collections/CollectionEditView\"\|collections/CreateDocumentForm\"\|collections/CreateDocumentModal\"\|collections/CollectionDeleteAction\"\|collections/CollectionDuplicateMenuItem\"\|collections/useDuplicateCollectionDocument\"" packages apps` returning zero hits outside this spec file and changelog prose.
- [x] `packages/react/src/collections/listView/CollectionListView.tsx` (moved from `collections/CollectionListView.tsx`)
- [x] `packages/react/src/collections/listView/CollectionListView.test.tsx` (moved from `collections/CollectionListView.test.tsx`)
- [x] `packages/react/src/collections/editView/CollectionEditView.tsx` (moved from `collections/CollectionEditView.tsx`)
- [x] `packages/react/src/collections/editView/CollectionEditView.test.tsx` (moved from `collections/CollectionEditView.test.tsx`)
- [x] `packages/react/src/collections/editView/CollectionDeleteAction.tsx` (moved from `collections/CollectionDeleteAction.tsx`)
- [x] `packages/react/src/collections/editView/CollectionDuplicateMenuItem.tsx` (moved from `collections/CollectionDuplicateMenuItem.tsx`)
- [x] `packages/react/src/collections/editView/useDuplicateCollectionDocument.ts` (moved from `collections/useDuplicateCollectionDocument.ts`)
- [x] `packages/react/src/collections/listView/CreateDocumentForm.tsx` (moved from `collections/CreateDocumentForm.tsx`)
- [x] `packages/react/src/collections/listView/CreateDocumentForm.test.tsx` (moved from `collections/CreateDocumentForm.test.tsx`)
- [x] `packages/react/src/collections/listView/CreateDocumentModal.tsx` (moved from `collections/CreateDocumentModal.tsx`)
- [x] `packages/react/src/collections/listView/CreateDocumentModal.test.tsx` (moved from `collections/CreateDocumentModal.test.tsx`)
- [x] `packages/react/src/collections/index.ts`
- [x] `packages/react/src/fields/relationship/RelationshipPicker.tsx`
- [x] `packages/react/src/fields/relationship/RelationshipPicker.test.tsx`
- [x] `packages/react/src/testing/modalSuite.tsx`
- [x] `packages/react/src/documents/documentEditBuiltinContributions.ts` (reviewed — no import of the moved files, comment prose only; no change)
- [x] `.agent/docs/standards/naming-conventions.md` (`react-feature-folders` rule)
- [x] `.agent/docs/standards/anti-patterns.md` (AP-023 dated addendum)
- [x] `harness struct` (regenerate `directory-structure.md`)

## Step 3 — Status enum replaces string literals [agent]
Why: approval stages and branches will add states later; badges/filters must iterate `VERSION_STATUSES`, not switch on two literals.
Verify: pnpm typecheck && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test
- [x] `packages/react/src/versions/StatusBadge.tsx` — JSDoc `@example` reads `VERSION_STATUSES.draft.key`/`VERSION_STATUSES.published.key`, not raw literals (the component body already compares against `VERSION_STATUSES.draft.key`, no change needed there)
- [x] `packages/react/src/collections/editView/CollectionEditView.tsx` — `VexDocumentProvider`'s `status` field and the header `<StatusBadge>`'s `status` prop read `VERSION_STATUSES.draft.key`/`VERSION_STATUSES.published.key` instead of raw ternary literals
- [x] `packages/react/src/globals/GlobalEditView.tsx` — same sweep: `isDraftDoc`'s `vex_status` comparison (and its `VexVersionStatus` cast), `documentStatus`, `VexDocumentProvider`'s `status` field, and the header `<StatusBadge>`'s `status` prop
- [x] `packages/react/src/versions/VersionPublishAction.tsx` — `isDraftDoc`'s `document.status === "draft"` comparison
- [x] `packages/react/src/versions/VersionUnpublishAction.tsx` — `publishedTimeline`'s `row.status === "published"` filter
- [x] `packages/react/src/versions/VersionHistoryPanel.tsx` — `publishedVersion`'s `row.status === "published"` filter
- [x] `packages/react/src/versions/showsUnpublish.ts` — `document.status === "published"` comparison
- [x] `packages/react/src/testing/convex/schema.ts` — both `v.union(v.literal("draft"), v.literal("published"))` fields emit from `VERSION_STATUSES.draft.key` / `VERSION_STATUSES.published.key`
- [x] `packages/react/src/collections/listView/CollectionListView.tsx` — already reads `VERSION_STATUSES.draft.key` / `VERSION_STATUSES.published.key` (confirmed, no further edit; this is the Step 2 move target of today's `collections/CollectionListView.tsx`)
- [x] grep-proof: no raw `"draft"` / `"published"` status literals remain in `packages/react/src` non-test files (`*.test.ts(x)` keep literals asserting stored data; `packages/react/src/testing/**` test-harness suites — `viewSuite.ts`, `accessFixtures.ts`, `modalSuite.tsx` — keep their seeded literals, they assert stored data the same as a colocated test). `packages/core/src` is out of this step's scope: the parallel edit-view overhaul this sweep reconciles against touched no core files, and core's existing `"draft"`/`"published"` literals (e.g. `versions/assertUniqueAmongPublished.ts`) predate this spec.

## Step 4 — `admin.table` config surface + config-time validation [agent]
Why: every control ships with the key that drives it; bad `searchField` / unindexed sort must fail at `defineConfig`, naming the index to declare. Also carries Decision 35's `countLimit` (capped total count), which belongs on the same config surface.
Verify: `pnpm typecheck && pnpm --filter @vexcms/core test -- collections`
- [x] `packages/core/src/collections/types.ts` — `CollectionTableSort<TFieldSlug>`; `searchField?: readonly TFieldSlug[]`; `defaultSort` typed to field slugs + `_creationTime`; `defaultColumns?: TFieldSlug[]`; `countLimit?: number`; `AdminCollectionConfigInput`/`AdminCollectionConfig` thread `TFieldSlug` into `table`
- [x] `packages/core/src/fields/baseTypes.ts` — `admin.enableSorting?: boolean` / `admin.enableHiding?: boolean` on `FieldAdminConfigInput` and resolved `FieldAdminConfig`
- [x] `packages/core/src/collections/config.ts` — resolve defaults (no `searchField` → search hidden; `defaultColumns` → all non-hidden fields; `enableSorting`/`enableHiding` default `false`; `countLimit` default `1000`); wires `validateTableConfig`
- [x] `packages/core/src/collections/validateTableConfig.ts` (new) + `packages/core/src/collections/validateTableConfig.test.ts` (new) — throws `VexConfigError` when a `searchField` entry has no `searchIndex`, or `defaultSort.field` / an `enableSorting` field has no index leading with it (via `resolveCollectionIndexes`); message names field + index to declare
- [x] `packages/core/src/collections/validator.test.ts` — test confirming `.searchIndex()` is emitted for every field with its own `searchIndex`, independent of `useAsTitle`/incoming relationships
- [x] `packages/core/src/collections/config.test.ts` — type tests: `admin.table.searchField`, `defaultSort.field`, `defaultColumns` reject unknown field slugs; `countLimit` defaults to `1000`

## Step 5 — `VIEW_ACTIONS` access actions, `vex_views` table, and `composeViewWhere` [agent]
Why: shared views need a store and a gate; default denied (fail-closed). Decision 25 gives `find`/`search` a client-composed `where` instead of a server-side `view` argument: `find`/`search` take **no `view` argument** and know nothing about views. `collection.admin.table.views` (full, `where` intact) still ships to the browser like the rest of `VexClientConfig` (directly imported per P-004, so hiding `where` behind a client-facing type would change nothing: the string is already in the JS). `VexClientViewConfig` / `toClientViewConfig` is the one conversion point every UI READ goes through (stripping `where` for display, computing `hasHiddenFilter`/`hiddenFilterCount`), while `composeViewWhere` (new this step) is the one place a config view's raw `where` is read to BUILD the `where` the client actually sends — called client-side wherever the list composes its query (Step 8's `useVexListQuery`, fed by Step 12's `useListViews`), straight off the bundled config. Step 7's `listViews` query never touches a `config`-source view at all, returning `shared` views only. Step 4 also deferred validating `admin.table.views` entries against the rest of a collection's config (unknown `where` fields, an unindexed `sort`, an undeclared `searchField`, unknown `columns`) until `VexViewConfig` existed — this step closes that gap alongside the existing `searchField`/sort checks, with the same fail-at-`defineConfig` posture.
Verify: `pnpm --filter @vexcms/core test -- access schema collections`
- [x] `packages/core/src/access/constants.ts` — `VIEW_ACTIONS = { readViews, createView, updateView, deleteView }`; `readViews` added to `QUERY_ACTIONS`
- [x] `packages/core/src/access/types.ts` — `HasTable` guard; `ViewAction` wired into `SubjectMap`'s per-resource action union (collections only)
- [x] `packages/core/src/schema/generateVexSchema.ts` + `packages/core/src/schema/generateVexSchema.test.ts` — emit `vex_views` unconditionally, with an optional `description` column
- [x] `packages/core/src/collections/constants.ts` — `VEX_VIEW_SOURCES` map + derived `VexViewSource` union
- [x] `packages/core/src/collections/types.ts` — `VexViewState`, `VexViewConfig` (+ `description`), `VexStoredView`, `VexClientViewState`, `VexClientViewConfig`; completes `admin.table.views` Step 4 deferred
- [x] `packages/core/src/collections/toClientViewConfig.ts` (new) + `packages/core/src/collections/toClientViewConfig.test.ts` (new) — strips a config view's `where`, computing `hasHiddenFilter`/`hiddenFilterCount` (Decision 25)
- [x] `packages/core/src/collections/composeViewWhere.ts` (new) + `packages/core/src/collections/composeViewWhere.test.ts` (new) — `composeViewWhere({ viewWhere, filter })` → `{ and: [viewWhere, filter] }` or whichever is present (Decision 25); the client's one AND point for a config view's hidden filter, full code
- [x] `packages/core/src/collections/index.ts` — exports `toClientViewConfig` and `composeViewWhere` so Step 8/12 (`useVexListQuery`, `useListViews`) can call them client-side
- [x] `packages/core/src/collections/validateTableConfig.ts` + `packages/core/src/collections/validateTableConfig.test.ts` — config-time `viewId` uniqueness, PLUS per-view `where`-field, `sort`-index, `searchField`, and `columns` checks

## Step 6 — Index pushdown, the declared-filter field-read exemption, and the total-count cap in `find` / `search` [agent]
Why: `find`/`search` take **no `view` arg** (Decision 25) — the client composes one plain `where` itself (`composeViewWhere`, Step 5) and sends it like any other filter. `resolveQueryIndex` (`collections/resolveQueryIndex.ts`) resolves a portable `sort` to an index and rejects an unreadable `sort.field` with `VexAccessError` (Decision 26), while also pushing the caller's `where` equalities into that same index's range when a declared index can absorb them (Decision 36) — a selective filter on an indexed field stops scanning every matching row per page. `matchDeclaredViewFilter` (new) implements Decision 26's one field-read exception: when a top-level AND part of the caller's `where` deep-equals a config view's own declared `where`, that part is trusted and skipped by the field-read check — `find`/`search` only re-check the remaining parts. Finally, `find`/`search` stop `.collect()`-ing the whole matching set to count it (which fails outright above Convex's ~32k-document scan limit) and instead count at most `admin.table.countLimit + 1` rows, returning `totalDocs` plus `totalDocsCapped: boolean` (Decision 35).
Verify: `pnpm --filter @vexcms/core test -- collections`
- [x] `packages/core/src/collections/resolveQueryIndex.ts` (new) — resolves `sort` to an index AND pushes `where` equalities into that index's range (Decision 36)
- [x] `packages/core/src/collections/resolveQueryIndex.test.ts` (new) — exhaustive pushdown cases
- [x] `packages/core/src/collections/matchDeclaredViewFilter.ts` (new) — the declared-view-filter field-read exemption for BOTH config views (Decision 25) and shared `vex_views` rows (Decision 26's "Shared views" bullet): a pure matcher (`matchDeclaredViewFilter`) plus `loadSharedViewWheres`, which reads `vex_views` for the collection (indexed by collection, plus org when `orgCollectionSlug` is set), filtered by the caller's `readViews` rule, called by `find`/`search` only when the config-view match leaves an unreadable condition
- [x] `packages/core/src/collections/matchDeclaredViewFilter.test.ts` (new) — exhaustive declared-filter matching cases for both config and shared views, plus `loadSharedViewWheres`'s `readViews`-gated read
- [x] `packages/core/src/collections/types.ts` — adds `CollectionTableSort`, the portable sort shape `find`'s `sort` arg and `resolveQueryIndex` share
- [x] `packages/core/src/db/types.ts` — `PaginationResult.totalDocs` drops `| null`; adds `totalDocsCapped` (Decision 35)
- [x] `packages/core/src/collections/api/find/server.ts` — `sort` arg + index pushdown + declared-filter exemption + count cap; no `view` arg
- [x] `packages/core/src/collections/api/find/server.test.ts` — new `describe` blocks for all of the above
- [x] `packages/core/src/collections/api/search/server.ts` — sort-while-searching rejection, `searchField` allow-list + read-access validation, declared-filter exemption, count cap; no `view` arg
- [x] `packages/core/src/collections/api/search/server.test.ts` — new `describe` blocks for all of the above
- [x] `packages/core/src/collections/api/collectionsApi.ts` — threads `sort` through `find`'s Convex registration (`search`'s registration is unchanged — it never gains `sort`, which is what makes "sort rejected while searching" true at the public-API boundary)

## Step 7 — Views server API [agent]
Why: Shared views CRUD must enforce the four `VIEW_ACTIONS` (`readViews`/`createView`/`updateView`/`deleteView`) server-side, scope by org, store an optional `description` alongside each view (revised Decision 11), and — new per the architecture review's Decision 26 — `saveView` must reject a `where` that references a field the saving user can't read, so a shared filter can never encode a yes/no condition on data its author (or anyone else) is denied.
Verify: pnpm --filter @vexcms/core test -- collections/api
- [x] `packages/core/src/collections/api/listViews/server.ts` + `.test.ts` (new) — list for collection, scoped to `organizationId` resolved server-side from the caller's session; gated on `readViews` with `PERMISSION_SCOPES.any` — resolves to `[]` when denied (shared views are invisible, not an error — Decision 13)
- [x] `packages/core/src/collections/api/saveView/server.ts` + `.test.ts` (new) — create/patch, idempotent on `viewId` (promotion dedupe); an insert requires `createView`, a patch requires `updateView`; stores `description`; rejects a `view.state.where` referencing an unreadable field (Decision 26)
- [x] `packages/core/src/collections/api/removeView/server.ts` + `.test.ts` (new) — delete, requires `deleteView`
- [x] `packages/core/src/collections/api/types.ts` — shared arg/result types for the three operations
- [x] `packages/core/src/collections/api/collectionsApi.ts` — registers `listViews`/`saveView`/`removeView`
- [x] `packages/core/src/vexConvexApi.ts` — exports the three Convex function references
- [x] `packages/core/src/db/test/convex/schema.ts` — `vex_views` table added to `@vexcms/core`'s own hand-maintained test fixture schema (Decision 24), including `description`
- [x] `packages/react/src/collections/api/listViews/client.ts` + `packages/react/src/collections/api/saveView/client.ts` + `packages/react/src/collections/api/removeView/client.ts` (new) — tanstack-query wrappers
- [x] `packages/react/src/client/index.ts` — re-exports the three client ops + `VexStoredView`/`VexViewConfig` types

## Step 8 — Data-source hooks: `useVexListQuery` / `useVexDocQuery` [agent]
Why: the hook boundary is where plugin, adapter, and adopted-table sources plug in later (Design Decision 19); list/edit views stop calling `vexConvexApi` directly. The names gain the `Query` suffix to read as data fetching, distinct from the edit view's `useVexDocument()` context hook (`documents/VexDocumentContext.tsx`). Step 8 ships full code, not guided stubs (Decision 1), so `useVexListQuery`'s search-mode path is a real, cursor-paginated implementation here. There is **no `view` arg** anywhere in this file — `find`/`search` take none (Decision 25/26), and a caller who needs a config view's hidden filter composes it into `where` itself with `composeViewWhere` (Step 5) before calling either hook. `useVexListQuery` surfaces `totalDocsCapped` (Decision 35), threaded through from `usePaginatedQuery`, whose own reset/`enabled` plumbing this step still adds (the "resets to the first page" half of Decision 8 lives there so `useVexListQuery` inherits it for free on every prop that can change the result set). File homes follow Step 2's restructure: `CollectionListView` lives at `collections/listView/CollectionListView.tsx` and `CollectionEditView` at `collections/editView/CollectionEditView.tsx`; `MediaCollectionListView` is untouched by Step 2 and stays under `media/`.
Verify: `pnpm --filter @vexcms/react test -- hooks collections` && browser: list + edit views unchanged
- [x] `packages/react/src/hooks/useVexListQuery.ts` (new) + `packages/react/src/hooks/useVexListQuery.test.tsx` (new) — `{ collection, where, sort, search, searchField, drafts, pageSize }` → `{ results, totalDocs, totalDocsCapped, isDone, loadMore, isPending }`; `find`-mode wraps `usePaginatedQuery`, search-mode is a sibling cursor accumulator against `vexConvexApi.search`, both called unconditionally and toggled via `enabled`
- [x] `packages/react/src/hooks/useVexDocQuery.ts` (new) + `packages/react/src/hooks/useVexDocQuery.test.tsx` (new)
- [x] `packages/react/src/hooks/usePaginatedQuery.ts` — render-time query-identity reset (Decision 8) + an `enabled` prop so `useVexListQuery` can call it unconditionally, plus `totalDocsCapped` on the return value (Decision 35)
- [x] `packages/react/src/hooks/index.ts` — barrel exports the two new hooks
- [x] `packages/react/src/collections/api/find/client.ts` — `FindClientArgs`/`FindClientPaginatedArgs` gain `sort?: CollectionTableSort<string>`; no `view` field (Decision 25/26 — `find` takes none)
- [x] `packages/react/src/testing/convex/bridge.ts` + `packages/react/src/testing/hooksSuite.tsx` — test-harness support for the two new hooks, plus coverage for `usePaginatedQuery`'s reset behavior and `totalDocsCapped`
- [x] `packages/react/src/collections/listView/CollectionListView.tsx` (Step 2's new path), `packages/react/src/media/MediaCollectionListView.tsx`, `packages/react/src/collections/editView/CollectionEditView.tsx` (Step 2's new path) migrated; no direct `vexConvexApi` reads in those files (mutations stay, Design Decision 19's hook boundary is read-side)

## Step 9 — List slots + built-ins as `vex.*` contributions, `listView/` structure [agent]
Why: create, row/bulk delete, open, inspect, and copy-id become `list.*` contributions so custom row/bulk actions use the same extension path (plugin stem S1–S14, client-only S14). Revised after the architecture review: this step moves entirely into `collections/listView/` (Decision 21 — Step 2 already restructured the folder, this step only adds new content there), one built-in per file (Decision 37), a `CollectionListProvider`/`useCollectionList()` context so built-ins stop taking props drilled through the layout (Decision 37), and the slot outlet reuses the existing generic `SlotOutlet` (`slots/SlotOutlet.tsx`) rather than inventing a list-specific one — list slots are flat and additive with no override chains, the same shape `field.beforeInput`/`blocks.item.actions` already use, so `DocumentEditSlotOutlet`'s root/resource/override-chain machinery (built for `edit.*`'s override-wrapped built-ins, Decision 15/16) is not a fit here. `ListLayout.tsx` composes regions only (Decision 38) — it does not itself implement any built-in.
Verify: `pnpm --filter @vexcms/core test -- components` && `pnpm --filter @vexcms/react test -- collections/listView` && browser: list renders identically, row ⋯ menu shows Open/Inspect/Copy ID/Delete in order, selecting rows shows an inline (non-floating) bulk group in the toolbar
- [x] `packages/core/src/components/types.ts` — `SLOT_IDS.list`: `headerActions`, `toolbar`, `filters`, `beforeTable`, `afterTable`, `rowActions`, `bulkActions` (Decision 18, unchanged by the review)
- [x] `packages/core/src/components/builtinIds.ts` — `vex.list.create`, `vex.list.search`, `vex.list.filters`, `vex.list.columns`, `vex.list.views`, `vex.list.row.open`, `vex.list.row.inspect`, `vex.list.row.copyId`, `vex.list.row.delete`, `vex.list.bulk.delete`
- [x] `packages/core/src/collections/types.ts` — `AdminListComponentsInput`/`AdminListComponents`, `components` on `AdminCollectionConfigInput`/`AdminCollectionConfig`
- [x] `packages/react/src/collections/listView/CollectionListContext.tsx` (new) — `CollectionListProvider`/`useCollectionList()`, mirroring `documents/VexDocumentContext.tsx`
- [x] `packages/react/src/collections/listView/ListCreateAction.tsx` (new) — `vex.list.create`
- [x] `packages/react/src/collections/listView/ListRowOpenAction.tsx` (new) — `vex.list.row.open`
- [x] `packages/react/src/collections/listView/ListRowInspectAction.tsx` (new) — `vex.list.row.inspect`
- [x] `packages/react/src/collections/listView/ListRowCopyIdAction.tsx` (new) — `vex.list.row.copyId`
- [x] `packages/react/src/collections/listView/ListRowDeleteAction.tsx` (new) — `vex.list.row.delete`
- [x] `packages/react/src/collections/listView/ListBulkDeleteAction.tsx` (new) — `vex.list.bulk.delete`
- [x] `packages/react/src/collections/listView/listBuiltinContributions.ts` (new) — registry, like `documents/documentEditBuiltinContributions.ts`
- [x] `packages/react/src/collections/listView/ListLayout.tsx` (new) + `ListLayout.test.tsx` (new) — composes the seven `list.*` slots via `SlotOutlet`; row actions render as one ⋯ `DropdownMenu`; the bulk group renders inline in the toolbar area while a row is selected
- [x] `packages/react/src/ui/data-table/DataTable.tsx` — bulk-delete UI moves out; `onSelectionChange` callback replaces `onBulkDelete`/`enableBulkActions`
- [x] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — drops the floating/fixed positioning; renders inline wherever its caller places it
- [x] `packages/react/src/collections/listView/CollectionListView.tsx` — wraps its output in `CollectionListProvider`, delegates rendering to `ListLayout`; existing delete UI moved into built-in contributions; `RevalidateButton` stays outside it (Decision 23); passes a placeholder `onInspect` for Step 13's peek

## Step 10 — Toolbar controls, the shared URL codec, and the fixed-height data table [agent]
Why: search, sort, filters, and columns meet the core navigability acceptance; `DataTable`'s fixed-height body (Decision 22) and `ScrollSection` (Decision 31) are the standing scroll-container rule for the rest of the admin panel; Decision 35's count cap needs a visible "1,000+" in the same footer. Per the zero-layout-shift pass (Decisions 39–43, `standards/frontend/layout-stability.md`):
Verify: `pnpm --filter @vexcms/core test -- collections/listUrlParams collections/listPreferenceCookies && pnpm --filter @vexcms/react test -- collections/listView ui/data-table ui/ScrollSection` && browser: search, field switch, sort, column hide, density toggle (confirm the vex-list-density cookie is written, then reload — the row height matches on the very first paint, no flash), resize the list pane across the @lg/list/@xl/list/@2xl/list breakpoints and confirm Copy link / the Columns label / Rows per load fold into ⋯ in that order with no measurement-driven flash, empty/error states, "Showing 25 of 1,000+" on a capped collection, reload keeps URL state
- [x] `packages/core/src/collections/listUrlParams.ts` (new) + test — `parseListParams`/`serializeListParams`, the compact `q`/`qf`/`sort`/`filter`/`size`/`view`/`peek` grammar (Decision 9), exhaustive round-trip tests; pure, no react import, exported from `@vexcms/core` (Decision 40)
- [x] `packages/core/src/collections/index.ts` — 1 edit, barrel-exports the two files above
- [x] `packages/core/src/collections/listPreferenceCookies.ts` (new) + test — `ListDensity`, `ListPreferences`, `LIST_PREFERENCE_COOKIES`, `parseListPreferences({ cookies })` (Decision 42) — the server-readable half of the density cookie
- [x] `packages/core/src/framework.ts` — 1 edit, `CollectionListViewProps` gains `initialPreferences?: ListPreferences`
- [x] `packages/react/src/collections/listView/useListUrlState.ts` (new) + test — wraps the core codec in `nuqs`; returns `{ q, qf, sort, filter, size, view, peek, setQ, setQf, setSort, setFilter, setSize, setView, setPeek }`; `replace` while typing, `push` on discrete actions
- [x] `packages/react/src/collections/listView/listPreferenceCookies.ts` (new) + test — `writeListDensityCookie`, the client-side cookie writer
- [x] `packages/react/src/collections/listView/ListSearch.tsx` (new) + test — debounced `q` input + `qf` field picker (250ms, Enter commits+pushes, Esc clears/blurs), read-access-gated field list
- [x] `packages/react/src/ui/data-table/DataTableSortHeader.tsx` (new) + test — sortable headers; parked-sort disabled state with "Sorted by relevance"
- [x] `packages/react/src/ui/ScrollSection.tsx` (new) + test — `ScrollArea` wrapper with `title`/`count`/`collapsible`/`persistKey` (Decision 31)
- [x] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` (new) + test — hideable columns (via `ScrollSection`) + a fully controlled Density toggle (`density`/`onDensityChange`, Decision 29/42 — no internal `useLocalStorage`); the "Columns" label collapses itself through a CSS class on `@container/list`, not a caller-supplied `collapsed` boolean (Decision 43)
- [x] `packages/react/src/ui/data-table/DataTablePageSizeSelect.tsx` (new) + test — "Rows per load" select, rendered twice (CSS-toggled) by `ListToolbar`'s collapsible group
- [x] `packages/react/src/collections/listView/ListEmptyState.tsx` (new) + test — empty collection / no search results / no filter results (DESIGN-NOTES.md §5 copy)
- [x] `packages/react/src/collections/listView/ListQueryError.tsx` (new) + test — generic "Couldn't load {plural}" + the `UNINDEXED_SORT` variant
- [x] `packages/react/src/collections/listView/ListCopyLinkButton.tsx` (new) + test — copies the current URL; `buildHref` overridable (Step 12 serializes full state for a local view); no `collapsed` prop — `ListToolbar` renders two CSS-toggled copies instead
- [x] `packages/react/src/collections/listView/ListSearchAction.tsx` (new) + test — the `vex.list.search` built-in, wrapping `ListSearch` with `collection`/`urlState` from `useCollectionList()`
- [x] `packages/react/src/collections/listView/ListColumnsAction.tsx` (new) + test — the `vex.list.columns` built-in, wrapping `DataTableColumnsMenu` with `hideableColumns`/`visibleColumns`/`onVisibleColumnsChange`/`hasActiveView`/`density`/`onDensityChange` from `useCollectionList()` — no `collapsed` prop
- [x] `packages/react/src/collections/listView/listBuiltinContributions.ts` — adds `listToolbarContributions()` (`vex.list.search`, `vex.list.columns`), consumed by `ListToolbar.tsx` below
- [x] `packages/react/src/collections/listView/ListToolbar.tsx` (new) + test — hosts `list.toolbar` (`vex.list.search`/`vex.list.columns` resolve through `listToolbarContributions()`, this step), the bulk group, and a pure-CSS `@container/list` collapse for Copy link / Rows-per-load (Decision 43)
- [x] `packages/react/src/fields/index.tsx` — `getCollectionColumnDefs` sets every column's `enableSorting`/`enableHiding` from `fieldDef.admin.enableSorting`/`enableHiding` (Step 4) in ONE central pass
- [x] `packages/react/src/ui/data-table/DataTable.tsx` — fixed-height `ScrollArea` body with a sticky header and a pinned footer showing the capped count (Decision 35); controlled `sort`/`onSortChange`/`sortDisabled`/`visibleColumns`/`density`; `emptyState`/`queryError` slots; `density`'s type is now core's `ListDensity`
- [x] `packages/react/src/collections/listView/CollectionListContext.tsx` — extends Step 9's base shape: `urlState`, `selection`, `visibleColumns`/`onVisibleColumnsChange`/`hideableColumns`, `hasActiveView` (Decision 37), plus this step's `onDensityChange` and the now-`ListDensity`-typed `density`
- [x] `packages/react/src/collections/listView/ListLayout.tsx` — 2 edits: the `@container/list` root (Decision 22/43), and the new query-result props `CollectionListView` now computes
- [x] `packages/react/src/collections/listView/CollectionListView.tsx` — calls `useListUrlState` (now backed by the core codec) and feeds `q`/`qf`/`sort`/`filter`/`size` into `useVexListQuery`; density is `useState` seeded from `props.initialPreferences?.density` and written to the `vex-list-density` cookie on change, never read from `useLocalStorage`; accepts the new `initialPreferences` prop
- [x] `packages/react/src/collections/listView/index.ts` + `packages/react/src/ui/data-table/index.ts` + `packages/react/src/ui/index.ts` — barrel exports for the new files (includes `listPreferenceCookies`)

## Step 11 — Filter builder (AND rows + one level of OR groups) [agent]
Why: authors `where` for the URL and views; DNF covers multi-value, empty-value, and triage use cases without a tree editor (Decision 10). Files live in `collections/listView/` per the developer's folder-placement decision (Decision 21) and the closed-subfolder AP-023 fix, dropping the redundant `Collection` prefix. The builder stays presentational — this step's `vex.list.filters` built-in (`listView/ListFiltersAction.tsx`) reads `collection`/`where`/`setFilter` from `useCollectionList()` (Decision 37) and passes them down as props, rather than this component reading context itself. `where` here is always the user's OWN filter, never a config view's hidden filter (Decision 25). Per Decisions 39–43, filter-chip visibility is cookie-backed rather than `useLocalStorage` (Decision 42 puts it in `vex-list-chips:<collection>`, read on the server exactly like `readLivePreviewPanelCookie`) via the shared `listPreferenceCookies.ts` helper Step 10 introduces for density. `ListFilterChips` and `ListHiddenFilterBadge` are seeded from `initialVisible`/the view's config so the server render matches.
Verify: `pnpm --filter @vexcms/core test -- collections/listPreferenceCookies && pnpm --filter @vexcms/react test -- collections/listView/whereDnf collections/listView/ListFilterBuilder collections/listView/ListFilterChips` && browser: hard reload with chips cookie hidden shows no chip row on first paint; OR group round-trips through URL reload; isEmpty/isNotEmpty row applies and chips show "∅ isEmpty"/"!∅ isNotEmpty" (Revised 2026-10-27, developer); vex_status filters on a versioned collection; an unreadable field never appears in the field picker
- [x] `packages/react/src/collections/listView/whereDnf.ts` (new) + test — `toDnf(where) | null`, `fromDnf(groups)`, `ListFilterOp`, `listFilterOpOf`/`applyListFilterOp` for the `isEmpty`/`isNotEmpty` editor operators
- [x] `packages/react/src/collections/listView/ListFilterBuilder.tsx` (new) — groups (OR) of rows (AND); operators by field type incl. `isEmpty`/`isNotEmpty` on every type; built-in `vex_status` field on versioned collections; unreadable fields excluded (`useFieldPermissions`); live apply with muted incomplete rows; text `eq` hint; non-DNF `where` shown read-only
- [x] `packages/react/src/collections/listView/ListFiltersAction.tsx` (new) + test — the `vex.list.filters` built-in, wrapping `ListFilterBuilder`'s trigger/popover with `collection`/`where`/`setFilter` from `useCollectionList()`
- [x] `packages/react/src/collections/listView/listBuiltinContributions.ts` — adds `listFiltersContributions()` (`vex.list.filters`)
- [x] `packages/react/src/collections/listView/ListLayout.tsx` — the `list.filters` `SlotOutlet`'s `builtins` prop changes from `[]` (Step 9's placeholder) to `listFiltersContributions()`
- [x] `packages/core/src/collections/listPreferenceCookies.ts` (existing, Step 10) — add the `chipsVisible` cookie entry, `listChipsVisibleCookieName`, and the `chipsVisible` field on `parseListPreferences`'s result
- [x] `packages/react/src/collections/listView/listPreferenceCookies.ts` (existing, Step 10) — add `writeListChipsVisibleCookie`
- [x] `packages/react/src/collections/listView/ListFilterChips.tsx` (new) + test — active-filter chips (clear one / clear all), per-browser visibility toggle, cookie-backed (Decision 42) and seeded from `initialVisible` so the server render matches
- [x] `packages/react/src/collections/listView/ListLayout.tsx` — renders `ListFilterChips` in the fixed-height chip row below the toolbar, below the `list.filters` outlet (Decision 22), forwarding `initialPreferences.chipsVisible`; composition-only edit (Decision 38)

## Step 12 — Saved views: tabs, modified state, hidden filters, server prerender [agent]
Why: saved views live in `collections/listView/` (Decision 21) as `ListViewTabs` / `ListSaveViewDialog` / `ListHiddenFilterBadge` / `listViewStore` / `useListViews`. `useListViews` exposes `composeQueryWhere` — the one place a config view's hidden filter (never read by any other UI surface) folds back in with the caller's own filter via the core `composeViewWhere` helper (Step 5), since `find`/`search` take no `view` argument. Tabs sit above the table (Decision 11), with a modified-state diff with Save/Reset, a hidden-filter lock badge, and a `description` field. Wired to Step 10's flat `useListUrlState` setters and Step 5's nested-`state`, client-safe view types.
Verify: `pnpm --filter @vexcms/core test -- listViewsCookie && pnpm --filter @vexcms/react test -- collections` && browser: tab between All/config/shared/local views, modify a shared view and Save changes, Save as new on a config view (confirm the saved view's `where` is only the user's own filter, not a config view's hidden condition), rename and delete a local view, promote a local view to shared with the confirm dialog, hidden-filter lock badge popover on a config view with a server-resolved where, unknown view id shows the fallback notice, Copy link on a local view serializes full state, hard-reload a URL with `view=local:<id>` and confirm the local view's tab and name render immediately (no post-hydration flash) from the cookie index, resize the list panel across `@container/list` breakpoints and confirm the tab count changes without any visible reflow jump
- [x] `packages/core/src/collections/listViewsCookie.ts` (new) + test — `listViewsCookieName`, `parseListViewsIndexCookie` (core, shared with Step 14's server read)
- [x] `packages/react/src/collections/listView/listViewStore.ts` (new) + test — `localViewsStorageKey`, `useLocalViews`; writes the `vex-list-views:<collection>` cookie index alongside every localStorage mutation; prunes stale cookie entries after hydration
- [x] `packages/react/src/collections/listView/useListViews.ts` (new) + test — merges `config`/`shared`/`local` views by `viewId`; accepts `initialViews`/`initialLocalIndex`, seeding the shared-views query and the first local-index render from them; exposes `composeQueryWhere`
- [x] `packages/react/src/collections/listView/ListViewTabs.tsx` (new) + test — tabs above the table; a fixed, CSS-driven visible-tab count per `@container/list` breakpoint; accepts `initialLocalIndex` so the first local-view tabs render without a `localStorage` read
- [x] `packages/react/src/collections/listView/ListSaveViewDialog.tsx` (new) + test — save new / rename, shared-vs-local scope gated by `createView`/`updateView`
- [x] `packages/react/src/collections/listView/ListHiddenFilterBadge.tsx` (new) + test — lock badge + count, never a chip or builder row
- [x] `packages/react/src/collections/index.ts` (edit) — barrel export for the three new components
- [x] `packages/react/src/collections/listView/ListLayout.tsx` (Step 9's file) — mounts `ListViewTabs` above the toolbar, forwarding `initialViews`/`initialLocalIndex` from `CollectionListView`'s props
- [x] `packages/react/src/collections/listView/ListToolbar.tsx` (Step 10's file) — mounts `ListHiddenFilterBadge` beside the filter chips

## Step 13 — Inspect peek, responsive per Decision 27 [agent]
Why: Design Decision 27 needs the panel and the prefetch strategy that makes it open instantly. The architecture review's responsive pass (Decision 43) replaces the `ResizeObserver`-measured inline/right-panel switch with a fixed `@5xl/list` container-query breakpoint, so the server's first paint is already the settled layout (Decision 39, `layout-stability.md`) — resizing across the breakpoint needs no React re-render at all. The real `Sheet` component (Radix-style `Portal` + viewport-`fixed` positioning) can't be the thing a *named* container query toggles: a portaled node sits outside `@container/list`'s DOM subtree, so no `@5xl/list:` variant on it would ever match. A `peek=<id>` URL can be open on first paint (Decision 39/41's server prefetch), so — unlike `DataTableResponsiveMenu`'s overlay-vs-popover choice, which starts closed — the bottom-`Sheet`-vs-panel choice can never be a `useIsMobile()` JS branch either: both layouts mount unconditionally, and a `md:hidden`/`hidden md:flex` viewport-class pair (not `@container/list`, since 768px is a device property per Decision 22 point 3) decides which one is visible, exactly mirroring `ListViewTabs`' CSS-only mobile collapse (Step 16). The `@5xl/list`-and-narrower panel is one plain, always-mounted `div`, descendant of the same `@container/list` root `CollectionListView` already establishes (Decision 22), styled `fixed` (viewport-docked, right-aligned, bordered, shadowed — visually the same right-panel Decision 27 describes) by default and switched to a `static` flex sibling by its own `@5xl/list:` variant classes. It was never a Radix dialog, so "non-modal" (Decision 27: "the list behind it stays interactive") is true unconditionally, in both breakpoints, with no `modal={false}` prop to reason about. Decision 39/41's prerender also needs a document to seed from when `peek=` names a row outside the loaded page: `ListPeek` gains an `initialDoc` prop, which `NextAdminPage` (Step 14) fills from its own `get(peek)` prefetch. Decision 21 keeps the files in `collections/listView/` with the redundant `Collection` prefix dropped (`ListPeek`, `useListPeekPrefetch`), and Decision 38 keeps no separate file for the (now much smaller) layout logic — it's a few Tailwind classes, not a hook.
Verify: `pnpm --filter @vexcms/react test -- collections/listView/ListPeek collections/listView/useListPeekPrefetch collections/listView/CollectionListView ui/data-table/DataTable`
- [x] `packages/react/src/collections/listView/ListPeek.tsx` (new) + `packages/react/src/collections/listView/ListPeek.test.tsx` (new) — non-modal panel, two layouts (inline / right-docked) chosen by a `@5xl/list` container-query variant on one always-mounted `div`, a third (bottom `Sheet`) toggled by a `md:hidden`/`hidden md:flex` CSS viewport-class pair (never `useIsMobile()` — a `peek=` deep link can be open on first paint), Fields/JSON tabs, seeded from `useVexDocQuery`'s `initialData` via either a loaded row or the server-prefetched `initialDoc`
- [x] `packages/react/src/collections/listView/useListPeekPrefetch.ts` (new) + `packages/react/src/collections/listView/useListPeekPrefetch.test.ts` (new) — hover(150ms)/focus/neighbour-row prefetch via `queryClient.prefetchQuery(convexQuery(...))`
- [x] `packages/react/src/collections/listView/index.ts` — barrel exports both new modules
- [x] `packages/react/src/ui/data-table/DataTable.tsx` — adds a generic `getRowProps` per-row event hook (builds on Step 10's edit)
- [x] `packages/react/src/collections/listView/ListLayout.tsx` — adds `onRowHoverStart`/`onRowHoverEnd`/`onRowFocus` props, forwarded to `DataTable`'s `getRowProps` (builds on Step 9/10's edits; `ListLayout` composes regions only, per Decision 38 — this edit adds no new region, only forwards three props through the existing `<DataTable>` call)
- [x] `packages/react/src/collections/listView/CollectionListView.tsx` — gains an `initialPeekDoc` prop (Decision 39/41), mounts `ListPeek` as `ListLayout`'s sibling inside the component's existing `@container/list` root, wires `useListPeekPrefetch` into `ListLayout`'s row-hover/focus props — no container ref, since the breakpoint is CSS, not measurement

## Step 14 — Server prerender [agent]
Why: Decisions 39–43 require the list to prerender exactly what the client shows, with zero layout shift (`.agent/docs/standards/frontend/layout-stability.md`: "prefetch what decides layout" — the server's query args must equal the client's, or hydrated `initialData` seeds the wrong query key and the list repaints after hydration). This step does three things. First, it extracts the Convex-args-building logic `useVexListQuery` (Step 8) already has into one pure core helper, `buildListQueryArgs.ts`, so the server can call the exact same code instead of a hand-copied second implementation that could drift. Second, because a shareable link to an *unmodified* shared or config view can legally omit every param that matches the view's own saved state (Decision 9 — "only params that differ from the saved view appear"), resolving "the client's args" for such a link requires merging the URL with the active view's own saved state, not just reading the URL at face value; `resolveListQueryState.ts` is that one merge, also pure and core, so a bare `?view=shared:<id>` link renders the same rows whether the browser or `NextAdminPage` resolves it. A **local** view never needs this merge — Decision 41 already requires its full state in the URL — so `resolveListQueryState` only consults a `configView`/ `sharedView` when the caller found one. Third, it wires `NextAdminPage` itself: `searchParams`, the preference and local-view-index cookies (mirroring `readLivePreviewPanelCookie`, `packages/core/src/livePreview/panelCookie.ts`), the `listViews` prefetch, and the `findPaginated`/`search`/`get` prefetches built from the two helpers above.
Verify: `pnpm --filter @vexcms/core test -- collections && pnpm --filter @vexcms/react test -- hooks && pnpm --filter @vexcms/next test` && browser: hard-reload a default list, a `q` link, a `sort` link, a `filter` link, a shared-view link, a config-view link with its hidden filter, a local-view link, a `size` link, and a `peek` link — zero visible layout shift on each
- [x] `packages/core/src/collections/buildListQueryArgs.ts` (new) + test — `buildListFindQueryArgs`/`buildListSearchQueryArgs`, the ONE place the `findPaginated`/`search` Convex args get built, shared by `useVexListQuery` (client) and `NextAdminPage` (server)
- [x] `packages/core/src/collections/resolveListQueryState.ts` (new) + test — merges the parsed URL with the active view's own saved state and the collection's `admin.table` defaults into one effective `where`/`sort`/`search`/`searchField`/`pageSize`
- [x] `packages/core/src/collections/listViewsCookie.ts` (new) + test — `localListViewsCookieName`/`readLocalListViewsCookie`, the server-readable half of the `vex-list-views:<collection>` cookie (Decision 41); Step 12's `listViewStore.ts` is the client writer, mirroring `livePreview/panelCookie.ts`'s core-name/client-writer split
- [x] `packages/core/src/collections/index.ts` — barrel-exports the three new modules
- [x] `packages/core/src/framework.ts` — `CollectionListViewProps` gains `initialPeekDoc`
- [x] `packages/react/src/hooks/useVexListQuery.ts` — both branches call the new `buildList*QueryArgs` instead of building their own args inline; the search branch also gains `initialData` support (a search-active first load had no SSR path at all until now, which would itself be a layout shift the moment `q` is in the URL)
- [x] `packages/react/src/hooks/useVexListQuery.serverParity.test.tsx` (new) — proves `useVexListQuery`'s Convex args equal `buildListFindQueryArgs`/`buildListSearchQueryArgs`'s own output for the same props
- [x] `packages/next/src/NextAdminPage.tsx` — `searchParams` prop; the collection list branch prefetches `listViews` (server-side, so it resolves `[]` for a caller without `readViews`, per Step 7's gate), resolves the active view, prefetches `findPaginated`/`search` via the shared builders, prefetches `get(peek)`, and passes `initialData`/`initialViews`/`initialLocalIndex`/`initialPreferences`/`initialPeekDoc` to `CollectionListView`
- [x] `packages/next/src/NextAdminPage.test.ts` — new prefetch-args cases: a default list, `q`, `sort`, `filter`, a shared view, a config view with a hidden filter, a local view, `size`, and `peek`
- [x] `apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx`, `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx`, `packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/[[...path]]/page.tsx` — forward `searchParams` to `NextAdminPage`
- [x] `apps/test/convex/seed.ts`, `apps/www/convex/seed.ts` — the embedded "one route in your app" code example forwards `searchParams` too, so it stays copy-pasteable

## Step 15 — Keyboard shortcuts [agent]
Why: Decision 30 pins the shortcut set to six core keys, handled by one internal hook built on `useEventListener` from `@ts-hooks-kit/core` — no new dependency, no command palette, no rebinding (Out of Scope). Per Decision 21, the hook lives in `collections/listView/` (the closed feature-subfolder set), named `useListShortcuts` with the `Collection`/`List` folder-scope prefix dropped, following the `listView/useListUrlState.ts` precedent from Step 10. Nothing here depends on the server-prerender, URL-codec, cookie, or CSS-collapse decisions (39–43): the hook only binds `window` keydown listeners and calls caller-supplied callbacks.
Verify: `pnpm --filter @vexcms/react test useListShortcuts`
- [x] `packages/react/src/collections/listView/useListShortcuts.ts`
- [x] `packages/react/src/collections/listView/useListShortcuts.test.ts`
- [x] `packages/react/src/collections/index.ts`

## Step 16 — Responsive pass at every width [agent]
Why: Decision 22 is **container, not viewport**: the list root is a size container (`@container/list`, like the edit view's `@3xl/form`), and layout switches key off the list's own width via container-query variants, not `md:`/`lg:` viewport breakpoints. `useIsMobile` is reserved for one thing only (Decision 22 point 3 / Decision 43): deciding whether a menu/sheet/tab-switcher renders as an inline overlay or a bottom `Sheet`. Decision 43 (`layout-stability.md`) rules out a measured ⋯ overflow collapse — a JS-measured collapse only settles after hydration and reflows the toolbar on first paint. This step is a CSS-only collapse instead: every collapsible toolbar control renders twice — once in its inline slot, once inside the ⋯ menu — and a fixed `@container/list` breakpoint pair (`hidden <bp>:flex` / `<bp>:hidden`) decides which copy is visible, so the server's render is already the final render (Decision 43, `layout-stability.md` "Responsive variants render correctly first"). The fixed order (Copy link, then Columns, then rows per load; Search and Filter never collapse) is three breakpoint tiers. `ListToolbar`'s ⋯ trigger gets a `DataTableResponsiveMenu` container so its menu opens as a `Popover` or bottom `Sheet` on `useIsMobile`'s split (a device property, not a container-width one, and therefore untouched by Decision 43), not the toolbar's own layout width — `DataTableResponsiveMenu` itself picks `Popover` vs. bottom `Sheet` purely off `useIsMobile`, an interaction-time choice that never shifts first paint.
Verify: browser at 375 / 390 / 768 / 1024 / 1440 on `apps/test`, plus a narrow split-pane
- [x] `packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx` (new) + test — one trigger/content pair: `Popover` at `useIsMobile() === false`, bottom `Sheet` at `useIsMobile() === true` (768px, viewport — Decision 22 point 3 / Decision 43)
- [x] `packages/react/src/ui/data-table/index.ts` — barrel export for `DataTableResponsiveMenu`
- [x] `packages/react/src/ui/data-table/DataTable.tsx` — sticky first column while the table scrolls horizontally (unconditional, not breakpoint-gated)
- [x] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — container-query sizing (`@container/list`, not `md:`): full-width, larger touch targets, icon-only secondary actions below `@lg/list` (position stays Step 10's — inline in the toolbar, left of Filter)
- [x] `packages/react/src/collections/listView/ListToolbar.tsx` — CSS-only ⋯ overflow at fixed `@container/list` breakpoints (Decision 43), wrapped in a `DataTableResponsiveMenu` container for the `Popover`/`Sheet` choice; the bulk group (when a selection is active) replaces the Filter trigger below `@lg/list` via container-query classes, not `useIsMobile`
- [x] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` + `packages/react/src/collections/listView/ListFilterBuilder.tsx` — each swaps its trigger/content container for `DataTableResponsiveMenu`
- [x] `packages/react/src/collections/listView/ListViewTabs.tsx` — the fixed visible-tab count per `@container/list` width is Step 12's; this step only collapses the tab row into one full-width view button that opens a `DataTableResponsiveMenu` sheet below `useIsMobile`'s 768px split
- [x] `.agent/docs/product/v0.1.0-launch-plan.md` — J section notes list view owned by I, resolves both stale "known suspects" bullets

## Step 17 — Server auth for `NextAdminPage` [agent] — DONE
Why: Decision 44 (revised 2026-10-28 ×2 — `auth` made OPTIONAL). `page.tsx` already fetches `{ user, organization }` via `getUserOrg` for the `canAccessAdminPanel` gate and discards it; `layout.tsx` (sidebar) separately fetched a narrower, `organization`-less value. `getUserOrg` becomes the ONE auth source for the whole admin shell; `NextAdminPage` threads it server-side to close Step 14's documented `searchField`-readability gap too. `auth` itself is OPTIONAL: absent/disabled `access` needs none (allow-all, unchanged); access ENABLED with no `auth` fails CLOSED to anonymous, once, with a dev-only warning.
Verify: `pnpm --filter @vexcms/next test && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test && pnpm typecheck` — all green (core 135f/1837t, react 187f/2187t, next 7f/77t, typecheck 16/16) && browser (apps/test, real admin session, real dev Convex backend) — confirmed for the allow-all path: search works identically in SSR HTML and post-hydration, one WS `vex:find` + one `vex:search` subscription matching the server prefetch exactly, no error, no flash. The denied/restricted-role browser pass was NOT done live — no safe way to sign in as or script a non-admin role without stranding the only available admin test account (`guest`'s own permissions deny all `users` access, so reverting via the admin UI would be impossible) — covered instead by `NextAdminPage.test.ts`'s new 6-case "server auth" describe block plus existing client-side RBAC test coverage; recommended as a manual follow-up with a real non-admin credential.
- [x] `packages/next/src/NextAdminPage.tsx` — `props.auth?: VexApiAuth` (OPTIONAL — binding revision); `warnIfAuthMissing()` logs once, dev-only, when access is enabled and `auth` is omitted; wraps the whole return in `@vexcms/react`'s `VexAuthProvider`; narrows via `resolveFieldPermissions` + `resolveSearchField`, fed `resolved.searchField` (not raw `qf` — matches the already-landed client-side Step 14 sort-parity call) before the `search` prefetch; `isSearchActive` now checks readability on both sides, so a fully-unreadable role falls back to `findPaginated` server-side too
- [x] **Deviation, found live**: `resolveSearchField`/`readableSearchFields` moved from `@vexcms/react` to `@vexcms/core/collections` — bundled next to a real client component, the whole chunk inherited `"use client"`, crashing `NextAdminPage` against the real dev server (vitest has no RSC boundary enforcement, so this surfaced only in live browser testing). `CollectionListView.tsx`/`ListSearch.tsx` now import both from `@vexcms/core`.
- [x] `packages/next/src/NextAdminPage.test.ts` — `render()` gains an OPTIONAL `{ auth?, config? }` options arg; mock of `@vexcms/react` keeps the real `VexAuthProvider` via `importOriginal`; new "server auth" describe block (6 cases: absent, enabled+no-auth warns-once, disabled-despite-denying-config, allowed, denied, every branch wraps)
- [x] `apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx`, `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx`, `packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/[[...path]]/page.tsx` — pass `auth={auth}` to `<NextAdminPage>` instead of discarding it
- [x] `apps/test/src/app/(vexcms)/admin/layout.tsx`, `apps/www/src/app/(vexcms)/admin/layout.tsx`, `packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx`, `packages/create-vexcms/templates/marketing-site/src/app/(vexcms)/admin/layout.tsx` (not in the original list — `marketing-site` ships its own overlay with the same `getCurrentUser()` call, found while implementing) — swap `getCurrentUser()` for the same `fetchAuthQuery(api.auth.api.getUserOrg, {})` `page.tsx` already calls; pass `user={auth.user ?? undefined}` AND `organization={auth.organization}` to `<NextAdminLayout>` (already forwards both, no `@vexcms/next`/`@vexcms/react` edit needed). No no-auth create-vexcms template variant exists to handle separately.
- [x] `apps/test/convex/seed.ts`, `apps/www/convex/seed.ts` — the embedded route example now fetches and forwards `auth` too, noted as optional

## Step 18 — `admin.view` + `admin.views` [agent]
Why: Decision 45 (REDESIGNED 2026-10-28 — supersedes this step's own original `admin.table.defaultView` shape; Step4TableConfig's in-flight code moves to the new location, not a rename in place). `admin.view` (always-present default view) and `admin.views` (preset, moved from `admin.table.views`) are siblings at the `admin` level, not nested under `admin.table`. `admin.table` keeps only `serverPageSize`/`pageSizeOptions`/`bulkActions`/`countLimit`/`searchField`.
Verify: `pnpm typecheck && pnpm --filter @vexcms/core test -- collections && pnpm --filter @vexcms/react test -- collections/listView && pnpm --filter @vexcms/next test` && browser: `admin.view.sort = { field: "updatedAt", order: "desc" }` sorts the default view that way on first paint; a preset still resolves from `admin.views`; `rg "admin\.table\.views|admin\.table\.defaultView|defaultSort|defaultColumns" packages apps` (outside test fixtures for the removed shape and spec prose) returns zero hits
- [x] `packages/core/src/collections/types.ts` — `AdminCollectionConfigInput`/`AdminCollectionConfig` gain `view?`/`views?` (resolved: `view: VexViewConfig`, fixed `viewId: "default"`, always present; `views: VexViewConfig[]`) as siblings of `table`; `CollectionTableConfigInput`/`CollectionTableConfig` drop `defaultSort`/`defaultColumns`/`views`/`defaultView` entirely
- [x] `packages/core/src/collections/config.ts` + `config.test.ts` — `admin.view` resolution (sort → `_creationTime desc`, columns → non-hidden fields, pageSize → `10`, searchField → `searchField?.[0]`); `admin.views` resolution (moved from the old `admin.table.views` resolution, same logic)
- [x] `packages/core/src/collections/validateTableConfig.ts` + `.test.ts` — every check against `admin.table.views`/`defaultSort.field` now runs against `[collection.admin.view, ...collection.admin.views]`; `admin.views` entries reject `viewId: "default"` (reserved)
- [x] `packages/core/src/collections/matchDeclaredViewFilter.ts` + `.test.ts` — candidate list widens to `[collection.admin.view, ...collection.admin.views]`
- [x] `packages/core/src/collections/listUrlParams.ts` + `.test.ts`, `resolveListQueryState.ts` + `.test.ts` — every `admin.table.defaultPageSize`/`defaultSort`/`defaultColumns`/`.views` read moves to `admin.view.*`/`admin.views`; a `default`-source `params.view` (no `view=`) resolves `configView = collection.admin.view`
- [x] `packages/react/src/collections/listView/CollectionListView.tsx`, `ListLayout.tsx`, `ListToolbar.tsx`, `useListViews.ts` + `.test.ts` — same migration; the merged views list gains the always-present `default` source entry; `diffViewState`'s baseline diffs against `admin.view`
- [x] `packages/next/src/NextAdminPage.tsx` + `.test.ts` — `numItems` reads move to `.admin.view.pageSize`; view-source resolution gains the `default` case
- [x] `apps/test/src/vexcms/collections/{pages,posts,fields}.ts`, `apps/www/src/vexcms/collections/pages.ts`, `packages/create-vexcms/templates/marketing-site/src/vexcms/collections/pages.ts` — `admin.table.defaultColumns`/`.views` → `admin.view.columns`/`admin.views`

## Step 19 — View switch keeps rows + prefetch [agent]
Why: Decision 46. Switching `view=` changes the query key as sharply as a search edit — Step 10's own follow-up already fixed the identical blank-table flash for search via `keepPreviousData`; this step applies it to the shared base hook, plus hover/focus prefetch keyed off the exact same args the real query sends.
Verify: `pnpm --filter @vexcms/react test -- hooks collections/listView` && browser: view switches show previous rows dimmed (`aria-busy`) until new rows land, never blank; hover 150ms then click shows no visible delay; hovering every tab without clicking leaves no lingering subscriptions after ~30s
- [x] `packages/react/src/hooks/usePaginatedQuery.ts` — `placeholderData: keepPreviousData`; return gains `isPlaceholderData`
- [x] `packages/react/src/hooks/useVexListQuery.ts` — forwards `isPlaceholderData`
- [x] `packages/react/src/collections/listView/CollectionListView.tsx`, `ListLayout.tsx` — thread `isRefetching` to `DataTable`
- [x] `packages/react/src/ui/data-table/DataTable.tsx` — `isRefetching?: boolean` dims the body (`aria-busy`, `opacity-60`), rows stay interactive
- [x] `packages/react/src/collections/listView/useListViewPrefetch.ts` (new) + `.test.ts` — hover(150ms)/focus prefetch per tab via `resolveListQueryState` + `buildListFindQueryArgs`/`buildListSearchQueryArgs` (matching `useVexListQuery`'s own query key exactly), `gcTime: 30_000`; `local`-source tabs are never prefetched this way
- [x] `packages/react/src/collections/listView/CollectionListContext.tsx`, `ListViewTabs.tsx` — `viewPrefetch` in context; each `TabsTrigger` wires the handlers and shows a small spinner while its own prefetch/switch is pending
- [x] `packages/react/src/collections/listView/CollectionListView.tsx` — mounts `useListViewPrefetch` alongside `useListPeekPrefetch`

## Step 20 — Columns in views, ordering, SSR [agent]
Why: Decision 47 (revised 2026-10-28). Views already store `columns`; this step widens it to carry order (not just visibility) and makes EVERY visible column reorderable (drag + keyboard), not just hideable ones; adds URL/SSR support; reuses `ui/dnd` primitives `forms/ArrayField.tsx`/`forms/BlocksField.tsx` already use.
Verify: `pnpm --filter @vexcms/core test -- collections/listUrlParams && pnpm --filter @vexcms/react test -- ui/data-table collections/listView && pnpm --filter @vexcms/next test` && browser: dragging a column (hideable or not) reorders the table live with no flash on reload of `?cols=`; keyboard-only reorder (Tab/Space/arrows/Space) works for a non-hideable field too; a field with `admin.enableHiding: false` appears in the menu with a disabled checked checkbox and never moves except by drag
- [x] `packages/core/src/collections/completeColumnOrder.ts` (new) + `.test.ts` — appends every field absent from a (possibly visible-only) order array, in declaration order
- [x] `packages/core/src/collections/listUrlParams.ts` + `.test.ts` — `cols=<field>,<field>,…` grammar; omitted when it matches the active view's order, always present for a `local` view
- [x] `packages/core/src/collections/resolveListQueryState.ts` + `.test.ts` — gains `columnOrder` via `completeColumnOrder`
- [x] `packages/react/src/collections/listView/useListUrlState.ts` + `.test.tsx` — `cols`/`setCols` slice
- [x] `packages/react/src/collections/listView/CollectionListView.tsx`, `CollectionListContext.tsx`, `ListLayout.tsx`, `useListViews.ts` + `.test.ts` — `columnOrder` state/sync, threaded through context and `ListLayout`; `diffViewState` compares `columns` order-sensitively; `hideableColumns` renamed `columnMenuEntries`, drops the `admin.enableHiding` filter, tags each entry `hideable: boolean`
- [x] `packages/react/src/ui/data-table/DataTable.tsx` — `columnOrder?: string[]` → `state.columnOrder`
- [x] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` + `.test.tsx` — `columns` prop widens to every readable column; `ui/dnd`'s `DndProvider`/`Droppable`/`Draggable`/`DragHandle` wrap the FULL list (every row draggable + keyboard-reorderable); a non-hideable row's `Checkbox` is `disabled`+checked, same row shape as every other
- [x] `packages/react/src/collections/listView/ListColumnsAction.tsx` — forwards `columnOrder`/`onColumnOrderChange`, passes `columnMenuEntries` in place of the old `hideableColumns`

## Step 21 — View config API cutover + column pinning + resizable columns [agent]
Why: Decision 45's FINAL revision (`admin.table` removed entirely) and Decision 48's REDESIGN (pinning + resizing share one unified `columns` entry model with a single precedence resolver) are both still code, not just decisions — this step (kept at its original number, rescoped from "Column pinning" alone) lands all three together, since resizing/pinning's own state IS the `columns` array the config cutover introduces.
Verify: `pnpm --filter @vexcms/core test -- collections fields && pnpm --filter @vexcms/react test -- collections/listView ui/data-table && pnpm --filter @vexcms/next test` && browser: pinning left/right sticks with a correct offset while scrolling, no shift on reload of `?cols=`; dragging a header edge resizes a column, keyboard arrow keys on a focused resize handle do too, both persist; `admin.view.sort` (no `admin.table` anywhere) still sorts the default view on first paint; `rg "admin\.table" packages apps` (outside test fixtures/spec prose) returns zero hits
- [x] `packages/core/src/collections/types.ts` — `CollectionTableConfigInput`/`CollectionTableConfig`/`table` key DELETED entirely; `AdminCollectionConfig.view` widens to `{ name?, description?, where?, sort?, pageSize?, searchField?, columns?: ColumnEntry[], searchFields?, pageSizeOptions?, countLimit?, serverPageSize?, bulkActions? }`; `ColumnEntry = TFieldSlug | { field, width?, pinned?: "left"|"right", hidden?, enableSorting?, enableHiding? }` (new); `VexViewState` WIDENS to the SAME shape as `admin.view` (every `admin.views[n]` accepts the same collection-wide settings, falling back to `admin.view`'s then global); `VexViewState.pinned` removed (never shipped)
- [x] `packages/core/src/fields/baseTypes.ts` — `FieldAdminConfig.width?: number` (optional, no type-default resolved here)
- [x] `packages/core/src/collections/config.ts` — `admin.view` resolution absorbs every old `admin.table.*` default in one block; `searchField` → `searchFields`
- [x] `packages/core/src/collections/resolveColumnConfig.ts` (new) + `.test.ts` — the one resolver, VIEWS ALWAYS WIN for all 5 attributes (width/pinned/hidden/enableSorting/enableHiding): resolved `ColumnEntry` ?? `field.admin.<attr>` ?? `FIELD_TYPE_DEFAULT_WIDTH[type]`/`false`
- [x] `packages/core/src/collections/validateTableConfig.ts` renamed `validateViewConfig.ts` — checks run per view (`admin.view` + every `admin.views[n]`); new: unknown `ColumnEntry.field`, pin colliding with the selection column, any column entry's `enableSorting: true` must lead an index (same check as `field.admin.enableSorting`, now per-view too)
- [x] `packages/react/src/fields/index.tsx` — `getCollectionColumnDefs` sets each columnDef's `enableSorting`/`enableHiding` from `resolveColumnConfig`'s resolved output, not `field.admin.*` directly (lets a view override a field's own default)
- [x] `packages/core/src/collections/listUrlParams.ts` + `.test.ts` — `cols=<field>[:w<width>][:pl|:pr][:h]` grammar (replaces Step 20's bare-field-list, breaking, no shim); diff-only, always present for `local`
- [x] `packages/core/src/collections/resolveListQueryState.ts` + `.test.ts` — `columns: ColumnEntry[]` via URL/view/`admin.view.columns` fallback, completed + resolved through `resolveColumnConfig`
- [x] `packages/react/src/ui/data-table/DataTable.tsx` — one `columns?: ColumnEntry[]` prop → `columnVisibility`/`columnOrder`/`columnPinning`/`columnSizing`; `table-layout: fixed`; `enableColumnResizing: true` unconditionally, keyboard-accessible resize handle in each header; one `onColumnsChange` callback for reorder/pin/hide/resize
- [x] `packages/react/src/collections/listView/useListUrlState.ts` + `.test.tsx` — `cols`/`setCols(columns: ColumnEntry[])`
- [x] `packages/react/src/collections/listView/CollectionListView.tsx`, `CollectionListContext.tsx`, `ListLayout.tsx`, `useListViews.ts` + `.test.ts` — separate `visibleColumns`/`columnOrder`/`pinned` state collapses into ONE `columns`/`onColumnsChange`; `diffViewState` compares entries deep
- [x] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` + `.test.tsx` — drag handle (reorder) + checkbox (hide) + NEW 3-state pin control per row, one `onColumnsChange`; resizing lives only in the header, not this menu
- [x] `packages/react/src/collections/listView/ListColumnsAction.tsx` — forwards `columns`/`onColumnsChange`
- [x] `packages/next/src/NextAdminPage.tsx` + `.test.ts` — `numItems` reads move to `.admin.view.serverPageSize`/`.pageSize`; resolves `columns` server-side the same way, renders `table-layout: fixed` with exact widths
- [x] `apps/test/src/vexcms/collections/{pages,posts,fields}.ts`, `apps/www/src/vexcms/collections/pages.ts`, `packages/create-vexcms/templates/{marketing-site,base-nextjs}` — every `admin.table.*` → `admin.view.*` (`searchField` → `searchFields`)
- [x] `2026-10-28-committs-field` spec — any remaining `defaultView`/`admin.table` references fixed to `admin.view`

## Step 22 — Per-field filter inputs [agent]
Why: Decision 50. `ListFilterBuilder.tsx`'s hand-coded `renderFilterValueInput` duplicates per-type logic already encoded once in `reactAdapter.fields`; a third registry key, `filterInput`, closes that gap and fixes a real bug — `json`/`richtext`/`array`/`blocks`/`group` currently fall through to `eq`/`neq` with no matching input.
Verify: `pnpm --filter @vexcms/core test -- fields && pnpm --filter @vexcms/react test -- fields collections/listView && pnpm --filter @vexcms/next test` && browser: a relationship/upload filter opens the existing picker and shows the picked document's title (not id) in the row and chip; `json`/`array`/`blocks`/`group`/`richtext` offer only `isEmpty`/`isNotEmpty`; a hard-reloaded `?filter=` URL naming a relationship/upload id shows the correct title on first paint
- [x] `packages/core/src/fields/types.ts` — `FilterInputProps<TField>` (`{ field, value, op: string, onChange, disabled? }`) beside `FieldComponentProps`/`CellComponentProps`
- [x] `packages/core/src/collections/collectRelationshipFilterValues.ts` (new) + `.test.ts` — walks the DNF `where`, collects every `relationship`/`upload` leaf's concrete id
- [x] `packages/react/src/fields/{text,email,url,textarea}/FilterInput.tsx` + `.test.tsx` — plain text `Input` each
- [x] `packages/react/src/fields/number/FilterInput.tsx`, `checkbox/FilterInput.tsx`, `date/FilterInput.tsx`, `select/FilterInput.tsx` + `.test.tsx` each — moved verbatim from `renderFilterValueInput`'s branches; `vex_status` (type `"select"`) free-rides `select`'s
- [x] `packages/react/src/fields/color/FilterInput.tsx` + `.test.tsx` — swatch + the existing hex text `Input`, not the full picker popover
- [x] `packages/react/src/fields/relationship/FilterInput.tsx` + `.test.tsx` — opens `RelationshipPicker` directly, single value (`selectedIds: value ? [value] : []`)
- [x] `packages/react/src/fields/upload/FilterInput.tsx` + `.test.tsx` — new standalone single-select media dialog (`MediaPicker` itself needs a live form `field` API, not reusable as-is — reuses its internal grid/dropzone pieces only)
- [x] `packages/react/src/adapter.ts` — `reactAdapter.fields[type].filterInput` for every type above; `json`/`richtext`/`array`/`blocks`/`group` get none
- [x] `packages/react/src/fields/registry.ts` — `fieldToFilterInputComponent`
- [x] `packages/react/src/collections/listView/ListFilterBuilder.tsx` — deletes `renderFilterValueInput`, resolves via the registry; `FILTER_BUILDER_OPS_BY_FIELD_TYPE` gains `isEmpty`/`isNotEmpty`-only entries for `json`/`richtext`/`array`/`blocks`/`group`
- [x] `packages/core/src/framework.ts` — `CollectionListViewProps.initialFilterValueTitles?: Record<string, string | null>`
- [x] `packages/next/src/NextAdminPage.tsx` + `.test.ts` — prefetches `vexConvexApi.get` per distinct relationship/upload filter id (`Promise.allSettled`, degrades to `null`), builds `initialFilterValueTitles`
- [x] `packages/react/src/collections/listView/CollectionListContext.tsx`, `CollectionListView.tsx`, `ListFilterChips.tsx` — `filterValueTitles` seeded/read/set

**Dependency (added 2026-10-29):** `2026-10-28-committs-field`'s `commitTs()` FilterInput (date+time) depends on this step's registry existing first.

## Step 23 — Admin cookie scoping + consolidation [agent]
Why: Decision 51. Up to five separately-named, `path=/` admin cookies per collection ship on every request including public pages. Scope to `basePath`, consolidate into two JSON cookies, zero caller-facing API change.
Verify: `pnpm --filter @vexcms/core test -- adminCookie && pnpm --filter @vexcms/react test -- adminCookie collections/listView livePreview ui/sidebar && pnpm --filter @vexcms/next test` && browser: `document.cookie` shows exactly `vex-admin`/`vex-admin:<collection>`, both `Path=<basePath>`; a public page carries neither; first paint unchanged; a cookie past `ADMIN_COOKIE_MAX_BYTES` drops `rowCounts` then oldest `localViews`
- [x] `packages/core/src/adminCookie.ts` (new) + `.test.ts` — `ADMIN_COOKIE_NAME`/`adminCollectionCookieName`, versioned `AdminCookieGlobal`/`AdminCookieCollection`, tolerant parse, capped serialize (`rowCounts` LRU, `localViews` name truncation, `ADMIN_COOKIE_MAX_BYTES` drop order)
- [x] `packages/core/src/collections/listPreferenceCookies.ts`, `listViewsCookie.ts`, `listRowCountCookie.ts`, `packages/core/src/livePreview/panelCookie.ts` — each existing parse function reads through `parseAdminCookie`/`parseAdminCollectionCookie` internally; exported names/signatures unchanged
- [x] `packages/react/src/adminCookie.ts` (new) + `.test.ts` — `writeAdminCookie`/`writeAdminCollectionCookie`, read-merge-write, skip when unchanged
- [x] `packages/react/src/collections/listView/listPreferenceCookies.ts`, `listViewStore.ts`, `packages/react/src/livePreview/useLivePreviewPanelState.ts` — each existing writer calls `writeAdminCookie`/`writeAdminCollectionCookie` internally; exported names unchanged
- [x] `packages/react/src/ui/sidebar.tsx` — `SidebarProvider` reads `useVexConfig().basePath`, writes through `writeAdminCookie`
- [x] `packages/react/src/admin/AdminLayout.tsx` — one-time best-effort clear of the 6 old cookie names on mount
- [x] `apps/docs/src/content/docs/guides/admin-cookies.mdx` (new) — cookie names/Path/contents/size bounds

## Step 24 — Examples, docs, acceptance [agent]
Why: acceptance needs a 200-doc collection, a custom row + bulk action exercising `access`, a config view with a server-resolved `where` the current role can't read, a count-cap demonstration, an index-pushdown demonstration, a declared-filter narrowing demonstration, and a docs guide that matches every decision through the architecture review (peek, density, shortcuts, parked sort, filter chips, view tabs, hidden-filter narrowing, count cap, pushdown, server prerender, and the local-view cookie). It also needs hard-reload proof that Decision 39's zero-layout-shift promise holds for every view source and for the peek.
**Dependency (added 2026-10-28, developer-directed):** lands AFTER the separate `2026-10-28-committs-field` spec — `testimonials` uses its `commitTs()` field, with `admin.view.sort = { field: "updatedAt", order: "desc" }` (Step 18), pins (Step 21), and a relationship-filtered preset view (Step 22). Do not start until that spec is implemented.
Verify: `pnpm typecheck && pnpm test` && vex generate && the 15-item browser smoke checklist below, for at least one allowed role and one denied role
- [x] `apps/test/src/db/constants/index.ts` + `apps/test/src/vexcms/collections/testimonials.ts` (new) + `apps/test/src/vexcms/collections/index.ts` — collection with a `commitTs()` field (`2026-10-28-committs-field`), `admin.view.sort = { field: "updatedAt", order: "desc" }` (Step 18), a pinned column via `ColumnEntry.pinned`/an `admin.views` preset with its own pinned entry, resizable columns exercised (Step 21), a relationship field with a preset view filtering on it (Step 22), `admin.view.searchFields` (2 fields), sortable columns, an indexed `source` field, a low `admin.view.countLimit` (below the seeded row count, to exercise `totalDocsCapped`), 3 `views` (one with a server-resolved `where` on a field the `contributor`/`user` roles can't read), custom row + bulk action contributions, seed 200 docs
  - Revised 2026-11-02, developer: `testimonials`' low `countLimit` removed (the list should show its exact 200 total); the default rose 1000 → 10000 (`search` clamps to 1023); the cap redesign is in `backlog.md` § "Total-count cap for large collections".
- [x] `apps/test/src/components/TestimonialFeatureRowAction.tsx` + `apps/test/src/components/TestimonialBulkApproveAction.tsx` (new) — custom row + bulk action contributions
- [x] `apps/test/src/auth/access.ts` — `testimonials` resource, `VIEW_ACTIONS` rules (`readViews`/`createView`/`updateView`/`deleteView`), field-level read restriction on `internalScore`
- [x] `apps/test/convex/seed.ts` — 200 seeded rows, each stamped with a `source`
- [x] `apps/docs/src/content/docs/guides/list-views.mdx` (new) — list-view guide covering every Step 1–23 behavior, including server prerender, the local-view cookie index, the server-seeded auth context (sidebar included), `admin.view`/`admin.views` (Decision 45), `commitTs()` (`2026-10-28-committs-field`), the view-switch prefetch/keep-previous-rows behavior, column ordering, column pinning, per-field filter inputs, and a link to `admin-cookies.mdx`; `README.md` `admin.view` claims made true
- [x] `.agent/docs/product/v0.1.0-launch-plan.md` — I tasks ticked; backlog updated
- [x] browser smoke checklist: every Verify above + `VIEW_ACTIONS` denied vs allowed + hidden-filter badge + density + peek + keyboard shortcuts + declared-filter narrowing + count cap + pushdown + hard-reload zero-shift for shared/config/local views and `peek=`
