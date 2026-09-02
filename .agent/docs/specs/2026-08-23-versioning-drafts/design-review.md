# Spec 36 — Versioning & Drafts: Pre-Spec Design Review

> Rev 4 — 2026-08-21. Adopts the **two-row draft model** (a published row and a
> draft row coexist in the main table) over rev 3's one-row + snapshot model.
> Sound, and closer to Sanity's proven semantics.
>
> One part of it must be inverted or every publish breaks referential integrity
> (§3.2). Four cases are genuinely unresolved (§6).

---

## 1. The Model

Per logical document, **at most two rows** in the main table:

| Row | `vex_status` | `vex_publishedId` | Lifetime |
|---|---|---|---|
| published | `"published"` | `undefined` | created once, **never deleted while the document exists** |
| draft | `"draft"` | `Id<self>` → published row | created on first edit of a published doc, deleted on publish |

A never-published document is a single `draft` row with `vex_publishedId: undefined`.

`vex_versions` holds immutable snapshots — one row per meaningful state, with lineage
pointers so the edit tree is reconstructable. It is never scanned; only point-queried
by `(collection, documentId)`.

Autosave patches the draft row in place. Publish/unpublish move status on the main
table and emit history rows.

### Why this beats rev 3's snapshot model

Drafts are **first-class documents**: real typed fields, real indexes, real
validation. Rev 3 put draft content in `snapshot: v.any()` inside `vex_versions`,
which means no schema enforcement, no sorting or filtering on draft content, and a
merge step on every edit-view load. This model deletes all three. The admin edit view
just reads the draft row.

Cost is accounted for in §3 and §4. It is worth paying.

---

## 2. Publish and Unpublish

### 2.1 — Two publish paths, and both keep IDs stable

**Never-published draft** (`vex_publishedId === undefined`): patch in place,
`vex_status: "draft" → "published"`. The row keeps its `_id`. This is the one case
where promote-in-place is correct, because there is no prior published row to preserve.

**Draft with a published parent**: **copy the draft's fields into the published row,
then delete the draft row.**

### 2.2 — This is the one part of your design that must be inverted

You described the opposite — publish deletes the old published row and the draft
becomes the new published document. That destroys the published `_id` **on every
publish**, and it is the canonical, externally-referenced identity:

- **`relationship` fields dangle.** Every page linking to this page stores the
  published row's `_id`. Publish deletes it → every inbound relationship breaks, and
  `populate` / depth resolution returns null for all of them. This alone is fatal.
- Permalinks, cached URLs, live-preview URLs, and the admin edit route all change on
  every publish.
- Convex `_id` is assigned by the database on insert and cannot be chosen, so there
  is no way to "keep" the old id on the new row.

Sanity's model — which this otherwise matches — survives because the *draft* is the
row that gets deleted and the published document keeps its id forever. The draft's id
is derived (`drafts.<id>`), so it is stable without being canonical.

Inverting it costs nothing and preserves every property you wanted: at most two rows,
published content untouched during editing, full history, draft as a real document.

```
publish(draftRow):
  if (draftRow.vex_publishedId === undefined):
      patch(draftRow, { vex_status: "published", vex_publishedAt: now })
      emitVersion(draftRow, status: "published")
  else:
      published = get(draftRow.vex_publishedId)
      emitVersion(published, status: "published")        // supersedeed state → history
      patch(published, { ...userFields(draftRow), vex_publishedAt: now })
      delete(draftRow)
```

### 2.3 — Link direction: draft → published only

Do **not** put a reverse `hasDraft` / `vex_draftId` pointer on the published row.
Patching the published row to flag "a draft exists" invalidates every Convex query
subscribed to that document — so **starting a draft would push a reactive update to
every visitor currently reading that page.** One-directional linking leaves the
published row completely untouched until publish.

"Does this document have a draft?" is one indexed lookup:
`.index("by_published", ["vex_publishedId"])` → `.eq("vex_publishedId", publishedId).first()`.

### 2.4 — Unpublish

Flips the published row to `vex_status: "draft"` and emits a history row. **Rejects
while a draft row exists** for that document (§6.1) — otherwise you'd hold two
`draft` rows for one logical document, with the survivor's `vex_publishedId` pointing
at a row that is no longer published.

Invariant this preserves: *at most one draft row per document, and it points at a
published row or at nothing.*

