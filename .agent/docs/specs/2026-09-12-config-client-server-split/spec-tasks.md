---
status: draft
spec_id: 2026-09-12-config-client-server-split
touches:
  - packages/core/src/config
  - packages/core/src/media
  - packages/core/src/index.ts
  - packages/file-storage-convex/src
  - packages/file-storage-convex/package.json
  - packages/cli/src/lib
  - packages/cli/src/commands
  - packages/react/src/context
  - packages/react/src/components
  - packages/react/src/hooks
  - packages/react/src/testing
  - packages/react/src/index.ts
  - packages/next/src
  - packages/create-vexcms/templates
  - apps/test/src
  - apps/test/convex
  - apps/www/src
  - apps/www/convex
  - apps/docs/src/content/docs
prompt_version: 1
---

# 2026-09-12-config-client-server-split — Tasks

Split the monolithic `vex.config.ts` into a client-safe config the browser imports
directly and a server-only config that layers on adapters and codegen settings.
Delete the RSC serialization path entirely.

Every step below leaves `pnpm build` and `pnpm test` green. `sanitizeConfigForClient`
stays alive until Step 6 precisely so that Steps 1–5 never break the workspace.

---

## Step 1 — Core: `VexClientConfig`, `defineConfig`, `defineServerConfig` — [dev]

Introduce the two-config type layer and repoint every existing config file at it.
`VexConfig` keeps its name and its exact current resolved shape, so every server
and Convex reader continues to compile untouched — only the import path moves.

- `packages/core/src/config/types.ts` — add `VexClientConfigInput` / `VexClientConfig`
  (admin, access, collections, globals, mediaCollections, basePath, routes,
  storage.clientUploads, authCollections, schema, types).
  `VexServerConfigInput` carries ONLY `auth` and `storage.adapters` — the fields that
  would break a client bundle. The `auth` group mirrors the storage group's shape and
  requires `adapter` within it (`auth` present ⇔ adapter present); `auth.outputPath`
  lives ONLY there, beside the adapter it describes, so a path without an adapter is a
  type error. `storage.clientUploads` is client-only and the server type forbids it.
  `VexConfig` keeps its name and extends `VexClientConfig`; the old bare
  `VexConfig.auth: VexAuthAdapter` (zero readers repo-wide) becomes
  `auth?: { adapter, outputPath }`.
- `packages/core/src/config/config.ts` — `defineConfig(input): VexClientConfig` takes
  over the name; `defineServerConfig(client, serverInput): VexConfig` is new.
  Auth-collection merging, `internalCollections`, access validation, and upload-field
  reference validation move into `defineConfig`. `defineServerConfig` validates that
  every `mediaCollection.meta.storageAdapter` has a registered adapter instance.
- Rename `apps/{test,www}/src/vex.config.ts` and both
  `packages/create-vexcms/templates/*/src/vex.config.ts` to `vex.config.server.ts`,
  add the client half beside each, repoint all 24 importers.

Why: every later step depends on these two types existing. Doing the call-site
migration here — rather than later — is what keeps the workspace compiling, because
the server config's resolved shape is byte-identical to today's `VexConfig`.

Verify:
- [x] `pnpm --filter @vexcms/core test` passes, including a new purity test asserting `defineConfig(input)` called twice deep-equals (guards the double module eval)
- [x] `defineServerConfig` throws a named error when a media collection names an unregistered adapter
- [x] `pnpm build` green across the workspace; `pnpm --filter test typecheck` and `--filter www typecheck` clean
- [x] No file outside `apps/*/src/vex.config*.ts` and the templates references `defineConfig` with a server field

## Step 2 — Split `@vexcms/file-storage-convex` into client and server entries — [agent]

`packages/file-storage-convex/src/config.ts:14` imports `ConvexStorageAdapter`, so
`defineMediaCollection` currently drags the Convex server SDK into any graph that
touches it. The client config declares media collections, so that import has to go.

- Split `config.ts` into `mediaCollection.ts` (`defineMediaCollection`, client-safe)
  and `storage.ts` (`convexFileStorage`).
- Add a `./client` subpath to `packages/file-storage-convex/package.json` exporting
  `defineMediaCollection` and `uploadFile` — importing from `./adapter/uploadFile`
  directly, never through the `./adapter` barrel.
