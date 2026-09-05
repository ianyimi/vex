# Runtime Dynamic Fields (WordPress/ACF-style) on Convex

**Date:** 2026-09-04 · **Status:** exploratory, no decision taken

## Question

How could a vexcms user add a new field to a collection **from an already
deployed admin panel**, without a new build and without pushing a new Convex
schema — the WordPress/ACF capability?

## Answer

The hard blocker is real but narrow, and there is already precedent for the
escape hatch in this codebase. **Recommended shape: one reserved open bucket per
collection (added once, at build time) + field definitions stored as data +
runtime Zod validation reusing the existing per-field-type modules + pull-based
codegen for types.** Convex's index and search-index declarations remain
push-time, so filtering/sorting on dynamic fields needs a secondary index table
or a denormalized search blob.

### The blocker, precisely

`collectionConfigToVexSchema` emits one exact validator per configured field
into a closed `defineTable({...})` object
(`packages/core/src/collections/validator.ts:104-193`), and Convex's
`schemaValidation` defaults to `true`
(`node_modules/convex/dist/cjs-types/server/schema.d.ts:454`), which rejects
unknown document keys **on every write**, not only at push. So an arbitrary new
key cannot be written to an existing table. Config also reaches runtime as a
bundled JS import of `vex.config.ts`, and `packages/core/src/schema/migrate.ts`
is entirely stubs (`diffSchema`, `planMigration`, `makeFieldsOptional` all
return empty/unchanged). No field-metadata table exists.

### The precedent

- The generated `vex_globals` table already uses `data: v.any()`
  (`packages/core/src/schema/generateVexSchema.ts:60-70`).
- `create`'s network argument is already `v.any()`
  (`packages/core/src/api/server.ts:154`) — core performs **no** field-level
  validation of its own today; Convex is the validator.

Two consequences: an open bucket is not a new pattern here, and the moment you
add one you *must* add real server-side validation, because Convex stops doing
it for you inside a `v.any()`.

---

## Option matrix

| # | Approach | Prior art | Verdict |
| --- | --- | --- | --- |
| A | **EAV meta table** — `vex_meta(collection, docId, key, value)` | WordPress `wp_postmeta`; ACF stores field *groups* as posts | Works today, zero schema change per field. Costs an extra read per document (batchable via one `by_doc` index), no type safety, and `meta_query`-style filtering is WP's best-documented performance disaster. Viable fallback, not first choice |
| B | **Open JSON bucket on the existing table** — one generated `custom: v.optional(v.record(v.string(), v.any()))` | Drupal field storage, Strapi, Payload's `json` field, Directus "unmanaged" columns | **Recommended storage.** One reserved slot added once at build; every future field is pure data. Same table, same read, no join |
| C | **Schema-as-data + runtime compile** — definitions in `vex_fields`, compiled to a validator per request, admin renders from them | Sanity, Contentful, Directus, Strapi Content-Type Builder | **This is the actual feature.** Orthogonal to A/B: B is storage, C is definitions |
| D | **Runtime DDL** — genuinely alter the schema at runtime | Directus (real SQL DDL), Xata, Airtable, Notion | **Impossible on Convex.** A schema push is a deploy. Rule out explicitly |
| E | **Global `schemaValidation: false`** | — | **Reject.** Throws away validation on the 95% of fields that *are* typed, to serve the 5% that aren't |

Also worth naming: **Strapi's Content-Type Builder is dev-only** — it writes
files and restarts the server, and is disabled in production. Directus is the
only mainstream CMS doing true runtime DDL, and it can only do it because it
owns a SQL connection. Everyone else with runtime fields (Contentful, Sanity)
has schemaless document storage underneath, which is what option B synthesises.

---

## Recommended design: B + C

### 1. Storage slot

`generateVexSchema` emits, per collection that opts in via
`defineCollection({ dynamicFields: true })`:

```ts
custom: v.optional(v.record(v.string(), v.any())),
```

Opt-in matters — collections that want the strict guarantee keep it.

**Known side effect:** `v.record`'s `fieldPaths` is `string`
(`node_modules/convex/dist/cjs-types/values/validator.d.ts:242` —
`VRecord<..., "required", string>`), so `ExtractFieldPaths` degrades from "the
known keys" to "any string" for that table, and `.index()` field-path
type-checking silently stops catching typos. Mitigation: keep `IndexFieldsBySlug`
and the index-name narrowing types computed from the **config**, not from the
validator (`packages/core/src/types/generateVexTypes.ts`).

