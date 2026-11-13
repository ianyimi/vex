# @vexcms/admin-next

## 0.1.0-alpha.39

### Patch Changes

- dc4302b: Two developer-reported `useNextAuthTransitionRefresh` (`@vexcms/next`) races fixed:

  1. **Admin sidebar flash on every page load.** `AuthTransitionProvider`'s `expectedIdentity`
     (`@vexcms/react`) always starts `null`; an already-signed-in caller's own
     `authClient.useSession()` watcher resolves asynchronously a tick after mount, producing a
     `null → <id>` "bootstrap" transition on effectively every `/admin` load even though the
     SSR'd page already reflects that identity. `useNextAuthTransitionRefresh` treated this as a
     real change and called `router.refresh()`, re-suspending the sidebar's `<Suspense>`
     boundary right after first paint — the sidebar settles, then visibly re-flashes. The hook
     now exempts exactly this one bootstrap transition (the first observed, only when moving
     away from the unresolved `null` baseline) while still refreshing for every later
     transition, including a later `<id> → null` (the hook's actual purpose: another tab signing
     out, or a session dying while this tab sits idle).
  2. **Sign-out: admin shell lingers, sign-in page flashes, before the real destination lands.**
     A same-tab sign-out's `beginTransition(null)` call (made synchronously, before the sign-out
     adapter's own hard navigation, which only runs after an async `signOut()` round trip)
     ALSO triggered this hook's `router.refresh()` — a soft, client-side re-render of the now
     signed-out admin route that can complete, redirect to the sign-in route via the admin's own
     guard, and paint, all before the hard navigation takes over. `AuthTransitionState.beginTransition`
     (`@vexcms/react`) gains an optional second argument, `{ skipRefresh?: boolean }`; a new
     `AuthTransitionState.consumeSkipRefresh()` lets `useNextAuthTransitionRefresh` skip its own
     refresh for a transition the caller already knows triggers its own navigation.
     `VexAdminAuthAdapterContext`'s documented `signOut` contract (`@vexcms/next`) now calls
     `beginTransition(null, { skipRefresh: true })`; `create-vexcms`'s `base-nextjs` template and
     `apps/test`/`apps/www` are updated to match.

  **Breaking:** none — `options` is optional; every existing `beginTransition(identity)` call
  site keeps working unchanged.

- Updated dependencies [dc4302b]
- Updated dependencies [dc4302b]
- Updated dependencies [dc4302b]
- Updated dependencies [46ad684]
- Updated dependencies [dc4302b]
- Updated dependencies [dc4302b]
- Updated dependencies [dc4302b]
- Updated dependencies [dc4302b]
- Updated dependencies [dc4302b]
- Updated dependencies [dc4302b]
- Updated dependencies [dc4302b]
  - @vexcms/react@0.1.0-alpha.39
  - @vexcms/core@0.1.0-alpha.39

## 0.1.0-alpha.38

### Minor Changes

- 637ce11: Fixed a layout shift on admin refresh: with the sidebar open, the Collections/Globals/Media
  section headers and their items used to pop in after the server resolved the signed-in
  caller — the `<Suspense>` fallback (`AdminSidebarSkeleton`) rendered one flat, unlabelled,
  fixed 6-row placeholder regardless of how many items the settled, permission-filtered nav
  was about to show, so a project with many collections (or a caller with few visible ones)
  saw a large shape change the instant `authPromise` resolved.

  The sidebar now remembers each section's own last-settled item count in the consolidated
  `vex-admin` cookie's new `sidebarCounts` field (`@vexcms/core`'s
  `parseSidebarSectionCountsCookie`/`applySidebarSectionCountsUpdate`, following the list
  view's own row-count cookie conventions) — read server-side (`NextAdminLayout`) and
  threaded through to `AdminSidebarSkeleton`, which renders the SAME per-section headers and
  skeleton-row counts the real nav is about to settle with, falling back to the config's own
  declared section sizes on a cookie-less first visit. A section settled at `0` items hides
  its header on the next first paint too, the same way the real nav already does. Counts are
  scoped per BROWSER (not per caller), so the very first load after a caller signs in may
  still show their predecessor's count for one refresh, self-correcting from then on.
  `AppSidebar` persists each section's real count via a new `writeSidebarSectionCountsCookie`
  (`@vexcms/react`); `writeAdminCookie` gained a functional-patch form (matching
  `writeAdminCollectionCookie`'s own) to support the merge.

  Also fixed a second pop-in in the same header: the loading skeleton's `ThemeToggle` was
  missing outright (only the "VexCMS Admin" label rendered), so the toggle button itself
  appeared for the first time the moment the real sidebar mounted. `ThemeToggle` gained a
  `disabled` prop (renders the SAME icon/size/position, `disabled` + `aria-disabled`, dropdown
  inert) so the skeleton can render it in place from first paint; the real, enabled toggle
  replaces it the same way the rest of the header's content does.

  Fixed a third, unrelated bug surfaced during the same investigation: the sidebar's
  permission-filtered nav is resolved from `authPromise` exactly ONCE per server render
  (`AuthedSidebar`'s `use()` call) and never re-evaluated afterward — a caller whose session
  ended in ANOTHER tab (or expired) while this tab sat on an already-rendered admin page kept
  seeing their stale, previously-authorized nav indefinitely, correcting only once some
  navigation happened to occur (Next re-fetches the dynamic `/admin` layout, including a fresh
  `authPromise`, on every navigation already — sign-out from the SAME tab was already fine,
  since it hard-navigates). `@vexcms/next` gained `useNextAuthTransitionRefresh`, mounted by
  `NextAdminLayoutClient`: it calls `router.refresh()` whenever `@vexcms/react`'s
  `useAuthTransition()` — the SAME reactive identity signal `usePaginatedQuery`/
  `useVexListQuery` already key their own stale-push detection off — reports the caller's
  identity changed, with no navigation of its own to carry the refetch. `router.refresh()`
  feeds `AdminLayout` a brand-new, still-pending `authPromise`, which re-suspends its existing
  `<Suspense>` boundary to `AdminSidebarSkeleton` and then resolves under the CURRENT identity
  — re-filtering the nav and re-persisting the sidebar section-count cookie for whoever is
  signed in now, via the same existing mechanisms above.

  Fixed a hydration mismatch on `ThemeToggle`'s icon surfaced by the skeleton change above
  (adding a SECOND `ThemeToggle` instance to the loading fallback created a real risk the
  generic `theme === "system"` coincidence previously masked): the icon now explicitly gates
  on a new `mounted` flag (`ThemeProvider`'s context value) — `false` identically on the
  server and the client's first render (it only ever flips inside an effect, same timing as
  the `.dark` class itself), rendering the theme-neutral `"SunMoon"` icon until then,
  regardless of `defaultTheme` or a persisted `localStorage` theme that differs from it.
  Covered by a new `renderToString`-vs-`hydrateRoot` regression test
  (`ThemeToggle.ssrHydration.test.tsx`) for both a persisted "dark" and "light" theme, and for
  the disabled skeleton placeholder.

- 637ce11: Fixes a live-preview bug where signing out — in the pop-out preview tab, or in any tab
  while a preview was open elsewhere — left the `__prerender_bypass` (Next Draft Mode)
  and `vex-live-preview` marker cookies set. A public page's `getBySlugPreview` query,
  now running for an anonymous caller, used to come back `[]` under those stale cookies,
  so the page rendered its "not found"/welcome fallback instead of the published content.

  **`getBySlugPreview` no longer denies the published row.** Every project's
  `convex/pages.ts` and `convex/posts.ts` (apps, and the `create-vexcms` templates) passed
  `drafts: true` alongside an explicit `access: { action: DRAFT_ACTIONS.readDrafts }` —
  that override made `find`'s own published-row fallback run under the `readDrafts`
  action too, so a caller without that permission (anonymous included) was denied the
  query outright instead of falling back to the published row. Dropping the override
  restores `find`'s normal per-caller behavior: a session with `readDrafts` still gets the
  draft-merged row; everyone else gets the published row, or `[]` if none exists — never
  draft content either way.

  **New `@vexcms/next/livePreview/client` export: `disableLivePreview(path?)`.** Call it from
  every sign-out entry point, alongside the existing identity-transition hook and before
  the hard navigation/refresh that follows. It issues a same-origin, credentialed,
  non-following `GET <path>?disable=1` (default path `/api/vex/live-preview`) against the
  project's Draft Mode route, clearing both cookies. Fire-and-forget and never throws, so
  a failed request can never block sign-out. `apps/www`, `apps/test`, and both
  `create-vexcms` templates' sign-out wrappers (`BetterAuthClientProvider`'s `signOut`,
  and `SessionButton`) now call it.

  **New setting: `admin.livePreview.expiredSessions: "allow" | "deny"`** (default
  `"allow"`, matching today's behavior). Setting it to `"deny"` closes the remaining gap
  for a preview left open in an unrelated tab: every `proxy.ts` now checks the session
  once on any request carrying either preview cookie — with or without
  `?vexLivePreview=1` — and redirects an unauthenticated one through
  `/api/vex/live-preview?disable=1&redirect=<path>` before it reaches your route
  handlers, reloading the page published.

### Patch Changes

- 637ce11: Admin sign-out now lands immediately on a configurable destination instead of lingering on
  the signed-out admin shell for seconds. `defineConfig()` gains a client-safe `auth.signOut.redirectTo`
  option (default `"/"`) alongside the existing server-only `auth.adapter` — both resolve onto
  the SAME `config.auth` group, merged by `defineServerConfig()` rather than replaced, so
  `config.auth` is now always present (check `config.auth.adapter` to test whether an adapter
  was registered, not `config.auth` itself).

  `FrameworkAuthAdapter.signOut`'s contract changes: it must now sign out, then hard-navigate
  (a full document load, never `router.push`/`router.refresh`/any client-side transition) to the
  resolved `config.auth.signOut.redirectTo` once the session cookie clears. The admin shell must
  never re-render in a signed-out state — a client-side refresh previously kept the sidebar/top
  bar mounted while queries re-ran anonymously and the route guard redirected underneath it,
  producing a multi-second "sidebar lingers, then a sign-in flash" sequence. `apps/test`,
  `apps/www`, and the `base-nextjs` template's `BetterAuthClientProvider.signOut` all switch to
  `window.location.href = config.auth.signOut.redirectTo`.

  The same client/server navigation race affected sign-IN: the templates' shared
  `AuthViewProvider` previously passed `router.push`/`router.replace` as `@daveyplate/better-auth-ui`'s
  `navigate`/`replace`, with `onSessionChange: () => router.refresh()`. Because `router.refresh()`
  returns no real promise, the library's `navigate(redirectTo)` call fired immediately after,
  while the refresh's own RSC re-fetch for the pre-navigation route was still in flight — when
  that refresh resolved after the push had already started (worse under a slow first compile),
  Next's router could reconcile the stale pre-navigation tree over the pushed route: credentials
  accepted, nothing visibly happened, yet the session was real (confirmed on back/forward).
  `AuthViewProvider` now passes hard-navigating `navigate`/`replace` (`window.location.href`/`.replace`)
  and drops `onSessionChange` entirely — there is no client-side router state left to race.

- 637ce11: **Breaking:** `disableLivePreview` and `DEFAULT_LIVE_PREVIEW_ROUTE_PATH` move from
  `@vexcms/next/livePreview` to the new client-safe `@vexcms/next/livePreview/client`. The
  `livePreview` entry also exports `createVexDraftModeRoute`, which imports `next/headers`, so a
  client component (a sign-out button) importing `disableLivePreview` from it failed `next build`.
  Update the import path.
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
- Updated dependencies [637ce11]
  - @vexcms/core@0.1.0-alpha.38
  - @vexcms/react@0.1.0-alpha.38

## 0.1.0-alpha.37

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @vexcms/core@0.1.0-alpha.37
  - @vexcms/react@0.1.0-alpha.37

## 0.1.0-alpha.36

### Patch Changes

- @vexcms/core@0.1.0-alpha.36
- @vexcms/react@0.1.0-alpha.36

## 0.1.0-alpha.35

### Patch Changes

- Updated dependencies [61982b1]
- Updated dependencies [61982b1]
- Updated dependencies [67c7dec]
- Updated dependencies [61982b1]
- Updated dependencies [61982b1]
  - @vexcms/core@0.1.0-alpha.35
  - @vexcms/react@0.1.0-alpha.35

## 0.1.0-alpha.34

### Patch Changes

- Updated dependencies [b96a81b]
- Updated dependencies [b96a81b]
  - @vexcms/core@0.1.0-alpha.34
  - @vexcms/react@0.1.0-alpha.34

## 0.1.0-alpha.33

### Patch Changes

- 8cf0b32: **Fix: live preview of a never-published document 404'd instead of rendering the
  draft.** `[slug]/page.tsx`-style public routes call their published-only query on
  the server and `notFound()` when nothing comes back, so a document that has only a
  draft row — never published — 404'd before the client-side live-preview layer (which
  reads a second, `readDrafts`-gated query) ever got a chance to render it.

  Adds `createVexDraftModeRoute` (`@vexcms/next/livePreview`), a Route Handler factory
  that enables Next.js Draft Mode for a verified live-preview session and redirects
  back to the previewed page — `draftMode().enable()` can only be called from a Route
  Handler or Server Action, never from middleware, so the project's own
  `proxy.ts`/middleware now hands a `?vexLivePreview=1` request off to this route
  (once it verifies the session itself) instead of setting the live-preview cookie
  directly. A public page checks `(await draftMode()).isEnabled` as the fallback when
  its published-only query comes back empty, letting the client-side preview layer
  take over instead of 404ing — every visitor outside Draft Mode is unaffected, and
  the route stays statically prerendered.

  **Migration (apps/www, apps/test, and any project using
  `admin.livePreview.url`):** add a session-authorized `GET /api/vex/live-preview`
  route handler wired with `createVexDraftModeRoute({ getToken })`, and update your
  project's `proxy.ts`/middleware to redirect an unhandled `?vexLivePreview=1` request
  there (guarding against re-entering with the existing `vex-live-preview` cookie)
  instead of setting that cookie itself. See the "Security: the gate is yours to set"
  section of the live-preview guide for the full before/after.

  **Fix: the loop-break cookie could outlive Draft Mode itself.** `proxy.ts`'s
  hand-off check previously short-circuited on the advisory `vex-live-preview`
  marker cookie alone, but that cookie is set for `LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS`
  (1h) while Next's own Draft Mode cookie (`__prerender_bypass`, now exported as
  `DRAFT_MODE_BYPASS_COOKIE` from `@vexcms/next/livePreview`) is a browser-session
  cookie that can disappear well before that. A stale marker then skipped the
  hand-off — and never re-enabled Draft Mode — for up to the rest of that hour.
  The check now requires BOTH cookies.

  **Fix: no way to leave preview mode.** `createVexDraftModeRoute` only ever called
  `draftMode().enable()`. It now also disables: an explicit `?disable=1` (no
  session required — leaving preview needs no authorization) clears Draft Mode and
  `vex-live-preview` and redirects to `redirect` (or `/`); a signed-out request that
  still carries a `redirect` param — the shape the proxy's hand-off always uses —
  gets the same disable-and-redirect treatment instead of a bare `401`, so a
  session that expires mid-preview doesn't leave Draft Mode stuck on for an
  anonymous visitor. No session AND no `redirect` param still returns `401`,
  keeping a direct, non-hand-off call distinguishable. The open-redirect guard on
  `redirect` applies to every outcome, enable or disable.

  **Migration (apps/www, apps/test, and any project using
  `admin.livePreview.url`):** update your `proxy.ts`/middleware's loop-break check
  to require both `LIVE_PREVIEW_COOKIE` and the new `DRAFT_MODE_BYPASS_COOKIE`
  export — see the updated code sample in the "Security: the gate is yours to set"
  section of the live-preview guide. No route handler change is required; the
  disable path is additive.

