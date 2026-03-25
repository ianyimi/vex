import { defineAccess, type VexAccessConfig } from "@vexcms/core"

import {
  TABLE_SLUG_FOOTERS,
  TABLE_SLUG_HEADERS,
  TABLE_SLUG_MEDIA,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_SITE_SETTINGS,
  TABLE_SLUG_THEMES,
  USER_ROLES,
} from "~/db/constants"
import { footers, headers, media, pages, themes, users } from "~/vexcms/collections"
import { siteSettings } from "~/vexcms/globals"

export const access: VexAccessConfig = defineAccess({
  adminRoles: [USER_ROLES.admin],
  permissions: {
    [USER_ROLES.admin]: {
      admin: true,
      [TABLE_SLUG_FOOTERS]: true,
      [TABLE_SLUG_HEADERS]: true,
      [TABLE_SLUG_MEDIA]: true,
      [TABLE_SLUG_PAGES]: true,
      [TABLE_SLUG_SITE_SETTINGS]: true,
      [TABLE_SLUG_THEMES]: true,
    },
    [USER_ROLES.user]: {
      admin: false,
      [TABLE_SLUG_FOOTERS]: {
        create: false,
        delete: false,
        read: true,
        update: false,
      },
      [TABLE_SLUG_HEADERS]: {
        create: false,
        delete: false,
        read: true,
        update: false,
      },
      [TABLE_SLUG_MEDIA]: {
        create: false,
        delete: false,
        read: true,
        update: false,
      },
      [TABLE_SLUG_PAGES]: {
        create: true,
        delete: false,
        read: true,
        update: false,
      },
      [TABLE_SLUG_SITE_SETTINGS]: {
        create: false,
        delete: false,
        read: true,
        update: false,
      },
      [TABLE_SLUG_THEMES]: {
        create: false,
        delete: false,
        read: true,
        update: false,
      },
    },
  },
  resources: [pages, media, headers, footers, themes, siteSettings],
  roles: Object.values(USER_ROLES),
  userCollection: users,
})
