import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import { images, pages, themes, users } from "~/vexcms/collections";
import { siteSettings } from "~/vexcms/globals";

/**
 * Access control (RBAC) for the admin panel and every registered collection.
 *
 * `admin` gets unrestricted access. `user` is the public demo role — it may
 * open the admin panel, *read* `pages`, `themes`, and `siteSettings`, and
 * *update* only `siteSettings.adminTheme` (every other field on that global
 * stays denied by the field map's `"*": false`). `anonRole: user` is what
 * extends that to a caller carrying no `roles` entry at all, which is every
 * anonymous session minted by `AdminDemoButton`. All other write actions stay
 * denied by the `"*": false` default, so the panel is otherwise read-only for
 * anyone who is not an admin.
 *
 * Add a resource here whenever you register a new collection in
 * `vex.config.ts`.
 *
 * @see https://docs.vexcms.dev/guides/access-control/
 */
export const access = defineAccess({
  anonRole: USER_ROLES.user,
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  resources: [images, users, pages, siteSettings, themes],
  permissions: {
    [USER_ROLES.admin]: {
      "*": true,
    },
    [USER_ROLES.user]: {
      "*": false,
      pages: {
        "*": false,
        read: true,
      },
      adminPanel: {
        access: true,
        impersonate: false,
      },
      themes: {
        "*": false,
        read: true,
      },
      siteSettings: {
        "*": false,
        read: () => ({ adminTheme: true, name: true, description: true }),
        update: () => ({ adminTheme: true }),
      },
    },
  },
});
