import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { defineCollection, text, vexConvexApi, type CollectionConfig, type VexDocument } from "@vexcms/core";
import { LIST_VIEW_PEEK_HOVER_DELAY_MS, useListViewPeekPrefetch } from "./useListViewPeekPrefetch";

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (fn: unknown, args: unknown) => ({ fn, args }),
}));

const testCollection = defineCollection({
  slug: "documents",
  fields: { title: text() },
}) as unknown as CollectionConfig;

const rows: VexDocument[] = [
  { _id: "doc1", _creationTime: 1, title: "Doc 0" },
  { _id: "doc2", _creationTime: 2, title: "Doc 1" },
  { _id: "doc3", _creationTime: 3, title: "Doc 2" },
];

describe("useListViewPeekPrefetch", () => {
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

  it("prefetches 150ms after pointer enter, not a moment before", () => {
    const { result } = renderHook(
      () => useListViewPeekPrefetch({ collection: testCollection, rows, peekId: undefined }),
      { wrapper },
    );

    act(() => result.current.onRowPointerEnter("doc2"));
    act(() => {
      vi.advanceTimersByTime(LIST_VIEW_PEEK_HOVER_DELAY_MS - 1);
    });
    expect(prefetchSpy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    // Unchecked: the mocked `convexQuery` return shape is fixed above (`{ fn, args }`).
    const call = prefetchSpy.mock.calls[0]?.[0] as { fn: unknown; args: Record<string, unknown> };
    expect(call.fn).toBe(vexConvexApi.get);
    expect(call.args).toMatchObject({ id: "doc2", collection: "documents" });
  });

  it("cancels the pending prefetch when the pointer leaves before the delay elapses", () => {
    const { result } = renderHook(
      () => useListViewPeekPrefetch({ collection: testCollection, rows, peekId: undefined }),
      { wrapper },
    );

    act(() => result.current.onRowPointerEnter("doc2"));
    act(() => result.current.onRowPointerLeave());
    act(() => {
      vi.advanceTimersByTime(LIST_VIEW_PEEK_HOVER_DELAY_MS);
    });
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  it("prefetches immediately on focus, with no delay", () => {
    const { result } = renderHook(
      () => useListViewPeekPrefetch({ collection: testCollection, rows, peekId: undefined }),
      { wrapper },
    );

    act(() => result.current.onRowFocus("doc3"));
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    // Unchecked: the mocked `convexQuery` return shape is fixed above (`{ fn, args }`).
    const call = prefetchSpy.mock.calls[0]?.[0] as { args: Record<string, unknown> };
    expect(call.args).toMatchObject({ id: "doc3", collection: "documents" });
  });

  it("prefetches the ±1 neighbours of peekId while the peek is open", () => {
    renderHook(
      () => useListViewPeekPrefetch({ collection: testCollection, rows, peekId: "doc2" }),
      { wrapper },
    );

    expect(prefetchSpy).toHaveBeenCalledTimes(2);
    const ids = prefetchSpy.mock.calls
      .map((call: unknown[]) => {
        // Unchecked: the mocked `convexQuery` return shape is fixed above (`{ fn, args }`).
        const arg = call[0] as { args: { id: string } };
        return arg.args.id;
      })
      .sort();
    expect(ids).toEqual(["doc1", "doc3"]);
  });

  it("prefetches only the next neighbour when peekId is the first loaded row", () => {
    renderHook(
      () => useListViewPeekPrefetch({ collection: testCollection, rows, peekId: "doc1" }),
      { wrapper },
    );

    expect(prefetchSpy).toHaveBeenCalledTimes(1);
    // Unchecked: the mocked `convexQuery` return shape is fixed above (`{ fn, args }`).
    const call = prefetchSpy.mock.calls[0]?.[0] as { args: { id: string } };
    expect(call.args.id).toBe("doc2");
  });
});
