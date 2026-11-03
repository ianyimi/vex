import type { ReactElement } from "react";
import { act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { expect, vi } from "vitest";

/**
 * Shared hydration-check core: hydrates `html` into a fresh container,
 * asserts 0 recoverable errors / hydration warnings, optionally runs
 * `afterHydrate` and re-checks, then always cleans up. Used by
 * {@link assertHydratesWithoutMismatch} (`renderToString`-produced `html`).
 *
 * @param html - Server-rendered markup to hydrate `element` into.
 * @param element - The same element `html` was rendered from, passed to `hydrateRoot`.
 * @param afterHydrate - Optional: runs once hydration itself has settled, then
 *   the recoverable-error/hydration-warning assertions re-run. Receives the
 *   live `container` element.
 */
async function hydrateAndAssert(
  html: string,
  element: ReactElement,
  afterHydrate?: (container: HTMLElement) => Promise<void>,
): Promise<void> {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  const recoverableErrors: unknown[] = [];
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    const hydrationWarnings = () =>
      consoleError.mock.calls.filter((callArgs) =>
        callArgs.some((arg) => typeof arg === "string" && /hydrat/i.test(arg)),
      );
    expect(recoverableErrors).toEqual([]);
    expect(hydrationWarnings()).toEqual([]);

    if (afterHydrate !== undefined) {
      await act(async () => afterHydrate(container));
      expect(recoverableErrors).toEqual([]);
      expect(hydrationWarnings()).toEqual([]);
    }
  } finally {
    consoleError.mockRestore();
    root?.unmount();
    container.remove();
  }
}

/**
 * Asserts that `element` hydrates cleanly: the server markup `renderToString`
 * produces, when hydrated client-side via `hydrateRoot`, triggers NO
 * recoverable hydration error and logs NO "hydrat..." warning to
 * `console.error`. This is the real mechanism React itself uses to detect a
 * server/client mismatch — unlike a raw string/DOM diff (which false-positives
 * on harmless serialization differences: React 19's automatic `<img>`
 * preload-hint injection during `renderToString`, attribute-insertion-order
 * differences between a parsed-from-HTML-string node and a
 * constructed-via-DOM-API node, style-attribute whitespace normalization,
 * etc.) — `hydrateRoot` is the same algorithm a real browser's first paint
 * runs, so a clean result here is a direct guarantee of "no hydration
 * warnings in the browser console, no visible swap after hydration" for the
 * given props.
 *
 * `renderToString` does NOT support `<Suspense>` — a boundary still pending
 * when it runs synchronously aborts server rendering entirely ("The server
 * used renderToString which does not support Suspense", confirmed live). A
 * `useSuspenseQuery`-driven boundary genuinely pending at SSR-flush time
 * can't be exercised end-to-end in THIS test environment either way:
 * `renderToPipeableStream` (React's own streaming-SSR renderer, which DOES
 * support a pending boundary) produces an empty shell for a `useSuspenseQuery`
 * that hasn't resolved when run inside Vitest's jsdom environment (confirmed
 * live, isolated down to `useSuspenseQuery` + `renderToPipeableStream` +
 * jsdom specifically — a plain `throw new Promise()` boundary streams its
 * fallback correctly in the SAME setup) — jsdom's `window`/`document`
 * globals being present evidently confuses which code path React/React
 * Query take, a `renderToPipeableStream`-is-meant-for-a-real-Node-server
 * environment mismatch, not a bug in this codebase. For a boundary whose
 * data is already resolved/seeded (`initialData`, or a pre-warmed
 * `QueryClient` cache) before `renderToString` runs, this function works
 * fine — use its `afterHydrate` callback to then update that same cache
 * (e.g. `queryClient.setQueryData`) and assert the swap itself is clean.
 *
 * @param element - The element to render server-side, then hydrate client-side.
 * @param afterHydrate - Optional: runs once hydration itself has settled
 *   (the container is still mounted, same `consoleError` spy still active)
 *   — for ANY later state update (e.g. a REFETCH of an already-resolved
 *   query) the caller wants to also assert triggers no recoverable error/
 *   hydration warning. Receives the live `container` element (query it
 *   with `within(container)` or similar).
 * @returns A promise that resolves once hydration (and `afterHydrate`, if
 *   given) has settled; the caller should `await` it before making
 *   further assertions.
 */
export async function assertHydratesWithoutMismatch(
  element: ReactElement,
  afterHydrate?: (container: HTMLElement) => Promise<void>,
): Promise<void> {
  await hydrateAndAssert(renderToString(element), element, afterHydrate);
}
