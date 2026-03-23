"use client"

import { RenderBlocks } from "@vexcms/ui"
import { useQuery } from "convex/react"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export function SiteHeader() {
  const result = useQuery(anyApi.vex.api.headers.list, {
    paginationOpts: { numItems: 1, cursor: null },
  })
  const header = (result as any)?.page?.[0]

  if (!header?.content) return null

  return (
    <RenderBlocks
      blocks={header.content as any}
      components={blockComponents}
    />
  )
}
