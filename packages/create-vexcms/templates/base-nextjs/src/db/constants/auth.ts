export const USER_ROLES = {
  admin: "admin",
  user: "user",
} as const
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
