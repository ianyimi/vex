import { describe, expect, it } from "vitest";
import { applySidebarSectionCountsUpdate, parseSidebarSectionCountsCookie } from "./sidebarSectionCountsCookie";

function adminCookieValue(sidebarCounts: unknown): string {
  return encodeURIComponent(JSON.stringify({ v: 1, sidebarCounts }));
}

describe("parseSidebarSectionCountsCookie", () => {
  it("returns {} when the cookie is unset", () => {
    expect(parseSidebarSectionCountsCookie({ cookieValue: undefined })).toEqual({});
  });

  it("parses sidebarCounts off the consolidated admin cookie", () => {
    const cookieValue = adminCookieValue({ collections: 12, globals: 2, media: 1 });
    expect(parseSidebarSectionCountsCookie({ cookieValue })).toEqual({ collections: 12, globals: 2, media: 1 });
  });

  it("parses a partial map (not every section settled yet)", () => {
    const cookieValue = adminCookieValue({ collections: 3 });
    expect(parseSidebarSectionCountsCookie({ cookieValue })).toEqual({ collections: 3 });
  });

  it("parses a zero count", () => {
    const cookieValue = adminCookieValue({ collections: 0, globals: 0, media: 0 });
    expect(parseSidebarSectionCountsCookie({ cookieValue })).toEqual({ collections: 0, globals: 0, media: 0 });
  });

  it("drops a malformed section's count instead of throwing", () => {
    const cookieValue = adminCookieValue({ collections: "many", globals: -1, media: 2.5 });
    expect(parseSidebarSectionCountsCookie({ cookieValue })).toEqual({});
  });

  it("drops an unknown section key", () => {
    const cookieValue = adminCookieValue({ collections: 4, bogus: 9 });
    expect(parseSidebarSectionCountsCookie({ cookieValue })).toEqual({ collections: 4 });
  });

  it("returns {} for malformed JSON instead of throwing", () => {
    expect(parseSidebarSectionCountsCookie({ cookieValue: "{not json" })).toEqual({});
  });

  it("returns {} when sidebarCounts is absent, or is an array/non-object", () => {
    expect(parseSidebarSectionCountsCookie({ cookieValue: adminCookieValue(undefined) })).toEqual({});
    expect(parseSidebarSectionCountsCookie({ cookieValue: adminCookieValue([1, 2, 3]) })).toEqual({});
    expect(parseSidebarSectionCountsCookie({ cookieValue: adminCookieValue("nope") })).toEqual({});
  });
});

describe("applySidebarSectionCountsUpdate", () => {
  it("adds a new section's count", () => {
    expect(applySidebarSectionCountsUpdate({ counts: {}, section: "collections", count: 12 })).toEqual({
      collections: 12,
    });
  });

  it("overwrites an existing section's count", () => {
    const next = applySidebarSectionCountsUpdate({
      counts: { collections: 12 },
      section: "collections",
      count: 14,
    });
    expect(next).toEqual({ collections: 14 });
  });

  it("merges alongside other sections' already-settled counts", () => {
    const next = applySidebarSectionCountsUpdate({
      counts: { collections: 12, globals: 2 },
      section: "media",
      count: 0,
    });
    expect(next).toEqual({ collections: 12, globals: 2, media: 0 });
  });

  it("never mutates the input map", () => {
    const counts = { collections: 12 };
    applySidebarSectionCountsUpdate({ counts, section: "globals", count: 3 });
    expect(counts).toEqual({ collections: 12 });
  });
});
