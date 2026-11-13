// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { AuthTransitionProvider, useAuthTransition } from "@vexcms/react";
import { useNextAuthTransitionRefresh } from "./useNextAuthTransitionRefresh";

function useTestHarness() {
  useNextAuthTransitionRefresh();
  return useAuthTransition();
}

afterEach(() => {
  refreshMock.mockClear();
  vi.restoreAllMocks();
});

describe("useNextAuthTransitionRefresh", () => {
  it("does not refresh on mount (a mount is not an identity CHANGE)", () => {
    renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it(
    "does not refresh the FIRST transition out of the unresolved null baseline (the bootstrap " +
      "catch-up every signed-in caller's `authClient.useSession()` watcher produces a tick after " +
      "mount, even though the SSR'd page already reflects that same identity) — developer-reported: " +
      "this fired `router.refresh()` on effectively every admin page load",
    () => {
      const { result } = renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
      act(() => result.current.beginTransition("user-a"));
      expect(refreshMock).not.toHaveBeenCalled();
    },
  );

  it("refreshes once the identity transitions from signed-in to anon AFTER the bootstrap has settled — the developer-reported 'session ends elsewhere' bug", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
    // Bootstrap: establishes "user-a" as the settled baseline, no refresh.
    act(() => result.current.beginTransition("user-a"));
    expect(refreshMock).not.toHaveBeenCalled();
    // A REAL later transition (another tab/session ending) — must refresh.
    act(() => result.current.beginTransition(null));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes when the identity transitions from one signed-in user to a different one, after the bootstrap", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
    act(() => result.current.beginTransition("user-a"));
    expect(refreshMock).not.toHaveBeenCalled();
    act(() => result.current.beginTransition("user-b"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("does not refresh again when the SAME identity is set (re-affirmed, not changed)", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
    act(() => result.current.beginTransition("user-a"));
    expect(refreshMock).not.toHaveBeenCalled();
    act(() => result.current.beginTransition("user-a"));
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it(
    "skips the refresh for a transition whose beginTransition call passed `{ skipRefresh: true }` " +
      "(a same-tab sign-out that already hard-navigates — VexAdminAuthAdapterContext's documented " +
      "contract) even once the bootstrap has already settled, the developer-reported sign-out race",
    () => {
      const { result } = renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
      // Settle the bootstrap first so this is a genuine, non-bootstrap transition.
      act(() => result.current.beginTransition("user-a"));
      expect(refreshMock).not.toHaveBeenCalled();
      act(() => result.current.beginTransition(null, { skipRefresh: true }));
      expect(refreshMock).not.toHaveBeenCalled();
    },
  );

  it("is a no-op with no AuthTransitionProvider mounted — expectedIdentity stays permanently null", () => {
    const { rerender } = renderHook(() => useTestHarness());
    rerender();
    rerender();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
