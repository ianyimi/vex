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
 * Installs the jsdom polyfills Vex React's component tests need. jsdom has no
 * layout engine, so it implements neither `ResizeObserver` nor
 * `Element.prototype.scrollIntoView` — both of which cmdk (the primitive
 * behind `MultiSelect`/`Combobox`) calls on mount and on highlight change.
 * jsdom also has no Web Animations API, so `Element.prototype.getAnimations`
 * is missing — Base UI's `ScrollAreaViewport` (used by the date picker's
 * month/year drill-down) calls it from a `setTimeout` callback that fires
 * after a test's own assertions complete, throwing an uncaught exception
 * that fails the whole file's exit code even when every test passed.
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
}

// Runs immediately so `setupFiles: ["@vexcms/react/testing"]` works with no
// further wiring; re-running via an explicit call elsewhere is a no-op.
installDomPolyfills();
