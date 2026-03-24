import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { PageContent } from "./PageContent"

export default async function HomePage() {
  let initialData: Record<string, unknown> | null = null
  try {
    initialData = await fetchQuery(api.pages.getBySlug, {
      slug: "home",
      _vexDrafts: false,
    })
  } catch {
    // Fall back to client-only fetch
  }

  return <PageContent initialData={initialData} />
}
