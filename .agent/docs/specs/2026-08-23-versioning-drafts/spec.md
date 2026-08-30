---
status: draft
spec_id: 2026-08-23-versioning-drafts
touches:
  - packages/core/src/versioning/**
  - packages/core/src/collections/types.ts
  - packages/core/src/collections/config.ts
  - packages/core/src/schema/**
  - packages/core/src/access/constants.ts
  - packages/core/src/access/types.test.ts
  - packages/core/src/api/versions/**
  - packages/core/src/api/globals/upsert.server.ts
  - packages/core/src/api/remove/server.ts
  - packages/core/src/api/find/server.ts
  - packages/core/src/api/get/server.ts
  - packages/core/src/api/search/server.ts
  - packages/core/src/api/convex.ts
  - packages/core/src/api/server.ts
  - packages/core/src/api/client.ts
  - packages/react/src/components/views/**
  - packages/react/src/hooks/useAutosave.ts
  - packages/cli/src/lib/migrate.ts
  - packages/cli/src/lib/generateSchema.ts
  - apps/www/src/vexcms/collections/pages.ts
  - apps/www/src/auth/access.ts
  - apps/www/convex/vex.ts
  - apps/docs/src/content/docs/guides/versioning-and-drafts.mdx
prompt_version: 1
---

# 2026-08-23-versioning-drafts — Spec

## Overview

Draft/publish workflow, version history, and autosave for collections and globals.
Nothing related exists in the rebuild today: `CollectionConfig` has no `versions` field,
`vex_versions` appears nowhere, and the schema generator asserts the absence of
`vex_status`.

The model is two rows per logical document. The **main row** is created once, holds the
latest published content and a stable `_id`, and is the only thing public reads touch. A
**draft row** — at most one, carrying `vex_publishedId` back to its published row —
holds in-progress edits as a first-class typed document. `vex_versions` holds immutable
history, keyed `(collection, documentId)`, never scanned and never used to serve
published content.

**Depends on `2026-08-23-access-index-resolution` Steps 1–5.** The published-only filter
is a framework-supplied access index, deliberately not a permission rule: with two rows
sharing a slug, filtering by status is a *correctness* requirement, so an unfiltered
query would return the same logical document twice.

Full design, including the retracted alternatives and why: `design-review.md` (this
directory). Background: `research.md`, `convex-component-decision.md`.

## Design Decisions

1. **Two rows per document, not one row plus snapshots.** Drafts are first-class
   documents with real typed fields, indexes, and validation — a `snapshot: v.any()` blob
   inside `vex_versions` has none of that and forces a merge step on every edit-view load.
2. **The published row's `_id` is never destroyed.** Publishing patches the parent and
   deletes the draft — never the reverse. That `_id` is the canonical externally
   referenced identity: every `relationship` field stores it, and Convex assigns `_id` on
   insert so it cannot be carried onto a new row. Delete-and-promote would dangle every
   inbound relationship on every publish.
3. **A never-published draft is promoted in place.** With no prior published row to
   preserve, patching `vex_status` retains the `_id` — so both publish paths keep identity
   stable.
4. **Linking is one-directional: draft → published.** A reverse `hasDraft` flag on the
   published row would invalidate every Convex query subscribed to that document, pushing
   a reactive update to every visitor reading the page the moment an editor starts a
   draft. `by_published` answers "has a draft?" in one indexed lookup instead.
5. **The main table still needs `vex_status`.** Because the main row exists from creation
   and lives forever, it holds never-published and unpublished content — the status flag
   is what makes a stable-identity row safe to expose.
6. **Status fields only on versioned collections.** Reverses both `master` and
   `research.md`. On a non-versioned collection nothing can ever write `vex_status`, so it
   is noise that a published-only filter would read as "deny everything".
7. **`vex_versions` is always emitted.** Removing versioning from the last versioned
   collection must not break `schema.ts` imports.
8. **`publishedAt` on the history row, set once and never cleared.** `master`'s `unpublish`
   patched the latest published row's `status` back to `draft`, destroying the record that
   it was ever live — a single mutable `status` cannot represent
   publish → unpublish → republish.
9. **`unpublish` rejects while a draft row exists.** Otherwise the document would hold two
   draft rows and the survivor's `vex_publishedId` would point at a row that is no longer
   published. Preserves the invariant: at most one draft row per document, pointing at a
   published row or at nothing.
10. **Autosave writes a normal draft and emits history.** It fires only when form values
    differ from the last saved values, so successive identical snapshots cannot occur.
    `master` needed an `isAutosave` flag and coalesce-by-upsert only because its 2s
    interval re-fired whether or not anything changed.
11. **No preview-snapshot mechanism.** `master` needed a fourth `previewSnapshot` status
    because interval autosave lagged the form. Here the draft row tracks the form on
    change, so the draft row *is* the preview state. Deletes a status literal, three
    snapshot functions, and the orphaned-snapshot problem.
12. **`publish` takes `data` and treats it as authoritative.** No `JSON.stringify`
    snapshot comparison: key order follows insertion order, which form libraries do not
    hold stable across renders, so equivalent objects compared unequal and appended
    spurious rows.
13. **`getLatestVersion` uses its index.** `master` `.collect()`ed every version row for a
    document and found the max in JS — 100 document reads per save at `maxPerDoc: 100`,
    unbounded at `0`.
14. **Drafts are actions on the collection subject, not a separate resource.** Already
    encoded in shipped types: `DRAFT_ACTIONS` plus `HasDrafts` in `access/types.ts:139-162`
    add draft actions to a resource's action union only when it declares
    `versions.drafts: true`. A separate `posts.versions` subject would double the matrix
    and break that inference.
15. **`deleteVersions` is a distinct action.** `master` gated version deletion on `update`
    (`versions.ts:457`), letting any editor destroy audit history. It is not `delete`
    either — that means delete the document.
16. **Restore is client-side.** Read the snapshot, hydrate the form, `saveDraft({ restoredFrom })`.
    Non-destructive and reversible with no server-side restore mutation.
17. **`backfillVersionStatus` is not ported.** It migrated documents predating `vex_status`
    and there are no legacy rows here. Its CLI caller is already dead code
    (`generateSchema.ts:219` tests `c.versions?.drafts` on a `CollectionConfig` that has no
    `versions` field, so it is always false and `tsc` never flagged it). What survives is a
    genuinely needed one-shot: enabling drafts on a collection with existing rows leaves
    them `vex_status: undefined`, invisible to an index equality range.
18. **`environmentId?: string` accepted and ignored** on `saveDraft`/`publish` from day one,
    per the roadmap's Spec 21 note, so signatures stay stable when environments ship.
19. **`versions.drafts` must survive as a literal boolean on the resolved config, so
    `defineCollection` takes a `TDrafts extends boolean` generic.** `HasDrafts`
    (`access/types.ts:139-144`) discriminates with `D extends true`, which requires a
    literal. Verified against the shipped tree: `GlobalConfig.versions` is
    `{ drafts: boolean }` (`globals/types.ts:180`), and `boolean extends true` is
    `false` — so **draft actions never unlock for globals today**, and mirroring that
    shape onto collections would make the `deleteVersions` gating test in Step 3
    unsatisfiable. The resolved type keeps a wide `boolean` default so existing bare
    `CollectionConfig` consumers are unaffected (confirmed non-breaking across
    `react`/`cli`/`next`/`better-auth`/`file-storage-convex` by `tsc --noEmit`).
    Step 15 applies the same fix to `GlobalConfig`.

## Out of Scope

- **Live preview** (Spec 10) — the next spec. This one deliberately supplies what it
  needs: the draft row *is* the preview state, read under `readDrafts`.
- **A published-history cap.** Pruning never deletes a row with `publishedAt` set, so a
  page published 500 times keeps 500 rows. Deferred to a per-collection setting:
  these rows are read only when the history menu opens — never on the public path, never
  in a list query — so growth is storage, not latency.
- **`versions.defaultStatus` + dev-start auto-backfill.** Step 16 ships the one-shot
  action; auto-detecting rows with `vex_status: undefined` needs either a scan or a
  "already backfilled" marker, because an index equality range cannot match a missing field.
- **A Convex component for `vex_versions`.** Settled in `convex-component-decision.md`:
  the component boundary forces two round trips on every edit-view load, which is the
  wall `@convex-dev/better-auth` hit.
- **Per-collection version tables.** A single `vex_versions` with compound indexes is
  equally fast and keeps cross-collection queries.
- **`createVexQuery` / `VexDraftsMode`.** Obsoleted by explicit draft parameters on the
  server API functions.
- **Environments** (Spec 21) — only the parameter is reserved.
- **A `restoreVersion` server mutation** — Decision 16.
- Anything in `2026-08-23-access-index-resolution`.

## Implementation

### Step 1 — `VersionsConfig` on collections `[agent]`

- [ ] `packages/core/src/versioning/constants.ts` (new)
- [ ] `packages/core/src/collections/types.ts` — `versions` on `CollectionConfigInput` / `CollectionConfig`
- [ ] `packages/core/src/collections/config.ts` — apply defaults; thread the `TDrafts` literal generic
- [ ] `packages/core/src/collections/config.test.ts` (new)

#### `packages/core/src/versioning/constants.ts`

```ts
/**
 * System field keys written onto the main table row of a versioned collection
 * (and `vex_globals` when any global declares drafts). Present only when
 * `versions.drafts: true` — a non-versioned collection's table never has
 * these. `extractUserFields` strips these, plus `_id` / `_creationTime`,
 * before writing a `vex_versions` history snapshot.
 */
export const VERSION_SYSTEM_FIELDS = {
  vex_status: "vex_status",
  vex_publishedAt: "vex_publishedAt",
  vex_publishedId: "vex_publishedId",
} as const;
/** Version system field key, derived from {@link VERSION_SYSTEM_FIELDS}. */
export type VersionSystemField = (typeof VERSION_SYSTEM_FIELDS)[keyof typeof VERSION_SYSTEM_FIELDS];

/**
 * Default cap on `vex_versions` rows retained per document when
 * `versions.maxPerDoc` is omitted.
 */
export const DEFAULT_MAX_VERSIONS_PER_DOC = 50 as const;

/**
 * Default debounce window, in milliseconds, before autosave writes a changed
 * draft row. Applied whenever `versions.autosave: true`.
 */
export const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1000 as const;
```

#### `packages/core/src/collections/types.ts`

`CollectionConfigInput` gains a sixth generic, `TDrafts extends boolean = false`, and a
`versions?` property typed against it — the `const` modifier on `defineCollection`'s own
type parameter (below) is what lets a call site's `versions: { drafts: true }` infer
`TDrafts = true` instead of widening to `boolean`. Without this, `HasDrafts` in
`access/types.ts` can never discriminate a specific collection (it already has this exact
problem structurally — `GlobalConfig.versions.drafts: boolean` is unparameterized, so
`HasDrafts<GlobalConfig>` always resolves to the union `boolean`, never a literal `true`).
Collections must not repeat that gap.

Replace the whole `CollectionConfigInput` interface (adds the 6th generic + `versions`
after `meta`, everything else unchanged):

```ts
export interface CollectionConfigInput<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends string = string,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = false,
> {
  /** Admin panel behaviour for this collection. All properties are optional. */
  admin?: AdminCollectionConfigInput<TFieldSlug, TComponent>;
  /** Convex table name — used as the database table identifier and URL slug in the admin panel. */
  slug: TCollectionSlug;
  /**
   * Display names shown in the admin panel navigation and list views.
   * Both are inferred from `slug` if omitted.
   */
  labels?: {
    /** Singular display name (e.g. `"Post"`). Inferred from slug if omitted. */
    singular?: string;
    /** Plural display name (e.g. `"Posts"`). Inferred from slug if omitted. */
    plural?: string;
  };
  /** Field definitions that make up this collection's document shape. */
  fields: Record<TFieldSlug, AdminField<TFieldMeta>>;
  /** Override the PascalCase interface name used in generated TypeScript types. Inferred from `slug` by `defineCollection` if omitted. */
  interfaceName?: string;
  meta?: TCollectionMeta;
  /**
   * Draft and versioning config for this collection. Enabling `drafts` adds
   * `vex_status` / `vex_publishedAt` / `vex_publishedId` to the generated
   * table (`generateVexSchema`) and the draft-workflow actions
   * (`readDrafts`, `saveDraft`, `publish`, `unpublish`, `deleteVersions`) to
   * this resource's subject in `defineAccess`.
   */
  versions?: {
    /** Enable the draft/publish workflow for this collection. Default: `false`. */
    drafts?: TDrafts;
    /** Debounce background saves to the draft row while the edit form is open. Ignored when `drafts` is `false`. Default: `false`. */
    autosave?: boolean;
    /** Cap on `vex_versions` rows retained per document. Default: `50` (`DEFAULT_MAX_VERSIONS_PER_DOC`). */
    maxPerDoc?: number;
  };
}
```

Replace the whole `CollectionConfig` interface (same 6th generic, defaulted **wide**
— `boolean`, not `false` — so every existing bare `CollectionConfig` usage across the
monorepo keeps accepting any specific instantiation covariantly):

```ts
export interface CollectionConfig<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = boolean,
> {
  /** Resolved admin panel configuration for this collection. */
  admin: AdminCollectionConfig<TFieldSlug, TComponent>;
  /** Convex table name for this collection. */
  slug: TCollectionSlug;
  /** Display names shown in the admin panel — always present after defaults are applied. */
  labels: {
    /** Singular display name (e.g. `"Post"`). */
    singular: string;
    /** Plural display name (e.g. `"Posts"`). */
    plural: string;
  };
  /** Resolved field definitions for this collection. */
  fields: Record<TFieldSlug, AdminField<TFieldMeta>>;
  /** PascalCase identifier derived from `slug`, used as the TypeScript interface name in generated types (e.g. `"posts"` → `"Posts"`). */
  interfaceName: string;
  meta: TCollectionMeta;
  /** Resolved versioning config. Always present after defaults. */
  versions: { drafts: TDrafts; autosave: boolean; maxPerDoc: number };
}
```

#### `packages/core/src/collections/config.ts`

Add the import, thread `TDrafts` through the internal `populateCollectionFieldMeta`
helper (its own generic, defaulted wide — it never reads `versions`, it just needs to
accept whatever `CollectionConfigInput` instantiation `defineCollection` passes it), and
apply `versions` defaults in `defineCollection`. `const TDrafts` on `defineCollection`
itself is what makes `defineCollection({ versions: { drafts: true } })` infer
`TDrafts = true` (not `boolean`) — verified against `access/types.ts`'s existing
`HasDrafts` conditional: with this generic in place, `HasDrafts<typeof draftPosts>`
resolves to the literal `true`, so `defineAccess` accepts `{ deleteVersions: true }` on
that resource and rejects it (`@ts-expect-error`) on a resource without `versions.drafts`
— see Step 3.

```ts
import { DEFAULT_MAX_VERSIONS_PER_DOC } from "../versioning/constants";
import { AdminField, CollectionFieldMeta, ComponentHKT } from "../fields";
import { CollectionSlug } from "../types";
import { toTitleCase, plural } from "../utils";
import { CollectionConfigInput, CollectionConfig } from "./types";
import { slugToPascalCase } from "./utils";

function populateCollectionFieldMeta<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = boolean,
>({
  config,
}: {
  config: CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent,
    TDrafts
  >;
}): Record<TFieldSlug, AdminField<TFieldMeta & CollectionFieldMeta>> {
  const fields: Record<
    TFieldSlug,
    AdminField<TFieldMeta & { collectionSlug: string }>
  > = {} as Record<TFieldSlug, AdminField<TFieldMeta & CollectionFieldMeta>>;
  Object.entries(config.fields).forEach((value) => {
    const fieldSlug = value[0] as TFieldSlug;
    const field = value[1] as AdminField<TFieldMeta & CollectionFieldMeta>;
    fields[fieldSlug] = {
      ...field,
      meta: {
        ...field?.meta,
        collectionSlug: config.slug,
      },
    };
  });
  return fields;
}

/**
 * Resolves a raw collection config input into a fully-populated `CollectionConfig`.
 *
 * Fills in any missing `labels` by deriving them from the `slug` — converting it
 * to title case for `singular` and further pluralising it for `plural`. Applies
 * `versions` defaults (`drafts: false`, `autosave: false`,
 * `maxPerDoc: DEFAULT_MAX_VERSIONS_PER_DOC`) — `versions.drafts` keeps a literal
 * `true`/`false` type on the returned config (via the `const TDrafts` generic
 * below) so `defineAccess`'s `HasDrafts` check can gate the draft-workflow
 * actions per collection.
 *
 * @param config - The raw collection configuration supplied by the caller.
 * @returns The resolved `CollectionConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: {
 *     title: text({ required: true }),
 *   },
 *   versions: { drafts: true, autosave: true },
 * });
 * // → { slug: "posts", admin: { useAsTitle: "_id" }, labels: { singular: "Post", plural: "Posts" }, versions: { drafts: true, autosave: true, maxPerDoc: 50 }, fields: { ... } }
 * ```
 *
 * @see {@link CollectionConfigInput} for the user-facing input type
 * @see {@link CollectionConfig} for the resolved return type
 */
export function defineCollection<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
  const TDrafts extends boolean = false,
>(
  config: CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent,
    TDrafts
  >,
): CollectionConfig<
  TFieldMeta & CollectionFieldMeta,
  TCollectionMeta,
  TCollectionSlug,
  TFieldSlug,
  TComponent,
  TDrafts
> {
  const fields = populateCollectionFieldMeta({ config });
  return {
    interfaceName: slugToPascalCase({ slug: config.slug }) + "Document",
    ...config,
    fields,
    admin: {
      useAsTitle: "_id",
      components: {},
      ...config.admin,
      table: {
        defaultPageSize: 10,
        serverPageSize: 100,
        pageSizeOptions: [10, 25, 50, 100],
        defaultColumns: [],
        ...config.admin?.table,
        bulkActions: {
          delete: true,
          ...config.admin?.table?.bulkActions,
        },
        defaultSort: {
          field: "_createdAt",
          order: "desc",
          ...config.admin?.table?.defaultSort,
        },
      },
    },
    labels: {
      singular: toTitleCase(config.slug),
      plural: plural(toTitleCase(config.slug)),
      ...config.labels,
    },
    meta: {
      ...config.meta,
    } as TCollectionMeta,
    versions: {
      drafts: false,
      autosave: false,
      maxPerDoc: DEFAULT_MAX_VERSIONS_PER_DOC,
      ...config.versions,
    } as { drafts: TDrafts; autosave: boolean; maxPerDoc: number },
  };
}
```

#### `packages/core/src/collections/config.test.ts`

(new)

```ts
import { describe, expect, it } from "vitest";
import { text } from "../fields";
import { defineCollection } from "./config";
import { DEFAULT_MAX_VERSIONS_PER_DOC } from "../versioning/constants";

describe("defineCollection — versions defaults", () => {
  it("defaults versions.drafts to false when versions is omitted", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.versions.drafts).toBe(false);
  });

  it("defaults versions.autosave to false and maxPerDoc to DEFAULT_MAX_VERSIONS_PER_DOC", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.versions.autosave).toBe(false);
    expect(posts.versions.maxPerDoc).toBe(DEFAULT_MAX_VERSIONS_PER_DOC);
  });

  it("resolves versions.drafts: true when declared", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true },
    });
    expect(posts.versions.drafts).toBe(true);
    expect(posts.versions.autosave).toBe(false);
  });

  it("enables autosave alongside drafts", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, autosave: true },
    });
    expect(posts.versions.autosave).toBe(true);
  });

  it("respects a user-supplied maxPerDoc override", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, maxPerDoc: 10 },
    });
    expect(posts.versions.maxPerDoc).toBe(10);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 2 — Schema generation `[dev]`

- [ ] `packages/core/src/schema/generateVexSchema.ts` — versioning-aware schema emission (guided stub)
- [ ] `packages/core/src/schema/generateVexSchema.test.ts` — replace the globals "no versioning fields" test with its inverse; new collection-level + `vex_versions` coverage

#### `packages/core/src/schema/generateVexSchema.ts`

