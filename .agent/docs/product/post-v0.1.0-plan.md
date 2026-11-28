# Post-v0.1.0 Plan

> What follows the `v0.1.0-launch-plan.md` track. Written 2026-10-16 from a review of
> `roadmap.md`, `backlog.md`, `maprios-roadmap-gaps.md`, the private business-model research, package
> source, and both maprios codebases (`maprios-app.git/dev/apps/www` on Payload,
> `maprios-app.git/dev/apps/app` on Convex).
>
> **Versioning:** releases continue as patches from `0.1.1`. This plan deliberately does
> not map tracks to version numbers — `0.2.0` is reserved for a substantial change that
> nothing below qualifies as yet.
>
> **Supersedes** `roadmap.md` Milestones 2–3 ordering: multi-component workspaces move
> behind brownfield adoption (see Track AD).

**Status key:** ☐ not started · ◐ in progress · ☑ done

---

## Decisions recorded 2026-10-16

| # | Decision | Consequence |
|---|---|---|
| 1 | maprios www gets **its own Convex deployment** | The www migration is greenfield — no multi-component or adoption work on its critical path |
| 2 | maprios content is **reseeded from code**, no Payload importer | Vex needs a first-class init/seed hook (MW-2) |
| 3 | maprios media **moves to Convex storage** | No Vercel Blob adapter; seed must upload media (MW-3) |
| 4 | `email` / `textarea` / `json` fields and the **B2 localization ADR** are pulled into 0.1.0, ahead of G | Removed from this plan; handed to the launch track |
| 5 | **Form builder is not in 0.1.0** and not on the maprios critical path | Lives in Track FR |
| 6 | **Localization is free** (2026-10-17) — code-first competitors ship it free (Payload built in, Strapi Community and Sanity free with unlimited locales). A paid add-on may cover translation *workflow* (AI translation, per-locale approvals) | Removed from the enterprise list; the B2 ADR records it as core |
| 7 | **Plugin system first** (2026-10-21) — Track PL leads the post-0.1.0 order; admin slots are built into launch specs G / H / I | MW-4 and AD-7 fold into PL; first-party adapters ship as plugins |

### Why the form builder is not first

- **Maprios does not use one.** No `@payloadcms/plugin-form-builder`; the contact form is a
  hard-coded `Contact_6` block posting to `apps/www/src/app/api/contact/route.ts`, which
  writes a fixed six-field `ContactSubmissions` document. Migrating it needs `email()` +
  `textarea()` (decision 4) and public-create hardening (MW-5) — not a builder.
- **Its prerequisites are unbuilt.** A builder renders editor-defined fields, so it needs the
  leaf fields, conditional fields (`admin.condition`, launch spec G — absent from source
  today), and the same rate limiting MW-5 builds. Built first, it would build all three.
- **The enterprise buyer is a Convex app team**, which needs Track AD to adopt Vex at all.
  Marketing forms are a smaller ask from that buyer than incremental adoption.

---

## Track order

| Order | Track | Gate it clears | Status |
|---|---|---|---|
| 0 | **INIT** — automated `vex init` (add VexCMS to an existing Next.js + Convex app, no table takeover); 0.1.0 ships the manual guide and check script it builds on | Existing apps can add the admin without re-scaffolding | ☐ |
| 1 | **PL** — Plugin system + admin extension points, shipping together with a plugin marketplace site and a free agent plugin (the "plugin launch"); includes a free access-control extension hook | Third parties (incl. Convex component authors) extend Vex without forking; slots pre-built in G / H / I | ☐ |
| 2 | **FR-core** — Form builder (plugin or core, decided in its spec), SEO fields (meta title/description, OG image, canonical, redirects), localization; small items alongside: rich-text markdown/HTML export, admin title/logo | A CMS needs these before paid work ships | ☐ |
| 3 | **Paid add-ons** — planned privately (separate packages; nothing free becomes paid); first release targeted by end of 2027 | — | ☐ |
| 4 | **AD** — Brownfield adoption | An existing Convex app can adopt Vex table by table without rewriting | ☐ |
| 5 | **FR-rest** — Remaining free features (scheduled publishing, TanStack Start adapter, outbound webhooks, API keys + team management), ordered by upvotes in a pinned GitHub Discussion | Interleave as demand appears; none gates the tracks above | ☐ |
| — | **PRES** — Presence and facepile (free) | Unscheduled; the developer builds it some time after 0.1.0 when time allows. Never on a public surface (no roadmap entry, no vote, no "coming soon") until it ships (developer, 2026-11-26) | ☐ |

