---
title: Building a Framework Adapter
description: How to implement a VexCMS framework adapter for React, Solid, Vue, or any other UI framework.
---

VexCMS separates its data model and admin logic from the UI layer via a framework adapter system. The React package (`@vexcms/react`) is the reference implementation; this guide explains how the system works so you can build adapters for other frameworks.

> **Status:** Only the React adapter exists today. This guide reflects what is implemented and is written to help React adapter consumers understand the architecture, and to serve as a starting point for future framework adapter authors.

---

## How the adapter system works

VexCMS uses a **Higher-Kinded Type (HKT)** pattern to describe framework components in a generic, type-safe way. The core idea:

1. Each field type (`text`, `number`, etc.) defines `FieldComponentProps<TField>` and `CellComponentProps<TField>` — the props each component must accept.
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

`this["_props"]` is a TypeScript polymorphic `this` type — it lets the HKT capture the concrete props type at the call site. When `defineFrameworkAdapter<ReactHKT>` resolves a slot for `FieldComponentProps<TextField>`, it produces `ComponentType<FieldComponentProps<TextField>>`.

---

## Step 2 — Implement field components

Each field type needs a **field component** that renders in the document edit form.

The props interface your component must accept:

```ts
interface FieldComponentProps<TField extends AdminField = AdminField> {
  /** The field key name (e.g., "title") */
  name: string;
  /** The resolved field definition */
  fieldDef: TField;
  /** Whether the field is read-only from config or permissions */
  readOnly: boolean;
  /** The config for the collection this field is attached to */
  collection: CollectionConfig | GlobalConfig;
  /** Renders the previous stage of the `Field` override chain */
  renderDefault?: ComponentType<FieldComponentProps<TField>>;
}
```

**React — using `useFieldContext`:**

Every admin field component binds to its form field via `@vexcms/react/form`'s `useFieldContext()`, reached through `AdminFieldBinding` (which threads `name`/`field` down from the enclosing `<AppForm>`):

```tsx
import { AdminFieldBinding, type FieldComponentProps } from "@vexcms/react";
import { useFieldContext } from "@vexcms/react/form";
import type { TextField } from "@vexcms/core";

function TextControl() {
  const field = useFieldContext<string>();
  return (
    <input
      id={field.name}
      value={field.state.value ?? ""}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
    />
  );
}

export function TextFieldAdmin(props: FieldComponentProps<TextField>) {
  return (
    <AdminFieldBinding name={props.name}>
      <div>
        <label htmlFor={props.name}>{props.fieldDef.label || props.name}</label>
        <TextControl />
      </div>
    </AdminFieldBinding>
  );
}
```

`AdminFieldBinding` opens the form's field for `props.name` and provides it through `fieldContext`, so any descendant reading `useFieldContext()` resolves the same `FieldApi` without prop threading.

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
| `dashboard` | `/admin` (root) | `DashboardProps` — empty; the view reads the full config via `useVexConfig()` |
| `collectionListView` | `/admin/:collection` | `CollectionListViewProps` — collection slug + optional preloaded docs |
| `collectionEditView` | `/admin/:collection/:id` or `/admin/:collection/new` | `CollectionEditViewProps` — collection slug + optional doc ID and preloaded doc |

**Types:**

```ts
interface DashboardProps {}

interface CollectionListViewProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  collection: TCollectionSlug;
  // Optional server-resolved first-paint hints read from the `vex-admin:<collection>` cookie
  // (density, local view tabs, skeleton row count/footer, filter-chip titles). Document data
  // itself is never a prop — prefetch it into the TanStack Query cache instead.
  initialPreferences?: ListViewConfigCookieValues;
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
  initialSkeletonRowCount?: number;
  initialSkeletonDone?: boolean;
  initialFilterValueTitles?: Record<string, string | null>;
}

interface CollectionEditViewProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  collection: TCollectionSlug;
  documentId: VexDocument["_id"];
  initialData?: VexDocument | null;
}
```

