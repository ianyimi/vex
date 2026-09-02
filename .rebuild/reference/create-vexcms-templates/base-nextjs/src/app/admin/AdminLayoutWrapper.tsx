"use client"

import { AdminLayout } from "@vexcms/admin-next"
import type { PermissionUser } from "@vexcms/admin-next"
import type { ClientVexConfig } from "@vexcms/core"
import { access } from "~/vexcms/access"

/**
 * Client wrapper that provides the access config directly (not through RSC serialization).
 * The access config contains callback functions that can't be serialized through RSC.
 */
export function AdminLayoutWrapper({
  config,
  user,
  permissionUser,
  children,
}: {
  config: ClientVexConfig
  user?: { name: string; email: string; avatar?: string }
  permissionUser?: PermissionUser
  children: React.ReactNode
}) {
  return (
    <AdminLayout
      config={config}
      user={user}
      permissionUser={permissionUser}
      access={access}
    >
      {children}
    </AdminLayout>
  )
}
