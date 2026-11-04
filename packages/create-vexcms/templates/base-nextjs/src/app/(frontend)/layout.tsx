import type { ReactNode } from "react"

/**
 * Public-site layout.
 *
 * The `@auth` parallel slot used to live under this group (`(frontend)/@auth`)
 * but has moved to `app/@auth` — a sibling of the root layout — so the same
 * intercepting `/auth/[pathname]` modal also covers `(vexcms)` (the admin
 * top-bar "Sign in" button), not just this group. The root layout renders it
 * now; this layout no longer takes an `auth` prop.
 */
export default function FrontendLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return children
}