---

## 3. Consequences of Two Rows

### 3.1 — Status filtering becomes a correctness requirement, not a permission concern

This is the most important consequence, and it **resolves the read-path argument**
from earlier revs by forcing the right answer.

With two rows sharing a slug, an unfiltered `pages` query returns **the same logical
document twice**. So filtering is no longer an optimization layered onto a permission
rule — it is data integrity, required on every query path, including single-document
`get` and slug lookups.

Therefore: **bake status filtering into the query builder for versioned collections.
Never express it as a permission rule.** Permission callbacks go back to being about
*who*, not *what state* — which is the correct separation, and it means the anon role
needs no knowledge of `vex_status` at all.

### 3.2 — Slug uniqueness must exclude drafts

A draft shares its parent's slug by definition. Unique-slug validation must scope to
`vex_status === "published"`, or every edit of a published document reports a
collision with itself.

### 3.3 — Admin list views must collapse pairs

A list of pages must show one entry per logical document — the draft when one exists,
otherwise the published row — with an indicator that unpublished changes exist.
Filtering to published-only would hide the very thing the editor is working on.
This is admin-only; the public path filters to published and never sees pairs.

### 3.4 — Delete is a cascade

Deleting a document must delete the published row, its draft row if any, and its
`vex_versions` rows. Three deletes behind one `delete` action.

---

## 4. Autosave and History

Autosave patches the **draft row in place** — no row growth in the main table — and
**also emits a `vex_versions` row**, exactly like an explicit `saveDraft` (§6.2).

This is safe here and was not safe on `master`: autosave fires only when form values
differ from the last saved values, so two successive identical snapshots cannot
occur. `master`'s duplicate-row problem came from its fixed 2s interval, which
re-fired whether or not anything changed — which is why it needed an `isAutosave`
flag and coalesce-by-upsert.

Dropped from scope as a result: the `isAutosave` flag, `coalesceAutosave`, and any
prune-to-newest retention rule. Version history becomes a linear chain of genuinely
distinct states — which is also what makes the lineage tree below meaningful, since
every row represents a real edit.

### Live preview needs no snapshot mechanism

`master` needed a `previewSnapshot` status because interval autosave lagged the form.
Here the draft row tracks the form on change, so **the draft row is the preview
state.** The preview route reads it under `readDrafts`.

Deleted from scope: the `previewSnapshot` status literal,
`upsertPreviewSnapshot`/`deletePreviewSnapshot`/`getPreviewSnapshot`, the
orphan-snapshot cleanup problem, and the transient-row skip in every version scan.

### Lineage

You want to rebuild the edit tree. Two fields on the version row cover it:

- `parentVersion?: number` — the state this one was derived from. Linear chain.
- `restoredFrom?: number` — already in `master`. The only source of *branching*:
  restoring v3 while v7 exists produces a row whose parent is v3.

Plus `publishedAt?: number`, set once and never cleared, so "was this state ever
live" is monotonic and survives unpublish. `master` mutates `status` backwards on
unpublish (`versions.ts:344-350`), destroying exactly that record.

---

## 5. The Read Path

### 5.1 — What the problem actually is

`find/server.ts:193-227` lets Convex fill a page of `numItems` from the index, then
drops rows in JS:

```ts
convexPaginationResult = await findQuery.paginate(args.paginationOpts);
docs = convexPaginationResult.page.filter((d) => hasPermission({ ..., data: d }));
```

`isDone` and `continueCursor` stay correct, so no document is *lost* — the **page is
short**.

### 5.1a — Correction: the client already compacts, so this is latency, not corruption

Earlier revs claimed ragged grids and wrong page numbers. That applies to a
page-number client. **This project doesn't have one.**
`packages/react/src/hooks/usePaginatedQuery.ts` is accumulate-and-slice:

```ts
// :144  accumulate every server page into one flat array
const [allResults, setAllResults] = useState<TDocument[]>(initialData?.page ?? []);
// :152-153  slice a fixed window out of it
const endIndex = (clientPageIndex + 1) * (clientPageSize ?? query.paginationOpts.numItems);
const visibleResults = allResults.slice(startIndex, endIndex);
// :154  fetch more when the window outruns what we have
const needsServerFetch = endIndex >= allResults.length && !isDone;
// :212  subsequent pages append
setAllResults((prev) => [...prev, ...result.page]);
```

