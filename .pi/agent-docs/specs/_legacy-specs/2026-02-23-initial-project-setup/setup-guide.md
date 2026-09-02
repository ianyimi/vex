# Vex CMS Initial Project Setup Guide

A step-by-step guide for manually setting up the Vex CMS monorepo for development.

---

## Workspace Structure

```
vex.git/dev/                 # <-- workspace root
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── .npmrc
├── .gitignore
├── packages/
│   ├── tsconfig/            # @vexcms/tsconfig
│   ├── core/                # @vexcms/core (types, schema - no React)
│   ├── ui/                  # @vexcms/ui (shared React components)
│   ├── admin-next/          # @vexcms/admin-next (Phase 1)
│   └── admin-tanstack-start/# @vexcms/admin-tanstack-start (Phase 4)
├── apps/
│   └── test-app/            # z3 template + Vex
└── agent-os/                # Agent docs for LLMs (excluded from workspace)
    ├── product/
    ├── standards/
    └── specs/
```

---

## Prerequisites

- **Node.js 20+**
- **pnpm 9+** (must support `workspace:*` protocol)
- **Turborepo** (installed globally or via npx)

### Edge Cases

- Verify pnpm version with `pnpm --version`—older versions may not support workspace protocol correctly
- If using nvm/fnm, ensure correct Node version is active before running any commands

---

## 1. Root Monorepo Initialization

### Files to Create

#### pnpm-workspace.yaml

```yaml
packages:
  - "packages/*"
  - "apps/*"
```

#### .npmrc

```ini
shamefully-hoist=true
save-exact=true
strict-peer-dependencies=false
```

#### package.json

```json
{
  "name": "vexcms",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@vexcms/tsconfig": "workspace:*",
    "prettier": "^3.2.0",
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

#### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

#### .gitignore

```
# Dependencies
node_modules/

# Build outputs
dist/
.next/
.turbo/

# Environment
*.local
.env
.env.*

# IDE
.idea/
.vscode/

# OS
.DS_Store
```

### Edge Cases

| Issue | Solution |
|-------|----------|
| Existing `package.json` conflicts | Merge fields carefully; don't overwrite existing scripts |
| Git repo already initialized | Don't run `git init` again; just add new files |
| `agent-os/` folder | Automatically excluded—not in `packages/` or `apps/`, no package.json |

### Verification

- `pnpm install` runs without "workspace package not found" errors

---

## 2. @vexcms/tsconfig Package

### Files to Create

#### packages/tsconfig/package.json

```json
{
  "name": "@vexcms/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": ["*.json"]
}
```

#### packages/tsconfig/base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist"]
}
```

