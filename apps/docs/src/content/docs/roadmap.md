---
title: Roadmap
description: What's shipped in VexCMS 0.1.0, what ships next, and what's not planned.
---

VexCMS's free roadmap doesn't stop at 0.1.0. What shipped in VexCMS 0.1.0, what ships next,
and what isn't planned. This page is the source of truth for the roadmap; the
[vexcms.dev roadmap](https://vexcms.dev/roadmap) summarises it.

## Shipped in 0.1.0

- ✅ 16 field types — `text`, `number`, `checkbox`, `select`, `date`, `url`, `email`, `textarea`, `json`, `relationship`, `upload`, `array`, `group`, `blocks`, `color`, `richtext` (Plate.js via `@vexcms/richtext-plate`, with inline images from the media library)
- ✅ Versioning & drafts — draft/publish workflow, autosave, version history, restore, and unpublish
- ✅ Convex schema + type codegen
- ✅ Real-time admin panel
- ✅ DataTable with pagination and `totalDocs`
- ✅ Media library
- ✅ RBAC with document-level access, indexed rules (`withIndex` ranges and `where` predicates), and per-call `access.action` / `access.bypass`
- ✅ Access index resolution — a rule's `withIndex` range and `where` predicate apply inside the Convex query itself
- ✅ `anonRole` fallback for unauthenticated callers
- ✅ Globals (`defineGlobal`)
- ✅ Database-driven theming — `themes` collection, active-theme selector, `buildThemeCss` custom-property injection
- ✅ Better Auth integration
- ✅ Convex file storage
- ✅ TypeDoc API reference
- ✅ CLI — `vex dev` / `vex generate` / `vex deploy`
- ✅ `create-vexcms` scaffolder
- ✅ Field-level RBAC permissions — a filter callback may return a field map instead of a boolean
- ✅ Static prerendering, path-based revalidation, `sitemap.xml` / `robots.txt`
- ✅ Exported React test kit — run the admin panel's own component suite against your config
- ✅ Lifecycle hooks — `beforeChange` / `beforeDelete` (inline, may reject a write) and `afterChange` / `afterDelete` (via `convex-helpers` triggers), wired by default in `create-vexcms`'s `base-nextjs` template and both hand-maintained apps
- ✅ Custom `validate()` — async, server-side, database-aware (uniqueness checks and cross-document rules), enforced on every write. Both are covered in the [lifecycle hooks guide](/guides/lifecycle-hooks/)
- ✅ Live preview — the admin panel streams unsaved form state onto your real route, for collections and globals alike. Preview settings declare per collection/global or in one root `admin.livePreview` map; `url` takes a literal path, a `(doc) => string` resolver, or a `{ server }` resolver that reads the database. Origin-allowlisted and gated per request by a session-verified cookie
- ✅ `email`, `textarea`, and `json` fields — `textarea` adds a character counter, `json` is a CodeMirror editor
- ✅ `tabs`, `collapsible`, `row`, and `ui` layout fields — organize sibling fields into tabs, collapsible sections, and side-by-side rows, or drop in a non-persisted display/action component, all legal anywhere a `fields` record is
- ✅ Conditional fields — `admin.condition({ data, siblingData }) => boolean` shows or hides any field (data or layout), enforced identically on the client and the server
- ✅ Input masks — `admin.mask` on `text` / `email` / `number` / `url`, with project-wide defaults at `fields.inputMasks.<type>`
- ✅ Block clipboard — copy/paste blocks across fields, documents, and collections from a localStorage clipboard validated against the target block definition
- ✅ Admin extension points (experimental) — per-field and project-wide component overrides and additive action-menu contributions, documented in the [admin customization guide](/guides/admin-customization/)
- ✅ List views — per-collection search, sort, an AND/OR filter builder with per-field filter inputs, column visibility/order/pinning/resizing, page size, local and shared saved views (`admin.view` / `admin.views`), a peek panel, row and bulk actions, server-prerendered first paint. See the [list views guide](/guides/list-views/)
- ✅ `commitTs()` field — Convex's own commit timestamp, read-only and auto-indexed; the auto-injected `updatedAt` uses it
- ✅ Edit-view overhaul — reorganized header with a ⋯ actions menu, every built-in action a replaceable `admin.components.edit` slot contribution, an unsaved-changes guard, duplicate for documents and blocks, and collection URLs under `/admin/collections/<slug>`. See the [admin customization guide](/guides/admin-customization/)
- ✅ Field input consistency pass — consistent empty, loading, error, and read-only states across inputs, the relationship field included, and the media picker honours the upload field's `accept` filter
- ✅ Responsive pass across the admin panel and marketing site
- ✅ Accessibility statement — the admin panel and marketing template's accessibility commitments and known gaps, at [/accessibility](/accessibility/)
- ✅ Opt-out build-time telemetry — anonymous, aggregate scaffold telemetry collected at `create-vexcms` build time, documented and opt-out in one step. See the [telemetry guide](/guides/telemetry/)

## After 0.1.0

Everything below is free and lands in the Apache-2.0 core. It ships in this order.

1. **Plugin system** — The extension points 0.1.0 ships (admin slots, component overrides, action contributions) become a supported plugin API for collections, fields, hooks, access rules and admin views.
2. **Free features, as demand appears** — No fixed order.
   - **Localization** — Per-field locale values, opted into per collection and per field, with locale-aware drafts.
   - **Scheduled publishing** — Publish and unpublish at a set time, on Convex's scheduler.
   - **TanStack Start adapter** — The admin panel and the caching helpers on a second framework.
   - **Form builder** — Collect input from site visitors, with generated validation and stored submissions.
   - **Outbound webhooks** — Notify other services when content changes.
   - **API keys and team management** — Invite people, assign roles, and issue scoped keys for reading content from outside.
3. **Brownfield adoption** — Add VexCMS to an existing Convex app table by table, without migrating the data it already holds.

How VexCMS compares today: [Compare](/compare/).

## Not planned

Assessed and deliberately excluded, so you do not have to wonder:

- **`imageUrl` field** — use `upload` with the media library, or a `url` field.

Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.
