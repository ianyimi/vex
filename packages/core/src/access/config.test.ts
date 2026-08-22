import { describe, expect, it, vi } from "vitest";
import { defineCollection, text } from "../index";
import { PERMISSION_MODES, WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";
import { VexAccessConfigError } from "./types";

function withNodeEnv<T>(env: string, run: () => T): T {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = env;
  try {
    return run();
  } finally {
    process.env.NODE_ENV = original;
  }
}

const posts = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }) },
});

// `roles` / `accountRoles` are text fields — defineAccess validates that
// `userRolesField` exists on the user collection and is a text/array field.
const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text(), accountRoles: text() },
});

/** Shared valid base — spread into calls, override per test. */
const baseInput = {
  roles: ["admin"] as const,
  resources: [users],
  userCollectionSlug: "users",
  userRolesField: "roles",
} as const;

describe("defineAccess — runtime passthrough", () => {
  it("passes the permissions matrix through unchanged", () => {
    const permissions = {
      admin: { [WILDCARD_KEY]: true },
      editor: {
        posts: { create: true, read: true, update: true, delete: false },
      },
    };
    const access = defineAccess({
      ...baseInput,
      roles: ["admin", "editor"] as const,
      resources: [posts, users],
      permissions,
    });
    expect(access.roles).toEqual(["admin", "editor"]);
    expect(access.userCollectionSlug).toBe("users");
    expect(access.userRolesField).toBe("roles");
    expect(access.permissions).toEqual(permissions);
    expect(access.orgCollectionSlug).toBeUndefined();
  });

  it("throws when userCollectionSlug is empty", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        userCollectionSlug: "",
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });

  it("stores the org collection slug when provided", () => {
    const access = defineAccess({
      ...baseInput,
      orgCollectionSlug: "organizations",
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.orgCollectionSlug).toBe("organizations");
  });
});

describe("defineAccess — defaults", () => {
  it("falls back to allow when defaults is omitted", () => {
    const access = defineAccess({
      ...baseInput,
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.defaultPermissionMode).toBe(PERMISSION_MODES.allow);
  });

  it("passes through an explicit deny default", () => {
    const access = defineAccess({
      ...baseInput,
      defaultPermissionMode: PERMISSION_MODES.deny,
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.defaultPermissionMode).toBe(PERMISSION_MODES.deny);
  });
});

describe("defineAccess — userRolesField", () => {
  it("stores the userRolesField on the resolved config", () => {
    const access = defineAccess({
      ...baseInput,
      userRolesField: "accountRoles",
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.userRolesField).toBe("accountRoles");
  });

  it("rejects an empty userRolesField with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        userRolesField: "",
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — anonRole", () => {
  it("stores anonRole on the resolved config", () => {
    const access = defineAccess({
      ...baseInput,
      roles: ["admin", "user"] as const,
      anonRole: "user",
      permissions: { admin: { [WILDCARD_KEY]: true }, user: {} },
    });
    expect(access.anonRole).toBe("user");
  });

  it("leaves anonRole undefined when omitted", () => {
    const access = defineAccess({
      ...baseInput,
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    expect(access.anonRole).toBeUndefined();
  });

  it("rejects an empty anonRole with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        anonRole: "" as never,
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — customResources", () => {
  it("does not warn when referencing a declared custom resource", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        customResources: { apiKeys: { actions: ["create", "revoke"] } },
        permissions: { admin: { apiKeys: { create: true } } },
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("rejects an empty actions array with VexAccessConfigError", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        customResources: { apiKeys: { actions: [] } },
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });

  it("rejects a customResources key that collides with a resource slug", () => {
    expect(() =>
      defineAccess({
        ...baseInput,
        customResources: { users: { actions: ["create"] } },
        permissions: { admin: { [WILDCARD_KEY]: true } },
      }),
    ).toThrow(VexAccessConfigError);
  });
});

describe("defineAccess — dev-mode warnings", () => {
  it("warns when a permission role key is not in roles", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { [WILDCARD_KEY]: true },
          superuser: { [WILDCARD_KEY]: true },
        } as never,
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("superuser"));
    warnSpy.mockRestore();
  });

  it("warns when a permission subject key is unknown", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: { admin: { nonexistent: true } } as never,
      });
    });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("nonexistent"));
    warnSpy.mockRestore();
  });

  it("does not warn on the reserved adminPanel or wildcard subject keys", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { adminPanel: { access: true, impersonate: false }, [WILDCARD_KEY]: true },
        },
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns exactly once when orgCollectionSlug is empty", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("development", () => {
      defineAccess({
        ...baseInput,
        roles: ["admin", "editor"] as const,
        orgCollectionSlug: "",
        permissions: {
          admin: { [WILDCARD_KEY]: true },
          editor: { [WILDCARD_KEY]: true },
        },
      });
    });
    const orgWarnings = warnSpy.mock.calls.filter(([msg]) =>
      String(msg).includes("orgCollectionSlug"),
    );
    expect(orgWarnings).toHaveLength(1); // once total — not once per role
    warnSpy.mockRestore();
  });

  it("does not warn in production even for unknown roles or subjects", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    withNodeEnv("production", () => {
      defineAccess({
        ...baseInput,
        permissions: {
          admin: { nonexistent: true },
          superuser: { [WILDCARD_KEY]: true },
        } as never,
      });
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("defineAccess — type-level", () => {
  it("rejects an unknown role key in permissions", () => {
    defineAccess({
      ...baseInput,
      roles: ["admin"] as const,
      resources: [posts, users],
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        // @ts-expect-error — "superuser" is not in `roles`
        superuser: { [WILDCARD_KEY]: true },
      },
    });
  });

  it("rejects an unknown action for a resource subject", () => {
    defineAccess({
      ...baseInput,
      resources: [posts, users],
      permissions: {
        admin: {
          // @ts-expect-error — "publish" requires versions.drafts on the resource
          posts: { publish: true },
        },
      },
    });
  });

  it("rejects a field-mode object on a custom resource", () => {
    defineAccess({
      ...baseInput,
      resources: [posts, users],
      customResources: { apiKeys: { actions: ["create", "revoke"] } },
      permissions: {
        admin: {
          // @ts-expect-error — custom resource subjects have `fields: never`, no field-mode object
          apiKeys: { mode: "allow", fields: ["create"] },
        },
      },
    });
  });
});
