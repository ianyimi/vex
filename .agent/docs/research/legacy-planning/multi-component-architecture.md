# Multi-Component Architecture: Design Options for VexCMS

> Status: **Selected direction** — Component-as-Workspace (Option A) with server-side API model  
> Context: How VexCMS could manage tables across multiple Convex components from a single admin panel. This is a **future/backlog architecture** — not on the near-term roadmap. See Spec 43 in `roadmap.md`.

---

## Background

Convex **components** allow a single deployment to contain modular, namespaced backend units. Each component has its own schema, functions, and file tree. Tables are automatically namespaced (e.g. `blog__posts` internally). Components can expose an API surface and be "installed" into a parent deployment.

VexCMS currently assumes a **single Convex schema** per project. The CLI generates one `convex/schema.ts`, users write their own Convex server functions (queries/mutations), and the frontend calls them via **TanStack Query** (`@convex-dev/react-query`). There is no client-side Vex data API — all data access goes through standard Convex + TanStack patterns.

This document explores three architectural options for making VexCMS **component-aware** — enabling a single admin panel to manage content across multiple Convex components, each effectively a sandboxed app or domain.

---

## Option A: Component-as-Workspace Model

> *Each Convex component = an isolated Vex workspace. The admin panel switches between them.*

### Mental Model

A developer sets up a Convex deployment with three components: `blog`, `ecommerce`, `crm`. In Vex, these appear as three **workspaces** in the admin panel. Selecting a workspace shows only that component's collections, schema, and content. Workspaces are true sandboxes — no cross-workspace relationships in the UI.

### Schema Definition — Single Hierarchical Config

One root `vex.config.ts` defines both root-level collections and component-scoped collections. `defineComponent` accepts the same config surface area as the root minus `components` (no nesting) — collections, access control, hooks, etc.

```ts
// vex.config.ts — single hierarchical config
import { defineVexConfig, defineCollection, defineComponent } from '@vexcms/core';

export default defineVexConfig({
  // Root-level collections live in the root Convex schema
  // These are "global" tables — users, settings, workspace registry, etc.
  collections: [
    defineCollection({
      slug: 'users',
      label: 'Users',
      fields: [/* ... */]
    }),
    defineCollection({
      slug: 'settings',
      label: 'Global Settings',
      fields: [/* ... */]
    })
  ],

  // Each defineComponent becomes a Convex component with its own schema + functions
  components: [
    defineComponent({
      name: 'blog',      // component identifier ( Convex namespace )
      label: 'Blog',    // UI label
      // subdomain: 'blog', // optional explicit subdomain mapping
      collections: [
        defineCollection({
          slug: 'posts',
          label: 'Posts',
          fields: [/* ... */]
        }),
        defineCollection({
          slug: 'authors',
          label: 'Authors',
          fields: [/* ... */]
        })
      ],
      access: { read: () => true },
      hooks: { beforeCreate: async (ctx, data) => { /* ... */ } }
    }),

    defineComponent({
      name: 'shop',
      label: 'Shop',
      collections: [
        defineCollection({
          slug: 'products',
          label: 'Products',
          fields: [/* ... */]
        }),
        defineCollection({
          slug: 'orders',
          label: 'Orders',
          fields: [/* ... */]
        })
      ]
    })
  ]
});
```

**Key design rule:** `defineComponent` accepts **almost the rest of `defineVexConfig`** — collections, access, hooks — scoped to that component. The CLI splits this into per-component Convex schemas.

### Routing

```
/admin/[workspace]/[collection]           → list view
/admin/[workspace]/[collection]/[id]      → document edit
/admin/[workspace]/[collection]/create    → new document
/admin/[workspace]/settings               → workspace settings
```

Examples:
- `/admin/blog/posts` — list blog posts
- `/admin/shop/products/abc123` — edit a product

