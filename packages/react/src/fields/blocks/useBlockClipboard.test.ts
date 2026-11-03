import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BLOCK_CLIPBOARD_STORAGE_KEY,
  useBlockClipboard,
} from "./useBlockClipboard";
import type { GenericBlock } from "@vexcms/core";

const heroBlock: GenericBlock = {
  id: "block-1",
  blockType: "hero",
  heading: "Hello",
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("useBlockClipboard", () => {
  it("starts with a null clipboard when localStorage is empty", () => {
    const { result } = renderHook(() => useBlockClipboard());
    expect(result.current.clipboard).toBeNull();
  });

  it("copyBlocks stores the exact envelope JSON and updates the clipboard", () => {
    const { result } = renderHook(() => useBlockClipboard());

    act(() => {
      result.current.copyBlocks({ blocks: [heroBlock] });
    });

    const raw = window.localStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(stored.version).toBe(1);
    expect(typeof stored.copiedAt).toBe("number");
    expect(stored.blocks).toEqual([heroBlock]);

    expect(result.current.clipboard).toEqual({
      version: 1,
      copiedAt: stored.copiedAt,
      blocks: [heroBlock],
    });
  });

  it("clearClipboard removes the stored key and resets the clipboard to null", () => {
    const { result } = renderHook(() => useBlockClipboard());

    act(() => {
      result.current.copyBlocks({ blocks: [heroBlock] });
    });
    expect(result.current.clipboard).not.toBeNull();

    act(() => {
      result.current.clearClipboard();
    });

    expect(window.localStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY)).toBeNull();
    expect(result.current.clipboard).toBeNull();
  });

  it("resolves malformed JSON to null instead of throwing", () => {
    window.localStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, "{not json");

    const { result } = renderHook(() => useBlockClipboard());

    expect(result.current.clipboard).toBeNull();
  });

  it("resolves JSON that does not match the BlockClipboard shape to null", () => {
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({ foo: "bar" }),
    );

    const { result } = renderHook(() => useBlockClipboard());

    expect(result.current.clipboard).toBeNull();
  });

  it("picks up a cross-tab write via the storage event", () => {
    const { result } = renderHook(() => useBlockClipboard());
    expect(result.current.clipboard).toBeNull();

    const envelope = { version: 1, copiedAt: 1234, blocks: [heroBlock] };
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify(envelope),
    );

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: BLOCK_CLIPBOARD_STORAGE_KEY,
          newValue: JSON.stringify(envelope),
        }),
      );
    });

    expect(result.current.clipboard).toEqual(envelope);
  });
});
