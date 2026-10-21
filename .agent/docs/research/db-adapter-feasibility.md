# DB-adapter architecture: feasibility, lift, and market upside

> Research only, 2026-10-12, at `0.1.0-alpha.23`. Scope reviewed: `packages/core/src` in full
> (measured), plus a survey of `apps/test`, `apps/www`, `packages/react`, `packages/next`,
> `packages/better-auth`, and `packages/file-storage-convex`.

## Question

How coupled is VexCMS to Convex? Is a database-adapter design (`@vexcms/convex` holding all
Convex code, later Postgres, Mongo, SQLite, or Supabase) feasible? What would moving to it
cost now, and how much could it raise potential earnings?

## Answer

**Feasible, but large.** The coupling is deep in the runtime model, not just in imports. The
config, field-definition, and access-rule layers already have clean seams. The data, write,
hook, admin-client, and auth layers are written *as Convex code*. A real second adapter is
roughly as much work as everything built since the April rebuild.

**Recommendation:**
- Don't extract now. Ship v0.1.0 on Convex.
- Before tagging 0.1.0, make three cheap, API-shape decisions so a later extraction doesn't
  break users (§ 5).
- When a second backend is built, make it **Supabase**, not generic Postgres.
- Treat Mongo and SQLite as "maybe never".

## 1. Coupling, measured (`packages/core/src`, non-test files)

| Bucket | Files | LOC | Share |
|---|---|---|---|
| Imports `convex/*` or `convex-helpers` | 58 | 13,026 | 52% |
| No Convex import, but emits Convex validator strings (`"v.string()"` …) | 21 | 1,742 | 7% |
| Backend-neutral (config, field configs/types, Zod input schemas, access matrix, live preview, revalidate, routes) | ~120 | ~10,100 | 41% |
| **Total** | 199 | 24,893 | |

21 of 87 core test files run on `convex-test`. Other packages:

| Package | Source files importing Convex |
|---|---|
| `@vexcms/react` | 23 of 210 (admin data layer) |
| `@vexcms/next` | 5 of 14 |
| `@vexcms/better-auth` | 8 of 16 (built on `@convex-dev/better-auth`) |
| `@vexcms/file-storage-convex` | 2 of 8 |
| `@vexcms/richtext-plate` | 0 |

Import counts understate the coupling. The real ties are architectural.

