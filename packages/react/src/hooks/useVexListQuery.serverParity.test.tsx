import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildListViewFindQueryArgs, buildListViewSearchQueryArgs, defineCollection, text } from "@vexcms/core";
import { useVexListQuery } from "./useVexListQuery";

const convexQueryCalls: unknown[] = [];

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (fn: unknown, args: unknown) => {
    convexQueryCalls.push(args);
    return { queryKey: [fn, args], queryFn: () => Promise.resolve(undefined) };
  },
}));

const collection = defineCollection({
  slug: "posts",
  fields: { title: text({ searchIndex: { name: "search_title", filterFields: [] } }) },
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  convexQueryCalls.length = 0;
});

// `NextAdminPage` and this hook must send IDENTICAL Convex args for
// the same list state, or the server's prefetched `initialData` hydrates under the wrong
// query key and the list repaints right after hydration (layout-stability.md). Both now
// go through `buildListViewFindQueryArgs`/`buildListViewSearchQueryArgs` — these tests prove this
// hook's real wiring produces exactly what those functions do, so the two can't drift.
describe("useVexListQuery — server parity (layout-stability.md)", () => {
  it("find-mode sends the exact args buildListViewFindQueryArgs produces for the same props", () => {
    const where = { field: "title", op: "eq", value: "x" } as const;
    const sort = { field: "title", order: "asc" } as const;
    renderHook(() => useVexListQuery({ collection, where, sort, drafts: true, depth: 1, pageSize: 25 }), {
      wrapper,
    });

    const expected = buildListViewFindQueryArgs({ collection, where, sort, drafts: true, depth: 1, numItems: 100 });
    expect(convexQueryCalls).toContainEqual(expected);
  });

  it("search-mode sends the exact args buildListViewSearchQueryArgs produces for the same props", () => {
    renderHook(() => useVexListQuery({ collection, search: "hello", searchField: "title", pageSize: 25 }), {
      wrapper,
    });

    const expected = buildListViewSearchQueryArgs({ collection, search: "hello", searchField: "title", numItems: 100 });
    expect(convexQueryCalls).toContainEqual(expected);
  });
});
