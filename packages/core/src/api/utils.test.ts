import { describe, expect, it, vi } from "vitest";
import { defineAccess } from "../access/config";
import { defineCollection, text } from "../index";
import { resolveAccessCall, resolveCollectionSlug } from "./utils";

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

describe("resolveCollectionSlug", () => {
  /**
   * A `ctx` whose `normalizeId` claims `id` for exactly one table, mirroring the
   * real syscall: non-null for the owning table, `null` for every other.
   *
   * @param owningTable - The table the id actually belongs to.
   * @returns A partial query ctx carrying only `db.normalizeId`.
   */
  function ctxOwnedBy(owningTable: string) {
    return {
      db: { normalizeId: (table: string, id: string) => (table === owningTable ? id : null) },
    } as never;
  }

  const images = defineCollection({ slug: "images", fields: { alt: text() } });
  // `defineConfig` keeps media collections in their OWN array — a media slug never
  // appears in `collections`, which is exactly what this resolver has to handle.
  const mediaConfig = { collections: [articles, users], mediaCollections: [images] } as never;

  it("resolves an id owned by a regular collection", () => {
    expect(
      resolveCollectionSlug({ ctx: ctxOwnedBy("articles"), config: mediaConfig, id: "a1" as never }),
    ).toBe("articles");
  });

  it("resolves an id owned by a MEDIA collection", () => {
    // Regression: probing only `config.collections` left every media id
    // unresolvable, so `getUrl`/`deleteMedia` threw for any project with
    // `access` configured — public pages lost their images and emitted no
    // `og:image`.
    expect(
      resolveCollectionSlug({ ctx: ctxOwnedBy("images"), config: mediaConfig, id: "i1" as never }),
    ).toBe("images");
  });

  it("throws when no registered collection claims the id", () => {
    expect(() =>
      resolveCollectionSlug({
        ctx: ctxOwnedBy("vex_globals"),
        config: mediaConfig,
        id: "g1" as never,
      }),
    ).toThrow(/does not match a collection slug/);
  });
});