So a server page of 5 where 12 was asked doesn't render 5 items — it renders whatever
the window holds and triggers another fetch. **Page sizes stay correct; the cost is
extra round trips.** The compaction the util idea would provide already exists,
client-side.

`totalDocs` is also better than earlier revs claimed: `useTotalDocs` captures it
**once**, guarded on `totalDocsCount === undefined` (`usePaginatedQuery.ts:314-330`),
so the `.collect()` scan is a one-time cost when the list opens, not per interaction.
Past Convex's 32k limit it throws, is caught at `find/server.ts:273-280`, and surfaces
as `totalDocs: null`.

### 5.2 — The symptoms that do survive

`loadMore` fetches exactly **one** server page per call (`usePaginatedQuery.ts:156-162`):

```ts
function loadMore() {
  if (needsServerFetch && result.continueCursor) setCursor(result.continueCursor);
  else setClientPageIndex((prev) => prev + 1);
}
```

If that page comes back short, the window still isn't full, so:

1. **"Load More" appears to do little or nothing** — the user clicks repeatedly while
   each fetch contributes a handful of rows.
2. **Worst case the first render is empty.** Drafts cluster (someone bulk-creates 20),
   page 1 filters to zero permitted rows, and the list renders empty with `isDone:
   false` and a Load More button. Looks broken.
3. Extra Convex function calls per visible page.

Admin analogue: per-author rule, editor owns 3 of 500 pages, pageSize 25. Convex reads
25, filters to 0, the editor sees an empty list and has to click Load More ~20 times
to reach their own work.

### 5.3 — Is it still relevant after this design? Mostly no.

| Path | Status |
|---|---|
| Public / anon reads | **Eliminated.** Status moves into the query builder (§3.1) and is the only rule there, so nothing is post-filtered. |
| Admin roles with plain `read: true` | **Never manifested.** `hasPermission` returns true for every row, so `.filter()` is a pass-through and pages are full. |
| Admin with a per-document read callback | **Still present**, masked into extra round trips by §5.1a. |
| `totalDocs` scan | Unchanged, and independent of drafts. |

Two rows per document makes the filter mandatory for correctness (§3.1), which is
what pushes status out of the permission layer — and that is precisely what removes
the public path from this table.

### 5.4 — The constraint: only one `withIndex` per query

`withIndex` is caller-supplied and Convex permits exactly one per query
(`find/server.ts:305-311`). If a caller passes
`withIndex: { name: "by_slug", range: q => q.eq("slug", "hello") }`, the status
constraint **cannot also be an index range.**

That's fine, because of the finding below — it just costs reads, not correctness.

### 5.5 — Convex applies `.filter()` inside pagination

`numItems` is counted **after** filters:

```
// convex/src/server/pagination.ts:100-105 — maximumRowsRead
"This limits rows entering the query pipeline before filters are applied.
 Use this when filtering for rare items, where low numItems won't bound
 execution time because the query scans many rows to find matches."
```

`paginate` ships the whole query — filters included — to the `queryPage` syscall with
`pageSize` (`convex/src/server/impl/query_impl.ts:296-305`). So a pushed-down
`.filter()` returns **full pages**.

### 5.6 — Resolution

In `buildQuery`, for a versioned collection where the caller isn't requesting drafts:

- **no caller `withIndex`** → `withIndex("by_status", q => q.eq("vex_status","published"))`.
  Full pages, minimal reads.
- **caller supplied `withIndex`** → add the status constraint to `.filter()`.
  Full pages, extra reads bounded by `maximumRowsRead`.

Either way pages are full and `totalDocs` needs no scan. Generate
`.index("by_status", ["vex_status"])` on versioned collections for the first case.

> Fix 4's concrete design — the `withIndex` access API, `resolveAccessIndex`,
> index-slot arbitration, generated index-name typing, and `find` integration —
> lives in `access-index-design.md`.

### 5.6a — Fix menu, in end-user terms

All four only matter when a role has a **per-document read callback**. With
`read: true` roles and status pushed into the query builder, none of them fire.

Running example: `pages`, role `contributor` with
`read: ({ data, user }) => data.authorId === user._id`. Dana is a contributor.

#### Fix 1 — `loadMore` fills the window. Necessary, but must be bounded.

