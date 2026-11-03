---
"@vexcms/core": patch
---

`saveView` validates its input: `viewId`/`name` must be strings, `state` must be a plain
object — otherwise it throws `VexError({ code: "INVALID_VIEW" })`.

Every reader of `vex_views.state` (`listViews`, `loadSharedViewWheres`, anything else reading
a stored view's state) now skips a row whose `state` isn't a plain object instead of crashing
on it, with a dev-only one-time warning — a single malformed row no longer breaks the whole
view list for every other user.
