import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  FrameworkComponentsContext,
  type FrameworkComponents,
  type NavigationBlockerAdapter,
} from "../config/useFrameworkComponents";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

/**
 * A `NavigationBlockerAdapter` double: records the latest `when`/`onBlock`
 * passed to `useBlocker` on every render — no interception mechanics of its
 * own, that's `@vexcms/next`'s job (Step 8) — and exposes `block` so a test
 * can simulate the framework intercepting a navigation attempt.
 */
function createFakeNavigationBlocker() {
  const state: { when: boolean; onBlock: ((proceed: () => void) => void) | null } = {
    when: false,
    onBlock: null,
  };
  const adapter: NavigationBlockerAdapter = {
    useBlocker(blockerProps) {
      state.when = blockerProps.when;
      state.onBlock = blockerProps.onBlock;
    },
  };
  return {
    adapter,
    isBlocking: () => state.when,
    block(proceed: () => void) {
      state.onBlock?.(proceed);
    },
  };
}

interface HarnessProps {
  isDirty: boolean;
  hasUnsavedChanges?: boolean;
  autosaveEnabled: boolean;
}

function renderHarness(initial: HarnessProps, components: FrameworkComponents) {
  const releaseRef: { current: (() => void) | undefined } = { current: undefined };
  const attemptNavigationRef: { current: ((proceed: () => void) => void) | undefined } = {
    current: undefined,
  };

  function Harness(harnessProps: HarnessProps) {
    const { dialog, release, attemptNavigation } = useUnsavedChangesGuard(harnessProps);
    releaseRef.current = release;
    attemptNavigationRef.current = attemptNavigation;
    return <>{dialog}</>;
  }

  const utils = render(
    <FrameworkComponentsContext.Provider value={components}>
      <Harness {...initial} />
    </FrameworkComponentsContext.Provider>,
  );
  return {
    ...utils,
    releaseRef,
    attemptNavigationRef,
    rerender: (next: HarnessProps) =>
      utils.rerender(
        <FrameworkComponentsContext.Provider value={components}>
          <Harness {...next} />
        </FrameworkComponentsContext.Provider>,
      ),
  };
}

describe("useUnsavedChangesGuard", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks when isDirty and autosave is off", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });
    expect(fake.isBlocking()).toBe(true);
  });

  it("does not block when not dirty and autosave is off", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: false, autosaveEnabled: false }, { navigationBlocker: fake.adapter });
    expect(fake.isBlocking()).toBe(false);
  });

  it.each([
    [false, false],
    [true, true],
  ] as const)(
    "autosave-enabled document, hasUnsavedChanges %s → blocking %s",
    (hasUnsavedChanges, expectedBlocking) => {
      const fake = createFakeNavigationBlocker();
      renderHarness(
        { isDirty: false, autosaveEnabled: true, hasUnsavedChanges },
        { navigationBlocker: fake.adapter },
      );
      expect(fake.isBlocking()).toBe(expectedBlocking);
    },
  );

  it("ignores isDirty entirely on an autosave-enabled document", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness(
      { isDirty: true, autosaveEnabled: true, hasUnsavedChanges: false },
      { navigationBlocker: fake.adapter },
    );
    expect(fake.isBlocking()).toBe(false);
  });

  it("registers beforeunload only while blocking, and removes it once clear", () => {
    const fake = createFakeNavigationBlocker();
    const { rerender } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    rerender({ isDirty: false, autosaveEnabled: false });
    expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("calls preventDefault on the beforeunload event while blocking", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });
    const handler = addEventListenerSpy.mock.calls.find(
      ([type]: [string, ...unknown[]]) => type === "beforeunload",
    )?.[1] as ((event: BeforeUnloadEvent) => void) | undefined;
    const event = new Event("beforeunload") as BeforeUnloadEvent;
    const preventDefault = vi.spyOn(event, "preventDefault");
    handler?.(event);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("opens the Stay/Leave dialog when the adapter blocks a navigation, and Leave resolves it", async () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });

    let proceeded = false;
    act(() => {
      fake.block(() => {
        proceeded = true;
      });
    });
    expect(screen.getByText("Leave without saving?")).toBeInTheDocument();
    expect(proceeded).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(proceeded).toBe(true);
    // base-ui's AlertDialog unmounts the popup after its exit animation —
    // not synchronously with the `open` prop flipping to `false`.
    await waitFor(() =>
      expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument(),
    );
  });

  it("Stay dismisses the dialog without resolving the blocked navigation", async () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });

    let proceeded = false;
    act(() => {
      fake.block(() => {
        proceeded = true;
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(proceeded).toBe(false);
    await waitFor(() =>
      expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument(),
    );
    expect(fake.isBlocking()).toBe(true);
  });

  it("a second blocked navigation replaces the pending one — Leave resolves the latest", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });

    let firstProceeded = false;
    let secondProceeded = false;
    act(() => {
      fake.block(() => {
        firstProceeded = true;
      });
    });
    act(() => {
      fake.block(() => {
        secondProceeded = true;
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(firstProceeded).toBe(false);
    expect(secondProceeded).toBe(true);
  });

  it("release() stops blocking immediately, and re-arms once dirty again", () => {
    const fake = createFakeNavigationBlocker();
    const { releaseRef, rerender } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );
    expect(fake.isBlocking()).toBe(true);

    act(() => releaseRef.current?.());
    expect(fake.isBlocking()).toBe(false);

    rerender({ isDirty: false, autosaveEnabled: false });
    rerender({ isDirty: true, autosaveEnabled: false });
    expect(fake.isBlocking()).toBe(true);
  });

  it("release() closes an already-open dialog and drops the stale proceed", async () => {
    const fake = createFakeNavigationBlocker();
    const { releaseRef } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );
    act(() => {
      fake.block(() => {});
    });
    expect(screen.getByText("Leave without saving?")).toBeInTheDocument();

    act(() => releaseRef.current?.());
    await waitFor(() =>
      expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument(),
    );
  });

  it("without a navigationBlocker adapter, beforeunload still attaches while dirty", () => {
    renderHarness({ isDirty: true, autosaveEnabled: false }, {});
    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("attemptNavigation runs proceed immediately when not blocking", () => {
    const fake = createFakeNavigationBlocker();
    const { attemptNavigationRef } = renderHarness(
      { isDirty: false, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );

    let proceeded = false;
    act(() => attemptNavigationRef.current?.(() => (proceeded = true)));
    expect(proceeded).toBe(true);
    expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument();
  });

  it("attemptNavigation opens the dialog when blocking, and Leave resolves it", () => {
    const fake = createFakeNavigationBlocker();
    const { attemptNavigationRef } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );

    let proceeded = false;
    act(() => attemptNavigationRef.current?.(() => (proceeded = true)));
    expect(screen.getByText("Leave without saving?")).toBeInTheDocument();
    expect(proceeded).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(proceeded).toBe(true);
  });

  it("release() then attemptNavigation in the same tick proceeds without the dialog", () => {
    const fake = createFakeNavigationBlocker();
    const { releaseRef, attemptNavigationRef } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );

    // Delete/Duplicate call `release()` and navigate before React re-renders.
    const attemptNavigation = attemptNavigationRef.current;
    let proceeded = false;
    act(() => {
      releaseRef.current?.();
      attemptNavigation?.(() => (proceeded = true));
    });
    expect(proceeded).toBe(true);
    expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument();
  });
});
