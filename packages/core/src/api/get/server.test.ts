import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../../config";
import type { DocumentBySlug } from "../../types/generated";
import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { get } from "./server";
import { defineCollection, text, checkbox } from "../../index";
import { defineAccess } from "../../access/config";
import { VexAccessError } from "../../access";

// ── Minimal VexConfig fixture for depth tests ─────────────────────────────
const fixtureConfig: VexConfig = {
  collections: [
    {
      slug: "posts",
      fields: {
        title: { type: "text" },
        author: { type: "relationship", collection: { slug: "authors" } },
      },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
    },
    {
      slug: "authors",
      fields: {
        name: { type: "text" },
        organization: {
          type: "relationship",
          collection: { slug: "organizations" },
        },
      },
      labels: { singular: "Author", plural: "Authors" },
      admin: { useAsTitle: "name" },
    },
    {
      slug: "organizations",
      fields: { name: { type: "text" } },
      labels: { singular: "Organization", plural: "Organizations" },
      admin: { useAsTitle: "name" },
    },
  ],
} as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("get (server)", () => {
  test("returns the doc for an existing id", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", {
          title: "Solo",
          slug: "solo",
        });
        return get({ ctx, id, collection: "posts", config: fixtureConfig });
      },
    );
    expect(doc).toMatchObject({ title: "Solo", slug: "solo" });
  });

  test("returns null for a missing id", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Doomed", slug: "x" });
        await ctx.db.delete(id);
        return get({ ctx, id, collection: "posts", config: fixtureConfig });
      },
    );
    expect(doc).toBeNull();
  });

  test("populate replaces Ids on a single doc", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return get({
          ctx,
          id: postId,
          populate: { author: true },
        } as any) as Promise<{ author: unknown; [k: string]: unknown } | null>;
      },
    );
    expect((doc?.author as DocumentBySlug["authors"][])?.[0].name).toBe("Lena");
  });
});

describe("get (server) — depth auto-populate", () => {
  test("depth: 1 auto-populates all direct relationship fields on a single doc", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return get({ ctx, id: postId, collection: "posts", depth: 1, config: fixtureConfig } as any);
      },
    ) as any;
    const author = (doc.author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    expect(typeof author._id).toBe("string");
  });

  test("depth: 1 returns null when doc is missing", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Doomed", slug: "x" });
        await ctx.db.delete(id);
        return get({ ctx, id, collection: "posts", depth: 1, config: fixtureConfig } as any);
      },
    );
    expect(doc).toBeNull();
  });

  test("depth: 2 populates nested relationships (posts → authors → organizations)", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const orgId = await ctx.db.insert("organizations", { name: "Vex Inc" });
        const authorId = await ctx.db.insert("authors", {
          name: "Lena",
          organization: [orgId],
        });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return get({ ctx, id: postId, collection: "posts", depth: 2, config: fixtureConfig } as any);
      },
    ) as any;
    const author = (doc.author as DocumentBySlug["authors"][])[0];
    expect(author.name).toBe("Lena");
    const org = (author.organization as unknown as DocumentBySlug["organizations"][])[0];
    expect(org.name).toBe("Vex Inc");
  });

  test("depth: 0 returns raw doc without population", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return get({ ctx, id: postId, collection: "posts", depth: 0, config: fixtureConfig } as any);
      },
    ) as any;
    // author should still be a raw ID array.
    expect(typeof doc.author[0]).toBe("string");
  });

  test("depth without config returns raw doc (effectivePopulate guard)", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const authorId = await ctx.db.insert("authors", { name: "Lena" });
        const postId = await ctx.db.insert("posts", {
          title: "Hi",
          slug: "hi",
          author: [authorId],
        });
        return get({ ctx, id: postId, depth: 1 } as any);
      },
    ) as any;
    // No config → buildDepthPopulate cannot run → raw ID preserved.
    expect(typeof doc.author[0]).toBe("string");
  });
});

// ── RBAC read-enforcement fixture ─────────────────────────────────────────
const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
});

const rbacConfig = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["admin", "restricted"] as const,
    resources: [postsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      admin: { posts: true },
      restricted: { posts: { read: false } },
    },
  }),
} as unknown as VexConfig;

const restrictedAuth = { user: { _id: "u1", roles: ["restricted"] } };
const adminAuth = { user: { _id: "u2", roles: ["admin"] } };

