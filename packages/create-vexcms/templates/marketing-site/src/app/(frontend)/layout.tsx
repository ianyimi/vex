import type { ReactNode } from "react"

import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { SiteFooter } from "~/components/SiteFooter"
import { SiteHeader } from "~/components/SiteHeader"
import { ThemeStyle } from "~/components/ThemeStyle"

export default async function FrontendLayout({
  auth,
  children,
}: Readonly<{
  auth: ReactNode
  children: ReactNode
}>) {
  let headerData: Record<string, unknown> | null = null
  let footerData: Record<string, unknown> | null = null

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
      <ThemeStyle />
      <SiteHeader initialData={headerData} />
      <main>{children}</main>
      <SiteFooter initialData={footerData} />
      {auth}
    </>
  )
}