- Move media collection declarations out of `convexFileStorage({ mediaCollections })`
  and onto the client config in both apps and both templates; the server adapter is
  now constructed with no collection list.

Why: the client config cannot declare media collections until `defineMediaCollection`
is reachable without the adapter. Adapter-specific field injection is unaffected —
it already happens in `defineMediaCollection` (`config.ts:64-101`), not in the adapter.

Verify:
- [x] A scratch script that imports only `@vexcms/file-storage-convex/client` resolves with no `convex/server` in its module graph (assert via `node --experimental-import-meta-resolve` or a bundler trace)
- [x] `pnpm --filter @vexcms/file-storage-convex test` passes
- [x] Admin panel in `apps/test` still lists the `images` media collection (attach to the developer's running server per P-024)

## Step 3 — CLI: server config resolution and auth-collection codegen — [dev]

Auth collections are computed from the full better-auth options
(`packages/better-auth/src/adapter.ts:97`), which can never reach the browser. The
CLI emits them as a client-safe artifact instead.

- `packages/cli/src/lib/resolveConfigPath.ts` — prefer `vex.config.server.{ts,mts,js,mjs}`,
  fall back to `vex.config.*` with a clear error naming both.
- New `packages/cli/src/lib/generateAuthCollections.ts` — writes the resolved
  `AuthCollectionConfig[]` to `auth.outputPath` (server-config codegen field beside the adapter,
  default `/src/vex.auth.ts`).
- `packages/cli/src/lib/loadConfig.ts` — placeholder bootstrap for the generated
  file when absent, mirroring the existing `convex/vex.schema.ts` placeholder at
  `loadConfig.ts:131`, so a clean checkout resolves the client→server import cycle.
- `defineServerConfig` gains a drift check: the adapter's live collections must match
  the generated ones the client config carries, else throw "run `vex generate`".

Why: the CLI is the only place that can legally evaluate the auth adapter, and the
drift check is what stops the generated artifact silently going stale.

Verify:
- [x] `rm apps/test/src/vex.auth.ts && pnpm --filter test exec vex generate` regenerates it and the app boots
- [x] Editing a `modelName` in `apps/test/src/auth/options.ts` without regenerating makes `defineServerConfig` throw the drift error (negative test, per AP-013)
- [x] `vex dev`, `vex generate`, `vex deploy` all resolve `vex.config.server.ts`
- [x] `pnpm --filter @vexcms/cli test` passes, including a `resolveConfigPath` case for each precedence branch

## Step 4 — React: one `VexConfigProvider`, three contexts collapse to one — [agent]

- `packages/react/src/context/VexConfigContext.tsx` — add `VexConfigProvider`;
  context type becomes `VexClientConfig`; default value is `defineConfig()` with no
  sanitize.
- Delete `VexAccessContext.tsx` and `StorageAdapterContext.tsx`. `useVexAccess()`
  becomes `useVexConfig().access`; `useStorageAdapterMap()` becomes
  `useVexConfig().storage.clientUploads`. Both hooks keep their names and signatures —
  only their bodies change, so their 4 consumers are untouched.
- `packages/react/src/testing/` — `testClientConfig` becomes a real `defineConfig(...)`
  result with no `as unknown as` cast; same for the two `stubClientConfig` literals.
  `renderWithVexProviders` takes `config` in place of `access`.
- Rewrite `clientProviders.tsx` in both apps and both templates to mount the single
  provider with a direct `~/vex.config` import.

Why: the provider must be mounted from a module the app owns, because only the app
can import its own config into the client graph. Collapsing the three contexts is what
makes that a single mount instead of three.

Verify:
- [x] `pnpm --filter @vexcms/react test` passes
- [x] The three `as unknown as ClientVexConfig` casts (`viewHarness.tsx:55`, `fieldInputContract.ts:120`, `nestedFieldContainer.ts:62`) are gone, not re-typed
- [x] Upload + media picker still work in `apps/test`'s admin panel
- [x] `usePermission` gating still hides the same affordances across all five `rbacState` scenarios

## Step 5 — Delete every config-shaped prop crossing the RSC boundary — [dev]

- Drop the `config` prop from `AdminLayout`, `AppSidebar`, `AdminTopNav`,
  `DashboardView`, `GlobalsListView` — all read `useVexConfig()`.
- Replace the `collection` / `global` / `mediaCollection` props on `CollectionListView`,
  `CollectionEditView`, `MediaCollectionListView`, `MediaCollectionEditView`,
  `GlobalEditView`, `CreateDocumentModal`, `CreateMediaModal` with a slug, resolved
  from context (P-001: pass slugs, not config objects).
- Delete the two "read from context, fall back to the RSC-serialized prop" blocks
  (`CollectionListView.tsx:62-66`, `MediaCollectionListView.tsx:75-78`) — there is now
  one provenance.
- `NextAdminPage` passes slugs and `initialData` only. `NextAdminLayout` and
  `NextAdminLayoutClient` lose their `config` prop entirely.

Why: this is the actual goal. With one provenance, the eval-#1/eval-#2 identity
question disappears by construction rather than by audit.

Verify:
- [x] `grep` finds no `config: ClientVexConfig` or `collection: CollectionConfig` prop in `packages/react/src/components` or `packages/next/src`
- [x] All four admin routes render in `apps/test`: dashboard, collection list, collection edit, global edit
- [x] Editing a field's `label` in a collection file hot-reloads the admin table header without a full page reload (the Fast Refresh property `VexConfigContext.ts:10-15` claims)

## Step 6 — Delete the serialization layer — [agent]

- Delete `packages/core/src/config/sanitizeConfig.ts` and its test, and the
  `ClientVexConfig` / `sanitizeConfigForClient` / `stripNonSerializable` exports from
  `config/index.ts` and `src/index.ts`.
- `packages/core/src/framework.ts:56` — `FrameworkAdapterProps` takes `VexClientConfig`.
- Remove the now-false RSC-sanitization paragraphs from the TSDoc on
  `NextAdminLayout`, `NextAdminLayoutClient`, `NextAdminPage`, and `VexConfigContext`.

Why: leaving it exported is a second convention that will be reached for.

Verify:
- [x] `grep -r "sanitizeConfigForClient\|stripNonSerializable\|ClientVexConfig"` returns zero hits outside the docs step
- [x] `pnpm build && pnpm test` green

## Step 7 — Scaffold and runtime verification — [dev]

Why: only a real scaffold run and a live admin session prove the split works end to end.

Verify: manual
- [x] `create-vexcms` scaffolds `base-nextjs` in every supported mode and the admin panel loads (AP-020: only a real scaffold run finds template defects)
- [x] Same for `marketing-site`, including `seed:init`
- [x] A scaffolded app's client bundle contains no `better-auth`, no `BETTER_AUTH_SECRET`, and no Convex server SDK — checked against the real build output, not by inspection
- [x] `apps/test` and `apps/www` admin panels: sign in, browse a collection, edit and save a document, upload an image, check a permission-gated affordance

## Step 8 — Documentation — [agent, at commit time]

Run after Steps 1–7 land and touch-ups are done.

- `apps/docs/src/content/docs/guides/`: `access-control.mdx` (VexAccessProvider →
  VexConfigProvider), `auth.mdx`, `caching-and-seo.mdx`, `globals.mdx`, `local-api.mdx`,
  `framework-adapters.md`, `theming.mdx`
- `apps/docs/src/content/docs/fields/`: `relationship.mdx:90-94` (delete the
  `ClientVexConfig` paragraph), `upload.mdx:101-125`
- READMEs: root, `packages/{core,next,react,cli,create-vexcms}`, both template READMEs
- TSDoc `@example` blocks showing the old single-config pattern:
  `NextAdminLayout.tsx:36-49`, `NextAdminPage.tsx:36-46`,
  `file-storage-convex/src/config.ts:143-153`, `core/src/config/config.ts:23-41`,
  `core/src/config/types.ts:166-176`
- `.agent/docs/standards/preferences.md`: P-004 and P-005 are superseded — both state
  that `access` travels by direct client import *because* the RSC prop strips it.
  Rewrite, do not append beside them.
- `.agent/docs/product/backlog.md`: log multi-adapter media collections (needs
  per-document adapter routing; `media/api/mutations.ts:57,113` route by collection).

Verify:
- [x] `pnpm --filter docs build` green
- [x] No doc shows `defineConfig` with `auth.adapter` or `storage.adapters`, and no doc shows `defineServerConfig` with `schema`, `types`, or `storage.clientUploads`
- [x] Quickstart followed start to finish produces a working admin panel

## Step 9 — Auth collections by function, not codegen — [agent]

Amendment (2026-09-15, developer review of Steps 1–8). The generated
`src/vex.auth.ts` artifact is replaced by a real function the client config calls.

Measured facts that shape it (browser-target esbuild + `tsc --strict` probes):
`getAuthTables` reads ONLY data (`plugins[].schema`, modelNames/fields/additionalFields,
`rateLimit`, `secondaryStorage` presence) and accepts plain `{ id, schema }` plugin
descriptors — 4.6 KB min / 1.1 KB gzip. Instantiating REAL plugin factories client-side
instead costs +684 KB min / +154 KB gzip, so descriptors are the only viable client path.
A better-auth client plugin carries no runtime schema (`$InferServerPlugin: {} as …`),
so `authClient` can never produce collections. Plugin NAMES and per-plugin OPTION types
are derivable at zero runtime cost via `import type * as P from "better-auth/plugins"`;
plugin SCHEMA data is not (inconsistent type exposure, and `organization({teams})` adds
tables at call time).

- `packages/better-auth/src/pluginSchemas.generated.ts` — snapshot of every
  `better-auth/plugins` factory's `.schema` (plus named variants for option-dependent
  plugins, e.g. `organization` with teams), written by
  `packages/better-auth/scripts/genPluginSchemas.ts` (`pnpm gen:auth-schemas`).