The admin panel is a Next.js app. It determines the active workspace from the URL path (or subdomain — see below) and uses TanStack Query to call the appropriate Convex functions. No Vex-specific client hooks — just standard `useQuery` from `@convex-dev/react-query`.

### Data Layer — Server-Side API Model

Vex does **not** provide client-side data hooks. Users write their own Convex server functions and call them via `@convex-dev/react-query` on the frontend.

**User-written Convex functions** can accept a `component` arg to dispatch to the right component:

```ts
// convex/admin/list.ts — a user-written root dispatcher
import { query } from "./_generated/server";
import { componentArg } from "./_generated/api";

export const adminList = query({
  args: {
    component: v.optional(v.string()), // 'blog' | 'shop' | undefined (root)
    collection: v.string(),
    /* pagination, filters */
  },
  handler: async (ctx, args) => {
    if (args.component) {
      const componentApi = componentArg(ctx, args.component);
      return componentApi.vex.list({ collection: args.collection /* ... */ });
    }
    // Root-level query — hits the root schema directly
    return ctx.db.query(args.collection).collect();
  }
});
```

Or, more commonly, users write **component-specific functions** inside each component:

```ts
// convex/blog/posts.ts — inside the blog component
import { query } from "../_generated/server";

export const list = query({
  args: { /* pagination */ },
  handler: async (ctx, args) => {
    // This runs INSIDE the blog component — ctx.db.query('posts') hits the blog schema
    return ctx.db.query("posts").collect();
  }
});
```

**Frontend** uses standard TanStack Query via `@convex-dev/react-query`:

```ts
import { useQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";

// Calling a component-specific function
const posts = useQuery(api.blog.posts.list, {});

// Or calling the root dispatcher with component arg
const posts = useQuery(api.admin.list, { component: "blog", collection: "posts" });
```

The `vex dev` CLI generates the typed component API paths (`api.blog.posts.list`, `api.shop.products.list`) and, optionally, a root dispatcher function with component-aware args.

### Type Narrowing — Generated Registry

`vex dev` emits a `vex.registry.ts` that makes `component` a type discriminator:

```ts
// Generated by vex dev
export type VexComponent = 'root' | 'blog' | 'shop';

export interface VexRegistry {
  root: {
    collections: {
      users: UserCollectionConfig;
      settings: SettingsCollectionConfig;
    };
  };
  blog: {
    collections: {
      posts: PostCollectionConfig;
      authors: AuthorCollectionConfig;
    };
  };
  shop: {
    collections: {
      products: ProductCollectionConfig;
      orders: OrderCollectionConfig;
    };
  };
}
```

If the admin panel (or a user) uses a root dispatcher function with a `component` arg, the registry narrows the valid `collection` values:

```ts
// In a root dispatcher or generated helper
function adminList<T extends VexComponent>(
  args: { component: T; collection: keyof VexRegistry[T]['collections'] }
): Promise<...>;

// Usage: passing 'blog' narrows collection to 'posts' | 'authors'
adminList({ component: 'blog', collection: 'posts' });     // ✓
adminList({ component: 'blog', collection: 'products' });   // ✗ TS error
adminList({ component: 'shop', collection: 'posts' });        // ✗ TS error
```

For component-specific API paths (`api.blog.posts.list`), the component boundary is already baked into the generated Convex `_generated/api.d.ts` — no extra narrowing needed. The registry is primarily for:
1. Admin panel internals (dynamic collection routing, sidebar generation)
2. Optional root dispatcher functions that accept a runtime `component` arg
3. LSP autocomplete in user code that builds generic admin tools across workspaces

### CLI Changes (`vex dev`)

1. **Discovery:** Scan the project for all `vex.config.ts` files. Group by `component` identifier.
2. **Validation:** Ensure no duplicate collection slugs within a component. Cross-component duplication is allowed.
3. **Schema generation:** Emit one `schema.ts` per component, not one global schema.
4. **Code generation:** Generate per-component `_generated/` types, or a single namespaced `_generated/` with prefixes (e.g. `api.blog.vex.list`).
5. **Registry:** Build a `vex.registry.json` manifest mapping workspaces → collections → fields, consumed by the admin panel at build time.

