# 16 — RBAC Access Permissions

## Overview

Add a type-safe RBAC (Role-Based Access Control) permissions system to `@vexcms/core`. Users define roles, map them to field-level CRUD permissions per resource (collection, media collection, or global), and attach the result to `vex.config.ts`. A `hasPermission` function resolves permissions at runtime for use in admin panel enforcement or server-side guards.

## Design Decisions

1. **All four actions (create, read, update, delete) support field-level granularity.** Each permission check can return `boolean` (applies to all fields) or a `{ mode, fields }` object for allowlist/denylist semantics.

2. **Field permission results use an explicit mode flag.** Callbacks return one of:
   - `boolean` — allow or deny all fields uniformly
   - `{ mode: 'allow', fields: FieldKey[] }` — only listed fields are allowed; unlisted are denied
   - `{ mode: 'deny', fields: FieldKey[] }` — listed fields are denied; unlisted are allowed

3. **Dynamic permission callbacks** receive `({ data, user, organization })` context. The `user` type is inferred from the user collection (with optional explicit override). The `organization` type is inferred from the org collection when provided.

4. **`defineAccess` is a builder function** (like `defineCollection`) that exists purely for TypeScript inference. It accepts `resources`, `roles`, `userCollection`, and `permissions`. An optional `orgCollection` + `userOrgField` pair enables organization context in callbacks.

5. **`resources` restricts the permission matrix.** When provided, only those collection/global slugs are valid in the permissions object. When omitted, all collections and globals in the config are available. Resources not mentioned in the permissions object get permissive defaults.

6. **`userCollection` and `orgCollection` are separate from `resources`.** They identify which collections provide the user and org types for callback inference, but they are not themselves permission resources (unless also included in `resources`).

7. **Multi-role resolution uses OR logic.** If a user has roles `['editor', 'author']` and either role grants a field, that field is allowed. Allow always wins over deny in cross-role merges.

8. **Permissive default.** If no access config is defined, or a resource/action has no permissions entry, `hasPermission` returns all-true.

9. **`hasPermission` has two overloads:**
   - Without `field` param → returns `Record<fieldKey, boolean>` (full field map)
   - With `field` param → returns `boolean` (single field check)

10. **`hasPermission` is a pure, synchronous function.** The caller is responsible for resolving the user and organization objects before calling. This keeps it usable on both server and client.

11. **`access` lives at the top level** of `VexConfig` alongside `auth`, not nested inside it.

12. **Org collection and user org field are coupled.** If `orgCollection` is provided, `userOrgField` is required (and vice versa). The `userOrgField` identifies which field on the user collection relates to the org collection.

13. **`hasPermission` supports a `throwOnDenied` flag.** When `true`, `hasPermission` throws a `VexAccessError` instead of returning `false` or an all-false field map. This is useful in server-side guards (Convex mutations/queries) where you want to halt execution on denied access. When `false` (default), it returns normally.

## Out of Scope

- Per-collection `access` config on `VexCollection`
- Per-field `access` config on field definitions
- Admin panel UI integration (consuming permissions to hide/show fields — next spec)
- Server-side Convex mutation/query guards (will use `hasPermission` in a future spec)
- Block field / array field sub-item permission granularity

## Target Directory Structure

```
packages/core/src/
├── access/
│   ├── types.ts              # VexAccessConfig, PermissionCheck, FieldPermissionResult types
│   ├── defineAccess.ts        # defineAccess() builder function
│   ├── defineAccess.test.ts   # Tests for defineAccess + type validation
│   ├── hasPermission.ts       # hasPermission() + resolvePermissionCheck + mergeRolePermissions
│   └── hasPermission.test.ts  # Tests for hasPermission runtime logic
├── config/
│   └── defineConfig.ts        # Modified — pass through access field
├── types/
│   └── index.ts               # Modified — add access to VexConfig / VexConfigInput
├── errors/
│   └── index.ts               # Modified — add VexAccessConfigError, VexAccessError
└── index.ts                   # Modified — export new access types and functions
```

## Implementation Order

1. **Step 1: Access types** — Core type definitions. After this step, types compile and can be imported.
2. **Step 2: `defineAccess` builder + tests** — Builder function with full type inference. Tests verify type safety and runtime passthrough.
3. **Step 3: `hasPermission` function + tests** — Runtime permission resolution with all overloads. Tests cover boolean returns, mode objects, dynamic callbacks, multi-role merge, and edge cases.
4. **Step 4: Config integration + exports** — Add `access` field to `VexConfig`/`VexConfigInput`, pass through in `defineConfig`, update `index.ts` exports. Verify test-app compiles.

---

## Step 1: Access Types

- [ ] Create `packages/core/src/access/types.ts`
- [ ] Add `VexAccessConfigError` and `VexAccessError` to `packages/core/src/errors/index.ts`
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
 * Extract the slug literal type from a VexCollection or VexGlobal.
 *
 * @example
 * type S = ExtractSlug<typeof posts>; // "posts"
 */
export type ExtractSlug<T> = T extends { slug: infer S extends string }
  ? S
  : never;

/**
 * Extract field keys from a VexCollection (including auth extra keys) or VexGlobal.
 *
 * @example
 * type K = ExtractFieldKeys<typeof posts>; // "title" | "slug" | "status" | "featured"
 */
export type ExtractFieldKeys<T> = T extends VexCollection<infer TFields, infer TExtraKeys>
  ? (keyof TFields & string) | (TExtraKeys & string)
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

