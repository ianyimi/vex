import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_VEX_REVALIDATE_ENDPOINT,
  VexRevalidateProvider,
} from "../context/VexRevalidateContext";
import { useVexRevalidate } from "./useVexRevalidate";

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function DisabledWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <VexRevalidateProvider disabled>{children}</VexRevalidateProvider>
    </QueryClientProvider>
  );
}

const doc = { _creationTime: 1, _id: "d1", slug: "roadmap" };

describe("useVexRevalidate", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it('posts { collection, operation: "update", changes: [{ after: doc }] } for purgeDocument and resolves the parsed response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [], revalidated: ["/roadmap"] }), { status: 200 }),
    );
    const { result } = renderHook(() => useVexRevalidate(), { wrapper: Wrapper });

    let response: unknown;
    await act(async () => {
      response = await result.current.purgeDocument({ collection: "pages", doc });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(DEFAULT_VEX_REVALIDATE_ENDPOINT);
    expect(init).toMatchObject({
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    expect(JSON.parse(init.body as string)).toEqual({
      changes: [{ after: doc }],
      collection: "pages",
      operation: "update",
    });
    expect(response).toEqual({ errors: [], revalidated: ["/roadmap"] });
  });

  it("posts { collection, all: true } for purgeCollection", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [], revalidated: ["/features", "/roadmap"] }), {
        status: 200,
      }),
    );
    const { result } = renderHook(() => useVexRevalidate(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.purgeCollection({ collection: "pages" });
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ all: true, collection: "pages" });
  });

  it("rejects and populates `error` on a 403 response, rather than resolving silently", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));
    const { result } = renderHook(() => useVexRevalidate(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.purgeDocument({ collection: "pages", doc })).rejects.toThrow(
        /403/,
      );
    });

    // `error` lands on a subsequent render, not synchronously with the
    // rejection the assertion above already caught.
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toMatch(/403/);
  });

  it("rejects without calling fetch when the provider disables revalidation", async () => {
    const { result } = renderHook(() => useVexRevalidate(), { wrapper: DisabledWrapper });

    await act(async () => {
      await expect(result.current.purgeCollection({ collection: "pages" })).rejects.toThrow(
        /disabled/i,
      );
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
