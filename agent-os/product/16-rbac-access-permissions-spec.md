# 16 — RBAC Access Permissions

## Overview

Add a type-safe RBAC (Role-Based Access Control) permissions system to `@vexcms/core`. Users define roles, map them to field-level CRUD permissions per resource (collection or global), and attach the result to `vex.config.ts`. A `hasPermission` function resolves permissions at runtime for use in the admin panel or server-side guards.

## Design Decisions

1. **All four actions (create, read, update, delete) support field-level granularity.** Each permission check can return `boolean` (applies to all fields) or `Partial<Record<fieldKey, true>>` (allowlist — unlisted fields default to `false`).

2. **Dynamic permission callbacks** receive `({ data, user })` context, matching the test-app pattern. The `user` type is inferred from the user collection passed to `defineAccess`.

3. **`defineAccess` is a builder function** (like `defineCollection`) that exists purely for TypeScript inference. It accepts `collections`, `globals`, `roles`, `userCollection`, and `permissions`. The function body returns the input unchanged.

4. **`defineConfig` also supports inline access** by making it generic over the collections/globals arrays. Users choose between inline (zero duplication) or standalone `defineAccess` (separate file, re-pass collections).

5. **Multi-role resolution uses OR logic.** If a user has roles `['editor', 'author']` and either role grants a field, that field is allowed.

6. **Permissive default.** If no access config is defined, or a resource has no permissions entry, `hasPermission` returns all-true.

7. **`hasPermission` has two overloads** for read/update/create/delete:
   - Without `field` param → returns `Record<fieldKey, boolean>` (full field map)
   - With `field` param → returns `boolean` (single field check)

8. **`access` lives at the top level** of `VexConfig` alongside `auth`, not nested inside it.

## Out of Scope

