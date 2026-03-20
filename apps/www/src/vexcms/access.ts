import { defineAccess } from "@vexcms/core"

import { TABLE_SLUG_MEDIA, TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants"
import { media, users } from "~/vexcms/collections"

export const access = defineAccess({
  permissions: {
    admin: {
      // Admins have full access to all resources
      [TABLE_SLUG_MEDIA]: true,
      [TABLE_SLUG_USERS]: true,
    },
    user: {
      [TABLE_SLUG_MEDIA]: {
        create: true,
        delete: false,
        read: true,
        update: false,
      },
      [TABLE_SLUG_USERS]: {
        create: false,
        delete: false,
        read: ({ data: targetUser, user }) => {
          return targetUser._id === user._id
        },
        update: ({ data: targetUser, user }) => {
          return targetUser._id === user._id
        },
      },
    },
  },
  resources: [users, media],
  roles: [USER_ROLES.user, USER_ROLES.admin],
  userCollection: users,
})
