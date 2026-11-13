import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import type { ConvexReactClient } from "convex/react";
import type { CollectionConfig } from "@vexcms/core";
import { createFakeConvexClient } from "../testing/convex/bridge";
import schema, { seedDocuments, testModules } from "../testing/convex/schema";
import { usePaginatedQuery } from "./usePaginatedQuery";
import { usePaginatedSearch } from "./usePaginatedSearch";
import { useVexListQuery } from "./useVexListQuery";

/**
 * Regression coverage for the CI flake (run 43362565546,
 * `useSavedListViews.loadMoreParity.test.tsx:113`): `isPending` used to come
 * straight off TanStack's own raw fetch status, which flips `false` the
 * instant `data` resolves — one render BEFORE the hook's own `useEffect` had
 * actually committed that page into `results`/`documents`. Passed 5/5 on a
 * fast local machine (the two state updates landed in the same commit) but
 * failed reliably on a slower release runner, where that one-render gap was
 * wide enough for `waitFor` to observe it: `isPending: false` with an empty
 * array, even though the seeded collection has rows.
 *
 * Every render this suite's `renderHook` wrapper produces is logged (not
 * just the settled one `waitFor` eventually lands on) and checked against the
 * exact invariant the fix (`usePaginatedQuery.ts`/`useVexListQuery.ts`'s
 * `resolvedIsPending`, `usePaginatedSearch.ts`'s `settledResetKey`-gated
 * `isPending`) establishes: `isPending: false` is only ever reported once the
 * returned rows actually reflect that fact.
 */

function buildQueryClient(t: Parameters<typeof createFakeConvexClient>[0]): QueryClient {
  const fakeClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(fakeClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);
  return queryClient;
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper(props: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
  };
}

function makeDocumentsCollection(): CollectionConfig {
  return {
    slug: "documents",
    fields: {
      title: { searchIndex: { name: "search_title", filterFields: [] } },
    },
    labels: { singular: "Document", plural: "Documents" },
    admin: {
      useAsTitle: "title",
      components: {},
      view: {
        viewId: "default",
        name: "All",
        state: {
          sort: { field: "_creationTime", order: "desc" },
          columns: [],
          pageSize: 10,
          serverPageSize: 100,
          pageSizeOptions: [10, 25, 50, 100],
          bulkActions: { delete: true },
        },
      },
      views: [],
    },
    meta: {},
  } as unknown as CollectionConfig;
}

/** A captured render's `{ isPending, rowCount }` pair, logged by the probe hooks below. */
interface RenderLogEntry {
  isPending: boolean;
  rowCount: number;
}

/**
 * Asserts the exact invariant this whole file exists to prove: once the
 * underlying data set is non-empty, no logged render ever reports
 * `isPending: false` alongside zero rows — the commit-order race the bug
 * report traced (TanStack's own `isPending` resolving one render before the
 * hook's sync effect writes the page into `results`/`documents`).
 */
function expectNoFalsePendingWithEmptyRows(renders: RenderLogEntry[]): void {
  const violation = renders.find((entry) => !entry.isPending && entry.rowCount === 0);
  expect(violation).toBeUndefined();
}

describe("isPending never reads false while results/documents are still empty mid-commit", () => {
  it("usePaginatedQuery (find mode): every render honors the invariant across mount and Load More", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 5);
    const queryClient = buildQueryClient(t);

    const renders: RenderLogEntry[] = [];
    const { result } = renderHook(
      () => {
        const r = usePaginatedQuery({
          query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
        });
        renders.push({ isPending: r.isPending, rowCount: r.results.length });
        return r;
      },
      { wrapper: makeWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.results.length).toBe(2);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.results.length).toBe(4));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isDone).toBe(true));

    expectNoFalsePendingWithEmptyRows(renders);
  });

  it("usePaginatedSearch: every render honors the invariant across mount and a debounced query change", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 5);
    const queryClient = buildQueryClient(t);
    const collection = makeDocumentsCollection();

    const renders: RenderLogEntry[] = [];
    const { result, rerender } = renderHook(
      (props: { query: string }) => {
        const r = usePaginatedSearch({ collection, query: props.query, pageSize: 10 });
        renders.push({ isPending: r.isPending, rowCount: r.documents.length });
        return r;
      },
      { wrapper: makeWrapper(queryClient), initialProps: { query: "" } },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.documents.length).toBe(5);

    // A debounced query change rotates `resetKey` — `usePaginatedSearch` has no
    // `keepPreviousData`/"keep previous rows" treatment at all, so `documents` is wiped to
    // `[]` synchronously on this same render; the race this test guards against is whether a
    // LATER render reports `isPending: false` again before the new page actually lands.
    rerender({ query: "Doc 2" });
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expectNoFalsePendingWithEmptyRows(renders);
  });

  it("useVexListQuery (find mode, the exact consumer shape from the CI flake): every render honors the invariant", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 15);
    const queryClient = buildQueryClient(t);
    const collection = makeDocumentsCollection();

    const renders: RenderLogEntry[] = [];
    const { result } = renderHook(
      () => {
        const r = useVexListQuery({ collection, pageSize: 10, depth: 1 });
        renders.push({ isPending: r.isPending, rowCount: r.results.length });
        return r;
      },
      { wrapper: makeWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.results.length).toBe(10);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.isDone).toBe(true));

    expectNoFalsePendingWithEmptyRows(renders);
  });
});
