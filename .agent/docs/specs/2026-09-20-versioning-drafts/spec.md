---
status: draft
spec_id: 2026-09-20-versioning-drafts
touches:
  - packages/core/src/versioning/**
  - packages/core/src/api/versions/**
  - packages/core/src/collections/constants.ts
  - packages/core/src/collections/types.ts
  - packages/core/src/collections/config.ts
  - packages/core/src/collections/config.test.ts
  - packages/core/src/globals/types.ts
  - packages/core/src/globals/config.ts
  - packages/core/src/globals/config.test.ts
  - packages/core/src/globals/utils.ts
  - packages/core/src/schema/generateVexSchema.ts
  - packages/core/src/schema/generateVexSchema.test.ts
  - packages/core/src/access/constants.ts
  - packages/core/src/access/types.test.ts
  - packages/core/src/api/test/convex/schema.ts
  - packages/core/src/api/convex.ts
  - packages/core/src/api/convex.test.ts
  - packages/core/src/api/server.ts
  - packages/core/src/api/client.ts
  - packages/core/src/api/types.ts
  - packages/core/src/api/find/server.ts
  - packages/core/src/api/find/server.test.ts
  - packages/core/src/api/get/server.ts
  - packages/core/src/api/search/server.ts
  - packages/core/src/api/remove/server.ts
  - packages/core/src/api/remove/server.test.ts
  - packages/core/src/api/globals/utils.ts
  - packages/core/src/api/globals/upsert.server.ts
  - packages/core/src/api/globals/upsert.server.test.ts
  - packages/core/src/api/globals/get.server.ts
  - packages/core/src/api/globals/get.server.test.ts
  - packages/core/src/index.ts
  - packages/core/README.md
  - packages/cli/src/commands/dev.ts
  - packages/cli/src/lib/generateSchema.ts
  - packages/cli/src/lib/migrate.ts
  - packages/react/src/components/views/**
  - packages/react/src/hooks/useAutosave.ts
  - packages/react/src/hooks/index.ts
  - packages/react/src/lib/errors.ts
  - packages/react/src/testing/convex/schema.ts
  - packages/react/src/testing/viewSuite.ts
  - apps/www/src/vexcms/collections/pages.ts
  - apps/www/convex/vex.ts
  - apps/www/convex/pages.ts
  - apps/www/src/auth/access.ts
  - "apps/www/src/app/(frontend)/(site)/PageContent.tsx"
  - "apps/www/src/app/(frontend)/(site)/SiteLivePreviewProvider.tsx"
  - apps/docs/src/content/docs/guides/versioning-and-drafts.mdx
prompt_version: 1
---

# 2026-09-20-versioning-drafts — Spec

## Overview

Draft/publish workflow for collections and globals: `versions.drafts: true` gates a
`saveDraft` / `publish` / `unpublish` mutation trio plus version history, replacing the
hand-rolled `status` field `core/README.md` currently tells users to avoid. Re-scopes
`.agent/docs/specs/2026-08-23-versioning-drafts` (56 tasks, never implemented) now that
its two blockers — F (`2026-09-18-lifecycle-hooks-validation`) and E
(`2026-09-18-live-preview`) — have both shipped. The two-row data model, RBAC shape, and
read-path analysis from that draft's `design-review.md` are correct and carried forward
unchanged; what changed is how drafts write (must call F's pipeline, not their own) and
what read-path API they integrate with (the `access-constraint-builder` rework replaced
the index API the original Step 10 targeted). Full context and every corrected assumption
is in `spec-tasks.md`'s header.

## Design Decisions

1. **Two-row model, carried forward unchanged.** One main row per document holds the
   latest published content behind a stable `_id` that is never destroyed across a
   publish cycle; at most one `draft` row points at it via `vex_publishedId`.
   `design-review.md` §1-2 rejected a single-row + snapshot-buffer alternative for
   losing schema enforcement and indexing on draft content — nothing since invalidates
   that call.
2. **Plain table, not a Convex component.** `convex-component-decision.md` — cross-
   component joins on every edit-view load was disqualifying; `@convex-dev/better-auth`
   already hit this wall.
3. **Whole-document version snapshots; proceed without B2.** B2 (localization ADR) has
   not shipped and zero localization code exists anywhere in `core/src` today. A
   per-locale snapshot shape would be speculative structure for a feature that doesn't
   exist; a future localization spec is an additive change to the snapshot shape, not a
   rework of this one.
4. **`publish` validates strictly; `saveDraft` stays lenient.** F's lenient
   `.partial()` mode lets a draft persist incomplete. A published document is what the
   public sees and must satisfy the collection's real constraints, so `publish` re-runs
   full `create`-strength validation over the merged document and rejects, naming the
   missing field, before promoting.
5. **Unbounded version history in this spec; no `maxPerDoc` cap.** Matches
   `design-review.md` §6.3's own conclusion: history rows are read only when the
   history menu opens, never on the public path or in a list query — growth is a
   storage concern, not a latency one. Manual `deleteVersion` ships; automatic pruning
   does not.
6. **List-view pair-collapsing ships in this spec, not deferred to spec I.** Without it,
   a versioned document with an active draft renders as two separate rows in
   `CollectionListView` the moment this spec lands. That is a correctness gap for the
   two-row model this spec introduces, not a list-view feature spec I owns building.
7. **Status filtering is data integrity, enforced in the query builder — never a
   permission rule.** Two rows can share a slug, so an unfiltered query returns the
   same logical document twice; filtering must run even under `access: { bypass: true }`
   (`apps/www`'s current public-page pattern), which only skips RBAC, not this.
8. **Draft writes call the shipped lifecycle-hooks pipeline; they do not build one.**
   The original 2026-08-23 draft wrote `saveDraft`/`publish` as direct `db.patch`/
   `db.insert` calls with no `beforeChange` dispatch, no Zod validation, and
   `hasPermission` checked against the stored row instead of the incoming payload —
   backwards from the launch plan's constraint 1 and from `backlog.md`'s tracked gap.
   Every write here mirrors `api/update/server.ts`'s merge → `beforeChange` →
   diff → validate → write shape instead.
9. **The CLI's dead `hasVersioning` auto-trigger is deleted, not resurrected.** It calls
   a Convex mutation reference that has never existed in this codebase and was inert
   only because `CollectionConfig` had no `versions` field yet. Once Step 1 adds that
   field, the dead branch would start firing against nothing. A genuine, separately-
   invoked `backfillStatus` action replaces it.
10. **Live preview's draft base layer is a second, session-authenticated query — the
    public query is untouched.** `apps/www`'s `pages.getBySlug` stays `access.bypass:
    true` and published-only by Step 10's default. The live-preview provider's already-
    shipped `vex-live-preview` marker-cookie branch (ADR-012) calls a new query instead,
    gated by a real `readDrafts` permission check, so an unauthenticated request can
    never reach draft content through either path.

## Out of Scope

- **Automatic version-history pruning / `maxPerDoc` cap** — decision 5. Revisit if
  storage growth is ever measured as a real problem.
- **Per-locale version snapshots** — decision 3, blocked on B2 shipping first.
- **Concurrent-edit conflict-resolution UX** (`backlog.md` "Concurrent-edit
  conflict-resolution UX") — a distinct, harder problem with its own three-piece design
  already recorded; not a gate for this spec.
- **Read-path performance work beyond the status filter itself** — bounded `loadMore`,
  split `totalDocs` query, declared-filter compilation for arbitrary access rules. Owned
  by `2026-08-23-access-index-resolution` Steps 6-9, already tracked and in progress
  there independent of this spec.
- **`versions.defaultStatus` + dev-start auto-backfill probe**
  (`design-review.md` §6.4) — deferred; the one-shot user-invoked `backfillStatus`
  action (Step 16) covers the real need without the probe machinery.
- **Any change to live-preview's transport, matching, or overlay mechanism** — E already
  shipped this; Step 17 only points the base-layer query at draft-aware data.
- **Globals gaining a per-slug Convex table** — globals stay the single shared
  `vex_globals` table; Step 15 fits the two-row model inside it, it does not restructure
  globals storage.

## Implementation

### Step 1 — `versions` config on collections + globals `[agent]`

Why: Everything downstream branches on `collection.versions?.drafts`, which does not exist on `CollectionConfig` today, and on `GlobalConfig.versions` carrying `autosave`, which it doesn't either.

**Design correction verified against the live tree (not assumed from spec-tasks.md's "What changed" note):** `HasDrafts<T>` (`access/types.ts:634-639`) discriminates with `D extends true`, which requires `T`'s `versions.drafts` to be a *literal* `true` at the type level, not the general `boolean`. Confirmed with `tsc` against the actual current source: `GlobalConfig.versions` is `{ drafts: boolean }` — unparameterized — so `defineGlobal`'s explicit return-type annotation always widens a call site's `versions: { drafts: true }` to plain `boolean`, and `boolean extends true` is `false`. Draft actions do not unlock for any global today, and mirroring that same bare shape onto `CollectionConfig` would repeat the bug and make Step 3's `deleteVersions` gating test unwritable as passing code. This is exactly the defect the superseded 2026-08-23-versioning-drafts/spec.md diagnosed in its Design Decision 19 and fixed with a `const TDrafts extends boolean` generic threaded through `defineCollection` — that fix never actually shipped (only the access-side `HasDrafts`/`DRAFT_ACTIONS` primitives did). This step applies it, adapted to the current tree (which has more `CollectionConfigInput`/`CollectionConfig` fields than the 2026-08-23 snapshot — `indexes`, `timestamps`, `hooks`) and to this spec's field shape (no `maxPerDoc`, decision 3). **Runtime shape and defaults are exactly what the rest of this spec assumes** — `versions: { drafts: boolean; autosave: boolean }`, defaulting `false`/`false` — this only changes the *static type* so `HasDrafts` can discriminate a specific resource; every ordinary runtime read of `.versions.drafts` is unaffected.

- [ ] `packages/core/src/versioning/constants.ts` (new)
- [ ] `packages/core/src/versioning/index.ts` (new) — barrel, so `versioning/model.ts` (Step 4) and every `api/versions/*` consumer (Steps 5–9) import via `"../../versioning"` like every other domain folder (`collections`, `access`, `livePreview`), not deep relative paths.
- [ ] `packages/core/src/index.ts` — re-export the new barrel.
- [ ] `packages/core/src/collections/constants.ts` — extend `RESERVED_COLLECTION_FIELDS`.
- [ ] `packages/core/src/collections/types.ts` — 6th generic `TDrafts` + `versions` on `CollectionConfigInput`/`CollectionConfig`.
- [ ] `packages/core/src/collections/config.ts` — thread `TDrafts`, extend the runtime reserved-key guard, apply `versions` defaults.
- [ ] `packages/core/src/globals/types.ts` — 6th generic `TDrafts` + widen `versions` to carry `autosave`.
- [ ] `packages/core/src/globals/config.ts` — thread `TDrafts`, apply the `autosave` default.
- [ ] `packages/core/src/collections/config.test.ts`, `packages/core/src/globals/config.test.ts` — defaults resolve; reserved-field compile+runtime rejection covers the three new keys the same way it covers `updatedAt`.

#### packages/core/src/versioning/constants.ts

```ts
/**
 * System field keys written onto the main table row of a versioned
 * collection (and `vex_globals`, when any registered global declares
 * `versions.drafts: true`). Present only when `versions.drafts: true` — a
 * non-versioned collection's table never has these.
 *
 * `RESERVED_COLLECTION_FIELDS` (`collections/constants.ts`) reserves these
 * same three slugs against user-defined field names, mirroring how
 * `updatedAt` is reserved there — two independent lists serving two
 * independent purposes, not one mechanism duplicated: this one drives
 * `extractUserFields`' strip set, that one drives `defineCollection`'s
 * compile/runtime guard.
 */
export const VERSION_SYSTEM_FIELDS = ["vex_status", "vex_publishedAt", "vex_publishedId"] as const;
/** Version system field slug, derived from {@link VERSION_SYSTEM_FIELDS}. */
export type VersionSystemField = (typeof VERSION_SYSTEM_FIELDS)[number];

/**
 * Default debounce window, in milliseconds, before `useAutosave` (Step 14)
 * writes a changed draft row. Applied whenever a collection or global
 * declares `versions.autosave: true`.
 *
 * No companion max-versions-per-document default — decision 3 of this spec
 * ships unbounded version history; there is no automatic pruning to default.
 */
export const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1000 as const;
```

#### packages/core/src/versioning/index.ts

```ts
export * from "./constants";
```

#### packages/core/src/index.ts

Existing file, 1 edit.

**1 — re-export the new `versioning` barrel.** Add a new banner block after the existing `GLOBALS` block (before `FIELD TYPES`), mirroring every other domain folder's export:

```ts
// ============================================================================
// VERSIONING
// ============================================================================

export * from "./versioning";
```

#### packages/core/src/collections/constants.ts

Existing file, 2 edits.

**1 — extend `RESERVED_COLLECTION_FIELDS`.** Add three entries beside the existing `updatedAt` key, same shape:

```ts
  vexStatus: {
    slug: "vex_status",
  },
  vexPublishedAt: {
    slug: "vex_publishedAt",
  },
  vexPublishedId: {
    slug: "vex_publishedId",
  },
```

**2 — update the stale doc comment.** `ReservedCollectionFieldKey`'s JSDoc says "Resolves to `"updatedAt"`" — no longer true:

```ts
 * Union of the field slugs {@link defineCollection} injects and therefore
 * reserves. Resolves to `"updatedAt" | "vex_status" | "vex_publishedAt" |
 * "vex_publishedId"`.
```

#### packages/core/src/collections/types.ts

Existing file, 2 edits.

**1 — `CollectionConfigInput` gains a 6th generic and a `versions` field.** Add `TDrafts extends boolean = false` to the generic list (after `TComponent`), and add this property after `meta`:

```ts
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = false,
> {
```

```ts
  /**
   * Draft and versioning config for this collection. Enabling `drafts` adds
   * `vex_status` / `vex_publishedAt` / `vex_publishedId` to the generated
   * table (`generateVexSchema`) and the draft-workflow actions
   * (`readDrafts`, `saveDraft`, `publish`, `unpublish`, `deleteVersions`)
   * to this resource's subject in `defineAccess`.
   */
  versions?: {
    /** Enable the draft/publish workflow for this collection. @defaultValue `false` */
    drafts?: TDrafts;
    /**
     * Debounce background saves to the draft row while the edit form is
     * open. Ignored when `drafts` is `false`. @defaultValue `false`
     */
    autosave?: boolean;
  };
```

**2 — `CollectionConfig` gains the same 6th generic, defaulted wide.** `= boolean`, not `= false`, so every existing bare `CollectionConfig` reference across the monorepo keeps accepting any specific instantiation covariantly:

```ts
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = boolean,
> {
```

```ts
  /** Resolved versioning config. Always present after defaults. */
  versions: { drafts: TDrafts; autosave: boolean };
```

#### packages/core/src/collections/config.ts

Existing file, 2 edits.

**1 — thread `TDrafts` through `populateCollectionFieldMeta`'s signature.** Body (the `Object.entries(...).forEach(...)` loop and return) is unchanged — only the generic list and the `config` parameter's type gain the 6th argument:

```ts
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
}):
```

**2 — `defineCollection` gains the `TDrafts` generic throughout.** The generic list, both branches of the reserved-key compile-time ternary, the `input` cast, the runtime `reservedKeys` array, the return type, and the returned object's `versions` field all change — shown complete:

```ts
/**
 * Resolves a raw collection config input into a fully-populated `CollectionConfig`.
 *
 * Fills in any missing `labels` by deriving them from the `slug` — singularizing
 * then title-casing it for `singular`, and title-casing the slug itself for
 * `plural` (slugs are plural by convention). Applies `versions` defaults
 * (`drafts: false`, `autosave: false`) — `versions.drafts` keeps a literal
 * `true`/`false` type on the returned config (via the `const TDrafts`
 * generic below) so `defineAccess`'s `HasDrafts` check can gate the
 * draft-workflow actions per collection.
 *
 * @param config - The raw collection configuration supplied by the caller.
 * @returns The resolved `CollectionConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: { title: text({ required: true }) },
 *   versions: { drafts: true, autosave: true },
 * });
 * // → { slug: "posts", admin: { useAsTitle: "_id" }, labels: { singular: "Post", plural: "Posts" }, versions: { drafts: true, autosave: true }, fields: { ... } }
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
  config: string extends TFieldSlug
    ? CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent, TDrafts>
    : [TFieldSlug & ReservedCollectionFieldKey] extends [never]
      ? CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent, TDrafts>
      : {
          fields: {
            [K in TFieldSlug &
              ReservedCollectionFieldKey]: "Field name is reserved — defineCollection injects it automatically";
          };
        },
): CollectionConfig<
  TFieldMeta & CollectionFieldMeta,
  TCollectionMeta,
  TCollectionSlug,
  TFieldSlug,
  TComponent,
  TDrafts
> {
  const input = config as CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent,
    TDrafts
  >;

  // Runtime guard for JS consumers — unchanged rationale, three more keys.
  // `vex_status` / `vex_publishedAt` / `vex_publishedId` reuse the SAME loop
  // and the SAME `meta.locked` escape as `updatedAt` (no second mechanism),
  // even though nothing external is ever expected to set `meta.locked` on
  // them — that branch is simply dead for these three in practice.
  const reservedKeys: ReservedCollectionFieldKey[] = [
    "updatedAt",
    "vex_status",
    "vex_publishedAt",
    "vex_publishedId",
  ];
  for (const key of reservedKeys) {
    const declared = input.fields[key as TFieldSlug] as AdminField<TFieldMeta> | undefined;
    if (declared === undefined) {
      continue;
    }
    const meta: Record<string, unknown> = declared.meta;
    if (meta.locked === true) {
      continue;
    }
    throw new Error(
      `defineCollection: field key "${key}" is reserved and cannot be used in collection "${input.slug}". defineCollection injects it automatically; set { timestamps: false } to opt out.`,
    );
  }

  const meta: Record<string, unknown> = input.meta ?? {};
  const skipInjection =
    input.timestamps === false || "updatedAt" in input.fields || meta.protected === true;
  const fieldsWithTimestamp = skipInjection
    ? input.fields
    : {
        ...input.fields,
        updatedAt: number({
          admin: { position: "sidebar", readOnly: true },
          defaultValue: undefined,
          label: "Updated At",
          required: false,
        }) as AdminField<TFieldMeta>,
      };

  const fields = populateCollectionFieldMeta({
    config: { ...input, fields: fieldsWithTimestamp },
  });
  return {
    interfaceName: slugToPascalCase({ slug: input.slug }) + "Document",
    ...input,
    fields,
    hooks: (input.hooks ?? {}) as CollectionHooks<TCollectionSlug>,
    admin: {
      useAsTitle: "_id",
      ...input.admin,
      table: {
        defaultPageSize: 10,
        serverPageSize: 100,
        pageSizeOptions: [10, 25, 50, 100],
        defaultColumns: [],
        ...input.admin?.table,
        bulkActions: {
          delete: true,
          ...input.admin?.table?.bulkActions,
        },
        defaultSort: {
          field: "_createdAt",
          order: "desc",
          ...input.admin?.table?.defaultSort,
        },
      },
      livePreview: (input.admin?.livePreview && {
        url: input.admin.livePreview.url,
        debounceMs: input.admin.livePreview.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
        defaultOpen: input.admin.livePreview.defaultOpen ?? false,
        breakpoints: input.admin.livePreview.breakpoints,
      }) as AdminCollectionConfig<string, ComponentHKT, TCollectionSlug>["livePreview"],
    },
    labels: {
      singular: toTitleCase(pluralize.singular(input.slug)),
      plural: toTitleCase(input.slug),
      ...input.labels,
    },
    meta: {
      ...input.meta,
    } as TCollectionMeta,
    // `as` is load-bearing: the spread below computes a plain `boolean` for
    // `drafts` (the widest type satisfying both the default and the
    // optional spread), which is not directly assignable back to the
    // caller-specific `TDrafts` literal `defineAccess`'s `HasDrafts` needs —
    // it is correct at runtime because `TDrafts` was inferred from this
    // exact `input.versions?.drafts` value.
    versions: {
      drafts: false,
      autosave: false,
      ...input.versions,
    } as { drafts: TDrafts; autosave: boolean },
  };
}
```

#### packages/core/src/globals/types.ts

Existing file, 2 edits.

**1 — `GlobalConfigInput` gains a 6th generic and its `versions` field widens.** Add `TDrafts extends boolean = false` to the generic list (after `TComponent`), and replace the now-stale "parsed but ignored in v35" comment and field:

```ts
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = false,
> {
```

```ts
  /**
   * Draft and versioning config for this global. Enabling `drafts` adds
   * `vex_status` / `vex_publishedAt` / `vex_publishedId` to `vex_globals`
   * (`generateVexSchema`) and the draft-workflow actions (`readDrafts`,
   * `saveDraft`, `publish`, `unpublish`, `deleteVersions`) to this global's
   * subject in `defineAccess`. Reuses the shared `vex_versions` table and
   * the same two-row model as a versioned collection, scoped by
   * `collection: "vex_globals"` (design-review §9).
   */
  versions?: {
    /** Enable the draft/publish workflow for this global. @defaultValue `false` */
    drafts?: TDrafts;
    /**
     * Debounce background saves to the draft row while the edit form is
     * open. Ignored when `drafts` is `false`. @defaultValue `false`
     */
    autosave?: boolean;
  };
```

**2 — `GlobalConfig` gains the same 6th generic, defaulted wide, and its resolved `versions` field widens:**

```ts
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = boolean,
> {
```

```ts
  /** Resolved versioning config. Always present after defaults. */
  versions: { drafts: TDrafts; autosave: boolean };
```

#### packages/core/src/globals/config.ts

Existing file, 1 edit — `defineGlobal` changes throughout (generic list, config param ternary, `input` cast, return type, `versions` default), shown complete:

```ts
export function defineGlobal<
  TFieldMeta extends {} = {},
  TGlobalMeta extends {} = {},
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
  const TDrafts extends boolean = false,
>(
  config: string extends TFieldSlug
    ? GlobalConfigInput<TFieldMeta, TGlobalMeta, TGlobalSlug, TFieldSlug, TComponent, TDrafts>
    : [TFieldSlug & ReservedGlobalFieldKey] extends [never]
      ? GlobalConfigInput<TFieldMeta, TGlobalMeta, TGlobalSlug, TFieldSlug, TComponent, TDrafts>
      : {
          fields: {
            [K in TFieldSlug &
              ReservedGlobalFieldKey]: "Field name is reserved — cannot use _id, _creationTime, or _slug";
          };
        },
): GlobalConfig<TFieldMeta, TGlobalMeta, TGlobalSlug, TFieldSlug, TComponent, TDrafts> {
  const reservedKeys: ReservedGlobalFieldKey[] = ["_id", "_creationTime", "_slug"];
  for (const key of reservedKeys) {
    if (key in (config as GlobalConfigInput).fields) {
      throw new Error(
        `defineGlobal: field key "${key}" is reserved and cannot be used in global "${(config as GlobalConfigInput).slug}". ` +
          `Reserved keys: ${reservedKeys.join(", ")}.`,
      );
    }
  }

  const input = config as GlobalConfigInput<
    TFieldMeta,
    TGlobalMeta,
    TGlobalSlug,
    TFieldSlug,
    TComponent,
    TDrafts
  >;

  return {
    ...input,
    interfaceName: input.interfaceName ?? slugToPascalCase({ slug: input.slug }) + "Global",
    admin: {
      group: "",
      description: "",
      components: {},
      ...input.admin,
      livePreview: (input.admin?.livePreview && {
        url: input.admin.livePreview.url,
        debounceMs: input.admin.livePreview.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
        defaultOpen: input.admin.livePreview.defaultOpen ?? false,
        breakpoints: input.admin.livePreview.breakpoints,
      }) as GlobalAdminConfig<TComponent, TGlobalSlug>["livePreview"],
    },
    meta: (input.meta ?? {}) as TGlobalMeta,
    // Same `as` justification as `defineCollection` — `TDrafts` was inferred
    // from this exact `input.versions?.drafts` value.
    versions: {
      drafts: false,
      autosave: false,
      ...input.versions,
    } as { drafts: TDrafts; autosave: boolean },
  };
}
```

#### packages/core/src/collections/config.test.ts

Existing file, 2 edits (full real code — `[agent]`).

**1 — new `describe` block for `versions` defaults**, added after the existing `"defineCollection — updatedAt injection"` block:

```ts
describe("defineCollection — versions defaults", () => {
  it("defaults versions.drafts and versions.autosave to false when versions is omitted", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.versions).toEqual({ drafts: false, autosave: false });
  });

  it("resolves versions.drafts: true when declared, defaulting autosave to false", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true },
    });
    expect(posts.versions).toEqual({ drafts: true, autosave: false });
  });

  it("enables autosave alongside drafts", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, autosave: true },
    });
    expect(posts.versions).toEqual({ drafts: true, autosave: true });
  });
});
```

**2 — new `describe` block for the three reserved versioning keys**, added after it:

```ts
describe("defineCollection — reserved versioning field keys", () => {
  it("throws at runtime when a user field is literally named vex_status", () => {
    const fields: Record<string, AdminField> = { vex_status: text({ label: "Status" }) };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(/reserved/);
  });

  it("throws at runtime when a user field is literally named vex_publishedAt", () => {
    const fields: Record<string, AdminField> = { vex_publishedAt: text({ label: "Published At" }) };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(/reserved/);
  });

  it("throws at runtime when a user field is literally named vex_publishedId", () => {
    const fields: Record<string, AdminField> = { vex_publishedId: text({ label: "Published Id" }) };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(/reserved/);
  });

  it("is a compile-time error to declare a field literally named vex_status", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        // @ts-expect-error — vex_status is reserved; defineCollection injects it
        fields: { vex_status: text({ label: "Status" }) },
      }),
    ).toThrow(/reserved/);
  });
});
```

#### packages/core/src/globals/config.test.ts

Existing file, 2 edits (full real code — `[agent]`).

**1 — extend the existing `"applies admin defaults when omitted"` test** with the `autosave` default, right after its `expect(g.versions.drafts).toBe(false);` line:

```ts
    expect(g.versions.autosave).toBe(false);
```

**2 — new test after `"enables drafts when versions.drafts is true"`:**

```ts
  it("enables autosave alongside drafts", () => {
    const g = defineGlobal({
      slug: "nav",
      label: "Nav",
      fields: {} as any,
      versions: { drafts: true, autosave: true },
    });
    expect(g.versions.drafts).toBe(true);
    expect(g.versions.autosave).toBe(true);
  });
