---
title: Building a Framework Adapter
description: How to implement a VexCMS framework adapter for React, Solid, Vue, or any other UI framework.
---

VexCMS separates its data model and admin logic from the UI layer via a framework adapter system. The React package (`@vexcms/react`) is the reference implementation; this guide explains how the system works so you can build adapters for other frameworks.

> **Status:** Only the React adapter exists today. This guide reflects what is implemented and is written to help React adapter consumers understand the architecture, and to serve as a starting point for future framework adapter authors.

---

## How the adapter system works

VexCMS uses a **Higher-Kinded Type (HKT)** pattern to describe framework components in a generic, type-safe way. The core idea:

1. Each field type (`text`, `number`, etc.) defines `InputComponentProps<TField>` and `CellComponentProps<TField>` — the props each component must accept.
2. Your framework defines an HKT that maps a props type to your framework's component type.
3. `defineFrameworkAdapter` validates that you have implemented all required components with the right prop types.

```ts
// The abstract interface your HKT must extend
interface ComponentHKT {
  readonly _props: unknown;
  readonly _extra: Record<string, unknown>;
  readonly component: unknown;
}
```

---

## Step 1 — Define your HKT

Create an interface that extends `ComponentHKT` and resolves `component` to your framework's component constructor type.

**React:**
```ts
import { defineFrameworkAdapter, ComponentHKT } from "@vexcms/core";
import { ComponentType } from "react";

interface ReactHKT extends ComponentHKT {
  component: ComponentType<this["_props"]>;
}
```

`this["_props"]` is a TypeScript polymorphic `this` type — it lets the HKT capture the concrete props type at the call site. When `defineFrameworkAdapter<ReactHKT>` resolves a slot for `InputComponentProps<TextField>`, it produces `ComponentType<InputComponentProps<TextField>>`.

---

## Step 2 — Implement field input components

Each field type needs an **input component** that renders in the document edit form.

The props interface your component must accept:

```ts
interface InputComponentProps<TField extends AdminField = AdminField> {
  /** The field key name (e.g., "title") */
  name: string;
  /** The resolved field definition */
  fieldDef: TField;
  /** Whether the field is read-only from config or permissions */
  readOnly: boolean;
}
```

**React — using `createFieldInput`:**

`createFieldInput` is a React-specific factory that handles all TanStack Form wiring. Pass a render function that receives `InputComponentProps<TField> & { field: TypedFieldApi<TValue> }`:

```tsx
import { createFieldInput } from "@vexcms/react";
import type { TextField } from "@vexcms/core";

export const TextFieldInput = createFieldInput<string, TextField>(
  ({ name, fieldDef, readOnly, field }) => (
    <div>
      <label htmlFor={name}>{fieldDef.label || name}</label>
      <input
        id={name}
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={fieldDef.admin.placeholder}
        readOnly={readOnly}
      />
      {field.state.meta.errors[0] && (
        <p>{field.state.meta.errors[0]}</p>
      )}
    </div>
  ),
);
```

The `field` parameter is a `TypedFieldApi<TValue>` — a TanStack Form `FieldApi` narrowed to the value type. `field.state.value`, `field.handleChange`, `field.handleBlur`, and `field.state.meta.errors` are all you need for standard form inputs.

**For non-React frameworks:** You will need to build your own form-wiring equivalent. The contract is the same: render a UI element that reads and writes a value identified by `name` within a form.

---

## Step 3 — Implement cell components

Each field type also needs a **cell component** that renders in the data table list view.

The props interface:

```ts
interface CellComponentProps<TField extends AdminField = AdminField> {
  /** The raw value from the document (may be null or undefined) */
  value: TField["defaultValue"];
  /** The full document row */
  row: Record<string, unknown>;
  /** The resolved field definition for this column */
  fieldDef: TField;
}
```

**React example:**

```tsx
import type { CellComponentProps, TextField } from "@vexcms/core";

export function TextFieldCell(props: CellComponentProps<TextField>) {
  if (!props.value) return <span>—</span>;
  if (props.value.length > 80) {
    return <span title={props.value}>{props.value.slice(0, 77)}...</span>;
  }
  return <span>{props.value}</span>;
}
```

---

## Step 4 — Implement admin view components

Your adapter must supply three view components. These are the high-level content areas rendered inside the layout shell:

| View | When rendered | Props |
|---|---|---|
| `dashboard` | `/admin` (root) | `DashboardProps` — receives the full `VexConfig` |
| `collectionListView` | `/admin/:collection` | `CollectionListViewProps` — collection config + optional preloaded docs |
| `collectionEditView` | `/admin/:collection/:id` or `/admin/:collection/new` | `CollectionEditViewProps` — collection config + optional doc ID and preloaded doc |

