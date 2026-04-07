import type { Metadata } from "next"

// Stubbed — metadata helpers removed in rebuild (buildSiteMetadata not yet rebuilt)
export async function generatePageMetadata(_props: { slug?: string } = {}): Promise<Metadata> {
  return { title: "Vex CMS" }
}
