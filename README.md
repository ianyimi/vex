# Vex CMS

A modern, type-safe headless CMS built natively on [Convex](https://convex.dev). Vex provides PayloadCMS-familiar patterns with improved type inference, real-time reactivity, and zero database configuration.

**MIT Licensed. Free forever.**

## Quick Start

```bash
pnpm create vexcms@latest
```

This scaffolds a complete Next.js + VEX CMS project with authentication, admin panel, and pre-built collections for a marketing site. Pass `--bare` for an empty project.

## Why Vex?

- **Convex-native**: Your VEX config generates the Convex schema. No translation layer.
- **Full type safety**: Fields, relationships, access permissions, and generated types are all type-checked.
- **Real-time by default**: Convex's reactive subscriptions power live updates across the admin panel and frontend.
- **PayloadCMS-familiar DX**: If you know Payload, you'll feel at home. Same patterns, better types.
- **Self-hosted**: You own your data and admin panel. No vendor lock-in beyond Convex.

## Features

### Schema & Field System

Define content types with a rich, fully typed field system:

| Field          | Description                                |
| -------------- | ------------------------------------------ |
| `text`         | Single-line text input                     |
| `number`       | Numeric input with min/max                 |
| `checkbox`     | Boolean toggle                             |
| `select`       | Dropdown with options (single or multi)    |
| `date`         | Date/time as epoch number                  |
| `imageUrl`     | URL string for images                      |
| `relationship` | Reference to other documents               |
| `upload`       | File/media reference                       |
| `array`        | Repeatable typed field                     |
| `blocks`       | Flexible content with multiple block types |
| `richtext`     | Rich text editor (Plate.js)                |
| `json`         | Arbitrary JSON data                        |
| `ui`           | Non-persisted display/action field         |

```typescript
import { defineCollection, text, relationship, blocks, richtext, select } from "@vexcms/core";

export const posts = defineCollection({
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status"],
    group: "Content",
  },
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({ label: "Slug", required: true, index: "by_slug" }),
    author: relationship({ to: "users" }),
    status: select({
      label: "Status",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    }),
    content: richtext({ label: "Content", mediaCollection: "media" }),
  },
  versions: {
    drafts: true,
    autosave: true,
  },
});
```

### Blocks

Reusable content blocks for flexible page layouts:

```typescript
import { defineBlock, text } from "@vexcms/core";

const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero Section",
  fields: {
    heading: text({ label: "Heading", required: true }),
    subheading: text({ label: "Subheading" }),
  },
});
```

### Media Collections

Upload-enabled collections with pluggable storage adapters and automatic metadata extraction:

```typescript
import { defineMediaCollection } from "@vexcms/core";

export const media = defineMediaCollection({
  slug: "media",
  admin: { useAsTitle: "filename" },
});
```

### Draft/Publish Workflow & Version History

Versioned collections support a full draft/publish lifecycle:

- Documents start as drafts with version tracking
- Save drafts without publishing — edits are stored in `vex_versions`
- Publish promotes the current draft to the main document
- Full version history with restore to any previous version
- Autosave with coalesced version records
- Reset button to discard pending changes

### Access Control (RBAC)

Type-safe role-based permissions at the document and field level using `defineAccess`:

```typescript
import { defineAccess } from "@vexcms/core";

export const access = defineAccess({
  roles: [USER_ROLES.user, USER_ROLES.admin],
  adminRoles: [USER_ROLES.admin],
  userCollection: users,
  resources: [posts, users, media],
  permissions: {
    admin: {
      posts: true,       // Full access to all actions
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
      user: {
        read: ({ data, user }) => data._id === user._id,
        update: ({ data, user }) => data._id === user._id,
      },
    },
  },
});
```

Field-level permissions using `{ mode, fields }`:

```typescript
posts: {
  read: { mode: "allow", fields: ["title", "slug", "content"] },  // Only these fields visible
  update: { mode: "deny", fields: ["author", "createdAt"] },       // These fields read-only
}
```

### Live Preview

Real-time preview of draft content as you edit, with responsive breakpoints:

```typescript
// Collection config
export const pages = defineCollection({
  slug: "pages",
  admin: {
    livePreview: {
      url: (doc) => `/preview/${doc.slug}`,
    },
  },
  // ...
});

// Frontend preview page
import { useVexPreview } from "@vexcms/ui";

export default function PreviewPage() {
  const page = useQuery(api.pages.getBySlug, { slug, _vexDrafts: "snapshot" });
  useVexPreview({ data: page });
  return <PageContent page={page} />;
}
```

### Custom Admin Components

Build custom field and cell components. Pass the component directly in your field config:

```typescript
import ColorField from "~/components/admin/ColorField";
import ColorCell from "~/components/admin/ColorCell";

primaryColor: text({
  label: "Primary Color",
  admin: {
    components: {
      Field: ColorField,
      Cell: ColorCell,
    },
  },
}),
```

### CLI & Auto-Migration

The Vex CLI watches your config, generates Convex schema/types/queries, and runs migrations:

- `vex dev` — watch mode with schema generation, type generation, query generation, and auto-migration
- `vex dev --once` — one-shot generation (no watcher)

### Admin Panel

A self-hosted Next.js admin panel with:

- Paginated data tables with full-text search
- Auto-generated edit forms with Zod validation
- Media library with upload dropzone and media picker
- Version history panel with restore support
- Rich text editing with Plate.js
- Live preview with responsive breakpoints
- Role-based access control with field-level permissions
- User impersonation for testing permissions
- Onboarding tour for first-time users
- Sidebar grouping for collection organization

### Authentication (Better Auth)

Built-in auth integration with [Better Auth](https://better-auth.com). User, session, and account tables are extracted into your Convex schema automatically via `vexBetterAuth()`.

```typescript
import { vexBetterAuth } from "@vexcms/better-auth";

export const auth = vexBetterAuth({ config: betterAuthOptions });
```

### Draft-Aware Queries

Use `createVexQuery` to build queries that handle draft/published content automatically:

```typescript
// convex/vex/helpers.ts
import { createVexQuery } from "@vexcms/core";
import { query } from "./_generated/server";

export const vexQuery = createVexQuery(query);

// convex/pages.ts
import { vexQuery } from "./vex/helpers";
import { getPreviewSnapshot } from "@vexcms/core";

export const getBySlug = vexQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("pages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!page) return null;

    // ctx.drafts is automatically set based on the _vexDrafts arg
    if (ctx.drafts === false && page.vex_status !== "published") return null;
    if (ctx.drafts === "snapshot") {
      const snapshot = await getPreviewSnapshot({ ctx, collection: "pages", documentId: page._id });
      if (snapshot) return { ...page, ...snapshot };
    }
    return page;
  },
});
```

## Architecture

```
@vexcms/core                Schema definitions, fields, access control, type/query generation (no Convex dep)
@vexcms/cli                 CLI with schema generation, auto-migration, file watching
@vexcms/admin-next          React admin panel components and hooks (Next.js)
@vexcms/ui                  Shared UI components (shadcn/ui based)
@vexcms/richtext            Rich text field with Plate.js editor
@vexcms/better-auth         Better Auth adapter for VEX (schema extraction)
@vexcms/file-storage-convex Convex file storage adapter
create-vexcms               Project scaffolding CLI
```

## Tech Stack

- **Database**: [Convex](https://convex.dev) — real-time serverless database
- **Admin Panel**: [Next.js](https://nextjs.org) (App Router)
- **Authentication**: [Better Auth](https://better-auth.com)
- **Rich Text**: [Plate.js](https://platejs.org)
- **Form Validation**: [Zod](https://zod.dev) + [TanStack Form](https://tanstack.com/form)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **Onboarding**: [driver.js](https://driverjs.com)

## License

MIT