Public roadmap order (COPY, 2026-11-26): `vex init` → plugin launch → form builder, SEO fields,
localization → brownfield adoption → voted features. Paid add-ons are never on it. The maprios www
migration (Track MW) is not in the track order.

Free line (developer, 2026-11-24): everything a developer can express in code — roles,
collection- and field-level permissions, organizations — stays free.

**Sequencing principle (inherited from the launch plan):** each item consumes what earlier
items built; nothing ships inert code whose only justification is a later item.

- PL first: every later track adds admin UI or config; building it on extension points
  means each one is also a worked example for plugin authors, and the paid tiers attach as
  plugins instead of private paths. PL ships as the plugin launch, with the marketplace
  site and a free agent plugin alongside it.
- Core free features before paid work: a CMS needs its basic free features — the form
  builder, SEO fields, and localization — before paid work, so the free offering stands on
  its own regardless of what's for sale.
- Brownfield adoption after the first paid release: adapting Vex to tables it did not
  create is a larger design than anything above it, and nothing requires it to precede paid
  add-ons now that no large buyer on an existing Convex app is on the near-term roadmap —
  there is no one AD exists to unlock a sale to.
- Paid add-ons ship only once the free/paid line is public: the site promises *"Nothing free
  today becomes paid later"* (`apps/www/convex/seed.ts:989`). The line must be public before
  code lands. Paid add-ons' first release is targeted by the end of 2027.
- The remaining free features interleave by community vote: a pinned GitHub Discussion
  collects upvotes on scheduled publishing, the TanStack Start adapter, outbound webhooks,
  and API keys + team management; votes set the order they ship in.

**Inherited from 0.1.0:** MW depends on launch spec G for `admin.width` (maprios uses 3
`row` layouts), the media-picker MIME filter (the PDF block), and `admin.condition`.

---

## Track PL — Plugin system and admin extension points

**Spec stem:** `.agent/docs/specs/2026-10-21-plugin-system/stem.md` — goal, decisions so far,
the pre-0.1.0 groundwork in G / H / I, and the full list of questions the implementation
spec must answer. **Research:** `.agent/docs/research/plugin-system-design.md` (industry
survey: Payload, Better Auth, Sanity, Strapi, Backstage, Fastify, Vite).

- **Shape:** `definePlugin({ id, requires, client, server })` with typed contributions to
  any part of the config (collections, fields, hooks, access resources, routes, slots, server
  functions, CLI hooks), semantic slot IDs, a `renderDefault` chain for overrides, declared
  dependencies, and inter-plugin services.
- **Convex components:** external collections backed by a component's API — the same
  data-provider seam as Track DB.
- **Dogfood:** `@vexcms/better-auth`, `@vexcms/file-storage-convex`,
  `@vexcms/richtext-plate`, then the paid tiers, all ship as plugins.
- **Absorbs** MW-4 (per-field component slot) and AD-7 (custom actions / views / filters).

---

## Track MW — maprios www migration

**Source of truth:** `maprios-app.git/dev/apps/www/src/payload/` — Payload 3.74, MongoDB,
Lexical, `@payloadcms/storage-vercel-blob`. 10 collections (4 are Better Auth tables), 1
global, 40 block configs across 17 block types.

### Gap table