**Types:**

```ts
interface DashboardProps {
  config: VexConfig;
}

interface CollectionListViewProps {
  collection: CollectionConfig;
  initialData?: VexDocument[];
}

interface CollectionEditViewProps {
  collection: CollectionConfig;
  documentId?: string;
  initialData?: VexDocument | null;
}
```

The React implementations (`DashboardView`, `CollectionListView`, `CollectionEditView`) in `@vexcms/react` use `vexConvexApi` with TanStack Query for live data subscriptions and SSR hydration. Your views can use the same approach or fetch data differently.

---

## Step 5 — Register the adapter

Call `defineFrameworkAdapter<YourHKT>()` with all components. TypeScript enforces completeness: missing a field type or view causes a type error at the call site.

```ts
import { defineFrameworkAdapter } from "@vexcms/core";

export const myAdapter = defineFrameworkAdapter<MyFrameworkHKT>({
  name: "my-framework",
  version: "0.1.0",
  fields: {
    // One entry per AdminField union member
    text: {
      input: MyTextFieldInput,  // must accept InputComponentProps<TextField>
      cell: MyTextFieldCell,    // must accept CellComponentProps<TextField>
    },
  },
  views: {
    dashboard: MyDashboardView,
    collectionListView: MyCollectionListView,
    collectionEditView: MyCollectionEditView,
  },
});
```

`defineFrameworkAdapter` is a zero-runtime identity function — it returns the adapter object unchanged. All enforcement is at the TypeScript level.

---

## Step 6 — Implement the layout shell

The layout shell wraps all admin views with navigation, sidebar, and providers. The React adapter provides `AdminLayout` from `@vexcms/react`.

**`AdminLayout` props:**

```ts
interface AdminLayoutProps {
  /** The full resolved VexCMS config — forwarded to the sidebar. */
  config: VexConfig;
  /** The slug of the active collection for sidebar highlighting. */
  activeSlug?: string;
  /** The active view content. */
  children: ReactNode;
  /**
   * Optional framework component overrides.
   * Pass Link and Image for client-side navigation and optimised images.
   */
  components?: {
    Link?: ComponentType<{ href: string; [key: string]: unknown }>;
    Image?: ComponentType<{ src: string; alt: string; [key: string]: unknown }>;
  };
}
```

**Framework components — the `VexLink` / `VexImage` pattern:**

The admin panel contains internal navigation links. Rather than hardcoding `<a>` tags (which would bypass client-side routing), the package reads `Link` and `Image` from a React context called `FrameworkComponentsContext`.

`VexLink` is the component that reads this context:

```tsx
// Renders NextLink, RouterLink, etc. — falls back to <a> if nothing is configured
<VexLink href="/admin/posts">Posts</VexLink>
```

When building a framework adapter, inject your router's link component via `AdminLayout`'s `components` prop. `AdminLayout` puts it into context; `VexLink` and `VexImage` everywhere in the tree pick it up automatically.

```tsx
import { Link as SolidLink } from "@solidjs/router";
// wrap to normalise href → to if needed
const RouterLink = ({ href, ...rest }) => <SolidLink to={href} {...rest} />;

<AdminLayout components={{ Link: RouterLink }} config={config}>
  {children}
</AdminLayout>
```

---

## Step 7 — Implement the framework page component

The page component handles routing within the `/admin` area, fetches initial data server-side (if your framework supports SSR), and renders the correct view. The Next.js version is `NextAdminPage`.

**Route mapping:**

| URL | View |
|---|---|
| `/admin` | `DashboardView` |
| `/admin/:collectionSlug` | `CollectionListView` |
| `/admin/:collectionSlug/new` | `CollectionEditView` (empty) |
| `/admin/:collectionSlug/:documentId` | `CollectionEditView` (editing) |

**Next.js implementation pattern:**

```tsx
// app/admin/[[...slug]]/page.tsx
import { fetchQuery } from "convex/nextjs";
import { vexConvexApi } from "@vexcms/core";
import { DashboardView, CollectionListView, CollectionEditView } from "@vexcms/react";

export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await props.params;
  const [collectionSlug, documentId] = slug;

  if (!collectionSlug) return <DashboardView config={props.config} />;

  const collection = props.config.collections.find(c => c.slug === collectionSlug);
  if (!collection) return <p>Collection not found.</p>;

  if (documentId) {
    const initialData = await fetchQuery(vexConvexApi.get, {
      collection: collectionSlug,
      id: documentId,
    });
    return <CollectionEditView collection={collection} documentId={documentId} initialData={initialData} />;
  }

  const initialData = await fetchQuery(vexConvexApi.list, { collection: collectionSlug });
  return <CollectionListView collection={collection} initialData={initialData} />;
}
```

