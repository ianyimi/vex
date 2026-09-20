import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import { images, pages, themes, users } from "~/vexcms/collections";
import { siteSettings } from "~/vexcms/globals";

const readOnly = {
  "*": false,
  read: true,
};

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
      pages: readOnly,
      adminPanel: {
        access: true,
        impersonate: false,
      },
      themes: readOnly,
      images: readOnly,
      siteSettings: {
        "*": false,
        read: () => ({ adminTheme: true, ogImage: true, name: true, description: true }),
        update: () => ({ adminTheme: true }),
      },
    },
  },
});