| Payload usage | Vex today | Covered by |
|---|---|---|
| Drafts + autosave (Pages, SiteConfig), live preview | ✅ shipped (C, E) | — |
| Lexical rich text (CaseStudy, FAQ, Service) | ✅ `richtext()` (D) | Seed writes Plate JSON directly (decision 2) |
| `email` ×2, `textarea` ×6+, `json` (`Themes.styles`) | ❌ | 0.1.0 (decision 4) |
| `row` ×3 | `admin.width` declared, unread | 0.1.0 G |
| `tabs` ×1 (SiteConfig), `collapsible` ×1 | ❌ | Substitute `group`; no work |
| `ui` ×1 (`ImportThemeTrigger`), custom `icon` field | ❌ | MW-4 |
| 40 block configs in one picker | flat list | MW-1 |
| PDF `upload` with MIME filter | `accept` declared, picker ignores it | 0.1.0 G |
| Public contact form | `anonRole` + `create` ✅ | MW-5 for spam/rate limiting |
| Vercel Blob media | Convex storage only | Decision 3 + MW-3 |
| Payload `seed/` run on init | manual `convex run seed:init` | MW-2 |

### MW-1 — Block group categorization ☐

`BlockAdminConfig` carries only `icon` + `defaultCollapsed`
(`packages/core/src/fields/blocks/types.ts:38-57`); `BlockPickerDialog` renders a flat list
(`packages/react/src/components/form/FormBlocks.tsx:90-210`).

- `admin.group` on `defineBlock()`; picker renders labeled sections in declaration order,
  ungrouped blocks last; search filters across groups.
- **Acceptance:** a 40-block `blocks()` field is navigable by group and by search.

### MW-2 — Init / seed hook ☐

**What Payload does.** `onInit` runs on **every** Payload instance start, not once per
database: `packages/payload/src/index.ts:903-910` calls it during init, and `:1072-1076`
only skips it when the same config is already cached *in that process*. "Once" is left to
the user — the official examples guard with `payload.count(...)` → `if (!totalDocs)`
(`examples/astro`, `examples/remix`) or an env flag (`examples/multi-tenant`: `SEED_DB`).
On serverless that means the hook re-runs on every cold start.

