---
status: draft
spec_id: 2026-09-12-config-client-server-split
touches:
  - packages/core/src/config/**
  - packages/core/src/media/**
  - packages/core/src/framework.ts
  - packages/core/src/index.ts
  - packages/file-storage-convex/**
  - packages/cli/src/lib/**
  - packages/cli/src/commands/**
  - packages/react/src/context/**
  - packages/react/src/components/**
  - packages/react/src/hooks/**
  - packages/react/src/testing/**
  - packages/react/src/index.ts
  - packages/react/package.json
  - packages/next/src/**
  - packages/create-vexcms/templates/**
  - apps/test/src/**
  - apps/test/convex/**
  - apps/www/src/**
  - apps/www/convex/**
  - apps/docs/src/content/docs/**
prompt_version: 1
---

# 2026-09-12-config-client-server-split — Spec

## Overview

`sanitizeConfigForClient` (`packages/core/src/config/sanitizeConfig.ts:134-141`) nulls every
function in the config it sends across the RSC boundary — its `Sanitized<T>` type maps
`(...args: any[]) => any` to `null` (`sanitizeConfig.ts:27-28`) — and drops `access` entirely
(`sanitizeConfig.ts:139`, `ClientVexConfig = Sanitized<Omit<VexConfig, "access">>` at line 14).
Every field `validate`, `condition`, and custom `components` function is silently `null` on the
client, and three separate providers (`VexAccessProvider`, `StorageAdapterContextProvider`, plus
config-shaped props threaded past the RSC boundary) exist only to smuggle the live values around
that hole. This spec removes the boundary instead of continuing to work around it: the config
splits into a client-safe half the browser imports directly and a server-only half that layers on
adapters and codegen, so nothing that must stay a real function ever needs to cross a
serialization edge in the first place.

## Design Decisions

1. **Two config files, `vex.config.ts` (client-safe) and `vex.config.server.ts` (thin wrapper).**
   The plain name goes on the client half because it is the file the user edits daily — new
   collections, fields, and admin settings all land there; the server file only adds the auth
   adapter, storage adapters, and codegen settings, so the name it keeps should not be the one
   in the developer's frequent path.
2. **`VexConfig` keeps its name and current resolved shape; `VexClientConfig`/`VexClientConfigInput` are new types.** Every existing server-side and Convex reader (`packages/core/src/config/config.ts:48-53`
   consumes `config.collections`; `packages/core/src/media/api/mutations.ts:57,113` looks up
   `storage.adapters`) keeps compiling with zero changes to its own code — the migration for
   those call sites is an import repoint from `~/vex.config` to `~/vex.config.server`, not a
   type rewrite.
3. **`defineServerConfig` spreads the client config rather than nesting it.** `VexConfig`
   structurally contains every `VexClientConfig` field alongside the server-only fields
   (`auth.adapter`, `storage.adapters`). The rejected nesting alternative
   (`{ client: VexClientConfig, server: {...} }`) would have forced every
   existing `config.collections`/`config.access`/`config.routes` reader in the codebase to
   rewrite to `config.client.collections`, turning a two-file split into a repo-wide signature
   change for no behavioral gain.
3a. **Placement rule: a field goes on the server config ONLY if putting it on the client config
   would break the client bundle.** Not "only if the server reads it" — server-side readership is
   irrelevant, because `VexConfig` spreads `VexClientConfig` and the CLI loads the server config
   anyway, so a field on the client half is still reachable from every server consumer. The test
   is purely: does this value drag a server SDK, a class instance, or an env read into the
   browser graph? Only `auth.adapter` and `storage.adapters` do. Everything else — including
   `schema` and `types`, which only the CLI ever reads
   (`packages/cli/src/lib/generateSchema.ts:105,122,134,165`) — lives on `vex.config.ts`,
   because they are inert path strings and booleans. The DX this buys is the point of the whole
   split: `vex.config.ts` is the single file a developer opens to change any project setting, and
   `vex.config.server.ts` is a fixed two-line wrapper they write once at scaffold time and never
   revisit. A rule of "whatever the server reads" would have scattered settings across two files
   and forced the developer to remember which, for no safety gain.
   One documented exception: `auth.outputPath` sits on the SERVER config beside
   `auth.adapter` even though it is an inert path string. An output path for the generated
   auth artifact is meaningless without the adapter that generates it, so the server-side
   `auth` group requires `adapter` and carries `outputPath` optionally — making
   "configured a path but no adapter" a type error instead of a silent no-op. Coupling
   beats colocation here.
4. **Auth collections reach the client by codegen, not by adapter re-evaluation.** The auth
   adapter cannot run in a browser graph: `betterAuthAdapter` computes its collections via
   `getAuthTables(props.config)` (`packages/better-auth/src/adapter.ts:97`), which needs the
   full better-auth options object; those options read `process.env.SITE_URL` and
   `process.env.BETTER_AUTH_SECRET` (`apps/test/src/auth/options.ts:16,22,26`); and the plugin
   list pulls `better-auth/next-js`'s `nextCookies` (`apps/test/src/auth/plugins.ts:1-5`), which
   reaches `next/headers` — a hard build error in a client bundle. `vex generate` evaluates the
   adapter server-side once and writes a plain `AuthCollectionConfig[]` array to a generated
   module; `defineServerConfig` recomputes a hash of the live adapter's collections and compares
   it against the generated `authCollectionsHash`, throwing a named error instructing the
   developer to re-run `vex generate` the moment the two drift.
5. **Media collections are declared on the client config.** This loses no adapter-side
   enforcement because `defineMediaCollection` (`packages/file-storage-convex/src/config.ts:64-101`)
   is what injects the adapter-specific fields and hardcodes `meta.storageAdapter: "convex"` at
   line 95 — the enforcement already lives in the collection-authoring function, not in the
   adapter instance. `validateAndMergeStorageConfig` (`packages/core/src/media/config.ts:64-88`)
   only flattens `adapter.mediaCollections` and re-stamps the same `meta.storageAdapter` value
   `defineMediaCollection` already set, so moving the declaration site changes nothing it checks.
6. **Three contexts collapse to one `VexConfigProvider`; `VexAuthContext` and
   `VexRevalidateContext` stay separate.** `VexAccessProvider` and `StorageAdapterContextProvider`
   exist only to carry pieces of the config that `sanitizeConfigForClient` used to strip, so once
   the client imports the real config directly there is one value (`VexClientConfig`) to provide,
   not three. `VexAuthContext` (per-request signed-in user) and `VexRevalidateContext`
   (app-level revalidation wiring) are not config — they carry request- and app-scoped data that
   has no client-config analogue and would gain nothing from merging.
7. **Every config-shaped prop crossing server → client is deleted; components resolve by slug
   from context.** Per P-001, a prop carrying a config object the referenced entity may not
   exist for at authoring time is replaced with a slug the component resolves from
   `useVexConfig()` — this retires the `AdminLayout.tsx:44`/`CollectionListView.tsx:57-61`/
   `MediaCollectionEditView.tsx:33-49` family of props and the two context-with-RSC-prop-fallback
   blocks (`CollectionListView.tsx:62-66`, `MediaCollectionListView.tsx:75-78`). `NextAdminPage`
   keeps its `config: VexConfig` prop because it is a Next.js Server Component handing data to
   another server function (`fetchQuery`) — server → server is not an RSC serialization
   boundary, so there is nothing to strip and nothing to fix there.
8. **Double module evaluation is accepted and bounded.** The client config module compiles into
   both the server bundle graph and the browser bundle graph and evaluates once in each, so the
   server and the browser each hold their own deep-equal but reference-unequal copy of the
   resolved `VexClientConfig` object tree. Three failure modes follow from that and this repo's
   measured position on each: identity comparisons across the two copies — none exist; every
   config comparison audited in `packages/{core,react,next}/src` is slug/string-keyed
   (`props.activeSlug === collection.slug`, `fieldKey === collection.admin.useAsTitle`) with zero
   object-identity checks and zero `WeakMap` usage; dual provenance, where a component might see
   the server's copy via a stale RSC prop and the client's copy via context at once — eliminated
   by Decision 7, which deletes every such prop so there is exactly one provenance; and eval
   nondeterminism, where the two evaluations could disagree — ruled out because `defineConfig` is
   pure (default merge, auth-collection merge, media derivation, access validation — no
   `Date.now`, `Math.random`, module-level mutable registry, or env read), a property Step 1 pins
   with a deep-equal purity test asserting two calls to `defineConfig(input)` produce equal trees.
9. **`sanitizeConfigForClient`, `stripNonSerializable`, and `ClientVexConfig` are deleted
   outright rather than deprecated.** Leaving a working-but-obsolete serialization path exported
   is a second convention next to direct-context access, and a second convention that compiles
   is one a future change will reach for by accident; the codebase keeps exactly one way for a
   component to get its config.

## Out of Scope

- **Multi-adapter media collections** — one collection whose documents live across different
  storage backends. This would need per-document adapter routing, not per-collection: `media/api/mutations.ts:57,113`
  route by collection today. Logged to the backlog (Step 8), not built here.
- **Any change to RBAC enforcement semantics.** P-004's advisory-UI-gating posture — a
  hidden/disabled affordance is UX, server API guards remain the enforcement point — is
  unchanged; this spec changes only how `access` physically reaches the client (direct import
  into `VexConfigProvider` instead of a separate `VexAccessProvider`), never what it is allowed
  to gate or how strongly.
- **Any new field types, views, or admin features.** This is a config plumbing change; no new
  user-facing capability ships alongside it.
- **Changes to the Convex schema generation output.** `schema`/`types` move onto the client
  config per Design Decision 3a, but they remain codegen-only settings read solely by the CLI
  (`packages/cli/src/lib/generateSchema.ts:105,122,134,165`); their generated output format is
  untouched.
- **`@vexcms/richtext-plate`.** Not part of the config split; no config field this package reads
  changes shape or provenance.
- **Localization.** No localization work is in scope for this spec.

## Implementation

### Step 1 — Core: `VexClientConfig`, `defineConfig`, `defineServerConfig` — [dev]

Introduce the two-config type layer and repoint every existing config file at it.
`VexConfig` keeps its name; it now extends `VexClientConfig` and spreads it structurally
(not nested), so every server and Convex reader that does `config.collections` continues
to compile untouched — only the import path (`./vex.config` → `./vex.config.server`) moves.

- [ ] `packages/core/src/config/types.ts` — add `VexClientConfigInput`, `VexClientConfig`, `VexServerConfigInput`; redefine `VexConfig` to extend `VexClientConfig`
- [ ] `packages/core/src/config/config.ts` — `defineConfig(input): VexClientConfig` takes over the name; new `defineServerConfig(props): VexConfig`
- [ ] `packages/core/src/media/config.ts` — `validateAndMergeStorageConfig` sheds its adapter-flattening and cross-adapter slug-collision checks
- [ ] `packages/core/src/config/hashAuthCollections.ts` — new pure hash helper shared by the CLI emitter (Step 3) and the drift check
- [ ] `packages/core/src/config/config.test.ts` — purity test, drift-check negative test, unregistered-adapter negative test, spread test, merge-order test
- [ ] `packages/core/src/config/index.ts`, `packages/core/src/index.ts` — export the new types and `defineServerConfig`
- [ ] `apps/test/src/vex.config.ts` + `apps/test/src/vex.config.server.ts`
- [ ] `apps/www/src/vex.config.ts` + `apps/www/src/vex.config.server.ts`
- [ ] Repoint the 24 `~/vex.config` importers to `~/vex.config.server` (list below)

#### packages/core/src/config/types.ts

4 edits. Everything not shown is unchanged.

**1 — imports.** Beside the existing `import { VexAccessConfig } from "../access";`, add
the `AuthCollectionConfig` / `VexAuthAdapter` import (`VexAuthAdapter` is already imported
for the old `VexConfigInput.authAdapter` field and stays):

```ts
import { AuthCollectionConfig, VexAuthAdapter } from "../auth/types";
```

**2 — new `VexClientConfigInput`, added immediately before the existing `VexConfigInput`
interface.** This is `VexConfigInput` with only the auth adapter and `storage.adapters`
removed, plus a new `authCollections` field (the codegen artifact `vex generate` produces
in Step 3; declared here because Step 1 must compile before Step 3 exists — the field is
optional and unused until then). `admin`,
`access`, `collections`, `globals`, `basePath`, `routes`, `schema`, and `types` all move
here VERBATIM (same JSDoc). Per the placement rule in Design Decision 3a, `schema` and
`types` stay with the developer-facing settings even though only the CLI reads them —
they are inert path strings, not bundle hazards. `storage` is redeclared here as
`{ clientUploads }` only.

```ts
/**
 * User-facing, client-safe configuration input passed to `defineConfig()`.
 *
 * Every property here is safe to import directly into a browser bundle: no
 * server SDKs, no environment variables, no class instances. Auth
 * collections reach this input as data — `authCollections`, the codegen
 * artifact `vex generate` writes to `auth.outputPath` — never as the live
 * auth adapter, which requires the full server-side auth options object.
 *
 * @see {@link VexClientConfig} for the resolved return type
 * @see {@link VexServerConfigInput} for the server-only half layered on by `defineServerConfig()`
 * @see {@link defineConfig} for the config function
 */
export interface VexClientConfigInput {
  /**
   * Admin panel configuration. All properties are optional — omitted values fall back to defaults.
   *
   * **Defaults applied by `defineConfig()`:**
   * ```ts
   * { sidebar: { side: "left" } }
   * ```
   *
   * @see {@link AdminConfigInput} for all available options
   */
  admin?: AdminConfigInput;
  access?: VexAccessConfig;
  /** Content collections to register with the CMS. Defaults to `[]` if omitted. */
  collections?: CollectionConfig[];
  /** Singleton global documents. Each produced by `defineGlobal()`. Slugs must be unique. */
  globals?: GlobalConfig[];
  /**
   * Media collections declared directly on the client config (moved off the
   * storage adapter — see `packages/core/src/media/config.ts`). Each entry
   * is the output of a storage package's `defineMediaCollection()`
   * (e.g. {@link file-storage-convex/src!defineMediaCollection} from
   * `@vexcms/file-storage-convex`), which is itself client-safe.
   *
   * @see {@link MediaCollectionConfig} for the resolved shape
   */
  mediaCollections?: MediaCollectionConfig[];
  /**
   * Auth collections emitted by `vex generate` (Step 3) and imported from the
   * generated `vex.auth.ts` module. Absent until Step 3 lands; `defineConfig()`
   * treats a missing value as `[]`. Never author this array by hand — it is
   * merged with `collections` the same way the live adapter would merge them,
   * so the shapes the admin panel renders are identical whether the app has
   * run `vex generate` yet or not.
   *
   * @see {@link AuthCollectionConfig} for the emitted shape
   * @see {@link mergeAuthCollections} for the merge logic
   */
  authCollections?: AuthCollectionConfig[];
  /**
   * URL prefix for all admin panel routes.
   *
   * Default: `"/admin"`. Override when mounting the admin UI at a custom path
   * (e.g. `"/cms"` or `"/dashboard/admin"`).
   */
  basePath?: string;
  /**
   * Maps documents to the public paths that render them. Omit for a project
   * with no public pages, or whose public pages read no CMS documents.
   *
   * Cache revalidation is its first consumer — a save purges the paths `map`
   * returns — but the same answer also drives admin "View page" links, sitemap
   * URLs, and preview links, so it is named for what it describes rather than
   * for one user of it.
   *
   * @see {@link VexRoutesConfig} for all available options
   */
  routes?: VexRoutesConfig;
  /**
   * Client-side upload functions, keyed by storage adapter slug.
   *
   * These are the only storage-adapter-shaped values allowed on the client
   * config — plain serializable functions, never the adapter class instance.
   * `useStorageAdapterMap()` reads this map directly.
   *
   * @see {@link ClientUploadMap} for the value shape
   */
  storage?: {
    clientUploads?: ClientUploadMap;
  };
  /**
   * Schema generation configuration — output path and auto-migration flags.
   * All properties are optional; omitted values fall back to defaults.
   *
   * Read only by the CLI (`packages/cli/src/lib/generateSchema.ts`), never by
   * the browser — but it lives here rather than on the server config because
   * it is a plain settings object that breaks nothing in a client bundle, and
   * `vex.config.ts` is the one file the developer edits for settings.
   *
   * @see {@link SchemaConfigInput} for all available options
   */
  schema?: SchemaConfigInput;
  /**
   * Type generation configuration — where `vex.types.ts` is written.
   *
   * @see {@link TypesConfigInput} for all available options
   */
  types?: TypesConfigInput;
}
```

**3 — new `VexServerConfigInput`, added immediately after the (now client-only)
`VexConfigInput` block is replaced.** This carries exactly the two fields that would break
a client bundle: `auth.adapter` and `storage.adapters`. Nothing else — per Design Decision
3a, server-side readership is not the criterion. `VexConfigInput` itself is deleted —
nothing outside `vex.config.server.ts` files constructs it directly anymore, and
`defineServerConfig` takes `VexServerConfigInput` instead.

```ts
/**
 * Server-only configuration input passed to `defineServerConfig()`, layered
 * on top of an already-resolved `VexClientConfig`.
 *
 * The gate for membership here is Design Decision 3a: a field appears in
 * this interface only if placing it on the client config would break the
 * client bundle. `auth.adapter` and `storage.adapters` are the only such
 * fields. `auth.outputPath` also lives here — the one documented exception
 * to 3a — because the group makes it impossible to configure an output
 * path without an adapter to generate from: `adapter` is REQUIRED within
 * the group, so `auth` present ⇔ adapter present.
 *
 * @see {@link VexClientConfig} for the client half this layers onto
 * @see {@link VexConfig} for the resolved return type
 * @see {@link defineServerConfig} for the config function
 */
export interface VexServerConfigInput {
  /**
   * Auth configuration — mirrors the `storage` group's shape: the adapter
   * instance under `.adapter`, settings beside it. The group is optional,
   * but `adapter` is required WITHIN it: `server.auth` present guarantees
   * an adapter, so no consumer needs a nested existence check.
   */
  auth?: {
    /**
     * Auth adapter to register authentication collections (user, session,
     * account, verification, etc.) alongside user-defined collections.
     *
     * Pass the return value of an auth adapter (e.g.
     * {@link better-auth/src!betterAuthAdapter} from `@vexcms/better-auth`).
     * `vex generate` evaluates this adapter to produce the `authCollections`
     * array the client config imports — `defineServerConfig()` re-derives the
     * same collections here and throws if they have drifted from what was
     * generated.
     *
     * @see {@link VexAuthAdapter} for the adapter interface
     * @see {@link better-auth/src!betterAuthAdapter} for the Better Auth implementation
     */
    adapter: VexAuthAdapter;
    /**
     * Path `vex generate` writes the client-safe `AuthCollectionConfig[]`
     * artifact to, relative to the project root. Lives here — not on the
     * client config — so it cannot be configured without the adapter it
     * describes.
     *
     * Default: `"/src/vex.auth.ts"`.
     */
    outputPath?: string;
  };
  /**
   * Storage configuration — server-side adapter instances only. Media
   * collections themselves are declared on the client config; adapters here
   * are consulted only to confirm every `mediaCollection.meta.storageAdapter`
   * resolves to a registered instance.
   *
   * `clientUploads` is deliberately NOT accepted here. `VexConfigProvider`
   * mounts the CLIENT config, so an upload function supplied only on the
   * server config would exist server-side and never reach the browser —
   * the admin upload UI would silently have no uploader. The type forbids
   * the mistake instead of letting it fail at runtime.
   *
   * @see {@link VexStorageAdapter} for the adapter interface
   */
  storage?: {
    /** Storage adapters configured for the project. */
    adapters: VexStorageAdapter[];
  };
}
```

`schema` and `types` are deliberately NOT here — see the placement rule in Design Decision 3a.
They are plain path strings that break nothing in a client bundle, so they live on
`VexClientConfigInput` beside every other setting the developer edits. `auth` is the deliberate
inverse: the whole group — adapter AND `outputPath` — is server-only, because an output path for
a generated auth artifact is meaningless without the adapter that generates it, and requiring
`adapter` within the group makes that dependency a type error rather than a convention.

**4 — replace the old `VexConfig` interface.** `VexConfig` now `extends VexClientConfig`
and adds only the server-only resolved fields. Every field that was already on the old
`VexConfig` (`admin`, `collections`, `globals`, `basePath`, `routes`, `mediaCollections`)
is inherited unchanged from `VexClientConfig` (edit below) — nothing about their shape
changes, so `config.collections` reads identically before and after this step. `auth`
(renamed from the old `VexConfig.auth`, kept) and `storage.adapters` move to being spread
alongside `storage.clientUploads` rather than a separate optional block, because
`defineServerConfig` always resolves both halves. `access` and `storage` are declared here
too because TypeScript does not let an `extends`ed interface narrow an inherited optional
member to required — restating them keeps `access?:` and `storage: {...}` (now required,
both halves populated) exactly as wide as `VexClientConfig` already made them, so this is
documentation of the merge, not a shape change:

```ts
/**
 * Resolved client-side Vex CMS configuration after `defineConfig()` applies
 * defaults. Structurally contained by {@link VexConfig} — every field here
 * is also readable on a full `VexConfig`, so server code written against the
 * old monolithic shape continues to compile.
 *
 * @see {@link VexClientConfigInput} for the user-facing input type
 * @see {@link defineConfig} for the config function
 */
export interface VexClientConfig {
  /** Resolved admin panel configuration — always fully populated after defaults are applied. */
  admin: AdminConfig;
  access?: VexAccessConfig;
  /**
   * All registered content collections — user-defined collections merged
   * with `authCollections` and internal collections, in that order. Always
   * an array after defaults are applied.
   *
   * @see {@link mergeAuthCollections} for the merge order and precedence rules
   */
  collections: CollectionConfig[];
  /** Resolved global configs. Always present; defaults to `[]`. */
  globals: GlobalConfig[];
  /**
   * Media collections declared on the client config, validated against
   * `upload()` field references. Always present; defaults to `[]`.
   *
   * @see {@link MediaCollectionConfig} for the resolved shape
   */
  mediaCollections: MediaCollectionConfig[];
  /**
   * Auth collections as emitted by `vex generate`, before merging into
   * `collections`. Always present; defaults to `[]` when the project has
   * not configured an auth adapter or has not yet generated the artifact.
   *
   * @see {@link AuthCollectionConfig} for the emitted shape
   */
  authCollections: AuthCollectionConfig[];
  /** URL prefix for all admin panel routes — always set after defaults are applied. */
  basePath: string;
  /**
   * Resolved route map. `undefined` when the project never configured
   * `routes` — it is opt-in.
   */
  routes?: VexRoutesConfig;
  /**
   * Client-side upload functions, keyed by storage adapter slug. Always
   * present; defaults to `{}`.
   *
   * @see {@link ClientUploadMap} for the value shape
   */
  storage: { clientUploads: ClientUploadMap };
  /**
   * Resolved schema generation configuration — always fully populated after
   * defaults are applied. Consumed by the CLI only; present on the client
   * config because it is inert settings data, not a bundle hazard.
   */
  schema: SchemaConfig;
  /** Resolved type generation configuration — always fully populated after defaults are applied. */
  types: TypesConfig;
}

/**
 * Resolved Vex CMS configuration after `defineServerConfig()` layers server
 * settings onto an already-resolved `VexClientConfig`. Structurally contains
 * every client field via `extends` (spread, not nested) — every existing
 * server-side or Convex `config.collections` / `config.access` reader
 * compiles unchanged against this type.
 *
 * @see {@link VexServerConfigInput} for the user-facing server input type
 * @see {@link defineServerConfig} for the config function
 */
