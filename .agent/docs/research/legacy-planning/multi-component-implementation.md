# Multi-Component Implementation Reference

> Consolidated architecture decisions from discussion thread. Covers: pure `hasPermission`, string user IDs, per-component access config, root user fetch pattern, and multi-repo setup.

---

## 1. Auth Architecture: Pure `hasPermission`

### Core Decision

`hasPermission` is a **pure function** — zero Convex runtime dependency. It takes a user object and evaluates the permission matrix. The only thing that needs `ctx` is fetching the user from the root `users` table.

```ts
// convex/auth/permissions.ts (root component)
// ==============================================
// PART 1: Pure evaluation (no ctx, no database, no convex runtime)
// This can be imported anywhere — root functions, component functions,
// client browser, Node.js scripts, tests.

export function hasPermission(
  user: User,
  resource: string,      // "posts", "blog_posts", "shop_products"
  action: "create" | "read" | "update" | "delete",
  document?: Document    // for document-level permission checks
): boolean {
  const rule = PERMISSION_REGISTRY[resource]?.[action];
  if (!rule) return false;
  return rule({ user, document });
}

// PART 2: User fetch (needs ctx — only called from root functions)
// Components call this via ctx.runQuery to get user data.

export const getUserById = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query(USER_COLLECTION)
      .withIndex("by_id", q => q.eq("_id", args.userId))
      .first();
  },
});
```

### Why This Split Matters

| Concern | Before (combined) | After (split) |
|---|---|---|
| **Component calls** | `ctx.runQuery(api.root.auth.hasPermission, {...})` — one round-trip per check | Fetch user once via `ctx.runQuery(api.root.auth.getUserById)`, then call pure `hasPermission` locally |
| **Multiple checks** | N round-trips for N permission checks | One round-trip for user fetch, N local evaluations |
| **Client-side** | `useQuery(api.auth.hasPermission)` — needs Convex query | `hasPermission(user, ...)` — pure JS, works offline, testable without Convex runtime |
| **Testability** | Needs convex-test or mock ctx | Pass a plain user object, no setup |
| **Importability** | Only inside Convex functions | Any JS runtime — Vite, Node, Vitest, browser |

### Component Function Pattern

```ts
// convex/blog/functions/posts.ts (blog component)
import { query } from "../../_generated/server";
import { api } from "../../_generated/api";
// NOTE: evaluatePermission is PURE — if Convex blocks cross-component imports,
// the CLI generates a copy into each component's _generated/permissions.ts
import { hasPermission } from "../_generated/permissions";

export const list = query({
  args: { /* pagination */ },
  handler: async (ctx, args) => {
    // 1. Auth identity — works in ALL components, deployment-level
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // 2. Fetch user from root (ONE round-trip)
    const user = await ctx.runQuery(api.root.auth.getUserById, {
      userId: identity.subject, // "user_abc123"
    });
    if (!user) throw new Error("User not found");

    // 3. Evaluate permission locally — pure function, zero round-trip
    const allowed = hasPermission(user, "blog_posts", "read");
    if (!allowed) throw new Error("Forbidden");

    // 4. Proceed with component-local query
    return ctx.db.query("posts").collect();
  },
});
```

### Client-Side Permission Checks

```tsx
// Any React component — admin panel or app frontend
import { hasPermission } from "@vexcms/core/permissions";

function PostActions({ user, post }: { user: User; post: Post }) {
  // Pure function — no useQuery, no loading state, no round-trip
  const canEdit = hasPermission(user, "blog_posts", "update", post);
  const canDelete = hasPermission(user, "blog_posts", "delete", post);

  return (
    <>
      {canEdit && <Button>Edit</Button>}
      {canDelete && <Button variant="destructive">Delete</Button>}
    </>
  );
}
```

The user object is fetched once at app initialization (or from auth context) and passed down. Permission checks are instant.

---

## 2. String userId for All User References

### Decision

**Root collections use `v.id(USER_COLLECTION)` for native referential integrity.** The user collection name is configured by the auth adapter (e.g., `users`, `members`, `accounts`) and lives in the root component, so root collections can use Convex foreign keys directly.

**Component collections use `v.string()` for user references.** Components cannot access the root `users` table, so they store user IDs as strings. This is the only difference between root and component collection schemas.

```ts
// Root collection — native referential integrity to users table
posts: defineTable({
  title: v.string(),
  authorId: v.id(USER_COLLECTION), // Native foreign key — user collection is in root
})
  .index("by_author", ["authorId"]),

// Component collection — string reference
posts: defineTable({
  title: v.string(),
  authorId: v.string(), // String user ID — component cannot access root users table
})
  .index("by_author", ["authorId"]),
```

### Tradeoff Accepted

