import { describe, expect, it } from "vitest";
import { ADMIN_COOKIE_NAME, adminCollectionCookieName } from "../../adminCookie";
import { LIST_VIEW_CONFIG_COOKIES, listChipsVisibleCookieName, parseListViewConfigCookies } from "./listViewConfigCookies";

function cookieJar(entries: Record<string, string>) {
  return { get: (name: string) => (name in entries ? { value: entries[name] } : undefined) };
}

function adminCookieValue(value: Record<string, unknown>): string {
  return encodeURIComponent(JSON.stringify({ v: 1, ...value }));
}

describe("parseListViewConfigCookies", () => {
  it("defaults density to comfortable and chipsVisible to true with no cookies", () => {
    expect(parseListViewConfigCookies({ cookies: cookieJar({}), collectionSlug: "posts" })).toEqual({
      density: "comfortable",
      chipsVisible: true,
      peekWidth: 384,
      peekTab: "fields",
    });
  });

  it("reads density off the consolidated vex-admin cookie", () => {
    expect(
      parseListViewConfigCookies({
        cookies: cookieJar({ [ADMIN_COOKIE_NAME]: adminCookieValue({ density: "compact" }) }),
        collectionSlug: "posts",
      }),
    ).toEqual({ density: "compact", chipsVisible: true, peekWidth: 384, peekTab: "fields" });
  });

  it("falls back to comfortable for an unrecognized value", () => {
    expect(
      parseListViewConfigCookies({
        cookies: cookieJar({ [ADMIN_COOKIE_NAME]: adminCookieValue({ density: "roomy" }) }),
        collectionSlug: "posts",
      }),
    ).toEqual({ density: "comfortable", chipsVisible: true, peekWidth: 384, peekTab: "fields" });
  });

  it("hides the chip row only when the collection-scoped admin cookie's chipsVisible is exactly false", () => {
    expect(
      parseListViewConfigCookies({
        cookies: cookieJar({
          [adminCollectionCookieName({ collection: "posts" })]: adminCookieValue({ chipsVisible: false }),
        }),
        collectionSlug: "posts",
      }),
    ).toEqual({ density: "comfortable", chipsVisible: false, peekWidth: 384, peekTab: "fields" });
  });

  it("ignores another collection's chip-visibility cookie", () => {
    expect(
      parseListViewConfigCookies({
        cookies: cookieJar({
          [adminCollectionCookieName({ collection: "fields" })]: adminCookieValue({ chipsVisible: false }),
        }),
        collectionSlug: "posts",
      }),
    ).toEqual({ density: "comfortable", chipsVisible: true, peekWidth: 384, peekTab: "fields" });
  });

  it("combines density (global) and chipsVisible (collection) from their own separate cookies", () => {
    expect(
      parseListViewConfigCookies({
        cookies: cookieJar({
          [ADMIN_COOKIE_NAME]: adminCookieValue({ density: "compact" }),
          [adminCollectionCookieName({ collection: "posts" })]: adminCookieValue({ chipsVisible: false }),
        }),
        collectionSlug: "posts",
      }),
    ).toEqual({ density: "compact", chipsVisible: false, peekWidth: 384, peekTab: "fields" });
  });

  it("reads the peek panel's width off the collection-scoped admin cookie", () => {
    expect(
      parseListViewConfigCookies({
        cookies: cookieJar({
          [adminCollectionCookieName({ collection: "posts" })]: adminCookieValue({ peekWidth: 520 }),
        }),
        collectionSlug: "posts",
      }),
    ).toEqual({ density: "comfortable", chipsVisible: true, peekWidth: 520, peekTab: "fields" });
  });

  it("reads the peek panel's remembered tab off the GLOBAL vex-admin cookie (admin-wide, not per-collection)", () => {
    expect(
      parseListViewConfigCookies({
        cookies: cookieJar({ [ADMIN_COOKIE_NAME]: adminCookieValue({ peekTab: "json" }) }),
        collectionSlug: "posts",
      }),
    ).toEqual({ density: "comfortable", chipsVisible: true, peekWidth: 384, peekTab: "json" });
  });

  it("falls back to fields for an unrecognized peekTab value", () => {
    expect(
      parseListViewConfigCookies({
        cookies: cookieJar({ [ADMIN_COOKIE_NAME]: adminCookieValue({ peekTab: "notes" }) }),
        collectionSlug: "posts",
      }),
    ).toEqual({ density: "comfortable", chipsVisible: true, peekWidth: 384, peekTab: "fields" });
  });
});

describe("LIST_VIEW_CONFIG_COOKIES / listChipsVisibleCookieName (retained for AdminLayout's retired-cookie clear)", () => {
  it("retains the old cookie name prefixes", () => {
    expect(LIST_VIEW_CONFIG_COOKIES.density).toBe("vex-list-density");
    expect(LIST_VIEW_CONFIG_COOKIES.chipsVisible).toBe("vex-list-chips");
  });

  it("scopes the retired cookie name to the collection slug", () => {
    expect(listChipsVisibleCookieName({ collectionSlug: "posts" })).toBe("vex-list-chips:posts");
  });
});
