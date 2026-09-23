import type { ReactNode } from "react"

import { ThemeStyle } from "~/components/ThemeStyle"

/**
 * Public-site layout.
 *
 * Exists so the `@auth` parallel slot is received by the route group that
 * declares it, rather than leaking up to the root layout — which is also shared
 * with `/admin`, where an auth modal slot means nothing. Restores the structure
 * the marketing template and the pre-rebuild app both used.
 *
 * Also emits the site theme's first-paint CSS. This is the highest layout
 * allowed to read Convex (the root stays free of Convex reads) and the only one
 * covering `auth/[pathname]` as well as `(site)`. Emitted from `(site)`, a hard
 * load of `/auth/sign-in` server-rendered `globals.css`'s palette and let
 * `<ThemeLive />` repaint the real theme after hydration — a visible colour
 * flash on exactly the page `/admin` redirects signed-out callers to. The read
 * is prerender-safe (`~/lib/vex` wraps `ConvexHttpClient`, never `fetchQuery`),
 * so `/` and `/[slug]` still build static.
 */
export default function FrontendLayout({
  auth,
  children,
}: Readonly<{
  auth: ReactNode
  children: ReactNode
}>) {
  return (
    <>
      <ThemeStyle />
      {children}
      {auth}
    </>
  )
}
