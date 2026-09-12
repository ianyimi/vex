import { describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "../index";
import {
  isFieldAllowed,
  isFieldPermissionMap,
  resolveFieldPermissions,
  stripDeniedFields,
} from "./resolveFieldPermissions";
import type { VexAccessConfig } from "./types";

// Like `hasPermission.test.ts`, these run against the unaugmented registry, so
// the hand-assembled configs below are cast rather than built through
// `defineAccess` — which is also what makes them a faithful stand-in for the
// untyped consumers the dev-mode warnings exist for.

const postsCollection = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }), price: text() },
});

function buildAccess(permissions: VexAccessConfig["permissions"]): VexAccessConfig {
  return {
    roles: Object.keys(permissions),
    userCollectionSlug: "users",
    userRolesField: "roles",
    enabled: true,
    defaultPermissionMode: "deny",
    resources: [],
    permissions,
  } as VexAccessConfig;
}

/** `buildAccess` plus a real resource, so the undeclared-field warning can fire. */
function buildAccessWithPosts(permissions: VexAccessConfig["permissions"]): VexAccessConfig {
  return { ...buildAccess(permissions), resources: [postsCollection] } as VexAccessConfig;
}

/**
 * The slice of the constraint builder these tests use. The hand-assembled
 * configs above bypass `defineAccess`, so `q` arrives untyped.
 */
type AccessQueryBuilderLike = {
  filter: (build: (f: { eq: (field: string, value: unknown) => unknown }) => unknown) => unknown;
};

const CALL = { resource: "posts", action: "update" } as const;

describe("isFieldPermissionMap", () => {
  it("reads a returned object as a field map", () => {
    expect(isFieldPermissionMap({ "*": false, title: true })).toBe(true);
  });

  it("reads an exhaustive map with a field named constraints as a field map", () => {
    // A map is only ever a RETURN value, so there is no descriptor to confuse
    // this with — which is what lets a document own these field names.
    expect(isFieldPermissionMap({ constraints: true, title: false })).toBe(true);
  });

  it("rejects booleans, null, and undefined", () => {
    expect(isFieldPermissionMap(true)).toBe(false);
    expect(isFieldPermissionMap(null)).toBe(false);
    expect(isFieldPermissionMap(undefined)).toBe(false);
  });
});

