import { defineAccess } from "@vexcms/core"

import {
  TABLE_SLUG_ORGANIZATIONS,
  TABLE_SLUG_USERS,
  USER_ROLES,
} from "~/db/constants"
import { images, users } from "~/vexcms/collections"

/**
 * Access control (RBAC) for the admin panel and every registered collection.
 *
 * `admin` gets unrestricted access. `user` can read and update only their own
 * profile row and cannot reach the admin panel. Add a resource here whenever
 * you register a new collection in `vex.config.ts`.
 *
 * @see https://vexcms.dev/docs/access-control
 */
export const access = defineAccess({
  anonRole: USER_ROLES.user,
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
  resources: [images, users],
  permissions: {
    [USER_ROLES.admin]: {
      "*": true,
    },
    [USER_ROLES.user]: {
      "*": false,
      adminPanel: {
        access: false,
      },
      user: {
        "*": false,
        read: {
          constraints: ({ user, q }) => q.withIndex("by_email", (fq) => fq.eq("email", user.email)),
        },
        update: {
          constraints: ({ user, q }) => q.filter((fq) => fq.eq("email", user.email)),
        },
      },
    },
  },
})
