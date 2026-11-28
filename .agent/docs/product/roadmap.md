# Roadmap

> **The 0.1.0 launch track lives in `v0.1.0-launch-plan.md`** — ordered specs A–J
> with acceptance criteria, verified against package source 2026-09-12. That file
> is what you follow to ship. This file holds milestone framing and the
> post-launch vision.
>
> **After 0.1.0, follow `post-v0.1.0-plan.md`** — tracks INIT (automated `vex init`), PL (plugin
> system), FR-core, AD (brownfield adoption), FR-rest (voted free features), PRES (presence; unscheduled, never public until shipped), DB (backend adapters, unscheduled).
> Paid add-ons are planned privately as separate packages; nothing free becomes paid.
> Decided 2026-10-16/17/21; summarised under **After 0.1.0** below.

## Milestone 1 — v0.1.0 launch track

Ten specs. Full scope, decisions, and acceptance criteria in
`v0.1.0-launch-plan.md`. Spec IDs are stable labels, not positions.

| Order | Spec | Gate |
|---|---|---|
| 1 | **A** — Data-table integrity & dead config | Nothing shipped is resolved-but-unread |
| 2 | **B** — Public API surface | Nothing exported lies about what it does |
| 3 | **F** — Lifecycle hooks & validation | Extensibility + server-side constraint enforcement |
| 4 | ~~**E** — Live preview~~ ✅ | Editing feedback loop — shipped `b5263dc`, 2026-09-20 |
| 5 | ~~**C** — Versioning & drafts~~ ✅ | Shipped `35a50dc`…`865f360`, 2026-09-30 → 10-13 |
| 6 | ~~**D** — Richtext field~~ ✅ | Shipped `7d51f56`, 2026-10-15; dogfood + docs steps remain |
| 7 | **G** — Field input consistency pass | No input looks half-built |
| 8 | **H** — Edit-view overhaul | Editing is not hostile |
| 9 | **I** — List-view overhaul | 200 rows is usable |
| 10 | **J** — Responsive / mobile UI pass | Final gate before tagging |

**Sequencing principle:** each spec consumes what earlier specs built; no spec
writes inert code whose only justification is a later spec. That rule put F ahead
of C (drafts consume the hook and validation pipeline instead of building one for
F to slot into), put E ahead of C (reading unsaved form state over `postMessage`
removes the only thing preview needed drafts for), turned B2 into a decision
document rather than a reserved config flag, and moved A's UI-dependent table
config into I so nothing is half-wired twice.

Hard ordering constraints (only these three are real): **B before F and D** ·
**F before C/D/G/H/I** · **J last**.

Architecture decisions taken for this track: ADR-010 (hook split — `before*` in the
write path, `after*` on `convex-helpers` triggers), ADR-011 (one write-validation
stage; `validate()` server-only and async), ADR-012 (live preview reads unsaved form
state over `postMessage`, overlaid on the consumer's own query result — shipped with a
dual `postMessage` + `BroadcastChannel` transport, since `postMessage` alone cannot reach
a tab the admin never opened).

Shipped since the original Milestone 1 framing: ✅ Globals / `defineGlobal` ·
✅ RBAC document-level access · ✅ Field-level RBAC permissions · ✅ Access index
resolution · ✅ `anonRole` fallback · ✅ `color` field · ✅ SEO prerendering and
revalidation · ✅ React test suite and coverage expansion · ✅ Lifecycle hooks and
server-side field validation · ✅ Live preview · ✅ Versioning & drafts · ✅ Richtext field.

**Pulled into 0.1.0 (2026-10-16):** `email` / `textarea` / `json` leaf fields, sequenced
before G so its consistency pass covers them, and the B2 localization ADR — localization
is a free core feature (2026-10-17).

Deferred out of 0.1.0 with reasons: PDF block · block group categorization
(post-0.1.0 Track MW). `ui`/`tabs`/`collapsible`/`row` are no longer deferred — they
shipped in 0.1.0 alongside `email`/`textarea`/`json` (spec
`2026-10-16-field-input-consistency-pass`).

**Release milestones after the tag:** first production deployment → 3–5 external design
partners on Convex → paid add-ons planned privately (separate packages; nothing free
becomes paid).

## After 0.1.0

Full scope, decisions, and acceptance criteria in `post-v0.1.0-plan.md`. Releases continue
as patches from `0.1.1`; `0.2.0` is reserved for a substantial change (backend adapters are
the leading candidate).

| Order | Track | Gate |
|---|---|---|
| 0 | **INIT** — automated `vex init` | Adds VexCMS to an existing Next.js + Convex app (0.1.0 ships the manual guide and check it builds on); no table takeover |
| 1 | **PL** — Plugin system + admin extension points | `definePlugin` with typed contributions to any part of the config, semantic admin slots (pre-built in G / H / I), dependencies, Convex-component plugins via external collections (`specs/2026-10-21-plugin-system/stem.md`); ships with the marketplace and a free agent plugin |
| 2 | **FR-core** — Form builder, SEO fields, localization | Basic CMS features first; rich-text markdown/HTML export and admin title/logo alongside |
| 3 | **Paid add-ons** — planned privately (separate packages; nothing free becomes paid) | — |
| 4 | **AD** — Brownfield adoption | An existing Convex app adopts Vex table by table: adopt existing tables, schema introspection, raw-validator field, auth bridge, live-data migrations |
| 5 | **FR-rest** — Remaining free features | Ordered by the pinned GitHub Discussion vote: scheduled publishing, TanStack Start adapter, outbound webhooks, API keys / team management. Unvoted backlog: S3/R2, image transforms, MCP server, React + Vite / Astro adapters |
| — | **PRES** — Presence and facepile (free) | Unscheduled, after 0.1.0 when time allows; never on a public surface until it ships |
| — | **DB** — Backend adapters | Unscheduled. Split Convex out of core; Supabase first (`research/db-adapter-feasibility.md`) |

Multi-component workspaces (`research/legacy-planning/multi-component-architecture.md`)
moved behind brownfield adoption: root-app adoption is the common case and needs no
component split. Revisit when a customer needs isolation.

## Licensing

**Open core.** The Apache-2.0 core stays free forever — every field type, the admin panel,
CLI, drafts and versions, RBAC, live preview, hooks, and localization. Paid
add-ons may come later, as separate packages; nothing free becomes paid. Details are
planned privately.

**Architecture backlog:** backend adapters (Track DB) and multi-component workspaces both
build on a core split into backend-neutral and Convex-specific packages.