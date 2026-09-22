import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import { AuthServerProvider } from "~/components/providers/auth"
import { getCurrentUser } from "~/auth/serverUtils"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  return (
    // `VexConfigProvider` is mounted once by the root layout's
    // `ClientProviders`, for the admin and the public site alike.
    <AuthServerProvider>
      <NextAdminLayout user={user ?? undefined}>{children}</NextAdminLayout>
    </AuthServerProvider>
  )
}