/**
 * Extract all slugs from a tuple of resources.
 */
export type ExtractSlugs<TResources extends readonly any[]> =
  TResources extends readonly [infer Head, ...infer Tail]
    ? ExtractSlug<Head> | ExtractSlugs<Tail>
    : never;

// =============================================================================
// PERMISSION RESULT TYPES
// =============================================================================

/**
 * The return type for a permission check on a resource.
 * - `boolean` — applies uniformly to all fields (true = all allowed, false = all denied)
 * - `{ mode: 'allow', fields: FieldKey[] }` — only listed fields are allowed; unlisted are denied
 * - `{ mode: 'deny', fields: FieldKey[] }` — listed fields are denied; unlisted are allowed
 */
export type FieldPermissionResult<TFieldKeys extends string> =
  | boolean
  | { mode: "allow"; fields: TFieldKeys[] }
  | { mode: "deny"; fields: TFieldKeys[] };

/**
 * A permission check can be a static value or a dynamic function.
 * Dynamic functions receive document data, user, and optional organization for
 * context-aware checks.
 *
 * @typeParam TFieldKeys - Union of field key strings for this resource
 * @typeParam TDocType - The document type for this resource
 * @typeParam TUser - The user type (inferred from user collection or explicit override)
 * @typeParam TOrg - The organization type (inferred from org collection, or never)
 */
export type PermissionCheck<
  TFieldKeys extends string,
  TDocType = Record<string, any>,
  TUser = Record<string, any>,
  TOrg = never,
> =
  | FieldPermissionResult<TFieldKeys>
  | ((props: PermissionCallbackProps<TDocType, TUser, TOrg>) => FieldPermissionResult<TFieldKeys>);

/**
 * Props passed to dynamic permission check callbacks.
 * When TOrg is `never`, the `organization` field is omitted entirely.
 */
export type PermissionCallbackProps<
  TDocType = Record<string, any>,
  TUser = Record<string, any>,
  TOrg = never,
> = [TOrg] extends [never]
  ? { data: TDocType; user: TUser }
  : { data: TDocType; user: TUser; organization: TOrg };

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
  TOrg = never,
> = Partial<{
  [Action in AccessAction]: PermissionCheck<TFieldKeys, TDocType, TUser, TOrg>;
}>;

// =============================================================================
// ROLES WITH PERMISSIONS
// =============================================================================

/**
 * The full permission matrix: roles × resources × actions.
 * Each role maps to a partial record of resources, each mapping to action permissions.
 *
 * @typeParam TRoles - Union of role string literals (e.g., "admin" | "editor")
 * @typeParam TResources - Tuple of VexCollection / VexGlobal types that are valid resources
 * @typeParam TUser - The user document type
 * @typeParam TOrg - The organization document type (never if no org)
 */
export type RolesWithPermissions<
  TRoles extends string,
  TResources extends readonly any[],
  TUser = Record<string, any>,
  TOrg = never,
> = Record<
  TRoles,
  Partial<{
    [Slug in ExtractSlugs<TResources>]: ResourcePermissions<
      ExtractFieldKeys<LookupBySlug<TResources, Slug>>,
      ExtractDocType<LookupBySlug<TResources, Slug>>,
      TUser,
      TOrg
    >;
  }>
>;

// =============================================================================
// ACCESS CONFIG INPUT (for defineAccess)
// =============================================================================

/**
 * Input shape for `defineAccess()` WITHOUT organization support.
 * Carries generics for full type inference of roles, resources, and field keys.
 */
export interface VexAccessInputBase<
  TRoles extends readonly string[],
  TResources extends readonly any[],
  TUserCollection extends { slug: string },
  TUser,
> {
  /** Array of role name strings. Use `as const` for literal type inference. */
  roles: TRoles;

  /**
   * The resources (collections, media collections, globals) that become entries
   * in the permission matrix. When omitted, all collections and globals in the
   * config are available — but type inference only works for explicitly listed resources.
   */
  resources?: TResources;

  /**
   * The user collection. Used to infer the user type for dynamic permission
   * callbacks `({ data, user })`. Must be a collection created with `defineCollection`.
   */
  userCollection: TUserCollection;

  /**
   * Optional explicit user type override. When provided, this type is used
   * for the `user` param in permission callbacks instead of inferring from
   * the user collection's fields.
   */
  userType?: TUser;

  /** The role-to-resource-to-action permission matrix. */
  permissions: RolesWithPermissions<
    TRoles[number] & string,
    TResources,
    TUser extends undefined ? ExtractDocType<TUserCollection> : NonNullable<TUser>,
    never
  >;
}

/**
 * Input shape for `defineAccess()` WITH organization support.
 * Extends the base input with org collection and user org field.
 */
export interface VexAccessInputWithOrg<
  TRoles extends readonly string[],
  TResources extends readonly any[],
  TUserCollection extends { slug: string },
  TUser,
  TOrgCollection extends { slug: string },
  TOrg,
> {
  roles: TRoles;
  resources?: TResources;
  userCollection: TUserCollection;
  userType?: TUser;

  /**
   * The organization collection. Used to infer the organization type for
   * dynamic permission callbacks `({ data, user, organization })`.
   */
  orgCollection: TOrgCollection;

  /**
   * Optional explicit organization type override. When provided, this type is
   * used for the `organization` param in callbacks instead of inferring from
   * the org collection's fields.
   */
  orgType?: TOrg;

  /**
   * The field key on the user collection that relates to the organization collection.
   * Used at runtime by callers to resolve the organization from the user object.
   * Must be a field key on the user collection.
   */
  userOrgField: ExtractFieldKeys<TUserCollection>;

  permissions: RolesWithPermissions<
    TRoles[number] & string,
    TResources,
    TUser extends undefined ? ExtractDocType<TUserCollection> : NonNullable<TUser>,
    TOrg extends undefined ? ExtractDocType<TOrgCollection> : NonNullable<TOrg>
  >;
}

