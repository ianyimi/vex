# Convex Component Decision Report — VexCMS Infrastructure

> Should VexCMS ship with its own internal Convex component for versions, globals, and admin metadata?
> Written as a decision record. Covers all tradeoffs, the maprios migration context, multi-component admin, and the `createVexQuery` question.

**Verdict up front: No. Don't introduce a VexCMS internal component.**

The rest of this document is the complete rationale so you can revisit it confidently if circumstances change.

---

## What We're Actually Deciding

Two distinct questions that are easy to conflate:

1. **Should VexCMS infrastructure** — `vex_versions`, `vex_globals`, admin metadata — live in its own dedicated Convex component that ships as part of every VexCMS install?

2. **Should the admin panel support managing multiple user-defined Convex components** from a single interface (the Spec 43 multi-component workspace model)?

These are completely separate decisions. You can say No to (1) and Yes to (2) — and that's the right answer. This document focuses on (1) but addresses both.

---

## The Core Constraint: Convex Components Can't Join Across Boundaries

This is the single most important fact in this decision. Every other consideration is secondary to it.

In Convex, a component has its own schema, functions, and table namespace. Tables in a component are **completely isolated** from tables in the host app. To read data across that boundary at query time, you must make a function call:

```ts
// ✗ Cannot do this in a single query (tables are in different components)
const doc = await ctx.db.get(documentId);             // host: posts table
const version = await ctx.db.query("vex_versions")... // component: vex_versions table

// ✓ Must do this instead — two round trips
const doc = await ctx.db.get(documentId);             // host: posts table
const version = await ctx.runQuery(                   // component function call
  vexComponent.getLatestVersion,
  { collection: "posts", documentId }
);
const merged = { ...doc, ...version.snapshot };
```

This isn't a workaround limitation. It's the architectural guarantee of the component model — isolation is the point. But it means any code that needs to read from both the user's content tables **and** the VexCMS infrastructure tables in the same function cannot exist as a single efficient operation.

---

## Why This Kills the Component Idea for Drafts and Versions

`getDocumentForEdit` is the most critical read in the entire versioning system. The admin edit view calls it every time a document is opened. It needs to:

1. Fetch the main document from the user's content table (e.g. `posts`)
2. Fetch the latest version snapshot from `vex_versions`
3. Merge them and return the combined result

With `vex_versions` in the host app — one query, one round trip:

```ts
// All in one Convex query — fast, transactionally consistent
export async function getDocumentForEdit({ ctx, collection, documentId }) {
  const [doc, version] = await Promise.all([
    ctx.db.get(documentId),
    ctx.db.query("vex_versions")
      .withIndex("by_document_latest", q =>
        q.eq("collection", collection).eq("documentId", documentId))
      .order("desc")
      .first()
  ]);
  if (!doc) return null;
  return version ? { ...doc, ...version.snapshot } : doc;
}
```

With `vex_versions` in a component — two sequential round trips, no transactional guarantee:

```ts
// Must split: host reads, then component call, then merge
export async function getDocumentForEdit({ ctx, collection, documentId }) {
  const doc = await ctx.db.get(documentId);
  if (!doc) return null;

  // This is a function call to another component — adds latency, not a DB read
  const version = await ctx.runQuery(
    vexComponent.getLatestVersion,
    { collection, documentId }
  );

  return version ? { ...doc, ...version.snapshot } : doc;
}
```

Every single admin edit view load, every live preview snapshot merge, every draft restoration check — all of them have this split. The admin panel becomes measurably slower and the code is significantly more complex. There is no way around this without abandoning the component boundary.

The same applies to:
- **Live preview**: snapshot needs to merge with the main document on every form change
- **`listDocuments` with `_status` column**: `_status` lives on the main document (host) — no cross-component issue, but any enrichment with version metadata hits the boundary
- **Globals with relationships**: `siteSettings.activeTheme` is an ID pointing at the `themes` table in the host app — resolving it from a component query requires a cross-component hop

---

## You Already Decided This Once

From the roadmap, under "Why Certain Features Were Deprioritized":

> **Convex Component Packaging** — The Convex Components data isolation model prevents joining Vex-managed tables with app tables in a single query. **This kills the core value prop.** The better-auth component hit the same wall. Distribution via Convex Stack (full project template) gives discoverability without the isolation penalty.

The `@convex-dev/better-auth` component was the real-world proof of concept. Better Auth needs to join user/session data with application data constantly — putting it in a component broke everything that depended on knowing who the current user is while querying content. Same pattern, same result.

