---
"@vexcms/next": patch
---

`NextAdminPage` takes `searchParams?: Promise<Record<string, string | string[] | undefined>>`
(forwarded straight from the app route — only the collection list branch reads it, to resolve
`sort`/`filter`/`view`/`cols`/`q` server-side so the first paint matches what the client would
otherwise correct to after hydration) and `authPromise?: Promise<VexApiAuth>` (optional —
pass it once `config.access` is enabled, so the panel narrows itself server-side to what the
caller can actually see; a denied/unauthenticated caller still never receives real data
regardless, since Convex's own per-query RBAC is the actual data-safety boundary).

Omitting `searchParams` still compiles (`?:` ) but the server then resolves list state from
the collection's own defaults while the client reads the real URL — any `?sort=`/`filter=`/
`view=`/`cols=` link server-renders the wrong table, then visibly corrects after hydration.
Thread it through from your route's own `searchParams` prop, same as `params`.
