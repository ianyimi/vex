import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import { images, pages, users } from "~/vexcms/collections";
import { siteSettings } from "~/vexcms/globals";

/**
 * Access control (RBAC) for the admin panel and every registered collection.
 *
 * `admin` gets unrestricted access. `user` is the public demo role — it may
 * open the admin panel and *read* `pages` and `siteSettings`, and nothing
 * else. `anonRole: user` is what extends that to a caller carrying no `roles`
 * entry at all, which is every anonymous session minted by
 * `AdminDemoButton`. Write actions stay denied by the `"*": false` default, so
 * the panel is read-only for anyone who is not an admin.
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
  resources: [images, users, pages, siteSettings],
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
      siteSettings: {
        "*": false,
        read: true,
      },
    },
  },
});
