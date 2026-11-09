---
"@vexcms/better-auth": patch
---

Sets top-level `disableCreate: true` on EVERY collection the adapter registers, not just the user
collection — every auth table's rows arrive from Better Auth's own endpoints (sign-up, session
creation, OAuth linking, email verification), never an admin-authored create form, so each one
hides "+ New"/`?createNew=true` and rejects the `vex:create` endpoint. The user collection also
gets a short `admin.view.columns` default (`name`, `email`, `roles`/`role`, `banned`, `createdAt`
— whichever actually exist on the merged schema) instead of defineCollection's own "every field"
default, which previously overflowed the list view with system columns like `emailVerified`/
`createdAt`/`updatedAt`.

Both now survive a project's own `users.ts` — `@vexcms/core`'s `mergeAuthCollections` merges
generically instead of letting the project's `admin` object replace the adapter's whole-sale.
