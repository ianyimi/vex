---
"@vexcms/core": patch
---

Fix a crash — and a latent widening — when a constrained rule is evaluated for a
caller with no user.

`anonRole` resolves a sessionless caller to a real role, so an unauthenticated
request reaches that role's rules. If one of them scopes rows to the caller, the
callback dereferenced a user that was not there. In production this surfaced as
`TypeError: Cannot read properties of undefined (reading 'email')` from inside
`constraints`, taking down the admin panel. The `base-nextjs` template ships
exactly this shape (`anonRole: user` plus a `fq.eq("email", user.email)` rule),
so every scaffolded project was affected.

`hasPermission` passed `props.user` through untouched, while the sibling call
site in `resolveAccessRule` already defaulted it. Copying that `?? {}` would have
traded the crash for something worse: `convexValuesEqual` treats
`undefined === undefined`, so `eq("email", undefined)` compiles to a range
matching every row whose field is absent — a silent widening rather than a loud
failure.

The rule's own behavior now decides. When there is no user, one is substituted
that records whether the callback read from it. A rule that asked who the caller
is gets denied, because there is no answer. A rule that never asked — the
read-only `anonRole` case, `fq.eq("status", "published")` — still compiles and
still works. Three tests pin it, including one that fails with the naive `{}`
fallback by returning `true` for a row with no email.
