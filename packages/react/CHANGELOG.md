# @vexcms/ui

## 0.1.0-alpha.36

### Patch Changes

- @vexcms/core@0.1.0-alpha.36
- @vexcms/better-auth@0.1.0-alpha.36

## 0.1.0-alpha.35

### Patch Changes

- 61982b1: The list view filter builder's add buttons read "AND" and "OR" instead of "AND condition" and
  "OR conditions".
- 67c7dec: List view filter builder fixes:

  - **Scrolling works.** The panel used to have a scrollbar that did nothing, and conditions spilled
    past the bottom of the panel. It now scrolls normally and stops growing once it shows the OR
    button plus about 3.25 single-condition OR groups.
  - **It lines up with the table.** The panel opens 8px below the Filter button, level with the
    top of the table.
  - **New OR groups go on top.** The OR button is now above the groups. Each new group appears
    first, just under the button, and the existing groups move down.
  - **The last condition can't be removed.** When only one condition is left, its × clears the
    condition instead of removing it, and is disabled while the condition is still empty. The
    open builder always shows at least one condition.

  `DataTableResponsiveMenu` gains an optional `sideOffset` prop for the desktop popover's distance
  from its trigger (default `4`).

- 61982b1: Same-major dependency refresh. `@vexcms/react`: `@codemirror/view` 6.43.14 → 6.43.15,
  `@tanstack/react-form` 1.33.1 → 1.33.5, `@uiw/react-color-sketch` 2.9.6 → 2.10.3,
  `tailwind-merge` 3.5.0 → 3.7.0, `use-mask-input` 3.14.2 → 3.14.3, `@base-ui/react` 1.2.0 →
  1.9.0; no import or prop changes. `@vexcms/react`'s testing setup (`@vexcms/react/testing`)
  now polyfills `window.PointerEvent` when jsdom has none, since Base UI 1.9's keyboard
  activation dispatches a real `PointerEvent` before the synthetic click.
  `create-vexcms`: `fs-extra` 11.3.6 → 11.4.1, `yaml` 2.9.0 → 2.9.1, and new projects scaffold
  with `convex` 1.49.0, React 19.2.9, TanStack Query 5.106.1 and Form 1.33.5, `convex-helpers`
  0.1.134, `nuqs` 2.10.2, `@base-ui/react` 1.9.0 and (marketing scaffolds) `shiki` 4.6.0.
  `convex` 1.49 requires Node.js 22 or newer.
- 61982b1: Security: `zod` 4.4.3 → 4.6.7 (GHSA-mrhx-c7xc-m3w5, memory exhaustion validating oversized
  constrained collections, fixed in 4.6.6). New projects scaffold with `next` 16.4.5 instead of
  16.3.3, which carried critical remote-code-execution advisories in the image optimizer,
  `use cache` functions and `next/og`.
- Updated dependencies [61982b1]
- Updated dependencies [61982b1]
- Updated dependencies [61982b1]
  - @vexcms/better-auth@0.1.0-alpha.35
  - @vexcms/core@0.1.0-alpha.35

## 0.1.0-alpha.34

### Patch Changes

- b96a81b: `AdminNotFound` is vertically centered in its content area. Scaffolded apps detect a signed-in
  session from a `<meta name="vex-session">` hint emitted by the admin layout and Draft Mode pages
  instead of reading Better Auth's httpOnly cookie (never visible to `document.cookie`), so the
  Convex client now waits for auth instead of flashing anonymous results; Draft Mode pages render
  the preview query on first paint, and the not-found page is vertically centered.
- Updated dependencies [b96a81b]
  - @vexcms/core@0.1.0-alpha.34
  - @vexcms/better-auth@0.1.0-alpha.34

## 0.1.0-alpha.33

### Patch Changes

- 64f2ef7: The six remaining "TODO: add not found view" placeholders in the collection, global, and media edit views now render the shared `AdminNotFound` state instead of a bare `<p>` line. Each shows the caller-supplied slug or id in its detail line. A missing collection or global links back to the dashboard. A missing document links back to its collection's list.
- 8cf0b32: The admin panel renders icons from lucide's full icon set again instead of loading each one on
  demand. On-demand loading made every admin icon flash its placeholder on page refresh.
  `AdminLayout` now mounts an internal `IconComponentsProvider` with `lucide-react`'s `icons`, so
  `Icon` renders the real SVG in the server HTML and on hydration. The cost is a larger `/admin`
  bundle. Public pages are unchanged: they still load icons on demand, or render them from
  `IconNodeProvider`, and never import the full set.

  The JSON editor's loading fallback now carries `aria-required`, so a required JSON field no
  longer reads as optional to assistive tech while CodeMirror loads.

