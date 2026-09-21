"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { type RenderableBlock, RenderBlocks, useLivePreviewDocumentQuery } from "@vexcms/react"

import type { HeadersDocument } from "~/vex.types"

import { blockComponents } from "~/vexcms/blocks"

type PageBlockLike = RenderableBlock

export function SiteHeader({
  initialData,
}: {
  initialData?: HeadersDocument | null
}) {
  // `useLivePreviewDocumentQuery`, not a bare `useQuery`: the live-preview
  // overlay only reaches documents a consumer hands it, so a plain query here
  // means editing the header while previewing a page changes nothing.
  const { data: header } = useLivePreviewDocumentQuery(
    {
      ...convexQuery(api.headers.getFirst, {}),
      initialData: initialData ?? undefined,
    },
    "headers",
  )

  const content = header?.content as null | PageBlockLike[] | undefined
  if (!content) {return null}

  return (
    <RenderBlocks
      blocks={content}
      components={blockComponents}
    />
  )
}
