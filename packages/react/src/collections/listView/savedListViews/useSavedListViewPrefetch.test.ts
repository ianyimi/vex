import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import {
  buildListViewFindQueryArgs,
  buildListViewSearchQueryArgs,
  defineCollection,
  text,
  vexConvexApi,
  type CollectionConfig,
  type VexStoredView,
  type VexViewConfig,
} from "@vexcms/core";
import { LIST_VIEW_PEEK_HOVER_DELAY_MS } from "../peek/useListViewPeekPrefetch";
import { useSavedListViewPrefetch } from "./useSavedListViewPrefetch";
import type { SavedListViewEntry } from "./useSavedListViews";

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (fn: unknown, args: unknown) => ({ fn, args }),
}));

const testCollection = defineCollection({
  slug: "posts",
  fields: {
    title: text({ index: "by_title", searchIndex: { name: "search_title", filterFields: [] } }),
  },
  admin: {
    view: { serverPageSize: 50, searchFields: ["title"] },
    views: [{ viewId: "cfg1", name: "Config View", state: { sort: { field: "title", order: "asc" } } }],
  },
}) as unknown as CollectionConfig;

const rawConfigViews = testCollection.admin.views as unknown as VexViewConfig[];

const sharedView: VexStoredView = {
  viewId: "shared1",
  name: "Shared View",
  collection: "posts",
  createdBy: "user1",
  state: { search: "hello", searchField: "title" },
};

const defaultViewEntry: SavedListViewEntry = {
  viewId: "default",
  name: "All",
  source: "default",
  where: undefined,
  sort: undefined,
  columns: [],
  hasHiddenFilter: false,
  hiddenFilterCount: 0,
};
const configViewEntry: SavedListViewEntry = {
  viewId: "cfg1",
  name: "Config View",
  source: "config",
  where: undefined,
  sort: undefined,
  columns: [],
  hasHiddenFilter: false,
  hiddenFilterCount: 0,
};
const sharedViewEntry: SavedListViewEntry = {
  viewId: "shared1",
  name: "Shared View",
  source: "shared",
  where: undefined,
  sort: undefined,
  columns: [],
  hasHiddenFilter: false,
  hiddenFilterCount: 0,
};
const localViewEntry: SavedListViewEntry = {
  viewId: "loc1",
  name: "Local View",
  source: "local",
  where: undefined,
  sort: undefined,
  columns: [],
  hasHiddenFilter: false,
  hiddenFilterCount: 0,
};

