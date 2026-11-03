---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
---

**Breaking: collection admin URLs moved to `/admin/collections/<slug>`.**
`/admin/<slug>` and `/admin/<slug>/<id>` now 404 — there is no redirect.
Global URLs (`/admin/globals/<slug>`) and the dashboard (`/admin`) are
unchanged.

Every in-app link (`adminHref`, sidebar, dashboard cards, globals list, every
field type's title-column `Cell.tsx`) already resolved through `adminHref` or
`NextAdminPage`'s own route parser, so this is a one-file change in each
package: `adminHref.ts`'s `"collection"`, `"document"` and `"create"` targets
now emit the `/collections/` prefix, and `NextAdminPage` now requires a
`collections/<slug>[/<id>]` or `globals/<slug>` first segment, `notFound()`ing
on anything else.

If you bookmarked or hand-built an admin collection URL outside this package
(a custom nav, an email link, a saved browser bookmark), update it to the new
`/admin/collections/<slug>` shape.
