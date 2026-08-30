# Spec 36 — Versioning & Drafts: Research Notes

> Pre-spec research. Read this before writing the spec or starting implementation.
> Covers existing plans, the reference implementation, rebuild-specific considerations, and open design questions.

---

## What Was Already Planned

### Archive spec (`specs/archive/07-versioning-drafts-spec.md`)

Your most detailed existing plan. Written for the old `master`/`test-app` architecture — file paths and factory-pattern details are wrong — but the core decisions are solid and largely carry over:

- `VersionsConfig` type on `CollectionConfig` — `drafts`, `autosave`, `maxPerDoc`
- `_status`, `_version`, `_publishedAt` injected into collection schemas when `versions.drafts: true`
- Single shared `vex_versions` table: `collection`, `documentId`, `version`, `snapshot`, `status`, `isAutosave`
- Version model functions: `createVersion`, `getLatestVersion`, `coalesceAutosave`, `cleanupOldVersions`, `listVersions`, `getVersion`
- Mutations: `saveDraft`, `publish`, `unpublish`, `autosave`, `restoreVersion`
- Queries: `getDocumentForEdit`, `listVersions`
- Admin UI: `StatusBadge`, `VersionHistoryDropdown`, `useAutosave`, updated `CollectionEditView`

### Reference implementation (`.rebuild/reference/core-convex/`)

The actual code that ran in production on master. Has several meaningful differences from the archive spec (see next section). Key files:

- `previewSnapshot.ts` — `upsertPreviewSnapshot` / `deletePreviewSnapshot` / `getPreviewSnapshot`
- `vexQuery.ts` — `createVexQuery` with `VexDraftsMode` context on `ctx`
- `model/collections.ts` — `getDocument` with `preview` flag for snapshot merging
- `core-valueTypes/generate.ts` — schema generation for `vex_status`, `vex_versions`

---

## Key Differences: Old Spec vs Reference Implementation

### 1. `vex_status` on every user collection, not just versioned ones

**Archive spec:** only injects `vex_status` when `versions.drafts: true`.

**Reference:** puts it on **every** user collection row as `v.optional(...)`:

```ts
// vex_status on ALL user collections
lines.push(`  vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),`);
if (collection.versions?.drafts) {
  lines.push(`  vex_version: v.optional(v.number()),`);
  lines.push(`  vex_publishedAt: v.optional(v.number()),`);
}
```

Rationale: even non-versioned collections benefit from `vex_status` in the schema — frontend queries can filter by it, RBAC can gate on it. `vex_version` and `vex_publishedAt` remain conditional since they're only meaningful with drafts active.

### 2. `vex_versions` always generated, unconditionally

```
// "Always generate vex_versions so removing versioning from a collection
//  doesn't break schema.ts imports that reference vex_versions."
```

The reference always emits `vex_versions` regardless of whether any collection has `versions.drafts: true`. If a user removes versioning from their last versioned collection, references to `vex_versions` in their Convex code don't break.

### 3. `previewSnapshot` is a 4th status in `vex_versions`

The reference's `vex_versions.status` has four literals, not three:

```ts
v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("autosave"),
  v.literal("previewSnapshot"),  // ← not in archive spec
)
```

Live preview works by the admin form writing a `previewSnapshot` row on every form change — upserted (not appended), one row per document. The preview iframe fetches this via `getDocumentForEdit` with `_vexDrafts: "snapshot"`. The `vex_versions` table does double duty: permanent version history AND transient live-preview state.

The reference also adds `restoredFrom: v.optional(v.number())` to track which version number was the source of a restore operation.

### 4. `createVexQuery` / `VexDraftsMode` — user-facing draft query wrapper

The reference adds a `createVexQuery` factory that wraps user-written Convex queries with a `_vexDrafts` arg, injecting a `ctx.drafts` field:

```ts
type VexDraftsMode = "snapshot" | true | false;
// "snapshot" → return transient preview snapshot from vex_versions
// true        → return latest draft version (from versioning system)
// false       → return published content only (default for frontend pages)
```

Users write frontend queries like:

```ts
export const getBySlug = vexQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("pages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!page) return null;

    if (ctx.drafts === "snapshot") {
      const snapshot = await getPreviewSnapshot({ ctx, collection: "pages", documentId: page._id });
      if (snapshot) return { ...page, ...snapshot };
    }
    return page;
  },
});
```

