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
| 4 | **Collaboration is paid, except presence** — presence and the viewer facepile are free (revised 2026-10-17); per-field indicators, cursors, follow mode, Yjs co-editing, and conflict resolution are paid | The free/paid line must be published before any of it ships (ENT-0) |
| 5 | First three enterprise features: **SSO, audit log, collaborative editing** — probable order SSO + audit, then collab | Collab is built against a finished identity and attribution model |
| 6 | `email` / `textarea` / `json` fields and the **B2 localization ADR** are pulled into 0.1.0, ahead of G | Removed from this plan; handed to the launch track |
| 7 | **Form builder is not in 0.1.0** and not on the maprios critical path | Lives in Track FR |
| 8 | **Localization is free** (2026-10-17) — code-first competitors ship it free (Payload built in, Strapi Community and Sanity free with unlimited locales). A paid add-on may cover translation *workflow* (AI translation, per-locale approvals) | Removed from the enterprise list; the B2 ADR records it as core |
| 9 | **A/B testing is an enterprise candidate** (2026-10-17) | Added under Later enterprise |
| 10 | **Three paid tiers, no per-seat pricing** (2026-10-17): Community (free) · Pro · Agency · Enterprise, priced per company in bands by **revenue / company size**. Renewing customers keep their price (grandfathered while renewals continue); no pay-once licences | ENT-0 licence design |
| 11 | **Licence enforcement never breaks a running deployment** (2026-10-17): checked at package install (private registry token) and at build (`vex dev` / `vex deploy`, signed offline key); grace periods are dates signed into the key | ENT-0 licence design |
| 12 | **Paid tiers ship in price order: Pro → Agency → Enterprise** (2026-10-17) | Supersedes "SSO + audit first": co-editing (ENT-3) is now the first paid build |
| 13 | **Enterprise cannot ship without its paperwork** (2026-10-17) — MSA, SLA, trust pack, invoicing are a spec of their own (ENT-P) | ENT-P gates the Enterprise tier |
| 14 | **Plugin system first** (2026-10-21) — Track PL leads the post-0.1.0 order; admin slots are built into launch specs G / H / I | MW-4 and AD-7 fold into PL; first-party adapters and paid tiers ship as plugins |
| 15 | **Paid tiers are not announced at launch** (2026-10-26) — public pages carry one line ("paid add-ons may come later, after the free roadmap; nothing free becomes paid") and name no tier or paid feature until one is close to shipping | Launch plan Q / R; each tier (and ENT-0) needs its own spec before any public mention |
| 16 | **Community-funded until Agency / Enterprise ship** (2026-10-26) — sponsorship is the funding model through the free-tier roadmap; investor funding is being pursued, but the best case defers it. Reason: once paying customers land they take precedence, so free-tier bug-fix turnaround must already be funded and staffed (agent-assisted) before then, or the community sees service drop | Launch plan R frames sponsorship as funding the free tier; ENT-0 timing and support-load planning account for both queues |

### Why the form builder is not first

- **Maprios does not use one.** No `@payloadcms/plugin-form-builder`; the contact form is a
  hard-coded `Contact_6` block posting to `apps/www/src/app/api/contact/route.ts`, which
  writes a fixed six-field `ContactSubmissions` document. Migrating it needs `email()` +
  `textarea()` (decision 6) and public-create hardening (MW-5) — not a builder.
- **Its prerequisites are unbuilt.** A builder renders editor-defined fields, so it needs the
  leaf fields, conditional fields (`admin.condition`, launch spec G — absent from source
  today), and the same rate limiting MW-5 builds. Built first, it would build all three.
- **The enterprise buyer is a Convex app team**, which needs Track AD to adopt Vex at all.
  Marketing forms are a smaller ask from that buyer than incremental adoption.

---

## Track order

| Order | Track | Gate it clears | Status |
|---|---|---|---|
| 1 | **PL** — Plugin system + admin extension points | Third parties (incl. Convex component authors) extend Vex without forking; slots pre-built in G / H / I | ☐ |
| 2 | **MW** — maprios www migration | A real Payload → Vex migration, written up as a case study | ☐ |
| 3 | **AD** — Brownfield adoption | An existing Convex app can adopt Vex table by table without rewriting | ☐ |
| 4 | **ENT-0** — Paid foundation | Licence, boundary, private registry, signed keys, build-time check | ☐ |
| 5 | **Pro** — ENT-3 co-editing, visual editor, basic A/B testing | First sellable tier | ☐ |
| 6 | **Agency** — white-label, client-project licence terms, licence handoff | Second tier | ☐ |
| 7 | **ENT-P** — Procurement & compliance readiness | Enterprise is buyable: MSA with capped indemnity, support SLA, trust/security-questionnaire pack, invoicing (PO, net terms, tax forms) | ☐ |
| 8 | **Enterprise** — ENT-1 SSO, SCIM, ENT-2 audit log, approval workflows, branching | Third tier; cannot ship before ENT-P | ☐ |
| — | **FR** — Free features | Interleave as demand appears; none gates the tracks above | ☐ |

**Sequencing principle (inherited from the launch plan):** each item consumes what earlier
items built; nothing ships inert code whose only justification is a later item.

- PL first: every later track adds admin UI or config; building it on extension points
  means each one is also a worked example for plugin authors, and the paid tiers attach as
  plugins instead of private paths.
- MW before AD: MW is greenfield, so it exercises the 0.1.0 surface plus small additions;
  AD changes how Vex relates to tables it did not create, which is a larger design.
- AD before ENT: an enterprise on Convex already has an app. Without AD there is nobody to
  sell SSO to.