#### packages/tsconfig/react-library.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx"
  }
}
```

#### packages/tsconfig/nextjs.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

### Edge Cases

| Issue | Solution |
|-------|----------|
| Must be created first | Other packages depend on this via `workspace:*`—create before core/admin |
| `"private": true` required | This package is internal, not published to npm |
| `files` array | Must include `"*.json"` so configs are accessible |
| No `src/` folder needed | This package only contains JSON config files |
| No build step | Package.json has no `build` script—configs are used directly |

### Verification

- Package appears in `pnpm list` after install
- Other packages can extend configs without errors

---

## 3. @vexcms/core Package

### Files to Create

#### packages/core/package.json

```json
{
  "name": "@vexcms/core",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@vexcms/tsconfig": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

#### packages/core/tsconfig.json

```json
{
  "extends": "@vexcms/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

#### packages/core/tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
});
```

### Edge Cases

| Issue | Solution |
|-------|----------|
| `"type": "module"` required | Package uses ESM; without this, imports fail |
| tsup ESM output | Configure `format: ['esm']`—CJS not needed |
| `workspace:*` dependency | Must reference `@vexcms/tsconfig` via workspace protocol |
| Entry point | Must be `src/index.ts`, not `src/index.tsx` (no React in core) |
| Exports field | Define both `"."` export with `import` and `types` conditions |
| `publishConfig.access` | Set to `"public"` for npm publishing later |

### Minimal Exports (Phase A)

Only export:
- `VexConfig` interface
- `defineConfig()` function

Field types (`text()`, `number()`, etc.) come in Phase C.

### Verification

- `pnpm --filter @vexcms/core build` creates `dist/` folder
- `dist/index.js` and `dist/index.d.ts` both exist

---

## 4. @vexcms/ui Package

### Architecture: Shared React Components

The ui package contains shared React components used by both admin packages:
- **Primitives** — shadcn-based components (Button, Card, Input)
- **Form hooks** — useField, useForm (Legend State + TanStack Form)
- **Form fields** — TextField, SelectField, etc.
- **Layout** — Layout, Header (no routing)

```
packages/ui/                 # @vexcms/ui
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── src/
    ├── primitives/          # shadcn-based
    ├── forms/               # TanStack Form based
    ├── hooks/               # Legend State based
    ├── layout/              # Layout, Header (no routing)
    └── index.ts
```

**What's NOT in ui:**
- Routing components (Sidebar uses next/link or TanStack router)
- Server components (framework-specific)
- Data fetching logic

### Files to Create

#### packages/ui/package.json

```json
{
  "name": "@vexcms/ui",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vexcms/core": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@legendapp/state": "^3.0.0",
    "@tanstack/react-form": "^0.40.0",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vexcms/tsconfig": "workspace:*",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsup": "catalog:",
    "typescript": "catalog:"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

#### packages/ui/tsconfig.json

```json
{
  "extends": "@vexcms/tsconfig/react-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

#### packages/ui/tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
});
```

#### packages/ui/src/index.ts

```typescript
// Primitives
export { Button } from './primitives/Button';
export { Card } from './primitives/Card';
export { Input } from './primitives/Input';

// Hooks
export { useField } from './hooks/useField';
export { useForm } from './hooks/useForm';
export { useFormFields } from './hooks/useFormFields';

// Forms
export { FormProvider } from './forms/FormProvider';
export { TextField } from './forms/fields/TextField';
// ... other field exports

// Layout
export { Layout } from './layout/Layout';
export { Header } from './layout/Header';
```

### Edge Cases

| Issue | Solution |
|-------|----------|
| React as peerDependency | React must be `peerDependencies`, NOT `dependencies` |
| Legend State + TanStack Form | Both are devDependencies for build, bundled in dist |
| External packages | tsup config must mark `react`, `react-dom` as external |
| Pre-built package | Unlike admin-next, this package is compiled with tsup |

### Verification

- `pnpm --filter @vexcms/ui build` succeeds
- `dist/index.js` and `dist/index.d.ts` both exist
- No "react is not defined" errors (externals configured correctly)

---

## 5. @vexcms/admin-next Package

### Architecture: Framework-Specific Admin Package

The admin-next package provides Next.js-specific components and utilities. It does NOT contain routes — users add a single catch-all route that imports from this package.

```
packages/
├── ui/                      # @vexcms/ui (shared React)
├── admin-next/              # @vexcms/admin-next (Phase 1)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsup.config.ts
│   └── src/
│       ├── index.ts
│       ├── components/      # Next.js specific (Sidebar, AdminPage)
│       └── views/           # List, Edit, Dashboard views
│
└── admin-tanstack-start/    # @vexcms/admin-tanstack-start (Phase 4)
    └── ...