*400 pages, Dana wrote 3.* Dana opens Pages, `clientPageSize` 25. Server reads index
rows 1–25, filters to 0 of Dana's. Today: **empty list with a Load More button.**
With fix 1 the client keeps fetching until the window fills or data runs out — Dana's
3 pages sit around positions 50, 180, 390, so it loops ~16 times, then renders 3
pages. Dana sees a spinner for a second or two, then the right answer.

**Correction to the earlier recommendation: an unbounded client loop is a footgun.**
*50,000 pages, Dana wrote 3.* Each iteration reads only `numItems` (25) index rows,
so filling the window means ~2,000 sequential HTTP round trips. The browser hammers
the backend and the list effectively never loads. **Cap the loop** (5 iterations),
then stop and surface a Load More affordance. Bounded, it always terminates; it just
can't fill the window in the sparse case on its own.

#### Fix 2 — server refill loop. Collapses N round trips into 1.

```ts
async function paginateFiltered(args, permitted) {
  const collected = [];
  let { cursor } = args.paginationOpts;
  let isDone = false, rowsRead = 0;
  while (collected.length < args.paginationOpts.numItems && !isDone) {
    // buildQuery must be re-invoked: a Convex query object is single-use
    // (takeQuery() at convex/src/server/impl/query_impl.ts:291). The existing
    // totalDocs path already does this at find/server.ts:256.
    const p = await buildQuery(args).paginate({
      numItems: args.paginationOpts.numItems - collected.length,
      cursor,
    });
    rowsRead += p.page.length;
    collected.push(...p.page.filter(permitted));
    ({ continueCursor: cursor, isDone } = p);
    if (rowsRead >= READ_BUDGET) break;   // else this is unbounded
  }
  return { page: collected, continueCursor: cursor, isDone };
}
```

Same 400-page scenario: the scan happens **inside one Convex invocation** instead of
across 16 HTTP requests. Dana's list renders in ~200ms rather than ~2s. Cursors stay
contiguous — `continueCursor` is the cursor after the last row *read* — so no gaps or
duplicates.

It does not solve the sparse case either. At 50,000 rows with `READ_BUDGET` 4,000,
the server returns an empty page with `isDone: false`; the client (bounded per fix 1)
retries a handful of times and gives up. Dana sees a partial list and a Load More
button that has to be clicked repeatedly.

**Post-filtering cannot fix sparse rules. Only fix 4 can.**

#### Fix 3 — split `totalDocs` into its own query. Yes, it shares fix 2's budget.

The page fetch and the count run in **one function body** —
`find/server.ts:194` paginates, `:257` `.collect()`s — so they consume the same
invocation's read budget. Your instinct is right: a `READ_BUDGET` for fix 2 has to be
chosen against whatever `totalDocs` is about to read, and vice versa.

*Media library, no permission callback at all.* `media` holds 12,000 assets;
`MediaCollectionListView.tsx:85` sets `totalDocs: true`. Every time an editor opens
Media, the server `.collect()`s all 12,000 documents — full field data, not just ids —
purely to render "12,000 items" in the footer. **Opening the media library takes
seconds, every time.** Past the limit it throws, is caught at `:273-280`, and returns
`totalDocs: null`: the footer count silently disappears and any "page X of Y" has no Y.

*Media library plus a per-uploader rule.* Now one invocation runs the refill loop
(say 4,000 rows) **and** the count collect (12,000 rows). Media documents carry lots
of metadata, so the combined read trips the byte limit before the document limit.
**The whole query fails — not just the count.** The editor sees an error or an empty
library, where previously they'd have seen a working list with a missing number.

Fix: make the count a **separate query function**. Each gets its own read budget, a
count failure can no longer degrade the page, and the client already fetches it once
(`useTotalDocs`, `usePaginatedQuery.ts:314-330`) so nothing else changes.

#### Fix 4 — declared filters. The only real fix for sparse rules.

*Multi-tenant: 50,000 pages across 200 client orgs, ~250 each. Rule:*
`read: ({ data, organization }) => data.orgId === organization._id`.

An org admin opens Pages. To find 25 of their rows the server must walk ~5,000 rows
of other orgs' pages — **on every list load**. That's seconds of latency and 5,000
document reads per page view, which is real money on Convex's pricing. As the table
grows it eventually trips the read limit and **the list stops working entirely.**

