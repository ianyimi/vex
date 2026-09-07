import type { FunctionReference } from "convex/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const queryImpl = vi.fn(async () => ({ title: "Home" }));

// A class, not `vi.fn()`: the module under test calls `new ConvexHttpClient(...)`,
// and a bare mock function is not constructible here. The method delegates to
// `queryImpl` so call counts stay assertable.
vi.mock("convex/browser", () => ({
  ConvexHttpClient: class FakeConvexHttpClient {
    async query(...args: unknown[]): Promise<unknown> {
      return queryImpl(...(args as []));
    }
  },
}));

// Next's bundler resolves `react`'s `cache` to the real `react-server`
// memoizing implementation. The plain `react` package vitest resolves under
// Node ships a no-op passthrough, so this substitutes a real memoizer to
// exercise the dedupe-key logic (query reference + args) in isolation from that
// runtime difference.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    cache: (fn: (...args: unknown[]) => unknown) => {
      const memo = new Map<string, unknown>();
      return (...args: unknown[]) => {
        const key = JSON.stringify(args);
        if (!memo.has(key)) {
          memo.set(key, fn(...args));
        }
        return memo.get(key);
      };
    },
  };
});

// Dynamic import on purpose: `vi.mock` is hoisted, and the module under test
// captures `cache` at evaluation time. A static import would bind the real
// `react` before the mock is installed.
const { createVexServerClient } = await import("./createVexServerClient");

const fakeQuery = { _type: "query" } as unknown as FunctionReference<"query">;
const otherQuery = { _type: "other" } as unknown as FunctionReference<"query">;

describe("createVexServerClient", () => {
  beforeEach(() => {
    queryImpl.mockClear();
  });

  test("dedupes two identical reads into one Convex call", async () => {
    const client = createVexServerClient({ url: "https://example.convex.cloud" });

    const [first, second] = await Promise.all([
      client.query(fakeQuery, { slug: "home" }),
      client.query(fakeQuery, { slug: "home" }),
    ]);

    expect(first).toEqual({ title: "Home" });
    expect(second).toEqual({ title: "Home" });
    expect(queryImpl).toHaveBeenCalledTimes(1);
  });

  test("does not dedupe reads with different arguments", async () => {
    const client = createVexServerClient({ url: "https://example.convex.cloud" });

    await client.query(fakeQuery, { slug: "home" });
    await client.query(fakeQuery, { slug: "about" });

    expect(queryImpl).toHaveBeenCalledTimes(2);
  });

  test("does not dedupe different queries sharing the same arguments", async () => {
    const client = createVexServerClient({ url: "https://example.convex.cloud" });

    await client.query(fakeQuery, { slug: "home" });
    await client.query(otherQuery, { slug: "home" });

    expect(queryImpl).toHaveBeenCalledTimes(2);
  });

  test("two separate clients do NOT share a cache", async () => {
    // This is why each app exports one shared `vex` from `src/lib/vex.ts`:
    // `React.cache` is created per `createVexServerClient()` call, so a
    // per-file client silently costs a second round trip.
    const a = createVexServerClient({ url: "https://example.convex.cloud" });
    const b = createVexServerClient({ url: "https://example.convex.cloud" });

    await a.query(fakeQuery, { slug: "home" });
    await b.query(fakeQuery, { slug: "home" });

    expect(queryImpl).toHaveBeenCalledTimes(2);
  });

  test("throws a named error when no deployment url is resolvable", () => {
    const previous = process.env.NEXT_PUBLIC_CONVEX_URL;
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    try {
      expect(() => createVexServerClient()).toThrow(/NEXT_PUBLIC_CONVEX_URL/);
    } finally {
      if (previous !== undefined) process.env.NEXT_PUBLIC_CONVEX_URL = previous;
    }
  });
});
