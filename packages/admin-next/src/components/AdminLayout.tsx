import type { ClientVexConfig, VexAccessConfig } from "@vexcms/core";
import type { ComponentPropsWithRef } from "react";
import type { PermissionUser } from "../context/PermissionContext";
import type { NavUserData } from "./AppSidebar";
import { AdminLayoutClient } from "./AdminLayoutClient";

export function AdminLayout({
  config,
  user,
  permissionUser,
  access,
  children,
}: {
  config: ClientVexConfig;
  user?: NavUserData;
  permissionUser?: PermissionUser;
  access?: VexAccessConfig;
} & ComponentPropsWithRef<"div">) {
  return (
    <AdminLayoutClient
      config={config}
      user={user}
      permissionUser={permissionUser}
      access={access}
    >
      {children}
    </AdminLayoutClient>
  );
}
