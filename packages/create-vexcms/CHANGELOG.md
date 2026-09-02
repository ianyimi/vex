# create-vexcms

## 0.1.0-alpha.7

### Patch Changes

- 84f09e4: Rebuild the marketing template around the VexCMS site design, and fix five
  defects that made a scaffolded marketing site unusable.

  **Defects fixed**

  - `next.config.ts` pinned `turbopack.root` to the app directory, which is
    correct standalone but breaks every `--monorepo` scaffold: dependencies are
    hoisted into the workspace root store, so `next build` failed with "Could not
    find the Next.js package". It now walks up for `pnpm-workspace.yaml` and falls
    back to the app directory.
  - The marketing overlay's `(frontend)/(site)/page.tsx` collided with base's
    `(frontend)/page.tsx` — both resolve to `/`, and base's bare bootstrap page
    won, so the seeded marketing home page was unreachable. The installer now
    removes base's home route when the overlay is applied.
  - The marketing site inherited base's fail-closed session gate, which guards
    every route but `/`. `/features`, `/roadmap` and every other CMS page
    redirected anonymous visitors to sign-in. The overlay now ships its own
    `proxy.ts` guarding `/admin/:path*`; base's remains fail-closed.
  - `anyApi` was used for client-side reads in `PageContent`, `SiteHeader` and
    `SiteFooter`, discarding types in a project that has a fully generated `api`.
    All reads now go through `@convex/_generated/api`.
  - `logoImage` was passed straight to `<img src>`, but an `upload()` field stores
    an array of media ids — the logo never rendered. A new `MediaImage` component
    resolves the id through the storage adapter and renders `next/image`.

  **Template**

  - Three new blocks — `Stats`, `CodeShowcase` (shiki-highlighted, server-rendered)
    and `Split`.
  - `Hero` gains `variant` (`full` / `compact`) and `installCommand`;
    `Roadmap`'s `status` becomes `shipped | in-progress | planned | exploring`.
  - All eight existing renderers rebuilt against the design; new shared
    `Container`, `SectionHeader`, `BrandMark`, `CopyButton`, `InstallCommand`,
    `CodePane` and `MediaImage` components.
  - Renderers now import their generated block types from `vex.types.ts` instead
    of re-declaring field shapes by hand.
  - `shiki` is added by the installer for marketing scaffolds only, so `--bare`
    does not pay for it.
  - A fresh scaffold now passes `lint` with zero problems; previously it reported
    17 errors and 214 warnings before any code was written.

  **Admin readability.** Every collection and global in the marketing template
  now declares `admin.icon`, so the sidebar reads as labelled sections rather
  than a list of identical entries — `pages` `FileText`, `headers` `PanelTop`,
  `footers` `PanelBottom`, alongside the existing `themes` `Palette`, `images`
  `Image`, `users` `Users` and `siteSettings` `Settings`. Every field across
  every collection, global and block config now carries an explicit `label`
  (`users.name` was the last one relying on key inference), and the seeded home
  hero sets its `variant` and `installCommand` values so no shipped block leaves
  a field blank that the design expects filled.

  The array item headers were the worst of it: `FormLabel` falls back to the
  field's path when a field has no label, and `group()` defaults `label` to `""`
  (only `defineCollection` infers one), so every repeatable item rendered as
  `[10] - blocks[3].items[9]`. The `group()` passed as each array's `items` now
  carries a singular label, so the admin reads `[10] - Roadmap Item`,
  `[2] - Feature`, `[3] - Menu Item` and so on across all 12 array fields.

## 0.1.0-alpha.6

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

## 0.1.0-alpha.4

### Patch Changes

- b111985: Template iteration round proven in a live scaffold: the marketing overlay wires the theme
  system end to end (overlay root layout + admin layout with scoped `ThemeStyle`/`ThemeLive`,
  `ThemeScript` in base kills the light-mode flash) and gains a headless `FirstAdminBootstrap`;
  `next.config.ts` pins `turbopack.root` so scaffolds nested inside an outer monorepo stop
  adopting the outer lockfile; Tailwind's `@source` scan narrows to package `dist` output and
  excludes `public/`; the users collection gains a `name` field with `useAsTitle`; marketing
  seed data adds features/roadmap pages and corrects block defaults (GitHub links, alpha badge).

## 0.1.0-alpha.3

### Patch Changes

