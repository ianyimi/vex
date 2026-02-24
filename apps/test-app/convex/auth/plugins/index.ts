import { nextCookies } from "better-auth/next-js"
import { admin, apiKey } from "better-auth/plugins"

import { USER_ROLES } from "~/db/constants"

const plugins = [
  admin({
    adminRoles: [USER_ROLES.admin],
    defaultRole: USER_ROLES.user,
  }),
  apiKey(),
  nextCookies(),
]

export default plugins
