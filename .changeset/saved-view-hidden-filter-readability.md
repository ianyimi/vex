---
"@vexcms/core": patch
"@vexcms/react": patch
---

**Fixed: a saved view's hidden-filter lock badge now only covers conditions on fields the
current caller can't read — a condition on a READABLE field is always shown as a filter chip,
whether or not some OTHER condition in the same view names an unreadable one.**

Previously, a `config`/`default` view's `hasHiddenFilter`/`hiddenFilterCount`
(`toClientSavedListViewConfig`) treated ANY declared `where` as fully hidden, by design,
regardless of field readability — a view filtering on a perfectly readable field (e.g. a
preset "Active" tab filtering on `status`) showed the lock badge with nothing to actually
explain. A `shared` view's own saved filter (`useSavedListViews`'s `toEntry`) had the opposite
bug: it DID check readability, but all-or-nothing — one unreadable condition anywhere in the
tree hid the WHOLE tree, including sibling conditions on fields the caller could read.

Both now split the `where` tree leaf-by-leaf via a new shared `splitWhereByReadability`
(`@vexcms/core`): every condition on a readable field survives into a new `visibleWhere`
field on `VexClientViewConfig`/`SavedListViewEntry`, and only the truly unreadable conditions
are counted into `hiddenFilterCount`. An `and` node splits per child; an `or`/`not` node is
shown or hidden as a whole (splitting a single branch out of an `or` would misrepresent what
the query actually matches).

**Client:** `toClientSavedListViewConfig` now takes a required `isFieldReadable` predicate
(previously computed its all-or-nothing result with no readability check at all).
`@vexcms/react`'s `ListViewFilterChips` gained a `lockedWhere` prop — a `config`/`default`
view's own readable condition(s) now render as non-removable, locked chips (with a small
lock icon) alongside the normal editable ones, via a new `ListViewContext.lockedFilterWhere`.
A new `isFieldReadable(resolved, field)` export on `@vexcms/core`'s `access` module
(`ALWAYS_READABLE_FIELD_KEYS` + `isFieldAllowed`) backs both this and the existing
`useCanReadField` hook, which now calls it instead of re-implementing the same check.
