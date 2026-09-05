# @vexcms/core

The foundational package for [VEX CMS](https://github.com/ianyimi/vex) — a headless content management system built for [Convex](https://convex.dev).

`@vexcms/core` provides the configuration API, field type system, schema generation, type generation, and all core utilities that power the VEX CMS ecosystem. It has no direct Convex dependency — Convex is a peer dependency only.

## Quick Start

The easiest way to get started is with the `create-vexcms` CLI:

```bash
pnpm create vexcms@alpha
```

This scaffolds a complete project with all `@vexcms/*` packages, authentication, and an admin panel. See the [create-vexcms README](https://www.npmjs.com/package/create-vexcms) for full setup instructions.

### Manual Installation

```bash
pnpm add @vexcms/core@alpha @vexcms/cli@alpha @vexcms/next@alpha @vexcms/react@alpha @vexcms/better-auth@alpha @vexcms/file-storage-convex@alpha
# Optional — rich text editor package; there is no `richtext` field to attach
# it to yet (see Field Types below and https://docs.vexcms.dev for the roadmap)
pnpm add @vexcms/richtext-plate@alpha
```

## Features

### Configuration API

Define your CMS structure with a type-safe, declarative API:

```typescript
import { defineConfig, defineCollection, text, select } from "@vexcms/core"

const posts = defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  fields: {
    title: text({ label: "Title", required: true }),
    // Long prose is a multiline `text` field. A `richtext` field is on the
    // roadmap and does not exist yet.
    body: text({ label: "Body" }),
    category: select({
      label: "Category",
      options: [
        { label: "Engineering", value: "engineering" },
        { label: "Design", value: "design" },
      ],
      // `select` defaultValue is always an array, even when `hasMany` is false.
      defaultValue: ["engineering"],
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

12 built-in field types with full TypeScript inference:

| Field | Description |
|-------|-------------|
| `text` | String with optional min/max length; multiline for long prose |
| `url` | URL string |
| `number` | Numeric with optional min/max/step |
| `checkbox` | Boolean toggle |
| `select` | Single or multi-value enum with options; `defaultValue` is always an array |
| `date` | Date stored as epoch milliseconds |
| `color` | Colour value, used by the theming system |
| `upload` | Reference to media collection documents; stores an array of media ids |
| `relationship` | Reference to another collection; stores `Id<collection>[]` |
| `group` | Named group of nested fields, stored as an object |
| `array` | Wraps any field type in an array |
| `blocks` | Ordered array of block instances (discriminated union) |

There is no `richtext`, `json`, `email`, `textarea`, `tabs`, `ui` or `imageUrl`
field. Those are roadmap items, not shipped API — long prose is a multiline
`text` field today.

### Blocks System

Define reusable content blocks for flexible page building:

```typescript
import { defineBlock, text } from "@vexcms/core"

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero Section",
  fields: {
    heading: text({ label: "Heading", required: true }),
    body: text({ label: "Body" }),
  },
})
```

### Collections, Globals & Media

- **Collections** — Content types with typed fields, database indexes, search indexes, and admin UI configuration
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

Not shipped. `versions.drafts` parses and is stored on the resolved config, but no
draft/publish workflow is enforced — every read returns the live document. See the
[roadmap](https://docs.vexcms.dev); until it lands, do not model publish state as
a hand-written `status` field, because that field becomes redundant when the
feature arrives.

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

Schema diffing and migration planning helpers. `diffSchema` and `planMigration` are
exported and real, but their bodies are stubs today — `diffSchema` always returns an
empty diff and `planMigration` always returns an empty operation list, regardless of
input. See the [roadmap](https://docs.vexcms.dev); do not rely on these for actual
backfills yet.

```typescript
import { diffSchema, planMigration } from "@vexcms/core"

const diff = diffSchema(oldSchema, newSchema)
const ops = planMigration({ diff, config })
```

### Convex Integration Utilities

Generic document CRUD operations (`create`, `find`, `get`, `remove`, `search`) —
framework-agnostic. Draft-specific actions (`readDrafts`, `saveDraft`, `publish`,
`unpublish`) are typed and recognized by the access-control layer, but versioning
and drafts themselves are not shipped — see `### Versioning & Drafts` above. There
is no preview-snapshot management utility.

### Live Preview

Not shipped. `livePreview: { url }` is accepted on collection/global admin config and
stored on the resolved config, but there is no `LivePreviewPanel` or rendering
integration yet — the field exists only so adding live preview later is
non-breaking. See the [roadmap](https://docs.vexcms.dev).

## Peer Dependencies

- `convex` — Convex backend
- `react` — React 18+
- `@tanstack/react-table` — Table utilities for admin column generation
