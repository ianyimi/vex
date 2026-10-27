import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FrameworkComponentsContext, type FrameworkComponents } from "./useFrameworkComponents";
import {
  UnsavedChangesGuardContext,
  type UnsavedChangesGuardContextValue,
} from "../documents/useUnsavedChangesGuard";
import { useVexNavigate } from "./useVexNavigate";

function NavigateButton(props: { href: string }) {
  const navigate = useVexNavigate();
  return <button onClick={() => navigate(props.href)}>Go</button>;
}

function renderHarness(
  components: FrameworkComponents,
  guard: UnsavedChangesGuardContextValue | undefined,
) {
  return render(
    <FrameworkComponentsContext.Provider value={components}>
      {guard ? (
        <UnsavedChangesGuardContext.Provider value={guard}>
          <NavigateButton href="/admin/posts" />
        </UnsavedChangesGuardContext.Provider>
      ) : (
        <NavigateButton href="/admin/posts" />
      )}
    </FrameworkComponentsContext.Provider>,
  );
}

describe("useVexNavigate", () => {
  let assignSpy: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    assignSpy = vi.fn();
    originalLocation = window.location;
    // jsdom's `window.location` doesn't allow spying `assign` directly.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign: assignSpy },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("with no adapter useNavigate, falls back to window.location.assign", () => {
    renderHarness({}, undefined);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(assignSpy).toHaveBeenCalledWith("/admin/posts");
  });

  it("uses the adapter's useNavigate when provided, not window.location.assign", () => {
    const adapterNavigate = vi.fn();
    renderHarness({ useNavigate: () => adapterNavigate }, undefined);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(adapterNavigate).toHaveBeenCalledWith("/admin/posts");
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("while the guard is blocking, opens the Stay/Leave dialog and navigates only on Leave", () => {
    const attemptNavigation = vi.fn((proceed: () => void) => {
      // Simulates the guard: holds `proceed`, doesn't call it — a real
      // guard would also render `UnsavedChangesDialog` here; this double
      // asserts `useVexNavigate` routed through `attemptNavigation` rather
      // than navigating directly.
      pendingProceed = proceed;
    });
    let pendingProceed: (() => void) | undefined;
    renderHarness({}, { release: vi.fn(), attemptNavigation });

    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(attemptNavigation).toHaveBeenCalledTimes(1);
    expect(assignSpy).not.toHaveBeenCalled();

    act(() => pendingProceed?.());
    expect(assignSpy).toHaveBeenCalledWith("/admin/posts");
  });

  it("after the guard isn't blocking (e.g. released), navigates immediately", () => {
    const attemptNavigation = vi.fn((proceed: () => void) => proceed());
    renderHarness({}, { release: vi.fn(), attemptNavigation });

    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(attemptNavigation).toHaveBeenCalledTimes(1);
    expect(assignSpy).toHaveBeenCalledWith("/admin/posts");
  });
});
