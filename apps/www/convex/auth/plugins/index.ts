import { apiKey } from "@better-auth/api-key"
import { convex } from "@convex-dev/better-auth/plugins"
import authConfig from "@convex/auth.config"
import { admin, anonymous } from "better-auth/plugins"

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
]
