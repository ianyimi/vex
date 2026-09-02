# Multi-Repo vs. Monorepo for Component VexCMS

> Analysis of whether component-based Vex projects can achieve the same developer experience as single-root projects, and whether npm publishing is the only path.

---

## The Core Question

Can a developer working on a component project (e.g., `maprios-www`) have the **exact same experience** as working in a single-root Vex project — with `convex dev`, auth, users table, and everything "just working" locally?

**Short answer:** Yes, but the mechanism depends on your repo structure. Monorepo gets you 95% of the way there. Multi-repo requires tradeoffs.

---

## What Convex Already Supports

Convex components are designed for two patterns:

| Pattern | How It Works | Code Sharing |
|---|---|---|
| **Local components** | `convex/blog/` directory inside a single repo. `convex.config.js` mounts it with `app.use(blog, { name: "blog" })`. | Same filesystem — no packaging needed. |
| **Published components** | npm package exports `defineComponent()`. Root project `npm install`s it and mounts it. | npm registry (or workspace link). |

There is **no third pattern** for sharing components across repos without some form of package delivery (npm, git submodules, or a shared filesystem). Convex's compiler expects component code to be resolvable at build time.

---

## Option 1: Monorepo (Recommended for Maprios)

### Structure

```
maprios/                      # Single git repo, pnpm workspaces
├── apps/
│   ├── www/                  # Next.js frontend + blog component
│   │   ├── app/
│   │   ├── convex/blog/      # Blog component (schema + functions)
│   │   └── package.json      # name: "@maprios/www"
│   ├── app/                  # Main application
│   │   ├── convex/app/       # App component
│   │   └── package.json      # name: "@maprios/app"
│   └── admin/                # Admin panel + root component
│       ├── app/              # Next.js admin UI
│       ├── convex/           # Root component (users, auth, vex system)
│       ├── convex/blog/      # symlink or workspace reference to ../www/convex/blog
│       ├── convex/app/       # symlink or workspace reference to ../app/convex/app
│       └── package.json      # name: "@maprios/admin"
├── packages/
│   └── root/                 # @maprios/root — shared root component (optional package)
│       └── convex/           # If root is extracted to a shared package
└── pnpm-workspace.yaml
```

### How `convex dev` Works

The developer runs `convex dev` from the **admin directory** (or any directory that has the full `convex/` tree):

```bash
cd apps/admin
pnpm convex dev
```

This watches:
- `convex/` — root component (local)
- `convex/blog/` — blog component (symlinked from `../www/convex/blog`)
- `convex/app/` — app component (symlinked from `../app/convex/app`)

All tables appear in the Convex dashboard. Auth works. Users table is there. The developer can query any table. It feels like a single project.

### Component Development Workflow

**Developer working on `maprios-www`:**

```bash
# Edit blog component code
cd apps/www
vim convex/blog/functions/posts.ts

# Run convex dev from admin (sees all components including your changes)
cd ../admin
pnpm convex dev

# Run frontend dev server
cd ../www
pnpm dev
```

**Key point:** The developer doesn't run `convex dev` from `apps/www/`. They run it from `apps/admin/` because that's where the full `convex/` tree lives. But all the files they edit are in `apps/www/` — they never touch admin code.

### Symlink vs. Workspace Link

Two ways to connect component directories to the admin repo:

**A. Filesystem symlinks (simplest):**

```bash
# In apps/admin/convex/
ln -s ../../www/convex/blog blog
ln -s ../../app/convex/app app
```

`convex dev` follows symlinks. No build step. No package.json changes. Just works.

**B. pnpm workspace links (cleaner):**

```json
// apps/admin/package.json
{
  "dependencies": {
    "@maprios/www": "workspace:*",
    "@maprios/app": "workspace:*"
  }
}
```

```js
// apps/admin/convex/convex.config.js
import { defineApp } from "convex/server";
import blog from "@maprios/www/convex/blog/convex.config.js";
import app from "@maprios/app/convex/app/convex.config.js";

const application = defineApp();
application.use(blog, { name: "blog" });
application.use(app, { name: "app" });
export default application;
```

pnpm resolves `workspace:*` to the local package. Convex compiler sees the files through the workspace link.

### Monorepo Tradeoffs

| ✅ Pros | ❌ Cons |
|---|---|
| No npm publishing. No versioning friction. | All code in one git repo. Larger repo. |
| `convex dev` sees all components. Natural debugging. | App developers must run `convex dev` from admin directory. |
| Symlinks or workspace links — zero config. | CI builds the whole monorepo. Slightly slower. |
| Root component is local code — editable by any dev. | Can't grant access to just one app directory (it's one repo). |
| One `pnpm install` at root. | Git history is shared across all apps. |

---

## Option 2: Multi-Repo with NPM Packages

### Structure

```
maprios-admin/                # Admin repo (separate git repo)
├── convex/                   # Root component
├── convex.config.js        # Mounts @maprios/blog, @maprios/app
├── package.json            # depends on @maprios/blog, @maprios/app
└── ...

maprios-www/                  # WWW repo (separate git repo)
├── convex/blog/            # Blog component
├── package.json            # name: "@maprios/blog", version: "1.2.0"
└── ...

maprios-app/                  # App repo (separate git repo)
├── convex/app/             # App component
├── package.json            # name: "@maprios/app", version: "3.1.0"
└── ...
```