export interface VexConfig extends VexClientConfig {
  /**
   * Auth configuration, present only when the server config registered an
   * adapter. Mirrors `storage`'s shape: adapter instance under the group,
   * settings beside it. `adapter` is required within the group —
   * `config.auth` present ⇔ adapter present, so consumers check the group
   * once and never null-check `adapter` inside it. `outputPath` is
   * defaulted to `"/src/vex.auth.ts"` by `defineServerConfig`.
   *
   * Replaces the old bare `VexConfig.auth: VexAuthAdapter` field. The
   * restructure is risk-free: the old `config.auth` has ZERO readers in the
   * repo today (verified by grep across `packages/*/src`, `apps/*/src`,
   * `apps/*/convex` — every `.auth` hit is the per-request `args.auth`, not
   * the config field), so it was written by `defineConfig` and never
   * consumed. Step 3's `generateAuthCollections` (reading `auth.adapter`)
   * is the group's first real consumer.
   *
   * @see {@link VexAuthAdapter} for the adapter interface
   * @see {@link better-auth/src!betterAuthAdapter} for the Better Auth implementation
   */
  auth?: { adapter: VexAuthAdapter; outputPath: string };
  /** Storage adapters and client-side upload functions, both always resolved. */
  storage: { clientUploads: ClientUploadMap; adapters: VexStorageAdapter[] };
}
```

#### packages/core/src/config/config.ts

Both functions' logic changes; the whole file is shown complete.

```ts
import { AccessResource } from "../access";
import { validateAccessConfig } from "../access/validateAccessConstraints";
import { mergeAuthCollections } from "../auth/mergeCollections";
import { VexAuthConfigError } from "../auth/types";
import { internalCollections } from "../collections/internal";
import { validateAndMergeStorageConfig, VexStorageConfigError } from "../media";
import { hashAuthCollections } from "./hashAuthCollections";
import {
  VexClientConfig,
  VexClientConfigInput,
  VexConfig,
  VexServerConfigInput,
} from "./types";

/**
 * Resolves a raw client config input into a fully-populated `VexClientConfig`.
 *
 * Applies defaults for any omitted properties — an absent `collections`
 * array is replaced with an empty array so downstream consumers can always
 * iterate without null-checking. Pure: same input always produces a
 * deep-equal (not reference-equal) output, so evaluating this module twice
 * in one bundle graph (server + browser) is safe.
 *
 * `authCollections` (the `vex generate` codegen artifact) are merged with
 * user-defined collections via {@link mergeAuthCollections}, then
 * `internalCollections` are appended. Protected auth collections cannot be
 * overridden, and locked fields are preserved.
 *
 * @param config - The raw client configuration supplied by the caller.
 * @returns The resolved `VexClientConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * // Basic config with user-defined collections only
 * defineConfig({
 *   collections: [
 *     defineCollection({ slug: "posts", fields: { title: text() } }),
 *   ],
 * });
 * ```
 *
 * @example
 * ```ts
 * // Config with codegen'd auth collections
 * import { authCollections } from "./vex.auth";
 *
 * defineConfig({
 *   authCollections,
 *   collections: [posts, authors],
 * });
 * ```
 *
 * @see {@link VexClientConfigInput} for the user-facing input type
 * @see {@link VexClientConfig} for the resolved return type
 * @see {@link mergeAuthCollections} for auth collection merge logic
 * @see {@link defineServerConfig} for the server layer built on top of this result
 */
export function defineConfig(config?: VexClientConfigInput): VexClientConfig {
  const userCollections = config?.collections ?? [];
  const authCollections = config?.authCollections ?? [];
  const collections = mergeAuthCollections({
    authCollections,
    userCollections,
  }).concat(internalCollections);

  // Media collections are pre-declared on the client config as of the
  // client/server split — no adapter flattening happens here anymore.
  const mediaCollections = config?.mediaCollections ?? [];

  // Upload-field-reference and slug-collision validation moved here from
  // `validateAndMergeStorageConfig` (see media/config.ts below): this
  // function alone knows whether `mediaCollections` covers every
  // `upload().to` reference, since storage adapters no longer reach the
  // client config at all.
  const { uploadFields } = validateAndMergeStorageConfig({ collections });

  if (uploadFields.length > 0) {
    const mediaSlugs = new Set(mediaCollections.map((c) => c.slug));
    const missing = new Set<string>();
    for (const uploadField of uploadFields) {
      if (!mediaSlugs.has(uploadField.to)) {
        missing.add(uploadField.to);
      }
    }
    if (missing.size > 0) {
      throw new VexStorageConfigError(
        `upload() fields reference missing media collections: ${[...missing].join(", ")}. ` +
          `Define these collections via a storage adapter's defineMediaCollection(). ` +
          `Available media collections: ${[...mediaSlugs].join(", ") || "none"}.`,
      );
    }
  }

  // Slug collisions between regular collections and media collections —
  // same check, same error class, that `validateAndMergeStorageConfig` used
  // to run before media collections moved onto the client config directly.
  const collectionSlugs = new Set(collections.map((c) => c.slug));
  for (const mediaCollection of mediaCollections) {
    if (collectionSlugs.has(mediaCollection.slug)) {
      throw new VexStorageConfigError(
        `Slug collision: "${mediaCollection.slug}" is defined as both a collection and a media collection. ` +
          `Collection and media collection slugs must be unique.`,
      );
    }
  }

  if (config?.access) {
    // Access rules can target regular collections, media collections, or
    // globals, so all three are concatenated into one resource list before
    // validating the resulting graph.
    const allResources: AccessResource[] = (
      collections.concat(mediaCollections) as AccessResource[]
    ).concat(config?.globals ?? []);
    validateAccessConfig({
      ...config.access,
      resources: allResources,
    });
  }

  return {
    basePath: "/admin",
    ...config,
    access: config?.access,
    collections,
    globals: config?.globals ?? [],
    mediaCollections,
    authCollections,
    admin: {
      ...config?.admin,
      sidebar: {
        side: "left",
        collapsible: "offcanvas",
        ...config?.admin?.sidebar,
      },
    },
    storage: {
      clientUploads: config?.storage?.clientUploads ?? {},
    },
    schema: {
      outputPath: "/convex/vex.schema.ts",
      ...config?.schema,
    },
    types: {
      outputPath: "/src/vex.types.ts",
      ...config?.types,
    },
    // Opt-in: left `undefined` when the project never configured it, so every
    // consumer reads `config.routes?.map`.
    routes: config?.routes,
  };
}

/**
 * Layers server-only settings onto an already-resolved `VexClientConfig`,
 * producing the full `VexConfig` every server-side and Convex reader
 * consumes.
 *
 * Validates that every `mediaCollection.meta.storageAdapter` resolves to a
 * registered adapter instance, and that the client config's
 * `authCollections` have not drifted from what the live auth adapter would
 * produce today — a stale `vex.auth.ts` throws rather than silently serving
 * outdated collections to the browser.
 *
 * @param props - `config` and the server-only settings to layer on.
 * @param props.config - The resolved `VexClientConfig`, typically the
 *   default export of `vex.config.ts`.
 * @param props.server - Server-only settings: the auth adapter and the storage
 *   adapter instances. Nothing else belongs here — see Design Decision 3a.
 * @returns The resolved `VexConfig`, structurally containing every field of `props.config`.
 * @throws {VexStorageConfigError} When a media collection names an unregistered storage adapter.
 * @throws {Error} (named auth-drift error) When `config.authCollections` disagrees with
 *   the live auth adapter's collections — run `vex generate`.
 *
 * @example
 * ```ts
 * import config from "./vex.config";
 * import { betterAuthAdapter } from "@vexcms/better-auth";
 *
 * export default defineServerConfig({
 *   config,
 *   server: {
 *     auth: { adapter: betterAuthAdapter({ config: authOptions }) },
 *     storage: { adapters: [convexFileStorage()] },
 *   },
 * });
 * ```
 *
 * @see {@link VexServerConfigInput} for the user-facing server input type
 * @see {@link VexConfig} for the resolved return type
 * @see {@link hashAuthCollections} for the drift-check hash
 */
export function defineServerConfig(props: {
  config: VexClientConfig;
  server?: VexServerConfigInput;
}): VexConfig {
  const { config, server } = props;

  // Every media collection's storage adapter must resolve to a registered
  // instance — media collections are declared on the client config, but the
  // adapters that back them are only known once the server config lands.
  const registeredNames = new Set(
    (server?.storage?.adapters ?? []).map((adapter) => adapter.name),
  );
  const unresolved = config.mediaCollections.filter(
    (mediaCollection) => !registeredNames.has(mediaCollection.meta.storageAdapter),
  );
  if (unresolved.length > 0) {
    const missing = unresolved
      .map(
        (mediaCollection) =>
          `"${mediaCollection.slug}" → "${mediaCollection.meta.storageAdapter}"`,
      )
      .join(", ");
    throw new VexStorageConfigError(
      `Media collection(s) reference unregistered storage adapters: ${missing}. ` +
        `Registered storage adapters: ${[...registeredNames].join(", ") || "none"}.`,
    );
  }

  // Auth-collection drift check: `config.authCollections` is the `vex
  // generate` codegen artifact, frozen at generation time. Re-hash the live
  // adapter's collections and compare — a stale artifact must fail loudly
  // rather than silently serving outdated collections to the browser.
  if (server?.auth) {
    const outputPath = server.auth.outputPath ?? "/src/vex.auth.ts";
    const liveHash = hashAuthCollections({ authCollections: server.auth.adapter.collections });
    const declaredHash = hashAuthCollections({ authCollections: config.authCollections });
    if (liveHash !== declaredHash) {
      throw new VexAuthConfigError(
        `authCollections in the client config are out of date with the live auth adapter ` +
          `(declared hash ${declaredHash}, live hash ${liveHash}). Run \`vex generate\` to refresh ${outputPath}.`,
      );
    }
  } else if (config.authCollections.length > 0) {
    throw new VexAuthConfigError(
      `config.authCollections has ${config.authCollections.length} entries but no auth adapter ` +
        `is registered on the server config. Register \`server.auth.adapter\` to validate them, ` +
        `or run \`vex generate\` after removing the adapter to clear the generated artifact.`,
    );
  }

  return {
    ...config,
    auth: server?.auth
      ? { adapter: server.auth.adapter, outputPath: server.auth.outputPath ?? "/src/vex.auth.ts" }
      : undefined,
    storage: {
      clientUploads: config.storage.clientUploads,
      adapters: server?.storage?.adapters ?? [],
    },
  };
}
```

#### packages/core/src/media/config.ts

3 edits. `validateAndMergeStorageConfig` keeps ONLY the upload-field-existence guard
(checks 1) and loses adapter flattening (moved: media collections now arrive pre-declared
on the client config) and the cross-adapter duplicate-slug check (moot: there is one flat
`mediaCollections` array, not one per adapter, so there is nothing to de-duplicate across).
The upload-field-reference check (checks 2) and the collection/media-collection slug
collision check (check 3) move into `defineConfig` (see `config.ts` edit 4 above), because
they need `config.mediaCollections`, which no longer exists at this function's call site —
this function no longer receives `storageAdapters` at all, since `defineConfig` never sees
adapter instances. Every check that moves still throws the same `VexStorageConfigError`
class, so error identity for existing callers (and their tests) is unchanged.

**1 — narrow the input/output shape.** Replace `StorageValidationInput` /
`StorageValidationOutput`:

```ts
interface StorageValidationInput {
  collections: CollectionConfig[];
}

interface StorageValidationOutput {
  uploadFields: { collectionSlug: string; fieldName: string; to: MediaCollectionSlug }[];
}
```

**2 — replace the function body.** `validateAndMergeStorageConfig` now only collects and
returns upload-field references — it performs no throwing itself; `defineConfig` throws
using the returned list, since it alone knows whether `mediaCollections` covers them:

```ts
/**
 * Collects `upload()` field references from a set of collections.
 *
 * Media collections are declared directly on the client config as of the
 * client/server config split — this function no longer flattens adapter
 * collections or resolves adapter-name collisions. `defineConfig()` uses
 * the returned list to validate every `upload().to` slug against the
 * client config's own `mediaCollections` array.
 *
 * @param input — Collections to scan for `upload()` fields.
 * @returns Every upload field reference found, unvalidated.
 */
export function validateAndMergeStorageConfig(
  input: StorageValidationInput,
): StorageValidationOutput {
  const { collections } = input;
  const uploadFields: StorageValidationOutput["uploadFields"] = [];
  for (const collection of collections) {
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      if (field.type === ADMIN_FIELDS.upload.type) {
        uploadFields.push({ collectionSlug: collection.slug, fieldName, to: field.to });
      }
    }
  }
  return { uploadFields };
}
```

**3 — imports.** `VexStorageAdapter` is no longer read by this file; drop it from the
`import type { MediaCollectionConfig, VexStorageAdapter } from "./types";` line, leaving
only `MediaCollectionConfig`. `VexStorageConfigError` stays imported — `defineConfig` in
`config.ts` throws it, but this file no longer does; if the linter flags the now-unused
import, remove it here too (it is re-exported from `packages/core/src/media/index.ts`,
unaffected by this file's import list).

#### packages/core/src/config/hashAuthCollections.ts

New file.

```ts
import type { AuthCollectionConfig } from "../auth/types";

/**
 * Deterministically serializes an `AuthCollectionConfig[]` and returns its
 * SHA-256 hex digest.
 *
 * Object key order is not guaranteed stable across two evaluations of the
 * same auth adapter (`Object.entries` on a collection's `fields` follows
 * insertion order, which is stable per-process but not guaranteed identical
 * between the CLI's codegen run and a later `defineServerConfig` call in a
 * different process) — so this recursively sorts object keys before
 * stringifying. Without that, the drift check in `defineServerConfig` would
 * fire on ordering alone, never on real content changes.
 *
 * @param props — The auth collections to hash.
 * @param props.authCollections — Resolved auth collections, either freshly
 *   computed from a live `VexAuthAdapter` or read from the generated
 *   `vex.auth.ts` artifact.
 * @returns A SHA-256 hex digest of the stably-serialized array.
 */
export function hashAuthCollections(props: {
  authCollections: AuthCollectionConfig[];
}): string {
  const { authCollections } = props;
  const stable = stableStringify(authCollections);
  return sha256Hex(stable);
}

/**
 * JSON-stringifies `value` with every object's keys sorted, recursively.
 * Arrays keep their order — auth collection order is meaningful and must
 * still be part of the hash.
 *
 * @param value — The value to stringify.
 * @returns A JSON string with deterministic key order.
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const entries = keys.map(
      (key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`,
    );
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Computes the SHA-256 hex digest of a UTF-8 string using Node's `crypto`
 * module (available in every runtime this hash runs in: the CLI process and
 * the server-side `vex.config.server.ts` evaluation — never the browser).
 *
 * @param input — The string to hash.
 * @returns The lowercase hex-encoded digest.
 */
function sha256Hex(input: string): string {
  // Node's `crypto` module — both call sites (CLI codegen, `defineServerConfig`)
  // run server-side only, never bundled for the browser.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHash } = require("node:crypto") as typeof import("node:crypto");
  return createHash("sha256").update(input, "utf8").digest("hex");
}
```

#### packages/core/src/config/config.test.ts

This file already exists with schema-default, storage-adapter, and revalidate-default
`describe` blocks (see `packages/core/src/config/config.test.ts:41-155`, unaffected —
kept verbatim). The storage-adapter block's mock-adapter helpers move from constructing
`VexStorageAdapter` mocks to constructing `MediaCollectionConfig[]` directly, since
`defineConfig` now takes `mediaCollections` on the input instead of `storage.adapters`.
Add the following new `describe` blocks:

```ts
import { describe, it, expect } from "vitest";
import { defineConfig, defineServerConfig, defineCollection, text, upload } from "../";
import type { MediaCollectionConfig, VexAuthAdapter, VexStorageAdapter } from "../";
import { VexStorageConfigError } from "../media";
import { VexAuthConfigError } from "../auth/types";

function makeMockMediaCollection(slug: string, storageAdapter = "convex"): MediaCollectionConfig {
  return {
    slug,
    fields: {},
    meta: { storageAdapter },
  } as unknown as MediaCollectionConfig;
}

function makeMockStorageAdapter(name = "convex"): VexStorageAdapter {
  return { name } as unknown as VexStorageAdapter;
}

function makeMockAuthAdapter(collections: VexAuthAdapter["collections"] = []): VexAuthAdapter {
  return {
    name: "mock-auth",
    collections,
    userCollection: "users",
  } as unknown as VexAuthAdapter;
}

// ── Purity ──────────────────────────────────────────────────────────────────

describe("defineConfig — purity", () => {
  it("produces deep-equal, reference-unequal output across two calls with the same input", () => {
    const input = {
      collections: [defineCollection({ slug: "posts", fields: { title: text() } })],
      mediaCollections: [makeMockMediaCollection("images")],
    };
    const first = defineConfig(input);
    const second = defineConfig(input);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.collections).not.toBe(second.collections);
  });
});

// ── Collection merge order ───────────────────────────────────────────────────

// Correction from the initial spec draft: `mergeAuthCollections` (reused verbatim,
// unchanged by this step) appends unmatched auth collections AFTER user collections
// per its own documented contract, so the merged order is user collections first —
// the assertion below reflects that real function, not authCollections-first.
describe("defineConfig — collection merge order", () => {
  it("merges user collections, then unmatched authCollections, then internalCollections in that order", () => {
    const authCollection = defineCollection({
      slug: "users",
      fields: { email: text() },
    });
    const userCollection = defineCollection({
      slug: "posts",
      fields: { title: text() },
    });
    const config = defineConfig({
      authCollections: [authCollection] as never,
      collections: [userCollection],
    });
    const slugs = config.collections.map((c) => c.slug);
    expect(slugs).toEqual(["posts", "users"]);
  });
});

// ── defineServerConfig ────────────────────────────────────────────────────────

describe("defineServerConfig", () => {
  it("throws when a media collection names an unregistered adapter", () => {
    const client = defineConfig({
      mediaCollections: [makeMockMediaCollection("images", "convex")],
    });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { storage: { adapters: [makeMockStorageAdapter("s3")] } },
      }),
    ).toThrow(VexStorageConfigError);
  });

  it("throws the drift error when authCollections' hash disagrees with the live adapter", () => {
    const generatedCollection = defineCollection({
      slug: "users",
      fields: { email: text() },
    });
    const liveCollection = defineCollection({
      slug: "users",
      fields: { email: text(), phone: text() },
    });
    const client = defineConfig({ authCollections: [generatedCollection] as never });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([liveCollection] as never) } },
      }),
    ).toThrow(VexAuthConfigError);
  });

  it("does not throw when authCollections' hash matches the live adapter", () => {
    const collection = defineCollection({ slug: "users", fields: { email: text() } });
    const client = defineConfig({ authCollections: [collection] as never });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([collection] as never) } },
      }),
    ).not.toThrow();
  });

  it("spreads every client field onto the resolved server config", () => {
    const postCollection = defineCollection({ slug: "posts", fields: { title: text() } });
    const client = defineConfig({ collections: [postCollection], basePath: "/cms" });
    const server = defineServerConfig({ config: client });
    expect(server.basePath).toBe("/cms");
    expect(server.collections.map((c) => c.slug)).toContain("posts");
    expect(server.admin).toEqual(client.admin);
  });

  it("resolves schema and types defaults on the CLIENT config", () => {
    const client = defineConfig();
    expect(client.schema).toEqual({ outputPath: "/convex/vex.schema.ts" });
    expect(client.types).toEqual({ outputPath: "/src/vex.types.ts" });
  });

  it("honors codegen overrides supplied on the client config", () => {
    const client = defineConfig({
      schema: { outputPath: "/convex/custom.schema.ts" },
    });
    expect(client.schema.outputPath).toBe("/convex/custom.schema.ts");
    expect(client.types.outputPath).toBe("/src/vex.types.ts");
  });

  it("carries the client config's codegen settings through to VexConfig unchanged", () => {
    const client = defineConfig({ schema: { outputPath: "/convex/custom.schema.ts" } });
    const server = defineServerConfig({ config: client });
    expect(server.schema).toEqual(client.schema);
    expect(server.types).toEqual(client.types);
  });

  it("leaves auth undefined when no adapter is registered", () => {
    const server = defineServerConfig({ config: defineConfig() });
    expect(server.auth).toBeUndefined();
  });

  it("defaults auth.outputPath beside a registered adapter, honoring overrides", () => {
    const adapter = makeMockAuthAdapter([]);
    const defaulted = defineServerConfig({
      config: defineConfig(),
      server: { auth: { adapter } },
    });
    expect(defaulted.auth).toEqual({ adapter, outputPath: "/src/vex.auth.ts" });

    const overridden = defineServerConfig({
      config: defineConfig(),
      server: { auth: { adapter, outputPath: "/src/generated/auth.ts" } },
    });
    expect(overridden.auth?.outputPath).toBe("/src/generated/auth.ts");
  });
});
```

#### packages/core/src/config/index.ts

1 edit. Everything not shown is unchanged — `sanitizeConfigForClient` / `stripNonSerializable`
/ `ClientVexConfig` stay exported from this file in this step; Step 6 deletes them. Do
not remove them early, or every reader still on the old serialization path (deleted only
by Step 6) breaks the build.

**1 — no new export line needed.** `export * from "./config"` and `export * from
"./types"` already re-export everything named in those files by wildcard, so
`defineServerConfig`, `VexClientConfigInput`, `VexClientConfig`, and `VexServerConfigInput`
are picked up automatically once `config.ts` and `types.ts` export them.

#### packages/core/src/index.ts

1 edit. Everything not shown is unchanged — same one-line note as above:
`sanitizeConfigForClient` / `stripNonSerializable` / `ClientVexConfig` are not exported
from this barrel today (they only live on `config/index.ts`), so there is nothing to
preserve or remove here.

**1 — no change required.** Beside the existing `export * from "./config";` under the
`CONFIG BUILDERS` heading — this line already wildcard-re-exports `defineConfig`,
`defineServerConfig`, and every new type once `config/index.ts` re-exports them (edit
above). No new line is needed in this file.

#### apps/test/src/vex.config.ts

Complete replacement — client half only. `authCollections` is intentionally absent: Step 3
introduces the generated `./vex.auth` import and wires it in here. The media collection
`images` stays on the storage adapter for now (`storage.adapters` moved to
`vex.config.server.ts`) — Step 2 moves `images` onto this file's `mediaCollections` once
`defineMediaCollection` is reachable without the Convex server SDK.

```ts
import { defineConfig } from "@vexcms/core";

import {
  articles,
  caseStudies,
  changelog,
  comments,
  footers,
  headers,
  pages,
  themes,
  users,
} from "~/vexcms/collections";

import { access } from "./auth/access";
import { nav } from "./vexcms/globals/nav";
import { siteSettings } from "./vexcms/globals/siteSettings";

/**
 * VexCMS client-safe configuration for the demo/development site.
 *
 * Defines the admin sidebar layout and all registered collections and
 * globals: pages, headers, footers, themes, site settings, and the
 * editorial set (articles, case studies, changelog, comments) that exercises
 * the shared access-rule helpers. Imported directly by the browser via
 * `VexConfigProvider` — nothing here reaches a server SDK or an environment
 * variable.
 *
 * @see defineConfig in @vexcms/core
 * @see ./vex.config.server for the auth adapter and storage adapter wiring
 */
const vexConfig = defineConfig({
  access,
  admin: {
    sidebar: {
      side: "right",
    },
  },
  collections: [
    pages,
    users,
    headers,
    footers,
    themes,
    articles,
    caseStudies,
    changelog,
    comments,
  ],
  globals: [nav, siteSettings],
  routes: {
    // One document at a time. `resolveTargets` calls this once for `before`
    // and once for `after` on an update, so a slug rename purges the old path
    // too without the map looping over both itself.
    map: ({ collection, doc }) => {
      if (collection !== pages.slug) {
        return [];
      }
      const { slug } = doc;
      if (typeof slug !== "string") {
        return [];
      }
      return [slug === "home" ? "/" : `/${slug}`];
    },
  },
});

export default vexConfig;
```

#### apps/test/src/vex.config.server.ts

New file — server half. Carries the auth adapter and `storage.adapters` forward unchanged
from the old monolithic config.

```ts
import { betterAuthAdapter } from "@vexcms/better-auth";
import { defineServerConfig } from "@vexcms/core";
import { convexFileStorage } from "@vexcms/file-storage-convex";

import { authOptions } from "~/auth/options";

import vexConfig from "./vex.config";

/**
 * VexCMS server-only configuration for the demo/development site.
 *
 * Layers the Better Auth adapter and Convex storage adapter onto the
 * client-safe `vexConfig`. Consumed by `@vexcms/core` during `vex dev` and
 * `vex generate` to produce the Convex schema and TypeScript types, and by
 * every server route / Convex function that needs `config.access` or
 * `config.routes.map`.
 *
 * @see defineServerConfig in @vexcms/core
 * @see betterAuthAdapter in @vexcms/better-auth
 * @see ./vex.config for the client-safe half this layers onto
 */
const config = defineServerConfig({
  config: vexConfig,
  server: {
    auth: { adapter: betterAuthAdapter({ config: authOptions }) },
    storage: {
      adapters: [convexFileStorage({ mediaCollections: [] })],
    },
  },
});

export default config;
```

`convexFileStorage({ mediaCollections: [] })` is a deliberate placeholder: Step 2's split
of `@vexcms/file-storage-convex` removes the `mediaCollections` option from
`convexFileStorage` entirely (the adapter takes no collection list once
`defineMediaCollection` no longer needs the adapter to inject fields). This step keeps the
existing signature working with an empty array so `apps/test` typechecks the moment Step 1
lands; Step 2 deletes the option and moves `images` onto `vex.config.ts`'s
`mediaCollections`.

#### apps/www/src/vex.config.ts

Complete replacement — client half only. Same notes as `apps/test`'s client config:
`authCollections` and `images` land in Steps 3 and 2 respectively.

```ts
import { defineConfig } from "@vexcms/core"

