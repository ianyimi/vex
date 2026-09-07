import type { FunctionReference } from "convex/server";
import { describe, expect, test, vi } from "vitest";

import type { VexServerClient } from "../cache/types";
import { vexStaticParams } from "./vexStaticParams";

type Item = { slug: string };

// Typed return so `ArrayItem<FunctionReturnType<Query>>` resolves to `Item`
// rather than `unknown` — otherwise the `getSlug` callbacks below cannot be
// annotated and `tsc` rejects the test even though vitest runs it.
const fakeQuery = {} as unknown as FunctionReference<
  "query",
  "public",
  Record<string, never>,
  Item[]
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

describe("vexStaticParams", () => {
  test("maps published items to route params", async () => {
    const client = fakeClient(vi.fn().mockResolvedValue([{ slug: "about" }, { slug: "pricing" }]));

    const params = await vexStaticParams({
      client,
      getSlug: (item: Item) => item.slug,
      paramName: "slug",
      query: fakeQuery,
    });

    expect(params).toEqual([{ slug: "about" }, { slug: "pricing" }]);
  });

  test("returns [] when Convex is unreachable", async () => {
    // P-020: CI builds with placeholder env, so this path runs on every CI
    // build. Throwing here would fail the build instead of skipping prerender.
    const client = fakeClient(vi.fn().mockRejectedValue(new Error("fetch failed")));

    const params = await vexStaticParams({
      client,
      getSlug: (item: Item) => item.slug,
      paramName: "slug",
      query: fakeQuery,
    });

    expect(params).toEqual([]);
  });

  test("returns [] for an empty collection without treating it as an error", async () => {
    const client = fakeClient(vi.fn().mockResolvedValue([]));

    const params = await vexStaticParams({
      client,
      getSlug: (item: Item) => item.slug,
      paramName: "slug",
      query: fakeQuery,
    });

    expect(params).toEqual([]);
  });

  test("honours paramName so nested routes can use their own segment", async () => {
    const client = fakeClient(vi.fn().mockResolvedValue([{ slug: "hello" }]));

    const params = await vexStaticParams({
      client,
      getSlug: (item: Item) => item.slug,
      paramName: "postSlug",
      query: fakeQuery,
    });

    expect(params).toEqual([{ postSlug: "hello" }]);
  });
});
