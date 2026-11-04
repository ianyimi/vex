import { describe, expect, it } from "vitest";
import {
  applyListViewSkeletonRowCountUpdate,
  LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES,
  listViewSkeletonRowCountCookieName,
  parseListViewSkeletonRowCountCookie,
} from "./listViewSkeletonRowCountCookie";

describe("listViewSkeletonRowCountCookieName", () => {
  it("scopes the cookie per collection", () => {
    expect(listViewSkeletonRowCountCookieName({ collection: "posts" })).toBe("vex-list-rows:posts");
  });
});

function adminCollectionCookieValue(rowCounts: unknown): string {
  return encodeURIComponent(JSON.stringify({ v: 1, rowCounts }));
}

describe("parseListViewSkeletonRowCountCookie", () => {
  it("returns {} when the cookie is unset", () => {
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: undefined })).toEqual({});
  });

  it("parses rowCounts off the consolidated admin collection cookie", () => {
    const value = adminCollectionCookieValue({ default: { n: 8, done: true }, v1: { n: 3, done: false } });
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: value })).toEqual({
      default: { n: 8, done: true },
      v1: { n: 3, done: false },
    });
  });

  it("parses a zero count", () => {
    const value = adminCollectionCookieValue({ default: { n: 0, done: true } });
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: value })).toEqual({ default: { n: 0, done: true } });
  });

  it("drops malformed entries instead of throwing", () => {
    const value = adminCollectionCookieValue({
      v1: { n: 3, done: true },
      v2: { n: -1, done: true },
      v3: { n: 1.5, done: true },
      v4: { n: "nope", done: true },
      v5: { n: 3, done: "nope" },
      v6: { n: 3 },
      v7: 3,
      v8: null,
    });
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: value })).toEqual({ v1: { n: 3, done: true } });
  });

  it("drops the pre-footer-tracking bare-number shape instead of guessing `done`", () => {
    const value = adminCollectionCookieValue({ default: 8 });
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: value })).toEqual({});
  });

  it("returns {} for malformed JSON instead of throwing", () => {
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: "{not json" })).toEqual({});
  });

  it("returns {} when rowCounts is absent, or the whole cookie is an array/non-object", () => {
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: adminCollectionCookieValue(undefined) })).toEqual({});
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: encodeURIComponent(JSON.stringify([1, 2])) })).toEqual({});
    expect(parseListViewSkeletonRowCountCookie({ cookieValue: encodeURIComponent(JSON.stringify(5)) })).toEqual({});
  });
});

describe("applyListViewSkeletonRowCountUpdate", () => {
  it("adds a new view entry", () => {
    const map = applyListViewSkeletonRowCountUpdate({ map: {}, viewId: "default", count: 5, done: true });
    expect(map.default).toMatchObject({ n: 5, done: true });
  });

  it("overwrites an existing view's entry", () => {
    const map = { default: { n: 5, done: true } };
    const next = applyListViewSkeletonRowCountUpdate({ map, viewId: "default", count: 8, done: false });
    expect(next.default).toMatchObject({ n: 8, done: false });
  });

  it("never mutates the input map", () => {
    const map = { default: { n: 5, done: true } };
    applyListViewSkeletonRowCountUpdate({ map, viewId: "default", count: 8, done: false });
    expect(map).toEqual({ default: { n: 5, done: true } });
  });

  it("caps the map at LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES, dropping the oldest entry first", () => {
    let map: ReturnType<typeof applyListViewSkeletonRowCountUpdate> = {};
    for (let i = 0; i < LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES; i++) {
      map = applyListViewSkeletonRowCountUpdate({ map, viewId: `v${i}`, count: i, done: true });
    }
    expect(Object.keys(map)).toHaveLength(LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES);
    // One more entry should drop the OLDEST ("v0"), not a random one.
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "vNew", count: 99, done: true });
    expect(Object.keys(map)).toHaveLength(LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES);
    expect(map.v0).toBeUndefined();
    expect(map.v1).toMatchObject({ n: 1, done: true });
    expect(map.vNew).toMatchObject({ n: 99, done: true });
  });

  it("re-inserting an existing entry refreshes its recency (not dropped next as oldest)", () => {
    let map: ReturnType<typeof applyListViewSkeletonRowCountUpdate> = {};
    for (let i = 0; i < LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES; i++) {
      map = applyListViewSkeletonRowCountUpdate({ map, viewId: `v${i}`, count: i, done: true });
    }
    // Touch "v0" again — it should become the MOST recently used, not the next to drop.
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "v0", count: 100, done: false });
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "vNew", count: 99, done: true });
    expect(map.v0).toMatchObject({ n: 100, done: false });
    expect(map.v1).toBeUndefined();
  });

  it("is robust to an integer-like viewId (e.g. a config view's own \"1\") — object key order would otherwise promote it to the FRONT regardless of real insertion order", () => {
    // If ordering still relied on a plain object's own key enumeration, "1"
    // would sort to the front (ascending numeric order wins over insertion
    // order for integer-like string keys, a JS spec quirk) and be treated as
    // the OLDEST entry on the very next insert — even though it was just
    // touched. `applyListViewSkeletonRowCountUpdate`'s own `seq` field must
    // track TRUE insertion order regardless of what the viewId looks like.
    let map: ReturnType<typeof applyListViewSkeletonRowCountUpdate> = {};
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "alpha", count: 1, done: true });
    // "1" is inserted SECOND — a plain object would still enumerate it FIRST.
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "1", count: 2, done: true });
    for (let i = 0; i < LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES - 2; i++) {
      map = applyListViewSkeletonRowCountUpdate({ map, viewId: `v${i}`, count: i, done: true });
    }
    expect(Object.keys(map)).toHaveLength(LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES);
    // One more insert should drop "alpha" (the TRUE oldest), not "1".
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "vNew", count: 99, done: true });
    expect(map.alpha).toBeUndefined();
    expect(map["1"]).toMatchObject({ n: 2, done: true });
  });

  it("re-inserting an integer-like viewId still refreshes its recency correctly", () => {
    let map: ReturnType<typeof applyListViewSkeletonRowCountUpdate> = {};
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "1", count: 1, done: true });
    for (let i = 0; i < LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES - 1; i++) {
      map = applyListViewSkeletonRowCountUpdate({ map, viewId: `v${i}`, count: i, done: true });
    }
    // Touch "1" again — it should become the MOST recently used.
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "1", count: 100, done: false });
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "vNew", count: 99, done: true });
    expect(map["1"]).toMatchObject({ n: 100, done: false });
    expect(map.v0).toBeUndefined();
  });

  it("assigns a strictly increasing seq to each new/touched entry, independent of viewId", () => {
    let map: ReturnType<typeof applyListViewSkeletonRowCountUpdate> = {};
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "a", count: 1, done: true });
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "1", count: 2, done: true });
    map = applyListViewSkeletonRowCountUpdate({ map, viewId: "b", count: 3, done: true });
    expect(map.a!.seq).toBeLessThan(map["1"]!.seq!);
    expect(map["1"]!.seq).toBeLessThan(map.b!.seq!);
  });

  it("treats a legacy entry with no seq as oldest, dropping it first", () => {
    let map: ReturnType<typeof applyListViewSkeletonRowCountUpdate> = { legacy: { n: 1, done: true } };
    for (let i = 0; i < LIST_VIEW_SKELETON_ROW_COUNT_COOKIE_MAX_ENTRIES; i++) {
      map = applyListViewSkeletonRowCountUpdate({ map, viewId: `v${i}`, count: i, done: true });
    }
    expect(map.legacy).toBeUndefined();
  });
});