With the rule declared as a filter, `q.eq(q.field("orgId"), orgId)` reaches the
database: pages come back exactly 25 (Convex counts `numItems` post-filter, §5.5).
Still ~5,000 rows read, because `.filter()` doesn't use an index. Declare a matching
`by_org` index too and it drops to 25 rows read — the list is instant and costs
nothing.

That is the whole point of fix 4: it's the only option that lets the predicate reach
an index. Everything else is a smarter way of reading rows you're going to discard.

#### The index question — what user-declared indexes actually fix

Position taken: **users declare indexes for every field they reference in their
access config; the framework does not compensate for unindexed access rules.**
Correct, and it collapses most of this menu. With one crucial caveat.

**An index alone changes nothing.** It is inert unless a query targets it via
`withIndex`. `hasPermission` is a JS closure evaluated against rows that have
*already been fetched* — it cannot consult an index. From this repo's own docstring
(`find/server.ts:64-66`):

> Prefer `withIndex` for performance — `filter` scans every document in the range and
> is O(n). Use `filter` for secondary conditions that can't be expressed as index
> equality ranges.

So an index on `authorId` does **zero** work until something emits
`withIndex("by_author", q => q.eq("authorId", userId))`. That something is fix 4.

| | Rule stays a closure | Rule declared → `.filter()` | Rule declared → `withIndex` |
|---|---|---|---|
| **No index** | short pages, full scan | full pages, full scan | n/a |
| **Index declared** | short pages, full scan — *index unused* | full pages, full scan — *index still unused* | **full pages, ~pageSize reads** |

Only the bottom-right cell is fast. Reaching it requires the index **and** fix 4.
That promotes fix 4 from "defer" to *the mechanism that makes user indexes pay off*.

#### Revised verdict per fix

| Fix | With declared filters + user indexes |
|---|---|
| **2 — server refill loop** | **Deleted from the roadmap.** It exists solely to compensate for post-filtering. With an indexed predicate the first page is already full — there is nothing to refill. |
| **1 — bounded `loadMore`** | **Kept as a safety net that a correctly indexed project never hits.** Still required for genuinely un-indexable rules. Bound is configurable in the vex config; on hitting it, the warning names the collection and points at adding an index rather than raising the bound. |
| **3 — `totalDocs`** | **Survives.** See below — indexes don't help the case that actually hurts. |
| **4 — declared filters** | **Promoted to required.** Without it the user's indexes are decorative. |

#### Why `totalDocs` survives indexes

Two cases, and they behave oppositely:

- **Scoped count** (`contributor` sees own pages): the index narrows the `.collect()`
  from 50,000 rows to that user's 250. Negligible — agreed, solved by indexes.
- **Unscoped count** (admin with `read: true` on a 12,000-asset media library):
  there is no predicate to index. Counting all rows means reading all rows, and Convex
  has no count aggregate. **An index cannot make this cheaper.**

Moving media to the `loadMore` paradigm doesn't help either — page size and total
count are orthogonal. Rendering "12,000 items" in the footer is a 12,000-row read
regardless of how many are displayed.

So fix 3 is the one genuinely unsolved item, and it is independent of both drafts and
access control. Real options: drop exact counts for large collections (`totalDocs:
null` → UI says "many"), or maintain a denormalized counter. Splitting it into its own
query function is still worth doing for read-budget isolation, but it does not remove
the cost.

#### Index contention — one `withIndex` per query

Convex permits exactly one index per query, so an access-declared index and a
caller-declared index collide. Today the slot is **free**: `CollectionListView.tsx:60-72`
passes neither `withIndex` nor `order`, so the access layer can claim it unopposed.

That changes the moment the data table gains column sorting. Then a contributor rule
on `authorId` sorted by `updatedAt` needs a **compound** index
`["authorId", "updatedAt"]` — one `withIndex` serving both filter and order — and the
framework needs index-selection logic to pick it. Document the compound-index
requirement alongside the access-field requirement.

#### Docs obligation

The access docs must state which rule shapes are indexable, because the boundary is
Convex's `FilterBuilder` (`convex/src/server/filter_builder.ts:87-247`), not intuition:

- ✅ indexable — equality or comparison between a document field and a value known at
  query time: `data.authorId === user._id`, `data.orgId === organization._id`,
  `data.vex_status === "published"`
