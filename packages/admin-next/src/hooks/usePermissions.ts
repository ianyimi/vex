"use client";

import { useMemo } from "react";
import { hasPermission, type ResolvedFieldPermissions } from "@vexcms/core";
import { usePermissionContext } from "../context/PermissionContext";

type PermissionResult = {
  allowed: boolean;
  fieldPermissions: ResolvedFieldPermissions;
  isFieldAllowed: (field: string) => boolean;
};

const ALLOW_ALL: PermissionResult = {
  allowed: true,
  fieldPermissions: {} as ResolvedFieldPermissions,
  isFieldAllowed: () => true,
};

function resolvePermission(props: {
  access: Parameters<typeof hasPermission>[0]["access"];
  user: Record<string, unknown>;
  userRoles: string[];
  resource: string;
  action: "create" | "read" | "update" | "delete";
  fields?: string[];
  data?: Record<string, unknown>;
}): PermissionResult {
  const result = hasPermission({
    access: props.access,
    user: props.user,
    userRoles: props.userRoles,
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
}

/**
 * Check all CRUD permissions for a resource in a single hook call.
 *
 * Returns permissive defaults (all allowed) when no PermissionProvider exists
 * or no access config is defined.
 *
 * @param props.resource - Collection/global slug
 * @param props.fields - Optional specific fields to check (returns field maps when provided)
 * @param props.data - Optional document data for dynamic permission callbacks
 * @returns Object with create, read, update, delete permission results
 */
export function usePermissions(props: {
  resource: string;
  fields?: string[];
  data?: Record<string, unknown>;
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
        create: ALLOW_ALL,
        read: ALLOW_ALL,
        update: ALLOW_ALL,
        delete: ALLOW_ALL,
      };
    }

    const common = {
      access: ctx.access,
      user: { _id: ctx.user.id, ...ctx.user },
      userRoles: ctx.user.roles,
      resource: props.resource,
      fields: props.fields,
      data: props.data,
    };

    return {
      create: resolvePermission({ ...common, action: "create" }),
      read: resolvePermission({ ...common, action: "read" }),
      update: resolvePermission({ ...common, action: "update" }),
      delete: resolvePermission({ ...common, action: "delete" }),
    };
  }, [ctx, props.resource, props.fields, props.data]);
}
