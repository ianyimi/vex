import { SidebarInset, SidebarProvider } from "@vexcms/ui";
import { AppSidebar, NavUserData } from "./AppSidebar";
import { ComponentPropsWithRef } from "react";
import { ClientVexConfig } from "@vexcms/core";

export function AdminLayout({
  config,
  user,
  children,
}: { config: ClientVexConfig; user?: NavUserData } & ComponentPropsWithRef<"div">) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar config={config} user={user} />
      <SidebarInset className="overflow-y-hidden">{children}</SidebarInset>
    </SidebarProvider>
  );
}
