import { apiKey } from "@better-auth/api-key"
import { convex } from "@convex-dev/better-auth/plugins"
import authConfig from "@convex/auth.config"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins"

import { USER_ROLES } from "~/db/constants"

// Return a new array each call so plugin initialization (including the convex()
// factory which internally calls the deprecated oidc-provider plugin) runs inside
// createAuth() rather than at module-eval time. This lets the console.warn filter
// in http.ts suppress the deprecation noise before it fires.
export const createPlugins = () => [
  admin({
    adminRoles: [USER_ROLES.admin],
    defaultRole: USER_ROLES.user,
  }),
  apiKey(),
  nextCookies(),
  convex({ authConfig }),
]
