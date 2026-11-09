import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createVexDraftModeRoute } from "./createVexDraftModeRoute";

const enable = vi.fn();
const disable = vi.fn();

vi.mock("next/headers", () => ({
  draftMode: vi.fn(async () => ({ disable, enable, isEnabled: false })),
}));

/**
 * Builds a GET request for the draft-mode route, carrying `redirect`/`disable`
 * as search params when given.
 *
 * @param params - `redirect`, the raw `redirect` param value; `disable`, the raw
 *   `disable` param value. Both omitted when absent.
 * @returns A `NextRequest` the handler can consume.
 */
function draftRequest(params: { disable?: string; redirect?: string } = {}): NextRequest {
  const url = new URL("http://localhost/api/vex/live-preview");
  if (params.redirect !== undefined) url.searchParams.set("redirect", params.redirect);
  if (params.disable !== undefined) url.searchParams.set("disable", params.disable);
  return new NextRequest(url);
}

beforeEach(() => {
  enable.mockClear();
  disable.mockClear();
});

describe("createVexDraftModeRoute", () => {
  describe("enable", () => {
    it("returns 401 and never enables draft mode when there is no session token and no `redirect`", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => null });

      const response = await route.GET(draftRequest());

      expect(response.status).toBe(401);
      expect(enable).not.toHaveBeenCalled();
      expect(disable).not.toHaveBeenCalled();
    });

    it("returns 400 and never enables draft mode when `redirect` is missing but a session is present", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => "token" });

      const response = await route.GET(draftRequest());

      expect(response.status).toBe(400);
      expect(enable).not.toHaveBeenCalled();
    });

    it("returns 400 and never enables draft mode for a protocol-relative `redirect` (open-redirect guard)", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => "token" });

      const response = await route.GET(draftRequest({ redirect: "//evil.example" }));

      expect(response.status).toBe(400);
      expect(enable).not.toHaveBeenCalled();
    });

    it("returns 400 and never enables draft mode for a backslash-prefixed `redirect` (open-redirect guard)", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => "token" });

      const response = await route.GET(draftRequest({ redirect: "/\\evil.example" }));

      expect(response.status).toBe(400);
      expect(enable).not.toHaveBeenCalled();
    });

    it("enables draft mode, sets the live-preview cookie, and redirects to a same-origin `redirect` target", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => "token" });

      const response = await route.GET(draftRequest({ redirect: "/about?vexLivePreview=1" }));

      expect(enable).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/about?vexLivePreview=1");
      expect(response.cookies.get("vex-live-preview")?.value).toBe("1");
    });
  });

  describe("signed-out disable", () => {
    it("disables draft mode, clears the live-preview cookie, and redirects to `redirect` when the proxy hands off with no session", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => null });

      const response = await route.GET(draftRequest({ redirect: "/about" }));

      expect(disable).toHaveBeenCalledOnce();
      expect(enable).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/about");
      expect(response.cookies.get("vex-live-preview")?.value).toBe("");
    });

    it("returns 400 and never disables draft mode for an open-redirect `redirect` even with no session", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => null });

      const response = await route.GET(draftRequest({ redirect: "//evil.example" }));

      expect(response.status).toBe(400);
      expect(disable).not.toHaveBeenCalled();
    });
  });

  describe("explicit disable (`?disable=1`)", () => {
    it("disables draft mode, clears the live-preview cookie, and redirects to `redirect` when a session is present", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => "token" });

      const response = await route.GET(draftRequest({ disable: "1", redirect: "/about" }));

      expect(disable).toHaveBeenCalledOnce();
      expect(enable).not.toHaveBeenCalled();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/about");
      expect(response.cookies.get("vex-live-preview")?.value).toBe("");
    });

    it("disables draft mode and redirects even with no session — leaving preview needs no authorization", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => null });

      const response = await route.GET(draftRequest({ disable: "1", redirect: "/about" }));

      expect(disable).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/about");
    });

    it("redirects to `/` when `redirect` is absent", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => "token" });

      const response = await route.GET(draftRequest({ disable: "1" }));

      expect(disable).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("http://localhost/");
    });

    it("returns 400 and never disables draft mode for an open-redirect `redirect`", async () => {
      const route = createVexDraftModeRoute({ getToken: async () => "token" });

      const response = await route.GET(draftRequest({ disable: "1", redirect: "/\\evil.example" }));

      expect(response.status).toBe(400);
      expect(disable).not.toHaveBeenCalled();
    });
  });
});
