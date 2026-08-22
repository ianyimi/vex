import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import type { VexConfig } from "../../config";
import { update } from "./server";


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
