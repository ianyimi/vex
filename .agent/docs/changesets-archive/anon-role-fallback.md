---
"@vexcms/core": minor
---

Add `anonRole` to `defineAccess()` — public access for unauthenticated callers.

When a caller's normalized roles resolve empty (no session, `user: {}`, or a Better Auth
anonymous-plugin user whose roles field is unset or unreadable), `hasPermission()` now falls
back to `[access.anonRole]` instead of denying. Explicit roles always win over the fallback.
`anonRole` is typed `TRoles[number]`, so it must name a declared role; `defineAccess` rejects
an empty string with `VexAccessConfigError`. Omitting it preserves the previous behavior:
empty roles deny. Enables the maprios public patterns — anonymous reads of published documents
and unauthenticated contact-form creates — with no matrix or server-API changes.
