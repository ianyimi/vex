---
"@vexcms/react": patch
---

Fix the collection list view's bulk/selection group shifting every other toolbar control, and
remove a broken "Select all N loaded" control.

**Selection-group ordering.** Selecting a row used to render the "N selected"/bulk-actions
group FIRST in `ListViewToolbar`'s row, pushing Search, Columns, Filter, the Filter chips,
`ListViewModifiedControls`, and the hidden-filter lock badge (`SavedListViewHiddenFilterBadge`)
all one group to the right — and back again on Clear. The bulk group now renders LAST among
every left-row child, after all of the above, in the same shared `flex-wrap` row they already
share (wrapping onto a new line on its own exactly like a filter chip does at narrow widths).
Nothing that existed before a selection ever moves when one appears or disappears.

**`CollectionListView` now forwards `rows` to `ListViewLayout`.** It always renders its own
`DataTable` through `tableSlot`, so `ListViewLayout`'s `rows` prop — the one `ListViewToolbar`'s
bulk bar reads for its loaded-row count — was never passed, silently defaulting to `[]`. The
bulk bar always read 0 loaded rows regardless of the real page size.

**Removed "Select all N loaded".** It was redundant with the `DataTable` header checkbox,
which already selects every loaded row, and inherited the above undercount bug. The bulk
group now shows only the selection count, `list.bulkActions` contributions, and Clear.
