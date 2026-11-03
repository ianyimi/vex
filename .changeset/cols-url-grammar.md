---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
---

Bumped `patch` despite being breaking, per this track's own `config-client-server-split`
convention — see that changeset's note on the `alpha` pre-release base.

The list URL's `cols=` parameter changes grammar from a plain comma-separated field-slug list
(`cols=title,author,status`) to `cols=<field>[:w<width>][:pl|:pr][:h]`, comma-separated, one
suffix combination per entry in a fixed order — carrying the full per-column state
(width, pin side, hidden) that `ColumnEntry` now unifies, not just display order. A bare field
slug with no suffixes still parses (a previously-shipped order-only `cols=` link keeps
working), but `serializeListParams` never emits the old grammar again. Diff-only against the
active view's own resolved array, always present for an active `local` view, unchanged.

No back-compat shim for a stored view's own `columns` array: an old view's bare-slug-only
array parses fine (every entry is a valid bare-slug `ColumnEntry`), it just has no width/pin
overrides until resaved.
