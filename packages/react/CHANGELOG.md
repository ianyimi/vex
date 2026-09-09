# @vexcms/ui

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
