"use client"

import { RenderBlocks, type RenderableBlock } from "@vexcms/react"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

type PageBlockLike = RenderableBlock

export function SiteFooter({
  initialData,
}: {
  initialData?: Record<string, unknown> | null
}) {
  const { data: footer } = useQuery({
    ...convexQuery(anyApi.footers.getFirst, {}),
    initialData: initialData ?? undefined,
  })

  const content = footer?.content as PageBlockLike[] | null | undefined
  if (!content) return null

  return (
    <RenderBlocks
      blocks={content}
      components={blockComponents}
    />
  )
}
