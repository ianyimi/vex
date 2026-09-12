# Roadmap

> **The 0.1.0 launch track lives in `v0.1.0-launch-plan.md`** — ordered specs A–J
> with acceptance criteria, verified against package source 2026-09-12. That file
> is what you follow to ship. This file holds milestone framing and the
> post-launch vision.
>
> Source of truth for migration readiness: `maprios-migration-todo.md`
> (verified against package source 2026-08-04).

## Milestone 1 — v0.1.0 launch track

Ten specs. Full scope, decisions, and acceptance criteria in
`v0.1.0-launch-plan.md`. Spec IDs are stable labels, not positions.

| Order | Spec | Gate |
|---|---|---|
| 1 | **A** — Data-table integrity & dead config | Nothing shipped is resolved-but-unread |
| 2 | **B** — Public API surface | Nothing exported lies about what it does |
| 3 | **F** — Lifecycle hooks & validation | Extensibility + server-side constraint enforcement |
| 4 | **C** — Versioning & drafts | The feature the README tells users to wait for |
| 5 | **D** — Richtext field | The published `richtext-plate` package becomes usable |
| 6 | **E** — Live preview | Editing feedback loop |
| 7 | **G** — Field input consistency pass | No input looks half-built |
| 8 | **H** — Edit-view overhaul | Editing is not hostile |
| 9 | **I** — List-view overhaul | 200 rows is usable |
| 10 | **J** — Responsive / mobile UI pass | Final gate before tagging |

**Sequencing principle:** each spec consumes what earlier specs built; no spec
writes inert code whose only justification is a later spec. That rule put F ahead
of C (drafts consume the hook and validation pipeline instead of building one for
F to slot into), turned B2 into a decision document rather than a reserved config
flag, and moved A's UI-dependent table config into I so nothing is half-wired
twice.

Hard ordering constraints (only these three are real): **B before F and D** ·
**F before C/D/G/H/I** · **J last**.

Architecture decisions taken for this track: ADR-010 (hook split — `before*` in the
write path, `after*` on `convex-helpers` triggers), ADR-011 (one write-validation
stage; `validate()` server-only and async), ADR-012 (live preview reads unsaved form
state).

Shipped since the original Milestone 1 framing: ✅ Globals / `defineGlobal` ·
✅ RBAC document-level access · ✅ Field-level RBAC permissions · ✅ Access index
resolution · ✅ `anonRole` fallback · ✅ `color` field · ✅ SEO prerendering and
revalidation · ✅ React test suite and coverage expansion.

Deferred out of 0.1.0 with reasons: `json` / `email` / `textarea` (leaf fields, cheap,
not gates) · `ui` / `tabs` (change core invariants — see `backlog.md`) · PDF block ·
block group categorization.

## Milestone 2 — maprios/www migration

Pure content/component work once Milestone 1 lands:
- Port ~35-40 block configs + React renderers (Payload types -> Vex generated types)
- Define 5-6 collections (Pages, Media, Themes, Headers, Footers, ContactSubmissions) + SiteConfig global
- Seed script (Convex `seed` mutation)
- Drop Payload + MongoDB from maprios www

## Milestone 3 — Multi-component architecture

- Multi-component architecture (spec 43a): `defineComponent()`, per-component schema/codegen, workspace routing
- Cross-component auth/user pattern (spec 43b)
- maprios main-app migration


## Long-term vision (post-launch)

> Sources: `roadmap.md` (monetization strategy v2),
> `v0.1.0-launch-roadmap.md` "Post-v1 Backlog", `multi-component-architecture.md`.

**License / monetization:** Apache-2.0 core forever (all fields, admin panel, CLI, drafts, RBAC,
live preview, hooks). Enterprise features ship as separate BSL/commercial packages in a
private-repo git submodule (`packages/enterprise`). Flat annual per-company license.
Additional revenue tiers: Convex partnership (referral/sponsorship/Stack listing), support
subscriptions, GitHub Sponsors/grants.

**Enterprise packages (paid):**
- `@vexcms/enterprise-environments` — project-level content branching (staging/production) — core competitive moat vs BaseHub
- `@vexcms/enterprise-sso` — SAML/OIDC SSO, IdP group -> role mapping
- `@vexcms/enterprise-workflows` — review/approval workflows, sign-off before publish
- `@vexcms/enterprise-audit` — full audit log with retention/export/compliance reports
- `@vexcms/enterprise-localization` — i18n field variants, locale-aware versioning

**Post-v1 free backlog (not blocking launch):** onboarding tour, team management UI, API key
management, content scheduling (`publishAt` + scheduled function), basic audit log, lifecycle
hooks system, TanStack Start adapter, S3/R2/Vercel Blob storage adapters, relationship inline
create, block style controls, public demo site, form builder (`defineFormCollection`),
plugin system (custom field types).

**Architecture backlog:** multi-component Workspaces (Option A, selected direction) matures
here — lands after enterprise features are stable; a unified namespace or plugin API can be
layered on the same workspace primitives later.