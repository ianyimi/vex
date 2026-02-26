import { SidebarInset, SidebarProvider } from "@vexcms/ui";
import { AppSidebar, NavUserData } from "./AppSidebar";
import { ComponentPropsWithRef } from "react";
import { VexConfig } from "@vexcms/core";

export function AdminLayout({
  config,
  user,
  children,
}: { config: VexConfig; user?: NavUserData } & ComponentPropsWithRef<"div">) {
  return (
    <SidebarProvider>
      <AppSidebar config={config} user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
