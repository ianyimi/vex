import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { PageContent } from "../PageContent"

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let initialData: null | Record<string, unknown> = null
  try {
    initialData = await fetchQuery(api.pages.getBySlug, {
      slug,
      _vexDrafts: false,
    })
  } catch {
    // Fall back to client-only fetch
  }

  return <PageContent initialData={initialData} slug={slug} />
}