/**
 * Union of both input shapes. TypeScript will narrow based on presence of `orgCollection`.
 */
export type VexAccessInput<
  TRoles extends readonly string[],
  TResources extends readonly any[],
  TUserCollection extends { slug: string },
  TUser = undefined,
  TOrgCollection extends { slug: string } = never,
  TOrg = undefined,
> = [TOrgCollection] extends [never]
  ? VexAccessInputBase<TRoles, TResources, TUserCollection, TUser>
  : VexAccessInputWithOrg<TRoles, TResources, TUserCollection, TUser, TOrgCollection, TOrg>;

// =============================================================================
// RESOLVED ACCESS CONFIG (stored on VexConfig)
// =============================================================================

/**
 * Resolved access config stored on `VexConfig.access`.
 * Type-erased version for storage in the config object.
 * Use `hasPermission()` for type-safe runtime access.
 */
export interface VexAccessConfig {
  /** The role name strings. */
  roles: readonly string[];

  /** Slug of the user collection. */
  userCollection: string;

  /**
   * Slug of the organization collection, if org support is enabled.
   */
  orgCollection?: string;

  /**
   * The field key on the user collection that relates to the org collection.
   * Present only when orgCollection is set.
   */
  userOrgField?: string;

  /**
   * The permission matrix.
   * Type-erased to `Record<string, ...>` for runtime consumption.
   * Use `hasPermission()` for type-safe access.
   */
  permissions: Record<
    string, // role
    | Record<
        string, // resource slug
        Partial<Record<AccessAction, PermissionCheck<string, any, any, any>>>
      >
    | undefined
  >;
}
```

### `File: packages/core/src/errors/index.ts` (modify)

Add `VexAccessConfigError` and `VexAccessError` after the existing `VexMediaConfigError`.

```typescript
/**
 * Thrown when access configuration is invalid.
 * For example: orgCollection provided without userOrgField.
 */
export class VexAccessConfigError extends VexError {
  constructor(detail: string) {
    super(`Access configuration error: ${detail}`);
    this.name = "VexAccessConfigError";
  }
}

/**
 * Thrown by `hasPermission` when `throwOnDenied` is true and the user
 * does not have permission for the requested action.
 *
 * Contains structured context about the denied access attempt so callers
 * can log, surface to users, or handle programmatically.
 */
export class VexAccessError extends VexError {
  constructor(
    public readonly resource: string,
    public readonly action: string,
    public readonly field?: string,
  ) {
    const target = field
      ? `field "${field}" on resource "${resource}"`
      : `resource "${resource}"`;
    super(`Access denied: ${action} on ${target}`);
    this.name = "VexAccessError";
  }
}
```

---

## Step 2: `defineAccess` Builder + Tests

- [ ] Create `packages/core/src/access/defineAccess.ts`
- [ ] Create `packages/core/src/access/defineAccess.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test` to verify tests pass

### `File: packages/core/src/access/defineAccess.ts`

Thin identity function that returns its input cast to `VexAccessConfig`. Exists purely for TypeScript generic inference so that `permissions` gets full autocomplete on roles, resource slugs, and field keys.

```typescript
import type { VexAccessConfig } from "./types";
import { VexAccessConfigError } from "../errors";

