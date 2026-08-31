# SpacetimeDB as a VexCMS backend — feasibility & tradeoffs

> Research only. No code changed. Date: 2026-08-18.
> Sources: SpacetimeDB 2.0 docs, `clockworklabs/SpacetimeDB` parser source,
> `get-convex/convex-backend` persistence source, and this repo at `vex.git/dev`.

## TL;DR

A SpacetimeDB VexCMS is **buildable but is a different product**, not a port. The blocker is
not the API surface — it's that SpacetimeDB has **no `ORDER BY`, no subscription `LIMIT`, no
argument-taking read functions, no `v.any()` equivalent, and forbids destructive schema
migration**. Those five facts collectively delete the admin panel's list view as currently
designed and the entire dynamic-field-shape model.

Recommendation: **do not** put both backends in `@vexcms/core`. Split core into
`@vexcms/core` (already-agnostic config/field/type layer, ~70% of it) and two backend
packages. Treat SpacetimeDB as a research spike, not a v0.1.0 concern.

---

## 1. Under the hood: Convex vs SpacetimeDB

### Convex — MVCC document log + separately materialized index rows, on a SQL engine

Verified from `get-convex/convex-backend/crates/postgres/src/sql.rs`:

```sql
CREATE TABLE documents (
    id BYTEA NOT NULL, ts BIGINT NOT NULL, table_id BYTEA NOT NULL,
    json_value BYTEA NOT NULL, deleted BOOLEAN DEFAULT false, prev_ts BIGINT
);
ALTER TABLE documents ADD PRIMARY KEY (ts, table_id, id);

CREATE TABLE indexes (
    index_id BYTEA NOT NULL, ts BIGINT NOT NULL,
    key_prefix BYTEA NOT NULL,   -- first 2500 bytes of the encoded index key
    key_suffix BYTEA NULL, ...
);
```

So: your document is a serialized `ConvexValue` blob in one append-only, timestamp-versioned
table. Every index you declare is a **second** table of ordered byte keys, also versioned by
`ts`. Postgres/MySQL/SQLite is used as a dumb ordered KV store — Convex does not delegate
query planning to it. Crates confirm the rest of the stack: `isolate` (V8 for
queries/mutations), `node_executor` (Node for actions), `text_search` (Tantivy),
`vector`, `file_storage` + `aws_s3`.

Reactivity is **query-function re-execution**: Convex records each query's read-set as
timestamp intervals (`crates/common` → `interval`, `interval_map`), invalidates when a write
overlaps, re-runs your JS handler at a new snapshot, diffs, pushes. This is why a Convex query
can be arbitrary TypeScript — it's just a deterministic function replayed at a snapshot.

So: **"documentdb with indexes" is right**, with the caveat that it's an MVCC document *log*
and the indexes are hand-rolled ordered-key tables, not engine indexes.

### SpacetimeDB — in-memory relational tables + WAL, logic co-resident as WASM

Not the same thing at all:

- **Statically-typed relational rows**, not documents. Types come from SATS (Spacetime
  Algebraic Type System): products, sums, arrays, options, fixed-width ints. No `any`.
- **All data resident in RAM.** Durability is a commitlog replayed on restart. Database size
  ceiling = host RAM (FAQ: "the practical limit is the available RAM on the host").
- **Your module runs inside the DB process** as WASM (or a JS bundle for TS modules) —
  no function tier, no cold start, data hot in L1.
- **Reactivity is incremental view maintenance** over relational queries, not function
  replay. That's the source of the throughput claim, and also of every restriction below:
  the query language must stay in the subset the incremental evaluator can maintain.

| | Convex | SpacetimeDB |
|---|---|---|
| Data model | MVCC document log, JSON-ish values | In-memory typed relational rows |
| Durability | Postgres/MySQL/SQLite persistence | Commitlog (WAL) replay |
| Logic location | Separate V8/Node tier | Inside the DB, as WASM/JS |
| Reactivity | Re-run query fn, diff, push | Incremental view maintenance |
| Read API | Arbitrary TS query fn, takes args | Subscriptions + views (**views take no args**) |
| Write API | Mutation, **returns a value** | Reducer, **returns nothing** |
| Schema change | Trivial (documents) | Additive-only; destructive = forbidden |
| Full-text | Tantivy `searchIndex` | None |
| Vector | Yes | None |
| Sorting | `.order()` + index order | **No `ORDER BY` anywhere** |

