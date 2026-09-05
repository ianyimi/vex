# @vexcms/richtext

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

## 0.1.0-alpha.11

### Patch Changes

- @vexcms/core@0.1.0-alpha.11

## 0.1.0-alpha.10

### Patch Changes

- @vexcms/core@0.1.0-alpha.10

## 0.1.0-alpha.9

### Patch Changes

- @vexcms/core@0.1.0-alpha.9

## 0.1.0-alpha.8

### Patch Changes

- Updated dependencies
  - @vexcms/core@0.1.0-alpha.8

## 0.1.0-alpha.7

### Patch Changes

- Updated dependencies [84f09e4]
  - @vexcms/core@0.1.0-alpha.7

## 0.1.0-alpha.6

### Patch Changes

- @vexcms/core@0.1.0-alpha.6

## 0.1.0-alpha.5

### Patch Changes

- @vexcms/core@0.1.0-alpha.5

## 0.1.0-alpha.4

### Patch Changes

- Updated dependencies [b111985]
  - @vexcms/core@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- @vexcms/core@0.1.0-alpha.3

## 0.1.0-alpha.2

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
