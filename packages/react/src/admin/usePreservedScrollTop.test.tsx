import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { clearEditScrollStorage, usePreservedScrollTop } from "./usePreservedScrollTop";

/**
 * Mirrors the edit view: toggling swaps which element scrolls, so the two
 * containers are never mounted at the same time.
 */
function SwappingScrollers() {
  const [isSplit, setIsSplit] = useState(false);
  const formScroll = usePreservedScrollTop();

  return (
    <>
      <button type="button" onClick={() => setIsSplit((previous) => !previous)}>
        toggle
      </button>
      {isSplit ? (
        <div data-testid="split-scroller" ref={formScroll.ref} onScroll={formScroll.onScroll} />
      ) : (
        <div data-testid="plain-scroller" ref={formScroll.ref} onScroll={formScroll.onScroll} />
      )}
    </>
  );
}

/** Mirrors one real edit-view mount: a single scroller keyed to one document. */
function KeyedScroller(props: { scrollKey: string }) {
  const formScroll = usePreservedScrollTop(props.scrollKey);
  return (
    <div data-testid="keyed-scroller" ref={formScroll.ref} onScroll={formScroll.onScroll}>
      <div data-testid="keyed-scroller-content" />
    </div>
  );
}

describe("usePreservedScrollTop", () => {
  it("carries the offset onto the container that replaces it, and back again", () => {
    render(<SwappingScrollers />);

    const plain = screen.getByTestId("plain-scroller");
    plain.scrollTop = 420;
    fireEvent.scroll(plain);

    // Opening the split mounts a different element, which would otherwise
    // start at zero — the form visibly jumping back to the top.
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("split-scroller").scrollTop).toBe(420);

    const split = screen.getByTestId("split-scroller");
    split.scrollTop = 96;
    fireEvent.scroll(split);
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("plain-scroller").scrollTop).toBe(96);
  });

  it("starts a first-mounted container at the top", () => {
    render(<SwappingScrollers />);
    expect(screen.getByTestId("plain-scroller").scrollTop).toBe(0);
  });
});

describe("usePreservedScrollTop — keyed persistence", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("restores the offset from sessionStorage on a fresh mount, surviving a full unmount/remount", () => {
    const { unmount } = render(<KeyedScroller scrollKey="posts:doc1" />);
    const scroller = screen.getByTestId("keyed-scroller");
    scroller.scrollTop = 777;
    fireEvent.scroll(scroller);
    unmount();

    render(<KeyedScroller scrollKey="posts:doc1" />);
    expect(screen.getByTestId("keyed-scroller").scrollTop).toBe(777);
  });

  it("keeps each document's offset separate", () => {
    const first = render(<KeyedScroller scrollKey="posts:doc1" />);
    const firstScroller = screen.getByTestId("keyed-scroller");
    firstScroller.scrollTop = 300;
    fireEvent.scroll(firstScroller);
    first.unmount();

    render(<KeyedScroller scrollKey="posts:doc2" />);
    expect(screen.getByTestId("keyed-scroller").scrollTop).toBe(0);
  });

  it("never persists across a remount when no key is given", () => {
    const { unmount } = render(<SwappingScrollers />);
    const scroller = screen.getByTestId("plain-scroller");
    scroller.scrollTop = 555;
    fireEvent.scroll(scroller);
    unmount();

    render(<SwappingScrollers />);
    expect(screen.getByTestId("plain-scroller").scrollTop).toBe(0);
  });
});

describe("usePreservedScrollTop — ResizeObserver reapply", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("observes the container's own first child and reapplies the remembered offset on resize", () => {
    const observed: unknown[] = [];
    let triggerResize: () => void = () => {};
    class MockResizeObserver {
      constructor(callback: () => void) {
        triggerResize = callback;
      }
      observe(target: unknown) {
        observed.push(target);
      }
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    render(<KeyedScroller scrollKey="posts:resize1" />);
    const scroller = screen.getByTestId("keyed-scroller");
    expect(observed).toEqual([screen.getByTestId("keyed-scroller-content")]);

    scroller.scrollTop = 500;
    fireEvent.scroll(scroller);
    // Simulates a late-arriving height clamping the container back down.
    scroller.scrollTop = 0;
    triggerResize();
    expect(scroller.scrollTop).toBe(500);
  });

  it("stops reapplying once the capped window since mount has elapsed", () => {
    vi.useFakeTimers();
    let triggerResize: () => void = () => {};
    let disconnected = false;
    class MockResizeObserver {
      constructor(callback: () => void) {
        triggerResize = callback;
      }
      observe() {}
      disconnect() {
        disconnected = true;
      }
      unobserve() {}
    }
    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    render(<KeyedScroller scrollKey="posts:resize2" />);
    const scroller = screen.getByTestId("keyed-scroller");
    scroller.scrollTop = 500;
    fireEvent.scroll(scroller);

    vi.advanceTimersByTime(1500);
    scroller.scrollTop = 0;
    triggerResize();
    expect(disconnected).toBe(true);
    expect(scroller.scrollTop).toBe(0);
  });

});

describe("clearEditScrollStorage", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("removes every persisted edit-scroll entry, leaving unrelated sessionStorage keys alone", () => {
    window.sessionStorage.setItem("vex-admin:edit-scroll:posts:doc1", "100");
    window.sessionStorage.setItem("vex-admin:edit-scroll:global:settings", "20");
    window.sessionStorage.setItem("unrelated-key", "keep-me");

    clearEditScrollStorage();

    expect(window.sessionStorage.getItem("vex-admin:edit-scroll:posts:doc1")).toBeNull();
    expect(window.sessionStorage.getItem("vex-admin:edit-scroll:global:settings")).toBeNull();
    expect(window.sessionStorage.getItem("unrelated-key")).toBe("keep-me");
  });

  it("does not throw when sessionStorage is empty", () => {
    expect(() => clearEditScrollStorage()).not.toThrow();
  });
});
