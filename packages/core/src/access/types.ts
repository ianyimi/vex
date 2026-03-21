import type { VexCollection, InferFieldsType } from "../types";
import type { VexGlobal } from "../types/globals";
import type { VexMediaCollection, DefaultMediaFieldKeys } from "../types/media";

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
  ? T extends { _isMedia: true }
    ? (keyof TFields & string) | (TExtraKeys & string) | DefaultMediaFieldKeys
    : (keyof TFields & string) | (TExtraKeys & string)
  : T extends VexMediaCollection<infer TFields>
    ? (keyof TFields & string) | DefaultMediaFieldKeys
    : T extends VexGlobal<infer TFields>
      ? keyof TFields & string
      : never;

/**
 * Extract the inferred document type from a VexCollection or VexGlobal.
 * Includes `_id` (system field) and auth extra keys (typed as `string`).
 */
export type ExtractDocType<T> = T extends VexCollection<infer TFields, infer TExtraKeys>
  ? { _id: string } & InferFieldsType<TFields> & { [K in TExtraKeys & string]: string }
  : T extends VexMediaCollection<infer TFields>
    ? { _id: string } & InferFieldsType<TFields> & { [K in DefaultMediaFieldKeys]: string | number }
    : T extends VexGlobal<infer TFields>
      ? { _id: string } & InferFieldsType<TFields>
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
 * Build a permission entry for a single resource element.
 * Produces `{ [slug]?: boolean | ResourcePermissions<...> }`.
 */
type SingleResourceEntry<R, TUser, TOrg> =
  R extends { readonly slug: infer S extends string }
    ? { [K in S]?: boolean | ResourcePermissions<ExtractFieldKeys<R>, ExtractDocType<R>, TUser, TOrg> }
    : {};

/**
 * Recursively intersect per-resource permission entries from a tuple.
 * Builds `{ articles?: ... } & { posts?: ... } & { users?: ... }` etc.
 * TS eagerly resolves intersection members for LSP autocomplete.
 */
type ResourcePermissionMap<
  TResources extends readonly any[],
  TUser,
  TOrg,
> = TResources extends readonly [infer Head, ...infer Tail]
  ? SingleResourceEntry<Head, TUser, TOrg> & ResourcePermissionMap<Tail, TUser, TOrg>
  : {};

export type RolesWithPermissions<
  TRoles extends string,
  TResources extends readonly any[],
  TUser = Record<string, any>,
  TOrg = never,
> = {
  [Role in TRoles]: ResourcePermissionMap<TResources, TUser, TOrg>;
};

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
  TUserCollection extends VexCollection<any, any, any>,
  TUser,
> {
  /** Array of role name strings. Use `as const` for literal type inference. */
  roles: TRoles;

  /**
   * Roles that can access the admin panel and impersonate other users.
   * Must be a subset of `roles`. Defaults to all roles if not specified.
   */
  adminRoles?: readonly (TRoles[number] & string)[];

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
  TUserCollection extends VexCollection<any, any, any>,
  TUser,
  TOrgCollection extends VexCollection<any, any, any>,
  TOrg,
> {
  roles: TRoles;
  /**
   * Roles that can access the admin panel and impersonate other users.
   * Must be a subset of `roles`. Defaults to all roles if not specified.
   */
  adminRoles?: readonly (TRoles[number] & string)[];
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
  TUserCollection extends VexCollection<any, any, any>,
  TUser = undefined,
  TOrgCollection extends VexCollection<any, any, any> = never,
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

  /** Roles that can access the admin panel and impersonate. */
  adminRoles: readonly string[];

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
        | boolean
        | Partial<Record<AccessAction, PermissionCheck<string, any, any, any>>>
      >
    | undefined
  >;
}
