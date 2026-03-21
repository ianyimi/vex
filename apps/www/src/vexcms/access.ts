import { defineAccess } from "@vexcms/core"

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants"
import { users } from "~/vexcms/collections"

export const access = defineAccess({
  permissions: {
    admin: {
      // Admins have full access to all resources
      user: true,
    },
    user: {
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
  resources: [users],
  roles: [USER_ROLES.user, USER_ROLES.admin],
  userCollection: users,
})