### Auth & Access Control

- **Root component** owns auth (Better Auth / Convex Auth tables). All component queries receive the authenticated user context.
- **Per-workspace access control:** Each `defineVexComponent` can specify `access` rules. The root `vexList` / `vexGet` function evaluates these before delegating to the component.
- **Global admins vs workspace admins:** The `users` table in the root component can have a `workspaces` array or role field.

### File Storage

`@vexcms/file-storage-convex` stores files in a **component-scoped prefix** (e.g. `blog/`, `ecommerce/`) within a single Convex file storage backend. Alternatively, each component could have its own storage adapter instance.

### Pros
- Clean mental model: developers think "I'm managing the blog app" not "I'm managing table `blog__posts`"
- True sandboxing: schema changes in one workspace don't affect others
- Teams can own workspaces independently
- Workspace switcher is a familiar pattern (Supabase, Firebase, Vercel)

### Cons
- No cross-workspace relationships or unified search in the UI (by design)
- Context switching between workspaces adds friction for oversight
- Convex component boundary means no native cross-component queries — aggregated dashboards need root-level aggregation functions

---

## Option B: Unified Namespace with Component Prefixing

> *All component tables are flattened into a single admin view with prefixed names. One pane of glass.*

### Mental Model

The same three components (`blog`, `ecommerce`, `crm`) exist in Convex, but the Vex admin panel treats them as a **single unified collection namespace**. The user sees `blog_posts`, `blog_authors`, `ecommerce_products`, `ecommerce_orders`, `crm_deals` as distinct collections in one sidebar.

### Schema Definition

A single root-level `vex.config.ts` references tables across components:

```ts
// Root-level vex.config.ts
import { defineVexConfig, defineCollection } from '@vexcms/core';

export default defineVexConfig({
  collections: [
    // Blog component tables
    defineCollection({
      slug: 'blog_posts',
      component: 'blog',
      table: 'posts',
      label: 'Blog Posts',
      fields: [/* ... */]
    }),
    defineCollection({
      slug: 'blog_authors',
      component: 'blog',
      table: 'authors',
      label: 'Authors',
      fields: [/* ... */]
    }),
    // E-commerce component tables
    defineCollection({
      slug: 'ecommerce_products',
      component: 'ecommerce',
      table: 'products',
      label: 'Products',
      fields: [/* ... */]
    }),
    defineCollection({
      slug: 'ecommerce_orders',
      component: 'ecommerce',
      table: 'orders',
      label: 'Orders',
      fields: [/* ... */]
    })
  ]
});
```

Collections are **explicitly registered** in the root config. The `component` + `table` fields map to the Convex component namespace.

### Routing

```
/admin/[collection]           → list view (no workspace segment)
/admin/[collection]/[id]        → document edit
/admin/[collection]/create      → new document
```

Examples:
- `/admin/blog_posts` — list blog posts
- `/admin/ecommerce_products/abc123` — edit a product

### Data Layer — Server-Side API Model

Same pattern as Option A: users write their own Convex functions and call them via `@convex-dev/react-query`. The difference is in the admin UI presentation — collections are prefixed (e.g. `blog_posts`, `shop_products`) rather than grouped into workspaces.

A root dispatcher function resolves the collection slug to a component:

```ts
export const adminList = query({
  args: { collection: v.string(), /* ... */ },
  handler: async (ctx, args) => {
    const mapping = COLLECTION_REGISTRY[args.collection]; // built at codegen
    const componentApi = componentArg(ctx, mapping.component);
    return componentApi.vex.list({ collection: mapping.table, /* ... */ });
  }
});
```

Frontend:
```ts
const posts = useQuery(api.admin.list, { collection: "blog_posts" });
```

### CLI Changes (`vex dev`)

