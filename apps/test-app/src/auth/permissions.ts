import type { User } from "~/db/types"

import { TABLE_SLUG_USERS, USER_ROLES, type UserRole } from "~/db/constants"

export const AUTH_ACTIONS = {
  create: "create",
  delete: "delete",
  read: "read",
  update: "update",
} as const
export type AuthAction = (typeof AUTH_ACTIONS)[keyof typeof AUTH_ACTIONS]

export const RESOURCES = {
  users: TABLE_SLUG_USERS,
} as const
export type Permissions = {
  [TABLE_SLUG_USERS]: {
    action: AuthAction
    dataType: User
  }
}

export type Resource = (typeof RESOURCES)[keyof typeof RESOURCES]

export type RolesWithPermissions = Record<
  UserRole,
  Partial<{
    [Key in keyof Permissions]: Partial<Record<Permissions[Key]["action"], PermissionCheck<Key>>>
  }>
>

type PermissionCheck<Key extends keyof Permissions> =
  | (({ data, user }: { data: Permissions[Key]["dataType"]; user: User }) => boolean)
  | boolean

// type PermissionDataTypeExcluding<K extends keyof Permissions> = Permissions[Exclude<keyof Permissions, K>]["dataType"];
// usage: T extends PermissionDataTypeExcluding<"orgs" | "users">

const ROLES = {
  [USER_ROLES.admin]: {
    [TABLE_SLUG_USERS]: {
      create: true,
      delete: true,
      read: true,
      update: true,
    },
  },
  [USER_ROLES.user]: {
    [TABLE_SLUG_USERS]: {
      create: false,
      delete: ({ data: targetUser, user }) => user._id === targetUser._id,
      read: ({ data: targetUser, user }) => user._id === targetUser._id,
      update: ({ data: targetUser, user }) => user._id === targetUser._id,
    },
  },
} as const satisfies RolesWithPermissions

export function hasPermission<Resource extends keyof Permissions>({
  action,
  data,
  resource,
  user,
}: {
  action: Permissions[Resource]["action"]
  data?: Permissions[Resource]["dataType"]
  resource: Resource
  user?: null | User
}): boolean {
  if (!user?.role) {
    return false
  }

  return user.role.some((role) => {
    const permission = (ROLES as RolesWithPermissions)[role as UserRole][resource]?.[action]

    if (!permission) {
      return false
    }

    if (typeof permission === "boolean") {
      return permission
    }

    return data != null && permission({ data, user })
  })
}