- Fix the default (`--orgs` declined) scaffold, which failed `pnpm build` — the installer stripped
  the organization plugin but ten checked-in template files still referenced `organization`
  unconditionally. `configureOrganizations(false)` now also strips organization wiring down to the
  org-free shape (`convex/vex.ts`, `convex/vex/globals.ts`, `convex/vex/media.ts`,
  `convex/auth/api.ts`, `src/auth/access.ts`, `src/context/AuthContext.tsx`,
  `src/auth/hasPermission.ts`, `src/db/constants/index.ts`, and `src/vexcms/api.ts` for full
  scaffolds) instead of leaving them referencing a table that no longer exists once the first
  `vex dev` regen drops the organization tables from the generated registry. Every transform throws
  loudly when its expected pattern is missing, instead of silently no-opping on template drift.
  `--orgs` accepted scaffolds are untouched.

  Also: the `base-nextjs` template's `convex/tsconfig.json` drops the deprecated `baseUrl` and adds
  `types: ["node"]` (the relocated `convex/auth/options.ts` reads `process.env`) and
  `../src/vex.types.ts` to `include`, so the convex program actually sees the generated
  `vex.types.ts` module augmentation instead of typing `settings`/`user` as `{}`/`unknown`.
  `README.md`'s (and the root `create-vexcms` README's, and the docs quickstart guide's) stand-up
  sequence now documents `npx convex env set SITE_URL ...` / `npx convex env set
BETTER_AUTH_SECRET ...` — Better Auth runs inside the Convex deployment and never reads
  `.env.local`, and omitting this step is the most common cause of a `403` on first sign-in.

  Also drops the unused `motion` dependency from the `base-nextjs` template.

## 0.1.0-alpha.2

### Minor Changes

- Ship real `base-nextjs` and `marketing-site` templates, previously README stubs: auth, admin
  panel, media, users, and the first-admin bootstrap flow in `base-nextjs`; pages, headers,
  footers, themes, `siteSettings`, 8 marketing blocks, theme wiring, and seed data in the
  `marketing-site` overlay. Add `--monorepo` (catalog-aware, targets `apps/<name>` under the
  nearest `pnpm-workspace.yaml`) and `--yes` (accepts every prompt's default) flags.

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

## 0.0.19

### Patch Changes

- 70a9c37: fix permissions bug and hydration error bug

## 0.0.18

### Patch Changes

- 959b166: fix checkPermissions bug that wasnt respecting proper config for certain scenarios

## 0.0.17

### Patch Changes

- 82a0384: update dashboard view to show globals, update default admin permissions to allow full access to all default tables in site template

## 0.0.16

### Patch Changes

- d71661c: update next to 16.2.1 in catalog

## 0.0.15

### Patch Changes

- 12b02aa: fix: strip access config from sanitized client config as it includes functions

## 0.0.14

### Patch Changes

- 7227569: fix: add back onboarding flow for site template in create cli package
- 46dd320: fix: add utils to resolve slugs in pages collection for site template

## 0.0.13

### Patch Changes

- b72d981: added dom.iterable to convex tsconfig lib in templates

## 0.0.12

### Patch Changes

- fff842b: create cli: add tsconfig json for convex in all templates

## 0.0.11

### Patch Changes

- d2191b0: fix: add missing dependencies in package json file for marketing site template in create cli

## 0.0.10

### Patch Changes

- 2c61dab: add missing template files for marketing site scaffold in create cli

## 0.0.9

### Patch Changes

- 7d11f3c: 0.0.9

## 0.0.8

### Patch Changes

- f8a86a1: lock @convex-dev/better-auth package to 0.10.11 since 0.10.13 doesnt work

## 0.0.7

### Patch Changes

- 5c4b116: update template package versions, add a script that updates teh template package json versions for @vexcms packages to match the current version being published that happens on version:packages

## 0.0.6

### Patch Changes

- 9acf057: update tsconfig so its not using workspace configs for files that dont exist outside of the workspace when in the project dev setup

## 0.0.5

### Patch Changes

- bfe4eef: update create vexcms package to ship dotfiles w underscore prefixes, then rename then back after pulling from package repo

## 0.0.4

### Patch Changes

- 91be00e: update package readmes, add installation and getting started instructions, add version selection and port specification for create vexcms package

## 0.0.3

### Patch Changes

- a1ca6dd: added the create vexcms cli package for scaffolding new projects using vexcms and all packages. www apps folder is working representation of this cli. added some bug fixes around versioning for collections w drafts enabled. some livePreview x versioning bug fixes. updated onboarding experience for the marketing site template w driver.js for an onboarding tour on first user sign in for each user. automatically make first user in convex db the admin user and autoredirect to the admin panel.