### 2. Definitions as data

`vex_fields` table: `{ collection, key, type, required, label, admin, order,
createdAt, deprecatedAt, version }` — permissive like `vex_globals`. Written by
an admin-panel "Add field" mutation, gated by a new permission in the existing
access system (`defineAccess` / `hasPermission`).

Keep the distinction sharp — **code-defined fields are owned by
`vex.config.ts` and immutable at runtime; runtime fields are owned by the
database.** The admin panel must never be able to edit a code field. This mirrors
Directus's managed/unmanaged split and is what keeps the two systems from
fighting.

### 3. Runtime validation — the piece that cannot be skipped

Every field type already ships an `inputSchema` (Zod) alongside its
Convex-validator string generator (`packages/core/src/fields/inputSchemas/**`,
`packages/core/src/fields/validators/**`). The Zod half works at runtime:
load definitions → build a Zod object → validate `data.custom` in
`create`/`update` before `ctx.db.insert`.

**This is the strongest argument for this design in this codebase specifically:**
a runtime field system reuses the existing per-field-type modules verbatim and
only skips the codegen half. No parallel field system.

### 4. Admin UI

The panel already renders from `sanitizeConfigForClient(config)`
(`packages/core/src/config/sanitizeConfig.ts`). Change it to render from
`merge(staticConfig, runtimeFieldDefs)` where the defs come from a Convex query.
Field components are already dispatched by `field.type`, so existing types need
no new renderer work.

### 5. Types — two-tier, and say so out loud

Dynamic fields cannot be statically typed without a build. That is inherent, not
a flaw. The industry answer is **pull-based codegen**: `vex pull` reads
`vex_fields` from the deployed instance and regenerates `vex.types.ts` with
runtime fields folded in — exactly `sanity typegen`,
`contentful-typescript-codegen`, and `prisma db pull`. Until it runs, runtime
fields are reachable as `doc.custom?.foo` typed `unknown`.

Stating the contract plainly — *code fields are typed always; runtime fields are
typed after `vex pull`* — is the honest version and it preserves the type-safety
pitch instead of quietly undermining it.

### 6. Querying, sorting, filtering — the real limitation

Convex indexes and search indexes are declared at push time. Options, all with
precedent:

- **Denormalized search blob.** On write, concatenate all field values (static +
  dynamic) into `_search: v.optional(v.string())` with one declared
  `.searchIndex`. Full-text over dynamic fields, zero per-field pushes. Cheapest
  win; ships immediately. Analogous to what an Algolia/Typesense sync buys.
- **Secondary index table.** `vex_fieldIndex(collection, key, valueStr, docId)`
  with `.index("by_collection_key_value", ["collection", "key", "valueStr"])`,
  maintained on write. Equality, range, and sort on any dynamic field via **one**
  declared index. This is Salesforce's custom-field index pivot and
  WooCommerce's `wc_product_meta_lookup`. Write amplification plus a consistency
  invariant — but Convex mutations are transactional, so the invariant is
  actually cheap to hold here, unlike in MySQL-land.
- **Pre-provisioned index slots.** Emit `dyn0..dynN` typed columns; the admin
  binds a dynamic field to a slot. Salesforce does this too. Ugly and bounded,
  but fastest possible reads. Only if the index table measures too slow.
- **In-memory filter after an indexed core query.** Acceptable escape hatch with
  a documented row ceiling.

### 7. Dev/prod drift — ship the mitigation with v1

The #1 operational failure of runtime schemas is production fields that don't
exist in dev. Answer: `vex schema pull` → JSON snapshot committed to the repo;
`vex schema apply` → applied to a target deployment. This is precisely Directus's
`schema snapshot` / `schema apply`, and it is what makes Contentful's
environments usable. It also composes with the planned
`@vexcms/enterprise-environments`.

### 8. Destructive edits

Additive is safe: optional record keys, no backfill. For rename/retype, take
Sanity's posture — definitions are versioned, deletion is a soft `deprecatedAt`,
values persist until an explicit `vex fields prune` job runs. Never rewrite
documents implicitly.

---

## Platform limits that set the tradeoff math

From https://docs.convex.dev/production/state/limits (fetched 2026-09-04):