- `packages/better-auth/src/collections.ts` — `betterAuthCollections(props)`:
  declarative `plugins` record + modelNames/additionalFields + `extraSchema` escape
  hatch, expanded into plain plugin descriptors and run through the EXISTING
  `betterAuthAdapter` pipeline (no duplicated conversion logic).
- `packages/better-auth/src/client.ts` + a `./client` export subpath — the only entry the
  browser imports; must never reach `./convex`.
- Plugin-name union derived from the namespace; a compile-time exhaustiveness assertion
  makes a newly added upstream plugin a typecheck failure inside this package, naming it.
- Drift moves server-side and loses its artifact: `defineServerConfig` compares the live
  `auth.adapter.collections` against the client config's declaration and throws
  `VexAuthConfigError` naming the divergence. `hashAuthCollections`,
  `VEX_CLI_BOOTSTRAP`, `generateAuthCollections`, `loadConfig`'s two-phase bootstrap,
  `auth.outputPath`, and every `src/vex.auth.ts` are deleted. Access validation returns
  to `defineConfig` (the bootstrap hole that forced it server-side is gone).
- `create-vexcms` drops its post-install `vex generate`; `verify-scaffold.mjs` drops the
  `vex generate` step; both apps and both templates call the function in `vex.config.ts`.

Why: a generated JSON-shaped module imported by a hand-authored config is the worst part
of the setup experience, and it exists only to move data the browser can compute from
~1 KB of descriptors. Auto-update lives in this package (generator + test) instead of in
every user's project (hash + "run `vex generate`").

Verify:
- [x] `pnpm --filter @vexcms/better-auth test` passes, including the parity test asserting `betterAuthCollections` equals `betterAuthAdapter({ config })` for every generated plugin entry
- [x] No `vex.auth.ts` anywhere; `grep -rn "hashAuthCollections\|VEX_CLI_BOOTSTRAP\|generateAuthCollections\|outputPath" packages/core/src packages/cli/src` returns zero auth hits
- [x] `defineServerConfig` throws `VexAuthConfigError` when `authOptions` and the client config's `betterAuthCollections(...)` call disagree (negative test, per AP-013)
- [x] A browser-target bundle of a client `vex.config.ts` contains no better-auth plugin code (traced, then the probe deleted)
- [x] `pnpm build && pnpm test` green; `node scripts/verify-scaffold.mjs` green; `apps/test` admin still lists every auth collection
