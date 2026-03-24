import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { PreviewPageContent } from "./PreviewPageContent"

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let initialData: Record<string, unknown> | null = null
  try {
    initialData = await fetchQuery(api.pages.getBySlug, {
      slug,
      _vexDrafts: "snapshot" as any,
    })
  } catch {
    // Fall back to client-only fetch
  }

  return <PreviewPageContent slug={slug} initialData={initialData} />
}
