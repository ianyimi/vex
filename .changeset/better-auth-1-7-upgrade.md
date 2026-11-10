---
"@vexcms/better-auth": patch
"@vexcms/cli": patch
"create-vexcms": patch
---

Upgrade `better-auth` to 1.7.18 and `@convex-dev/better-auth` to 0.13.0. 1.6.x carries
critical GHSA-965c-763c-88jm and high GHSA-r4xp-prcw-77qf / GHSA-q84f-53jg-9ppm, fixed only
in >=1.7.7; only 0.13.0 accepts better-auth 1.7 (peer `>=1.7.16 <1.8.0`).

`betterAuthCollections()` drops the separate `mcp` and `oidcProvider` plugin descriptors —
Better Auth 1.7 removed both from `better-auth/plugins` — for one `oauthProvider` descriptor
modelling the tables `@better-auth/oauth-provider` registers (`oauthClient`,
`oauthResource`, `oauthClientResource`, `oauthClientAssertion`, `oauthAccessToken`,
`oauthConsent`, `oauthRefreshToken`). Projects using `@better-auth/mcp` enable `oauthProvider: true` — `mcp()`
composes `oauthProvider` internally and declares no tables of its own. Breaking for any
project whose `authSchema.plugins` named `mcp` or `oidcProvider` directly.

The root `getToken`-path patch is re-created against 0.13.0's `dist/nextjs/index.js`: upstream
fixed the route-handler half of get-convex/better-auth#422 in 0.12.6 (GHSA-pgx2-m66h-x29f),
but `cachedGetToken`'s own header remap was never ported, so the patch now carries only that
hunk.

`@better-auth/passkey`'s pinned override and the scaffold template's dependency pins move to
1.7.18 in lockstep.

`vex dev`/`vex deploy`/`vex generate` no longer filter the `oidc-provider` deprecation warning
while loading `vex.config.server.ts`: `@convex-dev/better-auth` 0.13.0 no longer emits it.
