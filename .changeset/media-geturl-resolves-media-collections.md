---
"@vexcms/core": patch
---

Fix `getUrl` and `deleteMedia` throwing for every project with `access` configured.

`resolveCollectionSlug` probed `ctx.db.normalizeId` against `config.collections` only, but
`defineConfig` keeps media collections in a separate `config.mediaCollections` array — and
both callers of the resolver (`getUrl`, `deleteMedia`) pass a media document id by
definition. So a media id was never resolvable, the resolver threw before the permission
check ran, and both media functions failed with an opaque server error whenever
`config.access` was set.

Symptoms this caused: uploaded images silently missing from public pages (a client renderer
that swallows the query error renders nothing), no `og:image` in generated metadata even
with the field set, and media deletion failing from the admin panel.

The resolver now probes both arrays, matching `validateAccessConfig`, which already treats
a media slug as a legitimate permission subject.
