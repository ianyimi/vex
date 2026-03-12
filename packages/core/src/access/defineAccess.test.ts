import { describe, it, expect, vi } from "vitest";
import { defineAccess } from "./defineAccess";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";
import { checkbox } from "../fields/checkbox";
import { relationship } from "../fields/relationship";

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

    const adminPosts = access.permissions["admin"]?.["posts"] as Record<string, unknown> | undefined;
    expect(adminPosts?.["create"]).toBe(true);
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

    const updatePerm = (access.permissions["editor"]?.["posts"] as Record<string, unknown> | undefined)?.["update"];
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

    const updatePerm = (access.permissions["editor"]?.["posts"] as Record<string, unknown> | undefined)?.["update"];
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
            update: (_ctx) => {
              return { mode: "allow" as const, fields: ["title"] as const };
            },
            delete: (_ctx) => {
              return false;
            },
          },
        },
      },
    });

    const updatePerm = (access.permissions["editor"]?.["posts"] as Record<string, unknown> | undefined)?.["update"];
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
        },
      },
    });

    expect((access.permissions["viewer"]?.["posts"] as Record<string, unknown> | undefined)?.["read"]).toBe(true);
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
          },
        },
      },
    });

    expect((access.permissions["editor"]?.["posts"] as Record<string, unknown> | undefined)?.["create"]).toBeUndefined();
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
              read: (_ctx) => {
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
