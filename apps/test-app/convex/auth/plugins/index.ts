import { convex } from "@convex-dev/better-auth/plugins"
import authConfig from "@convex/auth.config"
import { nextCookies } from "better-auth/next-js"
import { admin, apiKey } from "better-auth/plugins"

import { USER_ROLES } from "~/db/constants"

const plugins = [
  admin({
    adminRoles: [USER_ROLES.admin],
    defaultRole: USER_ROLES.user,
  }),
  apiKey(),
  convex({ authConfig }),
  nextCookies(),
]

export default plugins
