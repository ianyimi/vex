# Vex CMS

A type-safe headless CMS built natively on [Convex](https://convex.dev). Vex generates your Convex schema and typed query/mutation API from a single config file, with a self-hosted Next.js admin panel for editing content.

<!-- TODO(WP-6): admin panel screenshot/GIF here -->

**Apache-2.0 Licensed.**

> **Status:** Vex is in `alpha`. APIs may change between `0.x` releases.

## Quick Start

Scaffold a complete Next.js + Convex + Vex project:

```bash
pnpm create vexcms@latest my-site
```

By default this includes a full marketing-site starter — pages, blocks, roadmap and changelog collections, auth, and a seeded read-only admin panel. Pass `--bare` for an empty project with no starter collections, or `--orgs` to enable multi-tenant organizations.

```bash
cd my-site
npx convex dev
```

First run only — this links or creates your Convex deployment and prints the real
`NEXT_PUBLIC_CONVEX_URL`/`NEXT_PUBLIC_CONVEX_SITE_URL`. Paste them into `.env.local`, replacing
the generated `https://placeholder.convex.cloud`/`.convex.site` values; leave `Ctrl-C` for now.

```bash
pnpm dev        # Next.js + convex dev + the vex watcher, together
```

Open `http://localhost:3010` (or your chosen port). Sign up — the first account is automatically
promoted to admin and redirected into `/admin`.

### Manual setup

Adding Vex to an existing Next.js + Convex app instead:

```bash
# Vex packages
pnpm add @vexcms/core@alpha @vexcms/next@alpha @vexcms/react@alpha @vexcms/better-auth@alpha @vexcms/file-storage-convex@alpha better-auth

# Peer dependencies Vex expects your app to already manage
pnpm add convex react react-dom next zod @tanstack/react-query @tanstack/react-form @tanstack/react-table @convex-dev/react-query nuqs lucide-react

# CLI (schema/type generation, dev watcher)
pnpm add -D @vexcms/cli@alpha
```

1. Define collections, blocks, and access rules in `vex.config.ts` (see [Schema & Field System](#schema--field-system) below).
2. Run `vex dev` to generate your Convex schema/types and start `convex dev` in watch mode.
3. Mount the admin panel at `app/admin/[[...slug]]/page.tsx` using `NextAdminPage` from `@vexcms/next/server`.
4. Query your content from the frontend with the generated, typed Convex API.

### Building with LLMs

The docs site serves [llms.txt](https://llmstxt.org) indexes for AI coding agents — point your agent at `/llms.txt` (index), `/llms-full.txt` (complete docs), or `/llms-small.txt` (compact) on the docs site to give it the full Vex API surface while it builds your site.

## Why Vex?

- **Convex-native**: your Vex config generates the Convex schema — no translation layer, no separate ORM.
- **Full type safety**: fields, relationships, access permissions, and the generated document/query types are all type-checked end to end.
- **Real-time by default**: Convex's reactive subscriptions power live updates across the admin panel and your frontend.
- **PayloadCMS-familiar DX**: if you know Payload, the collection/field/access shape will feel familiar — different runtime, similar authoring model.
- **Self-hosted**: you own your data, your Convex deployment, and your admin panel.

## Features

### Schema & Field System

Define content types with a fully typed field system. Vex ships 12 field types:

| Field          | Description                                          |
| -------------- | ----------------------------------------------------- |
| `text`         | Single-line string value                               |
| `number`       | Numeric value                                          |
| `checkbox`     | Boolean toggle                                         |
| `select`       | One or more values from a fixed option list            |
| `date`         | Date/time value                                        |
| `url`          | URL string                                             |
| `relationship` | Reference(s) to documents in another collection        |
| `upload`       | Reference(s) to a media document                       |
| `array`        | Repeatable list of a nested field type                 |
| `group`        | Named set of sub-fields stored as a nested object       |
| `blocks`       | Ordered list of typed content blocks (flexible layout) |
| `color`        | CSS colour string (hex/rgb/hsl/oklch) or theme-token reference |

**Coming soon:** `richtext` (Plate.js), `json`, `email`, `textarea`, `tabs`, and `ui` (non-persisted display/action fields) — see the [roadmap](apps/docs/src/content/docs/roadmap.md).

```typescript
import { defineCollection, text, select, relationship } from "@vexcms/core";

export const posts = defineCollection({
  slug: "posts",
  admin: {
    useAsTitle: "title",
    table: { defaultColumns: ["title", "status"] },
    group: "Content",
  },
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({ label: "Slug", required: true, index: "by_slug" }),
    author: relationship({ collection: { slug: "users" } }),
    status: select({
      label: "Status",
      required: true,
      defaultValue: ["draft"],
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    }),
  },
});
```

`relationship` fields always store `Id<collection>[]` in Convex — `hasMany` is a UI-only hint for whether the admin picker allows one or multiple selections. A `by_<fieldKey>` index is generated automatically for every relationship field.

### Blocks

Reusable content blocks for flexible page layouts, composed with a `blocks` field:

```typescript
import { defineBlock, defineCollection, blocks, text } from "@vexcms/core";

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero Section",
  fields: {
    heading: text({ label: "Heading", required: true }),
    subheading: text({ label: "Subheading" }),
  },
});

export const pages = defineCollection({
  slug: "pages",
  fields: {
    title: text({ required: true }),
    layout: blocks({ label: "Layout", blocks: [heroBlock] }),
  },
});
```

### Globals

Singleton documents for site-wide settings, outside the collection list/pagination model:

```typescript
import { defineGlobal, text, relationship } from "@vexcms/core";

export const siteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: {
    siteName: text({ label: "Site Name", required: true }),
    activeTheme: relationship({ label: "Active Theme", collection: { slug: "themes" } }),
  },
  admin: { group: "Site Builder" },
});
```

### Theming

Themes are content: a `themes` collection of `color()` fields covering the full shadcn token set, an active-theme selector on the `siteSettings` global, and `buildThemeCss` injecting the palette as CSS custom properties — server-rendered for first paint, updated live on save. See the theming guide on the docs site.

### Media & Storage Adapters

Media collections come from a storage adapter, not a plain collection. `@vexcms/file-storage-convex` stores files in Convex file storage and adds the required media fields (`filename`, `alt`, `mimeType`, `size`, `storageId`, `src`, plus dimensions) automatically:

```typescript
import { defineConfig, text } from "@vexcms/core";
import { convexFileStorage, defineMediaCollection } from "@vexcms/file-storage-convex";

const images = defineMediaCollection({
  slug: "images",
  fields: { caption: text() },
});

export default defineConfig({
  storage: { adapters: [convexFileStorage({ mediaCollections: [images] })] },
  collections: [
    /* posts, pages, ... */
  ],
});
```

Reference uploaded media from any collection with the `upload` field:

```typescript
featuredImage: upload({ to: "images", label: "Featured Image" }),
```

### Access Control (RBAC)

Type-safe, role-based permissions per document via `defineAccess`. Write rules as `{ constraints }` builders — they compile **into the Convex query itself** (an indexed range when you use a declared index) instead of reading rows into JS and discarding what fails a check:

```typescript
import { defineAccess, WILDCARD_KEY } from "@vexcms/core";

export const access = defineAccess({
  roles: ["admin", "user"],
  resources: [posts, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    admin: { [WILDCARD_KEY]: true },
    user: {
      posts: {
        // Authors see their own posts — compiled to an indexed range
        // (`by_author` is generated automatically for every relationship field).
        read: {
          constraints: ({ user, q }) =>
            q.withIndex("by_author", (ix) => ix.eq("author", user._id)),
        },
        create: true,
        // Mutations authorize one document — same shape, compiled to a predicate.
        update: {
          constraints: ({ user, q }) => q.filter((f) => f.eq("author", user._id)),
        },
        delete: false,
      },
    },
  },
});
```

Need a check that field comparisons can't express — an array `includes`, a string operation? Add a `filter` callback beside `constraints`; it runs per document after the query narrows. Bare callback rules (`update: ({ user, data }) => …`) remain as the fallback for fully imperative checks.

`anonRole` names the role a caller with **zero** roles resolves to — a genuinely unauthenticated visitor. It is how a public, read-only admin panel works: grant the anon role read permissions plus admin-panel access and nothing else. Check permissions at runtime with `hasPermission` (or better, the one-file wrapper shown in the access-control guide):

```typescript
import { hasPermission } from "@vexcms/core";

hasPermission({ access, user, resource: "posts", action: "update", data: post }); // boolean
hasPermission({ access, user, resource: "posts", action: "delete", data: post, throwOnDenied: true }); // throws on deny
```

### Pagination & Data Tables

The admin panel's collection list view is a paginated, sortable data table backed by Convex's `usePaginatedQuery`. Page size is configurable per collection:

```typescript
export const posts = defineCollection({
  slug: "posts",
  admin: {
    table: {
      defaultPageSize: 10,
      pageSizeOptions: [10, 25, 50, 100],
      defaultColumns: ["title", "status"],
    },
  },
  fields: {
    /* ... */
  },
});
```

### Authentication (Better Auth)

Built-in integration with [Better Auth](https://better-auth.com). `betterAuthAdapter()` extracts and merges Better Auth's user/session/account/verification tables into your Vex collections; `authDbApi()` wires the Convex DB adapter:

```typescript
// vex.config.ts
import { defineConfig } from "@vexcms/core";
import { betterAuthAdapter } from "@vexcms/better-auth";
import { authOptions } from "./auth/options";

export default defineConfig({
  authAdapter: betterAuthAdapter({ config: authOptions }),
  collections: [posts],
});
```

```typescript
// convex/auth/db.ts
import { authDbApi } from "@vexcms/better-auth/convex";
import { internalMutation, internalQuery } from "../_generated/server";
import schema from "../schema";

export const { dbCreate, dbFindOne, dbFindMany, dbCount, dbUpdate, dbUpdateMany, dbDelete, dbDeleteMany } =
  authDbApi({ schema, internalQuery, internalMutation });
```

### CLI & Type Generation

`@vexcms/cli` watches your config and keeps Convex schema, types, and per-collection query/mutation files in sync:

- `vex dev` — generate the Convex schema, start `convex dev`, and watch your config's imports for changes.
- `vex dev --once` — generate and push the schema once, then exit (useful in CI).
- `vex generate` — regenerate `vex.types.ts` and the typed per-collection Convex API files.
- `vex deploy` — generate the schema, run migrations if configured, and deploy to production (replaces `convex deploy`).

### Admin Panel

A self-hosted Next.js admin panel, mounted directly in your app:

```tsx
// app/admin/[[...slug]]/page.tsx
import { NextAdminPage } from "@vexcms/next/server";
import config from "../../../../vex.config";

export default function AdminPage({ params }: { params: Promise<{ path?: string[] }> }) {
  return <NextAdminPage config={config} params={params} />;
}
```

It includes a paginated, searchable data table per collection, Zod-validated edit forms generated from your field config, a media library with an upload dropzone, role-based access control, and sidebar grouping for collection organization.

## Architecture

```
@vexcms/core                 Schema definitions, fields, access control (RBAC), type/query generation — no Convex dep
@vexcms/cli                  CLI: schema generation, type generation, file watching, migrations
@vexcms/react                Shared admin UI components, hooks, and HKT-bound config re-exports
@vexcms/next                 Next.js admin panel entry points (NextAdminPage, NextAdminLayout)
@vexcms/better-auth           Better Auth adapter for Vex (schema extraction + Convex DB adapter)
@vexcms/file-storage-convex  Convex file storage adapter and media collection factory
@vexcms/richtext-plate       Rich text field powered by Plate.js
create-vexcms                Project scaffolding CLI (`pnpm create vexcms`)
```

## Tech Stack

- **Database**: [Convex](https://convex.dev) — real-time serverless database
- **Admin Panel**: [Next.js](https://nextjs.org) (App Router)
- **Authentication**: [Better Auth](https://better-auth.com)
- **Rich Text**: [Plate.js](https://platejs.org) (`@vexcms/richtext-plate`)
- **Form Validation**: [Zod](https://zod.dev) + [TanStack Form](https://tanstack.com/form)
- **Data Table**: [TanStack Table](https://tanstack.com/table)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)

## License

Apache-2.0
