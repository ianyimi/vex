---
"@vexcms/react": patch
---

Load errors are now region-specific instead of an uncaught boundary or a silently blank
screen, each region reusing one shared error-boundary-style component with
`QueryErrorResetBoundary` for retry.

The table reuses the existing `ListQueryError` (generic "Couldn't load <plural>" + Retry; an
`UNINDEXED_SORT` failure offers "Remove sort" instead) — the toolbar stays usable, same frame
size as the table, zero layout shift. A peek that fails to load or isn't accessible shows the
existing "Can't show this document" copy either way — not-found and no-access read
identically, by design, no existence leak. A shared-view tab fetch failure leaves the
default/config/local tabs rendering and shows a small inline "Couldn't load shared views ·
Retry" in just the shared slot.

`useVexDocQuery` now returns an `error` field; the three edit views (collection/global/media)
show an inline error state with Retry instead of rendering a blank form when it's set.