Guided stub — the whole function body is replaced with the pseudocode below; the
existing header/imports/collection-export/`vex_globals` behavior (today's `:44-73`)
must be preserved as described in steps 1, 2, and 4 below, not dropped.

```ts
import type { VexConfig } from "../config/types";
import { collectionConfigToVexSchema } from "../collections";

function fail(contents: string) {
  return { update: false, contents };
}

function success(contents: string) {
  return { update: true, contents };
}

/**
 * Generates the full contents of `vex.schema.ts` from a resolved `VexConfig`.
 *
 * Returns `{ update: false, contents }` when there are no collections and no
 * globals — the output contains only the auto-generated header, no imports,
 * no table declarations, and no `vex_versions` table. Returns
 * `{ update: true, contents }` otherwise — the output includes the header,
 * `convex/server` / `convex/values` imports, one `export const` block per
 * collection, `vex_globals` when any global is registered, and
 * `vex_versions` unconditionally (so toggling a collection's
 * `versions.drafts` off later never breaks a `schema.ts` import of the
 * versions table).
 *
 * On a collection or global with `versions.drafts: true`, the emitted table
 * gains three system fields — `vex_status`, `vex_publishedAt`,
 * `vex_publishedId` (self-referential `v.optional(v.id(<own table>))`) —
 * and two indexes, `by_status` and `by_published`. Non-versioned tables get
 * none of this.
 *
 * @param props - Input props.
 * @param props.config - The fully resolved Vex configuration.
 * @returns An object with `update` (whether the file should be written to disk) and `contents` (the file string).
 *
 * @example
 * ```ts
 * const config = defineConfig({
 *   collections: [
 *     defineCollection({ slug: "posts", fields: { title: text() }, versions: { drafts: true } }),
 *   ],
 * });
 * const { update, contents } = generateVexSchema({ config });
 * // update   → true
 * // contents → '...export const posts = defineTable({\n\tvex_status: v.union(...), ...})\n\t.index("by_status", ["vex_status"])...\nexport const vex_versions = defineTable({...})...'
 * ```
 *
 * @see {@link collectionConfigToVexSchema} for the per-collection field/index string builder this wraps
 * @see {@link VexConfig} for the resolved config shape
 */
export function generateVexSchema(props: { config: VexConfig }): {
  update: boolean;
  contents: string;
} {
  // TODO: implement
  // 1. Header + early return — unchanged from today (`:44-47`): build the auto-generated
  //    header comment; `if (props.config.collections.length < 1 && props.config.globals.length < 1)`
  //    → return `fail(header)` immediately. → no `vex_versions` table in this branch — matches
  //    the existing "returns only the header when there are no collections" test.
  // 2. Imports — unchanged (`:49`): `import { defineTable } from "convex/server"` +
  //    `import { v } from "convex/values"`.
  // 3. Per-collection schemas, versioning-aware:
  //    a. `const allCollections = props.config.collections.concat(props.config.mediaCollections);`
  //    b. For each collection, call `collectionConfigToVexSchema({ collection, config: props.config })`
  //       to get its `defineTable(...)` block string — unchanged, do not touch
  //       `collections/validator.ts`.
  //    c. `if (collection.versions.drafts)`:
  //       i.   Build the versioning fields block (three `\t`-indented lines, mirroring the
  //            `fieldsBlock` style `collections/validator.ts:113` already emits):
  //            `vex_status: v.union(v.literal("draft"), v.literal("published")),`
  //            `vex_publishedAt: v.optional(v.number()),`
  //            `vex_publishedId: v.optional(v.id("${collection.slug}")),` — self-referential,
  //            design doc §9.
  //       ii.  Splice it into the schema string right after the `defineTable({\n` opener that
  //            `collectionConfigToVexSchema` always starts with, e.g.
  //            `schema.replace("defineTable({\n", `defineTable({\n${versioningFields}`)`.
  //       iii. Append `by_status` / `by_published` after whatever `.index()` / `.searchIndex()`
  //            chain `collectionConfigToVexSchema` already produced:
  //            `schema += '\n\t.index("by_status", ["vex_status"])\n\t.index("by_published", ["vex_publishedId"])';`
  //       → a versioned collection's block now contains the 3 fields + 2 extra indexes.
  //    d. Else leave the block untouched. → no `vex_status` anywhere in a non-versioned
  //       collection's schema.
  //    e. Join every (possibly-spliced) block with `"\n"`, same as today's `collectionSchemas`.
  // 4. `vex_globals` table, versioning-aware:
  //    a. `if (props.config.globals.length > 0)`, build the block exactly as today (`:59-70`):
  //       `slug: v.string()`, `data: v.any()`, `.index("by_slug", ["slug"])`.
  //    b. `if (props.config.globals.some((g) => g.versions.drafts))`, splice in the same
  //       three fields (step 3.c.i) with `vex_publishedId: v.optional(v.id("vex_globals"))` —
  //       globals are single-table, self-referential to `vex_globals` itself — plus the same
  //       `by_status` / `by_published` indexes, same splice technique as 3.c.ii/iii.
  //    → globals only gain versioning fields when at least one registered global declares
  //      `versions.drafts: true`; otherwise the table is unchanged from today.
  // 5. `vex_versions` table — unconditional, whenever step 1's early return did not fire:
  //    a. Build a fifth block, same literal-array-join style as `vex_globals` (`:59-70`):
  //       ```
  //       export const vex_versions = defineTable({
  //         collection: v.string(),
  //         documentId: v.string(),
  //         version: v.number(),
  //         status: v.union(v.literal("draft"), v.literal("published")),
  //         snapshot: v.any(),
  //         createdAt: v.number(),
  //         createdBy: v.string(),
  //         publishedAt: v.optional(v.number()),
  //         parentVersion: v.optional(v.number()),
  //         restoredFrom: v.optional(v.number()),
  //       })
  //         .index("by_document", ["collection", "documentId"])
  //         .index("by_document_version", ["collection", "documentId", "version"])
  //         .index("by_document_status", ["collection", "documentId", "status"])
  //       ```
  //    b. `documentId` is `v.string()`, not `v.id(...)` — one shared table serves every
  //       collection and global, so there is no single target table to reference.
  //    c. Not gated on any `versions.drafts` value — always present once step 1 didn't
  //       early-return, so removing `versions.drafts` from a collection later never breaks
  //       a `schema.ts` import of `vex_versions`.
  // 6. Return `success([header, imports, collectionSchemas, globalsTable, versionsTable].join("\n"))`.
  // Edge cases:
  // - Zero collections AND zero globals → step 1's early return fires; no `vex_versions`
  //   table is emitted even though step 5 is otherwise unconditional.
  // - Collections present, zero globals → `vex_versions` still emitted (step 5 doesn't
  //   depend on `globals.length`); `vex_globals` is not.
  // - A collection with `versions.drafts: false` (today's default, Step 1) must produce a
  //   block containing none of `vex_status` / `vex_publishedAt` / `vex_publishedId`.
  // - `vex_publishedId`'s target table differs by table: the collection's own slug for a
  //   collection, `"vex_globals"` for globals — never `"vex_versions"`.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/schema/generateVexSchema.test.ts`

Replaces the `does not include versioning fields in v35` test (currently lines
343-357, inside the existing `describe("generateVexSchema — globals", ...)` block)
with its inverse, plus a negative counterpart:

```ts
it("includes versioning fields on vex_globals when a global declares drafts: true", () => {
  const config = defineConfig({
    globals: [
      defineGlobal({
        slug: "nav",
        label: "Nav",
        fields: {} as any,
        versions: { drafts: true },
      }),
    ],
  });
  const { contents } = generateVexSchema({ config });
  expect(contents).toContain('vex_status: v.union(v.literal("draft"), v.literal("published")),');
  expect(contents).toContain("vex_publishedAt: v.optional(v.number()),");
  expect(contents).toContain('vex_publishedId: v.optional(v.id("vex_globals")),');
  expect(contents).toContain('.index("by_status", ["vex_status"])');
  expect(contents).toContain('.index("by_published", ["vex_publishedId"])');
});

it("does not add versioning fields to vex_globals when no global declares drafts", () => {
  const config = defineConfig({
    globals: [defineGlobal({ slug: "nav", label: "Nav", fields: {} as any })],
  });
  const { contents } = generateVexSchema({ config });
  expect(contents).not.toContain("vex_status");
  expect(contents).not.toContain("vex_publishedAt");
  expect(contents).not.toContain("vex_publishedId");
});
```

New describe blocks, appended after the `generateVexSchema — globals` block:

```ts
describe("generateVexSchema — versioning (collections)", () => {
  it("adds no vex_status/vex_publishedAt/vex_publishedId to a non-versioned collection", () => {
    const config = defineConfig({
      collections: [defineCollection({ slug: "posts", fields: { title: url() } })],
    });
    const { contents } = generateVexSchema({ config });
    const postsBlock = contents.slice(
      contents.indexOf("export const posts = defineTable({"),
      contents.indexOf("export const vex_versions"),
    );
    expect(postsBlock).not.toContain("vex_status");
    expect(postsBlock).not.toContain("vex_publishedAt");
    expect(postsBlock).not.toContain("vex_publishedId");
    expect(contents).not.toContain('.index("by_status"');
    expect(contents).not.toContain('.index("by_published"');
  });

  it("adds vex_status/vex_publishedAt/vex_publishedId to a versioned collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: url() },
          versions: { drafts: true },
        }),
      ],
    });
    const { contents } = generateVexSchema({ config });
    expect(contents).toContain('vex_status: v.union(v.literal("draft"), v.literal("published")),');
    expect(contents).toContain("vex_publishedAt: v.optional(v.number()),");
    expect(contents).toContain('vex_publishedId: v.optional(v.id("posts")),');
    expect(contents).toContain('.index("by_status", ["vex_status"])');
    expect(contents).toContain('.index("by_published", ["vex_publishedId"])');
  });

  it("self-references vex_publishedId to each versioned collection's own table", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: url() }, versions: { drafts: true } }),
        defineCollection({ slug: "authors", fields: { name: url() }, versions: { drafts: true } }),
      ],
    });
    const { contents } = generateVexSchema({ config });
    expect(contents).toContain('vex_publishedId: v.optional(v.id("posts")),');
    expect(contents).toContain('vex_publishedId: v.optional(v.id("authors")),');
  });

  it("only the versioned collection in a mixed set gets the versioning fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: url() }, versions: { drafts: true } }),
        defineCollection({ slug: "authors", fields: { name: url() } }),
      ],
    });
    const { contents } = generateVexSchema({ config });
    const authorsBlock = contents.slice(
      contents.indexOf("export const authors = defineTable({"),
      contents.indexOf("export const vex_versions"),
    );
    expect(authorsBlock).not.toContain("vex_status");
  });
});

describe("generateVexSchema — vex_versions table", () => {
  it("emits vex_versions unconditionally when a collection is registered, even with no versioned collections", () => {
    const config = defineConfig({
      collections: [defineCollection({ slug: "posts", fields: { title: url() } })],
    });
    const { contents } = generateVexSchema({ config });
    expect(contents).toContain("export const vex_versions = defineTable({");
    expect(contents).toContain("collection: v.string(),");
    expect(contents).toContain("documentId: v.string(),");
    expect(contents).toContain("version: v.number(),");
    expect(contents).toContain('status: v.union(v.literal("draft"), v.literal("published")),');
    expect(contents).toContain("snapshot: v.any(),");
    expect(contents).toContain("createdAt: v.number(),");
    expect(contents).toContain("createdBy: v.string(),");
    expect(contents).toContain("publishedAt: v.optional(v.number()),");
    expect(contents).toContain("parentVersion: v.optional(v.number()),");
    expect(contents).toContain("restoredFrom: v.optional(v.number()),");
    expect(contents).toContain('.index("by_document", ["collection", "documentId"])');
    expect(contents).toContain('.index("by_document_version", ["collection", "documentId", "version"])');
    expect(contents).toContain('.index("by_document_status", ["collection", "documentId", "status"])');
  });

  it("emits vex_versions when only globals are registered", () => {
    const config = defineConfig({
      globals: [defineGlobal({ slug: "nav", label: "Nav", fields: {} as any })],
    });
    const { contents } = generateVexSchema({ config });
    expect(contents).toContain("export const vex_versions = defineTable({");
  });

  it("does not emit vex_versions when there are no collections and no globals", () => {
    const config = defineConfig({ collections: [] });
    const { contents } = generateVexSchema({ config });
    expect(contents).not.toContain("vex_versions");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 3 — `deleteVersions` action `[agent]`

- [ ] `packages/core/src/access/constants.ts` — add `deleteVersions` to `DRAFT_ACTIONS`
- [ ] `packages/core/src/access/types.test.ts` — append the `deleteVersions` gating tests
      (file already exists, created by `2026-08-23-access-index-resolution` Step 3; this
      spec depends on that spec's Steps 1–5)

#### `packages/core/src/access/constants.ts`

```ts
/**
 * Draft workflow actions — present on a resource subject only when its config
 * declares `versions.drafts: true`. `deleteVersions` additionally gates
 * pruning from the `vex_versions` history table
 * (`api/versions/deleteVersion.server.ts`).
 */
export const DRAFT_ACTIONS = {
  readDrafts: "readDrafts",
  saveDraft: "saveDraft",
  publish: "publish",
  unpublish: "unpublish",
  deleteVersions: "deleteVersions",
} as const;
```

(`DraftAction`, immediately below `DRAFT_ACTIONS`, is unchanged — it already derives
from `typeof DRAFT_ACTIONS`.)

#### `packages/core/src/access/types.test.ts`

Append after the closing `});` of the existing `describe("PermissionCheck — indexed
object form", ...)` block. Reuses that file's existing `users` collection and
`baseInput`; `pages` (no `versions`) is that file's existing non-drafts collection —
only `draftPosts` is new.

```ts
const draftPosts = defineCollection({
  slug: "draftPosts",
  fields: { title: text({ required: true }) },
  versions: { drafts: true },
});

describe("access — DraftAction: deleteVersions", () => {
  it("appears on a resource subject that declares versions.drafts: true", () => {
    defineAccess({
      ...baseInput,
      resources: [draftPosts, users],
      permissions: {
        admin: {
          draftPosts: { deleteVersions: true },
        },
      },
    });
  });

  it("is absent from a resource subject without versions.drafts", () => {
    defineAccess({
      ...baseInput,
      resources: [pages, users],
      permissions: {
        admin: {
          // @ts-expect-error — "deleteVersions" requires versions.drafts on the resource
          pages: { deleteVersions: true },
        },
      },
    });
  });
});
```

Verify: `pnpm --filter @vexcms/core test`
### Step 4 — Version model helpers `[dev]`

- [ ] `packages/core/src/versioning/extractUserFields.ts`
- [ ] `packages/core/src/versioning/model.ts`
- [ ] `packages/core/src/versioning/extractUserFields.test.ts`
- [ ] `packages/core/src/versioning/model.test.ts`
- [ ] `packages/core/src/versioning/test/convex/schema.ts` — local test fixture (mirrors
      `packages/core/src/api/test/convex/schema.ts`'s pattern): a `posts` table carrying
      `vex_status`/`vex_publishedAt`/`vex_publishedId` + `by_status`/`by_published`
      indexes, and the `vex_versions` table with the `by_document_version` index. Scoped
      to `versioning/*.test.ts` only — does not touch the shared `api/test/convex`
      fixture that `api/versions/*.server.test.ts` (Step 5+) extends separately.
- [ ] `packages/core/src/versioning/test/convex/_generated/api.ts` — stub barrel (`export
      {}`), identical purpose to `api/test/convex/_generated/api.ts`: convex-test only
      needs a path containing `_generated` in the modules map.

#### `packages/core/src/versioning/test/convex/schema.ts`

```ts
import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
} from "convex/server";
import { v } from "convex/values";

/**
 * Fixture schema for `packages/core/src/versioning/*.test.ts`. A minimal
 * versioned collection (`posts`) plus the shared `vex_versions` history
 * table, mirroring the shapes `generateVexSchema` (Step 2) emits for any
 * collection declaring `versions.drafts: true`.
 */
const schema = defineSchema({
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    vex_status: v.union(v.literal("draft"), v.literal("published")),
    vex_publishedAt: v.optional(v.number()),
    vex_publishedId: v.optional(v.id("posts")),
  })
    .index("by_status", ["vex_status"])
    .index("by_published", ["vex_publishedId"]),

  vex_versions: defineTable({
    collection: v.string(),
    documentId: v.string(),
    version: v.number(),
    status: v.union(v.literal("draft"), v.literal("published")),
    snapshot: v.any(),
    createdBy: v.optional(v.string()),
    parentVersion: v.optional(v.number()),
    restoredFrom: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  }).index("by_document_version", ["collection", "documentId", "version"]),
});

export default schema;

export type FixtureDM = DataModelFromSchemaDefinition<typeof schema>;
export type FixturePost = DocumentByName<FixtureDM, "posts">;
export type FixtureVersion = DocumentByName<FixtureDM, "vex_versions">;
```

#### `packages/core/src/versioning/test/convex/_generated/api.ts`

```ts
// Stub _generated/api.ts for convex-test module root detection. These tests
// call versioning/model.ts functions directly via t.run() and register no
// Convex functions, so this file is never actually imported at runtime.
export {};
```

#### `packages/core/src/versioning/extractUserFields.ts`

```ts
import { VERSION_SYSTEM_FIELDS } from "./constants";

/**
 * Strips Convex system fields (`_id`, `_creationTime`) and every VexCMS
 * versioning lifecycle field (`VERSION_SYSTEM_FIELDS` — `vex_status`,
 * `vex_publishedAt`, `vex_publishedId`) from a document, leaving only the
 * fields a user actually authored on the collection.
 *
 * Used before every `vex_versions` snapshot write (a version history row
 * must never re-embed lifecycle metadata) and before copying a draft row's
 * fields onto its published parent during `publish` (Step 6) — the parent
 * keeps its own `vex_status`/`vex_publishedAt`/`vex_publishedId`, only its
 * user fields are overwritten.
 *
 * @typeParam T - The document shape being stripped.
 * @param props.doc - A full document as read from a collection table; may or
 *   may not carry Convex system fields and/or versioning fields.
 * @returns A shallow copy of `props.doc` with `_id`, `_creationTime`, and
 *   every `VERSION_SYSTEM_FIELDS` key removed.
 */
export function extractUserFields<T extends Record<string, unknown>>(props: {
  doc: T;
}): Record<string, unknown> {
  // TODO: implement
  // 1. Shallow-copy `props.doc` into a plain object (never mutate the input —
  //    callers pass live Convex documents).
  // 2. Delete `_id` and `_creationTime` from the copy.
  // 3. Delete every key listed in `VERSION_SYSTEM_FIELDS` from the copy.
  //    → these are `vex_status`, `vex_publishedAt`, `vex_publishedId` —
  //      lifecycle fields owned by the versioning system, never part of a
  //      user's field config, and never valid inside a version snapshot.
  // 4. Return the copy.
  // Edge cases:
  // - A doc missing one or more of the fields above (e.g. a row from a
  //   never-versioned collection, or a snapshot already stripped) — deleting
  //   an absent key is a no-op, never throw.
  // - Values are NOT deep-cloned; nested objects/arrays keep their original
  //   references (matches how the result is written straight into `v.any()`).
  throw new Error("Not implemented");
}
```

#### `packages/core/src/versioning/extractUserFields.test.ts`

```ts
import { describe, expect, test } from "vitest";

import { extractUserFields } from "./extractUserFields";

describe("extractUserFields", () => {
  test("strips _id, _creationTime, and every VERSION_SYSTEM_FIELDS key", () => {
    const doc = {
      _id: "abc123" as unknown,
      _creationTime: 1700000000000,
      title: "Hello",
      slug: "hello",
      vex_status: "published" as const,
      vex_publishedAt: 1700000000000,
      vex_publishedId: undefined,
    };

    expect(extractUserFields({ doc })).toEqual({
      title: "Hello",
      slug: "hello",
    });
  });

  test("is a no-op on fields absent from the input", () => {
    const doc = { title: "Only user fields" };

    expect(extractUserFields({ doc })).toEqual({ title: "Only user fields" });
  });

  test("does not mutate the input document", () => {
    const doc = { _id: "abc123", title: "Hello", vex_status: "draft" as const };
    const original = { ...doc };

    extractUserFields({ doc });

    expect(doc).toEqual(original);
  });

  test("preserves falsy and nullish user field values", () => {
    const doc = {
      _id: "abc123",
      _creationTime: 1,
      title: "",
      count: 0,
      featured: false,
      note: null,
      vex_status: "draft" as const,
    };

    expect(extractUserFields({ doc })).toEqual({
      title: "",
      count: 0,
      featured: false,
      note: null,
    });
  });

  test("does not deep-clone nested values", () => {
    const tags = ["a", "b"];
    const doc = { _id: "x", tags, vex_status: "draft" as const };

    const result = extractUserFields({ doc });

    expect(result.tags).toBe(tags);
  });
});
```

#### `packages/core/src/versioning/model.ts`

```ts
import type {
  DocumentByName,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";
import { DEFAULT_MAX_VERSIONS_PER_DOC } from "./constants";

/** Lifecycle state of a `vex_versions` row — mirrors `vex_status` on the main table. */
export type VersionStatus = "draft" | "published";

/**
 * A row from the shared `vex_versions` table. One row per meaningful state of
 * one logical document — never mutated after creation except by `publish`'s
 * supersede path (Step 6), which writes a fresh row rather than editing one.
 *
 * @see {@link createVersion}
 */
export interface VersionRow {
  _id: string;
  _creationTime: number;
  /** The collection slug this version belongs to (e.g. `"posts"`). */
  collection: string;
  /** The PUBLISHED row's `_id`, stringified — stable across draft churn. */
  documentId: string;
  /** 1-based, monotonically increasing per `(collection, documentId)`. */
  version: number;
  status: VersionStatus;
  /** User fields only — see {@link extractUserFields}. Stored as `v.any()`. */
  snapshot: Record<string, unknown>;
  createdBy?: string;
  /** The version this one was derived from (linear chain). */
  parentVersion?: number;
  /** Set when this row was produced by a restore — the version restored FROM. */
  restoredFrom?: number;
  /** Set once, when this state went live; never cleared by unpublish. */
  publishedAt?: number;
}

/**
 * Server-side args shared by every `versioning/model.ts` read.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - The collection this version belongs to.
 */
export interface VersionQueryProps<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> {
  ctx: GenericQueryCtx<DataModel>;
  collection: TCollectionSlug;
  /** The PUBLISHED row's id — see {@link VersionRow.documentId}. */
  documentId: GenericId<TCollectionSlug>;
}

/**
 * Reads the single most recent `vex_versions` row for a document.
 *
 * @remarks
 * MUST go through the `by_document_version` index with
 * `.order("desc").first()` — an O(1) indexed read. The `master` reference
 * (`model/versions.ts:86-102`) `.collect()`ed every version row for the
 * document and found the max `version` number in JS: with `maxPerDoc`
 * capped at 100 that is up to 100 document reads on every single save, and
 * at `maxPerDoc: 0` (unbounded) the scan has no ceiling at all. Never
 * reintroduce that pattern here — this function sits on the hot path
 * (`createVersion` calls it to compute the next version number on every
 * `saveDraft`/`publish`/`unpublish`).
 *
 * @typeParam DataModel - The Convex data model.
 * @typeParam TCollectionSlug - The collection this version belongs to.
 * @param props - `{ ctx, collection, documentId }`.
 * @returns The highest-`version` row, or `null` if the document has no
 *   version history yet.
 */
export async function getLatestVersion<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(props: VersionQueryProps<DataModel, TCollectionSlug>): Promise<VersionRow | null> {
  // TODO: implement
  // 1. `ctx.db.query("vex_versions")`
  // 2.   `.withIndex("by_document_version", (q) => q.eq("collection", props.collection).eq("documentId", props.documentId))`
  // 3.   `.order("desc")`
  // 4.   `.first()` → the single highest-version row, or `null`.
  //    → NEVER `.collect()` here — see the @remarks above.
  // 5. Return the row cast to `VersionRow` (or `null`).
  // Edge cases:
  // - Document has no versions yet (first-ever save) → return `null`; callers
  //   treat that as "next version is 1".
  throw new Error("Not implemented");
}

/**
 * Reads one specific `vex_versions` row by its version number. Used by the
 * version history dropdown (Step 13) for restore preview. Not used by
 * `publish`'s supersede path — that reads the live draft/published rows
 * directly, never a history snapshot.
 *
 * @typeParam DataModel - The Convex data model.
 * @typeParam TCollectionSlug - The collection this version belongs to.
 * @param props - `{ ctx, collection, documentId, version }`.
 * @returns The matching row, or `null` if that version number doesn't exist
 *   for this document (e.g. pruned by {@link pruneVersions}).
 */
export async function getVersion<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(
  props: VersionQueryProps<DataModel, TCollectionSlug> & { version: number },
): Promise<VersionRow | null> {
  // TODO: implement
  // 1. `ctx.db.query("vex_versions")`
  // 2.   `.withIndex("by_document_version", (q) => q.eq("collection", props.collection).eq("documentId", props.documentId).eq("version", props.version))`
  //    → all three index fields are pinned, so at most one row can match.
  // 3.   `.first()` → the row, or `null`.
  // 4. Return the row cast to `VersionRow` (or `null`).
  // Edge cases:
  // - `version` was pruned by `pruneVersions` → `null`; the caller (restore
  //   UI) must handle a missing snapshot gracefully, not throw.
  throw new Error("Not implemented");
}

/**
 * Lists version history for a document, newest first, for the version
 * history dropdown (Step 13).
 *
 * @typeParam DataModel - The Convex data model.
 * @typeParam TCollectionSlug - The collection this version belongs to.
 * @param props - `{ ctx, collection, documentId, limit? }`. `limit` defaults
 *   to `DEFAULT_MAX_VERSIONS_PER_DOC` — a page size, independent of whatever
 *   `maxPerDoc` retention the collection is actually configured with.
 * @returns Rows ordered newest → oldest.
 */
export async function listVersions<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(
  props: VersionQueryProps<DataModel, TCollectionSlug> & { limit?: number },
): Promise<VersionRow[]> {
  // TODO: implement
  // 1. `ctx.db.query("vex_versions")`
  // 2.   `.withIndex("by_document_version", (q) => q.eq("collection", props.collection).eq("documentId", props.documentId))`
  // 3.   `.order("desc")`
  // 4.   `.take(props.limit ?? DEFAULT_MAX_VERSIONS_PER_DOC)`
  // 5. Return the rows cast to `VersionRow[]`, newest first.
  // Edge cases:
  // - No history yet → `[]`, not an error.
  throw new Error("Not implemented");
}

/**
 * Args for {@link createVersion}. Extends {@link VersionQueryProps} with a
 * mutation ctx and the fields that make up a new history row.
 *
 * @typeParam DataModel - The Convex data model.
 * @typeParam TCollectionSlug - The collection this version belongs to.
 */
export interface CreateVersionProps<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> {
  ctx: GenericMutationCtx<DataModel>;
  collection: TCollectionSlug;
  /** The PUBLISHED row's id — see {@link VersionRow.documentId}. */
  documentId: GenericId<TCollectionSlug>;
  /**
   * User fields only. Callers MUST already have run this through
   * {@link extractUserFields} — `createVersion` does not strip anything.
   */
  snapshot: Record<string, unknown>;
  status: VersionStatus;
  createdBy?: string;
  /**
   * The version this one was derived from. Defaults to the document's
   * current latest version number when omitted (linear chain, §4).
   */
  parentVersion?: number;
  /** Set only when this row was produced by a restore operation. */
  restoredFrom?: number;
  /** Set only when this row records a state that went (or is going) live. */
  publishedAt?: number;
}

/**
 * Inserts a new immutable `vex_versions` row for a document, auto-assigning
 * the next `version` number.
 *
 * @typeParam DataModel - The Convex data model.
 * @typeParam TCollectionSlug - The collection this version belongs to.
 * @param props - See {@link CreateVersionProps}.
 * @returns The new row's id and assigned version number.
 */
export async function createVersion<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(
  props: CreateVersionProps<DataModel, TCollectionSlug>,
): Promise<{ id: string; version: number }> {
  // TODO: implement
  // 1. `latest = await getLatestVersion({ ctx: props.ctx, collection: props.collection, documentId: props.documentId })`
  //    → reuses the indexed O(1) read; never re-implement the scan inline.
  // 2. `nextVersion = (latest?.version ?? 0) + 1`
  // 3. `parentVersion = props.parentVersion ?? latest?.version` (undefined for
  //    the very first version of a document).
  // 4. `id = await ctx.db.insert("vex_versions", { collection: props.collection, documentId: props.documentId, version: nextVersion, status: props.status, snapshot: props.snapshot, createdBy: props.createdBy, parentVersion, restoredFrom: props.restoredFrom, publishedAt: props.publishedAt })`
  // 5. Return `{ id, version: nextVersion }`.
  // Edge cases:
  // - First version ever for a document → `nextVersion` is 1, `parentVersion`
  //   is `undefined` (root of the lineage tree).
  // - Convex serializes a mutation's reads against its writes on the same
  //   index range, so two `createVersion` calls for the same document within
  //   one mutation invocation cannot race to the same `version` number —
  //   no additional locking needed here.
  throw new Error("Not implemented");
}

/**
 * Deletes `vex_versions` rows older than the newest `maxPerDoc`, never
 * touching a row whose `publishedAt` is set (§6.3 — a state that was ever
 * live is retained for audit regardless of age).
 *
 * @typeParam DataModel - The Convex data model.
 * @typeParam TCollectionSlug - The collection this version belongs to.
 * @param props - `{ ctx, collection, documentId, maxPerDoc }`. `maxPerDoc: 0`
 *   means unbounded retention — this function is a no-op.
 * @returns The number of rows actually deleted (may be fewer than
 *   `rows.length - maxPerDoc` when published rows are being skipped).
 */
export async function pruneVersions<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(
  props: VersionQueryProps<DataModel, TCollectionSlug> & { maxPerDoc: number },
): Promise<{ deletedCount: number }> {
  // TODO: implement
  // 1. If `props.maxPerDoc === 0` → return `{ deletedCount: 0 }` immediately
  //    (0 = unbounded, matches `DEFAULT_MAX_VERSIONS_PER_DOC`'s semantics
  //    from Step 1).
  // 2. Read the FULL history for this one document via `by_document_version`,
  //    `.order("desc")`, `.collect()`. This is the one place a `.collect()`
  //    is fine — it is bounded to a single document's own rows, not a
  //    cross-document scan like `master`'s `getLatestVersion` was.
  // 3. If `rows.length <= props.maxPerDoc` → return `{ deletedCount: 0 }`.
  // 4. `candidates = rows.slice(props.maxPerDoc)` (everything older than the
  //    newest `maxPerDoc`).
  // 5. For each candidate:
  //    a. If `candidate.publishedAt !== undefined` → skip, never delete.
  //    b. Else `await ctx.db.delete(candidate._id)`, increment a counter.
  // 6. Return `{ deletedCount: <counter> }`.
  // Edge cases:
  // - Every candidate has `publishedAt` set → `deletedCount` is 0 even though
  //   `rows.length > maxPerDoc`; retained history can legitimately exceed
  //   `maxPerDoc` when it's dominated by states that went live. This is
  //   intentional, not a bug — do not force-delete published rows to satisfy
  //   the cap.
  throw new Error("Not implemented");
}

/**
 * Finds the draft row (if any) pointing at a published row, via the MAIN
 * collection table's `by_published` index — NOT `vex_versions`. Per the
 * two-row model (§1), at most one row can have `vex_publishedId` equal to a
 * given published row's id at any time.
 *
 * @typeParam DataModel - The Convex data model.
 * @typeParam TCollectionSlug - The collection to search.
 * @param props - `{ ctx, collection, publishedId }` — `publishedId` MUST be
 *   a published row's `_id`; passing a draft row's id returns whatever (if
 *   anything) points at that id, which is never meaningful.
 * @returns The draft row, or `null` if the published document has no
 *   outstanding draft.
 */
export async function findDraftRow<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(props: {
  ctx: GenericQueryCtx<DataModel>;
  collection: TCollectionSlug;
  publishedId: GenericId<TCollectionSlug>;
}): Promise<DocumentByName<DataModel, TableNamesInDataModel<DataModel>> | null> {
  // TODO: implement
  // 1. `ctx.db.query(props.collection as TableNamesInDataModel<DataModel>)`
  //    → queries the MAIN collection table (e.g. "posts"), not "vex_versions".
  // 2.   `.withIndex("by_published", (q) => q.eq("vex_publishedId", props.publishedId))`
  // 3.   `.first()` → the draft row pointing at `publishedId`, or `null`.
  // 4. Return the row as-is.
  // Edge cases:
  // - `publishedId` belongs to a never-edited document → `null` is the
  //   normal, common case, not an error.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/versioning/model.test.ts`

```ts
import { convexTest } from "convex-test";
import type { GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/convex/_generated/api";
import schema, { type FixtureDM } from "./test/convex/schema";
import {
  createVersion,
  findDraftRow,
  getLatestVersion,
  getVersion,
  listVersions,
  pruneVersions,
} from "./model";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

/** Inserts a bare published `posts` row and returns its id. */
async function insertPublished(
  ctx: GenericMutationCtx<FixtureDM>,
  fields: { title: string; slug: string },
) {
  return ctx.db.insert("posts", {
    ...fields,
    vex_status: "published",
    vex_publishedAt: Date.now(),
    vex_publishedId: undefined,
  });
}

describe("createVersion / getLatestVersion / getVersion", () => {
  test("first version for a document is version 1 with no parentVersion", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      return createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "Hello", slug: "hello" },
        status: "published",
      });
    });

    expect(result.version).toBe(1);
  });

  test("createVersion auto-increments and getLatestVersion returns the newest row", async () => {
    const t = convexTest(schema, modules);
    const { latest, v1, v2 } = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      const v1 = await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "Hello", slug: "hello" },
        status: "published",
      });
      const v2 = await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "Hello v2", slug: "hello" },
        status: "draft",
      });
      const latest = await getLatestVersion({ ctx, collection: "posts", documentId: postId });
      return { latest, v1, v2 };
    });

    expect(v1.version).toBe(1);
    expect(v2.version).toBe(2);
    expect(latest?.version).toBe(2);
    expect(latest?.snapshot).toEqual({ title: "Hello v2", slug: "hello" });
    expect(latest?.parentVersion).toBe(1);
  });

  test("getLatestVersion returns null for a document with no version history", async () => {
    const t = convexTest(schema, modules);
    const latest = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Untouched", slug: "untouched" });
      return getLatestVersion({ ctx, collection: "posts", documentId: postId });
    });

    expect(latest).toBeNull();
  });

  test("getVersion returns the exact version requested, not the latest", async () => {
    const t = convexTest(schema, modules);
    const version1 = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "v1" },
        status: "published",
      });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "v2" },
        status: "draft",
      });
      return getVersion({ ctx, collection: "posts", documentId: postId, version: 1 });
    });

    expect(version1?.version).toBe(1);
    expect(version1?.snapshot).toEqual({ title: "v1" });
  });

  test("getVersion returns null for a version number that was never created", async () => {
    const t = convexTest(schema, modules);
    const missing = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      return getVersion({ ctx, collection: "posts", documentId: postId, version: 5 });
    });

    expect(missing).toBeNull();
  });

  test("version history is scoped per document — a second document starts at version 1", async () => {
    const t = convexTest(schema, modules);
    const { latestA, latestB } = await t.run(async (ctx) => {
      const postA = await insertPublished(ctx, { title: "A", slug: "a" });
      const postB = await insertPublished(ctx, { title: "B", slug: "b" });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postA,
        snapshot: { title: "A" },
        status: "published",
      });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postA,
        snapshot: { title: "A v2" },
        status: "draft",
      });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postB,
        snapshot: { title: "B" },
        status: "published",
      });
      return {
        latestA: await getLatestVersion({ ctx, collection: "posts", documentId: postA }),
        latestB: await getLatestVersion({ ctx, collection: "posts", documentId: postB }),
      };
    });

    expect(latestA?.version).toBe(2);
    expect(latestB?.version).toBe(1);
  });
});

describe("listVersions", () => {
  test("returns rows newest first", async () => {
    const t = convexTest(schema, modules);
    const rows = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "v1" },
        status: "published",
      });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "v2" },
        status: "draft",
      });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "v3" },
        status: "draft",
      });
      return listVersions({ ctx, collection: "posts", documentId: postId });
    });

    expect(rows.map((r) => r.version)).toEqual([3, 2, 1]);
  });

  test("respects an explicit limit", async () => {
    const t = convexTest(schema, modules);
    const rows = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      for (let i = 0; i < 3; i++) {
        await createVersion({
          ctx,
          collection: "posts",
          documentId: postId,
          snapshot: { title: `v${i}` },
          status: "draft",
        });
      }
      return listVersions({ ctx, collection: "posts", documentId: postId, limit: 2 });
    });

    expect(rows).toHaveLength(2);
  });

  test("returns an empty array for a document with no history", async () => {
    const t = convexTest(schema, modules);
    const rows = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      return listVersions({ ctx, collection: "posts", documentId: postId });
    });

    expect(rows).toEqual([]);
  });
});

describe("pruneVersions", () => {
  test("keeps only the newest maxPerDoc rows", async () => {
    const t = convexTest(schema, modules);
    const { deleted, remaining } = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      for (let i = 0; i < 5; i++) {
        await createVersion({
          ctx,
          collection: "posts",
          documentId: postId,
          snapshot: { title: `v${i}` },
          status: "draft",
        });
      }
      const deleted = await pruneVersions({
        ctx,
        collection: "posts",
        documentId: postId,
        maxPerDoc: 3,
      });
      const remaining = await listVersions({ ctx, collection: "posts", documentId: postId });
      return { deleted, remaining };
    });

    expect(deleted.deletedCount).toBe(2);
    expect(remaining.map((r) => r.version)).toEqual([5, 4, 3]);
  });

  test("never deletes a row with publishedAt set, even past maxPerDoc", async () => {
    const t = convexTest(schema, modules);
    const { deleted, remaining } = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      // v1: published, has publishedAt — must survive.
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "v1" },
        status: "published",
        publishedAt: Date.now(),
      });
      for (let i = 2; i <= 4; i++) {
        await createVersion({
          ctx,
          collection: "posts",
          documentId: postId,
          snapshot: { title: `v${i}` },
          status: "draft",
        });
      }
      const deleted = await pruneVersions({
        ctx,
        collection: "posts",
        documentId: postId,
        maxPerDoc: 2,
      });
      const remaining = await listVersions({ ctx, collection: "posts", documentId: postId });
      return { deleted, remaining };
    });

    // Only v2 was eligible (older than the newest 2, no publishedAt) — v1 is
    // protected despite being outside the newest-2 window.
    expect(deleted.deletedCount).toBe(1);
    expect(remaining.map((r) => r.version).sort()).toEqual([1, 3, 4]);
  });

  test("maxPerDoc: 0 is a no-op regardless of history size", async () => {
    const t = convexTest(schema, modules);
    const { deleted, remaining } = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      for (let i = 0; i < 4; i++) {
        await createVersion({
          ctx,
          collection: "posts",
          documentId: postId,
          snapshot: { title: `v${i}` },
          status: "draft",
        });
      }
      const deleted = await pruneVersions({
        ctx,
        collection: "posts",
        documentId: postId,
        maxPerDoc: 0,
      });
      const remaining = await listVersions({ ctx, collection: "posts", documentId: postId });
      return { deleted, remaining };
    });

    expect(deleted.deletedCount).toBe(0);
    expect(remaining).toHaveLength(4);
  });

  test("is a no-op when history is already within the cap", async () => {
    const t = convexTest(schema, modules);
    const deleted = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      await createVersion({
        ctx,
        collection: "posts",
        documentId: postId,
        snapshot: { title: "v1" },
        status: "published",
      });
      return pruneVersions({ ctx, collection: "posts", documentId: postId, maxPerDoc: 10 });
    });

    expect(deleted.deletedCount).toBe(0);
  });
});

describe("findDraftRow", () => {
  test("returns null when the published document has no draft", async () => {
    const t = convexTest(schema, modules);
    const draft = await t.run(async (ctx) => {
      const postId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      return findDraftRow({ ctx, collection: "posts", publishedId: postId });
    });

    expect(draft).toBeNull();
  });

  test("finds the draft row whose vex_publishedId points at the published row", async () => {
    const t = convexTest(schema, modules);
    const { draft, draftId } = await t.run(async (ctx) => {
      const publishedId = await insertPublished(ctx, { title: "Hello", slug: "hello" });
      const draftId = await ctx.db.insert("posts", {
        title: "Hello (editing)",
        slug: "hello",
        vex_status: "draft",
        vex_publishedAt: undefined,
        vex_publishedId: publishedId,
      });
      const draft = await findDraftRow({ ctx, collection: "posts", publishedId });
      return { draft, draftId };
    });

    expect(draft?._id).toBe(draftId);
  });

  test("does not confuse an unrelated document's draft for this one's", async () => {
    const t = convexTest(schema, modules);
    const draft = await t.run(async (ctx) => {
      const publishedA = await insertPublished(ctx, { title: "A", slug: "a" });
      const publishedB = await insertPublished(ctx, { title: "B", slug: "b" });
      await ctx.db.insert("posts", {
        title: "B (editing)",
        slug: "b",
        vex_status: "draft",
        vex_publishedAt: undefined,
        vex_publishedId: publishedB,
      });
      return findDraftRow({ ctx, collection: "posts", publishedId: publishedA });
    });

    expect(draft).toBeNull();
  });
});
```

Verify: `pnpm --filter @vexcms/core test`
### Step 5 — `saveDraft` `[dev]`

- [ ] `packages/core/src/api/versions/types.ts`
- [ ] `packages/core/src/api/versions/saveDraft.server.ts`
- [ ] `packages/core/src/api/versions/saveDraft.client.ts`
- [ ] `packages/core/src/api/versions/saveDraft.server.test.ts`
- [ ] `packages/core/src/api/test/convex/schema.ts` — extend the shared API-test
      fixture: `vex_status` / `vex_publishedAt` / `vex_publishedId` +
      `by_status` / `by_published` on `posts`, and a new `vex_versions` table.
      Required by every `api/versions/**` test in Steps 5–8 (not just this
      one) — added once, here, since this is the first step that needs it.
- [ ] `packages/core/src/api/convex.ts` — add a `versions: { saveDraft }`
      block to the `vexConvexApi` registry + `VexVersionsSaveDraftArgs`, so
      `saveDraft.client.ts` type-checks. The `versionsApi` **server** factory
      itself is Step 9's job — this is only the client-facing `anyApi`
      reference, mirroring the existing `globals: { upsert }` block.

#### `packages/core/src/api/test/convex/schema.ts`

(extend `posts`, add `vex_versions`; `authors`/`organizations`/`vex_globals` and the type augmentation block below are unchanged):

```ts
const schema = defineSchema({
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    deleted: v.optional(v.boolean()), // For soft delete tests
    author: v.optional(v.array(v.id("authors"))),
    parent: v.optional(v.array(v.id("posts"))), // self-ref for depth tests
    // Versioning fields — optional here (unlike a real generated schema for a
    // versioned collection) because this fixture is shared with non-drafty
    // tests (create/update/find/...) that never set them.
    vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    vex_publishedAt: v.optional(v.number()),
    vex_publishedId: v.optional(v.id("posts")),
  })
    .searchIndex("search_title", { searchField: "title" })
    .index("by_featured", ["featured"])
    .index("by_status", ["vex_status"])
    .index("by_published", ["vex_publishedId"]),

  authors: defineTable({
    name: v.string(),
    organization: v.optional(v.array(v.id("organizations"))),
  }).searchIndex("search_name", { searchField: "name" }),

  organizations: defineTable({
    name: v.string(),
  }),

  vex_globals: defineTable({
    slug: v.string(),
    data: v.any(),
  }).index("by_slug", ["slug"]),

  // Single shared history table for every versioned collection AND global
  // (`collection: "vex_globals"` for the latter — design §9). Matches
  // `versioning/model.ts`'s `VersionRow` shape exactly.
  vex_versions: defineTable({
    collection: v.string(),
    documentId: v.string(),
    version: v.number(),
    status: v.union(v.literal("draft"), v.literal("published")),
    snapshot: v.any(),
    createdBy: v.optional(v.string()),
    parentVersion: v.optional(v.number()),
    restoredFrom: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  }).index("by_document_version", ["collection", "documentId", "version"]),
});
```

#### `packages/core/src/api/convex.ts`

(new block, placed after the existing `globals: { … }` block; also add the arg interface near `VexGlobalsUpdateArgs`):

```ts
/** Args for `api.vex.versions.saveDraft`. */
export interface VexVersionsSaveDraftArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  data: Record<string, unknown>;
  restoredFrom?: number;
  environmentId?: string;
}
```

```ts
export const vexConvexApi = {
  // … existing find/get/search/create/update/remove/media/globals blocks …

  versions: {
    /**
     * Creates or updates the caller's draft row and records history.
     * Called by the admin edit-view toolbar and `useAutosave` in `@vexcms/react`.
     */
    saveDraft: anyApi.vex.versions.saveDraft as FunctionReference<
      "mutation",
      "public",
      VexVersionsSaveDraftArgs,
      string
    >,
  },
} as const;
```

#### `packages/core/src/api/versions/types.ts`

```ts
import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { VexApiAuth } from "../types";
import type { VexConfig } from "../../config";

/**
 * Base server-side args shared by every versions mutation (`saveDraft`,
 * `publish`, `unpublish`). Each concrete function extends this with its own
 * inputs (`data`, `restoredFrom`).
 *
 * The RBAC seam rides on `auth` + `config`, mirroring
 * `GenericGlobalsMutationServerArgs`: when `config.access` is set, the
 * function runs `hasPermission` for one of `DRAFT_ACTIONS` against the
 * STORED document, never the caller-supplied `data`.
 *
 * @typeParam TDataModel - The project's generated Convex data model.
 */
export interface GenericVersionsMutationServerArgs<TDataModel extends GenericDataModel> {
  /**
   * Resolved caller identity for permission checks — `{ user, organization? }`,
   * or omitted when access control is off. Never a client argument; the
   * `versionsApi` factory resolves it from `ctx.auth` per request.
   */
  auth?: VexApiAuth;
  /** Convex mutation context (read + write DB access). */
  ctx: GenericMutationCtx<TDataModel>;
  /**
   * The resolved `VexConfig`. Required — supplies `config.access` (the
   * permission matrix the guard enforces).
   */
  config: VexConfig;
}

/**
 * Base client-side args shared by every versions mutation. Mirrors
 * {@link GenericVersionsMutationServerArgs} minus the server-only fields.
 */
export interface GenericVersionsMutationClientArgs {
  /** Discriminator: client args MUST NOT supply `auth`. */
  auth?: never;
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
}

/**
 * Shared server-side identity args for a versions mutation that targets one
 * document: the `collection` it belongs to, and the `id` of the row
 * currently open in the edit view — an existing draft row, or (on first
 * edit of a published document, `saveDraft` only) the published row itself;
 * the server resolves the draft internally.
 *
 * @typeParam TDataModel - The project's generated Convex data model.
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 */
export interface VersionsDocumentServerArgs<
  TDataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericVersionsMutationServerArgs<TDataModel> {
  /** The collection slug the document belongs to. */
  collection: TCollectionSlug;
  /** The row currently open in the edit view — draft or published. */
  id: GenericId<TCollectionSlug>;
  /**
   * Accepted and ignored — reserved for future multi-environment support
   * (design §9).
   */
  environmentId?: string;
}

/** Client-side counterpart to {@link VersionsDocumentServerArgs}. */
export interface VersionsDocumentClientArgs<TCollectionSlug extends CollectionSlug>
  extends GenericVersionsMutationClientArgs {
  /** The collection slug the document belongs to. */
  collection: TCollectionSlug;
  /** The row currently open in the edit view — draft or published. */
  id: GenericId<TCollectionSlug>;
  /** Accepted and ignored — reserved for future multi-environment support. */
  environmentId?: string;
}

/**
 * Shared server-side args for a versions mutation that also writes field
 * data (`saveDraft`, `publish`). `data` is a **partial** merge — only the
 * keys present are written, mirroring `UpdateServerArgs.data` — and is
 * authoritative: neither `saveDraft` nor `publish` re-derives content by
 * re-reading a stored row and diffing it (no `JSON.stringify` comparison
 * anywhere in this model).
 *
 * @typeParam TDataModel - The project's generated Convex data model.
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 */
export interface VersionsDraftPayloadServerArgs<
  TDataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends VersionsDocumentServerArgs<TDataModel, TCollectionSlug> {
  /**
   * Partial field values to merge into the target row. `_id`,
   * `_creationTime`, and the `vex_*` system fields are excluded — the
   * framework manages them.
   */
  data: Partial<
    Expand<
      BetterOmit<
        DocumentByName<TDataModel, TableNamesInDataModel<TDataModel>>,
        "_creationTime" | "_id"
      >
    >
  >;
}

/** Client-side counterpart to {@link VersionsDraftPayloadServerArgs}. */
export interface VersionsDraftPayloadClientArgs<TCollectionSlug extends CollectionSlug>
  extends VersionsDocumentClientArgs<TCollectionSlug> {
  /** Partial field values to merge into the target row. */
  data: Record<string, unknown>;
}
```

#### `packages/core/src/api/versions/saveDraft.server.ts`

```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { createVersion, findDraftRow, getLatestVersion } from "../../versioning/model";
import { extractUserFields } from "../../versioning/extractUserFields";
import type { VersionsDraftPayloadServerArgs } from "./types";

/**
 * Server-side args for `saveDraft`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface SaveDraftServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends VersionsDraftPayloadServerArgs<DataModel, TCollectionSlug> {
  /**
   * Version number this save restores from, set by the version-history
   * "Restore" action (`VersionHistoryDropdown`, Step 13). Forwarded to
   * `createVersion`'s `restoredFrom` so the resulting row records the branch
   * point (design §4/§10) — omit for a normal edit or autosave.
   */
  restoredFrom?: number;
}

/**
 * Creates or updates the single draft row for a document, and records the
 * resulting state as a new, immutable `vex_versions` row. The only mutation
 * that creates a draft row — `publish`, `unpublish`, and the history reads
 * all assume `saveDraft` already established the invariant "at most one
 * draft row per document" (design §1, §2.3).
 *
 * `args.id` is whichever row is currently open in the edit view: an existing
 * draft row (patched directly), or — on first edit of a published
 * document — the published row itself (resolved to its draft, or lack of
 * one, via `findDraftRow`). On first edit of an already-published document
 * with no prior draft history, the published row's current content is
 * snapshotted to `vex_versions` as `v1 published` before the draft is
 * written (design §10 first-edit bootstrap).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - The mutation args; see {@link SaveDraftServerArgs}.
 * @returns The `_id` of the draft row — existing (patched), or newly inserted.
 * @throws {ConvexError} When no document exists at `args.id`.
 *
 * @example
 * ```ts
 * import { saveDraft } from "@vexcms/core/server";
 *
 * const draftId = await saveDraft({
 *   ctx, config, collection: "posts", id: publishedPostId,
 *   data: { title: "Updated title" },
 * });
 * ```
 */
export async function saveDraft<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: SaveDraftServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  // TODO: implement
  // 1. `doc = await args.ctx.db.get(args.id)`; throw
  //    `ConvexError(`No document found for id "${args.id}" in collection "${args.collection}"`)`
  //    when missing.
  // 2. If `args.config.access !== undefined`, gate via
  //    `hasPermission({ throwOnDenied: true, access: args.config.access,
  //    user: args.auth?.user ?? {}, organization: args.auth?.organization,
  //    resource: args.collection, action: DRAFT_ACTIONS.saveDraft, data: doc ?? undefined })`
  //    — authorize against the STORED row, never `args.data`
  //    (matches `update/server.ts:70-87`).
  // 3. Branch on `doc.vex_status`:
  //    a. `"draft"` → this row already IS the draft (never-published, or
  //       already has a `vex_publishedId` parent). `draftRow = doc`; go to 4.
  //    b. `"published"` → `existingDraft = await findDraftRow({ ctx: args.ctx,
  //       collection: args.collection, publishedId: doc._id })`.
  //       - hit → `draftRow = existingDraft`; go to 4.
  //       - miss →
  //         i.  bootstrap: if `(await getLatestVersion({ ctx: args.ctx,
  //             collection: args.collection, documentId: doc._id })) === null`
  //             (no version rows exist yet for this document), call
  //             `createVersion({ ctx: args.ctx, collection: args.collection,
  //             documentId: doc._id, snapshot: extractUserFields({ doc }),
  //             status: "published", publishedAt: doc.vex_publishedAt })`
  //             → records "v1 published".
  //         ii. `draftRow = await args.ctx.db.insert(args.collection, {
  //             ...extractUserFields({ doc }), ...args.data, vex_status: "draft",
  //             vex_publishedId: doc._id })` (insert returns the new id; treat
  //             `draftRow` as `{ _id: <new id> }` for step 4/6). Skip step 5 —
  //             the insert already wrote the merged fields.
  // 4. If step 3 resolved an EXISTING row (3a, or 3b-hit):
  //    `await args.ctx.db.patch(draftRow._id, args.data)`.
  // 5. Canonical history key: `documentId = doc.vex_status === "published"
  //    ? doc._id : (doc.vex_publishedId ?? doc._id)`.
  // 6. Full snapshot for history: `snapshot = { ...extractUserFields({ doc: draftRow }),
  //    ...args.data }` (for the freshly-inserted case this equals the row's
  //    own fields already).
  // 7. `await createVersion({ ctx: args.ctx, collection: args.collection,
  //    documentId, snapshot, status: "draft",
  //    createdBy: <string _id from args.auth?.user, if present>,
  //    restoredFrom: args.restoredFrom })` — `createVersion` defaults
  //    `parentVersion` to the prior latest version.
  // 8. Return `draftRow._id` as a string.
  //
  // Edge cases:
  // - Repeated `saveDraft` calls on the same document must always resolve to
  //   the SAME draft row (invariant: at most one draft row per document) —
  //   guaranteed by routing every lookup through `doc.vex_status` /
  //   `findDraftRow`, never inserting a second draft row once one is found.
  // - A `getLatestVersion` hit at step 3b-ii means the document already has
  //   history (e.g. a prior draft was published, and this is a new edit) —
  //   the bootstrap snapshot must NOT fire a second time.
  // - `args.data` is a PARTIAL patch (mirrors `update`'s `data: Partial<...>`)
  //   — unspecified fields on an existing draft row are left as-is.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/versions/saveDraft.client.ts`

```ts
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "../convex";

/**
 * Returns a `useConvexMutation`-compatible mutation function bound to the
 * `versions.saveDraft` Convex mutation. Call at the top level of a React
 * component (obeys the Rules of Hooks) and pass the return value as
 * `mutationFn` to `useMutation`.
 *
 * The mutation accepts `{ collection, id, data, restoredFrom? }` — `id` is
 * whichever row is currently open in the edit view; the server resolves the
 * correct draft row. Import from `@vexcms/core/client`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @example
 * ```tsx
 * import { saveDraft } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: saveDraft() });
 * await mutateAsync({ collection: "posts", id: postId, data: { title: "Draft title" } });
 * ```
 */
export function saveDraft() {
  // TODO: implement
  // 1. Return `useConvexMutation(vexConvexApi.versions.saveDraft)` — a direct
  //    pass-through, mirroring `update()` in `update/client.ts`.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/versions/saveDraft.server.test.ts`

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";

// RBAC off (`config.access` undefined) — these tests exercise the two-row
// model, not permission gating.
const fixtureConfig = { collections: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("saveDraft (server)", () => {
  test("creates a draft row on first edit of a published document, bootstrapping v1 published", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
        vex_publishedAt: 1_000,
      } as never);

      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      expect(typeof draftId).toBe("string");
      expect(draftId).not.toBe(publishedId as unknown as string);

      const draft = await ctx.db.get(draftId as never);
      expect(draft).toMatchObject({
        title: "Edited",
        slug: "original",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });

      const versions = await ctx.db.query("vex_versions").collect();
      expect(versions).toHaveLength(2);

      const published = versions.find((v) => v.status === "published");
      expect(published).toMatchObject({
        version: 1,
        documentId: publishedId as unknown as string,
        snapshot: { title: "Original", slug: "original" },
      });

      const draftVersion = versions.find((v) => v.status === "draft");
      expect(draftVersion).toMatchObject({
        version: 2,
        documentId: publishedId as unknown as string,
        snapshot: { title: "Edited", slug: "original" },
      });
    });
  });

  test("repeated saves patch the same draft row — bootstrap fires once", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "V1",
        slug: "v1",
        vex_status: "published",
        vex_publishedAt: 1_000,
      } as never);

      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "V2" },
      });
      // Second call passes the PUBLISHED id again — must find and patch the
      // draft created above, not insert a second one.
      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "V3" },
      });

      const draftRows = await ctx.db
        .query("posts")
        .withIndex("by_published", (q) => q.eq("vex_publishedId", publishedId))
        .collect();
      expect(draftRows).toHaveLength(1);
      expect(draftRows[0]).toMatchObject({ title: "V3" });

      const versions = await ctx.db.query("vex_versions").collect();
      expect(versions).toHaveLength(3); // 1 bootstrap + 2 saves
      expect(versions.filter((v) => v.status === "published")).toHaveLength(1);
      expect(versions.filter((v) => v.status === "draft")).toHaveLength(2);
      expect(versions.map((v) => v.version).sort()).toEqual([1, 2, 3]);
    });
  });

  test("saving a never-published document patches it directly — no separate draft row, no bootstrap", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const docId = await ctx.db.insert("posts", {
        title: "Draft only",
        slug: "draft-only",
        vex_status: "draft",
      } as never);

      const resultId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: docId,
        data: { title: "Draft only v2" },
      });

      expect(resultId).toBe(docId as unknown as string);

      const rows = await ctx.db.query("posts").collect();
      expect(rows).toHaveLength(1); // no second row created
      expect(rows[0]).toMatchObject({ title: "Draft only v2", vex_status: "draft" });
      expect(rows[0].vex_publishedId).toBeUndefined();

      const versions = await ctx.db.query("vex_versions").collect();
      expect(versions).toHaveLength(1); // nothing was ever published — no bootstrap
      expect(versions[0]).toMatchObject({
        status: "draft",
        documentId: docId as unknown as string,
        version: 1,
      });
    });
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 6 — `publish` `[dev]`

