import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs"

import { env } from "~/env.mjs"

export const {
  fetchAuthAction,
  fetchAuthMutation,
  fetchAuthQuery,
  getToken,
  handler,
  isAuthenticated,
  preloadAuthQuery,
} = convexBetterAuthNextJs({
  convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
  convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
})
