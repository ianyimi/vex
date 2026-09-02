import { describe, expect, it, vi } from "vitest";
import { defineAccess } from "../access/config";
import { defineCollection, text } from "../index";
import { resolveAccessCall } from "./utils";

const articles = defineCollection({
  slug: "articles",
  fields: { title: text({ required: true }), status: text({ index: "by_status" }) },
});
const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const access = defineAccess({
  roles: ["editor"] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  customActions: { articles: { query: ["listFeatured"], mutation: ["publish"] } },
  permissions: { editor: { articles: { read: true } } },
});
const config = { access } as never;

describe("resolveAccessCall", () => {
  it("defaults to the function's natural verb and echoes the resource", () => {
    // `resource` is echoed back so call sites can destructure all three and use
    // shorthand at every check site: `hasPermission({ access, action, resource, … })`.
    expect(resolveAccessCall({ config, defaultAction: "read", resource: "articles" })).toEqual({
      access,
      action: "read",
      resource: "articles",
    });
  });

  it("uses an explicit custom action", () => {
    expect(
      resolveAccessCall({
        config,
        access: { action: "listFeatured" },
        defaultAction: "read",
        resource: "articles",
      }).action,
    ).toBe("listFeatured");
  });

  it("drops the matrix when bypassed — the RBAC-off path, not a new branch", () => {
    expect(
      resolveAccessCall({
        config,
        access: { bypass: true },
        defaultAction: "read",
        resource: "articles",
      }).access,
    ).toBeUndefined();
  });

  it("returns undefined access when RBAC is not configured at all", () => {
    expect(
      resolveAccessCall({ config: {} as never, defaultAction: "read", resource: "articles" })
        .access,
    ).toBeUndefined();
  });

  it("warns when an explicit action is not declared for the subject", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveAccessCall({
      config,
      access: { action: "listFeatued" },
      defaultAction: "read",
      resource: "articles",
    });
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("listFeatued");
    warn.mockRestore();
  });

  it("does not warn for a declared custom action, a built-in, or a draft action", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const action of ["listFeatured", "publish", "read", "readDrafts"]) {
      resolveAccessCall({
        config,
        access: { action },
        defaultAction: "read",
        resource: "articles",
      });
    }
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns when bypass is set but RBAC is already off", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveAccessCall({
      config: {} as never,
      access: { bypass: true },
      defaultAction: "read",
      resource: "articles",
    });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
