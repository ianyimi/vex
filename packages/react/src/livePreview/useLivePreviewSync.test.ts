import { act, renderHook } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLivePreviewSync } from "./useLivePreviewSync";
import { LIVE_PREVIEW_MESSAGE_SOURCE } from "./livePreviewProtocol";

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  name: string;
  postMessage = vi.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  private listeners: ((event: MessageEvent) => void)[] = [];
  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.instances.push(this);
  }
  addEventListener(_type: "message", listener: (event: MessageEvent) => void) {
    this.listeners.push(listener);
  }
  close() {}
  emit(data: unknown) {
    this.listeners.forEach((listener) => listener({ data } as MessageEvent));
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeBroadcastChannel.instances = [];
  vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderWithForm(targetWindow: Window | null) {
  const { result } = renderHook(() => {
    const form = useForm({ defaultValues: { title: "Draft" } });
    useLivePreviewSync({
      form,
      collectionSlug: "pages",
      documentId: "doc1",
      targetWindow,
    });
    return form;
  });
  return result;
}

const readyMessage = { source: LIVE_PREVIEW_MESSAGE_SOURCE, type: "vex-live-preview-ready" };

describe("useLivePreviewSync", () => {
  it("posts a debounced full-snapshot update over BroadcastChannel and postMessage", async () => {
    const postMessage = vi.fn();
    const fakeWindow = { postMessage } as unknown as Window;
    const form = renderWithForm(fakeWindow);

    await act(async () => form.current.setFieldValue("title", "Published title"));
    postMessage.mockClear();

    await act(async () => vi.advanceTimersByTime(150));

    const expectedMessage = expect.objectContaining({
      type: "vex-live-preview-update",
      collectionSlug: "pages",
      documentId: "doc1",
      values: { title: "Published title" },
    });
    expect(postMessage).toHaveBeenCalledWith(expectedMessage, "*");
    const latestChannel = FakeBroadcastChannel.instances.at(-1);
    expect(latestChannel?.postMessage).toHaveBeenCalledWith(expectedMessage);
  });

  it("still broadcasts when no window reference is held", async () => {
    const form = renderWithForm(null);
    await act(async () => form.current.setFieldValue("title", "Published title"));
    await act(async () => vi.advanceTimersByTime(150));
    expect(FakeBroadcastChannel.instances.at(-1)?.postMessage).toHaveBeenCalled();
  });

  it("replies over BroadcastChannel to a ready message", async () => {
    renderWithForm(null);
    await act(async () => vi.advanceTimersByTime(150));
    const channel = FakeBroadcastChannel.instances.at(-1);
    channel?.postMessage.mockClear();

    await act(async () => channel?.emit(readyMessage));

    expect(channel?.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "vex-live-preview-update",
        documentId: "doc1",
        values: { title: "Draft" },
      }),
    );
  });

  it("replies to a ready message posted by the frame it holds", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameWindow = frame.contentWindow;
    if (!frameWindow) throw new Error("jsdom iframe has no contentWindow");
    const postMessage = vi.spyOn(frameWindow, "postMessage").mockImplementation(() => undefined);
    renderWithForm(frameWindow);
    await act(async () => vi.advanceTimersByTime(150));
    postMessage.mockClear();

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", { data: readyMessage, source: frameWindow }));
    });

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "vex-live-preview-update", documentId: "doc1" }),
      "*",
    );
    frame.remove();
  });

  it("ignores a ready message from a window it does not hold", async () => {
    const postMessage = vi.fn();
    const heldWindow = { postMessage } as unknown as Window;
    renderWithForm(heldWindow);
    await act(async () => vi.advanceTimersByTime(150));
    postMessage.mockClear();

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", { data: readyMessage, source: window }));
    });

    expect(postMessage).not.toHaveBeenCalled();
  });
});
