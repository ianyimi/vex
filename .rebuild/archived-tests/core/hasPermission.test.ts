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

const FIELDS_POSTS = ["title", "slug", "status", "featured"];
const FIELDS_CATEGORIES = ["name", "sortOrder"];

const mockUser = { _id: "user1", name: "Test User", role: ["editor"] };
const mockOrg = { _id: "org1", name: "Acme Corp", plan: "pro" };

/** A fully-populated access config for testing. */
const testAccess: VexAccessConfig = {
  roles: ["admin", "editor", "viewer"],
  adminRoles: ["admin", "editor", "viewer"],
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
  adminRoles: ["editor"],
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
  adminRoles: ["editor"],
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
  adminRoles: ["member"],
  userCollection: "users",
  orgCollection: "organizations",
  userOrgField: "orgId",
  permissions: {
    member: {
      posts: {
        read: ({ data, organization }: { data: any; user: any; organization: any }) => {
          return data.orgId === organization._id;
        },
        update: ({ data, organization }: { data: any; user: any; organization: any }) => {
          if (data.orgId !== organization._id) return false;
          return { mode: "allow", fields: ["title", "status"] };
        },
      },
    },
  },
};

/** Access config with boolean resource-level permissions. */
const booleanResourceAccess: VexAccessConfig = {
  roles: ["admin", "blocked"],
  adminRoles: ["admin"],
  userCollection: "users",
  permissions: {
    admin: {
      posts: true,
      categories: true,
    },
    blocked: {
      posts: false,
      categories: false,
    },
  },
};

// ---------------------------------------------------------------------------
// resolvePermissionCheck
// ---------------------------------------------------------------------------

