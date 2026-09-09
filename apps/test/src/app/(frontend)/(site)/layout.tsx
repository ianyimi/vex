import type { ReactNode } from "react"

import { ThemeStyle } from "~/components/ThemeStyle"

/**
 * Site-only shell: emits the site theme's first-paint CSS. Auth routes live
 * outside this group (directly under `(frontend)`), so they stay free of
 * this Convex read and the root layout stays free of it too — that is what
 * lets `/`, `/[slug]`, `/sitemap.xml`, and `/robots.txt` prerender.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <>
      <ThemeStyle />
      {children}
    </>
  )
}
