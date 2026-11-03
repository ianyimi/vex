"use client";

import { useCallback, useRef } from "react";

/** Wiring for one scroll container whose position outlives the element. */
export interface PreservedScrollTop {
  /** Ref callback for the scroll container — restores the remembered offset on attach. */
  ref: (element: HTMLDivElement | null) => void;
  /** Scroll handler for the same container — records the offset as it changes. */
  onScroll: () => void;
}

/**
 * Keeps one scroll offset across scroll containers that replace each other.
 *
 * The edit view scrolls a different element depending on whether the preview
 * split is open: the plain content region, or the form column inside the
 * panel group. Toggling the preview therefore unmounts one scroller and mounts
 * another, and a freshly mounted element starts at `scrollTop = 0` — which
 * reads as the form jumping back to the top every time the preview opens.
 *
 * Both containers share one instance of this hook, so the offset carries over
 * in either direction. The value lives in a ref rather than state: it changes
 * on every scroll event and nothing renders from it, so storing it in state
 * would re-render the whole view on every wheel tick for no visible reason.
 *
 * @returns A `ref` and an `onScroll` handler to spread onto each container.
 */
export function usePreservedScrollTop(): PreservedScrollTop {
  const scrollTopRef = useRef(0);
  const elementRef = useRef<HTMLDivElement | null>(null);

  const ref = useCallback((element: HTMLDivElement | null) => {
    elementRef.current = element;
    if (!element) return;

    element.scrollTop = scrollTopRef.current;

    // A container mounted with a taller layout still settling (the split's
    // columns size after the panel group measures itself) clamps the
    // assignment to its current `scrollHeight`. One frame later the real
    // height is known, so re-apply if the clamp bit.
    requestAnimationFrame(() => {
      if (elementRef.current !== element) return;
      if (element.scrollTop !== scrollTopRef.current) {
        element.scrollTop = scrollTopRef.current;
      }
    });
  }, []);

  const onScroll = useCallback(() => {
    const element = elementRef.current;
    if (element) scrollTopRef.current = element.scrollTop;
  }, []);

  return { ref, onScroll };
}