- Updated dependencies [8cf0b32]
- Updated dependencies [64f2ef7]
- Updated dependencies [8cf0b32]
- Updated dependencies [8cf0b32]
- Updated dependencies [87376fb]
- Updated dependencies [8cf0b32]
- Updated dependencies [8cf0b32]
- Updated dependencies [b33d9a3]
- Updated dependencies [8cf0b32]
- Updated dependencies [8cf0b32]
  - @vexcms/core@0.1.0-alpha.33
  - @vexcms/react@0.1.0-alpha.33

## 0.1.0-alpha.32

### Patch Changes

- 9959fc1: Bumped `patch` despite being breaking: the `alpha` pre-release track keeps every package on
  the `0.1.0` base so `changeset pre exit` lands on `0.1.0`. The breaking surface is itemized
  below and in the commit's `BREAKING CHANGE:` footer.

  Split `@vexcms/react`'s public surface in two: the root (`.`) holds everything a page touches, `@vexcms/react/admin` holds the framework adapter, field `Admin`/`Cell` components, slots, the document-edit runtime, admin layout/views, collection/media/global views, the list-view context, the live-preview panel, the modal surface, `useVexForm`, and the `data-table`/`dnd`/`sidebar`/`resizable` UI primitives. A server component importing the root no longer pulls any of that into the client graph. `useAppForm`/`AppForm` are removed from the root entirely — the app form's surface was always `@vexcms/react/form`, and the root must not reach `dnd` through `ArrayField`/`BlocksField`'s drag handles.

  **BREAKING CHANGE.** Update every import of a moved name from `@vexcms/react` to `@vexcms/react/admin`:

  | Old import (`@vexcms/react`)                                                                                                                                                             | New import            |
  | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
  | `reactAdapter`                                                                                                                                                                           | `@vexcms/react/admin` |
  | `*FieldAdmin`, `*FieldCell` (all field types)                                                                                                                                            | `@vexcms/react/admin` |
  | `SlotOutlet`, `SlotOverrideOutlet`, `type SlotOverrideProps`                                                                                                                             | `@vexcms/react/admin` |
  | `useVexForm`                                                                                                                                                                             | `@vexcms/react/admin` |
  | `VexDocumentProvider`, `useVexDocument`, `type VexDocumentState`                                                                                                                         | `@vexcms/react/admin` |
  | `SLOT_IDS`, `BUILTIN_CONTRIBUTION_IDS`                                                                                                                                                   | `@vexcms/react/admin` |
  | `DocumentEditSlotOutlet`, `DocumentEditRuntimeProvider`, `useDocumentEditRuntime`, `documentEditBuiltinContributions`, `useEditActionsMenuDialog`, `EditActionsMenuItem` (+ their types) | `@vexcms/react/admin` |
  | `type EditSlotProps`, `type EditSlotConfigInput`, `type ComponentContributionInput`, `type ComponentOverrideInput`, `type SlotId`, `type SlotAccessContext`, `type SlotAccessPredicate`  | `@vexcms/react/admin` |
  | `AdminLayout`, `AdminNotFound`, `AppSidebar`, `AdminTopNav`, `DashboardView`, `CollectionsIndexView`, `AdminCardSection`, `AdminIndexEmptyState` (+ their types)                         | `@vexcms/react/admin` |
  | `CollectionListView`, `CollectionEditView`, `MediaCollectionListView`, `MediaCollectionEditView`, `GlobalEditView`, `GlobalsListView`                                                    | `@vexcms/react/admin` |
  | `useListViewContext`, `ListViewContextProvider`, `type ListViewContextState`                                                                                                             | `@vexcms/react/admin` |
  | `ModalSurfaceProvider`, `useModalSurface`                                                                                                                                                | `@vexcms/react/admin` |
  | `LivePreviewPanel`, `resolveLivePreviewUrl`, `type LivePreviewFrameGeometry`, `useLivePreviewPanelMinSize`, `useLivePreviewPanelState`                                                   | `@vexcms/react/admin` |
  | `DataTable*` (all of `ui/data-table`), `Sidebar*`, `Resizable*`, dnd exports (`DndProvider`, `Droppable`, `Draggable`, `DragHandle`, `useAccordionDndState`)                             | `@vexcms/react/admin` |
  | `useAppForm`, `AppForm`                                                                                                                                                                  | `@vexcms/react/form`  |

  `ReactHKT` and `ReactAdapter` stay importable as types from both the root and `/admin` — they cost nothing and `RelationshipFieldInput`/`CollectionConfigInput`/etc. at the root reference `ReactHKT`.

  `@vexcms/react/admin` also exports two components the docs already described but no entry exposed. `VersionHistoryDropdown` (with `VersionHistoryPanelProps` and `VersionHistoryTarget`) renders a document's version list in a custom edit view, and `AdminFieldBinding` binds a custom field component inside a framework adapter.

  `@vexcms/next`'s `NextAdminLayoutClient` and `NextAdminPage` now import the ten moved view/layout components from `@vexcms/react/admin`; its own public API is unchanged.

- Updated dependencies [9959fc1]
- Updated dependencies [9959fc1]
- Updated dependencies [9959fc1]
  - @vexcms/core@0.1.0-alpha.32
  - @vexcms/react@0.1.0-alpha.32

## 0.1.0-alpha.31

### Patch Changes

- Updated dependencies [910f2e7]
- Updated dependencies [910f2e7]
- Updated dependencies [910f2e7]
  - @vexcms/react@0.1.0-alpha.31
  - @vexcms/core@0.1.0-alpha.31

## 0.1.0-alpha.30

### Patch Changes