- **Root collections:** Full Convex referential integrity on user references. Database rejects orphaned `authorId`.
- **Component collections:** No native referential integrity. Validation happens in application code (mutation hooks + scheduled checks).
- **Gain:** Moving a root collection into a component requires only one change: `v.id(USER_COLLECTION)` → `v.string()`. All other schema, indexes, and queries remain identical.

### Validation Strategy

Vex generates validation in create/update mutations:

```ts
// Generated by vex dev — injected into component create mutation
const user = await ctx.runQuery(api.root.auth.getUserById, { id: args.authorId });
if (!user) throw new Error(`Invalid authorId: ${args.authorId}`);
```

Optional scheduled job: root component scans all component tables for orphaned `authorId` references and reports them.

### relationship() Field Type

```ts
// Vex relationship field — works identically in root and components
defineCollection({
  fields: [
    relationship({
      to: USER_COLLECTION, // Resolved from auth adapter config (e.g., "users", "members")
      // USER_COLLECTION is a compile-time constant from the auth adapter config
      label: "Author",
    }),
  ],
});
```

**Generated schema:**
- Root collection: `authorId: v.id(USER_COLLECTION)` — native foreign key
- Component collection: `authorId: v.string()` — string reference

**Admin UI:** Relationship picker queries `api.root.[USER_COLLECTION].list` and stores the appropriate ID type.

---

## 3. Per-Component Access Config

### Vex Config Structure

```ts
// vex.config.ts — single file at project root (admin repo)
import { defineVexConfig, defineCollection, defineComponent } from "@vexcms/core";

export default defineVexConfig({
  collections: [
    // Root-level collections (if any)
    defineCollection({
      slug: "settings",
      fields: [/* ... */],
      access: {
        read: () => true,
        update: ({ user }) => user?.role === "admin",
      },
    }),
  ],

  components: [
    defineComponent({
      name: "blog",
      label: "Blog",
      collections: [
        defineCollection({
          slug: "posts",
          fields: [/* ... */],
          // Component-scoped access rules
          access: {
            read: () => true,
            create: ({ user }) => user?.role === "editor",
            update: ({ user, document }) =>
              user?.role === "admin" || document.authorId === user?.id,
            delete: ({ user }) => user?.role === "admin",
          },
        }),
        defineCollection({
          slug: "authors",
          fields: [/* ... */],
          access: {
            read: () => true,
            create: ({ user }) => user?.role === "admin",
          },
        }),
      ],
      // Component-level default access (applies to all collections unless overridden)
      access: {
        read: () => true,
      },
    }),

    defineComponent({
      name: "shop",
      label: "Shop",
      collections: [
        defineCollection({
          slug: "products",
          fields: [/* ... */],
          access: {
            read: () => true,
            create: ({ user }) => user?.role === "manager",
          },
        }),
      ],
    }),
  ],
});
```

### Generated Permission Registry

The CLI (`vex dev`) compiles all access rules into a single registry:

```ts
// Generated: convex/_generated/permissions.ts (root + copies in each component)

export const PERMISSION_REGISTRY = {
  // Root collections
  settings: {
    read: (ctx) => true,
    update: (ctx) => ctx.user?.role === "admin",
  },

  // Component collections — resource key includes component prefix
  blog_posts: {
    read: (ctx) => true,
    create: (ctx) => ctx.user?.role === "editor",
    update: (ctx) => ctx.user?.role === "admin" || ctx.document?.authorId === ctx.user?.id,
    delete: (ctx) => ctx.user?.role === "admin",
  },
  blog_authors: {
    read: (ctx) => true,
    create: (ctx) => ctx.user?.role === "admin",
  },
  shop_products: {
    read: (ctx) => true,
    create: (ctx) => ctx.user?.role === "manager",
  },
};
```

**Key rule:** Resource keys for component collections are `"{component}_{collection}"` — e.g., `"blog_posts"`, `"shop_products"`. Root collections use bare slug — `"settings"`, `[USER_COLLECTION]`.

### `hasPermission` Usage with Component Collections

```ts
// In component function — resource key is "{component}_{collection}"
hasPermission(user, "blog_posts", "update", post);      // ✓
hasPermission(user, "shop_products", "create");          // ✓
hasPermission(user, "posts", "read");                    // ✗ — must include component prefix
```

---

## 4. Organization Support

### User Model with Org

```ts
// Root user collection — name configured by auth adapter (e.g., "users", "members", "accounts")
users: defineTable({
  name: v.string(),
  email: v.string(),
  role: v.string(),           // "admin", "editor", "viewer"
  orgId: v.optional(v.string()), // string org reference
})
  .index("by_org", ["orgId"]),
```

### Org-Scoped Permission Rules