1. **Registry building:** The root `vex.config.ts` is the source of truth. CLI validates that all referenced `component` + `table` pairs exist in the Convex project.
2. **Schema generation:** Still one root `schema.ts`? Or per-component schemas plus a root routing layer? The root schema may only need auth + Vex metadata tables; component schemas live in their respective directories.
3. **Code generation:** A unified `vex.registry.ts` is generated, mapping collection slugs to component APIs.

### Auth & Access Control

- Root component owns auth.
- Each collection in the root config can specify `access` rules. These are evaluated in the root routing function before dispatching to the component.
- Access control is **collection-scoped**, not workspace-scoped. A user might have read access to `blog_posts` but not `ecommerce_orders`.

### Pros
- **Single pane of glass:** Perfect for platform admins who need oversight across all apps
- Cross-collection search and filtering are possible at the UI level
- Unified activity feed, recent documents, global dashboards
- No workspace context switching

### Cons
- Sidebar can become crowded with many collections
- Name collision risk if two components have the same table name and the root config doesn't prefix them
- Schema ownership is split: collection definitions live in root config, but table schemas live in components. This is a conceptual mismatch.
- Harder to sandbox: a schema change to `ecommerce_products` requires updating the root config
- Access control complexity: per-collection rules are finer-grained but harder to manage at scale

---

## Option C: Component-as-Plugin / Installable Module Platform

> *Convex components become installable Vex plugins that bundle schema, admin views, and hooks.*

### Mental Model

Vex evolves into a **plugin platform**. A plugin = an npm package (or local package) containing:
1. A Convex component (schema + functions)
2. Vex collection definitions
3. Optional admin UI extensions (custom list views, cell renderers, dashboard widgets)
4. Default hooks and access control rules

A developer runs:

```bash
vex install @vexcms/plugin-blog
vex install @vexcms/plugin-ecommerce
vex install ./local-plugins/crm
```

The CLI installs the Convex component and registers the plugin with the admin panel.

### Plugin API Design (Sketch)

```ts
// packages/plugin-blog/src/index.ts
import { defineVexPlugin, defineCollection } from '@vexcms/core';
import { PostListView } from './admin/PostListView';
import { PostCell } from './admin/PostCell';

export const blogPlugin = defineVexPlugin({
  id: 'blog',
  label: 'Blog',
  version: '1.0.0',
  
  // Convex component reference
  component: {
    schema: /* ... */, // or path to schema file
    functions: /* ... */
  },
  
  // Vex collections (same as workspace model)
  collections: [
    defineCollection({
      slug: 'posts',
      label: 'Posts',
      fields: [/* ... */],
      // Optional admin overrides
      admin: {
        listView: PostListView,
        defaultCell: PostCell
      }
    })
  ],
  
  // Plugin-level hooks
  hooks: {
    beforeCreate: async (ctx, data) => { /* ... */ }
  },
  
  // Default access control
  access: {
    read: () => true,
    create: ({ user }) => user?.role === 'editor'
  }
});
```

### Admin Shell Architecture

The Vex admin panel becomes a **shell** that loads plugins dynamically:

```tsx
// apps/www/app/admin/layout.tsx (simplified)
import { VexAdminShell } from '@vexcms/next';
import { blogPlugin } from '@vexcms/plugin-blog';
import { ecommercePlugin } from '@vexcms/plugin-ecommerce';

export default function AdminLayout() {
  return (
    <VexAdminShell plugins={[blogPlugin, ecommercePlugin]}>
      {/* Routes auto-generated from plugin collections */}
    </VexAdminShell>
  );
}
```

Plugins can also inject **sidebar sections**, **dashboard widgets**, and **top-nav items**.

### Routing

Two possible routing schemes:

**A. Workspace-style (per-plugin):**
```
/admin/blog/posts
/admin/ecommerce/products
```

**B. Flat with plugin prefix:**
```
/admin/blog_posts
/admin/ecommerce_products
```

