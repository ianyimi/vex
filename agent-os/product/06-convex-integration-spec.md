# Convex Integration Implementation Spec

This document defines the implementation plan for Vex CMS Convex integration. It covers admin panel queries, access control (RBAC), hooks execution, and schema generation with indexes.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.5

**Depends on**: [05-schema-field-system-spec.md](./05-schema-field-system-spec.md) - Field types, validators, and collection configuration

**Testing**: [11-testing-strategy-spec.md](./11-testing-strategy-spec.md) - Convex handler tests with `convex-test`

---

## Design Goals

1. **Admin-only generated queries** - Vex provides queries for admin panel; developers write their own for frontend apps
2. **RBAC with full type safety** - Users define roles/permissions with LSP support derived from their collections
3. **Hooks execute on admin operations** - beforeCreate, afterUpdate, etc. run on admin mutations
4. **Configurable indexes** - Users specify which fields to index in collection config
5. **Depth 0 relationships** - Return IDs only; admin components fetch related docs separately

---

## Type Definitions

### Access Control Types

```typescript
/**
 * Standard CRUD actions for access control
 */
type AuthAction = "create" | "read" | "update" | "delete";

/**
 * Context passed to permission check functions
 */
interface PermissionContext<TDoc> {
  user: User;
  data?: TDoc;
}

/**
 * A permission check can be a boolean or a function
 */
type PermissionCheck<TDoc> =
  | boolean
  | ((context: PermissionContext<TDoc>) => boolean | Promise<boolean>);

/**
 * Permissions for a single collection
 */
type CollectionPermissions<TDoc> = Partial<
  Record<AuthAction, PermissionCheck<TDoc>>
>;

/**
 * Helper type to extract document types from collections
 * Users don't write this - it's inferred from their config
 */
type InferPermissionsMap<TCollections extends VexCollection<any>[]> = {
  [C in TCollections[number] as C["name"]]: {
    docType: C["_docType"];
  };
};

/**
 * The roles configuration object type
 * TRoles: User-defined role names (e.g., "admin" | "user" | "editor")
 * TCollections: Collections from VexConfig
 */
type RolesConfig<
  TRoles extends string,
  TPermissions extends Record<string, { docType: any }>
> = Record<
  TRoles,
  Partial<{
    [K in keyof TPermissions]: CollectionPermissions<TPermissions[K]["docType"]>;
  }>
>;

/**
 * Access control configuration in VexConfig
 */
interface AccessControlConfig<
  TRoles extends string,
  TCollections extends VexCollection<any>[]
> {
  /** User-defined roles (e.g., ["admin", "user", "editor"]) */
  roles: readonly TRoles[];

  /** Function to extract role from user document */
  getUserRole: (user: User) => TRoles | null;

  /** The permissions matrix */
  permissions: RolesConfig<TRoles, InferPermissionsMap<TCollections>>;

  /** Default permission for collections not explicitly configured */
  defaultPermission?: "admin-only" | "authenticated" | "public" | "deny";
}
```

### Index Configuration Types

```typescript
/**
 * Index definition for a collection
 */
interface IndexConfig {
  /** Index name (must be unique within collection) */
  name: string;

  /** Fields to index (order matters for compound indexes) */
  fields: string[];
}

/**
 * Search index for full-text search
 */
interface SearchIndexConfig {
  /** Index name */
  name: string;

  /** Field to search */
  searchField: string;

  /** Additional fields to filter by */
  filterFields?: string[];
}
```

### Admin Query Types

