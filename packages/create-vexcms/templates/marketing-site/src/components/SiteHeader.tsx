"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useQuery } from "@tanstack/react-query"
import { type RenderableBlock, RenderBlocks } from "@vexcms/react"

import type { HeadersDocument } from "~/vex.types"

import { blockComponents } from "~/vexcms/blocks"

type PageBlockLike = RenderableBlock

export function SiteHeader({
  initialData,
}: {
  initialData?: HeadersDocument | null
}) {
  const { data: header } = useQuery({
    ...convexQuery(api.headers.getFirst, {}),
    initialData: initialData ?? undefined,
  })

  const content = header?.content as null | PageBlockLike[] | undefined
  if (!content) {return null}

  return (
    <RenderBlocks
      blocks={content}
      components={blockComponents}
    />
  )
}