- ENT-0 before any paid feature: the site promises *"Nothing free today becomes paid
  later"* (`apps/www/convex/seed.ts:989`). The line must be public before code lands.

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
| `email` ×2, `textarea` ×6+, `json` (`Themes.styles`) | ❌ | 0.1.0 (decision 6) |
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

## Enterprise

### ENT-0 — Foundation ☐ (blocks every paid item)

- **Open-core ADR** (next free number — the 0.1.0 B2 ADR lands first): open-core boundary, licence for private packages (commercial EULA / BSL /
  FSL), licence-key verification that never phones home (no hosting, no cloud — founder
  decision 2026-10-12), and how enterprise
  packages attach (adapter pattern, like `VexAuthAdapter`).
- `packages/enterprise` private submodule and its release path.
- **Licence design (decisions 10–11):**
  - *Distribution gating* — paid packages install only from a private registry with a
    per-customer token (Sidekiq's model); a lapsed token blocks new versions, never
    installed code.
  - *Signed offline key* — Ed25519-signed JSON (customer, tier, size band, features,
    `paidThrough`, `graceUntil`); the public key ships inside the paid packages, never in
    the Apache core. Core/CLI exposes only a generic build-time plugin-check hook.
  - *Where it is checked* — by the CLI at `vex dev` / `vex deploy` (CI compute, not the
    customer's Convex runtime). Past `paidThrough`: warnings in CLI and admin; past
    `graceUntil`: `vex deploy` refuses to deploy the paid packages. Already-deployed
    production keeps running.
  - *Customer tracking* stays on the vendor side (billing + key issuance + registry access
    logs) — no phone-home from customer deployments.
  - Enforcement is honesty-keeping; the contract is the real enforcement.
- **Collaboration is published as paid, presence as free** (2026-10-16, revised
  2026-10-17): `apps/docs/src/content/docs/roadmap.md` lists presence under *Planned* and
  the rest under *Enterprise*; `apps/www/convex/seed.ts` (cost FAQ and roadmap block)
  matches. The optimistic-concurrency guard (rejecting a stale write) is on the paid side —
  revisit if it should be free as data integrity rather than collaboration.

### ENT-1 — SSO ☐ · ENT-2 — Audit log ☐

**Why these ship together:**

- **Same buyer, same checklist.** Security review and SOC 2 / ISO 27001 vendor
  questionnaires ask "SSO?" and "audit trail?" together; every comparable CMS gates them in
  one tier (Strapi, Sanity, Directus, Payload — `04-business-model.md` § 2).
- **Each is weaker alone.** SSO moves identity to the customer's IdP — logins, JIT
  provisioning, IdP-group → role sync, deprovisioning. The audit log is what proves those
  events happened ("who had editor access on the 3rd?"). Audit without SSO attributes
  actions to locally-managed accounts compliance does not trust.
- **Both are cheap here.** SSO builds on Better Auth's SSO plugin (SAML/OIDC); the audit
  log builds on the write pipeline and triggers (F) plus `vex_versions`, which already
  records `createdBy` per version.

They are not technically coupled — either can ship first.

**ENT-1 scope:** SAML/OIDC, IdP group → role mapping into `userRolesField`, JIT
provisioning, deprovisioning (SCIM optional).

**ENT-2 scope:** append-only events for content writes, publish/unpublish, access denials,
auth and role changes; retention and export. Same coverage limit as hooks: dashboard edits
and `npx convex import` bypass it — document it, or close it with AD-5's check.

### ENT-3 — Collaborative editing ☐

Paid except presence and the facepile (decision 4). Design: `backlog.md` § Presence, live cursors, and § Concurrent-
edit conflict-resolution UX; `research/edit-view-presence-and-viewer-facepile.md`.

**Why after ENT-1/2:** the SSO coupling is small — presence identity is the session user,
whatever issued it. The real coupling is **audit attribution**: a Yjs-merged save carries
edits from several people, so the audit log needs a multi-author event model before
co-editing produces them.

**Prerequisites:**

- A shared field-input wrapper — every `packages/react/src/components/fields/*/Input.tsx`
  assembles its own chrome, and per-field indicators need one injection point.
- Plate ≥ 53 for `@platejs/yjs`; the workspace catalog pins 52.3.21.
- A Convex Yjs sync provider (update batching, snapshot compaction, reconnect catch-up,
  GC) — the one genuinely large piece; no official reference exists.
- `create-vexcms` has no template-variant mechanism for "preconfigured with presence".

**Order inside the item:** presence + facepile (free, ships in core or an opt-in free
package) → per-field indicators → conflict UX → richtext co-editing → cursors and follow
mode.

### Later enterprise

| Item | Builds on |
|---|---|
| Approval workflows | `DRAFT_ACTIONS` `publish` gate (shipped with C) + RBAC |
| A/B testing | Variant overlay on the draft model + edge assignment — design pending |
| Content branching | `backlog.md` § Enterprise content branching — merge semantics undesigned |
| Git one-way mirror | `backlog.md` § Git as the versioning store (b) — pairs with ENT-2 |

---

## Track DB — Backend adapters (unscheduled; candidate for the first substantial `0.2.0`)

Split every Convex-specific piece out of `@vexcms/core` behind a `VexDatabaseAdapter`
(server) and a data-client adapter (admin sync), then add a second backend. Full assessment:
`.agent/docs/research/db-adapter-feasibility.md` (2026-10-12) — feasible but large: ~52% of
core LOC imports Convex, and the public API exposes Convex's execution model (`ctx`-taking
server API) and query grammar (`withIndex`).

- **Order:** after the Enterprise tier. Every paid feature built before the split
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
| TanStack Start adapter | — |
| Unify type and schema generators | `backlog.md` — every new field type is implemented twice today |