- [ ] `packages/core/src/api/versions/publish.server.ts`
- [ ] `packages/core/src/api/versions/publish.client.ts`
- [ ] `packages/core/src/api/versions/publish.server.test.ts`
- [ ] `packages/core/src/api/convex.ts` — extend the `versions` block from
      Step 5 with `publish` + `VexVersionsPublishArgs`.

#### `packages/core/src/api/convex.ts`

(add alongside `VexVersionsSaveDraftArgs`, and add the property inside the existing `versions: { … }` block):

```ts
/** Args for `api.vex.versions.publish`. */
export interface VexVersionsPublishArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  data: Record<string, unknown>;
  environmentId?: string;
}
```

```ts
  versions: {
    saveDraft: anyApi.vex.versions.saveDraft as FunctionReference<
      "mutation",
      "public",
      VexVersionsSaveDraftArgs,
      string
    >,
    /**
     * Publishes a draft — promotes a never-published draft in place, or
     * copies a draft-with-parent's fields onto its published row and
     * deletes the draft. Called by the admin edit-view toolbar's Publish
     * button in `@vexcms/react`.
     */
    publish: anyApi.vex.versions.publish as FunctionReference<
      "mutation",
      "public",
      VexVersionsPublishArgs,
      string
    >,
  },
```

#### `packages/core/src/api/versions/publish.server.ts`

```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { createVersion } from "../../versioning/model";
import { extractUserFields } from "../../versioning/extractUserFields";
import type { VersionsDraftPayloadServerArgs } from "./types";

/**
 * Server-side args for `publish`. `args.id` is the DRAFT row's `_id` — the
 * row currently open in the edit view.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface PublishServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends VersionsDraftPayloadServerArgs<DataModel, TCollectionSlug> {}

/**
 * Publishes a draft, keeping the published document's `_id` stable across
 * every publish (design §2.1–§2.2) — the identity every `relationship`
 * field, permalink, and cached URL depends on. Convex assigns `_id` on
 * insert and cannot be chosen, so the only way to preserve it is to never
 * delete-and-recreate the published row.
 *
 * Two paths, both driven by `args.id` (the DRAFT row's `_id`):
 * - **Never-published draft** (`vex_publishedId === undefined`): patched IN
 *   PLACE to `vex_status: "published"`. It keeps its own `_id` — there is no
 *   prior published row to preserve.
 * - **Draft with a published parent**: the superseded published content is
 *   archived to `vex_versions` first (its original `publishedAt` preserved,
 *   never cleared), then the PARENT row is patched with `args.data` and the
 *   draft row is deleted. The parent's `_id` — never the draft's — survives.
 *
 * `args.data` is required and authoritative: it is written as the new
 * content (merged over the draft's own stored fields), never re-derived by
 * reading and diffing a stored row — no `JSON.stringify` snapshot comparison
 * anywhere in this model (design §8.1).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - The mutation args; see {@link PublishServerArgs}.
 * @returns The `_id` of the now-published row — the draft's own `_id` on the
 *   never-published path, or the published parent's `_id` on the other.
 * @throws {ConvexError} When no row exists at `args.id`, or (draft-with-parent
 *   path) when the draft's `vex_publishedId` points at a row that no longer
 *   exists.
 *
 * @example
 * ```ts
 * import { publish } from "@vexcms/core/server";
 *
 * const publishedId = await publish({
 *   ctx, config, collection: "posts", id: draftId,
 *   data: { title: "Final title" },
 * });
 * ```
 */
export async function publish<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: PublishServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  // TODO: implement
  // 1. `draftRow = await args.ctx.db.get(args.id)`; throw
  //    `ConvexError(`No document found for id "${args.id}" in collection "${args.collection}"`)`
  //    when missing.
  // 2. If `args.config.access !== undefined`, gate via
  //    `hasPermission({ throwOnDenied: true, access: args.config.access,
  //    user: args.auth?.user ?? {}, organization: args.auth?.organization,
  //    resource: args.collection, action: DRAFT_ACTIONS.publish, data: draftRow ?? undefined })`
  //    — authorize against the STORED draft, never `args.data`.
  // 3. Branch on `draftRow.vex_publishedId`:
  //    a. `undefined` → never-published draft:
  //       i.   `snapshot = { ...extractUserFields({ doc: draftRow }), ...args.data }`.
  //       ii.  `await args.ctx.db.patch(args.id, { ...args.data, vex_status: "published",
  //            vex_publishedAt: Date.now() })`.
  //       iii. `await createVersion({ ctx: args.ctx, collection: args.collection,
  //            documentId: args.id, snapshot, status: "published",
  //            publishedAt: Date.now(),
  //            createdBy: <string _id from args.auth?.user, if present> })`
  //            → records the newly-published state.
  //       iv.  return `args.id` as a string — the row's `_id` never changes.
  //    b. a published row's id → draft with a parent:
  //       i.   `published = await args.ctx.db.get(draftRow.vex_publishedId)`; throw
  //            `ConvexError(...)` if missing — a data-integrity failure (the
  //            draft's parent was deleted out from under it).
  //       ii.  `await createVersion({ ctx: args.ctx, collection: args.collection,
  //            documentId: published._id, snapshot: extractUserFields({ doc: published }),
  //            status: "published", publishedAt: published.vex_publishedAt })`
  //            → archives the SUPERSEDED state, preserving its original
  //            `publishedAt` (never reset to `now`, never cleared).
  //       iii. `finalFields = { ...extractUserFields({ doc: draftRow }), ...args.data }`.
  //       iv.  `await args.ctx.db.patch(published._id, { ...finalFields, vex_publishedAt: Date.now() })`
  //            → the published row keeps its `_id`; every relationship field
  //            pointing at it keeps resolving.
  //       v.   `await args.ctx.db.delete(args.id)` — remove the draft row.
  //       vi.  return `published._id` as a string.
  //
  // Edge cases:
  // - The published row's `_id` (path b) or the draft's own `_id` (path a) is
  //   NEVER destroyed and NEVER re-created — the one invariant this whole
  //   model rests on (design §2.2, §9).
  // - Never compare `args.data` against the stored row's fields to decide
  //   whether to write — always write, unconditionally.
  // - Step 3b-ii's history row is the ONLY new version row on that path: the
  //   content now going live already exists as a "draft"-status version row
  //   from the last `saveDraft` call (design §8.1 — publish performs no
  //   snapshot resolution of its own beyond archiving what it's replacing).
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/versions/publish.client.ts`

```ts
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "../convex";

/**
 * Returns a `useConvexMutation`-compatible mutation function bound to the
 * `versions.publish` Convex mutation. Call at the top level of a React
 * component (obeys the Rules of Hooks) and pass the return value as
 * `mutationFn` to `useMutation`.
 *
 * The mutation accepts `{ collection, id, data }` — `id` is the draft row
 * currently open in the edit view. Import from `@vexcms/core/client`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @example
 * ```tsx
 * import { publish } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: publish() });
 * await mutateAsync({ collection: "posts", id: draftId, data: { title: "Final title" } });
 * ```
 */
export function publish() {
  // TODO: implement
  // 1. Return `useConvexMutation(vexConvexApi.versions.publish)` — a direct
  //    pass-through, mirroring `saveDraft()` in `saveDraft.client.ts`.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/versions/publish.server.test.ts`

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { publish } from "./publish.server";

const fixtureConfig = { collections: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("publish (server)", () => {
  test("preserves the published row's _id across a full cycle, and an inbound relationship still resolves", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "A",
        slug: "a",
        vex_status: "published",
        vex_publishedAt: 1_000,
      } as never);
      // Inbound relationship: another published post links to it.
      const linkerId = await ctx.db.insert("posts", {
        title: "Linker",
        slug: "linker",
        vex_status: "published",
        vex_publishedAt: 1_000,
        parent: [publishedId],
      } as never);

      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "A v2" },
      });

      const resultId = await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as never,
        data: { title: "A v2" },
      });

      // The identity invariant: byte-identical `_id` before and after.
      expect(resultId).toBe(publishedId as unknown as string);

      const finalDoc = await ctx.db.get(publishedId);
      expect(finalDoc).toMatchObject({ title: "A v2", vex_status: "published" });

      const draftGone = await ctx.db.get(draftId as never);
      expect(draftGone).toBeNull();

      const linker = await ctx.db.get(linkerId);
      expect(linker?.parent).toEqual([publishedId]);
      const resolvedTarget = await ctx.db.get(linker!.parent![0]);
      expect(resolvedTarget).toMatchObject({ title: "A v2" });
    });
  });

  test("publishing a never-published draft promotes it in place, keeping its own _id", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", {
        title: "New",
        slug: "new",
        vex_status: "draft",
      } as never);

      const resultId = await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId,
        data: { title: "New Published" },
      });

      expect(resultId).toBe(draftId as unknown as string);

      const doc = await ctx.db.get(draftId);
      expect(doc).toMatchObject({ vex_status: "published", title: "New Published" });

      const versions = await ctx.db.query("vex_versions").collect();
      expect(versions).toHaveLength(1);
      expect(versions[0]).toMatchObject({
        status: "published",
        documentId: draftId as unknown as string,
      });
      expect(versions[0].publishedAt).toEqual(expect.any(Number));
    });
  });

  test("publishing a draft with a parent archives the superseded state and preserves its original publishedAt", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Old",
        slug: "old",
        vex_status: "published",
        vex_publishedAt: 5_000,
      } as never);

      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "New" },
      });

      await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as never,
        data: { title: "New" },
      });

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", publishedId as unknown as string),
        )
        .collect();

      const superseded = versions.find((v) => v.snapshot.title === "Old");
      expect(superseded).toBeDefined();
      expect(superseded!.status).toBe("published");
      expect(superseded!.publishedAt).toBe(5_000); // preserved, never cleared or reset to now
    });
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 7 — `unpublish` `[dev]`