---

## 2. The five hard blockers

These are the findings that actually decide the question. Each is verified, not inferred.

### 2.1 No `ORDER BY`. Anywhere. (verified against parser source)

The docs are self-contradictory here — the Convex migration guide suggests subscribing to
`SELECT * FROM message WHERE channelId = ... ORDER BY createdAt DESC LIMIT 100`, and
`crates/sql-parser/src/parser/sql.rs:42` documents `[ ORDER BY order ]` in the grammar
comment. **Both are wrong.** The parser:

`parser/sub.rs:94-106` — subscriptions:
```rust
Query { with: None, body, order_by, limit: None, offset: None, fetch: None, locks }
    if order_by.is_empty() && locks.is_empty() => parse_set_op(*body),
_ => Err(SubscriptionUnsupported::feature(query).into()),
```
`order_by` must be empty; `limit`/`offset`/`fetch` must be `None` — a hard pattern match.
**Subscriptions reject ORDER BY, LIMIT, and OFFSET.**

`parser/sql.rs:328-348` — ad-hoc queries: two arms, both requiring `order_by.is_empty()`;
one accepts `limit: Some(numeric literal)`. **Ad-hoc SQL gets `LIMIT n` but still no
`ORDER BY`.** And `"select * from t order by a limit b"` sits in the `unsupported()` test.

Consequence for VexCMS: `CollectionListView` sorts by `useAsTitle`/`_creationTime`/`_status`
and paginates. Under SpacetimeDB you get sorting only by (a) ordering the array you return
from a view in module code, or (b) sorting client-side over the whole subscribed set. There
is no server-side "page 3 of posts sorted by title".

### 2.2 Views take no arguments

> "Views must be declared as public with an explicit name, and they accept only a context
> parameter — no user-defined arguments beyond the context type."
> — `/docs/functions/views`

> "Views currently do not take arbitrary client arguments." — `/docs/migrating-from-convex`

This is the deepest mismatch with `packages/core/src/api/find/server.ts`. `FindServerArgs`
is *entirely* arguments: `collection`, `limit`, `order`, `filter`, `withIndex`, `populate`,
`depth`, `paginationOpts`. None of that can cross into a view.

Your three escape hatches, all worse:
- **Client-side subscription filters** — but the subset is `=,<,>,<=,>=,!=,AND,OR` on columns
  only. No arithmetic, no `LIKE`, no `IN`, single-table `SELECT *` (no projections), joins
  limited to 2 tables with an index required on both join columns.
- **Per-sender view + a request table** — reducer writes the caller's query params into a
  private table keyed by `ctx.sender`, a `ViewContext` view reads them back and computes.
  This works, and it is the real answer for paginated admin lists. It costs a round trip,
  and per-user views are explicitly called out as expensive: "With 1,000 connected users,
  that's 1,000 separate view computations."
- **Procedures** — take args *and* return values, but manual `withTx`, and `withTx` may run
  its closure multiple times against different snapshots.

### 2.3 Reducers cannot return data

Payload-style semantics are `create()` → returns the created document. Reducers return
nothing; the client learns the outcome via subscription. `apps/www` seed scripts,
`create()`/`update()` in `packages/core/src/api/*/server.ts`, and every optimistic-UI path
assume a return value. You'd restructure to: reducer commits → per-call result callback fires
→ subscription delivers the row. Or use a procedure and give up automatic transactionality.

### 2.4 No `v.any()` — and VexCMS leans on it hard

`packages/core/src/fields/constants.ts:54-72`:
```ts
array:  { type: "array",  validator: "v.array(\nv.any()\n)" },
group:  { type: "group",  validator: "v.object({})" },
blocks: { type: "blocks", validator: "v.array(v.any())" },
```
Plus `vex_globals` is `{ slug: v.string(), data: v.any() }`
(`packages/core/src/schema/generateVexSchema.ts:64-68`), and `richtext` was
`v.any()` before being commented out.

