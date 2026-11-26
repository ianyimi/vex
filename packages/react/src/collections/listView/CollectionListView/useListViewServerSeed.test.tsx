import { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import type { ConvexReactClient } from "convex/react";
import { number, type CollectionConfig } from "@vexcms/core";

import { createFakeConvexClient } from "../../../testing/convex/bridge";
import schema, { seedDocuments, testModules } from "../../../testing/convex/schema";
import { useListViewServerSeed } from "./useListViewServerSeed";

/**
 * Wires a fresh `convex-test` instance through the real `ConvexQueryClient` +
 * `QueryClient` pair, `queryKeyHashFn` included — byte-for-byte
 * `hooksSuite.tsx`'s own `buildQueryClient` (not imported: that helper is
 * file-local there), since `useListViewServerSeed`'s seed-release effect
 * (the bug this file regression-tests) only fires once the seed
 * `useSuspenseQuery` actually resolves against a real cache.
 */
function buildQueryClient(t: Parameters<typeof createFakeConvexClient>[0]) {
  const fakeClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(fakeClient);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { queryFn: convexQueryClient.queryFn(), queryKeyHashFn: convexQueryClient.hashFn(), retry: false },
    },
  });
  convexQueryClient.connect(queryClient);
  return queryClient;
}

function makeDocumentsCollection(): CollectionConfig {
  return {
    slug: "documents",
    fields: {
      title: { searchIndex: { name: "search_title", filterFields: [] } },
      viewCount: number({ schema: { validator: "int64" } }),
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
  } as unknown as CollectionConfig;
}

function Probe() {
  const pagination = useListViewServerSeed({
    collection: makeDocumentsCollection(),
    drafts: undefined,
    isSearchActive: false,
    where: { field: "viewCount", op: "gte", value: 9_007_199_254_740_992n },
    sort: { field: "_creationTime", order: "desc" },
    search: "",
    searchField: undefined,
    pageSize: 10,
  });
  return <div data-testid="result-count">{pagination.results.length}</div>;
}

describe("useListViewServerSeed", () => {
  it("never throws releasing the seed subscription for an int64 bigint where filter (TanStack's own queryKeyHashFn falls back to the unsafe default hashKey for the synthetic 'vex-seed-released' key)", async () => {
    const t = convexTest(schema, testModules);
    await seedDocuments(t, 2);
    const queryClient = buildQueryClient(t);

    render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>loading</div>}>
          <Probe />
        </Suspense>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("result-count")).toBeInTheDocument());
    expect(screen.getByTestId("result-count")).toHaveTextContent("0");
  });
});
