---
status: draft
spec_id: 2026-09-20-versioning-drafts
touches:
  - packages/core/src/versions/**
  - packages/core/src/api/versions/**
  - packages/core/src/api/prepareEdit.ts
  - packages/core/src/api/prepareEdit.test.ts
  - packages/core/src/api/update/server.ts
  - packages/core/src/collections/constants.ts
  - packages/core/src/collections/types.ts
  - packages/core/src/collections/config.ts
  - packages/core/src/collections/config.test.ts
  - packages/core/src/globals/types.ts
  - packages/core/src/globals/config.ts
  - packages/core/src/globals/config.test.ts
  - packages/core/src/globals/utils.ts
  - packages/core/src/globals/hooks.ts
  - packages/core/src/globals/index.ts
  - packages/core/src/fields/utils.ts
  - packages/core/src/fields/index.ts
  - packages/core/src/collections/utils.ts
  - packages/core/src/collections/index.ts
  - packages/core/src/collections/validateFields.ts
  - packages/core/src/collections/hooks.ts
  - packages/core/src/api/prepareEdit.ts
  - packages/core/src/api/prepareEdit.test.ts
  - packages/core/src/api/triggers.ts
  - packages/core/src/api/triggers.test.ts
  - packages/core/src/api/create/server.ts
  - packages/core/src/api/create/server.test.ts
  - packages/core/src/api/update/server.test.ts
  - packages/react/src/hooks/useFieldsForm.ts
  - packages/core/src/revalidate/types.ts
  - packages/next/src/cache/createVexRevalidateRoute.ts
  - packages/next/src/cache/createVexRevalidateRoute.test.ts
  - .agent/docs/decisions/ADR-014.md
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
  - packages/core/src/api/populate.ts
  - packages/core/src/api/populate.test.ts
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
  - packages/core/src/fields/types.ts
  - packages/react/src/components/views/**
  - packages/react/src/components/drafts/**
  - packages/react/src/components/index.ts
  - packages/react/src/hooks/useRelationshipPickerOptions.ts
  - packages/react/src/components/fields/relationship/Input.tsx
  - packages/react/src/hooks/useAutosave.ts
  - packages/react/src/hooks/index.ts
  - packages/react/src/lib/errors.ts
  - packages/react/src/testing/convex/schema.ts
  - packages/react/src/testing/viewSuite.ts
  - apps/test/src/db/constants/index.ts
  - apps/test/src/vexcms/collections/posts.ts
  - apps/test/src/vexcms/collections/index.ts
  - apps/test/src/vexcms/globals/announcement.ts
  - apps/test/src/vexcms/globals/index.ts
  - apps/test/src/vex.config.ts
  - apps/test/src/auth/access.ts
  - apps/test/convex/vex/versions.ts
  - apps/www/src/vexcms/collections/pages.ts
  - apps/www/convex/vex/versions.ts
  - apps/www/convex/pages.ts
  - apps/www/src/auth/access.ts
  - "apps/www/src/app/(frontend)/(site)/PageContent.tsx"
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
true` and published-only by Step 13's default. The live-preview provider's already-
    shipped `vex-live-preview` marker-cookie branch (ADR-012) calls a new query instead,
    gated by a real `readDrafts` permission check, so an unauthenticated request can
    never reach draft content through either path.
11. **`vex_versions` is an append-only, DAG-shaped log — every lifecycle event is a node
    with a parent edge — but no branching field, type, or UI ships here.** A later
    enterprise branching feature (named content branches, merges, a commit-graph view)
    is anticipated, and the ONLY thing it needs from this spec is data that cannot be
    reconstructed after the fact, since history rows are immutable and never backfilled.
    Two consequences, both zero-new-field:
    - **Every publish and unpublish emits exactly one history row, attributed.** The
      first publish of a document (the promote-in-place branch of Step 9) previously
      emitted none; that hole is unrecoverable, so it now emits one like every other
      publish. `createdBy` is recorded on publish/unpublish for the same reason it
      already was on `saveDraft` — an unattributed immutable row can never be repaired.
    - **`parentVersion` is the graph edge, not a display nicety.** It always records the
      actual predecessor node (`getLatestVersion`'s result at write time), and is absent
      only on a document's genuine root version.
      Everything a branching feature additionally needs is **deliberately not added now**,
      because each is cleanly additive later with no backfill: a `branch?: string` (absent
      ⇒ trunk, so today's rows are already valid trunk history); multi-parent merge edges
      (`parentVersion` stays the first parent; a future `mergeParents?: number[]` reads
      today's rows as single-parent); and any graph UI (Step 18 renders the linear list the
      current model actually produces). `version` is already a document-scoped monotonic
      integer, which is exactly the stable node identity a DAG needs — it does not become
      ambiguous when branches are added. Whole-document snapshots (decision 3) mean any
      future diff or graph view can be computed retroactively from existing rows.
      Consumers must already tolerate a `parentVersion` pointing at a row `deleteVersion`
      removed — treat the chain as broken there and render that node as a root rather than
      assuming the parent resolves.
12. **Option A: one unified `versions.*` implementation per operation, shared by
    collections and globals; CRUD endpoints stay plain CRUD.** `saveDraft`, `publish`,
    `unpublish`, `listVersions`, `getVersionSnapshot`, and `deleteVersion` each have ONE
    implementation in `packages/core/src/versions/` that accepts either a collection
    target (`{ collection, id }`) or a global target (`{ global }`), resolved through a
    single `resolveVersionedTarget` helper into a `VersionedTargetRows` descriptor (which
    table, which rows, how to read/write them) — every per-kind difference lives in that
    descriptor, never in a `target.kind` branch inside the shared pipeline itself.
    `create`/`update`/`globals.upsert` never grow a draft-specific branch or an `action`
    argument; they stay exactly what their names say. Four reasons settle this over the
    alternative (routing a global's draft/publish/unpublish through `upsertGlobal`'s own
    `action` argument, which an earlier revision of this spec took): **(a)** one
    permission action per endpoint — `update`/`upsert` always check `update`/`create`,
    `versions.saveDraft` always checks `saveDraft`, never a runtime-branched action on one
    endpoint; **(b)** revalidation operations map 1:1 onto endpoints —
    `VexMutationOperation` gains `"publish"`/`"unpublish"` members matching the two new
    endpoints exactly, instead of overloading `"upsert"` with a hidden mode; **(c)**
    flipping a resource's `versions.drafts` on or off never changes what an existing
    `update`/`upsert` caller does — both always write the published row directly,
    draft-aware or not — so turning drafts on is additive, never a breaking change to
    every existing write call site; **(d)** version history and RBAC work correctly for
    globals: `listVersions`/`getVersionSnapshot`/`deleteVersion` authorize against the
    target's OWN slug (a global's own slug, not the literal string `"vex_globals"`),
    which a collection-shaped-only history design could not express. `versionsApi`
    (`packages/core/src/api/server.ts`) registers the entire `versions.*` surface, or
    nothing, based on whether ANY collection or global across the whole config declares
    `versions.drafts: true` — registration is resource-kind-blind, matching
    `resolveVersionedTarget`'s own design.
13. **`versions.defaultStatus` ships in this spec, scoped to collections only.** The
    original plan (§ Out of Scope, above) deferred it alongside a dev-start auto-backfill
    probe; Option A's unified `create()` path makes the probe machinery unnecessary to
    defer it from — `create()` already branches on `collection.versions.drafts` to stamp
    history, so reading one more config field (`defaultStatus`, default `"draft"`) off
    the same branch costs nothing extra. A `"draft"` default produces a draft-only row
    (`vex_status: "draft"`, no `vex_publishedId`/`vex_publishedAt` — nothing to point at
    yet) that Steps 13/15/16's read paths must treat as a complete one-row document, not
    a draft missing its other half. Globals have no `defaultStatus`: `globals.upsert`'s
    first-ever write for a slug always produces a published row, unchanged from before
    this spec — a global's first save is conventionally "site settings exist now," not a
    draft nobody asked for.

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
- **Dev-start auto-backfill probe for `versions.defaultStatus`**
  (`design-review.md` §6.4) — deferred; decision 13 ships `defaultStatus` itself in this
  spec, but the probe machinery that would auto-detect and backfill pre-existing
  unstatused rows at `vex dev` startup is still deferred — the one-shot user-invoked
  `backfillStatus` action (Step 20) covers the real need without it.
- **Any change to live-preview's transport, matching, or overlay mechanism** — E already
  shipped this; Step 21 only points the base-layer query at draft-aware data.
- **Globals gaining a per-slug Convex table** — globals stay the single shared
  `vex_globals` table; Steps 7–12 fit the two-row model inside it, it does not restructure
  globals storage.

## Implementation

**Execution order.** Steps 1–5 are foundation (config, schema, access action, model helpers, `saveDraft`). Step 6 is a prerequisite refactor: globals gain `beforeChange`/`afterChange` hooks and `prepareEdit` accepts either resource kind. From Step 7 on, each server step is immediately followed by the admin-panel UI that consumes it, so every operation is exercised end to end in `apps/test` before the next one is built:

| Server half                                                                     | UI half                                                |
| ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 7 — Save Draft wiring (`versionsApi`, globals draft save, `apps/test` fixtures) | 8 — `StatusBadge` + shared `DraftToolbar` (Save Draft) |
| 9 — Publish                                                                     | 10 — Publish button + inline validation errors         |
| 11 — Unpublish                                                                  | 12 — Unpublish button                                  |
| 13 — Status filter                                                              | 14 — Draft-aware edit-view reads + relationship picker |
| 15 — Unique check + delete cascade                                              | 16 — List-view pair-collapsing                         |
| 17 — History reads + `deleteVersion`                                            | 18 — `VersionHistoryDropdown`                          |

Then 19 — Autosave, 20 — CLI backfill, 21 — `apps/www` production wiring + docs, 22 — Verification. `versionsApi` and `apps/test/convex/vex/versions.ts` grow one operation per server step; `DraftToolbar` grows one affordance per UI step. Development testing uses `apps/test` (arbitrary fixtures covering every code path); `apps/www` is the deployed site and only gets production wiring in Step 21.

### Step 1 — `versions` config on collections + globals `[agent]`

Why: Everything downstream branches on `collection.versions?.drafts`, which does not exist on `CollectionConfig` today, and on `GlobalConfig.versions` carrying `autosave`, which it doesn't either.

**Design correction verified against the live tree (not assumed from spec-tasks.md's "What changed" note):** `HasDrafts<T>` (`access/types.ts:634-639`) discriminates with `D extends true`, which requires `T`'s `versions.drafts` to be a _literal_ `true` at the type level, not the general `boolean`. Confirmed with `tsc` against the actual current source: `GlobalConfig.versions` is `{ drafts: boolean }` — unparameterized — so `defineGlobal`'s explicit return-type annotation always widens a call site's `versions: { drafts: true }` to plain `boolean`, and `boolean extends true` is `false`. Draft actions do not unlock for any global today, and mirroring that same bare shape onto `CollectionConfig` would repeat the bug and make Step 3's `deleteVersions` gating test unwritable as passing code. This is exactly the defect the superseded 2026-08-23-versioning-drafts/spec.md diagnosed in its Design Decision 19 and fixed with a `const TDrafts extends boolean` generic threaded through `defineCollection` — that fix never actually shipped (only the access-side `HasDrafts`/`DRAFT_ACTIONS` primitives did). This step applies it, adapted to the current tree (which has more `CollectionConfigInput`/`CollectionConfig` fields than the 2026-08-23 snapshot — `indexes`, `timestamps`, `hooks`) and to this spec's field shape (no `maxPerDoc`, decision 3). **Runtime shape and defaults are exactly what the rest of this spec assumes** — `versions: { drafts: boolean; autosave: boolean }`, defaulting `false`/`false` — this only changes the _static type_ so `HasDrafts` can discriminate a specific resource; every ordinary runtime read of `.versions.drafts` is unaffected.

- [x] `packages/core/src/versions/constants.ts` (new) — `VERSION_SYSTEM_FIELDS`, `VERSION_STATUSES` (`"draft" | "published"`, reused by `StatusBadge` and `InputComponentProps.documentStatus` in Steps 8 and 14), `DEFAULT_AUTOSAVE_DEBOUNCE_MS`.
- [x] `packages/core/src/versions/index.ts` (new) — barrel, so `versions/model.ts` (Step 4) and every `api/versions/*` consumer (Steps 5–17) import via `"../../versions"` like every other domain folder (`collections`, `access`, `livePreview`), not deep relative paths.
- [x] `packages/core/src/index.ts` — re-export the new barrel.
- [x] `packages/core/src/collections/constants.ts` — extend `RESERVED_COLLECTION_FIELDS`.
- [x] `packages/core/src/collections/types.ts` — 6th generic `TDrafts` + `versions` (`drafts`/`defaultStatus`/`autosave`/`cascadeDelete`) on `CollectionConfigInput`/`CollectionConfig`. `defaultStatus?: VexVersionStatus` (collections only — decision 13) is the `vex_status` a newly `create()`d document starts with; resolved `CollectionConfig.versions.defaultStatus` is always present (never optional) after defaults are applied.
- [x] `packages/core/src/collections/config.ts` — thread `TDrafts`, extend the runtime reserved-key guard, apply `versions` defaults (`drafts: false`, `defaultStatus: VERSION_STATUSES.draft.key`, `autosave: { enabled: false, debounceMs: DEFAULT_AUTOSAVE_DEBOUNCE_MS }`, `cascadeDelete: true`) — `defaultStatus` defaults BEFORE `...input.versions` is spread so an explicit `versions: { defaultStatus: "published" }` overrides it, then `autosave` is spread back on top since it's itself a nested object the single spread wouldn't deep-merge.
- [x] `packages/core/src/globals/types.ts` — 6th generic `TDrafts` (resolved `GlobalConfig` defaults it WIDE, `= boolean`) + widen `versions` to carry `autosave`. No `defaultStatus` on globals (decision 13) — `globals.upsert`'s first write for a slug always produces a published row.
- [x] `packages/core/src/globals/config.ts` — thread `TDrafts`, apply the `autosave` defaults (`{ enabled: false, debounceMs: DEFAULT_AUTOSAVE_DEBOUNCE_MS }`).
- [x] `packages/core/src/collections/config.test.ts`, `packages/core/src/globals/config.test.ts` — defaults resolve (including `defaultStatus: "draft"`); an explicit `defaultStatus: "published"` override resolves unchanged; reserved-field compile+runtime rejection covers the three new system-field keys the same way it covers `updatedAt`.

#### packages/core/src/versions/constants.ts

```ts
/**
 * System field keys written onto the main table row of a versioned
 * collection (and `vex_globals`, when any registered global declares
 * `versions.drafts: true`). Present only when `versions.drafts: true` — a
 * non-versioned collection's table never has these.
 *
 * The single source of truth for these three slugs. Consumers read `.slug`:
 * `extractUserFields`' strip set, `versionFieldsToVexSchema`'s emitted
 * columns and indexes, `findDraftRow`'s index lookup, and `defineCollection`'s
 * reserved-name guard (which unions {@link VersionSystemField} with
 * `ReservedCollectionFieldKey` at its own call site rather than duplicating
 * these entries into `COLLECTION_SYSTEM_FIELDS`, whose type also keys
 * `CollectionConfig.fields` — and these are columns, never `fields` entries).
 */
export const VERSION_SYSTEM_FIELDS = {
  status: {
    slug: "vex_status",
  },
  publishedAt: {
    slug: "vex_publishedAt",
  },
  publishedId: {
    slug: "vex_publishedId",
  },
} as const;
/**
 * Version system field slug, derived from {@link VERSION_SYSTEM_FIELDS}.
 * Resolves to `"vex_status" | "vex_publishedAt" | "vex_publishedId"`.
 */
export type VersionSystemField =
  (typeof VERSION_SYSTEM_FIELDS)[keyof typeof VERSION_SYSTEM_FIELDS]["slug"];

/**
 * Version Statuses enum
 */
export const VERSION_STATUSES = {
  draft: {
    key: "draft",
    labels: {
      singular: "Draft",
      plural: "Drafts",
    },
  },
  published: {
    key: "published",
    labels: {
      singular: "Published",
      plural: "Published",
    },
  },
} as const;
/**
 * Publish-state values a versioned document (or global) can carry —
 * `vex_status`'s two literal values. Shared by `StatusBadge`
 * (`@vexcms/react`), `InputComponentProps.documentStatus` (`fields/types.ts`,
 * Step 14), and anywhere else a caller needs to name this union — defined
 * once here rather than redeclared per-package, since `@vexcms/react`
 * depends on `@vexcms/core` and never the reverse. Also the resolved type of
 * `CollectionConfig.versions.defaultStatus` (decision 13).
 */
export type VexVersionStatus = (typeof VERSION_STATUSES)[keyof typeof VERSION_STATUSES]["key"];

/**
 * Default debounce window, in milliseconds, before `useAutosave` (Step 19)
 * writes a changed draft row. Applied whenever a collection or global
 * declares `versions.autosave.enabled: true`.
 *
 * No companion max-versions-per-document default — decision 3 of this spec
 * ships unbounded version history; there is no automatic pruning to default.
 */
export const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1000 as const;
```

#### packages/core/src/versions/index.ts

```ts
export * from "./constants";
```

#### packages/core/src/index.ts

Existing file, 1 edit.

**1 — re-export the new `versions` barrel.** Add a new banner block after the existing `GLOBALS` block (before `FIELD TYPES`), mirroring every other domain folder's export:

```ts
// ============================================================================
// VERSIONS
// ============================================================================

export * from "./versions";
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
     * The `vex_status` a newly `create()`d document starts with. `"published"`
     * also stamps `vex_publishedAt`; `"draft"` inserts a draft-only row (no
     * `vex_publishedId`, no `vex_publishedAt`). Ignored when `drafts` is
     * `false`. @defaultValue `"draft"`
     */
    defaultStatus?: VexVersionStatus;
    /**
     * Debounce background saves to the draft row while the edit form is
     * open. Ignored when `drafts` is `false`.
     */
    autosave?: {
      /** Enable or disable autosaves to new drafts. @defaultValue `false` */
      enabled: boolean;
      /**
       * Debounce (milliseconds) to autosave after inputs have changed.
       * @defaultValue {@link DEFAULT_AUTOSAVE_DEBOUNCE_MS}
       */
      debounceMs?: number;
    };
    /**
     * When a document is deleted (`remove`), also delete its draft row (if
     * any) and every `vex_versions` history row for it in the same action
     * (`cascadeVersionedDelete`, Step 15). Set `false` to leave the draft
     * row and history behind — orphaned rows are inert (no query reads a
     * draft/history row without its own explicit `drafts: true` /
     * `listVersions` call, so nothing surfaces them by accident), but they
     * do occupy storage indefinitely and a future `saveDraft`/`publish` on
     * a REUSED id could resurface stale history. Ignored when `drafts` is
     * `false` — there is nothing to cascade. @defaultValue `true`
     */
    cascadeDelete?: boolean;
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
versions: {
  drafts: TDrafts;
  defaultStatus: VexVersionStatus;
  autosave: {
    enabled: boolean;
    debounceMs: number;
  }
  cascadeDelete: boolean;
}
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

````ts
/**
 * Resolves a raw collection config input into a fully-populated `CollectionConfig`.
 *
 * Fills in any missing `labels` by deriving them from the `slug` — singularizing
 * then title-casing it for `singular`, and title-casing the slug itself for
 * `plural` (slugs are plural by convention). Applies `versions` defaults
 * (`drafts: false`, `autosave: { enabled: false, debounceMs: 1000 }`,
 * `cascadeDelete: true`) —
 * `versions.drafts` keeps a literal
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
 *   versions: { drafts: true, autosave: { enabled: true } },
 * });
 * // → { slug: "posts", admin: { useAsTitle: "_id" }, labels: { singular: "Post", plural: "Posts" }, versions: { drafts: true, autosave: { enabled: true, debounceMs: 1000 }, cascadeDelete: true }, fields: { ... } }
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
    ? CollectionConfigInput<
        TFieldMeta,
        TCollectionMeta,
        TCollectionSlug,
        TFieldSlug,
        TComponent,
        TDrafts
      >
    : [TFieldSlug & ReservedCollectionFieldKey] extends [never]
      ? CollectionConfigInput<
          TFieldMeta,
          TCollectionMeta,
          TCollectionSlug,
          TFieldSlug,
          TComponent,
          TDrafts
        >
      : {
          fields: {
            [
              K in TFieldSlug & ReservedCollectionFieldKey
            ]: "Field name is reserved — defineCollection injects it automatically";
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
    const declared = input.fields[key as TFieldSlug] as
      AdminField<TFieldMeta> | undefined;
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
    input.timestamps === false ||
    "updatedAt" in input.fields ||
    meta.protected === true;
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
      // Passed through untouched, NOT defaulted (unchanged by this spec —
      // re-excerpted from HEAD after `649cafa`): this factory runs before
      // `defineConfig` has seen `livePreview.collections[slug]`, so a default
      // applied here would be indistinguishable from an explicit value and would
      // outrank the root entry. `resolveLivePreviewSettings` owns every default.
      livePreview: input.admin?.livePreview as AdminCollectionConfig<
        string,
        ComponentHKT,
        TCollectionSlug
      >["livePreview"],
    },
    labels: {
      singular: toTitleCase(pluralize.singular(input.slug)),
      plural: toTitleCase(input.slug),
      ...input.labels,
    },
    meta: {
      ...input.meta,
    } as TCollectionMeta,
    // `drafts: false as TDrafts` rather than a trailing cast on the whole
    // object: the spread below computes a plain `boolean` for `drafts` (the
    // widest type satisfying both the default and the optional spread), which
    // is not directly assignable back to the caller-specific `TDrafts` literal
    // `defineAccess`'s `HasDrafts` needs — it is correct at runtime because
    // `TDrafts` was inferred from this exact `input.versions?.drafts` value.
    // `defaultStatus` defaults to `VERSION_STATUSES.draft.key` BEFORE the
    // `...input.versions` spread, so an explicit `versions: { defaultStatus:
    // "published" }` overrides it like every other key here. `autosave` is
    // re-spread AFTER `...input.versions` so a caller supplying only
    // `{ enabled: true }` still gets the default `debounceMs`; spreading it
    // before would let the caller's partial object replace both keys.
    versions: {
      drafts: false as TDrafts,
      cascadeDelete: true,
      defaultStatus: VERSION_STATUSES.draft.key,
      ...input.versions,
      autosave: {
        enabled: false,
        debounceMs: DEFAULT_AUTOSAVE_DEBOUNCE_MS,
        ...input.versions?.autosave,
      },
    },
  };
}
````

#### packages/core/src/globals/types.ts

Existing file, 2 edits.

**1 — `GlobalConfigInput` gains a 6th generic and its `versions` field widens.** Add `TDrafts extends boolean = false` to the generic list (after `TComponent`), and replace the now-stale "parsed but ignored in v35" comment and field. `versions` goes on `GlobalConfigInput` — the same level as `fields`/`hooks` — **not** on `GlobalAdminConfigInput`: nothing reads `admin.versions`, so a copy there is dead config surface a user can write into and silently have ignored.

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
     * open. Ignored when `drafts` is `false`.
     */
    autosave?: {
      /** Enable or disable autosaves to new drafts. @defaultValue `false` */
      enabled: boolean;
      /**
       * Debounce (milliseconds) to autosave after inputs have changed.
       * @defaultValue {@link DEFAULT_AUTOSAVE_DEBOUNCE_MS}
       */
      debounceMs?: number;
    };
  };
```

**2 — `GlobalConfig` gains the same 6th generic, defaulted WIDE, and its resolved `versions` field widens.** `= boolean`, never `= false` — this is the same rule `CollectionConfig` follows above and it is load-bearing, not stylistic: every bare `GlobalConfig` reference in the monorepo (`VexConfig.globals`, a test fixture's annotation, `getGlobalInputSchema`'s parameter) instantiates the default, so defaulting to `false` makes a `defineGlobal({ versions: { drafts: true } })` result — typed `GlobalConfig<…, true>` — fail to assign with `TS2322: I was expecting a type matching GlobalConfig<…, false>`. Only the INPUT types (`GlobalConfigInput`, and `defineGlobal`'s own `const TDrafts`) default to `false`, so that an omitted `versions.drafts` still infers the literal `false` a `HasDrafts` check needs.

```ts
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = boolean,
> {
```

```ts
/**
 * Resolved versioning config. Always present after defaults. No
 * `cascadeDelete` counterpart to the collection shape: a global is never
 * `remove()`d, so there is no delete to cascade.
 */
versions: {
  drafts: TDrafts;
  autosave: {
    enabled: boolean;
    debounceMs: number;
  }
}
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
    ? GlobalConfigInput<
        TFieldMeta,
        TGlobalMeta,
        TGlobalSlug,
        TFieldSlug,
        TComponent,
        TDrafts
      >
    : [TFieldSlug & ReservedGlobalFieldKey] extends [never]
      ? GlobalConfigInput<
          TFieldMeta,
          TGlobalMeta,
          TGlobalSlug,
          TFieldSlug,
          TComponent,
          TDrafts
        >
      : {
          fields: {
            [
              K in TFieldSlug & ReservedGlobalFieldKey
            ]: "Field name is reserved — cannot use _id, _creationTime, or _slug";
          };
        },
): GlobalConfig<
  TFieldMeta,
  TGlobalMeta,
  TGlobalSlug,
  TFieldSlug,
  TComponent,
  TDrafts
> {
  const reservedKeys: ReservedGlobalFieldKey[] = [
    "_id",
    "_creationTime",
    "_slug",
  ];
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
    interfaceName:
      input.interfaceName ?? slugToPascalCase({ slug: input.slug }) + "Global",
    admin: {
      group: "",
      description: "",
      components: {},
      ...input.admin,
      // See `collections/config.ts`: no defaults here, they would outrank the
      // root `livePreview.globals[slug]` entry. Unchanged by this spec —
      // re-excerpted from HEAD after `649cafa`.
      livePreview: input.admin?.livePreview as GlobalAdminConfig<
        TComponent,
        TGlobalSlug
      >["livePreview"],
    },
    meta: (input.meta ?? {}) as TGlobalMeta,
    // Same `false as TDrafts` justification as `defineCollection`, and the same
    // reason `autosave` is re-spread AFTER `...input.versions`: a caller
    // supplying only `{ enabled: true }` still gets the default `debounceMs`.
    versions: {
      drafts: false as TDrafts,
      ...input.versions,
      autosave: {
        enabled: false,
        debounceMs: DEFAULT_AUTOSAVE_DEBOUNCE_MS,
        ...input.versions?.autosave,
      },
    },
  };
}
```

#### packages/core/src/collections/config.test.ts

Existing file, 2 edits (full real code — `[agent]`).

**1 — new `describe` block for `versions` defaults**, added after the existing `"defineCollection — updatedAt injection"` block:

```ts
describe("defineCollection — versions defaults", () => {
  it("defaults versions.drafts to false, versions.defaultStatus to 'draft', versions.autosave to disabled, and versions.cascadeDelete to true when versions is omitted", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.versions).toEqual({
      drafts: false,
      defaultStatus: "draft",
      autosave: { enabled: false, debounceMs: 1000 },
      cascadeDelete: true,
    });
  });

  it("resolves versions.drafts: true when declared, defaulting defaultStatus to 'draft', autosave to disabled, and cascadeDelete to true", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true },
    });
    expect(posts.versions).toEqual({
      drafts: true,
      defaultStatus: "draft",
      autosave: { enabled: false, debounceMs: 1000 },
      cascadeDelete: true,
    });
  });

  it("enables autosave alongside drafts, defaulting debounceMs to 1000 when omitted", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, autosave: { enabled: true } },
    });
    expect(posts.versions).toEqual({
      drafts: true,
      defaultStatus: "draft",
      autosave: { enabled: true, debounceMs: 1000 },
      cascadeDelete: true,
    });
  });

  it("honors an explicit autosave.debounceMs override", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: {
        drafts: true,
        autosave: { enabled: true, debounceMs: 5000 },
      },
    });
    expect(posts.versions).toEqual({
      drafts: true,
      defaultStatus: "draft",
      autosave: { enabled: true, debounceMs: 5000 },
      cascadeDelete: true,
    });
  });

  it("honors an explicit cascadeDelete: false override", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, cascadeDelete: false },
    });
    expect(posts.versions).toEqual({
      drafts: true,
      defaultStatus: "draft",
      autosave: { enabled: false, debounceMs: 1000 },
      cascadeDelete: false,
    });
  });

  it("honors an explicit defaultStatus: 'published' override", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      versions: { drafts: true, defaultStatus: "published" },
    });
    expect(posts.versions.defaultStatus).toBe("published");
  });
});
```

**2 — new `describe` block for the three reserved versioning keys**, added after it:

```ts
describe("defineCollection — reserved versioning field keys", () => {
  it("throws at runtime when a user field is literally named vex_status", () => {
    const fields: Record<string, AdminField> = {
      vex_status: text({ label: "Status" }),
    };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(
      /reserved/,
    );
  });

  it("throws at runtime when a user field is literally named vex_publishedAt", () => {
    const fields: Record<string, AdminField> = {
      vex_publishedAt: text({ label: "Published At" }),
    };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(
      /reserved/,
    );
  });

  it("throws at runtime when a user field is literally named vex_publishedId", () => {
    const fields: Record<string, AdminField> = {
      vex_publishedId: text({ label: "Published Id" }),
    };
    expect(() => defineCollection({ slug: "posts", fields })).toThrow(
      /reserved/,
    );
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

Existing file, 3 edits (full real code — `[agent]`).

**1 — extend the existing `"applies admin defaults when omitted"` test** with the `autosave` default, right after its `expect(g.versions.drafts).toBe(false);` line:

```ts
expect(g.versions.autosave).toEqual({ enabled: false, debounceMs: 1000 });
```

**2 — new tests after `"enables drafts when versions.drafts is true"`**, covering the `autosave` object shape and its `debounceMs` default/override:

```ts
it("enables autosave alongside drafts, defaulting debounceMs to 1000 when omitted", () => {
  const g = defineGlobal({
    slug: "nav",
    label: "Nav",
    fields: {} as any,
    versions: { drafts: true, autosave: { enabled: true } },
  });
  expect(g.versions.drafts).toBe(true);
  expect(g.versions.autosave).toEqual({ enabled: true, debounceMs: 1000 });
});

it("honors an explicit autosave.debounceMs override", () => {
  const g = defineGlobal({
    slug: "nav",
    label: "Nav",
    fields: {} as any,
    versions: { drafts: true, autosave: { enabled: true, debounceMs: 250 } },
  });
  expect(g.versions.autosave).toEqual({ enabled: true, debounceMs: 250 });
});
```

**3 — regression guard for the resolved `GlobalConfig`'s `TDrafts = boolean` default (Step 1's fix — a `= false` default here reintroduces the `TS2322` the developer hit assigning a `{ drafts: true }` global to a bare `GlobalConfig`-typed variable).** Add a type-only import beside the existing ones:

```ts
import type { GlobalConfig } from "./types";
```

and a new test at the end of the `describe("defineGlobal", ...)` block:

```ts
it("a resolved global declaring versions.drafts: true is assignable to a bare GlobalConfig annotation", () => {
  const nav = defineGlobal({
    slug: "nav",
    label: "Nav",
    fields: {} as any,
    versions: { drafts: true },
  });
  const wide: GlobalConfig = nav;
  expect(wide.versions.drafts).toBe(true);
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 2 — Schema generation `[dev]`

Why: No mutation can be written before the tables and indexes exist. Inverts `generateVexSchema.test.ts`'s current "does not include versioning fields" assertion.

**Where the injection lives (developer decision, revised during implementation).** The per-collection `defineTable(...)` source is assembled by `collectionConfigToVexSchema` (`collections/validator.ts`), which already accumulates a `fieldsBlock` array and an `indexes` array and joins them at the end. The version fields belong in those same two arrays — so `collectionConfigToVexSchema` owns the injection, calling one helper exported from the `versions/` folder just before it composes its return string. The earlier sketch (a private `injectVersionFields` in `generateVexSchema.ts` that spliced the finished string against an `export const <name> = defineTable({\n` anchor) is dropped: it re-parsed a string this function had just built, and its "append the two `.index()` calls at the very end" step existed only because the `indexes` array was already out of reach. Building the lines in-place needs no anchor, no splice, and no assumption about the shape of the emitted chain.

`vex_globals` is hand-built in `generateVexSchema.ts` (it is not a `CollectionConfig`, so it never passes through `collectionConfigToVexSchema`), so the helper returns line arrays rather than a finished table — both call sites splice them into their own line arrays the same way.

- [ ] `packages/core/src/versions/schema.ts` (new) — `versionFieldsToVexSchema({ tableName })` → `{ fields, indexes }`, the emitted source lines for the three system fields and their two indexes.
- [ ] `packages/core/src/versions/index.ts` — re-export it from the barrel.
- [ ] `packages/core/src/collections/validator.ts` — `collectionConfigToVexSchema` pushes those lines when `collection.versions.drafts` is true.
- [ ] `packages/core/src/schema/generateVexSchema.ts` — an unconditional `vex_versions` table, and the same helper applied to `vex_globals` when any registered global declares `versions.drafts: true`.
- [ ] `packages/core/src/schema/generateVexSchema.test.ts` — replace the "does not include versioning fields in v35" assertion with its inverse; add collection-level and `vex_versions` coverage.

#### packages/core/src/versions/schema.ts

````ts
/**
 * The generated-schema source lines a versioned table needs: the three
 * `vex_*` system fields and the two indexes every draft-aware query reads
 * through (`by_status` for the published-only filter, `by_published` for
 * `findDraftRow`).
 *
 * Returns LINES rather than a finished table string because its two callers
 * build their tables differently — `collectionConfigToVexSchema`
 * (`collections/validator.ts`) accumulates `fieldsBlock`/`indexes` arrays
 * from a `CollectionConfig`, while `generateVexSchema` hand-writes the
 * `vex_globals` block as a literal line array (a global is not a
 * `CollectionConfig` and never passes through the former). Emitting lines
 * lets both splice into what they already have instead of re-parsing a
 * string one of them just produced.
 *
 * @param props - Input props.
 * @param props.tableName - The table these lines are emitted into. Also the
 *   target of the self-referential `vex_publishedId`: a draft row always
 *   points back at a published row in this SAME table, globals included
 *   (design-review §9 treats a global's draft as another `vex_globals` row).
 * @returns `fields` — object-literal member lines, tab-indented and
 *   comma-terminated to match the field lines around them; `indexes` —
 *   `.index(...)` chain lines, tab-indented to match the existing chain.
 * @throws {Error} Always, until implemented.
 *
 * @example
 * ```ts
 * const { fields, indexes } = versionFieldsToVexSchema({ tableName: "posts" });
 * fieldsBlock.push(...fields);
 * collectionIndexes.push(...indexes);
 */
export function versionFieldsToVexSchema(props: { tableName: string }): {
  fields: string[];
  indexes: string[];
} {
  // TODO: implement
  // 1. fields:
  //    `\tvex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),`
  //    `\tvex_publishedAt: v.optional(v.number()),`
  //    `\tvex_publishedId: v.optional(v.id("${props.tableName}")),`
  //    → `vex_status` is optional, not defaulted: a row written before
  //      `versions.drafts` was turned on has no value for it, and Step 20's
  //      `backfillStatus` action — not the schema — is what stamps those.
  // 2. indexes:
  //    `\t.index("by_status", ["vex_status"])`
  //    `\t.index("by_published", ["vex_publishedId"])`
  // 3. → return `{ fields, indexes }`.
  // Edge cases:
  // - A table with no other indexes: the caller's `indexes` array holds only
  //   these two, and its own `indexes.length > 0` check emits them normally.
  // - This function never checks `versions.drafts` itself — each caller owns
  //   that branch, because each already has the config object in hand and
  //   neither wants a no-op call in the common non-versioned case.
  throw new Error("Not implemented");
}
````

#### packages/core/src/versions/index.ts

Existing file (Step 1 created it); 1 edit — one more line beside the `constants` export.

```ts
export * from "./schema";
```

#### packages/core/src/collections/validator.ts

Existing file; 2 edits. Everything else in `collectionConfigToVexSchema` — the field loop,
the relationship-driven search index, the return composition — is unchanged.

**1 — import.** Deep path, NOT the `../versions` barrel: later steps put
`assertNoDraftRelationships` (Step 9) behind that barrel, and it imports `CollectionConfig`
from `../collections/types`, so barrel-importing here would close a `collections → versions →
collections` cycle. `schema.ts` itself imports nothing.

```ts
import { versionFieldsToVexSchema } from "../versions/schema";
```

**2 — the injection**, immediately after the `relationships.forEach(...)` block and before the
`return` that composes `fieldsBlock`/`indexes`/`searchIndexes`:

```ts
// A versioned collection's table carries the two-row model's system fields
// and the indexes `find`'s status filter (Step 13) and `findDraftRow`
// (Step 4) read through. Pushed into the same arrays as every other field
// and index, so the return below composes them with no special casing.
if (props.collection.versions.drafts) {
  const versionSchema = versionFieldsToVexSchema({
    tableName: props.collection.slug,
  });
  fieldsBlock.push(...versionSchema.fields);
  indexes.push(...versionSchema.indexes);
}
```

#### packages/core/src/schema/generateVexSchema.ts

Existing file; 3 edits. The header/early-return, the imports line, and the per-collection
`collectionSchemas` map are all UNCHANGED — collections now pick up their version fields
inside `collectionConfigToVexSchema` itself, so nothing in this file's collection path
changes.

**1 — import.**

```ts
import { versionFieldsToVexSchema } from "../versions/schema";
```

**2 — the `vex_versions` table, built unconditionally** (only reachable once the existing
`collections.length < 1 && globals.length < 1` early return didn't fire), inserted between
the `collectionSchemas` join and the `globalsTable` block:

```ts
const vexVersionsTable = [
  "",
  "/**",
  " * VEX VERSIONS — immutable history, one row per draft save and per publish",
  " **/",
  "",
  "export const vex_versions = defineTable({",
  "  collection: v.string(),",
  "  documentId: v.string(),",
  "  version: v.number(),",
  '  status: v.union(v.literal("draft"), v.literal("published")),',
  "  snapshot: v.any(),",
  "  createdBy: v.optional(v.string()),",
  "  parentVersion: v.optional(v.number()),",
  "  restoredFrom: v.optional(v.number()),",
  "  publishedAt: v.optional(v.number()),",
  "})",
  '  .index("by_document_version", ["collection", "documentId", "version"])',
].join("\n");
```

Unconditional on purpose: emitting it only when some resource declares `versions.drafts`
would mean toggling one collection's flag off later deletes a table a `schema.ts` import
already references.

**3 — the `vex_globals` branch**, inside the existing `if (props.config.globals.length > 0)`
block. `vex_globals` is hand-built here rather than through `collectionConfigToVexSchema`, so
it calls the same helper directly:

```ts
let globalsTable = "";
if (props.config.globals.length > 0) {
  const versioned = props.config.globals.some(
    (global) => global.versions.drafts,
  );
  const versionSchema = versioned
    ? versionFieldsToVexSchema({ tableName: "vex_globals" })
    : { fields: [], indexes: [] };
  globalsTable = [
    "",
    "/**",
    " * VEX GLOBALS — singleton documents, one row per registered global slug",
    " **/",
    "",
    "export const vex_globals = defineTable({",
    "  slug: v.string(),",
    "  data: v.any(),",
    ...versionSchema.fields,
    "})",
    '  .index("by_slug", ["slug"])',
    ...versionSchema.indexes,
  ].join("\n");
}
```

ANY versioned global versions the shared table — `vex_globals` holds every global's row, so
the columns are per-table, not per-slug. A global that doesn't declare `versions.drafts`
simply never has them written.

**Return**, extended with the new table:

```ts
return success(
  [header, imports, collectionSchemas, vexVersionsTable, globalsTable].join(
    "\n",
  ),
);
```

#### packages/core/src/schema/generateVexSchema.test.ts

Existing file, 3 edits (full real code — `[dev]`).

**1 — remove the now-inverted test.** Delete the `it("does not include versioning fields in v35", ...)` block inside `describe("generateVexSchema — globals", ...)` — it asserted the old no-op behavior this step reverses.

**2 — add a new `describe` block for versioned collections**, placed after the existing `describe("generateVexSchema — integration (full collection)", ...)` block:

```ts
describe("generateVexSchema — versioned collections", () => {
  it("emits vex_status, vex_publishedAt, vex_publishedId, and both indexes for a collection with versions.drafts: true", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text() },
      versions: { drafts: true },
    });
    const config = defineConfig({ collections: [posts] });
    const { contents } = generateVexSchema({ config });

    expect(contents).toContain(
      'vex_status: v.optional(v.union(v.literal("draft"), v.literal("published")))',
    );
    expect(contents).toContain("vex_publishedAt: v.optional(v.number())");
    expect(contents).toContain('vex_publishedId: v.optional(v.id("posts"))');
    expect(contents).toContain('.index("by_status", ["vex_status"])');
    expect(contents).toContain('.index("by_published", ["vex_publishedId"])');
  });

  it("does not emit versioning fields for a non-versioned collection in the same config", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text() },
      versions: { drafts: true },
    });
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text() },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const { contents } = generateVexSchema({ config });

    // Scope to "authors"' own table block — asserting on `contents` as a
    // whole would pass vacuously since "posts" DOES emit these fields.
    const marker = "export const authors = defineTable({";
    const authorsStart = contents.indexOf(marker);
    expect(authorsStart).toBeGreaterThan(-1);
    const nextExportStart = contents.indexOf(
      "export const",
      authorsStart + marker.length,
    );
    const authorsBlock =
      nextExportStart === -1
        ? contents.slice(authorsStart)
        : contents.slice(authorsStart, nextExportStart);

    expect(authorsBlock).not.toContain("vex_status");
    expect(authorsBlock).not.toContain("vex_publishedAt");
    expect(authorsBlock).not.toContain("vex_publishedId");
    expect(authorsBlock).not.toContain("by_status");
    expect(authorsBlock).not.toContain("by_published");
  });

  it("emits vex_versions unconditionally, even when no collection or global declares drafts", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const { contents } = generateVexSchema({ config });

    expect(contents).toContain("export const vex_versions = defineTable({");
    expect(contents).toContain("collection: v.string(),");
    expect(contents).toContain("documentId: v.string(),");
    expect(contents).toContain("version: v.number(),");
    expect(contents).toContain(
      'status: v.union(v.literal("draft"), v.literal("published")),',
    );
    expect(contents).toContain("snapshot: v.any(),");
    expect(contents).toContain("createdBy: v.optional(v.string()),");
    expect(contents).toContain("parentVersion: v.optional(v.number()),");
    expect(contents).toContain("restoredFrom: v.optional(v.number()),");
    expect(contents).toContain("publishedAt: v.optional(v.number()),");
    expect(contents).toContain(
      '.index("by_document_version", ["collection", "documentId", "version"])',
    );
  });
});
```

**3 — add one new test inside the existing `describe("generateVexSchema — globals", ...)` block**, after `"does not emit vex_globals when no globals registered"`:

```ts
it("emits vex_status, vex_publishedAt, vex_publishedId, and both indexes on vex_globals when a registered global declares versions.drafts: true", () => {
  const nav = defineGlobal({
    slug: "nav",
    label: "Nav",
    fields: {} as any,
    versions: { drafts: true },
  });
  const config = defineConfig({ globals: [nav] });
  const { contents } = generateVexSchema({ config });

  // Scope to "vex_globals"' own table block — the unrelated `status`-shaped
  // field on the vex_versions block would otherwise false-pass a bare
  // `contents`-wide assertion.
  const marker = "export const vex_globals = defineTable({";
  const globalsStart = contents.indexOf(marker);
  expect(globalsStart).toBeGreaterThan(-1);
  const nextExportStart = contents.indexOf(
    "export const",
    globalsStart + marker.length,
  );
  const globalsBlock =
    nextExportStart === -1
      ? contents.slice(globalsStart)
      : contents.slice(globalsStart, nextExportStart);

  expect(globalsBlock).toContain(
    'vex_status: v.optional(v.union(v.literal("draft"), v.literal("published")))',
  );
  expect(globalsBlock).toContain("vex_publishedAt: v.optional(v.number())");
  expect(globalsBlock).toContain(
    'vex_publishedId: v.optional(v.id("vex_globals"))',
  );
  expect(globalsBlock).toContain('.index("by_status", ["vex_status"])');
  expect(globalsBlock).toContain('.index("by_published", ["vex_publishedId"])');
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 3 — `deleteVersions` action `[agent]`

Why: One-line access change Steps 17 and 18 both gate on. `readDrafts`/`saveDraft`/`publish`/`unpublish` already exist in `DRAFT_ACTIONS` — this is the only gap. Verified end-to-end with `tsc` (using Step 1's `TDrafts` fix): `HasDrafts<R>` correctly resolves `true` for a resource declared with `versions: { drafts: true }` and `false` otherwise, so `deleteVersions` composes onto that resource's action union with zero changes to `access/types.ts` — exactly what AP-008 requires (compose by shape, don't touch the already-correct union machinery).

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

Why: Leaf utilities every mutation below calls. No `pruneVersions` (decision 3). `model.test.ts` needs real `ctx.db` access against `vex_status`/`vex_publishedId`/`vex_versions`, so this step also extends the SHARED `api/test/convex/schema.ts` fixture every other `.server.test.ts` in `api/` already imports — the first step to need these shapes, landing them once for Steps 5–17 to reuse without touching this file again.

- [ ] `packages/core/src/versions/extractUserFields.ts` (new)
- [ ] `packages/core/src/versions/model.ts` (new)
- [ ] `packages/core/src/versions/index.ts` — extend the Step 1 barrel.
- [ ] `packages/core/src/api/test/convex/schema.ts` — extend the shared fixture with the versioning shapes `model.test.ts` (and every downstream integration test) needs.
- [ ] `packages/core/src/versions/extractUserFields.test.ts`, `packages/core/src/versions/model.test.ts`.

#### packages/core/src/versions/extractUserFields.ts

````ts
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
export function extractUserFields(props: {
  doc: Record<string, unknown>;
}): Record<string, unknown> {
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
````

#### packages/core/src/versions/model.ts

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
export async function getLatestVersion<
  DataModel extends GenericDataModel,
>(props: {
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

#### packages/core/src/versions/index.ts

Existing file (created by Step 1), 1 edit — append to the barrel:

```ts
export * from "./model";
export * from "./extractUserFields";
```

#### packages/core/src/api/test/convex/schema.ts

Existing file, 3 edits — every other table in this shared fixture is unchanged.

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

**3 — the `vex_globals` table gains the same three versioning columns and two indexes.**
Step 7's versioned-global tests (`globals/upsert.server.test.ts`,
`globals/get.server.test.ts`) seed `vex_status`/`vex_publishedAt`/`vex_publishedId` directly
onto `vex_globals` rows, and `convexTest` validates every insert against this fixture — so
without these columns those suites fail at runtime on schema validation, not on the behavior
they mean to assert. `vex_publishedId` is self-referential here for the same reason it is on
a collection: a versioned global's draft is another `vex_globals` row pointing back at the
published one (design-review §9).

```ts
  vex_globals: defineTable({
    slug: v.string(),
    data: v.any(),
    vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    vex_publishedAt: v.optional(v.number()),
    vex_publishedId: v.optional(v.id("vex_globals")),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["vex_status"])
    .index("by_published", ["vex_publishedId"]),
```

#### packages/core/src/versions/extractUserFields.test.ts

New file, complete.

```ts
import { describe, expect, it } from "vitest";
import { extractUserFields } from "./extractUserFields";

describe("extractUserFields", () => {
  it("strips _id, _creationTime, and every VERSION_SYSTEM_FIELDS member", () => {
    const doc = {
      _id: "abc",
      _creationTime: 1700000000000,
      title: "Hello",
      body: "World",
      vex_status: "draft",
      vex_publishedAt: 1700000001000,
      vex_publishedId: "def",
    };
    const result = extractUserFields({ doc });
    expect(result).toEqual({ title: "Hello", body: "World" });
  });

  it("returns the user fields unchanged when none of the stripped keys are present", () => {
    // A never-published draft with no vex_publishedId yet.
    const doc = { title: "Hello" };
    const result = extractUserFields({ doc });
    expect(result).toEqual({ title: "Hello" });
  });

  it("does not mutate the input document", () => {
    const doc = { _id: "abc", title: "Hello" };
    extractUserFields({ doc });
    expect(doc).toEqual({ _id: "abc", title: "Hello" });
  });
});
```

#### packages/core/src/versions/model.test.ts

New file, complete.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, it } from "vitest";

import * as _generatedApi from "../api/test/convex/_generated/api";
import schema from "../api/test/convex/schema";
import {
  createVersion,
  findDraftRow,
  getLatestVersion,
  getVersion,
  listVersions,
} from "./model";

/** Explicit modules map for convex-test (replaces import.meta.glob which requires Vite). */
const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("createVersion + getLatestVersion", () => {
  it("returns null for a document with no version history", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getLatestVersion({ ctx, collection: "posts", documentId: "nonexistent" }),
    );
    expect(result).toBeNull();
  });

  it("assigns version 1 to a document's first snapshot", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "Hi", slug: "hi" }),
    );
    const version = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "Hi" },
      }),
    );
    expect(version).toBe(1);
    const latest = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getLatestVersion({ ctx, collection: "posts", documentId: id }),
    );
    expect(latest?.version).toBe(1);
    expect(latest?.snapshot).toEqual({ title: "Hi" });
  });

  it("increments the version number on each successive snapshot for the same document", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "A" },
      }),
    );
    const second = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "B" },
      }),
    );
    expect(second).toBe(2);
    const latest = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getLatestVersion({ ctx, collection: "posts", documentId: id }),
    );
    expect(latest?.version).toBe(2);
    expect(latest?.snapshot).toEqual({ title: "B" });
  });

  it("resolves the true max by the indexed version field, not insertion order", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "X", slug: "x" }),
    );
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "v1" },
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 3,
        status: "draft",
        snapshot: { title: "v3" },
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 2,
        status: "draft",
        snapshot: { title: "v2" },
      });
    });
    const latest = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getLatestVersion({ ctx, collection: "posts", documentId: id }),
    );
    expect(latest?.version).toBe(3);
  });
});

describe("getVersion", () => {
  it("returns the exact version row requested", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v1" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v2" },
      }),
    );
    const version1 = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getVersion({ ctx, collection: "posts", documentId: id, version: 1 }),
    );
    expect(version1?.version).toBe(1);
    expect(version1?.snapshot).toEqual({ title: "v1" });
  });

  it("returns null for a version number that does not exist", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v1" },
      }),
    );
    const missing = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getVersion({ ctx, collection: "posts", documentId: id, version: 5 }),
    );
    expect(missing).toBeNull();
  });
});

describe("listVersions", () => {
  it("returns every version newest first", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v1" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v2" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v3" },
      }),
    );
    const versions = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      listVersions({ ctx, collection: "posts", documentId: id }),
    );
    expect(versions.map((v) => v.version)).toEqual([3, 2, 1]);
  });

  it("respects limit", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v1" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v2" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: id,
        status: "draft",
        snapshot: { title: "v3" },
      }),
    );
    const versions = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      listVersions({ ctx, collection: "posts", documentId: id, limit: 2 }),
    );
    expect(versions.map((v) => v.version)).toEqual([3, 2]);
  });

  it("scopes to the requested collection and documentId — does not leak another document's history", async () => {
    const t = convexTest(schema, modules);
    const idA = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "A", slug: "a" }),
    );
    const idB = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "B", slug: "b" }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: idA,
        status: "draft",
        snapshot: { title: "A" },
      }),
    );
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      createVersion({
        ctx,
        collection: "posts",
        documentId: idB,
        status: "draft",
        snapshot: { title: "B" },
      }),
    );
    const versions = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      listVersions({ ctx, collection: "posts", documentId: idA }),
    );
    expect(versions).toHaveLength(1);
    expect(versions[0]?.documentId).toBe(idA);
  });
});

describe("findDraftRow", () => {
  it("returns null when the published document has no draft", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run(
      (ctx: GenericMutationCtx<GenericDataModel>) =>
        ctx.db.insert("posts", {
          title: "Post",
          slug: "post",
          vex_status: "published",
        }),
    );
    const draft = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findDraftRow({ ctx, collection: "posts", publishedId }),
    );
    expect(draft).toBeNull();
  });

  it("returns the draft row pointing at the given published id", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, draftId } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Post",
          slug: "post",
          vex_status: "published",
        });
        const draftId = await ctx.db.insert("posts", {
          title: "Post (edited)",
          slug: "post",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });
        return { publishedId, draftId };
      },
    );
    const draft = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findDraftRow({ ctx, collection: "posts", publishedId }),
    );
    expect(draft?._id).toBe(draftId);
    expect(draft?._id).not.toBe(publishedId);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 5 — `saveDraft` `[dev]`

Why: `update()`'s write pipeline — `hasPermission → merge → beforeChange → diff → validate → validateFields` — was never callable from anywhere but `update()` itself. `saveDraft` needs exactly that pipeline (lenient, changed-keys-only validation) but can never reuse `update()` directly: `update()` always patches the exact `args.id` it was given, while `saveDraft` may need to bootstrap a brand-new draft row, or patch a DIFFERENT row than the id the caller is holding (the draft counterpart of a published id). `prepareEdit` is the slice of `update()`'s old body that doesn't care which row it's for; this step extracts it once and makes `update()` the pipeline's first caller-via-extraction, `saveDraft` its second.

Under Option A, `saveDraft` is not collection-only — it is the ONE shared entry point for drafting both a versioned collection's document and a versioned global, because both now resolve to "two rows (or one, pre-first-publish) distinguished by `vex_status`," not two different mechanisms. `resolveVersionedTarget` is the seam that makes this possible: it is the single place that knows a collection's draft/published rows live as two rows of the SAME table (`vex_status`/`vex_publishedId` columns, `ctx.db.get`/index lookups), while a global's draft/published rows live as two rows of the single shared `vex_globals` table (`slug` + `vex_status`, filtered via `by_slug`) — and it hides that difference behind one flat `VersionedTargetRows` descriptor (`table`, `historyCollection`, `documentId`, the resolved `publishedRow`/`draftRow`, and four small per-kind functions: `toUserFields`, `buildDraftInsert`, `buildDraftPatch`). `saveDraftShared`, the function that actually bootstraps-or-reuses the draft row, runs the `prepareEdit` pipeline, patches, and records history, is written entirely against that descriptor and never branches on `target.kind` itself — every per-kind difference lives inside `rows`. This settles ahead of time what Step 7 (registration/reachability) and Step 9 (publish, which reuses `resolveVersionedTarget` for its own row resolution) both depend on: the kind-agnostic save/publish machinery ships here, complete, before anything can call it over the wire.

`prepareEdit` takes a `CollectionOrGlobal` target (`types/utils.ts`) rather than a bare `CollectionConfig`, for the same reason: `saveDraftShared` calls it once for either kind, so the permission `resource`, the `beforeChange` hook dispatch, and the fields it reads off `target.config` all have to work for a `GlobalConfig` too.

- [x] `packages/core/src/api/prepareEdit.ts` — extracts `update.server.ts`'s write pipeline into a function `saveDraft`/`publish` also call, instead of each duplicating it. Takes a `CollectionOrGlobal` target (not a bare `CollectionConfig`) so the one function serves collections and globals alike — the permission `resource` is `target.config.slug` either way, and `beforeChange` dispatches on `target.kind` to pass the hook its collection- or global-shaped context.
- [x] `packages/core/src/api/prepareEdit.test.ts`
- [x] `packages/core/src/api/update/server.ts` — refactored to call `prepareEdit` instead of inlining the same pipeline, targeting `{ kind: "collection", config: collection }`. `update.server.test.ts` is unchanged and is the regression guard that the extraction preserves behavior. (`update()`'s own later behavior — rejecting a draft row's own id, and recording a `"published"`-status history row on every write — is a `collection.versions.defaultStatus`-driven addition layered on top of this same file; that further edit is owned by a later step, not this one.)
- [x] `packages/core/src/types/utils.ts` — `CollectionOrGlobal`, the discriminated union `prepareEdit`/`saveDraftShared`/`resolveVersionedTarget` all key their per-kind behavior on: `{ kind: "collection"; config: CollectionConfig } | { kind: "global"; config: GlobalConfig }`.
- [x] `packages/core/src/versions/resolveVersionedTarget.ts` — the one place that knows how a versioned collection's two-rows-in-one-table shape differs from `vex_globals`' two-rows-sharing-a-slug shape; resolves either into one flat `VersionedTargetRows` descriptor so every later step of the save pipeline is identical code for either kind.
- [x] `packages/core/src/versions/saveDraft.ts` — `saveDraftShared`, the kind-agnostic bootstrap/merge/patch/history pipeline every draft save (collection or global) runs through. Never branches on `target.kind`; every difference is already resolved into the `rows` descriptor it's handed.
- [x] `packages/core/src/api/versions/saveDraft.server.ts` — thin glue: resolves `{ collection, id }` or `{ global }` to a `CollectionOrGlobal` target + a `VersionedTargetRows` via `resolveVersionedTarget`, checks `versions.drafts` is enabled for the resolved resource, and delegates to `saveDraftShared`.
- [x] `packages/core/src/api/versions/saveDraft.client.ts`
- [x] `packages/core/src/api/versions/saveDraft.server.test.ts` — at most one draft row per document (or per global slug) across repeated saves; bootstrap fires once; a role restricted to one field on `saveDraft` gets the same restriction `update` would apply; a global with no rows at all gets a draft-only row with no `vex_publishedId`; history rows carry the right `publishedAt` regardless of which id (published or draft) the caller is holding.

#### packages/core/src/types/utils.ts

New file, complete.

```ts
import type { CollectionConfig } from "../collections";
import type { GlobalConfig } from "../globals";

/** An enum representing either a collection config or a global config.
 *  @example { kind: "collection"; config: CollectionConfig }
 *  @example { kind: "global"; config: GlobalConfig }
 *  @see {@link CollectionConfig}
 *  @see {@link GlobalConfig}
 */
export type CollectionOrGlobal =
  | { kind: "collection"; config: CollectionConfig }
  | { kind: "global"; config: GlobalConfig };
```

#### packages/core/src/api/prepareEdit.ts

New file, complete. Extracted from `update.server.ts`'s existing pipeline (merge →
`beforeChange` → diff → validate → `validateFields`) so `saveDraft` reuses it instead of
duplicating it, and generalized to take a `CollectionOrGlobal` target instead of a bare
`CollectionConfig` — `saveDraftShared` (this step) calls it for globals too, and `publish`
(a later step) calls it a third time for the same reason.

What stays OUT of this helper, because it differs per caller, answers "why can't
`saveDraft`/`publish` just call `update()`/`create()`/`upsertGlobal()` directly": the
permission ACTION to check under, which row `storedDoc` actually comes from, and — the
part that really can't be papered over — WHERE the result gets written. `update()` always
patches `args.id`. `saveDraft()` may insert a brand-new row or patch a DIFFERENT id than
the one referenced (the draft counterpart of a published id). None of
`update()`/`create()`'s "patch/insert exactly this one row" shape survives those cases —
this function is exactly the part that generalizes, and only that part.

```ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "./types";
import type { TDocument } from "./convex";
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission } from "../access";
import { getFieldsInputSchema, validateFields } from "../fields";
import { deepEqual, resolveAccessCall, toVexMutationCtx } from "./utils";
import { CollectionOrGlobal } from "../types";

/**
 * Args for {@link prepareEdit}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface PrepareEditProps<DataModel extends GenericDataModel> {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /**
   * The resolved `VexConfig`. Required: `validateFields` needs it to build the
   * `vex` api each field `validate()` receives. The permission check still
   * skips itself when `config.access` is unset (RBAC off).
   */
  config: VexConfig;
  /** The collection or global this write targets. `config.slug` is the permission resource. */
  target: CollectionOrGlobal;
  /** The permission action this write checks under. */
  action:
    | typeof CRUD_ACTIONS.create
    | typeof CRUD_ACTIONS.update
    | typeof DRAFT_ACTIONS.saveDraft
    | typeof DRAFT_ACTIONS.publish;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /**
   * The document to authorize against and merge onto — the CURRENT state of
   * whichever row this write is really targeting (the draft row for
   * `saveDraft`/`publish`, the row `args.id` names for `update`). `undefined`
   * only for a brand-new document with no prior state to merge onto.
   *
   * Caller contract: USER fields plus `_id`/`_creationTime` only — never
   * system columns. `prepareEdit` strips just `_id`/`_creationTime` before
   * merging, and in `validateKeys: "all"` mode `patch` carries every merged
   * key, so a stored doc carrying `vex_*`/`_slug` would leak them into the
   * write. Collections already satisfy this via `removeVexFields`; globals
   * pass `{ _id, _creationTime, ...row.data }`. A consequence of this
   * contract: `beforeChange` sees user fields only — no `vex_status` — on
   * every path.
   */
  storedDoc: TDocument | undefined;
  /** The caller's raw incoming payload — what `hasPermission`'s `changes` argument checks. */
  incoming: Partial<TDocument>;
  /** `true` for lenient validation (`update`, `saveDraft` — a draft may be incomplete); `false` for strict, `create`-strength validation (`publish`). */
  partial: boolean;
  /** Which fields get their `validate()` hook run: only what changed (`update`, `saveDraft`), or every field (`publish`, matching `create`). */
  validateKeys: "changed" | "all";
}

/** Result of {@link prepareEdit}. */
export interface PrepareEditResult {
  /** The full document after merge + `beforeChange`, already validated. */
  transformedFields: TDocument;
  /** Keys whose value actually changed, relative to the pre-`beforeChange` merge. */
  changedKeys: Set<string>;
  /**
   * The fields to write: only `changedKeys`' values when `validateKeys` is
   * `"changed"`, or the full `transformedFields` when it is `"all"` — `publish`
   * always writes every field, matching `create`'s "write everything" shape.
   */
  patch: Record<string, unknown>;
}

/**
 * Runs the write pipeline every field-mutating operation shares —
 * `hasPermission → merge → beforeChange → diff → validate → validateFields` —
 * and returns the prepared fields for the caller to write however its own
 * targeting requires. Does NOT touch `ctx.db`, call `createVersion`, or stamp
 * `updatedAt` — those steps differ per caller and stay in
 * `create()`/`update()`/`saveDraft()`/`publish()`/`upsertGlobal()` themselves.
 *
 * @typeParam DataModel - Convex data model (inferred from `props.ctx`).
 * @param props - See {@link PrepareEditProps}.
 * @returns See {@link PrepareEditResult}.
 * @throws {ConvexError} When Zod validation fails — `{ message, errors }`, naming
 *   every invalid/missing field.
 * @throws {VexAccessError} When the caller is not permitted to make this write.
 */
export async function prepareEdit<DataModel extends GenericDataModel>(
  props: PrepareEditProps<DataModel>,
): Promise<PrepareEditResult> {
  if (props.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: props.action,
      resource: props.target.config.slug,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: props.auth?.user ?? null,
      organization: props.auth?.organization,
      resource,
      action,
      data: props.storedDoc,
      changes: props.incoming,
    });
  }

  const { _id, _creationTime, ...fields } = props.storedDoc ?? {};
  const mergedFields = { ...fields, ...props.incoming } as TDocument;

  const operation = props.action === CRUD_ACTIONS.create ? "create" : "update";
  let transformedFields = mergedFields;
  if (props.target.kind === "collection" && props.target.config.hooks.beforeChange) {
    transformedFields = (await props.target.config.hooks.beforeChange({
      operation,
      doc: mergedFields as never,
      ctx: props.ctx,
      collection: props.target.config,
    })) as TDocument;
  } else if (props.target.kind === "global" && props.target.config.hooks.beforeChange) {
    transformedFields = (await props.target.config.hooks.beforeChange({
      operation,
      doc: mergedFields as never,
      ctx: props.ctx,
      global: props.target.config,
    })) as TDocument;
  }

  const changedKeys = new Set(Object.keys(props.incoming));
  for (const key of Object.keys(transformedFields)) {
    if (!deepEqual(transformedFields[key], mergedFields[key])) changedKeys.add(key);
  }

  const parsed = getFieldsInputSchema({
    fields: props.target.config.fields,
    partial: props.partial,
  }).safeParse(transformedFields);
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }

  const writeKeys =
    props.validateKeys === "all" ? new Set(Object.keys(transformedFields)) : changedKeys;
  await validateFields({
    fields: props.target.config.fields,
    doc: transformedFields,
    keys: writeKeys,
    ctx: toVexMutationCtx(props.ctx),
    config: props.config,
  });

  const patch: Record<string, unknown> = {};
  for (const key of writeKeys) patch[key] = transformedFields[key];

  return { transformedFields, changedKeys, patch };
}
```

#### packages/core/src/api/prepareEdit.test.ts

Covers: merge of `storedDoc`/`incoming` into `transformedFields`; `"changed"` mode only
writing fields that actually changed; a `beforeChange` transform surfacing in both
`transformedFields` and `changedKeys` even when it touches a key `incoming` never
mentioned; lenient (`partial: true`) mode accepting an incomplete merged document; strict
(`partial: false`) mode rejecting one missing a required field and naming it in the thrown
`ConvexError`; `validateKeys: "changed"` only invoking `validate()` for changed fields vs.
`validateKeys: "all"` invoking every field's `validate()` and returning the full document
as `patch`, not a delta; and an access denial throwing `VexAccessError` before
`beforeChange` or validation run at all. Verbatim as written against the collection-only
call shape (`target: { kind: "collection", config: posts }` throughout) — nothing here
changes once `saveDraftShared` starts exercising the `{ kind: "global", ... }` branch
elsewhere, since this file only proves `prepareEdit` itself, independent of caller.

#### packages/core/src/api/update/server.ts

Existing file, 2 edits (the same two edits the original extraction made; the file's later
`collection.versions.defaultStatus`-driven draft-reject/history-record addition is a
further edit to this same file, owned by a later step — not reproduced here).

**1 — imports.** Replace `import { CRUD_ACTIONS, hasPermission } from "../../access";`,
`import { getCollectionInputSchema, validateFields } from "../../collections";`, and
`import { deepEqual, resolveAccessCall, stampUpdatedAt } from "../utils";` with:

```ts
import { CRUD_ACTIONS } from "../../access";
import { stampUpdatedAt } from "../utils";
import { prepareEdit } from "../prepareEdit";
```

**2 — the function body**, from the `doc` fetch through the final `ctx.db.patch` (the
entire span after the `!collection` guard), shown complete:

```ts
  const doc = await args.ctx.db.get(args.id);
  const { patch } = await prepareEdit({
    ctx: args.ctx,
    config: args.config,
    target: { kind: "collection", config: collection },
    action: CRUD_ACTIONS.update,
    access: args.access,
    auth: args.auth,
    storedDoc: (doc ?? undefined) as TDocument | undefined,
    incoming: args.data as Partial<TDocument>,
    partial: true,
    validateKeys: "changed",
  });

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: patch });
  await args.ctx.db.patch(args.id, data as never);
}
```

#### packages/core/src/versions/resolveVersionedTarget.ts

New file, complete.

```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx, TableNamesInDataModel } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../types/generated";
import { VERSION_STATUSES } from "./constants";
import { findDraftRow } from "./model";
import { removeVexFields } from "./removeVexFields";

/**
 * The one place `saveDraft`'s shared implementation (`versions/saveDraft.ts`)
 * learns how a versioned collection's table differs from `vex_globals`'s
 * single shared table — every other step of the save-a-draft pipeline
 * (bootstrap/patch the draft row, snapshot the published state, record
 * history) is identical code for either kind, driven entirely through this
 * descriptor.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface VersionedTargetRows<DataModel extends GenericDataModel> {
  /** The table the published/draft rows live in. */
  table: TableNamesInDataModel<DataModel>;
  /** The `collection` value `createVersion`/`getLatestVersion` group history rows under. */
  historyCollection: CollectionSlug;
  /**
   * The id `vex_versions` history rows are keyed on — the published row's
   * `_id` for a collection (or the draft-only row's `_id` when the document
   * has never been published), or the global's `slug`. Resolved once, up
   * front, so it never shifts across a bootstrap this call might perform.
   */
  documentId: string;
  /** The currently-stored published row (`vex_status !== "draft"`), if any. */
  publishedRow: Record<string, unknown> | null;
  /** The currently-stored draft row (`vex_status === "draft"`), if any. */
  draftRow: Record<string, unknown> | null;
  /** Extracts the clean user-field document from a stored row — `storedDoc`/snapshot shape. */
  toUserFields: (row: Record<string, unknown>) => Record<string, unknown>;
  /** Builds the DB payload to insert a new draft row. */
  buildDraftInsert: (
    userFields: Record<string, unknown>,
    publishedId?: string,
  ) => Record<string, unknown>;
  /** Builds the DB payload to patch `patch` onto an existing draft `row`. */
  buildDraftPatch: (
    row: Record<string, unknown>,
    patch: Record<string, unknown>,
  ) => Record<string, unknown>;
}

/**
 * Resolves which rows a `saveDraft` call is really targeting, for either a
 * versioned collection document (identified by `id`, the published row's id
 * on every edit after the first, or a draft row's own id) or a versioned
 * global (identified by `slug` — `vex_globals` holds every global's rows in
 * one table, distinguished by `slug` + `vex_status`, exactly like a
 * collection's own table distinguishes its published/draft rows via
 * `vex_status`/`vex_publishedId`).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param args - Either `{ ctx, collection, id }` or `{ ctx, global }`.
 * @returns A {@link VersionedTargetRows} descriptor for `versions/saveDraft.ts`.
 * @throws {ConvexError} When `id` does not resolve to a document in `collection`.
 */
export async function resolveVersionedTarget<DataModel extends GenericDataModel>(
  args: { ctx: GenericMutationCtx<DataModel> } & (
    | { collection: CollectionSlug; id: GenericId<CollectionSlug> }
    | { global: GlobalSlug }
  ),
): Promise<VersionedTargetRows<DataModel>> {
  if ("collection" in args) {
    const { ctx, collection, id } = args;
    const table = collection as TableNamesInDataModel<DataModel>;
    const targetRow = (await ctx.db.get(collection, id)) as Record<string, unknown> | null;
    if (targetRow === null) {
      throw new ConvexError(`No document found for id "${id}" in collection "${collection}"`);
    }

    let draftRow: Record<string, unknown> | null = null;
    let publishedRow: Record<string, unknown> | null = null;
    if (targetRow.vex_status === VERSION_STATUSES.draft.key) {
      draftRow = targetRow;
      const publishedId = targetRow.vex_publishedId as GenericId<CollectionSlug> | undefined;
      publishedRow =
        publishedId === undefined
          ? null
          : ((await ctx.db.get(collection, publishedId)) as Record<string, unknown> | null);
    } else {
      publishedRow = targetRow;
      draftRow = (await findDraftRow({
        ctx,
        collection,
        publishedId: targetRow._id as GenericId<CollectionSlug>,
      })) as Record<string, unknown> | null;
    }

    const documentId = String((publishedRow?._id as string | undefined) ?? (draftRow?._id as string));

    return {
      table,
      historyCollection: collection,
      documentId,
      publishedRow,
      draftRow,
      toUserFields: (row) => removeVexFields({ doc: row }),
      buildDraftInsert: (userFields, publishedId) => ({
        ...userFields,
        vex_status: VERSION_STATUSES.draft.key,
        ...(publishedId !== undefined ? { vex_publishedId: publishedId } : {}),
      }),
      buildDraftPatch: (_row, patch) => patch,
    };
  }

  const { ctx, global } = args;
  const table = "vex_globals" as TableNamesInDataModel<DataModel>;
  const rows = (await ctx.db
    .query("vex_globals")
    .withIndex("by_slug", (q) => q.eq("slug", global as never))
    .collect()) as Record<string, unknown>[];
  const publishedRow = rows.find((r) => r.vex_status !== VERSION_STATUSES.draft.key) ?? null;
  const draftRow = rows.find((r) => r.vex_status === VERSION_STATUSES.draft.key) ?? null;

  return {
    table,
    historyCollection: "vex_globals" as CollectionSlug,
    documentId: global,
    publishedRow,
    draftRow,
    toUserFields: (row) => (row.data as Record<string, unknown> | undefined) ?? {},
    buildDraftInsert: (userFields, publishedId) => ({
      slug: global,
      data: userFields,
      vex_status: VERSION_STATUSES.draft.key,
      ...(publishedId !== undefined ? { vex_publishedId: publishedId } : {}),
    }),
    buildDraftPatch: (row, patch) => ({
      data: { ...((row.data as Record<string, unknown> | undefined) ?? {}), ...patch },
    }),
  };
}
```

Note: `findDraftRow`, `createVersion`, `getLatestVersion`, and `removeVexFields` (the
rename of the collection-only `extractUserFields` helper the original 2026-08-23 draft of
this spec used) are `packages/core/src/versions/model.ts` / `removeVexFields.ts` —
existing files from Step 4, reused here unmodified.

#### packages/core/src/versions/saveDraft.ts

New file, complete.

```ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../api/types";
import { DRAFT_ACTIONS } from "../access";
import { prepareEdit } from "../api/prepareEdit";
import type { CollectionOrGlobal } from "../types/utils";
import { VERSION_STATUSES } from "./constants";
import { createVersion, getLatestVersion } from "./model";
import { removeVexFields } from "./removeVexFields";
import type { VersionedTargetRows } from "./resolveVersionedTarget";

/**
 * Kind-agnostic `saveDraft` implementation shared by both versioned
 * collections and versioned globals. Every per-kind difference — which table
 * the rows live in, how a row's user fields are extracted, and how a draft
 * row's insert/patch payload is shaped (flat on a collection row, nested
 * under `data` on a `vex_globals` row) — is already resolved into `rows`
 * (see {@link resolveVersionedTarget}); this function never branches on
 * `target.kind` itself.
 *
 * Mirrors the original collection-only `saveDraft` step for step: bootstrap
 * (or reuse) the draft row, snapshotting the pre-edit published state the
 * first time a draft branches off it; run the shared `prepareEdit`
 * merge/validate pipeline against the draft row's stored content; patch the
 * draft row; and record one `"draft"`-status history row.
 *
 * **Authorization is evaluated against the STORED draft row**, never
 * against the incoming payload — `prepareEdit` passes `changes: data` to
 * `hasPermission` internally, which is what lets a field-level permission
 * map deny individual keys.
 *
 * Does NOT stamp `updatedAt`: an autosave tick is not a real edit of the
 * live document; `publish` stamps it once, on promotion.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Resolved target + merge inputs.
 * @returns The draft row's `_id`, as a string.
 * @throws {ConvexError} Propagated from `prepareEdit` on validation failure.
 * @throws {VexAccessError} When the caller is not permitted to save this draft.
 */
export async function saveDraftShared<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  config: VexConfig;
  target: CollectionOrGlobal;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  data: Record<string, unknown>;
  restoredFrom?: number;
  rows: VersionedTargetRows<DataModel>;
}): Promise<string> {
  const { ctx, config, target, rows } = props;
  const data = removeVexFields({ doc: props.data });

  let draftRow = rows.draftRow;
  const publishedRow = rows.publishedRow;

  if (draftRow === null) {
    if (publishedRow !== null) {
      await createVersion({
        ctx,
        collection: rows.historyCollection,
        documentId: rows.documentId,
        status: VERSION_STATUSES.published.key,
        snapshot: rows.toUserFields(publishedRow),
        publishedAt: publishedRow.vex_publishedAt as number | undefined,
      });
    }
    const insertPayload = rows.buildDraftInsert(
      publishedRow ? rows.toUserFields(publishedRow) : {},
      publishedRow?._id as string | undefined,
    );
    const draftRowId = await ctx.db.insert(rows.table, insertPayload as never);
    draftRow = (await ctx.db.get(rows.table, draftRowId)) as Record<string, unknown>;
  }

  const { patch, transformedFields } = await prepareEdit({
    ctx,
    config,
    target,
    action: DRAFT_ACTIONS.saveDraft,
    access: props.access,
    auth: props.auth,
    storedDoc: rows.toUserFields(draftRow) as never,
    incoming: data,
    partial: true,
    validateKeys: "changed",
  });

  await ctx.db.patch(draftRow._id as never, rows.buildDraftPatch(draftRow, patch) as never);

  const previous = await getLatestVersion({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
  });
  const publishedAt =
    (publishedRow?.vex_publishedAt as number | undefined) ??
    (draftRow.vex_publishedAt as number | undefined);

  await createVersion({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    status: VERSION_STATUSES.draft.key,
    snapshot: removeVexFields({ doc: transformedFields }),
    createdBy:
      typeof props.auth?.user?.["_id"] === "string" ? (props.auth.user["_id"] as string) : undefined,
    parentVersion: previous?.version,
    restoredFrom: props.restoredFrom,
    publishedAt,
  });

  return String(draftRow._id);
}
```

#### packages/core/src/api/versions/saveDraft.server.ts

New file, complete.

```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import type { CollectionOrGlobal } from "../../types/utils";
import { resolveVersionedTarget } from "../../versions/resolveVersionedTarget";
import { saveDraftShared } from "../../versions/saveDraft";

/**
 * Server-side args for `saveDraft`. A discriminated union: the
 * `{ collection, id }` member saves a draft for a versioned collection's
 * document, and the `{ global }` member saves a draft for a versioned
 * global — `vex_globals`' one shared table has no per-document id to pass,
 * so the slug alone identifies the target row(s).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type SaveDraftServerArgs<DataModel extends GenericDataModel> = {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
  data: Record<string, unknown>;
  /**
   * The version number this save restores from, when the caller is reverting to
   * an older snapshot (fetched separately via `getVersionSnapshot`, Step 8).
   * Recorded on the emitted `vex_versions` row for lineage; otherwise unused.
   */
  restoredFrom?: number;
} & (
  | {
      /** The versioned collection slug this call targets. */
      collection: CollectionSlug;
      /**
       * The document id the caller currently has loaded — the published row's
       * id on every edit after the first, or a draft row's own id
       * (never-published document, or a draft already active). Both are
       * resolved transparently.
       */
      id: GenericId<CollectionSlug>;
    }
  | {
      /** The versioned global slug this call targets. */
      global: GlobalSlug;
    }
);

/**
 * Patches (or bootstraps) the draft row for a versioned collection's document
 * OR a versioned global, and records a `"draft"`-status history row.
 * Server-side only.
 *
 * One implementation handles both kinds: it resolves the caller's `target`
 * (`{ collection, id }` or `{ global }`) to a {@link CollectionOrGlobal} and a
 * {@link VersionedTargetRows} descriptor (`../../versions/resolveVersionedTarget`),
 * then delegates every bootstrap/merge/patch/history step to
 * `saveDraftShared` (`../../versions/saveDraft`) — the one place that logic
 * lives, for either kind.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, data, restoredFrom? } & ({ collection, id } | { global })`.
 *   `ctx` must be a mutation context.
 * @returns Promise resolving to the draft row's `_id` as a string.
 * @throws {ConvexError} When the collection/global cannot be resolved, or
 *   does not declare `versions.drafts: true`, or (collection only) when `id`
 *   does not resolve to a document.
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
export async function saveDraft<DataModel extends GenericDataModel>(
  args: SaveDraftServerArgs<DataModel>,
): Promise<string> {
  let target: CollectionOrGlobal;

  if ("collection" in args) {
    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }
    if (!collection.versions.drafts) {
      throw new ConvexError(
        `Collection "${args.collection}" does not have drafts enabled — set versions: { drafts: true } to use saveDraft`,
      );
    }
    target = { kind: "collection", config: collection };
    const rows = await resolveVersionedTarget({
      ctx: args.ctx,
      collection: args.collection,
      id: args.id,
    });
    return saveDraftShared({
      ctx: args.ctx,
      config: args.config,
      target,
      access: args.access,
      auth: args.auth,
      data: args.data,
      restoredFrom: args.restoredFrom,
      rows,
    });
  }

  const global = args.config.globals.find((g) => g.slug === args.global);
  if (!global) {
    throw new ConvexError(`No global registered with slug "${args.global}"`);
  }
  if (!global.versions.drafts) {
    throw new ConvexError(
      `Global "${args.global}" does not have drafts enabled — set versions: { drafts: true } to use saveDraft`,
    );
  }
  target = { kind: "global", config: global };
  const rows = await resolveVersionedTarget({ ctx: args.ctx, global: args.global });
  return saveDraftShared({
    ctx: args.ctx,
    config: args.config,
    target,
    access: args.access,
    auth: args.auth,
    data: args.data,
    restoredFrom: args.restoredFrom,
    rows,
  });
}
```

#### packages/core/src/api/versions/saveDraft.client.ts

New file, complete.

```ts
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link saveDraft}. A discriminated union: pass
 * `{ collection, id, data }` for a versioned collection's document, or
 * `{ global, data }` for a versioned global.
 *
 * @example
 * ```tsx
 * import { saveDraft, type SaveDraftClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: saveDraft() });
 * await mutateAsync({ collection: "posts", id: postId, data: { title: "Draft title" } });
 * await mutateAsync({ global: "siteSettings", data: { siteName: "New Name" } });
 * ```
 */
export type SaveDraftClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  GenericMutationClientParams &
    (
      | {
          /** The versioned collection slug. */
          collection: TCollectionSlug;
          /**
           * The document id currently loaded — the published row's id, or an
           * active draft's own id. The server resolves either to the one draft row.
           */
          id: GenericId<TCollectionSlug>;
          /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
          data: Record<string, unknown>;
          /** The version number this save restores from, when reverting to an older snapshot. */
          restoredFrom?: number;
        }
      | {
          /** The versioned global slug. */
          global: GlobalSlug;
          /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
          data: Record<string, unknown>;
        }
    );

/**
 * Returns a `mutationFn` for saving a draft in a VexCMS versioned collection.
 * The mutation resolves to the draft row's id — which differs from the `id`
 * passed in on the first edit of a published document, when the server
 * bootstraps a new draft row.
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
 * @example
 * ```tsx
 * import { saveDraft } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * export function SaveDraftButton({ id, title }: { id: Id<"posts">; title: string }) {
 *   const { mutateAsync, isPending } = useMutation({ mutationFn: saveDraft() });
 *   return (
 *     <button onClick={() => mutateAsync({ collection: "posts", id, data: { title } })}>
 *       {isPending ? "Saving…" : "Save draft"}
 *     </button>
 *   );
 * }
 * ```
 */
export function saveDraft() {
  return useConvexMutation(vexConvexApi.versions.saveDraft);
}
```

#### packages/core/src/api/versions/saveDraft.server.test.ts

New file, complete. Two `describe` blocks: `"saveDraft (server)"` exercises the collection
path against a versioned `posts` fixture, `"saveDraft (server) — global target"` exercises
the global path against a versioned `banner` fixture — both drive the SAME `saveDraft`
entry point, proving `saveDraftShared` is genuinely kind-agnostic rather than two
implementations behind one name.

```ts
import { convexTest } from "convex-test";
import type { GenericId } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { defineCollection, defineGlobal, text } from "../../index";
import { VexAccessError } from "../../access";

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
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const returnedId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      expect(returnedId).not.toBe(publishedId);

      const draftRow = await ctx.db.get("posts", returnedId as GenericId<"posts">);
      expect(draftRow?.vex_status).toBe("draft");
      expect(draftRow?.vex_publishedId).toBe(publishedId);
      expect(draftRow?.title).toBe("Edited");
      expect(draftRow?.slug).toBe("original");

      const publishedRow = await ctx.db.get(publishedId);
      expect(publishedRow?.title).toBe("Original");

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      // v1 is the published baseline recorded at bootstrap; v2 is this save.
      expect(versions.map((v) => [v.version, v.status])).toEqual([
        [1, "published"],
        [2, "draft"],
      ]);
      expect(versions[0]?.snapshot).toMatchObject({ title: "Original" });
      expect(versions[1]?.snapshot).toMatchObject({ title: "Edited", slug: "original" });
    });
  });

  test("repeated saves patch the same draft row — bootstrap fires exactly once", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const firstId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edit one" },
      });
      const secondId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edit two" },
      });

      expect(secondId).toBe(firstId);

      const draftRows = await ctx.db
        .query("posts")
        .withIndex("by_published", (q) => q.eq("vex_publishedId", publishedId))
        .collect();
      expect(draftRows).toHaveLength(1);
      expect(draftRows[0]?.title).toBe("Edit two");

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      expect(versions.filter((v) => v.status === "published")).toHaveLength(1);
      expect(versions.filter((v) => v.status === "draft")).toHaveLength(2);
    });
  });

  test("a row with no vex_status (pre-backfill) is treated as published — repeated saves reuse one draft", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      // Written before `versions.drafts` was enabled: no `vex_status` at all.
      const legacyId = await ctx.db.insert("posts", { title: "Legacy", slug: "legacy" });

      const firstId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: legacyId,
        data: { title: "Edit one" },
      });
      const secondId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: legacyId,
        data: { title: "Edit two" },
      });

      expect(secondId).toBe(firstId);
      const draftRows = await ctx.db
        .query("posts")
        .withIndex("by_published", (q) => q.eq("vex_publishedId", legacyId))
        .collect();
      expect(draftRows).toHaveLength(1);
      const legacyRow = await ctx.db.get("posts", legacyId);
      expect(legacyRow?.title).toBe("Legacy");
    });
  });

  test("saving a never-published document patches it directly — no bootstrap, no second row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const draftId = await ctx.db.insert("posts", {
        title: "",
        slug: "new-post",
        vex_status: "draft",
      });

      const returnedId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId,
        data: { title: "First real content" },
      });

      expect(returnedId).toBe(draftId);

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(draftId)),
        )
        .collect();
      expect(versions.filter((v) => v.status === "draft")).toHaveLength(1);
      expect(versions.filter((v) => v.status === "published")).toHaveLength(0);
    });
  });

  test("a role restricted to one field on update carries the SAME restriction on saveDraft", async () => {
    const t = convexTest(schema, modules);
    const guardedConfig = {
      collections: [versionedPosts],
      access: {
        // `enabled` is required on a hand-built config: `hasPermission` treats a
        // falsy `enabled` as "RBAC off" and allows everything.
        enabled: true,
        roles: ["editor"],
        defaultPermissionMode: "allow",
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: {
            posts: {
              // Mirrors `update.server.test.ts`'s "rejects a save that changes a
              // denied field" regression: only `title` is writable.
              saveDraft: () => ({ "*": false, title: true }),
            },
          },
        },
      },
    } as unknown as VexConfig;
    const auth = { user: { roles: ["editor"] } };

    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const draftId = await saveDraft({
        ctx,
        config: guardedConfig,
        collection: "posts",
        id: publishedId,
        auth,
        data: { title: "ok" },
      });

      let caught: unknown;
      try {
        await saveDraft({
          ctx,
          config: guardedConfig,
          collection: "posts",
          id: draftId as never,
          auth,
          data: { slug: "not-allowed" },
        });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(VexAccessError);
      expect((caught as VexAccessError).field).toBe("slug");

      const draftRow = await ctx.db.get("posts", draftId as GenericId<"posts">);
      expect(draftRow?.slug).toBe("original");
    });
  });

  test("strips reserved version fields from the incoming data payload before merging", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: {
          title: "ok",
          vex_status: "published",
          vex_publishedId: publishedId,
        },
      });

      const draftRow = await ctx.db.get("posts", draftId as GenericId<"posts">);
      expect(draftRow?.vex_status).toBe("draft");
    });
  });

  test("throws before writing anything when the collection does not have drafts enabled", async () => {
    const plainPosts = defineCollection({ slug: "posts", fields: { title: text(), slug: text() } });
    const plainConfig = { collections: [plainPosts] } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const postId = await ctx.db.insert("posts", { title: "Original", slug: "original" });

      await expect(
        saveDraft({
          ctx,
          config: plainConfig,
          collection: "posts",
          id: postId,
          data: { title: "Edited" },
        }),
      ).rejects.toThrow(/drafts enabled/);

      expect(await ctx.db.query("posts").collect()).toHaveLength(1);
      expect(await ctx.db.query("vex_versions").collect()).toHaveLength(0);
    });
  });

  test("every draft history row carries the published row's publishedAt, whichever id the caller holds", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
        vex_publishedAt: 1234,
      });

      // Caller holds the published id — published row already loaded.
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edit one" },
      });
      // Caller holds the draft's own id — published row fetched separately.
      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId as GenericId<"posts">,
        data: { title: "Edit two" },
      });

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      expect(versions.map((v) => [v.status, v.publishedAt])).toEqual([
        ["published", 1234],
        ["draft", 1234],
        ["draft", 1234],
      ]);
    });
  });

  test("a never-published draft's history rows carry no publishedAt", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      const draftId = await ctx.db.insert("posts", {
        title: "New",
        slug: "new",
        vex_status: "draft",
      });

      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId,
        data: { title: "Still new" },
      });

      const [version] = await ctx.db.query("vex_versions").collect();
      expect(version?.publishedAt).toBeUndefined();
    });
  });
});

/**
 * `banner` is a versioned global — `vex_globals` is the shared table every
 * global's rows live in, distinguished by `slug` + `vex_status`, exactly as
 * a versioned collection's own table distinguishes its rows via
 * `vex_status`/`vex_publishedId`. These tests moved here from
 * `api/globals/upsert.server.test.ts` once `upsertGlobal` stopped writing
 * drafts — `saveDraft` is now the only path that writes a global's draft row,
 * for either kind, through the SAME implementation the `posts` tests above exercise.
 */
const versionedBanner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text({ label: "Message", required: true }) },
  versions: { drafts: true },
});

const globalFixtureConfig = { collections: [], globals: [versionedBanner] } as unknown as VexConfig;

describe("saveDraft (server) — global target", () => {
  test("a global with no rows at all gets a draft-only row", async () => {
    const t = convexTest(schema, modules);
    const draftId = await t.run((ctx) =>
      saveDraft({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "Hello" },
      }),
    );

    const rows = await t.run((ctx) => ctx.db.query("vex_globals").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?._id).toBe(draftId);
    expect(rows[0]?.vex_status).toBe("draft");
    expect(rows[0]?.vex_publishedId).toBeUndefined();
    expect(rows[0]?.data).toEqual({ message: "Hello" });

    const versions = await t.run((ctx) => ctx.db.query("vex_versions").collect());
    expect(versions).toHaveLength(1);
    expect(versions[0]?.status).toBe("draft");
    expect(versions[0]?.documentId).toBe("banner");
  });

  test("bootstraps a draft row and snapshots the published state on first edit after publish", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
        vex_publishedAt: 1700000000000,
      }),
    );

    const draftId = await t.run((ctx) =>
      saveDraft({
        ctx,
        config: globalFixtureConfig,
        global: "banner",
        data: { message: "Live, edited" },
      }),
    );

    const rows = await t.run((ctx) => ctx.db.query("vex_globals").collect());
    expect(rows).toHaveLength(2);
    const published = rows.find((r) => r._id === publishedId);
    const draft = rows.find((r) => r._id === draftId);
    expect(published?.data).toEqual({ message: "Live" });
    expect(draft?.vex_status).toBe("draft");
    expect(draft?.vex_publishedId).toBe(publishedId);
    expect(draft?.data).toEqual({ message: "Live, edited" });

    const versions = await t.run((ctx) => ctx.db.query("vex_versions").collect());
    const publishedSnapshot = versions.find((v) => v.status === "published");
    const draftSnapshot = versions.find((v) => v.status === "draft");
    expect(publishedSnapshot?.snapshot).toEqual({ message: "Live" });
    expect(publishedSnapshot?.publishedAt).toBe(1700000000000);
    expect(draftSnapshot?.snapshot).toEqual({ message: "Live, edited" });
    expect(draftSnapshot?.publishedAt).toBe(1700000000000);
  });

  test("repeated saves reuse the one draft row — bootstrap fires exactly once", async () => {
    const t = convexTest(schema, modules);
    const firstDraftId = await t.run((ctx) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "First" } }),
    );
    const secondDraftId = await t.run((ctx) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "Second" } }),
    );

    expect(secondDraftId).toBe(firstDraftId);
    const rows = await t.run((ctx) => ctx.db.query("vex_globals").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data).toEqual({ message: "Second" });
  });

  test("throws before writing anything when the global does not have drafts enabled", async () => {
    const t = convexTest(schema, modules);
    const nonVersionedBanner = defineGlobal({
      slug: "banner",
      label: "Banner",
      fields: { message: text({ label: "Message", required: true }) },
    });
    const config = { collections: [], globals: [nonVersionedBanner] } as unknown as VexConfig;

    await expect(
      t.run((ctx) => saveDraft({ ctx, config, global: "banner", data: { message: "Hi" } })),
    ).rejects.toThrow(/does not have drafts enabled/);
    expect(await t.run((ctx) => ctx.db.query("vex_globals").collect())).toHaveLength(0);
  });

  test("throws when the global slug does not resolve", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx) =>
        saveDraft({
          ctx,
          config: globalFixtureConfig,
          global: "doesNotExist" as never,
          data: { message: "Hi" },
        }),
      ),
    ).rejects.toThrow(/No global registered/);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 6 — Shared write pipeline: global hooks + `prepareEdit` across collections and globals `[dev]`

Why: Step 7 routes `upsertGlobal` through `prepareEdit` (Step 5) so globals get the same `hasPermission → merge → beforeChange → diff → validate → validateFields` pipeline collections have, instead of a third hand-rolled copy. That needs `prepareEdit` to accept a global, and it is cleaner when globals carry the same `beforeChange` hook `prepareEdit` dispatches for collections — so this step gives globals `beforeChange`/`afterChange` first. Nothing here is draft-specific; it is a prerequisite refactor, and Step 7 onward assume it has landed.

Decisions (ADR-014, superseding globals-spec D21 for these pieces):

- **Shared, not mirrored.** D21 kept globals on parallel helper implementations. The schema builder and the write pipeline are now identical logic for both resource kinds, so they become one resource-agnostic implementation: `getFieldsInputSchema` in `fields/utils.ts`, `validateFields({ fields })`, and `prepareEdit({ target })`.
- **Globals get `beforeChange` + `afterChange`, no delete hooks.** A user never deletes a global; the only delete on `vex_globals` is `publish` removing a draft row (Step 9), which is internal bookkeeping.
- **`afterChange` fires for every row write, draft rows included; status is exposed, not filtered.** `newDoc.vex_status` (present on versioned resources) lets the hook decide. Same rule for collections, documented on `AfterChangeProps` — the lifecycle-hooks spec deferred draft-aware hook semantics to this spec.
- **Gap closed as a side effect:** today's `upsertGlobal` never runs field `validate()` hooks, though `FieldValidateProps` already accepts global slugs. Step 7's migration onto `prepareEdit` fixes that.

- [x] `packages/core/src/fields/utils.ts` — new resource-agnostic `getFieldsInputSchema({ fields, partial })`.
- [x] `packages/core/src/fields/utils.ts` + `fields/index.ts` — `validateFields` (moved from `collections/`, takes `fields`), `getFieldsDefaultValues`, `fieldsToFieldTypeMap`; old collection/global copies deleted; callers in `@vexcms/core` and `@vexcms/react` migrated. `@vexcms/react`'s `useCollectionForm.ts`/`useGlobalForm.ts` are later merged into one resource-agnostic `useFieldsForm.ts` (ADR-014) that every caller below imports directly.
- [x] `packages/core/src/globals/hooks.ts` (new) + `globals/types.ts` + `globals/config.ts` + `globals/index.ts` — `beforeChange`/`afterChange` on globals.
- [x] `packages/core/src/collections/hooks.ts` — `AfterChangeProps` documents draft-row semantics.
- [x] `packages/core/src/api/triggers.ts` + `triggers.test.ts` — global `afterChange` via one `vex_globals` trigger dispatching by slug.
- [x] `packages/core/src/api/prepareEdit.ts` + `prepareEdit.test.ts` — tagged `target` (collection | global), `create` action, per-kind `beforeChange`. Callers migrated: `update/server.ts`, `versions/saveDraft.server.ts`.
- [x] `.agent/docs/decisions/ADR-014.md` — supersedes globals-spec D21 for the write pipeline, schema builder, and hooks.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test` — existing `create`/`update`/`saveDraft`/`upsertGlobal`/`useFieldsForm` suites pass unchanged after the caller migrations.

#### packages/core/src/fields/utils.ts

1 edit — new resource-agnostic schema builder, replacing `getCollectionInputSchema` (`collections/utils.ts`) and `getGlobalInputSchema` (`globals/utils.ts`). Both were the same loop over a field map, so the builder lives with the field-level utilities it composes rather than under either resource kind (ADR-014, superseding D21 for this helper). Add `import { z, type ZodType } from "zod";` and `import { adminFieldToInputSchema } from "./inputSchemas";`.

````ts
/**
 * Builds the Zod input schema for a field map — a collection's or a
 * global's `fields`. Hidden fields are skipped.
 *
 * @param props.fields - The resource's resolved field map.
 * @param props.partial - When true, every field becomes optional
 *   (`update`/`saveDraft`'s lenient mode); omit for strict, full-schema
 *   validation (`create`, `publish` — decision 4).
 * @returns The object schema.
 *
 * @example
 * ```ts
 * const schema = getFieldsInputSchema({ fields: posts.fields, partial: true });
 * ```
 */
export function getFieldsInputSchema(props: {
  fields: Record<string, AdminField>;
  partial?: boolean;
}) {
  const res: Record<string, ZodType> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.fields)) {
    if (fieldDef.admin.hidden) continue;
    res[fieldKey] = adminFieldToInputSchema({ field: fieldDef });
  }
  const schema = z.object({ ...res });
  return props.partial ? schema.partial() : schema;
}
````

Export it from the `fields` barrel beside `adminFieldToInputSchema`.

#### packages/core/src/fields/utils.ts — field-level helpers moved out of `collections/` and `globals/`

Everything that operates on a field map alone, without caring whether the map belongs to a collection or a global, lives in `fields/utils.ts` and is exported from `fields/index.ts` (ADR-014). Future consumers that carry fields without being either resource kind (adapters, plugins) then import from `fields` directly. Reviewed the whole `collections/` folder for this; four helpers qualify:

| Moved helper                   | Replaces                                                       | Why it qualifies                                                |
| ------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------- |
| `getFieldsInputSchema` (above) | `getCollectionInputSchema`, `getGlobalInputSchema`             | same loop over `fields`                                         |
| `validateFields`               | `collections/validateFields.ts`                                | reads only `fields`; globals need it (`prepareEdit`)            |
| `getFieldsDefaultValues`       | `getCollectionDefaultValues`, `getGlobalDefaultValues`         | byte-identical loops over `fields`                              |
| `fieldsToFieldTypeMap`         | `collectionConfigToFieldTypeMap`, `globalConfigToFieldTypeMap` | identical reduce over `fields`; only the map key (slug) differs |

Stays in `collections/` (and why):

- `defineCollection`, `types.ts`, `constants.ts`, `hooks.ts` — collection identity, not field logic.
- `validator.ts` (`collectionConfigToVexSchema`, `getIncomingRelationships`) and `indexFields.ts` — about a collection's Convex TABLE (indexes, search indexes, inbound relationships); globals have no table.
- `collectionConfigToInterface` — shares field-line rendering with `globalConfigToInterface`, but the two have diverged (collections emit a qualified union alias per `select` field; globals don't). Extracting a shared body would change generated global types, so it's not a mechanical move — left for a dedicated change.
- `slugToPascalCase` (`collections/utils.ts`) — imported by `globals/config.ts` and `fields/blocks/config.ts` too, so it's misplaced, but it's a string utility, not a field helper; out of scope here.

Add to `fields/utils.ts` (beside `getFieldsInputSchema`). New imports: `import { ConvexError, type Value } from "convex/values";`, `import { createVexCallbackApi, type VexCallbackApi } from "../api/server";`, `import type { VexConfig } from "../config";`, `import type { TDocument } from "../api/convex";`, `import type { VexMutationCtx } from "../types/generated";` (`AdminField` is already imported). The `../api/server` import is the same edge `collections/validateFields.ts` already has today — moving it doesn't add a cycle.

````ts
/**
 * Builds TanStack Form `defaultValues` from a field map — a collection's or a
 * global's `fields`. Hidden fields are skipped. With `document` (edit mode),
 * a truthy stored value wins; otherwise each field's `defaultValue`.
 *
 * @param props.fields - The resource's resolved field map.
 * @param props.document - Optional stored document (edit mode); `null`/omitted = create mode.
 * @returns One key per visible field.
 *
 * @example
 * ```ts
 * getFieldsDefaultValues({ fields: posts.fields })              // → { title: "", slug: "" }
 * getFieldsDefaultValues({ fields: posts.fields, document: doc }) // → { title: "Hello", slug: "hello" }
 * ```
 */
export function getFieldsDefaultValues(props: {
  fields: Record<string, AdminField>;
  document?: TDocument | Record<string, unknown> | null;
}) {
  const res: Record<string, unknown> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.fields)) {
    if (fieldDef.admin.hidden) continue;
    if (props.document && Boolean(props.document[fieldKey])) {
      res[fieldKey] = props.document[fieldKey];
    } else {
      res[fieldKey] = fieldDef.defaultValue;
    }
  }
  return res;
}

/**
 * Renders one `CollectionsFieldTypeMap` / `GlobalsFieldTypeMap` entry for the
 * generated `declare module '@vexcms/core'` block: each field type present,
 * mapped to the union of field keys of that type.
 *
 * No synthetic `id: "_id"` entry: this is a field-TYPE index, and `_id` is not
 * a field type (access helpers derive field names from the document itself).
 *
 * @param props.key - The map key — the collection or global slug.
 * @param props.fields - The resource's resolved field map.
 * @returns TypeScript source for one entry, without wrapping braces.
 *
 * @example
 * ```ts
 * fieldsToFieldTypeMap({ key: "posts", fields: posts.fields });
 * // → '\tposts: {\n\t\ttext: "title"\n\t\trelationship: "author"\n\t}'
 * ```
 */
export function fieldsToFieldTypeMap(props: {
  key: string;
  fields: Record<string, AdminField>;
}): string {
  const byType = Object.entries(props.fields).reduce<Record<string, string[]>>(
    (acc, [fieldKey, field]) => {
      (acc[field.type] ??= []).push(`"${fieldKey}"`);
      return acc;
    },
    {},
  );
  const body = Object.entries(byType)
    .map(([fieldType, keys]) => `\t\t${fieldType}: ${keys.join(" | ")}\n`)
    .join("");
  return `\t${props.key}: {\n${body}\t}`;
}

/**
 * Runs each changed field's `validate()` against the merged document, skipping
 * fields whose key isn't in `keys` (unchanged on `update`, every field on
 * `create`) or that don't define `validate`.
 *
 * A field reports failure by **throwing**, not by returning a message: a
 * thrown error carries a stack, can be a project's own error subclass, and can
 * attach arbitrary structured data through `ConvexError`. A returned string
 * could carry none of that, and made the success path (`return undefined`)
 * easy to hit by accident.
 *
 * Whatever a field throws is re-thrown as a `ConvexError` carrying the field
 * key, so the admin panel can attribute the failure to one input. A
 * `ConvexError`'s own `data` is preserved verbatim — an object payload is
 * merged with `field`, a plain-string payload becomes `message` — so a project
 * can surface codes or hints of its own.
 *
 * @param props - The resource's field map (a collection's or a global's), resolved document, changed field keys, mutation
 *   ctx, and resolved config (needed to build the `vex` api each callback receives).
 * @returns Nothing; resolves once every applicable field's `validate()` has passed.
 * @throws {ConvexError} With `{ field, message, ... }` for the first field that throws.
 */
export async function validateFields(props: {
  fields: Record<string, AdminField>;
  doc: Record<string, unknown>;
  keys: Iterable<string>;
  ctx: VexMutationCtx;
  config: VexConfig;
}): Promise<void> {
  const keys = new Set(props.keys);
  // Built once per write, not per field: it closes over nothing field-specific.
  const vex = createVexCallbackApi({ ctx: props.ctx, config: props.config });
  for (const [fieldKey, field] of Object.entries(props.fields)) {
    if (!keys.has(fieldKey) || !field.validate) continue;
    const validate = field.validate as unknown as (props: {
      value: unknown;
      doc: Record<string, unknown>;
      fieldKey: string;
      field: unknown;
      ctx: VexMutationCtx;
      vex: VexCallbackApi;
    }) => Promise<void> | void;

    try {
      await validate({
        value: props.doc[fieldKey],
        doc: props.doc,
        fieldKey,
        field,
        ctx: props.ctx,
        vex,
      });
    } catch (thrown) {
      throw toFieldValidationError({ thrown, fieldKey });
    }
  }
}

/**
 * Normalises whatever a field's `validate()` threw into one `ConvexError`
 * shape, so every consumer reads the failure the same way regardless of what
 * the project chose to throw.
 *
 * @param props.thrown - The value the field threw.
 * @param props.fieldKey - The field that rejected the write.
 * @returns A `ConvexError` whose data always carries `field` and `message`.
 */
function toFieldValidationError(props: {
  thrown: unknown;
  fieldKey: string;
}): ConvexError<Value> {
  const { thrown, fieldKey } = props;

  if (thrown instanceof ConvexError) {
    const data = thrown.data as unknown;
    return new ConvexError(
      typeof data === "object" && data !== null
        ? ({ message: "Validation failed", ...data, field: fieldKey } as Value)
        : { message: String(data), field: fieldKey },
    );
  }

  return new ConvexError({
    message: thrown instanceof Error ? thrown.message : String(thrown),
    field: fieldKey,
  });
}
````

`fieldsToFieldTypeMap` emits the collection variant's exact output; the global variant's output was the same string (it joined with `"\n"` and appended `"\n"` before `\t}`), so generated types are unchanged — the existing `generateVexTypes.test.ts` expectations are the guard.

#### packages/core/src/fields/index.ts

No edit — it already has `export * from "./utils";`, so all four helpers are exported from `fields/index.ts` (and from `@vexcms/core` through the root barrel) as soon as they land in `fields/utils.ts`.

#### Deletions and caller migrations

- Delete `collections/validateFields.ts` and move `collections/validateFields.test.ts` to `fields/validateFields.test.ts`, updating its import to `./utils` and its `collection:` arg to `fields: <collection>.fields`. Remove `export * from "./validateFields";` from `collections/index.ts`.
- Delete `getCollectionInputSchema` + `getCollectionDefaultValues` (`collections/utils.ts`) and `getGlobalInputSchema` + `getGlobalDefaultValues` (`globals/utils.ts`; drop it from `globals/index.ts`'s named export). Remove now-unused imports. If `globals/utils.ts` is left empty, delete it.
- Delete `collectionConfigToFieldTypeMap` (`collections/interfaceGen.ts`) and `globalConfigToFieldTypeMap` (`globals/interfaceGen.ts`; drop from `globals/index.ts`).
- Callers (verify with LSP references before editing):
  - `api/create/server.ts`, `api/prepareEdit.ts` → `import { getFieldsInputSchema, validateFields } from "../fields"` (`../../fields` from `create/`); calls shown in "Migrated call sites" below.
  - `api/globals/upsert.server.ts` → `getFieldsInputSchema` from `../../fields`.
  - `types/generateVexTypes.ts`:
    ```ts
    .map((c) => fieldsToFieldTypeMap({ key: c.slug, fields: c.fields }))
    ```
    ```ts
    .map((g) => fieldsToFieldTypeMap({ key: g.slug, fields: g.fields }))
    ```
  - `@vexcms/react`'s `useFieldsForm.ts` (the later merge of `useCollectionForm.ts`/`useGlobalForm.ts`, ADR-014) → `getFieldsDefaultValues({ fields: props.fields, document })`; plus `context/LivePreviewContext.tsx` → `getFieldsInputSchema` (below).
  - Comment references to `collections/validateFields.ts` (`react/src/lib/errors.ts`, `api/server.ts`, `collections/hooks.ts`, `collections/config.ts`'s `getCollectionDefaultValues` mention) → update to the new names/paths.

#### packages/core/src/globals/hooks.ts

New file. Globals get `beforeChange` and `afterChange` — no delete hooks: a user never deletes a global, and the only delete on `vex_globals` is `publish` removing a draft row (Step 9), which is internal bookkeeping, not a lifecycle event (ADR-014). Mirrors `collections/hooks.ts`'s shape and its per-method `TDataModel` generic (see that file's `CollectionHooksInput` docstring for why).

```ts
import type { GenericDataModel } from "convex/server";
import type { DocumentByGlobalSlug, GlobalSlug } from "../types/generated";
import type { BaseHookProps } from "../hooks";
import type { GlobalConfig } from "./types";

/** Arguments passed to a global's `beforeChange` hook. */
export interface GlobalBeforeChangeProps<
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
> extends BaseHookProps<TDataModel> {
  /** `"create"` on the global's first-ever save, `"update"` afterwards. */
  operation: "create" | "update";
  /** The merged user fields about to be validated and written. Return the (possibly transformed) document. */
  doc: DocumentByGlobalSlug<TGlobalSlug>;
  /** The resolved config of the global this write is running on. */
  global: GlobalConfig<{}, {}, TGlobalSlug>;
}

/**
 * Arguments passed to a global's `afterChange` hook.
 *
 * Fires for EVERY `vex_globals` row write of this global, draft rows
 * included — `newDoc.vex_status` (present when the global declares
 * `versions.drafts: true`) tells a draft save from a publish. `operation`
 * describes the ROW: the first Save Draft after a publish inserts a new
 * draft row, so it arrives as `"create"` even though the global existed.
 */
export interface GlobalAfterChangeProps<
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
> extends BaseHookProps<TDataModel> {
  operation: "create" | "update";
  /** The written `vex_globals` row's `_id`. */
  id: string;
  /** Flat document before the write (`flattenGlobalRow`), or `null` on insert. */
  oldDoc: DocumentByGlobalSlug<TGlobalSlug> | null;
  /** Flat document after the write (`flattenGlobalRow`). */
  newDoc: DocumentByGlobalSlug<TGlobalSlug>;
  /** The resolved config of the global this write ran on. */
  global: GlobalConfig<{}, {}, TGlobalSlug>;
}

/**
 * Lifecycle hooks for a global. `beforeChange` runs inline in the write
 * path (`prepareEdit`) and may reject by throwing. `afterChange` runs via
 * `convex-helpers` triggers after the write commits, through the builder
 * returned by `createVexMutations` — never for writes made through the raw
 * `_generated/server` builder, the dashboard, or `npx convex import`.
 */
export interface GlobalHooksInput<TGlobalSlug extends GlobalSlug = GlobalSlug> {
  beforeChange?<TDataModel extends GenericDataModel = GenericDataModel>(
    props: GlobalBeforeChangeProps<TGlobalSlug, TDataModel>,
  ):
    | Promise<DocumentByGlobalSlug<TGlobalSlug>>
    | DocumentByGlobalSlug<TGlobalSlug>;
  afterChange?<TDataModel extends GenericDataModel = GenericDataModel>(
    props: GlobalAfterChangeProps<TGlobalSlug, TDataModel>,
  ): Promise<void> | void;
}

/** Resolved lifecycle hooks for a global, after defaults are applied. */
export type GlobalHooks<TGlobalSlug extends GlobalSlug = GlobalSlug> =
  GlobalHooksInput<TGlobalSlug>;

/**
 * Types a global's `beforeChange` hook against a real global and
 * `DataModel`. Mirrors `beforeChangeHook` (`collections/hooks.ts`).
 *
 * @param slug - The global slug constant (e.g. `GLOBAL_SLUG_SITE_SETTINGS`).
 * @param fn - The hook function, checked against the real types.
 * @returns The same function, re-typed to the global's `hooks.beforeChange` signature.
 */
export function globalBeforeChangeHook<
  TGlobalSlug extends GlobalSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TGlobalSlug,
  fn: (
    props: GlobalBeforeChangeProps<TGlobalSlug, TDataModel>,
  ) =>
    | Promise<DocumentByGlobalSlug<TGlobalSlug>>
    | DocumentByGlobalSlug<TGlobalSlug>,
): GlobalHooksInput<TGlobalSlug>["beforeChange"] {
  void slug;
  return fn as unknown as GlobalHooksInput<TGlobalSlug>["beforeChange"];
}

/**
 * Types a global's `afterChange` hook against a real global and
 * `DataModel`. Mirrors `afterChangeHook` (`collections/hooks.ts`).
 *
 * @param slug - The global slug constant.
 * @param fn - The hook function, checked against the real types.
 * @returns The same function, re-typed to the global's `hooks.afterChange` signature.
 */
export function globalAfterChangeHook<
  TGlobalSlug extends GlobalSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TGlobalSlug,
  fn: (
    props: GlobalAfterChangeProps<TGlobalSlug, TDataModel>,
  ) => Promise<void> | void,
): GlobalHooksInput<TGlobalSlug>["afterChange"] {
  void slug;
  return fn as unknown as GlobalHooksInput<TGlobalSlug>["afterChange"];
}
```

Export from `globals/index.ts`: `export * from "./hooks";`.

#### packages/core/src/globals/types.ts

2 edits, mirroring `CollectionConfigInput`/`CollectionConfig`:

```ts
  // GlobalConfigInput, beside `fields`:
  /** Lifecycle hooks for this global. */
  hooks?: GlobalHooksInput<TGlobalSlug & GlobalSlug>;
```

```ts
// GlobalConfig, beside `fields`:
/** Resolved lifecycle hooks. Always present; defaults to `{}`. */
hooks: GlobalHooks<TGlobalSlug>;
```

Add `import type { GlobalHooks, GlobalHooksInput } from "./hooks";`. Use whatever slug-narrowing form `CollectionConfigInput.hooks` uses for its own `string`-widened `TCollectionSlug` — copy it, don't invent a second pattern.

#### packages/core/src/globals/config.ts

1 edit — default `hooks` in `defineGlobal`'s return, same as `defineCollection` (`collections/config.ts`):

```ts
    hooks: (input.hooks ?? {}) as GlobalHooks<TGlobalSlug>,
```

#### packages/core/src/collections/hooks.ts

1 edit — documentation only. `AfterChangeProps`'s JSDoc gains the draft semantics this spec owns (the lifecycle-hooks spec deferred "draft/version-aware hook semantics" here):

```ts
/**
 * Arguments passed to a collection's `afterChange` hook.
 *
 * On a versioned collection (`versions.drafts: true`) this fires for EVERY
 * row write, draft rows included — `saveDraft`'s bootstrap insert and
 * patches, `publish`'s promotion, `unpublish`'s status flip. `newDoc.vex_status`
 * tells them apart; the hook decides what it cares about. `operation`
 * describes the ROW (a bootstrapped draft row is `"create"`). `publish`
 * deleting a draft row fires `afterDelete` with that row as `oldDoc` — check
 * `oldDoc.vex_status === "draft"` to ignore it.
 */
```

#### packages/core/src/api/triggers.ts

1 edit — after the collections loop, register one trigger on the shared `vex_globals` table when any global declares `afterChange`, dispatching by the row's `slug`. Add `import { flattenGlobalRow } from "./globals/utils";`.

```ts
import type {
  FunctionVisibility,
  GenericDataModel,
  MutationBuilder,
} from "convex/server";
import { Triggers } from "convex-helpers/server/triggers";
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions";
import type { VexConfig } from "../config";
import { flattenGlobalRow } from "./globals/utils";

export function createVexMutations<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(props: {
  config: VexConfig;
  mutation: MutationBuilder<DataModel, Visibility>;
  internalMutation: MutationBuilder<DataModel, "internal">;
}): {
  mutation: MutationBuilder<DataModel, Visibility>;
  internalMutation: MutationBuilder<DataModel, "internal">;
} {
  const triggers = new Triggers<DataModel>();

  for (const collection of props.config.collections) {
    const { afterChange, afterDelete } = collection.hooks;
    if (!afterChange && !afterDelete) continue;

    triggers.register(collection.slug as never, async (ctx, change) => {
      if (change.operation === "delete") {
        await afterDelete?.({
          id: change.id as never,
          oldDoc: change.oldDoc as never,
          collection,
          ctx,
        });
        return;
      }
      await afterChange?.({
        operation: change.operation === "insert" ? "create" : "update",
        id: change.id as never,
        oldDoc: (change.oldDoc ?? null) as never,
        newDoc: change.newDoc as never,
        collection,
        ctx,
      });
    });
  }

  // One shared `vex_globals` trigger, dispatching by `newDoc.slug`, registered
  // only when at least one global actually declares `afterChange` — a global
  // has no delete hook, so a `"delete"` change (always `publish` removing a
  // draft row, Step 9) is always skipped.
  const globalsWithAfterChange = props.config.globals.filter(
    (g) => g.hooks.afterChange,
  );
  if (globalsWithAfterChange.length > 0) {
    triggers.register("vex_globals" as never, async (ctx, change) => {
      if (change.operation === "delete") return;
      const global = globalsWithAfterChange.find(
        (g) => g.slug === change.newDoc.slug,
      );
      if (!global) return;
      await global.hooks.afterChange!({
        operation: change.operation === "insert" ? "create" : "update",
        id: change.id as string,
        oldDoc: change.oldDoc ? flattenGlobalRow(change.oldDoc) : null,
        newDoc: flattenGlobalRow(change.newDoc),
        global,
        ctx,
      } as never);
    });
  }

  return {
    mutation: customMutation(
      props.mutation,
      customCtx(triggers.wrapDB),
    ) as MutationBuilder<DataModel, Visibility>,
    internalMutation: customMutation(
      props.internalMutation,
      customCtx(triggers.wrapDB),
    ) as MutationBuilder<DataModel, "internal">,
  };
}
```

Update `createVexMutations`' JSDoc: "fire each written collection's `afterChange`/`afterDelete` hooks and each written global's `afterChange` hook".

#### packages/core/src/api/prepareEdit.ts

Existing file (Step 5); 3 edits.

**1 — `PrepareEditProps.collection` becomes a tagged `target`.** Each kind's `beforeChange` takes a differently-named config prop (`collection` vs `global`), so the call needs a real discriminant rather than shape-sniffing:

```ts
  /** The collection or global this write targets. `config.slug` is the permission resource. */
  target:
    | { kind: "collection"; config: CollectionConfig }
    | { kind: "global"; config: GlobalConfig };
```

Update every caller: `update/server.ts`, `versions/saveDraft.server.ts`, `prepareEdit.test.ts` pass `target: { kind: "collection", config: collection }`.

**2 — `action` gains `create`.** A non-versioned global's first save authorizes as `create` (unchanged `upsertGlobal` semantics):

```ts
  action:
    | typeof CRUD_ACTIONS.create
    | typeof CRUD_ACTIONS.update
    | typeof DRAFT_ACTIONS.saveDraft
    | typeof DRAFT_ACTIONS.publish;
```

**3 — body.** `resource: props.target.config.slug` in the `resolveAccessCall` call. `beforeChange` dispatches per kind; schema and field validation go through the resource-agnostic helpers:

```ts
const operation = props.action === CRUD_ACTIONS.create ? "create" : "update";
let transformedFields = mergedFields;
if (
  props.target.kind === "collection" &&
  props.target.config.hooks.beforeChange
) {
  transformedFields = await props.target.config.hooks.beforeChange({
    operation,
    doc: mergedFields,
    ctx: props.ctx,
    collection: props.target.config,
  });
} else if (
  props.target.kind === "global" &&
  props.target.config.hooks.beforeChange
) {
  transformedFields = await props.target.config.hooks.beforeChange({
    operation,
    doc: mergedFields as never,
    ctx: props.ctx,
    global: props.target.config,
  });
}
```

```ts
const parsed = getFieldsInputSchema({
  fields: props.target.config.fields,
  partial: props.partial,
}).safeParse(transformedFields);
```

```ts
await validateFields({
  fields: props.target.config.fields,
  doc: transformedFields,
  keys: writeKeys,
  ctx: toVexMutationCtx(props.ctx),
  config: props.config,
});
```

Caller contract (document on `storedDoc`'s JSDoc): pass USER fields plus `_id`/`_creationTime` only — never system columns. `prepareEdit` strips just `_id`/`_creationTime` before merging, and in `validateKeys: "all"` mode `patch` carries every merged key, so a stored doc carrying `vex_*`/`_slug` would leak them into the write. Collections already satisfy this via `extractUserFields`; globals pass `{ _id, _creationTime, ...row.data }`. A consequence worth stating in the same JSDoc: `beforeChange` therefore sees user fields only — no `vex_status` — on every path.

**Complete `prepareEdit.ts` after all three edits:**

```ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { CollectionConfig } from "../collections/types";
import type { GlobalConfig } from "../globals/types";
import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "./types";
import type { TDocument } from "./convex";
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission } from "../access";
import { getFieldsInputSchema, validateFields } from "../fields";
import { deepEqual, resolveAccessCall, toVexMutationCtx } from "./utils";

/**
 * Args for {@link prepareEdit}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface PrepareEditProps<DataModel extends GenericDataModel> {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /**
   * The resolved `VexConfig`. Required: `validateFields` needs it to build the
   * `vex` api each field `validate()` receives. The permission check still
   * skips itself when `config.access` is unset (RBAC off).
   */
  config: VexConfig;
  /** The collection or global this write targets. `config.slug` is the permission resource. */
  target:
    | { kind: "collection"; config: CollectionConfig }
    | { kind: "global"; config: GlobalConfig };
  /** The permission action this write checks under. */
  action:
    | typeof CRUD_ACTIONS.create
    | typeof CRUD_ACTIONS.update
    | typeof DRAFT_ACTIONS.saveDraft
    | typeof DRAFT_ACTIONS.publish;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /**
   * The document to authorize against and merge onto — the CURRENT state of
   * whichever row this write is really targeting (the draft row for
   * `saveDraft`/`publish`, the row `args.id` names for `update`). `undefined`
   * only for a brand-new document with no prior state to merge onto.
   *
   * Caller contract: USER fields plus `_id`/`_creationTime` only — never
   * system columns. `prepareEdit` strips just `_id`/`_creationTime` before
   * merging, and in `validateKeys: "all"` mode `patch` carries every merged
   * key, so a stored doc carrying `vex_*`/`_slug` would leak them into the
   * write. Collections already satisfy this via `extractUserFields`; globals
   * pass `{ _id, _creationTime, ...row.data }`. A consequence of this
   * contract: `beforeChange` sees user fields only — no `vex_status` — on
   * every path.
   */
  storedDoc: TDocument | undefined;
  /** The caller's raw incoming payload — what `hasPermission`'s `changes` argument checks. */
  incoming: Partial<TDocument>;
  /** `true` for lenient validation (`update`, `saveDraft` — a draft may be incomplete); `false` for strict, `create`-strength validation (`publish`). */
  partial: boolean;
  /** Which fields get their `validate()` hook run: only what changed (`update`, `saveDraft`), or every field (`publish`, matching `create`). */
  validateKeys: "changed" | "all";
}

/** Result of {@link prepareEdit}. */
export interface PrepareEditResult {
  /** The full document after merge + `beforeChange`, already validated. */
  transformedFields: TDocument;
  /** Keys whose value actually changed, relative to the pre-`beforeChange` merge. */
  changedKeys: Set<string>;
  /**
   * The fields to write: only `changedKeys`' values when `validateKeys` is
   * `"changed"`, or the full `transformedFields` when it is `"all"` — `publish`
   * always writes every field, matching `create`'s "write everything" shape.
   */
  patch: Record<string, unknown>;
}

/**
 * Runs the write pipeline every field-mutating operation shares —
 * `hasPermission → merge → beforeChange → diff → validate → validateFields` —
 * and returns the prepared fields for the caller to write however its own
 * targeting requires. Does NOT touch `ctx.db`, call `createVersion`, or stamp
 * `updatedAt` — those steps differ per caller and stay in
 * `create()`/`update()`/`saveDraft()`/`publish()`/`upsertGlobal()` themselves.
 *
 * @typeParam DataModel - Convex data model (inferred from `props.ctx`).
 * @param props - See {@link PrepareEditProps}.
 * @returns See {@link PrepareEditResult}.
 * @throws {ConvexError} When Zod validation fails — `{ message, errors }`, naming
 *   every invalid/missing field.
 * @throws {VexAccessError} When the caller is not permitted to make this write.
 */
export async function prepareEdit<DataModel extends GenericDataModel>(
  props: PrepareEditProps<DataModel>,
): Promise<PrepareEditResult> {
  if (props.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: props.action,
      resource: props.target.config.slug,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: props.auth?.user ?? null,
      organization: props.auth?.organization,
      resource,
      action,
      data: props.storedDoc,
      changes: props.incoming,
    });
  }

  const { _id, _creationTime, ...fields } = props.storedDoc ?? {};
  const mergedFields = { ...fields, ...props.incoming } as TDocument;

  const operation = props.action === CRUD_ACTIONS.create ? "create" : "update";
  let transformedFields = mergedFields;
  if (
    props.target.kind === "collection" &&
    props.target.config.hooks.beforeChange
  ) {
    transformedFields = await props.target.config.hooks.beforeChange({
      operation,
      doc: mergedFields,
      ctx: props.ctx,
      collection: props.target.config,
    });
  } else if (
    props.target.kind === "global" &&
    props.target.config.hooks.beforeChange
  ) {
    transformedFields = await props.target.config.hooks.beforeChange({
      operation,
      doc: mergedFields as never,
      ctx: props.ctx,
      global: props.target.config,
    });
  }

  const changedKeys = new Set(Object.keys(props.incoming));
  for (const key of Object.keys(transformedFields)) {
    if (!deepEqual(transformedFields[key], mergedFields[key]))
      changedKeys.add(key);
  }

  const parsed = getFieldsInputSchema({
    fields: props.target.config.fields,
    partial: props.partial,
  }).safeParse(transformedFields);
  if (!parsed.success) {
    throw new ConvexError({
      message: "Validation failed",
      errors: parsed.error.message,
    });
  }

  const writeKeys =
    props.validateKeys === "all"
      ? new Set(Object.keys(transformedFields))
      : changedKeys;
  await validateFields({
    fields: props.target.config.fields,
    doc: transformedFields,
    keys: writeKeys,
    ctx: toVexMutationCtx(props.ctx),
    config: props.config,
  });

  const patch: Record<string, unknown> = {};
  for (const key of writeKeys) patch[key] = transformedFields[key];

  return { transformedFields, changedKeys, patch };
}
```

#### Migrated call sites

`update/server.ts` — `collection` prop becomes the tagged `target`:

```ts
const { patch } = await prepareEdit({
  ctx: args.ctx,
  config: args.config,
  target: { kind: "collection", config: collection },
  action: CRUD_ACTIONS.update,
  access: args.access,
  auth: args.auth,
  storedDoc: (doc ?? undefined) as TDocument | undefined,
  incoming: args.data as Partial<TDocument>,
  partial: true,
  validateKeys: "changed",
});
```

`versions/saveDraft.server.ts` — same shape:

```ts
const { patch, transformedFields } = await prepareEdit({
  ctx: args.ctx,
  config: args.config,
  target: { kind: "collection", config: collection },
  action: DRAFT_ACTIONS.saveDraft,
  access: args.access,
  auth: args.auth,
  storedDoc: extractUserFields({ doc: draftRow as never }) as never,
  incoming: data,
  partial: true,
  validateKeys: "changed",
});
```

`create/server.ts` — keeps its own pipeline (it does not go through `prepareEdit`); only its schema and `validateFields` calls migrate to the resource-agnostic helpers:

```ts
import { getFieldsInputSchema, validateFields } from "../../fields";
```

```ts
const parsed = getFieldsInputSchema({ fields: collection.fields }).safeParse(
  doc,
);
if (!parsed.success) {
  throw new ConvexError({
    message: "Validation failed",
    errors: parsed.error.message,
  });
}

await validateFields({
  fields: collection.fields,
  doc,
  keys: Object.keys(doc),
  ctx: toVexMutationCtx(args.ctx),
  config: args.config,
});
```

`globals/upsert.server.ts` — `getGlobalInputSchema` import becomes `getFieldsInputSchema`:

```ts
import { getFieldsInputSchema } from "../../fields";
```

```ts
// Validate against field config's Zod schema
const schema = getFieldsInputSchema({ fields: globalConfig.fields });
```

`@vexcms/react`'s `useFieldsForm.ts` — the later ADR-014 merge of `useCollectionForm.ts`/`useGlobalForm.ts` into one resource-agnostic hook (Steps 8/10/12/19's views call it with `fields: collection.fields` or `fields: global.fields`):

```ts
import {
  type AdminField,
  getFieldsDefaultValues,
  getFieldsInputSchema,
  type TDocument,
} from "@vexcms/core";
```

```ts
      getFieldsDefaultValues({ fields: props.fields, document }),
```

```ts
const schema = pickReadableSchema(
  getFieldsInputSchema({ fields: props.fields }),
  readableFieldKeys,
);
```

`@vexcms/react`'s `LivePreviewContext.tsx` (live-preview overlay validation):

```ts
const parsedValues = targetCollection
  ? getFieldsInputSchema({
      fields: targetCollection.fields,
      partial: true,
    }).safeParse(data.values)
  : targetGlobal
    ? getFieldsInputSchema({
        fields: targetGlobal.fields,
        partial: true,
      }).safeParse(data.values)
    : undefined;
```

Only the two builder calls change; the global arm's trailing `.partial()` folds into `partial: true`.

#### packages/core/src/api/prepareEdit.test.ts

Append. Fixture: a `defineGlobal` whose `beforeChange` upper-cases `title`, and whose `title.validate` throws on `"BAD"` — `validate()` runs on the post-`beforeChange` document, so incoming `"bad"` arrives as `"BAD"`. Add `GenericMutationCtx` to the existing `convex/server` type import and `defineGlobal` to the `../index` import if not already present.

```ts
const siteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: {
    title: text({
      validate: ({ value }) => {
        if (value === "BAD") throw new Error('title cannot be "BAD"');
      },
    }),
  },
  hooks: {
    beforeChange: ({ doc }) => ({
      ...doc,
      title:
        typeof doc.title === "string" ? doc.title.toUpperCase() : doc.title,
    }),
  },
});

const globalFixtureConfig = {
  collections: [],
  globals: [siteSettings],
} as unknown as VexConfig;

describe("prepareEdit — global targets", () => {
  test("a global target's beforeChange transform lands in transformedFields AND changedKeys", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const result = await prepareEdit({
        ctx,
        config: globalFixtureConfig,
        target: { kind: "global", config: siteSettings },
        action: CRUD_ACTIONS.create,
        storedDoc: undefined,
        incoming: { title: "hello" },
        partial: false,
        validateKeys: "all",
      });
      expect(result.transformedFields).toMatchObject({ title: "HELLO" });
      expect(result.changedKeys.has("title")).toBe(true);
    });
  });

  test('operation is "create" when action is CRUD_ACTIONS.create, "update" otherwise', async () => {
    const seenOperations: string[] = [];
    const recordingGlobal = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { title: text() },
      hooks: {
        beforeChange: ({ doc, operation }) => {
          seenOperations.push(operation);
          return doc;
        },
      },
    });
    const config = {
      collections: [],
      globals: [recordingGlobal],
    } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await prepareEdit({
        ctx,
        config,
        target: { kind: "global", config: recordingGlobal },
        action: CRUD_ACTIONS.create,
        storedDoc: undefined,
        incoming: { title: "a" },
        partial: false,
        validateKeys: "all",
      });
      await prepareEdit({
        ctx,
        config,
        target: { kind: "global", config: recordingGlobal },
        action: CRUD_ACTIONS.update,
        storedDoc: { title: "a" } as never,
        incoming: { title: "b" },
        partial: true,
        validateKeys: "changed",
      });
    });
    expect(seenOperations).toEqual(["create", "update"]);
  });

  test("a global field's validate() rejection surfaces as ConvexError({ field, message }) — the gap upsertGlobal had", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      let caught: unknown;
      try {
        await prepareEdit({
          ctx,
          config: globalFixtureConfig,
          target: { kind: "global", config: siteSettings },
          action: CRUD_ACTIONS.create,
          storedDoc: undefined,
          // `beforeChange` runs before `validate()` — `prepareEdit` validates
          // `transformedFields`, the POST-`beforeChange` document — so the
          // fixture's `validate` must check the UPPERCASED value "bad" becomes.
          incoming: { title: "bad" },
          partial: false,
          validateKeys: "all",
        });
      } catch (thrown) {
        caught = thrown;
      }
      expect(caught).toBeInstanceOf(ConvexError);
      expect(
        (caught as ConvexError<{ field: string; message: string }>).data,
      ).toMatchObject({
        field: "title",
      });
    });
  });
});
```

#### packages/core/src/api/triggers.test.ts

Append. Add `GenericMutationCtx` to the existing `convex/server` type import; the file's existing `rawBuilder` identity builder is reused (needs `convexTest`, the shared fixture `schema`/`modules`, and `defineGlobal`/`text` — see `prepareEdit.test.ts` for the harness pattern; `createVexMutations`'s `mutation` builder, given the identity `rawBuilder`, returns `customMutation`'s processed function definition directly, whose `.handler(ctx, args)` can be invoked inside `t.run` without a real Convex deployment):

```ts
import { convexTest } from "convex-test";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { defineGlobal, text } from "../index";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

type WrappedDefinition = {
  handler: (
    ctx: GenericMutationCtx<GenericDataModel>,
    args: unknown,
  ) => Promise<unknown>;
};

describe("createVexMutations — global afterChange", () => {
  it('fires on insert with operation "create", oldDoc null, and a flattened newDoc (no data key)', async () => {
    const captured: Array<Record<string, unknown>> = [];
    const siteSettings = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { siteName: text() },
      hooks: { afterChange: (props) => void captured.push(props as never) },
    });
    const config = {
      collections: [],
      globals: [siteSettings],
    } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    const def = mutation({
      handler: (ctx: GenericMutationCtx<GenericDataModel>) =>
        ctx.db.insert("vex_globals", {
          slug: "siteSettings",
          data: { siteName: "A" },
        }),
    }) as WrappedDefinition;

    const t = convexTest(schema, modules);
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      def.handler(ctx, {}),
    );

    expect(captured).toHaveLength(1);
    expect(captured[0]?.operation).toBe("create");
    expect(captured[0]?.oldDoc).toBeNull();
    expect(captured[0]?.newDoc).toMatchObject({
      _slug: "siteSettings",
      siteName: "A",
    });
    expect(
      (captured[0]?.newDoc as Record<string, unknown>).data,
    ).toBeUndefined();
  });

  it('fires on patch with operation "update" and a flattened oldDoc', async () => {
    const captured: Array<Record<string, unknown>> = [];
    const siteSettings = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { siteName: text() },
      hooks: { afterChange: (props) => void captured.push(props as never) },
    });
    const config = {
      collections: [],
      globals: [siteSettings],
    } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "A" },
      }),
    );
    const def = mutation({
      handler: (ctx: GenericMutationCtx<GenericDataModel>) =>
        ctx.db.patch(id, { data: { siteName: "B" } } as never),
    }) as WrappedDefinition;
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      def.handler(ctx, {}),
    );

    expect(captured).toHaveLength(1);
    expect(captured[0]?.operation).toBe("update");
    expect(captured[0]?.oldDoc).toMatchObject({
      _slug: "siteSettings",
      siteName: "A",
    });
    expect(captured[0]?.newDoc).toMatchObject({
      _slug: "siteSettings",
      siteName: "B",
    });
  });

  it("exposes newDoc.vex_status on a versioned global's draft-row insert", async () => {
    const captured: Array<Record<string, unknown>> = [];
    const siteSettings = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { siteName: text() },
      hooks: { afterChange: (props) => void captured.push(props as never) },
    });
    const config = {
      collections: [],
      globals: [siteSettings],
    } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    const def = mutation({
      handler: (ctx: GenericMutationCtx<GenericDataModel>) =>
        ctx.db.insert("vex_globals", {
          slug: "siteSettings",
          data: { siteName: "Draft" },
          vex_status: "draft",
        }),
    }) as WrappedDefinition;
    const t = convexTest(schema, modules);
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      def.handler(ctx, {}),
    );

    expect(captured[0]?.newDoc).toMatchObject({ vex_status: "draft" });
  });

  it("fires nothing on a vex_globals delete (no global delete hook — publish's internal row removal)", async () => {
    const captured: unknown[] = [];
    const siteSettings = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { siteName: text() },
      hooks: { afterChange: (props) => void captured.push(props) },
    });
    const config = {
      collections: [],
      globals: [siteSettings],
    } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    const t = convexTest(schema, modules);
    const id = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "A" },
      }),
    );
    const def = mutation({
      handler: (ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.delete(id),
    }) as WrappedDefinition;
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      def.handler(ctx, {}),
    );

    expect(captured).toHaveLength(0);
  });
});
```

### Step 7 — Save Draft end to end, server half: `versionsApi` + globals draft save + `apps/test` fixtures `[dev]`

Why: Step 5 shipped `saveDraftShared`/`resolveVersionedTarget`/`saveDraft.server.ts`/`saveDraft.client.ts` as a kind-agnostic implementation nothing can call yet. This step makes it reachable from a running admin panel — for collections AND globals, through the SAME `versions.saveDraft` endpoint (Option A, decision 12) — and finishes wiring the rest of the CRUD surface Option A touches: `create`'s `defaultStatus`-driven insert, `update`'s draft-row rejection, and `globals.upsert`'s published-row-only write. `upsertGlobal` never grows a draft-specific branch or an `action` argument (decision 12) — its only change here is that a versioned global's write always targets the PUBLISHED row and now goes through `prepareEdit` (Step 6) like everything else. From here on, every server step is immediately followed by the UI step that consumes it (Save Draft 7→8, Publish 9→10, Unpublish 11→12, status filter 13→14, two-row consequences 15→16, history 17→18).

`versionsApi` is the registration point; it mirrors `globalsApi` so a project with no versioned collection or global registers nothing on the wire. Unlike `globalsApi` (which always registers `get`/`find`/`upsert` — calling it at all is the opt-in), `versionsApi` is the first factory in this codebase with **conditional** registration: drafts are opt-in per collection/global (`versions.drafts`), so a project that never opts in anywhere must not expose a draft/publish surface at all, even if it calls the factory. Registration is **resource-kind-blind** (decision 12): the check is `hasVersionedCollections || hasVersionedGlobals`, and either one alone registers the entire surface — there is no per-kind subset. It is created here with `saveDraft` as its only entry; Steps 9, 11, and 17 each append their own operations to the same returned object.

> **Placement note.** `convex-functions.md` states factories "are co-located with the server barrel in `src/api/server.ts` … not a separate factory file" — `collectionsApi` and `globalsApi` both live there today, not in `convex.ts`. `versionsApi` follows the same placement, in `server.ts`. `convex.ts`'s role in this feature is the one it already plays for `globals`: it hosts the `vexConvexApi` typed `anyApi` surface that both the `.client.ts` wrappers and this factory's return type reference.

Globals have no per-slug Convex table (design-review §9) — every global lives in the single shared `vex_globals` table (`{ slug, data }`), so the two-row model becomes two ROWS sharing the same `slug`, distinguished by the same `vex_status`/`vex_publishedId` pair a versioned collection carries as top-level columns (Step 2 adds these to `vex_globals` whenever any registered global declares `versions.drafts: true`). Because `by_slug` is not a uniqueness constraint at the Convex level (uniqueness was always enforced by `upsertGlobal`'s own "does a row exist" check), letting a draft row share its published row's `slug` costs nothing at the schema layer — only the _application_ logic that assumed one row per slug changes: `upsertGlobal` (write) and `getGlobal` (read) both now resolve up to two same-slug rows and pick the right one.

`upsertGlobal` writes through `prepareEdit` (widened in Step 6), so both its non-versioned path and its versioned (published-row) path get permission checks, the global's `beforeChange` hook, Zod validation, and field `validate()` hooks from the one shared pipeline. **It never touches a draft row** — `versions.saveDraft` (Step 5) is the only path that writes one.

`create`'s versioned branch reads `collection.versions.defaultStatus` (decision 13) — a config field this step adds to `CollectionConfig`/`defineCollection`, scoped to collections only. A `"draft"` default (the config default) produces a draft-only row with no `vex_publishedId`/`vex_publishedAt`: the document has never been published, so there is nothing to point at yet. Every read path downstream (Steps 13/15/16) must treat this as a complete one-row document, not a draft missing its other half. A `"published"` default stamps `vex_publishedAt: Date.now()` immediately. Either way, `create` records exactly one history row at that status — closing the historical gap where a document's first-ever write emitted nothing.

`update` now rejects being called with a draft row's own id, pointing the caller at `versions.saveDraft` instead — a versioned document's draft row is never a valid `update` target, only a `saveDraft` one. When `update` succeeds it always writes the PUBLISHED row directly and records one `"published"`-status history row via `createVersion`, the same promote-in-place behavior `globals.upsert` now mirrors for globals (decision 11: every publish-shaped write is attributed and recorded, closing the historical gap where the first publish of a document emitted no history row).

Scope notes (Option A supersedes the originally-planned collections-only scoping — decision 12):

- `HasDrafts<T>`/`DRAFT_ACTIONS` visibility (Step 1 + access/types.ts, already generic) applies to a global's action union the same way it does a collection's — no `access/` changes needed.
- **`VersionHistoryDropdown` (Step 18) and `useAutosave` (Step 19) both apply to globals by the end of this spec**, not just collections — Step 17's `listVersions`/`getVersionSnapshot`/`deleteVersion` are kind-agnostic `versions.*` endpoints (same Option A shape as `saveDraft`) that authorize against the target's OWN slug, never the literal string `"vex_globals"`. Nothing in this step builds that read surface yet; it just establishes that the ceiling Step 7 onward works toward no longer excludes globals.
- **`findGlobals`/`globals.find` still returns both rows for a slug with an active draft** — a known, out-of-scope gap; nothing in the admin panel lists globals through it.

**Test fixtures move to `apps/test`.** Dev-feature testing happens in `apps/test`, not `apps/www`: `apps/www` is the deployed site, and draft testing needs arbitrary fixtures that cover every code path (a required field to fail strict publish, a relationship to a versioned target, a field-restricted role, a global a role may draft but not publish) without bending the real site's content model to fit. `apps/www` gets its own production wiring in Step 21. This step adds a dedicated versioned `posts` collection and `announcement` global to `apps/test`, plus `convex/vex/versions.ts`; later steps only append export names to that file.

- [x] `packages/core/src/collections/types.ts` — `versions.defaultStatus?: VexVersionStatus` on the input shape, resolved `versions.defaultStatus: VexVersionStatus` on `CollectionConfig` — collections only, no global equivalent.
- [x] `packages/core/src/collections/config.ts` — `defineCollection` defaults `defaultStatus` to `VERSION_STATUSES.draft.key`.
- [x] `packages/core/src/api/create/server.ts` — versioned branch stamps `vex_status`/`vex_publishedAt` from `defaultStatus` and records one history row.
- [x] `packages/core/src/api/update/server.ts` — rejects a draft row's own id (`ConvexError` pointing at `versions.saveDraft`); versioned branch records one `"published"`-status history row on every successful patch.
- [x] `packages/core/src/api/server.ts` — imports `saveDraft`/`SaveDraftServerArgs` from `./versions/saveDraft.server`; adds `versionsApi({ config, query, mutation, getAuth? })` with a `v.union` arg shape covering both collection- and global-shaped calls, registering `saveDraft` as a bare-named Convex endpoint — returns `{}` when no collection or global declares `versions.drafts: true`. `globalsApi()`'s `get` registration accepts and forwards `drafts`.
- [x] `packages/core/src/api/convex.ts` — `VexSaveDraftArgs` is a union of the collection-shaped and global-shaped wire args; `vexConvexApi.versions.saveDraft` binds it. `VexGlobalsGetArgs` gains `drafts?`.
- [x] `packages/core/src/api/globals/utils.ts` — `flattenGlobalRow` surfaces `vex_status`/`vex_publishedAt`/`vex_publishedId` when present.
- [x] `packages/core/src/api/globals/upsert.server.ts` — a versioned global's upsert always writes the PUBLISHED row through `prepareEdit`, never a draft row; unchanged single-row behavior for a non-versioned global.
- [x] `packages/core/src/api/globals/get.server.ts` — `GetGlobalServerArgs` gains `drafts?: boolean`; `getGlobal` resolves the correct one of up to two same-slug rows, gated by `readDrafts`.
- [x] `apps/test/src/db/constants/index.ts` — `TABLE_SLUG_POSTS`, `GLOBAL_SLUG_ANNOUNCEMENT`.
- [x] `apps/test/src/vexcms/collections/posts.ts` (new) + `collections/index.ts` export.
- [x] `apps/test/src/vexcms/globals/announcement.ts` (new) + `globals/index.ts` export.
- [x] `apps/test/src/vex.config.ts` — register both.
- [x] `apps/test/src/auth/access.ts` — register both as resources; per-role draft permissions.
- [x] `apps/test/convex/vex/versions.ts` (new) — registers `versionsApi`, exporting `saveDraft`.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter apps-test typecheck` — `create`/`update`/`upsertGlobal`/`getGlobal`/`versionsApi` suites pass; a versioned `apps/test` collection and global round-trip through the admin panel's network tab by hand (no UI consumes `saveDraft` until Step 8).

#### packages/core/src/collections/types.ts

One edit each on the input and resolved shapes.

**1 — input shape**, inside the `versions` input block (alongside `drafts`/`autosave`/`cascadeDelete`):

```ts
    /**
     * The `vex_status` a newly `create`d document starts at. `"draft"`
     * (the default) produces a draft-only row with no `vex_publishedId`/
     * `vex_publishedAt` — the document has never been published, so there is
     * nothing to point at yet. `"published"` stamps `vex_publishedAt:
     * Date.now()` immediately. Collections only — globals have no
     * `defaultStatus`; `globals.upsert`'s first-ever write for a slug always
     * produces a published row.
     *
     * @defaultValue `"draft"`
     */
    defaultStatus?: VexVersionStatus;
```

**2 — resolved `CollectionConfig.versions`:**

```ts
  versions: {
    drafts: TDrafts;
    defaultStatus: VexVersionStatus;
    autosave: {
      enabled: boolean;
      debounceMs: number;
    };
    cascadeDelete: boolean;
  };
```

#### packages/core/src/collections/config.ts

One edit — `defineCollection`'s `versions` default block gains `defaultStatus`, defaulted to `VERSION_STATUSES.draft.key` and spread-overridden by `input.versions` like every other key in this block:

```ts
    versions: {
      drafts: false as TDrafts,
      cascadeDelete: true,
      defaultStatus: VERSION_STATUSES.draft.key,
      ...input.versions,
      autosave: {
        enabled: false,
        debounceMs: DEFAULT_AUTOSAVE_DEBOUNCE_MS,
        ...input.versions?.autosave,
      },
    },
```

`VERSION_STATUSES` is already imported from `../versions` by this file (Step 1).

#### packages/core/src/api/create/server.ts

Existing file. Shown complete — the versioned branch touches the tail of the function, after the shared validation pipeline every `create` call already runs.

```ts
import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { getFieldsInputSchema, validateFields } from "../../fields";
import { resolveAccessCall, stampUpdatedAt, toVexMutationCtx } from "../utils";
import { TDocument } from "../convex";
import { createVersion, removeVexFields, VERSION_STATUSES } from "../../versions";

/**
 * Server-side args for `create`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface CreateServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The collection slug to insert into. */
  collection: TCollectionSlug;
  /**
   * Field values for the new document. `_id` and `_creationTime` are
   * excluded — Convex assigns these automatically.
   *
   * Passed through `v.any()` at the network boundary; CLI codegen validates
   * the shape against the Convex schema at build time.
   */
  data: Expand<
    BetterOmit<DocumentByName<DataModel, TableNamesInDataModel<DataModel>>, "_creationTime" | "_id">
  >;
}

/**
 * Inserts a document into a VexCMS collection and returns its ID.
 *
 * **Versioned collection** (`versions.drafts: true`): the inserted row's
 * `vex_status` comes from `collection.versions.defaultStatus` — `"draft"`
 * (the config default) produces a draft-only row with no
 * `vex_publishedId`/`vex_publishedAt`; `"published"` stamps
 * `vex_publishedAt: Date.now()` immediately. Either way, exactly one history
 * row is recorded at that status — `create` never leaves a document's first
 * write unattributed in `vex_versions`. This endpoint never grows a
 * draft-specific `action` argument (Option A, decision 12) — a versioned
 * collection's `create` always inserts one row whose status is config-driven,
 * not caller-driven.
 *
 * Server-side only — call inside a Convex mutation handler.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, collection, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to the new document's ID as a string.
 * @example
 * ```ts
 * import { create } from "@vexcms/core/server";
 *
 * export const createPost = mutation({
 *   args: { data: v.any() },
 *   handler: (ctx, args) => create({ ctx, collection: "posts", data: args.data }),
 * });
 * ```
 */
export async function create<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: CreateServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  const collection = args.config.collections.find((c) => c.slug === args.collection);
  if (!collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }

  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.create,
      resource: args.collection,
    });
    hasPermission({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: args.data,
      changes: args.data,
      throwOnDenied: true,
    });
  }

  let doc = { ...args.data } as unknown as TDocument;
  if (collection.hooks?.beforeChange) {
    doc = await collection.hooks.beforeChange({
      operation: "create",
      doc: doc as never,
      ctx: args.ctx,
      collection,
    });
  }

  const parsed = getFieldsInputSchema({ fields: collection.fields }).safeParse(doc);
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }

  await validateFields({
    fields: collection.fields,
    doc,
    keys: Object.keys(doc),
    ctx: toVexMutationCtx(args.ctx),
    config: args.config,
  });

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: doc });

  if (collection.versions.drafts) {
    const status = collection.versions.defaultStatus;
    const insertData = {
      ...data,
      vex_status: status,
      ...(status === VERSION_STATUSES.published.key ? { vex_publishedAt: Date.now() } : {}),
    };
    const id = await args.ctx.db.insert(args.collection, insertData as never);
    await createVersion({
      ctx: args.ctx,
      collection: args.collection,
      documentId: id,
      status,
      snapshot: removeVexFields({ doc: data }),
      publishedAt: insertData.vex_publishedAt,
    });
    return id;
  }

  const id = await args.ctx.db.insert(args.collection, data as never);
  return id;
}
```

Note `data` (the schema/hook-processed document) is what's snapshotted, not `insertData` — the history row's snapshot is clean user fields, never `vex_status`/`vex_publishedAt`.

#### packages/core/src/api/update/server.ts

Existing file. Shown complete — the draft-row guard is new, inserted immediately after the document fetch and before `prepareEdit` runs.

```ts
import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS } from "../../access";
import { prepareEdit } from "../prepareEdit";
import { stampUpdatedAt } from "../utils";
import { TDocument } from "../convex";
import { createVersion, removeVexFields, VERSION_STATUSES } from "../../versions";

/**
 * Server-side args for `update`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 */
export interface UpdateServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The collection slug to patch this document. */
  collection: TCollectionSlug;
  /** The document ID to patch. */
  id: GenericId<TCollectionSlug>;
  /**
   * Partial field values to merge into the document. Only the keys present
   * here are written; unspecified fields are left unchanged. `_id` and
   * `_creationTime` are excluded — Convex manages them.
   *
   * Passed through `v.any()` at the network boundary; CLI codegen validates
   * the shape against the Convex schema at build time.
   */
  data: Partial<
    Expand<
      BetterOmit<
        DocumentByName<DataModel, TableNamesInDataModel<DataModel>>,
        "_creationTime" | "_id"
      >
    >
  >;
}

/**
 * Patches a document by its `Id<TCollectionSlug>`. Only specified fields are
 * updated; unspecified fields are left unchanged. Server-side only.
 *
 * **Versioned collection** (`versions.drafts: true`): `update` always writes
 * the PUBLISHED row directly — it checks the `update` permission action, not
 * a draft action, and records one `"published"`-status history row via
 * `createVersion` on every successful patch (Option A, decision 11 — every
 * publish-shaped write is attributed). An active draft row for this document
 * is left completely untouched. Calling `update` with a draft row's OWN id
 * is rejected: `saveDraft` (`versions.saveDraft`) is the only valid way to
 * edit a draft row. `update` never grows a draft-specific `action` argument
 * (decision 12) — the only way it ever behaves differently is this rejection.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, id, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @throws {ConvexError} When `id` resolves to a draft row of a versioned collection.
 * @example
 * ```ts
 * import { update } from "@vexcms/core/server";
 *
 * export const updatePost = mutation({
 *   args: { id: v.id("posts"), data: v.any() },
 *   handler: (ctx, args) => update({ ctx, id: args.id, data: args.data }),
 * });
 * ```
 */
export async function update<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: UpdateServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  const collection = args.config.collections.find((c) => c.slug === args.collection);
  if (!collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }

  const doc = await args.ctx.db.get(args.id);
  if (
    collection.versions.drafts &&
    (doc as TDocument | null)?.vex_status === VERSION_STATUSES.draft.key
  ) {
    throw new ConvexError(
      `Document "${args.id}" in collection "${args.collection}" is a draft row — use versions.saveDraft to edit it`,
    );
  }

  const { patch, transformedFields } = await prepareEdit({
    ctx: args.ctx,
    config: args.config,
    target: { kind: "collection", config: collection },
    action: CRUD_ACTIONS.update,
    access: args.access,
    auth: args.auth,
    storedDoc: (doc ?? undefined) as TDocument | undefined,
    incoming: args.data as Partial<TDocument>,
    partial: true,
    validateKeys: "changed",
  });

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: patch });
  await args.ctx.db.patch(args.id, data as never);

  if (collection.versions.drafts) {
    await createVersion({
      ctx: args.ctx,
      collection: args.collection,
      documentId: String(args.id),
      status: VERSION_STATUSES.published.key,
      snapshot: removeVexFields({ doc: transformedFields }),
      publishedAt: (doc as TDocument | null)?.vex_publishedAt as number | undefined,
    });
  }
}
```

`publishedAt` on the history row carries forward the document's EXISTING `vex_publishedAt` (set by `create` or a prior publish) — `update` never stamps a new one; that is `publish`'s job (Step 9).

#### packages/core/src/api/server.ts

Existing file; 4 edits.

**1 — imports, added beside the existing `globals/*.server` imports.**

```ts
import type { SaveDraftServerArgs } from "./versions/saveDraft.server";
import { saveDraft } from "./versions/saveDraft.server";
```

**2 — barrel re-exports, added after the existing `export { upsertGlobal } from "./globals/upsert.server";` line.**

```ts
export { saveDraft } from "./versions/saveDraft.server";
export type { SaveDraftServerArgs } from "./versions/saveDraft.server";
```

**3 — `versionsApi` factory, added immediately after `globalsApi` and before `resolveGetAuth`.** The `args` shape is a `v.union` of the two member shapes — Option A's `versions.*` endpoints accept EITHER a collection target or a global target, never a flat object with both fields optional, so a malformed call (e.g. both `collection` and `global` present, or neither) is rejected by argument validation before the handler runs.

````ts
/**
 * Registers the draft/version workflow as bare-named Convex endpoints under
 * `api.vex.versions.*`, mirroring `collectionsApi`/`globalsApi`'s
 * registration shape and RBAC seam. Full surface once this spec lands:
 * `saveDraft`, `publish`, `unpublish`, `listVersions`, `getVersionSnapshot`,
 * `deleteVersion` — ONE implementation per operation, shared by collections
 * and globals (Option A, decision 12). CRUD endpoints (`create`, `update`,
 * `globals.upsert`) never grow a draft-specific branch or `action` argument;
 * every draft/publish/unpublish/history operation lives here instead.
 *
 * Unlike `globalsApi` (always registers its three operations once called),
 * `versionsApi` registers NOTHING for a project where no resource declares
 * `versions.drafts: true` — drafts are opt-in per collection/global, so a
 * project that never opts in anywhere must not expose a draft/publish
 * surface at all. Registration is resource-kind-blind: a collection OR a
 * global alone is enough to register the entire surface.
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
 * @returns The operations above as a FLAT object (bare names — identical
 *   shape to `globalsApi`'s own flat `{ get, find, upsert }` return; the
 *   nesting under `api.vex.versions.*` comes from where the caller places
 *   the registration file, exactly as `api.vex.globals.*` comes from
 *   `globalsApi` living in `convex/vex/globals.ts`, never from the factory's
 *   return shape itself), or `{}` when no resource declares
 *   `versions.drafts: true`.
 *
 * @example
 * ```ts
 * // convex/vex/versions.ts — dedicated file, mirrors convex/vex/globals.ts;
 * // Convex's directory-based routing is what produces `api.vex.versions.*` on the wire.
 * import { versionsApi } from "@vexcms/core/server";
 * import { createGetAuth } from "@vexcms/better-auth/server";
 * import { query, mutation } from "../_generated/server";
 * import config from "~/vex.config";
 *
 * export const { saveDraft, publish, unpublish, listVersions, getVersionSnapshot, deleteVersion } =
 *   versionsApi({ config, query, mutation, getAuth: createGetAuth() });
 * // → {} when config has no `versions.drafts: true` anywhere — the file still
 * //   exists and exports an empty object; it is never conditionally omitted.
 *
 * // A call can target EITHER a collection or a global, never both:
 * await mutateAsync({ collection: "posts", id: postId, data: { title: "Draft title" } });
 * await mutateAsync({ global: "siteSettings", data: { siteName: "New Name" } });
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
  void query;
  const hasVersionedCollections = config.collections.some((c) => c.versions.drafts);
  const hasVersionedGlobals = config.globals.some((g) => g.versions.drafts);
  if (!hasVersionedCollections && !hasVersionedGlobals) {
    return {};
  }

  return {
    saveDraft: mutation({
      // Convex requires a function's top-level args to be an object
      // validator, so the `{ collection, id } | { global }` union is
      // enforced here instead; `VexSaveDraftArgs` keeps it on the client.
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        data: v.any(),
        restoredFrom: v.optional(v.number()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "saveDraft takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return saveDraft({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            data: args.data,
            restoredFrom: args.restoredFrom,
          });
        }
        return saveDraft({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          data: args.data,
          restoredFrom: args.restoredFrom,
        });
      },
    }),
    // Step 9 appends `publish`, Step 11 `unpublish`,
    // Step 17 `listVersions` / `getVersionSnapshot` / `deleteVersion`.
  };
}
````

> Convex rejects a top-level `args: v.union(...)` at push time — "Args
> validator must be an object or any." Every registration below therefore
> uses a flat object validator with optional fields and validates the
> `{ collection, id } | { global }` exclusivity by hand in the handler,
> throwing a `ConvexError` naming the operation when the caller supplies
> neither or both shapes. The discriminated-union client types
> (`VexSaveDraftArgs` and friends) are unaffected — only the wire-level
> validator changes.

**4 — `globalsApi()`'s `get` registration forwards `drafts`.** Anchor: the `globalsApi` function body.

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

`GetGlobalServerArgs` is already imported by this file — no new import needed.

#### packages/core/src/api/convex.ts

Existing file; 2 edits.

**1 — `VexSaveDraftArgs`.** A union, not a flat object: the collection-shaped and global-shaped wire args are mutually exclusive (Option A), matching `SaveDraftServerArgs`'s discriminated union exactly, minus `ctx`/`config`.

```ts
// ── Versions API shallow types ──────────────────────────────────────────────
//
// Arg and return shapes for the versioned document endpoints.

/** Args for `api.vex.versions.saveDraft`. */
export type VexSaveDraftArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      data: Record<string, unknown>;
      restoredFrom?: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      data: Record<string, unknown>;
      environmentId?: string;
    };
```

**2 — `vexConvexApi.versions`**, added as a sibling of the existing `globals` block:

```ts
  versions: {
    saveDraft: anyApi.vex.versions.saveDraft as FunctionReference<
      "mutation",
      "public",
      VexSaveDraftArgs,
      string
    >,
  },
```

`VexGlobalsGetArgs` (already declared above `VexGlobalsUpdateArgs` in this file) gains `drafts?: boolean`, mirroring `GetGlobalServerArgs`.

#### packages/core/src/api/globals/utils.ts

One edit — `flattenGlobalRow` lifts the three new system columns onto the flat document the same way it already lifts `_id`/`_creationTime`, so `StatusBadge`, `GlobalEditView`, and any permission callback see `doc.vex_status` exactly as a versioned collection's callers see it on their own flat row.

```ts
export function flattenGlobalRow(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const {
    slug,
    data,
    _id,
    _creationTime,
    vex_status,
    vex_publishedAt,
    vex_publishedId,
  } = row as {
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

The three new keys are spread before `...(data ?? {})`, matching how `_id`/`_creationTime`/`_slug` are already placed ahead of it. A non-versioned global's row never has these columns, so all three conditionals are skipped and the return shape is byte-for-byte what it is today.

#### packages/core/src/api/globals/upsert.server.ts

Shown complete — the versioned branch touches nearly every line of the implementation (row lookup, authorization, validation, and write all change shape once a slug can resolve to two rows). **No `action` argument anywhere** — a versioned global's `upsert` can only ever mean "write the published row" (Option A, decision 12); `versions.saveDraft` is the only path that writes its draft row.

```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { GlobalSlug, CollectionSlug } from "../../types/generated";
import { CRUD_ACTIONS } from "../../access";
import { GenericGlobalsMutationServerArgs } from "./types";
import { prepareEdit } from "../prepareEdit";
import { createVersion } from "../../versions/model";
import { VERSION_STATUSES } from "../../versions";

/** System keys stripped from flat input before writing to DB. */
const STRIPPED_KEYS = new Set(["_id", "_creationTime", "_slug"]);

/**
 * Server-side args for `updateGlobal`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 */
export interface UpsertGlobalServerArgs<
  DataModel extends GenericDataModel,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
> extends GenericGlobalsMutationServerArgs<DataModel, TGlobalSlug> {
  /** The global slug to upsert. Must match a registered global in config. */
  slug: TGlobalSlug;
  /**
   * User field data. May be the full flat document (system keys `_id`,
   * `_creationTime`, `_slug` are stripped server-side) or just the field
   * values. The `GlobalEditView` component sends the flat form values here.
   */
  data: Record<string, unknown>;
}

/**
 * Upserts a global document in `vex_globals`.
 *
 * **Non-versioned global** (`versions.drafts` is `false`, the default):
 * unchanged from before this spec — strips system keys from `data`, merges
 * onto the stored document, validates against the global's Zod schema, and
 * patches only the changed fields (inserts on first save).
 *
 * **Versioned global** (`versions.drafts` is `true`): writes the PUBLISHED
 * row directly — the slug's row whose `vex_status !== "draft"` — exactly as
 * `update()` writes a versioned collection's published row. Inserts it with
 * `vex_status: "published"` and `vex_publishedAt: Date.now()` when no
 * published row exists yet (a global's first-ever save always produces a
 * published row — globals have no `defaultStatus`); records a
 * `"published"`-status history row via
 * `createVersion({ collection: "vex_globals", documentId: slug, ... })`.
 * NEVER touches a global's draft row — `versions.saveDraft`
 * (`api/versions/saveDraft.server.ts`) is the only path that writes it. No
 * `action` argument: a versioned global's `upsert` can only mean "write the
 * published row" (Option A, decision 12).
 *
 * Throws `ConvexError` on Zod validation failure with a structured `errors`
 * payload. Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 * @param props - `{ ctx, slug, data, config }`.
 * @returns The `_id` of the written `vex_globals` row, as a string — the
 *   published row's, for both a versioned and non-versioned global.
 *
 * @example
 * ```ts
 * import { upsertGlobal } from "@vexcms/core/server";
 *
 * const id = await upsertGlobal({
 *   ctx,
 *   slug: "siteSettings",
 *   data: { siteName: "New Name" },
 *   config,
 * });
 * ```
 */
export async function upsertGlobal<
  DataModel extends GenericDataModel,
  TSlug extends GlobalSlug = GlobalSlug,
>(props: UpsertGlobalServerArgs<DataModel, TSlug>): Promise<string> {
  const globalConfig = props.config.globals.find((g) => g.slug === props.slug);
  if (!globalConfig) {
    throw new ConvexError(`No global registered with slug "${props.slug}"`);
  }

  const userFields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props.data)) {
    if (!STRIPPED_KEYS.has(k)) userFields[k] = v;
  }

  const rows = await props.ctx.db
    .query("vex_globals")
    .withIndex("by_slug", (q) => q.eq("slug", props.slug as never))
    .collect();
  const toStored = (row: Record<string, unknown>) => ({
    _id: row._id,
    _creationTime: row._creationTime,
    ...(row.data as Record<string, unknown>),
  });

  if (!globalConfig.versions.drafts) {
    const row = rows[0];
    const { patch } = await prepareEdit({
      ctx: props.ctx,
      config: props.config,
      target: { kind: "global", config: globalConfig },
      action: row ? CRUD_ACTIONS.update : CRUD_ACTIONS.create,
      access: props.access,
      auth: props.auth,
      storedDoc: row ? (toStored(row) as never) : undefined,
      incoming: userFields,
      partial: false,
      validateKeys: "changed",
    });
    if (row) {
      await props.ctx.db.patch(
        row._id as never,
        {
          data: { ...(row.data as Record<string, unknown>), ...patch },
        } as never,
      );
      return row._id as string;
    }
    const id = await props.ctx.db.insert("vex_globals", { slug: props.slug, data: patch } as never);
    return id as string;
  }

  // Versioned global: writes the PUBLISHED row directly — the slug's row
  // whose `vex_status !== "draft"` — and never touches the draft row, if
  // one is active. `saveDraft` (`api/versions/saveDraft.server.ts`) is the
  // only path that writes a global's draft row.
  const publishedRow = rows.find((r) => r.vex_status !== VERSION_STATUSES.draft.key);

  const { patch } = await prepareEdit({
    ctx: props.ctx,
    config: props.config,
    target: { kind: "global", config: globalConfig },
    action: publishedRow ? CRUD_ACTIONS.update : CRUD_ACTIONS.create,
    access: props.access,
    auth: props.auth,
    storedDoc: publishedRow ? (toStored(publishedRow) as never) : undefined,
    incoming: userFields,
    partial: false,
    validateKeys: "changed",
  });

  if (publishedRow) {
    const nextData = { ...((publishedRow.data as Record<string, unknown>) ?? {}), ...patch };
    await props.ctx.db.patch(publishedRow._id as never, { data: nextData } as never);
    await createVersion({
      ctx: props.ctx,
      collection: "vex_globals" as CollectionSlug,
      documentId: props.slug,
      status: VERSION_STATUSES.published.key,
      snapshot: nextData,
      publishedAt: publishedRow.vex_publishedAt as number | undefined,
    });
    return publishedRow._id as string;
  }

  const publishedAt = Date.now();
  const id = await props.ctx.db.insert("vex_globals", {
    slug: props.slug,
    data: patch,
    vex_status: VERSION_STATUSES.published.key,
    vex_publishedAt: publishedAt,
  } as never);
  await createVersion({
    ctx: props.ctx,
    collection: "vex_globals" as CollectionSlug,
    documentId: props.slug,
    status: VERSION_STATUSES.published.key,
    snapshot: patch,
    publishedAt,
  });
  return id as string;
}
```

#### packages/core/src/api/globals/get.server.ts

One edit — `GetGlobalServerArgs` gains `drafts?: boolean`, and `getGlobal`'s body resolves up to two same-slug rows for a versioned global, gated by `readDrafts` exactly the way a collection's read path will be in Step 13.

**1 — `GetGlobalServerArgs`:**

```ts
export interface GetGlobalServerArgs<
  DataModel extends GenericDataModel,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TPopulate extends GlobalPopulateShape<TGlobalSlug> = Record<string, never>,
  D extends number = 0,
> extends GenericGlobalsQueryServerArgs<DataModel, TGlobalSlug> {
  /** Global slug to fetch. Narrowed to `GlobalSlug` after `vex generate`. */
  slug: TGlobalSlug;
  /** Relationship fields to populate. Mutually exclusive with `depth`. */
  populate?: [D] extends [0] ? TPopulate : never;
  /** Auto-populate all relationship fields to N levels. Mutually exclusive with `populate`. */
  depth?: [TPopulate] extends [Record<string, never>] ? D : never;
  /**
   * When the resolved global declares `versions.drafts: true`, prefer the
   * active draft row over the published row — the same knob Step 13 adds to
   * `find`/`get`/`search` for collections. Ignored for a non-versioned
   * global. Defaults to `false`: the public/default read path never sees
   * draft content, matching design-review §3.1 — this is data integrity,
   * not a permission decision, so the default without the flag is "no
   * drafts" regardless of the caller's grants.
   */
  drafts?: boolean;
}
```

**2 — `getGlobal`'s row resolution, replacing the single `ctx.db.query(...).first()` call:**

```ts
export async function getGlobal<
  DataModel extends GenericDataModel,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TPopulate extends GlobalPopulateShape<TGlobalSlug> = Record<string, never>,
  D extends number = 0,
>(
  props: GetGlobalServerArgs<DataModel, TGlobalSlug, TPopulate, D>,
): Promise<GetGlobalReturn<TGlobalSlug, TPopulate, D>> {
  let row: Record<string, unknown> | null = null;
  const globalConfig = props.config?.globals.find((g) => g.slug === props.slug);
  if (!globalConfig?.versions.drafts) {
    row = await props.ctx.db
      .query("vex_globals")
      .withIndex("by_slug", (q) => q.eq("slug", props.slug as never))
      .first();
  } else {
    const rows = await props.ctx.db
      .query("vex_globals")
      .withIndex("by_slug", (q) => q.eq("slug", props.slug as never))
      .collect();

    const publishedRow = rows.find((r) => r.vex_status !== VERSION_STATUSES.draft.key);
    const draftRow = rows.find((r) => r.vex_status === VERSION_STATUSES.draft.key);
    const wantsDrafts =
      props.config?.access === undefined
        ? Boolean(props.drafts)
        : Boolean(props.drafts) &&
          hasPermission({
            access: props.config.access,
            user: props.auth?.user ?? null,
            organization: props.auth?.organization,
            resource: props.slug,
            action: DRAFT_ACTIONS.readDrafts,
            throwOnDenied: false,
          });
    row = (wantsDrafts && draftRow ? draftRow : publishedRow) ?? null;
  }

  if (!row) return null as GetGlobalReturn<TGlobalSlug, TPopulate, D>;

  // ...flatten / permission-strip / populate — unchanged below this point.
}
```

`DRAFT_ACTIONS.readDrafts`'s `resource` is `props.slug` — the global's own slug, never the literal string `"vex_globals"` (Option A, decision 12d).

#### apps/test/src/db/constants/index.ts

1 edit — two constants, each beside its kind's existing siblings (`TABLE_SLUG_POSTS` after the `TABLE_SLUG_COMMENTS` block, `GLOBAL_SLUG_ANNOUNCEMENT` after `GLOBAL_SLUG_SITE_SETTINGS`):

```ts
export const TABLE_SLUG_POSTS = "posts" as const;
export type PostDoc = Doc<typeof TABLE_SLUG_POSTS>;
export type PostID = Id<typeof TABLE_SLUG_POSTS>;
```

```ts
export const GLOBAL_SLUG_ANNOUNCEMENT = "announcement" as const;
```

#### apps/test/src/vexcms/collections/posts.ts

New file, complete. Every field exists to exercise a specific draft code path, named in its comment — this collection is a test surface, not content modelling.

```ts
import { defineCollection, relationship, text } from "@vexcms/core";

import { TABLE_SLUG_ARTICLES, TABLE_SLUG_POSTS } from "~/db/constants";

/**
 * Draft/publish test surface for the versioning-drafts spec.
 *
 * Each field covers one path through the draft workflow:
 * - `title` (required) — a draft may leave it empty (`saveDraft` is lenient);
 *   `publish` must reject naming it (strict validation, decision 4).
 * - `slug` (indexed) — the field the `contributor` role may not change in a
 *   draft (`~/auth/access.ts`), proving `saveDraft` enforces the same
 *   `changes`-based field restriction `update` does.
 * - `relatedPost` — relationship to a VERSIONED target (this collection), so
 *   `publish` rejects while it points at a draft (`assertNoDraftRelationships`)
 *   and the picker's draft visibility (Step 14) is testable.
 * - `relatedArticle` — relationship to a NON-versioned target, which must never
 *   block a publish.
 */
export const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  interfaceName: "Post",
  labels: {
    singular: "Post",
    plural: "Posts",
  },
  admin: {
    useAsTitle: "title",
    icon: "FilePen",
  },
  versions: {
    drafts: true,
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
      description:
        "Required — leave empty in a draft to test publish rejection.",
    }),
    slug: text({
      label: "Slug",
      required: true,
      index: "by_slug",
      description: "Contributors may not change this in a draft.",
    }),
    body: text({
      label: "Body",
      description:
        "Free text — the field to edit when testing a plain draft save.",
    }),
    relatedPost: relationship({
      label: "Related Post",
      collection: {
        slug: TABLE_SLUG_POSTS,
      },
      description:
        "Versioned target — publishing while this points at a draft must fail.",
    }),
    relatedArticle: relationship({
      label: "Related Article",
      collection: {
        slug: TABLE_SLUG_ARTICLES,
      },
      description: "Non-versioned target — never blocks a publish.",
    }),
  },
});
```

#### apps/test/src/vexcms/collections/index.ts

1 edit — alphabetical, after `./pages`:

```ts
export * from "./posts";
```

#### apps/test/src/vexcms/globals/announcement.ts

New file, complete.

```ts
import { checkbox, defineGlobal, text } from "@vexcms/core";

import { GLOBAL_SLUG_ANNOUNCEMENT } from "~/db/constants";

/**
 * Draft/publish test surface for versioned globals (versioning-drafts spec).
 *
 * `message` is required, so a draft with it cleared saves (lenient) but cannot
 * publish (strict). The `editor` role may draft this global but not publish or
 * unpublish it (`~/auth/access.ts`), covering the disabled-Publish path.
 */
export const announcement = defineGlobal({
  slug: GLOBAL_SLUG_ANNOUNCEMENT,
  label: "Announcement",
  admin: {
    icon: "Megaphone",
    description:
      "Site-wide banner. Versioned: edits are drafts until published.",
  },
  versions: {
    drafts: true,
  },
  fields: {
    message: text({
      label: "Message",
      required: true,
      description: "Banner text. Required to publish.",
    }),
    href: text({
      label: "Link",
      description: "Optional link target.",
    }),
    dismissible: checkbox({
      label: "Dismissible",
    }),
  },
});
```

#### apps/test/src/vexcms/globals/index.ts

Shown complete:

```ts
import { announcement } from "./announcement";
import { nav } from "./nav";
import { siteSettings } from "./siteSettings";

export * from "./announcement";
export * from "./nav";
export * from "./siteSettings";

export const globals = [announcement, nav, siteSettings];
```

#### apps/test/src/vex.config.ts

3 edits.

1. Add `posts` to the `~/vexcms/collections` import list (alphabetical, after `pages`), and `import { announcement } from "./vexcms/globals/announcement";` beside the `nav`/`siteSettings` imports.
2. `collections: [...]` — append `posts` after `comments`.
3. `globals: [nav, siteSettings]` → `globals: [nav, siteSettings, announcement]`.

#### apps/test/src/auth/access.ts

2 edits.

**1 — resources.** Add `posts` to the `~/vexcms/collections` import and `announcement` to the `~/vexcms/globals` import; append `posts, announcement` to `resources: [...]`.

**2 — per-role permissions.** `admin`'s `"*": true` already covers every draft action. Add:

```ts
    // inside [USER_ROLES.editor], after `comments: true,`
      // Full draft workflow on posts. May draft the announcement but not
      // publish/unpublish it — exercises the disabled-Publish path.
      posts: true,
      announcement: {
        "*": true,
        publish: false,
        unpublish: false,
      },
```

```ts
    // inside [USER_ROLES.contributor], after the `comments` block
      // May draft posts but not change `slug` in a draft — the same field map on
      // `saveDraft` as on `update` (launch-plan acceptance criterion). No
      // publish/unpublish: drafts only.
      posts: {
        read: true,
        readDrafts: true,
        create: true,
        update: () => ({ "*": true, slug: false }),
        saveDraft: () => ({ "*": true, slug: false }),
      },
```

```ts
    // inside [USER_ROLES.user] (also the anonymous role), after the `comments` block
      // Published content only: no `readDrafts`, so drafts never reach a reader.
      posts: {
        "*": false,
        read: true,
      },
      announcement: {
        "*": false,
        read: true,
      },
```

#### apps/test/convex/vex/versions.ts

New file, complete.

```ts
import { versionsApi } from "@vexcms/core/server";

import config from "~/vex.config.server";

import { query } from "../_generated/server";
import { getAuth, vexMutation as mutation } from "../vex";

export const { saveDraft } = versionsApi({
  config,
  query,
  mutation,
  getAuth,
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter apps-test typecheck` — then by hand, open `apps/test`'s admin panel, edit a `posts` document or the `announcement` global, and confirm a draft row appears in the Convex dashboard's `vex_versions`/table data with `vex_status: "draft"` (no UI button calls `saveDraft` yet — Step 8 adds one; this step's manual check is a direct `useMutation(saveDraft)` call from the browser console or a throwaway test page).

### Step 8 — Save Draft UI: `StatusBadge` + shared `DraftToolbar` `[dev]`

Why: First visible UI, wired to the only draft operation that exists so far (Step 7). Builds the one `DraftToolbar` component both `CollectionEditView` and `GlobalEditView` render, starting with a Save Draft button and the `StatusBadge`; Steps 10, 12, and 18 each add one more affordance to the same component (Publish, Unpublish, version history) as their server half lands. Each button is gated by its own `usePermission` action rather than a shared `update`, since draft actions are separately declared in `DRAFT_ACTIONS` (Step 3).

`DraftToolbar` is presentational: it renders the badge and buttons from props and owns no mutations. For Option A, BOTH views write draft saves through the exact same endpoint — `vexConvexApi.versions.saveDraft` — just with a different discriminant in the args (`{ collection, id, data }` for a collection row; `{ global, data }` for a global, keyed by slug, no row id). Each view keeps its own `useMutation(useConvexMutation(vexConvexApi.versions.saveDraft))` instance and handler and hands the toolbar `{ onClick, isPending, disabled }` per action — one component, one look, no endpoint knowledge inside it. (A non-versioned global's plain Save button still submits through `vexConvexApi.globals.upsert`, unchanged — `versions.saveDraft` only exists on the versioned path.)

Two structural facts drive the `CollectionEditView` edits below:

- **The component must track which row it's currently looking at.** `saveDraft`'s `id` argument accepts either the published row's `_id` (bootstrap-or-find) or an existing draft's own `_id` (direct patch) — but `publish`'s `id` argument must be the draft row's own `_id` (Step 9 merges "the draft row's current fields" directly off `args.id`). The FIRST draft save on a previously-published document returns a brand-new row `_id` that differs from what's currently loaded; without re-pointing the `get` query at it, the editor keeps looking at the published row and the badge never flips to Draft after an in-session save. This is solved entirely inside `CollectionEditView` with local state — no routing/prop changes. Until Step 13's status filter lands, `get` returns whatever row the id now points at, draft or published, with no extra server change needed here.
- **A `{ server }` preview-URL resolver resolves against the DRAFT row while a draft is loaded — intended, no change needed.** `resolveUrl.server.ts` does `ctx.db.get(documentId)` and merges the editor's unsaved `values` over the result. `CollectionEditView` passes `activeDocumentId`, so once a draft row exists the resolver reads the DRAFT, and a draft that changed the document's `slug` previews at the new path — which is what an editor changing a slug expects to see.

`GlobalEditView` has the matching fact: its `globals.get` query must pass `drafts: global.versions.drafts`, or `getGlobal` (Step 7) keeps resolving the published row and a saved draft vanishes from the form on the next render.

Live preview on a global shows whichever row the edit view has loaded — draft when editing a draft. The overlay map is keyed by _preview key_: a collection document's `_id`, a global's _slug_. A versioned global's two rows share one slug, so the preview key alone cannot distinguish them, and it does not need to: `GlobalEditView` overlays the form values it is currently editing onto whatever `getGlobal` resolved — no globals-specific preview code.

- [x] `packages/react/src/components/drafts/StatusBadge.tsx` (new) + `StatusBadge.test.tsx`.
- [x] `packages/react/src/components/drafts/DraftToolbar.tsx` (new) — badge + Save Draft.
- [x] `packages/react/src/components/drafts/index.ts` (new) — export both; `components/index.ts` re-exports `./drafts`.
- [x] `packages/react/src/components/views/CollectionEditView.tsx` — `activeDocumentId`, `saveDraft` mutation (`{ collection, id, data }`), `editAction`/`canEdit` gated on `DRAFT_ACTIONS.saveDraft` for a versioned collection, `DraftToolbar`.
- [x] `packages/react/src/components/views/GlobalEditView.tsx` — `drafts` on `get`, a separate `versions.saveDraft` mutation (`{ global, data }`) alongside the unchanged `globals.upsert` submit path, `canEdit`/`fieldPermissions` gated on `DRAFT_ACTIONS.saveDraft` for a versioned global, `DraftToolbar`.
- [x] `packages/react/src/components/views/GlobalEditView.test.tsx`.

#### packages/react/src/components/drafts/StatusBadge.tsx

```tsx
"use client";

import { VERSION_STATUSES, type VexVersionStatus } from "@vexcms/core";
import { Badge } from "../ui/badge";

/** Props for {@link StatusBadge}. */
export interface StatusBadgeProps {
  /** The document's current publish state — its `vex_status` field. */
  status: VexVersionStatus;
}

/**
 * Small pill indicating whether a versioned document (or global) is
 * currently a draft or published — used in the edit-view draft toolbar
 * (`CollectionEditView`, `GlobalEditView`), `VersionHistoryDropdown`'s
 * per-version rows, and the collapsed list-view row Step 16 introduces.
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
  const variant = props.status === VERSION_STATUSES.draft.key ? "outline" : "default";
  const label =
    props.status === VERSION_STATUSES.draft.key
      ? VERSION_STATUSES.draft.labels.singular
      : VERSION_STATUSES.published.labels.singular;
  return <Badge variant={variant}>{label}</Badge>;
}
```

#### packages/react/src/components/drafts/DraftToolbar.tsx

New file, complete — real code, not pseudocode (pure presentation, no branching worth deferring).

```tsx
"use client";

import type { VexVersionStatus } from "@vexcms/core";
import { Button } from "../ui";
import { StatusBadge } from "./StatusBadge";

/** One toolbar button's wiring, supplied by the owning edit view. */
export interface DraftToolbarAction {
  /** Fires the view's own mutation handler. */
  onClick: () => void;
  /** Shows the button's spinner while the mutation is in flight. */
  isPending: boolean;
  /** Permission/state gate computed by the view (e.g. `!canEdit`). */
  disabled: boolean;
}

/** Props for {@link DraftToolbar}. */
export interface DraftToolbarProps {
  /**
   * The loaded row's `vex_status`. `undefined` when nothing is stored yet
   * (a versioned global before its first save) — the badge is hidden then,
   * since there is no state to describe.
   */
  status: VexVersionStatus | undefined;
  /** Save Draft button wiring. */
  saveDraft: DraftToolbarAction;
}

/**
 * Draft-workflow controls for a versioned collection document or global:
 * the publish-state badge and one button per draft action. Shared by
 * `CollectionEditView` and `GlobalEditView`; owns no mutations — each view
 * passes its own handlers, since the two write through different endpoints.
 *
 * Renders a fragment so the buttons flow inside the caller's existing
 * header button row, beside its Preview/Revalidate buttons.
 *
 * @param props - See {@link DraftToolbarProps}.
 * @returns The badge (when `status` is set) followed by the action buttons.
 * @throws Never.
 *
 * @example
 * ```tsx
 * <DraftToolbar
 *   status={isDraftDoc ? "draft" : "published"}
 *   saveDraft={{ onClick: handleSaveDraft, isPending: isSavingDraft, disabled: !canEdit }}
 * />
 * ```
 */
export function DraftToolbar(props: DraftToolbarProps) {
  return (
    <>
      {props.status && <StatusBadge status={props.status} />}
      <Button
        type="button"
        variant="outline"
        className="transition-all duration-300"
        isPending={props.saveDraft.isPending}
        disabled={props.saveDraft.disabled}
        onClick={props.saveDraft.onClick}
      >
        Save Draft
      </Button>
    </>
  );
}
```

#### packages/react/src/components/drafts/index.ts

New barrel exporting both; `components/index.ts` gains `export * from "./drafts";`. Draft components live in `components/drafts/`, not `views/` (views is page views only); the edit views import them from `../drafts`.

```ts
export * from "./DraftToolbar";
export * from "./StatusBadge";
```

#### packages/react/src/components/drafts/StatusBadge.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";
import { badgeVariants } from "../ui/badge";
import { cn } from "../../styles/utils";

describe("StatusBadge", () => {
  it("renders a Published badge, using the default (emphasized) Badge variant", () => {
    render(<StatusBadge status="published" />);

    const badge = screen.getByText("Published");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge.className).toBe(badgeVariants({ variant: "default" }));
  });

  it("renders a Draft badge, using the outline Badge variant", () => {
    render(<StatusBadge status="draft" />);

    const badge = screen.getByText("Draft");
    expect(screen.queryByText("Published")).toBeNull();
    expect(badge.className).toBe(cn(badgeVariants({ variant: "outline" })));
  });
});
```

#### packages/react/src/components/views/CollectionEditView.tsx

6 edits; everything else in the file is unchanged.

**1 — imports.** Beside the existing `@tanstack/react-query` import, add `useMutation`. Beside the existing `@convex-dev/react-query` import, add `useConvexMutation`. In the existing `@vexcms/core` named-import block, add `DRAFT_ACTIONS` and `VERSION_STATUSES`. Add three new imports: `DraftToolbar`, `getVexErrorMessage`, and `sonner`'s `toast`.

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
  resolveLivePreviewSettings,
  VERSION_STATUSES,
  vexConvexApi,
} from "@vexcms/core";
```

```tsx
import { DraftToolbar } from "../drafts";
import { getVexErrorMessage } from "../../lib/errors";
import { toast } from "sonner";
```

**2 — track the currently-loaded row's id.** Beside `const collection = config.collections.find(...)`'s `!collection` guard, before the `currentDocument` query, add the tracking state (seeded from the prop, so a non-versioned collection's behavior is unchanged — it just never gets re-pointed). Inside the existing `convexQuery(vexConvexApi.get, { ... })` call, use `id: activeDocumentId`.

```tsx
const [activeDocumentId, setActiveDocumentId] = useState(props.documentId);
```

```tsx
      id: activeDocumentId,
      collection: collection.slug,
```

**3 — draft mutation, anchored right after the existing `update` `useVexMutation` block.** Bypasses `useVexMutation` deliberately: that hook's `operation` param is typed `VexMutationOperation` (`"create" | "remove" | "update" | "upsert"` — `packages/core/src/revalidate/types.ts`), which has no draft-workflow member, and nothing in this spec wires `saveDraft` into the ISR-purge pipeline `useVexMutation` exists for — a draft is never public, so it is never revalidated.

```tsx
const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } = useMutation({
  mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
});
```

**4 — Save Draft handler**, immediately after edit 3.

```tsx
/**
 * Persists the form's currently-dirty field values as a draft, without
 * publishing them. Reuses `changedValues(form)` — the same diff-submit
 * helper the plain `update` path already uses — so a partial patch is
 * sent, matching `saveDraft`'s lenient-partial validation on the server.
 *
 * @returns Promise resolving once the draft row is saved.
 * @throws Never — a rejected mutation is caught and toasted, never
 *   re-thrown, since this is a manually-triggered action, not a form
 *   submit the caller is awaiting a result from.
 */
async function handleSaveDraft(): Promise<void> {
  try {
    const draftId = await saveDraftMutation({
      collection: collection!.slug,
      id: activeDocumentId,
      data: changedValues(form),
    });
    setActiveDocumentId(draftId);
    form.reset();
  } catch (error) {
    toast.error("Save draft failed", { description: getVexErrorMessage(error) });
  }
}
```

**5 — editing gates on the draft action for a versioned collection.** Replaces the existing `canEdit`/`fieldPermissions` block (previously an unconditional `CRUD_ACTIONS.update` check) — a versioned collection's editor writes drafts, never the published row, so every edit affordance (field inputs, the field-level map, and the toolbar) checks `saveDraft`; a non-versioned collection keeps checking `update`. There is no separate `canSaveDraft` variable — `canEdit` IS the draft-gated permission once `isVersioned` is true.

```tsx
const isVersioned = collection.versions.drafts;
const editAction = isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update;
const canEdit = usePermission({
  resource: collection.slug,
  action: editAction,
  data: currentDocument,
});
const fieldPermissions = useFieldPermissions({
  resource: collection.slug,
  action: editAction,
  data: currentDocument,
});
const isDraftDoc = currentDocument.vex_status === VERSION_STATUSES.draft.key;
```

**6 — header button row.** Replaces the existing `<form.Subscribe selector={(state) => state.isDefaultValue} ...>` block. `RevalidateButton` and the live-preview toggle stay unconditional. Only the Save/Cancel portion branches on `isVersioned`. A versioned collection has no Cancel: a discarded edit is just one you don't save as a draft, and `form.reset()` stays reachable through every other path that already calls it.

```tsx
<form.Subscribe
  selector={(state) => state.isDefaultValue}
  children={(isDefaultValue) => (
    <div className="flex flex-wrap items-center gap-2">
      <RevalidateButton collection={collection.slug} doc={currentDocument} />
      {livePreview && (
        <Button
          type="button"
          variant="outline"
          onClick={previewPanel.toggle}
          icon={isSplit ? "Eye" : "EyeOff"}
        >
          Preview
        </Button>
      )}
      {isVersioned ? (
        <DraftToolbar
          status={isDraftDoc ? "draft" : "published"}
          saveDraft={{
            onClick: handleSaveDraft,
            isPending: isSavingDraft,
            disabled: !canEdit || isDefaultValue,
          }}
        />
      ) : (
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
    </div>
  )}
/>
```

**Complete component after this step** — full file, edits applied, everything else verbatim from HEAD:

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  isFieldAllowed,
  resolveLivePreviewSettings,
  VERSION_STATUSES,
  vexConvexApi,
} from "@vexcms/core";
import type { CollectionEditViewProps, CollectionSlug } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { RevalidateButton } from "../RevalidateButton";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import { useFieldsForm } from "../../hooks/useFieldsForm";
import {
  useFieldPermissions,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";
import { useVexConfig } from "../../context/VexConfigContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ui/resizable";
import { useIsMobile } from "../../hooks/use-mobile";
import {
  useLivePreviewPanelMinSize,
  useLivePreviewPanelState,
  writeLivePreviewLayoutCookie,
} from "../../hooks/useLivePreviewPanelState";
import { usePreservedScrollTop } from "../../hooks/usePreservedScrollTop";
import { LivePreviewPanel, resolveLivePreviewUrl } from "../livePreview/LivePreviewPanel";
import { useLivePreviewServerUrl } from "../../hooks/useLivePreviewServerUrl";
import { DraftToolbar } from "../drafts";
import { getVexErrorMessage } from "../../lib/errors";
import { toast } from "sonner";

/**
 * Collection document edit form.
 *
 * Fetches the document when editing via `vexConvexApi.get` (TanStack Query +
 * Convex subscription), initialises a `useFieldsForm` instance with the
 * current field values, and renders an `<AppForm>` with one input component per
 * field. Submits via `vexConvexApi.update`. Field inputs connect to the form
 * through `AppFormContext` — no controller prop needed.
 *
 * When the collection declares `admin.livePreview`, a "Show preview" toggle
 * splits the view into a resizable form/preview pair (a full-screen overlay
 * below the mobile breakpoint).
 *
 * @param props - View props.
 * @param props.collection - The slug of the collection whose fields are
 *   rendered, resolved from `useVexConfig()`.
 * @param props.documentId - Convex document ID to fetch and edit. Omit for new-document mode.
 * @param props.initialData - Server-prefetched document for SSR hydration. `null` means not found.
 * @param props.initialPreviewPanelOpen - Server-read panel open state, so the
 *   split pane renders correctly on first paint.
 * @returns The edit form, or a not-found message when `collection` does
 *   not resolve, or when the document cannot be loaded.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 *
 * @example
 * ```tsx
 * <CollectionEditView collection="posts" documentId="k573abc..." initialData={serverDoc} />
 * ```
 */
export function CollectionEditView<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: CollectionEditViewProps<TCollectionSlug>,
) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collection);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  // The row the editor is currently looking at. Seeded from the prop, so a
  // non-versioned collection's behavior is unchanged — it just never gets
  // re-pointed. `saveDraft` (Step 7) can return a different row id than the
  // one loaded (first draft save on a published document bootstraps a new
  // row); without tracking it locally, the editor would keep looking at the
  // published row and the badge would never flip to Draft after an
  // in-session save.
  const [activeDocumentId, setActiveDocumentId] = useState(props.documentId);

  // This view is generic over `TCollectionSlug` — the collection is only known at
  // runtime, so it queries the generic endpoint (`VexDocument`) directly. The
  // per-slug `get()` wrapper from `@vexcms/core/client` narrows only when the
  // slug is a literal at the call site, which is not the case here.
  const { data: currentDocument } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: activeDocumentId,
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

  // Bypasses `useVexMutation` deliberately: that hook's `operation` param is
  // typed `VexMutationOperation` (`"create" | "remove" | "update" | "upsert"`
  // — `packages/core/src/revalidate/types.ts`), which has no draft-workflow
  // member, and nothing in this spec wires draft/publish/unpublish into the
  // ISR-purge pipeline `useVexMutation` exists for.
  const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });

  /**
   * Persists the form's currently-dirty field values as a draft, without
   * publishing them. Reuses `changedValues(form)` — the same diff-submit
   * helper the plain `update` path already uses — so a partial patch is
   * sent, matching `saveDraft`'s lenient-partial validation on the server.
   *
   * @returns Promise resolving once the draft row is saved.
   * @throws Never — a rejected mutation is caught and toasted, never
   *   re-thrown, since this is a manually-triggered action, not a form
   *   submit the caller is awaiting a result from.
   */
  async function handleSaveDraft(): Promise<void> {
    try {
      const draftId = await saveDraftMutation({
        collection: collection!.slug,
        id: activeDocumentId,
        data: changedValues(form),
      });
      setActiveDocumentId(draftId);
      form.reset();
    } catch (error) {
      toast.error("Save draft failed", { description: getVexErrorMessage(error) });
    }
  }
  const visibleFields = useVisibleFields({
    resource: collection.slug,
    fields: collection.fields,
    data: currentDocument,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useFieldsForm({
    document: currentDocument,
    fields: collection.fields,
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

  // A versioned collection's editor writes drafts, never the published row,
  // so every edit affordance — the field inputs, the field-level map, and the
  // toolbar — checks `saveDraft`; a non-versioned collection checks `update`.
  const isVersioned = collection.versions.drafts;
  const editAction = isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update;
  const canEdit = usePermission({
    resource: collection.slug,
    action: editAction,
    data: currentDocument,
  });
  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: editAction,
    data: currentDocument,
  });
  const isDraftDoc = currentDocument.vex_status === VERSION_STATUSES.draft.key;

  const [tempId] = useState(() => crypto.randomUUID());
  const savedDocumentId = currentDocument._id as string | undefined;
  const formValues = useStore(form.store, (state) => state.values);
  const isMobile = useIsMobile();
  const livePreview = resolveLivePreviewSettings({
    config: config.admin.livePreview,
    kind: "collection",
    slug: collection.slug,
    admin: collection.admin.livePreview,
  });
  const previewPanel = useLivePreviewPanelState({
    slug: collection.slug,
    initialOpen: props.initialPreviewPanelOpen ?? false,
    enabled: livePreview !== undefined,
  });
  const clientPreviewUrl = resolveLivePreviewUrl({
    url: livePreview?.url,
    collectionSlug: collection.slug,
    baseDoc: currentDocument,
    formValues,
    tempId,
  });

  // A `{ server }` resolver reads the database, so it cannot be evaluated
  // here; this issues the Convex round trip for that form only and passes
  // the client-resolved URL straight through otherwise.
  const previewUrl = useLivePreviewServerUrl({
    url: livePreview?.url,
    clientUrl: clientPreviewUrl,
    initialUrl: props.initialPreviewUrl,
    kind: "collection",
    slug: collection.slug,
    documentId: savedDocumentId,
    tempId: tempId,
    formValues,
    debounceMs: livePreview?.debounceMs,
  });
  const previewIsActive = Boolean(livePreview && previewPanel.isOpen && previewUrl);
  const breakpoints = livePreview?.breakpoints ?? config.admin.livePreview.breakpoints;

  const formContent = (
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
  );

  // `main` is the app's only scroll container and has a definite height, so
  // split mode fills it exactly: 100% of `main`'s content box plus the 1.5rem
  // bottom padding it cancels with `-mb-6`, which is what lets the form column
  // run to the bottom edge instead of stopping short of it.
  const isSplit = previewIsActive && !isMobile;

  // BOTH panels need an explicit `defaultSize`: react-resizable-panels renders a
  // panel that has none at flex-grow 0 until it measures the group after mount,
  // which is a preview pane that flashes at zero width on every load.
  const formPanelSize = props.initialPreviewPanelSize ?? DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE;
  // Pixel floors turned into shares of the available width, asymmetric by
  // design: the preview needs more room to stay representative than the form
  // needs to stay usable.
  const { ref: splitRef, minSizes: panelMinSizes } = useLivePreviewPanelMinSize();
  // Toggling the preview swaps which element scrolls, and a freshly mounted
  // scroller starts at zero — so the offset is carried across by hand.
  const formScroll = usePreservedScrollTop();

  return (
    <AppForm form={form} className="relative -mb-6 flex h-[calc(100%+1.5rem)] flex-col">
      <div
        // Outside the scroll container, so it never scrolls away and never
        // moves when a scrollbar appears below it. No bottom margin: the
        // handle's divider starts at the top of the panel group, and a gap
        // here would leave the two rules disconnected at their junction.
        className={
          "z-10 -mx-6 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-y-2 border-b bg-background px-6"
        }
      >
        <h1 className="text-2xl font-bold">
          Edit {collection.labels.singular} -{" "}
          <span className="text-primary">
            {String(currentDocument[collection.admin.useAsTitle] ?? "")}
          </span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex flex-wrap items-center gap-2">
              <RevalidateButton collection={collection.slug} doc={currentDocument} />
              {livePreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={previewPanel.toggle}
                  icon={isSplit ? "Eye" : "EyeOff"}
                >
                  Preview
                </Button>
              )}
              {isVersioned ? (
                <DraftToolbar
                  status={isDraftDoc ? "draft" : "published"}
                  saveDraft={{
                    onClick: handleSaveDraft,
                    isPending: isSavingDraft,
                    disabled: !canEdit || isDefaultValue,
                  }}
                />
              ) : (
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
            </div>
          )}
        />
      </div>
      {isSplit ? (
        // `-mr-6` spends `main`'s right gutter on the preview, so the frame
        // runs to the shell edge. It goes on this wrapper rather than the
        // group: `PanelGroup` pins `width: 100%` inline, and an inline width
        // beats any margin class — the margin shrank its box without widening
        // the element. This div also carries the measurement for
        // `useLivePreviewPanelMinSize`, since `PanelGroup` exposes only an
        // imperative handle as its ref.
        <div ref={splitRef} className="-mr-6 flex min-h-0 flex-1">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-0 flex-1"
            onLayout={([formPanelSize]) => {
              if (formPanelSize !== undefined) {
                writeLivePreviewLayoutCookie({ slug: collection.slug, formPanelSize });
              }
            }}
          >
            <ResizablePanel defaultSize={formPanelSize} minSize={panelMinSizes.form}>
              <div
                ref={formScroll.ref}
                onScroll={formScroll.onScroll}
                className="vex-scroll-area h-full overflow-y-auto pt-4 pr-4 pb-6"
              >
                {formContent}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={100 - formPanelSize} minSize={panelMinSizes.preview}>
              <LivePreviewPanel
                previewUrl={previewUrl as string}
                collectionSlug={collection.slug}
                documentId={savedDocumentId}
                tempId={savedDocumentId ? undefined : tempId}
                debounceMs={livePreview?.debounceMs}
                breakpoints={breakpoints}
                form={form}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      ) : (
        // `-mx-6 px-6`: the scrollbar belongs to this element's right edge, so
        // without the bleed it lands 1.5rem inboard — pressed against the
        // inputs with `main`'s gutter sitting uselessly outside it. Bleeding
        // over the gutter and re-adding the same padding inside puts the
        // scrollbar on the shell edge and keeps the inputs evenly inset.
        <div
          ref={formScroll.ref}
          onScroll={formScroll.onScroll}
          className="vex-scroll-area -mx-6 min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6"
        >
          {formContent}
        </div>
      )}
      {previewIsActive && isMobile && (
        <LivePreviewPanel
          previewUrl={previewUrl as string}
          collectionSlug={collection.slug}
          documentId={savedDocumentId}
          tempId={savedDocumentId ? undefined : tempId}
          debounceMs={livePreview?.debounceMs}
          breakpoints={breakpoints}
          form={form}
          isMobile
          onClose={previewPanel.toggle}
        />
      )}
    </AppForm>
  );
}
```

#### packages/react/src/components/views/GlobalEditView.tsx

6 edits.

**1 — imports.** Add `DRAFT_ACTIONS` to the existing `@vexcms/core` import; `useMutation`/`useConvexMutation` are already imported for the plain `globals.upsert` submit path (`useVexMutation` pulls them in transitively, but the draft save needs its own direct `useMutation(useConvexMutation(...))` pair, matching `CollectionEditView`); add `DraftToolbar`, `getVexErrorMessage`, and `toast`:

```ts
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import {
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  GlobalEditViewProps,
  isFieldAllowed,
  resolveLivePreviewSettings,
  vexConvexApi,
} from "@vexcms/core";
```

```ts
import { DraftToolbar } from "../drafts";
import { getVexErrorMessage } from "../../lib/errors";
import { toast } from "sonner";
```

**2 — load the draft row.** The `globalDoc` query passes `drafts`:

```ts
const { data: globalDoc } = useQuery({
  ...convexQuery(vexConvexApi.globals.get, {
    slug: global.slug,
    drafts: global.versions.drafts,
  }),
  initialData: props.initialData,
});

const hasDrafts = global.versions.drafts;
```

**3 — the plain `update` mutation is unchanged by Option A.** `globals.upsert` always writes the PUBLISHED row directly — for a versioned global this is now the same endpoint a non-draft-aware caller (e.g. a future public-facing form, or this view's own `onSubmit` before the global has ever been saved) would hit, so `getChanges` is NOT conditioned on `hasDrafts` anymore; there is no `getChanges: []` special case. This is the SAME `useVexMutation` block that already existed — reproduced here only because edit 4 is anchored immediately after it:

```ts
const { mutateAsync, isPending } = useVexMutation({
  collection: global.slug,
  getChanges: ({ args }) => [{ after: { ...(globalDoc ?? {}), ...args.data } }],
  mutationFn: vexConvexApi.globals.upsert,
  operation: "upsert",
});
```

**4 — draft mutation + handler, anchored right after edit 3's block.** Bypasses `useVexMutation` for the same reason `CollectionEditView` does: `saveDraft` never purges anything, and `VexMutationOperation` has no draft-workflow member. `{ global, data }` — no row id, since a global is keyed by slug, not `_id`.

```ts
// Bypasses `useVexMutation` deliberately: that hook's `operation` param is
// typed `VexMutationOperation` (`"create" | "remove" | "update" | "upsert"`),
// which has no draft-workflow member, and nothing wires draft saves into
// the ISR-purge pipeline `useVexMutation` exists for. Mirrors
// `CollectionEditView`'s own `saveDraftMutation`.
const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } = useMutation({
  mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
});

/**
 * Persists the form's currently-dirty field values as a draft, without
 * publishing them. Before the global has ever been saved, `globalDoc` is
 * undefined and the dirty-diff (`changedValues`) would be empty even
 * though the field defaults need to persist — the full form value is sent
 * instead, exactly as the non-versioned first-save path does.
 *
 * @returns Promise resolving once the draft row is saved.
 * @throws Never — a rejected mutation is caught and toasted, never
 *   re-thrown, since this is a manually-triggered action, not a form
 *   submit the caller is awaiting a result from.
 */
async function handleSaveDraft(): Promise<void> {
  try {
    const data = globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>);
    await saveDraftMutation({ global: global!.slug, data });
    form.reset();
  } catch (error) {
    toast.error("Save draft failed", { description: getVexErrorMessage(error) });
  }
}

const isDraftDoc =
  (globalDoc as { vex_status?: "draft" | "published" } | undefined)?.vex_status === "draft";
```

**5 — edit permissions follow the draft action.** On BOTH `const canEdit = usePermission({...})` and the `fieldPermissions` call beneath it, the action is `hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update` → `canEdit` and `fieldPermissions` become "can save a draft" for a versioned global instead of "can `update`", which is the whole point of the "role restricted via `changes` on one field gets the same restriction on saveDraft" acceptance criterion (Step 5) — a role granted `saveDraft` but not `update` must still see its editable fields as editable here, not locked read-only by a check against the wrong action. There is no separate `canSaveDraft` variable in this file either — `canEdit` IS the gate, same shape as `CollectionEditView`'s `editAction`.

```ts
const canEdit = usePermission({
  resource: global.slug,
  action: hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
  data: globalDoc as {},
});
const fieldPermissions = useFieldPermissions({
  resource: global.slug,
  action: hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
  data: globalDoc,
});
```

`onSubmit` is unchanged: it still always goes through `mutateAsync` → `vexConvexApi.globals.upsert`. For a versioned global that path is reachable only via an implicit form submit (e.g. Enter inside a text input) rather than the Save Draft button — `DraftToolbar`'s button is `type="button"` and calls `handleSaveDraft` directly, never `form.handleSubmit()`. Accepting that `update`/`upsert` action also requires the user hold the `update` (not `saveDraft`) permission is intentional and matches Option A: `globals.upsert` checks `update`/`create`, never `saveDraft`.

**6 — the header button row, replacing the existing `<form.Subscribe>` block (the `<h1>` above it is unchanged):**

```tsx
<form.Subscribe
  selector={(state) => state.isDefaultValue}
  children={(isDefaultValue) => (
    <div className="flex flex-wrap items-center gap-2">
      {livePreview && (
        <Button
          type="button"
          variant="outline"
          onClick={previewPanel.toggle}
          icon={isSplit ? "Eye" : "EyeOff"}
        >
          Preview
        </Button>
      )}
      {hasDrafts ? (
        <DraftToolbar
          status={globalDoc ? (isDraftDoc ? "draft" : "published") : undefined}
          saveDraft={{
            onClick: handleSaveDraft,
            isPending: isSavingDraft,
            disabled: isDefaultValue || !canEdit,
          }}
        />
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

- `hasDrafts && !globalDoc` (brand-new versioned global, never saved) — `status` is `undefined`, so no badge; Save Draft's first click sends the full form value (`handleSaveDraft`'s `!globalDoc` branch) and creates the draft-only row via `versions.saveDraft`.
- `canEdit` denied → Save Draft and Cancel disable, matching `CollectionEditView`.
- `globalDoc` transitions from `undefined` to a real row mid-session (another admin saves the first draft first) — `useFieldsForm`'s `document` prop already re-syncs defaults on that change; no extra handling needed here.

**Complete component after this step** — full file, edits applied, everything else verbatim from HEAD:

```tsx
"use client";

import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import {
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  GlobalEditViewProps,
  isFieldAllowed,
  resolveLivePreviewSettings,
  vexConvexApi,
} from "@vexcms/core";
import { AppForm } from "../form";
import {
  useFieldPermissions,
  useFieldsForm,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import { useVexConfig } from "../../context/VexConfigContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ui/resizable";
import { useIsMobile } from "../../hooks/use-mobile";
import {
  useLivePreviewPanelMinSize,
  useLivePreviewPanelState,
  writeLivePreviewLayoutCookie,
} from "../../hooks/useLivePreviewPanelState";
import { usePreservedScrollTop } from "../../hooks/usePreservedScrollTop";
import { LivePreviewPanel, resolveLivePreviewUrl } from "../livePreview/LivePreviewPanel";
import { useLivePreviewServerUrl } from "../../hooks/useLivePreviewServerUrl";
import { DraftToolbar } from "../drafts";
import { getVexErrorMessage } from "../../lib/errors";
import { toast } from "sonner";

/**
 * Global document edit form.
 *
 * When the global declares `admin.livePreview`, a "Show preview" toggle splits
 * the view into a resizable form/preview pair (a full-screen overlay below the
 * mobile breakpoint), exactly as `CollectionEditView` does.
 *
 * @param props - View props.
 * @param props.global - The slug of the global whose fields are rendered.
 * @param props.initialData - Server-prefetched document for SSR hydration.
 * @param props.initialPreviewPanelOpen - Server-read panel open state, so the
 *   split pane renders correctly on first paint.
 * @returns The edit form, or a not-found message when `global` does not resolve.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 */
export function GlobalEditView(props: GlobalEditViewProps) {
  const config = useVexConfig();
  const global = config.globals.find((g) => g.slug === props.global);

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
    ...convexQuery(vexConvexApi.globals.get, {
      slug: global.slug,
      drafts: global.versions.drafts,
    }),
    initialData: props.initialData,
  });

  const hasDrafts = global.versions.drafts;

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

  // Bypasses `useVexMutation` deliberately: that hook's `operation` param is
  // typed `VexMutationOperation` (`"create" | "remove" | "update" | "upsert"`),
  // which has no draft-workflow member, and nothing wires draft saves into
  // the ISR-purge pipeline `useVexMutation` exists for. Mirrors
  // `CollectionEditView`'s own `saveDraftMutation`.
  const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });

  /**
   * Persists the form's currently-dirty field values as a draft, without
   * publishing them. Before the global has ever been saved, `globalDoc` is
   * undefined and the dirty-diff (`changedValues`) would be empty even
   * though the field defaults need to persist — the full form value is sent
   * instead, exactly as the non-versioned first-save path does.
   *
   * @returns Promise resolving once the draft row is saved.
   * @throws Never — a rejected mutation is caught and toasted, never
   *   re-thrown, since this is a manually-triggered action, not a form
   *   submit the caller is awaiting a result from.
   */
  async function handleSaveDraft(): Promise<void> {
    try {
      const data = globalDoc
        ? changedValues(form)
        : (form.state.values as Record<string, unknown>);
      await saveDraftMutation({ global: global!.slug, data });
      form.reset();
    } catch (error) {
      toast.error("Save draft failed", { description: getVexErrorMessage(error) });
    }
  }

  const isDraftDoc =
    (globalDoc as { vex_status?: "draft" | "published" } | undefined)
      ?.vex_status === "draft";

  const visibleFields = useVisibleFields({
    resource: global.slug,
    fields: global.fields,
    data: globalDoc,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useFieldsForm<Record<string, unknown>>({
    document: globalDoc,
    fields: global.fields,
    readableFieldKeys,
    onSubmit: async ({ value }) => {
      // A global has no separate create view: before the first save,
      // `globalDoc` is undefined and `value` carries the field defaults,
      // which a diff (built against those same defaults) would omit.
      if (!globalDoc) {
        await mutateAsync({ slug: global.slug, data: value });
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
    action: hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
    data: globalDoc as {},
  });
  const fieldPermissions = useFieldPermissions({
    resource: global.slug,
    action: hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
    data: globalDoc,
  });

  const formValues = useStore(form.store, (state) => state.values);
  const isMobile = useIsMobile();
  const livePreview = resolveLivePreviewSettings({
    config: config.admin.livePreview,
    kind: "global",
    slug: global.slug,
    admin: global.admin.livePreview,
  });
  const previewPanel = useLivePreviewPanelState({
    slug: global.slug,
    initialOpen: props.initialPreviewPanelOpen ?? false,
    enabled: livePreview !== undefined,
  });
  const clientPreviewUrl = resolveLivePreviewUrl({
    url: livePreview?.url,
    collectionSlug: global.slug,
    baseDoc: (globalDoc ?? {}) as Record<string, unknown>,
    formValues,
  });

  // A `{ server }` resolver reads the database, so it cannot be evaluated
  // here; this issues the Convex round trip for that form only and passes
  // the client-resolved URL straight through otherwise.
  const previewUrl = useLivePreviewServerUrl({
    url: livePreview?.url,
    clientUrl: clientPreviewUrl,
    initialUrl: props.initialPreviewUrl,
    kind: "global",
    slug: global.slug,
    documentId: global.slug,
    formValues,
    debounceMs: livePreview?.debounceMs,
  });
  const previewIsActive = Boolean(livePreview && previewPanel.isOpen && previewUrl);
  const breakpoints = livePreview?.breakpoints ?? config.admin.livePreview.breakpoints;

  // See `CollectionEditView`: split mode fills `main`'s content box exactly and
  // cancels its bottom padding, so the form column scrolls on its own and runs
  // to the bottom edge.
  const isSplit = previewIsActive && !isMobile;

  // BOTH panels need an explicit `defaultSize`: react-resizable-panels renders a
  // panel that has none at flex-grow 0 until it measures the group after mount,
  // which is a preview pane that flashes at zero width on every load.
  const formPanelSize = props.initialPreviewPanelSize ?? DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE;
  // See CollectionEditView: per-column pixel floors expressed as shares of the
  // width available, the preview's being the larger of the two.
  const { ref: splitRef, minSizes: panelMinSizes } = useLivePreviewPanelMinSize();
  // See CollectionEditView: the scroll container changes with the split, so
  // the offset is carried across by hand.
  const formScroll = usePreservedScrollTop();

  const formContent = (
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
  );

  return (
    <AppForm form={form} className="relative -mb-6 flex h-[calc(100%+1.5rem)] flex-col">
      <div
        // See CollectionEditView: outside the scroll container, no bottom
        // margin so the divider through the handle meets this border.
        className={
          "z-10 -mx-6 flex shrink-0 flex-wrap items-center justify-between gap-y-2 border-b bg-background px-6 pt-4 pb-3"
        }
      >
        <h1 className="text-2xl font-bold">
          Edit Global - <span className="text-primary">{global.label}</span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex flex-wrap items-center gap-2">
              {livePreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={previewPanel.toggle}
                  icon={isSplit ? "Eye" : "EyeOff"}
                >
                  Preview
                </Button>
              )}
              {hasDrafts ? (
                <DraftToolbar
                  status={globalDoc ? (isDraftDoc ? "draft" : "published") : undefined}
                  saveDraft={{
                    onClick: handleSaveDraft,
                    isPending: isSavingDraft,
                    disabled: isDefaultValue || !canEdit,
                  }}
                />
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
      </div>
      {isSplit ? (
        // See CollectionEditView: `-mr-6` on this wrapper (not the group, whose
        // width is pinned inline) runs the preview to the shell edge, and the
        // same element carries the min-size measurement.
        <div ref={splitRef} className="-mr-6 flex min-h-0 flex-1">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-0 flex-1"
            onLayout={([formPanelSize]) => {
              if (formPanelSize !== undefined) {
                writeLivePreviewLayoutCookie({ slug: global.slug, formPanelSize });
              }
            }}
          >
            <ResizablePanel defaultSize={formPanelSize} minSize={panelMinSizes.form}>
              <div
                ref={formScroll.ref}
                onScroll={formScroll.onScroll}
                className="vex-scroll-area h-full overflow-y-auto pt-4 pr-4 pb-6"
              >
                {formContent}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={100 - formPanelSize} minSize={panelMinSizes.preview}>
              <LivePreviewPanel
                previewUrl={previewUrl as string}
                collectionSlug={global.slug}
                documentId={global.slug}
                debounceMs={livePreview?.debounceMs}
                breakpoints={breakpoints}
                form={form}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      ) : (
        // See CollectionEditView: bleed over `main`'s gutter and re-add the
        // padding inside, so the scrollbar rides the shell edge instead of
        // sitting against the inputs.
        <div
          ref={formScroll.ref}
          onScroll={formScroll.onScroll}
          className="vex-scroll-area -mx-6 min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6"
        >
          {formContent}
        </div>
      )}
      {previewIsActive && isMobile && (
        <LivePreviewPanel
          previewUrl={previewUrl as string}
          collectionSlug={global.slug}
          documentId={global.slug}
          debounceMs={livePreview?.debounceMs}
          breakpoints={breakpoints}
          form={form}
          isMobile
          onClose={previewPanel.toggle}
        />
      )}
    </AppForm>
  );
}
```

#### packages/react/src/components/views/GlobalEditView.test.tsx

One new `describe` block, appended after the existing `GlobalEditView — diff submit` suite. Uses the same custom-`config` pattern the file's own `"still submits when a read-denied field is required"` test already establishes (a `versions: { drafts: true }` variant of `testClientConfig.globals[0]` passed via `config`). Steps 10 and 12 append their own `it()` blocks inside it.

```ts
const versionedGlobal = {
  ...testClientConfig.globals[0],
  versions: { drafts: true },
} as unknown as GlobalConfig;
const versionedConfig = {
  ...testClientConfig,
  globals: [versionedGlobal],
} as never;

describe("GlobalEditView — draft toolbar", () => {
  const t = convexTest(schema, testModules);

  beforeEach(() => {
    convexMutationMock.mockReset().mockResolvedValue("g1");
  });

  it("shows Save Draft and a StatusBadge for a versioned global with a saved row", async () => {
    const stored = {
      _creationTime: 1,
      _id: "g1",
      siteName: "x",
      tagline: "y",
      vex_status: "published",
    };
    const utils = renderView(
      createElement(GlobalEditView, {
        global: versionedGlobal.slug,
        initialData: stored as never,
      }),
      { convex: t, config: versionedConfig },
    );

    expect(utils.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
    expect(utils.queryByRole("button", { name: "Save" })).toBeNull();
    expect(utils.getByText("Published")).toBeInTheDocument();
  });

  it("shows Save Draft without a badge for a brand-new versioned global with no saved row yet", async () => {
    const utils = renderView(createElement(GlobalEditView, { global: versionedGlobal.slug }), {
      convex: t,
      config: versionedConfig,
    });

    expect(utils.getByRole("button", { name: "Save Draft" })).toBeInTheDocument();
    expect(utils.queryByText("Published")).toBeNull();
    expect(utils.queryByText("Draft")).toBeNull();
  });

  it("submits the changed fields through versions.saveDraft when Save Draft is clicked", async () => {
    const stored = {
      _creationTime: 1,
      _id: "g1",
      siteName: "x",
      tagline: "y",
      vex_status: "published",
    };
    const utils = renderView(
      createElement(GlobalEditView, {
        global: versionedGlobal.slug,
        initialData: stored as never,
      }),
      { convex: t, config: versionedConfig },
    );

    fireEvent.change(utils.container.querySelector("#siteName")!, {
      target: { value: "draft name" },
    });
    fireEvent.click(utils.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]).toEqual({
      global: versionedGlobal.slug,
      data: { siteName: "draft name" },
    });
  });

  it("submits the full form value through versions.saveDraft before the global has ever been saved", async () => {
    const utils = renderView(createElement(GlobalEditView, { global: versionedGlobal.slug }), {
      convex: t,
      config: versionedConfig,
    });

    fireEvent.change(utils.container.querySelector("#siteName")!, {
      target: { value: "first name" },
    });
    fireEvent.click(utils.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]?.global).toBe(versionedGlobal.slug);
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toMatchObject({ siteName: "first name" });
  });

  it("keeps the plain Save/Cancel toolbar for a non-versioned global", async () => {
    const stored = {
      _creationTime: 1,
      _id: "g1",
      siteName: "old name",
      tagline: "old tagline",
    };
    const utils = renderView(
      createElement(GlobalEditView, {
        global: testClientConfig.globals[0].slug,
        initialData: stored as never,
      }),
      { convex: t },
    );

    expect(utils.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(utils.queryByRole("button", { name: "Save Draft" })).toBeNull();
  });
});
```

Verify: `pnpm --filter @vexcms/react test`

**Manual (apps/test):** as `admin` — open a published `posts` document, edit `body`, Save Draft → badge flips to Draft, the URL's document id is unchanged but the form now shows the draft row. Reload → the URL's published id loads the published content again; Save Draft from there patches the SAME draft row (Convex dashboard: still exactly one `draft` row pointing at it). The list view shows both rows until Step 16 collapses them — expected. Clear `title` and Save Draft → saves (lenient). Open the `announcement` global, fill `message`, Save Draft → badge appears as Draft; reload → the draft content loads, written via `versions.saveDraft`, and the global's PUBLISHED row (visible on the live site) is untouched. As `contributor` — edit `slug` on a post and Save Draft → rejected toast naming the restriction; edit `body` only → saves.

### Step 9 — Publish, server half `[dev]`

Why: The second draft operation. The design this section used to describe — a
collection-dedicated `publish` mutation, with a global publishing through
`upsertGlobal`'s `action: "publish"` argument — is REJECTED (Option A). It
split one conceptual operation ("promote this draft to published") across two
unrelated code paths with two unrelated permission actions, and it meant
flipping `versions.drafts` on a global would change what `globals.upsert`'s
existing callers do. Publish now follows EXACTLY the shape Step 7 already
established for `saveDraft`: one kind-agnostic implementation,
`publishShared` (`packages/core/src/versions/publish.ts`), that accepts a
`VersionedTargetRows` descriptor and never branches on `target.kind`, behind
one thin dispatcher, `publish()` (`packages/core/src/api/versions/publish.server.ts`),
that resolves `{ collection, id }` or `{ global }` to that descriptor via the
already-built `resolveVersionedTarget` and delegates. `globals.upsert` gains
no `action` argument, grows no publish branch, and is completely untouched by
this step — publishing a global now goes exclusively through
`versions.publish`, exactly like saving its draft already goes exclusively
through `versions.saveDraft`.

`publishShared` takes no `data` of its own. The rejected design let a caller
pass last-minute field edits alongside the publish call; the unified version
doesn't need to, because the thing being promoted is always "whatever is
currently stored on the one active draft row" — the same row `saveDraft`
already writes to. The UI (Step 10) composes `saveDraft` then `publish` when
there are unsaved edits, which keeps this function's contract identical for
either kind and avoids duplicating `saveDraft`'s own merge/validate pipeline
a second time inside `publish`.

Validation stays STRICT (`partial: false, validateKeys: "all"` — decision 4):
a draft may be incomplete, but a published document is what the public sees.
The two write shapes decision 1's two-row model already established are
preserved exactly, just re-targeted through `rows.publishedRow`/`rows.draftRow`
instead of a raw `vex_publishedId` check: when a published row already
exists, the superseded published content is archived to history, the
published row is patched with the draft's validated fields, and the draft row
is deleted; when the draft has never been published (decision: `create`'s new
`versions.defaultStatus: "draft"` path produces exactly this row — a draft
row with no published counterpart), the draft row is promoted **in place**,
keeping its own `_id` — decision 1's id-stability invariant applies from a
document's first publish onward, not starting only on its second. Decision
11 cross-checks this choice directly: it names "the promote-in-place branch
of Step 9" as the thing that must now also emit exactly one history row
(previously it emitted none), which only makes sense if that branch still
exists post-redesign. (**OPEN QUESTION:** one earlier draft of this
redesign's instructions could also be read as "always insert a brand-new
published row, even in the never-published case." That reading was rejected
here because it would silently change `rows.documentId` out from under the
pre-publish draft's own `vex_versions` history trail — `resolveVersionedTarget`
fixes `documentId` to the draft-only row's `_id` before this call ever runs,
and a subsequent fresh insert would orphan every history row recorded before
that point under an `_id` nothing points at any more. If a genuinely
different invariant was intended, flag it for review before implementing;
the promote-in-place reading is the one implemented below, and the one
decision 11's own text confirms.)

`assertNoDraftRelationships` (a document may never actually publish while one
of its `relationship` fields still points at a draft) is relocated from
`api/versions/` to `versions/` and widened from `collection: CollectionConfig`
to `target: CollectionOrGlobal`. Under the rejected design it was
collection-`publish`-only — `upsertGlobal`'s separate publish branch had no
call to it, a tracked gap. Option A's unification removes that gap for free:
there is no longer a second branch to have forgotten to wire it into, so a
global's relationship fields get the same backstop a collection's already
had, as a direct consequence of there being only one code path left to run it
from — not a new, separately-decided scope expansion.

- [ ] `packages/core/src/versions/assertNoDraftRelationships.ts` — new home for
      the draft-relationship safety check, widened from a collection-only
      `collection: CollectionConfig` param to `target: CollectionOrGlobal`, so
      the one shared `publishShared` can call it for either kind.
- [ ] `packages/core/src/versions/assertNoDraftRelationships.test.ts`
- [ ] `packages/core/src/api/versions/assertNoDraftRelationships.ts` — DELETED.
      Superseded by the file above; nothing imports this path any more.
- [ ] `packages/core/src/versions/publish.ts` — new. `publishShared`, the
      `publish` counterpart to Step 7's `saveDraftShared`: same signature
      shape, same "never branches on `target.kind`" discipline, driven
      entirely by the `VersionedTargetRows` descriptor it's handed.
- [ ] `packages/core/src/api/versions/publish.server.ts` — rewritten (a version
      of this file already exists on disk from before this redesign, written
      for the rejected collection-only design; this replaces it). Mirrors
      `saveDraft.server.ts` exactly: resolve config → check `versions.drafts`
      → build `target` → `resolveVersionedTarget` → delegate to
      `publishShared`. No `data` argument.
- [ ] `packages/core/src/api/versions/publish.server.test.ts` — new. Covers
      both a versioned collection and a versioned global through the one
      shared implementation, the same way `saveDraft.server.test.ts` does.
- [ ] `packages/core/src/api/versions/publish.client.ts` — new. Mirrors
      `saveDraft.client.ts`.
- [ ] `packages/core/src/api/server.ts` — imports/re-exports `publish`/
      `PublishServerArgs`; `versionsApi` registers `publish` with the same
      flat-object, collection-or-global wire shape `saveDraft` already uses.
- [ ] `packages/core/src/api/client.ts` — re-exports `publish`.
- [ ] `packages/core/src/api/convex.ts` — `VexPublishArgs` (the `publish`
      sibling of `VexSaveDraftArgs`) + a `publish` entry in the `versions:
      {...}` block Step 7 created. `globals.upsert`'s args type is untouched —
      it has no `action` field in this design, before or after this step.
- [ ] `packages/core/src/api/convex.test.ts` — `REGISTERED_OPERATION_NAMES`
      gains `"publish"`.
- [ ] `apps/test/convex/vex/versions.ts` — export `publish`.
- [ ] `packages/core/src/revalidate/types.ts` — `VexMutationOperation` gains
      `"publish"` (not `"unpublish"` — that is Step 11's own addition to this
      same union).
- [ ] `packages/next/src/cache/createVexRevalidateRoute.ts` — `toCrudAction`
      learns to map `"publish"` to `"update"`, for both the permission check
      and the purge-target resolution — one mapping, same as `"upsert"`
      already gets, not a second split function.
- [ ] `packages/next/src/cache/createVexRevalidateRoute.test.ts` — publish
      permission + purge coverage, reusing the existing `pages`/`access`
      fixture (whose `editor` role already has `update: true`).

#### packages/core/src/versions/assertNoDraftRelationships.ts

````ts
import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import { ADMIN_FIELDS } from "../fields/constants";
import type { CollectionOrGlobal } from "../types/utils";

/**
 * Args for `assertNoDraftRelationships`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface AssertNoDraftRelationshipsArgs<DataModel extends GenericDataModel> {
  /** Convex context — a read-only lookup, safe from a query or a mutation. */
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  /** The collection or global being published, for its field definitions. */
  target: CollectionOrGlobal;
  /** The fully-merged document about to be written (`publishShared`'s `transformedFields`). */
  document: Record<string, unknown>;
}

/**
 * Rejects a publish when any `relationship` field on the document currently
 * stores a reference to a target document that is itself a draft
 * (`vex_status === "draft"`).
 *
 * Developer decision (carried forward unchanged from this spec's original
 * revision round): the relationship-field picker (`useRelationshipPickerOptions`,
 * Step 14) may surface draft targets to an editor ONLY while the document
 * being edited is itself a draft — but that is a client-side convenience,
 * not enforcement. This function is the authoritative, server-side backstop:
 * a document may never actually GO LIVE while one of its relationship fields
 * still points at unpublished content, regardless of when or how that link
 * was created (a stale link from before the target was unpublished is
 * rejected exactly the same as one just picked). Checked generically by
 * field PRESENCE on the fetched target (`vex_status === "draft"`), not by
 * looking the target's own collection up in `VexConfig` — `vex_status` is
 * schema-generated only onto a versioned resource's rows, so its presence
 * already means "this row belongs to a versioned collection or global."
 *
 * Takes `target: CollectionOrGlobal` rather than the original
 * `collection: CollectionConfig` it shipped with: under the rejected
 * collection-only-`publish` design, `upsertGlobal`'s separate publish branch
 * had no call to this function at all — a tracked, deliberate gap. Now that
 * `publishShared` is the ONE place either kind's publish write happens,
 * there is no second branch left to have exempted; a global's relationship
 * fields get the same backstop for free.
 *
 * Throws the SAME normalized `ConvexError` shape `validateFields.ts`
 * produces — `{ message, field }` (its `toFieldValidationError` re-throws
 * every field rejection as that). `publishShared`'s caller
 * (`CollectionEditView`/`GlobalEditView`, Step 10) recognizes this exact
 * shape via `applyVexFieldErrors`, so no new client-side error handling is
 * needed for this check.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param args - `{ ctx, target, document }`.
 * @returns Promise resolving when no relationship field links to a draft.
 * @throws {ConvexError} `{ message, field }` naming the first offending relationship field.
 * @example
 * ```ts
 * await assertNoDraftRelationships({ ctx, target, document: transformedFields });
 * ```
 */
export async function assertNoDraftRelationships<DataModel extends GenericDataModel = GenericDataModel>(
  args: AssertNoDraftRelationshipsArgs<DataModel>,
): Promise<void> {
  const relationshipKeys = Object.entries(args.target.config.fields)
    .filter(([, field]) => field.type === ADMIN_FIELDS.relationship.type)
    .map(([key]) => key);
  if (relationshipKeys.length === 0) return;

  for (const key of relationshipKeys) {
    const ids = args.document[key];
    if (!Array.isArray(ids) || ids.length === 0) continue;
    for (const id of ids) {
      const target = await args.ctx.db.get(id as never);
      if (target === null) continue;
      if ((target as Record<string, unknown>).vex_status === "draft") {
        throw new ConvexError({
          message: `Cannot publish while "${key}" links to a document that is still a draft — publish or unlink it first.`,
          field: key,
        });
      }
    }
  }
}
````

#### packages/core/src/versions/assertNoDraftRelationships.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../api/test/convex/_generated/api";
import schema from "../api/test/convex/schema";
import { assertNoDraftRelationships } from "./assertNoDraftRelationships";
import { defineCollection, defineGlobal, relationship, text } from "../index";

const modules: Record<string, () => Promise<unknown>> = {
  "./api/test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const postsWithRelationship = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    related: relationship({ collection: { slug: "posts" }, hasMany: true }),
  },
  versions: { drafts: true },
});

const bannerWithRelationship = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: {
    message: text(),
    featured: relationship({ collection: { slug: "posts" }, hasMany: true }),
  },
  versions: { drafts: true },
});

describe("assertNoDraftRelationships", () => {
  test("resolves when the collection has no relationship fields", async () => {
    const t = convexTest(schema, modules);
    const plainPosts = defineCollection({ slug: "posts", fields: { title: text() } });
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await expect(
        assertNoDraftRelationships({
          ctx,
          target: { kind: "collection", config: plainPosts },
          document: { title: "Hi" },
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("resolves when every linked document is published", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const linkedId = await ctx.db.insert("posts", { title: "Linked", vex_status: "published" } as never);
      await expect(
        assertNoDraftRelationships({
          ctx,
          target: { kind: "collection", config: postsWithRelationship },
          document: { title: "A", related: [linkedId] },
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("rejects, naming the field, when a linked document is still a draft", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", { title: "Linked", vex_status: "draft" } as never);
      let caught: unknown;
      try {
        await assertNoDraftRelationships({
          ctx,
          target: { kind: "collection", config: postsWithRelationship },
          document: { title: "A", related: [draftId] },
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ field: string }>).data.field).toBe("related");
    });
  });

  test("applies the same check to a global target — the gap the rejected collection-only design left", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", { title: "Linked", vex_status: "draft" } as never);
      let caught: unknown;
      try {
        await assertNoDraftRelationships({
          ctx,
          target: { kind: "global", config: bannerWithRelationship },
          document: { message: "Hi", featured: [draftId] },
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ field: string }>).data.field).toBe("featured");
    });
  });
});
```

#### packages/core/src/api/versions/assertNoDraftRelationships.ts

REMOVED. Its logic moved to `packages/core/src/versions/assertNoDraftRelationships.ts`
above, with `collection: CollectionConfig` widened to `target: CollectionOrGlobal`.
Delete the file; nothing imports this path once `publish.server.ts` (below) is rewritten.

#### packages/core/src/versions/publish.ts

````ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../api/types";
import { DRAFT_ACTIONS } from "../access";
import { prepareEdit } from "../api/prepareEdit";
import type { CollectionOrGlobal } from "../types/utils";
import { assertNoDraftRelationships } from "./assertNoDraftRelationships";
import { VERSION_STATUSES } from "./constants";
import { createVersion, getLatestVersion } from "./model";
import { removeVexFields } from "./removeVexFields";
import type { VersionedTargetRows } from "./resolveVersionedTarget";

/**
 * Kind-agnostic `publish` implementation shared by both versioned
 * collections and versioned globals — the `publish` counterpart to
 * `saveDraftShared` (`versions/saveDraft.ts`). Every per-kind difference
 * (table, user-field extraction, how a patch payload nests) is already
 * resolved into `rows` (see {@link resolveVersionedTarget}); this function
 * never branches on `target.kind`.
 *
 * Takes no `data` of its own — it always promotes whatever is CURRENTLY
 * stored on `rows.draftRow`. A draft row is always a complete copy of the
 * document's fields (bootstrapped as a full copy of the published state, or
 * of `{}` for a brand-new document, and every `saveDraft` patch lands flatly
 * on that same complete set), so passing `rows.toUserFields(draftRow)` as
 * `prepareEdit`'s `incoming` — merged over `storedDoc` (the current
 * published row's fields, or `{}` when none exists yet) via `prepareEdit`'s
 * own `{ ...storedDoc, ...incoming }` step — reproduces the draft's complete
 * content exactly, the same "every field, no partial merge" shape `create`'s
 * own strict pass already has. A caller with pending, not-yet-saved form
 * edits (Step 10's UI) saves them as a draft FIRST, then calls this — never
 * merges them in here.
 *
 * Validates STRICTLY (`partial: false, validateKeys: "all"` — decision 4): a
 * draft may be incomplete, a published document may not.
 *
 * Two write shapes, exactly the two decision 1's two-row model already
 * established, re-targeted through `rows` instead of a raw `vex_publishedId`
 * check:
 * - `rows.publishedRow` exists: the superseded published state is archived
 *   to history (its OWN content and OWN `publishedAt`, before being
 *   overwritten — deliberately redundant with whatever `saveDraftShared`'s
 *   own bootstrap already archived when the draft first branched off, since
 *   decision 11 records one node per transition even when adjacent content
 *   happens to match), the published row is patched with the draft's
 *   validated fields, and the now-redundant draft row is deleted.
 * - `rows.publishedRow` is `null` (the document/global has never been
 *   published — `create`'s `versions.defaultStatus: "draft"` path produces
 *   exactly this row shape): the draft row is promoted IN PLACE — patched to
 *   `vex_status: "published"` — keeping its own `_id`. This is decision 1's
 *   id-stability invariant applied from a document's FIRST publish onward:
 *   the only way a draft-only row's `_id` could become unstable here is if
 *   this function minted a different one for that first publish, and it
 *   does not. Decision 11 independently confirms this branch still exists
 *   post-redesign: it names "the promote-in-place branch of Step 9" as the
 *   thing that must now ALSO emit exactly one history row (previously none),
 *   which only makes sense if there is still a promote-in-place branch.
 *
 * Both branches record exactly one history row (decision 11: every publish
 * is attributed and emits one node, no exceptions).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Resolved target + rows.
 * @returns The published row's `_id`, as a string — stable across every
 *   future publish once this call returns.
 * @throws {ConvexError} `"No draft to publish for this document."` when
 *   `rows.draftRow` is `null`; propagated from `prepareEdit` on strict-
 *   validation failure (`{ message, errors }` or `{ message, field }`);
 *   propagated from `assertNoDraftRelationships` (`{ message, field }`) when
 *   a relationship field still points at a draft.
 * @throws {VexAccessError} When the caller is not permitted to publish.
 * @example
 * ```ts
 * const rows = await resolveVersionedTarget({ ctx, collection: "posts", id });
 * const publishedId = await publishShared({
 *   ctx, config, target: { kind: "collection", config: postsConfig }, rows,
 * });
 * ```
 */
export async function publishShared<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  config: VexConfig;
  target: CollectionOrGlobal;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  rows: VersionedTargetRows<DataModel>;
}): Promise<string> {
  const { ctx, config, target, rows } = props;
  const draftRow = rows.draftRow;
  if (draftRow === null) {
    throw new ConvexError("No draft to publish for this document.");
  }
  const publishedRow = rows.publishedRow;

  const { transformedFields } = await prepareEdit({
    ctx,
    config,
    target,
    action: DRAFT_ACTIONS.publish,
    access: props.access,
    auth: props.auth,
    storedDoc: (publishedRow ? rows.toUserFields(publishedRow) : {}) as never,
    incoming: rows.toUserFields(draftRow),
    partial: false,
    validateKeys: "all",
  });

  await assertNoDraftRelationships({ ctx, target, document: transformedFields });

  const now = Date.now();
  const createdBy =
    typeof props.auth?.user?.["_id"] === "string" ? (props.auth.user["_id"] as string) : undefined;
  const previous = await getLatestVersion({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
  });

  if (publishedRow !== null) {
    // Archive the state THIS write is about to overwrite, with its OWN
    // original `publishedAt` — snapshot before mutate, the same ordering
    // `saveDraftShared` uses when a draft first branches off a published row.
    await createVersion({
      ctx,
      collection: rows.historyCollection,
      documentId: rows.documentId,
      status: VERSION_STATUSES.published.key,
      snapshot: rows.toUserFields(publishedRow),
      publishedAt: publishedRow.vex_publishedAt as number | undefined,
      createdBy,
      parentVersion: previous?.version,
    });
    // `buildDraftPatch` is named for shaping a DRAFT row's patch payload,
    // but nothing about it is draft-specific — it just converts a flat
    // user-fields record into whatever shape this `rows.table` stores a row
    // in (flat for a collection, nested under `data` for `vex_globals`).
    // Reused here unchanged to shape the PUBLISHED row's write the same way.
    await ctx.db.patch(
      publishedRow._id as never,
      { ...rows.buildDraftPatch(publishedRow, transformedFields), vex_publishedAt: now } as never,
    );
    await ctx.db.delete(draftRow._id as never);
    return String(publishedRow._id);
  }

  // Never published before: promote the draft row IN PLACE, keeping its own
  // `_id`. There is no prior published content to archive, so the one
  // history row this records (decision 11) snapshots the content now going
  // live, not a superseded state.
  await ctx.db.patch(
    draftRow._id as never,
    {
      ...rows.buildDraftPatch(draftRow, transformedFields),
      vex_status: VERSION_STATUSES.published.key,
      vex_publishedAt: now,
    } as never,
  );
  await createVersion({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    status: VERSION_STATUSES.published.key,
    snapshot: removeVexFields({ doc: transformedFields }),
    publishedAt: now,
    createdBy,
    parentVersion: previous?.version,
  });
  return String(draftRow._id);
}
````

#### packages/core/src/api/versions/publish.server.ts

```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import type { CollectionOrGlobal } from "../../types/utils";
import { resolveVersionedTarget } from "../../versions/resolveVersionedTarget";
import { publishShared } from "../../versions/publish";

/**
 * Server-side args for `publish`. A discriminated union, identical in shape
 * to `SaveDraftServerArgs` minus `data`/`restoredFrom` (`publish` promotes
 * whatever is currently stored on the draft row — see `publishShared`'s
 * doc comment): the `{ collection, id }` member publishes a versioned
 * collection's active draft, and the `{ global }` member publishes a
 * versioned global's.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type PublishServerArgs<DataModel extends GenericDataModel> = {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
} & (
  | {
      /** The versioned collection slug this call targets. */
      collection: CollectionSlug;
      /** The document id currently loaded — the published row's id, or an active draft's own id. */
      id: GenericId<CollectionSlug>;
    }
  | {
      /** The versioned global slug this call targets. */
      global: GlobalSlug;
    }
);

/**
 * Promotes a versioned collection document's — or a versioned global's —
 * active draft to published. Server-side only.
 *
 * One implementation handles both kinds: it resolves the caller's target
 * (`{ collection, id }` or `{ global }`) to a {@link CollectionOrGlobal} and
 * a `VersionedTargetRows` descriptor (`../../versions/resolveVersionedTarget`),
 * then delegates every validate/write/history step to `publishShared`
 * (`../../versions/publish`) — the one place that logic lives, for either
 * kind. Mirrors `saveDraft.server.ts` exactly.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config } & ({ collection, id } | { global })`. `ctx` must be a mutation context.
 * @returns Promise resolving to the published row's `_id` as a string
 *   (stable across every future publish).
 * @throws {ConvexError} When the collection/global cannot be resolved, does
 *   not declare `versions.drafts: true`, or (collection only) when `id`
 *   does not resolve to a document; propagated from `publishShared` when
 *   there is no draft to publish, or the merged document fails strict
 *   validation.
 * @throws {VexAccessError} When the caller is not permitted to publish.
 * @example
 * ```ts
 * import { publish } from "@vexcms/core/server";
 *
 * export const publishPost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => publish({ ctx, config, collection: "posts", id: args.id }),
 * });
 * ```
 */
export async function publish<DataModel extends GenericDataModel>(
  args: PublishServerArgs<DataModel>,
): Promise<string> {
  let target: CollectionOrGlobal;

  if ("collection" in args) {
    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }
    if (!collection.versions.drafts) {
      throw new ConvexError(
        `Collection "${args.collection}" does not have drafts enabled — set versions: { drafts: true } to use publish`,
      );
    }
    target = { kind: "collection", config: collection };
    const rows = await resolveVersionedTarget({ ctx: args.ctx, collection: args.collection, id: args.id });
    return publishShared({ ctx: args.ctx, config: args.config, target, access: args.access, auth: args.auth, rows });
  }

  const global = args.config.globals.find((g) => g.slug === args.global);
  if (!global) {
    throw new ConvexError(`No global registered with slug "${args.global}"`);
  }
  if (!global.versions.drafts) {
    throw new ConvexError(
      `Global "${args.global}" does not have drafts enabled — set versions: { drafts: true } to use publish`,
    );
  }
  target = { kind: "global", config: global };
  const rows = await resolveVersionedTarget({ ctx: args.ctx, global: args.global });
  return publishShared({ ctx: args.ctx, config: args.config, target, access: args.access, auth: args.auth, rows });
}
```

#### packages/core/src/api/versions/publish.client.ts

```ts
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link publish}. A discriminated union: pass
 * `{ collection, id }` for a versioned collection's active draft, or
 * `{ global }` for a versioned global's.
 *
 * @example
 * ```tsx
 * import { publish, type PublishClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: publish() });
 * await mutateAsync({ collection: "posts", id: draftId });
 * await mutateAsync({ global: "siteSettings" });
 * ```
 */
export type PublishClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  GenericMutationClientParams &
    (
      | {
          /** The versioned collection slug. */
          collection: TCollectionSlug;
          /** The document id currently loaded — the published row's id, or an active draft's own id. */
          id: GenericId<TCollectionSlug>;
        }
      | {
          /** The versioned global slug. */
          global: GlobalSlug;
        }
    );

/**
 * Returns a `mutationFn` for publishing a VexCMS versioned collection
 * document's — or versioned global's — active draft.
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
  return useConvexMutation(vexConvexApi.versions.publish);
}
```

#### packages/core/src/api/versions/publish.server.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { publish } from "./publish.server";
import { defineCollection, defineGlobal, relationship, text } from "../../index";

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text({ required: true }) },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts] } as unknown as VexConfig;

const versionedBanner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text({ label: "Message", required: true }) },
  versions: { drafts: true },
});

const globalFixtureConfig = { collections: [], globals: [versionedBanner] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("publish (server)", () => {
  test("throws when there is no draft to publish, and writes nothing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", { title: "Original", slug: "original", vex_status: "published" });
      await expect(
        publish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId }),
      ).rejects.toThrow(/No draft to publish/);
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Original");
      expect(await ctx.db.query("vex_versions").collect()).toHaveLength(0);
    });
  });

  test("publishing a never-published draft promotes it in place, keeping its own _id, and records one history row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", { title: "Draft content", slug: "draft-content", vex_status: "draft" });

      const returnedId = await publish({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: draftId,
        auth: { user: { _id: "user_1" } },
      });

      expect(returnedId).toBe(draftId);
      const row = await ctx.db.get(draftId);
      expect(row?.vex_status).toBe("published");
      expect(typeof row?.vex_publishedAt).toBe("number");

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) => q.eq("collection", "posts").eq("documentId", String(draftId)))
        .collect();
      expect(versions.map((v) => v.status)).toEqual(["published"]);
      expect(versions[0]?.snapshot).toMatchObject({ title: "Draft content", slug: "draft-content" });
      expect(versions[0]?.publishedAt).toBe(row?.vex_publishedAt);
      expect(versions[0]?.createdBy).toBe("user_1");
    });
  });

  test("publishing a draft with a published parent copies its fields onto the published row, deletes the draft, and preserves the published _id", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", { title: "Original", slug: "original", vex_status: "published" });
      const referencerId = await ctx.db.insert("posts", {
        title: "Referencer",
        slug: "referencer",
        vex_status: "published",
        ref: publishedId,
      } as never);

      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      const returnedId = await publish({ ctx, config: fixtureConfig, collection: "posts", id: draftId as never });

      expect(returnedId).toBe(publishedId);
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Edited");
      expect(row?.vex_status).toBe("published");
      expect(await ctx.db.get(draftId as never)).toBeNull();

      const referencerRow = await ctx.db.get(referencerId as never);
      expect(referencerRow?.ref).toBe(publishedId);
    });
  });

  test("archives the superseded published state with its original publishedAt", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const t0 = 1700000000000;
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
        vex_publishedAt: t0,
      });
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      await publish({ ctx, config: fixtureConfig, collection: "posts", id: draftId as never });

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) => q.eq("collection", "posts").eq("documentId", String(publishedId)))
        .collect();
      // `saveDraft`'s own bootstrap already recorded one "published" row for
      // the pre-edit state; `publish` records a SECOND one for the state it
      // just overwrote — every transition gets its own immutable node
      // (decision 11), even when adjacent content happens to match.
      const publishedVersions = versions.filter((v) => v.status === "published");
      expect(publishedVersions).toHaveLength(2);
      const latest = publishedVersions.reduce((a, b) => (a.version > b.version ? a : b));
      expect(latest.snapshot).toMatchObject({ title: "Original" });
      expect(latest.publishedAt).toBe(t0);
    });
  });

  test("rejects a draft missing a required field, naming it, without writing anything", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", { title: "Original", slug: "original", vex_status: "published" });
      const draftId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { slug: "" },
      });

      let caught: unknown;
      try {
        await publish({ ctx, config: fixtureConfig, collection: "posts", id: draftId as never });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ errors: string }>).data.errors).toContain("slug");
      const row = await ctx.db.get(publishedId);
      expect(row?.title).toBe("Original");
      expect(await ctx.db.get(draftId as never)).not.toBeNull();
    });
  });

  test("rejects publishing while a relationship field points at another draft, naming the field, without writing anything", async () => {
    const t = convexTest(schema, modules);
    const versionedPostsWithRelationship = defineCollection({
      slug: "posts",
      fields: {
        title: text(),
        slug: text({ required: true }),
        related: relationship({ collection: { slug: "posts" }, hasMany: true }),
      },
      versions: { drafts: true },
    });
    const relationshipConfig = { collections: [versionedPostsWithRelationship] } as unknown as VexConfig;

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const aId = await ctx.db.insert("posts", { title: "A", slug: "a", vex_status: "draft" });
      const bId = await ctx.db.insert("posts", { title: "B", slug: "b", vex_status: "published", related: [] } as never);

      const bDraftId = await saveDraft({
        ctx,
        config: relationshipConfig,
        collection: "posts",
        id: bId,
        data: { related: [aId] } as never,
      });

      let caught: unknown;
      try {
        await publish({ ctx, config: relationshipConfig, collection: "posts", id: bDraftId as never });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(ConvexError);
      expect((caught as ConvexError<{ field: string }>).data.field).toBe("related");
      const bRow = await ctx.db.get(bId);
      expect(bRow?.related).toEqual([]);
      expect(await ctx.db.get(bDraftId as never)).not.toBeNull();
    });
  });

  test("throws before writing anything when the collection does not have drafts enabled", async () => {
    const t = convexTest(schema, modules);
    const nonVersionedPosts = defineCollection({ slug: "posts", fields: { title: text() } });
    const config = { collections: [nonVersionedPosts] } as unknown as VexConfig;
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) => publish({ ctx, config, collection: "posts", id: "x" as never })),
    ).rejects.toThrow(/does not have drafts enabled/);
  });
});

describe("publish (server) — global target", () => {
  test("throws when there is no draft to publish", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", { slug: "banner", data: { message: "Live" }, vex_status: "published" }),
    );
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) => publish({ ctx, config: globalFixtureConfig, global: "banner" })),
    ).rejects.toThrow(/No draft to publish/);
  });

  test("publishing a global's first-ever draft promotes it in place, keeping its own _id", async () => {
    const t = convexTest(schema, modules);
    const draftId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "Hello" } }),
    );

    const returnedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      publish({ ctx, config: globalFixtureConfig, global: "banner" }),
    );

    expect(returnedId).toBe(draftId);
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.query("vex_globals").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?._id).toBe(draftId);
    expect(rows[0]?.vex_status).toBe("published");
    expect(rows[0]?.data).toEqual({ message: "Hello" });
  });

  test("publishing a global's draft with a published parent copies its fields onto the published row and deletes the draft", async () => {
    const t = convexTest(schema, modules);
    const publishedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
        vex_publishedAt: 1700000000000,
      }),
    );
    const draftId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "Live, edited" } }),
    );

    const returnedId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      publish({ ctx, config: globalFixtureConfig, global: "banner" }),
    );

    expect(returnedId).toBe(publishedId);
    const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.query("vex_globals").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.data).toEqual({ message: "Live, edited" });
    expect(await t.run((ctx: GenericMutationCtx<GenericDataModel>) => ctx.db.get(draftId as never))).toBeNull();
  });

  test("throws before writing anything when the global does not have drafts enabled", async () => {
    const t = convexTest(schema, modules);
    const nonVersionedBanner = defineGlobal({
      slug: "banner",
      label: "Banner",
      fields: { message: text({ required: true }) },
    });
    const config = { collections: [], globals: [nonVersionedBanner] } as unknown as VexConfig;
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) => publish({ ctx, config, global: "banner" })),
    ).rejects.toThrow(/does not have drafts enabled/);
  });

  test("throws when the global slug does not resolve", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        publish({ ctx, config: globalFixtureConfig, global: "doesNotExist" as never }),
      ),
    ).rejects.toThrow(/No global registered/);
  });
});
```

#### packages/core/src/api/server.ts

Existing file; 3 edits.

**1 — imports**, beside Step 7's `saveDraft` imports:

```ts
import type { PublishServerArgs } from "./versions/publish.server";
import { publish } from "./versions/publish.server";
```

**2 — barrel re-exports**, beside Step 7's `saveDraft` re-export:

```ts
export { type PublishServerArgs, publish } from "./versions/publish.server";
```

**3 — `versionsApi` registers `publish`.** Replace the trailing comment inside
`versionsApi`'s returned object (`// Step 8 appends publish, Step 10
unpublish, Step 16 listVersions / getVersionSnapshot / deleteVersion.`) with
a real `publish` entry, same flat-object wire shape as `saveDraft`:

```ts
    publish: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "publish takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return publish({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
          });
        }
        return publish({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
        });
      },
    }),
    // Step 11 appends `unpublish`, Step 17 `listVersions` / `getVersionSnapshot` / `deleteVersion`.
```

#### packages/core/src/api/client.ts

Existing file; 1 edit — beside Step 7's `saveDraft` re-export:

```ts
export { publish } from "./versions/publish.client";
export type { PublishClientArgs } from "./versions/publish.client";
```

#### packages/core/src/api/convex.ts

Existing file; 2 edits.

**1 — new arg type**, added after `VexSaveDraftArgs`:

```ts
/** Args for `api.vex.versions.publish`. */
export type VexPublishArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      environmentId?: string;
    };
```

**2 — new entry inside the `versions: {...}` block**, after `saveDraft`:

```ts
    publish: anyApi.vex.versions.publish as FunctionReference<
      "mutation",
      "public",
      VexPublishArgs,
      string
    >,
```

`VexGlobalsUpdateArgs` (`globals.upsert`'s wire-args type) is NOT touched by
this step — it has no `action` field in Option A, and never grows one.

#### packages/core/src/api/convex.test.ts

1 edit: `const REGISTERED_OPERATION_NAMES = ["saveDraft", "publish"].sort();`

#### apps/test/convex/vex/versions.ts

1 edit:

```ts
export const { saveDraft, publish } = versionsApi({
  config,
  query,
  mutation,
  getAuth,
});
```

#### packages/core/src/revalidate/types.ts

1 edit — widens the wire-verb union so a publish can travel through the same
revalidation request shape `useVexMutation` already posts. `"unpublish"` is
Step 11's own addition to this same line; `"saveDraft"` is deliberately NOT a
member (a draft is never public, so saving one has nothing to purge and never
calls this endpoint).

```ts
export type VexMutationOperation = "create" | "remove" | "update" | "upsert" | "publish";
```

Add one sentence to the existing doc comment, after the paragraph explaining
`"remove"`/`"upsert"`'s mapping:

```ts
/**
 * ...
 * `"publish"` is named for the draft-workflow action, not the Convex
 * function that performs it (`vexConvexApi.versions.publish`, for either a
 * collection or a global) — the wire verb tracks what happened to the
 * PUBLIC document, which is the only thing `hasPermission`/`resolveTargets`
 * need to know. It maps to the same `"update"` CRUD action `"upsert"`
 * already does (`toCrudAction`, `createVexRevalidateRoute.ts`): a publish
 * purges exactly like an update — both a `before` and an `after` path may
 * exist.
 * ...
 */
```

#### packages/next/src/cache/createVexRevalidateRoute.ts

Existing file; 1 edit — `toCrudAction` learns `"publish"`.

```ts
function toCrudAction(operation: VexMutationOperation): CrudWriteAction {
  if (operation === "remove") return "delete";
  if (operation === "upsert" || operation === "publish") return "update";
  return operation;
}
```

No new import needed — `toCrudAction` already returns plain string literals,
not `CRUD_ACTIONS` constants, and `"publish"` maps to the same `"update"`
return value `"upsert"` already produces. The handler body (the single
`toCrudAction(operation)` call feeding both `hasPermission` and
`resolveTargets`) is unchanged — a publish checks `"update"` permission and
purges exactly like an update, no second mapping function needed.

#### packages/next/src/cache/createVexRevalidateRoute.test.ts

Append inside the existing `describe("createVexRevalidateRoute", ...)` block,
after its last test. Reuses the file's own `pages`/`access`/`editorUser`/
`viewerUser`/`map`/`makeConfig`/`postRequest`/`page`/`signedInEditor`
fixtures — `editor` already has `update: true` on `pages`, which is now also
what `"publish"` checks.

```ts
it('maps operation "publish" to the update permission + purge action', async () => {
  const route = createVexRevalidateRoute({ config: makeConfig(), ...signedInEditor });

  const response = await route.POST(
    postRequest({ changes: [{ after: page("new-page") }], collection: "pages", operation: "publish" }),
  );

  expect(response.status).toBe(200);
  const body = (await response.json()) as VexRevalidateResponse;
  expect(body.revalidated).toEqual(["/pages/new-page"]);
});

it('returns 403 for operation "publish" when the caller lacks update', async () => {
  const route = createVexRevalidateRoute({
    config: makeConfig(),
    getAuth: async () => ({ user: viewerUser }),
    getToken: async () => "token",
  });

  const response = await route.POST(
    postRequest({ changes: [{ after: page("new-page") }], collection: "pages", operation: "publish" }),
  );

  expect(response.status).toBe(403);
});
```

- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/next test`

### Step 10 — Publish UI `[dev]`

Why: Puts Step 9 in front of an editor, for both a versioned collection
document and a versioned global — the rejected design only wired a Publish
button into `CollectionEditView`, with `GlobalEditView` left on
`upsertGlobal`'s `action: "publish"`. Both views now call the SAME
`vexConvexApi.versions.publish` endpoint, the same way they already both
call `vexConvexApi.versions.saveDraft`.

`versions.publish` (Step 9) takes no `data` of its own — it always promotes
whatever is currently on the draft row. So `handlePublish` in both views is a
two-step compose, not a single call: if the form has unsaved changes, save
them as a draft first (the exact same `saveDraftMutation` Save Draft already
uses), THEN publish. This keeps `publishShared`'s contract identical for
either kind — it never needs to know about a caller's in-flight form state —
and means a user who edits a field and clicks Publish directly, without a
separate Save Draft click first, still gets those edits promoted. The two
steps are two separate `try`/`catch`s: a save-draft failure (rare — lenient
validation) gets the same manual toast `handleSaveDraft` already gives it; a
publish failure (Step 9's strict-validation rejection) is surfaced as
field-level errors via `applyVexFieldErrors`, reusing the SAME `FormError`
display every field input already renders through
(`packages/react/src/components/form/FormError.tsx`, which reads
`field.state.meta.errors[0]`) — not a bespoke error UI, since decision 4
promises the rejection "names the missing field," and a toast that vanishes
in four seconds does not. `applyVexFieldErrors` writes to
`form.setFieldMeta(field, ...)`'s `errorMap.onSubmit`, which is what
TanStack Form's own `meta.errors` derivation reads from — the supported way
to inject a server-side error outside the library's own `validate()`
lifecycle. The publish mutation's own generic failure toast (`"Publish
failed"`, via `useVexMutation`'s `errorToast`) still fires alongside the
inline field error; only the save-draft step needed a second manual one,
since it bypasses `useVexMutation` entirely (a draft is never public, so it
has nothing to purge — unchanged from Step 7).

Both views route the publish call through `useVexMutation`, unlike
`saveDraftMutation`'s deliberate bypass: publishing moves a document into
public view and needs the ISR-purge pipeline Step 9 wired `"publish"` into
(`toCrudAction` → `"update"`); saving a draft does not. After a publish,
decision 1's identity-preservation invariant becomes visible in
`CollectionEditView`: the published row's `_id` survives every cycle, so the
component re-points `activeDocumentId` at whatever `publish()` returns
(itself, on a promote-in-place first publish; a different, now-permanent id,
on every publish after that) rather than assuming it never changes.
`GlobalEditView` needs no such tracking — it has no `activeDocumentId` to
begin with, and its live `vexConvexApi.globals.get` query already resolves
to whichever row (draft or published) is current.

`CollectionEditView.tsx`'s edit permission/action is (and stays)
`editAction = isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update`,
one `canEdit` from `usePermission({ action: editAction, ... })` — there is no
separate `canSaveDraft` anywhere in that file. Publish gets its OWN, second
permission check, `canPublish`, against `DRAFT_ACTIONS.publish` — a role can
be granted one draft action without the other (`createVexRevalidateRoute`'s
own Step 9 test already proves a role can have `publish` without `update`).

- [ ] `packages/react/src/lib/errors.ts` — `applyVexFieldErrors`.
- [ ] `packages/react/src/components/drafts/DraftToolbar.tsx` — optional `publish` action.
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — `canPublish`
      permission, a `publish` mutation via `useVexMutation`, a composed
      save-draft-then-publish `handlePublish`, toolbar wiring.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — same, but
      the publish mutation targets `{ global: slug }` (no `id`), and the
      Publish button is omitted entirely while nothing has ever been saved
      (`globalDoc` is `undefined`).
- [ ] `packages/react/src/components/views/GlobalEditView.test.tsx` — publish coverage.

#### packages/react/src/lib/errors.ts

Existing file; 1 edit — a new export beside `getVexErrorMessage`, reusing the
same `StructuredErrorData` shape it already documents.

````ts
import type { AnyFormApi } from "../components/form/AppFormContext";

/**
 * Applies a caught write-mutation error's field-specific detail onto a
 * TanStack Form instance, so the SAME `FormError` display every field input
 * already renders through (`components/form/FormError.tsx`, which reads
 * `field.state.meta.errors[0]`) shows it — no separate error UI. Setting
 * `errorMap.onSubmit` is what TanStack Form's own `errors` derivation reads
 * from (`field.state.meta.errors` is recomputed from `errorMap`'s values on
 * every store update, confirmed against the installed `@tanstack/form-core`
 * version), so this is the supported way to inject a server-side error
 * outside the library's own `validate()` lifecycle.
 *
 * Recognizes exactly the two `ConvexError` shapes `prepareEdit`'s strict
 * pass (`publishShared`, matching `create`'s own strict path) can throw:
 * - `{ message, field }` (`validateFields.ts`'s normalized shape, also what
 *   `assertNoDraftRelationships` throws) — one named field. A project's own
 *   extra `ConvexError` data keys ride alongside and are ignored here.
 * - `{ message, errors }` (a Zod schema failure) — `errors` is
 *   `ZodError.message`, which is `JSON.stringify(issues, null, 2)` by
 *   default (confirmed against the installed `zod` version), so it parses
 *   back into `{ path, message }[]`; every issue's `path[0]` names a
 *   top-level field.
 *
 * Never throws — an error that matches neither shape (or a Zod `errors`
 * string that fails to parse) is a silent no-op; `useVexMutation`'s own
 * generic `"Publish failed"` toast (via its `errorToast` option) already
 * covers that case.
 *
 * @param form - The edit view's form instance.
 * @param error - The value caught from the failed mutation call.
 * @returns Nothing. Field-level errors, if any were found, are already
 *   applied to `form`'s meta by the time this returns.
 *
 * @example
 * ```ts
 * try {
 *   await publishMutation({ collection, id });
 * } catch (error) {
 *   applyVexFieldErrors(form, error);
 * }
 * ```
 */
export function applyVexFieldErrors(form: AnyFormApi, error: unknown): void {
  if (!(error instanceof ConvexError)) return;
  const data = error.data;
  if (data === null || typeof data !== "object") return;
  const { field, errors, message } = data as {
    field?: unknown;
    errors?: unknown;
    message?: unknown;
  };

  if (typeof field === "string") {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      errorMap: {
        ...prev.errorMap,
        onSubmit: typeof message === "string" ? message : "Invalid value",
      },
    }));
    return;
  }

  if (typeof errors === "string") {
    let issues: unknown;
    try {
      issues = JSON.parse(errors);
    } catch {
      return;
    }
    if (!Array.isArray(issues)) return;
    for (const issue of issues) {
      if (
        issue === null ||
        typeof issue !== "object" ||
        !Array.isArray((issue as { path?: unknown }).path) ||
        (issue as { path: unknown[] }).path.length === 0 ||
        typeof (issue as { message?: unknown }).message !== "string"
      ) {
        continue;
      }
      const fieldName = String((issue as { path: unknown[] }).path[0]);
      const issueMessage = (issue as { message: string }).message;
      form.setFieldMeta(fieldName, (prev) => ({
        ...prev,
        errorMap: { ...prev.errorMap, onSubmit: issueMessage },
      }));
    }
  }
}
````

#### packages/react/src/components/drafts/DraftToolbar.tsx

Existing file (built by Step 8); 2 edits.

**1 — prop**, after `saveDraft` in `DraftToolbarProps`:

```tsx
  /**
   * Publish button wiring. Omitted → the button is not rendered (a
   * versioned global with no stored row has nothing to publish yet).
   */
  publish?: DraftToolbarAction;
```

**2 — button**, after Save Draft inside the fragment. Default (primary)
variant — publishing is the consequential action:

```tsx
      {props.publish && (
        <Button
          type="button"
          className="transition-all duration-300"
          isPending={props.publish.isPending}
          disabled={props.publish.disabled}
          onClick={props.publish.onClick}
        >
          Publish
        </Button>
      )}
```

**Complete file after this step**, everything else verbatim from Step 8:

```tsx
"use client";

import type { VexVersionStatus } from "@vexcms/core";
import { Button } from "../ui";
import { StatusBadge } from "./StatusBadge";

/** One toolbar button's wiring, supplied by the owning edit view. */
export interface DraftToolbarAction {
  /** Fires the view's own mutation handler. */
  onClick: () => void;
  /** Shows the button's spinner while the mutation is in flight. */
  isPending: boolean;
  /** Permission/state gate computed by the view (e.g. `!canEdit`). */
  disabled: boolean;
}

/** Props for {@link DraftToolbar}. */
export interface DraftToolbarProps {
  /**
   * The loaded row's `vex_status`. `undefined` when nothing is stored yet
   * (a versioned global before its first save) — the badge is hidden then,
   * since there is no state to describe.
   */
  status: VexVersionStatus | undefined;
  /** Save Draft button wiring. */
  saveDraft: DraftToolbarAction;
  /**
   * Publish button wiring. Omitted → the button is not rendered (a
   * versioned global with no stored row has nothing to publish yet).
   */
  publish?: DraftToolbarAction;
}

/**
 * Draft-workflow controls for a versioned collection document or global:
 * the publish-state badge and one button per draft action. Shared by
 * `CollectionEditView` and `GlobalEditView`; owns no mutations — each view
 * passes its own handlers, since the two write through different endpoints.
 *
 * Renders a fragment so the buttons flow inside the caller's existing
 * header button row, beside its Preview/Revalidate buttons.
 *
 * @param props - See {@link DraftToolbarProps}.
 * @returns The badge (when `status` is set) followed by the action buttons.
 * @throws Never.
 *
 * @example
 * ```tsx
 * <DraftToolbar
 *   status={isDraftDoc ? "draft" : "published"}
 *   saveDraft={{ onClick: handleSaveDraft, isPending: isSavingDraft, disabled: !canEdit }}
 *   publish={{ onClick: handlePublish, isPending: isPublishing, disabled: !canPublish || !isDraftDoc }}
 * />
 * ```
 */
export function DraftToolbar(props: DraftToolbarProps) {
  return (
    <>
      {props.status && <StatusBadge status={props.status} />}
      <Button
        type="button"
        variant="outline"
        className="transition-all duration-300"
        isPending={props.saveDraft.isPending}
        disabled={props.saveDraft.disabled}
        onClick={props.saveDraft.onClick}
      >
        Save Draft
      </Button>
      {props.publish && (
        <Button
          type="button"
          className="transition-all duration-300"
          isPending={props.publish.isPending}
          disabled={props.publish.disabled}
          onClick={props.publish.onClick}
        >
          Publish
        </Button>
      )}
    </>
  );
}
```

#### packages/react/src/components/views/CollectionEditView.tsx

Existing file; 5 edits.

**1 — import**, extending the existing `errors` import:

```tsx
import { applyVexFieldErrors, getVexErrorMessage } from "../../lib/errors";
```

**2 — publish mutation**, after the existing `saveDraftMutation` block
(`const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } =
useMutation({ mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft)
});`):

```tsx
  // Routed through `useVexMutation` — unlike `saveDraftMutation`, which
  // deliberately bypasses it because a draft is never public and has
  // nothing to purge, publishing moves a document into public view and
  // does need one. `versions.publish` (Step 9) takes no `data` — it always
  // promotes whatever is currently on the draft row — so there is no
  // `args.data` to build an "after" doc from here; `handlePublish` saves
  // any pending form edits as a draft FIRST, so by the time this call's own
  // `onSuccess` runs, the form's current values already match what was just
  // written.
  const { mutateAsync: publishMutation, isPending: isPublishing } = useVexMutation({
    collection: collection.slug,
    errorToast: { message: "Publish failed" },
    getChanges: () => [{ after: { ...currentDocument, ...form.state.values } }],
    mutationFn: vexConvexApi.versions.publish,
    operation: "publish",
  });
```

**3 — `canPublish` permission**, after `const isDraftDoc = currentDocument.vex_status
=== VERSION_STATUSES.draft.key;`:

```tsx
  const canPublish = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.publish,
    data: currentDocument,
  });
```

**4 — `handlePublish`**, after `handleSaveDraft`:

```tsx
  /**
   * Publishes the currently-open draft, promoting its fields onto the
   * published row. `versions.publish` takes no `data` of its own, so any
   * not-yet-saved form edits are saved as a draft FIRST (reusing
   * `saveDraftMutation`, the same call Save Draft makes), then promoted —
   * two separate `try`/`catch`es, since a save-draft failure (rare, lenient
   * validation) gets the same manual toast `handleSaveDraft` gives it, while
   * a publish failure (Step 9's strict-validation rejection) is surfaced as
   * field-level errors via {@link applyVexFieldErrors}, reusing the same
   * `FormError` display every field input already renders through.
   *
   * @returns Promise resolving once publish completes (or rejects).
   * @throws Never — every rejection is caught, handled, and never re-thrown.
   */
  async function handlePublish(): Promise<void> {
    const changes = changedValues(form);
    let targetId = activeDocumentId;
    if (Object.keys(changes).length > 0) {
      try {
        targetId = await saveDraftMutation({
          collection: collection!.slug,
          id: activeDocumentId,
          data: changes,
        });
        setActiveDocumentId(targetId);
      } catch (error) {
        toast.error("Save draft failed", { description: getVexErrorMessage(error) });
        return;
      }
    }
    try {
      const publishedId = await publishMutation({ collection: collection!.slug, id: targetId });
      // A never-published draft promotes in place (`publishedId ===
      // targetId`, `setActiveDocumentId` is a no-op); a draft with a
      // published parent copies fields onto the parent and deletes the
      // draft row (`publishedId` differs) — either way the published row's
      // `_id` never changes across repeated publish cycles (decision 1),
      // only WHICH row this component currently points at can change.
      setActiveDocumentId(publishedId);
      form.reset();
    } catch (error) {
      applyVexFieldErrors(form, error);
    }
    // Edge cases: `!isDraftDoc` already disables the calling button —
    // publish is only reachable while viewing a draft row.
  }
```

**5 — toolbar prop.** On the existing `<DraftToolbar ... />`, add after `saveDraft`:

```tsx
                  publish={{
                    onClick: handlePublish,
                    isPending: isPublishing,
                    disabled: !canPublish || !isDraftDoc,
                  }}
```

#### packages/react/src/components/views/GlobalEditView.tsx

Existing file; 5 edits.

**1 — import**, extending the existing `errors` import:

```tsx
import { applyVexFieldErrors, getVexErrorMessage } from "../../lib/errors";
```

**2 — publish mutation**, after the existing `saveDraftMutation` block:

```tsx
  // Publishing changes what the public reads, so — unlike the draft save —
  // it keeps the revalidation purge. `versions.publish` takes only
  // `{ global }` — no document fields — so there's no `args`-derived
  // "after" here either; `handlePublish` saves any pending form edits as a
  // draft FIRST, so the form's current values already match what was just
  // written by the time this call's own `onSuccess` runs.
  const { mutateAsync: publishMutation, isPending: isPublishing } = useVexMutation({
    collection: global.slug,
    errorToast: { message: "Publish failed" },
    getChanges: () => [{ after: { ...(globalDoc ?? {}), ...form.state.values } }],
    mutationFn: vexConvexApi.versions.publish,
    operation: "publish",
  });
```

**3 — `canPublish` permission**, after the existing `isDraftDoc` computation:

```tsx
  const canPublish = usePermission({
    resource: global.slug,
    action: DRAFT_ACTIONS.publish,
    data: globalDoc as {},
  });
```

**4 — `handlePublish`**, after `canPublish`:

```tsx
  /**
   * Promotes the active draft row to published. `versions.publish` takes no
   * `data` of its own, so any not-yet-saved form edits are saved as a draft
   * FIRST (reusing `saveDraftMutation`), then promoted — clicking Publish
   * directly, without a prior Save Draft click, still captures them.
   *
   * @returns Promise resolving once publish completes (or rejects).
   * @throws Never — every rejection is caught, handled, and never re-thrown.
   */
  async function handlePublish(): Promise<void> {
    const changes = globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>);
    if (Object.keys(changes).length > 0) {
      try {
        await saveDraftMutation({ global: global!.slug, data: changes });
      } catch (error) {
        toast.error("Save draft failed", { description: getVexErrorMessage(error) });
        return;
      }
    }
    try {
      await publishMutation({ global: global!.slug });
      form.reset();
    } catch (error) {
      applyVexFieldErrors(form, error);
    }
    // On success the `globals.get` query refetches with `vex_status:
    // "published"`: Publish disables. `!isDraftDoc` already disables the
    // calling button otherwise — publish is only reachable while viewing a
    // draft row.
  }
```

**5 — toolbar prop.** On the existing `<DraftToolbar ... />`, add after
`saveDraft` — omitted entirely while nothing is stored, so a brand-new
versioned global shows only Save Draft:

```tsx
                  publish={
                    globalDoc
                      ? {
                          onClick: handlePublish,
                          isPending: isPublishing,
                          disabled: !canPublish || !isDraftDoc,
                        }
                      : undefined
                  }
```

#### packages/react/src/components/views/GlobalEditView.test.tsx

Append inside the existing `describe("GlobalEditView — draft toolbar", ...)`
block, after its last test. `convexMutationMock` is the single mock behind
BOTH `saveDraftMutation` (plain `useMutation` wrapping `useConvexMutation`)
and `publishMutation` (`useVexMutation`, which also wraps
`useConvexMutation` internally) — a composed save-then-publish click
therefore calls it twice, in order.

```ts
it("hides Publish for a brand-new versioned global with no saved row yet", async () => {
  const utils = renderView(createElement(GlobalEditView, { global: versionedGlobal.slug }), {
    convex: t,
    config: versionedConfig,
  });

  expect(utils.queryByRole("button", { name: "Publish" })).toBeNull();
});

it("enables Publish only while the loaded document is a draft", async () => {
  const draft = { _creationTime: 1, _id: "g1", siteName: "x", tagline: "y", vex_status: "draft" };
  const utils = renderView(
    createElement(GlobalEditView, { global: versionedGlobal.slug, initialData: draft as never }),
    { convex: t, config: versionedConfig },
  );
  expect(utils.getByRole("button", { name: "Publish" })).not.toBeDisabled();
  utils.unmount();

  const published = { ...draft, vex_status: "published" };
  const again = renderView(
    createElement(GlobalEditView, { global: versionedGlobal.slug, initialData: published as never }),
    { convex: t, config: versionedConfig },
  );
  expect(again.getByRole("button", { name: "Publish" })).toBeDisabled();
});

it("calls versions.publish with just the slug when Publish is clicked with no unsaved changes", async () => {
  convexMutationMock.mockReset().mockResolvedValue("g1");
  const draft = { _creationTime: 1, _id: "g1", siteName: "x", tagline: "y", vex_status: "draft" };
  const utils = renderView(
    createElement(GlobalEditView, { global: versionedGlobal.slug, initialData: draft as never }),
    { convex: t, config: versionedConfig },
  );

  fireEvent.click(utils.getByRole("button", { name: "Publish" }));

  await waitFor(() => expect(convexMutationMock).toHaveBeenCalledTimes(1));
  expect(convexMutationMock.mock.calls[0]?.[0]).toEqual({ global: versionedGlobal.slug });
});

it("saves a pending edit as a draft before publishing when the form has unsaved changes", async () => {
  convexMutationMock.mockReset().mockResolvedValueOnce("g1").mockResolvedValueOnce("g1");
  const draft = { _creationTime: 1, _id: "g1", siteName: "x", tagline: "y", vex_status: "draft" };
  const utils = renderView(
    createElement(GlobalEditView, { global: versionedGlobal.slug, initialData: draft as never }),
    { convex: t, config: versionedConfig },
  );

  fireEvent.change(utils.container.querySelector("#siteName")!, { target: { value: "new name" } });
  fireEvent.click(utils.getByRole("button", { name: "Publish" }));

  await waitFor(() => expect(convexMutationMock).toHaveBeenCalledTimes(2));
  expect(convexMutationMock.mock.calls[0]?.[0]).toEqual({
    global: versionedGlobal.slug,
    data: { siteName: "new name" },
  });
  expect(convexMutationMock.mock.calls[1]?.[0]).toEqual({ global: versionedGlobal.slug });
});
```

- Verify: `pnpm --filter @vexcms/react test && pnpm --filter @vexcms/next test`

**Manual (apps/test):** as `admin` — on a post with an active draft, clear
`title` and click Publish → inline error under Title plus a toast, nothing
written; fill it in and Publish → badge flips to Published, and the Convex
dashboard shows the draft row gone (or, on a document's first-ever publish,
unchanged except `vex_status`) and the published row's `_id` unchanged on
every publish after that. Point `relatedPost` at another post that is
currently a draft and Publish → rejected naming `relatedPost`; point
`relatedArticle` at any published article → publishes. As `editor` on
`announcement` (a versioned global) → edit a field and Publish directly
without a prior Save Draft click → the edit is captured and the global
flips to Published. As a role granted `update` but not `publish` → Publish
renders disabled.

### Step 11 — Unpublish, server half `[dev]`

Why: The third draft operation, and the last one `versionsApi` needs before Step 12 can
wire a button to it. Mirrors Steps 5/7's and Step 9's split exactly — a kind-agnostic
`unpublishShared` in `packages/core/src/versions/` driven entirely by the `rows`
descriptor `resolveVersionedTarget` (Step 7) already resolves, plus a thin
`collection`/`global` discriminated-union glue file in `packages/core/src/api/versions/`
— for the same reason saveDraft and publish are split that way: one function serves both
resource kinds, and the glue file's only job is resolving config + target + rows before
handing off. Unlike `saveDraft`/`publish`, unpublish moves no field values — it is a
pure status transition (published row → draft row) — so there is nothing to run through
`prepareEdit`'s merge/validate pipeline; the permission check goes through
`resolveAccessCall` + `hasPermission` directly, with `changes: undefined`, exactly as
this step's original (collection-only) design already called for. Two invariants carry
over unchanged from that original design: unpublish **rejects while an active draft row
exists** for the document (unpublishing under an outstanding draft would leave a `draft`
row whose `vex_publishedId` points at a row that is no longer published — the caller
must publish or discard that draft first), and the row's `vex_publishedAt` is **carried
forward, never rewritten** — it records "was this ever live," which stays true after an
unpublish. What changes under Option A: there is no longer a separate "flip the row to
draft, patch it directly" shape per resource kind — `vex_status` is a top-level system
field on BOTH a versioned collection's rows and `vex_globals`' rows (confirmed by
`resolveVersionedTarget`, Step 7: `targetRow.vex_status`/`draftRow.vex_status` are read
identically in both branches), so the same one-line `ctx.db.patch(id, { vex_status:
"draft" })` closes out either kind. `rows.buildDraftPatch` is deliberately NOT reused for
this — that helper's contract is "merge a content patch into the row" (nested under
`data` for a global), not "set one top-level system field," and reusing it here would
wrap `vex_status` inside `data` on a global, which is wrong. There is no `action`
argument anywhere in this spec's globals surface, on `upsertGlobal` or otherwise —
`versions.unpublish` is the only way to unpublish a global, same endpoint a collection
uses.

- [ ] `packages/core/src/versions/unpublish.ts` — new. `unpublishShared`, the kind-agnostic implementation; never branches on `target.kind`.
- [ ] `packages/core/src/api/versions/unpublish.server.ts` — new. Discriminated-union glue: resolves `collection`/`global` config + `rows`, delegates to `unpublishShared`.
- [ ] `packages/core/src/api/versions/unpublish.client.ts` — new. `useConvexMutation(vexConvexApi.versions.unpublish)` pass-through, mirrors `saveDraft.client.ts`.
- [ ] `packages/core/src/api/versions/unpublish.server.test.ts` — new. Collection coverage (outstanding-draft rejection, never-published rejection, the flip + history row) plus a global-target describe block, mirroring `saveDraft.server.test.ts`'s two-describe-block layout.
- [ ] `packages/core/src/api/convex.ts` — `VexUnpublishArgs` (collection/global union) + `versions.unpublish` wire entry, beside `VexSaveDraftArgs`/`saveDraft`.
- [ ] `packages/core/src/api/server.ts` — imports/re-exports `unpublish`/`UnpublishServerArgs`; `versionsApi` registers `unpublish` with the same `v.union` shape `saveDraft` uses.
- [ ] `packages/core/src/revalidate/types.ts` — `VexMutationOperation` gains `"publish" | "unpublish"` (coordinates with Step 9/10, which adds `"publish"` the same way — redundant additions are harmless).
- [ ] `packages/next/src/cache/createVexRevalidateRoute.ts` — `toCrudAction` maps `"publish"`/`"unpublish"` to `CRUD_ACTIONS.update`, same bucket `"upsert"` already uses.
- [ ] `packages/core/src/api/convex.test.ts` — `REGISTERED_OPERATION_NAMES` gains `"unpublish"` (and `"publish"`, from Step 9/10).
- [ ] `apps/test/convex/vex/versions.ts` — export `unpublish`.

#### packages/core/src/versions/unpublish.ts

```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../api/types";
import { resolveAccessCall } from "../api/utils";
import { DRAFT_ACTIONS, hasPermission } from "../access";
import type { CollectionOrGlobal } from "../types/utils";
import { VERSION_STATUSES } from "./constants";
import { createVersion, getLatestVersion } from "./model";
import type { VersionedTargetRows } from "./resolveVersionedTarget";

/**
 * Kind-agnostic `unpublish` implementation shared by both versioned
 * collections and versioned globals. Every per-kind difference — which
 * table the row lives in, how its user fields are extracted for the
 * history snapshot — is already resolved into `rows` (see
 * {@link resolveVersionedTarget}); this function never branches on
 * `target.kind` itself.
 *
 * Flips the currently-published row's `vex_status` back to `"draft"` and
 * records one `"published"`-status history row capturing the content that
 * was just taken down — the same row shape `saveDraft`'s pre-edit snapshot
 * records, so a document's history reads as an unbroken "what was live,
 * when" timeline across either operation.
 *
 * **Rejects while an active draft row exists** for the document: the
 * caller must publish or discard that draft first, or this unpublish would
 * leave a `draft` row whose `vex_publishedId` points at a row that is no
 * longer published — a state nothing downstream can make sense of.
 * **Rejects when there is no published row** — nothing to take down.
 *
 * No field values move — this is a status-only transition, so unlike
 * `saveDraft`/`publish` there is no `data` payload, no `prepareEdit` call,
 * and no field-level permission gating. The permission check goes straight
 * through `resolveAccessCall` + `hasPermission` with `changes: undefined`:
 * `unpublish` is not in `hasPermission`'s built-in payload-bearing action
 * set (only `create`/`update`), so a field-map-shaped `unpublish` rule
 * simply projects (grants) rather than tripping the "field map but no
 * changes supplied" throw — correct for a status-only action.
 *
 * `vex_publishedAt` is carried forward unchanged, both on the live row and
 * the emitted history row — it records "was this ever live," which stays
 * true after an unpublish, never reset to indicate otherwise.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Resolved target + the rows this call is really touching.
 * @returns The published row's `_id` (now flipped to a draft row), as a string.
 * @throws {ConvexError} When there is no published row to unpublish, or when
 *   an active draft row already exists for the document.
 * @throws {VexAccessError} When the caller is not permitted to unpublish this document.
 */
export async function unpublishShared<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  config: VexConfig;
  target: CollectionOrGlobal;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  rows: VersionedTargetRows<DataModel>;
}): Promise<string> {
  const { ctx, config, target, rows } = props;
  const resource = target.config.slug;

  if (rows.publishedRow === null) {
    throw new ConvexError(
      target.kind === "collection"
        ? `No published document to unpublish for collection "${resource}".`
        : `Global "${resource}" has never been published.`,
    );
  }
  if (rows.draftRow !== null) {
    throw new ConvexError("Publish or discard the active draft before unpublishing.");
  }
  const publishedRow = rows.publishedRow;

  const { access, action } = resolveAccessCall({
    config,
    access: props.access,
    defaultAction: DRAFT_ACTIONS.unpublish,
    resource,
  });
  hasPermission({
    access,
    user: props.auth?.user ?? null,
    organization: props.auth?.organization,
    resource,
    action,
    data: rows.toUserFields(publishedRow),
    changes: undefined,
    throwOnDenied: true,
  });

  const previous = await getLatestVersion({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
  });
  await createVersion({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    status: VERSION_STATUSES.published.key,
    snapshot: rows.toUserFields(publishedRow),
    publishedAt: publishedRow.vex_publishedAt as number | undefined,
    createdBy:
      typeof props.auth?.user?.["_id"] === "string" ? (props.auth.user["_id"] as string) : undefined,
    parentVersion: previous?.version,
  });

  // Deliberately NOT `rows.buildDraftPatch` — that helper merges a CONTENT
  // patch (nested under `data` for a global); `vex_status` is a top-level
  // system field on every versioned row regardless of kind, so one direct
  // patch closes out either branch identically. No `stampUpdatedAt`:
  // `vex_status` is a reserved system field, not a user field, so
  // `updatedAt` (which tracks user field edits) is intentionally left
  // alone. `vex_publishedAt` is also left untouched on this patch, for the
  // same "carried forward, never rewritten backwards" reason.
  await ctx.db.patch(publishedRow._id as never, { vex_status: VERSION_STATUSES.draft.key } as never);

  return String(publishedRow._id);
}
```

#### packages/core/src/api/versions/unpublish.server.ts

```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import type { CollectionOrGlobal } from "../../types/utils";
import { resolveVersionedTarget } from "../../versions/resolveVersionedTarget";
import { unpublishShared } from "../../versions/unpublish";

/**
 * Server-side args for `unpublish`. A discriminated union, identical in
 * shape to `SaveDraftServerArgs` minus the content-carrying fields (no
 * `data`, no `restoredFrom` — unpublish moves no field values): the
 * `{ collection, id }` member unpublishes a versioned collection's
 * document, and the `{ global }` member unpublishes a versioned global.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type UnpublishServerArgs<DataModel extends GenericDataModel> = {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
} & (
  | {
      /** The versioned collection slug. */
      collection: CollectionSlug;
      /** The currently-loaded document's id — the published row's id, in practice. */
      id: GenericId<CollectionSlug>;
    }
  | {
      /** The versioned global slug. */
      global: GlobalSlug;
    }
);

/**
 * Flips a versioned collection's document (or a versioned global) back to
 * `"draft"` status, carrying `vex_publishedAt` forward and recording one
 * history row. Server-side only.
 *
 * Resolves `collection`/`global` config (throwing when the slug is unknown
 * or has `versions.drafts: false`), resolves `rows` via
 * `resolveVersionedTarget`, and delegates every real decision to
 * `unpublishShared` — this file's only job is picking which target
 * `resolveVersionedTarget` resolves against.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ collection, id }` or `{ global }`, plus `ctx`/`config`/`access`/`auth`.
 * @returns Promise resolving to the published row's `_id` (now a draft row), as a string.
 * @throws {ConvexError} When the collection/global is unknown, does not have
 *   `versions.drafts` enabled, has no published row, or has an active draft row.
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
export async function unpublish<DataModel extends GenericDataModel>(
  args: UnpublishServerArgs<DataModel>,
): Promise<string> {
  if ("collection" in args) {
    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }
    if (!collection.versions.drafts) {
      throw new ConvexError(`Collection "${args.collection}" does not have versions.drafts enabled.`);
    }
    const target: CollectionOrGlobal = { kind: "collection", config: collection };
    const rows = await resolveVersionedTarget({ ctx: args.ctx, collection: args.collection, id: args.id });
    return unpublishShared({ ctx: args.ctx, config: args.config, target, access: args.access, auth: args.auth, rows });
  }

  const global = args.config.globals.find((g) => g.slug === args.global);
  if (!global) {
    throw new ConvexError(`No global registered with slug "${args.global}"`);
  }
  if (!global.versions.drafts) {
    throw new ConvexError(`Global "${args.global}" does not have versions.drafts enabled.`);
  }
  const target: CollectionOrGlobal = { kind: "global", config: global };
  const rows = await resolveVersionedTarget({ ctx: args.ctx, global: args.global });
  return unpublishShared({ ctx: args.ctx, config: args.config, target, access: args.access, auth: args.auth, rows });
}
```

#### packages/core/src/api/versions/unpublish.client.ts

```ts
import type { GenericId } from "convex/values";

import { vexConvexApi } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { GenericMutationClientParams } from "../types";
import { useConvexMutation } from "@convex-dev/react-query";

/**
 * Client-side args for {@link unpublish}. A discriminated union, mirroring
 * `SaveDraftClientArgs`: pass `{ collection, id }` for a versioned
 * collection's document, or `{ global }` for a versioned global.
 *
 * @example
 * ```tsx
 * import { unpublish, type UnpublishClientArgs } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: unpublish() });
 * await mutateAsync({ collection: "posts", id: publishedId });
 * await mutateAsync({ global: "siteSettings" });
 * ```
 */
export type UnpublishClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  GenericMutationClientParams &
    (
      | {
          /** The versioned collection slug. */
          collection: TCollectionSlug;
          /** The currently-loaded document's id — the published row's id, in practice. */
          id: GenericId<TCollectionSlug>;
        }
      | {
          /** The versioned global slug. */
          global: GlobalSlug;
        }
    );

/**
 * Returns a `mutationFn` for unpublishing a VexCMS versioned collection's
 * document, or a versioned global.
 *
 * Wraps `useConvexMutation(vexConvexApi.versions.unpublish)`. Call at the
 * top level of a React component (obeys the Rules of Hooks); pass the
 * return value as `mutationFn` to `useMutation`.
 *
 * Import from `@vexcms/core/client`. For the server-side version, import
 * `unpublish` from `@vexcms/core/server`.
 *
 * @returns A mutation function compatible with tanstack-query `useMutation`.
 * @see {@link UnpublishClientArgs} for the typed args shape.
 */
export function unpublish() {
  return useConvexMutation(vexConvexApi.versions.unpublish);
}
```

#### packages/core/src/api/versions/unpublish.server.test.ts

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { saveDraft } from "./saveDraft.server";
import { unpublish } from "./unpublish.server";
import { defineCollection, defineGlobal, text } from "../../index";

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});

const fixtureConfig = { collections: [versionedPosts], globals: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("unpublish (server) — collection target", () => {
  test("rejects while a draft row exists for the document", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });
      await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited" },
      });

      await expect(
        unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId }),
      ).rejects.toThrow(ConvexError);

      const publishedRow = await ctx.db.get(publishedId);
      expect(publishedRow?.vex_status).toBe("published");
    });
  });

  test("flips the published row to draft and records a history row with publishedAt carried forward", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const t0 = 1700000000000;
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
        vex_publishedAt: t0,
      });

      const returnedId = await unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId });
      expect(returnedId).toBe(String(publishedId));

      const row = await ctx.db.get(publishedId);
      expect(row?.vex_status).toBe("draft");
      expect(row?.vex_publishedAt).toBe(t0);

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "posts").eq("documentId", String(publishedId)),
        )
        .collect();
      expect(versions).toHaveLength(1);
      expect(versions[0]?.status).toBe("published");
      expect(versions[0]?.publishedAt).toBe(t0);
    });
  });

  test("round-trips through a second saveDraft without producing a second draft row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Original",
        slug: "original",
        vex_status: "published",
      });

      await unpublish({ ctx, config: fixtureConfig, collection: "posts", id: publishedId });
      const returnedId = await saveDraft({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        id: publishedId,
        data: { title: "Edited again" },
      });

      expect(returnedId).toBe(publishedId);
      const rows = await ctx.db.query("posts").collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.title).toBe("Edited again");
    });
  });

  test("throws when the target document has never been published", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", { title: "Draft", slug: "draft", vex_status: "draft" });

      await expect(
        unpublish({ ctx, config: fixtureConfig, collection: "posts", id: draftId }),
      ).rejects.toThrow(ConvexError);
    });
  });
});

const versionedBanner = defineGlobal({
  slug: "banner",
  fields: { message: text() },
  versions: { drafts: true },
});

const globalFixtureConfig = { collections: [], globals: [versionedBanner] } as unknown as VexConfig;

describe("unpublish (server) — global target", () => {
  test("flips the published vex_globals row to draft, leaving the slug and publishedAt intact", async () => {
    const t = convexTest(schema, modules);
    const publishedAt = 1700000000000;
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
        vex_publishedAt: publishedAt,
      });
    });

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await unpublish({ ctx, config: globalFixtureConfig, global: "banner" });
    });

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const rows = await ctx.db
        .query("vex_globals")
        .withIndex("by_slug", (q) => q.eq("slug", "banner"))
        .collect();
      expect(rows).toHaveLength(1);
      expect(rows[0]?.vex_status).toBe("draft");
      expect(rows[0]?.vex_publishedAt).toBe(publishedAt);
      expect(rows[0]?.data).toEqual({ message: "Live" });

      const versions = await ctx.db
        .query("vex_versions")
        .withIndex("by_document_version", (q) =>
          q.eq("collection", "vex_globals").eq("documentId", "banner"),
        )
        .collect();
      expect(versions).toHaveLength(1);
      expect(versions[0]?.status).toBe("published");
      expect(versions[0]?.publishedAt).toBe(publishedAt);
    });
  });

  test("rejects while an outstanding draft exists for the global", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "banner",
        data: { message: "Live" },
        vex_status: "published",
        vex_publishedAt: 1700000000000,
      });
    });

    await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      saveDraft({ ctx, config: globalFixtureConfig, global: "banner", data: { message: "Live, edited" } }),
    );

    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        unpublish({ ctx, config: globalFixtureConfig, global: "banner" }),
      ),
    ).rejects.toThrow(ConvexError);
  });

  test("throws when the global has never been published", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        unpublish({ ctx, config: globalFixtureConfig, global: "banner" }),
      ),
    ).rejects.toThrow(ConvexError);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

#### packages/core/src/api/convex.ts

Existing file; 2 edits.

**1 — new arg type**, after `VexSaveDraftArgs`:

```ts
/** Args for `api.vex.versions.unpublish`. */
export type VexUnpublishArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      environmentId?: string;
    };
```

**2 — new entry inside the `versions: {...}` block**, after `publish` (Step 9/10):

```ts
    unpublish: anyApi.vex.versions.unpublish as FunctionReference<
      "mutation",
      "public",
      VexUnpublishArgs,
      string
    >,
```

No change to `VexGlobalsUpdateArgs`: it has never carried an `action` field, and this
step does not add one — `versions.unpublish` is the only way to unpublish a global.

#### packages/core/src/api/server.ts

Existing file; 3 edits.

**1 — imports**, beside Step 9/10's `publish` imports:

```ts
import type { UnpublishServerArgs } from "./versions/unpublish.server";
import { unpublish } from "./versions/unpublish.server";
```

**2 — barrel re-exports**, beside Step 9/10's:

```ts
export { unpublish } from "./versions/unpublish.server";
export type { UnpublishServerArgs } from "./versions/unpublish.server";
```

**3 — `versionsApi` registers `unpublish`**, inside the returned object, after the
`publish` entry Step 9/10 adds (directly after `saveDraft` if Step 9/10 has not landed
yet — the integrator reconciles ordering). Update the trailing comment to drop the now-
covered steps:

```ts
    unpublish: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "unpublish takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return unpublish({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
          });
        }
        return unpublish({ auth, ctx, config, global: args.global as GlobalSlug });
      },
    }),
    // Step 17 appends listVersions / getVersionSnapshot / deleteVersion.
```

#### packages/core/src/revalidate/types.ts

1 edit — `VexMutationOperation` gains `"publish" | "unpublish"` (coordinates with Step
9/10, which adds `"publish"` the same way; adding both here is harmless if Step 9/10's
edit also lands):

```ts
export type VexMutationOperation =
  | "create"
  | "remove"
  | "update"
  | "upsert"
  | "publish"
  | "unpublish";
```

#### packages/next/src/cache/createVexRevalidateRoute.ts

Existing file; 1 edit — `toCrudAction` learns `"publish"`/`"unpublish"`, mapped into the
same `"update"` bucket `"upsert"` already uses, so publish/unpublish go through the exact
same permission check and ISR-purge target resolution an `update` does:

```ts
function toCrudAction(operation: VexMutationOperation): CrudWriteAction {
  if (operation === "remove") return "delete";
  if (operation === "upsert" || operation === "publish" || operation === "unpublish") return "update";
  return operation;
}
```

#### packages/core/src/api/convex.test.ts

1 edit: `const REGISTERED_OPERATION_NAMES = ["saveDraft", "publish", "unpublish"].sort();`
(Step 9/10 adds `"publish"` the same way — a single edit either sibling lands first is
sufficient; the integrator reconciles.)

#### apps/test/convex/vex/versions.ts

1 edit:

```ts
export const { saveDraft, publish, unpublish } = versionsApi({
  config,
  query,
  mutation,
  getAuth,
});
```

**Verify:** `pnpm --filter @vexcms/core test`

### Step 12 — Unpublish UI `[dev]`

Why: Last of the three toolbar buttons, consuming Step 11's `versions.unpublish`. Both
`CollectionEditView` and `GlobalEditView` wire it through `useVexMutation` — unlike
`saveDraft`, which deliberately bypasses `useVexMutation` (a draft is never public, so
there's nothing to purge), unpublish moves a document OUT of public view, same as
`"remove"` does, so it needs the same ISR-purge pipeline `publish` (Step 10) already
routes through. That's what Step 11's `VexMutationOperation` + `toCrudAction` additions
exist for. Unpublish is disabled client-side whenever a draft row already exists for the
document — `isDraftDoc` already tracks exactly that boolean in both views (it's the same
condition the toolbar's Save Draft button partly keys off), so no new piece of state is
needed, only a new place it's read. This mirrors the server-side rejection (Step 11): the
button being disabled is a UX nicety, not the enforcement — the server stays the source
of truth, so a draft created in another tab between render and click still surfaces as a
rejected (caught, toasted) mutation rather than a crash.

- [ ] `packages/react/src/components/drafts/DraftToolbar.tsx` — optional `unpublish` action, beside `publish` (Step 10).
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — `unpublish` mutation + handler + toolbar wiring, disabled while `isDraftDoc`.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — same, through `vexConvexApi.versions.unpublish` (never `globals.upsert` — there is no `action` argument on that endpoint anywhere in this spec).
- [ ] `packages/react/src/components/views/GlobalEditView.test.tsx` — unpublish coverage: disabled while the loaded document is a draft, and the mutation call shape.

#### packages/react/src/components/drafts/DraftToolbar.tsx

1 edit on top of Step 10 — prop, after `publish`:

```tsx
  /** Unpublish button wiring. Omitted → the button is not rendered. */
  unpublish?: DraftToolbarAction;
```

and the button, after Publish (same shape as the existing Save Draft/Publish buttons —
see Step 10's edit to this file for the `publish` button JSX this mirrors):

```tsx
{
  props.unpublish && (
    <Button
      type="button"
      variant="outline"
      className="transition-all duration-300"
      isPending={props.unpublish.isPending}
      disabled={props.unpublish.disabled}
      onClick={props.unpublish.onClick}
    >
      Unpublish
    </Button>
  );
}
```

#### packages/react/src/components/views/CollectionEditView.tsx

4 edits on top of Step 10's `publish` wiring.

**1 — permission**, beside `canPublish` (Step 10):

```tsx
const canUnpublish = usePermission({
  resource: collection.slug,
  action: DRAFT_ACTIONS.unpublish,
  data: currentDocument,
});
```

**2 — mutation**, beside `publishMutation` (Step 10). Routed through `useVexMutation` for
the reason this step's `Why:` gives: unpublish moves a document out of public view, so it
needs a purge too, unlike `saveDraftMutation` just above it.

```tsx
const { mutateAsync: unpublishMutation, isPending: isUnpublishing } = useVexMutation({
  collection: collection.slug,
  // The published row is what's currently loaded whenever Unpublish is
  // enabled — the toolbar disables it while a draft exists (edit 4 below) —
  // so `currentDocument` IS the "before" state this purges as a delete.
  getChanges: () => [{ before: currentDocument }],
  mutationFn: vexConvexApi.versions.unpublish,
  operation: "unpublish",
});
```

**3 — handler**, after `handlePublish` (Step 10):

```tsx
/**
 * Unpublishes the currently-open published document, flipping it back to
 * draft.
 *
 * @returns Promise resolving once unpublish completes (or rejects).
 * @throws Never — a rejected mutation is caught and toasted, never re-thrown.
 */
async function handleUnpublish(): Promise<void> {
  try {
    await unpublishMutation({ collection: collection.slug, id: activeDocumentId });
  } catch (error) {
    // Step 11 rejects while a draft row exists; `isDraftDoc` already
    // disables the calling button client-side, but a draft created in
    // another tab between render and click still surfaces as a rejected
    // mutation here — the server stays the source of truth, this is not
    // treated as a bug.
    toast.error("Unpublish failed", { description: getVexErrorMessage(error) });
  }
}
```

**4 — toolbar prop.** On the `<DraftToolbar ... />`, beside Step 10's `publish` prop:

```tsx
          unpublish={{
            onClick: handleUnpublish,
            isPending: isUnpublishing,
            disabled: !canUnpublish || isDraftDoc,
          }}
```

#### packages/react/src/components/views/GlobalEditView.tsx

3 edits on top of Step 10's `publish` wiring. `unpublishAsync` routes through
`vexConvexApi.versions.unpublish` — never `vexConvexApi.globals.upsert` with an `action`
argument, which does not exist anywhere in this spec.

**1 — permission + mutation**, beside `canPublish`/`publishAsync` (Step 10):

```ts
const canUnpublish = usePermission({
  resource: global.slug,
  action: DRAFT_ACTIONS.unpublish,
  data: globalDoc as {},
});
const { mutateAsync: unpublishAsync, isPending: isUnpublishing } = useVexMutation({
  collection: global.slug,
  getChanges: () => (globalDoc ? [{ before: globalDoc }] : []),
  mutationFn: vexConvexApi.versions.unpublish,
  operation: "unpublish",
});
```

**2 — handler**, after `handlePublish` (Step 10):

```ts
/**
 * Flips the published row back to a draft. Disabled client-side while an
 * outstanding draft exists (mirrors the server-side rejection this action
 * hits otherwise), so the handler itself has no rejection path beyond
 * what `useVexMutation`'s own `onError` toast already surfaces.
 *
 * @returns Resolves once the mutation settles.
 * @throws Never.
 */
async function handleUnpublish() {
  await unpublishAsync({ global: global.slug });
  // On success, `globalDoc.vex_status` becomes `"draft"` once the `get`
  // query refetches — Publish enables, Unpublish disables.
}
```

**3 — toolbar prop**, beside Step 10's `publish` prop and gated the same way:

```tsx
                  unpublish={
                    globalDoc
                      ? {
                          onClick: handleUnpublish,
                          isPending: isUnpublishing,
                          disabled: !canUnpublish || isDraftDoc,
                        }
                      : undefined
                  }
```

#### packages/react/src/components/views/GlobalEditView.test.tsx

Append inside the `describe("GlobalEditView — draft toolbar", ...)` block:

```ts
it("disables Unpublish while the loaded document is a draft", async () => {
  const stored = {
    _creationTime: 1,
    _id: "g1",
    siteName: "x",
    tagline: "y",
    vex_status: "draft",
  };
  const utils = renderView(
    createElement(GlobalEditView, {
      global: versionedGlobal.slug,
      initialData: stored as never,
    }),
    { convex: t, config: versionedConfig },
  );

  expect(utils.getByRole("button", { name: "Unpublish" })).toBeDisabled();
});

it("calls versions.unpublish with the global's slug when Unpublish is clicked", async () => {
  const stored = {
    _creationTime: 1,
    _id: "g1",
    siteName: "x",
    tagline: "y",
    vex_status: "published",
  };
  const utils = renderView(
    createElement(GlobalEditView, {
      global: versionedGlobal.slug,
      initialData: stored as never,
    }),
    { convex: t, config: versionedConfig },
  );

  fireEvent.click(utils.getByRole("button", { name: "Unpublish" }));

  await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
  expect(convexMutationMock.mock.calls[0]?.[0]).toEqual({ global: versionedGlobal.slug });
});
```

Verify: `pnpm --filter @vexcms/react test`

**Manual (apps/test):** as `admin` — on a published post with no draft, Unpublish →
badge flips to Draft, `_id` unchanged, `vex_publishedAt` unchanged in the dashboard;
Publish again restores it. With an active draft, Unpublish is disabled. Same pair on
`announcement` (a versioned global). As `editor`, `announcement`'s Unpublish renders
disabled.

### Step 13 — Status filter injection `[dev]`

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
turns off _authorization_, not the framework's own data shape guarantees. That
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

**A note on the draft-only row, verified explicitly rather than assumed.** Option A's
`create` (`api/create/server.ts`) can produce a row where `vex_status === "draft"` but
`vex_publishedId` is `undefined` — a document inserted with
`collection.versions.defaultStatus: "draft"` (the config default) that has never been
published, so there is no published counterpart for it to point at. This case did not exist
in the original two-row design this step was first written against, which only knew
"published row" plus "its one optional draft counterpart." Mechanism 2 above needs no
awareness of the distinction, and no code change, to handle it correctly: it filters purely
on `vex_status`, never on whether `vex_publishedId` is set, so a draft-only row is excluded
from a published-only read by the exact same `vex_status !== "published"` condition that
excludes an ordinary draft with a published parent — same `.filter()`/`withIndex`
composition, same `readDrafts` gate required to see it at all. `requiresPublishedOnly`/
`composeStatusConstraint` (edits 3–4 below) and `populateDocs`'s own
`vex_status === undefined || vex_status === "published"` check (already shipped, edit below)
both already satisfy this without modification — the test added to `find/server.test.ts`
below exists to pin that down explicitly, since it is a new reachable state the original
test list never exercised, not because the implementation needs to change.

`search` never contests a `withIndex` slot — its `buildQuery` uses `.withSearchIndex`, and
Convex forbids combining `.withIndex` and `.withSearchIndex` on one query, so there is no
framework-owned slot there to claim structurally. `search`'s status condition is therefore
always folded into `.filter()`, never structural — consistent with `search/server.ts`
already only importing `resolveAccessConstraint`, never `resolveAccessIndex`.

A third gap, found while re-grounding this step against the live tree (not named in
design-review.md): `populateDocs` (`api/populate.ts`) resolves every relationship field via
`getAll(ctx.db, ids)` — a raw batch `ctx.db.get`, with no status filter and no RBAC check at
all. A public `find`/`get`/`search` call that never requests `drafts` still calls `populate`
through this same unfiltered path, so a relationship field pointing at a document that is
CURRENTLY a draft (bootstrapped by `saveDraft`, or flipped back to `draft` by `unpublish`,
Step 11 — the pointed-at row's `_id` never changes either way) has its full draft content
returned to the populating caller regardless of their `readDrafts` grant. This is the same
data-integrity class of bug mechanism 2 above fixes for the top-level query, on a second,
independent code path mechanism 2 never touches — closed below alongside it, not deferred,
since an unfixed `populateDocs` would silently reopen the exact leak this step exists to close.
The fix reuses the SAME `drafts` boolean already threaded onto `find`/`get`/`search`/`getGlobal`
above — a nested `populate` call inherits its caller's `drafts` intent rather than resolving a
second, independent RBAC decision per target collection; documenting this as the deliberate
scope of a v1 fix, not an oversight, is the edge-case note on `populateDocs` below.

- [ ] `packages/core/src/api/populate.ts` — add a `drafts?: boolean` parameter; a fetched
      relationship target carrying `vex_status !== "published"` is excluded unless `drafts`
      is `true` — closes the populate-time leak the Why above names.
- [ ] `packages/core/src/api/populate.test.ts` — a populated target that is currently a
      draft is excluded by default and included when `drafts: true` is passed.
- [ ] `packages/core/src/api/find/server.ts` — add `drafts?: boolean` arg; add
      `requiresPublishedOnly` and `composeStatusConstraint`; wire both into `find`'s
      existing resolve block; thread `args.drafts` into its `populateDocs` call.
- [ ] `packages/core/src/api/get/server.ts` — add `drafts?: boolean` arg; a versioned
      collection's row is treated as not found when its status isn't published and
      `drafts` wasn't requested; thread `args.drafts` into its `populateDocs` call.
- [ ] `packages/core/src/api/search/server.ts` — add `drafts?: boolean` arg; the status
      condition is always folded into `.filter()`; thread `args.drafts` into its
      `populateDocs` call.
- [ ] `packages/core/src/api/globals/get.server.ts` — thread `args.drafts` into its two
      `populateDocs` calls (depth-populate and explicit `populate`).
- [ ] `packages/core/src/api/find/server.test.ts` — public read (including a
      `bypass: true` call) returns no draft rows and no duplicate logical documents;
      `drafts: true` with `readDrafts` returns both; a caller-supplied `withIndex` still
      gets the status filter via `.filter()`; a draft-only row (never published, Option A's
      `defaultStatus: "draft"` case) is excluded by default and visible with `drafts: true` +
      `readDrafts`.

#### packages/core/src/api/populate.ts

One edit — `populateDocs` gains a `drafts` parameter and one filter line; everything else
(the recursion, the `getAll` batch fetch, the cast at the bottom) is unchanged.

```ts
export async function populateDocs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> =
    PopulateShape<TCollectionSlug>,
>(
  ctx: GenericQueryCtx<DataModel>,
  docs: Record<string, unknown>[],
  populate: TPopulate,
  /**
   * Forwarded from the top-level `find`/`get`/`search`/`getGlobal` call's own
   * `drafts` arg (Step 13) — a nested `populate` inherits its caller's intent
   * rather than resolving a second RBAC decision per target collection. When
   * falsy, a resolved target carrying `vex_status !== "published"` is dropped,
   * same as a missing/deleted id — this drops a draft-only row (never
   * published, no `vex_publishedId`) exactly like an ordinary draft, since
   * both share the same `vex_status: "draft"` value this check reads. Checked
   * by field presence, not by looking `collection.versions.drafts` up in
   * `VexConfig`: unlike `find`'s structural filter, `populateDocs` fetches
   * arbitrary ids across possibly many target collections it has no static
   * knowledge of (the populate shape names field keys, not collections) —
   * but `vex_status` is schema-generated (Step 2) ONLY onto a versioned
   * collection's table, so its mere presence on a fetched document already
   * means "this row belongs to a versioned collection," making the
   * field-presence check equivalent to the config lookup in every real case,
   * without requiring one.
   */
  drafts?: boolean,
): Promise<Populated<TCollectionSlug, TPopulate>[]> {
  const result = await asyncMap(docs, async (doc) => {
    const out: Record<string, unknown> = { ...doc };
    for (const [fieldKey, opts] of Object.entries(populate)) {
      const ids = doc[fieldKey];
      if (!Array.isArray(ids)) continue;

      const targets = await getAll(
        ctx.db,
        ids as GenericId<TableNamesInDataModel<DataModel>>[],
      );
      const filtered = targets.filter((t): t is NonNullable<typeof t> => {
        if (t === null) return false;
        if (drafts) return true;
        const status = (t as Record<string, unknown>).vex_status;
        return status === undefined || status === "published";
      });

      if (
        typeof opts === "object" &&
        opts !== null &&
        "populate" in opts &&
        opts.populate &&
        filtered.length > 0
      ) {
        out[fieldKey] = await populateDocs(
          ctx,
          filtered,
          opts.populate,
          drafts,
        );
      } else {
        out[fieldKey] = filtered;
      }
    }
    return out;
  });
  return result as unknown as Populated<TCollectionSlug, TPopulate>[];
}
```

#### packages/core/src/api/populate.test.ts

One edit — a new `describe` block appended after the existing coverage. Real, concrete
assertions — `populateDocs` is already fully implemented; this adds behavior to a working
function, the same treatment the rest of this file already has.

```ts
describe("populateDocs — draft exclusion", () => {
  test("excludes a populated target that is currently a draft", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", {
        name: "Lena Park",
        vex_status: "draft",
      });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });

    const populated = (result as any[])[0]
      .author as DocumentBySlug["authors"][];
    expect(populated).toHaveLength(0);
  });

  test("includes a draft target when drafts: true is passed", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", {
        name: "Lena Park",
        vex_status: "draft",
      });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(
        ctx,
        [post!],
        { author: true } as PopulateShape,
        true,
      );
    });

    const populated = (result as any[])[0]
      .author as DocumentBySlug["authors"][];
    expect(populated[0].name).toBe("Lena Park");
  });

  test("includes a published target by default — the common case is unaffected", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx) => {
      const authorId = await ctx.db.insert("authors", {
        name: "Lena Park",
        vex_status: "published",
      });
      const postId = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        author: [authorId],
      });
      const post = await ctx.db.get(postId);
      return populateDocs(ctx, [post!], { author: true } as PopulateShape);
    });

    const populated = (result as any[])[0]
      .author as DocumentBySlug["authors"][];
    expect(populated[0].name).toBe("Lena Park");
  });
});
```

#### packages/core/src/api/find/server.ts

6 edits. Everything else in the file — the two `find` overloads, the return-value logic, and
the count-query rebuild — is unchanged; they consume the same `resolvedIndex` and
`accessFilter` names as before, now produced by the block in edit 5.

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
  // - A draft-only row (`vex_status: "draft"`, `vex_publishedId` undefined, Option
  //   A's `defaultStatus: "draft"` case) needs no special case here: this function
  //   only decides WHETHER the published-only constraint applies to the query as a
  //   whole, never which individual rows qualify — that's `composeStatusConstraint`'s
  //   `vex_status === "published"` condition below, which already treats a
  //   draft-only row identically to an ordinary draft.
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
}): {
  resolvedIndex: QueryIndex | undefined;
  accessFilter: AccessFilterFn | undefined;
} {
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
  // - A draft-only row (`vex_status: "draft"`, no `vex_publishedId`) is excluded by
  //   cases 2 and 3 identically to an ordinary draft — both conditions test
  //   `vex_status === "published"` only, never `vex_publishedId`'s presence.
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
  defaultAction:
    args.drafts === true ? DRAFT_ACTIONS.readDrafts : CRUD_ACTIONS.read,
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
const callerIndex = args.withIndex as
  { name: string; range?: IndexRangeFn } | undefined;
const rbacResolvedIndex = pickQueryIndex({ accessIndex, callerIndex });
const rbacFilter = resolveAccessConstraint({
  access,
  user: args.auth?.user ?? null,
  organization: args.auth?.organization,
  resource,
  action,
  indexAlreadyApplied:
    accessIndex !== undefined && rbacResolvedIndex?.name === accessIndex.name,
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

**6 — the `populateDocs` call**, unchanged in every other respect (still guarded by the same
`!effectivePopulate || Object.keys(effectivePopulate).length === 0` branch):

```ts
      : ((await populateDocs(args.ctx, docs, effectivePopulate, args.drafts)) as unknown as FindReturn<
          TCollectionSlug,
          TPopulate,
          D
        >);
```

#### packages/core/src/api/get/server.ts

5 edits. Everything else in the file — the depth/populate resolution and its `Id<TableName>`
extraction comment — is unchanged.

**1 — imports.** Add `DRAFT_ACTIONS` to the existing `../../access` import, and import the
shared helper from `find/server.ts`.

```ts
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  hasPermission,
  resolveFieldPermissions,
  stripDeniedFields,
} from "../../access";
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
This same `vex_status !== "published"` comparison is also what correctly excludes a
draft-only row (never published, no `vex_publishedId`) fetched by its own `_id` without
`drafts: true` — identical treatment to an ordinary draft, no extra branch required.

```ts
if (
  doc &&
  requiresPublishedOnly({
    config: args.config,
    collection: args.collection,
    drafts: args.drafts,
  }) &&
  (doc as Record<string, unknown>).vex_status !== "published"
) {
  // A draft row fetched by a caller not requesting drafts does not exist for
  // them — "not found" semantics, not a thrown error: the row IS the wrong
  // logical state to serve, not a permission boundary `hasPermission` already
  // ruled on above.
  doc = null;
}
```

**5 — the `populateDocs` call**, unchanged in every other respect:

```ts
const [populated] = await populateDocs<DataModel, TCollectionSlug, TPopulate>(
  args.ctx,
  [doc],
  effectivePopulate,
  args.drafts,
);
```

#### packages/core/src/api/search/server.ts

4 edits. `buildQuery` itself — including its `.withSearchIndex` branch — is unchanged; it
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
  defaultAction:
    args.drafts === true ? DRAFT_ACTIONS.readDrafts : CRUD_ACTIONS.read,
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
if (
  requiresPublishedOnly({
    config: args.config,
    collection: args.collection,
    drafts: args.drafts,
  })
) {
  const statusFilter: AccessFilterFn = (q) =>
    q.eq(q.field("vex_status"), "published");
  accessFilter = rbacFilter
    ? (q) => q.and(rbacFilter(q), statusFilter(q))
    : statusFilter;
}
const searchQuery = buildQuery({
  ...args,
  accessFilter,
});
```

**4 — the `populateDocs` call**, unchanged in every other respect:

```ts
      : ((await populateDocs(args.ctx, docs, effectivePopulate, args.drafts)) as DocReturnItem<
          TCollectionSlug,
          TPopulate,
          D
        >[]);
```

#### packages/core/src/api/find/server.test.ts

New `describe` block, appended after the file's existing coverage — complete and
runnable. Fixtures build on the shared `posts` table (Step 4 extends it with
`vex_status`/`vex_publishedAt`/`vex_publishedId` + `by_status`/`by_published`, and it
already carries a `by_slug` index from the base fixture); each test's own `config`
fixture declares `defineCollection({ slug: "posts", ..., versions: { drafts: true } })`
separately from the raw table schema.

```ts
const versionedPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
  versions: { drafts: true },
});

const versionedAuthorsResource = defineCollection({
  slug: "authors",
  fields: { name: text() },
});

const versionedConfig = {
  collections: [versionedPostsResource, versionedAuthorsResource],
} as unknown as VexConfig;

const versionedAccess = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [versionedPostsResource],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { posts: { readDrafts: true } },
    viewer: { posts: { read: true } },
  },
});

const versionedConfigWithAccess = {
  collections: [versionedPostsResource, versionedAuthorsResource],
  access: versionedAccess,
} as unknown as VexConfig;

const editorAuth = { user: { _id: "u1", roles: "editor" } };
const viewerAuth = { user: { _id: "u2", roles: "viewer" } };

describe("find (server) — versioned collection status filtering", () => {
  /**
   * A public read must never surface a draft row, and the published row for a
   * document with an active draft must not appear twice — with or without
   * `access.bypass`, since the status constraint is data integrity, not RBAC.
   */
  test("a public read, including access: { bypass: true }, returns no draft rows and no duplicate logical documents", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, unfiltered, bypassed } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          vex_status: "published",
        });
        await ctx.db.insert("posts", {
          title: "Hello (draft edit)",
          slug: "hello",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });

        return {
          publishedId,
          unfiltered: await find({
            ctx,
            collection: "posts",
            config: versionedConfig,
          }),
          bypassed: await find({
            ctx,
            collection: "posts",
            config: versionedConfig,
            access: { bypass: true },
          }),
        };
      },
    );

    expect(unfiltered).toHaveLength(1);
    expect((unfiltered[0] as any)._id).toBe(publishedId);
    expect(bypassed).toHaveLength(1);
    expect((bypassed[0] as any)._id).toBe(publishedId);
  });

  /**
   * `drafts: true` alone must not be sufficient — it only lifts the structural
   * status narrowing. Whether draft content is actually returned still depends on
   * the resolved `readDrafts` RBAC action.
   */
  test("drafts: true paired with readDrafts permission returns both rows; without it, neither", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, draftId, withPermission, withoutPermission } =
      await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          vex_status: "published",
        });
        const draftId = await ctx.db.insert("posts", {
          title: "Hello (draft edit)",
          slug: "hello",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });

        return {
          publishedId,
          draftId,
          withPermission: await find({
            ctx,
            collection: "posts",
            config: versionedConfigWithAccess,
            auth: editorAuth,
            drafts: true,
          }),
          withoutPermission: await find({
            ctx,
            collection: "posts",
            config: versionedConfigWithAccess,
            auth: viewerAuth,
            drafts: true,
          }),
        };
      });

    expect(withPermission).toHaveLength(2);
    expect(withPermission.map((doc: any) => doc._id).sort()).toEqual(
      [publishedId, draftId].sort(),
    );
    expect(withoutPermission).toHaveLength(0);
  });

  /**
   * A draft-only row — `vex_status: "draft"` with no `vex_publishedId`, the row
   * Option A's `create` produces for a collection whose `versions.defaultStatus`
   * is `"draft"` — has never been published and so has no published counterpart
   * at all. It must be excluded from a published-only read exactly like an
   * ordinary draft that DOES have a published parent, since the filter in
   * `composeStatusConstraint` keys purely on `vex_status`, never on whether
   * `vex_publishedId` is set — this pins that down explicitly, since this exact
   * row shape did not exist when this test file was first written.
   */
  test("a draft-only row (never published, no vex_publishedId) is excluded by default and visible with drafts: true + readDrafts", async () => {
    const t = convexTest(schema, modules);
    const {
      draftOnlyId,
      withoutDrafts,
      withDraftsNoPermission,
      withDraftsAndPermission,
    } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftOnlyId = await ctx.db.insert("posts", {
        title: "New page (unpublished)",
        slug: "never-published",
        vex_status: "draft",
      });

      return {
        draftOnlyId,
        withoutDrafts: await find({
          ctx,
          collection: "posts",
          config: versionedConfig,
        }),
        withDraftsNoPermission: await find({
          ctx,
          collection: "posts",
          config: versionedConfigWithAccess,
          auth: viewerAuth,
          drafts: true,
        }),
        withDraftsAndPermission: await find({
          ctx,
          collection: "posts",
          config: versionedConfigWithAccess,
          auth: editorAuth,
          drafts: true,
        }),
      };
    });

    expect(withoutDrafts).toHaveLength(0);
    expect(withDraftsNoPermission).toHaveLength(0);
    expect(withDraftsAndPermission).toHaveLength(1);
    expect((withDraftsAndPermission[0] as any)._id).toBe(draftOnlyId);
  });

  /**
   * When a caller supplies its own `withIndex`, the status constraint must still
   * apply — via `.filter()`, since the `withIndex` slot is already taken.
   */
  test("a caller-supplied withIndex still gets the status filter via .filter()", async () => {
    const t = convexTest(schema, modules);
    const { publishedId, result } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Hello",
          slug: "hello",
          vex_status: "published",
        });
        await ctx.db.insert("posts", {
          title: "Hello (draft edit)",
          slug: "hello",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });

        return {
          publishedId,
          result: await find({
            ctx,
            collection: "posts",
            config: versionedConfig,
            withIndex: {
              name: "by_slug",
              range: (q: any) => q.eq("slug", "hello"),
            },
          }),
        };
      },
    );

    expect(result).toHaveLength(1);
    expect((result[0] as any)._id).toBe(publishedId);
  });

  /**
   * A non-versioned collection must be completely unaffected by this mechanism,
   * even if a stray row happens to carry a `vex_status` field.
   */
  test("a non-versioned collection is unaffected", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("authors", {
          name: "Lena",
          vex_status: "draft",
        } as any);
        return find({ ctx, collection: "authors", config: versionedConfig });
      },
    );

    expect(result).toHaveLength(1);
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

**Manual (apps/test):** right after this step, open a post that has an active draft through its draft row — `CollectionEditView` shows "Document not found" until Step 14 passes `drafts` to `get`. That breakage is this step's filter working; Step 14 is its fix.

### Step 14 — Status filter UI: draft-aware reads in the edit views `[dev]`

Why: Step 13 makes every collection read published-only unless the caller asks for drafts. The admin panel is that caller.

- **The `get` query needs `drafts: collection.versions.drafts`.** `get/server.ts`'s status composition (Step 13) is a post-fetch check on the FETCHED row's own `vex_status`, independent of which `_id` was requested — so once an active draft row exists, fetching it by its own `_id` without `drafts: true` gets nulled out, and the edit view shows "Document not found" the moment a draft exists. This applies identically whether the fetched draft row has a published parent or is a draft-only row (Option A's `versions.defaultStatus: "draft"` case, never yet published) — either way its `vex_status` is `"draft"`, and `drafts: collection.versions.drafts` is a static per-collection flag, not something that varies per document.
- **The relationship-field picker's draft visibility is gated by the CURRENTLY-EDITED document's own status, not a global toggle** (developer decision, this spec's revision round). `useRelationshipPickerOptions` may only request `drafts: true` while `isDraftDoc` is `true` for the document the picker is rendering inside — an editor working on a published document (or one that has never yet had a draft) never sees a draft target in that picker, even under `readDrafts`. This is a client-side convenience only; `publish` (Step 9's `assertNoDraftRelationships`) is the actual, authoritative backstop that rejects a publish whose relationship field still points at a draft, regardless of how or when that link was made. Threading `isDraftDoc` down to `RelationshipFieldInput` is this step's remaining work.

- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — `drafts` on `get`; `documentStatus` into every field input.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — `documentStatus` into every field input.
- [ ] `packages/core/src/fields/types.ts` — `InputComponentProps.documentStatus`.
- [ ] `packages/react/src/hooks/useRelationshipPickerOptions.ts` — `drafts` option.
- [ ] `packages/react/src/components/fields/relationship/Input.tsx` — forwards `documentStatus === "draft"` as `drafts`.

#### packages/react/src/components/views/CollectionEditView.tsx

2 edits on top of Step 12.

**1 — `drafts` on `get`.** Inside the `convexQuery(vexConvexApi.get, { ... })` call, add one line after `collection`:

```tsx
      id: activeDocumentId,
      collection: collection.slug,
      drafts: collection.versions.drafts,
```

**2 — thread `documentStatus` into every field input.** The `visibleFields.map(...)` render
loop's `<InputComponent>` call gains one prop:

```tsx
<InputComponent
  key={fieldKey}
  name={fieldKey}
  fieldDef={field}
  readOnly={
    !canEdit ||
    field.admin.readOnly ||
    !isFieldAllowed(fieldPermissions, fieldKey)
  }
  collection={collection}
  documentStatus={
    isVersioned ? (isDraftDoc ? "draft" : "published") : undefined
  }
/>
```

#### packages/react/src/components/views/GlobalEditView.tsx

1 edit — the field-render loop's `<InputComponent>` gains the same prop, identically:

```tsx
<InputComponent
  key={fieldKey}
  name={fieldKey}
  fieldDef={field}
  readOnly={
    !canEdit || field.admin.readOnly || !isFieldAllowed(fieldPermissions, fieldKey)
  }
  collection={global}
  documentStatus={
    hasDrafts && globalDoc ? (isDraftDoc ? "draft" : "published") : undefined
  }
/>
```

#### packages/core/src/fields/types.ts

Existing file; 1 edit — `InputComponentProps` gains one new optional field, after `collection`.

```ts
  /**
   * The CURRENTLY-LOADED document's publish state, when the owning
   * collection or global declares `versions.drafts: true`. `undefined` for
   * a non-versioned resource, and in create mode (no document loaded yet).
   * Most field types ignore this — `RelationshipFieldInput` (`@vexcms/react`)
   * is the one consumer, gating whether its picker may request draft
   * targets (`documentStatus === "draft"` only).
   */
  documentStatus?: DocumentStatus;
```

Add `DocumentStatus` to this file's existing `../versions` (or equivalent barrel) import.

#### packages/react/src/hooks/useRelationshipPickerOptions.ts

Existing file; 1 edit — the hook accepts an additional `drafts` option and forwards it into
both the `search` and `find` query args, so a versioned target collection excludes drafts by
default (Step 13's own default) unless the caller opts in.

```ts
export function useRelationshipPickerOptions(
  fieldDef: RelationshipField,
  targetCollection: CollectionConfig,
  query: string,
  opts?: { enabled?: boolean; drafts?: boolean },
) {
  const useAsTitle = targetCollection.admin.useAsTitle;
  const isSearchable = useAsTitle !== "_id" && useAsTitle !== "_creationTime";
  const args = isSearchable
    ? {
        collection: fieldDef.collection.slug,
        searchIndexName: `search_${useAsTitle}`,
        searchField: useAsTitle,
        query,
        drafts: opts?.drafts,
      }
    : { collection: fieldDef.collection.slug, drafts: opts?.drafts };

  const { data, isPending, isError, error } = useQuery({
    ...convexQuery(
      isSearchable ? vexConvexApi.search : vexConvexApi.find,
      args as never,
    ),
    enabled: opts?.enabled ?? true,
    placeholderData: keepPreviousData,
  });

  return {
    documents: (data as VexDocument[] | undefined) ?? [],
    isPending,
    isError,
    error,
  };
}
```

Update the JSDoc's `@param opts.enabled` line to add `@param opts.drafts - Include the
target collection's draft rows. Pass `true`only while the document owning this
relationship field is itself a draft — see`RelationshipFieldInput`'s caller.` `opts?.drafts`
being `undefined` when unspecified matches `find`/`search`'s own `drafts?: boolean`
contract (Step 13) exactly — no `?? false` needed, `undefined` already means "published
only" server-side.

#### packages/react/src/components/fields/relationship/Input.tsx

Existing file; 1 edit — the picker query call passes `drafts` from the new `documentStatus`
prop (`createFieldInput` forwards every `InputComponentProps` field through automatically;
no other plumbing is needed for `RelationshipFieldInput` to receive it). The component's
`createFieldInput<string[], CollectionFieldMeta, RelationshipField<VexResourceSlug,
CollectionFieldMeta>>` generics are untouched: `649cafa` gave every field type a leading
`VexResourceSlug` parameter (a field factory now builds globals as well as collections) and
the file already reflects it — do not "correct" the arity back to the two-argument form.

```tsx
// Picker query — Decision 12; `drafts` gated on Step 14's revision-round decision:
// the picker may only surface draft targets while the document THIS field belongs
// to is itself a draft. `publish`'s `assertNoDraftRelationships` (Step 9) is the
// actual enforcement; this is a client-side convenience on top of it.
const { documents, isPending } = useRelationshipPickerOptions(
  fieldDef,
  targetCollection,
  debouncedSearch,
  { enabled: open, drafts: documentStatus === "draft" },
);
```

Destructure `documentStatus` alongside the render function's existing `{ name, readOnly,
fieldDef, field, index, submissionAttempts }` parameters.

**Manual (apps/test):** as `admin` — the post that showed "Document not found" after Step 13 loads again. On a post whose loaded row is a draft, the `relatedPost` picker lists other posts' drafts; on a published post it lists published posts only. As `user` (or signed out) on the site, no draft content is reachable.

### Step 15 — Two-row consequences, server half `[dev]`

Why: `design-review.md` §3.1–3.4 named three concrete places a document's second row (its draft) leaks into code that was written assuming exactly one row per document. §3.2: a draft shares its published parent's field values by definition, so a naive unique-value check reports every edited document as colliding with itself. §3.4: deleting a document must delete all three of its rows (published, draft, `vex_versions` history) behind one `delete` action, or a stray draft/history row survives its parent. §3.3 + decision 4: an admin list view that doesn't collapse a published/draft pair shows one logical document as two rows the moment this spec lands — a correctness bug, not a polish item, so it ships in this step rather than being deferred.

A fourth case, not yet possible when §3.2/§3.4 were first written and verified explicitly
here rather than assumed: Option A's `create` can produce a **draft-only row**
(`vex_status: "draft"`, no `vex_publishedId`) for a collection whose
`versions.defaultStatus` is `"draft"` — a document that has never been published at all, so
there is no published parent for either mechanism below to reason about.

- **Unique-value check.** `assertUniqueAmongPublished` needs no new branch for a draft-only
  row, only a documented calling convention: there is no published parent id to pass as
  `excludeId`, so the caller omits it entirely. The function's own status filter (step 2a) is
  what actually makes this correct — it only ever keeps rows where
  `vex_status === "published"` (or `undefined`, for a non-versioned collection), so the
  draft-only row itself — whose `vex_status` is `"draft"` — can never appear in its own
  candidate set and collide with itself, with or without an `excludeId`. A genuine collision
  with a DIFFERENT document's already-published value is still caught normally, since that
  candidate's `vex_status` really is `"published"`.
- **Delete cascade.** `cascadeVersionedDelete`'s existing resolution already generalizes
  correctly: when the row being deleted has no `vex_publishedId` (step 1b below), it is
  treated as its own "published id," `findDraftRow` then finds no OTHER row to also delete
  (it would only find the row itself, already excluded by step 2b), and only that row's own
  `vex_versions` history is cleared. Deleting a draft-only row therefore deletes just itself
  plus its own history — there is no published counterpart to orphan or additionally remove,
  which is the correct, minimal behavior for a document that was never public.

This step ships the server half (§3.2 and §3.4); Step 16 ships the list-view collapse (§3.3).

- [ ] `packages/core/src/versions/assertUniqueAmongPublished.ts` — the one reusable helper design-review §3.2 calls for, so a project's own uniqueness `validate()` has a correct, two-row-aware primitive instead of reinventing the same bug; its `excludeId` contract explicitly covers the draft-only-row case (omit it — there is no published parent to exempt).
- [ ] `packages/core/src/versions/assertUniqueAmongPublished.test.ts` — including a draft-only row checking cleanly against an empty published set, and still colliding with a DIFFERENT document's published value.
- [ ] `packages/core/src/api/server.ts` — export the new helper.
- [ ] `packages/core/src/api/remove/server.ts` — cascades a hard delete to the document's draft row (if any) and every `vex_versions` row for it, when `versions.cascadeDelete` (default `true`) is not explicitly disabled; a draft-only row's cascade deletes just itself and its own history.
- [ ] `packages/core/src/api/remove/server.test.ts` — including a never-published draft's own version history being cleared on delete.
- Verify: `pnpm --filter @vexcms/core test`

#### packages/core/src/versions/assertUniqueAmongPublished.ts

````ts
import type { GenericId } from "convex/values";

import type { CollectionSlug, VexQueryCtx } from "../types/generated";

/**
 * Args for `assertUniqueAmongPublished`.
 *
 * @typeParam TCollectionSlug - The collection slug being checked.
 */
export interface AssertUniqueAmongPublishedArgs<
  TCollectionSlug extends CollectionSlug,
> {
  /**
   * The project's own Convex query context — a read-only lookup, so a mutation
   * context satisfies it too.
   *
   * Fixed (`VexQueryCtx`) rather than generic over `DataModel`, unlike the
   * public server functions in `api/`: this helper's intended caller is a
   * field's `validate()`, which since `649cafa` receives exactly the project's
   * own `VexMutationCtx` — a callback has no type argument to infer a model
   * from. Taking the fixed type drops a generic here and a `toVexQueryCtx`
   * conversion at every call site. A caller holding a generic ctx (a custom
   * mutation, a script) converts once with `toVexQueryCtx` (`api/utils.ts`),
   * which is THE one place that conversion is written.
   */
  ctx: VexQueryCtx;
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
   * creating a brand new document, OR when editing a draft-only row (Option
   * A's `create` on a collection whose `versions.defaultStatus` is `"draft"` —
   * `vex_status: "draft"` with no `vex_publishedId`, since it has never been
   * published). A draft-only row has no published counterpart to exempt: the
   * candidate scan below only ever matches `vex_status === "published"` rows
   * (step 2a), and the draft-only row itself is never one of those, so there
   * is nothing for it to collide with by being its own candidate — omitting
   * `excludeId` in that case is correct, not merely tolerated.
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
 * not-yet-published draft never counts either. The same status scoping
 * handles a draft-only row (never published, no `vex_publishedId`) for free:
 * it is never itself a `"published"` candidate, so it cannot collide with
 * itself regardless of whether the caller passed an `excludeId`.
 *
 * Call this from a field's `validate()` (see `fieldValidator`'s own
 * `@example` in `fields/baseTypes.ts`, which now delegates to this helper)
 * rather than hand-rolling the `ctx.db.query(...).withIndex(...)` scan.
 * Throwing IS the rejection mechanism: since `649cafa` a field's `validate()`
 * rejects by throwing rather than returning a message, and `validateFields`
 * catches whatever was thrown, attaches the field key, and re-throws one
 * normalized `ConvexError({ message, field })`. A plain `Error` is enough
 * here; a caller that wants structured detail (a code, the colliding
 * document's id) can catch and re-throw its own `ConvexError`, whose extra
 * data keys are preserved verbatim through that normalization.
 *
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
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: AssertUniqueAmongPublishedArgs<TCollectionSlug>): Promise<void> {
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
  //       flag a document as colliding with its own in-progress edit, AND
  //       never a draft-only row either, for the same reason).
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
  // - A draft-only row (`vex_status: "draft"`, `vex_publishedId` undefined —
  //   never published): the caller passes no `excludeId` (there is no
  //   published parent id to pass). Step 2a already drops the row itself from
  //   the candidate set (`vex_status === "draft"` fails the keep condition),
  //   so it can never collide with itself; a genuine collision with a
  //   DIFFERENT document's already-published value is still caught normally.
  throw new Error("Not implemented");
}
````

#### packages/core/src/versions/assertUniqueAmongPublished.test.ts

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
      await ctx.db.insert("posts", {
        title: "Existing",
        slug: "taken",
        vex_status: "published",
      });
      await expect(
        assertUniqueAmongPublished({
          // `assertUniqueAmongPublished` takes the fixed `VexQueryCtx` (the
          // project's own generated data model), not a generic ctx — a real
          // caller (a field's `validate()`) already has that fixed type;
          // this test's `ctx` is convex-test's own generic model, so the
          // same `as never` this repo's other fixed-ctx tests already use
          // (see `resolveUrl.server.test.ts`, `callbackApi.test.ts`).
          ctx: ctx as never,
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
      await ctx.db.insert("posts", {
        title: "First",
        slug: "hello",
        vex_status: "published",
      });
      const second = await ctx.db.insert("posts", {
        title: "Second",
        slug: "world",
        vex_status: "published",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
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
          ctx: ctx as never,
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
          ctx: ctx as never,
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
      const first = await ctx.db.insert("posts", {
        title: "Only",
        slug: "solo",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "solo",
          excludeId: first,
        }),
      ).resolves.toBeUndefined();

      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "solo",
        }),
      ).rejects.toThrow();
    });
  });

  test("a draft-only row (never published) checks cleanly against the empty published set", async () => {
    // Option A's `create` on a `versions.defaultStatus: "draft"` collection —
    // `vex_status: "draft"` with no `vex_publishedId`. No excludeId is passed:
    // there is no published parent to exempt, and nothing published has
    // claimed this value yet, so the check must not throw.
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "New page (unpublished)",
        slug: "never-published",
        vex_status: "draft",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "never-published",
        }),
      ).resolves.toBeUndefined();
    });
  });

  test("a draft-only row still collides with a DIFFERENT document's published value", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", {
        title: "Existing",
        slug: "taken",
        vex_status: "published",
      });
      // An unrelated draft-only row also wants "taken" — still a real
      // collision with the already-published document, no excludeId to
      // exempt it with.
      await ctx.db.insert("posts", {
        title: "New page (unpublished)",
        slug: "taken",
        vex_status: "draft",
      });
      await expect(
        assertUniqueAmongPublished({
          ctx: ctx as never,
          collection: "posts",
          indexName: "by_slug",
          field: "slug",
          value: "taken",
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
export { assertUniqueAmongPublished } from "../versions/assertUniqueAmongPublished";
export type { AssertUniqueAmongPublishedArgs } from "../versions/assertUniqueAmongPublished";
```

#### packages/core/src/api/remove/server.ts

Three edits — the rest of the file (the `RemoveServerArgs` interface, the bulk-delete `Promise.all`, soft-delete handling) is unchanged.

**1 — imports.** Beside the existing `convex/server` type import, add `GenericMutationCtx`; beside the existing `../utils` import, add the two version-model helpers this cascade calls:

```ts
import type {
  DocumentByName,
  GenericDataModel,
  GenericMutationCtx,
} from "convex/server";
```

```ts
import { findDraftRow, listVersions } from "../../versions/model";
```

**2 — cascade call site, inside `removeById`.** After the existing `const collection = args.config.collections.find(...)` / not-registered check (right before the existing `beforeDelete` block), and a short addition to `remove()`'s own docstring naming the new behavior:

Docstring — after "Pass `softDelete` field name to soft delete instead of permanently removing.":

```ts
 *
 * On a versioned collection with `versions.cascadeDelete` (default `true`), a
 * hard delete of either row of a document cascades to its draft row (if any)
 * and all of its `vex_versions` history (design-review.md §3.4) — see
 * `cascadeVersionedDelete` below. Deleting a draft-only row (never published,
 * no `vex_publishedId`) deletes just that row and its own version history —
 * there is no published counterpart to also remove. Set
 * `versions.cascadeDelete: false` to leave the draft row and history behind
 * instead — the collection config, not a call-site argument, decides this
 * per collection. A soft delete never cascades either way: the row is not
 * actually removed.
```

Body — after the `if (!collection) { throw ... }` block, before `if (collection.hooks?.beforeDelete && doc !== null)`:

```ts
if (collection.versions.drafts && collection.versions.cascadeDelete) {
  if (doc === undefined) {
    doc = await args.ctx.db.get(id);
  }
  if (doc !== null) {
    await cascadeVersionedDelete({
      ctx: args.ctx,
      collection: args.collection,
      doc: doc as never,
    });
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
 * logical document. Also safe to call with a draft-only row (Option A's
 * `versions.defaultStatus: "draft"` case, never published) — see edge cases
 * below.
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
  //       row (or a never-published draft-only row with no parent yet); the
  //       published id is `args.doc._id`.
  //    → produces `publishedId: GenericId<TCollectionSlug>`.
  // 2. Find the draft row pointing at `publishedId` via `findDraftRow`
  //    (`../../versions/model`, `by_published` index):
  //    a. Found, and its `_id` differs from `args.doc._id` → `args.ctx.db.delete` it.
  //    b. Found, and its `_id` equals `args.doc._id` → already the row
  //       `remove()` is about to delete; skip, do not double-delete.
  //    → keeps the two-row invariant: no orphaned draft after its parent is gone.
  // 3. List every `vex_versions` row for `(args.collection, publishedId)` via
  //    `listVersions` (`../../versions/model`) and `args.ctx.db.delete`
  //    each — history for a deleted document has no reason to survive it.
  // Edge cases:
  // - Non-versioned collection: `removeById` never calls this helper (guarded
  //   by `collection.versions.drafts`), so there is no cost on the common path.
  // - `args.doc` is a never-published draft-only row (`vex_status: "draft"`,
  //   `vex_publishedId: undefined`): step 1b applies (`publishedId === args.doc._id`);
  //   step 2's `findDraftRow` lookup can only ever surface `args.doc` itself
  //   (there is no other row pointing at `publishedId`, since `args.doc` never
  //   had a published parent), already excluded by 2b — so nothing besides
  //   `args.doc` is deleted here; step 3 still clears any version history the
  //   draft-only row accrued via autosave. The net effect is "delete this one
  //   row plus its own history, nothing else" — the correct, minimal cascade
  //   for a document that was never public.
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

// Resolves `versions: { drafts: true }` for real (Step 1),
// which is what `remove()`'s `collection.versions.drafts` check reads.
const versionedFixtureConfig = {
  collections: [versionedPostsResource],
} as unknown as VexConfig;

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

      await remove({
        ctx,
        ids: [publishedId],
        collection: "posts",
        config: versionedFixtureConfig,
      });

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

      await remove({
        ctx,
        ids: [draftId],
        collection: "posts",
        config: versionedFixtureConfig,
      });

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

      await remove({
        ctx,
        ids: [publishedA],
        collection: "posts",
        config: versionedFixtureConfig,
      });

      expect(await ctx.db.get(publishedA)).toBeNull();
      expect(await ctx.db.get(publishedB)).not.toBeNull();
      expect(await ctx.db.get(draftB)).not.toBeNull();
      expect(await ctx.db.get(versionB)).not.toBeNull();
    });
  });

  test("a non-versioned collection's delete is unaffected by the cascade guard", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "Plain",
        slug: "no-versions",
      });
      await remove({
        ctx,
        ids: [id],
        collection: "posts",
        config: fixtureConfig,
      });
      expect(await ctx.db.get(id)).toBeNull();
    });
  });

  test("a never-published draft-only row's own version history is still cleared, and nothing else is touched", async () => {
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

      await remove({
        ctx,
        ids: [draftId],
        collection: "posts",
        config: versionedFixtureConfig,
      });

      expect(await ctx.db.get(draftId)).toBeNull();
      expect(await ctx.db.get(versionId)).toBeNull();
    });
  });

  test("versions.cascadeDelete: false leaves the draft row and version history in place", async () => {
    const noCascadePosts = defineCollection({
      slug: "posts",
      fields: { title: text(), slug: text() },
      versions: { drafts: true, cascadeDelete: false },
    });
    const noCascadeConfig = {
      collections: [noCascadePosts],
    } as unknown as VexConfig;
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const publishedId = await ctx.db.insert("posts", {
        title: "Published",
        slug: "cascade-f",
        vex_status: "published",
      });
      const draftId = await ctx.db.insert("posts", {
        title: "Published (edited)",
        slug: "cascade-f",
        vex_status: "draft",
        vex_publishedId: publishedId,
      });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: publishedId,
        version: 1,
        status: "published",
      });

      await remove({
        ctx,
        ids: [publishedId],
        collection: "posts",
        config: noCascadeConfig,
      });

      expect(await ctx.db.get(publishedId)).toBeNull();
      expect(await ctx.db.get(draftId)).not.toBeNull();
      expect(await ctx.db.get(versionId)).not.toBeNull();
    });
  });
});
```

**Manual (apps/test):** as `admin`, delete a post that has a published row, an active draft, and history — the Convex dashboard shows all three gone (`posts` rows and its `vex_versions` rows). Then create a brand-new post on a collection whose `versions.defaultStatus` is `"draft"` (never publish it) and delete it — the dashboard shows only that one row and its own `vex_versions` history gone, nothing else affected.

### Step 16 — List view pair-collapsing `[dev]`

Why: §3.3 + decision 6: an admin list view that doesn't collapse a published/draft pair
shows one logical document as two rows — visible in `apps/test` since Step 8. Consumes
Step 13's `drafts` argument from the client. Option A's `collection.versions.defaultStatus:
"draft"` (the `create` path, Step 9) introduces a THIRD row shape this view must render
correctly: a document created with no published counterpart at all — a draft row whose
`vex_publishedId` is `undefined` not because its pair fell off this page, but because no
published row has ever existed for it. The grouping rule below answers both the
pair-collapsing case and the draft-only case with ONE key, not two code paths: a row's
group key is `vex_publishedId ?? _id` — a draft row's key is its published parent's `_id`
when it has one, or its OWN `_id` when it doesn't. A draft row is therefore suppressed from
the collapsed result ONLY when some OTHER row in the same fetch shares its key — that other
row is the published parent it is a draft OF, and that parent already represents the
document in the list. A draft-only row's key never collides with anything else in the
batch (nothing else in the fetch has that `_id`), so it is never suppressed: it stands
alone as its own one-row group, exactly like a standalone published row does.
`CollectionListView`'s Status column then renders three distinct states off two signals
the collapsing helper already produces — no bespoke third flag is needed: the collapsed
row's own `vex_status` (already `"draft"` whenever a draft exists, paired or not, since
draft fields win the merge) plus `hasUnpublishedChanges` (`true` only for a genuine
published+draft pair). A standalone published row (`vex_status !== "draft"`) shows
`StatusBadge status="published"` alone; a published+draft pair (`vex_status === "draft" &&
hasUnpublishedChanges`) shows `StatusBadge status="published"` PLUS the "Unpublished
changes" badge — the document IS live, there's just a pending edit; a draft-only row, never
published (`vex_status === "draft" && !hasUnpublishedChanges`), shows `StatusBadge
status="draft"` alone — it has never gone live, so there is no "unpublished changes" to
flag relative to a public version that doesn't exist.

- [ ] `packages/core/src/api/types.ts` — `drafts?: boolean` on `GenericQueryClientParams`, the client-side counterpart of Step 13's server arg; nothing in Step 13's own file list touches the client type, and `CollectionListView` below is the first real caller.
- [ ] `packages/react/src/components/views/collapseVersionedPairs.ts` (new) — collapses a versioned collection's published/draft rows to one row per logical document, preferring the draft, with a `hasUnpublishedChanges` flag; a draft-only row (no `vex_publishedId`) groups under its own `_id` and is never suppressed.
- [ ] `packages/react/src/components/views/collapseVersionedPairs.test.ts` (new) — pair-collapsing, a standalone published row, a never-published draft-only row, a legacy row with no `vex_status`, and multiple independent documents collapsed without cross-contamination.
- [ ] `packages/react/src/components/views/CollectionListView.tsx` — requests both rows of an in-progress pair (and any draft-only row) when the caller can read drafts, collapses via the helper above, and renders a three-state Status column (`StatusBadge` + an optional "Unpublished changes" indicator) built from `hasUnpublishedChanges` and the collapsed row's own `vex_status`.
- [ ] `packages/react/src/testing/convex/schema.ts` — `vex_status`/`vex_publishedId` fields on the shared `documents` fixture table, so a seeded row can model a published/draft pair or a draft-only row.
- [ ] `packages/react/src/testing/viewSuite.ts` — `describeCollectionListView` gains pair-collapsing AND draft-only-row coverage.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

#### packages/core/src/api/types.ts

One edit. Beside the existing `skip?: boolean;` field on `GenericQueryClientParams` (the interface's last member):

```ts
  /**
   * When `true` on a versioned collection, includes the document's draft
   * row alongside its published row — gated server-side on the `readDrafts`
   * action (Step 13). Ignored for a non-versioned collection.
   */
  drafts?: boolean;
```

#### packages/react/src/components/views/collapseVersionedPairs.ts

New file, complete.

```ts
import type { TDocument } from "@vexcms/core";
import { VERSION_STATUSES } from "@vexcms/core";

/**
 * Collapses published/draft row pairs — and stands a draft-only row alone —
 * into one row per logical document, for admin list views on versioned
 * collections (design-review.md §3.3).
 *
 * A versioned collection's `find` query, called with `drafts: true`
 * (Step 13), can return up to two rows per logical document: the published
 * row and, when an edit is in progress, its draft row pointing back at it
 * via `vex_publishedId`. A document created with
 * `collection.versions.defaultStatus: "draft"` (Step 9) and never published
 * has only ONE row for the same document — a draft with no
 * `vex_publishedId` at all, since there is nothing published yet for it to
 * point at.
 *
 * The suppression rule driving the grouping below: a draft row is folded
 * into (hidden behind) another row ONLY when its `vex_publishedId` resolves
 * to a row ALSO present in `documents` — i.e. it is some OTHER row's
 * counterpart, and that other row already represents the document in the
 * collapsed list. A draft-only row's `vex_publishedId` is `undefined`, so
 * it never resolves to anything else in the batch and is therefore never
 * suppressed — it groups under its own `_id` and stands alone as its own
 * row. One rule answers both halves of the admin list's contract: an
 * in-progress edit on a published document renders as ONE row (not two),
 * and a document that has never been published also renders as ONE row
 * (not zero) — neither case needs special-casing beyond this shared
 * grouping key.
 *
 * Admin-only — the public read path filters to published rows and never
 * sees a draft row at all, paired or standalone (decision 7 / Step 13).
 *
 * @typeParam TData - The document shape; preserved on the returned rows.
 * @param props - Input props.
 * @param props.documents - Raw `find` results for ONE versioned collection,
 *   fetched with `drafts: true` so both rows of an in-progress pair, and any
 *   draft-only row, are present.
 * @returns One row per logical document — the draft's fields when a draft
 *   exists (paired or standalone), otherwise the published row's — each
 *   carrying `hasUnpublishedChanges`: `true` only for a genuine
 *   published+draft pair, `false` for a standalone published row OR a
 *   draft-only row. Combined with the returned row's own `vex_status`
 *   (`"draft"` whenever a draft exists, paired or not), a caller derives
 *   the row's full display state without a third flag:
 *   `vex_status !== "draft"` → published, no pending edits;
 *   `vex_status === "draft" && hasUnpublishedChanges` → published, with a
 *   pending draft; `vex_status === "draft" && !hasUnpublishedChanges` →
 *   never published, draft only (`CollectionListView`'s Status column
 *   renders exactly this three-way split).
 */
export function collapseVersionedPairs<
  TData extends TDocument = TDocument,
>(props: {
  documents: TData[];
}): (TData & { hasUnpublishedChanges: boolean })[] {
  const groups = new Map<string, { published?: TData; draft?: TData }>();

  for (const doc of props.documents) {
    const publishedId = doc.vex_publishedId as string | undefined;
    const key = publishedId ?? String(doc._id);
    const group = groups.get(key) ?? {};
    if (doc.vex_status === VERSION_STATUSES.draft.key) {
      group.draft = doc;
    } else {
      group.published = doc;
    }
    groups.set(key, group);
  }

  const result: (TData & { hasUnpublishedChanges: boolean })[] = [];
  for (const group of groups.values()) {
    result.push({
      ...(group.draft ?? group.published)!,
      hasUnpublishedChanges: group.draft !== undefined && group.published !== undefined,
    });
  }
  return result;
}
```

#### packages/react/src/components/views/collapseVersionedPairs.test.ts

New file, complete.

```ts
import { describe, expect, test } from "vitest";
import type { TDocument } from "@vexcms/core";
import { collapseVersionedPairs } from "./collapseVersionedPairs";

function doc(overrides: Partial<TDocument> & { _id: string }): TDocument {
  return { _creationTime: 0, ...overrides } as TDocument;
}

describe("collapseVersionedPairs", () => {
  test("prefers the draft's fields and flags an unpublished-changes pair", () => {
    const published = doc({
      _id: "pub1",
      vex_status: "published",
      title: "Old title",
    });
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
    const published = doc({
      _id: "pub1",
      vex_status: "published",
      title: "Only version",
    });

    expect(collapseVersionedPairs({ documents: [published] })).toEqual([
      { ...published, hasUnpublishedChanges: false },
    ]);
  });

  test("keeps a never-published draft-only row unflagged — stands alone, never suppressed", () => {
    const draft = doc({
      _id: "draft1",
      vex_status: "draft",
      title: "Unpublished new page",
    });

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

  test("collapses multiple independent documents — paired, standalone, and draft-only — without cross-contamination", () => {
    const pubA = doc({
      _id: "a-pub",
      vex_status: "published",
      title: "A published",
    });
    const draftA = doc({
      _id: "a-draft",
      vex_status: "draft",
      vex_publishedId: "a-pub",
      title: "A edited",
    });
    const pubB = doc({
      _id: "b-pub",
      vex_status: "published",
      title: "B published",
    });
    const soloDraft = doc({
      _id: "c-draft",
      vex_status: "draft",
      title: "C never published",
    });

    const result = collapseVersionedPairs({
      documents: [pubA, draftA, pubB, soloDraft],
    });

    expect(result).toEqual([
      { ...draftA, hasUnpublishedChanges: true },
      { ...pubB, hasUnpublishedChanges: false },
      { ...soloDraft, hasUnpublishedChanges: false },
    ]);
  });
});
```

#### packages/react/src/components/views/CollectionListView.tsx

Existing file; 7 edits — `fieldPermissions`, `removeMutation` (still correctly keyed off raw `pagination.results`, since a selected row's id is always present there whether or not it was collapsed away from view), `handleBulkDelete`, `canCreate`/`canDelete`, and the modal/JSX wrapper structure are otherwise unchanged.

**1 — imports.** The `@vexcms/core` import gains `DRAFT_ACTIONS`/`VERSION_STATUSES`; the `"../ui"` import gains `Badge`; two new imports for the drafts barrel and the collapsing helper:

```ts
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  isFieldAllowed,
  PERMISSION_SCOPES,
  VERSION_STATUSES,
  vexConvexApi,
  type CollectionListViewProps,
  type CollectionSlug,
  type TDocument,
} from "@vexcms/core";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { RevalidateButton } from "../RevalidateButton";
import { VexLink } from "../ui/VexLink";
import { MODALS } from "../modals/constants";
import { CreateDocumentModal } from "../modals";
import { useVexConfig } from "../../context/VexConfigContext";
import { getCollectionColumnDefs } from "../fields";
import { useFieldPermissions, usePaginatedQuery, usePermission, useVexMutation } from "../../hooks";
import { useMemo } from "react";
import { Badge, DataTable } from "../ui";
import { StatusBadge } from "../drafts";
import { collapseVersionedPairs } from "./collapseVersionedPairs";
```

**2 — new helper, beside the existing `columnFieldKey` function** (before `CollectionListView`'s own JSDoc):

```ts
/**
 * Builds the synthetic "Status" column shown on a versioned collection's
 * list view. Reads two signals off each collapsed row
 * (`collapseVersionedPairs`) rather than a bespoke third flag: the row's own
 * `vex_status` — `"draft"` whenever a draft exists, whether paired with a
 * published row or standing alone — and `hasUnpublishedChanges`, `true`
 * only for a genuine published+draft pair.
 *
 * Three resulting states: a standalone published row (`vex_status !==
 * "draft"`) renders `StatusBadge status="published"` alone; a
 * published+draft pair (`vex_status === "draft" && hasUnpublishedChanges`)
 * renders `StatusBadge status="published"` PLUS an "Unpublished changes"
 * badge — the document IS live, there's just a pending edit; a draft-only
 * row, never published (`vex_status === "draft" && !hasUnpublishedChanges`),
 * renders `StatusBadge status="draft"` alone — it has never gone live, so
 * there is no "unpublished changes" to flag relative to a public version
 * that doesn't exist.
 *
 * Not derived by `getCollectionColumnDefs` — both signals are synthetic,
 * never real collection fields.
 *
 * @returns A `ColumnDef` reading `vex_status`/`hasUnpublishedChanges` off each row.
 */
function buildStatusColumn<
  TData extends TDocument & { hasUnpublishedChanges: boolean },
>(): ColumnDef<TData, boolean> {
  return {
    id: "_status",
    header: "Status",
    accessorFn: (row) => row.hasUnpublishedChanges,
    cell: ({ row }) => {
      const doc = row.original;
      const isDraftOnly =
        doc.vex_status === VERSION_STATUSES.draft.key && !doc.hasUnpublishedChanges;
      return (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={isDraftOnly ? "draft" : "published"} />
          {doc.hasUnpublishedChanges ? (
            <Badge variant="secondary">Unpublished changes</Badge>
          ) : null}
        </div>
      );
    },
  };
}
```

**3 — component docstring.** After "This component renders the *content area only* — wrap it in `AdminLayout`.":

```ts
 *
 * On a versioned collection (`collection.versions.drafts`), requests both
 * rows of an in-progress pair — and any draft-only row that has never been
 * published — via `drafts: true` (gated on `readDrafts`), and collapses
 * each logical document to one row via `collapseVersionedPairs`. The public
 * read path is unaffected: it never requests drafts and never sees a draft
 * row, paired or standalone.
```

**4 — `isVersioned`/`canReadDrafts`, the pagination query's new `drafts` field, and the new `rows` memo** — inserted between the existing `numItems` const and the component's return:

```ts
  const numItems = Math.max(
    collection.admin.table.serverPageSize,
    collection.admin.table.defaultPageSize,
  );

  const isVersioned = collection.versions.drafts;
  const canReadDrafts = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.readDrafts,
    scope: PERMISSION_SCOPES.any,
  });

  const pagination = usePaginatedQuery({
    query: {
      collection: collection.slug,
      drafts: isVersioned && canReadDrafts ? true : undefined,
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

  const rows = useMemo(
    () =>
      isVersioned
        ? collapseVersionedPairs({ documents: pagination.results })
        : pagination.results,
    [pagination.results, isVersioned],
  );
```

**5 — `columns`, gaining the Status column on a versioned collection:**

```ts
  const columns = useMemo(() => {
    const fieldColumns = getCollectionColumnDefs({ collection }).filter((column) => {
      const key = columnFieldKey(column);
      return key === undefined || isFieldAllowed(fieldPermissions, key);
    });
    return isVersioned ? [buildStatusColumn(), ...fieldColumns] : fieldColumns;
  }, [collection, fieldPermissions, isVersioned]);
```

**6 — document count text now reads `rows`, not `pagination.results`:**

```ts
            {pagination.isPending
              ? "Loading…"
              : `${rows.length} document${rows.length === 1 ? "" : "s"}`}
```

**7 — `DataTable`'s `data` now reads `rows`:**

```ts
      <DataTable
        data={rows}
        columns={columns}
```

#### packages/react/src/testing/convex/schema.ts

One edit. The `documents` table gains the two fields a seeded row needs to model a published/draft pair or a draft-only row — additive, every existing seeded row simply omits them:

```ts
  documents: defineTable({
    status: v.optional(v.string()),
    title: v.optional(v.string()),
    vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    vex_publishedId: v.optional(v.id("documents")),
  }).searchIndex("search_title", { searchField: "title", filterFields: [] }),
```

#### packages/react/src/testing/viewSuite.ts

One edit — three new `it()` blocks appended inside `describeCollectionListView`'s `describe("CollectionListView", () => { ... })`, after the existing `runRbacStateSuite({ ... });` call and before that `describe`'s closing `});`. Each seeds its own isolated `convexTest()` instance rather than reusing the outer shared `t`/`docs`, so neither test's rows leak into the file's other, count-sensitive assertions.

```ts
    it("collapses a published/draft pair into one row — Published status plus an 'Unpublished changes' indicator", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        versions: { drafts: true },
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
        const rows = await Promise.all([
          ctx.db.get(publishedId),
          ctx.db.get(draftId),
        ]);
        return rows.filter((doc): doc is TestDoc<"documents"> => doc !== null);
      });

      const utils = renderView(
        createElement(CollectionListView, {
          collection: versionedCollection.slug,
          initialData: toPage(seeded),
        }),
        { convex: t2, config },
      );

      expect(utils.getAllByRole("row")).toHaveLength(2); // header + 1 collapsed row
      expect(utils.getByText("Published")).toBeInTheDocument();
      expect(utils.getByText("Unpublished changes")).toBeInTheDocument();
      expect(utils.getByText("Launch post (edited)")).toBeInTheDocument();
    });

    it("keeps a standalone published document showing Published status without the indicator", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        versions: { drafts: true },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [versionedCollection] };
      const seeded = await t2.run(async (ctx) => {
        const id = await ctx.db.insert("documents", {
          title: "Solo post",
          vex_status: "published",
        });
        const solo = await ctx.db.get(id);
        return solo ? [solo] : [];
      });

      const utils = renderView(
        createElement(CollectionListView, {
          collection: versionedCollection.slug,
          initialData: toPage(seeded),
        }),
        { convex: t2, config },
      );

      expect(utils.getAllByRole("row")).toHaveLength(2); // header + 1 row
      expect(utils.getByText("Published")).toBeInTheDocument();
      expect(utils.queryByText("Unpublished changes")).toBeNull();
    });

    it("renders a never-published draft-only row as its own single row showing Draft status", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        versions: { drafts: true },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [versionedCollection] };
      const seeded = await t2.run(async (ctx) => {
        const id = await ctx.db.insert("documents", {
          title: "Never published",
          vex_status: "draft",
          // No vex_publishedId — this row is not anyone's counterpart, so it
          // is never suppressed by the collapsing helper's grouping key.
        });
        const draftOnly = await ctx.db.get(id);
        return draftOnly ? [draftOnly] : [];
      });

      const utils = renderView(
        createElement(CollectionListView, {
          collection: versionedCollection.slug,
          initialData: toPage(seeded),
        }),
        { convex: t2, config },
      );

      expect(utils.getAllByRole("row")).toHaveLength(2); // header + exactly 1 row
      expect(utils.getByText("Draft")).toBeInTheDocument();
      expect(utils.queryByText("Unpublished changes")).toBeNull();
      expect(utils.getByText("Never published")).toBeInTheDocument();
    });
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test`

**Manual (apps/test):** the `posts` list shows one row per post — an "Unpublished changes"
indicator on posts with an active draft against a published version, and a plain "Draft"
badge on a post created with `versions.defaultStatus: "draft"` that has never been
published.

### Step 17 — History reads + `deleteVersion`, server half `[dev]`

Why: `master` shipped `getVersionSnapshot`, `listVersions`, and `deleteVersion` with either
zero authorization or a check against the wrong action (design-review.md §7:
`getVersionSnapshot`/`listVersions` had **no** guard at all, and history-pruning was never
distinguished from `update`, so any editor allowed to save a draft could also permanently
destroy history). `getVersionSnapshot` and `listVersions` return draft content, so the
`readDrafts` gate must run **before** a single `vex_versions` row is read — never as a
post-hoc filter. Decision 3 (unbounded history, no `maxPerDoc`) means there is no automatic
pruning endpoint; `deleteVersion` is the only way a row leaves `vex_versions`, one at a
time, gated on the dedicated `deleteVersions` action Step 3 added.

Option A changes the shape of all three operations, not just their internals. The
collections-only design this step previously had — a bare `collection`/`documentId` pair,
RBAC checked straight against `args.collection` — never had a way to express "a GLOBAL's
history," and was one of the two concrete bugs this redesign fixes (the other being
`getVersionSnapshot`/`listVersions` having no guard at all). History is a per-slug concept
for a collection document exactly as it already is for a global: `vex_versions` groups rows
by `(collection, documentId)` regardless of which kind `documentId` names (`versions/model.ts`
already stores a global's rows under `collection: "vex_globals", documentId: <slug>` — see
`resolveVersionedTarget`'s global branch). So all three operations now accept the exact same
discriminated union every other `versions.*` operation accepts — `{ collection, id } |
{ global }`, mirroring `SaveDraftServerArgs` (`api/versions/saveDraft.server.ts`) field for
field, not the query-shaped `GenericVersionsQueryServerArgs`/`GenericVersionsMutationServerArgs`
bases this step's own stub previously sketched. Those bases stay scoped to a bare collection
slug — they're `publish`'s own base (`api/versions/types.ts`, Step 5) and this step does not
touch or extend them; a caller passing `{ global }` has no collection slug to hand them.

Three new files share the target-resolution and RBAC-gating logic that used to live
separately (badly) in each: `api/versions/history.ts`'s `resolveHistoryTarget` resolves
`{ collection, id } | { global }` to the `(collection, documentId)` key `vex_versions`
actually stores rows under, by delegating to `resolveVersionedTarget`
(`versions/resolveVersionedTarget.ts`, Step 7) — the SAME resolver `saveDraft` uses, so a
draft-only row (never published, `collection.versions.defaultStatus: "draft"`) resolves its
own `_id` as the history key exactly as `saveDraft`'s bootstrap path already does, with no
second resolution rule to keep in sync or drift from. `resolveVersionedTarget` only ever
reads (`ctx.db.get`/`.query`, never `.insert`/`.patch`/`.delete`), so this step widens its
`ctx` parameter to also accept a query context — `listVersions`/`getVersionSnapshot` are
queries and cannot supply a `GenericMutationCtx`. Critically, `resolveHistoryTarget` also
resolves the RBAC `resource`: the collection slug for a collection target, or the GLOBAL'S
OWN SLUG for a global target — **never** the literal string `"vex_globals"`. That literal
string names no resource `defineAccess({ resources: [...] })` ever declares (rules are
authored per collection/global slug), so checking it was never going to work for ANY
role's permission grant — the previous "`VersionHistoryDropdown` is collections-only" design
note was a workaround for exactly this gap, not a real limitation of the data model, and is
removed by this redesign rather than carried forward: `resource` was always available, it
was just never plumbed through to the one place that needed it.

- [ ] `packages/core/src/versions/resolveVersionedTarget.ts` — widen `resolveVersionedTarget`'s `ctx` parameter from mutation-only to query-or-mutation, so a Convex query (`listVersions`, `getVersionSnapshot`) can call it too; the function body never writes.
- [ ] `packages/core/src/api/versions/history.ts` (new) — `resolveHistoryTarget` (target → `(collection, documentId)` key + RBAC resource, shared by all three operations) and `assertVersionsAccess` (the `readDrafts`/`deleteVersions` gate, run before any `vex_versions` row is touched).
- [ ] `packages/core/src/api/versions/listVersions.server.ts`, `packages/core/src/api/versions/getVersionSnapshot.server.ts` (new) — both gate on `readDrafts`, both accept `{ collection, id } | { global }`.
- [ ] `packages/core/src/api/versions/deleteVersion.server.ts` (new) — gates on `deleteVersions`, same target union.
- [ ] `packages/core/src/api/versions/listVersions.client.ts`, `packages/core/src/api/versions/getVersionSnapshot.client.ts`, `packages/core/src/api/versions/deleteVersion.client.ts` (new) — matching client files.
- [ ] `packages/core/src/api/convex.ts` — `VexListVersionsArgs` / `VexGetVersionSnapshotArgs` / `VexDeleteVersionArgs` discriminated-union arg types (mirroring `VexSaveDraftArgs`) and this step's three `vexConvexApi.versions.*` entries.
- [ ] `packages/core/src/api/server.ts` — imports + re-exports the three operations and their types; `versionsApi` registers all three (and drops the now-stale `void query;`, since a query is finally registered).
- [ ] `packages/core/src/api/client.ts` — re-exports the three client wrappers plus `VersionSummary` / `VersionSnapshotResult`.
- [ ] `packages/core/src/api/convex.test.ts` — `REGISTERED_OPERATION_NAMES` gains all three (shown alongside `publish`/`unpublish`, Steps 9/11's own additions to the same array).
- [ ] `apps/test/convex/vex/versions.ts` — export all three.
- [ ] `packages/core/src/api/versions/listVersions.server.test.ts`, `packages/core/src/api/versions/getVersionSnapshot.server.test.ts`, `packages/core/src/api/versions/deleteVersion.server.test.ts` (new) — a role without `readDrafts`/`deleteVersions` is denied for BOTH a collection and a global target, with the global case asserting RBAC resolved against the global's own slug (never `"vex_globals"`).

> Fixture note: the collection-target tests assume the shared test fixture
> (`packages/core/src/api/test/convex/schema.ts`, extended by Step 4) declares a versioned
> `posts` table (`vex_status`, `vex_publishedAt`, `vex_publishedId`, `by_status`,
> `by_published`) and a `vex_versions` table (`collection`, `documentId`, `version`,
> `status`, `snapshot`, `createdBy`, `parentVersion`, `restoredFrom`, `publishedAt`, indexed
> `by_document_version` `["collection", "documentId", "version"]`) — the same fixture Steps
> 5, 9, and 11 write against. The global-target tests reuse `vex_globals`, already present
> in this fixture for `saveDraft`'s own global-target tests (`api/versions/saveDraft.server.test.ts`)
> — no schema changes are needed to add global coverage here.

#### packages/core/src/versions/resolveVersionedTarget.ts

Existing file (built by Step 7); 1 edit — every other line is unchanged.

**1 — widen the `ctx` parameter to accept a query context.** `resolveVersionedTarget` only
ever calls `ctx.db.get`/`ctx.db.query(...).collect()`/`.unique()` — it never writes — so the
mutation-only constraint was never load-bearing; it just happened to be the only caller so
far (`saveDraftShared`, a mutation). `listVersions`/`getVersionSnapshot` (Step 17, below) are
queries and need to call this same resolver. Mirrors the union `versions/model.ts` already
uses on `getLatestVersion`/`getVersion`/`listVersions`/`findDraftRow`.

```ts
import { ConvexError, type GenericId } from "convex/values";
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  TableNamesInDataModel,
} from "convex/server";
```

```ts
/**
 * Resolves which rows a `saveDraft` call is really targeting, for either a
 * versioned collection document (identified by `id`, the published row's id
 * on every edit after the first, or a draft row's own id) or a versioned
 * global (identified by `slug` — `vex_globals` holds every global's rows in
 * one table, distinguished by `slug` + `vex_status`, exactly like a
 * collection's own table distinguishes its published/draft rows via
 * `vex_status`/`vex_publishedId`).
 *
 * Read-only — never calls `ctx.db.insert`/`.patch`/`.delete` — so it accepts
 * either a query or a mutation context; `versions/history.ts` (Step 17)
 * calls this from `listVersions`/`getVersionSnapshot`, both queries.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param args - Either `{ ctx, collection, id }` or `{ ctx, global }`.
 * @returns A {@link VersionedTargetRows} descriptor for `versions/saveDraft.ts`.
 * @throws {ConvexError} When `id` does not resolve to a document in `collection`.
 */
export async function resolveVersionedTarget<DataModel extends GenericDataModel>(
  args: { ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel> } & (
    | { collection: CollectionSlug; id: GenericId<CollectionSlug> }
    | { global: GlobalSlug }
  ),
): Promise<VersionedTargetRows<DataModel>> {
```

#### packages/core/src/api/versions/history.ts

New file, complete.

```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import { DRAFT_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";
import {
  resolveVersionedTarget,
  type VersionedTargetRows,
} from "../../versions/resolveVersionedTarget";

/**
 * The discriminated target every `versions.*` history operation accepts —
 * identical shape to `SaveDraftServerArgs`'s union (`versions/saveDraft.server.ts`):
 * a collection document (`{ collection, id }`) or a global (`{ global }`).
 * `listVersions`, `getVersionSnapshot`, and `deleteVersion` each extend this
 * with their own operation-specific fields (`limit`, or `version`) rather
 * than a shared `documentId: string` the caller would have to derive
 * themselves — the server resolves `id`/`global` to the `vex_versions` key
 * the same way `saveDraft`/`publish` already do, via `resolveVersionedTarget`.
 */
export type VersionsTarget<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  | { collection: TCollectionSlug; id: GenericId<TCollectionSlug> }
  | { global: GlobalSlug };

/**
 * One resolved history target: the row descriptor `vex_versions` is keyed
 * off, plus the RBAC resource to check `readDrafts`/`deleteVersions`
 * against.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface ResolvedHistoryTarget<DataModel extends GenericDataModel> {
  /**
   * The RBAC subject — the collection slug for a collection target, or the
   * GLOBAL'S OWN SLUG for a global target. Never the literal string
   * `"vex_globals"`: `defineAccess({ resources: [...] })` declares rules
   * per collection/global slug, and `"vex_globals"` names no such resource
   * — checking it was the exact bug this redesign fixes (history
   * previously had no working RBAC path for globals at all, see this
   * step's Why).
   */
  resource: string;
  /**
   * Row descriptor from `resolveVersionedTarget` — carries
   * `historyCollection`/`documentId` (the `(collection, documentId)` key
   * `vex_versions` groups rows under for this target) and `toUserFields`
   * (used to build the `data` passed to `hasPermission` for document-scoped
   * rules).
   */
  rows: VersionedTargetRows<DataModel>;
}

/**
 * Resolves a `{ collection, id } | { global }` target to its `vex_versions`
 * key and RBAC resource, for `listVersions`/`getVersionSnapshot`/`deleteVersion`.
 *
 * Delegates to `resolveVersionedTarget` (`versions/resolveVersionedTarget.ts`)
 * for the actual row lookups — the same resolver `saveDraft` uses — so a
 * draft-only row (never published, `collection.versions.defaultStatus:
 * "draft"`) resolves its own `_id` as the history key exactly as
 * `saveDraft`'s bootstrap path already does, with no second resolution rule
 * to keep in sync.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param args - `{ ctx, config } & ({ collection, id } | { global })`.
 * @returns `{ resource, rows }` — see {@link ResolvedHistoryTarget}.
 * @throws {ConvexError} When the collection/global is not registered, does
 *   not declare `versions.drafts: true`, or (collection only) `id` does not
 *   resolve to a document.
 */
export async function resolveHistoryTarget<DataModel extends GenericDataModel>(
  args: {
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
    config: VexConfig;
  } & VersionsTarget,
): Promise<ResolvedHistoryTarget<DataModel>> {
  if ("collection" in args) {
    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }
    if (!collection.versions.drafts) {
      throw new ConvexError(
        `Collection "${args.collection}" does not have drafts enabled — version history requires versions: { drafts: true }`,
      );
    }
    const rows = await resolveVersionedTarget({
      ctx: args.ctx,
      collection: args.collection,
      id: args.id,
    });
    return { resource: args.collection, rows };
  }

  const global = args.config.globals.find((g) => g.slug === args.global);
  if (!global) {
    throw new ConvexError(`No global registered with slug "${args.global}"`);
  }
  if (!global.versions.drafts) {
    throw new ConvexError(
      `Global "${args.global}" does not have drafts enabled — version history requires versions: { drafts: true }`,
    );
  }
  const rows = await resolveVersionedTarget({ ctx: args.ctx, global: args.global });
  return { resource: args.global, rows };
}

/**
 * Runs the RBAC gate shared by every history operation — `readDrafts` for
 * `listVersions`/`getVersionSnapshot`, `deleteVersions` for `deleteVersion`
 * — BEFORE a single `vex_versions` row is read or deleted.
 * `listVersions`/`getVersionSnapshot` return draft content, so the throw
 * must land before step logic touches `vex_versions`, not as a post-hoc
 * filter (`master` shipped both with zero authorization at all). A no-op
 * when `config.access` is unset, matching `get`/`find`'s own
 * `config?.access !== undefined` convention.
 *
 * @param props.resource - From {@link resolveHistoryTarget}'s result —
 *   never the literal `"vex_globals"`.
 * @param props.data - The resolved document's user fields, forwarded to
 *   `hasPermission` for document-scoped (ABAC) rules.
 * @throws {VexAccessError} When the caller's roles lack `defaultAction` on `resource`.
 */
export function assertVersionsAccess(props: {
  config: VexConfig;
  auth?: VexApiAuth;
  access?: AccessCallOptions<string>;
  resource: string;
  defaultAction: typeof DRAFT_ACTIONS.readDrafts | typeof DRAFT_ACTIONS.deleteVersions;
  data?: Record<string, unknown>;
}): void {
  if (props.config.access === undefined) return;
  const { access, action, resource } = resolveAccessCall({
    config: props.config,
    access: props.access,
    defaultAction: props.defaultAction,
    resource: props.resource,
  });
  hasPermission({
    throwOnDenied: true,
    access,
    user: props.auth?.user ?? null,
    organization: props.auth?.organization,
    resource,
    action,
    data: props.data,
  });
}
```

#### packages/core/src/api/versions/listVersions.server.ts

New file, complete.

```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import { DRAFT_ACTIONS } from "../../access";
import { listVersions as listVersionRows } from "../../versions/model";
import { assertVersionsAccess, resolveHistoryTarget } from "./history";

/**
 * Default history page size when `limit` is omitted. NOT a storage cap —
 * decision 3 (spec-tasks.md) rules out `maxPerDoc`; this only bounds one
 * page of the history dropdown (design-review.md §6.3: these rows are read
 * only when the history menu opens, never on the public path).
 */
const DEFAULT_VERSION_LIST_LIMIT = 50;

/**
 * Server-side args for `listVersions`. A discriminated union, identical in
 * shape to `SaveDraftServerArgs` (`versions/saveDraft.server.ts`): the
 * `{ collection, id }` member lists history for a versioned collection's
 * document, and the `{ global }` member lists history for a versioned
 * global.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type ListVersionsServerArgs<DataModel extends GenericDataModel> = {
  /** Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** Maximum history rows to return, newest first. Defaults to 50. */
  limit?: number;
  /** Accepted and ignored — reserved for a future multi-environment spec. */
  environmentId?: string;
} & (
  | { collection: CollectionSlug; id: GenericId<CollectionSlug> }
  | { global: GlobalSlug }
);

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
 * Lists version history for a document OR a global, newest first —
 * summaries only. Use {@link getVersionSnapshot} to fetch one version's full
 * content.
 *
 * Resolves the caller's target (`{ collection, id }` or `{ global }`) via
 * `resolveHistoryTarget` (`./history`) — the same resolver
 * `getVersionSnapshot`/`deleteVersion` use — then gates on `readDrafts`
 * BEFORE a single `vex_versions` row is read: history can contain content a
 * caller without that action must never see, and `master` shipped this
 * endpoint with zero authorization (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, limit? } & ({ collection, id } | { global })`.
 * @returns Version summaries, newest first.
 * @throws {ConvexError} When the collection/global cannot be resolved, or
 *   does not declare `versions.drafts: true`, or (collection only) `id`
 *   does not resolve to a document.
 * @throws {VexAccessError} When the caller's roles lack `readDrafts` on this target.
 * @example
 * ```ts
 * import { listVersions } from "@vexcms/core/server";
 *
 * export const postHistory = query({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) =>
 *     listVersions({ ctx, config, collection: "posts", id: args.id }),
 * });
 * ```
 */
export async function listVersions<DataModel extends GenericDataModel>(
  args: ListVersionsServerArgs<DataModel>,
): Promise<VersionSummary[]> {
  const { resource, rows } =
    "collection" in args
      ? await resolveHistoryTarget({
          ctx: args.ctx,
          config: args.config,
          collection: args.collection,
          id: args.id,
        })
      : await resolveHistoryTarget({ ctx: args.ctx, config: args.config, global: args.global });

  assertVersionsAccess({
    config: args.config,
    auth: args.auth,
    access: args.access,
    resource,
    defaultAction: DRAFT_ACTIONS.readDrafts,
    data: rows.toUserFields(rows.publishedRow ?? rows.draftRow ?? {}),
  });

  const history = await listVersionRows({
    ctx: args.ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    limit: args.limit ?? DEFAULT_VERSION_LIST_LIMIT,
  });

  return history.map((row) => ({
    version: row.version,
    status: row.status,
    createdBy: row.createdBy ?? null,
    createdAt: row._creationTime,
    publishedAt: row.publishedAt ?? null,
  }));
}
```

#### packages/core/src/api/versions/getVersionSnapshot.server.ts

New file, complete.

```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import { DRAFT_ACTIONS } from "../../access";
import { getVersion } from "../../versions/model";
import { assertVersionsAccess, resolveHistoryTarget } from "./history";

/**
 * Server-side args for `getVersionSnapshot`. Same discriminated union as
 * {@link ListVersionsServerArgs}, plus the specific `version` to fetch.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type GetVersionSnapshotServerArgs<DataModel extends GenericDataModel> = {
  /** Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** The version number to fetch, as returned by `listVersions`. */
  version: number;
  /** Accepted and ignored — reserved for a future multi-environment spec. */
  environmentId?: string;
} & (
  | { collection: CollectionSlug; id: GenericId<CollectionSlug> }
  | { global: GlobalSlug }
);

/** Full content of one history row, for restore preview. */
export interface VersionSnapshotResult {
  /** The stripped document content at this version. */
  snapshot: Record<string, unknown>;
  /** Lifecycle state this version was recorded at. */
  status: "draft" | "published";
}

/**
 * Fetches one version's full content, for restore preview — the client
 * hydrates the form from `snapshot` and calls `saveDraft({ restoredFrom })`
 * (restore stays client-side and non-destructive, design-review.md §10).
 *
 * Resolves the target via `resolveHistoryTarget` (same resolver
 * `listVersions`/`deleteVersion` use) and gates on `readDrafts` BEFORE the
 * snapshot row is read — this is the endpoint that returns full draft
 * content, and `master` shipped it with zero authorization
 * (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, version } & ({ collection, id } | { global })`.
 * @returns The version's snapshot and recorded status.
 * @throws {ConvexError} When the collection/global cannot be resolved, does
 *   not declare `versions.drafts: true`, (collection only) `id` does not
 *   resolve to a document, or `version` does not exist.
 * @throws {VexAccessError} When the caller's roles lack `readDrafts` on this target.
 */
export async function getVersionSnapshot<DataModel extends GenericDataModel>(
  args: GetVersionSnapshotServerArgs<DataModel>,
): Promise<VersionSnapshotResult> {
  const { resource, rows } =
    "collection" in args
      ? await resolveHistoryTarget({
          ctx: args.ctx,
          config: args.config,
          collection: args.collection,
          id: args.id,
        })
      : await resolveHistoryTarget({ ctx: args.ctx, config: args.config, global: args.global });

  assertVersionsAccess({
    config: args.config,
    auth: args.auth,
    access: args.access,
    resource,
    defaultAction: DRAFT_ACTIONS.readDrafts,
    data: rows.toUserFields(rows.publishedRow ?? rows.draftRow ?? {}),
  });

  const row = await getVersion({
    ctx: args.ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    version: args.version,
  });
  if (row === null) {
    throw new ConvexError(
      `No version ${args.version} found for this document in collection "${rows.historyCollection}"`,
    );
  }

  return { snapshot: row.snapshot as Record<string, unknown>, status: row.status };
}
```

#### packages/core/src/api/versions/deleteVersion.server.ts

New file, complete.

```ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../types";
import { DRAFT_ACTIONS } from "../../access";
import { getVersion } from "../../versions/model";
import { assertVersionsAccess, resolveHistoryTarget } from "./history";

/**
 * Server-side args for `deleteVersion`. Same discriminated union as
 * {@link ListVersionsServerArgs}, plus the specific `version` to delete.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export type DeleteVersionServerArgs<DataModel extends GenericDataModel> = {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** The version number to permanently delete. */
  version: number;
  /** Accepted and ignored — reserved for a future multi-environment spec. */
  environmentId?: string;
} & (
  | { collection: CollectionSlug; id: GenericId<CollectionSlug> }
  | { global: GlobalSlug }
);

/**
 * Permanently deletes one `vex_versions` row. Prunes history only — never
 * the live draft or published row (that's `remove`'s cascade, Step 15).
 * Manual, one row at a time — decision 3 rules out an automatic pruning
 * endpoint.
 *
 * Resolves the target via `resolveHistoryTarget` (same resolver
 * `listVersions`/`getVersionSnapshot` use) and gates on `deleteVersions`
 * (Step 3's dedicated action) — never `update`/`readDrafts` — `master`
 * checked `update` here, which meant any editor allowed to save a draft
 * could also permanently destroy history (design-review.md §7).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, version } & ({ collection, id } | { global })`.
 * @returns Nothing — resolves once the row is deleted.
 * @throws {ConvexError} When the collection/global cannot be resolved, does
 *   not declare `versions.drafts: true`, (collection only) `id` does not
 *   resolve to a document, or `version` does not exist.
 * @throws {VexAccessError} When the caller's roles lack `deleteVersions` on this target.
 */
export async function deleteVersion<DataModel extends GenericDataModel>(
  args: DeleteVersionServerArgs<DataModel>,
): Promise<void> {
  const { resource, rows } =
    "collection" in args
      ? await resolveHistoryTarget({
          ctx: args.ctx,
          config: args.config,
          collection: args.collection,
          id: args.id,
        })
      : await resolveHistoryTarget({ ctx: args.ctx, config: args.config, global: args.global });

  assertVersionsAccess({
    config: args.config,
    auth: args.auth,
    access: args.access,
    resource,
    defaultAction: DRAFT_ACTIONS.deleteVersions,
    data: rows.toUserFields(rows.publishedRow ?? rows.draftRow ?? {}),
  });

  const row = await getVersion({
    ctx: args.ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    version: args.version,
  });
  if (row === null) {
    throw new ConvexError(
      `No version ${args.version} found for this document in collection "${rows.historyCollection}"`,
    );
  }

  await args.ctx.db.delete(row._id);
}
```

#### packages/core/src/api/versions/listVersions.client.ts

New file, complete.

```ts
import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";

import { vexConvexApi, type VexListVersionsArgs } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexQueryOptions } from "../types";
import type { VersionSummary } from "./listVersions.server";

/**
 * Client-side args for {@link listVersions}. A discriminated union: pass
 * `{ collection, id, limit? }` for a versioned collection's document, or
 * `{ global, limit? }` for a versioned global.
 */
export type ListVersionsClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  | { collection: TCollectionSlug; id: GenericId<TCollectionSlug>; limit?: number }
  | { global: GlobalSlug; limit?: number };

/**
 * Returns tanstack-query options for a document's (or global's) version
 * history. The query itself throws for a caller lacking `readDrafts` (see
 * `VersionHistoryDropdown`, Step 18, which hides the affordance under the
 * same action so the throw path is rarely hit).
 *
 * Import from `@vexcms/core/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection, id, limit? } | { global, limit? }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 * @example
 * ```tsx
 * import { listVersions } from "@vexcms/core/client";
 *
 * const { data } = useQuery(listVersions({ collection: "posts", id: postId }));
 * const { data: bannerHistory } = useQuery(listVersions({ global: "banner" }));
 * ```
 */
export function listVersions<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: ListVersionsClientArgs<TCollectionSlug>,
): VexQueryOptions<VexListVersionsArgs, VersionSummary[]> {
  const funcRef = vexConvexApi.versions.listVersions as FunctionReference<
    "query",
    "public",
    VexListVersionsArgs,
    VersionSummary[]
  >;
  return "collection" in props
    ? convexQuery(funcRef, { collection: props.collection, id: props.id, limit: props.limit })
    : convexQuery(funcRef, { global: props.global, limit: props.limit });
}
```

#### packages/core/src/api/versions/getVersionSnapshot.client.ts

New file, complete.

```ts
import { convexQuery } from "@convex-dev/react-query";
import type { FunctionReference } from "convex/server";
import type { GenericId } from "convex/values";

import { vexConvexApi, type VexGetVersionSnapshotArgs } from "../convex";
import type { CollectionSlug, GlobalSlug } from "../../types/generated";
import type { VexQueryOptions } from "../types";
import type { VersionSnapshotResult } from "./getVersionSnapshot.server";

/**
 * Client-side args for {@link getVersionSnapshot}. A discriminated union:
 * pass `{ collection, id, version }` for a versioned collection's document,
 * or `{ global, version }` for a versioned global.
 */
export type GetVersionSnapshotClientArgs<TCollectionSlug extends CollectionSlug = CollectionSlug> =
  | { collection: TCollectionSlug; id: GenericId<TCollectionSlug>; version: number }
  | { global: GlobalSlug; version: number };

/**
 * Returns tanstack-query options for one version's full snapshot — used by
 * `VersionHistoryDropdown`'s restore preview. Client-side only.
 *
 * Import from `@vexcms/core/client`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @param props - `{ collection, id, version } | { global, version }`.
 * @returns Tanstack-query `queryOptions` for `useQuery`.
 */
export function getVersionSnapshot<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: GetVersionSnapshotClientArgs<TCollectionSlug>,
): VexQueryOptions<VexGetVersionSnapshotArgs, VersionSnapshotResult> {
  const funcRef = vexConvexApi.versions.getVersionSnapshot as FunctionReference<
    "query",
    "public",
    VexGetVersionSnapshotArgs,
    VersionSnapshotResult
  >;
  return "collection" in props
    ? convexQuery(funcRef, { collection: props.collection, id: props.id, version: props.version })
    : convexQuery(funcRef, { global: props.global, version: props.version });
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
 * The mutation accepts `{ collection, id, version } | { global, version }`
 * and throws for a caller lacking `deleteVersions` — `VersionHistoryDropdown`
 * (Step 18) hides its delete affordance under the same action so the throw
 * path is rarely hit.
 *
 * Import from `@vexcms/core/client`.
 *
 * @returns A `useConvexMutation`-compatible mutation function.
 * @example
 * ```tsx
 * import { deleteVersion } from "@vexcms/core/client";
 * import { useMutation } from "@tanstack/react-query";
 *
 * const { mutateAsync } = useMutation({ mutationFn: deleteVersion() });
 * await mutateAsync({ collection: "posts", id: postId, version: 3 });
 * await mutateAsync({ global: "banner", version: 2 });
 * ```
 */
export function deleteVersion() {
  return useConvexMutation(vexConvexApi.versions.deleteVersion);
}
```

#### packages/core/src/api/convex.ts

Existing file; 2 edits.

**1 — arg types, added after `VexSaveDraftArgs`:**

```ts
/** Args for `api.vex.versions.listVersions`. */
export type VexListVersionsArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      limit?: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      limit?: number;
      environmentId?: string;
    };

/** Args for `api.vex.versions.getVersionSnapshot`. */
export type VexGetVersionSnapshotArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      version: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      version: number;
      environmentId?: string;
    };

/** Args for `api.vex.versions.deleteVersion`. */
export type VexDeleteVersionArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      version: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      version: number;
      environmentId?: string;
    };
```

Also add, alongside this file's other cross-file type imports at the top:

```ts
import type { VersionSummary } from "./versions/listVersions.server";
import type { VersionSnapshotResult } from "./versions/getVersionSnapshot.server";
```

**2 — `vexConvexApi` entries, appended inside the `versions: { ... }` block** (the same
object Step 5 created, that Steps 9/11 also extend), **after the `saveDraft` entry:**

```ts
    listVersions: anyApi.vex.versions.listVersions as FunctionReference<
      "query",
      "public",
      VexListVersionsArgs,
      VersionSummary[]
    >,

    getVersionSnapshot: anyApi.vex.versions.getVersionSnapshot as FunctionReference<
      "query",
      "public",
      VexGetVersionSnapshotArgs,
      VersionSnapshotResult
    >,

    deleteVersion: anyApi.vex.versions.deleteVersion as FunctionReference<
      "mutation",
      "public",
      VexDeleteVersionArgs,
      void
    >,
```

#### packages/core/src/api/server.ts

Existing file; 3 edits.

**1 — imports.** Add the three new function imports beside the existing `saveDraft` import, and extend the existing `convex.ts` type import (currently `import { VexGlobalsGetArgs } from "./convex";`) with the three new arg types:

```ts
import { listVersions } from "./versions/listVersions.server";
import { getVersionSnapshot } from "./versions/getVersionSnapshot.server";
import { deleteVersion } from "./versions/deleteVersion.server";
```

```ts
import {
  VexGlobalsGetArgs,
  VexListVersionsArgs,
  VexGetVersionSnapshotArgs,
  VexDeleteVersionArgs,
} from "./convex";
```

**2 — barrel re-exports**, after `export { type SaveDraftServerArgs, saveDraft } from "./versions/saveDraft.server";`:

```ts
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

**3 — `versionsApi` registers the three new operations**, appended after the `saveDraft`
entry's trailing comment (`// Step 8 appends \`publish\`, Step 10 \`unpublish\`, // Step 16
\`listVersions\` / \`getVersionSnapshot\` / \`deleteVersion\`.`), replaced with the real
registrations below. Since Steps 9/11 own `publish`/`unpublish`'s own edits to this same
factory independently (also anchored directly off the `saveDraft` entry, never off each
other or off the three below), the comment is narrowed to note only what's still pending
there — this step's own three operations are no longer pending once this edit lands. This
edit also deletes the now-stale `void query;` line near the top of the function body: once
`listVersions`/`getVersionSnapshot` are registered below, `query` is finally used.

Delete:

```ts
  void query;
```

Replace the trailing comment and the function's closing brace with:

```ts
    }),
    // Step 9 appends `publish`, Step 11 `unpublish` — both independent
    // edits, anchored off this `saveDraft` entry, never off each other.
    listVersions: query({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        limit: v.optional(v.number()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "listVersions takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return listVersions({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            limit: args.limit,
          });
        }
        return listVersions({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          limit: args.limit,
        });
      },
    }),
    getVersionSnapshot: query({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        version: v.number(),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "getVersionSnapshot takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return getVersionSnapshot({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            version: args.version,
          });
        }
        return getVersionSnapshot({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          version: args.version,
        });
      },
    }),
    deleteVersion: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        version: v.number(),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "deleteVersion takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return deleteVersion({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            version: args.version,
          });
        }
        return deleteVersion({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          version: args.version,
        });
      },
    }),
  };
}
```

#### packages/core/src/api/client.ts

Existing file; 1 edit — appended after the `// VERSIONS API` section's `saveDraft` re-export:

```ts
export { listVersions } from "./versions/listVersions.client";
export type { ListVersionsClientArgs } from "./versions/listVersions.client";
export { getVersionSnapshot } from "./versions/getVersionSnapshot.client";
export type { GetVersionSnapshotClientArgs } from "./versions/getVersionSnapshot.client";
export { deleteVersion } from "./versions/deleteVersion.client";
export type { VersionSummary } from "./versions/listVersions.server";
export type { VersionSnapshotResult } from "./versions/getVersionSnapshot.server";
```

#### packages/core/src/api/convex.test.ts

1 edit — the full surface once Steps 9, 11, and 17 have all landed (shown here as the
converged array; this step's own diff only adds the last three entries to whatever Steps
9/11 already appended):

```ts
const REGISTERED_OPERATION_NAMES = [
  "saveDraft",
  "publish",
  "unpublish",
  "listVersions",
  "getVersionSnapshot",
  "deleteVersion",
].sort();
```

#### apps/test/convex/vex/versions.ts

1 edit:

```ts
export const {
  saveDraft,
  publish,
  unpublish,
  listVersions,
  getVersionSnapshot,
  deleteVersion,
} = versionsApi({
  config,
  query,
  mutation,
  getAuth,
});
```

#### packages/core/src/api/versions/listVersions.server.test.ts

New file, complete.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";
import { defineCollection, defineGlobal, text } from "../../index";
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

describe("listVersions (server) — collection target", () => {
  test("returns summaries newest-first, without snapshot content, for a caller with readDrafts", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", {
        title: "Hello",
        slug: "hello",
        vex_status: "published",
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "published",
        snapshot: { title: "Hello" },
      });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 2,
        status: "draft",
        snapshot: { title: "Hello (draft edit)" },
      });
      return listVersions({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", id });
    });

    expect(result.map((entry) => entry.version)).toEqual([2, 1]);
    for (const entry of result) {
      expect(entry).not.toHaveProperty("snapshot");
    }
  });

  test("throws for a caller without readDrafts, before reading any version row", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "Hello", secret: "draft-only-field" },
      });

      await expect(
        listVersions({ ctx, config: fixtureConfig, auth: { user: viewerUser }, collection: "posts", id }),
      ).rejects.toThrow(VexAccessError);
    });
  });

  test("throws when the document does not exist", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const otherId = await ctx.db.insert("posts", { title: "Gone", slug: "gone" });
      await ctx.db.delete(otherId);

      await expect(
        listVersions({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", id: otherId }),
      ).rejects.toThrow();
    });
  });

  test("returns a draft-only document's own history — never published, no vex_publishedId", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "New", slug: "new", vex_status: "draft" });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "New" },
      });
      return listVersions({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", id });
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("draft");
  });

  test("returns [] for a document with no history yet", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });
      return listVersions({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", id });
    });

    expect(result).toEqual([]);
  });
});

const banner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text({ label: "Message", required: true }) },
  versions: { drafts: true },
});

const globalAccess = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [banner],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { banner: { readDrafts: true } },
    viewer: { banner: { read: true } },
  },
});

const globalFixtureConfig = { collections: [], globals: [banner], access: globalAccess } as unknown as VexConfig;

describe("listVersions (server) — global target", () => {
  test("returns summaries for a caller with readDrafts, RBAC resolved against the global's own slug", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "banner", data: { message: "Hi" }, vex_status: "published" });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Hi" },
      });
      return listVersions({ ctx, config: globalFixtureConfig, auth: { user: editorUser }, global: "banner" });
    });

    expect(result).toHaveLength(1);
  });

  test("throws for a caller without readDrafts — denial is resolved against the global's own slug, never the literal \"vex_globals\"", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "banner", data: { message: "Hi" }, vex_status: "published" });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Hi" },
      });

      // `viewer` is granted `read` on "banner" but not `readDrafts` — if this
      // resolved against the literal "vex_globals" instead, the role has no
      // grant there at all (undeclared ⇒ deny either way), which would mask
      // the real bug this test pins. Granting `viewer` plain `read` on the
      // CORRECT resource ("banner") and still observing a denial proves the
      // check is specifically about `readDrafts`, not merely "wrong resource".
      await expect(
        listVersions({ ctx, config: globalFixtureConfig, auth: { user: viewerUser }, global: "banner" }),
      ).rejects.toThrow(VexAccessError);
    });
  });
});
```

#### packages/core/src/api/versions/getVersionSnapshot.server.test.ts

New file, complete.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";
import { defineCollection, defineGlobal, text } from "../../index";
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

describe("getVersionSnapshot (server) — collection target", () => {
  test("returns the snapshot and status for a caller with readDrafts", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "Draft body" },
      });

      return getVersionSnapshot({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", id, version: 1 });
    });

    expect(result).toEqual({ snapshot: { title: "Draft body" }, status: "draft" });
  });

  test("throws for a caller without readDrafts — no draft content escapes the rejection", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });
      await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "draft",
        snapshot: { title: "Draft body", secret: "must-not-leak" },
      });

      let caught: unknown;
      try {
        await getVersionSnapshot({ ctx, config: fixtureConfig, auth: { user: viewerUser }, collection: "posts", id, version: 1 });
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(VexAccessError);
      expect(String(caught)).not.toContain("must-not-leak");
    });
  });

  test("throws when the version does not exist", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });

      await expect(
        getVersionSnapshot({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", id, version: 99 }),
      ).rejects.toThrow();
    });
  });
});

const banner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text({ label: "Message", required: true }) },
  versions: { drafts: true },
});

const globalAccess = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [banner],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { banner: { readDrafts: true } },
    viewer: { banner: { read: true } },
  },
});

const globalFixtureConfig = { collections: [], globals: [banner], access: globalAccess } as unknown as VexConfig;

describe("getVersionSnapshot (server) — global target", () => {
  test("returns the snapshot for a caller with readDrafts, RBAC resolved against the global's own slug", async () => {
    const t = convexTest(schema, modules);
    const result = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "banner", data: { message: "Live" }, vex_status: "published" });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
      });
      return getVersionSnapshot({ ctx, config: globalFixtureConfig, auth: { user: editorUser }, global: "banner", version: 1 });
    });

    expect(result).toEqual({ snapshot: { message: "Live" }, status: "published" });
  });

  test("throws for a caller without readDrafts on the global's own slug", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "banner", data: { message: "Live" }, vex_status: "published" });
      await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
      });

      await expect(
        getVersionSnapshot({ ctx, config: globalFixtureConfig, auth: { user: viewerUser }, global: "banner", version: 1 }),
      ).rejects.toThrow(VexAccessError);
    });
  });
});
```

#### packages/core/src/api/versions/deleteVersion.server.test.ts

New file, complete.

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";
import { defineCollection, defineGlobal, text } from "../../index";
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

describe("deleteVersion (server) — collection target", () => {
  test("deletes the targeted version row for a caller with deleteVersions", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "published",
        snapshot: { title: "Hello" },
      });

      const result = await deleteVersion({ ctx, config: fixtureConfig, auth: { user: adminUser }, collection: "posts", id, version: 1 });

      expect(result).toBeUndefined();
      expect(await ctx.db.get(versionId)).toBeNull();
    });
  });

  test("throws for a caller without deleteVersions — history is left intact", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "posts",
        documentId: id,
        version: 1,
        status: "published",
        snapshot: { title: "Hello" },
      });

      await expect(
        deleteVersion({ ctx, config: fixtureConfig, auth: { user: editorUser }, collection: "posts", id, version: 1 }),
      ).rejects.toThrow(VexAccessError);

      expect(await ctx.db.get(versionId)).not.toBeNull();
    });
  });

  test("throws when the version does not exist", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Hello", slug: "hello", vex_status: "published" });

      await expect(
        deleteVersion({ ctx, config: fixtureConfig, auth: { user: adminUser }, collection: "posts", id, version: 99 }),
      ).rejects.toThrow();
    });
  });
});

const banner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text({ label: "Message", required: true }) },
  versions: { drafts: true },
});

const globalAccess = defineAccess({
  roles: ["admin", "editor"] as const,
  resources: [banner],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { banner: { readDrafts: true, deleteVersions: true } },
    editor: { banner: { readDrafts: true } },
  },
});

const globalFixtureConfig = { collections: [], globals: [banner], access: globalAccess } as unknown as VexConfig;

describe("deleteVersion (server) — global target", () => {
  test("deletes the targeted version row for a caller with deleteVersions, resolved against the global's own slug", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "banner", data: { message: "Live" }, vex_status: "published" });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
      });

      await deleteVersion({ ctx, config: globalFixtureConfig, auth: { user: adminUser }, global: "banner", version: 1 });

      expect(await ctx.db.get(versionId)).toBeNull();
    });
  });

  test("throws for a caller without deleteVersions — history is left intact", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "banner", data: { message: "Live" }, vex_status: "published" });
      const versionId = await ctx.db.insert("vex_versions", {
        collection: "vex_globals",
        documentId: "banner",
        version: 1,
        status: "published",
        snapshot: { message: "Live" },
      });

      await expect(
        deleteVersion({ ctx, config: globalFixtureConfig, auth: { user: editorUser }, global: "banner", version: 1 }),
      ).rejects.toThrow(VexAccessError);

      expect(await ctx.db.get(versionId)).not.toBeNull();
    });
  });
});
```

Verify: `pnpm --filter @vexcms/core test`

### Step 18 — `VersionHistoryDropdown` `[dev]`

Why: Depends on Step 17's gated reads and the `DraftToolbar` slot (Step 8, already shipped). Reads `listVersions`/`getVersionSnapshot` as live Convex subscriptions (`convexQuery` + `useQuery`, the same pattern `CollectionEditView`'s own `get` query already uses) — a `deleteVersion` call needs no manual cache invalidation, since Convex's reactivity re-delivers the updated `listVersions` result to every subscriber automatically.

Option A means version history is not a collections-only concept: `versions.*` is ONE registered surface serving both resource kinds, and a global's RBAC lives under its own slug exactly like a collection's does. So `VersionHistoryDropdown` takes a single `target` prop — `{ collection: CollectionSlug; documentId: string } | { global: GlobalSlug }`, the same discriminated union `saveDraft` already accepts — rather than the two-prop `collection`/`documentId` contract an earlier draft of this spec described. Every permission check (`readDrafts`/`saveDraft`/`deleteVersions`) and every `versions.*` call inside the component resolves its resource/args from `target` exactly once, so a global target's `resource` is `target.global` and NEVER the literal string `"vex_globals"` — RBAC is defined per-resource in `defineAccess`, and `"vex_globals"` is only ever the physical table name `resolveVersionedTarget` reads from, never a thing a role is granted permission on.

Consumes the `AppFormContext` the edit view already provides (`useAppForm()`, `packages/react/src/components/form/AppFormContext.ts:79`) for restore's form hydration, rather than taking a `form` prop — this is exactly why the usage examples below carry only `target` (plus the optional `onRestored`): it renders as a descendant of `<AppForm form={form}>` inside `CollectionEditView`/`GlobalEditView`, the same way every field input already reaches the form with "no controller prop needed."

One necessary addition beyond the `target`/`onRestored` contract: restore for a COLLECTION target can bootstrap a brand-new draft row with a different `_id` than the one currently loaded (restoring an old version onto a document with no active draft yet) — exactly the same "which row am I currently looking at" problem `CollectionEditView`'s own `activeDocumentId` state solves for its own Save Draft button. Restore has to feed that same state, via the optional `onRestored` callback. A GLOBAL target never has this problem — a global is always reached by its own slug, never by a row id — so `GlobalEditView` renders `VersionHistoryDropdown` without `onRestored` at all.

**OPEN QUESTION, resolved conservatively:** `saveDraft`'s real, already-shipped client type (`packages/core/src/api/versions/saveDraft.client.ts`'s `SaveDraftClientArgs`) carries `restoredFrom?: number` only on its collection branch — the global branch is `{ global, data }` with no lineage field. Restoring an old version onto a GLOBAL therefore saves a new draft without an explicit "restored from version N" annotation (the `vex_versions` `parentVersion` chain still links it to the prior history row via `saveDraft`'s own `createVersion` call; only the specific `restoredFrom` marker is absent). Adding `restoredFrom` to the global branch of a type Step 5/7 already shipped is real, already-built-code surgery outside this unbuilt step's scope — flagged inline in `handleRestore` below rather than silently guessed at.

6 files: 2 new, 4 existing-file edits (`DraftToolbar` gains a `children` slot; `CollectionEditView` AND `GlobalEditView` both fill it — this step is what turns on history for globals at all, since `GlobalEditView` renders no history surface today).

- [ ] `packages/react/src/components/drafts/VersionHistoryDropdown.tsx` — target-addressed history dropdown: accepts `{ collection, documentId } | { global }`, resolves its permission `resource` and its `versions.*` query/mutation args from whichever kind it was given, never from a hardcoded collection-shaped assumption.
- [ ] `packages/react/src/components/drafts/index.ts` — barrel export for the new component.
- [ ] `packages/react/src/components/drafts/DraftToolbar.tsx` — adds the `children` slot (rendered right after the badge) that both edit views below fill identically.
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — renders `VersionHistoryDropdown` with a `{ collection, documentId }` target and `onRestored={setActiveDocumentId}`.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — renders `VersionHistoryDropdown` with a `{ global }` target. New: this view had no history affordance at all before this step.
- [ ] `packages/react/src/components/drafts/VersionHistoryDropdown.test.tsx` — covers both target kinds, including that a global target's permission checks and `versions.*` calls resolve against the global's own slug, never `"vex_globals"`, and that a restored global draft omits `restoredFrom`.

#### packages/react/src/components/drafts/VersionHistoryDropdown.tsx

````tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  DRAFT_ACTIONS,
  vexConvexApi,
  type CollectionSlug,
  type GlobalSlug,
  type VersionSummary,
} from "@vexcms/core";
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

/**
 * Which versioned resource a {@link VersionHistoryDropdown} points at — the
 * same `{ collection, id }`-or-`{ global }` shape every `versions.*`
 * operation accepts (Option A: one shared implementation per operation,
 * dispatched on resource kind, never two parallel endpoints per operation).
 * The collection branch carries `documentId` rather than `id` because
 * that's what `listVersions`/`getVersionSnapshot`/`deleteVersion` key
 * history rows on directly — the published row's stable `_id`, or a
 * never-published draft's own `_id` — which happens to be the same
 * underlying value as `saveDraft`'s `id`, just named for what each endpoint
 * does with it.
 */
export type VersionHistoryTarget =
  | {
      /** The versioned collection slug. */
      collection: CollectionSlug;
      /** The document's currently-loaded Convex `_id` — the published row, or an active draft's own row. */
      documentId: string;
    }
  | {
      /** The versioned global slug. */
      global: GlobalSlug;
    };

/** Props for {@link VersionHistoryDropdown}. */
export interface VersionHistoryDropdownProps {
  /** Which versioned resource this history belongs to. See {@link VersionHistoryTarget}. */
  target: VersionHistoryTarget;
  /**
   * Called after a restore bootstraps or patches a draft row, with that
   * row's `_id`. Lets a caller that tracks "which row is currently loaded"
   * (`CollectionEditView`'s `activeDocumentId`) stay in sync when restore
   * creates a NEW row rather than patching the one already loaded. Optional
   * — a global target's addressing never changes (it's always reached by
   * its own slug, never by a row id), so `GlobalEditView` omits this prop
   * entirely.
   */
  onRestored?: (draftId: string) => void;
}

/**
 * Version-history menu for a versioned collection document OR a versioned
 * global's edit view: lists every `vex_versions` row for the resource
 * (newest first), with each row's version number, status, `publishedAt`
 * (when present), creator, and timestamp. The newest (first) row is the
 * current version and renders with no restore/delete actions of its own —
 * restoring or deleting "the current version" is meaningless.
 *
 * Takes one `target` prop rather than separate `collection`/`documentId`
 * props precisely so a global target never has to invent a fake
 * `documentId` or route through the literal string `"vex_globals"` — every
 * permission check and `versions.*` call below resolves its resource/args
 * from `target` once.
 *
 * Restore is client-side: it fetches the target version's immutable
 * snapshot, hydrates every snapshot field directly onto the live form (the
 * user sees the restored content immediately and can still edit or discard
 * it before saving), then persists it as a new/updated draft via the SAME
 * unified `saveDraft` mutation the edit views' own Save Draft button
 * already calls — never a server-side "restore" mutation of its own.
 *
 * Renders nothing at all without `readDrafts` (Step 17 gates both reads on
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
 *   target={{ collection: collection.slug, documentId: activeDocumentId }}
 *   onRestored={setActiveDocumentId}
 * />
 * // Or, from GlobalEditView — no onRestored, since a global is always
 * // addressed by its own slug:
 * <VersionHistoryDropdown target={{ global: global.slug }} />
 * ```
 */
export function VersionHistoryDropdown(props: VersionHistoryDropdownProps) {
  const form = useAppForm();
  const queryClient = useQueryClient();
  const target = props.target;

  // The ONE place per permission check that decides which slug is "this
  // resource" — a collection target's own slug, or a global's own slug.
  // Never the literal `"vex_globals"`: RBAC is defined per-resource in
  // `defineAccess`, and a global's permissions live under its own slug
  // exactly like a collection's do.
  const resource = "collection" in target ? target.collection : target.global;

  const canReadDrafts = usePermission({ resource, action: DRAFT_ACTIONS.readDrafts });
  const canSaveDraft = usePermission({ resource, action: DRAFT_ACTIONS.saveDraft });
  const canDeleteVersions = usePermission({ resource, action: DRAFT_ACTIONS.deleteVersions });
  const [versionPendingDelete, setVersionPendingDelete] = useState<number | null>(null);

  // Shared `{ collection, documentId } | { global }` shape every
  // `versions.*` read/delete call below sends as-is — `listVersions`,
  // `getVersionSnapshot`, and `deleteVersion` accept exactly this union
  // (mirroring `saveDraft`'s own), so no `documentId` is ever invented for
  // the global branch.
  const versionsTargetArgs =
    "collection" in target
      ? { collection: target.collection, documentId: target.documentId }
      : { global: target.global };

  const { data: versions } = useQuery({
    ...convexQuery(vexConvexApi.versions.listVersions, versionsTargetArgs),
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
    //    vexConvexApi.versions.getVersionSnapshot, { ...versionsTargetArgs,
    //    version }));` — a one-shot fetch, not a subscription; the snapshot
    //    is immutable history, never re-read reactively.
    // 3. For each `[key, value]` of `Object.entries(snapshot)`:
    //    `form.setFieldValue(key, value);` — no `dontUpdateMeta` (unlike
    //    `useLiveFieldMerge`): this IS a user-visible edit the user should
    //    see as dirty/undoable via Cancel, not a silent background merge.
    //    Snapshots never contain reserved fields (every `versions.*` write
    //    path strips them before recording a snapshot), so no reserved
    //    field is ever hydrated onto the form.
    // 4. Persist via the SAME unified `saveDraft` mutation the edit view's
    //    own Save Draft button calls, branching only on `target`'s kind:
    //    a. Collection: `const draftId = await saveDraftMutation({
    //       collection: target.collection, id: target.documentId, data:
    //       snapshot, restoredFrom: version });`
    //    b. Global: `const draftId = await saveDraftMutation({ global:
    //       target.global, data: snapshot });` — **OPEN QUESTION,** resolved
    //       conservatively: `SaveDraftClientArgs`'s global branch (a real,
    //       already-shipped type) carries no `restoredFrom` field today,
    //       only its collection branch does. Rather than add a field to a
    //       type Step 5/7 already shipped (real-code scope outside this
    //       step), a restored GLOBAL draft is saved without the explicit
    //       lineage annotation — `vex_versions`' own `parentVersion` chain
    //       (set by `saveDraft`'s `createVersion` call regardless of
    //       `restoredFrom`) still records that this draft follows the
    //       previous history row.
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
    // 2. `try { await deleteVersionMutation({ ...versionsTargetArgs, version:
    //    versionPendingDelete }); } catch (error) { toast.error("Delete
    //    failed", { description: getVexErrorMessage(error) }); }`
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
            <AlertDialogTitle>
              Delete version {versionPendingDelete}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this version's history row. It cannot be
              undone.
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
````

#### packages/react/src/components/drafts/index.ts

1 edit: barrel export beside the `DraftToolbar`/`StatusBadge` exports.

```tsx
export * from "./VersionHistoryDropdown";
```

#### packages/react/src/components/drafts/DraftToolbar.tsx

Existing file (shipped in Step 8); 2 edits — a slot for view-specific controls, rendered right after the badge so history sits next to the state it describes. Both `CollectionEditView` and `GlobalEditView` fill this slot identically, below — there is no collection-only branch here.

**1 — prop**, last in `DraftToolbarProps`; add `import type { ReactNode } from "react";`:

```tsx
  /** Extra controls rendered after the badge (e.g. `VersionHistoryDropdown`). */
  children?: ReactNode;
```

**2 — render**, immediately after `{props.status && <StatusBadge status={props.status} />}`:

```tsx
{
  props.children;
}
```

#### packages/react/src/components/views/CollectionEditView.tsx

Existing file; 2 edits.

**1 — import**, extends the existing `"../drafts"` import:

```tsx
import { DraftToolbar, VersionHistoryDropdown } from "../drafts";
```

**2 — render**, `<DraftToolbar ... />` becomes an open/close pair:

```tsx
<DraftToolbar
  status={isDraftDoc ? "draft" : "published"}
  saveDraft={{
    onClick: handleSaveDraft,
    isPending: isSavingDraft,
    disabled: !canEdit || isDefaultValue,
  }}
>
  <VersionHistoryDropdown
    target={{ collection: collection.slug, documentId: activeDocumentId as string }}
    onRestored={setActiveDocumentId}
  />
</DraftToolbar>
```

#### packages/react/src/components/views/GlobalEditView.tsx

Existing file; 2 edits — this is the step that actually turns on version history for globals; `GlobalEditView` renders no history surface before it.

**1 — import**, extends the existing `"../drafts"` import:

```tsx
import { DraftToolbar, VersionHistoryDropdown } from "../drafts";
```

**2 — render**, the `hasDrafts ? (<DraftToolbar ... />) : (...)` branch's `<DraftToolbar ... />` becomes an open/close pair. No `onRestored` — a global is always addressed by its own slug, so there is no "which row am I looking at" state to feed back:

```tsx
<DraftToolbar
  status={globalDoc ? (isDraftDoc ? "draft" : "published") : undefined}
  saveDraft={{
    onClick: handleSaveDraft,
    isPending: isSavingDraft,
    disabled: isDefaultValue || !canEdit,
  }}
>
  <VersionHistoryDropdown target={{ global: global.slug }} />
</DraftToolbar>
```

#### packages/react/src/components/drafts/VersionHistoryDropdown.test.tsx

```tsx
import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { DRAFT_ACTIONS, vexConvexApi, type VersionSummary } from "@vexcms/core";
import { VersionHistoryDropdown } from "./VersionHistoryDropdown";
import type * as HooksModule from "../../hooks";
import type * as AppFormModule from "../form/AppFormContext";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";

const {
  usePermissionMock,
  setFieldValueMock,
  fetchQueryMock,
  saveDraftMock,
  deleteVersionMock,
} = vi.hoisted(() => ({
  usePermissionMock: vi.fn(),
  setFieldValueMock: vi.fn(),
  fetchQueryMock: vi.fn(),
  saveDraftMock: vi.fn(),
  deleteVersionMock: vi.fn(),
}));

vi.mock("../../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof HooksModule>();
  return { ...actual, usePermission: usePermissionMock };
});

vi.mock("../form/AppFormContext", async (importOriginal) => {
  const actual = await importOriginal<typeof AppFormModule>();
  return {
    ...actual,
    useAppForm: () => ({ setFieldValue: setFieldValueMock }),
  };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    convexQuery: (reference: unknown, args: unknown) => ({
      __reference: reference,
      __args: args,
    }),
    useConvexMutation: (reference: unknown) => {
      if (reference === vexConvexApi.versions.saveDraft) return saveDraftMock;
      if (reference === vexConvexApi.versions.deleteVersion)
        return deleteVersionMock;
      throw new Error(
        `VersionHistoryDropdown test: unexpected mutation reference ${String(reference)}`,
      );
    },
  };
});

// Newest-first fixture rows the mocked `listVersions` query serves; each test sets this
// before rendering.
let versionRows: VersionSummary[] = [];

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { __reference?: unknown; enabled?: boolean }) =>
      options.__reference === vexConvexApi.versions.listVersions &&
      options.enabled
        ? { data: versionRows }
        : { data: undefined },
    useMutation: ({
      mutationFn,
    }: {
      mutationFn: (...args: unknown[]) => unknown;
    }) => ({
      mutateAsync: mutationFn,
      isPending: false,
    }),
    useQueryClient: () => ({ fetchQuery: fetchQueryMock }),
  };
});

/** Sets `usePermission`'s return per `DRAFT_ACTIONS`, defaulting every action to `granted`. */
function mockPermissions(
  overrides: Partial<Record<string, boolean>> = {},
  granted = true,
) {
  const table: Record<string, boolean> = {
    [DRAFT_ACTIONS.readDrafts]: granted,
    [DRAFT_ACTIONS.saveDraft]: granted,
    [DRAFT_ACTIONS.deleteVersions]: granted,
    ...overrides,
  };
  usePermissionMock.mockImplementation(
    ({ action }: { action: string }) => table[action] ?? false,
  );
}

async function openHistory() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "History" }));
  return user;
}

describe("VersionHistoryDropdown", () => {
  beforeEach(() => {
    usePermissionMock.mockReset();
    setFieldValueMock.mockReset();
    fetchQueryMock.mockReset();
    saveDraftMock.mockReset();
    deleteVersionMock.mockReset();
    versionRows = [];
    mockPermissions();
  });

  it("renders nothing without readDrafts", () => {
    mockPermissions({}, false);

    render(
      <VersionHistoryDropdown
        target={{ collection: "posts", documentId: "doc1" }}
      />,
    );

    expect(screen.queryByText("History")).toBeNull();
  });

  it("lists versions newest-first with version number, status badge, creator and timestamp; hides restore/delete on the current row", async () => {
    const createdAt = 1_700_000_000_000;
    versionRows = [
      {
        version: 3,
        status: "draft",
        createdBy: "user_a",
        createdAt,
        publishedAt: null,
      },
      {
        version: 2,
        status: "published",
        createdBy: "user_b",
        createdAt: createdAt - 1000,
        publishedAt: createdAt - 1000,
      },
      {
        version: 1,
        status: "published",
        createdBy: "user_c",
        createdAt: createdAt - 2000,
        publishedAt: createdAt - 2000,
      },
    ];

    render(
      <VersionHistoryDropdown
        target={{ collection: "posts", documentId: "doc1" }}
      />,
    );
    await openHistory();

    const versionLabels = screen
      .getAllByText(/^Version \d$/)
      .map((el) => el.textContent);
    expect(versionLabels).toEqual(["Version 3", "Version 2", "Version 1"]);
    expect(screen.getAllByText("Draft")).toHaveLength(1);
    expect(screen.getAllByText("Published")).toHaveLength(2);
    expect(screen.getByText("user_a")).toBeInTheDocument();
    expect(screen.getByText("user_b")).toBeInTheDocument();
    expect(screen.getByText("user_c")).toBeInTheDocument();
    expect(
      screen.getByText(new Date(createdAt).toLocaleString()),
    ).toBeInTheDocument();

    // Only the two non-current rows (versions 2 and 1) expose restore/delete.
    expect(screen.getAllByRole("button", { name: /restore/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(2);
  });

  it("hides the Delete action on every row without deleteVersions", async () => {
    mockPermissions({ [DRAFT_ACTIONS.deleteVersions]: false });
    versionRows = [
      {
        version: 2,
        status: "draft",
        createdBy: "user_a",
        createdAt: 2000,
        publishedAt: null,
      },
      {
        version: 1,
        status: "published",
        createdBy: "user_a",
        createdAt: 1000,
        publishedAt: 1000,
      },
    ];

    render(
      <VersionHistoryDropdown
        target={{ collection: "posts", documentId: "doc1" }}
      />,
    );
    await openHistory();

    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
    // Restore is still granted, so the row itself isn't entirely gone.
    expect(screen.getAllByRole("button", { name: /restore/i })).toHaveLength(1);
  });

  it("restore (collection target) hydrates the form from the fetched snapshot, then saves a draft with restoredFrom set", async () => {
    versionRows = [
      {
        version: 2,
        status: "draft",
        createdBy: "user_a",
        createdAt: 2000,
        publishedAt: null,
      },
      {
        version: 1,
        status: "published",
        createdBy: "user_a",
        createdAt: 1000,
        publishedAt: 1000,
      },
    ];
    fetchQueryMock.mockResolvedValue({
      snapshot: { title: "Old title" },
      status: "published",
    });
    saveDraftMock.mockResolvedValue("draft123");
    const onRestored = vi.fn();

    render(
      <VersionHistoryDropdown
        target={{ collection: "posts", documentId: "doc1" }}
        onRestored={onRestored}
      />,
    );
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: /restore/i }));

    await waitFor(() =>
      expect(setFieldValueMock).toHaveBeenCalledWith("title", "Old title"),
    );
    expect(saveDraftMock).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: "posts",
        id: "doc1",
        data: { title: "Old title" },
        restoredFrom: 1,
      }),
    );
    await waitFor(() => expect(onRestored).toHaveBeenCalledWith("draft123"));
  });

  it("restore (global target) saves a draft WITHOUT restoredFrom, and resolves permissions against the global's own slug — never \"vex_globals\"", async () => {
    versionRows = [
      {
        version: 2,
        status: "draft",
        createdBy: "user_a",
        createdAt: 2000,
        publishedAt: null,
      },
      {
        version: 1,
        status: "published",
        createdBy: "user_a",
        createdAt: 1000,
        publishedAt: 1000,
      },
    ];
    fetchQueryMock.mockResolvedValue({
      snapshot: { message: "Old announcement" },
      status: "published",
    });
    saveDraftMock.mockResolvedValue("draft456");

    render(
      <VersionHistoryDropdown target={{ global: "announcement" }} />,
    );
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: /restore/i }));

    await waitFor(() =>
      expect(setFieldValueMock).toHaveBeenCalledWith("message", "Old announcement"),
    );
    expect(saveDraftMock).toHaveBeenCalledWith({
      global: "announcement",
      data: { message: "Old announcement" },
    });
    expect(saveDraftMock.mock.calls[0]?.[0]).not.toHaveProperty("restoredFrom");

    for (const call of usePermissionMock.mock.calls) {
      expect(call[0].resource).toBe("announcement");
      expect(call[0].resource).not.toBe("vex_globals");
    }
  });

  it("delete (collection target) asks for confirmation, then calls deleteVersion with the targeted version", async () => {
    versionRows = [
      {
        version: 2,
        status: "draft",
        createdBy: "user_a",
        createdAt: 2000,
        publishedAt: null,
      },
      {
        version: 1,
        status: "published",
        createdBy: "user_a",
        createdAt: 1000,
        publishedAt: 1000,
      },
    ];
    deleteVersionMock.mockResolvedValue(undefined);

    render(
      <VersionHistoryDropdown
        target={{ collection: "posts", documentId: "doc1" }}
      />,
    );
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: /delete/i }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Delete version 1?")).toBeInTheDocument();
    expect(deleteVersionMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(deleteVersionMock).toHaveBeenCalledWith({
        collection: "posts",
        documentId: "doc1",
        version: 1,
      }),
    );
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("delete (global target) calls deleteVersion with { global, version } — no documentId invented", async () => {
    versionRows = [
      {
        version: 2,
        status: "draft",
        createdBy: "user_a",
        createdAt: 2000,
        publishedAt: null,
      },
      {
        version: 1,
        status: "published",
        createdBy: "user_a",
        createdAt: 1000,
        publishedAt: 1000,
      },
    ];
    deleteVersionMock.mockResolvedValue(undefined);

    render(<VersionHistoryDropdown target={{ global: "announcement" }} />);
    const user = await openHistory();
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      }),
    );

    await waitFor(() =>
      expect(deleteVersionMock).toHaveBeenCalledWith({
        global: "announcement",
        version: 1,
      }),
    );
  });

  it("renders an empty state with no version history", async () => {
    versionRows = [];

    render(
      <VersionHistoryDropdown
        target={{ collection: "posts", documentId: "doc1" }}
      />,
    );
    await openHistory();

    expect(screen.getByText("No history yet")).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /restore/i })).toHaveLength(
      0,
    );
  });
});
```

Verify: `pnpm --filter @vexcms/react test`

**Manual (apps/test):** as `admin` on a post with several saves/publishes — the dropdown lists them newest-first; restoring an old version creates/patches the draft and flips the badge to Draft; deleting a version removes it from the list live. As `contributor`, the delete affordance is hidden. Repeat on the `announcement` global (versioned, Step 9/11) as `admin`: the same dropdown now renders in `GlobalEditView`'s toolbar, lists history keyed to the global's own slug, and a restore saves a new draft without a visible "restored from" marker (the open-question tradeoff above).

### Step 19 — Autosave `[dev]`

Why: Needs the toolbar and `saveDraft` in place (both shipped: `DraftToolbar` in Step 8, `saveDraft` in Step 5/7). Fires on settled change, not a fixed interval — the same reasoning design-review §6.2 already established still holds. Mirrors the debounce-on-settle shape `useLivePreviewSync.ts` already proves out in this codebase (a `useEffect` keyed on the live form values, `setTimeout(fn, debounceMs)` scheduled fresh on every change, cleared on the next one) — no new debounce primitive, no polling/interval anywhere.

The config-side primitives this hook leans on already exist and need no redesign: `CollectionConfig["versions"]["autosave"]` and `GlobalConfig["versions"]["autosave"]` (`{ enabled: boolean; debounceMs: number }`, both resolved with defaults by `defineCollection`/`defineGlobal`) and `DEFAULT_AUTOSAVE_DEBOUNCE_MS`/`CONSTRAINT_COMPARATORS` (`packages/core/src/versions/constants.ts`, `packages/core/src/access/compileConstraints.ts`) already ship from earlier steps. What's unbuilt is purely the React hook and its two call sites.

`useAutosave` is left generic (`{ values, onSave, enabled?, debounceMs? }`, not `{ form, collection, id }`), so it never imports `AnyFormApi` or `@vexcms/core`'s versions API itself — the caller supplies `values` as `changedValues(form)` and binds `onSave` to its own `saveDraft` mutation. Because it's resource-kind-blind by construction, wiring it into `GlobalEditView` is not a new design, just a second call site: `GlobalEditView` already has its own `saveDraftMutation` (Step 5/7's unified `versions.saveDraft`, called today only from its manual Save Draft button) and its own `global.versions.autosave.enabled` config field, identically shaped to `CollectionEditView`'s. There is no "collections-only" framing left to carry forward — this step turns autosave on for both resource kinds at once, using the one hook.

Autosave calls `saveDraft` directly (bypassing `useVexMutation`), exactly as both views' manual Save Draft handlers already do — `saveDraft` never purges or revalidates anything (a draft is never public), so there is nothing for the ISR-purge pipeline to do here. This is unrelated to `"publish"`/`"unpublish"` joining `VexMutationOperation` (Step 10): those two public-facing transitions route through `useVexMutation` precisely because they purge; a background autosave tick never does.

6 files: 2 new, 4 existing-file edits (the last two turn autosave on for `apps/test`'s `posts` collection and `announcement` global, so both resource kinds are manually testable).

- [ ] `packages/react/src/hooks/useAutosave.ts` — the generic debounce-on-settle hook.
- [ ] `packages/react/src/hooks/useAutosave.test.ts` — debounce/coalesce/in-flight-retry/failure-retry/enabled-toggle/unmount coverage.
- [ ] `packages/react/src/hooks/index.ts` — barrel export.
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — wires `useAutosave` using the existing `saveDraftMutation`/`changedValues(form)`/`canEdit`.
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — wires `useAutosave` the same way, using its own existing `saveDraftMutation` and the pre-first-save `form.state.values` fallback its manual `handleSaveDraft` already uses.
- [ ] `apps/test/src/vexcms/collections/posts.ts`, `apps/test/src/vexcms/globals/announcement.ts` — turn autosave on for one collection and one already-versioned global.

#### packages/react/src/hooks/useAutosave.ts

````ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONSTRAINT_COMPARATORS,
  DEFAULT_AUTOSAVE_DEBOUNCE_MS,
} from "@vexcms/core";

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
 * Fully generic: it never imports a form type or `@vexcms/core`'s versions
 * API. `CollectionEditView` and `GlobalEditView` both wire it the same way —
 * `values` is `changedValues(form)` (or, before a global's first save, the
 * raw form defaults, matching the manual Save Draft handler each view
 * already has), and `onSave` calls that same view's own `saveDraft`
 * mutation. Nothing about this hook is collection- or global-specific.
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
 * // CollectionEditView
 * const { status } = useAutosave({
 *   values: changedValues(form),
 *   onSave: (changes) =>
 *     saveDraftMutation({ collection: collection.slug, id: activeDocumentId, data: changes })
 *       .then((draftId) => setActiveDocumentId(draftId)),
 *   enabled: isVersioned && collection.versions.autosave.enabled && canEdit,
 * });
 *
 * // GlobalEditView
 * const { status } = useAutosave({
 *   values: globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>),
 *   onSave: (changes) => saveDraftMutation({ global: global.slug, data: changes }),
 *   enabled: hasDrafts && global.versions.autosave.enabled && canEdit,
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
````

#### packages/react/src/hooks/useAutosave.test.ts

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutosave } from "./useAutosave";

/**
 * Flushes pending microtasks (promise `.then`/`async`/`await` continuations)
 * without advancing fake timers — `runSave`'s own `await props.onSave(...)`
 * chain needs several microtask ticks to settle after a `setTimeout`
 * callback fires or a manually-resolved promise resolves.
 */
async function flushPromises(ticks = 5): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAutosave", () => {
  it("does not save on mount", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutosave({ values: { title: "A" }, onSave }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves once after values settle, debounced", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });

    await act(async () => {
      vi.advanceTimersByTime(999);
    });
    expect(onSave).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: "B" });
    expect(result.current.status).toBe("saved");
    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it("coalesces a burst of rapid changes into exactly one save, with the final values", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "AB" } });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    rerender({ values: { title: "ABC" } });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    rerender({ values: { title: "ABCD" } });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: "ABCD" });
  });

  it("never merges a change that lands mid-flight; retries independently once the in-flight save finishes", async () => {
    let resolveFirst!: () => void;
    const onSave = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenNthCalledWith(1, { title: "B" });

    // A further change lands while the first save is still in flight.
    rerender({ values: { title: "C" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // No second call yet — no debounce timer fires for an in-flight save's
    // pending change; it waits on the first save to finish.
    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst();
      await flushPromises();
    });

    // The retry is its own independent call with the LATEST values — never
    // merged into the request that just finished.
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenNthCalledWith(2, { title: "C" });
  });

  it("on failure, leaves status as error and does not advance the saved baseline, so the next settle retries the same diff", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("boom"));
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeInstanceOf(Error);
    expect(onSave).toHaveBeenCalledTimes(1);

    onSave.mockResolvedValueOnce(undefined);
    // A new render with the SAME content as the failed attempt still counts
    // as "not yet saved" (the baseline never advanced on failure).
    rerender({ values: { title: "B" } });
    rerender({ values: { title: "B2" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenNthCalledWith(2, { title: "B2" });
    expect(result.current.status).toBe("saved");
  });

  it("cancels a pending debounce when enabled flips to false mid-debounce", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ values, enabled }) => useAutosave({ values, onSave, enabled, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" }, enabled: true } },
    );

    rerender({ values: { title: "B" }, enabled: true });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    rerender({ values: { title: "B" }, enabled: false });
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("clears the pending timer on unmount — no orphaned save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });
});
```

Verify: `pnpm --filter @vexcms/react test`

#### packages/react/src/hooks/index.ts

1 edit: barrel export beside the existing `useVexMutation`/`useVexRevalidate` exports.

```ts
export * from "./useAutosave";
```

#### packages/react/src/components/views/CollectionEditView.tsx

2 edits — wires `useAutosave` using the toolbar's own `changedValues(form)`/`saveDraftMutation` from Steps 5/8.

**1 — import**, add `useAutosave` to the existing `"../../hooks"` import block:

```tsx
import {
  useAutosave,
  useFieldPermissions,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
```

**2 — hook call**, placed after `isDraftDoc` is computed and before `const [tempId] = useState(...)`:

```tsx
useAutosave({
  values: changedValues(form),
  onSave: (changes) =>
    saveDraftMutation({
      collection: collection.slug,
      id: activeDocumentId,
      data: changes,
    }).then((draftId) => {
      setActiveDocumentId(draftId);
    }),
  enabled: isVersioned && collection.versions.autosave.enabled && canEdit,
});
```

Edge case worth naming explicitly: this `onSave` closure calls `setActiveDocumentId` from inside `useAutosave`'s internal `runSave` — a state update from a callback the hook invokes asynchronously, not from an event handler. This is ordinary React (state updates from an async callback's `.then` are always safe to call, regardless of what triggered the callback) — noted only because it is the one place autosave and the manual Save Draft button converge on the same piece of state.

#### packages/react/src/components/views/GlobalEditView.tsx

2 edits — wires `useAutosave` the same way, using the `saveDraftMutation` and pre-first-save fallback the manual `handleSaveDraft` (Step 5/7) already has.

**1 — import**, add `useAutosave` to the existing `"../../hooks"` import block:

```tsx
import {
  useAutosave,
  useFieldPermissions,
  useFieldsForm,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
```

**2 — hook call**, placed immediately after `handleSaveDraft` is defined and before `const isDraftDoc = ...`:

```tsx
useAutosave({
  values: globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>),
  onSave: (changes) => saveDraftMutation({ global: global!.slug, data: changes }),
  enabled: hasDrafts && global.versions.autosave.enabled && canEdit,
});
```

Before the global's first-ever save, `globalDoc` is `undefined` and `canEdit` (computed from `usePermission({ resource: global.slug, action: hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update, data: globalDoc as {} })`) is still evaluated against that `undefined` document, exactly as the manual Save Draft button already handles — autosave adds no new permission-resolution path beyond what Step 5/7 built.

Verify: `pnpm --filter @vexcms/react test`

#### apps/test/src/vexcms/collections/posts.ts

1 edit — turn autosave on for the versioned test collection:

```ts
  versions: {
    drafts: true,
    autosave: { enabled: true },
  },
```

#### apps/test/src/vexcms/globals/announcement.ts

1 edit — turn autosave on for the versioned test global, so both resource kinds are manually testable:

```ts
  versions: {
    drafts: true,
    autosave: { enabled: true },
  },
```

**Manual (apps/test):** edit a post's `body` and stop typing — one `saveDraft` fires after ~1s (Convex logs), the badge flips to Draft, and continued typing debounces rather than firing per keystroke. Repeat on the `announcement` global's `message` field — the same debounce-on-settle behavior fires through `GlobalEditView`'s own `saveDraftMutation`, flipping its badge to Draft identically.

### Step 20 — CLI dead-code removal + real backfill action `[dev]`

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
      consuming project. Not added to `versionsApi` (Step 7) and not a `DRAFT_ACTIONS`
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
import {
  executeMigration,
  executeFieldRemoval,
  backfillVersionStatus,
} from "./migrate.js";
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
        if (err instanceof Error && err.message.includes("Could not find")) {
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

````ts
import type {
  GenericDataModel,
  GenericMutationCtx,
  PaginationOptions,
} from "convex/server";
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
 * `vex` CLI or the `versionsApi` factory (Step 7) calls it automatically, and
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
````

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
import { ConvexError } from "convex/values";
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
      versions: { drafts: true },
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
      versions: { drafts: false },
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
    const { publishedId, draftId, untouchedId } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const publishedId = await ctx.db.insert("posts", {
          title: "Has published",
          vex_status: "published",
        });
        const draftId = await ctx.db.insert("posts", {
          title: "Has draft",
          vex_status: "draft",
        });
        const untouchedId = await ctx.db.insert("posts", {
          title: "Never touched",
        });
        return { publishedId, draftId, untouchedId };
      },
    );

    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      backfillStatus({
        ctx,
        config: versionedConfig,
        collection: "posts",
        paginationOpts: { numItems: 10, cursor: null },
      }),
    );

    expect(result).toEqual({
      patched: 1,
      isDone: true,
      continueCursor: expect.any(String),
    });

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      expect((await ctx.db.get(publishedId))?.vex_status).toBe("published");
      expect((await ctx.db.get(draftId))?.vex_status).toBe("draft");
      expect((await ctx.db.get(untouchedId))?.vex_status).toBe("published");
    });
  });

  /**
   * Running the action again after every row already has `vex_status` finds
   * nothing left to patch — proves the action is safe to invoke repeatedly.
   */
  test("a second call patches nothing once every row has vex_status", async () => {
    const t = convexTest(schema, modules);
    const rowId = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.insert("posts", { title: "Legacy" }),
    );

    const first = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      backfillStatus({
        ctx,
        config: versionedConfig,
        collection: "posts",
        paginationOpts: { numItems: 10, cursor: null },
      }),
    );
    expect(first).toEqual({
      patched: 1,
      isDone: true,
      continueCursor: expect.any(String),
    });

    const second = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      backfillStatus({
        ctx,
        config: versionedConfig,
        collection: "posts",
        paginationOpts: { numItems: 10, cursor: null },
      }),
    );
    expect(second).toEqual({
      patched: 0,
      isDone: true,
      continueCursor: expect.any(String),
    });

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      expect((await ctx.db.get(rowId))?.vex_status).toBe("published");
    });
  });

  /**
   * `posts` here is registered WITHOUT `versions.drafts` — there is no
   * `vex_status` column to backfill, so the call must reject rather than
   * querying a nonexistent index.
   */
  test("throws when the collection does not have versions.drafts enabled", async () => {
    const t = convexTest(schema, modules);
    let caught: unknown;
    try {
      await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        backfillStatus({
          ctx,
          config: nonVersionedConfig,
          collection: "posts",
          paginationOpts: { numItems: 10, cursor: null },
        }),
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ConvexError);
    const message = (caught as Error).message;
    expect(message).toContain("posts");
    expect(message).toContain("versions.drafts");
  });

  /** No collection named `"missing"` exists in `versionedConfig` at all. */
  test("throws for an unregistered collection slug", async () => {
    const t = convexTest(schema, modules);
    let caught: unknown;
    try {
      await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
        backfillStatus({
          ctx,
          config: versionedConfig,
          collection: "missing" as never,
          paginationOpts: { numItems: 10, cursor: null },
        }),
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ConvexError);
    expect((caught as Error).message).toContain("missing");
  });
});
```

Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/cli test`

### Step 21 — `apps/www` production wiring + docs `[dev]`

Why: Ships the finished feature on the deployed site and closes the live-preview
base-layer obligation E left for this spec. Development testing happened in `apps/test`
(Steps 7–19); this step is production wiring only, so `apps/www`'s `convex/vex/versions.ts`
exports the complete six-operation surface in one go.

- [ ] `apps/www/src/vexcms/collections/pages.ts` — `versions: { drafts: true, autosave: { enabled: true } }`.
- [ ] `apps/www/convex/vex/versions.ts` — new file, registers `versionsApi` (mirrors the existing `apps/www/convex/vex/globals.ts`).
- [ ] `apps/www/src/auth/access.ts` — draft actions per role.
- [ ] `apps/www/convex/pages.ts` — `getBySlug` (public, `access.bypass: true`) is unchanged and
      stays published-only via Step 13's default. Add a second, session-authenticated query
      the live-preview base layer calls instead when the `vex-live-preview` marker cookie is
      present, under a real `readDrafts` permission check.
- [ ] `apps/www/src/app/(frontend)/(site)/PageContent.tsx` — wire the preview-mode branch to
      the new query, and take over `useSitePreviewMode` from the now-deleted
      `SiteLivePreviewProvider.tsx` (`649cafa`: provider wiring moved to the app root and is
      already shipped). `useVexPreview`/`useLivePreviewQuery` themselves are unchanged.
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
    autosave: { enabled: true },
  },
```

#### apps/www/convex/vex/versions.ts

New file. Mirrors the existing `apps/www/convex/vex/globals.ts` exactly — its own
`createGetAuth` call (not shared with `convex/vex.ts`; `globals.ts` doesn't share its
copy either, since a dedicated per-resource-kind file is what makes `api.vex.versions.*`
and `api.vex.globals.*` distinct Convex path prefixes in the first place — see Step 7's
docstring on where the nesting actually comes from). Declarative factory composition
against already-shipped Step 7/9/11/17 code — not a stub.

```ts
import { createGetAuth } from "@vexcms/better-auth";
import { versionsApi } from "@vexcms/core/server";

import { TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants";
import config from "~/vex.config.server";

import { query } from "../_generated/server";
import { vexMutation as mutation } from "../vex";

// `pages` declares `versions.drafts` — registers the draft/publish workflow
// (`versionsApi`, mirroring `globalsApi`'s factory pattern and file placement).
export const {
  saveDraft,
  publish,
  unpublish,
  listVersions,
  getVersionSnapshot,
  deleteVersion,
} = versionsApi({
  config,
  query,
  mutation,
  getAuth: createGetAuth({
    userCollectionSlug: TABLE_SLUG_USERS,
    sessionCollectionSlug: TABLE_SLUG_SESSIONS,
    resolveOrgs: false,
  }),
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
import { DRAFT_ACTIONS } from "@vexcms/core";
import { v } from "convex/values";
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
 * Passes `drafts: true` so Step 13's published-only filter does not apply, and
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
    //      choosing one. The two-row invariant Steps 5, 9, and 11 enforce (at most one draft
    //      row per document) bounds this at 2 rows regardless.
    //    → a caller whose resolved role lacks `readDrafts` gets `[]` here (`find`'s
    //      own per-row `hasPermission` filter denies every row) — never a thrown
    //      error, so an unauthenticated or under-privileged preview request
    //      degrades to "no page found" rather than revealing which rows exist.
    // 2. `draft = matches.find((doc) => doc.vex_status === "draft")`
    //    → present when the document has unpublished changes; this is the row the
    //      preview exists to show (mirrors `CollectionListView.tsx`'s pair-
    //      collapsing preference, Step 16). Covers the never-published case too — a
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
    throw new Error("Not implemented");
  },
});
```

Verify: `pnpm --filter www typecheck && pnpm --filter www build`

#### apps/www/src/app/(frontend)/(site)/PageContent.tsx

4 edits. `SiteLivePreviewProvider.tsx` — which this step originally also edited, and which
`useSitePreviewMode` originally lived in — **no longer exists**: `649cafa` deleted it from
`apps/www` and both templates, moved `VexConfigProvider` to the app root, and made
`LivePreviewProvider` prop-less and self-gating on `?vexLivePreview=1` plus the
session-verified cookie. The provider wiring that step described is therefore already
shipped and is not re-done here. What is still needed is the hook itself: `PageContent`
has to know whether this load is a preview session in order to pick its base query, and
no equivalent is exported from `@vexcms/react` (its `useLivePreviewEnabled` is internal).
It moves into this file, its only consumer — edit 4 below.

**1 — imports for the hook edit 4 adds**, beside the existing `react` import group:

```ts
import { useEffect, useState } from "react";

import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core";
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

**4 — new `useSitePreviewMode`**, appended at file end (it was originally an export of the
now-deleted `SiteLivePreviewProvider.tsx`). Not exported — `PageContent` is its only
consumer. Real logic (mirrors `@vexcms/react`'s internal, unexported
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
  throw new Error("Not implemented");
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
import { defineCollection } from "@vexcms/core";
import { collectionsApi, versionsApi } from "@vexcms/core/server";

export const posts = defineCollection({
  slug: "posts",
  fields: {/* ... */},
  versions: {
    drafts: true,
    autosave: { enabled: true }, // debounced saveDraft on settled form changes only
  },
});

// convex/vex.ts — unchanged; versionsApi is never registered here
export const { find, get, search, create, update, remove, livePreviewUrl } =
  collectionsApi({
    config,
    query,
    mutation,
    getAuth,
  });

// convex/vex/versions.ts — own file, same split `convex/vex/globals.ts` already uses;
// this is what makes `api.vex.versions.*` a distinct path from `api.vex.*`
export const {
  saveDraft,
  publish,
  unpublish,
  listVersions,
  getVersionSnapshot,
  deleteVersion,
} = versionsApi({ config, query, mutation, getAuth });
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

- `versions.drafts`/`versions.autosave.enabled` on `defineCollection`/`defineGlobal` — code sample
  matching README's.
- `drafts` defaults `false`; nothing changes for an unopted-in collection.
- `autosave.debounceMs` defaults to `DEFAULT_AUTOSAVE_DEBOUNCE_MS`, fires only on settled, actually-
  changed values (no `isAutosave` flag, no coalescing — Step 19).
- One-line pointer to `versionsApi` registration (`convex/vex/versions.ts`, mirroring
  `convex/vex/globals.ts`), cross-linked to the Local API / Convex integration guide rather
  than repeated here.

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
  carried _a_ verified session, not that the session is privileged — `readDrafts` is the
  actual authorization boundary, and an unauthenticated or under-privileged request degrades
  to "no page found," never a thrown error that would leak which rows exist.
- Cross-link to `guides/live-preview.mdx` for the transport/overlay mechanics, which this
  spec does not change.

`## Migrating off a hand-rolled status field`

- Same content as the README aside: toggle `versions.drafts`, run `backfillStatus` once,
  delete the old field and repoint queries at the built-in `drafts` argument.
```

Verify: `pnpm --filter docs build`

### Step 22 — Verification `[dev]`

- [ ] `pnpm build && pnpm test && pnpm lint` clean across the workspace.
- [ ] Manual (`apps/test`): rerun every step's manual check end to end on `posts` and
      `announcement` across `admin` / `editor` / `contributor` / signed-out.
- [ ] Manual (`apps/www`): create a page, publish it, note its `_id`; edit and save a draft (public
      route still serves the published copy, including through the `bypass: true`
      query); attempt to publish a draft with a required field cleared and confirm
      rejection naming the field; fill it in and publish again, confirming **the `_id`
      is unchanged** and inbound relationships still resolve; unpublish with an
      outstanding draft and confirm the rejection; restore an older version; confirm the
      admin list shows one row for a document with an active draft, not two; open the
      `pages` live-preview panel while an unpublished draft exists and confirm the
      preview reflects the draft while the public route still serves the published copy.
- Verify: `pnpm build && pnpm test`
