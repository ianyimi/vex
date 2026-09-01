import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { generatePageMetadata } from "~/lib/metadata"
import { PageContent } from "./PageContent"

export async function generateMetadata() {
  return generatePageMetadata({ slug: "home" })
}

export default async function HomePage() {
  let initialData: Record<string, unknown>[] | undefined
  try {
    initialData = await fetchQuery(api.pages.getBySlug, { slug: "home" })
  } catch {
    // Fall back to client-only fetch
  }

  return <PageContent initialData={initialData} />
}
