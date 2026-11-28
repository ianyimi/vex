---
"@vexcms/cli": patch
---

`vex dev` and `vex deploy` now warn when `convex/schema.ts` defines a table by hand that
`vex.schema.ts` also generates, and the two differ. Convex keeps using the hand-written table, so
the warning lists the fields and indexes that differ and links the
[adoption guide](https://docs.vexcms.dev/guides/adopt-existing-tables/). It also warns when an
index chained onto an imported generated table reuses a generated index name, which Convex
rejects. A hand-written copy that matches the generated table stays quiet. Each warning prints
once per `vex dev` session and again only when the difference changes.

A generated table now counts as already listed in `schema.ts` only when it is a `defineSchema`
key. Before, any text match was enough, so a new collection named `tags` was never added when
another table had a `tags` field. A computed key such as `[TABLE_SLUG_ACCOUNTS]` counts when it
resolves to a string constant in `schema.ts` or in a module `schema.ts` imports. Keys the CLI can't
read (spreads, other expressions) keep the old text match, so nothing is added twice.