SATS has **no `any`**. Every nested shape must be a statically declared product/sum type in
module source. For `blocks()` — where the shape is user-defined, per-collection, and the whole
point is that it's open — your options are:

- **Codegen a SATS sum type per collection's block set.** Type-safe, subscribable… and now
  *every content-model edit is a schema migration* (see 2.5).
- **Serialize to `t.string()` JSON.** Works, keeps iteration cheap, and kills all
  server-side filtering, indexing, and subscription-level filtering on anything inside a
  block, array, group, richtext, or global. Given 2.5, this is the pragmatic choice — which
  means SpacetimeDB's relational strengths are unavailable for exactly the data a CMS is
  mostly made of.

### 2.5 Destructive schema migration is forbidden — and a CMS is a schema editor

From `/docs/databases/automatic-migrations`:

- ✅ Allowed: add tables, add indexes, add/remove auto-inc, private→public, add reducers,
  remove unique constraints.
- ⚠️ Allowed but breaks old clients: append a column **with a default**, change/remove
  reducers, public→private, remove PK annotation, remove indexes (breaks semijoin subs).
- ❌ **Forbidden — publish fails**: remove a table; remove **or modify** an existing column
  (type change, **rename**, **reorder**); add a column without a default; add a column
  **anywhere but the end**; add a unique or PK constraint.

Now compare to what a VexCMS developer does daily: rename a field, change `text` → `select`,
delete a field, reorder fields, add a required field, remove a collection. Every one of those
is ❌.

The sanctioned workaround is **incremental migrations**: create `posts_v2` alongside `posts`,
lazily migrate rows on read, dual-write so old clients keep working. That's a real, working
pattern for a game with a handful of hand-written schema changes per quarter. As the
*automatic* behavior of `vex dev` on every field rename, it produces an unbounded
`posts_v2..posts_v7` tail and dual-write logic in generated code.

Note `packages/cli/src/lib/generateSchema.ts` already has `diffSchema()`,
`makeFieldsOptional()`, `addRemovedFieldsAsOptional()`, `planMigration()`,
`executeMigration()` — that machinery exists precisely because Convex makes it *possible*.
It would have to be rebuilt to emit incremental-migration table pairs instead.

---

## 3. What you gain

Real wins, worth naming:

- **Latency & throughput.** Logic co-resident with in-RAM data. Their claim is 100k+ TPS vs
  ~100. Discount the marketing; the architecture is genuinely faster for hot paths.
- **Client cache mirroring.** Rows replicate into a local cache; reads are local memory with
  zero round trips. `useTable(tables.posts)` needs no request per read. Convex pushes query
  *results*; SpacetimeDB mirrors *rows* and applies minimal deltas.
- **Commit-ordered updates.** Subscribers see the exact sequence of committed transactions.
  Live preview / multiplayer admin editing gets easier and more correct.
- **True transactions across the whole write.** Every reducer is one transaction with
  automatic retry at the engine boundary. Convex mutations are transactional too, but
  contention handling sits in the function tier.
- **Submodules — the one genuinely exciting primitive.** TypeScript-only today. A submodule
  registers its tables/reducers/views/HTTP handlers under a consumer-chosen namespace:
  ```ts
  import * as vexcms from '@vexcms/spacetime-module';
  const spacetimedb = schema({ myPosts, cms: vexcms });
  // server: ctx.db.cms.vex_globals...    client: tables.cms.posts
  ```
  This is a *better* distribution story than Convex components for a CMS — VexCMS could ship
  as an installable database module rather than generated source in the user's `convex/`.
  Caveat: lifecycle reducers (`init`, `clientConnected`) are root-module-only, so auth-on-
  connect must live in the consumer's module.
- **Multi-language clients.** C#/Unity, Rust, C++/Unreal. Irrelevant for a web CMS; relevant
  if a game ever wants to read your content.
- **Pricing shape.** Metered energy, not per-seat. Convex Pro is $25/user/month; SpacetimeDB
  Pro is $25/month flat. For an agency with many editor seats this is materially cheaper.
- **PGWire.** Postgres wire protocol support — real BI/analytics tooling can point at it.

---

## 4. What you lose — mapped to your actual roadmap

