# VexCMS v1 Rebuild - Master Guide

**Everything you need to know to rebuild VexCMS with the new architecture.**

---

## 📋 Table of Contents

1. [Quick Start: Running the Rebuild](#quick-start-running-the-rebuild)
2. [Architecture Overview](#architecture-overview)
3. [Package Responsibilities](#package-responsibilities)
4. [Convex Query Architecture](#convex-query-architecture)
5. [Development Workflow](#development-workflow)
6. [Critical Considerations](#critical-considerations)
7. [Timeline & Milestones](#timeline--milestones)

---

## Quick Start: Running the Rebuild

### Prerequisites

- You're on a branch (not master)
- You've read this document
- You understand the new architecture

### Execute Reset

```bash
# 1. Create branch
git checkout -b v1-rebuild

# 2. Run reset script
chmod +x scripts/rebuild-reset-preserve-cli-clear-templates.sh
./scripts/rebuild-reset-preserve-cli-clear-templates.sh

# 3. Update package versions to 0.1.0-alpha.1
node scripts/reset-packages.mjs

# 4. Configure changesets for alpha versioning
node scripts/setup-alpha-changesets.mjs

# 5. Update www app dependencies
node scripts/update-www-deps.mjs

# 6. Add ESLint + JSDoc enforcement
node scripts/add-eslint-deps.mjs

# 7. Fix CLI imports (package renames)
node scripts/fix-cli-imports.mjs

# 8. Install dependencies
pnpm install

# 9. Commit
git add -A
git commit -m "chore: reset for v1 rebuild (preserve CLI + adapters)"
git push origin v1-rebuild
```

**Time:** ~5 minutes

### What You'll Have

✅ **Preserved:**

- CLI (~2,100 LOC) - Working `vex dev` command
- create-vexcms scaffolder (~800 LOC) - Templates cleared
- storage-convex (~95 LOC) - Stable adapter
- richtext-plate (~2,936 LOC) - Test in Week 5
- All infrastructure (turbo, tsconfig, pnpm workspace)

✅ **Cleared for Rebuild:**

- core - Ready for field types + helpers
- react - Ready for admin UI
- next - Ready for SSR integration
- better-auth - Ready for auth adapter rebuild

✅ **Archived:**

- Tests in `.rebuild/archived-tests/`
- Reference code in `.rebuild/reference/`

---

## Architecture Overview

### Core Principles

1. **Framework-agnostic core** - Zero React/Next.js dependencies
2. **Generic helpers** - Avoid repetitive switch statements
3. **Type-safe components** - Generic types throughout
4. **Centralized Convex queries** - Core owns data fetching logic

### Package Hierarchy

```
┌─────────────────────────────────────────────────────┐
│ User's App (apps/www)                               │
│                                                     │
│ app/admin/layout.tsx:                               │
│   import { AdminLayout } from '@vexcms/next'        │
│   export default ({ children }) =>                  │
│     <AdminLayout>{children}</AdminLayout>           │
│                                                     │
│ app/admin/[...slug]/page.tsx:                       │
│   import { AdminPage } from '@vexcms/next'          │
│   export default ({ params }) =>                    │
│     <AdminPage slug={params.slug} />                │
│                                                     │
│ That's it! Zero boilerplate. ✅                     │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Next.js Package (@vexcms/next)                      │
│ - AdminPage (routing + preloading)                  │
│ - AdminLayout (navigation)                          │
│ - Wires React views with Next.js components         │
│ - Handles all Convex preloadQuery calls             │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ React Package (@vexcms/react)                       │
│ - Admin views (accept initialData + components)     │
│ - Column factories                                  │
│ - Form components                                   │
│ - Data hooks (useQuery wrappers)                    │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Core Package (@vexcms/core)                         │
│ - Field types + helpers                             │
│ - Config builders                                   │
│ - Convex query/mutation definitions                 │
│ - Schema generation                                 │
│ - Permissions                                       │
└─────────────────────────────────────────────────────┘
```

---

## Package Responsibilities

### 📦 Core Package (`@vexcms/core`)

**Purpose:** Framework-agnostic foundation

**Exports:**

- Field type definitions and factories
- Generic field helpers (no switch statements needed)
- Convex query/mutation definitions
- Config builders
- Schema generation
- Permissions
- Type utilities

**Dependencies:**

- `zod` - Validation
- `convex` - Convex runtime
- **NO React, NO framework code**

**Key Files:**

```
packages/core/src/
├── fields/
│   ├── text/
│   │   ├── index.ts            # Re-exports + field factory
│   │   ├── config.ts           # TextFieldDef type + text() factory
│   │   ├── helpers.ts          # Field-specific helpers
│   │   ├── schemaValueType.ts  # Convex schema value type
│   │   └── *.test.ts           # Tests
│   ├── number/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── helpers.ts
│   │   ├── schemaValueType.ts
│   │   └── *.test.ts
│   ├── relationship/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── helpers.ts
│   │   ├── schemaValueType.ts
│   │   └── *.test.ts
│   ├── ... (all 19 field types)
│   ├── index.ts                # Barrel export
│   ├── constants.ts            # Shared constants
│   └── helpers.ts              # Generic helpers (getFieldLabel, etc.)
├── convex/
│   ├── queries.ts              # Generic Convex queries
│   ├── mutations.ts            # Generic Convex mutations
│   └── runtime.ts              # Runtime helpers (getDocument, etc.)
├── config/
│   ├── defineConfig.ts         # Config builder
│   └── defineCollection.ts     # Collection builder
├── schema/
│   └── generateVexSchema.ts    # Schema generation
├── permissions/
│   └── hasPermission.ts        # Permission checking
└── validation/
    └── framework.ts            # defineFrameworkPackage
```

**Field Folder Structure (mirrors old version):**

- `config.ts` - Field type definition and factory function
- `helpers.ts` - Field-specific helpers (getTextFieldLabel, formatTextCellValue, etc.)
- `schemaValueType.ts` - Convex schema value type converter
- `index.ts` - Re-exports everything from folder
- `*.test.ts` - Tests

**Changes from old version:**

- ❌ Remove `columnDef.tsx` - Moves to react package
- ➕ Add `helpers.ts` - New file for field-specific helpers
- ✅ Keep `config.ts`, `schemaValueType.ts`, `index.ts` - Same as before

**Critical Changes:**

- ❌ Remove columnDef files (never existed in core, stay in frameworks)
- ➕ Add generic helpers (`getFieldLabel`, `formatFieldCellValue`, etc.)
- ➕ Add Convex query/mutation exports
- ✅ Ensure zero framework dependencies

---

### 📦 React Package (`@vexcms/react`)

**Purpose:** React admin UI components

**Exports:**

- Admin views (Dashboard, List, Edit, etc.)
- Column factories (createTextColumn, etc.)
- Form components (TextField, NumberField, etc.)
- Data hooks (useCollectionDocuments, etc.)
- Component implementations (VexLink, VexImage, etc.)
- Type-safe field re-exports

**Dependencies:**

- `@vexcms/core` - Field types and helpers
- `react`, `react-dom` - React framework
- `@tanstack/react-table` - Table library
- `convex/react` - Convex React hooks
- UI library (shadcn/ui, etc.)

**Key Files:**

```
packages/react/src/
├── fields.ts                   # Re-exports with ReactComponent type
├── admin/
│   ├── views/
│   │   ├── DashboardView.tsx   # Dashboard (accepts initialData)
│   │   ├── ListView.tsx        # Collection list (accepts initialData)
│   │   ├── EditView.tsx        # Create/edit form (accepts initialData)
│   │   ├── MediaListView.tsx   # Media library (accepts initialData)
│   │   └── ...
│   └── columns/
│       ├── text.tsx            # Text column factory
│       ├── number.tsx          # Number column factory
│       ├── relationship.tsx    # Relationship column factory
│       └── ...
├── components/
│   ├── VexLink.tsx             # Default Link (fallback)
│   ├── VexImage.tsx            # Default Image (fallback)
│   └── ...
├── forms/
│   ├── TextField.tsx           # Text form field
│   ├── NumberField.tsx         # Number form field
│   └── ...
└── hooks/
    ├── useCollectionDocuments.ts  # Wrapper for core Convex query
    ├── useDocument.ts             # Wrapper for core Convex query
    └── ...
```

**View Component Pattern (Accepts initialData):**

```typescript
// packages/react/src/admin/views/ListView.tsx
export function ListView({
  collection,
  components,
  initialData  // ← SSR frameworks pass preloaded data here
}: {
  collection: string
  components: {
    Link: ReactComponent
    Image: ReactComponent
  }
  initialData?: PreloadedQueryResult
}) {
  // Use initialData if provided (SSR), otherwise fetch client-side
  const { documents, isLoading } = useCollectionDocuments(
    collection,
    { limit: 50 },
    { initialData }  // ← Convex supports initialData pattern
  )

  // Render table with columns
  return <DataTable columns={/* ... */} data={documents} />
}
```

**Critical Changes:**

- ➕ Create column factories (using core helpers)
- ➕ Build admin views
- ➕ Wrap core Convex queries with React hooks
- ➕ Re-export field factories with `ReactComponent` type
- ✅ Use generic helpers from core (avoid switch statements)

---

### 📦 Next.js Package (`@vexcms/next`)

**Purpose:** Next.js SSR integration

**Exports:**

- `AdminPage` - Smart page component (handles routing + preloading)
- `AdminLayout` - Layout component (navigation wrapper)
- Component adapters (VexLink, VexImage - for advanced usage)

**What users import:**

```typescript
import { AdminLayout, AdminPage } from "@vexcms/next";
```

**Users don't need to:**

- ❌ Write preloading logic
- ❌ Handle routing logic
- ❌ Wire component adapters
- ❌ Pass initialData manually
- ✅ Just import and render!

**Dependencies:**

- `@vexcms/core` - Convex queries, types
- `@vexcms/react` - Admin UI components
- `next` - Next.js framework
- `convex/server` - Convex SSR

**Key Files:**

```
packages/next/src/
├── components/
│   ├── VexLink.tsx             # next/link adapter
│   ├── VexImage.tsx            # next/image adapter
│   ├── AdminLayout.tsx         # Layout component (users import this)
│   └── AdminPage.tsx           # Smart page component (users import this)
└── lib/
    └── preloadAdminData.ts     # Data preloading helper
```

**AdminPage Component (Server Component with preloading):**

````typescript
// packages/next/src/components/AdminPage.tsx
import { preloadQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import {
  DashboardView as ReactDashboardView,
  ListView as ReactListView,
  EditView as ReactEditView
} from '@vexcms/react'
import { VexLink, VexImage } from './index'

const components = { Link: VexLink, Image: VexImage }

/**
 * Smart admin page component that handles routing and data preloading.
 * Users import this in their catch-all admin route.
 *
 * @example
 * ```typescript
 * // app/admin/[...slug]/page.tsx
 * import { AdminPage } from '@vexcms/next'
 *
 * export default function AdminCatchAll({ params }) {
 *   return <AdminPage slug={params.slug} />
 * }
 */
export async function AdminPage({ slug }: { slug: string[] }) {
  // Route to correct view based on slug
  const [route, collection, documentId] = slug || []

  // Dashboard view
  if (!route) {
    const initialData = await preloadQuery(api.vex.getDashboardStats, {})
    return <ReactDashboardView initialData={initialData} components={components} />
  }

  // Collection list view
  if (route && !documentId) {
    const initialData = await preloadQuery(api.vex.listDocuments, {
      collection: route,
      limit: 50
    })
    return <ReactListView
      collection={route}
      initialData={initialData}
      components={components}
    />
  }

  // Document edit view
  if (route && documentId) {
    const initialData = await preloadQuery(api.vex.getDocument, {
      collection: route,
      id: documentId
    })
    return <ReactEditView
      collection={route}
      documentId={documentId}
      initialData={initialData}
      components={components}
    />
  }

  return <div>Not Found</div>
}
````

**AdminLayout Component:**

````typescript
// packages/next/src/components/AdminLayout.tsx
import { VexLink } from './VexLink'

/**
 * Admin layout component with navigation.
 * Users import this to wrap their admin routes.
 *
 * @example
 * ```typescript
 * // app/admin/layout.tsx
 * import { AdminLayout } from '@vexcms/next'
 *
 * export default function Layout({ children }) {
 *   return <AdminLayout>{children}</AdminLayout>
 * }
 * ```
 */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <nav>
        <VexLink href="/admin">Dashboard</VexLink>
        {/* Navigation links */}
      </nav>
      <main>{children}</main>
    </div>
  )
}
````

**User's Admin Routes:**

```typescript
// apps/www/src/app/admin/layout.tsx
import { AdminLayout } from '@vexcms/next'

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>
}

// apps/www/src/app/admin/[...slug]/page.tsx
import { AdminPage } from '@vexcms/next'

export default function AdminCatchAll({ params }) {
  return <AdminPage slug={params.slug} />
}
```

**That's it!** Users just import and render - all preloading, routing, and component wiring handled by Next package.

**Critical Changes:**

- ➕ Create component adapters (Next.js → Vex interface)
- ➕ Build AdminPage component that handles routing + preloading
- ➕ Build AdminLayout component for admin navigation
- ➕ Wire React views with Next.js components pre-filled
- ✅ Users just import and render - zero boilerplate

**Usage in User's App:**

```typescript
// apps/www/src/app/admin/layout.tsx
import { AdminLayout } from '@vexcms/next'

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>
}

// apps/www/src/app/admin/[...slug]/page.tsx
import { AdminPage } from '@vexcms/next'

export default function AdminCatchAll({ params }) {
  return <AdminPage slug={params.slug} />
}
```

**AdminPage handles:**

- ✅ Routing (dashboard, list, edit, media based on slug)
- ✅ Data preloading (uses Convex preloadQuery internally)
- ✅ Component wiring (VexLink, VexImage already passed to React views)
- ✅ Initial data passing (React views get preloaded data)

---

### 📦 Better Auth Package (`@vexcms/better-auth`)

**Purpose:** Better Auth integration adapter

**Status:** Rebuild in Week 3 (after core field types done)

**Why Rebuild:**

- Current implementation tightly coupled to old field type system
- Mapping logic in `extractAuthCollections()` needs to use new helpers

**Size:** ~635 LOC (330 implementation, 305 tests)

**Timing:** Week 3 (~1-2 days)

**Strategy:**

1. Archive to `.rebuild/reference/better-auth/`
2. Port tests from `.rebuild/archived-tests/better-auth/`
3. Rebuild using new field type helpers
4. Verify with better-auth schema output

---

### 📦 Storage Convex Package (`@vexcms/storage-convex`)

**Purpose:** Convex file storage adapter

**Status:** Preserved (test in Week 9)

**Why Preserve:**

- Only 95 LOC
- Depends on stable `FileStorageAdapter` interface
- Very low risk of breakage

---

### 📦 Richtext Plate Package (`@vexcms/richtext-plate`)

**Purpose:** Plate.js rich text editor adapter

**Status:** Preserved (test in Week 5)

**Why Preserve:**

- 2,936 LOC (large codebase)
- Complex Plate.js integration
- Zero tests (hard to verify rebuild)
- Editor adapter interface less likely to change

**Decision Point:** Week 5

- ✅ If works → ship in 0.1.0
- ❌ If broken → rebuild or defer to 0.2.0

---

## Convex Query Architecture

### 🔑 Key Innovation: Centralized Queries in Core

**Problem:** Currently, CLI generates Convex function files for each collection. This creates:

- Code duplication (every collection gets similar CRUD functions)
- Maintenance burden (changes require regeneration)
- Type safety issues (generated code can drift)

**Solution:** Core package exports generic Convex queries that work for any collection.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ User's convex/ directory                            │
│ - Imports queries from @vexcms/core/convex          │
│ - Re-exports for Convex to discover                 │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Core Package (@vexcms/core/convex)                  │
│ - Generic queries (listDocuments, getDocument, etc.)│
│ - Generic mutations (createDocument, etc.)          │
│ - Runtime helpers                                   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Framework Packages (@vexcms/react, @vexcms/next)    │
│ - Call core queries with collection name            │
│ - React: useQuery(api.vex.listDocuments, {...})     │
│ - Next.js: preloadQuery(api.vex.listDocuments, ...) │
└─────────────────────────────────────────────────────┘
```

### Core Package: Generic Queries

```typescript
// packages/core/src/convex/queries.ts

import { query } from "convex/server";
import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";

/**
 * Generic query to list documents from any collection.
 * Handles pagination, filtering, and permissions.
 */
export const listDocuments = query({
  args: {
    collection: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    filters: v.optional(v.any()),
    sortBy: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    // Permission check
    const hasAccess = await hasPermission(ctx, {
      collection: args.collection,
      action: "read",
    });
    if (!hasAccess) {
      throw new Error(`No permission to read ${args.collection}`);
    }

    // Query with pagination
    const query = ctx.db
      .query(args.collection)
      .order(args.sortOrder === "desc" ? "desc" : "asc");

    // Apply filters
    // ... filter logic

    const documents = await query.take(args.limit ?? 50).collect();

    return {
      documents,
      cursor:
        documents.length === (args.limit ?? 50)
          ? documents[documents.length - 1]._id
          : null,
    };
  },
});

/**
 * Generic query to get a single document by ID.
 */
export const getDocument = query({
  args: {
    collection: v.string(),
    id: v.id("any"), // Will be validated against collection at runtime
  },
  handler: async (ctx, args) => {
    // Permission check
    const hasAccess = await hasPermission(ctx, {
      collection: args.collection,
      action: "read",
      documentId: args.id,
    });
    if (!hasAccess) {
      throw new Error(`No permission to read document`);
    }

    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error(`Document not found`);
    }

    return doc;
  },
});

/**
 * Generic query for search (if collection has search index).
 */
export const searchDocuments = query({
  args: {
    collection: v.string(),
    searchField: v.string(),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Permission check
    const hasAccess = await hasPermission(ctx, {
      collection: args.collection,
      action: "read",
    });
    if (!hasAccess) {
      throw new Error(`No permission to search ${args.collection}`);
    }

    const results = await ctx.db
      .query(args.collection)
      .withSearchIndex(args.searchField, (q) =>
        q.search(args.searchField, args.searchTerm),
      )
      .take(args.limit ?? 50)
      .collect();

    return results;
  },
});
```

### Core Package: Generic Mutations

```typescript
// packages/core/src/convex/mutations.ts

import { mutation } from "convex/server";
import { v } from "convex/values";

/**
 * Generic mutation to create a document.
 */
export const createDocument = mutation({
  args: {
    collection: v.string(),
    data: v.any(), // Validated against schema at runtime
  },
  handler: async (ctx, args) => {
    // Permission check
    const hasAccess = await hasPermission(ctx, {
      collection: args.collection,
      action: "create",
    });
    if (!hasAccess) {
      throw new Error(`No permission to create ${args.collection}`);
    }

    // Validate data against schema
    // ... validation logic

    // Insert document
    const id = await ctx.db.insert(args.collection, args.data);

    return { id };
  },
});

/**
 * Generic mutation to update a document.
 */
export const updateDocument = mutation({
  args: {
    collection: v.string(),
    id: v.id("any"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Permission check
    const hasAccess = await hasPermission(ctx, {
      collection: args.collection,
      action: "update",
      documentId: args.id,
    });
    if (!hasAccess) {
      throw new Error(`No permission to update document`);
    }

    // Update document
    await ctx.db.patch(args.id, args.data);

    return { success: true };
  },
});

/**
 * Generic mutation to delete a document.
 */
export const deleteDocument = mutation({
  args: {
    collection: v.string(),
    id: v.id("any"),
  },
  handler: async (ctx, args) => {
    // Permission check
    const hasAccess = await hasPermission(ctx, {
      collection: args.collection,
      action: "delete",
      documentId: args.id,
    });
    if (!hasAccess) {
      throw new Error(`No permission to delete document`);
    }

    // Delete document
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
```

### User's Convex Directory: Re-exports

CLI generates minimal re-export files:

```typescript
// convex/vex/index.ts (generated by CLI)
/**
 * VexCMS generic Convex queries and mutations.
 * These are imported from @vexcms/core and re-exported
 * so Convex can discover them.
 */

export {
  listDocuments,
  getDocument,
  searchDocuments,
} from "@vexcms/core/convex/queries";

export {
  createDocument,
  updateDocument,
  deleteDocument,
} from "@vexcms/core/convex/mutations";

// Note: Convex requires functions to be in your convex/ directory
// to deploy them. This file re-exports core's functions so they
// can be deployed with your app.
```

**Benefits:**

- ✅ Single source of truth (queries defined once in core)
- ✅ Type-safe (TypeScript validates everything)
- ✅ Easy to maintain (update core, all apps get it)
- ✅ No code generation needed (just re-exports)
- ✅ Framework-agnostic (React and Svelte use same queries)

### React Package: Data Hooks

```typescript
// packages/react/src/hooks/useCollectionDocuments.ts

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

export function useCollectionDocuments(
  collection: string,
  options?: {
    limit?: number;
    cursor?: string;
    filters?: any;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
) {
  return useQuery(api.vex.listDocuments, {
    collection,
    ...options,
  });
}

export function useDocument(collection: string, id: string) {
  return useQuery(api.vex.getDocument, { collection, id });
}

export function useSearchDocuments(
  collection: string,
  searchField: string,
  searchTerm: string,
) {
  return useQuery(api.vex.searchDocuments, {
    collection,
    searchField,
    searchTerm,
  });
}
```

### CLI Updates

```typescript
// packages/cli/src/lib/generateConvexFiles.ts

/**
 * Generates minimal re-export file for Convex functions.
 * Core owns the actual query/mutation logic.
 */
export function generateConvexReExports() {
  return `
/**
 * VexCMS Convex functions.
 * Re-exported from @vexcms/core so Convex can deploy them.
 */

export {
  listDocuments,
  getDocument,
  searchDocuments
} from '@vexcms/core/convex/queries'

export {
  createDocument,
  updateDocument,
  deleteDocument
} from '@vexcms/core/convex/mutations'
`.trim();
}
```

---

## Development Workflow

### Week 1-2: Core Field Types + Helpers

**Goal:** Implement all 19 field types with generic helpers

```bash
cd packages/core

# 1. Create field folder
mkdir -p src/fields/text

# 2. Implement field config
cat > src/fields/text/config.ts << 'EOF'
/**
 * Text field type definition.
 */
export interface TextFieldDef<TComponent = unknown> {
  type: 'text'
  label?: string
  required?: boolean
  defaultValue?: string
  admin?: {
    cellAlignment?: 'left' | 'center' | 'right'
    hidden?: boolean
    readOnly?: boolean
    components?: {
      Cell?: TComponent
      Edit?: TComponent
    }
  }
}

/**
 * Creates a text field definition.
 */
export function text<TComponent = unknown>(
  options?: Omit<TextFieldDef<TComponent>, 'type'>
): TextFieldDef<TComponent> {
  return { type: 'text', ...options }
}
EOF

# 3. Implement field-specific helpers
cat > src/fields/text/helpers.ts << 'EOF'
import type { TextFieldDef } from './config'
import { toTitleCase } from '../../utils'

/**
 * Gets the display label for a text field.
 */
export function getTextFieldLabel(
  field: TextFieldDef,
  fieldKey: string
): string {
  return field.label ?? toTitleCase(fieldKey)
}

/**
 * Formats a text field value for display in table cell.
 */
export function formatTextCellValue(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  return str.length > 80 ? `${str.slice(0, 77)}...` : str
}

/**
 * Validates a text field value.
 */
export function validateTextValue(
  value: unknown,
  field: TextFieldDef
): string | null {
  if (field.required && !value) {
    return `${field.label ?? 'This field'} is required`
  }
  return null
}
EOF

# 4. Implement schema value type
cat > src/fields/text/schemaValueType.ts << 'EOF'
import { v } from 'convex/values'
import type { TextFieldDef } from './config'

/**
 * Converts text field to Convex schema value type.
 */
export function textToValueType(field: TextFieldDef) {
  let valueType = v.string()
  if (!field.required) {
    valueType = v.optional(valueType)
  }
  return valueType
}
EOF

# 5. Create index file
cat > src/fields/text/index.ts << 'EOF'
export * from './config'
export * from './helpers'
export * from './schemaValueType'
EOF

# 6. Add to generic helpers
# Edit src/fields/helpers.ts to add text case to switch statements

# 7. Port tests
cp ../../.rebuild/archived-tests/core/text.test.ts src/fields/text/config.test.ts

# 8. Run test
pnpm test

# 9. Lint (JSDoc required)
pnpm lint

# 10. Commit
git add .
git commit -m "feat(core): implement text field type"
pnpm changeset
```

**Repeat for all 19 field types:**

- text, number, checkbox, select, date
- relationship, richtext, array, object, json
- upload, blocks, color, imageUrl
- ui, tabs

**Each field folder contains:**

- `config.ts` - Type definition + factory function
- `helpers.ts` - Field-specific helpers
- `schemaValueType.ts` - Convex schema converter
- `index.ts` - Re-exports
- `*.test.ts` - Tests

### Week 3: Core Convex Queries + Better Auth

**Goal:** Implement generic Convex queries and rebuild better-auth

```bash
# Convex queries
cd packages/core/src/convex

cat > queries.ts << 'EOF'
export const listDocuments = query({ /* ... */ })
export const getDocument = query({ /* ... */ })
export const searchDocuments = query({ /* ... */ })
EOF

cat > mutations.ts << 'EOF'
export const createDocument = mutation({ /* ... */ })
export const updateDocument = mutation({ /* ... */ })
export const deleteDocument = mutation({ /* ... */ })
EOF

# Better auth
cd ../../better-auth
# Rebuild extractAuthCollections using new field helpers
# Port tests from .rebuild/archived-tests/better-auth/
```

### Week 4: Core Completion

**Goal:** Finish schema generation, permissions, validation

```bash
cd packages/core

# Schema generation
# Edit src/schema/generateVexSchema.ts

# Permissions
# Edit src/permissions/hasPermission.ts

# Framework validation
# Edit src/validation/framework.ts
```

### Week 5-6: React Package

**Goal:** Build admin UI components and column factories

```bash
cd packages/react

# 1. Re-export field factories with types
cat > src/fields.ts << 'EOF'
import * as core from '@vexcms/core'
export function text(options): TextFieldDef<ReactComponent> {
  return core.text<ReactComponent>(options)
}
EOF

# 2. Create column factories
cat > src/admin/columns/text.tsx << 'EOF'
import { getTextFieldLabel, formatTextCellValue } from '@vexcms/core/fields/text'

export function createTextColumn(fieldKey, field) {
  return {
    header: getTextFieldLabel(field, fieldKey),
    cell: ({ getValue }) => formatTextCellValue(getValue())
  }
}
EOF

# 3. Build admin views (accept initialData for SSR)
cat > src/admin/views/ListView.tsx << 'EOF'
import { useCollectionDocuments } from '../../hooks/useCollectionDocuments'

export interface ListViewProps {
  collection: string
  components: {
    Link: ReactComponent
    Image: ReactComponent
  }
  initialData?: PreloadedQueryResult  // ← SSR frameworks pass preloaded data
}

export function ListView({ collection, components, initialData }: ListViewProps) {
  // Use initialData if provided (SSR), otherwise fetch client-side
  const { documents, isLoading } = useCollectionDocuments(
    collection,
    { limit: 50 },
    { initialData }  // ← Convex supports initialData pattern
  )

  // Generate columns using core helpers
  const columns = generateColumnsForCollection(collection, components)

  return <DataTable columns={columns} data={documents} isLoading={isLoading} />
}
EOF

# Repeat for EditView, DashboardView, etc.

# 4. Create data hooks
cat > src/hooks/useCollectionDocuments.ts << 'EOF'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export function useCollectionDocuments(collection, options) {
  return useQuery(api.vex.listDocuments, { collection, ...options })
}
EOF

# 5. Define framework package
cat > src/index.ts << 'EOF'
import { defineFrameworkPackage } from '@vexcms/core/validation'

export const reactFramework = defineFrameworkPackage<ReactComponent, ReactView>({
  views: { DashboardView, ListView, EditView, /* ... */ },
  components: { Link: VexLink, Image: VexImage, /* ... */ }
})
EOF

# 6. TEST RICHTEXT-PLATE INTEGRATION (Week 5)
# Try using richtext field in a form
# If works → keep for 0.1.0
# If broken → note issues, defer to 0.2.0
```

### Week 7-8: Next.js Package

**Goal:** Build AdminPage and AdminLayout that users can import

```bash
cd packages/next

# 1. Create component adapters
cat > src/components/VexLink.tsx << 'EOF'
import NextLink from 'next/link'

export function VexLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <NextLink href={href}>{children}</NextLink>
}
EOF

cat > src/components/VexImage.tsx << 'EOF'
import NextImage from 'next/image'

export function VexImage({ src, alt, width, height }: ImageProps) {
  return <NextImage src={src} alt={alt} width={width} height={height} />
}
EOF

# 2. Build AdminLayout (navigation wrapper)
cat > src/components/AdminLayout.tsx << 'EOF'
import { VexLink } from './VexLink'

/**
 * Admin layout with navigation.
 * Users import this in their admin/layout.tsx
 */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <nav>
        <VexLink href="/admin">Dashboard</VexLink>
        {/* Navigation will be generated from config */}
      </nav>
      <main>{children}</main>
    </div>
  )
}
EOF

# 3. Build AdminPage (smart routing + preloading)
cat > src/components/AdminPage.tsx << 'EOF'
import { preloadQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import {
  DashboardView as ReactDashboardView,
  ListView as ReactListView,
  EditView as ReactEditView
} from '@vexcms/react'
import { VexLink, VexImage } from './index'

const components = { Link: VexLink, Image: VexImage }

/**
 * Smart admin page component.
 * Handles routing, preloading, and component wiring.
 * Users import this in their admin/[...slug]/page.tsx
 */
export async function AdminPage({ slug }: { slug: string[] }) {
  const [route, collection, documentId] = slug || []

  // Dashboard
  if (!route) {
    const initialData = await preloadQuery(api.vex.getDashboardStats, {})
    return <ReactDashboardView initialData={initialData} components={components} />
  }

  // List view
  if (route && !documentId) {
    const initialData = await preloadQuery(api.vex.listDocuments, {
      collection: route,
      limit: 50
    })
    return <ReactListView collection={route} initialData={initialData} components={components} />
  }

  // Edit view
  if (route && documentId) {
    const initialData = await preloadQuery(api.vex.getDocument, {
      collection: route,
      id: documentId
    })
    return <ReactEditView
      collection={route}
      documentId={documentId}
      initialData={initialData}
      components={components}
    />
  }

  return <div>Not Found</div>
}
EOF

# 4. Test in www app
cd ../../apps/www

# Create admin routes
mkdir -p src/app/admin/\[...slug\]

cat > src/app/admin/layout.tsx << 'EOF'
import { AdminLayout } from '@vexcms/next'

export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>
}
EOF

cat > src/app/admin/\[...slug\]/page.tsx << 'EOF'
import { AdminPage } from '@vexcms/next'

export default function AdminCatchAll({ params }) {
  return <AdminPage slug={params.slug} />
}
EOF

# 5. Test
pnpm dev
# Navigate to /admin - should show dashboard
# Navigate to /admin/posts - should show posts list
# Navigate to /admin/posts/123 - should show edit form
```

**Key Implementation Details:**

1. **AdminPage is a Server Component** - Can use `preloadQuery` internally
2. **Routing logic** - Parses slug to determine which view to show
3. **Component wiring** - VexLink and VexImage already passed to React views
4. **Data preloading** - Happens inside AdminPage, not user's code
5. **User imports once** - Zero boilerplate in user's app

### Week 9: Testing & Polish

```bash
# Test storage-convex
cd packages/storage-convex
pnpm test

# Test www app
cd apps/www
pnpm vex dev
pnpm dev
# Manually test all admin views

# Fix bugs
```

### Week 10+: Templates & Ship

```bash
# Rebuild templates
cd packages/create-vexcms/templates/base-nextjs
# Build fresh template using new packages

# Test scaffolding
npx create-vexcms test-app
cd test-app
pnpm install
pnpm vex dev
pnpm dev

# Drop alpha tag
pnpm changeset version
# Manually remove -alpha from versions

# Release 0.1.0
git tag v0.1.0
git push origin v0.1.0
pnpm changeset publish
```

---

## Critical Considerations

### 1. Generic Helpers Are Essential

**Don't write switch statements in framework packages!**

```typescript
// ❌ BAD: Repetitive switch logic
function getLabel(field: VexField, fieldKey: string): string {
  switch (field.type) {
    case "text":
      return field.label ?? toTitleCase(fieldKey);
    case "number":
      return field.label ?? toTitleCase(fieldKey);
    // ... 19 field types
  }
}

// ✅ GOOD: Use core's generic helper
import { getFieldLabel } from "@vexcms/core/fields/helpers";
const label = getFieldLabel(field, fieldKey);
```

### 2. Type Flow Matters

**Users should import from framework packages for type safety:**

```typescript
// ✅ GOOD: Import from framework
import { text } from "@vexcms/react";
const title = text({
  admin: {
    components: {
      Cell: MyComponent, // ✅ Type-checked as ReactComponent
    },
  },
});

// ⚠️ OK: Import from core (no component types)
import { text } from "@vexcms/core";
const title = text({
  admin: {
    components: {
      Cell: MyComponent, // ⚠️ TComponent = unknown
    },
  },
});
```

### 3. Convex Query Centralization

**Core owns query logic, frameworks just call it:**

```typescript
// ✅ Core defines query once
export const listDocuments = query({
  /* ... */
});

// ✅ React uses it
useQuery(api.vex.listDocuments, { collection: "posts" });

// ✅ Next.js preloads it
await preloadQuery(api.vex.listDocuments, { collection: "posts" });

// ✅ Future Svelte uses it
$: docs = createQuery(api.vex.listDocuments, { collection: "posts" });
```

### 4. CLI Code Generation Minimal

**CLI only generates re-exports:**

```typescript
// convex/vex/index.ts (generated)
export { listDocuments, getDocument } from "@vexcms/core/convex/queries";
```

**Core owns actual implementation.**

### 5. Framework Validation Required

**Every framework package must validate completeness:**

```typescript
export const reactFramework = defineFrameworkPackage<ReactComponent, ReactView>(
  {
    views: {
      DashboardView, // ✅ Must be ReactView
      ListView, // ✅ Must be ReactView
      // ❌ TypeScript error if any missing
    },
    components: {
      Link: VexLink, // ✅ Must be ReactComponent
      // ❌ TypeScript error if any missing
    },
  },
);
```

### 6. Test Early, Test Often

- **Week 1:** Test field types as you build them (port tests)
- **Week 5:** Test richtext-plate integration (critical decision point)
- **Week 9:** Test storage-convex (should work as-is)
- **Week 10:** Test scaffolded apps (dogfood templates)

---

## Timeline & Milestones

### Week 1-2: Core Field Types ✅

- [ ] Implement all 19 field types
- [ ] Add generic helpers
- [ ] Port field type tests
- [ ] Verify zero React dependencies

### Week 3: Core Convex + Better Auth ✅

- [ ] Implement generic Convex queries
- [ ] Implement generic Convex mutations
- [ ] Rebuild better-auth adapter
- [ ] Port better-auth tests

### Week 4: Core Completion ✅

- [ ] Schema generation
- [ ] Permissions
- [ ] Framework validation
- [ ] CLI Convex file generation

### Week 5-6: React Package ✅

- [ ] Column factories (all 19 field types)
- [ ] Form components (all 19 field types)
- [ ] Admin views (Dashboard, List, Edit, etc.)
- [ ] Data hooks (useQuery wrappers)
- [ ] Framework package definition
- [ ] **TEST RICHTEXT-PLATE** (decision point)

### Week 7-8: Next.js Package ✅

- [ ] Component adapters (Link, Image)
- [ ] SSR admin pages
- [ ] Convex query preloading
- [ ] All admin routes

### Week 9: Testing ✅

- [ ] Test storage-convex
- [ ] Test all admin views
- [ ] Fix bugs

### Week 10+: Ship ✅

- [ ] Rebuild templates
- [ ] Test scaffolding
- [ ] Drop alpha tag
- [ ] Release 0.1.0

---

## 📚 Reference Documents

All relevant rebuild documentation is in `.rebuild/`:

- **`GENERIC-HELPERS-AND-TYPES.md`** - Complete architecture with code examples
- **`FRAMEWORK-AGNOSTIC-CORE.md`** - Framework-agnostic core approach explained
- **`ARCHITECTURE-COMPARISON.md`** - Decision matrix comparing approaches
- **`WHATS-PRESERVED.md`** - Detailed inventory of preserved vs rebuilt code
- **`CLI-DECISION-GUIDE.md`** - Why we preserved the CLI

All other rebuild docs have been removed as they're redundant with this master guide.

---

## 🎯 Success Criteria

When you can check all these boxes, ship 0.1.0:

- [ ] Marketing site (www) runs on rebuild
- [ ] All ported tests pass
- [ ] All 19 field types implemented with React components
- [ ] All admin views functional
- [ ] CLI auto-migration works
- [ ] Better Auth integration works
- [ ] Convex storage integration works
- [ ] Generic Convex queries work in React and Next.js
- [ ] JSDoc on all exported symbols
- [ ] create-vexcms scaffolds working apps
- [ ] Core has zero React dependencies
- [ ] Generic helpers eliminate switch statements
- [ ] Framework validation catches missing components
- [ ] Type flow works (core → framework → user)

---

**Ready to build? Start with Week 1: Core Field Types!** 🚀
