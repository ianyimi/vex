---
"@vexcms/core": patch
---

`defineCollection`'s default `admin.table.defaultSort.field` is now
`_creationTime` — Convex's system field — instead of the nonexistent
`_createdAt`.
