import { SidebarTrigger } from "@vexcms/ui"
import { checkAdminAccess, sanitizeConfigForClient } from "@vexcms/core"
import { redirect } from "next/navigation"

import config from "~/../vex.config"
import { getCurrentUser } from "~/auth/serverUtils"
import { access } from "~/vexcms/access"
import { AdminLayoutWrapper } from "./AdminLayoutWrapper"

const clientConfig = sanitizeConfigForClient(config)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  // No user — redirect to sign in
  if (!user) {
    redirect("/auth/sign-in")
  }

  const userRoles = Array.isArray(user.role) ? user.role : [user.role].filter(Boolean)

  // Check admin panel access
  const hasAccess = checkAdminAccess({
    access,
    user: user as Record<string, any>,
    userRoles,
  })

  if (!hasAccess) {
    redirect("/?error=unauthorized")
  }

  const permissionUser = {
    id: user.id,
    roles: userRoles,
    name: user.name,
    email: user.email,
    avatar: user.image,
  }

  return (
    <AdminLayoutWrapper
      config={clientConfig}
      user={{ name: user.name, avatar: user.image, email: user.email }}
      permissionUser={permissionUser}
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-6 py-2">
          <SidebarTrigger />
        </div>
        {children}
      </div>
    </AdminLayoutWrapper>
  )
}