/**
 * Define access permissions for the Vex CMS admin panel.
 *
 * This is a builder function (like `defineCollection`) that provides full
 * TypeScript inference for roles, resource slugs, field keys, user type,
 * and organization type.
 *
 * The function validates configuration in non-production and returns a
 * `VexAccessConfig` for passing to `defineConfig({ access: ... })`.
 *
 * @param props.roles - Array of role name strings. Use `as const` for literal inference.
 * @param props.resources - Optional array of collections/globals that are valid permission resources.
 * @param props.userCollection - The user collection (for user type inference in callbacks).
 * @param props.userType - Optional explicit user type override.
 * @param props.orgCollection - Optional organization collection (for org type inference).
 * @param props.orgType - Optional explicit organization type override.
 * @param props.userOrgField - Required when orgCollection is set. Field on user collection referencing the org.
 * @param props.permissions - The role × resource × action permission matrix.
 * @returns A `VexAccessConfig` for passing to `defineConfig({ access: ... })`.
 *
 * @example
 * ```ts
 * // Without organization
 * const access = defineAccess({
 *   roles: ['admin', 'editor', 'author'] as const,
 *   resources: [posts, users, categories] as const,
 *   userCollection: users,
 *   permissions: {
 *     admin: {
 *       posts: { create: true, read: true, update: true, delete: true },
 *     },
 *     editor: {
 *       posts: {
 *         create: true,
 *         read: true,
 *         update: ({ data, user }) => ({ mode: 'allow', fields: ['title', 'status'] }),
 *         delete: false,
 *       },
 *     },
 *     author: {
 *       posts: {
 *         create: true,
 *         read: true,
 *         update: ({ data, user }) => ({ mode: 'allow', fields: ['title'] }),
 *         delete: ({ data, user }) => user._id === data.authorId,
 *       },
 *     },
 *   },
 * });
 *
 * // With organization
 * const access = defineAccess({
 *   roles: ['admin', 'member'] as const,
 *   resources: [posts, users] as const,
 *   userCollection: users,
 *   orgCollection: organizations,
 *   userOrgField: 'orgId',
 *   permissions: {
 *     admin: {
 *       posts: { create: true, read: true, update: true, delete: true },
 *     },
 *     member: {
 *       posts: {
 *         read: ({ data, user, organization }) => data.orgId === organization._id,
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function defineAccess<
  const TRoles extends readonly string[],
  const TResources extends readonly any[],
  const TUserCollection extends { slug: string },
  TUser = undefined,
  const TOrgCollection extends { slug: string } = never,
  TOrg = undefined,
>(
  props: {
    roles: TRoles;
    resources?: TResources;
    userCollection: TUserCollection;
    userType?: TUser;
    permissions: any;
  } & (
    | { orgCollection?: never; orgType?: never; userOrgField?: never }
    | { orgCollection: TOrgCollection; orgType?: TOrg; userOrgField: string }
  ),
): VexAccessConfig {
  // TODO: implement
  //
  // 1. Validate org config coupling:
  //    → If props.orgCollection is provided but props.userOrgField is not
  //      → throw VexAccessConfigError("orgCollection requires userOrgField")
  //    → If props.userOrgField is provided but props.orgCollection is not
  //      → throw VexAccessConfigError("userOrgField requires orgCollection")
  //
  // 2. In non-production (process.env.NODE_ENV !== "production"), validate:
  //    a. That props.userCollection has a slug property
  //       → console.warn if not: `[vex] defineAccess: userCollection must have a slug`
  //    b. If props.resources is provided, validate that all resource slugs in
  //       props.permissions match a slug in the resources array
  //       → console.warn for unknown resource slugs:
  //         `[vex] defineAccess: permission resource "${slug}" not found in resources`
  //    c. Validate that all role keys in props.permissions match entries in the roles array
  //       → console.warn for unknown roles:
  //         `[vex] defineAccess: permission role "${role}" not in roles array`
  //    d. If props.orgCollection is provided, validate it has a slug property
  //       → console.warn if not
  //    e. If props.userOrgField is provided and props.userCollection has fields,
  //       validate that userOrgField exists in userCollection.fields
  //       → console.warn if not found:
  //         `[vex] defineAccess: userOrgField "${field}" not found in user collection fields`
  //
  // 3. Return the VexAccessConfig:
  //    {
  //      roles: props.roles,
  //      userCollection: props.userCollection.slug,
  //      orgCollection: props.orgCollection?.slug,
  //      userOrgField: props.userOrgField,
  //      permissions: props.permissions (cast to the erased type),
  //    }
  //
  // Edge cases:
  // - Empty roles array → valid, permissions object should be empty `{}`
  // - Empty resources array → valid, no resources to assign permissions to
  // - resources is undefined → valid, all config resources will be available at runtime
  throw new Error("Not implemented");
}
```

### `File: packages/core/src/access/defineAccess.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { defineAccess } from "./defineAccess";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";
import { checkbox } from "../fields/checkbox";
import { relationship } from "../fields/relationship";
import { VexAccessConfigError } from "../errors";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const posts = defineCollection({
  slug: "posts",
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

const users = defineCollection({
  slug: "users",
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
    orgId: relationship({ label: "Organization", to: "organizations" }),
  },
  labels: { plural: "Users", singular: "User" },
});

const categories = defineCollection({
  slug: "categories",
  fields: {
    name: text({ label: "Name", required: true }),
    sortOrder: number({ label: "Sort Order" }),
  },
});

const organizations = defineCollection({
  slug: "organizations",
  fields: {
    name: text({ label: "Name", required: true }),
    plan: select({
      label: "Plan",
      options: [
        { label: "Free", value: "free" },
        { label: "Pro", value: "pro" },
      ],
    }),
  },
});

const allResources = [posts, users, categories] as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("defineAccess", () => {
  it("returns a VexAccessConfig with roles, userCollection, and permissions", () => {
    const access = defineAccess({
      roles: ["admin", "editor"] as const,
      resources: allResources,
      userCollection: users,
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
            update: { mode: "allow", fields: ["title", "status"] },
            delete: false,
          },
        },
      },
    });

    expect(access.roles).toEqual(["admin", "editor"]);
    expect(access.userCollection).toBe("users");
    expect(access.permissions).toBeDefined();
    expect(access.permissions["admin"]).toBeDefined();
    expect(access.permissions["editor"]).toBeDefined();
  });

  it("accepts boolean permission values", () => {
    const access = defineAccess({
      roles: ["admin"] as const,
      resources: allResources,
      userCollection: users,
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

  it("accepts allow mode with fields array", () => {
    const access = defineAccess({
      roles: ["editor"] as const,
      resources: allResources,
      userCollection: users,
      permissions: {
        editor: {
          posts: {
            read: true,
            update: { mode: "allow", fields: ["title", "slug"] },
          },
        },
      },
    });

    const updatePerm = access.permissions["editor"]?.["posts"]?.update;
    expect(updatePerm).toEqual({ mode: "allow", fields: ["title", "slug"] });
  });

  it("accepts deny mode with fields array", () => {
    const access = defineAccess({
      roles: ["editor"] as const,
      resources: allResources,
      userCollection: users,
      permissions: {
        editor: {
          posts: {
            read: true,
            update: { mode: "deny", fields: ["slug"] },
          },
        },
      },
    });

    const updatePerm = access.permissions["editor"]?.["posts"]?.update;
    expect(updatePerm).toEqual({ mode: "deny", fields: ["slug"] });
  });

  it("accepts dynamic function permission checks", () => {
    const access = defineAccess({
      roles: ["editor"] as const,
      resources: allResources,
      userCollection: users,
      permissions: {
        editor: {
          posts: {
            update: ({ data, user }) => {
              // user type should be inferred from the "users" collection
              return { mode: "allow", fields: ["title"] as const };
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

  it("allows partial resource coverage per role", () => {
    const access = defineAccess({
      roles: ["admin", "viewer"] as const,
      resources: allResources,
      userCollection: users,
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
      resources: allResources,
      userCollection: users,
      permissions: {
        editor: {
          posts: {
            read: true,
            update: { mode: "allow", fields: ["title"] },
            // create and delete not mentioned → permissive default
          },
        },
      },
    });

    expect(access.permissions["editor"]?.["posts"]?.create).toBeUndefined();
  });

  it("works without explicit resources (all collections available)", () => {
    const access = defineAccess({
      roles: ["admin"] as const,
      userCollection: users,
      permissions: {
        admin: {},
      },
    });

    expect(access.roles).toEqual(["admin"]);
    expect(access.userCollection).toBe("users");
  });

  describe("organization support", () => {
    it("accepts orgCollection and userOrgField together", () => {
      const access = defineAccess({
        roles: ["admin", "member"] as const,
        resources: [posts, users] as const,
        userCollection: users,
        orgCollection: organizations,
        userOrgField: "orgId",
        permissions: {
          admin: {
            posts: { create: true, read: true, update: true, delete: true },
          },
          member: {
            posts: {
              read: ({ data, user, organization }) => {
                // organization type should be inferred from org collection
                return true;
              },
            },
          },
        },
      });

      expect(access.orgCollection).toBe("organizations");
      expect(access.userOrgField).toBe("orgId");
    });
  });

  describe("dev-mode warnings", () => {
    it("warns when permission resource slug is not in resources", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      defineAccess({
        roles: ["admin"] as const,
        resources: [posts] as const,
        userCollection: users,
        permissions: {
          admin: {
            nonexistent: { read: true },
          },
        } as any,
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("nonexistent"),
      );

      process.env.NODE_ENV = originalEnv;
      warnSpy.mockRestore();
    });

    it("warns when permission role is not in roles array", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      defineAccess({
        roles: ["admin"] as const,
        resources: allResources,
        userCollection: users,
        permissions: {
          admin: {},
          unknown_role: { posts: { read: true } },
        } as any,
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("unknown_role"),
      );

      process.env.NODE_ENV = originalEnv;
      warnSpy.mockRestore();
    });
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
import type { AccessAction, VexAccessConfig, PermissionCheck, FieldPermissionResult } from "./types";
import { VexAccessError } from "../errors";

/**
 * The result of resolving field permissions for a resource action.
 * Maps each field key to whether the action is allowed on that field.
 */
