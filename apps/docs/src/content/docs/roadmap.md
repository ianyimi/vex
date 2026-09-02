---
title: Roadmap
description: What's shipped, in progress, planned, and being explored for VexCMS v0.1.0-alpha.
---

VexCMS is under active development. Everything ships as `0.1.0-alpha` until the core feature set is stable enough for a v0.1.0 release.

Status key: ✅ Shipped · 🔄 In progress · 📋 Planned · 🔭 Exploring

## Shipped

- ✅ 12 field types — `text`, `number`, `checkbox`, `select`, `date`, `url`, `relationship`, `upload`, `array`, `group`, `blocks`, `color`
- ✅ Convex schema + type codegen
- ✅ Real-time admin panel
- ✅ DataTable with pagination, `totalDocs`, bulk operations
- ✅ Media library
- ✅ RBAC with document-level access, indexed `{ constraints }` rules, and per-call `access.action` / `access.bypass`
- ✅ Access index resolution — `{ constraints }` rules compile to `withIndex` ranges inside Convex queries
- ✅ `anonRole` fallback for unauthenticated callers
- ✅ Globals (`defineGlobal`)
- ✅ Database-driven theming — `themes` collection, active-theme selector, `buildThemeCss` custom-property injection
- ✅ Better Auth integration
- ✅ Convex file storage
- ✅ TypeDoc API reference
- ✅ CLI — `vex dev` / `vex generate`
- ✅ `create-vexcms` scaffolder

## In progress

- 🔄 Versioning & drafts
- 🔄 Live preview

## Planned

- 📋 Form builder
- 📋 Field input consistency pass — relationship field and others get consistent interaction patterns
- 📋 `richtext` field
- 📋 `json` / `email` / `textarea` fields
- 📋 `tabs` / `ui` fields
- 📋 Block group categorization
- 📋 Lifecycle hooks
- 📋 Content scheduling
- 📋 API keys
- 📋 Team management
- 📋 TanStack Start adapter
- 📋 S3 / R2 storage adapters
- 📋 Plugin system
- 📋 React package testing suite

## Exploring

- 🔭 Multi-component workspaces
- 🔭 Analytics adapter — per-document and per-block metrics surfaced directly in the admin panel
