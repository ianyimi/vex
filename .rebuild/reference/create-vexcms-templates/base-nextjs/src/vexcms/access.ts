import { defineAccess } from "@vexcms/core"

import { USER_ROLES } from "~/db/constants"
import { users } from "~/vexcms/collections/users"

/**
 * Access control configuration for the admin panel.
 *
 * - `admin` on each role controls whether that role can access the admin panel.
 * - Resource permissions control CRUD access per collection.
 * - Add your own collections to `resources` for autocomplete in `permissions`.
 *
 * @see https://vexcms.dev/docs/access-control
 */
export const access = defineAccess({
  roles: [USER_ROLES.admin, USER_ROLES.editor, USER_ROLES.user],
  adminRoles: [USER_ROLES.admin],
  resources: [users],
  userCollection: users,
  permissions: {
    admin: {
      admin: true,
      user: true,
    },
    editor: {
      admin: true,
      user: {
        create: false,
        delete: false,
        read: true,
        update: false,
      },
    },
    user: {
      admin: false,
      user: {
        create: false,
        delete: false,
        read: ({ data, user }) => data._id === user._id,
        update: ({ data, user }) => data._id === user._id,
      },
    },
  },
})