export type ResolvedFieldPermissions = Record<string, boolean>;

/**
 * Resolve a permission check value (boolean, mode object, or function)
 * into a full `Record<fieldKey, boolean>` for a given resource.
 *
 * @param props.check - The permission check value to resolve
 * @param props.fieldKeys - All field keys for this resource
 * @param props.data - The document data (for dynamic checks)
 * @param props.user - The user object (for dynamic checks)
 * @param props.organization - Optional organization object (for dynamic checks)
 * @returns Full field permission map where every field has an explicit boolean
 */
export function resolvePermissionCheck(props: {
  check: PermissionCheck<string, any, any, any> | undefined;
  fieldKeys: string[];
  data: Record<string, any>;
  user: Record<string, any>;
  organization?: Record<string, any>;
}): ResolvedFieldPermissions {
  // TODO: implement
  //
  // 1. If props.check is undefined → return all-true map
  //    (permissive default for missing actions)
  //    → Object.fromEntries(props.fieldKeys.map(k => [k, true]))
  //
  // 2. If props.check is a function → call it with:
  //    - If props.organization is defined: { data: props.data, user: props.user, organization: props.organization }
  //    - Else: { data: props.data, user: props.user }
  //    → result is boolean or { mode, fields } object
  //    → recurse or handle inline (go to step 3 or 4 with the result)
  //
  // 3. If the resolved value is a boolean:
  //    → return Object.fromEntries(props.fieldKeys.map(k => [k, resolvedBoolean]))
  //
  // 4. If the resolved value is a { mode, fields } object:
  //    a. If mode === "allow":
  //       → return Object.fromEntries(props.fieldKeys.map(k => [k, fields.includes(k)]))
  //       → fields present in the array → true, all other fields → false
  //    b. If mode === "deny":
  //       → return Object.fromEntries(props.fieldKeys.map(k => [k, !fields.includes(k)]))
  //       → fields present in the array → false, all other fields → true
  //
  // Edge cases:
  // - Function throws → let it propagate (caller decides error handling)
  // - Function returns undefined → treat as false (deny all)
  // - Empty fieldKeys array → return empty object
  // - Empty fields array in mode object → "allow" with empty = deny all, "deny" with empty = allow all
  throw new Error("Not implemented");
}