The plugin system is **routing-agnostic** — it's a configuration option on the shell.

### Data Layer

Same server-side API model as Option A under the hood. The plugin ID becomes the workspace/component target.

```ts
// Frontend via @convex-dev/react-query
const posts = useQuery(api.blog.vex.list, { collection: 'posts' });
```

### CLI Changes (`vex` CLI)

New commands:

```bash
vex install <plugin>       # Install plugin (npm install + component setup + registry update)
vex uninstall <plugin>     # Remove plugin
vex plugins list           # Show installed plugins
vex plugins update         # Update all plugins, check compatibility
```

The `vex dev` command discovers installed plugins, validates version compatibility against `@vexcms/core`, and generates the unified registry.

### Plugin Marketplace Vision

- **Official plugins:** `@vexcms/plugin-blog`, `@vexcms/plugin-ecommerce`, `@vexcms/plugin-forms`
- **Community plugins:** Published to npm with `vex-plugin` keyword
- **Local plugins:** First-class support for in-monorepo plugin development
- **Plugin dependencies:** A plugin can declare `dependsOn: ['auth']` to require another plugin

### Pros
- **True modularity:** Drop-in functionality. A plugin is a self-contained unit.
- **Ecosystem potential:** Community can build and share plugins. Vex becomes a platform.
- **Versioning:** Plugins version independently from Vex core.
- **Custom UI:** Plugins can ship bespoke admin views when the default CRUD isn't enough.

### Cons
- **Largest API surface:** Plugin API needs to be stable and well-designed.
- **Dependency hell:** Plugin A depends on Plugin B which depends on Core 2.x while Plugin C needs Core 3.x.
- **Build complexity:** The admin panel needs to bundle plugin React code. Dynamic imports or compile-time registration.
- **Security:** Third-party plugins run Convex functions in your deployment. Need sandboxing / audit story.
- **Scope creep:** This is a multi-year architectural commitment, not a single feature.

---

## Cross-Cutting Concerns (All Options)

| Concern | A: Workspaces | B: Unified | C: Plugins |
|---|---|---|---|
| **Auth** | Root component owns auth. Per-workspace access rules. | Root component owns auth. Per-collection access rules. | Root component owns auth. Per-plugin access rules + plugin can bundle its own auth extensions. |
| **File Storage** | Component-scoped prefixes. Simple. | Component-scoped prefixes resolved from collection slug. | Plugin-scoped storage. Plugin may provide its own storage adapter. |
| **Real-time Subscriptions** | TanStack Query calls `api.component.function` — Convex handles the component boundary. | Root dispatcher resolves collection→component→function. | Plugin = component; same pattern as A. |
| **Code Generation** | Per-component `_generated/` or namespaced single output. | Unified registry mapping collection→component. | Registry + plugin manifest. Version compatibility checks. |
| **Schema Migrations** | Per-component, independent. | Root config must be updated when component schema changes. | Plugin update = reinstall. Migration bundled with plugin. |
| **TypeScript Types** | Component-scoped types. Admin panel needs union types across workspaces. | Unified collection types generated from root registry. | Plugin ships its own types. Admin shell uses plugin type manifests. |
| **Search** | Workspace-scoped only. | Cross-collection search possible. | Cross-plugin search if shell supports it. |
| **Dashboards / Analytics** | Per-workspace dashboards. Root-level dashboards require aggregation functions. | Unified dashboards native. | Plugin-provided dashboard widgets. |
| **Deployment Model** | One Convex deployment, multiple components. Admin panel routes to components. | Same. | Same. Plugin = component + React code. |

---

## Comparison Matrix

