import { Layout, Sidebar } from "@vexcms/admin-next"

import config from "~/../vex.config"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <Sidebar config={config} />
      <main className="flex-1 overflow-auto">{children}</main>
    </Layout>
  )
}
