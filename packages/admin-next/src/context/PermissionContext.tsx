"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { VexAccessConfig } from "@vexcms/core";

export interface PermissionUser {
  id: string;
  roles: string[];
  name: string;
  email: string;
  avatar?: string;
}

export interface ImpersonationState {
  active: boolean;
  impersonatedUser?: PermissionUser;
  realUser: PermissionUser;
}

interface PermissionContextValue {
  user: PermissionUser;
  access?: VexAccessConfig;
  impersonation: ImpersonationState;
  canAccessAdmin: boolean;
  canImpersonate: boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider(props: {
  user: PermissionUser;
  access?: VexAccessConfig;
  impersonatedUser?: PermissionUser;
  children: ReactNode;
}) {
  const value = useMemo<PermissionContextValue>(() => {
    const effectiveUser = props.impersonatedUser ?? props.user;

    const canAccessAdmin = props.access
      ? props.user.roles.some((r) => props.access!.adminRoles.includes(r))
      : true;

    return {
      user: effectiveUser,
      access: props.access,
      impersonation: {
        active: !!props.impersonatedUser,
        impersonatedUser: props.impersonatedUser,
        realUser: props.user,
      },
      canAccessAdmin,
      canImpersonate: canAccessAdmin,
    };
  }, [props.user, props.access, props.impersonatedUser]);

  return (
    <PermissionContext.Provider value={value}>
      {props.children}
    </PermissionContext.Provider>
  );
}

export function usePermissionContext(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error("usePermissionContext must be used within a PermissionProvider");
  }
  return ctx;
}