- ❌ not indexable — array membership (`user.roles.includes(data.team)`), string
  methods, regex, cross-table lookups

Un-indexable rules stay legal and keep today's post-filter behavior. The docs should
say plainly: fine on small collections, will hit the `loadMore` bound on large ones,
and the fix is to restructure the rule — not to raise the bound.

#### Priority

| Fix | Do it when |
|---|---|
| 1 — bounded, configurable `loadMore` loop | **Now.** Today's empty-first-render is a real bug. |
| 4 — declared filters | **Now**, given the index position. Without it, indexes are decorative. |
| 3 — split `totalDocs` query + count strategy | **Now** for the split; decide the count strategy separately. |
| 2 — server refill loop | **Never.** Superseded by 4. |

For the maprios migration specifically: anon reads are index-backed published-only and
admin roles have plain `read: true`, so nothing here is on the critical path except
fix 3's count strategy, once the media library passes a few thousand assets.

### 5.7 — Why the fully general fix still can't work

Not pagination mechanics — permission checks are arbitrary JS closures. Pushing one
down requires expressing it in Convex's `FilterBuilder`, which offers exactly
`eq, neq, lt, lte, gt, gte, add, sub, mul, div, mod, neg, and, or, not, field(path)`
(`convex/src/server/filter_builder.ts:87-247`):

| Rule | Compilable? |
|---|---|
| `data.authorId === user._id` | ✅ |
| `data.orgId === org._id && data.archived !== true` | ✅ |
| `user.roles.includes(data.team)` | ❌ no array membership |
| string methods, regex, cross-table lookups | ❌ |

You cannot compile a closure. Making rules *declared* instead of *written* is an API
break on `defineAccess` — that's the restructure, and it's Tier 3. Don't.

Tier 2, additive and optional later: let a role supply a filter beside its callback,
so compilable rules get full pages and the rest keep current behavior. Not needed
now, because §3.1 removes status from the permission layer entirely.

---

## 6. Resolved (2026-08-21)

### 6.1 — Unpublish with an outstanding draft → reject

`unpublish` throws while a draft row exists for the document: *"publish or discard
the active draft first."* The two states are contradictory — a `draft` row whose
`vex_publishedId` points at a no-longer-published row is not representable. Rejecting
keeps the invariant "at most one draft row per document, and it points at a published
row or nothing."

### 6.2 — Autosave emits history

Autosave writes a version row like any explicit `saveDraft`. Safe because autosave
fires **only when form values differ from the last saved values**, so successive
identical snapshots can't occur — the duplicate-row problem that forced `master`'s
coalescing was an artifact of its fixed 2s interval.

Consequences: no `isAutosave` flag, no coalesce-by-upsert, no prune-to-newest
retention rule. History is a linear chain of genuinely distinct states, which is also
what makes the §4 lineage tree meaningful.

### 6.3 — Published-history cap: per-collection setting, deferred

Add to `versions` config later; ship without it. Justified: these rows live only in
the versions table and are read only when the history menu is opened — never on the
public path, never in a list query. Growth is a storage concern, not a latency one.

### 6.4 — Toggle backfill: one-shot now, auto-detection later

Ship the one-shot user-invoked backfill action. Target design, deferred:

- `versions.defaultStatus: "published" | "draft"` per collection — the status new and
  pre-existing documents get.
- On dev start, probe `by_status` for rows with `vex_status: undefined` in any
  collection that has drafts configured.
- If any exist, run the backfill with that collection's `defaultStatus`.

Note the probe can't be an equality range on `undefined` for the same reason §5.4
applies — it needs a scan or a "was this collection ever backfilled" marker. Design
that when the feature lands, not now.

### 6.5 — Read path: indexes are the user's job; ship 1, 3, 4 and drop 2

Governing decision: **users declare indexes for every field referenced in their access
config, and the framework does not compensate for unindexed access rules.** Documented
in the access docs, with the indexable/non-indexable boundary spelled out (§5.6a).

- **Fix 4 — declared filters. Ship.** Required, not optional: an index is inert until
  a query targets it via `withIndex`, and `hasPermission` evaluates against
  already-fetched rows. Without fix 4 the user's indexes do nothing.