```

Verify: `pnpm --filter @vexcms/core test`

### Step 2 — Schema generation `[dev]`

Why: No mutation can be written before the tables and indexes exist. Inverts `generateVexSchema.test.ts`'s current "does not include versioning fields" assertion. The per-collection `defineTable(...)` source string is actually assembled by `collectionConfigToVexSchema` (`collections/validator.ts`) — not listed for this step — so the injection happens as a post-processing pass inside `generateVexSchema.ts` on the string that function already returns, keyed off a stable, always-present anchor (`export const <name> = defineTable({\n`) rather than by touching `collectionConfigToVexSchema` itself.

- [ ] `packages/core/src/schema/generateVexSchema.ts` — versioning-aware field/index injection for collections and `vex_globals`, plus an unconditional `vex_versions` table.
- [ ] `packages/core/src/schema/generateVexSchema.test.ts` — replace the "does not include versioning fields in v35" assertion with its inverse; add collection-level and `vex_versions` coverage.

#### packages/core/src/schema/generateVexSchema.ts

Existing file, 1 edit — `generateVexSchema`'s body changes throughout (new injection pass over `collectionSchemas`, an unconditional `vex_versions` block, a conditional pass over `globalsTable`); shown complete alongside a new private helper. `fail`/`success` are unchanged and not reproduced.

```ts
/**
 * Splices the three versioning system fields and their two indexes into an
 * already-built `defineTable({...})...` source string for one table.
 *
 * @param props - Input props.
 * @param props.tableSource - The table's source string, as returned by
 *   `collectionConfigToVexSchema` (for a collection) or the hand-built
 *   `vex_globals` block below — always of the shape `` `export const
 *   ${props.tableName} = defineTable({\n...fields...\n})...` ``.
 * @param props.tableName - The table's own name — used both to locate the
 *   `defineTable({` anchor and as the target of the self-referential
 *   `vex_publishedId` (a versioned document's draft row always points back
 *   at a published row in this SAME table; globals are no exception —
 *   design-review §9 treats a global's draft as another `vex_globals` row).
 * @returns `props.tableSource` with `vex_status`, `vex_publishedAt`, and
 *   `vex_publishedId` added to the object literal, and
 *   `.index("by_status", ...)` / `.index("by_published", ...)` appended
 *   after the table's existing `.index()`/`.searchIndex()` chain.
 */
function injectVersionFields(props: { tableSource: string; tableName: string }): string {
  // TODO: implement
  // 1. anchor = `export const ${props.tableName} = defineTable({\n` — locate
  //    it in props.tableSource (present exactly once: both
  //    collectionConfigToVexSchema's output and the hand-built vex_globals
  //    block below start with exactly this literal).
  // 2. Insert, immediately after the anchor (ahead of the table's own
  //    fields — order within the object literal doesn't matter to Convex):
  //      `\tvex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),\n`
  //      `\tvex_publishedAt: v.optional(v.number()),\n`
  //      `\tvex_publishedId: v.optional(v.id("${props.tableName}")),\n`
  // 3. Append to the END of props.tableSource (after any existing
  //    `.index()`/`.searchIndex()` calls — Convex chains index declarations
  //    in any order, so appending is safe and avoids parsing the existing
  //    chain):
  //      `\n\t.index("by_status", ["vex_status"])`
  //      `\n\t.index("by_published", ["vex_publishedId"])`
  // 4. → return the spliced string.
  // Edge cases:
  // - A table with zero existing indexes (a versioned collection with no
  //   other index-bearing field): the two appended `.index()` calls become
  //   its only indexes — nothing to coexist with, still valid.
  throw new Error("Not implemented");
}

/**
 * Generates the full contents of `vex.schema.ts` from a resolved `VexClientConfig`.
 *
 * Returns `{ update: false, contents }` when there are no collections and no
 * globals — the output contains only the auto-generated header and no
 * imports or table declarations. Returns `{ update: true, contents }`
 * otherwise. On a collection where `versions.drafts` is `true`, its table
 * gains `vex_status` / `vex_publishedAt` / `vex_publishedId` and the
 * `by_status` / `by_published` indexes (via {@link injectVersionFields}).
 * `vex_globals` gains the same three fields and two indexes when ANY
 * registered global declares `versions.drafts: true`. A `vex_versions`
 * table is emitted unconditionally whenever any collection or global is
 * registered — regardless of whether any of them actually declare
 * `versions.drafts` — so toggling a single collection's `versions.drafts`
 * later never breaks a `schema.ts` import that already references it.
 *
 * @param props - Input props.
 * @param props.config - The fully resolved Vex configuration.
 * @returns An object with `update` (whether the file should be written to
 *   disk) and `contents` (the file string).
 *
 * @see {@link collectionConfigToVexSchema} for the per-collection string builder
 * @see {@link injectVersionFields} for the versioning splice
 * @see {@link VexClientConfig} for the resolved config shape
 */
export function generateVexSchema(props: { config: VexClientConfig }): {
  update: boolean;
  contents: string;
} {
  // TODO: implement
  // 1. header/early-return: UNCHANGED from today — if
  //    `props.config.collections.length < 1 && props.config.globals.length < 1`
  //    → return fail(header).
  // 2. imports: UNCHANGED — the `defineTable`/`v` import line.
  // 3. allCollections = props.config.collections.concat(props.config.mediaCollections)
  //    (UNCHANGED grouping). For each collection:
  //    a. tableSource = collectionConfigToVexSchema({ collection, config: props.config })
  //    b. → collection.versions.drafts
  //         ? injectVersionFields({ tableSource, tableName: collection.slug })
  //         : tableSource
  //    Join every collection's (possibly-spliced) tableSource with "\n",
  //    exactly as today's `collectionSchemas`.
  // 4. Build the `vex_versions` table source UNCONDITIONALLY (only reached
  //    once step 1's early return didn't fire) — the literal block:
  //      export const vex_versions = defineTable({
  //        collection: v.string(),
  //        documentId: v.string(),
  //        version: v.number(),
  //        status: v.union(v.literal("draft"), v.literal("published")),
  //        snapshot: v.any(),
  //        createdBy: v.optional(v.string()),
  //        parentVersion: v.optional(v.number()),
  //        restoredFrom: v.optional(v.number()),
  //        publishedAt: v.optional(v.number()),
  //      }).index("by_document_version", ["collection", "documentId", "version"])
  // 5. globalsTable: UNCHANGED construction when props.config.globals.length > 0
  //    (the hand-built `vex_globals` array-of-lines block) → then
  //    globalsTable = props.config.globals.some((g) => g.versions.drafts)
  //      ? injectVersionFields({ tableSource: globalsTable, tableName: "vex_globals" })
  //      : globalsTable
  // 6. → success([header, imports, collectionSchemas, vexVersionsTable, globalsTable].join("\n"))
  throw new Error("Not implemented");
}
```

#### packages/core/src/schema/generateVexSchema.test.ts

Existing file, 2 edits (guided stubs — `[dev]`).

**1 — remove the now-inverted test.** Delete the `it("does not include versioning fields in v35", ...)` block inside `describe("generateVexSchema — globals", ...)` — it asserted the old no-op behavior this step reverses.

**2 — add a new `describe` block for versioned collections**, placed after the existing `describe("generateVexSchema — integration (full collection)", ...)` block:

```ts
describe("generateVexSchema — versioned collections", () => {
  it("emits vex_status, vex_publishedAt, vex_publishedId, and both indexes for a collection with versions.drafts: true", () => {
    // TODO: implement
    // 1. posts = defineCollection({ slug: "posts", fields: { title: text() }, versions: { drafts: true } })
    // 2. config = defineConfig({ collections: [posts] })
    // 3. { contents } = generateVexSchema({ config })
    // 4. Assert contents contains each of:
    //    a. 'vex_status: v.optional(v.union(v.literal("draft"), v.literal("published")))'
    //    b. 'vex_publishedAt: v.optional(v.number())'
    //    c. 'vex_publishedId: v.optional(v.id("posts"))'
    //    d. '.index("by_status", ["vex_status"])'
    //    e. '.index("by_published", ["vex_publishedId"])'
    throw new Error("Not implemented");
  });

  it("does not emit versioning fields for a non-versioned collection in the same config", () => {
    // TODO: implement
    // 1. posts = defineCollection({ slug: "posts", fields: { title: text() }, versions: { drafts: true } })
    //    authors = defineCollection({ slug: "authors", fields: { name: text() } }) — no versions declared
    // 2. config = defineConfig({ collections: [posts, authors] })
    // 3. { contents } = generateVexSchema({ config })
    // 4. Isolate the "authors" table's own source — the substring between
    //    'export const authors = defineTable({' and the next 'export const'
    //    — and assert IT does not contain "vex_status" / "vex_publishedAt" /
    //    "vex_publishedId" / "by_status" / "by_published". Asserting on
    //    `contents` as a whole would pass vacuously since "posts" DOES emit
    //    them.
    throw new Error("Not implemented");
  });

  it("emits vex_versions unconditionally, even when no collection or global declares drafts", () => {
    // TODO: implement
    // 1. config = defineConfig({ collections: [defineCollection({ slug: "posts", fields: { title: text() } })] })
    //    — versions.drafts defaults to false.
    // 2. { contents } = generateVexSchema({ config })
    // 3. Assert contents contains "export const vex_versions = defineTable({",
    //    every one of its nine field declarations, and
    //    '.index("by_document_version", ["collection", "documentId", "version"])'.
    throw new Error("Not implemented");
  });
});
```

**3 — add one new test inside the existing `describe("generateVexSchema — globals", ...)` block**, after `"does not emit vex_globals when no globals registered"`:

```ts
  it("emits vex_status, vex_publishedAt, vex_publishedId, and both indexes on vex_globals when a registered global declares versions.drafts: true", () => {
    // TODO: implement
    // 1. nav = defineGlobal({ slug: "nav", label: "Nav", fields: {} as any, versions: { drafts: true } })
    // 2. config = defineConfig({ globals: [nav] })
    // 3. { contents } = generateVexSchema({ config })
    // 4. Isolate the "vex_globals" table's own source (between its
    //    'export const vex_globals = defineTable({' and end of file / next
    //    export) and assert it contains 'vex_publishedId:
    //    v.optional(v.id("vex_globals"))' plus the by_status/by_published
    //    indexes — scoping the assertion avoids a false pass against the
    //    unrelated `status`-shaped field on the vex_versions block.
    throw new Error("Not implemented");
  });
```

Verify: `pnpm --filter @vexcms/core test`

### Step 3 — `deleteVersions` action `[agent]`

Why: One-line access change Steps 8 and 13 both gate on. `readDrafts`/`saveDraft`/`publish`/`unpublish` already exist in `DRAFT_ACTIONS` — this is the only gap. Verified end-to-end with `tsc` (using Step 1's `TDrafts` fix): `HasDrafts<R>` correctly resolves `true` for a resource declared with `versions: { drafts: true }` and `false` otherwise, so `deleteVersions` composes onto that resource's action union with zero changes to `access/types.ts` — exactly what AP-008 requires (compose by shape, don't touch the already-correct union machinery).

- [ ] `packages/core/src/access/constants.ts` — add `deleteVersions` to `DRAFT_ACTIONS`.
- [ ] `packages/core/src/access/types.test.ts` — the action appears on a resource with `versions.drafts: true` and is absent otherwise.

#### packages/core/src/access/constants.ts

Existing file, 1 edit.

**1 — add `deleteVersions` to `DRAFT_ACTIONS`:**

```ts
export const DRAFT_ACTIONS = {
  readDrafts: "readDrafts",
  saveDraft: "saveDraft",
  publish: "publish",
  unpublish: "unpublish",
  deleteVersions: "deleteVersions",
} as const;
```

#### packages/core/src/access/types.test.ts

Existing file, 2 edits (full real code — `[agent]`).

**1 — add a new top-level fixture beside the existing `pages`/`users` declarations** (a collection with `versions.drafts: true`, exercising Step 1's fix directly):

```ts
const draftPages = defineCollection({
  slug: "draftPages",
  fields: { title: text({ required: true }) },
  versions: { drafts: true },
});
```

**2 — new `describe` block at the end of the file**, after `describe("VexAccessConfig — the bare type is a supertype of every concrete config", ...)`:

```ts
describe("DRAFT_ACTIONS — composes onto a resource's action union by shape (AP-008)", () => {
  it("accepts deleteVersions (and the rest of DRAFT_ACTIONS) as a permission key for a resource with versions.drafts: true", () => {
    defineAccess({
      roles: ["admin"] as const,
      resources: [draftPages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        admin: {
          draftPages: {
            readDrafts: true,
            saveDraft: true,
            publish: true,
            unpublish: true,
            deleteVersions: true,
          },
        },
      },
    });
  });

  it("rejects deleteVersions on a resource that does not declare versions.drafts: true", () => {
    defineAccess({
      roles: ["admin"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        admin: {
          // @ts-expect-error — `pages` declares no `versions.drafts`, so `deleteVersions` is not in its action union
          pages: { deleteVersions: true },
        },
      },
    });
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 4 — Version model helpers `[dev]`

Why: Leaf utilities every mutation below calls. No `pruneVersions` (decision 3). `model.test.ts` needs real `ctx.db` access against `vex_status`/`vex_publishedId`/`vex_versions`, so this step also extends the SHARED `api/test/convex/schema.ts` fixture every other `.server.test.ts` in `api/` already imports — the first step to need these shapes, landing them once for Steps 5–11 and Step 15 to reuse without touching this file again.

- [ ] `packages/core/src/versioning/extractUserFields.ts` (new)
- [ ] `packages/core/src/versioning/model.ts` (new)
- [ ] `packages/core/src/versioning/index.ts` — extend the Step 1 barrel.
- [ ] `packages/core/src/api/test/convex/schema.ts` — extend the shared fixture with the versioning shapes `model.test.ts` (and every downstream integration test) needs.
- [ ] `packages/core/src/versioning/extractUserFields.test.ts`, `packages/core/src/versioning/model.test.ts`.

#### packages/core/src/versioning/extractUserFields.ts

```ts
import { VERSION_SYSTEM_FIELDS } from "./constants";

/**
 * Strips every key a `vex_versions` snapshot must never carry from a stored
 * document before it is written into a version's `snapshot` field.
 *
 * Removes `_id` and `_creationTime` (Convex system fields — meaningless once
 * copied into an immutable history row; restoring a version never restores
 * an `_id`) and every member of {@link VERSION_SYSTEM_FIELDS} (`vex_status`,
 * `vex_publishedAt`, `vex_publishedId` — these describe the LIVE row's
 * current publish state, not the content being snapshotted; re-publishing
 * an old snapshot must not resurrect its stale status).
 *
 * @param props - Input props.
 * @param props.doc - The stored document (draft or published row) to derive
 *   a snapshot from.
 * @returns A new object containing only the document's user-defined fields.
 *   `props.doc` is never mutated.
 *
 * @example
 * ```ts
 * extractUserFields({
 *   doc: { _id: "abc", _creationTime: 1, title: "Hi", vex_status: "draft" },
 * });
 * // → { title: "Hi" }
 * ```
 */
export function extractUserFields(props: { doc: Record<string, unknown> }): Record<string, unknown> {
  // TODO: implement
  // 1. stripKeys = new Set(["_id", "_creationTime", ...VERSION_SYSTEM_FIELDS])
  // 2. → return Object.fromEntries(
  //        Object.entries(props.doc).filter(([key]) => !stripKeys.has(key)),
  //      )
  // Edge cases:
  // - A doc missing one or more of the stripped keys (e.g. a never-published
  //   draft with no vex_publishedId yet) — filtering an absent key is a
  //   no-op, not an error.
  throw new Error("Not implemented");
}
```

#### packages/core/src/versioning/model.ts

```ts
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";

/** One immutable history row as stored in `vex_versions`. */
export interface VersionRow {
  _id: GenericId<"vex_versions">;
  _creationTime: number;
  collection: string;
  documentId: string;
  version: number;
  status: "draft" | "published";
  snapshot: unknown;
  createdBy?: string;
  parentVersion?: number;
  restoredFrom?: number;
  publishedAt?: number;
}

/**
 * Appends one immutable snapshot row to `vex_versions`.
 *
 * Called by every write path in this spec that changes a document's stored
 * content or publish status (`saveDraft`, `publish`, `unpublish`, and the
 * bootstrap snapshot `saveDraft` takes of a published row's "v1 published"
 * state on first edit) — never called directly by a Convex handler.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex mutation context (`vex_versions` is written here).
 * @param props.collection - The collection slug the versioned document belongs to.
 * @param props.documentId - The document's `_id`, stringified. Always the
 *   published row's `_id` once one exists, or the sole draft row's `_id`
 *   for a never-published document — the published `_id` never changes
 *   (design-review §2.2), so this never needs to be re-pointed mid-history.
 * @param props.status - `"draft"` or `"published"` — the state THIS
 *   snapshot captures, independent of the row's CURRENT status by the time
 *   anyone reads it back.
 * @param props.snapshot - The document's user-defined fields, already
 *   stripped via {@link extractUserFields} by the caller.
 * @param props.createdBy - The acting user's id, when known.
 * @param props.parentVersion - The version number this one was derived
 *   from (omitted for a document's very first version).
 * @param props.restoredFrom - Set only when this version's content came
 *   from restoring an older version — the source version's number.
 * @param props.publishedAt - Set once a document has ever been published,
 *   carried forward on every subsequent version (including drafts) so "was
 *   this ever live" survives unpublish. Omitted for content that has never
 *   been published.
 * @returns The new version's row number — one greater than the document's
 *   current latest version, or `1` if it has none yet.
 */
export async function createVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  documentId: string;
  status: "draft" | "published";
  snapshot: Record<string, unknown>;
  createdBy?: string;
  parentVersion?: number;
  restoredFrom?: number;
  publishedAt?: number;
}): Promise<number> {
  // TODO: implement
  // 1. latest = await getLatestVersion({ ctx: props.ctx, collection: props.collection, documentId: props.documentId })
  //    → the document's current highest version row, or null if it has none.
  // 2. nextVersion = (latest?.version ?? 0) + 1
  // 3. await props.ctx.db.insert("vex_versions", {
  //      collection: props.collection, documentId: props.documentId,
  //      version: nextVersion, status: props.status, snapshot: props.snapshot,
  //      createdBy: props.createdBy, parentVersion: props.parentVersion,
  //      restoredFrom: props.restoredFrom, publishedAt: props.publishedAt,
  //    })
  // 4. → return nextVersion.
  // Edge cases:
  // - Two concurrent writers computing the same nextVersion for the SAME
  //   document is a real race in principle, but Convex's OCC retries a
  //   mutation whose read set (this function's own `getLatestVersion` read)
  //   is invalidated by a concurrent write — matches `update`/`create`'s
  //   existing no-extra-locking posture.
  throw new Error("Not implemented");
}

/**
 * Returns a document's highest-numbered `vex_versions` row, or `null` if it
 * has no version history yet.
 *
 * Always queries via the `by_document_version` index and takes the single
 * newest row — never `.collect()`s the full history, since this runs on
 * every `saveDraft`/`publish` call to compute the next version number.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex query or mutation context.
 * @param props.collection - The collection slug.
 * @param props.documentId - The document's `_id`, stringified.
 * @returns The latest version row, or `null` when the document has never
 *   been snapshotted.
 */
export async function getLatestVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  documentId: string;
}): Promise<VersionRow | null> {
  // TODO: implement
  // 1. row = await props.ctx.db.query("vex_versions")
  //      .withIndex("by_document_version", (q) =>
  //        q.eq("collection", props.collection).eq("documentId", props.documentId))
  //      .order("desc")
  //      .first()
  //    → never `.collect()` — decision 3 ships unbounded history, so a full
  //    scan here would grow with it on every single write.
  // 2. → return row ?? null.
  throw new Error("Not implemented");
}

/**
 * Returns one specific version row by its document and version number.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex query or mutation context.
 * @param props.collection - The collection slug.
 * @param props.documentId - The document's `_id`, stringified.
 * @param props.version - The version number to fetch.
 * @returns The matching row, or `null` when no such version exists (an
 *   invalid/out-of-range number, or a version `deleteVersion` already removed).
 */
export async function getVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  documentId: string;
  version: number;
}): Promise<VersionRow | null> {
  // TODO: implement
  // 1. row = await props.ctx.db.query("vex_versions")
  //      .withIndex("by_document_version", (q) =>
  //        q.eq("collection", props.collection).eq("documentId", props.documentId).eq("version", props.version))
  //      .unique()
  //    → `by_document_version` is a 3-field compound index; an exact match
  //    on all three identifies at most one row. `.unique()` over `.first()`
  //    turns a duplicate (a bug elsewhere writing two rows at one version)
  //    into a thrown error instead of a silently wrong pick.
  // 2. → return row ?? null.
  throw new Error("Not implemented");
}

/**
 * Returns every `vex_versions` row for a document, newest first.
 *
 * Unbounded by default (decision 3: no automatic pruning) — `limit` exists
 * only to cap what a single history-dropdown render fetches, not to express
 * a retention policy.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex query or mutation context.
 * @param props.collection - The collection slug.
 * @param props.documentId - The document's `_id`, stringified.
 * @param props.limit - Maximum number of rows to return, newest first.
 *   Omitted returns the full history.
 * @returns Version rows ordered by `version` descending.
 */
export async function listVersions<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  documentId: string;
  limit?: number;
}): Promise<VersionRow[]> {
  // TODO: implement
  // 1. query = props.ctx.db.query("vex_versions")
  //      .withIndex("by_document_version", (q) =>
  //        q.eq("collection", props.collection).eq("documentId", props.documentId))
  //      .order("desc")
  // 2. rows = props.limit === undefined ? await query.collect() : await query.take(props.limit)
  //    → `.take()` over `.collect()` + slice when limited, so Convex stops
  //    reading past the cap instead of scanning the full history first.
  // 3. → return rows.
  throw new Error("Not implemented");
}

/**
 * Finds the draft row pointing at a published document, if one exists.
 *
 * The link is one-directional (design-review §2.3): the published row
 * never carries a pointer back to its draft, so this is the only way to
 * answer "does this document have an active draft" — one indexed lookup,
 * never a scan, and never a reactive subscription touching the published
 * row itself.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex query or mutation context.
 * @param props.collection - The collection slug.
 * @param props.publishedId - The published row's `_id`.
 * @returns The draft row whose `vex_publishedId` equals `props.publishedId`,
 *   or `null` when the document has no outstanding draft.
 */
export async function findDraftRow<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  publishedId: GenericId<CollectionSlug>;
}): Promise<Record<string, unknown> | null> {
  // TODO: implement
  // 1. table = props.collection as TableNamesInDataModel<DataModel> — same
  //    dynamic-table cast `update`/`create` already use; `collection` is a
  //    runtime value, so its table can't be a compile-time literal here.
  // 2. row = await props.ctx.db.query(table)
  //      .withIndex("by_published", (q) => q.eq("vex_publishedId", props.publishedId))
  //      .unique()
  //    → `.unique()`, not `.first()`: the two-row model's invariant is AT
  //    MOST ONE draft per published row (design-review §2.4) — a second
  //    match means that invariant already broke elsewhere, and this should
  //    surface that loudly rather than silently pick one.
  // 3. → return row ?? null.
  // Edge cases:
  // - A never-published document has no published row to look this up BY —
  //   callers only reach here once a `vex_publishedId` exists.
  throw new Error("Not implemented");
}
```

#### packages/core/src/versioning/index.ts

Existing file (created by Step 1), 1 edit — append to the barrel:

```ts
export * from "./model";
export * from "./extractUserFields";
```

#### packages/core/src/api/test/convex/schema.ts

Existing file, 2 edits — every other table in this shared fixture is unchanged.

**1 — the `posts` table gains the three versioning columns and their two indexes**, alongside its existing fields/indexes:

```ts
  posts: defineTable({
    title: v.string(),
    slug: v.optional(v.string()),
    authorId: v.optional(v.id("authors")),
    vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    vex_publishedAt: v.optional(v.number()),
    vex_publishedId: v.optional(v.id("posts")),
  })
    .index("by_slug", ["slug"])
    .index("by_author", ["authorId"])
    .index("by_status", ["vex_status"])
    .index("by_published", ["vex_publishedId"]),
```

**2 — a new `vex_versions` table**, added beside `vex_globals`:

```ts
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
```

#### packages/core/src/versioning/extractUserFields.test.ts

New file, complete.

```ts
import { describe, expect, it } from "vitest";
import { extractUserFields } from "./extractUserFields";

describe("extractUserFields", () => {
  it("strips _id, _creationTime, and every VERSION_SYSTEM_FIELDS member", () => {
    // TODO: implement
    // 1. doc = { _id: "abc", _creationTime: 1700000000000, title: "Hello",
    //    body: "World", vex_status: "draft", vex_publishedAt: 1700000001000,
    //    vex_publishedId: "def" }
    // 2. result = extractUserFields({ doc })
    // 3. expect(result).toEqual({ title: "Hello", body: "World" })
    throw new Error("Not implemented");
  });

  it("returns the user fields unchanged when none of the stripped keys are present", () => {
    // TODO: implement
    // 1. doc = { title: "Hello" } — a never-published draft with no
    //    vex_publishedId yet.
    // 2. result = extractUserFields({ doc })
    // 3. expect(result).toEqual({ title: "Hello" })
    throw new Error("Not implemented");
  });

  it("does not mutate the input document", () => {
    // TODO: implement
    // 1. doc = { _id: "abc", title: "Hello" }
    // 2. extractUserFields({ doc })
    // 3. expect(doc).toEqual({ _id: "abc", title: "Hello" }) — original untouched
    throw new Error("Not implemented");
  });
});
```

#### packages/core/src/versioning/model.test.ts

New file, complete.

```ts
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import schema from "../api/test/convex/schema";
import { createVersion, findDraftRow, getLatestVersion, getVersion, listVersions } from "./model";

const modules = import.meta.glob("../api/test/convex/**/*.*s");

describe("createVersion + getLatestVersion", () => {
  it("returns null for a document with no version history", () => {
    // TODO: implement
    // 1. t = convexTest(schema, modules)
    // 2. result = await t.run((ctx) => getLatestVersion({ ctx, collection: "posts", documentId: "nonexistent" }))
    // 3. expect(result).toBeNull()
    throw new Error("Not implemented");
  });

  it("assigns version 1 to a document's first snapshot", () => {
    // TODO: implement
    // 1. t.run: insert a posts row → id; createVersion({ ctx, collection: "posts",
    //    documentId: id, status: "draft", snapshot: { title: "Hi" } })
    // 2. expect(returned version number).toBe(1)
    // 3. getLatestVersion({ ctx, collection: "posts", documentId: id }) →
    //    row.version === 1, row.snapshot deep-equals { title: "Hi" }
    throw new Error("Not implemented");
  });

  it("increments the version number on each successive snapshot for the same document", () => {
    // TODO: implement
    // 1. createVersion(..., status: "draft", snapshot: { title: "A" }) then
    //    createVersion(..., status: "draft", snapshot: { title: "B" }) for the
    //    SAME documentId.
    // 2. second call's return value is 2.
    // 3. getLatestVersion returns the version: 2 row (snapshot.title === "B"),
    //    not version 1.
    throw new Error("Not implemented");
  });

  it("resolves the true max by the indexed version field, not insertion order", () => {
    // TODO: implement
    // 1. Insert vex_versions rows directly via ctx.db.insert with version
    //    numbers 1, 3, 2, in that literal insertion order.
    // 2. getLatestVersion({ ctx, collection, documentId }) → version 3,
    //    proving the lookup orders by the indexed `version` field, not
    //    insertion order.
    throw new Error("Not implemented");
  });
});

describe("getVersion", () => {
  it("returns the exact version row requested", () => {
    // TODO: implement
    // 1. createVersion twice for one documentId (versions 1 and 2, distinct snapshots).
    // 2. getVersion({ ..., version: 1 }) → returns the version-1 row, not version 2.
    throw new Error("Not implemented");
  });

  it("returns null for a version number that does not exist", () => {
    // TODO: implement
    // 1. createVersion once (version 1) for a documentId.
    // 2. getVersion({ ..., version: 5 }) → null.
    throw new Error("Not implemented");
  });
});

describe("listVersions", () => {
  it("returns every version newest first", () => {
    // TODO: implement
    // 1. createVersion three times for one document (versions 1, 2, 3).
    // 2. listVersions({ ctx, collection, documentId }) → results map to
    //    version numbers [3, 2, 1] in that order.
    throw new Error("Not implemented");
  });

  it("respects limit", () => {
    // TODO: implement
    // 1. createVersion three times (versions 1, 2, 3).
    // 2. listVersions({ ..., limit: 2 }) → exactly 2 rows, versions [3, 2].
    throw new Error("Not implemented");
  });

  it("scopes to the requested collection and documentId — does not leak another document's history", () => {
    // TODO: implement
    // 1. createVersion for documentId "a" and documentId "b" in the same
    //    collection.
    // 2. listVersions({ ..., documentId: "a" }) contains only "a"'s rows.
    throw new Error("Not implemented");
  });
});

describe("findDraftRow", () => {
  it("returns null when the published document has no draft", () => {
    // TODO: implement
    // 1. Insert a posts row with vex_status: "published".
    // 2. findDraftRow({ ctx, collection: "posts", publishedId: thatId }) → null.
    throw new Error("Not implemented");
  });

  it("returns the draft row pointing at the given published id", () => {
    // TODO: implement
    // 1. Insert a published posts row → publishedId. Insert a second posts
    //    row with vex_status: "draft", vex_publishedId: publishedId.
    // 2. findDraftRow({ ctx, collection: "posts", publishedId }) → the
    //    returned row's _id equals the draft row's _id (not the published
    //    row's).
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 5 — `saveDraft` `[dev]`

- [ ] `packages/core/src/api/versions/types.ts` — shared server/client arg shape: `{ collection, id, data: Partial<...>, restoredFrom?, environmentId? }`. `data` is a partial patch, matching `update`'s contract exactly — draft save is "update, but targeting the draft row and allowed to be incomplete," not a distinct shape.
- [ ] `packages/core/src/api/versions/saveDraft.server.ts` — gate on `saveDraft` with `hasPermission({ ..., data: <stored draft row or undefined>, changes: args.data, throwOnDenied: true })` — fixes the original spec's stored-row-only check. Find the existing draft row (`findDraftRow`) or bootstrap one (first edit of a published doc: insert a draft row with `vex_publishedId` set to the published row's `_id`, and snapshot the published row to `vex_versions` as `v1 published` before the first draft write). Merge `draftRow ∪ args.data` for `beforeChange`, dispatch it, diff via the same `deepEqual`/`changedKeys` approach `api/update/server.ts:107-109` uses, validate with `getCollectionInputSchema({ collection, partial: true })` (F's lenient mode) over changed keys only, run `validateFields` over changed keys, patch/insert the draft row, `createVersion` with `status: "draft"`.
- [ ] `packages/core/src/api/versions/saveDraft.client.ts`
- [ ] `packages/core/src/api/versions/saveDraft.server.test.ts` — at most one draft row per document across repeated saves; bootstrap fires once; a role restricted to `update: ({ changes }) => ...` on one field gets the SAME restriction on `saveDraft` (launch-plan acceptance criterion, proven by test).

#### packages/core/src/api/versions/types.ts

```ts
import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, MutationCallActionFor, VexApiAuth } from "../types";

/**
 * Base server-side args shared by every versions **mutation** function
 * (`saveDraft`, `publish`, `unpublish`). Mirrors `GenericGlobalsMutationServerArgs`
 * (`api/globals/types.ts`) but scoped to a collection slug, with one deliberate
 * difference: `config` is optional here, matching `GenericQueryServerParams`'s
 * convention (`api/types.ts`) rather than `GenericMutationServerParams`'s required
 * one. A caller that omits it still fails safely: every operation below resolves
 * `collection` via `args.config?.collections.find(...)`, so a missing `config`
 * surfaces through the exact same "no collection registered" `ConvexError` every
 * operation already throws for an unknown slug, rather than opening a second,
 * differently-worded failure mode.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface GenericVersionsMutationServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<MutationCallActionFor<TCollectionSlug>>;
  /**
   * Resolved caller identity for permission checks — `{ user, organization? }`,
   * or omitted when access control is off. Never a client argument; the
   * `versionsApi` factory (Step 9) resolves it from `ctx.auth` per request.
   */
  auth?: VexApiAuth;
  /** Discriminator: server args MUST supply a Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /**
   * The resolved `VexConfig`. Optional at the type level — see this interface's
   * docstring for why omitting it is never a silent no-op.
   */
  config?: VexConfig;
  /** The versioned collection slug this call targets. */
  collection: TCollectionSlug;
  /**
   * Reserved for a future multi-environment spec (see this spec's decision log).
   * Accepted and ignored by every versions operation today.
   */
  environmentId?: string;
}

/**
 * The `data` payload shared by `saveDraft` and `publish` — a partial patch against
 * the target collection's document shape, `_id`/`_creationTime` excluded. Identical
 * in shape to `UpdateServerArgs["data"]` (`api/update/server.ts`): draft save and
 * publish are both "patch a document," never a distinct payload shape.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type VersionsDataInput<DataModel extends GenericDataModel> = Partial<
  Expand<
    BetterOmit<
      DocumentByName<DataModel, TableNamesInDataModel<DataModel>>,
      "_creationTime" | "_id"
    >
  >
>;
```

#### packages/core/src/api/versions/saveDraft.server.ts

```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { getCollectionInputSchema, validateFields } from "../../collections";
import { deepEqual, resolveAccessCall, stampUpdatedAt } from "../utils";
import { TDocument } from "../convex";
import { createVersion, findDraftRow, getLatestVersion } from "../../versioning/model";
import { extractUserFields } from "../../versioning/extractUserFields";
import type { GenericVersionsMutationServerArgs, VersionsDataInput } from "./types";

/**
 * Server-side args for `saveDraft`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface SaveDraftServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericVersionsMutationServerArgs<DataModel, TCollectionSlug> {
  /**
   * The document id the caller currently has loaded — the published row's id
   * on every edit after the first, or a draft row's own id (never-published
   * document, or a draft already active). Both are resolved transparently.
   */
  id: GenericId<TCollectionSlug>;
  /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
  data: VersionsDataInput<DataModel>;
  /**
   * The version number this save restores from, when the caller is reverting to
   * an older snapshot (fetched separately via `getVersionSnapshot`, Step 8).
   * Recorded on the emitted `vex_versions` row for lineage; otherwise unused.
   */
  restoredFrom?: number;
}

/**
 * Patches (or bootstraps) the draft row for a versioned collection's document and
 * records a `"draft"`-status history row. Server-side only.
 *
 * Reuses the SAME write pipeline `update` runs (`hasPermission → merge →
 * beforeChange → diff → lenient Zod → validateFields → stampUpdatedAt → patch`),
 * targeting the draft row instead of the caller's own id, plus two draft-specific
 * steps: resolving/bootstrapping the draft row before the pipeline starts, and
 * emitting a `vex_versions` snapshot after it ends.
 *
 * **Authorization is evaluated against the STORED draft row**, never against
 * `args.data` — the correction this spec makes relative to the original
 * 2026-08-23 draft, which authorized against whichever row the caller supplied.
 * `changes: data` is what lets a field-level permission map deny individual keys.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, collection, id, data, restoredFrom? }`. `ctx` must be a mutation context.
 * @returns Promise resolving to the draft row's `_id` as a string.
 * @throws {ConvexError} When `collection`/`config`, or the target document, cannot be resolved.
 * @throws {VexAccessError} When the caller is not permitted to save this draft.
 * @example
 * ```ts
 * import { saveDraft } from "@vexcms/core/server";
 *
 * export const savePostDraft = mutation({
 *   args: { id: v.id("posts"), data: v.any() },
 *   handler: (ctx, args) =>
 *     saveDraft({ ctx, config, collection: "posts", id: args.id, data: args.data }),
 * });
 * ```
 */
export async function saveDraft<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: SaveDraftServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  // TODO: implement
  // 1. Resolve the target collection: `const collection = args.config?.collections.find((c) =>
  //    c.slug === args.collection);`
  //    a. `!args.config || !collection` → throw `ConvexError(`No collection registered with
  //       slug "${args.collection}"`)`. This widens `update`'s existing guard to also catch a
  //       missing `config` (optional in `SaveDraftServerArgs`, see `types.ts`). After this
  //       check, `args.config` is narrowed non-null for the rest of the function.
  // 2. Defense-in-depth: `const data = extractUserFields({ doc: args.data });`
  //    → strips any `vex_status`/`vex_publishedAt`/`vex_publishedId` key the caller's payload
  //    happens to carry. `args.data`'s TS type does not exclude these keys (mirrors
  //    `UpdateServerArgs["data"]`'s existing looseness around `updatedAt`), so this is a REAL
  //    runtime guard against a caller flipping status through the generic patch payload — the
  //    two-row model's authorization boundary must live in `publish`/`unpublish` alone.
  // 3. `const targetRow = await args.ctx.db.get(args.id);`
  //    a. `targetRow === null` → throw `ConvexError(`No document found for id "${args.id}" in
  //       collection "${args.collection}"`)`.
  // 4. Resolve the draft row this call targets — READ ONLY, nothing is written yet:
  //    a. `targetRow.vex_status === "draft"` → `draftRow = targetRow` (covers both a
  //       never-published document edited by its own id, and a caller that already has the
  //       active draft's id loaded).
  //    b. else (`targetRow` is the published row) → `draftRow = await findDraftRow({ ctx:
  //       args.ctx, collection: args.collection, publishedId: targetRow._id });` → `undefined`
  //       on the first edit since the last publish.
  // 5. Permission gate: `if (args.config.access !== undefined) { const { access, action,
  //    resource } = resolveAccessCall({ config: args.config, access: args.access,
  //    defaultAction: DRAFT_ACTIONS.saveDraft, resource: args.collection }); hasPermission({
  //    throwOnDenied: true, access, user: args.auth?.user ?? null, organization:
  //    args.auth?.organization, resource, action, data: draftRow ?? undefined, changes: data
  //    }); }`
  //    → `data: draftRow ?? undefined` is the STORED draft (or `undefined` on the first-ever
  //    edit) — never `targetRow`/`args.data` — so a per-document or per-field rule is
  //    evaluated against what is actually stored. `changes: data` is what makes a field-level
  //    permission map deny a specific forbidden key.
  // 6. Bootstrap, only when `draftRow === undefined` (branch 4b found nothing):
  //    a. `await createVersion({ ctx: args.ctx, collection: args.collection, documentId:
  //       String(targetRow._id), status: "published", snapshot: extractUserFields({ doc:
  //       targetRow }), publishedAt: targetRow.vex_publishedAt });` → records the published
  //       baseline as it existed the moment drafting began.
  //    b. `const draftRowId = await args.ctx.db.insert(args.collection, {
  //       ...extractUserFields({ doc: targetRow }), vex_status: "draft" as const,
  //       vex_publishedId: targetRow._id });`
  //    c. `draftRow = (await args.ctx.db.get(draftRowId))!;` → re-fetch for a fully-typed row
  //       to merge against below.
  // 7. Merge: `const { _id, _creationTime, vex_status, vex_publishedAt, vex_publishedId,
  //    ...fields } = draftRow as Record<string, unknown>; const mergedFields = { ...fields,
  //    ...data } as unknown as TDocument;`
  // 8. `beforeChange` dispatch, identical shape to `update`: `let transformedFields: TDocument
  //    = mergedFields; if (collection.hooks?.beforeChange) { transformedFields = await
  //    collection.hooks.beforeChange({ operation: "update", doc: mergedFields as never, ctx:
  //    args.ctx, collection }); }` — reuses the existing `"update"` hook operation; this spec
  //    introduces no new hook operation kind.
  // 9. Changed-key diff, identical to `update.server.ts:111-114`: seed `changedKeys` from
  //    `Object.keys(data)`, then add any key where `!deepEqual(transformedFields[key],
  //    mergedFields[key])`.
  // 10. Lenient validation (F's partial mode — the one place `saveDraft` is allowed to be
  //     incomplete): `const parsed = getCollectionInputSchema({ collection, partial: true
  //     }).safeParse(transformedFields); if (!parsed.success) throw new ConvexError({
  //     message: "Validation failed", errors: parsed.error.message });`
  // 11. `await validateFields({ collection, doc: transformedFields, keys: changedKeys, ctx:
  //     args.ctx });` → changed keys only, matching `update`.
  // 12. Build the patch from `changedKeys` only, matching `update`'s patch-only-what-changed
  //     semantics (keeps autosave cheap): `const patch: Record<string, unknown> = {}; for
  //     (const key of changedKeys) patch[key] = transformedFields[key];`
  // 13. `await args.ctx.db.patch(draftRow._id, stampUpdatedAt({ collection: args.collection,
  //     config: args.config, data: patch }) as never);`
  // 14. History: `const documentId = String(draftRow.vex_publishedId ?? draftRow._id); const
  //     previous = await getLatestVersion({ ctx: args.ctx, collection: args.collection,
  //     documentId }); await createVersion({ ctx: args.ctx, collection: args.collection,
  //     documentId, status: "draft", snapshot: extractUserFields({ doc: transformedFields }),
  //     createdBy: typeof args.auth?.user?.["_id"] === "string" ? (args.auth.user["_id"] as
  //     string) : undefined, parentVersion: previous?.version, restoredFrom: args.restoredFrom
  //     });`
  // 15. `return String(draftRow._id);`
  // Edge cases:
  // - `restoredFrom` passes straight through to `createVersion` for lineage; this function
  //   never fetches an old snapshot itself — the caller fetches it via `getVersionSnapshot`
  //   (Step 8) first, then sends its field values as `data` and its number as `restoredFrom`.
  // - Concurrent first-time `saveDraft` calls on the SAME never-drafted document could both
  //   observe `draftRow === undefined` at step 4b and both bootstrap. No unique index on
  //   `vex_publishedId` exists in Step 2's schema to prevent a second draft row; note this as
  //   a known gap, not something this function resolves.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/saveDraft.client.ts

```ts
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link saveDraft}.
 *
 * @example
 * ```tsx
 * import { saveDraft, type SaveDraftClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: saveDraft() });
 * await mutateAsync({ collection: "posts", id: postId, data: { title: "Draft title" } });
 * ```
 */
export interface SaveDraftClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericMutationClientParams {
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /** The document id currently loaded (published row's id, or an active draft's own id). */
  id: GenericId<TCollectionSlug>;
  /** Partial field values to merge into the draft row. */
  data: Record<string, unknown>;
  /** The version number this save restores from, when reverting to an older snapshot. */
  restoredFrom?: number;
}

/**
 * Returns a `mutationFn` for saving a draft in a VexCMS versioned collection.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.saveDraft)`. Call at the top
 * level of a React component (obeys the Rules of Hooks); pass the return
 * value as `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `saveDraft` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link SaveDraftClientArgs} for the typed args shape.
 */
export function saveDraft() {
  // TODO: implement
  // 1. `return useConvexMutation(vexConvexApi.versions.saveDraft);` — direct pass-through,
  //    mirrors `update()` in `update/client.ts`. `vexConvexApi.versions.saveDraft` is
  //    registered by Step 9 (`api/convex.ts`'s `versions` block) — not this file's concern.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/saveDraft.server.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { defineCollection, text } from "../../index";

/**
 * `posts` here is declared with `versions: { drafts: true }` — the shared fixture
 * table (`api/test/convex/schema.ts`, extended by Step 4) already carries
 * `vex_status`/`vex_publishedAt`/`vex_publishedId` + `vex_versions`; this config
 * object only needs to opt this test's collection into the draft workflow.
 */
const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("saveDraft (server)", () => {
  test("bootstraps a draft row on first edit of a published document, snapshotting v1 published", async () => {
    // TODO: implement
    // 1. `t.run`: insert a "posts" row directly with `vex_status: "published"`, no
    //    `vex_publishedId`, known `title`/`slug`.
    // 2. Call `saveDraft({ ctx, config: fixtureConfig, collection: "posts", id: publishedId,
    //    data: { title: "Edited" } })`.
    // 3. Assert the returned id is a DIFFERENT row than `publishedId`.
    // 4. Assert `ctx.db.get(returnedId)` has `vex_status: "draft"`, `vex_publishedId ===
    //    publishedId`, `title === "Edited"`, `slug` unchanged (carried from the published row).
    // 5. Assert the published row is UNTOUCHED — its `title` still reads the original value.
    // 6. Assert `vex_versions` has exactly one row for this document, `status: "published"`,
    //    `snapshot.title` equal to the ORIGINAL title (not "Edited").
    throw new Error("Not implemented");
  });

  test("repeated saves patch the same draft row — bootstrap fires exactly once", async () => {
    // TODO: implement
    // 1. Insert a published row; call `saveDraft` twice with different `data`.
    // 2. Assert both calls return the SAME id.
    // 3. Assert exactly one "posts" row has `vex_publishedId === publishedId` — no second draft.
    // 4. Assert `vex_versions` has exactly one `"published"`-status row (from the first call's
    //    bootstrap) and exactly two `"draft"`-status rows (one per `saveDraft` call).
    throw new Error("Not implemented");
  });

  test("saving a never-published document patches it directly — no bootstrap, no second row", async () => {
    // TODO: implement
    // 1. Insert a "posts" row with `vex_status: "draft"`, no `vex_publishedId`.
    // 2. Call `saveDraft({ ..., id: draftId, data: { title: "First real content" } })`.
    // 3. Assert the returned id equals `draftId`.
    // 4. Assert `vex_versions` has exactly one `"draft"`-status row and ZERO `"published"`-status
    //    rows for this document — the bootstrap-snapshot branch never fires when nothing was
    //    ever published.
    throw new Error("Not implemented");
  });

  test("a role restricted to one field on update carries the SAME restriction on saveDraft", async () => {
    // TODO: implement
    // 1. Build a `VexAccessConfig` (`enabled: true`, one role) whose `posts.saveDraft` check
    //    is a per-document callback resolving to a `FieldPermissionMap` permitting only
    //    `title` (mirrors `update.server.test.ts`'s existing per-field regression test).
    // 2. Insert a published row; `saveDraft({ ..., data: { title: "ok" } })` by that role
    //    succeeds.
    // 3. `saveDraft({ ..., data: { slug: "not-allowed" } })` by the same role rejects with
    //    `VexAccessError` naming `field: "slug"`.
    // 4. Assert the draft row's `slug` is UNCHANGED after the rejected call.
    throw new Error("Not implemented");
  });

  test("strips reserved version fields from the incoming data payload before merging", async () => {
    // TODO: implement
    // 1. Insert a published row; call `saveDraft` with `data: { title: "ok", vex_status:
    //    "published", vex_publishedId: publishedId }`.
    // 2. Assert the resulting draft row still has `vex_status: "draft"` — the reserved keys
    //    in `data` were dropped before the merge, not written.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 6 — `publish` `[dev]`

- [ ] `packages/core/src/api/versions/publish.server.ts` — gate on `publish` with `changes: args.data`. Merge the draft row's current fields with `args.data` (authoritative; matches `update`'s merge, no `JSON.stringify` comparison). Run `getCollectionInputSchema({ collection })` WITHOUT `partial` (decision 2 — same strength as `create`) plus `validateFields` over every key; on failure throw naming the missing/invalid field(s) and do not write anything. On success, two paths: never-published draft (`vex_publishedId === undefined`) ⇒ patch the draft row in place (`vex_status: "published"`, `vex_publishedAt: now`); draft with a parent ⇒ `emitVersion(published, status: "published")` for the superseded state, `patch(published, { ...userFields, vex_publishedAt: now })`, `delete(draftRow)`. **The published row's `_id` is never destroyed** (design-review §2.2). Dispatch `beforeChange` before validation, same ordering as `create`/`update`.
- [ ] `packages/core/src/api/versions/publish.client.ts`
- [ ] `packages/core/src/api/versions/publish.server.test.ts` — published `_id` is identical before and after a publish cycle; a relationship pointing at it still resolves; draft row is gone; publishing a draft missing a required field is rejected and names the field; the stored published document is unchanged when rejection occurs.

#### packages/core/src/api/versions/publish.server.ts

```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { getCollectionInputSchema, validateFields } from "../../collections";
import { resolveAccessCall, stampUpdatedAt } from "../utils";
import { TDocument } from "../convex";
import { createVersion, getLatestVersion } from "../../versioning/model";
import { extractUserFields } from "../../versioning/extractUserFields";
import type { GenericVersionsMutationServerArgs, VersionsDataInput } from "./types";

/**
 * Server-side args for `publish`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface PublishServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericVersionsMutationServerArgs<DataModel, TCollectionSlug> {
  /** The document id currently loaded — an active draft's own id, or the published row's id. */
  id: GenericId<TCollectionSlug>;
  /** Last-minute field edits to merge in before this publish, on top of the draft's stored content. */
  data: VersionsDataInput<DataModel>;
}

/**
 * Promotes a document's active draft to published. Server-side only.
 *
 * Runs the same pipeline shape as `saveDraft`/`update`
 * (`hasPermission → merge → beforeChange → validate → validateFields → write`),
 * with the one deliberate divergence decision 2 requires: validation here is
 * STRICT (`getCollectionInputSchema` without `partial`, `validateFields` over
 * EVERY key) — matching `create`'s strength, not `update`'s lenient one — since a
 * draft is allowed to be incomplete but a published document is not.
 *
 * Two distinct write shapes depending on whether the draft has ever been
 * published before (see design-review.md §2.1–2.2): a never-published draft is
 * patched in place, keeping its own `_id`; a draft with a published parent has
 * its fields copied onto that parent and is then deleted — the published row's
 * `_id` is **never** destroyed, since it is the externally-referenced identity
 * every `relationship` field, permalink, and live-preview URL depends on.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, collection, id, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to the published row's `_id` as a string (stable across every publish).
 * @throws {ConvexError} When `collection`/`config` or the target document cannot be resolved,
 *   when there is no draft to publish, or when the merged document fails strict validation
 *   (naming the invalid/missing field(s); nothing is written on this path).
 * @throws {VexAccessError} When the caller is not permitted to publish this document.
 * @example
 * ```ts
 * import { publish } from "@vexcms/core/server";
 *
 * export const publishPost = mutation({
 *   args: { id: v.id("posts"), data: v.any() },
 *   handler: (ctx, args) =>
 *     publish({ ctx, config, collection: "posts", id: args.id, data: args.data }),
 * });
 * ```
 */
export async function publish<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: PublishServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  // TODO: implement
  // 1. Resolve the target collection — identical guard to `saveDraft.server.ts` step 1:
  //    `const collection = args.config?.collections.find((c) => c.slug === args.collection);
  //    if (!args.config || !collection) throw new ConvexError(...)`. Narrows `args.config`
  //    non-null for the rest of the function.
  // 2. Defense-in-depth: `const data = extractUserFields({ doc: args.data });` — same reserved-
  //    field stripping as `saveDraft` step 2, applied to this call's `data` too.
  // 3. `const targetRow = await args.ctx.db.get(args.id);`
  //    a. `null` → throw `ConvexError(`No document found for id "${args.id}" in collection
  //       "${args.collection}"`)`.
  // 4. Resolve the draft row being published — `publish` always needs one:
  //    a. `targetRow.vex_status === "draft"` → `draftRow = targetRow`.
  //    b. else → `draftRow = await findDraftRow({ ctx: args.ctx, collection: args.collection,
  //       publishedId: targetRow._id });`
  //    c. `draftRow === undefined` → throw `ConvexError("No draft to publish for this
  //       document.")` — Step 12's Publish button is gated behind an active draft, so reaching
  //       here means a stale client state, not a normal path.
  // 5. Permission gate — same `resolveAccessCall` + `hasPermission` shape as `saveDraft` step
  //    5, but `defaultAction: DRAFT_ACTIONS.publish` and `data: draftRow` (never `undefined`
  //    here — step 4c already ruled that out). `changes: data`.
  // 6. Merge, identical destructure-and-spread as `saveDraft` step 7, against `draftRow` and
  //    `data`, producing `mergedFields`.
  // 7. `beforeChange` dispatch — identical to `saveDraft` step 8 (`operation: "update"`; this
  //    is not a new hook operation kind). Runs even though the draft's content may already
  //    have passed through `beforeChange` on a prior `saveDraft` — re-running is idempotent and
  //    picks up anything `args.data` changed on this call.
  // 8. STRICT validation (decision 2 — the one deliberate divergence from `saveDraft`'s
  //    lenient mode, matching `create`'s strength): `const parsed = getCollectionInputSchema({
  //    collection }).safeParse(transformedFields);` — no `partial: true`.
  //    a. `!parsed.success` → throw `new ConvexError({ message: "Validation failed", errors:
  //       parsed.error.message })` and return — nothing has been written yet, so "do not write
  //       anything" (spec-tasks.md Step 6) holds by construction, not by an explicit rollback.
  // 9. `await validateFields({ collection, doc: transformedFields, keys:
  //    Object.keys(transformedFields), ctx: args.ctx });` → EVERY key, matching `create`'s
  //    `keys: Object.keys(doc)`, not `update`'s changed-keys-only.
  // 10. `const now = Date.now();`
  // 11. Branch on `draftRow.vex_publishedId`:
  //     a. `undefined` (never-published draft — promote in place):
  //        `await args.ctx.db.patch(draftRow._id, stampUpdatedAt({ collection:
  //        args.collection, config: args.config, data: { ...transformedFields, vex_status:
  //        "published" as const, vex_publishedAt: now } }) as never); const publishedRowId =
  //        draftRow._id;`
  //        → No `createVersion` call in this branch. `saveDraft`'s step 14 already recorded a
  //        `"draft"`-status history row for every prior autosave on this document, so history
  //        is not empty here — it just has no row explicitly marked `"published"` until the
  //        NEXT publish cycle's branch (b) supersedes it. This is spec-tasks.md Step 6's
  //        literal scope; do not add an `emitVersion` call back into this branch without
  //        revisiting that decision.
  //     b. defined (draft with a published parent — copy fields onto it, then delete draft):
  //        `const published = await args.ctx.db.get(draftRow.vex_publishedId); if (!published)
  //        throw new ConvexError("Dangling vex_publishedId — the published row this draft
  //        points at no longer exists.");`
  //        `const documentId = String(published._id); const previous = await
  //        getLatestVersion({ ctx: args.ctx, collection: args.collection, documentId });`
  //        `await createVersion({ ctx: args.ctx, collection: args.collection, documentId,
  //        status: "published", snapshot: extractUserFields({ doc: published }), publishedAt:
  //        published.vex_publishedAt, parentVersion: previous?.version });` → archives the
  //        state about to be overwritten, BEFORE the patch below changes it.
  //        `await args.ctx.db.patch(published._id, stampUpdatedAt({ collection:
  //        args.collection, config: args.config, data: { ...transformedFields, vex_publishedAt:
  //        now } }) as never);`
  //        `await args.ctx.db.delete(draftRow._id); const publishedRowId = published._id;`
  // 12. `return String(publishedRowId);`
  // Edge cases:
  // - `transformedFields` is written in FULL in both branches (not `changedKeys`-only like
  //   `saveDraft`/`update`) — `args.data` can carry last-minute edits, step 8's strict schema
  //   already demands every field be present and valid, so this matches `create`'s
  //   "write everything" pattern rather than `update`'s "write only what changed" one; it also
  //   guarantees `args.data` edits are never silently dropped.
  // - The published row's `_id` is identical before and after either branch: (a) never had a
  //   second row; (b) patches `published` in place and only ever deletes `draftRow`. No path
  //   deletes or re-inserts the published row.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/publish.client.ts

```ts
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link publish}.
 *
 * @example
 * ```tsx
 * import { publish, type PublishClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: publish() });
 * await mutateAsync({ collection: "posts", id: draftId, data: {} });
 * ```
 */
export interface PublishClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericMutationClientParams {
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /** The document id currently loaded — an active draft's own id, or the published row's id. */
  id: GenericId<TCollectionSlug>;
  /** Last-minute field edits to merge in before this publish. */
  data: Record<string, unknown>;
}

/**
 * Returns a `mutationFn` for publishing a VexCMS versioned collection's active draft.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.publish)`. Call at the top
 * level of a React component (obeys the Rules of Hooks); pass the return
 * value as `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `publish` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link PublishClientArgs} for the typed args shape.
 */
export function publish() {
  // TODO: implement
  // 1. Return `useConvexMutation(vexConvexApi.versions.publish);` — direct pass-through,
  //    mirrors `saveDraft()` in `saveDraft.client.ts`. `vexConvexApi.versions.publish` is
  //    registered by Step 9 — not this file's concern.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/publish.server.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { publish } from "./publish.server";
import { defineCollection, text } from "../../index";

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text({ required: true }) },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("publish (server)", () => {
  test("preserves the published row's _id across a publish cycle, and a stored reference still resolves", async () => {
    // TODO: implement
    // 1. Insert a published "posts" row; insert a SECOND "posts" row whose `author`/relationship
    //    field (or a plain field storing the id, if simpler) points at the first row's id.
    // 2. `saveDraft` an edit against the published row (creates a draft pointing at it).
    // 3. `publish({ ctx, config: fixtureConfig, collection: "posts", id: draftRow._id, data: {}
    //    })`.
    // 4. Assert the returned id equals the ORIGINAL published id.
    // 5. Assert `ctx.db.get(publishedId)` now reflects the draft's edited content and
    //    `vex_status: "published"`.
    // 6. Assert the draft row no longer exists (`ctx.db.get` returns `null`).
    // 7. Assert the second row's stored reference still equals `publishedId` and still resolves
    //    via `ctx.db.get`.
    throw new Error("Not implemented");
  });

  test("publishing a never-published draft promotes it in place, keeping its own _id", async () => {
    // TODO: implement
    // 1. Insert a "posts" row with `vex_status: "draft"`, no `vex_publishedId`, all required
    //    fields present.
    // 2. `publish({ ..., id: draftId, data: {} })`.
    // 3. Assert the returned id equals `draftId`.
    // 4. Assert `ctx.db.get(draftId)` now has `vex_status: "published"` and a numeric
    //    `vex_publishedAt`.
    // 5. Assert `vex_versions` has NO `"published"`-status row for this document yet (this
    //    branch deliberately emits none — see the implementation's inline note).
    throw new Error("Not implemented");
  });

  test("publishing a draft with a parent archives the superseded state with its original publishedAt", async () => {
    // TODO: implement
    // 1. Insert a published row with a known `vex_publishedAt: T0` and known field values.
    // 2. `saveDraft` an edit (creates a draft row pointing at it).
    // 3. `publish(...)` the draft.
    // 4. Assert `vex_versions` gained a `"published"`-status row whose `snapshot` matches the
    //    PRE-publish published content, and whose `publishedAt` equals `T0` — not `Date.now()`
    //    at publish time.
    throw new Error("Not implemented");
  });

  test("rejects a draft missing a required field, naming it, without writing anything", async () => {
    // TODO: implement
    // 1. Insert a published row; `saveDraft` a partial edit that leaves `slug` unset (lenient
    //    mode allows this since `slug` was already set on the published row — instead, clear
    //    it via a `data: { slug: "" }` or equivalent gap the field's `validate`/required check
    //    rejects).
    // 2. `publish(...)` the draft with `data: {}`.
    // 3. Assert the call throws `ConvexError`, and its `errors` payload names `slug`.
    // 4. Assert the published row's stored content is BYTE-FOR-BYTE unchanged, and the draft
    //    row STILL EXISTS.
    throw new Error("Not implemented");
  });

  test("throws when there is no draft to publish", async () => {
    // TODO: implement
    // 1. Insert a published row with no draft.
    // 2. `publish({ ..., id: publishedId, data: {} })`.
    // 3. Assert it throws `ConvexError`, and neither "posts" nor `vex_versions` changed.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 7 — `unpublish` `[dev]`

- [ ] `packages/core/src/api/versions/unpublish.server.ts` — gate on `unpublish` with `changes: undefined` (no field values move, only status). Throw when a draft row exists ("publish or discard the active draft first"). Flip the published row to `vex_status: "draft"`; emit a history row with `publishedAt` carried forward (never rewritten backwards).
- [ ] `packages/core/src/api/versions/unpublish.client.ts`
- [ ] `packages/core/src/api/versions/unpublish.server.test.ts` — rejects with an outstanding draft; invariant holds that at most one draft row exists per document.

#### packages/core/src/api/versions/unpublish.server.ts

```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";
import { createVersion, findDraftRow, getLatestVersion } from "../../versioning/model";
import { extractUserFields } from "../../versioning/extractUserFields";
import type { GenericVersionsMutationServerArgs } from "./types";

/**
 * Server-side args for `unpublish`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface UnpublishServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericVersionsMutationServerArgs<DataModel, TCollectionSlug> {
  /** The published row's id. */
  id: GenericId<TCollectionSlug>;
}

/**
 * Flips a published document back to `"draft"` status and records a history row.
 * Server-side only. No field values move — this is a status-only transition, so
 * unlike `saveDraft`/`publish` there is no `data` payload and no field-level
 * permission gating (`changes: undefined`).
 *
 * **Rejects while an active draft row exists** for the document (design-review
 * §6.1): unpublishing under an outstanding draft would leave two rows in a
 * contradictory state — a `draft` row whose `vex_publishedId` points at a row
 * that is no longer published. The caller must publish or discard that draft
 * first.
 *
 * The document's `vex_publishedAt` (both on the live row and the emitted history
 * row) is carried forward unchanged, never reset — it records "was this ever
 * live," which stays true after an unpublish.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, collection, id }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @throws {ConvexError} When `collection`/`config` or the document cannot be resolved, when
 *   the target row is not currently published, or when an active draft row exists.
 * @throws {VexAccessError} When the caller is not permitted to unpublish this document.
 * @example
 * ```ts
 * import { unpublish } from "@vexcms/core/server";
 *
 * export const unpublishPost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => unpublish({ ctx, config, collection: "posts", id: args.id }),
 * });
 * ```
 */
export async function unpublish<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: UnpublishServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  // TODO: implement
  // 1. Resolve the target collection — identical guard to `saveDraft.server.ts` step 1:
  //    `const collection = args.config?.collections.find((c) => c.slug === args.collection);
  //    if (!args.config || !collection) throw new ConvexError(...)`. Narrows `args.config`
  //    non-null for the rest of the function.
  // 2. `const publishedRow = await args.ctx.db.get(args.id);`
  //    a. `null` → throw `ConvexError(`No document found for id "${args.id}" in collection
  //       "${args.collection}"`)`.
  // 3. `if (publishedRow.vex_status !== "published") throw new ConvexError("Only a published
  //    document can be unpublished.");`
  // 4. Permission gate: `if (args.config.access !== undefined) { const { access, action,
  //    resource } = resolveAccessCall({ config: args.config, access: args.access,
  //    defaultAction: DRAFT_ACTIONS.unpublish, resource: args.collection }); hasPermission({
  //    throwOnDenied: true, access, user: args.auth?.user ?? null, organization:
  //    args.auth?.organization, resource, action, data: publishedRow, changes: undefined }); }`
  //    → `changes: undefined` is deliberate: no field values move, only `vex_status`.
  //    `unpublish` is not in `hasPermission`'s built-in payload-bearing action set (only
  //    `create`/`update`, or a declared custom mutation action), so omitting `changes` here
  //    never trips the "field map but no changes supplied" throw — a field-map-shaped
  //    `unpublish` check simply projects (grants), which is correct for a status-only action.
  // 5. Reject-with-outstanding-draft rule (design-review §6.1): `const existingDraft = await
  //    findDraftRow({ ctx: args.ctx, collection: args.collection, publishedId:
  //    publishedRow._id }); if (existingDraft !== undefined) throw new ConvexError("Publish or
  //    discard the active draft first.");`
  // 6. History: `const documentId = String(publishedRow._id); const previous = await
  //    getLatestVersion({ ctx: args.ctx, collection: args.collection, documentId }); await
  //    createVersion({ ctx: args.ctx, collection: args.collection, documentId, status:
  //    "published", snapshot: extractUserFields({ doc: publishedRow }), publishedAt:
  //    publishedRow.vex_publishedAt, parentVersion: previous?.version });` → `publishedAt` is
  //    COPIED from the row's own stored value, never `Date.now()` — "carried forward, never
  //    rewritten backwards."
  // 7. `await args.ctx.db.patch(publishedRow._id, { vex_status: "draft" as const });` — status
  //    only. No `stampUpdatedAt`: `vex_status` is a reserved system field (Step 1's
  //    `RESERVED_COLLECTION_FIELDS`), not a user field, so `updatedAt` (which tracks USER field
  //    edits) is intentionally left alone. `vex_publishedAt` on the live row is also left
  //    untouched by this patch, for the same "never rewritten backwards" reason as step 6.
  // Edge cases:
  // - After this patch, `publishedRow` has `vex_status: "draft"` and `vex_publishedId:
  //   undefined` — indistinguishable in shape from a document that was NEVER published. A
  //   later `publish()` call against it therefore takes the never-published (promote-in-place)
  //   branch, which is correct: there is no third row to reconcile.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/unpublish.client.ts

```ts
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link unpublish}.
 *
 * @example
 * ```tsx
 * import { unpublish, type UnpublishClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: unpublish() });
 * await mutateAsync({ collection: "posts", id: publishedId });
 * ```
 */
export interface UnpublishClientArgs<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericMutationClientParams {
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /** The published row's id. */
  id: GenericId<TCollectionSlug>;
}

/**
 * Returns a `mutationFn` for unpublishing a VexCMS versioned collection's document.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.unpublish)`. Call at the top
 * level of a React component (obeys the Rules of Hooks); pass the return
 * value as `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `unpublish` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link UnpublishClientArgs} for the typed args shape.
 */
export function unpublish() {
  // TODO: implement
  // 1. Return `useConvexMutation(vexConvexApi.versions.unpublish);` — direct pass-through,
  //    mirrors `publish()` in `publish.client.ts`. `vexConvexApi.versions.unpublish` is
  //    registered by Step 9 — not this file's concern.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/unpublish.server.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { unpublish } from "./unpublish.server";
import { defineCollection, text } from "../../index";

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("unpublish (server)", () => {
  test("rejects while a draft row exists for the document", async () => {
    // TODO: implement
    // 1. Insert a published row; `saveDraft` an edit (creates a draft).
    // 2. `unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId })`.
    // 3. Assert it throws `ConvexError`.
    // 4. Assert the published row's `vex_status` is STILL `"published"` — no partial flip.
    throw new Error("Not implemented");
  });

  test("flips the published row to draft and records a history row with publishedAt carried forward", async () => {
    // TODO: implement
    // 1. Insert a published row with a known `vex_publishedAt: T0`, no draft.
    // 2. `unpublish({ ..., id: publishedId })`.
    // 3. Assert `ctx.db.get(publishedId).vex_status === "draft"` and `vex_publishedAt` is STILL
    //    `T0` — not cleared, not bumped to `Date.now()`.
    // 4. Assert `vex_versions` gained one `"published"`-status row whose `publishedAt` equals
    //    `T0`.
    throw new Error("Not implemented");
  });

  test("round-trips through a second saveDraft without producing a second draft row", async () => {
    // TODO: implement
    // 1. Unpublish a document (as in the previous test), leaving one row with `vex_status:
    //    "draft"`, `vex_publishedId: undefined`.
    // 2. `saveDraft` an edit against that same row's id.
    // 3. Assert the returned id equals that SAME row's id — confirms the never-published
    //    (direct-patch) branch of `saveDraft` fires, not the bootstrap branch, and that at
    //    most one draft row ever exists per document, even across an unpublish cycle.
    throw new Error("Not implemented");
  });

  test("throws when the target row is not published", async () => {
    // TODO: implement
    // 1. Insert a "posts" row with `vex_status: "draft"`.
    // 2. `unpublish({ ..., id: draftId })`.
    // 3. Assert it throws `ConvexError`.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 8 — History reads + `deleteVersion` `[dev]`

Why: `master` shipped `getVersionSnapshot`, `listVersions`, and `deleteVersion` with either zero authorization or a check against the wrong action (design-review.md §7: `getVersionSnapshot`/`listVersions` had **no** guard at all, and history-pruning was never distinguished from `update`, so any editor allowed to save a draft could also permanently destroy history). `getVersionSnapshot` and `listVersions` return draft content, so the `readDrafts` gate must run **before** a single `vex_versions` row is read — never as a post-hoc filter. Decision 3 (unbounded history, no `maxPerDoc`) means there is no automatic pruning endpoint; `deleteVersion` is the only way a row leaves `vex_versions`, one at a time, gated on the dedicated `deleteVersions` action Step 3 added.

> Fixture note: these tests assume the shared test fixture (`packages/core/src/api/test/convex/schema.ts`, extended by Step 4) declares a versioned `posts` table (`vex_status`, `vex_publishedAt`, `vex_publishedId`, `by_status`, `by_published`) and a `vex_versions` table (`collection`, `documentId`, `version`, `status`, `snapshot`, `createdBy`, `parentVersion`, `restoredFrom`, `publishedAt`, indexed `by_document_version` `["collection", "documentId", "version"]`) — the same fixture Steps 5–7 write against, so every versions test converges on one schema.

- [ ] `packages/core/src/api/versions/types.ts` — `GenericVersionsQueryServerArgs<DataModel, TCollectionSlug>`, the query-shaped counterpart to Step 5's `GenericVersionsMutationServerArgs`.
- [ ] `packages/core/src/api/versions/listVersions.server.ts`, `packages/core/src/api/versions/getVersionSnapshot.server.ts` — both gate on `readDrafts`.
- [ ] `packages/core/src/api/versions/deleteVersion.server.ts` — gates on `deleteVersions`.
- [ ] `packages/core/src/api/versions/listVersions.client.ts`, `packages/core/src/api/versions/getVersionSnapshot.client.ts`, `packages/core/src/api/versions/deleteVersion.client.ts` — matching client files.
- [ ] `packages/core/src/api/convex.ts` — `VexListVersionsArgs` / `VexGetVersionSnapshotArgs` / `VexDeleteVersionArgs` arg interfaces and this step's three `vexConvexApi` entries (`saveDraft`/`publish`/`unpublish`'s entries were added in Steps 5–7, one per introducing step, exactly like `globals`'s surface in this file — so each `.client.ts` above never imports an entry a later step creates).
- [ ] `packages/core/src/api/versions/listVersions.server.test.ts`, `packages/core/src/api/versions/getVersionSnapshot.server.test.ts`, `packages/core/src/api/versions/deleteVersion.server.test.ts` — a role without `readDrafts` receives no draft content; a role without `deleteVersions` cannot delete a version row.

#### packages/core/src/api/versions/types.ts

Existing file (created by Step 5); 1 edit — everything else Step 5 introduces is unchanged.

**1 — query base type, added alongside `GenericVersionsMutationServerArgs`.** Same field set as the mutation base (`access?`, `auth?`, `config?`, `collection`, `environmentId?`) but a query context, mirroring how `GenericGlobalsQueryServerArgs`/`GenericGlobalsMutationServerArgs` sit side by side in `globals/types.ts`.

```ts
/**
 * Base server-side args shared by every versions **query** function
 * (`listVersions`, `getVersionSnapshot`). Each concrete function extends
 * this with its own inputs (`documentId`, plus `limit` or `version`).
 *
 * `config` is optional (not `GenericQueryServerParams`'s convention exactly,
 * but the same shape) — a missing `config` just means RBAC is off for this
 * call, mirroring `get`/`find`'s existing `args.config?.access !== undefined`
 * guard rather than introducing a second "config required" failure mode.
 *
 * @typeParam TDataModel - The project's generated Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface GenericVersionsQueryServerArgs<
  TDataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /**
   * Resolved caller identity for permission checks — `{ user, organization? }`,
   * or omitted when access control is off. Never a client argument; the
   * `versionsApi` factory resolves it from `ctx.auth` per request.
   */
  auth?: VexApiAuth;
  /** Convex query context (read-only DB access). */
  ctx: GenericQueryCtx<TDataModel>;
  /** The resolved `VexConfig`. Omitted → RBAC is off for this call. */
  config?: VexConfig;
  /** The versioned collection slug. */
  collection: TCollectionSlug;
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<QueryCallActionFor<TCollectionSlug>>;
  /**
   * Accepted and ignored — reserved for future multi-environment support,
   * kept for parity with the mutation base (design-review.md §9).
   */
  environmentId?: string;
}
```

#### packages/core/src/api/versions/listVersions.server.ts

New file, complete.

```ts
import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { AccessCallOptions, QueryCallActionFor } from "../types";
import type { GenericVersionsQueryServerArgs } from "./types";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";
import { listVersions as listVersionRows } from "../../versioning/model";

/**
 * Default history page size when `limit` is omitted. NOT a storage cap —
 * decision 3 (spec-tasks.md) rules out `maxPerDoc`; this only bounds one
 * page of the history dropdown (design-review.md §6.3: these rows are read
 * only when the history menu opens, never on the public path).
 */
const DEFAULT_VERSION_LIST_LIMIT = 50;

/**
 * Server-side args for `listVersions`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface ListVersionsServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends GenericVersionsQueryServerArgs<DataModel, TCollectionSlug> {
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
  /** History sequence number within `(collection, documentId)`. */
  version: number;
  /** Lifecycle state this version was recorded at. */
  status: "draft" | "published";
  /** The user id that produced this version, or `null` when unattributed. */
  createdBy: string | null;
  /** Row creation timestamp (`_creationTime`). */
  createdAt: number;
  /** When this version was published, or `null` for a version never published. */
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
 * @param props - `{ ctx, config?, auth?, collection, documentId, limit? }`.
 * @returns Version summaries, newest first.
 * @throws {VexAccessError} When the caller's roles lack `readDrafts` on `collection`.
 * @throws {ConvexError} When no document exists at `documentId` in `collection`.
 */
export async function listVersions<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: ListVersionsServerArgs<DataModel, TCollectionSlug>): Promise<VersionSummary[]> {
  // TODO: implement
  // 1. Load the parent document: `await props.ctx.db.get(props.documentId as GenericId<TCollectionSlug>)`.
  //    a. `null`/`undefined` → throw `new ConvexError(\`No document found at "${props.documentId}" in collection "${props.collection}"\`)`.
  // 2. When `props.config?.access !== undefined`, gate BEFORE touching `vex_versions`:
  //    a. `const { access, action, resource } = resolveAccessCall({ config: props.config, access: props.access, defaultAction: DRAFT_ACTIONS.readDrafts, resource: props.collection })`.
  //    b. `hasPermission({ throwOnDenied: true, access, user: props.auth?.user ?? null, organization: props.auth?.organization, resource, action, data: doc })`
  //       → throws `VexAccessError` here; step 3 never runs for a denied caller.
  // 3. Delegate to the Step 4 model helper: `const rows = await listVersionRows({ ctx: props.ctx, collection: props.collection, documentId: props.documentId, limit: props.limit ?? DEFAULT_VERSION_LIST_LIMIT })` — already newest-first via `by_document_version` + `.order("desc")`.
  // 4. Map each row to a `VersionSummary`, never including `snapshot`:
  //    `{ version: row.version, status: row.status, createdBy: row.createdBy ?? null, createdAt: row._creationTime, publishedAt: row.publishedAt ?? null }`.
  // Edge cases:
  // - A document with no history yet (first-edit bootstrap hasn't run) → `[]`, not an error.
  // - `limit` omitted → `DEFAULT_VERSION_LIST_LIMIT`, not unbounded (decision 3 caps STORAGE growth, not one query's page size).
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/getVersionSnapshot.server.ts

New file, complete.

```ts
import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericVersionsQueryServerArgs } from "./types";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";
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
> extends GenericVersionsQueryServerArgs<DataModel, TCollectionSlug> {
  /** The published row's stable `_id`, as a string. See {@link ListVersionsServerArgs}. */
  documentId: string;
  /** The version number to fetch, as returned by `listVersions`. */
  version: number;
}

/** Full content of one history row, for restore preview. */
export interface VersionSnapshotResult {
  /** The `extractUserFields`-stripped document content at this version. */
  snapshot: Record<string, unknown>;
  /** Lifecycle state this version was recorded at. */
  status: "draft" | "published";
}

/**
 * Fetches one version's full content, for restore preview — the client
 * hydrates the form from `snapshot` and calls `saveDraft({ restoredFrom })`
 * (restore stays client-side and non-destructive, design-review.md §10).
 *
 * Gated on `readDrafts` — this is the endpoint that returns full draft
 * content, and `master` shipped it with zero authorization
 * (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ ctx, config?, auth?, collection, documentId, version }`.
 * @returns The version's snapshot and recorded status.
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
  // 1. Load the parent document (identical resolution to `listVersions` step 1) →
  //    `ConvexError` if missing.
  // 2. When `props.config?.access !== undefined`, gate on `DRAFT_ACTIONS.readDrafts`
  //    (same shape as `listVersions` step 2) — runs BEFORE step 3 reads the snapshot
  //    row; this endpoint returns FULL draft content, so the throw must land before a
  //    single field of it is read.
  // 3. `const row = await getVersion({ ctx: props.ctx, collection: props.collection, documentId: props.documentId, version: props.version })`.
  //    a. `row === null` → throw `new ConvexError(\`No version ${props.version} found for document "${props.documentId}" in collection "${props.collection}"\`)`.
  // 4. `return { snapshot: row.snapshot, status: row.status }`.
  // Edge cases:
  // - `snapshot` is stored as `v.any()` (design-review.md §9 "snapshots stored as-is")
  //   — this function does NOT re-validate it against the collection's current Zod
  //   schema; the restore flow (Step 13) hydrates the form and lets normal field
  //   validation catch drift on the next save.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/deleteVersion.server.ts

New file, complete.

```ts
import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericVersionsMutationServerArgs } from "./types";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";
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
> extends GenericVersionsMutationServerArgs<DataModel, TCollectionSlug> {
  /** The published row's stable `_id`, as a string. See {@link ListVersionsServerArgs}. */
  documentId: string;
  /** The version number to permanently delete. */
  version: number;
}

/**
 * Permanently deletes one `vex_versions` row. Prunes history only — never
 * the live draft or published row (that's `remove`'s cascade, Step 11).
 * Manual, one row at a time — decision 3 rules out an automatic pruning
 * endpoint.
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
 * @param props - `{ ctx, config?, auth?, collection, documentId, version }`.
 * @returns Nothing — resolves once the row is deleted.
 * @throws {VexAccessError} When the caller's roles lack `deleteVersions` on `collection`.
 * @throws {ConvexError} When no document exists at `documentId`, or `version` doesn't exist.
 */
export async function deleteVersion<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: DeleteVersionServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  // TODO: implement
  // 1. Load the parent document (identical resolution to `listVersions` step 1) →
  //    `ConvexError` if missing. Checked first, same ordering as `listVersions`/
  //    `getVersionSnapshot`, so a denied caller cannot learn whether a given
  //    `version` number exists before their permission is verified.
  // 2. When `props.config?.access !== undefined`, gate on `DRAFT_ACTIONS.deleteVersions`
  //    (NEVER `update`/`readDrafts`):
  //    a. `const { access, action, resource } = resolveAccessCall({ config: props.config, access: props.access, defaultAction: DRAFT_ACTIONS.deleteVersions, resource: props.collection })`.
  //    b. `hasPermission({ throwOnDenied: true, access, user: props.auth?.user ?? null, organization: props.auth?.organization, resource, action, data: doc })`.
  // 3. `const row = await getVersion({ ctx: props.ctx, collection: props.collection, documentId: props.documentId, version: props.version })`.
  //    a. `row === null` → throw `new ConvexError(\`No version ${props.version} found for document "${props.documentId}" in collection "${props.collection}"\`)`.
  // 4. `await props.ctx.db.delete(row._id)`.
  // Edge cases:
  // - Deleting a version a LATER row's `restoredFrom` points at is legal — lineage
  //   pointers are informational, not foreign keys; a broken pointer just means "the
  //   source no longer has its own history entry," not a dangling-reference error.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/listVersions.client.ts

New file, complete.

```ts
import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";

import { vexConvexApi, type VexListVersionsArgs } from "../convex";
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
 * Returns tanstack-query options for a document's version history. The
 * query itself throws for a caller lacking `readDrafts` (see
 * `VersionHistoryDropdown`, Step 13, which hides the affordance under the
 * same action so the throw path is rarely hit).
 *
 * Import from `@vexcms/core/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection, documentId, limit? }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 */
export function listVersions<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: ListVersionsClientArgs<TCollectionSlug>,
): VexQueryOptions<VexListVersionsArgs, VersionSummary[]> {
  // TODO: implement
  // 1. Cast `vexConvexApi.listVersions` to `FunctionReference<"query", "public", VexListVersionsArgs, VersionSummary[]>`
  //    (mirrors `get.client.ts`'s `funcRef` cast — one registered function serving every
  //    collection, so its return type can't narrow from the runtime `collection` string).
  // 2. `return convexQuery(funcRef, { collection: props.collection, documentId: props.documentId, limit: props.limit });`
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/getVersionSnapshot.client.ts

New file, complete.

```ts
import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";

import { vexConvexApi, type VexGetVersionSnapshotArgs } from "../convex";
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
): VexQueryOptions<VexGetVersionSnapshotArgs, VersionSnapshotResult> {
  // TODO: implement
  // 1. Cast `vexConvexApi.getVersionSnapshot` to a `FunctionReference<"query", "public", VexGetVersionSnapshotArgs, VersionSnapshotResult>`
  //    (same reasoning as `listVersions.client.ts` step 1).
  // 2. `return convexQuery(funcRef, { collection: props.collection, documentId: props.documentId, version: props.version });`
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/versions/deleteVersion.client.ts

New file, complete.

```ts
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "../convex";

/**
 * Returns a `useConvexMutation` hook bound to the `deleteVersion` Convex
 * mutation. Call the returned function as `mutationFn` inside `useMutation`.
 *
 * The mutation accepts `{ collection, documentId, version }` and throws for
 * a caller lacking `deleteVersions` — `VersionHistoryDropdown` (Step 13)
 * hides its delete affordance under the same action so the throw path is
 * rarely hit.
 *
 * Import from `@vexcms/core/client`.
 *
 * @returns A `useConvexMutation`-compatible mutation function.
 */
export function deleteVersion() {
  // TODO: implement
  // 1. `return useConvexMutation(vexConvexApi.deleteVersion);`
  //    (mirrors `globals/upsert.client.ts`'s `updateGlobal` — one-line bind, no args
  //    shaping needed since the mutation's own arg shape already matches the call site.)
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/convex.ts

Existing file; 2 edits.

**1 — arg interfaces, added after `VexUnpublishArgs` (Step 7).**

```ts
/** Args for `api.vex.listVersions`. */
export interface VexListVersionsArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  documentId: string;
  limit?: number;
  environmentId?: string;
}

/** Args for `api.vex.getVersionSnapshot`. */
export interface VexGetVersionSnapshotArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  documentId: string;
  version: number;
  environmentId?: string;
}

/** Args for `api.vex.deleteVersion`. */
export interface VexDeleteVersionArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  documentId: string;
  version: number;
  environmentId?: string;
}
```

**2 — `vexConvexApi` entries, added bare at the top level (never nested under a `versions` key — naming-conventions.md: "Factory-registered API functions use bare operation names … no `adminXxx` prefix") after the `unpublish` entry Step 7 added.**

```ts
  listVersions: anyApi.vex.listVersions as FunctionReference<
    "query",
    "public",
    VexListVersionsArgs,
    VersionSummary[]
  >,

  getVersionSnapshot: anyApi.vex.getVersionSnapshot as FunctionReference<
    "query",
    "public",
    VexGetVersionSnapshotArgs,
    VersionSnapshotResult
  >,

  deleteVersion: anyApi.vex.deleteVersion as FunctionReference<
    "mutation",
    "public",
    VexDeleteVersionArgs,
    void
  >,
```

`VersionSummary` / `VersionSnapshotResult` import into `convex.ts` alongside its other cross-file type imports at the top of the file (`import type { VersionSummary } from "./versions/listVersions.server"; import type { VersionSnapshotResult } from "./versions/getVersionSnapshot.server";`).

#### packages/core/src/api/versions/listVersions.server.test.ts

New file. `[dev]` guided stub — each `test` body names the exact fixture/assertion the real implementation must satisfy, ending `throw new Error("Not implemented")`.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";
import { defineCollection, text } from "../../index";
import { listVersions } from "./listVersions.server";

const posts = defineCollection({
  slug: "posts",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { posts: { readDrafts: true } },
    viewer: { posts: { read: true } },
  },
});

const fixtureConfig = { collections: [posts], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const editorUser = { _id: "u1", roles: ["editor"] };
const viewerUser = { _id: "u2", roles: ["viewer"] };

describe("listVersions (server)", () => {
  test("returns summaries newest-first, without snapshot content, for a caller with readDrafts", async () => {
    // TODO: implement
    // 1. `convexTest(schema, modules)`; inside `t.run`, insert a `posts` doc with
    //    `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`.
    // 2. Insert two `vex_versions` rows for `{ collection: "posts", documentId }`:
    //    `{ version: 1, status: "published", snapshot: { title: "Hello" } }` and
    //    `{ version: 2, status: "draft", snapshot: { title: "Hello (draft edit)" } }`.
    // 3. `const result = await listVersions({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", documentId });`
    // 4. → `result.map((v) => v.version)` equals `[2, 1]`.
    // 5. → no entry in `result` has a `snapshot` key.
    throw new Error("Not implemented");
  });

  test("throws for a caller without readDrafts, before reading any version row", async () => {
    // TODO: implement
    // 1. Insert a `posts` doc `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`.
    // 2. Insert one `vex_versions` row with `snapshot: { title: "Hello", secret: "draft-only-field" }`.
    // 3. → `listVersions({ ctx, config: fixtureConfig, auth: { user: viewerUser }, collection: "posts", documentId })` rejects with `VexAccessError`.
    throw new Error("Not implemented");
  });

  test("throws when the document does not exist", async () => {
    // TODO: implement
    // 1. Insert then delete a `posts` doc to get a dangling id (`otherId`).
    // 2. → `listVersions({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", documentId: otherId })` rejects.
    throw new Error("Not implemented");
  });

  test("returns [] for a document with no history yet", async () => {
    // TODO: implement
    // 1. Insert a `posts` doc `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`, no `vex_versions` rows.
    // 2. → `listVersions({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", documentId })` resolves to `[]`.
    throw new Error("Not implemented");
  });
});
```

#### packages/core/src/api/versions/getVersionSnapshot.server.test.ts

New file. `[dev]` guided stub.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";
import { defineCollection, text } from "../../index";
import { getVersionSnapshot } from "./getVersionSnapshot.server";

const posts = defineCollection({
  slug: "posts",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { posts: { readDrafts: true } },
    viewer: { posts: { read: true } },
  },
});

const fixtureConfig = { collections: [posts], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const editorUser = { _id: "u1", roles: ["editor"] };
const viewerUser = { _id: "u2", roles: ["viewer"] };

describe("getVersionSnapshot (server)", () => {
  test("returns the snapshot and status for a caller with readDrafts", async () => {
    // TODO: implement
    // 1. Insert a `posts` doc `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`.
    // 2. Insert a `vex_versions` row `{ collection: "posts", documentId, version: 1, status: "draft", snapshot: { title: "Draft body" } }`.
    // 3. `const result = await getVersionSnapshot({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", documentId, version: 1 });`
    // 4. → `result` equals `{ snapshot: { title: "Draft body" }, status: "draft" }`.
    throw new Error("Not implemented");
  });

  test("throws for a caller without readDrafts — no draft content escapes the rejection", async () => {
    // TODO: implement
    // 1. Insert a `posts` doc `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`.
    // 2. Insert a `vex_versions` row with `snapshot: { title: "Draft body", secret: "must-not-leak" }`.
    // 3. → `getVersionSnapshot({ ctx, config: fixtureConfig, auth: { user: viewerUser }, collection: "posts", documentId, version: 1 })` rejects with `VexAccessError`.
    // 4. → the rejection's stringified error does NOT contain `"must-not-leak"`.
    throw new Error("Not implemented");
  });

  test("throws when the version does not exist", async () => {
    // TODO: implement
    // 1. Insert a `posts` doc `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`, no matching `version: 99` row.
    // 2. → `getVersionSnapshot({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", documentId, version: 99 })` rejects.
    throw new Error("Not implemented");
  });
});
```

#### packages/core/src/api/versions/deleteVersion.server.test.ts

New file. `[dev]` guided stub.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";
import { defineCollection, text } from "../../index";
import { deleteVersion } from "./deleteVersion.server";

const posts = defineCollection({
  slug: "posts",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const access = defineAccess({
  roles: ["admin", "editor"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { posts: { readDrafts: true, deleteVersions: true } },
    editor: { posts: { readDrafts: true } }, // can read history, not prune it
  },
});

const fixtureConfig = { collections: [posts], access } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const adminUser = { _id: "u1", roles: ["admin"] };
const editorUser = { _id: "u2", roles: ["editor"] };

describe("deleteVersion (server)", () => {
  test("deletes the targeted version row for a caller with deleteVersions", async () => {
    // TODO: implement
    // 1. Insert a `posts` doc `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`.
    // 2. Insert a `vex_versions` row `{ collection: "posts", documentId, version: 1, status: "published", snapshot: { title: "Hello" } }` → `versionId`.
    // 3. `await deleteVersion({ ctx, config: fixtureConfig, auth: { user: adminUser }, collection: "posts", documentId, version: 1 });`
    // 4. → resolves to `undefined`.
    // 5. → `await ctx.db.get(versionId)` is `null`.
    throw new Error("Not implemented");
  });

  test("throws for a caller without deleteVersions — history is left intact", async () => {
    // TODO: implement
    // 1. Insert a `posts` doc `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`.
    // 2. Insert a `vex_versions` row `{ collection: "posts", documentId, version: 1, status: "published", snapshot: { title: "Hello" } }` → `versionId`.
    // 3. → `deleteVersion({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", documentId, version: 1 })` rejects with `VexAccessError`.
    // 4. → `await ctx.db.get(versionId)` is NOT `null` (row survives the denied attempt).
    throw new Error("Not implemented");
  });

  test("throws when the version does not exist", async () => {
    // TODO: implement
    // 1. Insert a `posts` doc `{ title: "Hello", slug: "hello", vex_status: "published" }` → `documentId`, no matching `version: 99` row.
    // 2. → `deleteVersion({ ctx, config: fixtureConfig, auth: { user: adminUser }, collection: "posts", documentId, version: 99 })` rejects.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 9 — `versionsApi` factory `[dev]`

Why: Registration point; mirrors `globalsApi` so a project with no versioned collection or global registers nothing on the wire. Unlike `globalsApi` (which always registers `get`/`find`/`upsert` — calling it at all is the opt-in), `versionsApi` is the first factory in this codebase with **conditional** registration: drafts are opt-in per collection/global (`versions.drafts`), so a project that never opts in anywhere must not expose a draft/publish surface at all, even if it calls the factory.

> **Placement note.** `convex-functions.md` states factories "are co-located with the server barrel in `src/api/server.ts` … not a separate factory file" — `collectionsApi` and `globalsApi` both live there today, not in `convex.ts`. `versionsApi` follows the same placement, in `server.ts`. `convex.ts`'s role in this feature is the one it already plays for `globals`: it hosts the `vexConvexApi` typed `anyApi` surface that both the `.client.ts` wrappers and this factory's return type reference. That surface for all six versions operations (`saveDraft`/`publish`/`unpublish` from Steps 5–7, `listVersions`/`getVersionSnapshot`/`deleteVersion` from Step 8) is already complete — **nothing further to add to `convex.ts` in this step.**

- [ ] `packages/core/src/api/server.ts` — imports the six versions operations, re-exports each (function + its `*ServerArgs` type) from the barrel, and adds `versionsApi(config, query, mutation, getAuth?)`, registering `saveDraft`, `publish`, `unpublish`, `listVersions`, `getVersionSnapshot`, `deleteVersion` as bare-named Convex endpoints (naming-conventions.md: "no `adminXxx` prefix") — returns `{}` when no collection or global declares `versions.drafts: true`.
- [ ] `packages/core/src/api/client.ts` — re-exports the six client wrappers plus `VersionSummary` / `VersionSnapshotResult`.
- [ ] `packages/core/src/api/convex.test.ts` — registers only declared operations; a config with no `versions.drafts` anywhere registers `{}`.

#### packages/core/src/api/server.ts

Existing file; 3 edits.

**1 — imports, added beside the existing `globals/*.server` imports.**

```ts
import type { SaveDraftServerArgs } from "./versions/saveDraft.server";
import type { PublishServerArgs } from "./versions/publish.server";
import type { UnpublishServerArgs } from "./versions/unpublish.server";
import type { ListVersionsServerArgs, VersionSummary } from "./versions/listVersions.server";
import type {
  GetVersionSnapshotServerArgs,
  VersionSnapshotResult,
} from "./versions/getVersionSnapshot.server";
import type { DeleteVersionServerArgs } from "./versions/deleteVersion.server";
import { saveDraft } from "./versions/saveDraft.server";
import { publish } from "./versions/publish.server";
import { unpublish } from "./versions/unpublish.server";
import { listVersions } from "./versions/listVersions.server";
import { getVersionSnapshot } from "./versions/getVersionSnapshot.server";
import { deleteVersion } from "./versions/deleteVersion.server";
import {
  VexListVersionsArgs,
  VexGetVersionSnapshotArgs,
  VexDeleteVersionArgs,
} from "./convex";
```

**2 — barrel re-exports, added after the existing `export { upsertGlobal } from "./globals/upsert.server";` line.**

```ts
export { saveDraft } from "./versions/saveDraft.server";
export type { SaveDraftServerArgs } from "./versions/saveDraft.server";
export { publish } from "./versions/publish.server";
export type { PublishServerArgs } from "./versions/publish.server";
export { unpublish } from "./versions/unpublish.server";
export type { UnpublishServerArgs } from "./versions/unpublish.server";
export { listVersions } from "./versions/listVersions.server";
export type { ListVersionsServerArgs, VersionSummary } from "./versions/listVersions.server";
export { getVersionSnapshot } from "./versions/getVersionSnapshot.server";
export type {
  GetVersionSnapshotServerArgs,
  VersionSnapshotResult,
} from "./versions/getVersionSnapshot.server";
export { deleteVersion } from "./versions/deleteVersion.server";
export type { DeleteVersionServerArgs } from "./versions/deleteVersion.server";
```

**3 — `versionsApi` factory, added immediately after `globalsApi` and before `resolveGetAuth`.**

```ts
/**
 * Registers the draft/version workflow — `saveDraft`, `publish`, `unpublish`,
 * `listVersions`, `getVersionSnapshot`, `deleteVersion` — as bare-named
 * Convex endpoints under `api.vex.*`, mirroring `collectionsApi`/`globalsApi`'s
 * registration shape and RBAC seam.
 *
 * Unlike `globalsApi` (always registers its three operations once called),
 * `versionsApi` registers NOTHING for a project where no resource declares
 * `versions.drafts: true` — drafts are opt-in per collection/global, so a
 * project that never opts in anywhere must not expose a draft/publish
 * surface at all.
 *
 * @typeParam DataModel - The project's generated Convex data model.
 * @typeParam Visibility - Function visibility of the supplied builders;
 *   defaults to `"public"`.
 * @param props - Factory configuration.
 * @param props.config - The resolved `VexConfig`; scanned for any collection
 *   or global with `versions.drafts: true` to decide whether to register
 *   anything, and forwarded to every operation for `config.access`.
 * @param props.query - The project's Convex `query` builder.
 * @param props.mutation - The project's Convex `mutation` builder.
 * @param props.getAuth - Server-side resolver for the current caller,
 *   identical contract to `collectionsApi`'s (see its docstring) — resolved
 *   once per request, never a client argument.
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
 *
 * @see {@link hasPermission} for resolution semantics
 * @see {@link globalsApi} for the (unconditional) factory this mirrors
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
  // 1. `const hasVersionedCollections = config.collections.some((c) => c.versions.drafts);`
  //    (Step 1 resolves `versions` on every `CollectionConfig` to `{ drafts: boolean;
  //    autosave: boolean }`, never `undefined` — no optional chaining needed.)
  // 2. `const hasVersionedGlobals = config.globals.some((g) => g.versions.drafts);`
  // 3. Neither → `return {};` — zero keys, so none of `api.vex.saveDraft` /
  //    `.publish` / `.unpublish` / `.listVersions` / `.getVersionSnapshot` /
  //    `.deleteVersion` exist on the wire for this project.
  // 4. Otherwise return one flat object (bare names, never nested under a `versions`
  //    key) with the six registrations below, each resolving `auth` via
  //    `resolveGetAuth({ ctx, config, getAuth })` first (identical seam to every
  //    handler in `collectionsApi`/`globalsApi`) and delegating to its Step 5–8
  //    server function:
  //    ```ts
  //    return {
  //      saveDraft: mutation({
  //        args: { collection: v.string(), id: v.string(), data: v.any(), restoredFrom: v.optional(v.number()), environmentId: v.optional(v.string()) },
  //        handler: async (ctx, args) => {
  //          const auth = await resolveGetAuth({ ctx, config, getAuth });
  //          return saveDraft({ auth, ctx, config, collection: args.collection as CollectionSlug, id: args.id as GenericId<CollectionSlug>, data: args.data, restoredFrom: args.restoredFrom });
  //        },
  //      }),
  //      publish: mutation({
  //        // mirrors saveDraft's validator minus `restoredFrom`; delegates to `publish`
  //      }),
  //      unpublish: mutation({
  //        args: { collection: v.string(), id: v.string(), environmentId: v.optional(v.string()) },
  //        handler: async (ctx, args) => {
  //          const auth = await resolveGetAuth({ ctx, config, getAuth });
  //          return unpublish({ auth, ctx, config, collection: args.collection as CollectionSlug, id: args.id as GenericId<CollectionSlug> });
  //        },
  //      }),
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
  // - A project with ONLY versioned globals (no versioned collections) still
  //   registers all six — the surface doesn't split by resource kind.
  // - `getAuth` omitted while `config.access` is set → `resolveGetAuth` throws
  //   `VexAccessConfigError` on first call, same as every other factory.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/client.ts

Existing file; 1 edit.

**1 — barrel re-exports, appended after the existing `GLOBALS API` block.**

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

#### packages/core/src/api/convex.test.ts

New file. `[dev]` guided stub.

```ts
import type { GenericDataModel, MutationBuilder, QueryBuilder } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../config";
import { defineCollection, defineGlobal, text } from "../index";
import { versionsApi } from "./server";

// Mock builders: `versionsApi`'s registration branching doesn't execute the
// handler, so an identity function stands in for Convex's real `query`/
// `mutation` — this tests which keys get registered, not handler behavior
// (that's covered by each operation's own `.server.test.ts`).
const mockQuery = ((def: unknown) => def) as unknown as QueryBuilder<GenericDataModel, "public">;
const mockMutation = ((def: unknown) => def) as unknown as MutationBuilder<
  GenericDataModel,
  "public"
>;

const SIX_OPERATION_NAMES = [
  "saveDraft",
  "publish",
  "unpublish",
  "listVersions",
  "getVersionSnapshot",
  "deleteVersion",
].sort();

const unversionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }) },
});

const versionedPosts = defineCollection({
  slug: "posts",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const versionedSiteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  versions: { drafts: true },
  fields: { siteName: text({ label: "Site Name", required: true }) },
});

describe("versionsApi — conditional registration", () => {
  test("registers nothing for a project with no versioned collection or global", () => {
    // TODO: implement
    // 1. `const config = { collections: [unversionedPosts], globals: [] } as unknown as VexConfig;`
    // 2. `const api = versionsApi({ config, query: mockQuery, mutation: mockMutation });`
    // 3. → `Object.keys(api)` equals `[]`.
    throw new Error("Not implemented");
  });

  test("registers all six bare-named operations when a collection declares versions.drafts", () => {
    // TODO: implement
    // 1. `const config = { collections: [versionedPosts], globals: [] } as unknown as VexConfig;`
    // 2. `const api = versionsApi({ config, query: mockQuery, mutation: mockMutation });`
    // 3. → `Object.keys(api).sort()` equals `SIX_OPERATION_NAMES`.
    throw new Error("Not implemented");
  });

  test("registers all six when only a GLOBAL declares versions.drafts", () => {
    // TODO: implement
    // 1. `const config = { collections: [unversionedPosts], globals: [versionedSiteSettings] } as unknown as VexConfig;`
    // 2. `const api = versionsApi({ config, query: mockQuery, mutation: mockMutation });`
    // 3. → `Object.keys(api).sort()` equals `SIX_OPERATION_NAMES` — the surface doesn't
    //    split by resource kind.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 10 — Status filter injection `[dev]`

Why: Consumes the CURRENT `access-constraint-builder` API (`resolveAccessIndex` /
`resolveAccessConstraint` / `pickQueryIndex`, wired through `constraints` callbacks), not
the deleted `AccessIndexDecl` two-level-callback shape (`range: () => (q) => …`) the
original design-review sketched this step against. `resolveAccessIndex` and
`resolveAccessConstraint` already resolve a plain `QueryIndex { name, range: IndexRangeFn }`
/ `AccessFilterFn` today, one call each per query — the composition below builds directly
on those, adding nothing to their signatures.

This is the point at which public reads stop seeing draft rows. With two rows sharing a
document (design-review.md §1: a published row plus at most one draft row pointing at it),
an unfiltered query returns the same logical document twice — filtering is **data
integrity**, not an optimization, and it is deliberately **never expressed as a permission
rule** (design-review.md §3.1): the anon role needs no knowledge of `vex_status`, and the
constraint must hold even when the caller passed `access: { bypass: true }`, since bypass
turns off *authorization*, not the framework's own data shape guarantees. That
independence-from-bypass is the one correction this step makes over the pattern a stale
draft of this same file once used (a `requiresPublishedOnly` that returned `false` under
`bypass: true`) — get that ordering wrong and a trusted internal caller silently sees every
draft in the table.

Two, genuinely separate, mechanisms compose here and must not be conflated:

1. **RBAC — who may see a draft at all.** `drafts: true` switches the action this call
   resolves against from `CRUD_ACTIONS.read` to `DRAFT_ACTIONS.readDrafts`. Nothing grants
   `readDrafts` unless a project's `defineAccess` says so (the pinned default-deny posture),
   so passing `drafts: true` cannot, by itself, grant access to draft content — the caller's
   role still needs the permission, enforced identically to every other action by the
   existing `hasPermission` per-document pass and by `resolveAccessIndex`/
   `resolveAccessConstraint` resolving against `readDrafts` instead of `read`.
2. **Structural status filter — what the query itself excludes.** For a versioned
   collection where `drafts` is falsy, an ADDITIONAL published-only condition is composed
   alongside whatever RBAC already resolved: if no `withIndex` slot is claimed (by an RBAC
   index or by the caller's own `withIndex`), push
   `withIndex("by_status", q => q.eq("vex_status", "published"))` — full pages, minimal
   reads, the common list-view case. If the slot is already claimed, `and` a
   `.filter(f => f.eq("vex_status", "published"))` onto whatever filter is already being
   applied. This mechanism runs UNCONDITIONALLY whenever a versioned collection's `drafts`
   is falsy — including under `access: { bypass: true }` — it has no relationship to
   mechanism 1 beyond both reading the same `drafts` boolean.

`search` never contests a `withIndex` slot — its `buildQuery` uses `.withSearchIndex`, and
Convex forbids combining `.withIndex` and `.withSearchIndex` on one query, so there is no
framework-owned slot there to claim structurally. `search`'s status condition is therefore
always folded into `.filter()`, never structural — consistent with `search/server.ts`
already only importing `resolveAccessConstraint`, never `resolveAccessIndex`.

- [ ] `packages/core/src/api/find/server.ts` — add `drafts?: boolean` arg; add
      `requiresPublishedOnly` and `composeStatusConstraint`; wire both into `find`'s
      existing resolve block.
- [ ] `packages/core/src/api/get/server.ts` — add `drafts?: boolean` arg; a versioned
      collection's row is treated as not found when its status isn't published and
      `drafts` wasn't requested.
- [ ] `packages/core/src/api/search/server.ts` — add `drafts?: boolean` arg; the status
      condition is always folded into `.filter()`.
- [ ] `packages/core/src/api/find/server.test.ts` — public read (including a
      `bypass: true` call) returns no draft rows and no duplicate logical documents;
      `drafts: true` with `readDrafts` returns both; a caller-supplied `withIndex` still
      gets the status filter via `.filter()`.

#### packages/core/src/api/find/server.ts

5 edits. Everything else in the file — the two `find` overloads, the return-value/populate
logic, and the count-query rebuild — is unchanged; they consume the same `resolvedIndex`
and `accessFilter` names as before, now produced by the block in edit 5.

**1 — imports.** Add a `VexConfig` type import (new), and add `DRAFT_ACTIONS` to the
existing `../../access` import.

```ts
import type { VexConfig } from "../../config";
```

```ts
import {
  AccessFilterFn,
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  hasPermission,
  type IndexRangeFn,
  pickQueryIndex,
  type QueryIndex,
  resolveAccessConstraint,
  resolveAccessIndex,
  resolveFieldPermissions,
  stripDeniedFields,
} from "../../access";
```

**2 — `FindServerArgs.drafts`.** Add after the `withIndex` field, before `paginationOpts`.

```ts
  /**
   * Include draft rows for a versioned collection. Defaults to `false`.
   *
   * The two-row draft model (design-review.md §1) means an unfiltered query on a
   * versioned collection returns the same logical document twice — once
   * `vex_status: "published"`, once `vex_status: "draft"` — so `find` injects a
   * published-only constraint unless this is `true`. Ignored for a collection that
   * doesn't declare `versions.drafts`.
   *
   * Also switches the RBAC action this call resolves against, from `"read"` to
   * `"readDrafts"` (`DRAFT_ACTIONS.readDrafts`). `readDrafts` is fail-closed under
   * the pinned default-deny posture — no role grants it unless a project's
   * `defineAccess` says so — so passing `true` here cannot, by itself, grant access
   * to draft content; the caller's role still needs `readDrafts` permission for
   * anything to come back.
   */
  drafts?: boolean;
```

**3 — new exported `requiresPublishedOnly`.** Add immediately after the `FindServerArgs`
interface's closing brace, before the `find` overloads.

```ts
/**
 * Decides whether a query against `collection` must be narrowed to
 * published-only rows.
 *
 * Purely a data-integrity question — see {@link composeStatusConstraint} for why
 * the narrowing it drives runs independently of `access.bypass`. `false` for a
 * non-versioned collection (nothing to narrow), for a caller explicitly requesting
 * drafts, or when `config` wasn't supplied.
 *
 * @param props - Input props.
 * @param props.config - The resolved `VexConfig`, to look up `collection`'s `versions`.
 * @param props.collection - The collection slug being queried.
 * @param props.drafts - The caller's `drafts` arg (`FindServerArgs.drafts` /
 *   `GetServerArgs.drafts` / `SearchServerArgs.drafts` — one contract, shared).
 * @returns `true` when the published-only constraint must apply.
 */
export function requiresPublishedOnly(props: {
  config?: VexConfig;
  collection: string;
  drafts?: boolean;
}): boolean {
  // TODO: implement
  // 1. `props.drafts === true` → `return false` — the caller explicitly asked for
  //    drafts; the RBAC `readDrafts` action switch (in `find`'s resolve block, and
  //    its `get`/`search` mirrors) governs whether they're ALLOWED to see them, not
  //    this function — keep the two concerns apart.
  // 2. `const collection = props.config?.collections.find((c) => c.slug === props.collection);`
  //    → mirrors the lookup pattern already used in `api/utils.ts` (`stampUpdatedAt`).
  // 3. `return collection?.versions?.drafts === true;`
  // Edge cases:
  // - `props.config` omitted → step 2 finds nothing → `false`. A caller not passing
  //   `config` gets today's unfiltered behavior — the same posture `find`/`get`/
  //   `search` already take when `config` (and therefore RBAC) is absent elsewhere
  //   in this file.
  // - A registered collection with `versions.drafts: false`, or `versions` entirely
  //   absent (pre-Step-1 configs) → `false`; nothing on it ever writes `vex_status`,
  //   so narrowing on that field would silently exclude every row.
  throw new Error("Not implemented");
}
```

**4 — new exported `composeStatusConstraint`.** Add immediately after
`requiresPublishedOnly`.

```ts
/**
 * Folds the framework's published-only status condition onto whatever
 * `resolveAccessIndex` / `pickQueryIndex` / `resolveAccessConstraint` already
 * resolved for the caller's RBAC rule, honoring Convex's one-`withIndex`-per-query
 * limit.
 *
 * Never a permission rule. Runs whenever `publishedOnly` is `true`, including when
 * the caller bypassed RBAC entirely (`props.resolvedIndex`/`props.accessFilter` may
 * both be `undefined` in that case) — hiding non-published rows on a versioned
 * collection is data integrity (design-review.md §3.1), not authorization, so it
 * has no dependency on `access.bypass` at all.
 *
 * @param props - Input props.
 * @param props.publishedOnly - {@link requiresPublishedOnly}'s result for this call.
 * @param props.resolvedIndex - The RBAC-vs-caller `withIndex` arbitration result —
 *   `pickQueryIndex({ accessIndex, callerIndex })`'s output, computed BEFORE this
 *   function runs and untouched by it when `publishedOnly` is `false`.
 * @param props.accessFilter - The RBAC filter `resolveAccessConstraint` resolved,
 *   if any.
 * @returns The index to apply (RBAC/caller arbitration, unchanged, when
 *   `publishedOnly` is `false`; the status index when the slot was free; the
 *   original `resolvedIndex` untouched when the slot was already claimed) and the
 *   filter to apply, with the status constraint folded in only when it couldn't
 *   claim the slot.
 */
export function composeStatusConstraint(props: {
  publishedOnly: boolean;
  resolvedIndex: QueryIndex | undefined;
  accessFilter: AccessFilterFn | undefined;
}): { resolvedIndex: QueryIndex | undefined; accessFilter: AccessFilterFn | undefined } {
  // TODO: implement
  // 1. `!props.publishedOnly` → `return { resolvedIndex: props.resolvedIndex, accessFilter:
  //    props.accessFilter }` unchanged — nothing to narrow for this call.
  // 2. `props.publishedOnly` true AND `props.resolvedIndex === undefined` (no index slot
  //    claimed — neither an RBAC rule nor the caller's own `withIndex` wanted it) → the
  //    status condition takes the free slot outright:
  //    `return { resolvedIndex: { name: "by_status", range: (q) => q.eq("vex_status",
  //    "published") }, accessFilter: props.accessFilter }`.
  //    → full pages, minimal reads — the common public list-view case
  //    (design-review.md §5.6, first bullet).
  // 3. `props.publishedOnly` true AND `props.resolvedIndex !== undefined` (the slot is
  //    already claimed, by an access rule OR by the caller) → the status condition has
  //    nowhere left but `.filter()`:
  //    a. `const statusFilter: AccessFilterFn = (q) => q.eq(q.field("vex_status"), "published");`
  //    b. `const combined = props.accessFilter ? (q) => q.and(props.accessFilter!(q),
  //       statusFilter(q)) : statusFilter;`
  //    c. `return { resolvedIndex: props.resolvedIndex, accessFilter: combined };`
  //    → still full pages (Convex's `paginate` counts `numItems` after filters,
  //    design-review.md §5.5), just more rows read per page than case 2.
  // Edge cases:
  // - `props.resolvedIndex` names something other than `"by_status"` (an RBAC index like
  //   `by_author`, or the caller's own `withIndex`) → case 3, same as any other occupant;
  //   this function does not care WHO holds the slot, only whether it's held.
  // - `props.accessFilter` is `undefined` and case 3 applies → the status filter IS the
  //   whole filter; do not wrap a no-op `q.and(true, statusFilter(q))`.
  throw new Error("Not implemented");
}
```

**5 — `find`'s resolve block.** Replace the span from `const { access, action, resource } =
resolveAccessCall({...})` through `const accessFilter = resolveAccessConstraint({...});`
(the block immediately before the `buildQuery<...>({ ...args, resolvedIndex, accessFilter })`
call, which is unchanged and still reads these same two final names).

```ts
  const { access, action, resource } = resolveAccessCall({
    config: args.config,
    access: args.access,
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
  // `FindServerArgs.withIndex` is a conditional type over `TCollectionSlug`, still an
  // unresolved type parameter here — TypeScript cannot reduce it, so it stays opaque.
  // The runtime shape is exactly `{ name, range? }`, already checked against the
  // collection at the public call site.
  const callerIndex = args.withIndex as { name: string; range?: IndexRangeFn } | undefined;
  const rbacResolvedIndex = pickQueryIndex({ accessIndex, callerIndex });
  const rbacFilter = resolveAccessConstraint({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
    indexAlreadyApplied: accessIndex !== undefined && rbacResolvedIndex?.name === accessIndex.name,
  });
  // Status narrowing is independent of RBAC (design-review.md §3.1) — it runs
  // whenever `requiresPublishedOnly` says so, whether or not `access` above is
  // `undefined` (bypassed or unconfigured).
  const { resolvedIndex, accessFilter } = composeStatusConstraint({
    publishedOnly: requiresPublishedOnly({
      config: args.config,
      collection: args.collection,
      drafts: args.drafts,
    }),
    resolvedIndex: rbacResolvedIndex,
    accessFilter: rbacFilter,
  });
```

#### packages/core/src/api/get/server.ts

4 edits. Everything else in the file — the depth/populate resolution and its `Id<TableName>`
extraction comment — is unchanged.

**1 — imports.** Add `DRAFT_ACTIONS` to the existing `../../access` import, and import the
shared helper from `find/server.ts`.

```ts
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission, resolveFieldPermissions, stripDeniedFields } from "../../access";
import { requiresPublishedOnly } from "../find/server";
```

**2 — `GetServerArgs.drafts`.** Add alongside `collection`.

```ts
  /** Same contract as `FindServerArgs.drafts` — see `find/server.ts`. */
  drafts?: boolean;
```

**3 — `resolveAccessCall`'s `defaultAction`.** Inside the existing
`if (doc && args.config?.access !== undefined) { const { access, action, resource } =
resolveAccessCall({ … }); … }` block — only the `defaultAction` line changes.

```ts
      defaultAction: args.drafts === true ? DRAFT_ACTIONS.readDrafts : CRUD_ACTIONS.read,
```

**4 — post-fetch status check.** Insert immediately after that `if` block closes, before the
`// Resolve slug for buildDepthPopulate from the Id (D12).` comment. Runs unconditionally on
`args.config`, not on `args.config?.access` — the same posture edit 5 of `find/server.ts`
takes — and AFTER the RBAC block above, not before: an explicit permission denial must still
throw ahead of a status check that would otherwise silently swallow it into a plain `null`.

```ts
  if (
    doc &&
    requiresPublishedOnly({ config: args.config, collection: args.collection, drafts: args.drafts }) &&
    (doc as Record<string, unknown>).vex_status !== "published"
  ) {
    // A draft row fetched by a caller not requesting drafts does not exist for
    // them — "not found" semantics, not a thrown error: the row IS the wrong
    // logical state to serve, not a permission boundary `hasPermission` already
    // ruled on above.
    doc = null;
  }
```

#### packages/core/src/api/search/server.ts

3 edits. `buildQuery` itself — including its `.withSearchIndex` branch — is unchanged; it
already accepts a single `accessFilter` and ANDs it with `args.filter`, so the composed
filter from edit 3 flows through with no further change.

**1 — imports.** Add `DRAFT_ACTIONS` to the existing `../../access` import, and import the
shared helper from `find/server.ts`.

```ts
import {
  AccessFilterFn,
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  hasPermission,
  resolveAccessConstraint,
  resolveFieldPermissions,
  stripDeniedFields,
} from "../../access";
import { requiresPublishedOnly } from "../find/server";
```

**2 — `SearchServerArgs.drafts`.** Add after `searchField`, before `limit`.

```ts
  /** Same contract as `FindServerArgs.drafts` — see `find/server.ts`. */
  drafts?: boolean;
```

**3 — the resolve block.** Replace the span from `const { access, action, resource } =
resolveAccessCall({...})` through `const searchQuery = buildQuery({ ...args, accessFilter });`.

```ts
  const { access, action, resource } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: args.drafts === true ? DRAFT_ACTIONS.readDrafts : CRUD_ACTIONS.read,
    resource: args.collection,
  });
  const rbacFilter = resolveAccessConstraint({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  // `search` never contests a `withIndex` slot — `buildQuery` below uses
  // `.withSearchIndex`, never `.withIndex` (Convex forbids combining the two on one
  // query, and vex's generated schema doesn't manage search indexes). Unlike
  // `find`/`get`, there is no framework-owned slot here for the status constraint to
  // claim structurally, so it is ALWAYS folded into `.filter()`, independent of
  // `access.bypass` — same data-integrity posture as `find`, simpler because there's
  // only one branch.
  let accessFilter: AccessFilterFn | undefined = rbacFilter;
  if (requiresPublishedOnly({ config: args.config, collection: args.collection, drafts: args.drafts })) {
    const statusFilter: AccessFilterFn = (q) => q.eq(q.field("vex_status"), "published");
    accessFilter = rbacFilter ? (q) => q.and(rbacFilter(q), statusFilter(q)) : statusFilter;
  }
  const searchQuery = buildQuery({
    ...args,
    accessFilter,
  });
```

#### packages/core/src/api/find/server.test.ts

New `describe` block, appended after the file's existing coverage. `[dev]`: guided
stubs, not finished assertions — the developer supplies the concrete `expect`s per the
steps below. Fixtures build on the shared `posts` table (Step 4 extends it with
`vex_status`/`vex_publishedAt`/`vex_publishedId` + `by_status`/`by_published`, and it
already carries a `by_slug` index from the base fixture); each test's own `config`
fixture declares `defineCollection({ slug: "posts", ..., versions: { drafts: true } })`
separately from the raw table schema.

```ts
describe("find (server) — versioned collection status filtering", () => {
  /**
   * A public read must never surface a draft row, and the published row for a
   * document with an active draft must not appear twice — with or without
   * `access.bypass`, since the status constraint is data integrity, not RBAC.
   */
  it("a public read, including access: { bypass: true }, returns no draft rows and no duplicate logical documents", async () => {
    // TODO: implement
    // 1. `convexTest(schema, modules)`; the fixture `config` declares `posts` as
    //    versioned (`versions: { drafts: true }`). Insert a `posts` row as
    //    `vex_status: "published"`. Insert a SECOND row for the same logical document
    //    as `vex_status: "draft"`, `vex_publishedId` pointing at the published row's
    //    `_id` — mirrors `saveDraft`'s bootstrap shape (Step 5).
    // 2. `find({ ctx, collection: "posts", config })` with no `drafts` arg → assert the
    //    result has length 1 and its `_id` equals the published row's `_id`.
    // 3. Repeat step 2 with `access: { bypass: true }` → SAME assertion. This is the
    //    fix this step makes: bypass must not leak the draft row.
    throw new Error("Not implemented");
  });

  /**
   * `drafts: true` alone must not be sufficient — it only lifts the structural
   * status narrowing. Whether draft content is actually returned still depends on
   * the resolved `readDrafts` RBAC action.
   */
  it("drafts: true paired with readDrafts permission returns both rows; without it, neither", async () => {
    // TODO: implement
    // 1. Same two-row fixture as the previous test, under a `defineAccess` config with
    //    two roles on `posts`: one declaring `readDrafts: true`, one that doesn't
    //    declare it at all (falls to default-deny).
    // 2. `find({ ctx, collection: "posts", config, auth: { user: <readDrafts role> },
    //    drafts: true })` → assert the result has length 2 and contains both the
    //    published and draft row `_id`s.
    // 3. `find({ ctx, collection: "posts", config, auth: { user: <other role> },
    //    drafts: true })` → assert the result has length 0.
    throw new Error("Not implemented");
  });

  /**
   * When a caller supplies its own `withIndex`, the status constraint must still
   * apply — via `.filter()`, since the `withIndex` slot is already taken.
   */
  it("a caller-supplied withIndex still gets the status filter via .filter()", async () => {
    // TODO: implement
    // 1. Same two-row fixture; both rows share the same `slug` (posts already carries
    //    a `by_slug` index in the base fixture — no schema change needed for this).
    // 2. `find({ ctx, collection: "posts", config, withIndex: { name: "by_slug", range:
    //    (q) => q.eq("slug", "hello") } })` with no `drafts` → assert the result has
    //    length 1 (the published row only) — proving the draft row was excluded even
    //    though `by_status` never won the `withIndex` slot.
    throw new Error("Not implemented");
  });

  /**
   * A non-versioned collection must be completely unaffected by this mechanism,
   * even if a stray row happens to carry a `vex_status` field.
   */
  it("a non-versioned collection is unaffected", async () => {
    // TODO: implement
    // 1. Insert an `authors` document (fixture config declares no `versions` for
    //    `authors`) with `vex_status: "draft"` set directly — simulating stray data;
    //    nothing in `authors`'s pipeline ever writes this field.
    // 2. `find({ ctx, collection: "authors", config })` → assert the row IS returned:
    //    `requiresPublishedOnly` is `false` for a collection that doesn't declare
    //    `versions.drafts`, so nothing narrows.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 11 — Two-row consequences `[dev]`

Why: `design-review.md` §3.1–3.4 named three concrete places a document's second row (its draft) leaks into code that was written assuming exactly one row per document. §3.2: a draft shares its published parent's field values by definition, so a naive unique-value check reports every edited document as colliding with itself. §3.4: deleting a document must delete all three of its rows (published, draft, `vex_versions` history) behind one `delete` action, or a stray draft/history row survives its parent. §3.3 + decision 4: an admin list view that doesn't collapse a published/draft pair shows one logical document as two rows the moment this spec lands — a correctness bug, not a polish item, so it ships in this step rather than being deferred.

- [ ] `packages/core/src/versioning/assertUniqueAmongPublished.ts` — the one reusable helper design-review §3.2 calls for, so a project's own uniqueness `validate()` has a correct, two-row-aware primitive instead of reinventing the same bug.
- [ ] `packages/core/src/versioning/assertUniqueAmongPublished.test.ts`
- [ ] `packages/core/src/api/server.ts` — export the new helper.
- [ ] `packages/core/src/api/remove/server.ts` — cascades a hard delete to the document's draft row (if any) and every `vex_versions` row for it.
- [ ] `packages/core/src/api/remove/server.test.ts`
- [ ] `packages/core/src/api/types.ts` — `drafts?: boolean` on `GenericQueryClientParams`, the client-side counterpart of Step 10's server arg; nothing in Step 10's own file list touches the client type, and `CollectionListView` below is the first real caller.
- [ ] `packages/react/src/components/views/collapseVersionedPairs.ts` — collapses a versioned collection's published/draft rows to one row per logical document, preferring the draft, with an `hasUnpublishedChanges` flag.
- [ ] `packages/react/src/components/views/collapseVersionedPairs.test.ts`
- [ ] `packages/react/src/components/views/CollectionListView.tsx` — requests both rows of an in-progress pair when the caller can read drafts, collapses them via the helper above, and renders an "Unpublished changes" indicator.
- [ ] `packages/react/src/testing/convex/schema.ts` — `vex_status`/`vex_publishedId` fields on the shared `documents` fixture table, so a seeded row can model a published/draft pair.
- [ ] `packages/react/src/testing/viewSuite.ts` — `describeCollectionListView` gains pair-collapsing coverage.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

#### packages/core/src/versioning/assertUniqueAmongPublished.ts

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
   * its draft — never the draft's own id (design-review.md §3.2). Omit when
   * creating a brand new document.
   */
  excludeId?: GenericId<TCollectionSlug>;
}

/**
 * Asserts that no OTHER published row in `collection` already has `value` for
 * `field`, scoped to `vex_status === "published"` (design-review.md §3.2).
 *
 * A draft shares its published parent's field values by definition, so an
 * uniqueness check that considers every row — draft included — reports a
 * document as colliding with itself the moment it has a draft. Scoping to
 * published rows only, and excluding the document's own published `_id`,
 * removes the false positive while still catching a real collision with a
 * DIFFERENT document's published row — a third document's in-progress,
 * not-yet-published draft never counts either.
 *
 * Call this from a field's `validate()` (see `fieldValidator`'s own
 * `@example` in `fields/baseTypes.ts`, which now delegates to this helper)
 * rather than hand-rolling the `ctx.db.query(...).withIndex(...)` scan.
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
  //    `args.ctx.db.query(args.collection).withIndex(args.indexName, (q) => q.eq(args.field, args.value)).collect()`.
  //    → the caller is responsible for having declared this index (mirrors
  //      `find/server.ts`'s caller-supplied `withIndex`, convex-functions.md).
  // 2. Filter the results to real collision candidates:
  //    a. Keep only rows where `doc.vex_status === "published" || doc.vex_status === undefined`
  //       (the latter covers a non-versioned collection, where every row IS
  //       "the" document — never `doc.vex_status === "draft"`, which would
  //       flag a document as colliding with its own in-progress edit).
  //    b. Drop `args.excludeId` from the candidate set, when provided.
  //    → produces the list of OTHER published rows sharing the value.
  // 3. Any candidate remaining → `throw new Error(...)` naming `args.field`
  //    and `args.value` (e.g. `Another published document already uses "${args.field}": "${args.value}"`).
  // Edge cases:
  // - Non-versioned collection: `vex_status` is never set, so step 2a keeps
  //   every row — degrades to a plain "no other row has this value" check.
  // - `excludeId` omitted (create path): every candidate surviving step 2 is
  //   a real collision, including a row that happens to be a draft's own
  //   never-published state (excluded already by 2a's status filter).
  throw new Error("Not implemented");
}
```

#### packages/core/src/versioning/assertUniqueAmongPublished.test.ts

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

  test("degrades to a plain no-collision check on a non-versioned collection (vex_status never set)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const first = await ctx.db.insert("posts", { title: "Only", slug: "solo" });
      await expect(
        assertUniqueAmongPublished({
          ctx,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "solo",
          excludeId: first,
        }),
      ).resolves.toBeUndefined();

      await expect(
        assertUniqueAmongPublished({
          ctx,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "solo",
        }),
      ).rejects.toThrow();
    });
  });
});
```

#### packages/core/src/api/server.ts

One edit — everything else in this file is unchanged.

**1 — export the new helper.** Beside the existing `export type { UpsertGlobalServerArgs } from "./globals/upsert.server";` line, before `export { createVexMutations } from "./triggers";`:

```ts
export { assertUniqueAmongPublished } from "../versioning/assertUniqueAmongPublished";
export type { AssertUniqueAmongPublishedArgs } from "../versioning/assertUniqueAmongPublished";
```

#### packages/core/src/api/remove/server.ts

Three edits — the rest of the file (the `RemoveServerArgs` interface, the bulk-delete `Promise.all`, soft-delete handling) is unchanged.

**1 — imports.** Beside the existing `convex/server` type import, add `GenericMutationCtx`; beside the existing `../utils` import, add the two version-model helpers this cascade calls:

```ts
import type { DocumentByName, GenericDataModel, GenericMutationCtx } from "convex/server";
```

```ts
import { findDraftRow, listVersions } from "../../versioning/model";
```

**2 — cascade call site, inside `removeById`.** After the existing `const collection = args.config.collections.find(...)` / not-registered check (right before the existing `beforeDelete` block), and a short addition to `remove()`'s own docstring naming the new behavior:

Docstring — after "Pass `softDelete` field name to soft delete instead of permanently removing.":

```ts
 *
 * On a versioned collection, a hard delete of either row of a document
 * cascades to its draft row (if any) and all of its `vex_versions` history
 * (design-review.md §3.4) — see `cascadeVersionedDelete` below. A soft
 * delete does not cascade: the row is not actually removed.
```

Body — after the `if (!collection) { throw ... }` block, before `if (collection.hooks?.beforeDelete && doc !== null)`:

```ts

    if (collection.versions.drafts) {
      if (doc === undefined) {
        doc = await args.ctx.db.get(id);
      }
      if (doc !== null) {
        await cascadeVersionedDelete({ ctx: args.ctx, collection: args.collection, doc: doc as never });
      }
    }
```

**3 — new helper, appended after `remove()`'s closing brace.**

```ts
/**
 * Cascades a document delete across the two-row draft model
 * (design-review.md §3.4): deletes the document's draft row, if any, and
 * every `vex_versions` history row for the document. Called by `removeById`
 * before the row passed to `remove()` is itself deleted — safe to call with
 * either the published row or its draft, since both resolve to the same
 * logical document.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 * @param args - `{ ctx, collection, doc }`.
 * @param args.ctx - Convex mutation context.
 * @param args.collection - The collection slug the document belongs to.
 * @param args.doc - The row passed to `remove()` — the published row or its draft.
 * @returns Promise resolving once the draft row and all version rows for
 *   this document are gone.
 * @throws {Error} Always, until implemented.
 */
async function cascadeVersionedDelete<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: {
  ctx: GenericMutationCtx<DataModel>;
  collection: TCollectionSlug;
  doc: DocumentByName<DataModel, TCollectionSlug>;
}): Promise<void> {
  // TODO: implement
  // 1. Resolve the published row's id for this logical document:
  //    a. `args.doc.vex_publishedId` set → `args.doc` IS the draft row; the
  //       published id is `args.doc.vex_publishedId`.
  //    b. `args.doc.vex_publishedId` undefined → `args.doc` IS the published
  //       row (or a never-published draft with no parent yet); the published
  //       id is `args.doc._id`.
  //    → produces `publishedId: GenericId<TCollectionSlug>`.
  // 2. Find the draft row pointing at `publishedId` via `findDraftRow`
  //    (`../../versioning/model`, `by_published` index):
  //    a. Found, and its `_id` differs from `args.doc._id` → `args.ctx.db.delete` it.
  //    b. Found, and its `_id` equals `args.doc._id` → already the row
  //       `remove()` is about to delete; skip, do not double-delete.
  //    → keeps the two-row invariant: no orphaned draft after its parent is gone.
  // 3. List every `vex_versions` row for `(args.collection, publishedId)` via
  //    `listVersions` (`../../versioning/model`) and `args.ctx.db.delete`
  //    each — history for a deleted document has no reason to survive it.
  // Edge cases:
  // - Non-versioned collection: `removeById` never calls this helper (guarded
  //   by `collection.versions.drafts`), so there is no cost on the common path.
  // - `args.doc` is a never-published draft (`vex_status: "draft"`,
  //   `vex_publishedId: undefined`): step 1b applies (`publishedId === args.doc._id`);
  //   step 2 finds nothing besides `args.doc` itself (already excluded by 2b);
  //   step 3 still clears any version history the draft accrued via autosave.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/remove/server.test.ts

One edit — a new `describe` block appended after the existing `"remove (server) — beforeDelete"` block (the file's last line today, `});`); nothing else changes.

```ts
const versionedPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});

// Resolves `versions: { drafts: true, autosave: false }` for real (Step 1),
// which is what `remove()`'s `collection.versions.drafts` check reads.
const versionedFixtureConfig = { collections: [versionedPostsResource] } as unknown as VexConfig;

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

  test("a never-published draft's own version history is still cleared", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", {
        title: "New page (unpublished)",
        slug: "cascade-e",
        vex_status: "draft",
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: draftId,
        version: 1,
        status: "draft",
      });

      await remove({ ctx, ids: [draftId], collection: "posts", config: versionedFixtureConfig });

      expect(await ctx.db.get(draftId)).toBeNull();
      expect(await ctx.db.get(versionId)).toBeNull();
    });
  });
});
```

#### packages/core/src/api/types.ts

One edit. Beside the existing `skip?: boolean;` field on `GenericQueryClientParams` (the interface's last member):

```ts
  /**
   * When `true` on a versioned collection, includes the document's draft
   * row alongside its published row — gated server-side on the `readDrafts`
   * action (Step 10). Ignored for a non-versioned collection.
   */
  drafts?: boolean;
```

#### packages/react/src/components/views/collapseVersionedPairs.ts

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
 * and never sees pairs (design-review.md §3.1).
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
  //    b. Bucket each row into `{ published?: TData; draft?: TData }` keyed by
  //       (a): `doc.vex_status === "draft"` → draft slot; anything else,
  //       INCLUDING `undefined` (a non-versioned row sharing this table) →
  //       published slot.
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

#### packages/react/src/components/views/collapseVersionedPairs.test.ts

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

  test("treats a row with no vex_status (a non-versioned row sharing the table) as published", () => {
    const legacy = doc({ _id: "legacy1", title: "Predates versioning" });

    expect(collapseVersionedPairs({ documents: [legacy] })).toEqual([
      { ...legacy, hasUnpublishedChanges: false },
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

#### packages/react/src/components/views/CollectionListView.tsx

Six edits — the not-found branch, `fieldPermissions`, `removeMutation`, `handleBulkDelete`, `canCreate`/`canDelete`, and the JSX structure are otherwise unchanged.

**1 — imports.** The `@vexcms/core` import gains `DRAFT_ACTIONS`; the `../ui` import gains `Badge`; a new import for the collapsing helper:

```ts
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  isFieldAllowed,
  PERMISSION_SCOPES,
  vexConvexApi,
  type CollectionListViewProps,
  type CollectionSlug,
  type TDocument,
} from "@vexcms/core";
```

```ts
import { Badge, DataTable } from "../ui";
import { collapseVersionedPairs } from "./collapseVersionedPairs";
```

**2 — new helper, beside the existing `columnFieldKey` function** (before `CollectionListView`'s own JSDoc):

```ts
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
```

**3 — component docstring.** After "This component renders the *content area only* — wrap it in `AdminLayout`.":

```ts
 *
 * On a versioned collection (`collection.versions.drafts`), requests both
 * rows of an in-progress pair (`drafts: true`, gated on `readDrafts`) and
 * collapses each pair to one row via `collapseVersionedPairs` — the draft's
 * fields win, with an "Unpublished changes" indicator
 * (design-review.md §3.3). The public read path is unaffected: it never
 * requests drafts and never sees pairs.
```

**4 — `isVersioned`/`canReadDrafts`, before `numItems`:**

```ts
  const isVersioned = collection.versions.drafts;
  const canReadDrafts = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.readDrafts,
    scope: PERMISSION_SCOPES.any,
  });
```

**5 — pagination query gains `drafts`.** After `collection: collection.slug,` inside `pagination`'s `query` object:

```ts
      drafts: isVersioned && canReadDrafts ? true : undefined,
```

**6 — `rows`, replacing raw `pagination.results`, and `columns`.** After the `pagination` const closes, before `fieldPermissions`:

```ts
  const rows = useMemo(
    () => (isVersioned ? collapseVersionedPairs({ documents: pagination.results }) : pagination.results),
    [pagination.results, isVersioned],
  );
```

The whole `columns` `useMemo` body:

```ts
  const columns = useMemo(() => {
    const fieldColumns = getCollectionColumnDefs({ collection }).filter((column) => {
      const key = columnFieldKey(column);
      return key === undefined || isFieldAllowed(fieldPermissions, key);
    });
    return isVersioned ? [buildUnpublishedChangesColumn(), ...fieldColumns] : fieldColumns;
  }, [collection, fieldPermissions, isVersioned]);
```

**7 — document count text and `DataTable`'s `data` now read `rows`, not `pagination.results`:**

```ts
              : `${rows.length} document${rows.length === 1 ? "" : "s"}`}
```

```ts
        data={rows}
```

#### packages/react/src/testing/convex/schema.ts

One edit. The `documents` table gains the two fields a seeded row needs to model a published/draft pair — additive, every existing seeded row simply omits them:

```ts
  documents: defineTable({
    status: v.optional(v.string()),
    title: v.optional(v.string()),
    vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    vex_publishedId: v.optional(v.id("documents")),
  }).searchIndex("search_title", { searchField: "title", filterFields: [] }),
```

#### packages/react/src/testing/viewSuite.ts

One edit — two new `it()` blocks appended inside `describeCollectionListView`'s `describe("CollectionListView", () => { ... })`, after the existing `runRbacStateSuite({ ... });` call and before that `describe`'s closing `});`. Each seeds its own isolated `convexTest()` instance rather than reusing the outer shared `t`/`docs`, so neither test's rows leak into the file's other, count-sensitive assertions.

```ts
    it("collapses a published/draft pair into one row with an 'Unpublished changes' indicator", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        versions: { drafts: true, autosave: false },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [versionedCollection] };
      const seeded = await t2.run(async (ctx) => {
        const publishedId = await ctx.db.insert("documents", {
          title: "Launch post",
          vex_status: "published",
        });
        const draftId = await ctx.db.insert("documents", {
          title: "Launch post (edited)",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });
        const rows = await Promise.all([ctx.db.get(publishedId), ctx.db.get(draftId)]);
        return rows.filter((doc): doc is TestDoc<"documents"> => doc !== null);
      });

      const utils = renderView(
        createElement(CollectionListView, { collection: versionedCollection.slug, initialData: toPage(seeded) }),
        { convex: t2, config },
      );

      expect(utils.getAllByRole("row")).toHaveLength(2); // header + 1 collapsed row
      expect(utils.getByText("Unpublished changes")).toBeInTheDocument();
      expect(utils.getByText("Launch post (edited)")).toBeInTheDocument();
    });

    it("keeps a standalone published document without the indicator", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        versions: { drafts: true, autosave: false },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [versionedCollection] };
      const seeded = await t2.run(async (ctx) => {
        const id = await ctx.db.insert("documents", { title: "Solo post", vex_status: "published" });
        const solo = await ctx.db.get(id);
        return solo ? [solo] : [];
      });

      const utils = renderView(
        createElement(CollectionListView, { collection: versionedCollection.slug, initialData: toPage(seeded) }),
        { convex: t2, config },
      );

      expect(utils.getAllByRole("row")).toHaveLength(2); // header + 1 row
      expect(utils.queryByText("Unpublished changes")).toBeNull();
    });
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

### Step 12 — `StatusBadge` + draft toolbar `[dev]`

Why: First visible UI; needs Steps 5-9 registered to have anything to call. Design-review §2.2's identity-preservation invariant only matters once an editor can actually see it — `StatusBadge` plus the toolbar's Save Draft / Publish / Unpublish are that surface, each gated by its own `usePermission` action rather than a shared `update`, since draft actions are separately declared in `DRAFT_ACTIONS` (foundation Step 3). Publish additionally has to surface Step 6's strict-validation rejection through the SAME `FormError` display every field input already renders through (`packages/react/src/components/form/FormError.tsx`) — not a bespoke error UI — since decision 2 promises the rejection "names the missing field," and a toast that vanishes in four seconds does not satisfy that for a multi-field form.

Two structural facts drive the edits below, neither literally itemized in the file list but both necessary consequences of wiring `CollectionEditView` up to the two-row model, so they're called out explicitly:

- **The `get` query needs `drafts: collection.versions.drafts`.** Confirmed against the real Step 10 implementation (`get/server.ts`'s status composition is a post-fetch check on the FETCHED row's own `vex_status`, independent of which `_id` was requested) — so once an active draft row exists, fetching it by its own `_id` without `drafts: true` gets nulled out by Step 10's filter, and the edit view would show "Document not found" the moment a draft exists.
- **The component must track which row it's currently looking at.** `saveDraft`'s `id` argument accepts either the published row's `_id` (bootstrap-or-find) or an existing draft's own `_id` (direct patch) — but `publish`'s `id` argument must be the draft row's own `_id` (Step 6 merges "the draft row's current fields" directly off `args.id`). The FIRST draft save on a previously-published document returns a brand-new row `_id` that differs from what's currently loaded; without re-pointing the `get` query at it, the Publish button would never become reachable (`isDraftDoc` would never flip true) after an in-session save. This is solved entirely inside `CollectionEditView` with local state — no routing/prop changes, no dependency on any other cluster's files.

7 files: 3 new, 4 existing-file edits.

#### packages/react/src/components/views/StatusBadge.tsx

```tsx
"use client";

import { Badge } from "../ui/badge";

/** Publish-state values a versioned document's status badge can render. */
export type DocumentStatus = "draft" | "published";

/** Props for {@link StatusBadge}. */
export interface StatusBadgeProps {
  /** The document's current publish state — its `vex_status` field. */
  status: DocumentStatus;
}

/**
 * Small pill indicating whether a versioned document (or global) is
 * currently a draft or published — used in the edit-view draft toolbar
 * (`CollectionEditView`, `GlobalEditView`), `VersionHistoryDropdown`'s
 * per-version rows, and the collapsed list-view row Step 11 introduces.
 *
 * A collection/global with `versions.drafts: false` never has a `vex_status`
 * field at all — every caller only renders this component when
 * `collection.versions.drafts` (or the equivalent global check) is `true`,
 * so it never has to handle a third/`undefined` state itself.
 *
 * @param props - See {@link StatusBadgeProps}.
 * @returns A `Badge` reading "Draft" (outline — muted, work in progress) or
 *   "Published" (default — the emphasized state, since this is what public
 *   readers see).
 * @throws Never.
 *
 * @example
 * ```tsx
 * <StatusBadge status={isDraftDoc ? "draft" : "published"} />
 * ```
 */
export function StatusBadge(props: StatusBadgeProps) {
  // TODO: implement
  // 1. Map `props.status` to a `Badge` variant + label:
  //    a. "draft" → `variant="outline"`, label "Draft".
  //    b. "published" → `variant="default"`, label "Published".
  // 2. Return `<Badge variant={variant}>{label}</Badge>`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/lib/errors.ts

1 edit: a new export beside the existing `getVexErrorMessage`, reusing the same `StructuredErrorData` shape it already documents. `publish.server.ts` (Step 6) mirrors `create`'s two-phase validation, so it throws one of two distinct shapes before any write happens: a Zod schema failure (`{ message: "Validation failed", errors: parsed.error.message }` — and Zod's default `.message` getter is `JSON.stringify(issues, null, 2)`, confirmed against the installed `zod` version, so `data.errors` is parseable back into `{ path, message }[]`), or a `validateFields` custom-hook failure (`{ message: "Validation failed", field: fieldKey, error }` — a single named field, same shape `validateFields.ts` already throws today). This new helper is the one place that knows how to turn either shape into per-field `FormError` state, so `CollectionEditView`'s Publish handler and `GlobalEditView`'s (Step 15) don't each reimplement the parse.

**1 — new export, placed after `getVexErrorMessage`.**

```ts
import type { AnyFormApi } from "../components/form/AppFormContext";

/**
 * Applies a caught write-mutation error's field-specific detail onto a
 * TanStack Form instance, so the SAME `FormError` component every field
 * input already renders through (`components/form/FormError.tsx`, which
 * reads `field.state.meta.errors[0]`) displays it — no separate error UI.
 *
 * Recognizes exactly the two `ConvexError` shapes `publish.server.ts` (and
 * `create`/`update`'s own strict-schema path) can throw:
 * - `{ field, error }` (`validateFields.ts`'s shape) — one named field.
 * - `{ errors }` (a Zod schema failure) — `errors` is `ZodError.message`,
 *   which is `JSON.stringify(issues, null, 2)` by default, so it parses
 *   back into `{ path, message }[]`; every issue's `path[0]` names a
 *   top-level field.
 *
 * Never throws — an error that matches neither shape (or a Zod `errors`
 * string that fails to parse) is a silent no-op, since the caller's own
 * `getVexErrorMessage(error)` toast already covers the generic case.
 *
 * @param form - The edit view's form instance.
 * @param error - The value caught from the failed mutation call.
 * @returns Nothing. Field-level errors, if any were found, are already
 *   applied to `form`'s meta by the time this returns.
 *
 * @example
 * ```ts
 * try {
 *   await publishMutation({ collection, id, data });
 * } catch (error) {
 *   applyVexFieldErrors(form, error);
 *   toast.error("Publish failed", { description: getVexErrorMessage(error) });
 * }
 * ```
 */
export function applyVexFieldErrors(form: AnyFormApi, error: unknown): void {
  // TODO: implement
  // 1. `if (!(error instanceof ConvexError)) return;` — nothing to parse.
  // 2. `const data = error.data;` → not a non-null object → return.
  // 3. `field` case: `typeof data.field === "string"` →
  //    `form.setFieldMeta(data.field, (prev) => ({ ...prev, errorMap: {
  //    ...prev.errorMap, onSubmit: typeof data.error === "string" ? data.error
  //    : "Invalid value" } }))` → return (this shape never also carries `errors`).
  // 4. `errors` case: `typeof data.errors === "string"` →
  //    a. `try { issues = JSON.parse(data.errors) } catch { return; }` —
  //       malformed/non-JSON `errors` (e.g. a plain string from some other
  //       throw site) is not this shape; bail silently.
  //    b. `if (!Array.isArray(issues)) return;`
  //    c. For each `issue` with a non-empty `issue.path` array and a string
  //       `issue.message`: `form.setFieldMeta(String(issue.path[0]), (prev)
  //       => ({ ...prev, errorMap: { ...prev.errorMap, onSubmit:
  //       issue.message } }))`.
  // Edge cases:
  // - A field name from step 4c that names a field currently hidden by
  //   field-level RBAC narrowing (not mounted in this render) — `setFieldMeta`
  //   still records the meta; nothing reads it until that field mounts, which
  //   never happens here, so it is inert, not an error.
  // - Nested field paths (`issue.path` longer than one segment, e.g. a
  //   `group`/`array` field) — only `path[0]` is used; a leaf-level error
  //   inside a group surfaces on the group's own top-level `FormError`
  //   rather than the specific nested input. Acceptable for v1: `publish`'s
  //   strict-schema failures are overwhelmingly "required top-level field is
  //   missing," per decision 2's own framing.
  throw new Error("Not implemented");
}
```

#### packages/react/src/components/views/CollectionEditView.tsx

7 edits; everything else in the file is unchanged.

**1 — imports.** Beside the existing `@tanstack/react-query` import, add `useMutation`. Beside the existing `@convex-dev/react-query` import, add `useConvexMutation`. In the existing `@vexcms/core` named-import block, add `DRAFT_ACTIONS`. Add three new imports: `StatusBadge`, the two `lib/errors` helpers, and `sonner`'s `toast`.

```tsx
import { useMutation, useQuery } from "@tanstack/react-query";
```

```tsx
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  isFieldAllowed,
  vexConvexApi,
} from "@vexcms/core";
```

```tsx
import { StatusBadge } from "./StatusBadge";
import { applyVexFieldErrors, getVexErrorMessage } from "../../lib/errors";
import { toast } from "sonner";
```

**2 — track the currently-loaded row's id, and pass `drafts` to `get`.** Beside `const collection = config.collections.find(...)`'s `!collection` guard, before the `currentDocument` query, add the tracking state (seeded from the prop, so a non-versioned collection's behavior is unchanged — it just never gets re-pointed). Then extend the `get` query's args.

```tsx
  const [activeDocumentId, setActiveDocumentId] = useState(props.documentId);
```

Inside the existing `convexQuery(vexConvexApi.get, { ... })` call, change `id: props.documentId` to `id: activeDocumentId` and add one line:

```tsx
      id: activeDocumentId,
      collection: collection.slug,
      drafts: collection.versions.drafts,
```

**3 — versioning + permission flags.** Beside the existing `canEdit`/`fieldPermissions` block.

```tsx
  const isVersioned = collection.versions.drafts;
  const isDraftDoc = currentDocument.vex_status === "draft";
  const canSaveDraft = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.saveDraft,
    data: currentDocument,
  });
  const canPublish = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.publish,
    data: currentDocument,
  });
  const canUnpublish = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.unpublish,
    data: currentDocument,
  });
```

**4 — draft mutations.** Beside the existing `const { mutateAsync, isPending } = useVexMutation({...})` block for `update`. Bypasses `useVexMutation` deliberately: that hook's `operation` param is typed `VexMutationOperation` (`"create" | "remove" | "update" | "upsert"` — `packages/core/src/revalidate/types.ts:19`), which has no draft-workflow member, and nothing in this spec wires draft/publish/unpublish into the ISR-purge pipeline `useVexMutation` exists for.

```tsx
  const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });
  const { mutateAsync: publishMutation, isPending: isPublishing } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.publish),
  });
  const { mutateAsync: unpublishMutation, isPending: isUnpublishing } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.unpublish),
  });
```

**5 — draft toolbar handlers.** After the block from edit 4, before `const [tempId] = useState(...)`.

```tsx
  /**
   * Persists the form's currently-dirty field values as a draft, without
   * publishing them. Reuses `changedValues(form)` — the same diff-submit
   * helper the plain `update` path already uses — so a partial patch is
   * sent, matching `saveDraft`'s lenient-partial validation on the server.
   *
   * @returns Promise resolving once the draft row is saved.
   * @throws Never — a rejected mutation is caught and toasted, never
   *   re-thrown, since this is a manually-triggered background-ish action,
   *   not a form submit the caller is awaiting a result from.
   */
  async function handleSaveDraft(): Promise<void> {
    // TODO: implement
    // 1. `try { const draftId = await saveDraftMutation({ collection:
    //    collection.slug, id: activeDocumentId, data: changedValues(form) });
    //    setActiveDocumentId(draftId); }` — `activeDocumentId` may currently be
    //    the published row's id (first save) or an existing draft's id
    //    (repeat save); `saveDraft`'s server accepts either (Step 5:
    //    find-or-bootstrap). `setActiveDocumentId` is a no-op on a repeat
    //    save (the returned id equals the one already loaded).
    // 2. `catch (error) { toast.error("Save draft failed", { description:
    //    getVexErrorMessage(error) }); }` — no field-level parsing here;
    //    `saveDraft`'s lenient-partial validation rejecting is rare and not
    //    the case decision 2/Step 12's acceptance criterion is about.
    // Edge cases: `!canSaveDraft` already disables the calling button — this
    // function is unreachable without the permission, matching the server gate.
    throw new Error("Not implemented");
  }

  /**
   * Publishes the currently-open draft, promoting its fields onto the
   * published row. Surfaces Step 6's strict-validation rejection as
   * field-level errors via {@link applyVexFieldErrors}, reusing the same
   * `FormError` display every field input already renders through.
   *
   * @returns Promise resolving once publish completes (or rejects).
   * @throws Never — a rejected mutation is caught, applied to the form, and
   *   toasted, never re-thrown.
   */
  async function handlePublish(): Promise<void> {
    // TODO: implement
    // 1. `try { const publishedId = await publishMutation({ collection:
    //    collection.slug, id: activeDocumentId, data: changedValues(form) });
    //    setActiveDocumentId(publishedId); }`
    //    → Step 6's server: a never-published draft promotes in place
    //      (`publishedId === activeDocumentId`, `setActiveDocumentId` is a
    //      no-op); a draft with a published parent copies fields onto the
    //      parent and deletes the draft row (`publishedId` differs) — either
    //      way the published row's `_id` never changes across repeated
    //      publish cycles (design-review §2.2), only WHICH row this
    //      component currently points at can change.
    // 2. `catch (error) { applyVexFieldErrors(form, error); toast.error(
    //    "Publish failed", { description: getVexErrorMessage(error) }); }`
    //    → the toast fires unconditionally alongside the field-level error,
    //      since a rejection naming a field currently hidden by field-level
    //      RBAC narrowing would otherwise be invisible.
    // Edge cases: `!isDraftDoc` already disables the calling button —
    // publish is only reachable while viewing a draft row.
    throw new Error("Not implemented");
  }

  /**
   * Unpublishes the currently-open published document, flipping it back to
   * draft.
   *
   * @returns Promise resolving once unpublish completes (or rejects).
   * @throws Never — a rejected mutation is caught and toasted, never re-thrown.
   */
  async function handleUnpublish(): Promise<void> {
    // TODO: implement
    // 1. `try { await unpublishMutation({ collection: collection.slug, id:
    //    activeDocumentId }); }` — no `data`; unpublish moves no field
    //    values (Step 7's `changes: undefined` gate).
    // 2. `catch (error) { toast.error("Unpublish failed", { description:
    //    getVexErrorMessage(error) }); }` — Step 7 rejects while a draft row
    //    exists; `!isDraftDoc` already disables the calling button
    //    client-side, but a draft created in another tab between render and
    //    click still surfaces as a rejected mutation here — the server stays
    //    the source of truth (P-004), this is not treated as a bug.
    // Edge cases: none beyond 1 — `isDraftDoc` already covers the documented
    // rejection case client-side.
    throw new Error("Not implemented");
  }
```

**6 — draft toolbar JSX.** Replaces the header's button row: the existing single `<form.Subscribe selector={(state) => state.isDefaultValue} ...>` wrapping `RevalidateButton` + the live-preview toggle + Save/Cancel now keeps `RevalidateButton` and the live-preview toggle unconditional, and branches only the Save/Cancel vs. draft-toolbar portion on `isVersioned`.

```tsx
        <div className="flex flex-wrap items-center gap-2">
          <RevalidateButton collection={collection.slug} doc={currentDocument} />
          {livePreview && (
            <Button
              type="button"
              variant="outline"
              onClick={previewPanel.toggle}
              icon={isSplit ? "Eye" : "EyeOff"}
            >
              {previewPanel.isOpen ? "Hide preview" : "Show preview"}
            </Button>
          )}
          {isVersioned ? (
            <>
              <StatusBadge status={isDraftDoc ? "draft" : "published"} />
              <Button
                type="button"
                variant="outline"
                isPending={isSavingDraft}
                disabled={!canSaveDraft}
                onClick={handleSaveDraft}
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
            </>
          ) : (
            <form.Subscribe
              selector={(state) => state.isDefaultValue}
              children={(isDefaultValue) => (
                <>
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
                </>
              )}
            />
          )}
        </div>
```

#### packages/react/src/components/views/index.tsx

1 edit: barrel export beside the existing `CollectionEditView` export.

```tsx
export * from "./StatusBadge";
```

#### packages/react/src/components/views/StatusBadge.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders a Published badge, using the default (emphasized) Badge variant", () => {
    // TODO: implement
    // 1. `render(<StatusBadge status="published" />)`.
    // 2. `screen.getByText("Published")` exists.
    // 3. Its rendered element carries `data-slot="badge"` and no
    //    `data-variant`/class marker for "outline" (Badge's default variant
    //    applies no extra class beyond `badgeVariants({ variant: "default" })`
    //    — assert against the specific class string `badgeVariants` emits
    //    for `variant: "default"`, not an incidental snapshot).
    throw new Error("Not implemented");
  });

  it("renders a Draft badge, using the outline Badge variant", () => {
    // TODO: implement
    // 1. `render(<StatusBadge status="draft" />)`.
    // 2. `screen.getByText("Draft")` exists; `screen.queryByText("Published")`
    //    is null.
    // 3. Its rendered element's class string matches `badgeVariants({
    //    variant: "outline" })`'s output.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/react test && pnpm --filter www build`

### Step 13 — `VersionHistoryDropdown` `[dev]`

Why: Depends on Step 8's gated reads and Step 12's toolbar slot. Reads `listVersions`/`getVersionSnapshot` as live Convex subscriptions (`convexQuery` + `useQuery`, the same pattern `CollectionEditView`'s own `get` query already uses) — a `deleteVersion` call needs no manual cache invalidation, since Convex's reactivity re-delivers the updated `listVersions` result to every subscriber automatically.

Consumes the `AppFormContext` the edit view already provides (`useAppForm()`, `packages/react/src/components/form/AppFormContext.ts:79`) for restore's form hydration, rather than taking a `form` prop — this is exactly why the shared contract's usage example (`<VersionHistoryDropdown collection={slug} documentId={id} />`) carries only two props: it renders as a descendant of `<AppForm form={form}>` inside `CollectionEditView`, the same way every field input already reaches the form with "no controller prop needed" (per `CollectionEditView`'s own JSDoc).

One necessary addition beyond the two-prop contract: an **optional** `onRestored` callback. `saveDraft`'s polymorphic `id` (Step 5: accepts the published row's id to bootstrap-or-find, or an existing draft's id to patch directly) means a restore that bootstraps a brand-new draft row (restoring an old version onto a document that has no active draft yet) returns a DIFFERENT `_id` than `props.documentId` — exactly the same "which row am I currently looking at" problem Step 12 solves for its own Save Draft button, via `activeDocumentId` state. Restore has to feed that same state, or the toolbar's status badge and Publish-availability would never reflect the just-created draft. `onRestored` is optional and additive — it does not change the required `{ collection, documentId }` shape any other caller (Step 15's `GlobalEditView`) relies on; a caller that omits it just doesn't get that re-pointing (globals address by stable `slug`, not a row `_id`, so they likely never hit this problem at all — confirmed by Step 15's own `upsert.server.ts` reusing `vex_globals` + slug, not a swapped `_id`).

3 files: 2 new, 1 tiny existing-file edit (plus one more small edit to `CollectionEditView.tsx`, wiring this component into last step's toolbar).

#### packages/react/src/components/views/VersionHistoryDropdown.tsx

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { DRAFT_ACTIONS, vexConvexApi, type CollectionSlug, type VersionSummary } from "@vexcms/core";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { StatusBadge } from "./StatusBadge";
import { usePermission } from "../../hooks";
import { useAppForm } from "../form/AppFormContext";
import { getVexErrorMessage } from "../../lib/errors";
import { toast } from "sonner";

/** Props for {@link VersionHistoryDropdown}. */
export interface VersionHistoryDropdownProps {
  /** Collection slug the versioned document belongs to. */
  collection: CollectionSlug;
  /** The document's currently-loaded Convex `_id` — the published row, or an active draft's own row. */
  documentId: string;
  /**
   * Called after a restore bootstraps or patches a draft row, with that
   * row's `_id`. Lets a caller that tracks "which row is currently loaded"
   * (`CollectionEditView`'s `activeDocumentId`) stay in sync when restore
   * creates a NEW row rather than patching the one already loaded. Optional
   * — a caller whose addressing scheme never needs this (e.g. a
   * slug-addressed global) may omit it.
   */
  onRestored?: (draftId: string) => void;
}

/**
 * Version-history menu for a versioned document's edit view: lists every
 * `vex_versions` row for the document (newest first), with each row's
 * version number, status, `publishedAt` (when present), creator, and
 * timestamp. The newest (first) row is the current version and renders with
 * no restore/delete actions of its own — restoring or deleting "the current
 * version" is meaningless.
 *
 * Restore is client-side: it fetches the target version's immutable
 * snapshot, hydrates every snapshot field directly onto the live form (the
 * user sees the restored content immediately and can still edit or discard
 * it before saving), then persists it as a new/updated draft via
 * `saveDraft({ restoredFrom })` — never a server-side "restore" mutation of
 * its own.
 *
 * Renders nothing at all without `readDrafts` (Step 8 gates both reads on
 * it) — there is no permission-denied state to show, since the trigger
 * button itself would have nothing to open. The delete action on each row
 * renders only with `deleteVersions`.
 *
 * @param props - See {@link VersionHistoryDropdownProps}.
 * @returns The history dropdown trigger + menu, plus a delete-confirmation
 *   dialog, or `null` without `readDrafts`.
 * @throws Never — restore/delete failures are caught and toasted.
 *
 * @example
 * ```tsx
 * // Rendered inside <AppForm form={form}> alongside the draft toolbar
 * <VersionHistoryDropdown
 *   collection={collection.slug}
 *   documentId={activeDocumentId}
 *   onRestored={setActiveDocumentId}
 * />
 * ```
 */
export function VersionHistoryDropdown(props: VersionHistoryDropdownProps) {
  const form = useAppForm();
  const canReadDrafts = usePermission({ resource: props.collection, action: DRAFT_ACTIONS.readDrafts });
  const canSaveDraft = usePermission({ resource: props.collection, action: DRAFT_ACTIONS.saveDraft });
  const canDeleteVersions = usePermission({
    resource: props.collection,
    action: DRAFT_ACTIONS.deleteVersions,
  });
  const [versionPendingDelete, setVersionPendingDelete] = useState<number | null>(null);

  const { data: versions } = useQuery({
    ...convexQuery(vexConvexApi.versions.listVersions, {
      collection: props.collection,
      documentId: props.documentId,
    }),
    enabled: canReadDrafts,
  });

  const { mutateAsync: saveDraftMutation } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });
  const { mutateAsync: deleteVersionMutation, isPending: isDeleting } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.deleteVersion),
  });

  /**
   * Restores an older version's content onto the live form and persists it
   * as a draft.
   *
   * @param version - The `vex_versions` row's `version` number to restore.
   * @returns Promise resolving once the snapshot is fetched, hydrated onto
   *   the form, and saved as a draft.
   */
  async function handleRestore(version: number): Promise<void> {
    // TODO: implement
    // 1. `try {`
    // 2. `const { snapshot } = await queryClient.fetchQuery(convexQuery(
    //    vexConvexApi.versions.getVersionSnapshot, { collection:
    //    props.collection, documentId: props.documentId, version }));`
    //    — `queryClient` from `useQueryClient()` (add the import/call) — a
    //    one-shot fetch, not a subscription; the snapshot is immutable
    //    history, never re-read reactively.
    // 3. For each `[key, value]` of `Object.entries(snapshot)`:
    //    `form.setFieldValue(key, value);` — no `dontUpdateMeta` (unlike
    //    `useLiveFieldMerge`): this IS a user-visible edit the user should
    //    see as dirty/undoable via Cancel, not a silent background merge.
    //    Snapshots never contain reserved fields (`extractUserFields`, Step
    //    4, strips `VERSION_SYSTEM_FIELDS`) before writing them), so no
    //    reserved field is ever hydrated onto the form.
    // 4. `const draftId = await saveDraftMutation({ collection:
    //    props.collection, id: props.documentId, data: snapshot,
    //    restoredFrom: version });`
    // 5. `props.onRestored?.(draftId);`
    // 6. `} catch (error) { toast.error("Restore failed", { description:
    //    getVexErrorMessage(error) }); }`
    // Edge cases: the calling row is never rendered for the CURRENT version
    // (see the render logic below) and is hidden entirely without
    // `canSaveDraft` — both narrow this to a reachable, permitted action.
    throw new Error("Not implemented");
  }

  /**
   * Permanently deletes the version row pending confirmation
   * (`versionPendingDelete`).
   *
   * @returns Promise resolving once the row is deleted (or the attempt fails).
   */
  async function handleConfirmDelete(): Promise<void> {
    // TODO: implement
    // 1. `if (versionPendingDelete === null) return;`
    // 2. `try { await deleteVersionMutation({ collection: props.collection,
    //    documentId: props.documentId, version: versionPendingDelete }); }
    //    catch (error) { toast.error("Delete failed", { description:
    //    getVexErrorMessage(error) }); }`
    //    → no manual refetch: `listVersions`'s `useQuery` is a live Convex
    //      subscription and updates on its own once the row is gone.
    // 3. `finally { setVersionPendingDelete(null); }` — closes the dialog
    //    whether the delete succeeded or failed; a failed delete already
    //    surfaced via the toast in step 2.
    throw new Error("Not implemented");
  }

  if (!canReadDrafts) return null;

  const rows = versions ?? [];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" icon="History">
              History
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Version history</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* TODO: implement the row list */}
          {/* 1. `rows.length === 0` → a single muted "No history yet" line. */}
          {/* 2. Otherwise, `rows.map((version, index) => ...)`: */}
          {/*    a. `isCurrent = index === 0` (rows arrive newest-first). */}
          {/*    b. Each row: version number, `<StatusBadge status={version.status} />`, */}
          {/*       `version.publishedAt` formatted (only rendered when set), */}
          {/*       `version.createdBy` (only rendered when set), and */}
          {/*       `new Date(version._creationTime).toLocaleString()`. */}
          {/*    c. `!isCurrent && canSaveDraft` → a "Restore" icon button */}
          {/*       (`onClick={() => handleRestore(version.version)}`). */}
          {/*    d. `!isCurrent && canDeleteVersions` → a "Delete" icon button */}
          {/*       (`onClick={() => setVersionPendingDelete(version.version)}`). */}
          {/*    e. A plain row `<div>`, not `DropdownMenuItem` — this is */}
          {/*       compound content with its own inline action buttons, not */}
          {/*       a single selectable item (matching `DropdownMenuLabel`/ */}
          {/*       `DropdownMenuSeparator` already being non-`Item` children */}
          {/*       of `DropdownMenuContent`). */}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={versionPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setVersionPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete version {versionPendingDelete}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this version's history row. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              isPending={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

#### packages/react/src/components/views/index.tsx

1 edit: barrel export beside the `StatusBadge` export Step 12 just added.

```tsx
export * from "./VersionHistoryDropdown";
```

#### packages/react/src/components/views/CollectionEditView.tsx

1 edit: renders `VersionHistoryDropdown` in the draft toolbar Step 12 built. Inside the `isVersioned` branch's `<>...</>` fragment, immediately after `<StatusBadge status={isDraftDoc ? "draft" : "published"} />`:

```tsx
              <VersionHistoryDropdown
                collection={collection.slug}
                documentId={activeDocumentId as string}
                onRestored={setActiveDocumentId}
              />
```

Plus one import beside the `StatusBadge` import added in Step 12:

```tsx
import { VersionHistoryDropdown } from "./VersionHistoryDropdown";
```

#### packages/react/src/components/views/VersionHistoryDropdown.test.tsx

```tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { VersionHistoryDropdown } from "./VersionHistoryDropdown";

describe("VersionHistoryDropdown", () => {
  beforeEach(() => {
    // TODO: implement
    // Reset the mocked `usePermission` / `useQuery` / `useMutation` /
    // `useAppForm` this suite installs (this file mocks the hook modules
    // directly, the same way `CollectionListView.test.tsx`'s versioned-list
    // suite mocks `usePermission`/`usePaginatedQuery` — no live `convexTest`
    // instance is needed here, since every server round trip is mocked).
  });

  it("renders nothing without readDrafts", () => {
    // TODO: implement
    // 1. Mock `usePermission` to return `false` for every action.
    // 2. `render(<VersionHistoryDropdown collection="posts" documentId="doc1" />)`.
    // 3. `screen.queryByText("History")` is null — the trigger button itself
    //    never renders.
    throw new Error("Not implemented");
  });

  it("hides the Delete action on every row without deleteVersions", () => {
    // TODO: implement
    // 1. Mock `usePermission` to return `true` for `readDrafts`, `false` for
    //    `deleteVersions`.
    // 2. Mock `useQuery` (`listVersions`) to return two version summaries.
    // 3. Open the dropdown (`fireEvent.click(screen.getByText("History"))`).
    // 4. Assert no "Delete" control renders for either row.
    throw new Error("Not implemented");
  });

  it("highlights the newest version as current and hides restore/delete on it", () => {
    // TODO: implement
    // 1. Mock full permissions; mock `listVersions` returning versions
    //    `[3, 2, 1]` (newest-first, matching the server's documented order).
    // 2. Open the dropdown.
    // 3. Version 3's row has no "Restore"/"Delete" control; versions 2 and 1 do.
    throw new Error("Not implemented");
  });

  it("restore hydrates the form from the fetched snapshot, then saves a draft with restoredFrom set", async () => {
    // TODO: implement
    // 1. Mock `useAppForm` to return a form double exposing a spy
    //    `setFieldValue`.
    // 2. Mock `getVersionSnapshot` (via `queryClient.fetchQuery` or the
    //    mocked `useQuery`/query-client the component actually calls) to
    //    resolve `{ snapshot: { title: "Old title" }, status: "published" }`.
    // 3. Mock the `saveDraft` mutation to resolve `"draft123"`.
    // 4. Render with an `onRestored` spy; open the dropdown; click "Restore"
    //    on a non-current row.
    // 5. `await waitFor(...)`: `setFieldValue` was called with `("title",
    //    "Old title")`; the mocked `saveDraft` mutation function was called
    //    with `restoredFrom` equal to the clicked row's version number; the
    //    `onRestored` spy was called with `"draft123"`.
    throw new Error("Not implemented");
  });

  it("delete asks for confirmation, then calls deleteVersion with the targeted version", async () => {
    // TODO: implement
    // 1. Mock full permissions; mock `listVersions` returning versions
    //    `[2, 1]`; mock `deleteVersion` to resolve.
    // 2. Open the dropdown; click "Delete" on version 1.
    // 3. Assert the confirmation dialog is visible and `deleteVersion` has
    //    NOT been called yet.
    // 4. Click the dialog's "Delete" action.
    // 5. `await waitFor(...)`: the mocked `deleteVersion` mutation function
    //    was called with `{ collection: "posts", documentId: "doc1",
    //    version: 1 }`; the dialog is closed.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/react test`

### Step 14 — Autosave `[dev]`

Why: Needs the toolbar and `saveDraft` in place. Fires on settled change, not a fixed interval — the same reasoning design-review §6.2 already established still holds. Mirrors the debounce-on-settle shape `useLivePreviewSync.ts` already proves out in this codebase (a `useEffect` keyed on the live form values, `setTimeout(fn, debounceMs)` scheduled fresh on every change, cleared on the next one) — no new debounce primitive, no polling/interval anywhere.

`useAutosave` is left generic (`{ values, onSave, enabled?, debounceMs? }`, not `{ form, collection, id }`) per the shared contract, so it never imports `AnyFormApi` or `@vexcms/core`'s versions API itself — the caller (`CollectionEditView` here, `GlobalEditView` in Step 15) supplies `values` as `changedValues(form)` and binds `onSave` to its own `saveDraft` mutation. This is also why wiring it into `CollectionEditView` is included below even though it isn't separately itemized in the file list above: a hook nothing calls is dead code the moment it lands, and the wiring is a small, self-contained addition to the same toolbar Step 12 already built (no new file, no new export beyond the hook itself).

4 files: 2 new, 2 existing-file edits.

#### packages/react/src/hooks/useAutosave.ts

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONSTRAINT_COMPARATORS, DEFAULT_AUTOSAVE_DEBOUNCE_MS } from "@vexcms/core";

/** Current state of an {@link useAutosave} instance. */
export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/** Return value of {@link useAutosave}. */
export interface UseAutosaveResult {
  /** Current autosave state. */
  status: AutosaveStatus;
  /** `Date.now()` of the last successful save, or `null` before the first one. */
  lastSavedAt: number | null;
  /** The error from the most recent failed save, or `null`. */
  error: Error | null;
}

/**
 * Persists `props.values` via `props.onSave` whenever they settle into a new
 * state, debounced — never on a fixed interval, and never merging ("no
 * coalescing") a change that arrives while a save is already in flight into
 * that in-flight request. A change during an in-flight save instead waits
 * for it to finish, then retries independently with the latest values.
 *
 * Comparison is against the values from the LAST SUCCESSFUL save (seeded
 * from `props.values` at mount, so mounting never itself counts as a
 * change), via `CONSTRAINT_COMPARATORS.eq` (content equality — the same
 * comparator `useLiveFieldMerge` already uses for this exact "did this
 * actually change" question, since a fresh `changedValues(form)` object is
 * a new reference on every render even when its contents match).
 *
 * A failed save does NOT update the last-saved baseline, so the next settle
 * retries the same diff rather than silently dropping it.
 *
 * @param props - Hook props.
 * @param props.values - The current value snapshot to keep saved. Typically
 *   `changedValues(form)` — only the fields the user has actually edited.
 * @param props.onSave - Persists `values`. Any rejection is caught and
 *   surfaced via `error`/`status`, never left as an unhandled rejection.
 * @param props.enabled - Whether autosave is active at all. Defaults to
 *   `true`. Flipping to `false` mid-debounce cancels the pending save.
 * @param props.debounceMs - Milliseconds of no further change before saving.
 *   Defaults to `DEFAULT_AUTOSAVE_DEBOUNCE_MS`.
 * @returns The current {@link UseAutosaveResult}.
 *
 * @example
 * ```tsx
 * const { status } = useAutosave({
 *   values: changedValues(form),
 *   onSave: (changes) => saveDraftMutation({ collection: collection.slug, id: activeDocumentId, data: changes }),
 *   enabled: collection.versions.autosave && canSaveDraft,
 * });
 * ```
 */
export function useAutosave<TValues extends Record<string, unknown>>(props: {
  values: TValues;
  onSave: (values: TValues) => Promise<unknown>;
  enabled?: boolean;
  debounceMs?: number;
}): UseAutosaveResult {
  // TODO: implement
  // 1. `const [status, setStatus] = useState<AutosaveStatus>("idle");`
  //    `const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);`
  //    `const [error, setError] = useState<Error | null>(null);`
  // 2. Refs:
  //    a. `const lastSavedValuesRef = useRef<TValues>(props.values);` — seeded
  //       with the CURRENT values, never `{}`, so mount is never a change.
  //    b. `const latestValuesRef = useRef<TValues>(props.values);` —
  //       assigned during the render body (`latestValuesRef.current =
  //       props.values;`, unconditionally, every render) so it is always
  //       fresh before `runSave` (step 3) can read it, including for the
  //       in-flight-retry path in step 3d.
  //    c. `const isSavingRef = useRef(false);`
  //       `const hasPendingChangeRef = useRef(false);`
  // 3. `const runSave = useCallback(async () => {`
  //    a. `isSavingRef.current = true; setStatus("saving");`
  //    b. `const toSave = latestValuesRef.current;`
  //    c. `try { await props.onSave(toSave); lastSavedValuesRef.current =
  //       toSave; setStatus("saved"); setLastSavedAt(Date.now());
  //       setError(null); }`
  //    d. `catch (caught) { setStatus("error"); setError(caught as Error); }`
  //       → `lastSavedValuesRef` is NOT updated on failure — the next settle
  //         (or the immediate retry below) re-attempts the same diff.
  //    e. `finally { isSavingRef.current = false; if
  //       (hasPendingChangeRef.current) { hasPendingChangeRef.current =
  //       false; if (!CONSTRAINT_COMPARATORS.eq(latestValuesRef.current,
  //       lastSavedValuesRef.current)) void runSave(); } }`
  //       → covers a change that landed while THIS save was in flight and
  //         the user then stopped typing entirely, so no further debounce
  //         timer would otherwise ever fire to retry it. Never merges that
  //         change into the request that just finished (no coalescing) —
  //         it is its own, independent `onSave` call.
  //    `}, [props.onSave]);`
  // 4. `useEffect(() => {`
  //    a. `if (props.enabled === false) return;` — no-op, no timer.
  //    b. `if (CONSTRAINT_COMPARATORS.eq(props.values,
  //       lastSavedValuesRef.current)) return;` — nothing changed since the
  //       last successful save (or since mount); this, not a fixed interval,
  //       is the entire trigger condition.
  //    c. `if (isSavingRef.current) { hasPendingChangeRef.current = true;
  //       return; }` — a save is already in flight; step 3e's retry covers
  //       this settle once it finishes.
  //    d. `const timeoutId = setTimeout(runSave, props.debounceMs ??
  //       DEFAULT_AUTOSAVE_DEBOUNCE_MS);`
  //    e. `return () => clearTimeout(timeoutId);` — a further keystroke
  //       before the timer fires cancels THIS attempt; the newer effect run
  //       (new `props.values`) schedules the real one, so a burst of rapid
  //       edits produces exactly one save once things settle, not one per
  //       keystroke.
  //    `}, [props.values, props.enabled, props.debounceMs, runSave]);`
  // 5. `return { status, lastSavedAt, error };`
  // Edge cases:
  // - `props.values` is deep-equal but a new object reference every render
  //   (e.g. a fresh `changedValues(form)` call) — step 4b's comparator is
  //   content equality, not `===`, so this never causes a spurious save.
  // - `props.enabled` flips to `false` mid-debounce — the dependency change
  //   re-runs the effect, so step 4's cleanup (4e) clears the pending timer
  //   before step 4a's guard is even reached again.
  // - Unmount mid-debounce — same cleanup path; no `setState` call after
  //   unmount, no orphaned save.
  throw new Error("Not implemented");
}
```

#### packages/react/src/hooks/index.ts

1 edit: barrel export beside the existing `useVexMutation`/`useVexRevalidate` exports.

```ts
export * from "./useAutosave";
```

#### packages/react/src/components/views/CollectionEditView.tsx

1 edit: wires `useAutosave` using the toolbar's own `changedValues(form)`/`saveDraftMutation` from Steps 12-13, gated on the collection's `versions.autosave` flag and the same `canSaveDraft` permission the manual button already gates on. Placed after the draft-toolbar handlers (`handleSaveDraft`/`handlePublish`/`handleUnpublish`) added in Step 12, before `const [tempId] = useState(...)`.

```tsx
  import { useAutosave } from "../../hooks/useAutosave";
```

_(added to the existing `../../hooks` import block from Step 12, beside `usePermission`/`useVexMutation`/etc. — this hook is exported from the package's `hooks` barrel, not a standalone path import; shown here as its own line only to name what's added.)_

```tsx
  useAutosave({
    values: changedValues(form),
    onSave: (changes) =>
      saveDraftMutation({ collection: collection.slug, id: activeDocumentId, data: changes }).then(
        (draftId) => {
          setActiveDocumentId(draftId);
        },
      ),
    enabled: isVersioned && collection.versions.autosave && canSaveDraft,
  });
```

Edge case worth naming explicitly: this `onSave` closure calls `setActiveDocumentId` from inside `useAutosave`'s internal `runSave` — a state update from a callback the hook invokes asynchronously, not from an event handler. This is ordinary React (state updates from an async callback's `.then` are always safe to call, regardless of what triggered the callback) — noted only because it is the one place autosave and the manual Save Draft button converge on the same piece of state.

Verify: `pnpm --filter @vexcms/react test`

### Step 15 — `GlobalEditView` draft toolbar `[dev]`

Why: Step 1 already widened `GlobalConfig.versions`; this wires it through. Globals have no per-slug Convex table (design-review §9) — every global lives in the single shared `vex_globals` table (`{ slug, data }`), so the two-row model becomes two ROWS sharing the same `slug`, distinguished by the same `vex_status`/`vex_publishedId` pair a versioned collection carries as top-level columns (Step 2 adds these to `vex_globals` whenever any registered global declares `versions.drafts: true`). Because `by_slug` is not a uniqueness constraint at the Convex level (uniqueness was always enforced by `upsertGlobal`'s own "does a row exist" check), letting a draft row share its published row's `slug` costs nothing at the schema layer — only the *application* logic that assumed "at most one row per slug" has to stop assuming it. That assumption is made in exactly two places: `upsertGlobal` (writes) and `getGlobal` (reads). Design-review §3.1 is explicit that status filtering is "data integrity… required on every query path, including single-document `get` and slug lookups" — so beyond the two files spec-tasks.md names directly, this step also touches the small, non-optional plumbing that keeps `getGlobal`/`upsertGlobal` truthful once a slug can resolve to two rows: `getGlobalInputSchema` needs a lenient/strict switch (mirroring `getCollectionInputSchema({ partial })`, which `saveDraft` vs. `publish` both depend on), `flattenGlobalRow` needs to surface the three new columns onto the flat document `StatusBadge`/`GlobalEditView` read, `getGlobal` needs to stop always returning whichever row `by_slug` happens to return first, and the `globalsApi()` Convex registrations (`get`/`upsert`) need to forward the two new client-facing arguments (`drafts`, `action`) their server functions now accept — a Convex `args` validator silently drops anything it doesn't declare, so skipping this would make the whole feature unreachable from a real deployment. None of this is `versionsApi` (Step 9): that factory is collection-shaped (`getCollectionInputSchema`, per-collection generated tables) and authorizes against `resource: args.collection`, which is wrong for a global — a global's resource is its own slug, not the literal string `"vex_globals"`. `upsertGlobal` therefore dispatches all three draft actions itself, reusing only the table-agnostic leaf helpers from `packages/core/src/versioning/model.ts` (`createVersion`), not the collection-shaped `api/versions/*` mutations.

Two things Step 12/13/14 give globals for free and two this step deliberately does not add:
- `StatusBadge` (Step 12) is reused as-is — pure `{ status }` component, no globals-specific variant needed.
- `HasDrafts<T>`/`DRAFT_ACTIONS` visibility (Step 1 + access/types.ts, already generic) applies to a global's action union the same way it does a collection's — no `access/` changes needed here either.
- **`VersionHistoryDropdown` (Step 13) is out of scope.** It reads through the collection-shaped `listVersions`/`getVersionSnapshot`, which authorize against `resource: args.collection` — reusing them for a global would check permissions against the literal string `"vex_globals"` instead of the global's own slug, the exact RBAC mismatch this spec's write paths were re-scoped to fix. Giving globals real version-history browsing needs its own slug-aware read endpoint, which nothing in this spec calls for, so it isn't built speculatively.
- **`useAutosave` (Step 14) is out of scope.** Nothing in spec-tasks.md wires it to `GlobalEditView`; adding it here would be scope this step was never asked for.
- **`findGlobals`/`globals.find` is a known, deliberately unfixed gap.** It still `.collect()`s every `vex_globals` row unfiltered by status. Nothing in `@vexcms/react` calls it today (`GlobalsListView` renders from static `config.globals`, not a query), so a duplicate draft/published pair is currently unobservable — but a project's own custom `globals.find()` caller (e.g. a footer-nav global) would see both rows once a draft exists. Fixing `findGlobals` has no caller in this spec to prove it against and is left for whichever future spec gives globals real list-view or public bulk-read use, consistent with the anti-speculation rule (`code-rules.md`: "if nothing in this spec calls it, it doesn't go in").

- [ ] `packages/core/src/globals/utils.ts` — `getGlobalInputSchema` gains `partial?: boolean`.
- [ ] `packages/core/src/api/globals/utils.ts` — `flattenGlobalRow` surfaces `vex_status`/`vex_publishedAt`/`vex_publishedId` when present.
- [ ] `packages/core/src/api/globals/upsert.server.ts` — `UpsertGlobalServerArgs` gains `action`; `upsertGlobal` dispatches `saveDraft`/`publish`/`unpublish` for a versioned global, unchanged single-row behavior otherwise.
- [ ] `packages/core/src/api/globals/get.server.ts` — `GetGlobalServerArgs` gains `drafts?: boolean`; `getGlobal` resolves the correct one of up to two same-slug rows.
- [ ] `packages/core/src/api/convex.ts` — `VexGlobalsGetArgs` gains `drafts?`, `VexGlobalsUpdateArgs` gains `action?`.
- [ ] `packages/core/src/api/server.ts` — `globalsApi()`'s `get`/`upsert` Convex registrations accept and forward the two new args.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — same toolbar as Step 12: `StatusBadge` + Save Draft / Publish / Unpublish for a versioned global, unchanged Save/Cancel otherwise.
- [ ] Tests colocated: `packages/core/src/api/globals/upsert.server.test.ts`, `packages/core/src/api/globals/get.server.test.ts`, `packages/react/src/components/views/GlobalEditView.test.tsx`.

#### packages/core/src/globals/utils.ts

One edit — `getGlobalInputSchema` gains the same lenient-mode switch `getCollectionInputSchema` already has, so `upsertGlobal` can validate a draft leniently and a publish strictly from the same field set.

**1 — `getGlobalInputSchema`'s signature and return, mirroring `getCollectionInputSchema` (`collections/utils.ts`) exactly:**

```ts
export function getGlobalInputSchema(props: { global: GlobalConfig; partial?: boolean }) {
  const res: Record<string, ZodType> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.global.fields)) {
    if (fieldDef.admin.hidden) continue;
    res[fieldKey] = adminFieldToInputSchema({ field: fieldDef });
  }
  const schema = z.object({ ...res });
  return props.partial ? schema.partial() : schema;
}
```

Update the function's doc comment to add: `@param props.partial - When true, every field becomes optional (saveDraft's lenient mode); omit for publish's strict, full-schema validation (decision 2).`

#### packages/core/src/api/globals/utils.ts

One edit — `flattenGlobalRow` lifts the three new system columns onto the flat document the same way it already lifts `_id`/`_creationTime`, so `StatusBadge`, `GlobalEditView`, and any permission callback see `doc.vex_status` exactly as a versioned collection's callers see it on their own flat row.

**1 — `flattenGlobalRow`'s body:**

```ts
export function flattenGlobalRow(row: Record<string, unknown>): Record<string, unknown> {
  const { slug, data, _id, _creationTime, vex_status, vex_publishedAt, vex_publishedId } = row as {
    slug: string;
    data: Record<string, unknown>;
    _id: string;
    _creationTime: number;
    vex_status?: "draft" | "published";
    vex_publishedAt?: number;
    vex_publishedId?: string;
  };
  return {
    _id,
    _creationTime,
    _slug: slug,
    ...(vex_status !== undefined ? { vex_status } : {}),
    ...(vex_publishedAt !== undefined ? { vex_publishedAt } : {}),
    ...(vex_publishedId !== undefined ? { vex_publishedId } : {}),
    ...(data ?? {}),
  };
}
```

The three new keys are spread before `...(data ?? {})`, matching how `_id`/`_creationTime`/`_slug` are already placed ahead of it — a global's `data` blob can never contain them (they are reserved the same way `_id`/`_creationTime`/`_slug` are), but ordering it this way keeps the invariant explicit rather than incidental. A non-versioned global's row never has these columns, so all three conditionals are skipped and the return shape is byte-for-byte what it is today.

#### packages/core/src/api/globals/upsert.server.ts

Two edits. The `UpsertGlobalServerArgs` interface gains one field; `upsertGlobal`'s body is shown complete below it since the versioned branch touches nearly every line of the current implementation (row lookup, authorization, validation, and write all change shape once a slug can resolve to two rows).

**1 — new exported type, placed above `UpsertGlobalServerArgs`, and one new field on the interface:**

```ts
/**
 * Draft-lifecycle action `upsertGlobal` performs when the resolved global
 * declares `versions.drafts: true`. Composed by excluding the query-shaped
 * `readDrafts` and the version-pruning `deleteVersions` from `DraftAction`
 * (AP-008 — compose verb unions by shape, not by hand-typing three literals)
 * rather than a parallel string union.
 */
export type UpsertGlobalAction = Exclude<
  DraftAction,
  typeof DRAFT_ACTIONS.readDrafts | typeof DRAFT_ACTIONS.deleteVersions
>;
```

Add to `UpsertGlobalServerArgs`, after `data`:

```ts
  /**
   * Draft-lifecycle action to perform. Read only when the resolved global
   * declares `versions.drafts: true`; ignored on a non-versioned global,
   * which always uses the single-row upsert behavior below. Defaults to
   * `"saveDraft"` when the global is versioned and `action` is omitted —
   * matching `update`'s "just patch it" default, since draft-save is the
   * common case a versioned global's `GlobalEditView` submits through.
   */
  action?: UpsertGlobalAction;
```

Add imports: `DRAFT_ACTIONS`, `type DraftAction` from `../../access` (beside the existing `CRUD_ACTIONS, hasPermission` import), and `createVersion` from `../../versioning/model`.

**2 — `upsertGlobal`'s JSDoc and body, shown complete:**

```ts
/**
 * Upserts a global document in `vex_globals`.
 *
 * **Non-versioned global** (`versions.drafts` is `false`, the default):
 * unchanged from before this spec — strips system keys from `data`, merges
 * onto the stored document, validates against the global's Zod schema, and
 * patches only the changed fields (inserts on first save). `args.action` is
 * never read on this path.
 *
 * **Versioned global** (`versions.drafts` is `true`): the two-row draft model
 * (design-review §1, §9) applies with `vex_globals` as the shared table — a
 * published row and, while a draft is active, a draft row, BOTH carrying the
 * same `slug`, distinguished by `vex_status`/`vex_publishedId` exactly as a
 * versioned collection's own table distinguishes them. `args.action` selects
 * `saveDraft` / `publish` / `unpublish`; each authorizes with `changes:
 * <incoming payload>` (never the stored row — the correction this whole
 * re-scope makes) and records history via `createVersion({ collection:
 * "vex_globals", documentId: slug, ... })`. Unlike a collection's flat row, a
 * global's `data: v.any()` blob never carries `_id`/`vex_*` columns, so there
 * is nothing for `extractUserFields` to strip before a snapshot — `data`
 * itself (or the Zod-validated merge of it) IS the clean snapshot.
 *
 * Throws `ConvexError` on Zod validation failure with a structured `errors`
 * payload, and on an invalid draft-lifecycle transition (publish with no
 * active draft, unpublish with an outstanding draft, unpublish on a global
 * that was never published). Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 * @param args - `{ ctx, slug, data, action?, config }`.
 * @returns The `_id` of the affected `vex_globals` row, as a string. For
 *   `publish`, this is the PUBLISHED row's `_id` (stable across every publish
 *   cycle — never the draft row's, which is deleted once it has a parent).
 *   For `unpublish`, the same published row's `_id`, unchanged by the call.
 *
 * @example
 * ```ts
 * import { upsertGlobal } from "@vexcms/core/server";
 *
 * const draftId = await upsertGlobal({
 *   ctx,
 *   slug: "siteSettings",
 *   data: { siteName: "New Name" },
 *   action: "saveDraft",
 *   config,
 * });
 * ```
 */
export async function upsertGlobal<
  DataModel extends GenericDataModel,
  TSlug extends GlobalSlug = GlobalSlug,
>(args: UpsertGlobalServerArgs<DataModel, TSlug>): Promise<string> {
  const { ctx, slug, data, config } = args;

  const globalConfig = config.globals.find((g) => g.slug === slug);
  if (!globalConfig) {
    throw new ConvexError(`No global registered with slug "${slug}"`);
  }

  const userFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!STRIPPED_KEYS.has(k)) userFields[k] = v;
  }

  // TODO: implement
  // 1. `!globalConfig.versions.drafts` → run TODAY'S single-row logic
  //    UNCHANGED: find the existing row by `by_slug` with `.first()`,
  //    authorize `create` vs `update` by its presence via `resolveAccessCall`
  //    + `hasPermission({ data: storedDoc ?? userFields, changes: userFields
  //    })` (this path already passes `changes` correctly — nothing to fix),
  //    validate the merged doc with `getGlobalInputSchema({ global:
  //    globalConfig })` (no `partial`), and patch-or-insert. `args.action` is
  //    never read here.
  // 2. `globalConfig.versions.drafts` → versioned dispatch:
  //    a. `rows = await ctx.db.query("vex_globals").withIndex("by_slug", (q)
  //       => q.eq("slug", slug as never)).collect()` — at most 2 rows for
  //       this slug, so a plain `.collect()` beats a second indexed
  //       `findDraftRow` lookup that would need the published `_id` first.
  //    b. `publishedRow = rows.find((r) => r.vex_status !== "draft")`,
  //       `draftRow = rows.find((r) => r.vex_status === "draft")` — a row
  //       predating `versions.drafts` has `vex_status: undefined`, treated
  //       as published (mirrors Step 2's "nothing writes the field on a
  //       non-versioned resource" convention).
  //    c. `action = args.action ?? DRAFT_ACTIONS.saveDraft`.
  //    d. `action === DRAFT_ACTIONS.saveDraft`:
  //       i.   `targetRow = draftRow ?? publishedRow` (`undefined` when
  //            brand new).
  //       ii.  `config.access !== undefined` → `resolveAccessCall({ config,
  //            access: args.access, defaultAction: DRAFT_ACTIONS.saveDraft,
  //            resource: slug })` then `hasPermission({ throwOnDenied: true,
  //            access, user, organization, resource, action, data: targetRow
  //            && flattenGlobalRow(targetRow), changes: userFields })` — per
  //            the shared contract, `data` is the stored row OR `undefined`
  //            (not `userFields`, unlike the legacy path's fallback above —
  //            a brand-new draft genuinely has no prior state to describe).
  //       iii. `merged = { ...(targetRow?.data as object | undefined),
  //            ...userFields }`.
  //       iv.  `result = getGlobalInputSchema({ global: globalConfig,
  //            partial: true }).safeParse(merged)` → `!result.success` throws
  //            `ConvexError({ message: "Global validation failed", errors:
  //            result.error.message })`, writes nothing (lenient — an
  //            incomplete draft is allowed, decision 2).
  //       v.   Bootstrap + write:
  //            - Neither row exists (first-ever save) → `ctx.db.insert(
  //              "vex_globals", { slug, data: result.data, vex_status:
  //              "draft" })` — a never-published document is a single draft
  //              row (design-review §1); nothing preceded it, so no
  //              `vex_versions` snapshot yet.
  //            - `publishedRow` exists, no `draftRow` (first edit since a
  //              publish) → snapshot the published row FIRST:
  //              `createVersion({ ctx, collection: "vex_globals",
  //              documentId: slug, status: "published", snapshot:
  //              publishedRow.data, publishedAt: publishedRow.vex_publishedAt
  //              })`, THEN `ctx.db.insert("vex_globals", { slug, data:
  //              result.data, vex_status: "draft", vex_publishedId:
  //              publishedRow._id })`.
  //            - `draftRow` exists → `ctx.db.patch(draftRow._id, { data:
  //              result.data })`.
  //       vi.  `createVersion({ ctx, collection: "vex_globals", documentId:
  //            slug, status: "draft", snapshot: result.data })` — every
  //            saveDraft, bootstrap or not, records the new content.
  //       vii. → the written/patched row's `_id` (string).
  //    e. `action === DRAFT_ACTIONS.publish`:
  //       i.   `!draftRow` → throw `new ConvexError(\`No draft exists to
  //            publish for global "${slug}"\`)` — publish always promotes the
  //            draft row.
  //       ii.  `resolveAccessCall({ ..., defaultAction: DRAFT_ACTIONS.publish
  //            })` + `hasPermission({ ..., data: flattenGlobalRow(draftRow),
  //            changes: userFields, throwOnDenied: true })`.
  //       iii. `merged = { ...(draftRow.data as object), ...userFields }` —
  //            authoritative merge against the DRAFT row, matching `update`'s
  //            merge (no snapshot comparison).
  //       iv.  `result = getGlobalInputSchema({ global: globalConfig
  //            }).safeParse(merged)` — NO `partial` (decision 2: as strict as
  //            a first save). `!result.success` → throw the same `{ message,
  //            errors }` shape, naming the missing/invalid field(s), write
  //            nothing.
  //       v.   `draftRow.vex_publishedId === undefined` (never-published
  //            draft) → `ctx.db.patch(draftRow._id, { data: result.data,
  //            vex_status: "published", vex_publishedAt: Date.now() })`, then
  //            `createVersion({ ctx, collection: "vex_globals", documentId:
  //            slug, status: "published", snapshot: result.data,
  //            publishedAt: <same now> })`. `id = draftRow._id`.
  //       vi.  `draftRow.vex_publishedId` set (draft has a published parent)
  //            → snapshot the SUPERSEDED published state before overwriting:
  //            `createVersion({ ctx, collection: "vex_globals", documentId:
  //            slug, status: "published", snapshot: publishedRow!.data,
  //            publishedAt: publishedRow!.vex_publishedAt })`, then
  //            `ctx.db.patch(publishedRow!._id, { data: result.data,
  //            vex_publishedAt: Date.now() })`, then `ctx.db.delete(
  //            draftRow._id)`. `id = publishedRow!._id` — the published
  //            row's `_id` is never destroyed (design-review §2.2), even
  //            though a global has no relationship-target concern the way a
  //            collection does.
  //       vii. → `id` (string).
  //    f. `action === DRAFT_ACTIONS.unpublish`:
  //       i.   `!publishedRow` → throw `new ConvexError(\`Global "${slug}"
  //            has never been published\`)`.
  //       ii.  `draftRow` exists → throw `new ConvexError("Publish or
  //            discard the active draft before unpublishing")` — the same
  //            "at most one draft row" invariant Step 7 enforces for
  //            collections.
  //       iii. `resolveAccessCall({ ..., defaultAction:
  //            DRAFT_ACTIONS.unpublish })` + `hasPermission({ ..., data:
  //            flattenGlobalRow(publishedRow), changes: undefined,
  //            throwOnDenied: true })` — `changes` is `undefined`: no field
  //            values move, only `vex_status`.
  //       iv.  `ctx.db.patch(publishedRow._id, { vex_status: "draft" })` —
  //            `vex_publishedAt` is left untouched (carried forward, never
  //            rewritten backwards, per Step 7).
  //       v.   `createVersion({ ctx, collection: "vex_globals", documentId:
  //            slug, status: "draft", snapshot: publishedRow.data,
  //            publishedAt: publishedRow.vex_publishedAt })`.
  //       vi.  → `publishedRow._id` (string) — `upsertGlobal` always answers
  //            with a document id, unlike the collection `unpublish`
  //            mutation's `void` (Step 7); one function serves all three
  //            actions here and a caller that doesn't need the id discards
  //            it.
  // Edge cases:
  // - `args.action` supplied on a non-versioned global → ignored (falls into
  //   branch 1); unreachable from `GlobalEditView`, which only ever sets
  //   `action` for a versioned global.
  // - `config.access === undefined` (RBAC off) → skip every
  //   `resolveAccessCall`/`hasPermission` call above, exactly like the
  //   existing legacy path.
  // - `findGlobals`/`globals.find` still returns both rows for a slug with an
  //   active draft — a known, out-of-scope gap (see this step's `Why:`), not
  //   a regression introduced here.
  throw new Error("Not implemented");
}
```

Verify: `pnpm --filter @vexcms/core test`

#### packages/core/src/api/globals/get.server.ts

Two edits — `GetGlobalServerArgs` gains `drafts?: boolean`, and the row lookup at the top of `getGlobal` stops assuming `by_slug` matches at most one row.

**1 — new field on `GetGlobalServerArgs`, after `depth`:**

```ts
  /**
   * When the resolved global declares `versions.drafts: true`, prefer the
   * active draft row over the published row — the same knob Step 10 adds to
   * `find`/`get`/`search` for collections. Ignored for a non-versioned
   * global. Defaults to `false`: the public/default read path never sees
   * draft content, matching design-review §3.1 — this is data integrity,
   * not a permission decision, so the default without the flag is "no
   * drafts" regardless of the caller's grants.
   */
  drafts?: boolean;
```

Add `DRAFT_ACTIONS` to the existing `import { CRUD_ACTIONS, hasPermission, resolveFieldPermissions, stripDeniedFields } from "../../access";` line.

**2 — the row lookup, anchored immediately after `const { ctx, slug, populate, depth, config } = args;` and immediately before `if (!row) return null...`:**

```ts
  // TODO: implement
  // 1. `globalConfig = config.globals.find((g) => g.slug === slug)`.
  // 2. `!globalConfig?.versions.drafts` (non-versioned, or global not
  //    registered) → `row = await ctx.db.query("vex_globals").withIndex(
  //    "by_slug", (q) => q.eq("slug", slug as any)).first()` — UNCHANGED;
  //    a non-versioned global never has more than one row for its slug.
  // 3. `globalConfig.versions.drafts` → the slug can now match TWO rows
  //    (`upsertGlobal`, Step 15, writes a draft row under the same `slug`):
  //    a. `rows = await ctx.db.query("vex_globals").withIndex("by_slug", (q)
  //       => q.eq("slug", slug as any)).collect()` (at most 2 rows).
  //    b. `publishedRow = rows.find((r) => r.vex_status !== "draft")`,
  //       `draftRow = rows.find((r) => r.vex_status === "draft")`.
  //    c. `wantsDrafts`:
  //       - `config.access === undefined` (RBAC off) → `Boolean(args.drafts)`.
  //       - otherwise → `Boolean(args.drafts) && hasPermission({ access:
  //         config.access, user: args.auth?.user ?? null, organization:
  //         args.auth?.organization, resource: slug, action:
  //         DRAFT_ACTIONS.readDrafts, throwOnDenied: false })` — NON-throwing:
  //         a caller without `readDrafts` who asks for `drafts: true`
  //         silently falls back to the published row instead of erroring the
  //         whole call, so a read-only viewer can still open a versioned
  //         `GlobalEditView` read-only rather than hitting a thrown error.
  //    d. `row = wantsDrafts && draftRow ? draftRow : publishedRow` —
  //       `undefined` when the global has never been saved.
  // Edge cases:
  // - Neither row exists (never saved) → `row` is `undefined`, falls through
  //   to the existing `if (!row) return null` below, unchanged.
  // - A row written before `versions.drafts` was ever turned on has
  //   `vex_status: undefined` — `r.vex_status !== "draft"` is `true` for
  //   `undefined`, so it resolves as `publishedRow`, matching Step 2's
  //   "nothing writes the field on a non-versioned resource" convention.
  throw new Error("Not implemented");
```

Everything from `if (!row) return null as GetGlobalReturn<...>` through the end of the function (the existing `CRUD_ACTIONS.read` permission check, `stripDeniedFields`, depth/populate) is unchanged — it already operates on whatever `row`/`flat` resolves to.

Verify: `pnpm --filter @vexcms/core test`

#### packages/core/src/api/convex.ts

Two edits, both additive.

**1 — `VexGlobalsGetArgs` gains `drafts?`:**

```ts
export interface VexGlobalsGetArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  slug: string;
  populate?: Record<string, unknown>;
  drafts?: boolean;
}
```

**2 — `VexGlobalsUpdateArgs` gains `action?`:**

```ts
export interface VexGlobalsUpdateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  slug: string;
  data: Record<string, unknown>;
  action?: "saveDraft" | "publish" | "unpublish";
}
```

No other lines in this file change — `vexConvexApi.globals.get`/`.upsert`'s `FunctionReference` casts already reference these two interfaces, so both pick up the new fields automatically.

#### packages/core/src/api/server.ts

One edit — `globalsApi()`'s `get` and `upsert` registrations forward the two new client-facing arguments to their server functions. Anchor: the `globalsApi` function body.

**1 — `get`'s `args`/handler:**

```ts
    get: query({
      args: {
        slug: v.string(),
        populate: v.optional(v.any()),
        drafts: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await getGlobal({
          auth,
          ctx,
          slug: args.slug as GlobalSlug,
          populate: args.populate,
          drafts: args.drafts,
          config,
        });
      },
    }) as RegisteredQuery<Visibility, VexGlobalsGetArgs, VexDocumentGlobal | null>,
```

**2 — `upsert`'s `args`/handler:**

```ts
    upsert: mutation({
      args: {
        slug: v.string(),
        data: v.any(),
        action: v.optional(
          v.union(v.literal("saveDraft"), v.literal("publish"), v.literal("unpublish")),
        ),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await upsertGlobal({
          auth,
          ctx,
          config,
          slug: args.slug as GlobalSlug,
          data: args.data as Record<string, unknown>,
          action: args.action,
        });
      },
    }),
```

`GetGlobalServerArgs`/`UpsertGlobalServerArgs` are already imported by this file (`import type { GetGlobalReturn, GetGlobalServerArgs } from "./globals/get.server";` / `import type { UpsertGlobalServerArgs } from "./globals/upsert.server";`) — no new import needed for either type; `UpsertGlobalAction`'s three literals are inlined directly in the `v.union` rather than imported, matching how the rest of this factory declares Convex validators from scratch alongside their TS counterparts.

Verify: `pnpm --filter @vexcms/core test`

#### packages/react/src/components/views/GlobalEditView.tsx

Five edits: new imports, new computed permission/mutation values, a one-line `onSubmit` change, two new handler functions, and the header toolbar's JSX.

**1 — imports.** Add `DRAFT_ACTIONS` to the existing `@vexcms/core` import; add two new relative imports:

```ts
import {
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  GlobalEditViewProps,
  isFieldAllowed,
  vexConvexApi,
} from "@vexcms/core";
```

```ts
import { StatusBadge } from "./StatusBadge";
import { applyVexFieldErrors, getVexErrorMessage } from "../../lib/errors";
```

**2 — permission/mutation setup, anchored immediately after the existing `const { mutateAsync, isPending } = useVexMutation({...})` block and its `getChanges` callback:**

```ts
  const hasDrafts = global.versions.drafts;
  const isDraftDoc = (globalDoc as { vex_status?: "draft" | "published" } | undefined)?.vex_status === "draft";

  const canPublish = usePermission({
    resource: global.slug,
    action: DRAFT_ACTIONS.publish,
    data: globalDoc as {},
  });
  const canUnpublish = usePermission({
    resource: global.slug,
    action: DRAFT_ACTIONS.unpublish,
    data: globalDoc as {},
  });

  const { mutateAsync: publishAsync, isPending: isPublishing } = useVexMutation({
    collection: global.slug,
    getChanges: ({ args }) => [{ after: { ...(globalDoc ?? {}), ...args.data }, before: globalDoc }],
    mutationFn: vexConvexApi.globals.upsert,
    operation: "update",
  });
  const { mutateAsync: unpublishAsync, isPending: isUnpublishing } = useVexMutation({
    collection: global.slug,
    getChanges: () => (globalDoc ? [{ before: globalDoc }] : []),
    mutationFn: vexConvexApi.globals.upsert,
    operation: "update",
  });
```

TODO: implement
1. Below `const canEdit = usePermission({ resource: global.slug, action: CRUD_ACTIONS.update, data: globalDoc as {} });` and the `fieldPermissions` call beneath it, swap the hard-coded `action: CRUD_ACTIONS.update` on BOTH for `action: hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update` → `canEdit` and `fieldPermissions` become "can save a draft" for a versioned global instead of "can `update`", which is the whole point of the "role restricted via `changes` on one field gets the same restriction on saveDraft" acceptance criterion (Step 5) — a role granted `saveDraft` but not `update` must still see its editable fields as editable here, not locked read-only by a check against the wrong action. No new variable needed: every existing consumer of `canEdit`/`fieldPermissions` (the field `readOnly` prop, the Cancel button, the legacy Save button) is already correct once `canEdit` itself means the right thing.
2. Update the EXISTING `getChanges` on the reused `mutateAsync`/`isPending` pair: `getChanges: ({ args }) => (hasDrafts ? [] : [{ after: { ...(globalDoc ?? {}), ...args.data } }])` — a draft save never changes what the public reads, so it must never trigger a revalidation purge; only `publishAsync`/`unpublishAsync` above purge.

**3 — `onSubmit`, anchored at both `mutateAsync({ slug: global.slug, data: ... })` calls inside it:**

```ts
      if (!globalDoc) {
        await mutateAsync({
          slug: global.slug,
          data: value as Record<string, unknown>,
          action: hasDrafts ? DRAFT_ACTIONS.saveDraft : undefined,
        });
        form.reset();
        return;
      }
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({
        slug: global.slug,
        data: changes,
        action: hasDrafts ? DRAFT_ACTIONS.saveDraft : undefined,
      });
      form.reset();
```

**4 — two new handlers, anchored immediately after the `useLiveFieldMerge({...})` call and before `const canEdit = ...`:**

```ts
  /**
   * Promotes the active draft row to published. Any not-yet-saved form edits
   * ride along (`changedValues(form)`), so clicking Publish directly — without
   * a prior Save Draft — still captures them; the server merges them onto the
   * draft row before validating strictly (decision 2).
   *
   * @returns Resolves once the mutation settles.
   * @throws Never — a rejection is caught here to place the server's
   *   field-named validation error inline; the mutation's own `onError`
   *   still raises the generic "Request failed" toast alongside it.
   */
  async function handlePublish() {
    // TODO: implement
    // 1. `changes = changedValues(form)`.
    // 2. `try { await publishAsync({ slug: global.slug, data: changes, action:
    //    DRAFT_ACTIONS.publish }); form.reset(); } catch (error) {
    //    applyVexFieldErrors(form, error); }` — on success the `get` query
    //    refetches with `vex_status: "published"`: Publish/Save Draft
    //    disable, Unpublish enables. On a strict-validation rejection, the
    //    server-named field gets an inline error via `applyVexFieldErrors`
    //    (`packages/react/src/lib/errors.ts`) while `useVexMutation`'s own
    //    `onError` still toasts `getVexErrorMessage(error)`.
    throw new Error("Not implemented");
  }

  /**
   * Flips the published row back to a draft. Disabled client-side while an
   * outstanding draft exists (mirrors the server-side rejection this action
   * hits otherwise), so the handler itself has no rejection path to render.
   *
   * @returns Resolves once the mutation settles.
   * @throws Never beyond what `useVexMutation`'s own `onError` toast already
   *   surfaces.
   */
  async function handleUnpublish() {
    // TODO: implement
    // 1. `await unpublishAsync({ slug: global.slug, data: {}, action:
    //    DRAFT_ACTIONS.unpublish })`. On success, `globalDoc.vex_status`
    //    becomes `"draft"` once the `get` query refetches — Publish/Save
    //    Draft enable, Unpublish disables.
    throw new Error("Not implemented");
  }
```

**5 — the header toolbar JSX, replacing the existing header `<div>` block (from `<h1 className="text-2xl font-bold">` through the closing `</form.Subscribe>`):**

```tsx
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">
            Edit Global - <span className="text-primary">{global.label}</span>
          </h1>
          {hasDrafts && globalDoc && (
            <StatusBadge status={isDraftDoc ? "draft" : "published"} />
          )}
        </div>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex flex-wrap gap-2">
              {livePreview && (
                <Button type="button" variant="outline" onClick={previewPanel.toggle}>
                  {previewPanel.isOpen ? "Hide preview" : "Show preview"}
                </Button>
              )}
              {hasDrafts ? (
                <>
                  <Button
                    type="submit"
                    className="transition-all duration-300"
                    isPending={isPending}
                    disabled={isDefaultValue || !canEdit}
                  >
                    Save Draft
                  </Button>
                  {globalDoc && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="transition-all duration-300"
                        isPending={isPublishing}
                        disabled={!canPublish || !isDraftDoc}
                        onClick={handlePublish}
                      >
                        Publish
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="transition-all duration-300"
                        isPending={isUnpublishing}
                        disabled={!canUnpublish || isDraftDoc}
                        onClick={handleUnpublish}
                      >
                        Unpublish
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button
                  type="submit"
                  className="transition-all duration-300"
                  isPending={isPending}
                  disabled={isDefaultValue || !canEdit}
                >
                  Save
                </Button>
              )}
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
```

Edge cases:
- `hasDrafts && !globalDoc` (brand-new versioned global, never saved) — only "Save Draft" is meaningful; Publish/Unpublish are HIDDEN (not merely disabled), since nothing exists yet to publish or unpublish. The `{globalDoc && (...)}` guard above covers this.
- `canEdit` denied → the whole toolbar's write affordances collapse (every button's `disabled` already routes through `canEdit`/`canPublish`/`canUnpublish`), matching `CollectionEditView`.
- `globalDoc` transitions from `undefined` to a real row mid-session (another admin saves the first draft first) — `useGlobalForm`'s `document` prop already re-syncs defaults on that change; no extra handling needed here.

Verify: `pnpm --filter @vexcms/react test`

#### packages/core/src/api/globals/upsert.server.test.ts

New fixture and one new `describe` block, appended after the existing `upsertGlobal (server) — access` suite (its closing `});`).

```ts
const versionedGlobal = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: {
    message: text({ label: "Message", required: true }),
    tone: text({ label: "Tone", required: false }),
  },
  versions: { drafts: true },
});

