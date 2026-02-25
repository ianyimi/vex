import { AdminPage } from "@vexcms/admin-next"

import config from "~/../vex.config"

interface Props {
  params: Promise<{ path?: string[] }>
}

export default async function Page({ params }: Props) {
  const { path } = await params
  return <AdminPage config={config} path={path} />
}