- [ ] `packages/core/src/api/versions/unpublish.server.ts`
- [ ] `packages/core/src/api/versions/unpublish.client.ts`
- [ ] `packages/core/src/api/versions/unpublish.server.test.ts`
- [ ] `packages/core/src/api/convex.ts` — extend the `versions` block from
      Steps 5–6 with `unpublish` + `VexVersionsUnpublishArgs`.

#### `packages/core/src/api/convex.ts`

(add alongside `VexVersionsPublishArgs`, and add the property inside the existing `versions: { … }` block):

```ts
/** Args for `api.vex.versions.unpublish`. */
export interface VexVersionsUnpublishArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  environmentId?: string;
}
```

```ts
  versions: {
    saveDraft: anyApi.vex.versions.saveDraft as FunctionReference<
      "mutation",
      "public",
      VexVersionsSaveDraftArgs,
      string
    >,
    publish: anyApi.vex.versions.publish as FunctionReference<
      "mutation",
      "public",
      VexVersionsPublishArgs,
      string
    >,
    /**
     * Flips a published row back to a draft. Rejects while a draft row is
     * outstanding for the document. Called by the admin edit-view toolbar's
     * Unpublish button in `@vexcms/react`.
     */
    unpublish: anyApi.vex.versions.unpublish as FunctionReference<
      "mutation",
      "public",
      VexVersionsUnpublishArgs,
      void
    >,
  },
```

#### `packages/core/src/api/versions/unpublish.server.ts`

```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { createVersion, findDraftRow } from "../../versioning/model";
import { extractUserFields } from "../../versioning/extractUserFields";
import type { VersionsDocumentServerArgs } from "./types";

/**
 * Server-side args for `unpublish`. `args.id` is the published row's `_id`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface UnpublishServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends VersionsDocumentServerArgs<DataModel, TCollectionSlug> {}

/**
 * Flips a published row back to `vex_status: "draft"` and records the
 * transition as a new, immutable `vex_versions` row.
 *
 * Rejects while an active draft row exists for the document — the invariant
 * "at most one draft row per document, and it points at a published row or
 * nothing" (design §2.4, §6.1) can't hold if the published row it points at
 * stops being published. Discard or publish the draft first.
 *
 * Never rewrites an existing `vex_versions` row's `status` — `master` did
 * this on unpublish and destroyed the "was this state ever live" record
 * (design §4, §10). A fresh row is always appended instead.
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - The mutation args; see {@link UnpublishServerArgs}.
 * @returns Promise resolving to void.
 * @throws {ConvexError} When no row exists at `args.id`, or when a draft row
 *   is still outstanding for the document ("publish or discard the active
 *   draft first").
 *
 * @example
 * ```ts
 * import { unpublish } from "@vexcms/core/server";
 *
 * await unpublish({ ctx, config, collection: "posts", id: publishedId });
 * ```
 */
export async function unpublish<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: UnpublishServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  // TODO: implement
  // 1. `doc = await args.ctx.db.get(args.id)`; throw
  //    `ConvexError(`No document found for id "${args.id}" in collection "${args.collection}"`)`
  //    when missing.
  // 2. If `args.config.access !== undefined`, gate via
  //    `hasPermission({ throwOnDenied: true, access: args.config.access,
  //    user: args.auth?.user ?? {}, organization: args.auth?.organization,
  //    resource: args.collection, action: DRAFT_ACTIONS.unpublish, data: doc ?? undefined })`
  //    — authorize against the STORED row.
  // 3. `existingDraft = await findDraftRow({ ctx: args.ctx, collection: args.collection,
  //    publishedId: args.id })`.
  //    a. If found → throw `new ConvexError("publish or discard the active draft first")`.
  // 4. `await args.ctx.db.patch(args.id, { vex_status: "draft" })` — leave
  //    `vex_publishedAt` untouched (it records "last published at", not "is
  //    currently published"); `vex_publishedId` stays `undefined` (a
  //    published row never has one).
  // 5. `await createVersion({ ctx: args.ctx, collection: args.collection,
  //    documentId: args.id, snapshot: extractUserFields({ doc }), status: "draft",
  //    createdBy: <string _id from args.auth?.user, if present> })` — a NEW
  //    row; never patch an earlier "published" row's `status`.
  //
  // Edge cases:
  // - Step 3's rejection fires on PRESENCE of a draft row, not on whether its
  //   content differs from the published row.
  // - Never clear `vex_publishedAt` on the published-turned-draft row; it
  //   stays a historical fact ("was this ever live").
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/versions/unpublish.client.ts`

```ts
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "../convex";

/**
 * Returns a `useConvexMutation`-compatible mutation function bound to the
 * `versions.unpublish` Convex mutation. Call at the top level of a React
 * component (obeys the Rules of Hooks) and pass the return value as
 * `mutationFn` to `useMutation`.
 *
 * The mutation accepts `{ collection, id }` — `id` is the published row.
 * Rejects (throws) when an active draft row exists for the document. Import
 * from `@vexcms/core/client`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @example
 * ```tsx
 * import { unpublish } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: unpublish() });
 * await mutateAsync({ collection: "posts", id: publishedId });
 * ```
 */
export function unpublish() {
  // TODO: implement
  // 1. Return `useConvexMutation(vexConvexApi.versions.unpublish)` — a direct
  //    pass-through, mirroring `publish()` in `publish.client.ts`.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/versions/unpublish.server.test.ts`

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { unpublish } from "./unpublish.server";

const fixtureConfig = { collections: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("unpublish (server)", () => {
  test("rejects when a draft row exists for the document", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "A",
        slug: "a",
        vex_status: "published",
        vex_publishedAt: 1_000,
      } as never);

      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "A v2" },
      });

      await expect(
        unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId }),
      ).rejects.toThrow("publish or discard the active draft first");
    });
  });

  test("flips the published row to draft and appends a history row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "A",
        slug: "a",
        vex_status: "published",
        vex_publishedAt: 1_000,
      } as never);

      await unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId });

      const doc = await ctx.db.get(publishedId);
      expect(doc).toMatchObject({ vex_status: "draft", vex_publishedAt: 1_000 }); // not cleared

      const versions = await ctx.db.query("vex_versions").collect();
      expect(versions).toHaveLength(1);
      expect(versions[0]).toMatchObject({
        status: "draft",
        documentId: publishedId as unknown as string,
      });
    });
  });

  test("at most one draft row exists per document, unaffected by a rejected unpublish", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "A",
        slug: "a",
        vex_status: "published",
        vex_publishedAt: 1_000,
      } as never);

      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "A v2" },
      });

      await expect(
        unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId }),
      ).rejects.toThrow();

      const draftRows = await ctx.db
        .query("posts")
        .withIndex("by_published", (q) => q.eq("vex_publishedId", publishedId))
        .collect();
      expect(draftRows).toHaveLength(1); // unchanged by the rejected call
    });
  });
});
```

Verify: `pnpm --filter @vexcms/core test`
### Step 8 — History reads + `deleteVersion` `[dev]`

Why: Closes the three `master` endpoints (`getVersionSnapshot`, `listVersions`,
`deleteVersion`) that shipped with either zero authorization or an authorization check
on the wrong action. `getVersionSnapshot` and `listVersions` return draft content —
these must throw before a single `vex_versions` row is read for a caller lacking
`readDrafts`.

- [ ] `packages/core/src/api/convex.ts` — add the arg interfaces and `vexConvexApi.versions`
      entries for this step's three operations (`saveDraft`/`publish`/`unpublish`'s entries
      were added in Steps 5–7, one per introducing step, exactly like `globals`' surface
      in this file — so each `.client.ts` below never imports an entry a later step creates).

#### `packages/core/src/api/convex.ts`

(insert after `VexGlobalsUpdateArgs`, and inside the
`vexConvexApi` object after the `globals: { ... }` block):

```ts
/** Args for `api.vex.listVersions`. */
export interface VexVersionsListVersionsArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  documentId: string;
  limit?: number;
}

/** Args for `api.vex.getVersionSnapshot`. */
export interface VexVersionsGetVersionSnapshotArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  documentId: string;
  version: number;
}

/** Args for `api.vex.deleteVersion`. */
export interface VexVersionsDeleteVersionArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  documentId: string;
  version: number;
}
```

```ts
  versions: {
    // saveDraft / publish / unpublish entries already registered by Steps 5–7.

    listVersions: anyApi.vex.listVersions as FunctionReference<
      "query",
      "public",
      VexVersionsListVersionsArgs,
      VersionSummary[]
    >,

    getVersionSnapshot: anyApi.vex.getVersionSnapshot as FunctionReference<
      "query",
      "public",
      VexVersionsGetVersionSnapshotArgs,
      VersionSnapshotResult | null
    >,

    deleteVersion: anyApi.vex.deleteVersion as FunctionReference<
      "mutation",
      "public",
      VexVersionsDeleteVersionArgs,
      { deleted: number }
    >,
  },
```

> `VersionSummary` / `VersionSnapshotResult` are exported below from
> `listVersions.server.ts` / `getVersionSnapshot.server.ts` — import them into `convex.ts`
> alongside the other cross-file type imports at the top of the file.

- [ ] `packages/core/src/api/versions/listVersions.server.ts` — gate on `readDrafts`.

#### `packages/core/src/api/versions/listVersions.server.ts`

```ts
import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericVersionsQueryServerArgs } from "./types";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { listVersions as listVersionRows } from "../../versioning/model";

/**
 * Server-side args for `listVersions`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface ListVersionsServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericVersionsQueryServerArgs<DataModel> {
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /**
   * The published row's stable `_id`, as a string — the version-history key
   * (design-review.md §9: history is keyed to the published row's id so it
   * survives draft churn). For a never-published document this is the sole
   * draft row's own `_id`.
   */
  documentId: string;
  /** Maximum history rows to return, newest first. Defaults to 50. */
  limit?: number;
}

/** One history entry — summary only, never the full snapshot. */
export interface VersionSummary {
  version: number;
  status: "draft" | "published";
  createdBy: string | null;
  createdAt: number;
  restoredFrom: number | null;
  publishedAt: number | null;
}

/**
 * Lists version history for a document, newest first — summaries only. Use
 * {@link getVersionSnapshot} to fetch one version's full content.
 *
 * Gated on `readDrafts`: history can contain content a caller without that
 * action must never see, so this throws before `vex_versions` is queried
 * rather than filtering rows after the read — `master` shipped this endpoint
 * with zero authorization (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ ctx, config, auth, collection, documentId, limit? }`.
 * @returns Version summaries, newest first.
 * @throws {VexAccessError} When the caller's roles lack `readDrafts` on `collection`.
 * @throws {ConvexError} When no document exists at `documentId` in `collection`.
 */
export async function listVersions<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: ListVersionsServerArgs<DataModel, TCollectionSlug>): Promise<VersionSummary[]> {
  // TODO: implement
  // 1. Load the target document:
  //    `const doc = await props.ctx.db.get(props.documentId as GenericId<TCollectionSlug>)`.
  //    a. `doc` is `null` → `throw new ConvexError("Document not found")`.
  // 2. When `props.config.access` is set, gate BEFORE touching `vex_versions`:
  //    `hasPermission({ access: props.config.access, user: props.auth?.user ?? {},
  //    organization: props.auth?.organization, resource: props.collection,
  //    action: DRAFT_ACTIONS.readDrafts, data: doc, throwOnDenied: true })`.
  //    → throws `VexAccessError` here; step 3 never runs for a denied caller.
  // 3. Delegate to the Step 4 model helper:
  //    `const rows = await listVersionRows({ ctx: props.ctx, collection: props.collection,
  //    documentId: props.documentId, limit: props.limit })`.
  // 4. Map each row to a `VersionSummary` — `snapshot` is NEVER included here:
  //    `{ version: row.version, status: row.status, createdBy: row.createdBy ?? null,
  //    createdAt: row._creationTime, restoredFrom: row.restoredFrom ?? null,
  //    publishedAt: row.publishedAt ?? null }`.
  // Edge cases:
  // - `limit` omitted → the model helper's own default (50) applies, not `Infinity`.
  // - A document with no history yet (first-edit bootstrap hasn't run) → `[]`, not an error.
  throw new Error("Not implemented");
}
```

- [ ] `packages/core/src/api/versions/getVersionSnapshot.server.ts` — gate on `readDrafts`.

#### `packages/core/src/api/versions/getVersionSnapshot.server.ts`

```ts
import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericVersionsQueryServerArgs } from "./types";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { getVersion } from "../../versioning/model";

/**
 * Server-side args for `getVersionSnapshot`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface GetVersionSnapshotServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericVersionsQueryServerArgs<DataModel> {
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /** The published row's stable `_id`, as a string. See {@link ListVersionsServerArgs}. */
  documentId: string;
  /** The version number to fetch, as returned by `listVersions`. */
  version: number;
}

/** Full content of one history row, for restore preview. */
export interface VersionSnapshotResult {
  version: number;
  status: "draft" | "published";
  snapshot: Record<string, unknown>;
  createdBy: string | null;
  createdAt: number;
  parentVersion: number | null;
  restoredFrom: number | null;
  publishedAt: number | null;
}

/**
 * Fetches one version's full content (`extractUserFields`-stripped snapshot
 * plus lineage metadata), for restore preview.
 *
 * Gated on `readDrafts` — this is the endpoint that returns full draft
 * content, and `master` shipped it with zero authorization
 * (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ ctx, config, auth, collection, documentId, version }`.
 * @returns The version's snapshot and lineage metadata.
 * @throws {VexAccessError} When the caller's roles lack `readDrafts` on `collection`.
 * @throws {ConvexError} When no document exists at `documentId`, or `version` doesn't exist.
 */
export async function getVersionSnapshot<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  props: GetVersionSnapshotServerArgs<DataModel, TCollectionSlug>,
): Promise<VersionSnapshotResult> {
  // TODO: implement
  // 1. Load the target document (same as `listVersions` step 1) — `ConvexError` if missing.
  // 2. Gate on `DRAFT_ACTIONS.readDrafts` with `throwOnDenied: true` (same shape as
  //    `listVersions` step 2) — runs BEFORE step 3 reads the snapshot row.
  // 3. `const row = await getVersion({ ctx: props.ctx, collection: props.collection,
  //    documentId: props.documentId, version: props.version })`.
  //    a. `row === null` → `throw new ConvexError("Version not found")`.
  // 4. Return `{ version: row.version, status: row.status, snapshot: row.snapshot,
  //    createdBy: row.createdBy ?? null, createdAt: row._creationTime,
  //    parentVersion: row.parentVersion ?? null, restoredFrom: row.restoredFrom ?? null,
  //    publishedAt: row.publishedAt ?? null }`.
  // Edge cases:
  // - `snapshot` is `v.any()` in the DB (design-review.md §9 "snapshots stored as-is") —
  //   this function does NOT re-validate it against the collection's current Zod schema;
  //   the form layer handles drift on restore.
  throw new Error("Not implemented");
}
```

- [ ] `packages/core/src/api/versions/deleteVersion.server.ts` — gates on `deleteVersions`.

#### `packages/core/src/api/versions/deleteVersion.server.ts`

```ts
import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericVersionsMutationServerArgs } from "./types";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { getVersion } from "../../versioning/model";

/**
 * Server-side args for `deleteVersion`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface DeleteVersionServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericVersionsMutationServerArgs<DataModel> {
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /** The published row's stable `_id`, as a string. See {@link ListVersionsServerArgs}. */
  documentId: string;
  /** The version number to permanently delete. */
  version: number;
}

/**
 * Permanently deletes one `vex_versions` row. Prunes history only — never the
 * live draft or published row (that's `remove`'s cascade, Step 11).
 *
 * Gated on `deleteVersions` (Step 3's one-line access addition), never
 * `update` — `master` checked `update` here, which meant any editor allowed
 * to save a draft could also permanently destroy history
 * (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ ctx, config, auth, collection, documentId, version }`.
 * @returns `{ deleted: version }`.
 * @throws {VexAccessError} When the caller's roles lack `deleteVersions` on `collection`.
 * @throws {ConvexError} When no document exists at `documentId`, or `version` doesn't exist.
 */
export async function deleteVersion<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: DeleteVersionServerArgs<DataModel, TCollectionSlug>): Promise<{ deleted: number }> {
  // TODO: implement
  // 1. Load the target document (same as `listVersions` step 1) — `ConvexError` if missing.
  // 2. Gate on `DRAFT_ACTIONS.deleteVersions` with `throwOnDenied: true` — same shape as
  //    `listVersions` step 2 but a DIFFERENT action; `readDrafts` alone must not be enough
  //    to prune history.
  // 3. `const row = await getVersion({ ctx: props.ctx, collection: props.collection,
  //    documentId: props.documentId, version: props.version })`.
  //    a. `row === null` → `throw new ConvexError("Version not found")`.
  // 4. `await props.ctx.db.delete(row._id)`.
  // 5. `return { deleted: props.version }`.
  // Edge cases:
  // - Deleting the version a `restoredFrom` pointer on a LATER row references is legal —
  //   lineage pointers are informational, not foreign keys; a broken pointer just means
  //   "the source no longer has its own history entry," not a dangling reference error.
  throw new Error("Not implemented");
}
```

- [ ] `packages/core/src/api/versions/listVersions.client.ts`,
      `packages/core/src/api/versions/getVersionSnapshot.client.ts`,
      `packages/core/src/api/versions/deleteVersion.client.ts` — matching client files.

#### `packages/core/src/api/versions/listVersions.client.ts`

```ts
import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";

import { vexConvexApi, type VexVersionsListVersionsArgs } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type { VexQueryOptions } from "../types";
import type { VersionSummary } from "./listVersions.server";

/**
 * Client-side args for `listVersions`.
 *
 * @typeParam TCollectionSlug - Collection slug; narrowed after `vex generate`.
 */
export interface ListVersionsClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  /** Discriminator: client args must NOT include `ctx`. */
  ctx?: never;
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /** The published row's stable `_id`, as a string. */
  documentId: string;
  /** Maximum history rows to return, newest first. Defaults to 50. */
  limit?: number;
}

/**
 * Returns tanstack-query options for a document's version history. Hidden
 * from the UI without `readDrafts` — the query itself throws for a caller
 * that lacks it (see `VersionHistoryDropdown`, Step 13).
 *
 * Import from `@vexcms/core/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection, documentId, limit? }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 */
export function listVersions<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: ListVersionsClientArgs<TCollectionSlug>,
): VexQueryOptions<VexVersionsListVersionsArgs, VersionSummary[]> {
  // TODO: implement
  // 1. Cast `vexConvexApi.versions.listVersions` to
  //    `FunctionReference<"query", "public", VexVersionsListVersionsArgs, VersionSummary[]>`
  //    (mirrors `get.client.ts`'s `funcRef` cast — one registered function serving every
  //    collection, so its return type can't narrow from the runtime `collection` string).
  // 2. `return convexQuery(funcRef, { collection: props.collection,
  //    documentId: props.documentId, limit: props.limit })`.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/versions/getVersionSnapshot.client.ts`

```ts
import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";

import { vexConvexApi, type VexVersionsGetVersionSnapshotArgs } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type { VexQueryOptions } from "../types";
import type { VersionSnapshotResult } from "./getVersionSnapshot.server";

/**
 * Client-side args for `getVersionSnapshot`.
 *
 * @typeParam TCollectionSlug - Collection slug; narrowed after `vex generate`.
 */
export interface GetVersionSnapshotClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** Discriminator: client args must NOT include `ctx`. */
  ctx?: never;
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /** The published row's stable `_id`, as a string. */
  documentId: string;
  /** The version number to fetch. */
  version: number;
}

/**
 * Returns tanstack-query options for one version's full snapshot — used by
 * `VersionHistoryDropdown`'s restore preview. Client-side only.
 *
 * Import from `@vexcms/core/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection, documentId, version }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 */
export function getVersionSnapshot<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: GetVersionSnapshotClientArgs<TCollectionSlug>,
): VexQueryOptions<VexVersionsGetVersionSnapshotArgs, VersionSnapshotResult> {
  // TODO: implement
  // 1. Cast `vexConvexApi.versions.getVersionSnapshot` to a
  //    `FunctionReference<"query", "public", VexVersionsGetVersionSnapshotArgs,
  //    VersionSnapshotResult>` (same reasoning as `listVersions.client.ts` step 1).
  // 2. `return convexQuery(funcRef, { collection: props.collection,
  //    documentId: props.documentId, version: props.version })`.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/versions/deleteVersion.client.ts`

```ts
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "../convex";

/**
 * Returns a `useConvexMutation` hook bound to the `deleteVersion` Convex
 * mutation. Call the returned function as `mutationFn` inside `useMutation`.
 *
 * The mutation accepts `{ collection, documentId, version }` and throws for a
 * caller lacking `deleteVersions` — `VersionHistoryDropdown` (Step 13) hides
 * its delete affordance under the same action so the throw path is rarely hit.
 *
 * Import from `@vexcms/core/client`.
 *
 * @returns A `useConvexMutation`-compatible mutation function.
 */
export function deleteVersion() {
  // TODO: implement
  // 1. `return useConvexMutation(vexConvexApi.versions.deleteVersion);`
  //    (mirrors `globals/upsert.client.ts`'s `updateGlobal` — one-line bind, no args shaping
  //    needed since the mutation's own arg shape already matches the caller's call site.)
  throw new Error("Not implemented");
}
```

- [ ] `packages/core/src/api/versions/listVersions.server.test.ts`,
      `packages/core/src/api/versions/getVersionSnapshot.server.test.ts`,
      `packages/core/src/api/versions/deleteVersion.server.test.ts` — a role without
      `readDrafts` receives no draft content; a role without `deleteVersions` cannot prune
      history.

> Fixture note: these tests assume the shared test fixture
> (`packages/core/src/api/test/convex/schema.ts`, extended by Steps 2 and 4–7) declares a
> versioned `pages` table (`vex_status`, `vex_publishedAt`, `vex_publishedId`) and the
> `vex_versions` table (`collection`, `documentId`, `version`, `status`, `snapshot`,
> `createdBy`, `parentVersion`, `restoredFrom`, `publishedAt`, indexed
> `by_document` `["collection","documentId"]` and `by_document_version`
> `["collection","documentId","version"]`) — the same names `design-review.md` and this
> spec use throughout, so every step's fixture additions converge on one schema.

#### `packages/core/src/api/versions/listVersions.server.test.ts`

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access";
import { defineCollection, text } from "../../index";
import { VexAccessError } from "../../access";
import { listVersions } from "./listVersions.server";

const pages = defineCollection({
  slug: "pages",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [pages],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { pages: { readDrafts: true } },
    viewer: { pages: { read: true } },
  },
});

const fixtureConfig = { collections: [pages], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const editorUser = { _id: "u1", roles: ["editor"] };
const viewerUser = { _id: "u2", roles: ["viewer"] };

describe("listVersions (server)", () => {
  test("returns summaries, newest first, without snapshot content", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const documentId = await ctx.db.insert("pages", {
        title: "Hello",
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "pages",
        documentId,
        version: 1,
        status: "published",
        snapshot: { title: "Hello" },
      });
      await ctx.db.insert("vex_versions", {
        collection: "pages",
        documentId,
        version: 2,
        status: "draft",
        snapshot: { title: "Hello (draft edit)" },
      });

      const result = await listVersions({
        ctx,
        config: fixtureConfig,
        auth: { user: editorUser },
        collection: "pages",
        documentId,
      });

      expect(result.map((v) => v.version)).toEqual([2, 1]);
      for (const entry of result) {
        expect(entry).not.toHaveProperty("snapshot");
      }
    });
  });

  test("throws for a caller without readDrafts, before reading any version row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const documentId = await ctx.db.insert("pages", {
        title: "Hello",
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "pages",
        documentId,
        version: 1,
        status: "published",
        snapshot: { title: "Hello", secret: "draft-only-field" },
      });

      await expect(
        listVersions({
          ctx,
          config: fixtureConfig,
          auth: { user: viewerUser },
          collection: "pages",
          documentId,
        }),
      ).rejects.toThrow(VexAccessError);
    });
  });

  test("throws when the document does not exist", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const otherId = await ctx.db.insert("pages", { title: "Other", vex_status: "published" });
      await ctx.db.delete(otherId);

      await expect(
        listVersions({
          ctx,
          config: fixtureConfig,
          auth: { user: editorUser },
          collection: "pages",
          documentId: otherId,
        }),
      ).rejects.toThrow();
    });
  });
});
```

#### `packages/core/src/api/versions/getVersionSnapshot.server.test.ts`

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess, VexAccessError } from "../../access";
import { defineCollection, text } from "../../index";
import { getVersionSnapshot } from "./getVersionSnapshot.server";

const pages = defineCollection({
  slug: "pages",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [pages],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { pages: { readDrafts: true } },
    viewer: { pages: { read: true } },
  },
});

const fixtureConfig = { collections: [pages], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const editorUser = { _id: "u1", roles: ["editor"] };
const viewerUser = { _id: "u2", roles: ["viewer"] };

describe("getVersionSnapshot (server)", () => {
  test("returns the full snapshot for a caller with readDrafts", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const documentId = await ctx.db.insert("pages", {
        title: "Hello",
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "pages",
        documentId,
        version: 1,
        status: "draft",
        snapshot: { title: "Draft body", secret: "only-visible-with-readDrafts" },
      });

      const result = await getVersionSnapshot({
        ctx,
        config: fixtureConfig,
        auth: { user: editorUser },
        collection: "pages",
        documentId,
        version: 1,
      });

      expect(result.snapshot).toEqual({
        title: "Draft body",
        secret: "only-visible-with-readDrafts",
      });
      expect(result.status).toBe("draft");
    });
  });

  test("throws for a caller without readDrafts — no draft content escapes the rejection", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const documentId = await ctx.db.insert("pages", {
        title: "Hello",
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "pages",
        documentId,
        version: 1,
        status: "draft",
        snapshot: { title: "Draft body", secret: "must-not-leak" },
      });

      const call = getVersionSnapshot({
        ctx,
        config: fixtureConfig,
        auth: { user: viewerUser },
        collection: "pages",
        documentId,
        version: 1,
      });

      await expect(call).rejects.toThrow(VexAccessError);
      await expect(call.catch((e) => JSON.stringify(e))).resolves.not.toContain(
        "must-not-leak",
      );
    });
  });

  test("throws when the version does not exist", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const documentId = await ctx.db.insert("pages", {
        title: "Hello",
        vex_status: "published",
      });

      await expect(
        getVersionSnapshot({
          ctx,
          config: fixtureConfig,
          auth: { user: editorUser },
          collection: "pages",
          documentId,
          version: 99,
        }),
      ).rejects.toThrow();
    });
  });
});
```

#### `packages/core/src/api/versions/deleteVersion.server.test.ts`

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess, VexAccessError } from "../../access";
import { defineCollection, text } from "../../index";
import { deleteVersion } from "./deleteVersion.server";