- Admin panel UI integration (consuming permissions to hide/show fields)
- Server-side Convex mutation/query guards (will use `hasPermission` in a future spec)
- Media collection support (media collection type doesn't exist yet)
- Block field / array field sub-item permission granularity
- Denylist mode (`Record<fieldKey, false>`)
- `VexConfig.auth` restructuring (`auth.adapter` / `auth.access`)

## Target Directory Structure

```
packages/core/src/
├── access/
│   ├── types.ts              # VexAccessConfig, PermissionCheck, FieldPermissionResult types
│   ├── defineAccess.ts        # defineAccess() builder function
│   ├── defineAccess.test.ts   # Tests for defineAccess + type validation
│   ├── hasPermission.ts       # hasPermission() runtime resolver
│   └── hasPermission.test.ts  # Tests for hasPermission runtime logic
├── config/
│   └── defineConfig.ts        # Modified — add access field, make generic for inline access
├── types/
│   └── index.ts               # Modified — add access to VexConfig / VexConfigInput
└── index.ts                   # Modified — export new access types and functions
```

## Implementation Order

1. **Step 1: Access types** — Core type definitions. After this step, types compile and can be imported.
2. **Step 2: `defineAccess` builder + tests** — Builder function with full type inference. Tests verify type safety and runtime passthrough.
3. **Step 3: `hasPermission` function + tests** — Runtime permission resolution with all overloads. Tests cover boolean returns, partial records, dynamic callbacks, multi-role merge, and edge cases.
4. **Step 4: Config integration + exports** — Add `access` field to `VexConfig`/`VexConfigInput`, make `defineConfig` generic for inline access, update `index.ts` exports. Verify test-app compiles.

---

## Step 1: Access Types

- [ ] Create `packages/core/src/access/types.ts`
- [ ] Run `pnpm --filter @vexcms/core build` to verify compilation

### `File: packages/core/src/access/types.ts`

All type definitions for the access permission system. These are the contracts that `defineAccess`, `hasPermission`, and the config integration rely on.

```typescript
import type { VexCollection, VexField, InferFieldsType } from "../types";
import type { VexGlobal } from "../types/globals";

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract the slug literal type from a VexCollection.
 *
 * @example
 * type S = ExtractSlug<typeof posts>; // "posts"
 */
export type ExtractSlug<T> = T extends VexCollection<any, any>
  ? T["slug"]
  : T extends VexGlobal<any>
    ? T["slug"]
    : never;

/**
 * Extract field keys from a VexCollection, including auth field keys.
 *
 * @example
 * type K = ExtractFieldKeys<typeof posts>; // "title" | "slug" | "status" | "featured"
 */
export type ExtractFieldKeys<T> = T extends VexCollection<infer TFields, infer TAuthKeys>
  ? (keyof TFields & string) | (TAuthKeys & string)
  : T extends VexGlobal<infer TFields>
    ? keyof TFields & string
    : never;

/**
 * Extract the inferred document type from a VexCollection or VexGlobal.
 */
export type ExtractDocType<T> = T extends VexCollection<infer TFields, any>
  ? InferFieldsType<TFields>
  : T extends VexGlobal<infer TFields>
    ? InferFieldsType<TFields>
    : never;

/**
 * Lookup a resource (collection or global) by slug from a tuple of resources.
 *
 * @example
 * type P = LookupBySlug<[typeof posts, typeof users], "posts">; // typeof posts
 */
export type LookupBySlug<
  TResources extends readonly any[],
  TSlug extends string,
> = TResources extends readonly [infer Head, ...infer Tail]
  ? Head extends { slug: TSlug }
    ? Head
    : LookupBySlug<Tail, TSlug>
  : never;

// =============================================================================
// PERMISSION RESULT TYPES
// =============================================================================

/**
 * The return type for a permission check on a resource.
 * - `boolean` — applies uniformly to all fields (true = all allowed, false = all denied)
 * - `Partial<Record<FieldKey, true>>` — allowlist mode: listed fields are allowed, unlisted default to false
 */
export type FieldPermissionResult<TFieldKeys extends string> =
  | boolean
  | Partial<Record<TFieldKeys, true>>;

/**
 * A permission check can be a static value or a dynamic function.
 * Dynamic functions receive the document data and user for context-aware checks.
 *
 * @typeParam TFieldKeys - Union of field key strings for this resource
 * @typeParam TDocType - The document type for this resource
 * @typeParam TUser - The user type (inferred from user collection)
 */
export type PermissionCheck<
  TFieldKeys extends string,
  TDocType = Record<string, any>,
  TUser = Record<string, any>,
> =
  | FieldPermissionResult<TFieldKeys>
  | ((props: { data: TDocType; user: TUser }) => FieldPermissionResult<TFieldKeys>);

// =============================================================================
// ACCESS ACTION TYPES
// =============================================================================

/** The four CRUD actions supported by the permission system. */
export type AccessAction = "create" | "read" | "update" | "delete";

/**
 * Permission map for a single role on a single resource.
 * Each action is optional — missing actions default to permissive (all-true).
 */
export type ResourcePermissions<
  TFieldKeys extends string,
  TDocType = Record<string, any>,
  TUser = Record<string, any>,
> = Partial<{
  [Action in AccessAction]: PermissionCheck<TFieldKeys, TDocType, TUser>;
}>;

// =============================================================================
// ROLES WITH PERMISSIONS
// =============================================================================

/**
 * The full permission matrix: roles × resources × actions.
 * Each role maps to a partial record of resources, each mapping to action permissions.
 *
 * @typeParam TRoles - Union of role string literals (e.g., "admin" | "editor")
 * @typeParam TCollections - Tuple of VexCollection types
 * @typeParam TGlobals - Tuple of VexGlobal types
 * @typeParam TUser - The user document type
 */
export type RolesWithPermissions<
  TRoles extends string,
  TCollections extends readonly any[],
  TGlobals extends readonly any[],
  TUser = Record<string, any>,
> = Record<
  TRoles,
  Partial<
    {
      [Slug in ExtractSlug<TCollections[number]>]: ResourcePermissions<
        ExtractFieldKeys<LookupBySlug<TCollections, Slug>>,
        ExtractDocType<LookupBySlug<TCollections, Slug>>,
        TUser
      >;
    } & {
      [Slug in ExtractSlug<TGlobals[number]>]: ResourcePermissions<
        ExtractFieldKeys<LookupBySlug<TGlobals, Slug>>,
        ExtractDocType<LookupBySlug<TGlobals, Slug>>,
        TUser
      >;
    }
  >
>;

// =============================================================================
// ACCESS CONFIG
// =============================================================================

/**
 * Input shape for `defineAccess()`.
 * Carries generics for full type inference of roles, resources, and field keys.
 */
export interface VexAccessInput<
  TRoles extends readonly string[],
  TCollections extends readonly any[],
  TGlobals extends readonly any[],
  TUserSlug extends string,
> {
  /** Array of role name strings. Use `as const` for literal type inference. */
  roles: TRoles;

  /** The collections that become resources in the permission matrix. */
  collections: TCollections;

  /** The globals that become resources in the permission matrix. */
  globals?: TGlobals;

  /**
   * Slug of the user collection. Used to infer the user type for
   * dynamic permission callbacks `({ data, user })`.
   * Must match a slug in the `collections` array.
   */
  userCollection: TUserSlug;

  /** The role-to-resource-to-action permission matrix. */
  permissions: RolesWithPermissions<
    TRoles[number] & string,
    TCollections,
    TGlobals extends readonly any[] ? TGlobals : [],
    ExtractDocType<LookupBySlug<TCollections, TUserSlug>>
  >;
}

/**
 * Resolved access config stored on `VexConfig.access`.
 * Type-erased version for storage in the config object.
 */
export interface VexAccessConfig {
  /** The role name strings. */
  roles: readonly string[];

  /** Slug of the user collection. */
  userCollection: string;

  /**
   * The permission matrix.
   * Type-erased to `Record<string, ...>` for runtime consumption.
   * Use `hasPermission()` for type-safe access.
   */
  permissions: Record<
    string, // role
    Record<
      string, // resource slug
      Partial<Record<AccessAction, PermissionCheck<string, any, any>>>
    > | undefined
  >;
}
```

---

## Step 2: `defineAccess` Builder + Tests

- [ ] Create `packages/core/src/access/defineAccess.ts`
- [ ] Create `packages/core/src/access/defineAccess.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test` to verify tests pass

### `File: packages/core/src/access/defineAccess.ts`

Thin identity function that returns its input. Exists purely for TypeScript generic inference so that `permissions` gets full autocomplete on roles, resource slugs, and field keys.

```typescript
import type { VexAccessInput, VexAccessConfig } from "./types";

/**
 * Define access permissions for the Vex CMS admin panel.
 *
 * This is a builder function (like `defineCollection`) that provides full
 * TypeScript inference for roles, resource slugs, field keys, and user type.
 * The function body returns the input unchanged — it exists for type inference only.
 *
 * @param props.roles - Array of role name strings. Use `as const` for literal inference.
 * @param props.collections - The collections array (same one passed to `defineConfig`).
 * @param props.globals - Optional globals array.
 * @param props.userCollection - Slug of the user collection (for user type inference in callbacks).
 * @param props.permissions - The role × resource × action permission matrix.
 * @returns A `VexAccessConfig` for passing to `defineConfig({ access: ... })`.
 *
 * @example
 * ```ts
 * import { allCollections } from './collections';
 *
 * export const access = defineAccess({
 *   roles: ['admin', 'editor', 'author'] as const,
 *   collections: allCollections,
 *   userCollection: 'user',
 *   permissions: {
 *     admin: {
 *       posts: { create: true, read: true, update: true, delete: true },
 *     },
 *     editor: {
 *       posts: {
 *         create: true,
 *         read: true,
 *         update: ({ data, user }) => ({ title: true, status: true }),
 *         delete: false,
 *       },
 *     },
 *     author: {
 *       posts: {
 *         create: true,
 *         read: true,
 *         update: ({ data, user }) => ({ title: true }),
 *         delete: ({ data, user }) => user._id === data.authorId,
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function defineAccess<
  const TRoles extends readonly string[],
  const TCollections extends readonly any[],
  const TGlobals extends readonly any[],
  const TUserSlug extends string,
>(
  props: VexAccessInput<TRoles, TCollections, TGlobals, TUserSlug>,
): VexAccessConfig {
  // TODO: implement
  //
  // 1. In non-production, validate that userCollection slug exists in the
  //    collections array (find by props.userCollection matching collection.slug)
  //    → console.warn if not found
  //
  // 2. In non-production, validate that all resource slugs in permissions
  //    match a collection or global slug
  //    → console.warn for unknown resource slugs
  //
  // 3. In non-production, validate that all role keys in permissions
  //    match entries in the roles array
  //    → console.warn for unknown roles
  //
  // 4. Return the config as VexAccessConfig:
  //    {
  //      roles: props.roles,
  //      userCollection: props.userCollection,
  //      permissions: props.permissions (cast to the erased type),
  //    }
  //
  // Edge cases:
  // - Empty roles array → valid but permissions object should be empty
  // - Empty collections array → valid but no resources to assign permissions to
  // - globals is undefined → treat as empty array for validation
  throw new Error("Not implemented");
}
```

### `File: packages/core/src/access/defineAccess.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { defineAccess } from "./defineAccess";
import { defineCollection } from "../config/defineCollection";
import { defineGlobal } from "../config/defineGlobal";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";
import { checkbox } from "../fields/checkbox";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const posts = defineCollection("posts", {
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({ label: "Slug", required: true }),
    status: select({
      label: "Status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    }),
    featured: checkbox({ label: "Featured" }),
  },
  labels: { plural: "Posts", singular: "Post" },
});

const users = defineCollection("user", {
  fields: {
    name: text({ label: "Name", required: true }),
    role: select({
      label: "Role",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
      required: true,
    }),
    postCount: number({ label: "Post Count" }),
  },
  labels: { plural: "Users", singular: "User" },
});

const categories = defineCollection("categories", {
  fields: {
    name: text({ label: "Name", required: true }),
    sortOrder: number({ label: "Sort Order" }),
  },
});

const siteSettings = defineGlobal("site_settings", {
  label: "Site Settings",
  fields: {
    siteName: text({ label: "Site Name", required: true }),
    maintenance: checkbox({ label: "Maintenance Mode" }),
  },
});

const allCollections = [posts, users, categories] as const;
const allGlobals = [siteSettings] as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("defineAccess", () => {
  it("returns a VexAccessConfig with roles, userCollection, and permissions", () => {
    const access = defineAccess({
      roles: ["admin", "editor"] as const,
      collections: allCollections,
      userCollection: "user",
      permissions: {
        admin: {
          posts: {
            create: true,
            read: true,
            update: true,
            delete: true,
          },
        },
        editor: {
          posts: {
            create: true,
            read: true,
            update: { title: true, status: true },
            delete: false,
          },
        },
      },
    });

    expect(access.roles).toEqual(["admin", "editor"]);
    expect(access.userCollection).toBe("user");
    expect(access.permissions).toBeDefined();
    expect(access.permissions["admin"]).toBeDefined();
    expect(access.permissions["editor"]).toBeDefined();
  });

  it("accepts boolean permission values", () => {
    const access = defineAccess({
      roles: ["admin"] as const,
      collections: allCollections,
      userCollection: "user",
      permissions: {
        admin: {
          posts: {
            create: true,
            read: true,
            update: true,
            delete: true,
          },
        },
      },
    });

    expect(access.permissions["admin"]?.["posts"]?.create).toBe(true);
  });

  it("accepts partial Record<fieldKey, true> permission values", () => {
    const access = defineAccess({
      roles: ["editor"] as const,
      collections: allCollections,
      userCollection: "user",
      permissions: {
        editor: {
          posts: {
            read: { title: true, slug: true },
            update: { title: true },
          },
        },
      },
    });

    const readPerm = access.permissions["editor"]?.["posts"]?.read;
    expect(readPerm).toEqual({ title: true, slug: true });
  });

  it("accepts dynamic function permission checks", () => {
    const access = defineAccess({
      roles: ["editor"] as const,
      collections: allCollections,
      userCollection: "user",
      permissions: {
        editor: {
          posts: {
            update: ({ data, user }) => {
              // user type should be inferred from the "user" collection
              return { title: true };
            },
            delete: ({ data, user }) => {
              return false;
            },
          },
        },
      },
    });

    const updatePerm = access.permissions["editor"]?.["posts"]?.update;
    expect(typeof updatePerm).toBe("function");
  });

  it("supports globals as resources", () => {
    const access = defineAccess({
      roles: ["admin"] as const,
      collections: allCollections,
      globals: allGlobals,
      userCollection: "user",
      permissions: {
        admin: {
          site_settings: {
            read: true,
            update: { siteName: true },
          },
        },
      },
    });

    expect(access.permissions["admin"]?.["site_settings"]?.read).toBe(true);
  });

  it("allows partial resource coverage per role", () => {
    const access = defineAccess({
      roles: ["admin", "viewer"] as const,
      collections: allCollections,
      userCollection: "user",
      permissions: {
        admin: {
          posts: { create: true, read: true, update: true, delete: true },
          categories: { create: true, read: true, update: true, delete: true },
        },
        viewer: {
          posts: { read: true },
          // categories not mentioned → permissive default at runtime
        },
      },
    });

    expect(access.permissions["viewer"]?.["posts"]?.read).toBe(true);
    expect(access.permissions["viewer"]?.["categories"]).toBeUndefined();
  });

  it("allows partial action coverage per resource", () => {
    const access = defineAccess({
      roles: ["editor"] as const,
      collections: allCollections,
      userCollection: "user",
      permissions: {
        editor: {
          posts: {
            read: true,
            update: { title: true },
            // create and delete not mentioned → permissive default
          },
        },
      },
    });

    expect(access.permissions["editor"]?.["posts"]?.create).toBeUndefined();
  });

  it("warns in non-production when userCollection slug is not in collections", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    defineAccess({
      roles: ["admin"] as const,
      collections: allCollections,
      userCollection: "nonexistent" as any,
      permissions: {
        admin: {},
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("nonexistent"),
    );

    process.env.NODE_ENV = originalEnv;
    warnSpy.mockRestore();
  });
});
```

---

## Step 3: `hasPermission` Function + Tests

- [ ] Create `packages/core/src/access/hasPermission.ts`
- [ ] Create `packages/core/src/access/hasPermission.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test` to verify tests pass

### `File: packages/core/src/access/hasPermission.ts`

Runtime permission resolver. Takes a `VexAccessConfig`, a user (with roles), a resource slug, and an action, and returns the resolved field permission map or a single boolean.

```typescript
import type { AccessAction, VexAccessConfig, PermissionCheck } from "./types";

/**
 * The result of resolving field permissions for a resource action.
 * Maps each field key to whether the action is allowed on that field.
 */
export type ResolvedFieldPermissions = Record<string, boolean>;

/**
 * Resolve a permission check value (boolean, partial record, or function)
 * into a full `Record<fieldKey, boolean>` for a given resource.
 *
 * @param props.check - The permission check value to resolve
 * @param props.fieldKeys - All field keys for this resource
 * @param props.data - The document data (for dynamic checks)
 * @param props.user - The user object (for dynamic checks)
 * @returns Full field permission map where every field has an explicit boolean
 */
export function resolvePermissionCheck(props: {
  check: PermissionCheck<string, any, any> | undefined;
  fieldKeys: string[];
  data: Record<string, any>;
  user: Record<string, any>;
}): ResolvedFieldPermissions {
  // TODO: implement
  //
  // 1. If props.check is undefined → return all-true map
  //    (permissive default for missing actions)
  //    → Object.fromEntries(props.fieldKeys.map(k => [k, true]))
  //
  // 2. If props.check is a function → call it with { data: props.data, user: props.user }
  //    → result is either boolean or Partial<Record<fieldKey, true>>
  //    → recurse or handle inline (go to step 3 or 4 with the result)
  //
  // 3. If the resolved value is a boolean:
  //    → return Object.fromEntries(props.fieldKeys.map(k => [k, resolvedBoolean]))
  //
  // 4. If the resolved value is an object (Partial<Record<fieldKey, true>>):
  //    → return Object.fromEntries(props.fieldKeys.map(k => [k, k in resolved && resolved[k] === true]))
  //    → fields present in the record with value `true` → true
  //    → all other fields → false (allowlist mode)
  //
  // Edge cases:
  // - Function throws → let it propagate (caller decides error handling)
  // - Function returns undefined → treat as false (deny all)
  // - Empty fieldKeys array → return empty object
  throw new Error("Not implemented");
}

/**
 * Merge field permission maps from multiple roles using OR logic.
 * If any role grants access to a field, that field is allowed.
 *
 * @param props.permissionMaps - Array of resolved field permission maps (one per role)
 * @param props.fieldKeys - All field keys for this resource
 * @returns Merged field permission map
 */
export function mergeRolePermissions(props: {
  permissionMaps: ResolvedFieldPermissions[];
  fieldKeys: string[];
}): ResolvedFieldPermissions {
  // TODO: implement
  //
  // 1. If props.permissionMaps is empty → return all-true map
  //    (no roles = permissive default, but this shouldn't happen
  //     since empty roles on user → deny all is handled by caller)
  //
  // 2. For each field in props.fieldKeys:
  //    → result[field] = props.permissionMaps.some(map => map[field] === true)
  //    → OR logic: any role granting access = allowed
  //
  // 3. Return the merged map
  //
  // Edge cases:
  // - A field appears in some maps but not others → missing = false
  // - All maps deny a field → false
  throw new Error("Not implemented");
}

/**
 * Check permissions for a user on a resource action.
 *
 * Overload 1: Without `field` param → returns `Record<fieldKey, boolean>`
 * Overload 2: With `field` param → returns `boolean` for that specific field
 *
 * @param props.access - The VexAccessConfig from defineAccess
 * @param props.user - The user object. Must have a property matching the roles (looked up by access.roles context).
 * @param props.userRoles - The user's role(s) as a string array (e.g., `["admin"]` or `["editor", "author"]`)
 * @param props.resource - The resource slug (collection or global slug)
 * @param props.action - The CRUD action to check
 * @param props.fieldKeys - All field keys for this resource (required for resolution)
 * @param props.data - Document data for dynamic permission checks. Defaults to `{}`.
 * @param props.field - Optional specific field to check. When provided, returns boolean instead of Record.
 * @returns `Record<string, boolean>` when field is omitted, `boolean` when field is provided
 */
export function hasPermission(props: {
  access: VexAccessConfig | undefined;
  user: Record<string, any>;
  userRoles: string[];
  resource: string;
  action: AccessAction;
  fieldKeys: string[];
  data?: Record<string, any>;
  field?: string;
}): ResolvedFieldPermissions | boolean {
  // TODO: implement
  //
  // 1. If props.access is undefined → permissive default
  //    a. If props.field is provided → return true
  //    b. Else → return all-true map from props.fieldKeys
  //
  // 2. If props.userRoles is empty → deny all
  //    a. If props.field is provided → return false
  //    b. Else → return all-false map from props.fieldKeys
  //
  // 3. For each role in props.userRoles:
  //    a. Look up props.access.permissions[role]
  //    b. If undefined → this role has no permissions defined → skip (will be handled by merge)
  //       Actually: if a role has NO resource entry, it should contribute an all-true map
  //       (permissive default for undefined resources)
  //       Wait — re-read: "permissive default" means if NO access config exists, all-true.
  //       But if access config exists and a role has no entry for a resource, that role
  //       contributes nothing for that resource (other roles may still grant access).
  //       If NO role has an entry for the resource → all-true (permissive default).
  //    c. Look up rolePermissions[props.resource]
  //    d. If undefined → this role has no permissions for this resource
  //       → contribute an all-true map (permissive for this role on this resource)
  //    e. Look up resourcePermissions[props.action]
  //    f. Call resolvePermissionCheck({ check, fieldKeys: props.fieldKeys, data: props.data ?? {}, user: props.user })
  //    g. Collect the resolved map
  //
  // 4. Merge all role maps with mergeRolePermissions({ permissionMaps, fieldKeys: props.fieldKeys })
  //
  // 5. If props.field is provided:
  //    → return merged[props.field] ?? false
  //
  // 6. Else → return the merged map
  //
  // Edge cases:
  // - Role in userRoles not in access.roles → skip (no permissions for unknown roles)
  // - Resource slug not in any role's permissions → all-true for all roles that don't mention it
  // - Field not in fieldKeys → won't appear in result map; if asked via props.field → false
  // - data is undefined → default to {} for function calls
  throw new Error("Not implemented");
}
```

### `File: packages/core/src/access/hasPermission.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  hasPermission,
  resolvePermissionCheck,
  mergeRolePermissions,
} from "./hasPermission";
import type { VexAccessConfig } from "./types";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const FIELD_KEYS_POSTS = ["title", "slug", "status", "featured"];
const FIELD_KEYS_CATEGORIES = ["name", "sortOrder"];

const mockUser = { _id: "user1", name: "Test User", role: ["editor"] };
const mockOtherUser = { _id: "user2", name: "Other User", role: ["editor"] };

/** A fully-populated access config for testing. */
const testAccess: VexAccessConfig = {
  roles: ["admin", "editor", "viewer"],
  userCollection: "user",
  permissions: {
    admin: {
      posts: {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
      categories: {
        create: true,
        read: true,
        update: true,
        delete: true,
      },
    },
    editor: {
      posts: {
        create: true,
        read: true,
        update: { title: true, status: true },
        delete: false,
      },
      categories: {
        read: true,
        update: { name: true },
      },
    },
    viewer: {
      posts: {
        read: true,
      },
    },
  },
};

/** Access config with dynamic function checks. */
const dynamicAccess: VexAccessConfig = {
  roles: ["editor"],
  userCollection: "user",
  permissions: {
    editor: {
      posts: {
        update: ({ data, user }: { data: any; user: any }) => {
          if (user._id === data.authorId) {
            return { title: true, status: true, slug: true, featured: true };
          }
          return { title: true };
        },
        delete: ({ data, user }: { data: any; user: any }) => {
          return user._id === data.authorId;
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// resolvePermissionCheck
// ---------------------------------------------------------------------------

describe("resolvePermissionCheck", () => {
  it("returns all-true when check is undefined (permissive default)", () => {
    const result = resolvePermissionCheck({
      check: undefined,
      fieldKeys: FIELD_KEYS_POSTS,
      data: {},
      user: mockUser,
    });

    expect(result).toEqual({
      title: true,
      slug: true,
      status: true,
      featured: true,
    });
  });

  it("returns all-true when check is boolean true", () => {
    const result = resolvePermissionCheck({
      check: true,
      fieldKeys: FIELD_KEYS_POSTS,
      data: {},
      user: mockUser,
    });

    expect(result).toEqual({
      title: true,
      slug: true,
      status: true,
      featured: true,
    });
  });

  it("returns all-false when check is boolean false", () => {
    const result = resolvePermissionCheck({
      check: false,
      fieldKeys: FIELD_KEYS_POSTS,
      data: {},
      user: mockUser,
    });

    expect(result).toEqual({
      title: false,
      slug: false,
      status: false,
      featured: false,
    });
  });

  it("returns allowlist when check is a partial record", () => {
    const result = resolvePermissionCheck({
      check: { title: true, status: true },
      fieldKeys: FIELD_KEYS_POSTS,
      data: {},
      user: mockUser,
    });

    expect(result).toEqual({
      title: true,
      slug: false,
      status: true,
      featured: false,
    });
  });

  it("calls function check with data and user", () => {
    const check = ({ data, user }: { data: any; user: any }) => {
      return user._id === data.authorId;
    };

    const resultOwner = resolvePermissionCheck({
      check,
      fieldKeys: FIELD_KEYS_POSTS,
      data: { authorId: "user1" },
      user: mockUser,
    });

    expect(resultOwner).toEqual({
      title: true,
      slug: true,
      status: true,
      featured: true,
    });

    const resultNonOwner = resolvePermissionCheck({
      check,
      fieldKeys: FIELD_KEYS_POSTS,
      data: { authorId: "other" },
      user: mockUser,
    });

    expect(resultNonOwner).toEqual({
      title: false,
      slug: false,
      status: false,
      featured: false,
    });
  });

  it("handles function returning partial record", () => {
    const check = () => ({ title: true, slug: true });

    const result = resolvePermissionCheck({
      check,
      fieldKeys: FIELD_KEYS_POSTS,
      data: {},
      user: mockUser,
    });

    expect(result).toEqual({
      title: true,
      slug: true,
      status: false,
      featured: false,
    });
  });

  it("returns empty object for empty fieldKeys", () => {
    const result = resolvePermissionCheck({
      check: true,
      fieldKeys: [],
      data: {},
      user: mockUser,
    });

    expect(result).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// mergeRolePermissions
// ---------------------------------------------------------------------------

describe("mergeRolePermissions", () => {
  it("uses OR logic across role permission maps", () => {
    const result = mergeRolePermissions({
      permissionMaps: [
        { title: true, slug: false, status: false, featured: false },
        { title: false, slug: false, status: true, featured: false },
      ],
      fieldKeys: FIELD_KEYS_POSTS,
    });

    expect(result).toEqual({
      title: true,
      slug: false,
      status: true,
      featured: false,
    });
  });

  it("returns all-true for empty permissionMaps", () => {
    const result = mergeRolePermissions({
      permissionMaps: [],
      fieldKeys: FIELD_KEYS_POSTS,
    });

    expect(result).toEqual({
      title: true,
      slug: true,
      status: true,
      featured: true,
    });
  });

  it("handles single role map", () => {
    const result = mergeRolePermissions({
      permissionMaps: [
        { title: true, slug: false, status: true, featured: false },
      ],
      fieldKeys: FIELD_KEYS_POSTS,
    });

    expect(result).toEqual({
      title: true,
      slug: false,
      status: true,
      featured: false,
    });
  });

  it("treats missing fields in a map as false", () => {
    const result = mergeRolePermissions({
      permissionMaps: [
        { title: true },
        { slug: true },
      ],
      fieldKeys: FIELD_KEYS_POSTS,
    });

    expect(result).toEqual({
      title: true,
      slug: true,
      status: false,
      featured: false,
    });
  });
});

// ---------------------------------------------------------------------------
// hasPermission
// ---------------------------------------------------------------------------

describe("hasPermission", () => {
  describe("permissive defaults", () => {
    it("returns all-true when access is undefined", () => {
      const result = hasPermission({
        access: undefined,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("returns true for specific field when access is undefined", () => {
      const result = hasPermission({
        access: undefined,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
        field: "title",
      });

      expect(result).toBe(true);
    });

    it("returns all-true when resource has no permissions entry for any role", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["viewer"],
        resource: "categories",
        action: "read",
        fieldKeys: FIELD_KEYS_CATEGORIES,
      });

      // viewer has no categories entry → permissive default for that role
      expect(result).toEqual({
        name: true,
        sortOrder: true,
      });
    });
  });

  describe("deny all", () => {
    it("returns all-false when userRoles is empty", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: [],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      expect(result).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });

    it("returns false for specific field when userRoles is empty", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: [],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
        field: "title",
      });

      expect(result).toBe(false);
    });
  });

  describe("boolean permissions", () => {
    it("admin gets all-true for all actions on posts", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["admin"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("viewer gets all-false for delete on posts (no delete defined)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["viewer"],
        resource: "posts",
        action: "delete",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      // viewer has posts.read: true but no delete → permissive default for missing action
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("editor gets all-false for delete on posts (delete: false)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      expect(result).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });
  });

  describe("partial record permissions (allowlist)", () => {
    it("editor gets only allowed fields for update on posts", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      expect(result).toEqual({
        title: true,
        slug: false,
        status: true,
        featured: false,
      });
    });

    it("returns boolean for specific allowed field", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
        field: "title",
      });

      expect(result).toBe(true);
    });

    it("returns boolean for specific denied field", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
        field: "slug",
      });

      expect(result).toBe(false);
    });
  });

  describe("dynamic function permissions", () => {
    it("resolves function check with matching user (owner)", () => {
      const result = hasPermission({
        access: dynamicAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
        data: { authorId: "user1" },
      });

      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("resolves function check with non-matching user (not owner)", () => {
      const result = hasPermission({
        access: dynamicAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
        data: { authorId: "other" },
      });

      expect(result).toEqual({
        title: true,
        slug: false,
        status: false,
        featured: false,
      });
    });

    it("resolves function returning boolean for delete", () => {
      const resultOwner = hasPermission({
        access: dynamicAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        fieldKeys: FIELD_KEYS_POSTS,
        data: { authorId: "user1" },
      });

      expect(resultOwner).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });

      const resultNonOwner = hasPermission({
        access: dynamicAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        fieldKeys: FIELD_KEYS_POSTS,
        data: { authorId: "other" },
      });

      expect(resultNonOwner).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });
  });

  describe("multi-role merge (OR logic)", () => {
    it("merges permissions from multiple roles", () => {
      // editor: posts.update = { title: true, status: true }
      // viewer: posts has no update → permissive default (all-true)
      // OR merge: all-true wins
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor", "viewer"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      // viewer has no update defined → permissive default → all true
      // merged with editor's partial → OR → all true
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("merges when both roles have restrictive permissions", () => {
      // Create access where both roles are restrictive
      const restrictiveAccess: VexAccessConfig = {
        roles: ["role_a", "role_b"],
        userCollection: "user",
        permissions: {
          role_a: {
            posts: {
              update: { title: true, slug: true },
            },
          },
          role_b: {
            posts: {
              update: { status: true, featured: true },
            },
          },
        },
      };

      const result = hasPermission({
        access: restrictiveAccess,
        user: mockUser,
        userRoles: ["role_a", "role_b"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      // OR merge: role_a grants title+slug, role_b grants status+featured
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("unknown roles in userRoles are skipped", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["unknown_role"],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      // unknown role has no permissions entry → no maps to merge → all-true (permissive)
      // Wait: this is a case where the role IS in userRoles but NOT in access.permissions.
      // Since we skip unknown roles, permissionMaps will be empty → mergeRolePermissions
      // returns all-true. This is the permissive default.
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });
  });

  describe("field param overload", () => {
    it("returns boolean true for allowed field", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["admin"],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
        field: "title",
      });

      expect(result).toBe(true);
    });

    it("returns boolean false for denied field", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
        field: "featured",
      });

      expect(result).toBe(false);
    });

    it("returns false for unknown field", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["admin"],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
        field: "nonexistent",
      });

      expect(result).toBe(false);
    });
  });
});
```

---

## Step 4: Config Integration + Exports

- [ ] Modify `packages/core/src/types/index.ts` — add `access` to `VexConfig` and `VexConfigInput`
- [ ] Modify `packages/core/src/config/defineConfig.ts` — make generic for inline access, pass through access field
- [ ] Modify `packages/core/src/index.ts` — export `defineAccess`, `hasPermission`, and access types
- [ ] Run `pnpm --filter @vexcms/core build`
- [ ] Run `pnpm --filter @vexcms/core test`
- [ ] Verify test-app compiles with `pnpm --filter test-app build` (no access defined yet — should still work)

### `File: packages/core/src/types/index.ts` (modify)

Add `access` field to both `VexConfig` and `VexConfigInput`.

**Add import at top:**
```typescript
import type { VexAccessConfig } from "../access/types";
```

**Add to `VexConfig` interface (after `schema: SchemaConfig;`):**
```typescript
  /** RBAC access permissions config. Optional — if not set, all actions are allowed. */
  access?: VexAccessConfig;
```

**Add to `VexConfigInput` interface (after `schema?: SchemaConfigInput;`):**
```typescript
  /**
   * RBAC access permissions configuration.
   * Created with `defineAccess()` or defined inline.
   *
   * If not set, the admin panel allows all actions on all fields (permissive default).
   */
  access?: VexAccessConfig;
```

### `File: packages/core/src/config/defineConfig.ts` (modify)

Pass through the `access` field from input to resolved config.

**Add to the `config` object construction (after `schema: { ... },`):**
```typescript
    access: vexConfig.access,
```

### `File: packages/core/src/index.ts` (modify)

Add exports for the new access module.

**Add function exports (after the `defineConfig` export):**
```typescript
export { defineAccess } from "./access/defineAccess";
export { hasPermission } from "./access/hasPermission";
```

**Add type exports (in the type export block, after the config input types):**
```typescript
  // Access types
  VexAccessConfig,
  VexAccessInput,
  AccessAction,
  FieldPermissionResult,
  PermissionCheck,
  RolesWithPermissions,
  ResolvedFieldPermissions,
```

Note: `VexAccessConfig` and `VexAccessInput` come from `"./access/types"`. `ResolvedFieldPermissions` comes from `"./access/hasPermission"`. Add appropriate import sources.

---

## Success Criteria

- [ ] `pnpm --filter @vexcms/core build` succeeds
- [ ] `pnpm --filter @vexcms/core test` passes all existing tests + new access tests
- [ ] `defineAccess` provides full LSP autocomplete for:
  - Role names (from `roles` array)
  - Resource slugs (from `collections` and `globals` arrays)
  - Field keys per resource in permission return types
  - User type in `({ data, user })` callbacks (inferred from `userCollection`)
- [ ] `hasPermission` correctly resolves:
  - Boolean permissions → all-true or all-false field map
  - Partial record permissions → allowlist with unlisted = false
  - Function permissions → called with data/user context
  - Multi-role OR merge
  - Permissive defaults for undefined access/resources/actions
  - `field` param overload returning single boolean
- [ ] `VexConfig.access` is optional and backward-compatible (existing configs without `access` still work)
- [ ] Test-app still compiles without changes
