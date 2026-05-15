import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import { getCurrentUser } from "~/auth/serverUtils"
import config from "~/vex.config"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  return (
    <NextAdminLayout config={config} user={user ?? undefined}>
      {children}
    </NextAdminLayout>
  )
}
