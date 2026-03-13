import { SidebarTrigger } from "@vexcms/ui"
import { sanitizeConfigForClient } from "@vexcms/core"

import config from "~/../vex.config"
import { getCurrentUser } from "~/auth/serverUtils"
import { AdminLayoutWrapper } from "./AdminLayoutWrapper"

const clientConfig = sanitizeConfigForClient(config)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  const permissionUser = user
    ? {
        id: user.id,
        roles: Array.isArray(user.role) ? user.role : [user.role].filter(Boolean),
        name: user.name,
        email: user.email,
        avatar: user.image,
      }
    : undefined

  return (
    <AdminLayoutWrapper
      config={clientConfig}
      user={user ? { name: user.name, avatar: user.image, email: user.email } : undefined}
      permissionUser={permissionUser}
    >
      <SidebarTrigger />
      <main className="flex flex-col flex-1 overflow-hidden">{children}</main>
    </AdminLayoutWrapper>
  )
}