None of the three takes a `config` prop — every view resolves the collection/global it needs by
slug, reading the full resolved config from `useVexConfig()` (populated by the framework's own
config provider — see [Step 6](#step-6--implement-the-layout-shell) below).

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
      field: MyTextFieldAdmin, // must accept FieldComponentProps<TextField>
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
  /** The slug of the currently active collection, for sidebar highlighting. */
  activeSlug?: string;
  /** The docID of the currently active document, for nav highlighting. */
  activeDocID?: string;
  /** The full pathname of the current URL, for the top nav. */
  pathname: string;
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
  user?: AdminUser;
  organization?: Record<string, unknown>;
}
```

There is no `config` prop — `AdminLayout` reads the full resolved config from `useVexConfig()`,
populated by the app's own config provider mounted above it (see
[Wiring it into an app](#wiring-it-into-an-app) below), not from a prop threaded through the
layout tree.

**Framework components — the `VexLink` / `VexImage` pattern:**

The admin panel contains internal navigation links. Rather than hardcoding `<a>` tags (which would bypass client-side routing), the package reads `Link` and `Image` from a React context called `FrameworkComponentsContext`.

`VexLink` is the component that reads this context:

```tsx
// Renders NextLink, RouterLink, etc. — falls back to <a> if nothing is configured
<VexLink href="/admin/collections/posts">Posts</VexLink>
```

When building a framework adapter, inject your router's link component via `AdminLayout`'s `components` prop. `AdminLayout` puts it into context; `VexLink` and `VexImage` everywhere in the tree pick it up automatically.

```tsx
import { Link as SolidLink } from "@solidjs/router";
// wrap to normalise href → to if needed
const RouterLink = ({ href, ...rest }) => <SolidLink to={href} {...rest} />;

<AdminLayout components={{ Link: RouterLink }} pathname={pathname}>
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
| `/admin/collections` | `CollectionsIndexView` (collections-only index) |
| `/admin/collections/:slug` | `CollectionListView` (or `MediaCollectionListView` for a media collection) |
| `/admin/collections/:slug/new` | `CollectionEditView` (empty) |
| `/admin/collections/:slug/:documentId` | `CollectionEditView` (editing), or `MediaCollectionEditView` |
| `/admin/globals` | `GlobalsListView` (permission-filtered — only globals the caller can read) |
| `/admin/globals/:slug` | `GlobalEditView` |

An unknown first segment (anything besides `collections`/`globals`) is a 404. An unknown
`:slug` under either section renders `AdminNotFound` instead of 404ing the whole route, so the
rest of the shell (sidebar, top bar) still renders.

**Next.js implementation pattern:**

```tsx
// app/admin/[[...path]]/page.tsx
import { fetchQuery } from "convex/nextjs";
import { vexConvexApi } from "@vexcms/core";
import { DashboardView, CollectionsIndexView, GlobalsListView, CollectionListView, CollectionEditView } from "@vexcms/react";

export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await props.params;
  const [section, collectionSlug, documentId] = path;

  if (path.length === 0) return <DashboardView />;
  if (section !== "collections" && section !== "globals") return <p>Not found.</p>;
  if (section === "globals") {
    if (!collectionSlug) return <GlobalsListView />;
    // ...render GlobalEditView for /admin/globals/:slug, omitted for brevity
  }

  if (!collectionSlug) return <CollectionsIndexView />;

  const collection = props.config.collections.find(c => c.slug === collectionSlug);
  if (!collection) return <p>Collection not found.</p>;

  if (documentId) {
    const initialData = await fetchQuery(vexConvexApi.get, {
      collection: collectionSlug,
      id: documentId,
    });
    return <CollectionEditView collection={collectionSlug} documentId={documentId} initialData={initialData} />;
  }

  return <CollectionListView collection={collectionSlug} />;
}
```

`CollectionEditView` passes `initialData` to TanStack Query as `initialData`, so the document renders immediately without a loading state on first load. `CollectionListView` takes no data prop: the real `NextAdminPage` prefetches the list query on the server (via `useVexListQuery`'s query key) into a `QueryClient` and hydrates it with a `HydrationBoundary`, so the table's first paint is server-rendered. Subsequent navigations use the live Convex subscription.

**The `[[...path]]` catch-all:** the optional catch-all route param is named `path` — this
matches `NextAdminPage`'s own `params: Promise<{ path?: string[] }>` type (required, not just
convention — a mismatched param name produces a compile error against the real signature).
The directory is `app/admin/[[...path]]/page.tsx`.


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

export function NextAdminLayout(props: { children: ReactNode }) {
  const pathname = usePathname();
  // Derive active collection slug from pathname for sidebar highlighting
  const segments = pathname.split("/").filter(Boolean);
  const activeSlug = segments[2]; // "posts" from "/admin/collections/posts"

  return (
    <AdminLayout
      pathname={pathname}
      activeSlug={activeSlug}
      components={{ Link: NextLink, Image: NextImage }}
    >
      {props.children}
    </AdminLayout>
  );
}
```

`AdminLayout` no longer takes a `config` prop — it reads the resolved config from
`useVexConfig()`, populated by a `VexConfigProvider` your app mounts once around the whole
admin route tree (see [Wiring it into an app](#wiring-it-into-an-app) below), not threaded
through the layout component.

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

## Step 9 — Implement the navigation-blocker and navigate capabilities (both optional)

`@vexcms/react` defines an unsaved-changes navigation guard framework-neutrally and asks the
adapter for two independent, optional capabilities: intercepting in-app navigation
(`navigationBlocker`) and performing a post-mutation programmatic navigation
(`useNavigate`). An adapter that skips both still works — `beforeunload` still prompts on tab
close / hard reload, but in-app navigation and a built-in's post-mutation redirect are
unguarded.

```ts
interface NavigationBlockerAdapter {
  useBlocker(props: {
    when: boolean;
    onBlock: (proceed: () => void) => void;
  }): void;
}
```

`useBlocker` is a hook: while `when` is `true`, the adapter intercepts in-app navigation and
calls `onBlock(proceed)` instead of letting it through. Calling `proceed()` lets the
navigation that triggered the block continue; not calling it cancels that navigation attempt.
`@vexcms/react`'s `useUnsavedChangesGuard`
(`packages/react/src/documents/useUnsavedChangesGuard.ts`) is the only caller — it supplies
`onBlock` and owns the Stay/Leave dialog; the adapter owns nothing about *why* navigation is
blocked, only *how* to intercept it. `beforeunload` is handled by `@vexcms/react` directly
(every framework runs in a browser), so the adapter contract has no unload hook. Without
`navigationBlocker`, in-app navigation is unguarded but `beforeunload` still works.

There is no `pushState`/`replaceState` patching, and no patching of a framework router's own
`push`/`replace`, in this contract. `@vexcms/next`'s implementation
(`useNextNavigationBlocker`, `packages/next/src/navigation/`) intercepts only the two surfaces
that fire BEFORE a route change commits: same-origin anchor clicks, in the capture phase
(skipping modifier-key clicks, clicks on an anchor with a `target`, and clicks on a
cross-origin or same-page-hash `href`), and browser back/forward, via a same-URL `popstate`
sentinel pushed on mount that lets the hook catch and correct the first back-press. Next
itself calls `pushState` only AFTER the new route has already committed (from
`HistoryUpdater`'s `useInsertionEffect`), and patches `pushState`/`replaceState` itself — by
the time either fires, the outgoing page is already unmounted, so intercepting there is too
late to prevent anything. A raw `<button onClick={() => router.push(...)}>` or any other
programmatic navigation is therefore invisible to `navigationBlocker` by design.

```ts
useNavigate?: () => (href: string) => void;
```

`useNavigate` closes that gap a different way: it is consumed only by `@vexcms/react`'s
`useVexNavigate()`, the supported path for programmatic navigation inside the admin — used by
built-ins for a post-mutation redirect (after delete, after a duplicate's create resolves).
`useVexNavigate` consults the same blocking state as `navigationBlocker` itself before calling
through, so every built-in that navigates after a mutation stays guarded without
`navigationBlocker`'s involvement. Everything clickable keeps using `VexLink`/`Link`, covered
by `navigationBlocker` above — a raw framework `router.push` called from third-party code is
NOT guarded, only `useVexNavigate` is. Omitting `useNavigate` falls back to
`window.location.assign`, a full page navigation.

Provide both capabilities through the same framework-components mechanism as `Link`/`Image`
(Step 6, above) — `@vexcms/next` supplies `navigationBlocker: { useBlocker:
useNextNavigationBlocker }` and `useNavigate: useNextNavigate` (wrapping `useRouter().push`
from `next/navigation`) from `NextAdminLayoutClient.tsx`, mounted once above the admin route
tree alongside `Link`/`Image`.

**For non-React or server-rendered frameworks:** implement `useBlocker` against your router's
own navigation-interception primitive, and `useNavigate` against its programmatic-navigation
API. A framework with no client-side router (full page loads only) has no in-app navigation to
intercept and no programmatic navigation to wrap — omit both; `beforeunload` alone still
covers it, since that is handled outside the adapter.

## Step 10 — Implement the auth capability (optional)

`AdminTopNav` renders a sign-in/out control at the opposite edge of the bar from the
sidebar-trigger/breadcrumbs/"View site" cluster — but only when the adapter configures it:

```ts
auth?: {
  signInHref: (redirectTo: string) => string;
  signOut: () => Promise<void>;
};
```

Omitted (the default), the control renders nothing — identical to before this capability
existed.

The signed-in/signed-out determination itself does NOT come from this adapter — it comes
from `useVexAuth()`, the same server-resolved `{ user, organization }` every other
RBAC-aware component in the tree reads, so there is no client-only flash. `user === null`
or `user.isAnonymous === true` (Better Auth's `anonymous()` plugin convention — relevant
once you have configured `anonRole` for read-only public admin access, see the Access
Control guide) both render "Sign in"; anything else renders "Sign out".

`signInHref` receives the current admin URL (no query string) as `redirectTo`, and must
return the full sign-in route URL to link to — typically appending it as a query param
your sign-in page/route-level auth guard already reads (the same convention a `redirect()`
to the sign-in page from a server component gate should already be using, see
`app/admin/[[...path]]/page.tsx` above). `signOut` must perform the ENTIRE sign-out
sequence your framework needs (your auth client's own sign-out call AND whatever
server-aware refresh makes the server-resolved auth state and route guard re-evaluate on
return — Next.js: `router.refresh()`), not just the auth-client call — `AdminTopNav` shows
a pending state for exactly as long as the returned promise takes to settle, and only
calls it once per click (a second click while pending is a no-op, the control disables
itself).

Provide it through the same framework-components mechanism as `Link`/`Image`/
`navigationBlocker`/`useNavigate` — `@vexcms/next` supplies this one differently, though:
`NextAdminLayout`/your admin `layout.tsx` are both server components, so a `signOut`
closure over your app's own auth client cannot reach them as a prop. Instead,
`@vexcms/next/auth` exports `VexAdminAuthAdapterProvider` — a context provider you mount
anywhere above `NextAdminLayout` in your own CLIENT tree (both ends are client components,
so the boundary that blocks a prop does not apply to a context). The template projects
mount it inside their own Better Auth client provider:

```tsx
// components/providers/client.tsx or auth/client.tsx ("use client")
import { VexAdminAuthAdapterProvider } from "@vexcms/next/auth";
import { useRouter } from "next/navigation";
import { signOut } from "~/auth/client";

function AuthAdapterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <VexAdminAuthAdapterProvider
      value={{
        signInHref: (redirectTo) => `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`,
        signOut: () =>
          signOut()
            .then(() => router.refresh())
            .catch(() => router.refresh()), // refresh either way — a stale client
            // cache after a failed sign-out is worse than a redundant refresh.
      }}
    >
      {children}
    </VexAdminAuthAdapterProvider>
  );
}
```

**For non-React or server-rendered frameworks:** implement `signInHref` against your own
sign-in route's URL scheme, and `signOut` against your auth library's own sign-out call
plus whatever "make the server re-check auth state" mechanism your framework offers (a
full reload is always a safe fallback). A framework with no sign-in/out concept at all —
omit `auth` entirely; the control simply does not render.

## Wiring it into an app

Here is the minimal setup for the Next.js adapter:

**`vex.config.ts`** (client, project root):
```ts
import { defineConfig, defineCollection } from "@vexcms/core";
import { text } from "@vexcms/core/fields";

