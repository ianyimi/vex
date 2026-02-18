# Vex CMS

A modern, type-safe headless CMS built natively on [Convex](https://convex.dev). Vex provides PayloadCMS-familiar patterns with improved type inference, real-time reactivity, and zero database configuration.

## Why Vex?

- **Convex-native**: No translation layer or code generation. Your schema _is_ the database schema.
- **Full type safety**: Field defaults, options, relationships, and hooks are all type-checked at compile time.
- **Real-time by default**: Convex's reactive subscriptions power live updates across admin panel and frontend.
- **PayloadCMS-familiar DX**: If you know Payload, you'll feel at home. Same patterns, better types.
- **Framework-agnostic frontend**: Initially supports Next.js admin panel, with TanStack Start planned.

## Architecture

Vex is structured as a set of packages that work together:

```
@vex/core          - Schema definitions, field factories, config
@vex/convex        - Convex handlers, schema generation, access control
@vex/admin         - React admin panel components and hooks
@vex/client        - Client utilities (upload, etc.)
@vex/live-preview  - Framework-agnostic live preview utilities
@vex/live-preview-react - React hooks for live preview
```

## Core Concepts

### Collections

Collections define your content types. Each collection has fields, hooks, access control, and optional features like versioning and uploads.

```typescript
import { defineCollection, text, relationship, blocks } from "@vex/core";

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
import { defineGlobal, text, array } from "@vex/core";

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

### Field Types

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
| `ui`           | Non-persisted display/action field         |

## Key Features

### Draft/Publish Workflow

Documents support a draft/publish workflow. Edits are saved to a draft snapshot while the published content remains unchanged.

```typescript
// Collection config
versions: {
  drafts: true,
  autosave: { interval: 2000 },
  maxPerDoc: 100,
}
```

- Draft edits stored in `_draftSnapshot` field
- Published content in main document fields
- Full version history in `vex_versions` table
- Restore to any previous version

### File Uploads

Upload-enabled collections store files with automatic metadata extraction.

```typescript
// Media collection
export const media = defineCollection('media', {
  upload: {
    enabled: true,
    accept: ['image/*', 'video/*', 'application/pdf'],
    maxSize: 20 * 1024 * 1024,
  },
  fields: {
    alt: text({ label: 'Alt Text', required: true }),
  },
});

// Using in another collection
featuredImage: upload({
  relationTo: 'media',
  accept: ['image/*'],
}),
```

### Custom Admin Components

Build custom field components using familiar hooks.

```typescript
// ~/components/admin/ColorField.tsx
'use client';

import { useField } from '@vex/admin';
import { TextInput } from '@vex/admin/inputs';

export default function ColorField({ path, field }) {
  const { value, setValue, showError, disabled } = useField({ path });

  return (
    <div className="flex gap-2">
      <div
        className="w-10 h-10 rounded border"
        style={{ backgroundColor: value }}
      />
      <TextInput value={value} onChange={setValue} disabled={disabled} />
    </div>
  );
}

// Field config
primaryColor: text({
  admin: {
    components: {
      Field: '~/components/admin/ColorField',
    },
  },
}),
```

Available hooks:

- `useField` - Read/write field values
- `useForm` - Form state and submission
- `useFormFields` - Select specific fields (performance)
- `useFormSubmitted`, `useFormModified`, etc.

### Live Preview

Real-time preview of draft content as you edit.

```typescript
// Collection config
livePreview: {
  url: (doc) => `/preview/posts/${doc.slug}`,
  breakpoints: [
    { label: 'Mobile', width: 375, height: 667 },
    { label: 'Desktop', width: 1280, height: 800 },
  ],
}

// Frontend preview page
import { useRefreshOnSave } from '@vex/live-preview-react';

export default function PostPreview({ params }) {
  useRefreshOnSave({ allowedOrigins: ['https://admin.example.com'] });

  // Convex query automatically refetches on refresh
  const post = useQuery(api.posts.getById, {
    id: params.id,
    _vexIncludeDraft: true
  });

  return <PostContent post={post} />;
}
```

### Access Control (RBAC)

Type-safe role-based permissions with full LSP support.

```typescript
// permissions.ts
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

## Implementation Specs

Detailed implementation specifications for each feature:

| Spec                                                                 | Description                                           | Dependencies                         |
| -------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------ |
| [schema-field-system-spec.md](./schema-field-system-spec.md)         | Field types, validators, collection/global config     | None (foundation)                    |
| [convex-integration-spec.md](./convex-integration-spec.md)           | Admin handlers, RBAC, hooks execution                 | Schema spec                          |
| [versioning-drafts-spec.md](./versioning-drafts-spec.md)             | Draft workflow, version history, autosave             | Schema + Convex specs                |
| [file-uploads-spec.md](./file-uploads-spec.md)                       | Upload collections, media library, storage adapters   | Schema + Convex specs                |
| [custom-admin-components-spec.md](./custom-admin-components-spec.md) | Hooks API, component registration, UI fields          | Schema spec                          |
| [live-preview-spec.md](./live-preview-spec.md)                       | Preview iframe, postMessage protocol, refresh on save | Versioning + Custom Components specs |

See [roadmap.md](./roadmap.md) for the full implementation plan and priority order.

## Tech Stack

- **Database**: [Convex](https://convex.dev) - Real-time serverless database
- **Admin Panel**: [Next.js](https://nextjs.org) (App Router) - Initially, TanStack Start later
- **Authentication**: [Better Auth](https://better-auth.com) - Modern auth library
- **Form State**: [Legend State](https://legendapp.com/open-source/state/) - Fine-grained reactivity
- **Form Validation**: [TanStack Form](https://tanstack.com/form) - Type-safe form handling
- **UI Components**: [shadcn/ui](https://ui.shadcn.com) - Tailwind CSS components

## Design Principles

1. **Type safety first** - No runtime surprises. If it compiles, it works.
2. **Convex-native** - Leverage Convex's strengths (real-time, serverless, type generation).
3. **Familiar patterns** - PayloadCMS users should feel at home.
4. **Minimal footprint** - Don't ship what you don't use.
5. **Progressive complexity** - Simple things are simple, complex things are possible.

## What Vex Is Not

- **Not a database adapter** - Convex only, by design
- **Not a GraphQL API** - Convex queries/mutations are sufficient
- **Not a deployment platform** - You deploy your own Next.js + Convex app

## Project Status

Vex is currently in the design and specification phase. See [roadmap.md](./roadmap.md) for implementation progress.

## License

TBD
