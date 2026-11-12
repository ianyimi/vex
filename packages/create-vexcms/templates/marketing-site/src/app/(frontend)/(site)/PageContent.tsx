"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { keepPreviousData } from "@tanstack/react-query"
import { IconNodeProvider, RenderBlocks, useIsLivePreviewActive, useLivePreviewQuery } from "@vexcms/react"

import type { CodeHighlightMap } from "~/lib/highlight"
import type { IconNodeMap } from "@vexcms/react"
import type { PagesDocument } from "~/vex.types"

import { CodeHighlightProvider } from "~/context/CodeHighlightContext"
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
   * Server-resolved icon nodes for `initialData`, built by
   * `resolveDocumentIconNodes`.
   */
  iconNodes?: IconNodeMap
  /**
   * Server-fetched `pages.getBySlug`/`pages.getBySlugPreview` result, hydrated as
   * the query's initial data. Published-only outside Draft Mode —
   * `useIsLivePreviewActive` cannot resolve until after mount (see its docstring), so
   * the server-rendered pass is never the client preview branch on its own;
   * `draftMode` below covers the Draft Mode case instead.
   */
  initialData?: PagesDocument[]
  /** URL slug to render. Omit (or empty) for the home page. */
  slug?: string
  /**
   * True when `page.tsx` server-rendered this page from `pages.getBySlugPreview`
   * (Draft Mode is active for this request — the live-preview iframe reaches this
   * route carrying the editor's session). Forces the preview query on this
   * component's FIRST client render too, matching the server's choice: without
   * it, the first client render would pick `getBySlug` — a hydration mismatch
   * against the server's `getBySlugPreview` render, which briefly flashed
   * `WelcomePage` for a draft-only page before `useIsLivePreviewActive` caught up.
   */
  draftMode?: boolean
}

/**
 * Renders one marketing page's blocks via `RenderBlocks` (Contract 1), or
 * falls back to base's bootstrap `WelcomePage` when no `home` page document
 * exists yet — a fresh scaffold before `pnpm seed` has run (Contract 3).
 *
 * Calls `pages.getBySlug` (published-only, `access.bypass`) outside live
 * preview and `pages.getBySlugPreview` (session-authenticated, gated on the
 * `readDrafts` action) once `useIsLivePreviewActive` confirms an active preview
 * session OR the server already rendered the preview layer (`draftMode`
 * prop) — the live-preview base-layer swap. Both always return an array
 * (empty when no match — the same shape every collection query returns);
 * `useLivePreviewQuery` performs the `[0]` narrowing itself and overlays any
 * unsaved editor values for this document on top of whichever base layer ran.
 *
 * `placeholderData: keepPreviousData` keeps the last-shown document on
 * screen while a newly-keyed query (a slug change, or the published→preview
 * swap once `useIsLivePreviewActive` resolves client-side) is still loading,
 * instead of flipping to `undefined` mid-flight and flashing `WelcomePage`.
 */
export function PageContent({ codeHighlights, iconNodes, slug, initialData, draftMode }: PageContentProps) {
  const normalizedSlug = slug && slug.length > 0 ? slug : "home"
  const previewModeActive = useIsLivePreviewActive() || Boolean(draftMode)

  const { data: page } = useLivePreviewQuery(
    {
      ...convexQuery(previewModeActive ? api.pages.getBySlugPreview : api.pages.getBySlug, {
        slug: normalizedSlug,
      }),
      initialData,
      placeholderData: keepPreviousData,
    },
    "pages",
  )

  if (!page) {
    return <WelcomePage />
  }

  return (
    <IconNodeProvider nodes={iconNodes ?? {}}>
      <CodeHighlightProvider highlights={codeHighlights ?? {}}>
        <RenderBlocks
          blocks={page.blocks}
          components={blockComponents}
        />
      </CodeHighlightProvider>
    </IconNodeProvider>
  )
}
