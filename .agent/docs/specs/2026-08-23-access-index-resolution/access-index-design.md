# Access Index Resolution — Design

> Companion to `design-review.md` §5.6a. How a row-level read rule contributes an
> **index** to the query the framework builds, so list views read the rows the caller
> can see instead of reading everything and discarding.
>
> Rev 2. Governing correction: **`filter` is the rule; `withIndex` is a hint.** The
> index never carries authorization on its own. That removes a security hole, makes
> client-side checks work, and deletes the `needsFilter` machinery from rev 1.

Industry precedent: Payload's `read` returns `boolean | Where` merged into the query;
Directus, Sanity, and Hasura all push declarative predicates down. None post-filter
row-level reads in application code.

---

## 1. The governing invariant

An object-form rule **must** declare both:

```ts
read: {
  filter:    ({ data, user }) => boolean,   // the rule. Authoritative. Always runs.
  withIndex: { name, range },               // a hint. Narrows what gets read.
}
```

`withIndex`-only is not a valid shape. The reason is that `hasPermission` is called in
places where there is no query at all:

- `usePermission` on the client, against an already-fetched document
- `get` / `update` / `remove` — single document, no range to narrow
- the per-document pass inside `find`

With no `filter`, those call sites have nothing to evaluate. Returning `true` is a
security hole (the client would believe it may read a row it may not); returning
`false` breaks legitimate access. Requiring `filter` removes the question entirely.

### What this simplifies

The filter **always runs.** There is no `needsFilter` flag, no equivalence assertion,
and no way for the index to be the sole enforcement mechanism.

And running it is free in the good case: when the index range already expresses the
rule, the filter rejects nothing, so **pages come back full**. Pages are short only
when the filter is genuinely stricter than the index — the legitimate "index narrows,
filter refines" case, where short pages are unavoidable regardless of design.

Rev 1 tried to skip the per-document pass when the index "was the whole rule." That
required proving equivalence between an index range and a JS closure, which is not
possible, and it is what created the hole above. Deleted.

## 2. API

```ts
defineAccess({
  roles: ["admin", "editor", "contributor", "reviewer", "anon"],
  anonRole: "anon",
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { "*": true },
    editor: { pages: true },

    // Indexed row-level read. `filter` is the rule, `withIndex` makes it cheap.
    contributor: {
      pages: {
        read: {
          filter: ({ data, user }) => data.authorId === user._id,
          withIndex: {
            name: "by_author",
            range: ({ user }) => (q) => q.eq("authorId", user._id),
          },
        },
        update: ({ data, user }) => data.authorId === user._id,
      },
    },

    // Index narrows to published; filter refines further. Short pages here are
    // correct and expected — the rule really is stricter than the index.
    anon: {
      pages: {
        read: {
          filter: ({ data }) => data.vex_status === "published" && data.publicRegions.includes("us"),
          withIndex: {
            name: "by_status",
            range: () => (q) => q.eq("vex_status", "published"),
          },
        },
      },
    },

    // No index expresses array membership — plain callback, post-filtered.
    reviewer: {
      pages: { read: ({ data, user }) => user.assignedTeams.includes(data.teamId) },
    },
  },
});
```

So an action accepts either shape, and nothing else:

```ts
type ReadPermission<...> =
  | PermissionCheck<...>                                    // today, unchanged
  | { filter: PermissionCheck<...>; withIndex: AccessIndex<...> };
```

`name` is a static literal; `range` is a function of user/organization. Splitting them
this way is what makes the name statically known — required for §7's typing — while
keeping the constrained *values* dynamic.

### `range` is required

Not optional on the type, and never returning `undefined` at runtime. Two separate
drafts got this wrong in the same way, so both are recorded.

**Draft 1 — conditional `undefined`.** Allowed
`range: ({ user }) => user.isStaff ? undefined : (q) => q.eq("authorId", user._id)`
to mean "no narrowing for this caller." Dropped because:

1. **It is a role in disguise.** A user attribute that switches someone between
   "sees own" and "sees all" *is* a capability level, and capability levels are what
   roles are for. `userRolesField` already reads an array and `hasPermission`
   OR-merges, so `["contributor", "editor"]` yields "sees all" natively (§9.3) with no
   branching anywhere.
