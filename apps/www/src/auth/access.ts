import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_ORGANIZATIONS, TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import { footers, headers, images, pages, siteSettings, themes } from "~/vexcms/collections";
import { nav } from "~/vexcms/globals";

export const access = defineAccess({
  // enabled: false,
  roles: Object.values(USER_ROLES),
  userRolesField: "roles",
  userCollectionSlug: TABLE_SLUG_USERS,
  orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
  resources: [footers, headers, images, pages, siteSettings, themes, nav],
  customResources: {
    edit: {
      actions: ["save", "download"],
    },
  },
  permissions: {
    [USER_ROLES.admin]: {
      "*": true,
    },
    [USER_ROLES.user]: {
      "*": false,
      images: {
        "*": false,
        // read: true,
        update: ({ data: image }) => {
          return !image.src.includes("https://maprios.com");
        },
      },
      edit: {
        "*": false,
        save: true,
      },
      pages: {
        "*": false,
        read: true,
        // update: true,
      },
      headers: {
        "*": false,
        read: true,
      },
      footers: {
        "*": ({ user, data: footer }) => false,
        read: true,
      },
      adminPanel: {
        access: true,
        impersonate: false,
      },
      nav: {
        "*": true,
      },
    },
  },
});
