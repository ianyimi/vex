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
 * profile row, cannot reach the admin panel, and can read `images`. Add a
 * resource here whenever you register a new collection in `vex.config.ts`.
 *
 * `anonRole: user` also covers every unauthenticated public-site request,
 * including the build-time metadata fetch. `images.read` is what lets the
 * public site show uploaded media at all: `MediaImage` and
 * `src/lib/metadata.ts` resolve uploads through the RBAC-gated
 * `vex/media:getUrl`, so without it anonymous visitors get no images and the
 * page ships no `og:image`. Narrow it with a `constraints` rule if some media
 * must stay private; do not remove it.
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
      images: {
        "*": false,
        read: true,
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
