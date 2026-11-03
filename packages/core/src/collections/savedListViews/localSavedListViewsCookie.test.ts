import { describe, expect, it } from "vitest";
import { localSavedListViewsCookieName, parseLocalSavedListViewsIndexCookie } from "./localSavedListViewsCookie";

function adminCollectionCookieValue(value: Record<string, unknown>): string {
  return encodeURIComponent(JSON.stringify({ v: 1, ...value }));
}

describe("localSavedListViewsCookieName (retained for AdminLayout's retired-cookie clear)", () => {
  it("scopes the cookie per collection", () => {
    expect(localSavedListViewsCookieName({ collection: "posts" })).toBe("vex-list-views:posts");
  });
});

describe("parseLocalSavedListViewsIndexCookie", () => {
  it("returns [] when the cookie is unset", () => {
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: undefined })).toEqual([]);
  });

  it("parses localViews off the consolidated admin collection cookie", () => {
    const value = adminCollectionCookieValue({ localViews: [{ viewId: "v1", name: "My View" }] });
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: value })).toEqual([{ viewId: "v1", name: "My View" }]);
  });

  it("drops malformed entries instead of throwing", () => {
    const value = adminCollectionCookieValue({
      localViews: [{ viewId: "v1", name: "Ok" }, { viewId: 5 }, "garbage"],
    });
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: value })).toEqual([{ viewId: "v1", name: "Ok" }]);
  });

  it("returns [] for malformed JSON instead of throwing", () => {
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: "{not json" })).toEqual([]);
  });

  it("returns [] when localViews is absent", () => {
    const value = adminCollectionCookieValue({ chipsVisible: false });
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: value })).toEqual([]);
  });

  it("returns [] when the whole parsed value is not an admin-cookie-shaped object", () => {
    const value = encodeURIComponent(JSON.stringify(["v1", "v2"]));
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: value })).toEqual([]);
  });
});
