# @vexcms/admin-next

## 0.1.0-alpha.22

### Patch Changes

- Updated dependencies [6e52134]
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