import { footers, headers, pages, themes, users } from "~/vexcms/collections"
import { siteSettings } from "~/vexcms/globals"

/**
 * VexCMS client-safe configuration for the marketing site.
 *
 * Replaces `templates/base-nextjs`'s bare config wholesale (overlay copy is
 * file-level, not a merge): carries base's `users` forward unchanged and
 * adds the four marketing collections plus `siteSettings`. Imported
 * directly by the browser via `VexConfigProvider`.
 *
 * @see ./vex.config.server for the auth adapter and storage adapter wiring
 */
const vexConfig = defineConfig({
  access,
  admin: {
    sidebar: {
      side: "right",
    },
  },
  collections: [users, pages, headers, footers, themes],
  globals: [siteSettings],
  routes: {
    // One document at a time. `resolveTargets` calls this once for `before`
    // and once for `after` on an update, so a slug rename purges the old path
    // too without the map looping over both itself.
    map: ({ collection, doc }) => {
      if (collection !== pages.slug) return []
      const { slug } = doc
      if (typeof slug !== "string") return []
      return [slug === "home" ? "/" : `/${slug}`]
    },
  },
})

export default vexConfig
```

The original file imports `access` from `~/auth/access` — that import line is preserved
verbatim, just moved above the `defineConfig` call:

```ts
import { access } from "~/auth/access"
```

#### apps/www/src/vex.config.server.ts

New file — server half.

```ts
import { authOptions } from "@convex/auth/options"
import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineServerConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import vexConfig from "./vex.config"

/**
 * VexCMS server-only configuration for the marketing site.
 *
 * Layers the Better Auth adapter and Convex storage adapter onto the
 * client-safe `vexConfig`. `vex dev` / `vex generate` consume this to
 * produce the Convex schema and TypeScript types.
 *
 * @see ./vex.config for the client-safe half this layers onto
 */
const config = defineServerConfig({
  config: vexConfig,
  server: {
    auth: { adapter: betterAuthAdapter({ config: authOptions }) },
    storage: {
      adapters: [convexFileStorage({ mediaCollections: [] })],
    },
  },
})

export default config
```

Same placeholder note as `apps/test/src/vex.config.server.ts`: `mediaCollections: []` is
temporary, removed by Step 2.

#### Importer repoints

The exhaustive 24-file list and their exact line numbers live in
`.agent/docs/specs/2026-09-12-config-client-server-split/BRIEF.md` under "Every
`~/vex.config` importer that must repoint to `~/vex.config.server`". Apply the same
mechanical rule to every one of them: change the import specifier from `~/vex.config` (or
its app-relative equivalent, e.g. `./vex.config`, `../vex.config`) to `~/vex.config.server`
— no other line in these files changes in this step.

- [ ] `apps/test`: 9 importers (`src/app/(vexcms)/admin/layout.tsx`, `src/app/(vexcms)/admin/[[...path]]/page.tsx`, `src/app/api/vex/revalidate/route.ts`, `src/vexcms/api.ts`, `convex/vex.ts`, `convex/theme.ts`, `convex/vexContext.ts`, `convex/vex/globals.ts`, `convex/vex/media.ts`)
- [ ] `apps/www`: 10 importers (`src/app/(vexcms)/admin/layout.tsx`, `src/app/(vexcms)/admin/[[...path]]/page.tsx`, `src/app/api/vex/revalidate/route.ts`, `src/vexcms/api.ts`, `convex/seed.ts`, `convex/siteSettings.ts`, `convex/theme.ts`, `convex/vex.ts`, `convex/vex/globals.ts`, `convex/vex/media.ts`)
- [ ] `templates/base-nextjs`: 6 importers (`convex/vex.ts`, `convex/vex/globals.ts`, `convex/vex/media.ts`, `src/app/(vexcms)/admin/layout.tsx`, `src/app/(vexcms)/admin/[[...path]]/page.tsx`, `src/app/api/vex/revalidate/route.ts`)
- [ ] `templates/marketing-site`: 5 importers (`convex/seed.ts`, `convex/siteSettings.ts`, `convex/theme.ts`, `src/app/(vexcms)/admin/layout.tsx`, `src/vexcms/api.ts`)

`clientProviders.tsx` in both apps and `base-nextjs` is NOT repointed here — it currently
imports `access` from `~/auth/access` directly and mounts `StorageAdapterContextProvider` +
`VexAccessProvider`; Step 4 rewrites it to mount the single `VexConfigProvider` from
`~/vex.config` (the client half, not the server one). Leave it untouched in this step.

Verify:
- [ ] `pnpm --filter @vexcms/core test` passes, including the new purity test asserting `defineConfig(input)` called twice deep-equals (guards the double module eval)
- [ ] `defineServerConfig` throws a named error (`VexStorageConfigError`) when a media collection names an unregistered adapter
- [ ] `defineServerConfig` throws a named error (`VexAuthConfigError`) when `config.authCollections`' hash disagrees with the live auth adapter's collections (negative test, per AP-013)
- [ ] `pnpm build` green across the workspace; `pnpm --filter test typecheck` and `pnpm --filter www typecheck` clean
- [ ] No file outside `apps/*/src/vex.config*.ts` and the templates references `defineConfig` with a server field (`auth.adapter` or `storage.adapters`)

### Step 2 — Split `@vexcms/file-storage-convex` into client and server entries — [agent]

`packages/file-storage-convex/src/config.ts:14` imports `ConvexStorageAdapter` from `./adapter`,
so `defineMediaCollection` currently drags the Convex server SDK into any graph that touches
it — even though `defineMediaCollection` itself never reads `ConvexStorageAdapter` (confirmed
below). This step splits the file so the client config can declare media collections without
importing Convex's server SDK, and adds a `./client` subpath that is safe for the browser
bundle.

#### packages/file-storage-convex/src/mediaCollection.ts

New file. `defineMediaCollection` moved verbatim from `config.ts:42-113`. Read against what it
actually uses — `text`, `number`, `checkbox`, `defineCollection` (all pure, from
`@vexcms/core`) and the `MediaCollectionConfigInput`/`MediaCollectionConfig`/`MediaCollectionMeta`
types — confirms it never touches `ConvexStorageAdapter`; the only change from the original is
dropping the now-unused `import { ConvexStorageAdapter } from "./adapter";` line.

```ts
import {
  text,
  number,
  checkbox,
  defineCollection,
  type MediaCollectionSlug,
  type MediaCollectionConfigInput,
  type MediaCollectionConfig,
  type MediaCollectionMeta,
  type ComponentHKT,
  type AdminField,
  BaseFieldMeta,
} from "@vexcms/core";

type MediaCollectionFieldName = string &
  Omit<string, "filename" | "mimeType" | "size" | "deleted" | "src" | "width" | "height">;

/**
 * Resolves a raw collection config input into a fully-populated `CollectionConfig`.
 *
 * Fills in any missing `labels` by deriving them from the `slug` — converting it
 * to title case for `singular` and further pluralising it for `plural`.
 *
 * @param config - The raw collection configuration supplied by the caller.
 * @returns The resolved `CollectionConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
 *
 * const images = defineMediaCollection({
 *   slug: "images",
 *   fields: { alt: text({ required: true }) },
 * });
 *
 * export default defineConfig({
 *   mediaCollections: [images],
 *   collections: [posts],
 * });
 * ```
 *
 * @see {@link core/src!CollectionConfigInput} for the user-facing input type
 * @see {@link core/src!CollectionConfig} for the resolved return type
 */
export function defineMediaCollection<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TCollectionMeta extends MediaCollectionMeta = MediaCollectionMeta,
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  config: MediaCollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent
  > & {
    fields?: Record<MediaCollectionFieldName, AdminField<TFieldMeta>>;
  },
): MediaCollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent> {
  const userFields = config.fields ?? {};

  // Typed as the INPUT `fields` shape, not `MediaCollectionConfig["fields"]`:
  // the resolved type also carries the reserved `updatedAt` slot
  // `defineCollection` injects, and this map is what gets handed IN.
  const fields: Record<string, AdminField<TFieldMeta>> = {
    // Required base fields — user fields spread after so label/description overrides work
    filename: text({
      required: true,
      searchIndex: { name: "search_filename", filterFields: ["alt"] },
    }),
    alt: text({ required: true }),
    mimeType: text({ required: true }),
    size: number({ required: true }),
    storageId: text({ required: true }),
    deleted: checkbox({ defaultValue: false, index: "by_deleted" }),
    // Convex-specific fields
    src: text({ required: true }),
    width: number(),
    height: number(),
    // User-provided fields last so they override label/description on the base fields above
    ...userFields,
  };

  // `TFieldSlug` is deliberately NOT forwarded here. `defineCollection`'s
  // parameter is a conditional type on it (the reserved-key guard), and a
  // conditional over an unresolved generic cannot be checked at this call
  // site. `string` is the truthful argument anyway: `fields` above is a
  // widened `Record<string, ...>`, exactly like the auth adapter's call. The
  // outer signature keeps `TFieldSlug` because that describes the caller's own
  // user fields, which is what the returned config must stay typed by.
  const resolved = defineCollection<TFieldMeta, TCollectionMeta, TCollectionSlug, string, TComponent>({
    ...config,
    fields,
    meta: {
      ...config.meta,
      storageAdapter: "convex",
    } as TCollectionMeta,
    admin: {
      useAsTitle: "filename",
      ...config.admin,
    },
  });

  // Through `unknown`: `defineCollection` stamps `collectionSlug` into
  // `TFieldMeta` and resolves `TFieldSlug` to `string`, so the two generic
  // instantiations do not overlap structurally even though the runtime value
  // is exactly what the declared return type describes.
  return resolved as unknown as MediaCollectionConfig<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent
  >;
}
```

#### packages/file-storage-convex/src/mediaCollection.test.ts

New file. Replaces `config.test.ts`'s `defineMediaCollection` coverage, plus one new case
proving the hardcoded `meta.storageAdapter` tag (previously only exercised indirectly, through
`convexFileStorage(...).mediaCollections[0].meta.storageAdapter`, which no longer exists —
see `storage.ts` below).

```ts
import { describe, it, expect } from "vitest";
import { text } from "@vexcms/core";
import { defineMediaCollection } from "./mediaCollection";

describe("defineMediaCollection", () => {
  it("creates a media collection with required fields", () => {
    const collection = defineMediaCollection({ slug: "images" });
    expect(collection.slug).toBe("images");
    expect(collection.fields).toHaveProperty("alt");
    expect(collection.fields).toHaveProperty("filename");
    expect(collection.fields).toHaveProperty("mimeType");
    expect(collection.fields).toHaveProperty("size");
    expect(collection.fields).toHaveProperty("storageId");
    expect(collection.fields).toHaveProperty("deleted");
    expect(collection.fields).toHaveProperty("src");
    expect(collection.fields).toHaveProperty("width");
    expect(collection.fields).toHaveProperty("height");
  });

  it("preserves user-defined fields", () => {
    const collection = defineMediaCollection({
      slug: "images",
      fields: {
        caption: text({ label: "Caption" }),
      },
    });
    expect(collection.fields).toHaveProperty("caption");
  });

  it("does not override user-provided alt field", () => {
    const collection = defineMediaCollection({
      slug: "images",
      fields: {
        alt: text({ label: "Custom Alt" }),
      },
    });
    const altField = collection.fields.alt;
    expect(altField.label).toBe("Custom Alt");
  });

  it("tags the collection with meta.storageAdapter without an adapter instance", () => {
    const collection = defineMediaCollection({ slug: "images" });
    expect(collection.meta?.storageAdapter).toBe("convex");
  });
});
```

#### packages/file-storage-convex/src/storage.ts

New file. `convexFileStorage` and `ConvexFileStorageOptions` moved from `config.ts:116-157`.
`mediaCollections` is dropped from the options — media collections are now declared once, on
the client config, via `defineMediaCollection`, and each is already tagged
`meta.storageAdapter: "convex"` at definition time (see `mediaCollection.ts` above). Every
remaining option field (`admin.softDelete`, `convexUrl`) was already optional, so the whole
options object is now optional too: `convexFileStorage()` is a valid call with zero arguments.

```ts
import { ConvexStorageAdapter } from "./adapter";

/**
 * Options for the convex-file-storage package
 */
export interface ConvexFileStorageOptions {
  /** Admin panel config options for @vexcms/file-storage-convex */
  admin?: {
    /** When true, delete operations mark media as deleted instead of physically removing files. */
    softDelete?: boolean;
  };
  /** Convex site URL for generating file URLs. Auto-detected from env if omitted. */
  convexUrl?: string;
}

/**
 * Creates a Convex file storage adapter for VexCMS.
 *
 * Configures the Convex-backed file storage backend and returns a
 * `VexStorageAdapter` for `defineServerConfig`'s `server.storage.adapters`.
 * Media collections are declared on the CLIENT config instead of here — see
 * `defineMediaCollection` (`@vexcms/file-storage-convex/client`), which
 * already tags every collection it produces with `meta.storageAdapter: "convex"`.
 *
 * @param options — Adapter configuration. Every field is optional.
 * @returns A `VexStorageAdapter` ready for `defineServerConfig({ server: { storage: { adapters: [...] } } })`.
 *
 * @example
 * ```ts
 * // vex.config.ts (client)
 * import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
 * const images = defineMediaCollection({ slug: "images" });
 * export default defineConfig({ mediaCollections: [images], collections: [posts] });
 *
 * // vex.config.server.ts (server)
 * import { convexFileStorage } from "@vexcms/file-storage-convex";
 * export default defineServerConfig({
 *   config,
 *   server: { storage: { adapters: [convexFileStorage()] } },
 * });
 * ```
 */
export function convexFileStorage(options: ConvexFileStorageOptions = {}): ConvexStorageAdapter {
  return new ConvexStorageAdapter(options);
}
```

#### packages/file-storage-convex/src/storage.test.ts

New file. Replaces `config.test.ts`'s `convexFileStorage` coverage — the old
"requires explicit media collections" / "tags collections with storageAdapter" cases no longer
apply (the adapter no longer touches collections at all; see `adapter/index.ts` below).

```ts
import { describe, it, expect } from "vitest";
import { convexFileStorage } from "./storage";

describe("convexFileStorage", () => {
  it("constructs with no arguments", () => {
    const adapter = convexFileStorage();
    expect(adapter.name).toBe("convex");
    expect(adapter.mediaCollections).toEqual([]);
    expect(adapter.admin.softDelete).toBe(false);
  });

  it("supports softDelete option", () => {
    const adapter = convexFileStorage({ admin: { softDelete: true } });
    expect(adapter.admin.softDelete).toBe(true);
  });
});
```

#### packages/file-storage-convex/src/client.ts

New file — the `./client` subpath entry. Re-exports `defineMediaCollection` from
`./mediaCollection` (already client-safe) and `uploadFile` — but from `./adapter/uploadFile`
**directly**, never through the `./adapter` barrel.

The barrel is poison here: `./adapter/index.ts` re-exports `export * from "./methods"`, and
`./adapter/methods.ts` opens with `import { GenericDataModel, GenericMutationCtx, GenericQueryCtx }
from "convex/server";` — a plain (non-`type`) import. Because it isn't spelled `import type`,
esbuild's per-file transpilation (used by `tsup`, which has no cross-file type information)
cannot prove those names are type-only and leaves the `"convex/server"` import in the compiled
output. Any module that reaches `./adapter/index.ts` — including via its barrel `export *` —
therefore reaches a real `convex/server` import statement, exactly the leak this split exists to
close. `./adapter/uploadFile.ts` has no imports at all (just `fetch`), so importing it directly
is the only safe path into `uploadFile` from a client-only entry.

```ts
export { defineMediaCollection } from "./mediaCollection";
export { uploadFile } from "./adapter/uploadFile";
```

#### packages/file-storage-convex/src/config.ts

Deleted. Its two exports move as follows: `defineMediaCollection` → `mediaCollection.ts`;
`convexFileStorage` and `ConvexFileStorageOptions` → `storage.ts`.

#### packages/file-storage-convex/src/config.test.ts

Deleted. Its two `describe` blocks move to `mediaCollection.test.ts` and `storage.test.ts`
above (with the media-collection-on-the-adapter cases dropped, since the adapter no longer
carries them).

#### packages/file-storage-convex/src/index.ts

1 edit — everything else unchanged.

**1 — replace the `./config` re-export.** The barrel now points at the two files `config.ts`
split into, plus the unchanged `./adapter` re-export (server-only; this file itself is never
the `/client` entry).

```ts
export * from "./mediaCollection";
export * from "./storage";
export * from "./adapter";
```

#### packages/file-storage-convex/src/index.test.ts

1 edit — everything else unchanged.

**1 — replace the duplicated coverage with a barrel smoke test.** The exhaustive field/tagging
assertions now live in `mediaCollection.test.ts` and `storage.test.ts`; this file only needs to
prove the public barrel still re-exports both.

```ts
import { describe, it, expect } from "vitest";
import { convexFileStorage, defineMediaCollection } from "./index";

describe("index barrel", () => {
  it("re-exports defineMediaCollection and convexFileStorage", () => {
    const images = defineMediaCollection({ slug: "images" });
    const adapter = convexFileStorage();
    expect(images.slug).toBe("images");
    expect(adapter.name).toBe("convex");
  });
});
```

#### packages/file-storage-convex/src/adapter/index.ts

2 edits — everything else (the four adapter methods and their bodies) is unchanged.

**1 — import.** `ConvexFileStorageOptions` now lives in `../storage`, not `../config`.

```ts
import { type ConvexFileStorageOptions } from "../storage";
```

**2 — the constructor and its class-level `@example`, beside the existing `readonly
mediaCollections` field.** The constructor no longer receives a collection list.
`VexStorageAdapter`'s base class still declares `abstract mediaCollections: MediaCollectionConfig[]`
(unchanged — outside this step's touched files), so the field stays, always empty: nothing
reads it anymore, since `defineServerConfig`'s media-collection validation (Step 1) reads the
list the client config carries directly rather than flattening `adapter.mediaCollections`. The
empty array below exists purely to satisfy that abstract property.

```ts
/**
 * Convex storage adapter class — extends BaseStorageAdapter.
 *
 * All adapter methods accept the Convex `ctx` as the first parameter,
 * allowing access to `ctx.db`, `ctx.storage`, and other context methods.
 *
 * @example
 * ```ts
 * // vex.config.server.ts
 * import { convexFileStorage } from "@vexcms/file-storage-convex";
 *
 * export default defineServerConfig({
 *   config,
 *   server: { storage: { adapters: [convexFileStorage()] } },
 * });
 * ```
 */
```

```ts
  /**
   * Creates a new `ConvexStorageAdapter` instance.
   *
   * Takes no collection list — media collections are declared on the client
   * config (`defineMediaCollection`, `@vexcms/file-storage-convex/client`)
   * and already carry `meta.storageAdapter: "convex"`. `mediaCollections`
   * stays an empty array purely to satisfy `VexStorageAdapter`'s abstract
   * property; nothing reads it anymore.
   *
   * @param options - Adapter configuration; every field is optional.
   */
  constructor(options: ConvexFileStorageOptions = {}) {
    super();
    this.admin.softDelete = options.admin?.softDelete ?? false;
    this.mediaCollections = [];
  }
```

#### packages/file-storage-convex/src/adapter/index.test.ts

1 edit — everything else unchanged.

**1 — drop the `mediaCollections` argument and the now-inapplicable tagging test.** The adapter
no longer processes a collection list, so there is nothing to tag; that behavior is covered by
`mediaCollection.test.ts`'s "tags the collection with meta.storageAdapter" case instead.

```ts
import { describe, it, expect } from "vitest";
import { ConvexStorageAdapter } from "./index";

describe("ConvexStorageAdapter", () => {
  it("sets the correct name", () => {
    const adapter = new ConvexStorageAdapter();
    expect(adapter.name).toBe("convex");
  });

  it("always resolves mediaCollections to an empty array", () => {
    const adapter = new ConvexStorageAdapter();
    expect(adapter.mediaCollections).toEqual([]);
  });

  it("supports softDelete option", () => {
    const adapter = new ConvexStorageAdapter({ admin: { softDelete: true } });
    expect(adapter.admin.softDelete).toBe(true);
  });

  it("defaults softDelete to false", () => {
    const adapter = new ConvexStorageAdapter();
    expect(adapter.admin.softDelete).toBe(false);
  });
});
```

#### packages/file-storage-convex/package.json

1 edit — everything else unchanged.

**1 — add the `./client` subpath, in the same shape as `.`.**

```json
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./client": {
      "source": "./src/client.ts",
      "types": "./dist/client.d.ts",
      "import": "./dist/client.js"
    }
  },
```

#### packages/file-storage-convex/tsup.config.ts

1 edit. A second entry is needed — `dist/client.js` has to exist for the new subpath — but this
is safe as a plain array addition, unlike `@vexcms/react`'s object-form requirement (P-022):
P-022's collision was two entries sharing the identical basename `index.ts` (`src/index.ts` and
`src/testing/index.ts`), which made tsup's array-entry output-naming collapse onto the same
`dist/index.js`. Here the two entries are `src/index.ts` and `src/client.ts` — different
basenames — so array form assigns them distinct output names (`dist/index.js`,
`dist/client.js`) with no collision risk. This is one tsup config with both entries (not two
configs), so — as in the react package — chunks are still shared.

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/client.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  dts: false, // Declarations come from `tsc --emitDeclarationOnly` in the build script — tsup's rollup-dts pegs the CPU on this graph.
  sourcemap: true,
  clean: true,
  external: ["convex", "@vexcms/core"],
});
```

#### packages/file-storage-convex/verify-client-entry-graph.mjs

Throwaway scratch script — not part of the package (no `exports`/`files` entry), run once from
the package root after building and then deleted, never committed. Traces every relative import
reachable from `dist/client.js` and fails loudly if any of them imports `"convex"` (or a
`"convex/..."` subpath).

```js
// THROWAWAY — verifies the /client entry never reaches the Convex SDK. Run
// once after `pnpm --filter @vexcms/file-storage-convex build`, then delete
// this file; it is not part of the shipped package.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const distDir = fileURLToPath(new URL("./dist/", import.meta.url));
const entry = resolve(distDir, "client.js");
const importRe = /from\s+["']([^"']+)["']|require\(\s*["']([^"']+)["']\s*\)/g;

function trace(file, seen = new Set()) {
  const abs = resolve(file);
  if (seen.has(abs)) return seen;
  seen.add(abs);
  const source = readFileSync(abs, "utf-8");
  for (const match of source.matchAll(importRe)) {
    const spec = match[1] ?? match[2];
    if (spec.startsWith(".")) {
      const resolved = spec.endsWith(".js") ? resolve(dirname(abs), spec) : resolve(dirname(abs), `${spec}.js`);
      trace(resolved, seen);
    } else if (spec === "convex" || spec.startsWith("convex/")) {
      throw new Error(`${abs} imports "${spec}" — convex leaked into the /client module graph`);
    }
  }
  return seen;
}

const graph = trace(entry);
console.log(`OK: traced ${graph.size} file(s) reachable from dist/client.js — none import "convex".`);
```

**Moving media collections off the adapter (apps and templates).**

After Step 1, each app/template has a client `vex.config.ts` (holding `admin`, `access`,
`collections`, `globals`, `routes`) and a server `vex.config.server.ts` (holding `auth.adapter`,
`storage.adapters`). Today `storage.adapters: [convexFileStorage({ mediaCollections: [images] })]`
sits in the server file, with `images` imported there. This step removes the argument from
`convexFileStorage(...)` and moves the `images` import and a new `mediaCollections: [images]`
field onto the client file's `defineConfig({...})` call — the client field name comes straight
from the `VexClientConfigInput` contract Step 1 introduced.

#### apps/test/src/vex.config.server.ts

1 edit — everything else (as produced by Step 1) unchanged.

**1 — the `convexFileStorage` call, beside `storage.adapters`.** Drop the argument; `images` is
no longer needed in this file.

```ts
  storage: {
    adapters: [convexFileStorage()],
  },
```

#### apps/test/src/vex.config.ts

1 edit — everything else (as produced by Step 1) unchanged.

**1 — import `images` and add `mediaCollections`, beside the existing collections import and
`defineConfig({...})` call.**

```ts
import {
  articles,
  caseStudies,
  changelog,
  comments,
  footers,
  headers,
  images,
  pages,
  themes,
  users,
} from "~/vexcms/collections";
```

```ts
  mediaCollections: [images],
```

#### apps/www/src/vex.config.server.ts

1 edit — everything else (as produced by Step 1) unchanged.

**1 — the `convexFileStorage` call, beside `storage.adapters`.**

```ts
  storage: {
    adapters: [convexFileStorage()],
  },
```

#### apps/www/src/vex.config.ts

1 edit — everything else (as produced by Step 1) unchanged.

**1 — import `images` and add `mediaCollections`, beside the existing collections import and
`defineConfig({...})` call.**

