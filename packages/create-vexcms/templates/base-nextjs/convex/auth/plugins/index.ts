import { apiKey } from "@better-auth/api-key"
import { convex } from "@convex-dev/better-auth/plugins"
import authConfig from "@convex/auth.config"
import { nextCookies } from "better-auth/next-js"
import { admin, anonymous } from "better-auth/plugins"
// {{ORGANIZATIONS_IMPORT}}

import { USER_ROLES } from "~/db/constants"

/**
 * Returns a fresh array of Better Auth plugins for each VexCMS auth session.
 */
export const createPlugins = () => [
  admin({
    adminRoles: [USER_ROLES.admin],
    defaultRole: USER_ROLES.user,
  }),
  anonymous(),
  apiKey(),
  convex({ authConfig }),
  // {{ORGANIZATIONS_PLUGIN}}
  // this plugin must be last, per the convex dev CLI's own warnings
  nextCookies(),
]
