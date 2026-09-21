import { describe, expect, it } from "vitest";
import {
  computeLivePreviewFrameGeometry,
  resolveLivePreviewUrl,
  resolveStoredLivePreviewBreakpoint,
} from "./LivePreviewPanel";

describe("computeLivePreviewFrameGeometry", () => {
  it("passes the container size through unscaled when no breakpoint is selected", () => {
    expect(
      computeLivePreviewFrameGeometry({
        containerWidth: 500,
        containerHeight: 800,
        breakpointWidth: null,
      }),
    ).toEqual({ width: 500, height: 800, scale: 1, left: 0 });
  });

  it("centers a breakpoint narrower than the container at scale 1", () => {
    const geometry = computeLivePreviewFrameGeometry({
      containerWidth: 800,
      containerHeight: 600,
      breakpointWidth: 375,
    });
    expect(geometry).toEqual({
      width: 375,
      height: 600,
      scale: 1,
      left: (800 - 375) / 2,
    });
  });

  it("scales a breakpoint wider than the container down to exactly fill it", () => {
    const geometry = computeLivePreviewFrameGeometry({
      containerWidth: 500,
      containerHeight: 600,
      breakpointWidth: 1000,
    });
    expect(geometry).toEqual({
      width: 1000,
      height: 1200,
      scale: 0.5,
      left: 0,
    });
    // Visually: 1000 * 0.5 = 500 (exactly the container width), 1200 * 0.5 = 600.
  });

  it("returns the container size unscaled when it has not been measured yet", () => {
    expect(
      computeLivePreviewFrameGeometry({
        containerWidth: 0,
        containerHeight: 0,
        breakpointWidth: 375,
      }),
    ).toEqual({ width: 0, height: 0, scale: 1, left: 0 });
  });
});

describe("resolveLivePreviewUrl", () => {
  it("returns undefined when no resolver is configured", () => {
    expect(
      resolveLivePreviewUrl({
        url: undefined,
        collectionSlug: "pages",
        baseDoc: {},
        formValues: { slug: "about" },
      }),
    ).toBeUndefined();
  });

  it("marks a saved document's URL as a preview request, with no temp-id params", () => {
    const url = resolveLivePreviewUrl({
      url: (doc) => (typeof doc.slug === "string" ? `/${doc.slug}` : undefined),
      collectionSlug: "pages",
      baseDoc: { _id: "doc1", slug: "old-slug" },
      formValues: { slug: "new-slug" },
      tempId: "temp-123",
    });
    expect(url).toBe("/new-slug?vexLivePreview=1");
  });

  it("appends vexLivePreviewId and vexLivePreviewCollection for an unsaved document", () => {
    const url = resolveLivePreviewUrl({
      url: (doc) => (typeof doc.slug === "string" ? `/${doc.slug}` : undefined),
      collectionSlug: "pages",
      baseDoc: {},
      formValues: { slug: "draft-post" },
      tempId: "temp-123",
    });
    expect(url).toBe(
      "/draft-post?vexLivePreview=1&vexLivePreviewId=temp-123&vexLivePreviewCollection=pages",
    );
  });

  it("passes the temp id as _id to the resolver when the document has no saved id", () => {
    const seenIds: unknown[] = [];
    resolveLivePreviewUrl({
      url: (doc) => {
        seenIds.push(doc._id);
        return undefined;
      },
      collectionSlug: "pages",
      baseDoc: {},
      formValues: { slug: "draft" },
      tempId: "temp-123",
    });
    expect(seenIds).toEqual(["temp-123"]);
  });

  it("merges into a resolver URL that already carries its own query string", () => {
    const url = resolveLivePreviewUrl({
      url: () => "https://staging.example.com/about?theme=dark",
      collectionSlug: "pages",
      baseDoc: { _id: "doc1" },
      formValues: {},
    });
    expect(url).toBe("https://staging.example.com/about?theme=dark&vexLivePreview=1");
  });

  it("returns undefined when the resolver itself cannot resolve yet", () => {
    expect(
      resolveLivePreviewUrl({
        url: () => undefined,
        collectionSlug: "pages",
        baseDoc: {},
        formValues: {},
      }),
    ).toBeUndefined();
  });
});

describe("resolveStoredLivePreviewBreakpoint", () => {
  const breakpoints = [
    { label: "sm", width: 640 },
    { label: "lg", width: 1024 },
  ];

  it("restores the breakpoint matching a stored width", () => {
    expect(resolveStoredLivePreviewBreakpoint({ breakpoints, storedWidth: 1024 })).toEqual({
      label: "lg",
      width: 1024,
    });
  });

  it("falls back to full width when nothing was stored", () => {
    expect(resolveStoredLivePreviewBreakpoint({ breakpoints, storedWidth: null })).toBeNull();
  });

  it("falls back to full width when the stored width is no longer configured", () => {
    expect(resolveStoredLivePreviewBreakpoint({ breakpoints, storedWidth: 390 })).toBeNull();
  });
});
