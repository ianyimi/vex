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

/**
 * How old an anonymous Better Auth user (`isAnonymous: true`) may get, in
 * milliseconds, before `convex/auth/anonymousUsers.ts`'s hourly cron deletes
 * it along with its `session`, `account` and `apikey` rows. Better Auth's
 * anonymous plugin never expires users on its own, so without this purge the
 * `user` table grows without bound from scripted sign-ins.
 */
export const ANONYMOUS_USER_MAX_AGE_MS = 24 * 60 * 60 * 1000

/**
 * Maximum number of expired anonymous users `purgeExpired` deletes in one
 * cron run. The mutation reschedules itself immediately when a run fills
 * this batch, so a large backlog drains over several back-to-back runs
 * instead of one unbounded scan.
 */
export const ANONYMOUS_USER_PURGE_BATCH_SIZE = 200

/**
 * Header names the Next auth proxy (`src/auth/serverUtils.ts`'s
 * `withClientIpAttestation`) sets on every outgoing `/api/auth/*` request
 * before Better Auth forwards it to `.convex.site`, and that
 * `convex/auth/rateLimits.ts`'s `limitAuthRequest` reads on the Convex side.
 * `clientIp` carries the first `x-forwarded-for` value Vercel set; `proxySecret`
 * carries `AUTH_PROXY_SECRET`, proving the IP came from the Next proxy and
 * not a forged header on a direct `.convex.site` call.
 */
export const AUTH_RATE_LIMIT_HEADERS = {
  clientIp: "x-vex-client-ip",
  proxySecret: "x-vex-proxy-secret",
} as const

/**
 * Better Auth paths `limitAuthRequest` rate-limits per attested client IP.
 * Every other `/api/auth/*` path passes through unlimited.
 */
export const AUTH_RATE_LIMITED_PATHS = {
  anonymousSignIn: "/api/auth/sign-in/anonymous",
  emailSignUp: "/api/auth/sign-up/email",
} as const

/**
 * `authRateLimiter` limit names (`convex/auth/rateLimits.ts`). Shared with
 * `limitAuthRequest` so the path → limit-name mapping lives in one place.
 */
export const AUTH_RATE_LIMIT_NAMES = {
  anonymousSignInPerIp: "anonymousSignInPerIp",
  emailSignUpPerIp: "emailSignUpPerIp",
  globalUserCreation: "globalUserCreation",
  unattested: "unattested",
} as const
