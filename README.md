# Vex CMS

A modern, type-safe headless CMS built natively on [Convex](https://convex.dev). Vex provides PayloadCMS-familiar patterns with improved type inference, real-time reactivity, and zero database configuration.

**MIT Licensed. Free forever.**

## Why Vex?

- **Convex-native**: No translation layer or code generation. Your schema _is_ the database schema.
- **Full type safety**: Field defaults, options, relationships, and hooks are all type-checked at compile time.
- **Real-time by default**: Convex's reactive subscriptions power live updates across the admin panel and frontend — no polling, no webhooks, no rebuild triggers.
- **PayloadCMS-familiar DX**: If you know Payload, you'll feel at home. Same patterns, better types.
- **Self-hosted**: You own your data and your admin panel. No vendor lock-in beyond Convex.

## Features

### Schema & Field System

Define content types with a rich, fully typed field system:

| Field          | Description                                |
| -------------- | ------------------------------------------ |
| `text`         | Single-line text input                     |
| `textarea`     | Multi-line text                            |
| `number`       | Numeric input                              |
| `checkbox`     | Boolean toggle                             |
| `select`       | Dropdown with options                      |
| `date`         | Date/time picker                           |
| `relationship` | Reference to other documents               |
| `array`        | Repeatable field groups                    |
| `group`        | Non-repeating nested fields                |
| `blocks`       | Flexible content with multiple block types |
| `upload`       | File/media reference                       |
| `richtext`     | Rich text editor (Lexical)                 |
| `ui`           | Non-persisted display/action field         |

```typescript
import { defineCollection, text, relationship, blocks } from "@vexcms/core";

export const posts = defineCollection("posts", {
  fields: {
    title: text({ label: "Title", required: true }),
    author: relationship({ to: "users" }),
    content: blocks({ blocks: [heroBlock, textBlock, imageBlock] }),
  },

  versions: {
    drafts: true,
    autosave: { interval: 2000 },
  },

  hooks: {
    beforeCreate: async ({ data, user }) => {
      return { ...data, createdBy: user._id };
    },
  },

  access: {
    read: () => true,
    update: ({ user, doc }) => doc.author === user._id,
  },
});
```

### Globals

Singletons for site-wide settings like headers, footers, and navigation.

```typescript
import { defineGlobal, text, array, upload } from "@vexcms/core";

export const header = defineGlobal("header", {
  fields: {
    logo: upload({ relationTo: "media" }),
    navItems: array({
      fields: {
        label: text({ required: true }),
        url: text({ required: true }),
      },
    }),
  },
});
```

### CLI & Auto-Migration

The Vex CLI watches your config, generates Convex schema, diffs changes, and runs migrations automatically.

- `vex dev` — watch mode with schema generation and auto-migration
- `vex deploy` — production migration and deploy

### Admin Panel

A self-hosted Next.js admin panel with:

- Paginated data tables with full-text search
- Auto-generated edit forms with Zod validation
- Media library with upload dropzone and media picker
- Version history panel with restore support
- Team management and user roles
- Audit log viewer

### CRUD Operations

Full create, read, update, and delete support with server-side validation, cascade delete options, and bulk operations.

### Media Collections & File Uploads

Upload-enabled collections with automatic metadata extraction and per-field MIME type / size restrictions.

```typescript
export const media = defineCollection("media", {
  upload: {
    enabled: true,
    accept: ["image/*", "video/*", "application/pdf"],
    maxSize: 20 * 1024 * 1024,
  },
  fields: {
    alt: text({ label: "Alt Text", required: true }),
  },
});
```

### Draft/Publish Workflow & Version History

Documents support a full draft/publish lifecycle. Edits are saved to a draft snapshot while the published content remains unchanged.

- Draft edits stored in `_draftSnapshot`
- Full version history with restore to any previous version
- Autosave with coalesced version records

### Access Control (RBAC)

Type-safe role-based permissions at both the document and field level.

```typescript
export const permissions = definePermissions<UserRole, VexCollections>()({
  admin: {
    posts: { create: true, read: true, update: true, delete: true },
  },
  editor: {
    posts: {
      create: true,
      read: true,
      update: ({ data, user }) => data.author === user._id,
      delete: false,
    },
  },
  user: {
    posts: { read: true },
  },
});
```

### Rich Text Editor (Lexical)

A rich text field powered by Meta's Lexical editor framework:

- Bold, italic, headings, lists, links, inline images
- Block embed support (integrates with the `blocks()` field)
- JSON serialization stored in Convex
- HTML and RSC rendering utilities (`@vexcms/richtext-lexical/html`, `/rsc`)

### Live Preview

Real-time preview of draft content as you edit, with responsive breakpoints and postMessage-based refresh.

```typescript
// Collection config
livePreview: {
  url: (doc) => `/preview/posts/${doc.slug}`,
  breakpoints: [
    { label: "Mobile", width: 375, height: 667 },
    { label: "Desktop", width: 1280, height: 800 },
  ],
}

// Frontend preview page
import { useRefreshOnSave } from "@vexcms/live-preview-react";

export default function PostPreview({ params }) {
  useRefreshOnSave({ allowedOrigins: ["https://admin.example.com"] });
  const post = useQuery(api.posts.getById, { id: params.id, _vexIncludeDraft: true });
  return <PostContent post={post} />;
}
```

### Custom Admin Components

Build custom field components using familiar hooks. Register them by path in your field config.

```typescript
// ~/components/admin/ColorField.tsx
"use client";
import { useField } from "@vexcms/admin";

export default function ColorField({ path, field }) {
  const { value, setValue, showError, disabled } = useField({ path });
  return (
    <div className="flex gap-2">
      <div className="w-10 h-10 rounded border" style={{ backgroundColor: value }} />
      <input value={value} onChange={(e) => setValue(e.target.value)} disabled={disabled} />
    </div>
  );
}

// Field config
primaryColor: text({
  admin: { components: { Field: "~/components/admin/ColorField" } },
}),
```

Available hooks: `useField`, `useForm`, `useFormFields`, `useFormSubmitted`, `useFormModified`

### Authentication (Better Auth)

Built-in auth integration with [Better Auth](https://better-auth.com). User, session, and account tables are extracted into your Convex schema automatically.

### Team Management

- Invite users by email with role assignment
- Pending invite table with revoke support
- User management table in the admin panel

### API Key Management

- Generate read-only API tokens for headless content fetching
- Keys stored hashed, shown once on creation
- Rate limiting config per key

### Content Scheduling

- Set a `publishAt` timestamp on versioned documents
- Automatic publishing via Convex scheduled functions
- Schedule, cancel, and reschedule from the admin panel

### Audit Log

- Tracks who did what, to which document, and when
- Written on every create, update, delete, and publish operation
- Filterable by user, collection, and date

### Hooks System

Lifecycle hooks for collections and fields:

- **Collection hooks**: `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`
- **Field hooks**: `beforeChange`, `afterRead`
- Hook context includes `data`, `originalDoc`, `user`, `operation`, and `db`

## Architecture

```
@vexcms/core              Schema definitions, field factories, config (no Convex dependency)
@vexcms/cli               CLI with schema generation, auto-migration, and deploy
@vexcms/admin             React admin panel components and hooks (Next.js)
@vexcms/richtext-lexical   Rich text field with Lexical editor
@vexcms/live-preview-react React hooks for live preview
```

## Tech Stack

- **Database**: [Convex](https://convex.dev) — real-time serverless database
- **Admin Panel**: [Next.js](https://nextjs.org) (App Router)
- **Authentication**: [Better Auth](https://better-auth.com)
- **Rich Text**: [Lexical](https://lexical.dev) (Meta's editor framework)
- **Form State**: [Legend State](https://legendapp.com/open-source/state/)
- **Form Validation**: [TanStack Form](https://tanstack.com/form)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)

## Design Principles

1. **Type safety first** — if it compiles, it works.
2. **Convex-native** — leverage real-time reactivity, serverless functions, and type generation.
3. **Familiar patterns** — PayloadCMS users should feel at home.
4. **Minimal footprint** — don't ship what you don't use.
5. **Progressive complexity** — simple things are simple, complex things are possible.

## License

MIT
