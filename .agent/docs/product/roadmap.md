# Roadmap

> Source of truth for migration readiness: `.pi/agent-docs/product/maprios-migration-todo.md`
> (verified against package source 2026-08-04). Launch context:
> `.pi/agent-docs/product/v0.1.0-launch-roadmap.md` (M1-M8).

## Milestone 1 — Tier-1 www migration blockers

Framework gaps that block migrating maprios/www off Payload/MongoDB:

1. Versioning & drafts (spec 36) — `_status`/`_draftSnapshot`/`_version` fields, `vex_versions` table, adminSaveDraft/Publish/Unpublish/RestoreVersion, autosave, version history panel
2. Globals / `defineGlobal` (spec 35) — globals.get query, GlobalEditView, sidebar section
3. RBAC / access control — `defineAccess()`, `hasPermission()`, document + field-level permissions, enforcement in generated functions, public (unauthenticated) mutation access
4. `json` field type; `email` + `textarea` field types
5. PDF block — upload field `filterOptions` (mime), `Pdf_1` block, react-pdf renderer (port from maprios)
6. Block group categorization — `admin.group` on `defineBlock()`, grouped picker

## Milestone 2 — maprios/www migration

Pure content/component work once Milestone 1 lands:
- Port ~35-40 block configs + React renderers (Payload types -> Vex generated types)
- Define 5-6 collections (Pages, Media, Themes, Headers, Footers, ContactSubmissions) + SiteConfig global
- Seed script (Convex `seed` mutation)
- Drop Payload + MongoDB from maprios www

## Milestone 3 — Multi-component architecture + launch track

- Multi-component architecture (spec 43a): `defineComponent()`, per-component schema/codegen, workspace routing
- Cross-component auth/user pattern (spec 43b)
- maprios main-app migration
- Branch promotion: rebuild -> master (old master -> archive)
- v0.1.0 launch track: CLI completion, create-vexcms template, changesets CI/CD, docs site, brand + marketing site, npm release


## Long-term vision (post-launch)

> Sources: `.pi/agent-docs/product/roadmap.md` (monetization strategy v2),
> `v0.1.0-launch-roadmap.md` "Post-v1 Backlog", `multi-component-architecture.md`.

**License / monetization:** MIT core forever (all fields, admin panel, CLI, drafts, RBAC,
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