const pages = defineCollection({
  slug: "pages",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["admin", "editor"] as const,
  resources: [pages],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { pages: { readDrafts: true, deleteVersions: true } },
    editor: { pages: { readDrafts: true } }, // can read history, not prune it
  },
});

const fixtureConfig = { collections: [pages], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const adminUser = { _id: "u1", roles: ["admin"] };
const editorUser = { _id: "u2", roles: ["editor"] };

describe("deleteVersion (server)", () => {
  test("deletes the targeted version row for a caller with deleteVersions", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const documentId = await ctx.db.insert("pages", {
        title: "Hello",
        vex_status: "published",
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "pages",
        documentId,
        version: 1,
        status: "published",
        snapshot: { title: "Hello" },
      });

      const result = await deleteVersion({
        ctx,
        config: fixtureConfig,
        auth: { user: adminUser },
        collection: "pages",
        documentId,
        version: 1,
      });

      expect(result).toEqual({ deleted: 1 });
      expect(await ctx.db.get(versionId)).toBeNull();
    });
  });

  test("throws for a caller without deleteVersions — history is left intact", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const documentId = await ctx.db.insert("pages", {
        title: "Hello",
        vex_status: "published",
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "pages",
        documentId,
        version: 1,
        status: "published",
        snapshot: { title: "Hello" },
      });

      await expect(
        deleteVersion({
          ctx,
          config: fixtureConfig,
          auth: { user: editorUser },
          collection: "pages",
          documentId,
          version: 1,
        }),
      ).rejects.toThrow(VexAccessError);

      expect(await ctx.db.get(versionId)).not.toBeNull();
    });
  });

  test("throws when the version does not exist", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const documentId = await ctx.db.insert("pages", {
        title: "Hello",
        vex_status: "published",
      });

      await expect(
        deleteVersion({
          ctx,
          config: fixtureConfig,
          auth: { user: adminUser },
          collection: "pages",
          documentId,
          version: 99,
        }),
      ).rejects.toThrow();
    });
  });
});
```

- Verify: `pnpm --filter @vexcms/core test`

### Step 9 — `versionsApi` factory `[dev]`

Why: Registration point; mirrors `globalsApi` so a project without versioning registers
nothing.

> Split rationale: `convex-functions.md` states factories "are co-located with the server
> barrel in `src/api/server.ts` ... not a separate factory file" — `collectionsApi` and
> `globalsApi` both live there today. `versionsApi` follows the same placement. `convex.ts`'s
> role in this step is the same one it already plays for `globals`: it hosts the
> `vexConvexApi.versions` typed `anyApi` surface (built incrementally, one entry per
> operation, across Steps 5–8) that both `client.ts`'s wrappers and this factory's return
> type reference — Steps 5–8 already completed that surface, so this step's `convex.ts`
> work is done; nothing further to add there.

- [ ] `packages/core/src/api/server.ts` — `versionsApi(config, query, mutation)`
      exporting bare names (`saveDraft`, `publish`, `unpublish`, `listVersions`,
      `getVersionSnapshot`, `deleteVersion`).

#### `packages/core/src/api/server.ts`

(add imports for the six operations near the existing
`globals/*.server` imports, and add the factory after `globalsApi`):

```ts
import { listVersions } from "./versions/listVersions.server";
import { getVersionSnapshot } from "./versions/getVersionSnapshot.server";
import { deleteVersion } from "./versions/deleteVersion.server";
import { saveDraft } from "./versions/saveDraft.server";
import { publish } from "./versions/publish.server";
import { unpublish } from "./versions/unpublish.server";
```

```ts
/**
 * Registers the draft/version workflow — `saveDraft`, `publish`, `unpublish`,
 * `listVersions`, `getVersionSnapshot`, `deleteVersion` — as bare-named Convex
 * endpoints under `api.vex.*`, mirroring `globalsApi`'s registration shape.
 *
 * Unlike `globalsApi` (always registers all three of its operations),
 * `versionsApi` registers NOTHING for a project with no versioned resource —
 * drafts are opt-in per collection/global (`versions.drafts`), so a project
 * that never opts in must not expose a draft/publish surface at all.
 *
 * @param props.config - The resolved `VexConfig`.
 * @param props.query - Convex `query` builder.
 * @param props.mutation - Convex `mutation` builder.
 * @param props.getAuth - Server-side resolver for the current caller, identical
 *   contract to `collectionsApi`'s (see its docstring) — resolved once per
 *   request, never a client argument.
 * @returns The six operations above, or `{}` when no resource declares
 *   `versions.drafts: true`.
 *
 * @example
 * ```ts
 * // apps/www/convex/vex.ts
 * import { versionsApi } from "@vexcms/core/server";
 * import { createGetAuth } from "@vexcms/better-auth/server";
 * import { mutation, query } from "./_generated/server";
 * import config from "~/vex.config";
 *
 * export const { saveDraft, publish, unpublish, listVersions, getVersionSnapshot, deleteVersion } =
 *   versionsApi({ config, query, mutation, getAuth: createGetAuth() });
 * // → {} when config has no `versions.drafts: true` anywhere
 * ```
 */
export function versionsApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>({
  config,
  query,
  mutation,
  getAuth,
}: {
  config: VexConfig;
  query: QueryBuilder<DataModel, Visibility>;
  mutation: MutationBuilder<DataModel, Visibility>;
  getAuth?: (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => Promise<VexApiAuth | undefined>;
}) {
  // TODO: implement
  // 1. `const hasVersionedCollections = config.collections.some((c) => c.versions?.drafts);`
  // 2. `const hasVersionedGlobals = config.globals.some((g) => g.versions?.drafts);`
  //    a. Neither → `return {};` — zero keys, so `api.vex.saveDraft` etc. do not exist
  //       on the wire for this project.
  // 3. Otherwise return one flat object (bare names, NOT nested under a `versions` key —
  //    naming-conventions.md: "Factory-registered API functions use bare operation names
  //    ... no adminXxx prefix"), each entry a `query(...)`/`mutation(...)` registration
  //    that resolves `auth` via `resolveGetAuth({ ctx, config, getAuth })` first (identical
  //    seam to every handler in `collectionsApi`/`globalsApi`) and delegates to the Step
  //    5–8 server function:
  //    ```ts
  //    return {
  //      saveDraft: mutation({
  //        args: { collection: v.string(), data: v.any(), environmentId: v.optional(v.string()) },
  //        handler: async (ctx, args) => {
  //          const auth = await resolveGetAuth({ ctx, config, getAuth });
  //          return saveDraft({ auth, ctx, config, collection: args.collection as CollectionSlug, data: args.data });
  //        },
  //      }),
  //      publish: mutation({ /* mirrors saveDraft's shape, delegates to `publish` */ }),
  //      unpublish: mutation({ /* delegates to `unpublish` */ }),
  //      listVersions: query({
  //        args: { collection: v.string(), documentId: v.string(), limit: v.optional(v.number()) },
  //        handler: async (ctx, args) => {
  //          const auth = await resolveGetAuth({ ctx, config, getAuth });
  //          return listVersions({ auth, ctx, config, collection: args.collection as CollectionSlug, documentId: args.documentId, limit: args.limit });
  //        },
  //      }),
  //      getVersionSnapshot: query({
  //        args: { collection: v.string(), documentId: v.string(), version: v.number() },
  //        handler: async (ctx, args) => {
  //          const auth = await resolveGetAuth({ ctx, config, getAuth });
  //          return getVersionSnapshot({ auth, ctx, config, collection: args.collection as CollectionSlug, documentId: args.documentId, version: args.version });
  //        },
  //      }),
  //      deleteVersion: mutation({
  //        args: { collection: v.string(), documentId: v.string(), version: v.number() },
  //        handler: async (ctx, args) => {
  //          const auth = await resolveGetAuth({ ctx, config, getAuth });
  //          return deleteVersion({ auth, ctx, config, collection: args.collection as CollectionSlug, documentId: args.documentId, version: args.version });
  //        },
  //      }),
  //    };
  //    ```
  // Edge cases:
  // - A project with ONLY versioned globals (no versioned collections) still registers
  //   all six — the surface doesn't split by resource kind.
  // - `getAuth` omitted while `config.access` is set → `resolveGetAuth` throws
  //   `VexAccessConfigError` on first call, same as every other factory.
  throw new Error("Not implemented");
}
```

- [ ] `packages/core/src/api/client.ts` — exports.

#### `packages/core/src/api/client.ts`

(append):

```ts
// VERSIONS API

export { saveDraft } from "./versions/saveDraft.client";
export { publish } from "./versions/publish.client";
export { unpublish } from "./versions/unpublish.client";
export { listVersions } from "./versions/listVersions.client";
export type { ListVersionsClientArgs } from "./versions/listVersions.client";
export { getVersionSnapshot } from "./versions/getVersionSnapshot.client";
export type { GetVersionSnapshotClientArgs } from "./versions/getVersionSnapshot.client";
export { deleteVersion } from "./versions/deleteVersion.client";
export type { VersionSummary } from "./versions/listVersions.server";
export type { VersionSnapshotResult } from "./versions/getVersionSnapshot.server";
```

- [ ] `packages/core/src/api/convex.test.ts` — registers only declared operations.

#### `packages/core/src/api/convex.test.ts`

```ts
import type { GenericDataModel, MutationBuilder, QueryBuilder } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../config";
import { defineCollection, text } from "../index";
import { vexConvexApi } from "./convex";
import { versionsApi } from "./server";

// Mock builders: `versionsApi`'s registration branching doesn't execute the
// handler, so an identity function stands in for Convex's real `query`/`mutation`
// — this tests which keys get registered, not the handlers' runtime behavior
// (that's covered by each operation's own `.server.test.ts`).
const mockQuery = ((def: unknown) => def) as unknown as QueryBuilder<GenericDataModel, "public">;
const mockMutation = ((def: unknown) => def) as unknown as MutationBuilder<
  GenericDataModel,
  "public"
>;

const unversionedPages = defineCollection({
  slug: "pages",
  fields: { title: text({ required: true }) },
});

const versionedPages = defineCollection({
  slug: "pages",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

describe("vexConvexApi.versions — type surface", () => {
  test("exposes exactly the six bare operation names", () => {
    expect(Object.keys(vexConvexApi.versions).sort()).toEqual(
      [
        "saveDraft",
        "publish",
        "unpublish",
        "listVersions",
        "getVersionSnapshot",
        "deleteVersion",
      ].sort(),
    );
  });
});

describe("versionsApi — conditional registration", () => {
  test("registers nothing for a project with no versioned resource", () => {
    const config = { collections: [unversionedPages], globals: [] } as unknown as VexConfig;
    const api = versionsApi({ config, query: mockQuery, mutation: mockMutation });
    expect(Object.keys(api)).toEqual([]);
  });

  test("registers all six bare-named operations when a collection declares versions.drafts", () => {
    const config = { collections: [versionedPages], globals: [] } as unknown as VexConfig;
    const api = versionsApi({ config, query: mockQuery, mutation: mockMutation });
    expect(Object.keys(api).sort()).toEqual(
      [
        "saveDraft",
        "publish",
        "unpublish",
        "listVersions",
        "getVersionSnapshot",
        "deleteVersion",
      ].sort(),
    );
  });
});
```

- Verify: `pnpm --filter @vexcms/core test`

### Step 10 — Status filter injection `[dev]`

Why: Consumes `access-index-resolution` Steps 1–5; the point at which public reads stop
seeing draft rows. With two rows sharing a slug (design-review.md §3.1), an unfiltered
query returns the same logical document twice — filtering is data integrity here, not an
optimization, and it is deliberately NOT expressed as a permission rule
(`access-index-design.md` §12): the anon role needs no knowledge of `vex_status`.

> Scope note: this step makes `find`/`get`/`search` correct for DIRECT callers (a project's
> own `convex/pages.ts` calling `find({ ctx, collection: "pages", config })`, per
> `access-index-design.md` §9.4) and for `collectionsApi`'s network-registered endpoints once
> that registration passes `drafts` through — wiring `drafts` into `collectionsApi`'s Convex
> arg validators (`server.ts`) is out of scope here; Steps 11–13 build the admin surfaces
> that call these functions with `drafts: true`.

- [ ] `packages/core/src/api/find/server.ts` — `drafts?: boolean` arg; for versioned
      collections when `drafts` is falsy, inject the published-only status index through
      `pickQueryIndex`.

#### `packages/core/src/api/find/server.ts`

(add to `FindServerArgs`, alongside `withIndex`):

```ts
  /**
   * Include draft rows for a versioned collection. Defaults to `false` — the
   * two-row draft model (design-review.md §1) means an unfiltered query on a
   * versioned collection returns the same logical document twice, so `find`
   * injects a published-only status constraint unless this is `true`.
   *
   * Ignored for non-versioned collections. `true` requires `readDrafts` — the
   * constraint is a data-integrity default, not authorization, so setting
   * `drafts: true` does not itself grant access to draft content; the caller
   * still needs the permission the rest of the pipeline enforces.
   */
  drafts?: boolean;
```

Add a new exported helper — this is the piece `get/server.ts` and `search/server.ts` also
import, so the "is this collection versioned and drafts not requested" decision has one
source:

```ts
import type { CollectionConfig } from "../../collections";
import { CRUD_ACTIONS, hasPermission, resolveAccessIndex, pickQueryIndex, type AccessIndex } from "../../access";

/** The framework-supplied index for "published rows only" (access-index-design.md §12). */
export const VEX_STATUS_PUBLISHED_INDEX: AccessIndex = {
  name: "by_status",
  range: () => (q) => q.eq("vex_status", "published"),
};

/**
 * Decides whether a versioned-collection query must be constrained to
 * published rows — true whenever the collection declares `versions.drafts`
 * and the caller isn't requesting drafts.
 *
 * @param props.config - The resolved `VexConfig`, to look up the collection.
 * @param props.collection - The collection slug being queried.
 * @param props.drafts - The caller's `drafts` arg.
 * @param props.bypass - The caller's `access.bypass`. Bypass means NO access machinery
 *   at all (inherited decision 7), so status narrowing is skipped too.
 * @returns `true` when the published-only constraint must apply.
 */
export function requiresPublishedOnly(props: {
  config?: { collections: CollectionConfig[] };
  collection: string;
  drafts?: boolean;
  bypass?: boolean;
}): boolean {
  // TODO: implement
  // 0. `if (props.bypass === true) return false;` — bypass skips status narrowing.
  // 1. `if (props.drafts) return false;` — caller explicitly asked for drafts.
  // 2. `const collectionConfig = props.config?.collections.find((c) => c.slug === props.collection);`
  // 3. `return collectionConfig?.versions?.drafts === true;`
  // Edge cases:
  // - `config` omitted (RBAC/config-off callers) → step 2 finds nothing → `false`. A caller
  //   not passing `config` gets today's unfiltered behavior, same as `hasPermission` being
  //   skipped entirely when `config.access` is undefined elsewhere in this file.
  throw new Error("Not implemented");
}
```

SYNCED to the shipped access seam (spec 2026-08-29-server-api-access-options): `find`
now resolves access ONCE at its top via `resolveAccessCall`, and `buildQuery` receives
`resolvedIndex` + `accessFilter` — it never re-resolves. So the status arbitration lands
in `find`'s existing resolve block, NOT inside `buildQuery`; the `drafts` toggle rides
the seam by switching `defaultAction`:

```ts
// find/server.ts — the existing resolve block, extended (get/search mirror it):
const { access, action, resource } = resolveAccessCall({
  config: args.config,
  access: args.access,
  // The toggle IS an action switch: readDrafts is fail-closed under the pinned deny
  // posture, which is what makes the client-supplied boolean safe.
  defaultAction: args.drafts === true ? DRAFT_ACTIONS.readDrafts : CRUD_ACTIONS.read,
  resource: args.collection,
});
const accessIndex = resolveAccessIndex({
  access,
  user: args.auth?.user ?? null,
  organization: args.auth?.organization,
  resource,
  action,
});
const publishedOnly = requiresPublishedOnly({
  config: args.config,
  collection: args.collection,
  drafts: args.drafts,
  bypass: args.access?.bypass,
});
// A caller-authored RBAC read index and the framework status index both want the
// one `withIndex` slot; the RBAC index (already scoped to what this caller may see)
// takes it, and the status constraint falls back to `.filter()` below. When there's
// no RBAC index, the status index gets the slot via `pickQueryIndex` like any other
// access index (access-index-design.md §12).
const effectiveAccessIndex = accessIndex ?? (publishedOnly ? VEX_STATUS_PUBLISHED_INDEX : undefined);
const resolvedIndex = pickQueryIndex({ accessIndex: effectiveAccessIndex, callerIndex: callerIndex });
```

`buildQuery` itself gains only the structural fallback, driven by one new boolean arg
(`publishedOnlyFallback: publishedOnly && resolvedIndex?.name !== VEX_STATUS_PUBLISHED_INDEX.name`),
inserted after today's step 3 `filter`:

```ts

  // NEW, after today's step 3 `filter` — the status constraint is data integrity
  // (design-review.md §3.1), not an RBAC rule run through `hasPermission`'s
  // per-document pass. It must be enforced structurally: when the status index won
  // the slot the `.eq` range already guarantees it (no filter needed); whenever
  // something else occupies the slot (an RBAC index, or the caller's own
  // `withIndex`), this in-pipeline `.filter()` keeps correctness independent of
  // which index was chosen — and returns FULL pages, unlike a post-pagination pass.
  if (args.publishedOnlyFallback) {
    // @ts-expect-error building query piece by piece from query args
    q = q.filter((qb) => qb.eq(qb.field("vex_status"), "published"));
  }
```

- [ ] `packages/core/src/api/get/server.ts` — `drafts?: boolean` arg; a versioned
      collection's row is treated as not found when its status isn't published and
      `drafts` wasn't requested.

#### `packages/core/src/api/get/server.ts`

(add to `GetServerArgs`, mirroring `find`'s field
verbatim, then insert one check right after the existing `doc`/`hasPermission` block):

```ts
  /** Same contract as `FindServerArgs.drafts` — see `find/server.ts`. */
  drafts?: boolean;
```

```ts
export async function get<...>(args: GetServerArgs<...>): Promise<GetReturn<...>> {
  let doc = await args.ctx.db.get(args.id);
  // SYNCED: `get` now resolves through the seam — `resolveAccessCall` with
  // `defaultAction: args.drafts === true ? DRAFT_ACTIONS.readDrafts : CRUD_ACTIONS.read`,
  // guard on the RESOLVED `access`, check reads `{ access, action }`. Only the
  // `defaultAction` ternary is new; the resolve block already exists in the file.
  const { access, action } = resolveAccessCall(/* … as in the current file … */);
  if (doc && access !== undefined) {
    // existing throwOnDenied `hasPermission({ access, action, … })` gate, unchanged.
  }

  // TODO: implement — insert here, before the depth/populate section.
  // 1. `get` has no query to narrow (access-index-design.md §10: "✗ single document"), so
  //    this is a direct post-fetch check, not `pickQueryIndex`.
  // 2. `if (doc && requiresPublishedOnly({ config: args.config, collection: args.collection,
  //    drafts: args.drafts }) && (doc as Record<string, unknown>).vex_status !== "published")
  //    doc = null;`
  //    → a draft row fetched by a caller not requesting drafts does not exist for them —
  //    same "not found" semantics as an RBAC-denied `get`, not a thrown error, because the
  //    row IS the wrong logical state to serve, not a permission boundary.
  // Edge cases:
  // - Runs AFTER the existing `hasPermission` block, not before — RBAC denial must still
  //   throw ahead of a status check that would otherwise silently swallow it into a plain
  //   `null`.
  // - Non-versioned collections: `requiresPublishedOnly` returns `false` (Step 4's
  //   `requiresPublishedOnly`, imported from `../find/server`), so this is a no-op — `get`
  //   on `posts` behaves exactly as it does today.
  throw new Error("Not implemented");

  // ... existing depth/populate logic below, unchanged, now operating on the
  // possibly-nulled `doc`.
}
```

- [ ] `packages/core/src/api/search/server.ts` — `drafts?: boolean` arg; for versioned
      collections when `drafts` is falsy, constrain the search to published rows.

#### `packages/core/src/api/search/server.ts`

(add to `SearchServerArgs`, then modify
`buildQuery`):

```ts
  /** Same contract as `FindServerArgs.drafts` — see `find/server.ts`. */
  drafts?: boolean;
```

```ts
function buildQuery<...>(args: SearchServerArgs<...>): QueryInitializer<...> {
  let q = args.ctx.db.query(args.collection);
  if (args.query) {
    // TODO: implement
    // 1. `const publishedOnly = requiresPublishedOnly({ config: args.config, collection:
    //    args.collection, drafts: args.drafts });` (imported from `../find/server`).
    // 2. Convex search indexes narrow through `.withSearchIndex`, not `.withIndex` — there
    //    is no `pickQueryIndex` slot to arbitrate here (access-index-design.md's arbitration
    //    is find/get-shaped). The status constraint instead needs an EQUALITY filter field
    //    declared on the search index itself:
    //    `.searchIndex("search_<field>", { searchField, filterFields: ["vex_status"] })`
    //    (a schema-gen dependency, Step 2 — flag it if that index lacks the filter field
    //    for a versioned collection).
    // 3. `q = q.withSearchIndex(args.searchIndexName, (sq) => {
    //      const base = sq.search(args.searchField, args.query);
    //      return publishedOnly ? base.eq("vex_status", "published") : base;
    //    });`
    // Edge cases:
    // - A versioned collection whose search index was NOT generated with
    //   `filterFields: ["vex_status"]` — `.eq("vex_status", ...)` throws at query time
    //   (unknown filter field), not a silently-wrong result. Fail loud, not quiet.
    throw new Error("Not implemented");
  }
  return q;
}
```

- [ ] `packages/core/src/api/find/server.test.ts` — public read returns no draft rows and
      no duplicate logical documents; `drafts: true` with `readDrafts` returns both.

#### `packages/core/src/api/find/server.test.ts`

(append a new `describe` block to the
existing file; reuses the file's existing `convexTest`/fixture setup pattern):

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access";
import { defineCollection, text } from "../../index";
import { find } from "./server";

const pages = defineCollection({
  slug: "pages",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["editor"] as const,
  resources: [pages],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { pages: { read: true, readDrafts: true } },
  },
});

const fixtureConfig = { collections: [pages], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const editorUser = { _id: "u1", roles: ["editor"] };

describe("find (server) — versioned collection status filtering", () => {
  test("a public read (drafts omitted) returns no draft rows and no duplicate documents", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("pages", {
        title: "About",
        vex_status: "published",
      });
      // The two-row model: this document ALSO has a draft row pointing at the
      // published row above. An unfiltered query would return both.
      await ctx.db.insert("pages", {
        title: "About (editing)",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      // A second, never-published document — draft only, no published row at all.
      await ctx.db.insert("pages", { title: "Upcoming", vex_status: "draft" });

      const result = await find({
        ctx,
        config: fixtureConfig,
        collection: "pages",
      });

      expect(result).toHaveLength(1);
      expect(result[0]?._id).toBe(publishedId);
      expect(result.every((d) => (d as Record<string, unknown>).vex_status === "published")).toBe(
        true,
      );
    });
  });

  test("drafts: true with readDrafts returns both the published and draft row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("pages", {
        title: "About",
        vex_status: "published",
      });
      await ctx.db.insert("pages", {
        title: "About (editing)",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });

      const result = await find({
        ctx,
        config: fixtureConfig,
        auth: { user: editorUser },
        collection: "pages",
        drafts: true,
      });

      expect(result).toHaveLength(2);
      expect(result.map((d) => (d as Record<string, unknown>).vex_status).sort()).toEqual([
        "draft",
        "published",
      ]);
    });
  });

  test("a non-versioned collection is unaffected", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Hello", slug: "hello" });

      const result = await find({
        ctx,
        config: fixtureConfig,
        collection: "posts",
      });

      expect(result).toHaveLength(1);
    });
  });
});
```

- Verify: `pnpm --filter @vexcms/core test`
### Step 11 — Two-row consequences `[dev]`

- [ ] `packages/core/src/versioning/assertUniqueAmongPublished.ts`
- [ ] `packages/core/src/versioning/assertUniqueAmongPublished.test.ts`
- [ ] `packages/core/src/api/test/convex/schema.ts`
- [ ] `packages/core/src/api/remove/server.ts`
- [ ] `packages/core/src/api/remove/server.test.ts`
- [ ] `packages/react/src/components/views/collapseVersionedPairs.ts`
- [ ] `packages/react/src/components/views/collapseVersionedPairs.test.ts`
- [ ] `packages/react/src/components/views/CollectionListView.tsx`
- [ ] `packages/react/src/components/views/CollectionListView.test.tsx`

No existing module owns "slug (or any field) uniqueness scoped to published rows" —
this step introduces the one reusable helper `design-review.md` §3.2 requires, so any
project-authored uniqueness check (a custom Convex query, a future field-level `unique`
option) has a correct, two-row-aware primitive to call instead of reinventing the same
bug. The remaining two files are existing, already-shipped code gaining a new,
narrowly-scoped cascade for versioned collections only — their current behavior for
non-versioned collections is untouched.

#### `packages/core/src/versioning/assertUniqueAmongPublished.ts`
```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";

/**
 * Args for `assertUniqueAmongPublished`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - The collection slug being checked.
 */
export interface AssertUniqueAmongPublishedArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> {
  /** Convex query context — a read-only lookup, safe from a query or a mutation. */
  ctx: GenericQueryCtx<DataModel>;
  /** The collection slug whose table is queried. */
  collection: TCollectionSlug;
  /** Name of the single-field equality index declared on `field` (e.g. `"by_slug"`). */
  indexName: string;
  /** The field the index is defined on. */
  field: string;
  /** The value to check for collisions among published rows. */
  value: string;
  /**
   * The document currently being edited, excluded from collision candidates.
   * Pass the PUBLISHED row's id — including when the edit is happening through
   * its draft — never the draft's own id (see design-review.md §3.2). Omit
   * when creating a brand new document.
   */
  excludeId?: GenericId<TCollectionSlug>;
}

/**
 * Asserts that no OTHER published row in `collection` already has `value` for
 * `field`, scoped to `vex_status === "published"` (design-review.md §3.2).
 *
 * A draft row shares its published parent's field values by definition, so an
 * uniqueness check that considers every row — draft included — reports a
 * document as colliding with itself the moment it has a draft. Scoping to
 * published rows only, and excluding the document's own published `_id`,
 * removes both false positives while still catching a real collision with a
 * DIFFERENT document's published row (a third document's in-progress, not
 * yet published, draft never counts either).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - The collection slug being checked.
 * @param args - `{ ctx, collection, indexName, field, value, excludeId? }`.
 * @returns Promise resolving when no collision exists.
 * @throws {Error} When a different published row already has `value` for `field`.
 * @example
 * ```ts
 * await assertUniqueAmongPublished({
 *   ctx,
 *   collection: "pages",
 *   indexName: "by_slug",
 *   field: "slug",
 *   value: data.slug,
 *   excludeId: publishedId,
 * });
 * ```
 */
export async function assertUniqueAmongPublished<
  DataModel extends GenericDataModel = GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: AssertUniqueAmongPublishedArgs<DataModel, TCollectionSlug>): Promise<void> {
  // TODO: implement
  // 1. Query `args.collection` via `args.indexName`, equality on
  //    `args.field === args.value`:
  //    `ctx.db.query(args.collection).withIndex(args.indexName, (q) => q.eq(args.field, args.value)).collect()`.
  //    → the caller is responsible for having declared this index (mirrors
  //      `find/server.ts`'s caller-supplied `withIndex`, convex-functions.md).
  // 2. Filter the results to real collision candidates:
  //    a. Keep only rows where `doc.vex_status === "published" || doc.vex_status === undefined`
  //       (the latter covers non-versioned collections, where every row IS
  //       "the" document — never `vex_status === "draft"`, which would flag a
  //       document as colliding with its own in-progress edit).
  //    b. Drop `args.excludeId` from the candidate set, when provided.
  //    → produces the list of OTHER published rows sharing the value.
  // 3. Any candidate remaining → `throw new Error(...)` naming `args.field` and
  //    `args.value` (e.g. `Another published document already uses "${args.field}": "${args.value}"`).
  // Edge cases:
  // - Non-versioned collection: `vex_status` is never set, so step 2a keeps
  //   every row — degrades to a plain "no other row has this value" check.
  // - `excludeId` omitted (create path): every candidate surviving step 2 is a
  //   real collision, including a row that happens to be a draft's own
  //   never-published state (excluded already by 2a's status filter).
  throw new Error("Not implemented");
}
```

#### `packages/core/src/versioning/assertUniqueAmongPublished.test.ts`
```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../api/test/convex/_generated/api";
import schema from "../api/test/convex/schema";
import { assertUniqueAmongPublished } from "./assertUniqueAmongPublished";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("assertUniqueAmongPublished", () => {
  test("throws on create (no excludeId) when a published row already has the value", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Existing", slug: "taken", vex_status: "published" });
      await expect(
        assertUniqueAmongPublished({
          ctx,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "taken",
        }),
      ).rejects.toThrow();
    });
  });

  test("throws when a DIFFERENT document's published row already has the value", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "First", slug: "hello", vex_status: "published" });
      const second = await ctx.db.insert("posts", {
        title: "Second",
        slug: "world",
        vex_status: "published",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "hello",
          excludeId: second,
        }),
      ).rejects.toThrow();
    });
  });

  test("does not throw when editing a published document with its own unchanged slug", async () => {
    // The exact bug design-review.md §3.2 describes: a draft sharing its
    // published parent's slug must not make the parent collide with itself.
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const published = await ctx.db.insert("posts", {
        title: "Post",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("posts", {
        title: "Post (edited)",
        slug: "hello",
        vex_status: "draft",
        vex_publishedId: published,
      });
      await expect(
        assertUniqueAmongPublished({
          ctx,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "hello",
          excludeId: published,
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("ignores another document's not-yet-published draft sharing the checked value", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedA = await ctx.db.insert("posts", {
        title: "A",
        slug: "post-a",
        vex_status: "published",
      });
      const publishedB = await ctx.db.insert("posts", {
        title: "B",
        slug: "post-b",
        vex_status: "published",
      });
      // B has an in-progress draft that ALSO wants "post-a" — but hasn't
      // published, so it must never block A from keeping its own slug.
      await ctx.db.insert("posts", {
        title: "B (edited)",
        slug: "post-a",
        vex_status: "draft",
        vex_publishedId: publishedB,
      });
      await expect(
        assertUniqueAmongPublished({
          ctx,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "post-a",
          excludeId: publishedA,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
```

#### `packages/core/src/api/test/convex/schema.ts`

(add a `by_slug` index to the shared
fixture's `posts` table — `vex_status` / `vex_publishedId` already landed in Steps 2 and 4)
```ts
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    deleted: v.optional(v.boolean()), // For soft delete tests
    author: v.optional(v.array(v.id("authors"))),
    parent: v.optional(v.array(v.id("posts"))), // self-ref for depth tests
  })
    .searchIndex("search_title", { searchField: "title" })
    .index("by_featured", ["featured"])
    .index("by_slug", ["slug"]),
```

#### `packages/core/src/api/remove/server.ts`
```ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../access";

/**
 * Server-side args for `remove`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 */
export interface RemoveServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The collection slug to insert into. */
  collection: TCollectionSlug;
  /**
   * Document ID(s) to delete.
   * Pass a single ID in an array for one document, or multiple IDs for bulk delete.
   */
  ids: GenericId<TCollectionSlug>[];
  /**
   * Optional soft delete field name.
   * If provided, sets this field to `true` instead of permanently deleting.
   * @example "deleted" — sets { deleted: true } on the document(s)
   */
  softDelete?: string;
}

/**
 * Deletes one or more documents. Server-side only.
 * Named `remove` to avoid collision with the JavaScript `delete` keyword.
 *
 * Supports both hard delete (permanent) and soft delete (mark as deleted).
 * Pass `softDelete` field name to soft delete instead of permanently removing.
 *
 * On a versioned collection, deleting either row of a document cascades to
 * its draft row (if any) and all of its `vex_versions` history
 * (design-review.md §3.4) — see `cascadeVersionedDelete` below.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, ids, softDelete? }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @example Single delete
 * ```ts
 * import { remove } from "@vexcms/core/server";
 *
 * export const deletePost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => remove({ ctx, ids: [args.id] }),
 * });
 * ```
 * @example Bulk delete
 * ```ts
 * export const bulkDeletePosts = mutation({
 *   args: { ids: v.array(v.id("posts")) },
 *   handler: (ctx, args) => remove({ ctx, ids: args.ids }),
 * });
 * ```
 * @example Soft delete
 * ```ts
 * export const softDeletePost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) =>
 *     remove({ ctx, ids: [args.id], softDelete: "deleted" }),
 * });
 * ```
 */
export async function remove<
  DataModel extends GenericDataModel = GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: RemoveServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  const isVersioned =
    args.config.collections.find((c) => c.slug === args.collection)?.versions?.drafts === true;

  async function removeById(id: GenericId<TCollectionSlug>): Promise<void> {
    let doc: Record<string, unknown> | null = null;
    if (args.config.access !== undefined || isVersioned) {
      doc = await args.ctx.db.get(id);
    }

    if (args.config.access !== undefined) {
      hasPermission({
        throwOnDenied: true,
        access: args.config.access,
        user: args.auth?.user ?? {},
        organization: args.auth?.organization,
        resource: args.collection,
        action: CRUD_ACTIONS.delete,
        data: doc ?? undefined,
      });
    }

    if (isVersioned && doc) {
      await cascadeVersionedDelete({ ctx: args.ctx, collection: args.collection, doc });
    }

    if (args.softDelete) {
      return await args.ctx.db.patch(args.collection, id, { [args.softDelete as never]: true });
    }
    return await args.ctx.db.delete(args.collection, id);
  }

  await Promise.all(args.ids.map((id) => removeById(id)));
}

/**
 * Cascades a document delete across the two-row draft model
 * (design-review.md §3.4): deletes the document's draft row, if any, and
 * every `vex_versions` history row for the document. Called by `removeById`
 * before the row passed to `remove()` is itself deleted — safe to call with
 * either the published row or its draft, since both resolve to the same
 * logical document.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param args - `{ ctx, collection, doc }`.
 * @param args.ctx - Convex mutation context.
 * @param args.collection - The collection slug the document belongs to.
 * @param args.doc - The row passed to `remove()` — the published row or its draft.
 * @returns Promise resolving once the draft row and all version rows are gone.
 * @throws {Error} Always, until implemented.
 */
async function cascadeVersionedDelete<DataModel extends GenericDataModel>(args: {
  ctx: GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  doc: Record<string, unknown>;
}): Promise<void> {
  // TODO: implement
  // 1. Resolve the published row's id for this logical document:
  //    a. `doc.vex_publishedId` set → `doc` IS the draft row; the published id
  //       is `doc.vex_publishedId`.
  //    b. `doc.vex_publishedId` undefined → `doc` IS the published row (or a
  //       never-published draft with no parent yet); the published id is `doc._id`.
  //    → produces `publishedId`.
  // 2. Find the draft row pointing at `publishedId` via `findDraftRow`
  //    (`../../versioning/model`, `by_published` index):
  //    a. Found, and its `_id` differs from `doc._id` → `ctx.db.delete` it.
  //    b. Found, and its `_id` equals `doc._id` → already being deleted by the
  //       caller; skip, do not double-delete.
  //    → keeps the two-row invariant: no orphaned draft after its parent is gone.
  // 3. List every `vex_versions` row for `(collection, publishedId)` via
  //    `listVersions` (`../../versioning/model`) and `ctx.db.delete` each —
  //    history for a deleted document has no reason to survive it.
  // Edge cases:
  // - Non-versioned collection: `removeById` never calls this helper (guarded
  //   by `isVersioned`), so there is no cost on the common path.
  // - `doc` is a never-published draft (`vex_status: "draft"`,
  //   `vex_publishedId: undefined`): step 1b applies (`publishedId === doc._id`);
  //   step 2 finds nothing besides `doc` itself (already excluded by 2b); step 3
  //   still clears any version history the draft accrued via autosave.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/remove/server.test.ts`