```

**What's in admin-next (not in ui):**
- Sidebar component (uses next/link, usePathname)
- AdminPage component (runtime routing based on config)
- Server components for data fetching
- Auth integration with Better Auth

**What's imported from ui:**
- Layout, Header, UserMenu
- All form components and hooks
- UI primitives

**How routing works:**
- User creates ONE catch-all route: `app/admin/[[...path]]/page.tsx`
- `AdminPage` component reads the path and `config.collections`
- Routes like `/admin/posts` or `/admin/posts/123` are handled at runtime
- Adding a collection to `vex.config.ts` automatically creates new "routes"

### Files to Create

#### packages/admin-next/package.json

```json
{
  "name": "@vexcms/admin-next",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vexcms/core": "workspace:*",
    "@vexcms/ui": "workspace:*"
  },
  "peerDependencies": {
    "next": ">=14.0.0",
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vexcms/tsconfig": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsup": "catalog:",
    "typescript": "catalog:"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

#### packages/admin-next/tsconfig.json

```json
{
  "extends": "@vexcms/tsconfig/react-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

#### packages/admin-next/tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next'],
  banner: {
    // Preserve "use client" directives in output
    js: '"use client";',
  },
});
```

#### packages/admin-next/src/index.ts

```typescript
// Main admin page component (runtime routing)
export { AdminPage } from './components/AdminPage';

// Layout components
export { Sidebar } from './components/Sidebar';

// Re-export shared layout from ui
export { Layout, Header } from '@vexcms/ui';
```

#### packages/admin-next/src/components/AdminPage.tsx

```typescript
'use client';

import type { VexConfig } from '@vexcms/core';

interface AdminPageProps {
  config: VexConfig;
  path?: string[];
}

export function AdminPage({ config, path = [] }: AdminPageProps) {
  const [collectionSlug, docId] = path;

  // Dashboard
  if (!collectionSlug) {
    return <DashboardView config={config} />;
  }

  // Find collection
  const collection = config.collections.find(c => c.slug === collectionSlug);
  if (!collection) {
    return <NotFoundView />;
  }

  // Edit view
  if (docId) {
    return <EditView config={config} collection={collection} docId={docId} />;
  }

  // List view
  return <ListView config={config} collection={collection} />;
}
```

#### packages/admin-next/src/components/Sidebar.tsx

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { VexConfig } from '@vexcms/core';

interface SidebarProps {
  config: VexConfig;
}

export function Sidebar({ config }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-gray-50 p-4">
      <nav className="space-y-1">
        <Link
          href="/admin"
          className={pathname === '/admin' ? 'font-bold' : ''}
        >
          Dashboard
        </Link>
        {config.collections.map((collection) => (
          <Link
            key={collection.slug}
            href={`/admin/${collection.slug}`}
            className={
              pathname.startsWith(`/admin/${collection.slug}`) ? 'font-bold' : ''
            }
          >
            {collection.labels?.plural ?? collection.slug}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

### Edge Cases

| Issue | Solution |
|-------|----------|
| `"use client"` directive | tsup banner adds it; also add manually to client components |
| React/Next as external | tsup config marks them external to avoid bundling |
| New collection not in sidebar | Config changes trigger rebuild; sidebar reads config at runtime |
| Path aliases don't work | Use relative imports (`./components/AdminPage`), not `@/` or `~/` |
| React version | Peer dep allows React 18+; devDeps use React 19 for testing |

### Component Architecture

| Component | Server/Client | Notes |
|-----------|---------------|-------|
| AdminPage | Client | Runtime routing based on path + config |
| Sidebar | Client | Uses `usePathname` hook |
| Layout | Server | From @vexcms/ui, composes layout |
| Header | Server | From @vexcms/ui, static |
| ListView | Client | Data fetching, table rendering |
| EditView | Client | Form rendering, mutations |

### Verification

- `pnpm --filter @vexcms/admin-next build` creates `dist/` folder
- `dist/index.js` and `dist/index.d.ts` both exist
- `pnpm --filter @vexcms/admin-next typecheck` passes
- No bundling errors for React/Next (marked as external)

---

## 6. Test App Setup

### Process

1. Create `apps/` folder
2. Run `pnpm create z3@latest test-app` inside `apps/`
3. Select: Next.js, email/password auth (simplest for testing)
4. Modify `apps/test-app/package.json` to add workspace deps
5. Create `apps/test-app/vex.config.ts`
6. Create admin route in `apps/test-app/src/app/admin/`

### Add Workspace Dependencies

Add these to `apps/test-app/package.json` dependencies:

```json
{
  "dependencies": {
    "@vexcms/core": "workspace:*",
    "@vexcms/admin-next": "workspace:*"
  }
}
```

**Note:** No `transpilePackages` needed — `@vexcms/admin-next` is pre-built with tsup.

### Route Structure

Only ONE route file needed — `AdminPage` handles runtime routing:

```
apps/test-app/src/app/
└── admin/
    ├── layout.tsx           # Admin layout with Layout + Sidebar
    └── [[...path]]/
        └── page.tsx         # Single catch-all, delegates to AdminPage
```

#### apps/test-app/src/app/admin/layout.tsx

```typescript
import { Layout, Sidebar } from '@vexcms/admin-next';
import config from '~/vex.config';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <Sidebar config={config} />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </Layout>
  );
}
```

#### apps/test-app/src/app/admin/[[...path]]/page.tsx

```typescript
import { AdminPage } from '@vexcms/admin-next';
import config from '~/vex.config';

interface Props {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: Props) {
  const { path } = await params;
  return <AdminPage config={config} path={path} />;
}
```

### Edge Cases

| Issue | Solution |
|-------|----------|
| create-z3 creates its own package.json | Modify existing, don't replace it |
| Workspace deps syntax | Must use `"@vexcms/core": "workspace:*"` |
| Convex setup | z3 handles this—don't duplicate Convex init |
| vex.config.ts import path | Use `~/vex.config` with path alias or relative path |
| New collection added | Sidebar auto-updates; AdminPage routes to it |

### Verification

- `pnpm install` from root recognizes test-app
- `pnpm --filter test-app dev` starts the app
- `http://localhost:3000/admin` shows Vex admin dashboard
- Collections from `vex.config.ts` appear in sidebar

---

## 7. Common Failure Modes

### Install Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Workspace package not found" | Package not in workspace | Check pnpm-workspace.yaml includes packages/* |
| "Cannot find module @vexcms/tsconfig" | tsconfig package missing | Create packages/tsconfig first |
| "Peer dependency not satisfied" | Missing peer deps | Install React/Next in test-app, not admin package |

### Build Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module '@vexcms/admin-next'" | Package not built | Run `pnpm build` from root first |
| "JSX element type does not have construct signatures" | Wrong tsconfig | Ensure react-library.json has `"jsx": "react-jsx"` |
| "Cannot use import statement outside module" | Missing "type": "module" | Add to package.json |
| Build order wrong | Missing ^build dependency | Check turbo.json dependsOn |

### Runtime Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot read property of undefined (reading 'collections')" | Config not passed | Ensure AdminPage receives config prop |
| 404 on /admin | Route not created | Create `apps/test-app/src/app/admin/[[...path]]/page.tsx` |
| Collection not in sidebar | Config not imported | Check vex.config.ts import path |

---

## 8. Verification Checklist

### Phase A Complete When:

- [ ] `pnpm install` succeeds (no workspace errors)
- [ ] `pnpm build` builds all packages
- [ ] `packages/core/dist/` contains index.js and index.d.ts
- [ ] `packages/ui/dist/` contains index.js and index.d.ts
- [ ] `packages/admin-next/dist/` contains index.js and index.d.ts
- [ ] No TypeScript errors in any package

### Phase B Complete When:

- [ ] Test app created with z3 template
- [ ] Workspace dependencies added to test-app
- [ ] `pnpm --filter test-app dev` starts without errors
- [ ] `http://localhost:3000` shows z3 app
- [ ] `http://localhost:3000/admin` shows Vex admin dashboard
- [ ] Collections from vex.config.ts appear in sidebar

---

## 9. Convex Schema Integration

After the admin shell is rendering, integrate with Convex using the two-file schema approach.

### Schema File Structure

```
apps/test-app/convex/
├── vex.schema.ts          # Auto-generated by Vex CLI (DO NOT EDIT)
├── schema.ts              # User-owned, imports from vex.schema.ts
└── vex/
    └── index.ts           # Admin CRUD handlers
```

### Step 1: Install CLI

Add the Vex CLI to your project:

```json
{
  "devDependencies": {
    "@vexcms/cli": "workspace:*"
  }
}
```

Add script to `apps/test-app/package.json`:

```json
{
  "scripts": {
    "vex:sync": "vex sync",
    "vex:sync:watch": "vex sync --watch"
  }
}
```

### Step 2: Run Initial Sync

```bash
pnpm --filter test-app vex:sync
```

This creates:
- `convex/vex.schema.ts` — Auto-generated table definitions
- `convex/schema.ts` — User-owned schema (if not exists)

### Step 3: Two-File Schema Approach

**File 1: `convex/vex.schema.ts`** (Auto-generated, DO NOT EDIT)

```typescript
// ⚠️ AUTO-GENERATED BY VEX - DO NOT EDIT
// Regenerated when vex.config.ts changes
// To customize tables, edit convex/schema.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const posts = defineTable({
  title: v.string(),
  slug: v.string(),
  author: v.id("users"),
})
  .index("by_slug", ["slug"]);

export const users = defineTable({
  name: v.string(),
  email: v.string(),
  role: v.string(),
});
```

**File 2: `convex/schema.ts`** (User-owned)

```typescript
import { defineSchema } from "convex/server";

// Import Vex-managed tables
import { posts, users } from "./vex.schema";

// Your custom tables (optional)
// import { analytics } from "./tables/analytics";

export default defineSchema({
  // Vex collections
  posts,
  users,

  // Add custom tables here
  // analytics,

  // Or extend Vex tables with additional indexes:
  // posts: posts.index("by_author", ["author"]),
});
```

### Step 4: Configure Auto-Update Behavior

In `vex.config.ts`:

```typescript
export default defineConfig({
  collections: [...],

  convex: {
    // true (default): CLI auto-updates schema.ts with new collections
    // false: CLI outputs manual instructions instead
    autoUpdateSchema: true,
  },
});
```

### Step 5: Watch Mode for Development

Run the sync command in watch mode during development:

```bash
# Terminal 1: Vex sync watch
pnpm --filter test-app vex:sync:watch

# Terminal 2: Next.js dev
pnpm --filter test-app dev

# Terminal 3: Convex dev
pnpm --filter test-app convex dev
```

When you modify `vex.config.ts`:
1. `vex sync --watch` detects the change
2. Regenerates `vex.schema.ts` with new table definitions
3. Updates `schema.ts` with new imports (if `autoUpdateSchema: true`)
4. Convex dev server picks up schema changes

### Edge Cases

| Issue | Solution |
|-------|----------|
| `vex.schema.ts` has local changes | Vex will overwrite—never edit this file |
| New collection not appearing | Run `vex sync` or check watch mode is running |
| `autoUpdateSchema: false` | CLI outputs instructions; manually add import |
| Schema parse error | Check `schema.ts` syntax; CLI shows line number |
| Table name conflict | Rename your custom table or Vex collection |

### Verification

- [ ] `vex sync` creates both schema files
- [ ] `convex dev` starts without schema errors
- [ ] Adding new collection to `vex.config.ts` updates `vex.schema.ts`
- [ ] If `autoUpdateSchema: true`, new collection appears in `schema.ts`

---

## Next Steps

After completing this setup:

1. **Style the admin shell** — Add Tailwind classes, use shadcn components
2. **Implement field system** — Follow `05-schema-field-system-spec.md`
3. **Add Convex handlers** — Follow `06-convex-integration-spec.md`
4. **Set up testing** — Follow `11-testing-strategy-spec.md` for test architecture