```ts
defineComponent({
  name: "blog",
  collections: [
    defineCollection({
      slug: "posts",
      access: {
        // User can read posts in their own org
        read: ({ user, document }) =>
          !document.orgId || document.orgId === user?.orgId,

        // Admin can do anything in their org
        update: ({ user, document }) =>
          user?.role === "admin" && document.orgId === user?.orgId,
      },
    }),
  ],
});
```

### `hasPermission` with Org Context

```ts
function hasPermission(
  user: User,
  resource: string,
  action: Action,
  document?: Document,
  orgContext?: { orgId: string } // optional org override
): boolean {
  const rule = PERMISSION_REGISTRY[resource]?.[action];
  if (!rule) return false;

  // Inject org context into evaluation context
  return rule({ user, document, orgContext });
}
```

---

## 5. Multi-Repo Architecture

### The Setup

Apps live in separate repos. The admin panel is a standalone repo that manages all components.

```
Repos:
├── @maprios/root/           # Published npm package (root Convex component)
│   ├── convex/              # Root schema, auth, users, hasPermission, getUserById
│   └── package.json
│
├── maprios-admin/           # Admin panel + production deployment
│   ├── app/                 # Next.js admin UI
│   ├── convex/              # Root component (from @maprios/root)
│   ├── vex.config.ts        # Imports all component configs
│   └── package.json         # depends on @maprios/root, @maprios/blog-config, @maprios/app-config
│
├── maprios-www/             # Marketing site
│   ├── app/                 # Next.js frontend
│   ├── convex/              # Convex project root
│   │   ├── convex.config.js  # Mounts @maprios/root + local blog component
│   │   └── blog/            # Blog component (schema + functions)
│   │       ├── schema.ts
│   │       ├── functions/
│   │       └── convex.config.js
│   ├── vex.config.ts        # Blog component definition
│   └── package.json         # depends on @maprios/root, exports @maprios/blog-config
│
└── maprios-app/             # Main application
    ├── app/                 # Next.js frontend
    ├── convex/              # Convex project root
    │   ├── convex.config.js  # Mounts @maprios/root + local app component
    │   └── app/             # App component (schema + functions)
    ├── vex.config.ts        # App component definition
    └── package.json         # depends on @maprios/root, exports @maprios/app-config
```

### Why Next.js for Admin (Not Vite)

Keep the admin panel as **Next.js**, not Vite:

- **Better Auth integration** is Next.js-native (middleware, JWT, sessions)
- **SSR** eliminates loading spinners on initial admin load
- **Server components** prefetch dashboard data (collection counts, recent docs)
- **No benefit from Vite** — the admin panel is not a static marketing site; it needs auth, data fetching, dynamic routing
- **Deploy standalone** on Vercel (or any Next.js host) — already independent of app repos

### How Component Configs Flow to Admin

**Step 1: App repo exports its config**

```ts
// maprios-www/vex.config.ts
import { defineComponent, defineCollection } from "@vexcms/core";

export const blogComponent = defineComponent({
  name: "blog",
  label: "Blog",
  collections: [/* ... */],
  access: { /* ... */ },
});

// Also export Convex component for mounting
export { default as blogConvexComponent } from "./convex/blog/convex.config";
```

**Step 2: App repo publishes config package**

```json
// maprios-www/package.json
{
  "name": "@maprios/blog-config",
  "exports": {
    ".": "./vex.config.ts",
    "./convex": "./convex/blog/convex.config.js"
  }
}
```

**Step 3: Admin repo imports and assembles**

```ts
// maprios-admin/vex.config.ts
import { defineVexConfig } from "@vexcms/core";
import { blogComponent } from "@maprios/blog-config";
import { appComponent } from "@maprios/app-config";

export default defineVexConfig({
  collections: [
    // Root collections (if any)
  ],
  components: [blogComponent, appComponent],
});
```

```js
// maprios-admin/convex/convex.config.js
import { defineApp } from "convex/server";
import blog from "@maprios/blog-config/convex";
import app from "@maprios/app-config/convex";

const app = defineApp();
app.use(blog, { name: "blog" });
app.use(app, { name: "app" });
export default app;
```

**Step 4: Admin CLI generates unified schema + admin UI**

```bash
cd maprios-admin
pnpm vex dev
# Generates:
#   convex/schema.ts              (root schema)
#   convex/blog/schema.ts         (blog component schema)
#   convex/app/schema.ts          (app component schema)
#   convex/_generated/api.d.ts    (api.blog.*, api.app.*)
#   convex/_generated/permissions.ts  (unified PERMISSION_REGISTRY)
```

### Convex Deployment: Single Source of Truth

**Critical rule for production:** The `maprios-admin` repo is the **only repo that deploys to the shared production deployment.**

For development, each app repo runs `convex dev` against its own personal Convex deployment, using the shared `@maprios/root` package + local component code. Only the admin repo merges and deploys all components to the shared production deployment.

