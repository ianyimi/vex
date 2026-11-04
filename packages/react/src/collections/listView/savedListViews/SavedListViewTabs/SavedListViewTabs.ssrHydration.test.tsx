import { createElement, type ReactElement, type ReactNode } from "react";
import { within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { describe, expect, it, vi } from "vitest";
import { defineCollection, defineConfig, text, vexConvexApi, type VexStoredView } from "@vexcms/core";
import type * as ConvexReactModule from "convex/react";
import type * as ConvexReactQueryModule from "@convex-dev/react-query";
import { VexConfigProvider } from "../../../../config/VexConfigContext";
import { assertHydratesWithoutMismatch } from "../../../../testing/ssrHydration";
import { SavedListViewTabs, type SavedListViewTabsProps } from "./index";

// A regression that `NextAdminPage` used to trigger: un-awaiting its `listViews`
// prefetch so the admin shell could stream, which made `SavedListViewTabs`' plain
// `useSavedListViews()` (`useQuery`) commit "pending" into the SSR'd HTML, then
// hydrate with fresher client data and render a DIFFERENT tab set — a
// confirmed, reproducible "Hydration failed" error (4/4 repro). The fix at the time was a `useSuspenseQuery`-inside-
// `<Suspense>` split (`ListViewTabStripSuspended`/`ListViewTabStripFallback`)
// so the tab strip could stream shared views in without ever committing a
// mismatched SSR snapshot.
//
// `NextAdminPage`'s `listViews` prefetch is now unconditionally AWAITED
// (a later, unrelated regression fix) — by the time
// anything renders, the dehydrated cache always already has `status:
// "success"` data, so the precondition for the ORIGINAL bug (an un-awaited
// prefetch) no longer exists, and the Suspense split was removed (a nested
// `<Suspense>` boundary turned out to have its own cost even with
// already-resolved data: React's streaming SSR ships a nested boundary's
// fallback in the first flush regardless of whether the query had to wait
// at all — confirmed live via a JS-disabled load). This
// test's OWN scenario — the shared-views cache resolving to real data
// AFTER the component has already mounted (the same shape a live Convex
// subscription update takes, post-hydration) — is still a real case the
// plain `useSavedListViews()` must handle without a hydration mismatch, so the
// test (and its "seed empty, then update" shape) stays; only the framing
// above (which fix is "current") changed.
const project = "https://example.convex.cloud";

vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactModule>();
  return { ...actual, useConvex: () => ({ url: project }) };
});

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQueryModule>();
  return {
    ...actual,
    // `useSaveView()`/`useRemoveView()` (`../../client`) call this eagerly to
    // build their `mutationFn` — `SavedListViewTabs` mounts them unconditionally.
    useConvexMutation: () => async () => {},
  };
});

const testConfig = defineConfig({
  collections: [defineCollection({ slug: "posts", fields: { title: text() } })],
});

function wrapper(queryClient: QueryClient, children: ReactNode): ReactElement {
  return createElement(
    QueryClientProvider,
    { client: queryClient },
    createElement(VexConfigProvider, { config: testConfig, children }),
  );
}

const viewPrefetchStub = {
  onTabPointerEnter: () => {},
  onTabPointerLeave: () => {},
  onTabFocus: () => {},
  pendingViewId: undefined,
};

function baseProps(): Omit<SavedListViewTabsProps, "initialViews"> {
  return {
    collection: "posts",
    urlState: {
      q: undefined,
      qf: undefined,
      sort: undefined,
      filter: undefined,
      size: undefined,
      view: undefined,
      setQ: () => {},
      setQf: () => {},
      setSort: () => {},
      setFilter: () => {},
      setSize: () => {},
      setView: () => {},
      applyView: () => {},
    },
    defaultPageSize: 25,
    columns: [],
    onColumnsChange: () => {},
    onColumnsStateChange: () => {},
    peekWidth: 384,
    peekWidthTouched: false,
    onPeekWidthChange: () => {},
    viewPrefetch: viewPrefetchStub,
  };
}

describe("SavedListViewTabs — SSR-then-hydrate with a pending-then-resolving listViews query (streaming regression)", () => {
  it("hydrates with 0 errors from a resolved-but-empty listViews cache, then updating it to the real shared views also triggers 0 errors", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // `@convex-dev/react-query`'s real `convexQuery(vexConvexApi.listViews, { collection })`
    // (NOT mocked here — `convexQuery` itself is a pure key/queryFn builder, no live Convex
    // client needed to call it) produces the SAME key `useSavedListViews`'s own `listViews({
    // collection })` call builds — seeding THIS key directly is exactly what a dehydrated
    // `NextAdminPage` HydrationBoundary does for the client.
    const queryKey = convexQuery(vexConvexApi.listViews, { collection: "posts" }).queryKey;
    queryClient.setQueryData(queryKey, [] as VexStoredView[]);

    const element = wrapper(queryClient, createElement(SavedListViewTabs, baseProps()));
    await assertHydratesWithoutMismatch(element, async (container) => {
      // Resolved-but-empty: only the always-known "All" tab, no shared ones yet.
      expect(within(container).getByRole("tab", { name: "All" })).toBeInTheDocument();
      expect(within(container).queryByRole("tab", { name: "Shared Late" })).not.toBeInTheDocument();
      // The live query resolving post-hydration (a real Convex subscription update, or
      // this cache update standing in for one) — an ordinary TanStack Query cache update,
      // not a hydration-mismatch risk on its own.
      queryClient.setQueryData(queryKey, [
        { viewId: "shared-late", name: "Shared Late", collection: "posts", createdBy: "user1", state: {} },
      ] as VexStoredView[]);
      await within(container).findByRole("tab", { name: "Shared Late" });
    });
  });
});
