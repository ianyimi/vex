import type { Page } from "@playwright/test";

const QUIET_MS = 500;

/**
 * Waits until the page is quiet: nothing is `aria-busy` (a list refetching
 * renders its rows dimmed) and no finite CSS/Web animation or transition has
 * been running for `QUIET_MS`. One check isn't enough — the admin's database
 * theme lands after hydration and starts 150 ms colour transitions, so an
 * audit that only checks once can measure a badge mid-fade. Infinite
 * animations (pulsing status dots) are ignored: they never finish.
 *
 * @param props - Input props.
 * @param props.page - The Playwright page to settle.
 * @returns Resolves once the page has stayed quiet for `QUIET_MS`.
 */
export async function settlePage(props: { page: Page }): Promise<void> {
  await props.page.waitForLoadState("load");
  await props.page.waitForFunction(
    (quietMs) => {
      const state = window as unknown as { __qpQuietSince?: number };
      const busy =
        document.querySelector('[aria-busy="true"]') !== null ||
        document
          .getAnimations()
          .some(
            (animation) =>
              animation.playState === "running" &&
              animation.effect?.getTiming().iterations !== Infinity,
          );
      if (busy) {
        state.__qpQuietSince = undefined;
        return false;
      }
      state.__qpQuietSince ??= performance.now();
      return performance.now() - state.__qpQuietSince >= quietMs;
    },
    QUIET_MS,
    { polling: 50 },
  );
}