The live preview iframe calls this with `_vexDrafts: "snapshot"`. Public frontend pages call it normally (defaults to published). This wasn't in the archive spec but the roadmap explicitly called for `_vexDrafts` arg support in generated queries.

---

## Considerations Specific to the Rebuild Architecture

### A. Where do versioning mutations go in the factory pattern?

The rebuild uses `queryApi` / `mutationApi` / `globalsApi` factories registered in `convex/vex.ts`. Versioning adds a meaningful set of new endpoints:

- Mutations: `saveDraft`, `publish`, `unpublish`, `autosave`, `restoreVersion`
- Queries: `getDocumentForEdit`, `listVersions`

**Option 1 — Extend `mutationApi`:** always register versioning mutations; they throw if the collection isn't versioned. Simple for users but adds endpoints on every project.

**Option 2 — New `versionsApi` factory:** mirrors `globalsApi`. Users opt in explicitly:

```ts
// convex/vex.ts
export const { versions } = versionsApi(config, query, mutation);
// → api.vex.versions.saveDraft
// → api.vex.versions.publish
// → api.vex.versions.unpublish
// → api.vex.versions.autosave
// → api.vex.versions.restoreVersion
// → api.vex.versions.getDocumentForEdit
// → api.vex.versions.listVersions
```

**Decision leaning:** `versionsApi` is more consistent with `globalsApi` and has zero overhead for non-versioning projects. Go with this.

### B. `getDocumentForEdit` in `queryApi` or `versionsApi`?

The admin `CollectionEditView` needs to fetch either the plain document (`api.vex.get`) or the latest draft version (`api.vex.versions.getDocumentForEdit`) depending on whether the collection has `versions.drafts: true`. `CollectionEditView` branches on `collection.versions?.drafts` — so `getDocumentForEdit` lives in `versionsApi`.

### C. `VersionsConfig` needs to be added to `CollectionConfig` in the rebuild

The current rebuild's `CollectionConfig` has no `versions` field. It needs to be added to both `CollectionConfigInput` and `CollectionConfig` in `@vexcms/core`. Same structure as the archive spec:

```ts
interface VersionsConfig {
  drafts?: boolean;
  autosave?: boolean | { interval: number };
  maxPerDoc?: number;
}
```

### D. Globals versioning is already scaffolded

Spec 35 (globals) already included `versions.drafts` on `GlobalConfig` and `vex_status`/`vex_version`/`vex_publishedAt` on `vex_globals` rows. The versioning system extends to globals naturally with `collection: "vex_globals"` in `vex_versions` — no new tables needed. The `GlobalEditView` draft toolbar is already marked out-of-scope in Spec 35 with a note that it follows here.

### E. The roadmap's `environmentId` future-proofing requirement

From the roadmap (Spec 07 note):
> "Add optional `environmentId` parameter to publish/query functions so the API doesn't break when Spec 21 (environments) lands."

`saveDraft`, `publish`, and `getDocumentForEdit` should accept `environmentId?: string` from day one, even if the environment logic isn't implemented yet. Keeps the function signatures stable when environments ship as an enterprise feature.

### F. `previewSnapshot` vs autosave — same table, different semantics

The key insight from the reference: **live preview is a special case of the version coalesce pattern.** Both write to `vex_versions` and both use upsert (one row per document). The distinction is the `status` field:

| Status | Persistent? | Purpose |
|--------|------------|---------|
| `"draft"` | Yes | Explicitly saved draft (user hit "Save Draft") |
| `"autosave"` | Yes | Auto-coalesced save — survives session, part of version history |
| `"previewSnapshot"` | No | Transient form state for the live preview iframe — deleted on real save |
| `"published"` | Yes | Snapshot at the moment of publish — marks which version went live |

Live preview can piggyback on the versioning infrastructure without any separate storage mechanism.

---

## Tradeoffs to Decide Before Speccing

### `vex_status` on all tables vs only versioned

| | All tables | Only versioned |
|---|---|---|
| Schema complexity | Always present, always optional | Conditional injection |
| Non-versioned flexibility | Can filter by status in user queries | No status field at all |
| Dashboard clarity | `vex_status` visible on every row | Cleaner for simple collections |
| Reference precedent | ✅ Reference does this | ✗ |