/**
 * Merge field permission maps from multiple roles using OR logic.
 * If any role grants access to a field, that field is allowed.
 * Allow always wins over deny in cross-role merges.
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
  //    (no roles = permissive default; in practice this means no known roles
  //     contributed, which is handled by caller returning deny-all for unknown roles)
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
 * Without `field` param → returns `Record<fieldKey, boolean>` (full field map)
 * With `field` param → returns `boolean` for that specific field
 *
 * @param props.access - The VexAccessConfig from defineAccess
 * @param props.user - The user object
 * @param props.userRoles - The user's role(s) as a string array (e.g., `["admin"]` or `["editor", "author"]`)
 * @param props.resource - The resource slug (collection or global slug)
 * @param props.action - The CRUD action to check
 * @param props.fieldKeys - All field keys for this resource (required for resolution)
 * @param props.data - Document data for dynamic permission checks. Defaults to `{}`.
 * @param props.organization - Optional organization object for org-aware permission checks.
 * @param props.field - Optional specific field to check. When provided, returns boolean instead of Record.
 * @param props.throwOnDenied - When true, throws VexAccessError instead of returning false/all-false. Default: false.
 * @returns `Record<string, boolean>` when field is omitted, `boolean` when field is provided
 * @throws {VexAccessError} When `throwOnDenied` is true and any field is denied (field map mode) or the specific field is denied (single field mode)
 */
export function hasPermission(props: {
  access: VexAccessConfig | undefined;
  user: Record<string, any>;
  userRoles: string[];
  resource: string;
  action: AccessAction;
  fieldKeys: string[];
  data?: Record<string, any>;
  organization?: Record<string, any>;
  field?: string;
  throwOnDenied?: boolean;
}): ResolvedFieldPermissions | boolean {
  // TODO: implement
  //
  // 1. If props.access is undefined → permissive default
  //    a. If props.field is provided → return true
  //    b. Else → return all-true map from props.fieldKeys
  //
  // 2. If props.userRoles is empty → deny all
  //    → if props.throwOnDenied → throw new VexAccessError(props.resource, props.action, props.field)
  //    a. If props.field is provided → return false
  //    b. Else → return all-false map from props.fieldKeys
  //
  // 3. Filter props.userRoles to only include roles that exist in props.access.roles
  //    → unknownRoles are skipped silently
  //    → if ALL roles are unknown after filtering → deny all (same as step 2)
  //
  // 4. For each known role in the filtered roles:
  //    a. Look up props.access.permissions[role]
  //    b. If undefined → this role has no permissions object → skip
  //       (contributes nothing; if NO role contributes, we get an empty
  //        permissionMaps array → mergeRolePermissions returns all-true)
  //    c. Look up rolePermissions[props.resource]
  //    d. If undefined → this role has no permissions for this resource
  //       → contribute an all-true map (permissive default for missing resource)
  //    e. Look up resourcePermissions[props.action]
  //    f. Call resolvePermissionCheck({
  //         check,
  //         fieldKeys: props.fieldKeys,
  //         data: props.data ?? {},
  //         user: props.user,
  //         organization: props.organization,
  //       })
  //    g. Collect the resolved map
  //
  // 5. Merge all collected maps with mergeRolePermissions({ permissionMaps, fieldKeys: props.fieldKeys })
  //
  // 6. If props.field is provided:
  //    → result = merged[props.field] ?? false
  //    → if props.throwOnDenied && result === false
  //      → throw new VexAccessError(props.resource, props.action, props.field)
  //    → return result
  //
  // 7. Else:
  //    → if props.throwOnDenied && Object.values(merged).some(v => v === false)
  //      → throw new VexAccessError(props.resource, props.action)
  //    → return the merged map
  //
  // Edge cases:
  // - Role in userRoles not in access.roles → skip (no permissions for unknown roles)
  // - Resource slug not in any role's permissions → all-true for each role that doesn't mention it
  // - Field not in fieldKeys → won't appear in result map; if asked via props.field → false
  // - data is undefined → default to {} for function calls
  // - organization is undefined → passed through as-is to resolvePermissionCheck
  // - throwOnDenied with empty userRoles → throws VexAccessError (deny-all path)
  // - throwOnDenied with all-true result → does not throw, returns normally
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
import { VexAccessError } from "../errors";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const FIELD_KEYS_POSTS = ["title", "slug", "status", "featured"];
const FIELD_KEYS_CATEGORIES = ["name", "sortOrder"];

const mockUser = { _id: "user1", name: "Test User", role: ["editor"] };
const mockOtherUser = { _id: "user2", name: "Other User", role: ["editor"] };
const mockOrg = { _id: "org1", name: "Acme Corp", plan: "pro" };

/** A fully-populated access config for testing. */
const testAccess: VexAccessConfig = {
  roles: ["admin", "editor", "viewer"],
  userCollection: "users",
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
        update: { mode: "allow", fields: ["title", "status"] },
        delete: false,
      },
      categories: {
        read: true,
        update: { mode: "allow", fields: ["name"] },
      },
    },
    viewer: {
      posts: {
        read: true,
      },
    },
  },
};

/** Access config with deny mode. */
const denyModeAccess: VexAccessConfig = {
  roles: ["editor"],
  userCollection: "users",
  permissions: {
    editor: {
      posts: {
        update: { mode: "deny", fields: ["slug"] },
      },
    },
  },
};

/** Access config with dynamic function checks. */
const dynamicAccess: VexAccessConfig = {
  roles: ["editor"],
  userCollection: "users",
  permissions: {
    editor: {
      posts: {
        update: ({ data, user }: { data: any; user: any }) => {
          if (user._id === data.authorId) {
            return { mode: "allow", fields: ["title", "status", "slug", "featured"] };
          }
          return { mode: "allow", fields: ["title"] };
        },
        delete: ({ data, user }: { data: any; user: any }) => {
          return user._id === data.authorId;
        },
      },
    },
  },
};

