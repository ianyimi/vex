---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"create-vexcms": patch
---

Bumped `patch` despite being breaking, per this track's own convention (see
`config-client-server-split`'s changeset): the `alpha` pre-release keeps every package on the
`0.1.0` base, and the breaking surface is itemized here and in the commit's `BREAKING CHANGE:`
footer.

Removed `admin.table`/`CollectionTableConfigInput`/`CollectionTableConfig` entirely.
`admin.view` (the default view) and `admin.views` (preset views) now carry everything that
used to live on `admin.table`, not just view identity: `name?`, `description?`, `where?`,
`sort?`, `pageSize?`, `searchField?`, `columns?`, plus the collection-wide settings
`searchFields?` (renamed, plural, from the old `admin.table.searchField` — it was colliding
with this same shape's own per-view singular `searchField`), `pageSizeOptions?`,
`countLimit?`, `serverPageSize?`, and `bulkActions?`. `admin.views[n]` accepts the identical
shape — a preset view can override any collection-wide setting too, falling back to
`admin.view`'s own resolved value, then the global default.

**`@vexcms/core`.** `columns` entries are now `ColumnEntry<TFieldSlug> = TFieldSlug |
{ field, width?, pinned?, hidden?, enableSorting?, enableHiding? }` — order, visibility, pin
side, width, and the sortable/hideable capability flags are all one array, one per-field
entry; a view's own entry always wins over `field.admin.*`, which is only consulted when
unset. `field.admin.width` is renamed `columnWidth` (the existing `width` key is the field's
own CSS row-width in the edit form, an unrelated axis). The reserved id for the always-first
selection-checkbox column is `"select"`; a versioned collection's synthetic `vex_status`
status column is a full `ColumnEntry` participant (reorderable/hideable/pinnable/resizable),
with an existing saved view's absence of `vex_status` back-filling as unpinned-but-visible,
first position — not hidden, so no pre-existing view silently loses its status badge.
`validateTableConfig.ts` is renamed `validateViewConfig.ts`; its checks now run per view
(`admin.view` and every `admin.views[n]`), and a view's own `enableSorting: true` override
still must lead a declared index, same as a field's.

**`@vexcms/react`.** Every `visibleColumns`/`columnOrder`/`columnPinning` consumer collapses
onto the one `columns: ColumnEntry[]` prop/state; `getCollectionColumnDefs` now resolves each
field's `enableSorting`/`enableHiding` through `resolveColumnConfig` (the view's own entry can
override a field's own default) instead of reading `field.admin.*` directly.

**Migration:** every `admin.table.*` config key, column ordering/visibility/pinning state, and
reader across core/react/next is moved — there is no shim or dual-read period.
