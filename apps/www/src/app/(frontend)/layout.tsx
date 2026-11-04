import type { ReactNode } from "react"

import { FirstAdminBootstrap } from "~/components/FirstAdminBootstrap"
import { ThemeStyle } from "~/components/ThemeStyle"

/**
 * Frontend shell: first-paint theme CSS and the first-admin bootstrap. The
 * marketing chrome (header/footer) lives in the nested `(site)` group so
 * auth routes (`/auth/sign-in`, sign-up, …) render standalone — themed, but
 * without the site navigation wrapped around the form.
 *
 * The `@auth` parallel slot used to live under this group (`(frontend)/@auth`)
 * but has moved to `app/@auth` — a sibling of the root layout — so the same
 * intercepting `/auth/[pathname]` modal also covers `(vexcms)` (the admin
 * top-bar "Sign in" button), not just this group. The root layout renders it
 * now; this layout no longer takes an `auth` prop.
 *
 * `<ThemeStyle />` belongs at THIS level, not in `(site)`. It is the highest
 * layout allowed to read Convex (the root stays free of Convex reads) and the
 * only one that also covers `auth/[pathname]`. Emitted from `(site)`, a hard
 * load of `/auth/sign-in` server-rendered `globals.css`'s palette and let
 * `<ThemeLive />` repaint the real theme after hydration — a visible colour
 * flash on exactly the page `/admin` redirects signed-out callers to. The read
 * is prerender-safe (`~/lib/vex` wraps `ConvexHttpClient`, never
 * `fetchQuery`), so `/` and `/[slug]` still build static.
 */
export default function FrontendLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <>
      <ThemeStyle />
      <FirstAdminBootstrap />
      {children}
    </>
  )
}
