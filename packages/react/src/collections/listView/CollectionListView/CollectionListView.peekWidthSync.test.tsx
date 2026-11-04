import { createElement, type ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineCollection, text, vexConvexApi, type VexStoredView } from "@vexcms/core";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import type * as TanstackQueryModule from "@tanstack/react-query";
import { VexConfigProvider } from "../../../config/VexConfigContext";
import { CollectionListView } from "./index";
import { saveLocalSavedListView } from "../savedListViews/localSavedListViewsStore";

// Same lightweight mocking as `CollectionListView.columnsSync.test.tsx`/`serverParity.test.tsx`
// — no real Convex backend needed. `useQuery`'s mock additionally recognizes
// `useSavedListViews`' own `sharedQuery` by its query key (`vexConvexApi.listViews`, the SAME
// split `serverParity.test.tsx` uses) and seeds it with `sharedViewFixture` below, which
// carries its OWN `peekWidth` — distinct from `initialPreferences.peekWidth` each test
// passes, simulating a browser whose `vex-admin:<collection>` cookie remembers a DIFFERENT
// width from browsing other views in the same collection.
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
      queryFn: () => {
        const hasNumItems = typeof args === "object" && args !== null && "numItems" in args;
        return Promise.resolve(
          hasNumItems
            ? { page: [{ _id: "doc1", _creationTime: 1, title: "Row", slug: "row" }], continueCursor: "", isDone: true }
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
    useQuery: (options: { queryKey?: unknown[]; initialData?: unknown }) => {
      const data =
        Array.isArray(options?.queryKey) && options.queryKey[0] === vexConvexApi.listViews
          ? [sharedViewFixture]
          : options?.initialData;
      return {
        data,
        isPending: data === undefined,
        isFetching: false,
        isLoading: false,
        isError: false,
        error: undefined,
        refetch: () => {},
      };
    },
    useMutation: () => ({ mutateAsync: async () => {}, isPending: false }),
  };
});

const collection = defineCollection({
  slug: "peeksync_posts",
  fields: {
    title: text({ searchIndex: { name: "search_title", filterFields: [] } }),
    slug: text({ searchIndex: { name: "search_slug", filterFields: [] } }),
  },
  admin: {
    view: { searchFields: ["title", "slug"], pageSizeOptions: [5, 10, 25, 50, 100], serverPageSize: 3, pageSize: 10 },
  },
});

const testConfig = { collections: [collection], basePath: "/admin" } as unknown as Parameters<
  typeof VexConfigProvider
>[0]["config"];

// The shared view's own saved width (444) — deliberately different from every test's
// `initialPreferences.peekWidth` below, so a false "Modified: preview width" would show
// up immediately if `CollectionListView` fell back to seeding purely from the cookie.
const sharedViewFixture: VexStoredView = {
  viewId: "shared1",
  name: "Wide view",
  collection: "peeksync_posts",
  createdBy: "user1",
  state: { peekWidth: 444 },
};

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

// A shared view whose own saved `peekWidth` differed from this
// browser's `vex-admin:<collection>` cookie (remembered from browsing OTHER views in the
// same collection) used to show a false "Modified: preview width" on every direct/fresh
// load, even though the peek panel was never opened or resized — `peekWidth` used to seed
// PURELY from `initialPreferences` (the cookie), with no awareness of the active view at
// all, unlike `columns`/`sort`/etc., which already resolved from the view first. Fixed:
// `CollectionListView` now seeds `peekWidth` from `resolved.peekWidth` (the SAME
// `resolveListViewQueryState` call server and client both make) before falling back to the
// cookie.
describe("CollectionListView — shared-view peekWidth sync", () => {
  it("never shows a false Modified: preview width for a shared view whose own width differs from the cookie's", () => {
    render(
      createElement(CollectionListView, {
        collection: "peeksync_posts",
        initialPreferences: { density: "comfortable", chipsVisible: true, peekWidth: 600, peekTab: "fields" },
      }),
      { wrapper: wrapper("?view=shared:shared1") },
    );
    expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();
  });

  // A view with NO saved width of
  // its own never shows "Modified: preview width", however far the live/cookie width
  // diverges — it's just this browser's own remembered preference, not something the
  // default view has an opinion about (supersedes an EARLIER regression-guard version of
  // this same test, which asserted the opposite).
  it("never shows Modified: preview width for the default view, however far the cookie's remembered width diverges from the hardcoded default", () => {
    render(
      createElement(CollectionListView, {
        collection: "peeksync_posts",
        initialPreferences: { density: "comfortable", chipsVisible: true, peekWidth: 600, peekTab: "fields" },
      }),
      { wrapper: wrapper("") },
    );
    expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();
  });

  // Mirrors `CollectionListView.columnsSync.test.tsx`'s own local-view-placeholder test —
  // a local view's own `peekWidth` lives in `localStorage`, invisible to
  // `resolveListViewQueryState`'s server/client-shared first-render seed, so this needs the
  // SAME view-sync `useEffect` that already re-syncs `columnEntries` once the real local
  // view data arrives a render after the SSR-matching placeholder one.
  it("re-syncs peekWidth once a local view's real (non-default) saved width arrives after the placeholder", async () => {
    render(
      createElement(CollectionListView, {
        collection: "peeksync_posts",
        initialPreferences: { density: "comfortable", chipsVisible: true, peekWidth: 384, peekTab: "fields" },
        initialLocalIndex: [{ viewId: "loc1", name: "Wide local" }],
      }),
      { wrapper: wrapper("?view=local:loc1") },
    );

    expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument();

    act(() => {
      saveLocalSavedListView({
        basePath: "/admin",
        project,
        collection: "peeksync_posts",
        view: { viewId: "loc1", name: "Wide local", state: { peekWidth: 520 } },
      });
    });

    // Settles with no "Modified: preview width" flash — the local view's own 520 is now
    // the live/diff baseline, not a lingering 384 from the cookie-seeded first render.
    await waitFor(() => expect(screen.queryByText(/Modified:/)).not.toBeInTheDocument());
  });
});