2. **It is a silent performance cliff.** `undefined` means "scan the whole table."
   A falsy bug in that expression degrades a 3-row indexed read into a 50,000-row scan
   with no error and no warning.
3. **It breaks continuation.** A conditional range has no fixed prefix position, so a
   caller written against position 1 emits an out-of-order `eq` and fails at runtime.
   Requiring a range removes that hazard and makes §8 Case A universally available
   whenever the names match.

**Draft 2 — optional `range?`.** Copied from `find`'s `withIndex`, where a range *is*
legitimately optional. It is not legitimate here, and the distinction is the point:

| | `find`'s `withIndex` | an access rule's `withIndex` |
|---|---|---|
| Purpose of a range-less index | order results by that index | nothing — excludes no rows |
| Who wants it | the caller, for sort order | nobody; access has no business setting sort order |

A range-less access index reads the whole table and filters per document — precisely the
behavior this feature exists to eliminate, arrived at silently by a declaration that
*looks* like it narrows. So `range` is required, and a caller who wants ordering uses
`find`'s own `withIndex` for it.

The one case that looked like a counter-example — `organization` absent, so nothing to
scope by — is a **deny**, not a scan. That belongs in `filter` returning `false`, which
is already how it works. The index's job is narrowing, never authorization (§1).

Downstream: `QueryIndex.range` (the resolved output) is likewise required.
`QueryIndex.range` — after `pickQueryIndex` arbitration — stays optional, and only
there, because the winner may be a caller's range-less ordering index.

### Why not one combined callback

A single callback receiving `{ user, organization }` and returning
`{ filter, withIndex }` would nest a second callback (the one that receives `data`)
inside the first. Two levels of closure, two signatures to learn — and worse, the
outer callback would have to be invoked on **every document**, since `hasPermission`
needs the filter, allocating a fresh object per row. Separate keys are flatter, each
function has one job and one signature, and only `filter` ever sees a document.

## 3. Object form is only valid on query-shaped actions

`create`, `update`, `delete` authorize a single document. There is no range to narrow,
so a `withIndex` there is a silent no-op. Restrict it in `RolePermissions` so it is a
compile error:

```ts
[A in TSubjects[S]["action"]]?: A extends QueryShapedAction   // "read" | "readDrafts"
  ? ReadPermission<...>
  : PermissionCheck<...>;
```

## 4. Typing index names against the user's schema

`vex generate` emits `IndexesBySlug` next to the existing `DocumentBySlug`, resolved
with the same infer-or-widen shape as `CollectionSlug` (`types/generated.ts:60-64`):

```ts
declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    IndexesBySlug: {
      pages: "by_slug" | "by_author" | "by_status";
      media: "by_filename";
    };
  }
}
```

```ts
/**
 * Maps each collection slug to the union of index names declared on its table.
 *
 * - **Before `vex generate`:** resolves to `Record<string, string>`.
 * - **After `vex generate`:** e.g. `{ pages: "by_slug" | "by_author" }`.
 */
export type IndexesBySlug = GeneratedVexTypes extends {
  IndexesBySlug: infer I extends Record<string, string>;
}
  ? I
  : Record<string, string>;

/** Index-name union for one slug; widens to `string` pre-generation. @internal */
export type IndexNameFor<S extends string> = S extends keyof IndexesBySlug
  ? IndexesBySlug[S]
  : string;
```

`SubjectEntry` gains `indexes` beside `action` / `data` / `fields`, so `SubjectMap`
carries it per resource and a misspelled index name is a compile error.

## 5. `resolveAccessIndex`

Resolves an index and nothing else. Authorization stays entirely with
`hasPermission`, unchanged.

```ts
/**
 * Resolves the index an access rule contributes to a query, if any.
 *
 * Called once per query, before the Convex query is built. Mirrors
 * `hasPermission`'s role resolution and OR-merge semantics, but answers a
 * query-scoped question ("which index narrows this query?") rather than a
 * document-scoped one ("may they read this row?").
 *
 * Never authorizes. The rule's `filter` still runs per document via
 * `hasPermission`, so a missing or skipped index can only cost reads, never
 * admit a row.
 *
 * @param props.access - Resolved access config; absent or disabled ⇒ no index.
 * @param props.user - Caller, or `null` for anonymous (uses `anonRole`).
 * @param props.organization - Active organization, when the config declares one.
 * @param props.resource - Subject slug.
 * @param props.action - Query-shaped action (`read` | `readDrafts`).
 * @returns The index to apply, or `undefined` to scan.
 */
export function resolveAccessIndex(props: {
  access?: VexAccessConfig;
  user: Record<string, unknown> | null;
  organization?: Record<string, unknown>;
  resource: string;
  action: string;
}): QueryIndex | undefined;
```

