---
title: Roadmap
description: Track the progress of the VexCMS rebuild toward v0.1.0 stable.
---

VexCMS is currently in active development on the `rebuild` branch. Everything is `0.1.0-alpha` until the core feature set is stable enough for a real release.

Status key: ✅ Done · 🔄 In progress · 📋 Planned · ❓ TBD

## Core Foundation

Field system, schema generation, React adapter, CLI tooling, docs site.

| Feature | Status |
|---|---|
| Text field — Convex validator + Zod input schema | ✅ |
| HKT framework adapter (`defineFrameworkAdapter`) | ✅ |
| CLI schema generation from `vex.config.ts` | 🔄 |
| CLI watch mode (auto-regenerate on config change) | 🔄 |
| React adapter — `TextInput` + `TextCell` components | 🔄 |
| Starlight docs site + TypeDoc API reference | 🔄 |

## Admin UI

Working admin interface for text fields. Data table list view and document edit form.

| Feature | Status |
|---|---|
| Data table list view (TanStack Table) | 📋 |
| Document edit form | 📋 |
| Next.js page + layout components | 📋 |
| Admin route setup in Next app | 📋 |

## Additional Field Types

| Feature | Status |
|---|---|
| Number field | 📋 |
| Checkbox / boolean field | 📋 |
| Select field | 📋 |
| Textarea field | 📋 |
| Date field | 📋 |

## Auth

Better Auth integration for admin authentication.

| Feature | Status |
|---|---|
| Better Auth adapter | 📋 |
| Login / session management | 📋 |
| First-user setup flow | 📋 |
| RBAC | ❓ |

## Media

| Feature | Status |
|---|---|
| Storage adapter interface | 📋 |
| Media library UI | 📋 |
| Image field type | 📋 |

## Drafts + Publishing

| Feature | Status |
|---|---|
| Draft state on documents | 📋 |
| Publish / unpublish actions | 📋 |
| Scheduled publishing | ❓ |
