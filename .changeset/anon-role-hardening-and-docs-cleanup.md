---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"@vexcms/richtext-plate": patch
"@vexcms/better-auth": patch
"create-vexcms": patch
"www": patch
---

Deny caller-scoped rules in query-shaping, not just per-document, when the
caller has no user; tie Better Auth's anonymous plugin to `anonRole` by role
string instead of by accident; and clean up the docs.

**`resolveAccessRule`'s query-shaping pass now shares `hasPermission`'s
sentinel guard.** `anon-constraint-fail-closed` (an earlier changeset) fixed
`hasPermission`'s per-document pass so a caller-scoped rule reached through
`anonRole` denies, rather than crashing or silently widening, when there is no
user to scope to. `resolveAccessIndex`/`resolveAccessConstraint` — the sibling
pass that decides which `withIndex`/`.filter()` a query gets — still defaulted
to a plain `{}`, so a rule like `base-nextjs`'s own
`fq.eq("email", user.email)` compiled `eq("email", undefined)` for a
sessionless caller. Convex reads `undefined` as "field is absent," so `find`
and `search` read a widened range before the per-document check (correctly)
threw the rows away — safe, but reading more than the rule permits. The
sentinel-`Proxy` technique is now extracted into a shared
`createUserReadSentinel` (`@vexcms/core/access/userReadSentinel`) used by
both passes, so they can no longer disagree about which rows a rule
describes. Two new tests in `resolveAccessRule.test.ts` pin the query-shaping
side the way the original three pin the per-document side.

**That guard was previously unreachable from every real server call.**
`create`, `get`, `update`, `remove`, both `globals` write paths, both `media`
API files, and `find`/`search`'s own per-document filters all normalized
`user: args.auth?.user ?? {}` before calling `hasPermission` — collapsing a
sessionless caller's `null` to `{}` upstream defeats a `null`-keyed sentinel
before it ever runs. All 19 call sites across `@vexcms/core`'s API layer now
pass `?? null` through, matching what `find`/`search` already did for their
index-resolution calls, so the sentinel actually protects every write and
per-document read path, not only `find`'s indexed query.

**`@vexcms/better-auth` gains `anonRoleDatabaseHook(role)`.** Better Auth's
`additionalFields` default-fills `roles` on every new user regardless of
`isAnonymous`, so an anonymous-plugin visitor silently lands in whatever role
every other new signup gets — `anonRole` never actually applies to it, only
to a caller with no session at all. The new hook is a
`databaseHooks.user.create.before` that stamps the SAME role string passed to
`defineAccess({ anonRole })` onto anonymous-plugin users specifically,
keeping the two in lockstep by construction instead of by coincidence. Wired
into `apps/www` and the `base-nextjs` template's `auth/options.ts`, both
still assigning anonymous visitors the existing `"user"` role — no
permission-matrix change, just an explicit, inspectable stamp instead of an
implicit shared default.

**Docs.** Stopped documenting patterns versioning & drafts will supersede and
API that does not exist: example collections no longer hand-roll
`status`/`publishedAt` fields; three published READMEs (`@vexcms/next`,
`@vexcms/react`, `@vexcms/richtext-plate`) now use their real package names
instead of pre-rename ones; unshipped feature sections (versioning & drafts,
live preview, impersonation) are now roadmap notes; documented exports that
were never exported are removed from every table and example; `@vexcms/core`'s
field-type table lists the 12 shipped types instead of a mix of 13 wrong ones.
`GlobalEditView`'s heading now renders the global's label in `text-primary`,
matching how the rest of the admin panel distinguishes a document's identity
from its chrome.
