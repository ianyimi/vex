export const USER_ROLES = {
  admin: "admin",
  user: "user",
  /** Full editorial control over all content, regardless of author. */
  editor: "editor",
  /** Can only touch content they authored. */
  contributor: "contributor",
  /**
   * Anonymous demo sessions from the header's Admin button. Mirrors `apps/www`'s
   * `user` role exactly: read-only admin browsing plus switching the admin theme.
   */
  guest: "guest",
} as const
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
