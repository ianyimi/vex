import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { generatePageMetadata } from "~/lib/metadata"
import { PageContent } from "../PageContent"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generatePageMetadata({ slug })
}

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