- a4fea41: Intercepting routes no longer interfere with the admin:

  - **State behind the sign-in modal.** Opening "Sign in" from the admin top bar swaps the URL to the modal's route while the admin page stays mounted underneath. The page used to read the modal's URL: the list view dropped its filter, view and search and loaded the wrong rows, a top-level tabs field reset to its first tab, and the sidebar lost its active collection. They now keep their admin values. List URL writes are dropped while the modal is open, so Escape closing the modal no longer also closes the peek panel or writes onto the modal's URL. The `Cmd/Ctrl+B` sidebar shortcut stands down too.
  - **Unsaved-changes guard.** The guard no longer prompts when "Sign in" is clicked on a dirty edit view, since the form stays mounted underneath. Closing the modal (a back navigation) no longer reads as leaving the page.
  - **Sign-in return URL.** The return URL now carries the page's full query (filter, sort, search, view, tab, peek), not just `?view=`, so signing in lands on exactly the page and state you left.
  - **New optional framework capabilities.** `FrameworkComponents.useIsRouteCovered` and `FrameworkComponents.useSearchParams`, plus the `COVERING_ROUTE_LINK_ATTRIBUTE` export. `@vexcms/next` supplies `useNextIsRouteCovered` and `useNextSearchParams`.

- Updated dependencies [a4fea41]
- Updated dependencies [32277bf]
- Updated dependencies [898172f]
- Updated dependencies [a4fea41]
- Updated dependencies [898172f]
  - @vexcms/react@0.1.0-alpha.30
  - @vexcms/core@0.1.0-alpha.30

## 0.1.0-alpha.29

### Patch Changes

- b714992: Admin chrome fixes:

  - **Sign in return URL.** `AdminTopNav`'s "Sign in" return URL now keeps the active saved view (`?view=`), so signing in returns you to the same list tab.
  - **Sidebar trigger alignment.** The sidebar trigger icon now lines up with the content edge.
  - **Toolbar alignment.** `ListViewToolbar` hides its empty wrappers (`empty:hidden`), so the first control lines up with the page title.
  - **Internal references removed.** Comments and error text in `@vexcms/react` and `@vexcms/next` no longer cite internal spec/decision labels. For example, `NextAdminPage`'s missing-`authPromise` error no longer points to a spec file.

- Updated dependencies [b714992]
- Updated dependencies [b714992]
- Updated dependencies [b714992]
  - @vexcms/react@0.1.0-alpha.29
  - @vexcms/core@0.1.0-alpha.29

## 0.1.0-alpha.28

### Patch Changes

- 30b4c10: **Breaking: collection admin URLs moved to `/admin/collections/<slug>`.**
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

