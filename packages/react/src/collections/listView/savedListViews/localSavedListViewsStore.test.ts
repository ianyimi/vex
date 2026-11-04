import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { adminCollectionCookieName, parseLocalSavedListViewsIndexCookie, type LocalSavedListViewsIndexEntry } from "@vexcms/core";
import {
  generateViewId,
  localViewsStorageKey,
  removeLocalSavedListView,
  saveLocalSavedListView,
  useLocalSavedListViews,
} from "./localSavedListViewsStore";

const project = "https://example.convex.cloud";
const collection = "posts";

function readListViewsCookie(): LocalSavedListViewsIndexEntry[] {
  const name = adminCollectionCookieName({ collection });
  const prefix = `${name}=`;
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
  return parseLocalSavedListViewsIndexCookie({ cookieValue: raw });
}

function clearCookies() {
  document.cookie
    .split("; ")
    .map((entry) => entry.split("=")[0])
    .filter((name): name is string => !!name)
    .forEach((name) => {
      document.cookie = `${name}=; path=/; max-age=0`;
    });
}

beforeEach(() => {
  window.localStorage.clear();
  clearCookies();
});

afterEach(() => {
  window.localStorage.clear();
  clearCookies();
});

describe("localSavedListViewsStore", () => {
  it("starts with no local views when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection }));
    expect(result.current).toEqual([]);
  });

  it("saveLocalSavedListView stores the view and updates a mounted hook", () => {
    const { result } = renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection }));
    expect(result.current).toEqual([]);

    act(() => {
      saveLocalSavedListView({
        basePath: "/",
        project,
        collection,
        view: { viewId: "v1", name: "My View", state: { pageSize: 25 } },
      });
    });

    expect(result.current).toEqual([{ viewId: "v1", name: "My View", state: { pageSize: 25 } }]);
    const raw = window.localStorage.getItem(localViewsStorageKey({ project, collection }));
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      version: 1,
      views: [{ viewId: "v1", name: "My View", state: { pageSize: 25 } }],
    });
  });

  it("saveLocalSavedListView replaces the existing entry in place when the viewId matches", () => {
    saveLocalSavedListView({ basePath: "/", project, collection, view: { viewId: "v1", name: "Original", state: {} } });
    saveLocalSavedListView({
      basePath: "/",
      project,
      collection,
      view: { viewId: "v1", name: "Renamed", description: "Updated", state: {} },
    });

    const { result } = renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection }));
    expect(result.current).toEqual([{ viewId: "v1", name: "Renamed", description: "Updated", state: {} }]);
  });

  it("removeLocalSavedListView removes one view by viewId and leaves the rest", () => {
    saveLocalSavedListView({ basePath: "/", project, collection, view: { viewId: "v1", name: "A", state: {} } });
    saveLocalSavedListView({ basePath: "/", project, collection, view: { viewId: "v2", name: "B", state: {} } });

    const { result } = renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection }));

    act(() => {
      removeLocalSavedListView({ basePath: "/", project, collection, viewId: "v1" });
    });

    expect(result.current).toEqual([{ viewId: "v2", name: "B", state: {} }]);
  });

  it("keys storage by project AND collection, so the same collection slug in two projects stays isolated", () => {
    saveLocalSavedListView({ basePath: "/", project: "https://a.convex.cloud", collection, view: { viewId: "v1", name: "A", state: {} } });
    saveLocalSavedListView({ basePath: "/", project: "https://b.convex.cloud", collection, view: { viewId: "v1", name: "B", state: {} } });

    const a = renderHook(() => useLocalSavedListViews({ basePath: "/", project: "https://a.convex.cloud", collection }));
    const b = renderHook(() => useLocalSavedListViews({ basePath: "/", project: "https://b.convex.cloud", collection }));

    expect(a.result.current).toEqual([{ viewId: "v1", name: "A", state: {} }]);
    expect(b.result.current).toEqual([{ viewId: "v1", name: "B", state: {} }]);
  });

  it("resolves malformed JSON to an empty array instead of throwing", () => {
    window.localStorage.setItem(localViewsStorageKey({ project, collection }), "{not json");
    const { result } = renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection }));
    expect(result.current).toEqual([]);
  });

  it("resolves JSON that does not match the stored envelope shape to an empty array", () => {
    window.localStorage.setItem(localViewsStorageKey({ project, collection }), JSON.stringify({ foo: "bar" }));
    const { result } = renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection }));
    expect(result.current).toEqual([]);
  });

  it("picks up a cross-tab write via the storage event", () => {
    const { result } = renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection }));
    expect(result.current).toEqual([]);

    const envelope = { version: 1, views: [{ viewId: "v1", name: "A", state: {} }] };
    window.localStorage.setItem(localViewsStorageKey({ project, collection }), JSON.stringify(envelope));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: localViewsStorageKey({ project, collection }),
          newValue: JSON.stringify(envelope),
        }),
      );
    });

    expect(result.current).toEqual(envelope.views);
  });

  it("generateViewId returns a distinct string each call", () => {
    const a = generateViewId();
    const b = generateViewId();
    expect(typeof a).toBe("string");
    expect(a).not.toBe(b);
  });

  it("mirrors saveLocalSavedListView into the vex-list-views cookie index", () => {
    act(() => {
      saveLocalSavedListView({ basePath: "/", project, collection, view: { viewId: "v1", name: "My View", state: {} } });
    });
    expect(readListViewsCookie()).toEqual([{ viewId: "v1", name: "My View" }]);
  });

  it("mirrors removeLocalSavedListView into the cookie index", () => {
    saveLocalSavedListView({ basePath: "/", project, collection, view: { viewId: "v1", name: "A", state: {} } });
    saveLocalSavedListView({ basePath: "/", project, collection, view: { viewId: "v2", name: "B", state: {} } });
    act(() => {
      removeLocalSavedListView({ basePath: "/", project, collection, viewId: "v1" });
    });
    expect(readListViewsCookie()).toEqual([{ viewId: "v2", name: "B" }]);
  });

  it("prunes a stale cookie entry whose localStorage view is gone, on hydration", () => {
    // Isolated to its own collection slug: `pruneStaleListViewsCookie`'s
    // `prunedForKey` dedup is keyed per collection for the lifetime of this
    // module (once this hydration pass has run), so reusing the
    // file-level `collection` constant here would already be marked pruned
    // by the earlier tests' own `useLocalSavedListViews({ project, collection })`
    // mounts above, and this test's own prune pass would silently no-op.
    const pruneCollection = "posts-prune-test";
    document.cookie = `${adminCollectionCookieName({ collection: pruneCollection })}=${encodeURIComponent(
      JSON.stringify({ v: 1, localViews: [{ viewId: "ghost", name: "Ghost" }] }),
    )}; path=/`;
    renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection: pruneCollection }));
    const name = adminCollectionCookieName({ collection: pruneCollection });
    const prefix = `${name}=`;
    const raw = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(prefix))
      ?.slice(prefix.length);
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: raw })).toEqual([]);
  });

  it("repairs an empty/wrong cookie when localStorage already has real local views (regression: an earlier one-directional prune never wrote a missing/empty cookie back)", () => {
    // Isolated to its own collection slug, same reason as the prune test
    // above (`prunedForKey`'s per-collection, per-module-lifetime dedup).
    const repairCollection = "posts-repair-test";
    saveLocalSavedListView({
      basePath: "/",
      project,
      collection: repairCollection,
      view: { viewId: "v1", name: "Real View", state: {} },
    });
    // Simulates the bug this regression guards: the cookie somehow ended up
    // empty (an earlier bug, a cookie cleared independently of
    // `localStorage`, a stale deploy) while `localStorage` still has the
    // real view — overwrites the correct cookie `saveLocalSavedListView` just wrote,
    // the same way the live bug was found (a persistent browser profile
    // with real local views but an empty `vex-list-views:posts` cookie).
    document.cookie = `${adminCollectionCookieName({ collection: repairCollection })}=${encodeURIComponent(
      JSON.stringify({ v: 1, localViews: [] }),
    )}; path=/`;
    renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection: repairCollection }));
    const name = adminCollectionCookieName({ collection: repairCollection });
    const prefix = `${name}=`;
    const raw = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(prefix))
      ?.slice(prefix.length);
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: raw })).toEqual([{ viewId: "v1", name: "Real View" }]);
  });

  it("corrects a cookie entry whose name has drifted from localStorage, not just a missing/extra id", () => {
    const renameCollection = "posts-rename-test";
    saveLocalSavedListView({
      basePath: "/",
      project,
      collection: renameCollection,
      view: { viewId: "v1", name: "Current Name", state: {} },
    });
    // A stale cookie entry for the SAME id but an outdated name — e.g. a
    // rename that landed in `localStorage` (and would normally also
    // rewrite the cookie via `saveLocalSavedListView`'s own write path) but whose
    // cookie write was independently lost.
    document.cookie = `${adminCollectionCookieName({ collection: renameCollection })}=${encodeURIComponent(
      JSON.stringify({ v: 1, localViews: [{ viewId: "v1", name: "Old Name" }] }),
    )}; path=/`;
    renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection: renameCollection }));
    const name = adminCollectionCookieName({ collection: renameCollection });
    const prefix = `${name}=`;
    const raw = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(prefix))
      ?.slice(prefix.length);
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: raw })).toEqual([{ viewId: "v1", name: "Current Name" }]);
  });

  it("writes nothing new when the cookie already exactly mirrors localStorage", () => {
    const stableCollection = "posts-stable-test";
    saveLocalSavedListView({
      basePath: "/",
      project,
      collection: stableCollection,
      view: { viewId: "v1", name: "Stable View", state: {} },
    });
    const name = adminCollectionCookieName({ collection: stableCollection });
    const prefix = `${name}=`;
    const before = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(prefix))
      ?.slice(prefix.length);
    renderHook(() => useLocalSavedListViews({ basePath: "/", project, collection: stableCollection }));
    const after = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(prefix))
      ?.slice(prefix.length);
    expect(after).toEqual(before);
    expect(parseLocalSavedListViewsIndexCookie({ cookieValue: after })).toEqual([{ viewId: "v1", name: "Stable View" }]);
  });

  it("saveLocalSavedListView throws for the reserved \"default\" viewId", () => {
    expect(() =>
      saveLocalSavedListView({ basePath: "/", project, collection, view: { viewId: "default", name: "Hijacked", state: {} } }),
    ).toThrow(/reserved default-view id/);
    expect(readListViewsCookie()).toEqual([]);
  });

  it("removeLocalSavedListView throws for the reserved \"default\" viewId", () => {
    expect(() => removeLocalSavedListView({ basePath: "/", project, collection, viewId: "default" })).toThrow(/reserved default-view id/);
  });
});