describe("get (server) — read RBAC enforcement", () => {
  test("denies an un-populated read (regression: check must precede the early return)", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Secret", slug: "secret" });
        return get({ ctx, id, collection: "posts", config: rbacConfig, auth: restrictedAuth } as any);
      }),
    ).rejects.toThrow(VexAccessError);
  });

  test("denies a populated read too (enforced before populate work)", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Secret", slug: "secret" });
        return get({
          ctx,
          id,
          collection: "posts",
          populate: { author: true },
          config: rbacConfig,
          auth: restrictedAuth,
        } as any);
      }),
    ).rejects.toThrow(VexAccessError);
  });

  test("denies an unauthenticated read when access is configured (fail-closed)", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Secret", slug: "secret" });
        return get({ ctx, id, collection: "posts", config: rbacConfig } as any); // no auth
      }),
    ).rejects.toThrow(VexAccessError);
  });

  test("allows a read for a permitted role", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Public", slug: "public" });
      return get({ ctx, id, collection: "posts", config: rbacConfig, auth: adminAuth } as any);
    });
    expect(doc).toMatchObject({ title: "Public", slug: "public" });
  });

  test("skips the check when no access config is set (RBAC off)", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Open", slug: "open" });
      return get({ ctx, id, collection: "posts", config: fixtureConfig, auth: restrictedAuth } as any);
    });
    expect(doc).toMatchObject({ title: "Open" });
  });

  test("returns null for a missing doc without a permission check", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Gone", slug: "gone" });
      await ctx.db.delete(id);
      return get({ ctx, id, collection: "posts", config: rbacConfig, auth: restrictedAuth } as any);
    });
    expect(doc).toBeNull();
  });
});

// ── Constraint-object and callback forms interpreted against ONE document ──
const constrainedPostsResource = defineCollection({
  slug: "posts",
  // `featured` declares a real index — `defineAccess` validates a rule's
  // `withIndex` call against it at config time.
  fields: { title: text(), slug: text(), featured: checkbox({ index: "by_featured" }) },
});

const contributorAuth = { user: { _id: "u1", roles: "contributor" } };

const dataCallbackAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      // A bare callback that reads `data` — `get` always supplies it, so this
      // is answered exactly, never through the no-data capability probe.
      contributor: { posts: { read: ({ data }) => data.featured === true } },
    },
  }),
} as unknown as VexConfig;

const undefinedCallbackAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      // Never reads `data` and never returns a boolean — an inconclusive
      // callback result is normalized to `false` (deny), never an implicit
      // allow.
      contributor: { posts: { read: () => undefined } },
    },
  }),
} as unknown as VexConfig;

const constraintOnlyAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          read: { constraints: ({ q }) => q.filter((f) => f.eq("featured", true)) },
        },
      },
    },
  }),
} as unknown as VexConfig;

const constraintPlusFilterAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        posts: {
          read: {
            constraints: ({ q }) => q.withIndex("by_featured", (ix) => ix.eq("featured", true)),
            // Augments `constraints` — never a substitute. Both must hold.
            filter: ({ data }) => data.slug !== "hidden",
          },
        },
      },
    },
  }),
} as unknown as VexConfig;

const constraintBooleanShortCircuitAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        // Never touches `q` — resolves straight to a flat verdict per caller,
        // which `resolveConstrainedCheck` must honor WITHOUT ever consulting
        // the document (it returns the boolean outcome before the per-doc
        // interpretation branch even runs).
        posts: { read: { constraints: ({ user }) => user._id === "vip" } },
      },
    },
  }),
} as unknown as VexConfig;

const vipAuth = { user: { _id: "vip", roles: "contributor" } };

const anonReadConfig = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["admin", "guest"] as const,
    anonRole: "guest",
    resources: [postsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      admin: { posts: true },
      guest: { posts: { read: true } },
    },
  }),
} as unknown as VexConfig;

describe("get (server) — per-document callback checks", () => {
  test("a data-reading callback denies by throwing, not by returning null/undefined", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Draft", slug: "draft", featured: false });
        return get({ ctx, id, collection: "posts", config: dataCallbackAccess, auth: contributorAuth } as any);
      }),
    ).rejects.toThrow(VexAccessError);
  });

  test("a data-reading callback allows and returns the doc when it evaluates true", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Live", slug: "live", featured: true });
      return get({ ctx, id, collection: "posts", config: dataCallbackAccess, auth: contributorAuth } as any);
    });
    expect(doc).toMatchObject({ title: "Live", featured: true });
  });

  test("a callback resolving to undefined denies (inconclusive is never an implicit allow)", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "X", slug: "x", featured: true });
        return get({
          ctx,
          id,
          collection: "posts",
          config: undefinedCallbackAccess,
          auth: contributorAuth,
        } as any);
      }),
    ).rejects.toThrow(VexAccessError);
  });
});

