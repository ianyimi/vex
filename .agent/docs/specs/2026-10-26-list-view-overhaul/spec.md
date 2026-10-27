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
prompt_version: 1
---

# 2026-10-26-list-view-overhaul — Spec

## Overview

Launch-plan item I. Collection list views are only navigable by Load More today. This spec adds search, portable sort, a filter builder, column visibility, page size, URL state, saved views (config, shared in Convex, local in the browser), and `list.*` extension slots with `vex.*` built-ins and custom row/bulk actions. It also ships a mobile list layout (J drops the list view from its scope). The `admin.table` keys that A planned to delete are consumed here, each one alongside the control that reads it. It also covers A's remainder (the `vex_` convention, `updatedAt`), the status-enum sweep, and the `useVexListQuery` / `useVexDocQuery` data-source boundary, plus an Inspect peek, density, and core keyboard shortcuts. Step bodies are mixed (Decision 1): Steps 3, 4, 5, 8, and 12 ship full code; the rest ship guided stubs (signatures, JSDoc, numbered `// TODO: implement` pseudocode).

## Design Decisions

1. **One spec, 17 ordered steps, all `[agent]`.** Step bodies are mixed: Steps 3, 4, 5, 8, and 12 ship full code; the rest ship guided stubs (signatures, JSDoc, numbered `// TODO: implement` pseudocode). The designs are a UX reference, not a pixel target: every element is built from existing `packages/react/src/ui` components, with no custom Tailwind added to `ui/` to match mockups. The spec follows the conventions in the developer's outstanding edit-view overhaul (`2026-10-26-edit-view-overhaul`).
2. **`admin.table.searchField: readonly TFieldSlug[]`.** It is typed to the collection's own field slugs. Array order is the picker order, and the first entry is the default when the user starts typing. With no `searchField`, the search bar is not rendered. Why: Convex `withSearchIndex` queries one index and field per query, and collections can have several searchable fields.
3. **`searchField` entries must declare a search index.** `defineConfig` throws a `VexConfigError` naming the field and the `searchIndex` to add. Schema generation emits the search index for every `searchField` entry, which drops the old "only when a collection points here" condition for those fields. Why: fail at config time, not in the browser.
4. **Sort is `{ field, order: "asc" | "desc" }` everywhere**: `defaultSort`, the `find` args, the URL, and views. Why: it keeps the existing `defaultSort` shape, and `order` matches Convex `.order()`.
5. **Sort is portable, not an index.** Clients send `sort`, never `withIndex` (B3 Decision 14). The server resolves it to the index whose first field is `field` (`resolveCollectionIndexes`, draftStatus-aware) and applies `order`. `_creationTime` needs no index. Why: stored views and URLs stay backend-neutral.
6. **An unindexed sort is a config-time error.** `defaultSort.field` and every field with `admin.enableSorting: true` must lead some index, or `defineConfig` throws a message naming the index to declare. At runtime, an unknown `sort.field` gets a `VexError` with the same message. Why: no silent auto-indexes; the user declares indexes explicitly.
7. **Sort is parked while searching.** While `q` is set, the `sort` param stays in the URL but is ignored. The headers are disabled with a "Sorted by relevance" badge and the tooltip "Sorting is off while searching", and clearing `q` restores the sort. The server still rejects `sort` together with `search`, so the client omits `sort` from the search query. Why: Convex search results are relevance-ordered, and losing the user's sort on every search is hostile.
8. **Pagination stays cursor Load More, plus a page-size select** driven by `pageSizeOptions` and labelled "Rows per load". Changing the size resets the list to the first page at the new size, without re-chunking the loaded rows. Earlier pages stay subscribed (`usePaginatedQuery` keeps every page live). There is no auto-load on scroll. Why: search, sort, and filters meet the navigability acceptance; numbered pages would cost O(n) scans on Convex.
9. **URL state uses the design's compact params:** `q`, `qf` (omitted when it is the default field), `sort=<field>.<asc|desc>`, `filter=(<field>.<op>.<value>,…)|(…)` (rows comma-separated inside a group, groups joined by `|`), `size` (omitted at the default), `view=<config|shared|local>:<id>`, and `peek=<id>`. Values are typed by field: numbers raw, booleans `true`/`false`, dates ISO, relationships by ID, strings URI-encoded. A typed parser/serializer round-trips the plain `VexWhereNode`. Invalid params or rows are dropped, never thrown. Typing updates the URL with `replace`; discrete actions (sort, view switch, Enter in search) `push`. With a view active, only params that differ from the saved view appear. Load More never touches the URL. Columns and density are not in the URL.
10. **Filter builder: AND rows within groups, OR between groups (one level, DNF).**
    - Operators come from `eq neq gt gte lt lte` plus two **list-only** operators, `isEmpty` and `isNotEmpty`. These compile to `{ op: "eq" | "neq", value: undefined }`; core `FilterOp` is unchanged, so access rules are unaffected. Operators are offered by field type: number and date get all six comparisons, while text, boolean, select, and relationship get `eq`/`neq`. Every type gets the empty operators.
    - `vex_status` is a built-in filter field on versioned collections, with values from `VERSION_STATUSES`.
    - The field list excludes fields the user can't read (`useFieldPermissions`).
    - The builder applies live: a row counts once it is complete, and incomplete rows are muted and ignored. Text `eq` hints "Exact match. Use search for partial text."
    - Active filters show as chips (clear one / clear all). A per-browser toggle hides the chip row.
    - Why: it covers multi-value, empty-value, and triage use cases without a tree editor.
11. **Saved views come from three sources, merged by `viewId`:** `config` (`admin.table.views`, read-only, fully typed to the collection), `shared` (the `vex_views` table), and `local` (localStorage). A view stores `{ where, sort, search, searchField, columns, pageSize }` plus an optional `description`.
    - The UI shows views as tabs: **All** (no view) first, then config, shared, and local. When the tabs overflow, the rest collapse into an "All views" menu grouped by source.
    - Opening a view makes its name the page heading, with a source/author line and the description.
    - A changed view shows a modified dot and a "Modified: …" summary (a diff of URL state against the saved view), with Reset and Save (save changes / save as new / reset). The save target depends on the view actions (Decision 13) and the view source.
    - Copy link, when a local view is active, serializes the full state instead of `view=local:…`. An unknown view ID in the URL falls back to the remaining params, with a notice.
12. **Shared views are collection-wide**, plus scoped to the organization when `access.orgCollectionSlug` is set. There are no user or role scopes. Why: localStorage is the personal tier.
13. **Shared views get four access actions, mirroring the draft actions** (`VIEW_ACTIONS` in `access/constants.ts`):
    - `readViews` is a query action (added to `QUERY_ACTIONS` like `readDrafts`). It gates `listViews`, the use of shared views, and `find`'s shared-view allow-list (Decision 26).
    - `createView` gates saving a new shared view and promoting a local view.
    - `updateView` gates saving changes to and renaming a shared view.
    - `deleteView` gates deleting a shared view.
    - All four are denied by default (P-007), so shared views are invisible until a project grants `readViews`. The docs, `apps/test`, and the templates grant them explicitly.
    - Users without `createView` can still save views locally. The UI gates each menu item by its own action.
    - Why: consistency with the draft actions. Per-view access (backlog: "Per-view access for saved views") becomes a later `readViews` rule with a `where` over `vex_views` rows, not a new mechanism.
14. **Promotion is a move.** A local view is saved shared with its client-generated `viewId` (save is idempotent on `viewId`), and the local entry is deleted only after success; on failure, the local entry stays. The merged list dedupes by `viewId`, which also covers another tab racing the promotion.
15. **With no view selected, column visibility is session-only.** There is no auto-persist of the last-used state. Density and filter-chip visibility are cookie-backed (Decision 42). Collapsed view-menu groups use `useLocalStorage` from `@ts-hooks-kit/core`. None of these enter the URL or views.
16. **`vex_views` is emitted unconditionally by `generateVexSchema`**, like `vex_versions`. All framework tables and system fields use the `vex_` prefix (step 1 writes this convention down).
17. **Row and bulk actions are slot contributions only.** `list.row.actions` and `list.bulkActions` contributions are React components receiving `{ collection, docs }`, gated by the existing `SlotAccessPredicate`. Create, search, filters, columns, views, row delete, and bulk delete are built-ins with `vex.list.*` IDs. Client-only (plugin stem S14). There is no declarative `{ label, mutation }` sugar.
18. **The `list.*` slot IDs are:** `list.header.actions`, `list.toolbar`, `list.filters`, `list.beforeTable`, `list.afterTable`, `list.row.actions`, `list.bulkActions`.
19. **Data-source hooks are `useVexListQuery(props)` and `useVexDocQuery(props)`**, in `react/src/hooks/` beside `usePaginatedQuery` / `usePaginatedSearch`, which they wrap. The `Query` suffix marks them as data fetching, distinct from the edit view's `useVexDocument()` context hook (`documents/VexDocumentContext.tsx`). The list and edit views stop calling `vexConvexApi` directly. Convex is the only implementation. Why: this boundary is where plugin, adapter, and adopted-table sources plug in later.
20. **Status values come from `VERSION_STATUSES`, never literals.** Badges and status filters iterate the enum. Why: approval stages and branches will add states later.
21. **Placement: feature subfolders inside `react/src/collections/`** (developer decision, 2026-10-27). Step 2 restructures the folder and updates the `react-feature-folders` rule and AP-023 to match:
    - `collections/listView/` holds `CollectionListView`, `CreateDocumentForm` / `CreateDocumentModal` (the create flow starts from the list), and every list-view component, hook, built-in action, and helper.
    - `collections/editView/` holds `CollectionEditView`, `CollectionDeleteAction`, `CollectionDuplicateMenuItem`, and `useDuplicateCollectionDocument`.
    - `collections/api/` is unchanged.
    - Folder names are camelCase (like `livePreview/`). Files inside drop the redundant `Collection` prefix (e.g. `listView/ListToolbar.tsx`, `listView/useListUrlState.ts`), following the `fields/<type>/` precedent for names scoped by their folder. The public root components keep their names (`CollectionListView`, `CollectionEditView`).
    - The subfolder set is closed: new feature subfolders inside a domain need the developer's approval and must be added to the rule.
    - Generic table controls stay in `react/src/ui/data-table/` (`DataTable*`). Data hooks stay in `react/src/hooks/`. Saved-view server operations go in `core/src/collections/api/{listViews,saveView,removeView}/` with `react/src/collections/api/<op>/client.ts`. View types go in `core/src/collections/types.ts`.
22. **Responsive at every width, following the edit view's approach.**
    - **Container, not viewport.** The list root is a size container (`@container/list`, like the edit view's `@3xl/form`). Layout switches use container-query variants on the list's own width, so the list behaves the same inside a narrow pane.
    - **CSS collapse.** Toolbar controls fold into one ⋯ overflow menu at fixed `@container/list` breakpoints (Decision 43), never by `ResizeObserver` measurement. The order is fixed: Copy link, then Columns, then rows per load. Search and Filter never collapse.
    - **`useIsMobile` decides overlay CONTENT only.** Below 768px, menus and the filter builder render as bottom `Sheet`s instead of `Popover`s — a choice made only when the overlay is already closed, so it never shifts first paint. The view-tab row's collapse into one button is a different case: that row is visible unconditionally on first paint, so it is a CSS viewport-breakpoint swap (`hidden md:flex` / `flex md:hidden`), never a `useIsMobile()` branch.
    - **Fixed height.** The list page never scrolls. The header, tabs, toolbar, and chips are `shrink-0`; the table is `flex-1 min-h-0` inside its own `ScrollArea`, with a sticky header and a pinned footer. Load More appends inside the scroll area and keeps the scroll position.
    - **Bulk controls** sit inline in the toolbar, left of Filter (count, "Select all N loaded", the `list.bulkActions` slot, Delete, clear), and never overlay the table. On narrow containers they replace the Filter row.
    - **Table.** It scrolls horizontally with a sticky first column on narrow containers.
    - **Peek.** It follows live preview's `isSplit` model (Decision 27).
23. **`RevalidateButton` stays outside the `list.*` slots.** `CollectionListView` renders it itself, beside `ListLayout`'s output, not as a `list.header.actions` contribution — it isn't named in Decision 17's built-in list or Decision 18's slot list. Why: slotting it is a later decision, not an assumption to bake in silently.
24. **Shared-view `organizationId` is resolved and stamped server-side** from the caller's session (`auth.organization`), never accepted as a client-supplied arg on `listViews`/`saveView` — taking it from the client would let a caller read or write another organization's views. `db/test/convex/schema.ts`, `@vexcms/core`'s own hand-maintained test fixture (separate from `generateVexSchema.ts`'s generated output), also gains a `vex_views` table so Step 6's tests compile.

25. **Config view filters are hidden from the UI, not secret, and the client composes them.** `admin.table.views[].where` lives in `vex.config.ts`, typed to the collection, so it ships in the client bundle like access rules (P-004). `find`/`search` take **no `view` argument** and know nothing about views.
    - The client sends one plain `where = composeViewWhere({ viewWhere, filter })` (core helper). The result is `{ and: [viewWhere, filter] }`, or whichever one is present. The URL keeps `view=config:<id>` plus the user's own `filter`, never the hidden `where`.
    - The client reads config views from the bundled config through `toClientViewConfig`, which drops `where` from the view's display state and adds `hasHiddenFilter`/`hiddenFilterCount`. Composing the query needs the raw `where`, so `composeViewWhere` takes the config view itself. `listViews` returns shared views only.
    - The UI shows hidden filters only as a lock badge with a count and the view description, never as chips or builder rows. The hidden `where` is never user-editable state.
    - "Save as new view" from a config view saves only the user's own `filter`/`sort`/`search`/`columns`/`pageSize`. The hidden filter is not carried over.
    - The `views` JSDoc and the list-views guide warn: "Config view filters are hidden from the UI, not secret. The condition (field names, operators, values) ships in the client bundle like access rules; the values of fields a viewer can't read are never sent."
26. **Field read access gates every list control, with one exception for declared view filters.**
    - **Client:** unreadable fields are hidden from the filter field list, the search field picker, sortable headers, the columns menu, and the peek (`useFieldPermissions`).
    - **Server, sort/search:** `resolveQueryIndex` and `search` **reject** sort or search on an unreadable field with `VexAccessError`. Sort order alone would leak values.
    - **Server, caller `where`:** a condition on an unreadable field drops those rows (`readableDocuments`). The one exception is `matchDeclaredViewFilter({ collection, where })` (Step 6). If a top-level AND part of the request `where` **deep-equals the full `where` of a config view** on that collection, that part is trusted, and the field-read check runs only on the remaining parts. Every remaining condition must use readable fields, so users may narrow a config view with their own readable-field filters.
    - **What still fails:** any change to the declared filter (dropping a condition, changing a value, putting it in an OR group), or any other unreadable condition, drops rows as today.
    - **Why:** a fixed, developer-declared condition exposes one yes/no per row by design. Arbitrary conditions would let a user guess hidden values by repeating filters.
    - **Shared views:** when a request `where` still has an unreadable condition after the config-view match, `find` (and `search`) reads that collection's `vex_views` rows (indexed by collection, filtered by the caller's `readViews` rule) **in the same query transaction**. The same exact-match rule applies to them. The read happens only when an unreadable condition exists, so ordinary queries cost nothing extra.
    - **Saving:** `saveView` rejects a `where` that references a field the saver can't read. A saver who can read a field may save a view that filters on it, and viewers without access to that field get it as a trusted hidden filter through the shared-view allow-list.
27. **Inspect peek**, driven by `peek=<id>`. It has two tabs:
    - **Fields:** label, mono key, value, and a copy button; full `_id`; `_creationTime` as ISO, epoch ms, and relative time; a relationship chip plus the target ID; long text in full with a character count.
    - **JSON:** the raw document.

    **Layout** (mirrors live preview):
    - At `@5xl/list` and wider (a container query, Decision 43), the peek sits inline beside the table at the list's fixed height and scrolls on its own (`isSplit`-style).
    - Below that it renders as a non-modal right `Sheet`.
    - Below 768px (`useIsMobile`) it is a bottom `Sheet`, like `LivePreviewMobileOverlay`.

    **Data:**
    - It opens instantly from the row already loaded, then `useVexDocQuery` subscribes to the full document while the peek is open.
    - It prefetches on hover (150ms) or keyboard focus, and prefetches the neighbouring rows ±1 while open, via `queryClient.prefetchQuery(convexQuery(get…))`. Eviction is TanStack Query `gcTime`.
    - A `peek` ID that isn't loaded fetches by ID. Not-found and no-access render the same message.
    - It shows only readable fields.
28. **Built-in row actions, in order:** Open, Inspect (`vex.list.row.inspect`), Copy ID (`vex.list.row.copyId`), the `list.row.actions` contributions, then Delete last (only when permitted). Admin links use `adminHref` with the edit view's `/admin/collections/<slug>[/<id>]` routes. Bulk "Select all" always means *all loaded* rows and is labelled "Select all N loaded".
29. **Density is Comfortable or Compact**, stored per browser and set in the columns menu.
30. **Keyboard shortcuts are the core set only**, handled by an internal `useCollectionListShortcuts` hook built on `useEventListener` from `@ts-hooks-kit/core`, with no new dependency.
    - `/` focuses search. `Esc` closes the top overlay, then clears the selection, then blurs search. `↑`/`↓` move row focus. `Enter` opens the row. `Space` toggles the peek. `X` toggles selection, and `Shift+X` selects a range.
    - Shortcuts are ignored while focus is in an input, textarea, `contenteditable`, or an open dialog, and while `e.isComposing`. Keys match on `e.key`.
    - Why: the input-focus rules and Esc layering are custom either way, and six keys don't justify a package. cmdk is a combobox, not a hotkey binder.
31. **Fixed heights with internal scroll.** Menus, popovers, sheets, the filter builder, the views and columns menus, and the peek use a fixed or max height with an internal scroll container, never growing the page. A thin prop-driven wrapper, `ui/ScrollSection.tsx`, composes `ScrollArea` with optional `title`, `count`, `collapsible`, and `persistKey` (localStorage collapse state). This is recorded as a standing entry in `preferences.md`.
32. **Error and empty states.**
    - Errors: a generic "Couldn't load {plural}" with Try again and a details disclosure. A `VexError` with code `UNINDEXED_SORT` (for example from a stale link) renders "Can't sort by {Field} yet" with a Remove sort action.
    - Empty states are distinct: an empty collection, no search results (with an offer to search another declared field), and no filter results.
    - Microcopy follows `DESIGN-NOTES.md` §5.

33. **Shared-view scope copy says "Everyone with access", not "Everyone at {Org}".** `useVexAuth()`'s `organization` carries no display-name field this spec can read, and fetching one would add a query this spec doesn't otherwise need. Why: ship copy that's true for every project, scoped or not, rather than block the save dialog on a field that doesn't exist yet.
34. **The Inspect peek's shared not-found/no-access copy is pinned here, not left to a later design pass:** `COLLECTION_LIST_PEEK_UNAVAILABLE_TITLE` = "Can't show this document" / `COLLECTION_LIST_PEEK_UNAVAILABLE_DESCRIPTION` = "It may have been deleted, or you may not have access to it." `DESIGN-NOTES.md` §5 doesn't give wording for this state; Decision 27 only requires the not-found and no-access cases to read identically. Why: a peek that silently reveals whether a hidden document exists defeats Decision 27's point, so the copy ships with the feature rather than waiting on a design review.

35. **Total count is capped.** The first page counts with `take(countLimit + 1)` instead of `.collect()`. `admin.table.countLimit` defaults to 1000. `find` returns `totalDocs` plus `totalDocsCapped: boolean`, and the UI shows "Showing 25 of 1,000+". Why: the old `.collect()` scanned every matching row on each list open and re-ran on every write while the list was open; it failed above 32k documents.
  36. **Filter index pushdown.** `resolveQueryIndex({ collection, where, sort, drafts })` picks one index for both:
    - It prefers an index whose leading fields are matched by **equalities** in the AND part of `where`, followed by the sort field when a sort is set (draftStatus-aware via `resolveCollectionIndexes`).
    - Those equalities become `withIndex` range conditions and are removed from `.filter`. Everything else stays in `.filter`.
    - It falls back to the sort-only index, then to `_creationTime`, when no equality can be pushed down. Examples: OR groups, ranges on non-leading fields, or a sort that's incompatible with the index.
    - Access-rule index precedence (`pickConvexQueryIndex`) is unchanged.
    - Why: a selective filter such as `status = failed` on a 200k-row collection otherwise scans ~5,000 documents per 25-row page; with pushdown it reads 25.
37. **Built-ins mirror the edit view.**
    - Each built-in list contribution is its own file in `listView/` (`ListCreateAction.tsx`, `ListRowOpenAction.tsx`, `ListRowInspectAction.tsx`, `ListRowCopyIdAction.tsx`, `ListRowDeleteAction.tsx`, `ListBulkDeleteAction.tsx`, `ListSearchAction.tsx`, `ListColumnsAction.tsx`, `ListFiltersAction.tsx`). Views are the one exception: `ListViewTabs.tsx` (Step 12) renders directly above `ListToolbar` as its own row, mounted by `ListLayout`, not resolved through a `list.*` `SlotOutlet` — so there is no `ListViewsAction.tsx` wrapper.
    - One registry file, `listView/listBuiltinContributions.ts`, holds them, like `documentEditBuiltinContributions.ts`.
    - Built-ins read shared list state from `CollectionListProvider` / `useCollectionList()` (`listView/CollectionListContext.tsx`, mirroring `VexDocumentProvider`/`useVexDocument`) instead of having props drilled through the layout. The state includes collection, url state, selection, density, visible columns, and `onInspect`.
38. **File size.** A component, hook, or helper over ~50 lines gets its own file. Small private helpers may share their consumer's file. `ListLayout.tsx` composes regions only.

39. **The list prerenders exactly what the client shows (zero layout shift).** `NextAdminPage` accepts `searchParams`.
    - It parses them with the shared core codec (`parseListParams`, Decision 40).
    - It calls `listViews` once. That is one indexed read of a small table, and the tabs need it on first paint anyway. The active view resolves from that list (shared), from config in memory (config), or from the URL's full state (local, Decision 41).
    - It prefetches `findPaginated` with `composeViewWhere(...)`, `sort`, `size`, and `q`, using the **exact args the client query sends**. It also prefetches `get(peek)` when `peek=` is set.
    - It passes `initialData` for each of those queries plus `initialViews` and `initialPreferences` to `CollectionListView`.
    - The extra read happens once per server render. Every later query from the browser is a plain `where`, and `find` never looks up views.
    - A prefetch-args test (mirroring `NextAdminPage.test.ts`) proves the server args equal the client args for each URL state.
40. **The URL codec lives in core.** `packages/core/src/collections/listUrlParams.ts` (`parseListParams` / `serializeListParams`, the compact grammar of Decision 9) is pure and shared by `NextAdminPage` (server) and `useListUrlState` (client). It has no react import.
41. **Local views prerender through the URL and a cookie index.**
    - While a local view is active, the URL always carries its full state (`q`/`qf`/`sort`/`filter`/`size`) plus `view=local:<id>`, so the server renders the exact rows.
    - A small cookie (`vex-list-views:<collection>`) mirrors the local views' `{ viewId, name }` index, so their tabs render on the server. Full view state stays in `localStorage`. The store writes both on every save, rename, delete, and promotion.
    - Accepted tradeoff: a stale cookie entry whose `localStorage` view was cleared shows its tab until hydration, then the store prunes it.
42. **Layout-affecting preferences live in cookies.** Density and filter-chip visibility are cookie-backed and read on the server, like `readLivePreviewPanelCookie`. Collapsed group state inside the views menu, which isn't visible on first paint, stays in `localStorage` (`useLocalStorage`).
43. **Responsive collapse is CSS, not measurement.** The toolbar overflow, the view-tab overflow, and the peek's inline/right-sheet mode use fixed container-query breakpoints on `@container/list`, never `ResizeObserver` measurement. So the server render is the final render.
    - Toolbar: Copy link, Columns, and rows per load fold into the ⋯ menu at fixed `@container/list` widths.
    - Tabs: a fixed number of visible tabs per container width; the rest go in "All views".
    - Peek: inline at `@5xl/list` and wider, a right `Sheet` below that.
    - `useIsMobile` still chooses bottom `Sheet` vs. `Popover` CONTENT for overlays that start closed (they open only on interaction, so they never shift first paint) — this does not cover a control that can already be visible/open on first paint without interaction (the view-tab row itself, and the Inspect peek when `peek=` is in the URL), which use CSS instead.
    - This deliberately deviates from `useHeaderActionsCollapse`'s measured approach, per `standards/frontend/layout-stability.md`.

## Out of Scope

- Inline cell editing
- CSV export / import
- Searching all fields in one query (a fan-out search merged on the client)
- Drag-reorder rows / manual ordering
- Numbered pagination / jumping to page N
- Nested filter trees beyond one level of OR groups; a `contains` / `in` operator
- Declarative row/bulk action sugar (`{ label, icon, mutation }`)
- Auto-persisting the last-used list state
- User- or role-scoped shared views and per-view access (backlog: "Per-view access for saved views")
- softDelete / Trash / restore / undo in the list UI (delete stays a hard delete with confirmation; `remove({ softDelete })` exists server-side but has no restore path)
- Auto-load on scroll; "select all matching" (server-side bulk jobs)
- Full design shortcut set (⌘S, ⌘⌫, F/V/C), a ⌘K command palette, and rebindable keys
- A `view` argument on `find`/`search`; server-side view lookups
- Exact counts above `countLimit` (Convex aggregate component)
- Pixel-matching the design mockups; new design tokens (e.g. `--success`)

## Implementation

### Step 1 — A's remainder: `vex_` convention + `updatedAt` + Decision 31 preference entry [agent]

Why: C and I both add framework tables; the convention must be written before `vex_views` is introduced. `updatedAt` was verified-only in A. Decision 31 (fixed-height-with-internal-scroll + `ui/ScrollSection.tsx`) is a standing pattern this spec establishes and must be ratified in `preferences.md` before Step 10 builds `ScrollSection.tsx` against it.

- [ ] `.agent/docs/standards/naming-conventions.md` — `vex_` rule: every framework table and system field is `vex_`-prefixed, emitted unconditionally by `generateVexSchema`, never user-declarable; migration rule for renames
- [ ] `updatedAt` behavior confirmed against `api/create/server.ts` / update path; confirmed accurate against `guides/caching-and-seo.mdx` (no dedicated collections docs page exists) + launch plan A item ticked
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — A's remainder checkbox ticked
- [ ] `.agent/docs/standards/preferences.md` — new `P-029` entry for Decision 31

#### .agent/docs/standards/naming-conventions.md

1 edit — everything else in the file is unchanged. Step 2 separately restructures `react/src/collections/` and updates the `react-feature-folders` rule (Decision 21); that edit is independent of this bullet.

**1 — new bullet in the `## Identifiers` list**, after the existing `Convex functions:` bullet and before `Name by code area, then thing:`. Confirmed against the two existing framework tables (`export const vex_versions = defineTable(...)`, `export const vex_globals = defineTable(...)` in `schema/generateVexSchema.ts:64,90`) and the framework-owned `updatedAt`/`_status`/`_version` fields (`db/documents.ts`, `versions/` — see the `updatedAt` section below):

```md
- **Framework tables & system fields:** every table `generateVexSchema` emits that the project did not declare itself (`vex_versions`, `vex_globals`, `vex_views`), and every field a framework mechanism injects onto a user table (`updatedAt`, `_status`, `_version`), is `vex_`-prefixed or, for fields living inside a user's own table, named for what it stores with no prefix collision risk against `defineCollection`'s reserved-key guard. Framework tables are emitted unconditionally — never gated behind "does any collection use this" — and are never user-declarable: `defineCollection`/`defineGlobal` reject a `vex_`-prefixed slug at config time, the same reserved-key guard that already rejects a user field named `updatedAt` on an opted-out collection. Renaming a `…
```

#### .agent/docs/product/v0.1.0-launch-plan.md

1 edit — everything else in the file is unchanged.

**1 — tick A's remainder checkbox**, in the `## A — Data-table integrity & dead config` section's Tasks list (`- [ ] Remainder folded into I: ...`, launch-plan.md:903):

```md
  - [x] Remainder folded into I: `vex_` convention written down (`naming-conventions.md`), `updatedAt` confirmed (unchanged — see Step 1 of `2026-10-26-list-view-overhaul`), sort/column config consumed with its controls (Steps 4/9 of the same spec)
```

#### apps/docs/src/content/docs/guides/caching-and-seo.mdx

No code change — this is the confirmation record, not a new edit. `updatedAt`'s behavior is already fully and correctly documented at `guides/caching-and-seo.mdx:326-340` (`## updatedAt and sitemap lastmod`), and matches the implementation exactly:

- **Auto-injected, opt-out via `{ timestamps: false }`.** `collections/config.ts:178-196` injects an optional `updatedAt: date(...)` field onto every collection unless `input.timestamps === false`, `"updatedAt" in input.fields` (the auth adapter already declared its own), or `meta.protected === true` (auth-adapter-owned tables). Matches the doc's "auto-injects an optional `updatedAt: number` field ... into every collection that isn't `meta.protected` or an auth-adapter table that already owns the column" claim.
- **Stamped on every `create`/`update`.** Both `api/create/server.ts` and `api/update/server.ts` call the shared `stampUpdatedAt` (`db/documents.ts:35-53`), which sets `updatedAt: Date.now()` unless the collection has no `updatedAt` field (opted out) or the field is `meta.locked` (better-auth's own, confirmed by `create/server.test.ts:491-514`: "does not stamp over a locked updatedAt — the auth adapter owns that value"). Matches the doc's "stamped on every `create`/`update`" claim.
- **Globals carry no `updatedAt`.** `defineGlobal` has no equivalent injection path — confirmed by grep, there is no `stampUpdatedAt` call anywhere under `globals/`. Matches the doc.
- **Seeded/imported rows have none** until a write goes through `create`/`update` — the field is only ever set by the stamp, never backfilled. Matches the doc's "only populated by a write through the admin panel or API — seeded and imported rows have none" claim.

No doc change is needed; this step's checkbox is satisfied by the confirmation above, not a new page. (Step 16's list-view guide is where `updatedAt`'s role as a sortable/visible column gets documented, since it does not exist as a UI concept until this spec's later steps add it.)

#### .agent/docs/standards/preferences.md

1 edit — append-only, everything above is unchanged.

**1 — new entry after the existing `P-028` entry**, matching the existing `- P-NNN (YYYY-MM-DD) rule` format:

```md

- P-029 (2026-10-26) Overlay and panel surfaces that could otherwise grow with their content — menus, popovers, sheets, a filter builder, a views/columns menu, an Inspect-style side panel — take a fixed or max height with an internal scroll container, never growing the page around them. `packages/react/src/ui/ScrollSection.tsx` is the shared wrapper: it composes `ScrollArea` with optional `title`, `count`, `collapsible`, and `persistKey` (localStorage-backed collapse state), so a new bounded-height list reaches for it instead of a bespoke `overflow-y-auto` div.
```

Verify: harness doctor

### Step 2 — Restructure `collections/` into closed feature subfolders [agent]

Why: Decision 21 (developer decision, 2026-10-27, post-review) places list-view code in `collections/listView/`, edit-view code in `collections/editView/`, and the create-document form/modal in `collections/listView/` beside the list that opens it, closing the subfolder set and dropping the redundant `Collection`/`CreateDocument` prefix inside each folder while the public root components keep their names. This step is pure mechanical restructuring so every later step can write directly into `listView/`. `CollectionDeleteAction.tsx`, `CollectionDuplicateMenuItem.tsx`, and `useDuplicateCollectionDocument.ts` are edit-view pieces (built-in `edit.actionsMenu`/`edit.header.actions` contributions, used only by `CollectionEditView`) and move into `collections/editView/` with their existing names — they are public API, re-exported from `collections/index.ts`, so the move skips the in-folder short-name convention and keeps exports unchanged. After this step `collections/` root holds only `index.ts` and the three subfolders (`listView/`, `editView/`, `api/`).

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

File contents are otherwise unchanged by this step; only the import specifiers listed below move. No other line in any moved file changes.

#### packages/react/src/collections/listView/CollectionListView.tsx

Moved from `collections/CollectionListView.tsx`. Every `../`-relative import gains one more `../` for the new depth, except the one sibling import, `./CreateDocumentModal`, which moves into the same folder.

**Edit 1** (lines 14–24, import block):
```ts
import { RevalidateButton } from "../../revalidate/RevalidateButton";
import { VexLink } from "../../ui/VexLink";
import { CreateDocumentModal } from "./CreateDocumentModal";
import { useVexConfig } from "../../config/VexConfigContext";
import { adminHref } from "../../admin/adminHref";
import { getCollectionColumnDefs } from "../../fields";
import { useFieldPermissions, usePermission } from "../../access";
import { usePaginatedQuery, useVexMutation } from "../../hooks";
import { useMemo } from "react";
import { Badge, Button, DataTable } from "../../ui";
import { collapseVersionedPairs, StatusBadge } from "../../versions";
```

Rest of the file (component body, JSX, exports) is unchanged.

#### packages/react/src/collections/listView/CollectionListView.test.tsx

Moved from `collections/CollectionListView.test.tsx`. Its one import is a two-level-up relative path already (`../testing/viewSuite`), which becomes three levels up:

**Edit 1** (line 1):
```ts
import { runViewSuite } from "../../testing/viewSuite";
```

Rest of the file is unchanged.

#### packages/react/src/collections/editView/CollectionEditView.tsx

Moved from `collections/CollectionEditView.tsx`. Every `../`-relative import gains one more `../`, except the two sibling imports (`CollectionDeleteAction`, `CollectionDuplicateMenuItem`), which move into the same `editView/` folder and so stay `./`.

**Edit 1** (lines 26–73, import block below the `@vexcms/core` imports):
```ts
import type { ReactHKT } from "../../adapter";
import { AppForm } from "../../forms";
import { RenderFields } from "../../fields/RenderFields";
import { FormCompactProvider } from "../../forms/FormCompactContext";
import { DocumentTimestamps } from "../../versions/DocumentTimestamps";
import { applyFieldPermissionReadOnly } from "../../fields/applyFieldPermissionReadOnly";
import { useFieldsForm } from "../../fields/useFieldsForm";
import { useLiveFieldMerge } from "../../fields/useLiveFieldMerge";
import { useVisibleFields } from "../../fields/useVisibleFields";
import { useFieldPermissions, usePermission } from "../../access";
import {
  useAutosave,
  useResetWhenSaved,
  StatusBadge,
  VersionHistoryMenuItem,
  type ViewedVersion,
} from "../../versions";
import {
  UnsavedChangesGuardContext,
  useUnsavedChangesGuard,
} from "../../documents/useUnsavedChangesGuard";
import { useVexMutation } from "../../hooks";
import { changedValues } from "../../forms/changedValues";
import { useVexConfig } from "../../config/VexConfigContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../../ui/resizable";
import { useIsMobile } from "../../hooks/use-mobile";
import {
  useLivePreviewPanelMinSize,
  useLivePreviewPanelState,
  writeLivePreviewLayoutCookie,
} from "../../livePreview/useLivePreviewPanelState";
import { usePreservedScrollTop } from "../../admin/usePreservedScrollTop";
import { LivePreviewPanel, resolveLivePreviewUrl } from "../../livePreview/LivePreviewPanel";
import { useLivePreviewServerUrl } from "../../livePreview/useLivePreviewServerUrl";
import { LivePreviewMobileOverlay } from "../../livePreview/LivePreviewMobileOverlay";
import {
  DocumentEditRuntimeProvider,
  DocumentEditSlotOutlet,
  DocumentEditActionsMenu,
  VexDocumentProvider,
  documentEditBuiltinContributions,
  useHeaderActionsCollapse,
  DocumentCancelAction,
} from "../../documents";
import { CollectionDeleteAction } from "./CollectionDeleteAction";
import { CollectionDuplicateMenuItem } from "./CollectionDuplicateMenuItem";
import { RevalidateMenuItem } from "../../revalidate/RevalidateMenuItem";
import { LivePreviewToggleAction } from "../../livePreview/LivePreviewToggleAction";
```

Rest of the file (component body, JSX, exports) is unchanged.

#### packages/react/src/collections/editView/CollectionEditView.test.tsx

Moved from `collections/CollectionEditView.test.tsx`. Every `../`-relative import gains one more `../`; the sibling `./CollectionEditView` import is unaffected (still a sibling, in the new folder).

**Edit 1** (lines 7, 10–13):
```ts
import type * as Documents from "../../documents";
```
```ts
import { renderView } from "../../testing/harness/viewHarness";
import { testCollection } from "../../testing/harness/accessFixtures";
import schema, { testModules } from "../../testing/convex/schema";
import { runViewSuite } from "../../testing/viewSuite";
```

Rest of the file (`import { CollectionEditView } from "./CollectionEditView";` at line 9 is unchanged — same folder) is unchanged.

#### packages/react/src/collections/listView/CreateDocumentForm.tsx

Moved from `collections/CreateDocumentForm.tsx`. Every `../`-relative import gains one more `../`.

**Edit 1** (lines 4–10):
```ts
import { Button, DialogFooter } from "../../ui";
import { getDataFields, type CollectionConfig, vexConvexApi } from "@vexcms/core";
import { AppForm } from "../../forms";
import { RenderFields } from "../../fields/RenderFields";
import { useFieldsForm } from "../../fields/useFieldsForm";
import { useVexMutation } from "../../hooks";
import { applyVexFieldErrors } from "../../utils/errors";
```

Rest of the file is unchanged.

#### packages/react/src/collections/listView/CreateDocumentForm.test.tsx

Moved from `collections/CreateDocumentForm.test.tsx`. Every `../`-relative import gains one more `../`; the sibling `./CreateDocumentForm` import is unaffected.

**Edit 1** (lines 11–19):
```ts
import {
  renderWithVexProviders,
  testCollection,
} from "../../testing/harness/accessFixtures";
import {
  createFakeConvexClient,
  type ConvexTestInstance,
} from "../../testing/convex/bridge";
import schema, { readTable, testModules } from "../../testing/convex/schema";
```

Rest of the file is unchanged.

#### packages/react/src/collections/listView/CreateDocumentModal.tsx

Moved from `collections/CreateDocumentModal.tsx`. Every `../`-relative import gains one more `../`; the sibling `./CreateDocumentForm` import is unaffected (still a sibling, in the new folder).

**Edit 1** (lines 4–10):
```ts
import { DialogContent, DialogHeader } from "../../ui";
import { Modal } from "../../modals/BaseModal";
import { type CollectionSlug } from "@vexcms/core";
import { MODALS } from "../../modals/constants";
import { CreateDocumentForm } from "./CreateDocumentForm";
import { useVexConfig } from "../../config/VexConfigContext";
import { parseAsBoolean, useQueryState } from "nuqs";
```

Rest of the file is unchanged.

#### packages/react/src/collections/listView/CreateDocumentModal.test.tsx

Moved from `collections/CreateDocumentModal.test.tsx`. Its one import gains one more `../`.

**Edit 1** (line 1):
```ts
import { runModalSuite } from "../../testing/modalSuite";
```

Rest of the file is unchanged.

#### packages/react/src/collections/index.ts

Full file, re-pointed at the new subfolders.

```ts
export * from "./editView/CollectionEditView";
export * from "./editView/CollectionDeleteAction";
export * from "./editView/CollectionDuplicateMenuItem";
export * from "./editView/useDuplicateCollectionDocument";
export * from "./listView/CollectionListView";
export * from "./listView/CreateDocumentForm";
export * from "./listView/CreateDocumentModal";
```

#### packages/react/src/collections/editView/CollectionDeleteAction.tsx

Moved from `collections/CollectionDeleteAction.tsx`. Every `../`-relative import gains one more `../`; no sibling imports.

**Edit 1** (lines 5–24, import block below `"use client"` and the `@vexcms/core` import):
```ts
import { useVexDocument } from "../../documents/VexDocumentContext";
import { useVexConfig } from "../../config/VexConfigContext";
import { useVexMutation } from "../../hooks";
import { usePermission } from "../../access";
import { adminHref } from "../../admin/adminHref";
import { useVexNavigate } from "../../config/useVexNavigate";
import { useReleaseUnsavedChangesGuard } from "../../documents/useUnsavedChangesGuard";
import { useEditActionsMenuDialog } from "../../documents/EditActionsMenuDialogContext";
import { EditActionsMenuItem } from "../../documents/EditActionsMenuItem";
import type { ActionPlacement } from "../../ui/ActionsMenu";
import { Button, Icon } from "../../ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../../ui/dialog";
```

Rest of the file (component body, JSX, exports) is unchanged.

#### packages/react/src/collections/editView/CollectionDuplicateMenuItem.tsx

Moved from `collections/CollectionDuplicateMenuItem.tsx`. Every `../`-relative import gains one more `../`, except the two sibling imports: `useDuplicateCollectionDocument` moves into the same `editView/` folder and stays `./`, while `CreateDocumentForm` moves into the cousin `listView/` folder.

**Edit 1** (lines 7–18, import block):
```ts
import { usePermission } from "../../access";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";
import { useVexNavigate } from "../../config/useVexNavigate";
import { useReleaseUnsavedChangesGuard } from "../../documents/useUnsavedChangesGuard";
import { useVexDocument } from "../../documents/VexDocumentContext";
import { useEditActionsMenuDialog } from "../../documents/EditActionsMenuDialogContext";
import { EditActionsMenuItem } from "../../documents/EditActionsMenuItem";
import { Dialog, DialogContent, DialogHeader, Icon } from "../../ui";
import { ModalSurfaceProvider } from "../../modals";
import { CreateDocumentForm } from "../listView/CreateDocumentForm";
import { useDuplicateCollectionDocument } from "./useDuplicateCollectionDocument";
```

Rest of the file (component body, JSX, exports) is unchanged.

#### packages/react/src/collections/editView/useDuplicateCollectionDocument.ts

Moved from `collections/useDuplicateCollectionDocument.ts`. Every `../`-relative import gains one more `../`; no sibling imports.

**Edit 1** (lines 9–13, import block below the `@vexcms/core` import):
```ts
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";
import { useVexMutation } from "../../hooks";
import { useVexNavigate } from "../../config/useVexNavigate";
import { useReleaseUnsavedChangesGuard } from "../../documents/useUnsavedChangesGuard";
```

Rest of the file (hook body, exports) is unchanged.

#### packages/react/src/fields/relationship/RelationshipPicker.tsx

**Edit 1** (line 16):
```ts
import { CreateDocumentForm } from "../../collections/listView/CreateDocumentForm";
```

Rest of the file is unchanged.

#### packages/react/src/fields/relationship/RelationshipPicker.test.tsx

**Edit 1** (line 32):
```ts
vi.mock("../../collections/listView/CreateDocumentForm", () => ({
```

Rest of the file is unchanged.

#### packages/react/src/testing/modalSuite.tsx

**Edit 1** (line 16):
```ts
import { CreateDocumentModal } from "../collections/listView/CreateDocumentModal";
```

Rest of the file is unchanged.

#### .agent/docs/standards/naming-conventions.md

The `react-feature-folders` rule's description gets a closed-subfolder carve-out for `collections/`. Everything else about the rule (pattern, scope, examples, counter-examples) is unchanged; only the `description` field grows a final sentence:

**Edit 1** (append to the `react-feature-folders` rule's `description`, after the existing "...never one named after a UI surface, view, or feature..." sentence):
```yaml
    description: "The react package's top level is a CLOSED set of domain folders mirroring core/src/ (access, admin, auth, client, collections, config, documents, fields, forms, globals, hooks, livePreview, media, modals, revalidate, slots, testing, ui, utils, versions) plus adapter.ts and index.ts. A new top-level folder is allowed only for a new domain that core/src/ also has, and is added to this list in the same change; never one named after a UI surface, view, or feature (list/, edit/, data/, views/, table/, filters/, actions/). Placement: code serving ONE domain's view lives in that domain folder with a domain/view name prefix (media/MediaCollectionListView.tsx). Code shared by several domains' views goes in the existing domain that owns the share. `collections/` is the one exception to the flat-with-prefix rule: it holds a CLOSED set of feature subfolders — `listView/`, `editView/`, `api/` — each camelCase like `livePreview/`, each holding every component/hook/helper for that feature with the redundant `Collection` prefix dropped from new in-folder file names (listView/ListToolbar.tsx); public root components keep their names (listView/CollectionListView.tsx, listView/CreateDocumentModal.tsx, editView/CollectionEditView.tsx). A new collections/ subfolder needs the developer's approval and an addition to this list."
```

#### .agent/docs/standards/anti-patterns.md

AP-023 stays verbatim (it is a historical record of a past mistake, append-only, never compacted) and gets one dated addendum line appended directly beneath it:

**Edit 1** (insert immediately after AP-023's existing text, as its own line):
```md
  (2026-10-27) Superseded in part: `collections/{listView,editView}` are developer-approved feature subfolders — see `react-feature-folders`.
```

Verify: `harness struct` (regenerate `directory-structure.md` to reflect `collections/{listView,editView,api}`), then run the full `packages/react` typecheck and test suite — every moved test and every updated import site above must resolve and pass, with `grep -rn "collections/CollectionListView\"\|collections/CollectionEditView\"\|collections/CreateDocumentForm\"\|collections/CreateDocumentModal\"\|collections/CollectionDeleteAction\"\|collections/CollectionDuplicateMenuItem\"\|collections/useDuplicateCollectionDocument\"" packages apps` returning zero hits outside this spec file and changelog prose.

### Step 3 — Status enum replaces string literals [agent]

Why: approval stages and branches will add states later; badges/filters must iterate `VERSION_STATUSES`, not switch on two literals.

This step anchors against the CURRENT working-tree edit-view overhaul (`2026-10-26-edit-view-overhaul`, unstaged), not an earlier draft: `DraftToolbar` no longer exists (deleted — its status prop moved into `VexDocumentProvider`'s `status` field and a direct `<StatusBadge>` call in each view's header), and the published/draft timeline math that used to live inline in `CollectionEditView`/`GlobalEditView`/`VersionHistoryDropdown` now lives in three new `versions/` files (`VersionHistoryPanel.tsx`, `VersionPublishAction.tsx`, `VersionUnpublishAction.tsx`) plus `showsUnpublish.ts`.

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

#### packages/react/src/versions/StatusBadge.tsx

1 edit — everything else unchanged.

**1 — JSDoc example (`@example`), anchor `<StatusBadge status={isDraftDoc ? "draft" : "published"} />`.**

```tsx
 * @example
 * ```tsx
 * <StatusBadge status={isDraftDoc ? VERSION_STATUSES.draft.key : VERSION_STATUSES.published.key} />
 * ```
 */
```

#### packages/react/src/collections/editView/CollectionEditView.tsx

2 edits — everything else unchanged. `VERSION_STATUSES` is already imported from `@vexcms/core` (used for `isDraftDoc`). This is the post-Step-2 location of today's `collections/CollectionEditView.tsx`; anchor against the moved file, not the pre-move path. `DraftToolbar` (deleted by the edit-view overhaul) no longer exists — the two remaining literal sites are `VexDocumentProvider`'s `status` field and the header `<StatusBadge>`.

**1 — `VexDocumentProvider`'s `status` field, anchor `status: isVersioned ? (isDraftDoc ? "draft" : "published") : undefined,`.**

```tsx
          status: isVersioned
            ? isDraftDoc
              ? VERSION_STATUSES.draft.key
              : VERSION_STATUSES.published.key
            : undefined,
```

**2 — header `<StatusBadge>`, anchor `{isVersioned && <StatusBadge status={isDraftDoc ? "draft" : "published"} />}`.**

```tsx
                {isVersioned && (
                  <StatusBadge
                    status={isDraftDoc ? VERSION_STATUSES.draft.key : VERSION_STATUSES.published.key}
                  />
                )}
```

#### packages/react/src/globals/GlobalEditView.tsx

5 edits — everything else unchanged.

**1 — imports, add `VERSION_STATUSES` alongside the existing `@vexcms/core` import, and `VexVersionStatus` to the type-only import.**

```tsx
  resolveLivePreviewSettings,
  SLOT_IDS,
  VERSION_STATUSES,
  vexConvexApi,
} from "@vexcms/core";
import type { EditComponentsConfig, EditComponentsConfigInput, VexVersionStatus } from "@vexcms/core";
```

**2 — `isDraftDoc`, anchor `(globalDoc as { vex_status?: "draft" | "published" } | undefined)?.vex_status === "draft";`.**

```tsx
  const isDraftDoc =
    (globalDoc as { vex_status?: VexVersionStatus } | undefined)?.vex_status ===
    VERSION_STATUSES.draft.key;
```

**3 — `documentStatus`, anchor `isVersioned && globalDoc ? (isDraftDoc ? "draft" : "published") : undefined;`.**

```tsx
  const documentStatus =
    isVersioned && globalDoc
      ? isDraftDoc
        ? VERSION_STATUSES.draft.key
        : VERSION_STATUSES.published.key
      : undefined;
```

**4 — `VexDocumentProvider`'s `status` field, anchor `status: isVersioned && globalDoc ? (isDraftDoc ? "draft" : "published") : undefined,`.**

```tsx
          status: isVersioned && globalDoc
            ? isDraftDoc
              ? VERSION_STATUSES.draft.key
              : VERSION_STATUSES.published.key
            : undefined,
```

**5 — header `<StatusBadge>`, anchor `{isVersioned && globalDoc && (<StatusBadge status={isDraftDoc ? "draft" : "published"} />)}`.**

```tsx
              {isVersioned && globalDoc && (
                <StatusBadge
                  status={isDraftDoc ? VERSION_STATUSES.draft.key : VERSION_STATUSES.published.key}
                />
              )}
```

#### packages/react/src/versions/VersionPublishAction.tsx

2 edits — everything else unchanged.

**1 — imports, add `VERSION_STATUSES` to the existing `@vexcms/core` import.**

```tsx
import {
  DRAFT_ACTIONS,
  getDataFields,
  getFieldsDefaultValues,
  valuesEqual,
  VERSION_STATUSES,
  vexConvexApi,
  type EditSlotProps,
} from "@vexcms/core";
```

**2 — `isDraftDoc`, anchor `document.status === "draft";`.**

```tsx
  const isDraftDoc = document.status === VERSION_STATUSES.draft.key;
```

#### packages/react/src/versions/VersionUnpublishAction.tsx

2 edits — everything else unchanged.

**1 — imports, add `VERSION_STATUSES` to the existing `@vexcms/core` import.**

```tsx
import { DRAFT_ACTIONS, VERSION_STATUSES, vexConvexApi, type EditSlotProps } from "@vexcms/core";
```

**2 — `publishedTimeline`, anchor `.filter((row) => row.status === "published" && row.publishedAt !== null)`.**

```tsx
  const publishedTimeline = (unpublishVersions ?? [])
    .filter((row) => row.status === VERSION_STATUSES.published.key && row.publishedAt !== null)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
```

#### packages/react/src/versions/VersionHistoryPanel.tsx

2 edits — everything else unchanged.

**1 — imports, add `VERSION_STATUSES` to the existing `@vexcms/core` import.**

```tsx
import {
  DRAFT_ACTIONS,
  VERSION_STATUSES,
  vexConvexApi,
  type CollectionSlug,
  type GlobalSlug,
  type VersionSummary,
} from "@vexcms/core";
```

**2 — `publishedVersion`, anchor `.filter((row) => row.status === "published")`.**

```tsx
  const publishedVersion = rows
    .filter((row) => row.status === VERSION_STATUSES.published.key)
    .reduce<VersionSummary | undefined>(
      (latest, row) => (latest && (latest.publishedAt ?? 0) >= (row.publishedAt ?? 0) ? latest : row),
      undefined,
    )?.version;
```

#### packages/react/src/versions/showsUnpublish.ts

2 edits — everything else unchanged.

**1 — imports, add the `VERSION_STATUSES` import above the two existing type-only imports.**

```ts
import { VERSION_STATUSES } from "@vexcms/core";
import type { VexDocumentState } from "../documents/VexDocumentContext";
import type { DocumentEditRuntimeState } from "../documents/DocumentEditRuntimeContext";
```

**2 — the return expression, anchor `document.status === "published" && !document.isDirty && runtime.viewedVersion === null;`.**

```ts
  return (
    document.status === VERSION_STATUSES.published.key &&
    !document.isDirty &&
    runtime.viewedVersion === null
  );
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

This step runs after Step 2's move of `CollectionEditView.tsx` → `collections/editView/` and `CollectionListView.tsx` → `collections/listView/`; both are edited in place at their new paths, no further relocation here.

### Step 4 — `admin.table` config surface + config-time validation [agent]

Why: every control ships with the key that drives it; bad `searchField` / unindexed sort must fail at `defineConfig`, naming the index to declare. Also carries Decision 35's `countLimit` (capped total count), which belongs on the same config surface.

- [ ] `packages/core/src/collections/types.ts` — `CollectionTableSort<TFieldSlug>`; `searchField?: readonly TFieldSlug[]`; `defaultSort` typed to field slugs + `_creationTime`; `defaultColumns?: TFieldSlug[]`; `countLimit?: number`; `AdminCollectionConfigInput`/`AdminCollectionConfig` thread `TFieldSlug` into `table`
- [ ] `packages/core/src/fields/baseTypes.ts` — `admin.enableSorting?: boolean` / `admin.enableHiding?: boolean` on `FieldAdminConfigInput` and resolved `FieldAdminConfig`
- [ ] `packages/core/src/collections/config.ts` — resolve defaults (no `searchField` → search hidden; `defaultColumns` → all non-hidden fields; `enableSorting`/`enableHiding` default `false`; `countLimit` default `1000`); wires `validateTableConfig`
- [ ] `packages/core/src/collections/validateTableConfig.ts` (new) + `packages/core/src/collections/validateTableConfig.test.ts` (new) — throws `VexConfigError` when a `searchField` entry has no `searchIndex`, or `defaultSort.field` / an `enableSorting` field has no index leading with it (via `resolveCollectionIndexes`); message names field + index to declare
- [ ] `packages/core/src/collections/validator.test.ts` — test confirming `.searchIndex()` is emitted for every field with its own `searchIndex`, independent of `useAsTitle`/incoming relationships
- [ ] `packages/core/src/collections/config.test.ts` — type tests: `admin.table.searchField`, `defaultSort.field`, `defaultColumns` reject unknown field slugs; `countLimit` defaults to `1000`

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

**2 — `CollectionTableConfigInput` gains a `TFieldSlug` type param, the table-surface keys, and `countLimit`.** Replaces the whole interface body.

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

  /**
   * Caps the total-count scan on the list's first page (Decision 35): `find`
   * counts with `take(countLimit + 1)` instead of `.collect()`, and returns
   * `totalDocsCapped: true` once the cap is hit. The UI shows "N+" in that
   * case. Protects against an unbounded scan re-running on every write
   * while a large collection's list is open.
   *
   * @default 1000
   */
  countLimit?: number;
}
```

**3 — `CollectionTableConfig` (resolved) mirrors the same keys, including `countLimit`.** Replaces the whole interface body.

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
  /** Cap on the first page's total-count scan (Decision 35). */
  countLimit: number;
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

**3 — `defineCollection`'s return construction** computes `defaultColumns`, defaults `countLimit`, and calls `validateTableConfig` before returning. Replaces everything from the `populateCollectionFieldMeta` call through the end of the function (anchor: the `// Runs the injected field through the same `collectionSlug` meta-stamping` comment through the function's closing `}`).

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
        // Decision 35: caps the first-page total-count scan.
        countLimit: 1000,
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
  } as CollectionConfig<TFieldMeta & CollectionFieldMeta, TCollectionSlug, TFields, TComponent, TDrafts>;

  // Config-time guard for Decisions 3 & 6: a `searchField` entry with no
  // `searchIndex`, or a sortable field with no leading index, is a project
  // bug caught here rather than surfacing as a broken control in the browser.
  // Config-view `where`/sort validation (Decision 25) is NOT performed here —
  // `AdminCollectionConfigInput.table.views` and `VexViewConfig` don't exist
  // until Step 5, which validates them separately once that type lands.
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
 * Does NOT validate `admin.table.views` (config views, Decision 25) —
 * `VexViewConfig` is introduced in Step 5, which owns that check (a config
 * view's `where` field names and `sort.field` against the same
 * `resolveCollectionIndexes` / readable-field rules), run from the same
 * `defineCollection` call site alongside this function. It also does not
 * validate `countLimit` (Decision 35) — any number is accepted; `find`
 * clamps nothing beyond what `take(countLimit + 1)` does naturally.
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
          'index. Add index: "by_${fieldKey}" to the "${fieldKey}" field, or a collection-level ' +
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

  it("defaults admin.table.countLimit to 1000 (Decision 35)", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.admin.table.countLimit).toBe(1000);
  });

  it("accepts an explicit admin.table.countLimit override", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      admin: { table: { countLimit: 5000 } },
    });
    expect(posts.admin.table.countLimit).toBe(5000);
  });
});
```

### Step 5 — `VIEW_ACTIONS` access actions, `vex_views` table, and `composeViewWhere` [agent]

Why: shared views need a store and a gate; default denied (fail-closed). Decision 25 gives `find`/`search` a client-composed `where` instead of a server-side `view` argument: `find`/`search` take **no `view` argument** and know nothing about views. `collection.admin.table.views` (full, `where` intact) still ships to the browser like the rest of `VexClientConfig` (directly imported per P-004, so hiding `where` behind a client-facing type would change nothing: the string is already in the JS). `VexClientViewConfig` / `toClientViewConfig` is the one conversion point every UI READ goes through (stripping `where` for display, computing `hasHiddenFilter`/`hiddenFilterCount`), while `composeViewWhere` (new this step) is the one place a config view's raw `where` is read to BUILD the `where` the client actually sends — called client-side wherever the list composes its query (Step 8's `useVexListQuery`, fed by Step 12's `useListViews`), straight off the bundled config. Step 7's `listViews` query never touches a `config`-source view at all, returning `shared` views only. Step 4 also deferred validating `admin.table.views` entries against the rest of a collection's config (unknown `where` fields, an unindexed `sort`, an undeclared `searchField`, unknown `columns`) until `VexViewConfig` existed — this step closes that gap alongside the existing `searchField`/sort checks, with the same fail-at-`defineConfig` posture.

- [ ] `packages/core/src/access/constants.ts` — `VIEW_ACTIONS = { readViews, createView, updateView, deleteView }`; `readViews` added to `QUERY_ACTIONS`
- [ ] `packages/core/src/access/types.ts` — `HasTable` guard; `ViewAction` wired into `SubjectMap`'s per-resource action union (collections only)
- [ ] `packages/core/src/schema/generateVexSchema.ts` + `packages/core/src/schema/generateVexSchema.test.ts` — emit `vex_views` unconditionally, with an optional `description` column
- [ ] `packages/core/src/collections/constants.ts` — `VEX_VIEW_SOURCES` map + derived `VexViewSource` union
- [ ] `packages/core/src/collections/types.ts` — `VexViewState`, `VexViewConfig` (+ `description`), `VexStoredView`, `VexClientViewState`, `VexClientViewConfig`; completes `admin.table.views` Step 4 deferred
- [ ] `packages/core/src/collections/toClientViewConfig.ts` (new) + `packages/core/src/collections/toClientViewConfig.test.ts` (new) — strips a config view's `where`, computing `hasHiddenFilter`/`hiddenFilterCount` (Decision 25)
- [ ] `packages/core/src/collections/composeViewWhere.ts` (new) + `packages/core/src/collections/composeViewWhere.test.ts` (new) — `composeViewWhere({ viewWhere, filter })` → `{ and: [viewWhere, filter] }` or whichever is present (Decision 25); the client's one AND point for a config view's hidden filter, full code
- [ ] `packages/core/src/collections/index.ts` — exports `toClientViewConfig` and `composeViewWhere` so Step 8/12 (`useVexListQuery`, `useListViews`) can call them client-side
- [ ] `packages/core/src/collections/validateTableConfig.ts` + `packages/core/src/collections/validateTableConfig.test.ts` — config-time `viewId` uniqueness, PLUS per-view `where`-field, `sort`-index, `searchField`, and `columns` checks

This step also completes the `admin.table.views` surface Step 4 deferred (`VexViewConfig` didn't exist yet): threads `views` through `CollectionTableConfigInput`/`CollectionTableConfig`, resolves its `[]` default in `collections/config.ts` (unchanged by this step — `input.admin?.table?.views ?? []` already passes every view field, including `description`, straight through), and adds the config-time checks above to Step 4's `validateTableConfig.ts`.

Verify: `pnpm --filter @vexcms/core test -- access schema collections`

#### packages/core/src/access/constants.ts

2 edits — everything else in this file is unchanged.

**1 — new action group, directly after `DraftAction`'s union type and before `QUERY_ACTIONS`.** Shared views get four actions mirroring the draft actions (Decision 13): `readViews` is query-shaped (it feeds `QUERY_ACTIONS` directly below, like `DRAFT_ACTIONS.readDrafts` does) — it gates `listViews`, the use of shared views, and `find`'s shared-view allow-list (Decision 26). `createView`/`updateView`/`deleteView` are plain mutation-shaped actions gating the `saveView`/`removeView` mutations Step 7 adds.

```ts
/**
 * Access actions gating SHARED (`vex_views`) saved views (decision 13).
 * Present on every collection that has a resolved `admin.table` (see
 * {@link HasTable} in `access/types.ts`) — globals have no list view and
 * never carry them.
 *
 * - `readViews` is query-shaped (see {@link QUERY_ACTIONS} below) — it
 *   gates `listViews`, the use of shared views, and `find`'s shared-view
 *   allow-list (decision 26).
 * - `createView` gates saving a new shared view and promoting a local view.
 * - `updateView` gates saving changes to and renaming a shared view.
 * - `deleteView` gates deleting a shared view.
 *
 * Undeclared like every other action (P-007): a role matrix that never
 * mentions one of these resolves it to denied, so shared-view reads and
 * writes are all fail-closed by default. A caller without `createView` can
 * still save views locally — `listView/listViewStore.ts` (Step 12) never
 * calls `hasPermission` for the `local` source.
 */
export const VIEW_ACTIONS = {
  readViews: "readViews",
  createView: "createView",
  updateView: "updateView",
  deleteView: "deleteView",
} as const;
/** View action union, derived from {@link VIEW_ACTIONS}. */
export type ViewAction = (typeof VIEW_ACTIONS)[keyof typeof VIEW_ACTIONS];
```

**2 — `QUERY_ACTIONS` gains `readViews`, beside `readDrafts`.** Mirrors `readDrafts: DRAFT_ACTIONS.readDrafts` — `readViews` is now a query-shaped action, so a role may narrow it with `withIndex`/`filter` like any other query action (the mechanism `find`'s shared-view allow-list, Step 6, reuses via `resolveQueryConstraint`).

```ts
export const QUERY_ACTIONS = {
  read: CRUD_ACTIONS.read,
  readDrafts: DRAFT_ACTIONS.readDrafts,
  readViews: VIEW_ACTIONS.readViews,
} as const;
```

#### packages/core/src/access/types.ts

3 edits — everything else in this file is unchanged. No change to `hasPermission.ts`: an undeclared action already resolves to denied (P-007), so all four `VIEW_ACTIONS` are fail-closed the moment `ViewAction` is wired into the action union below — Step 7's `listViews`/`saveView`/`removeView` server functions are the first runtime callers (`hasPermission({ resource: collection, action: VIEW_ACTIONS.createView, throwOnDenied: true })` and friends).

**1 — import `ViewAction` into the existing `./constants` import, beside `type DraftAction`.**

```ts
  type DraftAction,
  type ViewAction,
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

**1 — new `vexViewsTable` constant, directly after the `vexVersionsTable` declaration (before `let globalsTable = "";`).** Unconditional like `vex_versions` (Decision 16): shared views need a backing table regardless of whether any collection declares `admin.table.views`, since a view can also be saved later from the UI. `description` sits beside `name` — the flat order a `VexViewConfig` (this step's `collections/types.ts` edit below) authors in.

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
    "  description: v.optional(v.string()),",
    "  state: v.any(),",
    "  organizationId: v.optional(v.string()),",
    "  createdBy: v.string(),",
    "})",
    '  .index("by_collection", ["collection"])',
    '  .index("by_collection_org", ["collection", "organizationId"])',
    '  .index("by_view_id", ["viewId"])',
  ].join("\n");
```

**2 — include it in the generated output, in the `return success([...])` call.**

```ts
  return success(
    [header, imports, collectionSchemas, vexVersionsTable, vexViewsTable, globalsTable].join("\n"),
  );
```

#### packages/core/src/schema/generateVexSchema.test.ts

1 addition — everything else in this file is unchanged. New top-level `describe` block, immediately after `describe("generateVexSchema — versioned collections", ...)` closes and before `describe("generateVexSchema — globals", ...)` begins.

```ts
describe("generateVexSchema — vex_views", () => {
  it("emits vex_views unconditionally, even when no collection declares admin.table.views", () => {
    const config = defineConfig({
      collections: [defineCollection({ slug: "posts", fields: { title: text() } })],
    });
    const { contents } = generateVexSchema({ config });

    expect(contents).toContain("export const vex_views = defineTable({");
    expect(contents).toContain("collection: v.string(),");
    expect(contents).toContain("viewId: v.string(),");
    expect(contents).toContain("name: v.string(),");
    expect(contents).toContain("description: v.optional(v.string()),");
    expect(contents).toContain("state: v.any(),");
    expect(contents).toContain("organizationId: v.optional(v.string()),");
    expect(contents).toContain("createdBy: v.string(),");
    expect(contents).toContain('.index("by_collection", ["collection"])');
    expect(contents).toContain('.index("by_collection_org", ["collection", "organizationId"])');
    expect(contents).toContain('.index("by_view_id", ["viewId"])');
  });
});
```

#### packages/core/src/collections/constants.ts

1 edit — everything else in this file is unchanged. Appended at the end of the file, after `CollectionSystemField`.

**1 — new const map + type.** Follows the same `as const` map → derived-union shape as `CONVEX_SYSTEM_FIELDS`/`COLLECTION_SYSTEM_FIELDS` above it (P-003), instead of a bare literal union.

```ts

/**
 * Where a saved view's state came from, once the three sources (Decision 11)
 * are merged by `viewId` for display:
 *
 * - `config` — declared in code via `admin.table.views`; always read-only.
 * - `shared` — a `vex_views` row; readable with `VIEW_ACTIONS.readViews`, editable by callers with `createView`/`updateView`/`deleteView`.
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

4 edits, applied on top of Step 4's `CollectionTableConfigInput<TFieldSlug>` / `CollectionTableConfig<TFieldSlug>` — everything else in this file is unchanged.

**1 — import `VexWhereNodeOf` beside the other type-only imports.** Matches the existing `collections/api/types.ts` convention of typing a stored/portable `where` as `VexWhereNodeOf<unknown>` (collection-structure-agnostic — Decision 9's "plain `VexWhereNode`"), rather than threading a second collection-slug generic through every saved-view type.

```ts
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";
```

**2 — `CollectionTableConfigInput<TFieldSlug>` gains `views`.** Anchor: the `defaultColumns?: TFieldSlug[];` member that closes the interface (Step 4's edit 2).

```ts
  defaultColumns?: TFieldSlug[];

  /**
   * Config-declared saved views for this collection's list table — read-only
   * in the admin panel (Decision 11's `config` source). Merged at render time
   * with `shared` (`vex_views`) and `local` (browser) views by `viewId`
   * (`useListViews`, Step 12). Every `viewId` must be unique within
   * this array, every `where` must only name this collection's own fields
   * (plus `"_creationTime"`/`"vex_status"`), every `sort.field` must lead a
   * declared index, every `searchField` must be declared on `searchField`
   * above, and every `columns` entry must be a known field — all checked by
   * `validateTableConfig`.
   *
   * **Hidden view filters are hidden from the UI, not secret.** A view's
   * `state.where` ships in the client bundle like an access rule (P-004,
   * Decision 25) — don't encode sensitive thresholds or identifiers in it.
   * UI code never reads `state.where` directly; it reads the
   * {@link VexClientViewConfig} projection `toClientViewConfig` builds
   * instead, which replaces `where` with `hasHiddenFilter`/`hiddenFilterCount`.
   * The ONE other reader of the raw `where` is `composeViewWhere`
   * (`collections/composeViewWhere.ts`, this step), which ANDs it into the
   * `where` the client sends — `find`/`search` take no `view` argument.
   *
   * @default []
   */
  views?: VexViewConfig<TFieldSlug>[];
```

**3 — `CollectionTableConfig<TFieldSlug>` (resolved) mirrors it, always present.** Anchor: the `defaultColumns: TFieldSlug[];` member that closes the interface (Step 4's edit 3).

```ts
  defaultColumns: TFieldSlug[];

  /** Config-declared saved views for this collection's list table, `where` intact — UI code reads it only through {@link VexClientViewConfig} (`toClientViewConfig`) or `composeViewWhere`, never directly. See the `views` warning on `CollectionTableConfigInput`. */
  views: VexViewConfig<TFieldSlug>[];
```

**4 — new types, at the end of the file, after `CollectionConfig`.** `CollectionTableSort<TFieldSlug>` is Step 4's type, declared earlier in this same file; TypeScript type aliases resolve regardless of declaration order within a module, so this forward reference is safe.

```ts

/**
 * One saved view's filter/sort/search/column/page-size state — the shape
 * stored by a config view (`admin.table.views`), a shared `vex_views` row,
 * and a local view, and read/written by the URL (`useListUrlState`,
 * Step 10).
 *
 * `where` is collection-structure-agnostic (`VexWhereNodeOf<unknown>`): a
 * saved/URL view is a portable JSON blob, not re-validated against the
 * owning collection's exact field union until it is applied. On a `config`
 * view, `where`'s field names ARE checked against the real collection, but
 * at `defineCollection` time (`validateTableConfig`), not by this type.
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
 * One saved view: an identity (`viewId`, `name`, optional `description`)
 * plus its {@link VexViewState}. The shape of `admin.table.views` entries
 * (config source) and of `listView/listViewStore.ts`'s local entries
 * (Step 12); {@link VexStoredView} extends it for the `shared` (`vex_views`)
 * source.
 *
 * This is the full shape — `state.where` intact. It is what
 * `CollectionConfig.admin.table.views` resolves to (above), and it ships to
 * the browser whole, as part of `VexClientConfig` (Decision 25: hidden from
 * the UI, not secret). `find`/`search` take no `view` argument and never see
 * this type — the client reads `state.where` directly in exactly two places:
 * `composeViewWhere` (`collections/composeViewWhere.ts`, this step,
 * CLIENT-SIDE, to build the plain `where` it sends) and `toClientViewConfig`
 * (`collections/toClientViewConfig.ts`, this step, CLIENT-SIDE, called by
 * `useListViews`, Step 12, to strip `where` for display). Server-side,
 * `matchDeclaredViewFilter` (Step 6) separately reads a collection's config
 * views' `where` to recognize a trusted declared filter inside the request
 * `where` it receives — it never reads THIS type, only the collection's own
 * `admin.table.views` off `VexConfig`. Everything else in `@vexcms/react`
 * reads a `config`-source view through {@link VexClientViewConfig} instead.
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexViewConfig<TFieldSlug extends string = string> = {
  viewId: string;
  name: string;
  description?: string;
  state: VexViewState<TFieldSlug>;
};

/**
 * A `vex_views` row shape: a {@link VexViewConfig} plus the fields only a
 * shared, server-stored view carries — which collection it belongs to, the
 * organization it is scoped to when `access.orgCollectionSlug` is set
 * (Decision 12), and who created it. A shared view's `where` is the
 * caller's own, built through the filter builder UI — unlike a `config`
 * view's, it is never hidden (Decision 25 is a `config`-source-only rule).
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexStoredView<TFieldSlug extends string = string> = VexViewConfig<TFieldSlug> & {
  collection: string;
  organizationId?: string;
  createdBy: string;
};

/** {@link VexViewState} with `where` removed — the shape {@link VexClientViewConfig} carries. */
export type VexClientViewState<TFieldSlug extends string = string> = Omit<
  VexViewState<TFieldSlug>,
  "where"
>;

/**
 * The client-safe projection of a `config`-source {@link VexViewConfig}
 * (Decision 25): every field except `state.where`, plus a hidden-filter
 * summary the UI renders as a lock badge — `hasHiddenFilter` (whether the
 * view has a `where` at all) and `hiddenFilterCount` (the number of leaf
 * conditions in its DNF tree, counting through `and`/`or`/`not`).
 *
 * Built by `toClientViewConfig` (`collections/toClientViewConfig.ts`),
 * called CLIENT-SIDE by `useListViews` (Step 12), straight off
 * `collection.admin.table.views` as read from the bundled `VexClientConfig`
 * — that object IS directly imported into client JS (P-004), so `state.where`
 * already shipped to the browser as plain text before this function ever
 * runs. `toClientViewConfig` doesn't keep `where` out of the bundle; it
 * keeps UI CODE from reading it, so the filter builder, chips, and every
 * other control only ever see `hasHiddenFilter`/`hiddenFilterCount`. Step
 * 7's `listViews` query never touches a `config`-source view at all — it
 * returns `shared` views only. To actually QUERY a config view, the list
 * passes the RAW `VexViewConfig` (not this type) to `composeViewWhere`.
 *
 * `shared` and `local` views need no client projection — their `where` is
 * the caller's own and travels as a full {@link VexStoredView} / local
 * {@link VexViewConfig}.
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexClientViewConfig<TFieldSlug extends string = string> = {
  viewId: string;
  name: string;
  description?: string;
  state: VexClientViewState<TFieldSlug>;
  hasHiddenFilter: boolean;
  hiddenFilterCount: number;
};
```

#### packages/core/src/collections/toClientViewConfig.ts

New file.

```ts
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";
import type { VexClientViewConfig, VexViewConfig } from "./types";

/**
 * Counts the leaf conditions in a {@link VexWhereNodeOf} tree, walking
 * `and`/`or`/`not` recursively. One leaf is one condition a user would see
 * as one row in the filter builder, so this is what `hiddenFilterCount`
 * reports.
 *
 * @param node - The where tree, or a branch of it during recursion.
 * @returns The number of leaf conditions under `node`, inclusive.
 */
function countWhereLeaves(node: VexWhereNodeOf<unknown>): number {
  if ("and" in node) return node.and.reduce((sum, child) => sum + countWhereLeaves(child), 0);
  if ("or" in node) return node.or.reduce((sum, child) => sum + countWhereLeaves(child), 0);
  if ("not" in node) return countWhereLeaves(node.not);
  return 1;
}

/**
 * Converts a full {@link VexViewConfig} (a config view resolved from
 * `admin.table.views`, `where` intact) into the {@link VexClientViewConfig}
 * shape UI code is allowed to read (Decision 25).
 *
 * Called CLIENT-SIDE only — by `useListViews` (Step 12), once per
 * `config`-source view read straight off the bundled `VexClientConfig`.
 * `state.where` already shipped to the browser as plain JS before this ever
 * runs (Decision 25: hidden from the UI, not secret, like an access rule) —
 * this function doesn't keep `where` out of the bundle, it keeps UI CODE
 * from reading it, so the filter builder, chips, and every other control
 * only ever see `hasHiddenFilter`/`hiddenFilterCount`. Step 7's `listViews`
 * query never calls this — it returns `shared` views only. To actually
 * QUERY a config view, the list calls `composeViewWhere` on the RAW
 * `VexViewConfig`, not on this function's output.
 *
 * @param view - The full config-source view, `where` intact.
 * @returns The client-safe view: `where` replaced by `hasHiddenFilter`
 *   (whether `where` was set) and `hiddenFilterCount` (its leaf-condition
 *   count).
 */
export function toClientViewConfig<TFieldSlug extends string = string>(
  view: VexViewConfig<TFieldSlug>,
): VexClientViewConfig<TFieldSlug> {
  const { where, ...state } = view.state;
  return {
    viewId: view.viewId,
    name: view.name,
    description: view.description,
    state,
    hasHiddenFilter: where !== undefined,
    hiddenFilterCount: where === undefined ? 0 : countWhereLeaves(where),
  };
}
```

#### packages/core/src/collections/toClientViewConfig.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";

import { toClientViewConfig } from "./toClientViewConfig";
import type { VexViewConfig } from "./types";

describe("toClientViewConfig", () => {
  it("strips where and reports hasHiddenFilter/hiddenFilterCount for a single-condition where", () => {
    const view: VexViewConfig = {
      viewId: "approved",
      name: "Approved",
      state: { where: { field: "status", op: "eq", value: "approved" } },
    };

    const result = toClientViewConfig(view);

    expect(result).not.toHaveProperty("state.where");
    expect(result.hasHiddenFilter).toBe(true);
    expect(result.hiddenFilterCount).toBe(1);
  });

  it("counts every leaf condition across nested and/or/not groups", () => {
    const view: VexViewConfig = {
      viewId: "complex",
      name: "Complex",
      state: {
        where: {
          and: [
            { field: "status", op: "eq", value: "approved" },
            {
              or: [
                { field: "featured", op: "eq", value: true },
                { not: { field: "archived", op: "eq", value: true } },
              ],
            },
          ],
        },
      },
    };

    expect(toClientViewConfig(view).hiddenFilterCount).toBe(3);
  });

  it("omits description when the view has none", () => {
    const view: VexViewConfig = { viewId: "all", name: "All", state: {} };

    expect(toClientViewConfig(view).description).toBeUndefined();
  });
});
```

#### packages/core/src/collections/composeViewWhere.ts

New file. The one place a config view's hidden `where` is read client-side to build the `where` the client sends. `find`/`search` take no `view` argument at all — the client builds one plain `where` and sends that, same as any other caller `where`.

```ts
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";

/**
 * Composes a config view's hidden `where` with the caller's own filter into
 * the single plain `where` the client sends to `find`/`search` (Decision
 * 25). `find`/`search` take no `view` argument and know nothing about views
 * — the server only ever sees the result of this function, ANDed together
 * like any other caller `where`.
 *
 * `matchDeclaredViewFilter` (Step 6, SERVER-SIDE, inside `find`) is the one
 * place that re-derives which top-level AND part of the request `where` came
 * from a trusted config view — by deep-equality against the SAME `viewWhere`
 * this function composes from (the collection's own `admin.table.views`,
 * resolved server-side from `VexConfig`, not from anything the client
 * sends). Changing the declared filter client-side (dropping a condition,
 * editing a value, nesting it in an OR) breaks that deep-equality and the
 * whole part falls back to the ordinary field-read check (Decision 26).
 *
 * @param props - Input props.
 * @param props.viewWhere - The active config view's raw `where`
 *   (`VexViewConfig.state.where`, read straight off the bundled
 *   `VexClientConfig` — never a `VexClientViewConfig`, which has `where`
 *   stripped). Omitted when no view is active, or the active view has no
 *   hidden filter.
 * @param props.filter - The caller's own filter — the filter builder's
 *   compiled `VexWhereNode` from the URL's `filter` param. Omitted when the
 *   user hasn't added one.
 * @returns `{ and: [viewWhere, filter] }` when both are set, whichever one
 *   is set alone, or `undefined` when neither is set.
 */
export function composeViewWhere(props: {
  viewWhere?: VexWhereNodeOf<unknown>;
  filter?: VexWhereNodeOf<unknown>;
}): VexWhereNodeOf<unknown> | undefined {
  const { viewWhere, filter } = props;
  if (viewWhere !== undefined && filter !== undefined) return { and: [viewWhere, filter] };
  return viewWhere ?? filter;
}
```

#### packages/core/src/collections/composeViewWhere.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";

import { composeViewWhere } from "./composeViewWhere";

describe("composeViewWhere", () => {
  it("returns undefined when neither viewWhere nor filter is set", () => {
    expect(composeViewWhere({})).toBeUndefined();
  });

  it("returns viewWhere alone when filter is omitted", () => {
    const viewWhere = { field: "status", op: "eq", value: "approved" } as const;

    expect(composeViewWhere({ viewWhere })).toEqual(viewWhere);
  });

  it("returns filter alone when viewWhere is omitted", () => {
    const filter = { field: "source", op: "eq", value: "g2" } as const;

    expect(composeViewWhere({ filter })).toEqual(filter);
  });

  it("ANDs viewWhere and filter together when both are set", () => {
    const viewWhere = { field: "status", op: "eq", value: "approved" } as const;
    const filter = { field: "source", op: "eq", value: "g2" } as const;

    expect(composeViewWhere({ viewWhere, filter })).toEqual({ and: [viewWhere, filter] });
  });

  it("preserves a nested and/or/not filter unchanged when no viewWhere is active", () => {
    const filter = {
      or: [
        { field: "source", op: "eq", value: "g2" },
        { not: { field: "archived", op: "eq", value: true } },
      ],
    } as const;

    expect(composeViewWhere({ filter })).toEqual(filter);
  });
});
```

#### packages/core/src/collections/index.ts

2 edits — everything else in the file is unchanged.

**1 — new export, alongside the existing `export * from "./resolveCollectionIndexes";`.** `toClientViewConfig` must be reachable from `@vexcms/core` (not `@vexcms/core/server`) because `useListViews` (Step 12) calls it client-side.

```ts
export * from "./toClientViewConfig";
```

**2 — new export, immediately after it.** `composeViewWhere` is the client's own AND point, so it must be reachable from the same client-safe entry point.

```ts
export * from "./composeViewWhere";
```

#### packages/core/src/collections/validateTableConfig.ts

3 edits, applied on top of Step 4's file — everything else is unchanged.

**1 — imports.** Anchor: the existing 3-line import block at the top of the file.

```ts
import { getDataFields } from "../fields";
import { CollectionConfig } from "./types";
import { resolveCollectionIndexes } from "./resolveCollectionIndexes";
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";
import { VERSION_SYSTEM_FIELDS } from "../versions";
```

**2 — new `collectWhereFields` helper, between the `VexConfigError` class and the `validateTableConfig` JSDoc.**

```ts
/**
 * Collects every field name a {@link VexWhereNodeOf} tree constrains on,
 * walking `and`/`or`/`not` recursively. Used by `validateTableConfig`'s
 * where-field check — a config view's `where` is `VexWhereNodeOf<unknown>`
 * (portable, collection-structure-agnostic, per Decision 9/25), so field
 * names are only checkable against the real collection here, not by
 * `TFieldSlug`.
 *
 * @param node - The where tree, or a branch of it during recursion.
 * @param out - Accumulator every discovered field name is added to.
 */
function collectWhereFields(node: VexWhereNodeOf<unknown>, out: Set<string>): void {
  if ("and" in node) {
    node.and.forEach((child) => collectWhereFields(child, out));
    return;
  }
  if ("or" in node) {
    node.or.forEach((child) => collectWhereFields(child, out));
    return;
  }
  if ("not" in node) {
    collectWhereFields(node.not, out);
    return;
  }
  out.add(node.field);
}
```

**3 — `validateTableConfig`'s body changes throughout (new JSDoc checks 3–7, new per-view loop), so the whole function is shown complete.**

```ts
/**
 * Validates a collection's `admin.table` surface against its fields and
 * declared indexes (Decisions 3, 6, and 25).
 *
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
 * 4. Every `admin.table.views` entry's `state.where`, when set, only names
 *    fields that exist on the collection — plus the system fields
 *    `"_creationTime"` and, when `versions.drafts` is `true`, `"vex_status"`
 *    — walked recursively through `and`/`or`/`not` → else throws naming the
 *    view and the unknown field.
 * 5. Every `admin.table.views` entry's `state.sort.field`, when set and not
 *    `"_creationTime"`, leads some index — the same rule as #2, applied per
 *    view → else throws naming the view, field, and index to declare.
 * 6. Every `admin.table.views` entry's `state.searchField`, when set, is one
 *    of `admin.table.searchField`'s declared entries → else throws naming
 *    the view and the declared entries.
 * 7. Every `admin.table.views` entry's `state.columns`, when set, names only
 *    known fields → else throws naming the view and the unknown column.
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection (after `defineCollection`'s
 *   defaults are applied, before it is returned to the caller).
 * @throws {VexConfigError} On any check above.
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

  const viewIds = new Set<string>();
  for (const view of collection.admin.table.views) {
    if (viewIds.has(view.viewId)) {
      throw new VexConfigError(
        `${at}: admin.table.views has more than one view with viewId "${view.viewId}". Config view ` +
          `ids must be unique within a collection.`,
      );
    }
    viewIds.add(view.viewId);

    if (view.state.where !== undefined) {
      const whereFields = new Set<string>();
      collectWhereFields(view.state.where, whereFields);
      for (const fieldKey of whereFields) {
        const isSystemField =
          fieldKey === "_creationTime" ||
          (collection.versions.drafts && fieldKey === VERSION_SYSTEM_FIELDS.status.slug);
        if (!isSystemField && dataFields[fieldKey] === undefined) {
          throw new VexConfigError(
            `${at}: admin.table.views view "${view.viewId}" has a where clause naming unknown field "${fieldKey}". ` +
              `Views can only filter on this collection's own fields` +
              `${collection.versions.drafts ? ', "_creationTime", or "vex_status"' : ' or "_creationTime"'}.`,
          );
        }
      }
    }

    const viewSortField = view.state.sort?.field;
    if (viewSortField !== undefined && viewSortField !== "_creationTime" && !leadsSomeIndex(viewSortField)) {
      throw new VexConfigError(
        `${at}: admin.table.views view "${view.viewId}" sorts by field "${viewSortField}", which leads no ` +
          `declared index. Add index: "by_${viewSortField}" to the "${viewSortField}" field, or a ` +
          `collection-level indexes entry starting with "${viewSortField}".`,
      );
    }

    const viewSearchField = view.state.searchField;
    if (viewSearchField !== undefined && !(collection.admin.table.searchField ?? []).includes(viewSearchField)) {
      const declared = collection.admin.table.searchField ?? [];
      throw new VexConfigError(
        `${at}: admin.table.views view "${view.viewId}" searches field "${viewSearchField}", which is not one ` +
          `of admin.table.searchField's declared entries (${
            declared.length > 0 ? declared.map((field) => `"${field}"`).join(", ") : "none declared"
          }).`,
      );
    }

    for (const columnKey of view.state.columns ?? []) {
      if (dataFields[columnKey] === undefined) {
        throw new VexConfigError(
          `${at}: admin.table.views view "${view.viewId}" has an unknown column "${columnKey}". Columns must ` +
            `name one of this collection's own fields.`,
        );
      }
    }
  }
}
```

#### packages/core/src/collections/validateTableConfig.test.ts

1 addition — everything else in this file (as introduced by Step 4) is unchanged, appended as a new `describe` block.

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

  it("accepts a view where clause naming a real field, _creationTime, and (on a versioned collection) vex_status", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { status: text({ required: true }) },
        versions: { drafts: true },
        admin: {
          table: {
            views: [
              {
                viewId: "approved",
                name: "Approved",
                state: {
                  where: {
                    and: [
                      { field: "status", op: "eq", value: "approved" },
                      { field: "_creationTime", op: "gt", value: 0 },
                      { field: "vex_status", op: "eq", value: "published" },
                    ],
                  },
                },
              },
            ],
          },
        },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the view and the unknown where field on a non-versioned collection", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          table: {
            views: [{ viewId: "nope", name: "Nope", state: { where: { field: "ghost", op: "eq", value: "x" } } }],
          },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": admin.table.views view "nope" has a where clause naming unknown ' +
          'field "ghost". Views can only filter on this collection\'s own fields or "_creationTime".',
      ),
    );
  });

  it("throws VexConfigError rejecting vex_status in the where clause when the collection is not versioned", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          table: {
            views: [
              {
                viewId: "drafts",
                name: "Drafts",
                state: { where: { field: "vex_status", op: "eq", value: "draft" } },
              },
            ],
          },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": admin.table.views view "drafts" has a where clause naming unknown ' +
          'field "vex_status". Views can only filter on this collection\'s own fields or "_creationTime".',
      ),
    );
  });

  it("accepts a view sort field that leads a declared index, and _creationTime with none", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true, index: "by_title" }) },
        admin: {
          table: {
            views: [
              { viewId: "by-title", name: "By title", state: { sort: { field: "title", order: "asc" } } },
              { viewId: "newest", name: "Newest", state: { sort: { field: "_creationTime", order: "desc" } } },
            ],
          },
        },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the view, field, and index to declare when a view's sort field leads no index", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          table: {
            views: [{ viewId: "by-title", name: "By title", state: { sort: { field: "title", order: "asc" } } }],
          },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": admin.table.views view "by-title" sorts by field "title", which ' +
          'leads no declared index. Add index: "by_title" to the "title" field, or a collection-level indexes ' +
          'entry starting with "title".',
      ),
    );
  });

  it("accepts a view searchField that is one of admin.table.searchField's declared entries", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true, searchIndex: { name: "search_title", filterFields: [] } }) },
        admin: {
          table: {
            searchField: ["title"],
            views: [{ viewId: "search", name: "Search", state: { searchField: "title" } }],
          },
        },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the view and the declared searchField entries when a view searches an undeclared field", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: {
          title: text({ required: true, searchIndex: { name: "search_title", filterFields: [] } }),
          body: text({ required: true, searchIndex: { name: "search_body", filterFields: [] } }),
        },
        admin: {
          table: {
            searchField: ["title"],
            views: [{ viewId: "search", name: "Search", state: { searchField: "body" } }],
          },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": admin.table.views view "search" searches field "body", which is ' +
          'not one of admin.table.searchField\'s declared entries ("title").',
      ),
    );
  });

  it('throws VexConfigError listing "none declared" when the collection has no admin.table.searchField at all', () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          table: {
            views: [{ viewId: "search", name: "Search", state: { searchField: "title" } }],
          },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": admin.table.views view "search" searches field "title", which is ' +
          "not one of admin.table.searchField's declared entries (none declared).",
      ),
    );
  });

  it("accepts view columns that are known fields", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          table: {
            views: [{ viewId: "cols", name: "Columns", state: { columns: ["title"] } }],
          },
        },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the view and the unknown column", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { title: text({ required: true }) },
        admin: {
          table: {
            views: [{ viewId: "cols", name: "Columns", state: { columns: ["ghost"] } }],
          },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "posts": admin.table.views view "cols" has an unknown column "ghost". ' +
          "Columns must name one of this collection's own fields.",
      ),
    );
  });
});
```

### Step 6 — Index pushdown, the declared-filter field-read exemption, and the total-count cap in `find` / `search` [agent]

Why: `find`/`search` take **no `view` arg** (Decision 25) — the client composes one plain `where` itself (`composeViewWhere`, Step 5) and sends it like any other filter. `resolveQueryIndex` (`collections/resolveQueryIndex.ts`) resolves a portable `sort` to an index and rejects an unreadable `sort.field` with `VexAccessError` (Decision 26), while also pushing the caller's `where` equalities into that same index's range when a declared index can absorb them (Decision 36) — a selective filter on an indexed field stops scanning every matching row per page. `matchDeclaredViewFilter` (new) implements Decision 26's one field-read exception: when a top-level AND part of the caller's `where` deep-equals a config view's own declared `where`, that part is trusted and skipped by the field-read check — `find`/`search` only re-check the remaining parts. Finally, `find`/`search` stop `.collect()`-ing the whole matching set to count it (which fails outright above Convex's ~32k-document scan limit) and instead count at most `admin.table.countLimit + 1` rows, returning `totalDocs` plus `totalDocsCapped: boolean` (Decision 35).

This step anchors against the CURRENT, unmodified `find`/`search` implementation — list-view-overhaul has not landed any server code yet, so every edit below is shown against the file as it exists today.

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

#### packages/core/src/collections/resolveQueryIndex.ts

New file.

```ts
import type { VexConfig } from "../config";
import { resolveCollectionIndexes } from "./resolveCollectionIndexes";
import { VexError } from "../errors";
import { CRUD_ACTIONS, isFieldAllowed, PERMISSION_SCOPES, resolveFieldPermissions, VexAccessError } from "../access";
import type { VexAccessConfig } from "../access";
import type { VexApiAuth } from "../db/types";
import type { CollectionTableSort } from "./types";
import type { VexWhereNode } from "../db/queryArgs";
import { queryConstraintsToConvexIndexRange } from "../access/compileQueryConstraints";
import type { ConvexQueryIndexRangeFn } from "../access/convexTypes";

/**
 * {@link resolveQueryIndex}'s result — the one index `find` feeds into its
 * existing `pickConvexQueryIndex` arbitration, plus the `where` left over
 * once Decision 36's equality pushdown has removed whatever it pushed into
 * the index's own range.
 */
export interface ResolvedQueryIndex<S extends string = string> {
  /** The index to apply, or `undefined` for an unnarrowed scan. */
  indexName?: string;
  /**
   * Range covering the equalities pushed from `where`'s top-level `and`
   * part, in `indexName`'s field order. `undefined` when nothing was
   * pushed — `indexName` alone still orders the scan.
   */
  range?: ConvexQueryIndexRangeFn;
  /** The `.order()` to apply. */
  order: "asc" | "desc";
  /**
   * `where`, minus the parts `range` already covers. `find` compiles THIS
   * (not the original `where`) into its `.filter()` — re-checking a pushed
   * equality there would be redundant. Identical to the input `where` when
   * nothing was pushed.
   */
  remainder?: VexWhereNode<S>;
}

/**
 * Resolves a portable `{ field, order }` sort to the Convex index that
 * serves it, pushing down any `where` equalities that index's leading
 * fields can absorb (Design Decision 36). Clients — URLs, saved views,
 * `find` callers — still never name an index directly (Design Decision 5).
 *
 * Pushdown only runs when `sort` is supplied — list views always send
 * `defaultSort` (Decisions 4/9), and a sort-less call is rare enough that
 * a plain no-index passthrough (pure insertion-order scan) is simpler
 * than reasoning about what "ascending" means once an index picks
 * the enumeration order.
 *
 * `_creationTime` needs no index of its own: Convex's default `.order()`
 * already walks it, so a `_creationTime` sort may ONLY use an index that
 * is FULLY consumed by `where` equalities — any field the index declares
 * past the matched prefix would otherwise reorder the scan by that field
 * instead of creation time. A non-`_creationTime` sort instead requires
 * the matched equality prefix to be followed IMMEDIATELY by `sort.field`
 * in the SAME index (Decision 36's "leading fields matched by equalities …
 * followed by the sort field") — the degenerate zero-equality case
 * (`fields[0] === sort.field`) included.
 *
 * Only `eq` conditions in `where`'s TOP-LEVEL `and` part (or a single
 * unwrapped condition, treated as one) are eligible — an `or` group, a
 * `not`, a nested `and`, or a `gt`/`gte`/`lt`/`lte` comparison can never be
 * pushed, matching Decision 36's "Everything else stays in `.filter()`"
 * examples (OR groups, ranges, a sort incompatible with the index).
 *
 * Before any of this, a non-`_creationTime` `sort.field` is checked for
 * read access: sort order alone would leak a hidden field's values (Design
 * Decision 26). The check only runs when `props.access` is supplied —
 * `find` passes the SAME resolved `access`/`auth`/`action` it uses for
 * `readableDocuments`, so a bypassed or unconfigured read (both resolve
 * `access` to `undefined`) stays permissive here too.
 *
 * Access-rule index precedence (`pickConvexQueryIndex`) is unaffected —
 * this function only ever resolves the CALLER's half of the index slot;
 * arbitration against an access-contributed index happens exactly as
 * before, one layer up in `find/server.ts`.
 *
 * @param props - Input props.
 * @param props.config - The resolved `VexConfig`, to look up `collection`'s
 *   fields and indexes. Omitted (a bypassed caller) resolves permissively:
 *   `sort.order` passes through with no `indexName`, and `where` passes
 *   through unpushed as `remainder` — the same posture `whereFieldNames` /
 *   `requiresPublishedOnly` take when `config` is absent.
 * @param props.collection - The collection slug being queried.
 * @param props.where - The caller's plain `where`, for pushdown. Builder
 *   callbacks are not pushable (there is nothing to deep-match equalities
 *   against); `find` only forwards the plain-node form here.
 * @param props.sort - The portable sort. `undefined` resolves to
 *   `{ order: "asc" }` with no index and no pushdown — today's default
 *   insertion order, unchanged by a `where` that happens to be present.
 * @param props.drafts - The caller's EFFECTIVE `drafts` intent (`find`
 *   passes `resolveReadCall`'s `wantsDrafts`, not the raw `args.drafts`),
 *   used only to break a tie between multiple same-prefix-length indexes.
 * @param props.access - Resolved access config from `resolveReadCall`;
 *   `undefined` (bypassed/unconfigured) skips the field-read check on
 *   `sort.field` entirely.
 * @param props.auth - The caller, for the field-permission role walk.
 * @param props.action - The read action the field-read check runs under
 *   (`"read"` or `DRAFT_ACTIONS.readDrafts`, whichever `resolveReadCall`
 *   resolved). Defaults to `CRUD_ACTIONS.read`.
 * @param props.resource - The permission subject for the field-read check.
 *   Defaults to `collection`.
 * @returns See {@link ResolvedQueryIndex}.
 * @throws {VexAccessError} When `props.access` is set and the caller cannot
 *   read `sort.field`.
 * @throws {VexError} `code: "UNINDEXED_SORT"` when `sort.field` is set, is
 *   not `"_creationTime"`, and no declared index can serve it — at ANY
 *   equality prefix, including the empty one. Names the field and the
 *   index to declare; mirrors `defineCollection`'s config-time message for
 *   the same condition (`validateTableConfig`, Design Decision 6).
 */
export function resolveQueryIndex<S extends string = string>(props: {
  config?: VexConfig;
  collection: string;
  where?: VexWhereNode<S>;
  sort?: CollectionTableSort<string>;
  drafts?: boolean;
  access?: VexAccessConfig;
  auth?: VexApiAuth;
  action?: string;
  resource?: string;
}): ResolvedQueryIndex<S> {
  // TODO: implement
  // 1. No `sort` → return `{ order: "asc", remainder: props.where }` — no
  //    pushdown, matching the pre-Decision-36 default exactly.
  // 2. `sort.field === "_creationTime"` → skip the field-read check (a
  //    system field no map can gate) and go to step 4 with
  //    `requireFullConsumption = true`.
  // 3. Otherwise (`sort.field` is a real field) — field-read check:
  //    `props.access !== undefined` → `resolveFieldPermissions({ access:
  //    props.access, user: props.auth?.user ?? null, organization:
  //    props.auth?.organization, resource: props.resource ?? props.collection,
  //    action: props.action ?? CRUD_ACTIONS.read, scope: PERMISSION_SCOPES.any })`,
  //    then `isFieldAllowed(resolved, sort.field)` → `false` throws
  //    `VexAccessError({ resource: props.resource ?? props.collection,
  //    action: props.action ?? CRUD_ACTIONS.read, field: sort.field,
  //    message: 'sort.field "<field>" is not readable on collection
  //    "<collection>".' })`. Continue to step 4 with
  //    `requireFullConsumption = false`.
  // 4. Look up `collection = props.config?.collections.find((c) => c.slug
  //    === props.collection)`:
  //    a. Not found → return `{ order: sort.order, remainder: props.where }`
  //       — permissive, the same fallback `whereFieldNames` takes.
  //    b. Found → continue.
  // 5. `indexes = resolveCollectionIndexes({ collection })`.
  // 6. `parts = props.where === undefined ? [] : "and" in props.where ?
  //    props.where.and : [props.where]` — the top-level AND parts; a bare
  //    `where` counts as one part (mirrors `matchDeclaredViewFilter`'s
  //    identical convention, so a single-condition config view composes
  //    identically through both).
  // 7. `equalities = new Map<string, { value: unknown; part: VexWhereNode<S> }>()`
  //    — for each `part` that is a PLAIN leaf (`"field" in part`) with
  //    `part.op === "eq"`, `equalities.set(part.field, { value: part.value,
  //    part })`. A part referencing a field already in the map keeps the
  //    FIRST occurrence (a contradictory duplicate equality is a caller
  //    bug, not this function's to resolve).
  // 8. For each index, `prefixLen` = the number of CONSECUTIVE
  //    `index.fields` from position 0 present in `equalities` (stop at the
  //    first field not in `equalities`).
  // 9. Candidate filter:
  //    a. `requireFullConsumption` → keep indexes where `prefixLen ===
  //       index.fields.length && prefixLen > 0`.
  //    b. Otherwise → keep indexes where `index.fields[prefixLen] ===
  //       sort.field` (true at `prefixLen === 0` for a plain
  //       `fields[0] === sort.field` match).
  // 10. Zero candidates:
  //     a. `requireFullConsumption` → return `{ order: sort.order,
  //        remainder: props.where }` (today's "_creationTime always
  //        resolves with no index" behavior — pushdown just didn't apply).
  //     b. Otherwise → throw `VexError({ code: "UNINDEXED_SORT", collection:
  //        props.collection, field: sort.field, message: 'sort.field
  //        "<field>" leads no index on collection "<collection>" — declare
  //        index: "by_<field>" on the field (or a collection-level indexes
  //        entry starting with it) to make it sortable.' })`.
  // 11. One or more candidates → pick the winner:
  //     a. Keep only those with the MAXIMUM `prefixLen` among the
  //        candidates.
  //     b. Among those, tie-break:
  //        `props.drafts === true` ? prefer the first declaring
  //        `draftStatus: "both"` : prefer the first declaring ANY
  //        `draftStatus`; otherwise the first in `resolveCollectionIndexes`'
  //        schema order.
  // 12. Build the result from the winner (`prefixLen`, `fields`, `name`):
  //     a. `matchedFields = winner.fields.slice(0, prefixLen)`.
  //     b. `range = prefixLen === 0 ? undefined :
  //        queryConstraintsToConvexIndexRange({ constraints: matchedFields
  //        .map((field) => ({ field, op: "eq" as const, value:
  //        equalities.get(field)!.value })) })`.
  //     c. `consumedParts = new Set(matchedFields.map((field) =>
  //        equalities.get(field)!.part))`.
  //     d. `remainingParts = parts.filter((part) =>
  //        !consumedParts.has(part))`.
  //     e. `remainder = remainingParts.length === 0 ? undefined :
  //        remainingParts.length === 1 ? remainingParts[0] : { and:
  //        remainingParts }`.
  //     f. Return `{ indexName: winner.name, range, order: sort.order,
  //        remainder }`.
  // Edge cases:
  // - A field that exists on the collection but declares no `index` at all
  //   is indistinguishable from an unknown field name — both contribute no
  //   candidate.
  // - Two candidates sharing the SAME `draftStatus` (both `"both"`, or both
  //   `true`) at the same winning `prefixLen` → first in schema order
  //   wins, deterministic but arbitrary; `validateTableConfig` (Step 3)
  //   does not forbid this today.
  // - `where` containing only non-`eq` conditions (ranges, `or`, `not`)
  //   contributes zero entries to `equalities` — every candidate's
  //   `prefixLen` is 0, which still allows the plain `fields[0] ===
  //   sort.field` sort-only match (step 9b) but blocks the
  //   `requireFullConsumption` path (step 9a) outright.
  // - The field-read check (step 3) runs BEFORE index resolution (steps
  //   4-12), so a denied field never reaches the "which index?" question.
  throw new Error("Not implemented");
}
```

#### packages/core/src/collections/resolveQueryIndex.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";

import type { VexConfig } from "../config";
import { defineCollection } from "./config";
import { text } from "../fields";
import { defineAccess } from "../access/config";
import { resolveQueryIndex } from "./resolveQueryIndex";

function configOf(collection: ReturnType<typeof defineCollection>): VexConfig {
  return { collections: [collection] } as unknown as VexConfig;
}

const plainSortPosts = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    status: text({ index: "by_status" }),
  },
});

describe("resolveQueryIndex — no sort", () => {
  it("defaults to ascending insertion order with no indexName, and passes where through unpushed", () => {
    expect(resolveQueryIndex({ config: configOf(plainSortPosts), collection: "posts" })).toEqual({
      order: "asc",
      remainder: undefined,
    });
    const where = { field: "status", op: "eq", value: "x" } as const;
    expect(resolveQueryIndex({ config: configOf(plainSortPosts), collection: "posts", where })).toEqual({
      order: "asc",
      remainder: where,
    });
  });
});

describe("resolveQueryIndex — indexed field, no where", () => {
  it("resolves a field leading exactly one index", () => {
    expect(
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "status", order: "asc" },
      }),
    ).toEqual({ indexName: "by_status", range: undefined, order: "asc", remainder: undefined });
  });

  it("is permissive with no config — order passes through, no indexName", () => {
    expect(resolveQueryIndex({ collection: "posts", sort: { field: "status", order: "desc" } })).toEqual({
      order: "desc",
      remainder: undefined,
    });
  });

  it('resolves "_creationTime" to no indexName with no where to push', () => {
    expect(
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "_creationTime", order: "desc" },
      }),
    ).toEqual({ order: "desc", remainder: undefined });
  });
});

describe("resolveQueryIndex — unindexed field", () => {
  it('throws VexError({ code: "UNINDEXED_SORT" }) naming the field and the index to declare', () => {
    expect(() =>
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "title", order: "asc" },
      }),
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

describe("resolveQueryIndex — equality prefix", () => {
  it("pushes a single eq into a fully-consumed index under a _creationTime sort", () => {
    const where = { field: "status", op: "eq", value: "published" } as const;
    const result = resolveQueryIndex({
      config: configOf(plainSortPosts),
      collection: "posts",
      where,
      sort: { field: "_creationTime", order: "desc" },
    });
    expect(result.indexName).toBe("by_status");
    expect(result.range).toBeInstanceOf(Function);
    expect(result.order).toBe("desc");
    expect(result.remainder).toBeUndefined();
  });

  it("leaves a non-pushed AND sibling in remainder", () => {
    const result = resolveQueryIndex({
      config: configOf(plainSortPosts),
      collection: "posts",
      where: {
        and: [
          { field: "status", op: "eq", value: "published" },
          { field: "title", op: "eq", value: "Hello" },
        ],
      },
      sort: { field: "_creationTime", order: "asc" },
    });
    expect(result.indexName).toBe("by_status");
    expect(result.remainder).toEqual({ field: "title", op: "eq", value: "Hello" });
  });

  it("degenerate case: a plain field sort with no where still resolves (zero-equality prefix)", () => {
    expect(
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        sort: { field: "status", order: "asc" },
      }),
    ).toEqual({ indexName: "by_status", range: undefined, order: "asc", remainder: undefined });
  });
});

const compoundPosts = defineCollection({
  slug: "posts",
  fields: { category: text(), views: text(), title: text(), featured: text() },
  indexes: [{ name: "by_category_views", fields: ["category", "views"] }],
});

describe("resolveQueryIndex — compound index: equality prefix then sort", () => {
  it("pushes the leading equality and orders by the field right after it", () => {
    const result = resolveQueryIndex({
      config: configOf(compoundPosts),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
    });
    expect(result).toEqual({
      indexName: "by_category_views",
      range: expect.any(Function),
      order: "asc",
      remainder: undefined,
    });
  });

  it("prefers the longer equality prefix over a plain single-field index serving the same sort", () => {
    const withPlainIndex = defineCollection({
      slug: "posts",
      fields: { category: text(), views: text({ index: "by_views" }), title: text() },
      indexes: [{ name: "by_category_views", fields: ["category", "views"] }],
    });
    const result = resolveQueryIndex({
      config: configOf(withPlainIndex),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
    });
    expect(result.indexName).toBe("by_category_views");
  });

  it("wraps 2+ leftover AND parts back into an `and` node", () => {
    const result = resolveQueryIndex({
      config: configOf(compoundPosts),
      collection: "posts",
      where: {
        and: [
          { field: "category", op: "eq", value: "tech" },
          { field: "title", op: "eq", value: "Hello" },
          { field: "featured", op: "eq", value: "yes" },
        ],
      },
      sort: { field: "views", order: "asc" },
    });
    expect(result.indexName).toBe("by_category_views");
    expect(result.remainder).toEqual({
      and: [
        { field: "title", op: "eq", value: "Hello" },
        { field: "featured", op: "eq", value: "yes" },
      ],
    });
  });
});

describe("resolveQueryIndex — OR fallback", () => {
  it("a top-level OR contributes no equalities — falls back to no index, remainder unchanged", () => {
    const where = {
      or: [
        { field: "status", op: "eq", value: "a" },
        { field: "status", op: "eq", value: "b" },
      ],
    } as const;
    expect(
      resolveQueryIndex({
        config: configOf(plainSortPosts),
        collection: "posts",
        where,
        sort: { field: "_creationTime", order: "desc" },
      }),
    ).toEqual({ order: "desc", remainder: where });
  });
});

const rangePosts = defineCollection({
  slug: "posts",
  fields: { score: text({ index: "by_score" }), title: text() },
});

describe("resolveQueryIndex — range fallback", () => {
  it("a gt condition cannot be pushed — falls back to no index under a _creationTime sort", () => {
    const where = { field: "score", op: "gt", value: 50 } as const;
    expect(
      resolveQueryIndex({
        config: configOf(rangePosts),
        collection: "posts",
        where,
        sort: { field: "_creationTime", order: "asc" },
      }),
    ).toEqual({ order: "asc", remainder: where });
  });

  it("still resolves the sort-only index when the range sits on the sorted field itself", () => {
    const where = { field: "score", op: "gt", value: 50 } as const;
    expect(
      resolveQueryIndex({
        config: configOf(rangePosts),
        collection: "posts",
        where,
        sort: { field: "score", order: "desc" },
      }),
    ).toEqual({ indexName: "by_score", range: undefined, order: "desc", remainder: where });
  });
});

const draftAwareCompoundPosts = defineCollection({
  slug: "posts",
  fields: { category: text(), views: text() },
  versions: { drafts: true },
  indexes: [
    { name: "by_category_views", fields: ["category", "views"] },
    { name: "by_category_views_full", fields: ["category", "views"], draftStatus: "both" },
  ],
});

describe("resolveQueryIndex — draftStatus-aware tie-break among equal-prefix candidates", () => {
  it('prefers the draftStatus: "both" index when drafts: true', () => {
    const result = resolveQueryIndex({
      config: configOf(draftAwareCompoundPosts),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
      drafts: true,
    });
    expect(result.indexName).toBe("by_category_views_full");
  });

  it("prefers a draftStatus-declaring index over a plain one for a published-only read", () => {
    const result = resolveQueryIndex({
      config: configOf(draftAwareCompoundPosts),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
      drafts: false,
    });
    expect(result.indexName).toBe("by_category_views_full");
  });

  it("falls back to schema order when neither matching candidate declares a draftStatus", () => {
    const ambiguousPosts = defineCollection({
      slug: "posts",
      fields: { category: text(), views: text() },
      indexes: [
        { name: "by_category_views", fields: ["category", "views"] },
        { name: "by_category_views_alt", fields: ["category", "views"] },
      ],
    });
    const result = resolveQueryIndex({
      config: configOf(ambiguousPosts),
      collection: "posts",
      where: { field: "category", op: "eq", value: "tech" },
      sort: { field: "views", order: "asc" },
    });
    expect(result.indexName).toBe("by_category_views");
  });
});

describe("resolveQueryIndex — sort field read access", () => {
  const fieldAccessResource = defineCollection({
    slug: "posts",
    fields: { title: text({ index: "by_title" }), slug: text({ index: "by_slug" }) },
  });
  const fieldAccessConfig = {
    collections: [fieldAccessResource],
    access: defineAccess({
      roles: ["viewer"] as const,
      resources: [fieldAccessResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        viewer: {
          posts: { read: () => ({ title: false, "*": true }) },
        },
      },
    }),
  } as unknown as VexConfig;
  const viewerAuth = { user: { _id: "u1", roles: "viewer" } };

  it("throws VexAccessError when the caller cannot read sort.field", () => {
    expect(() =>
      resolveQueryIndex({
        config: fieldAccessConfig,
        collection: "posts",
        sort: { field: "title", order: "asc" },
        access: fieldAccessConfig.access,
        auth: viewerAuth,
        action: "read",
      }),
    ).toThrow(
      expect.objectContaining({
        data: expect.objectContaining({ code: "ACCESS_DENIED", resource: "posts", action: "read", field: "title" }),
      }),
    );
  });

  it("resolves normally when the field is readable", () => {
    expect(
      resolveQueryIndex({
        config: fieldAccessConfig,
        collection: "posts",
        sort: { field: "slug", order: "asc" },
        access: fieldAccessConfig.access,
        auth: viewerAuth,
        action: "read",
      }),
    ).toEqual({ indexName: "by_slug", range: undefined, order: "asc", remainder: undefined });
  });

  it('never checks "_creationTime" — it is always readable', () => {
    expect(
      resolveQueryIndex({
        config: fieldAccessConfig,
        collection: "posts",
        sort: { field: "_creationTime", order: "desc" },
        access: fieldAccessConfig.access,
        auth: viewerAuth,
        action: "read",
      }),
    ).toEqual({ order: "desc", remainder: undefined });
  });

  it("skips the check entirely when access is undefined (bypassed/unconfigured)", () => {
    expect(
      resolveQueryIndex({ config: fieldAccessConfig, collection: "posts", sort: { field: "title", order: "asc" } }),
    ).toEqual({ indexName: "by_title", range: undefined, order: "asc", remainder: undefined });
  });
});
```

#### packages/core/src/collections/matchDeclaredViewFilter.ts

New file.

```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";

import type { CollectionConfig } from "./types";
import type { CollectionSlug } from "../types/generated";
import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../db/types";
import type { VexWhereNode } from "../db/queryArgs";
import { valuesEqual } from "../utils/valuesEqual";
import { VIEW_ACTIONS, PERMISSION_SCOPES, hasPermission } from "../access";
import { resolveAccessCall } from "../access/resolveAccessCall";

/** {@link matchDeclaredViewFilter}'s result. */
export interface MatchedDeclaredViewFilter<S extends string = string> {
  /**
   * The top-level `where` part that deep-equals one of `collection`'s
   * declared `admin.table.views[].where` values, verbatim — the trusted,
   * server-declared half (Design Decision 26). `undefined` when no part
   * matched.
   */
  declared?: VexWhereNode<S>;
  /**
   * `where` with `declared` removed, if matched — otherwise `where`
   * unchanged. The caller runs the field-read check against THIS, never
   * against the original `where` — `declared`, when present, is exempt.
   */
  remainder?: VexWhereNode<S>;
}

/**
 * Splits a caller's `where` into the part that exactly reproduces one of
 * `collection`'s declared config-view filters (if any) and the remainder
 * that still needs the ordinary field-read check (Design Decision 26's one
 * exception).
 *
 * A config view's `where` ships in the client bundle (Design Decision 25)
 * — `composeViewWhere` (Step 5) sends it back as `{ and: [viewWhere,
 * filter] }`, keeping `viewWhere` as ONE opaque node rather than flattening
 * it. Matching therefore only ever needs to compare TOP-LEVEL `and` PARTS
 * against each declared `where` by deep structural equality
 * (`valuesEqual`, which already treats two values as equal purely by
 * content) — never a partial, reordered, or OR-nested recovery of a
 * declared filter. That is deliberate: Decision 26 calls out "dropping a
 * condition, changing a value, putting it in an OR group" as cases that
 * must NOT exempt the request, and comparing only whole top-level parts
 * rejects all three automatically — a narrowed or altered copy of a
 * multi-condition declared filter is a DIFFERENT node than the declared
 * one, and a part nested inside `{ or: [...] }` is never a top-level part
 * at all.
 *
 * `find` / `search` use `remainder` to compute `whereFields` (the set of
 * referenced fields checked for read access) instead of the full `where` —
 * `declared`'s own fields, if matched, are never checked. This function
 * does NOT itself check field access; separating the two means a
 * `remainder` that still references an unreadable field is simply returned
 * as such, for the caller's existing `readableDocuments` machinery to
 * drop.
 *
 * @param props - Input props.
 * @param props.collection - The resolved `CollectionConfig` whose
 *   `admin.table.views` is searched. `undefined` (an unknown collection or
 *   no config) resolves permissively: `{ remainder: props.where }`, the
 *   same fallback `whereFieldNames` takes.
 * @param props.where - The caller's plain `where`, verbatim.
 * @param props.sharedWheres - `vex_views[].state.where` values the caller
 *   may read (Decision 26's "Shared views" bullet), loaded by
 *   {@link loadSharedViewWheres}. Compared with the SAME deep-equality rule
 *   as a config view's `where` — omit (or pass `[]`) when the config-view
 *   pass alone leaves nothing unreadable, so the caller never pays for the
 *   `vex_views` read on an ordinary query.
 * @returns See {@link MatchedDeclaredViewFilter}.
 */
export function matchDeclaredViewFilter<S extends string = string>(props: {
  collection?: CollectionConfig;
  where?: VexWhereNode<S>;
  sharedWheres?: VexWhereNode<S>[];
}): MatchedDeclaredViewFilter<S> {
  // TODO: implement
  // 1. `props.where === undefined` → return `{ remainder: undefined }` —
  //    nothing to match, nothing left to check.
  // 2. `declaredWheres = [...(props.collection?.admin.table.views ?? [])
  //    .map((v) => v.state.where), ...(props.sharedWheres ?? [])]
  //    .filter((w): w is VexWhereNode<S> => w !== undefined)` — every
  //    declared config-view `where` AND every passed-in shared-view
  //    `where`, unioned — Decision 26 applies "the same exact-match rule"
  //    to both sources. Empty → return `{ remainder: props.where }`.
  // 3. `parts = "and" in props.where ? props.where.and : [props.where]` —
  //    the top-level AND parts; a bare `where` counts as one part (mirrors
  //    `resolveQueryIndex`'s identical convention).
  // 4. `matchedIndex = parts.findIndex((part) => declaredWheres.some((dw)
  //    => valuesEqual(part, dw)))` — the first PART, in request order,
  //    that deep-equals ANY declared `where`.
  // 5. `matchedIndex === -1` → return `{ remainder: props.where }` — no
  //    declared filter recognized; nothing is exempt.
  // 6. `declared = parts[matchedIndex]`.
  // 7. `remaining = parts.filter((_, i) => i !== matchedIndex)`.
  // 8. `remainder = remaining.length === 0 ? undefined : remaining.length
  //    === 1 ? remaining[0] : { and: remaining }`.
  // 9. Return `{ declared, remainder }`.
  // Edge cases:
  // - `props.where` deep-equal to a declared `where` with NO `and` wrapper
  //   (a single-condition config view, requested back verbatim) matches at
  //   step 4 with `parts = [props.where]` and resolves `remainder:
  //   undefined` — Decision 26's "exact match" case.
  // - A declared `where` embedded inside `{ or: [...] }` never matches:
  //   step 3 only unwraps a TOP-LEVEL `and`, so an `or`-rooted `where`
  //   produces `parts = [props.where]` — the whole `or` node — which
  //   cannot deep-equal a plain declared `where`.
  // - Two declared views sharing an identical `where` are indistinguishable
  //   here by design — `declared` carries the matched NODE, not a
  //   `viewId`, so which view it came from doesn't change the result.
  throw new Error("Not implemented");
}

/**
 * Loads the `where` of every `shared` (`vex_views`) view on `collection`
 * the caller may read, for {@link matchDeclaredViewFilter}'s `sharedWheres`
 * (Decision 26's "Shared views" bullet). Gated on `readViews` (decision 13)
 * with `scope: PERMISSION_SCOPES.any` — the same "may they ever see this
 * list?" gate `listViews` (`collections/api/listViews/server.ts`) uses.
 * Resolves to `[]`, not a thrown error, when the caller lacks `readViews` —
 * nothing becomes trusted, which drops the row exactly like any other
 * unreadable condition.
 *
 * Callers (`find`/`search`) only invoke this AFTER the config-view match
 * (Decision 25) still leaves an unreadable field in the remainder — the
 * read costs nothing on an ordinary query.
 *
 * Scoped to the caller's organization via `by_collection_org` when
 * `config.access.orgCollectionSlug` is configured AND `auth.organization`
 * resolves an id, mirroring `listViews`'s own scoping — otherwise every
 * shared view for the collection via `by_collection`.
 *
 * @param props.ctx - Convex query context.
 * @param props.config - The resolved `VexConfig`.
 * @param props.collection - The collection slug to load shared views for.
 * @param props.auth - Resolved caller identity, checked against `readViews`.
 * @returns Every readable shared view's `state.where`, skipping views with
 *   no `where` (search- or sort-only views carry nothing to match against).
 */
export async function loadSharedViewWheres<DataModel extends GenericDataModel, S extends string = string>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config: VexConfig;
  access?: AccessCallOptions<string>;
  collection: CollectionSlug;
  auth?: VexApiAuth;
}): Promise<VexWhereNode<S>[]> {
  // TODO: implement
  // 1. props.config.access !== undefined →
  //    a. { access, action, resource } = resolveAccessCall({ config: props.config, access: props.access,
  //         defaultAction: VIEW_ACTIONS.readViews, resource: props.collection })
  //    b. allowed = hasPermission({ access, user: props.auth?.user ?? null,
  //         organization: props.auth?.organization, resource, action, scope: PERMISSION_SCOPES.any })
  //    c. !allowed → return []
  // 2. organizationId = props.config.access?.orgCollectionSlug !== undefined
  //      ? (props.auth?.organization as { _id?: string } | undefined)?._id
  //      : undefined
  // 3a. organizationId !== undefined → rows = await props.ctx.db.query("vex_views")
  //       .withIndex("by_collection_org", (q) =>
  //         q.eq("collection", props.collection).eq("organizationId", organizationId))
  //       .collect()
  // 3b. organizationId === undefined → rows = await props.ctx.db.query("vex_views")
  //       .withIndex("by_collection", (q) => q.eq("collection", props.collection))
  //       .collect()
  // 4. return rows.map((row) => (row.state as { where?: VexWhereNode<S> }).where)
  //      .filter((where): where is VexWhereNode<S> => where !== undefined)
  throw new Error("Not implemented");
}
```

#### packages/core/src/collections/matchDeclaredViewFilter.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import * as _generatedApi from "../db/test/convex/_generated/api";
import schema from "../db/test/convex/schema";
import type { VexConfig } from "../config";
import { defineAccess } from "../access/config";
import { defineCollection, text } from "../index";

import type { CollectionConfig } from "./types";
import { matchDeclaredViewFilter, loadSharedViewWheres } from "./matchDeclaredViewFilter";

function collectionWithViews(views: { viewId: string; name: string; where?: unknown }[]): CollectionConfig {
  return { slug: "posts", admin: { table: { views } } } as unknown as CollectionConfig;
}

const featuredWhere = { field: "featured", op: "eq", value: true } as const;
const regionWhere = { field: "region", op: "eq", value: "us" } as const;
const multiConditionWhere = { and: [featuredWhere, regionWhere] } as const;

describe("matchDeclaredViewFilter — no where / no declared views", () => {
  it("returns an empty result when where is omitted", () => {
    expect(matchDeclaredViewFilter({ collection: collectionWithViews([]) })).toEqual({ remainder: undefined });
  });

  it("is permissive with no collection", () => {
    expect(matchDeclaredViewFilter({ where: featuredWhere })).toEqual({ remainder: featuredWhere });
  });

  it("is permissive when the collection declares no views", () => {
    expect(matchDeclaredViewFilter({ collection: collectionWithViews([]), where: featuredWhere })).toEqual({
      remainder: featuredWhere,
    });
  });
});

describe("matchDeclaredViewFilter — exact match", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("a where that IS the declared filter, verbatim, is fully trusted", () => {
    expect(matchDeclaredViewFilter({ collection, where: featuredWhere })).toEqual({
      declared: featuredWhere,
      remainder: undefined,
    });
  });
});

describe("matchDeclaredViewFilter — narrowing with a readable condition", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("splits the declared part from the user's own added condition", () => {
    const addedCondition = { field: "source", op: "eq", value: "g2" } as const;
    expect(matchDeclaredViewFilter({ collection, where: { and: [featuredWhere, addedCondition] } })).toEqual({
      declared: featuredWhere,
      remainder: addedCondition,
    });
  });

  it("matches a multi-condition declared filter only when nested as ONE node", () => {
    const multiViewCollection = collectionWithViews([
      { viewId: "high-value", name: "High Value", where: multiConditionWhere },
    ]);
    const addedCondition = { field: "source", op: "eq", value: "g2" } as const;
    expect(
      matchDeclaredViewFilter({
        collection: multiViewCollection,
        where: { and: [multiConditionWhere, addedCondition] },
      }),
    ).toEqual({ declared: multiConditionWhere, remainder: addedCondition });
  });
});

describe("matchDeclaredViewFilter — altered value", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("a changed value is a DIFFERENT node — nothing is exempt", () => {
    const altered = { field: "featured", op: "eq", value: false } as const;
    const addedCondition = { field: "source", op: "eq", value: "g2" } as const;
    const where = { and: [altered, addedCondition] } as const;
    expect(matchDeclaredViewFilter({ collection, where })).toEqual({ remainder: where });
  });
});

describe("matchDeclaredViewFilter — partial", () => {
  it("dropping one condition of a multi-condition declared filter is NOT a match", () => {
    const multiViewCollection = collectionWithViews([
      { viewId: "high-value", name: "High Value", where: multiConditionWhere },
    ]);
    const addedCondition = { field: "source", op: "eq", value: "g2" } as const;
    // Only `featuredWhere` survives from the declared `and` — `regionWhere`
    // was dropped, so the surviving part cannot deep-equal the FULL
    // declared `where`.
    const where = { and: [featuredWhere, addedCondition] } as const;
    expect(matchDeclaredViewFilter({ collection: multiViewCollection, where })).toEqual({ remainder: where });
  });
});

describe("matchDeclaredViewFilter — nested in OR", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("a declared filter placed inside an OR group is NOT exempt", () => {
    const otherCondition = { field: "source", op: "eq", value: "g2" } as const;
    const where = { or: [featuredWhere, otherCondition] } as const;
    expect(matchDeclaredViewFilter({ collection, where })).toEqual({ remainder: where });
  });
});

describe("matchDeclaredViewFilter — unreadable remainder", () => {
  const collection = collectionWithViews([{ viewId: "featured", name: "Featured", where: featuredWhere }]);

  it("returns the remainder as-is, even when it references a field the caller cannot read — access is the CALLER's job", () => {
    const unreadableCondition = { field: "internalScore", op: "eq", value: 90 } as const;
    expect(matchDeclaredViewFilter({ collection, where: { and: [featuredWhere, unreadableCondition] } })).toEqual({
      declared: featuredWhere,
      remainder: unreadableCondition,
    });
  });
});

describe("matchDeclaredViewFilter — sharedWheres", () => {
  const collection = collectionWithViews([]);

  it("trusts an exact match against a shared view's where, same as a config view's", () => {
    expect(
      matchDeclaredViewFilter({ collection, where: featuredWhere, sharedWheres: [featuredWhere] }),
    ).toEqual({ declared: featuredWhere, remainder: undefined });
  });

  it("does not trust a shared where that was never loaded (caller lacked readViews)", () => {
    expect(matchDeclaredViewFilter({ collection, where: featuredWhere, sharedWheres: [] })).toEqual({
      remainder: featuredWhere,
    });
  });

  it("does not trust an altered value against a shared view's where", () => {
    const altered = { field: "featured", op: "eq", value: false } as const;
    expect(
      matchDeclaredViewFilter({ collection, where: altered, sharedWheres: [featuredWhere] }),
    ).toEqual({ remainder: altered });
  });
});

const postsResource = defineCollection({ slug: "posts", fields: { title: text() } });
const fixtureConfig = { collections: [postsResource] } as unknown as VexConfig;
const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("loadSharedViewWheres (server)", () => {
  it("returns [] and reads nothing extra when nothing is unreadable (no RBAC configured, still just loads readable wheres)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedViewWheres({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([]);
    });
  });

  it("loads every readable shared view's where for the collection", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: { where: featuredWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedViewWheres({ ctx, config: fixtureConfig, collection: "posts" });
      expect(result).toEqual([featuredWhere]);
    });
  });

  it("resolves to [] when the caller lacks readViews, rather than throwing", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { readViews: false } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: { where: featuredWhere },
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await loadSharedViewWheres({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] } },
      });
      expect(result).toEqual([]);
    });
  });
});
```

#### packages/core/src/collections/types.ts

1 edit; everything else unchanged.

**1 — new `CollectionTableSort` type.** Insert directly above `CollectionTableConfigInput`:

```ts
/**
 * A portable sort — `{ field, order }` — used identically by
 * `defaultSort`, `find`'s `sort` arg, the list view's URL state, and saved
 * views (Design Decision 4). `TFieldSlug` narrows `field` to a collection's
 * own field slugs (plus `"_creationTime"`) where that context is
 * available; server call sites that haven't resolved a concrete collection
 * yet use the `string` default.
 */
export interface CollectionTableSort<TFieldSlug extends string = string> {
  /** The field to sort by. `"_creationTime"` needs no declared index. */
  field: TFieldSlug;
  /** Sort direction. */
  order: "asc" | "desc";
}

```

#### packages/core/src/db/types.ts

2 edits; everything else unchanged.

**1 — `PaginationOptions.totalDocs` doc.** Replace the property's JSDoc:

```ts
  /**
   * Whether to include total document count in the response.
   *
   * Only runs on the first page (when cursor is null) to avoid wasteful re-counting.
   * Counts all documents matching the current filters/search query.
   *
   * Returns `null` if the count exceeds Convex transaction limits (>32k documents).
   *
   * @default false
   */
  totalDocs?: boolean;
```

with:

```ts
  /**
   * Whether to include a total document count in the response.
   *
   * Only runs on the first page (when cursor is null) to avoid wasteful
   * re-counting. Counts at most `admin.table.countLimit + 1` matching
   * documents (default 1000) — see `PaginationResult.totalDocsCapped`
   * (Design Decision 35).
   *
   * @default false
   */
  totalDocs?: boolean;
```

**2 — `PaginationResult`: `totalDocs` is capped, not nullable.** Replace:

```ts
export type PaginationResult<T> = ConvexPaginationResult<T> & {
  totalDocs?: number | null;
};
```

with:

```ts
/**
 * `totalDocs` / `totalDocsCapped` are only present on the first page
 * (`cursor: null`) of a call that requested `paginationOpts.totalDocs:
 * true` — `find` / `search` count at most `admin.table.countLimit + 1`
 * rows (default 1000) instead of `.collect()`-ing every matching row
 * (Design Decision 35). `totalDocsCapped: true` means the real count is AT
 * LEAST `totalDocs` — the UI renders "Showing 25 of 1,000+" rather than an
 * exact number past the cap.
 */
export type PaginationResult<T> = ConvexPaginationResult<T> & {
  totalDocs?: number;
  totalDocsCapped?: boolean;
};
```

#### packages/core/src/collections/api/find/server.ts

7 edits; everything else unchanged.

**1 — imports: alias the access package's rule-index resolver, add `AccessDocFieldFor`.** Replace the `"../../../access"` import:

```ts
import {
  resolveQueryConstraint,
  resolveQueryIndex,
  SYSTEM_FIELD_KEYS,
} from "../../../access";
```

with:

```ts
import {
  AccessDocFieldFor,
  CRUD_ACTIONS,
  PERMISSION_SCOPES,
  resolveQueryConstraint,
  resolveQueryIndex as resolveAccessQueryIndex,
  SYSTEM_FIELD_KEYS,
} from "../../../access";
import { resolveFieldPermissions, isFieldAllowed } from "../../../access/resolveFieldPermissions";
```

`resolveAccessQueryIndex` is the RBAC rule-index resolver (unchanged behavior); the NEW collections-level `resolveQueryIndex` (added below) handles the caller's own `sort`/`where` pushdown — the two share a name across packages, so one import is aliased.

**2 — imports: add `VexWhereNode` to the `db/queryArgs` import.** Replace:

```ts
import {
  andConvexQueryFilters,
  referencedWhereFields,
  whereFieldNames,
  whereToConvexQueryFilter,
  withIndexToConvexQueryIndex,
  type VexWhere,
  type VexWithIndex,
} from "../../../db/queryArgs";
```

with:

```ts
import {
  andConvexQueryFilters,
  referencedWhereFields,
  whereFieldNames,
  whereToConvexQueryFilter,
  withIndexToConvexQueryIndex,
  type VexWhere,
  type VexWhereNode,
  type VexWithIndex,
} from "../../../db/queryArgs";
```

**3 — imports: the new sibling helpers.** Insert after the `composeStatusQueryConstraint` import:

```ts
import { resolveQueryIndex } from "../../resolveQueryIndex";
import { matchDeclaredViewFilter, loadSharedViewWheres } from "../../matchDeclaredViewFilter";
import type { CollectionTableSort } from "../../types";
import { VexError } from "../../../errors";
```

**4 — `FindServerArgs`: add `sort`.** Insert after `withIndex`, before `paginationOpts`:

```ts

  /**
   * Portable sort — `{ field, order }`. The server resolves `field` to an
   * index via `resolveQueryIndex`, which also pushes matching equalities
   * from `where` into that index's range when one is available (Design
   * Decision 36) — callers never name an index directly (Design Decision
   * 5). Mutually exclusive with `withIndex` — passing both throws a
   * `VexError`.
   *
   * The resolved index competes for the query's one `withIndex` slot
   * through the same `pickConvexQueryIndex` arbitration as `withIndex` (an
   * access-constraint index wins a free slot; a same-named index merges
   * ranges; a differently-named caller index displaces it and the access
   * rule falls back to `.filter()`) — `sort` carries no precedence of its
   * own over an access-contributed index.
   *
   * Rejected with a `VexAccessError` when the caller cannot read
   * `sort.field` (Design Decision 26) — sort order alone would leak the
   * field's values.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", sort: { field: "publishedAt", order: "desc" } })
   * ```
   */
  sort?: CollectionTableSort<AccessDocFieldFor<TCollectionSlug>>;
```

**5 — `find()`: resolve the index (with pushdown) and the declared-filter exemption before computing `whereFields`.** Replace the block from `const accessIndex = resolveQueryIndex({` through the `whereFields` assignment (ending right before `const rbacResolvedIndex = pickConvexQueryIndex({`):

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
  const callerFilter = whereToConvexQueryFilter({
    where: args.where as VexWhere<string> | undefined,
    fields: whereFieldNames({ config: args.config, collection: args.collection }),
  });
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const whereFields =
    access !== undefined && args.where !== undefined
      ? referencedWhereFields({ where: args.where as VexWhere<string> }).filter((field) => !SYSTEM_FIELD_KEYS.has(field))
      : [];
```

with:

```ts
  if (args.sort && args.withIndex) {
    throw new VexError({
      code: "SORT_WITH_INDEX",
      collection: args.collection,
      message: `find: collection "${args.collection}" was called with both "sort" and "withIndex". Clients send "sort" (portable) or "withIndex" (explicit), never both.`,
    });
  }
  const accessIndex = resolveAccessQueryIndex({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  const collectionConfig = args.config?.collections.find((c) => c.slug === args.collection);
  // Portable sort + filter-index pushdown (Design Decision 36). Skipped
  // when the caller names an explicit `withIndex` — that index is
  // authoritative, and automatic pushdown would otherwise compete for the
  // same query slot.
  const queryIndexResolution = args.withIndex
    ? undefined
    : resolveQueryIndex({
        config: args.config,
        collection: args.collection,
        where: args.where as VexWhereNode<string> | undefined,
        sort: args.sort as CollectionTableSort<string> | undefined,
        drafts: wantsDrafts,
        access,
        auth: args.auth,
        action,
        resource,
      });
  const callerIndex = queryIndexResolution?.indexName
    ? { name: queryIndexResolution.indexName, range: queryIndexResolution.range }
    : withIndexToConvexQueryIndex({
        withIndex: args.withIndex as { name: string; range?: (q: never) => ConstraintResult } | undefined,
      });
  // `where` minus whatever Decision 36 pushed into the index's own range —
  // those equalities are already enforced by `withIndex`, so re-applying
  // them in `.filter()` would be redundant. The explicit-`withIndex` path
  // ran no pushdown, so it keeps the caller's full `where`.
  const pushdownRemainder = args.withIndex
    ? (args.where as VexWhereNode<string> | undefined)
    : queryIndexResolution?.remainder;
  const callerFilter = whereToConvexQueryFilter({
    where: pushdownRemainder as VexWhere<string> | undefined,
    fields: whereFieldNames({ config: args.config, collection: args.collection }),
  });
  // A request `where` part that deep-equals a config view's own `where` is
  // trusted server config, exempt from the field-read check below (Design
  // Decision 26's one exception — see `matchDeclaredViewFilter`). Only the
  // REMAINING parts of `where` still need every referenced field to be
  // readable.
  const configMatch = matchDeclaredViewFilter({
    collection: collectionConfig,
    where: args.where as VexWhereNode<string> | undefined,
  });
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const configWhereFields =
    access !== undefined && configMatch.remainder !== undefined
      ? referencedWhereFields({ where: configMatch.remainder as VexWhere<string> }).filter(
          (field) => !SYSTEM_FIELD_KEYS.has(field),
        )
      : [];
  // Decision 26's "Shared views" bullet: only when the config-view match
  // above still leaves an unreadable field does `find` pay for a `vex_views`
  // read — an ordinary query never touches the table. The caller's own
  // `readViews` rule gates what comes back (`loadSharedViewWheres` resolves
  // to `[]`, not an error, when denied), so an untrusted shared view never
  // becomes trusted here.
  const configFieldPermissions =
    access !== undefined && configWhereFields.length > 0
      ? resolveFieldPermissions({
          access,
          user: args.auth?.user ?? null,
          organization: args.auth?.organization,
          resource,
          action: CRUD_ACTIONS.read,
          scope: PERMISSION_SCOPES.any,
        })
      : undefined;
  const hasUnreadableConfigField =
    configFieldPermissions !== undefined &&
    configWhereFields.some((field) => !isFieldAllowed(configFieldPermissions, field));
  const sharedWheres = hasUnreadableConfigField
    ? await loadSharedViewWheres({
        ctx: args.ctx,
        config: args.config,
        access: args.access,
        collection: args.collection,
        auth: args.auth,
      })
    : [];
  const { remainder: declaredFilterRemainder } =
    sharedWheres.length === 0
      ? configMatch
      : matchDeclaredViewFilter({
          collection: collectionConfig,
          where: args.where as VexWhereNode<string> | undefined,
          sharedWheres: sharedWheres as VexWhereNode<string>[],
        });
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const whereFields =
    access !== undefined && declaredFilterRemainder !== undefined
      ? referencedWhereFields({ where: declaredFilterRemainder as VexWhere<string> }).filter(
          (field) => !SYSTEM_FIELD_KEYS.has(field),
        )
      : [];
```

**6 — `find()`: thread the resolved `order` into `findQuery`.** Replace the `findQuery` construction:

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
    order: queryIndexResolution?.order ?? args.order,
    resolvedIndex,
    filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter] }),
  });
```

**7 — `find()`: cap the total-count query instead of `.collect()`-ing it.** Replace the `if (args.paginationOpts && convexPaginationResult) { ... }` block:

```ts
  if (args.paginationOpts && convexPaginationResult) {
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) {
      try {
        if (convexPaginationResult.isDone) {
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: finalDocs.length,
          };
        } else {
          // Build same query (with filters) but collect all to count
          const countQuery = buildQuery({
            ...args,
            resolvedIndex,
            filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter] }),
          }); // Same filters as main query
          const totalDocs = readable(await countQuery.collect());
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: totalDocs.length,
          };
        }
      } catch (error) {
        // .collect() failed (>32k docs or other limit)
        console.warn("Failed to collect all documents:", error);
        return {
          ...convexPaginationResult,
          page: finalDocs,
          totalDocs: null, // Signals "too large to count"
        };
      }
    }

    // Return Convex pagination result directly with populated docs
    return {
      ...convexPaginationResult,
      page: finalDocs,
    };
  }
```

with:

```ts
  if (args.paginationOpts && convexPaginationResult) {
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) {
      if (convexPaginationResult.isDone) {
        return {
          ...convexPaginationResult,
          page: finalDocs,
          totalDocs: finalDocs.length,
          totalDocsCapped: false,
        };
      }
      // Counts at most `countLimit + 1` rows (Design Decision 35) instead
      // of `.collect()`-ing the whole matching set — the old unbounded
      // count re-scanned every matching row on each list open and failed
      // outright above Convex's ~32k-document transaction scan limit.
      const countLimit = collectionConfig?.admin.table.countLimit ?? 1000;
      const countQuery = buildQuery({
        ...args,
        order: queryIndexResolution?.order ?? args.order,
        resolvedIndex,
        filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter] }),
      }); // Same filters as main query
      const countDocs = readable(await countQuery.take(countLimit + 1));
      const totalDocsCapped = countDocs.length > countLimit;
      return {
        ...convexPaginationResult,
        page: finalDocs,
        totalDocs: totalDocsCapped ? countLimit : countDocs.length,
        totalDocsCapped,
      };
    }

    // Return Convex pagination result directly with populated docs
    return {
      ...convexPaginationResult,
      page: finalDocs,
    };
  }
```

#### packages/core/src/collections/api/find/server.test.ts

1 edit; everything else unchanged — appended after the file's last existing block (`describe("find (server) — per-index draftStatus composition")`).

```ts
// ── Step 6: portable sort + index pushdown ──────────────────────────────────
const sortPushdownResource = defineCollection({
  slug: "posts",
  fields: {
    title: text({ index: "by_title" }),
    slug: text({ index: "by_slug" }),
    body: text(),
    featured: checkbox({ index: "by_featured" }),
  },
});
const sortPushdownConfig = { collections: [sortPushdownResource] } as unknown as VexConfig;

describe("find (server) — sort", () => {
  test("sort.field resolves to the index whose first field matches, ordering through it", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Zeta", slug: "z" });
      await ctx.db.insert("posts", { title: "Alpha", slug: "a" });
      await ctx.db.insert("posts", { title: "Mid", slug: "m" });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({ ctx, collection: "posts", config: sortPushdownConfig, sort: { field: "slug", order: "asc" } } as any),
    );
    expect(docs.map((d: any) => d.slug)).toEqual(["a", "m", "z"]);
  });

  test('sort.field: "_creationTime" needs no index — orders by insertion order', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "First", slug: "first" });
      await ctx.db.insert("posts", { title: "Second", slug: "second" });
    });
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      find({
        ctx,
        collection: "posts",
        config: sortPushdownConfig,
        sort: { field: "_creationTime", order: "desc" },
      } as any),
    );
    expect(docs.map((d: any) => d.slug)).toEqual(["second", "first"]);
  });

  test("an unindexed sort.field rejects with a VexError naming the field", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        find({ ctx, collection: "posts", config: sortPushdownConfig, sort: { field: "body", order: "asc" } } as any),
      ),
    ).rejects.toThrow(
      expect.objectContaining({ data: expect.objectContaining({ code: "UNINDEXED_SORT", field: "body" }) }),
    );
  });

  test("sort and withIndex together reject — clients send one or the other, never both", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        find({
          ctx,
          collection: "posts",
          config: sortPushdownConfig,
          sort: { field: "slug", order: "asc" },
          withIndex: { name: "by_slug" },
        } as any),
      ),
    ).rejects.toThrow(expect.objectContaining({ data: expect.objectContaining({ code: "SORT_WITH_INDEX" }) }));
  });

  test("an eq condition on the sorted field's own index is pushed into its range, dropping it from .filter()", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      await ctx.db.insert("posts", { title: "C", slug: "c", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: sortPushdownConfig,
        where: { field: "featured", op: "eq", value: true },
        sort: { field: "_creationTime", order: "asc" },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["a", "c"]);
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
  const pushdownContributorAuth = { user: { _id: "u1", roles: "contributor" } };

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
        auth: pushdownContributorAuth,
        sort: { field: "slug", order: "asc" },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["b", "c"]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Access index "by_featured" cannot be applied'));
    warnSpy.mockRestore();
  });
});

// ── Step 6: declared config-view filter is exempt from the field-read check ─
const declaredFilterBaseResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});
const declaredFilterResource = {
  ...declaredFilterBaseResource,
  admin: {
    ...declaredFilterBaseResource.admin,
    useAsTitle: "title",
    table: {
      ...declaredFilterBaseResource.admin?.table,
      views: [{ viewId: "featured", name: "Featured", where: { field: "featured", op: "eq", value: true } }],
    },
  },
} as unknown as typeof declaredFilterBaseResource;
const declaredFilterAccess = {
  collections: [declaredFilterResource],
  access: defineAccess({
    roles: ["viewer"] as const,
    resources: [declaredFilterResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      viewer: {
        posts: { read: () => ({ featured: false, "*": true }) },
      },
    },
  }),
} as unknown as VexConfig;
const declaredFilterViewerAuth = { user: { _id: "u1", roles: "viewer" } };

describe("find (server) — declared view filter is exempt from the field-read check", () => {
  test("a where that deep-equals the declared view's where is trusted even though featured is unreadable", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: false });
      return find({
        ctx,
        collection: "posts",
        config: declaredFilterAccess,
        auth: declaredFilterViewerAuth,
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("the caller may narrow a declared view with their own readable-field condition", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Also featured", slug: "also-featured", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: declaredFilterAccess,
        auth: declaredFilterViewerAuth,
        where: {
          and: [
            { field: "featured", op: "eq", value: true },
            { field: "slug", op: "eq", value: "shown" },
          ],
        },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("changing the declared filter's value is NOT exempt — the unreadable condition drops every row", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: declaredFilterAccess,
        auth: declaredFilterViewerAuth,
        where: { field: "featured", op: "eq", value: false },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

// ── Step 6 / Decision 26: shared-view filter exemption (readViews) ──────────
const sharedFilterAccessWithReadViews = {
  collections: [declaredFilterResource],
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [declaredFilterResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      editor: {
        posts: { read: () => ({ featured: false, "*": true }), readViews: true },
      },
    },
  }),
} as unknown as VexConfig;
const sharedFilterEditorAuth = { user: { _id: "u2", roles: "editor" } };

describe("find (server) — shared-view filter exemption (readViews)", () => {
  test("does not read vex_views when nothing is unreadable", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      return find({
        ctx,
        collection: "posts",
        config: sharedFilterAccessWithReadViews,
        auth: sharedFilterEditorAuth,
        where: { field: "slug", op: "eq", value: "shown" },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("trusts an exact match against a shared view's where when the caller has readViews", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: false });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return find({
        ctx,
        collection: "posts",
        config: sharedFilterAccessWithReadViews,
        auth: sharedFilterEditorAuth,
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("does not trust a shared view's where when the caller lacks readViews", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return find({
        ctx,
        collection: "posts",
        config: declaredFilterAccess,
        auth: declaredFilterViewerAuth,
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs).toEqual([]);
  });

  test("does not trust an altered value against a shared view's where", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return find({
        ctx,
        collection: "posts",
        config: sharedFilterAccessWithReadViews,
        auth: sharedFilterEditorAuth,
        where: { field: "featured", op: "eq", value: false },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

// ── Step 6: total count cap ──────────────────────────────────────────────────
const countCapBaseResource = defineCollection({ slug: "posts", fields: { title: text() } });
const countCapResource = {
  ...countCapBaseResource,
  admin: { ...countCapBaseResource.admin, table: { ...countCapBaseResource.admin?.table, countLimit: 3 } },
} as unknown as typeof countCapBaseResource;
const countCapConfig = { collections: [countCapResource] } as unknown as VexConfig;

describe("find (server) — total count cap", () => {
  test("totalDocsCapped is true and totalDocs stops at countLimit once the real count exceeds it", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 6; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return find({
        ctx,
        collection: "posts",
        config: countCapConfig,
        paginationOpts: { numItems: 2, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(3);
    expect(result.totalDocsCapped).toBe(true);
  });

  test("totalDocsCapped is false and totalDocs is exact when the real count sits under the limit", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a" });
      await ctx.db.insert("posts", { title: "B", slug: "b" });
      return find({
        ctx,
        collection: "posts",
        config: countCapConfig,
        paginationOpts: { numItems: 1, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(2);
    expect(result.totalDocsCapped).toBe(false);
  });

  test("the isDone fast path (no countQuery needed) also reports totalDocsCapped: false", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Only one", slug: "only-one" });
      return find({
        ctx,
        collection: "posts",
        config: countCapConfig,
        paginationOpts: { numItems: 10, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(1);
    expect(result.totalDocsCapped).toBe(false);
  });
});
```

#### packages/core/src/collections/api/search/server.ts

6 edits; everything else unchanged.

**1 — imports: add the field-permission and access-error helpers.** Replace the `"../../../access"` import:

```ts
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  resolveQueryConstraint,
  SYSTEM_FIELD_KEYS,
} from "../../../access";
```

with:

```ts
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  isFieldAllowed,
  PERMISSION_SCOPES,
  resolveFieldPermissions,
  resolveQueryConstraint,
  SYSTEM_FIELD_KEYS,
  VexAccessError,
} from "../../../access";
```

**2 — imports: add `VexWhereNode`, `matchDeclaredViewFilter`, `VexError`.** Replace:

```ts
import {
  andConvexQueryFilters,
  referencedWhereFields,
  whereFieldNames,
  whereToConvexQueryFilter,
  type VexWhere,
} from "../../../db/queryArgs";
import { readableDocuments } from "../../../db/documents";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { requiresPublishedOnly, VERSION_STATUSES } from "../../../versions";
```

with:

```ts
import {
  andConvexQueryFilters,
  referencedWhereFields,
  whereFieldNames,
  whereToConvexQueryFilter,
  type VexWhere,
  type VexWhereNode,
} from "../../../db/queryArgs";
import { readableDocuments } from "../../../db/documents";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { requiresPublishedOnly, VERSION_STATUSES } from "../../../versions";
import { matchDeclaredViewFilter, loadSharedViewWheres } from "../../matchDeclaredViewFilter";
import { VexError } from "../../../errors";
```

**3 — `SearchServerArgs`: document `searchField` validation, add `sort` (always rejected).** Replace the `searchField` property:

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
   * Decision 2) — and against the caller's field-read access, which throws
   * a `VexAccessError` (Design Decision 26): search hits on a field the
   * caller cannot read would leak its values just as much as a sortable
   * column would.
   */
  searchField: string;

  /**
   * Always absent on `search` — typed `never` so a caller building args
   * from shared `{ sort, search, searchField }` state gets a compile error
   * if it forwards `sort` here. `search` also throws a `VexError` at
   * runtime if one arrives anyway (Design Decision 7: search results are
   * relevance-ordered, so sort and search are mutually exclusive). Clear
   * `sort` before searching, or clear the search query to sort — `find`'s
   * `sort` is the only route to a sorted read.
   */
  sort?: never;
```

**4 — `search()`: reject `sort`, validate `searchField` against the allow-list.** Insert at the top of the function body, before `const { access, action, resource } = resolveAccessCall({`:

```ts
  if ((args as { sort?: unknown }).sort !== undefined) {
    throw new VexError({
      code: "SORT_WHILE_SEARCHING",
      collection: args.collection,
      message: `search: collection "${args.collection}" was called with "sort" while searching. Search results are relevance-ordered — clear "sort" to search, or clear the search query to sort.`,
    });
  }
  const collectionConfig = args.config?.collections.find((c) => c.slug === args.collection);
  const searchFieldAllowList = collectionConfig?.admin.table.searchField;
  if (searchFieldAllowList && !searchFieldAllowList.includes(args.searchField)) {
    throw new VexError({
      code: "SEARCH_FIELD_NOT_ALLOWED",
      collection: args.collection,
      searchField: args.searchField,
      message: `search: collection "${args.collection}" was called with searchField "${args.searchField}", which is not declared in admin.table.searchField (${searchFieldAllowList.join(", ")}).`,
    });
  }

```

**5 — `search()`: validate `searchField` against the caller's field-read access.** Insert after the `resolveAccessCall` call, before `const rbacFilter = resolveQueryConstraint({`:

```ts
  if (access !== undefined) {
    const searchFieldPermissions = resolveFieldPermissions({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      scope: PERMISSION_SCOPES.any,
    });
    if (!isFieldAllowed(searchFieldPermissions, args.searchField)) {
      throw new VexAccessError({
        resource,
        action,
        field: args.searchField,
        message: `search: collection "${args.collection}" was called with searchField "${args.searchField}", which the caller cannot read.`,
      });
    }
  }
```

(The `resolveAccessCall` call itself is unchanged — shown above only as the anchor the new block follows.)

**6 — `search()`: the declared-filter field-read exemption, and the capped total-count query.** Replace the block from the `// Only enforced reads are guarded` comment through the end of the function's pagination branch:

```ts
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const whereFields =
    access !== undefined && args.where !== undefined
      ? referencedWhereFields({ where: args.where as VexWhere<string> }).filter((field) => !SYSTEM_FIELD_KEYS.has(field))
      : [];
```

with:

```ts
  // A request `where` part that deep-equals a config view's own `where` is
  // trusted server config, exempt from the field-read check below (Design
  // Decision 26's one exception — see `matchDeclaredViewFilter`).
  const configMatch = matchDeclaredViewFilter({
    collection: collectionConfig,
    where: args.where as VexWhereNode<string> | undefined,
  });
  const configWhereFields =
    access !== undefined && configMatch.remainder !== undefined
      ? referencedWhereFields({ where: configMatch.remainder as VexWhere<string> }).filter(
          (field) => !SYSTEM_FIELD_KEYS.has(field),
        )
      : [];
  // Decision 26's "Shared views" bullet — same lazy, `readViews`-gated read
  // as `find` (`collections/api/find/server.ts`): only when the config-view
  // match still leaves an unreadable field does `search` pay for a
  // `vex_views` read.
  const configFieldPermissions =
    access !== undefined && configWhereFields.length > 0
      ? resolveFieldPermissions({
          access,
          user: args.auth?.user ?? null,
          organization: args.auth?.organization,
          resource,
          action: CRUD_ACTIONS.read,
          scope: PERMISSION_SCOPES.any,
        })
      : undefined;
  const hasUnreadableConfigField =
    configFieldPermissions !== undefined &&
    configWhereFields.some((field) => !isFieldAllowed(configFieldPermissions, field));
  const sharedWheres = hasUnreadableConfigField
    ? await loadSharedViewWheres({
        ctx: args.ctx,
        config: args.config,
        access: args.access,
        collection: args.collection,
        auth: args.auth,
      })
    : [];
  const { remainder: declaredFilterRemainder } =
    sharedWheres.length === 0
      ? configMatch
      : matchDeclaredViewFilter({
          collection: collectionConfig,
          where: args.where as VexWhereNode<string> | undefined,
          sharedWheres: sharedWheres as VexWhereNode<string>[],
        });
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const whereFields =
    access !== undefined && declaredFilterRemainder !== undefined
      ? referencedWhereFields({ where: declaredFilterRemainder as VexWhere<string> }).filter(
          (field) => !SYSTEM_FIELD_KEYS.has(field),
        )
      : [];
```

Then, separately, replace the `if (args.paginationOpts) { ... }` block at the end of `search()`:

```ts
  if (args.paginationOpts) {
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) {
      try {
        // Build same search query but collect all to count
        const countQuery = buildQuery({ ...args, filter }); // Same search params
        const allDocs = readable(await countQuery.collect());

        if (convexPaginationResult) {
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: allDocs.length,
          };
        }
      } catch (error) {
        console.warn("Failed to count search results:", error);
        if (convexPaginationResult) {
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: null,
          };
        }
      }
    }

    if (convexPaginationResult) {
      // Return Convex pagination result directly with populated docs
      return {
        ...convexPaginationResult,
        page: finalDocs as DocReturnItem<TCollectionSlug, TPopulate, D>[],
      };
    }
  }
```

with:

```ts
  if (args.paginationOpts) {
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor && convexPaginationResult) {
      if (convexPaginationResult.isDone) {
        return {
          ...convexPaginationResult,
          page: finalDocs,
          totalDocs: finalDocs.length,
          totalDocsCapped: false,
        };
      }
      // Counts at most `countLimit + 1` rows (Design Decision 35) instead
      // of `.collect()`-ing the whole matching set — see `find/server.ts`
      // for the same cap.
      const countLimit = collectionConfig?.admin.table.countLimit ?? 1000;
      const countQuery = buildQuery({ ...args, filter }); // Same search params
      const countDocs = readable(await countQuery.take(countLimit + 1));
      const totalDocsCapped = countDocs.length > countLimit;
      return {
        ...convexPaginationResult,
        page: finalDocs,
        totalDocs: totalDocsCapped ? countLimit : countDocs.length,
        totalDocsCapped,
      };
    }

    if (convexPaginationResult) {
      // Return Convex pagination result directly with populated docs
      return {
        ...convexPaginationResult,
        page: finalDocs as DocReturnItem<TCollectionSlug, TPopulate, D>[],
      };
    }
  }
```

#### packages/core/src/collections/api/search/server.test.ts

1 edit; everything else unchanged — appended after the file's last existing block (`describe("search (server) — field-level read shaping")`).

```ts
// ── Step 6: sort rejection, searchField validation, declared-filter exemption, count cap ──
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
    ).rejects.toThrow(expect.objectContaining({ data: expect.objectContaining({ code: "SORT_WHILE_SEARCHING" }) }));
  });
});

describe("search (server) — searchField validated against admin.table.searchField", () => {
  const searchFieldAllowListBaseResource = defineCollection({
    slug: "posts",
    fields: { title: text(), body: text() },
  });
  const searchFieldAllowListResource = {
    ...searchFieldAllowListBaseResource,
    admin: {
      ...searchFieldAllowListBaseResource.admin,
      table: { ...searchFieldAllowListBaseResource.admin?.table, searchField: ["title"] },
    },
  } as unknown as typeof searchFieldAllowListBaseResource;
  const searchFieldAllowListConfig = { collections: [searchFieldAllowListResource] } as unknown as VexConfig;

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

describe("search (server) — searchField validated against field-read access", () => {
  const searchFieldAccessResource = defineCollection({
    slug: "posts",
    fields: { title: text(), body: text() },
  });
  const searchFieldAccessConfig = {
    collections: [searchFieldAccessResource],
    access: defineAccess({
      roles: ["viewer"] as const,
      resources: [searchFieldAccessResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: { viewer: { posts: { read: () => ({ title: false, "*": true }) } } },
    }),
  } as unknown as VexConfig;
  const searchFieldAccessViewerAuth = { user: { _id: "u1", roles: "viewer" } };

  test("searching on an unreadable field throws VexAccessError", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        search({
          ctx,
          collection: "posts",
          config: searchFieldAccessConfig,
          auth: searchFieldAccessViewerAuth,
          query: "",
          searchIndexName: "search_title",
          searchField: "title",
        } as any),
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        data: expect.objectContaining({ code: "ACCESS_DENIED", resource: "posts", action: "read", field: "title" }),
      }),
    );
  });
});

const declaredFilterSearchBaseResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});
const declaredFilterSearchResource = {
  ...declaredFilterSearchBaseResource,
  admin: {
    ...declaredFilterSearchBaseResource.admin,
    useAsTitle: "title",
    table: {
      ...declaredFilterSearchBaseResource.admin?.table,
      views: [{ viewId: "featured", name: "Featured", where: { field: "featured", op: "eq", value: true } }],
    },
  },
} as unknown as typeof declaredFilterSearchBaseResource;
const declaredFilterSearchAccess = {
  collections: [declaredFilterSearchResource],
  access: defineAccess({
    roles: ["viewer"] as const,
    resources: [declaredFilterSearchResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { viewer: { posts: { read: () => ({ featured: false, "*": true }) } } },
  }),
} as unknown as VexConfig;
const declaredFilterSearchViewerAuth = { user: { _id: "u1", roles: "viewer" } };

describe("search (server) — declared view filter is exempt from the field-read check", () => {
  test("a where that deep-equals the declared view's where is trusted even though featured is unreadable", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: false });
      return search({
        ctx,
        collection: "posts",
        config: declaredFilterSearchAccess,
        auth: declaredFilterSearchViewerAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("changing the declared filter's value is NOT exempt — the unreadable condition drops every row", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      return search({
        ctx,
        collection: "posts",
        config: declaredFilterSearchAccess,
        auth: declaredFilterSearchViewerAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: false },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

const sharedFilterSearchAccessWithReadViews = {
  collections: [declaredFilterSearchResource],
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [declaredFilterSearchResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      editor: { posts: { read: () => ({ featured: false, "*": true }), readViews: true } },
    },
  }),
} as unknown as VexConfig;
const sharedFilterSearchEditorAuth = { user: { _id: "u2", roles: "editor" } };

describe("search (server) — shared-view filter exemption (readViews)", () => {
  test("does not read vex_views when nothing is unreadable", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      return search({
        ctx,
        collection: "posts",
        config: sharedFilterSearchAccessWithReadViews,
        auth: sharedFilterSearchEditorAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "slug", op: "eq", value: "shown" },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("trusts an exact match against a shared view's where when the caller has readViews", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: false });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return search({
        ctx,
        collection: "posts",
        config: sharedFilterSearchAccessWithReadViews,
        auth: sharedFilterSearchEditorAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs.map((d: any) => d.slug)).toEqual(["shown"]);
  });

  test("does not trust a shared view's where when the caller lacks readViews", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return search({
        ctx,
        collection: "posts",
        config: declaredFilterSearchAccess,
        auth: declaredFilterSearchViewerAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: true },
      } as any);
    });
    expect(docs).toEqual([]);
  });

  test("does not trust an altered value against a shared view's where", async () => {
    const t = convexTest(schema, modules);
    const docs: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Shown", slug: "shown", featured: true });
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "shared-featured",
        name: "Shared featured",
        state: { where: { field: "featured", op: "eq", value: true } },
        createdBy: "u2",
      });
      return search({
        ctx,
        collection: "posts",
        config: sharedFilterSearchAccessWithReadViews,
        auth: sharedFilterSearchEditorAuth,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        where: { field: "featured", op: "eq", value: false },
      } as any);
    });
    expect(docs).toEqual([]);
  });
});

const searchCountCapBaseResource = defineCollection({ slug: "posts", fields: { title: text() } });
const searchCountCapResource = {
  ...searchCountCapBaseResource,
  admin: { ...searchCountCapBaseResource.admin, table: { ...searchCountCapBaseResource.admin?.table, countLimit: 3 } },
} as unknown as typeof searchCountCapBaseResource;
const searchCountCapConfig = { collections: [searchCountCapResource] } as unknown as VexConfig;

describe("search (server) — total count cap", () => {
  test("totalDocsCapped is true and totalDocs stops at countLimit once the real count exceeds it", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      for (let i = 0; i < 6; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}`, slug: `s-${i}` });
      }
      return search({
        ctx,
        collection: "posts",
        config: searchCountCapConfig,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        paginationOpts: { numItems: 2, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(3);
    expect(result.totalDocsCapped).toBe(true);
  });

  test("totalDocsCapped is false and totalDocs is exact when the real count sits under the limit", async () => {
    const t = convexTest(schema, modules);
    const result: any = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a" });
      await ctx.db.insert("posts", { title: "B", slug: "b" });
      return search({
        ctx,
        collection: "posts",
        config: searchCountCapConfig,
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        paginationOpts: { numItems: 1, cursor: null, totalDocs: true },
      } as any);
    });
    expect(result.totalDocs).toBe(2);
    expect(result.totalDocsCapped).toBe(false);
  });
});
```

#### packages/core/src/collections/api/collectionsApi.ts

2 edits; everything else unchanged.

**1 — imports.** Add after the `VexApiAuth` import:

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

`search`'s registration is unchanged — no `sort`, no `view`. Its args validator never declaring `sort` is what makes "sort rejected while searching" true at the public-API boundary (an unknown arg throws Convex's own `ArgumentValidationError`), on top of `search()`'s own runtime guard (edit 4 above) for direct server-side callers.

Verify: `pnpm --filter @vexcms/core test -- collections`

### Step 7 — Views server API [agent]

Why: Shared views CRUD must enforce the four `VIEW_ACTIONS` (`readViews`/`createView`/`updateView`/`deleteView`) server-side, scope by org, store an optional `description` alongside each view (revised Decision 11), and — new per the architecture review's Decision 26 — `saveView` must reject a `where` that references a field the saving user can't read, so a shared filter can never encode a yes/no condition on data its author (or anyone else) is denied.

- [ ] `packages/core/src/collections/api/listViews/server.ts` + `.test.ts` (new) — list for collection, scoped to `organizationId` resolved server-side from the caller's session; gated on `readViews` with `PERMISSION_SCOPES.any` — resolves to `[]` when denied (shared views are invisible, not an error — Decision 13)
- [ ] `packages/core/src/collections/api/saveView/server.ts` + `.test.ts` (new) — create/patch, idempotent on `viewId` (promotion dedupe); an insert requires `createView`, a patch requires `updateView`; stores `description`; rejects a `view.state.where` referencing an unreadable field (Decision 26)
- [ ] `packages/core/src/collections/api/removeView/server.ts` + `.test.ts` (new) — delete, requires `deleteView`
- [ ] `packages/core/src/collections/api/types.ts` — shared arg/result types for the three operations
- [ ] `packages/core/src/collections/api/collectionsApi.ts` — registers `listViews`/`saveView`/`removeView`
- [ ] `packages/core/src/vexConvexApi.ts` — exports the three Convex function references
- [ ] `packages/core/src/db/test/convex/schema.ts` — `vex_views` table added to `@vexcms/core`'s own hand-maintained test fixture schema (Decision 24), including `description`
- [ ] `packages/react/src/collections/api/listViews/client.ts` + `packages/react/src/collections/api/saveView/client.ts` + `packages/react/src/collections/api/removeView/client.ts` (new) — tanstack-query wrappers
- [ ] `packages/react/src/client/index.ts` — re-exports the three client ops + `VexStoredView`/`VexViewConfig` types

#### packages/core/src/collections/api/listViews/server.ts

```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import type { VexStoredView } from "../../types";
import { VIEW_ACTIONS, PERMISSION_SCOPES, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";

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
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /**
   * Resolved caller identity. Checked against `readViews` (decision 13)
   * before any row is read, and consulted to read `auth.organization`
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
 *
 * Gated on `readViews` (decision 13), checked with `scope: PERMISSION_SCOPES.any`
 * — the same "may they ever see this list?" question nav/sidebar gating asks
 * (there is no per-row document to evaluate a callback against; per-view
 * access is a later `readViews` rule with a `where` over `vex_views` rows,
 * not this step). Denied resolves to `[]`, not a thrown error — shared
 * views are invisible, not broken, until a project grants `readViews`. A
 * no-op gate (every caller passes) when `config.access` is unset, matching
 * `assertVersionsAccess`'s convention.
 *
 * Scoped to the caller's own organization via the `by_collection_org` index
 * when `config.access.orgCollectionSlug` is configured AND `auth.organization`
 * resolves an id; otherwise reads the full collection-wide set via
 * `by_collection`. The organization id is never taken from the client —
 * only from the server-resolved `auth`.
 *
 * Does not merge in `config` (code-defined, read through `toClientViewConfig`,
 * Step 5) or `local` (localStorage) views, and never returns a view's hidden
 * `where` for a config view — there is none here, `shared` rows carry only
 * the saver's own `where` (Decision 25). The merge across sources happens
 * client-side in `useListViews` (Step 12).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, collection, access?, auth? }`.
 * @returns Every `vex_views` row for `collection` the caller may see, unordered,
 *   or `[]` when the caller lacks `readViews`.
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
  // 1. args.config.access === undefined → skip to step 2 (RBAC off project-wide)
  // 1a. { access, action, resource } = resolveAccessCall({ config: args.config, access: args.access,
  //       defaultAction: VIEW_ACTIONS.readViews, resource: args.collection })
  // 1b. allowed = hasPermission({ access, user: args.auth?.user ?? null,
  //       organization: args.auth?.organization, resource, action, scope: PERMISSION_SCOPES.any })
  // 1c. !allowed → return [] (shared views are invisible without readViews)
  // 2. organizationId = args.config.access?.orgCollectionSlug !== undefined
  //      ? (args.auth?.organization as { _id?: string } | undefined)?._id
  //      : undefined
  // 3a. organizationId !== undefined → rows = await args.ctx.db.query("vex_views")
  //       .withIndex("by_collection_org", (q) =>
  //         q.eq("collection", args.collection).eq("organizationId", organizationId))
  //       .collect()
  //     → compound index, chain both `.eq()` calls on the same query builder
  // 3b. organizationId === undefined → rows = await args.ctx.db.query("vex_views")
  //       .withIndex("by_collection", (q) => q.eq("collection", args.collection))
  //       .collect()
  //     → every shared view for the collection, regardless of org — reached
  //       both when `orgCollectionSlug` is unconfigured AND when the caller
  //       has no resolved organization yet
  // 4. return rows as unknown as VexStoredView[]
  //    → row shape (`collection`, `viewId`, `name`, `description?`, `state`,
  //      `organizationId?`, `createdBy`) already matches `VexStoredView`
  //      field-for-field; only the Convex `_id`/`_creationTime` system
  //      fields are extra and unused
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
        description: "Testimonials marked featured",
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
      expect(result[0]).toMatchObject({
        viewId: "v1",
        name: "Featured",
        description: "Testimonials marked featured",
        collection: "posts",
      });
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
        permissions: { editor: { posts: { readViews: true } } },
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

  test("denies the list when the caller lacks readViews, returning [] rather than throwing", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { readViews: false } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] } },
      });
      expect(result).toEqual([]);
    });
  });

  test("allows the list when the caller has readViews", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { readViews: true } } },
      }),
    } as unknown as VexConfig;

    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtxLike) => {
      await ctx.db.insert("vex_views", {
        collection: "posts",
        viewId: "v1",
        name: "Featured",
        state: {},
        createdBy: "user1",
      });
    });
    await t.run(async (ctx: GenericQueryCtx<GenericDataModel>) => {
      const result = await listViews({
        ctx,
        config,
        collection: "posts",
        auth: { user: { roles: ["editor"] } },
      });
      expect(result).toHaveLength(1);
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
import { VIEW_ACTIONS, CRUD_ACTIONS, PERMISSION_SCOPES, VexAccessError, hasPermission } from "../../../access";
import type { ViewAction } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { resolveFieldPermissions, isFieldAllowed, SYSTEM_FIELD_KEYS } from "../../../access/resolveFieldPermissions";
import { referencedWhereFields } from "../../../db/queryArgs";

/**
 * Runs the RBAC gate shared by `listViews`'s mutation-shaped siblings —
 * `saveView` (`createView`/`updateView`) and `removeView` (`deleteView`),
 * fail-closed per decision 13. A no-op when `config.access` is unset,
 * matching `assertVersionsAccess`'s (`versions/api/history/server.ts`)
 * convention: RBAC only applies when the project has configured `access` at
 * all.
 *
 * @param props.resource - The collection slug the view belongs to.
 * @param props.action - Which `VIEW_ACTIONS` member gates this call.
 * @throws {VexAccessError} When the caller's roles lack `props.action` on `resource`.
 */
export function assertViewAction(props: {
  config: VexConfig;
  auth?: VexApiAuth;
  access?: AccessCallOptions<string>;
  resource: string;
  action: ViewAction;
}): void {
  // TODO: implement
  // 1. props.config.access === undefined → return (RBAC off project-wide)
  // 2. { access, action, resource } = resolveAccessCall({ config: props.config, access: props.access,
  //      defaultAction: props.action, resource: props.resource })
  // 3. hasPermission({ throwOnDenied: true, access, user: props.auth?.user ?? null,
  //      organization: props.auth?.organization, resource, action })
  //    → throws VexAccessError when denied
  throw new Error("Not implemented");
}

/**
 * Rejects a view whose `state.where` references a field the saving user
 * cannot read (decision 26, architecture review 2026-10-27). A saved filter
 * on an unreadable field would let anyone who opens the view infer a
 * yes/no condition on every row, which is exactly what field-read access
 * is meant to prevent — the same reasoning `find`/`search` apply to a
 * caller's own `where` (`readableDocuments`), extended to the filter
 * stored inside a shared view.
 *
 * A no-op when `config.access` is unset (RBAC off project-wide) or
 * `where` is undefined (the view has no filter, e.g. search- or
 * sort-only). System fields (`_id`, `_creationTime`, `_slug`) are never
 * checked — they are always retained per `SYSTEM_FIELD_KEYS`.
 *
 * Checked with `scope: PERMISSION_SCOPES.any` — there is no document to
 * evaluate a per-row filter callback against, so the question is "ever
 * readable?", the same scope the list view's `useFieldPermissions` call
 * uses to show or hide a whole column.
 *
 * @param props.resource - The collection slug the view belongs to.
 * @param props.where - The view's `state.where`, or `undefined`.
 * @throws {VexAccessError} Naming the first unreadable field found.
 */
export function assertViewWhereReadable(props: {
  config: VexConfig;
  auth?: VexApiAuth;
  resource: string;
  where: unknown;
}): void {
  // TODO: implement
  // 1. props.config.access === undefined || props.where === undefined → return
  // 2. fields = referencedWhereFields({ where: props.where as never })
  //      .filter((field) => !SYSTEM_FIELD_KEYS.has(field))
  // 3. fields.length === 0 → return
  // 4. fieldPermissions = resolveFieldPermissions({ access: props.config.access,
  //      user: props.auth?.user ?? null, organization: props.auth?.organization,
  //      resource: props.resource, action: CRUD_ACTIONS.read, scope: PERMISSION_SCOPES.any })
  // 5. unreadable = fields.find((field) => !isFieldAllowed(fieldPermissions, field))
  // 6. unreadable !== undefined → throw new VexAccessError({
  //      resource: props.resource, action: CRUD_ACTIONS.read, field: unreadable,
  //      message: `Can't save this view — filter field "${unreadable}" is not readable.`,
  //    })
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
   * never a client-supplied organization id. Also the identity checked against
   * `view.state.where` by `assertViewWhereReadable`.
   */
  auth?: VexApiAuth;
  /** The collection slug the view belongs to. */
  collection: CollectionSlug;
  /**
   * The view to save. `viewId` is client-generated (decision 14) and is
   * the idempotency key: a second call with the same `viewId` patches the
   * existing row in place instead of inserting a duplicate — this is what
   * makes promotion (local → shared) safe against another tab racing the
   * same save. `view.description` is optional free text, stored verbatim
   * and shown under the view's name (Step 12). `view.state.where` is the
   * saver's own filter only — never a config view's hidden `where`
   * (decision 25); "Save as new view" from a config view never carries
   * the hidden filter into `state`.
   */
  view: VexViewConfig;
}

/**
 * Creates or patches one `vex_views` row — an insert requires `createView`,
 * a patch requires `updateView` (decision 13), so the gate runs AFTER the
 * idempotency lookup decides which action applies. Idempotent on
 * `view.viewId` (decision 14). Stores `view.description` alongside `name`
 * and `state`; an undefined `description` clears any previously saved one
 * on patch.
 *
 * The idempotency lookup (`by_view_id`) runs first — it only confirms
 * whether a row exists and which collection it belongs to, leaking nothing
 * beyond that, so running it before the access gate is safe. Access and the
 * field-read check (decision 26) both run before any row is written.
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, collection, view, access?, auth? }`.
 * @returns The saved view's `viewId` (unchanged from `args.view.viewId`).
 * @throws {ConvexError} When an existing row for `view.viewId` belongs to a
 *   different collection.
 * @throws {VexAccessError} When the caller's roles lack `createView` (insert) or
 *   `updateView` (patch) on `collection`, or when `view.state.where` references
 *   a field the caller can't read.
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
  // 1. existing = await args.ctx.db.query("vex_views")
  //      .withIndex("by_view_id", (q) => q.eq("viewId", args.view.viewId))
  //      .unique()
  // 2a. existing && existing.collection !== args.collection → throw ConvexError
  //       (`viewId "${args.view.viewId}" already belongs to collection "${existing.collection}"`)
  //     → a reused viewId across collections is a client bug, never silently
  //       overwritten
  // 2b. assertViewAction({ config: args.config, auth: args.auth, access: args.access,
  //       resource: args.collection, action: existing ? VIEW_ACTIONS.updateView : VIEW_ACTIONS.createView })
  // 3. assertViewWhereReadable({ config: args.config, auth: args.auth, resource: args.collection,
  //      where: (args.view.state as { where?: unknown } | undefined)?.where })
  // 4. organizationId = args.config.access?.orgCollectionSlug !== undefined
  //       ? (args.auth?.organization as { _id?: string } | undefined)?._id
  //       : undefined
  // 5a. existing → await args.ctx.db.patch(existing._id, { name: args.view.name,
  //       description: args.view.description, state: args.view.state, organizationId })
  // 5b. !existing → await args.ctx.db.insert("vex_views", { collection: args.collection,
  //       viewId: args.view.viewId, name: args.view.name, description: args.view.description,
  //       state: args.view.state, organizationId,
  //       createdBy: (args.auth?.user as { _id?: string } | null)?._id ?? "" })
  // 6. return args.view.viewId
  // Edge cases:
  // - `auth` omitted (RBAC off, or a server-trusted internal call) → `createdBy` stores `""`
  //   and `organizationId` stays `undefined`, same as an unscoped project
  // - `args.view.description` omitted → stored as `undefined` both on insert and on patch
  //   (a patch with an explicit `undefined` clears a previously saved description)
  // - `args.view.state.where` omitted → `assertViewWhereReadable` is a no-op (step 3 above)
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
  fields: { title: text(), internalScore: text() },
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

  test("stores an optional description on insert and patch", async () => {
    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", description: "Featured posts", state: {} },
      });
      let rows = await ctx.db.query("vex_views").collect();
      expect(rows[0]).toMatchObject({ description: "Featured posts" });

      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", description: "Renamed description", state: {} },
      });
      rows = await ctx.db.query("vex_views").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ description: "Renamed description" });
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

  test("denies an insert when the caller lacks createView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { createView: false } } },
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

  test("allows an insert when the caller has createView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["admin"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { admin: { posts: { createView: true } } },
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

  test("denies a patch (existing viewId) when the caller has createView but lacks updateView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { createView: true, updateView: false } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
        auth: { user: { roles: ["editor"] } },
      });
      await expect(
        saveView({
          ctx,
          config,
          collection: "posts",
          view: { viewId: "v1", name: "Renamed", state: {} },
          auth: { user: { roles: ["editor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows[0]).toMatchObject({ name: "Featured" });
    });
  });

  test("allows a patch when the caller has updateView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { createView: true, updateView: true } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
        auth: { user: { roles: ["editor"] } },
      });
      await saveView({
        ctx,
        config,
        collection: "posts",
        view: { viewId: "v1", name: "Renamed", state: {} },
        auth: { user: { roles: ["editor"] } },
      });
      const rows = await ctx.db.query("vex_views").collect();
      expect(rows[0]).toMatchObject({ name: "Renamed" });
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

  test("rejects a where referencing a field the caller can't read (decision 26)", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
            posts: { createView: true, read: { fields: { internalScore: false } } },
          },
        },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await expect(
        saveView({
          ctx,
          config,
          collection: "posts",
          view: {
            viewId: "v1",
            name: "High score",
            state: { where: { field: "internalScore", op: "gt", value: 90 } },
          },
          auth: { user: { roles: ["editor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
    });
  });

  test("allows a where that only references readable fields", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
            posts: { createView: true, read: { fields: { internalScore: false } } },
          },
        },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const viewId = await saveView({
        ctx,
        config,
        collection: "posts",
        view: {
          viewId: "v1",
          name: "Titled",
          state: { where: { field: "title", op: "eq", value: "Hello" } },
        },
        auth: { user: { roles: ["editor"] } },
      });
      expect(viewId).toBe("v1");
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(1);
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
import { assertViewAction } from "../saveView/server";
import { VIEW_ACTIONS } from "../../../access";

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
 * Permanently deletes one `vex_views` row, gated on `deleteView`
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
 * @throws {VexAccessError} When the caller's roles lack `deleteView` on `collection`.
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
  // 1. assertViewAction({ config: args.config, auth: args.auth, access: args.access,
  //      resource: args.collection, action: VIEW_ACTIONS.deleteView })
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

  test("denies a delete when the caller lacks deleteView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { editor: { posts: { deleteView: false } } },
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

  test("allows a delete when the caller has deleteView", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["admin"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { admin: { posts: { deleteView: true } } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      await saveView({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        view: { viewId: "v1", name: "Featured", state: {} },
      });
      await removeView({
        ctx,
        config,
        collection: "posts",
        viewId: "v1",
        auth: { user: { roles: ["admin"] } },
      });
      expect(await ctx.db.query("vex_views").collect()).toHaveLength(0);
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

`VexStoredView` is used only as the `listViews` endpoint's return type in `vexConvexApi.ts`, not inside this file's own declarations — imported here so `vexConvexApi.ts` can pull it alongside the arg types from one module. `VexViewConfig` (Step 5) carries the optional `description` field that `saveView` now persists, and the `state.where` field that `assertViewWhereReadable` now checks.

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
   * Lists every shared `vex_views` row for a collection the caller may see.
   * Gated on `readViews` (decision 13) — resolves to `[]`, not a thrown
   * error, when denied.
   */
  listViews: anyApi.vex.listViews as FunctionReference<
    "query",
    "public",
    VexListViewsArgs,
    VexStoredView[]
  >,

  /**
   * Creates or patches a shared view, keyed by `viewId`. An insert requires
   * `createView`, a patch requires `updateView` (decision 13), and the
   * server rejects a `where` referencing a field the caller can't read
   * (decision 26).
   */
  saveView: anyApi.vex.saveView as FunctionReference<
    "mutation",
    "public",
    VexSaveViewArgs,
    string
  >,

  /**
   * Permanently deletes a shared view. Requires `deleteView`.
   */
  removeView: anyApi.vex.removeView as FunctionReference<
    "mutation",
    "public",
    VexRemoveViewArgs,
    void
  >,

```

#### packages/core/src/db/test/convex/schema.ts

1 edit: a new `vex_views` table, needed by this step's own tests — `generateVexSchema.ts` (Step 5) emits the real one, including `description`, but this fixture schema is hand-maintained for `@vexcms/core`'s test suite and mirrors `vex_versions`/`vex_globals` by hand.

**1 — new table.** Alongside the existing `vex_versions: defineTable({ ... })` table:

```ts
  vex_views: defineTable({
    collection: v.string(),
    viewId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
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
 * Merge with `config` (`admin.table.views`, via `toClientViewConfig`, Step 5)
 * and `local` (localStorage) views client-side — see `useListViews` (Step 12).
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
 *   view: {
 *     viewId: crypto.randomUUID(),
 *     name: "Featured",
 *     description: "Testimonials marked featured",
 *     state: { search: "featured" },
 *   },
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
   * `description` is optional free text shown under the view's name (Step 12).
   * `state.where`, when present, must reference only fields the caller can
   * read — the server rejects anything else (decision 26).
   */
  view: VexViewConfig;
}

/**
 * Returns a `mutationFn` for creating or patching a shared view. Idempotent
 * on `view.viewId`. An insert requires `createView` on `collection`, a patch
 * requires `updateView` — throws `VexAccessError` server-side otherwise, as
 * does a `view.state.where` referencing a field the caller can't read (decision 26).
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
 * `deleteView` on `collection` — throws `VexAccessError` server-side
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

### Step 8 — Data-source hooks: `useVexListQuery` / `useVexDocQuery` [agent]

Why: the hook boundary is where plugin, adapter, and adopted-table sources plug in later (Design Decision 19); list/edit views stop calling `vexConvexApi` directly. The names gain the `Query` suffix to read as data fetching, distinct from the edit view's `useVexDocument()` context hook (`documents/VexDocumentContext.tsx`). Step 8 ships full code, not guided stubs (Decision 1), so `useVexListQuery`'s search-mode path is a real, cursor-paginated implementation here. There is **no `view` arg** anywhere in this file — `find`/`search` take none (Decision 25/26), and a caller who needs a config view's hidden filter composes it into `where` itself with `composeViewWhere` (Step 5) before calling either hook. `useVexListQuery` surfaces `totalDocsCapped` (Decision 35), threaded through from `usePaginatedQuery`, whose own reset/`enabled` plumbing this step still adds (the "resets to the first page" half of Decision 8 lives there so `useVexListQuery` inherits it for free on every prop that can change the result set). File homes follow Step 2's restructure: `CollectionListView` lives at `collections/listView/CollectionListView.tsx` and `CollectionEditView` at `collections/editView/CollectionEditView.tsx`; `MediaCollectionListView` is untouched by Step 2 and stays under `media/`.

Verify: pnpm --filter @vexcms/react test -- hooks collections && browser: list + edit views unchanged

- [ ] `packages/react/src/hooks/useVexListQuery.ts` (new) + `packages/react/src/hooks/useVexListQuery.test.tsx` (new) — `{ collection, where, sort, search, searchField, drafts, pageSize }` → `{ results, totalDocs, totalDocsCapped, isDone, loadMore, isPending }`; `find`-mode wraps `usePaginatedQuery`, search-mode is a sibling cursor accumulator against `vexConvexApi.search`, both called unconditionally and toggled via `enabled`
- [ ] `packages/react/src/hooks/useVexDocQuery.ts` (new) + `packages/react/src/hooks/useVexDocQuery.test.tsx` (new)
- [ ] `packages/react/src/hooks/usePaginatedQuery.ts` — render-time query-identity reset (Decision 8) + an `enabled` prop so `useVexListQuery` can call it unconditionally, plus `totalDocsCapped` on the return value (Decision 35)
- [ ] `packages/react/src/hooks/index.ts` — barrel exports the two new hooks
- [ ] `packages/react/src/collections/api/find/client.ts` — `FindClientArgs`/`FindClientPaginatedArgs` gain `sort?: CollectionTableSort<string>`; no `view` field (Decision 25/26 — `find` takes none)
- [ ] `packages/react/src/testing/convex/bridge.ts` + `packages/react/src/testing/hooksSuite.tsx` — test-harness support for the two new hooks, plus coverage for `usePaginatedQuery`'s reset behavior and `totalDocsCapped`
- [ ] `packages/react/src/collections/listView/CollectionListView.tsx` (Step 2's new path), `packages/react/src/media/MediaCollectionListView.tsx`, `packages/react/src/collections/editView/CollectionEditView.tsx` (Step 2's new path) migrated; no direct `vexConvexApi` reads in those files (mutations stay, Design Decision 19's hook boundary is read-side)

#### packages/react/src/hooks/useVexListQuery.ts

New file, complete.

```ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { vexConvexApi } from "@vexcms/core";
import type {
  CollectionConfig,
  CollectionSlug,
  CollectionTableSort,
  MediaCollectionConfig,
  PaginationResult,
  VexDocument,
  VexWhere,
} from "@vexcms/core";
import { whereArg } from "../collections/api/whereArg";
import { usePaginatedQuery } from "./usePaginatedQuery";
import type { UsePaginatedQueryReturn } from "./usePaginatedQuery";

/**
 * Props for {@link useVexListQuery}.
 *
 * `collection` takes the resolved config object, not a bare slug — the same
 * shape `usePaginatedSearch` already accepts — so this hook can read
 * `admin.table.serverPageSize` without a second lookup, and works for both a
 * `CollectionConfig` and a `MediaCollectionConfig` without a `TCollectionSlug`
 * generic (those are two separate slug unions no single type parameter can
 * express without an overload pair this hook doesn't need).
 *
 * There is no `view` prop: `find`/`search` take no view argument (Design
 * Decision 25/26). A caller that needs a config view's hidden filter
 * composes it into `where` itself with `composeViewWhere({ viewWhere,
 * filter })` (Step 5, `@vexcms/core`) before it ever reaches this hook —
 * the hook only ever sees one plain `where`.
 *
 * @typeParam TDocument - The document shape `results` resolves to.
 */
export interface UseVexListQueryProps<TDocument extends VexDocument = VexDocument> {
  /** The resolved collection (or media collection) config, from `useVexConfig()`. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** Predicate over the collection's fields: a builder callback or a plain node. */
  where?: VexWhere<CollectionSlug>;
  /**
   * Portable sort — never an index name (Design Decision 5). Ignored, and
   * never sent, while `search` is a non-empty string (Design Decision 7).
   */
  sort?: CollectionTableSort<string>;
  /**
   * Raw search text. `undefined`/`""` runs `find` + `sort`. A non-empty
   * value switches to a search-mode query against `searchField`'s declared
   * index and parks `sort` — never sent to `search` (Design Decision 7).
   */
  search?: string;
  /**
   * Which `admin.table.searchField` entry `search` queries. Required when
   * `search` is non-empty — the caller (Step 10's search picker) always
   * supplies one, and `validateTableConfig` (Design Decision 3) guarantees
   * that entry has a declared `searchIndex`.
   */
  searchField?: string;
  /** Include draft versions of versioned documents. */
  drafts?: boolean;
  /**
   * Documents revealed per Load More click / page-size select — independent
   * of the server's larger fetch batch. Changing this prop, `where`, `sort`,
   * or `search` resets the list to the first page (Design Decision 8): a
   * `where`/`sort`/`drafts` change clears the accumulated pages, and a
   * `pageSize`-only change re-windows the already-loaded rows to the new
   * size without an extra fetch. Both branches below inherit this from
   * their own render-time query-identity tracking.
   */
  pageSize: number;
  /** Relationship auto-populate depth, forwarded to `find`. */
  depth?: number;
  /** Server-prefetched first page, for SSR hydration. */
  initialData?: PaginationResult<TDocument>;
}

/** Return value of {@link useVexListQuery} — identical shape to `usePaginatedQuery`'s. */
export type UseVexListQueryReturn<TDocument extends VexDocument = VexDocument> =
  UsePaginatedQueryReturn<TDocument>;

/**
 * Lists documents in a collection — the data source every list view reads
 * through (Design Decision 19). Convex is the only implementation; a
 * plugin/adapter/adopted-table source is a later swap of this hook's body,
 * not its callers.
 *
 * The `find`-mode path (no `search`) wraps `usePaginatedQuery`: the server
 * batch size (`collection.admin.table.serverPageSize`) always covers at
 * least one client page — `paginationOpts.numItems` is
 * `Math.max(serverPageSize, pageSize)`, while `pageSize` itself becomes
 * `usePaginatedQuery`'s `clientPageSize`. The search-mode path runs the same
 * windowing against `vexConvexApi.search`. Both are called on every render
 * — each disabled via `enabled` while the other is active — so switching
 * between them never violates the Rules of Hooks. Search mode has no
 * `totalDocs`/`totalDocsCapped` — Convex search results carry no count.
 *
 * @typeParam TDocument - The document shape `results` resolves to.
 * @param props - Hook configuration.
 * @returns Pagination state and controls, matching `usePaginatedQuery`'s shape.
 *
 * @example
 * ```tsx
 * const pagination = useVexListQuery({
 *   collection,
 *   where: composeViewWhere({ viewWhere: activeConfigView?.where, filter }),
 *   drafts: isVersioned,
 *   depth: 1,
 *   pageSize: collection.admin.table.defaultPageSize,
 *   initialData: props.initialData,
 * });
 * ```
 */
export function useVexListQuery<TDocument extends VexDocument = VexDocument>(
  props: UseVexListQueryProps<TDocument>,
): UseVexListQueryReturn<TDocument> {
  const isSearching = (props.search?.length ?? 0) > 0;
  const numItems = Math.max(props.collection.admin.table.serverPageSize, props.pageSize);

  const findResult = usePaginatedQuery<TDocument>({
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
    enabled: !isSearching,
  });

  const searchResult = useVexListQuerySearch<TDocument>({
    collection: props.collection,
    where: props.where,
    search: props.search ?? "",
    searchField: props.searchField,
    drafts: props.drafts,
    pageSize: props.pageSize,
    numItems,
    enabled: isSearching,
  });

  return isSearching ? searchResult : findResult;
}

/**
 * The search-mode half of {@link useVexListQuery}: cursor-paginates
 * `vexConvexApi.search` against `searchField`'s declared index, windowed to
 * `pageSize` rows per Load More exactly like `usePaginatedQuery`'s own
 * `find`-mode accumulator, so the two branches are interchangeable to
 * {@link useVexListQuery}'s caller. `sort` is never part of this query
 * (Design Decision 7) — search results are relevance-ordered.
 *
 * @throws {Error} When `enabled` is `true` and `searchField` is missing, or
 *   names a field with no declared `searchIndex` — both are config-time
 *   errors `validateTableConfig` (Design Decision 3) already prevents, so
 *   reaching either here means a caller bug, not a config gap.
 */
function useVexListQuerySearch<TDocument extends VexDocument = VexDocument>(props: {
  collection: CollectionConfig | MediaCollectionConfig;
  where?: VexWhere<CollectionSlug>;
  search: string;
  searchField: string | undefined;
  drafts: boolean | undefined;
  pageSize: number;
  numItems: number;
  enabled: boolean;
}): UseVexListQueryReturn<TDocument> {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<TDocument[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [clientPageIndex, setClientPageIndex] = useState(0);

  let searchIndexName: string | undefined;
  if (props.enabled) {
    if (props.searchField === undefined) {
      throw new Error("useVexListQuery: `searchField` is required when `search` is non-empty");
    }
    const field = props.collection.fields[props.searchField];
    if (field === undefined || !("searchIndex" in field) || field.searchIndex === undefined) {
      throw new Error(`useVexListQuery: field "${props.searchField}" has no declared searchIndex`);
    }
    searchIndexName = field.searchIndex.name;
  }

  const resolvedWhere = whereArg(props.where);
  const resetKey = JSON.stringify({
    collection: props.collection.slug,
    where: resolvedWhere,
    search: props.search,
    searchField: props.searchField,
    drafts: props.drafts,
    numItems: props.numItems,
  });
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const [prevPageSize, setPrevPageSize] = useState(props.pageSize);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPrevPageSize(props.pageSize);
    setCursor(null);
    setAllResults([]);
    setIsDone(false);
    setClientPageIndex(0);
  } else if (props.pageSize !== prevPageSize) {
    setPrevPageSize(props.pageSize);
    setClientPageIndex(0);
  }

  const endIndex = (clientPageIndex + 1) * props.pageSize;
  const visibleResults = allResults.slice(0, endIndex);
  const needsServerFetch = endIndex >= allResults.length && !isDone;
  const clientIsDone = isDone && endIndex >= allResults.length;

  function loadMore() {
    if (clientIsDone) return;
    if (needsServerFetch && result.continueCursor) {
      setCursor(result.continueCursor);
    }
    setClientPageIndex((prev) => prev + 1);
  }

  const { data, isPending, isLoading, isError } = useQuery({
    ...convexQuery(vexConvexApi.search, {
      collection: props.collection.slug,
      searchIndexName: searchIndexName ?? "",
      searchField: props.searchField ?? "",
      query: props.search,
      where: resolvedWhere,
      drafts: props.drafts,
      paginationOpts: { numItems: props.numItems, cursor },
    } as never),
    enabled: props.enabled,
  });

  const result = useMemo<PaginationResult<TDocument>>(() => {
    const empty = { page: [] as TDocument[], continueCursor: "", isDone: false };
    if (isLoading || isError || !data) return empty;
    if (Array.isArray(data)) return { ...empty, page: data as TDocument[], isDone: true };
    return data as PaginationResult<TDocument>;
  }, [data, isLoading, isError]);

  useEffect(() => {
    if (result.page) {
      if (cursor === null) {
        setAllResults(result.page);
      } else {
        setAllResults((prev) => [...prev, ...result.page]);
      }
      setIsDone(result.isDone);
    }
  }, [result.page, result.isDone, cursor]);

  return {
    results: visibleResults,
    totalDocs: undefined,
    totalDocsCapped: false,
    isDone: clientIsDone,
    loadMore,
    isPending,
  };
}
```

#### packages/react/src/hooks/useVexListQuery.test.tsx

New file, complete.

```tsx
import { runHooksSuite } from "../testing/hooksSuite";

runHooksSuite({ only: ["useVexListQuery"] });
```

#### packages/react/src/hooks/useVexDocQuery.ts

New file, complete.

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, VexDocument, VexGetArgs } from "@vexcms/core";
import type { FunctionReference } from "convex/server";

/**
 * Props for {@link useVexDocQuery}.
 *
 * @typeParam TDocument - The document shape returned for `collection`.
 * @typeParam TCollectionSlug - Collection slug type.
 */
export interface UseVexDocQueryProps<
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
   * Seed data the hook renders immediately, before its own query resolves.
   * Two callers use this: an SSR-prefetched document (`CollectionEditView`),
   * and the Inspect peek (Step 13), which passes the row it already has from
   * `useVexListQuery`'s `results` so the panel opens instantly and this
   * hook's own subscription only takes over once it resolves (Design
   * Decision 27). `null` means "confirmed not found"; `undefined` means
   * "not loaded yet, use the live query".
   */
  initialData?: TDocument | null;
}

/** Return value of {@link useVexDocQuery}. */
export interface UseVexDocQueryReturn<TDocument extends VexDocument = VexDocument> {
  /** The document, `null` when none matches `id`, `undefined` before the first load (or while skipped). */
  document: TDocument | null | undefined;
  /** Whether the query is still in flight with no cached/initial data yet. */
  isPending: boolean;
}

/**
 * Fetches a single document by id and collection — the data source every
 * edit view (and the Inspect peek) reads through (Design Decision 19), live
 * via a Convex subscription.
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
 * const { document } = useVexDocQuery({
 *   collection: "posts",
 *   id: documentId,
 *   drafts: true,
 *   initialData: props.initialData,
 * });
 * ```
 */
export function useVexDocQuery<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: UseVexDocQueryProps<TDocument, TCollectionSlug>): UseVexDocQueryReturn<TDocument> {
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

#### packages/react/src/hooks/useVexDocQuery.test.tsx

New file, complete.

```tsx
import { runHooksSuite } from "../testing/hooksSuite";

runHooksSuite({ only: ["useVexDocQuery"] });
```

#### packages/react/src/hooks/index.ts

Existing file, 1 edit — append to the barrel, alongside the existing hook exports:

```ts
export * from "./useVexListQuery";
export * from "./useVexDocQuery";
```

#### packages/react/src/hooks/usePaginatedQuery.ts

Existing file, 4 edits.

**1 — `UsePaginatedQueryProps`**, a new field after `clientPageSize`:

```ts
  /**
   * Whether the underlying query runs at all. @default true
   *
   * `useVexListQuery` calls this hook unconditionally from both its
   * `find`-mode and search-mode branches, flipping `enabled` per branch so
   * only the active one issues a real request.
   */
  enabled?: boolean;
```

**2 — `UsePaginatedQueryReturn`**, a new field after `totalDocs`:

```ts
  /**
   * Whether `totalDocs` is a floor, not an exact count — `find` counted
   * with `take(countLimit + 1)` and hit the cap (Design Decision 35).
   * `false` once `totalDocs` is `null`/`undefined` (count not loaded, or
   * the collection is below the old 32k scan limit this hook never hits
   * anymore since `find` itself caps the scan).
   */
  totalDocsCapped: boolean;
```

**3 — `usePaginatedQuery`'s destructured props and the block right after the existing `clientPageIndex` state**, adding `enabled` and the render-time query-identity reset (Design Decision 8):

```ts
export function usePaginatedQuery<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>({
  initialData,
  query,
  clientPageSize,
  enabled = true,
}: UsePaginatedQueryProps<TDocument, TCollectionSlug>): UsePaginatedQueryReturn<TDocument> {
  const [cursor, setCursor] = useState<string | null>(null);

  const [allResults, setAllResults] = useState<TDocument[]>(initialData?.page ?? []);

  const [isDone, setIsDone] = useState(false);

  const [clientPageIndex, setClientPageIndex] = useState(0);

  const resolvedWhere = whereArg(query.where);
  const resetKey = JSON.stringify({
    collection: query.collection,
    where: resolvedWhere,
    sort: query.sort,
    drafts: query.drafts,
    numItems: query.paginationOpts.numItems,
  });
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const [prevClientPageSize, setPrevClientPageSize] = useState(clientPageSize);
  const [hasReset, setHasReset] = useState(false);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPrevClientPageSize(clientPageSize);
    setHasReset(true);
    setCursor(null);
    setAllResults([]);
    setIsDone(false);
    setClientPageIndex(0);
  } else if (clientPageSize !== prevClientPageSize) {
    setPrevClientPageSize(clientPageSize);
    setClientPageIndex(0);
  }

  const startIndex = 0;
```

**4 — the `useQuery` call and the return statement**, reusing `resolvedWhere`, gating `initialData` on `!hasReset` (a reset means the current query no longer matches the SSR snapshot) and the fetch on `enabled`, and reading `totalDocsCapped` off the same result `totalDocs` already comes from (Design Decision 35):

```ts
  const { data, isPending, isLoading, isError } = useQuery({
    ...convexQuery(vexConvexApi.findPaginated, {
      ...query,
      where: resolvedWhere,
      paginationOpts: {
        ...query.paginationOpts,
        cursor,
      },
    }),
    enabled,
    ...(cursor === null && initialData && !hasReset ? { initialData } : {}),
  });

  const result = useMemo<PaginationResult<TDocument>>(() => {
    const empty = {
      page: [] as TDocument[],
      continueCursor: "",
      isDone: false,
    };
    if (isLoading || isError || !data) return empty;
    if (Array.isArray(data)) return { ...empty, page: data as TDocument[], isDone: true };
    return data as PaginationResult<TDocument>;
  }, [data, isLoading, isError]);

  const { totalDocs, totalDocsCapped } = useTotalDocs({
    initialData: initialData,
    enabled: query.paginationOpts?.totalDocs,
    paginatedQueryRes: result,
  });

  useEffect(() => {
    if (result.page) {
      if (cursor === null) {
        setAllResults(result.page);
      } else {
        setAllResults((prev) => [...prev, ...result.page]);
      }

      setIsDone(result.isDone);
    }
  }, [result.page, result.isDone, cursor]);

  return {
    results: visibleResults,
    totalDocs,
    totalDocsCapped,
    isDone: clientIsDone,
    loadMore,
    isPending,
  };
}

function useTotalDocs<TDocument extends VexDocument = VexDocument>(props: {
  initialData?: PaginationResult<TDocument>;
  enabled?: boolean;
  paginatedQueryRes: PaginationResult<TDocument>;
}) {
  const [totalDocsCount, setTotalDocs] = useState<number | null | undefined>(
    props.initialData?.totalDocs,
  );
  const [totalDocsCapped, setTotalDocsCapped] = useState<boolean>(
    props.initialData?.totalDocsCapped ?? false,
  );
  useEffect(() => {
    if (
      props.enabled &&
      props.paginatedQueryRes &&
      Object.hasOwn(props.paginatedQueryRes, "totalDocs") &&
      totalDocsCount === undefined
    ) {
      setTotalDocs(props.paginatedQueryRes.totalDocs);
      setTotalDocsCapped(props.paginatedQueryRes.totalDocsCapped ?? false);
    } else if (!props.enabled) {
      setTotalDocs(undefined);
      setTotalDocsCapped(false);
    }
  }, [props.paginatedQueryRes, props.enabled]);

  return {
    totalDocs: totalDocsCount,
    totalDocsCapped,
  };
}
```

`startIndex`, `endIndex`, `visibleResults`, `needsServerFetch`, `clientIsDone`, and `loadMore` are unchanged from the current file and sit between edits 3 and 4.

#### packages/react/src/collections/api/find/client.ts

Existing file, 3 edits — `FindClientArgs`/`FindClientPaginatedArgs` gain the portable `sort` Step 5 adds server-side; no `view` field, since `find` takes none (Design Decision 25/26).

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

**2 — `FindClientArgs`**, one new field after the existing `where`:

```ts
  /**
   * Portable sort — never an index name (Design Decision 5). Rejected
   * server-side together with a `search` call (Design Decision 7).
   */
  sort?: CollectionTableSort<string>;
```

**3 — `FindClientPaginatedArgs`**, the same field after its own `where`:

```ts
  /**
   * Portable sort — never an index name (Design Decision 5). Rejected
   * server-side together with a `search` call (Design Decision 7).
   */
  sort?: CollectionTableSort<string>;
```

#### packages/react/src/testing/convex/bridge.ts

Existing file, 3 edits — the fake `"vex:find"`/`"vex:search"` handlers currently drop `args.where` (both) and `args.paginationOpts`/`args.drafts` (search) on the floor; `useVexListQuery`'s tests need all of them forwarded to the real `find()`/`search()` model functions they already call. Neither handler reads or forwards a `view` arg — there is none (Design Decision 25/26).

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

**3 — the `"vex:search"` entry in `QUERY_HANDLERS`**, replacing its body:

```ts
  "vex:search": async (ctx, args) => {
    const paginationOpts = args.paginationOpts as PaginationOptions | undefined;
    const collection = resolveTable(args);
    const where = args.where as VexWhere<"documents" | "media"> | undefined;
    const drafts = args.drafts as boolean | undefined;
    const query = args.query as string;
    const searchIndexName = args.searchIndexName as string;
    const searchField = args.searchField as string;
    return paginationOpts
      ? search({ ctx, collection, query, searchIndexName, searchField, where, drafts, paginationOpts })
      : search({ ctx, collection, query, searchIndexName, searchField, where, drafts });
  },
```

#### packages/react/src/testing/hooksSuite.tsx

Existing file, 7 edits.

**1 — imports**, add the two new hooks alongside the existing three, and extend the `@vexcms/core` type import with `VexWhereNode`:

```ts
import { useTableSelection } from "../hooks/useTableSelection";
import { usePaginatedQuery } from "../hooks/usePaginatedQuery";
import { usePaginatedSearch } from "../hooks/usePaginatedSearch";
import { useVexListQuery } from "../hooks/useVexListQuery";
import { useVexDocQuery } from "../hooks/useVexDocQuery";
import type { CollectionConfig, MediaCollectionConfig, VexWhereNode } from "@vexcms/core";
```

**2 — `HooksSuiteMember`**, two new members:

```ts
export type HooksSuiteMember =
  | "useTableSelection"
  | "usePaginatedQuery"
  | "usePaginatedSearch"
  | "useVexListQuery"
  | "useVexDocQuery";
```

**3 — `makeDocumentsCollection`**, complete (its body changes throughout): `useVexListQuery`'s search-mode path reads `fields.title.searchIndex.name`, which this fixture never populated because only `usePaginatedSearch` (resolved via `useAsTitle`, not a per-field `searchIndex`) read anything off `fields` before; its `admin` also gains a `table`, read by `admin.table.serverPageSize`:

```ts
function makeDocumentsCollection(): CollectionConfig {
  return {
    slug: "documents",
    fields: {
      title: { searchIndex: { name: "search_title", filterFields: [] } },
    },
    labels: { singular: "Document", plural: "Documents" },
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
    meta: {},
  } as unknown as CollectionConfig;
}
```

**4 — two new functions**, placed immediately after `describePaginatedSearch` (closes at line 230 in the pre-edit file):

```ts
/**
 * Registers the `useVexListQuery` describe block, driven by real seeded rows
 * through the convex-test bridge — both the `find`-mode path and the
 * search-mode path against `documents`' real `search_title` index.
 */
function describeVexListQuery() {
  describe("useVexListQuery", () => {
    it("reveals pageSize rows per page, independent of the collection's larger serverPageSize", async () => {
      const t = convexTest(schema, testModules);
      await seedDocuments(t, 15);
      const { queryClient } = buildQueryClient(t);
      const collection = makeDocumentsCollection();

      const { result } = renderHook(() => useVexListQuery({ collection, pageSize: 5 }), {
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
          useVexListQuery({
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

    it("reports totalDocsCapped when find hits the count cap", async () => {
      const t = convexTest(schema, testModules);
      await seedDocuments(t, 3);
      const { queryClient } = buildQueryClient(t);
      const collection = makeDocumentsCollection();
      collection.admin.table.countLimit = 2;

      const { result } = renderHook(() => useVexListQuery({ collection, pageSize: 10 }), {
        wrapper: makeWrapper(queryClient),
      });
      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.totalDocsCapped).toBe(true);
    });

    it("search mode dispatches to the collection's declared search index without throwing", async () => {
      const t = convexTest(schema, testModules);
      await seedDocuments(t, 5);
      const { queryClient } = buildQueryClient(t);
      const collection = makeDocumentsCollection();

      const { result } = renderHook(
        () =>
          useVexListQuery({
            collection,
            search: "Doc 2",
            searchField: "title",
            pageSize: 10,
          }),
        { wrapper: makeWrapper(queryClient) },
      );

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(Array.isArray(result.current.results)).toBe(true);
      expect(result.current.totalDocsCapped).toBe(false);
    });
  });
}

/**
 * Registers the `useVexDocQuery` describe block, driven by real seeded rows
 * through the convex-test bridge's `"vex:get"` handler.
 */
function describeVexDocQuery() {
  describe("useVexDocQuery", () => {
    it("returns the document matching id, live", async () => {
      const t = convexTest(schema, testModules);
      const [id] = await seedDocuments(t, 1);
      const { queryClient } = buildQueryClient(t);

      const { result } = renderHook(() => useVexDocQuery({ collection: "documents", id }), {
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
        () => useVexDocQuery({ collection: "documents", id, skip: true }),
        { wrapper: makeWrapper(queryClient) },
      );
      await waitFor(() => expect(result.current.document).toBeUndefined());
    });

    it("undefined id behaves like skip: true", async () => {
      const t = convexTest(schema, testModules);
      const { queryClient } = buildQueryClient(t);

      const { result } = renderHook(
        () => useVexDocQuery({ collection: "documents", id: undefined }),
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
    "useVexListQuery",
    "useVexDocQuery",
  ];
```

**6 — two new tests at the end of the existing `usePaginatedQuery` describe block**, right after `"resets to a fresh first page when the consumer remounts with a different page size"` and before that block's closing `});`:

```ts
      it("resets cursor and accumulated results in place when the query's where changes, without a remount", async () => {
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 5);
        const { queryClient } = buildQueryClient(t);

        const { result, rerender } = renderHook(
          (where?: VexWhereNode<"documents">) =>
            usePaginatedQuery({
              query: { collection: "documents", where, paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );
        await waitFor(() => expect(result.current.isPending).toBe(false));

        act(() => result.current.loadMore());
        await waitFor(() =>
          expect(result.current.results.map((doc) => doc.title)).toEqual([
            "Doc 0",
            "Doc 1",
            "Doc 2",
            "Doc 3",
          ]),
        );

        rerender({ field: "title", op: "eq", value: "Doc 2" });
        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(result.current.results.map((doc) => doc.title)).toEqual(["Doc 2"]);
        expect(result.current.isDone).toBe(true);
      });

      it("re-windows to page 1 at the new size when clientPageSize changes, without re-fetching already-loaded rows", async () => {
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 6);
        const { queryClient, fakeClient } = buildQueryClient(t);
        const querySpy = vi.spyOn(
          fakeClient as unknown as { query: (...args: unknown[]) => Promise<unknown> },
          "query",
        );

        const { result, rerender } = renderHook(
          (clientPageSize: number) =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
              clientPageSize,
            }),
          { initialProps: 2, wrapper: makeWrapper(queryClient) },
        );
        await waitFor(() => expect(result.current.isPending).toBe(false));

        act(() => result.current.loadMore());
        await waitFor(() =>
          expect(result.current.results.map((doc) => doc.title)).toEqual([
            "Doc 0",
            "Doc 1",
            "Doc 2",
            "Doc 3",
          ]),
        );
        expect(result.current.isDone).toBe(false);
        const callCountBeforeResize = querySpy.mock.calls.length;

        rerender(10);
        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(querySpy.mock.calls.length).toBe(callCountBeforeResize);
        expect(result.current.results.map((doc) => doc.title)).toEqual([
          "Doc 0",
          "Doc 1",
          "Doc 2",
          "Doc 3",
        ]);
        expect(result.current.isDone).toBe(false);
      });
```

**7 — the end of `runHooksSuite`**, two new gated calls alongside the existing `usePaginatedSearch` one:

```ts
  if (only.includes("usePaginatedSearch")) describePaginatedSearch();
  if (only.includes("useVexListQuery")) describeVexListQuery();
  if (only.includes("useVexDocQuery")) describeVexDocQuery();
}
```

#### packages/react/src/collections/listView/CollectionListView.tsx

Existing file (Step 2's new path), 2 edits.

**1 — imports**, `usePaginatedQuery` becomes `useVexListQuery` in the `"../../hooks"` import (the folder moved one level deeper under `collections/listView/` in Step 2); `vexConvexApi` stays (the bulk-delete mutation is unchanged — `useVexMutation`'s `mutationFn` always takes a bare `FunctionReference`, which is what that call already passes):

```ts
import { useVexListQuery, useVexMutation } from "../../hooks";
```

**2 — the pagination fetch**, replacing the `numItems` computation and the `usePaginatedQuery` call with `useVexListQuery`:

```ts
  const isVersioned = collection.versions.drafts;
  const pagination = useVexListQuery({
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

**1 — imports**, `usePaginatedQuery` becomes `useVexListQuery` in the `"../hooks"` import; `vexConvexApi` stays (the bulk-delete mutation is unchanged, same reason as `CollectionListView`):

```ts
import { useVexListQuery, useVexMutation } from "../hooks";
```

**2 — the pagination fetch**, replacing the `numItems` computation and the `usePaginatedQuery` call (the old `limit: 100` was already a no-op — `find`'s own doc says `limit` is "Ignored when `paginationOpts` is set"):

```ts
  const pagination = useVexListQuery<VexMediaDocument>({
    collection,
    depth: 1,
    pageSize: collection.admin.table.defaultPageSize,
    initialData: props.initialData,
  });
```

#### packages/react/src/collections/editView/CollectionEditView.tsx

Existing file (Step 2's new path), 3 edits. `convexQuery`/`useQuery`/`vexConvexApi` stay imported — `unpublishVersions` (`vexConvexApi.versions.listVersions`) and every mutation (`vexConvexApi.update`, `.versions.publish`, `.versions.unpublish`, `.versions.saveDraft`) are untouched; only the two document *reads* move to `useVexDocQuery`.

**1 — imports**, `useVexDocQuery` added alongside the existing `useVexMutation`, both from `"../../hooks"` (Step 2's new depth):

```ts
import { useVexDocQuery, useVexMutation } from "../../hooks";
```

**2 — the `currentDocument` fetch**, replacing the comment + `useQuery`/`convexQuery(vexConvexApi.get, …)` block:

```ts
  const { document: currentDocument } = useVexDocQuery({
    collection: collection.slug,
    id: activeDocumentId,
    drafts: collection.versions.drafts,
    initialData: props.initialData,
  });
```

**3 — the `publishedRowWhileDraft` fetch**, replacing its `useQuery`/`convexQuery(vexConvexApi.get, …)` block — `enabled` becomes `useVexDocQuery`'s `skip` (its negation):

```ts
  const { document: publishedRowWhileDraft } = useVexDocQuery({
    collection: collection.slug,
    id: (currentDocument.vex_publishedId as string | undefined) ?? currentDocument._id,
    skip: !(isVersioned && isDraftDoc),
  });
```

Two notes on scope: `vexConvexApi.remove`/`.update`/`.versions.*` stay in all three files — `useVexMutation`'s `mutationFn` is a bare `FunctionReference` (`hooks/useVexMutation.ts`), not a bound hook, so "no direct `vexConvexApi`" applies to the READ side only, matching Design Decision 19's "data-source" (read) hook boundary. `FindClientArgs`/`FindClientPaginatedArgs` (`collections/api/find/client.ts`) gain `sort?: CollectionTableSort<string>` here too, mirroring Step 5's server-side addition, so `useVexListQuery`'s `query.sort` forward compiles. `PaginationResult`'s `totalDocsCapped` field, and `find`'s `countLimit`-aware count (Design Decision 35), come from Step 6 — this step only reads them; it adds none of that server logic itself.
</content>

### Step 9 — List slots + built-ins as `vex.*` contributions, `listView/` structure [agent]

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

#### packages/core/src/components/types.ts

2 edits. Everything else in the file is unchanged.

**1 — `SLOT_IDS`.** Add a `list` key beside the existing `field`/`blocks`/`array`/`edit` keys:

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
  edit: {
    // … unchanged
  },
  list: {
    /** Additive contributions rendered beside the built-in "+ New" button. Built-in: `vex.list.create`. */
    headerActions: "list.header.actions",
    /** Additive contributions rendered in the toolbar row. Built-ins: `vex.list.search` (Step 10), `vex.list.columns` (Step 10), `vex.list.views` (Step 12). */
    toolbar: "list.toolbar",
    /** Additive contributions rendered in the filter row, below the toolbar. Built-in: `vex.list.filters` (Step 11). */
    filters: "list.filters",
    /** Additive contributions rendered above the table, below `toolbar`/`filters`. No built-in. */
    beforeTable: "list.beforeTable",
    /** Additive contributions rendered below the table. No built-in. */
    afterTable: "list.afterTable",
    /**
     * Rendered as `DropdownMenuItem`s in one per-row ⋯ menu (Decision 28), in order:
     * `vex.list.row.open`, `vex.list.row.inspect`, `vex.list.row.copyId`, then this
     * slot's additive contributions, then `vex.list.row.delete` last.
     */
    rowActions: "list.row.actions",
    /**
     * Additive contributions rendered inline in the toolbar's bulk-selection group
     * (Decision 22), alongside `vex.list.bulk.delete` — never a floating bar.
     */
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
  | (typeof SLOT_IDS.edit)[keyof typeof SLOT_IDS.edit]
  | (typeof SLOT_IDS.list)[keyof typeof SLOT_IDS.list];
```

#### packages/core/src/components/builtinIds.ts

1 edit — add a `list` key to `BUILTIN_CONTRIBUTION_IDS`, beside `block`/`blocksHeader`/`array`/`edit`:

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
  edit: {
    // … unchanged
  },
  list: {
    create: "vex.list.create",
    search: "vex.list.search",
    filters: "vex.list.filters",
    columns: "vex.list.columns",
    views: "vex.list.views",
    rowOpen: "vex.list.row.open",
    rowInspect: "vex.list.row.inspect",
    rowCopyId: "vex.list.row.copyId",
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

**2 — `AdminCollectionConfigInput` / `AdminCollectionConfig`.** New `AdminListComponentsInput`/`AdminListComponents` types (every array `unknown`-typed and cast at the React call site, the same split the root `admin.components.blocks`/`array` input already uses, P-002: a value that travels as a prop is never threaded through authoring generics), plus a `components` property on both collection-admin interfaces:

```ts
/**
 * This collection's own additive contributions to its list-view slots (S17/S18),
 * merged with `vex.list.*` built-ins by `ListLayout` — never here. Every array is
 * optional and empty by default, the same split as the root `admin.components.blocks`/
 * `array` input (`config/types.ts`).
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
  /** `list.row.actions` — additive entries rendered as `DropdownMenuItem`s in the per-row ⋯ menu, alongside the built-in Open/Inspect/Copy ID/Delete actions. */
  rowActions?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.bulkActions` — additive entries rendered inline in the toolbar's bulk-selection group (never a floating bar). */
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

`config.ts`'s `admin.components` resolution (beside the existing `livePreview` property, via `resolveComponentContributions` + `SLOT_IDS.list.*`) and `config.test.ts`'s defaulting/ordering assertions resolve these seven keys one-for-one; unchanged by this step beyond the key additions above.

#### packages/react/src/collections/listView/CollectionListContext.tsx

New file. Mirrors `documents/VexDocumentContext.tsx`'s shape (Decision 37: built-ins read shared list state from context instead of props drilled through the layout). `CollectionListView` recomputes this value from its own state/hooks every render and mounts the provider around `ListLayout` (mirrors `VexDocumentProvider`'s split between `CollectionEditView` and the form it wraps) — `ListLayout` itself is a consumer, never the provider, so a later step can extend this shape without touching `ListLayout`. Step 10 extends this base shape with URL state and the rest of the columns surface via its own anchored edit to this same file (Design Decision 37: one definition site, extended, never redefined).

```tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CollectionConfig, TDocument } from "@vexcms/core";

/**
 * The shared list-view state every `list.*` slot contribution reads via
 * `useCollectionList()` — collection identity, selection, per-browser
 * density (Decision 29), visible columns, and the Inspect-peek opener
 * (Decision 27). Row-scoped data (`docs` for `list.row.actions`/
 * `list.bulkActions`) stays a `SlotOutlet` `contributedProps` prop instead
 * — it varies per contribution call, so it cannot live in one shared
 * context value. The current page's rows similarly stay a `ListLayout`/
 * `DataTable` prop, never context — nothing reading `useCollectionList()`
 * needs the whole page, only the ids `selection` already carries.
 */
export interface CollectionListState<TDoc extends TDocument = TDocument> {
  /** The resolved collection config. */
  collection: CollectionConfig;
  /** The ids of currently-selected rows (`DataTable`'s `onSelectionChange`). */
  selectedIds: string[];
  /** Replaces the current selection. */
  setSelectedIds: (ids: string[]) => void;
  /** Per-browser table density (Decision 29). Step 10 wires the real `useLocalStorage`-backed value; this context only carries it through. */
  density: "comfortable" | "compact";
  /** The field slugs currently visible in the table (Step 10's columns menu). Every field by default. */
  visibleFields: string[];
  /** Opens the Inspect peek for a document id (Decision 27, wired in Step 13). `undefined` until then. */
  onInspect?: (id: string) => void;
}

/** Default value is `null` so a consumer rendered outside any provider throws instead of reading stale state. */
export const CollectionListContext = createContext<CollectionListState | null>(null);

/**
 * Mounts `CollectionListContext` for the subtree it wraps. `CollectionListView` is the only
 * caller — it recomputes {@link CollectionListState} from its own state every render and
 * wraps `ListLayout` with it.
 *
 * @param props.value - The resolved list state to provide.
 * @param props.children - The subtree that consumes it (`ListLayout` and its seven `list.*` `SlotOutlet`s).
 * @returns The context provider wrapping `props.children`.
 */
export function CollectionListProvider(props: {
  value: CollectionListState;
  children: ReactNode;
}): ReactNode {
  return (
    <CollectionListContext.Provider value={props.value}>
      {props.children}
    </CollectionListContext.Provider>
  );
}

/**
 * Exposes the current list view's shared state to a built-in or third-party `list.*`
 * slot contribution. Backed by `CollectionListContext`, mounted by `CollectionListView`.
 *
 * Experimental: breaking changes are still possible before this stabilizes.
 * @returns The current `CollectionListState`.
 * @throws When rendered outside a `CollectionListProvider`.
 */
export function useCollectionList<TDoc extends TDocument = TDocument>(): CollectionListState<TDoc> {
  const value = useContext(CollectionListContext);
  if (value === null) {
    throw new Error("useCollectionList() must be used within a CollectionListProvider.");
  }
  return value as CollectionListState<TDoc>;
}
```

#### packages/react/src/collections/listView/ListCreateAction.tsx

New file. `vex.list.create` — the "+ New {singular}" button and its create modal, moved verbatim from `CollectionListView`'s current JSX. Self-gates on `CRUD_ACTIONS.create` (mirrors `CollectionDeleteAction`'s own self-check, rather than a slot-level `access` predicate — `documentEditBuiltinContributions()` takes the same no-predicate approach, Decision 37's "mirror the edit view").

```tsx
"use client";

import { CRUD_ACTIONS, PERMISSION_SCOPES } from "@vexcms/core";
import { usePermission } from "../../access";
import { useVexConfig } from "../../config/VexConfigContext";
import { adminHref } from "../../admin/adminHref";
import { VexLink } from "../../ui/VexLink";
import { Button } from "../../ui";
import { CreateDocumentModal } from "./CreateDocumentModal";
import { useCollectionList } from "./CollectionListContext";

/**
 * `vex.list.create` — the "+ New {singular}" button and its create modal. Self-gates
 * on `CRUD_ACTIONS.create`; renders nothing for a caller without it.
 *
 * @returns The create button + modal, or `null` without create access.
 */
export function ListCreateAction(): ReactNode {
  // TODO: implement
  // 1. `const { collection } = useCollectionList()`
  // 2. `const canCreate = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.create,
  //    scope: PERMISSION_SCOPES.any })` — `if (!canCreate) return null;`
  // 3. `const config = useVexConfig()`
  // 4. Render `<CreateDocumentModal collection={collection.slug} />` plus a `<Button>` rendering
  //    a `<VexLink href={adminHref({ type: "create", slug: collection.slug }, config.basePath)} />`
  //    reading "+ New {collection.labels.singular}" — `CollectionListView`'s current JSX, unchanged.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListRowOpenAction.tsx

New file. `vex.list.row.open` — navigates to the document's edit view, the same destination a row click or the `Enter` key already reach (Decision 30, Step 14). Exists in the ⋯ menu for users who prefer menu-driven navigation, and for Step 16's narrow-container layout, where the horizontally-scrolling table (sticky first column, Decision 22) makes menu-driven navigation more discoverable than relying on the row click alone. Never gated — seeing the row at all already required read access.

```tsx
"use client";

import { ExternalLinkIcon } from "lucide-react";
import type { TDocument } from "@vexcms/core";
import { useVexConfig } from "../../config/VexConfigContext";
import { adminHref } from "../../admin/adminHref";
import { VexLink } from "../../ui/VexLink";
import { DropdownMenuItem } from "../../ui/dropdown-menu";
import { useCollectionList } from "./CollectionListContext";

/** Props every `list.row.actions`/`list.bulkActions` contribution receives — one row for `row.actions`, every selected row for `bulkActions`. The rest of the list's state comes from `useCollectionList()` (Decision 37). */
export interface ListRowSlotProps {
  docs: TDocument[];
}

/**
 * `vex.list.row.open` — a `DropdownMenuItem` linking to this row's edit view.
 *
 * @param props - {@link ListRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A `DropdownMenuItem` rendering a {@link VexLink} to the edit view.
 */
export function ListRowOpenAction(props: ListRowSlotProps): ReactNode {
  // TODO: implement
  // 1. `const { collection } = useCollectionList()`
  // 2. `const config = useVexConfig()`
  // 3. `<DropdownMenuItem render={<VexLink href={adminHref({ type: "edit", slug: collection.slug,
  //      id: props.docs[0]._id }, config.basePath)} />}><ExternalLinkIcon className="size-4" />Open</DropdownMenuItem>`
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListRowInspectAction.tsx

New file. `vex.list.row.inspect` — opens the Inspect peek for this row via `useCollectionList().onInspect` (Decision 27, built in Step 13). Never gated — see `ListRowOpenAction`'s own note.

```tsx
"use client";

import { EyeIcon } from "lucide-react";
import { DropdownMenuItem } from "../../ui/dropdown-menu";
import { useCollectionList } from "./CollectionListContext";
import type { ListRowSlotProps } from "./ListRowOpenAction";

/**
 * `vex.list.row.inspect` — opens the Inspect peek for this row.
 *
 * @param props - {@link ListRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A `DropdownMenuItem` calling `useCollectionList().onInspect(props.docs[0]._id)`.
 */
export function ListRowInspectAction(props: ListRowSlotProps): ReactNode {
  // TODO: implement
  // 1. `const { onInspect } = useCollectionList()`
  // 2. `<DropdownMenuItem onClick={() => onInspect(props.docs[0]._id)}>
  //      <EyeIcon className="size-4" />Inspect</DropdownMenuItem>`
  // Edge cases:
  // - Does not close or toggle an already-open peek for a different row — it just sets `peek` to
  //   this row's id (Step 13); switching rows while the peek is open swaps its content in place.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListRowCopyIdAction.tsx

New file. `vex.list.row.copyId` — copies this row's `_id` to the clipboard and toasts confirmation. Never gated — see `ListRowOpenAction`'s own note.

```tsx
"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenuItem } from "../../ui/dropdown-menu";
import type { ListRowSlotProps } from "./ListRowOpenAction";

/**
 * `vex.list.row.copyId` — copies this row's `_id` to the clipboard.
 *
 * @param props - {@link ListRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A `DropdownMenuItem` copying `props.docs[0]._id`.
 */
export function ListRowCopyIdAction(props: ListRowSlotProps): ReactNode {
  // TODO: implement
  // 1. `<DropdownMenuItem onClick={async () => { await navigator.clipboard.writeText(props.docs[0]._id);
  //      toast.success("Copied ID"); }}><CopyIcon className="size-4" />Copy ID</DropdownMenuItem>`
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListRowDeleteAction.tsx

New file. `vex.list.row.delete` — per-row delete, self-gated on `CRUD_ACTIONS.delete` (see `ListCreateAction`'s own note on self-gating vs. a slot-level `access` predicate). Renders last in the ⋯ menu (`LIST_BUILTIN_ORDER.rowDelete`, Decision 28), destructive-styled.

```tsx
"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { CRUD_ACTIONS, PERMISSION_SCOPES, vexConvexApi } from "@vexcms/core";
import { usePermission } from "../../access";
import { useVexMutation } from "../../hooks";
import { DropdownMenuItem } from "../../ui/dropdown-menu";
import { BulkDeleteModal } from "../../ui/data-table/DeleteManyModal";
import { useCollectionList } from "./CollectionListContext";
import type { ListRowSlotProps } from "./ListRowOpenAction";

/**
 * `vex.list.row.delete` — self-gated on `CRUD_ACTIONS.delete`; renders `null` without it.
 *
 * @param props - {@link ListRowSlotProps}; `props.docs` is always exactly one document here.
 * @returns A destructive `DropdownMenuItem` that confirms via {@link BulkDeleteModal} before deleting, or `null` without delete access.
 */
export function ListRowDeleteAction(props: ListRowSlotProps): ReactNode {
  // TODO: implement
  // 1. `const { collection, setSelectedIds, selectedIds } = useCollectionList()`
  // 2. `const canDelete = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.delete,
  //    scope: PERMISSION_SCOPES.any })` — `if (!canDelete) return null;`
  // 3. `const [open, setOpen] = useState(false)`
  // 4. `const removeMutation = useVexMutation({ collection: collection.slug, mutationFn:
  //    vexConvexApi.remove, operation: "remove", getChanges: ({ args }) => args.ids.flatMap((id) =>
  //    props.docs.find((d) => d._id === id) ? [{ before: props.docs.find((d) => d._id === id) }] : []) })`
  // 5. `<DropdownMenuItem variant="destructive" onSelect={(e) => { e.preventDefault(); setOpen(true); }}>
  //      <Trash2Icon className="size-4" />Delete</DropdownMenuItem>` — `onSelect` with
  //    `preventDefault()` (not `onClick`) keeps the menu mounted long enough for the modal to open;
  //    Base UI's `Menu.Item` otherwise closes (and unmounts) the menu on the same event before the
  //    `setOpen(true)` state update can be observed.
  // 6. `<BulkDeleteModal open={open} onOpenChange={setOpen} selectedCount={1} entityName={collection.labels.singular}
  //    isDeleting={removeMutation.isPending} onConfirm={async () => { await
  //    removeMutation.mutateAsync({ ids: [props.docs[0]._id], collection: collection.slug });
  //    setOpen(false); if (selectedIds.includes(props.docs[0]._id)) setSelectedIds(selectedIds.filter((id) => id !== props.docs[0]._id)); }} />`
  //    — clears this row out of the current selection if it happened to be selected, same as the
  //    bulk path (see `ListBulkDeleteAction`'s own edge-case note).
  // Edge cases:
  // - A versioned collection's draft/published pair is already collapsed to one row by the
  //   caller (`collapseVersionedPairs`), so `props.docs[0]._id` deletes only that collapsed row's
  //   own id — it never cascades to a paired version, matching today's bulk-delete behavior.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListBulkDeleteAction.tsx

New file. `vex.list.bulk.delete` — the inline bulk-delete group + confirmation modal, self-gated on `CRUD_ACTIONS.delete`. Renders nothing while `props.docs` is empty, so the surrounding `SlotOutlet` mounts no empty group. Ordered last within `list.bulkActions` (`LIST_BUILTIN_ORDER.bulkDelete`), after any project contribution.

```tsx
"use client";

import { useState } from "react";
import { CRUD_ACTIONS, PERMISSION_SCOPES, vexConvexApi } from "@vexcms/core";
import { usePermission } from "../../access";
import { useVexMutation } from "../../hooks";
import { DataTableBulkActions } from "../../ui/data-table/DataTableBulkActions";
import { BulkDeleteModal } from "../../ui/data-table/DeleteManyModal";
import { useCollectionList } from "./CollectionListContext";
import type { ListRowSlotProps } from "./ListRowOpenAction";

/**
 * `vex.list.bulk.delete` — the inline bulk-delete group + confirmation modal, self-gated on
 * `CRUD_ACTIONS.delete`.
 *
 * @param props - {@link ListRowSlotProps}; `props.docs` is every currently-selected row.
 * @returns The inline bulk-action group ({@link DataTableBulkActions}) + {@link BulkDeleteModal}, or `null` when nothing is selected or the caller lacks delete access.
 */
export function ListBulkDeleteAction(props: ListRowSlotProps): ReactNode {
  // TODO: implement
  // 1. `if (props.docs.length === 0) return null;`
  // 2. `const { collection, setSelectedIds } = useCollectionList()`
  // 3. `const canDelete = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.delete,
  //    scope: PERMISSION_SCOPES.any })` — `if (!canDelete) return null;`
  // 4. `const [open, setOpen] = useState(false)`
  // 5. `const removeMutation = useVexMutation({ collection: collection.slug, mutationFn:
  //    vexConvexApi.remove, operation: "remove", getChanges: ({ args }) => args.ids.flatMap((id) =>
  //    props.docs.find((d) => d._id === id) ? [{ before: props.docs.find((d) => d._id === id) }] : []) })`
  //    — moved verbatim from `CollectionListView`'s current `removeMutation`.
  // 6. `<DataTableBulkActions selectedCount={props.docs.length} onDelete={() => setOpen(true)}
  //    onClear={() => setSelectedIds([])} isDeleting={removeMutation.isPending} />` — inline-styled
  //    per this step's `DataTableBulkActions` edit below, no longer a floating overlay.
  // 7. `<BulkDeleteModal open={open} onOpenChange={setOpen} selectedCount={props.docs.length}
  //    entityName={collection.labels.plural} isDeleting={removeMutation.isPending}
  //    onConfirm={async () => { await removeMutation.mutateAsync({ ids: props.docs.map((d) =>
  //    d._id), collection: collection.slug }); setOpen(false); setSelectedIds([]); }} />`
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/listBuiltinContributions.ts

New file. Registry, like `documents/documentEditBuiltinContributions.ts` — no `access` predicates (every built-in self-gates, see `ListCreateAction`'s own note), so these are static arrays closing over nothing.

```ts
import type { ComponentContributionInput } from "@vexcms/core";
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { ListCreateAction } from "./ListCreateAction";
import { ListRowOpenAction } from "./ListRowOpenAction";
import { ListRowInspectAction } from "./ListRowInspectAction";
import { ListRowCopyIdAction } from "./ListRowCopyIdAction";
import { ListRowDeleteAction } from "./ListRowDeleteAction";
import { ListBulkDeleteAction } from "./ListBulkDeleteAction";
import type { ListRowSlotProps } from "./ListRowOpenAction";

/**
 * `order` values that keep Decision 28's row-menu order (Open, Inspect, Copy ID,
 * contributions, Delete last) and bulk-delete-last regardless of how many contributions a
 * project adds — any contribution's own `order` defaults to `0`, which always lands between
 * `rowCopyId`/project contributions and the matching `Delete`.
 */
export const LIST_BUILTIN_ORDER = {
  rowOpen: -30,
  rowInspect: -20,
  rowCopyId: -10,
  rowDelete: 1000,
  bulkDelete: 1000,
} as const;

/** `list.header.actions`' built-in contributions — just `vex.list.create`. */
export function listHeaderActionsBuiltins(): ComponentContributionInput<ReactHKT, Record<string, never>>[] {
  return [{ id: BUILTIN_CONTRIBUTION_IDS.list.create, component: ListCreateAction }];
}

/** `list.row.actions`' built-in contributions, in Decision 28's order. */
export function listRowActionsBuiltins(): ComponentContributionInput<ReactHKT, ListRowSlotProps>[] {
  return [
    { id: BUILTIN_CONTRIBUTION_IDS.list.rowOpen, component: ListRowOpenAction, order: LIST_BUILTIN_ORDER.rowOpen },
    { id: BUILTIN_CONTRIBUTION_IDS.list.rowInspect, component: ListRowInspectAction, order: LIST_BUILTIN_ORDER.rowInspect },
    { id: BUILTIN_CONTRIBUTION_IDS.list.rowCopyId, component: ListRowCopyIdAction, order: LIST_BUILTIN_ORDER.rowCopyId },
    { id: BUILTIN_CONTRIBUTION_IDS.list.rowDelete, component: ListRowDeleteAction, order: LIST_BUILTIN_ORDER.rowDelete },
  ];
}

/** `list.bulkActions`' built-in contributions — just `vex.list.bulk.delete`, ordered last. */
export function listBulkActionsBuiltins(): ComponentContributionInput<ReactHKT, ListRowSlotProps>[] {
  return [{ id: BUILTIN_CONTRIBUTION_IDS.list.bulkDelete, component: ListBulkDeleteAction, order: LIST_BUILTIN_ORDER.bulkDelete }];
}
```

#### packages/react/src/collections/listView/ListLayout.tsx

New file. Composes a collection's list view around the seven `list.*` slots (Decision 38: composition only — every built-in's own logic lives in its own file above). Reads shared list state (selection, density, visible fields, `onInspect`) via `useCollectionList()` — `CollectionListView` owns that state and mounts `CollectionListProvider` around this component (mirrors `VexDocumentProvider`/`CollectionEditView`'s split), so `ListLayout` is a context CONSUMER only, never a provider.

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, type ReactNode } from "react";
import { SLOT_IDS, type CollectionConfig, type ComponentContributionInput, type TDocument } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { SlotOutlet } from "../../slots/SlotOutlet";
import { DataTable } from "../../ui/data-table/DataTable";
import { ActionsMenu } from "../../ui/ActionsMenu";
import { useCollectionList } from "./CollectionListContext";
import {
  listHeaderActionsBuiltins,
  listRowActionsBuiltins,
  listBulkActionsBuiltins,
} from "./listBuiltinContributions";
import type { ListRowSlotProps } from "./ListRowOpenAction";

export interface ListLayoutProps<TDoc extends TDocument = TDocument> {
  collection: CollectionConfig;
  rows: TDoc[];
  columns: ColumnDef<TDoc>[];
  isDone: boolean;
  isPending: boolean;
  totalCount: number | null | undefined;
  onLoadMore: () => void;
}

/**
 * Renders a collection's list view around the seven `list.*` slots (S17/S18): a header row
 * (`list.header.actions`), a toolbar/filter area (`list.toolbar`, `list.filters`) with an
 * inline bulk-selection group ahead of it while rows are selected, the table flanked by
 * `list.beforeTable`/`list.afterTable`, and a per-row ⋯ menu (`list.row.actions`).
 *
 * @param props - {@link ListLayoutProps}.
 * @returns The composed list view.
 */
export function ListLayout<TDoc extends TDocument = TDocument>(
  props: ListLayoutProps<TDoc>,
): ReactNode {
  // TODO: implement
  // 1. `const { collection, selectedIds, setSelectedIds } = useCollectionList<TDoc>()` — selection
  //    is owned by `CollectionListProvider`'s caller (`CollectionListView`), not this component.
  //    → `const selectedDocs = useMemo(() => props.rows.filter((r) => selectedIds.includes(r._id)), [props.rows, selectedIds])`
  // 2. Append a trailing "Actions" `ColumnDef<TDoc>` to `props.columns` — ALWAYS, never omitted
  //    (Open/Inspect/Copy ID apply to every row regardless of custom contributions or delete
  //    access) — whose `cell` renders:
  //    `<ActionsMenu label={`${collection.labels.singular} actions`}>
  //      <SlotOutlet slotId={SLOT_IDS.list.rowActions} builtins={listRowActionsBuiltins()}
  //        contributions={collection.admin.components.rowActions as unknown as ComponentContributionInput<ReactHKT, ListRowSlotProps>[]}
  //        contributedProps={{ docs: [row.original] }} />
  //    </ActionsMenu>`
  //    (the `as unknown as` cast mirrors `BlockActionsMenu.tsx`'s own cast of
  //    `config.admin.components.blocks.itemActions` — core keeps these `unknown`-typed per P-002).
  // 3. Render, top to bottom — no provider mount here, `CollectionListProvider` already wraps
  //    this component from `CollectionListView`:
  //    - a header row: `collection.labels.plural` title + document count, and
  //      `<SlotOutlet slotId={SLOT_IDS.list.headerActions} builtins={listHeaderActionsBuiltins()}
  //        contributions={collection.admin.components.headerActions as unknown as …}
  //        contributedProps={{}} />`
  //    - a toolbar row: while `selectedIds.length > 0`, a bulk group renders FIRST, inline and to
  //      the left of where Step 11's Filter control lands — a "Select all {props.rows.length} loaded"
  //      button (`onClick={() => setSelectedIds(props.rows.map((r) => r._id))}`, Decision 28's "always
  //      all loaded" rule) followed by `<SlotOutlet slotId={SLOT_IDS.list.bulkActions} builtins={listBulkActionsBuiltins()}
  //      contributions={collection.admin.components.bulkActions as unknown as …}
  //      contributedProps={{ docs: selectedDocs }} />` — then
  //      `<SlotOutlet slotId={SLOT_IDS.list.toolbar} builtins={[]} contributions={…} contributedProps={{}} />`
  //      then `<SlotOutlet slotId={SLOT_IDS.list.filters} builtins={[]} contributions={…} contributedProps={{}} />`.
  //      `ListBulkDeleteAction` (rendered inside that same bulk `SlotOutlet`, ordered last) renders
  //      its own count + Delete + Clear via `DataTableBulkActions` (now styled inline), so the
  //      on-page reading order is "Select all N loaded" → any custom `list.bulkActions` contribution
  //      → "{n} selected · Delete · Clear".
  //    - `<SlotOutlet slotId={SLOT_IDS.list.beforeTable} builtins={[]} contributions={…} contributedProps={{}} />`
  //    - `<DataTable data={props.rows} columns={columnsWithActions} isDone={props.isDone}
  //        onLoadMore={props.onLoadMore} isLoadingMore={props.isPending} totalCount={props.totalCount}
  //        enableRowSelection onSelectionChange={setSelectedIds} />` — row selection no longer
  //        needs a `canDelete` gate here; `ListRowDeleteAction`/`ListBulkDeleteAction` self-gate,
  //        and showing checkboxes to a non-deleter who still has a `list.bulkActions` contribution
  //        (e.g. a bulk-export plugin) is correct.
  //    - `<SlotOutlet slotId={SLOT_IDS.list.afterTable} builtins={[]} contributions={…} contributedProps={{}} />`
  // Edge cases:
  // - `DataTable` re-fires `onSelectionChange([])` once its `data` prop shrinks below the
  //   previously-selected indices (ties into `DataTable`'s own "Edge cases" note below) — this
  //   component does not need its own cleanup for that case; `ListRowDeleteAction`/
  //   `ListBulkDeleteAction` already clear `selectedIds` explicitly after their own mutation too,
  //   covering the id-still-present-but-now-stale moment between the mutation resolving and the
  //   `rows` prop re-rendering shorter.
  // - No `list.row.actions` contribution and no delete access: the ⋯ menu still renders
  //   (Open/Inspect/Copy ID always apply); only Delete is absent from it.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListLayout.test.tsx

New file — asserts slot wiring and Decision 28's ⋯-menu order without exercising the (not-yet-implemented) component bodies above: `resolveComponentContributions`'s actual ordering of `LIST_BUILTIN_ORDER` against a stand-in project contribution is the part of this step that IS testable before the guided stubs are filled in.

```tsx
import { describe, expect, it } from "vitest";
import { BUILTIN_CONTRIBUTION_IDS, resolveComponentContributions, SLOT_IDS } from "@vexcms/core";
import { LIST_BUILTIN_ORDER, listRowActionsBuiltins, listBulkActionsBuiltins } from "./listBuiltinContributions";

describe("listView built-in ids", () => {
  it("orders row-action built-ins Open, Inspect, Copy ID, contributions, Delete last (Decision 28)", () => {
    const resolved = resolveComponentContributions({
      slotId: SLOT_IDS.list.rowActions,
      contributions: [...listRowActionsBuiltins(), { id: "acme.flag", component: () => null }],
    });
    expect(resolved.map((c) => c.id)).toEqual([
      BUILTIN_CONTRIBUTION_IDS.list.rowOpen,
      BUILTIN_CONTRIBUTION_IDS.list.rowInspect,
      BUILTIN_CONTRIBUTION_IDS.list.rowCopyId,
      "acme.flag",
      BUILTIN_CONTRIBUTION_IDS.list.rowDelete,
    ]);
  });

  it("orders a project's own list.bulkActions contribution ahead of the built-in bulk delete", () => {
    const resolved = resolveComponentContributions({
      slotId: SLOT_IDS.list.bulkActions,
      contributions: [...listBulkActionsBuiltins(), { id: "acme.export", component: () => null }],
    });
    expect(resolved.map((c) => c.id)).toEqual(["acme.export", BUILTIN_CONTRIBUTION_IDS.list.bulkDelete]);
  });
});
```

#### packages/react/src/ui/data-table/DataTable.tsx

2 edits — bulk-delete UI moves out of this generic table (it becomes the `vex.list.bulk.delete` built-in, which needs the live `docs`/`collection` a plain data-table has no concept of); `DataTable` now only reports the selected ids via a callback. Everything else in the file (columns, Load More, the checkbox column) is unchanged.

**1 — imports.** Drop `BulkDeleteModal` and `DataTableBulkActions` (no longer rendered here); add `useEffect`:

```ts
import { useEffect, useMemo, useState } from "react";
```

**2 — `DataTableProps`.** Replace the "Bulk actions" section (`entityName`/`onBulkDelete`/`isDeleting`) and `enableBulkActions` with one callback:

```ts
  /** Enable checkbox column for row selection. */
  enableRowSelection?: boolean;

  /**
   * Invoked whenever the selected row ids change (a row toggled, "select all" toggled, or the
   * `data` array changed shape). The caller — `ListLayout` — owns what a selection means (the
   * `list.bulkActions` slot's `docs`), not this generic table.
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
  //    `ListLayout` state) so no extra memoization is needed here.
  // 3. Drop `deleteModalOpen` state, `handleBulkDelete`, the `<DataTableBulkActions>` and
  //    `<BulkDeleteModal>` JSX, and the `enableBulkActions`/`onBulkDelete`/`entityName`/
  //    `isDeleting` props entirely — keep the `<Table>`/`<TableHeader>`/`<TableBody>`/Load More/
  //    "all loaded" JSX exactly as it renders today.
  // Edge cases:
  // - TanStack's `rowSelection` is keyed by row index by default (no `getRowId` is passed), so a
  //   row removed from `data` after a delete can leave a STALE index selected pointing at a
  //   different row once the array re-renders shorter. Fire `onSelectionChange([])` whenever
  //   `data.length` drops below the number of currently-selected indices, so `ListLayout`'s own
  //   `selectedIds` state never outlives the rows it names — this component owns clearing itself
  //   on a shrinking `data` array; `ListRowDeleteAction`/`ListBulkDeleteAction` clear it too for
  //   the window between their own mutation resolving and `data` re-rendering shorter (belt and
  //   suspenders, see `ListLayout`'s own "Edge cases" note).
  throw new Error("Not implemented");
}
```

#### packages/react/src/ui/data-table/DataTableBulkActions.tsx

1 edit — drops the floating/fixed positioning (Decision 22: bulk controls render inline in the toolbar, never overlaying the table). Props (`selectedCount`, `onDelete`, `onClear`, `isDeleting`) and the rendered count/Delete/Clear buttons are unchanged, so `dataTableSuite.tsx`'s existing `DataTableBulkActions` assertions keep passing untouched.

Replace the JSDoc summary and the outer `<div>`'s `className`:

```tsx
/**
 * Inline bulk-action group — count, Delete, Clear — rendered wherever its caller places it
 * (Decision 22: inline in the toolbar area, left of Filter, never a floating overlay).
 *
 * Rendered by {@link ListBulkDeleteAction} (`vex.list.bulk.delete`) only when `props.docs` is
 * non-empty and the caller has delete access — a caller without it renders nothing, so no group
 * appears.
 */
```

```tsx
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-background px-4 py-3">
```

#### packages/react/src/collections/listView/CollectionListView.tsx

3 edits. Column-building, pagination, and the status column (`buildStatusColumn`, `columnFieldKey`, unchanged by Step 8's `useVexListQuery` migration except the pagination call itself) stay in this file — `ListLayout` is purely presentational. This file already lives at `collections/listView/CollectionListView.tsx` per Step 2's move; only its content changes here.

**1 — imports.** Drop `vexConvexApi` from the `@vexcms/core` import list (the `removeMutation` that used it moves into `ListRowDeleteAction`/`ListBulkDeleteAction`), drop the now-unused `VexLink`, `CreateDocumentModal`, and `adminHref` imports (moved into `ListCreateAction`), drop `useVexMutation` from the `../../hooks` import (keep `usePaginatedQuery`), drop `Button` and `DataTable` from the `../../ui` import (keep `Badge`, still used by `buildStatusColumn`), and add `ListLayout` plus `CollectionListProvider` (Decision 37 — this file owns and provides the shared list state):

```ts
import {
  CRUD_ACTIONS,
  isFieldAllowed,
  PERMISSION_SCOPES,
  VERSION_STATUSES,
  type CollectionListViewProps,
  type CollectionSlug,
  type TDocument,
} from "@vexcms/core";
import { type ColumnDef } from "@tanstack/react-table";
import { RevalidateButton } from "../../revalidate/RevalidateButton";
import { useVexConfig } from "../../config/VexConfigContext";
import { getCollectionColumnDefs } from "../../fields";
import { useFieldPermissions, usePermission } from "../../access";
import { usePaginatedQuery } from "../../hooks";
import { useMemo, useState } from "react";
import { Badge } from "../../ui";
import { collapseVersionedPairs, StatusBadge } from "../../versions";
import { ListLayout } from "./ListLayout";
import { CollectionListProvider } from "./CollectionListContext";
```

**2 — drop `removeMutation`/`handleBulkDelete`.** Remove the `const removeMutation = …` block and the `handleBulkDelete` arrow that followed it — that mutation now lives in `ListRowDeleteAction`/`ListBulkDeleteAction`.

**3 — the return.** Replace the body from the current permission checks through the end of the function with (selection state moves here from the old flat component — `CollectionListProvider`'s `selectedIds`/`setSelectedIds` need to exist above `ListLayout`, which only ever reads them back via `useCollectionList()`):

```tsx
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="relative">
      <div className="flex justify-end pt-4">
        <RevalidateButton collection={collection.slug} />
      </div>
      <CollectionListProvider
        value={{
          collection,
          selectedIds,
          setSelectedIds,
          // Step 10 replaces these two literals with the real per-browser
          // density (`useLocalStorage`) and the columns-menu selection
          // (`visibleFields` → `visibleColumns`) via its own anchored edit
          // to this file and to `CollectionListContext.tsx` — this step
          // only threads the shape through so `ListLayout` and its
          // `list.*` built-ins have a live provider to read from day one.
          density: "comfortable",
          visibleFields: [],
          // Step 10 wires the real opener (`urlState.setPeek`); this view
          // has no URL state to drive it with yet.
          onInspect: undefined,
        }}
      >
        <ListLayout
          collection={collection}
          rows={rows}
          columns={columns}
          isDone={pagination.isDone}
          isPending={pagination.isPending}
          totalCount={pagination.totalDocs}
          onLoadMore={pagination.loadMore}
        />
      </CollectionListProvider>
    </div>
  );
}
```

`ListCreateAction`/`ListRowDeleteAction`/`ListBulkDeleteAction` self-gate via `usePermission` (this file's own note on the review's self-gating revision), so this step's own `canCreate`/`canDelete` locals are removed along with the JSX that read them — Step 10 reintroduces both (`ListEmptyState`'s Create gate, the `selection.canDelete` context field) via its own anchored edit, once there is new JSX that needs them again.

### Step 10 — Toolbar controls, the shared URL codec, and the fixed-height data table [agent]

Why: search, sort, filters, and columns meet the core navigability acceptance; `DataTable`'s fixed-height body (Decision 22) and `ScrollSection` (Decision 31) are the standing scroll-container rule for the rest of the admin panel; Decision 35's count cap needs a visible "1,000+" in the same footer. Per the zero-layout-shift pass (Decisions 39–43, `standards/frontend/layout-stability.md`):

- The compact URL grammar (Decision 9) moves to `@vexcms/core` as `listUrlParams.ts` (Decision 40), pure and with no react import, so `NextAdminPage` (Step 14) can parse the same `q`/`qf`/`sort`/`filter`/`size`/`view`/`peek` params server-side and prefetch the exact query the client will run. `useListUrlState.ts` becomes a thin `nuqs` wrapper over the core codec instead of owning it.
- The toolbar's ⋯ overflow is pure CSS at fixed `@container/list` breakpoints (Decision 43), not a `ResizeObserver` measurement like `documents/useHeaderActionsCollapse.ts`. A measured collapse has nothing to render before its first effect runs, so a server-rendered page would paint the wrong collapse state for one frame and then snap; `layout-stability.md` rules that out. `ListToolbar` wraps Copy link and Rows-per-load each in a breakpoint class, with a second, CSS-complementary copy inside the ⋯ overflow menu, so the server HTML is already the settled UI.
- Density has the same problem one layer down: the old `DataTableColumnsMenu` read `useLocalStorage`, which returns nothing on the server, so the server and the client's first paint could render different row heights. Decision 42 moves it to a cookie. `packages/core/src/collections/listPreferenceCookies.ts` (new, this step) is the server-readable half — `parseListPreferences({ cookies })` — read once by `NextAdminPage` (Step 14) and passed down as `CollectionListView`'s new `initialPreferences` prop; Step 11 extends the same file with the collection-scoped filter-chip cookie. `DataTableColumnsMenu`'s density toggle becomes fully controlled (`density`/`onDensityChange`); the cookie is only ever WRITTEN client-side, via `listView/listPreferenceCookies.ts`'s `writeListDensityCookie`, mirroring `useLivePreviewPanelState.ts`'s `writePreferenceCookie`/`readLivePreviewPanelCookie` split.

This step's components stay reusable, prop-driven primitives — the context/slot plumbing that wires them into `vex.list.*` lives in Step 9's `CollectionListContext`/`listBuiltinContributions.ts`/`ListLayout.tsx` (Decision 37), the same split the edit view uses between `VexDocumentProvider` and `documentEditBuiltinContributions.ts`.

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

All the primitives in this step stay controlled components — each reads its value from props and reports changes through a callback, never owning persisted state itself (this step tightens that rule further: `DataTableColumnsMenu` no longer has an exception for density). `useListUrlState` is the one piece that touches the URL (via `nuqs` — see `CreateDocumentModal.tsx`); `listUrlParams.ts` underneath it is pure, framework-agnostic, lives in `@vexcms/core`, and is independently round-trip-tested there. Column visibility stays plain session state owned by `CollectionListView` (Decision 15: no auto-persist with no view selected); density is cookie-backed (Decision 42), seeded server-side and written client-side, owned by `CollectionListView` and threaded through context — neither lives in the URL or in a saved view (Decision 9).

**The context value this step upgrades.** Step 9 already mounts `CollectionListProvider` from `CollectionListView.tsx`, with a placeholder `density`/`visibleFields` and flat `selectedIds`/`setSelectedIds` (Decision 37's base shape, `CollectionListContext.tsx`). This step's own anchored edit to `CollectionListContext.tsx` (above) extends that shape — `selectedIds`/`setSelectedIds` fold into a `selection` object, `visibleFields` becomes `visibleColumns`/`onVisibleColumnsChange`/`hideableColumns`, `urlState`/`hasActiveView` are added, and `density` gains a sibling setter, `onDensityChange` — and `CollectionListView.tsx`'s edit 4 (below) replaces the placeholder provider value with the real one built from this step's new state.

`ListLayout.tsx` (Step 9, extended by this step's edit 2 above) needs the query-result/permission props that are NOT list-wide UI state — `collection`, `rows`, `columns`, `isDone`, `isPending`, `totalCount`, `totalDocsCapped`, `onLoadMore`, `canCreate`, `canDelete`, `emptyState`, `queryError` — and renders `<ListToolbar />` and `<DataTable />` reading the rest from `useCollectionList()`.

**Why page size is in the toolbar, collapsible — not fixed in `DataTable`'s footer.** Decision 22 fixes the toolbar's collapse order as "Copy link, then Columns, then rows per load," which only makes sense if Rows-per-load is a toolbar control in the first place: `DataTablePageSizeSelect` renders inside `ListToolbar`'s collapsible group; `DataTable`'s footer keeps only the Load More button and the "Showing N of M" status line, reading `pageSize` solely to label the button ("Load 25 more").

**Why "Columns" narrows itself via CSS instead of being duplicated into the ⋯ menu.** Copy link and Rows-per-load are `ListToolbar`-owned controls with no `vex.list.*` id (Decision 17 never names one for either), so `ListToolbar` can freely mount a second, CSS-hidden copy of either one inside the overflow `DropdownMenuContent`. Columns, by contrast, is the `vex.list.columns` built-in (this step's `ListColumnsAction.tsx`), resolved through the same `list.toolbar` `SlotOutlet` as `vex.list.search` and any project contribution — `SlotOutlet` resolves that whole ordered list as one atomic render, so `ListToolbar` cannot mount a second instance of just the Columns entry without mounting a second instance of everything else in the slot too. `DataTableColumnsMenu` therefore owns its own collapse: the "Columns" label sits in a `<span className="hidden @xl/list:inline">`, so the single mounted instance narrows itself as the `@container/list` ancestor shrinks, with no prop, no duplication, and no measurement. `ListToolbarSlotProps` carries no `collapsed` field, and `DataTableColumnsMenuProps` carries no `collapsed` prop either — the CSS narrowing is entirely internal to `DataTableColumnsMenu`. This step's `ListColumnsAction.tsx` and `ListSearchAction.tsx` (new this step — see their own sections above) never need a `collapsed` prop: they forward `density={list.density}`/`onDensityChange={list.onDensityChange}` (and `visibleColumns`/`onVisibleColumnsChange`/`hideableColumns`/`collection`/`urlState`) straight from `useCollectionList()`, the one place the client ever derives these values.

**Why "sortable headers" and "the columns menu" need no new read-access code here.** `CollectionListView.tsx` already filters `getCollectionColumnDefs`'s output through `isFieldAllowed(fieldPermissions, key)` before anything downstream sees it (current repo code, unchanged by this step) — an unreadable field never becomes a column, so it can never render a `DataTableSortHeader` and never appears in `hideableColumns`. The server independently rejects a sort/search request naming an unreadable field with `VexAccessError` (Decision 26, Step 6/8) — this step's gating is advisory UI, the server's is the real enforcement. Decision 26's remaining surface this step owns is the search field picker: `collection.admin.table.searchField` is independent config, not derived from the columns above, so `ListSearch` (this step) runs its own `isFieldAllowed` filter.

**Why `CollectionListView` seeds `density` from a prop instead of re-reading the cookie client-side.** `document.cookie` is unavailable to a server component, and re-reading it on the client (functionally what the old `useLocalStorage` approach did) would make the client's FIRST render depend on an effect, repainting once that effect resolves — the same one-frame flash `layout-stability.md` rules out. `NextAdminPage` (Step 14) already parses the cookie server-side through `parseListPreferences` to decide what to render; passing that value down as `initialPreferences` means `CollectionListView`'s `useState` initializer and the server's render agree on `density` before any client JS runs. The cookie is WRITTEN, never read, from the client (`writeListDensityCookie`) — the one read happens server-side, in `parseListPreferences`.

#### packages/core/src/collections/listUrlParams.ts

```ts
import { ADMIN_FIELDS, getDataFields } from "../fields";
import type { CollectionConfig } from "./types";
import type { VexWhereNode } from "../db/queryArgs";

/** A saved view's source, matching the `view=<source>:<id>` URL prefix (Decision 9/11). */
export type ListViewSource = "config" | "shared" | "local";

/** The portable `{ field, order }` sort shape (Decision 4), restricted to the collection's own field slugs plus `_creationTime`. */
export interface ListSort<TFieldSlug extends string = string> {
  field: TFieldSlug | "_creationTime";
  order: "asc" | "desc";
}

/**
 * The collection list's full URL state, decoded from the compact
 * query-param grammar (Decision 9): `q`, `qf` (omitted when it's the
 * default field), `sort=<field>.<asc|desc>`, `filter=(<field>.<op>.<value>,…)|(…)`,
 * `size` (omitted at the default), `view=<config|shared|local>:<id>`, `peek=<id>`.
 *
 * Lives in `@vexcms/core` (Decision 40), pure and dependency-free of react
 * or any UI library — `NextAdminPage` (Step 14) and `useListUrlState`
 * (this step's own react wrapper) both call `parseListParams`/
 * `serializeListParams` directly, so the server's prefetch args and the
 * client's query args are built from one implementation, never two that
 * could drift.
 *
 * @typeParam TFieldSlug - The collection's own field slugs.
 */
export interface ListParams<TFieldSlug extends string = string> {
  /** Raw search text (`?q=`). `""` means no search is active. */
  q: string;
  /** The active search field (`?qf=`), or `undefined` to use `collection.admin.table.searchField[0]`. */
  qf: TFieldSlug | undefined;
  /** Portable sort (`?sort=`), or `undefined` to fall back to `collection.admin.table.defaultSort`. Decision 7: while `q !== ""`, callers must ignore this rather than send it to the server — this hook still parses and returns it (the park is a rendering/query-building concern, not a URL-state one). */
  sort: ListSort<TFieldSlug> | undefined;
  /** The filter (`?filter=`), decoded into a plain `VexWhereNode`, or `undefined` for none. */
  filter: VexWhereNode<TFieldSlug> | undefined;
  /** Page size (`?size=`), or `undefined` to fall back to `collection.admin.table.defaultPageSize`. */
  size: number | undefined;
  /** The active saved view, as the raw `<source>:<id>` string (`?view=`), or `undefined` for none. Step 12 splits this into `source`/`id`; this module keeps it opaque. */
  view: string | undefined;
  /** The Inspect peek's open document id (`?peek=`), or `undefined` when the peek is closed. */
  peek: string | undefined;
}

/**
 * The filter row's `<op>` token set this URL grammar accepts — the six
 * comparisons plus Decision 10's two list-only, no-value operators. Not
 * `ListFilterOp` from Step 11's `whereDnf.ts`: that file doesn't exist yet
 * at this step, and this module only needs the literal token set, not the
 * editor's richer type (`isEmpty`/`isNotEmpty` compile straight down to
 * `eq`/`neq` with `value: undefined` here, same as Decision 10's rule).
 */
const URL_FILTER_OPS = ["eq", "neq", "gt", "gte", "lt", "lte", "isEmpty", "isNotEmpty"] as const;
type UrlFilterOp = (typeof URL_FILTER_OPS)[number];

/** How a field's filter value is encoded in the `<value>` URL segment (Decision 9). */
type FilterValueKind = "number" | "boolean" | "date" | "string";

/**
 * Resolves a filter row's field to its {@link FilterValueKind}.
 * Relationship IDs are classified `"string"` too — Convex ids never contain
 * the grammar's delimiter characters, so `encodeURIComponent` round-trips
 * them as a no-op, and a dedicated kind would just duplicate the `"string"`
 * branch.
 *
 * @param props - Input props.
 * @param props.collection - Resolves `field`'s type, except the built-in
 *   `"vex_status"` filter field (Decision 10), which isn't a real data
 *   field and is hardcoded to `"string"`.
 * @param props.field - The filter row's field key.
 * @returns The value kind, or `undefined` when `field` is neither
 *   `"vex_status"` nor a data field on `collection` — the caller drops the row.
 */
function filterValueKindForField(props: {
  collection: CollectionConfig;
  field: string;
}): FilterValueKind | undefined {
  // TODO: implement
  // 1. `props.field === "vex_status"` → return `"string"`.
  // 2. `fieldDef = getDataFields({ fields: props.collection.fields })[props.field]`
  //    → `undefined` → return `undefined`.
  // 3. `fieldDef.type === ADMIN_FIELDS.number.type` → `"number"`.
  // 4. `fieldDef.type === ADMIN_FIELDS.checkbox.type` → `"boolean"`.
  // 5. `fieldDef.type === ADMIN_FIELDS.date.type` → `"date"`.
  // 6. Anything else (text, select, relationship, …) → `"string"`.
  throw new Error("Not implemented");
}

/** Encodes one filter leaf's `value` into its `<value>` URL segment, per {@link FilterValueKind}. */
function encodeFilterValue(props: { kind: FilterValueKind; value: unknown }): string {
  // TODO: implement
  // 1. `"number"` → `String(props.value)`.
  // 2. `"boolean"` → `props.value ? "true" : "false"`.
  // 3. `"date"` → `new Date(props.value as number).toISOString()` — core
  //    stores dates as epoch-ms `v.number()` (`fields/date/validator.ts`),
  //    the URL wants ISO (Decision 9).
  // 4. `"string"` → `encodeURIComponent(String(props.value))`.
  throw new Error("Not implemented");
}

/** Decodes one filter leaf's `<value>` URL segment back into its stored value, per {@link FilterValueKind}, or `undefined` when `raw` doesn't parse for that kind (a `"string"` kind's legitimately-empty decode is `""`, never `undefined` — only an actual failure returns `undefined`). */
function decodeFilterValue(props: { kind: FilterValueKind; raw: string }): unknown {
  // TODO: implement
  // 1. `"number"` → `Number(props.raw)`; `Number.isNaN` the result →
  //    return `undefined`.
  // 2. `"boolean"` → `"true"` → `true`; `"false"` → `false`; anything else
  //    → `undefined`.
  // 3. `"date"` → `Date.parse(props.raw)`; `Number.isNaN` the result →
  //    `undefined`; else the epoch-ms number itself (NOT a `Date` object —
  //    matches the stored shape).
  // 4. `"string"` → `try { return decodeURIComponent(props.raw) } catch {
  //    return undefined }`.
  throw new Error("Not implemented");
}

/**
 * Parses one `<field>.<op>.<value>` (or `<field>.<op>` for `isEmpty`/
 * `isNotEmpty`) filter row into a plain `VexWhereNode` leaf.
 *
 * Splits on the FIRST two `.` only — `<value>` is everything after the
 * second dot, kept intact even if it itself contains dots (an ISO datetime
 * value such as `2026-09-01T00:00:00.000Z` has one).
 *
 * @param props - Input props.
 * @param props.row - One row's raw string, already split out of its group.
 * @param props.collection - Resolves the field's {@link FilterValueKind}.
 * @returns The leaf, or `undefined` for anything malformed — an unknown
 *   field, an unrecognized op, a missing value for a value-bearing op, a
 *   stray value for `isEmpty`/`isNotEmpty`, or a value that fails
 *   {@link decodeFilterValue} — dropped silently, never thrown (Decision 9).
 */
function parseFilterRow<S extends string>(props: {
  row: string;
  collection: CollectionConfig;
}): Extract<VexWhereNode<S>, { field: string }> | undefined {
  // TODO: implement
  // 1. `firstDot = props.row.indexOf(".")` → `-1` → return `undefined`.
  // 2. `field = props.row.slice(0, firstDot)`; `rest = props.row.slice(firstDot + 1)`.
  // 3. `secondDot = rest.indexOf(".")`:
  //    a. `-1` → `op = rest`, `rawValue = undefined` (no third segment).
  //    b. else → `op = rest.slice(0, secondDot)`, `rawValue =
  //       rest.slice(secondDot + 1)` (may be `""` — an explicit
  //       empty-string `eq`, distinct from "no value at all").
  // 4. `!URL_FILTER_OPS.includes(op as UrlFilterOp)` → return `undefined`.
  // 5. `op === "isEmpty" || op === "isNotEmpty"`:
  //    a. `rawValue !== undefined` → return `undefined` (a value on a
  //       no-value op is malformed).
  //    b. → return `{ field, op: op === "isEmpty" ? "eq" : "neq", value:
  //       undefined } as Extract<VexWhereNode<S>, { field: string }>`
  //       (Decision 10's compile rule).
  // 6. `rawValue === undefined` → return `undefined` (a value-bearing op
  //    with no third segment).
  // 7. `kind = filterValueKindForField({ collection: props.collection, field })`
  //    → `undefined` → return `undefined`.
  // 8. `value = decodeFilterValue({ kind, raw: rawValue })` → `undefined`
  //    → return `undefined`.
  // 9. → return `{ field, op, value } as Extract<VexWhereNode<S>, { field: string }>`.
  throw new Error("Not implemented");
}

/**
 * Serializes one leaf back into its `<field>.<op>.<value>` row — the
 * inverse of {@link parseFilterRow}.
 *
 * @param props - Input props.
 * @param props.leaf - The leaf, matched structurally against `{ field; op;
 *   value }` (Step 11's `WhereDnfLeaf` shape — not imported, this file
 *   predates `whereDnf.ts`).
 * @param props.collection - Resolves the field's {@link FilterValueKind}.
 * @returns The row string, or `undefined` when the field isn't resolvable
 *   (defensive — the filter builder never produces such a leaf).
 */
function serializeFilterRow(props: {
  leaf: { field: string; op: string; value: unknown };
  collection: CollectionConfig;
}): string | undefined {
  // TODO: implement
  // 1. `props.leaf.value === undefined`:
  //    a. `props.leaf.op === "eq"` → return `"${props.leaf.field}.isEmpty"`.
  //    b. `props.leaf.op === "neq"` → return `"${props.leaf.field}.isNotEmpty"`.
  //    c. anything else → return `"${props.leaf.field}.${props.leaf.op}"`
  //       (defensive fallback; not produced by the filter builder).
  // 2. `kind = filterValueKindForField({ collection: props.collection,
  //    field: props.leaf.field })` → `undefined` → return `undefined`.
  // 3. → return `"${props.leaf.field}.${props.leaf.op}." +
  //    encodeFilterValue({ kind, value: props.leaf.value })`.
  throw new Error("Not implemented");
}

/**
 * Parses the whole `?filter=` value into a plain `VexWhereNode`, collapsing
 * groups the same way Step 11's `whereDnf.ts#fromDnf` will — duplicated
 * here rather than imported, since `whereDnf.ts` doesn't exist until Step
 * 11; both codecs independently converge on the same plain-node shape.
 *
 * @param props - Input props.
 * @param props.raw - The raw `?filter=` value. `URLSearchParams` has
 *   already undone the OUTER query-string percent-encoding; the grammar's
 *   own `,`/`|`/`(`/`)` structural characters are intact, and each
 *   `"string"`-kind row's `<value>` segment is still `encodeURIComponent`-
 *   encoded exactly once (see {@link decodeFilterValue}).
 * @param props.collection - Resolves each row's field type.
 * @returns `undefined` for an empty/all-invalid filter; the bare leaf for
 *   one surviving group of one row; `{ and }` for one group of 2+ rows;
 *   `{ or }` for 2+ surviving groups (mirrors `fromDnf`'s own collapsing).
 */
function parseFilterParam<S extends string>(props: {
  raw: string;
  collection: CollectionConfig;
}): VexWhereNode<S> | undefined {
  // TODO: implement
  // 1. `props.raw === ""` → return `undefined`.
  // 2. `groupStrings = props.raw.split("|")`.
  // 3. For each `groupString`, build a surviving `rows` array or drop the
  //    group entirely:
  //    a. `!groupString.startsWith("(") || !groupString.endsWith(")")` →
  //       drop (malformed wrapper).
  //    b. `inner = groupString.slice(1, -1)`; `rowStrings = inner === ""
  //       ? [] : inner.split(",")`.
  //    c. `rows = rowStrings.map((row) => parseFilterRow<S>({ row,
  //       collection: props.collection })).filter((leaf): leaf is
  //       NonNullable<typeof leaf> => leaf !== undefined)`.
  //    d. `rows.length === 0` → drop the group (an originally-empty or
  //       all-invalid group never survives, matching `fromDnf`'s own "drop
  //       empty groups" rule).
  // 4. `survivingRowArrays = <kept arrays from step 3>`. `.length === 0` →
  //    return `undefined`.
  // 5. `nodes = survivingRowArrays.map((rows) => rows.length === 1 ?
  //    rows[0] : { and: rows })`.
  // 6. `nodes.length === 1` → return `nodes[0]`.
  // 7. → return `{ or: nodes } as VexWhereNode<S>`.
  throw new Error("Not implemented");
}

/**
 * Serializes a plain `VexWhereNode` into the `?filter=` grammar — the
 * inverse of {@link parseFilterParam}, restricted to the three shapes the
 * filter builder (Step 11) ever produces: a bare leaf, a flat `{ and:
 * leaves }`, or `{ or: (leaf | { and: leaves })[] }`.
 *
 * @param props - Input props.
 * @param props.where - The filter to serialize, or `undefined`.
 * @param props.collection - Resolves each leaf's field type.
 * @returns The grammar string, or `undefined` for `undefined`/an
 *   unrepresentable shape (a `not`, a nested `or`/`and`, or any leaf whose
 *   {@link serializeFilterRow} itself fails) — the caller OMITS the `filter`
 *   key entirely rather than writing a broken URL.
 */
function serializeFilterParam(props: {
  where: VexWhereNode<string> | undefined;
  collection: CollectionConfig;
}): string | undefined {
  // TODO: implement
  // 1. `props.where === undefined` → return `undefined`.
  // 2. Build `groups: { field: string; op: string; value: unknown }[][]`:
  //    a. `"field" in props.where` (bare leaf) → `groups = [[props.where as
  //       { field: string; op: string; value: unknown }]]`.
  //    b. `"and" in props.where` → every member must satisfy `"field" in
  //       member` → `groups = [props.where.and as typeof groups[number]]`;
  //       any non-leaf member → return `undefined`.
  //    c. `"or" in props.where` → for each member: a leaf → one
  //       single-row group; an `{ and: leaves }` whose every member is a
  //       leaf → one group of those rows; anything else (nested `or`,
  //       `not`) → return `undefined` for the WHOLE call.
  //    d. `"not" in props.where` → return `undefined`.
  // 3. `rowStrings = groups.map((group) => group.map((leaf) =>
  //    serializeFilterRow({ leaf, collection: props.collection })))` — any
  //    `undefined` anywhere in the result → return `undefined` for the
  //    whole call.
  // 4. → return `rowStrings.map((rows) => "(" + rows.join(",") +
  //    ")").join("|")`.
  throw new Error("Not implemented");
}

/** `_creationTime` plus `collection`'s own data-field keys — the valid `sort.field`/`qf` universe. */
function knownFieldSlugs(props: { collection: CollectionConfig }): Set<string> {
  // TODO: implement
  // `return new Set(["_creationTime", ...Object.keys(getDataFields({
  //   fields: props.collection.fields }))])`.
  throw new Error("Not implemented");
}

/**
 * Parses the collection list's full compact-grammar URL state (Decision 9).
 *
 * @param props - Input props.
 * @param props.searchParams - The raw `q`/`qf`/`sort`/`filter`/`size`/
 *   `view`/`peek` params. A key absent from `searchParams` is treated the
 *   same as "not set".
 * @param props.collection - Constrains `qf`/`sort.field` to the
 *   collection's own fields and `size` to `admin.table.pageSizeOptions`.
 * @returns The parsed state. Every field is independently validated — one
 *   malformed param never affects another — and a malformed value is
 *   DROPPED (falls back to its default/`undefined`), never thrown.
 */
export function parseListParams<TFieldSlug extends string = string>(props: {
  searchParams: URLSearchParams;
  collection: CollectionConfig;
}): ListParams<TFieldSlug> {
  // TODO: implement
  // 1. `q = props.searchParams.get("q") ?? ""`.
  // 2. `fields = knownFieldSlugs({ collection: props.collection })`.
  // 3. `qfRaw = props.searchParams.get("qf")`; `qf = qfRaw !== null &&
  //    (props.collection.admin.table.searchField as readonly string[]).includes(qfRaw)
  //    ? (qfRaw as TFieldSlug) : undefined`.
  // 4. `sortRaw = props.searchParams.get("sort")`; `sort = undefined`
  //    unless `sortRaw` matches `/^(.+)\.(asc|desc)$/` (the LAST `.` is the
  //    separator — field slugs never contain one) AND the captured field is
  //    in `fields`, in which case `{ field: <captured> as TFieldSlug |
  //    "_creationTime", order: <captured as "asc" | "desc"> }`.
  // 5. `filterRaw = props.searchParams.get("filter")`; `filter = filterRaw
  //    === null ? undefined : parseFilterParam<TFieldSlug>({ raw:
  //    filterRaw, collection: props.collection })`.
  // 6. `sizeRaw = props.searchParams.get("size")`; `size = sizeRaw !== null
  //    && props.collection.admin.table.pageSizeOptions.includes(Number(sizeRaw))
  //    ? Number(sizeRaw) : undefined`.
  // 7. `viewRaw = props.searchParams.get("view")`; `view = viewRaw !== null
  //    && /^(config|shared|local):.+$/.test(viewRaw) ? viewRaw : undefined`.
  // 8. `peek = props.searchParams.get("peek") ?? undefined`.
  // 9. → return `{ q, qf, sort, filter, size, view, peek }`.
  throw new Error("Not implemented");
}

/**
 * Serializes a (possibly partial) collection list state back into the
 * compact-grammar URL params — the inverse of {@link
 * parseListParams}, and also how `ListCopyLinkButton`
 * (Step 10) builds a fully self-contained link for a local view (Step 12).
 *
 * @param props - Input props.
 * @param props.params - The full state to serialize.
 * @param props.collection - Resolves the `qf`/`size` defaults and each
 *   filter leaf's field type.
 * @returns A `URLSearchParams` with only the non-default keys set — `qf` is
 *   dropped when it equals `searchField[0]`, `size` when it equals
 *   `defaultPageSize`, and every other falsy/`undefined` field is simply
 *   absent (Decision 9: "omitted when it's the default").
 */
export function serializeListParams(props: {
  params: Partial<ListParams<string>>;
  collection: CollectionConfig;
}): URLSearchParams {
  // TODO: implement
  // 1. `out = new URLSearchParams()`.
  // 2. `props.params.q` truthy → `out.set("q", props.params.q)`.
  // 3. `props.params.qf !== undefined && props.params.qf !==
  //    props.collection.admin.table.searchField[0]` → `out.set("qf",
  //    props.params.qf)`.
  // 4. `props.params.sort !== undefined` → `out.set("sort",
  //    \`${props.params.sort.field}.${props.params.sort.order}\`)`.
  // 5. `serializeFilterParam({ where: props.params.filter, collection:
  //    props.collection })` not `undefined` → `out.set("filter", <that>)`.
  // 6. `props.params.size !== undefined && props.params.size !==
  //    props.collection.admin.table.defaultPageSize` → `out.set("size",
  //    String(props.params.size))`.
  // 7. `props.params.view` → `out.set("view", props.params.view)`.
  // 8. `props.params.peek` → `out.set("peek", props.params.peek)`.
  // 9. → return `out`.
  throw new Error("Not implemented");
}
```

#### packages/core/src/collections/listUrlParams.test.ts

```ts
import { describe, expect, it } from "vitest";
import { checkbox, date, defineCollection, number, relationship, select, text } from "../index";
import { parseListParams, serializeListParams } from "./listUrlParams";

const collection = defineCollection({
  slug: "url_params_test",
  fields: {
    title: text({ required: false }),
    rating: number({ required: false }),
    featured: checkbox({ required: false }),
    publishedAt: date({ required: false }),
    source: select({ required: false, options: [{ label: "G2", value: "g2" }, { label: "Site", value: "site" }] }),
    company: relationship({ collection: { slug: "companies" }, required: false }),
  },
  admin: {
    table: {
      searchField: ["title"],
      pageSizeOptions: [10, 25, 50],
      defaultPageSize: 10,
    },
  },
});

function parse(query: string) {
  return parseListParams({ searchParams: new URLSearchParams(query), collection });
}

describe("parseListParams", () => {
  it("defaults every field for an empty query", () => {
    expect(parse("")).toEqual({
      q: "",
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view: undefined,
      peek: undefined,
    });
  });

  it("parses q and a non-default qf", () => {
    expect(parse("?q=ma&qf=title").q).toBe("ma");
    // title IS the default (searchField[0]) in this fixture, so it still
    // round-trips as the explicit value when present in the URL — the
    // "omit when default" rule applies to SERIALIZING, not parsing.
    expect(parse("?q=ma&qf=title").qf).toBe("title");
  });

  it("drops a qf outside searchField", () => {
    expect(parse("?qf=rating").qf).toBeUndefined();
  });

  it("parses a valid sort", () => {
    expect(parse("?sort=rating.desc").sort).toEqual({ field: "rating", order: "desc" });
  });

  it("drops a sort on an unknown field", () => {
    expect(parse("?sort=nonexistent.asc").sort).toBeUndefined();
  });

  it("drops a sort with an invalid order", () => {
    expect(parse("?sort=rating.sideways").sort).toBeUndefined();
  });

  it("accepts _creationTime as a sort field", () => {
    expect(parse("?sort=_creationTime.desc").sort).toEqual({
      field: "_creationTime",
      order: "desc",
    });
  });

  it("parses a single-row filter", () => {
    expect(parse("?filter=(rating.gte.4)").filter).toEqual({
      field: "rating",
      op: "gte",
      value: 4,
    });
  });

  it("parses a multi-row AND group", () => {
    expect(parse("?filter=(rating.gte.4,featured.eq.true)").filter).toEqual({
      and: [
        { field: "rating", op: "gte", value: 4 },
        { field: "featured", op: "eq", value: true },
      ],
    });
  });

  it("parses multiple OR groups", () => {
    expect(parse("?filter=(rating.gte.4)|(source.eq.g2)").filter).toEqual({
      or: [
        { field: "rating", op: "gte", value: 4 },
        { field: "source", op: "eq", value: "g2" },
      ],
    });
  });

  it("parses isEmpty/isNotEmpty as eq/neq with value: undefined", () => {
    expect(parse("?filter=(company.isEmpty)").filter).toEqual({
      field: "company",
      op: "eq",
      value: undefined,
    });
    expect(parse("?filter=(company.isNotEmpty)").filter).toEqual({
      field: "company",
      op: "neq",
      value: undefined,
    });
  });

  it("decodes a date value from ISO into epoch ms", () => {
    const iso = "2026-09-01T00:00:00.000Z";
    expect(parse(`?filter=(publishedAt.gte.${encodeURIComponent(iso)})`).filter).toEqual({
      field: "publishedAt",
      op: "gte",
      value: Date.parse(iso),
    });
  });

  it("decodes a URI-encoded string value, including one that embeds delimiter characters", () => {
    const raw = "a, b | c (d)";
    expect(parse(`?filter=(title.eq.${encodeURIComponent(raw)})`).filter).toEqual({
      field: "title",
      op: "eq",
      value: raw,
    });
  });

  it("drops a row referencing an unknown field", () => {
    expect(parse("?filter=(nope.eq.1)").filter).toBeUndefined();
  });

  it("drops a row with an unrecognized operator, keeping the rest of its group", () => {
    expect(parse("?filter=(rating.gte.4,rating.contains.5)").filter).toEqual({
      field: "rating",
      op: "gte",
      value: 4,
    });
  });

  it("drops an all-invalid group, keeping the surviving group", () => {
    expect(parse("?filter=(nope.eq.1)|(rating.gte.4)").filter).toEqual({
      field: "rating",
      op: "gte",
      value: 4,
    });
  });

  it("returns undefined for an all-invalid filter", () => {
    expect(parse("?filter=(nope.eq.1)").filter).toBeUndefined();
  });

  it("drops a size outside pageSizeOptions", () => {
    expect(parse("?size=999").size).toBeUndefined();
  });

  it("accepts a configured size", () => {
    expect(parse("?size=25").size).toBe(25);
  });

  it("parses a valid view ref", () => {
    expect(parse("?view=shared:5star").view).toBe("shared:5star");
    expect(parse("?view=config:featured").view).toBe("config:featured");
    expect(parse("?view=local:abc-123").view).toBe("local:abc-123");
  });

  it("drops a view with an unknown source prefix", () => {
    expect(parse("?view=team:abc").view).toBeUndefined();
  });

  it("parses peek as a raw id", () => {
    expect(parse("?peek=k17a4n8c").peek).toBe("k17a4n8c");
  });
});

describe("serializeListParams", () => {
  function serialize(params: Parameters<typeof serializeListParams>[0]["params"]) {
    return serializeListParams({ params, collection }).toString();
  }

  it("serializes nothing for an all-default state", () => {
    expect(serialize({ q: "", qf: undefined, sort: undefined, filter: undefined, size: undefined, view: undefined, peek: undefined })).toBe("");
  });

  it("omits qf when it equals searchField[0]", () => {
    expect(serialize({ q: "ma", qf: "title" })).toBe("q=ma");
  });

  it("includes qf when it differs from the default", () => {
    const out = new URLSearchParams(serialize({ q: "ma", qf: "rating" }));
    expect(out.get("qf")).toBe("rating");
  });

  it("omits size when it equals defaultPageSize", () => {
    expect(serialize({ size: 10 })).toBe("");
  });

  it("includes size when it differs from the default", () => {
    const out = new URLSearchParams(serialize({ size: 25 }));
    expect(out.get("size")).toBe("25");
  });

  it("serializes a sort", () => {
    const out = new URLSearchParams(serialize({ sort: { field: "rating", order: "desc" } }));
    expect(out.get("sort")).toBe("rating.desc");
  });

  it("serializes a bare leaf filter", () => {
    const out = new URLSearchParams(
      serialize({ filter: { field: "rating", op: "gte", value: 4 } }),
    );
    expect(out.get("filter")).toBe("(rating.gte.4)");
  });

  it("serializes isEmpty/isNotEmpty from a value: undefined leaf", () => {
    const out = new URLSearchParams(
      serialize({ filter: { field: "company", op: "eq", value: undefined } }),
    );
    expect(out.get("filter")).toBe("(company.isEmpty)");
  });

  it("serializes an and group and an or of groups", () => {
    const andOut = new URLSearchParams(
      serialize({
        filter: { and: [{ field: "rating", op: "gte", value: 4 }, { field: "featured", op: "eq", value: true }] },
      }),
    );
    expect(andOut.get("filter")).toBe("(rating.gte.4,featured.eq.true)");

    const orOut = new URLSearchParams(
      serialize({
        filter: { or: [{ field: "rating", op: "gte", value: 4 }, { field: "source", op: "eq", value: "g2" }] },
      }),
    );
    expect(orOut.get("filter")).toBe("(rating.gte.4)|(source.eq.g2)");
  });

  it("URI-encodes a string value containing delimiter characters", () => {
    const raw = "a, b | c (d)";
    const out = new URLSearchParams(
      serialize({ filter: { field: "title", op: "eq", value: raw } }),
    );
    expect(out.get("filter")).toBe(`(title.eq.${encodeURIComponent(raw)})`);
  });

  it("omits filter for an unrepresentable shape (not)", () => {
    expect(
      serialize({ filter: { not: { field: "rating", op: "gte", value: 4 } } as never }),
    ).toBe("");
  });

  it("serializes view and peek verbatim", () => {
    const out = new URLSearchParams(serialize({ view: "shared:5star", peek: "k17a4n8c" }));
    expect(out.get("view")).toBe("shared:5star");
    expect(out.get("peek")).toBe("k17a4n8c");
  });
});

describe("round-trip", () => {
  const cases: { name: string; query: string }[] = [
    { name: "empty", query: "" },
    { name: "search with non-default field", query: "q=ma&qf=rating" },
    { name: "sort", query: "sort=rating.desc" },
    { name: "search with parked sort", query: "q=ma&sort=rating.desc" },
    { name: "and group", query: "filter=(rating.gte.4%2Cfeatured.eq.true)" },
    { name: "or of groups", query: "filter=(rating.gte.4)%7C(source.eq.g2)" },
    { name: "isEmpty", query: "filter=(company.isEmpty)" },
    { name: "non-default size", query: "size=25" },
    { name: "shared view with changes", query: "view=shared%3Areview&sort=rating.desc" },
    { name: "peek", query: "peek=k17a4n8c" },
    {
      name: "everything at once",
      query:
        "q=ma&qf=rating&sort=rating.desc&filter=(rating.gte.4%2Cfeatured.eq.true)%7C(source.eq.g2)&size=25&view=local%3Aabc&peek=k17a4n8c",
    },
  ];

  it.each(cases)("round-trips $name", ({ query }) => {
    const parsed = parse(query);
    const reSerialized = serializeListParams({ params: parsed, collection }).toString();
    const reParsed = parse(reSerialized);
    expect(reParsed).toEqual(parsed);
  });
});
```

#### packages/core/src/collections/index.ts

1 edit — append the two new barrel exports:

```ts
export * from "./config";
export * from "./constants";
export * from "./types";
export * from "./utils";
export * from "./validator";
export * from "./interfaceGen";
export * from "./hooks";
export * from "./resolveCollectionIndexes";
export * from "./listUrlParams";
export * from "./listPreferenceCookies";
```

#### packages/core/src/collections/listPreferenceCookies.ts

```ts
/**
 * Per-browser list-view preferences that affect LAYOUT (Decision 42) — read
 * from cookies on the server (`NextAdminPage`, Step 14, via
 * {@link parseListPreferences}) and written only by the client
 * (`listView/listPreferenceCookies.ts`'s `writeListDensityCookie`), the
 * same split `livePreview/panelCookie.ts` draws between the name/parser
 * living in `@vexcms/core` and the write happening in a `"use client"`
 * hook. Density is today's only entry; Step 11 adds the collection-scoped
 * filter-chip cookie to this same file.
 */
export type ListDensity = "comfortable" | "compact";

/** The parsed shape {@link parseListPreferences} returns. */
export interface ListPreferences {
  /** Row density (Decision 29), or the default `"comfortable"` with no cookie yet. */
  density: ListDensity;
}

/**
 * Cookie names backing {@link ListPreferences}. Density is a single,
 * collection-agnostic cookie ("stored per browser", Decision 29) — unlike
 * `livePreviewPanelCookieName`, it needs no slug-scoped name-builder
 * function.
 */
export const LIST_PREFERENCE_COOKIES = {
  density: "vex-list-density",
} as const;

/** One cookie jar entry — matches both `next/headers`'s `cookies()` return value and the shape `NextAdminPage` already destructures elsewhere (`cookieStore.get(name)?.value`). */
export interface ListPreferenceCookieReader {
  get: (name: string) => { value: string } | undefined;
}

/**
 * Resolves every layout-affecting list preference from the request's
 * cookies. Pure, like `readLivePreviewPanelCookie`, so the server
 * component (`NextAdminPage`) and any other reader share one
 * interpretation of the stored values.
 *
 * @param props.cookies - The request's cookie jar.
 * @returns `{ density }` — `density` falls back to `"comfortable"` when the
 *   cookie is absent or holds anything other than `"comfortable"`/`"compact"`.
 */
export function parseListPreferences(props: { cookies: ListPreferenceCookieReader }): ListPreferences {
  const rawDensity = props.cookies.get(LIST_PREFERENCE_COOKIES.density)?.value;
  const density: ListDensity = rawDensity === "compact" ? "compact" : "comfortable";
  return { density };
}
```

#### packages/core/src/collections/listPreferenceCookies.test.ts

```ts
import { describe, expect, it } from "vitest";
import { LIST_PREFERENCE_COOKIES, parseListPreferences } from "./listPreferenceCookies";

function cookieJar(entries: Record<string, string>) {
  return { get: (name: string) => (name in entries ? { value: entries[name] } : undefined) };
}

describe("parseListPreferences", () => {
  it("defaults density to comfortable with no cookie", () => {
    expect(parseListPreferences({ cookies: cookieJar({}) })).toEqual({ density: "comfortable" });
  });

  it("reads an explicit compact cookie", () => {
    expect(
      parseListPreferences({ cookies: cookieJar({ [LIST_PREFERENCE_COOKIES.density]: "compact" }) }),
    ).toEqual({ density: "compact" });
  });

  it("falls back to comfortable for an unrecognized value", () => {
    expect(
      parseListPreferences({ cookies: cookieJar({ [LIST_PREFERENCE_COOKIES.density]: "roomy" }) }),
    ).toEqual({ density: "comfortable" });
  });
});
```

#### packages/core/src/framework.ts

2 edits — everything else in the file is unchanged.

**1 — import.** Anchor: the existing `import { PaginationResult } from "./db/types";` line.

```ts
import type { ListPreferences } from "./collections/listPreferenceCookies";
```

**2 — `CollectionListViewProps`, add `initialPreferences`.** Anchor: the `initialData?: PaginationResult<TDoc>;` member.

```ts
  /**
   * Layout-affecting list preferences resolved server-side from cookies
   * (`parseListPreferences`, Decision 42) — density today, extended by
   * later steps. Seeds `CollectionListView`'s own state so the row height
   * the server rendered and the client's first paint agree. Omit when
   * rendering client-side only (falls back to `"comfortable"`).
   */
  initialPreferences?: ListPreferences;
```

#### packages/react/src/collections/listView/useListUrlState.ts

```tsx
"use client";

import { useCallback, useMemo } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import {
  parseListParams,
  serializeListParams,
  type CollectionConfig,
  type ListParams,
  type ListSort,
  type VexWhereNode,
} from "@vexcms/core";

/** Per-setter history override — every setter has a Decision-9-driven default; pass `{ push: true }` to force a history entry (e.g. Enter in search) or `{ push: false }` to force a silent replace. */
export interface ListUrlSetOptions {
  push?: boolean;
}

/** Setters mirroring {@link ListParams}'s fields. */
export interface UseListUrlStateReturn<TFieldSlug extends string = string>
  extends ListParams<TFieldSlug> {
  setQ: (q: string, options?: ListUrlSetOptions) => void;
  setQf: (qf: TFieldSlug | undefined, options?: ListUrlSetOptions) => void;
  setSort: (
    sort: ListSort<TFieldSlug> | undefined,
    options?: ListUrlSetOptions,
  ) => void;
  setFilter: (
    filter: VexWhereNode<TFieldSlug> | undefined,
    options?: ListUrlSetOptions,
  ) => void;
  setSize: (size: number | undefined, options?: ListUrlSetOptions) => void;
  setView: (view: string | undefined, options?: ListUrlSetOptions) => void;
  setPeek: (peek: string | undefined, options?: ListUrlSetOptions) => void;
}

/** Every list URL key stored as its literal raw string (or `null`) — `@vexcms/core`'s `listUrlParams.ts` owns all validation/typing, this layer is nuqs plumbing only. */
const RAW_PARSERS = {
  q: parseAsString,
  qf: parseAsString,
  sort: parseAsString,
  filter: parseAsString,
  size: parseAsString,
  view: parseAsString,
  peek: parseAsString,
};

/**
 * Drives the collection list view's shareable URL state via `nuqs`, using
 * `@vexcms/core`'s {@link parseListParams}/{@link serializeListParams}
 * for the compact grammar (Decision 9). The codec itself lives in core
 * (Decision 40) so `NextAdminPage` (Step 14) parses the exact same params
 * server-side, with no react/nuqs dependency to drag along — this hook is
 * nothing more than a `nuqs` binding over it.
 *
 * @param props - Input props.
 * @param props.collection - Constrains `qf`/`sort.field`/`size` and
 *   resolves `filter`'s field types.
 * @returns The parsed state plus setters.
 *
 * @example
 * ```tsx
 * const url = useListUrlState({ collection });
 * useVexListQuery({
 *   collection: collection.slug,
 *   where: url.filter,
 *   sort: url.q === "" ? url.sort : undefined, // Decision 7: parked while searching
 *   search: url.q,
 *   searchField: url.qf,
 *   pageSize: url.size,
 * });
 * ```
 */
export function useListUrlState<TFieldSlug extends string = string>(props: {
  collection: CollectionConfig;
}): UseListUrlStateReturn<TFieldSlug> {
  // TODO: implement
  // 1. `const [raw, setRaw] = useQueryStates(RAW_PARSERS)`.
  // 2. `searchParams = useMemo(() => new URLSearchParams(Object.entries(raw)
  //    .filter((entry): entry is [string, string] => entry[1] !== null)),
  //    [raw])`.
  // 3. `params = useMemo(() => parseListParams<TFieldSlug>({
  //    searchParams, collection: props.collection }), [searchParams,
  //    props.collection])`.
  // 4. `applyPatch = useCallback((patch: Partial<ListParams<TFieldSlug>>,
  //    push: boolean) => { const next = serializeListParams({
  //    params: { ...params, ...patch } as Partial<ListParams<string>>,
  //    collection: props.collection }); const record: Record<string, string
  //    | null> = {}; for (const key of Object.keys(RAW_PARSERS)) { record[key]
  //    = next.get(key); } setRaw(record, { history: push ? "push" :
  //    "replace" }); }, [params, props.collection, setRaw])` — filling in
  //    `null` for every key `next` omits is required: nuqs only clears a key
  //    when its setter receives `null`, an omitted key in a partial object
  //    is left untouched.
  // 5. Default `push` per Decision 9 ("Typing updates the URL with replace;
  //    discrete actions push"): `setQ`/`setQf`/`setFilter` default `push:
  //    false` (continuous/live-apply typing); `setSort`/`setSize`/
  //    `setView`/`setPeek` default `push: true` (discrete). Every setter
  //    still honors `options?.push` when given, overriding its default —
  //    `ListSearch`'s Enter handler calls `setQ(value, { push:
  //    true })` (DESIGN-NOTES.md §3: "Enter commits immediately … and
  //    pushes a history entry").
  // 6. `setQ`'s body additionally clears `qf` back to `undefined` whenever
  //    the new `q` is `""` — a `qf` with no active query is stale UI state
  //    (carried over from the pre-redesign `setSearch("")` rule).
  // 7. Build each `useCallback`-wrapped setter calling `applyPatch({ <key>:
  //    value }, options?.push ?? <default from step 5>)`.
  // 8. → return `{ ...params, setQ, setQf, setSort, setFilter, setSize,
  //    setView, setPeek }`.
  // Edge cases:
  // - Several setters called synchronously in the same event handler (Step
  //   12 applying a whole saved view across `setSort`/`setFilter`/
  //   `setView`/`setSize`) batch into ONE URL update — every setter calls
  //   the same `setRaw` closure, and nuqs coalesces same-tick calls into a
  //   single history entry, so no separate bulk `setState` is needed.
  // - `searchParams`/`params` are recomputed from `raw` every render; this
  //   hook holds no state beyond nuqs'.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/useListUrlState.test.tsx

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { defineCollection, number, text } from "@vexcms/core";
import { useListUrlState } from "./useListUrlState";

const collection = defineCollection({
  slug: "url_state_test",
  fields: {
    title: text({ required: false }),
    rating: number({ required: false }),
  },
  admin: {
    table: {
      searchField: ["title"],
      pageSizeOptions: [10, 25, 50],
      defaultPageSize: 10,
    },
  },
});

function renderUrlState(searchParams?: string) {
  return renderHook(() => useListUrlState({ collection }), {
    wrapper: withNuqsTestingAdapter({ searchParams, hasMemory: true }),
  });
}

describe("useListUrlState", () => {
  it("defaults every field when the URL carries no list params", () => {
    const { result } = renderUrlState();
    expect(result.current.q).toBe("");
    expect(result.current.qf).toBeUndefined();
    expect(result.current.sort).toBeUndefined();
    expect(result.current.filter).toBeUndefined();
    expect(result.current.size).toBeUndefined();
    expect(result.current.view).toBeUndefined();
    expect(result.current.peek).toBeUndefined();
  });

  it("parses existing params", () => {
    const { result } = renderUrlState("?q=hello&sort=rating.desc&size=25");
    expect(result.current.q).toBe("hello");
    expect(result.current.sort).toEqual({ field: "rating", order: "desc" });
    expect(result.current.size).toBe(25);
  });

  it("setQ('') also clears qf", () => {
    const { result } = renderUrlState("?q=hello&qf=rating");
    act(() => result.current.setQ(""));
    expect(result.current.q).toBe("");
    expect(result.current.qf).toBeUndefined();
  });

  it("setSort writes the field.order grammar", () => {
    const { result } = renderUrlState();
    act(() => result.current.setSort({ field: "rating", order: "asc" }));
    expect(result.current.sort).toEqual({ field: "rating", order: "asc" });
  });

  it("setFilter writes a leaf and setFilter(undefined) clears it", () => {
    const { result } = renderUrlState();
    act(() => result.current.setFilter({ field: "rating", op: "gte", value: 4 }));
    expect(result.current.filter).toEqual({ field: "rating", op: "gte", value: 4 });
    act(() => result.current.setFilter(undefined));
    expect(result.current.filter).toBeUndefined();
  });

  it("setSize to the default omits it from the URL but still reads back as the default", () => {
    const { result } = renderUrlState("?size=25");
    act(() => result.current.setSize(10));
    expect(result.current.size).toBeUndefined();
  });

  it("setPeek and setView round-trip", () => {
    const { result } = renderUrlState();
    act(() => result.current.setView("shared:5star"));
    act(() => result.current.setPeek("doc123"));
    expect(result.current.view).toBe("shared:5star");
    expect(result.current.peek).toBe("doc123");
  });

  it("several setter calls in one handler land in a single state update", () => {
    const { result } = renderUrlState();
    act(() => {
      result.current.setSort({ field: "rating", order: "desc" });
      result.current.setSize(25);
    });
    expect(result.current.sort).toEqual({ field: "rating", order: "desc" });
    expect(result.current.size).toBe(25);
  });
});
```

#### packages/react/src/collections/listView/listPreferenceCookies.ts

```ts
"use client";

import { LIST_PREFERENCE_COOKIES, type ListDensity } from "@vexcms/core";

/**
 * Writes the list density cookie client-side, so the next server render
 * (`NextAdminPage` → `parseListPreferences`, Step 14) seeds
 * `CollectionListView` with the new value instead of flashing back to
 * `"comfortable"`. Guarded the way `useLivePreviewPanelState.ts`'s own
 * `writePreferenceCookie` is — losing a UI preference is not worth
 * crashing the view.
 *
 * @param props.density - The new density to persist.
 */
export function writeListDensityCookie(props: { density: ListDensity }): void {
  try {
    const oneYearInSeconds = 60 * 60 * 24 * 365;
    document.cookie = `${LIST_PREFERENCE_COOKIES.density}=${props.density}; path=/; max-age=${oneYearInSeconds}; samesite=lax`;
  } catch {
    // document.cookie can throw under Safari private mode / strict cookie settings.
  }
}
```

#### packages/react/src/collections/listView/listPreferenceCookies.test.ts

```ts
import { afterEach, describe, expect, it } from "vitest";
import { LIST_PREFERENCE_COOKIES } from "@vexcms/core";
import { writeListDensityCookie } from "./listPreferenceCookies";

afterEach(() => {
  document.cookie = `${LIST_PREFERENCE_COOKIES.density}=; path=/; max-age=0`;
});

describe("writeListDensityCookie", () => {
  it("writes the density cookie under the shared core-defined name", () => {
    writeListDensityCookie({ density: "compact" });
    expect(document.cookie).toContain(`${LIST_PREFERENCE_COOKIES.density}=compact`);
  });

  it("overwrites a previously written value", () => {
    writeListDensityCookie({ density: "compact" });
    writeListDensityCookie({ density: "comfortable" });
    expect(document.cookie).toContain(`${LIST_PREFERENCE_COOKIES.density}=comfortable`);
    expect(document.cookie).not.toContain(`${LIST_PREFERENCE_COOKIES.density}=compact`);
  });
});
```

#### packages/react/src/collections/listView/ListSearch.tsx

```tsx
"use client";

import { useRef } from "react";
import { useDebounceValue } from "@ts-hooks-kit/core";
import { CRUD_ACTIONS, PERMISSION_SCOPES, isFieldAllowed, type CollectionConfig } from "@vexcms/core";
import { useFieldPermissions } from "../../access";
import type { ListUrlSetOptions } from "./useListUrlState";

/**
 * Props for {@link ListSearch}.
 *
 * @typeParam TFieldSlug - The collection's field slugs, matched against
 *   `collection.admin.table.searchField`.
 */
export interface ListSearchProps<TFieldSlug extends string = string> {
  /** The collection whose `admin.table.searchField` drives the field picker; the control renders nothing when the READABLE subset of that list is empty (Decision 2 + Decision 26). */
  collection: CollectionConfig;
  /** The current search text — mirrors `useListUrlState`'s `q`. */
  q: string;
  /** The current search field — `undefined` defaults to the first readable entry. */
  qf: TFieldSlug | undefined;
  /** Called with the debounced search text as the user types (`push: false`), or immediately with `push: true` on Enter. */
  onQChange: (q: string, options?: ListUrlSetOptions) => void;
  /** Called immediately when the field picker's selection changes — a discrete choice, no debounce. */
  onQfChange: (qf: TFieldSlug) => void;
}

/**
 * Debounced search input paired with a field picker, for a collection
 * list's toolbar. Never collapses (Decision 22) — `ListToolbar` always
 * renders it inline.
 *
 * Renders `null` when no entry in `collection.admin.table.searchField` is
 * readable by the current caller (Decision 2 + Decision 26's "the client
 * hides unreadable fields from … the search field picker"). While search is
 * active, sort headers elsewhere in the list disable themselves
 * (`DataTableSortHeader`'s `disabled` prop) — this component only owns the
 * input and field choice, not that coordination.
 *
 * @param props - Component props. See {@link ListSearchProps}.
 * @returns The search control, or `null` when no readable search field exists.
 */
export function ListSearch<TFieldSlug extends string = string>(
  props: ListSearchProps<TFieldSlug>,
) {
  const fieldPermissions = useFieldPermissions({
    resource: props.collection.slug,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // TODO: implement
  // 1. `readableFields = (props.collection.admin.table.searchField as
  //    readonly TFieldSlug[]).filter((f) => isFieldAllowed(fieldPermissions,
  //    f))` → `.length === 0` → return `null`.
  // 2. Local `useState` mirrors `props.q` for instant keystroke feedback;
  //    `useDebounceValue(localValue, 250)` (DESIGN-NOTES.md §3: "Debounce:
  //    250ms") drives a `useEffect` that calls `props.onQChange(debounced)`
  //    (default `replace`) only when the debounced value differs from
  //    `props.q` — avoids a loop when `props.q` changes externally (a saved
  //    view, browser back/forward).
  // 3. Render an `InputGroup` with a `Search` icon addon and an
  //    `InputGroupInput` (`ref={inputRef}`) bound to the local value; when
  //    `readableFields.length > 1`, append a `Select` listing
  //    `readableFields` in config order, value `props.qf ??
  //    readableFields[0]`, calling `props.onQfChange` on
  //    `onValueChange` directly (no debounce).
  // 4. `onKeyDown`:
  //    a. `Enter` → flush the debounce control's pending value immediately
  //       (`[debounced, setDebounced] = useDebounceValue(...)`'s returned
  //       setter has a `.flush()` method) and call
  //       `props.onQChange(localValue, { push: true })` — commits
  //       immediately, skipping the 250ms wait, and pushes a history entry
  //       (DESIGN-NOTES.md §3).
  //    b. `Escape` with non-empty `localValue` → clear it
  //       (`setLocalValue(""); props.onQChange("")`).
  //    c. `Escape` with empty `localValue` → `inputRef.current?.blur()`.
  // Edge cases:
  // - A single-entry `readableFields` list renders the input alone, no
  //   `Select`, with the field name as the placeholder (DESIGN-NOTES.md §2:
  //   "single field (no picker, label as placeholder)").
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListSearch.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "@vexcms/core";
import { ListSearch } from "./ListSearch";

const baseFields = {
  title: text({ required: false }),
  body: text({ required: false }),
};

describe("ListSearch", () => {
  it("renders nothing when the collection has no searchField", () => {
    const collection = defineCollection({ slug: "search_test_none", fields: baseFields });
    const { container } = render(
      <ListSearch
        collection={collection}
        q=""
        qf={undefined}
        onQChange={vi.fn()}
        onQfChange={vi.fn()}
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
      <ListSearch
        collection={collection}
        q=""
        qf="title"
        onQChange={vi.fn()}
        onQfChange={vi.fn()}
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
      <ListSearch
        collection={collection}
        q=""
        qf="title"
        onQChange={vi.fn()}
        onQfChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("debounces onQChange 250ms after typing, with push defaulting falsy", async () => {
    const collection = defineCollection({
      slug: "search_test_debounce",
      fields: baseFields,
      admin: { table: { searchField: ["title"] } },
    });
    const onQChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListSearch
        collection={collection}
        q=""
        qf="title"
        onQChange={onQChange}
        onQfChange={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("textbox"), "hello");
    expect(onQChange).not.toHaveBeenCalled();
    await waitFor(() => expect(onQChange).toHaveBeenCalledWith("hello"), { timeout: 600 });
  });

  it("Enter commits immediately and pushes", async () => {
    const collection = defineCollection({
      slug: "search_test_enter",
      fields: baseFields,
      admin: { table: { searchField: ["title"] } },
    });
    const onQChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListSearch
        collection={collection}
        q=""
        qf="title"
        onQChange={onQChange}
        onQfChange={vi.fn()}
      />,
    );
    await user.type(screen.getByRole("textbox"), "hello{Enter}");
    expect(onQChange).toHaveBeenCalledWith("hello", { push: true });
  });

  it("Escape with text clears the query", async () => {
    const collection = defineCollection({
      slug: "search_test_escape",
      fields: baseFields,
      admin: { table: { searchField: ["title"] } },
    });
    const onQChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListSearch
        collection={collection}
        q="hello"
        qf="title"
        onQChange={onQChange}
        onQfChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("textbox"));
    await user.keyboard("{Escape}");
    expect(onQChange).toHaveBeenCalledWith("");
  });

  it("calls onQfChange immediately on field selection, no debounce", async () => {
    const collection = defineCollection({
      slug: "search_test_field_change",
      fields: baseFields,
      admin: { table: { searchField: ["title", "body"] } },
    });
    const onQfChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListSearch
        collection={collection}
        q="hello"
        qf="title"
        onQChange={vi.fn()}
        onQfChange={onQfChange}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "body" }));
    expect(onQfChange).toHaveBeenCalledWith("body");
  });
});
```

#### packages/react/src/ui/data-table/DataTableSortHeader.tsx

```tsx
"use client";

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
  sort: { field: TFieldSlug | "_creationTime"; order: "asc" | "desc" } | undefined;
  /** Called with the next sort state on click — `undefined` clears back to `defaultSort`. */
  onSortChange: (sort: { field: TFieldSlug | "_creationTime"; order: "asc" | "desc" } | undefined) => void;
  /** Whether this field has `admin.enableSorting: true` and an index leading with it (Decision 6). A `false` value renders plain, unclickable text. Because `DataTable`'s caller (`CollectionListView`) already drops unreadable fields from `columns` entirely, a header only ever reaches this component for a readable field — no separate read-access prop is needed here (Decision 26). */
  enableSorting: boolean;
  /** `true` while a search is active — sort is disabled and shows "Sorted by relevance" (Decision 7). */
  disabled?: boolean;
}

/**
 * A clickable TanStack Table column header that cycles a field's sort state:
 * unsorted → `asc` → `desc` → unsorted (clears `sort`, falling back to
 * `defaultSort`).
 *
 * Renders as plain, unclickable text when `enableSorting` is `false` (the
 * field has no leading index, Decision 6) or `disabled` is `true` (a search
 * is active, Decision 7 — parked sort, shown with a "Sorted by relevance"
 * tooltip).
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
  // 5. Wrap the header (both the plain-text and button branches) in a
  //    `Tooltip` that shows after 600ms: `"${label.toLowerCase()} · ${…
  //    field type}"` (DESIGN-NOTES.md §1: "Field-type info in headers").
  //    This step's caller does not yet pass a field-type string — accept an
  //    OPTIONAL `typeHint?: string` prop and skip the tooltip body when it's
  //    absent, so wiring it from `getCollectionColumnDefs`'s field type is a
  //    later, additive change rather than blocking this step.
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

  it("renders plain text with a relevance tooltip when disabled (parked sort)", () => {
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

#### packages/react/src/ui/ScrollSection.tsx

```tsx
"use client";

import type { ComponentProps, ReactNode } from "react";

/**
 * Props for {@link ScrollSection}.
 */
export interface ScrollSectionProps extends Omit<ComponentProps<"div">, "title"> {
  /** Section header text, shown above the scroll area when provided. */
  title?: string;
  /** A trailing count badge next to `title` (e.g. the number of matching views). */
  count?: number;
  /** When `true`, the header becomes a toggle collapsing the body. */
  collapsible?: boolean;
  /** Initial collapsed state when `collapsible` and no `persistKey` (or no stored value yet) applies. @default false */
  defaultCollapsed?: boolean;
  /** `useLocalStorage` key remembering the collapsed state per browser (Decision 31's "Which groups are collapsed is remembered per browser"). Omit for session-only collapse state. */
  persistKey?: string;
  /** Fixed height — the section always takes this much space. Mutually exclusive with `maxHeight`. */
  height?: string | number;
  /** Maximum height before the internal `ScrollArea` kicks in — the section shrinks to fit shorter content. Mutually exclusive with `height`. */
  maxHeight?: string | number;
  children: ReactNode;
}

/**
 * A thin, prop-driven wrapper around `ScrollArea` for every fixed/max-height
 * scroll container in the admin panel (Decision 31): the views menu, the
 * columns menu, the filter builder, the Inspect peek, and relationship/
 * media pickers. Composes `ScrollArea` with an optional collapsible header
 * instead of introducing a new primitive.
 *
 * @param props - Component props. See {@link ScrollSectionProps}.
 * @returns The section, or just its (possibly collapsed) body when `title` is omitted.
 */
export function ScrollSection(props: ScrollSectionProps) {
  const {
    title,
    count,
    collapsible,
    defaultCollapsed = false,
    persistKey,
    height,
    maxHeight,
    children,
    className,
    ...divProps
  } = props;
  // TODO: implement
  // 1. Collapsed state: `persistKey` set → `useLocalStorage(persistKey,
  //    defaultCollapsed)`; else plain `useState(defaultCollapsed)`. Only
  //    read/used when `collapsible` is `true`.
  // 2. `title` present → render a header row: `<button>` (when
  //    `collapsible`, toggling the state from step 1, with a chevron icon
  //    reflecting collapsed/expanded) or a plain `<div>` (when not
  //    collapsible), containing `title` plus a `Badge variant="secondary"`
  //    for `count` when it's a number.
  // 3. Body: `collapsible && collapsed` → render nothing below the header;
  //    else render `<ScrollArea style={{ height, maxHeight }}
  //    className={cn("min-h-0", className)} {...divProps}>{children}</ScrollArea>`.
  // Edge cases:
  // - `height` and `maxHeight` both omitted → `ScrollArea` just fills its
  //   flex parent (`flex-1 min-h-0` is the CALLER's job, e.g.
  //   `DataTable`'s own body, which composes `ScrollArea` directly rather
  //   than through this wrapper — `ScrollSection` is for the smaller,
  //   explicitly-bounded containers listed above).
  throw new Error("Not implemented");
}
```

#### packages/react/src/ui/ScrollSection.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ScrollSection } from "./ScrollSection";

describe("ScrollSection", () => {
  it("renders children without a header when title is omitted", () => {
    render(
      <ScrollSection>
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders a title and count badge", () => {
    render(
      <ScrollSection title="Shared" count={12}>
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.getByText("Shared")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("collapses and expands the body on header click when collapsible", async () => {
    const user = userEvent.setup();
    render(
      <ScrollSection title="Shared" collapsible>
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.getByText("Body")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /shared/i }));
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /shared/i }));
    expect(screen.getByText("Body")).toBeVisible();
  });

  it("starts collapsed when defaultCollapsed is true", () => {
    render(
      <ScrollSection title="Shared" collapsible defaultCollapsed>
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("remembers collapsed state per persistKey across remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ScrollSection title="Shared" collapsible persistKey="scroll-section-test">
        <div>Body</div>
      </ScrollSection>,
    );
    await user.click(screen.getByRole("button", { name: /shared/i }));
    unmount();

    render(
      <ScrollSection title="Shared" collapsible persistKey="scroll-section-test">
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
    window.localStorage.removeItem("scroll-section-test");
  });
});
```

#### packages/react/src/ui/data-table/DataTableColumnsMenu.tsx

```tsx
"use client";

import type { ListDensity } from "@vexcms/core";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Button } from "../button";
import { Icon } from "../Icon";
import { ScrollSection } from "../ScrollSection";

/**
 * One hideable column, as resolved from a collection's ALREADY
 * read-access-filtered columns (Decision 26 — see `CollectionListView`'s
 * `hideableColumns` memo, which is this prop's source) for
 * {@link DataTableColumnsMenu}.
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
  /** Every hideable, readable column (`admin.enableHiding: true`, not `admin.hidden`, and not already dropped for unreadable access), in field order. */
  columns: DataTableColumn<TFieldSlug>[];
  /** Currently visible column fields. */
  visibleColumns: TFieldSlug[];
  /** Replaces the visible-columns array. */
  onVisibleColumnsChange: (columns: TFieldSlug[]) => void;
  /** Whether a saved view is currently active — when `false`, a session-only notice is shown (Decision 15). */
  hasActiveView?: boolean;
  /** The current density preference — owned by `CollectionListView`/`useCollectionList()`, cookie-backed (Decision 42), never this component's own state. */
  density: ListDensity;
  /** Replaces the density preference; the caller both updates its own state and writes the `vex-list-density` cookie (`writeListDensityCookie`) so the next server render matches with no flash. */
  onDensityChange: (density: ListDensity) => void;
}

/**
 * A dropdown of checkboxes toggling which `enableHiding` columns are
 * visible in the list table, plus a Density toggle (Decision 29).
 *
 * Column visibility AND density are both purely controlled — Decision 42
 * puts density in a cookie read on the server
 * (`parseListPreferences`) and owned by `CollectionListView`, the same
 * split live preview's panel-open state already uses
 * (`readLivePreviewPanelCookie`/`writeLivePreviewPanelCookie`) — a
 * component-local store can't be read before hydration, so the density the
 * server rendered and the density the client mounts with could otherwise
 * differ for one frame.
 *
 * The trigger's "Columns" label hides itself below `@xl/list`
 * (Decision 43) via a plain CSS class on its own `<span>` — there is no
 * `collapsed` prop or caller-supplied boolean; the control is always a
 * single mounted instance that narrows itself, rather than being measured
 * and swapped by `ListToolbar`.
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
  //    with a `Columns3` icon (`Icon` from `../Icon`) followed by `<span
  //    className="hidden @xl/list:inline">Columns</span>` (Decision 43 —
  //    the label disappears once the `@container/list` ancestor narrows
  //    past `@xl/list`; the icon alone keeps the trigger's accessible name
  //    via its own `aria-label`, same convention as every other icon
  //    button in `ui/`).
  // 3. `DropdownMenuContent`:
  //    a. `props.hasActiveView === false` → a muted notice line: "Column
  //       changes last until you close this tab. Save a view to keep them."
  //       (DESIGN-NOTES.md §5).
  //    b. `<ScrollSection maxHeight={240}>` wrapping one
  //       `DropdownMenuCheckboxItem` per `props.columns` entry, `checked`
  //       from `props.visibleColumns.includes(column.field)`
  //       (DEV-AGENT-BRIEF.md §A "11 · Columns menu": fixed-height scroll
  //       area for the field list).
  //    c. `onCheckedChange(checked)`:
  //       - `checked === false` and `props.visibleColumns.length === 1` and
  //         it's the last visible one → no-op (ignore the toggle).
  //       - otherwise add/remove `column.field` from
  //         `props.visibleColumns` and call `props.onVisibleColumnsChange`
  //         with the result.
  //    d. `DropdownMenuSeparator`, then `DropdownMenuLabel`("Density")
  //       followed by `DropdownMenuRadioGroup value={props.density}
  //       onValueChange={(v) => props.onDensityChange(v as ListDensity)}`
  //       containing two `DropdownMenuRadioItem`s, `"comfortable"` labeled
  //       "Comfortable" and `"compact"` labeled "Compact".
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
      <DataTableColumnsMenu
        columns={[]}
        visibleColumns={[]}
        onVisibleColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
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
        density="comfortable"
        onDensityChange={vi.fn()}
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
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /columns/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Body" }));
    expect(onVisibleColumnsChange).toHaveBeenCalledWith(["title", "body"]);
  });

  it("unchecking the sole remaining visible column is a no-op", async () => {
    const onVisibleColumnsChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTableColumnsMenu
        columns={columns}
        visibleColumns={["title"]}
        onVisibleColumnsChange={onVisibleColumnsChange}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /columns/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Title" }));
    expect(onVisibleColumnsChange).not.toHaveBeenCalled();
  });

  it("shows the session-only notice when no view is active", async () => {
    const user = userEvent.setup();
    render(
      <DataTableColumnsMenu
        columns={columns}
        visibleColumns={["title"]}
        onVisibleColumnsChange={vi.fn()}
        hasActiveView={false}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /columns/i }));
    expect(screen.getByText(/save a view to keep them/i)).toBeInTheDocument();
  });

  it("reflects the controlled density prop and calls onDensityChange on toggle — never touches localStorage", async () => {
    const onDensityChange = vi.fn();
    const user = userEvent.setup();
    render(
      <DataTableColumnsMenu
        columns={columns}
        visibleColumns={["title"]}
        onVisibleColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={onDensityChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: /columns/i }));
    expect(screen.getByRole("menuitemradio", { name: "Comfortable" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await user.click(screen.getByRole("menuitemradio", { name: "Compact" }));
    expect(onDensityChange).toHaveBeenCalledWith("compact");
  });

  it("always renders the 'Columns' label in the DOM — the @xl/list collapse is a CSS class, not a conditional render", () => {
    render(
      <DataTableColumnsMenu
        columns={columns}
        visibleColumns={["title"]}
        onVisibleColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Columns")).toBeInTheDocument();
  });
});
```

#### packages/react/src/collections/listView/listBuiltinContributions.ts

1 edit — everything else (Step 9's `LIST_BUILTIN_ORDER`, `listHeaderActionsBuiltins`, `listRowActionsBuiltins`, `listBulkActionsBuiltins`) unchanged.

**1 — new `listToolbarContributions` export, plus its imports.** Add `ListSearchAction`/`ListColumnsAction` to the existing component imports, and append after `listHeaderActionsBuiltins`:

```ts
import { ListSearchAction } from "./ListSearchAction";
import { ListColumnsAction } from "./ListColumnsAction";
```

```ts
/** `list.toolbar`'s built-in contributions — `vex.list.search` then `vex.list.columns`, in that order; `ListToolbar` (this step) resolves the rest of the row (Copy link, Rows-per-load, bulk group) itself, outside this slot. */
export function listToolbarContributions(): ComponentContributionInput<ReactHKT, Record<string, never>>[] {
  return [
    { id: BUILTIN_CONTRIBUTION_IDS.list.search, component: ListSearchAction },
    { id: BUILTIN_CONTRIBUTION_IDS.list.columns, component: ListColumnsAction },
  ];
}
```

#### packages/react/src/collections/listView/ListSearchAction.tsx

New file — the `vex.list.search` built-in (Decision 17/37), a thin wrapper that reads `collection`/`urlState` from `useCollectionList()` (this step's context extension) and forwards them to the presentational `ListSearch` above. Registered into `list.toolbar` via `listToolbarContributions()` below, alongside `vex.list.columns`.

```tsx
"use client";

import { useCollectionList } from "./CollectionListContext";
import { ListSearch } from "./ListSearch";

/**
 * The `vex.list.search` built-in — renders {@link ListSearch} wired to the
 * active list's `collection` and `urlState` (`q`/`qf`/`setQ`/`setQf`) from
 * `useCollectionList()`, so it never takes props of its own (mirrors every
 * other `list.*` built-in, Decision 37).
 *
 * @returns {@link ListSearch}, or `null` when no `searchField` entry is
 *   readable (handled inside `ListSearch` itself).
 */
export function ListSearchAction() {
  const list = useCollectionList();
  return (
    <ListSearch
      collection={list.collection}
      q={list.urlState.q}
      qf={list.urlState.qf}
      onQChange={list.urlState.setQ}
      onQfChange={list.urlState.setQf}
    />
  );
}
```

#### packages/react/src/collections/listView/ListColumnsAction.tsx

New file — the `vex.list.columns` built-in. Forwards `density`/`onDensityChange` from `useCollectionList()` (Decision 42) — no `collapsed` prop; `DataTableColumnsMenu`'s "Columns" label narrows itself via CSS at `@xl/list` (Decision 43), so there is nothing for this wrapper to measure or thread through.

```tsx
"use client";

import { useCollectionList } from "./CollectionListContext";
import { DataTableColumnsMenu } from "../../ui/data-table/DataTableColumnsMenu";

/**
 * The `vex.list.columns` built-in — renders {@link DataTableColumnsMenu}
 * wired to `useCollectionList()`'s `hideableColumns`/`visibleColumns`/
 * `onVisibleColumnsChange`/`hasActiveView`/`density`/`onDensityChange`.
 * Takes no props: every other `list.*` built-in follows the same shape
 * (Decision 37).
 *
 * @returns {@link DataTableColumnsMenu}, or `null` when the collection has
 *   no hideable columns (handled inside `DataTableColumnsMenu`).
 */
export function ListColumnsAction() {
  const list = useCollectionList();
  return (
    <DataTableColumnsMenu
      columns={list.hideableColumns}
      visibleColumns={list.visibleColumns}
      onVisibleColumnsChange={list.onVisibleColumnsChange}
      hasActiveView={list.hasActiveView}
      density={list.density}
      onDensityChange={list.onDensityChange}
    />
  );
}
```

#### packages/react/src/collections/listView/ListSearchAction.test.tsx

New file.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListSearchAction } from "./ListSearchAction";
import { CollectionListProvider } from "./CollectionListContext";
import { defineCollection, text } from "@vexcms/core";

const collection = defineCollection({ slug: "posts", fields: { title: text() } }) as never;

describe("ListSearchAction", () => {
  it("renders ListSearch wired to the list context's collection and urlState", () => {
    render(
      <CollectionListProvider
        value={{
          collection,
          urlState: { q: "hello", qf: undefined, setQ: () => {}, setQf: () => {} } as never,
          selection: { selectedIds: [], selectedDocs: [], setSelectedIds: () => {}, canDelete: false },
          density: "comfortable",
          onDensityChange: () => {},
          visibleColumns: [],
          onVisibleColumnsChange: () => {},
          hideableColumns: [],
          hasActiveView: false,
        }}
      >
        <ListSearchAction />
      </CollectionListProvider>,
    );
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });
});
```

#### packages/react/src/collections/listView/ListColumnsAction.test.tsx

New file.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListColumnsAction } from "./ListColumnsAction";
import { CollectionListProvider } from "./CollectionListContext";
import { defineCollection, text } from "@vexcms/core";

const collection = defineCollection({ slug: "posts", fields: { title: text() } }) as never;

describe("ListColumnsAction", () => {
  it("renders DataTableColumnsMenu wired to the list context's hideableColumns/density — no collapsed prop", () => {
    render(
      <CollectionListProvider
        value={{
          collection,
          urlState: { q: "", qf: undefined, setQ: () => {}, setQf: () => {} } as never,
          selection: { selectedIds: [], selectedDocs: [], setSelectedIds: () => {}, canDelete: false },
          density: "comfortable",
          onDensityChange: () => {},
          visibleColumns: ["status"],
          onVisibleColumnsChange: () => {},
          hideableColumns: [{ field: "status", label: "Status" }],
          hasActiveView: false,
        }}
      >
        <ListColumnsAction />
      </CollectionListProvider>,
    );
    expect(screen.getByRole("button", { name: /columns/i })).toBeInTheDocument();
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
  /** Called with the newly selected page size. Decision 8: this resets the list to the first page at the new size — the caller (`useVexListQuery`, Step 8), not this component, owns that reset. */
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * A `Select` choosing the list's page size from
 * `collection.admin.table.pageSizeOptions`, labelled "Rows per load"
 * (DESIGN-NOTES.md §5).
 *
 * Pagination itself stays cursor Load More (Decision 8) — this control only
 * changes how many items the NEXT fetch/`loadMore()` call requests; it
 * never jumps to a numbered page. Rendered by `ListToolbar`, in its
 * collapsible group alongside Copy link (Decision 22 — not `DataTable`'s
 * own footer, which only shows the Load More button and the capped-count
 * status line). It has no `vex.list.*` id (Decision 17 never names one),
 * so it bypasses the slot system either way.
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
  // 3. `SelectTrigger` carries the accessible name "Rows per load" for the
  //    combobox; one `SelectItem` per `props.pageSizeOptions` entry, value
  //    `String(n)`, label `"${n} per load"`.
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
    expect(screen.getByText("25 per load")).toBeInTheDocument();
  });

  it("is labelled Rows per load", () => {
    render(
      <DataTablePageSizeSelect
        pageSize={25}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Rows per load" })).toBeInTheDocument();
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
    await user.click(screen.getByRole("option", { name: "50 per load" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(50);
  });
});
```

#### packages/react/src/collections/listView/ListEmptyState.tsx

```tsx
"use client";

import type { ReactNode } from "react";

/** Which empty-state copy to show (DESIGN-NOTES.md §5). */
export type ListEmptyStateVariant = "empty" | "noSearchResults" | "noFilterResults";

/** Props for {@link ListEmptyState}. */
export interface ListEmptyStateProps {
  variant: ListEmptyStateVariant;
  /** Lowercase plural label, e.g. `"testimonials"`. */
  collectionLabelPlural: string;
  /** Lowercase singular label, e.g. `"testimonial"`. Used only by `"empty"`. */
  collectionLabelSingular: string;
  /** `"empty"` only — gates the "Create {singular}" button. */
  canCreate?: boolean;
  onCreate?: () => void;
  /** `"empty"` only — the guide link ("Read the docs"); omitted renders no button (wired by Step 17 once the real guide path exists). */
  docsHref?: string;
  /** `"noSearchResults"` only — the active query text, shown verbatim in the heading. */
  searchQuery?: string;
  /** `"noSearchResults"` only — the field currently searched. */
  searchFieldLabel?: string;
  /** `"noSearchResults"` only — another declared, readable search field to offer, when one exists. */
  otherSearchFieldLabel?: string;
  onSearchOtherField?: () => void;
  onClearSearch?: () => void;
  /** `"noFilterResults"` only. */
  onEditFilters?: () => void;
  onClearFilters?: () => void;
}

/**
 * The collection list's three empty-state variants (DESIGN-NOTES.md §5),
 * rendered by `DataTable` in place of the table body when there are zero
 * rows and the query is done loading (`isDone`).
 *
 * @param props - Component props. See {@link ListEmptyStateProps}.
 * @returns A centered heading/description/button-row block.
 */
export function ListEmptyState(props: ListEmptyStateProps): ReactNode {
  // TODO: implement
  // Common shell: a centered `flex flex-col items-center gap-2 py-12
  // text-center` block — heading (`<h3 className="font-medium">`),
  // description (`<p className="text-sm text-muted-foreground max-w-sm">`),
  // then a `flex gap-2` button row.
  //
  // 1. `"empty"`:
  //    - Heading: `"No ${props.collectionLabelPlural} yet"`.
  //    - Description: `"${capitalize(props.collectionLabelPlural)} you
  //      create here, or send in through the API, will show up in this
  //      list."`.
  //    - Buttons: `props.docsHref` set → `Button variant="outline"
  //      render={<VexLink href={props.docsHref} />}>Read the docs</Button>`;
  //      `props.canCreate` → `Button onClick={props.onCreate}>Create
  //      ${props.collectionLabelSingular}</Button>`.
  // 2. `"noSearchResults"`:
  //    - Heading: `'No ${props.collectionLabelPlural} with "${props.searchQuery}" in ${props.searchFieldLabel}'`.
  //    - Description: "Search looks in one field at a time. The name
  //      might be in a different field."
  //    - Buttons: `props.otherSearchFieldLabel` set → `Button
  //      variant="outline" onClick={props.onSearchOtherField}>Search in
  //      ${props.otherSearchFieldLabel} instead</Button>`; always `Button
  //      onClick={props.onClearSearch}>Clear search</Button>`.
  // 3. `"noFilterResults"`:
  //    - Heading: `"No ${props.collectionLabelPlural} match all of these
  //      filters"`.
  //    - Description: 'Every condition in a group has to match. Try
  //      removing one, or add an "or" group for alternatives.'
  //    - Buttons: `Button variant="outline"
  //      onClick={props.onEditFilters}>Edit filters</Button>`, `Button
  //      onClick={props.onClearFilters}>Clear filters</Button>`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListEmptyState.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ListEmptyState } from "./ListEmptyState";

describe("ListEmptyState", () => {
  it("renders the empty-collection copy and gates Create on canCreate", () => {
    render(
      <ListEmptyState
        variant="empty"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        canCreate={false}
      />,
    );
    expect(screen.getByText("No testimonials yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create testimonial/i })).not.toBeInTheDocument();
  });

  it("shows Create when canCreate is true", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(
      <ListEmptyState
        variant="empty"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        canCreate
        onCreate={onCreate}
      />,
    );
    await user.click(screen.getByRole("button", { name: /create testimonial/i }));
    expect(onCreate).toHaveBeenCalled();
  });

  it("renders the no-search-results copy with the query and field", () => {
    render(
      <ListEmptyState
        variant="noSearchResults"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        searchQuery="ma"
        searchFieldLabel="Author name"
        onClearSearch={vi.fn()}
      />,
    );
    expect(screen.getByText('No testimonials with "ma" in Author name')).toBeInTheDocument();
  });

  it("offers the other search field only when one is given", () => {
    const { rerender } = render(
      <ListEmptyState
        variant="noSearchResults"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        searchQuery="ma"
        searchFieldLabel="Author name"
        onClearSearch={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /instead/i })).not.toBeInTheDocument();

    rerender(
      <ListEmptyState
        variant="noSearchResults"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        searchQuery="ma"
        searchFieldLabel="Author name"
        otherSearchFieldLabel="Company"
        onClearSearch={vi.fn()}
        onSearchOtherField={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /search in company instead/i })).toBeInTheDocument();
  });

  it("renders the no-filter-results copy with Edit/Clear filters", async () => {
    const onEditFilters = vi.fn();
    const onClearFilters = vi.fn();
    const user = userEvent.setup();
    render(
      <ListEmptyState
        variant="noFilterResults"
        collectionLabelPlural="testimonials"
        collectionLabelSingular="testimonial"
        onEditFilters={onEditFilters}
        onClearFilters={onClearFilters}
      />,
    );
    await user.click(screen.getByRole("button", { name: /edit filters/i }));
    expect(onEditFilters).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
```

#### packages/react/src/collections/listView/ListQueryError.tsx

```tsx
"use client";

import { VexError } from "@vexcms/core";
import type { ReactNode } from "react";

/** Props for {@link ListQueryError}. */
export interface ListQueryErrorProps {
  /** The thrown/returned error — a `VexError` whose `.data` is a structured payload with `code: "UNINDEXED_SORT"` (Step 6's `resolveQueryIndex`) switches to that variant; anything else (a plain `Error`, a `VexError` with a string `.data`, or a different `.code`) renders the generic message. */
  error: unknown;
  /** Lowercase plural label, used in the generic message ("Couldn't load {plural}"). */
  collectionLabelPlural: string;
  onRetry: () => void;
  /** The field label a stale `sort` link was pointing at — shown in the `UNINDEXED_SORT` message. Omitted falls back to the raw field key from the error. */
  sortFieldLabel?: string;
  /** Clears the offending `sort` — only relevant (and only rendered) for the `UNINDEXED_SORT` variant. */
  onRemoveSort?: () => void;
}

/**
 * The collection list's query-error states (DESIGN-NOTES.md §5): a generic
 * "Couldn't load {plural}" for any runtime failure, and a specific
 * "Can't sort by {Field} yet" for a stale link hitting Step 6's
 * `UNINDEXED_SORT` (config-time validation should make this rare, not
 * impossible — DEV-AGENT-BRIEF.md §5). Rendered by `DataTable` in place of
 * the table body.
 *
 * @param props - Component props. See {@link ListQueryErrorProps}.
 * @returns An `Alert`-based error block with a details disclosure.
 */
export function ListQueryError(props: ListQueryErrorProps): ReactNode {
  // TODO: implement
  // 1. `isVexError = props.error instanceof VexError`; `data =
  //    isVexError && typeof props.error.data === "object" && props.error.data
  //    !== null ? (props.error.data as { code?: string; message?: string })
  //    : undefined` (a `VexError` may carry a bare string `.data` instead of
  //    structured data — `ConvexError<TData>.data` is `TData`, not always an
  //    object).
  // 2. `isUnindexedSort = data?.code === "UNINDEXED_SORT"`.
  // 3. Common shell: `Alert variant="destructive"` with a heading, a
  //    description, a button row, and a `<details>` "Developer details"
  //    disclosure showing `data?.message ?? String(props.error)` (and, for
  //    a `VexError`, its `data?.code`).
  // 4. `isUnindexedSort`:
  //    - Heading: `"Can't sort by ${props.sortFieldLabel ?? "this field"} yet"`.
  //    - Description: "Sorting on this column needs a database index that
  //      doesn't exist. Remove the sort to keep browsing, or ask a
  //      developer to add the index."
  //    - Buttons: `props.onRemoveSort` set → `Button
  //      onClick={props.onRemoveSort}>Remove sort</Button>`.
  // 5. else (generic):
  //    - Heading: `"Couldn't load ${props.collectionLabelPlural}"`.
  //    - Description: "Something went wrong running this query."
  //    - Button: `Button onClick={props.onRetry}>Try again</Button>`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListQueryError.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VexError } from "@vexcms/core";
import { ListQueryError } from "./ListQueryError";

describe("ListQueryError", () => {
  it("renders the generic message and Try again for a plain error", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <ListQueryError
        error={new Error("network down")}
        collectionLabelPlural="testimonials"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Couldn't load testimonials")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders the UNINDEXED_SORT message with the field label and Remove sort", async () => {
    const onRemoveSort = vi.fn();
    const user = userEvent.setup();
    const error = new VexError({ code: "UNINDEXED_SORT", message: "rating has no leading index" });
    render(
      <ListQueryError
        error={error}
        collectionLabelPlural="testimonials"
        onRetry={vi.fn()}
        sortFieldLabel="Rating"
        onRemoveSort={onRemoveSort}
      />,
    );
    expect(screen.getByText("Can't sort by Rating yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove sort/i }));
    expect(onRemoveSort).toHaveBeenCalled();
  });

  it("falls back to the generic message for a non-UNINDEXED_SORT VexError", () => {
    const error = new VexError({ code: "SEARCH_FIELD_NOT_ALLOWED", message: "nope" });
    render(
      <ListQueryError error={error} collectionLabelPlural="testimonials" onRetry={vi.fn()} />,
    );
    expect(screen.getByText("Couldn't load testimonials")).toBeInTheDocument();
  });

  it("shows the raw error in a details disclosure", () => {
    render(
      <ListQueryError
        error={new Error("network down")}
        collectionLabelPlural="testimonials"
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/network down/)).toBeInTheDocument();
  });
});
```

#### packages/react/src/collections/listView/ListCopyLinkButton.tsx

```tsx
"use client";

import { useCopyToClipboard } from "@ts-hooks-kit/core";
import { toast } from "sonner";
import { Button } from "../../ui/button";

/** Props for {@link ListCopyLinkButton}. */
export interface ListCopyLinkButtonProps {
  /**
   * Builds the href to copy. Defaults to `window.location.href`. Step 12
   * overrides this when a local view is active, serializing the full state
   * via `serializeListParams` instead of `view=local:…`
   * (Decision 11: "when you copy a link while a local view is active,
   * serialize the full state").
   */
  buildHref?: () => string;
}

/**
 * Toolbar button copying the current (or caller-built) list URL to the
 * clipboard. No `vex.list.*` id (Decision 17 never names one) — rendered
 * directly by `ListToolbar`, like `DataTablePageSizeSelect`.
 *
 * `ListToolbar` mounts this component TWICE — once inline, once inside the
 * ⋯ overflow menu — each wrapped in a CSS class showing it on opposite
 * sides of the `@2xl/list` breakpoint (Decision 43). This component itself
 * carries no `collapsed`/icon-only mode: both locations have room for the
 * full "Copy link" label, so there is nothing to shrink.
 *
 * @param props - Component props. See {@link ListCopyLinkButtonProps}.
 * @returns A ghost button with a label.
 */
export function ListCopyLinkButton(props: ListCopyLinkButtonProps) {
  const [, copyToClipboard] = useCopyToClipboard();
  // TODO: implement
  // 1. `handleClick = async () => { const href = (props.buildHref ?? (() =>
  //    window.location.href))(); const ok = await copyToClipboard(href); if
  //    (ok) toast.success("Link copied"); else toast.error("Couldn't copy
  //    the link"); }`.
  // 2. Render `<Button variant="ghost" size="sm" icon="Link"
  //    onClick={handleClick}>Copy link</Button>`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListCopyLinkButton.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListCopyLinkButton } from "./ListCopyLinkButton";

const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });

afterEach(() => writeText.mockClear());

describe("ListCopyLinkButton", () => {
  it("copies window.location.href by default", async () => {
    const user = userEvent.setup();
    render(<ListCopyLinkButton />);
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it("copies buildHref's return value when provided", async () => {
    const user = userEvent.setup();
    const buildHref = vi.fn().mockReturnValue("https://example.com/admin/testimonials?q=ma");
    render(<ListCopyLinkButton buildHref={buildHref} />);
    await user.click(screen.getByRole("button", { name: /copy link/i }));
    expect(writeText).toHaveBeenCalledWith("https://example.com/admin/testimonials?q=ma");
  });
});
```

#### packages/react/src/collections/listView/ListToolbar.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import {
  BUILTIN_CONTRIBUTION_IDS,
  SLOT_IDS,
  type ComponentContributionInput,
  type ListSlotProps,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { SlotOutlet } from "../../slots/SlotOutlet";
import { useCollectionList } from "./CollectionListContext";
import { listToolbarContributions } from "./listBuiltinContributions";
import { ListCopyLinkButton } from "./ListCopyLinkButton";
import { DataTablePageSizeSelect } from "../../ui/data-table/DataTablePageSizeSelect";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Button } from "../../ui/button";
import { Icon } from "../../ui/Icon";

/**
 * Props every `list.toolbar` contribution receives — deliberately minimal
 * (mirrors `EditSlotProps`'s `{ kind, slug }`): the richer list-wide state
 * (`urlState`, `visibleColumns`, `hideableColumns`, selection, density, …)
 * comes from `useCollectionList()` (Step 9), which a built-in or a
 * project's own contribution calls itself, exactly as `edit.*`
 * contributions call `useVexDocument()` rather than receiving document
 * state as a prop (Decision 37). Carries no `columnsCollapsed` field —
 * `vex.list.columns`'s `DataTableColumnsMenu` collapses its own label via
 * a CSS class (Decision 43), so there is nothing left for this slot to
 * thread through.
 */
export type ListToolbarSlotProps = ListSlotProps;

/** Overrides `ListCopyLinkButton`'s default `window.location.href` — Step 12 passes a full-state serializer when a local view is active (Decision 11). The rest of `ListToolbar`'s inputs — collection, urlState, visibleColumns, hideableColumns, selection, hasActiveView, density — come from `useCollectionList()`. */
export interface ListToolbarProps {
  buildCopyLinkHref?: () => string;
}

/**
 * Renders the collection list's toolbar row: the inline bulk group (when a
 * selection exists, left of everything else — Decision 22), the
 * always-visible group (`list.toolbar`'s `vex.list.search` plus any
 * non-collapsible project contribution), and the collapsible group (Copy
 * link, `vex.list.columns`, Rows-per-load).
 *
 * The collapse itself is pure CSS (Decision 43), not `ResizeObserver`
 * measurement — the server render is the final render. Copy link and
 * Rows-per-load are each rendered TWICE: once inline, hidden below their
 * own `@container/list` breakpoint, and once inside the ⋯ overflow
 * `DropdownMenuContent`, hidden ABOVE that same breakpoint — exactly one
 * copy is ever visible, and since the hidden copy is `display: none`, it
 * is never in the accessibility tree or tab order. `vex.list.columns` is
 * the one exception — its `DataTableColumnsMenu` mounts once and narrows
 * its own label internally, because it resolves through `SlotOutlet` as a
 * whole ordered list (see this step's "Why 'Columns' narrows itself via
 * CSS" note).
 *
 * The breakpoints are fixed, widest first, matching Decision 22/43's
 * collapse order: Copy link hides first, below `@2xl/list`; the Columns
 * label hides next, below `@xl/list` (inside `DataTableColumnsMenu`
 * itself); Rows-per-load hides last, below `@lg/list`.
 *
 * This step reads `useCollectionList()`'s shape as extended by this step's
 * own anchored edit to `CollectionListContext.tsx` (above): `collection`,
 * `urlState`, `visibleColumns`, `onVisibleColumnsChange`, `hideableColumns`,
 * `selection` (`{ selectedIds, selectedDocs, setSelectedIds, canDelete }`),
 * `hasActiveView`, and `density`/`onDensityChange`.
 *
 * @param props - {@link ListToolbarProps}.
 * @returns The toolbar row.
 */
export function ListToolbar(props: ListToolbarProps): ReactNode {
  const list = useCollectionList();

  // TODO: implement
  // 1. `pageSizeOptions = list.collection.admin.table.pageSizeOptions`;
  //    `pageSize = list.urlState.size ?? list.collection.admin.table.defaultPageSize`.
  // 2. `bulkGroup: ReactNode | undefined`: `list.selection.selectedIds.length
  //    === 0` → `undefined`; else a `flex items-center gap-2` fragment
  //    containing "{selectedIds.length} selected" (`aria-live="polite"`,
  //    DESIGN-NOTES.md §3's focus-order note), a "Select all {rows.length}
  //    loaded" button (disabled once every loaded row is already selected;
  //    Decision 28's exact label), `<SlotOutlet<{ collection:
  //    CollectionConfig; docs: VexDocument[] }> slotId={SLOT_IDS.list.bulkActions}
  //    builtins={[]} contributions={list.collection.admin.components.bulkActions
  //    as unknown as …} contributedProps={{ collection: list.collection,
  //    docs: list.selection.selectedDocs }} />` (the Delete builtin lives in
  //    Step 9's own bulk-actions builtins list, not duplicated here), and a
  //    clear button (`Esc` semantics, `onClick={() =>
  //    list.selection.setSelectedIds([])}`).
  // 3. Render `<div className="flex flex-wrap items-center justify-between gap-2">`:
  //    a. `<div className="flex shrink-0 items-center gap-2">` containing
  //       `bulkGroup` (when present) then `<SlotOutlet<ListToolbarSlotProps>
  //       slotId={SLOT_IDS.list.toolbar} builtins={listToolbarContributions()}
  //       contributions={list.collection.admin.components.toolbar as unknown
  //       as ComponentContributionInput<ReactHKT, ListToolbarSlotProps>[]}
  //       contributedProps={{ collection: list.collection }} />` — no extra
  //       props; `vex.list.columns` reads `density`/`onDensityChange` off
  //       `useCollectionList()` itself, the same way it already reads
  //       `visibleColumns`. `list.filters` (Step 11's Filter button/
  //       builder trigger) renders adjacent to this group, placed by
  //       `ListLayout` (Step 9) in the same row — not inside this
  //       component.
  //    b. `<div className="flex shrink-0 items-center gap-2">` containing,
  //       inline, each wrapped in its own breakpoint class: `<span
  //       className="hidden @2xl/list:inline-flex"><ListCopyLinkButton
  //       buildHref={props.buildCopyLinkHref} /></span>` and `<span
  //       className="hidden @lg/list:inline-flex"><DataTablePageSizeSelect
  //       pageSize={pageSize} pageSizeOptions={pageSizeOptions}
  //       onPageSizeChange={list.urlState.setSize} /></span>`, followed
  //       UNCONDITIONALLY by the overflow `<DropdownMenu>`:
  //       `<DropdownMenuTrigger asChild><Button variant="ghost" size="icon"
  //       className="@2xl/list:hidden" aria-label="More toolbar actions">
  //       <Icon name="MoreHorizontal" /></Button></DropdownMenuTrigger>`
  //       (hidden once Copy link — the widest-threshold item — is inline,
  //       since nothing is left to show below it) and
  //       `<DropdownMenuContent className="flex flex-col gap-1 p-2">`
  //       containing the SAME two components again, breakpoints INVERTED:
  //       `<span className="@2xl/list:hidden"><ListCopyLinkButton
  //       buildHref={props.buildCopyLinkHref} /></span>` and `<span
  //       className="@lg/list:hidden"><DataTablePageSizeSelect
  //       pageSize={pageSize} pageSizeOptions={pageSizeOptions}
  //       onPageSizeChange={list.urlState.setSize} /></span>`.
  // Edge cases:
  // - Both copies of `ListCopyLinkButton`/`DataTablePageSizeSelect` are
  //   mounted on EVERY render — that's the point (Decision 43/
  //   `layout-stability.md`: "render-time, no JS"). The hidden one never
  //   paints and is excluded from the accessibility tree, so there is
  //   exactly one reachable "Copy link" button and one reachable "Rows per
  //   load" combobox at any given container width, never two.
  // - `bulkGroup === undefined` (nothing selected) means the always-visible
  //   group starts directly with the `list.toolbar` outlet — no empty
  //   wrapper left behind.
  throw new Error("Not implemented");
}

/** Built-in `list.toolbar` contribution id this file's `SlotOutlet` call targets — exported so `ListToolbar.test.tsx` can assert it without constructing a full `CollectionConfig`. The id itself, and the `ListSearchAction`/`ListColumnsAction` components behind it, are this step's `listBuiltinContributions.ts` edit. */
export const LIST_TOOLBAR_SLOT_ID = SLOT_IDS.list.toolbar;
```

#### packages/react/src/collections/listView/ListToolbar.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { SLOT_IDS } from "@vexcms/core";
import { LIST_TOOLBAR_SLOT_ID } from "./ListToolbar";

describe("ListToolbar", () => {
  it("targets the list.toolbar slot, per SLOT_IDS", () => {
    // Guards the slot `ListToolbar`'s `SlotOutlet` call must target — a
    // typo here would silently drop vex.list.search/vex.list.columns into
    // the wrong slot. `ListToolbar` itself renders through `SlotOutlet` and
    // `useCollectionList()`, which need a live `VexConfigProvider`/access
    // context/`CollectionListProvider` — the same reason this test stays
    // at this level rather than mounting the full component.
    expect(LIST_TOOLBAR_SLOT_ID).toBe(SLOT_IDS.list.toolbar);
    expect(LIST_TOOLBAR_SLOT_ID).toBe("list.toolbar");
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
    // the field's own `admin.enableSorting`/`admin.enableHiding` (Step 4) —
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

This is a behavior change, not just plumbing: every per-type factory currently hardcodes `enableSorting: true, enableHiding: true`, so EVERY column is sortable/hideable today. After this edit, both default to `false` (Step 4's `populateCollectionFieldMeta` default) — a field must opt in with `admin.enableSorting` / `admin.enableHiding` to get either control, matching Decision 6 ("no silent auto-indexes").

#### packages/react/src/ui/data-table/DataTable.tsx

This step extends Step 9's edit to the same file (controlled `onSelectionChange`, the row-selection checkbox column, the `useReactTable` call) with the fixed-height layout (Decision 22), sort/density/visibility wiring, the capped-count footer (Decision 35), and the empty/error slots. 5 further edits.

**1 — imports.** The `@vexcms/core` import gains `CollectionTableSort` and `ListDensity` (the density type now lives in core, Decision 42, not in this folder's own `DataTableColumnsMenu.tsx`); add the new sibling imports:

```ts
import { VexDocument, type Alignment, type CollectionTableSort, type ListDensity } from "@vexcms/core";
import { DataTableSortHeader } from "./DataTableSortHeader";
import { ScrollArea } from "../scroll-area";
```

**2 — `DataTableColumnMeta`.** Add `label`, read by the header-wrapping logic in edit 5 (every `*FieldToColumnDef` factory already sets `meta.label` — this interface just hadn't declared it):

```ts
interface DataTableColumnMeta {
  align?: Alignment;
  label?: string;
}
```

**3 — row-height class map,** a new module-level constant beside `ALIGNMENT_CLASS`, read by edit 5's row/cell rendering:

```ts
/** Row height per {@link ListDensity} (DESIGN-NOTES.md §1: Comfortable 48px, Compact 36px). Applied to every `TableRow`/`TableCell`. */
const DENSITY_ROW_CLASS: Record<ListDensity, string> = {
  comfortable: "h-12",
  compact: "h-9",
};
```

**4 — `DataTableProps`.** Add after Step 9's `onSelectionChange` member:

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

  // Column visibility and density

  /**
   * Field keys currently visible, from `enableHiding` columns only.
   * `undefined` shows every column (an unmigrated caller keeps today's
   * behavior). Session-only state owned by the caller, never persisted here.
   */
  visibleColumns?: string[];

  /** Row density (Decision 29), cookie-backed by the caller (Decision 42). @default "comfortable" */
  density?: ListDensity;

  // Pagination footer

  /** The current page size — used ONLY to label the Load More button ("Load 25 more"); the Select itself now renders in `ListToolbar` (Decision 22), not here. */
  pageSize?: number;

  /** Whether `totalCount` hit `collection.admin.table.countLimit` (Decision 35) — the footer then shows `"{totalCount.toLocaleString()}+"` instead of the bare number. Ignored when `totalCount` is `null`/`undefined`. */
  totalDocsCapped?: boolean;

  // Empty and error states

  /** Rendered in place of the table body when `data.length === 0 && isDone` — one of `ListEmptyState`'s three variants, chosen by the caller (`CollectionListView`), since only it knows whether a search/filter is active. */
  emptyState?: ReactNode;

  /** Rendered in place of the whole scroll area (header included) when the underlying query failed — `ListQueryError`, built by the caller from `useVexListQuery`'s error (Step 8). Takes priority over `emptyState`. */
  queryError?: ReactNode;
```

**5 — `DataTable` body.** Supersedes Step 9's guided stub for this function (same signature/JSDoc; keeps Step 9's selection/checkbox-column/`useReactTable` setup, replaces the render return with the fixed-height shell):

```tsx
export function DataTable<TData extends VexDocument>(props: DataTableProps<TData>): ReactNode {
  // TODO: implement
  // 1. Keep Step 9's `rowSelection` state, checkbox-column injection, and
  //    `useReactTable` call exactly as they are, with one addition: extend
  //    the call with `enableSorting: false` as the TABLE-LEVEL default
  //    (VexCMS sorts by exactly one `{ field, order }`, Decision 4, not
  //    TanStack's multi-column `SortingState` — `props.sort`/
  //    `props.onSortChange` are read directly in the header-rendering loop,
  //    step 4 below, never fed into `useReactTable`'s own sorting state),
  //    and `state.columnVisibility` computed as `useMemo(() =>
  //    Object.fromEntries(columns.filter((c) => c.enableHiding).map((c) =>
  //    [c.id as string, props.visibleColumns === undefined ? true :
  //    props.visibleColumns.includes(c.id as string)])), [columns,
  //    props.visibleColumns])` — `columns` is the post-checkbox-column
  //    array; `props.visibleColumns === undefined` (an unmigrated caller)
  //    shows every column, unchanged from today.
  // 2. `density = props.density ?? "comfortable"`; `rowClass =
  //    DENSITY_ROW_CLASS[density]`.
  // 3. `props.queryError` set → return just that node inside the same
  //    `flex min-h-0 flex-1 flex-col` shell (step 4's outer wrapper), no
  //    table/footer at all.
  // 4. Outer shell: `<div className="flex min-h-0 flex-1 flex-col gap-2">`.
  //    Inside it, `<ScrollArea className="min-h-0 flex-1 rounded-md
  //    border">`:
  //    a. `data.length === 0 && isDone && props.emptyState` → render
  //       `<div className="flex h-full items-center
  //       justify-center">{props.emptyState}</div>` INSTEAD of `<Table>`.
  //    b. else → the existing `<Table>` structure, with two changes:
  //       - `<TableHeader className="sticky top-0 z-10 bg-background">`
  //         (was unstyled) — pins the header while the body scrolls.
  //       - In the `<TableHead>` loop, replace the unconditional
  //         `flexRender(header.column.columnDef.header,
  //         header.getContext())` with: `header.column.getCanSort() ?
  //         <DataTableSortHeader label={(header.column.columnDef.meta as
  //         DataTableColumnMeta | undefined)?.label ?? header.column.id}
  //         field={header.column.id} sort={props.sort}
  //         onSortChange={props.onSortChange ?? (() => {})} enableSorting
  //         disabled={props.sortDisabled} /> :
  //         flexRender(header.column.columnDef.header, header.getContext())`
  //         — `getCanSort()` reflects each column's own `enableSorting` flag
  //         (step 1's table-level `false` default, overridden per-field by
  //         `getCollectionColumnDefs`).
  //       - Every `<TableRow>` (header and body) and `<TableCell>` gains
  //         `className={cn(rowClass, …existing alignment class)}` from step
  //         2's `rowClass`.
  // 5. Below the `ScrollArea`, a `shrink-0` pinned footer, hidden entirely
  //    when `data.length === 0`: `<div className="flex shrink-0
  //    flex-wrap items-center justify-between gap-2 border-t px-2 py-2">`:
  //    status text — `"Showing {data.length}"` plus, when `totalCount` is
  //    not `null`/`undefined`, `" of ${totalCount.toLocaleString()}${
  //    totalDocsCapped ? "+" : ""}"` (Decision 35: "Showing 25 of 1,000+"),
  //    followed by `!isDone ? <Button onClick={onLoadMore} variant="outline"
  //    isPending={isLoadingMore}>{isLoadingMore ? "Loading…" : \`Load
  //    ${props.pageSize ?? data.length} more\`}</Button> : <p
  //    className="text-sm text-muted-foreground">That's everything</p>}`.
  //    No right-hand side — the page-size select lives in `ListToolbar` now
  //    (Decision 22).
  // Edge cases:
  // - TanStack's `rowSelection` is keyed by row index by default (no
  //   `getRowId` passed), so a row removed from `data` after a delete can
  //   leave a STALE index selected once the array re-renders shorter —
  //   unchanged from Step 9's own note; `CollectionListView` still owns
  //   clearing its `selectedIds` state after a successful delete.
  // - A column with no `meta.label` (the synthetic status column, the
  //   checkbox column) falls back to `header.column.id` as its sort
  //   header's label — neither sets `enableSorting: true`, so
  //   `DataTableSortHeader` never actually renders for them.
  // - `props.emptyState` is only consulted once `isDone` — a still-loading,
  //   zero-row first page renders the (empty) table shell, not the empty
  //   state, avoiding a flash before the first page resolves.
  // - `totalDocsCapped` without a `totalCount` (an unmigrated caller) is
  //   simply ignored — the "+" only ever appears alongside a real number.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/CollectionListContext.tsx

2 edits — extends Step 9's base `CollectionListState` (Design Decision 37: one definition site, extended here, never redefined); everything else in the file is unchanged.

**1 — imports.** Add the density type alongside the state's existing import:

```ts
import type { ListDensity } from "@vexcms/core";
import type { UseListUrlStateReturn } from "./useListUrlState";
```

**2 — `CollectionListState`, replace the body.** `selectedIds`/`setSelectedIds` fold into a `selection` object alongside the two fields this step adds (`selectedDocs`, `canDelete`); `visibleFields` becomes `visibleColumns` plus its setter and the hideable-columns list; `urlState` and `hasActiveView` are new; `density` is now `ListDensity`-typed and gains the sibling setter `onDensityChange` (Decision 42 — no component owns a local `useLocalStorage`/density store anymore). `collection` and `onInspect` are unchanged from Step 9.

```ts
export interface CollectionListState<TDoc extends TDocument = TDocument> {
  /** The resolved collection config. */
  collection: CollectionConfig;
  /** This list's URL state (`useListUrlState`, this step). */
  urlState: UseListUrlStateReturn;
  /** Row selection. */
  selection: {
    /** The ids of currently-selected rows (`DataTable`'s `onSelectionChange`). */
    selectedIds: string[];
    /** The currently-selected rows, resolved from `selectedIds` against the loaded page. */
    selectedDocs: TDoc[];
    /** Replaces the current selection. */
    setSelectedIds: (ids: string[]) => void;
    /** Whether the caller may delete documents in this collection. */
    canDelete: boolean;
  };
  /** Per-browser table density (Decision 29), cookie-backed (Decision 42) — seeded from `CollectionListView`'s `initialPreferences` prop, never read from `useLocalStorage`. */
  density: ListDensity;
  /** Replaces the density preference; the caller (`CollectionListView`) updates its own state AND writes the `vex-list-density` cookie (`writeListDensityCookie`) so the next server render matches with no flash. Read by `vex.list.columns` (this step's `ListColumnsAction.tsx`) alongside `density` itself. */
  onDensityChange: (density: ListDensity) => void;
  /** The field slugs currently visible in the table (the columns menu). */
  visibleColumns: string[];
  /** Replaces the visible-columns set. */
  onVisibleColumnsChange: (fields: string[]) => void;
  /** Field/label pairs eligible to be hidden from the table (`admin.enableHiding`), for the columns menu. */
  hideableColumns: { field: string; label: string }[];
  /** Whether a saved view (config/shared/local) is currently active. `false` until Step 12 wires saved views. */
  hasActiveView: boolean;
  /** Opens the Inspect peek for a document id (Decision 27, wired in Step 13). `undefined` until then. */
  onInspect?: (id: string) => void;
}
```

#### packages/react/src/collections/listView/ListLayout.tsx

2 edits — Step 9 builds this file's composition (the fixed-height shell, the `list.header.actions`/`list.filters`/`list.beforeTable`/`list.afterTable` outlets, `<ListToolbar/>`, `<DataTable/>`). This step adds the container-query root (Decision 22/43) and the query-result props `CollectionListView` (this step) now computes.

**1 — the root element's `className`.** Anchor: the outermost `<div>` `ListLayout` returns (the one wrapping the header row, tabs row, toolbar row, and `<DataTable>`). Add `@container/list` to its class list, alongside whatever fixed-height classes (`flex h-full min-h-0 flex-col gap-3`) Step 9 already put there:

```tsx
<div className="@container/list flex h-full min-h-0 flex-col gap-3">
```

Every narrower-container variant the rest of this spec adds (this step's own `ListToolbar` CSS collapse; Step 13's inline-vs-sheet peek; Step 16's responsive pass) targets this one named container — `@lg/list:…`, `@xl/list:…`, `@2xl/list:…`, etc. — the same convention `CollectionEditView.tsx` already established with `@3xl/form`. Because the collapse is now CSS-only (Decision 43), this root is also the ONLY place a container name is declared; nothing downstream measures it with JavaScript.

**2 — `ListLayoutProps` gains the new query-result props.** Anchor: the `onLoadMore: () => void;` member.

```ts
  onLoadMore: () => void;
  /** Whether `totalCount` hit `collection.admin.table.countLimit` (Decision 35) — forwarded to `DataTable`'s footer. */
  totalDocsCapped?: boolean;
  /** Whether the caller may create a new document — gates the empty state's own Create button (`ListCreateAction` self-gates separately for the header). */
  canCreate: boolean;
  /** Whether the caller may delete documents in this collection. */
  canDelete: boolean;
  /** Rendered in place of the table body when there's nothing to show (`ListEmptyState`) — chosen by the caller, since only it knows whether a search/filter is active. */
  emptyState?: ReactNode;
  /** Rendered in place of the whole scroll area when the underlying query failed (`ListQueryError`) — takes priority over `emptyState`. */
  queryError?: ReactNode;
```

`DataTable`'s own call (Step 9's pseudocode, point 3's `<DataTable>` bullet) forwards three of these straight through: `totalDocsCapped={props.totalDocsCapped} emptyState={props.emptyState} queryError={props.queryError}`. `canCreate` has nothing to gate yet in `ListLayout` itself (the create affordance is `ListCreateAction`'s own self-gated built-in) — it threads through for a later step. `canDelete` likewise threads through so a later step's inline affordance can read it without its own `usePermission` call, matching `useCollectionList().selection.canDelete`'s identical value.

#### packages/react/src/collections/listView/CollectionListView.tsx

This step extends Step 8's `useVexListQuery` call and Step 9's `<ListLayout>`/`CollectionListContext`. 4 edits; column-building (including the existing `isFieldAllowed` filter — unchanged, see this step's "Why" note above), the status column, and `ListCreateAction`'s JSX (already moved out by Step 9) are unchanged. `CollectionListViewProps` gains `initialPreferences` via this step's own edit to `packages/core/src/framework.ts` (above).

**1 — imports.** Add the new hooks/components, alongside the existing `react` import. `useLocalStorage` and `DataTableColumnsMenu`'s old storage-key export are gone — density is `useState` seeded from `props.initialPreferences`, written via `listPreferenceCookies.ts`'s `writeListDensityCookie`:

```ts
import { useMemo, useState } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import type { ListDensity } from "@vexcms/core";
import { useListUrlState } from "./useListUrlState";
import { ListEmptyState } from "./ListEmptyState";
import { ListQueryError } from "./ListQueryError";
import { CollectionListProvider } from "./CollectionListContext";
import { writeListDensityCookie } from "./listPreferenceCookies";
import { MODALS } from "../../modals/constants";
```

**2 — `urlState`, `visibleColumns`, `density`, `canCreate`/`canDelete`, `hideableColumns`, and the pagination call.** Anchor: the existing `const [selectedIds, setSelectedIds] = useState<string[]>([]);` line (Step 9). Replace the current direct `usePaginatedQuery` call with `useVexListQuery` (Step 8) fed from `urlState`, and reintroduce `canCreate`/`canDelete` — Step 9 removed them along with the old JSX that read them; `ListEmptyState`'s Create gate (below) and the `selection.canDelete` context field need them again. `density` is seeded from `props.initialPreferences?.density` (Decision 42) rather than `useLocalStorage`; `onDensityChange` both updates the state and writes the cookie, so a later component in this same render tree never has to re-derive it. `setCreateModalOpen` reopens the SAME `?createNew=true` URL param `CreateDocumentModal` (mounted by `ListCreateAction`, Step 9) already reads via `useQueryState` — the empty state's own Create button drives it without owning any modal state itself:

```tsx
  const urlState = useListUrlState({ collection });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    collection.admin.table.defaultColumns,
  );
  const [density, setDensity] = useState<ListDensity>(
    props.initialPreferences?.density ?? "comfortable",
  );
  const onDensityChange = (next: ListDensity) => {
    setDensity(next);
    writeListDensityCookie({ density: next });
  };
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  const [, setCreateModalOpen] = useQueryState(MODALS.createDocument.urlParam, parseAsBoolean);
  const hideableColumns = useMemo(
    () =>
      columns
        .filter((c) => c.enableHiding)
        .map((c) => ({
          field: columnFieldKey(c) ?? (c.id as string),
          label: (c.meta as { label?: string } | undefined)?.label ?? (c.id as string),
        })),
    [columns],
  );
  const pagination = useVexListQuery({
    collection,
    drafts: isVersioned ? true : undefined,
    depth: 1,
    where: urlState.filter,
    // Decision 7: parked sort — omitted from the query entirely while a
    // search is active, not just visually disabled, matching the server's
    // own rejection of `sort` together with `search`.
    sort: urlState.q === "" ? urlState.sort : undefined,
    search: urlState.q,
    searchField: urlState.qf,
    pageSize: urlState.size ?? collection.admin.table.defaultPageSize,
    initialData: props.initialData,
    // No `view` arg (Decision 19/25) — `find`/`search` no longer accept
    // one. A config view's hidden `where` composes into `urlState.filter`
    // itself once Step 12 wires `composeViewWhere`; until then this is
    // simply the user's own filter.
  });
  const selectedDocs = useMemo(
    () => rows.filter((row) => selectedIds.includes(row._id as string)),
    [rows, selectedIds],
  );
```

**3 — empty-state and query-error nodes.** Insert after the pagination call (before `<CollectionListProvider>`'s return):

```tsx
  const emptyState = useMemo(() => {
    if (pagination.error || !pagination.isDone || rows.length > 0) return undefined;
    if (urlState.q !== "") {
      const readableSearchFields = collection.admin.table.searchField.filter((f) =>
        isFieldAllowed(fieldPermissions, f),
      );
      const otherField = readableSearchFields.find((f) => f !== (urlState.qf ?? readableSearchFields[0]));
      return (
        <ListEmptyState
          variant="noSearchResults"
          collectionLabelPlural={collection.labels.plural.toLowerCase()}
          collectionLabelSingular={collection.labels.singular.toLowerCase()}
          searchQuery={urlState.q}
          searchFieldLabel={urlState.qf ?? readableSearchFields[0]}
          otherSearchFieldLabel={otherField}
          onSearchOtherField={otherField ? () => urlState.setQf(otherField) : undefined}
          onClearSearch={() => urlState.setQ("")}
        />
      );
    }
    if (urlState.filter !== undefined) {
      return (
        <ListEmptyState
          variant="noFilterResults"
          collectionLabelPlural={collection.labels.plural.toLowerCase()}
          collectionLabelSingular={collection.labels.singular.toLowerCase()}
          onClearFilters={() => urlState.setFilter(undefined)}
        />
      );
    }
    return (
      <ListEmptyState
        variant="empty"
        collectionLabelPlural={collection.labels.plural.toLowerCase()}
        collectionLabelSingular={collection.labels.singular.toLowerCase()}
        canCreate={canCreate}
        onCreate={() => setCreateModalOpen(true)}
      />
    );
  }, [pagination.error, pagination.isDone, rows.length, urlState, collection, fieldPermissions, canCreate]);

  const queryError = pagination.error ? (
    <ListQueryError
      error={pagination.error}
      collectionLabelPlural={collection.labels.plural.toLowerCase()}
      onRetry={pagination.retry}
      sortFieldLabel={urlState.sort?.field}
      onRemoveSort={() => urlState.setSort(undefined)}
    />
  ) : undefined;
```

This step assumes `useVexListQuery` (Step 8) exposes `error`/`retry`/`totalDocsCapped` alongside `isDone`/`isPending`/`loadMore`/`totalDocs`/`results`, matching `usePaginatedQuery`'s existing surface plus the fields Decision 35 and a TanStack/Convex query hook conventionally add — Step 8 reconciles the exact names if they differ. `"Edit filters"` (the `noFilterResults` variant's other button) is wired by Step 11, which owns the filter builder's own open/close state; this step passes `onEditFilters={undefined}` until then (the button simply doesn't render, per `ListEmptyState`'s own rule).

**4 — `<CollectionListProvider>`/`<ListLayout>` call.** Replace the existing `<CollectionListProvider>`/`<ListLayout>` call Step 9 built, with the extended value and props — `density` gains the sibling `onDensityChange`:

```tsx
      <CollectionListProvider
        value={{
          collection,
          urlState,
          visibleColumns,
          onVisibleColumnsChange: setVisibleColumns,
          hideableColumns,
          density,
          onDensityChange,
          selection: { selectedIds, selectedDocs, setSelectedIds, canDelete },
          hasActiveView: urlState.view !== undefined,
          onInspect: (id: string) => urlState.setPeek(id),
        }}
      >
        <ListLayout
          collection={collection}
          rows={rows}
          columns={columns}
          isDone={pagination.isDone}
          isPending={pagination.isPending}
          totalCount={pagination.totalDocs}
          totalDocsCapped={pagination.totalDocsCapped}
          onLoadMore={pagination.loadMore}
          canCreate={canCreate}
          canDelete={canDelete}
          emptyState={emptyState}
          queryError={queryError}
        />
      </CollectionListProvider>
```

`hasActiveView`/`onInspect` are real from this step on — both derive entirely from `urlState` (`view`/`setPeek`), which this step already owns, so neither Step 12 (saved views) nor Step 13 (Inspect peek) needs to touch this provider value; Step 13's `ListPeek` reads `urlState.peek`/`urlState.setPeek` itself as plain props, the same source `onInspect` writes to here. `selection`, `visibleColumns`, `hideableColumns`, and `density`/`onDensityChange` are the list-wide UI state Decision 37 moves out of props-drilled-through-`ListLayout` and into context — `ListLayout`, `ListToolbar`, and every `list.toolbar`/`list.row.actions`/`list.bulkActions` built-in read them back via `useCollectionList()` rather than receiving them as props, the same split `VexDocumentProvider`/`useVexDocument` establishes for the edit view. `density` is the one field in this value whose SOURCE OF TRUTH (the cookie) lives outside React entirely — `onDensityChange` is this step's one piece of state that has a side effect beyond `setState`.

#### packages/react/src/collections/listView/index.ts

New barrel (or 1 edit if Step 2 already created it while moving the pre-existing files) — add this step's exports alongside whatever Step 2/Step 9 already re-export from this folder. `listUrlParams` lives in `@vexcms/core`, not re-exported here:

```ts
export * from "./ListSearch";
export * from "./ListToolbar";
export * from "./ListEmptyState";
export * from "./ListQueryError";
export * from "./ListCopyLinkButton";
export * from "./listPreferenceCookies";
export * from "./useListUrlState";
```

#### packages/react/src/ui/data-table/index.ts

1 edit — everything else is unchanged.

**1 — add the three new control exports,** alongside the existing `DataTableBulkActions` export:

```ts
export * from "./DataTableSortHeader";
export * from "./DataTableColumnsMenu";
export * from "./DataTablePageSizeSelect";
```

#### packages/react/src/ui/index.ts

1 edit — add `ScrollSection`'s export alongside the existing `scroll-area` export:

```ts
export * from "./ScrollSection";
```

Verify: `pnpm --filter @vexcms/core test -- collections/listUrlParams collections/listPreferenceCookies && pnpm --filter @vexcms/react test -- collections/listView ui/data-table ui/ScrollSection && browser: search, field switch, sort, column hide, density toggle (confirm the \`vex-list-density\` cookie is written, then reload — the row height matches on the very first paint, no flash), resize the list pane across the \`@lg/list\`/\`@xl/list\`/\`@2xl/list\` breakpoints and confirm Copy link / the Columns label / Rows per load fold into ⋯ in that order with no measurement-driven flash, empty/error states, "Showing 25 of 1,000+" on a capped collection, reload keeps URL state

### Step 11 — Filter builder (AND rows + one level of OR groups) [agent]

Why: authors `where` for the URL and views; DNF covers multi-value, empty-value, and triage use cases without a tree editor (Decision 10). Files live in `collections/listView/` per the developer's folder-placement decision (Decision 21) and the closed-subfolder AP-023 fix, dropping the redundant `Collection` prefix. The builder stays presentational — this step's `vex.list.filters` built-in (`listView/ListFiltersAction.tsx`) reads `collection`/`where`/`setFilter` from `useCollectionList()` (Decision 37) and passes them down as props, rather than this component reading context itself. `where` here is always the user's OWN filter, never a config view's hidden filter (Decision 25). Per Decisions 39–43, filter-chip visibility is cookie-backed rather than `useLocalStorage` (Decision 42 puts it in `vex-list-chips:<collection>`, read on the server exactly like `readLivePreviewPanelCookie`) via the shared `listPreferenceCookies.ts` helper Step 10 introduces for density. `ListFilterChips` and `ListHiddenFilterBadge` are seeded from `initialVisible`/the view's config so the server render matches.

- [ ] `packages/react/src/collections/listView/whereDnf.ts` (new) + test — `toDnf(where) | null`, `fromDnf(groups)`, `ListFilterOp`, `listFilterOpOf`/`applyListFilterOp` for the `isEmpty`/`isNotEmpty` editor operators
- [ ] `packages/react/src/collections/listView/ListFilterBuilder.tsx` (new) — groups (OR) of rows (AND); operators by field type incl. `isEmpty`/`isNotEmpty` on every type; built-in `vex_status` field on versioned collections; unreadable fields excluded (`useFieldPermissions`); live apply with muted incomplete rows; text `eq` hint; non-DNF `where` shown read-only
- [ ] `packages/react/src/collections/listView/ListFiltersAction.tsx` (new) + test — the `vex.list.filters` built-in, wrapping `ListFilterBuilder`'s trigger/popover with `collection`/`where`/`setFilter` from `useCollectionList()`
- [ ] `packages/react/src/collections/listView/listBuiltinContributions.ts` — adds `listFiltersContributions()` (`vex.list.filters`)
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` — the `list.filters` `SlotOutlet`'s `builtins` prop changes from `[]` (Step 9's placeholder) to `listFiltersContributions()`
- [ ] `packages/core/src/collections/listPreferenceCookies.ts` (existing, Step 10) — add the `chipsVisible` cookie entry, `listChipsVisibleCookieName`, and the `chipsVisible` field on `parseListPreferences`'s result
- [ ] `packages/react/src/collections/listView/listPreferenceCookies.ts` (existing, Step 10) — add `writeListChipsVisibleCookie`
- [ ] `packages/react/src/collections/listView/ListFilterChips.tsx` (new) + test — active-filter chips (clear one / clear all), per-browser visibility toggle, cookie-backed (Decision 42) and seeded from `initialVisible` so the server render matches
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` — renders `ListFilterChips` in the fixed-height chip row below the toolbar, below the `list.filters` outlet (Decision 22), forwarding `initialPreferences.chipsVisible`; composition-only edit (Decision 38)

#### packages/react/src/collections/listView/whereDnf.ts

```ts
import type { FilterOp, VexWhereNode } from "@vexcms/core";

/**
 * One AND-ed comparison within a {@link WhereDnfGroup} — the `field`/`op`/
 * `value` leaf of a {@link VexWhereNode}, narrowed out of the union rather
 * than redeclared so a new operator added to core's `FilterOp` reaches the
 * filter builder without a second edit (P-010).
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
 * The filter builder's **editor-level** operator vocabulary — core's
 * {@link FilterOp} (`eq neq gt gte lt lte`) plus Decision 10's two
 * list-only operators. `isEmpty`/`isNotEmpty` have no stored representation
 * of their own: a leaf with `op: "eq"`/`"neq"` and `value: undefined` IS an
 * empty/not-empty check (core `FilterOp` is unchanged, access rules are
 * unaffected). This type exists only so the operator `Select` can offer
 * and label them; the stored `WhereDnfLeaf` never carries `"isEmpty"` /
 * `"isNotEmpty"` as its `op`.
 */
export type ListFilterOp = FilterOp | "isEmpty" | "isNotEmpty";

/**
 * Reads a stored leaf's operator back as the {@link ListFilterOp} the
 * operator `Select` should show selected — the inverse half of
 * {@link applyListFilterOp}.
 *
 * @param props - Input props.
 * @param props.leaf - The row's current stored leaf.
 * @returns `"isEmpty"` for `{ op: "eq", value: undefined }`, `"isNotEmpty"`
 *   for `{ op: "neq", value: undefined }`, else `leaf.op` unchanged.
 */
export function listFilterOpOf<S extends string>(props: { leaf: WhereDnfLeaf<S> }): ListFilterOp {
  // TODO: implement
  // 1. `props.leaf.value === undefined && props.leaf.op === "eq"` → return `"isEmpty"`.
  // 2. `props.leaf.value === undefined && props.leaf.op === "neq"` → return `"isNotEmpty"`.
  // 3. → return `props.leaf.op`.
  throw new Error("Not implemented");
}

/**
 * Applies an operator `Select` change to a row, translating Decision 10's
 * two editor-only operators into their stored `eq`/`neq`-with-no-value
 * form — the inverse half of {@link listFilterOpOf}.
 *
 * @param props - Input props.
 * @param props.leaf - The row's current stored leaf (field and value kept
 *   unless overridden below).
 * @param props.op - The operator just selected.
 * @returns A new leaf: `{ ...leaf, op: "eq", value: undefined }` for
 *   `"isEmpty"`; `{ ...leaf, op: "neq", value: undefined }` for
 *   `"isNotEmpty"`; `{ ...leaf, op }` otherwise — never mutates `props.leaf`.
 */
export function applyListFilterOp<S extends string>(props: {
  leaf: WhereDnfLeaf<S>;
  op: ListFilterOp;
}): WhereDnfLeaf<S> {
  // TODO: implement
  // 1. `props.op === "isEmpty"` → return `{ ...props.leaf, op: "eq", value: undefined }`.
  // 2. `props.op === "isNotEmpty"` → return `{ ...props.leaf, op: "neq", value: undefined }`.
  // 3. → return `{ ...props.leaf, op: props.op }` (`props.op` narrowed to `FilterOp` here).
  throw new Error("Not implemented");
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
 * read-only in `ListFilterBuilder` rather than being forced into a lossy
 * edit.
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
  // - A leaf with `value: undefined` (Decision 10's compiled empty check)
  //   round-trips like any other leaf — `toDnf`/`fromDnf` don't interpret
  //   `op`/`value`; only `listFilterOpOf`/`applyListFilterOp` do.
  throw new Error("Not implemented");
}

/**
 * Collapses a {@link WhereDnf}'s groups into the simplest equivalent plain
 * {@link VexWhereNode} — the inverse of {@link toDnf}, and the form
 * `ListFilterBuilder` writes back through `onWhereChange` (and ultimately
 * the URL `filter` param, Decision 9, via `useListUrlState`'s `setFilter`).
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

#### packages/react/src/collections/listView/whereDnf.test.ts

```ts
import { describe, expect, it } from "vitest";
import type { VexWhereNode } from "@vexcms/core";
import { toDnf, fromDnf, listFilterOpOf, applyListFilterOp, type WhereDnfGroup, type WhereDnfLeaf } from "./whereDnf";

const published: VexWhereNode<string> = { field: "status", op: "eq", value: "published" };
const draft: VexWhereNode<string> = { field: "status", op: "eq", value: "draft" };
const viewsOver100: VexWhereNode<string> = { field: "views", op: "gt", value: 100 };
const notArchived: VexWhereNode<string> = { field: "archived", op: "neq", value: true };
const emptyCompany: WhereDnfLeaf<string> = { field: "company", op: "eq", value: undefined };
const nonEmptyCompany: WhereDnfLeaf<string> = { field: "company", op: "neq", value: undefined };

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
  it("returns undefined for no groups", () => {
    expect(fromDnf({ groups: [] })).toBeUndefined();
  });

  it("drops empty groups and returns undefined if none remain", () => {
    const groups: WhereDnfGroup<string>[] = [{ rows: [] }, { rows: [] }];
    expect(fromDnf({ groups })).toBeUndefined();
  });

  it("returns the bare leaf for one group of one row", () => {
    const groups: WhereDnfGroup<string>[] = [{ rows: [published] }];
    expect(fromDnf({ groups })).toEqual(published);
  });

  it("returns an `and` for one group with 2+ rows", () => {
    const groups: WhereDnfGroup<string>[] = [{ rows: [published, viewsOver100] }];
    expect(fromDnf({ groups })).toEqual({ and: [published, viewsOver100] });
  });

  it("returns an `or` of leaves/`and`s for 2+ surviving groups", () => {
    const groups: WhereDnfGroup<string>[] = [
      { rows: [published] },
      { rows: [draft, notArchived] },
    ];
    expect(fromDnf({ groups })).toEqual({
      or: [published, { and: [draft, notArchived] }],
    });
  });

  it("round-trips toDnf output back to the original where", () => {
    const where: VexWhereNode<string> = {
      or: [{ and: [published, viewsOver100] }, { and: [draft, notArchived] }],
    };
    const dnf = toDnf({ where });
    expect(dnf).not.toBeNull();
    expect(fromDnf({ groups: dnf!.groups })).toEqual(where);
  });
});

describe("listFilterOpOf / applyListFilterOp", () => {
  it("reads an eq/undefined leaf as isEmpty", () => {
    expect(listFilterOpOf({ leaf: emptyCompany })).toBe("isEmpty");
  });

  it("reads a neq/undefined leaf as isNotEmpty", () => {
    expect(listFilterOpOf({ leaf: nonEmptyCompany })).toBe("isNotEmpty");
  });

  it("reads any other leaf's op unchanged", () => {
    expect(listFilterOpOf({ leaf: published as WhereDnfLeaf<string> })).toBe("eq");
  });

  it("applies isEmpty as eq/undefined", () => {
    expect(
      applyListFilterOp({ leaf: { field: "company", op: "eq", value: "x" }, op: "isEmpty" }),
    ).toEqual({ field: "company", op: "eq", value: undefined });
  });

  it("applies isNotEmpty as neq/undefined", () => {
    expect(
      applyListFilterOp({ leaf: { field: "company", op: "eq", value: "x" }, op: "isNotEmpty" }),
    ).toEqual({ field: "company", op: "neq", value: undefined });
  });

  it("applies any other op as-is", () => {
    expect(
      applyListFilterOp({ leaf: { field: "views", op: "eq", value: 1 }, op: "gt" }),
    ).toEqual({ field: "views", op: "gt", value: 1 });
  });
});
```

#### packages/react/src/collections/listView/ListFilterBuilder.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  getDataFields,
  PERMISSION_SCOPES,
  VERSION_STATUSES,
  VERSION_SYSTEM_FIELDS,
  type AdminDataField,
  type CollectionConfig,
  type VexWhereNode,
} from "@vexcms/core";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui";
import { DateTimePicker } from "../../ui/datetime/date-picker";
import { useFieldPermissions, isFieldAllowed } from "../../access/useFieldPermissions";
import { toDnf, fromDnf, listFilterOpOf, applyListFilterOp, type ListFilterOp, type WhereDnfLeaf } from "./whereDnf";

/** Operator choices the filter builder offers, in display order — Decision 10's six comparators plus the two value-less operators; labels mirror how each reads in a sentence ("field IS value"). */
export const FILTER_BUILDER_OP_LABELS: Record<ListFilterOp, string> = {
  eq: "is",
  neq: "is not",
  gt: "is greater than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
};

/** `Select` options for a `checkbox` field's filter value — Decision 10 ships no boolean-specific widget, so this reuses the field-type-dispatch `Select` with fixed labels. */
export const FILTER_BUILDER_BOOLEAN_OPTIONS = [
  { label: "True", value: "true" },
  { label: "False", value: "false" },
] as const;

/** The synthetic field key for the built-in `vex_status` filter — never a real `AdminDataField` key, so it is injected rather than declared on any collection (Decision 10). */
export const FILTER_BUILDER_STATUS_FIELD_KEY = VERSION_SYSTEM_FIELDS.status.slug;

/**
 * Which {@link ListFilterOp}s a field's `Select` offers, by field type —
 * Decision 10: number and date get all six comparisons, every other type
 * gets `eq`/`neq`, and every type gets the two value-less operators.
 *
 * @param props - Input props.
 * @param props.type - The field's `AdminDataField["type"]` (or the
 *   synthetic `vex_status` field, typed `"select"`).
 * @returns The operators to render, in {@link FILTER_BUILDER_OP_LABELS} order.
 */
export function filterBuilderOpsForFieldType(props: { type: AdminDataField["type"] }): ListFilterOp[] {
  // TODO: implement
  // 1. `props.type === "number" || props.type === "date"` →
  //    `["eq", "neq", "gt", "gte", "lt", "lte", "isEmpty", "isNotEmpty"]`.
  // 2. Every other type → `["eq", "neq", "isEmpty", "isNotEmpty"]`.
  throw new Error("Not implemented");
}

/** Props for {@link ListFilterBuilder}. */
export interface ListFilterBuilderProps {
  /** The collection the list view renders — its data fields populate the field picker. */
  collection: CollectionConfig;
  /**
   * The list's current filter, in plain `VexWhereNode` form — Decision 9's
   * URL `filter` param, Decision 11's saved-view `state.where`. Always the
   * USER's own filter: a config view's hidden `where` (Decision 25) is
   * composed server-side and never reaches this prop.
   */
  where: VexWhereNode<string> | undefined;
  /** Replaces `where` wholesale — the caller (`listView/ListFiltersAction.tsx`, backed by `useListUrlState`'s `setFilter`) owns persistence. Called only with the APPLIED where — see "live apply" below. */
  onWhereChange: (where: VexWhereNode<string> | undefined) => void;
}

/**
 * The groups-of-rows editor rendered by the `vex.list.filters` built-in
 * (`listView/ListFiltersAction.tsx`) for Decision 10's DNF `where`: AND
 * rows within a group, OR between groups, applied live as each row becomes
 * complete. Renders read-only when `props.where` is not in that normal
 * form (`toDnf` returns `null`), e.g. a config-authored `admin.table.views`
 * entry's hidden filter leaking into view state as a hand-written tree.
 *
 * Maintains its own `draftGroups` state, seeded from `toDnf(props.where)`
 * and resynced whenever `props.where` changes from OUTSIDE this component
 * (view switch, Reset, URL navigation) — never on every keystroke, or
 * typing a value would fight the external resync. A row is "complete" once
 * it has a field, an operator, and (for every operator except `isEmpty`/
 * `isNotEmpty`) a non-empty value; incomplete rows stay in `draftGroups`
 * (so they keep rendering, muted) but are excluded before calling
 * `fromDnf`/`onWhereChange` — Decision 10's "a row counts once it is
 * complete, and incomplete rows are muted and ignored".
 *
 * @param props - {@link ListFilterBuilderProps}.
 * @returns The filter builder UI, or a read-only summary for a non-DNF `where`.
 */
export function ListFilterBuilder(props: ListFilterBuilderProps): ReactNode {
  const dnf = useMemo(() => toDnf({ where: props.where }), [props.where]);
  const [draftGroups, setDraftGroups] = useState(() => dnf?.groups ?? []);
  const fieldPermissions = useFieldPermissions({
    resource: props.collection.slug,
    action: "read",
    scope: PERMISSION_SCOPES.any,
  });
  const dataFields = useMemo(() => {
    const base = getDataFields({ fields: props.collection.fields });
    const readable = Object.fromEntries(
      Object.entries(base).filter(([key]) => isFieldAllowed(fieldPermissions, key)),
    );
    if (!props.collection.versions.drafts) return readable;
    const statusField: AdminDataField = {
      type: "select",
      admin: { label: "Status" },
      options: Object.values(VERSION_STATUSES).map((status) => ({
        label: status.labels.singular,
        value: status.key,
      })),
    } as AdminDataField;
    return { ...readable, [FILTER_BUILDER_STATUS_FIELD_KEY]: statusField };
  }, [props.collection, fieldPermissions]);

  // TODO: implement
  // 1. `useEffect` resyncing `draftGroups` from `dnf.groups` whenever
  //    `props.where` changes and the new `toDnf` result differs from what
  //    THIS component last applied (track the last-applied `VexWhereNode`
  //    in a ref to tell "external change" apart from "my own onWhereChange
  //    round-trip"). Skip entirely while `dnf === null` (read-only branch).
  // 2. `dnf === null` → render a read-only panel: a muted card showing
  //    `JSON.stringify(props.where)` plus copy explaining the filter came
  //    from a config view and can't be edited here (Decision 10). Return
  //    early — no mutation handlers below apply to this branch.
  // 3. `applyDraft(nextGroups)`: `setDraftGroups(nextGroups)`, then build
  //    `appliedGroups` = `nextGroups` with each group's `rows` filtered to
  //    `isRowComplete(row)` and empty groups dropped, then
  //    `props.onWhereChange(fromDnf({ groups: appliedGroups }))` — called
  //    on every mutation, not debounced (Decision 10's "applies live";
  //    unlike the URL `q` param, Decision 9 names no debounce for filters).
  // 4. `isRowComplete(row: WhereDnfLeaf)`: `listFilterOpOf({ leaf: row })`
  //    is `"isEmpty"`/`"isNotEmpty"` → true (no value needed); else
  //    `row.value !== "" && row.value !== undefined && row.value !== null`.
  // 5. `draftGroups.length === 0` → render just a single "Add filter"
  //    `Button` that calls `handleAddGroup()` (step 10) to seed the first
  //    group/row.
  // 6. Otherwise render each `draftGroups[i]` as a bordered block:
  //    a. Between blocks, an "OR" divider (not before the first block).
  //    b. Within a block, each `rows[j]` as one row, `opacity-50` (muted)
  //       when `!isRowComplete(rows[j])`:
  //       - a field `Select` (options = `Object.entries(dataFields)`, value
  //         = `row.field`, label = `field.admin.label ?? key`, each item
  //         showing the field-type icon per DESIGN-NOTES §"field-type info
  //         in headers") calling `handleUpdateRow(i, j, { field: nextKey })`
  //         on change;
  //       - an operator `Select` (`FILTER_BUILDER_OP_LABELS` filtered by
  //         `filterBuilderOpsForFieldType({ type: dataFields[row.field].type })`,
  //         value = `listFilterOpOf({ leaf: row })`) calling
  //         `handleUpdateOp(i, j, nextOp)`;
  //       - when the resolved op is `isEmpty`/`isNotEmpty`, no value input;
  //         otherwise `renderFilterValueInput({ field: dataFields[row.field],
  //         value: row.value, onChange: (value) => handleUpdateRow(i, j,
  //         { value }) })` (below), plus — when `dataFields[row.field].type`
  //         is a text-like type and `row.op === "eq"` — a hint line "Exact
  //         match. Use search for partial text." under the row;
  //       - a remove-row icon `Button` calling `handleRemoveRow(i, j)`.
  //    c. After a block's rows, an "Add condition" `Button` (AND) calling
  //       `handleAddRow(i)`.
  // 7. After all blocks, an "Add OR group" `Button` calling `handleAddGroup()`.
  // 8. Every mutation handler rebuilds `draftGroups` immutably (never
  //    mutates in place), then calls `applyDraft(nextGroups)` (step 3).
  // 9. `handleAddGroup()`:
  //    a. `firstFieldKey = Object.keys(dataFields)[0]` — undefined when the
  //       collection has no readable data fields; guard the button disabled
  //       in that case instead of adding an unselectable row.
  //    b. New row: `{ field: firstFieldKey, op: "eq", value: "" }` — starts
  //       incomplete (empty string value), so it is muted and excluded from
  //       the applied `where` until the user types something.
  //    c. `applyDraft([...draftGroups, { rows: [newRow] }])`.
  // 10. `handleAddRow(groupIndex)`: same new-row default as step 9b,
  //     appended to `draftGroups[groupIndex].rows`; rebuild `draftGroups`
  //     with that one group replaced, then `applyDraft`.
  // 11. `handleRemoveRow(groupIndex, rowIndex)`: remove that row; if the
  //     group's `rows` would become empty, drop the whole group from
  //     `draftGroups` instead of keeping a row-less `{ rows: [] }` entry.
  // 12. `handleUpdateRow(groupIndex, rowIndex, patch: Partial<WhereDnfLeaf>)`:
  //     shallow-merge `patch` onto that row. Changing `field` additionally
  //     resets `op` to `"eq"` and `value` to the new field's empty default
  //     (`""` for text-like, `0` for `number`, `false` for `checkbox`,
  //     `undefined` for `date`) — a stale value/op typed for the PREVIOUS
  //     field must never be sent under the new field.
  // 13. `handleUpdateOp(groupIndex, rowIndex, op: ListFilterOp)`:
  //     `handleUpdateRow`'s row replaced via
  //     `applyListFilterOp({ leaf: row, op })` instead of a plain patch —
  //     this is what maps `"isEmpty"`/`"isNotEmpty"` onto the stored
  //     `eq`/`neq`-with-no-value leaf.
  //
  // Edge cases:
  // - Removing the last row of the last group calls `applyDraft([])`,
  //   which calls `props.onWhereChange(undefined)` via `fromDnf({ groups:
  //   [] })` — clearing the filter entirely; step 5 already renders the
  //   resulting empty state, so no special-case branch is needed.
  // - A collection with zero readable data fields (`Object.keys(dataFields)
  //   .length === 0`) disables "Add filter" / "Add OR group" / "Add
  //   condition" rather than adding a row with no selectable field.
  // - Switching the field on a row whose op is `isEmpty`/`isNotEmpty`
  //   resets `op` to `"eq"` too (step 12) — an empty check rarely still
  //   makes sense on a different field, and it keeps the reset rule single.
  throw new Error("Not implemented");
}

/**
 * Chooses the value control for one filter row by the selected field's
 * `type` — Decision 10's "value input chosen by field type". Never called
 * when the row's resolved operator is `isEmpty`/`isNotEmpty` (caller skips
 * it — see `ListFilterBuilder` step 6b).
 *
 * @param props - Input props.
 * @param props.field - The row's currently selected data field (or the
 *   synthetic `vex_status` field).
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
  //    `props.field.options` (`{ label, value }` pairs) — this also
  //    renders the synthetic `vex_status` field's value control, since it
  //    is typed `"select"` with `VERSION_STATUSES`-derived options.
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

#### packages/react/src/collections/listView/listBuiltinContributions.ts

1 edit — everything else (Step 9's row/bulk/header exports, Step 10's `listToolbarContributions`) unchanged.

**1 — new `listFiltersContributions` export, plus its import.** Add `ListFiltersAction` to the existing component imports, and append after `listToolbarContributions`:

```ts
import { ListFiltersAction } from "./ListFiltersAction";
```

```ts
/** `list.filters`' built-in contributions — just `vex.list.filters`. */
export function listFiltersContributions(): ComponentContributionInput<ReactHKT, Record<string, never>>[] {
  return [{ id: BUILTIN_CONTRIBUTION_IDS.list.filters, component: ListFiltersAction }];
}
```

#### packages/react/src/collections/listView/ListFiltersAction.tsx

New file — the `vex.list.filters` built-in. A thin wrapper forwarding `collection`/`where`/`onWhereChange` from `useCollectionList()`'s `collection`/`urlState.filter`/`urlState.setFilter` to the presentational `ListFilterBuilder` above.

```tsx
"use client";

import { useCollectionList } from "./CollectionListContext";
import { ListFilterBuilder } from "./ListFilterBuilder";

/**
 * The `vex.list.filters` built-in — renders {@link ListFilterBuilder} wired
 * to the active list's `collection` and `urlState.filter`/`urlState.setFilter`
 * from `useCollectionList()`. Takes no props of its own (Decision 37).
 *
 * @returns {@link ListFilterBuilder}.
 */
export function ListFiltersAction() {
  const list = useCollectionList();
  return (
    <ListFilterBuilder
      collection={list.collection}
      where={list.urlState.filter}
      onWhereChange={list.urlState.setFilter}
    />
  );
}
```

#### packages/react/src/collections/listView/ListFiltersAction.test.tsx

New file.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListFiltersAction } from "./ListFiltersAction";
import { CollectionListProvider } from "./CollectionListContext";
import { defineCollection, text } from "@vexcms/core";

const collection = defineCollection({ slug: "posts", fields: { title: text() } }) as never;

describe("ListFiltersAction", () => {
  it("renders ListFilterBuilder wired to the list context's collection and urlState.filter", () => {
    render(
      <CollectionListProvider
        value={{
          collection,
          urlState: { filter: undefined, setFilter: () => {} } as never,
          selection: { selectedIds: [], selectedDocs: [], setSelectedIds: () => {}, canDelete: false },
          density: "comfortable",
          onDensityChange: () => {},
          visibleColumns: [],
          onVisibleColumnsChange: () => {},
          hideableColumns: [],
          hasActiveView: false,
        }}
      >
        <ListFiltersAction />
      </CollectionListProvider>,
    );
    expect(screen.getByRole("button", { name: /filter/i })).toBeInTheDocument();
  });
});
```

#### packages/react/src/collections/listView/ListLayout.tsx

1 edit — everything else (the fixed-height shell, `list.header.actions`/`list.toolbar`/`list.beforeTable`/`list.afterTable` outlets, the row-actions menu) unchanged.

**1 — `list.filters`'s `SlotOutlet` call.** Replace Step 9's placeholder `builtins={[]}` with the real contribution, and import it:

```ts
import { listFiltersContributions } from "./listBuiltinContributions";
```

```tsx
      <SlotOutlet
        slotId={SLOT_IDS.list.filters}
        builtins={listFiltersContributions()}
        contributions={list.collection.admin.components?.filters as unknown as ComponentContributionInput<ReactHKT, unknown>[]}
        contributedProps={{}}
      />
```


#### packages/core/src/collections/listPreferenceCookies.ts

One edit to Step 10's file — everything else (the `density` cookie entry, `LIST_PREFERENCE_COOKIES`, `parseListPreferences`) unchanged.

**1 — `LIST_PREFERENCE_COOKIES`.** Beside the existing `density` entry, add the chips prefix:

```ts
  chipsVisible: "vex-list-chips",
```

**2 — cookie name helper.** Beside `listDensityCookieName` (or equivalent), add:

```ts
/**
 * Cookie name holding one collection's filter-chip-row visibility choice
 * (Decision 42) — scoped per collection, unlike `density`, because
 * visibility is a per-browser call about THIS collection's filters, not a
 * global list preference. Mirrors `livePreviewPanelCookieName`.
 *
 * @param props.collectionSlug - The collection the chip row belongs to.
 * @returns The fully-qualified cookie name, e.g. `vex-list-chips:posts`.
 */
export function listChipsVisibleCookieName(props: { collectionSlug: string }): string {
  return `${LIST_PREFERENCE_COOKIES.chipsVisible}:${props.collectionSlug}`;
}
```

**3 — `parseListPreferences`.** Alongside its existing `collectionSlug` parameter and `density` result field, read the chips cookie the same way — an explicit `"0"` hides the row, anything else (including absent) defaults to visible per Decision 10's "chips show by default":

```ts
    chipsVisible: props.cookies.get(listChipsVisibleCookieName({ collectionSlug: props.collectionSlug }))?.value !== "0",
```

#### packages/react/src/collections/listView/listPreferenceCookies.ts

One edit to Step 10's client-side cookie-writer file — everything else (`writeListDensityCookie`, the shared `writePreferenceCookie`/`readCookie` guards mirroring `useLivePreviewPanelState.ts`) unchanged.

**1 — chips-visible writer.** Beside `writeListDensityCookie`, add:

```ts
/**
 * Writes the filter-chip row's visibility cookie client-side (Decision 42)
 * — the write side of `parseListPreferences`'s `chipsVisible` field.
 *
 * @param props.collectionSlug - The collection the chip row belongs to.
 * @param props.visible - The new visibility to persist.
 */
export function writeListChipsVisibleCookie(props: { collectionSlug: string; visible: boolean }): void {
  writePreferenceCookie({
    name: listChipsVisibleCookieName({ collectionSlug: props.collectionSlug }),
    value: props.visible ? "1" : "0",
  });
}
```

#### packages/react/src/collections/listView/ListFilterChips.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { getDataFields, type CollectionConfig, type VexWhereNode } from "@vexcms/core";
import { Button, Badge } from "../../ui";
import { Icon } from "../../ui/Icon";
import { writeListChipsVisibleCookie } from "./listPreferenceCookies";
import {
  toDnf,
  fromDnf,
  listFilterOpOf,
  FILTER_BUILDER_STATUS_FIELD_KEY,
} from "./whereDnf";
import { FILTER_BUILDER_OP_LABELS } from "./ListFilterBuilder";

/** Props for {@link ListFilterChips}. */
export interface ListFilterChipsProps {
  /** The collection the list view renders — needed for field labels and the chips-visible cookie name. */
  collection: CollectionConfig;
  /** The list's current filter, in plain `VexWhereNode` form. Same prop as `ListFilterBuilder.where`. */
  where: VexWhereNode<string> | undefined;
  /** Replaces `where` wholesale — same contract as `ListFilterBuilder.onWhereChange`. */
  onWhereChange: (where: VexWhereNode<string> | undefined) => void;
  /**
   * The chip row's starting visibility, resolved server-side by
   * `CollectionListView`'s `initialPreferences` (Decision 39/42,
   * `parseListPreferences`). Seeds this component's own state so the first
   * client render already matches what the server sent — never
   * `useLocalStorage`, which has no value until after hydration and would
   * flip the chip row visible/hidden on first paint (Decision 42,
   * `layout-stability.md`).
   */
  initialVisible: boolean;
}

/**
 * The chip row under the toolbar showing Decision 10's active filter rows —
 * clear one, clear all, and an eye-icon toggle that hides the row per
 * browser, persisted to the `vex-list-chips:<collection>` cookie
 * (Decision 42) via `writeListChipsVisibleCookie` so a reload renders the
 * same state the user left. Renders nothing when `where` is `undefined` or
 * not in DNF form (`toDnf` returns `null` — a non-DNF config `where` has no
 * per-row chips to show; it still reaches the user via `ListFilterBuilder`'s
 * read-only panel and, for a config VIEW's hidden filter specifically, Step
 * 12's `ListHiddenFilterBadge`, which this component does not render).
 *
 * @param props - {@link ListFilterChipsProps}.
 * @returns The chip row, the collapsed toggle-only affordance, or `null`.
 */
export function ListFilterChips(props: ListFilterChipsProps): ReactNode {
  const [visible, setVisible] = useState(props.initialVisible);
  const dnf = useMemo(() => toDnf({ where: props.where }), [props.where]);
  const dataFields = useMemo(
    () => getDataFields({ fields: props.collection.fields }),
    [props.collection.fields],
  );

  function toggleVisible(): void {
    const next = !visible;
    setVisible(next);
    writeListChipsVisibleCookie({ collectionSlug: props.collection.slug, visible: next });
  }

  // TODO: implement
  // 1. `dnf === null || dnf.groups.length === 0` → return `null` — no
  //    filter, nothing to toggle.
  // 2. Render a row starting with the eye/eye-off icon `Button`
  //    (`aria-label="Hide filter chips"` / `"Show filter chips"`) calling
  //    `toggleVisible()`.
  // 3. `!visible` → stop after the toggle button (collapsed affordance,
  //    DESIGN-NOTES 05b).
  // 4. Otherwise, for every `(groupIndex, rowIndex)` pair in
  //    `dnf.groups`, a `Badge` chip reading `"{fieldLabel(row.field)}
  //    {FILTER_BUILDER_OP_LABELS[listFilterOpOf({ leaf: row })]}
  //    {formatChipValue(row)}"` (empty-op chips omit the value segment),
  //    with a small remove `×` button calling `handleRemoveRow(groupIndex,
  //    rowIndex)`.
  // 5. After the chips, a "Clear all" `Button` (ghost) calling
  //    `props.onWhereChange(undefined)`.
  // 6. `fieldLabel(field)`: `field === FILTER_BUILDER_STATUS_FIELD_KEY` →
  //    `"Status"`; else `dataFields[field]?.admin?.label ?? field`.
  // 7. `formatChipValue(row)`: relationship fields show the ID as-is (no
  //    document lookup here — Step 10's URL serializer already works at
  //    this granularity); `date` fields format via the same ISO formatting
  //    `ListFilterBuilder`'s `DateTimePicker` uses; everything else
  //    `String(row.value)`.
  // 8. `handleRemoveRow(groupIndex, rowIndex)` mirrors `ListFilterBuilder`'s
  //    own removal: drop that row; drop the whole group if it becomes
  //    empty; `props.onWhereChange(fromDnf({ groups: nextGroups }))`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListFilterChips.test.ts

```ts
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "@vexcms/core";
import { ListFilterChips } from "./ListFilterChips";

const collection = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }) },
});

function clearCookies(): void {
  document.cookie.split(";").forEach((entry) => {
    const name = entry.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  });
}

afterEach(() => {
  clearCookies();
});

describe("ListFilterChips", () => {
  it("renders nothing when where is undefined", () => {
    const { container } = render(
      <ListFilterChips
        collection={collection}
        where={undefined}
        onWhereChange={vi.fn()}
        initialVisible={true}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("starts collapsed when initialVisible is false, matching a cookie-hidden server render", () => {
    render(
      <ListFilterChips
        collection={collection}
        where={{ field: "title", op: "eq", value: "Hello" }}
        onWhereChange={vi.fn()}
        initialVisible={false}
      />,
    );
    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show filter chips" })).toBeInTheDocument();
  });

  it("Clear all replaces the whole filter with undefined", async () => {
    const user = userEvent.setup();
    const onWhereChange = vi.fn();
    render(
      <ListFilterChips
        collection={collection}
        where={{ field: "title", op: "eq", value: "Hello" }}
        onWhereChange={onWhereChange}
        initialVisible={true}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onWhereChange).toHaveBeenCalledWith(undefined);
  });

  it("the visibility toggle hides the chip row and persists through the vex-list-chips:<collection> cookie", async () => {
    const user = userEvent.setup();
    render(
      <ListFilterChips
        collection={collection}
        where={{ field: "title", op: "eq", value: "Hello" }}
        onWhereChange={vi.fn()}
        initialVisible={true}
      />,
    );
    expect(screen.getByRole("button", { name: "Hide filter chips" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide filter chips" }));

    expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show filter chips" })).toBeInTheDocument();
    expect(document.cookie).toContain("vex-list-chips:posts=0");
  });
});
```

#### packages/react/src/collections/listView/ListLayout.tsx

One edit to the composition-only file Step 10 creates — everything else unchanged.

**1 — the chip row.** Step 10's fixed-height shell (Decision 22) reserves a `shrink-0` row below the toolbar, below the `list.filters` outlet (`vex.list.filters` built-in, `listView/ListFiltersAction.tsx`), and before the `ScrollArea`/table. Add:

```tsx
<ListFilterChips
  collection={props.collection}
  where={listState.urlState.filter}
  onWhereChange={listState.urlState.setFilter}
  initialVisible={props.initialPreferences.chipsVisible}
/>
```

`listState` is `useCollectionList()`'s return value (Decision 37); its `urlState` slice carries `filter`/`setFilter` from `useListUrlState` (Step 10). `props.initialPreferences` is `ListLayout`'s existing prop (forwarded from `CollectionListView`'s own `initialPreferences`, Decision 39/42, through `parseListPreferences` server-side) — `ListFilterChips` is the only consumer of its `chipsVisible` field; `density` is read elsewhere in the toolbar (Step 10). `ListFilterChips` is imported from `./ListFilterChips` beside `ListLayout.tsx`'s existing slot/component imports. It renders `null` (no height) when there is no filter, so an empty filter never reserves blank space in the fixed-height layout.

Verify: `pnpm --filter @vexcms/core test -- collections/listPreferenceCookies && pnpm --filter @vexcms/react test -- collections/listView/whereDnf collections/listView/ListFilterBuilder collections/listView/ListFilterChips && browser: hard reload with chips cookie hidden shows no chip row on first paint; OR group round-trips through URL reload; isEmpty/isNotEmpty row applies and chips show "is empty"/"is not empty"; vex_status filters on a versioned collection; an unreadable field never appears in the field picker`

### Step 12 — Saved views: tabs, modified state, hidden filters, server prerender [agent]

Why: saved views live in `collections/listView/` (Decision 21) as `ListViewTabs` /
`ListSaveViewDialog` / `ListHiddenFilterBadge` / `listViewStore` / `useListViews`.
`useListViews` exposes `composeQueryWhere` — the one place a config view's hidden filter
(never read by any other UI surface) folds back in with the caller's own filter via the core
`composeViewWhere` helper (Step 5), since `find`/`search` take no `view` argument. Tabs sit
above the table (Decision 11), with a modified-state diff with Save/Reset, a hidden-filter
lock badge, and a `description` field. Wired to Step 10's flat `useListUrlState` setters and
Step 5's nested-`state`, client-safe view types.

Local views must render on the server with zero layout shift: `listViewStore.ts` mirrors its
`{ viewId, name }` index into a cookie on every mutation (Decision 41), `useListViews` accepts
server-fetched `initialViews`/`initialLocalIndex` instead of always starting from an empty
query cache, and `ListViewTabs`' tab overflow uses a fixed `@container/list` CSS breakpoint
(Decision 43) rather than measurement, so the server-rendered tab strip is already the final
one. Step 14 owns reading the cookie and calling `vexConvexApi.listViews` on the server and
passing the results down through `CollectionListView`; this step owns writing the cookie and
consuming those initial values.

- [ ] `packages/core/src/collections/listViewsCookie.ts` (new) + test — `listViewsCookieName`, `parseListViewsIndexCookie` (core, shared with Step 14's server read)
- [ ] `packages/react/src/collections/listView/listViewStore.ts` (new) + test — `localViewsStorageKey`, `useLocalViews`; writes the `vex-list-views:<collection>` cookie index alongside every localStorage mutation; prunes stale cookie entries after hydration
- [ ] `packages/react/src/collections/listView/useListViews.ts` (new) + test — merges `config`/`shared`/`local` views by `viewId`; accepts `initialViews`/`initialLocalIndex`, seeding the shared-views query and the first local-index render from them; exposes `composeQueryWhere`
- [ ] `packages/react/src/collections/listView/ListViewTabs.tsx` (new) + test — tabs above the table; a fixed, CSS-driven visible-tab count per `@container/list` breakpoint; accepts `initialLocalIndex` so the first local-view tabs render without a `localStorage` read
- [ ] `packages/react/src/collections/listView/ListSaveViewDialog.tsx` (new) + test — save new / rename, shared-vs-local scope gated by `createView`/`updateView`
- [ ] `packages/react/src/collections/listView/ListHiddenFilterBadge.tsx` (new) + test — lock badge + count, never a chip or builder row
- [ ] `packages/react/src/collections/index.ts` (edit) — barrel export for the three new components
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` (Step 9's file) — mounts `ListViewTabs` above the toolbar, forwarding `initialViews`/`initialLocalIndex` from `CollectionListView`'s props
- [ ] `packages/react/src/collections/listView/ListToolbar.tsx` (Step 10's file) — mounts `ListHiddenFilterBadge` beside the filter chips

#### packages/core/src/collections/listViewsCookie.ts

```ts
const LIST_VIEWS_COOKIE_PREFIX = "vex-list-views:";

/** One local view's entry in the cookie index (Decision 41) — deliberately NOT the full `VexViewConfig`; only enough to render a tab. */
export interface ListViewsIndexEntry {
  viewId: string;
  name: string;
}

/**
 * Cookie name holding one collection's local saved-view index.
 *
 * Lives in `@vexcms/core`, not beside `listViewStore.ts`, because both
 * sides of the boundary need it: the server component that reads the
 * cookie (`NextAdminPage`, Step 14) and the client store that writes it.
 * The store's module carries `"use client"`, which would make every
 * export in it unreachable from the server — the same reasoning as
 * `livePreviewPanelCookieName`.
 *
 * @param props.collection - The collection slug the cookie is scoped to.
 * @returns The fully-qualified cookie name.
 */
export function listViewsCookieName(props: { collection: string }): string {
  return `${LIST_VIEWS_COOKIE_PREFIX}${props.collection}`;
}

/**
 * Parses a `listViewsCookieName` cookie's value into its local-view index
 * (Decision 41). Tolerant of a missing, malformed, or stale-shaped cookie —
 * a bad index degrades to "no local view tabs on first paint" (the store
 * still hydrates the real list from `localStorage` moments later), never a
 * server render error.
 *
 * @param props.cookieValue - The raw cookie value, or `undefined` when unset.
 * @returns The index entries, or `[]` when the cookie is unset or malformed.
 */
export function parseListViewsIndexCookie(props: { cookieValue: string | undefined }): ListViewsIndexEntry[] {
  if (props.cookieValue === undefined) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(props.cookieValue));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const entries: ListViewsIndexEntry[] = [];
  for (const item of parsed) {
    if (
      item !== null &&
      typeof item === "object" &&
      typeof (item as { viewId?: unknown }).viewId === "string" &&
      typeof (item as { name?: unknown }).name === "string"
    ) {
      entries.push({ viewId: (item as ListViewsIndexEntry).viewId, name: (item as ListViewsIndexEntry).name });
    }
  }
  return entries;
}
```

#### packages/core/src/collections/listViewsCookie.test.ts

```ts
import { describe, expect, it } from "vitest";
import { listViewsCookieName, parseListViewsIndexCookie } from "./listViewsCookie";

describe("listViewsCookieName", () => {
  it("scopes the cookie per collection", () => {
    expect(listViewsCookieName({ collection: "posts" })).toBe("vex-list-views:posts");
  });
});

describe("parseListViewsIndexCookie", () => {
  it("returns [] when the cookie is unset", () => {
    expect(parseListViewsIndexCookie({ cookieValue: undefined })).toEqual([]);
  });

  it("parses a valid index", () => {
    const value = encodeURIComponent(JSON.stringify([{ viewId: "v1", name: "My View" }]));
    expect(parseListViewsIndexCookie({ cookieValue: value })).toEqual([{ viewId: "v1", name: "My View" }]);
  });

  it("drops malformed entries instead of throwing", () => {
    const value = encodeURIComponent(JSON.stringify([{ viewId: "v1", name: "Ok" }, { viewId: 5 }, "garbage"]));
    expect(parseListViewsIndexCookie({ cookieValue: value })).toEqual([{ viewId: "v1", name: "Ok" }]);
  });

  it("returns [] for malformed JSON instead of throwing", () => {
    expect(parseListViewsIndexCookie({ cookieValue: "{not json" })).toEqual([]);
  });

  it("returns [] when the parsed value is not an array", () => {
    const value = encodeURIComponent(JSON.stringify({ foo: "bar" }));
    expect(parseListViewsIndexCookie({ cookieValue: value })).toEqual([]);
  });
});
```

#### packages/react/src/collections/listView/listViewStore.ts

```ts
"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { VexViewConfig } from "@vexcms/core";
import { listViewsCookieName, parseListViewsIndexCookie, type ListViewsIndexEntry } from "@vexcms/core";

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
const LIST_VIEWS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

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
 * A view is `VexViewConfig`'s shape (Decision 25's nested `state`): `{
 * viewId, name, description?, state: { where?, sort?, search?,
 * searchField?, columns?, pageSize? } }`.
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

/**
 * Mirrors `views` into the `listViewsCookieName({ collection })` cookie as
 * a `{ viewId, name }[]` index (Decision 41), so the server can render the
 * local-view tabs on first paint without touching `localStorage`. Swallows
 * a blocked/unavailable `document.cookie` the same way `writeLocalViews`
 * swallows a blocked `localStorage` — losing the server-prerendered tab is
 * not worth crashing the write.
 *
 * @param props.collection - The collection slug the cookie is scoped to.
 * @param props.views - The full local view list to mirror.
 */
function writeListViewsCookie(props: { collection: string; views: VexViewConfig[] }): void {
  if (typeof document === "undefined") return;
  const index: ListViewsIndexEntry[] = props.views.map((view) => ({ viewId: view.viewId, name: view.name }));
  const name = listViewsCookieName({ collection: props.collection });
  try {
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(index))}; path=/; max-age=${LIST_VIEWS_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  } catch {
    // document.cookie can throw under Safari private mode / strict cookie
    // settings; losing the server-prerendered tab is not worth crashing the view.
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
  writeListViewsCookie({ collection: props.collection, views: props.views });
  window.dispatchEvent(new Event(LOCAL_VIEWS_EVENT));
}

/**
 * Saves (inserts or, on a matching `viewId`, replaces in place) one view
 * into this browser's local store for `props.collection`, and mirrors the
 * updated index into the `vex-list-views:<collection>` cookie (Decision 41).
 *
 * @param props.project - The Convex deployment URL (`useListViews()`'s `project`).
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
 * `props.collection`, and mirrors the updated index into the cookie
 * (Decision 41). A no-op when no local view has that `viewId`.
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
 * On mount, once `localStorage` is readable, prunes any `vex-list-views:
 * <collection>` cookie entry whose `viewId` no longer has a matching
 * `localStorage` view (Decision 41's accepted tradeoff: a stale cookie
 * entry — e.g. cleared `localStorage`, or another device's index — shows
 * its tab until this hydration pass, then is pruned).
 *
 * @param props.project - The Convex deployment URL this browser is pointed at.
 * @param props.collection - The collection slug.
 * @returns The current local views for `props.collection`.
 */
export function useLocalViews(props: { project: string; collection: string }): VexViewConfig[] {
  const views = useSyncExternalStore(
    subscribe,
    useCallback(() => readLocalViews(props), [props.project, props.collection]),
    getServerSnapshot,
  );
  pruneStaleListViewsCookie({ collection: props.collection, views });
  return views;
}

const prunedForKey = new Set<string>();

function pruneStaleListViewsCookie(props: { collection: string; views: VexViewConfig[] }): void {
  if (typeof document === "undefined") return;
  if (prunedForKey.has(props.collection)) return;
  prunedForKey.add(props.collection);
  const name = listViewsCookieName({ collection: props.collection });
  const prefix = `${name}=`;
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
  const cookieIndex = parseListViewsIndexCookie({ cookieValue: raw });
  if (cookieIndex.length === 0) return;
  const localIds = new Set(props.views.map((view) => view.viewId));
  const stale = cookieIndex.some((entry) => !localIds.has(entry.viewId));
  if (stale) writeListViewsCookie({ collection: props.collection, views: props.views });
}
```

#### packages/react/src/collections/listView/listViewStore.test.ts

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { listViewsCookieName, parseListViewsIndexCookie } from "@vexcms/core";
import {
  generateViewId,
  localViewsStorageKey,
  removeLocalView,
  saveLocalView,
  useLocalViews,
} from "./listViewStore";

const project = "https://example.convex.cloud";
const collection = "posts";

function readListViewsCookie(): ReturnType<typeof parseListViewsIndexCookie> {
  const name = listViewsCookieName({ collection });
  const prefix = `${name}=`;
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
  return parseListViewsIndexCookie({ cookieValue: raw });
}

function clearCookies() {
  document.cookie
    .split("; ")
    .map((entry) => entry.split("=")[0])
    .filter((name): name is string => !!name)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0`;
    });
}

beforeEach(() => {
  window.localStorage.clear();
  clearCookies();
});

afterEach(() => {
  window.localStorage.clear();
  clearCookies();
});

describe("listViewStore", () => {
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
    saveLocalView({
      project,
      collection,
      view: { viewId: "v1", name: "Renamed", description: "Updated", state: {} },
    });

    const { result } = renderHook(() => useLocalViews({ project, collection }));
    expect(result.current).toEqual([{ viewId: "v1", name: "Renamed", description: "Updated", state: {} }]);
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
    saveLocalView({ project: "https://a.convex.cloud", collection, view: { viewId: "v1", name: "A", state: {} } });
    saveLocalView({ project: "https://b.convex.cloud", collection, view: { viewId: "v1", name: "B", state: {} } });

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

  it("mirrors saveLocalView into the vex-list-views cookie index", () => {
    act(() => {
      saveLocalView({ project, collection, view: { viewId: "v1", name: "My View", state: {} } });
    });
    expect(readListViewsCookie()).toEqual([{ viewId: "v1", name: "My View" }]);
  });

  it("mirrors removeLocalView into the cookie index", () => {
    saveLocalView({ project, collection, view: { viewId: "v1", name: "A", state: {} } });
    saveLocalView({ project, collection, view: { viewId: "v2", name: "B", state: {} } });
    act(() => {
      removeLocalView({ project, collection, viewId: "v1" });
    });
    expect(readListViewsCookie()).toEqual([{ viewId: "v2", name: "B" }]);
  });

  it("prunes a stale cookie entry whose localStorage view is gone, on hydration", () => {
    document.cookie = `${listViewsCookieName({ collection })}=${encodeURIComponent(
      JSON.stringify([{ viewId: "ghost", name: "Ghost" }]),
    )}; path=/`;
    renderHook(() => useLocalViews({ project, collection }));
    expect(readListViewsCookie()).toEqual([]);
  });
});
```

#### packages/react/src/collections/listView/useListViews.ts

```ts
"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import {
  composeViewWhere,
  toClientViewConfig,
  VEX_VIEW_SOURCES,
  type CollectionSlug,
  type VexClientViewConfig,
  type VexStoredView,
  type VexViewConfig,
  type VexViewSource,
} from "@vexcms/core";
import type { ListViewsIndexEntry } from "@vexcms/core";
import { listViews } from "../../client";
import { useVexConfig } from "../../config/VexConfigContext";
import { useLocalViews } from "./listViewStore";

/** One merged saved view, display-ready. */
export interface ListViewEntry<TFieldSlug extends string = string> {
  viewId: string;
  name: string;
  description?: string;
  where: VexViewConfig<TFieldSlug>["state"]["where"];
  sort: VexViewConfig<TFieldSlug>["state"]["sort"];
  search?: string;
  searchField?: TFieldSlug;
  columns?: TFieldSlug[];
  pageSize?: number;
  source: VexViewSource;
  createdBy?: string;
  hasHiddenFilter: boolean;
  hiddenFilterCount: number;
}

export interface ListViewStateSnapshot<TFieldSlug extends string = string> {
  search: string | undefined;
  searchField: TFieldSlug | undefined;
  sort: VexViewConfig<TFieldSlug>["state"]["sort"];
  where: VexViewConfig<TFieldSlug>["state"]["where"];
  columns: TFieldSlug[];
  pageSize: number;
}

/** Props for {@link useListViews}. */
export interface UseListViewsProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  collection: TCollectionSlug;
  /**
   * The shared views `NextAdminPage` prefetched server-side (Decision 39,
   * Step 14) — seeds `useQuery`'s `initialData`, so the first client render
   * reuses the server's `listViews` result instead of starting `isPending`.
   * `undefined` on a client-only mount (tests, Storybook).
   */
  initialViews?: VexStoredView[];
  /**
   * The `vex-list-views:<collection>` cookie's local-view index, read on
   * the server (Decision 41, Step 14) — tabs for these render on first
   * paint even before `localStorage` hydrates. Entries here carry only
   * `{ viewId, name }`; `useLocalViews`'s real `localStorage` read
   * supersedes this the moment it resolves client-side.
   */
  initialLocalIndex?: ListViewsIndexEntry[];
}

/** Return shape of {@link useListViews}. */
export interface UseListViewsResult<TFieldSlug extends string = string> {
  views: ListViewEntry<TFieldSlug>[];
  project: string;
  isPending: boolean;
  composeQueryWhere: (props: {
    activeViewId: string | undefined;
    filter: VexViewConfig<TFieldSlug>["state"]["where"];
  }) => VexViewConfig<TFieldSlug>["state"]["where"];
}

function toEntry<TFieldSlug extends string>(props: {
  view: (VexStoredView<TFieldSlug> | VexViewConfig<TFieldSlug>) & { createdBy?: string };
  source: Exclude<VexViewSource, "config">;
}): ListViewEntry<TFieldSlug> {
  return {
    viewId: props.view.viewId,
    name: props.view.name,
    description: props.view.description,
    where: props.view.state.where,
    sort: props.view.state.sort,
    search: props.view.state.search,
    searchField: props.view.state.searchField,
    columns: props.view.state.columns,
    pageSize: props.view.state.pageSize,
    source: props.source,
    createdBy: props.view.createdBy,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
}

/** A bare `{ viewId, name }` index entry, projected into display shape until the real local view loads. */
function toIndexEntry<TFieldSlug extends string>(entry: ListViewsIndexEntry): ListViewEntry<TFieldSlug> {
  return {
    viewId: entry.viewId,
    name: entry.name,
    where: undefined,
    sort: undefined,
    source: VEX_VIEW_SOURCES.local,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
}

function mergeListViews<TFieldSlug extends string>(props: {
  config: VexClientViewConfig<TFieldSlug>[];
  shared: VexStoredView<TFieldSlug>[];
  local: VexViewConfig<TFieldSlug>[];
  localIndex: ListViewsIndexEntry[];
}): ListViewEntry<TFieldSlug>[] {
  const merged = new Map<string, ListViewEntry<TFieldSlug>>();
  for (const view of props.shared) merged.set(view.viewId, toEntry({ view, source: VEX_VIEW_SOURCES.shared }));
  // The cookie index (Decision 41) fills in tabs for local views that
  // haven't hydrated from `localStorage` yet — before hydration,
  // `props.local` is `[]`, so without this every local-view tab would
  // flash in after mount, which is the layout shift this spec eliminates.
  for (const entry of props.localIndex) {
    if (!merged.has(entry.viewId)) merged.set(entry.viewId, toIndexEntry(entry));
  }
  for (const view of props.local) {
    if (!merged.has(view.viewId) || merged.get(view.viewId)?.source === VEX_VIEW_SOURCES.local) {
      merged.set(view.viewId, toEntry({ view, source: VEX_VIEW_SOURCES.local }));
    }
  }
  for (const view of props.config) {
    if (!merged.has(view.viewId)) {
      merged.set(view.viewId, {
        viewId: view.viewId,
        name: view.name,
        description: view.description,
        where: undefined,
        sort: view.state.sort,
        search: view.state.search,
        searchField: view.state.searchField,
        columns: view.state.columns,
        pageSize: view.state.pageSize,
        source: VEX_VIEW_SOURCES.config,
        hasHiddenFilter: view.hasHiddenFilter,
        hiddenFilterCount: view.hiddenFilterCount,
      });
    }
  }
  return [...merged.values()];
}

/**
 * Reads and merges a collection's saved views: `config` (`admin.table.views`,
 * read straight off the bundled client config and projected through
 * `toClientViewConfig` right here, client-side — Decision 25), `shared`
 * (`vex_views`, live-subscribed via `listViews`, seeded from
 * `props.initialViews` when the server prefetched it — Decision 39), and
 * `local` (this browser's `localStorage` via `useLocalViews`, seeded for
 * first paint by `props.initialLocalIndex`'s cookie-backed index —
 * Decision 41) — Decision 11.
 *
 * @param props - See {@link UseListViewsProps}.
 * @returns The merged view list, the current project key, whether the
 *   shared-views query is still pending, and `composeQueryWhere`.
 */
export function useListViews<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
>(props: UseListViewsProps<TCollectionSlug>): UseListViewsResult<TFieldSlug> {
  const config = useVexConfig();
  const convex = useConvex();
  const collection = config.collections.find((c) => c.slug === props.collection);
  const rawConfigViews = useMemo(
    () => (collection?.admin.table.views ?? []) as VexViewConfig<TFieldSlug>[],
    [collection?.admin.table.views],
  );
  const configViews = useMemo(
    () => rawConfigViews.map((view) => toClientViewConfig(view)) as VexClientViewConfig<TFieldSlug>[],
    [rawConfigViews],
  );

  const sharedQuery = useQuery({
    ...listViews({ collection: props.collection }),
    initialData: props.initialViews as VexStoredView<TFieldSlug>[] | undefined,
  });
  const sharedViews = (sharedQuery.data ?? []) as VexStoredView<TFieldSlug>[];

  const localViews = useLocalViews({
    project: convex.url,
    collection: props.collection,
  }) as VexViewConfig<TFieldSlug>[];

  const views = useMemo(
    () =>
      mergeListViews({
        config: configViews,
        shared: sharedViews,
        local: localViews,
        localIndex: props.initialLocalIndex ?? [],
      }),
    [configViews, sharedViews, localViews, props.initialLocalIndex],
  );

  const composeQueryWhere = useCallback(
    (composeProps: {
      activeViewId: string | undefined;
      filter: VexViewConfig<TFieldSlug>["state"]["where"];
    }): VexViewConfig<TFieldSlug>["state"]["where"] => {
      const rawView = rawConfigViews.find((view) => view.viewId === composeProps.activeViewId);
      return composeViewWhere({ viewWhere: rawView?.state.where, filter: composeProps.filter });
    },
    [rawConfigViews],
  );

  return { views, project: convex.url, isPending: sharedQuery.isPending, composeQueryWhere };
}

/** How the active view's state diverges from its saved baseline — drives the modified-state Save/Reset UI. */
export type ListViewDiffCategory = "search" | "sort" | "filters" | "columns" | "pageSize";

export interface ListViewDiff {
  categories: ListViewDiffCategory[];
  filterCount: number;
}

function countWhereConditions(node: unknown): number {
  if (node === undefined || node === null) return 0;
  if (typeof node === "object") {
    if ("and" in node) return (node as { and: unknown[] }).and.reduce((sum: number, c) => sum + countWhereConditions(c), 0);
    if ("or" in node) return (node as { or: unknown[] }).or.reduce((sum: number, c) => sum + countWhereConditions(c), 0);
    if ("not" in node) return countWhereConditions((node as { not: unknown }).not);
  }
  return 1;
}

export function diffViewState<TFieldSlug extends string>(props: {
  current: ListViewStateSnapshot<TFieldSlug>;
  saved: ListViewEntry<TFieldSlug>;
}): ListViewDiff {
  const categories: ListViewDiffCategory[] = [];
  if (props.current.search !== props.saved.search || props.current.searchField !== props.saved.searchField) {
    categories.push("search");
  }
  if (
    props.current.sort?.field !== props.saved.sort?.field ||
    props.current.sort?.order !== props.saved.sort?.order
  ) {
    categories.push("sort");
  }
  if (JSON.stringify(props.current.where ?? null) !== JSON.stringify(props.saved.where ?? null)) {
    categories.push("filters");
  }
  const currentColumns = [...props.current.columns].sort();
  const savedColumns = [...(props.saved.columns ?? [])].sort();
  if (JSON.stringify(currentColumns) !== JSON.stringify(savedColumns)) categories.push("columns");
  if (props.saved.pageSize !== undefined && props.current.pageSize !== props.saved.pageSize) {
    categories.push("pageSize");
  }
  return { categories, filterCount: countWhereConditions(props.current.where) };
}

export interface ListShareParams<TFieldSlug extends string = string> {
  view: undefined;
  q: string | undefined;
  qf: TFieldSlug | undefined;
  sort: VexViewConfig<TFieldSlug>["state"]["sort"];
  filter: VexViewConfig<TFieldSlug>["state"]["where"];
  size: number;
}

export function resolveListShareParams<TFieldSlug extends string>(props: {
  activeView: ListViewEntry<TFieldSlug> | undefined;
  state: ListViewStateSnapshot<TFieldSlug>;
}): ListShareParams<TFieldSlug> | undefined {
  if (props.activeView?.source !== VEX_VIEW_SOURCES.local) return undefined;
  return {
    view: undefined,
    q: props.state.search,
    qf: props.state.searchField,
    sort: props.state.sort,
    filter: props.state.where,
    size: props.state.pageSize,
  };
}
```

#### packages/react/src/collections/listView/useListViews.test.ts

```ts
import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineCollection, defineConfig, text, vexConvexApi, type VexStoredView } from "@vexcms/core";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";
import { VexConfigProvider } from "../../config/VexConfigContext";
import { saveLocalView } from "./listViewStore";
import { diffViewState, resolveListShareParams, useListViews, type ListViewEntry } from "./useListViews";

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

let sharedViewRows: VexStoredView[] = [];
let sharedViewsPending = false;

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown; initialData?: unknown }) =>
      options.__reference === vexConvexApi.listViews
        ? { data: options.initialData ?? sharedViewRows, isPending: options.initialData !== undefined ? false : sharedViewsPending }
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

describe("useListViews", () => {
  it("merges config, shared, and local views, tagging each with its source", () => {
    sharedViewRows = [{ viewId: "shared1", name: "Shared View", collection: "posts", createdBy: "user1", state: {} }];
    saveLocalView({ project, collection: "posts", view: { viewId: "local1", name: "Local View", state: {} } });

    const { result } = renderHook(() => useListViews({ collection: "posts" }), { wrapper });

    expect(result.current.views.map((v) => v.viewId)).toEqual(["shared1", "local1", "cfg1"]);
    expect(result.current.views.find((v) => v.viewId === "local1")?.source).toBe("local");
    expect(result.current.project).toBe(project);
  });

  it("dedupes by viewId, keeping the shared entry over a stale local one (promotion race)", () => {
    sharedViewRows = [{ viewId: "v1", name: "Promoted View", collection: "posts", createdBy: "user1", state: {} }];
    saveLocalView({ project, collection: "posts", view: { viewId: "v1", name: "Stale Local Copy", state: {} } });

    const { result } = renderHook(() => useListViews({ collection: "posts" }), { wrapper });

    expect(result.current.views).toHaveLength(2);
    expect(result.current.views.find((view) => view.viewId === "v1")?.name).toBe("Promoted View");
    expect(result.current.views.find((view) => view.viewId === "v1")?.source).toBe("shared");
  });

  it("reports isPending from the shared views query when no initialViews is given", () => {
    sharedViewsPending = true;
    const { result } = renderHook(() => useListViews({ collection: "posts" }), { wrapper });
    expect(result.current.isPending).toBe(true);
  });

  it("seeds the shared views query from initialViews and reports isPending false immediately", () => {
    sharedViewsPending = true; // would be pending if initialData were ignored
    const initialViews: VexStoredView[] = [
      { viewId: "s1", name: "Server Seeded", collection: "posts", createdBy: "user1", state: {} },
    ];
    const { result } = renderHook(() => useListViews({ collection: "posts", initialViews }), { wrapper });
    expect(result.current.isPending).toBe(false);
    expect(result.current.views.find((v) => v.viewId === "s1")?.name).toBe("Server Seeded");
  });

  it("renders a tab for a cookie-indexed local view before localStorage hydrates it", () => {
    // No saveLocalView call — this view exists only via the cookie index,
    // simulating the first server-rendered paint (Decision 41).
    const { result } = renderHook(
      () => useListViews({ collection: "posts", initialLocalIndex: [{ viewId: "local-cookie", name: "Cookie Tab" }] }),
      { wrapper },
    );
    const entry = result.current.views.find((v) => v.viewId === "local-cookie");
    expect(entry).toEqual({
      viewId: "local-cookie",
      name: "Cookie Tab",
      where: undefined,
      sort: undefined,
      source: "local",
      hasHiddenFilter: false,
      hiddenFilterCount: 0,
    });
  });

  it("supersedes a cookie-indexed entry with the real localStorage view once hydrated", () => {
    saveLocalView({
      project,
      collection: "posts",
      view: { viewId: "local1", name: "Real Name", description: "desc", state: { pageSize: 50 } },
    });
    const { result } = renderHook(
      () => useListViews({ collection: "posts", initialLocalIndex: [{ viewId: "local1", name: "Cookie Stub Name" }] }),
      { wrapper },
    );
    const entry = result.current.views.find((v) => v.viewId === "local1");
    expect(entry?.name).toBe("Real Name");
    expect(entry?.pageSize).toBe(50);
  });
});

describe("composeQueryWhere", () => {
  const viewWhere = { field: "featured", op: "eq" as const, value: true };
  const configWithHiddenFilter = defineConfig({
    collections: [
      defineCollection({
        slug: "posts",
        fields: { title: text() },
        admin: { table: { views: [{ viewId: "cfg2", name: "Featured", state: { where: viewWhere } }] } },
      }),
    ],
  });

  function hiddenFilterWrapper({ children }: { children: ReactNode }) {
    return createElement(VexConfigProvider, { config: configWithHiddenFilter }, children);
  }

  it("returns the caller's filter unchanged when no view is active", () => {
    const { result } = renderHook(() => useListViews({ collection: "posts" }), { wrapper: hiddenFilterWrapper });
    const filter = { field: "status", op: "eq" as const, value: "live" };
    expect(result.current.composeQueryWhere({ activeViewId: undefined, filter })).toEqual(filter);
  });

  it("folds a config view's hidden where into the caller's filter", () => {
    const { result } = renderHook(() => useListViews({ collection: "posts" }), { wrapper: hiddenFilterWrapper });
    const filter = { field: "status", op: "eq" as const, value: "live" };
    expect(result.current.composeQueryWhere({ activeViewId: "cfg2", filter })).toEqual({ and: [viewWhere, filter] });
  });
});

describe("diffViewState", () => {
  const saved: ListViewEntry = {
    viewId: "v1",
    name: "Saved",
    source: "shared",
    where: { field: "featured", op: "eq", value: true },
    sort: { field: "rating", order: "desc" },
    search: "ma",
    searchField: "authorName",
    columns: ["title", "rating"],
    pageSize: 25,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };

  it("reports no categories when the live state matches the saved view exactly", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "desc" },
        where: { field: "featured", op: "eq", value: true },
        columns: ["rating", "title"],
        pageSize: 25,
      },
      saved,
    });
    expect(diff.categories).toEqual([]);
  });

  it("detects a sort change", () => {
    const diff = diffViewState({
      current: {
        search: "ma",
        searchField: "authorName",
        sort: { field: "rating", order: "asc" },
        where: saved.where,
        columns: saved.columns ?? [],
        pageSize: 25,
      },
      saved,
    });
    expect(diff.categories).toEqual(["sort"]);
  });
});

describe("resolveListShareParams", () => {
  it("returns undefined when the active view is not local", () => {
    const result = resolveListShareParams({
      activeView: { viewId: "cfg1", name: "Config", source: "config", where: undefined, sort: undefined, hasHiddenFilter: false, hiddenFilterCount: 0 },
      state: { search: undefined, searchField: undefined, sort: undefined, where: undefined, columns: [], pageSize: 25 },
    });
    expect(result).toBeUndefined();
  });

  it("serializes full state when the active view is local", () => {
    const result = resolveListShareParams({
      activeView: { viewId: "local1", name: "Local", source: "local", where: undefined, sort: { field: "rating", order: "desc" }, hasHiddenFilter: false, hiddenFilterCount: 0 },
      state: { search: "ma", searchField: "authorName", sort: { field: "rating", order: "desc" }, where: undefined, columns: [], pageSize: 25 },
    });
    expect(result).toEqual({ view: undefined, q: "ma", qf: "authorName", sort: { field: "rating", order: "desc" }, filter: undefined, size: 25 });
  });
});
```

#### packages/react/src/collections/listView/ListViewTabs.tsx

Decision 43: tab overflow is a fixed count per `@container/list` breakpoint, not
measurement, like the toolbar's CSS collapse, so the
server-rendered tab strip never reflows after hydration. The `TAB_VISIBLE_COUNT_BY_BREAKPOINT`
table below (not a measurement) picks how many tabs show inline; the rest render in a
`<div className="hidden @sm/list:block @md/list:hidden">`-style CSS-only overflow count. The
component accepts `initialLocalIndex` (from `CollectionListView`'s props, forwarded by
`ListLayout`) and passes it straight to `useListViews`, so a local view's tab is present on the
very first render — never only after `useLocalViews` hydrates.

```tsx
"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { VEX_VIEW_SOURCES, VIEW_ACTIONS, type CollectionSlug, type ListViewsIndexEntry, type VexStoredView, type VexViewSource } from "@vexcms/core";
import { removeView, saveView } from "../../client";
import { usePermission } from "../../access";
import { getVexErrorMessage } from "../../utils/errors";
import { generateViewId, removeLocalView, saveLocalView } from "./listViewStore";
import {
  diffViewState,
  useListViews,
  type ListViewDiff,
  type ListViewDiffCategory,
  type ListViewEntry,
  type ListViewStateSnapshot,
} from "./useListViews";
import { ListSaveViewDialog, type ListSaveViewTarget } from "./ListSaveViewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollSection,
  Tabs,
  TabsList,
  TabsTrigger,
} from "../../ui";

const ALL_TAB_ID = "__all__";

const TAB_DISPLAY_ORDER: Record<VexViewSource, number> = {
  [VEX_VIEW_SOURCES.config]: 0,
  [VEX_VIEW_SOURCES.shared]: 1,
  [VEX_VIEW_SOURCES.local]: 2,
};

const DIFF_LABELS: Record<Exclude<ListViewDiffCategory, "filters">, string> = {
  search: "search",
  sort: "sort",
  columns: "columns",
  pageSize: "rows per load",
};

function formatDiffLabel(diff: ListViewDiff | undefined): string {
  if (diff === undefined) return "";
  return diff.categories
    .map((category) =>
      category === "filters" ? `${diff.filterCount} filter${diff.filterCount === 1 ? "" : "s"}` : DIFF_LABELS[category],
    )
    .join(", ");
}

function sortViewsForDisplay<TFieldSlug extends string>(
  views: ListViewEntry<TFieldSlug>[],
): ListViewEntry<TFieldSlug>[] {
  return [...views].sort((a, b) => TAB_DISPLAY_ORDER[a.source] - TAB_DISPLAY_ORDER[b.source]);
}

/**
 * Fixed per-`@container/list`-width visible tab counts (Decision 43) —
 * NEVER `ResizeObserver`-measured, so the server render is the final
 * render. Indexed smallest-first; `visibleTabCount` picks the last
 * breakpoint whose min-width the container has reached, approximated at
 * render time via CSS `@container` classes rather than a JS media query,
 * so this table only documents the counts the CSS below encodes.
 */
const TAB_VISIBLE_COUNT_BY_BREAKPOINT = [
  { containerQuery: "base", count: 2 },
  { containerQuery: "@md/list", count: 4 },
  { containerQuery: "@xl/list", count: 6 },
  { containerQuery: "@3xl/list", count: 8 },
] as const;

/** The subset of `useListUrlState`'s (Step 10) return value this component reads and writes. */
export interface ListUrlStateSlice<TFieldSlug extends string = string> {
  q: string | undefined;
  qf: TFieldSlug | undefined;
  sort: ListViewStateSnapshot<TFieldSlug>["sort"];
  filter: ListViewStateSnapshot<TFieldSlug>["where"];
  size: number | undefined;
  view: string | undefined;
  setQ: (value: string | undefined) => void;
  setQf: (value: TFieldSlug | undefined) => void;
  setSort: (value: ListViewStateSnapshot<TFieldSlug>["sort"]) => void;
  setFilter: (value: ListViewStateSnapshot<TFieldSlug>["where"]) => void;
  setSize: (value: number | undefined) => void;
  setView: (value: string | undefined) => void;
}

/** Props for {@link ListViewTabs}. */
export interface ListViewTabsProps<TFieldSlug extends string = string> {
  collection: CollectionSlug;
  /** Fallback H1 shown when no view is active — the collection's plural display name. */
  collectionLabel: string;
  urlState: ListUrlStateSlice<TFieldSlug>;
  /** `collection.admin.table.defaultPageSize` — `urlState.size`'s value when omitted (Decision 9). */
  defaultPageSize: number;
  /** The session-only visible-columns state (Decision 15), owned by `ListLayout`. */
  visibleColumns: TFieldSlug[];
  onVisibleColumnsChange: (columns: TFieldSlug[]) => void;
  /** Server-prefetched shared views (Decision 39) — forwarded to `useListViews`. */
  initialViews?: VexStoredView[];
  /** Server-read local-view cookie index (Decision 41) — forwarded to `useListViews`. */
  initialLocalIndex?: ListViewsIndexEntry[];
}

interface PendingSaveDialog<TFieldSlug extends string> {
  mode: "create" | "rename";
  viewId: string;
  name: string;
  description: string;
  target: ListSaveViewTarget;
  state: ListViewStateSnapshot<TFieldSlug>;
}

/**
 * The view context header: eyebrow + name + description when a view is
 * active (else the plain collection heading), the tab strip (All, then
 * config/shared/local in that order, overflowing into an "All views"
 * search menu via the fixed `@container/list` counts above — Decision 43),
 * and the modified-state controls (Decision 11).
 *
 * Renders directly above `ListToolbar` (Step 10). It does NOT own
 * composing the active view's query `where` — `useListViews().composeQueryWhere`
 * (Decision 25) is called separately by `ListLayout.tsx`, never here.
 *
 * @param props - See {@link ListViewTabsProps}.
 * @returns The heading, tab strip, and modified-state controls.
 */
export function ListViewTabs<TFieldSlug extends string = string>(props: ListViewTabsProps<TFieldSlug>) {
  const { views, project, isPending } = useListViews<CollectionSlug, TFieldSlug>({
    collection: props.collection,
    initialViews: props.initialViews,
    initialLocalIndex: props.initialLocalIndex,
  });
  const canCreateViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.createView });
  const canUpdateViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.updateView });
  const canDeleteViews = usePermission({ resource: props.collection, action: VIEW_ACTIONS.deleteView });
  const removeViewMutation = useMutation({ mutationFn: removeView() });
  const saveViewMutation = useMutation({ mutationFn: saveView() });

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveDialog, setSaveDialog] = useState<PendingSaveDialog<TFieldSlug> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ListViewEntry<TFieldSlug> | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<ListViewEntry<TFieldSlug> | null>(null);
  const [promoting, setPromoting] = useState(false);

  const orderedViews = useMemo(() => sortViewsForDisplay(views), [views]);

  const activeView = views.find((view) => view.viewId === props.urlState.view);
  const unknownView = props.urlState.view !== undefined && !isPending && activeView === undefined;

  const currentState: ListViewStateSnapshot<TFieldSlug> = {
    search: props.urlState.q,
    searchField: props.urlState.qf,
    sort: props.urlState.sort,
    where: props.urlState.filter,
    columns: props.visibleColumns,
    pageSize: props.urlState.size ?? props.defaultPageSize,
  };
  const diff = activeView ? diffViewState({ current: currentState, saved: activeView }) : undefined;
  const isModified = (diff?.categories.length ?? 0) > 0;
  const canOverwrite =
    activeView?.source === VEX_VIEW_SOURCES.local ||
    (activeView?.source === VEX_VIEW_SOURCES.shared && canUpdateViews);

  function applyView(view: ListViewEntry<TFieldSlug> | undefined): void {
    props.urlState.setQ(view?.search);
    props.urlState.setQf(view?.searchField);
    props.urlState.setSort(view?.sort);
    props.urlState.setFilter(view?.where);
    props.urlState.setSize(view?.pageSize);
    props.urlState.setView(view?.viewId);
    props.onVisibleColumnsChange(view?.columns ?? []);
  }

  function handleSelectViewId(viewId: string): void {
    if (viewId === ALL_TAB_ID) {
      applyView(undefined);
    } else {
      const view = views.find((entry) => entry.viewId === viewId);
      if (view !== undefined) applyView(view);
    }
    setMenuOpen(false);
  }

  function handleReset(): void {
    applyView(activeView);
  }

  async function handleSaveChanges(): Promise<void> {
    if (activeView === undefined) return;
    const view = {
      viewId: activeView.viewId,
      name: activeView.name,
      description: activeView.description,
      state: {
        where: currentState.where,
        sort: currentState.sort,
        search: currentState.search,
        searchField: currentState.searchField,
        columns: currentState.columns,
        pageSize: currentState.pageSize,
      },
    };
    try {
      if (activeView.source === VEX_VIEW_SOURCES.shared) {
        await saveViewMutation.mutateAsync({ collection: props.collection, view });
      } else {
        saveLocalView({ project, collection: props.collection, view });
      }
    } catch (error) {
      toast.error("Save view failed", { description: getVexErrorMessage(error) });
    }
  }

  function openSaveAsNewDialog(): void {
    setSaveDialog({
      mode: "create",
      viewId: generateViewId(),
      name: "",
      description: "",
      target: VEX_VIEW_SOURCES.local,
      state: currentState,
    });
  }

  function openRenameDialog(view: ListViewEntry<TFieldSlug>): void {
    setSaveDialog({
      mode: "rename",
      viewId: view.viewId,
      name: view.name,
      description: view.description ?? "",
      target: view.source === VEX_VIEW_SOURCES.shared ? VEX_VIEW_SOURCES.shared : VEX_VIEW_SOURCES.local,
      state: {
        where: view.where,
        sort: view.sort,
        search: view.search,
        searchField: view.searchField,
        columns: view.columns ?? [],
        pageSize: view.pageSize ?? props.defaultPageSize,
      },
    });
  }

  async function handleConfirmDelete(): Promise<void> {
    if (deleteTarget === null) return;
    try {
      if (deleteTarget.source === VEX_VIEW_SOURCES.shared) {
        await removeViewMutation.mutateAsync({ collection: props.collection, viewId: deleteTarget.viewId });
      } else {
        removeLocalView({ project, collection: props.collection, viewId: deleteTarget.viewId });
      }
      if (props.urlState.view === deleteTarget.viewId) applyView(undefined);
    } catch (error) {
      toast.error("Delete view failed", { description: getVexErrorMessage(error) });
    } finally {
      setDeleteTarget(null);
    }
  }

  // Render: heading/eyebrow/description, the `@container/list`-driven tab
  // strip (visible tabs rendered unconditionally; the fixed-breakpoint
  // overflow is pure CSS `hidden`/`flex` classes against
  // `TAB_VISIBLE_COUNT_BY_BREAKPOINT`, never a `useState` count), the "All
  // views" command menu for overflow + a search field, modified-state
  // controls (Reset / Save changes — `canOverwrite`, gated by `canUpdateViews`
  // for a shared `activeView` / Save as new — `canCreateViews` disables the
  // "shared" scope option, local always available), rename/delete/promote
  // dialogs (rename a shared view needs `canUpdateViews`; delete a shared
  // view needs `canDeleteViews`, disabling that menu item without hiding
  // it; promote a local view to shared needs `canCreateViews`), and the
  // unknown-view notice. Guided stub: visual structure follows
  // DESIGN-NOTES.md §1; wire the handlers above.
}
```

#### packages/react/src/collections/listView/ListViewTabs.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListViewTabs } from "./ListViewTabs";

// Guided-stub test scaffold covering the prerender-specific behavior this
// step adds; apply/save/reset/delete/promote coverage follows the same
// pattern.
describe("ListViewTabs (prerender)", () => {
  it("renders a tab for a view present only in initialLocalIndex, with no localStorage write", () => {
    render(
      <ListViewTabs
        collection="posts"
        collectionLabel="Posts"
        urlState={{
          q: undefined,
          qf: undefined,
          sort: undefined,
          filter: undefined,
          size: undefined,
          view: undefined,
          setQ: () => {},
          setQf: () => {},
          setSort: () => {},
          setFilter: () => {},
          setSize: () => {},
          setView: () => {},
        }}
        defaultPageSize={25}
        visibleColumns={[]}
        onVisibleColumnsChange={() => {}}
        initialLocalIndex={[{ viewId: "local1", name: "Server Tab" }]}
      />,
    );
    expect(screen.getByText("Server Tab")).toBeInTheDocument();
  });

  it("never mounts a ResizeObserver for tab overflow", () => {
    let observed = false;
    const OriginalResizeObserver = globalThis.ResizeObserver;
    class SpyResizeObserver {
      observe() {
        observed = true;
      }
      unobserve() {}
      disconnect() {}
    }
    // @ts-expect-error -- test spy
    globalThis.ResizeObserver = SpyResizeObserver;
    render(
      <ListViewTabs
        collection="posts"
        collectionLabel="Posts"
        urlState={{
          q: undefined,
          qf: undefined,
          sort: undefined,
          filter: undefined,
          size: undefined,
          view: undefined,
          setQ: () => {},
          setQf: () => {},
          setSort: () => {},
          setFilter: () => {},
          setSize: () => {},
          setView: () => {},
        }}
        defaultPageSize={25}
        visibleColumns={[]}
        onVisibleColumnsChange={() => {}}
      />,
    );
    expect(observed).toBe(false);
    globalThis.ResizeObserver = OriginalResizeObserver;
  });
});
```

#### packages/react/src/collections/listView/ListSaveViewDialog.tsx

Save new / rename, shared-vs-local scope gated by
`createView` (new) / `updateView` (rename), with a disabled-while-blank Save button — same
Dialog/Form composition as the other list built-ins in this folder.

#### packages/react/src/collections/listView/ListHiddenFilterBadge.tsx

Lock badge + count, popover with the view description, never a chip or builder row.

Verify: `pnpm --filter @vexcms/core test -- listViewsCookie && pnpm --filter @vexcms/react test -- collections` && browser: tab between All/config/shared/local views, modify a shared view and Save changes, Save as new on a config view (confirm the saved view's `where` is only the user's own filter, not a config view's hidden condition), rename and delete a local view, promote a local view to shared with the confirm dialog, hidden-filter lock badge popover on a config view with a server-resolved where, unknown view id shows the fallback notice, Copy link on a local view serializes full state, hard-reload a URL with `view=local:<id>` and confirm the local view's tab and name render immediately (no post-hydration flash) from the cookie index, resize the list panel across `@container/list` breakpoints and confirm the tab count changes without any visible reflow jump

### Step 13 — Inspect peek, responsive per Decision 27 [agent]

Why: Design Decision 27 needs the panel and the prefetch strategy that makes it open instantly. The architecture review's responsive pass (Decision 43) replaces the `ResizeObserver`-measured inline/right-panel switch with a fixed `@5xl/list` container-query breakpoint, so the server's first paint is already the settled layout (Decision 39, `layout-stability.md`) — resizing across the breakpoint needs no React re-render at all. The real `Sheet` component (Radix-style `Portal` + viewport-`fixed` positioning) can't be the thing a *named* container query toggles: a portaled node sits outside `@container/list`'s DOM subtree, so no `@5xl/list:` variant on it would ever match. A `peek=<id>` URL can be open on first paint (Decision 39/41's server prefetch), so — unlike `DataTableResponsiveMenu`'s overlay-vs-popover choice, which starts closed — the bottom-`Sheet`-vs-panel choice can never be a `useIsMobile()` JS branch either: both layouts mount unconditionally, and a `md:hidden`/`hidden md:flex` viewport-class pair (not `@container/list`, since 768px is a device property per Decision 22 point 3) decides which one is visible, exactly mirroring `ListViewTabs`' CSS-only mobile collapse (Step 16). The `@5xl/list`-and-narrower panel is one plain, always-mounted `div`, descendant of the same `@container/list` root `CollectionListView` already establishes (Decision 22), styled `fixed` (viewport-docked, right-aligned, bordered, shadowed — visually the same right-panel Decision 27 describes) by default and switched to a `static` flex sibling by its own `@5xl/list:` variant classes. It was never a Radix dialog, so "non-modal" (Decision 27: "the list behind it stays interactive") is true unconditionally, in both breakpoints, with no `modal={false}` prop to reason about. Decision 39/41's prerender also needs a document to seed from when `peek=` names a row outside the loaded page: `ListPeek` gains an `initialDoc` prop, which `NextAdminPage` (Step 14) fills from its own `get(peek)` prefetch. Decision 21 keeps the files in `collections/listView/` with the redundant `Collection` prefix dropped (`ListPeek`, `useListPeekPrefetch`), and Decision 38 keeps no separate file for the (now much smaller) layout logic — it's a few Tailwind classes, not a hook.

Verify: `pnpm --filter @vexcms/react test -- collections/listView/ListPeek collections/listView/useListPeekPrefetch collections/listView/CollectionListView ui/data-table/DataTable`

- [ ] `packages/react/src/collections/listView/ListPeek.tsx` (new) + `packages/react/src/collections/listView/ListPeek.test.tsx` (new) — non-modal panel, two layouts (inline / right-docked) chosen by a `@5xl/list` container-query variant on one always-mounted `div`, a third (bottom `Sheet`) toggled by a `md:hidden`/`hidden md:flex` CSS viewport-class pair (never `useIsMobile()` — a `peek=` deep link can be open on first paint), Fields/JSON tabs, seeded from `useVexDocQuery`'s `initialData` via either a loaded row or the server-prefetched `initialDoc`
- [ ] `packages/react/src/collections/listView/useListPeekPrefetch.ts` (new) + `packages/react/src/collections/listView/useListPeekPrefetch.test.ts` (new) — hover(150ms)/focus/neighbour-row prefetch via `queryClient.prefetchQuery(convexQuery(...))`
- [ ] `packages/react/src/collections/listView/index.ts` — barrel exports both new modules
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — adds a generic `getRowProps` per-row event hook (builds on Step 10's edit)
- [ ] `packages/react/src/collections/listView/ListLayout.tsx` — adds `onRowHoverStart`/`onRowHoverEnd`/`onRowFocus` props, forwarded to `DataTable`'s `getRowProps` (builds on Step 9/10's edits; `ListLayout` composes regions only, per Decision 38 — this edit adds no new region, only forwards three props through the existing `<DataTable>` call)
- [ ] `packages/react/src/collections/listView/CollectionListView.tsx` — gains an `initialPeekDoc` prop (Decision 39/41), mounts `ListPeek` as `ListLayout`'s sibling inside the component's existing `@container/list` root, wires `useListPeekPrefetch` into `ListLayout`'s row-hover/focus props — no container ref, since the breakpoint is CSS, not measurement

#### packages/react/src/collections/listView/ListPeek.tsx

New file, complete.

```tsx
"use client";

import type { ReactNode } from "react";
import type { CollectionConfig, MediaCollectionConfig, VexDocument } from "@vexcms/core";
import { getDataFields } from "@vexcms/core";
import { useFieldPermissions } from "../../access";
import { useVexDocQuery } from "../../hooks";
import { useVexConfig } from "../../config/VexConfigContext";
import { adminHref } from "../../admin/adminHref";
import { VexLink } from "../../ui/VexLink";
import { ScrollSection } from "../../ui/ScrollSection";
import { cn } from "../../utils/cn";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../ui/sheet";

/**
 * Shown for both a `peek` id that matches no document and one the caller
 * cannot read — the panel never reveals which (Design Decision 27).
 */
export const LIST_PEEK_UNAVAILABLE_TITLE = "Can't show this document";

/** @see {@link LIST_PEEK_UNAVAILABLE_TITLE} */
export const LIST_PEEK_UNAVAILABLE_DESCRIPTION =
  "It may have been deleted, or you may not have access to it.";

/**
 * Classes for the ONE `div` {@link ListPeek} renders for the non-mobile
 * state (Design Decisions 27 & 43). Below `@5xl/list` it is a viewport-
 * docked right panel (`fixed`, bordered, shadowed); at `@5xl/list` and
 * wider the `@5xl/list:` variants turn it into a plain `static` flex
 * sibling beside the table. No `ResizeObserver`, no React state: the SAME
 * tree mounts at every container width, and the browser alone decides
 * which declaration wins — the server's first paint is already final
 * (Decision 39).
 *
 * This is deliberately a plain `div`, not `ui/sheet.tsx`'s `Sheet`: that
 * component portals its content to `document.body` and positions it with
 * `fixed` relative to the viewport, so it has no DOM ancestry inside
 * `@container/list` for a NAMED container query to match against, and no
 * CSS rule could make it `static` beside the table either way. `Sheet`
 * is ALSO always mounted (see {@link ListPeek}'s render branch) — both it
 * and this `div` render unconditionally, toggled by a `md:hidden`/`hidden
 * md:flex` viewport-class pair rather than a `useIsMobile()` branch, since
 * a `peek=<id>` deep link can be open on first paint (Decision 39/41) and
 * a JS-measured choice would paint the wrong layout for one frame on an
 * actual <768px device.
 */
const LIST_PEEK_PANEL_CLASSNAME = cn(
  "fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col border-l border-border bg-popover shadow-lg",
  "@5xl/list:static @5xl/list:inset-auto @5xl/list:z-auto @5xl/list:h-full @5xl/list:w-96 @5xl/list:max-w-none @5xl/list:shrink-0 @5xl/list:shadow-none",
);

/**
 * Props for {@link ListPeek}.
 *
 * @typeParam TDocument - The document shape `rows` holds.
 */
export interface ListPeekProps<TDocument extends VexDocument = VexDocument> {
  /** The resolved collection (or media collection) config the peeked row belongs to. */
  collection: CollectionConfig | MediaCollectionConfig;
  /**
   * The `peek` URL param (`useListUrlState().peek`). `undefined` closes the
   * panel — the component then renders nothing, not a zero-width/hidden
   * panel or an empty `Sheet`.
   */
  peekId: string | undefined;
  /**
   * The list's currently loaded, already version-collapsed rows — the same
   * array passed to `DataTable`/`ListLayout`. Seeds the panel instantly via
   * `useVexDocQuery`'s `initialData` and drives the "N of M loaded" label
   * and the header's Previous/Next buttons.
   */
  rows: TDocument[];
  /**
   * The document `NextAdminPage` prefetched server-side via `get(peek)`
   * (Design Decisions 39/41), when `peekId` isn't among `rows` on first
   * paint — e.g. a deep-linked `peek=` id outside the loaded page. Seeds
   * `useVexDocQuery`'s `initialData` so even that row paints already-
   * loaded, with zero layout shift. `rows` wins when `peekId` IS loaded,
   * since that's the fresher, live-subscribed value; `initialDoc` (which
   * may itself be `null`, meaning the server already resolved "not found
   * or unreadable") is the fallback only when `peekId` isn't among `rows`.
   * `undefined` when the server had no `peek=` param to prefetch for.
   */
  initialDoc?: TDocument | null;
  /**
   * Called with the next `peek` id: `undefined` to close (including Esc —
   * handled by Step 15's `useListShortcuts`, not this component — a
   * backdrop click on the mobile `Sheet`, or its own close affordance), or
   * a neighbouring row's id from the header's Previous/Next buttons. Pass
   * `useListUrlState().setPeek` directly — the signatures match.
   */
  onPeekChange: (id: string | undefined) => void;
}

/**
 * Non-modal panel for inspecting one row's raw field values (Design
 * Decision 27), responsive across two breakpoints:
 * - A plain `div` beside the table at `@5xl/list` and wider, or
 *   viewport-docked to the right below it — chosen entirely by CSS
 *   (`@5xl/list:` variants on {@link LIST_PEEK_PANEL_CLASSNAME}, Decision
 *   43), with no measurement and no React state for the switch.
 * - A bottom `Sheet`, mirroring `livePreview/LivePreviewMobileOverlay.tsx`,
 *   below the 768px viewport breakpoint — a CSS `md:hidden` class on the
 *   `Sheet`'s content, not `useIsMobile()`: a `peek=<id>` deep link can be
 *   open on first paint, so the choice between this and the container-query
 *   panel below can never be a JS branch (Decision 43). Both layouts are
 *   always mounted; the browser's cascade picks exactly one.
 *
 * The list behind the panel is ALWAYS interactive — there's no overlay or
 * focus trap at either non-mobile breakpoint, since neither renders a
 * dialog. "Non-modal" here isn't a prop to set; it falls out of the panel
 * being a plain `div`.
 *
 * Opens instantly by seeding `useVexDocQuery` from the already-loaded row
 * (`props.rows`) or, failing that, the server-prefetched `props.initialDoc`
 * (Decision 39/41), then stays live via that hook's Convex subscription
 * for as long as the panel is open.
 *
 * Field-level read access gates both tabs: a field the caller can't read is
 * omitted from the Fields tab and the JSON tab alike (Design Decision 26),
 * never shown muted — a muted-but-visible field name would itself leak that
 * the field exists.
 *
 * @typeParam TDocument - The document shape `props.rows` holds.
 * @param props - {@link ListPeekProps}.
 * @returns The peek panel in whichever layout currently applies, or `null`
 *   while `props.peekId` is `undefined`.
 *
 * @example
 * ```tsx
 * const urlState = useListUrlState({ collection });
 * // `@container/list` is established by CollectionListView's own root
 * // (Decision 22) — ListPeek needs no container ref of its own.
 * <div className="flex min-h-0 flex-1 gap-0">
 *   <ListLayout {...} />
 *   <ListPeek
 *     collection={collection}
 *     peekId={urlState.peek}
 *     rows={rows}
 *     initialDoc={initialPeekDoc}
 *     onPeekChange={urlState.setPeek}
 *   />
 * </div>
 * ```
 */
export function ListPeek<TDocument extends VexDocument = VexDocument>(
  props: ListPeekProps<TDocument>,
): ReactNode {
  // TODO: implement
  // 1. `if (props.peekId === undefined) return null` — closed state renders
  //    nothing at all, in every layout.
  // 2. (no `isMobile = useIsMobile()` here — see step 9: a `peek=<id>` deep
  //    link can be OPEN on first paint, so which layout renders can never
  //    be a JS branch; `DataTableResponsiveMenu`'s own internal overlay
  //    choice is the only place in this spec `useIsMobile()` still decides
  //    a layout, because that overlay starts closed.)
  // 3. `rowIndex = props.rows.findIndex((row) => row._id === props.peekId)`
  //    → `seedRow = rowIndex === -1 ? undefined : props.rows[rowIndex]`.
  //    `rowIndex === -1` covers both a deep-linked id outside the loaded
  //    page and a stale id after the rows refetch — `useVexDocQuery`'s own
  //    by-id fetch (seeded by `props.initialDoc` when present) covers both
  //    the same way, so there is no separate "not in rows" branch.
  // 4. `{ document, isPending } = useVexDocQuery({ collection:
  //    props.collection.slug, id: props.peekId, drafts:
  //    props.collection.versions?.drafts ? true : undefined, initialData:
  //    seedRow ?? props.initialDoc })` (`../../hooks`) — `seedRow` is the
  //    already-loaded row (Decision 27: "opens instantly from the row
  //    already loaded"); `props.initialDoc` is the server-prefetched
  //    fallback (Decision 39/41) for a `peekId` the loaded page doesn't
  //    have; `undefined` (both absent) falls through to
  //    `useVexDocQuery`'s own live fetch. `drafts` is derived from
  //    `props.collection` here rather than taken as a separate prop — the
  //    caller already has it in `collection`.
  // 5. `fieldPermissions = useFieldPermissions({ resource:
  //    props.collection.slug, action: CRUD_ACTIONS.read, data: document ??
  //    undefined, scope: PERMISSION_SCOPES.doc })` (`../../access`) — real
  //    per-document data, not `PERMISSION_SCOPES.any`: Decision 26's "field
  //    read access gates every list control" is a per-document question
  //    here, unlike the whole-column gate `CollectionListView`'s columns use.
  // 6. Build `body: ReactNode` by branching on `document`, not on
  //    `fieldPermissions` — this is the ONE content tree every layout
  //    below shares:
  //    a. `document === null` → the "not found" state using
  //       `LIST_PEEK_UNAVAILABLE_TITLE` / `LIST_PEEK_UNAVAILABLE_DESCRIPTION`
  //       — the SAME copy a denied read uses: the server's own `get`
  //       already returns `null` for both "no such document" and "caller
  //       can't read it" (never a distinct error), so this one branch
  //       covers both states.
  //    b. `document === undefined && isPending` → a loading skeleton.
  //    c. otherwise → the header (step 7) plus the Fields/JSON tabs (step 8),
  //       each wrapped in `ScrollSection` (`../../ui/ScrollSection`) with no
  //       `title`/`count` — just its scroll container — so the body scrolls
  //       independently of the header and tab strip (Decision 31).
  // 7. Header, inside `body`: initials avatar + the resolved title
  //    (`document[props.collection.admin.useAsTitle] ?? document._id`) +
  //    `` `${props.collection.labels.singular} · ${rowIndex + 1} of
  //    ${props.rows.length} loaded` `` (omit the position suffix entirely
  //    when `rowIndex === -1`). Two icon buttons, `aria-label="Previous row"`
  //    and `aria-label="Next row"`, call
  //    `props.onPeekChange(props.rows[rowIndex - 1]?._id)` /
  //    `props.onPeekChange(props.rows[rowIndex + 1]?._id)` respectively,
  //    disabled at the ends and whenever `rowIndex === -1`. "Open" is a
  //    `VexLink` (`../../ui/VexLink`) to `adminHref({ type: "document",
  //    slug: props.collection.slug, id: props.peekId },
  //    useVexConfig().basePath)` (`../../admin/adminHref`,
  //    `../../config/VexConfigContext`). A third icon button,
  //    `aria-label="Close"`, calls `props.onPeekChange(undefined)` — shown
  //    in every layout (the non-mobile panel has no `Sheet` close
  //    affordance of its own).
  // 8. Fields tab, inside `body`: built from `getDataFields({ fields:
  //    props.collection.fields })` (`@vexcms/core`) filtered to
  //    `isFieldAllowed(fieldPermissions, fieldKey)`; the JSON tab
  //    stringifies that SAME filtered subset plus `_id`/`_creationTime` —
  //    a denied field never reaches either tab. Per-row value formatting:
  //    a. `_id` first, full value, no truncation.
  //    b. `_creationTime` second: three stacked values — ISO UTC
  //       (`new Date(value).toISOString()`), epoch ms (the raw number), and
  //       relative time.
  //    c. a `relationship` field (`fieldDef.type ===
  //       ADMIN_FIELDS.relationship.type`) → a chip with the resolved
  //       target title plus the raw target id(s).
  //    d. a `textarea`/`richtext` field → the full text plus a trailing
  //       character count.
  //    e. everything else → `String(value)`, or `"—"` for
  //       `null`/`undefined`.
  //    Every row gets a copy button:
  //    `navigator.clipboard.writeText(String(value))`.
  // 9. Render BOTH layouts unconditionally, toggled by CSS viewport classes
  //    — never a `useIsMobile()` branch (a `peek=<id>` deep link can be open
  //    on first paint, so a JS-measured choice would paint the wrong one for
  //    one frame on an actual <768px device, then snap once hydration's
  //    `useIsMobile()` effect resolves — exactly the flash
  //    `layout-stability.md` forbids):
  //    a. A bottom `Sheet` (`side="bottom"`, `showCloseButton={false}`, the
  //       SAME `top-10 … rounded-t-xl` className `LivePreviewMobileOverlay`
  //       uses, plus `md:hidden` on its `SheetContent` so it is visually
  //       hidden — but still mounted — at `md` and wider), `open` always
  //       `true` here (the component already returned `null` in step 1 when
  //       closed), `onOpenChange={(open) => { if (!open)
  //       props.onPeekChange(undefined); }}`. A `sr-only` `SheetHeader` with
  //       `SheetTitle`/`SheetDescription` for a11y, then `body`.
  //    b. `<div role="complementary" aria-label={document
  //       ? `${props.collection.labels.singular} preview` : undefined}
  //       className={cn(LIST_PEEK_PANEL_CLASSNAME, "hidden md:flex")}>{body}
  //       </div>` — no `open`/`onOpenChange`; the SAME element at every
  //       `md`-and-wider container width, with `@5xl/list:` doing the
  //       inline/right-sheet layout switch within it (Decision 43). `hidden
  //       md:flex` is a VIEWPORT class (not `@container/list`) because the
  //       768px split is a device property per Decision 22 point 3, same as
  //       the Sheet's `md:hidden` above — exactly one of (a)/(b) is visible
  //       at any width, decided purely by the browser's CSS cascade with no
  //       React state.
  // Edge cases:
  //   refetch) must not close the panel — only `rowIndex`/the "N of M
  //   loaded" label update; `props.peekId` is the only thing that closes it.
  // - A resize that crosses `@5xl/list` while the peek is open needs NO
  //   re-render: the browser alone reapplies the CSS variant to the same
  //   mounted `div`; `document`/`fieldPermissions` state and the
  //   `useVexDocQuery` subscription are completely untouched by it.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/ListPeek.test.tsx

New file, complete — real behavior tests against the (not-yet-implemented) component above; every `render`/`waitFor` call throws until the guided stub is filled in. Uses the real `renderView` harness (`../../testing/harness/viewHarness`) so `useVexDocQuery`/`useFieldPermissions` run against actual convex-test data and a real RBAC matrix, not a mock. Both layouts are always mounted (Decision 43), so every test asserts on CLASS NAMES (`md:hidden`/`hidden md:flex`), not a mocked `useIsMobile()` — jsdom doesn't evaluate `@container`/viewport media queries at all (same approach `forms/AppForm.test.tsx` uses for `@container/form`), so neither breakpoint's visibility can be asserted by rendered output, only by which classes are present.

```tsx
import { convexTest } from "convex-test";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineAccess, defineCollection, defineConfig, text, type VexDocument } from "@vexcms/core";
import {
  LIST_PEEK_UNAVAILABLE_DESCRIPTION,
  LIST_PEEK_UNAVAILABLE_TITLE,
  ListPeek,
} from "./ListPeek";
import { renderView } from "../../testing/harness/viewHarness";
import schema, { testModules } from "../../testing/convex/schema";


const peekCollection = defineCollection({
  slug: "documents",
  fields: { title: text(), status: text() },
  admin: { useAsTitle: "title" },
});

const access = defineAccess({
  roles: ["editor"] as const,
  resources: [peekCollection],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { documents: { read: () => ({ title: true, status: false }) } },
  },
});

const editorAuth = { user: { _id: "u1", roles: "editor" } };

describe("ListPeek", () => {
  // (No useIsMobile mock to reset — both layouts are always mounted,
  // toggled by CSS classes, never a JS branch.)

  it("renders nothing while peekId is undefined", () => {
    const t = convexTest(schema, testModules);
    const { container } = renderView(
      <ListPeek collection={peekCollection} peekId={undefined} rows={[]} onPeekChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );
    expect(container.querySelector('[role="complementary"]')).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders instantly from the already-loaded row, seeded via useVexDocQuery's initialData", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    renderView(
      <ListPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    expect(screen.getByText("Doc 0")).toBeInTheDocument();
  });

  it("renders instantly from the server-prefetched initialDoc when peekId isn't among the loaded rows", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Off-page doc", status: "published" }));
    const initialDoc: VexDocument = {
      _id: id,
      _creationTime: Date.now(),
      title: "Off-page doc",
      status: "published",
    };

    renderView(
      <ListPeek collection={peekCollection} peekId={id} rows={[]} initialDoc={initialDoc} onPeekChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    expect(screen.getByText("Off-page doc")).toBeInTheDocument();
  });

  it("renders the same message for a not-found id as for a denied read", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run(async (ctx) => {
      const docId = await ctx.db.insert("documents", { title: "Doc 0" });
      await ctx.db.delete(docId);
      return docId;
    });

    renderView(
      <ListPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(screen.getByText(LIST_PEEK_UNAVAILABLE_TITLE)).toBeInTheDocument());
    expect(screen.getByText(LIST_PEEK_UNAVAILABLE_DESCRIPTION)).toBeInTheDocument();
  });

  it("omits a field the caller cannot read from the Fields tab", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0", status: "published" }));
    const row: VexDocument = { _id: id, _creationTime: Date.now(), title: "Doc 0", status: "published" };

    renderView(
      <ListPeek collection={peekCollection} peekId={id} rows={[row]} onPeekChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }), access, auth: editorAuth },
    );

    await waitFor(() => expect(screen.getByText("Doc 0")).toBeInTheDocument());
    expect(screen.queryByText("published")).not.toBeInTheDocument();
  });

  it("steps to the neighbouring row via the header's Previous/Next buttons", async () => {
    const t = convexTest(schema, testModules);
    const id0 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));
    const id1 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 1" }));
    const id2 = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 2" }));
    const rows: VexDocument[] = [
      { _id: id0, _creationTime: 1, title: "Doc 0" },
      { _id: id1, _creationTime: 2, title: "Doc 1" },
      { _id: id2, _creationTime: 3, title: "Doc 2" },
    ];
    const onPeekChange = vi.fn();

    renderView(
      <ListPeek collection={peekCollection} peekId={id1} rows={rows} onPeekChange={onPeekChange} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(screen.getByText("Doc 1")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Previous row" }));
    expect(onPeekChange).toHaveBeenCalledWith(id0);

    fireEvent.click(screen.getByRole("button", { name: "Next row" }));
    expect(onPeekChange).toHaveBeenCalledWith(id2);
  });

  it("renders one plain panel carrying both the default (narrow) classes and the @5xl/list wide-variant classes — CSS decides which wins, not JS (Decision 43)", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));

    const { container } = renderView(
      <ListPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument());
    const panel = container.querySelector('[role="complementary"]');
    expect(panel).toBeInTheDocument();
    // Narrow-default: viewport-docked right panel.
    expect(panel!.className).toContain("fixed");
    expect(panel!.className).toContain("right-0");
    // @5xl/list wide-variant: static flex sibling, same element.
    expect(panel!.className).toContain("@5xl/list:static");
    expect(panel!.className).toContain("@5xl/list:shrink-0");
    // The bottom Sheet is always mounted too (Decision 43) — just
    // `md:hidden` at this breakpoint, never absent from the DOM.
    const sheetContent = container.querySelector('[data-slot="sheet-content"][data-side="bottom"]');
    expect(sheetContent).toBeInTheDocument();
    expect(sheetContent!.className).toContain("md:hidden");
  });

  it("renders as a bottom Sheet below the mobile breakpoint, regardless of the @5xl/list panel", async () => {
    const t = convexTest(schema, testModules);
    const id = await t.run((ctx) => ctx.db.insert("documents", { title: "Doc 0" }));

    renderView(
      <ListPeek collection={peekCollection} peekId={id} rows={[]} onPeekChange={() => {}} />,
      { convex: t, config: defineConfig({ collections: [peekCollection] }) },
    );

    await waitFor(() =>
      expect(document.querySelector('[data-slot="sheet-content"][data-side="bottom"]')).toBeInTheDocument(),
    );
    // The non-mobile panel div is in the DOM too, with `hidden md:flex` —
    // it is CSS, not React, that keeps it invisible below `md`.
    expect(document.querySelector('[role="complementary"]')?.className).toContain("hidden md:flex");
  });
});
```

#### packages/react/src/collections/listView/useListPeekPrefetch.ts

New file, complete. Unaffected by this step's layout revision — kept as Decision 27 originally specified.

```ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi, type CollectionConfig, type MediaCollectionConfig, type VexDocument } from "@vexcms/core";

/**
 * Hover delay (ms) before {@link useListPeekPrefetch} prefetches a row's
 * full document (Design Decision 27). Keyboard focus prefetches
 * immediately, with no delay.
 */
export const LIST_PEEK_HOVER_DELAY_MS = 150;

/**
 * Props for {@link useListPeekPrefetch}.
 *
 * @typeParam TDocument - The document shape `rows` holds.
 */
export interface UseListPeekPrefetchProps<TDocument extends VexDocument = VexDocument> {
  /** The resolved collection (or media collection) config `rows` belongs to. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** The list's currently loaded, already version-collapsed rows. */
  rows: TDocument[];
  /** The `peek` URL param — while set, the neighbouring rows ±1 prefetch too. */
  peekId: string | undefined;
}

/** Return value of {@link useListPeekPrefetch} — row event handlers, meant to be spread onto each row. */
export interface UseListPeekPrefetchReturn {
  /** Attach to a row's `onPointerEnter`: starts the hover-prefetch timer. */
  onRowPointerEnter: (id: string) => void;
  /** Attach to a row's `onPointerLeave`: cancels a pending hover-prefetch timer. */
  onRowPointerLeave: () => void;
  /** Attach to a row's `onFocus`: prefetches immediately, no delay. */
  onRowFocus: (id: string) => void;
}

/**
 * Warms the `useVexDocQuery` cache for a row's full document before
 * {@link ListPeek} (`./ListPeek`) opens it (Design Decision 27): on row
 * hover (after {@link LIST_PEEK_HOVER_DELAY_MS}) or keyboard focus, and for
 * the neighbouring rows ±1 of `props.peekId` while the peek is open.
 * Eviction is TanStack Query's own `gcTime` — there is no custom LRU.
 *
 * @typeParam TDocument - The document shape `props.rows` holds.
 * @param props - {@link UseListPeekPrefetchProps}.
 * @returns Row event handlers; see {@link UseListPeekPrefetchReturn}.
 *
 * @example
 * ```tsx
 * const prefetch = useListPeekPrefetch({ collection, rows, peekId: urlState.peek });
 * <ListLayout
 *   onRowHoverStart={prefetch.onRowPointerEnter}
 *   onRowHoverEnd={prefetch.onRowPointerLeave}
 *   onRowFocus={prefetch.onRowFocus}
 * />
 * ```
 */
export function useListPeekPrefetch<TDocument extends VexDocument = VexDocument>(
  props: UseListPeekPrefetchProps<TDocument>,
): UseListPeekPrefetchReturn {
  // TODO: implement
  // 1. `queryClient = useQueryClient()` (`@tanstack/react-query`).
  // 2. `prefetch = useCallback((id: string) => { void
  //    queryClient.prefetchQuery(convexQuery(vexConvexApi.get, { id,
  //    collection: props.collection.slug, drafts:
  //    "versions" in props.collection && props.collection.versions.drafts
  //      ? true
  //      : undefined })); }, [queryClient, props.collection])` (`convexQuery`
  //    from `@convex-dev/react-query`, `vexConvexApi` from `@vexcms/core`)
  //    — the SAME function reference and arg shape `useVexDocQuery` itself
  //    queries with, so a prefetch and the peek's own subsequent `useQuery`
  //    share one cache entry; no second round trip when the peek actually
  //    opens.
  // 3. `hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)`.
  //    a. `onRowPointerEnter(id)` → clear any pending timer, then
  //       `hoverTimer.current = setTimeout(() => prefetch(id),
  //       LIST_PEEK_HOVER_DELAY_MS)`.
  //    b. `onRowPointerLeave()` → clear the pending timer only; a prefetch
  //       already in flight is left to resolve into the cache (eviction is
  //       `gcTime`, Decision 27).
  //    c. `onRowFocus(id)` → `prefetch(id)` directly, no delay (Decision 27:
  //       "on hover (150ms) or keyboard focus").
  //    d. A `useEffect` cleanup clears `hoverTimer.current` on unmount, so a
  //       pending prefetch never fires for an already-unmounted row.
  // 4. A second `useEffect`, deps `[props.peekId, props.rows, prefetch]`:
  //    while `props.peekId` is set, find its index in `props.rows` and
  //    `prefetch` the row at `index - 1` and `index + 1` when present —
  //    "the neighbouring rows ±1 prefetch while the peek is open" (Decision
  //    27). `props.peekId` outside `props.rows` (a deep link) → index is
  //    `-1`, neither neighbour exists, the effect is a no-op.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/listView/useListPeekPrefetch.test.ts

New file, complete — real behavior tests against the (not-yet-implemented) hook above; every `renderHook` call throws until the guided stub is filled in. `convexQuery` is mocked to a plain `{ fn, args }` sentinel so assertions can check the EXACT function reference and args a prefetch issues, without needing a live Convex connection. Unaffected by this step's layout revision.

```ts
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { defineCollection, text, vexConvexApi, type CollectionConfig, type VexDocument } from "@vexcms/core";
import { LIST_PEEK_HOVER_DELAY_MS, useListPeekPrefetch } from "./useListPeekPrefetch";

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (fn: unknown, args: unknown) => ({ fn, args }),
}));

const testCollection = defineCollection({
  slug: "documents",
  fields: { title: text() },
}) as unknown as CollectionConfig;

const rows: VexDocument[] = [
  { _id: "doc1", _creationTime: 1, title: "Doc 0" },
  { _id: "doc2", _creationTime: 2, title: "Doc 1" },
  { _id: "doc3", _creationTime: 3, title: "Doc 2" },
];

describe("useListPeekPrefetch", () => {
  let queryClient: QueryClient;
  let prefetchSpy: ReturnType<typeof vi.spyOn>;

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient();
    prefetchSpy = vi.spyOn(queryClient, "prefetchQuery").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    prefetchSpy.mockRestore();
  });

  it("prefetches 150ms after pointer enter, not a moment before", () => {
    const { result } = renderHook(
      () => useListPeekPrefetch({ collection: testCollection, rows, peekId: undefined }),
      { wrapper },
    );

    act(() => result.current.onRowPointerEnter("doc2"));
    act(() => {
      vi.advanceTimersByTime(LIST_PEEK_HOVER_DELAY_MS - 1);
    });
    expect(prefetchSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    const call = prefetchSpy.mock.calls[0]?.[0] as { fn: unknown; args: Record<string, unknown> };
    expect(call.fn).toBe(vexConvexApi.get);
    expect(call.args).toMatchObject({ id: "doc2", collection: "documents" });
  });

  it("cancels the pending prefetch when the pointer leaves before the delay elapses", () => {
    const { result } = renderHook(
      () => useListPeekPrefetch({ collection: testCollection, rows, peekId: undefined }),
      { wrapper },
    );

    act(() => result.current.onRowPointerEnter("doc2"));
    act(() => result.current.onRowPointerLeave());
    act(() => {
      vi.advanceTimersByTime(LIST_PEEK_HOVER_DELAY_MS);
    });
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  it("prefetches immediately on focus, with no delay", () => {
    const { result } = renderHook(
      () => useListPeekPrefetch({ collection: testCollection, rows, peekId: undefined }),
      { wrapper },
    );

    act(() => result.current.onRowFocus("doc3"));
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    const call = prefetchSpy.mock.calls[0]?.[0] as { args: Record<string, unknown> };
    expect(call.args).toMatchObject({ id: "doc3", collection: "documents" });
  });

  it("prefetches the ±1 neighbours of peekId while the peek is open", () => {
    renderHook(
      () => useListPeekPrefetch({ collection: testCollection, rows, peekId: "doc2" }),
      { wrapper },
    );

    expect(prefetchSpy).toHaveBeenCalledTimes(2);
    const ids = prefetchSpy.mock.calls
      .map((call) => (call[0] as { args: { id: string } }).args.id)
      .sort();
    expect(ids).toEqual(["doc1", "doc3"]);
  });

  it("prefetches only the next neighbour when peekId is the first loaded row", () => {
    renderHook(
      () => useListPeekPrefetch({ collection: testCollection, rows, peekId: "doc1" }),
      { wrapper },
    );

    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    const call = prefetchSpy.mock.calls[0]?.[0] as { args: { id: string } };
    expect(call.args.id).toBe("doc2");
  });
});
```

#### packages/react/src/collections/listView/index.ts

Existing file (Step 9), 1 edit — append two more `export * from` lines, alongside the listView folder's existing barrel entries:

```ts
export * from "./ListPeek";
export * from "./useListPeekPrefetch";
```

#### packages/react/src/ui/data-table/DataTable.tsx

Existing file (Step 10), 2 edits on top of Step 10's. A generic per-row event hook, not peek-specific — `DataTable` stays unaware of prefetching; `ListLayout` (below) is what turns it into peek wiring. Unaffected by this step's layout revision.

**1 — imports.** Add `type ComponentProps` to the existing `"react"` import, beside whatever hooks Step 10 already imports there.

**2 — `DataTableProps`.** One more optional prop, beside `onSelectionChange` (Step 9):

```ts
  /**
   * Per-row DOM event handlers, spread onto each `<TableRow>`. Generic —
   * `DataTable` has no concept of peeking or prefetching; `ListLayout`
   * forwards its own `onRowHoverStart`/`onRowHoverEnd`/`onRowFocus` props
   * through it (Step 13).
   */
  getRowProps?: (row: TData) => Pick<ComponentProps<"tr">, "onPointerEnter" | "onPointerLeave" | "onFocus">;
```

**3 — the row-rendering loop.** Find the row loop's `<TableRow key={row.id}>` (unchanged by Step 9/10's own edits — the same element the sticky-first-column and density classes already apply to) and spread the new prop onto it: `<TableRow key={row.id} {...props.getRowProps?.(row.original)}>` — the only JSX change this step makes to that loop.

#### packages/react/src/collections/listView/ListLayout.tsx

Existing file (Step 9/10), 2 edits on top of theirs. `ListLayout` composes regions only (Decision 38) — this edit adds no new region, only forwards three props through the existing `<DataTable>` call. Unaffected by this step's layout revision.

**1 — `ListLayoutProps`.** Three more optional props, beside whatever row-action props Step 9 already added:

```ts
  /** Row hover-prefetch start (Design Decision 27), forwarded to `DataTable`'s `getRowProps`. Omit to disable prefetching. */
  onRowHoverStart?: (id: string) => void;
  /** Row hover-prefetch cancel, forwarded to `DataTable`'s `getRowProps`. */
  onRowHoverEnd?: () => void;
  /** Row focus-prefetch, forwarded to `DataTable`'s `getRowProps`. */
  onRowFocus?: (id: string) => void;
```

**2 — the `<DataTable>` call.** Add one more prop to that call, alongside whatever Step 9/10 already pass:

```
getRowProps={(row) => ({
  onPointerEnter: () => props.onRowHoverStart?.(row._id),
  onPointerLeave: () => props.onRowHoverEnd?.(),
  onFocus: () => props.onRowFocus?.(row._id),
})}
```

#### packages/react/src/collections/listView/CollectionListView.tsx

Existing file (Step 9/10/11/12), 3 edits on top of theirs — an `initialPeekDoc` prop for server-prerendered deep links (Decision 39/41), `useListPeekPrefetch` wired into `ListLayout`'s new row-hover/focus props, and `ListPeek` mounted as `ListLayout`'s sibling. No container ref: `ListPeek`'s inline/right-panel switch is CSS-only (Decision 43), driven by the `@container/list` root this component already establishes (Decision 22) — unlike the old `ResizeObserver` design, nothing here needs to measure that root's width.

**1 — imports.** Add two more imports, alongside the existing ones:

```ts
import { ListPeek } from "./ListPeek";
import { useListPeekPrefetch } from "./useListPeekPrefetch";
```

**2 — the component's props type.** One more optional prop, beside whichever `initial*` props Step 9/14 already declare (`initialData`, and — once Step 14 lands — `initialViews`/`initialLocalIndex`/`initialPreferences`):

```ts
  /**
   * The document `NextAdminPage` prefetched via `get(peek)` when the URL's
   * `peek=` param names a row outside the server-rendered first page
   * (Design Decisions 39/41). Forwarded to `ListPeek`'s `initialDoc` —
   * `undefined` when the server had no `peek=` to prefetch for.
   */
  initialPeekDoc?: VexDocument | null;
```

**3 — inside the component, beside the existing `urlState = useListUrlState({ collection })` call.** Declare the prefetch hook (no ref needed — `ListPeek`'s inline/right-panel switch is CSS-only, Decision 43):

```ts
const prefetch = useListPeekPrefetch({ collection, rows, peekId: urlState.peek });
```

**4 — the div wrapping `<ListLayout>`.** Forward the three hover/focus props into the existing `<ListLayout>` call, and mount `<ListPeek>` as its sibling immediately after `<ListLayout>` closes, inside the SAME div (no `ref` needed on it — it only needs to stay a descendant of this component's `@container/list` root for `@5xl/list:` to resolve):

```tsx
<div className="flex min-h-0 flex-1 gap-0">
  <div className="min-w-0 flex-1">
    <ListLayout
      {/* …Step 9/10/11/12's existing props, unchanged… */}
      onRowHoverStart={prefetch.onRowPointerEnter}
      onRowHoverEnd={prefetch.onRowPointerLeave}
      onRowFocus={prefetch.onRowFocus}
    />
  </div>
  <ListPeek
    collection={collection}
    peekId={urlState.peek}
    rows={rows}
    initialDoc={props.initialPeekDoc}
    onPeekChange={urlState.setPeek}
  />
</div>
```

Nothing else in the function changes — `urlState`, `collection`, and `rows` are already in scope from earlier steps' edits to this same file.

### Step 14 — Server prerender [agent]

Why: Decisions 39–43 require the list to prerender exactly what the client shows, with zero
layout shift (`.agent/docs/standards/frontend/layout-stability.md`: "prefetch what decides
layout" — the server's query args must equal the client's, or hydrated `initialData` seeds the
wrong query key and the list repaints after hydration). This step does three things. First, it
extracts the Convex-args-building logic `useVexListQuery` (Step 8) already has into one pure
core helper, `buildListQueryArgs.ts`, so the server can call the exact same code instead of a
hand-copied second implementation that could drift. Second, because a shareable link to an
*unmodified* shared or config view can legally omit every param that matches the view's own
saved state (Decision 9 — "only params that differ from the saved view appear"), resolving
"the client's args" for such a link requires merging the URL with the active view's own saved
state, not just reading the URL at face value; `resolveListQueryState.ts` is that one merge,
also pure and core, so a bare `?view=shared:<id>` link renders the same rows whether the browser
or `NextAdminPage` resolves it. A **local** view never needs this merge — Decision 41 already
requires its full state in the URL — so `resolveListQueryState` only consults a `configView`/
`sharedView` when the caller found one. Third, it wires `NextAdminPage` itself: `searchParams`,
the preference and local-view-index cookies (mirroring `readLivePreviewPanelCookie`,
`packages/core/src/livePreview/panelCookie.ts`), the `listViews` prefetch, and the
`findPaginated`/`search`/`get` prefetches built from the two helpers above.

`resolveListQueryState` is written once here but is meant to be called from BOTH sides —
`NextAdminPage` (this step) and `CollectionListView` (Steps 9/10/12) — the same way
`composeViewWhere` (Step 5) already is. Steps 9/10/12's own `CollectionListView`/`useListViews`
wiring should import it rather than re-deriving the URL/view-state merge a second time; that's
noted here for whoever reconciles the fragments, not restated as a TODO in those steps' own
checklists.

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

#### packages/core/src/collections/buildListQueryArgs.ts

New file, complete.

```ts
import { whereToNode } from "../db/queryArgs";
import type { VexWhere, VexWhereNode } from "../db/queryArgs";
import type { MediaCollectionConfig } from "../media";
import type { CollectionSlug } from "../types/generated";
import type { VexFindPaginatedArgs, VexSearchArgs } from "./api/types";
import type { CollectionConfig, CollectionTableSort } from "./types";

/**
 * Resolves a `where` prop — a builder callback or an already-plain node — to the plain
 * node Convex accepts. Every server caller of this module already passes a plain node
 * (`resolveListQueryState`'s output); only a client caller of `useVexListQuery` may still
 * pass a builder callback directly.
 */
function resolveWhere<TFieldSlug extends string>(
  where: VexWhere<TFieldSlug> | undefined,
): VexWhereNode<string> | undefined {
  if (where === undefined) return undefined;
  return (typeof where === "function" ? whereToNode<TFieldSlug>(where) : where) as VexWhereNode<string>;
}

/** Props shared by {@link buildListFindQueryArgs} and {@link buildListSearchQueryArgs}. */
interface BuildListQueryArgsBaseProps<TFieldSlug extends string = string> {
  /** The resolved collection (or media collection) config — same object `useVexListQuery` and `NextAdminPage` both already hold. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** Predicate over the collection's fields: a builder callback or an already-plain node. */
  where?: VexWhere<TFieldSlug>;
  /** Include draft versions of versioned documents. */
  drafts?: boolean;
  /**
   * Documents to fetch this round-trip — already `Math.max(collection.admin.table.serverPageSize,
   * pageSize)` (Step 8's "the server batch always covers at least one client page" rule).
   * That `Math.max` stays at each CALLER's own site, beside the `pageSize`/`size` value it
   * reads, rather than moving in here — `useVexListQuery` and `NextAdminPage` read
   * `pageSize` from two different places (a hook prop vs. `resolveListQueryState`'s
   * output), so there is no single shared `pageSize` input to compute it from.
   */
  numItems: number;
  /** Load More's cursor. `undefined`/omitted means the first page — every server prefetch reads one. */
  cursor?: string | null;
}

/** Props for {@link buildListFindQueryArgs}. */
export interface BuildListFindQueryArgsProps<TFieldSlug extends string = string>
  extends BuildListQueryArgsBaseProps<TFieldSlug> {
  /** Portable sort (Design Decision 5). Parked while searching (Design Decision 7) — {@link buildListSearchQueryArgs} has no `sort` param at all. */
  sort?: CollectionTableSort<TFieldSlug>;
  /** Relationship auto-populate depth. */
  depth?: number;
}

/**
 * Builds the exact `findPaginated` Convex args for one list page — shared by
 * `useVexListQuery`'s find-mode branch (client, Step 8) and `NextAdminPage`'s prerender
 * (server, Design Decision 39), so the two can't drift.
 *
 * @param props - Input props.
 * @returns The args, ready for `convexQuery(vexConvexApi.findPaginated, …)` or
 *   `fetchQuery(vexConvexApi.findPaginated, …)`.
 */
export function buildListFindQueryArgs<TFieldSlug extends string = string>(
  props: BuildListFindQueryArgsProps<TFieldSlug>,
): VexFindPaginatedArgs & { sort?: CollectionTableSort<string> } {
  return {
    collection: props.collection.slug as CollectionSlug,
    where: resolveWhere(props.where),
    sort: props.sort as CollectionTableSort<string> | undefined,
    drafts: props.drafts,
    depth: props.depth,
    paginationOpts: { numItems: props.numItems, totalDocs: true, cursor: props.cursor ?? null },
  };
}

/** Props for {@link buildListSearchQueryArgs}. */
export interface BuildListSearchQueryArgsProps<TFieldSlug extends string = string>
  extends BuildListQueryArgsBaseProps<TFieldSlug> {
  /** Raw search text. Never empty — the caller branches to {@link buildListFindQueryArgs} instead when it is. */
  search: string;
  /** Which `admin.table.searchField` entry `search` queries — `validateTableConfig` (Design Decision 3) guarantees it has a declared `searchIndex`. */
  searchField: TFieldSlug;
}

/**
 * Builds the exact `search` Convex args for one list page — shared by `useVexListQuery`'s
 * search-mode branch (client, Step 8) and `NextAdminPage`'s prerender (server, Design
 * Decision 39). `sort` is never part of this call (Design Decision 7) — search results
 * are relevance-ordered.
 *
 * @throws {Error} When `searchField` names a field with no declared `searchIndex` —
 *   `validateTableConfig` (Design Decision 3) already prevents this at config time, so
 *   reaching it here means a caller bug, not a config gap.
 * @param props - Input props.
 * @returns The args, ready for `convexQuery(vexConvexApi.search, …)` or
 *   `fetchQuery(vexConvexApi.search, …)`.
 */
export function buildListSearchQueryArgs<TFieldSlug extends string = string>(
  props: BuildListSearchQueryArgsProps<TFieldSlug>,
): VexSearchArgs {
  const field = (props.collection.fields as Record<string, { searchIndex?: { name: string } } | undefined>)[
    props.searchField as string
  ];
  if (field === undefined || field.searchIndex === undefined) {
    throw new Error(`buildListSearchQueryArgs: field "${String(props.searchField)}" has no declared searchIndex`);
  }
  return {
    collection: props.collection.slug,
    searchIndexName: field.searchIndex.name,
    searchField: props.searchField as string,
    query: props.search,
    where: resolveWhere(props.where),
    drafts: props.drafts,
    paginationOpts: { numItems: props.numItems, cursor: props.cursor ?? null },
  };
}
```

#### packages/core/src/collections/buildListQueryArgs.test.ts

New file, complete.

```ts
import { describe, expect, it } from "vitest";
import { checkbox, defineCollection, text } from "../index";
import { buildListFindQueryArgs, buildListSearchQueryArgs } from "./buildListQueryArgs";

const collection = defineCollection({
  slug: "posts",
  fields: {
    title: text({ searchIndex: { name: "search_title", filterFields: [] } }),
    featured: checkbox(),
  },
});

describe("buildListFindQueryArgs", () => {
  it("builds a find-mode call carrying the given where/sort/drafts/depth", () => {
    const where = { field: "featured", op: "eq", value: true } as const;
    const sort = { field: "title", order: "asc" } as const;
    expect(buildListFindQueryArgs({ collection, where, sort, drafts: true, depth: 1, numItems: 10 })).toEqual({
      collection: "posts",
      where,
      sort,
      drafts: true,
      depth: 1,
      paginationOpts: { numItems: 10, totalDocs: true, cursor: null },
    });
  });

  it("resolves a builder-callback where to a plain node", () => {
    const result = buildListFindQueryArgs({ collection, where: (q) => q.eq("featured", true), numItems: 10 });
    expect(result.where).toEqual({ field: "featured", op: "eq", value: true });
  });

  it("omits where/sort/drafts/depth when none are given", () => {
    expect(buildListFindQueryArgs({ collection, numItems: 10 })).toEqual({
      collection: "posts",
      where: undefined,
      sort: undefined,
      drafts: undefined,
      depth: undefined,
      paginationOpts: { numItems: 10, totalDocs: true, cursor: null },
    });
  });

  it("forwards an explicit cursor instead of defaulting to null", () => {
    expect(buildListFindQueryArgs({ collection, numItems: 10, cursor: "abc" }).paginationOpts.cursor).toBe("abc");
  });
});

describe("buildListSearchQueryArgs", () => {
  it("resolves searchField to its declared searchIndex name", () => {
    expect(buildListSearchQueryArgs({ collection, search: "hello", searchField: "title", numItems: 10 })).toEqual({
      collection: "posts",
      searchIndexName: "search_title",
      searchField: "title",
      query: "hello",
      where: undefined,
      drafts: undefined,
      paginationOpts: { numItems: 10, cursor: null },
    });
  });

  it("throws when searchField names a field with no declared searchIndex", () => {
    expect(() =>
      buildListSearchQueryArgs({ collection, search: "hello", searchField: "featured", numItems: 10 }),
    ).toThrow('field "featured" has no declared searchIndex');
  });

  it("throws when searchField names an unknown field", () => {
    expect(() =>
      buildListSearchQueryArgs({ collection, search: "hello", searchField: "ghost", numItems: 10 }),
    ).toThrow('field "ghost" has no declared searchIndex');
  });
});
```

#### packages/core/src/collections/resolveListQueryState.ts

New file, complete.

```ts
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";
import { composeViewWhere } from "./composeViewWhere";
import type { ListParams } from "./listUrlParams";
import type { CollectionConfig, CollectionTableSort, VexStoredView, VexViewConfig, VexViewState } from "./types";

/** {@link resolveListQueryState}'s result — one list query's fully-resolved, view-aware state, ready for `buildListFindQueryArgs`/`buildListSearchQueryArgs` (`collections/buildListQueryArgs.ts`). */
export interface ResolvedListQueryState<TFieldSlug extends string = string> {
  /** A config view's hidden filter ANDed with the caller's own (Design Decision 25), or a shared/local view's own filter, or just the caller's filter with no view active. */
  where: VexWhereNodeOf<unknown> | undefined;
  /** Parked (`undefined`) whenever `search` is non-empty (Design Decision 7) — callers must check `search` before reading this. */
  sort: CollectionTableSort<TFieldSlug> | undefined;
  /** `""` means no search is active. */
  search: string;
  searchField: TFieldSlug | undefined;
  pageSize: number;
}

/**
 * Resolves one list query's effective state by merging three layers, narrowest first: the
 * parsed URL (`params`, Design Decision 40's codec), the active view's own saved state
 * (`configView`/`sharedView`, whichever the caller resolved `params.view` to), and the
 * collection's own `admin.table` defaults.
 *
 * This merge is what makes a bare `?view=shared:<id>` link — unmodified from the saved
 * view, so `serializeListParams` wrote none of its matching params (Design Decision 9:
 * "only params that differ from the saved view appear") — render the SAME rows as the
 * view's own tab: without it, an omitted `sort`/`filter` would silently fall back to the
 * collection default instead of the view's. A **local** view never reaches here with
 * `configView`/`sharedView` set — its full state is always in the URL already (Design
 * Decision 41), so `params` alone is already complete for it.
 *
 * Called by `NextAdminPage` (server prerender, Design Decision 39, this step) and by
 * `CollectionListView` (client, Steps 9/10/12) before either builds its query args — the
 * ONE place this merge lives, so a link to an unmodified view can't render different rows
 * on the two sides (`layout-stability.md`).
 *
 * @param props - Input props.
 * @param props.collection - The resolved collection config — supplies the `admin.table`
 *   defaults (`defaultSort`, `searchField[0]`, `defaultPageSize`).
 * @param props.params - The parsed URL state.
 * @param props.configView - The `config`-source view `params.view` names, from
 *   `collection.admin.table.views` (always in memory) — `undefined` for any other source.
 * @param props.sharedView - The `shared`-source view `params.view` names, from the
 *   fetched/cached `listViews` result — `undefined` for any other source.
 * @returns The resolved state.
 */
export function resolveListQueryState<TFieldSlug extends string = string>(props: {
  collection: CollectionConfig;
  params: ListParams<TFieldSlug>;
  configView?: VexViewConfig<TFieldSlug>;
  sharedView?: VexStoredView<TFieldSlug>;
}): ResolvedListQueryState<TFieldSlug> {
  const viewState: VexViewState<TFieldSlug> | undefined = props.configView?.state ?? props.sharedView?.state;
  const where =
    props.configView !== undefined
      ? composeViewWhere({
          viewWhere: props.configView.state.where,
          filter: props.params.filter as VexWhereNodeOf<unknown> | undefined,
        })
      : ((props.params.filter as VexWhereNodeOf<unknown> | undefined) ?? viewState?.where);
  return {
    where,
    sort: props.params.sort ?? viewState?.sort ?? props.collection.admin.table.defaultSort,
    search: props.params.q !== "" ? props.params.q : (viewState?.search ?? ""),
    searchField:
      props.params.qf ??
      viewState?.searchField ??
      (props.collection.admin.table.searchField[0] as TFieldSlug | undefined),
    pageSize: props.params.size ?? viewState?.pageSize ?? props.collection.admin.table.defaultPageSize,
  };
}
```

#### packages/core/src/collections/resolveListQueryState.test.ts

New file, complete.

```ts
import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../index";
import { resolveListQueryState } from "./resolveListQueryState";
import type { ListParams } from "./listUrlParams";
import type { VexStoredView, VexViewConfig } from "./types";

const collection = defineCollection({
  slug: "posts",
  fields: { title: text() },
  admin: {
    table: {
      searchField: ["title"],
      defaultSort: { field: "_creationTime", order: "desc" },
      defaultPageSize: 10,
    },
  },
});

function params(overrides: Partial<ListParams> = {}): ListParams {
  return {
    q: "",
    qf: undefined,
    sort: undefined,
    filter: undefined,
    size: undefined,
    view: undefined,
    peek: undefined,
    ...overrides,
  };
}

describe("resolveListQueryState — no active view", () => {
  it("falls back to the collection's own defaults when the URL carries nothing", () => {
    expect(resolveListQueryState({ collection, params: params() })).toEqual({
      where: undefined,
      sort: { field: "_creationTime", order: "desc" },
      search: "",
      searchField: "title",
      pageSize: 10,
    });
  });

  it("the URL's own values win over the collection defaults", () => {
    const sort = { field: "title", order: "asc" } as const;
    const filter = { field: "title", op: "eq", value: "x" } as const;
    expect(
      resolveListQueryState({ collection, params: params({ sort, filter, size: 25, q: "hi", qf: "title" }) }),
    ).toMatchObject({ where: filter, sort, search: "hi", searchField: "title", pageSize: 25 });
  });
});

describe("resolveListQueryState — config view", () => {
  const configView: VexViewConfig = {
    viewId: "cfg1",
    name: "Featured",
    state: {
      where: { field: "title", op: "eq", value: "featured" },
      sort: { field: "title", order: "asc" },
      pageSize: 50,
    },
  };

  it("composes the hidden where with the caller's own filter", () => {
    const filter = { field: "title", op: "neq", value: "x" } as const;
    const result = resolveListQueryState({ collection, params: params({ filter, view: "config:cfg1" }), configView });
    expect(result.where).toEqual({ and: [configView.state.where, filter] });
  });

  it("uses the hidden where alone when the caller has no filter of their own", () => {
    const result = resolveListQueryState({ collection, params: params({ view: "config:cfg1" }), configView });
    expect(result.where).toEqual(configView.state.where);
  });

  it("falls back to the view's own sort/pageSize when the URL omits them — an unmodified config-view link", () => {
    const result = resolveListQueryState({ collection, params: params({ view: "config:cfg1" }), configView });
    expect(result.sort).toEqual({ field: "title", order: "asc" });
    expect(result.pageSize).toBe(50);
  });

  it("the URL's own sort still wins over the view's", () => {
    const sort = { field: "_creationTime", order: "desc" } as const;
    const result = resolveListQueryState({ collection, params: params({ sort, view: "config:cfg1" }), configView });
    expect(result.sort).toEqual(sort);
  });
});

describe("resolveListQueryState — shared view", () => {
  const sharedView: VexStoredView = {
    viewId: "shared1",
    name: "Team view",
    collection: "posts",
    createdBy: "user1",
    state: {
      where: { field: "title", op: "eq", value: "shared" },
      sort: { field: "title", order: "desc" },
      search: "saved",
    },
  };

  it("falls back to the view's own where/sort/search when the URL carries none of them — an unmodified shared link", () => {
    const result = resolveListQueryState({ collection, params: params({ view: "shared:shared1" }), sharedView });
    expect(result).toMatchObject({ where: sharedView.state.where, sort: sharedView.state.sort, search: "saved" });
  });

  it("the URL's own filter still wins over the shared view's where — no hidden composition for a shared source", () => {
    const filter = { field: "title", op: "neq", value: "y" } as const;
    const result = resolveListQueryState({ collection, params: params({ filter, view: "shared:shared1" }), sharedView });
    expect(result.where).toEqual(filter);
  });
});

describe("resolveListQueryState — local view", () => {
  it("reads the URL's own full state directly — no configView/sharedView to merge (Design Decision 41)", () => {
    const sort = { field: "title", order: "asc" } as const;
    const filter = { field: "title", op: "eq", value: "z" } as const;
    const result = resolveListQueryState({ collection, params: params({ sort, filter, view: "local:loc1" }) });
    expect(result).toMatchObject({ where: filter, sort });
  });
});
```

#### packages/core/src/collections/listViewsCookie.ts

New file, complete.

```ts
/** Prefix for the cookie mirroring one collection's local saved-view index (Design Decision 41). */
const LIST_VIEWS_COOKIE_PREFIX = "vex-list-views:";

/** One entry in the local-view index — just enough to render a tab before hydration. */
export interface LocalListViewIndexEntry {
  viewId: string;
  name: string;
}

/**
 * Cookie name holding one collection's local saved-view index.
 *
 * Lives in `@vexcms/core`, like `livePreviewPanelCookieName` (`livePreview/panelCookie.ts`):
 * both the server component that reads it (`NextAdminPage`) and the client store that
 * writes it (`listView/listViewStore.ts`, Step 12) need it, and the store's module carries
 * `"use client"`, which would make a co-located export unreachable from the server.
 *
 * @param props.collection - The collection slug the cookie is scoped to.
 * @returns The fully-qualified cookie name.
 */
export function localListViewsCookieName(props: { collection: string }): string {
  return `${LIST_VIEWS_COOKIE_PREFIX}${props.collection}`;
}

/**
 * Parses the local-view index cookie into its `{ viewId, name }[]` entries (Design
 * Decision 41). The store accepts a stale entry whose `localStorage` view was cleared —
 * it renders the tab until hydration, then prunes it — so this reader never validates
 * against anything beyond its own shape, it just decodes.
 *
 * @param props.cookieValue - The raw cookie value, or `undefined` when unset.
 * @returns The index entries, or `[]` for an unset, empty, or malformed cookie — never throws.
 */
export function readLocalListViewsCookie(props: { cookieValue: string | undefined }): LocalListViewIndexEntry[] {
  if (!props.cookieValue) return [];
  try {
    const parsed: unknown = JSON.parse(props.cookieValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is LocalListViewIndexEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as LocalListViewIndexEntry).viewId === "string" &&
        typeof (entry as LocalListViewIndexEntry).name === "string",
    );
  } catch {
    return [];
  }
}
```

#### packages/core/src/collections/listViewsCookie.test.ts

New file, complete.

```ts
import { describe, expect, it } from "vitest";
import { localListViewsCookieName, readLocalListViewsCookie } from "./listViewsCookie";

describe("localListViewsCookieName", () => {
  it("scopes the cookie per collection", () => {
    expect(localListViewsCookieName({ collection: "posts" })).toBe("vex-list-views:posts");
  });
});

describe("readLocalListViewsCookie", () => {
  it("returns [] when the cookie is unset", () => {
    expect(readLocalListViewsCookie({ cookieValue: undefined })).toEqual([]);
  });

  it("parses a valid index", () => {
    const cookieValue = JSON.stringify([{ viewId: "v1", name: "Mine" }]);
    expect(readLocalListViewsCookie({ cookieValue })).toEqual([{ viewId: "v1", name: "Mine" }]);
  });

  it("returns [] for malformed JSON", () => {
    expect(readLocalListViewsCookie({ cookieValue: "{not json" })).toEqual([]);
  });

  it("returns [] when the cookie value is a JSON object, not an array", () => {
    expect(readLocalListViewsCookie({ cookieValue: JSON.stringify({ viewId: "v1" }) })).toEqual([]);
  });

  it("drops malformed entries while keeping valid ones", () => {
    const cookieValue = JSON.stringify([{ viewId: "v1", name: "Mine" }, { viewId: "v2" }, "nope"]);
    expect(readLocalListViewsCookie({ cookieValue })).toEqual([{ viewId: "v1", name: "Mine" }]);
  });
});
```

#### packages/core/src/collections/index.ts

Existing file, 1 edit — append to the barrel:

```ts
export * from "./buildListQueryArgs";
export * from "./resolveListQueryState";
export * from "./listViewsCookie";
```

#### packages/core/src/framework.ts

Existing file, 1 edit — add to `CollectionListViewProps`, alongside `initialData`:

```ts
  /**
   * The Inspect peek's prefetched document, read server-side by `NextAdminPage` when
   * `peek=` is set in the URL (Design Decision 39) — forwarded to `ListPeek`'s own
   * `initialDoc` prop (Step 13) so a deep-linked peek opens with no re-fetch. `null` means
   * the server confirmed no match (not-found/no-access); `undefined` means `peek=` was
   * absent.
   */
  initialPeekDoc?: TDoc | null;
```

#### packages/react/src/hooks/useVexListQuery.ts

Existing file (Step 8), 4 edits — both branches call the new shared builders instead of
building their own Convex args inline, and the search branch gains `initialData` support
(previously only the find-mode branch did, which meant a search-active first load — any
page whose URL already has `q=` — had no SSR path and would always repaint after hydration).

**1 — imports.** Add the two new builders to the existing `@vexcms/core` value import, and add
`FindClientPaginatedArgs`, used by edit 2 below:

```ts
import { buildListFindQueryArgs, buildListSearchQueryArgs, vexConvexApi } from "@vexcms/core";
import type { FindClientPaginatedArgs } from "../client";
```

**2 — `useVexListQuery`'s find-mode branch.** Replace the `usePaginatedQuery` call's inline
`query` object with a `buildListFindQueryArgs` call:

```ts
  const findResult = usePaginatedQuery<TDocument>({
    query: buildListFindQueryArgs({
      collection: props.collection,
      where: props.where,
      sort: props.sort,
      drafts: props.drafts,
      depth: props.depth,
      numItems,
    }) as FindClientPaginatedArgs,
    initialData: props.initialData,
    clientPageSize: props.pageSize,
    enabled: !isSearching,
  });
```

**3 — `useVexListQuerySearch`'s props and seeded state.** Add `initialData` to the props
interface, alongside `enabled`, and seed `allResults`/`isDone` from it instead of always
starting empty:

```ts
  initialData?: PaginationResult<TDocument>;
  enabled: boolean;
}): UseVexListQueryReturn<TDocument> {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<TDocument[]>(props.initialData?.page ?? []);
  const [isDone, setIsDone] = useState(props.initialData?.isDone ?? false);
```

And in `useVexListQuery`'s own body, thread `initialData` through to this call — add it to
the existing `useVexListQuerySearch<TDocument>({ … })` call alongside `enabled`:

```ts
    initialData: props.initialData,
    enabled: isSearching,
  });
```

**4 — `useVexListQuerySearch`'s index resolution and the `useQuery` call.** Replace the
`searchIndexName` resolution block through the end of the `useQuery` call — i.e. everything
from `let searchIndexName: string | undefined;` through the `enabled: props.enabled,\n  });`
that closes it — with a `buildListSearchQueryArgs` call, still guarded by `props.enabled` so
a disabled query never resolves a `searchIndexName` for a collection that may have no
`searchField` at all, and seeded from `props.initialData` on the first page:

```ts
  if (props.enabled && props.searchField === undefined) {
    throw new Error("useVexListQuery: `searchField` is required when `search` is non-empty");
  }

  const resolvedWhere = whereArg(props.where);
  const resetKey = JSON.stringify({
    collection: props.collection.slug,
    where: resolvedWhere,
    search: props.search,
    searchField: props.searchField,
    drafts: props.drafts,
    numItems: props.numItems,
  });
```

(the `resetKey` block above is unchanged — shown only so the next block's anchor, right
after it, is unambiguous)

```ts
  const searchArgs =
    props.enabled && props.searchField !== undefined
      ? buildListSearchQueryArgs({
          collection: props.collection,
          where: resolvedWhere,
          search: props.search,
          searchField: props.searchField,
          drafts: props.drafts,
          numItems: props.numItems,
          cursor,
        })
      : undefined;

  const { data, isPending, isLoading, isError } = useQuery({
    ...convexQuery(
      vexConvexApi.search,
      (searchArgs ?? {
        collection: props.collection.slug,
        searchIndexName: "",
        searchField: "",
        query: props.search,
        where: resolvedWhere,
        drafts: props.drafts,
        paginationOpts: { numItems: props.numItems, cursor },
      }) as never,
    ),
    ...(cursor === null && props.initialData ? { initialData: props.initialData } : {}),
    enabled: props.enabled,
  });
```

#### packages/react/src/hooks/useVexListQuery.serverParity.test.tsx

New file, complete.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildListFindQueryArgs, buildListSearchQueryArgs, defineCollection, text } from "@vexcms/core";
import { useVexListQuery } from "./useVexListQuery";

const convexQueryCalls: unknown[] = [];

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (fn: unknown, args: unknown) => {
    convexQueryCalls.push(args);
    return { queryKey: [fn, args], queryFn: () => Promise.resolve(undefined) };
  },
}));

const collection = defineCollection({
  slug: "posts",
  fields: { title: text({ searchIndex: { name: "search_title", filterFields: [] } }) },
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  convexQueryCalls.length = 0;
});

// `NextAdminPage` (Design Decision 39) and this hook must send IDENTICAL Convex args for
// the same list state, or the server's prefetched `initialData` hydrates under the wrong
// query key and the list repaints right after hydration (layout-stability.md). Both now
// go through `buildListFindQueryArgs`/`buildListSearchQueryArgs` — these tests prove this
// hook's real wiring produces exactly what those functions do, so the two can't drift.
describe("useVexListQuery — server parity (layout-stability.md)", () => {
  it("find-mode sends the exact args buildListFindQueryArgs produces for the same props", () => {
    const where = { field: "title", op: "eq", value: "x" } as const;
    const sort = { field: "title", order: "asc" } as const;
    renderHook(() => useVexListQuery({ collection, where, sort, drafts: true, depth: 1, pageSize: 25 }), {
      wrapper,
    });

    const expected = buildListFindQueryArgs({ collection, where, sort, drafts: true, depth: 1, numItems: 100 });
    expect(convexQueryCalls).toContainEqual(expected);
  });

  it("search-mode sends the exact args buildListSearchQueryArgs produces for the same props", () => {
    renderHook(() => useVexListQuery({ collection, search: "hello", searchField: "title", pageSize: 25 }), {
      wrapper,
    });

    const expected = buildListSearchQueryArgs({ collection, search: "hello", searchField: "title", numItems: 100 });
    expect(convexQueryCalls).toContainEqual(expected);
  });
});
```

#### packages/next/src/NextAdminPage.tsx

Existing file, 3 edits.

**1 — imports.** Replace the two `@vexcms/core` import statements at the top of the file:

```ts
import type { CollectionSlug, PaginationResult, VexConfig, VexDocument, VexMediaDocument } from "@vexcms/core";

import {
  appendLivePreviewParams,
  buildListFindQueryArgs,
  buildListSearchQueryArgs,
  livePreviewLayoutCookieName,
  livePreviewPanelCookieName,
  localListViewsCookieName,
  parseListParams,
  parseListPreferences,
  readLivePreviewLayoutCookie,
  readLivePreviewPanelCookie,
  readLocalListViewsCookie,
  resolveListQueryState,
  resolveLivePreviewSettings,
  vexConvexApi,
} from "@vexcms/core";
```

**2 — function signature.** Add `searchParams`, forwarded by the app route — optional so
existing callers (tests, routes not yet updated) keep compiling; an omitted value parses as
no params:

```ts
export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ path?: string[] }>;
  /**
   * Next.js's own `searchParams` prop, forwarded by the app route (`AdminPage`). Only the
   * collection list route reads it (`parseListParams`, Design Decision 40) — every other
   * route ignores it.
   */
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  token?: string;
}) {
```

**3 — the collection list branch.** Replace the final block, from `if (!collection) {` to
the closing `}` of the function:

```ts
  if (!collection) {
    throw new Error("invalid collection slug");
  }

  const params = parseListParams({
    searchParams: toSearchParams((await props.searchParams) ?? {}),
    collection,
  });

  const [sharedViews, peekDoc] = await Promise.all([
    // One indexed read of a small table — the view tabs need it on first paint anyway
    // (Design Decision 39), and it resolves a `shared`-source `params.view` below.
    fetchQuery(
      vexConvexApi.listViews,
      { collection: collection.slug },
      props.token ? { token: props.token } : undefined,
    ),
    params.peek === undefined
      ? Promise.resolve(undefined)
      : // Same args as `useVexDocQuery`'s client query inside `ListPeek` (Design Decision
        // 27/39), so the hydrated peek opens with no re-fetch.
        fetchQuery(
          vexConvexApi.get,
          { id: params.peek, collection: collection.slug, drafts: collection.versions.drafts },
          props.token ? { token: props.token } : undefined,
        ),
  ]);

  const [viewSource, viewId] = params.view?.split(":") ?? [];
  const configView =
    viewSource === "config" ? collection.admin.table.views.find((view) => view.viewId === viewId) : undefined;
  const sharedView = viewSource === "shared" ? sharedViews.find((view) => view.viewId === viewId) : undefined;

  const resolved = resolveListQueryState({ collection, params, configView, sharedView });
  const numItems = Math.max(collection.admin.table.serverPageSize, resolved.pageSize);
  const drafts = collection.versions.drafts ? true : undefined;

  // Same branch `useVexListQuery` takes (Design Decision 7/39): `search` non-empty means
  // `findPaginated` is the wrong endpoint entirely, not just the wrong args.
  const initialData =
    resolved.search.length > 0
      ? await fetchQuery(
          vexConvexApi.search,
          buildListSearchQueryArgs({
            collection,
            where: resolved.where,
            search: resolved.search,
            searchField: resolved.searchField as string,
            drafts,
            numItems,
          }),
          props.token ? { token: props.token } : undefined,
        )
      : await fetchQuery(
          vexConvexApi.findPaginated,
          // Same args `useVexListQuery`'s find-mode branch sends (Design Decision 39) —
          // `buildListFindQueryArgs` (Step 8/14) is the one place this shape lives.
          buildListFindQueryArgs({ collection, where: resolved.where, sort: resolved.sort, drafts, depth: 1, numItems }),
          props.token ? { token: props.token } : undefined,
        );

  return (
    <CollectionListView
      collection={collection.slug}
      initialData={initialData as PaginationResult<VexDocument>}
      initialViews={sharedViews}
      initialLocalIndex={readLocalListViewsCookie({
        cookieValue: cookieStore.get(localListViewsCookieName({ collection: collection.slug }))?.value,
      })}
      initialPreferences={parseListPreferences({ cookies: cookieStore })}
      initialPeekDoc={peekDoc as VexDocument | null | undefined}
    />
  );
}

/**
 * Converts Next.js's `searchParams` shape (`{ [key]: string | string[] | undefined }`) to
 * the `URLSearchParams` `parseListParams` (Design Decision 40) expects — the one place this
 * conversion happens, since every other reader of the list URL is client-side, where
 * `URLSearchParams` is already what `useSearchParams()`/`nuqs` hand back.
 *
 * @param raw - The awaited `searchParams` prop.
 * @returns An equivalent `URLSearchParams`, repeating a key for each array entry.
 */
function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) params.append(key, entry);
  }
  return params;
}
```

#### packages/next/src/NextAdminPage.test.ts

Existing file, 3 edits.

**1 — imports.** Add `checkbox` to the existing `@vexcms/core` import:

```ts
import { checkbox, defineCollection, defineConfig, defineGlobal, text, vexConvexApi } from "@vexcms/core";
```

**2 — fixtures and the `render` helper.** Add a third collection, with a declared search
index and a config view with a hidden filter, alongside `plainPages`; include it in `config`;
and give `render` an optional `searchParams` argument (existing calls, which omit it, are
unaffected):

```ts
const viewsPosts = defineCollection({
  slug: "posts2",
  fields: {
    title: text({ searchIndex: { name: "search_title", filterFields: [] } }),
    featured: checkbox(),
  },
  admin: {
    table: {
      searchField: ["title"],
      defaultSort: { field: "_creationTime", order: "desc" },
      defaultPageSize: 10,
      serverPageSize: 3,
      views: [{ viewId: "cfg1", name: "Featured", state: { where: { field: "featured", op: "eq", value: true } } }],
    },
  },
});

const config = defineConfig({
  collections: [versionedPosts, plainPages, viewsPosts],
  globals: [versionedBanner],
}) as unknown as VexConfig;

async function render(path: string[], searchParams: Record<string, string> = {}) {
  await NextAdminPage({ config, params: Promise.resolve({ path }), searchParams: Promise.resolve(searchParams) });
}
```

**3 — new describe block.** Add after the `"NextAdminPage — unrecognized first path segment"`
block:

```ts
const sharedViewFixture = {
  viewId: "shared1",
  name: "Team view",
  collection: "posts2",
  createdBy: "user1",
  state: { sort: { field: "title", order: "desc" } as const, pageSize: 50 },
};

describe("NextAdminPage — list view prerender (Design Decision 39)", () => {
  beforeEach(() => {
    fetchQueryMock.mockReset().mockImplementation((fn: unknown) => {
      if (fn === vexConvexApi.listViews) return Promise.resolve([sharedViewFixture]);
      if (fn === vexConvexApi.findPaginated) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      if (fn === vexConvexApi.search) return Promise.resolve({ page: [], isDone: true, continueCursor: "" });
      return Promise.resolve(null);
    });
  });

  it("a default list prefetches findPaginated with the collection's own defaults", async () => {
    await render(["collections", "posts2"]);
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      collection: "posts2",
      where: undefined,
      sort: { field: "_creationTime", order: "desc" },
      paginationOpts: { numItems: 10, totalDocs: true, cursor: null },
    });
  });

  it("q switches the prefetch to search, with the searchField's declared index", async () => {
    await render(["collections", "posts2"], { q: "hello" });
    expect(prefetchArgs(vexConvexApi.search)).toMatchObject({
      collection: "posts2",
      searchIndexName: "search_title",
      searchField: "title",
      query: "hello",
    });
  });

  it("sort flows straight into findPaginated's args", async () => {
    await render(["collections", "posts2"], { sort: "title.asc" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ sort: { field: "title", order: "asc" } });
  });

  it("filter decodes to the same where shape the filter builder produces", async () => {
    await render(["collections", "posts2"], { filter: "(featured.eq.true)" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      where: { field: "featured", op: "eq", value: true },
    });
  });

  it("size changes paginationOpts.numItems (serverPageSize is 3, below the requested size)", async () => {
    await render(["collections", "posts2"], { size: "5" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ paginationOpts: { numItems: 5 } });
  });

  it("a shared view's own sort/pageSize apply when the URL carries neither — an unmodified shared link", async () => {
    await render(["collections", "posts2"], { view: "shared:shared1" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      sort: { field: "title", order: "desc" },
      paginationOpts: { numItems: 50 },
    });
  });

  it("a config view's hidden filter composes alone when the caller adds no filter of their own", async () => {
    await render(["collections", "posts2"], { view: "config:cfg1" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      where: { field: "featured", op: "eq", value: true },
    });
  });

  it("a local view's full URL state is used as-is — no server-side view to look up", async () => {
    await render(["collections", "posts2"], { view: "local:loc1", sort: "title.desc", filter: "(featured.eq.true)" });
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({
      sort: { field: "title", order: "desc" },
      where: { field: "featured", op: "eq", value: true },
    });
  });

  it("peek= prefetches get with the same args ListPeek's useVexDocQuery sends", async () => {
    await render(["collections", "posts2"], { peek: "doc1" });
    expect(prefetchArgs(vexConvexApi.get)).toEqual({ id: "doc1", collection: "posts2", drafts: false });
  });

  it("every render prefetches listViews once, for the tabs", async () => {
    await render(["collections", "posts2"]);
    expect(prefetchArgs(vexConvexApi.listViews)).toEqual({ collection: "posts2" });
  });
});
```

#### apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx

Existing file, 2 edits.

**1 — function signature.** Replace:

```tsx
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
```

**2 — render call.** Replace:

```tsx
  return <NextAdminPage config={config} params={params} searchParams={searchParams} token={token} />;
```

#### apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx

Existing file, same 2 edits as `apps/test`'s route above (identical content).

#### packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/[[...path]]/page.tsx

Existing file, same 2 edits as `apps/test`'s route above (identical content).

#### apps/test/convex/seed.ts

Existing file, 1 edit — the embedded "one route in your app" code example stays
copy-pasteable. Replace the `code:` template literal's function signature and return line:

```ts
        code: `import { NextAdminPage } from "@vexcms/next/server"
import { redirect } from "next/navigation"

import { getToken } from "~/auth/server"
import config from "~/vex.config.server"

// The whole panel is one route in your app. Gate it however you
// gate anything else, then hand it the config you already wrote.
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const token = await getToken()
  if (!token) redirect("/auth/sign-in?redirectTo=/admin")

  return <NextAdminPage config={config} params={params} searchParams={searchParams} token={token} />
}`,
```

#### apps/www/convex/seed.ts

Existing file, same 1 edit as `apps/test/convex/seed.ts` above (identical template literal).

Verify: `pnpm --filter @vexcms/core test -- collections && pnpm --filter @vexcms/react test -- hooks && pnpm --filter @vexcms/next test && browser: hard-reload a default list, a `q` link, a `sort` link, a `filter` link, a shared-view link, a config-view link with its hidden filter, a local-view link, a `size` link, and a `peek` link — zero visible layout shift on each`

### Step 15 — Keyboard shortcuts [agent]

Why: Decision 30 pins the shortcut set to six core keys, handled by one internal hook built on `useEventListener` from `@ts-hooks-kit/core` — no new dependency, no command palette, no rebinding (Out of Scope). Per Decision 21, the hook lives in `collections/listView/` (the closed feature-subfolder set), named `useListShortcuts` with the `Collection`/`List` folder-scope prefix dropped, following the `listView/useListUrlState.ts` precedent from Step 10. Nothing here depends on the server-prerender, URL-codec, cookie, or CSS-collapse decisions (39–43): the hook only binds `window` keydown listeners and calls caller-supplied callbacks.

- [ ] `packages/react/src/collections/listView/useListShortcuts.ts`
- [ ] `packages/react/src/collections/listView/useListShortcuts.test.ts`
- [ ] `packages/react/src/collections/index.ts`

#### packages/react/src/collections/listView/useListShortcuts.ts

```tsx
"use client";

import { type RefObject } from "react";
import { useEventListener } from "@ts-hooks-kit/core";

/**
 * Props for {@link useListShortcuts}.
 *
 * The hook owns no state — every key resolves to one of these callbacks,
 * and the caller (`ListLayout`, Step 9) is the single source of truth for
 * row focus, selection, and peek/overlay state. `ListLayout` typically
 * wires these callbacks to `useCollectionList()` (Step 9) and the peek's
 * `url state` (Step 13), rather than this hook reading that context
 * itself, so it stays testable without a provider.
 */
export interface UseListShortcutsProps {
  /** `false` suspends all bindings, e.g. while the list is loading or the collection has zero readable rows. */
  enabled: boolean;
  /** Focus target for `/`. */
  searchInputRef: RefObject<HTMLInputElement | null>;
  /**
   * Ordered ids of the rows currently rendered (loaded pages only, Decision
   * 8's "all loaded" scope), used to resolve `↑`/`↓`/`Shift+X` targets.
   */
  rowIds: readonly string[];
  /** The row id `↑`/`↓` currently rest on, or `null` before any row has focus. */
  focusedRowId: string | null;
  /** Moves row focus, called with the next id after `↑`/`↓` resolve it from `rowIds`. */
  onFocusRowChange: (rowId: string) => void;
  /** `Enter` on the focused row. */
  onOpenRow: (rowId: string) => void;
  /** `Space` on the focused row — toggles the Inspect peek (Step 13). */
  onTogglePeek: (rowId: string) => void;
  /** `X` on the focused row. */
  onToggleRowSelection: (rowId: string) => void;
  /**
   * `Shift+X`: selects every row between `anchorRowId` and `focusedRowId`
   * inclusive. `anchorRowId` is the last row touched by a plain `X`, kept
   * by the caller (mirrors the native shift-click convention).
   */
  onSelectRange: (props: { anchorRowId: string; focusedRowId: string }) => void;
  /** Non-zero while any row is selected, read by `Esc`'s second priority. */
  selectedCount: number;
  /** Clears the current selection, called by `Esc` when `selectedCount > 0` and no overlay was open. */
  onClearSelection: () => void;
  /**
   * Closes the single top-most overlay (peek panel/sheet, open menu,
   * dialog) if one is open and reports whether it did. `Esc` tries this
   * FIRST and only falls through to clearing the selection when this
   * returns `false`.
   */
  closeTopOverlay: () => boolean;
}

/**
 * Binds the list view's six core keyboard shortcuts to `window` via
 * `useEventListener("keydown", …)`.
 *
 * - `/` focuses search (`searchInputRef.current.focus()`), preventing the
 *   default (Firefox's quick-find).
 * - `Esc` tries, in order, stopping at the first that applies: (1)
 *   `closeTopOverlay()`, (2) clear selection when `selectedCount > 0`, (3)
 *   blur `document.activeElement` when it is `searchInputRef.current`.
 * - `↑`/`↓` move `focusedRowId` to the previous/next id in `rowIds`,
 *   clamped at the ends (no wraparound), defaulting to `rowIds[0]` when
 *   `focusedRowId` is `null`. No-op when `rowIds` is empty.
 * - `Enter` calls `onOpenRow(focusedRowId)` when a row has focus.
 * - `Space` calls `onTogglePeek(focusedRowId)` when a row has focus,
 *   preventing the default (page scroll).
 * - `X` calls `onToggleRowSelection(focusedRowId)`; `Shift+X` calls
 *   `onSelectRange({ anchorRowId, focusedRowId })` using the last
 *   plain-`X` target as `anchorRowId`, falling back to `focusedRowId`
 *   itself when no anchor has been set yet.
 *
 * None of these fire while `enabled` is `false`, while focus sits inside
 * an `input`, `textarea`, `[contenteditable]`, or an open `[role="dialog"]`
 * / `[role="menu"]` / `[role="listbox"]`, or while `event.isComposing` is
 * `true` (IME composition). Matching is on `event.key`, never `event.code`.
 *
 * @param props - See {@link UseListShortcutsProps}.
 *
 * @example
 * ```tsx
 * useListShortcuts({
 *   enabled: !isLoading,
 *   searchInputRef,
 *   rowIds: rows.map((row) => row._id),
 *   focusedRowId,
 *   onFocusRowChange: setFocusedRowId,
 *   onOpenRow: (id) => router.push(adminHref({ slug: collection.slug, id })),
 *   onTogglePeek: (id) => setPeek(peek === id ? null : id),
 *   onToggleRowSelection: selection.toggleRow,
 *   onSelectRange: ({ anchorRowId, focusedRowId }) => selectRowRange(anchorRowId, focusedRowId),
 *   selectedCount: selection.getSelectionCount(),
 *   onClearSelection: selection.clearSelection,
 *   closeTopOverlay,
 * });
 * ```
 */
export function useListShortcuts(props: UseListShortcutsProps): void {
  useEventListener("keydown", (event: KeyboardEvent) => {
    // TODO: implement
    // 1. Bail when shortcuts don't apply:
    //    a. `!props.enabled` → return
    //    b. `event.isComposing` → return
    //    c. `isTypingTarget(event.target)` (input/textarea/contenteditable/open dialog-menu-listbox, a
    //       module-local helper) → return, EXCEPT `Esc` is still allowed to blur search from inside the
    //       search input itself
    // 2. Switch on `event.key`:
    //    a. `"/"` → `event.preventDefault()`, `props.searchInputRef.current?.focus()`
    //    b. `"Escape"` → try `props.closeTopOverlay()`; if it returned `false` and
    //       `props.selectedCount > 0`, call `props.onClearSelection()`; else if
    //       `document.activeElement === props.searchInputRef.current`,
    //       `(document.activeElement as HTMLElement).blur()`
    //    c. `"ArrowUp"` / `"ArrowDown"` → resolve the next id from `props.rowIds` relative to
    //       `props.focusedRowId` (clamped, no wrap, default to `rowIds[0]`), `event.preventDefault()`,
    //       call `props.onFocusRowChange(nextId)` → no-op when `rowIds` is empty
    //    d. `"Enter"` → when `props.focusedRowId` is set, `props.onOpenRow(props.focusedRowId)`
    //    e. `" "` (Space) → when `props.focusedRowId` is set, `event.preventDefault()`,
    //       `props.onTogglePeek(props.focusedRowId)`
    //    f. `"x"` / `"X"` → when `props.focusedRowId` is set: plain → `props.onToggleRowSelection(…)`
    //       and record it as the next range anchor; `event.shiftKey` → `props.onSelectRange({ anchorRowId, focusedRowId })`
    // Edge cases:
    // - No row focused yet (`focusedRowId === null`): Enter/Space/X/Shift+X are no-ops.
    // - `rowIds` changes (new page loaded, filter applied) while a stale `focusedRowId` is no longer
    //   present: `↑`/`↓` falls back to `rowIds[0]` on the next press rather than throwing.
    throw new Error("Not implemented");
  });
}
```

#### packages/react/src/collections/listView/useListShortcuts.test.ts

```tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useListShortcuts, type UseListShortcutsProps } from "./useListShortcuts";

function fireKey(init: KeyboardEventInit, target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
  });
}

function setup(overrides: Partial<UseListShortcutsProps> = {}) {
  const searchInput = document.createElement("input");
  document.body.appendChild(searchInput);
  const props: UseListShortcutsProps = {
    enabled: true,
    searchInputRef: { current: searchInput },
    rowIds: ["row-1", "row-2", "row-3"],
    focusedRowId: "row-2",
    onFocusRowChange: vi.fn(),
    onOpenRow: vi.fn(),
    onTogglePeek: vi.fn(),
    onToggleRowSelection: vi.fn(),
    onSelectRange: vi.fn(),
    selectedCount: 0,
    onClearSelection: vi.fn(),
    closeTopOverlay: vi.fn(() => false),
    ...overrides,
  };
  renderHook(() => useListShortcuts(props));
  return props;
}

describe("useListShortcuts", () => {
  it("focuses search on '/'", () => {
    const props = setup();
    const focusSpy = vi.spyOn(props.searchInputRef.current!, "focus");
    fireKey({ key: "/" });
    expect(focusSpy).toHaveBeenCalledOnce();
  });

  it("moves row focus down on ArrowDown, clamped at the last row", () => {
    const props = setup({ focusedRowId: "row-3" });
    fireKey({ key: "ArrowDown" });
    expect(props.onFocusRowChange).not.toHaveBeenCalled();
  });

  it("moves row focus up on ArrowUp", () => {
    const props = setup({ focusedRowId: "row-2" });
    fireKey({ key: "ArrowUp" });
    expect(props.onFocusRowChange).toHaveBeenCalledWith("row-1");
  });

  it("defaults ArrowDown to the first row when nothing is focused", () => {
    const props = setup({ focusedRowId: null });
    fireKey({ key: "ArrowDown" });
    expect(props.onFocusRowChange).toHaveBeenCalledWith("row-1");
  });

  it("opens the focused row on Enter", () => {
    const props = setup({ focusedRowId: "row-2" });
    fireKey({ key: "Enter" });
    expect(props.onOpenRow).toHaveBeenCalledWith("row-2");
  });

  it("toggles the peek on Space and prevents the page scroll", () => {
    const props = setup({ focusedRowId: "row-2" });
    fireKey({ key: " " });
    expect(props.onTogglePeek).toHaveBeenCalledWith("row-2");
  });

  it("toggles selection on X", () => {
    const props = setup({ focusedRowId: "row-2" });
    fireKey({ key: "x" });
    expect(props.onToggleRowSelection).toHaveBeenCalledWith("row-2");
    expect(props.onSelectRange).not.toHaveBeenCalled();
  });

  it("selects a range on Shift+X using the last plain-X target as the anchor", () => {
    const props = setup({ focusedRowId: "row-1" });
    fireKey({ key: "x" });
    fireKey({ key: "X", shiftKey: true, ...({ focusedRowId: "row-3" } as never) });
    expect(props.onToggleRowSelection).toHaveBeenCalledWith("row-1");
    expect(props.onSelectRange).toHaveBeenCalledWith({ anchorRowId: "row-1", focusedRowId: "row-1" });
  });

  it("Esc closes the top overlay first and does not also clear the selection", () => {
    const props = setup({ selectedCount: 2, closeTopOverlay: vi.fn(() => true) });
    fireKey({ key: "Escape" });
    expect(props.closeTopOverlay).toHaveBeenCalledOnce();
    expect(props.onClearSelection).not.toHaveBeenCalled();
  });

  it("Esc clears the selection when no overlay was open", () => {
    const props = setup({ selectedCount: 2, closeTopOverlay: vi.fn(() => false) });
    fireKey({ key: "Escape" });
    expect(props.onClearSelection).toHaveBeenCalledOnce();
  });

  it("Esc blurs search when no overlay and no selection", () => {
    const props = setup({ selectedCount: 0, closeTopOverlay: vi.fn(() => false) });
    props.searchInputRef.current!.focus();
    expect(document.activeElement).toBe(props.searchInputRef.current);
    fireKey({ key: "Escape" });
    expect(document.activeElement).not.toBe(props.searchInputRef.current);
  });

  it("ignores shortcuts while typing in an input other than search", () => {
    const props = setup({ focusedRowId: "row-2" });
    const otherInput = document.createElement("input");
    document.body.appendChild(otherInput);
    otherInput.focus();
    fireKey({ key: "Enter" }, otherInput);
    expect(props.onOpenRow).not.toHaveBeenCalled();
  });

  it("ignores shortcuts while composing an IME", () => {
    const props = setup({ focusedRowId: "row-2" });
    fireKey({ key: "Enter", isComposing: true });
    expect(props.onOpenRow).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const props = setup({ enabled: false, focusedRowId: "row-2" });
    fireKey({ key: "Enter" });
    expect(props.onOpenRow).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/collections/index.ts

1 edit — new export alongside the list-view barrel exports (Step 2).

**1 — barrel export.** Alongside the other `./listView/*` exports (e.g. `export * from "./listView/useListUrlState";`):

```tsx
export * from "./listView/useListShortcuts";
```

Verify: `pnpm --filter @vexcms/react test useListShortcuts`

### Step 16 — Responsive pass at every width [agent]

Why: Decision 22 is **container, not viewport**: the list root is a size container
(`@container/list`, like the edit view's `@3xl/form`), and layout switches key off the list's
own width via container-query variants, not `md:`/`lg:` viewport breakpoints. `useIsMobile` is
reserved for one thing only (Decision 22 point 3 / Decision 43): deciding whether a
menu/sheet/tab-switcher renders as an inline overlay or a bottom `Sheet`. Decision 43
(`layout-stability.md`) rules out a measured ⋯ overflow collapse — a JS-measured collapse only
settles after hydration and reflows the toolbar on first paint. This step is a CSS-only
collapse instead: every collapsible toolbar control renders twice — once in its inline slot,
once inside the ⋯ menu — and a fixed `@container/list` breakpoint pair (`hidden <bp>:flex` /
`<bp>:hidden`) decides which copy is visible, so the server's render is already the final
render (Decision 43, `layout-stability.md` "Responsive variants render correctly first"). The
fixed order (Copy link, then Columns, then rows per load; Search and Filter never collapse) is
three breakpoint tiers. `ListToolbar`'s ⋯ trigger gets a `DataTableResponsiveMenu` container so
its menu opens as a `Popover` or bottom `Sheet` on `useIsMobile`'s split (a device property, not
a container-width one, and therefore untouched by Decision 43), not the toolbar's own layout
width — `DataTableResponsiveMenu` itself picks `Popover` vs. bottom `Sheet` purely off
`useIsMobile`, an interaction-time choice that never shifts first paint.

- [ ] `packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx` (new) + test — one trigger/content pair: `Popover` at `useIsMobile() === false`, bottom `Sheet` at `useIsMobile() === true` (768px, viewport — Decision 22 point 3 / Decision 43)
- [ ] `packages/react/src/ui/data-table/index.ts` — barrel export for `DataTableResponsiveMenu`
- [ ] `packages/react/src/ui/data-table/DataTable.tsx` — sticky first column while the table scrolls horizontally (unconditional, not breakpoint-gated)
- [ ] `packages/react/src/ui/data-table/DataTableBulkActions.tsx` — container-query sizing (`@container/list`, not `md:`): full-width, larger touch targets, icon-only secondary actions below `@lg/list` (position stays Step 10's — inline in the toolbar, left of Filter)
- [ ] `packages/react/src/collections/listView/ListToolbar.tsx` — CSS-only ⋯ overflow at fixed `@container/list` breakpoints (Decision 43), wrapped in a `DataTableResponsiveMenu` container for the `Popover`/`Sheet` choice; the bulk group (when a selection is active) replaces the Filter trigger below `@lg/list` via container-query classes, not `useIsMobile`
- [ ] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx` + `packages/react/src/collections/listView/ListFilterBuilder.tsx` — each swaps its trigger/content container for `DataTableResponsiveMenu`
- [ ] `packages/react/src/collections/listView/ListViewTabs.tsx` — the fixed visible-tab count per `@container/list` width is Step 12's; this step only collapses the tab row into one full-width view button that opens a `DataTableResponsiveMenu` sheet below `useIsMobile`'s 768px split
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — J section notes list view owned by I, resolves both stale "known suspects" bullets

#### packages/react/src/ui/data-table/DataTableResponsiveMenu.tsx

New file. The single overlay mechanism `DataTableColumnsMenu`, `ListFilterBuilder`,
`ListViewTabs`'s mobile collapse, and `ListToolbar`'s ⋯ trigger (below) all switch to — one
trigger/content pair that renders as a `Popover` at `useIsMobile() === false` and as a
bottom `Sheet` at `useIsMobile() === true`, mirroring how `ui/sidebar.tsx` already flips
between an inline rail and a `Sheet` overlay on the same `useIsMobile()` boundary
(`MOBILE_BREAKPOINT = 768`). This is a **viewport** split (Decision 22 point 3 / Decision 43:
"`useIsMobile` decides overlays only") — deliberately not a container query, because whether
an overlay can afford a hover-dismissable `Popover` versus needs a touch-sized `Sheet` is
about the device, not the list's own width. It never shifts first paint: it only opens on
interaction (click/tap), so the server render that prerenders the page (Step 14) is unaffected
by which branch this component takes.

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
  /** Accessible title. Rendered as the `SheetTitle` on mobile; desktop omits a visible
   * title to stay compact, matching `PopoverContent`'s existing callers. */
  title: string;
  /** Menu body, shared unchanged between the `Popover` and the `Sheet`. */
  children: ReactNode;
  /** Desktop `PopoverContent` alignment. Ignored on mobile. @default "end" */
  align?: "start" | "center" | "end";
}

/**
 * Renders one trigger + content pair as a `Popover` at `useIsMobile() === false`, and as a
 * bottom `Sheet` at `useIsMobile() === true` (list-view-overhaul Design Decision 22 point 3 /
 * Decision 43: "`useIsMobile` decides overlays only" — menus render as bottom sheets below
 * 768px, independent of the list container's own width). Every list-view menu composes this
 * instead of choosing `Popover` or `Sheet` itself, so they all collapse at the same viewport
 * boundary the same way.
 *
 * @param props - Component props.
 * @param props.trigger - Trigger element, wrapped with `asChild` in `PopoverTrigger` /
 *   `SheetTrigger` so the caller's own button renders unchanged in both containers.
 * @param props.title - Accessible title shown as the `SheetTitle` on mobile.
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
  // - `useIsMobile` always returns a coerced boolean (`!!isMobile`, `false` before its
  //   effect measures the viewport) — there is no third "unknown" state to branch on, so
  //   the first client render takes the desktop (`Popover`) branch with no Sheet-then-
  //   Popover flash.
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
  it("renders the body in a Popover at useIsMobile() === false", async () => {
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

  it("renders the body in a bottom Sheet with the title at useIsMobile() === true", async () => {
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

This step extends Step 10's fixed-height/`ScrollArea` rewrite of this file (density prop,
`DataTableSortHeader`-wrapped headers, controlled `visibleColumns`, `totalDocsCapped`
"1,000+" row) — everything but the two cells below is unchanged. 3 edits. The sticky column
is unconditional (it is a horizontal-scroll affordance, not a breakpoint switch), so it needs
no container-query or `useIsMobile` gating.

**1 — import.** Add `cn` beside the existing `../table` import:

```tsx
import { cn } from "../../utils/cn";
```

**2 — sticky first header cell.** In `DataTable`'s returned JSX, the `TableHeader` row maps
`hg.headers` — add the column index and a sticky class on the first column so it stays
visible while the table scrolls horizontally (list-view-overhaul Design Decision 22: "Table.
It scrolls horizontally with a sticky first column on narrow containers" — sticky is applied
unconditionally here because a sticky column has no downside at any width; it simply has no
visible effect until the table is actually scrolled). Whatever Step 10 renders inside the
cell (plain `flexRender` or a `DataTableSortHeader`) is unaffected — only the wrapping
`TableHead`'s `className` changes:

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
prepends — the checkbox then stays docked with the row it belongs to, same as the title
column when selection is off.

#### packages/react/src/ui/data-table/DataTableBulkActions.tsx

Guided edit extending Step 10's rewrite of this file (Decision 22: bulk controls render
**inline** in the toolbar/filter row, left of Filter, never a floating bar — Step 10 owns
that position and the `count` / "Select all N loaded" / `list.bulkActions` slot / Delete /
clear elements named in Decision 28). This step only adds responsive sizing so the same
group can stand in for the whole Filter row at full width on a narrow container (Decision
22's last sentence on bulk controls; design screen 18e, "Selection replaces the Filter/Sort
row; nothing covers the table"). Sizing is **container-query**, not `md:` — the list is a
size container (`@container/list`), and this group can appear inside a narrow split pane at
any viewport width.

```tsx
// TODO: implement, on top of Step 10's inline group
// 1. Root container: add `w-full @lg/list:w-auto` so the group fills the row it replaces on
//    a narrow container, and `h-11 @lg/list:h-9` (or the project's existing touch-target
//    scale) for larger tap targets.
// 2. Count / "Select all N loaded": keep as text at every width (these are the elements a
//    thumb reads first).
// 3. Delete and clear: icon-only below `@lg/list` (`<Button size="icon" aria-label="Delete" .../>`
//    / `<Button size="icon" aria-label="Clear selection" .../>`), icon + label at `@lg/list`
//    and above — same pattern `DataTableColumnsMenu`'s density `ToggleGroup` already uses for
//    icon-only narrow buttons elsewhere in this spec.
// 4. The `list.bulkActions` slot content (project contributions) is NOT resized here — a
//    contribution author controls its own responsive behavior, same as any other `list.*`
//    slot.
// Edge cases:
// - A long view/collection name must not push the count off the visible row — the count
//   span stays `flex-1 truncate`, matching the "3 selected" / "All loaded" pairing in the
//   design rather than wrapping to a second line.
// - `@lg/list` refers to the `@container/list` root this step's `ListToolbar.tsx` edit
//   below renders this group inside of; a component outside that container tree has no
//   `@lg/list` variant to key off and must not use this class name.
```

#### packages/react/src/collections/listView/ListToolbar.tsx

Guided edit against the component Step 10 creates. `ListToolbar` renders `ListSearch` plus a
CSS-only ⋯ overflow (Copy link, then Columns, then rows per load — Search and Filter never
collapse, Decision 22 point 2 / Decision 43) and, left of the Filter trigger, the inline bulk
group (`DataTableBulkActions`, above) when a selection is active. Saved views are not part of
this toolbar (Step 12 renders them as tabs, above it) and `ListFilterBuilder`'s own
trigger/content container is handled by this step's own edit to that file, below — this edit
only touches the overflow trigger's container and the bulk/filter row swap.

**1 — CSS-only ⋯ overflow, no measurement.** Collapse is CSS per Decision 43. Each of the three collapsible
controls renders **twice** — once inline, once inside the ⋯ menu — gated by a fixed
`@container/list` breakpoint pair per control, so the three thresholds reproduce the fixed
order (Copy link collapses first/widest, then Columns, then rows per load, narrowest) with no
JS measurement and no post-hydration reflow:

```tsx
// TODO: implement
// 1. import { DataTableResponsiveMenu } from "../../ui/data-table/DataTableResponsiveMenu"
// 2. keep <ListSearch /> and the Filter trigger (this file's existing `ListFilterBuilder`
//    render) unconditionally visible — neither ever collapses (Decision 22 point 2)
// 3. three fixed breakpoint tiers, widest control collapses first:
//    - Copy link:        inline `hidden @3xl/list:flex`, in-menu `@3xl/list:hidden`
//    - Columns:           inline `hidden @xl/list:flex`,  in-menu `@xl/list:hidden`
//    - Rows per load:     inline `hidden @lg/list:flex`,  in-menu `@lg/list:hidden`
//    (each control is a single component instance rendered through a small helper that
//    picks the inline vs. menu className pair, so there is exactly one control element
//    per control — not two divergent copies that could drift)
// 4. ⋯ trigger: always rendered in the DOM, but only visible when at least one control is
//    still collapsed —
//    <DataTableResponsiveMenu
//      trigger={<Button variant="outline" size="icon" icon="MoreVertical" aria-label="More options" className="@3xl/list:hidden" />}
//      title="List options"
//    >
//      {Copy link, Columns, rows-per-load — in this fixed order, each with its in-menu
//      className from step 3 so it disappears from the menu once its own breakpoint
//      promotes it inline}
//    </DataTableResponsiveMenu>
// Edge cases:
// - at `@3xl/list` and wider all three controls show inline and the ⋯ trigger is hidden —
//   there is no empty-menu flash because the breakpoint is a CSS media query, not a
//   post-render measurement
// - every tier is decided before hydration (SSR renders the same classes the client does),
//   satisfying Decision 39/43: the server's first paint is the settled UI at any width
```

**2 — bulk group replaces the Filter row on a narrow container.** Decision 22: "On narrow
containers they replace the Filter row." This is a **container-query** swap, not
`useIsMobile` — no JS width check is needed because it only depends on the already-known
`selectedIds.length > 0` plus a container-query class pair, so the two states are expressed
as plain conditional Tailwind classes on the Filter trigger's wrapper:

```tsx
// TODO: implement
// 1. const hasSelection = selectedIds.length > 0 (from CollectionListContext, Step 9)
// 2. render the bulk group (DataTableBulkActions) first, only when hasSelection, as today
// 3. render the Filter trigger's wrapper with:
//    className={cn(hasSelection && "hidden @lg/list:flex")}
//    — hidden on a narrow container while a selection is active (the bulk group fills the
//    row alone), `flex` (visible) at `@lg/list` and up regardless of selection, and always
//    visible when `hasSelection` is false
// Edge cases:
// - clearing the selection (the bulk group's own clear control, Decision 28) drops
//   `hasSelection` to false on the next render, which drops the `hidden` class and
//   re-shows the Filter trigger automatically — no extra state to reset here
// - `@lg/list` requires this toolbar to render inside the `@container/list` root Step 10's
//   layout file puts on the list page; there is exactly one such root per list view
// - the server renders `hasSelection` as false on every prerender (selection is
//   interaction-only state, never serialized — Step 14 never prefetches a selection), so
//   this swap never causes a server/client first-paint mismatch
```

#### packages/react/src/ui/data-table/DataTableColumnsMenu.tsx

Guided edit against the component Step 10 creates (`enableHiding` columns; session-only
state when no view selected; density `ToggleGroup`, Decision 29).

**1 — responsive container.** Replace whatever trigger/content container
`DataTableColumnsMenu` currently returns with `DataTableResponsiveMenu`, keeping the same
column-visibility checkbox list (plus the density toggle) as `children` and the same
trigger button as `trigger`:

```tsx
// TODO: implement
// 1. import { DataTableResponsiveMenu } from "./DataTableResponsiveMenu"
// 2. return <DataTableResponsiveMenu trigger={<Button variant="outline" size="sm" icon="Columns3">Columns</Button>} title="Columns">
// 3.   {the existing per-column visibility checkbox list plus the Density ToggleGroup}
// 4. </DataTableResponsiveMenu>
```

#### packages/react/src/collections/listView/ListFilterBuilder.tsx

Guided edit against the component Step 11 creates, contributed as `vex.list.filters` into
`list.filters` (groups of AND rows, OR between groups).

**1 — responsive container.** Replace whatever trigger/content container
`ListFilterBuilder` currently returns with `DataTableResponsiveMenu`:

```tsx
// TODO: implement
// 1. import { DataTableResponsiveMenu } from "../../ui/data-table/DataTableResponsiveMenu"
// 2. return <DataTableResponsiveMenu trigger={<Button variant="outline" size="sm" icon="ListFilter">Filter</Button>} title="Filter">
// 3.   {the existing OR-group / AND-row builder}
// 4. </DataTableResponsiveMenu>
```

#### packages/react/src/collections/listView/ListViewTabs.tsx

Guided edit against the component Step 12 creates. Step 12 already decides, with a fixed
`@container/list`-width visible-count table (CSS, not measurement —
Decision 43), how many of the source-ordered tabs (**All**, config, shared, local) show
inline versus fold into the "All views" overflow menu. This step adds the below-768px
collapse to one full-width button that opens the same grouped content as a sheet
(Decision 22 point 3; design: "the tabs become one full-width view button that opens a
sheet") — but, unlike `DataTableResponsiveMenu`'s overlay-vs-popover choice (which stays
CLOSED until clicked, so a device-width `useIsMobile()` branch never shifts first paint),
the tab row is VISIBLE unconditionally on every page load. `useIsMobile()` always returns a
coerced `false` before its viewport-measuring effect runs (this step's
`DataTableResponsiveMenu` notes the same fact), so a JS branch here would render the
desktop `Tabs` row on the server AND on an actual <768px device's first client render, then
snap to the single button once hydration's effect resolves — exactly the one-frame flash
`layout-stability.md` forbids. The fix is CSS, not JS: both subtrees render unconditionally,
toggled by a `hidden md:flex` / `flex md:hidden` viewport breakpoint pair, mirroring the
toolbar's `@container/list` CSS collapse one layer up at the viewport instead of the
container.

**1 — mobile collapse, CSS not `useIsMobile()`.** Wrap Step 12's existing CSS-driven
`Tabs` + "All views" overflow in `className="hidden md:flex"`, and add a SECOND,
always-mounted subtree — the full-width mobile trigger + `DataTableResponsiveMenu` sheet,
reusing the SAME grouped menu content Step 12 already renders for its desktop "All views"
overflow (do not duplicate the grouped-by-source, searchable, `ScrollSection`-backed list
in a second place) — wrapped in `className="flex md:hidden"`:

```tsx
// TODO: implement
// 1. import { DataTableResponsiveMenu } from "../../ui/data-table/DataTableResponsiveMenu"
// 2. Render BOTH subtrees unconditionally, never behind `useIsMobile()`:
//    a. <div className="hidden md:flex">{Step 12's existing CSS-driven visible-count
//       `Tabs` + "All views" overflow, unchanged by this step}</div>
//    b. trigger = a full-width Button showing the active view's name (or "All") truncated,
//       a muted "{n} views" count, and a chevrons-up-down icon — matching the existing
//       view-tabs' active-view styling (modified dot, local Monitor icon) when applicable
//    c. <div className="flex md:hidden">
//         <DataTableResponsiveMenu trigger={trigger} title="Views">
//           {the SAME grouped/searchable content Step 12's "All views" DropdownMenu/Popover
//           already renders for the desktop overflow case}
//         </DataTableResponsiveMenu>
//       </div>
// Edge cases:
// - the mobile trigger's "{n} views" count is the total across all three sources, same
//   number the desktop overflow badge already computes — do not recompute it separately
// - `initialViews`/`initialLocalIndex` (Step 14) are what the server renders before
//   hydration, so BOTH subtrees' active-view name/count are already correct on first
//   paint — only CSS decides which one is visible, so neither ever flashes
// - `DataTableResponsiveMenu`'s OWN internal Popover-vs-Sheet choice inside subtree (c) may
//   still use `useIsMobile()` (it opens only on interaction, so it never shifts first
//   paint) — only the OUTER row-vs-button choice moves to CSS; see Decision 43's
//   note on this distinction
```

#### .agent/docs/product/v0.1.0-launch-plan.md

2 edits — everything else in the J section is unchanged.

**1 — list view owned by I.** Insert a note directly under the `## J — Responsive /
mobile UI pass` heading, before `### Tasks`:

```markdown
> **The list view's responsive layout ships with `2026-10-26-list-view-overhaul` (I), not
> here.** I's Design Decision 22 builds the container-query layout switches (not viewport
> breakpoints — the list root is a size container, `@container/list`), the CSS-only
> toolbar-overflow collapse at fixed breakpoints (Decision 43 — no `ResizeObserver`), the
> `useIsMobile`-gated bottom-sheet menus, the sticky-first-column horizontal scroll, the
> inline (never floating) bulk group that replaces the Filter row on a narrow container, and
> the tabs-to-sheet view switcher as part of the same spec that adds search, sort, filters,
> columns and saved views — so `CollectionListView` / `DataTable`'s responsive behavior is
> shipped before J runs (Step 16), already server-prerendered with no layout shift (Step 14).
> J's regression pass over the list view (375/390/768/1024 covered pre-post, plus the new
> 640/1280/1536 widths, plus a narrow split-pane case) audits I's shipped layout; a layout
> defect found there is I's follow-up, not a new J finding against a stock `DataTable`.
```

**2 — stale "known suspects".** Two bullets under "Known suspects, from reading the code"
predate I. Append a resolution note to the horizontal-scroll bullet:

```markdown
- `DataTable` wraps in `overflow-x-auto` (`DataTable.tsx:225`) — horizontal scroll is the
  fallback, not a mobile design. A wide collection on a 375px screen is the worst case in
  the product. **Resolved by I** — ships a sticky first column alongside the scroll
  region (list-view-overhaul Design Decision 22, Step 16); re-auditing this bullet is
  regression only.
```

And append a resolution note to the bulk-bar bullet:

```markdown
- The bulk-action floating bar, once it renders. **Resolved by I** — the list
  view design replaces the floating bar with an inline group in the toolbar/filter row
  (Decision 22), which on a narrow container stands in for the whole Filter row
  (list-view-overhaul Step 16); there is no longer a floating bar to audit.
```

Verify: browser at 375 / 390 / 768 / 1024 / 1440 on `apps/test`, plus a narrow split-pane
case (the list view rendered inside a container narrower than the viewport, to confirm the
`@container/list` layout switches key off the container, not the window). At each width,
hard-reload (not client navigation) a shared view, a config view, a local view, and a
`peek=` URL and confirm there is no visible shift between first paint and settled UI — the
toolbar's ⋯ collapse, the tab row, and the peek's inline/right-sheet mode must already be in
their final state on the server-rendered HTML (Step 14, Decision 43), with no
`ResizeObserver`-driven reflow after hydration.

### Step 17 — Examples, docs, acceptance [agent]

Why: acceptance needs a 200-doc collection, a custom row + bulk action exercising `access`, a config view with a server-resolved `where` the current role can't read, a count-cap demonstration, an index-pushdown demonstration, a declared-filter narrowing demonstration, and a docs guide that matches every decision through the architecture review (peek, density, shortcuts, parked sort, filter chips, view tabs, hidden-filter narrowing, count cap, pushdown, server prerender, and the local-view cookie). It also needs hard-reload proof that Decision 39's zero-layout-shift promise holds for every view source and for the peek.
Verify: pnpm typecheck && pnpm test && vex generate && the 15-item browser smoke checklist below, for at least one allowed role and one denied role

- [ ] `apps/test/src/db/constants/index.ts` + `apps/test/src/vexcms/collections/testimonials.ts` (new) + `apps/test/src/vexcms/collections/index.ts` — collection with `searchField` (2 fields), sortable columns, an indexed `source` field, a low `admin.table.countLimit` (below the seeded row count, to exercise `totalDocsCapped`), 3 `views` (one with a server-resolved `where` on a field the `contributor`/`user` roles can't read), custom row + bulk action contributions, seed 200 docs
- [ ] `apps/test/src/components/TestimonialFeatureRowAction.tsx` + `apps/test/src/components/TestimonialBulkApproveAction.tsx` (new) — custom row + bulk action contributions
- [ ] `apps/test/src/auth/access.ts` — `testimonials` resource, `VIEW_ACTIONS` rules (`readViews`/`createView`/`updateView`/`deleteView`), field-level read restriction on `internalScore`
- [ ] `apps/test/convex/seed.ts` — 200 seeded rows, each stamped with a `source`
- [ ] `apps/docs/src/content/docs/guides/list-views.mdx` (new) — list-view guide covering every Step 1–16 behavior, including server prerender and the local-view cookie index; `README.md` `admin.table` claims made true
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` — I tasks ticked; backlog updated
- [ ] browser smoke checklist: every Verify above + `VIEW_ACTIONS` denied vs allowed + hidden-filter badge + density + peek + keyboard shortcuts + declared-filter narrowing + count cap + pushdown + hard-reload zero-shift for shared/config/local views and `peek=`

#### apps/test/src/db/constants/index.ts

1 edit — add the `testimonials` table slug beside the other `TABLE_SLUG_*` constants.

```ts
export const TABLE_SLUG_TESTIMONIALS = "testimonials" as const;
export type TestimonialDoc = Doc<typeof TABLE_SLUG_TESTIMONIALS>;
export type TestimonialID = Id<typeof TABLE_SLUG_TESTIMONIALS>;
```

#### apps/test/src/vexcms/collections/testimonials.ts

The collection config, its three views, and every field are orthogonal to the server-prerender decisions (39–43): `findPaginated` receives the same `composeViewWhere(...)` either way, and prerendering changes where the first request happens, not what it asks for.

```ts
import { checkbox, defineCollection, number, select, text, textarea } from "@vexcms/core";

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
 * saved-views UI at runtime) plus a `high-value` view whose `where` touches
 * `internalScore` — a field `contributor`/`user` can't read (decision 25/26) — so the
 * hidden-filter badge and lock-only rendering have something real to gate. `source`
 * (indexed `by_source`, readable by every role) is the field a `contributor`/`user`
 * narrows the `high-value` view with (decision 26's declared-filter allow-list: the
 * view's own `where` stays trusted unchanged, and the caller's `source = g2` row is
 * checked against readable fields only). `admin.table.countLimit` is set below the
 * seeded count so `totalDocsCapped` and the "1,000+"-style capped count (decision 35)
 * are observable without seeding past the 1000 default. `status`'s `by_status` index
 * doubles as the equality filter pushdown demo (decision 36). The row/bulk
 * contributions below exercise decision 17 against the `VIEW_ACTIONS`-gated `access`
 * rule declared in `~/auth/access.ts`. The three views also back the Step 14 server
 * prerender: `NextAdminPage` resolves `featured`/`pending-review` (config), one
 * promoted shared view, and one local view at render time, so this collection is the
 * fixture for the hard-reload zero-shift checks below.
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
      countLimit: 150,
      views: [
        {
          viewId: "featured",
          name: "Featured",
          description: "Featured testimonials, highest rating first.",
          state: {
            where: { field: "featured", op: "eq", value: true },
            sort: { field: "rating", order: "desc" },
            columns: ["authorName", "company", "rating"],
          },
        },
        {
          viewId: "pending-review",
          name: "Pending Review",
          description: "Awaiting an approve/reject decision, oldest first.",
          state: {
            where: { field: "status", op: "eq", value: ["pending"] },
            sort: { field: "_creationTime", order: "asc" },
          },
        },
        {
          viewId: "high-value",
          name: "High Value",
          description: "Curated for the homepage by internal score.",
          state: {
            // Server-only (decision 25): never sent to the client. `internalScore` is
            // also read-restricted below, so this view encodes a business rule a
            // `contributor`/`user` can act on (via the view) without ever reading the
            // field it's built from — the UI shows only a lock badge with a count. A
            // `source = g2` filter layered on top by a role that can't read
            // `internalScore` exercises decision 26's narrowing allow-list: the
            // declared `where` is trusted as-is, and only the added row is checked
            // against readable fields.
            where: { field: "internalScore", op: "gte", value: 8 },
            sort: { field: "rating", order: "desc" },
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
      description: "Gates the bulk-approve action and backs the Pending Review view. An equality filter on this field is the index-pushdown smoke test (decision 36): `status = approved` pushes into `withIndex(\"by_status\")` instead of a full-table `.filter`. Also exercises the built-in `vex_status` filter field (decision 10) once drafts land on another collection — here it's a plain `select` so the filter-builder operator set for `select` (`eq`/`neq`/empty) is covered.",
    }),
    featured: checkbox({
      label: "Featured",
      admin: { enableHiding: true },
      description: "Toggled by the row action below; backs the Featured view.",
    }),
    source: select({
      label: "Source",
      defaultValue: ["website"],
      index: "by_source",
      options: [
        { label: "Website", value: "website" },
        { label: "G2", value: "g2" },
        { label: "Capterra", value: "capterra" },
      ],
      admin: { enableHiding: true },
      description: "Readable by every role (no field restriction). Used to narrow the High Value config view (`source = g2`) from a role that can't read `internalScore` — decision 26's declared-filter allow-list.",
    }),
    internalScore: number({
      label: "Internal Score",
      min: 0,
      max: 10,
      admin: { enableHiding: true },
      description: "Read-restricted to `admin`/`editor` (see `~/auth/access.ts`); backs the High Value config view's server-resolved `where`, never exposed to a role that can't read it.",
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

New file.

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
 * `featured` on one document. Rendered per row with `{ collection, docs }`, after
 * the built-in Open/Inspect/Copy ID actions and before Delete (decision 28).
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

New file.

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
 * `list.bulkActions` contribution for `testimonials` (decision 17). Sets
 * `status: "approved"` on every selected row that is still `pending`. Renders
 * inline in the toolbar's bulk-controls area, left of Filter (decision 22) —
 * never a floating bar.
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

4 edits — unchanged lines omitted.

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

**3 — `permissions`.** One rule per role, demonstrating the four `VIEW_ACTIONS` allowed (`admin`, `editor`) vs denied (`contributor`, `guest`, `user`), and a field-level read restriction on `internalScore` for `contributor`/`user` (decision 26) so the High Value config view's hidden `where` genuinely references an unreadable field — `source` carries no restriction, so the narrowing smoke test (decision 26) stays legal for the same roles. `admin`'s existing `"*": true` already covers both; the other roles need an explicit `testimonials` entry.

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
        read: () => ({ "*": true, internalScore: false }),
        update: () => ({ "*": true, internalScore: false }),
        readViews: false,
        createView: false,
        updateView: false,
        deleteView: false,
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
        read: () => ({ "*": true, internalScore: false }),
      },
```

#### apps/test/convex/seed.ts

1 edit — a new insert-if-missing section appended inside `runSeed`, mirroring the editorial-fixtures section's pattern, right before the `return { created, patched, skipped }` line.

```ts
  // ── TEST-ONLY: testimonials (list-view overhaul acceptance) ─────────────
  // 200 deterministic rows so Load-More alone is impractical — the acceptance bar
  // for spec 2026-10-26-list-view-overhaul. Also exceeds `countLimit` (150), so
  // `totalDocsCapped` is observable without seeding past the 1000 default. Insert-if-
  // missing like the editorial fixtures above: keyed by `authorName`, which is unique
  // across the generated set.
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
    const sources = ["website", "g2", "capterra"] as const;
    for (let i = 0; i < 200; i++) {
      const rating = ratings[i % ratings.length];
      const status = i % 5 === 0 ? "pending" : "approved";
      const source = sources[i % sources.length];
      await ctx.db.insert("testimonials", {
        authorName: `Testimonial Author ${i + 1}`,
        company: companies[i % companies.length],
        quote: `Reviewer ${i + 1} on ${companies[i % companies.length]}: a representative seeded quote for acceptance testing.`,
        rating: [rating],
        status: [status],
        featured: i % 11 === 0,
        source: [source],
        internalScore: (i % 11) + (i % 3),
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
description: Search, portable sort, filters, density, saved views, server prerendering, Inspect peek, keyboard shortcuts, and list.* slots for collection list views.
---

Every collection list view ships a paginated, searchable, sortable, filterable data
table driven entirely by `admin.table` — each control reads one config key, and a
control with no key stays hidden. The page itself never scrolls: header, tabs,
toolbar, and chips stay fixed, and the table owns its own scroll area (Step 10). The
first server render already shows the final rows, tabs, and preferences — there is no
loading flash to a second, different layout (Step 14, Decision 39).

## Server prerender

```ts
// apps/test/src/app/admin/testimonials/page.tsx (template; see packages/create-vexcms)
export default function TestimonialsListPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <NextAdminPage collectionSlug="testimonials" searchParams={searchParams} />;
}
```

`NextAdminPage` parses `searchParams` with the shared core codec
(`parseListParams`/`serializeListParams`, `packages/core/src/collections/listUrlParams.ts`
— no react import, shared verbatim with the client's `useListUrlState`). It reads the
`vex-list-density`, `vex-list-chips:<collection>`, and `vex-list-views:<collection>`
cookies, fetches `listViews` once, resolves the active view (config, shared, or the
URL's full local-view state), and prefetches `findPaginated`/`search` with **exactly**
the args the client's `useVexListQuery` sends — `where: composeViewWhere(...)`, `sort`,
`numItems`, `drafts`, `depth`, `totalDocs` — plus `get(peek)` when `peek=` is set. Those
go to `CollectionListView` as `initialData`, `initialViews`, `initialLocalIndex`,
`initialPreferences`, and `initialPeekDoc`. A prefetch-args test
(`NextAdminPage.test.ts`) and a matching client-side test
(`useVexListQuery.test.tsx`) both assert against the shared `buildListQueryArgs`
helper, so server and client query keys can never drift apart.

Every later query from the browser — Load More, re-sorting, typing into search — is a
plain client query; only the first render pays for `listViews` and the prefetch.

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
the search bar is not rendered. The search field picker only offers fields the caller
can read (`useFieldPermissions`).

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
(`resolveQueryIndex`) to the index whose first field leads with it (draft-status-aware);
`_creationTime` needs no index. `defaultSort.field` and every `enableSorting` field must
lead some index, or `defineConfig` throws naming the index to declare. Sort on an
unreadable field is rejected with a `VexAccessError` — sort order alone can leak values.

**Sort parks while searching.** While a search query (`q`) is active, `sort` stays in
the URL but is ignored — the server rejects `sort` together with `search`, so the
client omits it from the query. The sort headers disable with a "Sorted by relevance"
badge and an explanatory tooltip; clearing the search restores the sort.

## Column visibility & density

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
auto-persisted last-used state (Decision 15). The columns menu also holds a
**Comfortable / Compact** density toggle (`DataTable`'s `density` prop). Density and
filter-chip visibility are **cookie-backed** (`vex-list-density`,
`vex-list-chips:<collection>`, Decision 42), read by `NextAdminPage` on the server the
same way `readLivePreviewPanelCookie` reads the live-preview panel cookie — so a
reloaded page renders at the right density and chip visibility on the very first
paint, never flipping after hydration. Neither enters the URL or a saved view.

## Filters

The filter builder renders into the `list.filters` slot. It edits one level of OR
groups of AND rows — operators are `eq`/`neq`/`gt`/`gte`/`lt`/`lte` plus the
list-only `isEmpty`/`isNotEmpty` (offered by field type: number/date get all six
comparisons, text/boolean/select/relationship get `eq`/`neq`, everything gets the
empty operators). The builder applies live — a row counts once it's complete — and
stores the same plain `VexWhereNode` `find`/`search` already accept:
`{ or: [{ and: [leaf, …] }, …] }`. Active filters show as chips with a per-browser
visibility toggle; unreadable fields never appear in the field list. `vex_status` is
a built-in filter field on versioned collections.

A config view's own `where` (below) is never editable here and never shown as a
chip — only as a lock badge with a count. A caller may still **narrow** a config
view by adding their own rows on fields they can read: the server trusts the
declared `where` only when the request's top-level AND part deep-equals it exactly,
then checks the remaining rows against normal field-read rules (decision 26). See
"Hidden filter narrowing" below.

## Page size

```ts
admin: {
  table: {
    pageSizeOptions: [10, 25, 50, 100],
    defaultPageSize: 25,
  },
},
```

Pagination stays cursor-based Load More; the page-size select ("Rows per load")
only changes how many rows Load More fetches per click, and resets to the first
page at the new size without re-chunking already-loaded rows.

## Count cap & index pushdown

```ts
admin: {
  table: {
    countLimit: 150,
  },
},
```

The total count shown next to "Showing 25 of …" is capped at `admin.table.countLimit`
(default 1000): the server counts with `take(countLimit + 1)` instead of scanning the
whole matching set, and `find` returns `totalDocsCapped: true` once the cap is hit, so
the UI reads "Showing 25 of 150+" instead of a possibly stale or expensive exact count.

An equality condition on an indexed field — `status = approved` on `testimonials`'
`by_status` index — is pushed into `withIndex` instead of scanning every row through
`.filter` (`resolveQueryIndex`, decision 36). Index precedence for access rules is
unaffected; pushdown only changes which index-eligible equalities move out of
`.filter`.

## Saved views

```ts
admin: {
  table: {
    views: [
      {
        viewId: "featured",
        name: "Featured",
        description: "Featured testimonials, highest rating first.",
        state: { where: { field: "featured", op: "eq", value: true }, sort: { field: "rating", order: "desc" } },
      },
      {
        viewId: "high-value",
        name: "High Value",
        description: "Curated for the homepage by internal score.",
        state: { where: { field: "internalScore", op: "gte", value: 8 }, sort: { field: "rating", order: "desc" } },
      },
    ],
  },
},
```

Views come from three sources, merged by `viewId` and shown as tabs — **All** first,
then config, shared, and local, overflowing into an "All views" menu grouped by
source: `config` (`admin.table.views`, read-only), `shared` (the `vex_views` Convex
table, collection-wide and org-scoped when `access.orgCollectionSlug` is set — no
user or role scopes), and `local` (the browser's `localStorage`, the personal tier). Shared views are invisible to a caller without `readViews` on the collection — `listViews` resolves to an empty list for them, so their tabs simply don't appear (no error).

A config view's `where` is **hidden from the UI, not secret** — it ships in the client
bundle like an access rule (P-004), since `admin.table.views` is part of the same
config object imported into the browser, and may reference fields the caller can't
read, like `high-value`'s `internalScore` above. Don't encode sensitive thresholds or
identifiers in one. UI code never reads a config view's `where` directly — it reads
the client-safe projection `toClientViewConfig` builds instead (`hasHiddenFilter` /
`hiddenFilterCount`), so the filter builder, chips, and every other control only ever
see the count. The client composes one plain `where` with the core helper
`composeViewWhere({ viewWhere, filter })` and sends it as `find`/`search`'s only
`where` argument — those operations take no `view` argument and know nothing about
views. The UI shows the hidden filter only as a lock badge with a count and the
view's description, never as a chip or a builder row.

Opening a view sets the page heading, a source/author line, and the description. A
changed view shows a modified dot with Reset / Save (save changes, save as new, or
reset) — the save target depends on `createView`/`updateView` and the view's source. Copy Link
serializes the full state when a local view is active (an unknown view ID in the URL
falls back to the remaining params with a notice). Saving a local view shared
("promoting" it) keeps the same `viewId`, is idempotent, and deletes the local entry
only after the shared save succeeds. `saveView` also rejects a shared view whose
`where` references a field the saver can't read.

**Local views prerender too.** While a local view is active, the URL always carries
its full state (`q`/`qf`/`sort`/`filter`/`size`) plus `view=local:<id>`, so the server
has everything it needs to render the exact rows without reading `localStorage`. A
small `vex-list-views:<collection>` cookie mirrors each local view's `{ viewId, name }`
so its **tab** also renders on the server; the full view state still lives only in
`localStorage`. The local-view store writes both the cookie and `localStorage` on
every save, rename, delete, and promotion. A stale cookie entry whose `localStorage`
view was cleared (e.g. a different browser) shows its tab until hydration, then the
store prunes it — an accepted tradeoff (Decision 41).

### Hidden filter narrowing

A role that can't read the field behind a config view's hidden `where` can still add
their own filter rows on fields they *can* read, without ever seeing or sending the
hidden condition. On `testimonials`' High Value view (hidden `internalScore >= 8`), a
`contributor` — who can't read `internalScore` — can add `source = g2` and get the
narrowed results: the server matches the request's declared AND part exactly against
the view's `where` and trusts it unchanged, then checks only the added `source` row
against normal read rules. Any edit to the hidden condition itself (a different
value, a dropped clause, moving it into an OR group) is treated as an ordinary
unreadable-field condition and drops rows, same as today.

## `VIEW_ACTIONS`

Shared views are gated by four access actions, all denied by default: `readViews`
(seeing the shared tabs and using them in `find`/`search`'s allow-list), `createView`
(saving a new shared view or promoting a local one), `updateView` (saving changes to
or renaming a shared view), and `deleteView` (deleting one):

```ts
permissions: {
  editor: { testimonials: true },
  contributor: {
    testimonials: { read: ..., update: ..., readViews: false, createView: false, updateView: false, deleteView: false },
  },
},
```

A user without `createView` can still save views locally — the menu only disables the
"Save shared" option, not the feature. A user without `readViews` never sees the
shared tabs at all.

## Inspect peek

Clicking Inspect (or pressing `Space` on a focused row) opens a panel with a Fields tab
(label, mono key, value, copy button; full `_id`; `_creationTime` as ISO/epoch/relative;
relationship chip + target ID) and a JSON tab, both showing only fields the caller can
read. Layout is a fixed `@container/list`/`@5xl/list` container-query switch (Decision
43): inline beside the table at `@5xl/list` and wider, a non-modal right `Sheet` below
that, and a bottom `Sheet` below 768px (`useIsMobile`, interaction-only). When
`peek=<id>` is in the URL on first load, the server prefetches `get(peek)` and passes
`initialPeekDoc`, so the panel is already open and populated on first paint instead of
appearing after a client fetch. It then subscribes to the full document
(`useVexDocQuery`) while open; a `peek` ID outside the loaded page still fetches by ID
client-side if it wasn't prefetched, and a not-found or no-access document renders the
same message either way. Rows prefetch on 150ms hover or keyboard focus, and the ±1
neighbours prefetch while the peek stays open.

## Keyboard shortcuts

The core set only, ignored while focus is in an input/textarea/`contenteditable` or
an open dialog, or while composing:

| Key | Action |
| --- | --- |
| `/` | Focus search |
| `Esc` | Close top overlay → clear selection → blur search |
| `↑` / `↓` | Move row focus |
| `Enter` | Open the focused row |
| `Space` | Toggle the peek |
| `X` | Toggle row selection |
| `Shift+X` | Select a range |

## `list.*` slots

| Slot | Built-in |
| --- | --- |
| `list.header.actions` | `vex.list.create` |
| `list.toolbar` | `vex.list.search`, `vex.list.columns`, `vex.list.views`, bulk controls (inline, left of Filter) |
| `list.filters` | `vex.list.filters` |
| `list.beforeTable` / `list.afterTable` | — |
| `list.row.actions` | `vex.list.row.open`, `vex.list.row.inspect`, `vex.list.row.copyId`, then contributions, then `vex.list.row.delete` last |
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

## Responsive

Toolbar overflow, view-tab overflow, and the peek's inline/right-sheet switch all use
fixed `@container/list` breakpoints — never `ResizeObserver` measurement (Decision 43),
so the server's render is already the final one. Below `md`, the toolbar collapses
into an overflow menu, menus render as bottom sheets (`useIsMobile`, interaction-only),
the view tabs collapse into one button that opens a sheet, the table scrolls
horizontally with a sticky first column, and the bulk controls replace the Filter row
instead of overlaying the table (Step 16).

See `apps/test/src/vexcms/collections/testimonials.ts` for the full working example —
200 seeded rows, two `searchField` entries, two sortable columns, an indexed `source`
field, a 150-row `countLimit`, three saved views (including one server-resolved
hidden filter), and the row/bulk contributions above.
```

#### README.md

1 edit — replace the "Pagination & Data Tables" section's example and launch-track callout, lines 293–313, now that search, sort, filters, saved views, density, the Inspect peek, keyboard shortcuts, and server prerendering ship.

```md
### Pagination & Data Tables

The admin panel's collection list view is a paginated data table backed by Convex's
`usePaginatedQuery`, with per-collection search, sort, filters, column visibility,
density, page size, saved views, an Inspect peek, core keyboard shortcuts, and a
server-prerendered first paint, all driven by `admin.table`:

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
> filters, saved views, the Inspect peek, shortcuts, server prerendering, and
> `list.*` slots for custom row/bulk actions.
```

#### .agent/docs/product/v0.1.0-launch-plan.md

1 edit — tick the `I` section's task list (lines 1024–1035) now that the spec and implementation steps are planned/landed.

```md
### Tasks
- [x] Write spec (needs B3 and G steps 7–8)
- [x] Implement
  - [x] A's remainder (`vex_` convention, `updatedAt`; default-sort fix already done)
  - [x] Per-collection search
  - [x] Sort (`defaultSort`, column flags, header affordances; parked while searching)
  - [x] Filter builder (DNF, live apply, chips, `vex_status`)
  - [x] Column visibility (`defaultColumns`, menu) and density (cookie-backed)
  - [x] Page-size control
  - [x] Count cap (`totalDocsCapped`) and filter index pushdown
  - [x] Saved views (config/shared/local, view tabs, server-resolved config `where`, declared-filter narrowing, local-view cookie index)
  - [x] Per-collection data-source hooks (`useVexListQuery`/`useVexDocQuery`)
  - [x] Status enum replaces string literals
  - [x] List-view slots, built-ins as `vex.*` contributions; row and bulk actions
  - [x] Inspect peek (server-prefetched when `peek=` is in the URL)
  - [x] Core keyboard shortcuts
  - [x] Responsive pass at every width (CSS container queries, no measurement)
  - [x] Server prerender: zero-layout-shift first paint for shared, config, and local views
```

Browser smoke checklist:

Recorded against `apps/test` on a running `next dev` instance (never started by an
agent — P-024), signed in as each role in turn.

1. **Search** — `/admin/testimonials`, type into the search field; results narrow by
   `authorName`. Switch the field picker to `company`; results narrow by company instead.
2. **Sort** — click the `Rating` header; rows reorder ascending, then descending on a
   second click. While a search query is active, the header shows "Sorted by relevance"
   and is disabled; clearing the search restores the prior sort.
3. **Filters** — open `list.filters`, add two AND rows in one group, add a second OR
   group, including one `isEmpty` row; reload the page and confirm the `where`
   round-trips through the URL and the chips match.
4. **Columns & density** — hide the `Status` column via the columns menu; it disappears
   without a saved view selected (session-only). Toggle Compact density; rows tighten
   and the preference survives a reload at the right density on the very first paint
   (cookie-backed, not the URL — confirm via the request's `Cookie` header in devtools).
5. **Page size** — change the page-size select to 50; Load More fetches 50 rows per
   click, resetting to the first page.
6. **Views** — select the `Featured` config view (read-only); save the current state as
   a local view; as a role with `createView` (`editor`/`admin`), promote it to shared.
7. **Hidden filter** — as `contributor`, select the `High Value` config view: a lock
   badge with a count appears, no chip, and the `internalScore` field is absent from the
   filter field list, sort headers, and the peek's Fields tab. As `admin`, the same view
   shows the lock badge too (the `where` is never shown or sent over the network regardless of role), but
   `internalScore` is visible in the peek.
8. **Hidden filter narrowing** — as `contributor` with the `High Value` view active,
   add a filter row `source = g2`. Results narrow further without the request ever
   revealing or altering the hidden `internalScore >= 8` condition; the field list for
   the added row still excludes `internalScore`.
9. **Count cap** — as `admin`, open `/admin/testimonials` with no filter (200 seeded
   rows, `countLimit: 150`); the count reads "Showing 25 of 150+" and `totalDocsCapped`
   is true. Add a filter that narrows below 150 rows; the "+" disappears and an exact
   count shows.
10. **Pushdown** — filter `status = approved`; results return without a full-table scan
    (verify via the server's query plan/log, or a row count attached to the response in
    dev); combine with a sort on `_creationTime` to confirm the equality still pushes
    down alongside the sort.
11. **`VIEW_ACTIONS` denied vs allowed** — as `contributor` (`readViews`/`createView`/
    `updateView`/`deleteView` all denied), confirm the shared-view tabs don't appear at
    all and the "Save shared" / promote action is disabled (local save still works); as
    `editor` (all four allowed), confirm the shared tabs appear and a saved shared view
    is visible to both roles.
12. **Row + bulk actions** — open the row menu and confirm the order Open, Inspect, Copy
    ID, then the star feature action, then Delete. Click the star action on one
    testimonial; `featured` toggles. Select several `pending` rows; bulk controls render
    inline in the toolbar left of Filter (never a floating bar); click "Approve N" — all
    selected rows become `approved` and the action disappears once none remain pending.
13. **Inspect peek** — click Inspect on a row; the panel opens instantly with the
    already-loaded data, then the Fields/JSON tabs populate fully. Press `Esc` to close
    it, `Space` on a focused row to reopen it. Navigate to a `peek=<id>` URL for a row
    outside the loaded page; it fetches by ID. Try a nonexistent/no-access ID; the same
    not-found message renders either way. Confirm `/`, `↑`/`↓`, `Enter`, `X`,
    `Shift+X`, and `Esc` behave per the shortcut table, and do nothing while typing in
    the search box or filter builder inputs.
14. **Responsive** — at 375 / 390 / 768 / 1024 / 1440, and inside a narrow pane, the
    toolbar collapses into an overflow menu, menus render as sheets below `md`, view
    tabs collapse into one sheet-opening button, the table scrolls horizontally with a
    sticky first column, and bulk controls replace the Filter row (Step 16).
15. **Hard-reload zero shift** — with devtools' Network panel open and throttled (Slow
    3G), hard-reload (not client nav) four URLs in turn: a shared view
    (`?view=shared:<id>`), a config view (`?view=config:high-value`, as `admin`), a
    local view with full state in the URL (`?q=…&sort=…&filter=…&view=local:<id>`), and
    a row with `?peek=<id>`. In each case confirm: the final rows/tabs/density/chips/
    peek-panel are present in the very first painted frame (no empty-state → filled-
    state flash, no tab list growing after mount, no peek panel appearing after a
    visible delay), and the response HTML (view source) already contains the resolved
    view's name and the prefetched rows.

Passing the 15-item checklist above, for at least one allowed role and one denied role, is
this step's Verify condition (see the Verify line at the top of this step).

## Verification

- `pnpm typecheck && pnpm test` green
- `harness doctor` clean; `harness struct` regenerated after Step 2
- `vex generate` in `apps/test` emits `vex_views` and every `searchField` search index
- Step 17 browser smoke checklist recorded, including hard reloads with no visible layout shift
