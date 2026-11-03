import { ADMIN_COOKIE_NAME, adminCollectionCookieName, parseAdminCollectionCookie, parseAdminCookie } from "@vexcms/core";
import { afterEach, describe, expect, it } from "vitest";
import { writeAdminCollectionCookie, writeAdminCookie } from "./adminCookie";

afterEach(() => {
  document.cookie = `${ADMIN_COOKIE_NAME}=; path=/; max-age=0`;
  document.cookie = `${adminCollectionCookieName({ collection: "posts" })}=; path=/; max-age=0`;
});

function readRawCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

// `basePath: "/"` below exercises the read-merge-write/skip-when-unchanged logic, which is
// orthogonal to the `Path` attribute's value — jsdom's own cookie jar correctly filters
// `document.cookie` by the CURRENT page's URL path vs. a cookie's own `Path` (same as a real
// browser), so a `Path=/admin` cookie is invisible from jsdom's default test URL
// (`http://localhost:3000/`) exactly as it would be on a real public page at `/` — that
// filtering is covered by its own dedicated test below instead, which moves jsdom's URL under
// the basePath first.

describe("writeAdminCookie", () => {
  it("writes the global cookie", () => {
    writeAdminCookie({ basePath: "/", patch: { density: "compact" } });
    expect(parseAdminCookie({ cookieValue: readRawCookie(ADMIN_COOKIE_NAME) })).toEqual({
      v: 1,
      density: "compact",
    });
  });

  it("merges into the existing value instead of overwriting other fields", () => {
    writeAdminCookie({ basePath: "/", patch: { density: "compact" } });
    writeAdminCookie({ basePath: "/", patch: { sidebarOpen: false } });
    expect(parseAdminCookie({ cookieValue: readRawCookie(ADMIN_COOKIE_NAME) })).toEqual({
      v: 1,
      density: "compact",
      sidebarOpen: false,
    });
  });

  it("overwrites an existing field's value", () => {
    writeAdminCookie({ basePath: "/", patch: { density: "compact" } });
    writeAdminCookie({ basePath: "/", patch: { density: "comfortable" } });
    expect(parseAdminCookie({ cookieValue: readRawCookie(ADMIN_COOKIE_NAME) })?.density).toBe("comfortable");
  });

  it("skips the write when the merged result is unchanged from the current cookie", () => {
    writeAdminCookie({ basePath: "/", patch: { density: "compact" } });
    const before = readRawCookie(ADMIN_COOKIE_NAME);
    writeAdminCookie({ basePath: "/", patch: { density: "compact" } });
    const after = readRawCookie(ADMIN_COOKIE_NAME);
    expect(after).toBe(before);
  });
});

