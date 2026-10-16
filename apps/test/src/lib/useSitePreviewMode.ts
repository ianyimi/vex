"use client"

import { useEffect, useState } from "react"

import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core"

/**
 * Whether this page load is inside an active live-preview session — both
 * `?vexLivePreview=1` and the session-verified `vex-live-preview` marker cookie
 * `proxy.ts` sets (`grantPreviewIfRequested`) are present.
 *
 * `PageContent` and `PostContent` read this to pick their base query. Mirrors
 * `@vexcms/react`'s internal `useLivePreviewEnabled` rather than importing it: the
 * boolean is needed to choose a query before `useLivePreviewQuery` runs, and widening
 * that package's public surface for this isn't worth five lines.
 *
 * Read in an effect, never during render, so the page stays statically
 * prerenderable and the first client render matches the server's.
 *
 * Advisory only: it just picks which query runs. The real boundary is each
 * `getBySlugPreview`'s server-side `readDrafts` check — a forged cookie selects the
 * preview query and gets an empty result, never draft content.
 *
 * @returns `true` once both signals are present in the browser; `false` before mount
 *   and on every load outside live preview.
 */
export function useSitePreviewMode(): boolean {
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    // Neither alone suffices: a pasted preview URL without a verified session, or an
    // admin browsing normally, must both stay on the published copy.
    const previewRequested =
      new URLSearchParams(window.location.search).get(LIVE_PREVIEW_QUERY_PARAM) === "1"
    const sessionVerified = document.cookie
      .split("; ")
      .some((cookie) => cookie === `${LIVE_PREVIEW_COOKIE}=1`)
    setPreviewMode(previewRequested && sessionVerified)
  }, [])

  return previewMode
}