const vexConfig = defineConfig({
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

export default vexConfig;
```

**`vex.config.server.ts`** (server, project root — the type `NextAdminPage` and Convex functions consume):
```ts
import { defineServerConfig } from "@vexcms/core";

import vexConfig from "./vex.config";

export default defineServerConfig({ config: vexConfig });
```

**`components/providers/client.tsx`** — one root mount, serving the admin panel and the
public site alike:
```tsx
"use client";

import { VexConfigProvider } from "@vexcms/react";
import config from "../../vex.config";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <VexConfigProvider config={config}>{children}</VexConfigProvider>;
}
```

**`app/admin/layout.tsx`** — the config context comes from the root layout:
```tsx
import { NextAdminLayout } from "@vexcms/next/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextAdminLayout>{children}</NextAdminLayout>
  );
}
```

**`app/admin/[[...path]]/page.tsx`**:
```tsx
import { canAccessAdminPanel } from "@vexcms/core";
import { NextAdminPage } from "@vexcms/next/server";
import { redirect } from "next/navigation";

import { getToken, getUserOrg } from "~/auth/server";
import config from "../../../../vex.config.server";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);

  let token, auth;
  try {
    token = await getToken();
    auth = await getUserOrg();
  } catch {
    // Session verification itself failed (backend unreachable, lookup timeout) — fail
    // closed instead of surfacing a 500 or letting the request through.
    redirect("/unauthorized");
  }
  if (
    !canAccessAdminPanel({ access: config.access, user: auth.user, organization: auth.organization })
  ) {
    // Only redirect to sign-in when there was genuinely no token — a signed-in caller
    // whose own role still fails the check goes to /unauthorized instead. Don't
    // hard-redirect on a missing token before this check: an app whose `anonRole`
    // grants `adminPanel.access` (see the Access Control guide's "Read-only public
    // admin via anonRole" section) needs this check to run for an anonymous caller too.
    // `redirectTo` carries the full deep link (path + query) so sign-in returns to it;
    // the templates build it with a small `buildAdminRequestPath` helper.
    const requestedPath = buildAdminRequestPath(resolvedParams.path, resolvedSearchParams);
    redirect(token ? "/unauthorized" : `/auth/sign-in?redirectTo=${encodeURIComponent(requestedPath)}`);
  }

  return (
    <NextAdminPage
      config={config}
      params={params}
      searchParams={searchParams}
      tokenPromise={Promise.resolve(token)}
      authPromise={Promise.resolve(auth)}
    />
  );
}
```

**`convex/vex/collections.ts`** (copy from the VexCMS template):
The `list`, `get`, `create`, `update`, and `remove` functions must exist at `vex.collections.*` — that is where `vexConvexApi` points. Copy the template from `apps/test/convex/vex/collections.ts`.

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

- **Form submission** — `CollectionEditView` renders the form but the Save button is a no-op. Create/update mutations will be wired in a future spec.
- **Additional field types** — only `text` is implemented. Number, checkbox, select, textarea, and date are planned.
- **Auth** — no authentication layer yet. The admin panel is currently unprotected.
- **Media** — no media library or image field type yet.
