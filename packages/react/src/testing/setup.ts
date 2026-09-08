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
 *
 * Safe to call more than once: both installs are guarded with `??=`.
 */
export function installDomPolyfills(): void {
  // cmdk observes its list for virtual sizing; jsdom has no ResizeObserver.
  globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
  // cmdk scrolls the highlighted item into view; jsdom has no layout.
  Element.prototype.scrollIntoView ??= () => undefined;
}

// Runs immediately so `setupFiles: ["@vexcms/react/testing"]` works with no
// further wiring; re-running via an explicit call elsewhere is a no-op.
installDomPolyfills();