**What Convex offers.** There is no server boot: functions are stateless, so "on init" can
only mean "the CLI runs a function after pushing code". Convex supports exactly that —
`npx convex dev --run <fn>` and `npx convex deploy --preview-run <fn>`
([docs](https://docs.convex.dev/cli/reference/dev),
[Stack](https://stack.convex.dev/seeding-data-for-preview-deployments)). Today the vex CLI
wraps `convex dev` / `convex deploy` (`packages/cli/src/lib/convexProcess.ts:66, 222, 231`)
and runs nothing afterwards; `apps/www` seeds by hand (`apps/www/package.json:13`).

**Decided 2026-10-16.**

| Concern | Decision |
|---|---|
| Where it runs | `vex dev` — once at startup, after the first successful push, before the watch loop. `vex deploy` — after the push, so it runs in CI on push/merge to production. Preview deploys — through `convex deploy --preview-run` |
| Context | An **action** context, so the hook can fetch external data and run queries and mutations |
| Writes | Through the Vex server API, so seed writes run the full write pipeline (hooks, validation, versioning) rather than raw `ctx.db` inserts |
| Frequency | Once per deployment, enforced by Vex: a `vex_`-prefixed marker row claimed by a mutation before the hook runs (two concurrent `vex dev` processes cannot double-seed) and marked complete after it. A re-run command (`vex init --force` or similar) clears it |
| Failure | **Fail the process.** The marker is released, not completed; `vex dev` exits non-zero before starting the watch loop, and `vex deploy` exits non-zero so the CI job fails |

**Design consequences the spec must handle:**

1. **The server API has no action form today.** Every `@vexcms/core/server` function takes
   a query or mutation context (`packages/core/src/api/server.ts:420, 1242`;
   `packages/core/src/api/types.ts:229, 282`). An action-side `vex` facade is needed that
   dispatches each call through `ctx.runQuery` / `ctx.runMutation` to generated internal
   functions. Each call is then its own transaction: **a seed is not atomic.**
2. **Failing `vex deploy` cannot undo a production push.** `convex deploy` has already
   shipped the functions when the hook runs, and earlier seed calls have already committed.
   Failing CI is a signal, not a rollback. Two mitigations: the preview run executes the
   same hook on the PR's preview deployment, so a broken seed fails *before* merge; and the
   docs require hooks to be idempotent (check-then-write per record) so a re-run after a
   fix converges.
3. **Action time limit.** [INFERENCE — verify the current Convex limit] Actions are bounded
   (~10 minutes); a large seed must chunk work or schedule continuations.
4. **Seed assets.** Convex functions cannot read files in the repo. Either the CLI uploads
   local seed assets before invoking the hook and passes it storage ids, or the hook
   fetches from URLs (MW-3 serves both).

**Still open:** whether an app can opt out per environment (Track AD adopters adding Vex to
a populated production deployment), and how `vex dev --once` behaves (run the hook, or
push only).

**Acceptance:** a fresh maprios www deployment seeds itself on first `vex dev`, on a
preview deploy, and on first production `vex deploy`, exactly once, with media, through the
Vex write pipeline; a throwing hook exits both commands non-zero and leaves the marker
unclaimed.

### MW-3 — Server-side media creation for seeds ☐

Seeding with images requires creating a media document from bytes or a URL server-side
(store → `createMediaDocument`), without the admin upload flow. `apps/www`'s seed has no
media for this reason. Consumed by MW-2.

### MW-4 — Per-field custom component slot → moved to Track PL

Only `relationship.admin.components.preview` exists
(`packages/core/src/fields/relationship/types.ts:34`). A general `admin.components` slot
(input, cell) on every field covers maprios' `ImportThemeTrigger` (`ui` field) and icon
picker (custom `icon` field) without a core-invariant change — `ui` as a real field type
costs three pipelines (`backlog.md` § `ui` and `tabs`). It is also the escape hatch users
ask for first, and Track AD reuses it for fields Vex cannot render natively.

- Typed through the existing `ComponentHKT` / `ApplyComponent` machinery, as `richtext`'s
  editor adapter and relationship preview already are.
- **Icon picker:** ship as a reusable component on `text()`, not a new field type, unless a
  storage difference appears.

### MW-5 — Public-create hardening ☐

No rate limiting, honeypot, or spam protection exists anywhere in the repo; the only
`rateLimit*` identifiers are inert Better Auth schema columns
(`packages/better-auth/src/pluginSchemas.generated.ts:121-136`). Maprios' contact route has
none either.

- Per-collection opt-in for anonymous `create`: rate limit keyed by IP/session (candidate:
  Convex's rate-limiter component), honeypot field, payload size cap.
- **Acceptance:** an anonymous flood of `create` on `contactSubmissions` is throttled; the
  honeypot rejects bot submissions; legitimate submissions are unaffected.

### MW-6 — The port ☐

Pure content work once MW-1–5 and 0.1.0 land:

- Collections: `pages`, media, `themes` (`styles: json()`), `headers`, `footers`,
  `contactSubmissions`; global `siteConfig` (tabs → groups).
- 40 block configs + renderers across Hero, Navbar, Feature, Testimonial, Team, Stats,
  Services, Service, Cta, Contact, Gallery, Faq, CaseStudy, Industries, Footer, Pdf.
- Seed via MW-2, rich text authored as Plate JSON, media via MW-3.
- Remove `payload`, `@payloadcms/*`, MongoDB, and Vercel Blob dependencies.

**Track acceptance:** maprios.com serves from VexCMS on its own Convex deployment; a fresh
deployment self-seeds; Payload and MongoDB are gone; a case study records before/after
(ops removed, real-time gained, LOC).

---

## Track AD — Brownfield adoption

**Goal:** a team with a large hand-written Convex app adopts Vex for some tables, keeps
every existing function working, and migrates the rest at its own pace while new code is
built on Vex.

**Test bed:** a clone of `maprios-app.git/dev/apps/app`. It is all Convex: 25 hand-written
tables in an 886-line `convex/schema.ts`; the `@convex-dev/workflow` component; Better Auth
1.6.2 with a `roles[]` array and an `organizationMembers` join table; no
`customQuery`/`customMutation` wrappers; `dangerously*` backfill mutations in
`convex/devSeed.ts`. It has content-shaped tables (`organizations`, `people`, `workflows`,
`invitations`), append-only and frozen-at-insert tables (`events`, `checkpoints`,
`workflowRuns.configSnapshot`), and engine tables Vex must never write.

**What already fits:** the CLI writes `vex.schema.ts` and only syncs its imports into
`convex/schema.ts`, leaving user tables untouched
(`packages/cli/src/lib/generateSchema.ts:98-230`); roles read as `string | string[]` from
`userRolesField` (`packages/core/src/access/hasPermission.ts:227`); `orgCollectionSlug` and
`customActions` exist (`packages/core/src/access/config.ts`).

### Items

| ID | Item | Why |
|---|---|---|
| AD-1 | **Adopt an existing table** — a collection binds to a table it did not create: keep existing index names, opt out of auto-generated indexes, no reserved `vex_` fields unless versioned (`timestamps: false` already exists) | Without it, adoption means a data migration |
| AD-2 | **Introspect** — generate `defineCollection` from existing `defineTable` validators: `v.id` → relationship, literal unions → select, `v.any` / deep objects → `json` or AD-3 | 25 tables by hand is the adoption wall |
| AD-3 | **Raw-validator passthrough field** — store and validate an arbitrary Convex validator, render via MW-4's slot or as read-only JSON | `factDeclValidator`, `runCurrentEntryValidator` and similar shapes no field type models |
| AD-4 | **Read-only collections and fields** in the admin, distinct from RBAC denial | Append-only `events`; frozen blobs must never be edited |
| AD-5 | **Writes outside Vex** — an exported wrapper hand-written mutations opt into so Vex hooks, validation, and revalidation fire; a doctor-style check listing tables written by unwrapped code | Hooks only fire through the Vex API today (launch plan F, "coverage hole") |
| AD-6 | **Auth bridge** — reuse the app's existing `createAuth()` instead of a second Better Auth instance; support org membership via a join table | [INFERENCE] `orgCollectionSlug` assumes a direct org reference; maprios uses `organizationMembers` — verify |
| AD-7 | **Admin escape hatches** — moved to Track PL (slots for document/row actions, custom views, list filters); AD consumes them for back-office tables | The admin becomes the app's back office, not just a content editor |
| AD-8 | **Data migrations for live tables** — config changes on adopted tables produce migrations, built on Convex's migrations component rather than reviving the un-exported `diffSchema` stubs (launch plan B1) | Adopted tables already hold production data |

**Not in this track — multi-component workspaces** (`roadmap.md` Milestone 3,
`research/legacy-planning/multi-component-architecture.md`). Adoption at the root app is
the common case and is what maprios needs: its app already composes a component
(`workflow`) at the root. Revisit when a customer needs isolation.

**Track acceptance (on the clone):**

- Vex manages at least `organizations`, `people`, and `workflows` with **zero data
  migration**; `events` appears read-only.
- The existing vitest suite passes unchanged; hand-written functions are untouched except
  for opting into AD-5's wrapper.
- The admin authenticates with the app's existing Better Auth sessions and roles.
- An adoption guide in `apps/docs` walks the same steps.

---

## Paid tiers

Paid-tier design is planned privately as separate packages; nothing free becomes paid.
See the business plan for details.

---

## Track DB — Backend adapters (unscheduled; candidate for the first substantial `0.2.0`)

Split every Convex-specific piece out of `@vexcms/core` behind a `VexDatabaseAdapter`
(server) and a data-client adapter (admin sync), then add a second backend. Full assessment:
`.agent/docs/research/db-adapter-feasibility.md` (2026-10-12) — feasible but large: ~52% of
core LOC imports Convex, and the public API exposes Convex's execution model (`ctx`-taking
server API) and query grammar (`withIndex`).

- **Order:** after the paid add-ons ship. Every paid feature built before the split
  (co-editing's Yjs provider, presence) needs a per-backend implementation afterwards.
- **Second backend = Supabase** (Realtime keeps the admin live; managed DB; auth/storage),
  not generic Postgres, where Payload is free and mature.
- **Admin sync is tiered by capability:** live (Convex; Supabase Realtime + refetch; Mongo
  change streams) or invalidate-on-mutation + polling through the TanStack Query layer the
  admin already uses. Features that need live data (presence, co-editing) declare it.
- **Community adapters only after two first-party adapters exist**, gated by an exported
  adapter conformance suite (the `@vexcms/react/testing` pattern). One implementation cannot
  define a non-leaky interface.
- **Not yet done from the research's "do before 0.1.0" list (§5), as of 2026-10-17:**
  neutral storage kinds on fields (`ADMIN_FIELDS` still carries Convex validator strings), a
  neutral `where` filter beside `withIndex`, and versions/drafts written against a narrow
  port instead of `ctx.db` (7 files). Only the `@vexcms/core/convex` subpath exists.
  **2026-10-21:** the `where` item is specced as launch-plan B3
  (`specs/2026-10-21-backend-neutral-query-args`).

## Cross-feature seams — pre-0.1.0 vs deferred (decided 2026-10-21)

Rule: change an existing shape **before** 0.1.0 only when changing it later would break
users or need a data migration. Anything purely additive waits for the feature that needs it.

**Built into pre-0.1.0 specs:**

| Seam | Where | Why it can't wait |
|---|---|---|
| Admin slots (S1–S14) | G steps 7–8, 11, 15–18; H; I | Retrofitting slots into rebuilt views is a second rewrite |
| `adminHref` link builder | G step 17 | ~16 hand-built cell links; route renames and plugin pages need one place |
| Stored `id` on object-array items | G steps ≤15 | Adding later needs a backfill migration of live data |
| Plain (serialisable) `where` | B3 | Saved views and URL filters store it; the format must exist before I |
| Localization storage model | B2 ADR (before G step 9) | The storage shape is the one irreversible part |
| Router through the framework adapter | H | A Next-only guard would block the TanStack Start adapter |
| `/admin/collections/<slug>` routes | H | URL change; cheapest before users bookmark |
| Per-collection data source hooks | I | Plugin collections, adapters and adopted tables plug in here |
| Saved-view scope + plain filters | I | Stored rows; changing shape later means migrating them |
| Status enum instead of literals | I | Approval stages and branches add states |
| Plate 53.x | D step 6 | Before users store content edited under 52 |

**Deferred to the feature that needs them (additive, no breaking change):**

| Seam | Deferred to | Note |
|---|---|---|
| `actor` + `context` on hook props and the write API | ENT-2 audit log (first consumer); also approvals, scheduling, seeding (MW-2), webhooks, plugins | Optional fields on `BaseHookProps` and on `create` / `update` args. Reaching `afterChange` / `afterDelete` (convex-helpers triggers) goes through the ctx that `createVexMutations` already wraps — an internal change; users' `createVexMutations({ config, mutation, internalMutation })` wiring stays as is |
| Document session context (`useVexDocument` carrying loaded `updatedAt`, read keys, actor) | ENT-3 co-editing / stale-save guard; branching; localization switcher | H ships `useVexDocument` (S5); fields are added when a consumer exists |
| New read keys: `branch`, `variant`, `asOf` (and `locale`, ADR-016) | Branching, A/B testing, scheduling, localization | **Decided 2026-10-22:** independent top-level keys beside `drafts`, never a grouped `perspective` object; any combination valid; populated relationships inherit every read key. Additive |
| Collection `dbName` separate from slug | Track AD | 12 `ctx.db.query(slug)` sites; route through one helper when AD lands |
| Action-side server API | MW-2 init hook | Keep B3's server API shapes independent of query vs mutation ctx |

## Track FR — Free features (interleave)

Ordered by expected demand. None gates the tracks above.

| Item | Note |
|---|---|
| Scheduled publishing | `publishAt` + Convex scheduler + C's `publish` path; small |
| Form builder | After 0.1.0 G (`admin.condition`), the leaf fields, and MW-5 |
| Outbound webhooks | On F's `afterChange` triggers |
| `tabs` / `ui` fields | Core-invariant cost (`backlog.md`); MW-4 covers most `ui` uses first |
| S3 / R2 storage adapters | `VexStorageAdapter` pattern |
| Image transforms | — |
| API keys / team management | Better Auth `apiKey` schema already present |
| MCP server | Typed functions exposed to agents |
| Framework adapters: TanStack Start → React + Vite → Astro | `backlog.md` § Framework adapters |
| Unify type and schema generators | `backlog.md` — every new field type is implemented twice today |
