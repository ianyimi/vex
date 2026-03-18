# Monetization Strategy & Feature Roadmap (v2)

## Competitive Context

**Vex CMS** is a Convex-native headless CMS — PayloadCMS rebuilt from the ground up for Convex's real-time, serverless architecture with full TypeScript type safety.

**Comparable product**: [BaseHub](https://basehub.com/) — headless CMS with Git-like content branching, $12/user/month, built on NeonDB (Postgres). Their core differentiator is content branching. Our advantage: **real-time reactivity is free and built-in via Convex**. BaseHub has to engineer live collaboration on top of Postgres; we get it for nothing.

**Key references:**

- [BaseHub pricing & features](https://basehub.com/)
- [Payload CMS](https://payloadcms.com/) — primary inspiration, MIT licensed
- [Payload richtext-lexical package](https://github.com/payloadcms/payload/tree/main/packages/richtext-lexical) — Lexical 0.41.0, model our `richtext()` field after this
- [Convex Stack directory](https://convex.dev/components) — distribution option post-feature-complete

---

## License Strategy

**MIT license for all core packages.** This is the developer acquisition flywheel — the more people self-host, the more brand grows.

Enterprise features ship as separate packages under **BSL (Business Source License)** or a commercial license. Source is visible but requires a paid license for commercial use above a threshold.

Comparable OSS monetization models:

- [Payload CMS](https://github.com/payloadcms/payload) — MIT core → Payload Cloud hosting
- [Ghost](https://github.com/TryGhost/Ghost) — MIT → Ghost Pro hosting
- [Strapi](https://github.com/strapi/strapi) — MIT → Strapi Cloud + enterprise
- [Sanity](https://www.sanity.io/pricing) — free tier → API usage billing
- [Cal.com](https://github.com/calcom/cal.com) — AGPL → enterprise commercial license
- [Posthog](https://github.com/PostHog/posthog) — MIT/EE split — MIT core, paid EE features in same repo

---

## Monetization Model

### Tier 1 — MIT Core (Free Forever)

Everything in the MVP and Phase 2 stays free in npm packages:

- All field types (text, number, select, date, relationship, array, group, blocks, upload, richtext)
- Collections, globals, defineConfig
- Admin panel (self-hosted, Next.js)
- CLI + schema generation + auto-migration
- Create, read, update, delete operations
- Media collections + file uploads (Convex storage)
- Draft/publish workflow + version history
- RBAC enforcement (document-level and field-level permissions)
- Rich text editor (Lexical)
- Live preview
- Auth integration (Better Auth)
- Custom admin components (useField, useForm, component registration)
- Team management UI
- API key management
- Content scheduling
- Audit log (basic)
- Hooks system (collection + field lifecycle hooks)

### Tier 2 — @vexcms/enterprise (Paid Packages, BSL)

Gated features that enterprises require and will pay for:

| Package                           | Feature                                                     | Why It's Paid                                   |
| --------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| `@vexcms/enterprise-environments` | Project-level content branching (staging/production)        | Core competitive moat, BaseHub charges for this |
| `@vexcms/enterprise-sso`          | SAML/OIDC SSO, IdP group → role mapping                     | Enterprise security requirement                 |
| `@vexcms/enterprise-workflows`    | Review/approval workflows, required sign-off before publish | Compliance & editorial governance               |
| `@vexcms/enterprise-audit`        | Full audit log with retention, export, compliance reports   | SOC2/HIPAA requirement                          |
| `@vexcms/enterprise-localization` | i18n field variants, locale-aware versioning                | Agencies pay per-project for this               |

Pricing model: **flat annual license per company** (not per-seat). $500-2000/yr range. Standard for OSS enterprise packages.

### Tier 3 — Convex Partnership

Every Vex install requires a Convex account. As Vex grows, it drives meaningful Convex signups. Leverage options:

1. **Affiliate/referral revenue** — revenue share on Convex plan upgrades from Vex users
2. **Sponsored development** — Convex funds Vex dev time as a showcase project
3. **Convex Stack listing** — featured in Convex ecosystem as a full project template, drives organic installs
4. **Acquisition/hire path** — traction-based, Vex is the best marketing for Convex's value prop

### Tier 4 — Support & Services

Once agencies and startups depend on the project:

- $500-2000/mo priority support subscriptions
- Custom implementation consulting
- White-label admin panel licensing for agencies

### Tier 5 — GitHub Sponsors / OSS Grants

Once public with traction:

- [GitHub Sponsors](https://github.com/sponsors)
- [Open Collective](https://opencollective.com/)
- Ecosystem grants: Vercel, Netlify, and others fund OSS in their ecosystem

---

## Enterprise Package Setup — Git Submodule

`packages/enterprise` must be set up as a git submodule pointing to a separate private repo. This keeps enterprise source code out of the public MIT repo's git history entirely.

```bash
# one-time setup: add the private repo as a submodule
git submodule add git@github.com:you/vexcms-enterprise.git packages/enterprise
git commit -m "chore: add enterprise package as git submodule"
```

After this, `packages/enterprise` in the public repo is just a pointer to a commit hash — no source code visible.

**Local dev (full access):**

```bash
git clone --recurse-submodules git@github.com:you/vexcms.git
# packages/enterprise is fully populated, pnpm workspace links it normally
```

**Public contributors cloning the MIT repo:**

```bash
git clone https://github.com/you/vexcms
# packages/enterprise directory is empty — no error, no enterprise code exposed
```

**Keeping the submodule in sync:**

```bash
# after making changes inside packages/enterprise
cd packages/enterprise
git add . && git commit -m "feat: ..."
git push origin main

# back in root repo, update the submodule pointer
cd ../..
git add packages/enterprise
git commit -m "chore: update enterprise submodule"
```

**pnpm workspace** — no special handling needed. Add to `pnpm-workspace.yaml` as normal:

```yaml
packages:
  - "packages/*" # picks up packages/enterprise automatically when populated
  - "apps/*"
```

**CI** — enterprise builds run with separate credentials scoped to the private repo. Public CI (GitHub Actions on the MIT repo) simply skips the enterprise package when the submodule is not populated.

---

## Rich Text Editor

**Payload 4.0 uses Lexical** (Meta's editor framework). Package: [`@payloadcms/richtext-lexical`](https://github.com/payloadcms/payload/tree/main/packages/richtext-lexical) — Lexical 0.41.0.

Model the `richtext()` field directly after their implementation:

- Same serialization patterns (JSON storage in Convex)
- Same plugin architecture
- Same React integration
- Add HTML/RSC rendering utilities (`@vexcms/richtext-lexical/html`, `/rsc`)
- Block embeds link to the existing `blocks()` field system

---

## Document Versioning vs Project-Level Environments

These are two distinct features that compose together:

**Document-level versioning (Spec 07, MIT core)** is the draft/publish workflow. An editor saves a draft, previews it, publishes it. Every CMS has this — it's table-stakes. Documents have `_status` (draft/published), `_draftSnapshot` for pending edits, and version history in `vex_versions`.

**Project-level environments (Spec 21, enterprise)** is content branching — staging vs production. A team makes changes in staging, reviews the diff, promotes atomically to production. This is the enterprise moat — BaseHub charges for it, nothing in the Convex ecosystem competes.

**How they compose:** Documents have draft/published status _within_ an environment. A staging environment has its own drafts and published docs. "Promote staging → production" copies the published state of staging into production.

**Design constraint for Spec 07:** Don't hardcode assumptions that there's only one "published" state. Add an optional `environmentId` parameter to publish/query functions so the API surface doesn't break when environments land in Spec 21.

---

## Why Certain Features Were Deprioritized

**TypeSafe Content SDK** — Not needed. Vex is Convex-native; users write Convex queries directly against typed generated tables. The CLI's generated `vex.schema.ts` already gives full type safety. Only relevant if supporting non-Convex backends (not planned).

**Webhooks** — Not needed for core use case. Convex is real-time push — publish a document and changes propagate instantly to all subscribers with no build step. Webhooks would only matter for external integrations (Slack, Zapier), which is a low-priority nice-to-have.

**REST API** — Not needed. Convex queries/mutations are sufficient. If someone needs REST, they can write a Convex HTTP action. Building a REST adapter layer adds complexity without serving the Convex-native value prop.

**Convex Component Packaging** — The Convex Components data isolation model prevents joining Vex-managed tables with app tables in a single query. This kills the core value prop. The better-auth component hit the same wall. Distribution via **Convex Stack** (full project template) gives discoverability without the isolation penalty.

**Web Hosting** — Not charging for hosting. Revenue comes from enterprise packages, Convex partnership, and support contracts instead.

---

## Current Project State

### What's Built

| Area              | Status  | Details                                                                                           |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------- |
| Field types       | ✅ Done | 10 types: text, number, checkbox, select, date, imageUrl, relationship, json, array, multi-select |
| Schema generation | ✅ Done | Full codegen with auto-migration, diffing, Prettier formatting                                    |
| CLI               | ✅ Done | `vex dev` (watch + generate), `vex deploy` (migrate + deploy)                                     |
| Admin list views  | ✅ Done | Paginated tables, full-text search, column generation, bidirectional pagination                   |
| Admin edit forms  | ✅ Done | Auto-generated Zod validation, field components, partial patch on save                            |
| Better Auth       | ✅ Done | Auth table extraction, user/session/account tables, admin plugin                                  |
| Create/delete     | ✅ Done | createDocument (Zod validated), deleteDocument, bulkDelete, admin UI (modals, row selection)      |
| Testing           | ✅ Done | 233 tests passing (field types, schema diffing, migration planning, form generation, defaults)    |

### What's Missing for MVP

| Area                          | Status       | Gap                                                                                    |
| ----------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| Create/delete mutations       | ✅ Done      | createDocument, deleteDocument, bulkDelete, create/delete modals, row selection         |
| Media / uploads               | ❌ Not built | No `upload()` field type, no file upload handlers, no media library UI                 |
| Drafts / versioning           | ❌ Not built | No `_draftSnapshot`, no `vex_versions` table, no publish workflow                      |
| RBAC enforcement              | ❌ Not built | Auth exists but no permission checks in query/mutation handlers                        |
| Rich text                     | ❌ Not built | No `richtext()` field type — without this, Vex is a structured-data tool, not a CMS    |
| Live preview                  | ❌ Not built | No preview iframe, no postMessage protocol, no draft preview                           |
| Hooks                         | ❌ Not built | No beforeCreate/afterUpdate lifecycle hooks                                            |
| Custom component registration | ❌ Not built | useField/useForm exist in edit form, but no `admin.components.Field` path registration |

---

## Full Spec & Feature Build Order

### Phase 0 — Already Implemented

```
Spec 00 — Monorepo Setup                               ✅
Spec 01 — Testing Infrastructure                        ✅
Spec 05 — Schema Field System (10 field types)          ✅
Spec 06 — Convex Integration (list, get, update, search) ✅ partial
Spec 06b — Create & Delete Mutations                    ✅
Spec 11 — Testing Strategy                              ✅
Spec 12 — Admin Data Table                              ✅
Spec 13 — Better Auth Package                           ✅
Spec 14 — Collection Edit Form                          ✅ partial
```

### Phase 1 — Core MVP (must ship before anyone uses this)

A content editor expects all of these on day one. Nothing here is optional.

```
Spec 06b — Create & Delete Mutations
  - adminCreate mutation with server-side Zod validation
  - adminDelete mutation with cascade options
  - Bulk delete support
  - Wire into admin panel (create button, delete action on list/edit views)
  - This is the most critical gap — the admin panel cannot create documents today

Spec 15 — Media Collections
  - defineMediaCollection() with auto-injected fields (storageId, filename, mimeType, size, etc.)
  - upload() field type storing v.id("media_collection_slug") references
  - FileStorageAdapter interface, @vexcms/file-storage-convex default implementation
  - Admin UI: media library grid, upload dropzone, media picker popover
  - Per-field MIME type and size restrictions

Spec 07 — Versioning & Drafts
  - _status (draft/published), _draftSnapshot, _version, _hasDraft, _publishedAt
  - vex_versions table with indexes by collection/document
  - adminSaveDraft, adminPublish, adminUnpublish, adminRestoreVersion mutations
  - Autosave with coalesced version records
  - Version history panel in admin
  - IMPORTANT: Add optional environmentId parameter to publish/query functions
    so the API doesn't break when Spec 21 (environments) lands

Spec 16 — RBAC / Access Permissions
  - defineAccess() builder with type-safe permission matrix
  - hasPermission() runtime resolver
  - Document-level permissions (CRUD per collection per role)
  - Field-level permissions (allowlist per action)
  - Enforce in all admin query/mutation handlers
  - Multi-role OR resolution
```

### Phase 2 — Competitive Product (makes Vex worth choosing over alternatives)

```
Spec 17 — Rich Text Field (Plate)
  - richtext() field type in @vexcms/core, @vexcms/richtext package
  - Plate editor (Slate.js, React-native) with shadcn/ui components
  - Basic formatting: bold, italic, headings, lists, links, code, images, blockquotes
  - JSON storage in Convex (v.any(), Plate node array)
  - @vexcms/richtext/editor (admin) + @vexcms/richtext/render (frontend, PlateStatic)
  - Custom blocks: defineBlock() with editor + render React components
  - Phase: 17a (core editor + renderer) → 17b (custom block system)
  - Without rich text, Vex is a structured-data tool, not a CMS
  - See: agent-os/product/specs/17-richtext/notes.md

Spec 10 — Live Preview
  - livePreview config per collection (url, breakpoints, reloadOnFields)
  - LivePreviewPanel component with iframe
  - postMessage protocol (init, refresh, ready)
  - @vexcms/live-preview-react package (useRefreshOnSave hook)
  - Origin validation
  - Draft content queries with _vexIncludeDraft flag
  - Pairs with Spec 07 — preview draft content before publishing

Spec 31 — Typed Per-Collection Queries
  - CLI generates typed query/mutation files per collection (e.g., convex/vex/collections/articles.ts)
  - Each collection gets get, list, create, update, delete with fully typed args and return types
  - Return types inferred from Convex DataModel (Doc<"articles">, etc.)
  - Generic getDocument remains for admin panel (dynamic collection routing)
  - preview flag support baked into generated get queries
  - User-facing code uses api.vex.collections.articles.get instead of the untyped generic
  - Unlocks full LSP autocomplete on document fields in frontend pages

Spec 09b — Custom Component Registration
  - admin.components.Field path strings on field config
  - Build-time component resolution and componentMap.ts generation
  - ui() field type for non-persisted display/action fields
  - Note: useField/useForm hooks already work in edit forms (Spec 14)
  - This spec adds the registration and resolution system on top

Spec 09c — Field Style Controls & Cross-Collection Copy/Paste
  - Universal ContainerStyleConfig applied to every field's wrapper div (spacing, bg, border, cursor, hover, shadow, opacity)
  - Type-specific inner style configs: TextStyleConfig, MediaStyleConfig, LayoutStyleConfig
  - Custom blocks declare accepted style tiers via admin.styleConfig array
  - Popover form (tooltip on each field input) with sections based on field type
  - Cross-collection copy/paste: copy style configs or full field/block definitions to other collections
  - Paste validation: style-only always valid, field/block paste checks type compatibility
  - Depends on Spec 09b — custom components must be able to receive and spread style props
  - See: agent-os/product/specs/09c-field-style-controls/notes.md

Spec 18 — Team Management UI
  - Invite users by email (email send via Convex action)
  - Role assignment during invite flow
  - Pending invite table with revoke support
  - User management table in admin panel
  - Needed before more than one person uses the CMS
```

### Phase 2.5 — Site Building (composable page builder and site primitives)

```
Spec 28 — Blocks System                              ← IMPLEMENT FIRST
  - defineBlock() in @vexcms/core (data-only, no React dep)
  - blocks() field type storing ordered array of block instances
  - Admin block picker, reorder, inline edit — ships as standard field component (not custom)
  - RenderBlocks component in @vexcms/ui (component map pattern, no circular deps)
  - Type inference: discriminated union of allowed block shapes
  - See: agent-os/product/specs/28-blocks-system/notes.md

Spec 29 — Color Field
  - color() field type returning string (CSS variable or hex)
  - Admin popover with two tabs: theme colors (CSS vars from site theme) and custom (wheel + hex input)
  - Theme tab reads from current site's active theme document
  - Graceful degradation: if no site/theme, shows "No theme set" with link to set one
  - See: agent-os/product/specs/29-color-field/notes.md

Spec 30 — Site Builder (defineSite)
  - defineSite() config primitive — organizes existing collections into site structure
  - References collections by slug for: settings, header, footer, theme, pages
  - Page groups: { slug, label, collection } — slug IS the route prefix
  - Auto-generates vex_sites table with relationship fields (header, footer, theme, settings)
  - Header/footer/theme/settings are COLLECTIONS (not globals) — multiple saved versions, swap active
  - Admin sidebar restructuring: site tree with nested sections, active indicators
  - Purely organizational — does not create new tables beyond vex_sites
  - Users control their own frontend routing (VEX is headless)
  - Optional starter admin components (theme editor etc.) in @vexcms/ui, not a separate package
  - See: agent-os/product/specs/30-site-builder/notes.md
```

### Phase 3 — Pre-Enterprise Polish (ship before charging money)

```
Spec 19 — API Key Management
  - Generate read-only API tokens per project
  - Keys stored hashed in Convex, shown once on creation
  - Used for headless content fetching without full auth session
  - Rate limiting config per key (v2)

Spec 20 — Content Scheduling
  - publishAt timestamp on versioned collections
  - Convex scheduled function polls + auto-publishes
  - "Schedule" button in admin alongside Save Draft / Publish
  - Cancel/reschedule support

Spec 22 — Audit Log (basic MIT version)
  - vex_audit_log table: who, collection, doc, action, diff, timestamp
  - Written on every adminCreate/Update/Delete/Publish mutation
  - Audit log viewer in admin (filter by user/collection/date)
  - Basic version ships MIT; advanced retention/export/compliance is enterprise

Spec XX — Hooks System
  - Collection hooks: beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete
  - Hook context: { data, originalDoc, user, operation, db }
  - Field-level hooks: beforeChange, afterRead
  - Global hooks (same pattern as collections)
  - Deferred to here because hooks are an extension point, not a core feature
  - Nobody evaluates a CMS on hooks — they evaluate on content editing, publishing, and permissions
  - Hooks can be added without breaking changes (additive API)
```

### Phase 4 — Enterprise Features (revenue generation)

```
Spec 21 — Project-Level Environments              ← PRIMARY ENTERPRISE MOAT
  - _environmentId field on all Vex-managed documents
  - vex_environments table (production, staging, development)
  - Environment switcher in admin header
  - "Promote staging → production" atomic mutation
  - Diff view showing changeset between environments
  - Full rollback of content state to any environment snapshot
  - Composes with Spec 07: documents have draft/published status WITHIN an environment
  - Nothing else in the Convex ecosystem does this

Spec 26 — SSO / SAML                              [enterprise, @vexcms/enterprise-sso]
  - SAML/OIDC provider configuration
  - Maps IdP groups to Vex roles
  - Enterprise login blocker — most large companies require this

Spec 27 — Review / Approval Workflows             [enterprise, pairs with Spec 21]
  - "Submit for review" action on staging environment
  - Reviewer role can approve/reject changesets
  - Approval required before promote to production
  - Notification system (email on review events)

Spec 22b — Enterprise Audit                        [enterprise, @vexcms/enterprise-audit]
  - Full audit log with configurable retention policies
  - Export to CSV/JSON
  - Compliance reports (SOC2, HIPAA)
  - Scheduled cleanup of old records

Spec 23 — Localization (i18n)                      [enterprise, @vexcms/enterprise-localization]
  - localized: true per field
  - Locale switcher in admin panel
  - Fallback locale support
  - Per-locale version history
```

### Phase 5 — Ecosystem

```
Spec 24 — Form Builder
  - defineFormCollection() builder
  - Field types: text, email, textarea, select, checkbox
  - Submission storage in Convex
  - Email notifications via Convex actions
  - Frontend embed utilities

Spec 25 — Plugin System
  - Plugin interface: (config) => config
  - Register custom field types
  - Hook into admin panel components
  - Example plugins: SEO, sitemap, redirects

Spec 02 — CI/Publishing
  - semantic-release for npm packages
  - GitHub Actions CI (lint, test, build)
  - Release workflow (publish to npm)
  - Branch protection rules

Phase 5.1 — TanStack Start admin
Phase 5.2 — Storage Adapters (S3, R2, Vercel Blob)
Phase 5.3 — Auth Adapters (Clerk, Auth.js)
Phase 5.4 — create-vexcms CLI (scaffold new projects)
Phase 5.5 — Documentation site
```

---

## Summary Timeline

```
DONE        Specs 00, 01, 05, 06 (partial), 06b, 11, 12, 13, 14 (partial)
            Schema gen, field types, admin CRUD (create/read/update/delete), auth, CLI

PHASE 1     Spec 06b (Create/Delete) → Spec 15 (Media) → Spec 07 (Drafts) → Spec 16 (RBAC)
  MVP       The minimum for a usable CMS. Cannot ship without all four.

PHASE 2     Spec 17 (Lexical) → Spec 10 (Live Preview) → Spec 31 (Typed Queries) → Spec 09b (Custom Components) → Spec 09c (Field Styles & Copy/Paste) → Spec 18 (Teams)
  PRODUCT   Makes Vex competitive. Rich text is the biggest unlock.

PHASE 2.5   Spec 28 (Blocks) → Spec 29 (Color Field) → Spec 30 (Site Builder)
  SITES     Composable page builder and site primitives. The "wow factor" differentiator.

PHASE 3     Spec 19 (API Keys) → Spec 20 (Scheduling) → Spec 22 (Audit Log) → Spec XX (Hooks)
  POLISH    Quality-of-life before enterprise. Hooks land here, not in MVP.

PHASE 4     Spec 21 (Environments) → Spec 26 (SSO) → Spec 27 (Reviews) → Spec 22b (Audit) → Spec 23 (i18n)
  REVENUE   Enterprise packages. Environments is the highest-value feature.

PHASE 5     Spec 24 (Forms) → Spec 25 (Plugins) → Spec 02 (CI) → TanStack, adapters, docs
  ECOSYSTEM Long tail growth.
```

Specs 21 (Environments) and 26 (SSO) are where enterprise monetization lives — those become the `@vexcms/enterprise-*` packages. Everything else stays MIT. Spec 21 is the highest-value feature: it justifies a commercial license, nothing in the Convex ecosystem competes with it, and it maps directly to how engineering teams think about deployment workflows.

---

## Spec Numbering Housekeeping

The current spec numbering has a duplicate: two files numbered `12-*-spec.md` (admin data table and schema generation auth integration). The following numbering should be adopted going forward:

| Number | Spec                               | Status                                 |
| ------ | ---------------------------------- | -------------------------------------- |
| 00     | Monorepo Setup                     | ✅                                     |
| 01     | Testing Infrastructure             | ✅                                     |
| 02     | CI/Publishing                      | Deferred to Phase 5                    |
| 03     | Admin Shell                        | ✅                                     |
| 04     | Auth Adapter                       | ✅                                     |
| 05     | Schema Field System                | ✅                                     |
| 06     | Convex Integration                 | ✅ partial (needs create/delete)       |
| 06b    | Create & Delete Mutations          | ✅                                     |
| 07     | Versioning & Drafts                | Phase 1                                |
| 08     | File Uploads                       | Superseded by Spec 15                  |
| 09     | Custom Admin Components            | Phase 2 (registration system)          |
| 09c    | Field Style Controls & Copy/Paste  | Phase 2 (after 09b)                    |
| 10     | Live Preview                       | Phase 2                                |
| 11     | Testing Strategy                   | ✅                                     |
| 12a    | Admin Data Table                   | ✅                                     |
| 12b    | Schema Generation Auth Integration | ✅                                     |
| 13     | Better Auth Package                | ✅                                     |
| 14     | Collection Edit Form               | ✅ partial                             |
| 15     | Media Collections                  | Phase 1                                |
| 16     | RBAC / Access Permissions          | Phase 1                                |
| 17     | Rich Text (Plate)                  | Phase 2                                |
| 18     | Team Management UI                 | Phase 2                                |
| 19     | API Key Management                 | Phase 3                                |
| 20     | Content Scheduling                 | Phase 3                                |
| 21     | Project-Level Environments         | Phase 4 (enterprise)                   |
| 22     | Audit Log                          | Phase 3 (basic) / Phase 4 (enterprise) |
| 23     | Localization (i18n)                | Phase 4 (enterprise)                   |
| 24     | Form Builder                       | Phase 5                                |
| 25     | Plugin System                      | Phase 5                                |
| 26     | SSO / SAML                         | Phase 4 (enterprise)                   |
| 27     | Review / Approval Workflows        | Phase 4 (enterprise)                   |
| 28     | Blocks System                      | Phase 2.5                              |
| 29     | Color Field                        | Phase 2.5                              |
| 30     | Site Builder (defineSite)          | Phase 2.5                              |
| 31     | Typed Per-Collection Queries       | Phase 2                                |