### Multi-role behaviour

Roles OR-merge — `hasPermission.ts:294` / `:298`, docstring `:67-68`: *"any role
allowing … allows."* An index may only be applied when it cannot hide a row some role
permits:

| Caller's roles | Index applied |
|---|---|
| `admin` (`"*": true`) | none — unrestricted |
| `contributor` only | `by_author` |
| `contributor` + `editor` (`pages: true`) | **none** — editor permits everything |
| `contributor` + `reviewer` (different rules) | **none** — union, one range per query |

Fails open to scanning, never to intersecting. Correctness is unaffected either way
because `filter` runs regardless; only read cost changes.

## 6. Index-slot arbitration and `find`

Convex permits one `withIndex` per query. Today the slot is free —
`CollectionListView.tsx:60-72` passes neither `withIndex` nor `order`.

```ts
/**
 * Chooses the single index a query will use.
 *
 * 1. **Caller's index wins.** An explicit caller index is usually a highly
 *    selective lookup; the access `filter` still enforces the rule, so this
 *    costs reads, never correctness.
 * 2. **Same index ⇒ merge** both ranges, no degradation.
 * 3. **Free slot ⇒ access claims it.** The list-view case.
 */
export function pickQueryIndex(props: {
  accessIndex?: QueryIndex;
  callerIndex?: { name: string; range?: IndexRangeFn };
}): QueryIndex | undefined;
```

```ts
// api/find/server.ts
const accessIndex = resolveAccessIndex({
  access: args.config?.access,
  user: args.auth?.user ?? null,
  organization: args.auth?.organization,
  resource: args.collection,
  action: CRUD_ACTIONS.read,
});

const findQuery = buildQuery({
  ...args,
  resolvedIndex: pickQueryIndex({ accessIndex, callerIndex: args.withIndex }),
});

// Unchanged from today — the filter always runs. When the index expresses the
// rule it rejects nothing and the page stays full.
const result = await findQuery.paginate(args.paginationOpts);
docs = result.page.filter((d) => hasPermission({ ...permissionArgs, data: d }));
```

Ordering stays `withIndex` → `order` → `filter` per the existing docstring
(`find/server.ts:32`), so the index narrows before any predicate reads a row.

## 7. Knowing which collections have an access index

`range`'s parameter type (§8) depends on whether the caller's `name` matches the
access index for that collection and action. That has to be knowable at the type
level, from any call site — including framework components that only know a slug at
runtime.

Same generated-registry pattern. `vex generate` reads the access config and emits the
query-shaped index declarations per slug and action:

```ts
declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    AccessIndexBySlug: {
      pages: { read: "by_author" };   // pages.read declares an access withIndex
      // media absent — no access index on any action
    };
  }
}
```

```ts
/** The access index name for a slug + action, or `never` when none is declared. */
export type AccessIndexNameFor<S extends string, A extends string> =
  S extends keyof AccessIndexBySlug
    ? A extends keyof AccessIndexBySlug[S]
      ? AccessIndexBySlug[S][A]
      : never
    : never;
```

For `media` this is `never`, so `TName extends AccessIndexNameFor<...>` is always
false and `range` always receives a fresh `q` — today's behavior, no new surface. For
`pages` with `name: "by_author"` it matches and `range` receives `access`.

Preferable to deriving this from the access config's type via the `__subjects`
phantom: no generic threading, so it works wherever only the slug is known.

## 8. One form: `{ name, range }`, where `range`'s parameter depends on the name

There is no separate callback form. `withIndex` is always `{ name, range }`. What
changes is **what `range` receives**, decided by whether `name` matches the access
index for that collection and action:

| Caller's `name` | `range` receives | Meaning |
|---|---|---|
| **matches** the access index | `access` — the builder *after* the access prefix | continue the access range |
| **differs** from the access index | `q` — a fresh builder at position 0 | own index; access prefix not applied |
| no access index exists | `q` — a fresh builder at position 0 | today's behavior |