| Feature | State | Convex primitive | SpacetimeDB |
|---|---|---|---|
| Admin list sort + paginate | built | `.order()`, `.paginate()` cursors | ❌ no `ORDER BY`; no sub `LIMIT`; views take no args → per-sender cursor table or client-side |
| Full-text search (`vex.search`) | built | `.withSearchIndex()` (Tantivy) | ❌ nothing. btree only. Hand-roll a token table |
| Relationship picker live search | spec 22, in progress | auto `.searchIndex('search_<useAsTitle>')` | ❌ same as above — this spec's core mechanism is gone |
| `populate` / `depth` joins | built, spec 23 | N round trips in one query fn | ⚠️ views can join, but ≤2 tables in subs + index on both join cols; recursive depth → hand-written per-shape views |
| `blocks`, `array`, `group`, `json`, richtext | built / M1 | `v.any()` | ❌ no `any`. JSON string, or codegen SATS sums and accept a migration per model edit |
| Globals (`vex_globals.data: v.any()`) | ✅ shipped M1 | `v.any()` | ❌ same |
| Versioning & drafts (spec 36) | M1 blocker | `vex_versions` table + `_draftSnapshot` | ⚠️ feasible; snapshot blob becomes a JSON string; `_status` filter works in subs |
| RBAC (`defineAccess`/`hasPermission`) | ✅ shipped | post-query filter in query fn | ⚠️ **redesign.** Field-level perms need per-caller *views*; row-level needs private tables + `ViewContext`. RLS exists but is explicitly experimental and the docs steer you to views |
| File storage | built (`file-storage-convex`) | `ctx.storage.*` + signed URLs | ⚠️ binary columns (in RAM! ~100MB/row ceiling) or external S3/R2. Needs `file-storage-s3` — already on your post-v1 backlog anyway |
| better-auth | built + patched | `@convex-dev/better-auth` component, tables in-DB | ⚠️ **inverts.** SpacetimeDB only consumes OIDC JWTs via JWKS discovery. better-auth becomes an external OIDC provider (`@better-auth/oauth-provider` + `jwt` plugin); its tables live *outside* the DB → your `extractAuthCollections()` → admin-managed auth collections model breaks |
| Next.js SSR prefetch | built | `fetchQuery` from `convex/nextjs` | ⚠️ no server-side query-with-args equivalent. HTTP `/v1/database/:db/sql` (docs: "not optimized for performance"), or a procedure, or client-only + skeletons |
| Content scheduling (`publishAt`) | post-v1 | scheduled functions | ✅ **better.** Schedule tables are first-class and cleaner |
| Lifecycle hooks | post-v1 | actions/mutations | ✅ reducers compose fine |
| Audit log (enterprise) | post-v1 | table writes | ✅ **better.** Commitlog *is* an audit log; event tables for transients |
| Environments / content branching (enterprise) | post-v1, "core moat" | — | ✅ **much better.** "SpacetimeDB databases are lightweight and fast to create" — a branch is a database |
| i18n / localization (enterprise) | post-v1 | field variants via `v.any()` | ❌ locale-variant field shapes need static types |
| Multi-component workspaces (spec 43) | M3 | per-component schema | ✅ **much better** — this is exactly submodules |
| Vector search / AI | not planned | `vectorIndex` | ❌ none |

**Net:** you lose search, dynamic field shapes, and cheap schema evolution. You gain
scheduling, audit, environments, and multi-component packaging. Note the losses are all in
**M1/M2 (v0.1.0 critical path)** and the gains are all in **M3+/enterprise**. That timing is
the actual argument against doing this now.

---

## 5. Code: side by side

### 5.1 Schema generation

Today, `collectionConfigToVexSchema()` (`packages/core/src/collections/validator.ts:104-148`)
emits a Convex source string:

```ts
export const posts = defineTable({
  title: v.string(),
  slug: v.string(),
  author: v.optional(v.array(v.id("authors"))),
  publishedAt: v.optional(v.number()),
  content: v.array(v.any()),           // blocks()
  _status: v.optional(v.string()),
})
  .index("by_author", ["author"])
  .searchIndex("search_title", { searchField: "title", filterFields: [] });
```

SpacetimeDB equivalent. Note every difference is a loss:

```ts
import { schema, table, t } from 'spacetimedb/server';

const posts = table(
  { name: 'posts', public: true },
  {
    id:          t.u64().primaryKey().autoInc(),   // no _id; you own the key
    title:       t.string().index('btree'),        // btree only — no search index
    slug:        t.string().unique(),
    publishedAt: t.option(t.timestamp()).index('btree'),
    content:     t.string(),                       // blocks() as JSON. no v.any()
    status:      t.enum('Status', { Draft: t.unit(), Published: t.unit() }),
    createdAt:   t.timestamp().index('btree'),     // no _creationTime; explicit
  }
);

// relationship() cannot be an array column if you want to query it —
// many-to-many needs its own join table, and subscription joins need
// an index on BOTH sides.
const postAuthors = table(
  { name: 'post_authors', public: true },
  { postId: t.u64().index('btree'), authorId: t.u64().index('btree') }
);

export default schema({ posts, postAuthors });
```

### 5.2 `find` — the worst case

Today (`packages/core/src/api/find/server.ts:325-350`):

```ts
function buildQuery(args) {
  let q = args.ctx.db.query(args.collection);
  if (args.withIndex) q = args.withIndex.range
    ? q.withIndex(args.withIndex.name, args.withIndex.range)
    : q.withIndex(args.withIndex.name);
  if (args.order)  q = q.order(args.order);
  if (args.filter) q = q.filter(args.filter);
  return q;
}
// then: .paginate(opts) | .take(limit) | .collect()
```

There is no direct translation. Three partial options:

**(a) Client-side subscription filter** — no args needed, but no sort/page/limit:
```ts
const [posts, isReady] = useTable(
  tables.posts.where(r => r.status.eq('Published').and(r.publishedAt.gte(cutoff)))
);
const page = [...posts].sort(byTitle).slice(0, 25);   // sort + page in the browser
```

**(b) Anonymous view** — server-side compute, shared across all subscribers, still no args:
```ts
export const recentPublishedPosts = spacetimedb.anonymousView(
  { name: 'recent_published_posts', public: true },
  t.array(postListRow),
  (ctx) => {
    const out = [];
    for (const p of ctx.db.posts.status.filter({ tag: 'Published' })) {
      out.push({ id: p.id, title: p.title, createdAt: p.createdAt });
    }
    out.sort((a, b) => Number(b.createdAt.micros - a.createdAt.micros)); // sort in JS
    return out.slice(0, 100);                                            // page in JS
  }
);
```
Fixed shape, fixed sort, fixed limit — one view per query shape. That's the real cost: your
generic `find()` becomes N codegen'd views.

**(c) Per-sender request table + `ViewContext`** — the only way to get real parameterized,
paginated admin lists. Costs a reducer round trip and a per-user view computation:
```ts
const listRequest = table(
  { name: 'list_request' },                                  // private
  { sender: t.identity().primaryKey(), collection: t.string(),
    sortBy: t.string(), desc: t.bool(), offset: t.u32(), limit: t.u32() }
);

export const setListRequest = spacetimedb.reducer(
  { collection: t.string(), sortBy: t.string(), desc: t.bool(),
    offset: t.u32(), limit: t.u32() },
  (ctx, a) => { ctx.db.listRequest.sender.delete(ctx.sender);
                ctx.db.listRequest.insert({ sender: ctx.sender, ...a }); }
);

export const myPostList = spacetimedb.view(
  { name: 'my_post_list', public: true },
  t.array(postListRow),
  (ctx) => {
    const req = ctx.db.listRequest.sender.find(ctx.sender);
    if (!req) return [];
    const rows = [...ctx.db.posts.iter()];
    rows.sort(comparatorFor(req.sortBy, req.desc));
    return rows.slice(req.offset, req.offset + req.limit).map(toListRow);
  }
);
```

### 5.3 `create` — the return-value problem

Today:
```ts
const id = await ctx.db.insert("posts", data);   // returns Id<"posts">
return id;
```