| # | Coupling point | Where | Why it is more than a rename |
|---|---|---|---|
| 1 | **Execution model.** VexCMS runs *inside the user's Convex functions*: `find({ ctx, … })`, `createVexMutations`, `collectionsApi` | `api/server.ts` (1,205 LOC), `api/*/server.ts`, `apps/*/convex/vex.ts` | Postgres or Mongo have no function runtime. An adapter needs its own server entry point: route handlers or RPC, and a transaction wrapper. Payload has this layer as its REST and local API; VexCMS has none because Convex is that layer |
| 2 | **Query DSL in the public API.** `find({ withIndex: { name, range: q => q.eq(…) } })`; access rules `constraints: ({ q }) => q.withIndex("by_author", ix => ix.eq(…))` | `api/find/server.ts:96-107`; `access/constraintTypes.ts` (models Convex's index-range grammar: one lower and one upper bound, field order) | User code is written in Convex's index-range shape. A neutral `where` DSL is a **user-visible breaking change** |
| 3 | **Schema generation emits Convex** | `fields/constants.ts` (`validator: "v.string()"`), the 13 `fields/*/validator.ts`, `collections/`, `versions/schema.ts`, `schema/generateVexSchema.ts:50` | Fields carry Convex validator *strings*, not a neutral storage type. Each adapter needs its own emitter (Convex `defineTable`, Drizzle tables, Mongo none) |
| 4 | **Migrations** | `schema/migrate.ts` (stubbed; auto-migration is "Future") | Convex tolerates schema drift. Postgres requires DDL migrations on every config change. This is a whole subsystem (Drizzle-kit can carry most of it) |
| 5 | **IDs and generated types** | `types/generated.ts` (`GenericQueryCtx`, `GenericDataModel`), `Id<>`/`GenericId` in hooks, versions, relationship types | Table-scoped typed IDs vs UUID/ObjectId. Every typed signature is parameterised on Convex's `DataModel` |
| 6 | **Hooks and atomicity** | `api/triggers.ts` (`convex-helpers` Triggers + `customMutation`), ADR-010 | `after*` hooks run atomically inside the Convex transaction. Postgres needs explicit transactions plus a post-commit/outbox decision |
| 7 | **Versions and drafts** | `versions/model.ts`, `publish.ts`, `saveDraft.ts` (direct `ctx.db.insert/query/withIndex`) | Portable logic, but written against `ctx.db`. It has to move behind an adapter interface |
| 8 | **Admin client reactivity** | `packages/react`: `convexQuery`, `useConvexMutation`, `usePaginatedQuery` against `vexConvexApi` (`core/api/convex.ts`, `anyApi` path convention) | Live list and edit views assume subscriptions. Other backends need a client data adapter: fetch + invalidate, or Supabase Realtime |
| 9 | **Auth** | `@vexcms/better-auth` runs Better Auth inside Convex via `@convex-dev/better-auth` | Easier off Convex: Better Auth natively supports Postgres, MySQL, SQLite, and Mongo. Mostly a new, simpler package |
| 10 | **Search and pagination** | `api/search/*`, Convex `searchIndex`, cursor `.paginate()` | Rewrite per backend: Postgres `tsvector`/`pg_trgm`, Atlas Search, keyset cursors |

## 2. Seams that already exist (why this is feasible)

- **Access rules are already an IR.** Constraint builders *record*
  `{ field, op, value }` and filter trees (`and`/`or`/`not`). `access/compileConstraints.ts`
  compiles that one record to three targets: an index range, a filter expression, and a JS
  predicate (`constraintTypes.ts:145-152`). A SQL `WHERE` or Mongo `$match` compiler is a
  fourth target. This is the most valuable seam in the codebase.
- **The adapter pattern is established.** `VexAuthAdapter` (`auth/types.ts:66`) and
  `VexStorageAdapter` (`media/types.ts:380`) already exist, and storage adapters for
  S3/R2 are on the roadmap. A `VexDatabaseAdapter` follows the same convention.
- **Config is client-safe and backend-free.** `defineCollection`/field configs, Zod input
  schemas, `hasPermission`'s matrix, live preview (postMessage + BroadcastChannel), and the
  revalidate and SEO helpers have no Convex dependency.
- **Prior conclusion agrees.** The SpacetimeDB study recommended splitting into
  `@vexcms/core` (agnostic) plus per-backend packages rather than mixing backends in core
  (`spacetimedb-vs-convex-port-feasibility.md:15-17`). Milestone 3 multi-component work points the same way.

## 3. What each backend keeps or loses

| Capability | Convex | Supabase | Plain Postgres / SQLite | Mongo |
|---|---|---|---|---|
| Live admin lists and live site data | ✅ reactive queries | ◐ row-change events via Realtime "Postgres Changes"; the client must re-fetch or merge. Supabase recommends Broadcast for scale ([docs](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)) | ❌ polling / invalidate-on-save | ◐ change streams (replica set required) |
| Presence / multiplayer (BaseHub-style) | ✅ (subscription-backed) | ✅ Realtime Presence + Broadcast ([docs](https://supabase.com/docs/guides/realtime)) | ❌ | ❌ |
| Transactions incl. `after*` hooks | ✅ atomic | ◐ SQL tx; `after*` post-commit | ◐ same | ◐ multi-doc tx (replica set) |
| No database to operate | ✅ | ✅ (managed) | ❌ | ❌ (unless Atlas) |
| Typed codegen | ✅ | ✅ via Drizzle | ✅ via Drizzle | ◐ |
| File storage / auth | Convex / Better Auth component | Supabase Storage / Auth, or Better Auth | Better Auth + S3 | Better Auth + S3 |
| Schema drift tolerance | ✅ | ❌ migrations | ❌ migrations | ✅ |

**Supabase recovers the most:** live-ish data, presence, a managed DB, plus storage and auth. On
plain Postgres or SQLite, VexCMS becomes "Payload without Payload's 4 years and 360 plugins".
Payload is free and MIT-licensed on exactly those databases.

## 4. Lift estimate  **[INFERENCE: founder-weeks at current velocity, wide error bars]**

| Phase | Contents | Estimate |
|---|---|---|
| A. API-shape decisions (§ 5) | Neutral field storage kinds, neutral `where` DSL beside `withIndex`, namespace Convex-only entry points | 1–2 wks |
| B. Extract `@vexcms/convex` | Move ~15k core LOC + `vexConvexApi`, triggers, schema emitter, `convex-test` suites; define `VexDatabaseAdapter` + `VexDataClient` interfaces; no behaviour change | 4–8 wks |
| C. Supabase/Postgres adapter MVP | Drizzle schema emitter + migrations, CRUD/paginate/count, SQL access compiler, versions/drafts, hooks in transactions, server RPC/route layer, admin data client (fetch + Realtime), Better Auth on Postgres, S3/Supabase storage, a `create-vexcms` template, adapter conformance tests | 10–16 wks |
| D. Each further adapter (Mongo, SQLite) | Emitter, query compiler, client, template, conformance run | 3–6 wks each |
| Ongoing | Every feature (branching, presence, localization) × N adapters; docs, templates, and issue triage per backend | ~1.5–2× maintenance per feature |

**Why not now:**
- Phase B alone pauses the v0.1.0 track (drafts, richtext, list/edit views) for 1–2 months.
- An adapter interface designed with one implementation will leak Convex assumptions.
  The project's own rule rejects inert code written for a later spec
  (`.agent/docs/product/roadmap.md:29-35`).
- Pre-1.0 is the cheap time to *break APIs*, not the cheap time to *build a second backend*.

## 5. Do now (before the 0.1.0 tag; small, keeps the door open)

1. **Neutral storage metadata on fields.** Add a backend-free storage kind
   (`string | number | boolean | json | ref[] | …`) next to `ADMIN_FIELDS.validator`, and
   derive the Convex string from it. That turns schema generation into one emitter among many.
2. **A neutral filter form in the public API.** Accept a `where`/constraint-builder form on
   `find`/`count`, compiled through the existing IR, and keep `withIndex` as the Convex-specific
   escape hatch. Access rules already record an IR, so only the *authoring* surface changes.
   **Specced 2026-10-21 as launch-plan B3** (`../specs/2026-10-21-backend-neutral-query-args/`):
   `filter` → `where` on `find`/`search`, `withIndex.range` retyped with the Vex builder (call
   syntax unchanged), `VexError`, ADR-015.
3. **Namespace Convex-only exports** under `@vexcms/core/convex` (the subpath already exists)
   or a future `@vexcms/convex`. Keep `ctx`-taking functions, triggers, and `vexConvexApi` out of
   the neutral entry points, so the later move is a re-export, not a user migration.
4. **Write new code against narrow interfaces where it's free.** For example, versions/drafts
   (spec C, starting now) could take a small `{ insert, query… }` port instead of raw `ctx.db`.
   Only where this adds no indirection cost.

## 6. Earnings upside

Bottom-up method (updated 2026-10-17 to the tiered pricing in `../product/post-v0.1.0-plan.md`
decision 10): paying-customer pool × 73% headless-in-market × 5–10% paid conversion × $1.46–3.03k
blended revenue per customer (Pro / Agency / Enterprise mix). Superseded figures priced every
customer at $2–10k.

| Platform pool | Paying customers / developers | Source | Illustrative ARR ceiling |
|---|---|---|---|
| Convex (today) | ~10k paying teams; ~500k devs | [Convex](https://news.convex.dev/enterprise-launch/), [Series B](https://www.prnewswire.com/news-releases/convex-raises-57m-series-b-led-by-insight-partners-to-scale-the-reliable-backend-for-the-ai-era-302841686.html) | $0.53M–$2.2M |
| + Supabase | >100k customers; 4M+ devs (Oct 2025) | [BuiltInSF](https://www.builtinsf.com/articles/supabase-raises-100m-series-e-5b-valuation-20251007) | +$5.3M–$22M (≈10× the Convex pool) |
| + generic Postgres / Mongo / SQLite | Payload's market: `payload` ~1M weekly npm downloads | npm API | Large pool; conversion is the unknown |

Caveats that shrink the multiplier:
- **Conversion falls off Convex.** The differentiation there is "the only real CMS for this
  backend". On Supabase it is "real-time-ish, plus Supabase-native auth and storage"
  (FireCMS-on-Firebase and early Supabase CMSs show the slot exists but is contested). On plain
  Postgres it is "a newer Payload", against a free, mature incumbent.
- **Fixed engineering capacity** gets split across adapters (the solo-founder constraint).
- **Feature parity matrix:** enterprise branching and presence are cheapest on Convex. Selling
  them on Postgres costs more to build.

Why it still matters for the pitch, even before it's built:
- **It removes the biggest investor objection** (platform risk: VexCMS's market is capped by Convex's size) and widens the plausible acquirer list (Supabase, database vendors) beyond Convex.
- Enterprise buyers of SSO, audit, and workflows mostly sit on Postgres. A Postgres-family adapter puts the paid packages in front of them.
- A credible deck line: **"Convex-native today; adapter-ready core; Supabase next."** The
  multiplier is roughly **10× on addressable customers, with a materially lower win rate**.
  Model it as 2–5× on realistic ARR **[INFERENCE]**, not 10×.

## Sources

- Measurements: `packages/core/src` file/LOC counts and import scans, run 2026-10-12.
- Code: `packages/core/src/fields/constants.ts:1-80`, `fields/text/validator.ts:42-47`,
  `schema/generateVexSchema.ts:41-101`, `api/find/server.ts:43-127`,
  `access/constraintTypes.ts:111-212`, `access/compileConstraints.ts:79-286`,
  `types/generated.ts:52-104`, `collections/hooks.ts:1-92`, `versions/model.ts:55-159`,
  `api/triggers.ts:1-47`, `api/convex.ts:1-2`.
- App survey: `apps/test/convex/vex.ts`, `apps/www/convex/vex.ts`,
  `apps/test/src/auth/access.ts`, `apps/www/src/auth/access.ts`,
  `apps/test/src/components/providers/convex.tsx`,
  `packages/react/src/components/views/CollectionEditView.tsx`.
- Prior research: `.agent/docs/research/spacetimedb-vs-convex-port-feasibility.md`.
- Supabase Realtime: https://supabase.com/docs/guides/realtime,
  https://supabase.com/docs/guides/realtime/subscribing-to-database-changes.

## Open questions

- Is generic Postgres worth building at all, given Payload? Or is Supabase the only non-Convex
  target?
- Do the § 5 API-shape changes go into the v0.1.0 launch plan (spec B, "Public API surface", is the natural home)?
- How much "local API" (calling VexCMS from Next.js server code without Convex functions)
  should the Convex adapter also expose, so both adapters share one call shape?