The versioning system has an even tighter coupling than auth: every single edit view load requires cross-boundary data. If auth was already a no-go, versions in a component is definitively a no-go.

---

## The `vex_` Prefix Already Solves Dashboard Isolation

The concern driving this question is developer experience in the Convex dashboard — when someone is managing a blog, they don't want `vex_versions` and `vex_globals` cluttering their view alongside `posts` and `authors`.

The `vex_` prefix already solves this:

```
Convex Dashboard tables
├── authors
├── posts
├── themes
├── vex_globals        ← clearly VexCMS infrastructure
├── vex_versions       ← clearly VexCMS infrastructure
└── vex_users          ← (if auth tables are prefixed)
```

The prefix provides clean visual namespacing. The Convex dashboard lists tables alphabetically, so all `vex_*` tables cluster together at the bottom. Developers immediately know what's their content and what's framework infrastructure. This costs nothing and requires no architectural trade-off.

---

## Per-Collection Version Tables: Better or Worse?

You raised the idea of separate tables per collection for drafts — `vex_posts_versions`, `vex_authors_versions`, etc. — whether in a component or in the host. Let's address this directly.

**What it would give you:**
- Typed snapshots per collection (not `v.any()` for data)
- Slightly cleaner table view in dashboard (maybe)
- Per-collection version history without a `collection` discriminator in queries

**What it costs:**
- Schema generator must create N version tables dynamically, one per versioned collection — significantly more complex codegen
- If a collection is renamed, its version table must be migrated separately
- Every version query becomes collection-specific (no way to query "all recent drafts across collections" in admin)
- More tables in the Convex dashboard, not fewer

**Why the single table wins:**

The `vex_versions` table with `collection + documentId` compound indexes is already O(1) for all version access patterns:

```
.index("by_document_latest", ["collection", "documentId", "createdAt"])
.index("by_document_status", ["collection", "documentId", "status"])
.index("by_autosave", ["collection", "documentId", "isAutosave"])
```

Querying "all versions for post X" is:
```ts
ctx.db.query("vex_versions")
  .withIndex("by_document_latest", q =>
    q.eq("collection", "posts").eq("documentId", postId))
  .order("desc")
  .take(50)
```

This is exactly as fast as a dedicated `vex_posts_versions` table would be. The discriminator column adds no overhead — it's part of the compound index. You lose nothing by keeping it unified and gain cross-collection queries for free (e.g., "show me all recent draft saves across all collections" for an audit feed).

---

## What Could Actually Benefit from a Component?

Not everything is ruled out. Here are the candidates that don't have the join problem:

| Feature | Join-free? | Current roadmap position |
|---------|-----------|--------------------------|
| Audit log | ✅ Append-only, no join needed | Phase 5 (deferred) |
| API key management | ✅ Completely isolated | Phase 3 |
| Rate limiting counters | ✅ Isolated | Not planned |
| Admin user preferences | ⚠️ Ties to user IDs from host auth | Not planned |
| Onboarding completion tracking | ⚠️ Ties to user IDs | Already done as `vex_*` table |

**Audit log** is the strongest candidate — it records `{collection, documentId, userId, action, diff, timestamp}` without needing to join back to the content table for its core display. A component could expose `logAuditEvent(mutation)` and `listAuditEvents(query)` cleanly.

**But none of these are pressing right now.** Audit log is Phase 5. API keys are Phase 3. The complexity of a component is not justified by features that aren't on the immediate roadmap. If you add a component later for audit logs specifically, that's a contained, reversible decision that doesn't affect the core data architecture.

---

## The `createVexQuery` / `VexDraftsMode` Question

You correctly identified that the new `@vexcms/core/server` API functions (`find`, `get`, `setGlobal`) make the `createVexQuery` wrapper pattern obsolete.

The old pattern (reference implementation):
```ts
// User wraps their Convex query with createVexQuery to get ctx.drafts
export const getBySlug = vexQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("pages").withIndex("by_slug", ...).first();
    if (ctx.drafts === "snapshot") {
      const snapshot = await getPreviewSnapshot({ ctx, collection: "pages", documentId: page._id });
      if (snapshot) return { ...page, ...snapshot };
    }
    return page;
  },
});
```

The new pattern (server API functions):
```ts
// User writes a plain Convex query, uses the versioning API functions directly
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    // The core API functions handle draft-awareness as an explicit parameter
    return get({ ctx, collection: "pages", slug: args.slug, drafts: "snapshot" });
  },
});
```

