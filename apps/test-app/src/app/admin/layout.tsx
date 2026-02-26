import { AdminLayout as Layout } from "@vexcms/admin-next"
import { SidebarTrigger } from "@vexcms/ui"

import config from "~/../vex.config"
import { getCurrentUser } from "~/auth/serverUtils"
import { type User } from "~/db/types"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = (await getCurrentUser()) as User
  return (
    <Layout
      config={config}
      user={user ? { name: user.name, avatar: user.image, email: user.email } : undefined}
    >
      <SidebarTrigger />
      <main className="flex-1 overflow-auto">{children}</main>
    </Layout>
  )
}