```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { remove } from "./server";


// Minimal resolved-config fixture: these server functions only read
// `config.access` (undefined here → RBAC off) at this layer.
const fixtureConfig = { collections: [] } as unknown as VexConfig;

// A versioned "posts" collection, for the two-row cascade tests below.
const versionedFixtureConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: { title: { type: "text" }, slug: { type: "text" } },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
      versions: { drafts: true },
    },
  ],
} as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("remove (server)", () => {
  test("deletes a single document (ID in array)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Doomed", slug: "d" });
      await remove({ ctx, ids: [id], collection: "posts", config: fixtureConfig });
      const doc = await ctx.db.get(id);
      expect(doc).toBeNull();
    });
  });

  test("bulk deletes multiple documents", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id1 = await ctx.db.insert("posts", { title: "Post 1", slug: "p1" });
      const id2 = await ctx.db.insert("posts", { title: "Post 2", slug: "p2" });
      const id3 = await ctx.db.insert("posts", { title: "Post 3", slug: "p3" });

      await remove({ ctx, ids: [id1, id2, id3], collection: "posts", config: fixtureConfig });

      const doc1 = await ctx.db.get(id1);
      const doc2 = await ctx.db.get(id2);
      const doc3 = await ctx.db.get(id3);

      expect(doc1).toBeNull();
      expect(doc2).toBeNull();
      expect(doc3).toBeNull();
    });
  });

  test("soft delete marks document as deleted instead of removing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Soft Delete Test", slug: "sdt" });

      await remove({ ctx, ids: [id], softDelete: "deleted", collection: "posts", config: fixtureConfig });

      const doc = await ctx.db.get(id);
      expect(doc).not.toBeNull();
      expect((doc as any).deleted).toBe(true);
    });
  });

  test("soft delete works with multiple documents", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id1 = await ctx.db.insert("posts", { title: "Post 1", slug: "p1" });
      const id2 = await ctx.db.insert("posts", { title: "Post 2", slug: "p2" });

      await remove({ ctx, ids: [id1, id2], softDelete: "deleted", collection: "posts", config: fixtureConfig });

      const doc1 = await ctx.db.get(id1);
      const doc2 = await ctx.db.get(id2);

      expect(doc1).not.toBeNull();
      expect(doc2).not.toBeNull();
      expect((doc1 as any).deleted).toBe(true);
      expect((doc2 as any).deleted).toBe(true);
    });
  });
});

describe("remove (server) — two-row cascade", () => {
  test("deleting the published row also deletes its draft row and version history", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Published",
        slug: "cascade-a",
        vex_status: "published",
      });
      const draftId = await ctx.db.insert("posts", {
        title: "Published (edited)",
        slug: "cascade-a",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      const versionId1 = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: publishedId,
        version: 1,
        status: "published",
      });
      const versionId2 = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: publishedId,
        version: 2,
        status: "draft",
      });

      await remove({ ctx, ids: [publishedId], collection: "posts", config: versionedFixtureConfig });

      expect(await ctx.db.get(publishedId)).toBeNull();
      expect(await ctx.db.get(draftId)).toBeNull();
      expect(await ctx.db.get(versionId1)).toBeNull();
      expect(await ctx.db.get(versionId2)).toBeNull();
    });
  });

  test("deleting via the draft row cascades identically", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Published",
        slug: "cascade-b",
        vex_status: "published",
      });
      const draftId = await ctx.db.insert("posts", {
        title: "Published (edited)",
        slug: "cascade-b",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: publishedId,
        version: 1,
        status: "published",
      });

      await remove({ ctx, ids: [draftId], collection: "posts", config: versionedFixtureConfig });

      expect(await ctx.db.get(publishedId)).toBeNull();
      expect(await ctx.db.get(draftId)).toBeNull();
      expect(await ctx.db.get(versionId)).toBeNull();
    });
  });

  test("does not touch a different document's draft or version history", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedA = await ctx.db.insert("posts", {
        title: "Doc A",
        slug: "cascade-c",
        vex_status: "published",
      });
      const publishedB = await ctx.db.insert("posts", {
        title: "Doc B",
        slug: "cascade-d",
        vex_status: "published",
      });
      const draftB = await ctx.db.insert("posts", {
        title: "Doc B (edited)",
        slug: "cascade-d",
        vex_status: "draft",
        vex_publishedId: publishedB,
      });
      const versionB = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: publishedB,
        version: 1,
        status: "published",
      });

      await remove({ ctx, ids: [publishedA], collection: "posts", config: versionedFixtureConfig });

      expect(await ctx.db.get(publishedA)).toBeNull();
      expect(await ctx.db.get(publishedB)).not.toBeNull();
      expect(await ctx.db.get(draftB)).not.toBeNull();
      expect(await ctx.db.get(versionB)).not.toBeNull();
    });
  });

  test("a non-versioned collection's delete is unaffected by the cascade guard", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Plain", slug: "no-versions" });
      await remove({ ctx, ids: [id], collection: "posts", config: fixtureConfig });
      expect(await ctx.db.get(id)).toBeNull();
    });
  });
});
```

#### `packages/react/src/components/views/collapseVersionedPairs.ts`
```ts
import type { TDocument } from "@vexcms/core";

/**
 * Collapses published/draft row pairs into one row per logical document, for
 * admin list views on versioned collections (design-review.md §3.3).
 *
 * A versioned collection's `find` query, called with `drafts: true`, can
 * return up to two rows per logical document — the published row and, when
 * an edit is in progress, its draft row. Rendering both would show every
 * in-progress document twice; this reduces each pair to the row an editor
 * cares about. Admin-only — the public read path filters to published rows
 * and never sees pairs (§3.1).
 *
 * @typeParam TData - The document shape; preserved on the returned rows.
 * @param props - Input props.
 * @param props.documents - Raw `find` results for ONE versioned collection,
 *   fetched with `drafts: true` so both rows of an in-progress pair are present.
 * @returns One row per logical document — the draft's fields when a draft
 *   exists, otherwise the published row's — each carrying `hasUnpublishedChanges`.
 * @throws {Error} Always, until implemented.
 */
export function collapseVersionedPairs<TData extends TDocument = TDocument>(props: {
  documents: TData[];
}): (TData & { hasUnpublishedChanges: boolean })[] {
  // TODO: implement
  // 1. Group `props.documents` by logical-document identity, preserving
  //    first-seen order (a `Map` iterates in insertion order):
  //    a. A row's identity key is `String(doc.vex_publishedId ?? doc._id)` — a
  //       draft's key is its published parent's `_id`; a published row (or a
  //       never-published draft, `vex_publishedId` undefined) keys off its own `_id`.
  //    b. Bucket each row into `{ published?: TData; draft?: TData }` by
  //       `doc.vex_status`, keyed by (a).
  // 2. For each group, in insertion order, produce one row:
  //    a. `{ ...(group.draft ?? group.published)! }` — the draft's fields win
  //       entirely when one exists (§3.3: "preferring the draft").
  //    b. `hasUnpublishedChanges: group.draft !== undefined && group.published !== undefined`
  //       → `true` only for a genuine pair; a standalone published row or a
  //       never-published draft both report `false`.
  //    → returns `TData & { hasUnpublishedChanges: boolean }`.
  // Edge cases:
  // - A never-published draft (`vex_publishedId` undefined) groups under its
  //   own `_id` and never pairs with anything: `hasUnpublishedChanges: false`.
  // - Calling this with documents from more than one collection is out of
  //   contract — the identity key assumes every row shares one `_id` space.
  throw new Error("Not implemented");
}
```

#### `packages/react/src/components/views/collapseVersionedPairs.test.ts`
```ts
import { describe, expect, test } from "vitest";
import type { TDocument } from "@vexcms/core";
import { collapseVersionedPairs } from "./collapseVersionedPairs";

function doc(overrides: Partial<TDocument> & { _id: string }): TDocument {
  return { _creationTime: 0, ...overrides } as TDocument;
}

describe("collapseVersionedPairs", () => {
  test("prefers the draft's fields and flags an unpublished-changes pair", () => {
    const published = doc({ _id: "pub1", vex_status: "published", title: "Old title" });
    const draft = doc({
      _id: "draft1",
      vex_status: "draft",
      vex_publishedId: "pub1",
      title: "New title",
    });

    expect(collapseVersionedPairs({ documents: [published, draft] })).toEqual([
      { ...draft, hasUnpublishedChanges: true },
    ]);
  });

  test("keeps a standalone published row unflagged", () => {
    const published = doc({ _id: "pub1", vex_status: "published", title: "Only version" });

    expect(collapseVersionedPairs({ documents: [published] })).toEqual([
      { ...published, hasUnpublishedChanges: false },
    ]);
  });

  test("keeps a never-published draft unflagged", () => {
    const draft = doc({ _id: "draft1", vex_status: "draft", title: "Unpublished new page" });

    expect(collapseVersionedPairs({ documents: [draft] })).toEqual([
      { ...draft, hasUnpublishedChanges: false },
    ]);
  });

  test("collapses multiple independent documents without cross-contamination", () => {
    const pubA = doc({ _id: "a-pub", vex_status: "published", title: "A published" });
    const draftA = doc({
      _id: "a-draft",
      vex_status: "draft",
      vex_publishedId: "a-pub",
      title: "A edited",
    });
    const pubB = doc({ _id: "b-pub", vex_status: "published", title: "B published" });
    const soloDraft = doc({ _id: "c-draft", vex_status: "draft", title: "C never published" });

    const result = collapseVersionedPairs({ documents: [pubA, draftA, pubB, soloDraft] });

    expect(result).toEqual([
      { ...draftA, hasUnpublishedChanges: true },
      { ...pubB, hasUnpublishedChanges: false },
      { ...soloDraft, hasUnpublishedChanges: false },
    ]);
  });
});
```

#### `packages/react/src/components/views/CollectionListView.tsx`
```tsx
"use client";

import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  PERMISSION_SCOPES,
  vexConvexApi,
  type CollectionConfig,
  type CollectionListViewProps,
  type CollectionSlug,
  type TDocument,
} from "@vexcms/core";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { VexLink } from "../ui/VexLink";
import { MODALS } from "../modals/constants";
import { CreateDocumentModal } from "../modals";
import { useVexConfig } from "../../context/VexConfigContext";
import { getCollectionColumnDefs } from "../fields";
import { usePaginatedQuery, usePermission } from "../../hooks";
import { useMemo } from "react";
import { DataTable } from "../ui";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { collapseVersionedPairs } from "./collapseVersionedPairs";

/**
 * Builds the synthetic "Status" column shown on a versioned collection's list
 * view: an "Unpublished changes" badge when the collapsed row came from a
 * published/draft pair (`collapseVersionedPairs`'s `hasUnpublishedChanges`).
 *
 * Not derived by `getCollectionColumnDefs` — `hasUnpublishedChanges` is a
 * synthetic flag, never a real collection field.
 *
 * @returns A `ColumnDef` reading the `hasUnpublishedChanges` flag off each row.
 */
function buildUnpublishedChangesColumn<
  TData extends TDocument & { hasUnpublishedChanges: boolean },
>(): ColumnDef<TData, boolean> {
  return {
    id: "_unpublishedChanges",
    header: "Status",
    accessorFn: (row) => row.hasUnpublishedChanges,
    cell: ({ row }) =>
      row.original.hasUnpublishedChanges ? (
        <Badge variant="secondary">Unpublished changes</Badge>
      ) : null,
  };
}

/**
 * Collection list view component.
 *
 * Renders a data table of all documents in a collection. Fetches live data
 * internally via `vexConvexApi.list` (TanStack Query + Convex subscription).
 * `initialData` from `VexAdminPage`'s server-side `fetchQuery` ensures the
 * list renders immediately on first load with no loading flash.
 *
 * On a versioned collection, requests both rows of an in-progress pair
 * (`drafts: true`, gated on `readDrafts`) and collapses each pair to one row
 * via `collapseVersionedPairs` — the draft's fields, with an
 * "Unpublished changes" indicator (design-review.md §3.3). The public read
 * path is unaffected: it never requests drafts and never sees pairs.
 *
 * This component renders the *content area only* — wrap it in `AdminLayout`.
 *
 * @param props - View props
 * @param props.collection - The collection configuration to list
 * @param props.initialData - Pre-fetched documents from the server (for SSR)
 * @returns The collection data table — header row with document count and "New" button, then a bordered table of all documents.
 *
 * @example
 * ```tsx
 * <CollectionListView collection={postsCollection} initialData={serverDocs} />
 * ```
 */
export function CollectionListView<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TSlug extends CollectionSlug = CollectionSlug,
>(props: CollectionListViewProps<TFieldMeta, TCollectionMeta, TSlug>) {
  const liveConfig = useVexConfig();
  // Prefer the live context collection (updated via Fast Refresh) over the
  // RSC-serialized prop, falling back to the prop if context isn't available.
  const collection =
    (liveConfig?.collections.find(
      (c) => c.slug === props.collection.slug,
    ) as CollectionConfig<TSlug>) ?? props.collection;

  const isVersioned = collection.versions?.drafts === true;
  const canReadDrafts = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.readDrafts,
  });

  const numItems = Math.max(
    props.collection.admin.table.serverPageSize,
    props.collection.admin.table.defaultPageSize,
  );
  const pagination = usePaginatedQuery({
    query: {
      collection: props.collection.slug,
      depth: 1,
      drafts: isVersioned && canReadDrafts ? true : undefined,
      paginationOpts: {
        numItems,
        totalDocs: true,
        cursor: null,
      },
    },
    initialData: props.initialData,
    clientPageSize: props.collection.admin.table.defaultPageSize,
  });

  const rows = useMemo(
    () =>
      isVersioned
        ? collapseVersionedPairs({ documents: pagination.results })
        : pagination.results,
    [pagination.results, isVersioned],
  );

  const columns = useMemo(() => {
    const fieldColumns = getCollectionColumnDefs({ collection });
    return isVersioned ? [buildUnpublishedChangesColumn(), ...fieldColumns] : fieldColumns;
  }, [collection, isVersioned]);

  const removeMutation = useMutation({ mutationFn: useConvexMutation(vexConvexApi.remove) });

  async function handleBulkDelete(selectedIds: string[]) {
    await removeMutation.mutateAsync({ ids: selectedIds, collection: collection.slug });
  }

  const canCreate = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.create });
  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });
  return (
    <div className="relative">
      <CreateDocumentModal collection={collection} />
      <div className="mb-6 flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm" suppressHydrationWarning>
            {pagination.isPending
              ? "Loading…"
              : `${rows.length} document${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>
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

      <DataTable
        data={rows}
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

#### `packages/react/src/components/views/CollectionListView.test.tsx`
```tsx
import { render } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { CollectionListView } from "./CollectionListView";

const mockUsePaginatedQuery = vi.fn();
const mockUsePermission = vi.fn();

vi.mock("../../hooks", () => ({
  usePaginatedQuery: (args: unknown) => mockUsePaginatedQuery(args),
  usePermission: (args: unknown) => mockUsePermission(args),
}));

vi.mock("../../context/VexConfigContext", () => ({
  useVexConfig: () => undefined,
}));

vi.mock("../fields", () => ({
  getCollectionColumnDefs: () => [],
}));

vi.mock("../modals", () => ({
  CreateDocumentModal: () => null,
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@convex-dev/react-query", () => ({
  useConvexMutation: (fn: unknown) => fn,
}));

function makeCollection(overrides: Record<string, unknown> = {}) {
  return {
    slug: "pages",
    labels: { singular: "Page", plural: "Pages" },
    admin: { useAsTitle: "title", table: { serverPageSize: 25, defaultPageSize: 25 } },
    fields: {},
    ...overrides,
  } as never;
}

describe("CollectionListView — versioned list requests", () => {
  beforeEach(() => {
    mockUsePaginatedQuery.mockReset();
    mockUsePermission.mockReset();
    mockUsePaginatedQuery.mockReturnValue({
      results: [],
      isPending: false,
      isDone: true,
      loadMore: vi.fn(),
      totalDocs: 0,
    });
  });

  test("requests drafts for a versioned collection when the caller can read drafts", () => {
    mockUsePermission.mockReturnValue(true);
    const collection = makeCollection({ versions: { drafts: true } });

    render(<CollectionListView collection={collection} initialData={[]} />);

    expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ drafts: true }) }),
    );
  });

  test("does not request drafts without readDrafts", () => {
    mockUsePermission.mockReturnValue(false);
    const collection = makeCollection({ versions: { drafts: true } });

    render(<CollectionListView collection={collection} initialData={[]} />);

    expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ drafts: undefined }) }),
    );
  });

  test("a non-versioned collection renders unaffected by the collapsing guard", () => {
    mockUsePermission.mockReturnValue(true);
    const collection = makeCollection();

    expect(() =>
      render(<CollectionListView collection={collection} initialData={[]} />),
    ).not.toThrow();
    expect(mockUsePaginatedQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ drafts: undefined }) }),
    );
  });

  test("a versioned collection's list throws until collapseVersionedPairs is implemented", () => {
    mockUsePermission.mockReturnValue(true);
    mockUsePaginatedQuery.mockReturnValue({
      results: [{ _id: "pub1", _creationTime: 0, vex_status: "published", title: "A" }],
      isPending: false,
      isDone: true,
      loadMore: vi.fn(),
      totalDocs: 1,
    });
    const collection = makeCollection({ versions: { drafts: true } });

    expect(() => render(<CollectionListView collection={collection} initialData={[]} />)).toThrow(
      "Not implemented",
    );
  });
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

### Step 12 — `StatusBadge` + draft toolbar `[dev]`

- [ ] `packages/react/src/components/views/StatusBadge.tsx`
- [ ] `packages/react/src/components/views/CollectionEditView.tsx`
- [ ] `packages/react/src/components/views/StatusBadge.test.tsx`

#### `packages/react/src/components/views/StatusBadge.tsx`
```tsx
"use client";

import { Badge } from "../ui";

/** Props for `StatusBadge`. */
export interface StatusBadgeProps {
  /** The document's `vex_status` field value. */
  status: "draft" | "published";
}

/**
 * Renders a small badge indicating a versioned document's publish status.
 *
 * Used in {@link CollectionListView}'s status column and
 * {@link CollectionEditView}'s draft toolbar, wherever a versioned document's
 * `vex_status` needs a compact visual cue.
 *
 * @param props - Component props.
 * @param props.status - The document's `vex_status` — `"published"` or `"draft"`.
 * @returns A green "Published" badge, or a neutral "Draft" badge otherwise.
 * @example
 * ```tsx
 * <StatusBadge status={currentDocument.vex_status} />
 * ```
 */
export function StatusBadge(props: StatusBadgeProps) {
  // TODO: implement
  // 1. `props.status === "published"` → render `Badge` reading "Published".
  //    a. The shared `Badge` (`../ui/badge`) has no built-in "success" variant
  //       — apply the green tint via `className` (e.g. `bg-green-600
  //       text-white hover:bg-green-600`), not a new variant.
  // 2. Otherwise (`"draft"`) → render `<Badge variant="secondary">Draft</Badge>`.
  // Edge cases: none — `vex_status` is a two-value enum; every versioned
  // document has one.
  throw new Error("Not implemented");
}
```

#### `packages/react/src/components/views/CollectionEditView.tsx`
```tsx
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { CRUD_ACTIONS, DRAFT_ACTIONS, vexConvexApi } from "@vexcms/core";
import type { CollectionEditViewProps, CollectionSlug } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import { useCollectionForm } from "../../hooks/useCollectionForm";
import { usePermission } from "../../hooks";
import { StatusBadge } from "./StatusBadge";

/**
 * Collection document edit form.
 *
 * Fetches the document when editing via `vexConvexApi.get` (TanStack Query +
 * Convex subscription), initialises a `useCollectionForm` instance with the
 * current field values, and renders an `<AppForm>` with one input component per
 * field. Submits via `vexConvexApi.update`. Field inputs connect to the form
 * through `AppFormContext` — no controller prop needed.
 *
 * On a versioned collection (`collection.versions?.drafts`), the header
 * swaps the plain Save/Cancel pair for a draft toolbar: a `StatusBadge` plus
 * Save Draft / Publish / Unpublish, each gated by its own `usePermission`
 * action (`saveDraft` / `publish` / `unpublish` — never a shared `update`).
 * Publish is only reachable while viewing a draft row; Unpublish is disabled
 * while viewing one, matching the server-side rejection in Step 7.
 *
 * `TSlug` is inferred from the `collection` prop. After running `vex generate`,
 * passing a collection of one slug where another is expected is a type error.
 *
 * @param props - View props
 * @param props.collection - The collection whose fields are rendered.
 * @param props.documentId - Convex document ID to fetch and edit. Omit for new-document mode.
 * @param props.initialData - Server-prefetched document for SSR hydration. `null` means not found.
 * @returns The edit form, or a not-found message when the document cannot be loaded.
 *
 * @example
 * ```tsx
 * // New document
 * <CollectionEditView collection={postsCollection} />
 *
 * // Editing existing document
 * <CollectionEditView
 *   collection={postsCollection}
 *   documentId="k573abc..."
 *   initialData={serverDoc}
 * />
 * ```
 */
export function CollectionEditView<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TSlug extends CollectionSlug = CollectionSlug,
>(props: CollectionEditViewProps<TFieldMeta, TCollectionMeta, TSlug>) {
  // This view is generic over `TSlug` — the collection is only known at
  // runtime, so it queries the generic endpoint (`VexDocument`) directly. The
  // per-slug `get()` wrapper from `@vexcms/core/client` narrows only when the
  // slug is a literal at the call site, which is not the case here.
  const { data: currentDocument } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.documentId as string,
      collection: props.collection.slug,
    }),
    initialData: props.initialData,
  });

  if (!currentDocument) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.update),
  });
  const form = useCollectionForm({
    document: currentDocument,
    collection: props.collection,
    onSubmit: async ({ value }: { value: any }) => {
      await mutateAsync({
        id: currentDocument._id,
        collection: props.collection.slug,
        data: value,
      });
      form.reset();
    },
  });

  const canEdit = usePermission({ resource: props.collection.slug, action: CRUD_ACTIONS.update });

  const isVersioned = props.collection.versions?.drafts === true;
  const isDraftDoc = currentDocument.vex_status === "draft";
  const canSaveDraft = usePermission({
    resource: props.collection.slug,
    action: DRAFT_ACTIONS.saveDraft,
  });
  const canPublish = usePermission({
    resource: props.collection.slug,
    action: DRAFT_ACTIONS.publish,
  });
  const canUnpublish = usePermission({
    resource: props.collection.slug,
    action: DRAFT_ACTIONS.unpublish,
  });

  const { mutateAsync: saveDraft, isPending: isSavingDraft } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });
  const { mutateAsync: publish, isPending: isPublishing } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.publish),
  });
  const { mutateAsync: unpublish, isPending: isUnpublishing } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.unpublish),
  });

  /**
   * Persists the form's current values as a draft, without publishing them.
   *
   * @param value - The form's current field values.
   * @returns Promise resolving once the draft row is saved.
   * @throws {Error} Always, until implemented.
   */
  async function handleSaveDraft(value: Record<string, unknown>): Promise<void> {
    // TODO: implement
    // 1. `await saveDraft({ collection: props.collection.slug, documentId: currentDocument._id, data: value })`.
    //    → Step 5's server patches the existing draft row or inserts one; the
    //      response is the draft row's id, which may differ from
    //      `currentDocument._id` on the FIRST save of a published document.
    // 2. Do not call `form.reset()` — unlike `handleSubmit`, saving a draft
    //    keeps the edited values live in the form; only the "unsaved changes"
    //    baseline (`isDefaultValue`) should move, by re-seeding `defaultValues`
    //    once the `get` query for the (possibly new) draft id lands.
    // Edge cases: `!canSaveDraft` already disables the calling button — this
    // function is unreachable without the permission, matching the server gate.
    throw new Error("Not implemented");
  }

  /**
   * Publishes the currently open draft, promoting its fields onto the
   * published row.
   *
   * @returns Promise resolving once publish completes.
   * @throws {Error} Always, until implemented.
   */
  async function handlePublish(): Promise<void> {
    // TODO: implement
    // 1. `await publish({ collection: props.collection.slug, documentId: currentDocument._id })`.
    //    → Step 6's server: a never-published draft promotes in place; a draft
    //      with a published parent copies fields onto the parent and deletes
    //      the draft row — either way the published row's `_id` never changes
    //      (design §2.2).
    // 2. Re-point the `get` query at whatever id `publish` reports as the
    //    published row (the parent id on the second path, unchanged on the
    //    first) so `currentDocument.vex_status` flips to `"published"` and the
    //    Publish/Unpublish disabled state recomputes.
    // Edge cases: `!isDraftDoc` already disables the calling button — publish
    // is only reachable while viewing a draft row.
    throw new Error("Not implemented");
  }

  /**
   * Unpublishes the currently open published document, flipping it back to draft.
   *
   * @returns Promise resolving once unpublish completes.
   * @throws {Error} Always, until implemented.
   */
  async function handleUnpublish(): Promise<void> {
    // TODO: implement
    // 1. `await unpublish({ collection: props.collection.slug, documentId: currentDocument._id })`.
    //    → Step 7's server rejects while a draft row exists; the `isDraftDoc`
    //      disabled guard below already prevents that call from this view, but
    //      a draft created in another tab between render and click still
    //      surfaces as a rejected mutation — surface it (e.g. a toast), never
    //      treat it as a bug, since the server stays the source of truth (P-004).
    // 2. On success, `currentDocument.vex_status` becomes `"draft"` once the
    //    `get` query refetches — Unpublish disables, Publish/Save Draft enable.
    // Edge cases: none beyond 1 — `isDraftDoc` already covers the documented
    // rejection case client-side.
    throw new Error("Not implemented");
  }

  return (
    <AppForm form={form} className="relative">
      <div className="bg-background sticky top-12 z-10 flex h-16 items-center justify-between">
        <h1 className="text-2xl font-bold">
          Edit {props.collection.labels.singular} -{" "}
          <span className="text-primary">
            {String(currentDocument[props.collection.admin.useAsTitle] ?? "")}
          </span>
        </h1>
        {isVersioned ? (
          <form.Subscribe
            selector={(state) => state.values}
            children={(values) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={isDraftDoc ? "draft" : "published"} />
                <Button
                  type="button"
                  variant="outline"
                  isPending={isSavingDraft}
                  disabled={!canSaveDraft}
                  onClick={() => handleSaveDraft(values)}
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  isPending={isPublishing}
                  disabled={!canPublish || !isDraftDoc}
                  onClick={handlePublish}
                >
                  Publish
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  isPending={isUnpublishing}
                  disabled={!canUnpublish || isDraftDoc}
                  onClick={handleUnpublish}
                >
                  Unpublish
                </Button>
              </div>
            )}
          />
        ) : (
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
        )}
      </div>
      <div className="space-y-4">
        {Object.entries(props.collection.fields).map(([fieldKey, field]) => {
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
              readOnly={field.admin.readOnly}
              collection={props.collection}
            />
          );
        })}
      </div>
    </AppForm>
  );
}
```

#### `packages/react/src/components/views/StatusBadge.test.tsx`
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  test("renders a green Published badge for a published document", () => {
    render(<StatusBadge status="published" />);

    const badge = screen.getByText("Published");
    expect(badge).not.toBeNull();
    expect(badge.className).toContain("bg-green-600");
  });

  test("renders a neutral Draft badge for a draft document", () => {
    render(<StatusBadge status="draft" />);

    expect(screen.queryByText("Draft")).not.toBeNull();
    expect(screen.queryByText("Published")).toBeNull();
  });
});
```

