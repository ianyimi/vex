import { NextAdminPage } from "@vexcms/next/server"

import config from "~/vex.config"

export default function AdminPage({ params }: { params: Promise<{ path?: string[] }> }) {
  return <NextAdminPage config={config} params={params} />
}
