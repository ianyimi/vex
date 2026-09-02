---
"@vexcms/better-auth": patch
---

`createGetAuth`'s `orgCollectionSlug` is now optional. It was previously required even when
`resolveOrgs` was `false` — the only case that ever read it — forcing org-declined scaffolds to
pass a throwaway placeholder slug. Passing `resolveOrgs: true` without an `orgCollectionSlug` now
skips organization resolution (same as `resolveOrgs: false`) instead of a type error.