/** Access config with organization-aware checks. */
const orgAccess: VexAccessConfig = {
  roles: ["member"],
  userCollection: "users",
  orgCollection: "organizations",
  userOrgField: "orgId",
  permissions: {
    member: {
      posts: {
        read: ({ data, user, organization }: { data: any; user: any; organization: any }) => {
          return data.orgId === organization._id;
        },
        update: ({ data, user, organization }: { data: any; user: any; organization: any }) => {
          if (data.orgId !== organization._id) return false;
          return { mode: "allow", fields: ["title", "status"] };
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

  it("returns allowlist when check uses allow mode", () => {
    const result = resolvePermissionCheck({
      check: { mode: "allow", fields: ["title", "status"] },
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

  it("returns denylist when check uses deny mode", () => {
    const result = resolvePermissionCheck({
      check: { mode: "deny", fields: ["slug"] },
      fieldKeys: FIELD_KEYS_POSTS,
      data: {},
      user: mockUser,
    });

    expect(result).toEqual({
      title: true,
      slug: false,
      status: true,
      featured: true,
    });
  });

  it("allow mode with empty fields array denies all", () => {
    const result = resolvePermissionCheck({
      check: { mode: "allow", fields: [] },
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

  it("deny mode with empty fields array allows all", () => {
    const result = resolvePermissionCheck({
      check: { mode: "deny", fields: [] },
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

  it("calls function check with organization when provided", () => {
    const check = ({ data, user, organization }: { data: any; user: any; organization: any }) => {
      return data.orgId === organization._id;
    };

    const resultMatch = resolvePermissionCheck({
      check,
      fieldKeys: FIELD_KEYS_POSTS,
      data: { orgId: "org1" },
      user: mockUser,
      organization: mockOrg,
    });

    expect(resultMatch).toEqual({
      title: true,
      slug: true,
      status: true,
      featured: true,
    });

    const resultNoMatch = resolvePermissionCheck({
      check,
      fieldKeys: FIELD_KEYS_POSTS,
      data: { orgId: "org999" },
      user: mockUser,
      organization: mockOrg,
    });

    expect(resultNoMatch).toEqual({
      title: false,
      slug: false,
      status: false,
      featured: false,
    });
  });

  it("handles function returning allow mode object", () => {
    const check = () => ({ mode: "allow" as const, fields: ["title", "slug"] });

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

  it("handles function returning deny mode object", () => {
    const check = () => ({ mode: "deny" as const, fields: ["featured"] });

    const result = resolvePermissionCheck({
      check,
      fieldKeys: FIELD_KEYS_POSTS,
      data: {},
      user: mockUser,
    });

    expect(result).toEqual({
      title: true,
      slug: true,
      status: true,
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

  it("allow wins over deny across roles", () => {
    // Role A allows title, Role B denies title → title is allowed (OR logic)
    const result = mergeRolePermissions({
      permissionMaps: [
        { title: true, slug: false, status: false, featured: false },
        { title: false, slug: true, status: false, featured: false },
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

    it("viewer gets all-true for delete on posts (no delete defined → permissive)", () => {
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

  describe("allow mode permissions", () => {
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

  describe("deny mode permissions", () => {
    it("editor gets all fields except denied ones for update", () => {
      const result = hasPermission({
        access: denyModeAccess,
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
        featured: true,
      });
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

  describe("organization-aware permissions", () => {
    it("resolves function check with matching org", () => {
      const result = hasPermission({
        access: orgAccess,
        user: mockUser,
        userRoles: ["member"],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
        data: { orgId: "org1" },
        organization: mockOrg,
      });

      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("resolves function check with non-matching org", () => {
      const result = hasPermission({
        access: orgAccess,
        user: mockUser,
        userRoles: ["member"],
        resource: "posts",
        action: "read",
        fieldKeys: FIELD_KEYS_POSTS,
        data: { orgId: "org999" },
        organization: mockOrg,
      });

      expect(result).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });

    it("resolves function returning mode object with org check", () => {
      const result = hasPermission({
        access: orgAccess,
        user: mockUser,
        userRoles: ["member"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
        data: { orgId: "org1" },
        organization: mockOrg,
      });

      expect(result).toEqual({
        title: true,
        slug: false,
        status: true,
        featured: false,
      });
    });

    it("resolves function returning false when org doesn't match", () => {
      const result = hasPermission({
        access: orgAccess,
        user: mockUser,
        userRoles: ["member"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
        data: { orgId: "org999" },
        organization: mockOrg,
      });

      expect(result).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });
  });

  describe("multi-role merge (OR logic)", () => {
    it("merges permissions from multiple roles", () => {
      // editor: posts.update = { mode: "allow", fields: ["title", "status"] }
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
      const restrictiveAccess: VexAccessConfig = {
        roles: ["role_a", "role_b"],
        userCollection: "users",
        permissions: {
          role_a: {
            posts: {
              update: { mode: "allow", fields: ["title", "slug"] },
            },
          },
          role_b: {
            posts: {
              update: { mode: "allow", fields: ["status", "featured"] },
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

    it("allow wins over deny across roles", () => {
      const mixedAccess: VexAccessConfig = {
        roles: ["role_allow", "role_deny"],
        userCollection: "users",
        permissions: {
          role_allow: {
            posts: {
              update: { mode: "allow", fields: ["title"] },
            },
          },
          role_deny: {
            posts: {
              update: { mode: "deny", fields: ["title"] },
            },
          },
        },
      };

      const result = hasPermission({
        access: mixedAccess,
        user: mockUser,
        userRoles: ["role_allow", "role_deny"],
        resource: "posts",
        action: "update",
        fieldKeys: FIELD_KEYS_POSTS,
      });

      // role_allow: title=true, slug=false, status=false, featured=false
      // role_deny:  title=false, slug=true, status=true, featured=true
      // OR merge:   title=true, slug=true, status=true, featured=true
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

      // unknown role is not in access.roles → filtered out → no known roles → deny all
      expect(result).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
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

  describe("throwOnDenied", () => {
    it("throws VexAccessError when field is denied and throwOnDenied is true", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["editor"],
          resource: "posts",
          action: "update",
          fieldKeys: FIELD_KEYS_POSTS,
          field: "slug",
          throwOnDenied: true,
        }),
      ).toThrow(VexAccessError);
    });

    it("throws VexAccessError with resource and action context", () => {
      try {
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["editor"],
          resource: "posts",
          action: "update",
          fieldKeys: FIELD_KEYS_POSTS,
          field: "slug",
          throwOnDenied: true,
        });
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(VexAccessError);
        expect((e as VexAccessError).resource).toBe("posts");
        expect((e as VexAccessError).action).toBe("update");
        expect((e as VexAccessError).field).toBe("slug");
      }
    });

    it("throws VexAccessError when any field is denied in field map mode", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["editor"],
          resource: "posts",
          action: "update",
          fieldKeys: FIELD_KEYS_POSTS,
          throwOnDenied: true,
        }),
      ).toThrow(VexAccessError);
    });

    it("does not throw when all fields are allowed", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["admin"],
          resource: "posts",
          action: "update",
          fieldKeys: FIELD_KEYS_POSTS,
          throwOnDenied: true,
        }),
      ).not.toThrow();
    });

    it("does not throw when specific field is allowed", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["editor"],
          resource: "posts",
          action: "update",
          fieldKeys: FIELD_KEYS_POSTS,
          field: "title",
          throwOnDenied: true,
        }),
      ).not.toThrow();
    });

    it("throws when userRoles is empty and throwOnDenied is true", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: [],
          resource: "posts",
          action: "read",
          fieldKeys: FIELD_KEYS_POSTS,
          throwOnDenied: true,
        }),
      ).toThrow(VexAccessError);
    });

    it("does not throw when throwOnDenied is false (default)", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["editor"],
          resource: "posts",
          action: "update",
          fieldKeys: FIELD_KEYS_POSTS,
          field: "slug",
          throwOnDenied: false,
        }),
      ).not.toThrow();
    });
  });
});
```

---

## Step 4: Config Integration + Exports

- [ ] Modify `packages/core/src/types/index.ts` — add `access` to `VexConfig` and `VexConfigInput`
- [ ] Modify `packages/core/src/config/defineConfig.ts` — pass through access field
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

**Add to `VexConfig` interface (after `media?: MediaConfig;`):**
```typescript
  /** RBAC access permissions config. Optional — if not set, all actions are allowed. */
  access?: VexAccessConfig;
```

**Add to `VexConfigInput` interface (after `media?: MediaConfigInput;`):**
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

**Add to the `config` object construction (after the `schema` spread):**
```typescript
    access: vexConfig.access,
```

### `File: packages/core/src/index.ts` (modify)

Add exports for the new access module.

**Add function exports (alongside the other function exports like `defineConfig`):**
```typescript
export { defineAccess } from "./access/defineAccess";
export { hasPermission } from "./access/hasPermission";
```

**Add type exports (in the type export section):**
```typescript
export type {
  VexAccessConfig,
  VexAccessInput,
  AccessAction,
  FieldPermissionResult,
  PermissionCheck,
  PermissionCallbackProps,
  RolesWithPermissions,
  ResourcePermissions,
  ExtractSlug,
  ExtractFieldKeys,
  ExtractDocType,
  LookupBySlug,
  ExtractSlugs,
} from "./access/types";

export type { ResolvedFieldPermissions } from "./access/hasPermission";
```

---

## Success Criteria

- [ ] `pnpm --filter @vexcms/core build` succeeds
- [ ] `pnpm --filter @vexcms/core test` passes all existing tests + new access tests
- [ ] `defineAccess` provides full LSP autocomplete for:
  - Role names (from `roles` array)
  - Resource slugs (from `resources` array when provided)
  - Field keys per resource in permission return types (allow/deny fields arrays)
  - User type in `({ data, user })` callbacks (inferred from `userCollection`)
  - Organization type in `({ data, user, organization })` callbacks (inferred from `orgCollection`)
- [ ] `hasPermission` correctly resolves:
  - Boolean permissions → all-true or all-false field map
  - Allow mode permissions → allowlist with unlisted = false
  - Deny mode permissions → denylist with unlisted = true
  - Function permissions → called with data/user/organization context
  - Multi-role OR merge (allow always wins)
  - Permissive defaults for undefined access/resources/actions
  - `field` param overload returning single boolean
- [ ] Organization support works:
  - `orgCollection` + `userOrgField` are both required when either is provided
  - Organization object flows through to permission callbacks
  - Callbacks receive typed `organization` param when org is configured
- [ ] `VexConfig.access` is optional and backward-compatible (existing configs without `access` still work)
- [ ] Test-app still compiles without changes