describe("writeAdminCollectionCookie", () => {
  it("writes the collection cookie", () => {
    writeAdminCollectionCookie({ basePath: "/", collection: "posts", patch: { chipsVisible: false } });
    expect(
      parseAdminCollectionCookie({ cookieValue: readRawCookie(adminCollectionCookieName({ collection: "posts" })) }),
    ).toEqual({ v: 1, chipsVisible: false });
  });

  it("merges into the existing value instead of overwriting other fields", () => {
    writeAdminCollectionCookie({ basePath: "/", collection: "posts", patch: { chipsVisible: false } });
    writeAdminCollectionCookie({
      basePath: "/",
      collection: "posts",
      patch: { localViews: [{ viewId: "v1", name: "Tab" }] },
    });
    expect(
      parseAdminCollectionCookie({ cookieValue: readRawCookie(adminCollectionCookieName({ collection: "posts" })) }),
    ).toEqual({ v: 1, chipsVisible: false, localViews: [{ viewId: "v1", name: "Tab" }] });
  });

  it("scopes the cookie independently per collection", () => {
    writeAdminCollectionCookie({ basePath: "/", collection: "posts", patch: { chipsVisible: false } });
    expect(readRawCookie(adminCollectionCookieName({ collection: "fields" }))).toBeUndefined();
  });

  it("skips the write when the merged result is unchanged from the current cookie", () => {
    writeAdminCollectionCookie({ basePath: "/", collection: "posts", patch: { chipsVisible: false } });
    const before = readRawCookie(adminCollectionCookieName({ collection: "posts" }));
    writeAdminCollectionCookie({ basePath: "/", collection: "posts", patch: { chipsVisible: false } });
    const after = readRawCookie(adminCollectionCookieName({ collection: "posts" }));
    expect(after).toBe(before);
  });

  // Developer-reported fix: `writeListViewSkeletonRowCountCookie`'s own LRU-capped `rowCounts` merge
  // used to call `readCookieValue` a SECOND, earlier time (to compute the map it then
  // handed over as a flat patch) before this function's own internal read — a function
  // patch closes that gap by computing the patch from the EXACT SAME `current` this
  // function reads, so there is only ever one read per write call.
  it("a function patch receives the SAME fresh `current` this function reads internally, not a separately-read snapshot", () => {
    writeAdminCollectionCookie({ basePath: "/", collection: "posts", patch: { peekWidth: 444 } });
    let receivedCurrent: unknown;
    writeAdminCollectionCookie({
      basePath: "/",
      collection: "posts",
      patch: (current) => {
        receivedCurrent = current;
        return { chipsVisible: false };
      },
    });
    expect(receivedCurrent).toEqual({ v: 1, peekWidth: 444 });
    expect(
      parseAdminCollectionCookie({ cookieValue: readRawCookie(adminCollectionCookieName({ collection: "posts" })) }),
    ).toEqual({ v: 1, peekWidth: 444, chipsVisible: false });
  });

  // The actual lost-update scenario a function patch prevents: a caller whose patch
  // depends on reading the CURRENT value first (like `writeListViewSkeletonRowCountCookie`'s own
  // `rowCounts` LRU merge) must never compute that patch against a snapshot that's gone
  // stale by the time the write actually lands — simulated here by a SECOND write landing
  // (from a sibling writer) in between a function patch's own read and its return, which a
  // flat-object patch computed from an EARLIER separate read could never observe.
  it("a function patch sees writes that happened before it runs, even ones from a different field entirely", () => {
    writeAdminCollectionCookie({ basePath: "/", collection: "posts", patch: { peekWidth: 384 } });
    writeAdminCollectionCookie({
      basePath: "/",
      collection: "posts",
      patch: (current) => {
        // A sibling writer (e.g. a resize committed by another effect) lands here,
        // BETWEEN this patch function's own read and its write — a real possibility
        // once any writer's patch computation does async work before returning.
        writeAdminCollectionCookie({ basePath: "/", collection: "posts", patch: { peekWidth: 520 } });
        return { rowCounts: { default: { n: current.rowCounts?.default?.n ?? 0, done: true, seq: 1 } } };
      },
    });
    // The outer write's OWN internal `current` was read before the inner write landed, so
    // its merge legitimately reverts `peekWidth` to 384 here (the same "last write wins"
    // behavior every cookie read-merge-write has) — the real guarantee this test proves is
    // that `rowCounts`' own merge is never computed from a STALER, SEPARATELY-read snapshot
    // than the one `writeAdminCollectionCookie` itself commits against.
    expect(
      parseAdminCollectionCookie({ cookieValue: readRawCookie(adminCollectionCookieName({ collection: "posts" })) }),
    ).toEqual({ v: 1, peekWidth: 384, rowCounts: { default: { n: 0, done: true, seq: 1 } } });
  });
});

describe("Path scoping", () => {
  it("a cookie written with basePath '/admin' is invisible outside that path, and visible under it", () => {
    const originalHref = window.location.href;
    try {
      // Write while jsdom's URL is at the site root — `document.cookie`'s own Path-based
      // visibility filtering (same rule a real browser enforces) means a `Path=/admin` cookie
      // written from here is immediately invisible, same as a real public page would see.
      writeAdminCookie({ basePath: "/admin", patch: { density: "compact" } });
      expect(readRawCookie(ADMIN_COOKIE_NAME)).toBeUndefined();

      // Move under the scoped path and write again — now it's visible.
      window.history.pushState({}, "", "/admin/collections/posts");
      writeAdminCookie({ basePath: "/admin", patch: { density: "compact" } });
      expect(parseAdminCookie({ cookieValue: readRawCookie(ADMIN_COOKIE_NAME) })).toEqual({
        v: 1,
        density: "compact",
      });

      // Move back to the root — the `/admin`-scoped cookie is invisible again.
      window.history.pushState({}, "", "/");
      expect(readRawCookie(ADMIN_COOKIE_NAME)).toBeUndefined();
    } finally {
      window.history.pushState({}, "", originalHref);
      document.cookie = `${ADMIN_COOKIE_NAME}=; path=/admin; max-age=0`;
    }
  });
});
