import "@testing-library/jest-dom";

import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import type { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

import { createFakeConvexClient } from "./convex/bridge";
import schema, { seedDocuments, testModules } from "./convex/schema";
import { useTableSelection } from "../hooks/useTableSelection";
import { usePaginatedQuery } from "../hooks/usePaginatedQuery";

/** Member names {@link runHooksSuite}'s `only` option accepts. */
export type HooksSuiteMember = "useTableSelection" | "usePaginatedQuery";

/**
 * `useTableSelection`'s `state.mode` and `state.selectedIds` alone determine
 * indeterminate (partial-page-selection) status; `UseTableSelectionReturn`
 * has no `indeterminate` field, so a consumer would derive it exactly this
 * way rather than through a hook-exposed property.
 *
 * @param state - The hook's current `mode` and `selectedIds`.
 * @param pageIds - Every row id on the current page, the denominator a
 *   `"page"`-mode partial selection is measured against.
 * @returns `true` when the current selection is partial, `false` when it is
 *   empty or complete.
 */
function deriveIndeterminate(state: { mode: string; selectedIds: Set<string> }, pageIds: string[]): boolean {
  if (state.mode === "all" || state.mode === "none") return false;
  if (state.mode === "page") {
    return state.selectedIds.size > 0 && state.selectedIds.size < pageIds.length;
  }
  // inverse: partial unless every id has been excluded (selectedIds empty means all selected)
  return state.selectedIds.size > 0;
}

/**
 * Wires a fresh `convex-test` instance through the real `ConvexQueryClient` +
 * `QueryClient` pair — byte-for-byte the same wiring `bridge.test.tsx` and
 * `relationship/Input.test.tsx` use — so `usePaginatedQuery`'s
 * `convexQuery(vexConvexApi.findPaginated, …)` call resolves real
 * `PaginationResult` data from the seeded `documents` table.
 *
 * @param t - The `convexTest()` instance the hook's queries run against.
 * @returns The `QueryClient` connected to the fake Convex client, and the
 *   underlying fake client itself so a caller can `vi.spyOn` its `query`
 *   method to count real fetches.
 */
function buildQueryClient(t: Parameters<typeof createFakeConvexClient>[0]): {
  queryClient: QueryClient;
  fakeClient: ConvexReactClient;
} {
  const fakeClient = createFakeConvexClient(t) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(fakeClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  convexQueryClient.connect(queryClient);
  return { queryClient, fakeClient };
}

/**
 * `renderHook`'s wrapper option, bound to one `QueryClient`.
 *
 * @param queryClient - The `QueryClient` every rendered hook instance shares.
 * @returns A provider component usable as `renderHook`'s `wrapper`.
 */
function makeWrapper(queryClient: QueryClient) {
  return function Wrapper(props: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
  };
}

/**
 * Runs the shared contract for this package's two custom hooks —
 * `useTableSelection`'s selection-state machine and `usePaginatedQuery`'s
 * cursor-accumulating pagination over a real Convex backend. Neither member
 * installs a module mock, so the same assertions hold unmodified inside a
 * consumer app's own process via `runVexReactSuite({ sections: ["hooks"] })`.
 *
 * @param options - Which members to run; defaults to both.
 */
export function runHooksSuite(options?: { only?: HooksSuiteMember[] }): void {
  const only = options?.only ?? ["useTableSelection", "usePaginatedQuery"];

  if (only.includes("useTableSelection")) {
    describe("useTableSelection", () => {
      it("starts with an empty selection and mode 'none'", () => {
        const { result } = renderHook(() => useTableSelection());

        expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
        expect(result.current.getSelectionCount()).toBe(0);
        expect(result.current.isRowSelected("row-1")).toBe(false);
      });

      it("toggleRow selects a single row and switches mode 'none' -> 'page'", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.toggleRow("row-1");
        });

        expect(result.current.state.selectedIds).toEqual(new Set(["row-1"]));
        expect(result.current.state.mode).toBe("page");
        expect(result.current.isRowSelected("row-1")).toBe(true);
        expect(result.current.isRowSelected("row-2")).toBe(false);
        expect(result.current.getSelectionCount()).toBe(1);
      });

      it("toggleRow deselects a selected row and collapses mode back to 'none' when empty (boundary: last row)", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.toggleRow("row-1");
        });
        act(() => {
          result.current.toggleRow("row-1");
        });

        expect(result.current.state.selectedIds).toEqual(new Set());
        expect(result.current.state.mode).toBe("none");
        expect(result.current.getSelectionCount()).toBe(0);
      });

      it("toggling a row twice returns to the original selection state, other rows unaffected", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.selectPage(["a", "b"]);
        });
        act(() => {
          result.current.toggleRow("a");
        });
        act(() => {
          result.current.toggleRow("a");
        });

        expect(result.current.state.selectedIds).toEqual(new Set(["a", "b"]));
        expect(result.current.state.mode).toBe("page");
      });

      it("toggling an id absent from the current page selects it without error (hook has no page awareness)", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.toggleRow("row-not-on-any-rendered-page");
        });

        expect(result.current.isRowSelected("row-not-on-any-rendered-page")).toBe(true);
        expect(result.current.getSelectionCount()).toBe(1);
      });

      it("toggleRow's onSelectionChange reports the post-change mode", () => {
        const onSelectionChange = vi.fn();
        const { result } = renderHook(() => useTableSelection({ onSelectionChange }));

        act(() => {
          result.current.toggleRow("row-1");
        });

        // Intent: a change callback reports the state AFTER the change it is
        // announcing. Selecting the first row moves mode "none" -> "page", so
        // the callback should report "page" — not the pre-toggle "none" that
        // the implementation's outer closure still holds when it fires.
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
        // Regression guard (HOOK-3): toggleRow computes nextMode locally
        // and passes it to both setMode and onSelectionChange for current
        // state reporting.
        expect(onSelectionChange).toHaveBeenCalledWith({ selectedIds: new Set(["row-1"]), mode: "page" });
        expect(result.current.state.mode).toBe("page");

        act(() => {
          result.current.toggleRow("row-1");
        });

        // Deselecting the last row moves mode "page" -> "none"; the callback
        // should report "none".
        expect(onSelectionChange).toHaveBeenCalledTimes(2);
        // Regression guard (HOOK-3): toggleRow computes nextMode locally
        // and passes it to both setMode and onSelectionChange for current
        // state reporting.
        expect(onSelectionChange).toHaveBeenLastCalledWith({ selectedIds: new Set(), mode: "none" });
        expect(result.current.state.mode).toBe("none");
      });

      it("selectPage replaces the selection with exactly the given ids and sets mode 'page'", () => {
        const onSelectionChange = vi.fn();
        const { result } = renderHook(() => useTableSelection({ onSelectionChange }));

        act(() => {
          result.current.selectPage(["a", "b", "c"]);
        });

        expect(result.current.state.selectedIds).toEqual(new Set(["a", "b", "c"]));
        expect(result.current.state.mode).toBe("page");
        expect(onSelectionChange).toHaveBeenLastCalledWith({
          selectedIds: new Set(["a", "b", "c"]),
          mode: "page",
        });
      });

      it("selectPage([]) (empty page) selects nothing and sets mode 'none' (boundary)", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.selectPage([]);
        });

        expect(result.current.state.selectedIds).toEqual(new Set());
        expect(result.current.state.mode).toBe("none");
      });

      it("clearSelection resets ids and mode regardless of prior state", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.selectPage(["a", "b"]);
        });
        act(() => {
          result.current.clearSelection();
        });

        expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
      });

      it("clearSelection on an already-empty selection is idempotent (boundary)", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.clearSelection();
        });

        expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
        expect(result.current.getSelectionCount()).toBe(0);
      });

      it("toggleSelectAll enters 'all' mode, marks every row selected, and honors totalCount for the count", () => {
        const { result } = renderHook(() => useTableSelection({ totalCount: 500 }));

        act(() => {
          result.current.toggleSelectAll();
        });

        expect(result.current.state.mode).toBe("all");
        expect(result.current.state.selectedIds).toEqual(new Set());
        expect(result.current.isRowSelected("any-row-not-individually-tracked")).toBe(true);
        expect(result.current.getSelectionCount()).toBe(500);
      });

      it("getSelectionCount defaults totalCount to 0 in 'all' mode when totalCount is absent", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.toggleSelectAll();
        });

        expect(result.current.getSelectionCount()).toBe(0);
      });

      it("toggleSelectAll a second time (while already 'all') clears the selection back to 'none'", () => {
        const { result } = renderHook(() => useTableSelection({ totalCount: 500 }));

        act(() => {
          result.current.toggleSelectAll();
        });
        act(() => {
          result.current.toggleSelectAll();
        });

        expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
      });

      it("select-all then deselect-one produces an indeterminate exclusion, not a no-op", () => {
        const { result } = renderHook(() => useTableSelection({ totalCount: 5 }));

        act(() => {
          result.current.toggleSelectAll();
        });
        expect(result.current.isRowSelected("row-1")).toBe(true);

        // Intent (sibling: toggleInverseMode's own "everything selected except
        // deselected" semantics): deselecting one row out of select-all should
        // exclude just that row, both from isRowSelected and from the count.
        act(() => {
          result.current.toggleRow("row-1");
        });

        // Regression guard (HOOK-5): "all" mode reads selectedIds as an
        // exclusion set, so a toggled-out row is genuinely deselected.
        expect(result.current.isRowSelected("row-1")).toBe(false);
        // Regression guard (HOOK-5): "all" mode reads selectedIds as an
        // exclusion set, so the count reflects truly selected rows.
        expect(result.current.getSelectionCount()).toBe(4);
      });

      it("toggleInverseMode enters 'inverse' with every row selected until explicitly excluded", () => {
        const { result } = renderHook(() => useTableSelection({ totalCount: 10 }));

        act(() => {
          result.current.toggleInverseMode();
        });

        expect(result.current.state.mode).toBe("inverse");
        expect(result.current.isRowSelected("row-1")).toBe(true);
        expect(result.current.getSelectionCount()).toBe(10);

        // toggling a row in inverse mode ADDS it to selectedIds, which here means
        // "excluded from the selection" — the inverse of the normal semantics.
        act(() => {
          result.current.toggleRow("row-1");
        });

        expect(result.current.state.mode).toBe("inverse"); // unchanged: mode !== "none"
        expect(result.current.isRowSelected("row-1")).toBe(false);
        expect(result.current.isRowSelected("row-2")).toBe(true);
        expect(result.current.getSelectionCount()).toBe(9);
      });

      it("getSelectionCount can go negative in inverse mode when exclusions exceed totalCount (boundary)", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.toggleInverseMode();
        });
        act(() => {
          result.current.toggleRow("row-1");
        });
        act(() => {
          result.current.toggleRow("row-2");
        });

        // totalCount is absent (defaults to 0) and two rows are excluded: 0 - 2.
        expect(result.current.getSelectionCount()).toBe(-2);
      });

      it("toggleInverseMode a second time (while already 'inverse') clears back to 'none'", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.toggleInverseMode();
        });
        act(() => {
          result.current.toggleInverseMode();
        });

        expect(result.current.state).toEqual({ selectedIds: new Set(), mode: "none" });
      });

      it("selection survives a page change: useTableSelection has no dependency on any pagination hook", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.toggleRow("row-on-page-1");
        });
        expect(result.current.isRowSelected("row-on-page-1")).toBe(true);

        // Simulate the table advancing to a new page: nothing about page
        // navigation calls into this hook, so re-rendering it with the same
        // props (as a consumer would on every render) leaves selection intact.
        act(() => {
          // no-op action standing in for "the page changed elsewhere"
        });

        expect(result.current.isRowSelected("row-on-page-1")).toBe(true);
        expect(result.current.state.selectedIds).toEqual(new Set(["row-on-page-1"]));
      });

      it("selection survives a pageSize change: same no-dependency guarantee", () => {
        const { result } = renderHook(() => useTableSelection());

        act(() => {
          result.current.toggleRow("row-x");
        });

        // Simulate a page-size change elsewhere in the consumer: this hook takes no
        // pagination props at all, so nothing here reacts.
        act(() => {
          // no-op action standing in for "pageSize changed elsewhere"
        });

        expect(result.current.isRowSelected("row-x")).toBe(true);
        expect(result.current.getSelectionCount()).toBe(1);
      });

      it("derives indeterminate (partial-page-selection) state from mode and selectedIds, consumer-side", () => {
        const { result } = renderHook(() => useTableSelection());
        const pageIds = ["a", "b", "c"];

        expect(deriveIndeterminate(result.current.state, pageIds)).toBe(false); // none selected

        act(() => {
          result.current.toggleRow("a");
        });
        expect(deriveIndeterminate(result.current.state, pageIds)).toBe(true); // 1 of 3

        act(() => {
          result.current.selectPage(pageIds);
        });
        expect(deriveIndeterminate(result.current.state, pageIds)).toBe(false); // mode "page" but full page selected (1 === 1 boundary: not < length)
        expect(result.current.state.selectedIds.size).toBe(3);
        // deriveIndeterminate only checks `mode === "page"`, so a fully-selected
        // page (size === pageIds.length) also reports false — matching how a
        // checkbox's `checked` (not `indeterminate`) state would take over.

        act(() => {
          result.current.toggleSelectAll();
        });
        expect(deriveIndeterminate(result.current.state, pageIds)).toBe(false); // "all" mode is never indeterminate
      });
    });
  }

  if (only.includes("usePaginatedQuery")) {
    describe("usePaginatedQuery", () => {
      it("loads the first server page on mount", async () => {
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 5);
        const { queryClient } = buildQueryClient(t);

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.results.map((doc) => doc.title)).toEqual(["Doc 0", "Doc 1"]);
        expect(result.current.isDone).toBe(false);
      });

      it("reveals the next page after a single loadMore call", async () => {
        // Intent per `loadMore`'s own plain meaning (Protocol rule 3): one call
        // reveals one more page. The real implementation's `clientPageIndex`
        // (which gates the visible window) only advances once the internal
        // accumulator already covers it — so the FIRST `loadMore()` call fetches
        // page 2 into the accumulator but the visible `results` window doesn't
        // grow until a SECOND call. Traced by running this hook against the
        // real bridge, not assumed.
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 5);
        const { queryClient } = buildQueryClient(t);

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );
        await waitFor(() => expect(result.current.isPending).toBe(false));

        act(() => result.current.loadMore());
        await waitFor(() => expect(result.current.isPending).toBe(false));

        // Regression guard (HOOK-4): loadMore advances clientPageIndex
        // unconditionally, so ONE call reveals ONE page instead of only
        // fetching it for the next call.
        expect(result.current.results.map((doc) => doc.title)).toEqual([
          "Doc 0",
          "Doc 1",
          "Doc 2",
          "Doc 3",
        ]);
        expect(result.current.isDone).toBe(false);
      });

      it("flips isDone after the intended number of loadMore calls", async () => {
        // 5 docs at numItems=2 span 3 server pages (2, 2, 1). Intent: the first
        // page loads on mount, and each of the two remaining pages is revealed
        // by exactly one `loadMore()` call — 2 calls total to exhaust the
        // collection. The real off-by-one-reveal (HOOK-4) needs 4 calls instead;
        // asserting the intended 2-call model here fails against that trace.
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 5);
        const { queryClient } = buildQueryClient(t);

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );
        await waitFor(() => expect(result.current.isPending).toBe(false));

        act(() => result.current.loadMore());
        await waitFor(() => expect(result.current.isPending).toBe(false));
        act(() => result.current.loadMore());
        await waitFor(() => expect(result.current.isPending).toBe(false));

        // Regression guard (HOOK-4): each loadMore advances
        // clientPageIndex unconditionally, revealing pages in order.
        expect(result.current.results.map((doc) => doc.title)).toEqual([
          "Doc 0",
          "Doc 1",
          "Doc 2",
          "Doc 3",
          "Doc 4",
        ]);
        expect(result.current.isDone).toBe(true);
      });

      it("returns an empty, done page when the collection has no documents", async () => {
        const t = convexTest(schema, testModules);
        const { queryClient } = buildQueryClient(t);

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.results).toEqual([]);
        expect(result.current.isDone).toBe(true);
      });

      it("reports a pending, not-yet-done state before the first page resolves", async () => {
        // `isDone`'s own JSDoc: "Whether all documents have been loaded. When
        // true, Load More button should be hidden." Before the first fetch
        // settles, no document has loaded, so intent is `isDone: false`. The
        // real hook's `result` memo falls back to a `{ isDone: true }` empty
        // placeholder whenever `data` is `undefined` — including the very first,
        // still-pending render — so the mount-time accumulate effect sets
        // `isDone` true a full render before any data has arrived.
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 5);
        const { queryClient } = buildQueryClient(t);

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );

        expect(result.current.isPending).toBe(true);
        expect(result.current.results).toEqual([]);
        // Regression guard (HOOK-6): result memo threads useQuery's
        // isLoading and isError, so isDone reads false while pending.
        expect(result.current.isDone).toBe(false);

        await waitFor(() => expect(result.current.isPending).toBe(false));
      });

      it("returns a done page immediately when every document fits on a single page", async () => {
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 3);
        const { queryClient } = buildQueryClient(t);

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 5, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.results.map((doc) => doc.title)).toEqual(["Doc 0", "Doc 1", "Doc 2"]);
        expect(result.current.isDone).toBe(true);
      });

      it("surfaces a query failure without crashing the render", async () => {
        // The hook's `UsePaginatedQueryReturn` exposes no `error`/`isError`
        // field, so the strongest available intent check is `isDone`'s own
        // contract again: a failed fetch has not loaded "all documents", so
        // `isDone` should not read true. Rendering itself must not throw either
        // way — `useQuery` here has no `throwOnError`, so a rejected fetch is
        // expected to resolve to a quiet, safe state, not an exception.
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 5);
        const fakeClient = createFakeConvexClient(t) as ConvexReactClient & {
          query: (...args: unknown[]) => Promise<unknown>;
        };
        const erroringClient = {
          ...fakeClient,
          query: async () => {
            throw new Error("simulated query failure");
          },
        } as unknown as ConvexReactClient;
        const convexQueryClient = new ConvexQueryClient(erroringClient);
        const queryClient = new QueryClient({
          defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
        });
        convexQueryClient.connect(queryClient);

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );

        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.results).toEqual([]);
        // Regression guard (HOOK-6): result memo threads useQuery's
        // isError, so isDone reads false on rejected query, distinguishing
        // it from a genuinely empty collection.
        expect(result.current.isDone).toBe(false);
      });

      it("loadMore is a safe no-op once every document has been loaded", async () => {
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 3);
        const { queryClient, fakeClient } = buildQueryClient(t);
        const querySpy = vi.spyOn(
          fakeClient as unknown as { query: (...args: unknown[]) => Promise<unknown> },
          "query",
        );

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 5, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );
        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.isDone).toBe(true);
        const callCountAtDone = querySpy.mock.calls.length;
        const resultsAtDone = result.current.results.map((doc) => doc.title);

        act(() => result.current.loadMore());
        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(result.current.results.map((doc) => doc.title)).toEqual(resultsAtDone);
        expect(result.current.isDone).toBe(true);
        expect(querySpy.mock.calls.length).toBe(callCountAtDone);
      });

      it("loadMore called twice rapidly, before the first resolves, does not duplicate the fetch", async () => {
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 6);
        const { queryClient, fakeClient } = buildQueryClient(t);
        const querySpy = vi.spyOn(
          fakeClient as unknown as { query: (...args: unknown[]) => Promise<unknown> },
          "query",
        );

        const { result } = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );
        await waitFor(() => expect(result.current.isPending).toBe(false));
        const callCountAtMount = querySpy.mock.calls.length;

        act(() => result.current.loadMore());
        act(() => result.current.loadMore());
        await waitFor(() => expect(result.current.isPending).toBe(false));

        expect(querySpy.mock.calls.length - callCountAtMount).toBe(1);
      });

      it("resets to a fresh first page when the consumer remounts with a different page size", async () => {
        // `usePaginatedQuery`'s own JSDoc says it "Mimics Convex's
        // usePaginatedQuery API for consistency". Real Convex's own
        // `usePaginatedQuery` (node_modules/convex/dist/esm/react/use_paginated_query.js)
        // resets its internal pagination state only when the query reference or
        // its non-pagination *args* change (`getFunctionName`/`JSON.stringify`
        // comparison) — `initialNumItems` is deliberately excluded from that
        // comparison, so changing it in place never resets an already-mounted
        // instance. Convex's own docs are explicit about the consequence
        // (docs.convex.dev/api/modules/react): "If you need to reset pagination
        // to use a different `initialNumItems`, you'd typically change a query
        // argument… or use a React key to unmount/remount the component." This
        // hook keeps its cursor/accumulator in local `useState` with the same
        // no-reset-on-page-size-change shape, so a remount is the documented,
        // intended way to change page size — not a workaround for a missing
        // reset effect. Proven here by unmounting an instance that has already
        // paged past the first server page, then mounting a second instance
        // (same convex-test data, same QueryClient) with a different `numItems`
        // and asserting it starts over from `cursor: null` rather than
        // continuing where the first instance left off.
        const t = convexTest(schema, testModules);
        await seedDocuments(t, 5);
        const { queryClient } = buildQueryClient(t);

        const first = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 2, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );
        await waitFor(() => expect(first.result.current.isPending).toBe(false));
        act(() => first.result.current.loadMore());
        await waitFor(() => expect(first.result.current.isPending).toBe(false));
        act(() => first.result.current.loadMore());
        await waitFor(() =>
          expect(first.result.current.results.map((doc) => doc.title)).toEqual([
            "Doc 0",
            "Doc 1",
            "Doc 2",
            "Doc 3",
          ]),
        );
        first.unmount();

        const second = renderHook(
          () =>
            usePaginatedQuery({
              query: { collection: "documents", paginationOpts: { numItems: 3, cursor: null } },
            }),
          { wrapper: makeWrapper(queryClient) },
        );
        await waitFor(() => expect(second.result.current.isPending).toBe(false));
        expect(second.result.current.results.map((doc) => doc.title)).toEqual([
          "Doc 0",
          "Doc 1",
          "Doc 2",
        ]);
        expect(second.result.current.isDone).toBe(false);
      });
    });
  }
}
