import { DRAFT_MODE_BYPASS_COOKIE } from "@vexcms/next/livePreview";
import { getSessionCookie } from "better-auth/cookies";
import { fetchQuery } from "convex/nextjs";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

vi.mock("better-auth/cookies", () => ({
  getSessionCookie: vi.fn(),
}));

vi.mock("convex/nextjs", () => ({
  fetchQuery: vi.fn(),
}));

const mockedGetSessionCookie = vi.mocked(getSessionCookie);
const mockedFetchQuery = vi.mocked(fetchQuery);

/**
 * Builds a request for `/some-page`, optionally carrying `?vexLivePreview=1`
 * and the loop-break cookie pair.
 *
 * @param options - `livePreview`, whether to append `?vexLivePreview=1`;
 *   `marker`, the `vex-live-preview` cookie value to send; `bypass`, whether
 *   to send `__prerender_bypass`.
 * @returns A `NextRequest` `proxy` can consume.
 */
function pageRequest(options: {
  bypass?: boolean;
  livePreview?: boolean;
  marker?: string;
}): NextRequest {
  const url = new URL("http://localhost/some-page");
  if (options.livePreview) { url.searchParams.set("vexLivePreview", "1"); }

  const cookieParts: string[] = [];
  if (options.marker !== undefined) { cookieParts.push(`vex-live-preview=${options.marker}`); }
  if (options.bypass) { cookieParts.push(`${DRAFT_MODE_BYPASS_COOKIE}=1`); }

  return new NextRequest(url, {
    headers: cookieParts.length > 0 ? { cookie: cookieParts.join("; ") } : undefined,
  });
}

beforeEach(() => {
  mockedGetSessionCookie.mockReset();
  mockedFetchQuery.mockReset();
});

describe("proxy", () => {
  it("passes through when the request has no `?vexLivePreview=1`", async () => {
    const response = await proxy(pageRequest({ livePreview: false }));

    expect(response.headers.get("location")).toBeNull();
    expect(mockedGetSessionCookie).not.toHaveBeenCalled();
  });

  it("passes through without re-checking the session when BOTH the marker and the Draft Mode bypass cookie are present", async () => {
    const response = await proxy(
      pageRequest({ bypass: true, livePreview: true, marker: "1" }),
    );

    expect(response.headers.get("location")).toBeNull();
    expect(mockedGetSessionCookie).not.toHaveBeenCalled();
  });

  it("hands off to the Draft Mode route when only the marker cookie is present (bypass cookie expired)", async () => {
    mockedGetSessionCookie.mockReturnValue("raw-token.signature");
    mockedFetchQuery.mockResolvedValue({ user: { id: "admin-1" } });

    const response = await proxy(
      pageRequest({ bypass: false, livePreview: true, marker: "1" }),
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/api/vex/live-preview");
    expect(location.searchParams.get("redirect")).toBe("/some-page?vexLivePreview=1");
  });

  it("hands off to the Draft Mode route when neither cookie is present and the session is authenticated", async () => {
    mockedGetSessionCookie.mockReturnValue("raw-token.signature");
    mockedFetchQuery.mockResolvedValue({ user: { id: "admin-1" } });

    const response = await proxy(pageRequest({ livePreview: true }));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(
      "/api/vex/live-preview",
    );
  });

  it("passes through when neither cookie is present and there is no session", async () => {
    mockedGetSessionCookie.mockReturnValue(undefined);

    const response = await proxy(pageRequest({ livePreview: true }));

    expect(response.headers.get("location")).toBeNull();
    expect(mockedFetchQuery).not.toHaveBeenCalled();
  });
});