```ts
import { footers, headers, images, pages, themes, users } from "~/vexcms/collections"
```

```ts
  mediaCollections: [images],
```

#### templates/base-nextjs/src/vex.config.server.ts

1 edit — everything else (as produced by Step 1) unchanged.

**1 — the `convexFileStorage` call, beside `storage.adapters`.**

```ts
  storage: {
    adapters: [convexFileStorage()],
  },
```

#### templates/base-nextjs/src/vex.config.ts

1 edit — everything else (as produced by Step 1) unchanged.

**1 — import `images` and add `mediaCollections`, beside the existing collections import and
`defineConfig({...})` call.**

```ts
import { images, users } from "~/vexcms/collections"
```

```ts
  mediaCollections: [images],
```

#### templates/marketing-site/src/vex.config.server.ts

1 edit — everything else (as produced by Step 1) unchanged.

**1 — the `convexFileStorage` call, beside `storage.adapters`.**

```ts
  storage: {
    adapters: [convexFileStorage()],
  },
```

#### templates/marketing-site/src/vex.config.ts

1 edit — everything else (as produced by Step 1) unchanged.

**1 — import `images` and add `mediaCollections`, beside the existing collections import and
`defineConfig({...})` call.**

```ts
import { footers, headers, images, pages, themes, users } from "~/vexcms/collections"
```

```ts
  mediaCollections: [images],
```

Verify:
- [ ] `pnpm --filter @vexcms/file-storage-convex build`, then `node verify-client-entry-graph.mjs`
  from the package root prints `OK: traced N file(s) ... none import "convex".` and exits 0;
  delete the script afterward (throwaway, never committed)
- [ ] `pnpm --filter @vexcms/file-storage-convex test` passes
- [ ] Admin panel in `apps/test` (attach to the developer's already-running `next dev` on port
  3020 per P-024 — do not start a new one) still lists the `images` media collection

---

### Step 3 — CLI: server config resolution and auth-collection codegen — [dev]

Auth collections are computed from the full better-auth options
(`packages/better-auth/src/adapter.ts:97`'s `betterAuthAdapter`, which needs the complete
`BetterAuthOptions` object — env reads and `better-auth/next-js` included), which can never
reach the browser. The CLI is the only place that can legally evaluate the auth adapter, so it
emits the result as a client-safe codegen artifact instead.

Cross-cutting note: `defineServerConfig`'s auth-drift check (`packages/core/src/config/config.ts`,
Step 1's file, not touched here) throws only when `auth.adapter` is configured **and**
`config.authCollections.length > 0` **and** `hashAuthCollections({ authCollections: live })`
disagrees with `hashAuthCollections({ authCollections: declared })`. An empty `authCollections`
array is treated as "not yet generated" and never throws — that is the escape hatch this step's
bootstrap relies on. `hashAuthCollections(props: { authCollections: AuthCollectionConfig[] })` is
exported from `@vexcms/core` (Step 1).

#### packages/cli/src/lib/resolveConfigPath.ts

1 edit — the whole file is small enough to show complete (imports unchanged: `existsSync` from
`node:fs`, `resolve` from `node:path`).

**1 — replace `CONFIG_NAMES`/`SEARCH_DIRS`/`resolveConfigPath`, and add `isServerConfigPath`.**
New precedence: the server family (`vex.config.server.{ts,mts,js,mjs}`) is checked in `.` then
`src/` before the client family (`vex.config.{ts,mts,js,mjs}`) is tried at all — the family loop
is now the outermost, dirs stay the middle loop, extensions stay innermost, exactly mirroring
the original's own dir-then-name nesting. The thrown error names both families, and
`isServerConfigPath` is a new export the three commands below use to detect the client-only
fallback and fail with a clear message instead of a confusing property access deep in codegen.

```ts
const SERVER_CONFIG_NAMES = [
  "vex.config.server.ts",
  "vex.config.server.mts",
  "vex.config.server.js",
  "vex.config.server.mjs",
];

const CLIENT_CONFIG_NAMES = [
  "vex.config.ts",
  "vex.config.mts",
  "vex.config.js",
  "vex.config.mjs",
];

const SEARCH_DIRS = [".", "src"];

/**
 * Locate the project's vex config file, preferring a server config
 * (`vex.config.server.{ts,mts,js,mjs}`) over the client-only fallback
 * (`vex.config.{ts,mts,js,mjs}`) — each family checked in the current
 * directory and then `src/` before the next family is tried.
 * @param cwd - Project directory to search from.
 * @returns Absolute path to the first matching config file found.
 * @throws {Error} When no config file from either family is found in any of the searched locations.
 */
export function resolveConfigPath(cwd: string): string {
  const tried: string[] = [];
  for (const names of [SERVER_CONFIG_NAMES, CLIENT_CONFIG_NAMES]) {
    for (const dir of SEARCH_DIRS) {
      for (const name of names) {
        const fullPath = resolve(cwd, dir, name);
        tried.push(fullPath);
        if (existsSync(fullPath)) {
          return fullPath;
        }
      }
    }
  }

  throw new Error(
    `Could not find a vex.config.server.* or vex.config.* file. Looked for:\n${tried.map((p) => `  - ${p}`).join("\n")}`,
  );
}

/**
 * Whether `configPath` resolved to a server config (`vex.config.server.*`)
 * rather than the client-only fallback. `vex dev`/`vex generate`/`vex deploy`
 * need server-only fields (`auth`, `storage.adapters`, `schema`, `types`) and
 * use this to fail with a clear message instead of a confusing property
 * access error deep inside codegen.
 * @param configPath - Absolute path returned by `resolveConfigPath`.
 */
export function isServerConfigPath(configPath: string): boolean {
  return SERVER_CONFIG_NAMES.some((name) => configPath.endsWith(`/${name}`));
}
```

#### packages/cli/src/lib/resolveConfigPath.test.ts

1 edit — imports, `describe`, and the `beforeEach`/`afterEach` tmp-dir harness are unchanged.

**1 — replace all four `it` blocks with one per new precedence branch.**

```ts
  it("finds vex.config.server.ts when only the server config exists", () => {
    writeFileSync(join(tmpDir, "vex.config.server.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.server.ts"));
  });

  it("falls back to vex.config.ts when only the client config exists", () => {
    writeFileSync(join(tmpDir, "vex.config.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.ts"));
  });

  it("prefers vex.config.server.ts when both exist", () => {
    writeFileSync(join(tmpDir, "vex.config.ts"), "export default {}");
    writeFileSync(join(tmpDir, "vex.config.server.ts"), "export default {}");
    expect(resolveConfigPath(tmpDir)).toBe(resolve(tmpDir, "vex.config.server.ts"));
  });

  it("throws an error naming both config families when neither exists", () => {
    let message = "";
    try {
      resolveConfigPath(tmpDir);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("vex.config.server.*");
    expect(message).toContain("vex.config.*");
    expect(message).toContain(resolve(tmpDir, "vex.config.server.ts"));
    expect(message).toContain(resolve(tmpDir, "src", "vex.config.mjs"));
  });
```

#### packages/cli/src/lib/generateAuthCollections.ts

New file. Guided stub — the serialization/hashing/skip-write logic is the part the developer
implements; the result type is complete.

```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { AuthCollectionConfig, VexAuthAdapter } from "@vexcms/core";
import { hashAuthCollections } from "@vexcms/core";

/**
 * Result of a `generateAuthCollections` run.
 */
export interface GenerateAuthCollectionsResult {
  /** Whether `outputPath` was (re)written. `false` means the on-disk hash already matched. */
  written: boolean;
  /** Absolute path the generated module was (or would have been) written to. */
  outputPath: string;
  /** The computed `authCollectionsHash` for `authAdapter.collections`, or `""` when `authAdapter` was undefined. */
  hash: string;
}

const HASH_LITERAL_PATTERN = /export const authCollectionsHash = "([^"]*)";/;

/**
 * Evaluates `authAdapter.collections` and writes a client-safe
 * `AuthCollectionConfig[]` module to `outputPath`, guarded by a content hash
 * so an unchanged adapter never triggers a rewrite — and never churns
 * `vex dev`'s file watcher, which re-triggers on every write it observes.
 *
 * @param props.authAdapter - The server-only auth adapter (e.g. `betterAuthAdapter(...)`) whose `collections` are serialized. `undefined` when the project has no auth adapter configured.
 * @param props.outputPath - Absolute filesystem path to write the generated module to (`NonNullable<VexConfig["auth"]>["outputPath"]`, already resolved against `cwd`).
 * @returns Whether a write happened, the resolved path, and the computed hash.
 * @throws {Error} When `outputPath`'s directory cannot be created or the file cannot be written (e.g. permission denied) — propagated, never swallowed.
 */
export function generateAuthCollections(props: {
  authAdapter: VexAuthAdapter | undefined;
  outputPath: string;
}): GenerateAuthCollectionsResult {
  const { authAdapter, outputPath } = props;

  if (!authAdapter) {
    return { written: false, outputPath, hash: "" };
  }

  const hash = hashAuthCollections({ authCollections: authAdapter.collections });

  if (existsSync(outputPath)) {
    const existing = readFileSync(outputPath, "utf-8");
    const match = existing.match(HASH_LITERAL_PATTERN);
    if (match?.[1] === hash) {
      return { written: false, outputPath, hash };
    }
  }

  const source = [
    "// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️",
    "// This file is produced by `vex generate` from the server config's auth",
    "// adapter. Re-run `vex generate` after changing the adapter's collections.",
    "",
    'import type { AuthCollectionConfig } from "@vexcms/core";',
    "",
    `export const authCollections: AuthCollectionConfig[] = ${JSON.stringify(authAdapter.collections, null, 2)};`,
    `export const authCollectionsHash = "${hash}";`,
    "",
  ].join("\n");

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, source, "utf-8");

  return { written: true, outputPath, hash };
}
```

#### packages/cli/src/lib/loadConfig.ts

3 edits — `stripJsonComments`, `findTsconfigDir`, `buildAliasFromTsconfig`, `createJitiOptions`,
`loadDotEnv`, `ensureSchemaFileExists`, `createResolver`, and `patchConvexTsconfig` are all
unchanged. (The segment as originally drafted listed 2 edits but omitted the import line the
bootstrap needs — corrected here to 3, per P-023: a copy-paste-runnable file needs the import in
scope.)

The bootstrap cycle, in prose, before the code: `vex.config.server.ts` imports `vex.config.ts`
(client), which imports the generated `./vex.auth` (client-safe auth collections), which is
produced by evaluating `vex.config.server.ts`'s auth adapter. On a clean checkout `vex.auth.ts`
does not exist, so the very first `jiti.import(configPath)` for the server config would fail at
module resolution before any of this project's own code even runs — the identical failure mode
`ensureSchemaFileExists` (`loadConfig.ts:149-173`) already solves for `convex/vex.schema.ts`:
create a placeholder purely so the import resolves, then let a later generation step overwrite
it with real content. This step mirrors that shape exactly for `vex.auth.ts`, but — because the
generated content itself is also the input to a validation check (`defineServerConfig`'s
auth-drift check) — one placeholder isn't enough on its own; `loadConfig` needs a genuine
two-phase load:

1. **Placeholder if absent** — `ensureAuthOutputFileExists` writes a `vex.auth.ts` exporting
   `authCollections: []` and `authCollectionsHash: ""` if nothing is there yet (same hardcoded
   conventional path assumption `ensureSchemaFileExists` already makes for the schema file — the
   real, possibly-customized `auth.outputPath` (server config) isn't known until config has loaded once).
2. **Load server config** — a fresh jiti import of `configPath` resolves fine against either the
   placeholder or a stale-but-present file, because an empty (or mismatched, in a genuinely stale
   case — see below) `authCollections` only ever *skips* the drift throw when it's empty; the
   placeholder from step 1 is always empty on a truly clean checkout.
3. **Run the adapter** — if `config.auth` is present (adapter guaranteed within the group), call
   `generateAuthCollections({ authAdapter: config.auth.adapter, outputPath: resolve(cwd, config.auth.outputPath) })`.
4. **Write the real file** — `generateAuthCollections` itself performs the write, guarded by its
   own hash comparison (step 3 above only decides *whether* to call it).
5. **Re-load** — if `generateAuthCollections` reports `written: true`, the `config` this call
   already built used the placeholder (or a now-stale file) and its merged `collections`/
   `authCollections` are out of date; loadConfig must import `configPath` a SECOND time, with a
   brand-new `createJiti` instance (jiti caches per-instance — reusing the first instance would
   return the same stale cached module rather than re-reading the file this step just rewrote),
   and return that result instead.

If phase 3/4 (`generateAuthCollections`, running the adapter and writing the file) throws, the
error propagates uncaught and `loadConfig` returns nothing — but critically, the placeholder is
never left "masquerading as real output": `generateAuthCollections` builds its entire source
string in memory before its one `writeFileSync` call (see its own edge cases above), so a throw
during generation always leaves the filesystem exactly as phase 2 found it — either the
untouched placeholder (still carrying its "DO NOT EDIT" banner and empty hash, unambiguous) or
the previous run's last-good real file. There is no intermediate half-written state to leave
behind.

**1 — import `generateAuthCollections` beside the existing `@vexcms/core` type import.**

```ts
import { generateAuthCollections } from "./generateAuthCollections.js";
```

**2 — add the auth-placeholder helper, beside the existing `ensureSchemaFileExists`.**

```ts
/**
 * Ensure `src/vex.auth.ts` exists so `vex.config.ts`'s
 * `import { authCollections } from "./vex.auth"` resolves on a clean
 * checkout. Mirrors `ensureSchemaFileExists` above: a placeholder purely for
 * import resolution, overwritten with real content by
 * `generateAuthCollections` immediately after config loads.
 * @param cwd - Project directory containing `src/`.
 */
function ensureAuthOutputFileExists(cwd: string): void {
  const authPath = resolve(cwd, "src/vex.auth.ts");
  if (existsSync(authPath)) return;

  const placeholder = [
    "// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️",
    "// This is a placeholder. Run `vex generate` to produce the real auth collections.",
    "",
    'import type { AuthCollectionConfig } from "@vexcms/core";',
    "",
    "export const authCollections: AuthCollectionConfig[] = [];",
    'export const authCollectionsHash = "";',
    "",
  ].join("\n");

  try {
    writeFileSync(authPath, placeholder, "utf-8");
  } catch {
    // Directory may not exist yet — that's fine, the error will surface later
  }
}
```

**3 — bootstrap the two-phase load, replacing the body from `ensureSchemaFileExists(cwd);`
through the final `return config as VexConfig;`.**

```ts
/**
 * Load and validate the project's `vex.config.server.ts` (or equivalent),
 * resolving environment variables and tsconfig path aliases via jiti before
 * evaluating it. Also keeps the generated `vex.auth.ts` fresh: on a clean
 * checkout it seeds a placeholder so the client→auth→server import cycle
 * resolves, then regenerates the real file from the live auth adapter and
 * reloads once more if that changed anything (see the module-level comment
 * above this function for the full two-phase bootstrap).
 * @param configPath - Absolute path to the vex config file.
 * @returns The evaluated, validated `VexConfig` object, built from a fresh `vex.auth.ts` when one had to be (re)generated.
 */
export async function loadConfig(configPath: string): Promise<VexConfig> {
  const cwd = dirname(configPath);

  loadDotEnv(cwd);
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }

  ensureSchemaFileExists(cwd);
  ensureAuthOutputFileExists(cwd);

  async function importConfig(): Promise<VexConfig> {
    const jiti = createJiti(configPath, createJitiOptions(cwd));

    const mod = (await jiti.import(configPath)) as
      | VexConfig
      | { default: VexConfig };

    const config = "default" in mod ? mod.default : mod;

    if (!config || typeof config !== "object" || !("collections" in config)) {
      throw new Error(
        `Invalid vex config: expected an object with a "collections" property.\n` +
          `Got: ${typeof config}`,
      );
    }

    return config as VexConfig;
  }

  let config = await importConfig();

  if (!config.auth) {
    return config;
  }

  const result = generateAuthCollections({
    authAdapter: config.auth.adapter,
    outputPath: resolve(cwd, config.auth.outputPath),
  });

  if (!result.written) {
    return config;
  }

  return await importConfig();
}
```

#### packages/cli/src/commands/dev.ts

2 edits — the rest of `devCommand` (schema generation, Convex process management, the file
watcher, graceful shutdown) is unchanged. `vex dev`'s `regenerate()` already calls
`loadConfig(configPath)` on every watched-file change (`dev.ts`, existing), so no additional
call site is needed there for auth regeneration — it is already transparent, since
`generateAuthCollections` now runs from inside `loadConfig` itself (see above) on every load,
including this one.

**1 — import `isServerConfigPath` beside the existing `resolveConfigPath` import.**

```ts
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";
```

**2 — guard beside the existing `const configPath = resolveConfigPath(cwd);` line.**

```ts
  const configPath = resolveConfigPath(cwd);
  if (!isServerConfigPath(configPath)) {
    logger.error(
      `vex dev requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
    );
    process.exit(1);
  }
  logger.info(`Config found: ${configPath}`);
```

#### packages/cli/src/commands/generate.ts

3 edits — the rest of `generateCommand` is unchanged.

**1 — import `isServerConfigPath` beside the existing `resolveConfigPath` import.**

```ts
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";
```

**2 — the doc comment's opening paragraph.** `loadConfig` already keeps `vex.auth.ts` current
as part of loading (see `loadConfig.ts` above) — `generateCommand` needs no separate call to
`generateAuthCollections`; it inherits the refresh transparently through `loadConfig`.

```ts
/**
 * Run the `vex generate` command: load the config (which also refreshes
 * `vex.auth.ts` from the live auth adapter — see `loadConfig`) and refresh
 * `vex.types.ts`.
 *
```

**3 — guard beside the existing `const configPath = resolveConfigPath(cwd);` line.**

```ts
  const configPath = resolveConfigPath(cwd);
  if (!isServerConfigPath(configPath)) {
    logger.error(
      `vex generate requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
    );
    process.exit(1);
  }
  logger.info(`Config found: ${configPath}`);
```

#### packages/cli/src/commands/deploy.ts

2 edits — the rest of `deployCommand` is unchanged.

**1 — import `isServerConfigPath` beside the existing `resolveConfigPath` import.**

```ts
import { isServerConfigPath, resolveConfigPath } from "../lib/resolveConfigPath.js";
```

**2 — guard beside the existing `const configPath = resolveConfigPath(cwd);` line.**

```ts
  const configPath = resolveConfigPath(cwd);
  if (!isServerConfigPath(configPath)) {
    logger.error(
      `vex deploy requires vex.config.server.ts. Found only a client config at ${configPath} — add a server config alongside it.`,
    );
    process.exit(1);
  }
  logger.info(`Config found: ${configPath}`);
```

**`vex.auth.ts` is committed.**

`git ls-files` confirms both existing generated artifacts — `apps/{test,www}/convex/vex.schema.ts`
and `apps/{test,www}/src/vex.types.ts` — are tracked in git today, with no `.gitignore` entry for
either. `vex.auth.ts` follows the same precedent and **is committed**: the client config
(`vex.config.ts`) directly imports it, so a fresh clone must typecheck and build without ever
running the CLI — exactly the reasoning that already keeps the schema and types files tracked.

Verify:
- [ ] `rm apps/test/src/vex.auth.ts && pnpm --filter test exec vex generate` regenerates it and
  `apps/test`'s already-running admin panel (port 3020, per P-024 — do not start a new server)
  boots correctly on reload
  <br>(spec-tasks.md's literal `pnpm --filter test vex generate` does not run in this repo — `vex`
  is not a package.json script; confirmed via `pnpm --filter test vex --help` failing with
  `ERR_PNPM_RECURSIVE_RUN_NO_SCRIPT`. `pnpm --filter test exec vex generate` is the command that
  actually resolves the CLI bin.)
- [ ] Editing a `modelName` in `apps/test/src/auth/options.ts` without regenerating makes
  `defineServerConfig` throw the drift error the next time `vex.config.server.ts` loads
  (negative test, per AP-013 — this must be shown to fail, not just assumed)
- [ ] `pnpm --filter test exec vex dev --once`, `pnpm --filter test exec vex generate`, and
  `pnpm --filter test exec vex deploy` (dry-run equivalents where deploying isn't safe) all log
  `Config found: <path>/vex.config.server.ts` — never the client-only fallback
- [ ] `pnpm --filter @vexcms/cli test` passes, including the four new `resolveConfigPath`
  precedence cases

### Step 4 — React: one `VexConfigProvider`, three contexts collapse to one — [agent]

`VexAccessContext.tsx` and `StorageAdapterContext.tsx` are deleted outright. Their two hooks
(`useVexAccess`, `useStorageAdapterMap`) move onto `VexConfigContext.tsx` as derived reads of
`useVexConfig()` — same names, same signatures, only the body changes (BRIEF decision 6).
`VexAuthContext.tsx` and `VexRevalidateContext.tsx` are untouched (BRIEF decision 7 — per-request
user data and revalidation wiring are not config).

#### packages/react/src/context/VexConfigContext.tsx

New file — the naming-conventions `react-context-suffix` rule (`^[A-Z][A-Za-z0-9]*Context\.tsx?$`,
scope `packages/react/src/**/*Context.*`) governs this file, not `react-components-pascal`
(scoped to `components/**`, not `context/`): a `*Context` file may hold its provider and hook
together, and this one now holds a provider (JSX) — `VexConfigProvider` returns
`<VexConfigContext.Provider>`, which the file's current `.ts` extension cannot contain. Renamed
`VexConfigContext.ts` → `VexConfigContext.tsx`. Delete the old `.ts` file; every existing import
(`"../context/VexConfigContext"`, `"../../context/VexConfigContext"`) resolves to the new file
unchanged — TypeScript module resolution does not encode the `.ts`/`.tsx` extension in the
specifier.

```tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  defineConfig,
  type ClientUploadMap,
  type SubjectEntry,
  type VexAccessConfig,
  type VexClientConfig,
} from "@vexcms/core";

/**
 * Holds the live VexCMS client config for the duration of the admin session —
 * the single provenance for config, access, and client-upload functions,
 * replacing the collapsed `VexAccessContext` and `StorageAdapterContext`.
 *
 * Populated by the app's `VexConfigProvider` mount (`clientProviders.tsx`),
 * which imports `~/vex.config` directly. Because that module is a
 * `"use client"` file importing `vex.config` directly, Turbopack's Fast
 * Refresh re-evaluates it when any collection file changes — which updates
 * this context and re-renders all consumers, including `CollectionListView`
 * and `CreateDocumentModal`, without a full page reload.
 *
 * Default value is a bare `defineConfig()` call — no sanitize step exists on
 * the client config (it was never RSC-serialized in the first place; see the
 * `defineConfig` purity note in `config.ts`) — so a consumer rendered outside
 * any provider still gets a valid, empty `VexClientConfig` rather than
 * throwing.
 */
export const VexConfigContext = createContext<VexClientConfig>(defineConfig());

/**
 * Returns the live VexCMS client config from `VexConfigContext`.
 *
 * @returns The resolved `VexClientConfig` for the current admin session.
 */
export function useVexConfig(): VexClientConfig {
  return useContext(VexConfigContext);
}

/**
 * Mounts `VexConfigContext` for the subtree it wraps. The app's own
 * `clientProviders.tsx` is the only caller — it imports `~/vex.config`
 * directly so the config's callbacks (`access`, `storage.clientUploads`)
 * survive into the client bundle.
 *
 * @param props - The resolved client config to provide, and the subtree that consumes it.
 * @returns The context provider wrapping `props.children`.
 */
export function VexConfigProvider(props: { config: VexClientConfig; children: ReactNode }) {
  return (
    <VexConfigContext.Provider value={props.config}>{props.children}</VexConfigContext.Provider>
  );
}

/**
 * Reads the RBAC access matrix for this session — derived from
 * `useVexConfig().access`, the same config `hasPermission`/`usePermission`
 * check against.
 *
 * @returns The access config for the session, or `undefined` when RBAC is
 *   not configured — `hasPermission` treats `undefined` as the escape hatch
 *   and allows every check, not the reverse.
 */
export function useVexAccess<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
>(): VexAccessConfig<TSubjects> | undefined {
  return useVexConfig().access as VexAccessConfig<TSubjects> | undefined;
}

/**
 * Returns the `ClientUploadMap` for this session — derived from
 * `useVexConfig().storage.clientUploads`, one entry per registered storage
 * adapter's client-side `uploadFile` function.
 *
 * Unlike the deleted `StorageAdapterContext` version, this never throws:
 * `VexConfigContext` always carries a value (real or the `defineConfig()`
 * default), so an unmounted-provider render now degrades to an empty map
 * rather than an error. `MediaUploadDropzone` already guards the per-adapter
 * lookup itself (`if (!adapterUploadFile) throw ...`), so no caller depended
 * on the provider-level throw.
 *
 * @returns The adapter map with `uploadFile` functions.
 */
