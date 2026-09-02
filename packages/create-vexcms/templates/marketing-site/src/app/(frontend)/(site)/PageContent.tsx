"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useQuery } from "@tanstack/react-query"
import { RenderBlocks } from "@vexcms/react"

import type { PagesDocument } from "~/vex.types"

import { WelcomePage } from "~/components/WelcomePage"
import { blockComponents } from "~/vexcms/blocks"

export interface PageContentProps {
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
 * shape every collection query returns), so this always reads `pages?.[0]`.
 */
export function PageContent({ slug, initialData }: PageContentProps) {
  const normalizedSlug = slug && slug.length > 0 ? slug : "home"

  const { data: pages, isPending } = useQuery({
    ...convexQuery(api.pages.getBySlug, { slug: normalizedSlug }),
    initialData,
  })

  const page = pages?.[0]

  if (isPending && initialData === undefined) {
    return null
  }

  if (!page) {
    return <WelcomePage />
  }

  return (
    <RenderBlocks
      blocks={page.blocks}
      components={blockComponents}
    />
  )
}
