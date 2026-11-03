---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
---

The collection list view is rebuilt around a URL-driven, server-prerendered `CollectionListView`:
per-collection search, sort, an AND/OR filter builder with per-field `FilterInput` components,
column visibility/order/pinning/resizing, page size, density, local (`localStorage`) and shared
(`vex_views` table, `listViews`/`saveView`/`removeView`) saved list views, a peek panel, per-row
actions (`list.row.actions` slot) and inline bulk actions (`list.bulkActions` slot). Data loads
through the new `useVexListQuery` / `useVexDocQuery` hooks, prefetched by `NextAdminPage` on the
server. See the List views guide.

**Structure + renames (no aliases).** Core `collections/` splits into `savedListViews/`,
`listView/`, and `query/`; React `collections/listView/` gains `toolbar/`, `create/`,
`savedListViews/`, `filters/`, `peek/`, `rowActions/` subfolders. Exported names follow:
`composeViewWhere` → `composeSavedListViewWhere`, `parseListParams`/`serializeListParams` →
`parseListViewUrlState`/`serializeListViewUrlState` (`ListParams` → `ListViewUrlState`),
`resolveListQueryState` → `resolveListViewQueryState`, `resolveColumnConfig` →
`resolveListViewColumnConfig`, `ListPreferences`/`parseListPreferences` →
`ListViewConfigCookieValues`/`parseListViewConfigCookies`, `ListViewsIndexEntry` →
`LocalSavedListViewsIndexEntry`, `BulkDeleteModal` → `DataTableBulkDeleteModal`,
`CreateDocumentModal`/`CreateDocumentForm` → `ListViewCreateDocumentModal`/`ListViewCreateDocumentForm`,
`ListViewTabs` → `SavedListViewTabs`, `ListFilterBuilder` → `ListViewFilterBuilder`, `ListPeek` →
`ListViewPeek`. `VexConfigError` now lives in core's `errors.ts`; `DENSITY_ROW_CLASS` moves from
`@vexcms/core` to `@vexcms/react`. `useListViewContext` (formerly internal `useCollectionList`) is
now exported from `@vexcms/react` for custom list slot contributions.

**Migration:** rename imports per the list above; there are no deprecated aliases.
