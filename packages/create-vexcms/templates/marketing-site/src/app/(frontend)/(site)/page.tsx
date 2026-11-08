import { api } from "@convex/_generated/api"

import type { PagesDocument } from "~/vex.types"

import { generatePageMetadata } from "~/lib/metadata"
import { highlightPageBlocks } from "~/lib/highlight"
import { resolveDocumentIconNodes } from "~/lib/iconNodes"
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
  const [codeHighlights, iconNodes] = await Promise.all([
    highlightPageBlocks(initialData?.[0]?.blocks),
    resolveDocumentIconNodes({ documents: initialData ?? [] }),
  ])

  return (
    <PageContent codeHighlights={codeHighlights} iconNodes={iconNodes} initialData={initialData} />
  )
}