| Constraint | Value | Consequence |
| --- | --- | --- |
| **Indexes per table** | **32** | Hard ceiling shared with the `by_<fieldKey>` indexes vexcms already auto-emits per relationship field. Largely kills "pre-provisioned index slots" as a general strategy |
| **Search indexes per table** | **4** | vexcms already emits `search_<useAsTitle>`, so a denormalized `_search` blob costs 1 of the remaining 3. Affordable |
| Filters per search index | 16 | Filter fields must themselves be declared columns — no dynamic filtering here |
| **Document size** | **1 MiB** | Typed fields, dynamic fields, and (per the drafts spec) an in-document `_draftSnapshot` all share one budget. A snapshot inside the document halves it |
| Document fields | 1024 | Generous for a `custom` record |
| Field name length | 64 chars top-level, **1024 for nested object keys** | Dynamic field keys live nested, so they are not constrained to 64 |
| Field nesting depth | 16 | Bounds dynamic `group`/`array`/`blocks` nesting |
| Index storage pricing | "each index is priced as another copy of the table" | A `vex_fieldIndex` table with one compound index costs 2× its rows — but rows are ~100 bytes, so 10k docs × 10 fields ≈ 20 MB. Negligible |
| Transaction: index ranges read | 4,096 (`db.get`/`db.query` calls) | EAV per-document reads are fine at list scale (100 docs = 100 calls); it is *filtering* that hurts |
| Transaction: documents written | 16,000 | Bulk imports maintaining a secondary index must batch — 5k docs × 10 fields = 50k index rows exceeds one mutation |
| Query/mutation user-code time | **1 second** | Runtime Zod validation runs here. Fine for ~20 scalar fields; a large dynamic `blocks` tree is the case to watch |

Two of these change conclusions rather than just colouring them:

1. **32 indexes per table** means "reserve index slots for dynamic fields" can
   only ever be a bounded, premium capability (say 8 filterable dynamic fields),
   never the general mechanism — and the slots are consumed *permanently*,
   because adding more requires the schema push the feature exists to avoid.
2. **1 MiB per document** puts option B (open bucket in the same table) in direct
   competition with rich text and with the drafts snapshot. Option A (separate
   meta table) has no such ceiling. If "unlimited dynamic fields on
   content-heavy documents" turns out to be a requirement, that is the one
   scenario where A beats B on capability rather than just on taste.

---

## Tradeoffs, option by option

Frame: **build cost · run cost · reversibility · what it forecloses · failure
mode**.

### A — EAV meta table (`vex_meta`)

- **Build:** moderate. One table, one `by_doc` index, and a hydration step in
  the read path.
- **Run:** one extra index range read per document (batchable). Storage is
  row-per-value plus an index copy — cheap. Filtering/sorting requires fetching
  candidate ids from the meta table and intersecting, which is where WordPress's
  `meta_query` earns its reputation.
- **Reversibility:** medium. The table is an implementation detail *if* reads go
  through an accessor; permanent if user code learns to query it.
- **Forecloses:** nothing at the storage level, but it imposes a **compounding
  teaching cost**: every future feature — drafts snapshots, `populate`, access
  filters, live queries, export, search sync — has to be taught that documents
  have a second half. That tax is the real reason `wp_postmeta` is a permanent
  drag on WordPress, not the query performance.
- **Failure mode:** reads silently become two-phase everywhere, and one code
  path forgets, producing documents that appear to have lost their custom fields.
- **Where it genuinely wins:** no document-size ceiling; per-field access
  control is natural (a meta row can carry its own ACL); per-field versioning is
  natural. If field-level RBAC on dynamic fields is a plausible requirement —
  and given the RBAC spec in flight, it is — this is not a small advantage.

### B — Open JSON bucket on the existing table (`custom` record)

- **Build:** low. One generated line per opted-in collection.
- **Run:** free. Same document, same read, no join, no extra index.
- **Reversibility:** high on the storage side (it is one field), **low on the
  type side** — `doc.custom.foo` appears in customer code and in generated
  types, so the *shape* is public API from day one.
