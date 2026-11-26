---
"@vexcms/better-auth": patch
---

**User-visible admin behavior change.** Better Auth's `references` attributes (`session.userId`,
`account.userId`, and every other foreign-key column the adapter generates) now map to
`relationship({ collection: { slug }, schema: { validator: "string" } })` instead of `text()`.
The stored shape is unchanged — still a plain `v.string()` column, so no data migration is
needed — but the admin panel now renders these columns with a searchable relationship picker,
a populate-aware list-view cell, and `populate`/`depth` support, instead of a plain text input
that showed the raw string id with no link to the referenced document.

No migration: the Convex schema for these columns is unchanged (`v.string()` before and after).
Only the admin experience and this package's internal field config for them changed.