SpacetimeDB — reducer, returns nothing:
```ts
export const createPost = spacetimedb.reducer(
  { title: t.string(), slug: t.string(), content: t.string() },
  (ctx, { title, slug, content }) => {
    if (title.trim() === '') throw new SenderError('Title required');
    if (ctx.db.posts.slug.find(slug)) throw new SenderError('Slug taken');
    ctx.db.posts.insert({
      id: 0n, title, slug, content,
      status: { tag: 'Draft' }, publishedAt: undefined, createdAt: ctx.timestamp,
    });
    // cannot return the id. client observes it via subscription,
    // or you insert into an event table for a one-shot notification.
  }
);
```
Client: `useReducer(reducers.createPost)` fires, then the row arrives through `useTable`.
"Create then redirect to `/admin/posts/<newId>`" needs an event table or a procedure.

### 5.4 RBAC

Today `hasPermission()` filters *after* the query, inside the query function
(`api/find/server.ts:226-257`) — one code path, works for row and field level.

SpacetimeDB has no equivalent of "run arbitrary TS over the result set before returning it"
for subscriptions. You get:
- private table + per-caller `ViewContext` view (the documented approach), or
- experimental RLS: `spacetimedb.clientVisibilityFilter.sql('SELECT * FROM posts WHERE ...:sender')`
  — but the docs open with *"Experimental Feature — Use Views Instead"*.

Field-level permissions (returning a per-field boolean map) means **a distinct view per role
projection**. That's a genuine redesign, not a port.

### 5.5 Where the APIs *are* similar

Client-side, they're close enough to be encouraging:

```ts
// Convex + @convex-dev/react-query
const posts = useQuery(convexQuery(api.vex.find, { collection: 'posts' }));
const create = useConvexMutation(api.vex.create);

// SpacetimeDB
const [posts, isReady] = useTable(tables.posts.where(r => r.status.eq('Published')));
const create = useReducer(reducers.createPost);
```

`packages/react` and `packages/richtext-plate` survive nearly intact. The damage is all
server-side and in codegen.

---

## 6. Packaging — the actual decision

You listed the options. Verdict on each:

**❌ Both backends inside `@vexcms/core` (subfolders per backend).** No. `core` currently has
~25 Convex imports and `convex` in `peerDependencies`. Adding a `spacetime/` sibling folder
means every consumer installs both SDKs, `GenericId` vs `Identity` leaks into shared types,
and `types/generated.ts` has to describe two incompatible ID models. It also can't work at
the type level: `FindServerArgs.withIndex` is typed against `IndexNames<NamedTableInfo<...>>`
from `convex/server`.

**❌ One product, runtime-switched backend.** Worse. The read APIs aren't isomorphic —
`find({ order, limit, paginationOpts })` cannot be implemented on SpacetimeDB at all. A
shared interface would have to be the *intersection* of both, which is roughly
"subscribe to a whole table." You'd degrade the Convex product to reach parity.

**✅ Split `core`, then two backend packages.** The good news: your existing HKT/adapter work
already did most of this. From the scouts, `packages/core` divides cleanly:

```
@vexcms/core                    ← backend-agnostic (est. ~70% of current core)
  fields/            (minus validators/ → they emit Convex v.* strings)
  collections/config.ts, globals/config.ts, config/
  access/hasPermission.ts       (pure fn over docs + user)
  framework.ts, fields/baseTypes.ts   (ComponentHKT — already clean)
  types/            (needs an abstract Id, not GenericId)
  media/types.ts    (storage adapter interface — already an interface)

@vexcms/backend-convex          ← extracted from today's core
  api/{find,get,search,create,update,remove,globals}/server.ts
  api/server.ts (collectionsApi/globalsApi factories)
  fields/validators/  (→ v.* strings)
  schema/generateVexSchema.ts

@vexcms/backend-spacetime       ← new; NOT a port of the above
  module/            (generated SpacetimeDB module source: tables, reducers, views)
  codegen/           (config → SATS tables + reducers + one view per query shape)
  client/            (subscription-based read layer)
```

Then: `@vexcms/cli` gains a `--backend` dispatch (`generateSchema.ts` is already an
orchestrator — extract the DSL→IR step, swap the emitter);
`@vexcms/better-auth` splits its pure `adapter.ts` from `convex/db.ts`;
`file-storage-spacetime` (or just do `file-storage-s3`, which you want anyway and which
serves both).

`packages/react`, `packages/next` (only `fetchQuery` in `NextAdminPage.tsx`),
`richtext-plate`, `create-vexcms` (template swap) are all fine.

