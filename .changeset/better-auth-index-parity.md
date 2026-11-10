---
"@vexcms/better-auth": patch
"@vexcms/core": patch
"create-vexcms": patch
---

`betterAuthAdapter()` now emits the same Convex indexes `@convex-dev/better-auth` 0.13.0 generates:
compound indexes Better Auth queries on every password set/change/reset and session cleanup
(`account` `[accountId, providerId, userId]`, `[providerId, userId]`; `session`
`[userId, expiresAt]`; `verification` `expiresAt`; `user` `name`, `[email, name]`), plus the
table-level `indexes` Better Auth 1.7 plugins declare (`deviceCode`, `oauthClientResource`).
Those lookups previously fell back to a full-table scan with a "Querying without an index"
warning. The Convex adapter's index lookup also stops prefixing range and sort fields with
`_`, which kept any equality-plus-range or equality-plus-sort query (listing a user's live
sessions, for example) from matching an index. Regenerate your schema (`vex generate`) to pick them up.

`mergeAuthCollections` now unions an auth collection's `indexes` with the project
collection's by name (the project's entry wins on a name clash) instead of replacing the
adapter's list. New projects scaffold with the regenerated schema and an `engines.node`
floor of `>=22.0.0`.
