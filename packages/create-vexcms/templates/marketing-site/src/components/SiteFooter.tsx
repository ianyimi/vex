"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useQuery } from "@tanstack/react-query"
import { type RenderableBlock, RenderBlocks } from "@vexcms/react"

import type { FootersDocument } from "~/vex.types"

import { blockComponents } from "~/vexcms/blocks"

type PageBlockLike = RenderableBlock

export function SiteFooter({
  initialData,
}: {
  initialData?: FootersDocument | null
}) {
  const { data: footer } = useQuery({
    ...convexQuery(api.footers.getFirst, {}),
    initialData: initialData ?? undefined,
  })

  const content = footer?.content as null | PageBlockLike[] | undefined
  if (!content) {return null}

  return (
    <RenderBlocks
      blocks={content}
      components={blockComponents}
    />
  )
}
