import { apiKey } from "@better-auth/api-key"
import { convex } from "@convex-dev/better-auth/plugins"
import authConfig from "@convex/auth.config"
import { nextCookies } from "better-auth/next-js"
import { admin, anonymous } from "better-auth/plugins"
// {{ORGANIZATIONS_IMPORT}}

import { USER_ROLES } from "~/db/constants"

/**
 * Returns a fresh array of Better Auth plugins for each VexCMS auth session.
 *
 * Returns a new array on every call so that plugin initialization — including
 * the `convex()` factory, which internally calls the deprecated oidc-provider
 * plugin — runs inside `createAuth()` rather than at module-eval time. This
 * lets `http.ts`'s console.warn filter suppress the deprecation noise before
 * it fires.
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