### How `convex dev` Works for Component Developers

**The problem:** `maprios-www` developer can't run `convex dev` with just `convex/blog/`. They need a root component to mount it.

**Solution:** `@maprios/root` npm package.

```bash
# In maprios-www developer's machine
cd maprios-www
pnpm add @maprios/root        # Installs root component (users, auth, vex system)
```

```js
// maprios-www/convex/convex.config.js
import { defineApp } from "convex/server";
import { rootComponent } from "@maprios/root/convex";
import blog from "./convex/blog/convex.config.js";

const application = defineApp();
application.use(rootComponent, { name: "root" });
application.use(blog, { name: "blog" });
export default application;
```

```bash
pnpm convex dev
# Pushes: root component (from npm) + blog component (local)
# To developer's personal Convex dev deployment
```

**This works.** The developer has `convex dev`, auth, users table — everything. But:
- The root component is a **dependency**, not local code. If they need to change root auth, they can't from this repo.
- They must publish `@maprios/root` to npm (or use a private registry).
- They must publish `@maprios/blog` to npm when ready for admin deployment.

### Multi-Repo NPM Tradeoffs

| ✅ Pros | ❌ Cons |
|---|---|
| Clean separation. Each app is an independent repo. | NPM publishing required for every component. |
| App developers can truly own their repo. | Version drift — app uses `@maprios/root@1.2.0`, admin uses `@maprios/root@1.3.0`. |
| Can open-source individual components. | `convex dev` works, but root code is read-only (from npm). |
| CI/CD is simpler per repo. | Component developer must run `convex dev` from their repo with `@maprios/root` installed. |

---

## Option 3: Multi-Repo with Git Submodules

### Structure

```
maprios-admin/
├── .gitmodules               # Points to maprios-www, maprios-app
├── apps/www/                 # git submodule → maprios-www
│   └── convex/blog/          # Component code (from submodule)
├── apps/app/                 # git submodule → maprios-app
│   └── convex/app/           # Component code (from submodule)
├── convex/                   # Root component (local)
├── convex.config.js          # Mounts submodules
└── ...
```

### How It Works

The admin repo includes app repos as **git submodules**. The `convex.config.js` mounts components from the submodule directories.

App developers work in their own repo (`maprios-www`). When they push, the admin repo maintainer updates the submodule commit and deploys.

**Component developer experience:**
- Clone `maprios-www` independently → work on blog component
- OR: clone `maprios-admin` with `--recurse-submodules` → work on blog component inside admin repo
- Run `convex dev` from `maprios-admin/` (sees all components)

### Submodule Tradeoffs

| ✅ Pros | ❌ Cons |
|---|---|
| No npm publishing. | Submodules are painful to manage. |
| Admin repo has all files at build time. | Submodule sync is manual (`git submodule update`). |
| Component developers can work in their own repo or inside admin. | Easy to forget to update submodule before deploying. |
| Git history is separate per repo. | Merge conflicts across submodule boundaries are confusing. |

---

## Option 4: The "Single Convex Deployment" Model (No Components)

An alternative: don't use Convex components at all. Use a **single schema** with namespaced tables.

```ts
// convex/schema.ts (single schema, no components)
export default defineSchema({
  // Root tables
  users: defineTable({ ... }),
  sessions: defineTable({ ... }),
  
  // Blog tables — prefixed manually
  blog_posts: defineTable({ ... }),
  blog_authors: defineTable({ ... }),
  
  // App tables — prefixed manually
  app_projects: defineTable({ ... }),
  app_tasks: defineTable({ ... }),
});
```

**Vex config** defines "virtual components" (collections grouped by prefix):

```ts
export default defineVexConfig({
  components: [
    defineComponent({
      name: "blog",
      collections: [
        defineCollection({ slug: "blog_posts", fields: [...] }),
        defineCollection({ slug: "blog_authors", fields: [...] }),
      ],
    }),
    defineComponent({
      name: "app",
      collections: [
        defineCollection({ slug: "app_projects", fields: [...] }),
      ],
    }),
  ],
});
```

**Pros:**
- One schema, one deployment, no component boundaries
- `convex dev` works from any repo (they all point to the same deployment)
- No npm publishing, no symlinks, no submodules
- All repos share the same `convex/` directory (or pull it from a shared source)

**Cons:**
- No true schema isolation. Blog developer can accidentally modify app tables.
- Type-checking slowdown as schema grows (the original motivation for components).
- No native component API boundaries. All functions are in one namespace.
- Not future-proof for third-party plugins or published components.

This is essentially the **current Vex model** with manual namespacing. It works today. The question is whether the component model is worth the complexity.

---

## The Realistic Decision Matrix

