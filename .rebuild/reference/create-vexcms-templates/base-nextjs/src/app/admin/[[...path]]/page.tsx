import { sanitizeConfigForClient } from "@vexcms/core"

import config from "~/../vex.config"
import { AdminPageWrapper } from "../AdminPageWrapper"

const clientConfig = sanitizeConfigForClient(config)

interface Props {
  params: Promise<{ path?: string[] }>
}

export default async function Page({ params }: Props) {
  const { path } = await params
  return <AdminPageWrapper config={clientConfig} path={path} />
}
