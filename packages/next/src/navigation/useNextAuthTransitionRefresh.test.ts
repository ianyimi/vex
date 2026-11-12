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

  it("refreshes once the identity transitions from signed-in to anon (null) — the developer-reported 'session ends elsewhere' bug", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
    act(() => result.current.beginTransition("user-a"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    act(() => result.current.beginTransition(null));
    expect(refreshMock).toHaveBeenCalledTimes(2);
  });

  it("refreshes when the identity transitions from one signed-in user to a different one", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
    act(() => result.current.beginTransition("user-a"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    act(() => result.current.beginTransition("user-b"));
    expect(refreshMock).toHaveBeenCalledTimes(2);
  });

  it("does not refresh again when the SAME identity is set (re-affirmed, not changed)", () => {
    const { result } = renderHook(() => useTestHarness(), { wrapper: AuthTransitionProvider });
    act(() => result.current.beginTransition("user-a"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    act(() => result.current.beginTransition("user-a"));
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("is a no-op with no AuthTransitionProvider mounted — expectedIdentity stays permanently null", () => {
    const { rerender } = renderHook(() => useTestHarness());
    rerender();
    rerender();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
