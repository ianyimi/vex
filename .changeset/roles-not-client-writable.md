---
"create-vexcms": patch
"@vexcms/better-auth": patch
---

Scaffolded `user.additionalFields.roles` now carries `input: false`. Without it, Better
Auth 1.6.23 writes any `roles` value a caller sends on `/sign-up/email` or `/update-user`
straight onto the user row — `additionalFields` only sets a *default*, not a block on
caller-supplied input. A visitor who knows the field name can `POST` `{ "roles": ["admin"] }`
during sign-up and become an admin on first request, no further exploit needed.

Existing projects: add `input: false` next to `roles` in `src/auth/schema.ts` (or wherever
your scaffold's `authSchema.user.additionalFields` lives) and redeploy. Any other
`additionalFields` entry the server sets itself — never one a sign-up or profile-update
form should carry — needs the same flag.
