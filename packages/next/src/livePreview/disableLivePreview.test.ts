import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_LIVE_PREVIEW_ROUTE_PATH, disableLivePreview } from "./disableLivePreview";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("disableLivePreview", () => {
  it("GETs the default route path with `?disable=1`, same-origin credentials, and a manual redirect", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await disableLivePreview();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${DEFAULT_LIVE_PREVIEW_ROUTE_PATH}?disable=1`, {
      method: "GET",
      credentials: "same-origin",
      redirect: "manual",
    });
  });

  it("appends `?disable=1` to a custom route path", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await disableLivePreview("/custom/live-preview");

    expect(fetchMock).toHaveBeenCalledWith("/custom/live-preview?disable=1", expect.any(Object));
  });

  it("never throws when the request rejects", async () => {
    fetchMock.mockRejectedValue(new Error("network error"));

    await expect(disableLivePreview()).resolves.toBeUndefined();
  });

  it("never throws when `fetch` itself throws synchronously", async () => {
    fetchMock.mockImplementation(() => {
      throw new Error("boom");
    });

    await expect(disableLivePreview()).resolves.toBeUndefined();
  });
});
