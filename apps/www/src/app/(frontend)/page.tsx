"use client"

import { RenderBlocks } from "@vexcms/ui"
import { useQuery } from "convex/react"
import { anyApi } from "convex/server"

import { blockComponents } from "~/vexcms/blocks"

export default function HomePage() {
  // Query the first page with slug "home"
  const page = useQuery(anyApi.vex.api.pages.search, {
    field: "slug",
    value: "home",
    _vexDrafts: false,
  })

  if (page === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // If no home page exists, show a welcome message
  const homePage = page?.[0] ?? null
  if (!homePage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-4xl font-bold tracking-tight">Vex CMS</h1>
        <p className="text-lg text-muted-foreground">
          Create a page with slug &ldquo;home&rdquo; to get started.
        </p>
      </div>
    )
  }

  return (
    <RenderBlocks
      blocks={homePage.content as any}
      components={blockComponents}
    />
  )
}