export function useStorageAdapterMap(): ClientUploadMap {
  return useVexConfig().storage.clientUploads;
}
```

#### packages/react/src/context/VexAccessContext.tsx

Deleted. Exports removed: `useVexAccess` (moves to `VexConfigContext.tsx`, same name/signature),
`VexAccessProvider` (no replacement — its job is now `VexConfigProvider`, which takes a whole
`VexClientConfig` instead of a bare `access` matrix).

#### packages/react/src/context/StorageAdapterContext.tsx

Deleted. Exports removed: `useStorageAdapterMap` (moves to `VexConfigContext.tsx`, same
name/signature), `StorageAdapterContextProvider` (no replacement — folded into
`VexConfigProvider` via `config.storage.clientUploads`).

Consumer verification (BRIEF's 4 listed consumers) — read, unaffected beyond the barrel already
re-exporting the same names from a different source file:

- `hooks/usePermission.ts:4` imports `useVexAccess` from `"../context/VexAccessContext"` — this
  specifier no longer resolves once the file is deleted; edited below.
- `hooks/useCanAccessAdminPanel.ts:5,26` — same import, same edit.
- `hooks/useFieldPermissions.ts:5,30` — same import, same edit.
- `components/media/MediaUploadDropzone.tsx:8,70` imports `useStorageAdapterMap` from
  `"../../context"` (the barrel, not the deleted file directly) — **this import line is
  untouched**; the barrel's own export source moves (edited below), but the specifier
  `"../../context"` and the call site `useStorageAdapterMap()` at line 70 do not change.

Every one of the 4 consumer call sites — `useVexAccess()`/`useStorageAdapterMap()` invoked with
no arguments — is unchanged. Only the two hook files whose import specifier pointed at the
now-deleted `VexAccessContext.tsx` module need an edit.

#### packages/react/src/hooks/usePermission.ts

1 edit.

**1 — import specifier.** `useVexAccess` moved from the deleted `../context/VexAccessContext` to
`../context/VexConfigContext`; `useVexAuth` is untouched (still `VexAuthContext`).

```ts
import { useVexAccess } from "../context/VexConfigContext";
import { useVexAuth } from "../context/VexAuthContext";
```

#### packages/react/src/hooks/useCanAccessAdminPanel.ts

1 edit.

**1 — import specifier.** Same move as `usePermission.ts`.

```ts
import { useVexAccess } from "../context/VexConfigContext";
import { useVexAuth } from "../context/VexAuthContext";
```

#### packages/react/src/hooks/useFieldPermissions.ts

1 edit.

**1 — import specifier.** Same move.

```ts
import { useVexAccess } from "../context/VexConfigContext";
import { useVexAuth } from "../context/VexAuthContext";
```

#### packages/react/src/context/index.ts

1 edit — this is a breaking public API change: `VexAccessProvider` and
`StorageAdapterContextProvider` leave `@vexcms/react`'s public surface entirely;
`VexConfigProvider` enters it. `VexAccessContext`/`StorageAdapterContext` modules no longer exist
to re-export.

**1 — barrel exports.** Replace the five re-export lines.

```ts
export * from "./VexConfigContext";
export * from "./VexAuthContext";
export * from "./VexRevalidateContext";
```

#### packages/react/src/index.ts

1 edit — same breaking change surfaced at the package root.

**1 — Context export block.** Beside the existing `VexAccessProvider`/`StorageAdapterContextProvider`
export list (currently naming `VexConfigContext`, `VexAccessProvider`, `useVexConfig`, `useVexAuth`,
`StorageAdapterContextProvider`).

```ts
// Context
export {
  VexConfigContext,
  VexConfigProvider,
  useVexConfig,
  useVexAccess,
  useStorageAdapterMap,
  useVexAuth,
} from "./context";
```

#### packages/react/package.json

1 edit — the testing kit's fixtures now build media collections through the real,
adapter-package builder instead of a hand-typed cast (see the testing-kit section below), so
`@vexcms/react` needs `@vexcms/file-storage-convex` as a test-only workspace dependency. Matches
the existing precedent of `@vexcms/better-auth` already sitting in `dependencies` for the same
kind of adapter-package reuse.

**1 — devDependencies.** Beside the existing `@vexcms/tsconfig` entry.

```json
    "@vexcms/file-storage-convex": "workspace:*",
    "@vexcms/tsconfig": "workspace:*",
```

#### packages/react/src/testing/harness/accessFixtures.ts

2 edits. `renderWithVexProviders` takes `config` in place of `access` — every scenario now
carries its RBAC matrix as `config.access` on a real `VexClientConfig`, mounted through the single
`VexConfigProvider` instead of the deleted `VexAccessProvider`.

**1 — imports.** Drop `VexAccessProvider`/`VexAccessConfig`'s standalone-provider usage; add
`VexConfigProvider` and `VexClientConfig`.

```ts
import { defineAccess, defineCollection, text, type VexApiAuth, type VexClientConfig } from "@vexcms/core";
import { VexConfigProvider } from "../../context/VexConfigContext";
import { VexAuthProvider } from "../../context/VexAuthContext";
```

**2 — `renderWithVexProviders` body.** Replace the `options?: { access?: VexAccessConfig; auth?: VexApiAuth }`
parameter and the `VexAccessProvider` mount.

```ts
/**
 * Wraps `ui` in the real `VexConfigProvider`/`VexAuthProvider` pair — the same
 * providers `usePermission` reads through in the app, so every factory renders
 * against actual RBAC resolution instead of a stubbed context value.
 *
 * @param ui - The tree to render inside both providers.
 * @param options - Optional scenario wiring.
 * @param options.config - The client config to provide (carries `access`); defaults to
 *   `defineConfig({ collections: [testCollection] })` — RBAC unconfigured.
 * @param options.auth - The `{ user }` caller to provide; defaults to `{ user: null }`.
 * @returns The `@testing-library/react` render result.
 */
export function renderWithVexProviders(
  ui: ReactNode,
  options?: { config?: VexClientConfig; auth?: VexApiAuth },
): RenderResult {
  const auth = options?.auth ?? { user: null };
  const config = options?.config ?? defineConfig({ collections: [testCollection] });
  // `children` goes in the props object, not positionally: both providers declare
  // `children` as a required prop, and `createElement`'s positional-children overload
  // does not satisfy it for a non-generic component (tsc rejects the third argument
  // even though React assigns it at runtime).
  return render(
    createElement(VexConfigProvider, {
      config,
      children: createElement(VexAuthProvider, { value: auth, children: ui }),
    }),
  );
}
```

`testCollection`/`testAccess`/`testUsers` are untouched — `testAccess`'s entries are still plain
`VexAccessConfig` values; callers now wrap one in a config themselves (`defineConfig({
collections: [testCollection], access: testAccess.allowed })`) rather than passing it bare.

#### packages/react/src/testing/harness/viewHarness.tsx

3 edits. `testClientConfig` becomes a real `defineConfig(...)` result — no `as unknown as`.

**1 — imports.** `ClientVexConfig` is renamed `VexClientConfig` (Step 1); the media collection
literal is replaced by a real builder call, sourced from `@vexcms/file-storage-convex/client`
(client-safe since Step 2) — `MediaCollectionConfig` and the `text()` calls for the media
collection's fields are no longer needed here.

```tsx
import {
  defineConfig,
  defineGlobal,
  text,
  type VexAccessConfig,
  type VexApiAuth,
  type VexClientConfig,
} from "@vexcms/core";
import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
```

**2 — `testMediaCollection` and `testClientConfig`.** The old comment justified a hand-typed
literal because `defineMediaCollection` "needs a real registered storage adapter" — false after
Step 2: `defineMediaCollection` is adapter-independent and directly callable. `defineMediaCollection({
slug: "images" })` supplies every field the old literal faked by hand: `labels` (`{ singular:
"Image", plural: "Images" }`, from `defineCollection`'s `toTitleCase(pluralize.singular(slug))` /
`toTitleCase(slug)` — an exact match), `admin.table` (`{ defaultPageSize: 10, serverPageSize: 100,
... }`, `defineCollection`'s defaults — also an exact match), and the `alt`/`filename` fields
(now required, plus the six other base fields `defineMediaCollection` always injects:
`mimeType`, `size`, `storageId`, `deleted`, `src`, `width`, `height`). One correction the real
builder surfaces: `defineMediaCollection` defaults `admin.useAsTitle` to `"filename"`, not `"_id"`
— the old stub's `"_id"` was simply wrong (a media document's title-worthy field is its filename,
not its opaque id), and every view that reads `collection.admin.useAsTitle` for a heading now
renders the correct thing under test.

`schema`/`types` are dropped from the literal entirely — they are server-only fields on `VexConfig`
now, never part of `VexClientConfig`; the old `as unknown as ClientVexConfig` cast was the only
reason they type-checked.

```tsx
const testMediaCollection = defineMediaCollection({ slug: "images" });

/**
 * A global carries none of a media collection's storage complexity, so — unlike
 * `testMediaCollection` above — there is no reason not to use the real `defineGlobal()`.
 */
const testGlobal = defineGlobal({
  slug: "settings",
  label: "Settings",
  fields: {
    siteName: text({ required: false }),
    tagline: text({ required: false, defaultValue: "Untitled" }),
  },
});

/** Default stub client config: one `posts` collection, one `images` media collection, one global. */
export const testClientConfig: VexClientConfig = defineConfig({
  collections: [testCollection],
  mediaCollections: [testMediaCollection],
  globals: [testGlobal],
});
```

**3 — `ViewHarnessOptions.config`.** Type-only rename.

```ts
export interface ViewHarnessOptions {
  /** convex-test instance whose seeded data the view reads. */
  convex: ConvexTestInstance;
  /** Client config the view resolves collections/globals from. */
  config?: VexClientConfig;
  /** RBAC matrix to render against. Omit to leave RBAC unconfigured (every check passes). */
  access?: VexAccessConfig;
  /** The caller to render against. Defaults to `{ user: null }`. */
  auth?: VexApiAuth;
}
```

`wrapWithViewProviders`/`renderView` bodies are unchanged beyond this type: the
`createElement(VexConfigContext.Provider, { value: options.config ?? testClientConfig }, ui)`
line already reads `options.config`, and `renderView` already forwards `{ access: options.access,
auth: options.auth }` into `renderWithVexProviders` — which now expects `config`, not `access`.
`renderView` is the one place that still accepts a bare `access` (per `ViewSuiteOptions`), so its
call becomes:

```ts
export function renderView(ui: ReactNode, options: ViewHarnessOptions): RenderResult {
  return renderWithVexProviders(wrapWithViewProviders(ui, options), {
    config: options.access
      ? defineConfig({ collections: [testCollection], access: options.access })
      : options.config,
    auth: options.auth,
  });
}
```

#### packages/react/src/testing/fieldInputContract.ts

2 edits.

**1 — imports.** `ClientVexConfig` → `VexClientConfig`; add `defineCollection` and
`defineMediaCollection` (from `@vexcms/file-storage-convex/client`) to build the stub config for
real; `MediaCollectionConfig` import is no longer needed once the literal cast is gone.

```ts
import {
  ADMIN_FIELDS,
  adminFieldToInputSchema,
  defineCollection,
  defineConfig,
  text,
  type AdminField,
  type CollectionConfig,
  type VexClientConfig,
} from "@vexcms/core";
import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
```

**2 — `stubClientConfig`.** `relationship`'s fixture needs a `"documents"` collection with a
custom `useAsTitle: "title"` (`defineCollection`'s default is `"_id"`, and this stub deliberately
overrides it so the relationship preview shows the title field, not an id) — that override
survives as an explicit `admin.useAsTitle` argument. `upload`'s fixture needs an `"images"` media
collection, now built by the real `defineMediaCollection` for the same reason as
`viewHarness.tsx`'s `testMediaCollection` (Edit 2 above).

```ts
/**
 * Stub client config every mounted field renders against.
 *
 * Load-bearing, not defensive: `UploadFieldInput` resolves its target media
 * collection from `useVexConfig()` and THROWS `Media collection "images" not
 * found in config.` without one, and `RelationshipFieldInput` resolves its
 * target collection the same way (rendering an "Unknown collection" guard
 * instead of the real control). Providing it here — rather than only in
 * `nestedFieldContainer.ts` — is what lets those two field types exercise their
 * actual controls under the shared contract instead of reporting ~96 failures
 * that describe the harness rather than the component.
 *
 * `collections` carries the relationship fixture's target slug; `mediaCollections`
 * carries the upload fixture's `to` slug.
 */
const stubClientConfig: VexClientConfig = defineConfig({
  collections: [
    defineCollection({
      slug: "documents",
      fields: { title: text({ required: false }) },
      admin: { useAsTitle: "title" },
    }),
  ],
  mediaCollections: [defineMediaCollection({ slug: "images" })],
});
```

**3 — `renderField`'s provider stack.** No structural change — the `VexConfigContext.Provider`
element already reads the module-level `stubClientConfig` constant; only its inferred type
changes (`VexClientConfig` instead of the old cast). The line at the harness's mount point:

```ts
createElement(
  VexConfigContext.Provider,
  { value: stubClientConfig },
  createElement(
    AppFormBoundary,
    { form: f } as { form: unknown; children: ReactNode },
    createElement(props.Component, {
      name: FIELD_NAME,
      fieldDef: props.fieldDef,
      collection: props.collection,
      readOnly: props.readOnly,
      index: props.index,
    }),
    createElement("button", { type: "submit" }, "Submit"),
  ),
),
```

#### packages/react/src/testing/nestedFieldContainer.ts

3 edits.

**1 — imports.** Drop the hand-rolled `makeStubMediaCollection` helper's dependency surface
(`MediaCollectionConfig` cast); add `defineConfig` and `defineMediaCollection`; `ClientVexConfig`
→ `VexClientConfig`. `StorageAdapterContextProvider` import is dropped — folded into the config.

```ts
import {
  array,
  blocks,
  defineBlock,
  defineConfig,
  group,
  text,
  type AdminField,
  type AdminFieldType,
  type CollectionConfig,
  type VexClientConfig,
} from "@vexcms/core";
import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { AppForm } from "../components/form/AppForm";
import { fieldToInputComponent } from "../components/fields";
import { VexConfigContext } from "../context";
import { runFieldInputContractSuite } from "./fieldInputContract";
import { testCollection } from "./harness/accessFixtures";
import { fieldFixtures } from "./fixtures";
import type { FieldFixture } from "./fixtures/types";
```

**2 — `stubClientConfig`.** The hand-typed `makeStubMediaCollection()` function is deleted
entirely — `defineMediaCollection` replaces it, same as the two edits above. The stub upload
function that used to arrive via a manually-mounted `StorageAdapterContextProvider` now travels
as `config.storage.clientUploads` — a single provenance instead of two providers.

```ts
const stubClientConfig: VexClientConfig = defineConfig({
  mediaCollections: [defineMediaCollection({ slug: "images" })],
  storage: { clientUploads: { convex: async () => ({ storageId: "stub-id" }) } },
});
```

**3 — `renderContainer`'s provider stack.** Collapses the nested `VexConfigContext.Provider` +
`StorageAdapterContextProvider` pair into one provider — `stubClientConfig` now carries both the
media collection and the upload function.

```ts
return createElement(
  ConvexProvider,
  { client: convexClient },
  createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(
      NuqsTestingAdapter,
      null,
      createElement(
        VexConfigContext.Provider,
        {
          value: stubClientConfig,
          children: createElement(
            AppFormBoundary,
            { form } as { form: unknown; children: ReactNode },
            createElement(props.Component, {
              name: FIELD_NAME,
              fieldDef: props.fieldDef,
              collection: testCollection,
              readOnly: props.readOnly,
            }),
          ),
        },
      ),
    ),
  ),
);
```

#### packages/react/src/testing/mediaSuite.tsx

2 edits — `RunMediaSuiteOptions.access` is threaded into `renderWithVexProviders`, which no
longer accepts it directly.

**1 — imports and options doc.** Drop `StorageAdapterContextProvider`; add `defineConfig` and
`testCollection`.

```tsx
import type { MediaCollectionConfig, VexAccessConfig, VexMediaDocument } from "@vexcms/core";
import { defineConfig } from "@vexcms/core";

import { renderWithVexProviders, testCollection } from "./harness/accessFixtures";
```

**2 — `describeMediaUploadDropzone`'s `renderDropzone`.** The manually-mounted
`StorageAdapterContextProvider` is removed; its `adapterClients` moves onto the config passed to
`renderWithVexProviders`, alongside `access`.

```tsx
function renderDropzone(onUploadComplete: (mediaId: string) => void = vi.fn()) {
  const t = convexTest(schema, testModules);
  const { queryClient, convexClient } = buildConvexStack(t);
  const uploadFile = vi.fn(async () => ({ storageId: "storage_dropzone_1" }));
  const utils = renderWithVexProviders(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <MediaUploadDropzone
          targetCollection="images"
          adapterName="convex"
          onUploadComplete={onUploadComplete}
        />
      </QueryClientProvider>
    </ConvexProvider>,
    {
      config: defineConfig({
        collections: [testCollection],
        access,
        storage: { clientUploads: { convex: uploadFile } },
      }),
    },
  );
  return { utils, t, uploadFile };
}
```

Every other `renderWithVexProviders(ui, { access })` call in this file (`describeFilePreview`,
`describeMediaLibraryGrid` — neither mounts a storage provider) takes the same mechanical
`{ access }` → `{ config: defineConfig({ collections: [testCollection], access }) }` swap; no
`storage` key needed since neither renders an upload control.

#### packages/react/src/testing/modalSuite.tsx

2 edits — identical shape to `mediaSuite.tsx`, at `describeCreateMediaModal`'s `renderModal`
(the one function in this file that mounts uploads).

**1 — imports.** Drop `StorageAdapterContextProvider`; add `defineConfig` and `testCollection`.

```tsx
import type { MediaCollectionConfig, VexAccessConfig } from "@vexcms/core";
import { defineConfig } from "@vexcms/core";

import { renderWithVexProviders, testCollection } from "./harness/accessFixtures";
```

**2 — `describeCreateMediaModal`'s `renderModal`.** Same provider-stack collapse as
`mediaSuite.tsx`.

```tsx
function renderModal(
  options: {
    searchParams?: string;
    onUrlUpdate?: (event: UrlUpdateEvent) => void;
    collection?: MediaCollectionConfig;
  } = {},
) {
  const t = convexTest(schema, testModules);
  const { queryClient, convexClient } = buildConvexStack(t);
  const uploadFile = vi.fn(async () => ({ storageId: "storage_modal_1" }));
  const utils = renderWithVexProviders(
    <ConvexProvider client={convexClient}>
      <QueryClientProvider client={queryClient}>
        <NuqsTestingAdapter searchParams={options.searchParams} onUrlUpdate={options.onUrlUpdate}>
          <CreateMediaModal collectionSlug={(options.collection ?? makeMockMediaCollection()).slug} />
        </NuqsTestingAdapter>
      </QueryClientProvider>
    </ConvexProvider>,
    {
      config: defineConfig({
        collections: [testCollection],
        mediaCollections: [options.collection ?? makeMockMediaCollection()],
        access,
        storage: { clientUploads: { convex: uploadFile } },
      }),
    },
  );
  return { utils, t, uploadFile };
}
```

`CreateMediaModal collection={...}` → `collectionSlug={...}` here anticipates Step 5's prop
rename; `options.collection` must now also be registered on the rendered `config.mediaCollections`
so `useVexConfig()` can resolve it by slug inside the modal. `describeBaseModal` and
`describeCreateDocumentModal` take the same mechanical `{ access }` → `{ config:
defineConfig({ collections: [testCollection], access }) }` swap as `mediaSuite.tsx`'s remaining
functions; neither renders an upload control.

#### apps/test/src/app/(vexcms)/admin/clientProviders.tsx

Complete rewrite — single `VexConfigProvider` mount, direct `~/vex.config` import. `access` and
`uploadFile` no longer live here: both now travel as fields on the client config itself
(`access` directly, `uploadFile` under `storage.clientUploads`), authored once in `vex.config.ts`
(Step 1/Step 2 concern) rather than wired separately in this file.

```tsx
"use client";

import { VexConfigProvider } from "@vexcms/react";

import config from "~/vex.config";

/**
 * Mounts the single `VexConfigProvider` for the admin panel's client tree.
 *
 * This is a "use client" component so `vex.config` is imported and owned on
 * the client — it never crosses the RSC boundary as a prop. `access` and
 * `storage.clientUploads` (the two fields that used to need their own
 * providers) are already part of the config this imports.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <VexConfigProvider config={config}>{children}</VexConfigProvider>;
}
```

#### apps/www/src/app/(vexcms)/admin/clientProviders.tsx

Identical rewrite to `apps/test`'s.

```tsx
"use client";

import { VexConfigProvider } from "@vexcms/react";

import config from "~/vex.config";

/**
 * Mounts the single `VexConfigProvider` for the admin panel's client tree.
 *
 * This is a "use client" component so `vex.config` is imported and owned on
 * the client — it never crosses the RSC boundary as a prop. `access` and
 * `storage.clientUploads` (the two fields that used to need their own
 * providers) are already part of the config this imports.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <VexConfigProvider config={config}>{children}</VexConfigProvider>;
}
```

#### packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/clientProviders.tsx

Identical rewrite (template style: no semicolons, matching the template's existing convention).

```tsx
"use client"

import { VexConfigProvider } from "@vexcms/react"

import config from "~/vex.config"

/**
 * Mounts the single `VexConfigProvider` for the admin panel's client tree.
 *
 * This is a "use client" component so `vex.config` is imported and owned on
 * the client — it never crosses the RSC boundary as a prop. `access` and
 * `storage.clientUploads` (the two fields that used to need their own
 * providers) are already part of the config this imports.
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <VexConfigProvider config={config}>{children}</VexConfigProvider>
}
```

`templates/marketing-site` has no `clientProviders.tsx` of its own (confirmed by reading its
`admin/` directory — it overlays `base-nextjs`'s route group and reuses that template's file), so
no edit is needed there.

Verify:
- [ ] `pnpm --filter @vexcms/react test` passes
- [ ] The three `as unknown as ClientVexConfig` casts (`viewHarness.tsx:55`, `fieldInputContract.ts:120`, `nestedFieldContainer.ts:62`) are gone, not re-typed
- [ ] Upload + media picker still work in `apps/test`'s admin panel
- [ ] `usePermission` gating still hides the same affordances across all five `rbacState` scenarios

---

### Step 5 — Delete every config-shaped prop crossing the RSC boundary — [dev]

`packages/core/src/framework.ts` is not listed in this spec's `touches` frontmatter, but the
`CollectionListViewProps`/`CollectionEditViewProps`/`GlobalEditViewProps` interfaces this step's
slug conversions require live there, not in `packages/react`. It is edited below; skipping it
would leave `ViewComponentMap` referencing props shapes that no longer match their components.

**The generics question, answered.** `CollectionListView`/`CollectionEditView`/
`MediaCollectionListView`/`MediaCollectionEditView`/`GlobalEditView`/`CreateDocumentModal`/
`CreateMediaModal` are all generic over `TFieldMeta`/`TCollectionMeta` (or `TGlobalMeta`) today,
and every one of those generics is inferred from the `collection`/`global` OBJECT argument at the
call site — TypeScript infers a type parameter from the shape of the value passed in that
parameter's position. A bare slug string carries no field-meta information: there is nothing in
`"posts"` to infer an object shape from, so `TFieldMeta`/`TCollectionMeta`/`TGlobalMeta` **cannot
survive** the object-to-slug conversion. They are dropped from every one of these signatures.

`TCollectionSlug`/`TGlobalSlug` could, in principle, still narrow from a string-literal argument
(`collectionSlug="posts"` as a literal infers `TCollectionSlug` as `"posts"`), so they are kept.
But every real call site in this codebase resolves the slug at runtime — a URL path segment in
`NextAdminPage`, or a `.find()` result over `VexClientConfig.collections: CollectionConfig[]` (a
homogeneous array, not a per-slug discriminated map, per the Contract) — never a literal. Per
AP-003, a registry-map `infer` constrained to the array's entry type is not attempted here: it
would silently collapse to the fallback on any mismatch instead of erroring, and it buys nothing
because `ViewComponentMap`'s own `ApplyComponent<F, CollectionListViewProps>` already always uses
the fully-defaulted instantiation — never a narrowed one — so no caller that matters was ever
getting a narrowed `TFieldMeta` anyway. The concrete replacement: `collection`/`global` resolved
inside each component body is the widened, default-generic `CollectionConfig`/`GlobalConfig`
(`useVexConfig().collections.find(...)`), and field rendering already dispatches purely off
`field.type` via `fieldToInputComponent` — never off `TFieldMeta` — so this is a compile-time
narrowing with zero runtime behavior change.

**What this costs a library consumer: measured, near zero.** Two facts bound it.

First, the dropped generics are already inert. `TFieldMeta` and `TCollectionMeta` appear
*exclusively* in the props position (`CollectionListViewProps<TFieldMeta, TCollectionMeta,
TSlug>`) and in no return type, hook call, or internal annotation — they are inference sinks
that TypeScript solves and discards. `TSlug`'s only use in a body is the cast at
`CollectionListView.tsx:68` (`as CollectionConfig<TSlug>`), which asserts rather than narrows.
The TSDoc claim at `CollectionEditView.tsx:30-31` ("passing a collection of one slug where
another is expected is a type error") describes a guarantee the code does not implement: for it
to bite, `TSlug` would have to constrain a second prop, and it does not — `documentId` is
`VexDocument["_id"]` and `initialData` is `VexDocument | null` / `PaginationResult<TDocument<any>>`.
The file says so itself twelve lines lower (`CollectionEditView.tsx:57-60`: "the per-slug `get()`
wrapper narrows only when the slug is a literal at the call site, which is not the case here").
Delete that stale TSDoc claim along with the generics rather than carrying it onto the slug prop.

Second, the slug prop is *stronger* than the object prop it replaces. `CollectionSlug` is a
generated literal union (`packages/core/src/types/generateVexTypes.ts:108` emits
`export type CollectionSlug = "posts" | …`, resolved through registry augmentation at
`packages/core/src/types/generated.ts:60`), so `collectionSlug="psots"` is a compile error and
autocomplete offers exactly the registered slugs. Today `collection={someUnregisteredCollection}`
type-checks and fails at runtime when the `.find()` returns `undefined`. The conversion moves
that class of bug from runtime to compile time.

Net consumer-facing change: `<CollectionListView collection={posts} />` becomes
`<CollectionListView collectionSlug="posts" />`. Nothing observable is lost.

`MediaCollectionListView`'s `TDoc extends VexMediaDocument` is NOT in this group — it types
`initialData` independently of the collection prop and survives unchanged.

#### packages/core/src/framework.ts

3 edits.

**1 — `DashboardProps`.** `DashboardView` now takes no props at all (reads `useVexConfig()`
directly); kept as a named, empty interface (rather than inlining `Record<string, never>` at
`ViewComponentMap`'s `dashboard` entry) so the symbol stays stable for anything that names it.

```ts
/**
 * Props passed to the admin `Dashboard` view component.
 *
 * Empty: `DashboardView` reads the full config from `useVexConfig()` — there
 * is no longer a server → client boundary for it to cross as a prop.
 *
 * @see {@link ViewComponentMap}
 */
