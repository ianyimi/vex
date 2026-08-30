import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { remove } from "./server";
import { defineAccess } from "../../access/config";
import { defineCollection, text, checkbox } from "../../index";
import { VexAccessError, WILDCARD_KEY } from "../../access";


// Minimal resolved-config fixture: these server functions only read
// `config.access` (undefined here → RBAC off) at this layer.
const fixtureConfig = { collections: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("remove (server)", () => {
  test("deletes a single document (ID in array)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Doomed", slug: "d" });
      await remove({ ctx, ids: [id], collection: "posts", config: fixtureConfig });
      const doc = await ctx.db.get(id);
      expect(doc).toBeNull();
    });
  });

  test("bulk deletes multiple documents", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id1 = await ctx.db.insert("posts", { title: "Post 1", slug: "p1" });
      const id2 = await ctx.db.insert("posts", { title: "Post 2", slug: "p2" });
      const id3 = await ctx.db.insert("posts", { title: "Post 3", slug: "p3" });
      
      await remove({ ctx, ids: [id1, id2, id3], collection: "posts", config: fixtureConfig });
      
      const doc1 = await ctx.db.get(id1);
      const doc2 = await ctx.db.get(id2);
      const doc3 = await ctx.db.get(id3);
      
      expect(doc1).toBeNull();
      expect(doc2).toBeNull();
      expect(doc3).toBeNull();
    });
  });

  test("soft delete marks document as deleted instead of removing", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Soft Delete Test", slug: "sdt" });
      
      await remove({ ctx, ids: [id], softDelete: "deleted", collection: "posts", config: fixtureConfig });
      
      const doc = await ctx.db.get(id);
      expect(doc).not.toBeNull();
      expect((doc as any).deleted).toBe(true);
    });
  });

  test("soft delete works with multiple documents", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id1 = await ctx.db.insert("posts", { title: "Post 1", slug: "p1" });
      const id2 = await ctx.db.insert("posts", { title: "Post 2", slug: "p2" });
      
      await remove({ ctx, ids: [id1, id2], softDelete: "deleted", collection: "posts", config: fixtureConfig });
      
      const doc1 = await ctx.db.get(id1);
      const doc2 = await ctx.db.get(id2);
      
      expect(doc1).not.toBeNull();
      expect(doc2).not.toBeNull();
      expect((doc1 as any).deleted).toBe(true);
      expect((doc2 as any).deleted).toBe(true);
    });
  });
});

// ── Access-enforcement fixture ─────────────────────────────────────────────
const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});

/** Runs `fn` inside a fresh `convexTest` transaction. */
async function withTransaction(
  fn: (ctx: GenericMutationCtx<GenericDataModel>) => Promise<void>,
): Promise<void> {
  const t = convexTest(schema, modules);
  await t.run(fn);
}