**The honest sequencing point:** this split is worth doing *regardless* of SpacetimeDB —
it's what makes `@vexcms/svelte`, a Postgres/Drizzle backend, or any future adapter possible,
and it enforces the boundary `packages/core/src/fields/*` already keeps in practice
(zero framework imports — see `.agent/docs/standards/core/adding-a-field-type.md`). But it is
a large refactor of the M1 critical path, and M1 is what blocks the maprios migration.

**Suggested order:** ship v0.1.0 on Convex → do the `core`/`backend-convex` split as its own
milestone (justified by the Svelte adapter, not by SpacetimeDB) → *then* spike
`backend-spacetime` as a submodule and find out whether the list-view problem is solvable.

---

## 7. Things not asked about, worth knowing

1. **RAM is the database size limit.** All data in memory. A media-heavy CMS storing binaries
   inline is paying RAM prices for blobs. Push files to S3/R2 and keep only metadata.
2. **BSL license, not MIT/Apache.** Business Source License 1.1, converts to AGPLv3 + linking
   exception after a few years. Your monetization plan is "MIT core forever + BSL enterprise
   packages" — worth checking that a BSL dependency doesn't complicate what you tell users
   about the MIT core.
3. **Beta/unstable surface area.** Procedures: unstable in Rust/C#/C++. HTTP handlers: beta.
   RLS: experimental, docs discourage it. Submodules: TypeScript only. You'd build on
   pre-1.0 primitives.
4. **The docs are wrong in at least one load-bearing place.** The Convex migration guide
   shows an `ORDER BY ... LIMIT` subscription the parser rejects. Verify against source
   before believing any capability claim.
5. **No `_creationTime` / no `_id`.** Both are free in Convex and used throughout your code
   (`admin.useAsTitle` defaults to `_id`; `CORE_ADMIN_FIELDS` gates search-index generation on
   them). SpacetimeDB requires explicit `id` and `createdAt` columns everywhere.
6. **Database name collisions are global on Maincloud** (FAQ 401/403 troubleshooting). Matters
   for a CMS scaffolder that names deployments after projects.
7. **Client cache = full row replication.** Whatever you subscribe to is *in the browser*.
   For a CMS, "subscribe to the posts table" may ship far more content than a paginated query
   would — and RBAC-restricted rows must be excluded server-side (private table + view), not
   filtered client-side, or you leak.
8. **`withTx` closures may run more than once** against different snapshots. Procedures need
   idempotent bodies. Easy to get wrong.
9. **Scale-to-zero on Maincloud** with an in-memory DB implies a cold-start replay of the
   commitlog. Worth measuring for a marketing site's TTFB.
10. **No `convex-test` equivalent found.** `packages/core` tests use `convexTest`; you'd need
    a new test strategy (likely a real local `spacetime start`), which is slower and stateful.
11. **A hybrid is actually plausible.** SpacetimeDB for the live/collaborative surface
    (presence, editor cursors, preview sync) alongside Convex as the content store. That gets
    the latency win without betting the content model on static schemas.

---

## 8. Bottom line

- **Lift:** not the "800 LOC / 2-4 weeks" a naive import-count suggests. The API surface is
  the small part. Re-deriving list views, search, RBAC, dynamic field shapes, and schema
  evolution against a static relational engine with no `ORDER BY` is a **product redesign** —
  realistically a multi-month effort, and some of it (search, `v.any()`) is not
  recoverable, only replaceable with something worse.
- **Is it possible?** Yes. A SpacetimeDB CMS is a coherent thing to build — with a smaller
  field system, statically codegen'd blocks, view-per-query-shape reads, and an explicit
  "your content model is a schema migration" contract. That is a **different product with
  different constraints**, and arguably a better one for realtime-collaborative content.
- **Same codebase?** Only above a properly extracted `@vexcms/core`. Never as folders inside
  today's core, and never as a runtime switch.
- **Now?** No. Every loss lands on the v0.1.0 critical path; every gain lands in M3+ and
  enterprise. The one thing worth stealing early is the *idea* behind submodules — it's a
  strong hint that your M3 multi-component architecture is the right direction.