export interface DashboardProps {}
```

**2 — `CollectionListViewProps`/`CollectionEditViewProps`.** Drop `TFieldMeta`/`TCollectionMeta`;
swap `collection: CollectionConfig<...>` for `collectionSlug: TCollectionSlug`.

```ts
/**
 * Props passed to the `CollectionListView` component.
 *
 * `TCollectionSlug` narrows to a literal collection slug when the caller
 * supplies one; every real caller in this codebase passes a runtime string
 * (from a URL segment or a config lookup), so it resolves to the full
 * `CollectionSlug` union in practice. `TDoc` defaults to `VexDocument` and
 * can be narrowed when the caller has a typed initial data array.
 *
 * @see {@link ViewComponentMap}
 */
export interface CollectionListViewProps<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDoc extends VexDocument = VexDocument,
> {
  /** The slug of the collection being listed, resolved from `useVexConfig()`. */
  collectionSlug: TCollectionSlug;
  /**
   * Pre-fetched documents from the server. Passed as `initialData` to
   * the TanStack Query so the list renders immediately on first load.
   * Omit when rendering client-side only.
   */
  initialData?: PaginationResult<TDoc>;
}

/**
 * Props passed to the `CollectionEditView` component.
 *
 * `TCollectionSlug` narrows to a literal when the caller supplies one — see
 * the note on {@link CollectionListViewProps}.
 *
 * @see {@link ViewComponentMap}
 */
export interface CollectionEditViewProps<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDocument extends VexDocument = VexDocument,
> {
  /** The slug of the collection whose fields will be rendered, resolved from `useVexConfig()`. */
  collectionSlug: TCollectionSlug;
  /**
   * The Convex document ID of the document being edited.
   * Omit for new document creation — the form will be empty.
   */
  documentId: VexDocument["_id"];
  /**
   * Pre-fetched document from the server for SSR hydration.
   * `null` explicitly means "no document found". `undefined` means "not loaded yet".
   */
  initialData?: TDocument | null;
}
```

**3 — `GlobalEditViewProps`.** Drop `TFieldMeta`/`TGlobalMeta`; swap `global: GlobalConfig<...>`
for `globalSlug: TGlobalSlug`.

```ts
/**
 * Props passed to the `GlobalEditView` component.
 *
 * `TGlobalSlug` narrows to a literal when the caller supplies one — see the
 * note on {@link CollectionListViewProps}.
 *
 * @see {@link ViewComponentMap}
 */
