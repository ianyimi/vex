export const USER_ROLES = {
  admin: "admin",
  user: "user",
  editor: "editor",
  member: "member",
  author: "author",
} as const
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
