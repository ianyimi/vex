import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"

import { ResetCountdown } from "~/components/ResetCountdown"
import { SiteFooter } from "~/components/SiteFooter"
import { SiteHeader } from "~/components/SiteHeader"

export default async function FrontendLayout({
  auth,
  children,
}: Readonly<{
  auth: React.ReactNode
  children: React.ReactNode
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
      <ResetCountdown />
      <div className="bg-primary text-primary-foreground text-center text-sm py-1.5 px-4">
        This is a live demo — all changes reset daily at midnight UTC.{" "}
        <a href="https://vexcms.dev" className="underline font-medium">
          Visit the main site &rarr;
        </a>
      </div>
      <SiteHeader initialData={headerData} />
      <main>{children}</main>
      <SiteFooter initialData={footerData} />
      {auth}
    </>
  )
}
