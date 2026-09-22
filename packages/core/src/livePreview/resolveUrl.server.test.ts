import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import { VexAccessError } from "../access";
import { defineAccess } from "../access/config";
import type { VexConfig } from "../config";
import * as _generatedApi from "../api/test/convex/_generated/api";
import schema from "../api/test/convex/schema";
import { resolveLivePreviewUrlOnServer } from "./resolveUrl.server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const DEFAULT_LIVE_PREVIEW: VexConfig["admin"]["livePreview"] = {
  allowedOrigins: [],
  breakpoints: [],
  collections: {},
  globals: {},
};

function makeConfig(props: {
  url?: unknown;
  access?: VexConfig["access"];
}): VexConfig {
  return {
    collections: [
      {
        slug: "posts",
        fields: { title: { type: "text" } },
        labels: { singular: "Post", plural: "Posts" },
        admin: { useAsTitle: "title", livePreview: props.url ? { url: props.url } : undefined },
      },
    ],
    globals: [],
    admin: { livePreview: DEFAULT_LIVE_PREVIEW },
    access: props.access,
  } as unknown as VexConfig;
}

describe("resolveLivePreviewUrlOnServer", () => {
  test("merges unsaved values over the saved document before resolving", async () => {
    const t = convexTest(schema, modules);
    const url = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Saved", slug: "saved" });
      return resolveLivePreviewUrlOnServer({
        ctx,
        config: makeConfig({
          server: true,
          url: { server: ({ doc }: { doc: Record<string, unknown> }) => `/${String(doc.slug)}` },
        } as never),
        kind: "collection",
        slug: "posts",
        documentId: id,
        values: { slug: "unsaved" },
      });
    });
    // The point of running server-side at all: the URL reflects what the editor
    // has typed, not what is stored.
    expect(url).toBe("/unsaved");
  });

  test("reads the database through ctx", async () => {
    const t = convexTest(schema, modules);
    const url = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Other", slug: "other" });
      const id = await ctx.db.insert("posts", { title: "Current", slug: "current" });
      return resolveLivePreviewUrlOnServer({
        ctx,
        config: makeConfig({
          url: {
            server: async (props: { ctx: GenericMutationCtx<GenericDataModel> }) => {
              const [first] = await props.ctx.db.query("posts").take(1);
              return `/${String((first as { slug?: string } | undefined)?.slug)}`;
            },
          },
        } as never),
        kind: "collection",
        slug: "posts",
        documentId: id,
        values: {},
      });
    });
    expect(url).toBe("/other");
  });

  test("returns undefined for the string and client-resolver forms", async () => {
    const t = convexTest(schema, modules);
    const results = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "T", slug: "t" });
      // Mapped to a sentinel: `t.run` serialises its return value as a Convex
      // value, and `undefined` is not one.
      const asSentinel = (value: string | undefined) => value ?? "none";
      return [
        asSentinel(
          await resolveLivePreviewUrlOnServer({
          ctx,
          config: makeConfig({ url: "/static" }),
          kind: "collection",
          slug: "posts",
          documentId: id,
          values: {},
          }),
        ),
        asSentinel(
          await resolveLivePreviewUrlOnServer({
          ctx,
          config: makeConfig({ url: (doc: { slug?: string }) => `/${doc.slug}` }),
            kind: "collection",
            slug: "posts",
            documentId: id,
            values: {},
          }),
        ),
      ];
    });
    // Those two resolve in the browser; answering here would mean a pointless
    // round trip on every keystroke.
    expect(results).toEqual(["none", "none"]);
  });

  test("refuses a caller without read permission on the collection", async () => {
    const t = convexTest(schema, modules);
    const access = defineAccess({
      roles: ["denied"] as const,
      resources: [{ slug: "posts" }] as never,
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: { denied: { posts: {} } } as never,
    });
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
        const id = await ctx.db.insert("posts", { title: "Secret", slug: "secret" });
        return resolveLivePreviewUrlOnServer({
          ctx,
          config: makeConfig({
            access: access as never,
            url: { server: ({ doc }: { doc: Record<string, unknown> }) => `/${String(doc.slug)}` },
          }),
          auth: { user: { _id: "u1", roles: "denied" } } as never,
          kind: "collection",
          slug: "posts",
          documentId: id,
          values: {},
        });
      }),
      // Otherwise this endpoint is a read oracle: the caller controls `values`,
      // the resolver can read anything, and the URL can encode what it read.
    ).rejects.toBeInstanceOf(VexAccessError);
  });
});
