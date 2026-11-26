"use client";

import { useCallback, useEffect, useRef } from "react";

/** Wiring for one scroll container whose position outlives the element. */
export interface PreservedScrollTop {
  /** Ref callback for the scroll container — restores the remembered offset on attach. */
  ref: (element: HTMLDivElement | null) => void;
  /** Scroll handler for the same container — records the offset as it changes. */
  onScroll: () => void;
}

/**
 * `sessionStorage` key prefix for a persisted edit-view scroll offset.
 * `server/ScrollRestoreScript.tsx`'s generic, keyless head script reads
 * under this SAME literal (it cannot import this constant: that file stays
 * directive-free, importable from non-RSC bundlers, so nothing in its chain
 * can pull in a `"use client"` module) — keep the two in sync by hand.
 */
export const SESSION_STORAGE_KEY_PREFIX = "vex-admin:edit-scroll:";

const RESIZE_REAPPLY_WINDOW_MS = 1000;

function readStoredScrollTop(key: string): number | undefined {
  try {
    const raw = window.sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${key}`);
    if (raw === null) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredScrollTop(key: string, value: number): void {
  try {
    window.sessionStorage.setItem(`${SESSION_STORAGE_KEY_PREFIX}${key}`, String(value));
  } catch {
    return;
  }
}

/**
 * Clears every persisted edit-view scroll offset — call this from the
 * sign-out flow, alongside `disableLivePreview()` (`@vexcms/next/livePreview/client`),
 * so a different identity signing in on the same tab never inherits a prior
 * user's remembered scroll positions.
 *
 * Collects matching keys first, then removes them: `sessionStorage`'s own
 * `key(index)` enumeration shifts as entries are removed, so removing while
 * iterating it directly would skip entries.
 */
export function clearEditScrollStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(SESSION_STORAGE_KEY_PREFIX)) keysToRemove.push(key);
    }
    for (const key of keysToRemove) window.sessionStorage.removeItem(key);
  } catch {
    return;
  }
}

/**
 * Keeps one scroll offset across scroll containers that replace each other,
 * and — when `key` is given — across a full page refresh.
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
 * `key` (a caller-composed id, e.g. `` `${collection.slug}:${documentId}` ``)
 * additionally mirrors the offset into `sessionStorage` on every scroll and
 * seeds `scrollTopRef` from it on this hook instance's first container
 * attach only (a later attach, from the preview-split toggle, always trusts
 * the in-memory value instead, since it is more recent than whatever was
 * last written). Omit `key` to keep the purely in-memory, toggle-only
 * behavior (e.g. a document not yet persisted). A key going stale — its
 * document deleted — is harmless: Convex ids are never reused, so the entry
 * is simply never read again and ages out with the tab's session (or a
 * sign-out, via `clearEditScrollStorage`).
 *
 * First-paint restore for a hard page load is a SEPARATE mechanism —
 * `server/ScrollRestoreScript.tsx`'s head-level script, matched to a
 * container via its `data-vex-scroll-key` attribute — not this hook, which
 * only runs once React mounts. This hook's OWN restore below still matters
 * for that same hard-load case as the fallback once React takes over: a
 * container that mounts with its real content still loading (async field
 * data — relationship/richtext chunks, populated rows) can clamp the
 * restored `scrollTop` to whatever `scrollHeight` it has at attach time.
 * The ref callback reapplies the remembered offset on the next frame, then
 * watches the container's own first child with a `ResizeObserver` for a
 * capped window after mount, reapplying on every reported growth — so a
 * late-arriving height still lands the view back where it was instead of
 * leaving it clamped near the top.
 *
 * @param key - Per-document session key (e.g. `posts:<id>`); when set, the offset is also kept in `sessionStorage` so it survives a refresh. Omit for in-memory only.
 * @returns A `ref` and an `onScroll` handler to spread onto each container.
 */
export function usePreservedScrollTop(key?: string): PreservedScrollTop {
  const scrollTopRef = useRef(0);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const restoredFromStorageRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const keyRef = useRef(key);
  keyRef.current = key;

  const disconnectResizeObserver = useCallback(() => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
  }, []);

  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      elementRef.current = element;
      disconnectResizeObserver();
      if (!element) return;

      if (!restoredFromStorageRef.current) {
        restoredFromStorageRef.current = true;
        if (scrollTopRef.current === 0 && keyRef.current) {
          const stored = readStoredScrollTop(keyRef.current);
          if (stored !== undefined) scrollTopRef.current = stored;
        }
      }

      element.scrollTop = scrollTopRef.current;

      const reapply = () => {
        if (elementRef.current !== element) return;
        if (element.scrollTop !== scrollTopRef.current) {
          element.scrollTop = scrollTopRef.current;
        }
      };
      requestAnimationFrame(reapply);

      const content = element.firstElementChild;
      if (content && typeof ResizeObserver !== "undefined") {
        const mountedAt = Date.now();
        const observer = new ResizeObserver(() => {
          if (Date.now() - mountedAt > RESIZE_REAPPLY_WINDOW_MS) {
            observer.disconnect();
            return;
          }
          reapply();
        });
        observer.observe(content);
        resizeObserverRef.current = observer;
      }
    },
    [disconnectResizeObserver],
  );

  const onScroll = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;
    scrollTopRef.current = element.scrollTop;
    if (keyRef.current) writeStoredScrollTop(keyRef.current, element.scrollTop);
  }, []);

  useEffect(() => disconnectResizeObserver, [disconnectResizeObserver]);

  return { ref, onScroll };
}