| Scenario | Recommended | Why |
|---|---|---|
| **Single team, own all apps** | Monorepo (Option 1) | Zero friction. `convex dev` from admin. Symlinks. No publishing. |
| **Multiple teams, own apps** | Monorepo still | Use Nx or Turborepo with scoped permissions. Still easier than npm. |
| **Open-source components** | NPM (Option 2) | External users need `npm install`. This is the intended path. |
| **Agency / client separation** | NPM or Submodules | Clients shouldn't see each other's code. Clean boundaries. |
| **Prototyping / unsure** | Single namespace (Option 4) | Just prefix tables. Migrate to components later if needed. |

---

## The "Same Practice" Experience

### Monorepo (Option 1) — Developer on `maprios-www`:

```bash
cd maprios/apps/www
vim convex/blog/functions/posts.ts     # Edit component code

cd ../admin
pnpm convex dev                         # Run dev server (all components visible)
# → http://localhost:ConvexPort shows all tables: users, blog_posts, app_projects
# → Auth works. Dashboard shows everything. Same as single-root project.
```

**Feels like:** Working in a single project. The only difference is your files are in `apps/www/` instead of `apps/admin/`.

### Multi-Repo NPM (Option 2) — Developer on `maprios-www`:

```bash
cd maprios-www
vim convex/blog/functions/posts.ts     # Edit component code
pnpm convex dev                         # Run dev server (root from npm + local blog)
# → http://localhost:ConvexPort shows users (from npm), blog_posts (local)
# → Auth works. Dashboard shows root + blog tables.
```

**Feels like:** Working in a single project, but the root code is a dependency. You can read it (in node_modules), but editing it requires a PR to the root repo.

### Multi-Repo Submodules (Option 3) — Developer on `maprios-www`:

```bash
cd maprios-www
vim convex/blog/functions/posts.ts     # Edit component code
git push

cd ../maprios-admin
git submodule update --remote         # Pull latest blog component
cd apps/admin
pnpm convex dev                       # Run dev server (all components)
```

**Feels like:** Two-step workflow. Edit in your repo, then sync in admin repo. `convex dev` only shows everything in the admin repo.

---

## Recommendation for Maprios

**Start with monorepo + workspace links.** Here's why:

1. You own all three projects (www, app, insight). Same team. No need for hard boundaries.
2. You want to migrate from Payload → Vex. The migration is already complex. Don't add npm publishing to the critical path.
3. `convex dev` from admin sees all components. Debugging is natural.
4. Root component (auth, users) is local code. If you need to tweak auth while building the app, you can.
5. You can **extract to npm later** if needed. Start monorepo, extract components when they're stable and reusable.

### The Monorepo Workflow

```bash
# Initial setup
git clone maprios.git
cd maprios
pnpm install

# Develop www component
cd apps/www
vim convex/blog/functions/posts.ts

# Run full dev stack (from admin)
cd ../admin
pnpm convex dev     # Convex server — all components

# In another terminal
cd apps/www
pnpm dev            # Next.js frontend — points to admin's Convex dev URL

# Admin panel (in another terminal)
cd apps/admin
pnpm dev            # Admin panel — points to same Convex dev URL
```

All three apps (www, app, admin) point to the same Convex dev deployment. All components are visible. Auth works. It feels like one project.

### If You Need to Extract Later

```bash
# Extract blog component to npm (when stable and reusable)
cd apps/www
# Rename package: "@maprios/www" → "@maprios/blog"
# Extract just the convex/blog/ directory
# Publish to npm

# Admin repo switches to npm package:
# "@maprios/blog": "workspace:*" → "@maprios/blog": "^1.0.0"
```

Monorepo first. NPM later if the component needs to be reused independently.

---

## The Convex Reality Check

Convex components are designed for **sharing code** — either within a repo (local components) or across repos (published components). The compiler expects component code to be on disk at build time.

**What Convex does NOT support:**
- Runtime component discovery (no "fetch component schema from URL")
- Multi-repo deployment without shared files
- Component repos deploying directly to a shared deployment without an admin/integration repo

**What Convex DOES support natively:**
- `app.use(component)` mounting components from npm or local paths
- `convex dev` watching all mounted components
- Cross-component function calls via `ctx.runQuery(api.componentName.functionName)`
- Auth identity (`ctx.auth.getUserIdentity()`) in all components regardless of where they came from

The question isn't "can Convex do this?" — it's "how do you get the component files onto the developer's machine so `convex dev` can see them?" The answer is: workspace links (monorepo) or npm install (multi-repo).

---

## Open Question: Can Vex Hide the Symlink?

One future improvement: Vex CLI could generate the `convex.config.js` and symlinks automatically from `vex.config.ts`:

```ts
// maprios/apps/admin/vex.config.ts
export default defineVexConfig({
  components: [
    // Vex CLI resolves workspace packages and creates symlinks
    workspaceComponent("@maprios/www", { name: "blog", path: "convex/blog" }),
    workspaceComponent("@maprios/app", { name: "app", path: "convex/app" }),
  ],
});
```

`vex dev` would:
1. Resolve `@maprios/www` to `apps/www/` via pnpm workspace
2. Create symlink: `apps/admin/convex/blog/` → `apps/www/convex/blog/`
3. Generate `convex.config.js` mounting the symlinked component

This hides the symlink plumbing from the developer. They just declare workspace dependencies in `vex.config.ts` and Vex handles the rest.