import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import { getUserOrg } from "~/auth/server"

/**
 * `AuthServerProvider` (`~/components/providers/auth`) used to wrap `{children}` here —
 * removed (perf fix, measured): it `await`s `getToken()`/`getUserOrg()` BEFORE
 * returning its own `{children}`, so React cannot begin streaming ANYTHING inside it
 * until that resolves, regardless of `NextAdminLayout`'s own `authPromise` plumbing.
 * Safe to remove: its own `AuthContext` (`useAuth()`) has zero consumers inside the
 * admin tree.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Not awaited — `NextAdminLayout` resolves it inside the sidebar's OWN `<Suspense>`
  // boundary (`@vexcms/react`'s `AdminLayout`), so `{children}` and this layout's own
  // static chrome stream immediately instead of waiting on a Convex round trip.
  const authPromise = getUserOrg()
  return (
    // `VexConfigProvider` is mounted once by the root layout's
    // `ClientProviders`, for the admin and the public site alike.
    <NextAdminLayout authPromise={authPromise}>{children}</NextAdminLayout>
  )
}