- **Fix 1 — bounded `loadMore` loop. Ship.** Safety net for genuinely un-indexable
  rules. Bound is configurable in the vex config; the warning on hitting it names the
  collection and points at adding an index rather than raising the bound.
- **Fix 3 — split `totalDocs` into its own query. Ship the split.** It shares the page
  fetch's read budget today (`find/server.ts:194` + `:257`, one invocation), so a count
  failure can take the page down with it. The underlying cost survives indexes for
  unscoped counts — decide the count strategy separately (§5.6a).
- **Fix 2 — server refill loop. Dropped.** It exists only to compensate for
  post-filtering; an indexed predicate returns a full first page with nothing to refill.

---

## 7. RBAC — Resolved

`packages/core/src/access/` was built anticipating this:

```ts
// access/constants.ts:20-27
export const DRAFT_ACTIONS = {
  readDrafts: "readDrafts", saveDraft: "saveDraft",
  publish: "publish", unpublish: "unpublish",
} as const;

// access/types.ts:139-144, 158-162
type HasDrafts<T> = T extends { versions?: { drafts?: infer D extends boolean } }
  ? D extends true ? true : false : false;

[R in TResources[number] as ExtractSlug<R>]: {
  action: CrudAction | (HasDrafts<R> extends true ? DraftAction : never);
}
```

Draft actions appear only when a resource declares `versions.drafts: true`.
Type-level, no runtime cost, no matrix migration. `usePermission` unchanged.
Drafts are actions on the collection subject, not a separate resource.

| Capability | Action |
|---|---|
| create document | `create` |
| read published content | `read` |
| read draft rows + version history | `readDrafts` |
| edit published content in place (non-versioned) | `update` |
| save a draft — incl. autosave and restore | `saveDraft` |
| publish / unpublish | `publish` / `unpublish` |
| delete document (cascades, §3.4) | `delete` |
| prune version history | **`deleteVersions`** ← only addition |

One line in `constants.ts`; `DraftAction` is derived, `SubjectMap` picks it up.

`master` checked `update` for every draft mutation and left five endpoints with
**zero** authorization — `getVersionSnapshot` (:415), `listVersions` (:477),
`getDocumentForEdit` (:500), `initializeVersion` (:557), `backfillVersionStatus`
(:615). Three return full draft content.

---

## 8. Retracted from Earlier Revs

### 8.1 — No autosave/publish race; two of three defects now moot

`getLatestVersion` skips transient statuses (`master:model/versions.ts:96`), so rev 1's
race does not exist. Retracted.

Of the three defects raised in its place, **this model removes two outright:**

- *`publish` losing autosaved work* — gone. Publish reads the draft **row**, which is
  always current. No snapshot resolution at all.
- *`getLatestVersion` O(n) `.collect()` scan (`master:model/versions.ts:86-102`)* —
  no longer on the hot path. The edit view reads the draft row directly; the versions
  table is touched only when someone opens history. Still index it, but the pressure
  is gone.
- *`JSON.stringify` promote-vs-append dedupe (`master:versions.ts:243`, `:263`)* —
  also gone, because publish copies fields between rows rather than comparing
  snapshots. Delete the concept.

### 8.2 — Delete `backfillVersionStatus`, don't harden it

Migrates documents predating `vex_status`. You have no legacy rows. The CLI caller is
already dead:

```ts
// packages/cli/src/lib/generateSchema.ts:219
const hasVersioning = config.collections.some((c) => c.versions?.drafts);
// packages/cli/src/lib/migrate.ts:234
client.mutation("vex/versions:backfillVersionStatus" as any, { collectionSlug, cursor })
```

`CollectionConfig` (`packages/core/src/collections/types.ts:283-307`) has no
`versions` field, so `hasVersioning` is always `false` — and `tsc --noEmit` on
`packages/cli` reports nothing on that line. It compiles, looks alive, never fires.
Delete the `migrate.ts` path and the `generateSchema.ts:219-230` branch. Don't port
the mutation or `initializeVersion`. Residual need is §6.4.

---

## 9. Settled

- **No Convex component.** Host-side joins required; `@convex-dev/better-auth` proved
  the failure mode.
- **`vex_status` / `vex_publishedAt` / `vex_publishedId` on versioned collections
  only** — reverses `master`'s "all tables". On a non-versioned collection nothing can
  ever write the field.