const versionedFixtureConfig = {
  globals: [versionedGlobal],
  access: undefined,
} as unknown as VexConfig;

/**
 * Draft-lifecycle coverage for `upsertGlobal` on a versioned global. Every
 * `upsertGlobal` call below targets `slug: "banner"`; `vex_globals` rows for
 * it are read back directly via `ctx.db.query("vex_globals")` — mirroring
 * the raw-row assertions the suites above already use.
 */
describe("upsertGlobal (server) — versions.drafts", () => {
  it("creates a single draft-only row on the first save of a versioned global", async () => {
    // TODO: implement
    // 1. `upsertGlobal({ ctx, config: versionedFixtureConfig, slug: "banner",
    //    data: { message: "Hello" }, action: "saveDraft" })`.
    // 2. Read back `vex_globals` rows for `slug: "banner"` → expect exactly
    //    ONE row, `vex_status: "draft"`, `vex_publishedId` absent/undefined,
    //    `data.message === "Hello"`.
    // 3. `vex_versions` rows for `{ collection: "vex_globals", documentId:
    //    "banner" }` → expect exactly one, `status: "draft"`.
    throw new Error("Not implemented");
  });

  it("bootstraps a draft row and snapshots the published state on first edit after publish", async () => {
    // TODO: implement
    // 1. Seed a published row directly: `ctx.db.insert("vex_globals", { slug:
    //    "banner", data: { message: "Live" }, vex_status: "published",
    //    vex_publishedAt: <fixed timestamp> })`.
    // 2. `upsertGlobal({ ..., data: { message: "Live, edited" }, action:
    //    "saveDraft" })`.
    // 3. Expect TWO `vex_globals` rows for `slug: "banner"`: the original
    //    published row unchanged (`data.message === "Live"`), and a new
    //    draft row (`vex_status: "draft"`, `vex_publishedId` equal to the
    //    published row's `_id`, `data.message === "Live, edited"`).
    // 4. Expect a `vex_versions` row with `status: "published"`, `snapshot:
    //    { message: "Live" }` (the v1 snapshot taken before the draft
    //    existed), AND a second row with `status: "draft"`, `snapshot: {
    //    message: "Live, edited" }`.
    throw new Error("Not implemented");
  });

  it("reuses the existing draft row on repeated saveDraft calls — at most one draft row per slug", async () => {
    // TODO: implement
    // 1. Two consecutive `saveDraft` calls with different `data`.
    // 2. Expect exactly ONE row with `vex_status: "draft"` for `slug:
    //    "banner"` after both, carrying the SECOND call's data.
    throw new Error("Not implemented");
  });

  it("publish promotes a never-published draft in place, keeping its _id", async () => {
    // TODO: implement
    // 1. `saveDraft` to bootstrap a draft-only row (no prior publish);
    //    capture its `_id`.
    // 2. `upsertGlobal({ ..., data: { tone: "friendly" }, action: "publish"
    //    })`.
    // 3. Expect exactly ONE `vex_globals` row for `slug: "banner"`, SAME
    //    `_id` as step 1, `vex_status: "published"`, `vex_publishedAt`
    //    set, `data` containing both `message` and `tone`.
    throw new Error("Not implemented");
  });

  it("publish copies a draft's fields onto the published row and deletes the draft, preserving the published _id", async () => {
    // TODO: implement
    // 1. Seed a published row directly (capture its `_id`); `saveDraft` to
    //    create a draft row pointing at it.
    // 2. `upsertGlobal({ ..., action: "publish" })`.
    // 3. Expect exactly ONE `vex_globals` row remains for `slug: "banner"`,
    //    `_id` IDENTICAL to the seeded published row's `_id`, `data`
    //    reflecting the draft's fields, `vex_status: "published"`.
    // 4. Expect a `vex_versions` row with `status: "published"` whose
    //    `snapshot` is the SUPERSEDED (pre-publish) published content.
    throw new Error("Not implemented");
  });

  it("publish rejects a draft missing a required field and writes nothing", async () => {
    // TODO: implement
    // 1. `saveDraft` with `{ tone: "friendly" }` only (`message` is
    //    required, never supplied — lenient mode allows this).
    // 2. `upsertGlobal({ ..., data: {}, action: "publish" })` → expect
    //    rejection naming `message`.
    // 3. Read back rows — the draft row's `data` is UNCHANGED from step 1,
    //    still `vex_status: "draft"`.
    throw new Error("Not implemented");
  });

  it("unpublish rejects while an outstanding draft exists", async () => {
    // TODO: implement
    // 1. Seed a published row; `saveDraft` to create a draft pointing at it.
    // 2. `upsertGlobal({ ..., action: "unpublish" })` → expect rejection.
    // 3. Read back rows — BOTH rows unchanged (published row still
    //    `vex_status: "published"`, draft row still present).
    throw new Error("Not implemented");
  });

  it("unpublish flips the published row to draft and carries publishedAt forward", async () => {
    // TODO: implement
    // 1. Seed a published row with a fixed `vex_publishedAt`.
    // 2. `upsertGlobal({ ..., action: "unpublish" })`.
    // 3. Expect the SAME row (`_id` unchanged), `vex_status: "draft"`,
    //    `vex_publishedAt` STILL the original fixed value (not cleared, not
    //    rewritten).
    throw new Error("Not implemented");
  });

  it("a role restricted via `changes` on one field gets the same restriction on saveDraft", async () => {
    // TODO: implement
    // 1. Build a `VexConfig` with `access` granting `saveDraft: ({ changes })
    //    => !("tone" in (changes ?? {}))` (deny only when `tone` is present
    //    in the incoming payload) for `versionedGlobal`.
    // 2. `upsertGlobal({ ..., data: { tone: "loud" }, action: "saveDraft" })`
    //    with an authenticated user holding that role → expect rejection.
    // 3. Same call with `data: { message: "ok" }` (no `tone`) → succeeds.
    // This is the field-level acceptance criterion from Step 5, applied to
    // globals: it fails against the OLD (pre-this-spec) pattern of checking
    // `changes` against the STORED row instead of `args.data`.
    throw new Error("Not implemented");
  });

  it("a non-versioned global's upsert is unaffected by an `action` argument", async () => {
    // TODO: implement
    // 1. `upsertGlobal({ ctx, config: fixtureConfig, slug: "siteSettings",
    //    data: { siteName: "X" }, action: "publish" })` — `siteSettings` has
    //    no `versions.drafts`.
    // 2. Expect exactly ONE `vex_globals` row, no `vex_status` key at all —
    //    identical to calling without `action`. Regression guard: `action`
    //    must never leak into the legacy path.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

#### packages/core/src/api/globals/get.server.test.ts

New fixture and one new `describe` block, appended after the existing `getGlobal (server) — field-level read shaping` suite.

```ts
const versionedFixtureConfig = {
  globals: [
    defineGlobal({
      slug: "banner",
      label: "Banner",
      fields: { message: text({ label: "Message", required: true }) },
      versions: { drafts: true },
    }),
  ],
} as unknown as VexConfig;

describe("getGlobal (server) — versions.drafts", () => {
  it("returns the published row by default when a draft exists", async () => {
    // TODO: implement
    // 1. Seed a published row (`vex_status: "published"`, `data: { message:
    //    "Live" }`) and a draft row (`vex_status: "draft"`, `vex_publishedId`
    //    pointing at the published row's `_id`, `data: { message: "Draft" }`)
    //    directly for `slug: "banner"`.
    // 2. `getGlobal({ ctx, slug: "banner", config: versionedFixtureConfig })`
    //    — NO `drafts` arg.
    // 3. Expect `result?.message === "Live"`, `result?.vex_status ===
    //    "published"` — never the draft, matching design-review §3.1's data
    //    integrity requirement.
    throw new Error("Not implemented");
  });

  it("returns the draft row when drafts: true and the caller has readDrafts", async () => {
    // TODO: implement
    // 1. Same seed as above.
    // 2. Build a `VexConfig` with `access` granting `readDrafts: true` for
    //    an authenticated role; `getGlobal({ ..., drafts: true, auth: {
    //    user: <that role> } })`.
    // 3. Expect `result?.message === "Draft"`, `result?.vex_status ===
    //    "draft"`.
    throw new Error("Not implemented");
  });

  it("falls back to the published row when drafts: true but the caller lacks readDrafts", async () => {
    // TODO: implement
    // 1. Same seed; a `VexConfig` with `access` granting plain `read` but NOT
    //    `readDrafts`.
    // 2. `getGlobal({ ..., drafts: true, auth: { user: <that role> } })` →
    //    does NOT throw, returns the PUBLISHED row's content.
    throw new Error("Not implemented");
  });

  it("returns null when a versioned global has never been saved", async () => {
    // TODO: implement
    // 1. `getGlobal({ ctx, slug: "banner", config: versionedFixtureConfig })`
    //    with no rows seeded at all → expect `null` (regression: unaffected
    //    by the multi-row lookup).
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

#### packages/react/src/components/views/GlobalEditView.test.tsx

One new `describe` block, appended after the existing `GlobalEditView — diff submit` suite. Uses the same custom-`config` pattern the file's own `"still submits when a read-denied field is required"` test already establishes (a `versions: { drafts: true }` variant of `testClientConfig.globals[0]` passed via `config`).

```ts
const versionedGlobal = {
  ...testClientConfig.globals[0],
  versions: { drafts: true, autosave: false },
} as unknown as GlobalConfig;
const versionedConfig = { ...testClientConfig, globals: [versionedGlobal] } as never;

describe("GlobalEditView — draft toolbar", () => {
  it("shows Save Draft / Publish / Unpublish and a StatusBadge for a versioned global with a saved row", async () => {
    // TODO: implement
    // 1. `stored = { _creationTime: 1, _id: "g1", siteName: "x", tagline: "y",
    //    vex_status: "published" }`.
    // 2. `renderView(<GlobalEditView global={versionedGlobal.slug}
    //    initialData={stored} />, { convex: t, config: versionedConfig })`.
    // 3. Expect "Save Draft", "Publish", "Unpublish" buttons present (query
    //    by text) and NO plain "Save" button; expect the StatusBadge's
    //    "Published" text present.
    throw new Error("Not implemented");
  });

  it("hides Publish and Unpublish for a brand-new versioned global with no saved row yet", async () => {
    // TODO: implement
    // 1. `renderView(<GlobalEditView global={versionedGlobal.slug} />, {
    //    convex: t, config: versionedConfig })` — no `initialData`.
    // 2. Expect "Save Draft" present; "Publish" and "Unpublish" ABSENT
    //    (queryByText returns null for both), not merely disabled.
    throw new Error("Not implemented");
  });

  it("disables Unpublish and enables Publish while the loaded document is a draft", async () => {
    // TODO: implement
    // 1. `stored` with `vex_status: "draft"`.
    // 2. Render as above.
    // 3. Expect the "Unpublish" button `disabled`; the "Publish" button NOT
    //    `disabled`.
    throw new Error("Not implemented");
  });

  it('calls globals.upsert with action: "publish" when Publish is clicked', async () => {
    // TODO: implement
    // 1. `stored` with `vex_status: "draft"`.
    // 2. Render, `fireEvent.click` the "Publish" button.
    // 3. `await waitFor(() => expect(convexMutationMock).toHaveBeenCalled())`
    //    → expect the call's args to include `action: "publish"`.
    throw new Error("Not implemented");
  });

  it("keeps the plain Save/Cancel toolbar for a non-versioned global", async () => {
    // TODO: implement
    // 1. Render with the DEFAULT `testClientConfig` (no `versions.drafts`)
    //    and `stored` from the existing "diff submit" tests.
    // 2. Expect "Save" present; "Save Draft"/"Publish"/"Unpublish" ABSENT;
    //    submitting the form calls `convexMutationMock` with NO `action` key
    //    at all (regression — `action` must not leak onto a non-versioned
    //    global's payload).
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/react test`

**Verify:** `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

### Step 16 — CLI dead-code removal + real backfill action `[dev]`

Why: The `hasVersioning` auto-trigger wired into `vex dev`'s post-deploy hook and into
`generateAndWrite` calls `client.mutation("vex/versions:backfillVersionStatus" as any, ...)`
— a Convex function reference that has never existed anywhere in this codebase
(`design-review.md` §8.2). It has been inert only because `CollectionConfig` had no
`versions` field for `hasVersioning` to read; Step 1 adding that field would make it start
firing for real, against nothing, on every `vex dev` schema push for any project with a
versioned collection. Delete the dead path outright rather than hardening or resurrecting
it, and replace the real underlying need — stamping `vex_status` on rows that predate a
`versions.drafts` toggle — with a genuine, explicitly-invoked action that a developer wires
into their own project and runs once, not something the CLI fires automatically.

- [ ] `packages/cli/src/commands/dev.ts` — delete the `hasVersioning` branch and the
      `backfillVersionStatus` import.
- [ ] `packages/cli/src/lib/generateSchema.ts` — delete the dead `hasVersioning` branch and
      drop `backfillVersionStatus` from its `migrate.js` import.
- [ ] `packages/cli/src/lib/migrate.ts` — delete `BackfillVersionStatusOptions` and
      `backfillVersionStatus`.
- [ ] `packages/core/src/api/versions/backfillStatus.server.ts` — a genuine,
      separately-invoked (not CLI-auto-fired) one-shot action that stamps `vex_status:
      "published"` on rows in a collection that are missing the field.
- [ ] `packages/core/src/api/server.ts` — re-export `backfillStatus` and its arg/result
      types. Required for the function above to be reachable at all: `@vexcms/core`'s
      `package.json#exports` only exposes `.`, `./server`, `./client`, `./convex`,
      `./internal` — there is no deep-import subpath, so a new `api/versions/*.server.ts`
      file that isn't re-exported from `api/server.ts` can never be imported by a
      consuming project. Not added to `versionsApi` (Step 9) and not a `DRAFT_ACTIONS`
      member (Step 3) — this is a standalone ops helper a developer calls directly, not a
      gated draft action.
- [ ] `packages/core/src/api/versions/backfillStatus.server.test.ts` — patches only rows
      missing the field; a second call patches nothing; rejects for a collection without
      `versions.drafts` enabled.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/cli test`

#### packages/cli/src/commands/dev.ts

Two edits.

**1 — imports.** Remove the `backfillVersionStatus` import and the `resolveConvexUrl`
import — both become dead once the branch in edit 2 is gone; unlike `generateSchema.ts`,
`resolveConvexUrl` in this file is referenced nowhere else:

```ts
import { backfillVersionStatus } from "../lib/migrate.js";
```
```ts
import { resolveConvexUrl } from "../lib/resolveConvexUrl.js";
```

**2 — `devCommand`'s post-deploy callback.** Immediately before the `waitForDeploy(cwd)`
call that follows `startConvexDev(cwd)`, remove:

```ts
  const hasVersioning = config.collections.some((c) => c.versions?.drafts);
```

Inside that `.then(async (deployed) => { ... })` callback, after the `if (!deployed) { ...
return; }` early return, remove:

```ts
      if (hasVersioning) {
        const convexUrl = resolveConvexUrl(cwd);
        if (convexUrl) {
          await backfillVersionStatus({ convexUrl, config });
        }
      }
```

The callback ends with the early return; nothing replaces the removed block.

#### packages/cli/src/lib/generateSchema.ts

Two edits.

**1 — `migrate.js` import.** `resolveConvexUrl` (imported separately, one line below) stays
— it is still used earlier in `generateAndWrite`'s auto-migration flow. Only
`backfillVersionStatus` drops out of this import:

```ts
import { executeMigration, executeFieldRemoval, backfillVersionStatus } from "./migrate.js";
```
becomes
```ts
import { executeMigration, executeFieldRemoval } from "./migrate.js";
```

**2 — end of `generateAndWrite`.** Immediately after the `syncSchemaImports(...)` call and
before `return { written: true };`, remove:

```ts
  // Backfill vex_status on versioned collections after schema is deployed.
  // The mutation only patches documents missing vex_status, so this is safe
  // to run on every schema push — most runs patch 0 documents.
  const hasVersioning = config.collections.some((c) => c.versions?.drafts);
  if (hasVersioning) {
    const convexUrl = resolveConvexUrl(cwd);
    if (convexUrl) {
      // Wait for the schema to be deployed before calling the mutation
      const pushFn = options?.pushSchema ?? ((c: string) => waitForDeploy(c));
      const deployed = await pushFn(cwd);
      if (deployed) {
        await backfillVersionStatus({ convexUrl, config });
      }
    }
  }
```

`syncSchemaImports(...)` is immediately followed by `return { written: true };`.

#### packages/cli/src/lib/migrate.ts

One edit. `MUTATION_TIMEOUT_MS`, `withTimeout`, `getClient`, `MigrateOptions`,
`RemovalOptions`, `executeMigration`, and `executeFieldRemoval` are all unchanged and stay
— `executeMigration`/`executeFieldRemoval` still call `withTimeout`/`getClient`.

**1 — delete the backfill machinery.** Remove the `BackfillVersionStatusOptions` interface:

```ts
/** Options for backfilling `vex_status` on documents in versioned collections. */
export interface BackfillVersionStatusOptions {
  /** Convex deployment URL. */
  convexUrl: string;
  /** VEX config to inspect for versioned collections. */
  config: VexConfig;
}
```

and the `backfillVersionStatus` function in its entirety:

```ts
/**
 * Backfill `vex_status` on existing documents in versioned collections.
 *
 * For each collection with `versions.drafts` enabled, calls
 * `vex/versions:backfillVersionStatus` which sets `vex_status: "published"`
 * on documents that don't have the field yet.
 *
 * Safe to run on every schema push — the mutation only patches documents
 * missing `vex_status`, so most runs will patch 0 documents.
 * @param options - Convex deployment URL and the VEX config used to find versioned collections.
 */
export async function backfillVersionStatus(
  options: BackfillVersionStatusOptions,
): Promise<void> {
  const { convexUrl, config } = options;
  const versionedSlugs = config.collections
    .filter((c) => c.versions?.drafts)
    .map((c) => c.slug);

  if (versionedSlugs.length === 0) return;

  let client: any;
  try {
    client = await getClient(convexUrl);
  } catch {
    logger.warn(
      "Could not import convex/browser — install `convex` to enable version backfill",
    );
    return;
  }

  try {
    for (const slug of versionedSlugs) {
      let cursor: string | undefined;
      let totalPatched = 0;

      try {
        while (true) {
          const result: { patched: number; isDone: boolean; cursor: string } =
            await withTimeout(
              client.mutation("vex/versions:backfillVersionStatus" as any, {
                collectionSlug: slug,
                cursor,
              }),
              MUTATION_TIMEOUT_MS,
            );

          totalPatched += result.patched;
          cursor = result.cursor;

          if (result.isDone) break;
        }

        if (totalPatched > 0) {
          logger.success(
            `Backfilled vex_status on ${totalPatched} documents in "${slug}"`,
          );
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("Could not find")
        ) {
          logger.warn(
            `Backfill function not found. Deploy convex/vex/versions.ts to your Convex project first.`,
          );
          return;
        }
        logger.warn(`Failed to backfill "${slug}": ${err}`);
      }
    }
  } finally {
    client.close?.();
  }
}
```

Nothing replaces either block — `MigrateOptions`/`RemovalOptions`/the timeout constant/the
two live helpers follow immediately after where each was.

#### packages/core/src/api/versions/backfillStatus.server.ts

```ts
import type { GenericDataModel, GenericMutationCtx, PaginationOptions } from "convex/server";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { VexConfig } from "../../config";

/**
 * Server-side args for `backfillStatus`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug being backfilled.
 */
export interface BackfillStatusServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> {
  /** Convex mutation context — this function writes, so a query context is rejected at the type level. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`, used to confirm `collection` has `versions.drafts` enabled. */
  config: VexConfig;
  /** The collection slug to backfill. Must be registered with `versions.drafts: true`. */
  collection: TCollectionSlug;
  /**
   * Convex's native pagination options — deliberately NOT the core-wrapped
   * `PaginationOptions` from `../types` (which adds `totalDocs`; irrelevant
   * to a one-shot migration). Pass `{ numItems, cursor: null }` on the first
   * call, then feed the previous response's `continueCursor` back in until
   * `isDone` is `true`.
   */
  paginationOpts: PaginationOptions;
}

/** One page's result from a `backfillStatus` call. */
export interface BackfillStatusResult {
  /** Documents patched in this page — rows that were missing `vex_status`. */
  patched: number;
  /** `true` once every document matching the missing-`vex_status` condition has been visited. */
  isDone: boolean;
  /** Cursor to pass as `paginationOpts.cursor` on the next call. */
  continueCursor: string;
}

/**
 * Stamps `vex_status: "published"` on documents in `collection` that predate
 * a `versions.drafts` toggle and therefore have no `vex_status` value at all.
 *
 * This is a one-shot, developer-invoked migration action. Nothing in the
 * `vex` CLI or the `versionsApi` factory (Step 9) calls it automatically, and
 * it is not a `DRAFT_ACTIONS` member (Step 3) — it carries no `hasPermission`
 * check, so it must be wired into a Convex `internalMutation` (server-only,
 * never client-callable) in your own project, run once via `npx convex run`
 * or the dashboard until it reports `isDone: true`, and then deleted:
 *
 * @example
 * ```ts
 * // convex/backfillPagesStatus.ts — delete this file once the backfill is done.
 * import { internalMutation } from "./_generated/server";
 * import { paginationOptsValidator } from "convex/server";
 * import { backfillStatus } from "@vexcms/core/server";
 * import { config } from "../vex.config";
 *
 * export const run = internalMutation({
 *   args: { paginationOpts: paginationOptsValidator },
 *   handler: (ctx, args) =>
 *     backfillStatus({ ctx, config, collection: "pages", paginationOpts: args.paginationOpts }),
 * });
 * ```
 * ```sh
 * npx convex run backfillPagesStatus:run '{"paginationOpts":{"numItems":200,"cursor":null}}'
 * # repeat, feeding the previous call's continueCursor, until isDone: true
 * ```
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, config, collection, paginationOpts }`.
 * @returns One page's `{ patched, isDone, continueCursor }`.
 * @throws {ConvexError} When `collection` is not registered, or is registered
 * without `versions.drafts: true` (there is no `vex_status` column to backfill).
 */
export async function backfillStatus<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(
  args: BackfillStatusServerArgs<DataModel, TCollectionSlug>,
): Promise<BackfillStatusResult> {
  // 1. `collection = args.config.collections.find((c) => c.slug === args.collection)`
  //    → not found → throw ConvexError(`No collection registered with slug
  //    "${args.collection}"`), mirroring `update/server.ts`'s lookup.
  // 2. `collection.versions.drafts !== true` → throw ConvexError naming the
  //    collection (`"${args.collection}" does not have versions.drafts
  //    enabled — there is no vex_status field to backfill`). Guards against
  //    querying `by_status` on a table that was never given that index.
  // 3. Query `args.ctx.db.query(args.collection).withIndex("by_status", (q) =>
  //    q.eq("vex_status", undefined))` → Convex's index ordering treats a
  //    missing optional field as `undefined`, so this matches exactly the
  //    rows that have never had `vex_status` written — not
  //    already-`"draft"`, not already-`"published"` — without a table scan.
  // 4. `.paginate(args.paginationOpts)` → one bounded page, respecting
  //    Convex's per-mutation execution limits regardless of collection size.
  // 5. For each document in `page.page`: `args.ctx.db.patch(doc._id, {
  //    vex_status: "published" })`.
  //    → Sets ONLY `vex_status`. Deliberately leaves `vex_publishedAt` and
  //    `vex_publishedId` unset (these rows were already live before
  //    versioning existed — there is no real publish timestamp to record and
  //    no draft counterpart), and does NOT call `createVersion` (this is a
  //    data stamp correcting a schema gap, not a publish event with
  //    something to audit into `vex_versions`).
  // 6. Return `{ patched: page.page.length, isDone: page.isDone,
  //    continueCursor: page.continueCursor }`.
  // Edge cases:
  // - Called again after `isDone: true`: the `by_status` index has nothing
  //   left matching `vex_status === undefined`, so it returns `{ patched: 0,
  //   isDone: true, continueCursor: <unchanged> }` — safe to run repeatedly.
  // - A row created AFTER the toggle already carries `vex_status: "draft"`
  //   from `saveDraft`'s bootstrap path (design-review §2) and is excluded
  //   by the same index condition — this only ever touches pre-toggle rows.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/server.ts

One edit. Add alongside the existing `upsertGlobal` re-export block (the `getGlobal` /
`findGlobals` / `upsertGlobal` exports); every other export in the file is unchanged:

```ts
export { backfillStatus } from "./versions/backfillStatus.server";
export type {
  BackfillStatusServerArgs,
  BackfillStatusResult,
} from "./versions/backfillStatus.server";
```

#### packages/core/src/api/versions/backfillStatus.server.test.ts

Reuses the shared `packages/core/src/api/test/convex/schema.ts` fixture — its `posts`
table already carries `vex_status`/`by_status` (added by Step 4 alongside
`vex_publishedAt`/`vex_publishedId`/`by_published` and the `vex_versions` table); no
separate schema fixture edit is needed for this file.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../config";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { backfillStatus } from "./backfillStatus.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

/** `posts` with `versions.drafts: true` — matches the shared fixture's `vex_status`/`by_status` columns. */
const versionedConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: { title: { type: "text" } },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
      versions: { drafts: true, autosave: false },
    },
  ],
} as unknown as VexConfig;

/** Same `posts` slug, but without `versions.drafts` — for the rejection case. */
const nonVersionedConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: { title: { type: "text" } },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
      versions: { drafts: false, autosave: false },
    },
  ],
} as unknown as VexConfig;

describe("backfillStatus (server)", () => {
  /**
   * Three `posts` rows: one already `"published"`, one already `"draft"`,
   * and one inserted with no `vex_status` key at all (the pre-toggle shape
   * this action exists to fix). A single page (`numItems: 10`) must patch
   * ONLY the row missing the field, to exactly `"published"`, and must
   * report `{ patched: 1, isDone: true }`.
   */
  test("patches only the row missing vex_status", async () => {
    const t = convexTest(schema, modules);
    // TODO:
    // 1. `t.run` → insert three `posts` rows via `ctx.db.insert("posts", {...})`:
    //    a. `{ title: "Has published", vex_status: "published" }`
    //    b. `{ title: "Has draft", vex_status: "draft" }`
    //    c. `{ title: "Never touched" }` (no `vex_status` key at all)
    //    → capture all three returned `Id<"posts">`s.
    // 2. Call `backfillStatus({ ctx, config: versionedConfig, collection:
    //    "posts", paginationOpts: { numItems: 10, cursor: null } })`.
    // 3. Assert the result equals `{ patched: 1, isDone: true, continueCursor:
    //    expect.any(String) }`.
    // 4. Re-read all three rows via `ctx.db.get` → assert (a) is still
    //    exactly `"published"`, (b) is still exactly `"draft"`, (c) is now
    //    exactly `"published"`.
    throw new Error("Not implemented");
  });

  /**
   * Running the action again after every row already has `vex_status` finds
   * nothing left to patch — proves the action is safe to invoke repeatedly.
   */
  test("a second call patches nothing once every row has vex_status", async () => {
    const t = convexTest(schema, modules);
    // TODO:
    // 1. Insert one `posts` row missing `vex_status`.
    // 2. Call `backfillStatus` once (`paginationOpts: { numItems: 10, cursor:
    //    null }`) → row is patched, result is `{ patched: 1, isDone: true }`.
    // 3. Call `backfillStatus` again with `{ numItems: 10, cursor: null }` →
    //    assert the result equals `{ patched: 0, isDone: true, continueCursor:
    //    expect.any(String) }`.
    throw new Error("Not implemented");
  });

  /**
   * `posts` here is registered WITHOUT `versions.drafts` — there is no
   * `vex_status` column to backfill, so the call must reject rather than
   * querying a nonexistent index.
   */
  test("throws when the collection does not have versions.drafts enabled", async () => {
    const t = convexTest(schema, modules);
    // TODO:
    // 1. `t.run` → call `backfillStatus({ ctx, config: nonVersionedConfig,
    //    collection: "posts", paginationOpts: { numItems: 10, cursor: null } })`.
    // 2. Assert it rejects (`await expect(...).rejects.toThrow()`), and that
    //    the thrown error's message names both "posts" and "versions.drafts".
    throw new Error("Not implemented");
  });

  /** No collection named `"missing"` exists in `versionedConfig` at all. */
  test("throws for an unregistered collection slug", async () => {
    const t = convexTest(schema, modules);
    // TODO:
    // 1. `t.run` → call `backfillStatus({ ctx, config: versionedConfig,
    //    collection: "missing" as never, paginationOpts: { numItems: 10,
    //    cursor: null } })`.
    // 2. Assert it rejects, naming `"missing"` in the message.
    throw new Error("Not implemented");
  });
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/cli test`

### Step 17 — `apps/www` wiring + docs `[dev]`

Why: Proves the whole feature against a real deployment and closes the live-preview
base-layer obligation E left for this spec.

- [ ] `apps/www/src/vexcms/collections/pages.ts` — `versions: { drafts: true, autosave: true }`.
- [ ] `apps/www/convex/vex.ts` — register `versionsApi`.
- [ ] `apps/www/src/auth/access.ts` — draft actions per role.
- [ ] `apps/www/convex/pages.ts` — `getBySlug` (public, `access.bypass: true`) is unchanged and
      stays published-only via Step 10's default. Add a second, session-authenticated query
      the live-preview base layer calls instead when the `vex-live-preview` marker cookie is
      present, under a real `readDrafts` permission check.
- [ ] `apps/www/src/app/(frontend)/(site)/PageContent.tsx` / `SiteLivePreviewProvider.tsx` —
      wire the preview-mode branch to the new query. `useVexPreview`/`useLivePreviewQuery`
      themselves are unchanged.
- [ ] `packages/core/README.md:155-161, 209-211` — rewrite from "not shipped" to describe the
      real draft/publish workflow and the migration path off a hand-rolled `status` field.
- [ ] `apps/docs/src/content/docs/guides/versioning-and-drafts.mdx`

#### apps/www/src/vexcms/collections/pages.ts

1 edit — new top-level `versions` key on the `defineCollection` call, inserted between the
existing `admin` block and `fields` (anchor: immediately after `admin`'s closing `},`,
before `fields: {`). Declarative config, not a stub — there is no branching logic to
pseudocode.

```ts
  versions: {
    drafts: true,
    autosave: true,
  },
```

#### apps/www/convex/vex.ts

3 edits. Pure factory composition against already-shipped code (Step 9's `versionsApi`) —
declarative wiring, not a stub.

**1 — import `versionsApi`**, beside the existing `@vexcms/core/server` import:

```ts
import { collectionsApi, createVexMutations, versionsApi } from "@vexcms/core/server";
```

**2 — extract the shared `getAuth`**, anchored between the `vexMutation`/`vexInternalMutation`
export and the `collectionsApi` call. `versionsApi`'s mutations need the same caller
resolution `collectionsApi` already uses — one `createGetAuth({...})` call reused by both,
rather than a second copy (`vex/globals.ts` copies it per-file only because it's a *different*
file; here both calls live in the same module):

```ts
const getAuth = createGetAuth({
  userCollectionSlug: TABLE_SLUG_USERS,
  sessionCollectionSlug: TABLE_SLUG_SESSIONS,
  resolveOrgs: false,
});

export const { find, get, search, create, update, remove } = collectionsApi({
  config,
  query,
  mutation: vexMutation,
  getAuth,
});
```

**3 — register `versionsApi`**, anchored after the `collectionsApi` export. Bare operation
names, no `adminXxx` prefix (naming-conventions "Convex functions" rule); `mutation:
vexMutation`, never the raw builder, matching this file's own docstring on `vexMutation`:

```ts
// `pages` declares `versions.drafts` — registers the draft/publish workflow
// (`versionsApi`, mirroring `collectionsApi`/`globalsApi`'s factory pattern).
export const { saveDraft, publish, unpublish, listVersions, getVersionSnapshot, deleteVersion } =
  versionsApi({
    config,
    query,
    mutation: vexMutation,
    getAuth,
  });
```

#### apps/www/src/auth/access.ts

1 edit — a doc comment, anchored directly above `export const access = defineAccess({`.
**No permission entries change.** Once `pages.versions.drafts` is `true` (Step 1),
`DRAFT_ACTIONS` (`readDrafts`/`saveDraft`/`publish`/`unpublish`/`deleteVersions`) join
`pages`' permission surface automatically — `HasDrafts`/`DraftAction` compose by shape,
already shipped. Both roles here already resolve every one of them correctly under
P-007's default-deny posture, with nothing new to declare: `[USER_ROLES.admin]`'s blanket
`"*": true` covers them the same way it covers `create`/`update`/`delete` today, and
`[USER_ROLES.user]`'s `pages: readOnly` (`"*": false, read: true`) denies every action it
doesn't name — drafts included — the same way it already denies writes. `anonRole:
USER_ROLES.user` means this is also what an unauthenticated visitor gets. Adding explicit
`readDrafts: false` etc. to `readOnly` would restate what `"*": false` already means and
contradicts this file's own established minimal-declaration style. Writing this as a
fabricated third "editor" role — which the original 2026-08-23 draft's Step 17 sketch did —
would be wrong here specifically: `apps/www` has exactly two roles, and granting drafts to
`user` would leak unpublished content to every anonymous visitor, since `user` **is** the
anonymous role.

```ts
/**
 * `pages.versions.drafts: true` (versioning-drafts spec) adds five actions to `pages`'
 * permission surface — `readDrafts`, `saveDraft`, `publish`, `unpublish`,
 * `deleteVersions` (`DRAFT_ACTIONS`, `@vexcms/core`) — beside the CRUD set every
 * resource already carries. Neither role below needed a new entry to gate them:
 * - `[USER_ROLES.admin]`'s blanket `"*": true` already covers every action on every
 *   resource, drafts included.
 * - `[USER_ROLES.user]`'s `pages: readOnly` (`"*": false, read: true`) already denies
 *   every action it does not name, drafts included — the same default-deny posture
 *   that already denies `create`/`update`/`delete` here (P-007). `anonRole` resolves
 *   to `user`, so this is also what an unauthenticated visitor gets.
 * `convex/pages.ts`'s `getBySlugPreview` is the only caller that requests `readDrafts`
 * explicitly (`access: { action: DRAFT_ACTIONS.readDrafts }`); every other draft
 * action is exercised only from the admin panel, which always runs as `admin`.
 */
```

Verify: `pnpm --filter www typecheck`

#### apps/www/convex/pages.ts

2 edits. `getBySlug` above is untouched.

**1 — import `DRAFT_ACTIONS`**, beside the existing `convex/values` import:

```ts
import { DRAFT_ACTIONS } from "@vexcms/core"
import { v } from "convex/values"
```

**2 — new `getBySlugPreview` query**, inserted immediately after `getBySlug`'s closing `})`,
before `publishedSlugs`. Real per-row disambiguation logic — guided stub.

```ts
/**
 * Returns the page document matching `slug`, preferring its draft row when one
 * exists — the live-preview base layer's authenticated counterpart to `getBySlug`
 * above. Called ONLY when `PageContent.tsx`'s `useSitePreviewMode` detects an active
 * live-preview session (`?vexLivePreview=1` plus the session-verified
 * `vex-live-preview` cookie `proxy.ts` sets); a normal page load never reaches this.
 *
 * Passes `drafts: true` so Step 10's published-only filter does not apply, and
 * `access: { action: DRAFT_ACTIONS.readDrafts }` so a row only reaches the caller
 * when their RESOLVED session (never a client-supplied claim — `find` resolves `ctx`
 * through the bound `vexServerApi`'s `getAuth`) is granted `readDrafts` on `pages`.
 * `access.ts` grants this to `admin` only; every other caller — including the
 * anonymous role every unauthenticated request resolves to — is denied and gets an
 * empty array, never draft content. This query never bypasses access (contrast
 * `getBySlug`'s `access: { bypass: true }` above) — that is the whole point of it
 * existing as a second query rather than a flag on the first.
 *
 * @param args.slug - The page slug to preview.
 * @returns The draft row for `slug` if one exists, else the published row, else an
 *   empty array — the same shape `getBySlug` returns. Never throws: a denied or
 *   nonexistent-slug request both resolve to `[]`, indistinguishably.
 */
export const getBySlugPreview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    // TODO: implement
    // 1. `matches = await find({ ctx, collection: TABLE_SLUG_PAGES, withIndex: {
    //    name: "by_slug", range: (q) => q.eq("slug", slug) }, drafts: true, access:
    //    { action: DRAFT_ACTIONS.readDrafts } })`
    //    → no `limit`: once `versions.drafts` is on, the published row and its own
    //      draft twin can both carry this slug (a draft's `slug` is a copy of the
    //      published value until an editor changes it — `saveDraft`'s bootstrap
    //      clones every published field), so both matches must be inspected before
    //      choosing one. The two-row invariant Steps 5-7 enforce (at most one draft
    //      row per document) bounds this at 2 rows regardless.
    //    → a caller whose resolved role lacks `readDrafts` gets `[]` here (`find`'s
    //      own per-row `hasPermission` filter denies every row) — never a thrown
    //      error, so an unauthenticated or under-privileged preview request
    //      degrades to "no page found" rather than revealing which rows exist.
    // 2. `draft = matches.find((doc) => doc.vex_status === "draft")`
    //    → present when the document has unpublished changes; this is the row the
    //      preview exists to show (mirrors `CollectionListView.tsx`'s pair-
    //      collapsing preference, Step 11). Covers the never-published case too — a
    //      brand-new draft with no `vex_publishedId` is still the sole match with
    //      `vex_status === "draft"`.
    // 3. Return `draft ? [draft] : matches.filter((doc) => doc.vex_status === "published")`
    //    → `getBySlug`'s array shape, consumed by `useLivePreviewQuery`'s `data?.[0]`
    //      narrowing.
    // Edge cases:
    // - No draft AND no published row (bad slug, or a fully-deleted document) → `[]`.
    // - A role granted `readDrafts` but not `read` — nothing in `access.ts` does this
    //   today, but if one existed it would still see draft rows and no published
    //   ones, since step 1's `find` call authorizes on `readDrafts` for every row,
    //   published or draft alike, not a mix of two actions.
    throw new Error("Not implemented")
  },
})
```

Verify: `pnpm --filter www typecheck && pnpm --filter www build`

#### apps/www/src/app/(frontend)/(site)/PageContent.tsx

3 edits.

**1 — import `useSitePreviewMode`**, its own import group beside the existing `~/vexcms/blocks`
group (a local relative import, defined in the sibling file below):

```ts
import { useSitePreviewMode } from "./SiteLivePreviewProvider"
```

**2 — update `PageContentProps.initialData`'s doc comment**, since it is always sourced from
`getBySlug` regardless of which query ultimately renders (the branch below only takes effect
post-mount):

```ts
  /**
   * Server-fetched `pages.getBySlug` result, hydrated as the query's initial data.
   * Always the published copy — `useSitePreviewMode` cannot resolve until after mount
   * (see its docstring), so the server-rendered pass is never the preview branch.
   */
  initialData?: PagesDocument[]
