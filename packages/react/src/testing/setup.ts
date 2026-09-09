// Registers jest-dom's DOM matchers (`toHaveValue`, `toBeVisible`,
// `toHaveAttribute`, `toBeInTheDocument`, …) on vitest's `expect`. Without this
// every such assertion fails with "Invalid Chai property", which reads like a
// component defect but is a missing-setup bug. The package's pre-existing tests
// only used `textContent`/`querySelectorAll`, so nothing needed it until the
// shared contract factory started asserting on DOM state.
import "@testing-library/jest-dom/vitest";

class ResizeObserverStub {
  disconnect() {}
  observe() {}
  unobserve() {}
}

/**
 * Inert `MediaQueryList`: never matches, never fires a change event. Good enough for
 * every current caller (`use-mobile.ts`'s viewport query, `ThemeProvider`'s
 * `prefers-color-scheme` query) — both only need `.matches` and
 * `add/removeEventListener` to exist, never a real match or a live update.
 */
class MediaQueryListStub {
  matches = false;
  media = "";
  addEventListener() {}
  removeEventListener() {}
}

/**
 * Points the bare `globalThis.localStorage` at jsdom's own `window.localStorage`.
 *
 * Node ships its own experimental Web Storage: touching `globalThis.localStorage`
 * without `--localstorage-file` logs
 * "ExperimentalWarning: localStorage is not available because --localstorage-file
 * was not provided" once per worker. `nuqs` probes exactly that bare global at
 * import time (`typeof localStorage === "undefined"`, then a set/get/remove
 * round-trip) to decide whether its debug logging can persist, so every test file
 * that pulls in a nuqs-driven component printed that warning to stderr.
 *
 * Defined with `defineProperty` rather than `??=` on purpose: `??=` would have to
 * READ the property first, which is the access that emits the warning. Binding it
 * to the real jsdom store also makes the probe answer honestly instead of
 * degrading, so no behavior is stubbed away.
 */
function installLocalStorage(): void {
  if (typeof window === "undefined") return;
  const store = window.localStorage;
  if (!store) return;
  Object.defineProperty(globalThis, "localStorage", {
    value: store,
    configurable: true,
    writable: true,
  });
}

/**
 * Installs the jsdom polyfills Vex React's component tests need. jsdom has no
 * layout engine, so it implements neither `ResizeObserver` nor
 * `Element.prototype.scrollIntoView` — both of which cmdk (the primitive
 * behind `MultiSelect`/`Combobox`) calls on mount and on highlight change.
 * jsdom also has no Web Animations API, so `Element.prototype.getAnimations`
 * is missing — Base UI's `ScrollAreaViewport` (used by the date picker's
 * month/year drill-down) calls it from a `setTimeout` callback that fires
 * after a test's own assertions complete, throwing an uncaught exception
 * that fails the whole file's exit code even when every test passed. jsdom
 * additionally ships no CSS media-query engine, so `window.matchMedia` — called
 * unconditionally on mount by `use-mobile.ts`'s `useIsMobile` (read by
 * `SidebarProvider`) and by `ThemeProvider`'s system-theme resolution — is
 * missing too. Web Storage is present but only on `window`, so the bare global
 * every third-party probe reads is rebound by {@link installLocalStorage}.
 *
 * Safe to call more than once: all installs are guarded with `??=`.
 */
export function installDomPolyfills(): void {
  // cmdk observes its list for virtual sizing; jsdom has no ResizeObserver.
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
  // cmdk scrolls the highlighted item into view; jsdom has no layout.
  Element.prototype.scrollIntoView ??= () => undefined;
  // Base UI's ScrollAreaViewport calls this from a deferred timeout; jsdom
  // has no Web Animations API at all.
  Element.prototype.getAnimations ??= () => [];
  // jsdom has no CSS media-query engine at all.
  globalThis.matchMedia ??= ((query: string) => {
    const stub = new MediaQueryListStub();
    stub.media = query;
    return stub as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
  installLocalStorage();
}

// Runs immediately so `setupFiles: ["@vexcms/react/testing"]` works with no
// further wiring; re-running via an explicit call elsewhere is a no-op.
installDomPolyfills();