describe("resolveFieldPermissions", () => {
  it("is unrestricted when access is undefined (RBAC off)", () => {
    expect(resolveFieldPermissions({ access: undefined, user: null, ...CALL })).toEqual({
      wildcard: true,
      fields: {},
    });
  });

  it("is unrestricted when access is disabled", () => {
    const access = { ...buildAccess({ editor: { posts: { update: false } } }), enabled: false };
    expect(
      resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL }),
    ).toEqual({ wildcard: true, fields: {} });
  });

  it("is unrestricted when the action is a plain true", () => {
    const access = buildAccess({ editor: { posts: { update: true } } });
    expect(
      resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL }),
    ).toEqual({ wildcard: true, fields: {} });
  });

  it("is unrestricted when the callback returns a plain true", () => {
    const access = buildAccess({ editor: { posts: { update: () => true } } });
    expect(
      resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL }),
    ).toEqual({ wildcard: true, fields: {} });
  });

  it("denies every field when the callback returns false", () => {
    const access = buildAccess({ editor: { posts: { update: () => false } } });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "title")).toBe(false);
  });

  it("resolves an allow-list map", () => {
    const access = buildAccess({
      editor: { posts: { update: () => ({ "*": false, title: true }) } },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: {},
      ...CALL,
    });
    expect(resolved.wildcard).toBe(false);
    expect(isFieldAllowed(resolved, "title")).toBe(true);
    expect(isFieldAllowed(resolved, "price")).toBe(false);
  });

  it("resolves a deny-list map", () => {
    const access = buildAccess({
      editor: { posts: { update: () => ({ "*": true, price: false }) } },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "price")).toBe(false);
    expect(isFieldAllowed(resolved, "title")).toBe(true);
  });

  it("resolves a per-field boolean EXPRESSION over the document", () => {
    const access = buildAccess({
      editor: {
        posts: {
          update: ({ data }: { data?: { status?: string } }) => ({
            "*": false,
            price: data?.status === "draft",
          }),
        },
      },
    });
    const draft = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: { status: "draft" },
      ...CALL,
    });
    const published = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: { status: "published" },
      ...CALL,
    });
    expect(isFieldAllowed(draft, "price")).toBe(true);
    expect(isFieldAllowed(published, "price")).toBe(false);
  });

  it("resolves a map returned from `filter` beside `constraints`", () => {
    const access = buildAccess({
      editor: {
        posts: {
          update: {
            constraints: ({ q }: { q: AccessQueryBuilderLike }) =>
              q.filter((f) => f.eq("status", "draft")),
            filter: () => ({ "*": false, title: true }),
          },
        },
      },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: { status: "draft" },
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "title")).toBe(true);
    expect(isFieldAllowed(resolved, "price")).toBe(false);
  });

  it("denies every field when the constraint excludes the document", () => {
    const access = buildAccess({
      editor: {
        posts: {
          update: {
            constraints: ({ q }: { q: AccessQueryBuilderLike }) =>
              q.filter((f) => f.eq("status", "draft")),
            filter: () => ({ "*": true }),
          },
        },
      },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: { status: "published" },
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "title")).toBe(false);
  });

  it("OR-merges across roles", () => {
    const access = buildAccess({
      viewer: { posts: { update: () => ({ "*": false }) } },
      finance: { posts: { update: () => ({ "*": false, price: true }) } },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["viewer", "finance"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "price")).toBe(true);
    expect(isFieldAllowed(resolved, "title")).toBe(false);
  });

  it("lets a role's own wildcard beat another role's explicit deny", () => {
    const access = buildAccess({
      viewer: { posts: { update: () => ({ "*": false, price: false }) } },
      finance: { posts: { update: () => ({ "*": true }) } },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["viewer", "finance"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "price")).toBe(true);
  });

  it("falls back to anonRole when the caller has no roles", () => {
    const access = {
      ...buildAccess({ anon: { posts: { update: () => ({ "*": false, title: true }) } } }),
      anonRole: "anon",
    };
    const resolved = resolveFieldPermissions({ access, user: null, data: {}, ...CALL });
    expect(isFieldAllowed(resolved, "title")).toBe(true);
    expect(isFieldAllowed(resolved, "price")).toBe(false);
  });

  it("denies every field for a caller with no known role", () => {
    const access = buildAccess({ editor: { posts: { update: () => ({ "*": true }) } } });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["ghost"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "title")).toBe(false);
  });

  it("is per action: a map on update does not restrict read", () => {
    const access = buildAccess({
      editor: { posts: { read: true, update: () => ({ "*": false, title: true }) } },
    });
    expect(
      resolveFieldPermissions({
        access,
        user: { roles: ["editor"] },
        data: {},
        resource: "posts",
        action: "read",
      }),
    ).toEqual({ wildcard: true, fields: {} });
  });

  it("resolves a data-reading callback per scope when no document is supplied", () => {
    const access = buildAccess({
      editor: {
        posts: {
          update: ({ data }: { data?: { status?: string } }) => ({
            "*": data?.status === "draft",
          }),
        },
      },
    });
    const user = { roles: ["editor"] };
    expect(isFieldAllowed(resolveFieldPermissions({ access, user, ...CALL }), "title")).toBe(false);
    expect(
      isFieldAllowed(resolveFieldPermissions({ access, user, scope: "any", ...CALL }), "title"),
    ).toBe(true);
  });

  it("warns in dev on a key the resource does not declare", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const access = buildAccessWithPosts({
      editor: { posts: { update: () => ({ "*": false, tilte: true }) } },
    });
    resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"tilte"'));
    warnSpy.mockRestore();
  });

  it("warns in dev on a system key", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const access = buildAccessWithPosts({
      editor: { posts: { update: () => ({ "*": false, _id: true }) } },
    });
    resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("system field"));
    warnSpy.mockRestore();
  });

  it("does not warn on the wildcard key or a declared field", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const access = buildAccessWithPosts({
      editor: { posts: { update: () => ({ "*": false, title: true }) } },
    });
    resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("stripDeniedFields", () => {
  it("returns the same reference when nothing is restricted", () => {
    const doc = { _id: "1", title: "a", price: 10 };
    expect(stripDeniedFields(doc, { wildcard: true, fields: {} })).toBe(doc);
  });

  it("removes denied keys without mutating the input", () => {
    const doc = { _id: "1", title: "a", price: 10 };
    const result = stripDeniedFields(doc, { wildcard: false, fields: { title: true } });
    expect(result).toEqual({ _id: "1", title: "a" });
    expect(doc).toEqual({ _id: "1", title: "a", price: 10 });
  });

  it("always retains system keys", () => {
    const doc = { _id: "1", _creationTime: 0, _slug: "siteSettings", name: "x" };
    expect(stripDeniedFields(doc, { wildcard: false, fields: {} })).toEqual({
      _id: "1",
      _creationTime: 0,
      _slug: "siteSettings",
    });
  });
});
