"use client";

import { useState, useCallback, useMemo } from "react";
import { SidebarInset, SidebarProvider } from "@vexcms/ui";
import { AppSidebar, NavUserData } from "./AppSidebar";
import type { ClientVexConfig, VexAccessConfig } from "@vexcms/core";
import { PermissionProvider, type PermissionUser } from "../context/PermissionContext";
import { ImpersonationBanner } from "./ImpersonationBanner";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";

export function AdminLayoutClient({
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
  children: React.ReactNode;
}) {
  const [impersonatedUser, setImpersonatedUser] = useState<PermissionUser | undefined>(undefined);

  const canImpersonate = permissionUser && access
    ? permissionUser.roles.some((r) => access.adminRoles.includes(r))
    : false;

  // Fetch impersonatable users client-side (needs auth token from ConvexBetterAuthProvider)
  const impersonationQuery = useQuery({
    ...convexQuery(anyApi.vex.impersonation.listImpersonatableUsers, {}),
    enabled: canImpersonate,
  });

  const impersonatableUsers = useMemo(() => {
    if (!impersonationQuery.data) return [];
    return impersonationQuery.data as PermissionUser[];
  }, [impersonationQuery.data]);

  const handleStopImpersonation = useCallback(() => {
    setImpersonatedUser(undefined);
  }, []);

  const handleStartImpersonation = useCallback((target: PermissionUser) => {
    setImpersonatedUser(target);
  }, []);

  const content = (
    <SidebarProvider className="h-svh overflow-hidden">
      <AppSidebar config={config} user={user} onImpersonate={handleStartImpersonation} impersonatableUsers={impersonatableUsers} />
      <SidebarInset className="overflow-y-hidden">
        <ImpersonationBanner onStopImpersonation={handleStopImpersonation} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );

  if (permissionUser) {
    return (
      <PermissionProvider
        user={permissionUser}
        access={access}
        impersonatedUser={impersonatedUser}
      >
        {content}
      </PermissionProvider>
    );
  }

  return content;
}
