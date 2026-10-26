"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { RenderBlocks, useLivePreviewQuery } from "@vexcms/react"

import type { CodeHighlightMap } from "~/lib/highlight"
import type { Page } from "~/vex.types"

import { CodeHighlightProvider } from "~/context/CodeHighlightContext"
import { WelcomePage } from "~/components/WelcomePage"
import { useSitePreviewMode } from "~/lib/useSitePreviewMode"
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

