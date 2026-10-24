---
"create-vexcms": patch
---

Scaffolded apps now give Better Auth a per-project cookie prefix
(`AUTH_COOKIE_PREFIX` in `src/db/constants/auth.ts`, derived from the project
name). Browsers share one cookie jar across every `localhost` port, so another
Better Auth app's `__Secure-better-auth.session_token` was read by the proxy
first, failed verification, and bounced every sign-in back to the form until
site data was cleared. The proxy and `getSessionToken()` now read the session
with Better Auth's `getSessionCookie()` under that prefix, and the proxy expires
the `__Secure-` cookie with `secure: true` — without it browsers ignored the
delete, so a stale session cookie on https could never be cleared.

Existing projects: add `advanced: { cookiePrefix }` to `convex/auth/options.ts`
and update `src/proxy.ts` / `src/auth/serverUtils.ts` to match. Changing the
prefix signs every user out once.
