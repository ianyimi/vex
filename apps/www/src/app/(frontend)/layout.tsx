import type { ReactNode } from "react"

/**
 * Public-site layout.
 *
 * Exists so the `@auth` parallel slot is received by the route group that
 * declares it, rather than leaking up to the root layout — which is also shared
 * with `/admin`, where an auth modal slot means nothing. Restores the structure
 * the marketing template and the pre-rebuild app both used.
 *
 * The theme is *not* applied here. It is applied once in the root layout so the
 * admin panel inherits it too; see `~/components/ThemeStyle`.
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
      {children}
      {auth}
    </>
  )
}
