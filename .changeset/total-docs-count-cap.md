---
"@vexcms/core": patch
"@vexcms/react": patch
---

`find`/`search` no longer `.collect()` the whole matching set to count it — a query above
Convex's ~32k-document transaction scan limit used to fail outright, and `totalDocs` reported
`null` once a collection crossed that threshold. Both now count at most
`admin.view.countLimit + 1` rows (`countLimit` default `10000`, collection-wide,
settable per view too; `search` always clamps it to `1023`, since a Convex search query returns
at most 1024 results) and return `totalDocs: number` always, plus a new
`totalDocsCapped: boolean` — `true` once the cap is hit, meaning the real count is `>=
totalDocs`, not exact.

`usePaginatedQuery`'s own `totalDocs` no longer latches to the first response it ever saw: it
re-reads `totalDocs`/`totalDocsCapped` from every `cursor === null` response, so switching a
filter or view, or a live insert landing while the hook is mounted, updates the displayed
total — not just a one-time value frozen at first mount.

**Migration:** `totalDocs: number | null | undefined` stays the same TypeScript type (a
consumer handling `null` still compiles), but `null` is no longer a value either function
ever actually returns — replace a `totalDocs == null` "over 10,000+" fallback with
`totalDocsCapped` if you want the capped-count UI back.
