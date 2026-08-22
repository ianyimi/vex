import { describe, expect, it } from "vitest";
import { canAccessAdminPanel } from "./canAccessAdminPanel";
import type { VexAccessConfig } from "./types";

/**
 * Builds a minimal resolved access config with the given adminPanel matrix.
 *
 * `enabled: true` is required: `hasPermission` short-circuits to "allow" on a
 * config whose `enabled` is falsy, which is how RBAC is switched off. Hand-built
 * fixtures must set it explicitly — only `defineAccess()` defaults it to `true`.
 */
function accessWith(permissions: Record<string, unknown>): VexAccessConfig {
  return {
    enabled: true,
    roles: ["admin", "user"],
    defaultPermissionMode: "allow",
    userCollectionSlug: "user",
    userRolesField: "roles",
    permissions,
  } as unknown as VexAccessConfig;
}

describe("canAccessAdminPanel", () => {
  it("denies an unauthenticated caller", () => {
    const access = accessWith({ admin: { adminPanel: { access: true } } });
    expect(canAccessAdminPanel({ access, user: null })).toBe(false);
  });

  it("denies a caller holding no role in the matrix", () => {
    const access = accessWith({ admin: { adminPanel: { access: true } } });
    expect(canAccessAdminPanel({ access, user: { roles: [] } })).toBe(false);
  });

  it("denies when the role's adminPanel.access is false", () => {
    // The bug this guards: an authenticated caller reached the panel regardless
    // of the matrix, because nothing consulted `adminPanel.access`.
    const access = accessWith({ user: { adminPanel: { access: false } } });
    expect(canAccessAdminPanel({ access, user: { roles: ["user"] } })).toBe(false);
  });

  it("allows when the role's adminPanel.access is true", () => {
    const access = accessWith({ admin: { adminPanel: { access: true } } });
    expect(canAccessAdminPanel({ access, user: { roles: ["admin"] } })).toBe(true);
  });

  it("evaluates a role callback against the caller", () => {
    const access = accessWith({
      user: {
        adminPanel: {
          access: ({ user }: { user: { roles?: string[] } }) =>
            user.roles?.includes("admin") === true,
        },
      },
    });
    expect(canAccessAdminPanel({ access, user: { roles: ["user"] } })).toBe(false);
    // The same callback allows a caller who also holds "admin" — note the role
    // key is what selects the rule, so "user" must be present to reach it.
    expect(canAccessAdminPanel({ access, user: { roles: ["user", "admin"] } })).toBe(true);
  });

  it("allows every caller when no access config is supplied (RBAC not configured)", () => {
    expect(canAccessAdminPanel({ access: undefined, user: null })).toBe(true);
  });

  it("never throws when a callback reaches for a document it cannot have", () => {
    // The adminPanel subject carries no document, so a rule that inspects one is
    // resolved under `scope: "any"` rather than throwing at the call site.
    const access = accessWith({
      user: {
        adminPanel: {
          access: ({ data }: { data: { anything?: string } }) => data.anything === "x",
        },
      },
    });
    expect(() => canAccessAdminPanel({ access, user: { roles: ["user"] } })).not.toThrow();
    expect(canAccessAdminPanel({ access, user: { roles: ["user"] } })).toBe(true);
  });

  it("merges roles: one allowing role wins over a denying one", () => {
    const access = accessWith({
      admin: { adminPanel: { access: true } },
      user: { adminPanel: { access: false } },
    });
    expect(canAccessAdminPanel({ access, user: { roles: ["user", "admin"] } })).toBe(true);
  });
});
