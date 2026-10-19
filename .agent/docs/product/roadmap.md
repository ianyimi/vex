# Roadmap

> **The 0.1.0 launch track lives in `v0.1.0-launch-plan.md`** — ordered specs A–J
> with acceptance criteria, verified against package source 2026-09-12. That file
> is what you follow to ship. This file holds milestone framing and the
> post-launch vision.
>
> **After 0.1.0, follow `post-v0.1.0-plan.md`** — tracks MW (maprios www), AD (brownfield
> adoption), ENT-0 (paid foundation), Pro → Agency → ENT-P (procurement readiness) →
> Enterprise, FR (free features), DB (backend adapters, unscheduled). Decided 2026-10-16/17;
> summarised under **After 0.1.0** below.

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

Deferred out of 0.1.0 with reasons: `ui` / `tabs` (change core invariants — see
`backlog.md`) · PDF block · block group categorization (post-0.1.0 Track MW).

**Release milestones after the tag:** first production deployment → 3–5 external design
partners on Convex → first paid Pro customers.

## After 0.1.0

Full scope, decisions, and acceptance criteria in `post-v0.1.0-plan.md`. Releases continue
as patches from `0.1.1`; `0.2.0` is reserved for a substantial change (backend adapters are
the leading candidate).

| Order | Track | Gate |
|---|---|---|
| 1 | **MW** — maprios www migration | Payload → VexCMS on its own Convex deployment; init/seed hook, block groups, per-field component slot, public-form hardening |
| 2 | **AD** — Brownfield adoption | An existing Convex app adopts Vex table by table: adopt existing tables, schema introspection, raw-validator field, auth bridge, live-data migrations |
| 3 | **ENT-0** — Paid foundation | Open-core ADR, private package registry, signed offline licence keys checked at build time |
| 4 | **Pro** | Co-editing (cursors, per-field indicators, conflict resolution, collaborative rich text), visual editor, basic A/B testing |
| 5 | **Agency** | Pro + client-project licence coverage, white-label admin, licence handoff |
| 6 | **ENT-P** — Procurement readiness | MSA with capped indemnity, support SLA, security-questionnaire pack, invoicing on terms |
| 7 | **Enterprise** | SSO/SCIM, audit log, approval workflows, branching, git mirror, full A/B + personalization |
| — | **FR** — Free features | Interleaved: localization, presence + facepile, scheduling, form builder, webhooks, S3/R2, image transforms, API keys / team management, MCP server, TanStack Start, `tabs` / `ui` |
| — | **DB** — Backend adapters | Unscheduled; after Enterprise. Split Convex out of core; Supabase first (`research/db-adapter-feasibility.md`) |

Multi-component workspaces (`research/legacy-planning/multi-component-architecture.md`)
moved behind brownfield adoption: root-app adoption is the common case and needs no
component split. Revisit when a customer needs isolation.

## Licensing and tiers

**Open core.** The Apache-2.0 core stays free forever — every field type, the admin panel,
CLI, drafts and versions, RBAC, live preview, hooks, localization, and presence. Paid tiers
are self-hosted licences priced **per company by size, never per seat**; VexCMS never hosts
customer infrastructure. Renewing customers keep their signed price. Nothing free today
becomes paid later. Licence terms for the paid packages are decided in the open-core ADR
(ENT-0). List prices are founder-held and published only with the first paid tier.

| Tier | Who | Adds |
|---|---|---|
| Community | everyone | the whole core |
| Pro | small companies (revenue / staff cap) | co-editing, visual editor, basic A/B testing |
| Agency | agencies building for clients under the Pro cap | client-project coverage, white-label, licence handoff |
| Enterprise | companies above the cap, or needing compliance | SSO/SCIM, audit log, approval workflows, branching, git mirror, SLA and procurement terms |

Other revenue lines: Convex partnership (ecosystem listing, startups program), support,
migration services, premium templates, grants.

**Architecture backlog:** backend adapters (Track DB) and multi-component workspaces both
build on a core split into backend-neutral and Convex-specific packages; neither starts
before the Enterprise tier.