That is why `q` is never needed alongside `access`: when the names match, starting
over at position 0 could only override the access prefix — which the `filter` then
rejects in full, so it is guaranteed-empty waste. When the names differ, there is no
prefix to continue and `access` would be meaningless. Exactly one of the two is
coherent in each case, so the parameter is simply named for which one you got.

```ts
range: TName extends AccessIndexNameFor<TSlug, TAction>
  ? (access: AccessRangeFor<TSlug, TAction>) => IndexRange   // pre-positioned
  : (q: FreshRangeBuilder<TSlug, TName>) => IndexRange;      // position 0
```

### Why this is type-safe for free

A Convex index range is a positional prefix chain and the builder type tracks
position (`convex/src/server/index_range_builder.ts:64-95`):

```ts
export interface IndexRangeBuilder<Document, IndexFields, FieldNum extends number = 0>
  extends LowerBoundIndexRangeBuilder<Document, IndexFields[FieldNum]> {
  eq(fieldName: IndexFields[FieldNum], value: ...): NextIndexRangeBuilder<Document, IndexFields, FieldNum>;
}

type NextIndexRangeBuilder<Document, IndexFields, FieldNum> =
  PlusOne<FieldNum> extends IndexFields["length"]
    ? IndexRange                                          // exhausted
    : IndexRangeBuilder<Document, IndexFields, PlusOne<FieldNum>>;
```

So `access` is just `IndexRangeBuilder<Doc, Fields, N>` where `N` is however many
fields the access prefix consumed. TypeScript then permits only field `N` next,
rejects re-constraining consumed fields, collapses to terminal `IndexRange` when the
index is exhausted, and enforces `eq*` → lower-bound → upper-bound ordering via
`LowerBoundIndexRangeBuilder` / `UpperBoundIndexRangeBuilder`. No new machinery.

### Worked comparison

For continuation to be possible the access rule must name the **compound** index and
constrain only its prefix:

```ts
// access config
contributor: {
  pages: {
    read: {
      filter: ({ data, user }) => data.authorId === user._id,
      withIndex: {
        name: "by_author_category",                              // compound
        range: ({ user }) => (q) => q.eq("authorId", user._id),  // prefix only
      },
    },
  },
}
```

Schema: `.index("by_author_category", ["authorId", "categoryId"])`.

**Case A — caller names the same index ⇒ `access`, positioned at `categoryId`:**

```ts
find({
  ctx, collection: "pages", config,
  withIndex: {
    name: "by_author_category",
    range: (access) => access.eq("categoryId", newsId),
  },
  paginationOpts,
});

// access: IndexRangeBuilder<PagesDoc, ["authorId", "categoryId"], 1>
// runs:   withIndex("by_author_category", q => q.eq("authorId", danaId).eq("categoryId", newsId))
// reads:  only Dana's news pages — BOTH constraints served by the index.
```

```ts
range: (access) => access.eq("authorId", someoneElseId)
//                        ^^^^^^^^^^ ✗ not assignable to '"categoryId"' — field 0 consumed
```

**Case B — caller names a different index ⇒ `q`, at position 0:**

```ts
find({
  ctx, collection: "pages", config,
  withIndex: {
    name: "by_slug",
    range: (q) => q.eq("slug", "about"),
  },
  limit: 1,
});

// q:     IndexRangeBuilder<PagesDoc, ["slug"], 0>
// runs:  withIndex("by_slug", q => q.eq("slug", "about"))
// access prefix NOT applied; the access `filter` runs per-document over the 1 row.
// reads: 1
```

```ts
range: (q) => q.eq("authorId", danaId)
//               ^^^^^^^^^^ ✗ not assignable to '"slug"' — by_slug's field 0 is "slug"
```

Both cases are correct. Case B costs a per-document check over a single row, which is
free, and that is the general guarantee from §1: the `filter` is the rule, so choosing
your own index can only cost reads.

Because `range` always returns a range (§2), the prefix position is fixed for every
caller — so continuation has no runtime hazard and needs no prerequisite. That
constraint existed only to guard the conditional-`undefined` form, which is gone.

### Status

