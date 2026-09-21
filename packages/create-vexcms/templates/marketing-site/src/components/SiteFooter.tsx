"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { type RenderableBlock, RenderBlocks, useLivePreviewDocumentQuery } from "@vexcms/react"

import type { FootersDocument } from "~/vex.types"

import { blockComponents } from "~/vexcms/blocks"

type PageBlockLike = RenderableBlock

export function SiteFooter({
  initialData,
}: {
  initialData?: FootersDocument | null
}) {
  // See `SiteHeader`: the overlay only reaches documents a consumer hands it,
  // so editing the footer while previewing a page needs this wrapper.
  const { data: footer } = useLivePreviewDocumentQuery(
    {
      ...convexQuery(api.footers.getFirst, {}),
      initialData: initialData ?? undefined,
    },
    "footers",
  )

  const content = footer?.content as null | PageBlockLike[] | undefined
  if (!content) {return null}

  return (
    <RenderBlocks
      blocks={content}
      components={blockComponents}
    />
  )
}
