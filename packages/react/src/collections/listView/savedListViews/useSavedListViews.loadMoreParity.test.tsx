import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import type { ConvexReactClient } from "convex/react";
import type { CollectionConfig } from "@vexcms/core";
import { createFakeConvexClient } from "../../../testing/convex/bridge";
import schema, { seedDocuments, testModules } from "../../../testing/convex/schema";
import { useVexListQuery } from "../../../hooks/useVexListQuery";
import { resolveEffectiveViewState, type SavedListViewEntry } from "./useSavedListViews";

/**
 * Reproduces a developer-reported regression report ("Load More no longer
 * appends rows") that, on investigation (live instrumentation of
 * `usePaginatedQuery`'s own internal reset-key/clientPageIndex state), was
 * NOT a real regression — `resolveEffectiveViewState`'s output is a FRESH
 * object reference every call, but `usePaginatedQuery`'s `resetKey` is
 * `JSON.stringify`-based (content-equal), so a new reference with the SAME
 * values never trips a reset. This test pins that property permanently: a
 * test hook rebuilds `resolveEffectiveViewState`'s result FRESH on every
 * render (mirroring `CollectionListView`'s real per-render call), feeding
 * `useVexListQuery` — exactly the shape Main's bug report named as the
 * suspect — and confirms `loadMore()` still grows `results` across pages,
 * both with no active view and with one.
 */
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

/**
 * Mirrors `CollectionListView`'s real per-render call shape: resolves
 * `resolveEffectiveViewState` fresh (a brand-new object every render — NOT
 * memoized, exactly like the real component), then feeds the result
 * straight into `useVexListQuery`. `activeView` is a stable prop here (no
 * view switches mid-test), but the RESOLVED object it produces still
 * churns reference identity every render, same as production.
 */
function useTestListQuery(props: { collection: CollectionConfig; activeView: SavedListViewEntry | undefined }) {
  const effective = resolveEffectiveViewState({
    collection: props.collection,
    q: "",
    qf: undefined,
    sort: undefined,
    filter: undefined,
    size: undefined,
    activeView: props.activeView,
  });
  return useVexListQuery({
    collection: props.collection,
    where: effective.where,
    sort: effective.sort,
    search: effective.search,
    searchField: effective.searchField,
    pageSize: effective.pageSize ?? props.collection.admin.view.state.pageSize,
    depth: 1,
  });
}

describe("Load More — resolveEffectiveViewState object-churn parity", () => {
  it("appends rows across pages with no active view, even though resolveEffectiveViewState rebuilds its result every render", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 15);
    const queryClient = buildQueryClient(t);
    const collection = makeDocumentsCollection();

    const { result } = renderHook(() => useTestListQuery({ collection, activeView: undefined }), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.results).toHaveLength(10);
    expect(result.current.isDone).toBe(false);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.results).toHaveLength(15));
    expect(result.current.isDone).toBe(true);
  });

  it("appends rows across pages with an active view carrying its own saved sort/pageSize", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 15);
    const queryClient = buildQueryClient(t);
    const collection = makeDocumentsCollection();
    const activeView: SavedListViewEntry = {
      viewId: "v1",
      name: "Saved",
      source: "shared",
      where: undefined,
      sort: { field: "_creationTime", order: "desc" },
      columns: [],
      pageSize: 5,
      hasHiddenFilter: false,
      hiddenFilterCount: 0,
    };

    const { result } = renderHook(() => useTestListQuery({ collection, activeView }), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.results).toHaveLength(5);
    expect(result.current.isDone).toBe(false);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.results).toHaveLength(10));
    expect(result.current.isDone).toBe(false);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.results).toHaveLength(15));
    expect(result.current.isDone).toBe(true);
  });
});
