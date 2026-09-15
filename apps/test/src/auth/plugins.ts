import { apiKey } from "@better-auth/api-key";
import { convex } from "@convex-dev/better-auth/plugins";
import authConfig from "@convex/auth.config";
import { nextCookies } from "better-auth/next-js";
import { admin, anonymous, organization } from "better-auth/plugins";

import { USER_ROLES } from "~/db/constants";

import { authSchema } from "./schema";

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
 * @see authOptions in apps/test/src/auth/options.ts
 * @see betterAuthAdapter in @vexcms/better-auth
 */
export const createPlugins = () => [
  admin({
    adminRoles: [USER_ROLES.admin],
    defaultRole: USER_ROLES.user,
  }),
  anonymous(),
  organization({
    // Both halves of the org wiring come from the shared descriptor: `teams`
    // decides whether the `team`/`teamMember` tables exist, so reading it here
    // keeps the live adapter and the admin panel's declared collections from
    // drifting (`defineServerConfig` throws when they do).
    teams: { enabled: authSchema.plugins.organization.teams },
    schema: authSchema.plugins.organization.schema,
  }),
  apiKey(),
  convex({ authConfig }),
  // this plugin must be last. per convex dev cli warnings
  nextCookies(),
];