Verify: `pnpm --filter @vexcms/react test && pnpm --filter www build`

### Step 13 — `VersionHistoryDropdown` `[dev]`

- [ ] `packages/react/src/components/views/VersionHistoryDropdown.tsx`
- [ ] `packages/react/src/components/views/VersionHistoryDropdown.test.tsx`

Rendering, permission-gating, and the version-list query are real code (independently
testable now); only the two mutating actions — restore and delete — stay guided stubs,
since they are the pieces Step 8's server contract and Decision 16's client-only-restore
rule actually constrain.

#### `packages/react/src/components/views/VersionHistoryDropdown.tsx`
```tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { DRAFT_ACTIONS, vexConvexApi, type CollectionSlug } from "@vexcms/core";
import { History, RotateCcw, Trash2, Check } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui";
import { useAppForm } from "../form/AppFormContext";
import { usePermission } from "../../hooks";
import { StatusBadge } from "./StatusBadge";

/** One `vex_versions` row as returned by `vexConvexApi.versions.listVersions`. */
interface VersionHistoryEntry {
  _id: string;
  version: number;
  status: "draft" | "published";
  createdBy: string | null;
  publishedAt?: number;
  _creationTime: number;
}

/** Props for `VersionHistoryDropdown`. */
export interface VersionHistoryDropdownProps {
  /** Collection slug the document belongs to. */
  collection: CollectionSlug;
  /**
   * ID of the document currently open in the editor — its draft row when one
   * exists, otherwise its published row. History is keyed off this id.
   */
  documentId: string;
}

/**
 * Version history menu for a versioned document's edit view: lists every
 * `vex_versions` snapshot, restores or deletes one, and highlights the
 * current version (design-review.md §4, §10 "Carry Over from master").
 *
 * Must render inside `<AppForm>` (the edit view's draft toolbar) — restore
 * hydrates the open form via `useAppForm()` before saving, per Decision 16
 * (client-side restore, no server-side restore mutation).
 *
 * @param props - Component props.
 * @param props.collection - The collection slug the document belongs to.
 * @param props.documentId - The currently open document's ID.
 * @returns `null` without `readDrafts`; otherwise a dropdown trigger, its
 *   menu, and the delete-confirmation dialog.
 * @example
 * ```tsx
 * <VersionHistoryDropdown collection={collection.slug} documentId={currentDocument._id} />
 * ```
 */
export function VersionHistoryDropdown(props: VersionHistoryDropdownProps) {
  const canReadDrafts = usePermission({
    resource: props.collection,
    action: DRAFT_ACTIONS.readDrafts,
  });
  const canDeleteVersions = usePermission({
    resource: props.collection,
    action: DRAFT_ACTIONS.deleteVersions,
  });

  const { data: versions = [] } = useQuery({
    ...convexQuery(vexConvexApi.versions.listVersions, {
      collection: props.collection,
      documentId: props.documentId,
    }),
  }) as { data: VersionHistoryEntry[] | undefined };

  const form = useAppForm();
  const queryClient = useQueryClient();
  const { mutateAsync: saveDraft } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });
  const { mutateAsync: deleteVersion, isPending: isDeleting } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.deleteVersion),
  });

  const [versionPendingDelete, setVersionPendingDelete] = useState<number | null>(null);
  const currentVersion = versions[0]?.version;

  /**
   * Restores an older version into the open form and saves it as a new draft.
   *
   * Client-side per Decision 16: reads the immutable snapshot, hydrates the
   * live form, then calls `saveDraft({ restoredFrom })` — non-destructive,
   * since the restored-from version itself is never touched, and reversible,
   * since the result is just another draft save.
   *
   * @param version - The version number to restore. A no-op when it is
   *   already the current version.
   * @returns Promise resolving once the restored content is saved as a draft.
   * @throws {Error} Always, until implemented.
   */
  async function handleRestore(version: number): Promise<void> {
    if (version === currentVersion) return;
    // TODO: implement
    // 1. `const snapshot = await queryClient.fetchQuery(convexQuery(vexConvexApi.versions.getVersionSnapshot, { collection: props.collection, documentId: props.documentId, version }))`.
    //    → the immutable, extracted-user-fields snapshot for that version.
    // 2. Hydrate the live form: for each `[key, value]` in the snapshot,
    //    `form.setFieldValue(key, value)` — never `form.reset()`, which would
    //    replace `defaultValues` and re-arm the dirty-check against the wrong
    //    baseline.
    // 3. `await saveDraft({ collection: props.collection, documentId: props.documentId, data: snapshot, restoredFrom: version })`.
    //    → persists the restored content as a new draft version; the version
    //      being restored FROM is left untouched (§4 lineage: the new row's
    //      `restoredFrom` points back at it).
    throw new Error("Not implemented");
  }

  /**
   * Permanently deletes the version pending confirmation
   * (`versionPendingDelete`), then closes the confirmation dialog.
   *
   * @returns Promise resolving once the version row is deleted.
   * @throws {Error} Always, until implemented.
   */
  async function handleDelete(): Promise<void> {
    if (versionPendingDelete === null) return;
    // TODO: implement
    // 1. `await deleteVersion({ collection: props.collection, documentId: props.documentId, version: versionPendingDelete })`.
    //    → Step 8's server gates this on `deleteVersions`; the button below is
    //      already hidden without it, so this call path is unreachable but the
    //      server remains the source of truth.
    // 2. `finally`-clear `setVersionPendingDelete(null)` so the dialog closes
    //    whether the mutation resolves or rejects.
    throw new Error("Not implemented");
  }

  if (!canReadDrafts) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <History className="mr-1 h-4 w-4" />
          History
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-y-auto">
          {versions.length === 0 && (
            <div className="text-muted-foreground px-2 py-4 text-center text-sm">
              No versions yet
            </div>
          )}
          {versions.map((entry) => {
            const isCurrent = entry.version === currentVersion;
            return (
              <DropdownMenuItem
                key={entry._id}
                className="flex items-center justify-between gap-2"
                disabled={isCurrent}
                onClick={() => handleRestore(entry.version)}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">v{entry.version}</span>
                    <StatusBadge status={entry.status} />
                    {isCurrent && (
                      <span className="text-muted-foreground text-xs">(current)</span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {entry.createdBy ?? "Unknown"} ·{" "}
                    {new Date(entry._creationTime).toLocaleString()}
                    {entry.publishedAt &&
                      ` · published ${new Date(entry.publishedAt).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canDeleteVersions && (
                    <button
                      type="button"
                      aria-label={`Delete v${entry.version}`}
                      className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVersionPendingDelete(entry.version);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isCurrent ? (
                    <Check className="text-primary h-3.5 w-3.5" />
                  ) : (
                    <RotateCcw className="text-muted-foreground h-3.5 w-3.5" />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={versionPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setVersionPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete version</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete v{versionPendingDelete}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVersionPendingDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### `packages/react/src/components/views/VersionHistoryDropdown.test.tsx`
```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { VersionHistoryDropdown } from "./VersionHistoryDropdown";

const mockUsePermission = vi.fn();
vi.mock("../../hooks", () => ({
  usePermission: (args: { action: string }) => mockUsePermission(args),
}));

const mockUseQuery = vi.fn();
const mockMutateAsync = vi.fn();
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
  useMutation: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useQueryClient: () => ({ fetchQuery: vi.fn() }),
}));

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (fn: unknown, args: unknown) => ({ queryKey: [fn, args] }),
  useConvexMutation: (fn: unknown) => fn,
}));

vi.mock("../form/AppFormContext", () => ({
  useAppForm: () => ({ setFieldValue: vi.fn() }),
}));

vi.mock("./StatusBadge", () => ({
  StatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}));

function makeVersion(overrides: Record<string, unknown>) {
  return { version: 1, status: "published", createdBy: "user_1", _creationTime: 0, ...overrides };
}

describe("VersionHistoryDropdown", () => {
  beforeEach(() => {
    mockUsePermission.mockReset();
    mockUseQuery.mockReset();
    mockMutateAsync.mockReset();
  });

  test("renders nothing without readDrafts", () => {
    mockUsePermission.mockImplementation(({ action }) => action !== "readDrafts");
    mockUseQuery.mockReturnValue({ data: [] });

    const { container } = render(<VersionHistoryDropdown collection="posts" documentId="doc1" />);

    expect(container.firstChild).toBeNull();
  });

  test("lists versions newest-first with the current one distinguishable", () => {
    mockUsePermission.mockReturnValue(true);
    mockUseQuery.mockReturnValue({
      data: [makeVersion({ version: 2, status: "draft" }), makeVersion({ version: 1 })],
    });

    render(<VersionHistoryDropdown collection="posts" documentId="doc1" />);
    fireEvent.click(screen.getByRole("button", { name: /history/i }));

    expect(screen.queryByText("v2")).not.toBeNull();
    expect(screen.queryByText("v1")).not.toBeNull();
    expect(screen.queryByText("(current)")).not.toBeNull();
  });

  test("hides the delete action without deleteVersions", () => {
    mockUsePermission.mockImplementation(({ action }) => action !== "deleteVersions");
    mockUseQuery.mockReturnValue({ data: [makeVersion({ version: 1 })] });

    render(<VersionHistoryDropdown collection="posts" documentId="doc1" />);
    fireEvent.click(screen.getByRole("button", { name: /history/i }));

    expect(screen.queryByRole("button", { name: /delete v1/i })).toBeNull();
  });

  test("confirms before deleting a version, without calling the mutation directly", () => {
    mockUsePermission.mockReturnValue(true);
    mockUseQuery.mockReturnValue({ data: [makeVersion({ version: 1 })] });

    render(<VersionHistoryDropdown collection="posts" documentId="doc1" />);
    fireEvent.click(screen.getByRole("button", { name: /history/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete v1/i }));

    expect(screen.queryByText(/permanently delete/i)).not.toBeNull();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  test("shows an empty state with no version history", () => {
    mockUsePermission.mockReturnValue(true);
    mockUseQuery.mockReturnValue({ data: [] });

    render(<VersionHistoryDropdown collection="posts" documentId="doc1" />);
    fireEvent.click(screen.getByRole("button", { name: /history/i }));

    expect(screen.queryByText("No versions yet")).not.toBeNull();
  });
});
```

Verify: `pnpm --filter @vexcms/react test`
### Step 14 — Autosave `[dev]`

Why: Needs the toolbar and `saveDraft` in place.
- [ ] `packages/react/src/hooks/useAutosave.ts`
- [ ] `packages/react/src/hooks/useAutosave.test.tsx`

#### `packages/react/src/hooks/useAutosave.ts`
```ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useDebounceValue } from "@ts-hooks-kit/core";
import { DEFAULT_AUTOSAVE_DEBOUNCE_MS } from "@vexcms/core";

/**
 * Props for `useAutosave`.
 *
 * @typeParam TValues - Shape of the watched form values. Must be JSON-safe —
 *   change detection compares snapshots structurally.
 */
export interface UseAutosaveProps<TValues extends Record<string, unknown>> {
  /** Current form values to watch. Pass the live form state on every render. */
  values: TValues;
  /**
   * Called after the debounce settles on a value that differs from the last
   * saved snapshot. Should patch the draft row exactly like an explicit
   * `saveDraft` call (e.g. `saveDraftMutation.mutateAsync({ collection, id, data: values })`)
   * — there is no separate "autosave" mutation or flag. Resolve once the
   * write completes; reject to leave the snapshot un-advanced so the next
   * settle retries.
   */
  onSave: (values: TValues) => Promise<void>;
  /**
   * Turns autosave on/off without unmounting the hook — e.g. gate on the
   * `saveDraft` permission or on `collection.versions.autosave`. A pending
   * change while disabled is not dropped: it fires once re-enabled.
   * Default `true`.
   */
  enabled?: boolean;
  /** Debounce window in ms. Default `DEFAULT_AUTOSAVE_DEBOUNCE_MS`. */
  debounceMs?: number;
}

/** Lifecycle of the most recent autosave attempt. */
export type UseAutosaveStatus = "idle" | "saving" | "saved" | "error";

/** Return value of `useAutosave`. */
export interface UseAutosaveReturn {
  /** Current autosave lifecycle state, for a status indicator in the toolbar. */
  status: UseAutosaveStatus;
  /** `Date.now()` of the last successful save, or `null` before the first one. */
  lastSavedAt: number | null;
  /** The error from the most recent failed save, or `null`. */
  error: Error | null;
}

/**
 * Debounced, change-detected autosave for a draft-enabled collection's edit
 * form.
 *
 * Fires `onSave` only when `values` differs from the last successfully saved
 * snapshot, debounced by `debounceMs`. There is no `isAutosave` flag and no
 * coalescing — because a fire only ever happens on a genuine change, two
 * identical successive snapshots are impossible, which is what made
 * `master`'s interval-based coalesce-by-upsert unnecessary here
 * (design-review.md §4, §6.2).
 *
 * @typeParam TValues - Shape of the watched form values.
 * @param props - Autosave configuration.
 * @returns `{ status, lastSavedAt, error }` for driving a save-status indicator.
 *
 * @example
 * ```tsx
 * const saveDraftMutation = useMutation({ mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft) });
 * const { status } = useAutosave({
 *   values: form.state.values,
 *   enabled: collection.versions.autosave && canSaveDraft,
 *   onSave: (values) =>
 *     saveDraftMutation.mutateAsync({ collection: collection.slug, id: documentId, data: values }),
 * });
 * ```
 */
export function useAutosave<TValues extends Record<string, unknown>>(
  props: UseAutosaveProps<TValues>,
): UseAutosaveReturn {
  // TODO: implement
  // 1. `lastSavedRef = useRef<TValues>(props.values)` — seed with the CURRENT
  //    values, not an empty object, so the initial render never counts as a
  //    change (no write on mount).
  // 2. `[debouncedValues] = useDebounceValue(props.values, props.debounceMs ??
  //    DEFAULT_AUTOSAVE_DEBOUNCE_MS)` — reactive to `props.values` changing on
  //    every render (`@ts-hooks-kit/core`'s internal `useEffect` re-arms the
  //    timer whenever the unwrapped value differs from its own previous
  //    snapshot), same pattern as the debounced search input in
  //    `fields/relationship/Input.tsx`.
  // 3. `[status, setStatus] = useState<UseAutosaveStatus>("idle")`,
  //    `[lastSavedAt, setLastSavedAt] = useState<number | null>(null)`,
  //    `[error, setError] = useState<Error | null>(null)`, plus a
  //    `savingRef = useRef(false)` in-flight guard.
  // 4. `useEffect` keyed on `debouncedValues`:
  //    a. `!props.enabled` → return. Do NOT touch `lastSavedRef` — a change
  //       that arrived while disabled must still fire once re-enabled.
  //    b. `JSON.stringify(debouncedValues) === JSON.stringify(lastSavedRef.current)`
  //       → unchanged since the last SAVE (not the last render) → return, no write.
  //    c. `savingRef.current` already `true` → a save from an earlier settle
  //       is still in flight; return — the in-flight save's own effect
  //       cleanup / re-run on the NEXT settle picks up any newer value, so
  //       nothing is lost, just delayed one debounce window.
  //    d. Otherwise: `savingRef.current = true`; `setStatus("saving")`; call
  //       `props.onSave(debouncedValues)`.
  //       → resolve: `lastSavedRef.current = debouncedValues`;
  //         `setStatus("saved")`; `setLastSavedAt(Date.now())`; `setError(null)`.
  //       → reject(err): `setStatus("error")`; `setError(err instanceof Error
  //         ? err : new Error(String(err)))`; leave `lastSavedRef` untouched so
  //         the unchanged value is retried on the next render's settle.
  //       → finally: `savingRef.current = false`.
  // 5. Return `{ status, lastSavedAt, error }`.
  // Edge cases:
  // - Typing then reverting to the exact last-SAVED value must not fire —
  //   comparing against `lastSavedRef` (not the previous debounced value) is
  //   what makes this hold.
  // - Unmount while a save is in-flight: guard the state setters (e.g. an
  //   `isMountedRef`) so no "set state on unmounted component" warning fires.
  // - `onSave` throwing synchronously must still land in the `.catch` path —
  //   wrap the call in `Promise.resolve().then(...)` or an `async` IIFE
  //   inside the effect, not a bare `.catch()` off a non-promise.
  throw new Error("Not implemented");
}
```

#### `packages/react/src/hooks/useAutosave.test.tsx`
```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_AUTOSAVE_DEBOUNCE_MS } from "@vexcms/core";
import { useAutosave } from "./useAutosave";

interface TestValues {
  title: string;
}

describe("useAutosave", () => {
  it("does not write when values are unchanged", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      (props: { values: TestValues }) => useAutosave({ values: props.values, onSave }),
      { initialProps: { values: { title: "Hello" } } },
    );

    // Re-render with a value that is deep-equal but a new object reference —
    // the same "unchanged" case a form's onChange re-render produces.
    rerender({ values: { title: "Hello" } });

    await new Promise((resolve) => setTimeout(resolve, DEFAULT_AUTOSAVE_DEBOUNCE_MS + 100));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("fires exactly one write per settled change", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      (props: { values: TestValues }) => useAutosave({ values: props.values, onSave }),
      { initialProps: { values: { title: "Hello" } } },
    );

    // Two changes within the same debounce window settle to one write with
    // the LATEST value — not two writes.
    rerender({ values: { title: "Hello, wor" } });
    rerender({ values: { title: "Hello, world" } });

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1), {
      timeout: DEFAULT_AUTOSAVE_DEBOUNCE_MS + 1000,
    });

    expect(onSave).toHaveBeenCalledWith({ title: "Hello, world" });

    // Settling again with no further change must not fire a second write.
    await new Promise((resolve) => setTimeout(resolve, DEFAULT_AUTOSAVE_DEBOUNCE_MS + 100));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
```

Verify: `pnpm --filter @vexcms/react test`

### Step 15 — `GlobalEditView` draft toolbar `[dev]`

Why: Spec 35 deferred this here explicitly (its `spec.md` D9 / Out of Scope).
- [ ] `packages/core/src/globals/types.ts` + `packages/core/src/globals/config.ts` —
      apply the Step 1 `TDrafts extends boolean` treatment to
      `GlobalConfigInput`/`GlobalConfig`/`defineGlobal`. **Required, not cosmetic:**
      `GlobalConfig.versions` is `{ drafts: boolean }` today (`globals/types.ts:180`),
      and `HasDrafts` tests `D extends true`, so `boolean extends true` is `false` and
      draft actions never appear on a global's action union. Without this the toolbar's
      `usePermission({ action: "publish" })` gate can never pass. See Design Decision 19.
- [ ] `packages/core/src/globals/config.test.ts` — a global with
      `versions: { drafts: true }` exposes `publish`/`unpublish`/`saveDraft`/`readDrafts`
      in its subject action union; one with the default does not.
- [ ] `packages/core/src/api/globals/upsert.server.ts` — honor `versions.drafts`.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — same toolbar as Step 12.
- [ ] `packages/core/src/api/globals/upsert.server.test.ts` — tests colocated (Step 12's `StatusBadge.test.tsx` covers the shared toolbar UI; no separate `GlobalEditView.test.tsx` — same precedent as `CollectionEditView.tsx`, which also ships no view-level test).

#### `packages/core/src/api/globals/upsert.server.ts`

Replace the body of `upsertGlobal` (imports, `STRIPPED_KEYS`, validation, and permission check above the DB lookup are unchanged):
```ts
/**
 * Upserts a global document in `vex_globals`. Strips system keys from `data`,
 * validates remaining user fields against the global's Zod schema, then
 * writes.
 *
 * **Non-versioned globals** (`versions.drafts: false`, the default): unchanged
 * — patches the existing `by_slug` row, or inserts one. Never writes
 * `vex_status`/`vex_publishedAt`/`vex_publishedId`.
 *
 * **Versioned globals** (`versions.drafts: true`): `upsert` is ONLY the
 * bootstrap entry point for a global that has never been saved — it inserts
 * the first row as a never-published draft (`vex_status: "draft"`,
 * `vex_publishedId: undefined`), mirroring "a never-published document is a
 * single draft row" (design-review.md §1). Once a row exists for the slug,
 * `upsert` throws: further edits go through `saveDraft` / `publish` /
 * `unpublish` (`versionsApi`, `collection: "vex_globals"`), which know how to
 * target the published row vs. the draft row — a fact a single `by_slug`
 * lookup can no longer disambiguate once two rows can share a slug.
 * `GlobalEditView` (this step) only calls `upsert` while no document exists yet.
 *
 * Throws `ConvexError` on Zod validation failure with structured `errors`
 * payload, or when called on an already-bootstrapped versioned global.
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 * @param args - `{ ctx, slug, data, globalConfig }`.
 * @returns The `_id` of the upserted document as a string.
 * @throws {ConvexError} Validation failure, or `upsert` called on a
 *   versioned global that already has a row.
 *
 * @example
 * ```ts
 * import { upsertGlobal } from "@vexcms/core/server";
 *
 * const id = await upsertGlobal({
 *   ctx,
 *   slug: "siteSettings",
 *   data: { siteName: "New Name" },
 *   globalConfig: config.globals.find((g) => g.slug === "siteSettings")!,
 * });
 * ```
 */
export async function upsertGlobal<
  DataModel extends GenericDataModel,
  TSlug extends GlobalSlug = GlobalSlug,
>(args: UpsertGlobalServerArgs<DataModel, TSlug>): Promise<string> {
  // TODO: implement (lookup + write only — permission/validation above unchanged)
  // 1. `existingGlobal = await ctx.db.query("vex_globals").withIndex("by_slug",
  //    q => q.eq("slug", slug)).first()` — safe as a plain 1-row lookup: see
  //    step 3b, which guarantees `upsert` never runs again once a versioned
  //    global has a row, so `by_slug` never needs to disambiguate two rows here.
  // 2. `!globalConfig.versions.drafts` (default) →
  //    a. `existingGlobal` found → `ctx.db.patch(existingGlobal._id, { data: result.data })`.
  //    b. not found → `ctx.db.insert("vex_globals", { slug, data: result.data })`.
  //    → return the row's `_id` as a string (unchanged from today).
  // 3. `globalConfig.versions.drafts === true`:
  //    a. `existingGlobal` found (draft OR published — both are illegal
  //       targets) → `throw new ConvexError(
  //         \`Global "${slug}" has drafts enabled — use saveDraft/publish/unpublish instead of upsert.\`)`.
  //    b. not found → bootstrap insert: `ctx.db.insert("vex_globals", {
  //       slug, data: result.data, vex_status: "draft", vex_publishedId: undefined })`
  //       → return the new row's `_id` as a string.
  // Edge cases:
  // - `globalConfig.versions` is always resolved (`defineGlobal` defaults it
  //   to `{ drafts: false }`), so `.drafts` is never `undefined`.
  // - Branch 3b must NOT set `vex_publishedAt` — nothing has published yet.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/globals/upsert.server.test.ts`

Full file after adding the two new tests:
```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import { text } from "../../fields";
import { defineGlobal } from "../../globals/config";
import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { upsertGlobal } from "./upsert.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

/** Shape of a raw `vex_globals` DB row, for storage-layer assertions. */
interface GlobalRow {
  slug: string;
  data: Record<string, unknown>;
}

/** Same, extended with the versioning fields a drafts-enabled row carries. */
interface VersionedGlobalRow extends GlobalRow {
  _id: string;
  vex_status?: "draft" | "published";
  vex_publishedId?: string;
}

const siteSettingsGlobal = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: { siteName: text({ label: "Site Name", required: true }) },
});

const draftableSettingsGlobal = defineGlobal({
  slug: "draftableSettings",
  label: "Draftable Settings",
  fields: { siteName: text({ label: "Site Name", required: true }) },
  versions: { drafts: true },
});

// upsertGlobal resolves the GlobalConfig from `config.globals` by slug and
// reads `config.access` (undefined here → RBAC off).
const fixtureConfig = {
  globals: [siteSettingsGlobal, draftableSettingsGlobal],
  access: undefined,
} as unknown as VexConfig;

describe("updateGlobal (server)", () => {
  it("inserts a new row when the global has never been saved", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "My Site" },
        config: fixtureConfig,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].data.siteName).toBe("My Site");
    expect(rows[0].slug).toBe("siteSettings"); // DB stores slug, not _slug
  });

  it("patches the existing row on subsequent saves", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "Old" },
      });
    });
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "New" },
        config: fixtureConfig,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].data.siteName).toBe("New");
  });

  it("strips system keys from flat input before writing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      // Simulate GlobalEditView sending a full flat document
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: {
          _id: "fake",
          _creationTime: 0,
          _slug: "siteSettings",
          siteName: "Clean",
        },
        config: fixtureConfig,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows[0].data._id).toBeUndefined();
    expect(rows[0].data._slug).toBeUndefined();
    expect(rows[0].data.siteName).toBe("Clean");
  });

  it("throws ConvexError on validation failure", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await upsertGlobal({
          ctx,
          slug: "siteSettings",
          data: { siteName: 999 }, // wrong type
          config: fixtureConfig,
        });
      }),
    ).rejects.toThrow();
  });

  it("bootstrap-inserts a never-published draft row for a drafts-enabled global with no existing row", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      upsertGlobal({
        ctx,
        slug: "draftableSettings",
        data: { siteName: "New" },
        config: fixtureConfig,
      }),
    );
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as VersionedGlobalRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0]._id).toBe(id);
    expect(rows[0].vex_status).toBe("draft");
    expect(rows[0].vex_publishedId).toBeUndefined();
  });

  it("throws when a drafts-enabled global already has a row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "draftableSettings",
        data: { siteName: "Live" },
        vex_status: "published",
      } as never);
    });
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        upsertGlobal({
          ctx,
          slug: "draftableSettings",
          data: { siteName: "Attempted direct write" },
          config: fixtureConfig,
        }),
      ),
    ).rejects.toThrow(/saveDraft/);
  });
});
```

#### `packages/react/src/components/views/GlobalEditView.tsx`

Full replacement:
```tsx
"use client";

import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GlobalEditViewProps, vexConvexApi, DRAFT_ACTIONS } from "@vexcms/core";
import { AppForm } from "../form";
import { useGlobalForm, usePermission } from "../../hooks";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import { StatusBadge } from "./StatusBadge";

/**
 * Singleton global document edit form.
 *
 * Non-versioned globals (`global.versions.drafts === false`, the default)
 * keep the plain Save/Cancel toolbar and submit through `vexConvexApi.globals.upsert`.
 *
 * Versioned globals (`global.versions.drafts === true`) get the same
 * Save Draft / Publish / Unpublish toolbar as `CollectionEditView` (Step 12),
 * each gated by `usePermission` on its own `DRAFT_ACTIONS` entry, submitting
 * through `vexConvexApi.versions.saveDraft` / `.publish` / `.unpublish` with
 * `collection: "vex_globals"`. The very FIRST save of a brand-new versioned
 * global still goes through `upsert` (there is no row yet to attach a draft
 * to) — see `upsertGlobal`'s bootstrap branch in this step.
 *
 * @param props - View props.
 * @param props.global - The global config being edited.
 * @param props.initialData - Server-prefetched document for SSR hydration.
 * @returns The edit form, or a not-found message when `global` is missing.
 */
export function GlobalEditView({ global, initialData }: GlobalEditViewProps) {
  // TODO: implement
  // 1. `{ data: globalDoc } = useQuery({ ...convexQuery(vexConvexApi.globals.get,
  //    { slug: global.slug }), initialData })` — unchanged. `globalDoc` may be
  //    `undefined` (never saved), a draft row, or a published row.
  // 2. `hasDrafts = global.versions.drafts`.
  // 3. Mutations:
  //    a. `upsertMutation = useMutation({ mutationFn: useConvexMutation(vexConvexApi.globals.upsert) })`.
  //    b. `saveDraftMutation`, `publishMutation`, `unpublishMutation` →
  //       `useConvexMutation(vexConvexApi.versions.saveDraft | .publish | .unpublish)`,
  //       each called with `{ collection: "vex_globals", id: globalDoc?._id, data }`
  //       (publish/unpublish omit `data`).
  // 4. Permission gates, only meaningful when `hasDrafts`:
  //    `canSaveDraft = usePermission({ resource: global.slug, action: DRAFT_ACTIONS.saveDraft })`,
  //    `canPublish = usePermission({ resource: global.slug, action: DRAFT_ACTIONS.publish })`,
  //    `canUnpublish = usePermission({ resource: global.slug, action: DRAFT_ACTIONS.unpublish })`.
  // 5. `form = useGlobalForm({ document: globalDoc, global, onSubmit: async ({ value }) => {
  //    if (!hasDrafts || !globalDoc) → upsertMutation.mutateAsync({ slug: global.slug, data: value });
  //    else → saveDraftMutation.mutateAsync({ collection: "vex_globals", id: globalDoc._id, data: value });
  //    form.reset(); } })`.
  // 6. `if (!global) return <p>Global document not found.</p>;` — unchanged.
  // 7. Render, mirroring `CollectionEditView`'s post-Step-12 header row:
  //    a. `!hasDrafts` → today's Save/Cancel button pair (unchanged JSX).
  //    b. `hasDrafts && globalDoc` → `<StatusBadge status={globalDoc.vex_status} />`
  //       beside the `<h1>`, then Save Draft (gated `canSaveDraft`) / Publish
  //       (gated `canPublish`) / Unpublish (gated `canUnpublish`, additionally
  //       disabled while an outstanding draft exists for this global — same
  //       rule as `CollectionEditView`'s Unpublish button).
  //    c. `hasDrafts && !globalDoc` (brand-new, never saved) → only
  //       "Save Draft" is meaningful; Publish/Unpublish are hidden, not just
  //       disabled — nothing exists yet to publish or unpublish.
  // 8. Field list rendering (the `Object.entries(global.fields).map(...)` block)
  //    is unchanged.
  // Edge cases:
  // - `canSaveDraft` denied → the whole toolbar collapses to read-only,
  //   matching `CollectionEditView`.
  // - `globalDoc` transitions from `undefined` to a real row mid-session
  //   (another admin bootstraps it first) — `useGlobalForm`'s `document` prop
  //   already re-syncs defaults on that change; no extra handling needed here.
  throw new Error("Not implemented");
}
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

### Step 16 — Toggle backfill + CLI cleanup `[dev]`

Why: Independent of the feature path; safe to land last.
- [ ] `packages/core/src/api/versions/backfillStatus.server.ts` — new file.
- [ ] `packages/core/src/api/server.ts` — export `backfillStatus` (mirrors the existing `upsertGlobal` re-export; not registered through `versionsApi` — it is not a `DRAFT_ACTIONS` entry, see Step 9).
- [ ] `packages/cli/src/lib/migrate.ts` — delete the `backfillVersionStatus` path.
- [ ] `packages/cli/src/lib/generateSchema.ts` — delete the dead `hasVersioning` branch and its now-unused import.
- [ ] `packages/cli/src/commands/dev.ts` — delete its `hasVersioning`/`backfillVersionStatus` call site too (same dead path, same caller family — left out of `migrate.ts`/`generateSchema.ts` alone it would be a dangling import after the delete above).
- [ ] `packages/core/src/api/versions/backfillStatus.server.test.ts` — new file.

#### `packages/core/src/api/versions/backfillStatus.server.ts`
```ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { CollectionSlug } from "../../types/generated";
import type { VexConfig } from "../../config";

/** Rows scanned per `backfillStatus` call, absent an explicit `batchSize`. */
const DEFAULT_BACKFILL_BATCH_SIZE = 200;

/**
 * Server-side args for `backfillStatus`.
 *
 * @typeParam DataModel - Convex data model.
 */
export interface BackfillStatusServerArgs<DataModel extends GenericDataModel> {
  /** Convex mutation context (read + write DB access). */
  ctx: GenericMutationCtx<DataModel>;
  /** The versioned collection to backfill. */
  collection: CollectionSlug;
  /** Resolved `VexConfig` — used to confirm `collection` has `versions.drafts` enabled. */
  config: VexConfig;
  /** Cursor from a previous call. Omit to start from the first row. */
  cursor?: string;
  /** Rows scanned per call. Default `DEFAULT_BACKFILL_BATCH_SIZE`. */
  batchSize?: number;
}

/** Result of one `backfillStatus` page. */
export interface BackfillStatusResult {
  /** Rows patched in this call. Rows already carrying `vex_status` are skipped. */
  patched: number;
  /** `true` once every row in the collection has been scanned. */
  isDone: boolean;
  /** Cursor for the next call. `null` once `isDone` is `true`. */
  cursor: string | null;
}

/**
 * One-shot, user-invoked backfill: stamps `vex_status: "published"` on rows
 * that predate a `versions.drafts` toggle on `collection`.
 *
 * Needed because an equality range on `by_status` can never match `undefined`
 * (design-review.md §6.4) — rows written before drafts were enabled have no
 * `vex_status` at all, so the status filter injected in Step 10 would
 * silently hide them from every read. Not registered through `versionsApi`
 * (it is not a `DRAFT_ACTIONS` entry, §7) — the project wires it into a
 * mutation of its own (typically `internalMutation`, so it is not
 * client-callable) and invokes it — once, or repeatedly across cursors — after
 * toggling `versions.drafts` on for a collection with pre-existing rows.
 *
 * Safe to call repeatedly: once every row carries `vex_status`, further calls
 * patch 0 rows. Never touches `vex_publishedAt` or `vex_publishedId` — those
 * describe publish history, and a pre-existing row has none.
 *
 * @typeParam DataModel - Convex data model.
 * @param args - `{ ctx, collection, config, cursor?, batchSize? }`.
 * @returns `{ patched, isDone, cursor }` — call again with the returned
 *   `cursor` while `isDone` is `false`.
 * @throws {Error} When `collection` is not registered, or is registered but
 *   does not have `versions.drafts` enabled (its rows never get `vex_status`
 *   in the first place, so there is nothing to backfill).
 *
 * @example
 * ```ts
 * import { backfillStatus } from "@vexcms/core/server";
 *
 * export const backfillPagesStatus = internalMutation({
 *   args: { cursor: v.optional(v.string()) },
 *   handler: (ctx, args) =>
 *     backfillStatus({ ctx, collection: "pages", config, cursor: args.cursor }),
 * });
 * ```
 */
export async function backfillStatus<DataModel extends GenericDataModel>(
  args: BackfillStatusServerArgs<DataModel>,
): Promise<BackfillStatusResult> {
  // TODO: implement
  // 1. `collectionConfig = args.config.collections.find(c => c.slug === args.collection)`.
  //    a. not found → throw.
  //    b. found but `!collectionConfig.versions.drafts` → throw — this
  //       collection's rows never carry `vex_status`; running this would
  //       silently patch 0 rows forever.
  // 2. Page the raw table with NO index: `args.ctx.db.query(args.collection)
  //    .paginate({ cursor: args.cursor ?? null, numItems: args.batchSize ??
  //    DEFAULT_BACKFILL_BATCH_SIZE })`. Must stay unindexed — an equality
  //    range on `vex_status === undefined` is not expressible (§6.4), which is
  //    the entire reason this function exists instead of a `by_status` query.
  // 3. For each row in `page.page` where `row.vex_status === undefined`:
  //    `args.ctx.db.patch(row._id, { vex_status: "published" })`; increment
  //    a local `patched` counter.
  // 4. Return `{ patched, isDone: page.isDone, cursor: page.isDone ? null : page.continueCursor }`.
  // Edge cases:
  // - A row already carrying `vex_status` (created after the toggle) is
  //   skipped — repeated calls converge to `patched: 0`.
  // - `batchSize` bounds the SCAN, not the patch count — a page that is
  //   entirely already-stamped rows still costs a full page read.
  throw new Error("Not implemented");
}
```

#### `packages/core/src/api/server.ts`

Add alongside the existing `upsertGlobal` re-export block (after line 72, unrelated exports above/below unchanged):
```ts
export { backfillStatus } from "./versions/backfillStatus.server";
export type {
  BackfillStatusServerArgs,
  BackfillStatusResult,
} from "./versions/backfillStatus.server";
```

#### `packages/core/src/api/versions/backfillStatus.server.test.ts`
```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import { text } from "../../fields";
import { defineCollection } from "../../collections/config";
import * as generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { backfillStatus } from "./backfillStatus.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(generatedApi),
};

/** Shape of a raw `posts` row, for storage-layer assertions. */
interface VersionedPostRow {
  _id: string;
  vex_status?: "draft" | "published";
}

const draftsPosts = defineCollection({
  slug: "posts",
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({ label: "Slug", required: true }),
  },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [draftsPosts] } as unknown as VexConfig;

describe("backfillStatus (server)", () => {
  it("patches only rows missing vex_status, and is idempotent", async () => {
    const t = convexTest(schema, modules);
    const { legacyId, alreadyStampedId } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const legacyId = await ctx.db.insert("posts", { title: "Old", slug: "old" });
        const alreadyStampedId = await ctx.db.insert("posts", {
          title: "New",
          slug: "new",
          vex_status: "draft",
        } as never);
        return { legacyId, alreadyStampedId };
      },
    );

    const firstPage = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      backfillStatus({ ctx, collection: "posts", config: fixtureConfig }),
    );
    expect(firstPage.patched).toBe(1);
    expect(firstPage.isDone).toBe(true);
    expect(firstPage.cursor).toBeNull();

    const rows = (await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => ({
      legacy: await ctx.db.get(legacyId),
      stamped: await ctx.db.get(alreadyStampedId),
    }))) as unknown as { legacy: VersionedPostRow; stamped: VersionedPostRow };
    expect(rows.legacy.vex_status).toBe("published");
    expect(rows.stamped.vex_status).toBe("draft"); // untouched — already had a value

    const secondPage = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      backfillStatus({ ctx, collection: "posts", config: fixtureConfig }),
    );
    expect(secondPage.patched).toBe(0);
  });

  it("throws for a collection without versions.drafts enabled", async () => {
    const t = convexTest(schema, modules);
    const nonVersionedPosts = defineCollection({
      slug: "posts",
      fields: { title: text({ label: "Title", required: true }) },
    });
    const nonVersionedConfig = { collections: [nonVersionedPosts] } as unknown as VexConfig;

    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        backfillStatus({ ctx, collection: "posts", config: nonVersionedConfig }),
      ),
    ).rejects.toThrow();
  });
});
```

#### `packages/cli/src/lib/migrate.ts`

Delete the `BackfillVersionStatusOptions` interface (lines 5–11) and the `backfillVersionStatus` function (lines 194–268). `MUTATION_TIMEOUT_MS`, `withTimeout`, and `getClient` stay — `executeMigration`/`executeFieldRemoval` still use them. File starts:
```ts
// @ts-nocheck
import type { MigrationOp, RemovedFieldInfo, VexConfig } from "@vexcms/core";
import { logger } from "./logger.js";

