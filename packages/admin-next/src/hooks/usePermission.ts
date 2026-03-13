"use client";

import { useMemo } from "react";
import { hasPermission, type AccessAction, type ResolvedFieldPermissions } from "@vexcms/core";
import { usePermissionContext } from "../context/PermissionContext";

export function usePermission(props: {
  resource: string;
  action: AccessAction;
  fields?: string[];
  data?: Record<string, any>;
}) {
  let ctx: ReturnType<typeof usePermissionContext> | null = null;
  try {
    ctx = usePermissionContext();
  } catch {
    // No permission provider — permissive default
  }

  return useMemo(() => {
    if (!ctx) {
      return {
        allowed: true,
        fieldPermissions: {} as ResolvedFieldPermissions,
        isFieldAllowed: (_field: string) => true,
      };
    }

    const result = hasPermission({
      access: ctx.access,
      user: { _id: ctx.user.id, ...ctx.user },
      userRoles: ctx.user.roles,
      resource: props.resource,
      action: props.action,
      fields: props.fields,
      data: props.data,
    });

    if (typeof result === "boolean") {
      return {
        allowed: result,
        fieldPermissions: {} as ResolvedFieldPermissions,
        isFieldAllowed: (_field: string) => result,
      };
    }

    const fieldPermissions = result;
    const allowed = Object.values(fieldPermissions).some((v) => v === true);

    return {
      allowed,
      fieldPermissions,
      isFieldAllowed: (field: string) => fieldPermissions[field] ?? false,
    };
  }, [ctx, props.resource, props.action, props.fields, props.data]);
}