```

**3 — branch the base query on preview mode**, replacing the component's doc comment and its
`useLivePreviewQuery` call:

```tsx
/**
 * Renders one marketing page's blocks via `RenderBlocks` (Contract 1), or falls back
 * to base's bootstrap `WelcomePage` when no `home` page document exists yet — a fresh
 * scaffold before `pnpm seed` has run (Contract 3).
 *
 * Calls `pages.getBySlug` (published-only, `access.bypass`) outside live preview and
 * `pages.getBySlugPreview` (session-authenticated, gated on the `readDrafts` action)
 * once `useSitePreviewMode` confirms an active preview session — this spec's
 * live-preview base-layer swap. Both always return an array (empty when no match —
 * the same shape every collection query returns); `useLivePreviewQuery` performs the
 * `[0]` narrowing itself and overlays any unsaved editor values for this document on
 * top of whichever base layer ran.
 */
export function PageContent({ codeHighlights, slug, initialData }: PageContentProps) {
  const normalizedSlug = slug && slug.length > 0 ? slug : "home"
  const previewModeActive = useSitePreviewMode()

  const { data: page } = useLivePreviewQuery(
    {
      ...convexQuery(previewModeActive ? api.pages.getBySlugPreview : api.pages.getBySlug, {
        slug: normalizedSlug,
      }),
      initialData,
    },
    "pages",
  )
```

#### apps/www/src/app/(frontend)/(site)/SiteLivePreviewProvider.tsx

2 edits. `SiteLivePreviewProvider`'s own body and JSX are unchanged.

**1 — imports**, beside the existing `react`/`@vexcms/react` imports:

```ts
import { useEffect, useState } from "react"

import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core"
```

**2 — new `useSitePreviewMode` export**, appended at file end, after `SiteLivePreviewProvider`'s
closing brace. Real logic (mirrors `@vexcms/react`'s internal, unexported
`useLivePreviewEnabled`) — guided stub.

```ts
/**
 * Whether this page load is inside an active live-preview session — both
 * `?vexLivePreview=1` and the session-verified `vex-live-preview` marker cookie
 * `proxy.ts` sets (`grantPreviewIfRequested`) are present.
 *
 * `PageContent.tsx` reads this to pick its base query: `pages.getBySlug`
 * (published-only) outside preview, `pages.getBySlugPreview` (session-authenticated,
 * `readDrafts`-gated) inside it. Mirrors `@vexcms/react`'s internal, unexported
 * `useLivePreviewEnabled` rather than importing it — this boolean is needed to choose
 * a query BEFORE `useLivePreviewQuery`/`LivePreviewProvider` ever run, so it cannot be
 * sourced from inside that package without widening its public surface for this one
 * caller. Duplicated, not shared, deliberately: five lines of browser-only detection
 * versus a new `@vexcms/react` export used by nobody else.
 *
 * Both signals are read inside a `useEffect`, never during render, so the host page
 * stays statically prerenderable — no `next/headers` call, and no server/client
 * divergence on the first render pass.
 *
 * @returns `true` once both signals are confirmed present in the browser; `false`
 *   before mount and on every page load outside live preview. Never throws.
 */
export function useSitePreviewMode(): boolean {
  // TODO: implement
  // 1. `useState(false)` → `[previewMode, setPreviewMode]`.
  // 2. `useEffect(() => { ... }, [])`, mirroring `LivePreviewContext.tsx`'s
  //    `useLivePreviewEnabled`:
  //    a. `new URLSearchParams(window.location.search).get(LIVE_PREVIEW_QUERY_PARAM)
  //       === "1"` → `previewRequested`.
  //    b. `document.cookie.split("; ").some((c) => c === \`${LIVE_PREVIEW_COOKIE}=1\`)`
  //       → `sessionVerified`.
  //    c. `setPreviewMode(previewRequested && sessionVerified)`.
  // 3. Return `previewMode`.
  // Edge cases:
  // - Neither signal alone is sufficient — a visitor who pastes a preview URL without
  //   ever having had an authenticated session must not see drafts, and an admin
  //   browsing normally (no `?vexLivePreview=1`) must not either.
  // - This boolean is advisory only: `PageContent.tsx` uses it purely to pick which
  //   query runs. The real authorization boundary is `getBySlugPreview`'s server-side
  //   `readDrafts` check — a stale, forged, or otherwise-wrong cookie value still just
  //   selects the preview query, then gets an empty result, never draft content.
  throw new Error("Not implemented")
}
```

Verify: `pnpm --filter www typecheck && pnpm --filter www build`

#### packages/core/README.md

2 edits.

**1 — replace the `### Versioning & Drafts` section** (currently reads "Not shipped. ..."):

````md
### Versioning & Drafts

`versions.drafts: true` on a collection or global turns on a draft/publish workflow: a
**published** row keeps its `_id` for the life of the document, and at most one **draft**
row (`vex_publishedId` pointing back at it) tracks unpublished edits. Publishing merges the
draft's fields into the published row and deletes the draft — the published row's `_id`
never changes, so relationships, permalinks, and the admin edit URL survive every publish.
Unpublishing flips the published row back to `draft` and is rejected while an outstanding
draft row exists. Every draft save and publish snapshots into `vex_versions`, an immutable,
unbounded history table read only when the version-history menu opens.

```typescript
import { defineCollection } from "@vexcms/core"
import { collectionsApi, versionsApi } from "@vexcms/core/server"

export const posts = defineCollection({
  slug: "posts",
  fields: { /* ... */ },
  versions: {
    drafts: true,
    autosave: true, // debounced saveDraft on settled form changes only
  },
})

// convex/vex.ts
export const { find, get, search, create, update, remove } = collectionsApi({ config, query, mutation, getAuth })
export const { saveDraft, publish, unpublish, listVersions, getVersionSnapshot, deleteVersion } =
  versionsApi({ config, query, mutation, getAuth })
```

`saveDraft` validates leniently — a draft may be incomplete. `publish` re-validates the full
merged document with the same strength as `create` (no partial mode) and rejects, naming the
missing field, before promoting; nothing is written on rejection. Five actions —
`readDrafts`, `saveDraft`, `publish`, `unpublish`, `deleteVersions` — join the usual CRUD set
on a versioned resource's permission matrix. Public reads (`find`, `get`, `search`) exclude
draft rows by default for a versioned collection — even under `access.bypass`, since the
status filter is data integrity, not a permission rule — unless the caller passes
`drafts: true` **and** holds `readDrafts`.

**Migrating off a hand-rolled `status` field.** Turn on `versions.drafts`, run the one-shot
`backfillStatus` action (`@vexcms/core/server`) once to stamp `vex_status: "published"` on
every row that predates the toggle, then delete the old field and repoint whatever query
filtered on it at the built-in `drafts` argument instead — the built-in status is now the
source of truth, and the hand-rolled field is exactly the redundant copy this doc used to
warn against creating.

See the [Versioning & Drafts guide](https://docs.vexcms.dev/guides/versioning-and-drafts/)
for the full RBAC table, autosave, version history/restore, and the live-preview interaction.
````

**2 — correct the `### Convex Integration Utilities` aside**, replacing the sentence "Draft-
specific actions (...) are typed and recognized by the access-control layer, but versioning
and drafts themselves are not shipped — see `### Versioning & Drafts` above. There is no
preview-snapshot management utility.":

```md
`versionsApi` (see `### Versioning & Drafts` above) mirrors `globalsApi`'s factory pattern
and registers only the draft operations a project's config actually declares — a config
with no `versions.drafts` anywhere registers nothing. Version history has no automatic
pruning: `deleteVersion` removes one row at a time, by design, since these rows are read
only when the history menu opens.
```

Verify: `grep -rn "not shipped\|Not shipped" packages/core/README.md` returns nothing for the
versioning section.

#### apps/docs/src/content/docs/guides/versioning-and-drafts.mdx

New file. Outline only — mirrors `guides/live-preview.mdx`'s structure (frontmatter, short
lead paragraph, `##` sections each opening with a runnable snippet), but the developer writes
the actual prose; this is the shape and content inventory, not final copy.

```md
Frontmatter: title "Versioning & Drafts"; description covering the draft/publish workflow,
the two-row model, and the live-preview interaction in one sentence (mirror
`live-preview.mdx`'s description style).

Lead paragraph: one-line model statement — published row keeps a stable `_id`, at most one
draft row points back at it, `vex_versions` holds immutable history.

`## Enabling drafts`
- `versions.drafts`/`versions.autosave` on `defineCollection`/`defineGlobal` — code sample
  matching README's.
- `drafts` defaults `false`; nothing changes for an unopted-in collection.
- `autosave` debounces by `DEFAULT_AUTOSAVE_DEBOUNCE_MS`, fires only on settled, actually-
  changed values (no `isAutosave` flag, no coalescing — Step 14).
- One-line pointer to `versionsApi` registration (`convex/vex.ts`), cross-linked to the
  Local API / Convex integration guide rather than repeated here.

`## Draft, publish, unpublish, and their RBAC gating`
- Table: `readDrafts` / `saveDraft` / `publish` / `unpublish` / `deleteVersions` → what each
  grants (mirror design-review.md's action table).
- `saveDraft` is lenient-partial; `publish` re-validates at full `create` strength and
  rejects naming the missing field, writing nothing on failure.
- Identity: publish never changes the published row's `_id`; relationships and permalinks
  survive.
- `unpublish` rejects with an outstanding draft — publish or discard it first.
- Access example: an illustrative 3-role (`admin`/`editor`/`viewer`) `access.ts` snippet
  granting `editor` only `readDrafts`/`saveDraft`, publish/unpublish admin-only — explicitly
  flagged as illustrative, plus a callout that a project with no such role (like `apps/www`,
  admin/anon only) needs zero extra config because of the default-deny posture.

`## Autosave`
- `useAutosave({ values, onSave, enabled?, debounceMs? })` contract and return shape
  (`status`/`lastSavedAt`/`error`).
- Fires only on settled change since the last save — not a fixed interval.

`## Version history and restore`
- `<VersionHistoryDropdown collection={} documentId={} />` — version, status, `publishedAt`,
  creator, timestamp; hidden without `readDrafts`, delete hidden without `deleteVersions`.
- Restore is client-side: read the snapshot (`getVersionSnapshot`), hydrate the form,
  `saveDraft({ restoredFrom })` — no server-side restore mutation.
- No automatic pruning; `deleteVersion` removes one row at a time (unbounded history is a
  deliberate decision, not a gap).

`## Live preview and drafts`
- The interaction this spec adds to E: the preview's base layer can now read the draft
  instead of the published document.
- Concrete pattern (point at `apps/www`'s `getBySlugPreview` + `useSitePreviewMode` as the
  reference implementation): a SECOND, session-authenticated query beside the public
  `getBySlug`, called only once the live-preview marker cookie is detected client-side,
  passing `drafts: true` **and** a real `access: { action: DRAFT_ACTIONS.readDrafts }`
  check — never `access.bypass`.
- Security callout, restating ADR-012's mitigation: the marker cookie only proves a request
  carried *a* verified session, not that the session is privileged — `readDrafts` is the
  actual authorization boundary, and an unauthenticated or under-privileged request degrades
  to "no page found," never a thrown error that would leak which rows exist.
- Cross-link to `guides/live-preview.mdx` for the transport/overlay mechanics, which this
  spec does not change.

`## Migrating off a hand-rolled status field`
- Same content as the README aside: toggle `versions.drafts`, run `backfillStatus` once,
  delete the old field and repoint queries at the built-in `drafts` argument.
```

Verify: `pnpm --filter docs build`

### Step 18 — Verification `[dev]`

- [ ] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [ ] Manual: create a page, publish it, note its `_id`; edit and save a draft (public
      route still serves the published copy, including through the `bypass: true`
      query); attempt to publish a draft with a required field cleared and confirm
      rejection naming the field; fill it in and publish again, confirming **the `_id`
      is unchanged** and inbound relationships still resolve; unpublish with an
      outstanding draft and confirm the rejection; restore an older version; confirm the
      admin list shows one row for a document with an active draft, not two; open the
      `pages` live-preview panel while an unpublished draft exists and confirm the
      preview reflects the draft while the public route still serves the published copy.
- Verify: `pnpm build && pnpm test`
