"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE,
  livePreviewLayoutCookieName,
  livePreviewPanelCookieName,
  resolveLivePreviewPanelMinSize,
} from "@vexcms/core";

/** The two split columns' minimum shares, in percent. */
export interface LivePreviewPanelMinSizes {
  form: number;
  preview: number;
}

/**
 * The narrowest share each split column may be dragged to, plus the ref that
 * measures the split.
 *
 * Asymmetric on purpose: the preview's floor is the larger one, because a
 * narrow form still reflows into something usable while a squeezed preview
 * stops representing the page. On a laptop that is 55% preview / 35% form;
 * a larger display derives smaller shares for both.
 *
 * Measures the split container, NOT the viewport. The sidebar, its collapsed
 * state, and the shell's gutters all change how much width the two columns
 * actually divide, so a viewport-derived floor is wrong by ~256px whenever
 * the sidebar is open — which is what made the limits drift when it was
 * toggled. A `ResizeObserver` also catches the sidebar animating open, which
 * fires no window event at all.
 *
 * Starts at the absolute floor, never at a large value: two floors summing
 * past 100 leave no range and the handle will not move.
 *
 * @returns `ref` — a callback ref for the element wrapping the split — and the
 *   minimum percentage for each column.
 */
export function useLivePreviewPanelMinSize(): {
  ref: (element: HTMLDivElement | null) => void;
  minSizes: LivePreviewPanelMinSizes;
} {
  const [splitElement, setSplitElement] = useState<HTMLDivElement | null>(null);
  const [minSizes, setMinSizes] = useState<LivePreviewPanelMinSizes>({
    form: DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE,
    preview: DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE,
  });

  useEffect(() => {
    if (!splitElement) return;

    const readMinSizes = () => {
      const splitWidth = splitElement.clientWidth;
      setMinSizes({
        form: resolveLivePreviewPanelMinSize({ splitWidth, column: "form" }),
        preview: resolveLivePreviewPanelMinSize({ splitWidth, column: "preview" }),
      });
    };
    readMinSizes();

    const observer = new ResizeObserver(readMinSizes);
    observer.observe(splitElement);
    return () => observer.disconnect();
  }, [splitElement]);

  return { ref: setSplitElement, minSizes };
}

/**
 * Tracks whether the live-preview panel is open for one collection or global.
 *
 * Two kinds of change drive `isOpen`:
 * - **Explicit** — the user clicks the header button or the ⋯ menu item
 *   (`toggle`). Persisted in a cookie so a page refresh at desktop width
 *   reopens it instantly instead of flashing closed then open, and clears
 *   the "was auto-closed" memory below — any explicit choice sticks until
 *   the user changes it again.
 * - **Automatic** — crossing the mobile breakpoint (`props.isMobile`
 *   flipping). Narrowing past it while open auto-closes the panel instead of
 *   letting a desktop split panel render as a full-screen takeover, and
 *   remembers that the close was automatic; widening back past it reopens
 *   the panel ONLY if that memory is still set, i.e. the user has not
 *   explicitly opened or closed it while narrow. Automatic transitions never
 *   touch the cookie — only `toggle()` does.
 *
 * The cookie is READ server-side by `NextAdminPage` via
 * `readLivePreviewPanelCookie` from `@vexcms/core` — that helper cannot live in
 * this module, which is client-only.
 *
 * @param props.slug - Scopes the cookie per collection/global.
 * @param props.initialOpen - The server-read cookie-or-default value, threaded
 *   down from `NextAdminPage`.
 * @param props.enabled - Whether live preview is configured for this slug.
 *   When false the panel stays closed and a stale open cookie is reset to closed.
 * @param props.isMobile - Whether the viewport is currently below the mobile
 *   breakpoint (`useIsMobile()`). Consulted only to detect breakpoint
 *   crossings between renders — the caller still decides what to render
 *   (split panel vs. mobile overlay) at each width.
 * @returns `isOpen` and a `toggle` function that flips it and rewrites the cookie.
 */
