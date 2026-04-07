import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import config from "~/../vex.config"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <NextAdminLayout config={config}>{children}</NextAdminLayout>
}
