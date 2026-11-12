---
"create-vexcms": patch
---

**Fix (regression from the raw-API `config`-required change):** `convex/auth/api.ts`'s
`getUserOrg` resolves WHO the caller is — it reads the session/user/organization rows
by the Convex-identity-supplied ids before any permission check can even run — so its
three `get()` calls now pass `access: { bypass: true }`, in `apps/www`, `apps/test` and
the `base-nextjs` template. Once those calls started threading a real `config` (required
per the raw-API change), the deny-by-default access posture applied to them too: `session`/
`user`/`organization` are never declared `defineAccess` resources, so every caller — admin
included — was denied and the admin panel became unreachable on a fresh scaffold.
