import { defineAccess } from "@vexcms/core"

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants"
import { footers, headers, media, pages, themes, users } from "~/vexcms/collections"
import { siteSettings } from "~/vexcms/globals"

export const access = defineAccess({
  roles: [USER_ROLES.admin, USER_ROLES.user],
  resources: [pages, headers, footers, themes, users, media, siteSettings],
  userCollection: users,
  permissions: {
    admin: {
      admin: true,
      pages: true,
      headers: true,
      footers: true,
      themes: true,
      user: true,
      media: true,
      site_settings: true,
    },
    user: {
      admin: false,
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
})
