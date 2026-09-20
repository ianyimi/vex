"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
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
 * @returns `ref` to attach to the element wrapping the split, and the minimum
 *   percentage for each column.
 */
export function useLivePreviewPanelMinSize(): {
  ref: RefObject<HTMLDivElement | null>;
  minSizes: LivePreviewPanelMinSizes;
} {
  const ref = useRef<HTMLDivElement>(null);
  const [minSizes, setMinSizes] = useState<LivePreviewPanelMinSizes>({
    form: DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE,
    preview: DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const readMinSizes = () => {
      const splitWidth = element.clientWidth;
      setMinSizes({
        form: resolveLivePreviewPanelMinSize({ splitWidth, column: "form" }),
        preview: resolveLivePreviewPanelMinSize({ splitWidth, column: "preview" }),
      });
    };
    readMinSizes();

    const observer = new ResizeObserver(readMinSizes);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, minSizes };
}

/**
 * Tracks whether the live-preview panel is open for one collection or
 * global, persisting the user's explicit choice in a cookie so a page refresh
 * reopens it instantly instead of flashing closed then open.
 *
 * The cookie is READ server-side by `NextAdminPage` via
 * `readLivePreviewPanelCookie` from `@vexcms/core` — that helper cannot live in
 * this module, which is client-only.
 *
 * @param props.slug - Scopes the cookie per collection/global.
 * @param props.initialOpen - The server-read cookie-or-default value, threaded
 *   down from `NextAdminPage`.
 * @returns `isOpen` and a `toggle` function that flips it and rewrites the cookie.
 */
export function useLivePreviewPanelState(props: { slug: string; initialOpen: boolean }): {
  isOpen: boolean;
  toggle: () => void;
} {
  const [isOpen, setIsOpen] = useState(props.initialOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = prev === false;
      writeLivePreviewPanelCookie({ slug: props.slug, isOpen: next });
      return next;
    });
  }, [props.slug]);

  return { isOpen, toggle };
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