describe("resolvePermissionCheck", () => {
  describe("without fields (boolean mode)", () => {
    it("returns true when check is undefined (permissive default)", () => {
      const result = resolvePermissionCheck({
        check: undefined,
        data: {},
        user: mockUser,
      });
      expect(result).toBe(true);
    });

    it("returns true when check is boolean true", () => {
      const result = resolvePermissionCheck({
        check: true,
        data: {},
        user: mockUser,
      });
      expect(result).toBe(true);
    });

    it("returns false when check is boolean false", () => {
      const result = resolvePermissionCheck({
        check: false,
        data: {},
        user: mockUser,
      });
      expect(result).toBe(false);
    });

    it("returns true for allow mode with fields (some fields allowed)", () => {
      const result = resolvePermissionCheck({
        check: { mode: "allow", fields: ["title", "status"] },
        data: {},
        user: mockUser,
      });
      expect(result).toBe(true);
    });

    it("returns false for allow mode with empty fields", () => {
      const result = resolvePermissionCheck({
        check: { mode: "allow", fields: [] },
        data: {},
        user: mockUser,
      });
      expect(result).toBe(false);
    });

    it("returns true for deny mode with empty fields (nothing denied)", () => {
      const result = resolvePermissionCheck({
        check: { mode: "deny", fields: [] },
        data: {},
        user: mockUser,
      });
      expect(result).toBe(true);
    });

    it("returns false for deny mode with fields (some fields denied)", () => {
      const result = resolvePermissionCheck({
        check: { mode: "deny", fields: ["slug"] },
        data: {},
        user: mockUser,
      });
      expect(result).toBe(false);
    });

    it("calls function check and returns boolean result", () => {
      const check = ({ data, user }: { data: any; user: any }) => {
        return user._id === data.authorId;
      };

      expect(resolvePermissionCheck({
        check,
        data: { authorId: "user1" },
        user: mockUser,
      })).toBe(true);

      expect(resolvePermissionCheck({
        check,
        data: { authorId: "other" },
        user: mockUser,
      })).toBe(false);
    });
  });

  describe("with fields (field map mode)", () => {
    it("returns all-true when check is undefined (permissive default)", () => {
      const result = resolvePermissionCheck({
        check: undefined,
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
      const check = ({ data, organization }: { data: any; user: any; organization: any }) => {
        return data.orgId === organization._id;
      };

      const resultMatch = resolvePermissionCheck({
        check,
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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

    it("returns empty object for empty fields", () => {
      const result = resolvePermissionCheck({
        check: true,
        fields: [],
        data: {},
        user: mockUser,
      });
      expect(result).toEqual({});
    });

    it("checks only requested fields (subset of all fields)", () => {
      const result = resolvePermissionCheck({
        check: { mode: "allow", fields: ["title", "status"] },
        fields: ["title", "featured"],
        data: {},
        user: mockUser,
      });
      expect(result).toEqual({
        title: true,
        featured: false,
      });
    });
  });
});

// ---------------------------------------------------------------------------
// mergeRolePermissions
// ---------------------------------------------------------------------------

describe("mergeRolePermissions", () => {
  describe("without fields (boolean mode)", () => {
    it("returns true for empty results", () => {
      const result = mergeRolePermissions({ results: [] });
      expect(result).toBe(true);
    });

    it("uses OR logic across boolean results", () => {
      expect(mergeRolePermissions({ results: [true, false] })).toBe(true);
      expect(mergeRolePermissions({ results: [false, false] })).toBe(false);
      expect(mergeRolePermissions({ results: [true, true] })).toBe(true);
    });
  });

  describe("with fields (field map mode)", () => {
    it("uses OR logic across role permission maps", () => {
      const result = mergeRolePermissions({
        results: [
          { title: true, slug: false, status: false, featured: false },
          { title: false, slug: false, status: true, featured: false },
        ],
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: false,
        status: true,
        featured: false,
      });
    });

    it("returns all-true for empty results", () => {
      const result = mergeRolePermissions({
        results: [],
        fields: FIELDS_POSTS,
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
        results: [
          { title: true, slug: false, status: true, featured: false },
        ],
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: false,
        status: true,
        featured: false,
      });
    });

    it("mixes boolean and field map results with OR logic", () => {
      const result = mergeRolePermissions({
        results: [
          true,
          { title: false, slug: false, status: false, featured: false },
        ],
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("boolean false does not override field map allow", () => {
      const result = mergeRolePermissions({
        results: [
          false,
          { title: true, slug: false, status: false, featured: false },
        ],
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: false,
        status: false,
        featured: false,
      });
    });

    it("allow wins over deny across roles", () => {
      const result = mergeRolePermissions({
        results: [
          { title: true, slug: false, status: false, featured: false },
          { title: false, slug: true, status: false, featured: false },
        ],
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: true,
        status: false,
        featured: false,
      });
    });
  });
});

// ---------------------------------------------------------------------------
// hasPermission
// ---------------------------------------------------------------------------

describe("hasPermission", () => {
  describe("permissive defaults", () => {
    it("returns true when access is undefined (no fields)", () => {
      const result = hasPermission({
        access: undefined,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "read",
      });
      expect(result).toBe(true);
    });

    it("returns all-true map when access is undefined (with fields)", () => {
      const result = hasPermission({
        access: undefined,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "read",
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("returns all-true when resource has no permissions entry for any role", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["viewer"],
        resource: "categories",
        action: "read",
        fields: FIELDS_CATEGORIES,
      });
      expect(result).toEqual({
        name: true,
        sortOrder: true,
      });
    });
  });

  describe("deny all", () => {
    it("returns false when userRoles is empty (no fields)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: [],
        resource: "posts",
        action: "read",
      });
      expect(result).toBe(false);
    });

    it("returns all-false when userRoles is empty (with fields)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: [],
        resource: "posts",
        action: "read",
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });
  });

  describe("boolean permissions", () => {
    it("admin gets true for all actions on posts (no fields)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["admin"],
        resource: "posts",
        action: "update",
      });
      expect(result).toBe(true);
    });

    it("admin gets all-true map for all actions on posts (with fields)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["admin"],
        resource: "posts",
        action: "update",
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("editor gets false for delete on posts (delete: false)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
      });
      expect(result).toBe(false);
    });

    it("editor gets all-false map for delete on posts (with fields)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });

    it("viewer gets true for undefined action (permissive default, no fields)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["viewer"],
        resource: "posts",
        action: "delete",
      });
      expect(result).toBe(true);
    });
  });

  describe("boolean resource-level permissions", () => {
    it("admin with resource: true gets true for any action", () => {
      const result = hasPermission({
        access: booleanResourceAccess,
        user: mockUser,
        userRoles: ["admin"],
        resource: "posts",
        action: "delete",
      });
      expect(result).toBe(true);
    });

    it("blocked with resource: false gets false for any action", () => {
      const result = hasPermission({
        access: booleanResourceAccess,
        user: mockUser,
        userRoles: ["blocked"],
        resource: "posts",
        action: "read",
      });
      expect(result).toBe(false);
    });

    it("resource: true with fields returns all-true map", () => {
      const result = hasPermission({
        access: booleanResourceAccess,
        user: mockUser,
        userRoles: ["admin"],
        resource: "posts",
        action: "update",
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("resource: false with fields returns all-false map", () => {
      const result = hasPermission({
        access: booleanResourceAccess,
        user: mockUser,
        userRoles: ["blocked"],
        resource: "posts",
        action: "update",
        fields: FIELDS_POSTS,
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
    it("editor gets field map for update on posts", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: false,
        status: true,
        featured: false,
      });
    });

    it("checks only requested fields (subset)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fields: ["title", "slug"],
      });
      expect(result).toEqual({
        title: true,
        slug: false,
      });
    });

    it("editor without fields returns true for update (allow mode has fields)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
      });
      // allow mode with fields ["title", "status"] → some fields allowed → true
      expect(result).toBe(true);
    });
  });

  describe("deny mode permissions", () => {
    it("editor gets all fields except denied ones for update (with fields)", () => {
      const result = hasPermission({
        access: denyModeAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: false,
        status: true,
        featured: true,
      });
    });

    it("deny mode without fields returns false (some fields denied)", () => {
      const result = hasPermission({
        access: denyModeAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "update",
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
        data: { authorId: "other" },
      });
      expect(result).toEqual({
        title: true,
        slug: false,
        status: false,
        featured: false,
      });
    });

    it("resolves function returning boolean for delete (with fields)", () => {
      const resultOwner = hasPermission({
        access: dynamicAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
        data: { authorId: "other" },
      });
      expect(resultNonOwner).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });

    it("resolves function returning boolean for delete (no fields)", () => {
      expect(hasPermission({
        access: dynamicAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        data: { authorId: "user1" },
      })).toBe(true);

      expect(hasPermission({
        access: dynamicAccess,
        user: mockUser,
        userRoles: ["editor"],
        resource: "posts",
        action: "delete",
        data: { authorId: "other" },
      })).toBe(false);
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
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

    it("resolves org check without fields (boolean mode)", () => {
      expect(hasPermission({
        access: orgAccess,
        user: mockUser,
        userRoles: ["member"],
        resource: "posts",
        action: "read",
        data: { orgId: "org1" },
        organization: mockOrg,
      })).toBe(true);

      expect(hasPermission({
        access: orgAccess,
        user: mockUser,
        userRoles: ["member"],
        resource: "posts",
        action: "read",
        data: { orgId: "org999" },
        organization: mockOrg,
      })).toBe(false);
    });
  });

  describe("multi-role merge (OR logic)", () => {
    it("merges permissions from multiple roles (with fields)", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["editor", "viewer"],
        resource: "posts",
        action: "update",
        fields: FIELDS_POSTS,
      });
      // viewer has no update defined → permissive default (true)
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
        adminRoles: ["role_a", "role_b"],
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
        fields: FIELDS_POSTS,
      });
      expect(result).toEqual({
        title: true,
        slug: true,
        status: true,
        featured: true,
      });
    });

    it("allow wins over deny across roles (with fields)", () => {
      const mixedAccess: VexAccessConfig = {
        roles: ["role_allow", "role_deny"],
        adminRoles: ["role_allow", "role_deny"],
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
        fields: FIELDS_POSTS,
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
        fields: FIELDS_POSTS,
      });
      // unknown role → filtered out → no known roles → deny all
      expect(result).toEqual({
        title: false,
        slug: false,
        status: false,
        featured: false,
      });
    });

    it("unknown roles without fields returns false", () => {
      const result = hasPermission({
        access: testAccess,
        user: mockUser,
        userRoles: ["unknown_role"],
        resource: "posts",
        action: "read",
      });
      expect(result).toBe(false);
    });
  });

  describe("throwOnDenied", () => {
    it("throws VexAccessError when action denied and throwOnDenied is true (no fields)", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["editor"],
          resource: "posts",
          action: "delete",
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
          action: "delete",
          throwOnDenied: true,
        });
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(VexAccessError);
        expect((e as VexAccessError).resource).toBe("posts");
        expect((e as VexAccessError).action).toBe("delete");
      }
    });

    it("throws VexAccessError when a specific field is denied (with fields)", () => {
      try {
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["editor"],
          resource: "posts",
          action: "update",
          fields: FIELDS_POSTS,
          throwOnDenied: true,
        });
        expect.fail("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(VexAccessError);
        expect((e as VexAccessError).resource).toBe("posts");
        expect((e as VexAccessError).action).toBe("update");
        // Should identify the first denied field
        expect((e as VexAccessError).field).toBe("slug");
      }
    });

    it("does not throw when all allowed (no fields)", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["admin"],
          resource: "posts",
          action: "update",
          throwOnDenied: true,
        }),
      ).not.toThrow();
    });

    it("does not throw when all fields allowed", () => {
      expect(() =>
        hasPermission({
          access: testAccess,
          user: mockUser,
          userRoles: ["admin"],
          resource: "posts",
          action: "update",
          fields: FIELDS_POSTS,
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
          action: "delete",
          throwOnDenied: false,
        }),
      ).not.toThrow();
    });
  });
});