export interface GlobalEditViewProps<
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TDocument extends VexDocumentGlobal = VexDocumentGlobal,
> {
  /** The slug of the global whose fields will be rendered, resolved from `useVexConfig()`. */
  globalSlug: TGlobalSlug;
  /**
   * Pre-fetched document from the server for SSR hydration.
   * `null` explicitly means "no document found". `undefined` means "not loaded yet".
   */
  initialData?: TDocument | null;
}
```

`ViewComponentMap`'s three entries (`dashboard`, `collectionListView`, `collectionEditView`) are
unchanged — they already reference these interfaces with no explicit generic arguments.

#### packages/react/src/components/AdminLayout.tsx

3 edits.

**1 — imports.** Drop `ClientVexConfig`; add `useVexConfig`.

```tsx
import type { ReactNode } from "react";
import {
  FrameworkComponentsContext,
  type FrameworkComponents,
} from "../hooks/useFrameworkComponents";
import { useVexConfig } from "../context/VexConfigContext";
import { VexAuthProvider } from "../context";
import { AppSidebar } from "./AdminSidebar";
```

**2 — `AdminLayoutProps`.** Drop `config`.

```tsx
export interface AdminLayoutProps {
  /**
   * The slug of the currently active collection.
   * Forwarded to `AppSidebar` for active nav highlighting.
   */
  activeSlug?: string;
  /**
   * The docID of the currently active document.
   * Forwarded to `AppSidebar` and `AdminTopNav` for admin navigation.
   */
  activeDocID?: string;
  /**
   * The full pathname of the current url
   * Forwarded to `AppTopNav` for the top nav.
   */
  pathname: string;
  /** The active view content rendered in the main content area. */
  children: ReactNode;
  /**
   * Optional framework-specific component overrides.
   *
   * Pass `{ Link: NextLink, Image: NextImage }` for Next.js.
   * Pass `{ Link: StartLink }` for TanStack Start (where `StartLink` wraps
   * `RouterLink` to map `href` → `to`).
   *
   * When omitted, all internal components fall back to native `<a>` and `<img>`.
   * In practice this prop is set by the framework adapter (`@vexcms/next` etc.)
   * rather than by the application developer.
   */
  components?: FrameworkComponents;
  user?: AdminUser;
  organization?: Record<string, unknown>;
  sidebarOpen?: boolean;
}
```

**3 — `AdminLayout` body.** Read `useVexConfig()` in place of `props.config`; drop the
`VexConfigContext.Provider` wrap entirely — the app's own `VexConfigProvider` (Step 4,
`clientProviders.tsx`) already sits above this component in every render tree, so `AdminLayout`
no longer needs to establish its own context value. This is also what makes the Fast Refresh
property in `VexConfigContext.tsx`'s doc comment hold for the whole tree, not just below
`AdminLayout`: there is exactly one context provider now, mounted once at the app root.

```tsx
export function AdminLayout(props: AdminLayoutProps) {
  const config = useVexConfig();
  const side = config.admin.sidebar.side;

  const sidebar = (
    <AppSidebar activeSlug={props.activeSlug} activeDocID={props.activeDocID} user={props.user} />
  );

  const content = (
    <SidebarInset>
      <header className="bg-background sticky top-0 z-100 flex h-12 shrink-0 items-center gap-2 border-b px-4">
        {side === "right" && <div className="flex-1" />}
        {side === "right" ? (
          <>
            <AdminTopNav {...props} />
            <ViewSiteButton />
            <SidebarTrigger
              side={side}
              className="hover:text-primary/90 transition-colors duration-300"
            />
          </>
        ) : (
          <>
            <SidebarTrigger
              side={side}
              className="hover:text-primary/90 transition-colors duration-300"
            />
            <AdminTopNav {...props} />
            <ViewSiteButton className="ml-auto" />
          </>
        )}
      </header>
      <main className="flex-1 p-6 pt-0">{props.children}</main>
    </SidebarInset>
  );

  return (
    <VexAuthProvider
      value={{ user: props.user as Record<string, unknown>, organization: props.organization }}
    >
      <FrameworkComponentsContext.Provider value={props.components ?? {}}>
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider defaultOpen={props.sidebarOpen}>
              {side === "right" ? (
                <>
                  {content}
                  {sidebar}
                </>
              ) : (
                <>
                  {sidebar}
                  {content}
                </>
              )}
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </FrameworkComponentsContext.Provider>
    </VexAuthProvider>
  );
}
```

#### packages/react/src/components/AdminSidebar.tsx

2 edits.

**1 — `AppSidebarProps`.** Drop `config`.

```tsx
export interface AppSidebarProps {
  /**
   * The slug of the currently active collection.
   * Used to set `isActive` on the matching `SidebarMenuButton`.
   */
  activeSlug?: string;
  /**
   * The docID of the currently active document.
   * Sometimes refers to a global slug.
   * Used to set `isActive` on the matching `SidebarMenuButton`.
   */
  activeDocID?: string;
  user?: AdminUser;
}
```

**2 — `AppSidebar` body.** Read `useVexConfig()` in place of `props.config` throughout; import it
alongside the existing `@vexcms/core` import.

```tsx
import { addLeadingSlash, CRUD_ACTIONS, PERMISSION_SCOPES } from "@vexcms/core";
import { useVexConfig } from "../context/VexConfigContext";
```

```tsx
export function AppSidebar(props: AppSidebarProps) {
  const config = useVexConfig();
  const adminRoot = addLeadingSlash(config.basePath);

  const collections = config.collections.filter((c) =>
    usePermission({ resource: c.slug, action: CRUD_ACTIONS.read, scope: PERMISSION_SCOPES.any }),
  );
  const globals = config.globals.filter((g) =>
    usePermission({ resource: g.slug, action: CRUD_ACTIONS.read, scope: PERMISSION_SCOPES.any }),
  );
  const mediaCollections = config.mediaCollections.filter((mc) =>
    usePermission({ resource: mc.slug, action: CRUD_ACTIONS.read, scope: PERMISSION_SCOPES.any }),
  );

  return (
    <Sidebar side={config.admin.sidebar.side} collapsible={config.admin.sidebar.collapsible}>
      {/* body unchanged below this point — every `props.config.x` read above
          this line already flows through the collections/globals/mediaCollections
          / adminRoot locals computed above */}
    </Sidebar>
  );
}
```

#### packages/react/src/components/AdminTopNav.tsx

2 edits.

**1 — imports.** Add `useVexConfig`.

```tsx
import { addLeadingSlash, vexConvexApi } from "@vexcms/core";
import { useVexConfig } from "../context/VexConfigContext";
```

**2 — `AdminTopNav` body.** Replace every `props.config.x` read with `config.x`.

```tsx
export default function AdminTopNav(props: AdminLayoutProps) {
  const config = useVexConfig();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isGlobals = props.activeSlug === "globals";

  const { data: currentDocument } = useQuery({
    /* unchanged */
  });

  const isLeft = config.admin.sidebar.side === "left";
  const adminRoot = addLeadingSlash(config.basePath);
  const allCollections = config.collections.concat(config.mediaCollections);
  const activeCollection = allCollections.find((c) => c.slug === props.activeSlug);
  const activeGlobal =
    isGlobals && props.activeDocID
      ? config.globals.find((g) => g.slug === props.activeDocID)
      : undefined;
  // body below this point is unchanged — it reads only `activeCollection`/`activeGlobal`/
  // `doc`/`isLeft`/`adminRoot`, all already localized above
}
```

#### packages/react/src/components/views/DashboardView.tsx

2 edits.

**1 — imports.** Drop `DashboardProps`; add `useVexConfig`.

```tsx
import { CRUD_ACTIONS, hasPermission, PERMISSION_SCOPES } from "@vexcms/core";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useVexAuth } from "../../context";
import { useVexAccess } from "../../context";
import { useVexConfig } from "../../context/VexConfigContext";
import { Activity } from "react";
```

**2 — `DashboardView` signature and body.** Drop the `props: DashboardProps` parameter entirely;
read `useVexConfig()`.

```tsx
export function DashboardView() {
  const config = useVexConfig();
  const access = useVexAccess();
  const { user, organization } = useVexAuth();

  const collections = config.collections.filter((c) =>
    hasPermission({ access, user, organization, resource: c.slug, action: CRUD_ACTIONS.read, scope: PERMISSION_SCOPES.any }),
  );
  const mediaCollections = config.mediaCollections.filter((mc) =>
    hasPermission({ access, user, organization, resource: mc.slug, action: CRUD_ACTIONS.read, scope: PERMISSION_SCOPES.any }),
  );
  const globals = config.globals.filter((g) =>
    hasPermission({ access, user, organization, resource: g.slug, action: CRUD_ACTIONS.read, scope: PERMISSION_SCOPES.any }),
  );

  // render body unchanged — every `props.config.globals` read (e.g. the
  // Globals section's `.map`) becomes `config.globals`
}
```

#### packages/react/src/components/views/GlobalsListView.tsx

2 edits.

**1 — imports.** Drop `ClientVexConfig`; add `useVexConfig`.

```tsx
import { Card, CardDescription, CardHeader, CardTitle } from "../ui";
import { useVexConfig } from "../../context/VexConfigContext";
```

**2 — signature and body.** Drop the `{ config }: { config: ClientVexConfig }` parameter.

```tsx
export function GlobalsListView() {
  const config = useVexConfig();
  return (
    <div className="relative">
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-2xl font-bold">Globals</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.globals.map((global) => (
          <a key={global.slug} href={`/admin/globals/${global.slug}`} className="group block">
            <Card className="cursor-pointer transition-shadow group-hover:shadow-md">
              <CardHeader>
                <CardTitle>{global.label}</CardTitle>
                <CardDescription>Edit Global</CardDescription>
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
```

#### packages/react/src/components/views/CollectionListView.tsx

2 edits — body genuinely changes throughout (single-provenance resolution, not-found handling),
so the full function is shown; the deleted fallback block is called out separately.

**1 — imports.** `CollectionListViewProps` now carries `collectionSlug`; the `CollectionConfig`
type import is dropped along with the generics — the local `collection` gets its widened type
inferred from `useVexConfig().collections.find(...)`.

```ts
import {
  CRUD_ACTIONS,
  isFieldAllowed,
  PERMISSION_SCOPES,
  vexConvexApi,
  type CollectionListViewProps,
  type CollectionSlug,
  type TDocument,
} from "@vexcms/core";
```

**2 — deleted fallback block, and the replacement body.** Deletes:

```ts
const liveConfig = useVexConfig();
// Prefer the live context collection (updated via Fast Refresh) over the
// RSC-serialized prop, falling back to the prop if context isn't available.
const collection =
  (liveConfig?.collections.find(
    (c) => c.slug === props.collection.slug,
  ) as CollectionConfig<TSlug>) ?? props.collection;
```

The invariant that replaces it: `collection` has exactly one provenance —
`useVexConfig().collections`, keyed by `props.collectionSlug` — never a prop fallback, because
there is no longer a second (RSC-serialized) copy of the collection to fall back to.

```ts
/**
 * Collection list view component.
 *
 * Renders a data table of all documents in a collection. Fetches live data
 * internally via `vexConvexApi.list` (TanStack Query + Convex subscription).
 * `initialData` from `VexAdminPage`'s server-side `fetchQuery` ensures the
 * list renders immediately on first load with no loading flash.
 *
 * This component renders the *content area only* — wrap it in `AdminLayout`.
 *
 * @param props - View props.
 * @param props.collectionSlug - The slug of the collection to list, resolved
 *   from `useVexConfig()` — the single provenance for collection config.
 * @param props.initialData - Pre-fetched documents from the server (for SSR).
 * @returns The collection data table, or a not-found message when
 *   `collectionSlug` does not resolve against the current config.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 *
 * @example
 * ```tsx
 * <CollectionListView collectionSlug="posts" initialData={serverDocs} />
 * ```
 */
export function CollectionListView<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDoc extends TDocument = TDocument,
>(props: CollectionListViewProps<TCollectionSlug, TDoc>) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collectionSlug);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  const numItems = Math.max(
    collection.admin.table.serverPageSize,
    collection.admin.table.defaultPageSize,
  );
  const pagination = usePaginatedQuery({
    query: {
      collection: collection.slug,
      depth: 1,
      paginationOpts: {
        numItems,
        totalDocs: true,
        cursor: null,
      },
    },
    initialData: props.initialData,
    clientPageSize: collection.admin.table.defaultPageSize,
  });

  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.read,
    // Deliberately no `data`: a column is shown or hidden for the whole
    // table, so the question is "is this field denied for EVERY document",
    // not "for this one" — `scope: "any"` answers exactly that.
    scope: PERMISSION_SCOPES.any,
  });

  const columns = useMemo(() => {
    return getCollectionColumnDefs({ collection }).filter((column) => {
      const key = columnFieldKey(column);
      return key === undefined || isFieldAllowed(fieldPermissions, key);
    });
  }, [collection, fieldPermissions]);

  const removeMutation = useVexMutation({
    collection: collection.slug,
    // A bulk delete affects N documents, so it sends one change per row. The
    // rows are already loaded here, and a deleted document cannot be re-read
    // server-side — which is why the pre-delete state travels in `before`.
    getChanges: ({ args }) =>
      args.ids.flatMap((id) => {
        const row = pagination.results.find((doc) => doc._id === id);
        return row === undefined ? [] : [{ before: row }];
      }),
    mutationFn: vexConvexApi.remove,
    operation: "remove",
  });

  async function handleBulkDelete(selectedIds: string[]) {
    await removeMutation.mutateAsync({ ids: selectedIds, collection: collection.slug });
  }

  const canCreate = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.create,
    scope: PERMISSION_SCOPES.any,
  });
  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });
  return (
    <div className="relative">
      <CreateDocumentModal collectionSlug={collection.slug} />
      <div className="mb-6 flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm" suppressHydrationWarning>
            {pagination.isPending
              ? "Loading…"
              : `${pagination.results.length} document${pagination.results.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {/* Grouped so the header's `justify-between` keeps the title left and
            both controls right, instead of spreading three children apart. */}
        <div className="flex items-center gap-2">
          <RevalidateButton collection={collection.slug} />
          <Button
            nativeButton={false}
            disabled={!canCreate}
            render={
              <VexLink href={`/admin/${collection.slug}?${MODALS.createDocument.urlParam}=true`} />
            }
          >
            + New {collection.labels.singular}
          </Button>
        </div>
      </div>

      <DataTable
        data={pagination.results}
        columns={columns}
        isDone={pagination.isDone}
        onLoadMore={pagination.loadMore}
        isLoadingMore={pagination.isPending}
        totalCount={pagination.totalDocs}
        enableRowSelection={true}
        enableBulkActions={true}
        entityName={collection.labels.plural.toLowerCase()}
        onBulkDelete={canDelete ? handleBulkDelete : undefined}
        isDeleting={removeMutation.isPending}
      />
    </div>
  );
}
```

#### packages/react/src/components/views/CollectionEditView.tsx

2 edits — same treatment; no fallback block to delete here (this view never had one). The
segment's shown import block below omitted the `useVexConfig` import the body needs; added here.

```ts
import { CRUD_ACTIONS, isFieldAllowed, vexConvexApi } from "@vexcms/core";
import type { CollectionEditViewProps, CollectionSlug } from "@vexcms/core";
import { useVexConfig } from "../../context/VexConfigContext";
```

```ts
/**
 * Collection document edit form.
 *
 * Fetches the document when editing via `vexConvexApi.get` (TanStack Query +
 * Convex subscription), initialises a `useCollectionForm` instance with the
 * current field values, and renders an `<AppForm>` with one input component per
 * field. Submits via `vexConvexApi.update`. Field inputs connect to the form
 * through `AppFormContext` — no controller prop needed.
 *
 * @param props - View props.
 * @param props.collectionSlug - The slug of the collection whose fields are
 *   rendered, resolved from `useVexConfig()`.
 * @param props.documentId - Convex document ID to fetch and edit. Omit for new-document mode.
 * @param props.initialData - Server-prefetched document for SSR hydration. `null` means not found.
 * @returns The edit form, or a not-found message when `collectionSlug` does
 *   not resolve, or when the document cannot be loaded.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 *
 * @example
 * ```tsx
 * <CollectionEditView collectionSlug="posts" documentId="k573abc..." initialData={serverDoc} />
 * ```
 */
export function CollectionEditView<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: CollectionEditViewProps<TCollectionSlug>) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collectionSlug);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  // This view is generic over `TCollectionSlug` — the collection is only known at
  // runtime, so it queries the generic endpoint (`VexDocument`) directly. The
  // per-slug `get()` wrapper from `@vexcms/core/client` narrows only when the
  // slug is a literal at the call site, which is not the case here.
  const { data: currentDocument } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.documentId,
      collection: collection.slug,
    }),
    initialData: props.initialData,
  });

  if (!currentDocument) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    // The edit view holds both states: the loaded document, and that document
    // merged with the submitted values.
    getChanges: ({ args }) => [
      { after: { ...currentDocument, ...args.data }, before: currentDocument },
    ],
    mutationFn: vexConvexApi.update,
    operation: CRUD_ACTIONS.update,
  });
  const visibleFields = useVisibleFields({
    resource: collection.slug,
    fields: collection.fields,
    data: currentDocument,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useCollectionForm({
    document: currentDocument,
    collection,
    readableFieldKeys,
    onSubmit: async () => {
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({
        id: currentDocument._id,
        collection: collection.slug,
        data: changes,
      });
      form.reset();
    },
  });

  useLiveFieldMerge({
    form,
    document: currentDocument,
    fieldKeys: readableFieldKeys,
  });

  const canEdit = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.update,
    data: currentDocument,
  });
  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.update,
    data: currentDocument,
  });
  return (
    <AppForm form={form} className="relative">
      <div className="sticky top-12 z-10 flex h-16 items-center justify-between bg-background">
        <h1 className="text-2xl font-bold">
          Edit {collection.labels.singular} -{" "}
          <span className="text-primary">
            {String(currentDocument[collection.admin.useAsTitle] ?? "")}
          </span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex gap-2">
              <RevalidateButton collection={collection.slug} doc={currentDocument} />
              <Button
                type="submit"
                className="transition-all duration-300"
                isPending={isPending}
                disabled={!canEdit || isDefaultValue}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="transition-all duration-300"
                disabled={!canEdit || isDefaultValue}
                onClick={() => {
                  form.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        />
      </div>
      <div className="space-y-4">
        {visibleFields.map(([fieldKey, field]) => {
          const InputComponent = fieldToInputComponent(field.type);
          if (!InputComponent) {
            // TODO: handle missing component error here
            throw new Error(`Missing component for field type '${field.type}'`);
          }
          return (
            <InputComponent
              key={fieldKey}
              name={fieldKey}
              fieldDef={field}
              readOnly={
                !canEdit || field.admin.readOnly || !isFieldAllowed(fieldPermissions, fieldKey)
              }
              collection={collection}
            />
          );
        })}
      </div>
    </AppForm>
  );
}
```

#### packages/react/src/components/views/MediaCollectionListView.tsx

2 edits.

**1 — `MediaCollectionListViewProps`.** Swap `collection: MediaCollectionConfig` for
`collectionSlug: MediaCollectionSlug`.

```ts
import {
  CRUD_ACTIONS,
  isFieldAllowed,
  PERMISSION_SCOPES,
  type MediaCollectionSlug,
  type TDocument,
  type VexMediaDocument,
  type PaginationResult,
  vexConvexApi,
} from "@vexcms/core";
```

```ts
/**
 * Props for the `MediaCollectionListView` component.
 */
export interface MediaCollectionListViewProps<TDoc extends VexMediaDocument = VexMediaDocument> {
  /** The slug of the media collection being listed, resolved from `useVexConfig()`. */
  collectionSlug: MediaCollectionSlug;
  /**
   * Pre-fetched documents from the server. Passed as `initialData` to the
   * TanStack Query so the list renders immediately on first load.
   */
  initialData?: PaginationResult<TDoc>;
}
```

**2 — deleted fallback block, and the replacement body.** Deletes:

```ts
const liveConfig = useVexConfig();
// Prefer the live context collection (updated via Fast Refresh) over the
// RSC-serialized prop, falling back to the prop if context isn't available.
const collection =
  liveConfig?.mediaCollections.find((c) => c.slug === props.collection.slug) ?? props.collection;
```

Same invariant as `CollectionListView`: one provenance, `useVexConfig().mediaCollections`.

```ts
/**
 * Media collection list view.
 *
 * The media counterpart to `CollectionListView`. Renders the same data-table UI
 * (live-fetched via `find` + Convex subscription, server `initialData` for an
 * instant first paint) with two media-specific differences:
 *
 * 1. A leading **preview** column shows a thumbnail of each media file (from the
 *    `src` field), falling back to a placeholder when no URL is present.
 * 2. The create flow opens the media upload modal (an upload dropzone) instead
 *    of a field form, and the header action reads "Upload" rather than "New".
 *
 * Renders the *content area only* — wrap it in `AdminLayout`.
 *
 * @param props - View props.
 * @param props.collectionSlug - The slug of the media collection to list.
 * @param props.initialData - Pre-fetched documents from the server (for SSR).
 * @returns The media data table, a not-found message, or an empty state.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 *
 * @example
 * ```tsx
 * <MediaCollectionListView collectionSlug="images" initialData={serverDocs} />
 * ```
 */
export function MediaCollectionListView(props: MediaCollectionListViewProps) {
  const config = useVexConfig();
  const collection = config.mediaCollections.find((c) => c.slug === props.collectionSlug);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  const numItems = Math.max(
    collection.admin.table.serverPageSize,
    collection.admin.table.defaultPageSize,
  );

  const pagination = usePaginatedQuery<VexMediaDocument>({
    query: {
      collection: collection.slug,
      depth: 1,
      limit: 100,
      paginationOpts: {
        numItems,
        totalDocs: true,
        cursor: null,
      },
    },
    initialData: props.initialData,
    clientPageSize: collection.admin.table.defaultPageSize,
  });

  // Declared after `pagination` because `getChanges` reads its loaded rows: a
  // deleted document cannot be re-read server-side, so the pre-delete state
  // has to travel with the request.
  const deleteMediaMutation = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args }) =>
      args.ids.flatMap((id) => {
        const row = pagination.results.find((doc) => doc._id === id);
        return row === undefined ? [] : [{ before: row }];
      }),
    mutationFn: vexConvexApi.remove,
    operation: "remove",
  });

  async function handleBulkDelete(selectedIds: string[]) {
    await deleteMediaMutation.mutateAsync({ ids: selectedIds, collection: collection.slug });
  }

  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });

  const columns = useMemo(
    () =>
      [mediaPreviewColumn(), ...getCollectionColumnDefs<VexMediaDocument>({ collection })].filter(
        (column) => {
          const key = columnFieldKey(column);
          return key === undefined || isFieldAllowed(fieldPermissions, key);
        },
      ),
    [collection, fieldPermissions],
  );

  const canCreate = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.create,
    scope: PERMISSION_SCOPES.any,
  });
  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });
  return (
    <div>
      <CreateMediaModal collectionSlug={collection.slug} />

      <div className="mb-6 flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm" suppressHydrationWarning>
            {pagination.isPending
              ? "Loading…"
              : `${pagination.results.length} item${pagination.results.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          nativeButton={false}
          disabled={!canCreate}
          render={
            <VexLink href={`/admin/${collection.slug}?${MODALS.uploadMedia.urlParam}=true`} />
          }
        >
          + Upload {collection.labels.singular}
        </Button>
      </div>

      {pagination.results.length === 0 && !pagination.isPending ? (
        <div className="text-muted-foreground rounded-md border py-12 text-center">
          No {collection.labels.plural.toLowerCase()} yet.{" "}
          <VexLink
            href={`/admin/${collection.slug}?${MODALS.uploadMedia.urlParam}=true`}
            className="text-primary hover:underline"
          >
            Upload one.
          </VexLink>
        </div>
      ) : (
        <div className="grid place-items-center rounded-md border">
          <DataTable
            data={pagination.results}
            columns={columns}
            isDone={pagination.isDone}
            onLoadMore={() => pagination.loadMore()}
            isLoadingMore={pagination.isPending}
            totalCount={pagination.totalDocs}
            enableRowSelection
            enableBulkActions
            entityName={collection.labels.plural}
            onBulkDelete={canDelete ? handleBulkDelete : undefined}
            isDeleting={deleteMediaMutation.isPending}
            isPending={pagination.isPending}
          />
        </div>
      )}
    </div>
  );
}
```

#### packages/react/src/components/views/MediaCollectionEditView.tsx

3 edits — the segment's shown code below never added the `useVexConfig` import the body
requires, and the props edit alone left `MediaCollectionConfig`/`MediaCollectionMeta` imports
that the widened-generics resolution drops; a new "1 — imports" edit is added to correct this,
renumbering the two edits below to 2 and 3.

**1 — imports.** Drop `MediaCollectionConfig`/`MediaCollectionMeta` — no longer referenced once
the props interface below drops its `TFieldMeta`/`TCollectionMeta` generics; add `useVexConfig`.

```ts
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { CRUD_ACTIONS, isFieldAllowed, vexConvexApi } from "@vexcms/core";
import type { MediaCollectionSlug, VexMediaDocument } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import {
  useCollectionForm,
  useFieldPermissions,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";
import { useVexConfig } from "../../context/VexConfigContext";
```

**2 — `MediaCollectionEditViewProps`.** Drop `TFieldMeta`/`TCollectionMeta`; swap `collection` for
`collectionSlug`.

```ts
/**
 * Props passed to the `MediaCollectionEditView` component.
 *
 * `TCollectionSlug` narrows to a literal when the caller supplies one — see
 * the note on {@link CollectionListViewProps} in `@vexcms/core`.
 */
export interface MediaCollectionEditViewProps<
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
> {
  /** The slug of the media collection whose fields will be rendered. */
  collectionSlug: TCollectionSlug;
  /**
   * The Convex document ID of the document being edited.
   * Omit for new document creation — the form will be empty.
   */
  documentId: VexMediaDocument["_id"];
  /**
   * Pre-fetched document from the server for SSR hydration.
   * `null` explicitly means "no document found". `undefined` means "not loaded yet".
   */
  initialData?: VexMediaDocument | null;
}
```

**3 — replacement body.**
```ts
/**
 * Media collection document edit form.
 *
 * @param props - View props.
 * @param props.collectionSlug - The slug of the media collection whose fields are rendered.
 * @param props.documentId - Convex document ID to fetch and edit. Omit for new-document mode.
 * @param props.initialData - Server-prefetched document for SSR hydration. `null` means not found.
 * @returns The edit form, or a not-found message.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 */
export function MediaCollectionEditView<
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
>(props: MediaCollectionEditViewProps<TCollectionSlug>) {
  const config = useVexConfig();
  const collection = config.mediaCollections.find((c) => c.slug === props.collectionSlug);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  // Generic over `TCollectionSlug` — see the note in `CollectionEditView`: the slug is a
  // runtime value here, so this uses the generic endpoint rather than the
  // per-slug `get()` wrapper.
  const { data } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.documentId as string,
      collection: collection.slug,
    }),
    initialData: props.initialData,
  });
  const currentDocument = data as VexMediaDocument;

  if (!currentDocument) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args }) => [
      { after: { ...currentDocument, ...args.data }, before: currentDocument },
    ],
    mutationFn: vexConvexApi.update,
    operation: "update",
  });
  const visibleFields = useVisibleFields({
    resource: collection.slug,
    fields: collection.fields,
    data: currentDocument,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useCollectionForm({
    document: currentDocument,
    collection,
    readableFieldKeys,
    onSubmit: async () => {
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({
        id: currentDocument._id,
        collection: collection.slug,
        data: changes,
      });
      form.reset();
    },
  });

  useLiveFieldMerge({
    form,
    document: currentDocument,
    fieldKeys: readableFieldKeys,
  });

  const canEdit = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.update,
    data: data as {},
  });
  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.update,
    data: currentDocument,
  });

  return (
    <AppForm form={form} className="relative flex flex-col gap-4 pt-4">
      <div className="bg-background sticky top-12 z-10 flex h-16 items-center justify-between">
        <h1 className="text-2xl font-bold">
          Edit {collection.labels.singular} -{" "}
          {/* @ts-expect-error currentDocument[collection.admin.useAsTitle]: string */}
          <span className="text-primary">{currentDocument[collection.admin.useAsTitle]}</span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex gap-2">
              <Button
                type="submit"
                className="transition-all duration-300"
                isPending={isPending}
                disabled={!canEdit || isDefaultValue}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="transition-all duration-300"
                disabled={!canEdit || isDefaultValue}
                onClick={() => {
                  form.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        />
      </div>
      <div className="space-y-4">
        {visibleFields
          .filter(([_, fieldDef]) => !fieldDef.admin.hidden)
          .map(([fieldKey, field]) => {
            const InputComponent = fieldToInputComponent(field.type);
            if (!InputComponent) {
              // TODO: handle missing component error here
              throw new Error(`Missing component for field type '${field.type}'`);
            }
            return (
              <InputComponent
                key={fieldKey}
                name={fieldKey}
                fieldDef={field}
                readOnly={
                  field.admin.readOnly || !canEdit || !isFieldAllowed(fieldPermissions, fieldKey)
                }
                collection={collection}
              />
            );
          })}
      </div>
    </AppForm>
  );
}
```

#### packages/react/src/components/views/GlobalEditView.tsx

2 edits — the segment's shown import block below omitted the `useVexConfig` import this body
requires; added as part of edit 1.

```ts
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { CRUD_ACTIONS, GlobalEditViewProps, isFieldAllowed, vexConvexApi } from "@vexcms/core";
import { useVexConfig } from "../../context/VexConfigContext";
```

```ts
/**
 * Global document edit form.
 *
 * @param props - View props.
 * @param props.globalSlug - The slug of the global whose fields are rendered.
 * @param props.initialData - Server-prefetched document for SSR hydration.
 * @returns The edit form, or a not-found message when `globalSlug` does not resolve.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 */
export function GlobalEditView(props: GlobalEditViewProps) {
  const config = useVexConfig();
  const global = config.globals.find((g) => g.slug === props.globalSlug);

  // Resolved before any hook that reads `global.slug`/`global.fields`: unlike the old
  // destructured-prop version (where this check sat after 4 hooks, verifying a value
  // TypeScript already guaranteed truthy), `global` here comes from a runtime `.find()`
  // and can genuinely be `undefined` — deferring the check would dereference `.slug` on
  // `undefined` inside the `useQuery` call below.
  if (!global) {
    // TODO: add proper not found component or screen
    return <p>Global document not found.</p>;
  }

  // Runtime slug (`global.slug`) — uses the generic endpoint rather than the
  // per-slug `getGlobal()` wrapper. See the note in `CollectionEditView`.
  const { data: globalDoc } = useQuery({
    ...convexQuery(vexConvexApi.globals.get, { slug: global.slug }),
    initialData: props.initialData,
  });

  const { mutateAsync, isPending } = useVexMutation({
    collection: global.slug,
    // A global has no per-document identity, so one change carrying the
    // upserted data is enough — a global's mapper keys on the slug, which
    // travels as `collection`. Merged with the loaded document (like
    // `CollectionEditView`'s own `getChanges`) so a partial diff still
    // resolves revalidation targets from the full post-write state.
    getChanges: ({ args }) => [{ after: { ...(globalDoc ?? {}), ...args.data } }],
    mutationFn: vexConvexApi.globals.upsert,
    operation: "upsert",
  });

  const visibleFields = useVisibleFields({
    resource: global.slug,
    fields: global.fields,
    data: globalDoc,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useGlobalForm({
    document: globalDoc,
    global,
    readableFieldKeys,
    onSubmit: async ({ value }: { value: unknown }) => {
      // A global has no separate create view: before the first save,
      // `globalDoc` is undefined and `value` carries the field defaults,
      // which a diff (built against those same defaults) would omit.
      if (!globalDoc) {
        await mutateAsync({ slug: global.slug, data: value as Record<string, unknown> });
        form.reset();
        return;
      }
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({ slug: global.slug, data: changes });
      form.reset();
    },
  });

  useLiveFieldMerge({
    form,
    document: globalDoc,
    fieldKeys: readableFieldKeys,
  });

  const canEdit = usePermission({
    resource: global.slug,
    action: CRUD_ACTIONS.update,
    data: globalDoc as {},
  });
  const fieldPermissions = useFieldPermissions({
    resource: global.slug,
    action: CRUD_ACTIONS.update,
    data: globalDoc,
  });
  return (
    <AppForm form={form} className="relative">
      <div className="sticky top-12 z-10 mb-6 flex items-center justify-between bg-background pt-4">
        <h1 className="text-2xl font-bold">
          Edit Global - <span className="text-primary">{global.label}</span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex gap-2">
              <Button
                type="submit"
                className="transition-all duration-300"
                isPending={isPending}
                disabled={isDefaultValue || !canEdit}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="transition-all duration-300"
                disabled={isDefaultValue || !canEdit}
                onClick={() => {
                  form.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        />
      </div>
      <div className="space-y-4">
        {visibleFields.map(([fieldKey, field]) => {
          const InputComponent = fieldToInputComponent(field.type);
          if (!InputComponent) {
            // TODO: handle missing component error here
            throw new Error(`Missing component for field type '${field.type}'`);
          }
          return (
            <InputComponent
              key={fieldKey}
              name={fieldKey}
              fieldDef={field}
              readOnly={
                !canEdit || field.admin.readOnly || !isFieldAllowed(fieldPermissions, fieldKey)
              }
              collection={global}
            />
          );
        })}
      </div>
    </AppForm>
  );
}
```

#### packages/react/src/components/modals/CreateDocumentModal.tsx

1 edit.

```tsx
import { useRef, useState } from "react";
import { Button, DialogClose, DialogContent, DialogFooter, DialogHeader } from "../ui";
import { Modal } from "./BaseModal";
import { type CollectionSlug } from "@vexcms/core";
import { MODALS } from "./constants";
import { AppForm } from "../form";
import { useCollectionForm } from "../../hooks/useCollectionForm";
import { useVexConfig, useVexMutation } from "../../hooks";
import { RenderFieldInputComponents } from "../fields";
import { vexConvexApi } from "@vexcms/core";
import { parseAsBoolean, useQueryState } from "nuqs";
```

```tsx
/**
 * Modal for creating a new document in a collection.
 *
 * @param props - Component props.
 * @param props.collectionSlug - The slug of the collection the new document will be created in.
 * @returns A URL-state-driven `<Modal>` containing the creation form, or `null`
 *   when `collectionSlug` does not resolve against the current config.
 * @throws Never — resolution failure renders `null` instead of throwing.
 */
export function CreateDocumentModal(props: { collectionSlug: CollectionSlug }) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collectionSlug);

  if (!collection) {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  const [_, setOpen] = useQueryState(MODALS.createDocument.urlParam, parseAsBoolean);

  // Guards the window between a submit attempt and `useVexMutation`'s
  // `isPending`, which only flips true *after* TanStack Form's async field
  // validation resolves (BUGS-REPORT MODAL-1/MODAL-2). `isSubmittingRef` is
  // read synchronously inside the capture-phase submit handler below — two
  // `submit` events fired back-to-back never get a React re-render in
  // between, so a `disabled`/`dismissible` prop driven only by state cannot
  // stop the second one. `isSubmitting` mirrors the ref into render so the
  // submit button and the modal's dismissibility can react to it.
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endSubmit = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    // A create has no prior state; `result` is the new document's id, which the
    // submitted values alone cannot supply.
    getChanges: ({ args, result }) => [{ after: { ...args.data, _id: result } }],
    mutationFn: vexConvexApi.create,
    operation: "create",
  });

  const form = useCollectionForm({
    collection,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: async ({ value }: { value: any }) => {
      // `endSubmit` (not a trailing `finally` around the whole body) so the
      // guard clears *before* `setOpen(null)` clears the URL param — freeing
      // it after would force an extra render that races the URL-driven
      // close in `NuqsTestingAdapter`'s memoryless mode.
      try {
        await mutateAsync({ collection: collection.slug, data: value });
      } finally {
        endSubmit();
      }
      await setOpen(null);
    },
    // TanStack Form skips `onSubmit` entirely when validation fails, so the
    // in-flight guard above needs its own release on that path too.
    onSubmitInvalid: endSubmit,
  });

  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <Modal urlParam={MODALS.createDocument.urlParam} dismissible={!isSubmitting}>
      <DialogContent
        ref={dialogRef}
        initialFocus={dialogRef}
        className="flex h-[50svh] w-[50svw] flex-col"
        onSubmitCapture={(event) => {
          if (isSubmittingRef.current) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          isSubmittingRef.current = true;
          setIsSubmitting(true);
        }}
      >
        <AppForm form={form} className="flex h-full flex-col overflow-hidden">
          <DialogHeader className="px-2 pb-4">Create {collection.labels.singular}</DialogHeader>
          <div className="flex grow flex-col overflow-y-auto px-2">
            <RenderFieldInputComponents
              collection={collection}
              className="flex grow flex-col gap-2"
            />
          </div>
          <DialogFooter className="p-1">
            <Button isPending={isPending || isSubmitting} type="submit">
              {MODALS.createDocument.label}
            </Button>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
          </DialogFooter>
        </AppForm>
      </DialogContent>
    </Modal>
  );
}
```

#### packages/react/src/components/modals/CreateMediaModal.tsx

2 edits — the segment's shown import block below omitted `StorageAdapterSlug`, needed by
`adapterName`'s type annotation in the body; corrected here.

```tsx
import { useRef } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import type { MediaCollectionSlug, StorageAdapterSlug } from "@vexcms/core";
import { Button, DialogClose, DialogContent, DialogFooter, DialogHeader } from "../ui";
import { Modal } from "./BaseModal";
import { MODALS } from "./constants";
import { MediaUploadDropzone } from "../media";
import { useVexConfig } from "../../context";
```

```tsx
/**
 * Modal for uploading media into a media collection.
 *
 * @param props - Component props.
 * @param props.collectionSlug - The slug of the media collection uploads are created in.
 * @returns A URL-state-driven `<Modal>` containing the upload dropzone, or `null`
 *   when `collectionSlug` does not resolve against the current config.
 * @throws Never — resolution failure renders `null` instead of throwing.
 */
export function CreateMediaModal(props: { collectionSlug: MediaCollectionSlug }) {
  const config = useVexConfig();
  const collection = config.mediaCollections.find((c) => c.slug === props.collectionSlug);

  if (!collection) {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  const [_, setOpen] = useQueryState(MODALS.uploadMedia.urlParam, parseAsBoolean);

  // The adapter that owns this media collection (set during config resolution).
  const adapterName: StorageAdapterSlug = collection.meta?.storageAdapter ?? "convex";

  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <Modal urlParam={MODALS.uploadMedia.urlParam}>
      <DialogContent ref={dialogRef} initialFocus={dialogRef} className="w-[50svw] flex flex-col">
        <DialogHeader className="px-2 pb-4">Upload {collection.labels.singular}</DialogHeader>
        <div className="px-2">
          <MediaUploadDropzone
            targetCollection={collection.slug}
            adapterName={adapterName}
            onUploadComplete={() => {
              void setOpen(null);
            }}
          />
        </div>
        <DialogFooter className="p-1">
          <DialogClose render={<Button variant="outline">Done</Button>} />
        </DialogFooter>
      </DialogContent>
    </Modal>
  );
}
```

#### packages/next/src/NextAdminLayout.tsx

2 edits — `config` prop deleted outright; only the `sidebar_state` cookie read and
`user`/`organization`/`children` remain. The now-false sanitization TSDoc paragraphs are removed
(sanitize no longer happens here at all, not just "moved" — there is nothing left to sanitize on
this component's own boundary).

**1 — TSDoc and imports.**

```ts
import type { ReactNode } from "react";
import type { AdminUser } from "@vexcms/react";
import { NextAdminLayoutClient } from "./NextAdminLayoutClient";
import { cookies } from "next/headers";

/**
 * Next.js admin layout shell for VexCMS.
 *
 * A **server component** that reads the `sidebar_state` cookie server-side
 * (so the sidebar's open/closed state is correct on first paint, with no
 * client flash) and passes it, plus `user`/`organization`/`children`, to the
 * client leaf `NextAdminLayoutClient`. Config no longer crosses this
 * boundary at all — the admin panel's client tree gets its config from the
 * app's own `VexConfigProvider` mount (`clientProviders.tsx`), not from a
 * prop threaded through this layout.
 *
 * Render it from your admin `layout.tsx`. Because this is a server component,
 * your `layout.tsx` may itself be an `async` server component (e.g. to run auth
 * checks).
 *
 * @param props - Layout props.
 * @param props.children - The page content from `[[...slug]]/page.tsx`.
 * @param props.user - Current user for the admin shell.
 * @returns The rendered admin shell, wrapping `children` in the client boundary
 *   ({@link NextAdminLayoutClient}) with the server-read sidebar cookie state.
 * @example
 * ```tsx
 * // app/admin/layout.tsx
 * import { NextAdminLayout } from "@vexcms/next/client";
 * import { getCurrentUser } from "~/auth/serverUtils";
 *
 * export default async function AdminLayout({ children }: { children: ReactNode }) {
 *   const user = await getCurrentUser();
 *   return (
 *     <NextAdminLayout user={user ?? undefined}>
 *       {children}
 *     </NextAdminLayout>
 *   );
 * }
 * ```
 */
```

**2 — function signature and body.** Drop `config: VexConfig` from the props object; drop the
`sanitizeConfigForClient` call.

```tsx
export async function NextAdminLayout(props: {
  children: ReactNode;
  user?: AdminUser;
  organization?: Record<string, unknown>;
}) {
  const cookieStore = await cookies();
  const sidebarOpen = String(cookieStore.get("sidebar_state")?.value) === "true";

  return (
    <NextAdminLayoutClient
      user={props.user}
      organization={props.organization}
      sidebarOpen={sidebarOpen}
    >
      {props.children}
    </NextAdminLayoutClient>
  );
}
```

#### packages/next/src/NextAdminLayoutClient.tsx

2 edits.

**1 — TSDoc and imports.** Drop `ClientVexConfig`; remove the now-false "Receives an
already-sanitized `ClientVexConfig`" paragraph.

```tsx
"use client";
// "use client" is injected by the tsup build banner for this entry (see
// tsup.config.ts) so the emitted module carries the client boundary.
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import NextImage from "next/image";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AdminLayout, type AdminUser } from "@vexcms/react";

/**
 * Client leaf for the Next.js admin layout.
 *
 * Owns all client-only wiring that cannot run on the server:
 * - `usePathname()` to derive the active collection slug / document id for
 *   sidebar highlighting (Next.js layouts do not receive route params).
 * - `NuqsAdapter` (`nuqs/adapters/next/app`) so URL state works inside the
 *   admin routes.
 * - `NextLink` / `NextImage` passed as framework components so every
 *   `VexLink`/`VexImage` uses Next.js routing and image optimisation.
 *
 * Config reaches `AdminLayout`'s children through the app's own
 * `VexConfigProvider` mount, not through a prop on this component — this
 * leaf never touches config at all.
 *
 * This component is internal to `@vexcms/next` — applications render
 * {@link NextAdminLayout} instead.
 *
 * @param props - Layout props.
 * @param props.children - The page content from `[[...slug]]/page.tsx`.
 * @param props.user - Current user for the admin shell.
 * @returns The admin shell rendered from `children`, wrapped in `NuqsAdapter`
 * and the shared `AdminLayout`, wired with the active slug/document id derived
 * from `usePathname()` and Next.js `Link`/`Image` components.
 */
