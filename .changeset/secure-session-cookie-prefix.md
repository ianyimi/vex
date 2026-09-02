---
"create-vexcms": patch
---

Fix the scaffolded `getSessionToken()` missing the session cookie in production.

Better Auth prefixes its cookies with `__Secure-` whenever the resolved
`baseURL` is https (`better-auth/dist/cookies`: the prefix is applied when
`baseURLString.startsWith("https://")`). Over http the cookie is
`better-auth.session_token`; on a real domain it is
`__Secure-better-auth.session_token`.

The template's `src/auth/serverUtils.ts` read only the bare name, so it worked
on localhost and returned `null` on every deployed site. Nothing threw and
nothing logged — `getCurrentUser()` simply resolved to `null`, the admin layout
passed `user={undefined}` across the server→client boundary, and client-side
`hasPermission` then resolved the caller through `anonRole` instead of their real
roles. The result was an admin panel that authenticated fine, rendered its shell,
and showed an empty dashboard with no collections, no globals, and no errors
anywhere.

The route gate did not catch it because it uses `getToken()` from
`@convex-dev/better-auth/nextjs`, which handles the prefix — so the server
admitted the user while the client denied them everything. `src/proxy.ts` in the
same template already read both names; only `serverUtils.ts` was wrong.

It now checks the prefixed name first and falls back to the bare one, matching
both Better Auth's own reader and the existing proxy.
