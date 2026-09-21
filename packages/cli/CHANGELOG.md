# @vexcms/cli

## 0.1.0-alpha.22

## 0.1.0-alpha.21

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

## 0.1.0-alpha.19

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

## 0.1.0-alpha.17

### Patch Changes

- d7384b6: Remove the unimplemented auto-migration helpers from the public API.

  `diffSchema`, `planMigration`, `makeFieldsOptional` and `addRemovedFieldsAsOptional` were
  exported from `@vexcms/core` but stubbed — `diffSchema` returned an empty diff for every
  input and `planMigration` an empty operation list, so any caller silently migrated nothing.
  They now live on a new `@vexcms/core/internal` subpath that exists for sibling `@vexcms/*`
  packages only and carries no stability guarantee; `@vexcms/cli` is repointed at it.

  `schema.autoMigrate: true` now throws at `defineConfig()` instead of silently doing nothing.
  `autoMigrate` was never declared on `SchemaConfigInput`, so a TypeScript config could not set
  it; the guard covers untyped and spread configs. The default is unchanged.

  `SchemaConfigInput` and `TypesConfigInput` JSDoc no longer advertise `autoMigrate` /
  `autoRemove` defaults that never existed, and `TypesConfigInput` now states its real default
  (`/src/vex.types.ts`, not `/convex/vex.schema.ts`).

## 0.1.0-alpha.16

## 0.1.0-alpha.15

## 0.1.0-alpha.14

## 0.1.0-alpha.13

## 0.1.0-alpha.12

## 0.1.0-alpha.11

## 0.1.0-alpha.10

## 0.1.0-alpha.9

## 0.1.0-alpha.8

## 0.1.0-alpha.7

## 0.1.0-alpha.6

## 0.1.0-alpha.5

## 0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- `patchConvexTsconfig` no longer injects `baseUrl` into `convex/tsconfig.json` — it's deprecated
  in TypeScript 6/7 and errors under `moduleResolution: "Bundler"`. A `baseUrl` of exactly `"."`
  left over from an older scaffold is now actively deleted (self-heal for already-scaffolded
  alpha.2 projects). The patcher also now ensures `../src/vex.types.ts` is listed in `include` —
  Convex rewrites this file on every provisioning pass and would otherwise drop it, making the
  project's `GeneratedVexTypes` module augmentation invisible to the convex program.

## 0.1.0-alpha.2

### Minor Changes

- Drop per-collection Convex file generation (`generateCollectionFiles`, and the call to it from
  `vex generate`/`vex dev`). The emitted `convex/vex/api/*` and `convex/vex/model/api/*` files had
  no consumers under the factory-registered runtime API (`collectionsApi` et al.) — `vex
generate`/`vex dev` now only write `vex.schema.ts` and `vex.types.ts`.

  BREAKING: a project relying on the generated per-collection query/mutation files must migrate to
  the factory-registered API exposed by `@vexcms/core`. Bumped `minor` rather than `major` —
  these packages are pre-1.0 alpha.

- 07924de: Per-call `access: { action?, bypass? }` options on every server API function and
  `vexServerApi` wrapper, resolved through a single `resolveAccessCall` seam. Custom
  actions gain their first runtime consumer; `readDrafts` rides the same seam for the
  upcoming versioning feature. `vex generate` emits `CustomActionsBySlug`, and
  `QueryCallActionFor`/`MutationCallActionFor` type `access.action` per collection slug.

  BREAKING: `defaultPermissionMode` is removed from `VexAccessConfigInput` — the
  undeclared-permission posture is always deny; write a role-level `"*": true` for
  allow-style roles. `skipAccess` on `vexServerApi` is replaced by `access: { bypass: true }`.

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
