---
"@vexcms/core": patch
---

New `access.organizations?: boolean` config flag (default `false`) — the SOLE trigger for
saved-view organization scoping. Requires `access.orgCollectionSlug` to also be set (a
dev-mode warning fires otherwise); `orgCollectionSlug` alone no longer scopes anything by
itself — it only ever meant "where organization data lives, so a project's own permission
callbacks can read `organization`," a separate mechanism (`hasPermission`,
`resolveAccessRule`, `resolveFieldPermissions`, `SubjectMap`/`PermissionCallbackProps`, a
project's own `create`/`update`/`remove` callbacks) unaffected by this change — a project can
use `organization` in its own callbacks without opting into view scoping.

With `access.organizations: true`, `listViews`/`loadSharedViewWheres`/`saveView`/`removeView`
and the client's `useCanAccessSharedViews` all route through one shared predicate
(`isViewOrganizationScopingEnabled`/`resolveViewOrganizationId`, new
`packages/core/src/access/resolveViewOrganizationScope.ts`) so none of them can drift
independently: `listViews`/`loadSharedViewWheres` return `[]` for a caller whose own
organization doesn't resolve; a caller whose organization resolves sees only that
organization's own rows. `saveView`/`removeView` deny a caller whose own organization doesn't
resolve outright, for any `viewId`, before reaching the database; a caller whose organization
resolves may only touch an EXISTING row whose `organizationId` exactly matches theirs — a
cross-org row, an org-less row, and a genuinely missing row all throw the identical `No view
"<viewId>" found for collection "<collection>"` error (no existence leak). A new insert always
stamps the caller's own resolved organization. A `vex_views` row saved before this flag was
enabled (no `organizationId`) is invisible and inert — not adopted by whoever saves it next.

**With the flag unset (the default — unaffected, no migration needed):** exactly the
pre-scoping behavior. `listViews`/`loadSharedViewWheres` read everything unscoped;
`saveView`/`removeView` can create/patch/delete any shared view, cross-org-labeled or
org-less, as long as the caller holds the relevant `VIEW_ACTIONS` permission;
`useCanAccessSharedViews` returns `true`. Local (cookie/`localStorage`) views are entirely
unaffected either way — they never touch `vex_views` or any organization logic.
