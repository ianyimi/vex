import { api } from "@convex/_generated/api"

import type { PagesDocument } from "~/vex.types"

import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"

import { PageContent } from "./PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither `vexConfig.revalidate.revalidateSeconds`
// nor an imported constant is accepted ("Invalid segment configuration export").
export const revalidate = 3600

export async function generateMetadata() {
  return generatePageMetadata({ slug: "home" })
}

export default async function HomePage() {
  let initialData: PagesDocument[] | undefined
  try {
    initialData = await vex.query(api.pages.getBySlug, { slug: "home" })
  } catch {
    // Fall back to client-only fetch
  }

  return <PageContent initialData={initialData} />
}
