"use client";

import { useSyncExternalStore } from "react";
import {
  LIVE_PREVIEW_COOKIE,
  LIVE_PREVIEW_QUERY_PARAM,
  LIVE_PREVIEW_WINDOW_NAME,
} from "@vexcms/core";

/**
 * Whether this page is a live-preview surface: the session-verified
 * `LIVE_PREVIEW_COOKIE` marker holds `"1"`, AND the page asked to preview —
 * `?vexLivePreview=1` is in the URL, or the window carries
 * `LIVE_PREVIEW_WINDOW_NAME` (written by `LivePreviewProvider` the first time
 * preview activated in this window, so it survives navigations that drop the
 * param).
 *
 * `false` during the server render and hydration, then the browser's answer,
 * so a page reading it stays statically prerenderable and hydrates without a
 * mismatch. Advisory: picking a draft-reading query on `true` is safe because
 * every draft read is gated server-side by its own `readDrafts` check.
 *
 * @returns `true` once the cookie and a preview request are both present.
 */
export function useIsLivePreviewActive(): boolean {
  return useSyncExternalStore(subscribeNever, readIsLivePreviewActive, readServerSnapshot);
}

/**
 * Neither signal has a change event to subscribe to; every render re-reads the
 * snapshot instead.
 *
 * @returns A no-op unsubscribe.
 */
function subscribeNever(): () => void {
  return () => undefined;
}

/**
 * Reads both gate signals from the browser.
 *
 * @returns `true` when the marker cookie holds `"1"` and the URL carries the
 *   query param or the window carries the preview name.
 */
function readIsLivePreviewActive(): boolean {
  const isPreviewRequested =
    new URLSearchParams(window.location.search).get(LIVE_PREVIEW_QUERY_PARAM) === "1" ||
    window.name === LIVE_PREVIEW_WINDOW_NAME;
  const isSessionVerified = document.cookie
    .split("; ")
    .some((cookie) => cookie === `${LIVE_PREVIEW_COOKIE}=1`);
  return isPreviewRequested && isSessionVerified;
}

/**
 * Server and hydration snapshot.
 *
 * @returns Always `false`.
 */
function readServerSnapshot(): boolean {
  return false;
}
