// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

import { COVERING_ROUTE_LINK_ATTRIBUTE } from "@vexcms/react";
import { useNextNavigationBlocker } from "./useNextNavigationBlocker";

/**
 * A back press off the sentinel: the browser lands on the guarded page's own entry
 * (no sentinel marker in its state), then fires `popstate`.
 */
function backOffSentinel(): void {
  act(() => {
    window.history.replaceState(null, "", window.location.href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
}

function clickAnchor(props: {
  href: string;
  target?: string;
  download?: boolean;
  ctrlKey?: boolean;
  coveringRoute?: boolean;
}): MouseEvent {
  const anchor = document.createElement("a");
  anchor.href = props.href;
  if (props.target) anchor.target = props.target;
  if (props.download) anchor.setAttribute("download", "");
  if (props.coveringRoute) anchor.setAttribute(COVERING_ROUTE_LINK_ATTRIBUTE, "");
  document.body.appendChild(anchor);
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    ctrlKey: props.ctrlKey ?? false,
  });
  act(() => {
    anchor.dispatchEvent(event);
  });
  anchor.remove();
  return event;
}

beforeEach(() => {
  pushMock.mockReset();
  replaceMock.mockReset();
  window.history.replaceState(null, "", "/admin/posts/123");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useNextNavigationBlocker", () => {
  it("lets a same-origin anchor click through when `when` is false", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: false, onBlock }));
    const event = clickAnchor({ href: "/admin/pages" });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("intercepts a same-origin anchor click when blocking, and Leave replaces the sentinel entry", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/pages" });
    expect(event.defaultPrevented).toBe(true);
    expect(onBlock).toHaveBeenCalledTimes(1);
    const proceed = onBlock.mock.calls[0]?.[0] as () => void;
    act(() => proceed());
    expect(replaceMock).toHaveBeenCalledWith("/admin/pages");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("pushes a same-URL sentinel when blocking starts after mount", () => {
    const onBlock = vi.fn();
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const { rerender } = renderHook(
      (props: { when: boolean }) => useNextNavigationBlocker({ when: props.when, onBlock }),
      { initialProps: { when: false } },
    );
    expect(pushStateSpy).not.toHaveBeenCalled();
    rerender({ when: true });
    expect(pushStateSpy).toHaveBeenCalledTimes(1);
    expect(window.location.pathname).toBe("/admin/posts/123");
    backOffSentinel();
    expect(onBlock).toHaveBeenCalledTimes(1);
  });

  it("never traverses history on unmount, even with the sentinel still current", () => {
    const backSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    const goSpy = vi.spyOn(window.history, "go").mockImplementation(() => {});
    // The edit view unmounts while the URL stays put (the document query returned
    // null after Delete) — a traversal here would cancel Delete's own redirect.
    const { unmount } = renderHook(() =>
      useNextNavigationBlocker({ when: true, onBlock: vi.fn() }),
    );
    unmount();
    expect(backSpy).not.toHaveBeenCalled();
    expect(goSpy).not.toHaveBeenCalled();
  });

  it("ignores a click with a modifier key held", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/pages", ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("ignores a click on an anchor with target set", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/pages", target: "_blank" });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("ignores a click on an anchor with the download attribute", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/pages", download: true });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("ignores a click on a cross-origin anchor", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "https://example.com/elsewhere" });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("ignores a same-page hash anchor", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/posts/123#section" });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("lets a click on a covering-route link (the sign-in modal) through while blocking", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/auth/sign-in?modal=1", coveringRoute: true });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("does not block the back navigation that closes a covering route and lands on the sentinel", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    // The covering route was pushed on top of the sentinel; closing it returns ONTO the
    // sentinel entry (its state still carries the marker), then fires `popstate`.
    const sentinelState: unknown = window.history.state;
    act(() => {
      window.history.pushState(null, "", "/auth/sign-in?modal=1");
      window.history.replaceState(sentinelState, "", "/admin/posts/123");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(onBlock).not.toHaveBeenCalled();
    // Still guarded: a real back press off the sentinel afterwards is blocked.
    backOffSentinel();
    expect(onBlock).toHaveBeenCalledTimes(1);
  });

  it("blocks a back/forward (popstate) navigation while blocking", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    backOffSentinel();
    expect(onBlock).toHaveBeenCalledTimes(1);
  });

  it("does not block a popstate when `when` is false", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: false, onBlock }));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("leaves a blocked back/forward with exactly one history.go(-2) — past the sentinel and the guarded entry", () => {
    const goSpy = vi.spyOn(window.history, "go").mockImplementation(() => {});
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    backOffSentinel();
    const proceed = onBlock.mock.calls[0]?.[0] as () => void;
    act(() => proceed());
    expect(goSpy).toHaveBeenCalledTimes(1);
    expect(goSpy).toHaveBeenCalledWith(-2);
  });

  it("does not re-block the popstate fired by its own Leave replay", () => {
    const goSpy = vi
      .spyOn(window.history, "go")
      .mockImplementation(() => window.dispatchEvent(new PopStateEvent("popstate")));
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    backOffSentinel();
    const proceed = onBlock.mock.calls[0]?.[0] as () => void;
    act(() => proceed());
    expect(goSpy).toHaveBeenCalledTimes(1);
    expect(onBlock).toHaveBeenCalledTimes(1);
  });
});
