"use client"

import { RenderBlocks, type RenderableBlock } from "@vexcms/react"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

type PageBlockLike = RenderableBlock

export function SiteHeader({
  initialData,
}: {
  initialData?: Record<string, unknown> | null
}) {
  const { data: header } = useQuery({
    ...convexQuery(anyApi.headers.getFirst, {}),
    initialData: initialData ?? undefined,
  })

  const content = header?.content as PageBlockLike[] | null | undefined
  if (!content) return null

  return (
    <RenderBlocks
      blocks={content}
      components={blockComponents}
    />
  )
}