**Lean:** all tables, matching reference. The extra optional field is negligible.

### `vex_versions` always generated vs conditional

| | Always | Conditional |
|---|---|---|
| Stability when removing versioning | ✅ No breakage | ✗ Must clean up references |
| Projects with no versioning | One extra empty table | No extra table |
| Reference precedent | ✅ Reference does this | ✗ |

**Lean:** always generate. One empty table is fine.

### `autosave` — server-side Convex mutation vs client-side localStorage

| | Server-side mutation | localStorage |
|---|---|---|
| Survives tab close | ✅ Yes | ✗ No |
| Convex round trips | One per interval | None until explicit save |
| Recovery on session restore | ✅ Full | ✗ None |
| Reference precedent | ✅ Reference does this | ✗ |

**Lean:** server-side, matching reference. The recovery story is too important to skip.

### Snapshot format — store as-is vs strip/normalize

The reference stores field values as-is in `snapshot: v.any()`. On restore, the snapshot becomes form `defaultValues`. Unknown fields (from schema changes since snapshot) are ignored by the form; missing fields get field defaults. No normalization pass.

**Lean:** store as-is. Simple, and the form layer handles schema drift gracefully.

---

## What the Rebuild Doesn't Have Yet

Nothing related to versioning exists in the current `packages/core/src/` or `packages/react/src/`:

- ✗ `versions` field on `CollectionConfig`
- ✗ `vex_status` / `vex_version` / `vex_publishedAt` in schema generation
- ✗ `vex_versions` table in schema generation
- ✗ `saveDraft`, `publish`, `unpublish`, `autosave`, `restoreVersion` mutations
- ✗ `getDocumentForEdit`, `listVersions` queries
- ✗ `versionsApi` factory
- ✗ `createVexQuery` / `VexDraftsMode`
- ✗ `StatusBadge`, `VersionHistoryDropdown` components
- ✗ Draft/publish toolbar in `CollectionEditView`
- ✗ Draft toolbar in `GlobalEditView` (deferred from Spec 35)

---

## Scope of Spec 36

Expected to be the largest spec to date. Rough breakdown:

| Area | Package | Items |
|------|---------|-------|
| Types | `@vexcms/core` | `VersionsConfig`, `VexVersionDocument`, `VexDraftsMode`, `extractUserFields` |
| Schema gen | `@vexcms/core` / `@vexcms/cli` | `vex_status` on all tables, `vex_version`/`vex_publishedAt` on versioned, `vex_versions` always |
| Server API | `@vexcms/core` | `saveDraft`, `publish`, `unpublish`, `autosave`, `restoreVersion`, `getDocumentForEdit`, `listVersions`, `upsertPreviewSnapshot`, `getPreviewSnapshot` |
| Client API | `@vexcms/core` | `versions.getDocumentForEdit`, `versions.listVersions`, `versions.saveDraft`, `versions.publish`, `versions.unpublish`, `versions.autosave`, `versions.restoreVersion` |
| Factory | `@vexcms/core` | `versionsApi(config, query, mutation)` |
| `createVexQuery` | `@vexcms/core` | `createVexQuery`, `VexDraftsMode`, `VexQueryCtx` |
| Admin UI | `@vexcms/react` | `StatusBadge`, `VersionHistoryDropdown`, `useAutosave`, `CollectionEditView` changes, `GlobalEditView` draft toolbar |
| App wiring | `apps/www` | `convex/vex.ts` + example collection with versioning |

---

## References

- `specs/archive/07-versioning-drafts-spec.md` — original detailed spec (old arch)
- `.rebuild/reference/core-convex/vexQuery.ts` — `createVexQuery` + `VexDraftsMode` implementation
- `.rebuild/reference/core-convex/previewSnapshot.ts` — `upsertPreviewSnapshot` / `getPreviewSnapshot`
- `.rebuild/reference/core-convex/model/collections.ts` — `getDocument` with preview flag
- `.rebuild/reference/core-valueTypes/generate.ts` — `vex_status` on all tables, `vex_versions` always generated
- `specs/35-globals-system/spec.md` — globals draft scaffolding (Step 9 wires `GlobalEditView` toolbar)
- `product/roadmap.md` — Spec 07 note on `environmentId` future-proofing
- `product/v0.1.0-launch-roadmap.md` — M3 (`_vexDrafts` arg in generated queries, live preview)
