---
title: Roadmap
description: What's shipped, in progress, planned, and being explored for VexCMS v0.1.0-alpha.
---

VexCMS is under active development. Everything ships as `0.1.0-alpha` until the core feature set is stable enough for a v0.1.0 release.

Status key: ✅ Shipped · 🔄 In progress · 📋 Planned · ⏳ Future · 🔭 Exploring

## Shipped

- ✅ 12 field types — `text`, `number`, `checkbox`, `select`, `date`, `url`, `relationship`, `upload`, `array`, `group`, `blocks`, `color`
- ✅ Convex schema + type codegen
- ✅ Real-time admin panel
- ✅ DataTable with pagination and `totalDocs`
- ✅ Media library
- ✅ RBAC with document-level access, indexed `{ constraints }` rules, and per-call `access.action` / `access.bypass`
- ✅ Access index resolution — `{ constraints }` rules compile to `withIndex` ranges inside Convex queries
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

## In progress

These are the v0.1.0 launch track, in the order they ship.

- 🔄 Data-table integrity pass — bulk actions and the per-collection `admin.table` options wired end to end
- 🔄 Localization design — the storage model and versioning interaction decided before anyone has data to migrate
- 🔄 Lifecycle hooks — `beforeChange` / `afterChange` / `afterDelete`, plus server-side enforcement of every declarative field constraint
- 🔄 Custom `validate()` — async, server-side, database-aware (uniqueness checks and cross-document rules)
- 🔄 Versioning & drafts
- 🔄 `richtext` field — Plate.js editor via `@vexcms/richtext-plate`
- 🔄 Live preview
- 🔄 Field input consistency pass — relationship field and others get consistent interaction and loading patterns
- 🔄 Conditional fields — `admin.condition` to show or hide a field based on sibling values
- 🔄 Edit-view improvements — unsaved-changes guard, duplicate document, duplicate block
- 🔄 List-view improvements — per-collection search, sorting, column visibility, page size, saved views
- 🔄 Responsive pass across the admin panel, marketing template, and docs

## Planned

- 📋 `json` / `email` / `textarea` fields
- 📋 Form builder
- 📋 Block group categorization
- 📋 Content scheduling
- 📋 API keys
- 📋 Team management
- 📋 TanStack Start adapter
- 📋 S3 / R2 storage adapters
- 📋 Concurrent-edit conflict resolution — per-field conflict affordance and optimistic-concurrency guard

## Future

Committed, but not yet scheduled — distinct from `Exploring`, which is still open research. These are the items the site's roadmap block marks `future`.

- ⏳ Plugin system — custom field types
- ⏳ Localization — field variants and locale-aware versioning, on top of the storage shape reserved during the v0.1.0 track
- ⏳ Auto-migration — schema diffing and field backfill on deploy

## Exploring

- 🔭 Multi-component workspaces
- 🔭 Analytics adapter — per-document and per-block metrics surfaced directly in the admin panel

## Not planned

Assessed and deliberately excluded, so you do not have to wonder:

- **`tabs` and `ui` fields.** Both change core invariants rather than adding a leaf field. `ui` is non-persisted, so it has to be skipped by schema generation, form validation, *and* column generation; `tabs` hoists its child fields into the parent. Use `group` for nested structure. If you need a visual grouping affordance, open an issue describing the use case — the current answer is that the cost lands in the framework's core rather than in a field.
- **`imageUrl` field.** Use `upload` with the media library, or a `url` field.
