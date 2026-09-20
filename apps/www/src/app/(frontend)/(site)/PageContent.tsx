"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { RenderBlocks, useLivePreviewQuery } from "@vexcms/react"

import type { CodeHighlightMap } from "~/lib/highlight"
import type { PagesDocument } from "~/vex.types"

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
  /** Server-fetched `pages.getBySlug` result, hydrated as the query's initial data. */
  initialData?: PagesDocument[]
  /** URL slug to render. Omit (or empty) for the home page. */
  slug?: string
}

/**
 * Renders one marketing page's blocks via `RenderBlocks` (Contract 1), or
 * falls back to base's bootstrap `WelcomePage` when no `home` page document
 * exists yet — a fresh scaffold before `pnpm seed` has run (Contract 3).
 *
 * `pages.getBySlug` always returns an array (empty when no match — the same
 * shape every collection query returns); `useLivePreviewQuery` performs that
 * narrowing itself and overlays any unsaved editor values for this document
 * when the page is being rendered inside a live preview.
 */
export function PageContent({ codeHighlights, slug, initialData }: PageContentProps) {
  const normalizedSlug = slug && slug.length > 0 ? slug : "home"

  const { data: page } = useLivePreviewQuery(
    {
      ...convexQuery(api.pages.getBySlug, { slug: normalizedSlug }),
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