describe("useSavedListViewPrefetch", () => {
  let queryClient: QueryClient;
  let prefetchSpy: ReturnType<typeof vi.spyOn>;

  function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient();
    prefetchSpy = vi.spyOn(queryClient, "prefetchQuery").mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    prefetchSpy.mockRestore();
  });

  it("prefetches a hovered config tab's own find args, exactly matching buildListViewFindQueryArgs — only after the 150ms delay", () => {
    const { result } = renderHook(
      () =>
        useSavedListViewPrefetch({
          collection: testCollection,
          urlState: { view: undefined },
          rawConfigViews,
          sharedViews: [],
        }),
      { wrapper },
    );

    act(() => result.current.onTabPointerEnter(configViewEntry));
    act(() => vi.advanceTimersByTime(LIST_VIEW_PEEK_HOVER_DELAY_MS - 1));
    expect(prefetchSpy).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    const call = prefetchSpy.mock.calls[0]?.[0] as { fn: unknown; args: Record<string, unknown>; gcTime: number };
    expect(call.fn).toBe(vexConvexApi.findPaginated);
    expect(call.args).toEqual(
      buildListViewFindQueryArgs({
        collection: testCollection,
        where: undefined,
        sort: { field: "title", order: "asc" },
        drafts: undefined,
        depth: 1,
        numItems: 50,
      }),
    );
    expect(call.gcTime).toBe(30_000);
  });

  it("prefetches a hovered shared tab's own search args, exactly matching buildListViewSearchQueryArgs", () => {
    const { result } = renderHook(
      () =>
        useSavedListViewPrefetch({
          collection: testCollection,
          urlState: { view: undefined },
          rawConfigViews,
          sharedViews: [sharedView],
        }),
      { wrapper },
    );

    act(() => result.current.onTabPointerEnter(sharedViewEntry));
    act(() => vi.advanceTimersByTime(LIST_VIEW_PEEK_HOVER_DELAY_MS));
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    const call = prefetchSpy.mock.calls[0]?.[0] as { fn: unknown; args: Record<string, unknown> };
    expect(call.fn).toBe(vexConvexApi.search);
    expect(call.args).toEqual(
      buildListViewSearchQueryArgs({
        collection: testCollection,
        where: undefined,
        search: "hello",
        searchField: "title",
        drafts: undefined,
        numItems: 50,
      }),
    );
  });

  it("prefetches on focus immediately, with no delay", () => {
    const { result } = renderHook(
      () =>
        useSavedListViewPrefetch({
          collection: testCollection,
          urlState: { view: undefined },
          rawConfigViews,
          sharedViews: [],
        }),
      { wrapper },
    );

    act(() => result.current.onTabFocus(configViewEntry));
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending prefetch when the pointer leaves before the delay elapses", () => {
    const { result } = renderHook(
      () =>
        useSavedListViewPrefetch({
          collection: testCollection,
          urlState: { view: undefined },
          rawConfigViews,
          sharedViews: [],
        }),
      { wrapper },
    );

    act(() => result.current.onTabPointerEnter(configViewEntry));
    act(() => vi.advanceTimersByTime(LIST_VIEW_PEEK_HOVER_DELAY_MS - 1));
    act(() => result.current.onTabPointerLeave());
    act(() => vi.advanceTimersByTime(1000));
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  it("never prefetches a local-source tab", () => {
    const { result } = renderHook(
      () =>
        useSavedListViewPrefetch({
          collection: testCollection,
          urlState: { view: undefined },
          rawConfigViews,
          sharedViews: [],
        }),
      { wrapper },
    );

    act(() => result.current.onTabFocus(localViewEntry));
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  it("never prefetches the currently-active tab", () => {
    const { result } = renderHook(
      () =>
        useSavedListViewPrefetch({
          collection: testCollection,
          urlState: { view: "config:cfg1" },
          rawConfigViews,
          sharedViews: [],
        }),
      { wrapper },
    );

    act(() => result.current.onTabFocus(configViewEntry));
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  it("never prefetches the active default tab when no view= is in the URL", () => {
    const { result } = renderHook(
      () =>
        useSavedListViewPrefetch({
          collection: testCollection,
          urlState: { view: undefined },
          rawConfigViews,
          sharedViews: [],
        }),
      { wrapper },
    );

    act(() => result.current.onTabFocus(defaultViewEntry));
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  it("sets pendingViewId while the prefetch is in flight and clears it once it settles", async () => {
    // `Promise.withResolvers` isn't in this package's configured TS lib
    // target — the executor form is the only option here, not a style choice.
    let resolvePrefetch: () => void = () => {};
    const promise = new Promise<void>((resolve) => {
      resolvePrefetch = resolve;
    });
    prefetchSpy.mockImplementation(() => promise);

    const { result } = renderHook(
      () =>
        useSavedListViewPrefetch({
          collection: testCollection,
          urlState: { view: undefined },
          rawConfigViews,
          sharedViews: [],
        }),
      { wrapper },
    );

    expect(result.current.pendingViewId).toBeUndefined();
    act(() => result.current.onTabFocus(configViewEntry));
    expect(result.current.pendingViewId).toBe("cfg1");

    await act(async () => {
      resolvePrefetch();
      await Promise.resolve();
    });
    expect(result.current.pendingViewId).toBeUndefined();
  });
});
