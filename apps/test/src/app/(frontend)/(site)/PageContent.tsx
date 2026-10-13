"use client"

import { useEffect, useState } from "react"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core"
import { RenderBlocks, useLivePreviewQuery } from "@vexcms/react"

import type { CodeHighlightMap } from "~/lib/highlight"
import type { Page } from "~/vex.types"

import { CodeHighlightProvider } from "~/components/CodeHighlightContext"
import { WelcomePage } from "~/components/WelcomePage"
import { blockComponents } from "~/vexcms/blocks"

export interface PageContentProps {
  /**
   * Server-highlighted code panes for `initialData`, keyed by
   * `codeHighlightKey`. Built by `highlightPageBlocks`, because nothing below
   * this client boundary can await shiki.
   */
  codeHighlights?: CodeHighlightMap
  /**
   * Server-fetched `pages.getBySlug` result, hydrated as the query's initial data.
   * Always the published copy — `useSitePreviewMode` cannot resolve until after mount
   * (see its docstring), so the server-rendered pass is never the preview branch.
   */
  initialData?: Page[]
  /** URL slug to render. Omit (or empty) for the home page. */
  slug?: string
}

/**
 * Renders one marketing page's blocks via `RenderBlocks` (Contract 1), or falls back
 * to base's bootstrap `WelcomePage` when no `home` page document exists yet — a fresh
 * scaffold before `pnpm seed` has run (Contract 3).
 *
 * Calls `pages.getBySlug` (published-only, `access.bypass`) outside live preview and
 * `pages.getBySlugPreview` (session-authenticated, gated on the `readDrafts` action)
 * once `useSitePreviewMode` confirms an active preview session — the live-preview
 * base-layer swap. Both always return an array (empty when no match — the same
 * shape every collection query returns); `useLivePreviewQuery` performs the
 * `[0]` narrowing itself and overlays any unsaved editor values for this document on
 * top of whichever base layer ran.
 */
export function PageContent({ codeHighlights, slug, initialData }: PageContentProps) {
  const normalizedSlug = slug && slug.length > 0 ? slug : "home"
  const previewModeActive = useSitePreviewMode()

  const { data: page } = useLivePreviewQuery(
    {
      ...convexQuery(previewModeActive ? api.pages.getBySlugPreview : api.pages.getBySlug, {
        slug: normalizedSlug,
      }),
      initialData,
    },
    "pages",
  )

  if (!page) {
    return <WelcomePage />
  }

  return (
    <CodeHighlightProvider highlights={codeHighlights ?? {}}>
      <RenderBlocks
        blocks={page.blocks}
        components={blockComponents}
      />
    </CodeHighlightProvider>
  )
}

/**
 * Whether this page load is inside an active live-preview session — both
 * `?vexLivePreview=1` and the session-verified `vex-live-preview` marker cookie
 * `proxy.ts` sets (`grantPreviewIfRequested`) are present.
 *
 * `PageContent` reads this to pick its base query. Mirrors `@vexcms/react`'s
 * internal `useLivePreviewEnabled` rather than importing it: the boolean is needed to
 * choose a query before `useLivePreviewQuery` runs, and widening that package's
 * public surface for one caller isn't worth five lines.
 *
 * Read in an effect, never during render, so the page stays statically
 * prerenderable and the first client render matches the server's.
 *
 * Advisory only: it just picks which query runs. The real boundary is
 * `getBySlugPreview`'s server-side `readDrafts` check — a forged cookie selects the
 * preview query and gets an empty result, never draft content.
 *
 * @returns `true` once both signals are present in the browser; `false` before mount
 *   and on every load outside live preview.
 */
function useSitePreviewMode(): boolean {
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
