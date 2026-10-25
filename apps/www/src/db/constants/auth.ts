export const USER_ROLES = {
  admin: "admin",
  user: "user",
} as const
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

/**
 * Prefix for every Better Auth cookie this app sets (`<prefix>.session_token`,
 * or `__Secure-<prefix>.session_token` over https).
 *
 * Browsers do not isolate cookies by port, so every app on `localhost` shares
 * one cookie jar. With Better Auth's default `better-auth` prefix, another
 * Better Auth app on a different port overwrites — or, if it issues
 * `__Secure-` cookies, permanently shadows — this app's session. Keep this
 * unique per app. Read by `convex/auth/options.ts` (issuing) and by
 * `src/proxy.ts` / `src/auth/serverUtils.ts` (reading).
 */
export const AUTH_COOKIE_PREFIX = "vex-www"
