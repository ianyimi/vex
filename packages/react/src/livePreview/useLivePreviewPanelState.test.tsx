import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLivePreviewPanelState } from "./useLivePreviewPanelState";

const SLUG = "posts";
const COOKIE_NAME = `vex-live-preview-panel:${SLUG}`;

/** Reads the panel cookie's raw value, or `undefined` when it has not been written. */
function cookieValue(): string | undefined {
  const prefix = `${COOKIE_NAME}=`;
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
}

function clearCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

afterEach(() => {
  clearCookie();
});

function renderPanelState(initialProps: { initialOpen: boolean; isMobile: boolean }) {
  return renderHook(
    (props: { isMobile: boolean }) =>
      useLivePreviewPanelState({
        slug: SLUG,
        initialOpen: initialProps.initialOpen,
        enabled: true,
        isMobile: props.isMobile,
      }),
    { initialProps: { isMobile: initialProps.isMobile } },
  );
}

describe("useLivePreviewPanelState", () => {
  it("toggles open and closed explicitly, writing the cookie each time", () => {
    const { result } = renderPanelState({ initialOpen: false, isMobile: false });
    expect(result.current.isOpen).toBe(false);
    expect(cookieValue()).toBeUndefined();

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    expect(cookieValue()).toBe("1");

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
    expect(cookieValue()).toBe("0");
  });

  it("auto-closes when narrowing past the breakpoint while open, without writing the cookie", () => {
    const { result, rerender } = renderPanelState({ initialOpen: true, isMobile: false });
    expect(result.current.isOpen).toBe(true);
    expect(cookieValue()).toBeUndefined();

    rerender({ isMobile: true });
    expect(result.current.isOpen).toBe(false);
    expect(cookieValue()).toBeUndefined();
  });

  it("does nothing on narrowing when already closed", () => {
    const { result, rerender } = renderPanelState({ initialOpen: false, isMobile: false });
    rerender({ isMobile: true });
    expect(result.current.isOpen).toBe(false);
    expect(cookieValue()).toBeUndefined();
  });

  it("opens from the mobile overlay via toggle (header button or ⋯ menu), writing the cookie", () => {
    const { result } = renderPanelState({ initialOpen: false, isMobile: true });
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    expect(cookieValue()).toBe("1");
  });

  it("stays open and switches to the desktop split when widening while the mobile overlay is open", () => {
    const { result, rerender } = renderPanelState({ initialOpen: false, isMobile: true });
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    const cookieAfterOpen = cookieValue();

    rerender({ isMobile: false });
    expect(result.current.isOpen).toBe(true);
    // Widening an explicitly-open overlay is not an auto transition — the
    // cookie is simply left at whatever the explicit toggle already wrote.
    expect(cookieValue()).toBe(cookieAfterOpen);
  });

  it("reopens when widening past the breakpoint after an auto-close, without writing the cookie", () => {
    const { result, rerender } = renderPanelState({ initialOpen: true, isMobile: false });

    rerender({ isMobile: true }); // auto-closes
    expect(result.current.isOpen).toBe(false);

    rerender({ isMobile: false }); // widen back
    expect(result.current.isOpen).toBe(true);
    expect(cookieValue()).toBeUndefined();
  });

  it("stays closed when widening after the user explicitly closes it while narrow (clears the auto-close memory)", () => {
    const { result, rerender } = renderPanelState({ initialOpen: true, isMobile: false });

    rerender({ isMobile: true }); // auto-closes, remembers
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle()); // user opens explicitly while narrow
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle()); // user closes explicitly while narrow
    expect(result.current.isOpen).toBe(false);

    rerender({ isMobile: false }); // widen back
    expect(result.current.isOpen).toBe(false);
  });

  it("stays closed when widening after an explicit close at desktop width (never auto-closed)", () => {
    const { result, rerender } = renderPanelState({ initialOpen: true, isMobile: false });

    act(() => result.current.toggle()); // user closes explicitly at desktop width
    expect(result.current.isOpen).toBe(false);

    rerender({ isMobile: true }); // narrow: already closed, nothing to auto-close
    rerender({ isMobile: false }); // widen back
    expect(result.current.isOpen).toBe(false);
  });
});