Case B is today's behavior and ships with the spec. **Case A is deferred** — it needs
`AccessIndexNameFor` / `AccessRangeFor` threaded to the `find` call site, and §6
arbitration is already correct without it. It also only pays off when the access rule
names a compound index, which is a deliberate modelling choice rather than the default.
Ship Case B, prove the access index API, then add Case A.

## 9. Worked examples

Every example below runs against this one project. Setup is stated once.

### 9.0 The shared setup

**Generated schema** — `convex/vex.schema.ts`:

```ts
export const pages = defineTable({
  title: v.string(),
  slug: v.string(),
  authorId: v.id("users"),
  categoryId: v.optional(v.id("categories")),
  teamId: v.optional(v.id("teams")),
  publicRegions: v.array(v.string()),
  updatedAt: v.number(),
  // injected because pages declares versions.drafts
  vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  vex_publishedAt: v.optional(v.number()),
  vex_publishedId: v.optional(v.id("pages")),
})
  .index("by_slug", ["slug"])
  .index("by_author", ["authorId"])
  .index("by_status", ["vex_status"])
  .index("by_updated", ["updatedAt"])
  .index("by_published", ["vex_publishedId"]);

export const media = defineTable({ filename: v.string(), size: v.number() })
  .index("by_filename", ["filename"]);
```

**Collection config:**

```ts
export const pagesCollection = defineCollection({
  slug: "pages",
  labels: { singular: "Page", plural: "Pages" },
  versions: { drafts: true, autosave: true },
  admin: { table: { defaultPageSize: 25, serverPageSize: 100 } },
  fields: { /* ... */ },
});
```

**Access config:**

```ts
export const access = defineAccess({
  roles: ["admin", "editor", "contributor", "reviewer", "anon"],
  anonRole: "anon",
  userCollectionSlug: "users",
  userRolesField: "roles",
  resources: [pagesCollection, mediaCollection],
  permissions: {
    admin: { "*": true },

    editor: { pages: true, media: true },

    contributor: {
      pages: {
        read: {
          filter: ({ data, user }) => data.authorId === user._id,
          withIndex: {
            name: "by_author",
            range: ({ user }) => (q) => q.eq("authorId", user._id),
          },
        },
        saveDraft: ({ data, user }) => data.authorId === user._id,
      },
    },

    // Un-indexable: array membership on the USER, checked against the document.
    reviewer: {
      pages: { read: ({ data, user }) => user.assignedTeams.includes(data.teamId) },
    },

    anon: {
      pages: {
        read: {
          filter: ({ data }) =>
            data.vex_status === "published" && data.publicRegions.includes("us"),
          withIndex: {
            name: "by_status",
            range: () => (q) => q.eq("vex_status", "published"),
          },
        },
      },
    },
  },
});
```

**Data:** `pages` holds 50,000 rows — 40,000 `published`, 10,000 `draft`. Dana
authored 3. Rae's teams account for 500. `media` holds 12,000 assets and declares no
access rule beyond `editor`/`admin`.

---

### 9.1 Dana (contributor) opens the admin Pages list

`CollectionListView` passes no `withIndex` (`CollectionListView.tsx:60-72`), so the
slot is free:

```ts
// what the view calls
find({ collection: "pages", depth: 1, paginationOpts: { numItems: 100, totalDocs: true, cursor: null } })

// what resolveAccessIndex returns for Dana
{ name: "by_author", range: (q) => q.eq("authorId", danaId) }

// the query that runs
ctx.db.query("pages").withIndex("by_author", (q) => q.eq("authorId", danaId)).order("asc").paginate(...)
```

The index range contains exactly 3 rows. Pagination reads those 3; the filter
(`data.authorId === user._id`) rejects none.

**Reads: 3. Round trips: 1. Page: full, `isDone: true`. Footer count: 3, from the
same index.**
Before this design: ~2,000 round trips with a bounded client loop, or an empty first
page without one.

### 9.2 Ed (editor) opens the same list

`editor: { pages: true }` is unrestricted, so `resolveAccessIndex` returns `undefined`
and `hasPermission` allows every row.

```ts
ctx.db.query("pages").order("asc").paginate({ numItems: 100, cursor: null })
```

**Reads: 100 (one server page). Page: full.** An unrestricted reader is never
narrowed — narrowing here would be wrong, not just slow.

Note `totalDocs: true` still `.collect()`s to count all 50,000 (`find/server.ts:257`).
That is `design-review.md` §5.6a fix 3, independent of this design.