```typescript
/**
 * Pagination options for list queries
 */
interface PaginationOptions {
  cursor?: string;
  numItems: number;
}

/**
 * Sort options for list queries
 */
interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

/**
 * Filter for list queries (simplified for admin panel)
 */
interface ListFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains";
  value: any;
}

/**
 * Arguments for admin list query
 */
interface AdminListArgs {
  collection: string;
  paginationOpts: PaginationOptions;
  sort?: SortOptions;
  filters?: ListFilter[];
  search?: string;
}

/**
 * Arguments for admin search query (relationship picker)
 */
interface AdminSearchArgs {
  collection: string;
  search: string;
  limit: number;
  excludeIds?: string[];
}

/**
 * Arguments for admin get by ID
 */
interface AdminGetByIdArgs {
  collection: string;
  id: string;
}

/**
 * Arguments for admin create
 */
interface AdminCreateArgs {
  collection: string;
  data: Record<string, any>;
}

/**
 * Arguments for admin update
 */
interface AdminUpdateArgs {
  collection: string;
  id: string;
  data: Record<string, any>;
}

/**
 * Arguments for admin delete
 */
interface AdminDeleteArgs {
  collection: string;
  id: string;
}
```

### Hook Context Types

```typescript
/**
 * Context passed to collection hooks during admin operations
 */
interface HookContext<TDoc> {
  /** The current user performing the operation */
  user: User;

  /** Database reader/writer */
  db: DatabaseReader | DatabaseWriter;

  /** The operation being performed */
  operation: "create" | "update" | "delete";

  /** Collection name */
  collection: string;
}

/**
 * Context for beforeCreate hook
 */
interface BeforeCreateContext<TDoc> extends HookContext<TDoc> {
  /** Data being inserted (mutable) */
  data: TDoc;
}

/**
 * Context for afterCreate hook
 */
interface AfterCreateContext<TDoc> extends HookContext<TDoc> {
  /** The created document */
  doc: TDoc & { _id: string };
}

/**
 * Context for beforeUpdate hook
 */
interface BeforeUpdateContext<TDoc> extends HookContext<TDoc> {
  /** The existing document */
  originalDoc: TDoc & { _id: string };

  /** The update data (mutable) */
  data: Partial<TDoc>;
}

/**
 * Context for afterUpdate hook
 */
interface AfterUpdateContext<TDoc> extends HookContext<TDoc> {
  /** The updated document */
  doc: TDoc & { _id: string };

  /** The document before update */
  originalDoc: TDoc & { _id: string };
}

/**
 * Context for beforeDelete hook
 */
interface BeforeDeleteContext<TDoc> extends HookContext<TDoc> {
  /** The document about to be deleted */
  doc: TDoc & { _id: string };
}

/**
 * Context for afterDelete hook
 */
interface AfterDeleteContext<TDoc> extends HookContext<TDoc> {
  /** The deleted document */
  doc: TDoc & { _id: string };
}
```

### Extended Collection Config

```typescript
/**
 * Extended collection config with index and admin query options
 */
interface CollectionConfig<TFields extends Record<string, VexField<any, any>>> {
  fields: TFields;

  /** Database indexes */
  indexes?: IndexConfig[];

  /** Search indexes for full-text search */
  searchIndexes?: SearchIndexConfig[];

  admin?: {
    /** Field used for display in lists and relationship pickers */
    useAsTitle?: keyof TFields;

    /** Fields searchable in relationship picker (defaults to [useAsTitle]) */
    searchableFields?: (keyof TFields)[];

    /** Default columns shown in list view */
    defaultColumns?: (keyof TFields)[];

    /** Default sort for list view */
    defaultSort?: {
      field: keyof TFields | "_creationTime";
      order: "asc" | "desc";
    };

    /** Fields that can be filtered in list view */
    filterableFields?: (keyof TFields)[];

    /** Group in admin sidebar */
    group?: string;
  };

  // ... other existing config (hooks, access, versions, etc.)
}
```

---

## Required Functions

### Setup & Registration

#### `createVexHandlers(config: VexConfig): VexHandlers`

Creates all admin query and mutation handlers from the Vex config.

**Must accomplish:**
- Iterate over all collections in config
- Create generic handlers that route based on collection name argument
- Bind access control config to handlers
- Bind hooks config to mutation handlers
- Return object with all handler functions ready for export

