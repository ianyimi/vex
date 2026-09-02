import type { ReactNode } from "react"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import type { FootersDocument, HeadersDocument } from "~/vex.types"

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
  let headerData: HeadersDocument | null = null
  let footerData: FootersDocument | null = null

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
      {/* Sits above the sticky header so it is the first tab stop on every
          page. Visually hidden until focused. */}
      <a
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-100 focus-visible:rounded-sm focus-visible:border focus-visible:border-border focus-visible:bg-card focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-foreground"
        href="#main"
      >
        Skip to content
      </a>
      <SiteHeader initialData={headerData} />
      <main id="main">{children}</main>
      <SiteFooter initialData={footerData} />
    </>
  )
}
