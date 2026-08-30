export const USER_ROLES = {
  admin: "admin",
  user: "user",
  /** Full editorial control over all content, regardless of author. */
  editor: "editor",
  /** Can only touch content they authored. */
  contributor: "contributor",
} as const
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