```

**2 — function signature and body.** Drop `config: ClientVexConfig`.

```tsx
export function NextAdminLayoutClient(props: {
  children: ReactNode;
  user?: AdminUser;
  organization?: Record<string, unknown>;
  sidebarOpen?: boolean;
}) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const activeSlug = segments[1];
  const activeDocID = segments[2];

  return (
    <NuqsAdapter>
      <AdminLayout
        activeSlug={activeSlug}
        components={{ Link: NextLink, Image: NextImage }}
        pathname={pathname}
        activeDocID={activeDocID}
        user={props.user}
        organization={props.organization}
        sidebarOpen={props.sidebarOpen}
      >
        {props.children}
      </AdminLayout>
    </NuqsAdapter>
  );
}
```

#### packages/next/src/NextAdminPage.tsx

2 edits — `config: VexConfig` is kept (server → server is not an RSC boundary), and
`admin.table.serverPageSize`/`defaultPageSize` are still read server-side before `fetchQuery`, but
every view now receives a slug (plus `initialData`) instead of the resolved config object. The
`sanitizeConfigForClient` call is dropped: nothing produced by this function crosses the RSC
boundary as an object anymore, so there is nothing left to sanitize — `props.config` (already the
fully-resolved `VexConfig`, which structurally contains every client field per the Contract) is
read directly.

**1 — imports.** Drop `sanitizeConfigForClient`.

```ts
import { fetchQuery } from "convex/nextjs";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, PaginationResult, VexConfig, VexMediaDocument } from "@vexcms/core";
import {
  DashboardView,
  CollectionListView,
  CollectionEditView,
  MediaCollectionEditView,
  MediaCollectionListView,
  GlobalsListView,
  GlobalEditView,
} from "@vexcms/react";
```

**2 — function body.** All seven render branches change; routing/not-found logic is unchanged
except reading `props.config` instead of a sanitized `clientConfig` copy.

```tsx
export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ path?: string[] }>;
  token?: string;
}) {
  const { path = [] } = await props.params;
  const [collectionSlug, documentId] = path;

  if (!collectionSlug) {
    return <DashboardView />;
  }

  if (collectionSlug === "globals") {
    if (!documentId) {
      return <GlobalsListView />;
    }
    const globalConfig = props.config.globals.find((g) => g.slug === documentId);
    if (!globalConfig) {
      return (
        <div>
          <p className="text-muted-foreground p-6">Global &quot;{documentId}&quot; not found.</p>
          <p>TODO: add not found view</p>
        </div>
      );
    }
    const global = await fetchQuery(
      vexConvexApi.globals.get,
      { slug: globalConfig.slug },
      props.token ? { token: props.token } : undefined,
    );
    return <GlobalEditView globalSlug={globalConfig.slug} initialData={global} />;
  }

  const collection = props.config.collections.find((c) => c.slug === collectionSlug);
  const mediaCollection = props.config.mediaCollections.find((mc) => mc.slug === collectionSlug);

  if (!collection && !mediaCollection) {
    return (
      <div>
        <p className="text-muted-foreground p-6">
          Collection &quot;{collectionSlug}&quot; not found.
        </p>
        <p>TODO: add not found view</p>
      </div>
    );
  }

  if (mediaCollection && documentId) {
    const initialData = await fetchQuery(
      vexConvexApi.get,
      { id: documentId, collection: mediaCollection.slug },
      props.token ? { token: props.token } : undefined,
    );
    return (
      <MediaCollectionEditView
        collectionSlug={mediaCollection.slug}
        documentId={documentId}
        initialData={initialData as VexMediaDocument | null}
      />
    );
  }

  if (mediaCollection) {
    const numItems = Math.max(
      mediaCollection.admin.table.serverPageSize,
      mediaCollection.admin.table.defaultPageSize,
    );
    const initialData = await fetchQuery(
      vexConvexApi.find,
      {
        collection: collectionSlug as CollectionSlug,
        paginationOpts: { numItems, totalDocs: true, cursor: null },
      },
      props.token ? { token: props.token } : undefined,
    );
    return (
      <MediaCollectionListView
        collectionSlug={mediaCollection.slug}
        initialData={initialData as PaginationResult<VexMediaDocument>}
      />
    );
  }

  if (collection && documentId) {
    const initialData = await fetchQuery(
      vexConvexApi.get,
      { id: documentId, collection: collection.slug },
      props.token ? { token: props.token } : undefined,
    );
    return (
      <CollectionEditView
        collectionSlug={collection.slug}
        documentId={documentId}
        initialData={initialData}
      />
    );
  }

  if (!collection) {
    throw new Error("invalid collection slug");
  }

  const numItems = Math.max(
    collection.admin.table.serverPageSize,
    collection.admin.table.defaultPageSize,
  );
  const initialData = await fetchQuery(
    vexConvexApi.findPaginated,
    {
      collection: collectionSlug as CollectionSlug,
      depth: 1,
      paginationOpts: { cursor: null, numItems, totalDocs: true },
    },
    props.token ? { token: props.token } : undefined,
  );
  return <CollectionListView collectionSlug={collection.slug} initialData={initialData} />;
}
```

#### apps/test/src/app/(vexcms)/admin/layout.tsx

1 edit — `NextAdminLayout` no longer takes `config`, and nothing else in this file reads it, so
the import is dropped entirely (the client config still reaches the tree — through
`ClientProviders`, which imports `~/vex.config` itself, per Step 4).

```tsx
import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { getCurrentUser } from "~/auth/serverUtils";
import { AuthServerProvider } from "~/components/providers/auth";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";

import { ClientProviders } from "./clientProviders";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AuthServerProvider>
      <ClientProviders>
        <ThemeStyle scope="admin" />
        <ThemeLive scope="admin" />
        <NextAdminLayout user={user ?? undefined}>{children}</NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  );
}
```

`apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx` requires **no change** in this step: it
still imports `~/vex.config.server` (repointed in Step 1), still passes `config={config}` to
`NextAdminPage` (kept per the Contract — server → server is not an RSC boundary), and still reads
`config.access` directly for `canAccessAdminPanel` before rendering (`access` is structurally on
`VexConfig` via the client-field spread). None of `NextAdminPage`'s prop contract changed in this
step.

#### apps/www/src/app/(vexcms)/admin/layout.tsx

1 edit — identical to `apps/test`'s.

```tsx
import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { getCurrentUser } from "~/auth/serverUtils";
import { AuthServerProvider } from "~/components/providers/auth";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";

import { ClientProviders } from "./clientProviders";

/**
 * Overlays `base-nextjs`'s admin layout to wire the theme system in: base
 * ships no theme, so its admin layout has nothing to render here. `<ThemeStyle
 * scope="admin" />` covers first paint; `<ThemeLive scope="admin" />` keeps it
 * live after a save in the admin panel, with no full reload. Emitted at
 * `:root:root`, so it outranks the site theme on admin routes only. Falls
 * back to the site theme when `siteSettings.adminTheme` is empty — see
 * `api.theme.getAdmin`.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AuthServerProvider>
      <ClientProviders>
        <ThemeStyle scope="admin" />
        <ThemeLive scope="admin" />
        <NextAdminLayout user={user ?? undefined}>{children}</NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  );
}
```

`apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx` requires no change, for the same reason as
`apps/test`'s.

#### packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx

1 edit — same shape, template style (no semicolons).

```tsx
import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import { AuthServerProvider } from "~/components/providers/auth"
import { getCurrentUser } from "~/auth/serverUtils"

import { ClientProviders } from "./clientProviders"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  return (
    <AuthServerProvider>
      <ClientProviders>
        <NextAdminLayout user={user ?? undefined}>{children}</NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  )
}
```

`packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/[[...path]]/page.tsx`
requires no change, for the same reason as the apps.

#### packages/create-vexcms/templates/marketing-site/src/app/(vexcms)/admin/layout.tsx

1 edit — same shape.

```tsx
import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { AuthServerProvider } from "~/components/providers/auth";
import { getCurrentUser } from "~/auth/serverUtils";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";

import { ClientProviders } from "./clientProviders";

/**
 * Overlays `base-nextjs`'s admin layout to wire the theme system in: base
 * ships no theme, so its admin layout has nothing to render here. `<ThemeStyle
 * scope="admin" />` covers first paint; `<ThemeLive scope="admin" />` keeps it
 * live after a save in the admin panel, with no full reload. Emitted at
 * `:root:root`, so it outranks the site theme on admin routes only. Falls
 * back to the site theme when `siteSettings.adminTheme` is empty — see
 * `api.theme.getAdmin`.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AuthServerProvider>
      <ClientProviders>
        <ThemeStyle scope="admin" />
        <ThemeLive scope="admin" />
        <NextAdminLayout user={user ?? undefined}>{children}</NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  );
}
```

`marketing-site` has no `[[...path]]/page.tsx` of its own (it overlays `base-nextjs`'s), so there
is nothing further to edit there.

#### packages/react/src/components/views/GlobalEditView.test.tsx

4 edits — every `createElement(GlobalEditView, { global: ... })` call swaps to `globalSlug`.

**1–3 — the three `testClientConfig.globals[0]` call sites** (lines 31, 46, 63 in the current
file). Representative:

```tsx
const utils = renderView(
  createElement(GlobalEditView, {
    globalSlug: testClientConfig.globals[0].slug,
    initialData: stored as never,
  }),
  { convex: t },
);
```

Applied identically at the other two call sites in this file (lines 46 and 63).

**4 — the `requiredSiteName` call site** (line 109). `global: requiredSiteName` was already an
inline override of `testClientConfig.globals[0]` with a required `siteName` field — since the
view now resolves its global from context by slug, the override must live on the `config` passed
through `renderView`'s options (it already does, at line 112: `config: { ...testClientConfig,
globals: [requiredSiteName] } as never`), not on the component's own prop.

```tsx
const utils = renderView(
  createElement(GlobalEditView, { globalSlug: requiredSiteName.slug, initialData: stored as never }),
  {
    convex: t,
    config: { ...testClientConfig, globals: [requiredSiteName] } as never,
    access: readGatedAccess,
    auth: { user: { _id: "u1", roles: "gated" } as never },
  },
);
```

#### packages/react/src/components/views/CollectionEditView.test.tsx

3 edits — every `createElement(CollectionEditView, { collection: testCollection, ... })` call
swaps to `collectionSlug: testCollection.slug`. Representative (identical at all three call
sites, lines 33, 50, 86):

```tsx
const utils = renderView(
  createElement(CollectionEditView, {
    collectionSlug: testCollection.slug,
    documentId: doc,
    initialData: stored,
  }),
  { convex: t },
);
```

#### packages/react/src/components/views/MediaCollectionEditView.test.tsx

2 edits — both `createElement(MediaCollectionEditView, { collection: testClientConfig.mediaCollections[0], ... })`
calls (lines 44, 75) swap to `collectionSlug: testClientConfig.mediaCollections[0].slug`.

```tsx
createElement(MediaCollectionEditView, {
  collectionSlug: testClientConfig.mediaCollections[0].slug,
  documentId: doc,
  initialData: stored as unknown as VexMediaDocument,
}),
```

No test in this package asserts a deleted prop's *value* (e.g. `expect(...).toHaveBeenCalledWith({
collection: ... })`) — every occurrence found is a render call site passing the object prop
positionally, not an assertion pinning the prop's plumbing. None qualifies for deletion under the
project's test bar (each surrounding `it` block asserts observable DOM/behavior — submitted diffs,
rendered headings, gated fields — not the prop shape itself), so all of the above are edited in
place, not removed.

#### packages/react/src/testing/viewSuite.ts

~50 mechanical call-site edits across this file's 8 view-`describe` functions and 3
shell-`describe` functions (`describeCollectionListView`, `describeCollectionEditView`,
`describeGlobalEditView`, `describeGlobalsListView`, `describeDashboardView`,
`describeMediaCollectionListView`, `describeMediaCollectionEditView`, `describeAdminSidebar`,
`describeAdminLayout`, `describeAdminTopNav`). Not itself a `*.test.tsx` file, but every
`*.test.tsx` file this step touches (`CollectionListView.test.tsx`, `CollectionEditView.test.tsx`,
`GlobalEditView.test.tsx`, `MediaCollectionListView.test.tsx`, `MediaCollectionEditView.test.tsx`,
`AdminLayout.test.tsx`, `AdminSidebar.test.tsx`, `AdminTopNav.test.tsx`, `DashboardView.test.tsx`,
`GlobalsListView.test.tsx`) is a one-line wrapper (`runViewSuite({ only: [...] })` /
`runShellSuite({ only: [...] })`) delegating its actual assertions here — leaving this file
unedited would fail every one of those wrappers, not just the three files with their own bespoke
`describe` blocks (edited above). Every occurrence follows one of three mechanical patterns:

**Pattern A — `collection: testCollection` / `collection: postsWithTitle` / `collection:
priorityTitleCollection` → `collectionSlug: <same>.slug`.** Representative, from
`describeCollectionListView`:

```ts
const utils = renderView(
  createElement(CollectionListView, { collectionSlug: testCollection.slug, initialData: toPage(docs) }),
  { convex: t },
);
```

The one variant inside `describeCollectionListView`'s field-permission test (currently reading
`liveConfig?.collections.find(...) ?? props.collection`'s replacement — the `config` local built
there) needs no change beyond the prop swap: `config` still carries `postsWithTitle` under
`collections`, and `CollectionListView` now resolves it via `useVexConfig().collections.find(...)`
against that same `config`, which `renderView`'s `config` option already threads into
`VexConfigContext`.

**Pattern B — `global: testClientConfig.globals[0]` → `globalSlug: testClientConfig.globals[0].slug`.**
Representative, from `describeGlobalEditView` (repeated ~10 times across that function and
`describeGlobalsListView`'s neighbor calls):

```ts
render: () => createElement(GlobalEditView, { globalSlug: testClientConfig.globals[0].slug }),
```

**Pattern C — `config: testClientConfig` (on `DashboardView`, `GlobalsListView`, `AppSidebar`,
`AdminLayout`, `AdminTopNav`) → dropped entirely; the component reads `useVexConfig()`, which
`renderWithVexProviders`/`renderView` already seed from `testClientConfig` by default.**
Representative, from `describeGlobalsListView` and `describeDashboardView`:

```ts
const utils = renderWithVexProviders(createElement(GlobalsListView, {}));
// ...
render: () => createElement(DashboardView, {}),
```

And from `describeAdminSidebar`/`describeAdminLayout`/`describeAdminTopNav` (representative):

```ts
createElement(SidebarProvider, null, createElement(AppSidebar, {}));
// ...
createElement(AdminLayout, {
  pathname: "/admin/posts",
  activeSlug: "posts",
  children: createElement("div", null, "content"),
});
// ...
createElement(AdminTopNav, { pathname: "/admin/posts", activeSlug: "posts", children: null });
```

`describeAdminLayout`'s own doc comment ("`AdminLayout` also provides its OWN internal
`VexConfigContext.Provider`... so an outer `auth` value never reaches its children either") is now
false and is corrected: `AdminLayout` no longer wraps its children in its own
`VexConfigContext.Provider` (Step 5's `AdminLayout.tsx` edit above), so the outer
`VexConfigContext` value from `wrapWithViewProviders`/`renderView` flows through unshadowed. The
existing per-scenario `access`/`auth` assertions in `describeAdminLayout` continue to pass
unchanged — they were never exercising the shadowed path in the first place, since
`describeAdminSidebar` (not `describeAdminLayout`) is the function documented as owning the real
per-scenario RBAC-gating assertion.

Verify:
- [ ] `grep` finds no `config: ClientVexConfig` or `collection: CollectionConfig` prop in `packages/react/src/components` or `packages/next/src`
- [ ] All four admin routes render in `apps/test`: dashboard, collection list, collection edit, global edit
- [ ] Editing a field's `label` in a collection file hot-reloads the admin table header without a full page reload (the Fast Refresh property `VexConfigContext.tsx:10-15` claims)

### Step 6 — Delete the serialization layer — [agent]

**File deletions**

Delete:
- `packages/core/src/config/sanitizeConfig.ts` — contains `ClientVexConfig` type, `stripNonSerializable`, and `sanitizeConfigForClient`
- `packages/core/src/config/sanitizeConfig.test.ts` — full test file

**Export removals from barrel files**

#### packages/core/src/config/index.ts
**1 — delete the re-export line** for the removed identifiers. Line 3 (`export { sanitizeConfigForClient, stripNonSerializable } from "./sanitizeConfig"`) and line 4 (`export type { ClientVexConfig } from "./sanitizeConfig"`) are deleted entirely.

#### packages/core/src/index.ts
No changes — the exports from `config/index.ts` that are deleted won't reach the top-level barrel via `export * from "./config"`.

**Type swap in framework interface**

#### packages/core/src/framework.ts
**1 — in `FrameworkAdapterProps` interface**, swap the `config` field type from `ClientVexConfig` to `VexClientConfig`. Search for the interface definition (around line 54–57 in the current codebase; the actual line may shift) and change the type annotation accordingly.

**TSDoc cleanup — four files**

Remove the RSC-sanitization framing paragraphs that are now obsolete:

#### packages/next/src/NextAdminLayout.tsx
**1 — remove the RSC-boundary framing** from the file's main docstring. Specifically, delete the sentences "It sanitizes the resolved `vex.config` with `sanitizeConfigForClient` — stripping storage adapter class instances, functions, and React components — *before* the config is handed to the client leaf `NextAdminLayoutClient`." and "This placement is the whole point: React serializes props when a server component renders a client component, so the sanitize **must** happen on the server side of that edge. Sanitizing inside the client component would run too late — the raw config would already have failed to serialize." and replace with a simpler statement that the component is a server-component wrapper sitting at the server→client boundary and handles browser-only work like cookies. The example code block (lines 35–50) also references `sanitizeConfigForClient` — update the import and remove that function call, then import `vex.config` directly instead.

#### packages/next/src/NextAdminLayoutClient.tsx
**1 — remove the "Receives an already-sanitized `ClientVexConfig`" sentence** from its docstring. The component now receives a plain `VexClientConfig` from context.

#### packages/next/src/NextAdminPage.tsx
**1 — remove RSC-sanitization explanation from docstring.** The current example (lines 36–49) and parameter description mention `sanitizeConfigForClient`; update the example to import `vex.config` directly and remove the sanitization call, then simplify the parameter description.

#### packages/react/src/context/VexConfigContext.tsx
**1 — rewrite the header docstring** from the current "Receives an already-sanitized config from the RSC boundary, populated by `AdminLayout`" framing to: "Holds the live VexCMS config for the duration of the admin session. Populated directly from the client-safe config module, re-evaluated by Fast Refresh when any collection file changes." The entire RSC-serialization paragraph is deleted; the implementation details about sanitization are gone.

**Verification gate — grep for zero hits**

```bash
grep -r "sanitizeConfigForClient\|stripNonSerializable\|ClientVexConfig" packages/core/src packages/next/src packages/react/src --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "\.typecheck\."
```

This grep MUST return zero results (apart from test and typecheck files, which may be updated in Step 8). If any hits remain outside the docs step, the deletion is incomplete.

---

### Step 7 — Scaffold and runtime verification — [dev]

Verify the split works end-to-end across real scaffolds and live apps.

- [ ] Run `pnpm exec create-vexcms` and scaffold a `base-nextjs` app in the default mode (`pnpm` package manager, `convex` storage). The admin panel loads (no 404s, no TypeErrors). Run `pnpm build` in the scaffolded app — it completes without errors.
- [ ] Same scaffold exercise for `base-nextjs` with `npm` as the package manager and `uploadthing` as storage adapter (two distinct parameter combinations per AP-020 — a real scaffold run finds template defects that static analysis misses).
- [ ] Scaffold `marketing-site`. After scaffolding, run `pnpm seed:init` to populate the seed data. The admin panel loads and the marketing homepage renders. Run `pnpm build` — it completes without errors.
- [ ] **Client-bundle audit:** Build a scaffolded app and inspect its client bundle (`.next/static/chunks`) via `grep` or a bundler analysis tool. Confirm the bundle contains no `better-auth`, no `BETTER_AUTH_SECRET` env var reference, and no `convex/server` module. The audit MUST check the real build artifact, not the source code — dead code elimination may remove unused imports.
- [ ] **Live admin panel verification in `apps/test`:**
  - Sign in (the auth page loads; credentials work).
  - Navigate to a collection list (e.g., pages). The table renders with columns and data.
  - Edit a document (click into a row; the edit form loads; submit a field change and confirm the document saves).
  - Upload media (use the admin's media picker or collection-specific upload affordance; confirm the file uploads and appears).
  - Check permission-gated affordances (if the logged-in user has a role without certain action permissions, confirm those affordances are hidden; switch roles or orgs and re-check).
- [ ] **Same verification for `apps/www`:**
  - Sign in.
  - Navigate to a collection (e.g., site settings or pages).
  - Edit and save a document.
  - Upload an image.
  - Check permission gating.

**Note:** Per P-024, do not start dev servers. Attach to the developer's running `next dev` and `convex dev` processes (ports are configured in each app's `dev` script or `.env.local`). A fresh scaffold will have its own dev server started by the scaffolding process — use that one. Confirm it boots cleanly without requesting manual intervention.

---

### Step 8 — Documentation — [agent, at commit time]

Run after Steps 1–7 are merged. Update guides, API docs, examples, and reference standards.

**Guides and field docs**

- `apps/docs/src/content/docs/guides/access-control.mdx` — `VexAccessProvider` → `VexConfigProvider`; only one provider, single mount with the config import
- `apps/docs/src/content/docs/guides/auth.mdx` — remove RSC-boundary framing; emphasize that auth collections are codegen output
- `apps/docs/src/content/docs/guides/caching-and-seo.mdx` — no config-shaped props cross the boundary
- `apps/docs/src/content/docs/guides/globals.mdx` — single config provider; no RSC prop serialization
- `apps/docs/src/content/docs/guides/local-api.mdx` — references to server vs. client config split
- `apps/docs/src/content/docs/guides/framework-adapters.md` — framework adapter receives `VexClientConfig`, not `ClientVexConfig`
- `apps/docs/src/content/docs/guides/theming.mdx` — config import and provider setup
- `apps/docs/src/content/docs/fields/relationship.mdx` — delete the `ClientVexConfig` explanation paragraph (near line 90–94 per spec-tasks.md)
- `apps/docs/src/content/docs/fields/upload.mdx` — single config provider, no separate `StorageAdapterContextProvider`

**README files**

- Root `README.md` — update quickstart to show `vex.config.ts` and `vex.config.server.ts` split
- `packages/core/README.md` — document `defineConfig` and `defineServerConfig` factories
- `packages/next/README.md` — `NextAdminLayout` and `NextAdminPage` examples using split configs
- `packages/react/README.md` — `VexConfigProvider` setup and hooks
- `packages/cli/README.md` — document `vex generate` and the auth-collections artifact
- `packages/create-vexcms/README.md` — scaffold templates reference the two-config pattern
- `packages/create-vexcms/templates/base-nextjs/README.md` — split-config quickstart
- `packages/create-vexcms/templates/marketing-site/README.md` — split-config quickstart

**TSDoc `@example` blocks**

Update code examples showing the old single-config pattern:

- `packages/next/src/NextAdminLayout.tsx` — example shows client-safe config import and `VexConfigProvider` mount (no sanitize call)
- `packages/next/src/NextAdminPage.tsx` — example shows direct config import from `vex.config.ts`
- `packages/file-storage-convex/src/mediaCollection.ts` — example of media collection declaration and usage
- `packages/core/src/config/config.ts` — `defineConfig` and `defineServerConfig` examples showing both factories and their signatures
- `packages/core/src/config/types.ts` — `VexClientConfig` and `VexConfig` type documentation with example usage

**Standards updates**

#### .agent/docs/standards/preferences.md
**1 — rewrite P-004 and P-005 entirely.** These two preferences both cite the RSC prop's role in stripping `access` and are superseded by this spec.

**P-004 rewrite:** "RBAC/permission checks run client-side by calling `hasPermission` **directly** (no server-computed permission snapshot). The `access` config and `storage.clientUploads` map reach the client via a **direct client-bundle import** into `VexConfigProvider`, NOT a serialized RSC prop. The client config is evaluated once per bundle graph (server-side and browser), producing reference-unequal but deep-equal object trees; all comparisons are slug/string-keyed (`props.activeSlug === collection.slug`, not identity). User and organization context arrive as serializable props from the server layout into a separate `VexAuthContext`. Both are synchronous at first render (no FOUC). Shipping permission rules to the client is accepted for **advisory** UI gating — server API guards remain the enforcement point; a hidden/disabled affordance is UX, not security."

**P-005 deletion:** Delete entirely. The distinction between RSC-serialized props and direct-import modules is no longer a live constraint—the entire RSC serialization path is gone. The rule that mattered was "avoid serialization" and that is now achieved by avoiding RSC-boundary props on the config, period.

**Product backlog**

#### .agent/docs/product/backlog.md
**1 — add a new backlog item** for multi-adapter media collections:

"**Multi-adapter media collections** — Allow a single media collection to route uploads to multiple storage adapters (e.g., local dev to file-storage-local, prod to Convex). Current implementation routes by collection slug at `packages/core/src/media/api/mutations.ts:57,113`; supporting multiple adapters per collection requires per-document adapter routing and a new `meta.storageAdapterForDocument` field or similar to guide the client uploader. Low priority; current single-adapter-per-collection model has proved workable in practice."

---

## Verification

Run the workspace build and test suite to confirm all changes are working:

```bash
pnpm build
pnpm test
```

Both commands MUST pass green. If any failures occur, fix them before marking the spec complete. The build command runs `turbo run build` across all packages and apps; the test command runs `turbo run test` across all test suites.

If the `apps/test` or `apps/www` tests reference the deleted `ClientVexConfig` type or `sanitizeConfigForClient` function, those tests need to be updated to use `VexClientConfig` and remove the sanitization step (the config is now client-safe by construction).
