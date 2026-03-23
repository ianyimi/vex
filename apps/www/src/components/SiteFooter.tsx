"use client"

import { RenderBlocks } from "@vexcms/ui"
import { useQuery } from "convex/react"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export function SiteFooter() {
  const result = useQuery(anyApi.vex.api.footers.list, {
    paginationOpts: { numItems: 1, cursor: null },
  })
  const footer = result?.page?.[0]

  if (!footer?.content) return null

  return (
    <RenderBlocks
      blocks={footer.content as any}
      components={blockComponents}
    />
  )
}
