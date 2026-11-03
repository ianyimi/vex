import { createElement, type ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { checkbox, defineCollection, text } from "@vexcms/core";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";
import { VexConfigProvider } from "../../../config/VexConfigContext";
import { CollectionListView } from "./index";
import { saveLocalSavedListView } from "../savedListViews/localSavedListViewsStore";

// Same lightweight mocking as `CollectionListView.serverParity.test.tsx` — no real Convex
// backend needed. `useSuspenseQuery` is deliberately NOT mocked (unlike `useQuery` below) —
// unlike `useQuery`, which a mocked, plain-object return satisfies fine, something downstream
// of a mocked `useSuspenseQuery` (investigated 2026-10-31: a hang with zero CPU, reproducible
// in isolation, ruled out `QueryErrorBoundary`/the vite cache/a missing `testing/convex/
// bridge.ts` fake handler as the cause) needs the REAL hook's integration with React Query's
// own cache/Suspense machinery — a mocked, non-integrated return value hung indefinitely
// somewhere inside `CollectionListViewData`'s own `<Suspense>` boundary. `convexQuery`'s
// mock instead resolves a REAL (if fake) `queryFn` synchronously-fast, so the REAL
// `useSuspenseQuery` never actually suspends in practice — same approach
// `serverParity.test.tsx` already uses successfully.
const project = "https://example.convex.cloud";

vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactModule>();
  return { ...actual, useConvex: () => ({ url: project }) };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    convexQuery: (fn: unknown, args: unknown) => ({
      queryKey: [fn, args],
      // `CollectionListViewData`'s own single `useSuspenseQuery` seed call (Step 14's perf
      // split) needs a resolvable, non-`undefined` `PaginationResult` — a `{ numItems }` key
      // (present on every `buildListViewFindQueryArgs`/`buildListViewSearchQueryArgs` call, absent
      // from `listViews`' own bare `{ collection }` args) distinguishes the two without
      // referencing `vexConvexApi` directly. A NON-empty `page` (not `isDone`) also avoids
      // `DataTable`'s own empty-state branch, which would otherwise render instead of the
      // real `<thead>` this test asserts against. `SavedListViewTabs.tsx`'s own `listViews`
      // query (via `useSavedListViews`'s plain `useQuery`) gets `[]` (no shared views) either way.
      queryFn: () => {
        const hasNumItems = typeof args === "object" && args !== null && "numItems" in args;
        return Promise.resolve(
          hasNumItems
            ? {
                page: [{ _id: "doc1", _creationTime: 1, title: "Row", slug: "row", featured: false }],
                continueCursor: "",
                isDone: false,
              }
            : [],
        );
      },
    }),
    useConvexMutation: () => async () => {},
  };
});

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackQueryModule>();
  return {
    ...actual,
    useQuery: (options: { initialData?: unknown }) => ({
      data: options?.initialData,
      isPending: options?.initialData === undefined,
      isFetching: false,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: () => {},
    }),
    useMutation: () => ({ mutateAsync: async () => {}, isPending: false }),
  };
});

// `enableHiding: true` (unlike most fixtures in this package, which leave it
// at its per-field-type default of `false`) — needed so narrowing `columns`
// actually hides a header, not just changes the diff's internal bookkeeping.
const collection = defineCollection({
  slug: "colsync_posts",
  fields: {
    title: text({ searchIndex: { name: "search_title", filterFields: [] }, admin: { enableHiding: true } }),
    slug: text({ searchIndex: { name: "search_slug", filterFields: [] }, admin: { enableHiding: true } }),
    featured: checkbox({ admin: { enableHiding: true } }),
  },
  admin: {
    view: { searchFields: ["title", "slug"], pageSizeOptions: [5, 10, 25, 50, 100], serverPageSize: 3, pageSize: 10 },
  },
});

const testConfig = { collections: [collection] } as unknown as Parameters<typeof VexConfigProvider>[0]["config"];

function wrapper(searchParams: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient();
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(NuqsTestingAdapter, {
        searchParams,
        children: createElement(VexConfigProvider, { config: testConfig, children }),
      }),
    );
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

// Developer-reported bug: a `local` view's cookie-index placeholder
// (`initialLocalIndex`, Decision 41) has no `columns` — `CollectionListView`
// used to seed `visibleColumns` from it anyway during a render-phase
// `setState`, lock in `syncedViewIdRef` on that same render, and never
// re-sync once the REAL local view (with its genuinely narrower `columns`)
// loaded a render later — permanently showing "Modified: columns" with the
// WRONG (full default) columns rendered, Reset included (same stuck value).
// Fixed: the sync now lives in a `useEffect`, gated on the view not being a
// still-unresolved local placeholder.
describe("CollectionListView — local-view placeholder columns sync (developer-reported)", () => {
  it("never shows a false Modified: columns once the real local view data arrives after the placeholder", async () => {
    render(
      createElement(CollectionListView, {
        collection: "colsync_posts",
        initialLocalIndex: [{ viewId: "loc1", name: "Narrow" }],
      }),
      { wrapper: wrapper("?view=local:loc1") },
    );

    // Placeholder phase: `loc1`'s real columns aren't in localStorage yet —
    // the full column set renders, never a false "Modified" for it.
    expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "featured" })).toBeInTheDocument();

    // The real local view "arrives" (simulates the `localStorage` hydration
    // commit landing a render after the SSR-matching placeholder one).
    act(() => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "colsync_posts",
        view: { viewId: "loc1", name: "Narrow", state: { columns: ["title"] } },
      });
    });

    // Settles to the view's real (narrow) columns, with no "Modified" flash
    // along the way — `featured`'s header actually disappears, proving
    // `visibleColumns` (not just the diff) re-synced correctly.
    await waitFor(() => expect(screen.queryByRole("columnheader", { name: "featured" })).not.toBeInTheDocument());
    expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();
  });
});