- **`vex_versions` always emitted**, so toggling versioning off doesn't break
  `schema.ts` imports.
- **Single versions table**, `(collection, documentId)` compound indexes, keyed to the
  *published* row's id so history survives draft churn.
- **No `createVexQuery` / `VexDraftsMode`.** Draft-awareness is an explicit parameter.
- **Snapshots stored as-is** (`v.any()`) in history. The form layer handles drift.
- **`environmentId?: string`** accepted-and-ignored on `saveDraft` / `publish` /
  `getDocumentForEdit` from day one.
- **`versionsApi(config, query, mutation)`**, mirroring `globalsApi`.
- Globals reuse the versions table with `collection: "vex_globals"`. Their versioning
  fields are genuinely unbuilt — `generateVexSchema.test.ts:343-357` asserts their
  absence and `.agent/docs/specs/35-globals-system/spec.md` D9 confirms the deferral.
  Spec 36 adds them, inverts that test, wires the `GlobalEditView` toolbar. Note
  globals are single-instance, so the two-row model applies as
  `vex_globals` + one draft row per slug.

## 10. Carry Over from `master`

- `extractUserFields`: strips `_id`, `_creationTime`, and the `vex_*` system fields
  before writing a history snapshot.
- First-edit bootstrap: with no version rows, snapshot the current published row as
  `v1 published` before writing the first draft.
- Restore stays client-side — read a version snapshot, hydrate the form,
  `saveDraft({ restoredFrom })`. Non-destructive and reversible.
- Admin UI: `StatusBadge`; `VersionHistoryDropdown` (version/status/creator/timestamp,
  restore + delete, current-version highlight, delete confirmation); `useVexPreview`
  iframe → admin `postMessage({ type: "vex:preview-updated" })`.
- **Not** carried: publish-deletes-published (§2.2), `unpublish`'s status rewrite
  (superseded by `publishedAt`), interval autosave and coalesce-by-upsert (§4),
  `previewSnapshot` status (§4), `backfillVersionStatus` / `initializeVersion` (§8.2),
  the `JSON.stringify` dedupe and `.collect()` scan (§8.1).

---

## 11. Spec Scope

All design decisions are resolved. This is the build list.

1. `versions: { drafts, autosave, maxPerDoc }` on `CollectionConfigInput` /
   `CollectionConfig` — currently absent entirely.
2. Schema gen: `vex_status` / `vex_publishedAt` / `vex_publishedId` on versioned
   collections; `by_status` and `by_published` indexes; versions table always;
   globals versioning fields.
3. Status filtering in `buildQuery` per §5.6 — index when free, `.filter()` when the
   caller owns the index. Never a permission rule (§3.1).
4. `deleteVersions` action; `readDrafts` enforced on every draft read (§7).
5. `versionsApi`: `saveDraft`, `publish` (both paths, §2.1), `unpublish` (rejects with
   an outstanding draft, §6.1), restore path, `listVersions`, `deleteVersion`.
   No `getDocumentForEdit` merge — the draft row *is* the document.
6. Slug-uniqueness scoping (§3.2), admin list pair-collapsing (§3.3),
   delete cascade (§3.4).
7. Lineage fields on version rows: `parentVersion`, `restoredFrom`, `publishedAt` (§4).
8. Autosave: patch draft row + emit history, no `isAutosave` flag, no coalescing (§6.2).
9. Admin UI: draft toolbar, `StatusBadge`, `VersionHistoryDropdown`,
   `GlobalEditView` toolbar.
10. `loadMore` fills the client window, iteration-capped, cap configurable in the vex
    config, warning points at indexes (§6.5 fix 1).
11. Declared filters on access rules, pushed to `withIndex` when an index matches,
    else `.filter()` (§6.5 fix 4). Access docs state the indexable boundary.
12. Split `totalDocs` into its own query function (§6.5 fix 3).
13. One-shot user-invoked toggle backfill (§6.4).
14. Delete the dead CLI backfill path (§8.2).

Deferred, explicitly: published-history cap setting (§6.3), `versions.defaultStatus`
+ dev-start auto-backfill (§6.4), unscoped-count strategy (§5.6a fix 3), index
selection for compound access+sort indexes — not needed until the data table gains
column sorting (§5.6a).

Dropped: server-side pagination refill loop (§5.6a fix 2), superseded by 11.
