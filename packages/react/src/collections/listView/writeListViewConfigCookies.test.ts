import { ADMIN_COOKIE_NAME, adminCollectionCookieName, parseAdminCollectionCookie, parseAdminCookie } from "@vexcms/core";
import { afterEach, describe, expect, it } from "vitest";
import { writeListViewChipsVisibleCookie, writeListViewDensityCookie, writeListViewSkeletonRowCountCookie, writeListViewPeekTabCookie, writeListViewPeekWidthCookie } from "./writeListViewConfigCookies";

afterEach(() => {
  document.cookie = `${ADMIN_COOKIE_NAME}=; path=/; max-age=0`;
  document.cookie = `${adminCollectionCookieName({ collection: "posts" })}=; path=/; max-age=0`;
  document.cookie = `${adminCollectionCookieName({ collection: "fields" })}=; path=/; max-age=0`;
});

function readGlobalAdminCookie() {
  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_COOKIE_NAME}=([^;]*)`));
  return parseAdminCookie({ cookieValue: match?.[1] });
}

function readCollectionAdminCookie(collectionSlug: string) {
  const name = adminCollectionCookieName({ collection: collectionSlug });
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return parseAdminCollectionCookie({ cookieValue: match?.[1] });
}

describe("writeListViewDensityCookie", () => {
  it("writes density into the consolidated global admin cookie", () => {
    writeListViewDensityCookie({ basePath: "/", density: "compact" });
    expect(readGlobalAdminCookie().density).toBe("compact");
  });

  it("overwrites a previously written value", () => {
    writeListViewDensityCookie({ basePath: "/", density: "compact" });
    writeListViewDensityCookie({ basePath: "/", density: "comfortable" });
    expect(readGlobalAdminCookie().density).toBe("comfortable");
  });
});

describe("writeListViewPeekWidthCookie", () => {
  it("writes peekWidth into the consolidated collection admin cookie", () => {
    writeListViewPeekWidthCookie({ basePath: "/", collectionSlug: "posts", width: 520 });
    expect(readCollectionAdminCookie("posts").peekWidth).toBe(520);
  });

  it("overwrites a previously written value", () => {
    writeListViewPeekWidthCookie({ basePath: "/", collectionSlug: "posts", width: 520 });
    writeListViewPeekWidthCookie({ basePath: "/", collectionSlug: "posts", width: 600 });
    expect(readCollectionAdminCookie("posts").peekWidth).toBe(600);
  });

  it("clears the width (Reset) when width is undefined", () => {
    writeListViewPeekWidthCookie({ basePath: "/", collectionSlug: "posts", width: 520 });
    writeListViewPeekWidthCookie({ basePath: "/", collectionSlug: "posts", width: undefined });
    expect(readCollectionAdminCookie("posts").peekWidth).toBeUndefined();
  });

  it("scopes the cookie independently per collection", () => {
    writeListViewPeekWidthCookie({ basePath: "/", collectionSlug: "posts", width: 520 });
    expect(readCollectionAdminCookie("fields").peekWidth).toBeUndefined();
  });

  it("preserves other fields already on the collection cookie (chipsVisible) when merging peekWidth", () => {
    writeListViewChipsVisibleCookie({ basePath: "/", collectionSlug: "posts", visible: false });
    writeListViewPeekWidthCookie({ basePath: "/", collectionSlug: "posts", width: 520 });
    const cookie = readCollectionAdminCookie("posts");
    expect(cookie.chipsVisible).toBe(false);
    expect(cookie.peekWidth).toBe(520);
  });
});

describe("writeListViewPeekTabCookie", () => {
  it("writes peekTab into the consolidated GLOBAL admin cookie (admin-wide, not per-collection)", () => {
    writeListViewPeekTabCookie({ basePath: "/", tab: "json" });
    expect(readGlobalAdminCookie().peekTab).toBe("json");
  });

  it("overwrites a previously written value", () => {
    writeListViewPeekTabCookie({ basePath: "/", tab: "json" });
    writeListViewPeekTabCookie({ basePath: "/", tab: "fields" });
    expect(readGlobalAdminCookie().peekTab).toBe("fields");
  });

  it("preserves other global fields (density) when merging peekTab", () => {
    writeListViewDensityCookie({ basePath: "/", density: "compact" });
    writeListViewPeekTabCookie({ basePath: "/", tab: "json" });
    const cookie = readGlobalAdminCookie();
    expect(cookie.density).toBe("compact");
    expect(cookie.peekTab).toBe("json");
  });
});

describe("writeListViewChipsVisibleCookie", () => {
  it("writes chipsVisible into the consolidated collection admin cookie", () => {
    writeListViewChipsVisibleCookie({ basePath: "/", collectionSlug: "posts", visible: false });
    expect(readCollectionAdminCookie("posts").chipsVisible).toBe(false);
  });

  it("overwrites a previously written value", () => {
    writeListViewChipsVisibleCookie({ basePath: "/", collectionSlug: "posts", visible: false });
    writeListViewChipsVisibleCookie({ basePath: "/", collectionSlug: "posts", visible: true });
    expect(readCollectionAdminCookie("posts").chipsVisible).toBe(true);
  });

  it("scopes the cookie independently per collection", () => {
    writeListViewChipsVisibleCookie({ basePath: "/", collectionSlug: "posts", visible: false });
    expect(readCollectionAdminCookie("fields").chipsVisible).toBeUndefined();
  });
});

describe("writeListViewSkeletonRowCountCookie", () => {
  it("writes a new view's entry under the collection-scoped admin cookie", () => {
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "default", count: 5, done: true });
    expect(readCollectionAdminCookie("posts").rowCounts).toMatchObject({ default: { n: 5, done: true } });
  });

  it("merges into an existing map instead of overwriting other views", () => {
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "default", count: 5, done: true });
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "v1", count: 2, done: false });
    expect(readCollectionAdminCookie("posts").rowCounts).toMatchObject({
      default: { n: 5, done: true },
      v1: { n: 2, done: false },
    });
  });

  it("overwrites the same view's previously written entry", () => {
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "default", count: 5, done: false });
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "default", count: 8, done: true });
    expect(readCollectionAdminCookie("posts").rowCounts).toMatchObject({ default: { n: 8, done: true } });
  });

  it("writes a count of 0", () => {
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "default", count: 0, done: true });
    expect(readCollectionAdminCookie("posts").rowCounts).toMatchObject({ default: { n: 0, done: true } });
  });

  it("writes done: false for an in-progress (not fully loaded) view", () => {
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "default", count: 10, done: false });
    expect(readCollectionAdminCookie("posts").rowCounts).toMatchObject({ default: { n: 10, done: false } });
  });

  it("scopes the cookie independently per collection", () => {
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "default", count: 5, done: true });
    expect(readCollectionAdminCookie("fields").rowCounts).toBeUndefined();
  });

  it("preserves other fields already on the collection cookie (chipsVisible) when merging rowCounts", () => {
    writeListViewChipsVisibleCookie({ basePath: "/", collectionSlug: "posts", visible: false });
    writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "default", count: 5, done: true });
    const cookie = readCollectionAdminCookie("posts");
    expect(cookie.chipsVisible).toBe(false);
    expect(cookie.rowCounts).toMatchObject({ default: { n: 5, done: true } });
  });

  // Developer-reported fix (part of the "false Modified: preview width on refresh" bug):
  // a shared view's row count settling and writing back (this function, fired from
  // `CollectionListViewData`'s own post-settle effect on EVERY load) must never disturb
  // `peekWidth` — it only ever appears in this writer's patch via the surrounding
  // read-merge-write, never as something it sets itself.
  it("preserves an existing peekWidth unchanged across repeated row-count writes, matching a shared view being refreshed without the peek ever being touched", () => {
    writeListViewPeekWidthCookie({ basePath: "/", collectionSlug: "posts", width: 444 });
    for (let i = 0; i < 5; i++) {
      writeListViewSkeletonRowCountCookie({ basePath: "/", collectionSlug: "posts", viewId: "shared1", count: 8, done: true });
    }
    expect(readCollectionAdminCookie("posts").peekWidth).toBe(444);
  });
});
