import type { ReactNode } from "react"

import { FirstAdminBootstrap } from "~/components/FirstAdminBootstrap"

/**
 * Frontend shell: first-admin bootstrap + the `@auth` parallel slot only.
 * The marketing chrome (header/footer) lives in the nested `(site)` group so
 * auth routes (`/auth/sign-in`, sign-up, …) render standalone — themed via
 * the root layout, but without the site navigation wrapped around the form.
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
      <FirstAdminBootstrap />
      {children}
      {auth}
    </>
  )
}