**Edge cases:**
- Empty collections array: return handlers that always throw "no collections configured"
- Collection name not found at runtime: throw descriptive error
- Access control not configured: use defaultPermission or deny all

---

#### `buildConvexSchema(config: VexConfig): SchemaDefinition`

Generates a runtime Convex schema object from Vex config. This is used internally by the generated `vex.schema.ts` file.

> **Note:** For most use cases, use `generateVexSchema()` (which produces TypeScript source code) via the `vex sync` CLI command. `buildConvexSchema()` is the underlying function that creates the runtime schema definition.

**Must accomplish:**
- Extract validators from all collections (as defined in 05-schema-field-system-spec.md)
- Add indexes defined in each collection's `indexes` config
- Add search indexes defined in `searchIndexes` config
- Auto-create index on `useAsTitle` field if not already indexed
- Add system tables (`vex_versions`, `vex_globals`)

**Edge cases:**
- Duplicate index names within a collection: error at build time
- Index on non-existent field: error at build time
- Reserved index names: prefix user indexes to avoid conflicts

---

### Admin Query Handlers

#### `adminList(ctx, args: AdminListArgs): PaginatedResult`

Generic list query for collection list view.

**Must accomplish:**
- Validate collection exists in config
- Check read access for current user (from ctx)
- Apply search filter on `useAsTitle` field if `args.search` provided
- Apply field filters from `args.filters`
- Apply sort from `args.sort` or fall back to collection's `defaultSort`
- Paginate using Convex's `.paginate()`
- Return documents with pagination cursor

**Edge cases:**
- User has no read access: return empty results (not error) or throw based on config
- Search on field without index: use filter (slower) with warning in dev
- Sort on non-indexed field: use filter-based sort (slower)
- Collection has row-level access (function check): cannot filter in query, must filter results post-fetch

**Important considerations:**
- Row-level access checks (permission functions that check `data`) cannot be applied at query level
- Must fetch results then filter based on permission check for each doc
- This may result in pages smaller than requested `numItems`
- Consider fetching extra items to compensate, or document this limitation

---

#### `adminSearch(ctx, args: AdminSearchArgs): SearchResult[]`

Search query for relationship picker component.

**Must accomplish:**
- Validate collection exists in config
- Check read access for current user
- Search using `searchableFields` or fall back to `useAsTitle`
- Exclude documents with IDs in `args.excludeIds` (already selected)
- Limit results to `args.limit`
- Return documents with `_id` and display field(s) only

**Edge cases:**
- No searchable fields configured: search on `_id` as fallback (not useful, but safe)
- Search term is empty: return most recent documents
- All results excluded: return empty array

---

#### `adminGetById(ctx, args: AdminGetByIdArgs): Document | null`

Get single document for edit form.

**Must accomplish:**
- Validate collection exists
- Fetch document by ID
- Check read access for current user against this specific document
- Return document with all fields (depth 0 - relationship fields return IDs only)
- Return null if not found or no access