describe("remove (server) — access enforcement", () => {
  test("denies a delete when the action check is a static false", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["blocked"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          blocked: { posts: { delete: false } },
        },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Doomed", slug: "d" });
      await expect(
        remove({ ctx, ids: [id], collection: "posts", config, auth: { user: { roles: ["blocked"] } } }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.get(id)).not.toBeNull();
    });
  });

  test("denies via role-level wildcard false when the resource is undeclared for that role", async () => {
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

    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Doomed", slug: "d" });
      await expect(
        remove({ ctx, ids: [id], collection: "posts", config, auth: { user: { roles: ["noAccess"] } } }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.get(id)).not.toBeNull();
    });
  });

  test("an explicit delete action overrides a denying subject-level wildcard", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: { posts: { [WILDCARD_KEY]: false, delete: true } },
        },
      }),
    } as unknown as VexConfig;

    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Goes away", slug: "d" });
      await remove({ ctx, ids: [id], collection: "posts", config, auth: { user: { roles: ["editor"] } } });
      expect(await ctx.db.get(id)).toBeNull();
    });
  });

  test("a per-document callback is evaluated against the STORED doc before delete", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: {
            posts: {
              delete: ({ data }: { data: { featured?: boolean } }) => data?.featured !== true,
            },
          },
        },
      }),
    } as unknown as VexConfig;
    const auth = { user: { roles: ["editor"] } };

    await withTransaction(async (ctx) => {
      const protectedId = await ctx.db.insert("posts", { title: "Protected", slug: "p", featured: true });
      const openId = await ctx.db.insert("posts", { title: "Open", slug: "o", featured: false });

      await expect(
        remove({ ctx, ids: [protectedId], collection: "posts", config, auth }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.get(protectedId)).not.toBeNull();

      await remove({ ctx, ids: [openId], collection: "posts", config, auth });
      expect(await ctx.db.get(openId)).toBeNull();
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
              delete: { constraints: ({ q }) => q.filter((f) => f.eq("featured", false)) },
            },
          },
        },
      }),
    } as unknown as VexConfig;
    const auth = { user: { roles: ["contributor"] } };

    test("allows the delete when the stored doc satisfies the constraint", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Ok", slug: "o", featured: false });
        await remove({ ctx, ids: [id], collection: "posts", config: constrainedConfig, auth });
        expect(await ctx.db.get(id)).toBeNull();
      });
    });

    test("denies the delete when the stored doc fails the constraint", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Protected", slug: "p", featured: true });
        await expect(
          remove({ ctx, ids: [id], collection: "posts", config: constrainedConfig, auth }),
        ).rejects.toThrow(VexAccessError);
        expect(await ctx.db.get(id)).not.toBeNull();
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
              delete: {
                constraints: ({ q }) => q.filter((f) => f.eq("featured", false)),
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
        const id = await ctx.db.insert("posts", { title: "Approved", slug: "s", featured: false });
        await remove({ ctx, ids: [id], collection: "posts", config: bothConfig, auth });
        expect(await ctx.db.get(id)).toBeNull();
      });
    });

    test("denies when the constraint holds but the filter does not", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Unapproved", slug: "s", featured: false });
        await expect(
          remove({ ctx, ids: [id], collection: "posts", config: bothConfig, auth }),
        ).rejects.toThrow(VexAccessError);
      });
    });

    test("denies when the filter would hold but the constraint does not", async () => {
      await withTransaction(async (ctx) => {
        const id = await ctx.db.insert("posts", { title: "Approved", slug: "s", featured: true });
        await expect(
          remove({ ctx, ids: [id], collection: "posts", config: bothConfig, auth }),
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
              delete: {
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
      const id1 = await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await remove({
        ctx,
        ids: [id1],
        collection: "posts",
        config,
        auth: { user: { _id: "u1", roles: ["contributor"] } },
      });
      expect(await ctx.db.get(id1)).toBeNull();

      const id2 = await ctx.db.insert("posts", { title: "B", slug: "b", featured: true });
      await expect(
        remove({
          ctx,
          ids: [id2],
          collection: "posts",
          config,
          auth: { user: { _id: "u2", roles: ["contributor"] } },
        }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.get(id2)).not.toBeNull();
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
              delete: (props) => {
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
      const inOrg = await ctx.db.insert("posts", { title: "In org", slug: "i" });
      await remove({
        ctx,
        ids: [inOrg],
        collection: "posts",
        config,
        auth: { user: { roles: ["member"] }, organization: { _id: "org1" } },
      });
      expect(await ctx.db.get(inOrg)).toBeNull();

      const noOrg = await ctx.db.insert("posts", { title: "No org", slug: "n" });
      await expect(
        remove({ ctx, ids: [noOrg], collection: "posts", config, auth: { user: { roles: ["member"] } } }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.get(noOrg)).not.toBeNull();
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
      const id = await ctx.db.insert("posts", { title: "Open", slug: "o" });
      await expect(remove({ ctx, ids: [id], collection: "posts", config })).rejects.toThrow(
        VexAccessError,
      );
      expect(await ctx.db.get(id)).not.toBeNull();
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
      const id = await ctx.db.insert("posts", { title: "Open", slug: "o" });
      await expect(
        remove({ ctx, ids: [id], collection: "posts", config, auth: { user: null } }),
      ).rejects.toThrow(VexAccessError);
      expect(await ctx.db.get(id)).not.toBeNull();
    });
  });

  // Each id in a bulk delete is authorized independently, concurrently
  // (`Promise.all`). A real Convex mutation is transactional: if the handler's
  // returned promise rejects, NOTHING it staged commits — so as long as the
  // caller lets `remove()`'s rejection propagate (the normal, uncaught case),
  // a denial on one id must roll back deletes already staged for OTHER ids
  // that had independently passed their own check.
  test("a denial on one id in a bulk delete rolls back the whole transaction — no partial deletion", async () => {
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: {
            posts: {
              delete: ({ data }: { data: { featured?: boolean } }) => data?.featured !== true,
            },
          },
        },
      }),
    } as unknown as VexConfig;
    const auth = { user: { roles: ["editor"] } };

    const t = convexTest(schema, modules);
    const { openId, protectedId } = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const openId = await ctx.db.insert("posts", { title: "Open", slug: "o", featured: false });
      const protectedId = await ctx.db.insert("posts", {
        title: "Protected",
        slug: "p",
        featured: true,
      });
      return { openId, protectedId };
    });

    // The rejection is left UNCAUGHT inside the transaction — exactly how a
    // real `mutation({ handler })` that does not itself catch would behave.
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        remove({ ctx, ids: [openId, protectedId], collection: "posts", config, auth }),
      ),
    ).rejects.toThrow(VexAccessError);

    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      expect(await ctx.db.get(openId)).not.toBeNull();
      expect(await ctx.db.get(protectedId)).not.toBeNull();
    });
  });
});
