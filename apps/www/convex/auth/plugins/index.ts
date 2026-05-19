import { apiKey } from "@better-auth/api-key"
import { convex } from "@convex-dev/better-auth/plugins"
import authConfig from "@convex/auth.config"
import { nextCookies } from "better-auth/next-js"
import { admin, anonymous, organization } from "better-auth/plugins"

import { USER_ROLES } from "~/db/constants"

/**
 * Returns a fresh array of Better Auth plugins for each VexCMS auth session.
 *
 * Returns a new array on every call so that plugin initialization — including the
 * `convex()` factory which internally calls the deprecated oidc-provider plugin —
 * runs inside `createAuth()` rather than at module-eval time. This lets the
 * console.warn filter in http.ts suppress the deprecation noise before it fires.
 *
 * Includes: admin roles, anonymous access, organization/team support, API key auth,
 * Next.js cookie integration, and Convex session storage.
 *
 * @see authOptions in apps/www/src/auth/options.ts
 * @see betterAuthAdapter in @vexcms/better-auth
 */
export const createPlugins = () => [
  admin({
    adminRoles: [USER_ROLES.admin],
    defaultRole: USER_ROLES.user,
  }),
  anonymous(),
  organization({
    schema: {
      organization: {
        additionalFields: {
          test: {
            type: "string",
            input: false,
            required: false,
          },
        },
      },
      invitation: {
        additionalFields: {
          roles: {
            type: "string[]",
            input: true,
            required: true,
          },
        },
      },
    },
    teams: { enabled: true },
  }),
  apiKey(),
  nextCookies(),
  convex({ authConfig }),
]
