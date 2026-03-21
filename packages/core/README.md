# @vexcms/core

The foundational package for [VEX CMS](https://github.com/ianyimi/vex) — a headless content management system built for [Convex](https://convex.dev).

`@vexcms/core` provides the configuration API, field type system, schema generation, type generation, and all core utilities that power the VEX CMS ecosystem. It has no direct Convex dependency — Convex is a peer dependency only.

## Quick Start

The easiest way to get started is with the `create-vexcms` CLI:

```bash
pnpm create vexcms@latest
```

This scaffolds a complete project with all `@vexcms/*` packages, authentication, and an admin panel. See the [create-vexcms README](https://www.npmjs.com/package/create-vexcms) for full setup instructions.

### Manual Installation

```bash
pnpm add @vexcms/core @vexcms/cli @vexcms/admin-next @vexcms/ui @vexcms/richtext @vexcms/better-auth @vexcms/file-storage-convex
```

## Features

### Configuration API

Define your CMS structure with a type-safe, declarative API:

```typescript
import { defineConfig, defineCollection, text, richtext, select } from "@vexcms/core"

const posts = defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  fields: {
    title: text({ label: "Title", required: true }),
    content: richtext({ label: "Content" }),
    status: select({
      label: "Status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      defaultValue: "draft",
    }),
  },
})

export default defineConfig({
  collections: [posts],
  admin: { user: "user" },
  basePath: "/admin",
})
```

### Field Types

13 built-in field types with full TypeScript inference:

| Field | Description |
|-------|-------------|
| `text` | String with optional min/max length |
| `number` | Numeric with optional min/max/step |
| `checkbox` | Boolean toggle |
| `select` | Single or multi-value enum with options |
| `date` | Date stored as epoch milliseconds |
| `imageUrl` | URL string for images |
| `relationship` | Reference to another collection (single or hasMany) |
| `upload` | Reference to media collection documents (single or hasMany) |
| `json` | Arbitrary JSON data |
| `array` | Wraps any field type in an array |
| `richtext` | Plate/Slate JSON editor documents |
| `ui` | Non-persisted custom render components |
| `blocks` | Ordered array of block instances (discriminated union) |

### Blocks System

Define reusable content blocks for flexible page building:

```typescript
import { defineBlock, text, richtext } from "@vexcms/core"

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero Section",
  fields: {
    heading: text({ label: "Heading", required: true }),
    body: richtext({ label: "Body" }),
  },
})
```

### Collections, Globals & Media

- **Collections** — Content types with typed fields, versioning/draft workflow, database indexes, search indexes, and admin UI configuration
- **Globals** — Singleton settings (site config, navigation, etc.) with the same field system
- **Media Collections** — File storage with auto-injected fields (storageId, filename, mimeType, size, url, alt, width, height)

### Schema & Type Generation

Generates Convex schema and TypeScript types from your config:

```typescript
import { generateVexSchema, generateVexTypes } from "@vexcms/core"

const schemaSource = generateVexSchema(config)  // → vex.schema.ts
const typesSource = generateVexTypes(config)     // → vex.types.ts
```

### Versioning & Drafts

Per-collection draft/publish workflow with autosave:

```typescript
defineCollection({
  slug: "posts",
  versions: {
    drafts: true,
    autosave: { interval: 2000 },
    maxPerDoc: 100,
  },
  // ...
})
```

### Access Control (RBAC)

Role-based permissions at the document and field level:

```typescript
import { defineAccess } from "@vexcms/core"

const access = defineAccess({
  roles: ["user", "admin"],
  adminRoles: ["admin"],
  userCollection: users,
  resources: [posts, users, media],
  permissions: {
    admin: {
      posts: true,
      user: true,
      media: true,
    },
    user: {
      posts: {
        create: true,
        read: true,
        update: ({ data, user }) => data.author === user._id,
        delete: false,
      },
      // Field-level permissions
      user: {
        read: { mode: "allow", fields: ["name", "email"] },
        update: { mode: "deny", fields: ["role", "email"] },
      },
    },
  },
})
```

### Auto-Migration

Schema diffing and migration planning for safe schema changes:

```typescript
import { diffSchema, planMigration } from "@vexcms/core"

const diff = diffSchema(oldSchema, newSchema)
const ops = planMigration(config, oldSchema, newSchema)
```

### Live Preview

Per-collection iframe preview with responsive breakpoints and snapshot system.

### Convex Integration Utilities

Generic document CRUD operations, query helpers with draft support, and preview snapshot management — all framework-agnostic.

## Peer Dependencies

- `convex` — Convex backend
- `react` — React 18+
- `@tanstack/react-table` — Table utilities for admin column generation
