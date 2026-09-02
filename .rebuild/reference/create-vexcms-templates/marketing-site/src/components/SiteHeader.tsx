"use client"

import { RenderBlocks } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export function SiteHeader({
  initialData,
}: {
  initialData?: Record<string, unknown> | null
}) {
  const { data: header } = useQuery({
    ...convexQuery(anyApi.headers.getFirst, {}),
    initialData: initialData ?? undefined,
  })

  if (!header?.content) return null

  return (
    <RenderBlocks
      blocks={header.content as any}
      components={blockComponents}
    />
  )
}
