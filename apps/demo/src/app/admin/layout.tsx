import { SidebarTrigger } from "@vexcms/ui"
import { sanitizeConfigForClient } from "@vexcms/core"

import config from "~/../vex.config"
import { getCurrentUser } from "~/auth/serverUtils"
import { AdminLayoutWrapper } from "./AdminLayoutWrapper"

const clientConfig = sanitizeConfigForClient(config)

/**
 * Demo admin layout — no auth check.
 * Anonymous users are auto-signed-in via AutoAnonymousAuth in the root layout.
 * If the anonymous session hasn't been created yet (first page load),
 * the admin panel renders without user context and the client
 * will re-render once the session is established.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  const userRoles = user
    ? Array.isArray(user.role) ? user.role : [user.role].filter(Boolean)
    : ["user"]

  const permissionUser = user
    ? {
        id: user.id,
        roles: userRoles,
        name: user.name,
        email: user.email,
        avatar: user.image,
      }
    : {
        id: "anonymous",
        roles: ["user"],
        name: "Demo User",
        email: "demo@vexcms.dev",
      }

  return (
    <AdminLayoutWrapper
      config={clientConfig}
      user={user ? { name: user.name, avatar: user.image, email: user.email } : { name: "Demo User", email: "demo@vexcms.dev" }}
      permissionUser={permissionUser}
    >
      <SidebarTrigger />
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{children}</div>
    </AdminLayoutWrapper>
  )
}
