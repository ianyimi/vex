---
"@vexcms/react": patch
"@vexcms/next": patch
---

New `/admin/collections` route — a collections-only index page (`CollectionsIndexView`,
exported from `@vexcms/react`), in the same card-grid style as the dashboard but showing
only collections and media collections, no globals. Reuses a new shared section
component, `AdminCardSection`, also now exported — `DashboardView` and `GlobalsListView`
were refactored onto it so all three index pages render identical markup instead of three
near-copies.

`AdminHrefTarget` gains `{ type: "collections" }` (→ `/{basePath}/collections`), parallel
to the pre-existing `{ type: "globals" }`. `NextAdminPage`'s route parser renders the new
`CollectionsIndexView` for `collections` with no slug — previously a `notFound()`.
`AdminTopNav`'s breadcrumb trail gains a "Collections" crumb for the new route, parallel
to its existing "Globals" crumb.

**Breaking (narrow): `GlobalsListView` is now permission-filtered.** It used to render
every configured global unconditionally — not a real boundary, since `/admin/globals` is
reachable directly by URL for any caller, including an anonymous one via `anonRole`. It
now runs the SAME `hasPermission` (`read`, `scope: "any"`) check `DashboardView`'s own
Globals section already ran, so a caller only sees globals they can actually read. A
project whose `access.ts` already grants broad global read access sees no behavior
change; one relying on the sidebar/dashboard alone to hide an unreadable global's card
from `/admin/globals` directly should audit that this is now enforced at the route level
too (it always was at the data level — Convex's own per-query RBAC never depended on this
component).

The "collection not found" / "global not found" screens' back links now point at the new
collections/globals indexes (`/admin/collections`, `/admin/globals`) instead of the
dashboard — more specific, since the caller was trying to reach something under that
section.

Both index pages now show a proper empty state (`AdminIndexEmptyState`, also exported —
same visual shape as `ListEmptyState`'s own `"empty"` variant) when the caller can read
nothing at all, instead of silently rendering nothing below the page title.