The `initialData` pattern works because `CollectionListView` and `CollectionEditView` pass it to TanStack Query as `initialData`, so the list renders immediately without a loading state on first load. Subsequent navigations use the live Convex subscription.

**The `[[...slug]]` catch-all:** The optional catch-all route param is named `slug` (not `vex`, not `collection`) — this matches Next.js convention. The directory is `app/admin/[[...slug]]/page.tsx`.

---

## Step 8 — Implement the framework layout component

The layout component wraps the page component and stays mounted across navigations. For Next.js, this is `NextAdminLayout`.

```tsx
// app/admin/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import NextLink from "next/link";
import NextImage from "next/image";
import { AdminLayout } from "@vexcms/react";

export function NextAdminLayout(props: { config: VexConfig; children: ReactNode }) {
  const pathname = usePathname();
  // Derive active collection slug from pathname for sidebar highlighting
  const segments = pathname.split("/").filter(Boolean);
  const activeSlug = segments[1]; // "posts" from "/admin/posts"

  return (
    <AdminLayout
      config={props.config}
      activeSlug={activeSlug}
      components={{ Link: NextLink, Image: NextImage }}
    >
      {props.children}
    </AdminLayout>
  );
}
```

**Why `usePathname` instead of route params:** Next.js layouts don't receive the child route's params — only the page component does. Parsing `pathname` is the canonical way to know which collection is active from the layout.

**Sub-path exports for server/client split:** If your adapter package exports both async server components and `"use client"` components, you must use sub-path exports (`./server`, `./client`) with separate tsup entry points. A shared entry with a global `"use client"` banner would incorrectly mark server components as client components. The `@vexcms/next` package uses this pattern:

```json
{
  "exports": {
    "./server": { "default": "./dist/server.js" },
    "./client": { "default": "./dist/client.js" }
  }
}
```

---

## Wiring it into an app

Here is the minimal setup for the Next.js adapter:

**`vex.config.ts`** (project root):
```ts
import { defineConfig, defineCollection } from "@vexcms/core";
import { text } from "@vexcms/core/fields";

export default defineConfig({
  collections: [
    defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        slug: text({ required: true, index: "by_slug" }),
      },
    }),
  ],
});
```

**`app/admin/layout.tsx`**:
```tsx
import { NextAdminLayout } from "@vexcms/next/client";
import config from "../../../vex.config";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <NextAdminLayout config={config}>{children}</NextAdminLayout>;
}
```

**`app/admin/[[...slug]]/page.tsx`**:
```tsx
import { NextAdminPage } from "@vexcms/next/server";
import config from "../../../../vex.config";

export default function AdminPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  return <NextAdminPage config={config} params={params} />;
}
```

**`convex/vex/collections.ts`** (copy from the VexCMS template):
The `list`, `get`, `create`, `update`, and `remove` functions must exist at `vex.collections.*` — that is where `vexConvexApi` points. Copy the template from `apps/www/convex/vex/collections.ts`.

---

## The Convex CRUD functions

`vexConvexApi` in `@vexcms/core` is a set of typed `anyApi` references that point to functions in your project's `convex/vex/collections.ts`. All view components call through this API:

| Function | Kind | Args | Returns |
|---|---|---|---|
| `list` | query | `{ collection: string; limit?: number }` | `VexDocument[]` |
| `get` | query | `{ collection: string; id: string }` | `VexDocument \| null` |
| `create` | mutation | `{ collection: string; data: Record<string, unknown> }` | `string` (new ID) |
| `update` | mutation | `{ collection: string; id: string; data: Record<string, unknown> }` | `void` |
| `remove` | mutation | `{ collection: string; id: string }` | `void` |

The collection slug in `vex.config.ts` must match the Convex table name in your schema. VexCMS enforces this convention rather than maintaining a separate mapping.

---

## What's not implemented yet

The following are planned but not yet built:

- **Data table** — `CollectionListView` shows a document count but not a real table. TanStack Table with column definitions derived from field config is planned.
- **Form submission** — `CollectionEditView` renders the form but the Save button is a no-op. Create/update mutations will be wired in a future spec.
- **Additional field types** — only `text` is implemented. Number, checkbox, select, textarea, and date are planned.
- **Auth** — no authentication layer yet. The admin panel is currently unprotected.
- **Media** — no media library or image field type yet.