- **Forecloses:** (a) shares the 1 MiB document budget; (b) degrades
  `.index()` field-path type-checking for that table to `string`
  (`VRecord`'s `fieldPaths` is `string`), so typo protection on index
  declarations is lost unless index types are computed from config instead;
  (c) makes per-field access control awkward, because the whole record is one
  Convex value and RBAC would have to filter inside it.
- **Failure mode:** a content-heavy document with rich text plus a draft
  snapshot plus dynamic fields hits 1 MiB and writes start failing, with an
  error that does not obviously point at dynamic fields.
- **Where it wins:** transactional consistency with typed fields for free,
  single-read list views, and it composes with drafts/populate/access without
  teaching any of them anything new. For the common case it is strictly simpler.

### C — Definitions as data (`vex_fields`)

- **Build:** high, and it is where all the genuine complexity lives: an admin
  builder UI, runtime validator compilation, definition versioning, and the
  dev/prod promotion story.
- **Run:** one extra query per request to load definitions — cacheable, and
  Convex's query cache absorbs it.
- **Reversibility: this is the one-way door.** Not because the code is hard to
  delete, but because **the moment a customer has production content in
  runtime-defined fields, you own definition migration, schema promotion, and a
  permanently conditional type-safety promise.** You cannot withdraw the feature
  without breaking their data.
- **Forecloses:** "`vex.config.ts` is the source of truth" as an unqualified
  claim. That sentence is currently the product's central pitch.
- **Failure mode:** dev/prod schema drift — the failure that defines the
  reputation of every runtime-schema CMS. Mitigated only by shipping
  `vex schema pull`/`apply` *with* the feature, not after.

### D — Runtime DDL

Impossible on Convex; a schema change is a deploy. Listed only so it is
explicitly closed rather than silently assumed.

### E — Global `schemaValidation: false`

- **Build:** trivial — one option.
- **Reversibility:** *appears* total, but is not: once documents have been
  written without validation, re-enabling validation fails the schema push
  against existing rows, and you need a repair migration first.
- **Forecloses:** every correctness guarantee the project sells. Rejected.

### Query strategies, compared

| | Denormalized `_search` blob | `vex_fieldIndex` secondary table | Reserved index slots | In-memory filter |
| --- | --- | --- | --- | --- |
| Build | ~1 day | Moderate + write-path invariant | Low, but permanent schema cost | Trivial |
| Capability | Full-text only | Equality, range, sort on any field | Full index performance | Anything, bounded rows |
| Index budget | 1 of 4 search indexes | 1 db index on one extra table | **Consumes the 32/table budget** | 0 |
| Scales to N dynamic fields | Yes | Yes | **No — hard cap** | Yes |
| Reversibility | High (derived data, rebuildable) | High (derived data, rebuildable) | **Low — slots are in the schema** | High |

Both the blob and the index table are **derived data**: wrong entries can be
rebuilt from the documents. That makes them cheap to get wrong, which is a
strong argument for doing either before reserving index slots, whose cost is
paid in the permanent schema.

---

## Optionality analysis: what actually constrains future evolution

### The storage layout is not the important decision

A ↔ B is a swappable implementation **if and only if** one boundary exists: all
dynamic-field access goes through an accessor (a hydration step in the read
path plus `setDynamic`/`getDynamic` on the write path), never `doc.custom.foo`
in user code or in generated types. Install that boundary and you can move
between A and B, or run both (B for small values, A for large), based on
evidence you do not have yet.

Skip the boundary and the storage layout is published API on day one — in every
customer's codebase and in `vex.types.ts`. This is the cheapest, highest-value
decision in the whole design, and it is invisible if you start from "which table
do the values go in".

### The precedence rule is a genuine one-way door

Fix it on day one: **code-defined fields always win; runtime fields can never
shadow a config field.** If runtime definitions are ever allowed to override
code, `vex.config.ts` stops being trustworthy, and every consumer of the
generated types is being lied to. There is no path back from that — you cannot
later tighten it without breaking whoever relied on the override.

### The type story changes the mental model, permanently

Pull-based codegen makes `vex.types.ts` a **cache of a remote source of truth**
rather than a projection of local config. Prisma (`db pull`) and Sanity
(`typegen`) both work this way, so it is proven — but it means the types can be
stale relative to production, and **CI must be able to detect that**
(`vex pull --check` failing the build on drift). Without the check, drift is
silent, and silent drift is precisely the complaint class that Strapi and
Directus users generate. Ship the check with the feature.

### The cheapest possible way to buy this option

**Build C's read path first, with the table permanently empty.** Refactor the
admin panel and the API so field definitions come from
`merge(configFields, runtimeFields)` where `runtimeFields` is always `[]`.

That is a pure internal refactor with zero product commitment and zero user
visibility. It converts "add dynamic fields" from an architecture change into a
feature flag — and it can be done now, alongside the RBAC and drafts work,
without deciding whether the feature ships at all. If the requirement never
materialises, you have lost a small amount of indirection. If it does, or if
something adjacent shows up (per-tenant field overrides, plugin-contributed
fields, a form builder — all three already on the roadmap), the merge point is
already there.

Note that the roadmap's **plugin system (custom field types)** and
**`defineFormCollection` form builder** both need exactly this merge point.
Three named future requirements converge on one refactor; that is the strongest
available argument for doing it early and deciding the rest later.

## Strategic caution

A runtime field builder is the single feature that makes a code-first CMS stop
being code-first. **Payload deliberately does not have one** — its answer is
`blocks`, which vexcms already implements (`packages/core/src/fields/blocks/**`).

So it is worth separating the two needs this idea might be serving:

- *"Let a non-developer compose a page without a deploy"* → the answer is blocks
  plus a better block picker, which is already built or scoped (block group
  categorization is on Milestone 1).
- *"Let a developer add a genuinely new field without a deploy"* → the design
  above, framed as an opt-in per-collection escape hatch rather than the default.

## Interaction with in-flight work

`2026-08-23-versioning-drafts` — `_draftSnapshot` must capture `custom` too, and
version restore has to decide what happens to a dynamic field that was
deprecated between the snapshot and the restore. Flag before that spec lands, or
the retrofit is expensive.

Roadmap items that converge on the same merge point (`.agent/docs/product/roadmap.md:53-57`):
**plugin system (custom field types)** and **`defineFormCollection` form
builder**. Both need runtime-contributed field definitions merged with config
definitions — the same seam this feature needs.

`2026-08-12-rbac-access-control` — field-level permissions have to answer what
they mean for a dynamic field. Option A makes this natural (per-row ACL); option
B makes it awkward (one Convex value to filter inside).

## Sources

- Repo source (see code references) — authoritative for current behaviour
- WordPress `wp_postmeta` / ACF field-group-as-post model
- Sanity typegen, Contentful CDA + environments, Directus
  `schema snapshot`/`schema apply`, Strapi Content-Type Builder (dev-only),
  Salesforce custom-field index pivot, WooCommerce `wc_product_meta_lookup`
- https://docs.convex.dev/production/state/limits — indexes per table (32),
  search indexes per table (4), document size (1 MiB), transaction limits
- Prisma `db pull` — prior art for types-as-cache-of-remote-schema

## Code references

- `packages/core/src/collections/validator.ts:104-193` — closed `defineTable`
  emission, `.index()` / `.searchIndex()` chaining
- `packages/core/src/fields/validators/utils.ts:24-28` — `v.optional` wrapping
- `packages/core/src/schema/generateVexSchema.ts:60-70` — `vex_globals` with `data: v.any()`
- `packages/core/src/api/server.ts:154` — `data` arg is `v.any()`; no core-level validation
- `packages/core/src/schema/migrate.ts` — migration functions are stubs
- `packages/core/src/config/sanitizeConfig.ts` — config → admin UI path
- `packages/core/src/types/generateVexTypes.ts` — `IndexFieldsBySlug`, per-collection interfaces
- `packages/cli/src/lib/generateSchema.ts:81-242` — generate → diff → push flow
- `node_modules/convex/dist/cjs-types/server/schema.d.ts:454` — `schemaValidation` defaults true
- `node_modules/convex/dist/cjs-types/values/validator.d.ts:242` — `VRecord` `fieldPaths` is `string`

## Open questions

- Is the need "field without deploy" or "page composition without deploy"? The
  second is already solved by blocks.
- Should dynamic fields be permitted on collections that back typed application
  code, or only on content-only collections?
- Search blob vs. secondary index table first? The blob is a day's work; the
  index table is the one that makes list views usable.
- Does field-level RBAC need to apply to dynamic fields? A "yes" moves the
  storage recommendation from B toward A.
- Is the 1 MiB document budget realistic once rich text plus an in-document
  `_draftSnapshot` plus dynamic fields share it? Worth measuring against a real
  maprios page before committing to B.