| Criterion | A: Workspaces | B: Unified | C: Plugins |
|---|---|---|---|
| **Implementation Complexity** | Medium | Medium-High (registry routing) | High (plugin API + lifecycle) |
| **Developer Mental Model** | Clean: "switch to blog app" | Flat: "manage all collections" | Clean: "install blog plugin" |
| **Sandboxing** | Strong (component boundary) | Weak (root config couples everything) | Strong (plugin boundary) |
| **Cross-Domain Features** | Requires explicit root-level aggregation | Native | Plugin dependencies + shell aggregation |
| **Team Scaling** | Good (teams own workspaces) | Poor (everyone edits root config) | Excellent (teams own plugins) |
| **Third-Party Reuse** | Hard (workspaces are project-specific) | Hard | Core value prop (npm install) |
| **OSS Ecosystem Potential** | Low | Low | High |
| **Migration Path from Today** | Add `component` param to schema + CLI | Add registry layer | Requires new plugin API + CLI commands |
| **Time to MVP** | Shortest | Short | Longest |

---

## Recommendation

### Phase 1 — Foundation (Backlog / Post-Enterprise)

**Implement Option A (Workspaces)** as the foundational layer.

This is a **future/backlog architecture** — not on the current near-term roadmap (see Spec 43 in `roadmap.md`). It lands after enterprise features are stable and the core CMS is widely adopted.

Reasoning:
1. It requires the smallest change to the existing mental model: add `components: [defineComponent({...})]` alongside existing `collections` in `vex.config.ts`.
2. It doesn't preclude Options B or C later — a unified namespace is just a different UI over the same workspace primitives.
3. It delivers value for developers with multi-component Convex projects who want a single admin panel.
4. It teaches us what abstractions we need before committing to a plugin API (Option C).

Key deliverables:
- `defineComponent()` in `@vexcms/core` — accepts the same config surface as root (collections, access, hooks)
- Hierarchical `vex.config.ts` parsing: root `collections` + `components` array
- Component-aware schema generation in `@vexcms/cli` — emits per-component `schema.ts` + `convex.config.js`
- Generated `vex.registry.ts` — discriminated union types for component→collection narrowing
- Workspace switcher in `@vexcms/react` admin sidebar
- `[workspace]` route segment in `@vexcms/next` (or subdomain-based detection via middleware)
- Subdomain middleware for component routing (optional, opt-in)

### Phase 2 — Unified Namespace UI Mode

Add Option B as a presentation toggle once Phase 1 works. Flatten workspace collections into a single sidebar with prefixed names.

### Phase 3 — Plugin Platform (Conditional)

Evaluate Option C based on adoption. Requires stable plugin API + npm distribution + version compatibility matrix. This is a multi-year commitment.

---

## Open Questions

1. **Convex component API stability:** How does `componentArg` / `use` API evolve? Vex needs to track Convex's component API closely.
2. **Root component schema:** If all data tables live in child components, what lives in the root? Just auth tables + Vex metadata (registry, migrations log)?
3. **Cross-component transactions:** Convex doesn't support atomic transactions across components. How do we document this limitation for Vex users?
4. **Component initialization order:** If Plugin A depends on Plugin B's tables, how do we enforce setup order?
5. **Admin panel deployment:** Is the admin panel a separate Next.js deployment that talks to the Convex project, or does it live inside one of the components? (Current model: separate Next.js app.)
6. **Convex Dashboard coexistence:** Does Vex admin replace the Convex Dashboard for content editing, or complement it? How do we handle developers who use both?

---

## Appendix: Convex Component Primer (for Vex Context)

Convex components are defined via a `convex.config.js` file that exports a `defineComponent()` call. A parent deployment "installs" a component via `use()` in its own `convex.config.js`.

```js
// convex/convex.config.js (root)
import { defineApp } from "convex/server";
import blog from "./blog/convex.config.js";

const app = defineApp();
app.use(blog, { name: "blog" });
export default app;
```

Each component has its own `schema.ts` and `functions/` directory. Tables are automatically namespaced by the component name. Functions are accessed via `api.componentName.functionName`.

For Vex, the critical insight is: **a component is a Convex-native module boundary**. Vex should respect it, not fight it. The workspace model maps 1:1 to how Convex already thinks about components.
