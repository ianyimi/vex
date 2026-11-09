"use client"

import { useSyncExternalStore } from "react"

import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core"

/**
 * Whether this page load is inside an active live-preview session — both
 * `?vexLivePreview=1` and the session-verified `vex-live-preview` marker
 * cookie `proxy.ts` sets (`grantPreviewIfRequested`) are present.
 *
 * `PageContent` and `PostContent` read this to pick their base query.
 * Mirrors `@vexcms/react`'s internal `useLivePreviewEnabled` rather than
 * importing it: the boolean is needed to choose a query before
 * `useLivePreviewQuery` runs, and widening that package's public surface
 * for this isn't worth five lines.
 *
 * Read through `useSyncExternalStore` with a `false` server snapshot, so the
 * page stays statically prerenderable and hydration matches the server's
 * render before the browser value takes over.
 *
 * Advisory only: it just picks which query runs. The real boundary is each
 * `getBySlugPreview`'s server-side `readDrafts` check — a forged cookie
 * selects the preview query and gets an empty result, never draft content.
 *
 * @returns `true` once both signals are present in the browser; `false`
 *   before mount and on every load outside live preview.
 */
export function useSitePreviewMode(): boolean {
  return useSyncExternalStore(subscribeNever, readPreviewMode, () => false)
}

/**
 * Neither signal changes during a page load, so there is nothing to subscribe
 * to. Module-level so its identity is stable: `useSyncExternalStore`
 * resubscribes whenever `subscribe` changes.
 */
function subscribeNever(): () => void {
  return () => undefined
}

function readPreviewMode(): boolean {
  const previewRequested =
    new URLSearchParams(window.location.search).get(LIVE_PREVIEW_QUERY_PARAM) === "1"
  const sessionVerified = document.cookie
    .split("; ")
    .some((cookie) => cookie === `${LIVE_PREVIEW_COOKIE}=1`)
  return previewRequested && sessionVerified
}