export function useLivePreviewPanelState(props: {
  slug: string;
  initialOpen: boolean;
  enabled: boolean;
  isMobile: boolean;
}): {
  isOpen: boolean;
  toggle: () => void;
} {
  const [isOpen, setIsOpen] = useState(props.enabled && props.initialOpen);
  // Mirrors `props.isMobile`, so a breakpoint crossing can be detected AND
  // corrected DURING RENDER (React's "adjusting state when a prop changes"
  // pattern — react.dev/learn/you-might-not-need-an-effect), rather than in a
  // `useEffect` that fires one commit later. An effect-based correction would
  // commit (and `LivePreviewMobileOverlay`'s `Sheet` would briefly mount)
  // `isOpen: true` for one frame at the exact moment `isMobile` flips true,
  // before the very next commit closed it again — confirmed in the browser:
  // Base UI's `Dialog` reads that flash as a real open-then-close and plays
  // its (invisible, but `pointer-events: auto`) exit transition over it,
  // leaving a full-viewport click-blocking layer behind for its duration.
  const [previousIsMobile, setPreviousIsMobile] = useState(props.isMobile);
  // `true` only while the panel is closed SOLELY because narrowing past the
  // mobile breakpoint auto-closed it — never because the user chose to close
  // it. Consulted when the viewport widens back past the breakpoint; cleared
  // by `toggle()` so any explicit open/close while narrow sticks. A ref, not
  // state: it never needs to trigger a render on its own, only to be read the
  // next time `isMobile` changes.
  const autoClosedRef = useRef(false);

  if (props.isMobile !== previousIsMobile) {
    setPreviousIsMobile(props.isMobile);
    if (props.isMobile) {
      // Narrowed past the breakpoint: an open panel would otherwise render as
      // a full-screen takeover — close it instead and remember the close was
      // automatic, so widening back can restore it. No cookie write: this is
      // not a user choice.
      if (isOpen) {
        autoClosedRef.current = true;
        setIsOpen(false);
      }
    } else if (autoClosedRef.current) {
      // Widened back past the breakpoint with nothing but an auto-close
      // since — restore it. No cookie write, same reasoning.
      autoClosedRef.current = false;
      setIsOpen(true);
    }
  }

  useEffect(() => {
    if (props.enabled) return;
    setIsOpen(false);
    autoClosedRef.current = false;
    if (readCookie(livePreviewPanelCookieName({ slug: props.slug })) === "1") {
      writeLivePreviewPanelCookie({ slug: props.slug, isOpen: false });
    }
  }, [props.enabled, props.slug]);

  const toggle = useCallback(() => {
    autoClosedRef.current = false;
    setIsOpen((prev) => {
      const next = prev === false;
      writeLivePreviewPanelCookie({ slug: props.slug, isOpen: next });
      return next;
    });
  }, [props.slug]);

  return { isOpen, toggle };
}

/**
 * Reads one preference cookie's raw value client-side — names and values are
 * written unencoded by `writePreferenceCookie`, so they are read the same way.
 *
 * @param name - Cookie name.
 * @returns The value, or `undefined` when absent or outside a browser.
 */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const entry = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return entry?.slice(prefix.length);
}

/**
 * Writes the panel's open/closed cookie client-side.
 *
 * @param props.slug - The collection or global the choice applies to.
 * @param props.isOpen - The new open state to persist.
 */
function writeLivePreviewPanelCookie(props: { slug: string; isOpen: boolean }): void {
  writePreferenceCookie({
    name: livePreviewPanelCookieName({ slug: props.slug }),
    value: props.isOpen ? "1" : "0",
  });
}

/**
 * Persists the split handle's position — the form column's percentage of the
 * pane — so a refresh renders at that width server-side instead of snapping to
 * it after hydration. Called from the panel group's `onLayout`.
 *
 * @param props.slug - The collection or global the split belongs to.
 * @param props.formPanelSize - The form column's new share of the split.
 */
export function writeLivePreviewLayoutCookie(props: {
  slug: string;
  formPanelSize: number;
}): void {
  writePreferenceCookie({
    name: livePreviewLayoutCookieName({ slug: props.slug }),
    // Whole percent: the sub-pixel precision react-resizable-panels reports is
    // noise in a cookie that only seeds the first paint.
    value: String(Math.round(props.formPanelSize)),
  });
}

/**
 * Writes one long-lived UI preference cookie, guarded the way
 * `ThemeProvider.tsx`'s `writeStoredTheme` guards `localStorage`.
 *
 * @param props.name - Cookie name.
 * @param props.value - Cookie value.
 */
function writePreferenceCookie(props: { name: string; value: string }): void {
  try {
    const oneYearInSeconds = 60 * 60 * 24 * 365;
    document.cookie = `${props.name}=${props.value}; path=/; max-age=${oneYearInSeconds}; samesite=lax`;
  } catch {
    // document.cookie can throw under Safari private mode / strict cookie
    // settings; losing a UI preference is not worth crashing the view.
  }
}
