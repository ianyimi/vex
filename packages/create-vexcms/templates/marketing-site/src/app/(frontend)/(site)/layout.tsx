import type { ReactNode } from "react"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { SiteFooter } from "~/components/SiteFooter"
import { SiteHeader } from "~/components/SiteHeader"

/**
 * Marketing chrome: header + footer around every site page. Auth routes live
 * outside this group (directly under `(frontend)`), so they stay chrome-free.
 */
export default async function SiteLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  let headerData: null | Record<string, unknown> = null
  let footerData: null | Record<string, unknown> = null

  try {
    ;[headerData, footerData] = await Promise.all([
      fetchQuery(api.headers.getFirst),
      fetchQuery(api.footers.getFirst),
    ])
  } catch {
    // Convex not available — fall back to client-only fetch
  }

  return (
    <>
      <SiteHeader initialData={headerData} />
      <main>{children}</main>
      <SiteFooter initialData={footerData} />
    </>
  )
}
