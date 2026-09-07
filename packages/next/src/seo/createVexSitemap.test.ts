import type { FunctionReference } from "convex/server";
import { describe, expect, test, vi } from "vitest";

import type { VexServerClient } from "../cache/types";
import { createVexSitemap } from "./createVexSitemap";

type Entry = { createdAt: number; slug: string; updatedAt?: number };

// Typed return so `ArrayItem<FunctionReturnType<Query>>` resolves to `Entry`.
const fakeQuery = {} as unknown as FunctionReference<
  "query",
  "public",
  Record<string, never>,
  Entry[]
>;

/**
 * Builds a minimal {@link VexServerClient} around one query implementation.
 *
 * @param query - The stub `query` implementation.
 * @returns A client exposing only that `query`.
 */
function fakeClient(query: VexServerClient["query"]): VexServerClient {
  return { query };
}

describe("createVexSitemap", () => {
  test("omits lastModified when getUpdatedAt is not supplied", async () => {
    // The default for vexcms collections: no field tracks modification time,
    // and `_creationTime` never moves, so reporting it would mislead crawlers.
    const client = fakeClient(
      vi.fn().mockResolvedValue([{ createdAt: 1_600_000_000_000, slug: "about" }]),
    );
    const sitemap = createVexSitemap({
      client,
      getSlug: (item: Entry) => item.slug,
      query: fakeQuery,
      toUrl: (slug) => `https://example.com/${slug}`,
    });

    expect(await sitemap()).toEqual([{ url: "https://example.com/about" }]);
  });

  test("emits lastModified when getUpdatedAt is supplied", async () => {
    const client = fakeClient(
      vi
        .fn()
        .mockResolvedValue([
          { createdAt: 1_600_000_000_000, slug: "about", updatedAt: 1_700_000_000_000 },
        ]),
    );
    const sitemap = createVexSitemap({
      client,
      getSlug: (item: Entry) => item.slug,
      getUpdatedAt: (item: Entry) => item.updatedAt ?? item.createdAt,
      query: fakeQuery,
      toUrl: (slug) => `https://example.com/${slug}`,
    });

    expect(await sitemap()).toEqual([
      { lastModified: new Date(1_700_000_000_000), url: "https://example.com/about" },
    ]);
  });

  test("returns [] when Convex is unreachable", async () => {
    const client = fakeClient(vi.fn().mockRejectedValue(new Error("fetch failed")));
    const sitemap = createVexSitemap({
      client,
      getSlug: (item: Entry) => item.slug,
      query: fakeQuery,
      toUrl: (slug) => `https://example.com/${slug}`,
    });

    expect(await sitemap()).toEqual([]);
  });

  test("toUrl owns the URL shape, so nested routes work", async () => {
    const client = fakeClient(
      vi.fn().mockResolvedValue([{ createdAt: 1_600_000_000_000, slug: "hello" }]),
    );
    const sitemap = createVexSitemap({
      client,
      getSlug: (item: Entry) => item.slug,
      query: fakeQuery,
      toUrl: (slug) => `https://example.com/blog/${slug}`,
    });

    expect(await sitemap()).toEqual([{ url: "https://example.com/blog/hello" }]);
  });

  test("omits lastModified for an item whose updatedAt is undefined", async () => {
    // The common case once `defineCollection` injects `updatedAt`: the column
    // exists, but a seeded or imported row was never written through the API.
    const client = {
      query: vi.fn().mockResolvedValue([
        { slug: "written", updatedAt: 1_700_000_000_000 },
        { slug: "seeded", updatedAt: undefined },
      ]),
    } as unknown as VexServerClient;
    const sitemap = createVexSitemap({
      client,
      getSlug: (item) => item.slug,
      getUpdatedAt: (item) => item.updatedAt,
      query: fakeQuery,
      toUrl: (slug) => `https://example.com/${slug}`,
    });

    const entries = await sitemap();
    expect(entries).toEqual([
      { lastModified: new Date(1_700_000_000_000), url: "https://example.com/written" },
      { url: "https://example.com/seeded" },
    ]);
    // Never an Invalid Date, which serializes to an unparseable <lastmod>.
    expect(entries.every((e) => e.lastModified === undefined || !isNaN(+e.lastModified))).toBe(true);
  });
});