describe("get (server) — constraint-object form interpreted against the fetched document", () => {
  test("allowed row (constraint holds): returns the document", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Yes", slug: "yes", featured: true });
      return get({ ctx, id, collection: "posts", config: constraintOnlyAccess, auth: contributorAuth } as any);
    });
    expect(doc).toMatchObject({ title: "Yes" });
  });

  test("denied row (constraint fails): throws rather than returning a doc", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "No", slug: "no", featured: false });
        return get({ ctx, id, collection: "posts", config: constraintOnlyAccess, auth: contributorAuth } as any);
      }),
    ).rejects.toThrow(VexAccessError);
  });

  test("constraints AND sibling filter: both must hold, not either", async () => {
    const t = convexTest(schema, modules);
    const [allowed, deniedByFilter, deniedByConstraint] = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const okId = await ctx.db.insert("posts", { title: "OK", slug: "a", featured: true });
        const hiddenId = await ctx.db.insert("posts", { title: "Hidden", slug: "hidden", featured: true });
        const unfeaturedId = await ctx.db.insert("posts", { title: "Un", slug: "b", featured: false });

        const okResult = await get({
          ctx,
          id: okId,
          collection: "posts",
          config: constraintPlusFilterAccess,
          auth: contributorAuth,
        } as any);

        // Errors are not valid Convex return values — capture "did it throw
        // VexAccessError" as a plain boolean instead of the caught object.
        let hiddenDenied = false;
        try {
          await get({
            ctx,
            id: hiddenId,
            collection: "posts",
            config: constraintPlusFilterAccess,
            auth: contributorAuth,
          } as any);
        } catch (e) {
          hiddenDenied = e instanceof VexAccessError;
        }

        let unfeaturedDenied = false;
        try {
          await get({
            ctx,
            id: unfeaturedId,
            collection: "posts",
            config: constraintPlusFilterAccess,
            auth: contributorAuth,
          } as any);
        } catch (e) {
          unfeaturedDenied = e instanceof VexAccessError;
        }

        return [okResult, hiddenDenied, unfeaturedDenied];
      },
    );
    expect(allowed).toMatchObject({ title: "OK" });
    // Constraint holds (featured) but the sibling filter denies it (slug "hidden").
    expect(deniedByFilter).toBe(true);
    // Constraint itself fails — the sibling filter is never reached.
    expect(deniedByConstraint).toBe(true);
  });

  test("a constraints callback that short-circuits to a boolean bypasses per-document interpretation entirely", async () => {
    const t = convexTest(schema, modules);
    const [vipOnUnfeatured, contributorOnFeaturedDenied] = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id1 = await ctx.db.insert("posts", { title: "A", slug: "a", featured: false });
        const id2 = await ctx.db.insert("posts", { title: "B", slug: "b", featured: true });
        const asVip = await get({
          ctx,
          id: id1,
          collection: "posts",
          config: constraintBooleanShortCircuitAccess,
          auth: vipAuth,
        } as any);
        let asContributorDenied = false;
        try {
          await get({
            ctx,
            id: id2,
            collection: "posts",
            config: constraintBooleanShortCircuitAccess,
            auth: contributorAuth,
          } as any);
        } catch (e) {
          asContributorDenied = e instanceof VexAccessError;
        }
        return [asVip, asContributorDenied];
      },
    );
    // The doc is NOT featured, yet the "vip" caller's callback short-circuited
    // to `true` without ever touching `featured` — the boolean short-circuit
    // bypasses document interpretation altogether.
    expect(vipOnUnfeatured).toMatchObject({ title: "A" });
    // The doc IS featured, yet a non-vip caller is still denied — the
    // callback resolved to `false` and never consulted the document either.
    expect(contributorOnFeaturedDenied).toBe(true);
  });

});

describe("get (server) — anonRole participates in RBAC like any other role", () => {
  test("an unauthenticated caller resolves through anonRole and is allowed by its rule", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Public", slug: "public" });
      return get({ ctx, id, collection: "posts", config: anonReadConfig } as any); // no auth
    });
    expect(doc).toMatchObject({ title: "Public" });
  });
});

describe("get (server) — existence is not observable through access state", () => {
  test("a missing doc returns the identical result whether the rule would permit or deny it", async () => {
    const t = convexTest(schema, modules);
    const [asAdmin, asRestricted] = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Gone", slug: "gone" });
      await ctx.db.delete(id);
      const admin = await get({ ctx, id, collection: "posts", config: rbacConfig, auth: adminAuth } as any);
      const restricted = await get({
        ctx,
        id,
        collection: "posts",
        config: rbacConfig,
        auth: restrictedAuth,
      } as any);
      return [admin, restricted];
    });
    expect(asAdmin).toBeNull();
    expect(asRestricted).toBeNull();
    expect(asAdmin).toBe(asRestricted);
  });
});
