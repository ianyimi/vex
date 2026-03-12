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
    const check = ({ data, organization }: { data: any; user: any; organization: any }) => {
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
