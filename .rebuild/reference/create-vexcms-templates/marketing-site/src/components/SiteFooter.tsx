"use client"

import { RenderBlocks } from "@vexcms/ui"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export function SiteFooter({
  initialData,
}: {
  initialData?: Record<string, unknown> | null
}) {
  const { data: footer } = useQuery({
    ...convexQuery(anyApi.footers.getFirst, {}),
    initialData: initialData ?? undefined,
  })

  if (!footer?.content) return null

  return (
    <RenderBlocks
      blocks={footer.content as any}
      components={blockComponents}
    />
  )
}