```
Shared Convex Deployment (managed by maprios-admin)
├── Root component
│   ├── users, sessions, accounts (Better Auth)
│   ├── auth/permissions.ts       (hasPermission + getUserById)
│   └── vex/                      (admin dispatcher queries)
├── Blog component (from @maprios/blog-config)
│   ├── posts, authors, media
│   └── functions/                (blog-specific queries/mutations)
└── App component (from @maprios/app-config)
    ├── [app-specific tables]
    └── functions/
```

### Development Workflow

**App developer (maprios-www):**

```bash
# 1. Install shared root component (one-time setup)
pnpm add @maprios/root

# 2. Start frontend dev server
pnpm dev              # Next.js frontend on localhost:3000

# 3. Start Convex dev server — pushes root + blog component to your dev deployment
pnpm convex dev       # Watches convex/ directory, syncs to personal Convex project

# 4. Frontend points to your dev deployment automatically
#    (NEXT_PUBLIC_CONVEX_URL set by convex dev)
```

The app repo runs `convex dev` naturally. The `convex/convex.config.js` mounts the shared `@maprios/root` component (from npm) alongside the local `blog` component. Both are pushed to the developer's personal Convex dev deployment.

**When ready to deploy to production:**
1. Commit + push
2. CI publishes `@maprios/blog-config@1.2.0` (Vex config + Convex component)
3. Admin repo CI picks up new version, runs `vex dev`, deploys to shared production deployment

**Why `@maprios/root` as an npm package?**
- Each app repo gets the same root component (users, auth, hasPermission) for local dev
- No code duplication — root is a shared dependency
- Versioned — admin repo and app repos use the same `@maprios/root` version
- `convex dev` in any repo pushes root + local components to that repo's dev deployment

### Keeping Schema with App Code

The `vex.config.ts` defining the component lives **in the app repo**:

```
maprios-www/
├── app/              # Next.js frontend — uses blog component data
├── convex/blog/      # Convex component — schema + functions
│   ├── schema.ts
│   ├── functions/
│   └── convex.config.js
├── vex.config.ts     # Component definition (collections, fields, access)
└── package.json      # Exports @maprios/blog-config
```

The schema definition stays with the app. The admin repo imports it as a package. No schema code in the admin repo — just assembly.

### Admin Panel Deployment

```bash
# maprios-admin deploy
vercel --prod           # Deploy Next.js admin to Vercel
npx convex deploy         # Deploy unified Convex components
```

The admin panel is a standalone Next.js app. It does NOT share a Vercel deployment with any app repo. It connects to the shared Convex deployment.

### Config Updates: Versioned, Not Live

Component configs are **build-time dependencies**, not runtime fetches:

1. `maprios-www` publishes `@maprios/blog-config@1.3.0`
2. `maprios-admin` maintainer runs: `pnpm up @maprios/blog-config`
3. Review generated schema diff in PR
4. Merge → deploy

This gives:
- **Type safety:** Admin panel builds with known schema. No runtime surprises.
- **Review gate:** Schema changes are visible in PR diffs before deploy.
- **Rollback:** Pin to previous package version if something breaks.

---

## 6. Summary: Key Design Rules

| Area | Rule |
|---|---|
| **hasPermission** | Pure function `(user, resource, action, document?) => boolean`. No `ctx`. Callable from any JS runtime. |
| **User fetch** | Root query `getUserById(userId: string)` returns user object. Components call via `ctx.runQuery`. |
| **User references** | Root: `v.id(USER_COLLECTION)` for native referential integrity. Components: `v.string()` for cross-component references. One-line change when moving collections. |
| **Component access** | Per-component `access` config in `defineComponent`. Compiled into unified `PERMISSION_REGISTRY`. |
| **Resource keys** | `"{component}_{collection}"` for components (e.g., `"blog_posts"`). Bare slug for root. |
| **Auth identity** | `ctx.auth.getUserIdentity()` works in ALL components. Returns `subject` = user ID string. |
| **Admin panel** | Next.js standalone. Imports component configs as npm packages. Single Convex deployment source of truth. |
| **App repos** | Export config + Convex component as npm packages. Do NOT deploy to shared Convex directly. |
| **Config updates** | Versioned npm publishes. Admin repo bumps, reviews, deploys. |

---

## 7. Open Questions for Future Specs

1. **Can Convex components import pure functions from root?** If yes, `hasPermission` is imported. If no, CLI generates copies per component.
2. **Org-level isolation:** Should `orgId` be a first-class Vex primitive (e.g., `defineCollection({ orgScoped: true })`)?
3. **Multi-repo local dev:** Should `vex dev` support `--component-only` mode for app repos to run isolated Convex locally?
4. **Admin panel dynamic components:** Should the admin panel ever support runtime-discovered components (not build-time)? This would require config-as-data, not config-as-code.
