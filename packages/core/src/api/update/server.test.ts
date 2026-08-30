import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { update } from "./server";
import { defineAccess } from "../../access/config";
import { defineCollection, text, checkbox } from "../../index";
import { VexAccessError, WILDCARD_KEY } from "../../access";


// Minimal resolved-config fixture: these server functions only read
// `config.access` (undefined here → RBAC off) at this layer.
const fixtureConfig = { collections: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("update (server)", () => {
  test("patches only the specified fields", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "old" });
      await update({ ctx, id, collection: "posts", config: fixtureConfig, data: { title: "New" } });
      const doc = await ctx.db.get(id);
      expect(doc?.title).toBe("New");
      expect(doc?.slug).toBe("old"); // unchanged
    });
  });

  // Regression: the authorization callback must receive the STORED document, not
  // `args.data`. Checking the caller-supplied patch let a per-document rule be
  // satisfied by the payload — send a permitted value for the guarded field and
  // the write lands on a row you were never allowed to touch.
  test("evaluates a per-document rule against the stored doc, not the patch", async () => {
    const t = convexTest(schema, modules);
    const seen: unknown[] = [];
    const guarded = {
      collections: [],
      access: {
        // `enabled` is required on a hand-built config: `hasPermission` treats a
        // falsy `enabled` as "RBAC off" and allows everything.
        enabled: true,
        roles: ["editor"],
        defaultPermissionMode: "allow",
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          // Only rows whose STORED slug is "editable" may be updated.
          editor: {
            posts: {
              update: ({ data }: { data: { slug?: string } }) => {
                seen.push(data?.slug);
                return data?.slug === "editable";
              },
            },
          },
        },
      },
    } as unknown as VexConfig;
    const auth = { user: { roles: ["editor"] } };

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const locked = await ctx.db.insert("posts", { title: "Locked", slug: "locked" });

      // The patch claims the permitted slug; the stored row is "locked".
      await expect(
        update({
          ctx,
          id: locked,
          collection: "posts",
          config: guarded,
          auth,
          data: { title: "Hijacked", slug: "editable" },
        }),
      ).rejects.toThrow();

      // The rule saw the stored value, and the row is untouched.
      expect(seen).toContain("locked");
      expect((await ctx.db.get(locked))?.title).toBe("Locked");
    });
  });

  test("allows the update when the stored doc satisfies the rule", async () => {
    const t = convexTest(schema, modules);
    const guarded = {
      collections: [],
      access: {
        enabled: true,
        roles: ["editor"],
        defaultPermissionMode: "allow",
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: {
            posts: { update: ({ data }: { data: { slug?: string } }) => data?.slug === "editable" },
          },
        },
      },
    } as unknown as VexConfig;

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const open = await ctx.db.insert("posts", { title: "Open", slug: "editable" });
      await update({
        ctx,
        id: open,
        collection: "posts",
        config: guarded,
        auth: { user: { roles: ["editor"] } },
        data: { title: "Renamed" },
      });
      expect((await ctx.db.get(open))?.title).toBe("Renamed");
    });
  });
});

// ── Access-enforcement fixture ─────────────────────────────────────────────
const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});