### 9.3 Dana is granted `editor` in addition to `contributor`

Roles OR-merge (`hasPermission.ts:294`). Editor's blanket grant wins, so
`resolveAccessIndex` returns `undefined` and Dana now sees all 50,000 pages.

Applying `by_author` here would have **hidden rows her editor role permits** — the
multi-role trap from §5. The resolver fails open to scanning.

### 9.4 Anonymous visitor loads the public blog index

The site's own Convex query calls `find` with no `withIndex`:

```ts
// convex/pages.ts
export const listPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: (ctx, args) => find({ ctx, collection: "pages", config, paginationOpts: args.paginationOpts }),
});

// resolved for the anon role
{ name: "by_status", range: (q) => q.eq("vex_status", "published") }
```

The index range is the 40,000 published rows — that is the *scan domain*, not what
gets read. Pagination reads `numItems` from it, so a page of 12 reads 12 rows. The
filter then applies the region check.

**Reads: ~12 per page. Draft rows never enter the range at all.** Pages can be
slightly short when the region check rejects a row — correct, because the rule really
is stricter than the index.

This is also where the two-row draft model pays off: the 10,000 draft rows are
excluded at the index level, so the duplicate-row hazard never reaches a caller.

### 9.5 Frontend page-by-slug — caller's index displaces the access index

```ts
// convex/pages.ts
export const getBySlug = query({
  args: { slug: v.string() },
  handler: (ctx, args) =>
    find({
      ctx, collection: "pages", config, limit: 1,
      withIndex: { name: "by_slug", range: (q) => q.eq("slug", args.slug) },
    }),
});
```

`pickQueryIndex` gives the slot to the caller — `by_slug` is far more selective than
`by_status`. The access filter still runs over the single row returned.

**Reads: 1. Correct either way**, because `filter` is the rule (§1). A dev warning
names the compound index (`["vex_status", "slug"]`) that would serve both.

This is the common shape, and it is why overriding the access index must stay legal —
see §9.8.

### 9.6 Rae (reviewer) opens the Pages list — the slow path

`user.assignedTeams.includes(data.teamId)` is array membership on the user, which no
index expresses. `resolveAccessIndex` returns `undefined`.

```ts
ctx.db.query("pages").order("asc").paginate({ numItems: 100, cursor: null })
// → 100 rows read, filter keeps ~1 (500 of 50,000 permitted)
```

**Reads: 100 per iteration. Page: short.** With the bounded client loop (5 iterations)
she reads 500 rows and sees roughly 5 pages' worth of her 500 — then a Load More
button. Functional, visibly slower, and the dev console warns:

```
[vexcms] Role "reviewer" governs read on "pages" (50,000 rows) with a per-document
callback and no withIndex. Pages will be short and reads scale with table size.
Add an index on the field this rule tests and declare it via
access.permissions.reviewer.pages.read.withIndex.
```

Rae's rule cannot be indexed as written. The fix is a data-model change —
denormalising `teamId` membership — which is the user's call, not the framework's.

### 9.7 `media` — no access index declared

```ts
find({ collection: "media", withIndex: { name: "by_filename", range: (q) => q.eq("filename", "logo.svg") } })
```

`media` is absent from `AccessIndexBySlug`, so `AccessIndexNameFor<"media", "read">`
is `never`, `range` always receives a fresh `q`, and there is no `access` to reach
for. Identical to today — the access-index surface simply does not exist for
collections without one.

### 9.8 Overriding the access index deliberately

Dana's dashboard wants her recent pages sorted by recency. `by_updated` is not the
access index, so `range` receives a fresh `q` at position 0:

```ts
find({
  ctx, collection: "pages", config,
  withIndex: { name: "by_updated", range: (q) => q.gte("updatedAt", cutoff) },
  paginationOpts,
});
```

Caller keeps the slot; `by_author` is not applied; the filter rejects everyone else's
rows. Pages are short and reads scale with the `updatedAt` range — but the query is
**correct**, and it is the caller's explicit choice.

This capability must not be forbidden: slug lookups, sorted lists, relationship
pickers, and category queries all need their own index on a collection that also has
an access index. It is the majority of non-list-view reads.

---

### 9.9 Why `access` and `q` are never both offered

