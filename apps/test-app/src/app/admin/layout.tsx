import { AdminLayout as Layout } from "@vexcms/admin-next"
import { SidebarTrigger } from "@vexcms/ui"
import { sanitizeConfigForClient } from "@vexcms/core"

import config from "~/../vex.config"
import { getCurrentUser } from "~/auth/serverUtils"

const clientConfig = sanitizeConfigForClient(config)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  return (
    <Layout
      config={clientConfig}
      user={user ? { name: user.name, avatar: user.image, email: user.email } : undefined}
    >
      <SidebarTrigger />
      <main className="flex flex-col flex-1 overflow-hidden">{children}</main>
    </Layout>
  )
}