/** Options for executing a batch of field migration operations. */
export interface MigrateOptions {
  // ...unchanged
}

/** Options for removing fields from existing Convex documents. */
export interface RemovalOptions {
  // ...unchanged
}

/** Timeout for each individual mutation call (30 seconds). */
const MUTATION_TIMEOUT_MS = 30_000;

// ...withTimeout, getClient, executeMigration, executeFieldRemoval unchanged; file ends there.
```

#### `packages/cli/src/lib/generateSchema.ts`

Delete lines 216–230 (the `hasVersioning` block) and drop `backfillVersionStatus` from the `migrate.js` import on line 19:
```ts
import { executeMigration, executeFieldRemoval } from "./migrate.js";
```
Lines 214–233 become:
```ts
  // Sync schema.ts imports with vex.schema.ts exports
  syncSchemaImports(convexSchemaPath, schemaContents, outputRelPath, config, existing);

  // Generate typed per-collection query files
  await generateAndWriteCollectionFiles({ config, cwd });

  return { written: true };
}
```

#### `packages/cli/src/commands/dev.ts`

Delete the `backfillVersionStatus` import (line 11) and the `resolveConvexUrl` import (line 13; used nowhere else in this file). Delete the `hasVersioning` line (85) and the `if (hasVersioning) { ... }` block (97–102). Lines 79–107 become:
```ts
  // Start convex dev — this is the core of `vex dev`
  startConvexDev(cwd);

  // Wait for the first deployment. On success, stop the tsconfig watcher
  // (no longer needed). On failure, the watcher already patched the file
  // which triggers Convex to retry.
  waitForDeploy(cwd)
    .then(async (deployed) => {
      // Stop watching — Convex only overwrites tsconfig during provisioning
      tsconfigWatcher?.close();

      if (!deployed) {
        // Patch one more time in case the watcher missed it
        patchConvexTsconfig(cwd);
      }
    })
    .catch(() => {
      tsconfigWatcher?.close();
      patchConvexTsconfig(cwd);
    });
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/cli test`

### Step 17 — `apps/www` wiring `[dev]`

Why: Proves the whole feature against a real deployment.
- [ ] `apps/www/src/vexcms/collections/pages.ts` — `versions: { drafts: true, autosave: true }`.
- [ ] `apps/www/convex/vex.ts` — register `versionsApi`.
- [ ] `apps/www/src/auth/access.ts` — draft actions per role.
- [ ] `apps/docs/src/content/docs/guides/versioning-and-drafts.mdx` — new guide.

#### `apps/www/src/vexcms/collections/pages.ts`

Insert a `versions` key on the `defineCollection` call, between `admin` and `fields` (lines 21–36 become):
```ts
export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  interfaceName: "Page",
  labels: {
    singular: "Page",
    plural: "Pages",
  },
  admin: {
    useAsTitle: "title",
    icon: "Notebook",
    table: {
      serverPageSize: 100,
      // defaultPageSize: 2,
    },
  },
  versions: {
    drafts: true,
    autosave: true,
  },
  fields: {
```
(Everything from `fields: {` onward — lines 37–168 — is unchanged.)

#### `apps/www/convex/vex.ts`

Full file:
```ts
import { createGetAuth } from "@vexcms/better-auth";
import { collectionsApi, versionsApi } from "@vexcms/core/server";

import { TABLE_SLUG_ORGANIZATIONS, TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants";
import config from "~/vex.config";

import { mutation, query } from "./_generated/server";

const getAuth = createGetAuth({
  orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
  userCollectionSlug: TABLE_SLUG_USERS,
  sessionCollectionSlug: TABLE_SLUG_SESSIONS,
  resolveOrgs: true,
});

export const { find, get, search, create, update, remove } = collectionsApi({
  config,
  query,
  mutation,
  getAuth,
});

// `pages` declares `versions.drafts` — registers the draft/publish workflow
// (Step 9's `versionsApi` factory, mirroring `globalsApi`).
export const { saveDraft, publish, unpublish, listVersions, getVersionSnapshot, deleteVersion } =
  versionsApi({
    config,
    query,
    mutation,
    getAuth,
  });
```

#### `apps/www/src/auth/access.ts`

Full file. `pages` gains `readDrafts`/`saveDraft` for `user` (content editors draft and read their own drafts); `publish`/`unpublish`/`deleteVersions` stay admin-only via the existing `[USER_ROLES.admin]: { "*": true }` blanket — editors draft, admins publish:
```ts
import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_ORGANIZATIONS, TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import { footers, headers, images, pages, siteSettings, themes } from "~/vexcms/collections";
import { nav } from "~/vexcms/globals";

export const access = defineAccess({
  // enabled: false,
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
  resources: [footers, headers, images, pages, siteSettings, themes, nav],
  customResources: {
    edit: {
      actions: ["save", "download"],
    },
  },
  permissions: {
    [USER_ROLES.admin]: {
      "*": true,
    },
    [USER_ROLES.user]: {
      "*": false,
      images: {
        "*": false,
        // read: true,
        update: ({ data: image }) => {
          return !image.src.includes("https://maprios.com");
        },
      },
      edit: {
        "*": false,
        save: true,
      },
      pages: {
        "*": false,
        read: true,
        // update: true,
        readDrafts: true,
        saveDraft: true,
      },
      headers: {
        "*": false,
        read: true,
      },
      footers: {
        "*": ({ user, data: footer }) => false,
        read: true,
      },
      adminPanel: {
        access: true,
        impersonate: false,
      },
      nav: {
        "*": true,
      },
    },
  },
});
```

#### `apps/docs/src/content/docs/guides/versioning-and-drafts.mdx`

New file:
````mdx
---
title: Versioning & Drafts
description: Enable draft/publish workflows on a collection, wire up autosave, and understand the two-row model behind it.
---

VexCMS supports a Sanity-style draft/publish workflow: enable `versions.drafts` on a collection and every document gets an independent draft that editors can save and preview without touching the published content readers see.

## Enabling it

```ts
import { defineCollection } from "@vexcms/core";

export const pages = defineCollection({
  slug: "pages",
  fields: { /* ... */ },
  versions: {
    drafts: true,
    // Optional: patch the draft row automatically as the editor types.
    autosave: true,
  },
});
```

`drafts` defaults to `false` — nothing changes for a collection that doesn't opt in. `autosave`, when enabled, debounces by `DEFAULT_AUTOSAVE_DEBOUNCE_MS` and only writes when the form's values actually changed since the last save.

## The model, in one line

Per document, at most two rows exist in the collection's table: a **published** row (`vex_status: "published"`, never deleted while the document exists) and, once someone starts editing, a **draft** row (`vex_status: "draft"`, `vex_publishedId` pointing back at the published row). A document that has never been published is a single draft row with no `vex_publishedId`.

Publishing a draft with a published parent copies the draft's fields into the published row and deletes the draft — **the published row's `_id` never changes**, so relationship fields, permalinks, and the admin edit URL survive every publish. Unpublishing flips the published row back to `draft` and is rejected while an outstanding draft row exists (publish or discard it first).

## Registering the API

```ts
// convex/vex.ts
import { collectionsApi, versionsApi } from "@vexcms/core/server";
import config from "../src/vex.config";
import { query, mutation } from "./_generated/server";

export const { find, get, search, create, update, remove } = collectionsApi({ config, query, mutation, getAuth });
export const { saveDraft, publish, unpublish, listVersions, getVersionSnapshot, deleteVersion } =
  versionsApi({ config, query, mutation, getAuth });
```

Public reads (`find`, `get`, `search`) automatically exclude draft rows for versioned collections unless the caller passes `drafts: true` **and** holds the `readDrafts` action — status filtering lives in the query builder, never in a permission rule, because with two rows sharing identity an unfiltered read would return the same logical document twice.

## Access control

Enabling `versions.drafts` on a resource adds five actions to its permission matrix, in addition to the usual CRUD set:

| Action | Grants |
|---|---|
| `readDrafts` | Read draft rows and version history |
| `saveDraft` | Save a draft — including autosave and restore |
| `publish` | Promote a draft to published |
| `unpublish` | Move a published document back to draft |
| `deleteVersions` | Prune entries from version history |

```ts
// src/auth/access.ts
permissions: {
  editor: {
    pages: {
      "*": false,
      read: true,
      readDrafts: true,
      saveDraft: true,
      // publish/unpublish reserved for admins
    },
  },
},
```

## Admin UI

The collection edit view gains a status badge and a Save Draft / Publish / Unpublish toolbar (each button gated by its own action) whenever `versions.drafts` is `true`. A version history dropdown lists every snapshot with its status, publish time, and author, and supports restoring an older version or deleting entries you have `deleteVersions` for.

## Backfilling an existing collection

Turning `versions.drafts` on for a collection that already has rows leaves those rows without a `vex_status` field. Because an index equality range can never match `undefined`, those rows would otherwise become invisible to every read. Wire the one-shot backfill into a mutation of your own and run it once after deploying the schema change:

```ts
// convex/vex/backfill.ts
import { internalMutation } from "../_generated/server";
import { backfillStatus } from "@vexcms/core/server";
import { v } from "convex/values";
import config from "../../src/vex.config";

export const backfillPagesStatus = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: (ctx, args) => backfillStatus({ ctx, collection: "pages", config, cursor: args.cursor }),
});
```

Call it from the Convex dashboard, passing the returned `cursor` back in until `isDone` is `true`. It's safe to run again later — rows that already carry `vex_status` are skipped.
````

Verify: `pnpm --filter www typecheck && pnpm --filter www build && pnpm --filter docs build`

### Step 18 — Verification `[dev]`

- [ ] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [ ] Manual verification script:
  1. Create a page, publish it, note its `_id`.
  2. Edit the page and save a draft — confirm the public route still serves the **published** copy (not the draft's edits).
  3. Publish again — confirm the `_id` is **unchanged** from step 1, and that any inbound `relationship` field pointing at this page still resolves (no dangling reference).
  4. Unpublish with an outstanding draft present — confirm the mutation **rejects** ("publish or discard the active draft first").
  5. Discard or publish the outstanding draft, then unpublish cleanly — confirm it succeeds.
  6. Open the version history dropdown and restore an older version — confirm the form hydrates with that version's field values and a new draft is created (`saveDraft({ restoredFrom })`), not a destructive overwrite.

Verify: `pnpm build && pnpm test`

## Inherited decisions — 2026-08-29 server-api-access-options arc

Binding inputs settled while building the access seam this spec consumes. Do not
relitigate; revisit only with the developer.

1. **The action seam exists.** Every raw server function and `vexServerApi` wrapper takes
   `access: { action?, bypass? }`, resolved through `resolveAccessCall` (single
   enforcement seam; `bypass` returns `access: undefined` — the documented RBAC-off
   path). Draft reads are `find({ …, access: { action: "readDrafts" } })` — already
   typed: `QueryCallActionFor<S>` carries `readDrafts` via `QueryAction`, and
   `MutationCallActionFor<S>` carries `saveDraft | publish | unpublish`.
2. **The undeclared-permission posture is pinned `deny`** (no input knob; an allow
   posture is a role-level `"*": true`). Consequence: ALL draft verbs fail closed with
   no special-casing, which is what makes a client-supplied `drafts: boolean` toggle
   safe — a drafts-enabled collection with no `readDrafts` rule yields nothing rather
   than leaking. The old leak analysis (fallback-to-`read` and allow-default options)
   is obsolete.
3. **`drafts: true` means INCLUDE drafts, not only-drafts** (matches Payload; the admin
   list view wants both). The end-state permission model is per-document action
   selection: check `read` for published rows, `readDrafts` for draft rows, union the
   result — which needs `vex_status` on rows and therefore lands here, not in the seam
   spec.
4. **Status narrowing is never dropped semantically.** It takes the query's single index
   slot when free; otherwise it degrades to an in-pipeline Convex `.filter()` — which
   returns FULL pages (row limits bound rows before filters), unlike the post-pagination
   JS permission filter. Three-way slot contention (status / access rule / caller index)
   is this spec's design work in `pickQueryIndex`.
5. **Developer will attempt `vex_status`-first compound indexes at schema generation**;
   if that fails ergonomically, fall back to the plain `.filter()` — acceptable because
   each published doc has at most one draft.
6. **Search narrows status via `filterFields`** on generated search indexes — a separate
   mechanism from query indexes (`withSearchIndex`), and a schema-generator change.
7. **`bypass: true` skips status narrowing too** — bypass means no access machinery at
   all.
8. **`get` does not status-narrow** — single-document fetch; the action check suffices.
9. **Wiring note:** `CollectionConfigInput` has no `versions` property yet, so
   `HasDrafts<R>` is currently unreachable and `readDrafts`/`DraftAction` never enter a
   resource's declared action union until this spec adds it. The seam, the registry
   (`CustomActionsBySlug`), and the fail-closed posture are all live and waiting.
