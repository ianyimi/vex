import { defineAccess } from "@vexcms/core";

import { TABLE_SLUG_USERS, USER_ROLES } from "~/db/constants";
import { images, pages, themes, users } from "~/vexcms/collections";
import { siteSettings } from "~/vexcms/globals";

const readOnly = {
  "*": false,
  read: true,
};

/**
 * `pages.versions.drafts: true` (versioning-drafts spec) adds five actions to `pages`'
 * permission surface — `readDrafts`, `saveDraft`, `publish`, `unpublish`,
 * `deleteVersions` (`DRAFT_ACTIONS`, `@vexcms/core`) — beside the CRUD set every
 * resource already carries. Neither role below needed a new entry to gate them:
 * - `[USER_ROLES.admin]`'s blanket `"*": true` already covers every action on every
 *   resource, drafts included.
 * - `[USER_ROLES.user]`'s `pages: readOnly` (`"*": false, read: true`) already denies
 *   every action it does not name, drafts included — the same default-deny posture
 *   that already denies `create`/`update`/`delete` here (P-007). `anonRole` resolves
 *   to `user`, so this is also what an unauthenticated visitor gets.
 * `convex/pages.ts`'s `getBySlugPreview` is the only caller that requests `readDrafts`
 * explicitly (`access: { action: DRAFT_ACTIONS.readDrafts }`); every other draft
 * action is exercised only from the admin panel, which always runs as `admin`.
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
