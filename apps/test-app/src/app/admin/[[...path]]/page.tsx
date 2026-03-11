import { AdminPage } from "@vexcms/admin-next"
import { sanitizeConfigForClient } from "@vexcms/core"

import config from "~/../vex.config"

const clientConfig = sanitizeConfigForClient(config)

interface Props {
  params: Promise<{ path?: string[] }>
}

export default async function Page({ params }: Props) {
  const { path } = await params
  return <AdminPage config={clientConfig} path={path} />
}
