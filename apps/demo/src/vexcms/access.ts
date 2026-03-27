import { defineAccess } from "@vexcms/core"

import { USER_ROLES } from "~/db/constants"
import { footers, headers, media, pages, themes, users } from "~/vexcms/collections"
import { siteSettings } from "~/vexcms/globals"

const PROTECTED_PAGE_SLUGS = ["home", "features", "pricing", "roadmap"]

/**
 * Demo site access — fully permissive with delete protection on seeded pages.
 * All roles can access the admin panel and perform all CRUD operations.
 * Seeded pages (home, features, pricing, roadmap) cannot be deleted.
 * The DB resets daily at midnight.
 */
export const access = defineAccess({
  roles: [USER_ROLES.admin, USER_ROLES.user],
  resources: [pages, headers, footers, themes, users, media, siteSettings],
  adminRoles: [USER_ROLES.admin],
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
      admin: true,
      pages: {
        create: true,
        read: true,
        update: true,
        delete: ({ data: page }) => !PROTECTED_PAGE_SLUGS.includes(page.slug),
      },
      headers: {
        create: true,
        read: true,
        update: true,
        delete: ({ data: header }) => !(header.name === "Main Header"),
      },
      footers: {
        create: true,
        read: true,
        update: true,
        delete: ({ data: footer }) => !(footer.name === "Main Footer"),
      },
      themes: true,
      user: {
        create: true,
        read: false,
        update: false,
        delete: false,
      },
      media: true,
      site_settings: true,
    },
  },
})