Or even simpler — user doesn't need to write this at all because `queryApi` already exposes `get` with draft support:

```ts
// convex/vex.ts — this is the only code users write
export const { find, get, search } = queryApi(config, query);
export const { create, update, remove } = mutationApi(config, mutation);
export const { versions } = versionsApi(config, query, mutation);
```

`createVexQuery` was designed for a world where users needed to augment the `ctx` object to thread draft state through. In the rebuild, draft state is an explicit parameter on the server API functions. No wrapper needed.

**What replaces `VexDraftsMode`:** The `versionsApi` registers `getDocumentForEdit` which handles the draft + snapshot merging internally. Users who need draft-aware content in their own Convex functions call the server API directly:

```ts
import { getDocumentForEdit } from "@vexcms/core/server";

// Inside any user-written Convex query:
const editableDoc = await getDocumentForEdit({ ctx, collection: "posts", documentId });
```

The `"snapshot"` / `true` / `false` modes from `VexDraftsMode` collapse into two explicit paths:
- **Admin edit view**: always calls `getDocumentForEdit` (always gets latest draft + snapshot)
- **Frontend public pages**: always calls `get` without draft flags (always gets published)
- **Live preview iframe**: calls `get` with `{ drafts: "snapshot" }` — or the iframe is served through the admin's own route which already has the preview snapshot

---

## The Maprios Migration Timeline

You mentioned needing multi-component support by the time the main app migrates (not www). Let's be precise about what each migration phase requires:

### www migration (sooner)
- Single Convex deployment, single schema
- VexCMS installed the normal way — collections in the host schema
- Zero multi-component requirements
- No pressure from this migration

### app migration (later, requires Spec 43)
- Separate Convex component for the app's tables
- The admin panel needs to switch between "www component" and "app component"
- This requires Spec 43 (workspace routing in admin, `defineComponent()` in config)
- **This is about the admin UI routing to user-defined components, not about VexCMS being a component itself**

The key insight: when maprios uses two components, `vex_versions` still lives in **each component's own schema** (generated by the VexCMS CLI for that component). The versioning system doesn't need to span components — each workspace is self-contained. When the admin panel switches to the "app" workspace, it uses that component's `vex_versions` table. When it switches to the "www" workspace, it uses www's `vex_versions`.

There is no scenario where a single `vex_versions` table needs to span multiple user components. The workspace model keeps everything scoped.

---

## Summary: All Questions Answered

| Question | Answer |
|----------|--------|
| Should VexCMS have its own internal component for versions/globals? | **No** — join constraint makes `getDocumentForEdit` require two round trips, adding latency to every admin edit view |
| Should this ship via create CLI as a required component? | **No** — same reason, plus added setup complexity for zero benefit |
| Does per-collection version tables fix anything? | **No** — single `vex_versions` with compound index is equally fast; per-collection adds codegen complexity and loses cross-collection queries |
| Does `createVexQuery` / `VexDraftsMode` still make sense? | **No** — the new server API functions make it obsolete; draft-awareness is an explicit parameter, not a context wrapper |
| Is `versionsApi` the right direction? | **Yes** — consistent with `queryApi` / `mutationApi` / `globalsApi` pattern |
| Does multi-component admin (Spec 43) change this decision? | **No** — Spec 43 is about the admin UI routing to user-defined components; each workspace has its own `vex_versions` table; nothing needs to span components |
| What does the www migration require? | Nothing new — single schema, single component, standard VexCMS setup |
| What does the app migration require? | Spec 43 (workspace routing), not a VexCMS internal component |
| Could anything benefit from a VexCMS component? | Audit log (Phase 5) is the only clean candidate; everything else has join dependencies |
| When should you revisit this? | If Convex adds cross-component joins, or if a genuinely join-free infrastructure feature needs isolation |

---

## What This Means for the Versioning Spec

The architecture for Spec 36 is confirmed:

- `vex_versions` lives in the **host app schema**, generated by the CLI alongside collection tables
- `vex_status` on every user collection row as `v.optional(...)` — matches reference
- `vex_versions` always emitted regardless of whether any collection has `versions.drafts: true` — matches reference
- `versionsApi(config, query, mutation)` factory pattern — consistent with `globalsApi`
- No `createVexQuery` / `VexDraftsMode` — obsoleted by the server API function approach
- Draft-awareness is an explicit parameter on server functions, not a context injection
- Single `vex_versions` table, not per-collection tables

---

*Filed: 2026-08-04. Revisit only if Convex's component isolation model changes.*