describe("update (server) — access enforcement", () => {
  test("denies an update when the action check is a static false", async () => {
    const t = convexTest(schema, modules);
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["blocked"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          blocked: { posts: { update: false } },
        },
      }),
    } as unknown as VexConfig;

    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Old", slug: "old" });
        return update({
          ctx,
          id,
          collection: "posts",
          config,
          auth: { user: { roles: ["blocked"] } },
          data: { title: "New" },
        });
      }),
    ).rejects.toThrow(VexAccessError);
  });

  test("denies via role-level wildcard false when the resource is undeclared for that role", async () => {
    const t = convexTest(schema, modules);
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["noAccess"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          noAccess: { [WILDCARD_KEY]: false },
        },
      }),
    } as unknown as VexConfig;

    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Old", slug: "old" });
        return update({
          ctx,
          id,
          collection: "posts",
          config,
          auth: { user: { roles: ["noAccess"] } },
          data: { title: "New" },
        });
      }),
    ).rejects.toThrow(VexAccessError);
  });

  test("an explicit update action overrides a denying subject-level wildcard", async () => {
    const t = convexTest(schema, modules);
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: { posts: { [WILDCARD_KEY]: false, update: true } },
        },
      }),
    } as unknown as VexConfig;

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "old" });
      await update({
        ctx,
        id,
        collection: "posts",
        config,
        auth: { user: { roles: ["editor"] } },
        data: { title: "New" },
      });
      expect((await ctx.db.get(id))?.title).toBe("New");
    });
  });

  describe("constraint-object form — predicate-only `q`, interpreted against the STORED doc", () => {
    const constrainedConfig = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["contributor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          contributor: {
            posts: {
              update: { constraints: ({ q }) => q.filter((f) => f.eq("featured", true)) },
            },
          },
        },
      }),
    } as unknown as VexConfig;
    const auth = { user: { roles: ["contributor"] } };

    test("allows the update when the stored doc satisfies the constraint", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Old", slug: "s", featured: true });
        await update({ ctx, id, collection: "posts", config: constrainedConfig, auth, data: { title: "New" } });
        expect((await ctx.db.get(id))?.title).toBe("New");
      });
    });

    test("denies the update when the stored doc fails the constraint, even if the patch sets it", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Old", slug: "s", featured: false });
        // The patch claims `featured: true`, but the constraint reads the STORED
        // doc — still `false` at check time — so the write must be denied.
        await expect(
          update({
            ctx,
            id,
            collection: "posts",
            config: constrainedConfig,
            auth,
            data: { title: "Hijacked", featured: true },
          }),
        ).rejects.toThrow(VexAccessError);
        expect((await ctx.db.get(id))?.title).toBe("Old");
      });
    });
  });

  describe("constraint-object form — `filter` augments `constraints` (AND, not OR)", () => {
    const bothConfig = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["contributor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          contributor: {
            posts: {
              update: {
                constraints: ({ q }) => q.filter((f) => f.eq("featured", true)),
                filter: ({ data }: { data: { title?: string } }) => data?.title === "Approved",
              },
            },
          },
        },
      }),
    } as unknown as VexConfig;
    const auth = { user: { roles: ["contributor"] } };

    test("allows only when both the constraint and the filter hold", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Approved", slug: "s", featured: true });
        await update({ ctx, id, collection: "posts", config: bothConfig, auth, data: { slug: "s2" } });
        expect((await ctx.db.get(id))?.slug).toBe("s2");
      });
    });

    test("denies when the constraint holds but the filter does not", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Unapproved", slug: "s", featured: true });
        await expect(
          update({ ctx, id, collection: "posts", config: bothConfig, auth, data: { slug: "s2" } }),
        ).rejects.toThrow(VexAccessError);
      });
    });

    test("denies when the filter would hold but the constraint does not", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Approved", slug: "s", featured: false });
        await expect(
          update({ ctx, id, collection: "posts", config: bothConfig, auth, data: { slug: "s2" } }),
        ).rejects.toThrow(VexAccessError);
      });
    });
  });

  test("a constraints callback short-circuiting to a boolean gates on the caller alone, ignoring the doc", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["contributor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          contributor: {
            posts: {
              update: {
                constraints: (props) => {
                  const user = props.user as { _id?: string };
                  return user._id === "u1";
                },
              },
            },
          },
        },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "s", featured: false });
      await update({
        ctx,
        id,
        collection: "posts",
        config,
        auth: { user: { _id: "u1", roles: ["contributor"] } },
        data: { title: "New" },
      });
      expect((await ctx.db.get(id))?.title).toBe("New");

      await expect(
        update({
          ctx,
          id,
          collection: "posts",
          config,
          auth: { user: { _id: "u2", roles: ["contributor"] } },
          data: { title: "Nope" },
        }),
      ).rejects.toThrow(VexAccessError);
    });
  });

  test("an organization-scoped rule denies a caller with no organization", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["member"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        orgCollectionSlug: "organizations",
        userRolesField: "roles",
        permissions: {
          member: {
            posts: {
              update: (props) => {
                if (!("organization" in props)) return false;
                const organization = props.organization as { _id?: string } | undefined;
                return organization?._id === "org1";
              },
            },
          },
        },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "s" });
      await update({
        ctx,
        id,
        collection: "posts",
        config,
        auth: { user: { roles: ["member"] }, organization: { _id: "org1" } },
        data: { title: "New" },
      });
      expect((await ctx.db.get(id))?.title).toBe("New");

      await expect(
        update({
          ctx,
          id,
          collection: "posts",
          config,
          auth: { user: { roles: ["member"] } }, // no organization
          data: { title: "Nope" },
        }),
      ).rejects.toThrow(VexAccessError);
    });
  });

  test("an unauthenticated caller (no auth at all) fails closed", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["anyone"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { anyone: { posts: true } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "s" });
      await expect(
        update({ ctx, id, collection: "posts", config, data: { title: "Nope" } }),
      ).rejects.toThrow(VexAccessError);
    });
  });

  test("a caller with `user: null` fails closed the same as no auth", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["anyone"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { anyone: { posts: true } },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "s" });
      await expect(
        update({ ctx, id, collection: "posts", config, auth: { user: null }, data: { title: "Nope" } }),
      ).rejects.toThrow(VexAccessError);
    });
  });
});

/** Runs `fn` inside a fresh `convexTest` transaction. */
async function withTransaction(
  fn: (ctx: GenericMutationCtx<GenericDataModel>) => Promise<void>,
): Promise<void> {
  const t = convexTest(schema, modules);
  await t.run(fn);
}