- b937b2b: The admin panel's per-browser UI preferences (table row density, a collection's filter-chip
  visibility, local saved views, last-seen row counts, the live-preview panel's open/closed
  state and split width, the sidebar's collapsed state) consolidate from up to seven
  separately-named cookies down to exactly two: `vex-admin` (shared, collection-agnostic) and
  `vex-admin:<collection>` (one per collection). Both are scoped to `Path=<basePath>` (the
  project's `VexClientConfig.basePath`, `/admin` by default) instead of the whole domain — a
  public page never sends either cookie.

  Retires `vex-list-density`, `vex-list-chips:<collection>`, `vex-list-views:<collection>`,
  `vex-list-rows:<collection>`, `vex-live-preview-panel:<slug>`, `vex-live-preview-layout:<slug>`
  (all previously at `path=/`), and the sidebar's own `sidebar_state`. `AdminLayout` clears every
  retired name, best-effort, the first time a returning browser's admin shell mounts — nothing
  to do on your end, and a visitor who never opens `/admin` keeps the old cookies around
  harmlessly until they do.

  Each project-scoped cookie stays well under the ~4KB browser cap: `localViews` entry names
  longer than 40 characters are truncated, `rowCounts` is dropped first if the cookie would
  still exceed the cap, then the oldest `localViews` entries one at a time — a dropped entry's
  full view still exists in `localStorage`, only its first-paint tab placeholder disappears.
  See the new `apps/docs/src/content/docs/guides/admin-cookies.mdx` guide for the full shape.

- b937b2b: `NextAdminPage`'s access gate now runs BEFORE anything streams, exactly like the existing
  token check: `canAccessAdminPanel` is awaited, and a denied caller is redirected — the route
  never streams any admin shell or content to them. The real shell streams exactly as it did
  before this change (real title/tabs/toolbar/controls/checkboxes for an allowed caller, only
  row data still resolves behind its own `<Suspense>` skeleton).

  An earlier version of this change gated the content area behind a generic
  `AdminContentSkeleton` instead of awaiting the check — reverted after a live review found it
  made the loading state worse (layout shift, row-selection spinners, phantom skeletons,
  pop-in). `AdminContentSkeleton` is deleted; there is no replacement component.

- b937b2b: New shared `AdminNotFound` state, styled like `ListEmptyState`: icon, title ("Collection not
  found" / "Global not found" / "Document not found"), a detail line, and a button back to the
  dashboard (a document's own not-found goes back to its collection's list instead) — server-
  rendered on first paint with zero layout shift, same frame size as settled content. Replaces
  every ad hoc not-found placeholder string previously shown for an unknown collection, global,
  or document.

  Exported from `@vexcms/react`'s main entry (not `@vexcms/react/server`): its back button
  uses `VexLink` for genuine in-app navigation, and `VexLink` depends on a `createContext`-
  backed hook that the server entry's tsup bundling can't isolate behind its own `"use client"`
  boundary (confirmed via `pnpm check:vercel` — a production build, unlike `next dev`, fails
  statically on this). Rendering it as a client component from `NextAdminPage` (a Server
  Component) costs nothing: React still renders a client component's own output into the
  initial server-rendered HTML, same as `AdminTopNav`/`CollectionListView`/every other view
  already does — only its interactivity hydrates afterward.

- b937b2b: New sign-in/out control in the admin top bar, enabled by anonymous admin access via
  `anonRole`: a visitor browsing the admin panel anonymously now has a visible way to sign
  in, and a signed-in user a visible way to sign out, right from `AdminTopNav`.

  `@vexcms/react`'s `FrameworkComponents` (`useFrameworkComponents`) gains an optional
  `auth` field — a `{ signInHref, signOut }` adapter. Omitted (the default), the control
  renders nothing, same as before this release. The signed-in/out determination itself
  comes from the existing `useVexAuth()` (`{ user, organization }`, server-resolved, no
  client-only flash) — `user === null` or `user.isAnonymous === true` (Better Auth's
  `anonymous()` plugin convention) both render "Sign in"; anything else renders "Sign out".

  Placement: the opposite edge of the bar from the sidebar-trigger/breadcrumbs/"View site"
  cluster, derived from the SAME `config.admin.sidebar.side` the cluster itself reads — a
  `"right"` sidebar puts the control at the far left, a `"left"`/default sidebar at the far
  right.

  `@vexcms/next` provides the Next.js adapter: `VexAdminAuthAdapterProvider`/
  `useVexAdminAuthAdapter` from the new `@vexcms/next/auth` subpath. A context, not a prop
  threaded through `NextAdminLayout`/your admin `layout.tsx`, because both of those are
  server components and the sign-in href builder/`signOut` function are app-specific client
  values that cannot cross that boundary as props — mount the provider anywhere above
  `NextAdminLayout` in your own client tree (e.g. alongside your Better Auth client
  provider) instead. See `VexAdminAuthAdapterContext`'s own doc comment for a full example.

  `apps/test`, `apps/www`, and the `create-vexcms` `base-nextjs` template (inherited
  unchanged by the `marketing-site` overlay) now wire this up in their own
  `BetterAuthClientProvider`, so every scaffolded project gets the control by default with
  no per-app configuration beyond the generated auth client itself.

- b937b2b: Bumped `patch` despite being breaking, per this track's own convention (see
  `config-client-server-split`'s changeset): the `alpha` pre-release keeps every package on the
  `0.1.0` base, and the breaking surface is itemized here and in the commit's `BREAKING CHANGE:`
  footer.

  Removed `admin.table`/`CollectionTableConfigInput`/`CollectionTableConfig` entirely.
  `admin.view` (the default view) and `admin.views` (preset views) now carry everything that
  used to live on `admin.table`, not just view identity: `name?`, `description?`, `where?`,
  `sort?`, `pageSize?`, `searchField?`, `columns?`, plus the collection-wide settings
  `searchFields?` (renamed, plural, from the old `admin.table.searchField` — it was colliding
  with this same shape's own per-view singular `searchField`), `pageSizeOptions?`,
  `countLimit?`, `serverPageSize?`, and `bulkActions?`. `admin.views[n]` accepts the identical
  shape — a preset view can override any collection-wide setting too, falling back to
  `admin.view`'s own resolved value, then the global default.

  **`@vexcms/core`.** `columns` entries are now `ColumnEntry<TFieldSlug> = TFieldSlug |
{ field, width?, pinned?, hidden?, enableSorting?, enableHiding? }` — order, visibility, pin
  side, width, and the sortable/hideable capability flags are all one array, one per-field
  entry; a view's own entry always wins over `field.admin.*`, which is only consulted when
  unset. `field.admin.width` is renamed `columnWidth` (the existing `width` key is the field's
  own CSS row-width in the edit form, an unrelated axis). The reserved id for the always-first
  selection-checkbox column is `"select"`; a versioned collection's synthetic `vex_status`
  status column is a full `ColumnEntry` participant (reorderable/hideable/pinnable/resizable),
  with an existing saved view's absence of `vex_status` back-filling as unpinned-but-visible,
  first position — not hidden, so no pre-existing view silently loses its status badge.
  `validateTableConfig.ts` is renamed `validateViewConfig.ts`; its checks now run per view
  (`admin.view` and every `admin.views[n]`), and a view's own `enableSorting: true` override
  still must lead a declared index, same as a field's.

  **`@vexcms/react`.** Every `visibleColumns`/`columnOrder`/`columnPinning` consumer collapses
  onto the one `columns: ColumnEntry[]` prop/state; `getCollectionColumnDefs` now resolves each
  field's `enableSorting`/`enableHiding` through `resolveColumnConfig` (the view's own entry can
  override a field's own default) instead of reading `field.admin.*` directly.

  **Migration:** every `admin.table.*` config key, column ordering/visibility/pinning state, and
  reader across core/react/next is moved — there is no shim or dual-read period.

- b937b2b: New `/admin/collections` route — a collections-only index page (`CollectionsIndexView`,
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

- b937b2b: Bumped `patch` despite being breaking, per this track's own `config-client-server-split`
  convention — see that changeset's note on the `alpha` pre-release base.

  The list URL's `cols=` parameter changes grammar from a plain comma-separated field-slug list
  (`cols=title,author,status`) to `cols=<field>[:w<width>][:pl|:pr][:h]`, comma-separated, one
  suffix combination per entry in a fixed order — carrying the full per-column state
  (width, pin side, hidden) that `ColumnEntry` now unifies, not just display order. A bare field
  slug with no suffixes still parses (a previously-shipped order-only `cols=` link keeps
  working), but `serializeListParams` never emits the old grammar again. Diff-only against the
  active view's own resolved array, always present for an active `local` view, unchanged.

  No back-compat shim for a stored view's own `columns` array: an old view's bare-slug-only
  array parses fine (every entry is a valid bare-slug `ColumnEntry`), it just has no width/pin
  overrides until resaved.

- b937b2b: The collection list view is rebuilt around a URL-driven, server-prerendered `CollectionListView`:
  per-collection search, sort, an AND/OR filter builder with per-field `FilterInput` components,
  column visibility/order/pinning/resizing, page size, density, local (`localStorage`) and shared
  (`vex_views` table, `listViews`/`saveView`/`removeView`) saved list views, a peek panel, per-row
  actions (`list.row.actions` slot) and inline bulk actions (`list.bulkActions` slot). Data loads
  through the new `useVexListQuery` / `useVexDocQuery` hooks, prefetched by `NextAdminPage` on the
  server. See the List views guide.

  **Structure + renames (no aliases).** Core `collections/` splits into `savedListViews/`,
  `listView/`, and `query/`; React `collections/listView/` gains `toolbar/`, `create/`,
  `savedListViews/`, `filters/`, `peek/`, `rowActions/` subfolders. Exported names follow:
  `composeViewWhere` → `composeSavedListViewWhere`, `parseListParams`/`serializeListParams` →
  `parseListViewUrlState`/`serializeListViewUrlState` (`ListParams` → `ListViewUrlState`),
  `resolveListQueryState` → `resolveListViewQueryState`, `resolveColumnConfig` →
  `resolveListViewColumnConfig`, `ListPreferences`/`parseListPreferences` →
  `ListViewConfigCookieValues`/`parseListViewConfigCookies`, `ListViewsIndexEntry` →
  `LocalSavedListViewsIndexEntry`, `BulkDeleteModal` → `DataTableBulkDeleteModal`,
  `CreateDocumentModal`/`CreateDocumentForm` → `ListViewCreateDocumentModal`/`ListViewCreateDocumentForm`,
  `ListViewTabs` → `SavedListViewTabs`, `ListFilterBuilder` → `ListViewFilterBuilder`, `ListPeek` →
  `ListViewPeek`. `VexConfigError` now lives in core's `errors.ts`; `DENSITY_ROW_CLASS` moves from
  `@vexcms/core` to `@vexcms/react`. `useListViewContext` (formerly internal `useCollectionList`) is
  now exported from `@vexcms/react` for custom list slot contributions.

  **Migration:** rename imports per the list above; there are no deprecated aliases.

- b937b2b: `NextAdminPage` takes `searchParams?: Promise<Record<string, string | string[] | undefined>>`
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

- 30b4c10: Unsaved-changes navigation guard. Both edit views now block navigating away from a dirty form
  — in-app links and back/forward prompt with a styled Stay/Leave dialog; `beforeunload`
  prompts with the browser's native dialog. A form is dirty when its values differ from their
  default (`!isDefaultValue`); `useAutosave`'s new `hasUnsavedChanges` result field drives this
  on an autosave-enabled document — true during the debounce window, while a save is in flight,
  or after a failed save, false once a successful save's reset settles the diff to empty —
  already-persisted autosaved work never prompts. The guard releases automatically after a
  successful save, delete, or duplicate navigation.

  New `useVexNavigate()` hook (`@vexcms/react`) is the supported path for a built-in's
  post-mutation redirect (after delete, after a duplicate's create resolves) — it consults the
  same blocking state and shows the same dialog as an in-app click or back/forward, falling back
  to `window.location.assign` when the adapter has no `useNavigate`.

  The interception itself is a framework-adapter capability (`NavigationBlockerAdapter`), not a
  `@vexcms/react` dependency on `next/navigation` — `@vexcms/next` is the only adapter that
  implements it today, intercepting same-origin anchor clicks in the capture phase and trapping
  back/forward via `popstate`; no `pushState`/`replaceState` patching.

- Updated dependencies [b937b2b]
- Updated dependencies [30b4c10]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [4d504e7]
- Updated dependencies [b937b2b]
- Updated dependencies [f837f20]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [30b4c10]
- Updated dependencies [30b4c10]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [30b4c10]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [30b4c10]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
  - @vexcms/core@0.1.0-alpha.28
  - @vexcms/react@0.1.0-alpha.28

## 0.1.0-alpha.27

### Patch Changes

- Updated dependencies [a4b9d68]
- Updated dependencies [6764c26]
  - @vexcms/core@0.1.0-alpha.27
  - @vexcms/react@0.1.0-alpha.27

## 0.1.0-alpha.26

### Patch Changes

- Updated dependencies [7d51f56]
  - @vexcms/core@0.1.0-alpha.26
  - @vexcms/react@0.1.0-alpha.26

## 0.1.0-alpha.25

### Patch Changes

- 9994049: **`@vexcms/core` no longer depends on React.** Its only peer dependency is now `convex`;
  `react`, `lucide-react`, `@tanstack/react-query`, `@tanstack/react-table`, and
  `@convex-dev/react-query` are gone, so `npm i @vexcms/core` stops pulling ~70 MB of React
  packages.

  **Breaking — client wrappers moved to `@vexcms/react/client`.** `get`, `find`, `search`,
  `create`, `update`, `remove`, `getGlobal`, `findGlobals`, `updateGlobal`, `saveDraft`,
  `publish`, `unpublish`, `listVersions`, `getVersionSnapshot`, `deleteVersion`,
  `findQueryKey`, their `*ClientArgs` types, and `VexQueryOptions` are no longer exported from
  `@vexcms/core/client` (removed). Change the import path:

  ```ts
  // before
  import { get, saveDraft } from "@vexcms/core/client";
  // after
  import { get, saveDraft } from "@vexcms/react/client";
  ```

  **Breaking — `LucideIconName` is now `IconName`.** Core no longer imports `lucide-react`; the
  icon-name set comes from `vex generate`, which now writes
  `IconName: keyof typeof import("lucide-react").icons` into `vex.types.ts`. Re-run
  `vex generate` (or `vex dev`) to keep icon autocomplete; before that, `IconName` is `string`.

  **Breaking — `CellComponentProps.row` is `CellRow<TData>` (`{ original: TData }`).** Built-in
  cells only read `row.original`, and React Table's `Row` still satisfies it. A custom cell that
  called React Table methods on `row` must type that prop itself.

- Updated dependencies [9994049]
  - @vexcms/core@0.1.0-alpha.25
  - @vexcms/react@0.1.0-alpha.25

## 0.1.0-alpha.24

### Patch Changes

- 865f360: **Versioning & drafts.** Opt in per collection or global with `versions: { drafts: true }`.
  A versioned document is one published row with a stable `_id` plus at most one draft row
  (`vex_publishedId`); every distinct content state is recorded once as an immutable snapshot in
  the new `vex_versions` table. See the new "Versioning & Drafts" guide.

  - **Schema.** `vex dev` / `vex generate` add `vex_status`, `vex_publishedAt`,
    `vex_publishedId`, the `by_status` / `by_published` indexes, and `vex_versions`. New
    `draftStatus` (`indexes[]`) and `indexDraftStatus` (field) options narrow an index on
    `vex_status` (`true` replaces it, `"both"` adds a twin) so status-filtered reads stay
    index-backed. Unique fields are enforced among published documents only.
  - **API.** `versionsApi({ config, query, mutation, getAuth })` from `@vexcms/core/server`
    registers `saveDraft`, `publish`, `unpublish`, `listVersions`, `getVersionSnapshot`, and
    `deleteVersion` (each takes `{ collection, id }` or `{ global }`), gated by the new
    `saveDraft` / `publish` / `unpublish` / `deleteVersions` permissions and `readDrafts` for
    reads. `saveDraft` is lenient (required fields enforced at publish) and accepts
    `restoredFrom` to save edits on top of an older snapshot; `publish` accepts `version` to
    publish a historical snapshot, marking that version row published instead of adding one.
    `get` / `find` / `search` (server and client) take `drafts: true` to read the draft overlay
    when the caller has `readDrafts`, and are published-only otherwise. Deleting a draft also
    deletes its published parent. `backfillStatus` stamps `vex_status` on rows created before a
    collection opted in. Mutation hooks see the new `"unpublish"` operation.
  - **Admin (`@vexcms/react`).** Edit views gain Save Draft / Publish / Unpublish via
    `DraftToolbar`, `useAutosave` (`versions.autosave`), and `VersionHistoryDropdown`: view any
    version without saving (`viewingVersion` / `onViewVersion`), unsaved-changes confirmation,
    an **Active** tag on the published version and live draft, delete per row, and the menu
    scrolls to the version on screen. Publish is disabled when the form already matches the
    published document.
  - **`@vexcms/next`.** `NextAdminPage` preloads edit and list views with the same `drafts`
    args as the client queries; the revalidate route maps `unpublish` to an update.
  - **`@vexcms/cli`.** `vex dev` no longer runs the automatic version-status backfill; call
    `backfillStatus` from an internal mutation instead.

- Updated dependencies [865f360]
- Updated dependencies [ff79cc3]
- Updated dependencies [372e801]
- Updated dependencies [865f360]
  - @vexcms/core@0.1.0-alpha.24
  - @vexcms/react@0.1.0-alpha.24

## 0.1.0-alpha.23

### Patch Changes

- 649cafa: Live preview reaches globals, resolves URLs on the server, and hands config callbacks a
  typed `vex` api. Several pieces of this were unreachable before: a global's unsaved values
  never applied at all, and a server-resolved preview URL loaded an ordinary page.

  **Globals are previewable.** `LivePreviewProvider` matched an incoming `collectionSlug`
  against `collections` only and returned early on a miss, so every global update was dropped
  before validation. It now falls through to `globals` and validates with
  `getGlobalInputSchema(...).partial()`. The overlay map is keyed by preview key — `_id` for a
  collection document, the slug for a global, matching what `GlobalEditView` sends — and
  `useLivePreview`/`useLivePreviewDocumentQuery` accept a `VexResourceSlug`, so a global slug
  is no longer a compile error.

  **`LivePreviewProvider` takes no props.** It reads `collections`, `globals`, and
  `admin.livePreview.allowedOrigins` from `VexConfigContext`. Mount `VexConfigProvider` once
  at the app root — it now serves the admin panel and the public site — and render
  `<LivePreviewProvider>` directly.

  **Server-resolved preview URLs carry the preview params.** `appendLivePreviewParams` moved
  into `@vexcms/core` and `NextAdminPage` applies it to what `livePreviewUrl` returns;
  previously the iframe was handed a plain public URL and silently listened to nothing.
  `useLivePreviewServerUrl` holds the last resolved URL while a later edit's query is in
  flight (`keepPreviousData`) instead of reverting to the server-rendered one, which was
  changing the iframe `src` and reloading the preview between edits.

  **Root `admin.livePreview.collections`/`.globals` maps.** Preview settings may be declared
  centrally or on the collection/global, resolved by one precedence function. `url` accepts a
  `{ server }` resolver that reads the database, invoked with `ctx` and a read-only `vex` api.

  **`VexCallbackApi`.** Config callbacks receive `vex` — `find`, `get`, `search`, and
  `globals.get`/`globals.find` — bound to the caller's `ctx` and config, access-bypassed by
  default so a uniqueness check cannot miss rows the caller may not read.

  **Typed `ctx` without type parameters.** `vex generate` emits the project's `DataModel` into
  the `GeneratedVexTypes` augmentation, so `VexQueryCtx`/`VexMutationCtx` name the project's
  own context and every `TCtx`/`TDataModel` parameter on config callbacks is gone. A project
  that generated types before this must run `vex generate` once, or `ctx` stays
  `GenericDataModel`.

  **`validate()` throws.** A field validator raises a `ConvexError` instead of returning a
  string; `validateFields` normalizes every failure to one error shape. Field generics are
  slug-first (`VexResourceSlug`, `DocumentByResourceSlug`).

  **Removed:** the floating `LivePreviewIndicator`. The previewed page renders no chrome of
  its own — the admin panel frames the preview and owns its controls.

- Updated dependencies [649cafa]
  - @vexcms/core@0.1.0-alpha.23
  - @vexcms/react@0.1.0-alpha.23

## 0.1.0-alpha.22

### Patch Changes

- Updated dependencies [6e52134]
- Updated dependencies [09d733d]
  - @vexcms/react@0.1.0-alpha.22
  - @vexcms/core@0.1.0-alpha.22

## 0.1.0-alpha.21

### Patch Changes

- b5263dc: Add live preview (ADR-012) — the editor's unsaved values streamed into the document's own
  public page.

  **`@vexcms/core`.** New `livePreview` module. A collection or global declares
  `admin.livePreview.url`, a resolver from the document to the public URL its preview should
  render, typed to that slug's exact generated document interface (`AdminCollectionConfig`
  and `GlobalAdminConfig` gain a trailing `TCollectionSlug`/`TGlobalSlug` generic, inferred
  from the sibling `slug`; a new `DocumentByGlobalSlug` mirrors `DocumentByCollectionSlug`).
  `admin.livePreview` also accepts `debounceMs`, `defaultOpen` and per-collection
  `breakpoints`. Root config gains `livePreview.allowedOrigins` (the `postMessage` origin
  allowlist — empty by default, so the transport accepts nothing until configured) and
  `livePreview.breakpoints`, defaulting to `DEFAULT_LIVE_PREVIEW_BREAKPOINTS`. Protocol
  constants (`LIVE_PREVIEW_QUERY_PARAM`, `LIVE_PREVIEW_COOKIE`, the temp-id params, the
  panel/layout cookie names) are exported so the name can never drift between the middleware
  that sets it and the client that reads it, alongside pure helpers
  (`readLivePreviewPanelCookie`, `readLivePreviewLayoutCookie`,
  `resolveLivePreviewPanelMinSize`).

  **`@vexcms/react`.** `<LivePreviewProvider>` keeps an `id → unsaved values` map fed by two
  transports at once: `postMessage` to a held window reference, and a shared
  `BroadcastChannel` for surfaces no reference exists for (a duplicated tab, a link-opened
  tab, a second monitor). Every payload is validated against the target collection's Zod
  schema, and only the keys the sender actually sent are overlaid — `.partial()` still
  applies field defaults, which would otherwise blank untouched fields. Consumers read it
  through `useLivePreview(doc, slug)` or the `useLivePreviewQuery` sugar, which narrows a
  `getBySlug`-style array to the single overlaid document. The admin side ships
  `LivePreviewPanel` (resizable split pane, full-screen overlay on mobile, breakpoint buttons
  that scale the frame without distorting it) wired into `CollectionEditView` and
  `GlobalEditView`, `useLivePreviewSync` (debounced full-snapshot posts plus an immediate
  reply to a newly-mounted surface's handshake), and a floating `LivePreviewIndicator` that
  marks a page opened in its own tab as a preview.

  The admin shell now owns its own scrollbar (`main` is the single scroll container) rather
  than scrolling the window, which removes the layout shift when the preview toggles;
  `.vex-scroll-area` styles those scrollers with a transparent track and a permanently
  visible thumb. New shadcn `ui/resizable` primitive, wrapping `react-resizable-panels`.

  **`@vexcms/next`.** `NextAdminPage` reads the per-slug panel open/closed and split-position
  cookies server-side and threads them into the edit views, so a remembered layout renders on
  the first paint instead of snapping into place after hydration.

  **`create-vexcms`.** The `marketing-site` template mirrors `apps/www`'s wiring: a
  `SiteLivePreviewProvider` client component that owns the config import, `proxy.ts` granting
  preview mode only after verifying an admin session, `admin.livePreview.url` on `pages`, and
  `PageContent` reading through `useLivePreviewQuery`.

  Preview mode is gated, not ambient: the panel appends `?vexLivePreview=1`, and the listener
  attaches only when the project's own middleware has also verified an admin session and set
  the `vex-live-preview` marker cookie. The public route fails open — a stale session renders
  the normal published page rather than redirecting.

- Updated dependencies [b5263dc]
- Updated dependencies [70d17e3]
  - @vexcms/core@0.1.0-alpha.21
  - @vexcms/react@0.1.0-alpha.21

## 0.1.0-alpha.20

### Patch Changes

- 9e5cd80: Add lifecycle hooks and server-side field validation (ADR-010, ADR-011).

  **`@vexcms/core`.** Collections gain `beforeChange`/`beforeDelete` (run inline in the write
  path, may reject a write by throwing) and `afterChange`/`afterDelete` (run via
  `convex-helpers` triggers, after the write commits). Author them inline in
  `defineCollection({ hooks: {...} })` or via the new `beforeChangeHook`/`beforeDeleteHook`/
  `afterChangeHook`/`afterDeleteHook` factories (`packages/core/src/collections/hooks.ts`),
  which type `doc`/`ctx`/`collection` against the real `DataModel` and collection config
  without a cast. `after*` hooks require wrapping the app's Convex `mutation`/`internalMutation`
  builders with the new `createVexMutations` (`@vexcms/core/server`) — they never fire for a
  write through the raw `_generated/server` builder, the dashboard, or `npx convex import`.
  Shared hook plumbing (`BaseHookProps`) moves to a new `hooks/` package folder so upcoming
  global and media-collection hooks can share it.

  Fields gain an async, server-only `validate()` — run after the generated Zod schema passes,
  with `ctx` for a uniqueness check via `ctx.db.query(...).withIndex(...)` inside the mutation's
  transaction. Each field type's own `validator.ts` exports a typed wrapper (`textValidator`,
  `numberValidator`, `arrayValidator`, etc., built on the shared `fieldValidator` factory) so
  `value`, `doc`, and `field` are typed against the real collection/`DataModel`/field config
  instead of `unknown`.

  **Fix:** `min`/`max` on `array`/`blocks`/`upload`/`relationship` (new on the latter) previously
  either ignored `required` entirely or coupled to it incorrectly — an optional field's own
  empty/default value could fail its own `min`, or a required field's custom `min`/`max` message
  could be unreachable when its threshold matched the required floor. `min`/`max` now runs
  whenever a value is supplied; only an empty array on an _optional_ field skips the check.

  **`@vexcms/react`.** `useVexMutation`'s `onError` now surfaces a toast (via `sonner`) for any
  rejected write, including the new validation `ConvexError`s — `getVexErrorMessage` extracts
  the most specific available message. `AdminLayout` mounts the shared `<Toaster>`, which
  detects an ancestor `<Toaster>` (rendered by the host app) and skips mounting a duplicate.
  `CreateDocumentModal` now renders only a collection's required fields (a quick create);
  `RenderFieldInputComponents` gained a `fieldKeys` filter to support it.

  **`create-vexcms`.** The `base-nextjs` template's `convex/vex.ts`/`vex/globals.ts`/
  `vex/media.ts` now wrap their mutation builders with `createVexMutations`, so a freshly
  scaffolded project gets `afterChange`/`afterDelete` by default instead of needing to
  discover the wrapper by hand. The `marketing-site` overlay's `pages.ts` also gets a
  `textValidator` uniqueness check on `slug`, matching `apps/www`'s.

- Updated dependencies [9e5cd80]
  - @vexcms/core@0.1.0-alpha.20
  - @vexcms/react@0.1.0-alpha.20

## 0.1.0-alpha.19

### Patch Changes

- Updated dependencies [54636f9]
  - @vexcms/core@0.1.0-alpha.19
  - @vexcms/react@0.1.0-alpha.19

## 0.1.0-alpha.18

### Patch Changes

- ed502a9: Bumped `patch` despite being breaking: the `alpha` pre-release track keeps every package on
  the `0.1.0` base so `changeset pre exit` lands on `0.1.0`. The breaking surface is itemized
  below and in the commit's `BREAKING CHANGE:` footer.

  Split the config in two: `vex.config.ts` is client-safe and imported directly by the browser, `vex.config.server.ts` layers on the auth adapter and storage adapters.

  `sanitizeConfigForClient` nulled every function it sent across the RSC boundary and dropped `access` entirely, so field `validate`, `condition`, and custom `components` were always `null` on the client and three providers existed only to smuggle live values around that hole. The boundary is gone rather than worked around.

  **`@vexcms/core`.** `defineConfig(input): VexClientConfig` now resolves the client half; the new `defineServerConfig({ config, server })` layers on `server.auth.adapter` and `server.storage.adapters` and returns `VexConfig`, which still spreads every client field so existing `config.collections` readers compile unchanged. `sanitizeConfigForClient`, `stripNonSerializable`, and `ClientVexConfig` are deleted. `VexConfigInput` is replaced by `VexClientConfigInput` / `VexServerConfigInput`. `schema` and `types` live on the client config — they are inert path strings, and `vex.config.ts` is the one file a developer edits for settings.

  **`@vexcms/react`.** `VexAccessProvider` and `StorageAdapterContextProvider` are removed; one `VexConfigProvider` replaces all three contexts, with `useVexAccess()` and `useStorageAdapterMap()` kept as derived reads of `useVexConfig()`. `useVexConfig()` now throws outside the provider instead of returning an empty config. Every config-shaped prop crossing the server→client boundary is deleted: `AdminLayout`, `AppSidebar`, `AdminTopNav`, `DashboardView`, and `GlobalsListView` read the config from context, and the view/modal `collection` / `global` props now take a slug the component resolves from context rather than a full config object.

  **`@vexcms/next`.** `NextAdminLayout` and `NextAdminLayoutClient` no longer take `config`; the admin panel's client tree gets it from the app's own `VexConfigProvider` mount. `NextAdminPage` keeps `config` — it is a server component handing data to another server function.

  **`@vexcms/better-auth`.** New client-safe `./client` entry exporting `betterAuthCollections(schema)`, which builds the admin panel's auth collections from a declarative plugin-descriptor map without instantiating a single Better Auth plugin (~1 KB in the browser instead of ~154 KB gzipped). `betterAuthAdapter` stays server-only and becomes the verifier: `defineServerConfig` compares its collections against the client config's declaration and throws `VexAuthConfigError` naming the divergence.

  **`@vexcms/file-storage-convex`.** New `./client` entry exporting `defineMediaCollection` and `uploadFile`, so declaring a media collection no longer drags the Convex server SDK into the browser graph. Media collections move onto the client config's `mediaCollections`, and `convexFileStorage()` no longer accepts a collection list.

  **`@vexcms/cli`.** `vex dev` / `vex generate` / `vex deploy` resolve `vex.config.server.*` before falling back to `vex.config.*`, and fail with a clear message when only a client config exists.

- Updated dependencies [ed502a9]
  - @vexcms/core@0.1.0-alpha.18
  - @vexcms/react@0.1.0-alpha.18

## 0.1.0-alpha.17

### Patch Changes

- Updated dependencies [d7384b6]
- Updated dependencies [d7384b6]
  - @vexcms/react@0.1.0-alpha.17
  - @vexcms/core@0.1.0-alpha.17

## 0.1.0-alpha.16

### Patch Changes

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.16
  - @vexcms/react@0.1.0-alpha.16

## 0.1.0-alpha.15

### Patch Changes

- A permission check's filter callback may now return a **field map** instead of a
  boolean — `update: () => ({ "*": false, adminTheme: true })` — whether written
  bare on the action or as the `filter` beside a `constraints` descriptor. Nothing
  new may be written directly ON an action, which is what keeps a document free to
  own fields named `constraints` or `filter`: a returned object is always a map, so
  there is nothing to disambiguate. A map may carry a `"*"` wildcard or be partial;
  an omitted key resolves to denied.

  **`hasPermission` stays the single gate and still returns `boolean`.** It folds a
  resolved map by what the caller says about the operation: with `changes`, every
  CHANGED key must be permitted — a field resent unchanged is not a write to it,
  which is what lets a full-form submit succeed while still rejecting a real edit
  to a denied field; with only `data` the map projects rather than denies, so a
  read is shaped instead of refused; with neither, the existing `scope` decides. A
  role with no field map anywhere takes the same paths as before, so existing call
  sites are unaffected.

  **New in `@vexcms/core`:** `resolveFieldPermissions` answers the read-only
  "which fields may this caller touch?" question and shares `hasPermission`'s role
  walk, so the two cannot drift. `isFieldAllowed` and `stripDeniedFields` shape a
  response; `VexAccessError` gained an optional `field`. `ValidateFieldMaps` type-
  checks every map against the subject's own document at the `defineAccess` call
  site with no `satisfies`, return annotation, or wrapper — a misspelling reports
  `✖ field map returns a field not on this resource: "admnTheme"` at the exact
  property. System keys (`_id`, `_creationTime`, `_slug`) are never gateable and
  never stripped.

  **Enforcement is server-side.** `create`, `update`, `upsertGlobal` and
  `createMediaDocument` authorize the payload; `find`, `get`, `search`,
  `globals/get` and `globals/find` strip denied keys from every returned document.
  As with `hasPermission` today, this is enforced in the generated Convex
  functions and the admin-panel bundle — a hand-rolled function calling `ctx.db`
  directly bypasses it the same way it already bypasses `hasPermission`.

  **New in `@vexcms/react`:** `useFieldPermissions` and `useVisibleFields` gate the
  admin panel client-side (advisory; the server remains the enforcement point).
  Read-denied fields are HIDDEN in every edit view and kept out of the form's
  default values and validation schema, so they cannot be seen or submitted and a
  required one cannot block Save; update-denied fields stay visible and read-only.
  List views filter their columns the same way. The three edit views now submit
  only the fields the user actually changed, and `useLiveFieldMerge` keeps
  untouched fields in sync with the live document — together these stop two
  editors on one document from reverting each other's untouched fields.

  BREAKING CHANGE: `upsertGlobal` now authorizes `create`/`update` instead of
  `read`. A global is a singleton, so the verb depends on existence: the first save
  authorizes as `create`, every later one as `update`. A role that relied on a
  global's `read` grant to WRITE it must now be given `create` and/or `update`
  explicitly — previously `siteSettings.read: true` was enough to overwrite the
  entire global. `upsertGlobal` also merges its payload into the stored `data` blob
  rather than replacing it, so a caller that depended on replacement to CLEAR
  omitted fields must now send those fields explicitly.

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.15
  - @vexcms/react@0.1.0-alpha.15

## 0.1.0-alpha.14

### Minor Changes

- Field-schema and admin-UI hardening, an exported React test kit, and two breaking default-behavior corrections.

  **Breaking — `defineCollection`'s derived labels.** `labels.singular` now singularizes the
  `slug` before title-casing it, and `labels.plural` is the title-cased slug itself rather than
  that value run through `plural()` a second time. Every consumer that omits `labels` gets
  different default admin text: for slug `"posts"`, `singular` was `"Posts"` and is now `"Post"`
  (the "Create Posts" button becomes "Create Post"), and `plural` was `"Postses"` and is now
  `"Posts"`. The same double-pluralization hit every irregular-suffix slug — `categories` was
  `"Categorieses"`, `boxes` was `"Boxeses"`, `media` was `"Medias"`. To pin the old output, set
  `labels` explicitly:

  ```ts
  defineCollection({
    slug: "posts",
    labels: { singular: "Posts", plural: "Postses" },
    fields: {/* ... */},
  });
  ```

  `plural()` in `utils.ts` is unchanged and remains public API — it was always correct; the bug
  was the call site handing it an already-plural slug.

  **Breaking — dead pagination exports removed from `@vexcms/react`.** `usePagination`,
  `UsePaginationProps`, `UsePaginationReturn`, `DataTablePagination` and
  `DataTablePaginationProps` are gone. They had zero consumers: both list views paginate with
  `usePaginatedQuery` + `onLoadMore`, and no view ever rendered page-number pagination. Use
  `usePaginatedQuery` for cursor pagination.

  **Required-field validation now composes instead of overwriting.** Every
  `packages/core/src/fields/*/inputSchema.ts` layers `min`/`max` onto the required branch rather
  than reassigning over it, so a required field with `min`/`max` configured keeps every check
  instead of silently losing its "required" message — across `text`, `number`, `checkbox`,
  `select`, `date`, `array`, `blocks`, `relationship`, `upload`, `url`, `group` and `color`.
  `url` checks emptiness before URL format, so an empty required field reports "This field is
  required." instead of "Invalid URL". `date`'s schema and UI both honor `min`/`max`.

  **Field-input accessibility.** `date`, `select`, `checkbox`, `upload` and `relationship`
  triggers carry a real `id`/`aria-labelledby`. `array`, `group` and `blocks` — which have no
  single control a `<label for>` can point at — use `role="group"` with `aria-labelledby` on a
  label span instead of a dangling label, keeping `FormLabel`'s visual output.

  **List-view cells.** Every cell type now renders an em-dash placeholder for a `null`/
  `undefined` value instead of crashing (`text` and `array` threw a `TypeError` on `.length`,
  taking down the whole table render) or rendering empty markup. A `date` cell set to epoch `0`
  renders 1970-01-01 rather than treating a real timestamp as an absent value. All 12 types honor
  `isTitleField` by wrapping their content in an edit link, so a `date` or `select` title column
  is finally clickable; `relationship` and `upload` wrap every return path, loading states
  included. Long values truncate at 77 characters with the full value on `title` — `relationship`,
  `select`, `array`, `blocks`, `upload` and `group` previously left user-controlled text
  unreachable by tooltip. `array`'s `title` now carries its items instead of static field-config
  text, and `group` renders a serialized key preview instead of a fixed `{ N keys }` summary.

  **Selection and pagination hooks.** `useTableSelection`'s `"all"` mode treats `selectedIds` as
  an exclusion set, so "select all, then untick one" genuinely deselects that row in both
  `isRowSelected` and `getSelectionCount` instead of silently reporting it as selected — which
  would have deleted an excluded row once bulk-delete is restored. `toggleRow`'s
  `onSelectionChange` reports the post-change `mode` rather than a stale closure value.
  `usePaginatedQuery.loadMore()` reveals one page per call instead of fetching page N and only
  exposing it on the following call, and `isDone` is derived from the query's own
  `isLoading`/`isError` so a pending first page or a rejected query is no longer indistinguishable
  from a complete empty collection.

  **Modals.** `Modal` (`BaseModal`) gains a `dismissible` prop that cancels Base UI's own close
  handling, so Escape, backdrop clicks and every `DialogClose` are gated centrally rather than
  per trigger. `CreateDocumentModal` uses it plus a synchronous in-flight guard set before
  TanStack Form's async validation: a rapid double-click now creates one document instead of two,
  and pressing Escape mid-submit no longer closes the dialog while the write still lands.

  **Views and media.** `MediaCollectionEditView`'s Save/Cancel read `disabled={!canEdit ||
isDefaultValue}`, matching `CollectionEditView`. `MediaCollectionListView` resolves a
  create-action permission and wires it to the Upload button, matching `CollectionListView`'s
  "+ New". `MediaUploadDropzone` filters dropped files against a safe-media MIME allowlist —
  previously it accepted any type, including executables — and keeps the first file of a
  multi-file drop instead of rejecting the whole batch. `FilePreview` falls back to the filename
  when `alt` is empty; the previous `??` never fired, because `alt` is a required `string` that
  is `""` when unset, so every image without alt text rendered `alt=""`.

  **Robustness fixes surfaced while hardening the suite.** `ThemeProvider` reads and writes
  `localStorage` through guarded helpers: the unguarded access threw and unmounted the whole admin
  shell wherever Web Storage is unavailable — Safari private mode, "block all cookies", or a
  server/worker context. `upload`'s cell calls `useQuery` unconditionally with the `skip` sentinel
  instead of after an early return, and `MediaUploadForm` owns its accordion state in a real
  component instead of inside a render prop; both previously violated the Rules of Hooks and made
  React abandon concurrent rendering. `FormArray` and `FormBlocks` pass `isDragDisabled` when
  read-only, so a read-only list no longer registers drag handles it does not render.

  **New: an exported test kit.** `@vexcms/react/testing` (re-exported wholesale as the new
  `@vexcms/next/testing` subpath) ships `runVexReactSuite` — one call that runs the whole admin
  contract against a consumer's own build — plus the factories behind it:
  `runFieldInputContractSuite`, `runFieldCellContractSuite`, `runColumnDefSuite`,
  `runNestedFieldContainerSuite`, `runShellSuite`, `runViewSuite`, `runDataTableSuite`,
  `runModalSuite`, `runMediaSuite`, `runHooksSuite`, `runRbacStateSuite`, the `fieldFixtures`
  registry, `expectNoA11yViolations`, `renderWithVexProviders` and `installDomPolyfills`. A
  `sections` option selects categories (`fields`, `cells`, `columnDefs`, `views`, `shell`,
  `dataTable`, `modals`, `hooks`, `media`), `custom` drives project-authored field fixtures
  through the same contract, and `access` threads a real `VexAccessConfig` so RBAC-gated paths
  render under the consumer's own matrix.

### Patch Changes

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.14
  - @vexcms/react@0.1.0-alpha.14

## 0.1.0-alpha.13

### Minor Changes

- Public pages can now be prerendered and cached, and an admin-panel write purges
  the paths it invalidated.

  **Why they could not be cached before.** A `cookies()` read reached every route
  through the root layout's `AuthServerProvider`, and `fetchQuery`
  (`convex/nextjs`) hard-codes `cache: "no-store"`. Either alone forces a route
  dynamic. `AuthServerProvider` now mounts in `app/(vexcms)/admin/layout.tsx`,
  where a cookie read belongs, and server reads go through a new cached client.

  **`@vexcms/next` gains two entry points.** `@vexcms/next/cache` exports
  `createVexServerClient` — a server-only Convex read client that never sets
  `no-store` and dedupes per request via `React.cache`, so a page and its
  `generateMetadata` share one round trip — and `createVexRevalidateRoute`, a
  session-authorized `POST` handler that purges affected paths. `@vexcms/next/seo`
  exports `vexStaticParams`, `createVexSitemap`, `createVexRobots`, and
  `vexMetadata`; each tolerates an unreachable deployment so a build with
  placeholder env still succeeds.

  **`@vexcms/core` gains route mapping and revalidation vocabulary.** `routes.map`
  in `vex.config.ts` answers "which public paths render this document?".
  `resolveTargets` invokes it once per document _state_, so renaming a slug purges
  both the old and the new path. The wire contract
  (`VexRevalidateChange`, `VexRevalidateRequest`/`Response`,
  `VEX_REVALIDATE_BATCH_SIZE`) lives here because `@vexcms/react` builds it and
  `@vexcms/next` parses it, and neither depends on the other. Also new:
  `publishedSlugs`, a bypass-access slug reader for sitemaps and
  `generateStaticParams`.

  **`@vexcms/react` gains the write-side purge.** `useVexMutation` wraps a Convex
  mutation and fires a purge after it succeeds — fire-and-forget, because a failed
  purge is a stale page but a failed save is lost work. `useVexRevalidate` and
  `RevalidateButton` add a user-initiated purge (mounted in `CollectionEditView`
  and `CollectionListView`) whose failures surface, covering what a client-driven
  purge cannot reach: Convex dashboard edits, `npx convex import`, or a tab closed
  mid-request.

  **Automatic `updatedAt`.** `defineCollection` now injects an optional
  `updatedAt` number field on every content collection, and `create`/`update`
  stamp it. Auth-adapter-owned collections (`meta.protected`) and collections
  opting out with `{ timestamps: false }` never receive it, and a field the auth
  adapter declares itself (`meta.locked`) is never overwritten.

  **`create-vexcms`** templates carry all of the above, and
  `base-nextjs/package.json` gained the `pnpm.overrides` +
  `peerDependencyRules` block the monorepo already used — without it a fresh
  scaffold's `pnpm install` failed outright once `@better-auth/passkey` published
  a minor whose peer range excluded the pinned `better-auth`.

  BREAKING CHANGE: `defineCollection` injects an `updatedAt` field into every
  content collection, so `convex/vex.schema.ts` and `src/vex.types.ts` must be
  regenerated and the schema pushed — run `vex dev` (or `vex dev --once`) before
  the next write, or Convex rejects the stamped column. A collection that already
  declares its own field named `updatedAt` is now a compile-time and runtime
  error: rename it, or opt the collection out with `{ timestamps: false }`. The
  ISR window is not configurable through `vex.config.ts`; Next reads
  `export const revalidate` by static analysis before any module executes, so it
  must be an inline literal in each route file.

### Patch Changes

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.13
  - @vexcms/react@0.1.0-alpha.13

## 0.1.0-alpha.12

### Patch Changes

- 454e7a8: Deny caller-scoped rules in query-shaping, not just per-document, when the
  caller has no user; tie Better Auth's anonymous plugin to `anonRole` by role
  string instead of by accident; and clean up the docs.

  **`resolveAccessRule`'s query-shaping pass now shares `hasPermission`'s
  sentinel guard.** `anon-constraint-fail-closed` (an earlier changeset) fixed
  `hasPermission`'s per-document pass so a caller-scoped rule reached through
  `anonRole` denies, rather than crashing or silently widening, when there is no
  user to scope to. `resolveAccessIndex`/`resolveAccessConstraint` — the sibling
  pass that decides which `withIndex`/`.filter()` a query gets — still defaulted
  to a plain `{}`, so a rule like `base-nextjs`'s own
  `fq.eq("email", user.email)` compiled `eq("email", undefined)` for a
  sessionless caller. Convex reads `undefined` as "field is absent," so `find`
  and `search` read a widened range before the per-document check (correctly)
  threw the rows away — safe, but reading more than the rule permits. The
  sentinel-`Proxy` technique is now extracted into a shared
  `createUserReadSentinel` (`@vexcms/core/access/userReadSentinel`) used by
  both passes, so they can no longer disagree about which rows a rule
  describes. Two new tests in `resolveAccessRule.test.ts` pin the query-shaping
  side the way the original three pin the per-document side.

  **That guard was previously unreachable from every real server call.**
  `create`, `get`, `update`, `remove`, both `globals` write paths, both `media`
  API files, and `find`/`search`'s own per-document filters all normalized
  `user: args.auth?.user ?? {}` before calling `hasPermission` — collapsing a
  sessionless caller's `null` to `{}` upstream defeats a `null`-keyed sentinel
  before it ever runs. All 19 call sites across `@vexcms/core`'s API layer now
  pass `?? null` through, matching what `find`/`search` already did for their
  index-resolution calls, so the sentinel actually protects every write and
  per-document read path, not only `find`'s indexed query.

  **`@vexcms/better-auth` gains `anonRoleDatabaseHook(role)`.** Better Auth's
  `additionalFields` default-fills `roles` on every new user regardless of
  `isAnonymous`, so an anonymous-plugin visitor silently lands in whatever role
  every other new signup gets — `anonRole` never actually applies to it, only
  to a caller with no session at all. The new hook is a
  `databaseHooks.user.create.before` that stamps the SAME role string passed to
  `defineAccess({ anonRole })` onto anonymous-plugin users specifically,
  keeping the two in lockstep by construction instead of by coincidence. Wired
  into `apps/www` and the `base-nextjs` template's `auth/options.ts`, both
  still assigning anonymous visitors the existing `"user"` role — no
  permission-matrix change, just an explicit, inspectable stamp instead of an
  implicit shared default.

  **Docs.** Stopped documenting patterns versioning & drafts will supersede and
  API that does not exist: example collections no longer hand-roll
  `status`/`publishedAt` fields; three published READMEs (`@vexcms/next`,
  `@vexcms/react`, `@vexcms/richtext-plate`) now use their real package names
  instead of pre-rename ones; unshipped feature sections (versioning & drafts,
  live preview, impersonation) are now roadmap notes; documented exports that
  were never exported are removed from every table and example; `@vexcms/core`'s
  field-type table lists the 12 shipped types instead of a mix of 13 wrong ones.
  `GlobalEditView`'s heading now renders the global's label in `text-primary`,
  matching how the rest of the admin panel distinguishes a document's identity
  from its chrome.

- Updated dependencies [454e7a8]
  - @vexcms/core@0.1.0-alpha.12
  - @vexcms/react@0.1.0-alpha.12

## 0.1.0-alpha.11

### Patch Changes

- Updated dependencies
  - @vexcms/react@0.1.0-alpha.11
  - @vexcms/core@0.1.0-alpha.11

## 0.1.0-alpha.10

### Patch Changes

- Updated dependencies
  - @vexcms/react@0.1.0-alpha.10
  - @vexcms/core@0.1.0-alpha.10

## 0.1.0-alpha.9

### Patch Changes

- @vexcms/core@0.1.0-alpha.9
- @vexcms/react@0.1.0-alpha.9

## 0.1.0-alpha.8

### Patch Changes

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.8
  - @vexcms/react@0.1.0-alpha.8

## 0.1.0-alpha.7

### Patch Changes

- Updated dependencies [84f09e4]
- Updated dependencies [84f09e4]
- Updated dependencies [84f09e4]
  - @vexcms/core@0.1.0-alpha.7
  - @vexcms/react@0.1.0-alpha.7

## 0.1.0-alpha.6

### Patch Changes

- Updated dependencies
  - @vexcms/react@0.1.0-alpha.6
  - @vexcms/core@0.1.0-alpha.6

## 0.1.0-alpha.5

### Patch Changes

- Updated dependencies
  - @vexcms/react@0.1.0-alpha.5
  - @vexcms/core@0.1.0-alpha.5

## 0.1.0-alpha.4

### Patch Changes

- Updated dependencies [b111985]
  - @vexcms/core@0.1.0-alpha.4
  - @vexcms/react@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- @vexcms/react@0.1.0-alpha.3
- @vexcms/core@0.1.0-alpha.3

## 0.1.0-alpha.2

### Minor Changes

- 24a3058: Add the globals system (spec 35): singleton documents with a flat, typed API.

  - `@vexcms/core`: `defineGlobal` with CollectionConfig-parallel generics and compile-time reserved-key enforcement; shared `vex_globals` table emitted by `generateVexSchema`; `globalsApi` factory registering `globals.get`/`globals.find`/`globals.update` (upsert) with populate/depth; `vex generate` emits `GlobalSlug`, `GlobalDocumentBySlug`, `GlobalsFieldTypeMap`, and flat per-global interfaces into the `GeneratedVexTypes` augmentation.
  - `@vexcms/react`: `GlobalsListView`, `GlobalEditView`, `useGlobalForm` (mirror of `useCollectionForm`), sidebar globals section, and `AdminTopNav` breadcrumbs for globals routes.
  - `@vexcms/next`: `NextAdminPage` routes `/admin/globals[/slug]` with config-validated slugs and a not-found state.

- aa56f38: Add RBAC access control (spec 2026-08-12), a config/auth-bound server API, and per-slug return
  type narrowing for the client wrappers.

  - `@vexcms/core`: new `access/` module — `defineAccess()` builds a role → subject → action matrix
    typed from the registered collections and globals; `hasPermission()` resolves it at runtime and
    merges every role the caller holds. `PERMISSION_SCOPES` (`doc` / `any` / `all`) decides how a
    check that inspects the document is answered when no `data` is supplied — `any` → `true` for
    nav/list gating, `all` → `false` for bulk affordances (the default, fail-closed), `doc` throws.
    Every server guard enforces access via `resolveGetAuth`. `vexServerApi()` binds `config` once
    and resolves `auth` per call so call sites pass neither, with `skipAccess: true` as the
    explicit opt-out for public reads. Client wrappers (`get`/`find`/`search`/`globals.get`) now
    narrow to the document of the `collection` slug passed in, honouring `populate` and literal
    `depth`; `find`/`search` gained array-vs-paginated overloads. Relationship and upload fields
    generate `Id<"target">[]` instead of `Id<CollectionSlug>[]`, which is what makes populated
    fields resolve to `Doc<target>[]`.
  - `@vexcms/react`: `VexAccessContext`, `VexAuthContext`, and `usePermission`; `AdminSidebar`
    filters collections, globals, and media collections with `scope: "any"`.
  - `@vexcms/better-auth`: `createGetAuth()` resolves the caller (user + active organization) from
    the Convex `ctx` for use as `vexServerApi`/`collectionsApi`'s `getAuth`.
  - `@vexcms/next`: admin layout/page pass the server-resolved caller into the admin UI.

  BREAKING: the globals mutation `globals.update` is renamed `globals.upsert` (endpoint, server
  function `upsertGlobal`, and client wrapper). Bumped `minor` rather than `major` because these
  packages are pre-1.0 alpha, consistent with the globals-system changeset.

### Patch Changes

- fb55d58: Publish `peerDependencies` as ranges instead of exact versions.

  `peerDependencies` previously inherited exact versions from the pnpm catalog, so
  installing alongside a newer `convex`, `lucide-react`, or `@tanstack/react-table`
  produced a peer conflict. Peers now resolve from a dedicated `peers` catalog of
  deliberate ranges, and `@vexcms/core` is peered as a compatible range rather
  than an exact version. `dependencies` are now published as exact versions instead of ranges
  (`nanoid: 5.1.16`, not `^5.1.11`), so an install cannot silently pick up a
  different transitive tree than the one tested.

  `@vexcms/next` now declares `next >=15.0.0`, correcting a `>=14.0.0` claim that
  never held — the admin page awaits `params`, which requires Next 15 typings.

- 9e68058: Ship type declarations. Published packages contained no `.d.ts` at all.

  Every `tsup.config.ts` carried `dts: false` — tsup's rollup-dts pegs the CPU on this
  dependency graph — so `types: "./dist/index.d.ts"` pointed at a file that was never
  emitted. Installing any `@vexcms/*` package gave you `any`.

  Declarations now come from `tsc -p tsconfig.build.json --emitDeclarationOnly`, run after
  tsup in each package's `build` script. `dts: false` stays, deliberately: tsup builds JS,
  tsc builds types.

  The blocker was TS6059 (`File is not under rootDir`). Workspace deps resolved through the
  `source` export condition, pulling sibling `src/` into each program. The build configs now
  set `"customConditions": []` so deps resolve through their published `types` entry
  instead; Turbo's `dependsOn: ["^build"]` guarantees upstream `dist/` exists first. Dev
  configs are untouched and still resolve through `source`.

  Also exports `AuthFieldMeta` from `@vexcms/core`. `@vexcms/better-auth` had been importing
  it through `../../core/src/auth/types`, a cross-package source path that cannot produce a
  correct declaration.

- b67c8ab: Publish under Apache-2.0 with full package metadata.

  Every published manifest now carries `license: "Apache-2.0"` (root `LICENSE` +
  `NOTICE` added), `description`, `keywords`, `author`, `homepage`, and
  `repository` with per-package `directory`. `sideEffects: false` is declared
  where verified side-effect-free; `@vexcms/next` declares `["*.css"]` because it
  exports `./styles`. Packages publish to the `alpha` dist-tag
  (`publishConfig.tag`), leaving `latest` untouched until promotion.

- Updated dependencies [8f75ecb]
- Updated dependencies [fb55d58]
- Updated dependencies [58265ed]
- Updated dependencies
- Updated dependencies [24a3058]
- Updated dependencies [4270b82]
- Updated dependencies [40efb79]
- Updated dependencies [aa56f38]
- Updated dependencies [bde8141]
- Updated dependencies
- Updated dependencies [07924de]
- Updated dependencies [9e68058]
- Updated dependencies [7b1fa3c]
- Updated dependencies [b67c8ab]
  - @vexcms/core@0.1.0-alpha.2
  - @vexcms/react@0.1.0-alpha.2

## 0.0.20

### Patch Changes

- ba4663b: - Fix `hasPermission` returning denied for empty fields array (creating globals with no fields)
  - Fix `mergeRolePermissions` treating empty fields as denied instead of falling through to boolean
  - Fix `resolvePermissionCheck` returning empty object for empty fields
  - Fix `defineAccess` validation warning on `admin` permission key (built-in, not a resource)
  - Fix `sanitizeConfigForClient` stripping `access` property (contains functions that can't serialize across RSC boundary)
  - Fix auto-generated delete mutations not passing document data to `hasPermission` (dynamic callbacks received undefined)
  - Fix auto-generated update mutations not fetching existing document for permission checks
  - Fix auto-generated create mutations not passing fields data to `hasPermission`
  - Add `VexPlugin` type and plugin execution in `defineConfig`
  - Add `buildSiteMetadata` for framework-agnostic SEO metadata merging
  - Add `VexGlobal` slug type parameter for defineAccess autocomplete on globals
  - Add `admin` permission resource on roles for admin panel access control
  - Add `checkAdminAccess` function
  - Add `normalizeSlug` pattern (strips leading slashes, treats / and /home as home)
  - Fix sidebar hydration mismatch (localStorage read moved to useEffect)
  - Add external link button to live preview toolbar
  - Fix `useLocalStorage` hydration mismatch (defer localStorage read to useEffect)
  - Fix `GlobalEditView` creating documents with empty fields (now uses generateFormDefaultValues)
  - Add per-document delete permission check in CollectionsView (greyed out delete button)
  - Add duplicate document button to CollectionEditView
  - Add globals to dashboard view
  - Add "View Site" link on dashboard
  - Add server-side prefetch support (initialData props on all views)
  - Convert GlobalEditView to TanStack Query
  - Fix `convex/tsconfig.json` path aliases being overwritten by Convex during project provisioning (file watcher patches it back)
  - Add `ensureSchemaFileExists` placeholder for first-run bootstrap
  - Add `patchConvexTsconfig` to ensure ~/\* and @convex/\* aliases exist
  - Add marketing-site template (8 blocks, SSR prefetch, ThemeStyle, icon picker, access config)
  - Add `convex/tsconfig.json` with path aliases to base template
  - Add `culori` and `motion` dependencies to base template
  - Add anonymous auth plugin for demo site template
  - Fix missing ThemeImport, accordion, colorConvert files in template
  - Fix collections index removing site_settings (moved to globals)
  - Update admin layout with checkAdminAccess enforcement
  - Update proxy.ts and serverUtils.ts for \_\_Secure- cookie prefix
  - Remove legacy permissions.ts, replace with defineAccess
  - Deploy marketing site with SSR, SEO metadata, theme CSS injection
  - Add WelcomePage bootstrap flow (first user promotion)
  - Add admin button in header using checkAdminAccess
  - Fix vex.config.ts access import path
  - Move ThemeStyle to root layout (covers admin + frontend)
  - New demo site with anonymous auth, daily reset cron, permissive access
  - Protected page deletion (home, features, pricing, roadmap cannot be deleted)
  - Reset countdown banner before midnight UTC
  - Auto anonymous sign-in on first visit

- Updated dependencies [ba4663b]
  - @vexcms/core@0.0.20
  - @vexcms/ui@0.0.20

## 0.0.19

### Patch Changes

- 70a9c37: fix permissions bug and hydration error bug
- Updated dependencies [70a9c37]
  - @vexcms/ui@0.0.19
  - @vexcms/core@0.0.19

## 0.0.18

### Patch Changes

- 959b166: fix checkPermissions bug that wasnt respecting proper config for certain scenarios
- Updated dependencies [959b166]
  - @vexcms/core@0.0.18
  - @vexcms/ui@0.0.18

## 0.0.17

### Patch Changes

- 82a0384: update dashboard view to show globals, update default admin permissions to allow full access to all default tables in site template
- Updated dependencies [82a0384]
  - @vexcms/core@0.0.17
  - @vexcms/ui@0.0.17

## 0.0.16

### Patch Changes

- d71661c: update next to 16.2.1 in catalog
- Updated dependencies [d71661c]
  - @vexcms/core@0.0.16
  - @vexcms/ui@0.0.16

## 0.0.15

### Patch Changes

- 12b02aa: fix: strip access config from sanitized client config as it includes functions
- Updated dependencies [12b02aa]
  - @vexcms/core@0.0.15
  - @vexcms/ui@0.0.15

## 0.0.14

### Patch Changes

- 7227569: fix: add back onboarding flow for site template in create cli package
- 46dd320: fix: add utils to resolve slugs in pages collection for site template
- Updated dependencies [7227569]
- Updated dependencies [46dd320]
  - @vexcms/core@0.0.14
  - @vexcms/ui@0.0.14

## 0.0.13

### Patch Changes

- b72d981: added dom.iterable to convex tsconfig lib in templates
- Updated dependencies [b72d981]
  - @vexcms/core@0.0.13
  - @vexcms/ui@0.0.13

## 0.0.12

### Patch Changes

- fff842b: create cli: add tsconfig json for convex in all templates
- Updated dependencies [fff842b]
  - @vexcms/core@0.0.12
  - @vexcms/ui@0.0.12

## 0.0.11

### Patch Changes

- d2191b0: fix: add missing dependencies in package json file for marketing site template in create cli
- Updated dependencies [d2191b0]
  - @vexcms/core@0.0.11
  - @vexcms/ui@0.0.11

## 0.0.10

### Patch Changes

- 2c61dab: add missing template files for marketing site scaffold in create cli
- Updated dependencies [2c61dab]
  - @vexcms/core@0.0.10
  - @vexcms/ui@0.0.10

## 0.0.9

### Patch Changes

- 7d11f3c: 0.0.9
- Updated dependencies [7d11f3c]
  - @vexcms/core@0.0.9
  - @vexcms/ui@0.0.9

## 0.0.8

### Patch Changes

- f8a86a1: lock @convex-dev/better-auth package to 0.10.11 since 0.10.13 doesnt work
- Updated dependencies [f8a86a1]
  - @vexcms/core@0.0.8
  - @vexcms/ui@0.0.8

## 0.0.7

### Patch Changes

- 5c4b116: update template package versions, add a script that updates teh template package json versions for @vexcms packages to match the current version being published that happens on version:packages
- Updated dependencies [5c4b116]
  - @vexcms/core@0.0.7
  - @vexcms/ui@0.0.7

## 0.0.6

### Patch Changes

- 9acf057: update tsconfig so its not using workspace configs for files that dont exist outside of the workspace when in the project dev setup
- Updated dependencies [9acf057]
  - @vexcms/core@0.0.6
  - @vexcms/ui@0.0.6

## 0.0.5

### Patch Changes

- bfe4eef: update create vexcms package to ship dotfiles w underscore prefixes, then rename then back after pulling from package repo
- Updated dependencies [bfe4eef]
  - @vexcms/core@0.0.5
  - @vexcms/ui@0.0.5

## 0.0.4

### Patch Changes

- 91be00e: update package readmes, add installation and getting started instructions, add version selection and port specification for create vexcms package
- Updated dependencies [91be00e]
  - @vexcms/core@0.0.4
  - @vexcms/ui@0.0.4

## 0.0.3

### Patch Changes

- a1ca6dd: added the create vexcms cli package for scaffolding new projects using vexcms and all packages. www apps folder is working representation of this cli. added some bug fixes around versioning for collections w drafts enabled. some livePreview x versioning bug fixes. updated onboarding experience for the marketing site template w driver.js for an onboarding tour on first user sign in for each user. automatically make first user in convex db the admin user and autoredirect to the admin panel.
- Updated dependencies [a1ca6dd]
  - @vexcms/core@0.0.3
  - @vexcms/ui@0.0.3

## 0.0.2

### Patch Changes

- 8218c73: add package readmes
- Updated dependencies [8218c73]
  - @vexcms/core@0.0.2
  - @vexcms/ui@0.0.2
