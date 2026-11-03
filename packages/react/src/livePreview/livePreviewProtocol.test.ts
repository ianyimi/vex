import { describe, expect, it, vi } from "vitest";
import {
  LIVE_PREVIEW_MESSAGE_SOURCE,
  isLivePreviewMessage,
  openLivePreviewBroadcastChannel,
  livePreviewKeyFor,
} from "./livePreviewProtocol";

describe("isLivePreviewMessage", () => {
  it("accepts a message carrying the live-preview source", () => {
    expect(
      isLivePreviewMessage({
        source: LIVE_PREVIEW_MESSAGE_SOURCE,
        type: "vex-live-preview-handshake",
        collectionSlug: "pages",
      }),
    ).toBe(true);
  });

  it("rejects null, primitives, and unrelated objects", () => {
    expect(isLivePreviewMessage(null)).toBe(false);
    expect(isLivePreviewMessage("vex-live-preview-handshake")).toBe(false);
    expect(isLivePreviewMessage({ source: "some-other-widget" })).toBe(false);
    expect(isLivePreviewMessage({})).toBe(false);
  });
});

describe("livePreviewKeyFor", () => {
  it("prefers documentId over tempId when both are present", () => {
    expect(livePreviewKeyFor({ documentId: "doc1", tempId: "temp1" })).toBe("doc1");
  });

  it("falls back to tempId when documentId is absent", () => {
    expect(livePreviewKeyFor({ tempId: "temp1" })).toBe("temp1");
  });

  it("returns undefined when neither is present", () => {
    expect(livePreviewKeyFor({})).toBeUndefined();
  });
});

describe("openLivePreviewBroadcastChannel", () => {
  it("returns null when BroadcastChannel is unavailable", () => {
    const original = globalThis.BroadcastChannel;
    // @ts-expect-error simulating an environment without BroadcastChannel
    delete globalThis.BroadcastChannel;
    expect(openLivePreviewBroadcastChannel()).toBeNull();
    globalThis.BroadcastChannel = original;
  });

  it("opens a channel on the shared name when available", () => {
    const original = globalThis.BroadcastChannel;
    const ChannelSpy = vi.fn();
    globalThis.BroadcastChannel = ChannelSpy as unknown as typeof BroadcastChannel;
    openLivePreviewBroadcastChannel();
    expect(ChannelSpy).toHaveBeenCalledWith("vexcms-live-preview");
    globalThis.BroadcastChannel = original;
  });
});