**Edge cases:**
- Invalid ID format: return null (not error)
- Document exists but no access: return null (don't reveal existence)

---

### Admin Mutation Handlers

#### `adminCreate(ctx, args: AdminCreateArgs): { _id: string }`

Create document in any collection.

**Must accomplish:**
- Validate collection exists
- Check create access for current user
- Validate `args.data` against collection schema
- Apply default values from field configs
- Run `beforeCreate` hooks (can modify data)
- Insert document
- Run `afterCreate` hooks
- If versioning enabled: set `_status: "draft"`, `_version: 1`
- Return created document ID

**Edge cases:**
- Hook throws error: abort operation, return error
- Hook modifies data to invalid state: validate after hooks
- Validation fails: return structured validation errors
- Relationship field with invalid ID: validate referenced doc exists

---

#### `adminUpdate(ctx, args: AdminUpdateArgs): { _id: string }`

Update document in any collection.

**Must accomplish:**
- Validate collection exists
- Fetch existing document
- Check update access for current user against existing document
- Validate `args.data` against collection schema (partial validation)
- Run `beforeUpdate` hooks (can modify data)
- Patch document
- Run `afterUpdate` hooks
- If versioning enabled: increment `_version`, optionally save to version history
- Return updated document ID

**Edge cases:**
- Document not found: throw error
- Concurrent update: Convex handles via OCC, retry automatically
- Hook prevents update: abort and return error
- Partial data validation: only validate fields being updated

---

#### `adminDelete(ctx, args: AdminDeleteArgs): { _id: string }`

Delete document from any collection.

**Must accomplish:**
- Validate collection exists
- Fetch existing document
- Check delete access for current user against existing document
- Run `beforeDelete` hooks (can abort by throwing)
- Delete document
- Run `afterDelete` hooks
- If versioning enabled: optionally preserve in version history as "deleted"
- Return deleted document ID

**Edge cases:**
- Document not found: throw error (or succeed silently?)
- Document has references from other collections: decide policy (error, cascade, nullify)
- Hook throws: abort delete, return error

---

### Access Control Functions

#### `checkAccess(config, ctx, collection, action, doc?): boolean`

Check if current user has permission for an action.

**Must accomplish:**
- Extract user from ctx (via Better Auth integration)
- Get user's role via `config.accessControl.getUserRole(user)`
- Look up permission in `config.accessControl.permissions[role][collection][action]`
- If permission is boolean, return it
- If permission is function, call it with `{ user, data: doc }`
- If collection not in permissions, use `defaultPermission`

**Edge cases:**
- No user (unauthenticated): deny unless `defaultPermission: "public"`
- User has no role: deny
- Collection not in permissions matrix: use `defaultPermission`
- Permission function throws: treat as deny, log error

---

#### `hasPermission<TCollection>(args): boolean`

Type-safe permission check for use in user's own code.

**Must accomplish:**
- Provide strongly-typed API matching the pattern in user's permissions.ts
- Accept collection name as type parameter for doc type inference
- Return boolean

**Edge cases:**
- Called outside Convex context: throw helpful error

---

### Hook Execution Functions

#### `runBeforeCreateHooks(config, ctx, collection, data): data`

Execute beforeCreate hooks for a collection.

**Must accomplish:**
- Get collection config from Vex config
- If `hooks.beforeCreate` defined, call it with context
- Hook can modify and return data
- Return final data for insertion

**Edge cases:**
- No hooks defined: return data unchanged
- Hook returns undefined: use original data
- Hook throws: propagate error to abort operation

---

#### `runAfterCreateHooks(config, ctx, collection, doc): void`

Execute afterCreate hooks for a collection.

**Must accomplish:**
- Get collection config from Vex config
- If `hooks.afterCreate` defined, call it with context
- Hook receives created document (read-only)

**Edge cases:**
- Hook throws: log error but don't fail the operation (document already created)
- Consider: should afterCreate errors rollback? (Convex transactions make this possible)

---

#### `runBeforeUpdateHooks(config, ctx, collection, originalDoc, data): data`

Execute beforeUpdate hooks for a collection.

**Must accomplish:**
- Get collection config
- Call `hooks.beforeUpdate` with original doc and update data
- Hook can modify update data
- Return final data for patch

**Edge cases:**
- Same as beforeCreate

---

#### `runAfterUpdateHooks(config, ctx, collection, doc, originalDoc): void`

Execute afterUpdate hooks for a collection.

**Must accomplish:**
- Call `hooks.afterUpdate` with updated doc and original doc
- Useful for audit logging, cache invalidation, etc.

**Edge cases:**
- Same as afterCreate

---

#### `runBeforeDeleteHooks(config, ctx, collection, doc): void`

Execute beforeDelete hooks for a collection.

**Must accomplish:**
- Call `hooks.beforeDelete` with document about to be deleted
- Hook can throw to abort deletion

**Edge cases:**
- Hook throws: abort delete, propagate error

---

#### `runAfterDeleteHooks(config, ctx, collection, doc): void`

Execute afterDelete hooks for a collection.

**Must accomplish:**
- Call `hooks.afterDelete` with deleted document
- Useful for cleanup, cascade deletes, notifications

**Edge cases:**
- Hook throws: log error (document already deleted)

---

### Schema Generation Functions

#### `generateIndexes(collection: VexCollection): IndexDefinition[]`

Generate Convex index definitions from collection config.

**Must accomplish:**
- Map `collection.indexes` to Convex `.index()` calls
- Auto-add index on `useAsTitle` field if not present
- Auto-add index on `_status` field if versioning enabled
- Return array of index definitions

**Edge cases:**
- No indexes configured: return only auto-generated indexes
- Index already exists for auto-index field: don't duplicate

---

#### `generateSearchIndexes(collection: VexCollection): SearchIndexDefinition[]`

Generate Convex search index definitions.

**Must accomplish:**
- Map `collection.searchIndexes` to Convex `.searchIndex()` calls
- Auto-add search index on `useAsTitle` if `searchableFields` includes it

**Edge cases:**
- Search indexes are optional; return empty array if none configured

---

### Schema File Management Functions

#### `generateVexSchema(config: VexConfig): string`

Generates the content for `vex.schema.ts` file.

**Must accomplish:**
- Generate TypeScript source code (not runtime objects)
- Include header comment warning not to edit
- Export each collection as a named defineTable() call
- Include all indexes and search indexes
- Include validators for all fields

**Edge cases:**
- Collection with no indexes: just defineTable() with no chained .index() calls
- Circular relationships: use v.id() with string table name, not import

---

#### `updateUserSchema(config: VexConfig, existingContent: string): UpdateResult`

Parses and updates the user's `schema.ts` file.

**Must accomplish:**
- Parse existing schema.ts using AST (e.g., ts-morph or @babel/parser)
- Find existing imports from "./vex.schema"
- Find existing table names in defineSchema() call
- Determine which collections are missing
- Generate updated content with new imports and tables added
- Preserve all existing user code (custom tables, indexes, comments)

**Returns:**
```typescript
interface UpdateResult {
  // Whether changes are needed
  hasChanges: boolean;

  // New collections to add
  newCollections: string[];

  // Updated file content (only if hasChanges is true)
  updatedContent?: string;

  // Instructions for manual update (if autoUpdateSchema is false)
  manualInstructions?: string;
}
```

**Edge cases:**
- No schema.ts exists: return template with all collections
- Parse error: throw with line number and helpful message
- User uses different import style (named vs namespace): detect and match
- User has modified table inline (added indexes): preserve modifications
- User renamed imported table: detect mismatch, warn, don't overwrite

---

#### `detectSchemaConflicts(config: VexConfig, existingContent: string): Conflict[]`

Detects potential conflicts between Vex config and user's schema.ts.

**Must accomplish:**
- Check for table name conflicts (user table same name as Vex collection)
- Check for renamed imports (import { posts as blogPosts })
- Check for missing vex.schema.ts import
- Return list of conflicts with resolution suggestions

**Returns:**
```typescript
interface Conflict {
  type: "name_collision" | "renamed_import" | "missing_import" | "removed_collection";
  collection: string;
  message: string;
  suggestion: string;
}
```

---

## File Structure

```
@vexcms/convex/
├── handlers/
│   ├── index.ts           # createVexHandlers() - main entry
│   ├── list.ts            # adminList query handler
│   ├── search.ts          # adminSearch query handler
│   ├── getById.ts         # adminGetById query handler
│   ├── create.ts          # adminCreate mutation handler
│   ├── update.ts          # adminUpdate mutation handler
│   └── delete.ts          # adminDelete mutation handler
├── access/
│   ├── index.ts           # Access control exports
│   ├── check.ts           # checkAccess() function
│   ├── types.ts           # RBAC type definitions
│   └── hasPermission.ts   # hasPermission() helper
├── hooks/
│   ├── index.ts           # Hook execution exports
│   ├── runner.ts          # Hook execution logic
│   └── types.ts           # Hook context types
├── schema/
│   ├── index.ts           # Schema exports
│   ├── build.ts           # buildConvexSchema() - runtime schema object
│   ├── generate.ts        # generateVexSchema() - creates vex.schema.ts source
│   ├── sync.ts            # updateUserSchema() - updates schema.ts
│   ├── parse.ts           # AST parsing utilities
│   ├── conflicts.ts       # detectSchemaConflicts()
│   ├── indexes.ts         # Index generation
│   ├── tables.ts          # Table generation from collections
│   └── system.ts          # System tables (vex_versions, etc.)
├── helpers/
│   ├── index.ts           # Optional helpers for user queries
│   ├── vexQuery.ts        # Wrapper that adds hooks/access
│   └── vexMutation.ts     # Wrapper that adds hooks/access
└── index.ts               # Main package exports
```

---

## User Setup

### Step 1: Define Permissions (Optional)

```typescript
// src/auth/permissions.ts
import { definePermissions } from "@vex/core";
import type { VexCollections } from "../vex.config";

export const USER_ROLES = ["admin", "editor", "user"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const permissions = definePermissions<UserRole, VexCollections>()({
  admin: {
    posts: { create: true, read: true, update: true, delete: true },
    pages: { create: true, read: true, update: true, delete: true },
    media: { create: true, read: true, update: true, delete: true },
    users: { create: true, read: true, update: true, delete: true },
  },
  editor: {
    posts: {
      create: true,
      read: true,
      update: ({ data, user }) => data.author === user._id,
      delete: ({ data, user }) => data.author === user._id,
    },
    pages: { create: true, read: true, update: true, delete: false },
    media: { create: true, read: true, update: true, delete: false },
  },
  user: {
    posts: { read: true },
    pages: { read: true },
    media: { read: true },
  },
});
```

### Step 2: Configure Vex

```typescript
// vex.config.ts
import { defineConfig } from "@vex/core";
import { posts } from "./collections/posts";
import { pages } from "./collections/pages";
import { media } from "./collections/media";
import { users } from "./collections/users";
import { permissions, USER_ROLES } from "./auth/permissions";

const collections = [posts, pages, media, users] as const;
export type VexCollections = typeof collections;

export default defineConfig({
  collections,

  accessControl: {
    roles: USER_ROLES,
    getUserRole: (user) => user.role as UserRole,
    permissions,
    defaultPermission: "deny",
  },
});
```

### Step 3: Setup Convex Handlers

```typescript
// convex/vex/index.ts
import { createVexHandlers } from "@vex/convex";
import vexConfig from "../../vex.config";

const handlers = createVexHandlers(vexConfig);

// Export admin handlers for the admin panel
export const adminList = handlers.adminList;
export const adminSearch = handlers.adminSearch;
export const adminGetById = handlers.adminGetById;
export const adminCreate = handlers.adminCreate;
export const adminUpdate = handlers.adminUpdate;
export const adminDelete = handlers.adminDelete;
```

### Step 4: Schema Setup (Two-File Approach)

Vex uses a two-file schema approach to allow automatic updates without overwriting user customizations:

**File 1: `convex/vex.schema.ts`** (Auto-generated by Vex)

```typescript
// ⚠️ AUTO-GENERATED BY VEX - DO NOT EDIT
// This file is regenerated when vex.config.ts changes
// To customize tables, edit convex/schema.ts instead

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const posts = defineTable({
  title: v.string(),
  slug: v.string(),
  content: v.string(),
  author: v.id("users"),
  _status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["_status"]);

export const pages = defineTable({
  title: v.string(),
  slug: v.string(),
  content: v.string(),
})
  .index("by_slug", ["slug"]);

// ... other collections from vex.config.ts
```

**File 2: `convex/schema.ts`** (User-owned, auto-updated with setting)

```typescript
// convex/schema.ts
import { defineSchema } from "convex/server";

// Vex-managed tables (auto-imported)
import { posts, pages, media, users } from "./vex.schema";

// Your custom tables
import { analytics } from "./tables/analytics";

export default defineSchema({
  // Vex collections
  posts,
  pages,
  media,
  users,

  // Your custom tables
  analytics,

  // Or extend Vex tables with additional indexes:
  // posts: posts.index("by_author_date", ["author", "_creationTime"]),
});
```

#### Automatic Schema Updates

Controlled by the `autoUpdateSchema` setting in `vex.config.ts`:

```typescript
// vex.config.ts
export default defineConfig({
  collections: [...],
  convex: {
    // When true (default): Vex automatically updates schema.ts
    // When false: Vex outputs instructions for manual updates
    autoUpdateSchema: true,
  }
});
```

**When `autoUpdateSchema: true`:**

Running `vex sync` (or on config change with watch mode):

1. **Regenerates `vex.schema.ts`** - Always fully regenerated from vex.config.ts
2. **Parses existing `schema.ts`** - Uses AST to understand current structure
3. **Detects new collections** - Compares against vex.config.ts
4. **Adds missing imports** - Inserts import statements for new collections
5. **Adds missing tables** - Adds new collections to defineSchema() call
6. **Preserves user code** - Keeps all existing:
   - Custom tables and imports
   - Additional indexes on Vex tables
   - Comments
   - Code formatting

**When `autoUpdateSchema: false`:**

Vex outputs instructions instead of modifying files:

```
New collection "categories" detected. Add to your schema.ts:

  1. Add import:
     import { categories } from "./vex.schema";

  2. Add to defineSchema():
     categories,
```

#### CLI Commands

```bash
# Regenerate vex.schema.ts and update schema.ts (respects autoUpdateSchema)
pnpm vex sync

# Force regenerate even if autoUpdateSchema is false
pnpm vex sync --force

# Watch mode - regenerates on vex.config.ts changes
pnpm vex sync --watch

# Preview changes without writing
pnpm vex sync --dry-run
```

#### Edge Cases

- **First run (no schema.ts exists)**: Creates both files from scratch
- **User deleted import but kept table**: Re-adds the import
- **User renamed imported table**: Vex detects and warns, doesn't overwrite
- **Conflicting table names**: Error with clear message
- **Parse error in schema.ts**: Error with line number, doesn't modify file

### Step 5: Write Your Own Queries (For Frontend App)

```typescript
// convex/posts.ts - Developer's own queries
import { query } from "./_generated/server";
import { v } from "convex/values";

// Standard Convex query - no Vex involvement
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("posts")
      .withIndex("by_status", q => q.eq("_status", "published"))
      .order("desc")
      .take(10);
  },
});
```

---

## Admin Panel Integration

### How Components Call Handlers

```typescript
// @vex/admin/hooks/useAdminList.ts
import { usePaginatedQuery } from "convex/react";
import { api } from "~/convex/_generated/api";

export function useAdminList(collection: string, options?: ListOptions) {
  const config = useCollectionConfig(collection);

  return usePaginatedQuery(
    api.vex.adminList,
    {
      collection,
      sort: options?.sort ?? config.admin?.defaultSort,
      filters: options?.filters,
      search: options?.search,
    },
    { initialNumItems: options?.pageSize ?? 25 }
  );
}
```

```typescript
// @vex/admin/hooks/useAdminSearch.ts
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";

export function useAdminSearch(collection: string, search: string) {
  return useQuery(
    api.vex.adminSearch,
    { collection, search, limit: 20 }
  );
}
```

---

## Testing Requirements

- Unit tests for access control check logic
- Unit tests for hook execution order and error handling
- Unit tests for schema generation with indexes
- Integration tests for each admin handler with mock Convex context
- Integration tests for permission checks with various role configurations
- E2E tests for admin panel CRUD operations