`range` receives exactly one builder, and which one is decided by `name` (§8). There
is no `{ access, q }` props object, because in each case only one of them is coherent:

1. **Name matches the access index** → a fresh `q` at position 0 could only *replace*
   the access prefix (`by_author eq someoneElse`), which the `filter` then rejects in
   full. A guaranteed-empty page that still burns reads. Not a security hole — `filter`
   is the rule — but never useful.
2. **Name differs** → there is no access prefix on that index, so `access` would have
   nothing to continue and no meaningful position.

So the parameter is simply named for what you got. Overriding the access index is
fully supported (§9.8) — it is just spelled "name a different index," not "ask for `q`."

### 9.10 Bounds that push toward the fast path

Everything above works on the slow route. The bounds exist to make the slow route
*visible*, not impossible:

| Bound | Default | Escape hatch |
|---|---|---|
| Client `loadMore` iterations | 5 | `api.pagination.maxLoadMoreIterations` in vex config |
| Dev warning: bare-callback `read` on a large collection | rows > 1,000 | none — informational |
| Dev warning: caller index displaced an access index | always | none — informational |

Raising the iteration cap is documented as the *second* thing to try; the warning text
names the collection, the role, and the field to index so the first thing to try is
obvious. No bound ever changes a result — only how many round trips it takes to
assemble one.

## 10. Where it is used

| Site | Uses the index? |
|---|---|
| `find` (list views, relationship pickers) | ✅ |
| `search` | ✅ |
| `totalDocs` count path | ✅ — counts the caller's rows, not the table |
| `get` / findByID | ✗ single document; `hasPermission({ data })` is exact |
| `create` / `update` / `remove` | ✗ no query to narrow |

Users get it automatically: their own `find` calls inherit the access index, so admin
panel and frontend enforce one rule from one source instead of a hand-copied
`withIndex` that drifts. `resolveAccessIndex` is exported for raw Convex queries.

Users can still write rules with no index. That is their data model, and the framework
should make it visible rather than silent: in dev, warn when a bare-callback `read`
rule governs a collection past a row threshold, naming the collection, the role, and
the field to index.

## 11. Docs obligations

- Row-level `read` rules **should** use the object form. A bare callback is
  post-filtered and will hit the `loadMore` bound on large collections.
- **`filter` is the rule; `withIndex` only reduces reads.** The two must express the
  same intent — a `withIndex` looser than its `filter` costs reads, and one *stricter*
  than its filter silently hides rows. State this prominently; it is the one way to
  misuse the API.
- Object form is valid only on `read` / `readDrafts` — enforced at compile time (§3).
- Document multi-role behaviour (§5): a permissive role removes the index; two
  differing restrictive roles fall back to scanning.
- **Model capability differences as roles, not as branches inside a rule.** If some
  users under a role should see more, give them an additional role — `hasPermission`
  OR-merges, so the broader grant wins automatically (§9.3). A rule that branches on a
  user attribute is a role that was not declared, and it defeats index narrowing.
- Document one-index-per-query contention (access field + sort field, access field +
  filter field) and the compound-index answer.
- Indexable shapes are equality/range on a document field vs. a query-time value.
  Array membership, string methods, regex, and cross-table lookups are not.

## 12. Versioning ties in directly

The published-only constraint from `design-review.md` §5.6 is a framework-supplied
access index:

```ts
{ name: "by_status", range: () => (q) => q.eq("vex_status", "published") }
```

Injected by `find` for versioned collections when the caller isn't requesting drafts —
not authored by the user, and deliberately not a permission rule. It flows through
`pickQueryIndex` like any other access index, so it participates in slot arbitration
and degrades to a per-document check when the caller owns the slot. Same code path, no
special case.

This also makes the two-row draft model read correctly by construction: the status
index excludes draft rows from public queries at the index level, so the duplicate-row
hazard of two rows per document never reaches a caller.

## 13. The floor

If a predicate cannot be expressed as an index range, rows must be read to evaluate
it. Finding 3 permitted documents among 50,000 is inherently 50,000 reads. Payload has
the same floor and declines to support non-declarative read rules for list queries.

The only architecture that beats it is a maintained ACL junction table —
`(userId, documentId)` indexed by `userId` — at the cost of maintaining it on every
write and every permission change. Out of scope; recorded so the floor reads as
inherent rather than an oversight.
