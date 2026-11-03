---
"@vexcms/react": patch
---

Typing in the list search box no longer flashes the table to a loading skeleton and then an
empty state before settling — the previous results stay on screen (dimmed, same treatment a
view switch already gets) while a debounced search resolves, then swap in place with no
skeleton or empty-state flash in between.

Three compounding causes fixed together: the table's seed query re-suspended on every
search/sort/filter change with no previous-page fallback to fall back to; switching between
find-mode and search-mode pagination lost the OTHER mode's still-valid previous results the
instant the dispatch target changed; and the debounce itself was buggy (see the
`use-debounced-value` changeset). `isFetching`/`isPlaceholderData` are also unreliable signals
against a live Convex subscription (updates arrive via the websocket's own cache push, never a
tracked refetch) — the search spinner now tracks a dedicated `isSettling` state instead.
