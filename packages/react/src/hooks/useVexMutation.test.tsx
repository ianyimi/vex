import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { VexRevalidateChange } from "@vexcms/core";
import { VEX_REVALIDATE_BATCH_SIZE, vexConvexApi } from "@vexcms/core";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_VEX_REVALIDATE_ENDPOINT } from "../context/VexRevalidateContext";
import { useVexMutation } from "./useVexMutation";

const { convexMutationMock } = vi.hoisted(() => ({ convexMutationMock: vi.fn() }));

vi.mock("@convex-dev/react-query", () => ({ useConvexMutation: () => convexMutationMock }));

/**
 * Wraps a hook under a fresh `QueryClient`.
 *
 * @param props - Input props.
 * @returns The provider-wrapped subtree.
 */
function Wrapper(props: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
}

const beforeDoc = { _creationTime: 1, _id: "doc1", title: "Old" };

/**
 * Renders `useVexMutation` configured the way `CollectionEditView` does.
 *
 * @returns The `renderHook` result.
 */
function renderUpdateMutation() {
  return renderHook(
    () =>
      useVexMutation({
        collection: "posts",
        getChanges: ({ args }) => [
          { after: { ...beforeDoc, ...(args.data as object) }, before: beforeDoc },
        ],
        mutationFn: vexConvexApi.update,
        operation: "update",
      }),
    { wrapper: Wrapper },
  );
}

describe("useVexMutation", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    convexMutationMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("issues exactly one POST with the collection, operation, and changes on success", async () => {
    convexMutationMock.mockResolvedValueOnce(undefined);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { result } = renderUpdateMutation();

    await act(async () => {
      await result.current.mutateAsync({ collection: "posts", data: { title: "New" }, id: "doc1" });
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(DEFAULT_VEX_REVALIDATE_ENDPOINT);
    expect(init).toMatchObject({
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      changes: [{ after: { ...beforeDoc, title: "New" }, before: beforeDoc }],
      collection: "posts",
      operation: "update",
    });
  });

  it("chunks a changes array larger than the batch size into sequential POSTs", async () => {
    convexMutationMock.mockResolvedValueOnce(undefined);
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const changes: VexRevalidateChange[] = Array.from(
      { length: VEX_REVALIDATE_BATCH_SIZE + 50 },
      (_, i) => ({ before: { _creationTime: i, _id: `doc${i}`, slug: `post-${i}` } }),
    );
    const { result } = renderHook(
      () =>
        useVexMutation({
          collection: "posts",
          getChanges: () => changes,
          mutationFn: vexConvexApi.remove,
          operation: "remove",
        }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        collection: "posts",
        ids: changes.map((change) => String(change.before?._id)),
      });
    });

    // Chunks land one microtask apart, so poll rather than asserting inline.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const firstInit = fetchMock.mock.calls[0][1] as RequestInit;
    const secondInit = fetchMock.mock.calls[1][1] as RequestInit;
    expect(JSON.parse(firstInit.body as string).changes).toEqual(
      changes.slice(0, VEX_REVALIDATE_BATCH_SIZE),
    );
    expect(JSON.parse(secondInit.body as string).changes).toEqual(
      changes.slice(VEX_REVALIDATE_BATCH_SIZE),
    );
  });

  it("issues no POST when the Convex mutation itself rejects", async () => {
    convexMutationMock.mockRejectedValueOnce(new Error("convex mutation failed"));
    const { result } = renderUpdateMutation();

    await act(async () => {
      await expect(
        result.current.mutateAsync({ collection: "posts", data: {}, id: "doc1" }),
      ).rejects.toThrow("convex mutation failed");
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves the mutation and surfaces no error when the purge request rejects", async () => {
    // A failed purge is a stale page; a failed save is lost work. The purge
    // must never reach the caller.
    convexMutationMock.mockResolvedValueOnce(undefined);
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderUpdateMutation();

    let resolvedValue: unknown = "unset";
    await act(async () => {
      resolvedValue = await result.current.mutateAsync({
        collection: "posts",
        data: {},
        id: "doc1",
      });
    });

    expect(resolvedValue).toBeUndefined();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });

  it("sends one empty-changes POST when getChanges is omitted", async () => {
    convexMutationMock.mockResolvedValueOnce(undefined);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { result } = renderHook(
      () =>
        useVexMutation({
          collection: "posts",
          mutationFn: vexConvexApi.update,
          operation: "update",
        }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ collection: "posts", data: {}, id: "doc1" });
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(init.body as string).changes).toEqual([]);
  });
});
