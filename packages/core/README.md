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

### Client / Server Configuration Split

`defineConfig()` resolves a **client-safe** `VexClientConfig` — nothing in it may reach a
server SDK, an environment variable, or a class instance, since the browser imports this
module directly (`vex.config.ts`). Auth adapters and storage adapters are server-only, so they
layer on separately via `defineServerConfig()`, which resolves a `VexConfig` for every
server-side and Convex reader (`vex.config.server.ts`):

```typescript
// vex.config.server.ts
import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineServerConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { authOptions } from "./auth/options"

import vexConfig from "./vex.config"

export default defineServerConfig({
  config: vexConfig,
  server: {
    auth: { adapter: betterAuthAdapter({ config: authOptions }) },
    storage: { adapters: [convexFileStorage()] },
  },
})
```

`defineConfig()` validates `config.access` against the resolved collections (including
`authCollections`) as soon as it runs, since those are already in hand at client-config eval
time. `defineServerConfig()` validates that every media collection's storage adapter is
registered, and — when `server.auth.adapter` is registered — throws `VexAuthConfigError` when
the client config's `authCollections` (built by the auth package's client-safe builder, e.g.
`betterAuthCollections()` from `@vexcms/better-auth/client`) has drifted from what the live
auth adapter would produce today. Registering the adapter is optional; omitting `server.auth`
skips that check.

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
  resources: [posts, users, media],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: {
      "*": true,
    },
    user: {
      "*": false,
      posts: {
        create: true,
        read: true,
        update: ({ data, user }) => data.author === user._id,
        delete: false,
      },
      // Field-level permissions: a filter callback may return a map instead of a
      // boolean, restricting the check to specific fields. "*" sets the default
      // for every field not named explicitly — and is optional: a map with no
      // "*" is still valid, and any field it omits is denied.
      users: {
        "*": false,
        read: true,
        update: () => ({ name: true }),
      },
    },
  },
})
```

See the [Access Control guide](https://docs.vexcms.dev/guides/access-control/) for the full
permission check shapes, the field-map wildcard rule, and how `hasPermission` resolves a map
against a write, a read, or a quantified check.

### Convex Integration Utilities

Generic document CRUD operations (`create`, `find`, `get`, `remove`, `search`) —
framework-agnostic. Draft-specific actions (`readDrafts`, `saveDraft`, `publish`,
`unpublish`) are typed and recognized by the access-control layer, but versioning
and drafts themselves are not shipped — see `### Versioning & Drafts` above. There
is no preview-snapshot management utility.

### Lifecycle Hooks & Validation

Collections run a shared write pipeline: `hasPermission` → `beforeChange` (may transform the
payload or reject the write by throwing) → the generated Zod schema → each field's own
`validate()` (async, server-only, receives `ctx` — safe for a `ctx.db` uniqueness query
because Convex mutations are transactional) → the write → `afterChange` / `afterDelete`.
`beforeDelete` runs the same way ahead of a hard delete.

```typescript
import { defineCollection, text, beforeChangeHook, textValidator } from "@vexcms/core"
import type { DataModel } from "../convex/_generated/dataModel"

const TABLE_SLUG_POSTS = "posts"

const posts = defineCollection({
  slug: TABLE_SLUG_POSTS,
  labels: { singular: "Post", plural: "Posts" },
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({
      label: "Slug",
      required: true,
      validate: textValidator<typeof TABLE_SLUG_POSTS, DataModel>(
        TABLE_SLUG_POSTS,
        async ({ value, doc, ctx, field }) => {
          const existing = await ctx.db
            .query("posts")
            .withIndex("by_slug", (q) => q.eq("slug", value))
            .first()
          if (existing && existing._id !== doc._id) return `${field.label} must be unique.`
        },
      ),
    }),
  },
  hooks: {
    beforeChange: beforeChangeHook<typeof TABLE_SLUG_POSTS, DataModel>(
      TABLE_SLUG_POSTS,
      ({ doc }) => ({ ...doc, slug: doc.slug || doc.title.toLowerCase().replace(/\s+/g, "-") }),
    ),
  },
})
```

`afterChange` / `afterDelete` are convex-helpers triggers, so they only fire for writes made
through Convex mutations built with `createVexMutations` — never for a Convex dashboard edit,
`npx convex import`, or a raw `_generated/server` mutation. Wrap your app's `mutation` /
`internalMutation` builders once:

```typescript
// convex/triggers.ts
import { createVexMutations } from "@vexcms/core/server"
import { mutation, internalMutation } from "./_generated/server"
import vexConfig from "../vex.config.server"

export const { mutation: wrappedMutation, internalMutation: wrappedInternalMutation } =
  createVexMutations({ config: vexConfig, mutation, internalMutation })
```

then import `mutation/internalMutation` from `./triggers` everywhere a generated
`collectionsApi`/`globalsApi`/`mediaApi` is built, instead of from `./_generated/server`.

`min`/`max` on `text`, `number`, `date`, `array`, `blocks`, `upload`, and `relationship` are
enforced here too — a write through the Local API that violates a declared constraint is
rejected, not just a form. See the [lifecycle hooks guide](https://docs.vexcms.dev) for the
full hook-coverage caveats and BFS trigger-recursion note.

### Live Preview

Ships a dual-transport (`postMessage` + `BroadcastChannel`) overlay: `admin.livePreview.url`
on a collection or global is the public URL its preview should render — a literal path
(`url: "/"`) when the document always previews in one place, or a resolver from the
document, typed to the exact generated document interface for that collection/global.
`admin.livePreview` also accepts `debounceMs`, `defaultOpen`, and `breakpoints` (overriding
the root `livePreview.breakpoints`). The admin panel's edit views render a resizable split
pane (full-screen on mobile) that iframes the resolved URL and streams the form's unsaved
values into it via `<LivePreviewProvider>` / `useLivePreview` / `useLivePreviewQuery` /
`useLivePreviewDocumentQuery`. The embedded panel's breakpoint toggle row scales the
iframe to a simulated device width without distorting it. A floating indicator on the
previewed page itself marks it as a live preview when that page is opened in its own tab.

The panel appends `?vexLivePreview=1` to the resolved URL; the listener attaches only when the
project's own middleware has also verified an admin session and set the `vex-live-preview`
marker cookie (`LIVE_PREVIEW_COOKIE`). See the
[Live Preview guide](https://docs.vexcms.dev/guides/live-preview/) for the security
requirements any project embedding a preview surface must configure.

## Peer Dependencies

- `convex` — Convex backend
- `react` — React 18+
- `@tanstack/react-table` — Table utilities for admin column generation
