import type {
  VexAccessConfig,
  VexAccessInputBase,
  VexAccessInputWithOrg,
} from "./types";
import type { VexCollection } from "../types";
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
 * @returns A `VexAccessConfig` for passing to `defineConfig({ access: ... })`.
 */

// Overload: with organization (must come first — more specific)
export function defineAccess<
  const TRoles extends readonly string[],
  const TResources extends readonly any[],
  const TUserCollection extends VexCollection<any, any, any>,
  TUser = undefined,
  const TOrgCollection extends VexCollection<any, any, any> = never,
  TOrg = undefined,
>(
  props: VexAccessInputWithOrg<TRoles, TResources, TUserCollection, TUser, TOrgCollection, TOrg>,
): VexAccessConfig;

// Overload: without organization
export function defineAccess<
  const TRoles extends readonly string[],
  const TResources extends readonly any[],
  const TUserCollection extends VexCollection<any, any, any>,
  TUser = undefined,
>(
  props: VexAccessInputBase<TRoles, TResources, TUserCollection, TUser> & {
    orgCollection?: never;
    orgType?: never;
    userOrgField?: never;
  },
): VexAccessConfig;

// Implementation
export function defineAccess(props: {
  roles: readonly string[];
  adminRoles?: readonly string[];
  resources?: readonly any[];
  userCollection: { slug: string; fields?: Record<string, any> };
  userType?: unknown;
  orgCollection?: { slug: string };
  orgType?: unknown;
  userOrgField?: string;
  permissions: Record<string, any>;
}): VexAccessConfig {
  // Validate org config coupling
  if (props.orgCollection && !props.userOrgField) {
    throw new VexAccessConfigError("orgCollection requires userOrgField");
  }
  if (props.userOrgField && !props.orgCollection) {
    throw new VexAccessConfigError("userOrgField requires orgCollection");
  }

  // Default adminRoles to all roles if not specified
  const adminRoles = props.adminRoles ?? props.roles;

  if (process.env.NODE_ENV !== "production") {
    // Validate userCollection has a slug
    if (!props.userCollection?.slug) {
      console.warn("[vex] defineAccess: userCollection must have a slug");
    }

    // Validate orgCollection has a slug if provided
    if (props.orgCollection && !props.orgCollection.slug) {
      console.warn("[vex] defineAccess: orgCollection must have a slug");
    }

    // Validate that permission resource slugs match resources (if resources provided)
    if (props.resources) {
      const resourceSlugs = new Set(
        props.resources.map((r: any) => r.slug),
      );
      for (const role of Object.keys(props.permissions)) {
        const rolePerms = props.permissions[role];
        if (!rolePerms) continue;
        for (const slug of Object.keys(rolePerms)) {
          if (!resourceSlugs.has(slug)) {
            console.warn(
              `[vex] defineAccess: permission resource "${slug}" not found in resources`,
            );
          }
        }
      }
    }

    // Validate that permission role keys match roles array
    const rolesSet = new Set(props.roles);
    for (const role of Object.keys(props.permissions)) {
      if (!rolesSet.has(role)) {
        console.warn(
          `[vex] defineAccess: permission role "${role}" not in roles array`,
        );
      }
    }

    // Validate adminRoles are a subset of roles
    if (props.adminRoles) {
      const rolesSetForAdmin = new Set(props.roles);
      for (const adminRole of props.adminRoles) {
        if (!rolesSetForAdmin.has(adminRole)) {
          console.warn(
            `[vex] defineAccess: adminRole "${adminRole}" not found in roles array`,
          );
        }
      }
    }

    // Validate userOrgField exists in user collection fields
    if (props.userOrgField && props.userCollection?.fields) {
      if (!(props.userOrgField in props.userCollection.fields)) {
        console.warn(
          `[vex] defineAccess: userOrgField "${props.userOrgField}" not found in user collection fields`,
        );
      }
    }
  }

  return {
    roles: props.roles,
    adminRoles,
    userCollection: props.userCollection.slug,
    orgCollection: props.orgCollection?.slug,
    userOrgField: props.userOrgField,
    permissions: props.permissions,
  };
}
