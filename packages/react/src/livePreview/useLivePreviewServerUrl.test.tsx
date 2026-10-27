import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useLivePreviewServerUrl } from "./useLivePreviewServerUrl";

const { convexQueryMock } = vi.hoisted(() => ({ convexQueryMock: vi.fn() }));

/**
 * When set, the NEXT query resolves from this promise instead of answering
 * immediately — the only way to observe what the hook returns mid-flight.
 */
let secondQueryPromise: Promise<string> | undefined;

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (_reference: unknown, args: unknown) => {
    convexQueryMock(args);
    return args === "skip"
      ? { queryKey: ["skipped"], queryFn: () => null, enabled: false }
      : {
          queryKey: ["livePreviewUrl", args],
          queryFn: () => {
            const pending = secondQueryPromise;
            if (pending) {
              secondQueryPromise = undefined;
              return pending;
            }
            return "/resolved-by-server";
          },
        };
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useLivePreviewServerUrl", () => {
  it("passes a client-resolved URL through without querying Convex", () => {
    convexQueryMock.mockClear();
    const { result } = renderHook(
      () =>
        useLivePreviewServerUrl({
          url: (doc: { slug?: string }) => `/${doc.slug}`,
          clientUrl: "/already-resolved?vexLivePreview=1",
          kind: "collection",
          slug: "pages",
          documentId: "doc1",
          formValues: {},
        }),
      { wrapper },
    );

    expect(result.current).toBe("/already-resolved?vexLivePreview=1");
    // The round trip is opt-in by config shape: a string or client resolver
    // must never cost one.
    expect(convexQueryMock).toHaveBeenCalledWith("skip");
  });

  it("serves the server-rendered initial URL before the query answers", () => {
    const { result } = renderHook(
      () =>
        useLivePreviewServerUrl({
          url: { server: () => "/whatever" },
          clientUrl: undefined,
          initialUrl: "/from-next?vexLivePreview=1",
          kind: "collection",
          slug: "pages",
          documentId: "doc1",
          formValues: {},
        }),
      { wrapper },
    );

    expect(result.current).toBe("/from-next?vexLivePreview=1");
  });

  it("appends the preview params to a server-resolved URL", async () => {
    const { result } = renderHook(
      () =>
        useLivePreviewServerUrl({
          url: { server: () => "/whatever" },
          clientUrl: undefined,
          kind: "collection",
          slug: "pages",
          documentId: "doc1",
          formValues: {},
        }),
      { wrapper },
    );

    // Without the param the page renders normally and listens to nothing, so a
    // server-resolved URL needs the same treatment as a client-resolved one.
    await waitFor(() =>
      expect(result.current).toBe("/resolved-by-server?vexLivePreview=1"),
    );
  });

  it("holds the resolved URL while a later edit's query is in flight", async () => {
    // Regression: values are part of the query key, so each edit starts a new
    // query whose data is briefly `undefined`. Falling back to `initialUrl`
    // there changed the iframe's `src` and forced a reload, flashing the SAVED
    // document between edits.
    let resolveSecond: ((value: string) => void) | undefined;
    convexQueryMock.mockClear();

    const { result, rerender } = renderHook(
      (formValues: Record<string, unknown>) =>
        useLivePreviewServerUrl({
          url: { server: () => "/whatever" },
          clientUrl: undefined,
          initialUrl: "/from-next?vexLivePreview=1",
          kind: "collection",
          slug: "pages",
          documentId: "doc1",
          formValues,
          debounceMs: 0,
        }),
      { wrapper, initialProps: { title: "first" } },
    );

    await waitFor(() => expect(result.current).toBe("/resolved-by-server?vexLivePreview=1"));

    secondQueryPromise = new Promise<string>((resolve) => {
      resolveSecond = resolve;
    });
    rerender({ title: "second" });

    // The in-flight window: still the previously resolved URL, never
    // `initialUrl`. Sampled across the whole gap — a single reading could miss
    // a one-render revert, which is exactly what the flash was.
    for (let sample = 0; sample < 10; sample += 1) {
      expect(result.current).toBe("/resolved-by-server?vexLivePreview=1");
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    resolveSecond?.("/resolved-again");
    await waitFor(() => expect(result.current).toBe("/resolved-again?vexLivePreview=1"));
  });

  it("carries the temp-id params while the document is unsaved", async () => {
    const { result } = renderHook(
      () =>
        useLivePreviewServerUrl({
          url: { server: () => "/whatever" },
          clientUrl: undefined,
          kind: "collection",
          slug: "pages",
          tempId: "temp-1",
          formValues: {},
        }),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current).toBe(
        "/resolved-by-server?vexLivePreview=1&vexLivePreviewId=temp-1&vexLivePreviewCollection=pages",
      ),
    );
  });
});
