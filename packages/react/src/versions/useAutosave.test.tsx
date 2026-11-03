import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutosave } from "./useAutosave";

/**
 * Flushes pending microtasks (promise `.then`/`async`/`await` continuations)
 * without advancing fake timers — `runSave`'s own `await props.onSave(...)`
 * chain needs several microtask ticks to settle after a `setTimeout`
 * callback fires or a manually-resolved promise resolves.
 */
async function flushPromises(ticks = 5): Promise<void> {
  for (let i = 0; i < ticks; i++) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useAutosave", () => {
  it("does not save on mount", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() => useAutosave({ values: { title: "A" }, onSave }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves once after values settle, debounced", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });

    await act(async () => {
      vi.advanceTimersByTime(999);
    });
    expect(onSave).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: "B" });
    expect(result.current.status).toBe("saved");
    expect(result.current.lastSavedAt).not.toBeNull();
  });

  it("coalesces a burst of rapid changes into exactly one save, with the final values", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "AB" } });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    rerender({ values: { title: "ABC" } });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    rerender({ values: { title: "ABCD" } });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ title: "ABCD" });
  });

  it("never merges a change that lands mid-flight; retries independently once the in-flight save finishes", async () => {
    let resolveFirst!: () => void;
    const onSave = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenNthCalledWith(1, { title: "B" });

    // A further change lands while the first save is still in flight.
    rerender({ values: { title: "C" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // No second call yet — no debounce timer fires for an in-flight save's
    // pending change; it waits on the first save to finish.
    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst();
      await flushPromises();
    });

    // The retry is its own independent call with the LATEST values — never
    // merged into the request that just finished.
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenNthCalledWith(2, { title: "C" });
  });

  it("on failure, leaves status as error and does not advance the saved baseline, so the next settle retries the same diff", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("boom"));
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBeInstanceOf(Error);
    expect(onSave).toHaveBeenCalledTimes(1);

    onSave.mockResolvedValueOnce(undefined);
    // A new render with the SAME content as the failed attempt still counts
    // as "not yet saved" (the baseline never advanced on failure).
    rerender({ values: { title: "B" } });
    rerender({ values: { title: "B2" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenNthCalledWith(2, { title: "B2" });
    expect(result.current.status).toBe("saved");
  });

  it("cancels a pending debounce when enabled flips to false mid-debounce", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ values, enabled }) => useAutosave({ values, onSave, enabled, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" }, enabled: true } },
    );

    rerender({ values: { title: "B" }, enabled: true });
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    rerender({ values: { title: "B" }, enabled: false });
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("clears the pending timer on unmount — no orphaned save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    unmount();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it("never saves an empty change set — e.g. after the caller resets its form on a successful save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: {} as Record<string, unknown> } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await flushPromises();
    });
    expect(onSave).toHaveBeenCalledTimes(1);

    // The edit view resets its form after the save: the diff drops to `{}`,
    // which differs from the last saved `{ title: "B" }` but means "nothing
    // unsaved", not "save an empty draft".
    rerender({ values: {} });
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("hasUnsavedChanges is true during the debounce window, before status ever reaches saving", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(999);
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it("hasUnsavedChanges is false once a successful save's reset drops the diff to empty", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } as Record<string, unknown> } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await flushPromises();
    });
    expect(result.current.status).toBe("saved");

    // The edit view resets its form after the save: the diff drops to `{}`.
    rerender({ values: {} });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("hasUnsavedChanges stays true after a failed save", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("boom"));
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
});