- 8cf0b32: Fixes five issues found in the 2026-11-09 `create-vexcms` run-through and its follow-up polish pass:

  - **Silent save failures.** `DocumentSaveAction`'s non-versioned update/upsert path had no
    try/catch — a rejected `update`/`upsert` mutation propagated out of `handleSave` as an
    unhandled promise rejection, and `runtime.onSaved` never ran. Now caught and routed through
    `applyVexFieldErrors`, mirroring the versioned (draft) path and `VersionPublishAction`; the
    mutation's own `useVexMutation` `onError` still shows the visible toast. Audited every other
    admin mutation call site for the same missing-catch pattern and fixed the same way:
    `VersionUnpublishAction`, `ListViewBulkDeleteAction`, `ListViewRowDeleteAction`,
    `MediaCollectionListView`'s bulk delete, and `MediaUploadDropzone`/`MediaUploadForm` (the
    latter two previously had no visible error at all on an upload failure — `generateUploadUrl`
    is a plain `useMutation` with no `onError`). Both `createMediaDocument` calls now also pass
    `errorToast: false`: without it, a rejected create fired its own catch-and-toast AND
    `useVexMutation`'s default "Request failed" toast — two toasts for one failure.
  - **Create dialog overflow.** `ListViewCreateDocumentForm`'s wrapping element had no flex sizing,
    so `DialogFooter` sat outside the scrollable region on a long form and spilled below the
    panel. The wrapper now fills the dialog's remaining height (`flex min-h-0 flex-1 flex-col`) —
    fields scroll inside the dialog, header and footer stay pinned.
  - **Read-only fields in create forms.** `ListViewCreateDocumentForm` picked `required` fields
    without excluding `admin.readOnly` — a create form asked for a value it could never persist
    (e.g. Better Auth's `emailVerified`/`createdAt`/`updatedAt`). Excluded in both `"required"`
    and `"all"` fieldsMode.
  - **Hide "New" on the auth user collection (decision D2).** Added top-level `disableCreate` to
    `CollectionConfig` (`@vexcms/core`) — hides the list view's "+ New" action
    (toolbar and empty state) and blocks `?createNew=true` outright, even hand-typed. Set from
    `@vexcms/better-auth`'s adapter on the user collection only: users arrive via sign-up, never
    an admin-authored create form.
  - **`disableCreate` gap in relationship fields and Duplicate.** Decision D2's gate only
    covered the list view's own "+ New"/`?createNew=true` entry points — `RelationshipPicker`
    still rendered a working Create tab (`ListViewCreateDocumentForm`) for a `disableCreate`
    target collection, reachable from both its own tab trigger and `EmptyInput`'s "Create …"
    button, which now hides too. `CollectionDuplicateMenuItem`'s "Duplicate" had the
    same gap for its own collection: offered a working admin-authored create (via its all-fields
    conflict-fallback dialog) on a collection that explicitly has none. All three now check
    `disableCreate` and render nothing / Select-only, the same gate `ListViewCreateAction`/
    `ListViewCreateDocumentModal` already applied.

- 87376fb: The list view's title link (the `useAsTitle` cell in every data-table row) now has a 44px-tall
  tap area, matching the Apple HIG / Android touch-target guidance. Previously the link rendered
  at its text line box (~16px). The link uses a minimum height with a matching negative vertical
  margin, so row height and desktop density are unchanged. The data-table cell wrapper now clips
  long text horizontally only, so the tap area is not cut off at the top and bottom, and in compact
  density the tap area is capped at the 36px row height.
- 8cf0b32: `MediaUploadDropzone` and `MediaUploadForm` now measure an uploaded image's pixel
  width/height via `createImageBitmap` before creating its media document, and pass them
  through to `createMediaDocument`. Previously neither component measured dimensions at
  all, so the `width`/`height` fields `@vexcms/file-storage-convex`'s `defineMediaCollection`
  declares stayed unset after every upload regardless of the file.

  Non-image MIME types and files the browser can't decode are left with `width`/`height`
  omitted entirely, matching the fields' existing optional semantics.

- b33d9a3: Failed media uploads now show an error toast with the readable error message, instead of only logging to the console.
- 8cf0b32: `@vexcms/react/server`'s `ThemeScript` now exports its inline theme-init IIFE source as a
  standalone `buildThemeInitScript({ storageKey })` function, so a consumer can reuse the exact
  script `<ThemeScript />` renders without also rendering the Server Component itself.

  Added for Next.js App Router consumers specifically: rendering `<ThemeScript />` directly from
  `app/layout.tsx` can trigger React's dev-only "Encountered a script tag while rendering React
  component" console warning whenever `next dev` answers a route with its minimal error shell
  (e.g. a thrown `notFound()`) and reconciles the real root layout entirely client-side from the
  RSC payload — a `<script>` host node React commits that way is never executed and React warns
  about it, regardless of which API produced the element (`next/script`'s `beforeInteractive`
  strategy does not avoid this either; verified against its actual source). A genuine Server
  Component only ever runs once, so it can't distinguish "I'm raw server HTML" from "I'm being
  committed by the client reconciler" to render differently for the second case — only a Client
  Component checking `typeof window` can, which is why `buildThemeInitScript` now exists as a
  separable primitive: apps build a small local `"use client"` wrapper around it that renders the
  real script during SSR and `null` on every client render (see `ThemeScript.tsx`'s doc comment
  for the full write-up and the live verification this was checked against). `ThemeScript` itself
  is unchanged and still the right choice for Remix, Vite, and the Next.js pages router.

- Updated dependencies [8cf0b32]
- Updated dependencies [8cf0b32]
- Updated dependencies [8cf0b32]
- Updated dependencies [8cf0b32]
  - @vexcms/core@0.1.0-alpha.33
  - @vexcms/better-auth@0.1.0-alpha.33

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

- 9959fc1: **Root `Icon` loads icons on demand instead of bundling all 1703 of `lucide-react`'s icon components.**
  Every page that renders an `Icon` by name — directly, or through a collection's `admin.icon`, a block's
  `icon` field, or `Button`'s own `icon` prop — used to pull in every icon lucide-react ships (505 KB). `Icon`
  now resolves the name to `lucide-react/dynamic`'s on-demand import and reserves the loaded icon's exact box
  with a placeholder `<svg>` while it loads, so nothing shifts. A new `isIconName(name): name is IconName`
  export lets a caller holding untyped data (CMS content, a block field) check a name before rendering it,
  the same guard `Icon` applies internally.

  The admin panel uses the same lazy `Icon` everywhere, including its own sidebar, collection/global
  icons, field previews, and menu-item icons — there is no separate eager admin icon component.

  **Migration:** nothing for root `Icon` callers — same props, same `null`-on-unknown-name fallback, same
  one-warning-per-name behavior; the only visible difference is a brief placeholder box before an icon paints.
  A caller doing `icons[name]` directly against `lucide-react` to render a CMS-driven icon (as `Features`/`HowItWorks`/`Footer`/`Split`
  block renderers do) should switch to `Icon` + `isIconName` to get the same lazy loading.

  **Server-resolved icon nodes for first paint.** `resolveIconNodes`, exported from `@vexcms/react/server`,
  resolves a set of icon names to lucide's serializable `IconNode`s on the server. A new `IconNodeProvider`
  (and its `IconNodeMap` type), both exported from the root, hands those nodes to every `Icon` beneath it;
  `Icon` now checks that provider first and renders a matching node synchronously — real SVG in the server
  HTML, no request — before falling back to the lazy `DynamicIcon` path above for any name the server never
  saw (live-preview edits, client-only data). A route that already collects the documents it renders can
  resolve their icons once and wrap its tree: `IconNodeProvider` merges with any parent provider, so a
  layout-level map (header/footer icons) and a page-level map (block icons) compose without either
  overwriting the other.

- Updated dependencies [9959fc1]
  - @vexcms/core@0.1.0-alpha.32
  - @vexcms/better-auth@0.1.0-alpha.32

## 0.1.0-alpha.31

### Patch Changes

- 910f2e7: Accessibility pass on the admin panel against WCAG 2.2 AA and the WAI-ARIA APG patterns.
  Sidebar actions, multi-select chips, pagination, date/time pickers, resizable panels and
  data-table labels expose correct names, roles and keyboard support; data-table column
  resize is keyboard-operable (arrows, Home/End) and capped at 90% of the table container.
  Array fields, timestamps, media and relationship inputs, and the richtext toolbar gain
  accessible names and status regions; dialogs set initial focus; `ThemeProvider` applies
  the stored theme before paint in client-only renders.

  Both `create-vexcms` templates are re-synced from the reference apps: production-only CSP
  and security headers, root `not-found` pages, drafts and live preview on the
  marketing-site `pages` collection, and a session button in the site header.

- Updated dependencies [910f2e7]
- Updated dependencies [910f2e7]
- Updated dependencies [910f2e7]
  - @vexcms/core@0.1.0-alpha.31
  - @vexcms/better-auth@0.1.0-alpha.31

## 0.1.0-alpha.30

### Patch Changes

- a4fea41: Intercepting routes no longer interfere with the admin:

  - **State behind the sign-in modal.** Opening "Sign in" from the admin top bar swaps the URL to the modal's route while the admin page stays mounted underneath. The page used to read the modal's URL: the list view dropped its filter, view and search and loaded the wrong rows, a top-level tabs field reset to its first tab, and the sidebar lost its active collection. They now keep their admin values. List URL writes are dropped while the modal is open, so Escape closing the modal no longer also closes the peek panel or writes onto the modal's URL. The `Cmd/Ctrl+B` sidebar shortcut stands down too.
  - **Unsaved-changes guard.** The guard no longer prompts when "Sign in" is clicked on a dirty edit view, since the form stays mounted underneath. Closing the modal (a back navigation) no longer reads as leaving the page.
  - **Sign-in return URL.** The return URL now carries the page's full query (filter, sort, search, view, tab, peek), not just `?view=`, so signing in lands on exactly the page and state you left.
  - **New optional framework capabilities.** `FrameworkComponents.useIsRouteCovered` and `FrameworkComponents.useSearchParams`, plus the `COVERING_ROUTE_LINK_ATTRIBUTE` export. `@vexcms/next` supplies `useNextIsRouteCovered` and `useNextSearchParams`.

- a4fea41: Rich text editor upgraded to Plate 53, with fixes:

  - **Plate 53.** `platejs` and every `@platejs/*` dependency moved to 53.x (`platejs` 53.5.2).
  - **Blockquotes.** Plate 53 stores a blockquote as a container of paragraphs. The toolbar's quote button now wraps and unwraps blocks, so a quote can be toggled off again. Quotes saved before the upgrade are converted to the new shape when the editor opens, so toggling one off no longer deletes its text. Opening a document does not mark it as edited.
  - **Rendered lists.** `RichText` renders bulleted and numbered lists again. Plate 53 had moved the list wrapper out of the plugin it uses.
  - **Valid markup.** `RichText` no longer puts lists or links inside a `<p>`, which fixes React hydration errors on rendered pages and in the list-view peek panel. Links now stay inline in their paragraph instead of breaking onto their own line.
  - **Sticky toolbar.** The editor toolbar now pins flush to the top of the admin form while you scroll. It reads the new `--vex-form-sticky-top` CSS variable, which the admin's form scroll area sets to cancel its own top padding.
  - **Read-only blocks.** "Collapse all" and "Expand all" stay usable on a read-only blocks field, matching array fields. They only change which blocks are open, never the value.

- Updated dependencies [32277bf]
- Updated dependencies [898172f]
- Updated dependencies [898172f]
  - @vexcms/core@0.1.0-alpha.30
  - @vexcms/better-auth@0.1.0-alpha.30

## 0.1.0-alpha.29

### Patch Changes

- b714992: Admin chrome fixes:

  - **Sign in return URL.** `AdminTopNav`'s "Sign in" return URL now keeps the active saved view (`?view=`), so signing in returns you to the same list tab.
  - **Sidebar trigger alignment.** The sidebar trigger icon now lines up with the content edge.
  - **Toolbar alignment.** `ListViewToolbar` hides its empty wrappers (`empty:hidden`), so the first control lines up with the page title.
  - **Internal references removed.** Comments and error text in `@vexcms/react` and `@vexcms/next` no longer cite internal spec/decision labels. For example, `NextAdminPage`'s missing-`authPromise` error no longer points to a spec file.

- b714992: Lists now stay correct while the user signs in or out.

  - `PaginationResult` gains `viewerId: string | null`. `find`/`search` set it to the id of the identity the page was read as (`null` for anonymous).
  - New public `AuthTransitionProvider` / `useAuthTransition` (`@vexcms/react`), plus an `AuthTransitionState` type. It tracks the identity the client is moving to while the Convex socket re-authenticates.
  - `usePaginatedQuery` / `useVexListQuery` changes:
    - A page whose `viewerId` doesn't match the expected identity during a transition is ignored.
    - The identity is part of the reset key.
    - A page is never committed while the query is in error. Previously an error wiped the visible rows.
    - An `InvalidCursor` error is recovered during render.
  - `DataTableBody`'s loading skeleton is capped at the known row count.

- Updated dependencies [b714992]
- Updated dependencies [b714992]
  - @vexcms/core@0.1.0-alpha.29
  - @vexcms/better-auth@0.1.0-alpha.29

## 0.1.0-alpha.28

### Patch Changes

- a2441a0: Fixed form label, description, and field spacing — `FormFieldLayout` and `ui/field.tsx`
  now space labels, descriptions, and controls consistently across every field type, so inputs
  are better spaced and edit views are easier to scan.

- b937b2b: Bumped `patch` despite being breaking, per this track's own `config-client-server-split`
  convention — see that changeset's note on the `alpha` pre-release base.

  **Breaking: a field-permission map that lists only some fields now ALSO hides system fields
  and UI (`ui()`-type) fields it doesn't list, the same "hidden unless listed" rule that
  already applied to data fields.** Field-permission maps accept the real system field names as
  keys now — `_creationTime`, `updatedAt`, and `vex_status` (the last only on a
  versioned/drafts-enabled collection) — plus `ui()`-type fields (e.g. a computed `wordCount`),
  typed per collection. `_id` stays the one permanently ungateable key, always readable, never a
  valid map entry. The wildcard key (`"*"`) covers system and UI fields too, same as before.
  Stripping runs on every read path: `find`, `get`, `search`, and the versions endpoints.

  **Migration:** a partial field-permission map that previously implicitly showed
  `_creationTime`/`updatedAt`/`vex_status`/every `ui()` field (since there was no key to gate
  them on) now hides them unless you add the key, or switch that map to `'*'`. Audit every role
  in your `access.ts` after upgrading — `apps/test`'s and `apps/www`'s own configs needed exactly
  this audit (e.g. a `guest` role's `posts` map gained an explicit `updatedAt` entry to keep
  showing it, while deliberately leaving `vex_status`/`_creationTime` hidden).

  One carve-out, unchanged: sorting by `_creationTime` is always allowed, even when its own
  value is hidden from that caller — this was already correct before this change and is now
  covered by an explicit regression test.

  **Client:** a new `useCanReadField` hook (`@vexcms/react`) lets a component check "can I read
  field X" for system/UI fields the same way it already could for data fields — used by the
  peek's Created row, JSON tab, and hidden-fields notice.

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

- 4d504e7: **Breaking — `find` and `search` take `where` instead of `filter`.** Fields are named
  directly, with no `q.field(...)`:

  ```ts
  // before
  find({
    ctx,
    collection: "posts",
    filter: (q) => q.eq(q.field("published"), true),
  });
  // after
  find({ ctx, collection: "posts", where: (q) => q.eq("published", true) });
  ```

  `where` uses the same builder as access rules: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `and`,
  `or`, `not`. `withIndex` is unchanged at the call site; its `range` is now typed from your
  generated index declarations rather than the Convex data model.

  **Breaking — access rules: `constraints` splits into `withIndex` and `where`.** Each maps onto
  the `find` argument of the same name. `withIndex` (query actions only) is the same
  `{ name, range }` object `find` takes, or a function of the caller returning one; `where`
  builds a predicate with `q`. Either callback may return `true` (no restriction from this half)
  or `false` (deny). The rule-level `filter` property is unchanged. Any combination is allowed.

  ```ts
  // before
  read: { constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")) }
  read: { constraints: ({ user, q }) => q.withIndex("by_author", (ix) => ix.eq("author", user._id)) }
  update: { constraints: ({ user, q }) => q.filter((f) => f.eq("author", user._id)) }
  // after
  read: { withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") } }
  read: { withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }) }
  update: { where: ({ user, q }) => q.eq("author", user._id) }
  ```

  `@vexcms/react/testing`'s access fixtures use the new shape.

  **Breaking — a field's `index` takes a name or an object; field-level indexes win.**
  `index: "by_slug"` is unchanged. The object form `index: { name, additionalFields?, draftStatus? }`
  declares a compound index led by the field, and replaces the sibling `indexDraftStatus`:

  ```ts
  // before
  author: relationship({
    to: "users",
    index: "by_author",
    indexDraftStatus: true,
  });
  // after
  author: relationship({
    to: "users",
    index: { name: "by_author", draftStatus: true },
  });
  // new: compound index led by the field → .index("by_author_status", ["author", "status"])
  author: relationship({
    to: "users",
    index: { name: "by_author_status", additionalFields: ["status"] },
  });
  ```

  - An explicit field-level index now wins over a collection-level `indexes` entry of the same
    name (previously the collection-level entry won), which wins over a relationship field's
    automatic `by_<fieldKey>` index. A relationship field that wants `draftStatus` on its
    automatic index names it explicitly, as above.
  - Two fields declaring the same index name now throw at `defineCollection`. Previously the
    schema emitted both (which Convex rejects) while the generated types merged them.
  - `additionalFields` names are checked against the collection's fields at `defineCollection`.
    Field factories take the field's own key as an optional second generic
    (`text<"articles", "slug">`) to type `additionalFields` against the collection's other
    fields; `TFieldMeta` moves to the third generic.

  **New — `VexError`.** Throw it from a field's `validate()` instead of `ConvexError`; the admin
  receives the same structured data with the failing `field` added.

  **New — `where` accepts a plain data form.** Besides the builder callback, `where` now also
  accepts `VexWhereNode<S>`, the same filter as plain JSON — for a filter that needs to be saved
  or sent over the wire, which a function cannot be:

  ```ts
  find({
    ctx,
    collection: "posts",
    where: { and: [{ field: "featured", op: "eq", value: true }] },
  });
  ```

  Convert a builder callback to this shape with `whereToNode`; validate an untrusted one (a
  saved view, a URL param) with `validateWhereNode`, which throws a `VexError` on a malformed
  shape (including an empty `and` / `or`), an unknown operator, or an unknown field name.

  **New — `where` on the client.** `find` and `search` from `@vexcms/react/client` accept
  `where` in either form; a callback is converted to the plain form before it is sent. A `where`
  on a field the caller cannot read (field-level RBAC) excludes the documents where it is hidden,
  so a filter cannot be used to probe hidden values.

- b937b2b: **Breaking (narrow): `Button`'s icon+label content is no longer space-between by default.**
  Grouped/centered content (icon and label staying together, centered within a stretched-width
  button) is now the default; space-between is an explicit opt-in via the new
  `contentJustify?: "center" | "between" | "start"` prop (default `"center"`). The previous
  default was correct for exactly one caller (a full-width mobile view-switcher wanting a
  label-left/icon-right split) and visibly wrong for every other full-width labeled button,
  which wants its icon and label to stay grouped together.

  **Migration:** a full-width labeled `Button` that relied on the old space-between default
  needs `contentJustify="between"` added explicitly to keep that layout — everything else
  renders correctly with no change. `"start"` is new, for a left-aligned icon+label pair (e.g. a
  menu-style overflow item) that shouldn't center within extra width.

  Also fixed in the same pass: `hasLabel` (drives the icon's own margin) now correctly ignores a
  raw icon element passed as `children` with no `icon` prop, and respects an explicit
  `iconPosition="center"` even when `children` is present (an `sr-only` accessibility label no
  longer miscounts as visible label content).

- f837f20: Breaking (pre-0.1.0): `@vexcms/core/convex` is removed — it was always an identical alias of
  `@vexcms/core/server`. Import `collectionsApi`, `globalsApi`, `versionsApi`, `vexServerApi`,
  `createVexCallbackApi` and every raw server function from `@vexcms/core/server` instead; no
  export name changes, only the subpath goes away.

  Internal: `src/api/` is dissolved — collection, global and version server operations now live
  beside their domain (`collections/api/`, `globals/api/`, `versions/api/`), `media/api/` moved
  to the same `<op>/server.ts` scheme, and the shared read/write pipeline moved to `src/db/`.
  All four document shapes (`VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument`)
  now live together in `src/documents/types.ts`, re-exported from `src/versions/`/`src/media/`
  for feature-barrel importers; version constants never moved. `vexConvexApi` moved from
  `api/convex.ts` to its own `src/vexConvexApi.ts`. No
  public import path outside the removed `./convex` subpath changes.

  Breaking (pre-0.1.0): `@vexcms/react`'s admin field components are renamed —
  `TextFieldInput`/`EmailFieldInput`/`TextareaFieldInput`/`JsonFieldInput`/`UrlFieldInput`/
  `NumberFieldInput`/`CheckboxFieldInput`/`SelectFieldInput`/`DateFieldInput`/`ColorFieldInput`/
  `ArrayFieldInput`/`BlocksFieldInput`/`GroupFieldInput`/`RelationshipFieldInput`/
  `UploadFieldInput`/`RichTextFieldInput` are now `TextFieldAdmin`/`EmailFieldAdmin`/…/
  `RichTextFieldAdmin` (matching the existing `*FieldCell` pairing). The old `createFieldInput`
  factory and its entire `components/form/` module (`AppForm`, `AppFormContext`, `FormArray`,
  `FormBlocks`, `FormGroup`, `FormTabs`, `FormCollapsible`, `FormRow`, `FormUI`, `FormLabel`,
  `FormError`, `FormDescription`, `RenderFields`, `FieldConditionGate`) are removed — every admin
  field now composes through the new `@vexcms/react/form` entry (`useAppForm`, `AppForm`, the
  `forms/*Field.tsx` components) instead. `useAppForm`/`AppForm` are now also re-exported from
  `@vexcms/react`'s root for callers who only need the app form, not its full `/form` surface.

  Breaking (pre-0.1.0): `@vexcms/core`'s `InputComponentProps` is removed — it was the per-field
  edit-form props shape; `FieldComponentProps` now carries that same shape directly (no more
  `extends InputComponentProps`), and the new `FieldControlProps` is the narrower shape an
  `admin.components.Input` control-level override receives. `admin.components.Field` is a new
  whole-field override slot, composed the same way `admin.components.Input` already was.

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

- 30b4c10: Duplicate document. A `vex.duplicate` built-in, gated on the `create` permission, clones the
  current document on every non-media collection (not globals, not media) — stripping `_id`,
  `_creationTime`, `_status`, `_version` and timestamps and regenerating array/block item ids —
  and creates it. On success it navigates to the new document; on a unique-value conflict it
  opens a create modal prefilled with every field (`CreateDocumentForm`/`CreateDocumentModal`
  gain `fields: "all"`, `initialValues`, and `submitOnOpen`) and submits immediately, so the
  existing failed-submit focus/reveal behavior lands on the conflicting field. A duplicated
  document in a versioned collection always creates as a draft.

  Duplicate renders alongside a manual Revalidate purge (`vex.revalidate`) in the new
  `edit.actionsMenu` ⋯ menu to the left of the status badge, not in `edit.header.actions` —
  developer feedback after the initial header-actions placement moved both out of the primary
  button row.

- 30b4c10: Edit-view extension points. Eight new slots under `admin.components.edit` — `header.actions`,
  `header.before`, `header.after`, `actionsMenu`, `beforeFields`, `afterFields`, `sidebar.before`,
  `sidebar.after` — for collections and globals, resolved root → resource level with the same
  `order`/`before`/`after`/`hidden`/`access`/`condition` model as every other slot. Save,
  Publish, Unpublish, Delete, Cancel and the live-preview toggle are now
  `vex.*` built-in contributions in `edit.header.actions`, from `BUILTIN_CONTRIBUTION_IDS.edit`
  (left to right: Preview, Save, Publish-or-Unpublish, Cancel, Delete) — hideable,
  reorderable, and wrappable through a new per-slot `overrides` map keyed by built-in id
  (`overrides: { "vex.save": [...] }`). An override keyed to an id outside that slot's resolved
  list throws `VexComponentConfigError`. Save (Draft)/Publish-or-Unpublish/Cancel are always
  rendered, greyed out when inapplicable rather than hidden by state (layout never shifts).
  `vex.publish`/`vex.unpublish` share one spot — exactly one renders at a time, with a shared
  minimum width so the swap never shifts neighbouring buttons. Delete carries a trash icon on
  its header button, its collapsed ⋯ menu item, and its confirm dialog's own Delete button.
  `vex.versionHistory` ("History") moved out of `edit.header.actions` into the new
  `edit.actionsMenu` — see below. A new `edit.actionsMenu` slot holds a ⋯ menu for
  less-used actions — see the `duplicate-document` changeset for its other built-ins — rendered by
  `DocumentEditActionsMenu`/`EditActionsMenuItem`, with a new `useEditActionsMenuDialog()` hook
  for a menu item whose action opens a dialog after the menu has already closed. History renders
  through this menu (right after Preview, when Preview is also collapsed in) as
  `VersionHistoryMenuItem`, opening the same version list `VersionHistoryDropdown` renders
  standalone in a dialog through that hook.

  The header row stays on one line at every width instead of wrapping: the title truncates first
  (measured, via a new `useHeaderActionsCollapse` hook), and only once it can't shrink any
  further does `vex.livePreview`, then `vex.delete`, then (narrower still) `vex.cancel` move into
  `edit.actionsMenu` — a versioned document's Save Draft/Publish-or-Unpublish/Cancel/⋯ set alone
  can outgrow a ~375px header even with the title and both other candidates already collapsed.

  `SlotAccessContext`'s `access` predicate (every `ComponentContributionInput`) gained an optional
  `resource?: EditSlotProps`, populated for every `edit.*` slot (`undefined` for field-level
  slots, which have no single resource kind) — lets a contribution that only makes sense for one
  resource kind (e.g. a collection document's own id) declare that declaratively via `access`
  instead of returning `null` at render time, which left a dead, empty ⋯ trigger on a resource
  with nothing else in its menu (a project's root-level `edit.actionsMenu` item resolved as
  present, even though it always rendered nothing for a global).

  New `useVexDocument()` hook (`@vexcms/react`) exposes document-level state — `kind`, `slug`,
  `id`, `saved`, `isDirty`, `status`, `canEdit` — to built-in and third-party edit-view
  contributions; it throws outside its provider, which both edit views now mount.

  Every override layer — in field `Input`/`Cell` chains and in the new edit-slot `overrides` —
  now renders inside its own `ComponentErrorBoundary` keyed by the override id; a throwing
  wrapper renders the layer beneath it plus an inline error instead of breaking the view. This
  changes the field-override error behavior shipped in the field-input-consistency-pass
  changeset.

- b937b2b: New optional `display` field component slot, beside `field`/`cell`/`filterInput`.

  `reactAdapter.fields[type]` now accepts a `display` component — a read-only
  presentation of a field's value, used anywhere a value needs to be shown
  without a form around it (the collection list's row-inspect peek is the
  first consumer). `DisplayComponentProps<TField>` (new, `packages/core`):
  `field`, `value`, `document`, `collection` — no table row, title-link
  behavior, or column key, unlike `CellComponentProps`.

  New `fieldToDisplayComponent(type)` (`@vexcms/react`) resolves a type's
  registered `display`, falling back to its registered `cell` (adapted,
  `isTitleField` forced `false`) when no `display` is registered — every data
  field type resolves to something.

  Nine built-in types register a dedicated `display`: `text`/`textarea` (full
  value, unlike their `cell`'s truncation), `json` (the real `JsonEditor`,
  read-only), `richtext` (the configured editor adapter's own
  `renderComponent`, falling back to plain text with no adapter configured),
  `relationship`/`upload` (one chip per related doc/file, titled, with the raw
  id always reachable), and `group`/`array`/`blocks` (recurse into their own
  sub-fields' `display`s, via the new shared `fields/DisplayFieldList.tsx`).
  Every other data field type (`date`/`commitTs`/`checkbox`/`select`/
  `number`/`email`/`url`/`color`) registers none — its `cell` is already a
  reasonable read-only presentation.

- b937b2b: Declared (config/default) and shared-view filters behave consistently around field
  readability, closing several gaps the new access-system-fields rules exposed.

  A config/default view's own hidden `where`, and an ACTIVE, UNMODIFIED shared view's own saved
  `where`, both still apply server-side regardless of whether the current viewer can read the
  field they reference (same treatment `vex_status`'s draft/publish filtering already had) — the
  viewer never sees the value (no column, chip, or peek row for it), the view shows its
  hidden-filter badge, and the viewer can't add their own filter on that field. The moment a
  caller edits a shared view's own filter, it becomes their own and is checked like any other
  user-supplied condition.

  A user-added (URL or local-view) filter condition on a field the caller can no longer read is
  now dropped BEFORE the query is built, not just hidden from the chip row after the fact — the
  server already rejected it, so a dropped-but-still-sent condition used to produce a silently
  broken or empty query with no visible chip to remove it. A small dismissible toolbar notice
  explains the drop, naming the field's display label (aligned with the existing stale
  sort/search notices, which also now show the label instead of the raw key).

  **Bug fix:** a fully readable shared view's own saved filter now renders as normal, editable
  chips (previously invisible for every caller, since an unmodified shared-view link carries no
  URL-embedded filter state to read from) — new `resolveEffectiveFilterWhere` resolves the
  right source (URL override, else the active shared view's own `where`, else nothing) for the
  chip row, the visibility toggle, and the filter count badge alike.

- b937b2b: Renamed 10 client-helper functions that internally call `useConvexMutation` to their plain
  name with a `use` prefix: `create`→`useCreate`, `update`→`useUpdate`, `remove`→`useRemove`
  (`collections/api/*`), `updateGlobal`→`useUpdateGlobal` (`globals/api/upsert`),
  `saveDraft`→`useSaveDraft`, `publish`→`usePublish`, `unpublish`→`useUnpublish`,
  `deleteVersion`→`useDeleteVersion` (`versions/api/*`), and `saveView`→`useSaveView`,
  `removeView`→`useRemoveView` (`collections/api/{saveView,removeView}`).

  A function that calls a hook internally but isn't itself named with a `use` prefix is treated
  as a plain, memoizable value by the React Compiler (`reactCompiler: true`, enabled in
  `apps/test`) — on a later render the compiler can skip re-invoking it entirely, silently
  dropping the internal `useConvexMutation` call and crashing with a hooks-order mismatch. This
  surfaced live as a real crash in `ListViewModifiedControls.tsx`'s `saveView()`/`removeView()`
  calls; renaming those two first, then sweeping every other case of the same shape, fixes the
  hazard at its root rather than per-call-site.

  No behavior change — every renamed function has the identical signature and return shape, just
  a new name. Every call site across `@vexcms/react`/`@vexcms/next` is updated; there is no
  re-export under the old name.

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

- b937b2b: Fixed the list view's view-tab row (`ListViewTabs`):

  - **Double menu on click.** Clicking the "All views" overflow trigger could open two menus
    at once — one correctly positioned, one at the viewport's top-left corner. Root cause: up
    to four per-breakpoint overflow triggers could be mounted simultaneously (depending on how
    many saved views a collection had), all sharing one `open` boolean — opening the
    CSS-visible one also opened every other mounted trigger's popover, including a CSS-hidden
    one whose zero-size anchor portalled its content to the top-left corner. Fixed by
    collapsing to exactly one trigger, always, with no per-breakpoint duplicates.
  - **Tab overflow is now content-aware**, not a fixed per-breakpoint guess. The tab row wraps
    via `flex-wrap` inside a fixed one-line-height, `overflow-hidden` container — whatever
    doesn't fit the first line wraps onto an invisible second-plus line and is fully clipped
    (never partially cut, never scrolled). Every saved view's tab is reachable from the "All
    views" menu regardless of whether its own tab fits. Pure CSS/container-query, zero
    `ResizeObserver` measurement, no layout shift.
  - **Tabs size to their own content on medium/large screens**, not stretched to fill the row —
    Save view/⋯/the views trigger sit right after the tabs, not pushed to the far edge. The
    tab-wrap container can still shrink (triggering the clip-and-overflow behavior above) but
    no longer grows to fill available space.
  - **The view-switcher trigger's label**: a static "All views" on medium/large screens (where
    the tab row itself is visible, so the active tab's own underline already shows which view
    is active) — only below a narrow container breakpoint, where the tab row and Save
    view/⋯ hide and the trigger is the only thing left, does the label become the active
    view's own name (e.g. "Published"), so the caller can still tell which view is active.
    Both labels render unconditionally in the markup; pure CSS (container-query classes)
    decides which is visible, so the server-rendered HTML is identical to the hydrated DOM.
  - **SSR-correct**, including for an active SHARED view. `ListViewTabs` no longer splits its
    tab strip into a `useSuspenseQuery`-inside-`<Suspense>` piece — that split existed only to
    stream shared views in once `NextAdminPage`'s `listViews` prefetch was deliberately
    un-awaited; that prefetch is now unconditionally awaited (an earlier fix), so by render
    time the data is always already resolved, and the nested Suspense boundary turned out to
    have a cost of its own even then (React's streaming SSR ships a nested boundary's fallback
    in the first flush regardless of whether the underlying query had to wait at all). Reverted
    to the plain `useListViews()` hook everywhere; confirmed via curl that the raw SSR HTML for
    a shared-view URL now contains that view's real name in the trigger directly, no
    flash-then-swap.
  - **The shared-views error notice still works.** Removing the `<QueryErrorBoundary>` (part
    of the now-retired Suspense split) could have dropped the existing "Couldn't load shared
    views · Retry" toast — it didn't: `useListViews` now exposes `isError`/`error`/`refetch`
    directly, and `ListViewTabs` surfaces the same notice from a plain `useEffect`, with the
    tab row falling back to its default/config/local-only shape (same as a loading state —
    zero shift) and Retry calling the query's own `refetch`.

- 30b4c10: **Live preview no longer takes over the page when the window narrows.** `isMobile` (from
  `useIsMobile()`, the 768px breakpoint) used to gate the SAME `LivePreviewPanel` between a
  `ResizablePanel` and a bare `fixed inset-0` div — so narrowing the browser past that
  breakpoint while the desktop split was open flipped straight into a full-screen takeover
  with no warning, nothing to dismiss it but the panel's own close button.

  `useLivePreviewPanelState` now owns the full responsive state machine: narrowing past the
  breakpoint while open auto-closes the panel and remembers the close was automatic; widening
  back past it reopens the panel ONLY if nothing explicit happened while narrow (any toggle —
  open or close — clears that memory, so it then stays however the user left it). Automatic
  transitions never write the `vex-live-preview-panel:<slug>` cookie; only an explicit
  `toggle()` does, so a refresh at desktop width still respects the user's last deliberate
  choice.

  Opening the panel below the breakpoint (the header button or the ⋯ menu's "Preview" item)
  now shows a new `LivePreviewMobileOverlay` — a `ui/sheet.tsx` bottom sheet, built on Base UI's
  `Dialog`, that slides up and covers the screen except a thin strip of the page at the top.
  Esc, a backdrop tap, or `LivePreviewPanel`'s own close button all dismiss it; focus is
  trapped and the page behind doesn't scroll, for free from the Sheet primitive. The toolbar
  keeps its existing `justify-between` layout (preview-in-a-new-tab link on the left, close on
  the right).

  `LivePreviewToggleAction`'s pressed icon and the ⋯ menu item now read the panel's `isOpen`
  directly (previously `isSplit`, which read `false` while the mobile overlay was open —
  leaving the header button showing "closed" even though the overlay was visibly open).

- b937b2b: The document peek panel is now resizable on desktop: a drag handle on its left edge (same
  look and keyboard behavior as a `DataTable` column resize — full-height highlight on
  hover/focus/drag, a grip, `role="separator"`, `ArrowLeft`/`ArrowRight`), clamped to
  `[320px, 60vw]`. The width persists per view, mirroring `pageSize`'s own mechanics — but ONLY
  for a view that has its own saved width: that view shows "Modified" when the current width
  differs and Reset restores the saved one, while a view with no saved width (the default "All"
  view and any config view that never set one included) never shows "Modified" for peek width
  and Reset leaves it alone — it's just a remembered preference there, not view state. Saving a
  view that has no saved width only starts saving one if you resized the peek while that view
  was active. It survives a reload via the same admin preference cookie every other
  per-collection UI preference uses.

  The panel is also now structurally ONE element at every viewport width, switching between a
  full-width bottom sheet and a fixed right panel via plain CSS instead of two separately
  mounted layouts, and now renders BEFORE the table in DOM order — both changes together are
  the confirmed, controlled fix for a hard browser freeze that could occur opening or navigating
  the peek on certain rows (reduced from two separate, structurally different root causes found
  across this investigation, not a single simple bug).

  A few smaller peek changes land in the same pass: Previous/Next now WRAP within the loaded
  rows (Previous on the first row jumps to the last, Next on the last jumps to the first) instead
  of disabling at either end; the header's edit-page link reads "Edit" instead of the previously
  ambiguous "Open" (the row ⋯ menu's matching action was renamed the same way); the panel's
  sidebar offset now animates in lockstep with the admin sidebar's own toggle instead of jumping
  instantly; the JSON tab now reads from a dedicated raw (depth-0) fetch instead of the same
  populated row the Fields tab uses, so a relationship/upload field shows its actual stored id(s)
  there, not a populated document; and the panel remembers which tab (Fields or JSON) you last
  had open, admin-wide, the same way density/sidebar-collapsed state already persist.

  No public API change — this is an internal implementation change to an existing component
  (`ListPeek`) with new persisted user preference state, not a new prop or exported type.

- b937b2b: The edit view's Publish button now shows its pending spinner while a publish is in flight —
  `VersionPublishAction` passes `isPending` from its `useVexMutation` to the button, which it
  previously never did.
- b937b2b: Load errors are now region-specific instead of an uncaught boundary or a silently blank
  screen, each region reusing one shared error-boundary-style component with
  `QueryErrorResetBoundary` for retry.

  The table reuses the existing `ListQueryError` (generic "Couldn't load <plural>" + Retry; an
  `UNINDEXED_SORT` failure offers "Remove sort" instead) — the toolbar stays usable, same frame
  size as the table, zero layout shift. A peek that fails to load or isn't accessible shows the
  existing "Can't show this document" copy either way — not-found and no-access read
  identically, by design, no existence leak. A shared-view tab fetch failure leaves the
  default/config/local tabs rendering and shows a small inline "Couldn't load shared views ·
  Retry" in just the shared slot.

  `useVexDocQuery` now returns an `error` field; the three edit views (collection/global/media)
  show an inline error state with Retry instead of rendering a blank form when it's set.

- b937b2b: Removed `CollectionListViewProps.initialData`/`.initialQueryError`/`.initialViews`/
  `.initialPeekDoc` and `ListPeek.initialDoc`, along with the client branches that only existed
  to support them (e.g. the `hasLiveQueryResultRef` fallback) and their tests. Nothing in the
  codebase wrote to any of them — `NextAdminPage` and every other caller already seed the
  TanStack Query cache instead.

  **Migration:** if you were passing any of these props from a non-Next integration, prefetch
  through the query cache instead — call the same query (`useVexListQuery`'s underlying
  `findPaginated`/`search`, or the single doc-query key builder for a peek/edit view) on the
  server and hydrate the `QueryClient` you hand to the client tree, the same way `NextAdminPage`
  does. There is no `initial*`-prop seeding path left to fall back to.

- b937b2b: Typing in the list search box no longer flashes the table to a loading skeleton and then an
  empty state before settling — the previous results stay on screen (dimmed, same treatment a
  view switch already gets) while a debounced search resolves, then swap in place with no
  skeleton or empty-state flash in between.

  Three compounding causes fixed together: the table's seed query re-suspended on every
  search/sort/filter change with no previous-page fallback to fall back to; switching between
  find-mode and search-mode pagination lost the OTHER mode's still-valid previous results the
  instant the dispatch target changed; and the debounce itself was buggy (see the
  `use-debounced-value` changeset). `isFetching`/`isPlaceholderData` are also unreliable signals
  against a live Convex subscription (updates arrive via the websocket's own cache push, never a
  tracked refetch) — the search spinner now tracks a dedicated `isSettling` state instead.

- b937b2b: A saved (shared or local) view whose `sort.field` or `searchField` no longer exists, is no
  longer indexed, or is no longer searchable now falls back to the collection's own default for
  just that one part — identically on the server and the client, so there's no
  first-paint/hydration mismatch — and shows a small, dismissible toolbar notice ("This view's
  sort on 'X' is no longer available").

  The saved view itself is never silently rewritten by this fallback; it only changes if the
  user explicitly saves over it.

- b937b2b: `ThemeScript` moves from `@vexcms/react` (re-exported through `ui/index.ts` → the main
  `src/index.ts` barrel) to a new `@vexcms/react/server` entry.

  `src/index.ts` carries its own `"use client"` directive deliberately — everything reachable
  from it joins the client module graph. `ThemeScript` is a plain `<script>`-returning function
  with no hooks, genuinely server-renderable, but got swept into that boundary anyway purely by
  being re-exported through the same barrel. Rendered from a Server Component (`app/layout.tsx`)
  it became a client component reference instead of running during the server's own render
  pass — React's "Encountered a script tag while rendering React component" warning (meant for
  SSR output, not a post-hydration client insertion) and a flash of the wrong theme before
  hydration.

  `import { ThemeScript } from "@vexcms/react/server"` instead of `"@vexcms/react"`. No other
  change — same props, same rendered output.

- b937b2b: `find`/`search` no longer `.collect()` the whole matching set to count it — a query above
  Convex's ~32k-document transaction scan limit used to fail outright, and `totalDocs` reported
  `null` once a collection crossed that threshold. Both now count at most
  `admin.view.countLimit + 1` rows (`countLimit` default `10000`, collection-wide,
  settable per view too; `search` always clamps it to `1023`, since a Convex search query returns
  at most 1024 results) and return `totalDocs: number` always, plus a new
  `totalDocsCapped: boolean` — `true` once the cap is hit, meaning the real count is `>=
totalDocs`, not exact.

  `usePaginatedQuery`'s own `totalDocs` no longer latches to the first response it ever saw: it
  re-reads `totalDocs`/`totalDocsCapped` from every `cursor === null` response, so switching a
  filter or view, or a live insert landing while the hook is mounted, updates the displayed
  total — not just a one-time value frozen at first mount.

  **Migration:** `totalDocs: number | null | undefined` stays the same TypeScript type (a
  consumer handling `null` still compiles), but `null` is no longer a value either function
  ever actually returns — replace a `totalDocs == null` "over 10,000+" fallback with
  `totalDocsCapped` if you want the capped-count UI back.

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

- b937b2b: Bumped `patch` despite being breaking, per this track's own `config-client-server-split`
  convention — see that changeset's note on the `alpha` pre-release base.

  `defineCollection`'s auto-injected `updatedAt` field switches from `date({ on: "save" })` to
  the new `commitTs({ on: "save" })` field type — Convex's own database-stamped commit
  timestamp (`v.commitTs()`), resolved to an `int64` the server converts to a plain Unix-ms
  `number` before it's ever visible to a reader. `stampUpdatedAt` is removed entirely, replaced
  by `stampCommitTsFields`, which stamps every `commitTs`-typed field (not just `updatedAt`) on
  a configurable set of write events (`create`/`update`/`publish`/`unpublish`/`draftSave`, via
  each field's own `on` policy).

  A `where` clause on a `commitTs` field with a non-integer or non-finite number throws
  `VexError({ code: "INVALID_WHERE" })` naming the field.

  **No migration path** (pre-release, no-data-loss requirement waived by design): an existing
  dev row's numeric `updatedAt` fails Convex schema validation the moment the regenerated
  schema (`v.optional(v.commitTs())`) pushes. Unset `updatedAt` on every row before
  redeploying, or drop the table. App-facing reads are unaffected — `find`/`get`/`search`
  still return `updatedAt` as a plain Unix-ms number; only the write-time field type and the
  injection default changed.

- b937b2b: New `useDebouncedValue` hook (`@vexcms/react`), replacing every internal call site that used
  `@ts-hooks-kit/core`'s `useDebounceValue`: the list search box, the relationship picker's
  search, the rich text editor's inline media picker search, and the shared
  search-pagination hook under the media library grid.

  The third-party hook had a real bug — its internal "last call" timer only updated on the
  FIRST call of a burst, not on every subsequent one, so a 250ms debounce window tracked 250ms
  after the first keystroke rather than the most recent one, behaving like a throttle at the
  original interval instead of a true debounce. Typing at a normal pace fired a search roughly
  every 250–300ms DURING typing instead of once after the user stopped, visibly swapping rows
  mid-type.

  No API change for existing callers beyond the swap — `useDebouncedValue(value, delayMs)`
  returns the debounced value, same shape as the hook it replaces.

- Updated dependencies [b937b2b]
- Updated dependencies [30b4c10]
- Updated dependencies [b937b2b]
- Updated dependencies [4d504e7]
- Updated dependencies [f837f20]
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
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
- Updated dependencies [b937b2b]
  - @vexcms/core@0.1.0-alpha.28
  - @vexcms/better-auth@0.1.0-alpha.28

## 0.1.0-alpha.27

### Patch Changes

- 6764c26: Field input consistency pass. New fields: `email()`, `textarea()`, `json()`, and the
  non-stored layout fields `tabs()`, `collapsible()`, `row()` and `ui()` (flattened by
  `getDataFields()`; a named tab stores its fields as one group-shaped value). Every field
  accepts `admin.condition({ data, siblingData })`, enforced in the admin form and on the
  server (a hidden field skips `required`/`validate`). `admin.mask` on text/email/number/url
  plus project defaults in `fields.inputMasks`. `min`/`max` take `number | [number, string]`;
  `admin.width` takes any CSS width. Experimental extension points: per-field
  `admin.components` overrides and contributions, project-wide `fields.<type>` overrides, and
  `blocks`/`array` action contribution lists. Admin: responsive form layout driven by the form
  column width, array/blocks item actions (duplicate, move, insert, remove, collapse all), a
  block clipboard across fields/documents/collections, relationship overhaul, tabs that open on
  the first error, and focus on the first invalid field after a failed save.

  Breaking: `array()` drops `labels` (its `label` is the plural, `items.label` the singular);
  `min`/`max` `{ value, error }` objects and `admin.width: "half" | "full"` are removed;
  `FieldAdminConfigInput`/`FieldAdminConfig` take `<TCollectionSlug, TComponent>` and the
  per-type admin types that only added `condition` (array, checkbox, color, date, json,
  richtext, textarea, upload, row, tabs) are deleted.

- Updated dependencies [a4b9d68]
- Updated dependencies [6764c26]
  - @vexcms/core@0.1.0-alpha.27
  - @vexcms/better-auth@0.1.0-alpha.27

## 0.1.0-alpha.26

### Patch Changes

- 7d51f56: Richtext field shipped end to end (`richtext()`, root `editor:` adapter contract,
  inline images through the media collection, image resize/crop, upload-from-editor),
  and unpublish reworked to demote-and-promote: no history row is written; the
  previous published version's snapshot is promoted onto the live row in place, the
  taken-down version loses its `publishedAt`, and a confirmation dialog names the
  version that will take over. Old versions can be republished (or restored as the
  current draft) verbatim without creating new history rows; the new
  `vex_activeVersion` live-row pointer drives the history dropdown's Active marker.
- Updated dependencies [7d51f56]
  - @vexcms/core@0.1.0-alpha.26
  - @vexcms/better-auth@0.1.0-alpha.26

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
  - @vexcms/better-auth@0.1.0-alpha.25

## 0.1.0-alpha.24

### Patch Changes

- ff79cc3: Unified `versions.saveDraft` to cover both collections and globals through
  one endpoint, and `globals.upsert` no longer writes a draft row.

  **Breaking:** `vexConvexApi.versions.saveDraft`'s wire args changed from
  `{ collection, id, data, restoredFrom? }` to a union —
  `{ collection, id, data, restoredFrom? } | { global, data }`. The server
  `saveDraft({ ctx, config, ... })` helper and the client `saveDraft()` mutation
  factory (`@vexcms/core/server` / `@vexcms/core/client`) take the same union
  now; regenerate `convex/vex/versions.ts` against the new `versionsApi` if you
  copied it from an older template (no changes needed — `versionsApi` already
  registers the updated args shape).

  **Breaking:** `upsertGlobal` (`globals.upsert`) on a versioned global
  (`versions.drafts: true`) now writes the PUBLISHED row directly — same as
  `update()` on a versioned collection — instead of bootstrapping/patching a
  draft row. Save a global's draft through `versions.saveDraft({ global, data })`
  instead; `upsertGlobal` never touches a global's draft row anymore.
  `GlobalEditView`'s "Save Draft" button already calls the new endpoint.

  Also new on versioned collections:
  - `create()` now honors the resolved `versions.defaultStatus` ("draft" by
    default, configurable per collection via `versions: { defaultStatus }`):
    a `"published"` default also stamps `vex_publishedAt`, a `"draft"` default
    inserts a draft-only row. Either way, one history row is recorded.
  - `update()` now rejects a draft-row `id` with a `ConvexError` pointing the
    caller at `versions.saveDraft`, and records a `"published"`-status history
    row after every write to a versioned collection's published row.

- 372e801: **BREAKING: `useCollectionForm` and `useGlobalForm` are replaced by `useFieldsForm`.** Both
  hooks only ever read their config's `fields`, so the form hook now takes the field map
  directly and works for any owner of one. Migrate by passing `fields`:

  ```ts
  // before
  useCollectionForm({ collection, document, onSubmit });
  useGlobalForm({ global, document, onSubmit });
  // after
  useFieldsForm({ fields: collection.fields, document, onSubmit });
  useFieldsForm({ fields: global.fields, document, onSubmit });
  ```

  The submitted value's type is the `TData` generic (default `TDocument`) instead of being
  inferred from the config's slug — pass `useFieldsForm<DocumentBySlug["posts"]>(...)` to
  keep a per-collection type.

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
- Updated dependencies [865f360]
  - @vexcms/core@0.1.0-alpha.24
  - @vexcms/better-auth@0.1.0-alpha.24

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
  - @vexcms/better-auth@0.1.0-alpha.23

## 0.1.0-alpha.22

### Patch Changes

- 6e52134: `DashboardView` now renders a collection's or global's configured `admin.icon` beside its
  title on each dashboard card, matching how the sidebar already presents them. Cards for
  entries with no `admin.icon` are unchanged.
- 09d733d: Live preview follow-ups found in the manual verification pass.

  **`useLivePreviewDocumentQuery`.** The overlay only reaches documents a consumer hands it,
  and the existing `useLivePreviewQuery` sugar assumes a `getBySlug`-style array — so a
  component reading a singleton through a plain `useQuery` was invisible to live preview.
  Editing a `headers` document while previewing `/` changed nothing. The new sibling hook
  wraps a query that already resolves to ONE document (a `getFirst`-style read or a lookup
  by id), collapsing `null` into `undefined` so consumers have a single "nothing to render"
  case. Exported alongside its `LivePreviewDocumentQueryResult` result type; the
  `marketing-site` template's `SiteHeader` and `SiteFooter` now use it.

  **`admin.livePreview.url` accepts a literal path.** A collection or global that always
  previews in one place declares `url: "/"` rather than `url: () => "/"`.
  `LivePreviewUrlResolver` is now declared through a method-syntax/index-access indirection
  to keep `TDoc` bivariant: as a plain function type in property position it is strictly
  contravariant, which stops a still-generic `CollectionConfig` assigning to the concrete
  union the admin views hold, and method shorthand is not available to a member of a union.

  **The selected breakpoint survives the panel closing.** It is persisted per collection or
  global under `vex-live-preview-breakpoint:<slug>`, restored after mount rather than in a
  `useState` initializer — the admin page is server-rendered, and reading `localStorage`
  during render produced markup the server never emitted, leaving the restored button
  rendered inactive on the hydration mismatch.

  **The split re-measures when the preview is opened.** `useLivePreviewPanelMinSize` returned
  a `RefObject` and measured in a mount-only effect, so a split that mounts later — every
  time the editor opens the preview — kept the default floors. It now returns a callback ref
  and keys the `ResizeObserver` effect on the measured element.

  **Admin chrome.** Breadcrumbs render the collection's `admin.icon` beside its label, and
  the "View site" button sits immediately left of the breadcrumbs instead of being pushed to
  the opposite edge.

- Updated dependencies [09d733d]
  - @vexcms/core@0.1.0-alpha.22
  - @vexcms/better-auth@0.1.0-alpha.22

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

- 70d17e3: Move the package's `"use client"` boundary from a tsup banner into the source barrels
  (`src/index.ts`, `src/testing/index.ts`).

  No behavioral change to the published bundle: esbuild preserves an entry's directive
  prologue, so `dist/index.js` and `dist/testing/index.js` still open with exactly one
  `"use client";`, and the tsup `banner` that previously injected it is now redundant and
  removed (keeping both emitted the directive twice).

  The reason it has to live in the source: a monorepo app that resolves this package
  through its `exports.source` condition — which is how the workspace now gets Fast Refresh
  on package edits — imports `src/index.ts` directly, where a bundle banner does not exist.
  Without the directive there, the first RSC import fails with "You're importing a module
  that depends on useState into a React Server Component module". Marking the barrel
  reproduces the banner's semantics exactly: everything reachable from it joins the client
  graph.

- Updated dependencies [b5263dc]
  - @vexcms/core@0.1.0-alpha.21
  - @vexcms/better-auth@0.1.0-alpha.21

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
  - @vexcms/better-auth@0.1.0-alpha.20

## 0.1.0-alpha.19

### Patch Changes

- Updated dependencies [54636f9]
  - @vexcms/core@0.1.0-alpha.19
  - @vexcms/better-auth@0.1.0-alpha.19

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
  - @vexcms/better-auth@0.1.0-alpha.18

## 0.1.0-alpha.17

### Patch Changes

- d7384b6: Make the data-table bulk-actions bar reachable, and gate row selection on delete permission.

  The bar was mounted but unreachable — `DataTable` never rendered it, so selecting rows did
  nothing. Selection was also enabled unconditionally, which showed checkboxes to roles that
  cannot delete.

  `DataTableBulkActionsProps` is a breaking change for anyone rendering the component directly:
  it now takes `selectedCount`, `onDelete`, `onClear` and `isDeleting` instead of a
  `selection` object from `useTableSelection`. The `all` and `inverse` mode badges are removed;
  they were unreachable without a select-all-across-pages control.

- Updated dependencies [d7384b6]
  - @vexcms/core@0.1.0-alpha.17
  - @vexcms/better-auth@0.1.0-alpha.17

## 0.1.0-alpha.16

### Patch Changes

- `group()`'s top-level `defaultOpen` is replaced by `admin.defaultCollapsed`, mirroring
  `blocks()`' option of the same name (and Payload's) so every collapsible field in a config
  reads the same way. The default is `false` — a group is expanded on load, and `true` is the
  opt-in for secondary or rarely-edited groups.

  **Read access no longer disables form navigation.** `FormGroup` and `FormBlocks` passed
  `readOnly` into `AccordionItem`'s own `disabled` prop, so a caller holding read but not write
  access could not expand a `group`, `array` or `blocks` field to see values it was allowed to
  read. Collapsing is navigation, not editing — add/remove buttons, drag handles, the
  `blockName` input and every sub-field remain gated. `runNestedFieldContainerSuite` now pins
  this for all three containers across every child field type.

  **The accordion no longer flashes open on page load.** `AccordionContent` animates with a CSS
  transition on its inner wrapper's height, driven by Base UI's `data-starting-style`/
  `data-ending-style` and `--accordion-panel-height`, instead of the `animate-accordion-*`
  keyframes — which animated toward `--radix-accordion-content-height` and its Bits/Reka/Kobalte
  fallbacks, none of which Base UI sets. A panel that mounts open is now simply open. The
  trade-off: the open/close toggle is instant rather than animated. Restoring the animation
  requires keyframes defined against `--accordion-panel-height`.

  BREAKING CHANGE: `group()` no longer accepts a top-level `defaultOpen`. Use
  `admin.defaultCollapsed`, whose meaning is inverted — `defaultOpen: false` becomes
  `admin.defaultCollapsed: true`, and omitting it leaves the group expanded as before.

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.16
  - @vexcms/better-auth@0.1.0-alpha.16

## 0.1.0-alpha.15

### Minor Changes

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

### Patch Changes

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.15
  - @vexcms/better-auth@0.1.0-alpha.15

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
  - @vexcms/better-auth@0.1.0-alpha.14

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
  - @vexcms/better-auth@0.1.0-alpha.13

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
  - @vexcms/better-auth@0.1.0-alpha.12

## 0.1.0-alpha.11

### Patch Changes

- The "View site" button moved from `AppSidebar`'s header into the `AdminLayout`
  topbar.

  The sidebar is collapsible, so the button vanished along with it whenever an
  admin collapsed the sidebar to get more room — there was no way back out to
  the site short of editing the URL by hand. It now lives in the topbar next to
  `AdminTopNav`, positioned to the right of the breadcrumbs and before the
  `SidebarTrigger`, so it stays visible regardless of sidebar state. `ThemeToggle`
  stayed put in the sidebar header, which now renders just the "VexCMS Admin"
  title and the toggle.

  It still uses the established anchor-as-button pattern from
  `CollectionListView` — `nativeButton={false}` plus `render={<VexLink href="/" />}`
  — so the framework `Link` from `FrameworkComponentsContext` handles the
  navigation and Base UI emits `aria-disabled` rather than the `disabled`
  attribute, which is what `buttonVariants` actually styles.
  - @vexcms/core@0.1.0-alpha.11
  - @vexcms/better-auth@0.1.0-alpha.11

## 0.1.0-alpha.10

### Patch Changes

- `AppSidebar` now renders a "View site" button next to the theme toggle in the
  admin sidebar header.

  The panel is mounted under `basePath` inside the host app, so the site it
  manages is always at `/` — there was no way back out to it from inside the
  panel short of editing the URL by hand. The button links there with lucide's
  `ExternalLink` at `size="icon"` `variant="outline"`, matching `ThemeToggle`'s
  box exactly so the pair reads as one control group.

  It uses the established anchor-as-button pattern from `CollectionListView` —
  `nativeButton={false}` plus `render={<VexLink href="/" />}` — so the framework
  `Link` from `FrameworkComponentsContext` handles the navigation and Base UI
  emits `aria-disabled` rather than the `disabled` attribute, which is what
  `buttonVariants` actually styles. The label is `sr-only`; nothing in the
  header's 12px row grows.
  - @vexcms/core@0.1.0-alpha.10
  - @vexcms/better-auth@0.1.0-alpha.10

## 0.1.0-alpha.9

### Patch Changes

- @vexcms/core@0.1.0-alpha.9
- @vexcms/better-auth@0.1.0-alpha.9

## 0.1.0-alpha.8

### Patch Changes

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.8
  - @vexcms/better-auth@0.1.0-alpha.8

## 0.1.0-alpha.7

### Patch Changes

- 84f09e4: Fix `select` fields being unusable below the fold, and add a client hook for
  gating admin affordances.

  **Root cause.** Opening a `select` field on a scrolled admin page threw the
  viewport violently — measured on the real component as a 1341px jump that
  moved the trigger off the bottom of the screen. A floating popup is positioned
  by floating-ui a frame or two after it mounts; until then it sits wherever the
  portal put it — the end of `<body>`, thousands of pixels from the trigger. Two
  things reached into the popup during that window, and each natively scrolls
  the page to the popup's pre-position location:

  1. **cmdk** `scrollIntoView({ block: "nearest" })`s its highlighted item in a
     layout effect at mount — captured with a stack trace
     (`pageScroll 1380 → 39`). `scrollIntoView` walks every scrollable ancestor
     and has no `preventScroll` option; it cannot be made safe, only made a
     no-op.
  2. **Initial focus.** Base UI prevents scrolling only when focusing the popup
     element itself; inner tabbables like the search input get a plain
     `focus()`. The `search={false}` branch was worse — a mount-time
     `<button autoFocus>`, which fires strictly before positioning.

  `MultiSelectContent` now keeps its content at `display: none` until the popup
  is positioned — an element with no boxes is skipped by `scrollIntoView` per
  spec — then reveals it, focuses the search input (or the hidden keyboard
  target) with `preventScroll: true`, and performs the highlighted-item scroll
  itself inside the now-in-viewport popup. Regression tests pin that focus still
  lands on open. Verified against the live admin edit form: zero page movement
  with the trigger at the top, middle, and bottom of the viewport, through full
  open → pick → close cycles.

  **`MultiSelect` gains a `modal` prop** (default `false`). The popover was
  hardcoded modal, which locks page scroll — wrong for a form field on a normal
  page, needed inside a dialog so the popover joins that surface's focus trap.
  Fields are rendered generically with no prop channel, so the new
  `ModalSurfaceProvider` / `useModalSurface` pair carries it: `Modal` provides
  the surface and `SelectFieldInput` reads it.

  **New: `useCanAccessAdminPanel()`.** Evaluates the same `canAccessAdminPanel`
  predicate the admin route runs server-side, so an "Admin" link in site chrome
  cannot offer a destination that redirects to `/unauthorized`. Fails closed on
  missing access config or missing user — `hasPermission` alone returns `true`
  with no config, which is correct server-side ("RBAC not configured") and wrong
  client-side, where the same absence just means "no provider on this public
  route".

- 84f09e4: `GlobalEditView`'s header and form controls are now sticky, matching
  `CollectionEditView`: the title row pins below the admin top bar (`sticky top-12`
  over an opaque `bg-background`) so Save/Reset stay reachable while scrolling a
  long global — previously they scrolled away, which a global like `siteSettings`
  hits immediately once it carries SEO, theme, and social field groups.
- Updated dependencies [84f09e4]
  - @vexcms/core@0.1.0-alpha.7
  - @vexcms/better-auth@0.1.0-alpha.7

## 0.1.0-alpha.6

### Patch Changes

- Admin edit-form fixes found while dogfooding a live scaffold post-alpha.5.

  `FormBlocks` and `MediaUploadForm`'s block/file accordions are now controlled
  (`value`/`onValueChange`) instead of recomputing an uncontrolled `defaultValue`
  from live item state every render. Base UI's Accordion logs "A component is
  changing the default value state of an uncontrolled Accordion after being
  initialized" whenever that recomputed array differs from what it captured at
  mount — real whenever items load asynchronously (the owning document arriving
  after first mount) or files are appended after the accordion already
  mounted (multi-select "Add more" / a second drag-drop). Newly-appeared item
  ids still open according to `admin.defaultCollapsed`, and the user's manual
  toggles persist.

  `DragHandle` no longer throws `useDraggableInstanceContext must be called
from within a Draggable component` when it renders outside a `Draggable`
  ancestor — e.g. `FilledInput`'s single-value (non-`hasMany`) upload rows,
  which render a `DragHandle` for layout alignment but were never wrapped in
  `Draggable`. It now reads the ancestor context directly (nullable) and falls
  back to the same static/inert render already used when DnD isn't mounted or
  the handle is disabled, instead of requiring every caller to guarantee a
  `Draggable` wrapper.
  - @vexcms/core@0.1.0-alpha.6
  - @vexcms/better-auth@0.1.0-alpha.6

## 0.1.0-alpha.5

### Patch Changes

- Three small fixes found while dogfooding a live scaffold post-alpha.4.

  `FilledInput`'s per-item remove button now respects the upload field's
  `readOnly` config (`disabled={readOnly || Boolean(accessError)}`) instead of
  only disabling on an access error — collection views that mark the field
  read-only could still delete uploaded media.

  `AccordionTrigger`'s `postIconChildren` now render as a `Header` sibling
  instead of nested inside `AccordionPrimitive.Trigger`. The Trigger renders a
  native `<button>`, so a `<Button>` (or other interactive element) passed as
  `postIconChildren` produced invalid `<button>` nesting and a hydration error;
  moving it outside also drops the need for `e.stopPropagation()` to keep the
  action clickable without toggling the accordion.

  `create-vexcms`'s `base-nextjs` template auto-derives `next.config.ts`'s
  `images.remotePatterns` Convex hostname from `NEXT_PUBLIC_CONVEX_URL` instead
  of leaving a commented-out placeholder for the developer to fill in by hand;
  falls back to an empty list when the URL is unset or unparsable (e.g. a
  deployment-less build with `SKIP_ENV_VALIDATION`).
  - @vexcms/core@0.1.0-alpha.5
  - @vexcms/better-auth@0.1.0-alpha.5

## 0.1.0-alpha.4

### Minor Changes

- b111985: `generateUploadUrl` now carries the target collection: `VexMediaGenerateUploadUrlArgs` gains a
  required `collection` field, and `MediaUploadForm`/`MediaUploadDropzone` pass the target
  collection slug through, so storage adapters can scope upload URLs per collection.
  `FormBlocks` also fixes the inverted drag-handle guard (`disabled={!readOnly}` →
  `disabled={readOnly}`), which disabled block reordering exactly when the form was editable.

### Patch Changes

- Updated dependencies [b111985]
  - @vexcms/core@0.1.0-alpha.4
  - @vexcms/better-auth@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- Updated dependencies
  - @vexcms/better-auth@0.1.0-alpha.3
  - @vexcms/core@0.1.0-alpha.3

## 0.1.0-alpha.2

### Minor Changes

- 58265ed: Add the `color()` field. Stores a CSS colour string as `v.string()`, with a
  swatch picker in the admin form and a swatch cell in the list view.

  `format: "hex" | "rgb" | "hsl" | "oklch"` (default `"hex"`) selects the notation
  the picker writes; validation accepts all four, so changing `format` never
  invalidates existing documents.

  `color({ themeColors: true })` adds a picker tab listing the host application's
  CSS custom properties; selecting one stores `var(--token)`, so the colour
  follows the active colour scheme.

  `@vexcms/core` now exports `serializeColor`, `parseColor` and `ColorValue` — a
  dependency-free colour conversion layer covering hex, `rgb()`, `hsl()` and
  `oklch()`, round-trip exact across the 8-bit sRGB space.

  `@vexcms/core` also exports theming utilities from the colour field:
  `buildThemeCss({ theme, scope })` turns a stored theme document (`light`/`dark`
  token groups plus `radius`/`fontFamily`) into `:root` / `.dark` stylesheet text,
  with `scope: "admin"` emitting one specificity rung higher for an admin-panel
  override. `THEME_COLOR_TOKENS`, `THEME_SHARED_TOKENS`, `ThemeColorTokenKey` and
  `ThemeScope` are exported alongside.

  `@vexcms/react` components now use only shadcn's 32 design tokens. The
  non-standard `--primary-hover`, `--muted-foreground-subtle` and `--warning`
  tokens are replaced by `primary/90`, `muted-foreground` and `destructive`; the
  other thirteen were unused and are removed. Host apps whose stylesheets declared
  them can delete them.

  Field-type dispatch is now exhaustive: `adminFieldToValidator`,
  `adminFieldToInputSchema` and `getCollectionColumnDefs` assert their switches
  against `never`.

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

- bde8141: Enforce the `adminPanel` access gate, fix two authorization defects, and add a single switch for
  turning RBAC off.

  - `@vexcms/core`: new `canAccessAdminPanel()` answers the `adminPanel.access` gate without
    callers hand-typing the subject and action — nothing consulted that subject before, so any
    authenticated caller reached the admin panel regardless of the matrix. `defineAccess()` gains
    `enabled` (default `true`), checked inside `hasPermission`, so one field on the resolved config
    turns access control off for the server guards and the admin UI together. **Security fix:**
    `update` authorized against the caller-supplied patch rather than the stored document, letting
    a per-document rule be satisfied by the request body; it now fetches and checks the stored row,
    matching `get`/`find`/`remove`. `deleteMedia` now passes the stored document too, so
    per-document delete rules are satisfiable.
  - `@vexcms/react`: new `UnauthorizedView` for callers who fail an access check. `Button` gains
    `aria-disabled:*` variants so a link-rendered button (`nativeButton={false}`) actually greys
    out and stops responding — `disabled:*` never matched the rendered `<a>`. `CollectionListView`
    had its create button's `disabled` prop inverted; bulk delete is now permission-gated in both
    the collection and media list views.
  - `@vexcms/cli`: removed the unimplemented `schema/generateSchema.ts` stub (superseded by core's
    `generateVexSchema`, and already excluded from the package's own test run). JSDoc completed
    across the package; a `pushSchemaStandalone` description that claimed to run `convex deploy`
    now matches its actual `dev --once` behavior.
  - `@vexcms/better-auth`, `@vexcms/richtext-plate`, `create-vexcms`: JSDoc completed on exported
    symbols; unused imports and bindings removed. No behavior changes.

- Add `RenderBlocks` — a generic, typed dispatcher for `blocks()` field content: a `components`
  map keyed by `blockType`, each entry narrowed via `Extract<TBlock, { blockType: K }>`, an
  optional `fallback` for unrecognized block types, and `block.id` as the React key. Exported
  alongside `RenderBlocksProps`, `BlockComponents`, and `BlockComponentProps`. Replaces the
  hand-rolled block-type switch every consumer previously wrote — proven against `apps/test`'s
  `PageContent` — and is what both `create-vexcms` templates use to render page, header, and
  footer content.
- 7b1fa3c: Enable a zero-warning multi-package TypeDoc API reference and export supporting API.

  - Export `usePaginatedQuery` (`@vexcms/react`) and `StorageAdapterPresignedUrlInterface` plus its base interface (`@vexcms/core`) as public API.
  - Fix `RelationshipFieldAdminConfig` to extend the resolved admin base (`FieldAdminConfig`) instead of the input base, so resolved relationship admin properties are correctly required rather than optional.

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

- 4270b82: Fix `LucideIconName` accepting ~4,100 names that render nothing.

  `@vexcms/core` derived the type from a _default_ import of `lucide-react`
  (`import type icons from "lucide-react"`). `lucide-react` has no default export, so
  TypeScript synthesized one from the module namespace and `keyof typeof icons` widened to
  every module export — 5,843 members: alias exports (`AlertCircle`, `AlignCenter`), the
  `*Icon`-suffixed duplicates (`UsersIcon`), and non-icon exports (`icons`,
  `createLucideIcon`, `Icon`). None of those are keys of the `icons` map that
  `<Icon>` indexes at render time, so they type-checked and then rendered `null`.

  Both packages now derive the type from the `icons` map (`import type { icons }`), giving
  the exact 1,702 canonical names that render. `@vexcms/react` re-exports the core type
  instead of declaring its own, and the three `@ts-expect-error` directives in
  `AdminSidebar` that masked the two definitions diverging are gone.

  `<Icon>` still returns `null` for an unresolved name so untyped data cannot throw, but
  outside production it now reports the miss once per name with `console.warn` instead of
  failing invisibly.

  Breaking for configs that used an alias or `*Icon` name in `admin.icon`: switch to the
  canonical name from https://lucide.dev/icons (e.g. `"AlertCircle"` → `"CircleAlert"`,
  `"UsersIcon"` → `"Users"`). Those values never rendered.

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
- Updated dependencies [07924de]
- Updated dependencies [9e68058]
- Updated dependencies [7b1fa3c]
- Updated dependencies [b67c8ab]
  - @vexcms/core@0.1.0-alpha.2
  - @vexcms/better-auth@0.1.0-alpha.2

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

## 0.0.19

### Patch Changes

- 70a9c37: fix permissions bug and hydration error bug
- Updated dependencies [70a9c37]
  - @vexcms/core@0.0.19

## 0.0.18

### Patch Changes

- 959b166: fix checkPermissions bug that wasnt respecting proper config for certain scenarios
- Updated dependencies [959b166]
  - @vexcms/core@0.0.18

## 0.0.17

### Patch Changes

- 82a0384: update dashboard view to show globals, update default admin permissions to allow full access to all default tables in site template
- Updated dependencies [82a0384]
  - @vexcms/core@0.0.17

## 0.0.16

### Patch Changes

- d71661c: update next to 16.2.1 in catalog
- Updated dependencies [d71661c]
  - @vexcms/core@0.0.16

## 0.0.15

### Patch Changes

- 12b02aa: fix: strip access config from sanitized client config as it includes functions
- Updated dependencies [12b02aa]
  - @vexcms/core@0.0.15

## 0.0.14

### Patch Changes

- 7227569: fix: add back onboarding flow for site template in create cli package
- 46dd320: fix: add utils to resolve slugs in pages collection for site template
- Updated dependencies [7227569]
- Updated dependencies [46dd320]
  - @vexcms/core@0.0.14

## 0.0.13

### Patch Changes

- b72d981: added dom.iterable to convex tsconfig lib in templates
- Updated dependencies [b72d981]
  - @vexcms/core@0.0.13

## 0.0.12

### Patch Changes

- fff842b: create cli: add tsconfig json for convex in all templates
- Updated dependencies [fff842b]
  - @vexcms/core@0.0.12

## 0.0.11

### Patch Changes

- d2191b0: fix: add missing dependencies in package json file for marketing site template in create cli
- Updated dependencies [d2191b0]
  - @vexcms/core@0.0.11

## 0.0.10

### Patch Changes

- 2c61dab: add missing template files for marketing site scaffold in create cli
- Updated dependencies [2c61dab]
  - @vexcms/core@0.0.10

## 0.0.9

### Patch Changes

- 7d11f3c: 0.0.9
- Updated dependencies [7d11f3c]
  - @vexcms/core@0.0.9

## 0.0.8

### Patch Changes

- f8a86a1: lock @convex-dev/better-auth package to 0.10.11 since 0.10.13 doesnt work
- Updated dependencies [f8a86a1]
  - @vexcms/core@0.0.8

## 0.0.7

### Patch Changes

- 5c4b116: update template package versions, add a script that updates teh template package json versions for @vexcms packages to match the current version being published that happens on version:packages
- Updated dependencies [5c4b116]
  - @vexcms/core@0.0.7

## 0.0.6

### Patch Changes

- 9acf057: update tsconfig so its not using workspace configs for files that dont exist outside of the workspace when in the project dev setup
- Updated dependencies [9acf057]
  - @vexcms/core@0.0.6

## 0.0.5

### Patch Changes

- bfe4eef: update create vexcms package to ship dotfiles w underscore prefixes, then rename then back after pulling from package repo
- Updated dependencies [bfe4eef]
  - @vexcms/core@0.0.5

## 0.0.4

### Patch Changes

- 91be00e: update package readmes, add installation and getting started instructions, add version selection and port specification for create vexcms package
- Updated dependencies [91be00e]
  - @vexcms/core@0.0.4

## 0.0.3

### Patch Changes

- a1ca6dd: added the create vexcms cli package for scaffolding new projects using vexcms and all packages. www apps folder is working representation of this cli. added some bug fixes around versioning for collections w drafts enabled. some livePreview x versioning bug fixes. updated onboarding experience for the marketing site template w driver.js for an onboarding tour on first user sign in for each user. automatically make first user in convex db the admin user and autoredirect to the admin panel.
- Updated dependencies [a1ca6dd]
  - @vexcms/core@0.0.3

## 0.0.2

### Patch Changes

- 8218c73: add package readmes
- Updated dependencies [8218c73]
  - @vexcms/core@0.0.2
