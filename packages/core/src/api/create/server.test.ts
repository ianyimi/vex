import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { create } from "./server";
import { defineAccess } from "../../access/config";
import { defineCollection, text, checkbox } from "../../index";
import { VexAccessError, WILDCARD_KEY } from "../../access";


// Minimal resolved-config fixture: these server functions only read
// `config.access` (undefined here → RBAC off) at this layer.
const fixtureConfig = { collections: [] } as unknown as VexConfig;

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("create (server)", () => {
  test("inserts a document and returns its id", async () => {
    const t = convexTest(schema, modules);
    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        data: { title: "Hello", slug: "hello" },
      }),
    );
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  test("document is retrievable after create", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await create({
        ctx,
        config: fixtureConfig,
        collection: "posts",
        data: { title: "Hello", slug: "hello" },
      });
      const doc = await ctx.db.get(id as never);
      expect(doc).toMatchObject({ title: "Hello", slug: "hello" });
    });
  });
});

// ── Access-enforcement fixture ─────────────────────────────────────────────
const postsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox() },
});

describe("create (server) — access enforcement", () => {
  test("denies a create when the action check is a static false", async () => {
    const t = convexTest(schema, modules);
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["blocked"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          blocked: { posts: { create: false } },
        },
      }),
    } as unknown as VexConfig;

    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        create({
          ctx,
          collection: "posts",
          config,
          auth: { user: { roles: ["blocked"] } },
          data: { title: "Nope", slug: "nope" },
        }),
      ),
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
        // `posts` is never mentioned for this role — resolution falls through to
        // the role-level wildcard, never to `defaultPermissionMode`.
        permissions: {
          noAccess: { [WILDCARD_KEY]: false },
        },
      }),
    } as unknown as VexConfig;

    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        create({
          ctx,
          collection: "posts",
          config,
          auth: { user: { roles: ["noAccess"] } },
          data: { title: "Nope", slug: "nope" },
        }),
      ),
    ).rejects.toThrow(VexAccessError);
  });

  test("an explicit create action overrides a denying subject-level wildcard", async () => {
    const t = convexTest(schema, modules);
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["editor"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: { posts: { [WILDCARD_KEY]: false, create: true } },
        },
      }),
    } as unknown as VexConfig;

    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        collection: "posts",
        config,
        auth: { user: { roles: ["editor"] } },
        data: { title: "Allowed", slug: "allowed" },
      }),
    );
    expect(typeof id).toBe("string");
  });

  // A constraints callback that never touches `q` or `data` short-circuits to a
  // flat boolean, resolved before any document is needed — the only shape of
  // "constraints" check that CAN work on `create` today (see the bug tests below
  // for the shapes that cannot).
  test("a constraints callback short-circuiting to a boolean gates on the caller alone", async () => {
    const t = convexTest(schema, modules);
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
              create: {
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

    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        collection: "posts",
        config,
        auth: { user: { _id: "u1", roles: ["contributor"] } },
        data: { title: "Mine", slug: "mine" },
      }),
    );
    expect(typeof id).toBe("string");

    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        create({
          ctx,
          collection: "posts",
          config,
          auth: { user: { _id: "u2", roles: ["contributor"] } },
          data: { title: "Not mine", slug: "not-mine" },
        }),
      ),
    ).rejects.toThrow(VexAccessError);
  });

  test("an organization-scoped rule denies a caller with no organization", async () => {
    const t = convexTest(schema, modules);
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
              create: (props) => {
                if (!("organization" in props)) return false;
                const organization = props.organization as { _id?: string } | undefined;
                return organization?._id === "org1";
              },
            },
          },
        },
      }),
    } as unknown as VexConfig;

    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        collection: "posts",
        config,
        auth: { user: { roles: ["member"] }, organization: { _id: "org1" } },
        data: { title: "In org", slug: "in-org" },
      }),
    );
    expect(typeof id).toBe("string");

    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        create({
          ctx,
          collection: "posts",
          config,
          // No `organization` on the auth — the rule reads it and gets `undefined`.
          auth: { user: { roles: ["member"] } },
          data: { title: "No org", slug: "no-org" },
        }),
      ),
    ).rejects.toThrow(VexAccessError);
  });

  test("an unauthenticated caller (no auth at all) fails closed", async () => {
    const t = convexTest(schema, modules);
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["anyone"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          anyone: { posts: true },
        },
      }),
    } as unknown as VexConfig;

    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        create({ ctx, collection: "posts", config, data: { title: "Nope", slug: "nope" } }),
      ),
    ).rejects.toThrow(VexAccessError);
  });

  test("a caller with `user: null` fails closed the same as no auth", async () => {
    const t = convexTest(schema, modules);
    const config = {
      ...fixtureConfig,
      access: defineAccess({
        roles: ["anyone"] as const,
        resources: [postsResource],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          anyone: { posts: true },
        },
      }),
    } as unknown as VexConfig;

    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        create({
          ctx,
          collection: "posts",
          config,
          auth: { user: null },
          data: { title: "Nope", slug: "nope" },
        }),
      ),
    ).rejects.toThrow(VexAccessError);
  });
});

// ── Regression pin (DD 44) ───────────────────────────────────────────────────
// `create()` (./server.ts) never forwards the submitted payload to
// `hasPermission` — no `data:` key is passed at all. A rule that reads `data`
// is therefore always resolved via the no-document capability probe, and under
// the default `scope: "all"` that always resolves to denied, regardless of
// what the payload contains. This contradicts the documented contract: both
// `access/types.test.ts` ("still accepts a bare callback on create") and
// `.agent/docs/specs/2026-08-25-access-constraint-builder/spec.md` show
// `create: ({ data }) => ... "authorId" in data` as a valid, intended rule
// shape. These tests assert the DOCUMENTED behaviour and are expected to fail
// until `create()` passes `data: args.data` to `hasPermission`.
describe("create (server) — payload-dependent rules (documented contract, currently unreachable)", () => {
  test("a callback reading `data` should be able to allow create based on the submitted payload", async () => {
    const t = convexTest(schema, modules);
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
              // Ownership-on-create: the payload names its own owner as the
              // caller, mirroring the spec's own `"authorId" in data` example.
              create: (props) => {
                const data = props.data as { slug?: string } | undefined;
                const user = props.user as { _id?: string };
                return data?.slug === user._id;
              },
            },
          },
        },
      }),
    } as unknown as VexConfig;

    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        collection: "posts",
        config,
        auth: { user: { _id: "u1", roles: ["contributor"] } },
        // The payload satisfies the rule: slug === caller's id.
        data: { title: "Mine", slug: "u1" },
      }),
    );
    expect(typeof id).toBe("string");
  });

  test("a constraints check narrowing by payload content should be able to allow create", async () => {
    const t = convexTest(schema, modules);
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
              create: { constraints: ({ q }) => q.filter((f) => f.eq("slug", "allowed-slug")) },
            },
          },
        },
      }),
    } as unknown as VexConfig;

    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        collection: "posts",
        config,
        auth: { user: { roles: ["contributor"] } },
        data: { title: "Allowed", slug: "allowed-slug" },
      }),
    );
    expect(typeof id).toBe("string");
  });
});
